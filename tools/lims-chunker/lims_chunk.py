#!/usr/bin/env python3
"""Section-level chunker for Justice Laws LIMS XML consolidations.

Operates on the Crown-licensed XML files committed under docs/sources/
(Income Tax Act I-3.3, Income Tax Regulations C.R.C., c. 945). Produces
one JSON record per numbered section, carrying everything a corpus rule
needs to cite its authority: verbatim provision text, marginal notes,
per-subsection breakdown, the Part/Division heading chain, and the LIMS
in-force / last-amended dates that drive effectiveFrom/effectiveTo
windows.

Zero dependencies (stdlib only). Two commands:

  extract  — walk the whole instrument, write JSONL
      python3 tools/lims-chunker/lims_chunk.py extract \
          docs/sources/ita-consolidated-2026-06-14.xml -o /tmp/ita.jsonl

  get      — print one section (or one subsection) verbatim, for
             authoring Citation.excerpt fields
      python3 tools/lims-chunker/lims_chunk.py get \
          docs/sources/ita-consolidated-2026-06-14.xml 117 '(2)'

Whitespace inside provision text is normalized (runs of spaces/newlines
collapse to a single space); no other alteration is made. Reproduction
of the underlying text is under the Reproduction of Federal Law Order,
SI/97-5 — not an official version. See docs/sources/README.md.
"""

import argparse
import json
import sys
import xml.etree.ElementTree as ET

LIMS = "{http://justice.gc.ca/lims}"

# Elements whose text is metadata about a provision rather than part of
# its operative text.
NON_OPERATIVE = {"HistoricalNote", "MarginalNote"}

# Provision-level containers we break a section into, in document order.
PROVISION_TAGS = {"Subsection", "Definition"}

# Elements that flow inline with surrounding text; every other element is
# treated as a block and gets a space at its boundaries (the XML carries
# no whitespace between block elements, so "(a)" would otherwise glue to
# the text that follows it).
INLINE_TAGS = {
    "DefinedTermEn",
    "DefinedTermFr",
    "DefinitionRef",
    "XRefExternal",
    "XRefInternal",
    "Emphasis",
    "Sup",
    "Sub",
    "FootnoteRef",
    "Ins",
    "Del",
}


def _flat_text(el, skip=NON_OPERATIVE):
    """Flatten an element to normalized text, skipping listed child tags."""
    parts = []

    def walk(e):
        if e.tag in skip:
            return
        block = e.tag not in INLINE_TAGS
        if block:
            parts.append(" ")
        if e.text:
            parts.append(e.text)
        for ch in e:
            walk(ch)
            if ch.tail:
                parts.append(ch.tail)
        if block:
            parts.append(" ")

    walk(el)
    return " ".join("".join(parts).split())


def _label(el):
    lab = el.find("Label")
    return lab.text.strip() if lab is not None and lab.text else None


def _marginal_note(el):
    mn = el.find("MarginalNote")
    return _flat_text(mn, skip=set()) or None if mn is not None else None


def _lims_dates(el):
    return {
        "inforce_start": el.get(f"{LIMS}inforce-start-date"),
        "last_amended": el.get(f"{LIMS}lastAmendedDate"),
        "lims_id": el.get(f"{LIMS}id"),
    }


def _identify(root):
    """Instrument-level metadata from the Statute/Regulation root."""
    ident = root.find("Identification")
    get = lambda tag: (
        _flat_text(ident.find(tag), skip=set())
        if ident is not None and ident.find(tag) is not None
        else None
    )
    return {
        "instrument": root.tag,  # Statute | Regulation
        "short_title": get("ShortTitle"),
        "long_title": get("LongTitle"),
        "instrument_number": get("InstrumentNumber"),
        "consolidated_number": get("Chapter/ConsolidatedNumber"),
        "current_date": root.get(f"{LIMS}current-date"),
        "last_amended": root.get(f"{LIMS}lastAmendedDate"),
    }


def _walk_sections(root):
    """Yield (heading_chain, section_element) in document order.

    Heading elements carry a numeric ``level`` attribute; a heading at
    level N replaces the chain from N down.
    """
    chain = {}

    def walk(el):
        for ch in el:
            if ch.tag == "Heading":
                try:
                    lvl = int(ch.get("level", "1"))
                except ValueError:
                    lvl = 1
                chain[lvl] = _flat_text(ch, skip=set())
                for deeper in [k for k in chain if k > lvl]:
                    del chain[deeper]
            elif ch.tag == "Section":
                yield [chain[k] for k in sorted(chain)], ch
            else:
                yield from walk(ch)

    yield from walk(root)


def _provisions(sec):
    """Per-subsection / per-definition breakdown of a section.

    Subsections are taken from the section's direct children; definitions
    are collected from anywhere beneath the section (in e.g. s. 248 they
    nest inside subsection (1)) and labelled by their English defined
    term, so ``get 248 'amount'`` excerpts a single definition verbatim.
    """
    out = []
    for ch in sec:
        if ch.tag in PROVISION_TAGS:
            rec = {
                "kind": ch.tag,
                "label": _label(ch),
                "marginal_note": _marginal_note(ch),
                "text": _flat_text(ch),
            }
            rec.update({k: v for k, v in _lims_dates(ch).items() if v})
            out.append(rec)
    for d in sec.iter("Definition"):
        term = d.find(".//DefinedTermEn")
        rec = {
            "kind": "Definition",
            "label": term.text.strip() if term is not None and term.text else None,
            "marginal_note": None,
            "text": _flat_text(d),
        }
        rec.update({k: v for k, v in _lims_dates(d).items() if v})
        out.append(rec)
    return out


def _section_record(instrument_id, heading_chain, sec):
    label = _label(sec)
    hist = sec.find("HistoricalNote")
    rec = {
        "id": f"{instrument_id}:s{label}",
        "section": label,
        "marginal_note": _marginal_note(sec),
        "heading_chain": heading_chain,
        "text": _flat_text(sec),
        "provisions": _provisions(sec),
        "historical_note": _flat_text(hist, skip=set()) if hist is not None else None,
    }
    rec.update(_lims_dates(sec))
    rec["char_count"] = len(rec["text"])
    return rec


def load(xml_path):
    root = ET.parse(xml_path).getroot()
    meta = _identify(root)
    # Instrument id for section ids: the consolidated chapter number for
    # statutes (I-3.3), the instrument number for regulations (C.R.C.,c.945).
    iid = (
        meta["consolidated_number"]
        or (meta["instrument_number"] or "").replace(" ", "")
        or (meta["short_title"] or "unknown").replace(" ", "-")
    )
    return root, meta, iid


def cmd_extract(args):
    root, meta, iid = load(args.xml)
    n = 0
    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(json.dumps({"meta": meta}, ensure_ascii=False) + "\n")
        for chain, sec in _walk_sections(root):
            fh.write(
                json.dumps(_section_record(iid, chain, sec), ensure_ascii=False)
                + "\n"
            )
            n += 1
    print(f"{meta['short_title']}: {n} sections -> {args.out}", file=sys.stderr)


def cmd_get(args):
    root, meta, iid = load(args.xml)
    for chain, sec in _walk_sections(root):
        if _label(sec) != args.section:
            continue
        rec = _section_record(iid, chain, sec)
        if args.provision:
            hits = [p for p in rec["provisions"] if p["label"] == args.provision]
            if not hits:
                sys.exit(
                    f"section {args.section} has no provision labelled "
                    f"{args.provision!r}; has: "
                    + ", ".join(str(p["label"]) for p in rec["provisions"])
                )
            print(json.dumps(hits[0], ensure_ascii=False, indent=2))
        else:
            print(json.dumps(rec, ensure_ascii=False, indent=2))
        return
    sys.exit(f"no section labelled {args.section!r} in {meta['short_title']}")


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)

    ex = sub.add_parser("extract", help="write one JSONL record per section")
    ex.add_argument("xml")
    ex.add_argument("-o", "--out", required=True)
    ex.set_defaults(func=cmd_extract)

    gt = sub.add_parser("get", help="print one section or subsection verbatim")
    gt.add_argument("xml")
    gt.add_argument("section", help="section label, e.g. 117 or 118.041")
    gt.add_argument(
        "provision",
        nargs="?",
        help="optional subsection/definition label, e.g. '(2)'",
    )
    gt.set_defaults(func=cmd_get)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()

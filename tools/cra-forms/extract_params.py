#!/usr/bin/env python3
"""Extract the statutory constants CRA pre-fills into its fillable T1 forms.

CRA publishes each T1 form in three variants: standard, large-print (``-lp-``)
and fillable (``-fill-``). The fillable variant carries the year's indexed
figures — bracket thresholds, credit amounts, rates — as read-only AcroForm
field values. That makes it a primary-authority parameter source: the numbers
come from CRA's own return rather than from a secondary summary of it.

Emits one record per constant with the form, page and field path it came from,
so every value in the corpus can cite where it was read.

WHAT THIS DOES NOT DO
    It does not reproduce the forms. Only the VALUES are extracted, which are
    facts and carry no copyright even where the document does — see
    docs/reference-local/README.md for the licensing position. The source PDFs
    stay in the gitignored reference directory; their sha256 is recorded here
    so an extraction can be reproduced and audited without them being
    redistributed.

USAGE
    python3 tools/cra-forms/extract_params.py docs/reference-local/cra-t1-2025/ontario \\
        -o docs/parameters/ty2025-cra-forms.json

REQUIREMENTS
    pypdf, and cryptography (CRA encrypts the fillable variants with AES).
    The system python may have a broken cryptography build; a venv works:
        python3 -m venv .venv && .venv/bin/pip install pypdf cryptography
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from decimal import Decimal
from fractions import Fraction
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:  # pragma: no cover - dependency guidance
    sys.exit("extract_params: pypdf is required. See the module docstring.")

# 5000-* are the federal forms, common to every province's package.
# 5006-* are Ontario's; 5005-* Quebec's, and so on.
FORM_CODE = re.compile(r"^(?P<code>\d{4}-[a-z0-9]+(?:-[a-z0-9]+)?)-(?P<year>\d{2})e", re.I)
PAGE_IN_FIELD = re.compile(r"Page(\d+)")
MONEY = re.compile(r"^-?[\d,\s]+\.\d{2}$")
PERCENT = re.compile(r"^-?[\d.]+\s*%$")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def classify(raw: str) -> dict:
    """Normalise a field value into the forms the corpus consumes.

    Money becomes integer CENTS (the corpus's money representation); a
    percentage becomes an exact rational so a rate like 33.33% is never
    silently turned into a float. Anything else is passed through untouched
    rather than guessed at.
    """
    v = raw.strip()
    if MONEY.match(v):
        cents = (Decimal(v.replace(",", "").replace(" ", "")) * 100).to_integral_value()
        return {"kind": "money", "cents": str(int(cents)), "display": v}
    if PERCENT.match(v):
        pct = Decimal(v.rstrip("% ").strip())
        frac = Fraction(pct) / 100
        return {
            "kind": "rate",
            "num": str(frac.numerator),
            "den": str(frac.denominator),
            "display": v,
        }
    return {"kind": "raw", "value": v}


def form_meta(path: Path, reader: PdfReader) -> dict:
    """Form code, tax year and title, read off the filename and page 1."""
    m = FORM_CODE.match(path.name)
    code = m.group("code").upper() if m else path.stem
    year = f"20{m.group('year')}" if m else "?"
    text = (reader.pages[0].extract_text() or "").strip()
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]

    # Page 1 boilerplate varies by form: some open "T1-2025 Schedule 6",
    # others lead with the "Protected B when completed" banner, which the
    # extractor sometimes splits across lines. Drop all of it, then take the
    # first line substantial enough to be a title.
    def boilerplate(ln: str) -> bool:
        low = ln.lower()
        return (
            "protected b" in low
            or low.startswith("when completed")
            or bool(re.match(r"^T1[-\s]?\d{4}\b", ln))
            or bool(re.fullmatch(r"(19|20)\d{2}", ln))
            or bool(re.fullmatch(r"[\d\s\-–—.]+", ln))
        )

    title = next(
        (ln for ln in lines[:10] if not boilerplate(ln) and len(ln) >= 8),
        "",
    )
    return {"form": code, "taxYear": year, "title": title or path.stem}


def extract(path: Path) -> dict | None:
    reader = PdfReader(str(path))
    fields = reader.get_fields() or {}
    meta = form_meta(path, reader)
    constants = []
    for name, spec in fields.items():
        value = spec.get("/V")
        if value in (None, "", "/Off", False):
            continue
        raw = str(value).strip()
        if not raw:
            continue
        page = PAGE_IN_FIELD.search(name)
        short = re.sub(r"\[0\]", "", re.sub(r"^form1\[0\]\.", "", name))
        # /TU is the field's tooltip. CRA populates it with the form's own
        # description of the box, e.g. "Line 23500. Line 16. Old age security
        # benefits base amount." That is the only trustworthy semantic label
        # available: the pre-filled values are rendered from the form fields
        # rather than the page content stream, so they never appear in
        # extracted page text and cannot be cross-referenced against it. The
        # field NAME is provenance only and can mislead — 5000-D1 carries a
        # field named "Line34990" whose page is headed "Line 33199".
        label = spec.get("/TU")
        constants.append(
            {
                "page": int(page.group(1)) if page else None,
                "field": short,
                "label": " ".join(str(label).split()) if label else None,
                "raw": raw,
                **classify(raw),
            }
        )
    if not constants:
        return None
    constants.sort(key=lambda c: (c["page"] or 0, c["field"]))
    return {
        **meta,
        "sourceFile": path.name,
        "sourceSha256": sha256_file(path),
        "constants": constants,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("directory", help="directory of CRA form PDFs")
    ap.add_argument("-o", "--output", help="write JSON here (default: stdout)")
    ap.add_argument(
        "--all-variants",
        action="store_true",
        help="scan every PDF, not just the -fill- variants (the standard and "
        "large-print variants carry no AcroForm values, so this normally "
        "just adds scan time)",
    )
    args = ap.parse_args()

    root = Path(args.directory)
    if not root.is_dir():
        sys.exit(f"extract_params: not a directory: {root}")

    pattern = "*.pdf" if args.all_variants else "*-fill-*.pdf"
    paths = sorted(root.glob(pattern))
    if not paths:
        sys.exit(f"extract_params: no PDFs matching {pattern} in {root}")

    forms, skipped = [], []
    for p in paths:
        try:
            rec = extract(p)
        except Exception as exc:
            skipped.append({"file": p.name, "reason": f"{type(exc).__name__}: {exc}"})
            continue
        if rec:
            forms.append(rec)

    total = sum(len(f["constants"]) for f in forms)
    out = {
        "description": (
            "Statutory constants read from the read-only fields of CRA's "
            "fillable T1 forms. Values only — the forms themselves are not "
            "reproduced. Each record cites its form, page and field."
        ),
        "extractedFrom": str(root),
        "formsWithConstants": len(forms),
        "constantCount": total,
        "skipped": skipped,
        "forms": forms,
    }
    text = json.dumps(out, indent=2) + "\n"
    if args.output:
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.output).write_text(text)
        print(f"wrote {args.output}")
    else:
        print(text)
    print(f"{len(forms)} forms carried constants; {total} values extracted", file=sys.stderr)
    if skipped:
        print(f"{len(skipped)} unreadable:", file=sys.stderr)
        for s in skipped:
            print(f"  {s['file']}: {s['reason']}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())

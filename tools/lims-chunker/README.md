# lims-chunker

Section-level chunker and provision-lookup tool for the Justice Laws LIMS
XML consolidations committed under `docs/sources/`. Python 3 stdlib only.

## Why

Every corpus rule cites its authority with a verbatim excerpt and a
validity window (`docs/PROOF-FORMAT.md`). This tool makes both mechanical:
excerpts come from `get`, and validity windows start from the per-provision
`inforce_start` / `last_amended` dates LIMS stamps on each element.

## Usage

Extract one JSONL record per section (first line is instrument metadata):

```sh
python3 tools/lims-chunker/lims_chunk.py extract \
    docs/sources/ita-consolidated-2026-06-14.xml -o /tmp/ita.jsonl
```

Look up a section, subsection, or defined term verbatim while authoring:

```sh
# s. 117(2) — the rate table
python3 tools/lims-chunker/lims_chunk.py get docs/sources/ita-*.xml 117 '(2)'
# s. 122.6 definition of "eligible individual" (CCB)
python3 tools/lims-chunker/lims_chunk.py get docs/sources/ita-*.xml 122.6 'eligible individual'
# Reg 306 (exempt policies) — whole section
python3 tools/lims-chunker/lims_chunk.py get docs/sources/itr-*.xml 306
```

## Record shape

Section ids are `<chapter>:s<label>` — `I-3.3:s117`, `C.R.C.,c.945:s306`.
Each record carries: `section`, `marginal_note`, `heading_chain`
(Part/Division context), `text` (full normalized section text),
`provisions` (subsections by label plus every `Definition` labelled by its
English defined term), `historical_note`, LIMS dates, and `char_count`.

Current extraction counts: ITA 783 sections (~7.1M chars), ITR 519
sections (~2.1M chars).

## Fidelity notes

- Whitespace is normalized (runs collapse to one space); block-element
  boundaries (labels, paragraphs, formula parts) are spaced, inline
  elements (defined terms, cross-references, sub/superscripts) are not.
  No other alteration — excerpt text is otherwise verbatim.
- Marginal notes and historical notes are excluded from `text` and carried
  in their own fields.
- Output derived from these files is Crown text reproduced under SI/97-5 —
  not an official version. See `docs/sources/README.md`.

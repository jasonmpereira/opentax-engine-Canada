# docs/reference-local — held locally, never committed

Drop reference documents here: CRA form packages (T1 packages by year and
province), rate pages, payroll publications. **Everything in this directory
except this README is gitignored.**

## Why these are not in `docs/sources/`

`docs/sources/` holds the ITA and ITR consolidations, reproduced under the
Reproduction of Federal Law Order (SI/97-5). That order covers federal
**law** — statutes and regulations. It does **not** cover CRA forms and
publications, which are Crown copyright on the canada.ca terms of use.
Those terms permit non-commercial reproduction freely; this repository
ships a [commercial licence](../../COMMERCIAL-LICENSE.md). Redistributing
CRA PDFs from a commercially-licensed repo is therefore an open question,
and `docs/SOURCES-CA.md` is where it gets settled — the same treatment the
VTN textbooks and the CRA ITAM chunk set received.

Until it is settled, the documents live here and travel no further.

## What IS committed

**Parameter values extracted from these documents.** A dollar figure or a
rate is a fact, not an original work, so the values carry no copyright even
where the document does. Each extracted value is committed with a citation
naming the form and the line it came from, e.g.

    $93,454.00  OAS recovery threshold  [5000-D1 (2025), line 23500, step 16]
    14.5%       lowest federal rate     [5006-R (2025), Step 5 Part A, col. 1]

That gives every rule primary authority for its numbers without
redistributing the source PDF.

## Suggested layout

    docs/reference-local/
      cra-t1-2025/
        ontario/          # 5000-* federal forms + 5006-* Ontario forms
        alberta/          # for the CWB reconfiguration (s. 122.7)
        nunavut/          # same
        quebec/           # CWB variant + the 16.5% abatement (5005-R)
      cra-rates-2025/     # CPP YMPE/YAMPE, EI premium rates
      t4127/              # payroll deductions formulas

## Verifying a package before use

Reference documents must be the **blank published forms**, never completed
returns. Before extracting anything from a new drop, confirm no taxpayer
data is present — check that no form field carries a value other than the
statutory constants CRA pre-fills as read-only (rates, thresholds, bracket
figures). A form field holding a name, SIN, or an income amount means the
document is a prepared return and must be removed, not extracted.

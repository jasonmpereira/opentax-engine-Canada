# docs/parameters — TY2025 parameter pins from CRA forms

`ty2025-cra-forms.json` holds **116 statutory constants** read from CRA's own
2025 T1 forms, each carrying the form, page, field and CRA's own description of
the box it came from. These are primary authority for the indexed figures the
Phase 2 rules will encode, replacing the search-snippet evidence recorded in
[`../research/m0/cra-parameter-pins.md`](../research/m0/cra-parameter-pins.md).

## Where the numbers come from

CRA publishes each T1 form in three variants: standard, large-print (`-lp-`)
and fillable (`-fill-`). **The fillable variant carries the year's indexed
figures as read-only AcroForm field values** — bracket thresholds, credit
amounts, rates — because the form computes with them. That makes it a better
source than any secondary summary: the numbers come from the return itself.

Extracted with [`tools/cra-forms/extract_params.py`](../../tools/cra-forms/extract_params.py):

```sh
python3 tools/cra-forms/extract_params.py \
    docs/reference-local/cra-t1-2025/ontario \
    -o docs/parameters/ty2025-cra-forms.json
```

Source: the CRA 2025 T1 package for Ontario (English), received 2026-07-29.
The `5000-*` forms are **federal and identical in every province's package**;
the `5006-*` forms are Ontario's and are recorded for Phase 7, not used by the
federal corpus. Each record carries the sha256 of the PDF it came from, so an
extraction is reproducible and auditable without the PDFs being redistributed.

## Licensing: values, not documents

The PDFs are Crown copyright on the canada.ca terms of use — a different
licence from the SI/97-5 order covering the ITA/ITR consolidations in
`docs/sources/`, and this repo ships a commercial licence. So the documents
stay in gitignored `docs/reference-local/` and **only the values are
committed**. A dollar figure or a rate is a fact, not an original work, and
carries no copyright even where the document does. See
[`../reference-local/README.md`](../reference-local/README.md).

## Reading a record

```json
{
  "page": 3,
  "field": "Page3.Line30000.Line1.Line1_Amount",
  "label": "Line 30000. Line 1. Base amount.",
  "raw": " 14,538.00",
  "kind": "money",
  "cents": "1453800",
  "display": " 14,538.00"
}
```

`label` is CRA's field tooltip and is **the only trustworthy semantic
description**. The pre-filled values are rendered from form fields rather than
the page content stream, so they never appear in extracted page text and cannot
be cross-checked against it; and the field *name* can mislead — 5000-D1 carries
a field named `Line34990` sitting on a page headed "Line 33199". Trust `label`,
treat `field` as provenance.

Money is normalised to integer **cents**; rates to an exact **rational**
(`14.5%` → `29/200`), never a float.

## What is confirmed by arithmetic

Two groups are self-validating, and
[`packages/corpus-ca-federal/test/cra-params.test.ts`](../../packages/corpus-ca-federal/test/cra-params.test.ts)
enforces both on every test run.

**The federal bracket table** (5006-R, Step 5 Part A). CRA prints a threshold,
a rate and the cumulative tax for each band — three redundant columns, so the
cumulative is derivable from the other two. All five bands reconcile to the
cent:

| Threshold | Rate | Cumulative tax |
|---|---|---|
| $0 | **14.5%** | $0.00 |
| $57,375 | 20.5% | $8,319.38 |
| $114,750 | 26% | $20,081.25 |
| $177,882 | 29% | $36,495.57 |
| $253,414 | 33% | $58,399.85 |

**This settles the blended-rate trap.** The consolidated ITA s. 117(2)(a) reads
14% under the marginal note "Rates for taxation years after 2024", but TY2025 is
administered at a blended **14.5%** because Bill C-4's cut took effect mid-year.
Encoding the statute as written gives the wrong answer. CRA's own return settles
it, and the arithmetic proves it independently: $57,375 × 14.5% = $8,319.375 →
$8,319.38, exactly as printed. At 14% it would be $8,032.50; at 15%, $8,606.25.

**The basic personal amount.** The worksheet gives base $14,538 + supplement
$1,591 = **$16,129** maximum, deriving both ends of the range rather than taking
them from a secondary source.

Everything else is recorded with its CRA label but **has not been independently
cross-checked** — treat a label as a strong hint, and confirm against the
printed form before a rule depends on it.

## Selected federal parameters

Full detail in the JSON; this is the orientation map.

| Feeds | Value(s) | Source |
|---|---|---|
| lowest rate / appropriate percentage | 14.5% (TY2025 blend) | 5006-R Step 5 Part A |
| bracket thresholds | 57,375 / 114,750 / 177,882 / 253,414 | 5006-R Step 5 Part A |
| basic personal amount | 14,538 base + 1,591 supplement; threshold 177,882 | 5000-D1 line 30000 |
| age amount | 9,028 max; 45,522 threshold; 15% | 5000-D1 line 30100 |
| OAS recovery tax | 93,454 base amount | 5000-D1 line 23500 |
| disability amount | 10,138 base; 5,914 supplement; 3,464 threshold | 5000-D1 lines 31600 / 31800 |
| **top-up tax credit (NEW 2025)** | 8,319.38; 3.45% | 5000-D1 line 34990 |
| dividend gross-up | 138% eligible / 115% non-eligible | 5000-D1 lines 12000–12010 |
| capital gains inclusion | 50% | 5000-S3 line 23 |
| donations top tranche | 253,414 threshold | 5000-S9 line 18 |
| Canada caregiver | 28,798 base | 5000-S5 lines 30425 / 30450 |
| CWB | 3,000 base, 27%, 15%; disability 1,150, 27% | 5000-S6 |
| EI maximum insurable earnings | 65,700 | 5000-S13 line 5 |
| medical expense supplement | 33,294 threshold; 25%; 5% | 5000-D1 line 45200 |
| federal political contributions | 400/75%, 750/50%, 33.33% tiers | 5000-D1 line 41000 |

The CWB figures are the **standard** reconfiguration. Alberta, Quebec and
Nunavut differ under s. 122.7 and their amounts are in those provinces'
packages, which we do not hold — `rules/cwb.ts` must refuse for AB/NU/QC rather
than apply these.

## Still missing

Not present in any T1 package, still needed:

- **CPP** contribution rates, YMPE and YAMPE (Schedule 8 references them; the
  amounts live on a CRA rates page)
- **T4127** payroll deductions formulas
- **AB / NU / QC** packages — CWB reconfigurations and the Quebec abatement
- The **indexation adjustment page** — not required for the values above, but
  it states the 2.7% factor and would let s. 117.1 indexation be verified
  rather than taken as given

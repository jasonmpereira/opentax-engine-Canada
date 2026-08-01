# Sourcing manifest — documents still needed

Every item the corpus currently refuses on for want of a document, with the
exact name, code and publisher so it can be searched for and retrieved.

Status as of 2026-07-29. Maintained alongside
[`../../parameters/README.md`](../../parameters/README.md), which records what
has already been pinned.

**Before sourcing anything on this list, read §5.** Two items can be retrieved
without leaving this environment, and one item on the "missing" list turned out
not to exist as a published document at all.

---

## 1. CRA T1 packages — provincial variants

The `5000-*` federal forms are identical in every province's package, so the
Ontario package already delivered covers the federal corpus. What differs is
the CWB, and only for three provinces.

CRA's package numbering is `50NN`, one per jurisdiction: `5005` Quebec,
`5006` Ontario (held), `5009` Alberta, `5014` Nunavut.

### 1a. Minimum needed — Schedule 6 only

| Document | Code | Publisher | Unblocks |
|---|---|---|---|
| Schedule 6 – Canada Workers Benefit (for AB only) | **5009-S6** | CRA | `cwb.ts` for Alberta |
| Schedule 6 – Canada Workers Benefit (for NU only) | **5014-S6** | CRA | `cwb.ts` for Nunavut |
| Schedule 6 – Canada Workers Benefit (for QC only) | **5005-S6** | CRA | `cwb.ts` for Quebec |

Ask for the **2025 tax year**, **English**, and the **fillable** variant where
a choice is offered — file names look like `5009-s6-fill-25e.pdf`. The
fillable variant matters: CRA pre-fills the reconfigured amounts as read-only
form fields, which is how `tools/cra-forms/extract_params.py` reads them. The
standard variant carries the same figures in prose but is harder to extract.

Search terms that find these: `CRA 5009-S6 2025`, `Schedule 6 Canada Workers
Benefit Alberta 2025`. The standard form is titled *"Schedule 6 – Canada
Workers Benefit (for all except QC, AB, and NU)"*, which is the giveaway that
the three variants exist.

### 1b. Also useful — the full Quebec package

| Document | Code | Publisher | Unblocks |
|---|---|---|---|
| Income Tax and Benefit Return (Quebec) | **5005-R** | CRA | prints the 16.5% abatement at line 44000 |
| Federal Worksheet (Quebec) | **5005-D1** | CRA | the abatement's working chart |
| Tax Calculation Supplementary – Multiple Jurisdictions | **T2203** | CRA | the abatement where a filer has a permanent establishment outside Quebec |

The literal figure **16.5%** appears nowhere in the Ontario package — it is
printed only on the Quebec forms. See §3 for why the rate is nonetheless
already established from statute.

---

## 2. CRA parameter and payroll publications

| Document | Code | Publisher | Unblocks |
|---|---|---|---|
| Payroll Deductions Formulas | **T4127** | CRA | cross-check of CPP/EI arithmetic; the computed-rate reference |
| Payroll Deductions Tables | **T4032** | CRA | lookup-table cross-check (T4127 is the better of the two for an engine) |
| Indexation adjustment for personal income tax and benefit amounts | (web page, no code) | CRA | the annual indexation factor; needed to verify s. 117.1 rather than take indexed results as given |

Ask for the **2025** editions. T4127 is published twice a year (January and
July effective dates) — for TY2025 the **July 2025** edition is the one that
reflects the Bill C-4 mid-year rate change.

### For TY2026 (not yet needed, but it is what unblocks the 2026 rules)

The corpus deliberately **refuses** for TY2026 rather than reusing 2025's
thresholds. Closing that needs the **2026** editions of the indexation
adjustment page and the T1 package (`5006-R` etc. for the 2026 tax year).

---

## 3. Federal statutes — RETRIEVABLE HERE, no search needed

These are on the Justice Canada GitHub mirror, which this environment can
reach even though `laws-lois.justice.gc.ca` and `canada.ca` cannot.

| Instrument | Chapter | Mirror path | Unblocks |
|---|---|---|---|
| Federal-Provincial Fiscal Arrangements Act | **F-8** | `eng/acts/F-8.xml` | `quebec-abatement.ts` — ss. 26-27 carry the abatement |
| Canada Pension Plan | **C-8** | `eng/acts/C-8.xml` | already used for Schedule 8 rates; not yet committed |

**Do not commission a search for these.** Retrieval is:

```sh
git clone --filter=blob:none --sparse --depth 1 \
    https://github.com/justicecanada/laws-lois-xml.git
git -C laws-lois-xml cat-file -p HEAD:eng/acts/F-8.xml > f-8.xml
```

What is outstanding is a *decision*, not a document: whether to commit F-8 and
C-8 into `docs/sources/` alongside the ITA and ITR. Until they are committed, a
`Citation` pointing at them has no primary source behind it, which this corpus
does not permit — which is why the Quebec abatement still refuses even though
its rate is now known.

The 16.5% itself is **already established** and needs no further sourcing:
ITA s. 120(2) gives 3%, and FPFAA s. 26 defines "tax abatement" as precisely
that percentage figure, which s. 27(1) increases by both following unit
numbers — 8.5 (s. 27(2)) and 5 (s. 27(3)). 3 + 8.5 + 5 = 16.5.

---

## 4. Not a document problem

Listed so nobody spends effort searching for something that will not be found.

**AB/QC/NU Canada Workers Benefit amounts — no published legal instrument
exists.** ITA s. 122.71 lets the Minister of Finance "enter into an agreement
with the government of a province" replacing the s. 122.7(2) and (3) amounts.
That is an agreement power, not a regulation-making power: the substituted
amounts are never registered as a statutory instrument, appear in no
consolidation, and the Income Tax Regulations contain zero references to
s. 122.7. **No future consolidation will ever carry them.** The only routes are
the CRA forms in §1a, or an ATIP request to Finance Canada for the agreement
texts. The forms are the practical route.

**Alternative minimum tax (ss. 127.5-127.55).** Not blocked on a document —
the statute is in hand and decision D2 puts it in scope. It is unwritten code.
Its TY2025 exemption and rate should be confirmed against **T691 (Alternative
Minimum Tax)** when that form is sourced, but the work is authoring, not
sourcing.

**Child care (s. 63), capital losses, the 75% donation limit.** Same — statute
in hand, rules unwritten.

---

## 5. Fastest path, in order

1. **Nothing needed** — commit F-8 and C-8 from the mirror (a decision, ~10
   minutes of work here).
2. **Three small PDFs** — `5009-S6`, `5014-S6`, `5005-S6`, 2025, English,
   fillable. Closes the CWB for the whole country.
3. **One web page** — the 2025 indexation adjustment. Lets s. 117.1 be
   verified rather than assumed.
4. **One PDF** — T4127 (July 2025). Cross-checks CPP and EI arithmetic.
5. **Optional** — the full Quebec package (`5005-R`, `5005-D1`, `T2203`) if
   the abatement is wanted end to end rather than statute-only.

Drop retrieved files into
`docs/reference-local/cra-t1-2025/{alberta,nunavut,quebec}/` and the rest into
`docs/reference-local/cra-rates-2025/`. Everything there is gitignored;
`tools/cra-forms/extract_params.py` reads the fillable forms unchanged.

**Blank published forms only** — never a completed return. See
[`../../reference-local/README.md`](../../reference-local/README.md) for the
check to run on a new drop.

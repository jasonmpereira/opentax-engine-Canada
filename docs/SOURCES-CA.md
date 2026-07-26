# SOURCES-CA.md — Canadian Source Registry

## Purpose

This file is the single registry for the interpretation resources (~70 expected,
pending Jason's handover) that inform the Canadian T1 + benefits conversion.
Every statute consolidation, CRA Folio/IT/IC, guide, worksheet, court decision,
and commercial reference used to justify a calculation rule must be cataloged
here before it is cited in code, fixtures, or the corpus. The registry records
each resource's provenance, copyright status, whether its text may ever be
excerpted into this repository, and its tier in the validation hierarchy. The
table below is the frame; population is blocked on the handover.

## Classification rules (per CANADA-CONVERSION.md, Phase 5)

- **Tier 1 — oracle**: clears the full Phase 5 bar (scriptable, per-component
  comparable, pinned). Joins the harness; every scenario runs through it.
  Currently: PolicyEngine Canada (pinned commit
  `389648ad24131ed958d7bb6f514d56199b129e5c`; benefits side sound, T1 total
  structurally broken — comparisons are per-component only) and CTaCS
  (provisional, contact pending).
- **Tier 2 — anchor**: authoritative but not scriptable. NETFILE-certified
  software (TaxCycle, Profile, DT Max, Wealthsimple Tax), CRA PDOC, CRA's own
  worksheets. Used for hand-worked golden fixtures and as tiebreakers when
  oracles disagree with us.
- **Tier 3 — authority**: adjudicates, never computes. The ITA text, CRA
  Folios/ITs/ICs/guides, court decisions. These decide who is *right* in a
  triaged difference; they never generate expected values at scale.

## Compliance columns (Banshee H5)

Every row must fill all of the following:

| Column | Meaning |
|---|---|
| `id` | Stable short identifier, unique in this file (e.g. `folio-s1-f1-c1`). |
| `title` | Full title of the resource. |
| `publisher` | Publisher / provenance (CRA, Justice Laws, court, commercial publisher, academic, etc.). |
| `type` | One of: Folio, IT, IC, guide, statute consolidation, worksheet, court decision, commercial. |
| `copyright` | **Crown** or **commercial** copyright status. |
| `excerpt-permitted` | Crown works: **yes**, with attribution; statutes/regulations additionally require the SI/97-5 "not an official version" notice. Commercial-publisher works: **NO** — cite only, never excerpt, never commit any text. |
| `revision-date` | Date of the version consulted (consolidation/current-to date, publication date, or decision date). |
| `topics` | Comma-separated topics the resource informs (e.g. `capital-gains`, `bpa`, `cpp2`, `amt`, `ccb`). |
| `tier` | 1 (oracle), 2 (anchor), or 3 (authority). |

## Registry

| id | title | publisher | type | copyright | excerpt-permitted | revision-date | topics | tier |
|---|---|---|---|---|---|---|---|---|
| folio-s1-f1-c1 | Income Tax Folio S1-F1-C1, Medical Expense Tax Credit | CRA | Folio | Crown | yes (attribution required) | EXAMPLE — verify on population | medical-expenses, credits | 3 |
| ita-consolidation | Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.) — consolidated | Justice Laws (Department of Justice Canada) | statute consolidation | Crown | yes (attribution + SI/97-5 "not an official version" notice) | EXAMPLE — verify on population | all | 3 |
| ey-tax-guide | EY's Complete Guide to the T1 (example commercial reference) | EY / commercial publisher | commercial | commercial | **NO — cite only, never excerpt, never commit** | EXAMPLE — verify on population | t1-general | 3 |

The three rows above are format examples only; replace or verify them during
population.

## Standing rule (Banshee H5, veto-backed)

> **Zero commercial-publisher text may be reproduced in the corpus or committed
> to this repository (Banshee H5, veto-backed). Corpus tooling must refuse
> excerpts from non-permitted sources.**

This applies to every commercial-copyright row regardless of tier. Crown works
may be excerpted only with attribution, and statutes/regulations only with the
SI/97-5 "not an official version" notice.

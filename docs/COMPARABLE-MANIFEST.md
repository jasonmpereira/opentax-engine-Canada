# Comparable Manifest (FROZEN at M1-V kickoff)

**Status: DRAFT — this manifest freezes at M1-V kickoff.** Until then it may be edited freely. After freeze, the amendment rule below governs all changes.

Per Apocalypse Ch.2 (adopted): this manifest declares, **before any differential harness runs**, exactly which components will be differentially compared against which oracle, over which scenario axes. Anything not listed as a comparable is validated by fixtures only. This prevents post-hoc cherry-picking of comparisons.

Oracle baseline: PolicyEngine Canada, vendored at `harness/vendor/policyengine-canada`, pinned to commit `389648ad24131ed958d7bb6f514d56199b129e5c`. PE-Canada's benefits side is sound; its T1 total is structurally broken, so **all T1 comparisons are per-component**, never end-to-end. CTaCS (pending contact) and blamario/canadian-income-tax (provisional GO-WAIT) may be added as oracles later — additions are always permitted.

## Differential comparables vs PE-Canada

Variable names verified by reading the vendored clone at `harness/vendor/policyengine-canada/policyengine_canada/variables/gov/cra/`.

| # | Component | Comparison semantics | PE-Canada variable | Scenario axes | Milestone |
|---|-----------|----------------------|--------------------|---------------|-----------|
| C1 | Federal brackets on a given base (tax before credits) | Feed both engines the same taxable-income base; compare schedule output only (isolates PE-Canada's broken income-assembly) | `income_tax_before_credits` (schedule `gov.cra.tax.income.income_tax_schedule`) | taxable income sweep $0–$400k incl. bracket edges $57,375 / $114,750 / $177,882 / $253,414; TY2025 blended 14.5% lowest rate | M1 |
| C2 | Basic personal amount, incl. phase-out $16,129 → $14,538 | Compare BPA amount (base + supplement) at given net income | `basic_personal_amount` + `basic_personal_amount_supplement` | net income sweep across the phase-out band ($177,882–$253,414) and beyond | M1 |
| C3 | OAS repayment (clawback) | Compare repayment amount at given net income and OAS received | `oas_repayment` (context: `oas_pre_repayment`, `oas_net`) | net income sweep around the recovery threshold; OAS amount fixed/varied; age 65–74 vs 75+ | M1 |
| C4 | Canada Workers Benefit (CWB) | Compare benefit amount for given working income / family net income | `canada_workers_benefit` (inputs: `working_income`, `family_working_income`) | single vs family; working income sweep; with/without disability supplement; dependants 0–3 | M1 |
| C5 | Canada Child Benefit (CCB) | Compare benefit for given family net income and children | `child_benefit` (inputs: `child_benefit_base`, `child_benefit_reduction`, `family_net_income`) | children count/ages; family net income sweep across both reduction tiers | M2 |
| C6 | GST/HST credit | Compare credit for given adjusted family net income and household | `gst_credit` (components: `gst_credit_base`, `gst_credit_reduction`, `gst_credit_singles_boost`) | single / couple / single parent; children 0–4; income sweep across phase-in and reduction | M2 |

## Fixture-only components (no differential oracle)

These are validated by hand-built fixtures (CRA forms, worksheets, published examples) only — either PE-Canada does not model them, models them at the broken assembly level, or its structure is not comparable:

- Eligible/non-eligible dividend gross-up and dividend tax credit
- CPP / CPP2 / EI contributions and credits (YMPE $71,300, YAMPE $81,200)
- Tuition credit
- Medical expense credit
- Charitable donations credit
- Spousal/common-law partner amount
- Pension income credit
- Alternative minimum tax (20.5% rate, $177,882 exemption)
- Top-up credit (citation pinning in progress)
- Quebec abatement
- Section 3 assembly of income through to line 42000 (basic federal tax / net federal tax chain)

## Amendment rule

Any removal of a comparable after this manifest freezes is disclosed in REPORT.md as a removal. Additions are always permitted.

## Addendum 2026-07-26 — blamario elevated to second differential oracle

CTaCS was dropped by decision (no outreach). blamario/canadian-income-tax
(pin `ab245863c9bb`, Hackage 2025.1, GPL-3.0-or-later, process-separated
external program) is elevated from provisional to the second differential
oracle. Planned blamario comparables (additions are always permitted under
the amendment rule): **full-return T1 line 42000 assembly** plus per-line
checks on completed T1/schedule fields — this is the check on pipeline
wiring that per-component PE-Canada comparisons structurally cannot
provide (Apocalypse challenge 1 mitigation). Exact line list to be fixed
when this manifest freezes at M1-V kickoff. blamario carries no EULA
restriction on automated use or published comparisons (GPL); it is not
CRA-verified and remains a corroborating oracle, not an authority —
fixtures worked from CRA worksheets stay primary per D10.

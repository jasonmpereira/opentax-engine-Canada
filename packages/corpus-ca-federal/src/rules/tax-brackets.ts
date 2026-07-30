/**
 * Federal tax on taxable income — ITA s. 117(2), indexed under s. 117.1.
 * T1 Step 5, Part A. This is tax BEFORE any credit.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  WHY TY2025's LOWEST RATE IS 14.5% AND NOT THE 14% THE STATUTE READS
 * ─────────────────────────────────────────────────────────────────────────
 * Read s. 117(2)(a) in the consolidation this corpus pins (current to
 * 2026-06-14) and it says 14%, under the marginal note "Rates for taxation
 * years after 2024". Encoding that for TY2025 gives the WRONG answer.
 *
 * Bill C-4 cut the lowest rate from 15% to 14%, but the cut took effect on
 * 1 July 2025 — part-way through the taxation year. For TY2025 CRA therefore
 * administers a BLENDED rate of 14.5% (15% for January–June, 14% for
 * July–December). The blend lives in the Act's coming-into-force provision,
 * not in the s. 117(2) text, so a consolidated reading cannot see it. This is
 * the single easiest way to get TY2025 materially wrong, and it propagates:
 * s. 248(1) defines "appropriate percentage" as the lowest s. 117(2) rate, so
 * every s. 118 credit inherits the same 14.5% for 2025.
 *
 * The blend is confirmed on primary authority, two independent ways:
 *   1. CRA's own return, 5006-R Step 5 Part A, prints 14.5% for column 1.
 *   2. The same page prints $8,319.38 as the tax at the top of the first
 *      band, and 57,375 x 14.5% = 8,319.375 -> 8,319.38 exactly. At 14% it
 *      would be 8,032.50; at 15%, 8,606.25. Neither fits.
 * Both are pinned in docs/parameters/ty2025-cra-forms.json and enforced by
 * packages/corpus-ca-federal/test/cra-params.test.ts.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  VERSIONING
 * ─────────────────────────────────────────────────────────────────────────
 * One rule version per taxation year, selected by the half-open validity
 * window [effectiveFrom, effectiveTo). Only TY2025 is encoded: its thresholds
 * are pinned to CRA's return. TY2026 thresholds are indexed under s. 117.1 and
 * are NOT yet published to us, so no TY2026 version exists — a 2026 evaluation
 * finds no applicable rule and refuses, which is correct. Inventing indexed
 * thresholds would be exactly the failure this engine exists to prevent.
 *
 * Thresholds are LOWER bounds in cents; the engine's `brackets` node reads the
 * table that way, which removes any inclusive/exclusive ambiguity at the
 * boundaries.
 */

import type { BracketRow, Expr, Rule } from "@invaro/opentax-core";

const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });

/** Dollars -> cents, as the decimal string the IR expects. */
const c = (dollars: number): string => String(BigInt(dollars) * 100n);

/**
 * TY2025 rate table — 5006-R (2025) Step 5, Part A, columns 1-5.
 * Thresholds: docs/parameters/ty2025-cra-forms.json (primary authority).
 * Rate on the first band is the Bill C-4 blend; see the header note.
 */
const TY2025_TABLE: BracketRow[] = [
  { threshold: c(0), rate: { num: "145", den: "1000" } }, // 14.5% blended
  { threshold: c(57375), rate: { num: "205", den: "1000" } }, // 20.5%
  { threshold: c(114750), rate: { num: "26", den: "100" } }, // 26%
  { threshold: c(177882), rate: { num: "29", den: "100" } }, // 29%
  { threshold: c(253414), rate: { num: "33", den: "100" } }, // 33%
];

export const taxBracketRules: Rule[] = [
  {
    id: "ca.federal.tax_before_credits",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Federal tax on taxable income, TY2025 (Step 5 Part A)",
    citation: {
      source:
        "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 117(2), as amended by Bill C-4; rates and thresholds per CRA form 5006-R (2025) Step 5 Part A",
      section: "s. 117(2)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-117.html",
      excerpt:
        "The tax payable under this Part by an individual on the individual's taxable income or taxable income earned in Canada, as the case may be (in this Subdivision referred to as the \"amount taxable\") for a taxation year is (a) 14% of the amount taxable, if the amount taxable is equal to or less than the amount determined for the taxation year in respect of $57,375; (b) if the amount taxable is greater than $57,375, but is equal to or less than $114,750, the maximum amount determinable in respect of the taxation year under paragraph (a), plus 20.5% of the amount by which the amount taxable exceeds $57,375 for the year… [NOTE: the 14% in paragraph (a) is the post-Bill C-4 rate as consolidated; TY2025 is administered at the blended 14.5% because the cut took effect 1 July 2025 — see the file header and CRA form 5006-R Step 5 Part A.]",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01", // TY2025 only; TY2026 thresholds are not yet pinned
    output: { type: "money" },
    formula: {
      kind: "brackets",
      base: rule("ca.federal.taxable_income"),
      table: TY2025_TABLE,
      // EXACT accumulation, not the engine default. CRA's Step 5 Part A
      // prints a cumulative tax figure at each threshold, and those figures
      // are built from unrounded arithmetic: $8,319.38 / $20,081.25 /
      // $36,495.57 / $58,399.85. Rounding each band to the cent before
      // summing reproduces only the first of the four, because 14.5% of
      // $57,375 is exactly half a cent and rounds up before being carried
      // into the bands above it. Exact accumulation reproduces all four.
      accumulate: "exact",
    },
  },
];

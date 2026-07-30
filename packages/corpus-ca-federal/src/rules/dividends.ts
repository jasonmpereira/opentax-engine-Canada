/**
 * Taxable amount of dividends from taxable Canadian corporations — ITA
 * s. 82(1)(b). T1 lines 12000 (total taxable) and 12010 (non-eligible).
 *
 * The facts hold the ACTUAL dividends received (the T5 box amounts). What
 * enters income is the grossed-up amount: the actual dividend PLUS a
 * statutory percentage of it. The gross-up notionally restores the corporate
 * tax already paid, which the s. 121 dividend tax credit then returns —
 * that credit is a separate rule file and is NOT applied here.
 *
 *   eligible      actual x 138%  (100% + the 38% gross-up)
 *   non-eligible  actual x 115%  (100% + the 15% gross-up)
 *
 * Both percentages are statutory and carry no indexation, so these rules are
 * open-ended rather than year-versioned. The percentages are on their face in
 * s. 82(1)(b) and are independently confirmed by CRA's Federal Worksheet
 * (5000-D1, lines 12000/12010), which prints the combined 138% and 115%.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });

const CITE = {
  source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 82(1)(b)",
  section: "s. 82(1)(b)",
  url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-82.html",
};

export const dividendRules: Rule[] = [
  {
    id: "ca.federal.taxable_eligible_dividends",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Taxable amount of eligible dividends (38% gross-up)",
    citation: {
      ...CITE,
      excerpt:
        "…(ii) the product of the amount determined under paragraph (a.1) in respect of the taxpayer for the taxation year multiplied by … (D) for taxation years that end after 2011, 38%",
    },
    effectiveFrom: "2012-01-01", // s. 82(1)(b)(ii)(D): taxation years ending after 2011
    output: { type: "money" },
    // 138% of the actual dividend = the dividend plus the 38% gross-up.
    formula: {
      kind: "mulRate",
      base: fact("eligibleDividends"),
      rate: { num: "138", den: "100" },
      round: "half-up",
    },
  },
  {
    id: "ca.federal.taxable_non_eligible_dividends",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Taxable amount of non-eligible dividends (15% gross-up)",
    citation: {
      ...CITE,
      excerpt:
        "…(i) the product of the amount determined under paragraph (a) in respect of the taxpayer for the taxation year multiplied by … (B) for taxation years after 2018, 15%",
    },
    effectiveFrom: "2019-01-01", // s. 82(1)(b)(i)(B): taxation years after 2018
    output: { type: "money" },
    formula: {
      kind: "mulRate",
      base: fact("nonEligibleDividends"),
      rate: { num: "115", den: "100" },
      round: "half-up",
    },
  },
  {
    id: "ca.federal.taxable_dividends",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Taxable amount of dividends from taxable Canadian corporations (line 12000)",
    citation: {
      ...CITE,
      excerpt:
        "…if the taxpayer is an individual, other than a trust that is a registered charity, the total of (i) [the non-eligible gross-up] and (ii) [the eligible gross-up]",
    },
    effectiveFrom: "2019-01-01",
    output: { type: "money" },
    formula: {
      kind: "add",
      args: [
        rule("ca.federal.taxable_eligible_dividends"),
        rule("ca.federal.taxable_non_eligible_dividends"),
      ],
    },
  },
];

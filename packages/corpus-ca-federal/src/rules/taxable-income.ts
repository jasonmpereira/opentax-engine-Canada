/**
 * Net income (T1 line 23600) and taxable income (line 26000) — ITA ss. 3(c),
 * 3(d) and Division C.
 *
 * s. 3 is an ordering provision. Net income is the paragraph (c) figure: the
 * total of the (a) sources plus the (b) taxable-capital-gains amount, less the
 * Subdivision E deductions. Taxable income is then net income less the
 * Division C deductions (s. 2(2)).
 *
 * Both subtractions floor at zero. That is not a convenience: s. 3(c) and (d)
 * are each written as "the amount, if any, by which X exceeds Y", which yields
 * nil rather than a negative when Y is the larger. Losses are carried under
 * their own provisions (s. 111), which this corpus does not model.
 *
 * DIVISION C is empty in v1. Nothing in the current fact catalogue feeds it,
 * so taxable income equals net income for every return this corpus can
 * currently answer. The deferred Division C amounts — the s. 110.6 capital
 * gains exemption, s. 110(1)(d) stock option deduction, s. 111 loss
 * carryovers, s. 110(1)(f) exempt income — are recorded as a refusing rule so
 * the omission is visible rather than implied by silence.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });

export const taxableIncomeRules: Rule[] = [
  {
    id: "ca.federal.net_income",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Net income (line 23600)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 3(c)",
      section: "s. 3(c)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-3.html",
      excerpt:
        "…(c) determine the amount, if any, by which the total determined under paragraph (a) plus the amount determined under paragraph (b) exceeds the total of the deductions permitted by Subdivision E in computing the taxpayer's income for the year (except to the extent that those deductions, if any, have been taken into account in determining the total referred to in paragraph (a)…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // "the amount, if any, by which … exceeds …" — nil, never negative.
    formula: {
      kind: "max0",
      arg: {
        kind: "sub",
        left: rule("ca.federal.total_income"),
        right: rule("ca.federal.total_deductions"),
      },
    },
  },
  {
    id: "ca.federal.division_c_deductions",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Division C deductions — none modelled in v1",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), Division C, ss. 110–114.2",
      section: "Division C",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-110.html",
      excerpt:
        "For the purpose of computing the taxable income of a taxpayer for a taxation year, there may be deducted such of the following amounts as are applicable…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // Zero, not a refusal: no fact in the catalogue can produce a Division C
    // amount, so there is nothing a taxpayer could enter that this silently
    // drops. When a Division C fact is added, this becomes a real computation
    // and the omission stops being safe.
    formula: { kind: "money", cents: "0" },
  },
  {
    id: "ca.federal.taxable_income",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Taxable income (line 26000)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 2(2)",
      section: "s. 2(2)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-2.html",
      excerpt:
        "The taxable income of a taxpayer for a taxation year is the taxpayer's income for the year plus the additions and minus the deductions permitted by Division C.",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: {
      kind: "max0",
      arg: {
        kind: "sub",
        left: rule("ca.federal.net_income"),
        right: rule("ca.federal.division_c_deductions"),
      },
    },
  },
];

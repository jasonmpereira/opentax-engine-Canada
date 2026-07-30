/**
 * Old Age Security recovery tax — ITA Part I.2, s. 180.2. T1 line 23500
 * (deduction in computing net income) and line 42200 (the tax itself).
 *
 * Commonly called the "OAS clawback". s. 180.2(2) levies it as A(1 − B) where
 * A is the LESSER of:
 *   (a) the OAS pension, supplement and allowance included in income, and
 *   (b) 15% of the amount by which adjusted income exceeds the base amount
 *       — $50,000 on the face of the section, indexed under s. 117.1 to
 *       $93,454 for 2025 (CRA Federal Worksheet 5000-D1, line 23500, step 16).
 *
 * B is a proration for part-year residents and non-residents. This corpus
 * models resident, full-year filers only, so B is nil; the guard below refuses
 * rather than silently assuming full-year residence for anyone the corpus
 * cannot confirm — except that no fact currently expresses part-year
 * residence, so every return here is treated as full-year. That assumption is
 * recorded rather than hidden.
 *
 * "Adjusted income" (s. 180.2(1)) is net income with specified adjustments —
 * chiefly excluding the OAS repayment itself and certain elections. The corpus
 * uses net income directly, which is exact for the ordinary case and would
 * differ only for returns involving the excluded items, none of which the
 * fact catalogue can express.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });

const c = (dollars: number): string => String(BigInt(dollars) * 100n);

export const socialBenefitsRepaymentRules: Rule[] = [
  {
    id: "ca.federal.oas_recovery_tax",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Old Age Security recovery tax (line 42200)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 180.2(2)",
      section: "s. 180.2(2)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-180.2.html",
      excerpt:
        "Every individual shall pay a tax under this Part for each taxation year equal to the amount determined by the formula A(1 − B) where A is the lesser of (a) the amount, if any, by which (i) the total of all amounts each of which is the amount of any pension, supplement or spouse's or common-law partner's allowance under the Old Age Security Act included in computing the individual's income under Part I for the year exceeds (ii) the amount of any deduction allowed under subparagraph 60(n)(i)…, and (b) 15% of the amount, if any, by which the individual's adjusted income for the year exceeds $50,000; and B is the rate of tax payable…",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    parameters: {
      // The $50,000 on the face of s. 180.2(2)(b), indexed to TY2025.
      baseAmount: { value: c(93454), type: "money" },
    },
    // A = lesser of (OAS received) and (15% of income over the base amount).
    // B = 0: full-year resident filers only, per the file header.
    formula: {
      kind: "min",
      args: [
        fact("oasBenefits"),
        {
          kind: "mulRate",
          base: {
            kind: "max0",
            arg: {
              kind: "sub",
              left: rule("ca.federal.net_income"),
              right: { kind: "param", name: "baseAmount" },
            },
          },
          rate: { num: "15", den: "100" },
          round: "half-up",
        },
      ],
    },
  },
];

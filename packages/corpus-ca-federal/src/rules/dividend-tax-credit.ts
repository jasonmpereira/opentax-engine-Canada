/**
 * Federal dividend tax credit — ITA s. 121, T1 line 40425.
 *
 * The counterpart to the s. 82(1)(b) gross-up in dividends.ts. The gross-up
 * notionally restores the corporate tax already paid on the distributed
 * profit; this credit returns it, so the shareholder is taxed once overall.
 *
 * The credit is a fraction of the GROSS-UP portion, not of the dividend and
 * not of the grossed-up total:
 *   eligible      6/11 of the 38% gross-up
 *   non-eligible  9/13 of the 15% gross-up
 *
 * Both fractions are exact rationals in the IR — 6/11 is non-terminating in
 * decimal, so approximating it would introduce error in every dividend
 * return. Both are open-ended: 6/11 applies to taxation years after 2011 and
 * 9/13 to years after 2018, neither is indexed.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });

const CITE = {
  source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 121",
  section: "s. 121",
  url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-121.html",
};

export const dividendTaxCreditRules: Rule[] = [
  {
    id: "ca.federal.dividend_tax_credit",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Federal dividend tax credit (line 40425)",
    citation: {
      ...CITE,
      excerpt:
        "There may be deducted from the tax otherwise payable under this Part by an individual for a taxation year the total of (a) the product of the amount, if any, that is required by subparagraph 82(1)(b)(i) to be included in computing the individual's income for the year multiplied by … (ii) for taxation years after 2018, 9/13, and (b) the product of the amount, if any, that is required by subparagraph 82(1)(b)(ii) to be included in computing the individual's income for the year multiplied by … (iv) for taxation years after 2011, 6/11.",
    },
    effectiveFrom: "2019-01-01",
    output: { type: "money" },
    // s. 121 multiplies the amount INCLUDED under s. 82(1)(b) — that is the
    // gross-up itself (15% / 38% of the actual dividend), not the dividend and
    // not the grossed-up total.
    formula: {
      kind: "add",
      args: [
        // non-eligible: 9/13 of the 15% gross-up
        {
          kind: "mulRate",
          base: {
            kind: "mulRate",
            base: fact("nonEligibleDividends"),
            rate: { num: "15", den: "100" },
            round: "half-up",
          },
          rate: { num: "9", den: "13" },
          round: "half-up",
        },
        // eligible: 6/11 of the 38% gross-up
        {
          kind: "mulRate",
          base: {
            kind: "mulRate",
            base: fact("eligibleDividends"),
            rate: { num: "38", den: "100" },
            round: "half-up",
          },
          rate: { num: "6", den: "11" },
          round: "half-up",
        },
      ],
    },
  },
];

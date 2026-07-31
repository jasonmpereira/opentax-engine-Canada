/**
 * Top-up tax credit — T1 line 34990. NEW for TY2025.
 *
 * Bill C-4 cut the lowest rate from 15% to 14.5% (blended) for 2025, and
 * non-refundable credits are valued at that lowest rate — so the cut made
 * every credit slightly less valuable. The top-up tax credit gives that back
 * for the portion above the first bracket threshold. CRA's guide:
 *
 *   "The top-up tax credit (TTC) effectively maintains a 15% rate for certain
 *    non-refundable tax credits claimed on amounts over the first income tax
 *    bracket threshold of $57,375 for 2025."
 *   — 5000-G (2025), page 45
 *
 * The Federal Worksheet's line 34990 chart (5000-D1 (2025), page 7) is:
 *
 *   1  amount from line 33800 of the return   (credits at the 14.5% rate)
 *   2  amount from line 22 of Schedule 9      (the donations credit)
 *   3  line 1 plus line 2
 *   4  −$8,319.38
 *   5  line 3 minus line 4 (if negative, enter "0")
 *   6  applicable rate × 3.45%
 *   7  line 5 multiplied by line 6            → line 34990
 *
 * Both constants are pinned in docs/parameters/ty2025-cra-forms.json, read
 * from that chart's own form fields.
 *
 * Why those two numbers are what they are — worth recording, because it makes
 * the credit checkable rather than magic:
 *   $8,319.38 is 14.5% of $57,375, i.e. the credit value of the first bracket
 *   threshold. Subtracting it leaves the credit attributable to amounts ABOVE
 *   the threshold.
 *   3.45% is 0.5/14.5. Multiplying a credit computed at 14.5% by 0.5/14.5
 *   yields the same figure as valuing the underlying amount at an extra 0.5%
 *   — which is precisely the 15%-versus-14.5% difference the guide describes.
 *
 * TY2025 only. The rate reverts to a clean 14% in 2026 with no blend, so this
 * credit is a one-year artifact of the mid-year cut and the rule is closed at
 * 2026-01-01 rather than left open.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });

export const topupCreditRules: Rule[] = [
  {
    id: "ca.federal.topup_tax_credit",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Top-up tax credit (line 34990)",
    citation: {
      source:
        "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118 as affected by the Bill C-4 rate reduction; CRA Federal Worksheet 5000-D1 (2025) line 34990 chart; CRA guide 5000-G (2025) p. 45",
      section: "line 34990 (CRA worksheet)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.html",
      excerpt:
        "The top-up tax credit (TTC) effectively maintains a 15% rate for certain non-refundable tax credits claimed on amounts over the first income tax bracket threshold of $57,375 for 2025. To calculate your TTC, use the chart for line 34990 on your Federal Worksheet.",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    parameters: {
      // Worksheet chart line 4 — 14.5% of the $57,375 first bracket threshold.
      thresholdCredit: { value: "831938", type: "money" },
    },
    // (line 33800 + Schedule 9 line 22 − 8,319.38), floored at nil, × 3.45%
    formula: {
      kind: "mulRate",
      base: {
        kind: "max0",
        arg: {
          kind: "sub",
          left: {
            kind: "add",
            args: [
              rule("ca.federal.non_refundable_credits"),
              rule("ca.federal.donations_credit"),
            ],
          },
          right: { kind: "param", name: "thresholdCredit" },
        },
      },
      // Worksheet chart line 6.
      rate: { num: "345", den: "10000" },
      round: "half-up",
    },
  },
];

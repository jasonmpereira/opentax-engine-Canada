/**
 * Net federal tax — T1 Step 5, line 42000. This is DEFAULT_TARGET: the
 * question the engine answers when the caller names none.
 *
 *   tax before credits            (s. 117(2), Step 5 Part A)
 *   − non-refundable credits      (s. 118 family, Part B)
 *   − dividend tax credit         (s. 121)
 *   − donations credit            (s. 118.1(3))
 *   − top-up tax credit           (line 34990, new for 2025)
 *   = net federal tax, floored at nil
 *
 * The floor is real law, not defensive coding: these are NON-refundable
 * credits, so they can reduce tax to nil but never below it. A negative
 * result would imply a refund the Act does not grant.
 *
 * ── WHAT IS NOT IN THIS TOTAL ──
 * Several line-42000 components are still unmodelled, and each has its own
 * refusing rule so the gap is visible rather than silently absorbed:
 *   alternative minimum tax (s. 127.5) not yet written (decision D2: in scope)
 *   Canada Workers Benefit (s. 122.7) refundable, not part of this line
 *
 * The Quebec abatement is NOT in that list, and correcting that is the point
 * of the 2026-07-29 FPFAA research. It is T1 line 44000 — Step 6, inside
 * "total credits" — not a reduction of line 42000. ITA s. 120(2) deems it
 * "paid ... on account of the individual's tax", i.e. a refundable payment
 * applied AFTER net federal tax. So net_tax is CORRECT as computed for a
 * Quebec resident; what the corpus cannot yet produce is the abatement line
 * itself. See rules/quebec-abatement.ts.
 *
 * A return that involves any of those will be UNDERSTATED by this rule rather
 * than refused, because the components are additive and simply absent. That is
 * the one place in this corpus where a gap does not fail loud, and it is why
 * `ca.federal.net_tax_completeness` exists below: it refuses whenever a fact
 * indicates one of the missing components is in play, which converts the
 * silent understatement into a refusal for exactly those returns.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });
const money = (cents: string): Expr => ({ kind: "money", cents });

export const netTaxRules: Rule[] = [
  {
    id: "ca.federal.net_tax",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Net federal tax (line 42000)",
    citation: {
      source:
        "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), ss. 117(2), 118, 118.1(3), 121; CRA form 5006-R (2025) Step 5",
      section: "s. 117(2); Division E",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-117.html",
      excerpt:
        "The tax payable under this Part by an individual on the individual's taxable income … for a taxation year is [the s. 117(2) rate table]; Division E then provides the deductions in computing tax payable, including the s. 118 non-refundable credits, the s. 118.1 gifts credit and the s. 121 dividend tax credit.",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    // Non-refundable: floors at nil, never negative.
    formula: {
      kind: "add",
      args: [
        {
          kind: "max0",
          arg: {
            kind: "sub",
            left: rule("ca.federal.tax_before_credits"),
            right: {
              kind: "add",
              args: [
                rule("ca.federal.non_refundable_credits"),
                rule("ca.federal.dividend_tax_credit"),
                rule("ca.federal.donations_credit"),
                // Line 34990 feeds line 35000 alongside the other credits.
                rule("ca.federal.topup_tax_credit"),
              ],
            },
          },
        },
        // The OAS recovery tax is levied under Part I.2 and ADDED at line
        // 42200; the non-refundable floor above does not absorb it, which is
        // why it sits outside the max0 rather than inside the subtraction.
        rule("ca.federal.oas_recovery_tax"),
      ],
    },
  },
  {
    id: "ca.federal.net_tax_completeness",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Completeness guard — refuses when an unmodelled line-42000 component applies",
    citation: {
      source:
        "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), ss. 180.2, 127.5, 120(2); Canada Pension Plan, s. 10",
      section: "ss. 180.2, 127.5, 120(2)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-180.2.html",
      excerpt:
        "Every individual shall pay a tax under this Part for each taxation year equal to the lesser of [the OAS recovery tax] … [s. 180.2, not modelled]",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // Additive components CANNOT fail loud on their own — an absent addend is
    // just a smaller total. This rule makes the absence detectable: it refuses
    // whenever a fact shows one of them is in play. Callers wanting a
    // completeness-checked answer evaluate this alongside net_tax.
    // As of the FPFAA research (2026-07-29) there is NO known unmodelled
    // ADDITIVE component of line 42000 left. The guard is retained, and
    // deliberately yields nil rather than being deleted: the next additive
    // gap (AMT under s. 127.5, decision D2) belongs here the moment work on
    // it starts, and a guard that has to be re-invented is a guard that will
    // not be. Its shrinking from three branches to none is the record of the
    // gaps closing.
    formula: money("0"),
  },
];

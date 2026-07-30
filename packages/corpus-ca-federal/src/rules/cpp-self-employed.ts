/**
 * CPP contributions on self-employment income — Schedule 8, T1 line 22200 /
 * 31000. NOT MODELLED: the rate and ceiling figures are not held.
 *
 * Schedule 8 needs, for the year: the Year's Maximum Pensionable Earnings
 * (YMPE), the Year's Additional Maximum Pensionable Earnings (YAMPE, the CPP2
 * ceiling introduced in 2024), the basic exemption, and the base / CPP1 /
 * CPP2 contribution rates. None of those appears in the CRA T1 package we
 * hold — they are published on a CRA rates page and in T4127, neither of
 * which has been provided, and canada.ca is unreachable from this
 * environment. See docs/parameters/README.md, "Still missing".
 *
 * A self-employed filer's CPP is substantial — both halves are payable, and
 * the contribution splits into a deduction and a credit. Guessing any of the
 * inputs would produce a materially wrong return, so this refuses whenever
 * there is self-employment income and yields nil otherwise, leaving employed
 * filers unaffected.
 *
 * The credit side of employment CPP is handled in non-refundable-credits.ts
 * from the `cppContributionsPaid` fact, which the filer attests; that path
 * does not need the ceilings and so is not blocked by this gap.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const money = (cents: string): Expr => ({ kind: "money", cents });

export const cppSelfEmployedRules: Rule[] = [
  {
    id: "ca.federal.cpp_self_employment",
    version: 1,
    jurisdiction: "ca.federal",
    title: "CPP on self-employment income — NOT MODELLED (rates and ceilings unheld)",
    citation: {
      source:
        "Canada Pension Plan, R.S.C. 1985, c. C-8, ss. 10–11.1; Income Tax Act, para. 60(e.1) and s. 118.7; CRA Schedule 8 (5000-S8)",
      section: "CPP ss. 10–11.1; ITA para. 60(e.1)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/C-8/section-10.html",
      excerpt:
        "…the contribution payable by a self-employed person in respect of self-employed earnings is computed on those earnings up to the Year's Maximum Pensionable Earnings, less the basic exemption, at the rates fixed under the Act [figures published annually by CRA; not held by this corpus].",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: {
      kind: "if",
      cond: { kind: "cmp", op: "gt", left: fact("selfEmploymentIncome"), right: money("0") },
      then: {
        kind: "unsupported",
        reason:
          "CPP on self-employment (Schedule 8) is not modelled: the TY2025 YMPE, YAMPE, basic exemption and base/CPP1/CPP2 contribution rates are not pinned in docs/parameters/ty2025-cra-forms.json. They are published on a CRA rates page and in T4127, neither of which has been provided, and canada.ca is unreachable from this environment. A self-employed return cannot be completed until those figures land.",
      },
      else: money("0"),
    },
  },
];

/**
 * CPP contributions on self-employment income — CRA Schedule 8 (5000-S8),
 * T1 line 22200 (deduction) and line 31000 (credit).
 *
 * A self-employed person pays BOTH halves of the contribution. Schedule 8
 * splits the result: the employee half of the BASE contribution is a credit
 * under ITA s. 118.7, and the employer half plus the whole enhanced portion
 * are deducted — the employer half under para. 60(e), the enhanced (CPP1 and
 * CPP2) portion under para. 60(e.1).
 *
 * ── THE PARAMETERS, AND A CORRECTION ──
 * An earlier version of this file refused, on the ground that the YMPE and
 * YAMPE figures were "not held". That was wrong: they are printed on
 * Schedule 8 itself, in the CRA package already ingested. The refusal was
 * mine, not the data's.
 *
 * Statutory, from the Canada Pension Plan (R.S.C. 1985, c. C-8), read from
 * the Justice Canada GitHub mirror:
 *   Year's Basic Exemption   $3,500        s. 20(2)
 *   base rate, self-employed  9.9%         Schedule 1 (via s. 11.1(2))
 *   first additional (CPP1)   2.0%         Schedule 2 (via s. 11.2)
 *   second additional (CPP2)  8.0%         Schedule 2
 *   YAMPE                     1.14 × YMPE, rounded DOWN to $100   s. 18.1
 *
 * The Act does NOT fix a 2025 YMPE: s. 18(1) anchors it at $25,900 for 1987
 * and indexes it annually by the Statistics Canada Wage Measure, so the
 * year's figure is computed and administratively published. CRA publishes it
 * on Schedule 8 and in the guide:
 *   YMPE  2025  $71,300   5000-S8 (2025) p. 3 line B; 5000-G p. 22
 *   YAMPE 2025  $81,200   5000-S8 (2025) p. 3 line D; 5000-G p. 22
 *
 * The statutory formula independently reproduces the published YAMPE —
 * 1.14 × 71,300 = 81,282, rounded down to $81,200 — which is a real check on
 * both figures rather than taking either on trust. Every derived maximum on
 * the schedule reconciles the same way: 71,300 − 3,500 = $67,800 contributory;
 * 81,200 − 71,300 = $9,900 CPP2 band; 67,800 × 9.9% = $6,712.20;
 * 67,800 × 2% = $1,356.00; 9,900 × 8% = $792.00.
 *
 * ── WHAT IS STILL NOT MODELLED ──
 * The basic exemption is pro-rated by CRA for someone who began receiving a
 * CPP retirement pension during the year (CPP s. 19(d); Schedule 8 note). No
 * fact expresses that, so the full exemption is assumed — stated here rather
 * than hidden. Employment CPP stays on the `cppContributionsPaid` fact, which
 * the filer attests; this file covers the self-employment path only, and a
 * filer with BOTH is not modelled because the ceilings interact.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });
const money = (cents: string): Expr => ({ kind: "money", cents });
const c = (dollars: number): string => String(BigInt(dollars) * 100n);

const CPP_CITE = {
  source:
    "Canada Pension Plan, R.S.C. 1985, c. C-8, ss. 11.1, 11.2, 16, 18, 18.1, 20 and Schedules 1-2; CRA Schedule 8 (5000-S8, 2025)",
  section: "CPP ss. 18, 18.1, 20; Sch. 1-2",
  url: "https://laws-lois.justice.gc.ca/eng/acts/C-8/section-20.html",
};

export const cppSelfEmployedRules: Rule[] = [
  {
    id: "ca.federal.cpp_contributory_self_employment_earnings",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Contributory self-employment earnings, base and CPP1 band (Schedule 8)",
    citation: {
      ...CPP_CITE,
      excerpt:
        "For each year after 1997 the amount of a Year's Basic Exemption is $3,500. [CPP s. 20(2)] … Your maximum pensionable earnings for 2025 (maximum $71,300) … Your maximum basic exemption for 2025 (maximum $3,500) [CRA Schedule 8 (2025), lines B and E]",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    parameters: {
      ympe: { value: c(71300), type: "money" },
      basicExemption: { value: c(3500), type: "money" },
    },
    // min(earnings, YMPE) − basic exemption, floored at nil. Caps at $67,800.
    formula: {
      kind: "max0",
      arg: {
        kind: "sub",
        left: {
          kind: "min",
          args: [fact("selfEmploymentIncome"), { kind: "param", name: "ympe" }],
        },
        right: { kind: "param", name: "basicExemption" },
      },
    },
  },
  {
    id: "ca.federal.cpp2_self_employment_earnings",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Self-employment earnings in the CPP2 band (Schedule 8 line C)",
    citation: {
      ...CPP_CITE,
      excerpt:
        "…for 2025 and each subsequent year, 1.14 multiplied by the Year's Maximum Pensionable Earnings for that year [CPP s. 18.1(1)(b)] … Your maximum amount subject to second additional contributions for 2025 (maximum $9,900) [CRA Schedule 8 (2025), line C]",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    parameters: {
      ympe: { value: c(71300), type: "money" },
      yampe: { value: c(81200), type: "money" },
    },
    // Earnings between YMPE and YAMPE — the $9,900 second-additional band.
    formula: {
      kind: "max0",
      arg: {
        kind: "sub",
        left: {
          kind: "min",
          args: [fact("selfEmploymentIncome"), { kind: "param", name: "yampe" }],
        },
        right: { kind: "param", name: "ympe" },
      },
    },
  },
  {
    id: "ca.federal.cpp_base_self_employment",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Base CPP contribution on self-employment, both halves (Schedule 8 line 10)",
    citation: {
      ...CPP_CITE,
      excerpt:
        "Base Contribution Rates … 2003 and each subsequent year | 4.95 | 4.95 | 9.9 [CPP Schedule 1] … amount from line 9 × 9.9% = (maximum $6,712.20) [CRA Schedule 8 (2025), Part 4 line 10]",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    // 9.9% = both halves of the 4.95% employee/employer base rate.
    formula: {
      kind: "mulRate",
      base: rule("ca.federal.cpp_contributory_self_employment_earnings"),
      rate: { num: "99", den: "1000" },
      round: "half-up",
    },
  },
  {
    id: "ca.federal.cpp_enhanced_self_employment",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Enhanced CPP contributions (CPP1 + CPP2) on self-employment",
    citation: {
      ...CPP_CITE,
      excerpt:
        "First Additional Contribution Rates … 2024 and each subsequent year | 1.0 | 1.0 | 2.0 … Second Additional Contribution Rates … 2024 and each subsequent year | 4.0 | 4.0 | 8.0 [CPP Schedule 2] … amount from line 9 × 2% = (maximum $1,356.00) … amount from line 6 × 8% = (maximum $792.00) [CRA Schedule 8 (2025), Part 4 lines 11 and 12]",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    formula: {
      kind: "add",
      args: [
        // CPP1: 2% of the base contributory band
        {
          kind: "mulRate",
          base: rule("ca.federal.cpp_contributory_self_employment_earnings"),
          rate: { num: "2", den: "100" },
          round: "half-up",
        },
        // CPP2: 8% of the YMPE-to-YAMPE band
        {
          kind: "mulRate",
          base: rule("ca.federal.cpp2_self_employment_earnings"),
          rate: { num: "8", den: "100" },
          round: "half-up",
        },
      ],
    },
  },
  {
    id: "ca.federal.cpp_self_employment_deduction",
    version: 1,
    jurisdiction: "ca.federal",
    title: "CPP deduction on self-employment (line 22200)",
    citation: {
      source:
        "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), paras. 60(e) and 60(e.1); CRA Schedule 8 (5000-S8, 2025) Part 4",
      section: "paras. 60(e), 60(e.1)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-60.html",
      excerpt:
        "There may be deducted in computing a taxpayer's income for a taxation year such of the following amounts as are applicable … (e) the employer's share of the base contribution on self-employed earnings … (e.1) the enhanced portion of the contribution…",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    // The employer half of the base (50% of the 9.9%), plus ALL of the
    // enhanced contributions. The other half of the base is the s. 118.7
    // credit below — Schedule 8 splits the base 50/50 and routes the whole
    // enhanced portion to the deduction.
    formula: {
      kind: "add",
      args: [
        {
          kind: "mulRate",
          base: rule("ca.federal.cpp_base_self_employment"),
          rate: { num: "1", den: "2" },
          round: "half-up",
        },
        rule("ca.federal.cpp_enhanced_self_employment"),
      ],
    },
  },
  {
    id: "ca.federal.cpp_self_employment_credit_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "CPP credit amount on self-employment (line 31000)",
    citation: {
      source:
        "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118.7; CRA Schedule 8 (5000-S8, 2025) Part 4 line 15",
      section: "s. 118.7",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.7.html",
      excerpt:
        "…B is the total of … (a.2) the amount, if any, by which the total of all amounts each of which is an amount payable by the individual as an employee's contribution … under the Canada Pension Plan…",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    // The employee half of the BASE contribution only — not the enhanced
    // portion, which is deducted rather than credited.
    formula: {
      kind: "mulRate",
      base: rule("ca.federal.cpp_base_self_employment"),
      rate: { num: "1", den: "2" },
      round: "half-up",
    },
  },
  {
    id: "ca.federal.cpp_both_employment_and_self_employment",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Combined employment and self-employment CPP — NOT MODELLED",
    citation: {
      ...CPP_CITE,
      excerpt:
        "Your maximum pensionable earnings for 2025 (maximum $71,300) [CRA Schedule 8 (2025) line B — a single ceiling shared across all pensionable earnings]",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // The YMPE/YAMPE ceilings apply ONCE across all pensionable earnings, so a
    // filer with both employment and self-employment income must reconcile
    // contributions already withheld against the shared ceiling (Schedule 8
    // Part 5). Computing the self-employment path in isolation would
    // over-contribute. Refuse rather than over-state.
    formula: {
      kind: "if",
      cond: {
        kind: "and",
        args: [
          { kind: "cmp", op: "gt", left: fact("selfEmploymentIncome"), right: money("0") },
          { kind: "cmp", op: "gt", left: fact("cppContributionsPaid"), right: money("0") },
        ],
      },
      then: {
        kind: "unsupported",
        reason:
          "This return has BOTH self-employment income and CPP already contributed through employment. The YMPE and YAMPE ceilings apply once across all pensionable earnings, so the two paths must be reconciled against a shared ceiling (Schedule 8 Part 5). Computing the self-employment contribution in isolation would over-state it. Provide one or the other, or wait for the Part 5 reconciliation rule.",
      },
      else: money("0"),
    },
  },
];

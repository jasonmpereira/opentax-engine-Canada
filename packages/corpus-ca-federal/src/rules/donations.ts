/**
 * Charitable donations credit — ITA s. 118.1(3), T1 line 34900 via Schedule 9.
 *
 * Three tiers, and the middle one is the subtle part:
 *   appropriate percentage (14.5% for 2025) on the first $200 of gifts
 *   33%  on the portion of gifts that corresponds to income taxed in the top
 *        bracket — specifically the LESSER of (gifts over $200) and (income
 *        over the top-bracket threshold, $253,414 for 2025)
 *   29%  on whatever remains
 *
 * The 33% tier is capped by income, not just by donation size: a taxpayer
 * earning $150,000 who gives $100,000 gets no 33% tier at all, because none
 * of their income sits in the top bracket. Treating the 33% rate as applying
 * to all gifts above $200 would over-state the credit substantially, so the
 * income cap is modelled explicitly.
 *
 * The 75%-of-net-income annual limit (s. 118.1(1) "total gifts") is NOT
 * modelled — see the note on the limit rule below.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });
const money = (cents: string): Expr => ({ kind: "money", cents });
const c = (dollars: number): string => String(BigInt(dollars) * 100n);

const FIRST_TIER = c(200);
const TOP_BRACKET = c(253414); // first dollar amount, para. 117(2)(e), TY2025

export const donationRules: Rule[] = [
  {
    id: "ca.federal.donations_credit",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Charitable donations and gifts credit (line 34900)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118.1(3)",
      section: "s. 118.1(3)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.1.html",
      excerpt:
        "For the purpose of computing the tax payable under this Part by an individual for a taxation year, there may be deducted such amount as the individual claims not exceeding the amount determined by the formula A × B + C × D + E × F where A is the appropriate percentage for the year; B is the lesser of $200 and the individual's total gifts for the year; C is the highest individual percentage for the year; D is … (b) in any other case, the lesser of (i) the amount, if any, by which the individual's total gifts for the year exceeds $200, and (ii) the amount, if any, by which the individual's amount taxable for the year for the purposes of subsection 117(2) exceeds the first dollar amount for the year referred to in paragraph 117(2)(e); E is 29%; and F is the amount, if any, by which the individual's total gifts for the year exceeds the total of $200 and the amount determined for D.",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    parameters: {
      firstTier: { value: FIRST_TIER, type: "money" },
      topBracket: { value: TOP_BRACKET, type: "money" }, // CRA 5000-S9 line 18
    },
    formula: {
      kind: "add",
      args: [
        // A x B — appropriate percentage on the first $200
        {
          kind: "mulRate",
          base: {
            kind: "min",
            args: [{ kind: "param", name: "firstTier" }, fact("charitableDonations")],
          },
          rate: { num: "145", den: "1000" },
          round: "half-up",
        },
        // C x D — 33% on gifts over $200, capped by income in the top bracket
        {
          kind: "mulRate",
          base: {
            kind: "min",
            args: [
              {
                kind: "max0",
                arg: {
                  kind: "sub",
                  left: fact("charitableDonations"),
                  right: { kind: "param", name: "firstTier" },
                },
              },
              {
                kind: "max0",
                arg: {
                  kind: "sub",
                  left: rule("ca.federal.taxable_income"),
                  right: { kind: "param", name: "topBracket" },
                },
              },
            ],
          },
          rate: { num: "33", den: "100" },
          round: "half-up",
        },
        // E x F — 29% on the remainder
        {
          kind: "mulRate",
          base: {
            kind: "max0",
            arg: {
              kind: "sub",
              left: {
                kind: "max0",
                arg: {
                  kind: "sub",
                  left: fact("charitableDonations"),
                  right: { kind: "param", name: "firstTier" },
                },
              },
              right: {
                kind: "min",
                args: [
                  {
                    kind: "max0",
                    arg: {
                      kind: "sub",
                      left: fact("charitableDonations"),
                      right: { kind: "param", name: "firstTier" },
                    },
                  },
                  {
                    kind: "max0",
                    arg: {
                      kind: "sub",
                      left: rule("ca.federal.taxable_income"),
                      right: { kind: "param", name: "topBracket" },
                    },
                  },
                ],
              },
            },
          },
          rate: { num: "29", den: "100" },
          round: "half-up",
        },
      ],
    },
  },
  {
    id: "ca.federal.donations_annual_limit",
    version: 1,
    jurisdiction: "ca.federal",
    title: "75%-of-income donation limit — NOT MODELLED (refuses if it could bind)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118.1(1) 'total gifts'",
      section: "s. 118.1(1)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.1.html",
      excerpt:
        "total gifts, of an individual for a taxation year, means the total of the individual's total charitable gifts, total cultural gifts, total ecological gifts and total Crown gifts for the year…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // "Total gifts" is limited to 75% of net income, with carryforward of the
    // excess over five years and a higher limit in the year of death. The
    // corpus models neither the limit nor the carryforward, so it refuses
    // exactly where the limit could bite — donations above 75% of net income.
    formula: {
      kind: "if",
      cond: {
        kind: "cmp",
        op: "gt",
        left: fact("charitableDonations"),
        right: {
          kind: "mulRate",
          base: rule("ca.federal.net_income"),
          rate: { num: "75", den: "100" },
          round: "half-up",
        },
      },
      then: {
        kind: "unsupported",
        reason:
          "Donations exceed 75% of net income. The s. 118.1(1) 'total gifts' annual limit and the five-year carryforward of the excess are not modelled, so the credit above that threshold cannot be computed. Reduce the claim to the current-year limit, or wait for the carryforward rule.",
      },
      else: money("0"),
    },
  },
];

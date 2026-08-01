/**
 * Deductions in computing income — the Subdivision E amounts that take total
 * income (line 15000) down to net income (line 23600).
 *
 * Modelled in this slice:
 *   RRSP premiums          s. 146(5)          line 20800
 *   union / professional   para. 8(1)(i)      line 21200
 *   CPP on self-employment paras. 60(e),(e.1) line 22200
 *
 * Deliberately NOT modelled, and refusing rather than silently zeroing:
 *   child care expenses    s. 63              line 21400
 *
 * The child care refusal is CONDITIONAL. The `childcareExpenses` fact defaults
 * to zero, and a taxpayer with no child care expenses is unaffected by s. 63 —
 * refusing them would make the corpus useless for no benefit. So the rule
 * yields zero when the fact is zero and refuses only when there is an actual
 * claim to compute. That is the shape every deferred provision in this corpus
 * should take: fail loud exactly where the gap bites, not everywhere.
 *
 * s. 63 is deferred rather than rushed because its limit nests: the claim is
 * capped at actual expenses paid, and capped again at the LESSER of two thirds
 * of "earned income" (a defined term with its own inclusion list) and the total
 * of the per-child annual child care expense amounts — then reduced by whatever
 * a supporting person deducted for the same children. The periodic "weekly
 * amount" rules for boarding schools and overnight camps sit on top, and
 * s. 63(2) can shift the claim to the lower-income spouse. Encoding part of
 * that would produce a plausible, wrong, confidently-cited number, which is
 * worse for this project than refusing.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });
const money = (cents: string): Expr => ({ kind: "money", cents });

export const deductionRules: Rule[] = [
  {
    id: "ca.federal.rrsp_deduction",
    version: 1,
    jurisdiction: "ca.federal",
    title: "RRSP premium deduction (line 20800)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 146(5)",
      section: "s. 146(5)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-146.html",
      excerpt:
        "There may be deducted in computing a taxpayer's income for a taxation year such amount as the taxpayer claims not exceeding the lesser of (a) the amount, if any, by which the total of all amounts each of which is a premium paid by the taxpayer after 1990 and on or before the day that is 60 days after the end of the year under a registered retirement savings plan under which the taxpayer was the annuitant at the time the premium was paid…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // The s. 146(1) "RRSP deduction limit" (contribution room) is ATTESTED by
    // the fact, not validated here: room depends on prior-year earned income,
    // pension adjustments and unused room carried forward, none of which the
    // corpus holds. The claimed amount is taken as given.
    formula: fact("rrspDeduction"),
  },
  {
    id: "ca.federal.union_and_professional_dues",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Annual union, professional and like dues (line 21200)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), para. 8(1)(i)",
      section: "para. 8(1)(i)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-8.html",
      excerpt:
        "…(iv) annual dues to maintain membership in a trade union as defined (A) by section 3 of the Canada Labour Code, or (B) in any provincial statute providing for the investigation, conciliation or settlement of industrial disputes, or to maintain membership in an association of public servants the primary object of which is to promote the improvement of the members' conditions of employment or work…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // Para. 8(1)(i) allows the deduction only "to the extent that the taxpayer
    // has not been reimbursed, and is not entitled to be reimbursed in respect
    // thereof". Both limbs are ATTESTED by the fact — the corpus has no way to
    // observe a reimbursement or an entitlement to one.
    formula: fact("unionDues"),
  },
  {
    id: "ca.federal.child_care_expenses",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Child care expenses — NOT MODELLED in v1 (refuses when claimed)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 63",
      section: "s. 63(1), (3)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-63.html",
      excerpt:
        "…there may be deducted in computing the taxpayer's income for the year such amount as the taxpayer claims not exceeding the total of all amounts each of which is an amount paid, as or on account of child care expenses incurred for services rendered in the year in respect of an eligible child of the taxpayer … but not exceeding the amount, if any, by which (e) the lesser of (i) 2/3 of the taxpayer's earned income for the year, and (ii) the total of all amounts each of which is the annual child care expense amount in respect of an eligible child of the taxpayer for the year exceeds (f) the total of all amounts each of which is an amount that is deducted, in respect of the taxpayer's eligible children for the year, under this section in computing the income for the year of an individual (other than the taxpayer)…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // Zero when nothing is claimed; refuse when there is a claim to compute.
    formula: {
      kind: "if",
      cond: {
        kind: "cmp",
        op: "gt",
        left: fact("childcareExpenses"),
        right: money("0"),
      },
      then: {
        kind: "unsupported",
        reason:
          "Child care expenses (s. 63) are not modelled in v1. The deduction is the LEAST of actual expenses paid, two thirds of the taxpayer's 'earned income' (a defined term in s. 63(3)), and the total of the per-child annual child care expense amounts — with periodic weekly limits for boarding schools and overnight camps, and the s. 63(2) supporting-person rules that can shift the claim to the lower-income spouse. Encoding part of that would produce a plausible wrong deduction. Provide childcareExpenses = 0, or wait for the s. 63 rule.",
      },
      else: money("0"),
    },
  },
  {
    id: "ca.federal.total_deductions",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Total deductions in computing net income (line 23300)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 3(c), Subdivision E",
      section: "s. 3(c)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-3.html",
      excerpt:
        "…(c) determine the amount, if any, by which the total determined under paragraph (a) plus the amount determined under paragraph (b) exceeds the total of the deductions permitted by Subdivision E in computing the taxpayer's income for the year…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: {
      kind: "add",
      args: [
        rule("ca.federal.rrsp_deduction"),
        rule("ca.federal.union_and_professional_dues"),
        rule("ca.federal.child_care_expenses"),
        // Schedule 8: the employer half of base CPP plus the enhanced
        // portion, deductible under paras. 60(e) and 60(e.1).
        rule("ca.federal.cpp_self_employment_deduction"),
        // Guard: refuses if employment and self-employment CPP would both
        // draw on the single shared YMPE ceiling.
        rule("ca.federal.cpp_both_employment_and_self_employment"),
      ],
    },
  },
];

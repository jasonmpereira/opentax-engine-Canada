/**
 * Non-refundable tax credits — the ITA s. 118 family, T1 Step 5 Part B.
 *
 * Every credit here has the same shape: an AMOUNT is determined, then the
 * credit is that amount multiplied by the "appropriate percentage", which
 * s. 248(1) defines as "the lowest percentage referred to in subsection 117(2)
 * for the taxation year". For TY2025 that is the BLENDED 14.5% — see
 * tax-brackets.ts for why the consolidated 14% is wrong for this year. Getting
 * that rate wrong mis-states every credit below, which is why it is declared
 * once here and referenced, never repeated.
 *
 * ── THE BASIC PERSONAL AMOUNT ──
 * s. 118(1.1) defines it as A + B where B = C − D × E:
 *   A  the base amount                          $14,538 (2025)
 *   C  = F − G, the supplement                   $1,591 (2025)
 *   D  = C
 *   E  nil if income <= the first dollar amount in para. 117(2)(d);
 *      otherwise the lesser of 1 and (H − I)/J, where H is income,
 *      I is that same 117(2)(d) amount, and J = K − L with K the first
 *      dollar amount in para. 117(2)(e) and L = I.
 * So BPA = A + C(1 − E): the full $16,129 up to $177,882 of income, sliding
 * linearly to $14,538 at $253,414. I and J resolve to $177,882 and $75,532
 * (= 253,414 − 177,882), and all four figures appear on CRA's Federal
 * Worksheet at line 30000 — an independent confirmation that the formula has
 * been read correctly.
 *
 * ── WHAT REFUSES, AND WHY ──
 * The Canada employment amount (s. 118(10)) and the medical expense credit
 * (s. 118.2) are NOT modelled. Both depend on an indexed dollar figure that
 * the CRA package we hold does not carry — the s. 118(10) $1,000 and the
 * s. 118.2 floor are both indexed under s. 117.1, and neither appears in
 * docs/parameters/ty2025-cra-forms.json. Rather than invent them, both refuse
 * when claimed and yield nil when not, so a return that does not involve them
 * still computes.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });
const money = (cents: string): Expr => ({ kind: "money", cents });
const c = (dollars: number): string => String(BigInt(dollars) * 100n);

/** TY2025 appropriate percentage: the blended lowest s. 117(2) rate. */
const APPROPRIATE_PERCENTAGE = { num: "145", den: "1000" };

/** amount x appropriate percentage — the shape of every s. 118 credit. */
const atAppropriatePercentage = (amount: Expr): Expr => ({
  kind: "mulRate",
  base: amount,
  rate: APPROPRIATE_PERCENTAGE,
  round: "half-up",
});

const BPA_BASE = c(14538); // A
const BPA_SUPPLEMENT = c(1591); // C  (A + C = $16,129 maximum)
const BPA_PHASE_START = c(177882); // I — first dollar amount, para. 117(2)(d)
const BPA_PHASE_WIDTH = c(75532); // J = K − L

export const nonRefundableCreditRules: Rule[] = [
  // ─────────────────────────── amounts ───────────────────────────
  {
    id: "ca.federal.basic_personal_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Basic personal amount, with the s. 118(1.1) phase-out (line 30000)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118(1.1)",
      section: "s. 118(1.1)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.html",
      excerpt:
        "For the purposes of subsection (1), basic personal amount, of an individual for a taxation year, means the amount determined by the formula A + B where A is $12,298; and B is the amount determined by the formula C − D × E … E is (a) if the individual's income for the year is less than or equal to the first dollar amount for the year referred to in paragraph 117(2)(d), nil, and (b) in any other case, the lesser of 1 and the amount determined by the formula (H − I)/J…",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    parameters: {
      // Indexed figures, TY2025, from CRA's Federal Worksheet line 30000.
      base: { value: BPA_BASE, type: "money" },
      supplement: { value: BPA_SUPPLEMENT, type: "money" },
      phaseStart: { value: BPA_PHASE_START, type: "money" },
      phaseWidth: { value: BPA_PHASE_WIDTH, type: "money" },
    },
    // A + C − min(C, C x (income − I) / J)
    formula: {
      kind: "sub",
      left: {
        kind: "add",
        args: [{ kind: "param", name: "base" }, { kind: "param", name: "supplement" }],
      },
      right: {
        kind: "min",
        args: [
          { kind: "param", name: "supplement" },
          {
            kind: "mulDiv",
            a: { kind: "param", name: "supplement" },
            b: {
              kind: "max0",
              arg: {
                kind: "sub",
                left: rule("ca.federal.net_income"),
                right: { kind: "param", name: "phaseStart" },
              },
            },
            c: { kind: "param", name: "phaseWidth" },
            round: "half-up",
          },
        ],
      },
    },
  },
  {
    id: "ca.federal.spouse_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Spouse or common-law partner amount (line 30300)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), para. 118(1)(a)",
      section: "para. 118(1)(a)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.html",
      excerpt:
        "…in the case of an individual who at any time in the year is a married person or a person who is in a common-law partnership who supports the individual's spouse or common-law partner and is not living separate and apart from the spouse or common-law partner by reason of a breakdown of their marriage or common-law partnership, an amount equal to the total of … the basic personal amount of the individual for the year … minus the income of the individual's spouse or common-law partner for the year",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    // Available only to a married / common-law individual; the amount is the
    // BPA reduced dollar-for-dollar by the spouse's income, floored at nil.
    formula: {
      kind: "if",
      cond: {
        kind: "or",
        args: [
          { kind: "cmp", op: "eq", left: fact("maritalStatus"), right: { kind: "enum", value: "married" } },
          { kind: "cmp", op: "eq", left: fact("maritalStatus"), right: { kind: "enum", value: "common-law" } },
        ],
      },
      then: {
        kind: "max0",
        arg: {
          kind: "sub",
          left: rule("ca.federal.basic_personal_amount"),
          right: fact("spouseNetIncome"),
        },
      },
      else: money("0"),
    },
  },
  {
    id: "ca.federal.age_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Age amount, 65 and over (line 30100)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118(2)",
      section: "s. 118(2)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.html",
      excerpt:
        "For the purpose of computing the tax payable under this Part for a taxation year by an individual who, before the end of the year, has attained the age of 65 years, there may be deducted the amount determined by the formula A × ($6,408 – B) where A is the appropriate percentage for the year; and B is 15% of the amount, if any, by which the individual's income for the year would exceed $25,921…",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    parameters: {
      // TY2025 indexed figures, CRA Federal Worksheet line 30100.
      maximum: { value: c(9028), type: "money" },
      threshold: { value: c(45522), type: "money" },
    },
    // This rule yields the AMOUNT; the 15% reduction rate is statutory and
    // distinct from the appropriate percentage applied later.
    formula: {
      kind: "if",
      cond: fact("isAge65OrOlder"),
      then: {
        kind: "max0",
        arg: {
          kind: "sub",
          left: { kind: "param", name: "maximum" },
          right: {
            kind: "mulRate",
            base: {
              kind: "max0",
              arg: {
                kind: "sub",
                left: rule("ca.federal.net_income"),
                right: { kind: "param", name: "threshold" },
              },
            },
            rate: { num: "15", den: "100" },
            round: "half-up",
          },
        },
      },
      else: money("0"),
    },
  },
  {
    id: "ca.federal.pension_income_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Pension income amount (line 31400)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118(3)",
      section: "s. 118(3)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.html",
      excerpt:
        "…there may be deducted an amount determined by the formula A × B where A is the appropriate percentage for the year; and B is the lesser of (a) $2,000, and (b) the total of (i) the eligible pension income of the individual for the taxation year…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // The $2,000 is on the face of s. 118(3) and is NOT in the s. 117.1(2)
    // list of indexed amounts, so it is stated directly rather than pinned to
    // a CRA figure, and the rule is open-ended rather than year-versioned.
    formula: {
      kind: "min",
      args: [money(c(2000)), fact("taxablePensionIncome")],
    },
  },
  {
    id: "ca.federal.disability_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Disability amount (line 31600)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118.3(1)",
      section: "s. 118.3(1)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.3.html",
      excerpt:
        "Where (a) an individual has one or more severe and prolonged impairments in physical or mental functions … (a.2) …a medical practitioner has certified in prescribed form that the impairment is a severe and prolonged impairment in physical or mental functions … there may be deducted in computing the individual's tax payable under this Part for the year the amount determined by the formula A × B…",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    parameters: {
      // TY2025 base amount, CRA Federal Worksheet line 31600. The supplement
      // for a person under 18 ($5,914, reduced by child care and attendant
      // care over $3,464) is NOT modelled — no fact identifies the claimant
      // as under 18, so only the base amount is available.
      base: { value: c(10138), type: "money" },
    },
    formula: {
      kind: "if",
      cond: fact("hasDisabilityTaxCert"),
      then: { kind: "param", name: "base" },
      else: money("0"),
    },
  },
  {
    id: "ca.federal.tuition_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Tuition amount (line 32300)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118.5(1)",
      section: "s. 118.5(1)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.5.html",
      excerpt:
        "…there may be deducted in computing the individual's tax payable under this Part for the year … the amount determined by the formula A × B where A is the appropriate percentage for the year and B is the total of fees paid in respect of the year…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // Actual eligible fees; no statutory cap. Carryforward and transfer to a
    // parent or spouse (ss. 118.61, 118.9) are NOT modelled — the fact holds
    // the current year's fees only.
    formula: fact("tuitionFees"),
  },
  {
    id: "ca.federal.student_loan_interest_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Interest on student loans (line 31900)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118.62",
      section: "s. 118.62",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.62.html",
      excerpt:
        "There may be deducted in computing an individual's tax payable under this Part for a taxation year the amount determined by the formula A × B where A is the appropriate percentage for the year, and B is the total of all amounts each of which is an amount paid in the year … on account of interest on a loan made to, or other amount owing by, the individual under the Canada Student Loans Act…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: fact("studentLoanInterest"),
  },
  {
    id: "ca.federal.cpp_ei_premium_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "CPP contributions and EI premiums (lines 30800, 31200)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118.7",
      section: "s. 118.7",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.7.html",
      excerpt:
        "For the purpose of computing the tax payable under this Part by an individual for a taxation year, there may be deducted the amount determined by the formula A × B where A is the appropriate percentage for the year; and B is the total of (a) the total of all amounts each of which is an amount payable by the individual as an employee's premium or a self-employment premium for the year under the Employment Insurance Act, not exceeding the maximum amount of such premiums payable by the individual for the year under that Act…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // Amounts actually paid, as attested by the facts. s. 118.7 caps each at
    // the statutory maximum for the year; the corpus does NOT enforce those
    // caps because the CPP maximum depends on the YMPE/YAMPE figures we do
    // not hold (see cpp-self-employed.ts). An over-stated input therefore
    // produces an over-stated credit — a known limit, recorded here.
    formula: {
      kind: "add",
      args: [fact("cppContributionsPaid"), fact("eiPremiumsPaid")],
    },
  },
  {
    id: "ca.federal.canada_employment_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Canada employment amount — NOT MODELLED (indexed figure unpinned)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118(10)",
      section: "s. 118(10)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.html",
      excerpt:
        "…there may be deducted the amount determined by the formula A × B where A is the appropriate percentage for the taxation year; and B is the lesser of (a) $1,000, and (b) the total of all amounts, each of which is an amount included in computing the individual's income for the taxation year from an office or employment…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // The $1,000 is indexed under s. 117.1 and the TY2025 figure is not in
    // docs/parameters/ty2025-cra-forms.json — the CRA package we hold does
    // not carry it. Refusing only when there is employment income keeps every
    // other return computable.
    formula: {
      kind: "if",
      cond: { kind: "cmp", op: "gt", left: fact("employmentIncome"), right: money("0") },
      then: {
        kind: "unsupported",
        reason:
          "The Canada employment amount (s. 118(10)) is not modelled: its $1,000 base is indexed under s. 117.1 and the TY2025 indexed figure is not pinned in docs/parameters/ty2025-cra-forms.json. Supplying it requires the CRA indexation table or a form that prints it. Until then a return with employment income cannot be completed through this credit.",
      },
      else: money("0"),
    },
  },
  {
    id: "ca.federal.medical_expense_amount",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Medical expenses — NOT MODELLED (indexed floor unpinned)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118.2(1)",
      section: "s. 118.2(1)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.2.html",
      excerpt:
        "…the amount determined by the formula A × (B − C) − D … where C is the lesser of a fixed indexed dollar amount for the year and 3% of the individual's income for the year…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: {
      kind: "if",
      cond: { kind: "cmp", op: "gt", left: fact("medicalExpenses"), right: money("0") },
      then: {
        kind: "unsupported",
        reason:
          "The medical expense credit (s. 118.2) is not modelled: the reduction is the LESSER of 3% of income and an indexed dollar amount, and that indexed amount for TY2025 is not pinned in docs/parameters/ty2025-cra-forms.json. Encoding only the 3% limb would over-state the credit for higher incomes.",
      },
      else: money("0"),
    },
  },

  // ───────────────────────── the credit ─────────────────────────
  {
    id: "ca.federal.non_refundable_credits",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Total federal non-refundable tax credits (line 35000)",
    citation: {
      source:
        "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 118, s. 248(1) 'appropriate percentage'",
      section: "s. 118; s. 248(1)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-118.html",
      excerpt:
        "appropriate percentage, for a taxation year, means the lowest percentage referred to in subsection 117(2) for the taxation year",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    // Sum the AMOUNTS, then apply the appropriate percentage once. Applying
    // it per-amount and summing would round each credit separately and drift
    // from CRA's Step 5 Part B, which totals the amounts on line 33500 and
    // multiplies once on line 33800.
    formula: atAppropriatePercentage({
      kind: "add",
      args: [
        rule("ca.federal.basic_personal_amount"),
        rule("ca.federal.spouse_amount"),
        rule("ca.federal.age_amount"),
        rule("ca.federal.pension_income_amount"),
        rule("ca.federal.disability_amount"),
        rule("ca.federal.tuition_amount"),
        rule("ca.federal.student_loan_interest_amount"),
        rule("ca.federal.cpp_ei_premium_amount"),
        rule("ca.federal.canada_employment_amount"),
        rule("ca.federal.medical_expense_amount"),
      ],
    }),
  },
];

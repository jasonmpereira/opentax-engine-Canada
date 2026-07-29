/**
 * The fact catalog: every input the TY2025 Canadian federal (T1) corpus can
 * consume. Phase 1 skeleton per docs/CANADA-CONVERSION.md.
 *
 * Conventions (identical to the US catalog this replaces):
 *   - Facts with a `default` are documented assumptions — using one is
 *     recorded in the proof's assumptions list.
 *   - Facts WITHOUT a default MUST be provided; the engine refuses to answer
 *     without them (the no-guessing rule). Identity/status facts and primary
 *     income never default.
 *   - Money facts are entered in dollars (e.g. 50000 or "1234.56") and held
 *     internally as integer cents. Unlike the IRS whole-dollar convention,
 *     the T1 computes in dollars and cents, so exact-cents arithmetic matches
 *     CRA's forms directly.
 *
 * Provenance of the descriptions below:
 *   - STATUTORY references (ITA / ITR section, subsection and paragraph
 *     numbers, and the dollar figures written into the statute itself, e.g.
 *     the s. 63(3) $11,000 / $8,000 / $5,000 annual child care expense
 *     amounts) are verified verbatim against the committed, mirror-checked
 *     LIMS consolidations in docs/sources/ via tools/lims-chunker.
 *   - T1 LINE NUMBERS (e.g. "line 30400") are navigational aids for a human
 *     reader, taken from the CRA return layout. canada.ca is not reachable
 *     from this environment, so they are NOT pinned to primary authority and
 *     must not be treated as citations. When Phase 2 rules land, the binding
 *     authority in each rule's `citation` is the ITA/ITR provision — never a
 *     line number. Re-verify the line numbers against the official T1 when
 *     the CRA parameter pack is delivered.
 *   - No INDEXED dollar amount (BPA, bracket thresholds, medical floor) is
 *     stated anywhere in this file; those are still pending the CRA
 *     parameter pack and must not be introduced here without a citation.
 */

import type { FactSpec } from "@invaro/opentax-core";

/**
 * The 13 Canadian jurisdictions (10 provinces + 3 territories), CRA
 * two-letter codes. Drives provincial composers (Form 428, Phase 7), CWB
 * provincial reconfigurations (QC/AB/NU), and the Quebec abatement.
 */
export const PROVINCES = [
  "AB", // Alberta
  "BC", // British Columbia
  "MB", // Manitoba
  "NB", // New Brunswick
  "NL", // Newfoundland and Labrador
  "NS", // Nova Scotia
  "NT", // Northwest Territories
  "NU", // Nunavut
  "ON", // Ontario
  "PE", // Prince Edward Island
  "QC", // Quebec
  "SK", // Saskatchewan
  "YT", // Yukon
] as const;

/** T1 page-1 marital statuses (CRA's six categories). */
export const MARITAL_STATUSES = [
  "married",
  "common-law",
  "separated",
  "divorced",
  "widowed",
  "single",
] as const;

export const facts: FactSpec[] = [
  // ---- identity / status ----
  {
    id: "province",
    type: "enum",
    enumValues: [...PROVINCES],
    description:
      "Province or territory of residence on December 31 (ITA s. 2; Reg. 2601). One of the 13 CRA two-letter codes. Gates CWB provincial variants, the Quebec abatement, and future Form 428 composers.",
    // no default — the engine must never guess the province of residence
  },
  {
    id: "maritalStatus",
    type: "enum",
    enumValues: [...MARITAL_STATUSES],
    description:
      "Marital status on December 31 (T1 page 1; 'common-law partner' per ITA s. 248(1)). One of: married, common-law, separated, divorced, widowed, single.",
    // no default — the engine must never guess marital status
  },
  {
    id: "isAge65OrOlder",
    type: "bool",
    description:
      "Taxpayer was 65 or older at the end of the taxation year — gates the age amount (ITA s. 118(2)) and pension-income treatment.",
    default: {
      value: false,
      rationale: "Assumed under 65 absent contrary input",
    },
  },
  {
    id: "birthYear",
    type: "int",
    min: "1900",
    description:
      "Calendar year of birth — the exact-age input for rules whose age band the boolean age facts cannot express. Chief consumer is the CWB, but note s. 122.7(1) 'eligible individual' is NOT an age test alone: it means an individual (other than an 'ineligible individual') who was resident in Canada throughout the year and who was, at the end of the taxation year, ANY ONE of (a) 19 or older, (b) the cohabiting spouse or common-law partner of another individual, or (c) the parent of a child with whom the individual resides — so an 18-year-old parent, or one with a cohabiting partner, CAN qualify, but only if not an 'ineligible individual' under s. 122.7(1): a person described in para. 149(1)(a) or (b) at any time in the year, a full-time student at a designated educational institution for a total of more than 13 weeks in the year (except where they have an eligible dependant for the year), or a person confined to a prison or similar institution for at least 90 days in the year. Age alone must never be used to DENY the CWB. The age amount stays gated on isAge65OrOlder (s. 118(2)); this fact is consulted only where a rule names it.",
    // no default — the engine must never guess the taxpayer's age
  },

  // ---- spouse ----
  {
    id: "spouseNetIncome",
    type: "money",
    min: "0",
    description:
      "Spouse's or common-law partner's net income (their line 23600), in dollars — drives the spousal amount (ITA s. 118(1)(a)) and credit transfers.",
    // no default — guessing $0 would maximize the spousal amount; the
    // engine refuses when a spousal computation needs it and it is absent
  },
  {
    id: "spouseIsAge65OrOlder",
    type: "bool",
    description:
      "Spouse or common-law partner was 65 or older at the end of the taxation year — gates the spouse's own age amount (ITA s. 118(2)), which is one of the credits transferable to the taxpayer under s. 118.8 (Schedule 2; T1 line 32600).",
    default: {
      value: false,
      rationale: "Assumed spouse under 65 absent contrary input",
    },
  },

  // ---- dependants ----
  {
    id: "hasEligibleDependant",
    type: "bool",
    description:
      "Every condition of the amount for an eligible dependant is met (ITA para. 118(1)(b); T1 line 30400). The paragraph is conjunctive and this fact attests to ALL of it: the individual claims no para. 118(1)(a) spousal deduction for the year; AND at some time in the year (i) is either unmarried and not living common-law, or is married/common-law but neither supported nor lived with that spouse or partner and is not supported by them — note a taxpayer living with a high-income spouse computes a NIL spousal amount yet is still barred here; AND (ii) maintains a self-contained domestic establishment in which they live and actually supports there a person who is (A) resident in Canada except where that person is the individual's child, (B) wholly dependent for support, (C) related to the individual, and (D) except for a parent or grandparent, either under 18 or dependent by reason of mental or physical infirmity. ATTESTED — the corpus tests none of these limbs.",
    default: {
      value: false,
      rationale: "Assumed no eligible dependant claim absent contrary input",
    },
  },
  {
    id: "eligibleDependantNetIncome",
    type: "money",
    min: "0",
    description:
      "Income for the year of the person claimed as an eligible dependant — D.1 in the ITA para. 118(1)(b) formula 'D + D.01 - D.1', where D.1 'is the dependent person's income for the year', so it reduces the amount dollar for dollar. Statutory 'income for the year' is the s. 3 figure the dependant reports as net income (their line 23600). In dollars.",
    // no default — guessing $0 would maximize the eligible-dependant amount;
    // the engine refuses when the para. 118(1)(b) computation needs it and it
    // is absent
  },
  {
    id: "numChildrenUnder7",
    type: "int",
    min: "0",
    description:
      "Number of ITA s. 63(3) 'eligible children' under 7 years of age at the end of the year — the $8,000 annual child care expense amount band (subpara. 63(3)(b)(i) of that definition). A child in respect of whom the s. 118.3 disability amount may be deducted goes in numChildrenWithDisabilityCert instead.",
    default: {
      value: "0",
      rationale: "Assumed no children under 7 absent contrary input",
    },
  },
  {
    id: "numOtherEligibleChildren",
    type: "int",
    min: "0",
    description:
      "Number of ITA s. 63(3) 'eligible children' who are neither under 7 at the end of the year nor eligible for the s. 118.3 disability amount — the $5,000 annual child care expense amount band (subpara. 63(3)(b)(ii)). An 'eligible child' of a taxpayer (s. 63(3)) must FIRST be (a) a child of the taxpayer or of the taxpayer's spouse or common-law partner, or (b) a child dependent on the taxpayer or that spouse or partner for support and whose income for the year does not exceed the amount determined for F in s. 118(1.1) — AND THEN satisfy (c) being under 16 at any time in the year, or (d) being dependent on the taxpayer or that spouse or partner and having a mental or physical infirmity. Limbs (a)/(b) are as necessary as (c)/(d).",
    default: {
      value: "0",
      rationale: "Assumed no other eligible children absent contrary input",
    },
  },
  {
    id: "numChildrenWithDisabilityCert",
    type: "int",
    min: "0",
    description:
      "Number of ITA s. 63(3) 'eligible children' in respect of whom an amount may be deducted under s. 118.3 — the $11,000 annual child care expense amount band (para. (a) of that definition). Counted here INSTEAD of in numChildrenUnder7 / numOtherEligibleChildren, never in both.",
    default: {
      value: "0",
      rationale:
        "Assumed no children eligible for the disability amount absent contrary input",
    },
  },
  {
    id: "numDependantsUnder19",
    type: "int",
    min: "0",
    description:
      "Number of ITA s. 122.7(1) 'eligible dependants' for the Canada Workers Benefit: children of the taxpayer who, at the end of the year, resided with the taxpayer, were under 19 years of age, and were not themselves CWB 'eligible individuals'. The s. 122.7(2) formula uses only whether this count is positive — it selects the with-spouse-or-dependant basic amount and phase-out threshold — but the count is carried for Schedule 6 and the milestone-2 benefit targets.",
    default: {
      value: "0",
      rationale: "Assumed no dependants under 19 absent contrary input",
    },
  },

  // ---- income ----
  {
    id: "employmentIncome",
    type: "money",
    min: "0",
    description:
      "Employment income (ITA s. 5; T4 box 14; T1 line 10100), in dollars.",
    // no default — the engine must never guess income
  },
  {
    id: "selfEmploymentIncome",
    type: "money",
    min: "0",
    description:
      "Net self-employment (business/professional) income (ITA s. 9; T1 lines 13500–14300), in dollars. Feeds Schedule 8 CPP on self-employment.",
    default: {
      value: "0",
      rationale: "Assumed no self-employment income absent contrary input",
    },
  },
  {
    id: "eligibleDividends",
    type: "money",
    min: "0",
    description:
      "ACTUAL amount of eligible dividends from taxable Canadian corporations (T5 box 24) — the corpus applies the 38% gross-up (ITA s. 82(1)(b)(ii)) and the 6/11 dividend tax credit (s. 121). In dollars.",
    default: {
      value: "0",
      rationale: "Assumed no eligible dividends absent contrary input",
    },
  },
  {
    id: "nonEligibleDividends",
    type: "money",
    min: "0",
    description:
      "ACTUAL amount of non-eligible (other than eligible) dividends (T5 box 10) — the corpus applies the 15% gross-up (ITA s. 82(1)(b)(i)) and the 9/13 dividend tax credit (s. 121). In dollars.",
    default: {
      value: "0",
      rationale: "Assumed no non-eligible dividends absent contrary input",
    },
  },
  {
    id: "interestIncome",
    type: "money",
    min: "0",
    description:
      "Interest income (ITA para. 12(1)(c)) and other investment income reported on T1 line 12100, in dollars. Para. 12(1)(c) covers interest only; the line's other components (e.g. foreign investment income, income from trusts) arise under other inclusion provisions and need their own citations when modelled.",
    default: {
      value: "0",
      rationale: "Assumed no interest income absent contrary input",
    },
  },
  {
    id: "capitalGains",
    type: "money",
    min: "0",
    description:
      "Net capital gains realized in the year BEFORE the inclusion rate (Schedule 3 total) — the corpus applies the 1/2 inclusion (ITA ss. 38–39; the 2024 proposed 2/3 increase was cancelled — inclusion stays 1/2 for TY2025). Losses out of scope for v1. In dollars.",
    default: {
      value: "0",
      rationale: "Assumed no capital gains absent contrary input",
    },
  },
  {
    id: "taxablePensionIncome",
    type: "money",
    min: "0",
    description:
      "Taxable pension and superannuation income other than CPP/QPP and OAS (T1 line 11500, e.g. RPP/RRIF payments), in dollars. Gates the pension income amount (ITA s. 118(3)).",
    default: {
      value: "0",
      rationale: "Assumed no pension income absent contrary input",
    },
  },
  {
    id: "rrspWithdrawals",
    type: "money",
    min: "0",
    description:
      "Benefits received in the year out of or under registered retirement savings plans (ITA s. 146(8); T4RSP; T1 line 12900), in dollars. EXCLUDES Home Buyers' Plan and Lifelong Learning Plan withdrawals, which are 'excluded withdrawals' as defined in ss. 146.01(1)/146.02(1) and are not income under s. 146(8). Enter the GROSS amount before withholding: tax withheld at source is deemed by s. 153(3) to have been received by the taxpayer, so it forms part of the s. 146(8) income inclusion; the withholding is claimed separately as tax paid on account, not netted against this amount.",
    default: {
      value: "0",
      rationale: "Assumed no RRSP withdrawals absent contrary input",
    },
  },
  {
    id: "cppQppBenefits",
    type: "money",
    min: "0",
    description:
      "CPP or QPP benefits received (T4A(P); T1 line 11400), in dollars.",
    default: {
      value: "0",
      rationale: "Assumed no CPP/QPP benefits absent contrary input",
    },
  },
  {
    id: "oasBenefits",
    type: "money",
    min: "0",
    description:
      "Old Age Security pension received (T4A(OAS); T1 line 11300), in dollars. Subject to the OAS recovery tax (ITA Part I.2, s. 180.2).",
    default: {
      value: "0",
      rationale: "Assumed no OAS benefits absent contrary input",
    },
  },
  {
    id: "eiBenefits",
    type: "money",
    min: "0",
    description:
      "Employment Insurance and other benefits received (T4E; T1 line 11900), in dollars. Subject to the EI benefit repayment (clawback).",
    default: {
      value: "0",
      rationale: "Assumed no EI benefits absent contrary input",
    },
  },

  // ---- deductions ----
  {
    id: "rrspDeduction",
    type: "money",
    min: "0",
    description:
      "RRSP deduction claimed (ITA s. 146(5); T1 line 20800), in dollars. The s. 146(1) 'RRSP deduction limit' (contribution room) is ATTESTED by the input — the engine does not validate room in v1.",
    default: {
      value: "0",
      rationale: "Assumed no RRSP deduction absent contrary input",
    },
  },
  {
    id: "unionDues",
    type: "money",
    min: "0",
    description:
      "Annual union, professional, and like dues deductible under ITA para. 8(1)(i) — annual professional membership dues whose payment was necessary to maintain a professional status recognized by statute (subpara. (i)), annual trade-union dues (subparas. (iv)–(v)), parity or advisory committee dues required under provincial law (subpara. (vi)), and professions-board dues (subpara. (vii)) — to the extent the taxpayer has not been reimbursed AND is not entitled to be reimbursed in respect thereof (closing words of para. 8(1)(i)) (T4 box 44 or receipts; T1 line 21200). In dollars.",
    default: {
      value: "0",
      rationale: "Assumed no union or professional dues absent contrary input",
    },
  },
  {
    id: "childcareExpenses",
    type: "money",
    min: "0",
    description:
      "Child care expenses paid in the year for an eligible child (ITA s. 63; Form T778; T1 line 21400), in dollars. The corpus applies the para. 63(1)(e) ceiling — the lesser of 2/3 of earned income and the total of the annual child care expense amounts implied by the numChildrenUnder7 / numOtherEligibleChildren / numChildrenWithDisabilityCert counts — and the s. 63(2) rule that the lower-income supporting person normally makes the claim.",
    default: {
      value: "0",
      rationale: "Assumed no child care expenses absent contrary input",
    },
  },

  // ---- credit inputs ----
  {
    id: "tuitionFees",
    type: "money",
    min: "0",
    description:
      "Eligible tuition fees for the year (ITA s. 118.5; T2202; Schedule 11), in dollars. Carryforward/transfer mechanics deferred.",
    default: {
      value: "0",
      rationale: "Assumed no tuition fees absent contrary input",
    },
  },
  {
    id: "medicalExpenses",
    type: "money",
    min: "0",
    description:
      "Eligible medical expenses for any 12-month period ending in the year (ITA s. 118.2) — the corpus applies the lesser-of 3%-of-net-income / indexed-dollar floor. In dollars.",
    default: {
      value: "0",
      rationale: "Assumed no medical expenses absent contrary input",
    },
  },
  {
    id: "charitableDonations",
    type: "money",
    min: "0",
    description:
      "Total charitable donations to registered charities (ITA s. 118.1; Schedule 9), in dollars. The corpus applies the tiered credit (lowest-rate first $200 / 29% / 33% top-bracket tranche) and the 75%-of-net-income limit.",
    default: {
      value: "0",
      rationale: "Assumed no charitable donations absent contrary input",
    },
  },
  {
    id: "studentLoanInterest",
    type: "money",
    min: "0",
    description:
      "Interest paid on qualifying government student loans (ITA s. 118.62; T1 line 31900), in dollars.",
    default: {
      value: "0",
      rationale: "Assumed no student loan interest absent contrary input",
    },
  },
  {
    id: "hasDisabilityTaxCert",
    type: "bool",
    description:
      "A medical practitioner has certified in prescribed form (Form T2201) that the taxpayer has a severe and prolonged impairment in physical or mental functions meeting ITA para. 118.3(1)(a.2) or (a.3), and the certificate has been filed with the Minister (para. 118.3(1)(b)) — gates the disability amount (T1 line 31600) and the CWB disability supplement (s. 122.7(3), which requires that the individual 'may deduct an amount under subsection 118.3(1)'). NOT sufficient alone: para. 118.3(1)(c) is a third conjunctive condition — no amount in respect of remuneration for an attendant, or care in a nursing home, in respect of the individual may be included in a s. 118.2 deduction claimed by anyone (otherwise than because of para. 118.2(2)(b.1)). A rule granting either credit must also check that condition; medicalExpenses is an undifferentiated total that could contain such amounts.",
    default: {
      value: false,
      rationale:
        "Assumed no certified disability tax credit eligibility absent contrary input",
    },
  },

  // ---- payroll ----
  {
    id: "cppContributionsPaid",
    type: "money",
    min: "0",
    description:
      "Total employee CPP (or QPP) contributions withheld on employment income for the year (T4 boxes 16 + 16A, or 17 + 17A), in dollars. Schedule 8 splits this: the base contribution under CPP s. 8(1) supports the credit in ITA para. 118.7(b) (T1 line 30800), while the enhanced contributions under CPP ss. 8(1.1)/(1.2) are DEDUCTED under ITA para. 60(e.1) (T1 line 22215) rather than credited. Contributions on self-employment earnings are computed by the corpus from selfEmploymentIncome, not entered here.",
    default: {
      value: "0",
      rationale:
        "Assumed no CPP/QPP contributions withheld absent contrary input",
    },
  },
  {
    id: "eiPremiumsPaid",
    type: "money",
    min: "0",
    description:
      "Employee Employment Insurance premiums withheld on employment income for the year (T4 box 18; T1 line 31200), in dollars — the ITA para. 118.7(a) credit, which the statute caps at the maximum premiums payable by the individual for the year under the Employment Insurance Act. Quebec parental insurance plan premiums, credited separately under paras. 118.7(a.1)/(a.2), are not modelled in v1.",
    default: {
      value: "0",
      rationale: "Assumed no EI premiums withheld absent contrary input",
    },
  },
];

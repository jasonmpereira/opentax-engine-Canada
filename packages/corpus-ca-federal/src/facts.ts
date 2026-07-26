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
      "Interest and other investment income (ITA para. 12(1)(c); T1 line 12100), in dollars.",
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
];

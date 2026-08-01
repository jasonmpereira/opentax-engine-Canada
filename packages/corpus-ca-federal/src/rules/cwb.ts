/**
 * Canada Workers Benefit — ITA s. 122.7, CRA Schedule 6. T1 line 45300.
 * REFUNDABLE, so it is not part of net federal tax (line 42000).
 *
 * ── WHY AB, QC AND NU REFUSE, AND WHY THAT IS PERMANENT ──
 * Those three provinces have reconfigured amounts. The power is ITA s. 122.71:
 *
 *   "The Minister of Finance may enter into an agreement with the government
 *    of a province whereby the amounts determined under subsections 122.7(2)
 *    and (3) ... shall ... be replaced by amounts determined in accordance
 *    with the agreement."
 *
 * That is an AGREEMENT power, not a regulation-making power. There is no
 * "prescribed", no delegation to the Income Tax Regulations, and the
 * substituted amounts are therefore never registered as a statutory
 * instrument. Confirmed negatively: the ITR contains zero occurrences of
 * 122.7 or 122.71, in our committed copy and in the Justice Canada mirror's,
 * and the mirror's own index shows the ITR is the only income-tax regulation
 * in the federal corpus. No future consolidation will ever carry these
 * figures.
 *
 * So the AB/QC/NU amounts are not merely blocked by the canada.ca egress
 * wall — they are not derivable from law at all. They exist only on CRA's
 * separate forms 5009-S6 (AB), 5014-S6 (NU) and 5005-S6 (QC). The standard
 * form is titled "Schedule 6 – Canada Workers Benefit (for all except QC, AB,
 * and NU)", which is the scope condition this rule encodes.
 *
 * The refusal is therefore well-founded rather than a placeholder: it cites a
 * real provision explaining why the number cannot be obtained. Silently
 * applying the standard amounts to an Alberta filer would be a wrong answer
 * with a confident citation, which is the failure this project exists to
 * prevent. Note CRA's guide does not even warn the reader that the three
 * provinces differ.
 *
 * ── APPROXIMATIONS, STATED ──
 * Two s. 122.7(1) defined terms are approximated, because no fact expresses
 * them exactly:
 *   "working income"        — modelled as employment + business income. The
 *                             definition also reaches certain s. 56 amounts.
 *   "adjusted net income"   — modelled as net income (line 23600). The
 *                             definition adjusts for split income and certain
 *                             deductions the corpus cannot see.
 * Both are exact for an ordinary employment or self-employment return.
 *
 * The "eligible spouse" test is likewise approximated by marital status: the
 * statute requires the spouse to be an eligible individual in their own right.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });
const money = (cents: string): Expr => ({ kind: "money", cents });
const c = (dollars: number): string => String(BigInt(dollars) * 100n);

const CITE = {
  source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 122.7; CRA Schedule 6 (5000-S6, 2025)",
  section: "s. 122.7(2)-(3)",
  url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-122.7.html",
};

/** True when the filer has an eligible spouse or an eligible dependant. */
const HAS_FAMILY: Expr = {
  kind: "or",
  args: [
    { kind: "cmp", op: "eq", left: fact("maritalStatus"), right: { kind: "enum", value: "married" } },
    { kind: "cmp", op: "eq", left: fact("maritalStatus"), right: { kind: "enum", value: "common-law" } },
    fact("hasEligibleDependant"),
  ],
};

/** AB, QC and NU have s. 122.71 agreement amounts this corpus cannot obtain. */
const AGREEMENT_PROVINCE: Expr = {
  kind: "or",
  args: ["AB", "QC", "NU"].map((p) => ({
    kind: "cmp" as const,
    op: "eq" as const,
    left: fact("province"),
    right: { kind: "enum" as const, value: p },
  })),
};

const REFUSE_AGREEMENT_PROVINCE = {
  kind: "unsupported" as const,
  reason:
    "The Canada Workers Benefit is reconfigured for Alberta, Quebec and Nunavut under an ITA s. 122.71 agreement between the Minister of Finance and the province. That is an agreement power, not a regulation-making power: the substituted amounts are never registered as a statutory instrument and appear in no consolidation — the Income Tax Regulations contain no reference to s. 122.7 at all. They exist only on CRA forms 5009-S6 (AB), 5014-S6 (NU) and 5005-S6 (QC), none of which this corpus holds. Applying the standard amounts here would produce a wrong answer with a confident citation.",
};

export const cwbRules: Rule[] = [
  {
    id: "ca.federal.cwb_working_income",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Working income for the CWB (Schedule 6 line 5)",
    citation: {
      ...CITE,
      section: "s. 122.7(1)",
      excerpt:
        "working income of an individual for a taxation year means the total of all amounts each of which is … the individual's income for the year from an office or employment … or from a business carried on by the individual…",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: { kind: "add", args: [fact("employmentIncome"), fact("selfEmploymentIncome")] },
  },
  {
    id: "ca.federal.cwb_basic",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Canada Workers Benefit, basic amount (Schedule 6 Step 2)",
    citation: {
      ...CITE,
      excerpt:
        "…the amount determined by the formula A − B where A is (a) if the individual has neither an eligible spouse nor an eligible dependant for the taxation year, the lesser of $1,395 and 27% of the amount, if any, by which the individual's working income for the taxation year exceeds $3,000 … and B is (a) … 15% of the amount, if any, by which the individual's adjusted net income for the taxation year exceeds $22,944 … [2019 base amounts; the indexed TY2025 figures are on CRA Schedule 6 lines 21 and 24]",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    parameters: {
      // $3,000 and the 27% / 15% rates are NOT in the s. 117.1(2) indexation
      // list — they are fixed statutory constants, which CRA's form confirms
      // by pre-filling them unchanged. The maxima and thresholds ARE indexed
      // (s. 117.1(2)(q)) and come from the TY2025 form.
      exclusion: { value: c(3000), type: "money" },
      maxSingle: { value: c(1633), type: "money" },
      maxFamily: { value: c(2813), type: "money" },
      thresholdSingle: { value: c(26855), type: "money" },
      thresholdFamily: { value: c(30639), type: "money" },
    },
    formula: {
      kind: "if",
      cond: AGREEMENT_PROVINCE,
      then: REFUSE_AGREEMENT_PROVINCE,
      else: {
        kind: "max0",
        arg: {
          kind: "sub",
          // A: lesser of the maximum and 27% of working income over $3,000
          left: {
            kind: "min",
            args: [
              {
                kind: "if",
                cond: HAS_FAMILY,
                then: { kind: "param", name: "maxFamily" },
                else: { kind: "param", name: "maxSingle" },
              },
              {
                kind: "mulRate",
                base: {
                  kind: "max0",
                  arg: {
                    kind: "sub",
                    left: rule("ca.federal.cwb_working_income"),
                    right: { kind: "param", name: "exclusion" },
                  },
                },
                rate: { num: "27", den: "100" },
                round: "half-up",
              },
            ],
          },
          // B: 15% of adjusted net income over the threshold
          right: {
            kind: "mulRate",
            base: {
              kind: "max0",
              arg: {
                kind: "sub",
                left: rule("ca.federal.net_income"),
                right: {
                  kind: "if",
                  cond: HAS_FAMILY,
                  then: { kind: "param", name: "thresholdFamily" },
                  else: { kind: "param", name: "thresholdSingle" },
                },
              },
            },
            rate: { num: "15", den: "100" },
            round: "half-up",
          },
        },
      },
    },
  },
  {
    id: "ca.federal.cwb_disability_supplement",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Canada Workers Benefit, disability supplement (Schedule 6 Step 3)",
    citation: {
      ...CITE,
      excerpt:
        "…the amount determined by the formula C − D where C is the lesser of $720 and 27% of the amount, if any, by which the individual's working income for the taxation year exceeds $1,150, and D is (a) … 15% of the amount, if any, by which the individual's adjusted net income for the taxation year exceeds $32,244 … [2019 base amounts; indexed TY2025 figures on CRA Schedule 6 lines 34 and 36]",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    parameters: {
      floor: { value: c(1150), type: "money" }, // not indexed
      maxSupplement: { value: c(843), type: "money" },
      thresholdSingle: { value: c(37740), type: "money" },
      thresholdFamily: { value: c(49389), type: "money" },
    },
    formula: {
      kind: "if",
      cond: AGREEMENT_PROVINCE,
      then: REFUSE_AGREEMENT_PROVINCE,
      else: {
        kind: "if",
        cond: fact("hasDisabilityTaxCert"),
        then: {
          kind: "max0",
          arg: {
            kind: "sub",
            left: {
              kind: "min",
              args: [
                { kind: "param", name: "maxSupplement" },
                {
                  kind: "mulRate",
                  base: {
                    kind: "max0",
                    arg: {
                      kind: "sub",
                      left: rule("ca.federal.cwb_working_income"),
                      right: { kind: "param", name: "floor" },
                    },
                  },
                  rate: { num: "27", den: "100" },
                  round: "half-up",
                },
              ],
            },
            // 15%, or 7.5% where an eligible spouse is ALSO DTC-entitled —
            // halved because each spouse claims a supplement on their own
            // Schedule 6. No fact expresses the spouse's DTC status, so the
            // full 15% is used; that is the conservative direction (a larger
            // reduction would understate the supplement).
            right: {
              kind: "mulRate",
              base: {
                kind: "max0",
                arg: {
                  kind: "sub",
                  left: rule("ca.federal.net_income"),
                  right: {
                    kind: "if",
                    cond: HAS_FAMILY,
                    then: { kind: "param", name: "thresholdFamily" },
                    else: { kind: "param", name: "thresholdSingle" },
                  },
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
  },
  {
    id: "ca.federal.cwb",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Canada Workers Benefit, total (line 45300)",
    citation: {
      ...CITE,
      excerpt:
        "…is deemed to have paid at the end of the year on account of the individual's tax payable under this Part for the taxation year [s. 122.7(2), (3) — a REFUNDABLE amount, reported at T1 line 45300 and not part of net federal tax at line 42000]",
    },
    effectiveFrom: "2025-01-01",
    effectiveTo: "2026-01-01",
    output: { type: "money" },
    formula: {
      kind: "add",
      args: [rule("ca.federal.cwb_basic"), rule("ca.federal.cwb_disability_supplement")],
    },
  },
];

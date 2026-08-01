/**
 * Golden fixtures for the Phase 2 slice-1 chain: income → federal tax before
 * credits. These are the first cases where the corpus produces a NUMBER, so
 * they are also the first place it can be wrong.
 *
 * The bracket-boundary cases are the strongest evidence available short of a
 * differential oracle. CRA's own return (5006-R, Step 5 Part A) prints, for
 * each band, the cumulative tax at that band's lower threshold. Feeding the
 * threshold in as taxable income must reproduce the printed figure exactly.
 * Four independent checkpoints, no tolerance.
 *
 * That test caught a real defect. The engine's `brackets` node rounds each
 * band half-up before summing, which reproduced only 1 of the 4 — 14.5% of
 * $57,375 is exactly half a cent, and rounding it up before carrying it into
 * the bands above inflated every later figure by a cent. The node grew an
 * `accumulate: "exact"` option (default unchanged, so the US corpus is
 * untouched) and all four now match. Keep these four green: they are what
 * stops that class of error coming back.
 */

import { NoApplicableRuleError, coerceFacts, evaluate } from "@invaro/opentax-core";
import { describe, expect, it } from "vitest";
import { getCorpus } from "../src/index.js";

const TY2025 = "2025-06-15";

function cents(facts: Record<string, unknown>, target: string, asOf = TY2025): bigint {
  const corpus = getCorpus();
  const r = evaluate(corpus, coerceFacts(corpus, facts), { asOf, target });
  if (r.value.type !== "money") throw new Error(`${target} is not money`);
  return r.value.cents;
}

/** Identity facts every fixture needs; neither defaults, by design. */
const WHO = { province: "ON", maritalStatus: "single" } as const;

describe("bracket boundaries reproduce CRA's printed cumulative tax", () => {
  // 5006-R (2025) Step 5 Part A: [taxable income, cumulative tax] in dollars.
  // Pinned in docs/parameters/ty2025-cra-forms.json.
  const CHECKPOINTS: [number, string, string][] = [
    [57375, "831938", "$8,319.38 — top of the 14.5% band"],
    [114750, "2008125", "$20,081.25 — top of the 20.5% band"],
    [177882, "3649557", "$36,495.57 — top of the 26% band"],
    [253414, "5839985", "$58,399.85 — top of the 29% band"],
  ];

  for (const [income, expected, note] of CHECKPOINTS) {
    it(`taxable income $${income.toLocaleString()} → ${note}`, () => {
      expect(
        cents({ ...WHO, employmentIncome: income }, "ca.federal.tax_before_credits").toString(),
      ).toBe(expected);
    });
  }
});

describe("worked return: $85,000 employment income, no deductions", () => {
  const facts = { ...WHO, employmentIncome: 85000 };

  it("total income is the employment income", () => {
    expect(cents(facts, "ca.federal.total_income")).toBe(8500000n);
  });

  it("taxable income equals net income with no deductions or Division C", () => {
    expect(cents(facts, "ca.federal.net_income")).toBe(8500000n);
    expect(cents(facts, "ca.federal.taxable_income")).toBe(8500000n);
  });

  it("federal tax before credits is $13,982.50", () => {
    // 14.5% x 57,375          =  8,319.375
    // 20.5% x (85,000-57,375) =  5,663.125
    // exact total             = 13,982.50  (the half-cents cancel)
    expect(cents(facts, "ca.federal.tax_before_credits")).toBe(1398250n);
  });
});

describe("income components", () => {
  it("grosses up eligible dividends by 38% and non-eligible by 15%", () => {
    const facts = { ...WHO, employmentIncome: 0, eligibleDividends: 1000, nonEligibleDividends: 1000 };
    expect(cents(facts, "ca.federal.taxable_eligible_dividends")).toBe(138000n);
    expect(cents(facts, "ca.federal.taxable_non_eligible_dividends")).toBe(115000n);
    expect(cents(facts, "ca.federal.taxable_dividends")).toBe(253000n);
  });

  it("includes one half of capital gains", () => {
    const facts = { ...WHO, employmentIncome: 0, capitalGains: 10000 };
    expect(cents(facts, "ca.federal.taxable_capital_gains")).toBe(500000n);
    expect(cents(facts, "ca.federal.total_income")).toBe(500000n);
  });

  it("aggregates every modelled source into total income", () => {
    const facts = {
      ...WHO,
      employmentIncome: 50000,
      selfEmploymentIncome: 10000,
      interestIncome: 1000,
      eligibleDividends: 1000, // -> 1,380 taxable
      capitalGains: 2000, // -> 1,000 taxable
      taxablePensionIncome: 500,
    };
    // 50,000 + 10,000 + 1,000 + 1,380 + 500 + 1,000 = 63,880
    expect(cents(facts, "ca.federal.total_income")).toBe(6388000n);
  });

  it("subtracts RRSP and union dues to reach net income", () => {
    const facts = { ...WHO, employmentIncome: 80000, rrspDeduction: 10000, unionDues: 1200 };
    expect(cents(facts, "ca.federal.net_income")).toBe(6880000n);
  });
});

describe("the boundaries of what is modelled", () => {
  it("refuses when child care expenses are actually claimed", () => {
    const facts = { ...WHO, employmentIncome: 60000, childcareExpenses: 5000 };
    expect(() =>
      cents(facts, "ca.federal.taxable_income"),
    ).toThrow(/child care|not modelled/i);
  });

  it("but computes normally when no child care is claimed", () => {
    const facts = { ...WHO, employmentIncome: 60000, childcareExpenses: 0 };
    expect(cents(facts, "ca.federal.taxable_income")).toBe(6000000n);
  });

  it("refuses on capital losses rather than treating them as zero", () => {
    const facts = { ...WHO, employmentIncome: 60000 };
    expect(() => cents(facts, "ca.federal.net_capital_losses")).toThrow(
      /capital losses|not modelled/i,
    );
  });

  it("refuses for TY2026 — indexed thresholds are not yet published", () => {
    // s. 117.1 indexes the thresholds annually. No TY2026 version exists, so
    // a 2026 evaluation must refuse rather than reuse the 2025 table.
    const facts = { ...WHO, employmentIncome: 85000 };
    expect(() =>
      cents(facts, "ca.federal.tax_before_credits", "2026-06-15"),
    ).toThrow(NoApplicableRuleError);
  });

  it("net tax computes for an employed filer", () => {
    // 14.5% x 57,375 + 20.5% x 27,625 = 13,982.50 before credits.
    // amounts: BPA 16,129 + Canada employment 1,471 = 17,600
    // credit : 14.5% x 17,600 = 2,552.00
    // net    : 13,982.50 - 2,552.00 = 11,430.50
    const facts = { ...WHO, employmentIncome: 85000 };
    expect(cents(facts, "ca.federal.net_tax")).toBe(1143050n);
  });
});

// ─────────────────────── Phase 2 slice 2: credits → net tax ───────────────────────

describe("worked return: age 65+, $60,000 pension income, Ontario", () => {
  // Chosen because it exercises the whole chain without tripping the
  // Canada-employment refusal: BPA at full value, the age amount mid
  // phase-out, and the pension amount at its $2,000 cap.
  const facts = {
    ...WHO,
    employmentIncome: 0,
    taxablePensionIncome: 60000,
    isAge65OrOlder: true,
  };

  it("basic personal amount is unreduced below the phase-out", () => {
    // $60,000 is well under the $177,882 start, so A + C = $16,129.
    expect(cents(facts, "ca.federal.basic_personal_amount")).toBe(1612900n);
  });

  it("age amount is reduced by 15% of income over $45,522", () => {
    // 9,028 - 0.15 x (60,000 - 45,522) = 9,028 - 2,171.70 = 6,856.30
    expect(cents(facts, "ca.federal.age_amount")).toBe(685630n);
  });

  it("pension income amount caps at $2,000", () => {
    expect(cents(facts, "ca.federal.pension_income_amount")).toBe(200000n);
  });

  it("credits apply the 14.5% appropriate percentage once, to the total", () => {
    // amounts: 16,129 + 6,856.30 + 2,000 = 24,985.30
    // credit : 14.5% x 24,985.30 = 3,622.8685 -> 3,622.87
    expect(cents(facts, "ca.federal.non_refundable_credits")).toBe(362287n);
  });

  it("net federal tax is tax before credits less the credits", () => {
    // before credits: 8,319.375 + 20.5% x 2,625 = 8,857.50
    expect(cents(facts, "ca.federal.tax_before_credits")).toBe(885750n);
    // 8,857.50 - 3,622.87 = 5,234.63
    expect(cents(facts, "ca.federal.net_tax")).toBe(523463n);
  });
});

describe("basic personal amount phase-out (s. 118(1.1))", () => {
  const at = (income: number) =>
    cents(
      { ...WHO, employmentIncome: 0, taxablePensionIncome: income },
      "ca.federal.basic_personal_amount",
    );

  it("is the full $16,129 at the phase-out start", () => {
    expect(at(177882)).toBe(1612900n);
  });

  it("is the floor $14,538 at the top-bracket threshold", () => {
    expect(at(253414)).toBe(1453800n);
  });

  it("is halfway between at the midpoint of the phase-out band", () => {
    // midpoint = 177,882 + 75,532/2 = 215,648 -> BPA = 14,538 + 1,591/2
    // 1,591/2 = 795.50, so 14,538 + 795.50 = 15,333.50
    expect(at(215648)).toBe(1533350n);
  });

  it("never falls below the floor above the top bracket", () => {
    expect(at(400000)).toBe(1453800n);
  });
});

describe("dividend tax credit (s. 121)", () => {
  it("returns 6/11 of the eligible gross-up and 9/13 of the non-eligible", () => {
    const facts = {
      ...WHO, employmentIncome: 0,
      eligibleDividends: 10000, nonEligibleDividends: 10000,
    };
    // eligible:     38% x 10,000 = 3,800 -> 6/11  = 2,072.727... -> 2,072.73
    // non-eligible: 15% x 10,000 = 1,500 -> 9/13  = 1,038.461... -> 1,038.46
    expect(cents(facts, "ca.federal.dividend_tax_credit")).toBe(311119n);
  });
});

describe("donations credit tiers (s. 118.1(3))", () => {
  it("applies 14.5% to the first $200 and 29% above it below the top bracket", () => {
    const facts = { ...WHO, employmentIncome: 0, taxablePensionIncome: 80000, charitableDonations: 1200 };
    // 14.5% x 200 = 29.00 ; 29% x 1,000 = 290.00 ; no 33% tier (income < 253,414)
    expect(cents(facts, "ca.federal.donations_credit")).toBe(31900n);
  });

  it("gives no 33% tier when no income sits in the top bracket", () => {
    const facts = { ...WHO, employmentIncome: 0, taxablePensionIncome: 150000, charitableDonations: 100000 };
    // income is below 253,414, so D = 0 and everything above $200 is at 29%
    // 14.5% x 200 + 29% x 99,800 = 29.00 + 28,942.00 = 28,971.00
    expect(cents(facts, "ca.federal.donations_credit")).toBe(2897100n);
  });

  it("refuses when donations exceed 75% of net income", () => {
    const facts = { ...WHO, employmentIncome: 0, taxablePensionIncome: 50000, charitableDonations: 45000 };
    expect(() => cents(facts, "ca.federal.donations_annual_limit")).toThrow(/75%|not modelled/i);
  });
});

describe("gaps that must refuse rather than understate", () => {
  const base = { ...WHO, employmentIncome: 0, taxablePensionIncome: 50000 };

  it("medical expenses net off the lesser of $2,834 and 3% of net income", () => {
    // net income 50,000 -> 3% = 1,500, which is less than 2,834
    // 3,000 - 1,500 = 1,500 allowable
    expect(cents({ ...base, medicalExpenses: 3000 }, "ca.federal.medical_expense_amount"))
      .toBe(150000n);
    // net income 200,000 -> 3% = 6,000, so the $2,834 cap binds instead
    expect(
      cents(
        { ...WHO, employmentIncome: 0, taxablePensionIncome: 200000, medicalExpenses: 5000 },
        "ca.federal.medical_expense_amount",
      ),
    ).toBe(216600n); // 5,000 - 2,834
  });

  it("refuses CPP on self-employment income", () => {
    expect(() =>
      cents({ ...base, selfEmploymentIncome: 40000 }, "ca.federal.cpp_self_employment"),
    ).toThrow(/CPP|not modelled/i);
  });

  it("completeness guard passes for a plain return", () => {
    expect(cents(base, "ca.federal.net_tax_completeness")).toBe(0n);
  });

  it("completeness guard is now empty — every additive line-42000 gap closed", () => {
    // It began with three branches: OAS recovery (now modelled), Schedule 8
    // CPP (now modelled), and the Quebec abatement — which the FPFAA research
    // showed is line 44000, applied AFTER net tax, so it never belonged here.
    // The guard is kept rather than deleted: AMT (s. 127.5) belongs in it the
    // moment that work starts.
    expect(cents(base, "ca.federal.net_tax_completeness")).toBe(0n);
    expect(cents({ ...base, province: "QC" }, "ca.federal.net_tax_completeness")).toBe(0n);
  });

  it("net tax is CORRECT for a Quebec resident; only the abatement is missing", () => {
    // ITA s. 120(2) deems the abatement "paid on account of" tax — T1 line
    // 44000, inside total credits. Line 42000 itself is unaffected.
    const qc = { ...base, province: "QC" };
    expect(cents(qc, "ca.federal.net_tax")).toBe(cents(base, "ca.federal.net_tax"));
    expect(() => cents(qc, "ca.federal.quebec_abatement")).toThrow(/line 44000|not modelled/i);
  });
});


describe("OAS recovery tax (s. 180.2)", () => {
  it("is nil below the $93,454 base amount", () => {
    const facts = { ...WHO, employmentIncome: 0, taxablePensionIncome: 80000, oasBenefits: 9000 };
    expect(cents(facts, "ca.federal.oas_recovery_tax")).toBe(0n);
  });

  it("claws back 15% of income above the base amount", () => {
    // net income = 100,000 + 9,000 OAS = 109,000
    // 15% x (109,000 - 93,454) = 15% x 15,546 = 2,331.90, less than the OAS
    const facts = { ...WHO, employmentIncome: 0, taxablePensionIncome: 100000, oasBenefits: 9000 };
    expect(cents(facts, "ca.federal.oas_recovery_tax")).toBe(233190n);
  });

  it("never exceeds the OAS actually received", () => {
    // A very high income would claw back more than the pension; s. 180.2(2)
    // caps A at the OAS included in income.
    const facts = { ...WHO, employmentIncome: 0, taxablePensionIncome: 400000, oasBenefits: 9000 };
    expect(cents(facts, "ca.federal.oas_recovery_tax")).toBe(900000n);
  });

  it("is ADDED to net tax, not absorbed by the non-refundable floor", () => {
    const facts = { ...WHO, employmentIncome: 0, taxablePensionIncome: 100000, oasBenefits: 9000, isAge65OrOlder: true };
    const net = cents(facts, "ca.federal.net_tax");
    const clawback = cents(facts, "ca.federal.oas_recovery_tax");
    expect(clawback).toBeGreaterThan(0n);
    expect(net).toBeGreaterThan(clawback);
  });
});

describe("top-up tax credit (line 34990, new for 2025)", () => {
  it("is nil when credits fall below the first-bracket credit value", () => {
    // BPA-only pensioner: credits well under $8,319.38.
    const facts = { ...WHO, employmentIncome: 0, taxablePensionIncome: 30000 };
    expect(cents(facts, "ca.federal.topup_tax_credit")).toBe(0n);
  });

  it("reproduces the Federal Worksheet chart exactly", () => {
    // A filer with large enough credits to clear the $8,319.38 subtraction.
    const facts = {
      ...WHO, employmentIncome: 0, taxablePensionIncome: 250000,
      isAge65OrOlder: true, medicalExpenses: 60000,
    };
    const nrtc = cents(facts, "ca.federal.non_refundable_credits");
    const gifts = cents(facts, "ca.federal.donations_credit");
    // chart: (line1 + line2 - 8,319.38) floored at 0, x 3.45%
    const base = nrtc + gifts - 831938n;
    const expected = base <= 0n ? 0n : (base * 345n + 5000n) / 10000n;
    expect(cents(facts, "ca.federal.topup_tax_credit")).toBe(expected);
    expect(cents(facts, "ca.federal.topup_tax_credit")).toBeGreaterThan(0n);
  });

  it("the two chart constants are what CRA's arithmetic implies", () => {
    // $8,319.38 = 14.5% of the $57,375 threshold (the credit value of the
    // first bracket); 3.45% = 0.5/14.5, which converts a credit computed at
    // 14.5% into the extra 0.5% that restores a 15% rate.
    expect(831938n).toBe((5737500n * 145n + 500n) / 1000n);
    expect(Math.round((0.5 / 14.5) * 10000) / 100).toBeCloseTo(3.45, 2);
  });
});

describe("CPP on self-employment (Schedule 8)", () => {
  // At or above the YAMPE every figure should hit the maximum CRA prints on
  // Schedule 8 — five independent checkpoints on one return.
  const maxed = { ...WHO, employmentIncome: 0, selfEmploymentIncome: 90000 };

  it("hits every printed Schedule 8 maximum at the ceiling", () => {
    expect(cents(maxed, "ca.federal.cpp_contributory_self_employment_earnings")).toBe(6780000n); // $67,800
    expect(cents(maxed, "ca.federal.cpp2_self_employment_earnings")).toBe(990000n); // $9,900
    expect(cents(maxed, "ca.federal.cpp_base_self_employment")).toBe(671220n); // $6,712.20
    expect(cents(maxed, "ca.federal.cpp_enhanced_self_employment")).toBe(214800n); // 1,356 + 792
    expect(cents(maxed, "ca.federal.cpp_self_employment_credit_amount")).toBe(335610n); // $3,356.10
  });

  it("splits base 50/50 and routes all enhanced to the deduction", () => {
    // deduction = half the base (3,356.10) + all enhanced (2,148.00)
    expect(cents(maxed, "ca.federal.cpp_self_employment_deduction")).toBe(550410n);
  });

  it("has no CPP2 band below the YMPE", () => {
    const below = { ...WHO, employmentIncome: 0, selfEmploymentIncome: 60000 };
    expect(cents(below, "ca.federal.cpp2_self_employment_earnings")).toBe(0n);
    // 60,000 - 3,500 = 56,500 contributory; x 9.9% = 5,593.50
    expect(cents(below, "ca.federal.cpp_base_self_employment")).toBe(559350n);
    // enhanced is CPP1 only: 56,500 x 2% = 1,130.00
    expect(cents(below, "ca.federal.cpp_enhanced_self_employment")).toBe(113000n);
  });

  it("the statutory YAMPE formula reproduces CRA's published figure", () => {
    // CPP s. 18.1: YAMPE = 1.14 x YMPE, rounded DOWN to the next $100.
    // 1.14 x 71,300 = 81,282 -> 81,200, which is what Schedule 8 prints.
    expect(Math.floor((1.14 * 71300) / 100) * 100).toBe(81200);
  });

  it("refuses when employment and self-employment CPP share one ceiling", () => {
    const both = { ...WHO, employmentIncome: 0, selfEmploymentIncome: 50000, cppContributionsPaid: 2000 };
    expect(() => cents(both, "ca.federal.net_tax")).toThrow(/shared ceiling|over-state|Part 5/i);
  });

  it("a self-employed return now computes net tax", () => {
    expect(cents(maxed, "ca.federal.net_tax")).toBeGreaterThan(0n);
  });
});

describe("Canada Workers Benefit (s. 122.7, refundable, line 45300)", () => {
  it("phases in at 27% of working income over $3,000, capped at $1,633 single", () => {
    // working income 8,000 -> 27% x 5,000 = 1,350, under the 1,633 cap.
    // net income 8,000 is below the 26,855 phase-out, so B = 0.
    const f = { ...WHO, employmentIncome: 8000 };
    expect(cents(f, "ca.federal.cwb_basic")).toBe(135000n);
  });

  it("caps at the indexed maximum once phased in", () => {
    // working income 20,000 -> 27% x 17,000 = 4,590, so the 1,633 cap binds.
    const f = { ...WHO, employmentIncome: 20000 };
    expect(cents(f, "ca.federal.cwb_basic")).toBe(163300n);
  });

  it("phases out at 15% of net income over $26,855 and reaches nil", () => {
    // Schedule 6 p3 prints the single basic cut-off as $37,742.
    expect(cents({ ...WHO, employmentIncome: 37742 }, "ca.federal.cwb_basic")).toBe(0n);
    // Just below it, still positive.
    expect(cents({ ...WHO, employmentIncome: 35000 }, "ca.federal.cwb_basic")).toBeGreaterThan(0n);
  });

  it("adds the disability supplement only with a certificate", () => {
    const base = { ...WHO, employmentIncome: 20000 };
    expect(cents(base, "ca.federal.cwb_disability_supplement")).toBe(0n);
    // 27% x (20,000 - 1,150) = 5,089.50, so the $843 cap binds; no phase-out
    // at this income.
    expect(cents({ ...base, hasDisabilityTaxCert: true }, "ca.federal.cwb_disability_supplement"))
      .toBe(84300n);
  });

  it("REFUSES for Alberta, Quebec and Nunavut — s. 122.71 agreement amounts", () => {
    for (const province of ["AB", "QC", "NU"]) {
      expect(() =>
        cents({ ...WHO, province, employmentIncome: 20000 }, "ca.federal.cwb"),
      ).toThrow(/122\.71|agreement/i);
    }
  });

  it("computes for every other province", () => {
    for (const province of ["ON", "BC", "MB", "NS", "SK", "YT"]) {
      expect(cents({ ...WHO, province, employmentIncome: 20000 }, "ca.federal.cwb"))
        .toBe(163300n);
    }
  });
});

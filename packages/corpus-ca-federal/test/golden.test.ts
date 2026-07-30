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

  it("still refuses for net tax — credits are slice 2", () => {
    const facts = { ...WHO, employmentIncome: 85000 };
    expect(() => cents(facts, "ca.federal.net_tax")).toThrow(NoApplicableRuleError);
  });
});

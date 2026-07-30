/**
 * THE property of this package: it never answers a question it cannot derive.
 *
 * Through Phase 1 this suite asserted that EVERYTHING refused, because the
 * corpus had no rules. Phase 2 changed that — `ca.federal.net_tax` now
 * computes — and the header of the previous version said what to do when it
 * did: replace the DEFAULT_TARGET refusal cases with fixture-driven
 * expectations rather than delete them. The fixtures live in golden.test.ts;
 * what remains here is the refusal contract itself, which got MORE interesting
 * once real rules landed, not less.
 *
 * There are now two distinct ways this corpus declines, and conflating them
 * would hide a real defect:
 *
 *   NoApplicableRuleError  no rule with that id is in force for that date.
 *                          Nothing was modelled. Asking for a benefit the
 *                          corpus has never heard of, or for TY2026 where no
 *                          bracket version exists.
 *
 *   NotModeledError        a rule EXISTS and was reached, but its formula hit
 *                          an `unsupported` node: the provision is deliberately
 *                          out of scope and the corpus refuses instead of
 *                          approximating. CPP on self-employment, child care,
 *                          capital losses, the 75% donation limit.
 *
 * The second is the one worth guarding hardest. Those rules sit INSIDE the
 * net-tax chain, so if an `unsupported` node were ever softened to a zero, the
 * corpus would keep answering and simply be wrong — the exact failure this
 * project exists to prevent.
 *
 * Imported from ../src rather than the package name: this package is inert by
 * design (no "build" script), so ./dist may not exist.
 */

import {
  FactValidationError,
  NoApplicableRuleError,
  NotModeledError,
  OpenTaxError,
  coerceFacts,
  evaluate,
} from "@invaro/opentax-core";
import { describe, expect, it } from "vitest";
import { DEFAULT_TARGET, getCorpus } from "../src/index.js";

/** Dates inside and outside TY2025 — behaviour must not drift by calendar. */
const AS_OF_TY2025 = "2025-06-15";

/**
 * An entirely ordinary TY2025 return for an employed filer. Every defaultless
 * fact that applies is supplied, so a refusal can never be dismissed as "you
 * just didn't give it enough input".
 */
const EMPLOYED_FILER = {
  province: "ON",
  maritalStatus: "single",
  birthYear: 1985,
  employmentIncome: 85000,
  spouseNetIncome: 0,
  interestIncome: 1200,
  rrspDeduction: 5000,
  charitableDonations: 500,
};

/** The same filer, but with pension income instead of employment income. */
const PENSIONER = {
  province: "ON",
  maritalStatus: "single",
  birthYear: 1955,
  employmentIncome: 0,
  spouseNetIncome: 0,
  taxablePensionIncome: 60000,
  isAge65OrOlder: true,
};

function run(facts: Record<string, unknown>, target: string, asOf = AS_OF_TY2025) {
  const corpus = getCorpus();
  return evaluate(corpus, coerceFacts(corpus, facts), { asOf, target });
}

describe("corpus loads", () => {
  it("getCorpus() succeeds and loads the Phase 2 rule set", () => {
    const corpus = getCorpus();
    expect(corpus.rules.length).toBeGreaterThan(0);
    expect(corpus.ruleHashes.size).toBe(corpus.rules.length);
    expect(corpus.facts.length).toBeGreaterThan(0);
    // The full chain, income through net tax, is present.
    for (const id of [
      "ca.federal.total_income",
      "ca.federal.net_income",
      "ca.federal.taxable_income",
      "ca.federal.tax_before_credits",
      "ca.federal.non_refundable_credits",
      "ca.federal.net_tax",
    ]) {
      expect(corpus.byId.has(id), `${id} should be loaded`).toBe(true);
    }
  });

  it("DEFAULT_TARGET is now modelled and answerable", () => {
    expect(DEFAULT_TARGET).toBe("ca.federal.net_tax");
    expect(getCorpus().byId.has(DEFAULT_TARGET)).toBe(true);
    const r = run(PENSIONER, DEFAULT_TARGET);
    expect(r.value.type).toBe("money");
  });
});

describe("an employed filer now computes end to end", () => {
  // The Canada employment amount ($1,471) and the medical floor ($2,834) were
  // found in CRA's guide and return respectively, so neither refuses now.
  it("net tax answers with a number", () => {
    const v = run(EMPLOYED_FILER, DEFAULT_TARGET).value;
    expect(v.type).toBe("money");
    expect((v as { cents: bigint }).cents).toBeGreaterThan(0n);
  });

  it("the Canada employment amount is the lesser of $1,471 and employment income", () => {
    expect((run(EMPLOYED_FILER, "ca.federal.canada_employment_amount").value as { cents: bigint }).cents)
      .toBe(147100n);
    // A filer earning less than the cap claims only what they earned.
    expect((run({ ...EMPLOYED_FILER, employmentIncome: 900 }, "ca.federal.canada_employment_amount")
      .value as { cents: bigint }).cents).toBe(90000n);
  });
});

describe("every deliberately unmodelled provision refuses when it applies", () => {
  const CASES: [string, Record<string, unknown>, RegExp][] = [
    [
      "ca.federal.cpp_self_employment",
      { ...PENSIONER, selfEmploymentIncome: 30000 },
      /CPP/i,
    ],
    [
      "ca.federal.child_care_expenses",
      { ...PENSIONER, childcareExpenses: 6000 },
      /child care/i,
    ],
    ["ca.federal.net_capital_losses", PENSIONER, /capital losses/i],
    [
      "ca.federal.donations_annual_limit",
      { ...PENSIONER, charitableDonations: 50000 },
      /75%/i,
    ],
  ];

  for (const [target, facts, pattern] of CASES) {
    it(`${target} refuses`, () => {
      expect(() => run(facts, target)).toThrow(NotModeledError);
      expect(() => run(facts, target)).toThrow(pattern);
    });
  }

  it("each yields nil rather than refusing when the provision does NOT apply", () => {
    // The refusals are conditional by design: a filer who claims none of these
    // must still get an answer, or the corpus would be useless.
    for (const target of [
      "ca.federal.cpp_self_employment",
      "ca.federal.child_care_expenses",
    ]) {
      expect((run(PENSIONER, target).value as { cents: bigint }).cents).toBe(0n);
    }
  });
});

describe("targets the corpus has never modelled refuse outright", () => {
  // Plausible-looking ids that are NOT in the corpus. Whatever a caller
  // guesses at, the answer is a refusal, not 0.
  const UNMODELLED = [
    "ca.federal.amt",
    "ca.federal.quebec_abatement",
    "ca.federal.cwb",
    "ca.federal.ccb",
    "ca.federal.gst_credit",
  ];

  for (const target of UNMODELLED) {
    it(`${target} refuses with NoApplicableRuleError`, () => {
      expect(() => run(PENSIONER, target)).toThrow(NoApplicableRuleError);
    });
  }

  it("TY2026 refuses — indexed thresholds are not published to us", () => {
    expect(() => run(PENSIONER, DEFAULT_TARGET, "2026-06-15")).toThrow(
      NoApplicableRuleError,
    );
  });
});

describe("the refusal is structured and machine-routable", () => {
  it("refuses with no facts at all rather than inventing them", () => {
    const corpus = getCorpus();
    // province and maritalStatus have no defaults, so this cannot proceed.
    expect(() =>
      evaluate(corpus, {}, { asOf: AS_OF_TY2025, target: DEFAULT_TARGET }),
    ).toThrow(OpenTaxError);
  });

  it("rejects an unknown fact instead of ignoring it", () => {
    const corpus = getCorpus();
    expect(() => coerceFacts(corpus, { notAFact: 1 })).toThrow(FactValidationError);
  });

  it("errors carry a code that a caller can branch on", () => {
    try {
      run(PENSIONER, "ca.federal.cwb");
      expect.unreachable("expected a refusal");
    } catch (err) {
      expect(err).toBeInstanceOf(OpenTaxError);
      expect(typeof (err as { code?: string }).code).toBe("string");
    }
  });
});

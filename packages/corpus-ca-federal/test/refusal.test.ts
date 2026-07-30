/**
 * THE property of this package right now.
 *
 * The corpus has ZERO rules. Every question put to it must FAIL LOUD with
 * NoApplicableRuleError (code NO_APPLICABLE_RULE) — never a number, never a
 * zero, never a partially-derived guess. A wrong-but-plausible answer is the
 * one failure mode this engine may not have, and until Phase 2 rules land
 * "plausible" is everything.
 *
 * These assertions must KEEP passing for any target that stays unmodelled as
 * the corpus grows; once ca.federal.net_tax is actually implemented, the
 * DEFAULT_TARGET cases here become the failing test that says "now write the
 * golden fixtures" — they are not to be deleted, they are to be replaced by
 * fixture-driven expectations (see corpus-us-federal/test/golden.test.ts).
 *
 * Imported from ../src rather than the package name: this package is inert by
 * design (no "build" script), so ./dist may not exist.
 */

import { describe, expect, it } from "vitest";
import {
  coerceFacts,
  evaluate,
  FactValidationError,
  NoApplicableRuleError,
  OpenTaxError,
} from "@invaro/opentax-core";
import { DEFAULT_TARGET, getCorpus } from "../src/index.js";

/**
 * An entirely ordinary TY2025 return. Nothing exotic to hide behind, and
 * every defaultless fact that applies to an unmarried filer is supplied
 * (province, maritalStatus, birthYear, employmentIncome, spouseNetIncome) so
 * the refusal below can never be dismissed as "you just didn't give it
 * enough input". eligibleDependantNetIncome is the one defaultless fact left
 * out on purpose: hasEligibleDependant defaults to false, so supplying a
 * dependant's income for a single filer with no dependants would be
 * incoherent rather than thorough.
 */
const PLAUSIBLE_FACTS = {
  province: "ON",
  maritalStatus: "single",
  birthYear: 1985,
  employmentIncome: 85000,
  spouseNetIncome: 0,
  interestIncome: 1200,
  rrspDeduction: 5000,
  charitableDonations: 500,
};

/** Dates inside and outside TY2025 — refusal must not depend on the calendar. */
const AS_OF_DATES = ["2025-01-01", "2025-12-31", "2026-07-28"];

describe("corpus loads", () => {
  it("getCorpus() succeeds and loads the Phase 2 slice-1 rules", () => {
    const corpus = getCorpus();
    // Slice 1 (income -> federal tax before credits) has landed, so the rule
    // set is no longer empty. What matters for this suite is that loading
    // succeeds and that the chain below still stops short of net tax.
    expect(corpus.rules.length).toBeGreaterThan(0);
    expect(corpus.ruleHashes.size).toBe(corpus.rules.length);
    expect(corpus.facts.length).toBeGreaterThan(0);
    // The slice-1 chain is present end to end...
    for (const id of [
      "ca.federal.total_income",
      "ca.federal.net_income",
      "ca.federal.taxable_income",
      "ca.federal.tax_before_credits",
    ]) {
      expect(corpus.byId.has(id), `${id} should be loaded`).toBe(true);
    }
    // ...and nothing has quietly supplied the credits or the net-tax line.
    for (const id of [
      "ca.federal.non_refundable_credits",
      "ca.federal.net_tax",
    ]) {
      expect(corpus.byId.has(id), `${id} must NOT exist yet`).toBe(false);
    }
  });

  it("DEFAULT_TARGET is declared but not modelled", () => {
    expect(DEFAULT_TARGET).toBe("ca.federal.net_tax");
    expect(
      getCorpus().byId.has(DEFAULT_TARGET),
      "DEFAULT_TARGET must not resolve to a rule while the corpus is empty",
    ).toBe(false);
  });
});

describe("asking for net federal tax REFUSES rather than answers", () => {
  for (const asOf of AS_OF_DATES) {
    it(`asOf ${asOf}: with a full, plausible fact set`, () => {
      const corpus = getCorpus();
      const facts = coerceFacts(corpus, PLAUSIBLE_FACTS);

      // Deliberately not expect(...).toThrow(): if evaluate() ever RETURNS,
      // this test must fail on the returned number itself, loudly.
      let returned: unknown;
      let thrown: unknown;
      try {
        returned = evaluate(corpus, facts, { asOf, target: DEFAULT_TARGET });
      } catch (err) {
        thrown = err;
      }

      expect(
        returned,
        `the corpus produced an answer for ${DEFAULT_TARGET} with zero rules loaded: ` +
          JSON.stringify(returned, (_k, v) =>
            typeof v === "bigint" ? v.toString() : v,
          ),
      ).toBeUndefined();

      expect(thrown).toBeInstanceOf(NoApplicableRuleError);
      const err = thrown as NoApplicableRuleError;
      expect(err.code).toBe("NO_APPLICABLE_RULE");
      expect(err.ruleId).toBe(DEFAULT_TARGET);
      expect(err.asOf).toBe(asOf);
      // No versions at all — the rule id itself is unknown, not merely
      // out of its validity window.
      expect(err.knownVersions).toEqual([]);
      expect(err.message).toContain(DEFAULT_TARGET);
      expect(err.message).toContain("rule id unknown");
    });
  }

  it("refuses with NO facts supplied too (not NEEDS_FACTS)", () => {
    // Ordering matters: an empty corpus can't even know which facts it would
    // need, so the honest error is "not covered" — extend the corpus — rather
    // than "provide more input", which would invite a pointless retry loop.
    const corpus = getCorpus();
    expect(() =>
      evaluate(corpus, {}, { asOf: "2025-12-31", target: DEFAULT_TARGET }),
    ).toThrow(NoApplicableRuleError);
  });

  it("the refusal is a structured, machine-routable error", () => {
    const corpus = getCorpus();
    try {
      evaluate(corpus, {}, { asOf: "2025-12-31", target: DEFAULT_TARGET });
      expect.unreachable("expected NO_APPLICABLE_RULE");
    } catch (err) {
      expect(err).toBeInstanceOf(OpenTaxError);
      const json = (err as OpenTaxError).toJSON();
      expect(json.code).toBe("NO_APPLICABLE_RULE");
      expect(json.data).toMatchObject({
        ruleId: DEFAULT_TARGET,
        asOf: "2025-12-31",
        knownVersions: [],
      });
      // Callers route on `code`, never on prose.
      expect(typeof json.message).toBe("string");
    }
  });
});

describe("every roadmapped target also refuses", () => {
  // ANTICIPATED ids for the computations the Phase 2 TODO roadmap
  // (src/index.ts) schedules. To be exact about provenance: the roadmap names
  // FILES and ITA provisions, not rule ids — the only id this package
  // actually declares today is DEFAULT_TARGET. These strings are therefore
  // plausible-looking ids that are NOT in the corpus, which is precisely what
  // makes them a good test: whatever a caller guesses at, the answer is a
  // refusal, not 0. If Phase 2 lands one of these ids for real, the
  // corresponding case here starts failing and must be replaced with a golden
  // fixture (not deleted).
  //
  // Slice 1 did exactly that. total_income, net_income, taxable_income and
  // tax_before_credits are now REAL rules and have moved out of this list
  // into golden.test.ts, which checks their values against CRA's own printed
  // figures. The remainder below are still unmodelled and must still refuse.
  const ROADMAPPED = [
    "ca.federal.non_refundable_credits",
    "ca.federal.amt",
    "ca.federal.quebec_abatement",
    "ca.federal.cwb",
    "ca.federal.ccb",
    "ca.federal.gst_credit",
  ];

  for (const target of ROADMAPPED) {
    it(`${target} refuses`, () => {
      const corpus = getCorpus();
      const facts = coerceFacts(corpus, PLAUSIBLE_FACTS);
      expect(() =>
        evaluate(corpus, facts, { asOf: "2025-12-31", target }),
      ).toThrow(NoApplicableRuleError);
    });
  }
});

describe("fact intake still validates (the catalog is live even with no rules)", () => {
  it("accepts the documented facts", () => {
    expect(() => coerceFacts(getCorpus(), PLAUSIBLE_FACTS)).not.toThrow();
  });

  it("rejects an unknown fact id rather than ignoring it", () => {
    expect(() =>
      coerceFacts(getCorpus(), { standardDeduction: 15000 }),
    ).toThrow(FactValidationError);
  });

  it("rejects an out-of-range enum value", () => {
    // "XX" is not one of the 13 CRA jurisdiction codes. coerceFacts() only
    // type-tags the input; membership is enforced by evaluate(), so assert it
    // where it actually happens rather than where it would be convenient.
    const corpus = getCorpus();
    const facts = coerceFacts(corpus, { province: "XX" });
    expect(() =>
      evaluate(corpus, facts, { asOf: "2025-12-31", target: DEFAULT_TARGET }),
    ).toThrow(FactValidationError);
  });

  it("rejects a negative amount for a min:0 money fact", () => {
    const corpus = getCorpus();
    const facts = coerceFacts(corpus, { employmentIncome: -1 });
    expect(() =>
      evaluate(corpus, facts, {
        asOf: "2025-12-31",
        target: DEFAULT_TARGET,
      }),
    ).toThrow(FactValidationError);
  });
});

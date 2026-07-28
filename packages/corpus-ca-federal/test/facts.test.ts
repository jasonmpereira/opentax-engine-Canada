/**
 * Fact-catalog invariants.
 *
 * With zero rules, the fact catalog is the entire semantic content of this
 * package, so it carries the whole test burden. The assertions below encode
 * the conventions documented at the top of src/facts.ts — most importantly
 * the NO-GUESSING convention: a fact WITHOUT a default must be provided by
 * the caller, and the engine refuses to answer without it. Which facts are
 * allowed to lack a default is therefore a policy decision, and this file is
 * where that policy is pinned.
 *
 * Imported from ../src rather than the package name: this package is inert by
 * design (no "build" script), so ./dist may not exist.
 */

import { describe, expect, it } from "vitest";
import type { FactSpec } from "@invaro/opentax-core";
import { facts, getCorpus, MARITAL_STATUSES, PROVINCES } from "../src/index.js";

/**
 * The ONLY facts permitted to have no default — i.e. the ones the engine will
 * refuse over rather than assume. Adding a fact here is a deliberate policy
 * choice and must come with a reason; adding a defaultless fact WITHOUT
 * listing it here fails this suite.
 *
 * Two families, per the convention in src/facts.ts:
 *   identity/status — assuming one silently changes which law applies
 *   primary income  — assuming one silently invents (or zeroes) the return
 */
const NO_DEFAULT_ALLOWED: Record<string, string> = {
  // identity / status
  province:
    "residence on Dec 31 selects the provincial regime, the Quebec abatement and CWB variants — never guessable",
  maritalStatus:
    "gates the spousal amount, transfers and family-based benefits — never guessable",
  birthYear:
    "exact age feeds CWB eligibility (one disjunctive limb of s. 122.7(1), not the whole test) and age-banded amounts — never guessable",
  // primary income
  employmentIncome:
    "the principal income line (T1 10100); defaulting it to zero would fabricate a return",
  // spousal input: defaulting to $0 is not neutral — it MAXIMIZES the
  // spousal amount, so absence must refuse rather than assume.
  spouseNetIncome:
    "a $0 default would maximize the spousal amount rather than be neutral",
  // dependant input: same asymmetry as spouseNetIncome — D.1 in the
  // para. 118(1)(b) formula reduces the amount, so a $0 default maximizes it.
  eligibleDependantNetIncome:
    "a $0 default would maximize the eligible-dependant amount rather than be neutral",
};

/**
 * Money facts allowed to omit `min`. Every money fact in the catalog today is
 * a non-negative quantity and declares `min: "0"`, which is what stops a
 * negative amount from being smuggled in as an input. Genuinely signed money
 * facts (net capital LOSSES, a refundable net-tax figure) will exist in later
 * phases; each one must be listed here with a reason when it lands.
 */
const SIGNED_MONEY_ALLOWED: Record<string, string> = {};

const byId = new Map<string, FactSpec>(facts.map((f) => [f.id, f]));

describe("fact catalog", () => {
  it("is non-empty", () => {
    expect(facts.length).toBeGreaterThan(0);
  });

  it("has no duplicate fact ids", () => {
    const ids = facts.map((f) => f.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate fact ids: ${dupes.join(", ")}`).toEqual([]);
    expect(byId.size).toBe(facts.length);
  });

  it("uses camelCase fact ids", () => {
    for (const f of facts) {
      expect(f.id, `fact id "${f.id}"`).toMatch(/^[a-z][A-Za-z0-9]*$/);
    }
  });

  it("every fact has a substantive description", () => {
    for (const f of facts) {
      expect(f.description, `fact "${f.id}" description`).toBeTypeOf("string");
      expect(f.description.trim(), `fact "${f.id}" description`).not.toBe("");
      // A description is what the engine shows the caller when it refuses for
      // a missing fact (NeedsFactsError.missing[].description), so a stub
      // like "income" is not good enough to act on.
      expect(
        f.description.trim().length,
        `fact "${f.id}": description is too short to be actionable`,
      ).toBeGreaterThanOrEqual(20);
    }
  });

  it("every enum fact declares non-empty, unique enumValues", () => {
    const enums = facts.filter((f) => f.type === "enum");
    expect(enums.length).toBeGreaterThan(0);
    for (const f of enums) {
      expect(f.enumValues, `enum fact "${f.id}" must declare enumValues`)
        .toBeDefined();
      const values = f.enumValues!;
      expect(values.length, `enum fact "${f.id}"`).toBeGreaterThan(0);
      expect(new Set(values).size, `enum fact "${f.id}" has duplicate values`)
        .toBe(values.length);
      for (const v of values) {
        expect(v, `enum fact "${f.id}"`).toBeTypeOf("string");
        expect(v.trim(), `enum fact "${f.id}" has an empty value`).not.toBe("");
      }
    }
  });

  it("only enum facts declare enumValues", () => {
    for (const f of facts) {
      if (f.type !== "enum") {
        expect(f.enumValues, `fact "${f.id}" is ${f.type}`).toBeUndefined();
      }
    }
  });

  it("every money fact declares a min unless explicitly allowed to be signed", () => {
    for (const f of facts) {
      if (f.type !== "money") continue;
      if (f.id in SIGNED_MONEY_ALLOWED) continue;
      expect(
        f.min,
        `money fact "${f.id}" has no min — non-negative money facts must declare min:"0", ` +
          `or be listed in SIGNED_MONEY_ALLOWED with a reason`,
      ).toBeDefined();
      expect(f.min, `money fact "${f.id}" min`).toBe("0");
    }
  });

  it("declared bounds are parseable and ordered", () => {
    for (const f of facts) {
      if (f.min !== undefined) {
        expect(
          () => BigInt(f.min!),
          `fact "${f.id}" min "${f.min}" is not a decimal integer string`,
        ).not.toThrow();
      }
      if (f.max !== undefined) {
        expect(
          () => BigInt(f.max!),
          `fact "${f.id}" max "${f.max}" is not a decimal integer string`,
        ).not.toThrow();
      }
      if (f.min !== undefined && f.max !== undefined) {
        expect(BigInt(f.min) <= BigInt(f.max), `fact "${f.id}" min > max`).toBe(
          true,
        );
      }
      // Bounds only mean anything for the numeric types (see FactSpec).
      if (f.type !== "money" && f.type !== "int") {
        expect(f.min, `fact "${f.id}" is ${f.type}`).toBeUndefined();
        expect(f.max, `fact "${f.id}" is ${f.type}`).toBeUndefined();
      }
    }
  });
});

describe("no-guessing convention", () => {
  it("every defaultless fact is an allowed identity/status or primary-income fact", () => {
    const undefaulted = facts
      .filter((f) => f.default === undefined)
      .map((f) => f.id)
      .sort();
    const unexplained = undefaulted.filter((id) => !(id in NO_DEFAULT_ALLOWED));
    expect(
      unexplained,
      `these facts have no default and no recorded justification: ${unexplained.join(", ")} — ` +
        `either give them a documented default or add them to NO_DEFAULT_ALLOWED with a reason`,
    ).toEqual([]);
  });

  it("every fact listed in NO_DEFAULT_ALLOWED actually has no default", () => {
    // The inverse direction: someone quietly adding a default to one of these
    // would turn a refusal into a plausible wrong answer, which is the single
    // failure mode this engine may not have. This iterates the permit-list
    // itself rather than a hardcoded subset — otherwise an entry could be
    // added to NO_DEFAULT_ALLOWED (recording WHY it must refuse) while the
    // fact quietly carries a default that contradicts that reason, and no
    // test would notice. That is exactly what happened to spouseNetIncome,
    // eligibleDependantNetIncome and birthYear, whose recorded reasons say a
    // $0/assumed default is NOT neutral but actively maximizes a credit.
    const ids = Object.keys(NO_DEFAULT_ALLOWED);
    // Guard the guard: an empty permit-list would make this loop vacuous.
    expect(ids.length, "NO_DEFAULT_ALLOWED must not be empty").toBeGreaterThan(
      0,
    );
    const defaulted: string[] = [];
    for (const id of ids) {
      const f = byId.get(id);
      expect(f, `fact "${id}" is missing from the catalog`).toBeDefined();
      if (f!.default !== undefined) defaulted.push(id);
    }
    expect(
      defaulted,
      `these facts are listed in NO_DEFAULT_ALLOWED but carry a default: ${defaulted.join(", ")} — ` +
        `each must refuse rather than guess (reason on record: ` +
        defaulted.map((id) => `${id}: ${NO_DEFAULT_ALLOWED[id]}`).join("; ") +
        `). Remove the default, or remove the fact from NO_DEFAULT_ALLOWED and ` +
        `justify the assumption in its default rationale.`,
    ).toEqual([]);
  });

  it("NO_DEFAULT_ALLOWED lists no fact that is absent from the catalog", () => {
    // A stale permit-list entry (fact renamed or dropped) would silently
    // weaken the guard above by protecting a name nothing uses.
    const stale = Object.keys(NO_DEFAULT_ALLOWED).filter(
      (id) => !byId.has(id),
    );
    expect(
      stale,
      `NO_DEFAULT_ALLOWED lists facts that do not exist: ${stale.join(", ")}`,
    ).toEqual([]);
  });

  it("every NO_DEFAULT_ALLOWED entry records a substantive reason", () => {
    // The permit-list is a policy record, not a checkbox: an empty or stub
    // reason would let a fact be exempted without anyone having to say why.
    for (const [id, reason] of Object.entries(NO_DEFAULT_ALLOWED)) {
      expect(reason, `NO_DEFAULT_ALLOWED["${id}"]`).toBeTypeOf("string");
      expect(
        reason.trim().length,
        `NO_DEFAULT_ALLOWED["${id}"] reason is too short to be a justification`,
      ).toBeGreaterThanOrEqual(20);
    }
  });

  it("every default carries a rationale and a correctly typed value", () => {
    for (const f of facts) {
      if (!f.default) continue;
      expect(f.default.rationale, `fact "${f.id}" default rationale`)
        .toBeTypeOf("string");
      expect(f.default.rationale.trim(), `fact "${f.id}" default rationale`)
        .not.toBe("");
      const value = f.default.value;
      switch (f.type) {
        case "bool":
          expect(value, `fact "${f.id}" default`).toBeTypeOf("boolean");
          break;
        case "money":
        case "int":
          expect(value, `fact "${f.id}" default`).toBeTypeOf("string");
          expect(
            () => BigInt(value as string),
            `fact "${f.id}" default "${String(value)}" is not a decimal integer string`,
          ).not.toThrow();
          break;
        case "enum":
          expect(value, `fact "${f.id}" default`).toBeTypeOf("string");
          expect(f.enumValues, `fact "${f.id}"`).toContain(value as string);
          break;
        default:
          break;
      }
    }
  });

  it("defaulted money facts respect their own declared minimum", () => {
    for (const f of facts) {
      if (f.type !== "money" || !f.default || f.min === undefined) continue;
      expect(
        BigInt(f.default.value as string) >= BigInt(f.min),
        `fact "${f.id}" default is below its own min`,
      ).toBe(true);
    }
  });
});

describe("Canadian jurisdiction facts", () => {
  it("province covers all 13 provinces and territories", () => {
    const province = byId.get("province");
    expect(province, "fact \"province\" is missing").toBeDefined();
    expect(province!.type).toBe("enum");
    expect(province!.enumValues).toEqual([...PROVINCES]);
    // 10 provinces + 3 territories. A short list here would silently drop a
    // jurisdiction into UNHANDLED_ENUM_CASE once Form 428 composers land.
    expect(PROVINCES.length).toBe(13);
    for (const code of PROVINCES) expect(code).toMatch(/^[A-Z]{2}$/);
  });

  it("maritalStatus covers CRA's six T1 page-1 categories", () => {
    const status = byId.get("maritalStatus");
    expect(status, "fact \"maritalStatus\" is missing").toBeDefined();
    expect(status!.type).toBe("enum");
    expect(status!.enumValues).toEqual([...MARITAL_STATUSES]);
    expect(MARITAL_STATUSES.length).toBe(6);
  });
});

describe("catalog as loaded by the engine", () => {
  it("core accepts the catalog and indexes every fact", () => {
    // loadCorpus() rejects duplicate ids and enum facts without enumValues;
    // reaching this line at all means core's own validation passed.
    const corpus = getCorpus();
    expect(corpus.facts.length).toBe(facts.length);
    for (const f of facts) {
      expect(corpus.factById.get(f.id), `fact "${f.id}" not indexed`).toBe(f);
    }
  });
});

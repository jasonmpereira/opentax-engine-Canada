/**
 * Guards the CRA parameter pins in docs/parameters/ty2025-cra-forms.json.
 *
 * Those values are extracted from the read-only fields of CRA's own fillable
 * T1 forms (tools/cra-forms/extract_params.py), so they are primary authority
 * for every indexed figure the Phase 2 rules will carry. This suite checks the
 * extraction is internally coherent BEFORE any rule depends on it — a silently
 * mis-parsed threshold would propagate into every bracket and credit.
 *
 * The bracket reconciliation is the important one. CRA prints, for each band,
 * a threshold, a rate, and the cumulative tax at that threshold. Those three
 * are redundant: the cumulative column is derivable from the others. If the
 * extraction were misaligned — a rate paired with the wrong column, a decimal
 * misplaced — the arithmetic would stop closing. It closing to the cent across
 * all five bands is strong evidence the values are read correctly.
 *
 * All arithmetic here is exact: money in integer cents as BigInt, rates as
 * BigInt rationals. No floats, for the same reason the engine uses none.
 *
 * SENSITIVITY, measured rather than assumed. Mutation-tested against the
 * realistic extraction failures — a misplaced decimal (114,750 -> 11,475), a
 * wrong magnitude (+$100), a rate copied from the neighbouring column, and
 * 14.5% flattened to the statutory 14% — and it catches all four. It does NOT
 * catch a perturbation of a cent or two in a threshold: a one-cent change
 * moves the cumulative column by a fraction of a cent, which rounds away.
 * That is arithmetic, not a hole in the test, but it does mean this reconciles
 * the table rather than fingerprinting it. Byte-level integrity of the pin
 * file is not what this suite provides.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface Constant {
  page: number | null;
  field: string;
  raw: string;
  kind: "money" | "rate" | "raw";
  cents?: string;
  num?: string;
  den?: string;
  value?: string;
  display?: string;
}
interface Form {
  form: string;
  taxYear: string;
  title: string;
  sourceFile: string;
  sourceSha256: string;
  constants: Constant[];
}
interface Pins {
  formsWithConstants: number;
  constantCount: number;
  skipped: unknown[];
  forms: Form[];
}

const pinsPath = path.join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "docs",
  "parameters",
  "ty2025-cra-forms.json",
);
const pinsExist = existsSync(pinsPath);
const pins: Pins | null = pinsExist
  ? (JSON.parse(readFileSync(pinsPath, "utf8")) as Pins)
  : null;

/** Half-up rounding of a BigInt rational to a whole number of cents. */
function roundHalfUp(num: bigint, den: bigint): bigint {
  const doubled = 2n * num + den;
  const floored = doubled / (2n * den);
  // BigInt division truncates toward zero; these values are non-negative.
  return floored;
}

function find(form: Form, page: number, needle: string): Constant | undefined {
  return form.constants.find((c) => c.page === page && c.field.includes(needle));
}

describe("CRA parameter pins (docs/parameters/ty2025-cra-forms.json)", () => {
  it("the pin file is committed", () => {
    expect(
      pinsExist,
      `${pinsPath} is missing — regenerate with tools/cra-forms/extract_params.py`,
    ).toBe(true);
  });

  it.runIf(pinsExist)("every extracted form is the 2025 tax year", () => {
    for (const f of pins!.forms) {
      expect(f.taxYear, `${f.sourceFile} is not TY2025`).toBe("2025");
    }
  });

  it.runIf(pinsExist)("no source form failed to parse", () => {
    expect(pins!.skipped).toEqual([]);
  });

  it.runIf(pinsExist)("every constant carries provenance and a parsed value", () => {
    for (const f of pins!.forms) {
      expect(f.sourceSha256).toMatch(/^[0-9a-f]{64}$/);
      for (const c of f.constants) {
        expect(c.field.length, `${f.form}: empty field path`).toBeGreaterThan(0);
        if (c.kind === "money") expect(c.cents).toMatch(/^-?\d+$/);
        if (c.kind === "rate") {
          expect(c.num).toMatch(/^-?\d+$/);
          expect(c.den).toMatch(/^\d+$/);
          expect(BigInt(c.den!)).toBeGreaterThan(0n);
        }
      }
    }
  });

  describe.runIf(pinsExist)("federal bracket table (5006-R Step 5 Part A)", () => {
    const ret = pins!.forms.find((f) => f.form.toUpperCase().startsWith("5006-R"));
    const bands = [1, 2, 3, 4, 5].map((n) => {
      const col = `Column${n}.`;
      const threshold = ret?.constants.find(
        (c) => c.page === 5 && c.field.includes(col) && c.field.includes("Line37"),
      );
      const rate = ret?.constants.find(
        (c) => c.page === 5 && c.field.includes(col) && c.field.includes("Line39"),
      );
      const cumulative = ret?.constants.find(
        (c) => c.page === 5 && c.field.includes(col) && c.field.includes("Line41"),
      );
      return { threshold, rate, cumulative };
    });

    it("all five bands were extracted", () => {
      expect(ret, "5006-R not found in the pin file").toBeDefined();
      for (const [i, b] of bands.entries()) {
        expect(b.threshold, `band ${i + 1} threshold missing`).toBeDefined();
        expect(b.rate, `band ${i + 1} rate missing`).toBeDefined();
        expect(b.cumulative, `band ${i + 1} cumulative missing`).toBeDefined();
      }
    });

    // The blended-rate trap: the consolidated ITA s.117(2)(a) reads 14%
    // ("Rates for taxation years after 2024"), but TY2025 is administered at
    // a blended 14.5% because Bill C-4's cut took effect mid-year 2025. A rule
    // author reading the statute alone encodes 14% and is wrong. CRA's own
    // return settles it, and this assertion pins that settlement.
    it("the lowest band is the TY2025 BLENDED 14.5%, not the statutory 14%", () => {
      const r = bands[0].rate!;
      expect(r.display).toBe("14.5%");
      // 29/200 === 0.145 exactly
      expect(BigInt(r.num!) * 200n).toBe(29n * BigInt(r.den!));
    });

    it("cumulative tax reconciles from thresholds and rates, to the cent", () => {
      let running = { num: 0n, den: 1n };
      for (const [i, b] of bands.entries()) {
        if (i > 0) {
          const prev = bands[i - 1];
          const width = BigInt(b.threshold!.cents!) - BigInt(prev.threshold!.cents!);
          const addNum = width * BigInt(prev.rate!.num!);
          const addDen = BigInt(prev.rate!.den!);
          running = {
            num: running.num * addDen + addNum * running.den,
            den: running.den * addDen,
          };
        }
        const computed = roundHalfUp(running.num, running.den);
        expect(
          computed,
          `band ${i + 1} (${b.threshold!.display}): CRA prints ${b.cumulative!.display}`,
        ).toBe(BigInt(b.cumulative!.cents!));
      }
    });
  });

  describe.runIf(pinsExist)("basic personal amount (5000-D1 line 30000)", () => {
    const wk = pins!.forms.find((f) => f.form.toUpperCase().startsWith("5000-D1"));

    // The worksheet gives the BPA as a base plus a supplement that phases out.
    // Their sum is the maximum BPA, which is how $16,129 is derived rather
    // than taken on faith from a secondary source.
    it("base + supplement equals the maximum BPA", () => {
      const base = find(wk!, 3, "Line30000.Line1");
      const supplement = find(wk!, 3, "Line30000.Line2");
      expect(base?.cents, "BPA base not extracted").toBeDefined();
      expect(supplement?.cents, "BPA supplement not extracted").toBeDefined();
      const max = BigInt(base!.cents!) + BigInt(supplement!.cents!);
      expect(max).toBe(1612900n); // $16,129.00
    });
  });
});

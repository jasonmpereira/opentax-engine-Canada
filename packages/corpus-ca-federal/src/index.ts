/**
 * @opencantax/corpus-ca-federal — Canadian federal T1 individual income tax
 * and benefits rules as data: cited, temporally versioned, content-addressed.
 *
 * The corpus identity below must stay equal to package.json's "name": it is
 * stamped into every proof artifact (proof.corpus.name), so a mismatch would
 * make proofs cite a package that does not exist. lock.test.ts pins the two
 * together. (This read "@woodgate/..." until the H2 rename gate closed on
 * 2026-07-26 — see docs/M0-EXIT-CHECKLIST.md.)
 *
 * PROPRIETARY — separately licensed from the AGPL engine (see ./LICENSE).
 *
 * Phase 2, slice 1 (income through federal tax before credits) has landed.
 * Everything NOT yet modelled still FAILS LOUD (NoApplicableRule, or an
 * `unsupported` node) rather than producing a plausible wrong answer. In
 * particular DEFAULT_TARGET — net federal tax, line 42000 — has no rule chain
 * yet, because the credits that stand between tax-before-credits and net tax
 * are slice 2. Asking for it refuses, and that is correct.
 */

import { loadCorpus } from "@invaro/opentax-core";
import type { CorpusInput, LoadedCorpus, Rule } from "@invaro/opentax-core";
import { facts } from "./facts.js";
import { capitalGainsRules } from "./rules/capital-gains.js";
import { deductionRules } from "./rules/deductions.js";
import { dividendRules } from "./rules/dividends.js";
import { incomeRules } from "./rules/income.js";
import { taxBracketRules } from "./rules/tax-brackets.js";
import { taxableIncomeRules } from "./rules/taxable-income.js";

/**
 * Phase 2 rule files (docs/CANADA-CONVERSION.md), in dependency order.
 * Each lands as ./rules/<file>.ts exporting a Rule[] spread into `rules`.
 *
 * ── SLICE 1, LANDED: income → federal tax before credits ──
 * rules/income.ts             employment (s. 5), business (s. 9), interest
 *                             (para. 12(1)(c)), pensions/CPP/OAS/EI/RRSP
 *                             (s. 56(1), s. 146(8)), s. 3(a)-(b) aggregation
 * rules/dividends.ts          gross-up — eligible 38% (s. 82(1)(b)(ii)(D)),
 *                             non-eligible 15% (s. 82(1)(b)(i)(B))
 * rules/capital-gains.ts      1/2 inclusion (s. 38(a)); losses REFUSE
 * rules/deductions.ts         RRSP (s. 146(5)), union dues (para. 8(1)(i));
 *                             child care (s. 63) refuses when claimed
 * rules/taxable-income.ts     net income (s. 3(c)), taxable income (s. 2(2))
 * rules/tax-brackets.ts       s. 117(2) TY2025 — BLENDED 14.5% lowest rate
 *
 * Business income (s. 9) lives in income.ts rather than a separate
 * self-employment.ts; the Schedule 8 CPP-on-self-employment computation that
 * file was to carry is still outstanding below.
 *
 * ── SLICE 2, OUTSTANDING ──
 * Deductions → net income (23600):
 * TODO(rules/deductions.ts): CPP enhanced-contribution deduction
 *   (para. 60(e.1)); child care (s. 63) proper computation
 * TODO(rules/social-benefits-repayment.ts): OAS recovery tax (s. 180.2),
 *   EI clawback
 *
 * Federal tax:
 * TODO(rules/tax-brackets.ts): a TY2026 version once s. 117.1 indexed
 *   thresholds are published — 2026 currently refuses, by design
 * TODO(rules/non-refundable-credits.ts): s. 118 family at the appropriate
 *   percentage (14.5% for 2025) — BPA with s. 118(1.1) enhancement
 *   ($16,129 → $14,538 phase-out), spousal, age, Canada employment,
 *   CPP/EI credits (s. 118.7), pension (s. 118(3)), tuition, medical,
 *   student loan interest
 * TODO(rules/donations.ts): s. 118.1 tiers incl. 33% tranche, 75% limit
 * TODO(rules/dividend-tax-credit.ts): s. 121 — 6/11 eligible, 9/13
 *   non-eligible
 * TODO(rules/cpp-self-employed.ts): Schedule 8 — CPP base/CPP1/CPP2
 *   (YMPE $71,300 / YAMPE $81,200 for 2025)
 * TODO(rules/amt.ts): revised minimum tax, ss. 127.5–127.55 — IN SCOPE
 *   for v1 (decision D2): 20.5% rate, $177,882 exemption (2025), credit
 *   restrictions, carryforward
 * TODO(rules/quebec-abatement.ts): 16.5% Quebec abatement (s. 120(2),
 *   Federal-Provincial Fiscal Arrangements Act) — decision D6; needs
 *   `province` = QC
 * TODO(rules/topup-credit.ts): decision D4 top-up credit
 * TODO(rules/cwb.ts): Canada Workers Benefit (s. 122.7, Schedule 6) with
 *   QC/AB/NU reconfigurations and disability supplement
 * TODO(rules/net-tax.ts): line 42000 assembly; defines DEFAULT_TARGET
 *
 * Benefits (milestone 2, AFNI-first — see README):
 * TODO(rules/afni.ts): adjusted family net income
 * TODO(rules/ccb.ts): Canada Child Benefit (s. 122.6)
 * TODO(rules/gst-credit.ts): GST/HST credit (s. 122.5)
 */
export const rules: Rule[] = [
  // Dependency order: income sources, then aggregation, then deductions,
  // then the net/taxable income chain, then tax. Order is documentary — the
  // engine resolves rule references by id — but keeping it honest makes the
  // chain readable in the file as well as in a proof.
  ...incomeRules,
  ...dividendRules,
  ...capitalGainsRules,
  ...deductionRules,
  ...taxableIncomeRules,
  ...taxBracketRules,
];

export const corpusInput: CorpusInput = {
  name: "@opencantax/corpus-ca-federal",
  version: "0.1.0",
  rules,
  facts,
};

let cached: LoadedCorpus | null = null;

/** The validated, hashed corpus (computed once, cached). */
export function getCorpus(): LoadedCorpus {
  if (!cached) cached = loadCorpus(corpusInput);
  return cached;
}

/**
 * The conventional top-level question this corpus will answer: net federal
 * tax (T1 line 42000). NEGATIVE = refund. No rule chain reaches it yet —
 * the engine refuses until Phase 2 lands.
 */
export const DEFAULT_TARGET = "ca.federal.net_tax";

export { facts, PROVINCES, MARITAL_STATUSES } from "./facts.js";

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
 * Phase 1 scaffold: fact catalog only, zero rules. Anything asked of this
 * corpus FAILS LOUD (NoApplicableRule) rather than producing a plausible
 * wrong answer — which is currently everything.
 */

import { loadCorpus } from "@invaro/opentax-core";
import type { CorpusInput, LoadedCorpus, Rule } from "@invaro/opentax-core";
import { facts } from "./facts.js";

/**
 * Phase 2 rule files (docs/CANADA-CONVERSION.md), in dependency order.
 * Each lands as ./rules/<file>.ts exporting a Rule[] spread into `rules`.
 *
 * Income → total income (line 15000):
 * TODO(rules/income.ts): employment (s. 5), s. 3 aggregation, interest
 *   (para. 12(1)(c)), pensions, EI, OAS, CPP/QPP benefits
 * TODO(rules/dividends.ts): gross-up — eligible 38% (s. 82(1)(b)(ii)),
 *   non-eligible 15% (s. 82(1)(b)(i))
 * TODO(rules/capital-gains.ts): 1/2 inclusion (ss. 38–39)
 * TODO(rules/self-employment.ts): business income (s. 9)
 *
 * Deductions → net income (23600) / taxable income (26000):
 * TODO(rules/deductions.ts): RRSP (s. 146(5)), CPP enhanced-contribution
 *   deduction (para. 60(e.1)), union dues (para. 8(1)(i))
 * TODO(rules/social-benefits-repayment.ts): OAS recovery tax (s. 180.2),
 *   EI clawback
 * TODO(rules/taxable-income.ts): line 26000
 *
 * Federal tax:
 * TODO(rules/tax-brackets.ts): s. 117(2) brackets, s. 117.1 indexation —
 *   TY2025 blended 14.5% lowest rate (Bill C-4)
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
export const rules: Rule[] = [];

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

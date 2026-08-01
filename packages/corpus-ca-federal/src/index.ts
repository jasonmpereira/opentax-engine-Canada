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
 * Phase 2 slices 1 and 2 have landed: income → net federal tax. DEFAULT_TARGET
 * is answerable for a return built only from modelled provisions.
 *
 * Everything NOT modelled still FAILS LOUD, in one of two ways. A target with
 * no rule raises NoApplicableRule. A rule that exists but covers a provision
 * deliberately out of scope raises NotModeled from an `unsupported` node —
 * child care (s. 63), capital losses and Schedule 8 CPP all work this way.
 *
 * The one place a gap CANNOT fail loud is an ADDITIVE component of line 42000
 * that is simply absent — an absent addend is just a smaller total, which no
 * `unsupported` node can catch. `ca.federal.net_tax_completeness` exists to
 * make that detectable. It began with three branches and now has none: the
 * OAS recovery tax and Schedule 8 CPP were modelled, and the Quebec abatement
 * turned out not to belong to line 42000 at all (it is line 44000, applied
 * after). AMT is the next candidate for it.
 */

import { loadCorpus } from "@invaro/opentax-core";
import type { CorpusInput, LoadedCorpus, Rule } from "@invaro/opentax-core";
import { facts } from "./facts.js";
import { capitalGainsRules } from "./rules/capital-gains.js";
import { cwbRules } from "./rules/cwb.js";
import { cppSelfEmployedRules } from "./rules/cpp-self-employed.js";
import { deductionRules } from "./rules/deductions.js";
import { dividendTaxCreditRules } from "./rules/dividend-tax-credit.js";
import { dividendRules } from "./rules/dividends.js";
import { donationRules } from "./rules/donations.js";
import { incomeRules } from "./rules/income.js";
import { netTaxRules } from "./rules/net-tax.js";
import { nonRefundableCreditRules } from "./rules/non-refundable-credits.js";
import { quebecAbatementRules } from "./rules/quebec-abatement.js";
import { socialBenefitsRepaymentRules } from "./rules/social-benefits-repayment.js";
import { taxBracketRules } from "./rules/tax-brackets.js";
import { topupCreditRules } from "./rules/topup-credit.js";
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
 * self-employment.ts; the Schedule 8 CPP computation is in
 * rules/cpp-self-employed.ts.
 *
 * ── SLICE 2, LANDED: credits → net federal tax ──
 * rules/non-refundable-credits.ts  s. 118 family at the 14.5% appropriate
 *                             percentage (s. 248(1)) — BPA with the
 *                             s. 118(1.1) phase-out, spousal, age, pension,
 *                             disability, tuition, student loan interest,
 *                             CPP/EI (s. 118.7), Canada employment
 *                             (s. 118(10), $1,471 per CRA guide 5000-G p37)
 *                             and medical (s. 118.2, floor = lesser of $2,834
 *                             and 3% of net income, per 5006-R lines 108-109)
 * rules/donations.ts          s. 118.1(3) three tiers incl. the income-capped
 *                             33% tranche; the 75% limit refuses
 * rules/dividend-tax-credit.ts s. 121 — 6/11 eligible, 9/13 non-eligible
 * rules/cpp-self-employed.ts  Schedule 8 — YMPE $71,300 / YAMPE $81,200,
 *                             base 9.9% / CPP1 2% / CPP2 8%; refuses only when
 *                             employment and self-employment share one ceiling
 * rules/topup-credit.ts       line 34990, NEW for 2025 — restores a 15% rate
 *                             on credits above the first bracket threshold
 * rules/social-benefits-repayment.ts  OAS recovery tax (s. 180.2), base
 *                             amount $93,454
 * rules/cwb.ts                s. 122.7 refundable CWB (line 45300), standard
 *                             amounts; AB/QC/NU refuse under s. 122.71
 * rules/quebec-abatement.ts   line 44000 — REFUSES; see the file for why 16.5%
 *                             is 3% (ITA) + 8.5 + 5 units (FPFAA ss. 27(2),(3))
 * rules/net-tax.ts            line 42000; DEFAULT_TARGET is answerable, plus
 *                             the completeness guard (now empty — see above)
 *
 * ── STILL OUTSTANDING ──
 * TODO(rules/deductions.ts): child care (s. 63) proper computation (the
 *   para. 60(e.1) enhanced-contribution deduction has landed via Schedule 8)
 * TODO(rules/social-benefits-repayment.ts): the EI benefit clawback (the OAS
 *   recovery tax has landed)
 * TODO(rules/tax-brackets.ts): a TY2026 version once s. 117.1 indexed
 *   thresholds are published — 2026 currently refuses, by design
 * TODO(rules/amt.ts): revised minimum tax, ss. 127.5–127.55 — IN SCOPE
 *   for v1 (decision D2): 20.5% rate, $177,882 exemption (2025), credit
 *   restrictions, carryforward
 * TODO(rules/quebec-abatement.ts): the rule exists and REFUSES. To close D6:
 *   ingest FPFAA (F-8) into docs/sources/ from the Justice Canada mirror, then
 *   compute basic federal tax (line 42900) and the s. 127.51 minimum amount,
 *   which ITA s. 120(4) makes the base. The 16.5% itself is settled: 3%
 *   (ITA 120(2)) + 8.5 + 5 units (FPFAA ss. 27(2),(3)).
 * TODO(rules/cwb.ts): AB/QC/NU only. The standard rule has landed; those
 *   three provinces refuse PERMANENTLY on statutory grounds — s. 122.71 sets
 *   their amounts by federal-provincial AGREEMENT, never published as a legal
 *   instrument. Closing them needs CRA forms 5009-S6 / 5014-S6 / 5005-S6
 *   dropped into docs/reference-local/cra-t1-2025/{alberta,nunavut,quebec}/;
 *   tools/cra-forms/extract_params.py will read them unchanged.
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
  ...nonRefundableCreditRules,
  ...donationRules,
  ...dividendTaxCreditRules,
  ...cppSelfEmployedRules,
  ...topupCreditRules,
  ...quebecAbatementRules,
  ...cwbRules,
  ...socialBenefitsRepaymentRules,
  ...netTaxRules,
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
 * The top-level question this corpus answers: net federal tax (T1 line 42000).
 * Modelled as of Phase 2 slice 2. Floors at nil — the s. 118 credits are
 * NON-refundable, so they reduce tax to zero but never below it; a refund
 * arises from refundable credits and withholding, which line 42000 excludes.
 *
 * Pair it with `ca.federal.net_tax_completeness` for a return that may involve
 * an unmodelled additive component.
 */
export const DEFAULT_TARGET = "ca.federal.net_tax";

export { facts, PROVINCES, MARITAL_STATUSES } from "./facts.js";

/**
 * Refundable Quebec abatement — T1 line 44000. NOT MODELLED; refuses.
 *
 * Recorded here because the research that produced this file corrected two
 * mistakes in the corpus, and the corrections are worth more than the gap.
 *
 * ── IT IS NOT A LINE-42000 COMPONENT ──
 * The abatement was previously treated as an unmodelled ADDITIVE part of net
 * federal tax, which made the completeness guard refuse every Quebec return.
 * That was wrong. ITA s. 120(2) deems the amount "to have been paid ... on
 * account of the individual's tax", and CRA puts it at line 44000 in Step 6,
 * inside "total credits" — applied AFTER net federal tax, and refundable.
 * `ca.federal.net_tax` is therefore CORRECT as computed for a Quebec resident.
 * What is missing is this line, not the tax.
 *
 * ── WHERE 16.5% ACTUALLY COMES FROM ──
 * The figure appears in NO primary text. ITA s. 120(2) gives 3%. The
 * Federal-Provincial Fiscal Arrangements Act (R.S.C. 1985, c. F-8) Part VI
 * supplies the rest: s. 26 defines "tax abatement" as precisely the
 * percentage figure used in ITA s. 120(2), and s. 27(1) directs that it be
 * increased by BOTH unit numbers that follow — 8.5 under s. 27(2) and 5 under
 * s. 27(3). So 3 + 8.5 + 5 = 16.5, determined by the two Acts read together
 * rather than by administrative practice. The FPFAA corroborates the 13.5
 * internally: s. 24.7 computes the equalized tax transfer with a factor of
 * 13.5/(100 − 9.143).
 *
 * ── WHY IT STILL REFUSES ──
 * Three reasons, none of them "we could not find the number":
 *   1. F-8 is not in docs/sources/. A Citation pointing at FPFAA ss. 26-27
 *      would have no committed primary source behind it, which this corpus
 *      does not permit. Ingesting F-8 from the Justice Canada mirror is the
 *      first step to closing this.
 *   2. The statute never names Quebec. FPFAA s. 27(1) triggers on "an
 *      agreement ... entered into with a province under section 3 of the
 *      Established Programs (Interim Arrangements) Act", a 1970 Act that is
 *      repealed and absent from the mirror. That Quebec is the only province
 *      that entered such an agreement is corroborated only from secondary
 *      sources. The eventual rule should gate on CRA's residency test for
 *      line 44000, not on a claim that the statute says "Quebec".
 *   3. The base is not net tax. ITA s. 120(4) defines "tax otherwise payable"
 *      as the GREATER of the s. 127.51 minimum amount and basic federal tax
 *      (T1 line 42900) — after the non-refundable credits and the dividend
 *      tax credit, but before the foreign, political, ITC and LSVCC credits.
 *      The corpus computes neither line 42900 nor the AMT minimum amount yet,
 *      so the base itself is unavailable.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const money = (cents: string): Expr => ({ kind: "money", cents });

export const quebecAbatementRules: Rule[] = [
  {
    id: "ca.federal.quebec_abatement",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Refundable Quebec abatement (line 44000) — NOT MODELLED",
    citation: {
      source:
        "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), ss. 120(2), 120(4); Federal-Provincial Fiscal Arrangements Act, R.S.C. 1985, c. F-8, ss. 26, 27",
      section: "ITA s. 120(2); FPFAA ss. 26-27",
      url: "https://laws-lois.justice.gc.ca/eng/acts/F-8/section-27.html",
      excerpt:
        "tax abatement means the percentage that is applied to the tax otherwise payable under this Part within the meaning assigned by subsection 120(4) of the Income Tax Act to determine the amount that is deemed by subsection 120(2) of that Act to have been paid by an individual on account of the individual's tax for a taxation year [FPFAA s. 26] … the tax abatement applicable for the 1977 and subsequent taxation years shall be increased … by adding to the percentage figure of the tax abatement both of the unit numbers set out in subsections (2) and (3) [FPFAA s. 27(1)] … There shall be added 8.5 units … [s. 27(2)] … There shall be added 5 units … [s. 27(3)]",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: {
      kind: "if",
      cond: { kind: "cmp", op: "eq", left: fact("province"), right: { kind: "enum", value: "QC" } },
      then: {
        kind: "unsupported",
        reason:
          "The refundable Quebec abatement (T1 line 44000) is not modelled. The 16.5% rate is 3% under ITA s. 120(2) plus 8.5 and 5 units under FPFAA ss. 27(2) and 27(3), but the FPFAA is not yet committed under docs/sources/, so the citation would have no primary source behind it. Its base is also unavailable: ITA s. 120(4) defines it as the greater of the s. 127.51 minimum amount and basic federal tax (line 42900), neither of which this corpus computes. NOTE: ca.federal.net_tax (line 42000) is CORRECT for a Quebec resident — the abatement is a refundable amount applied after it, so only the abatement line is missing.",
      },
      else: money("0"),
    },
  },
];

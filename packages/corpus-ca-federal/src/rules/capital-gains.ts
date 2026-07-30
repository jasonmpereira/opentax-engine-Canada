/**
 * Taxable capital gains — ITA s. 38(a). T1 line 12700 (via Schedule 3).
 *
 * A taxable capital gain is ONE HALF of the capital gain. The 2024 federal
 * budget proposed raising the inclusion rate to two thirds; that proposal was
 * cancelled and never enacted, so s. 38(a) still reads "½" in the
 * consolidation this corpus pins (current to 2026-06-14). CRA's Schedule 3
 * (5000-S3, line 23) independently prints the rate as 50%.
 *
 * SCOPE — v1 models GAINS ONLY, from the `capitalGains` fact, which holds the
 * Schedule 3 total before the inclusion rate. Everything on the loss side is
 * deliberately NOT modelled and fails loud rather than being treated as zero:
 *
 *   - allowable capital losses and the s. 3(b) netting of gains against losses
 *   - net capital losses of other years (s. 111(1)(b))
 *   - allowable business investment losses (s. 38(c))
 *   - the lifetime capital gains exemption (s. 110.6)
 *   - listed personal property (s. 41) and its separate netting rule
 *
 * A taxpayer with losses would get a WRONG answer from a gains-only model, so
 * `ca.federal.net_capital_losses` exists purely to refuse. It is not wired
 * into the income chain — a rule that always throws would make every return
 * unanswerable. It is reachable for anyone who asks for it directly, and it
 * documents the boundary. Wiring loss handling in is a later milestone.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });

export const capitalGainsRules: Rule[] = [
  {
    id: "ca.federal.taxable_capital_gains",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Taxable capital gains — one half of capital gains (line 12700)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 38(a)",
      section: "s. 38(a)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-38.html",
      excerpt:
        "…subject to paragraphs (a.1) to (a.3), a taxpayer's taxable capital gain for a taxation year from the disposition of any property is ½ of the taxpayer's capital gain for the year from the disposition of the property",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: {
      kind: "mulRate",
      base: fact("capitalGains"),
      rate: { num: "1", den: "2" },
      round: "half-up",
    },
  },
  {
    id: "ca.federal.net_capital_losses",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Capital losses — NOT MODELLED in v1 (refuses)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), ss. 3(b), 38(b)–(c), 111(1)(b)",
      section: "ss. 3(b), 38(b)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-3.html",
      excerpt:
        "…(b) determine the amount, if any, by which (i) the total of (A) all of the taxpayer's taxable capital gains for the year … exceeds (ii) the amount, if any, by which the taxpayer's allowable capital losses for the year … exceed the taxpayer's allowable business investment losses for the year",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: {
      kind: "unsupported",
      reason:
        "Capital losses are not modelled in v1. The corpus computes taxable capital gains from the `capitalGains` fact only (s. 38(a)); it does not implement the s. 3(b) netting of gains against allowable capital losses, net capital losses of other years (s. 111(1)(b)), allowable business investment losses (s. 38(c)), the lifetime capital gains exemption (s. 110.6), or listed personal property (s. 41). A return involving any of these cannot be computed by this corpus.",
    },
  },
];

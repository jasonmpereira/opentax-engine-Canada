# @woodgate/corpus-ca-federal

> Package name is a **placeholder** pending the H2 rename off "OpenTax"/@invaro
> (Invaro's trademarks). Do not publish or externally reference this name.

Canadian federal T1 individual income tax and benefits rules as data —
cited, temporally versioned, content-addressed — for the proof-carrying
engine in `packages/core`. TY2025 first. Replaces `corpus-us-federal`
per `docs/CANADA-CONVERSION.md`.

## Separate license (Angel condition 4)

This package is **proprietary** — Copyright (c) 2026 Woodgate Financial, all
rights reserved (see `LICENSE`). It is deliberately **NOT** under the
AGPL-3.0 that governs the engine. The engine loads the corpus **as data**
(a `CorpusInput` of rules and fact specs passed to `loadCorpus`), so the
corpus is not a derivative work of the engine and carries its own terms.
Internal-only distribution for now; `"private": true` prevents publication.

## Status: Phase 1 scaffold

- `src/facts.ts` — the fact catalog (province enum of 13 jurisdictions,
  marital status, income/deduction/credit inputs), with the no-guessing
  defaults convention: identity/status facts and primary income have **no
  default** (the engine refuses rather than guesses); zero-defaults are
  recorded as assumptions in the proof.
- `src/index.ts` — an **empty** rules array with TODO markers naming every
  Phase 2 rule file, including `amt.ts` (in scope for v1, D2),
  `quebec-abatement.ts` (D6), and `topup-credit.ts` (D4).
- Not yet wired into the root build: no `build` script, so `pnpm -r build`
  skips it. `scripts/gen-lock.mjs`, `corpus.lock.json`, and `test/` follow
  in Phases 2–3.

## Build order: AFNI first (D5)

Benefits (CCB s. 122.6, GST/HST credit s. 122.5, and the benefit-program
database) all income-test on **adjusted family net income (AFNI)**, which
derives from net income (line 23600). Encode in this order:

1. income → **net income (23600)** → taxable income (26000)
2. **AFNI** as a first-class target (`rules/afni.ts`) — before any benefit
3. federal tax (brackets, credits, AMT, abatement) → net tax (42000)
4. benefit targets (`ccb`, `gst_credit`, CWB) off the AFNI chain

Getting AFNI right and early means every benefit rule shares one audited
income-test base instead of each re-deriving it.

## Money convention

Integer **cents** internally, entered in dollars. Unlike the IRS
whole-dollar convention, the T1 computes in dollars and cents, so the
engine's exact-cents arithmetic matches CRA's forms directly.

## TY2025 verified facts (encode from these, not stale commentary)

Blended 14.5% lowest rate (Bill C-4, RA 2026-03-12); capital gains
inclusion stays 1/2; AMT 20.5% / $177,882 exemption; CPP2 YMPE $71,300 /
YAMPE $81,200; brackets $57,375 / $114,750 / $177,882 / $253,414;
BPA $16,129 phasing to $14,538.

# Canada conversion plan — opentax-engine → Canadian federal T1

Goal: replace the US federal corpus with a Canadian federal (T1, individual)
corpus, retarget the toolchain, and rebuild the differential-validation
harness — while keeping the project's core discipline intact: every rule
cites its authority with a verbatim excerpt and a validity window, every
answer ships a verifiable proof, and the engine refuses rather than guesses.

**What survives unchanged:** `packages/core` (the engine, proof format,
verifier, money arithmetic) is jurisdiction-agnostic — rules are data with a
free-form `jurisdiction` and `Citation`. Nothing in it references US law
except one doc-comment example. `docs/PROOF-FORMAT.md` survives as-is.

**What gets replaced:** the corpus (`packages/corpus-us-federal`), the fact
catalog, the CLI/MCP/playground/solve wiring that imports the US corpus, the
provincial (state) composers, the examples, the harness, and the README.

---

## Phase 0 — Decisions and source preparation

Decisions (settled 2026-07-26):

- [x] **Canada only.** This repo replaces the US corpus entirely: remove
      `corpus-us-federal`, the US state composers, and the US harness once
      the CA corpus lands. Upstream remains the US home.
- [x] **Benefits are in scope**, as separate query targets beyond the T1
      itself: Canada Child Benefit (s. 122.6), GST/HST credit (s. 122.5),
      and programs from the owner's government-benefit-program database
      (to be ingested — see "Benefits corpus" below). The v1 milestone is
      still the return (`ca.federal.net_tax`); benefit targets follow as a
      second milestone on the same corpus.
- [x] **Oracles: PolicyEngine Canada + CTaCS**, with CRA anchors (PDOC,
      T1 worksheets, certified software) for triage. See Phase 5 for what
      any additional resource must provide to join them.
- [ ] **Scope of v1**: federal T1 for individuals, TY2025 first (CRA's 2025
      figures are final). TY2026 versions follow. Corporate (T2) and trust
      (T3) out of scope.
- [ ] **Package naming**: `@invaro/opentax-corpus-ca-federal`, rule id
      prefix `ca.federal.*`, currency CAD. Decide whether the npm scope and
      repo name change too.

Source preparation (this is where your PDF + ~70 resources plug in):

- [ ] **Pin the ITA consolidation date.** The Income Tax Act, R.S.C. 1985,
      c. 1 (5th Supp.) is amended constantly. Record which Justice Laws
      consolidation your PDF is (the "current to YYYY-MM-DD" line on page 1)
      and treat that as the corpus's statutory snapshot. Every rule's
      `effectiveFrom`/`effectiveTo` window must be derivable from it plus
      the amending acts for recent changes.
- [ ] **Extract the PDF to searchable text** so rule `excerpt` fields can
      carry verbatim operative text (the `Citation.excerpt` convention the
      US corpus uses). Store extraction under a `sources/` or scratch area —
      do not commit the full Act if redistribution is a concern; excerpts in
      rules are fine.
- [ ] **Catalog the ~70 interpretation resources** into a source registry
      (`docs/SOURCES-CA.md`): id, type (Income Tax Folio, IT bulletin,
      Information Circular, technical interpretation, court decision, CRA
      guide/worksheet), topics covered, publication/revision date. Rules
      cite the ITA as primary authority; interpretation resources become
      *secondary* citations used where statutory text needs CRA's reading
      (e.g. Folio S1-F2-C2 for tuition, S3-F2-C1 for dividends).
- [ ] **Collect the parameter authorities** (the Canadian analogue of the
      Rev. Procs.): CRA's annual "Indexation adjustment for personal income
      tax and benefit amounts" table for 2025, the printed T1 return and
      federal worksheet, Schedules 6/8/11, and the T4032/PDOC payroll
      tables for CPP/EI ceilings and rates.
- [ ] **Write down the 2025 landmines** so nobody encodes stale secondary
      sources (the exact failure mode the US report caught PolicyEngine in):
      - Lowest federal rate cut to 14% effective 2025-07-01 → **TY2025 is a
        blended 14.5% year**; 15% for TY2024, 14% for TY2026. Also changes
        the non-refundable-credit rate for 2025.
      - Capital gains inclusion-rate increase (½ → ⅔) was **deferred, then
        cancelled** — inclusion stays ½. Verify against current text, not
        2024 commentary.
      - AMT regime substantially revised effective 2024 (broader base, 20.5%
        rate, higher exemption, 50% credit haircuts).
      - CPP2 (second additional CPP) fully phased in — two earnings ceilings
        (YMPE and YAMPE).
      - Consumer carbon price ended 2025-04-01; final Canada Carbon Rebate
        paid April 2025 — do not encode a CCR for TY2025 filings' future
        payments.

## Phase 1 — Corpus scaffolding

- [ ] Create `packages/corpus-ca-federal` mirroring the US package layout:
      `src/facts.ts`, `src/rules/*.ts`, `src/index.ts`,
      `scripts/gen-lock.mjs`, `corpus.lock.json`, `test/`.
- [ ] Define the **fact catalog** (`facts.ts`). Canada taxes individuals, so
      the `filingStatus` enum disappears. Core facts, each with the
      no-guessing defaults convention:
      - identity/status: `province` (enum, needed later for provincial
        composers and CWB variants), `maritalStatus`
        (single/married-or-common-law/separated…), `isAge65OrOlder`,
        `birthYear` if age-banded amounts need precision
      - spouse: `spouseNetIncome` (drives spousal amount, transfers),
        `spouseAge`, per-credit transfer facts as needed
      - dependants: counts/ages for eligible-dependant amount, CWB,
        childcare (s. 63) if in scope
      - income: `employmentIncome`, `selfEmploymentIncome`,
        `eligibleDividends`, `nonEligibleDividends`, `interestIncome`,
        `capitalGains`, `taxablePensionIncome`, `cppQppBenefits`,
        `oasBenefits`, `eiBenefits`, `rrspWithdrawals`
      - deductions: `rrspDeduction` (and contribution-room facts if
        validating the limit), `unionDues`, `childcareExpenses`,
        `movingExpenses` (or defer)
      - credit inputs: `tuitionFees`, `medicalExpenses`,
        `charitableDonations`, `studentLoanInterest`, `hasDisabilityTaxCert`
      - payroll: `cppContributionsPaid`, `eiPremiumsPaid` (or derive from
        employment income via Schedule 8 logic)
- [ ] Money stays integer **cents**; note in the corpus README that unlike
      IRS whole-dollar convention the T1 computes in dollars and cents, so
      the engine's exact-cents arithmetic matches CRA's forms directly.

## Phase 2 — Encode the T1 pipeline (rule files)

Suggested rule-file map (replacing the 51 US rule files), in dependency
order. Each rule: ITA citation + excerpt from the PDF, CRA
worksheet/schedule citation for the computational method, indexed dollar
amounts cited to the CRA indexation table, validity windows per year.

**Income → total income (line 15000):**
- [ ] `income.ts` — employment income (s. 5), other income aggregation
      (s. 3 ordering rules), interest (para. 12(1)(c)), pensions, EI, OAS,
      CPP/QPP benefits
- [ ] `dividends.ts` — gross-up: eligible 38% (s. 82(1)(b)(ii)),
      non-eligible 15% (s. 82(1)(b)(i)); taxable amount into income
- [ ] `capital-gains.ts` — taxable capital gains at ½ inclusion
      (ss. 38–39), net capital loss mechanics if in scope; LCGE (s. 110.6)
      deferred to a later milestone
- [ ] `self-employment.ts` — business income (s. 9) into total income

**Deductions → net income (line 23600) and taxable income (line 26000):**
- [ ] `deductions.ts` — RRSP (s. 146(5), limits per s. 146(1) "RRSP
      deduction limit"), CPP enhanced-contribution deduction
      (para. 60(e.1)), union dues (para. 8(1)(i)), childcare (s. 63) if in
      scope
- [ ] `social-benefits-repayment.ts` — OAS recovery tax (Part I.2,
      s. 180.2) and EI clawback; feeds both a deduction and line 42200
- [ ] `taxable-income.ts` — line 26000; losses carried and Division C
      deductions kept minimal for v1

**Federal tax:**
- [ ] `tax-brackets.ts` — s. 117(2) five brackets, s. 117.1 indexation;
      one rule version per year (TY2024 15% floor, TY2025 blended 14.5%,
      TY2026 14%) exactly like the US `income-tax.ts` versioning pattern
- [ ] `non-refundable-credits.ts` — the s. 118 family at the
      appropriate-percentage rate (s. 248(1) "appropriate percentage",
      which is the *lowest* rate — hence 14.5% for 2025):
      BPA with the s. 118(1.1) income-tested enhancement and phase-out;
      spouse/common-law amount and eligible-dependant amount
      (s. 118(1)(a)/(b)); age amount with income clawback; Canada
      employment amount (s. 118(10)); CPP base-contribution and EI-premium
      credits (para. 118.7); pension income amount (s. 118(3)); disability
      (s. 118.3); tuition (s. 118.5, Schedule 11); medical (s. 118.2,
      with the 3%-of-net-income floor); student loan interest (s. 118.62)
- [ ] `donations.ts` — s. 118.1 charitable credit: 15% on first $200
      (14.5% for 2025? — verify: the first-tier rate follows the
      appropriate percentage), 29% above, 33% tranche for income in the top
      bracket; 75%-of-net-income limit
- [ ] `dividend-tax-credit.ts` — s. 121: 6/11 of eligible gross-up,
      9/13 of non-eligible gross-up
- [ ] `cpp-self-employed.ts` — Schedule 8: base CPP, CPP1 additional, CPP2
      on self-employment earnings (both halves), the deduction/credit split
- [ ] `amt.ts` — revised (2024+) minimum tax, ss. 127.5–127.55: adjusted
      taxable income, $173,205-indexed exemption, 20.5% rate, credit
      restrictions, carryforward — or explicitly out of scope v1 with
      FAILS-LOUD applicability guards
- [ ] `cwb.ts` — Canada Workers Benefit (s. 122.7, Schedule 6), including
      the provincial reconfigurations (QC/AB/NU variants — needs
      `province`), disability supplement
- [ ] `net-tax.ts` — assemble line 42000 / balance lines; define the
      corpus `DEFAULT_TARGET` (`ca.federal.net_tax` ≈ line 42000)

**Explicit non-goals for v1 (delete the US files, don't port):** QBI, §224
tips/overtime deductions, senior deduction, FEIE/QSBS, kiddie tax, PTC,
Schedule R, IRA/8606, US corporate/fiduciary/estimated-tax rules. Where a
Canadian analogue exists but is deferred (LCGE, pension splitting, moving
expenses, foreign tax credit s. 126), add applicability guards so the
engine **refuses** (`NO_APPLICABLE_RULE`) instead of silently ignoring.

## Phase 3 — Tests for the corpus

- [ ] Port the golden-test pattern: hand-computed T1 fixtures worked from
      the actual CRA forms/worksheets (the analogue of
      `tax-table-2025-sample.json`), covering: single low income (CWB
      range), middle income with RRSP, dividend-heavy, capital gains,
      senior with OAS clawback, self-employed with CPP2, high income
      hitting the BPA phase-out and 33% donation tranche, 2025 blended-rate
      boundary checks.
- [ ] Parameter tests pinned to the CRA indexation table (analogue of
      `eitc-params.test.ts`).
- [ ] Regenerate `corpus.lock.json` via `gen-lock.mjs`; lock test.

## Phase 4 — Retarget the toolchain

Files currently importing `@invaro/opentax-corpus-us-federal` (all must
switch): `cli/src/{index,flags}.ts`, `cli/src/commands/{eval,check,lookup,
explain,search}.ts`, `cli/src/render/summary.ts`, `mcp/src/server.ts`,
`playground/src/main.ts`, `solve/src/lookup.ts`.

- [ ] CLI flags: drop `--status`, `--kids` (US semantics), tips/overtime,
      occupation matching; add `--province`, `--spouse-income`,
      `--eligible-dividends`, `--capital-gains`, `--rrsp`, etc. — flags map
      1:1 onto the new fact catalog, so regenerate from it.
- [ ] CLI `DEFAULT_TARGET` and summary rendering (proof-tree labels,
      currency formatting stays `$` but document CAD).
- [ ] MCP server: same corpus swap; rewrite tool descriptions so an LLM
      knows this is Canadian T1 (the "never let a model invent a tax
      number" pattern is jurisdiction-neutral).
- [ ] Playground: rebuild the single-file bundle with the CA corpus;
      update embedded copy.
- [ ] `examples/*.json` → Canadian scenarios (e.g.
      `on_married_90k_2kids.json`, `bc_single_50k.json`).
- [ ] `packages/compose`: remove US state composers (`ca/il/ny/pa/va`).
      Provincial Form 428 composers become the roadmap (Phase 7) — the
      compose architecture fits Canada *better* than US states, since every
      province except Quebec is collected on the T1.
- [ ] README, AGENTS.md, docs/METHODOLOGY.md: rewrite for Canada. Remove
      the TaxCalcBench claim (US-only benchmark); the validation story
      becomes the Phase 5/6 harness + golden fixtures until a Canadian
      benchmark equivalent exists.

## Phase 5 — Oracles (before building the harness)

**Chosen oracles: PolicyEngine Canada and CTaCS.** Any further resource is
welcome if it clears the bar below; resources that clear only part of it
still have a role (see the tiers).

### What a resource must provide to serve as an oracle

1. **Independence.** Implemented from primary sources (ITA/CRA) by someone
   who has never seen our corpus, and not derived from the same secondary
   source we used. The whole point of differential testing is that shared
   errors are unlikely; two encodings of the same blog post fail together.
2. **Scriptable batch execution.** Callable headlessly (library, API, CLI)
   over hundreds of generated scenarios. A calculator that must be clicked
   through is not an oracle — but see tier 2.
3. **Deterministic, exact output** with documented rounding, ideally to the
   cent. Same inputs → same answer, every run.
4. **A definable comparable.** We must be able to establish exactly what
   its "tax" number includes and excludes (refundables? provincial?
   clawbacks? CPP on self-employment?) — by documentation or by probing,
   as `run_policyengine.py` does for PE-US. If the total is a black box
   that can't be decomposed or probed, disagreements can't be triaged.
5. **Intermediate lines exposed** (net income, taxable income, individual
   credits). Not strictly required, but the difference between localizing
   a disagreement in minutes vs bisecting the whole return.
6. **Correct-year parameters.** Final TY2025 figures including the recent
   changes (blended 14.5% rate, cancelled inclusion-rate increase). An
   oracle that is itself stale generates false disagreements — tolerable
   if known, corrosive if not.
7. **Version-pinnable.** The report must cite the exact oracle version so
   results reproduce; a resource that silently updates under us can't
   anchor a published report.
8. **Licensing** that permits automated use and publishing comparison
   results.

### Tiers — where a resource that clears only part of the bar still helps

- **Tier 1 — oracle** (all of the above): joins the harness; every
  scenario runs through it. PolicyEngine Canada, CTaCS.
- **Tier 2 — anchor** (authoritative but not scriptable): NETFILE-certified
  software (TaxCycle, Profile, DT Max, Wealthsimple Tax), CRA PDOC, CRA's
  own worksheets. Used two ways: hand-worked **golden fixtures** in the
  corpus test suite, and the **tiebreaker** when the tier-1 oracles
  disagree with us — certified software is especially strong here because
  CRA certifies it against its own test suite.
- **Tier 3 — authority** (adjudicates, never computes): the ITA text, CRA
  Folios/ITs/guides, court decisions. These decide who is *right* in a
  triaged difference; they never generate expected values at scale.

A resource that is scriptable but not independent (e.g. anything built on
PolicyEngine's parameters) adds ~nothing as an oracle — classify by
provenance first.

- [ ] Classify the owner's additional resources into tiers 1–3.
- [ ] **Probe PolicyEngine Canada** (`policyengine-canada`) coverage first:
      confirm it models 2025 brackets (blended rate!), BPA enhancement,
      dividend credits, CWB, CPP2, OAS clawback. Its coverage is much
      thinner than `policyengine_us` — the probe determines the testable
      scenario space. Document what its `income_tax` variable includes
      (refundables? provincial?) the way `run_policyengine.py` documents
      its PE-US probes.
- [ ] Stand up **CTaCS** (Milligan's Canadian Tax and Credit Simulator) as
      the second oracle. Note it is distributed as Stata code — the harness
      runner needs Stata (or a port of the relevant year's do-files);
      confirm access before counting on it, and pin the CTaCS version.
- [ ] Non-oracle anchors for triage: CRA **PDOC**/T4032 for CPP/EI, the
      printed T1 worksheets, and a handful of returns cross-checked in
      NETFILE-certified software.

## Phase 6 — Differential harness and the new REPORT.md

- [ ] Rewrite `harness/generate-scenarios.mjs`: grid over province ×
      individual income × spouse income × dependants × age × dividend mix ×
      capital gains × RRSP × self-employment. No filing-status axis.
- [ ] Rewrite `harness/run_policyengine.py` for `policyengine-canada`
      (household structure: person/marital unit/household; province).
- [ ] `harness/run-opentax.mjs`: new fact mapping and target.
- [ ] `harness/compare.mjs`: define the **comparable** — opentax
      `ca.federal.net_tax` (line 42000) ↔ oracle's equivalent, with the
      probed inclusion/exclusion list stated in the report header.
- [ ] Triage every difference with primary sources (ITA text from the PDF,
      CRA worksheets) into `known-differences.json`, verdict-tagged as the
      US harness does. Likely first candidates: BPA phase-out rounding,
      2025 blended-rate handling, CWB provincial variants, donation-credit
      33% tranche.
- [ ] Regenerate `harness/REPORT.md` — new corpus hash, new comparable
      definition, zero unexplained disagreements as the bar. The current
      REPORT.md's contents (CTC/QSS, §224 tips, step rounding) are US
      artifacts and disappear entirely.

## Phase 7 — Roadmap after federal v1

- [ ] Provincial composers (Form 428 per province) in `packages/compose`:
      start with ON (surtax + Ontario Health Premium make it the best
      stress test), then BC/AB. Quebec last (separate return, federal
      abatement, QPP/QPIP).
- [ ] Deferred federal features: pension income splitting (s. 60.03), LCGE,
      foreign tax credit (s. 126), moving expenses, losses carryover,
      instalments (s. 156).
- [ ] TY2026 rule versions once CRA publishes final indexation.

### Benefits corpus (in scope — milestone 2)

Benefits are separate query targets on the same engine (e.g.
`ca.federal.ccb`, `ca.federal.gst_credit`), each a rule chain from return
facts (adjusted family net income, dependants' ages, province) to an
entitlement, cited like any tax rule.

- [ ] Ingest the owner's **government benefit program database**: for each
      program capture authority (statute/regulation/program terms),
      administering body, eligibility conditions, benefit formula,
      income-test definition (which "income" — AFNI? line 23600?),
      payment period vs base year, and indexation source. Programs whose
      rules aren't statutory/published get flagged — the engine refuses
      what it can't cite.
- [ ] Start with the two statutory ones (CCB s. 122.6, GST/HST credit
      s. 122.5) — both are fully specified in the ITA and both are modeled
      by PolicyEngine Canada, so the differential harness extends to them
      naturally (benefits are PE-Canada's strong suit).
- [ ] Benefit periods run July–June on prior-year income — the corpus's
      `effectiveFrom`/`effectiveTo` windows handle this, but targets must
      state clearly which base year an entitlement derives from.

---

### Where the ~70 interpretation resources fit

They are not the skeleton — the ITA + CRA forms are. They earn their keep
in three places: (1) `Citation` secondary entries where a rule encodes
CRA's administrative reading rather than bare statutory text; (2) the
triage step of the harness, where an oracle disagreement needs an
authoritative tiebreaker; (3) applicability guards — Folios often define
the edge cases (who counts as a spouse, what is an eligible dependant)
that decide when a rule's guard should refuse rather than compute.
Catalog them first (Phase 0), cite them lazily as rules need them.

# SOURCES-CA.md — Canadian Source Registry

## Purpose

This file is the single registry for the interpretation resources that inform
the Canadian T1 + benefits conversion.
Every statute consolidation, CRA Folio/IT/IC, guide, worksheet, court decision,
and commercial reference used to justify a calculation rule must be cataloged
here before it is cited in code, fixtures, or the corpus. The registry records
each resource's provenance, copyright status, whether its text may ever be
excerpted into this repository, and its tier in the validation hierarchy.
Jason's handover is **complete** (zip, 2026-07-27) and fully cataloged below.
Canonical Crown sources not in the handover — the ITA and Regulations
consolidations (Justice Laws), Income Tax Folios, CRA guides and forms — are
freely retrievable and will be added as individual rows when first cited by a
rule, pulled directly from canada.ca / laws-lois.justice.gc.ca.

## Classification rules (per CANADA-CONVERSION.md, Phase 5)

- **Tier 1 — oracle**: clears the full Phase 5 bar (scriptable, per-component
  comparable, pinned). Joins the harness; every scenario runs through it.
  Currently: PolicyEngine Canada (pinned commit
  `389648ad24131ed958d7bb6f514d56199b129e5c`; benefits side sound, T1 total
  structurally broken — comparisons are per-component only) and CTaCS
  (provisional, contact pending).
- **Tier 2 — anchor**: authoritative but not scriptable. NETFILE-certified
  software (TaxCycle, Profile, DT Max, Wealthsimple Tax), CRA PDOC, CRA's own
  worksheets. Used for hand-worked golden fixtures and as tiebreakers when
  oracles disagree with us.
- **Tier 3 — authority**: adjudicates, never computes. The ITA text, CRA
  Folios/ITs/ICs/guides, court decisions. These decide who is *right* in a
  triaged difference; they never generate expected values at scale.

## Compliance columns (Banshee H5)

Every row must fill all of the following:

| Column | Meaning |
|---|---|
| `id` | Stable short identifier, unique in this file (e.g. `folio-s1-f1-c1`). |
| `title` | Full title of the resource. |
| `publisher` | Publisher / provenance (CRA, Justice Laws, court, commercial publisher, academic, etc.). |
| `type` | One of: Folio, IT, IC, guide, statute consolidation, worksheet, court decision, commercial. |
| `copyright` | **Crown** or **commercial** copyright status. |
| `excerpt-permitted` | Crown works: **yes**, with attribution; statutes/regulations additionally require the SI/97-5 "not an official version" notice. Commercial-publisher works: **NO** — cite only, never excerpt, never commit any text. |
| `revision-date` | Date of the version consulted (consolidation/current-to date, publication date, or decision date). |
| `topics` | Comma-separated topics the resource informs (e.g. `capital-gains`, `bpa`, `cpp2`, `amt`, `ccb`). |
| `tier` | 1 (oracle), 2 (anchor), or 3 (authority). |

## Registry

Intake count: **6** (handover of 4 complete — zip received 2026-07-27, PPI PDF
first received 2026-07-26 and re-confirmed byte-identical in the zip; ITA and
ITR consolidations received by separate upload 2026-07-27 and committed
in-repo under `docs/sources/`).

| id | title | publisher | type | copyright | excerpt-permitted | revision-date | topics | tier |
|---|---|---|---|---|---|---|---|---|
| ppi-lit-2025 | Tax Talk — The Advisor's Guide to Life Insurance Taxation 2025 | PPI Management Inc. (commercial insurance MGA) | commercial | commercial | **NO — cite only, never excerpt, never commit** (PDF held outside the repo; sha256 prefix `6ff3e7a0490c25d0`, 60 pp, image-only scan) | April 2025 ("last updated April 2025" per inside cover) | life-insurance-taxation: exempt-test (s.148, Reg 306/307), acb, ncpi, csv, dispositions-and-policy-gains, policy-loans, rollovers-s148(8), transfers-s148(7), cda, rdtoh, corporate-owned-insurance, share-valuation, 10/8-policies, leveraged-insured-annuity, interest-deductibility, post-mortem-stop-loss, charitable-donation-of-policies, seg-funds, disability-ci-taxation, tosi-interaction, gre, probate, us-estate-tax | 3 |
| vtn-ptu-2025 | Personal Tax Update 2025 — 43rd Annual, Planning and Preparation of 2024 Personal Tax Returns (PTU2025 textbook) | Video Tax News Inc. | commercial | commercial | **NO — cite only, never excerpt, never commit; DO-NOT-INGEST pending relicensing (see registry note)** (PDF held outside the repo; sha256 prefix `3cb1399942`, 436 pp, text layer present) | January 2025 (v1 01.10.2025) | t1-preparation-ty2024, current-developments, capital-gains-losses, credits-and-benefits, business-income, employment-income, owner-manager-remuneration, gst-hst, estates-trusts-deceased, retirement-registered-plans, other-income-deductions, cra-assessing-admin, us-international | 3 |
| vtn-ctu-2025 | Corporate Tax Update 2025 — 41st Annual, Fresh Ideas and New Snags (CTU2025 textbook) | Video Tax News Inc. | commercial | commercial | **NO — cite only, never excerpt, never commit; DO-NOT-INGEST pending relicensing (see registry note)** (PDF held outside the repo; sha256 prefix `99987437da`, 432 pp, text layer present) | September 2025 (v2 10.03.2025) | corporate-tax, current-developments, owner-manager-remuneration, gst-hst, npo-charities, reorganizations, capital-gains-losses, business-purchase-sale, business-property-income, estate-retirement-planning, t2-returns, employees, cra-assessing-admin, us-international | 3 |
| cra-itam | CRA Income Tax Audit Manual (ITAM), Domestic Compliance Programs Branch — full manual, pre-chunked | CRA (canada.ca) | guide | Crown | yes (attribution required; held outside the repo pending an intake decision — see registry note) | not captured at scrape time (manifest `date_modified` empty; ITAM chapters carry own revision notes — pin on ingestion) | audit-procedure, taxpayer-rights-relief, penalties, objections-appeals, losses, income-characterization, related-party-transactions, estates-trusts, clearance-certificates, international-audit, audit-techniques | 3 |
| ita-consolidation | Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.) — Justice Laws consolidation (PDF bilingual 3,827 pp + LIMS XML) | Justice Laws (Department of Justice Canada) | statute consolidation | Crown | yes (attribution + SI/97-5 "not an official version" notice) — **committed in-repo: `docs/sources/ita-consolidated-2026-06-14.pdf`** (`31cc0fee5bcb1521`) **and `.xml`** (`f65398c6f8a1006a`; preferred for machine use) | current to 2026-06-14, last amended 2026-04-01 (PDF and XML identical) | all | 3 |
| itr-consolidation | Income Tax Regulations, C.R.C., c. 945 — Justice Laws consolidation (PDF bilingual 1,361 pp + LIMS XML) | Justice Laws (Department of Justice Canada) | statute consolidation | Crown | yes (attribution + SI/97-5 "not an official version" notice) — **committed in-repo: `docs/sources/itr-consolidated-2026-06-14.pdf`** (`fd624ad485ede26b`) **and `itr-consolidated-2026-03-31.xml`** (`67841e2c5ed4fe1c`; preferred for machine use) | PDF current to 2026-06-14, XML snapshot current to 2026-03-31 — both last amended 2026-03-26, substantively identical | all; notably withholding (Reg 100–109), CCA (Reg 1100/Sch II), exempt-test policies (Reg 306/307), prescribed-rates (Reg 4301) | 3 |
| cra-t1-2025 | CRA 2025 T1 Income Tax and Benefit Return package (English, Ontario) — 69 forms: federal `5000-*` (return, worksheet, guide, Schedules 2/3/5/6/7/8/9/11/12/13/15) plus Ontario `5006-*` | CRA (canada.ca) | form package | Crown (canada.ca terms of use — NOT SI/97-5) | **values only — PDFs held outside the repo pending a licensing decision (see registry note); 116 extracted constants committed at `docs/parameters/ty2025-cra-forms.json`** | TY2025 forms, package dated 2026-03-03; received 2026-07-29 | tax-brackets, non-refundable-credits, cwb, capital-gains, donations, disability, oas-recovery, dividend-gross-up, ei-premiums, top-up-credit, fhsa, caregiver | 1 |


Registry notes:

- **cra-t1-2025** — Crown copyright, but on the **canada.ca terms of use**, not
  the SI/97-5 Reproduction of Federal Law Order that covers the ITA/ITR
  consolidations. Those terms permit non-commercial reproduction freely; this
  repository ships a commercial licence (`COMMERCIAL-LICENSE.md`), so
  redistributing the PDFs from here is an **open question and Jason's call**.
  Pending that decision the package sits in gitignored
  `docs/reference-local/cra-t1-2025/` and only the extracted VALUES are
  committed — a dollar figure or a rate is a fact, not an original work, and
  carries no copyright even where the document does. Each value cites its form,
  page and CRA field label, and each source PDF's sha256 is recorded, so the
  extraction is auditable without the documents being redistributed.

  Verified on intake 2026-07-29: all 69 PDFs are the **blank published forms**
  (zero taxpayer-entered field values; page 1 reads "T1 2025"), so no client
  data entered the repository. Tier 1 because the fillable variants carry the
  year's indexed figures as read-only field values — this is CRA's own return,
  the strongest available authority for indexed amounts, and it supersedes the
  search-snippet evidence in `docs/research/m0/cra-parameter-pins.md` for every
  figure it covers.

  Scope limits: the `5000-*` forms are federal and identical across provincial
  packages, so the federal corpus is fully served. The `5006-*` forms are
  Ontario's and are Phase 7 material. The CWB amounts here are the **standard**
  reconfiguration — AB, QC and NU differ under s. 122.7 and their packages are
  not held, so `rules/cwb.ts` must refuse for those provinces rather than apply
  these. CPP rates (YMPE/YAMPE), T4127 and the indexation adjustment page are
  in no T1 package and remain outstanding.

- **ppi-lit-2025** — engine relevance: LOW for v1 T1 (policy gains reach the
  T1 as other income, line 13000 — not in v1 scope) and none for M2 benefits;
  HIGH for advisory reference and any later corporate/estate scenarios. It is a
  secondary practitioner guide: where it is used to triage or guard a rule, the
  operative citation must be the ITA provision or CRA document it summarizes,
  with this guide cited as corroboration only. Currency caution: predates
  nothing critical for TY2025 T1, but its "proposed changes" notes (e.g.
  intergenerational transfers) must be re-verified against enacted law before
  reliance. Image-only PDF (no text layer) — page-image reading or OCR required.

- **vtn-ptu-2025 / vtn-ctu-2025 — LICENSING HOLD (stronger than H5).** Both
  textbooks are watermarked on every page "for the exclusive use of Aravind
  Sithamparapillai of Ironwood Wealth Management Group" — the license belongs
  to a third-party registrant, not to Jason or Woodgate. On top of that, VTN's
  copyright notice (CTU2025, p. 3) expressly prohibits "uploading content to
  websites, intranets, cloud platforms, or AI tools, and using it for
  training." H5 already bars committing or excerpting commercial text, but
  these two go further: they must not be ingested into the Tax Bot corpus,
  embedded, or uploaded to any retrieval store *at all* until Woodgate holds
  its own registration and written permission from VTN
  (videotax.com/copyright). Until then they are catalog-entry-only: a human
  may consult them; the operative citation in any rule must be the underlying
  ITA provision, CRA document, or case they summarize. Also note vtn-ptu-2025
  covers **TY2024** returns — parameter values must not be reused for TY2025
  rules without re-verification.

- **cra-itam** — Crown copyright; excerpting is permitted with attribution, so
  unlike the commercial rows this one *could* eventually live in the repo.
  Received as an LLM-ready chunk set (74 markdown chunks, ~1.96M chars, with
  `manifest.jsonl`/`manifest.csv` carrying `chunk_id`, `source_url`
  provenance per chunk, and per-chunk content hashes) derived from a
  consolidated scrape of the canada.ca ITAM pages. Held outside the repo for
  now: before committing, (1) spot-verify chunks against the live canada.ca
  pages since the intermediate consolidation was tool-generated, and (2) pin
  the manual's revision dates, which the manifest left empty. Engine
  relevance: administrative/audit posture, penalties, objections — Tier 3
  authority for procedure questions, not a computation source.

  **Verification attempted 2026-07-28 — not performed; blocked on two counts.**
  Neither precondition for committing this row can be met from this
  environment:
  - *(1) spot-verify chunks against live canada.ca* — blocked. Every route to
    canada.ca fails (egress-proxy CONNECT 403; WebFetch 403 from the WAF on
    every path tried). See the 2026-07-28 re-check table in
    `docs/research/m0/cra-parameter-pins.md` for the full route list.
  - *(2) pin the manual's revision dates* — blocked independently of the
    network: **the ITAM chunk set is not present in this environment.** A
    filesystem search for the 74 markdown chunks and for
    `manifest.jsonl`/`manifest.csv` returned nothing. Consistent with "held
    outside the repo", but it means the material to be verified is itself
    unavailable here, so even a canada.ca-capable network would not by itself
    let this verification run.

  Status is therefore unchanged: **cra-itam stays catalog-entry-only and out of
  the repo.** Clearing it needs both the chunk set made available to the
  session and canada.ca reachable — and note that the revision dates the
  manifest left empty must come from the ITAM chapters' own revision notes, so
  pinning them requires the chunk set regardless of network access.

- **ita-consolidation / itr-consolidation** — the anchor authorities for every
  rule; committed in-repo (Crown, SI/97-5) under `docs/sources/` in two
  formats each: the bilingual PDF (human reference) and the LIMS XML
  (structured by section with LIMS ids and in-force dates — the preferred
  version for chunking, retrieval, and pinpoint citation). A newer
  consolidation supersedes by adding a new dated file and updating
  `revision-date` — see `docs/sources/README.md`.

Format example (verify on population):

| id | title | publisher | type | copyright | excerpt-permitted | revision-date | topics | tier |
|---|---|---|---|---|---|---|---|---|
| folio-s1-f1-c1 | Income Tax Folio S1-F1-C1, Medical Expense Tax Credit | CRA | Folio | Crown | yes (attribution required) | EXAMPLE | medical-expenses, credits | 3 |

## Standing rule (Banshee H5, veto-backed)

> **Zero commercial-publisher text may be reproduced in the corpus or committed
> to this repository (Banshee H5, veto-backed). Corpus tooling must refuse
> excerpts from non-permitted sources.**

This applies to every commercial-copyright row regardless of tier. Crown works
may be excerpted only with attribution, and statutes/regulations only with the
SI/97-5 "not an official version" notice.

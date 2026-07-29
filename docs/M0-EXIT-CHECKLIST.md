# M0 Exit Checklist

M0 exits only when every gate below is checked, or explicitly waived under the waiver authority. Status as of 2026-07-28.

- [x] **ITA dates pinned** — CLOSED 2026-07-27: Justice Laws consolidations
  received from Jason and committed under `docs/sources/` in PDF + LIMS XML.
  ITA current to **2026-06-14**, last amended **2026-04-01**; ITR PDF current
  to 2026-06-14 / XML snapshot 2026-03-31, both last amended **2026-03-26**.
  These are the corpus's statutory snapshot; hashes in `docs/sources/README.md`.
- [x] **SOURCES-CA.md populated** — CLOSED 2026-07-27: handover complete at
  **6 registered sources** (the ~70 estimate was overstated — Jason confirmed
  the batch-1 zip was everything). Registry live with compliance columns;
  note the VTN textbooks carry a licensing hold (do-not-ingest) and the CRA
  ITAM chunk set awaits canada.ca spot-verification (needs egress).
- [ ] **Top-up citation pinned** — owner: Phoenix — status: **in progress**
- [x] **CTaCS confirmed-or-fallback** — RESOLVED 2026-07-26: **CTaCS dropped by Jason's decision** (no outreach). blamario (verified GO, full TY2025 forms, GPL — no permission needed for automated use or published comparisons) is elevated to second differential oracle alongside per-component PE-Canada; fixtures remain primary per D10. Stata purchase cancelled. Outreach draft retained at docs/research/m0/ctacs-outreach.md should CTaCS ever be revisited.
- [ ] **blamario GO-WAIT decision** — owner: Phoenix — status: **in progress**
- [x] **PE-Canada vendored** (pinned commit 389648ad24131ed958d7bb6f514d56199b129e5c) — CLOSED 2026-07-28: pin verified against upstream via the GitHub mirror route (`laws-lois`/`canada.ca` are 403 but GitHub is reachable). **1086/1086 vendored files match upstream byte-for-byte** by blob hash; sole upstream-only path is `.DS_Store`. Both documented T1 defects confirmed verbatim at that commit, so the per-component-only oracle policy rests on verified ground. Method and dated record in `harness/vendor/README.md`; re-runnable. Note `.git` was stripped at vendoring time, so before this none of it was checkable from inside the repo.
- [x] **H2 rename — name chosen: OpenCanTax** (Jason, 2026-07-26). Scope @opencantax applied to corpus-ca-federal; NOTICE.md brands the fork with Invaro trademark attribution + non-affiliation. Jason WAIVED the OpenTax-mark-adjacency concern in writing (Decision Record). GitHub repo renamed to `opencantax` by Jason 2026-07-26 — **H2 gate CLOSED** (old URLs redirect). Engine-package scope rename (@invaro/* → @opencantax/*) deferred to the M1 toolchain retarget (US-corpus deletion regenerates locks anyway).
- [x] **Corpus package scaffolded** — CLOSED 2026-07-28: `packages/corpus-ca-federal` complete for Phase 1. Fact catalog at **33 facts** (every ITA reference pulled verbatim from the mirror-verified LIMS XML), plus `scripts/gen-lock.mjs`, `corpus.lock.json` (merkle `842ccf7b…`, 0 rules / 33 facts), and **47 tests** across lock/facts/refusal. Package stays INERT BY DESIGN — the refusal suite pins that `ca.federal.net_tax` fails loud rather than returning a number. Phase 2 rule authoring is the next step, not part of this gate.
- [ ] **Benefits-DB audit** — owner: Angel — status: **blocked on handover**
- [x] **Invaro outreach** — DEFERRED by Jason 2026-07-26 to project completion. Residual accepted: Angel's build-vs-buy de-risk (their Canada roadmap + pricing) will not be known before M1 spend. Draft retained at docs/research/m0/invaro-outreach.md.
- [ ] **Resource-plan numbers papered** — owner: Xavier — status: **due D12**

## Waiver authority

Jason may waive any gate explicitly in writing. A waived gate is checked with a note "WAIVED by Jason, <date>, <reference>".

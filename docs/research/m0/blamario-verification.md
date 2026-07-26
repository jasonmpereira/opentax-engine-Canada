# blamario/canadian-income-tax — In-Repo Verification (M0, Phoenix/Beast)

Date: 2026-07-26. Method: full clone of https://github.com/blamario/canadian-income-tax and direct inspection of the working tree, git history, README, CHANGELOG, and cabal file. Verified commit at HEAD: `ab245863c9bb934ab96da9e4f2d5e4f748af73dd`.

## Verdict: **GO** — TY2025 support is present. Runner build is unlocked per Forge condition 7.

## 1. TY2025 support — CONFIRMED

- The package version at HEAD is **2025.1** (`canadian-income-tax.cabal`, `version: 2025.1`), released per commit "Release 2025.1" dated **2026-03-15**. Same version is live on Hackage: https://hackage.haskell.org/package/canadian-income-tax (resolves to `canadian-income-tax-2025.1`).
- All bundled CRA form data is the **2025 edition** (`-25e` suffix in CRA filenames): e.g. `data/pdf/T1/5000-r-fill-25e.pdf`, `data/fdf/5000-s8-fill-25e.fdf`, `data/pdf/428/5006-c-fill-25e.pdf`. No 24e files remain in `data/`.
- CHANGELOG.md corroborates:
  - **2025.0**: "Removed some form fields and added new ones for the 2025 tax return forms."
  - **2025.1**: "Updated the benefit amounts in Schedule 6 to the 2025 values"; "Updated 15% to the 2025 value of **14.5%** in Schedules 9 and 11" — consistent with the Bill C-4 blended lowest rate we verified independently, a good sign of currency.
- Post-release maintenance continues: commit 2026-04-12 "Calculate line 25000 when possible, warn otherwise".

## 2. Commit history

- **332 commits** on the default branch (`git log --oneline | wc -l`).
- **Last commit: 2026-04-12** (`ab24586...`, "Bump the forms-data-format upper bound") — active ~3.5 months ago as of today.
- Effectively a single-author project: Mario Blažević 326 commits (323 + 3 as "Mario"), plus 6 from copilot-swe-agent[bot].
- **Zero git tags** in the clone; versioning is via Hackage releases (2024.0.x, 2024.1.x, 2025.0, 2025.1 per CHANGELOG). GitHub Releases API could not be queried from this sandbox (GitHub API access proxied off for this repo) — but with 0 tags there can be no tag-based GitHub releases; treat "no GitHub releases" as near-certain, unverified via API.
- URL: https://github.com/blamario/canadian-income-tax/commits/master

## 3. Toolchain requirements (from README.md + cabal file)

- **Haskell/GHC**: README says GHC **>= 9.4** via ghcup + cabal; cabal file `tested-with: ghc == 9.4.4, ghc == 9.6.3`. Install path: `cabal install canadian-income-tax`.
- **pdftk is required** for the normal workflow: the CLI `complete-canadian-taxes` shells out to `pdftk` for PDF<->FDF conversion (module `Tax.PDFtk`). Ubuntu: `apt install pdftk`; Fedora: `dnf install pdftk-java` (the Java reimplementation is accepted). Alternative: a documented **manual FDF mode** where you run `pdftk generate_fdf` / `fill_form` yourself — the engine itself only transforms FDF, so for oracle use we can feed/read FDF directly and only need pdftk to produce initial FDFs from CRA PDFs (blank `-25e` FDFs are already bundled under `data/fdf/`).
- Two executables: `complete-canadian-taxes` (CLI) and `serve-canadian-taxes` (local web server on :3000).

## 4. License

- **GPL-3.0-or-later** (`canadian-income-tax.cabal`: `license: GPL-3.0-or-later`; `LICENSE` is GNU GPL v3 text). URL: https://github.com/blamario/canadian-income-tax/blob/master/LICENSE
- Implication for us: fine to run as an external test oracle (running a GPL program and comparing outputs imposes nothing on our code). Do **not** vendor its source into this repo or link against the library from our engine.

## 5. Forms and provinces completed (README + source layout)

- **T1 is supported for all provinces and territories** (bundled T1 variants, all 25e: 5000-r general, 5001-r NL, 5005-r QC, 5006-r ON, 5009-r AB, 5010-r BC, 5011-r YT, 5012-r NT, 5014-r NU).
- **Federal schedules**: 6 (CWB), 7 (RRSP), 8 (CPP), 9 (donations), 11 (tuition) — `src/Tax/Canada/Federal/`. T4 slip input supported (`src/Tax/Canada/T4.hs`, `t4-fill-25e`).
- **Provincial 428**: ON (5006-c), BC (5010-c), AB (5009-c), MB (5007-c) only.
- **Provincial 479** (credits): ON (5006-tc), BC (5010-tc) only.
- Other provinces (NB, NL, PE, QC, SK/NS/etc.): only T1 + federal schedules are completed. Source has province/territory modules `AB BC MB NB NL ON PE QC` + `NT NU YT` under `src/Tax/Canada/{Province,Territory}/`, but 428/479 completion is limited to the four/two above per README.
- Explicit README caveat: "comes with no warranty and has not been verified by CRA" — consistent with our "provisional oracle" designation.

## 6. Sources

- Repo: https://github.com/blamario/canadian-income-tax
- README: https://github.com/blamario/canadian-income-tax/blob/master/README.md
- CHANGELOG: https://github.com/blamario/canadian-income-tax/blob/master/CHANGELOG.md
- Hackage: https://hackage.haskell.org/package/canadian-income-tax
- Verified at commit: `ab245863c9bb934ab96da9e4f2d5e4f748af73dd` (2026-04-12) — recommend pinning this commit for oracle use.

## Decision per Forge condition 7

**GO.** TY2025 (2025.1, 25e forms, 14.5% blended rate) is present at HEAD and on Hackage. Runner build is unlocked. Suggested pin: commit `ab245863c9bb934ab96da9e4f2d5e4f748af73dd` or Hackage `canadian-income-tax-2025.1`. Scope caution: oracle coverage beyond T1+federal schedules exists only for ON/BC 428+479 and AB/MB 428.

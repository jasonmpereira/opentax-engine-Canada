# Naming shortlist — H2 rename (drop "OpenTax" / @invaro)

Date: 2026-07-26. Forge team. Constraints: must work as npm scope (`@scope`),
GitHub org/repo, and rule-id prefix; no collision with Canadian tax software,
CRA marks, or obvious trademarks; ideally evokes Canadian tax / proofs /
transparency. Public-facing name — professional preferred; one themed
candidate permitted.

## How availability was checked

- **npm scope**: `GET https://registry.npmjs.org/-/org/<name>` (404 = no such
  org) and `GET https://registry.npmjs.org/<name>` (404 = bare package name
  unclaimed). registry.npmjs.org is reachable directly (proxy-exempt), so
  these results are solid.
- **npm org web page** (`npmjs.com/org/<name>`): returned **403 for every
  name** through the sandbox proxy — could not be verified. The registry
  endpoint above is the authoritative signal anyway.
- **GitHub**: direct `github.com/<name>` and `api.github.com/users/<name>`
  are blocked in this sandbox (repo-scoped API only, both returned 403).
  Used the GitHub search API (`search_users`, `<name> in:login`) instead:
  0 hits = no user/org whose login contains the string. Re-verify with a
  plain browser before registering.
- **Trademark/product collisions**: web search over Canadian fintech/tax.
  No formal CIPO trademark search was run — do that before final adoption.

## Candidates

| # | Name | npm org | npm pkg | GitHub login | Collision search | Verdict |
|---|------|---------|---------|--------------|------------------|---------|
| 1 | **borealtax** | 404 (free) | 404 (free) | 0 hits | No product/company found; searches surface only generic Canadian tax software | **Clean — recommended** |
| 2 | **taxprove** | 404 (free) | 404 (free) | 0 hits | No "TaxProve" found; nearest is Prove (prove.com, US identity-verification fintech, ~$1B) — different field, but adjacent-fintech mark | Good |
| 3 | **provenorth** | 404 (free) | 404 (free) | 0 hits | No "ProveNorth" entity found; same Prove-adjacency note as above | Good |
| 4 | **t1proof** | 404 (free) | 404 (free) | 0 hits | No product named T1Proof. "T1" is CRA's form designation — descriptive use, not a CRA mark, but reads narrow once benefit targets (CCB, GST/HST credit) matter | OK, but scope-narrow |
| 5 | **clearnorth** | 404 (free) | 404 (free) | 1 near-hit: `clearnorthai` | **Clear North Capital** (Calgary family office, clearnorth.ca / clearnorthcapital.com) — active Canadian *financial* firm; plus an AI-branded GitHub neighbour | Risky — Canadian-finance collision |
| 6 | **auroratax** (themed: Aurora, Alpha Flight's Canadian X-Men member; also northern lights) | 404 (free) | 404 (free) | 0 hits | **AuraTax.ca** — live Canadian online tax software, confusably similar; also Town of Aurora, ON tax office; Aurora Cannabis | Risky — confusable with AuraTax |

**Ruled out during search:** `maplecalc` — maplecalc.ca is a live Canadian
income/capital-gains tax calculator (direct product collision).

## Notes

- Rule-id fit: rule ids stay `ca.federal.*` regardless; the name only needs
  to work as a scope/prefix (`@borealtax/corpus-ca-federal`,
  `borealtax.ca.federal.*` if a namespaced prefix is ever wanted). All six
  are short, lowercase, hyphen-free — all fit.
- "Boreal" evokes the Canadian north without claiming CRA vocabulary, has
  no tax-software incumbent, and sounds professional; `borealtax-engine` /
  `@borealtax/core` scan naturally.

## Recommendation

**borealtax** — the only candidate with zero collisions found anywhere
(npm, GitHub, Canadian fintech/tax product space); `taxprove` and
`provenorth` are strong runners-up if a proof-forward name is preferred.
Before registering: re-verify github.com/borealtax in a browser and run a
CIPO trademark search.

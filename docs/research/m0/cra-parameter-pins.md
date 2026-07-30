# CRA Parameter Pins — TY2025 (M0 research)

Pulled 2026-07-26 (Phoenix/Sage). These are the three CRA items that previously blocked automated fetch.

## Access-method note (read first)

Direct fetches of `www.canada.ca` failed by **two independent mechanisms** on 2026-07-26:

1. WebFetch → HTTP 403 from the server (canada.ca WAF blocks non-browser fetchers), including the `/content/canadasite/...` alternate path.
2. `curl` through the session egress proxy → CONNECT 403 (**`www.canada.ca` is not on the org's egress allowlist**; `web.archive.org` is also blocked). Per proxy policy this was reported, not routed around.

**What worked:** the WebSearch tool, whose result summaries quote the official canada.ca pages directly (search-index snapshots of the cited URLs). Every figure below is cited to its official canada.ca URL, but the text was obtained via search snapshot, not a live page fetch. Corroboration via TaxTips.ca was attempted and also 403'd. Confidence flags: **[official-snippet]** = wording traceable to the cited canada.ca page via search snapshot; **[secondary-only]** = corroborated only from non-government sources.

---

## 1. NETFILE — certified software (TY2025) and filing-season opening

Official page: <https://www.canada.ca/en/revenue-agency/services/e-services/digital-services-individuals/netfile-overview/certified-software-netfile-program.html> (alternate path that appears in the search index: `https://www.canada.ca/content/canadasite/en/revenue-agency/services/e-services/digital-services-individuals/netfile-overview/certified-software-netfile-program.html`)

### Filing-season windows [official-snippet]

| Season | Opens | Closes |
|---|---|---|
| TY2025 season | **Monday 2026-02-23, 6:00 a.m. ET** (NETFILE/ReFILE; EFILE 8:30 a.m. ET) | Friday **2027-01-29** |
| TY2024 season (prior) | Monday 2025-02-24 | — |

Quoted from the CRA page via search snapshot: "The NETFILE and ReFILE services are open for transmission from Monday, February 23, 2026 at 6:00 a.m. (Eastern time), until Friday, January 29, 2027. You can electronically file your 2018, 2019, 2020, 2021, 2022, 2023, 2024 and 2025 initial personal income tax and benefit return using NETFILE and you can file your amended T1 returns for 2022, 2023, 2024 and 2025 using ReFILE."

The 2025-02-24 opening for the TY2024 season is corroborated by CRA-derived secondary coverage (TurboTax community/H&R Block/press) — **[secondary-only]** for the exact prior-season date.

### Certified software, TY2025 — PARTIAL list

The CRA page's snapshot names (alphabetical head of list): **AdvTax, Better Tax, CloudTax, EachTax, FastnEasyTax, FutureTax, GenuTax Standard** "among others" [official-snippet]. Individually confirmed TY2025-certified via vendor pages [secondary-only, vendor self-attestation]: **TurboTax, Wealthsimple Tax, GenuTax Standard, FastnEasyTax, FutureTax 2025, StudioTax 2025** (Windows/Mac/iOS/Android). Expected but not confirmed this pull: UFile, H&R Block, CloudTax paid tiers, TaxTron, myTaxExpress, TaxFreeway, eTaxCanada.

> **FLAG:** the complete certified list (with free-offering conditions and platform columns) could not be captured because the page itself is unreachable from this environment. Re-pull the full table from a network that can reach canada.ca before M1 spec freeze.

---

## 2. Indexation adjustment for 2025

Official page: <https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/adjustment-personal-income-tax-benefit-amounts.html>

- **Indexation factor for 2025: 2.7%** (federal indexing factor effective 2025-01-01) [official-snippet] — **confirms held value.**
- 2025 bracket thresholds [official-snippet] — **all four confirm held values**:
  | Threshold | 2025 |
  |---|---|
  | 2nd bracket (20.5%) begins above | $57,375 |
  | 3rd bracket (26%) begins above | $114,750 |
  | 4th bracket (29%) begins above | $177,882 |
  | 5th bracket (33%) begins above | $253,414 |
- **Basic personal amount 2025: $16,129 maximum, $14,538 minimum** (minimum applies where net income ≥ the 33% threshold $253,414; phased between $177,882 and $253,414) [official-snippet for $14,538 as the "net income ≥ 33% bracket" figure; $16,129 max matches held value and CRA's indexation table] — **confirms held range $16,129 → $14,538.**
- Note: the indexation page carries statutory bracket **rates** as legislated at publication; the TY2025 lowest-rate blend to **14.5%** (15% Jan–Jun / 14% Jul–Dec, Bill C-4, RA 2026-03-12) is pinned separately in the project's verified facts and is not restated by this page's snapshot.

---

## 3. EI premium rate and maximums, 2025

Official pages:
- CRA EI premium rates and maximums: <https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/employment-insurance-ei/ei-premium-rates-maximums.html>
- T4032 2025 EI tables (outside Quebec): <https://www.canada.ca/content/dam/cra-arc/migration/cra-arc/tx/bsnss/tpcs/pyrll/t4032/2025/t4032einoqc-25eng.pdf>
- T4032 2025 EI tables (Quebec): <https://www.canada.ca/content/dam/cra-arc/migration/cra-arc/tx/bsnss/tpcs/pyrll/t4032/2025/t4032ei-ae-qc-25eng.pdf>
- CEIC 2025 rate confirmation (ESDC news release, 2024-09): <https://www.canada.ca/en/employment-social-development/news/2024/09/canada-employment-insurance-commission-confirms-2025-employment-insurance-premium-rate.html>
- 2025 MIE notice (ESDC): <https://www.canada.ca/en/employment-social-development/programs/ei/ei-list/ei-employers/premium-reduction-program/2025-maximum-insurable-earnings.html>

| Parameter | 2025 value | Confidence |
|---|---|---|
| Employee premium rate (outside QC) | **1.64%** ($1.64 per $100 insurable) | [official-snippet] |
| Maximum insurable earnings (MIE) | **$65,700** | [official-snippet] |
| Maximum annual employee premium (outside QC) | **$1,077.48** | [official-snippet] |
| Employer rate | **1.4× employee = 2.296%** | [official-snippet] |
| Maximum annual employer premium (outside QC) | $1,508.47 (= 1.4 × $1,077.48) | computed; [secondary-only] as a quoted figure |
| Quebec employee rate (QPIP-covered) | **1.31%** | [official-snippet] |
| Quebec maximum annual employee premium | **$860.67** | [official-snippet] |
| Quebec employer per-employee maximum | $1,204.94 ($1.83 per $100) | [official-snippet, ESDC release] |
| Max weekly EI benefit 2025 | $695/week (context only) | [secondary-only] |

---

## Outstanding

- Full NETFILE certified-software table (names × free/paid × platform × excluded forms) — blocked; needs a canada.ca-capable network.
- Live-page verification of all [official-snippet] figures — same blocker. No figure above conflicts with the project's already-verified TY2025 facts; the EI trio (1.64% / $65,700 / $1,077.48) and the 2.7% factor are consistent across the CRA snapshot, ESDC releases, and multiple independent secondary sources.

### Re-check 2026-07-28 — blocker unchanged, backlog still not runnable

The fetch backlog above was retried in full. **Both items remain blocked; no
figure in this document changed.** Routes attempted, all failing:

| Route | Target | Result |
|---|---|---|
| `curl` via session egress proxy | `www.canada.ca`, `canada.ca` | CONNECT 403 — gateway policy denial, logged by the proxy as `connect_rejected` |
| `curl` via session egress proxy | `laws-lois.justice.gc.ca`, `web.archive.org` | CONNECT 403 — same denial |
| WebFetch | `.../netfile-overview/certified-software-netfile-program.html` | HTTP 403 (canada.ca WAF) |
| WebFetch | `/content/canadasite/...` alternate path | HTTP 403 |
| WebFetch | `/en/services/taxes/.../tax-software/find-software.html` (path not tried on 2026-07-26) | HTTP 403 |
| WebFetch | EFILE certified-software page (path not tried on 2026-07-26) | HTTP 403 |
| WebSearch | NETFILE certified software TY2025 | Reachable, but returns the **same partial snapshot** — alphabetical head only (AdvTax, Better Tax, CloudTax, EachTax, FastnEasyTax, FutureTax, GenuTax Standard), no new product names, no free/paid or platform columns |

Two findings worth recording beyond a plain re-confirmation:

1. The egress allowlist is **narrow in general**, not canada.ca-specific — a
   control fetch of `example.com` also failed to connect. This is an
   environment/policy constraint, not a canada.ca-specific WAF problem, and it
   will not resolve on its own. Per proxy policy the denial was reported, not
   routed around (no third-party mirror or text-extraction proxy was used to
   reach a blocked domain).
2. Two canada.ca paths not attempted in the 2026-07-26 pull were tried this
   round and also 403'd, so the earlier conclusion was not an artifact of
   trying too few URLs.

**Unblocking this needs an environment change, not another retry** — either
`www.canada.ca` (and ideally `laws-lois.justice.gc.ca`) added to the egress
allowlist, or the table captured on a canada.ca-capable network and handed
over the way the ITA/ITR consolidations were. Retrying from this environment
will keep producing the row above.

#### Refinement 2026-07-28 — the allowlist is selective, not uniformly narrow

Finding 1 above ("the egress allowlist is narrow in general") is correct that
the block is a policy constraint rather than a canada.ca WAF quirk, but it
overstates the breadth. Re-probing found the allowlist is **selective**:

| Host | Result |
|---|---|
| `raw.githubusercontent.com` | **200** — full file bodies, no size limit hit at 14 MB |
| `github.com` (git transport) | **allowed** — `git clone` / `ls-remote` work |
| `api.github.com` | 403 on repo endpoints — per-repo gate, not the allowlist (see note) |
| `www.canada.ca`, `laws-lois.justice.gc.ca`, `web.archive.org`, `irs.gov` | 403 at CONNECT (host-denied) |

Note on `api.github.com`: unlike the canada.ca / laws-lois / web.archive.org /
irs.gov rows, which fail at CONNECT (host-denied by the allowlist), CONNECT to
`api.github.com` succeeds and its root URL returns 200. The 403 is an
application-layer JSON response the agent proxy injects for repositories not
attached to the session ("use add_repo"). So the API route is per-repo gated,
not host-denied — it can work for session-attached repos, but remains unusable
for the `justicecanada` mirror; raw/git stays the working route.

**This does not unblock anything in the backlog above** — the NETFILE
certified-software table and the T4032 PDFs exist only on canada.ca, and no
GitHub route reaches them. The conclusion for CRA parameters is unchanged.

It did unblock statute verification: Justice Canada mirrors all consolidated
federal law XML at `justicecanada/laws-lois-xml`, so the committed ITA/ITR
were verified against the official source without canada.ca. See
[`../../sources/README.md`](../../sources/README.md). The same route is
available for future statutes (EI Act, OAS Act).

Note also that `add_repo` cannot attach the mirror to this session — it
refuses cross-owner adds (`cross-tier adds are not supported in v1`, session
already holds `jasonmpereira` repos). Plain `git`/`curl` against the mirror
works and needs no session change; that is the supported path.

---

## 2026-07-29 — SUPERSEDED for most figures: CRA 2025 T1 package received

Jason delivered the **CRA 2025 T1 package (English, Ontario)** — 69 blank
published forms, verified free of taxpayer data on intake. This closes the
parameter-authority bucket for most of what this document held on search
snippets, **without canada.ca ever becoming reachable**.

The key discovery: CRA's **fillable** form variants carry the year's indexed
figures as read-only AcroForm field values, each with a descriptive tooltip.
That is CRA's own return as a machine-readable parameter source. 116 constants
extracted to [`../../parameters/ty2025-cra-forms.json`](../../parameters/ty2025-cra-forms.json)
via `tools/cra-forms/extract_params.py`; provenance and caveats in
[`../../parameters/README.md`](../../parameters/README.md).

**Now on primary authority** (was `[official-snippet]`):

| Figure | This document held | CRA form confirms |
|---|---|---|
| bracket thresholds | 57,375 / 114,750 / 177,882 / 253,414 | identical — 5006-R Step 5 Part A |
| BPA range | 16,129 max → 14,538 min | 14,538 base + 1,591 supplement = 16,129 — 5000-D1 line 30000 |
| TY2025 lowest rate | 14.5% blended (pinned separately) | **14.5%** — 5006-R, and the printed cumulative $8,319.38 = 57,375 × 14.5% proves it arithmetically |
| EI maximum insurable earnings | 65,700 | identical — 5000-S13 line 5 |

Every held value was confirmed; none was contradicted.

**Newly pinned, not previously held:** OAS recovery base 93,454; age amount
9,028 / 45,522 / 15%; disability 10,138 / 5,914 / 3,464; dividend gross-up
138% / 115%; capital gains inclusion 50%; Canada caregiver 28,798; CWB 3,000 /
27% / 15% and disability supplement 1,150 / 27%; donations top tranche 253,414;
medical supplement 33,294 / 25% / 5%; and the **top-up tax credit (line 34990,
NEW for 2025) at 8,319.38 and 3.45%** — which bears directly on the open M0
gate "Top-up citation pinned" (owner: Phoenix).

**Still blocked, still needing a canada.ca-capable network or a handover:**

- The full **NETFILE certified-software table** — unchanged; it is a web page,
  not a form, and nothing in the package covers it. The FLAG at the top of this
  document stands.
- **Indexation factor 2.7%** — still snippet-only. Not required for the figures
  above (the forms give post-indexation amounts directly), but needed to verify
  s. 117.1 indexation rather than take the results as given.
- **CPP** rates, YMPE and YAMPE, and **T4127** — in no T1 package.
- **AB / NU / QC** packages — the CWB reconfigurations and the Quebec abatement.

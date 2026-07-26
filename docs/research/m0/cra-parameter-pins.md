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

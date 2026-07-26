> **STATUS 2026-07-26: SUPERSEDED — outreach will not be sent.** Jason elected not to contact CTaCS; blamario (TY2025-verified, GPL) takes the second-oracle seat. Retained for reference if CTaCS is ever revisited.

# CTaCS reconnaissance + outreach draft (M0)

Date: 2026-07-26. Prepared for Jason Pereira (Woodgate Financial). Status: **draft — Jason sends the email**.

## 1. Findings

### 1.1 Contact page (do not fabricate an email; these are the pages where contact info lives)

- **Institutional profile (primary):** https://economics.ubc.ca/profile/kevin-milligan/ — Kevin Milligan, Professor of Economics, Vancouver School of Economics, University of British Columbia. Search-result snippets confirm this page carries his institutional contact details (UBC email, phone, VSE mailing address: 6000 Iona Drive, Vancouver BC V6T 1L4).
- **Personal site / CTaCS home:** https://sites.google.com/view/kevin-milligan (CTaCS page: https://sites.google.com/view/kevin-milligan/home/ctacs). The CTaCS page directs interested users to **email him for the most recent version of the programs**.
- Other pages listing him: UBC Blogs about page (https://blogs.ubc.ca/kevinmilligan/about-kevin-milligan/), NBER profile (https://www.nber.org/people/kevin_milligan).
- **Verification caveat:** the sandbox's egress gateway returned 403 (policy denial at CONNECT) for economics.ubc.ca, sites.google.com, faculty.arts.ubc.ca, canadasocialreport.ca, and web.archive.org, so page contents could not be read directly. The URLs and the facts above come from multiple independent search-result snippets. Jason should confirm the email address from the VSE profile page before sending.

### 1.2 Current CTaCS version and year coverage

- Versions documented in the literature: **2016-2.04** and **2019-1** (the latter cited in Canadian Tax Journal 2019 work as "Canadian Tax and Credit Simulator, database, software and documentation, Version 2019-1").
- The original documented parameter database covered **1962–2005**; later versions extend the parameter years (2016-x and 2019-1 imply coverage at least through those tax years).
- **Could not verify** any version newer than 2019-1, nor whether TY2024/TY2025 parameters exist — the CTaCS page itself was unreachable (gateway 403) and no post-2019 version citation surfaced in search. This is exactly question (a) in the outreach email. Treat TY2025 coverage as **unknown, likely requiring the "most recent version" obtained by email**.

### 1.3 Distribution

- Distributed as **Stata programs (do/ado files) plus a tax-and-transfer parameter database and documentation**, historically downloadable from his UBC/personal page; the current CTaCS page says to **email him for the most recent version**. There is a CTaCS presence on X (@CTaCSimulator) and a mirror/reference at canadasocialreport.ca/TaxSimulator/ (unverified, gateway-blocked).
- No public license text found. License terms for commercial/automated use and for publishing comparison results are **unknown** — question (b) in the email. Academic use has customarily been permitted with citation of the versioned package (Milligan, K., *Canadian Tax and Credit Simulator*, database, software and documentation, Version YYYY-N).
- Harness implication (per CANADA-CONVERSION.md Phase 5): running CTaCS headlessly requires a **Stata license** or a port of the relevant year's do-files — budget for this once access is confirmed.

### 1.4 Oracle-bar assessment (provisional, pending his reply)

| Criterion | Status |
|---|---|
| Independence from PolicyEngine | Yes — built from primary sources, predates PE-Canada |
| Scriptable batch execution | Yes, via Stata |
| Deterministic exact output | Expected (Stata), to confirm |
| Definable comparable / intermediates | Yes — CTaCS outputs federal/provincial tax and transfer components |
| TY2025 parameters | **Unknown — ask** |
| Version pinning | Yes — versioned releases with citation convention |
| License for commercial harness + publication | **Unknown — ask** |

## 2. Draft outreach email (for Jason to send from jason.pereira@woodgate.com)

> **To:** [Prof. Milligan's UBC address — confirm on https://economics.ubc.ca/profile/kevin-milligan/]
> **Subject:** CTaCS — 2025 parameters and terms for use in a validation harness
>
> Dear Professor Milligan,
>
> I'm a financial planner at Woodgate Financial in Toronto. My team is building an open, citation-first calculator for the federal T1 and related benefits — every rule carries its ITA/CRA citation, and we validate the implementation by differential testing against independent models. We would like to use CTaCS as one of our reference oracles, alongside PolicyEngine Canada, precisely because it was built independently from primary sources.
>
> Three questions, if I may:
>
> 1. **2025 parameters.** Does a CTaCS version with tax year 2025 parameters exist or is one planned? (We're particularly interested in the mid-year rate change producing the blended 14.5% lowest rate, and the current CPP2 ceilings.) If the current version stops earlier, knowing its latest covered year would still help us plan.
>
> 2. **Terms of use.** Our harness would run CTaCS in automated batches over generated test scenarios, inside a commercial firm's internal validation pipeline, and we would like to publish the comparison results (agreement rates and triaged differences). Are you comfortable with that use, and are there license terms or conditions we should follow?
>
> 3. **Version pinning and citation.** For reproducibility we pin exact oracle versions in our published reports. What version identifier and citation format would you prefer we use?
>
> Happy to share our methodology or results — the differential testing occasionally surfaces interesting edge cases that may be useful to you as well.
>
> Thank you for your time, and for making CTaCS available to the community all these years.
>
> Best regards,
> Jason Pereira
> Woodgate Financial, Toronto
> jason.pereira@woodgate.com

## 3. Open items

- [ ] Jason: confirm email address on the VSE profile page and send.
- [ ] On reply: record pinned CTaCS version + license terms here; update CANADA-CONVERSION.md Phase 5 (CTaCS "pending contact" → confirmed or dropped).
- [ ] Confirm Stata availability for the harness runner (or scope a do-file port).

Sources: [VSE profile](https://economics.ubc.ca/profile/kevin-milligan/), [CTaCS page](https://sites.google.com/view/kevin-milligan/home/ctacs), [Milligan personal site](https://sites.google.com/view/kevin-milligan), [CTJ 2019 67:3 symposium paper](https://www.ctf.ca/common/Uploaded%20files/Documents/CTJ%202019/Issue%203/693_2019CTJ3-Sym-Milligan.pdf), [CTJ 2019 67:2](https://www.ctf.ca/common/Uploaded%20files/Documents/CTJ%202019/Issue%202/349_2019CTJ2_FON.pdf), [Fraser Institute 2019 report](https://www.fraserinstitute.org/sites/default/files/revenue-effects-of-tax-rate-increases-on-high-income-earners.pdf), [Canada Social Report mirror](https://canadasocialreport.ca/TaxSimulator/), [@CTaCSimulator](https://x.com/ctacsimulator).

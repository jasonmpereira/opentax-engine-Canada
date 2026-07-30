/**
 * Income sources and their aggregation into total income (T1 line 15000) —
 * ITA ss. 3, 5, 9, and para. 12(1)(c).
 *
 * s. 3 is an ORDERING provision, not a simple sum. It builds income in
 * lettered steps: (a) totals income from each source other than taxable
 * capital gains; (b) adds the net taxable-capital-gains figure; (c) subtracts
 * Subdivision E deductions; (d) subtracts losses. What the T1 calls "total
 * income" on line 15000 corresponds to the s. 3(a) + s. 3(b) stage, before
 * the Subdivision E deductions that produce net income (line 23600).
 *
 * The chain modelled here is therefore:
 *
 *   employment (s. 5)                        line 10100
 *   + business (s. 9)                        lines 13500-14300
 *   + interest and investment (12(1)(c))     line 12100
 *   + taxable dividends (grossed up)         line 12000
 *   + taxable capital gains (1/2)            line 12700
 *   + pensions, CPP/QPP, OAS, EI, RRSP w/d   lines 11300-11900, 12900
 *   = total income                           line 15000
 *
 * SCOPE. Every component comes from a fact; the corpus does not itself derive
 * employment income from slips or compute business profit from a ledger. The
 * loss side of s. 3 (paragraph (d)) is not modelled — see capital-gains.ts for
 * the capital-loss boundary. Income sources with no fact behind them (rental,
 * foreign, support payments, scholarships) are simply absent, which means a
 * return involving them is understated; that limit is stated here and in the
 * package README rather than being silently absorbed.
 */

import type { Expr, Rule } from "@invaro/opentax-core";

const fact = (factId: string): Expr => ({ kind: "fact", factId });
const rule = (ruleId: string): Expr => ({ kind: "rule", ruleId });

export const incomeRules: Rule[] = [
  {
    id: "ca.federal.employment_income",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Income from an office or employment (line 10100)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 5(1)",
      section: "s. 5(1)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-5.html",
      excerpt:
        "Subject to this Part, a taxpayer's income for a taxation year from an office or employment is the salary, wages and other remuneration, including gratuities, received by the taxpayer in the year.",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: fact("employmentIncome"),
  },
  {
    id: "ca.federal.business_income",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Income from a business (lines 13500–14300)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 9(1)",
      section: "s. 9(1)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-9.html",
      excerpt:
        "Subject to this Part, a taxpayer's income for a taxation year from a business or property is the taxpayer's profit from that business or property for the year.",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // s. 9(1) income is PROFIT. The fact is documented as net of expenses, so
    // the corpus does not re-derive it — expenses are the filer's attestation.
    formula: fact("selfEmploymentIncome"),
  },
  {
    id: "ca.federal.interest_income",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Interest and other investment income (line 12100)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), para. 12(1)(c)",
      section: "para. 12(1)(c)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-12.html",
      excerpt:
        "There shall be included in computing the income of a taxpayer for a taxation year as income from a business or property such of the following amounts as are applicable … (c) …any amount received or receivable by the taxpayer in the year … as, on account of, in lieu of payment of or in satisfaction of, interest",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // Para. 12(1)(c) is the authority for INTEREST. Other components reported
    // on line 12100 (e.g. certain trust and foreign investment amounts) arise
    // under other inclusion provisions and are not separately modelled.
    formula: fact("interestIncome"),
  },
  {
    id: "ca.federal.pension_and_benefit_income",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Pension, CPP/QPP, OAS, EI and RRSP income (lines 11300–11900, 12900)",
    citation: {
      source:
        "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), paras. 56(1)(a), 56(1)(a.1), 56(1)(r); s. 146(8)",
      section: "s. 56(1); s. 146(8)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-56.html",
      excerpt:
        "Without restricting the generality of section 3, there shall be included in computing the income of a taxpayer for a taxation year, (a) any amount received by the taxpayer in the year as, on account or in lieu of payment of, or in satisfaction of, (i) a superannuation or pension benefit …",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    formula: {
      kind: "add",
      args: [
        fact("taxablePensionIncome"),
        fact("cppQppBenefits"),
        fact("oasBenefits"),
        fact("eiBenefits"),
        fact("rrspWithdrawals"),
      ],
    },
  },
  {
    id: "ca.federal.total_income",
    version: 1,
    jurisdiction: "ca.federal",
    title: "Total income (line 15000)",
    citation: {
      source: "Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.), s. 3(a)–(b)",
      section: "s. 3(a)–(b)",
      url: "https://laws-lois.justice.gc.ca/eng/acts/I-3.3/section-3.html",
      excerpt:
        "The income of a taxpayer for a taxation year for the purposes of this Part is the taxpayer's income for the year determined by the following rules: (a) determine the total of all amounts each of which is the taxpayer's income for the year (other than a taxable capital gain from the disposition of a property) from a source inside or outside Canada, including … the taxpayer's income for the year from each office, employment, business and property, (b) determine the amount, if any, by which (i) the total of (A) all of the taxpayer's taxable capital gains for the year …",
    },
    effectiveFrom: "2025-01-01",
    output: { type: "money" },
    // s. 3(a) sources first, then the s. 3(b) taxable capital gains figure.
    // Taxable capital gains are kept separate rather than folded into (a)
    // because s. 3(a) expressly excludes them.
    formula: {
      kind: "add",
      args: [
        rule("ca.federal.employment_income"),
        rule("ca.federal.business_income"),
        rule("ca.federal.interest_income"),
        rule("ca.federal.taxable_dividends"),
        rule("ca.federal.pension_and_benefit_income"),
        rule("ca.federal.taxable_capital_gains"),
      ],
    },
  },
];

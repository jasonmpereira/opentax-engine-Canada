# Vendored oracles

## policyengine-canada (pinned)

- Source: https://github.com/PolicyEngine/policyengine-canada
- Pinned commit: `389648ad24131ed958d7bb6f514d56199b129e5c` ("Update GitHub Actions for Node 24 runtime (#552)")
- Pin date: 2026-04-27
- Vendored working tree only (6.8 MB, `.git` removed) at `harness/vendor/policyengine-canada/`.

### Why pinned, and how it may be used

PolicyEngine Canada's **benefits side is sound** and is used as a full oracle for
benefit programs (CCB, GST credit, etc.). Its **federal T1 total is structurally
broken**, so it must only be used for **per-component comparisons** — never for
end-to-end T1 totals. Pinning to a fixed commit keeps comparisons reproducible and
keeps the documented defect stable.

### Documented structural T1 defect (verified present at the pinned commit)

1. **Brackets applied to gross income (no deductions / no taxable-income step)** —
   `policyengine_canada/variables/gov/cra/tax/income/income_tax_before_credits.py`:

   ```python
   def formula(person, period, parameters):
       income = person("total_individual_pre_tax_income", period)
       gov = parameters(period).gov.cra.tax.income
       return gov.income_tax_schedule.calc(income)
   ```

   The rate schedule is applied to `total_individual_pre_tax_income` rather than
   taxable income; the file even self-describes as "Example income tax regime".

2. **Non-refundable credits subtracted dollar-for-dollar (not amount × lowest rate)** —
   `policyengine_canada/variables/gov/cra/tax/income/income_tax_before_refundable_credits.py`:

   ```python
   income_tax_before_credits = person("income_tax_before_credits", period)
   non_refundable_tax_credits = person("non_refundable_tax_credits", period)
   return max_(income_tax_before_credits - non_refundable_tax_credits, 0)
   ```

   `non_refundable_tax_credits` simply `adds` credit *amounts* (e.g. the Basic
   Personal Amount variable returns `p.base + supplement`, the full ~$16k amount),
   so credits reduce tax dollar-for-dollar instead of being multiplied by the
   15% (TY2025: blended 14.5%) lowest rate as on the real Schedule 1.

Consequence: T1 federal tax totals from this oracle are structurally wrong; use
only per-component values (bracket schedule parameters, benefit computations,
credit base amounts) for validation.

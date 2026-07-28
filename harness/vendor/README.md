# Vendored oracles

## policyengine-canada (pinned)

- Source: https://github.com/PolicyEngine/policyengine-canada
- Pinned commit: `389648ad24131ed958d7bb6f514d56199b129e5c` ("Update GitHub Actions for Node 24 runtime (#552)")
- Pin date: 2026-04-27
- Vendored working tree only (6.8 MB, `.git` removed) at `harness/vendor/policyengine-canada/`.
- Pin and defects **verified against upstream 2026-07-28** — see
  [Verification record](#verification-record) below for the evidence and the
  re-runnable method.

### Why pinned, and how it may be used

PolicyEngine Canada's **benefits side is sound** and is used as a full oracle for
benefit programs (CCB, GST credit, etc.). Its **federal T1 total is structurally
broken**, so it must only be used for **per-component comparisons** — never for
end-to-end T1 totals. Pinning to a fixed commit keeps comparisons reproducible and
keeps the documented defect stable.

### Documented structural T1 defects (verified present at the pinned commit)

Both snippets below were re-read from upstream at `389648ad` on 2026-07-28 and
match the files verbatim — see [Documented defects — verbatim check](#documented-defects--verbatim-check).

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

## Verification record

`.git` was removed when this tree was vendored, so neither the pin nor the
defect claims above were checkable from inside this repo. This section makes
them checkable. GitHub egress is allowed from this environment (unlike
`canada.ca` / `laws-lois.justice.gc.ca` — see
[`../../docs/sources/README.md`](../../docs/sources/README.md)), so upstream is
reachable directly.

**Verified 2026-07-28** against `https://github.com/PolicyEngine/policyengine-canada`.

### Commit identity

| field | value |
|---|---|
| commit | `389648ad24131ed958d7bb6f514d56199b129e5c` |
| tree | `5cbf9d8e8d80f3a1375831c1d505ed0dcafde2e5` |
| parent | `e93acb67378ecc39600b63a0ae3fb65f9e77e29b` |
| subject | `Update GitHub Actions for Node 24 runtime (#552)` |
| author | Max Ghenis \<mghenis@gmail.com\>, 2026-04-27T20:35:22-04:00 |
| committer | GitHub \<noreply@github.com\>, 2026-04-27T20:35:22-04:00 |

The object exists upstream and is a `commit`. Its author date (2026-04-27)
matches the pin date recorded above. As of 2026-07-28 it is also still the tip
of `origin/master` (`origin/HEAD` resolves to it), so upstream has not moved
since the pin was taken — re-pinning is not currently owed.

### Tree comparison

Every file was compared by **content hash** — the git blob SHA-1 over the file
bytes — not by name, size or timestamp.

| | count |
|---|---|
| upstream tracked files at the pin | 1087 |
| vendored files present (`.git` absent, as documented) | 1086 |
| compared (path present in both) | 1086 |
| **matching byte-for-byte** | **1086** |
| differing | 0 |
| vendored-only | 0 |
| upstream-only | 1 |

**Result: the vendored tree reproduces upstream at `389648ad` exactly — zero
modified files, zero added files, one omitted file.**

The single upstream-only path is **`.DS_Store`** (blob `d24f89c6afb83036…`,
6,148 bytes) — macOS Finder directory metadata that upstream happens to track at
its repo root (it is not listed in upstream's `.gitignore`). It carries no code,
parameters or test data and is read by nothing in the harness, so its omission
is benign. It is the only difference of any kind.

Recorded as meaningful *absences*, since they would each be a defect if present:
there are **no** vendored-only files at all — no `__pycache__`, no `*.pyc`, no
`*.egg-info`, no stray build output, and no local edits to any vendored file.

### Documented defects — verbatim check

Both files were re-read from upstream at the pin. Full bodies as found:

`policyengine_canada/variables/gov/cra/tax/income/income_tax_before_credits.py`
(blob `55058bbc8058e474…`):

```python
from policyengine_canada.model_api import *


class income_tax_before_credits(Variable):
    value_type = float
    entity = Person
    label = "Income tax before non-refundable tax credits"
    unit = CAD
    documentation = "Example income tax regime"
    definition_period = YEAR

    def formula(person, period, parameters):
        income = person("total_individual_pre_tax_income", period)
        gov = parameters(period).gov.cra.tax.income
        return gov.income_tax_schedule.calc(income)
```

`policyengine_canada/variables/gov/cra/tax/income/income_tax_before_refundable_credits.py`
(blob `9ba35da3d16e60bb…`):

```python
from policyengine_canada.model_api import *


class income_tax_before_refundable_credits(Variable):
    value_type = float
    entity = Person
    label = "Income tax before refundable credits"
    unit = CAD
    definition_period = YEAR

    def formula(person, period, parameters):
        income_tax_before_credits = person("income_tax_before_credits", period)
        non_refundable_tax_credits = person("non_refundable_tax_credits", period)
        return max_(income_tax_before_credits - non_refundable_tax_credits, 0)
```

**Both defects are confirmed present at `389648ad`, and the snippets quoted
earlier in this file reproduce these bodies verbatim** — character-for-character
identical apart from the class-body indentation, which was stripped above for
readability. The `documentation = "Example income tax regime"` self-description
cited in defect 1 is present as quoted. The vendored copies of both files hash
to the same blobs as upstream.

The supporting claim under defect 2 was checked the same way and holds:

- `.../credits/non_refundable_tax_credits.py` has no formula at all — it is
  `adds = "gov.cra.tax.income.credits.non_refundable"`, i.e. a plain sum of
  credit *amounts*, with no rate applied.
- `.../credits/basic_personal_amount/basic_personal_amount.py` returns
  `p.base + supplement`.
- That amount is the full BPA, not a credit: upstream
  `parameters/.../basic_personal_amount/max_amount.yaml` gives `2025-01-01:
  16_129`, so "the full ~$16k amount" is accurate for TY2025.

> Scope note: this record verifies the **pin and the defect text** only. The
> parenthetical "(TY2025: blended 14.5%)" describing the *real* Schedule 1
> lowest rate is a CRA parameter claim, out of scope here, and is not pinned to
> primary authority by this check.

### Method (re-runnable)

Run from the repo root. Nothing is written inside the repo; the clone goes to a
scratch directory.

```sh
PIN=389648ad24131ed958d7bb6f514d56199b129e5c
TMP=$(mktemp -d)
TAB=$(printf '\t')

# 1. Blobless clone — no working tree, no blob download.
git clone --filter=blob:none --no-checkout \
    https://github.com/PolicyEngine/policyengine-canada "$TMP/upstream"
git -C "$TMP/upstream" cat-file -t "$PIN"                      # -> commit
git -C "$TMP/upstream" log -1 --format='%H %T %P %an %aI %s' "$PIN"

# 2. Upstream path -> blob-hash table at the pin.
git -C "$TMP/upstream" ls-tree -r "$PIN" \
  | awk -F'\t' '{split($1,m," "); print m[3]"\t"$2}' \
  | sort -t"$TAB" -k2,2 > "$TMP/upstream.tsv"

# 3. Same table for the vendored tree. git blob SHA-1 == content hash.
cd harness/vendor/policyengine-canada
find . -type f -not -path './.git/*' | sed 's|^\./||' | sort > "$TMP/paths.txt"
sed "s|^|$PWD/|" "$TMP/paths.txt" \
  | git --git-dir=/dev/null hash-object --stdin-paths > "$TMP/hashes.txt"
paste "$TMP/hashes.txt" "$TMP/paths.txt" | sort -t"$TAB" -k2,2 > "$TMP/vendored.tsv"

# 4. Compare. Expected output as of 2026-07-28: exactly one line,
#    "< d24f89c6afb83036dbf1094e7ecb2ba71832922e<TAB>.DS_Store".
diff "$TMP/upstream.tsv" "$TMP/vendored.tsv"

# 5. Defect bodies, verbatim from upstream.
cd - >/dev/null
for f in income_tax_before_credits income_tax_before_refundable_credits; do
  git -C "$TMP/upstream" cat-file -p \
    "$PIN:policyengine_canada/variables/gov/cra/tax/income/$f.py"
done
```

Any diff line other than the `.DS_Store` one means the vendored tree no longer
matches the pin — treat that as a gate failure, not a nuisance, and re-vendor
from `$PIN` rather than editing in place.

> **Two traps if you rebuild these commands yourself.** (1) Upstream tracks a
> path containing a space — `policyengine_canada/variables/household/person/is_ emancipated.py`
> — so any pipeline that splits paths on whitespace reports a phantom
> mismatch plus a phantom missing file; the commands above are tab-delimited
> end to end. (2) `git hash-object --stdin-paths` resolves relative paths
> against the *enclosing* repository, and this tree lives inside the OpenCanTax
> repo, so it must be fed absolute paths; `--git-dir=/dev/null` additionally
> keeps it from picking up OpenCanTax's attributes or filters, which would
> change the hashes.

### When the pin moves

If upstream is later re-pinned, re-vendor the whole tree from the new commit and
redo this record — do not patch files in place. The defect claims must be
re-verified too: they are statements about a specific commit, and PolicyEngine
could fix either one at any time, which would invalidate the "per-component
comparisons only" rationale in the direction of *more* trust, not less.

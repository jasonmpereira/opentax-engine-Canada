# docs/sources — Crown source texts

Reproduced federal law consolidations, held in-repo because their license
permits it. **Only Crown works whose registry row in
[`docs/SOURCES-CA.md`](../SOURCES-CA.md) says `excerpt-permitted: yes` may
ever be added here.** Commercial-publisher texts are barred from this
repository entirely (Banshee H5, veto-backed).

## Reproduction notice (SI/97-5)

The consolidations in this directory are reproduced from the Department of
Justice Canada's Justice Laws Website (laws-lois.justice.gc.ca) under the
Reproduction of Federal Law Order, SI/97-5. They are **not official versions**
of the legislation. They are provided for reference; for the purposes of
interpreting and applying the law, consult the official versions published by
the Department of Justice Canada.

## Contents

| file | statute | consolidation | sha256 (prefix) |
|---|---|---|---|
| `ita-consolidated-2026-06-14.pdf` | Income Tax Act, R.S.C. 1985, c. 1 (5th Supp.) | current to 2026-06-14, last amended 2026-04-01 (3,827 pp, bilingual) | `31cc0fee5bcb1521` |
| `ita-consolidated-2026-06-14.xml` | Income Tax Act — LIMS XML (English) | current to 2026-06-14, last amended 2026-04-01 | `f65398c6f8a1006a` |
| `itr-consolidated-2026-06-14.pdf` | Income Tax Regulations, C.R.C., c. 945 | current to 2026-06-14, last amended 2026-03-26 (1,361 pp, bilingual) | `fd624ad485ede26b` |
| `itr-consolidated-2026-03-31.xml` | Income Tax Regulations — LIMS XML (English) | current to 2026-03-31, last amended 2026-03-26 | `67841e2c5ed4fe1c` |

The ITR XML snapshot's "current to" date (2026-03-31) is earlier than the
PDF's (2026-06-14), but both carry the same last-amended date (2026-03-26),
so their substantive content is identical. **The XML files are the preferred
machine-readable versions** — structured by section with LIMS ids and
in-force dates — use them for chunking, retrieval, and pinpoint citation;
the PDFs serve as the human-readable bilingual reference.

When a newer consolidation is adopted, add it alongside (dated filename),
update the registry row's `revision-date`, and only remove the old one once no
rule citation pins it.

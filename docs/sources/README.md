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

## Verification against the official mirror

`laws-lois.justice.gc.ca` is unreachable from this environment (egress proxy
CONNECT 403, same denial as `canada.ca` — see
[`../research/m0/cra-parameter-pins.md`](../research/m0/cra-parameter-pins.md)).
Justice Canada also publishes every consolidated federal instrument as XML on
GitHub at [`justicecanada/laws-lois-xml`](https://github.com/justicecanada/laws-lois-xml),
refreshed roughly biweekly, and **GitHub egress is allowed**. That mirror is
the working route for verification and for future consolidations.

**Verified 2026-07-28** against mirror `main` @ `14e448e` ("TOPS Update
2026-07-24"): both XML files here reproduce the mirror **exactly**, and their
`lims:current-date` / `lims:lastAmendedDate` values match the table above —
ITA current to 2026-06-14 / last amended 2026-04-01, ITR current to
2026-03-31 / last amended 2026-03-26. The mirror's 2026-07-24 refresh did not
move either instrument, so nothing is stale.

> **Comparing by hand?** The mirror serves these files with a UTF-8 BOM and
> `encoding="utf-8"` in the XML declaration; the copies committed here have
> neither. That is a 20-byte header difference and nothing else. A plain
> `sha256sum` against the mirror's bytes will *not* match the hashes in the
> table above — those are computed on the normalized form (BOM stripped,
> declaration reduced to `<?xml version="1.0"?>`). Use the tool below, which
> normalizes before hashing and never rewrites the body.

### Consolidation-update workflow

Run the check on a cadence (the mirror updates roughly biweekly), and always
before an M-gate freeze:

```sh
python3 tools/lims-sync/check_mirror.py
```

Exit 0 means every file matches. On drift the tool prints the mirror's new
`current-date` and the exact follow-ups. To adopt a newer consolidation:

1. `python3 tools/lims-sync/check_mirror.py --update` — vendors the mirror's
   version as `<instrument>-consolidated-<current-date>.xml`, normalized.
2. Fetch the matching bilingual PDF when a canada.ca-capable route exists; the
   PDF is human reference only, so the XML may lead it.
3. Update the contents table above (filename + normalized sha256) and the
   `revision-date` on the registry row in [`../SOURCES-CA.md`](../SOURCES-CA.md).
4. Re-run any `lims-chunker` extraction, and re-check rule `Citation` excerpts
   and validity windows that pin the superseded consolidation — LIMS
   `inforce_start` dates move when a provision is amended.
5. Keep the superseded file until no citation references it.

See [`../../tools/lims-sync/README.md`](../../tools/lims-sync/README.md) for
adding further instruments (EI Act, OAS Act) to the check.

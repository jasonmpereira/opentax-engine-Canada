# lims-sync

Verifies the LIMS XML consolidations under `docs/sources/` against Justice
Canada's official mirror, and tells you what to update when a newer
consolidation lands. Python 3 stdlib only.

## Why

`laws-lois.justice.gc.ca` is unreachable from this environment (egress
proxy returns CONNECT 403, same as `canada.ca` — see
`docs/research/m0/cra-parameter-pins.md`). Justice Canada also publishes
every consolidated federal instrument as XML on GitHub at
[`justicecanada/laws-lois-xml`](https://github.com/justicecanada/laws-lois-xml),
refreshed roughly biweekly, and **GitHub egress is allowed**. That mirror
is therefore the working route for both verifying what we hold and picking
up future consolidations.

## Usage

```sh
python3 tools/lims-sync/check_mirror.py            # check against mirror main
python3 tools/lims-sync/check_mirror.py --ref <sha> # pin to a mirror commit
python3 tools/lims-sync/check_mirror.py --update    # on drift, vendor the new file
```

Exit code is 0 when every file matches, 1 on any drift or fetch failure.

`--update` writes the mirror's version to `docs/sources/` under a
date-stamped name derived from its `lims:current-date`. It does not edit
the registry, delete the superseded file, or commit — those stay manual,
because the registry prose and any rule citations pinning the old
consolidation need judgment.

## The 20-byte header difference

The mirror serves these files with a UTF-8 BOM and `encoding="utf-8"` in
the XML declaration; the copies committed here have neither. That is a
20-byte header difference (3-byte BOM + 17-character attribute) and
**nothing else** — comparing raw bytes reports drift on files whose legal
text is identical.

`normalize()` strips the BOM and rewrites the declaration to
`<?xml version="1.0"?>` before hashing. The body is never touched. This is
also why the sha256 values in the registry match the normalized form, not
the bytes the mirror serves — recompute with `normalize()`, not
`sha256sum`, when checking a registry hash by hand.

## Adding an instrument

Append a row to `SOURCES` in `check_mirror.py` mapping the committed file
to its mirror path. Acts live under `eng/acts/<chapter>.xml` (ITA is
`I-3.3.xml`), regulations under `eng/regulations/<citation>.xml` (ITR is
`C.R.C.,_c._945.xml`). Same layout for future benefits sources — EI Act
(`E-5.6`), OAS Act (`O-9`).

## Verification record

Checked 2026-07-28 against mirror `main` @ `14e448e` ("TOPS Update
2026-07-24"):

| instrument | normalized sha256 | current to | last amended | result |
|---|---|---|---|---|
| ITA (I-3.3) | `f65398c6f8a1006a` | 2026-06-14 | 2026-04-01 | identical |
| ITR (C.R.C., c. 945) | `67841e2c5ed4fe1c` | 2026-03-31 | 2026-03-26 | identical |

Both committed files reproduce the official mirror exactly, and both
`lims:current-date` / `lims:lastAmendedDate` values match what
`docs/SOURCES-CA.md` and `docs/sources/README.md` record.

#!/usr/bin/env python3
"""Verify the committed Justice Laws LIMS XML against the official mirror.

Justice Canada publishes every consolidated federal instrument as XML on
GitHub (justicecanada/laws-lois-xml), refreshed roughly biweekly. This
checks the LIMS XML consolidations listed in SOURCES below against that
mirror and reports whether a newer consolidation is available. (The PDFs
under docs/sources/ are not covered — the mirror serves no PDFs; add a
SOURCES row when a new XML instrument is vendored.) Python 3 stdlib only.
"""
from __future__ import annotations

import argparse
import hashlib
import re
import ssl
import sys
import urllib.request
from pathlib import Path

MIRROR_REPO = "justicecanada/laws-lois-xml"
RAW_URL = "https://raw.githubusercontent.com/{repo}/{ref}/{path}"

# Committed file -> path in the mirror. Add a row when a new instrument
# (EI Act, OAS Act, ...) is vendored into docs/sources/.
SOURCES = [
    {
        "instrument": "ITA (R.S.C. 1985, c. 1 (5th Supp.))",
        "local": "docs/sources/ita-consolidated-2026-06-14.xml",
        "mirror_path": "eng/acts/I-3.3.xml",
    },
    {
        "instrument": "ITR (C.R.C., c. 945)",
        "local": "docs/sources/itr-consolidated-2026-03-31.xml",
        "mirror_path": "eng/regulations/C.R.C.,_c._945.xml",
    },
]

XML_DECL = re.compile(rb"^<\?xml[^>]*\?>")
ROOT_TAG = re.compile(r"<(Statute|Regulation)\b[^>]*>")


def normalize(raw: bytes) -> bytes:
    """Comparison form for hashing: strip any BOM; reduce an existing XML
    declaration to ``<?xml version="1.0"?>``.

    The mirror serves these files with a UTF-8 BOM and an
    ``encoding="utf-8"`` declaration; the copies under docs/sources/ were
    saved without either. That is a 20-byte header difference and nothing
    else, so comparing raw bytes reports drift on files whose legal text is
    identical. Only the header is touched — the body is never rewritten.

    This is a header rewrite, not true canonicalization: input with no
    declaration is left without one, and any version/standalone attributes
    are collapsed. Adequate for this mirror, which consistently serves a
    BOM plus ``<?xml version="1.0" encoding="utf-8"?>``.
    """
    if raw.startswith(b"\xef\xbb\xbf"):
        raw = raw[3:]
    return XML_DECL.sub(b'<?xml version="1.0"?>', raw, count=1)


def lims_dates(raw: bytes) -> dict[str, str]:
    """Pull the LIMS date attributes off the root element."""
    head = raw[:4000].decode("utf-8-sig", errors="replace")
    tag = ROOT_TAG.search(head)
    if not tag:
        return {}
    return {
        k: v
        for k, v in re.findall(r'([\w:.-]+)="([^"]*)"', tag.group(0))
        if "date" in k.lower()
    }


def fetch(url: str, timeout: int) -> bytes:
    ctx = ssl.create_default_context()
    req = urllib.request.Request(url, headers={"User-Agent": "opencantax-lims-sync"})
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        return resp.read()


def check(entry: dict, repo_root: Path, ref: str, timeout: int, update: bool) -> bool:
    """Return True when the committed copy matches the mirror."""
    local = repo_root / entry["local"]
    label = entry["instrument"]
    if not local.exists():
        print(f"MISSING  {label}: {entry['local']} not in the repo")
        return False

    url = RAW_URL.format(repo=MIRROR_REPO, ref=ref, path=entry["mirror_path"])
    try:
        remote_raw = fetch(url, timeout)
    except Exception as exc:  # network, TLS, 404 — all reportable, none fatal
        print(f"UNREACHABLE  {label}: {type(exc).__name__}: {exc}")
        return False

    ours = normalize(local.read_bytes())
    theirs = normalize(remote_raw)
    ours_sha = hashlib.sha256(ours).hexdigest()
    theirs_sha = hashlib.sha256(theirs).hexdigest()

    our_dates = lims_dates(ours)
    their_dates = lims_dates(theirs)

    if ours_sha == theirs_sha:
        print(
            f"OK       {label}\n"
            f"         sha256 {ours_sha[:16]}  "
            f"current-to {our_dates.get('lims:current-date', '?')}  "
            f"last-amended {our_dates.get('lims:lastAmendedDate', '?')}"
        )
        return True

    print(
        f"DRIFT    {label}\n"
        f"         ours   sha256 {ours_sha[:16]}  "
        f"current-to {our_dates.get('lims:current-date', '?')}  "
        f"last-amended {our_dates.get('lims:lastAmendedDate', '?')}\n"
        f"         mirror sha256 {theirs_sha[:16]}  "
        f"current-to {their_dates.get('lims:current-date', '?')}  "
        f"last-amended {their_dates.get('lims:lastAmendedDate', '?')}"
    )

    new_date = their_dates.get("lims:current-date")
    if not new_date:
        print(
            "         -> mirror copy has no lims:current-date; cannot derive a\n"
            "            date-stamped filename. Inspect the mirror file by hand."
        )
        if update:
            print("         SKIPPED --update: no lims:current-date to name the new file")
        return False

    stem = Path(entry["local"]).name.split("-consolidated-")[0]
    suggested = f"docs/sources/{stem}-consolidated-{new_date}.xml"
    out = repo_root / suggested
    if suggested == entry["local"] or out.exists():
        # Drift without a date bump (mirror erratum/markup fix, or local
        # corruption): the derived name is a file that already exists —
        # usually the very file being checked. Never overwrite it silently.
        print(
            f"         -> mirror current-date is unchanged ({new_date}): body drift,\n"
            f"            not a new consolidation. Diff {entry['local']} against the\n"
            f"            mirror by hand before replacing anything."
        )
        if update:
            print(f"         SKIPPED --update: refusing to overwrite existing {suggested}")
        return False

    print(f"         -> vendor as {suggested}, then update:")
    print("            docs/sources/README.md contents table (file + sha256)")
    print("            docs/SOURCES-CA.md registry row (revision-date)")
    print("            any rule Citation pinning the old consolidation")
    if update:
        out.write_bytes(theirs)
        print(f"         WROTE {suggested} (normalized; review before commit)")
    return False


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--ref", default="main", help="mirror git ref to check against (default: main)"
    )
    ap.add_argument("--timeout", type=int, default=180, help="per-file fetch timeout (s)")
    ap.add_argument(
        "--update",
        action="store_true",
        help="on drift, write the mirror's version into docs/sources/ under a "
        "date-stamped name (does not edit the registry or delete the old file; "
        "never overwrites an existing file)",
    )
    args = ap.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    print(f"mirror: {MIRROR_REPO}@{args.ref}\n")

    results = [check(e, repo_root, args.ref, args.timeout, args.update) for e in SOURCES]
    ok = sum(results)
    print(f"\n{ok}/{len(results)} in sync with the mirror")
    return 0 if all(results) else 1


if __name__ == "__main__":
    sys.exit(main())

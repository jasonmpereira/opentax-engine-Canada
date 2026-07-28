/**
 * Regenerate corpus.lock.json (per-rule content hashes + Merkle root).
 *
 * Run after any rule OR fact-catalog change:
 *   pnpm -F @opencantax/corpus-ca-federal gen:lock
 *
 * The committed lock file makes every semantic corpus change a visible hash
 * diff in code review, and the drift test fails until it is regenerated.
 *
 * Phase 1 note: this corpus has zero rules, so `rules` is `{}` and the whole
 * signal lives in `merkleRoot` — core's merkleRoot() adds one leaf for the
 * fact catalog (fact defaults change answers, so they are pinned too). That
 * makes the lock meaningful even before rules land. `factCount` is recorded
 * alongside `ruleCount` for the same reason; it is the only moving part today.
 *
 * The package is INERT BY DESIGN (no "build" script, so root `pnpm -r build`
 * skips it — see the "//" block in package.json). This script therefore needs
 * a dist to import, and `gen:lock` invokes tsc directly rather than a `build`
 * script. Wiring this package into the recursive build is a Phase 2 decision.
 */

import { readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(here, "..");

/**
 * Refuse to hash a stale dist.
 *
 * This script reads ../dist, so invoking it directly (`node
 * scripts/gen-lock.mjs`) instead of through `gen:lock` — which runs tsc
 * first — silently pins the PREVIOUS corpus state: a lock describing a
 * corpus that never existed, with tests that pass against it. Cheap to do
 * by accident, invisible afterwards, so it is a hard error here.
 */
function newestMtime(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    newest = Math.max(
      newest,
      entry.isDirectory() ? newestMtime(full) : statSync(full).mtimeMs,
    );
  }
  return newest;
}

let distMtime;
try {
  distMtime = newestMtime(path.join(pkgRoot, "dist"));
} catch {
  console.error(
    "gen-lock: no dist/ to hash. Run `pnpm -F @opencantax/corpus-ca-federal gen:lock`,\n" +
      "which compiles first — do not run this script directly.",
  );
  process.exit(1);
}

if (newestMtime(path.join(pkgRoot, "src")) > distMtime) {
  console.error(
    "gen-lock: src/ is newer than dist/ — refusing to pin a stale corpus.\n" +
      "Run `pnpm -F @opencantax/corpus-ca-federal gen:lock` (compiles, then locks).",
  );
  process.exit(1);
}

const { getCorpus } = await import("../dist/index.js");

const corpus = getCorpus();
const lock = {
  name: corpus.name,
  version: corpus.version,
  merkleRoot: corpus.merkleRoot,
  ruleCount: corpus.rules.length,
  factCount: corpus.facts.length,
  rules: Object.fromEntries(
    [...corpus.ruleHashes.entries()].sort(([a], [b]) => a.localeCompare(b)),
  ),
};

const dest = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "corpus.lock.json",
);
writeFileSync(dest, JSON.stringify(lock, null, 2) + "\n");
console.log(`wrote ${dest}`);
console.log(`merkle root: ${corpus.merkleRoot}`);
console.log(`rules: ${lock.ruleCount}  facts: ${lock.factCount}`);

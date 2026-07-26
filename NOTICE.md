# OpenCanTax

This repository is **OpenCanTax** — Woodgate Financial's Canadian conversion
of the open-source *opentax-engine* project, under active development.

## Provenance and trademarks

- OpenCanTax is a fork of [opentax-engine](https://github.com/Invaro/opentax-engine)
  by **Invaro Inc.** The engine code (`packages/core`, `packages/cli`,
  `packages/mcp`, `packages/solve`, `packages/compose`, `packages/playground`)
  is used under the AGPL-3.0 license (versions through 0.2.1 and their git
  history are Apache-2.0; see `COMMERCIAL-LICENSE.md`).
- **"OpenTax" and the Invaro name and logo are trademarks of Invaro Inc.**
  OpenCanTax is **not affiliated with, endorsed by, or certified by
  Invaro Inc.** Upstream package identifiers (`@invaro/...`) remain in the
  engine code temporarily and will be renamed during the toolchain
  retarget; they are not used for any published artifact.
- The Canadian corpus (`packages/corpus-ca-federal`) is a separate,
  proprietary work of Woodgate Financial — see its `LICENSE`.

## Status and disclaimers

- **Internal-use project.** Nothing here is published to npm or offered as
  a hosted service.
- **Not tax advice.** This software is a computation-and-citation tool
  under development; it is not certified by, endorsed by, or affiliated
  with the Canada Revenue Agency, and it does not prepare or transmit tax
  returns. Verify all figures against official CRA sources.
- Reproductions of federal statutory text rely on the Reproduction of
  Federal Law Order, SI/97-5, and are **not official versions** of the law.
  Consolidation dates are recorded per rule.

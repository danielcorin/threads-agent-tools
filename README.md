# Threads Agent Tools

Public API contracts and distributable agent tooling for Threads.

[![CI](https://github.com/danielcorin/threads-agent-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/danielcorin/threads-agent-tools/actions/workflows/ci.yml)
[![Release](https://github.com/danielcorin/threads-agent-tools/actions/workflows/release.yml/badge.svg)](https://github.com/danielcorin/threads-agent-tools/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## Components

- [`contracts/`](./contracts) contains the public REST OpenAPI document and
  WebSocket event schemas.
- [`cli/`](./cli) contains the contract-derived `threads` command-line client.
- [`bridge/`](./bridge) contains the local daemon that connects Threads events
  to Codex, Claude Code, and Pi. Bridge archives bundle the matching CLI.

## Releases

One version identifies the contracts, CLI binaries, and bridge archives built
from one source commit. A release contains:

- standalone `threads` executables for macOS arm64/x64, Linux arm64/x64, and
  Windows x64;
- `threads-agent-bridge` archives for macOS arm64/x64 and Linux arm64/x64;
- contract snapshots, component checksums, source manifests, and GitHub build
  attestations.

See [GitHub Releases](https://github.com/danielcorin/threads-agent-tools/releases).

Verify an artifact with:

```bash
gh attestation verify threads-darwin-arm64 \
  --repo danielcorin/threads-agent-tools
```

## Development

```bash
npm ci
npm run check
```

The CLI and bridge retain focused documentation in their component directories.
Contract changes must regenerate and commit `cli/generated/`.

## Private Threads integration

The private Threads application pins this repository as a Git submodule. Its
guard verifies the exact submodule commit, public URL, clean checkout, release
metadata, and byte-for-byte agreement between the private source contracts and
the public copies here.

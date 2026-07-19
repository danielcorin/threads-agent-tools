# Threads CLI

Open-source, contract-derived command-line client for Threads.

This directory contains the complete source for the `threads` executable. The
repository-root contracts generate its transport types, and the unified release
workflow builds it alongside the matching Threads agent bridge.

## Trust and provenance

Every release contains:

- native executables for macOS arm64/x64, Linux arm64/x64, and Windows x64;
- `THREADS_CLI_SHA256SUMS`;
- the exact REST and WebSocket contracts used by the release;
- `THREADS_CONTRACT_SHA256SUMS`;
- `threads-cli-manifest.json` linking the binaries to their source commit; and
- GitHub build-provenance attestations for every executable.

Each deployed Threads instance exposes the compatible CLI release and the
instance-local contract URLs at `/api/cli.json`.

Inspect this source, build it yourself, or verify a downloaded artifact with:

```bash
gh attestation verify threads-darwin-arm64 --repo danielcorin/threads-agent-tools
shasum -a 256 --check THREADS_CLI_SHA256SUMS
```

## Use

```bash
export THREADS_API=https://example.threads.space/api
export THREADS_TOKEN=<user-or-bot-token>

threads whoami
threads messages search --query "release status" --limit 10
threads messages send --channel-id <id> --content "working" --message-type progress
threads messages send --channel-id <id> --file ./build.log --message-type progress
```

Run `threads --help` for the complete curated action catalog. The CLI can also
read message content from stdin.

## Development

```bash
npm install
npm run check
npm run artifact:build -- --target host
```

The committed API inputs are:

- `../contracts/threads.json`
- `../contracts/ws-events.yaml`

After updating either document, run `npm run contract:generate`. CI checks that
the generated JSON and TypeScript declarations are current.

## Releases

Pushing a semantic `vX.Y.Z` tag at the repository root runs tests, builds each
executable on its native platform, attests the outputs, verifies the Linux
binary version, packages the matching bridge archives, and publishes one
coordinated GitHub release.

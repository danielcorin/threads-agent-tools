---
name: releasing-agent-tools
description: Build, verify, and publish one coordinated Threads Agent Tools release containing public contracts, standalone CLI executables, and bridge archives with the exact matching CLI.
---

# Releasing Threads Agent Tools

Use this skill for changes to release versions, packaging, checksums,
attestations, GitHub releases, or downloadable CLI/bridge artifacts.

## Release invariant

One semantic version and source commit identify the complete release:

- REST and WebSocket contract snapshots;
- standalone `threads` executables for macOS arm64/x64, Linux arm64/x64, and
  Windows x64;
- `threads-agent-bridge` archives for macOS arm64/x64 and Linux arm64/x64;
- the exact platform CLI embedded in every bridge archive;
- component checksums, source manifests, and GitHub build attestations.

Never build the bridge from a separately downloaded or differently versioned
CLI. The repository-root release workflow owns the complete artifact graph.

## Before releasing

1. Update the same version in:
   - `package.json`
   - `cli/package.json`
   - `release.json`
2. Ensure `release.json` points to the intended public tag and asset names.
3. If contracts changed, run:

   ```bash
   npm run contract:generate
   ```

4. Inspect commits since the previous tag:

   ```bash
   git describe --tags --abbrev=0
   git log --oneline <previous-tag>..HEAD
   ```

5. Keep secrets and local state out of source and artifacts. Never package
   `.secrets/`, `config.local.json`, databases, logs, tokens, or local service
   definitions.

## Validate

From the repository root:

```bash
npm ci
npm run check
bash -n scripts/release.sh bridge/scripts/build-release.sh
```

For a local native CLI smoke test:

```bash
THREADS_ARTIFACT_VERSION=vX.Y.Z \
  npm run artifact:build -- --target host

cli/dist/cli/threads-darwin-arm64 --help
cli/dist/cli/threads-darwin-arm64 --version
```

The host filename varies by platform. The bridge suite uses localhost sockets,
so sandboxed environments may require explicit loopback permission.

## Publish

The release helper is intentionally two-phase:

```bash
scripts/release.sh vX.Y.Z
scripts/release.sh vX.Y.Z --publish
```

The first command validates without changing GitHub. The second requires clean,
synchronized `main`, creates an annotated tag, and pushes it. The tag starts
`.github/workflows/release.yml`; do not manually upload a second artifact set.

If the tag push succeeds but the workflow fails, fix the workflow and rerun the
failed job or safely move the tag only when no release was published. Never
overwrite a published release.

## Verify the published release

The release must contain:

```text
threads-darwin-arm64
threads-darwin-x64
threads-linux-arm64
threads-linux-x64
threads-windows-x64.exe
threads-agent-bridge_vX.Y.Z_darwin_arm64.tar.gz
threads-agent-bridge_vX.Y.Z_darwin_amd64.tar.gz
threads-agent-bridge_vX.Y.Z_linux_arm64.tar.gz
threads-agent-bridge_vX.Y.Z_linux_amd64.tar.gz
threads-openapi.json
threads-ws-events.yaml
THREADS_CLI_SHA256SUMS
THREADS_AGENT_BRIDGE_SHA256SUMS
THREADS_CONTRACT_SHA256SUMS
threads-cli-manifest.json
threads-agent-tools-manifest.json
```

Download assets into a temporary directory and verify all three checksum files.
Extract the native bridge archive, run both executables, and compare the
embedded `threads` byte-for-byte with the matching standalone asset.

Verify GitHub attestations for at least the native CLI and a bridge archive:

```bash
gh attestation verify threads-darwin-arm64 \
  --repo danielcorin/threads-agent-tools

gh attestation verify threads-agent-bridge_vX.Y.Z_darwin_arm64.tar.gz \
  --repo danielcorin/threads-agent-tools
```

Confirm `threads-agent-tools-manifest.json` contains five CLI entries, four
bridge entries, two contract entries, the release version, and the exact tagged
commit.

## Repository integration

After a verified release, update the private Threads repository’s
`agent-tools` submodule to the tagged commit. Its guard must continue to verify:

- the public repository URL;
- initialized, exact, clean gitlink state;
- byte-for-byte contract agreement;
- public release metadata.

The private application does not build or publish agent-tool releases and a
release does not deploy Threads or perform a fleet rollout.

---
name: releasing-bridge-artifacts
description: Build and release downloadable Threads Agent Bridge artifacts that users can run on their own machines. Use when asked to package, publish, test, or document bridge binaries, GitHub releases, checksums, install steps, or user-run local bridge distributions.
---

# Releasing Bridge Artifacts

## Instructions

Use this skill when turning `threads-agent-bridge` into downloadable binaries for users who want to connect local agent CLIs to a Threads instance.

### 1. Define the release surface

Before building, confirm or choose:

- Release target: GitHub Release, CI artifact, private download link, or local test build.
- Version/tag: prefer semantic tags like `v0.1.0`; use pre-release tags for experiments.
- Supported platforms. Default for this Go bridge:
  - `darwin/arm64` for Apple Silicon Macs.
  - `darwin/amd64` if Intel Mac support is needed.
  - `linux/amd64` and `linux/arm64` when users will run on Linux boxes.
  - Skip Windows unless explicitly requested; LaunchAgent docs and common agent CLIs are macOS-oriented.
- Included files: always include `threads-agent-bridge`, `threads`, `README.md`, `config.example.json`, and checksums.

Keep secrets and local state out of artifacts: never package `.secrets/`, `config.local.json`, `threads-agent-bridge.db`, `logs/`, or local plist files with embedded paths/tokens.

### 2. Build clean binaries

Run tests first:

```bash
go test ./...
```

Build both executables for each target from a clean checkout. Prefer one inspected loop so every archive gets the same files and naming:

```bash
VERSION=v0.1.0
rm -rf dist
mkdir -p dist

for target in darwin/arm64 darwin/amd64 linux/amd64 linux/arm64; do
  os=${target%/*}
  arch=${target#*/}
  name="threads-agent-bridge_${VERSION}_${os}_${arch}"
  mkdir -p "dist/$name"

  GOOS=$os GOARCH=$arch CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" \
    -o "dist/$name/threads-agent-bridge" ./cmd/threads-agent-bridge
  GOOS=$os GOARCH=$arch CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" \
    -o "dist/$name/threads" ./cmd/threads

  cp README.md config.example.json "dist/$name/"
done
```

If a platform is intentionally skipped, call that out in the release notes.

### 3. Package archives and checksums

Create platform-specific archives whose names include version, OS, and arch:

```bash
VERSION=v0.1.0

for dir in dist/threads-agent-bridge_${VERSION}_*; do
  [ -d "$dir" ] || continue
  tar -C dist -czf "${dir}.tar.gz" "$(basename "$dir")"
done

(cd dist && shasum -a 256 threads-agent-bridge_${VERSION}_*.tar.gz > checksums.txt)
```

Use `tar -C dist` and compute checksums from inside `dist` so archive contents and checksum lines use clean relative names, not local absolute paths or `dist/...` prefixes.

For zip-only environments, `.zip` is acceptable, but prefer `.tar.gz` for Unix/macOS users.

### 4. Smoke test the packaged artifact

Test the archive, not just the build directory:

```bash
TMPDIR=$(mktemp -d)
tar -xzf dist/threads-agent-bridge_v0.1.0_darwin_arm64.tar.gz -C "$TMPDIR"
cd "$TMPDIR"/threads-agent-bridge_darwin_arm64
./threads-agent-bridge -h
./threads -h
```

If possible, run a local end-to-end smoke test against a non-production Threads instance or test channel:

1. Copy `config.example.json` to a temporary config.
2. Supply a bot token through an env var, not inline JSON.
3. Start `./threads-agent-bridge -config <temp-config>`.
4. Send one routed Threads message and verify the expected agent responds.
5. Verify cancellation and error surfacing if the release changes runner/process behavior.

### 5. Publish the release

For GitHub releases, prefer the GitHub CLI. Check for an existing tag/release first so a retry does not fail halfway through:

```bash
VERSION=v0.1.0

git fetch --tags origin
if git rev-parse "$VERSION" >/dev/null 2>&1 || gh release view "$VERSION" >/dev/null 2>&1; then
  echo "Release or tag already exists: $VERSION" >&2
  exit 1
fi

cat > "dist/RELEASE_NOTES_${VERSION}.md" <<'EOF'
# threads-agent-bridge v0.1.0

...
EOF

git tag "$VERSION"
git push origin "$VERSION"

gh release create "$VERSION" \
  dist/threads-agent-bridge_${VERSION}_*.tar.gz \
  dist/checksums.txt \
  --title "threads-agent-bridge $VERSION" \
  --notes-file "dist/RELEASE_NOTES_${VERSION}.md"
```

If the tag push succeeds but release creation/upload fails, do not recreate the tag. Fix the issue, then use `gh release create` if no release exists yet, or `gh release upload <tag> <assets...> --clobber` if the release exists with missing/bad assets.

Release notes should include:

- What changed, in user terms.
- Supported platforms.
- Install/update steps.
- Required config fields and token setup link/summary.
- Known limitations, especially OS-specific service setup.
- A warning that users must provide their own Threads bot token and local agent CLI credentials.

### 6. Give users minimal install instructions

A release should tell users to:

1. Download the archive for their OS/arch.
2. Unpack it and put both binaries somewhere stable, e.g. `~/bin/threads-agent-bridge/`.
3. Copy `config.example.json` to `config.json`.
4. Mint or obtain a Threads bot token.
5. Store the token in an env var or local env file; do not commit it.
6. Start the bridge:

   ```bash
   THREADS_CODEX_TOKEN=... ./threads-agent-bridge -config config.json
   ```

7. Optionally install a user service:
   - macOS: LaunchAgent.
   - Linux: systemd user service.

### 7. Verify repository hygiene before committing release work

Before committing release scripts/workflows/docs:

```bash
git status --short
git diff --stat
go test ./...
```

Do not commit generated archives unless the repo intentionally tracks release assets. Prefer GitHub Release uploads or CI artifacts.

## Examples

### Build a one-off Apple Silicon archive

```bash
VERSION=v0.1.0
TARGET=threads-agent-bridge_${VERSION}_darwin_arm64
rm -rf dist/$TARGET
mkdir -p dist/$TARGET
GOOS=darwin GOARCH=arm64 go build -trimpath -ldflags "-s -w" -o dist/$TARGET/threads-agent-bridge ./cmd/threads-agent-bridge
GOOS=darwin GOARCH=arm64 go build -trimpath -ldflags "-s -w" -o dist/$TARGET/threads ./cmd/threads
cp README.md config.example.json dist/$TARGET/
tar -C dist -czf dist/$TARGET.tar.gz $TARGET
shasum -a 256 dist/$TARGET.tar.gz
```

### Release artifact naming

```text
threads-agent-bridge_v0.1.0_darwin_arm64.tar.gz
threads-agent-bridge_v0.1.0_linux_amd64.tar.gz
checksums.txt
```

## Gotchas

- The bridge binary alone is not enough; package the companion `threads` CLI too.
- A user artifact must not assume Daniel's local paths, LaunchAgent label, or `config.local.json`.
- Token setup belongs in docs, not in artifacts. Use `token_env` in configs rather than inline tokens.
- Smoke-test the compressed artifact after extraction; missing execute bits or missing companion files are common release failures.
- Check for existing tags/releases before `git tag`/`gh release create`; retries are common during manual releases.
- Generate release notes before running `gh release create`, and pass the actual path used, e.g. `dist/RELEASE_NOTES_v0.1.0.md`.
- After publishing, verify with `gh release view <tag> --json assets,url` and make sure every expected OS/arch archive plus `checksums.txt` is present.
- `dist/` may be ignored, so `git status --short` can look clean even with large generated artifacts. Use `git status --ignored --short dist` or `ls -lh dist` before deciding what to clean up.
- If adding a release workflow, keep it boring: Go toolchain, `go test ./...`, cross-compile, archive, checksum, upload. Avoid introducing a release framework until the manual script becomes painful.

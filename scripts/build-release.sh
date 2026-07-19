#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-${GITHUB_REF_NAME:-}}
THREADS_CLI_DIR=${THREADS_CLI_DIR:-${2:-}}
if [[ -z "$VERSION" ]]; then
  echo "usage: THREADS_CLI_DIR=/path/to/assets $0 <version>" >&2
  exit 2
fi
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([-+][A-Za-z0-9._-]+)?$ ]]; then
  echo "version must look like v0.1.2 (got: $VERSION)" >&2
  exit 2
fi
if [[ -z "$THREADS_CLI_DIR" || ! -d "$THREADS_CLI_DIR" ]]; then
  echo "THREADS_CLI_DIR must point to downloaded canonical Threads CLI assets" >&2
  exit 2
fi

THREADS_CLI_DIR=$(cd "$THREADS_CLI_DIR" && pwd)

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

rm -rf dist
mkdir -p dist

targets=(
  darwin/arm64
  darwin/amd64
  linux/amd64
  linux/arm64
)

for target in "${targets[@]}"; do
  os=${target%/*}
  arch=${target#*/}
  name="threads-agent-bridge_${VERSION}_${os}_${arch}"
  out="dist/$name"
  mkdir -p "$out"

  echo "building $name"
  GOOS=$os GOARCH=$arch CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" \
    -o "$out/threads-agent-bridge" ./cmd/threads-agent-bridge

  case "$target" in
    darwin/arm64) cli_asset="threads-darwin-arm64" ;;
    darwin/amd64) cli_asset="threads-darwin-x64" ;;
    linux/amd64) cli_asset="threads-linux-x64" ;;
    linux/arm64) cli_asset="threads-linux-arm64" ;;
    *)
      echo "no canonical Threads CLI mapping for $target" >&2
      exit 2
      ;;
  esac
  if [[ ! -f "$THREADS_CLI_DIR/$cli_asset" ]]; then
    echo "missing canonical Threads CLI asset: $THREADS_CLI_DIR/$cli_asset" >&2
    exit 2
  fi
  cp "$THREADS_CLI_DIR/$cli_asset" "$out/threads"
  chmod 0755 "$out/threads"

  cp README.md LICENSE config.example.json "$out/"
  if [[ -f "$THREADS_CLI_DIR/threads-cli-manifest.json" ]]; then
    cp "$THREADS_CLI_DIR/threads-cli-manifest.json" "$out/"
  fi
  tar -C dist -czf "dist/$name.tar.gz" "$name"
done

(
  cd dist
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum threads-agent-bridge_${VERSION}_*.tar.gz > checksums.txt
  else
    shasum -a 256 threads-agent-bridge_${VERSION}_*.tar.gz > checksums.txt
  fi
)

echo "release assets written to dist/"

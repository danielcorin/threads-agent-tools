#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-${GITHUB_REF_NAME:-}}
if [[ -z "$VERSION" ]]; then
  echo "usage: $0 <version>" >&2
  exit 2
fi
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([-+][A-Za-z0-9._-]+)?$ ]]; then
  echo "version must look like v0.1.2 (got: $VERSION)" >&2
  exit 2
fi

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
  GOOS=$os GOARCH=$arch CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" \
    -o "$out/threads" ./cmd/threads

  cp README.md LICENSE config.example.json "$out/"
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

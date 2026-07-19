#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:-}
PUBLISH=${2:-}
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "usage: $0 vX.Y.Z [--publish]" >&2
  exit 2
fi

PACKAGE_VERSION=$(node -p "require('./package.json').version")
CLI_VERSION=$(node -p "require('./cli/package.json').version")
RELEASE_VERSION=$(node -p "require('./release.json').version")
if [[ "$VERSION" != "v$PACKAGE_VERSION" || "$VERSION" != "v$CLI_VERSION" || "$VERSION" != "$RELEASE_VERSION" ]]; then
  echo "version mismatch: tag=$VERSION package=v$PACKAGE_VERSION cli=v$CLI_VERSION release=$RELEASE_VERSION" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "working tree must be clean" >&2
  exit 1
fi
if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "releases must be created from main" >&2
  exit 1
fi

npm ci
npm run check

if [[ "$PUBLISH" != "--publish" ]]; then
  echo "release preflight passed for $VERSION; rerun with --publish to tag and push"
  exit 0
fi

git fetch origin main --tags
if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
  echo "local main must match origin/main" >&2
  exit 1
fi
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "tag already exists: $VERSION" >&2
  exit 1
fi

git tag -a "$VERSION" -m "Threads Agent Tools $VERSION"
git push origin main "$VERSION"
echo "published $VERSION; GitHub Actions will build and release the artifacts"

# Contributing

Thanks for helping improve Threads Agent Bridge.

## Development

```bash
go test ./...
go vet ./...
go build -o bin/threads-agent-bridge ./cmd/threads-agent-bridge
go build -o bin/threads ./cmd/threads
```

Keep local state and secrets out of git. The repository ignores `config.local.json`, `.secrets/`, `logs/`, `*.db`, `bin/`, and `dist/`.

## Pull requests

- Keep changes focused.
- Include tests for behavior changes when practical.
- Update `README.md` or `config.example.json` when user-facing config or release behavior changes.
- Run `go test ./...` before opening a PR.

## Releases

Release artifacts are built by GitHub Actions when a `vX.Y.Z` tag is pushed. To build the same archive set locally:

```bash
scripts/build-release.sh v0.1.2
```

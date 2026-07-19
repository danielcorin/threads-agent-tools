# Contributing

Thanks for helping improve Threads Agent Bridge.

## Development

```bash
go test ./...
go vet ./...
go build -o bin/threads-agent-bridge ./cmd/threads-agent-bridge
```

Keep local state and secrets out of git. The repository ignores `config.local.json`, `.secrets/`, `logs/`, `*.db`, `bin/`, and `dist/`.

The canonical `threads` CLI lives in the sibling `../cli` directory. Bridge
prompt and packaging changes that depend on CLI behavior should update both
components atomically.

## Pull requests

- Keep changes focused.
- Include tests for behavior changes when practical.
- Update `README.md` or `config.example.json` when user-facing config or release behavior changes.
- Run `go test ./...` before opening a PR.

## Releases

The repository-root release workflow builds the CLI first, then passes those
exact binaries to this component's packaging script. To build the same bridge
archive set locally:

```bash
THREADS_CLI_DIR=/path/to/threads-cli-assets scripts/build-release.sh v0.1.3
```

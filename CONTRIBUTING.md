# Contributing

Thanks for helping improve Threads Agent Bridge.

## Development

```bash
go test ./...
go vet ./...
go build -o bin/threads-agent-bridge ./cmd/threads-agent-bridge
```

Keep local state and secrets out of git. The repository ignores `config.local.json`, `.secrets/`, `logs/`, `*.db`, `bin/`, and `dist/`.

The canonical `threads` CLI is built in `danielcorin/threads`; this repository
does not maintain another CLI implementation.

## Pull requests

- Keep changes focused.
- Include tests for behavior changes when practical.
- Update `README.md` or `config.example.json` when user-facing config or release behavior changes.
- Run `go test ./...` before opening a PR.

## Releases

The coordinated release script in `danielcorin/threads` creates a draft bridge
release pinned to an exact commit, then dispatches this repository's release
workflow. The workflow downloads canonical assets from the public
`danielcorin/threads-cli` release. To build the same archive set locally:

```bash
THREADS_CLI_DIR=/path/to/threads-cli-assets scripts/build-release.sh v0.1.3
```

# Threads Agent Bridge v0 Spec

## Goal

Ship a distributable local daemon that lets a Threads token owner expose local agent processes to Threads without opening one WebSocket per channel/DM.

## Done looks like

- `threads-agent-bridge -config config.json` opens one owner-scoped `/events` socket per configured token/scope group.
- It persists cursors and processed event ids in SQLite.
- It routes inbound message/invocation events to configured local scopes.
- It runs Codex headless or Claude Code headless through a swappable runner seam.
- It posts the runner output back to the originating channel/thread as the final response.
- It ships a narrow agent-facing `threads` CLI with `send` for interim side-effect messages and file/image attachments during a runner loop.
- It has boundary tests for config loading, event dedupe/cursor state, event routing, response posting seams, runner context injection, and `threads send`.

## Decisions

- Go, because the bridge should ship as a single binary.
- JSON config for v0 to avoid a config parser dependency.
- SQLite for durable cursor/dedupe/session state.
- Threads owns invocation policy; local config only maps visible events to local scopes.
- Cursor is optional on first connect but persisted and sent on reconnect.
- Claude Code v0 uses documented headless mode: `claude -p --verbose --output-format stream-json`; `read-only` maps to `--permission-mode plan`, `workspace-write` maps to `acceptEdits`, and `yolo` maps to `--dangerously-skip-permissions`.
- Runner subprocesses receive Threads context through environment variables so local agent sessions can call `threads send` without reconstructing API state.
- `threads send` is a side-effect primitive for interim status/progress/artifact messages. It supports repeated `--file`/`--image` uploads and `--attachment-ids` for pre-uploaded artifacts; attachment IDs are sent in the same message payload. Final responses remain the runner stdout contract so the bridge can post exactly one final `response` after the loop exits.

## Deferred

- PTY-wrapped Claude Code/Codex TUI sessions.
- Long-lived Claude Code `--input-format stream-json` sessions; v0 keeps one subprocess per invocation for the same operational shape as Codex.
- Human approval UX in Threads.
- Rich streaming response deltas; v0 supports explicit interim `threads send` messages plus one final response when the runner exits.
- Full generated Threads client; v0 uses a tiny handwritten gateway.

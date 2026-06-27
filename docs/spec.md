# Threads Agent Bridge v0 Spec

## Goal

Ship a distributable local daemon that lets a Threads token owner expose local agent processes to Threads without opening one WebSocket per channel/DM.

## Done looks like

- `threads-agent-bridge -config config.json` opens one owner-scoped `/events` socket per configured token/scope group.
- It persists cursors and processed event ids in SQLite.
- It routes inbound message/invocation events to configured local scopes.
- It runs Codex headless through a swappable runner seam.
- It posts the runner output back to the originating channel/thread.
- It has boundary tests for config loading, event dedupe/cursor state, event routing, and response posting seams.

## Decisions

- Go, because the bridge should ship as a single binary.
- JSON config for v0 to avoid a config parser dependency.
- SQLite for durable cursor/dedupe/session state.
- Threads owns invocation policy; local config only maps visible events to local scopes.
- Cursor is optional on first connect but persisted and sent on reconnect.

## Deferred

- PTY-wrapped Claude Code/Codex TUI sessions.
- Human approval UX in Threads.
- Rich streaming response updates; v0 posts one response when the runner exits.
- Full generated Threads client; v0 uses a tiny handwritten gateway.

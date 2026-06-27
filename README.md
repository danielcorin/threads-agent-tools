# Threads Agent Bridge

Local single-binary daemon that connects Threads owner-scoped events to local agent CLIs (starting with Codex headless).

## v0 shape

- One `GET /events?since=<cursor>` WebSocket per Threads token owner.
- Cursor is optional: first run can start live; reconnects resume from the persisted cursor.
- Multi-scope config maps Threads channels/threads to local runners and separate tokens.
- Local response policy is intentionally minimal: Threads decides when the bot should be invoked; this daemon routes received invocation events.
- SQLite persists cursors, processed-event dedupe, and scope/session mappings.
- Codex runs through `codex exec --json` by default, with safety flags supplied by local config.

## Quick start

```bash
cp config.example.json config.json
# edit token env vars / channels / runner args
go run ./cmd/threads-agent-bridge -config config.json
```

Build a single binary:

```bash
go build -o bin/threads-agent-bridge ./cmd/threads-agent-bridge
```

## Config

See [`config.example.json`](./config.example.json).

Each scope has:

- `id`: stable local scope id.
- `threads`: API base URL, token env var or token, and optional `since` override.
- `match`: channel/thread allowlist. Empty allowlists match all visible events for that token.
- `runner`: local tool command/args. v0 defaults to Codex-style stdin prompt and JSONL/stdout parsing.
- `safety`: user-owned mode values translated by the Codex argv builder (`read-only`, `workspace-write`, `danger-full-access`, or `yolo`). Tool allowlists are stored in config for the next runner seam but not enforced by Codex v0.

## Event contract assumed

The bridge accepts flexible JSON envelopes while the Threads `/events` schema settles:

```json
{
  "id": "evt_123",
  "cursor": "cur_123",
  "type": "message.created",
  "channelId": "ch_123",
  "threadId": "msg_123",
  "message": { "id": "msg_456", "content": "...", "senderId": "usr_..." }
}
```

Unknown event types are ignored. Missing event ids fall back to cursor for dedupe.

# Threads Agent Bridge

Local single-binary daemon that connects Threads owner-scoped events to local agent CLIs (starting with Codex and Claude Code headless), plus a narrow agent-facing `threads` CLI for emitting Threads messages during a run.

## v0 shape

- One `GET /events?since=<cursor>` WebSocket per Threads token owner.
- Cursor is optional: first run can start live; reconnects resume from the persisted cursor.
- Multi-scope config maps Threads channels/threads to local runners and separate tokens.
- Local response policy is intentionally minimal: Threads decides when the bot should be invoked; this daemon routes received invocation events.
- SQLite persists cursors, processed-event dedupe, and scope/session mappings.
- Codex runs through `codex exec --json` by default, with safety flags supplied by local config.
- Claude Code runs through `claude -p --verbose --output-format stream-json`; if `claude` is not installed on PATH, use `npx -y @anthropic-ai/claude-code` as the command and keep the Claude flags in `runner.args`.
- Runner subprocesses receive `THREADS_BASE_URL`, `THREADS_API_TOKEN`, `THREADS_CHANNEL_ID`, `THREADS_THREAD_ID`, `THREADS_MESSAGE_ID`, and `THREADS_SCOPE_ID` so they can call the companion `threads` CLI.
- `threads send` posts immediate side-effect/interim messages and can attach files/images through Threads uploads. Final answers remain stdout from the runner; the bridge posts that stdout once the runner exits.

## Quick start

```bash
cp config.example.json config.json
# edit token env vars / channels / runner args
go run ./cmd/threads-agent-bridge -config config.json
```

Build the binaries:

```bash
go build -o bin/threads-agent-bridge ./cmd/threads-agent-bridge
go build -o bin/threads ./cmd/threads
```

## Agent-facing Threads CLI

`threads` is intentionally narrow. It exists so local tools/agents can publish progress or artifacts before their loop is finished without taking over final-response handling.

```bash
threads send --content "Working on it..."
echo "Found the failing test" | threads send --type agent_update
threads send --channel ch_123 --thread msg_123 --content "Still running"
threads send --content "Log attached" --file ./test.log
threads send --content "Screenshot" --image ./screenshot.png
threads send --attachment-ids att_123,att_456
```

`threads send` reads defaults from `THREADS_BASE_URL`, `THREADS_API_TOKEN`, `THREADS_CHANNEL_ID`, and `THREADS_THREAD_ID`, which the bridge injects into runner subprocesses. The command defaults to `message_type: "agent_update"` and metadata `{source:"threads-cli", kind:"interim"}`. `--file` and `--image` may be repeated; each path is uploaded to `POST /uploads`, then the returned attachment IDs are included when posting the message. `--attachment-ids` can reuse already-uploaded IDs, and attachment-only messages are allowed. The agent should still write its final answer to stdout; the daemon posts stdout as the final `response` message.

## Config

See [`config.example.json`](./config.example.json).

Each scope has:

- `id`: stable local scope id.
- `threads`: API base URL, token env var or token, and optional `since` override.
- `match`: channel/thread allowlist. Empty allowlists match all visible events for that token.
- `runner`: local tool command/args. v0 defaults to Codex-style stdin prompt and JSONL/stdout parsing; set `type: "claude-code"` for Claude Code stream-json parsing and safety flag mapping.
- `safety`: user-owned mode values translated by the runner argv builder. Codex supports `read-only`, `workspace-write`, `danger-full-access`, or `yolo`; Claude Code maps `read-only` to plan mode, `workspace-write` to acceptEdits, and `yolo` to skipped permissions. `allowed_tools` maps to Claude Code `--allowedTools` for Claude scopes.

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

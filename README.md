# Threads Agent Bridge

[![CI](https://github.com/danielcorin/threads-agent-bridge/actions/workflows/ci.yml/badge.svg)](https://github.com/danielcorin/threads-agent-bridge/actions/workflows/ci.yml)
[![Release](https://github.com/danielcorin/threads-agent-bridge/actions/workflows/release.yml/badge.svg)](https://github.com/danielcorin/threads-agent-bridge/actions/workflows/release.yml)
[![Go Reference](https://pkg.go.dev/badge/github.com/danielcorin/threads-agent-bridge.svg)](https://pkg.go.dev/github.com/danielcorin/threads-agent-bridge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Local single-binary daemon that connects Threads owner-scoped events to local agent CLIs (Codex, Claude Code, and Pi headless). Release archives also contain the canonical agent-facing `threads` CLI produced by the private Threads application repository.

## v0 shape

- One `GET /events?since=<cursor>` WebSocket per Threads token owner.
- Cursor is optional: first run can start live; reconnects resume from the persisted cursor.
- Multi-scope config maps Threads bot tokens to local runners, with optional channel/thread allowlists.
- Local response policy is intentionally minimal: Threads decides when the bot should be invoked; each scope must explicitly opt in with `match` entries, using `"*"` for all delivered channels/threads. Any reaction emoji on a message authored by a routed bot routes that message back to that same bot.
- SQLite persists cursors, processed-event dedupe, and Threads-thread-to-runner-session mappings.
- Each top-level Threads message starts a new local runner conversation; replies in that Threads thread resume/append to the stored Codex/Claude Code/Pi session for that root message.
- Codex runs through `codex exec --json` by default, captures `thread_id`, and resumes replies with `codex exec ... resume --json <thread_id> -`.
- Claude Code runs through `claude -p --verbose --output-format stream-json`, captures `session_id`, and resumes replies with `--resume <session_id>`; if `claude` is not installed on PATH, use `npx -y @anthropic-ai/claude-code` as the command and keep the Claude flags in `runner.args`.
- Pi runs through `pi --mode json --print`, captures the emitted `sessionFile`, and resumes replies with `--session <sessionFile>`. Pi JSON `tool_execution_*` events stream into the same Threads tool-call UI.
- Runner subprocesses receive canonical `THREADS_API` / `THREADS_TOKEN` credentials plus channel, thread, message, scope, and runner-session context so they can call the bundled `threads` CLI. Legacy `THREADS_BASE_URL` / `THREADS_API_TOKEN` aliases remain available to runner scripts.
- `threads messages send` posts immediate side-effect/interim messages and can attach files/images through Threads uploads. Final answers remain stdout from the runner; the bridge posts that stdout once the runner exits.
- With `runner.auto_title: true` and structured output enabled, the first root-message inference can return `thread_title`; the bridge applies it with guarded set-if-empty semantics so it cannot overwrite an existing human title.
- The daemon creates a Threads process as soon as a run starts, marks the triggering message `processing`, and updates the process/message to `done`, `error`, or `killed` when the run exits.
- Clicking the `x` in the Threads tool-call/process UI sends a process kill event; the bridge maps that process id to the active local subprocess context and cancels/kills the Codex, Claude Code, or Pi loop.
- The daemon streams Codex/Claude Code/Pi tool-call events from JSONL stdout into Threads step rows (`progress` on start, `tool_output` on completion) with `metadata.trigger_id` set to the user message that triggered the run, so the existing Threads tool-call rail attaches to that message as calls occur.

## Quick start

Download a release archive for your OS/arch from [GitHub Releases](https://github.com/danielcorin/threads-agent-bridge/releases), or run from source:

```bash
cp config.example.json config.json
# edit token env vars / bot user ids / runner args
go run ./cmd/threads-agent-bridge -config config.json
```

Build the daemon locally:

```bash
go build -o bin/threads-agent-bridge ./cmd/threads-agent-bridge
```

The `threads` executable is not implemented in this repository. Install it
from a bridge release archive or a canonical Threads CLI release.

## Development

```bash
go test ./...
go vet ./...
```

CI runs formatting checks, `go vet`, `go test ./...`, and binary builds on every pull request and push to `main`.

## Releases

Release archives are coordinated by
`danielcorin/threads/scripts/release-cli-and-bridge.sh`. The script stages the
five canonical CLI executables on a draft bridge release, then dispatches this
repository's release workflow. The workflow verifies their checksums and
version before building `threads-agent-bridge` for:

- `darwin/arm64`
- `darwin/amd64`
- `linux/amd64`
- `linux/arm64`

To build the same archive set locally from previously downloaded canonical CLI
assets, run:

```bash
THREADS_CLI_DIR=/path/to/threads-cli-assets scripts/build-release.sh v0.1.3
```

Release assets include the raw canonical CLI executables for all five
platforms, four macOS/Linux daemon archives containing the matching CLI,
provenance/checksum manifests, `README.md`, `LICENSE`, and
`config.example.json`. Users must provide their own Threads bot token and local
agent CLI credentials.

## Running as a macOS LaunchAgent

The bridge can run continuously as a user LaunchAgent. Keep the plist, config, secrets, and logs local to the machine that owns the bot tokens. A typical setup uses:

- A LaunchAgent label such as `com.example.threads-agent-bridge`
- A working directory containing `bin/threads-agent-bridge`, `config.local.json`, `.secrets/*.env`, and `logs/`
- A command such as `bin/threads-agent-bridge -config config.local.json`

Useful commands:

```bash
launchctl print gui/$UID/com.example.threads-agent-bridge
launchctl kickstart -k gui/$UID/com.example.threads-agent-bridge
launchctl bootout gui/$UID ~/Library/LaunchAgents/com.example.threads-agent-bridge.plist
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.example.threads-agent-bridge.plist
```

If the bridge appears unresponsive, first check that the LaunchAgent exists and that a `threads-agent-bridge` process is running, then inspect your local bridge logs.

## Agent-facing Threads CLI

The bundled canonical `threads` CLI exposes the full curated Threads action
catalog. The bridge prompt uses only a few side-effect operations so local
tools/agents can publish progress or artifacts before their loop is finished
without taking over final-response handling.

```bash
threads messages send --channel-id "$THREADS_CHANNEL_ID" --thread-id "$THREADS_THREAD_ID" --content "Working on it..." --message-type progress
echo "Found the failing test" | threads messages send --channel-id "$THREADS_CHANNEL_ID" --thread-id "$THREADS_THREAD_ID" --message-type progress
threads messages send --channel-id ch_123 --thread-id msg_123 --content "Still running" --message-type progress
threads messages send --channel-id "$THREADS_CHANNEL_ID" --thread-id "$THREADS_THREAD_ID" --content "Log attached" --file ./test.log --message-type progress
threads messages send --channel-id "$THREADS_CHANNEL_ID" --thread-id "$THREADS_THREAD_ID" --content "Screenshot" --image ./screenshot.png --message-type progress
threads messages send --channel-id "$THREADS_CHANNEL_ID" --thread-id "$THREADS_THREAD_ID" --attachment-ids att_123,att_456 --message-type progress
threads reactions add --message-id "$THREADS_MESSAGE_ID" --emoji "✅"
threads reactions add --message-id msg_456 --emoji "🚀"
threads messages title --message-id "$THREADS_THREAD_ID" --title "Investigate WebSocket reconnects"
threads messages title --message-id msg_456 --title "Release v2 follow-ups"
threads messages title --message-id "$THREADS_THREAD_ID" --title "Generated first title" --if-unset true
```

The bridge injects `THREADS_API`, `THREADS_TOKEN`, `THREADS_CHANNEL_ID`,
`THREADS_THREAD_ID`, and `THREADS_MESSAGE_ID`. For top-level messages,
`THREADS_THREAD_ID` is normalized to the root message id so interim and final
responses land in the same Threads thread. Use the contract-defined `progress`
message type for interim updates. `--file` and `--image` may be repeated; each
path is uploaded to `POST /uploads`, then the returned attachment IDs are
included when posting the message. `--attachment-ids` can reuse already
uploaded IDs, and attachment-only messages are allowed. The agent should still
write its final answer to stdout; the daemon posts stdout as the final
`response` message.

`threads reactions add` requires the target `--message-id`; use
`$THREADS_MESSAGE_ID` for the message that triggered the current run.

`threads messages title` requires a root or reply `--message-id`. Use
`$THREADS_THREAD_ID` for the normalized root. `--if-unset true` makes the
update safe for automatic titles by preserving any existing title.

Tool-call streaming and process lifecycle are bridge-owned. Agents do not need to know the Threads UI schema: Codex `command_execution` JSONL items, Claude Code `tool_use`/`tool_result` stream-json events, and Pi `tool_execution_*` JSON events are translated into hidden/intermediate Threads step messages by the daemon. Runner usage/limit signals are surfaced too: Codex `rate_limits` JSONL, Claude rate/usage-limit JSON events, and Pi provider usage/error messages become `runner_limit` status messages in the same Threads thread. The daemon also records `process.activity` counts for tool calls, runner status, and replies so the Threads process list reflects local CLI work.

## Bot token and config setup

The bridge should run each routed bot with that bot user's Threads API token. Keep tokens out of git: `config.local.json`, `.secrets/*.env`, `threads-agent-bridge.db`, and `logs/` are local-only files.

1. Create or obtain a Threads bot user and mint an API token for that bot through your Threads workspace/admin tooling.

2. Store the token in a local env file that the LaunchAgent or shell sources:

   ```bash
   mkdir -p .secrets
   printf 'THREADS_CODEX_TOKEN=%s\n' "$BOT_TOKEN" >> .secrets/codex.env
   ```

   Use one env var per routed bot, for example `THREADS_CODEX_TOKEN`, `THREADS_CLAUDE_CODE_TOKEN`, and `THREADS_PI_TOKEN`.

3. Copy the example config and wire the env var and bot user id into the matching scope:

   ```bash
   cp config.example.json config.local.json
   $EDITOR config.local.json
   ```

   The relevant fields are:

   ```json
   {
     "threads": {
       "base_url": "https://<org>.threads.space",
       "token_env": "THREADS_CODEX_TOKEN",
       "user_id": "<bot-user-id>"
     },
     "match": {
       "channel_ids": ["<channel-id>"],
       "thread_ids": ["*"]
     }
   }
   ```

   Prefer `token_env` over an inline `token` so the secret stays in `.secrets/*.env`. `user_id` must be the same bot user that owns the token; the bridge uses it for presence and process attribution. `match` arrays are deny-by-default: list only channels/root threads that should be passed to that scope. Use `"*"` only when the bot is intentionally allowed to process every delivered channel/thread.

4. Restart the LaunchAgent or bridge process after changing config or secrets, then inspect your local logs for startup errors.

## Config

See [`config.example.json`](./config.example.json).

Each scope has:

- `id`: stable local scope id.
- `threads`: API base URL, token env var or token, and optional `since` override.
- `match`: local channel/thread allowlists. Empty or omitted `channel_ids` and `thread_ids` match no events. Use `"*"` in an array to accept all delivered values for that dimension; otherwise list only the channel ids and/or root thread ids that should be passed to that scope. For example, `channel_ids: ["c1"]` plus `thread_ids: ["*"]` means every delivered thread in channel `c1`. Reaction events use the same channel/thread allowlists, but do not have per-emoji routing: any emoji on a message whose `senderId` matches the scope's `threads.user_id` invokes that same scope.
- `runner`: local tool command/args. v0 defaults to Codex-style stdin prompt and JSONL/stdout parsing; set `type: "claude-code"` for Claude Code stream-json parsing or `type: "pi"` for Pi JSON print mode. Set `structured: true` to let the final stdout be a JSON object such as `{ "content": "Done", "reactions": [{ "message_id": "msg_123", "emoji": "✅" }] }`; the bridge posts `content` and applies the requested reactions. Plain-text final output still works in structured mode. Set `auto_title: true` alongside `structured: true` to require a `thread_title` field on the first newly created root message; title generation is best-effort and never blocks the final response.
- `safety`: user-owned mode values translated by the runner argv builder. Codex supports `read-only`, `workspace-write`, `danger-full-access`, `auto`, or `yolo`; `auto` maps to workspace-write, no approval prompts, and workspace-write network access. Claude Code maps `read-only` to plan mode, `workspace-write` to acceptEdits, `auto` to `--permission-mode auto`, and `yolo` to skipped permissions. Pi maps `read-only` to `--tools read,grep,find,ls` unless `allowed_tools` is set; `allowed_tools` maps to Pi `--tools` and Claude Code `--allowedTools` for their respective scopes.

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

Reaction invocation accepts delivered reaction events with `type: "reaction_added"`, `"reaction.created"`, or `"reaction"`, plus `emoji`, `channelId`, and `messageId`/`message.id` for the reacted-to message. The reacted-to message must include `senderId`, and the scope must match both `threads.user_id` and the configured `channel_ids`/`thread_ids`.

Unknown event types are ignored. Missing event ids fall back to cursor for dedupe.

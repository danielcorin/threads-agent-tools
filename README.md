# Threads Agent Bridge

Local single-binary daemon that connects Threads owner-scoped events to local agent CLIs (Codex, Claude Code, and Pi headless), plus a narrow agent-facing `threads` CLI for emitting Threads messages during a run.

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
- Runner subprocesses receive `THREADS_BASE_URL`, `THREADS_API_TOKEN`, `THREADS_CHANNEL_ID`, `THREADS_THREAD_ID`, `THREADS_MESSAGE_ID`, `THREADS_SCOPE_ID`, and `THREADS_RUNNER_SESSION_ID` so they can call the companion `threads` CLI.
- `threads send` posts immediate side-effect/interim messages and can attach files/images through Threads uploads. Final answers remain stdout from the runner; the bridge posts that stdout once the runner exits.
- The daemon creates a Threads process as soon as a run starts, marks the triggering message `processing`, and updates the process/message to `done`, `error`, or `killed` when the run exits.
- Clicking the `x` in the Threads tool-call/process UI sends a process kill event; the bridge maps that process id to the active local subprocess context and cancels/kills the Codex, Claude Code, or Pi loop.
- The daemon streams Codex/Claude Code/Pi tool-call events from JSONL stdout into Threads step rows (`progress` on start, `tool_output` on completion) with `metadata.trigger_id` set to the user message that triggered the run, so the existing Threads tool-call rail attaches to that message as calls occur.

## Quick start

```bash
cp config.example.json config.json
# edit token env vars / bot user ids / runner args
go run ./cmd/threads-agent-bridge -config config.json
```

Build the binaries:

```bash
go build -o bin/threads-agent-bridge ./cmd/threads-agent-bridge
go build -o bin/threads ./cmd/threads
```

## Running as a macOS LaunchAgent

The local bridge is intended to run continuously as a user LaunchAgent in development. The current local service uses:

- Label: `com.danielcorin.threads-agent-bridge`
- Plist: `~/Library/LaunchAgents/com.danielcorin.threads-agent-bridge.plist`
- Working directory: `~/dev/threads-agent-bridge`
- Command: `bin/threads-agent-bridge -config config.local.json`
- Env files sourced before launch: `.secrets/codex.env`, `.secrets/claude-code.env`, and optionally `.secrets/pi.env`
- Logs: `logs/bridge.log` and `logs/bridge.err.log` (`logs/` is gitignored)

Useful commands:

```bash
launchctl print gui/$UID/com.danielcorin.threads-agent-bridge
launchctl kickstart -k gui/$UID/com.danielcorin.threads-agent-bridge
launchctl bootout gui/$UID ~/Library/LaunchAgents/com.danielcorin.threads-agent-bridge.plist
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.danielcorin.threads-agent-bridge.plist
```

If the bridge appears unresponsive, first check that the LaunchAgent exists and that a `threads-agent-bridge` process is running, then inspect `logs/bridge.err.log`.

## Agent-facing Threads CLI

`threads` is intentionally narrow. It exists so local tools/agents can publish progress or artifacts before their loop is finished without taking over final-response handling.

```bash
threads send --content "Working on it..."
echo "Found the failing test" | threads send --type agent_update
threads send --channel ch_123 --thread msg_123 --content "Still running"
threads send --content "Log attached" --file ./test.log
threads send --content "Screenshot" --image ./screenshot.png
threads send --attachment-ids att_123,att_456
threads react --emoji "✅"
threads react --message msg_123 --emoji "👀"
threads react --message-id msg_456 --emoji "🚀"
```

`threads send` reads defaults from `THREADS_BASE_URL`, `THREADS_API_TOKEN`, `THREADS_CHANNEL_ID`, and `THREADS_THREAD_ID`, which the bridge injects into runner subprocesses. For top-level messages, `THREADS_THREAD_ID` is normalized to the root message id so interim and final responses land in the same Threads thread. The command defaults to `message_type: "agent_update"` and metadata `{source:"threads-cli", kind:"interim"}`. `--file` and `--image` may be repeated; each path is uploaded to `POST /uploads`, then the returned attachment IDs are included when posting the message. `--attachment-ids` can reuse already-uploaded IDs, and attachment-only messages are allowed. The agent should still write its final answer to stdout; the daemon posts stdout as the final `response` message.

`threads react` reads `THREADS_BASE_URL`, `THREADS_API_TOKEN`, and `THREADS_MESSAGE_ID`; by default it reacts to the message that triggered the current run. Agents can react to any visible Threads message by passing `--message <id>` or `--message-id <id>`.

Tool-call streaming and process lifecycle are bridge-owned. Agents do not need to know the Threads UI schema: Codex `command_execution` JSONL items, Claude Code `tool_use`/`tool_result` stream-json events, and Pi `tool_execution_*` JSON events are translated into hidden/intermediate Threads step messages by the daemon. Runner usage/limit signals are surfaced too: Codex `rate_limits` JSONL, Claude rate/usage-limit JSON events, and Pi provider usage/error messages become `runner_limit` status messages in the same Threads thread. The daemon also records `process.activity` counts for tool calls, runner status, and replies so the Threads process list reflects local CLI work.

## Bot token and config setup

The bridge should run each routed bot with that bot user's Threads API token. Keep tokens out of git: `config.local.json`, `.secrets/*.env`, `threads-agent-bridge.db`, and `logs/` are local-only files.

1. Load the Threads admin credentials from the local Threads checkout:

   ```bash
   export THREADS_TOKEN=$(grep THREADS_API_TOKEN ~/dev/tela/.env | cut -d= -f2)
   set -a && source ~/dev/filae/local.env && set +a
   ```

   `THREADS_TOKEN` authenticates the admin CLI user; `THREADS_ADMIN_KEY` from `local.env` authorizes `admin *` commands.

2. Find or create the bot user. If the bot user already exists, use its id. To create one:

   ```bash
   BOT_USER_ID=$(bun /Users/dancorin/dev/threads/cli.ts admin create-user \
     --username codex \
     --display-name "Codex" \
     --password "$(openssl rand -base64 32)" \
     | jq -r .id)

   bun /Users/dancorin/dev/threads/cli.ts admin sql \
     --sql "UPDATE users SET role = 'bot' WHERE id = '$BOT_USER_ID'"
   ```

3. Mint a token for that bot user:

   ```bash
   BOT_TOKEN=$(bun /Users/dancorin/dev/threads/cli.ts admin create-api-token \
     --user-id "$BOT_USER_ID" \
     --name "threads-agent-bridge-codex-$(date +%Y-%m-%d)" \
     | jq -r .token)
   ```

4. Store the token in a local env file that the LaunchAgent sources:

   ```bash
   mkdir -p .secrets
   printf 'THREADS_CODEX_TOKEN=%s\n' "$BOT_TOKEN" >> .secrets/codex.env
   ```

   Use one env var per routed bot, for example `THREADS_CODEX_TOKEN`, `THREADS_CLAUDE_CODE_TOKEN`, and `THREADS_PI_TOKEN`.

5. Copy the example config and wire the env var and bot user id into the matching scope:

   ```bash
   cp config.example.json config.local.json
   $EDITOR config.local.json
   ```

   The relevant fields are:

   ```json
   {
     "threads": {
       "base_url": "https://threads-api.filae.site",
       "token_env": "THREADS_CODEX_TOKEN",
       "user_id": "<bot-user-id>"
     },
     "match": {
       "channel_ids": ["*"],
       "thread_ids": ["*"]
     }
   }
   ```

   Prefer `token_env` over an inline `token` so the secret stays in `.secrets/*.env`. `user_id` must be the same bot user that owns the token; the bridge uses it for presence and process attribution. `match` arrays are deny-by-default: use `"*"` to accept all delivered channels/threads, or list only the channel/root thread ids that should be passed to that scope.

6. Restart the LaunchAgent after changing config or secrets:

   ```bash
   launchctl kickstart -k gui/$UID/com.danielcorin.threads-agent-bridge
   tail -f logs/bridge.err.log
   ```

## Config

See [`config.example.json`](./config.example.json).

Each scope has:

- `id`: stable local scope id.
- `threads`: API base URL, token env var or token, and optional `since` override.
- `match`: local channel/thread allowlists. Empty or omitted `channel_ids` and `thread_ids` match no events. Use `"*"` in an array to accept all delivered values for that dimension; otherwise list only the channel ids and/or root thread ids that should be passed to that scope. For example, `channel_ids: ["c1"]` plus `thread_ids: ["*"]` means every delivered thread in channel `c1`. Reaction events use the same channel/thread allowlists, but do not have per-emoji routing: any emoji on a message whose `senderId` matches the scope's `threads.user_id` invokes that same scope.
- `runner`: local tool command/args. v0 defaults to Codex-style stdin prompt and JSONL/stdout parsing; set `type: "claude-code"` for Claude Code stream-json parsing or `type: "pi"` for Pi JSON print mode. Set `structured: true` to let the final stdout be a JSON object such as `{ "content": "Done", "reactions": [{ "message_id": "msg_123", "emoji": "✅" }] }`; the bridge posts `content` and applies the requested reactions. Plain-text final output still works in structured mode.
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

# Threads Agent Bridge v0 Spec

## Goal

Ship a distributable local daemon that lets a Threads token owner expose local agent processes to Threads without opening one WebSocket per channel/DM.

## Done looks like

- `threads-agent-bridge -config config.json` opens one owner-scoped `/events` socket per configured token/scope group.
- It persists cursors and processed event ids in SQLite.
- It routes inbound message/invocation events to configured local scopes, optionally filtered by a local channel/thread allowlist.
- It maps each top-level Threads message/root id to one durable runner session and resumes that session for replies in the same Threads thread.
- It runs Codex, Claude Code, or Pi headless through a swappable runner seam.
- It posts the runner output back to the originating channel/root thread as the final response.
- It streams CLI tool-call lifecycle events into Threads step rows attached to the triggering user message (`metadata.trigger_id`), using `progress` for starts and `tool_output` for completions so the existing Threads tool-call UI updates as calls occur.
- It ships a narrow agent-facing `threads` CLI with `send` for interim side-effect messages and file/image attachments during a runner loop, `react` for reactions, and `title` for explicit guarded or unconditional thread-title updates.
- Scopes can opt into first-turn automatic titles with structured runner output; the bridge owns the set-if-empty API write so runner tool sandboxes cannot block it.
- It has boundary tests for config loading, event dedupe/cursor state, event routing, response posting seams, runner context injection, and `threads send`.

## Decisions

- Go, because the bridge should ship as a single binary.
- JSON config for v0 to avoid a config parser dependency.
- SQLite for durable cursor/dedupe/session state.
- Threads owns invocation policy; local config maps visible events to local scopes with explicit local allowlists. `match.channel_ids` / `match.thread_ids` are deny-by-default; `"*"` opts a scope into all delivered channels/threads for that dimension.
- Cursor is optional on first connect but persisted and sent on reconnect.
- Claude Code v0 uses documented headless mode: `claude -p --verbose --output-format stream-json`; `read-only` maps to `--permission-mode plan`, `workspace-write` maps to `acceptEdits`, `auto` maps to `--permission-mode auto`, and `yolo` maps to `--dangerously-skip-permissions`. Codex `auto` maps to workspace-write, no approval prompts, and workspace-write network access. Pi v0 uses `pi --mode json --print`; `read-only` maps to `--tools read,grep,find,ls` unless `allowed_tools` is configured.
- Runner subprocesses receive Threads context through environment variables so local agent sessions can call `threads send` without reconstructing API state. `THREADS_THREAD_ID` is normalized to the root message id; `THREADS_RUNNER_SESSION_ID` is set once a native Codex/Claude/Pi session exists.
- `threads send` is a side-effect primitive for interim status/progress/artifact messages. It supports repeated `--file`/`--image` uploads and `--attachment-ids` for pre-uploaded artifacts; attachment IDs are sent in the same message payload. Final responses remain the runner stdout contract so the bridge can post exactly one final `response` after the loop exits.
- Tool-call UI streaming is a bridge-side translation layer, not an agent-facing Threads schema. Codex `command_execution` JSONL events, Claude Code `tool_use`/`tool_result` stream-json events, and Pi `tool_execution_*` JSON events map to a canonical runner tool event before the daemon posts Threads step rows.
- Automatic titles reuse the first normal inference. They are requested only for newly created root messages, returned as `thread_title` in the structured output envelope, and applied by the bridge with `if_unset: true`. Missing, invalid, rejected, or unsupported title updates are nonfatal.

## Deferred

- PTY-wrapped Claude Code/Codex TUI sessions.
- Long-lived Claude Code `--input-format stream-json` or Pi `--mode rpc` sessions; v0 keeps one subprocess per invocation and uses native resume (`codex exec resume`, `claude --resume`, `pi --session`) for thread continuity.
- Human approval UX in Threads.
- Token-level response deltas; v0 supports tool-call lifecycle streaming, explicit interim `threads send` messages, and one final response when the runner exits.
- Full generated Threads client; v0 uses a tiny handwritten gateway.

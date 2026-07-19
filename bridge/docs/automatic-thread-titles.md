# Automatic Thread Titles

Status: Implemented

## Summary

Threads supports an optional human-readable title on a message thread through
`PUT /messages/{id}/thread-title`. The bridge should use the first normal
Claude Code, Pi, or Codex inference to propose a title for a newly created root
message, then perform the authenticated Threads update itself.

The title is part of the runner's structured final-output envelope. It is not a
required agent tool call. This keeps the behavior consistent when a runner is
using a read-only or network-restricted tool sandbox.

The shipped `threads` CLI should also gain a `title` command for explicit
renames and scripts, but that command is not the primary automatic path.

## Goals

- Generate a concise title for a new Threads root message using the runner that
  is already answering the first turn.
- Support Claude Code, Pi, and Codex through one bridge-owned contract.
- Avoid an additional inference request in the initial implementation.
- Never overwrite a title that a human or another agent has already set.
- Keep title failures independent from final-response delivery.
- Preserve manual thread renaming and expose it through the shipped CLI.

## Non-goals

- Retitle an existing thread after every reply.
- Keep the Threads title synchronized with a Claude Code, Pi, or Codex local
  session name.
- Add a dedicated low-latency title model in the first release.
- Require agent shell access or network access to set an automatic title.
- Generate titles for reaction invocations, retries, or resumed sessions.

## Current state

Threads provides:

- Optional `thread_title` and `thread_title_updated_at` fields on root messages.
- `PUT /messages/{id}/thread-title`, accepting either a root or reply message
  ID and normalizing it to the root.
- Membership authorization for title updates.
- A `thread_title_updated` websocket event.
- A caller action and CLI route named `set_thread_title` /
  `messages title`.
- Client support for displaying and manually editing a title.

The bridge provides:

- A `NewSession` signal and normalized root `ThreadID` in `runner.Input`.
- A structured final-output envelope containing `content` and `reactions`.
- One parser and canonical `runner.Output` shared by all supported runners.
- An authenticated Threads client outside the runner tool sandbox.
- A narrow shipped `threads` CLI with environment-derived Threads context.

The missing pieces are an automatic-title output field, a bridge client method,
a daemon-side update, and guarded server semantics for inferred titles.

## Design decisions

### Reuse the first normal inference

When automatic titles are enabled, the first normal runner invocation returns a
short title alongside its final response:

```json
{
  "content": "The normal answer posted to Threads.",
  "thread_title": "Investigate WebSocket reconnects",
  "reactions": []
}
```

This avoids a second model call and lets the title reflect the agent's
understanding of the task. The title may appear only when the first response
finishes. A separate early-title inference is a possible later optimization.

### The bridge owns the write

The runner proposes a value; the bridge calls the Threads API. This is more
reliable than prompting the agent to execute `threads messages title` because:

- Claude Code plan mode may prohibit the required shell call.
- Pi read-only mode may not expose `bash`.
- Codex may have network-disabled shell execution.
- Tool invocation is probabilistic even when the prompt requests it.

The bridge already has the correct token, root message ID, and network access.

### Automatic updates are set-if-empty

The current title endpoint is last-write-wins. An inferred title can finish
after a user has manually named the thread, so a read-before-write check in the
bridge is insufficient: it leaves a race between the read and update.

Threads should accept an optional `if_unset` request field and enforce it in the
database update:

```json
{
  "title": "Investigate WebSocket reconnects",
  "if_unset": true
}
```

Manual title changes omit `if_unset` and retain rename behavior. Automatic
bridge updates always set it to `true`.

### Automatic titles are initially opt-in

Add this runner setting:

```json
{
  "runner": {
    "structured": true,
    "auto_title": true
  }
}
```

`auto_title` defaults to `false` for compatibility with older Threads servers
and existing plain-text runner configurations. The example scopes should
enable it after the guarded API is deployed.

The initial implementation requires `structured: true` when `auto_title` is
enabled. Config loading should reject `auto_title: true` with structured mode
disabled rather than silently posting a JSON envelope as plain text.

## New-root eligibility

`NewSession` alone is not a sufficient signal. It means the bridge has no
stored runner session, which may also happen after local state loss or during
an explicit re-invocation.

The daemon should compute a dedicated `GenerateThreadTitle` value. A run is
eligible only when all of the following are true:

- `runner.auto_title` is enabled.
- The event is a message creation event (`message.created` or the legacy
  `message` event).
- The event is not a reaction invocation.
- `event.Message.ID` equals the normalized root `threadID`.
- No runner session is stored for the root.

`message.invoked`, replies, reactions, and resumed sessions are ineligible.
Processed-event deduplication prevents a replay of the same creation event from
triggering another inference. The server-side `if_unset` guard remains the
authoritative concurrency protection.

Add the explicit signal to runner input:

```go
type Input struct {
    // Existing fields omitted.
    GenerateThreadTitle bool
}
```

## Runner contract

Extend canonical runner output:

```go
type Output struct {
    Text            string
    RunnerSessionID string
    ThreadTitle     string
    Reactions       []Reaction
}
```

Extend the structured parser with the optional JSON field:

```go
var payload struct {
    Content     string     `json:"content"`
    Text        string     `json:"text"`
    ThreadTitle string     `json:"thread_title"`
    Reactions   []Reaction `json:"reactions"`
}
```

The parser treats `thread_title` as optional even on an eligible run. A missing
or malformed title must not discard valid response content.

### Prompt

For an eligible first turn, append instructions equivalent to:

> This is a newly created Threads root message. Return a single structured JSON
> result containing the normal `content` and a `thread_title`. The title should
> describe the user's intent in 3–8 words, preferably under 60 characters. Do
> not quote it, end it with punctuation, or use a generic title such as "User
> Request." The bridge will set the title; do not call a tool to do so.

The first-turn instruction requires the JSON envelope rather than allowing the
plain-text alternative. Subsequent turns use the existing structured-output
instructions and do not request a title.

Claude Code, Pi, and Codex all receive the existing bridge instructions, so the
same contract applies to each runner. Provider-native JSON schemas can later
harden Codex and Claude Code output; Pi remains prompt-driven unless its CLI
adds an equivalent schema option.

### Validation

Before calling Threads, the bridge:

- Trims leading and trailing whitespace.
- Collapses internal whitespace runs to one space.
- Rejects an empty title.
- Rejects a title longer than 120 Unicode code points.

The server remains authoritative. It should use Unicode code-point length, such
as `Array.from(title).length`, so runtime behavior matches the OpenAPI
`maxLength` contract.

The bridge should reject an invalid model title rather than truncate it. The
normal response still proceeds.

## Threads API changes

Extend `SetThreadTitleRequest`:

```yaml
type: object
required: [title]
properties:
  title:
    type: string
    minLength: 1
    maxLength: 120
  if_unset:
    type: boolean
    default: false
additionalProperties: false
```

Extend the response with an application indicator:

```json
{
  "ok": true,
  "applied": true,
  "thread_id": "msg_root",
  "thread_title": "Investigate WebSocket reconnects",
  "thread_title_updated_at": 1784386800
}
```

The handler should:

1. Normalize the supplied message ID to the root and authorize membership.
2. Normalize and validate the title.
3. Perform one conditional update that:
   - requires `thread_title IS NULL` when `if_unset` is true; and
   - skips the update when the normalized title already matches.
4. Inspect the database change count.
5. If nothing changed, read and return the current root title with
   `applied: false`.
6. Broadcast `thread_title_updated` only when the update was applied.

This makes the caller's `idempotent` annotation accurate: repeating the same
title does not change `thread_title_updated_at` or broadcast another event.

If two automatic agents race, the first successful update wins. If a human
title exists first, both automatic updates are skipped. A later manual rename
still wins because it omits `if_unset`.

## Bridge Threads client

Add request and response types:

```go
type SetThreadTitleRequest struct {
    Title   string `json:"title"`
    IfUnset bool   `json:"if_unset,omitempty"`
}

type SetThreadTitleResponse struct {
    OK                   bool   `json:"ok"`
    Applied              bool   `json:"applied"`
    ThreadID             string `json:"thread_id"`
    ThreadTitle          string `json:"thread_title"`
    ThreadTitleUpdatedAt int64  `json:"thread_title_updated_at"`
}
```

Add:

```go
func (c Client) SetThreadTitle(
    ctx context.Context,
    messageID string,
    req SetThreadTitleRequest,
) (SetThreadTitleResponse, error)
```

The URL is `/messages/{messageID}/thread-title`.

Use a small optional daemon interface, similar to reaction support, so existing
test senders do not need unrelated methods:

```go
type ThreadTitler interface {
    SetThreadTitle(
        context.Context,
        string,
        threads.SetThreadTitleRequest,
    ) (threads.SetThreadTitleResponse, error)
}
```

## Daemon flow

For an eligible root message:

1. Compute `GenerateThreadTitle`.
2. Run the normal agent session.
3. Save the returned runner session ID.
4. If `Output.ThreadTitle` is valid, call `SetThreadTitle` for the normalized
   root ID with `IfUnset: true`.
5. Log whether the title was applied, skipped because one existed, or failed.
6. Post the normal final response.
7. Complete process status normally.

Title setting is best-effort. A title error must not:

- prevent session persistence;
- prevent reaction handling;
- prevent the final response;
- change a successful process to `error`; or
- post an error message into the user thread.

Use a non-cancelled cleanup context with the normal Threads HTTP timeout so a
completed inference can still set its title if the inbound event context is
being torn down.

## Shipped CLI

Add:

```text
threads messages title --message-id <id> --title <title> [--if-unset true]
```

Bridge-provided context:

- Base URL: `THREADS_API`
- Token: `THREADS_TOKEN`
- Root message ID: `THREADS_THREAD_ID` (pass it with `--message-id`)

`THREADS_THREAD_ID` is preferred over `THREADS_MESSAGE_ID` because it is already
normalized to the root. The API accepts either value, so `--message` and
`--message-id` aliases can still target a reply.

Examples:

```bash
threads messages title --message-id "$THREADS_THREAD_ID" --title "Investigate WebSocket reconnects"
threads messages title --message-id msg_123 --title "Release v2 follow-ups"
threads messages title --message-id "$THREADS_THREAD_ID" --title "Investigate WebSocket reconnects" --if-unset true
```

The command is useful for explicit agent actions and scripts. Automatic title
generation does not instruct the runner to call it.

## Failure behavior

| Condition | Title result | Final response |
| --- | --- | --- |
| Runner returns valid structured title | Bridge attempts guarded update | Posted normally |
| Runner returns plain text or omits title | No update | Posted normally |
| Runner returns malformed JSON | Existing parser fallback applies; no title | Posted when recoverable |
| Title is empty or too long | No update; debug/warn log | Posted normally |
| Threads returns `applied: false` | Existing title preserved | Posted normally |
| Threads endpoint returns 400/403/404/5xx | Warning log | Posted normally |
| Runner fails or is killed | No title update | Existing error/kill behavior |

## Observability

Use structured logs with:

- scope ID;
- Threads channel and root thread IDs;
- runner type;
- outcome: `applied`, `existing`, `missing`, `invalid`, or `error`; and
- API error when present.

Do not log the API token. Logging the generated title should be debug-level
because titles may contain private message context.

No visible progress/tool-output message is emitted solely for title generation.
The websocket title event provides the UI update.

## Security and privacy

- The title is model-generated, untrusted text. Validate length and rely on the
  Threads client to render it as escaped text.
- The runner does not receive additional credentials for this feature.
- The bridge performs the write with the same bot token already scoped to the
  routed runner.
- Threads membership authorization remains the final access check.
- The model is asked to summarize only the current user request; the title
  prompt should not include hidden runner instructions or tool output.

## Testing

### Threads API

- Sets a title through a root ID and a reply ID.
- `if_unset: true` applies to an untitled root.
- `if_unset: true` preserves an existing human title.
- Repeating an identical title is a no-op with the original timestamp.
- A skipped update does not broadcast.
- A successful update broadcasts once.
- Empty, oversized, and Unicode-boundary titles follow the OpenAPI contract.
- Non-members and deleted/unknown roots are rejected.

### Runner

- Parses `thread_title` without changing response content or reactions.
- Plain-text and legacy structured outputs remain compatible.
- New-root prompt requests a title for Claude Code, Pi, and Codex.
- Reply, reaction, retry, and resume prompts do not request a title.
- Invalid titles are ignored without losing the final response.

### Daemon

- Sets a title once for an eligible root message.
- Uses the normalized root ID and `IfUnset: true`.
- Does not set titles for replies, reactions, or `message.invoked`.
- Preserves a successful final response when title setting fails.
- Handles `applied: false` as a successful no-op.
- Event replay does not cause another runner call or title update.

### CLI

- Reads the default root ID and credentials from the environment.
- Supports explicit `--message-id` and `--if-unset`.
- Sends the expected request and prints applied/skipped status.
- Rejects missing credentials, message ID, and title.

## Rollout

1. Deploy the Threads `if_unset` and idempotent no-op API behavior.
2. Add the bridge client method and canonical `threads messages title` action.
3. Add the runner output field, prompt, and daemon-side guarded update.
4. Add `auto_title: true` to example configurations.
5. Enable it for one scope of each runner type and observe missing/invalid/error
   outcomes.
6. Consider making automatic titles the default in a later bridge release once
   supported Threads server versions are ubiquitous.

## Alternatives considered

### Prompt the agent to run `threads messages title`

This is simple but unreliable across runner safety modes and makes an optional
tool call responsible for product metadata. Keep it as an explicit capability,
not the automatic mechanism.

### Run a dedicated title inference concurrently

This produces an earlier title but adds cost, quota usage, cancellation logic,
and provider-specific no-tool/ephemeral invocation flags. Revisit if waiting for
the first response creates a material UX problem.

### Derive a title without inference

Using the first line or truncating the user message is cheap but performs poorly
for long prompts, pasted logs, and requests whose intent is not stated first.
It can be retained as a future deterministic fallback, but should not overwrite
a human title.

## Completion criteria

- A new root handled by Claude Code, Pi, or Codex receives at most one inferred
  title without an extra inference request.
- A human or previously set title is never overwritten by automatic behavior.
- Replies and re-invocations do not retitle the thread.
- Title failures never suppress a successful agent response.
- Manual renaming remains available in Threads and through the shipped CLI.
- Existing configurations and plain-text runner outputs remain compatible.

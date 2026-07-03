package runner

import (
	"bytes"
	"context"
	"reflect"
	"strings"
	"testing"

	"github.com/danielcorin/threads-agent-bridge/internal/config"
	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

func TestParseStructuredOutput(t *testing.T) {
	out := parseStructuredOutput(Output{Text: `{"content":"Done","reactions":[{"message_id":"m1","emoji":"✅"},{"message_id":"","emoji":"❌"}]}`})
	if out.Text != "Done" || len(out.Reactions) != 1 || out.Reactions[0].MessageID != "m1" || out.Reactions[0].Emoji != "✅" {
		t.Fatalf("bad structured output: %+v", out)
	}
}

func TestParseJSONLText(t *testing.T) {
	got := parseJSONLText([]byte("{\"type\":\"x\",\"text\":\"hello\"}\nnot-json\n{\"content\":\"world\"}\n"))
	if got != "hello\nworld" {
		t.Fatalf("got %q", got)
	}
}

func TestParseClaudeStreamJSONTextPrefersFinalResult(t *testing.T) {
	got := parseJSONLText([]byte("{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"hello\"}]}}\n{\"type\":\"result\",\"result\":\"final\"}\n"))
	if got != "final" {
		t.Fatalf("got %q", got)
	}
}

func TestParseToolEventsFromClaudeStreamJSON(t *testing.T) {
	event, ok := parseToolEvent([]byte(`{"type":"assistant","message":{"content":[{"type":"tool_use","id":"toolu_1","name":"Bash","input":{"command":"git status"}}]}}`))
	if !ok || event.ID != "toolu_1" || event.Name != "Bash" || event.Status != ToolEventStarted {
		t.Fatalf("bad claude tool event: ok=%v event=%+v", ok, event)
	}
	completed, ok := parseToolEvent([]byte(`{"type":"user","message":{"content":[{"tool_use_id":"toolu_1","type":"tool_result","content":"ok","is_error":false}]}}`))
	if !ok || completed.ID != "toolu_1" || completed.Status != ToolEventCompleted || completed.Output != "ok" || completed.Error {
		t.Fatalf("bad claude tool result event: ok=%v event=%+v", ok, completed)
	}
}

func TestScanRunnerOutputHandlesLongClaudeStreamJSONLines(t *testing.T) {
	longContent := strings.Repeat("x", 128*1024)
	line := `{"type":"assistant","message":{"content":[{"type":"tool_use","id":"toolu_long","name":"Bash","input":{"command":"` + longContent + `"}}]}}` + "\n"
	var buf bytes.Buffer
	var got []ToolEvent
	if err := scanRunnerOutput(context.Background(), strings.NewReader(line), &buf, func(ctx context.Context, event ToolEvent) error {
		got = append(got, event)
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	if buf.String() != line {
		t.Fatalf("output was not preserved")
	}
	if len(got) != 1 || got[0].Name != "Bash" || got[0].ID != "toolu_long" {
		t.Fatalf("bad events: %+v", got)
	}
}

func TestParseJSONLOutputHandlesLongLines(t *testing.T) {
	longText := strings.Repeat("x", 128*1024)
	got := parseJSONLText([]byte(`{"type":"result","result":"` + longText + `"}` + "\n"))
	if got != longText {
		t.Fatalf("got len %d want %d", len(got), len(longText))
	}
}

func TestScanRunnerOutputFillsClaudeToolResultName(t *testing.T) {
	input := strings.NewReader(`{"type":"assistant","message":{"content":[{"type":"tool_use","id":"toolu_1","name":"Bash","input":{"command":"pwd"}}]}}
{"type":"user","message":{"content":[{"tool_use_id":"toolu_1","type":"tool_result","content":"ok","is_error":false}]}}
`)
	var got []ToolEvent
	var buf bytes.Buffer
	err := scanRunnerOutput(context.Background(), input, &buf, func(ctx context.Context, event ToolEvent) error {
		got = append(got, event)
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 || got[0].Name != "Bash" || got[1].Name != "Bash" || got[1].Status != ToolEventCompleted || got[1].Output != "ok" {
		t.Fatalf("bad events: %+v", got)
	}
}

func TestParseLimitEventsFromCodexJSON(t *testing.T) {
	event, ok := parseLimitEvent([]byte(`{"type":"token_count","rate_limits":{"primary":{"used_percent":94,"resets_at":1777830669},"secondary":{"used_percent":15},"plan_type":"pro"}}`))
	if !ok || event.Source != "codex" || event.Severity != "warning" || !strings.Contains(event.Message, "primary 94% used") {
		t.Fatalf("bad codex limit event: ok=%v event=%+v", ok, event)
	}
}

func TestParseLimitEventsFromPiJSON(t *testing.T) {
	event, ok := parseLimitEvent([]byte(`{"type":"message","message":{"role":"assistant","provider":"openrouter","model":"gpt-5.1-codex","usage":{"totalTokens":0},"stopReason":"error","errorMessage":"429 Usage limit reached for 5 hour"}}`))
	if !ok || event.Source != "pi" || event.Severity != "error" || !strings.Contains(event.Message, "429 Usage limit reached") {
		t.Fatalf("bad pi limit event: ok=%v event=%+v", ok, event)
	}
}

func TestParseLimitEventsFromClaudeJSON(t *testing.T) {
	event, ok := parseLimitEvent([]byte(`{"type":"rate_limit_event","message":"Claude usage limit reached; resets at 5pm"}`))
	if !ok || event.Source != "claude-code" || event.Severity != "warning" || !strings.Contains(event.Message, "usage limit") {
		t.Fatalf("bad claude limit event: ok=%v event=%+v", ok, event)
	}
}

func TestScanRunnerOutputEmitsDedupedLimitEvents(t *testing.T) {
	input := strings.NewReader(`{"type":"token_count","rate_limits":{"primary":{"used_percent":94},"secondary":{"used_percent":15}}}
{"type":"token_count","rate_limits":{"primary":{"used_percent":94},"secondary":{"used_percent":15}}}
`)
	var got []LimitEvent
	var buf bytes.Buffer
	err := scanRunnerOutput(context.Background(), input, &buf, nil, func(ctx context.Context, event LimitEvent) error {
		got = append(got, event)
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0].Source != "codex" {
		t.Fatalf("bad limit events: %+v", got)
	}
}

func TestScanRunnerOutputEmitsLimitEventsForSupportedRunners(t *testing.T) {
	input := strings.NewReader(`{"type":"rate_limit_event","message":"Claude usage limit reached; resets at 5pm"}
{"type":"token_count","rate_limits":{"primary":{"used_percent":100},"rate_limit_reached_type":"primary"}}
{"type":"message","message":{"role":"assistant","provider":"openrouter","model":"gpt-5.1-codex","usage":{"totalTokens":0},"stopReason":"error","errorMessage":"429 Usage limit reached for 5 hour"}}
`)
	var got []LimitEvent
	var buf bytes.Buffer
	err := scanRunnerOutput(context.Background(), input, &buf, nil, func(ctx context.Context, event LimitEvent) error {
		got = append(got, event)
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	want := []struct {
		source   string
		severity string
	}{
		{source: "claude-code", severity: "warning"},
		{source: "codex", severity: "error"},
		{source: "pi", severity: "error"},
	}
	if len(got) != len(want) {
		t.Fatalf("got %d limit events: %+v", len(got), got)
	}
	for i := range want {
		if got[i].Source != want[i].source || got[i].Severity != want[i].severity || got[i].Message == "" {
			t.Fatalf("event %d = %+v, want source=%s severity=%s", i, got[i], want[i].source, want[i].severity)
		}
	}
}

func TestParseToolEventsFromCodexJSON(t *testing.T) {
	started, ok := parseToolEvent([]byte(`{"type":"item.started","item":{"type":"command_execution","id":"item_0","command":"/bin/zsh -lc pwd","status":"in_progress"}}`))
	if !ok || started.ID != "item_0" || started.Name != "shell" || started.Status != ToolEventStarted || started.Input != "/bin/zsh -lc pwd" {
		t.Fatalf("bad codex start event: ok=%v event=%+v", ok, started)
	}
	completed, ok := parseToolEvent([]byte(`{"type":"item.completed","item":{"type":"command_execution","id":"item_0","command":"/bin/zsh -lc pwd","exit_code":0,"status":"completed"}}`))
	if !ok || completed.ID != "item_0" || completed.Name != "shell" || completed.Status != ToolEventCompleted {
		t.Fatalf("bad codex completed event: ok=%v event=%+v", ok, completed)
	}
}

func TestParseJSONLOutputCapturesSessionIDs(t *testing.T) {
	codex := parseJSONLOutput([]byte("{\"type\":\"thread.started\",\"thread_id\":\"codex-session\"}\n{\"type\":\"item.completed\",\"item\":{\"type\":\"agent_message\",\"text\":\"done\"}}\n"))
	if codex.Text != "done" || codex.SessionID != "codex-session" {
		t.Fatalf("bad codex parse: %+v", codex)
	}
	claude := parseJSONLOutput([]byte("{\"type\":\"system\",\"session_id\":\"claude-session\"}\n{\"type\":\"result\",\"result\":\"final\",\"session_id\":\"claude-session\"}\n"))
	if claude.Text != "final" || claude.SessionID != "claude-session" {
		t.Fatalf("bad claude parse: %+v", claude)
	}
	pi := parseJSONLOutput([]byte("{\"type\":\"header\",\"sessionFile\":\"/tmp/pi/session.jsonl\"}\n{\"type\":\"agent_end\",\"messages\":[{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"pi final\"}]}]}\n"))
	if pi.Text != "pi final" || pi.SessionID != "/tmp/pi/session.jsonl" {
		t.Fatalf("bad pi parse: %+v", pi)
	}
}

func TestParseJSONLOutputIgnoresPiUserMessages(t *testing.T) {
	got := parseJSONLText([]byte("{\"type\":\"message_start\",\"message\":{\"role\":\"user\",\"content\":[{\"type\":\"text\",\"text\":\"bridge instructions should not be posted\"}]}}\n{\"type\":\"agent_end\",\"messages\":[{\"role\":\"user\",\"content\":[{\"type\":\"text\",\"text\":\"bridge instructions should not be posted\"}]},{\"role\":\"assistant\",\"content\":[{\"type\":\"text\",\"text\":\"real answer\"}]}]}\n"))
	if got != "real answer" {
		t.Fatalf("got %q", got)
	}
}

func TestParseJSONLOutputDoesNotFallbackToRawPiEvents(t *testing.T) {
	parsed := parseJSONLOutput([]byte("{\"type\":\"session\",\"id\":\"pi-session\",\"cwd\":\"/tmp\"}\n{\"type\":\"agent_start\"}\n{\"type\":\"turn_start\"}\n{\"type\":\"message_start\",\"message\":{\"role\":\"user\",\"content\":[{\"type\":\"text\",\"text\":\"Hey react with an emoji only please\"}]}}\n{\"type\":\"message_end\",\"message\":{\"role\":\"user\",\"content\":[{\"type\":\"text\",\"text\":\"Hey react with an emoji only please\"}]}}\n"))
	if !parsed.SawJSON || parsed.Text != "" || parsed.SessionID != "pi-session" {
		t.Fatalf("bad parsed output: %+v", parsed)
	}
}

func TestParsePiSessionHeaderAndStringContent(t *testing.T) {
	parsed := parseJSONLOutput([]byte("{\"type\":\"session\",\"id\":\"pi-session\",\"cwd\":\"/tmp\"}\n{\"type\":\"message_end\",\"message\":{\"role\":\"assistant\",\"content\":\"string answer\"}}\n"))
	if parsed.Text != "string answer" || parsed.SessionID != "pi-session" {
		t.Fatalf("bad pi parse: %+v", parsed)
	}
}

func TestParseToolEventsFromPiJSON(t *testing.T) {
	started, ok := parseToolEvent([]byte(`{"type":"tool_execution_start","toolCallId":"call_1","toolName":"bash","args":{"command":"pwd"}}`))
	if !ok || started.ID != "call_1" || started.Name != "bash" || started.Status != ToolEventStarted {
		t.Fatalf("bad pi start event: ok=%v event=%+v", ok, started)
	}
	completed, ok := parseToolEvent([]byte(`{"type":"tool_execution_end","toolCallId":"call_1","toolName":"bash","result":{"content":[{"type":"text","text":"ok"}]},"isError":false}`))
	if !ok || completed.ID != "call_1" || completed.Name != "bash" || completed.Status != ToolEventCompleted || completed.Error {
		t.Fatalf("bad pi end event: ok=%v event=%+v", ok, completed)
	}
}

func TestParsePiMessageUpdateToolCallEvents(t *testing.T) {
	started, ok := parseToolEvent([]byte(`{"type":"message_update","message":{"role":"assistant","content":[{"type":"toolCall","id":"call_2","name":"bash","arguments":{"command":"pwd"}}]},"assistantMessageEvent":{"type":"toolcall_start","contentIndex":0,"partial":{"role":"assistant","content":[{"type":"toolCall","id":"call_2","name":"bash","arguments":{"command":"pwd"}}]}}}`))
	if !ok || started.ID != "call_2" || started.Name != "bash" || started.Status != ToolEventStarted {
		t.Fatalf("bad pi message_update start event: ok=%v event=%+v", ok, started)
	}
	completed, ok := parseToolEvent([]byte(`{"type":"message_update","assistantMessageEvent":{"type":"toolcall_end","contentIndex":0,"toolCall":{"type":"toolCall","id":"call_2","name":"bash","arguments":{"command":"pwd"}}}}`))
	if !ok || completed.ID != "call_2" || completed.Name != "bash" || completed.Status != ToolEventCompleted {
		t.Fatalf("bad pi message_update end event: ok=%v event=%+v", ok, completed)
	}
}

func TestParseCodexFallbackUsesLastAgentMessage(t *testing.T) {
	got := parseJSONLText([]byte("{\"type\":\"item.completed\",\"item\":{\"type\":\"agent_message\",\"text\":\"first progress chunk\"}}\n{\"type\":\"item.completed\",\"item\":{\"type\":\"command_execution\",\"command\":\"threads send --content update\"}}\n{\"type\":\"item.completed\",\"item\":{\"type\":\"agent_message\",\"text\":\"final summary\"}}\n"))
	if got != "final summary" {
		t.Fatalf("got %q", got)
	}
}

func TestBuildClaudeArgs(t *testing.T) {
	scope := config.Scope{Runner: config.RunnerConfig{Type: "claude-code", Args: []string{"-p", "--verbose", "--output-format", "stream-json"}}, Safety: config.SafetyConfig{Mode: "read-only", AllowedTools: []string{"Read", "Bash(git status:*)"}}}
	got := buildArgs(scope, "")
	want := []string{"-p", "--verbose", "--output-format", "stream-json", "--permission-mode", "plan", "--allowedTools", "Read,Bash(git status:*)"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v", got)
	}
}

func TestBuildAutoPermissionArgs(t *testing.T) {
	codex := config.Scope{Runner: config.RunnerConfig{Type: "codex", Args: []string{"exec", "--json"}}, Safety: config.SafetyConfig{Mode: "auto"}}
	if got, want := buildArgs(codex, ""), []string{"exec", "--json", "--sandbox", "workspace-write", "-c", "approval_policy=\"never\"", "-c", "sandbox_workspace_write.network_access=true"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("codex auto args got %#v want %#v", got, want)
	}
	claude := config.Scope{Runner: config.RunnerConfig{Type: "claude-code", Args: []string{"-p", "--verbose", "--output-format", "stream-json"}}, Safety: config.SafetyConfig{Mode: "auto"}}
	if got, want := buildArgs(claude, ""), []string{"-p", "--verbose", "--output-format", "stream-json", "--permission-mode", "auto"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("claude auto args got %#v want %#v", got, want)
	}
}

func TestBuildResumeArgs(t *testing.T) {
	codex := config.Scope{Runner: config.RunnerConfig{Type: "codex", Args: []string{"exec", "--json"}}, Safety: config.SafetyConfig{Mode: "read-only"}}
	if got, want := buildArgs(codex, "codex-session"), []string{"exec", "--sandbox", "read-only", "resume", "--json", "codex-session", "-"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("codex args got %#v want %#v", got, want)
	}
	claude := config.Scope{Runner: config.RunnerConfig{Type: "claude-code", Args: []string{"-p", "--verbose", "--output-format", "stream-json"}}}
	if got, want := buildArgs(claude, "claude-session"), []string{"-p", "--verbose", "--output-format", "stream-json", "--resume", "claude-session"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("claude args got %#v want %#v", got, want)
	}
	pi := config.Scope{Runner: config.RunnerConfig{Type: "pi", Args: []string{"--mode", "json", "--print"}}, Safety: config.SafetyConfig{Mode: "read-only"}}
	if got, want := buildArgs(pi, "/tmp/pi/session.jsonl"), []string{"--mode", "json", "--print", "--tools", "read,grep,find,ls", "--session", "/tmp/pi/session.jsonl"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("pi args got %#v want %#v", got, want)
	}
}

func TestBuildPromptDocumentsThreadsSendAsInterimOnly(t *testing.T) {
	prompt := buildPrompt(config.Scope{}, Input{Event: threads.Event{Message: threads.Message{Content: "ship it"}}})
	if !strings.Contains(prompt, "threads send --content") || !strings.Contains(prompt, "threads react") || !strings.Contains(prompt, "still write your final answer to stdout") || !strings.Contains(prompt, "ship it") {
		t.Fatalf("prompt missing CLI contract: %q", prompt)
	}
}

func TestBuildRunnerPromptPassesClaudeSlashCommandRaw(t *testing.T) {
	scope := config.Scope{Runner: config.RunnerConfig{Type: "claude-code"}}
	prompt, handling := buildRunnerPrompt(scope, Input{Event: threads.Event{Message: threads.Message{Content: " /compact "}}})
	if handling.UnsupportedMessage != "" || prompt != "/compact\n" {
		t.Fatalf("got prompt %q handling %+v", prompt, handling)
	}
}

func TestBuildRunnerPromptRejectsUnsupportedSlashCommands(t *testing.T) {
	input := Input{Event: threads.Event{Message: threads.Message{Content: "/compact"}}}
	for _, runnerType := range []string{"codex", "pi"} {
		prompt, handling := buildRunnerPrompt(config.Scope{Runner: config.RunnerConfig{Type: runnerType}}, input)
		if prompt != "" || !strings.Contains(handling.UnsupportedMessage, "/compact is not supported") {
			t.Fatalf("%s got prompt %q handling %+v", runnerType, prompt, handling)
		}
	}
}

func TestBuildRunnerPromptDoesNotTreatMultilineSlashAsNativeCommand(t *testing.T) {
	scope := config.Scope{Runner: config.RunnerConfig{Type: "claude-code"}}
	prompt, handling := buildRunnerPrompt(scope, Input{Event: threads.Event{Message: threads.Message{Content: "/compact\nplease explain"}}})
	if handling.UnsupportedMessage != "" || !strings.Contains(prompt, "User message:\n/compact\nplease explain") {
		t.Fatalf("got prompt %q handling %+v", prompt, handling)
	}
}

func TestPiPromptSeparatesBridgeInstructionsFromUserPrompt(t *testing.T) {
	input := Input{Event: threads.Event{Message: threads.Message{Content: "Please react to this message"}}}
	instructions := buildBridgeInstructions(config.Scope{}, input)
	userPrompt := buildUserPrompt(input)
	if !strings.Contains(instructions, "Threads agent bridge session") || strings.Contains(instructions, "Please react to this message") {
		t.Fatalf("bad bridge instructions: %q", instructions)
	}
	if strings.Contains(userPrompt, "Threads agent bridge session") || !strings.Contains(userPrompt, "Please react to this message") {
		t.Fatalf("bad user prompt: %q", userPrompt)
	}
}

func TestAgentEnvInjectsThreadsContext(t *testing.T) {
	old := environ
	defer func() { environ = old }()
	environ = func() []string { return []string{"PATH=/bin"} }
	scope := config.Scope{ID: "s1", Threads: config.ThreadsConfig{BaseURL: "http://threads", Token: "tok"}, Runner: config.RunnerConfig{WorkingDir: "/workspace"}}
	event := threads.Event{ChannelID: "ch1", ThreadID: "ignored-reply-id", Message: threads.Message{ID: "m1"}}
	got := agentEnv(scope, Input{ScopeID: "s1", Event: event, ThreadID: "root-thread", RunnerSessionID: "runner-session"})
	wantContains := []string{"PATH=/workspace/bin:/bin", "THREADS_BASE_URL=http://threads", "THREADS_API_TOKEN=tok", "THREADS_CHANNEL_ID=ch1", "THREADS_THREAD_ID=root-thread", "THREADS_MESSAGE_ID=m1", "THREADS_SCOPE_ID=s1", "THREADS_RUNNER_SESSION_ID=runner-session"}
	for _, want := range wantContains {
		found := false
		for _, value := range got {
			if value == want {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("missing %q in %#v", want, got)
		}
	}
}

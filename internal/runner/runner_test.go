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
}

func TestBuildPromptDocumentsThreadsSendAsInterimOnly(t *testing.T) {
	prompt := buildPrompt(Input{Event: threads.Event{Message: threads.Message{Content: "ship it"}}})
	if !strings.Contains(prompt, "threads send --content") || !strings.Contains(prompt, "still write your final answer to stdout") || !strings.Contains(prompt, "ship it") {
		t.Fatalf("prompt missing CLI contract: %q", prompt)
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

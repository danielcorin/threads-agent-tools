package runner

import (
	"reflect"
	"strings"
	"testing"

	"github.com/danielcorin/threads-agent-bridge/internal/config"
	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

func TestParseJSONLText(t *testing.T) {
	got := parseJSONLText([]byte("{\"type\":\"x\",\"text\":\"hello\"}\nnot-json\n{\"content\":\"world\"}\n{\"type\":\"item.completed\",\"item\":{\"type\":\"agent_message\",\"text\":\"done\"}}\n"))
	if got != "hello\nworld\ndone" {
		t.Fatalf("got %q", got)
	}
}

func TestParseClaudeStreamJSONTextPrefersFinalResult(t *testing.T) {
	got := parseJSONLText([]byte("{\"type\":\"assistant\",\"message\":{\"content\":[{\"type\":\"text\",\"text\":\"hello\"}]}}\n{\"type\":\"result\",\"result\":\"final\"}\n"))
	if got != "final" {
		t.Fatalf("got %q", got)
	}
}

func TestBuildClaudeArgs(t *testing.T) {
	scope := config.Scope{Runner: config.RunnerConfig{Type: "claude-code", Args: []string{"-p", "--verbose", "--output-format", "stream-json"}}, Safety: config.SafetyConfig{Mode: "read-only", AllowedTools: []string{"Read", "Bash(git status:*)"}}}
	got := buildArgs(scope)
	want := []string{"-p", "--verbose", "--output-format", "stream-json", "--permission-mode", "plan", "--allowedTools", "Read,Bash(git status:*)"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("got %#v", got)
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
	scope := config.Scope{ID: "s1", Threads: config.ThreadsConfig{BaseURL: "http://threads", Token: "tok"}}
	event := threads.Event{ChannelID: "ch1", ThreadID: "th1", Message: threads.Message{ID: "m1"}}
	got := agentEnv(scope, Input{ScopeID: "s1", Event: event})
	wantContains := []string{"PATH=/bin", "THREADS_BASE_URL=http://threads", "THREADS_API_TOKEN=tok", "THREADS_CHANNEL_ID=ch1", "THREADS_THREAD_ID=th1", "THREADS_MESSAGE_ID=m1", "THREADS_SCOPE_ID=s1"}
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

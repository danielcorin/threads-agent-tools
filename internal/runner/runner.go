package runner

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"strings"

	"github.com/danielcorin/threads-agent-bridge/internal/config"
	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

type Input struct {
	ScopeID string
	Event   threads.Event
}

type Output struct{ Text string }

type Runner interface {
	Run(context.Context, config.Scope, Input) (Output, error)
}

type LocalRunner struct{}

func (LocalRunner) Run(ctx context.Context, scope config.Scope, input Input) (Output, error) {
	args := buildArgs(scope)
	cmd := exec.CommandContext(ctx, scope.Runner.Command, args...)
	if scope.Runner.WorkingDir != "" {
		cmd.Dir = scope.Runner.WorkingDir
	}
	cmd.Env = agentEnv(scope, input)
	prompt := buildPrompt(input)
	cmd.Stdin = strings.NewReader(prompt)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		if stderr.Len() > 0 {
			return Output{}, errWithStderr{err: err, stderr: stderr.String()}
		}
		return Output{}, err
	}
	text := parseJSONLText(stdout.Bytes())
	if text == "" {
		text = strings.TrimSpace(stdout.String())
	}
	return Output{Text: text}, nil
}

func buildArgs(scope config.Scope) []string {
	args := append([]string{}, scope.Runner.Args...)
	if scope.Runner.Type == "claude-code" {
		return buildClaudeArgs(args, scope.Safety)
	}
	return buildCodexArgs(args, scope.Safety)
}

func buildCodexArgs(args []string, safety config.SafetyConfig) []string {
	switch safety.Mode {
	case "", "suggest":
		return args
	case "yolo":
		return append(args, "--dangerously-bypass-approvals-and-sandbox")
	case "read-only", "workspace-write", "danger-full-access":
		return append(args, "--sandbox", safety.Mode)
	default:
		// Unknown modes are deliberately ignored; users can pass exact runner flags in runner.args.
		return args
	}
}

func buildClaudeArgs(args []string, safety config.SafetyConfig) []string {
	switch safety.Mode {
	case "yolo", "danger-full-access":
		args = append(args, "--dangerously-skip-permissions")
	case "read-only", "plan":
		args = append(args, "--permission-mode", "plan")
	case "workspace-write", "accept-edits":
		args = append(args, "--permission-mode", "acceptEdits")
	case "", "suggest":
		// Keep Claude Code's default permission mode.
	default:
		// Unknown modes are deliberately ignored; users can pass exact runner flags in runner.args.
	}
	if len(safety.AllowedTools) > 0 {
		args = append(args, "--allowedTools", strings.Join(safety.AllowedTools, ","))
	}
	return args
}

func buildPrompt(input Input) string {
	var b strings.Builder
	b.WriteString("You are running inside a Threads agent bridge session.\n")
	b.WriteString("The current Threads context is available in environment variables: THREADS_BASE_URL, THREADS_API_TOKEN, THREADS_CHANNEL_ID, THREADS_THREAD_ID, THREADS_MESSAGE_ID, and THREADS_SCOPE_ID.\n")
	b.WriteString("If useful, send interim progress or artifact messages before your final answer with: threads send --content \"...\".\n")
	b.WriteString("Treat `threads send` as a side effect only; still write your final answer to stdout when finished so the bridge can post the final response.\n\n")
	b.WriteString("User message:\n")
	b.WriteString(strings.TrimSpace(input.Event.Message.Content))
	b.WriteString("\n")
	return b.String()
}

func agentEnv(scope config.Scope, input Input) []string {
	env := append([]string{}, environ()...)
	add := func(key, value string) {
		if value != "" {
			env = append(env, key+"="+value)
		}
	}
	token, _ := scope.Token()
	add("THREADS_BASE_URL", scope.Threads.BaseURL)
	add("THREADS_API_TOKEN", token)
	add("THREADS_CHANNEL_ID", input.Event.ChannelID)
	add("THREADS_THREAD_ID", input.Event.ThreadID)
	add("THREADS_MESSAGE_ID", input.Event.Message.ID)
	add("THREADS_SCOPE_ID", input.ScopeID)
	return env
}

var environ = os.Environ

type errWithStderr struct {
	err    error
	stderr string
}

func (e errWithStderr) Error() string { return e.err.Error() + ": " + e.stderr }
func (e errWithStderr) Unwrap() error { return e.err }

func parseJSONLText(data []byte) string {
	var parts, results []string
	s := bufio.NewScanner(bytes.NewReader(data))
	for s.Scan() {
		line := bytes.TrimSpace(s.Bytes())
		if len(line) == 0 {
			continue
		}
		var obj map[string]any
		if err := json.Unmarshal(line, &obj); err != nil {
			continue
		}
		if value, ok := obj["result"].(string); ok && strings.TrimSpace(value) != "" {
			results = append(results, strings.TrimSpace(value))
			continue
		}
		if item, ok := obj["item"].(map[string]any); ok && item["type"] == "agent_message" {
			if value, ok := item["text"].(string); ok && strings.TrimSpace(value) != "" {
				parts = append(parts, strings.TrimSpace(value))
				continue
			}
		}
		if message, ok := obj["message"].(map[string]any); ok {
			if content, ok := message["content"].([]any); ok {
				before := len(parts)
				for _, part := range content {
					partObj, ok := part.(map[string]any)
					if !ok || partObj["type"] != "text" {
						continue
					}
					if value, ok := partObj["text"].(string); ok && strings.TrimSpace(value) != "" {
						parts = append(parts, strings.TrimSpace(value))
					}
				}
				if len(parts) > before {
					continue
				}
			}
		}
		for _, key := range []string{"text", "content", "message", "output"} {
			if value, ok := obj[key].(string); ok && strings.TrimSpace(value) != "" {
				parts = append(parts, strings.TrimSpace(value))
				break
			}
		}
	}
	if len(results) > 0 {
		return strings.Join(results, "\n")
	}
	return strings.Join(parts, "\n")
}

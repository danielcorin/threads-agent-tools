package runner

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"io"
	"os"
	"os/exec"
	"strings"

	"github.com/danielcorin/threads-agent-bridge/internal/config"
	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

type Input struct {
	ScopeID         string
	Event           threads.Event
	ThreadID        string
	RunnerSessionID string
	NewSession      bool
	OnToolEvent     ToolEventHandler
}

type Output struct {
	Text            string
	RunnerSessionID string
}

type ToolEventStatus string

const (
	ToolEventStarted   ToolEventStatus = "started"
	ToolEventCompleted ToolEventStatus = "completed"
)

type ToolEvent struct {
	ID     string
	Name   string
	Input  any
	Output any
	Status ToolEventStatus
	Error  bool
}

type ToolEventHandler func(context.Context, ToolEvent) error

type Runner interface {
	Run(context.Context, config.Scope, Input) (Output, error)
}

type LocalRunner struct{}

func (LocalRunner) Run(ctx context.Context, scope config.Scope, input Input) (Output, error) {
	args := buildArgs(scope, input.RunnerSessionID)
	cmd := exec.CommandContext(ctx, scope.Runner.Command, args...)
	if scope.Runner.WorkingDir != "" {
		cmd.Dir = scope.Runner.WorkingDir
	}
	cmd.Env = agentEnv(scope, input)
	prompt := buildPrompt(input)
	cmd.Stdin = strings.NewReader(prompt)
	var stdout, stderr bytes.Buffer
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return Output{}, err
	}
	cmd.Stderr = &stderr
	if err := cmd.Start(); err != nil {
		return Output{}, err
	}
	scanErr := scanRunnerOutput(ctx, stdoutPipe, &stdout, input.OnToolEvent)
	if err := cmd.Wait(); err != nil {
		if stderr.Len() > 0 {
			return Output{}, errWithStderr{err: err, stderr: stderr.String()}
		}
		return Output{}, err
	}
	if scanErr != nil {
		return Output{}, scanErr
	}
	parsed := parseJSONLOutput(stdout.Bytes())
	if parsed.Text == "" {
		parsed.Text = strings.TrimSpace(stdout.String())
	}
	return Output{Text: parsed.Text, RunnerSessionID: parsed.SessionID}, nil
}

func buildArgs(scope config.Scope, sessionID string) []string {
	args := append([]string{}, scope.Runner.Args...)
	if scope.Runner.Type == "claude-code" {
		return buildClaudeArgs(args, scope.Safety, sessionID)
	}
	return buildCodexArgs(args, scope.Safety, sessionID)
}

func buildCodexArgs(args []string, safety config.SafetyConfig, sessionID string) []string {
	resume := sessionID != "" && len(args) > 0 && args[0] == "exec"
	if !resume {
		return appendCodexSafetyArgs(args, safety)
	}
	resumeArgs := appendCodexSafetyArgs([]string{"exec"}, safety)
	resumeArgs = append(resumeArgs, "resume")
	resumeArgs = append(resumeArgs, args[1:]...)
	return append(resumeArgs, sessionID, "-")
}

func appendCodexSafetyArgs(args []string, safety config.SafetyConfig) []string {
	switch safety.Mode {
	case "", "suggest":
		return args
	case "auto":
		return append(args, "--sandbox", "workspace-write", "-c", "approval_policy=\"never\"", "-c", "sandbox_workspace_write.network_access=true")
	case "yolo":
		return append(args, "--dangerously-bypass-approvals-and-sandbox")
	case "read-only", "workspace-write", "danger-full-access":
		return append(args, "--sandbox", safety.Mode)
	default:
		// Unknown modes are deliberately ignored; users can pass exact runner flags in runner.args.
		return args
	}
}

func buildClaudeArgs(args []string, safety config.SafetyConfig, sessionID string) []string {
	switch safety.Mode {
	case "yolo", "danger-full-access":
		args = append(args, "--dangerously-skip-permissions")
	case "auto":
		args = append(args, "--permission-mode", "auto")
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
	if sessionID != "" {
		args = append(args, "--resume", sessionID)
	}
	return args
}

func buildPrompt(input Input) string {
	var b strings.Builder
	b.WriteString("You are running inside a Threads agent bridge session.\n")
	if input.NewSession {
		b.WriteString("This is the first turn for this Threads root message; treat it as a new agent conversation.\n")
	} else {
		b.WriteString("This is a reply in an existing Threads thread; continue the existing agent conversation/session.\n")
	}
	b.WriteString("The current Threads context is available in environment variables: THREADS_BASE_URL, THREADS_API_TOKEN, THREADS_CHANNEL_ID, THREADS_THREAD_ID, THREADS_MESSAGE_ID, THREADS_SCOPE_ID, and THREADS_RUNNER_SESSION_ID.\n")
	b.WriteString("If useful, send interim progress or artifact messages before your final answer with: threads send --content \"...\".\n")
	b.WriteString("Treat `threads send` as a side effect only; still write your final answer to stdout when finished so the bridge can post the final response.\n\n")
	b.WriteString("User message:\n")
	b.WriteString(strings.TrimSpace(input.Event.Message.Content))
	b.WriteString("\n")
	return b.String()
}

func agentEnv(scope config.Scope, input Input) []string {
	env := append([]string{}, environ()...)
	if scope.Runner.WorkingDir != "" {
		env = prependPath(env, scope.Runner.WorkingDir+"/bin")
	}
	add := func(key, value string) {
		if value != "" {
			env = append(env, key+"="+value)
		}
	}
	token, _ := scope.Token()
	add("THREADS_BASE_URL", scope.Threads.BaseURL)
	add("THREADS_API_TOKEN", token)
	add("THREADS_CHANNEL_ID", input.Event.ChannelID)
	add("THREADS_THREAD_ID", input.ThreadID)
	add("THREADS_MESSAGE_ID", input.Event.Message.ID)
	add("THREADS_SCOPE_ID", input.ScopeID)
	add("THREADS_RUNNER_SESSION_ID", input.RunnerSessionID)
	return env
}

var environ = os.Environ

type errWithStderr struct {
	err    error
	stderr string
}

func (e errWithStderr) Error() string { return e.err.Error() + ": " + e.stderr }
func (e errWithStderr) Unwrap() error { return e.err }

type parsedJSONLOutput struct {
	Text      string
	SessionID string
}

func parseJSONLText(data []byte) string { return parseJSONLOutput(data).Text }

func scanRunnerOutput(ctx context.Context, r io.Reader, dst *bytes.Buffer, onToolEvent ToolEventHandler) error {
	s := bufio.NewScanner(r)
	activeNames := map[string]string{}
	for s.Scan() {
		line := append([]byte(nil), s.Bytes()...)
		dst.Write(line)
		dst.WriteByte('\n')
		if onToolEvent == nil {
			continue
		}
		if event, ok := parseToolEvent(line); ok {
			if event.Status == ToolEventStarted && event.ID != "" && event.Name != "" {
				activeNames[event.ID] = event.Name
			}
			if event.Name == "" && event.ID != "" {
				event.Name = activeNames[event.ID]
			}
			if event.Name == "" {
				event.Name = "tool"
			}
			if event.Status == ToolEventCompleted && event.ID != "" {
				delete(activeNames, event.ID)
			}
			// Tool-call UI is telemetry/progress. Do not fail the agent run if Threads
			// rejects an intermediate step row; the final response should still land.
			_ = onToolEvent(ctx, event)
		}
	}
	return s.Err()
}

func parseToolEvent(line []byte) (ToolEvent, bool) {
	line = bytes.TrimSpace(line)
	if len(line) == 0 {
		return ToolEvent{}, false
	}
	var obj map[string]any
	if err := json.Unmarshal(line, &obj); err != nil {
		return ToolEvent{}, false
	}
	if event, ok := parseClaudeToolEvent(obj); ok {
		return event, true
	}
	if event, ok := parseCodexToolEvent(obj); ok {
		return event, true
	}
	return ToolEvent{}, false
}

func parseClaudeToolEvent(obj map[string]any) (ToolEvent, bool) {
	typeName := firstString(obj, "type")
	message, ok := obj["message"].(map[string]any)
	if !ok || (typeName != "assistant" && typeName != "user") {
		return ToolEvent{}, false
	}
	content, ok := message["content"].([]any)
	if !ok {
		return ToolEvent{}, false
	}
	for _, part := range content {
		partObj, ok := part.(map[string]any)
		if !ok {
			continue
		}
		switch firstString(partObj, "type") {
		case "tool_use":
			name := firstString(partObj, "name")
			if name == "" {
				continue
			}
			return ToolEvent{ID: firstString(partObj, "id"), Name: name, Input: partObj["input"], Status: ToolEventStarted}, true
		case "tool_result":
			return ToolEvent{ID: firstString(partObj, "tool_use_id"), Output: partObj["content"], Status: ToolEventCompleted, Error: truthy(partObj["is_error"])}, true
		}
	}
	return ToolEvent{}, false
}

func parseCodexToolEvent(obj map[string]any) (ToolEvent, bool) {
	typeName := firstString(obj, "type")
	status := ToolEventStarted
	switch {
	case strings.Contains(typeName, "completed") || strings.Contains(typeName, "finish") || strings.Contains(typeName, "end"):
		status = ToolEventCompleted
	case strings.Contains(typeName, "started") || strings.Contains(typeName, "start") || strings.Contains(typeName, "call"):
		status = ToolEventStarted
	default:
		return ToolEvent{}, false
	}
	item, _ := obj["item"].(map[string]any)
	if item == nil {
		item = obj
	}
	itemType := firstString(item, "type")
	if !strings.Contains(itemType, "tool") && !strings.Contains(itemType, "function") && itemType != "command_execution" && !strings.Contains(typeName, "tool") && !strings.Contains(typeName, "function") {
		return ToolEvent{}, false
	}
	name := firstString(item, "name", "tool_name", "toolName")
	if name == "" {
		name = firstString(obj, "name", "tool_name", "toolName")
	}
	if name == "" && itemType == "command_execution" {
		name = "shell"
	}
	if name == "" {
		return ToolEvent{}, false
	}
	input := firstPresent(item, "input", "arguments", "args", "parameters", "command")
	if input == nil {
		input = firstPresent(obj, "input", "arguments", "args", "parameters")
	}
	output := firstPresent(item, "output", "result", "content", "stdout", "stderr")
	if output == nil {
		output = firstPresent(obj, "output", "result", "content", "stdout", "stderr")
	}
	return ToolEvent{ID: firstString(item, "id", "call_id", "callId"), Name: name, Input: input, Output: output, Status: status, Error: truthy(item["error"]) || truthy(obj["error"])}, true
}

func firstPresent(obj map[string]any, keys ...string) any {
	for _, key := range keys {
		if value, ok := obj[key]; ok {
			return value
		}
	}
	return nil
}

func truthy(value any) bool {
	switch v := value.(type) {
	case bool:
		return v
	case string:
		return v != "" && v != "false"
	default:
		return value != nil
	}
}

func parseJSONLOutput(data []byte) parsedJSONLOutput {
	var parts, results []string
	var lastAgentMessage string
	var sessionID string
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
		if sessionID == "" {
			sessionID = firstString(obj, "session_id", "thread_id")
		}
		if value, ok := obj["result"].(string); ok && strings.TrimSpace(value) != "" {
			results = append(results, strings.TrimSpace(value))
			continue
		}
		if item, ok := obj["item"].(map[string]any); ok && item["type"] == "agent_message" {
			if value, ok := item["text"].(string); ok && strings.TrimSpace(value) != "" {
				lastAgentMessage = strings.TrimSpace(value)
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
	text := strings.Join(parts, "\n")
	if lastAgentMessage != "" {
		text = lastAgentMessage
	}
	if len(results) > 0 {
		text = strings.Join(results, "\n")
	}
	return parsedJSONLOutput{Text: text, SessionID: sessionID}
}

func firstString(obj map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := obj[key].(string); ok && strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func prependPath(env []string, dir string) []string {
	if dir == "" {
		return env
	}
	for i, value := range env {
		if strings.HasPrefix(value, "PATH=") {
			env[i] = "PATH=" + dir + string(os.PathListSeparator) + strings.TrimPrefix(value, "PATH=")
			return env
		}
	}
	return append(env, "PATH="+dir)
}

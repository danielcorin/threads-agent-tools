package runner

import (
	"fmt"
	"strings"

	"github.com/danielcorin/threads-agent-tools/bridge/internal/config"
)

func (codexAdapter) BuildInvocation(scope config.Scope, input Input) invocation {
	if command, ok := nativeSlashCommand(input); ok {
		return invocation{UnsupportedMessage: fmt.Sprintf("%s is not supported for Codex through the bridge's current `codex exec` runner path. Codex exec treats slash commands as prompt text rather than native commands.", commandName(command))}
	}
	return invocation{
		Args:   buildCodexArgs(append([]string{}, scope.Runner.Args...), scope.Safety, input.RunnerSessionID),
		Prompt: buildPrompt(scope, input),
	}
}

func (codexAdapter) ParseToolEvent(obj map[string]any) (ToolEvent, bool) {
	return parseCodexToolEvent(obj)
}
func (codexAdapter) ParseLimitEvent(obj map[string]any) (LimitEvent, bool) {
	return parseCodexLimitEvent(obj)
}
func (codexAdapter) ParseOutput(data []byte) parsedJSONLOutput { return parseJSONLOutput(data) }

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

func parseCodexLimitEvent(obj map[string]any) (LimitEvent, bool) {
	rateLimits, _ := obj["rate_limits"].(map[string]any)
	payload, _ := obj["payload"].(map[string]any)
	if rateLimits == nil && payload != nil {
		rateLimits, _ = payload["rate_limits"].(map[string]any)
	}
	if rateLimits == nil {
		return LimitEvent{}, false
	}
	primary := percentFromNested(rateLimits, "primary")
	secondary := percentFromNested(rateLimits, "secondary")
	reached := firstString(rateLimits, "rate_limit_reached_type", "reached_type")
	if primary < 0 && secondary < 0 && reached == "" {
		return LimitEvent{}, false
	}
	severity := "info"
	if reached != "" || primary >= 100 || secondary >= 100 {
		severity = "error"
	} else if primary >= 90 || secondary >= 90 {
		severity = "warning"
	}
	parts := []string{"Codex limits"}
	if primary >= 0 {
		parts = append(parts, fmt.Sprintf("primary %.0f%% used", primary))
	}
	if secondary >= 0 {
		parts = append(parts, fmt.Sprintf("secondary %.0f%% used", secondary))
	}
	if reached != "" {
		parts = append(parts, "reached "+reached)
	}
	return LimitEvent{Source: "codex", Message: strings.Join(parts, "; "), Severity: severity, Metadata: map[string]any{"rate_limits": rateLimits}}, true
}

func percentFromNested(obj map[string]any, key string) float64 {
	nested, _ := obj[key].(map[string]any)
	if nested == nil {
		return -1
	}
	return numberFromAny(nested["used_percent"])
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

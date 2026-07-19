package runner

import (
	"strings"

	"github.com/danielcorin/threads-agent-tools/bridge/internal/config"
)

func (claudeAdapter) BuildInvocation(scope config.Scope, input Input) invocation {
	prompt := buildPrompt(scope, input)
	if command, ok := nativeSlashCommand(input); ok {
		prompt = command + "\n"
	}
	return invocation{
		Args:   buildClaudeArgs(append([]string{}, scope.Runner.Args...), scope.Safety, input.RunnerSessionID),
		Prompt: prompt,
	}
}

func (claudeAdapter) ParseToolEvent(obj map[string]any) (ToolEvent, bool) {
	return parseClaudeToolEvent(obj)
}
func (claudeAdapter) ParseLimitEvent(obj map[string]any) (LimitEvent, bool) {
	return parseClaudeLimitEvent(obj)
}
func (claudeAdapter) ParseOutput(data []byte) parsedJSONLOutput { return parseJSONLOutput(data) }

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

func parseClaudeLimitEvent(obj map[string]any) (LimitEvent, bool) {
	typeName := firstString(obj, "type")
	if typeName == "rate_limit_event" {
		info, _ := obj["rate_limit_info"].(map[string]any)
		if info != nil {
			status := firstString(info, "status")
			severity := "warning"
			switch status {
			case "allowed":
				return LimitEvent{}, false
			case "allowed_warning":
			case "rejected":
				severity = "error"
			default:
				return LimitEvent{}, false
			}
			msg := "Claude rate limit " + strings.ReplaceAll(status, "_", " ")
			if limitType := firstString(info, "rateLimitType", "rate_limit_type"); limitType != "" {
				msg += ": " + strings.ReplaceAll(limitType, "_", " ")
			}
			return LimitEvent{Source: "claude-code", Message: msg, Severity: severity, Metadata: info}, true
		}

		// Preserve support for older Claude stream events that carried only a
		// human-readable limit message.
		msg := firstString(obj, "message", "error", "errorMessage", "error_message")
		if containsLimitLanguage(msg) {
			return LimitEvent{Source: "claude-code", Message: msg, Severity: "warning", Metadata: obj}, true
		}
		return LimitEvent{}, false
	}
	if strings.Contains(typeName, "usage_limit") {
		msg := firstString(obj, "message", "error", "errorMessage", "error_message")
		if containsLimitLanguage(msg) {
			return LimitEvent{Source: "claude-code", Message: msg, Severity: "warning", Metadata: obj}, true
		}
	}
	if typeName == "error" {
		msg := firstString(obj, "message", "error", "errorMessage", "error_message")
		if strings.Contains(strings.ToLower(msg), "limit") || strings.Contains(strings.ToLower(msg), "quota") || strings.Contains(strings.ToLower(msg), "rate") {
			return LimitEvent{Source: "claude-code", Message: "Claude error: " + msg, Severity: "error", Metadata: obj}, true
		}
	}
	return LimitEvent{}, false
}

func containsLimitLanguage(message string) bool {
	message = strings.ToLower(message)
	return strings.Contains(message, "limit") || strings.Contains(message, "quota") || strings.Contains(message, "rate")
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

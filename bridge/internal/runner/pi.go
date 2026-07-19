package runner

import (
	"fmt"
	"strings"

	"github.com/danielcorin/threads-agent-tools/bridge/internal/config"
)

func (piAdapter) BuildInvocation(scope config.Scope, input Input) invocation {
	if command, ok := nativeSlashCommand(input); ok {
		return invocation{UnsupportedMessage: fmt.Sprintf("%s is not supported for Pi through the bridge's current `pi --print` runner path. Pi exposes native commands like compact through RPC mode, but this bridge scope is not using a persistent Pi RPC session yet.", commandName(command))}
	}
	args := buildPiArgs(append([]string{}, scope.Runner.Args...), scope.Safety, input.RunnerSessionID)
	args = append(args, "--append-system-prompt", buildBridgeInstructions(scope, input))
	return invocation{Args: args, Prompt: buildUserPrompt(input)}
}

func (piAdapter) ParseToolEvent(obj map[string]any) (ToolEvent, bool) {
	return parsePiToolEvent(obj)
}
func (piAdapter) ParseLimitEvent(obj map[string]any) (LimitEvent, bool) {
	return parsePiLimitEvent(obj)
}
func (piAdapter) ParseOutput(data []byte) parsedJSONLOutput { return parseJSONLOutput(data) }

func buildPiArgs(args []string, safety config.SafetyConfig, sessionID string) []string {
	if safety.Mode == "read-only" && len(safety.AllowedTools) == 0 {
		args = append(args, "--tools", "read,grep,find,ls")
	}
	if len(safety.AllowedTools) > 0 {
		args = append(args, "--tools", strings.Join(safety.AllowedTools, ","))
	}
	if sessionID != "" {
		args = append(args, "--session", sessionID)
	}
	return args
}

func parsePiLimitEvent(obj map[string]any) (LimitEvent, bool) {
	message, _ := obj["message"].(map[string]any)
	if message == nil || firstString(message, "role") != "assistant" {
		return LimitEvent{}, false
	}
	stopReason := firstString(message, "stopReason", "stop_reason")
	errorMessage := firstString(message, "errorMessage", "error_message", "error")
	usage, _ := message["usage"].(map[string]any)
	if stopReason == "error" && errorMessage != "" {
		return LimitEvent{Source: "pi", Message: "Pi provider error: " + errorMessage, Severity: "error", Metadata: map[string]any{"stop_reason": stopReason, "usage": usage}}, true
	}
	if usage == nil {
		return LimitEvent{}, false
	}
	provider := firstString(message, "provider")
	model := firstString(message, "model")
	tokens := numberFromAny(usage["totalTokens"])
	if tokens < 0 {
		tokens = numberFromAny(usage["total_tokens"])
	}
	if tokens < 0 {
		return LimitEvent{}, false
	}
	label := "Pi usage"
	if provider != "" || model != "" {
		label += " (" + strings.TrimSpace(provider+" "+model) + ")"
	}
	return LimitEvent{Source: "pi", Message: fmt.Sprintf("%s: %.0f tokens", label, tokens), Severity: "info", Metadata: map[string]any{"usage": usage, "provider": provider, "model": model}}, true
}

func parsePiToolEvent(obj map[string]any) (ToolEvent, bool) {
	typeName := firstString(obj, "type")
	switch typeName {
	case "tool_execution_start":
		name := firstString(obj, "toolName", "tool_name", "name")
		if name == "" {
			return ToolEvent{}, false
		}
		return ToolEvent{ID: firstString(obj, "toolCallId", "tool_call_id", "id"), Name: name, Input: firstPresent(obj, "args", "input", "arguments"), Status: ToolEventStarted}, true
	case "tool_execution_update":
		name := firstString(obj, "toolName", "tool_name", "name")
		if name == "" {
			return ToolEvent{}, false
		}
		return ToolEvent{ID: firstString(obj, "toolCallId", "tool_call_id", "id"), Name: name, Input: firstPresent(obj, "args", "input", "arguments"), Output: firstPresent(obj, "partialResult", "partial_result"), Status: ToolEventStarted}, true
	case "tool_execution_end":
		name := firstString(obj, "toolName", "tool_name", "name")
		if name == "" {
			return ToolEvent{}, false
		}
		return ToolEvent{ID: firstString(obj, "toolCallId", "tool_call_id", "id"), Name: name, Output: firstPresent(obj, "result", "output"), Status: ToolEventCompleted, Error: truthy(obj["isError"]) || truthy(obj["is_error"])}, true
	case "message_update":
		delta, _ := obj["assistantMessageEvent"].(map[string]any)
		if delta == nil {
			return ToolEvent{}, false
		}
		deltaType := firstString(delta, "type")
		switch deltaType {
		case "toolcall_start", "toolcall_delta":
			if toolCall := piToolCallFromEvent(delta); toolCall != nil {
				return piToolCallFromMaps(ToolEventStarted, toolCall, nil)
			}
		case "toolcall_end":
			toolCall, _ := delta["toolCall"].(map[string]any)
			return piToolCallFromMaps(ToolEventCompleted, toolCall, nil)
		}
	}
	return ToolEvent{}, false
}

func piToolCallFromEvent(event map[string]any) map[string]any {
	if toolCall, _ := event["toolCall"].(map[string]any); toolCall != nil {
		return toolCall
	}
	contentIndex := intFromNumber(event["contentIndex"])
	partial, _ := event["partial"].(map[string]any)
	if partial == nil {
		return nil
	}
	content, _ := partial["content"].([]any)
	if contentIndex < 0 || contentIndex >= len(content) {
		return nil
	}
	toolCall, _ := content[contentIndex].(map[string]any)
	if firstString(toolCall, "type") != "toolCall" {
		return nil
	}
	return toolCall
}

func piToolCallFromMaps(status ToolEventStatus, toolCall map[string]any, output any) (ToolEvent, bool) {
	if toolCall == nil {
		return ToolEvent{}, false
	}
	name := firstString(toolCall, "name", "toolName", "tool_name")
	if name == "" {
		return ToolEvent{}, false
	}
	return ToolEvent{ID: firstString(toolCall, "id", "toolCallId", "tool_call_id"), Name: name, Input: firstPresent(toolCall, "arguments", "args", "input", "partialJson"), Output: output, Status: status}, true
}

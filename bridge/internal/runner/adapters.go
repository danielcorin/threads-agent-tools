package runner

import (
	"encoding/json"

	"github.com/danielcorin/threads-agent-tools/bridge/internal/config"
)

type invocation struct {
	Args               []string
	Prompt             string
	UnsupportedMessage string
}

// runnerAdapter owns the CLI-specific contract: invocation flags and resume
// semantics, prompt transport, stream telemetry, and final-output parsing.
// LocalRunner owns only the shared subprocess lifecycle.
type runnerAdapter interface {
	BuildInvocation(config.Scope, Input) invocation
	ParseToolEvent(map[string]any) (ToolEvent, bool)
	ParseLimitEvent(map[string]any) (LimitEvent, bool)
	ParseOutput([]byte) parsedJSONLOutput
}

type codexAdapter struct{}
type claudeAdapter struct{}
type piAdapter struct{}

func adapterFor(runnerType string) runnerAdapter {
	switch runnerType {
	case "claude-code":
		return claudeAdapter{}
	case "pi":
		return piAdapter{}
	default:
		return codexAdapter{}
	}
}

func parseToolEventWith(adapter runnerAdapter, line []byte) (ToolEvent, bool) {
	var obj map[string]any
	if !decodeEvent(line, &obj) {
		return ToolEvent{}, false
	}
	return adapter.ParseToolEvent(obj)
}

func parseLimitEventWith(adapter runnerAdapter, line []byte) (LimitEvent, bool) {
	var obj map[string]any
	if !decodeEvent(line, &obj) {
		return LimitEvent{}, false
	}
	return adapter.ParseLimitEvent(obj)
}

func decodeEvent(line []byte, obj *map[string]any) bool {
	line = bytesTrimSpace(line)
	return len(line) > 0 && json.Unmarshal(line, obj) == nil
}

// autoDetectAdapter preserves the package-level parser helpers used by tests
// and diagnostics. Runtime streams always use their configured adapter.
type autoDetectAdapter struct{}

func (autoDetectAdapter) BuildInvocation(config.Scope, Input) invocation { return invocation{} }
func (autoDetectAdapter) ParseOutput(data []byte) parsedJSONLOutput      { return parseJSONLOutput(data) }
func (autoDetectAdapter) ParseToolEvent(obj map[string]any) (ToolEvent, bool) {
	for _, adapter := range []runnerAdapter{claudeAdapter{}, piAdapter{}, codexAdapter{}} {
		if event, ok := adapter.ParseToolEvent(obj); ok {
			return event, true
		}
	}
	return ToolEvent{}, false
}
func (autoDetectAdapter) ParseLimitEvent(obj map[string]any) (LimitEvent, bool) {
	for _, adapter := range []runnerAdapter{codexAdapter{}, piAdapter{}, claudeAdapter{}} {
		if event, ok := adapter.ParseLimitEvent(obj); ok {
			return event, true
		}
	}
	return LimitEvent{}, false
}

func bytesTrimSpace(value []byte) []byte {
	start, end := 0, len(value)
	for start < end && (value[start] == ' ' || value[start] == '\t' || value[start] == '\r' || value[start] == '\n') {
		start++
	}
	for end > start && (value[end-1] == ' ' || value[end-1] == '\t' || value[end-1] == '\r' || value[end-1] == '\n') {
		end--
	}
	return value[start:end]
}

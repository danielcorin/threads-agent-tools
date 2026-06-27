package daemon

import (
	"context"
	"encoding/json"
	"log/slog"
	"strings"
	"time"

	"github.com/danielcorin/threads-agent-bridge/internal/config"
	"github.com/danielcorin/threads-agent-bridge/internal/runner"
	"github.com/danielcorin/threads-agent-bridge/internal/store"
	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

type EventSource interface {
	Events(context.Context, string) (<-chan threads.Event, <-chan error)
}
type Sender interface {
	SendMessage(context.Context, string, threads.SendMessageRequest) error
}

type ClientFactory func(config.Scope, string) (EventSource, Sender)

type Daemon struct {
	Config  config.Config
	Store   *store.Store
	Runner  runner.Runner
	Clients ClientFactory
	Logger  *slog.Logger
}

func (d Daemon) Run(ctx context.Context) error {
	if d.Runner == nil {
		d.Runner = runner.LocalRunner{}
	}
	if d.Clients == nil {
		d.Clients = defaultClients
	}
	if d.Logger == nil {
		d.Logger = slog.Default()
	}
	errc := make(chan error, len(d.Config.Scopes))
	for _, scope := range d.Config.Scopes {
		scope := scope
		go func() { errc <- d.runScope(ctx, scope) }()
	}
	select {
	case <-ctx.Done():
		return ctx.Err()
	case err := <-errc:
		return err
	}
}

func (d Daemon) runScope(ctx context.Context, scope config.Scope) error {
	token, err := scope.Token()
	if err != nil {
		return err
	}
	since := scope.Threads.Since
	if since == "" {
		since, err = d.Store.Cursor(ctx, scope.ID)
		if err != nil {
			return err
		}
	}
	eventsClient, sender := d.Clients(scope, token)
	events, errs := eventsClient.Events(ctx, since)
	for {
		select {
		case event, ok := <-events:
			if !ok {
				return nil
			}
			if err := d.HandleEvent(ctx, scope, sender, event); err != nil {
				d.Logger.Error("handle event", "scope", scope.ID, "error", err)
			}
		case err := <-errs:
			return err
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}

func (d Daemon) HandleEvent(ctx context.Context, scope config.Scope, sender Sender, event threads.Event) error {
	if event.Cursor != "" {
		defer d.Store.SaveCursor(context.WithoutCancel(ctx), scope.ID, event.Cursor)
	}
	if event.Type != "message.created" && event.Type != "message.invoked" && event.Type != "message" {
		return nil
	}
	if event.Message.Content == "" {
		return nil
	}
	if !scope.Matches(event.ChannelID, event.ThreadID) {
		return nil
	}
	if scope.Threads.UserID != "" && event.Message.SenderID == scope.Threads.UserID {
		return nil
	}
	eventID := event.ID
	if eventID == "" {
		eventID = event.Cursor
	}
	fresh, err := d.Store.MarkProcessed(ctx, scope.ID, eventID)
	if err != nil || !fresh {
		return err
	}
	threadID := rootThreadID(event)
	runnerSessionID, err := d.Store.RunnerSessionID(ctx, scope.ID, event.ChannelID, threadID)
	if err != nil {
		return err
	}
	out, err := d.Runner.Run(ctx, scope, runner.Input{ScopeID: scope.ID, Event: event, ThreadID: threadID, RunnerSessionID: runnerSessionID, NewSession: runnerSessionID == "", OnToolEvent: d.toolEventHandler(scope, sender, event, threadID)})
	if err != nil {
		return err
	}
	if out.RunnerSessionID != "" && out.RunnerSessionID != runnerSessionID {
		if err := d.Store.SaveRunnerSessionID(ctx, scope.ID, event.ChannelID, threadID, out.RunnerSessionID); err != nil {
			return err
		}
	}
	if out.Text == "" {
		return nil
	}
	return sender.SendMessage(ctx, event.ChannelID, threads.SendMessageRequest{Content: out.Text, ThreadID: threadID, MessageType: "response", Metadata: map[string]any{"source": "threads-agent-bridge", "kind": "final", "scope_id": scope.ID, "runner_session_id": out.RunnerSessionID}})
}

func (d Daemon) toolEventHandler(scope config.Scope, sender Sender, event threads.Event, threadID string) runner.ToolEventHandler {
	active := map[string]runner.ToolEvent{}
	return func(ctx context.Context, toolEvent runner.ToolEvent) error {
		if toolEvent.ID != "" {
			if toolEvent.Status == runner.ToolEventStarted {
				active[toolEvent.ID] = toolEvent
			} else if previous, ok := active[toolEvent.ID]; ok {
				if toolEvent.Name == "" {
					toolEvent.Name = previous.Name
				}
				if toolEvent.Input == nil {
					toolEvent.Input = previous.Input
				}
			}
		}
		content := formatToolEvent(toolEvent)
		messageType := "progress"
		if toolEvent.Status == runner.ToolEventCompleted {
			messageType = "tool_output"
		}
		err := sender.SendMessage(ctx, event.ChannelID, threads.SendMessageRequest{
			Content:     content,
			ThreadID:    threadID,
			MessageType: messageType,
			Metadata: map[string]any{
				"source":     "threads-agent-bridge",
				"kind":       "tool_call",
				"scope_id":   scope.ID,
				"trigger_id": event.Message.ID,
				"tool":       toolEvent.Name,
				"tool_id":    toolEvent.ID,
				"status":     string(toolEvent.Status),
				"error":      toolEvent.Error,
				"input":      toolEvent.Input,
				"output":     toolEvent.Output,
			},
		})
		if err != nil && d.Logger != nil {
			d.Logger.Warn("send tool event", "scope", scope.ID, "tool", toolEvent.Name, "status", toolEvent.Status, "error", err)
		}
		return err
	}
}

func formatToolEvent(event runner.ToolEvent) string {
	prefix := "↳"
	if event.Status == runner.ToolEventCompleted {
		if event.Error {
			prefix = "✗"
		} else {
			prefix = "✓"
		}
	}
	title := strings.TrimSpace(prefix + " " + event.Name)
	if command := toolCommand(event.Input); command != "" {
		title += ": `" + inlineCode(command) + "`"
	}
	if event.Status == runner.ToolEventCompleted {
		return title + formatToolOutput(event.Output)
	}
	return title + formatToolInput(event.Input)
}

func toolCommand(input any) string {
	switch v := input.(type) {
	case map[string]any:
		if command, ok := v["command"].(string); ok {
			return firstLine(command)
		}
	case string:
		return firstLine(v)
	}
	return ""
}

func firstLine(value string) string {
	for _, line := range strings.Split(value, "\n") {
		if trimmed := strings.TrimSpace(line); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

func inlineCode(value string) string {
	return strings.ReplaceAll(value, "`", "\\`")
}

func formatToolInput(input any) string {
	return formatToolPayload("Input", input)
}

func formatToolOutput(output any) string {
	return formatToolPayload("Output", output)
}

func formatToolPayload(label string, payload any) string {
	if payload == nil {
		return ""
	}
	if text, ok := payload.(string); ok {
		text = strings.TrimSpace(text)
		if text == "" {
			return ""
		}
		return "\n\n" + label + ":\n\n" + indentCode(text)
	}
	data, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return ""
	}
	return "\n\n" + label + ":\n\n" + indentCode(string(data))
}

func indentCode(value string) string {
	lines := strings.Split(value, "\n")
	for i, line := range lines {
		lines[i] = "    " + line
	}
	return strings.Join(lines, "\n")
}

func rootThreadID(event threads.Event) string {
	if event.ThreadID != "" {
		return event.ThreadID
	}
	return event.Message.ID
}

func defaultClients(scope config.Scope, token string) (EventSource, Sender) {
	client := threads.Client{BaseURL: scope.Threads.BaseURL, Token: token}
	return client, client
}

func SleepBackoff(attempt int) time.Duration {
	if attempt < 1 {
		attempt = 1
	}
	if attempt > 6 {
		attempt = 6
	}
	return time.Duration(1<<uint(attempt-1)) * time.Second
}

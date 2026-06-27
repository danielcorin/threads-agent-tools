package daemon

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/danielcorin/threads-agent-bridge/internal/config"
	"github.com/danielcorin/threads-agent-bridge/internal/runner"
	"github.com/danielcorin/threads-agent-bridge/internal/store"
	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

type EventSource interface {
	Events(context.Context, string) (<-chan threads.Event, <-chan error)
}

type PresenceMaintainer interface {
	MaintainPresence(context.Context) error
}
type Sender interface {
	SendMessage(context.Context, string, threads.SendMessageRequest) error
}

type ProcessClient interface {
	CreateProcess(context.Context, threads.CreateProcessRequest) (threads.CreateProcessResponse, error)
	UpdateProcess(context.Context, string, threads.UpdateProcessRequest) error
	RecordProcessActivity(context.Context, string, threads.ProcessActivityRequest) error
	UpdateMessageProcessStatus(context.Context, string, threads.UpdateMessageProcessStatusRequest) error
}

type ClientFactory func(config.Scope, string) (EventSource, Sender, ProcessClient)

type Daemon struct {
	Config  config.Config
	Store   *store.Store
	Runner  runner.Runner
	Clients ClientFactory
	Logger  *slog.Logger

	activeMu sync.Mutex
	active   map[string]context.CancelFunc
}

func (d *Daemon) Run(ctx context.Context) error {
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

func (d *Daemon) runScope(ctx context.Context, scope config.Scope) error {
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
	eventsClient, sender, processes := d.Clients(scope, token)
	if presence, ok := eventsClient.(PresenceMaintainer); ok {
		go d.maintainPresence(ctx, scope, presence)
	}
	events, errs := eventsClient.Events(ctx, since)
	for {
		select {
		case event, ok := <-events:
			if !ok {
				return nil
			}
			if isProcessKillEvent(event) {
				d.HandleProcessKill(event)
				continue
			}
			go func(event threads.Event) {
				if err := d.HandleEvent(ctx, scope, sender, processes, event); err != nil {
					d.Logger.Error("handle event", "scope", scope.ID, "error", err)
				}
			}(event)
		case err := <-errs:
			return err
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}

func (d *Daemon) HandleEvent(ctx context.Context, scope config.Scope, sender Sender, processes ProcessClient, event threads.Event) error {
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
	processID := processID(scope.ID, event.Message.ID)
	if processes != nil {
		created, err := processes.CreateProcess(ctx, threads.CreateProcessRequest{ID: processID, ChannelID: event.ChannelID, MessageID: event.Message.ID, UserID: event.Message.SenderID, Status: "running", PID: os.Getpid()})
		if err != nil {
			return err
		}
		if created.ID != "" {
			processID = created.ID
		}
		if err := processes.UpdateMessageProcessStatus(ctx, event.Message.ID, threads.UpdateMessageProcessStatusRequest{ProcessID: processID, Status: "processing"}); err != nil {
			return err
		}
	}
	runCtx, cancel := context.WithCancel(ctx)
	d.trackProcess(processID, cancel)
	defer d.untrackProcess(processID)

	out, err := d.Runner.Run(runCtx, scope, runner.Input{ScopeID: scope.ID, Event: event, ThreadID: threadID, RunnerSessionID: runnerSessionID, NewSession: runnerSessionID == "", OnToolEvent: d.toolEventHandler(scope, sender, processes, processID, event, threadID)})
	if err != nil {
		status := "error"
		if runCtx.Err() != nil || ctx.Err() != nil {
			status = "killed"
		}
		if processes != nil {
			_ = processes.UpdateProcess(context.WithoutCancel(ctx), processID, threads.UpdateProcessRequest{Status: status})
			_ = processes.UpdateMessageProcessStatus(context.WithoutCancel(ctx), event.Message.ID, threads.UpdateMessageProcessStatusRequest{ProcessID: processID, Status: status})
		}
		if status == "killed" {
			return nil
		}
		return err
	}
	if out.RunnerSessionID != "" && out.RunnerSessionID != runnerSessionID {
		if err := d.Store.SaveRunnerSessionID(ctx, scope.ID, event.ChannelID, threadID, out.RunnerSessionID); err != nil {
			return err
		}
	}
	if out.Text != "" {
		if processes != nil {
			_ = processes.RecordProcessActivity(context.WithoutCancel(ctx), processID, threads.ProcessActivityRequest{Type: "reply"})
		}
		if err := sender.SendMessage(ctx, event.ChannelID, threads.SendMessageRequest{Content: out.Text, ThreadID: threadID, MessageType: "response", Metadata: map[string]any{"source": "threads-agent-bridge", "kind": "final", "scope_id": scope.ID, "runner_session_id": out.RunnerSessionID, "process_id": processID}}); err != nil {
			if processes != nil {
				_ = processes.UpdateProcess(context.WithoutCancel(ctx), processID, threads.UpdateProcessRequest{Status: "error"})
				_ = processes.UpdateMessageProcessStatus(context.WithoutCancel(ctx), event.Message.ID, threads.UpdateMessageProcessStatusRequest{ProcessID: processID, Status: "error", ErrorText: err.Error()})
			}
			return err
		}
	}
	if processes != nil {
		_ = processes.UpdateProcess(context.WithoutCancel(ctx), processID, threads.UpdateProcessRequest{Status: "done"})
		_ = processes.UpdateMessageProcessStatus(context.WithoutCancel(ctx), event.Message.ID, threads.UpdateMessageProcessStatusRequest{ProcessID: processID, Status: "done"})
	}
	return nil
}

func (d *Daemon) toolEventHandler(scope config.Scope, sender Sender, processes ProcessClient, processID string, event threads.Event, threadID string) runner.ToolEventHandler {
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
		if processes != nil && toolEvent.Status == runner.ToolEventStarted {
			if err := processes.RecordProcessActivity(context.WithoutCancel(ctx), processID, threads.ProcessActivityRequest{Type: "tool_call"}); err != nil && d.Logger != nil {
				d.Logger.Warn("record tool activity", "scope", scope.ID, "tool", toolEvent.Name, "error", err)
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
				"process_id": processID,
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

func (d *Daemon) trackProcess(processID string, cancel context.CancelFunc) {
	d.activeMu.Lock()
	defer d.activeMu.Unlock()
	if d.active == nil {
		d.active = map[string]context.CancelFunc{}
	}
	d.active[processID] = cancel
}

func (d *Daemon) untrackProcess(processID string) {
	d.activeMu.Lock()
	defer d.activeMu.Unlock()
	delete(d.active, processID)
}

func (d *Daemon) HandleProcessKill(event threads.Event) {
	if event.ProcessID == "" {
		return
	}
	d.activeMu.Lock()
	cancel := d.active[event.ProcessID]
	d.activeMu.Unlock()
	if cancel != nil {
		cancel()
	}
}

func isProcessKillEvent(event threads.Event) bool {
	return event.Type == "process_kill" || event.Type == "process.kill"
}

func processID(scopeID, messageID string) string {
	return sanitizeID(fmt.Sprintf("bridge-%s-%s-%d", scopeID, messageID, time.Now().UnixNano()))
}

func sanitizeID(value string) string {
	var b strings.Builder
	for _, r := range value {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			b.WriteRune(r)
		} else {
			b.WriteByte('-')
		}
	}
	return b.String()
}

func (d *Daemon) maintainPresence(ctx context.Context, scope config.Scope, presence PresenceMaintainer) {
	attempt := 0
	for ctx.Err() == nil {
		if err := presence.MaintainPresence(ctx); err != nil && ctx.Err() == nil && d.Logger != nil {
			d.Logger.Warn("presence websocket disconnected", "scope", scope.ID, "error", err)
		}
		attempt++
		select {
		case <-time.After(SleepBackoff(attempt)):
		case <-ctx.Done():
			return
		}
	}
}

func defaultClients(scope config.Scope, token string) (EventSource, Sender, ProcessClient) {
	client := threads.Client{BaseURL: scope.Threads.BaseURL, Token: token}
	return client, client, client
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

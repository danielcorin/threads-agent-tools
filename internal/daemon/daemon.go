package daemon

import (
	"context"
	"log/slog"
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
	out, err := d.Runner.Run(ctx, scope, runner.Input{ScopeID: scope.ID, Event: event})
	if err != nil {
		return err
	}
	if out.Text == "" {
		return nil
	}
	return sender.SendMessage(ctx, event.ChannelID, threads.SendMessageRequest{Content: out.Text, ThreadID: event.ThreadID, MessageType: "response", Metadata: map[string]any{"source": "threads-agent-bridge", "kind": "final", "scope_id": scope.ID}})
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

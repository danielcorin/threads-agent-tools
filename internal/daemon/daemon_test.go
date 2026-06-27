package daemon

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/danielcorin/threads-agent-bridge/internal/config"
	"github.com/danielcorin/threads-agent-bridge/internal/runner"
	"github.com/danielcorin/threads-agent-bridge/internal/store"
	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

type fakeRunner struct{ calls int }

func (f *fakeRunner) Run(ctx context.Context, scope config.Scope, in runner.Input) (runner.Output, error) {
	f.calls++
	return runner.Output{Text: "reply to " + in.Event.Message.Content}, nil
}

type fakeSender struct{ sent []threads.SendMessageRequest }

func (f *fakeSender) SendMessage(ctx context.Context, channelID string, req threads.SendMessageRequest) error {
	f.sent = append(f.sent, req)
	return nil
}

func TestHandleEventRoutesAndDedupes(t *testing.T) {
	st, err := store.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	r := &fakeRunner{}
	s := &fakeSender{}
	d := Daemon{Store: st, Runner: r}
	scope := config.Scope{ID: "s1", Match: config.MatchConfig{ChannelIDs: []string{"c1"}}}
	event := threads.Event{ID: "e1", Cursor: "cur1", Type: "message.created", ChannelID: "c1", ThreadID: "t1", Message: threads.Message{ID: "m1", Content: "hi"}}
	if err := d.HandleEvent(context.Background(), scope, s, event); err != nil {
		t.Fatal(err)
	}
	if err := d.HandleEvent(context.Background(), scope, s, event); err != nil {
		t.Fatal(err)
	}
	if r.calls != 1 || len(s.sent) != 1 {
		t.Fatalf("calls=%d sent=%d", r.calls, len(s.sent))
	}
	if s.sent[0].ThreadID != "t1" || s.sent[0].Content != "reply to hi" {
		t.Fatalf("bad send: %+v", s.sent[0])
	}
	cursor, err := st.Cursor(context.Background(), "s1")
	if err != nil || cursor != "cur1" {
		t.Fatalf("cursor=%q err=%v", cursor, err)
	}
}

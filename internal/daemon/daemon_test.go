package daemon

import (
	"context"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/danielcorin/threads-agent-bridge/internal/config"
	"github.com/danielcorin/threads-agent-bridge/internal/runner"
	"github.com/danielcorin/threads-agent-bridge/internal/store"
	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

type fakeRunner struct {
	calls  int
	inputs []runner.Input
}

func (f *fakeRunner) Run(ctx context.Context, scope config.Scope, in runner.Input) (runner.Output, error) {
	f.calls++
	f.inputs = append(f.inputs, in)
	if in.RunnerSessionID != "" {
		return runner.Output{Text: "reply to " + in.Event.Message.Content, RunnerSessionID: in.RunnerSessionID}, nil
	}
	return runner.Output{Text: "reply to " + in.Event.Message.Content, RunnerSessionID: "runner-s1"}, nil
}

type fakeSender struct {
	sent            []threads.SendMessageRequest
	created         []threads.CreateProcessRequest
	updated         []threads.UpdateProcessRequest
	activities      []threads.ProcessActivityRequest
	messageStatuses []threads.UpdateMessageProcessStatusRequest
}

func (f *fakeSender) SendMessage(ctx context.Context, channelID string, req threads.SendMessageRequest) error {
	f.sent = append(f.sent, req)
	return nil
}

func (f *fakeSender) CreateProcess(ctx context.Context, req threads.CreateProcessRequest) (threads.CreateProcessResponse, error) {
	f.created = append(f.created, req)
	return threads.CreateProcessResponse{ID: req.ID, Status: "running"}, nil
}

func (f *fakeSender) UpdateProcess(ctx context.Context, processID string, req threads.UpdateProcessRequest) error {
	f.updated = append(f.updated, req)
	return nil
}

func (f *fakeSender) RecordProcessActivity(ctx context.Context, processID string, req threads.ProcessActivityRequest) error {
	f.activities = append(f.activities, req)
	return nil
}

func (f *fakeSender) UpdateMessageProcessStatus(ctx context.Context, messageID string, req threads.UpdateMessageProcessStatusRequest) error {
	f.messageStatuses = append(f.messageStatuses, req)
	return nil
}

func TestHandleEventIgnoresOwnMessages(t *testing.T) {
	st, err := store.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	r := &fakeRunner{}
	s := &fakeSender{}
	d := Daemon{Store: st, Runner: r}
	scope := config.Scope{ID: "s1", Threads: config.ThreadsConfig{UserID: "bot1"}}
	event := threads.Event{ID: "e1", Type: "message", ChannelID: "c1", Message: threads.Message{ID: "m1", Content: "hi", SenderID: "bot1"}}
	if err := d.HandleEvent(context.Background(), scope, s, s, event); err != nil {
		t.Fatal(err)
	}
	if r.calls != 0 || len(s.sent) != 0 {
		t.Fatalf("calls=%d sent=%d", r.calls, len(s.sent))
	}
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
	if err := d.HandleEvent(context.Background(), scope, s, s, event); err != nil {
		t.Fatal(err)
	}
	if err := d.HandleEvent(context.Background(), scope, s, s, event); err != nil {
		t.Fatal(err)
	}
	if r.calls != 1 || len(s.sent) != 1 {
		t.Fatalf("calls=%d sent=%d", r.calls, len(s.sent))
	}
	if s.sent[0].ThreadID != "t1" || s.sent[0].Content != "reply to hi" || s.sent[0].MessageType != "response" {
		t.Fatalf("bad send: %+v", s.sent[0])
	}
	if s.sent[0].Metadata["kind"] != "final" || s.sent[0].Metadata["scope_id"] != "s1" || s.sent[0].Metadata["runner_session_id"] != "runner-s1" {
		t.Fatalf("bad final metadata: %+v", s.sent[0].Metadata)
	}
	cursor, err := st.Cursor(context.Background(), "s1")
	if err != nil || cursor != "cur1" {
		t.Fatalf("cursor=%q err=%v", cursor, err)
	}
}

type blockingRunner struct {
	started chan struct{}
}

func (r blockingRunner) Run(ctx context.Context, scope config.Scope, in runner.Input) (runner.Output, error) {
	close(r.started)
	<-ctx.Done()
	return runner.Output{}, ctx.Err()
}

type toolEventRunner struct{}

func (toolEventRunner) Run(ctx context.Context, scope config.Scope, in runner.Input) (runner.Output, error) {
	if in.OnToolEvent != nil {
		_ = in.OnToolEvent(ctx, runner.ToolEvent{ID: "tool-1", Name: "Bash", Input: map[string]any{"command": "git status"}, Status: runner.ToolEventStarted})
		_ = in.OnToolEvent(ctx, runner.ToolEvent{ID: "tool-1", Name: "Bash", Output: "clean", Status: runner.ToolEventCompleted})
	}
	return runner.Output{Text: "done", RunnerSessionID: "runner-s1"}, nil
}

func TestHandleEventCreatesProcessStatusAndKillCancelsRun(t *testing.T) {
	st, err := store.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	s := &fakeSender{}
	started := make(chan struct{})
	d := Daemon{Store: st, Runner: blockingRunner{started: started}}
	scope := config.Scope{ID: "s1", Match: config.MatchConfig{ChannelIDs: []string{"c1"}}}
	event := threads.Event{ID: "e1", Type: "message.created", ChannelID: "c1", Message: threads.Message{ID: "m1", Content: "hi", SenderID: "u1"}}
	done := make(chan error, 1)
	go func() { done <- d.HandleEvent(context.Background(), scope, s, s, event) }()
	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("runner did not start")
	}
	if len(s.created) != 1 || s.created[0].MessageID != "m1" || s.created[0].UserID != "u1" {
		t.Fatalf("bad process create: %+v", s.created)
	}
	if len(s.messageStatuses) != 1 || s.messageStatuses[0].Status != "processing" || s.messageStatuses[0].ProcessID == "" {
		t.Fatalf("bad initial message status: %+v", s.messageStatuses)
	}
	d.HandleProcessKill(threads.Event{Type: "process_kill", ProcessID: s.messageStatuses[0].ProcessID})
	select {
	case err := <-done:
		if err != nil {
			t.Fatal(err)
		}
	case <-time.After(time.Second):
		t.Fatal("runner was not cancelled")
	}
	if len(s.updated) == 0 || s.updated[len(s.updated)-1].Status != "killed" {
		t.Fatalf("bad process updates: %+v", s.updated)
	}
	if got := s.messageStatuses[len(s.messageStatuses)-1].Status; got != "killed" {
		t.Fatalf("message status=%q, want killed", got)
	}
}

func TestHandleEventStreamsToolEventsAsTriggeredStepMessages(t *testing.T) {
	st, err := store.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	s := &fakeSender{}
	d := Daemon{Store: st, Runner: toolEventRunner{}}
	scope := config.Scope{ID: "s1", Match: config.MatchConfig{ChannelIDs: []string{"c1"}}}
	event := threads.Event{ID: "e1", Type: "message.created", ChannelID: "c1", Message: threads.Message{ID: "m1", Content: "hi"}}
	if err := d.HandleEvent(context.Background(), scope, s, s, event); err != nil {
		t.Fatal(err)
	}
	if len(s.sent) != 3 {
		t.Fatalf("sent=%d %+v", len(s.sent), s.sent)
	}
	if s.sent[0].MessageType != "progress" || s.sent[0].Metadata["trigger_id"] != "m1" || s.sent[0].Metadata["tool"] != "Bash" {
		t.Fatalf("bad tool start message: %+v", s.sent[0])
	}
	if !strings.HasPrefix(s.sent[0].Content, "↳ Bash: `git status`") || !strings.Contains(s.sent[0].Content, "Input:\n\n    {") || strings.Contains(s.sent[0].Content, "…") {
		t.Fatalf("tool input should title with command and include full expandable JSON, got %q", s.sent[0].Content)
	}
	if s.sent[1].MessageType != "tool_output" || s.sent[1].Metadata["status"] != string(runner.ToolEventCompleted) || s.sent[1].Metadata["tool"] != "Bash" {
		t.Fatalf("bad tool completed message: %+v", s.sent[1])
	}
	if !strings.HasPrefix(s.sent[1].Content, "✓ Bash: `git status`") || strings.Contains(s.sent[1].Content, "Input:") || !strings.Contains(s.sent[1].Content, "Output:\n\n    clean") {
		t.Fatalf("tool completion should retain command title and show output only, got %q", s.sent[1].Content)
	}
	if s.sent[2].MessageType != "response" || s.sent[2].Content != "done" {
		t.Fatalf("bad final message: %+v", s.sent[2])
	}
}

func TestHandleEventMapsTopLevelMessageToThreadSessionAndRepliesResume(t *testing.T) {
	st, err := store.Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()
	r := &fakeRunner{}
	s := &fakeSender{}
	d := Daemon{Store: st, Runner: r}
	scope := config.Scope{ID: "s1", Match: config.MatchConfig{ChannelIDs: []string{"c1"}}}

	root := threads.Event{ID: "e-root", Type: "message.created", ChannelID: "c1", Message: threads.Message{ID: "m-root", Content: "start"}}
	if err := d.HandleEvent(context.Background(), scope, s, s, root); err != nil {
		t.Fatal(err)
	}
	reply := threads.Event{ID: "e-reply", Type: "message.created", ChannelID: "c1", ThreadID: "m-root", Message: threads.Message{ID: "m-reply", Content: "continue"}}
	if err := d.HandleEvent(context.Background(), scope, s, s, reply); err != nil {
		t.Fatal(err)
	}

	if r.calls != 2 || len(r.inputs) != 2 || len(s.sent) != 2 {
		t.Fatalf("calls=%d inputs=%d sent=%d", r.calls, len(r.inputs), len(s.sent))
	}
	if !r.inputs[0].NewSession || r.inputs[0].ThreadID != "m-root" || r.inputs[0].RunnerSessionID != "" {
		t.Fatalf("bad first input: %+v", r.inputs[0])
	}
	if r.inputs[1].NewSession || r.inputs[1].ThreadID != "m-root" || r.inputs[1].RunnerSessionID != "runner-s1" {
		t.Fatalf("bad reply input: %+v", r.inputs[1])
	}
	if s.sent[0].ThreadID != "m-root" || s.sent[1].ThreadID != "m-root" {
		t.Fatalf("bad reply targets: %+v", s.sent)
	}
}

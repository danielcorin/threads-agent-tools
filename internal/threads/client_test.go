package threads

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestEventUnmarshalThreadsMessageEnvelope(t *testing.T) {
	var event Event
	if err := json.Unmarshal([]byte(`{"type":"message","id":"m1","channelId":"c1","userId":"u1","content":"hi","threadId":null}`), &event); err != nil {
		t.Fatal(err)
	}
	if event.Type != "message" || event.ChannelID != "c1" || event.Message.ID != "m1" || event.Message.Content != "hi" || event.Message.SenderID != "u1" {
		t.Fatalf("unexpected event: %+v", event)
	}
}

func TestUploadFile(t *testing.T) {
	var gotAuth, gotFilename, gotContentType string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		if r.URL.Path != "/uploads" {
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
		if err := r.ParseMultipartForm(32 << 20); err != nil {
			t.Fatal(err)
		}
		files := r.MultipartForm.File["file"]
		if len(files) != 1 {
			t.Fatalf("files=%d", len(files))
		}
		gotFilename = files[0].Filename
		gotContentType = files[0].Header.Get("Content-Type")
		_ = json.NewEncoder(w).Encode(Attachment{ID: "att1", Filename: gotFilename})
	}))
	defer srv.Close()
	path := filepath.Join(t.TempDir(), "photo.png")
	if err := os.WriteFile(path, []byte("png"), 0o600); err != nil {
		t.Fatal(err)
	}
	c := Client{BaseURL: srv.URL, Token: "tok", HTTP: srv.Client()}
	att, err := c.UploadFile(context.Background(), path)
	if err != nil {
		t.Fatal(err)
	}
	if att.ID != "att1" || gotAuth != "Bearer tok" || gotFilename != "photo.png" || gotContentType != "image/png" {
		t.Fatalf("att=%+v auth=%q filename=%q contentType=%q", att, gotAuth, gotFilename, gotContentType)
	}
}

func TestProcessLifecycleRequests(t *testing.T) {
	var seen []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.Method+" "+r.URL.Path)
		if r.URL.Path == "/processes" {
			_ = json.NewEncoder(w).Encode(CreateProcessResponse{ID: "p1", Status: "running"})
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()
	c := Client{BaseURL: srv.URL, Token: "tok", HTTP: srv.Client()}
	if out, err := c.CreateProcess(context.Background(), CreateProcessRequest{ID: "p1", ChannelID: "c1", MessageID: "m1", Status: "running"}); err != nil || out.ID != "p1" {
		t.Fatalf("create out=%+v err=%v", out, err)
	}
	if err := c.UpdateMessageProcessStatus(context.Background(), "m1", UpdateMessageProcessStatusRequest{ProcessID: "p1", Status: "processing"}); err != nil {
		t.Fatal(err)
	}
	if err := c.RecordProcessActivity(context.Background(), "p1", ProcessActivityRequest{Type: "tool_call"}); err != nil {
		t.Fatal(err)
	}
	if err := c.UpdateProcess(context.Background(), "p1", UpdateProcessRequest{Status: "done"}); err != nil {
		t.Fatal(err)
	}
	want := []string{"POST /processes", "POST /messages/m1/process", "POST /processes/p1/activity", "PATCH /processes/p1"}
	if len(seen) != len(want) {
		t.Fatalf("seen=%v", seen)
	}
	for i := range want {
		if seen[i] != want[i] {
			t.Fatalf("seen=%v want=%v", seen, want)
		}
	}
}

func TestSendMessage(t *testing.T) {
	var gotAuth, gotPath, gotThread string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotPath = r.URL.Path
		var req SendMessageRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Fatal(err)
		}
		gotThread = req.ThreadID
		w.WriteHeader(http.StatusCreated)
	}))
	defer srv.Close()
	c := Client{BaseURL: srv.URL, Token: "tok", HTTP: srv.Client()}
	if err := c.SendMessage(context.Background(), "c 1", SendMessageRequest{Content: "hi", ThreadID: "t1"}); err != nil {
		t.Fatal(err)
	}
	if gotAuth != "Bearer tok" || gotPath != "/channels/c 1/messages" || gotThread != "t1" {
		t.Fatalf("unexpected request auth=%q path=%q thread=%q", gotAuth, gotPath, gotThread)
	}
}

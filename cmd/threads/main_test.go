package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/danielcorin/threads-agent-bridge/internal/threads"
)

func TestSendUsesEnvDefaultsAndStdin(t *testing.T) {
	var gotAuth, gotPath string
	var got threads.SendMessageRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotPath = r.URL.Path
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Fatal(err)
		}
		w.WriteHeader(http.StatusCreated)
	}))
	defer srv.Close()
	getenv := func(key string) string {
		switch key {
		case "THREADS_BASE_URL":
			return srv.URL
		case "THREADS_API_TOKEN":
			return "tok"
		case "THREADS_CHANNEL_ID":
			return "ch1"
		case "THREADS_THREAD_ID":
			return "msg1"
		default:
			return ""
		}
	}
	var stdout, stderr bytes.Buffer
	if err := run(context.Background(), []string{"send", "--metadata-json", `{"artifact":"log"}`}, getenv, bytes.NewBufferString("working\n"), &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if gotAuth != "Bearer tok" || gotPath != "/channels/ch1/messages" {
		t.Fatalf("bad request auth=%q path=%q", gotAuth, gotPath)
	}
	if got.Content != "working" || got.ThreadID != "msg1" || got.MessageType != "agent_update" {
		t.Fatalf("bad body: %+v", got)
	}
	if got.Metadata["source"] != "threads-cli" || got.Metadata["kind"] != "interim" || got.Metadata["artifact"] != "log" {
		t.Fatalf("bad metadata: %+v", got.Metadata)
	}
	if stdout.String() != "sent\n" {
		t.Fatalf("stdout=%q stderr=%q", stdout.String(), stderr.String())
	}
}

func TestSendUploadsFilesAndImages(t *testing.T) {
	dir := t.TempDir()
	filePath := filepath.Join(dir, "notes.txt")
	imagePath := filepath.Join(dir, "photo.png")
	if err := os.WriteFile(filePath, []byte("hello"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(imagePath, []byte("png"), 0o600); err != nil {
		t.Fatal(err)
	}

	var uploads []string
	var got threads.SendMessageRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/uploads":
			if !strings.HasPrefix(r.Header.Get("Content-Type"), "multipart/form-data") {
				t.Fatalf("bad upload content-type: %s", r.Header.Get("Content-Type"))
			}
			if err := r.ParseMultipartForm(32 << 20); err != nil {
				t.Fatal(err)
			}
			files := r.MultipartForm.File["file"]
			if len(files) != 1 {
				t.Fatalf("expected one file, got %d", len(files))
			}
			filename := files[0].Filename
			uploads = append(uploads, filename)
			_ = json.NewEncoder(w).Encode(threads.Attachment{ID: "att_" + filename, Filename: filename})
		case "/channels/ch1/messages":
			if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
				t.Fatal(err)
			}
			w.WriteHeader(http.StatusCreated)
		default:
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
	}))
	defer srv.Close()
	getenv := func(key string) string {
		switch key {
		case "THREADS_BASE_URL":
			return srv.URL
		case "THREADS_API_TOKEN":
			return "tok"
		case "THREADS_CHANNEL_ID":
			return "ch1"
		default:
			return ""
		}
	}
	var stdout, stderr bytes.Buffer
	args := []string{"send", "--content", "see attached", "--file", filePath, "--image", imagePath, "--attachment-ids", "att_existing"}
	if err := run(context.Background(), args, getenv, bytes.NewBuffer(nil), &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if strings.Join(uploads, ",") != "notes.txt,photo.png" {
		t.Fatalf("uploads=%v", uploads)
	}
	wantIDs := "att_existing,att_notes.txt,att_photo.png"
	if strings.Join(got.AttachmentIDs, ",") != wantIDs {
		t.Fatalf("attachment ids=%v want %s body=%+v", got.AttachmentIDs, wantIDs, got)
	}
	if got.Content != "see attached" {
		t.Fatalf("content=%q", got.Content)
	}
}

func TestSendAllowsAttachmentOnlyMessage(t *testing.T) {
	var got threads.SendMessageRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Fatal(err)
		}
		w.WriteHeader(http.StatusCreated)
	}))
	defer srv.Close()
	getenv := func(key string) string {
		switch key {
		case "THREADS_BASE_URL":
			return srv.URL
		case "THREADS_API_TOKEN":
			return "tok"
		case "THREADS_CHANNEL_ID":
			return "ch1"
		default:
			return ""
		}
	}
	var stdout, stderr bytes.Buffer
	if err := run(context.Background(), []string{"send", "--attachment-ids", "att1"}, getenv, bytes.NewBuffer(nil), &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if got.Content != "" || strings.Join(got.AttachmentIDs, ",") != "att1" {
		t.Fatalf("bad body: %+v", got)
	}
}

func TestReactUsesEnvDefaults(t *testing.T) {
	var gotAuth, gotPath string
	var got map[string]string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotPath = r.URL.Path
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Fatal(err)
		}
		w.WriteHeader(http.StatusCreated)
	}))
	defer srv.Close()
	getenv := func(key string) string {
		switch key {
		case "THREADS_BASE_URL":
			return srv.URL
		case "THREADS_API_TOKEN":
			return "tok"
		case "THREADS_MESSAGE_ID":
			return "msg1"
		default:
			return ""
		}
	}
	var stdout, stderr bytes.Buffer
	if err := run(context.Background(), []string{"react", "--emoji", "✅"}, getenv, bytes.NewBuffer(nil), &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if gotAuth != "Bearer tok" || gotPath != "/messages/msg1/reactions" || got["emoji"] != "✅" {
		t.Fatalf("bad reaction request auth=%q path=%q body=%v", gotAuth, gotPath, got)
	}
	if stdout.String() != "reacted\n" {
		t.Fatalf("stdout=%q stderr=%q", stdout.String(), stderr.String())
	}
}

func TestReactCanTargetAnyMessageID(t *testing.T) {
	var gotPath string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		w.WriteHeader(http.StatusCreated)
	}))
	defer srv.Close()
	getenv := func(key string) string {
		switch key {
		case "THREADS_BASE_URL":
			return srv.URL
		case "THREADS_API_TOKEN":
			return "tok"
		case "THREADS_MESSAGE_ID":
			return "trigger-msg"
		default:
			return ""
		}
	}
	var stdout, stderr bytes.Buffer
	if err := run(context.Background(), []string{"react", "--message-id", "other-msg", "--emoji", "🚀"}, getenv, bytes.NewBuffer(nil), &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if gotPath != "/messages/other-msg/reactions" {
		t.Fatalf("got path %q", gotPath)
	}
}

func TestTitleUsesRootEnvDefaultAndIfUnset(t *testing.T) {
	var gotAuth, gotPath string
	var got threads.SetThreadTitleRequest
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotPath = r.URL.Path
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Fatal(err)
		}
		_ = json.NewEncoder(w).Encode(threads.SetThreadTitleResponse{OK: true, Applied: true, ThreadID: "root-1", ThreadTitle: got.Title, ThreadTitleUpdatedAt: 123})
	}))
	defer srv.Close()
	getenv := func(key string) string {
		switch key {
		case "THREADS_BASE_URL":
			return srv.URL
		case "THREADS_API_TOKEN":
			return "tok"
		case "THREADS_THREAD_ID":
			return "root-1"
		case "THREADS_MESSAGE_ID":
			return "reply-1"
		default:
			return ""
		}
	}
	var stdout, stderr bytes.Buffer
	if err := run(context.Background(), []string{"title", "--title", "  Investigate   reconnects  ", "--if-unset"}, getenv, bytes.NewBuffer(nil), &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if gotAuth != "Bearer tok" || gotPath != "/messages/root-1/thread-title" || got.Title != "Investigate reconnects" || !got.IfUnset {
		t.Fatalf("request auth=%q path=%q body=%+v", gotAuth, gotPath, got)
	}
	if stdout.String() != "titled\n" {
		t.Fatalf("stdout=%q stderr=%q", stdout.String(), stderr.String())
	}
}

func TestTitleReportsExistingTitleAsUnchanged(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(threads.SetThreadTitleResponse{OK: true, Applied: false, ThreadID: "root-1", ThreadTitle: "Human title", ThreadTitleUpdatedAt: 123})
	}))
	defer srv.Close()
	getenv := func(key string) string {
		switch key {
		case "THREADS_BASE_URL":
			return srv.URL
		case "THREADS_API_TOKEN":
			return "tok"
		case "THREADS_THREAD_ID":
			return "root-1"
		default:
			return ""
		}
	}
	var stdout, stderr bytes.Buffer
	if err := run(context.Background(), []string{"title", "--title", "Generated title", "--if-unset"}, getenv, bytes.NewBuffer(nil), &stdout, &stderr); err != nil {
		t.Fatal(err)
	}
	if stdout.String() != "unchanged\n" {
		t.Fatalf("stdout=%q stderr=%q", stdout.String(), stderr.String())
	}
}

func TestSendRequiresContent(t *testing.T) {
	getenv := func(key string) string {
		switch key {
		case "THREADS_BASE_URL":
			return "http://threads.test"
		case "THREADS_API_TOKEN":
			return "tok"
		case "THREADS_CHANNEL_ID":
			return "ch1"
		default:
			return ""
		}
	}
	var stdout, stderr bytes.Buffer
	if err := run(context.Background(), []string{"send"}, getenv, bytes.NewBuffer(nil), &stdout, &stderr); err == nil {
		t.Fatal("expected error")
	}
}

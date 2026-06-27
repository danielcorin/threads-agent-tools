package threads

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

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

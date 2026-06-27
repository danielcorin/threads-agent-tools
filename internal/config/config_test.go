package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadDefaultsAndTokenEnv(t *testing.T) {
	t.Setenv("THREADS_TOKEN_TEST", "secret")
	path := filepath.Join(t.TempDir(), "config.json")
	if err := os.WriteFile(path, []byte(`{
		"scopes":[{"id":"s1","threads":{"base_url":"https://threads","token_env":"THREADS_TOKEN_TEST"},"runner":{}}]
	}`), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.DatabasePath == "" || cfg.Scopes[0].Runner.Command != "codex" {
		t.Fatalf("defaults not applied: %+v", cfg)
	}
	token, err := cfg.Scopes[0].Token()
	if err != nil || token != "secret" {
		t.Fatalf("token = %q, err=%v", token, err)
	}
}

func TestLoadClaudeCodeDefaults(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.json")
	if err := os.WriteFile(path, []byte(`{
		"scopes":[{"id":"s1","threads":{"base_url":"https://threads","token":"secret"},"runner":{"type":"claude-code"}}]
	}`), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Scopes[0].Runner.Command != "claude" || !contains(cfg.Scopes[0].Runner.Args, "stream-json") {
		t.Fatalf("claude defaults not applied: %+v", cfg.Scopes[0].Runner)
	}
}

func TestScopeMatchesDefaultsToNone(t *testing.T) {
	s := Scope{}
	if s.Matches("c1", "t1") || s.Matches("c2", "") {
		t.Fatal("empty match config should not match delivered events")
	}
}

func TestScopeMatchesWildcardAll(t *testing.T) {
	s := Scope{Match: MatchConfig{ChannelIDs: []string{"*"}, ThreadIDs: []string{"*"}}}
	if !s.Matches("c1", "t1") || !s.Matches("c2", "") {
		t.Fatal("wildcard match config should match all delivered events")
	}
}

func TestScopeMatchesAllowlists(t *testing.T) {
	s := Scope{Match: MatchConfig{ChannelIDs: []string{"c1"}, ThreadIDs: []string{"t1"}}}
	if !s.Matches("c1", "t1") {
		t.Fatal("expected configured channel/thread to match")
	}
	if s.Matches("c2", "t1") {
		t.Fatal("unexpected channel match")
	}
	if s.Matches("c1", "t2") {
		t.Fatal("unexpected thread match")
	}
}

func TestLoadPiDefaults(t *testing.T) {
	path := filepath.Join(t.TempDir(), "config.json")
	if err := os.WriteFile(path, []byte(`{
		"scopes":[{"id":"s1","threads":{"base_url":"https://threads","token":"secret"},"runner":{"type":"pi"}}]
	}`), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg, err := Load(path)
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Scopes[0].Runner.Command != "pi" || !contains(cfg.Scopes[0].Runner.Args, "json") {
		t.Fatalf("pi defaults not applied: %+v", cfg.Scopes[0].Runner)
	}
}

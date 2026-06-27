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

func TestScopeMatches(t *testing.T) {
	s := Scope{Match: MatchConfig{ChannelIDs: []string{"c1"}}}
	if !s.Matches("c1", "") || s.Matches("c2", "") {
		t.Fatal("unexpected match result")
	}
}

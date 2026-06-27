package runner

import "testing"

func TestParseJSONLText(t *testing.T) {
	got := parseJSONLText([]byte("{\"type\":\"x\",\"text\":\"hello\"}\nnot-json\n{\"content\":\"world\"}\n"))
	if got != "hello\nworld" {
		t.Fatalf("got %q", got)
	}
}

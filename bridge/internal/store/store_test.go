package store

import (
	"context"
	"path/filepath"
	"testing"
)

func TestCursorAndDedupe(t *testing.T) {
	s, err := Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer s.Close()
	ctx := context.Background()
	if err := s.SaveCursor(ctx, "s1", "c1"); err != nil {
		t.Fatal(err)
	}
	cursor, err := s.Cursor(ctx, "s1")
	if err != nil || cursor != "c1" {
		t.Fatalf("cursor=%q err=%v", cursor, err)
	}
	fresh, err := s.MarkProcessed(ctx, "s1", "e1")
	if err != nil || !fresh {
		t.Fatalf("first fresh=%v err=%v", fresh, err)
	}
	fresh, err = s.MarkProcessed(ctx, "s1", "e1")
	if err != nil || fresh {
		t.Fatalf("second fresh=%v err=%v", fresh, err)
	}
}

package store

import (
	"context"
	"database/sql"
	"time"

	_ "modernc.org/sqlite"
)

type Store struct{ db *sql.DB }

func Open(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	s := &Store{db: db}
	if err := s.Migrate(context.Background()); err != nil {
		_ = db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) Migrate(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS event_cursors (
  scope_id TEXT PRIMARY KEY,
  cursor TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS processed_events (
  scope_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  PRIMARY KEY (scope_id, event_id)
);
CREATE TABLE IF NOT EXISTS sessions (
  scope_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  thread_id TEXT NOT NULL DEFAULT '',
  runner_session_id TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (scope_id, channel_id, thread_id)
);`)
	return err
}

func (s *Store) Cursor(ctx context.Context, scopeID string) (string, error) {
	var cursor string
	err := s.db.QueryRowContext(ctx, `SELECT cursor FROM event_cursors WHERE scope_id = ?`, scopeID).Scan(&cursor)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return cursor, err
}

func (s *Store) SaveCursor(ctx context.Context, scopeID, cursor string) error {
	if cursor == "" {
		return nil
	}
	_, err := s.db.ExecContext(ctx, `INSERT INTO event_cursors(scope_id, cursor, updated_at)
VALUES(?, ?, ?) ON CONFLICT(scope_id) DO UPDATE SET cursor=excluded.cursor, updated_at=excluded.updated_at`, scopeID, cursor, now())
	return err
}

func (s *Store) MarkProcessed(ctx context.Context, scopeID, eventID string) (bool, error) {
	if eventID == "" {
		return true, nil
	}
	res, err := s.db.ExecContext(ctx, `INSERT OR IGNORE INTO processed_events(scope_id, event_id, processed_at) VALUES(?, ?, ?)`, scopeID, eventID, now())
	if err != nil {
		return false, err
	}
	rows, err := res.RowsAffected()
	return rows == 1, err
}

func (s *Store) RunnerSessionID(ctx context.Context, scopeID, channelID, threadID string) (string, error) {
	var sessionID string
	err := s.db.QueryRowContext(ctx, `SELECT runner_session_id FROM sessions WHERE scope_id = ? AND channel_id = ? AND thread_id = ?`, scopeID, channelID, threadID).Scan(&sessionID)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return sessionID, err
}

func (s *Store) SaveRunnerSessionID(ctx context.Context, scopeID, channelID, threadID, sessionID string) error {
	if sessionID == "" {
		return nil
	}
	_, err := s.db.ExecContext(ctx, `INSERT INTO sessions(scope_id, channel_id, thread_id, runner_session_id, updated_at)
VALUES(?, ?, ?, ?, ?) ON CONFLICT(scope_id, channel_id, thread_id) DO UPDATE SET runner_session_id=excluded.runner_session_id, updated_at=excluded.updated_at`, scopeID, channelID, threadID, sessionID, now())
	return err
}

func now() string { return time.Now().UTC().Format(time.RFC3339Nano) }

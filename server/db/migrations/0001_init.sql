-- Stage 0: sessions + audit_log only.
-- All game tables must include session_id partition (see GOFOOT_PROMPT §26.3).

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions (token_hash);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  hmac TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (session_id, seq),
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_session ON audit_log (session_id, seq);

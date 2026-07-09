-- Full game schema (session_id partition on every save-bound table)

CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY NOT NULL,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS career_state (
  session_id TEXT PRIMARY KEY NOT NULL,
  club_id TEXT NOT NULL,
  season INTEGER NOT NULL DEFAULT 2026,
  division TEXT NOT NULL DEFAULT 'serie_d',
  reputation INTEGER NOT NULL DEFAULT 20,
  cash REAL NOT NULL DEFAULT 500000,
  board_confidence INTEGER NOT NULL DEFAULT 60,
  season_day INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE IF NOT EXISTS squad_players (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  club_id TEXT NOT NULL,
  player_key TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  age INTEGER NOT NULL,
  overall INTEGER NOT NULL,
  pace INTEGER NOT NULL,
  shooting INTEGER NOT NULL,
  passing INTEGER NOT NULL,
  defending INTEGER NOT NULL,
  physical INTEGER NOT NULL,
  morale INTEGER NOT NULL DEFAULT 70,
  fitness INTEGER NOT NULL DEFAULT 100,
  wage REAL NOT NULL DEFAULT 1000,
  value REAL NOT NULL DEFAULT 100000,
  shirt_number INTEGER,
  starter INTEGER NOT NULL DEFAULT 0,
  UNIQUE (session_id, player_key),
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);
CREATE INDEX IF NOT EXISTS idx_squad_session ON squad_players (session_id, club_id);

CREATE TABLE IF NOT EXISTS fixtures (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  season INTEGER NOT NULL,
  matchday INTEGER NOT NULL,
  home_club_id TEXT NOT NULL,
  away_club_id TEXT NOT NULL,
  kickoff_day INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  home_goals INTEGER,
  away_goals INTEGER,
  seed TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);
CREATE INDEX IF NOT EXISTS idx_fixtures_session ON fixtures (session_id, status, kickoff_day);

CREATE TABLE IF NOT EXISTS match_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  fixture_id TEXT NOT NULL,
  events_json TEXT NOT NULL,
  home_goals INTEGER NOT NULL,
  away_goals INTEGER NOT NULL,
  hmac TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (session_id, fixture_id),
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE IF NOT EXISTS league_table (
  session_id TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  club_id TEXT NOT NULL,
  played INTEGER NOT NULL DEFAULT 0,
  won INTEGER NOT NULL DEFAULT 0,
  drawn INTEGER NOT NULL DEFAULT 0,
  lost INTEGER NOT NULL DEFAULT 0,
  gf INTEGER NOT NULL DEFAULT 0,
  ga INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, competition_id, club_id)
);

CREATE TABLE IF NOT EXISTS finance_ledger (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  day INTEGER NOT NULL,
  kind TEXT NOT NULL,
  amount REAL NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);
CREATE INDEX IF NOT EXISTS idx_finance_session ON finance_ledger (session_id, day);

CREATE TABLE IF NOT EXISTS ticket_pricing (
  session_id TEXT PRIMARY KEY NOT NULL,
  base_price REAL NOT NULL DEFAULT 40,
  elasticity REAL NOT NULL DEFAULT 0.35,
  last_attendance INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  tier TEXT NOT NULL,
  weekly_fee REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  rounds_json TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE IF NOT EXISTS bank_loans (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  principal REAL NOT NULL,
  remaining REAL NOT NULL,
  installment REAL NOT NULL,
  weeks_left INTEGER NOT NULL,
  interest_rate REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE IF NOT EXISTS stadium (
  session_id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 15000,
  north INTEGER NOT NULL DEFAULT 4000,
  south INTEGER NOT NULL DEFAULT 4000,
  east INTEGER NOT NULL DEFAULT 3500,
  west INTEGER NOT NULL DEFAULT 3500,
  level INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE IF NOT EXISTS inbox_messages (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE IF NOT EXISTS web_cache (
  cache_key TEXT PRIMARY KEY NOT NULL,
  payload_json TEXT NOT NULL,
  fetched_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_state (
  job_name TEXT PRIMARY KEY NOT NULL,
  last_run_at INTEGER,
  last_status TEXT,
  meta_json TEXT
);

CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  hmac TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (session_id, seq),
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

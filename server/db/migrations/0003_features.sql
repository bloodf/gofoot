-- Tactics, transfers, fantasy, youth, patches, cups

CREATE TABLE IF NOT EXISTS tactics (
  session_id TEXT PRIMARY KEY NOT NULL,
  formation TEXT NOT NULL DEFAULT '4-3-3',
  mentality TEXT NOT NULL DEFAULT 'balanced',
  pressing INTEGER NOT NULL DEFAULT 50,
  tempo INTEGER NOT NULL DEFAULT 50,
  width INTEGER NOT NULL DEFAULT 50,
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE IF NOT EXISTS transfer_list (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  player_key TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  overall INTEGER NOT NULL,
  age INTEGER NOT NULL,
  asking_price REAL NOT NULL,
  wage REAL NOT NULL,
  club_from TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'listed',
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);
CREATE INDEX IF NOT EXISTS idx_transfer_session ON transfer_list (session_id, status);

CREATE TABLE IF NOT EXISTS fantasy_saves (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  club_id TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  state_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE IF NOT EXISTS youth_players (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  age INTEGER NOT NULL,
  potential INTEGER NOT NULL,
  overall INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'academy',
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

CREATE TABLE IF NOT EXISTS patches_installed (
  session_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  installed_at INTEGER NOT NULL,
  PRIMARY KEY (session_id, slug)
);

CREATE TABLE IF NOT EXISTS cup_ties (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  competition_id TEXT NOT NULL,
  round TEXT NOT NULL,
  home_club_id TEXT NOT NULL,
  away_club_id TEXT NOT NULL,
  home_goals INTEGER,
  away_goals INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  seed TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions (id)
);

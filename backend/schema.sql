-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Tracks each IPL season
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,            -- '2025', '2026'
  name TEXT NOT NULL,             -- 'IPL 2025'
  is_active BOOLEAN DEFAULT FALSE, -- only one season is active at a time
  start_date DATE,
  end_date DATE
);

-- The 8 friend groups — same across all seasons
CREATE TABLE IF NOT EXISTS fantasy_teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  color_primary TEXT DEFAULT '#000000',
  color_secondary TEXT DEFAULT '#ffffff',
  championships TEXT DEFAULT '0',  -- total titles won across all seasons
  captain TEXT DEFAULT '',
  coach TEXT DEFAULT '',
  owner TEXT DEFAULT '',
  venue TEXT DEFAULT ''
);

-- Player auction results — change every season
-- 'name' must exactly match the IPL Fantasy API player.Name field
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  ipl_team TEXT DEFAULT '',
  fantasy_team_id TEXT NOT NULL REFERENCES fantasy_teams(id),
  season TEXT NOT NULL REFERENCES seasons(id),
  is_captain BOOLEAN DEFAULT FALSE,   -- gets 1.2x points multiplier
  is_overseas BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'Batter',
  UNIQUE(name, season)                -- same player can be on different teams across seasons
);

-- Daily snapshot of each player's cumulative OverallPoints from the IPL Fantasy API
CREATE TABLE IF NOT EXISTS player_points_history (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  season TEXT NOT NULL REFERENCES seasons(id),
  player_name TEXT NOT NULL,
  points NUMERIC(10,2) DEFAULT 0,
  fantasy_team_id TEXT REFERENCES fantasy_teams(id),
  UNIQUE(snapshot_date, player_name, season)
);

-- Trades between fantasy teams
CREATE TABLE IF NOT EXISTS trades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_date  DATE NOT NULL,
  season      TEXT NOT NULL REFERENCES seasons(id),
  team_a_id   TEXT NOT NULL REFERENCES fantasy_teams(id),
  team_b_id   TEXT NOT NULL REFERENCES fantasy_teams(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Individual player legs of each trade
CREATE TABLE IF NOT EXISTS trade_players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id     UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  player_id    INTEGER NOT NULL REFERENCES players(id),
  from_team_id TEXT NOT NULL REFERENCES fantasy_teams(id),
  to_team_id   TEXT NOT NULL REFERENCES fantasy_teams(id)
);

CREATE INDEX IF NOT EXISTS idx_trades_team_a       ON trades(team_a_id);
CREATE INDEX IF NOT EXISTS idx_trades_team_b       ON trades(team_b_id);
CREATE INDEX IF NOT EXISTS idx_trades_season       ON trades(season);
CREATE INDEX IF NOT EXISTS idx_trade_players_trade ON trade_players(trade_id);

-- Daily snapshot of each fantasy team's total points
CREATE TABLE IF NOT EXISTS team_points_history (
  id SERIAL PRIMARY KEY,
  snapshot_date DATE NOT NULL,
  season TEXT NOT NULL REFERENCES seasons(id),
  fantasy_team_id TEXT REFERENCES fantasy_teams(id),
  total_points NUMERIC(10,2) DEFAULT 0,
  UNIQUE(snapshot_date, fantasy_team_id, season)
);

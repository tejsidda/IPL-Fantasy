# Database Schema Reference

Supabase (PostgreSQL). Run all SQL in **Dashboard → SQL Editor**.

---

## Tables

### `seasons`
Tracks each IPL season. Only one season is active at a time.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Year string — `'2025'`, `'2026'` |
| `name` | TEXT | Display name — `'IPL 2025'` |
| `is_active` | BOOLEAN | Only one row should be `true` at once |
| `start_date` | DATE | |
| `end_date` | DATE | Nullable — set when season ends |

---

### `fantasy_teams`
The 8 friend groups. Same rows across all seasons — season data lives in child tables.

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | Short slug — `'tr'`, `'ab'`, `'kp'`, etc. |
| `name` | TEXT | Full display name — `'Tej & Rixith'` |
| `short_name` | TEXT | Abbreviation used for logos — `'TR'` |
| `color_primary` | TEXT | Hex — `'#8E2DE2'` |
| `color_secondary` | TEXT | Hex — `'#4A00E0'` |
| `championships` | TEXT | Total titles won, stored as string — `'1'` |
| `captain` | TEXT | Legacy — not displayed in UI |
| `coach` | TEXT | Legacy — not displayed in UI |
| `owner` | TEXT | Shown as team owners subtitle on detail page |
| `venue` | TEXT | Legacy — not displayed in UI |

---

### `players`
Auction results — one row per player per season. Names must match IPL Fantasy API exactly for points sync to work.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | Auto |
| `name` | TEXT | Must match `p.Name` in IPL Fantasy API |
| `ipl_team` | TEXT | IPL franchise abbreviation — `'RCB'`, `'CSK'` |
| `fantasy_team_id` | TEXT FK → `fantasy_teams.id` | |
| `season` | TEXT FK → `seasons.id` | |
| `is_captain` | BOOLEAN | First player per team in sheet = captain (1.2× multiplier) |
| `is_overseas` | BOOLEAN | |
| `role` | TEXT | `'Batter'` / `'Bowler'` / `'All-Rounder'` / `'WK-Batter'` |
| `player_api_id` | TEXT | IPL Fantasy API player ID — used to build photo URL |
| `ipl_team_id` | INTEGER | Numeric IPL team ID (e.g. `1111` for MI) — required for card-stats API calls |

**Constraints:** `UNIQUE(name, season)` — same player can be on different teams across seasons.

**Photo URL pattern:** `https://fantasy.iplt20.com/classic/static-assets/build/images/players/onpitch/{player_api_id}.png`

---

### `player_points_history`
One row per player per day per season. Populated by the sync job.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | Auto |
| `snapshot_date` | DATE | Date of sync — `YYYY-MM-DD` |
| `season` | TEXT FK → `seasons.id` | |
| `player_name` | TEXT | Matches `players.name` |
| `points` | NUMERIC(10,2) | Cumulative `OverallPoints` from IPL Fantasy API (captain gets 1.2×) |
| `fantasy_team_id` | TEXT FK → `fantasy_teams.id` | Denormalised for fast leaderboard queries |

**Constraints:** `UNIQUE(snapshot_date, player_name, season)`

**Key behaviour:** sync does an UPSERT — syncing multiple times on the same day overwrites the row. "Today's gain" = today's row − yesterday's row.

---

### `team_points_history`
One row per fantasy team per day per season. Calculated from `player_points_history` during sync, or imported from the Points History sheet.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | Auto |
| `snapshot_date` | DATE | |
| `season` | TEXT FK → `seasons.id` | |
| `fantasy_team_id` | TEXT FK → `fantasy_teams.id` | |
| `total_points` | NUMERIC(10,2) | Sum of all players' points for this team on this date |

**Constraints:** `UNIQUE(snapshot_date, fantasy_team_id, season)`

---

### `trades`
One row per trade event (always between exactly two teams).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` |
| `trade_date` | DATE | When the trade happened — can be backdated |
| `season` | TEXT FK → `seasons.id` | |
| `team_a_id` | TEXT FK → `fantasy_teams.id` | |
| `team_b_id` | TEXT FK → `fantasy_teams.id` | |
| `notes` | TEXT | Optional label (e.g. "injury swap") |
| `created_at` | TIMESTAMPTZ | Auto |

---

### `trade_players`
One row per player per trade. Many-for-one trades have multiple rows per trade.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `trade_id` | UUID FK → `trades.id` | `ON DELETE CASCADE` |
| `player_id` | INTEGER FK → `players.id` | |
| `from_team_id` | TEXT FK → `fantasy_teams.id` | Team giving the player |
| `to_team_id` | TEXT FK → `fantasy_teams.id` | Team receiving the player |

**Win/loss calculation:** net = Σ(received player points) − Σ(given player points). Two modes: all-time (`player_points_history` latest snapshot) or since-trade (latest minus snapshot closest to `trade_date`).

---

### `player_gameday_stats`
One row per player per match per season. Populated by Admin → Sync Match Stats.

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | Auto |
| `season` | TEXT FK → `seasons.id` | |
| `player_api_id` | TEXT | IPL Fantasy API player ID |
| `player_name` | TEXT | Denormalised for display |
| `fantasy_team_id` | TEXT FK → `fantasy_teams.id` | Denormalised |
| `gameday_id` | INTEGER | IPL `TourGamedayId` — unique per match |
| `match_label` | TEXT | e.g. `'MI vs CSK'` |
| `match_date` | TEXT | ISO date string from fixtures API |
| `runs_points` | NUMERIC | |
| `four_points` | NUMERIC | |
| `six_points` | NUMERIC | |
| `thirty_bonus` | NUMERIC | |
| `half_century` | NUMERIC | |
| `full_century` | NUMERIC | |
| `run_bonus` | NUMERIC | |
| `strike_rate` | NUMERIC | |
| `duck_out` | NUMERIC | |
| `wicket_points` | NUMERIC | |
| `wkt_bonus` | NUMERIC | |
| `two_wk_haul` | NUMERIC | |
| `three_wk_haul` | NUMERIC | |
| `four_wk_haul` | NUMERIC | |
| `five_wk_haul` | NUMERIC | |
| `economy_rate` | NUMERIC | |
| `dot_bonus` | NUMERIC | |
| `hat_trick` | NUMERIC | |
| `catch_points` | NUMERIC | |
| `catch_bonus` | NUMERIC | |
| `stumping` | NUMERIC | |
| `direct_run_out` | NUMERIC | |
| `run_out` | NUMERIC | |
| `played_points` | NUMERIC | |
| `mom_points` | NUMERIC | |
| `overall_points` | NUMERIC | Total fantasy points for this match |

**Constraints:** `UNIQUE(player_api_id, gameday_id, season)`

**Source:** IPL card-stats API — `https://fantasy.iplt20.com/classic/api/feed/gameday-player/card-stats?teamId={ipl_team_id}&playerId={player_api_id}&gamedayId={gameday_id}`. Only rows where `IsPlayed = '1'` are stored.

---

## Relationships

```
seasons
  └── players (season FK)
  └── player_points_history (season FK)
  └── team_points_history (season FK)
  └── player_gameday_stats (season FK)
  └── trades (season FK)

fantasy_teams
  └── players (fantasy_team_id FK)
  └── player_points_history (fantasy_team_id FK)
  └── team_points_history (fantasy_team_id FK)
  └── player_gameday_stats (fantasy_team_id FK)
  └── trades (team_a_id / team_b_id FK)
  └── trade_players (from_team_id / to_team_id FK)

trades
  └── trade_players (trade_id FK, ON DELETE CASCADE)
```

---

## IPL Fantasy API

| Endpoint | URL |
|---|---|
| Tour fixtures | `https://fantasy.iplt20.com/classic/api/feed/tour-fixtures?lang=en&liveVersion={liveVersion}` |
| Gameday players | `https://fantasy.iplt20.com/classic/api/feed/gamedayplayers?lang=en&tourgamedayId={id}` |

**Player role mapping via `SkillName` / `SkillId`:**

| SkillId | SkillName | Role |
|---|---|---|
| 1 | BATSMAN | Batter |
| 2 | BOWLER | Bowler |
| 3 | ALL ROUNDER | All-Rounder |
| 4 | WICKET KEEPER | WK-Batter |

String matching on `SkillName` takes priority; falls back to numeric `SkillId`. (Old fields `SubtypeId` / `PlayingRole` / `PlyingRole` no longer appear in the API.)

**Card-stats API:** `https://fantasy.iplt20.com/classic/api/feed/gameday-player/card-stats?teamId={ipl_team_id}&playerId={player_api_id}&gamedayId={gameday_id}`
Requires `ipl_team_id` (numeric, sourced from `p.TeamId` in the gamedayplayers feed).

**Fixtures API:** `https://fantasy.iplt20.com/classic/api/feed/tour-fixtures?lang=en&liveVersion={liveVersion}`
`liveVersion` = `MMDDYYYYHHMMSS` timestamp generated at call time. `MatchStatus == 2` = completed.

---

## Schema Changelog

| Date | Change | SQL |
|---|---|---|
| 2026-04 (initial) | Create all 5 tables | `backend/schema.sql` |
| 2026-04 | Add `player_api_id` column to `players` | `ALTER TABLE players ADD COLUMN IF NOT EXISTS player_api_id TEXT DEFAULT '';` |
| 2026-04 | Add `ipl_team_id` column to `players` | `ALTER TABLE players ADD COLUMN IF NOT EXISTS ipl_team_id INTEGER DEFAULT 0;` |
| 2026-04 | Create `player_gameday_stats` table | See full DDL below |
| 2026-04-27 | Create `trades` and `trade_players` tables + indexes | See `backend/schema.sql` |
| 2026-04-27 | Add `dbId` (players.id) to `/api/teams/:id` player response | Backend only — no migration needed |

**`player_gameday_stats` DDL:**
```sql
CREATE TABLE IF NOT EXISTS player_gameday_stats (
  id               SERIAL PRIMARY KEY,
  season           TEXT REFERENCES seasons(id),
  player_api_id    TEXT NOT NULL,
  player_name      TEXT,
  fantasy_team_id  TEXT REFERENCES fantasy_teams(id),
  gameday_id       INTEGER NOT NULL,
  match_label      TEXT,
  match_date       TEXT,
  runs_points      NUMERIC(8,2) DEFAULT 0,
  four_points      NUMERIC(8,2) DEFAULT 0,
  six_points       NUMERIC(8,2) DEFAULT 0,
  thirty_bonus     NUMERIC(8,2) DEFAULT 0,
  half_century     NUMERIC(8,2) DEFAULT 0,
  full_century     NUMERIC(8,2) DEFAULT 0,
  run_bonus        NUMERIC(8,2) DEFAULT 0,
  strike_rate      NUMERIC(8,2) DEFAULT 0,
  duck_out         NUMERIC(8,2) DEFAULT 0,
  wicket_points    NUMERIC(8,2) DEFAULT 0,
  wkt_bonus        NUMERIC(8,2) DEFAULT 0,
  two_wk_haul      NUMERIC(8,2) DEFAULT 0,
  three_wk_haul    NUMERIC(8,2) DEFAULT 0,
  four_wk_haul     NUMERIC(8,2) DEFAULT 0,
  five_wk_haul     NUMERIC(8,2) DEFAULT 0,
  economy_rate     NUMERIC(8,2) DEFAULT 0,
  dot_bonus        NUMERIC(8,2) DEFAULT 0,
  hat_trick        NUMERIC(8,2) DEFAULT 0,
  catch_points     NUMERIC(8,2) DEFAULT 0,
  catch_bonus      NUMERIC(8,2) DEFAULT 0,
  stumping         NUMERIC(8,2) DEFAULT 0,
  direct_run_out   NUMERIC(8,2) DEFAULT 0,
  run_out          NUMERIC(8,2) DEFAULT 0,
  played_points    NUMERIC(8,2) DEFAULT 0,
  mom_points       NUMERIC(8,2) DEFAULT 0,
  overall_points   NUMERIC(8,2) DEFAULT 0,
  UNIQUE(player_api_id, gameday_id, season)
);
```

> **Rule:** any column addition, removal, or constraint change must be added to this table before being deployed. Include the exact SQL so the Supabase SQL Editor step is reproducible.

---

## Initial Setup Checklist

1. Run `backend/schema.sql` in Supabase SQL Editor
2. Run `ALTER TABLE players ADD COLUMN IF NOT EXISTS player_api_id TEXT DEFAULT '';`
3. Run `ALTER TABLE players ADD COLUMN IF NOT EXISTS ipl_team_id INTEGER DEFAULT 0;`
4. Run the `player_gameday_stats` DDL above
5. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `backend/.env`
6. Create seasons via Admin page
7. Import player assignments via Admin → Import Players
8. Click "Refresh Player Roles & Photos" in Admin to populate `player_api_id`, `ipl_team_id`, and roles
9. Click "Sync Now" to fetch live points
10. Click "Sync Match Stats" in Admin to backfill per-match breakdown (takes ~1–2 min first run)

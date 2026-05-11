import { Team } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface TopPerformer {
  name: string;
  team: string;
  points: number;
  apiId?: string | null;
}

export interface ChartDataPoint {
  name: string;
  day: number;
  [teamName: string]: number | string;
}

export interface LeaderboardData {
  standings: Team[];
  chartData: ChartDataPoint[];
  topPerformers: TopPerformer[];
  topPerformerType?: 'gains' | 'totals';
}

export interface Season {
  id: string;
  name: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

export async function fetchSeasons(): Promise<Season[]> {
  const res = await fetch(`${API_URL}/api/seasons`);
  if (!res.ok) throw new Error('Failed to fetch seasons');
  return res.json();
}

let _teamsCache: Promise<Team[]> | null = null;
export async function fetchTeams(season?: string): Promise<Team[]> {
  const params = season ? `?season=${season}` : '';
  if (!season && _teamsCache) return _teamsCache;
  const p = fetch(`${API_URL}/api/teams${params}`)
    .then(res => { if (!res.ok) throw new Error('Failed to fetch teams'); return res.json() as Promise<Team[]>; })
    .catch(err => { if (!season) _teamsCache = null; throw err; });
  if (!season) _teamsCache = p;
  return p;
}

const _teamCache = new Map<string, { promise: Promise<Team>; at: number }>();
const TEAM_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
export function clearTeamCache(id?: string) {
  if (id) { _teamCache.forEach((_, k) => { if (k.startsWith(id)) _teamCache.delete(k); }); }
  else _teamCache.clear();
}

export async function fetchTeam(id: string, season?: string): Promise<Team> {
  const params = season ? `?season=${season}` : '';
  const cacheKey = `${id}${params}`;
  const cached = _teamCache.get(cacheKey);
  if (cached && Date.now() - cached.at < TEAM_CACHE_TTL) return cached.promise;
  const p = fetch(`${API_URL}/api/teams/${id}${params}`)
    .then(res => { if (!res.ok) throw new Error('Team not found'); return res.json() as Promise<Team>; })
    .catch(err => { _teamCache.delete(cacheKey); throw err; });
  _teamCache.set(cacheKey, { promise: p, at: Date.now() });
  return p;
}

export async function fetchLeaderboard(season?: string): Promise<LeaderboardData> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/leaderboard${params}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export interface SeasonChampion {
  season: { id: string; name: string };
  champion: {
    id: string;
    name: string;
    shortName: string;
    colors: { primary: string; secondary: string };
    logoUrl: string;
    points: number;
  };
}

export interface AllPlayer {
  id: number;
  name: string;
  role: string;
  ipl_team: string;
  player_api_id: string | null;
  fantasy_team_id: string;
}

export async function fetchAllPlayers(season?: string): Promise<AllPlayer[]> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/players${params}`);
  if (!res.ok) throw new Error('Failed to fetch players');
  return res.json();
}

export async function fetchPlayer(apiId: string, season?: string): Promise<import('../types').PlayerDetail> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/players/${apiId}${params}`);
  if (!res.ok) throw new Error('Player not found');
  return res.json();
}

let _championsCache: Promise<SeasonChampion[]> | null = null;
export async function fetchChampions(): Promise<SeasonChampion[]> {
  if (_championsCache) return _championsCache;
  const p = fetch(`${API_URL}/api/seasons/champions`)
    .then(res => { if (!res.ok) throw new Error('Failed to fetch champions'); return res.json() as Promise<SeasonChampion[]>; })
    .catch(err => { _championsCache = null; throw err; });
  _championsCache = p;
  return p;
}

export async function triggerSync(): Promise<{ success: boolean; date: string; matched: number; total: number }> {
  const res = await fetch(`${API_URL}/api/sync`, { method: 'POST' });
  if (!res.ok) throw new Error('Sync failed');
  return res.json();
}

export interface SearchResult {
  teams: Array<{
    id: string;
    name: string;
    shortName: string;
    colors: { primary: string; secondary: string };
    logoUrl: string;
  }>;
  players: Array<{
    name: string;
    apiId: string;
    role: string;
    iplTeam: string;
    isCaptain: boolean;
    isOverseas: boolean;
    points: number;
    fantasyTeam: {
      id: string;
      name: string;
      colors: { primary: string; secondary: string };
      logoUrl: string;
    } | null;
  }>;
}

export interface UpcomingMatch {
  gamedayId: number;
  timeCDT: string | null;
  homeTeamId: number;
  homeTeamShort: string;
  awayTeamId: number;
  awayTeamShort: string;
}

export interface UpcomingFixtures {
  hasUpcoming: boolean;
  dateLabel: string | null;
  nextDate: string | null;
  matches: UpcomingMatch[];
}

let _fixturesCache: Promise<UpcomingFixtures> | null = null;
export async function fetchUpcomingFixtures(): Promise<UpcomingFixtures> {
  if (_fixturesCache) return _fixturesCache;
  const p = fetch(`${API_URL}/api/fixtures/upcoming`)
    .then(res => { if (!res.ok) throw new Error('Failed to fetch upcoming fixtures'); return res.json() as Promise<UpcomingFixtures>; })
    .catch(err => { _fixturesCache = null; throw err; });
  _fixturesCache = p;
  return p;
}

export async function fetchSearch(q: string): Promise<SearchResult> {
  const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export interface TradePlayer {
  id: number;
  name: string;
  role: string;
  iplTeam: string;
  apiId: string;
  imageUrl: string | null;
  points_alltime: number;
  points_since_trade: number;
}

export interface TradeTeam {
  id: string;
  name: string;
  shortName: string;
  colors: { primary: string; secondary: string };
  logoUrl: string;
}

export interface Trade {
  id: string;
  trade_date: string;
  season: string;
  notes: string | null;
  team_a: TradeTeam | null;
  team_b: TradeTeam | null;
  players_a_to_b: TradePlayer[];
  players_b_to_a: TradePlayer[];
}

export async function fetchTrades(teamId: string, season?: string): Promise<Trade[]> {
  const params = new URLSearchParams({ teamId });
  if (season) params.set('season', season);
  const res = await fetch(`${API_URL}/api/trades?${params}`);
  if (!res.ok) throw new Error('Failed to fetch trades');
  return res.json();
}

export async function fetchAllTrades(season?: string): Promise<Trade[]> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/trades${params}`);
  if (!res.ok) throw new Error('Failed to fetch trades');
  return res.json();
}

export async function createTrade(data: {
  trade_date: string;
  season: string;
  team_a_id: string;
  team_b_id: string;
  notes?: string;
  players_a_to_b: number[];
  players_b_to_a: number[];
  past_trade?: boolean;
}): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${API_URL}/api/trades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create trade');
  return res.json();
}

export async function deleteTrade(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/trades/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete trade');
}

// ── Stats ──────────────────────────────────────────────────────────

export interface TradeReportTeam {
  team: TradeTeam;
  netPts: number;
  gained: number;
  lost: number;
  tradesCount: number;
  bestMove: { name: string; apiId: string; iplTeam: string; since_points: number; alltime_points: number; trade_date: string } | null;
  worstMove: { name: string; apiId: string; iplTeam: string; since_points: number; alltime_points: number; trade_date: string } | null;
}

export interface CaptainReportTeam {
  team: TradeTeam;
  captain: { name: string; apiId: string; role: string; iplTeam: string; actual: number; base: number } | null;
  shouldHavePicked: { name: string; apiId: string; role: string; iplTeam: string; base: number; ifCaptained: number } | null;
  missedPoints: number;
  isOptimal: boolean;
}

export interface FormPerformance {
  gameday_id: number;
  match_date: string;
  match_label: string;
  points: number;
  dnp: boolean;
}

export interface PlayerForm {
  name: string;
  apiId: string;
  role: string;
  iplTeam: string;
  fantasyTeam: TradeTeam | null;
  last5: FormPerformance[];
  total: number;
  dnpCount: number;
  playedCount?: number;
}

export interface StatsOverview {
  season: string;
  tradeReport: TradeReportTeam[];
  captainReport: CaptainReportTeam[];
  hotCold: { hot: PlayerForm[]; cold: PlayerForm[] };
}

export async function fetchStatsOverview(season?: string): Promise<StatsOverview> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/stats/overview${params}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export interface MatchDayPlayer {
  name: string;
  apiId: string;
  iplTeam: string;
  role: string;
  points: number;
}

export interface MatchDay {
  gameday_id: number;
  match_date: string;
  match_label: string;
  total_points: number;
  players: MatchDayPlayer[];
  ipl_teams: string[];
}

export interface IplCorrelation {
  ipl_team: string;
  players: Array<{
    name: string;
    apiId: string;
    role: string;
    is_captain: boolean;
    is_overseas: boolean;
    points: number;
  }>;
  player_count: number;
  points: number;
  percentage: number;
}

export interface ScheduleMatch { gameday_id: number; home: string; away: string }
export interface SchedulePlayerBrief { name: string; apiId: string; role: string; is_captain: boolean }
export interface ScheduleDay {
  date: string;
  label: string;
  matches: ScheduleMatch[];
  yourPlayers: SchedulePlayerBrief[];
  yourPlayerCount: number;
  conflicts: Array<{ home: string; away: string; players_home: SchedulePlayerBrief[]; players_away: SchedulePlayerBrief[] }>;
}

export interface TeamStats {
  team: TradeTeam;
  summary: { totalPoints: number; playersCount: number; matchesPlayed: number; avgPerMatch: number };
  captain: CaptainReportTeam;
  matchDays: MatchDay[];
  bestDays: MatchDay[];
  worstDays: MatchDay[];
  iplCorrelation: IplCorrelation[];
  schedule: ScheduleDay[];
  hotCold: { hot: PlayerForm[]; cold: PlayerForm[] };
}

export async function fetchTeamStats(teamId: string, season?: string): Promise<TeamStats> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/stats/team/${teamId}${params}`);
  if (!res.ok) throw new Error('Failed to fetch team stats');
  return res.json();
}

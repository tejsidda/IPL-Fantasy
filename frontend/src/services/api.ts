import { Team } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface TopPerformer {
  name: string;
  team: string;
  points: number;
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

export async function fetchTeams(season?: string): Promise<Team[]> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/teams${params}`);
  if (!res.ok) throw new Error('Failed to fetch teams');
  return res.json();
}

export async function fetchTeam(id: string, season?: string): Promise<Team> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/teams/${id}${params}`);
  if (!res.ok) throw new Error('Team not found');
  return res.json();
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

export async function fetchPlayer(apiId: string, season?: string): Promise<import('../types').PlayerDetail> {
  const params = season ? `?season=${season}` : '';
  const res = await fetch(`${API_URL}/api/players/${apiId}${params}`);
  if (!res.ok) throw new Error('Player not found');
  return res.json();
}

export async function fetchChampions(): Promise<SeasonChampion[]> {
  const res = await fetch(`${API_URL}/api/seasons/champions`);
  if (!res.ok) throw new Error('Failed to fetch champions');
  return res.json();
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

export async function fetchUpcomingFixtures(): Promise<UpcomingFixtures> {
  const res = await fetch(`${API_URL}/api/fixtures/upcoming`);
  if (!res.ok) throw new Error('Failed to fetch upcoming fixtures');
  return res.json();
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

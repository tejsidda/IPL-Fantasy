export interface Player {
  id: string;
  dbId?: number;
  apiId?: string;
  name: string;
  role: 'Batter' | 'Bowler' | 'All-Rounder' | 'WK-Batter' | string;
  imageUrl: string;
  iplTeam?: string;
  iplTeamId?: number;
  isCaptain?: boolean;
  isOverseas?: boolean;
  points?: number;
  pointsToday?: number;
  lastGamePoints?: number | null;
}

export interface PlayerGameStat {
  gameDayId: number;
  matchLabel: string;
  matchDate?: string;
  // Batting
  runsPoints: number;
  fourPoints: number;
  sixPoints: number;
  halfCenturyPoints: number;
  fullCenturyPoints: number;
  runBonusPoints: number;
  thirtyBonusPoints: number;
  strikeRatePoints: number;
  duckOutPoints: number;
  // Bowling
  wicketPoints: number;
  wktBonusPoints: number;
  twoWkHaul: number;
  threeWkHaul: number;
  fourWkHaul: number;
  fiveWkHaul: number;
  economyRatePoint: number;
  dotBonusPoint: number;
  hatTrickPoints: number;
  // Fielding
  catchPoints: number;
  catchBonusPoints: number;
  stumpingPoints: number;
  directRunOutPoints: number;
  runOutPoints: number;
  // Base
  playedPoints: number;
  momPoints: number;
  overallPoints: number;
}

export interface PlayerTimeline {
  date: string;
  pointsGained: number;
  cumulativePoints: number;
}

export interface PlayerDetail {
  apiId: string;
  name: string;
  role: string;
  iplTeam: string;
  isCaptain: boolean;
  isOverseas: boolean;
  imageUrl: string;
  fantasyTeam: {
    id: string;
    name: string;
    colors: { primary: string; secondary: string };
    logoUrl: string;
  };
  totalPoints: number;
  timeline: PlayerTimeline[];
  gameStats: PlayerGameStat[];
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  colors: {
    primary: string;
    secondary: string;
  };
  logoUrl: string;
  championships: string;
  captain: string;
  coach: string;
  owner: string;
  venue: string;
  players: Player[];
  points?: number;
  rank?: number;
  rankChange?: number;
  pointsChange?: number;
  gapToFirst?: number;
  gapToNext?: number;
}

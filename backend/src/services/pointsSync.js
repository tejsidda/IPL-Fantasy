const supabase = require('../db/supabase');
const iplApi = require('./iplApi');
const { getActiveSeason } = require('../utils/seasons');

async function syncPoints() {
  const seasonId = await getActiveSeason();
  if (!seasonId) throw new Error('No active season. Create one first in the Admin page.');

  console.log(`Fetching latest fixture for season ${seasonId}...`);
  const fixture = await iplApi.getLatestFixture();
  const { TourGamedayId } = fixture;
  console.log(`Using TourGamedayId: ${TourGamedayId}`);

  const apiPlayers = await iplApi.getGamedayPlayers(TourGamedayId);

  // Build lookup by both API ID (most reliable) and name (fallback)
  const pointsById = {};
  const pointsByName = {};
  apiPlayers.forEach(p => {
    pointsById[String(p.Id)] = parseFloat(p.OverallPoints);
    pointsByName[p.Name]     = parseFloat(p.OverallPoints);
  });

  // Fetch player_api_id so we can do ID-based matching
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('name, fantasy_team_id, is_captain, player_api_id')
    .eq('season', seasonId);
  if (playersError) throw playersError;

  const today = new Date().toISOString().split('T')[0];

  const playerUpserts = players.map(player => {
    const raw = (player.player_api_id && pointsById[player.player_api_id] !== undefined)
      ? pointsById[player.player_api_id]
      : (pointsByName[player.name] ?? 0);
    let points = player.is_captain ? parseFloat((raw * 1.2).toFixed(2)) : raw;
    return {
      snapshot_date: today,
      season: seasonId,
      player_name: player.name,
      points,
      fantasy_team_id: player.fantasy_team_id
    };
  });

  // Deduplicate by conflict key in case a player name appears more than once in the DB
  const playerUpsertMap = new Map();
  for (const u of playerUpserts) {
    playerUpsertMap.set(`${u.snapshot_date}|${u.player_name}|${u.season}`, u);
  }

  const { error: playerUpsertError } = await supabase
    .from('player_points_history')
    .upsert(Array.from(playerUpsertMap.values()), { onConflict: 'snapshot_date,player_name,season' });
  if (playerUpsertError) throw playerUpsertError;

  // Calculate and store team totals
  const { data: fantasyTeams } = await supabase.from('fantasy_teams').select('id');

  const teamUpserts = [];
  for (const team of fantasyTeams) {
    const { data: teamPlayerPoints } = await supabase
      .from('player_points_history')
      .select('points')
      .eq('snapshot_date', today)
      .eq('season', seasonId)
      .eq('fantasy_team_id', team.id);

    const total = (teamPlayerPoints || []).reduce((sum, p) => sum + parseFloat(p.points), 0);
    teamUpserts.push({
      snapshot_date: today,
      season: seasonId,
      fantasy_team_id: team.id,
      total_points: parseFloat(total.toFixed(2))
    });
  }

  const { error: teamUpsertError } = await supabase
    .from('team_points_history')
    .upsert(teamUpserts, { onConflict: 'snapshot_date,fantasy_team_id,season' });
  if (teamUpsertError) throw teamUpsertError;

  const matched = players.filter(p =>
    (p.player_api_id && pointsById[p.player_api_id] !== undefined) || pointsByName[p.name] !== undefined
  ).length;
  console.log(`Synced: ${matched}/${players.length} players matched API data`);

  return { success: true, season: seasonId, date: today, tourGamedayId: TourGamedayId, matched, total: players.length };
}

module.exports = { syncPoints };

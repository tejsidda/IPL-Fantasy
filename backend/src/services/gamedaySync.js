const axios = require('axios');
const supabase = require('../db/supabase');
const iplApi = require('./iplApi');
const { getActiveSeason } = require('../utils/seasons');

const CARD_STATS = 'https://fantasy.iplt20.com/classic/api/feed/gameday-player/card-stats';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Referer': 'https://fantasy.iplt20.com/',
  'Origin': 'https://fantasy.iplt20.com'
};

async function fetchCardStats(iplTeamId, playerApiId, gamedayId) {
  try {
    const url = `${CARD_STATS}?teamId=${iplTeamId}&playerId=${playerApiId}&gamedayId=${gamedayId}`;
    const { data } = await axios.get(url, { headers, timeout: 8000 });
    const stats  = data?.Data?.Value?.GamedayStats?.[0] ?? null;
    const points = data?.Data?.Value?.GamedayPoints?.[0] ?? null;
    return { stats, points };
  } catch {
    return { stats: null, points: null };
  }
}

function p(val) { return parseFloat(val || 0) || 0; }

function buildRow(player, gamedayId, matchLabel, matchDate, seasonId, stats, pts) {
  return {
    season:           seasonId,
    player_api_id:    player.player_api_id,
    player_name:      player.name,
    fantasy_team_id:  player.fantasy_team_id,
    gameday_id:       gamedayId,
    match_label:      matchLabel,
    match_date:       matchDate,
    runs_points:      p(pts.RunsPoints),
    four_points:      p(pts.FourPoints),
    six_points:       p(pts.SixPoints),
    thirty_bonus:     p(pts.ThirtyBonusPoints),
    half_century:     p(pts.HalfCenturyPoints),
    full_century:     p(pts.FullCenturyPoints),
    run_bonus:        p(pts.RunBonusPoints),
    strike_rate:      p(pts.StrikeRatePoints),
    duck_out:         p(pts.DuckOutPoints),
    wicket_points:    p(pts.WicketPoints),
    wkt_bonus:        p(pts.WktBonusPoints),
    two_wk_haul:      p(pts.TwoWkHaul),
    three_wk_haul:    p(pts.ThreeWkHaul),
    four_wk_haul:     p(pts.FourWkHaul),
    five_wk_haul:     p(pts.FiveWkHaul),
    economy_rate:     p(pts.EconomyRatePoint),
    dot_bonus:        p(pts.DotBonusPoint),
    hat_trick:        p(pts.HATTrickPOints),
    catch_points:     p(pts.CatchePoints),
    catch_bonus:      p(pts.CthsBonusPoints),
    stumping:         p(pts.StumpingPoints),
    direct_run_out:   p(pts.DirectRunOutPoints),
    run_out:          p(pts.RunOutPoints),
    played_points:    p(pts.PlayedPoints),
    mom_points:       p(pts.MomPoints),
    overall_points:   p(pts.OverAllPoints)
  };
}

async function syncGamedayStats(seasonId, force = false) {
  if (!seasonId) seasonId = await getActiveSeason();
  if (!seasonId) throw new Error('No active season');

  const fixtures = await iplApi.getAllFixtures();
  const completed = fixtures
    .filter(f => f.MatchStatus == 2)
    .map(f => ({
      gamedayId:  f.TourGamedayId,
      matchLabel: `${f.HomeTeamShortName} vs ${f.AwayTeamShortName}`,
      matchDate:  f.Matchdate,
      homeTeamId: f.HomeTeamId || 0,
      awayTeamId: f.AwayTeamId || 0
    }));

  if (!completed.length) return { processed: 0, inserted: 0, message: 'No completed matches found' };

  // Deduplicate by gamedayId — keep first occurrence per unique match ID
  const uniqueCompleted = [...new Map(completed.map(f => [f.gamedayId, f])).values()];

  if (force) {
    const { error } = await supabase
      .from('player_gameday_stats')
      .delete()
      .eq('season', seasonId);
    if (error) throw new Error(`Failed to clear gameday stats: ${error.message}`);
    console.log(`[gamedaySync] Force mode: cleared existing stats for season ${seasonId}`);
  }

  const { data: existing } = await supabase
    .from('player_gameday_stats')
    .select('gameday_id')
    .eq('season', seasonId);
  const existingIds = new Set((existing || []).map(r => r.gameday_id));

  const newGamedays = uniqueCompleted.filter(f => !existingIds.has(f.gamedayId));
  if (!newGamedays.length) return { processed: 0, inserted: 0, message: 'All gamedays already synced' };

  const { data: players } = await supabase
    .from('players')
    .select('player_api_id, ipl_team_id, name, fantasy_team_id')
    .eq('season', seasonId)
    .neq('player_api_id', '')
    .gt('ipl_team_id', 0);

  if (!players?.length) throw new Error('No players have ipl_team_id set — run Refresh Player Data first.');

  let totalInserted = 0;
  const processedLabels = [];

  for (const { gamedayId, matchLabel, matchDate, homeTeamId, awayTeamId } of newGamedays) {
    // Only call card-stats for players whose IPL team is actually in this match.
    // IsPlayed='1' from the API means "in fantasy pool that day", NOT "played this specific match".
    const matchPlayers = (homeTeamId && awayTeamId)
      ? players.filter(p => p.ipl_team_id === homeTeamId || p.ipl_team_id === awayTeamId)
      : players; // fallback if team IDs missing in fixtures response

    if (!matchPlayers.length) {
      const note = `${matchLabel} (GD${gamedayId}): no players found for teamIds ${homeTeamId}/${awayTeamId} — skipped`;
      processedLabels.push(note);
      console.log(`[gamedaySync] ${note}`);
      continue;
    }

    const rows = [];

    // Batch 5 at a time — ~22 players per match = 4-5 batches, much faster than before
    for (let i = 0; i < matchPlayers.length; i += 5) {
      const batch = matchPlayers.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(pl => fetchCardStats(pl.ipl_team_id, pl.player_api_id, gamedayId))
      );

      for (let j = 0; j < results.length; j++) {
        if (results[j].status !== 'fulfilled') continue;
        const { stats, points } = results[j].value;
        if (!stats || stats.IsPlayed !== '1' || !points) continue;
        rows.push(buildRow(batch[j], gamedayId, matchLabel, matchDate, seasonId, stats, points));
      }

      if (i + 5 < matchPlayers.length) await new Promise(r => setTimeout(r, 100));
    }

    if (rows.length) {
      const { error } = await supabase
        .from('player_gameday_stats')
        .upsert(rows, { onConflict: 'player_api_id,gameday_id,season' });
      if (error) console.warn(`Gameday ${gamedayId} upsert error:`, error.message);
      else totalInserted += rows.length;
    }

    processedLabels.push(`${matchLabel} (GD${gamedayId}): ${rows.length} players`);
    console.log(`[gamedaySync] GD${gamedayId} ${matchLabel} [teams ${homeTeamId}/${awayTeamId}]: ${rows.length} rows`);
  }

  return {
    processed: newGamedays.length,
    inserted:  totalInserted,
    gamedays:  processedLabels
  };
}

module.exports = { syncGamedayStats };

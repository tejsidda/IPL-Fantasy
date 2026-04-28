const router = require('express').Router();
const supabase = require('../db/supabase');
const { getLogo } = require('../utils/logo');
const { getActiveSeason } = require('../utils/seasons');
const { fx } = require('../utils/formatName');

// GET /api/players/:apiId?season=2026
router.get('/:apiId', async (req, res) => {
  try {
    const { apiId } = req.params;
    const seasonId = req.query.season || await getActiveSeason();
    if (!seasonId) return res.status(503).json({ error: 'No active season' });

    const { data: player, error } = await supabase
      .from('players')
      .select('*, fantasy_teams!fantasy_team_id(id, name, color_primary, color_secondary, short_name)')
      .eq('player_api_id', apiId)
      .eq('season', seasonId)
      .maybeSingle();

    if (error) throw error;
    if (!player) return res.status(404).json({ error: 'Player not found for this season' });

    const ft = player.fantasy_teams;

    // Points timeline from DB (day-by-day cumulative rows → compute daily deltas)
    const { data: history } = await supabase
      .from('player_points_history')
      .select('snapshot_date, points')
      .eq('player_name', player.name)
      .eq('season', seasonId)
      .order('snapshot_date', { ascending: true });

    const timeline = (history || []).map((h, i) => {
      const prev = i === 0 ? 0 : parseFloat(history[i - 1].points);
      return {
        date: h.snapshot_date,
        cumulativePoints: parseFloat(h.points),
        pointsGained: parseFloat((parseFloat(h.points) - prev).toFixed(2))
      };
    }).filter(h => h.pointsGained > 0);

    const totalPoints = history?.length
      ? parseFloat(history[history.length - 1].points)
      : 0;

    // Per-match breakdown from player_gameday_stats
    const { data: gamedayRows } = await supabase
      .from('player_gameday_stats')
      .select('*')
      .eq('player_api_id', apiId)
      .eq('season', seasonId)
      .order('gameday_id', { ascending: false });

    const f = v => parseFloat(v || 0) || 0;
    const gameStats = (gamedayRows || []).map(s => ({
      gameDayId:          s.gameday_id,
      matchLabel:         s.match_label || `Gameday ${s.gameday_id}`,
      matchDate:          s.match_date,
      runsPoints:         f(s.runs_points),
      fourPoints:         f(s.four_points),
      sixPoints:          f(s.six_points),
      thirtyBonusPoints:  f(s.thirty_bonus),
      halfCenturyPoints:  f(s.half_century),
      fullCenturyPoints:  f(s.full_century),
      runBonusPoints:     f(s.run_bonus),
      strikeRatePoints:   f(s.strike_rate),
      duckOutPoints:      f(s.duck_out),
      wicketPoints:       f(s.wicket_points),
      wktBonusPoints:     f(s.wkt_bonus),
      twoWkHaul:          f(s.two_wk_haul),
      threeWkHaul:        f(s.three_wk_haul),
      fourWkHaul:         f(s.four_wk_haul),
      fiveWkHaul:         f(s.five_wk_haul),
      economyRatePoint:   f(s.economy_rate),
      dotBonusPoint:      f(s.dot_bonus),
      hatTrickPoints:     f(s.hat_trick),
      catchPoints:        f(s.catch_points),
      catchBonusPoints:   f(s.catch_bonus),
      stumpingPoints:     f(s.stumping),
      directRunOutPoints: f(s.direct_run_out),
      runOutPoints:       f(s.run_out),
      playedPoints:       f(s.played_points),
      momPoints:          f(s.mom_points),
      overallPoints:      f(s.overall_points)
    }));

    res.json({
      apiId,
      name: player.name,
      role: player.role || 'Batter',
      iplTeam: player.ipl_team || '',
      isCaptain: player.is_captain,
      isOverseas: player.is_overseas,
      imageUrl: `https://fantasy.iplt20.com/classic/static-assets/build/images/players/onpitch/${apiId}.png`,
      fantasyTeam: {
        id: ft?.id || '',
        name: fx(ft?.name || ''),
        colors: { primary: ft?.color_primary || '#666', secondary: ft?.color_secondary || '#666' },
        logoUrl: ft ? getLogo(ft.short_name, ft.color_primary, ft.color_secondary) : ''
      },
      totalPoints,
      timeline,
      gameStats
    });
  } catch (err) {
    console.error('GET /api/players/:apiId error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const router = require('express').Router();
const supabase = require('../db/supabase');
const { getLogo } = require('../utils/logo');
const { getActiveSeason } = require('../utils/seasons');
const { fx } = require('../utils/formatName');

// GET /api/leaderboard?season=2026
router.get('/', async (req, res) => {
  try {
    const seasonId = req.query.season || await getActiveSeason();
    if (!seasonId) return res.json({ season: null, standings: [], chartData: [], topPerformers: [] });

    const [{ data: teams }, { data: allHistory }] = await Promise.all([
      supabase.from('fantasy_teams').select('*'),
      supabase.from('team_points_history').select('*').eq('season', seasonId).order('snapshot_date', { ascending: true })
    ]);

    const teamsMap = Object.fromEntries((teams || []).map(t => [t.id, t]));
    const uniqueDates = [...new Set((allHistory || []).map(h => h.snapshot_date))];
    const latestDate = uniqueDates[uniqueDates.length - 1];
    const prevDate = uniqueDates[uniqueDates.length - 2];

    const currentPoints = (allHistory || []).filter(h => h.snapshot_date === latestDate);
    const prevPoints = (allHistory || []).filter(h => h.snapshot_date === prevDate);
    const prevMap = Object.fromEntries(prevPoints.map(p => [p.fantasy_team_id, parseFloat(p.total_points)]));

    const sorted = [...currentPoints].sort((a, b) => b.total_points - a.total_points);
    const prevSorted = [...prevPoints].sort((a, b) => b.total_points - a.total_points);
    const prevRankMap = Object.fromEntries(prevSorted.map((t, i) => [t.fantasy_team_id, i + 1]));

    const standings = sorted.map((entry, i) => {
      const team = teamsMap[entry.fantasy_team_id];
      if (!team) return null;
      const currentRank = i + 1;
      const prevRank = prevRankMap[entry.fantasy_team_id] ?? currentRank;
      const prevPts = prevMap[entry.fantasy_team_id] ?? parseFloat(entry.total_points);
      return {
        id: team.id,
        name: fx(team.name),
        shortName: team.short_name,
        colors: { primary: team.color_primary, secondary: team.color_secondary },
        logoUrl: getLogo(team.short_name, team.color_primary, team.color_secondary),
        championships: team.championships,
        captain: team.captain,
        coach: team.coach,
        owner: team.owner,
        venue: team.venue,
        points: parseFloat(entry.total_points),
        pointsChange: parseFloat((parseFloat(entry.total_points) - prevPts).toFixed(2)),
        rank: currentRank,
        rankChange: prevRank - currentRank,
        players: []
      };
    }).filter(Boolean);

    // Chart data — one entry per date
    const chartData = uniqueDates.map((date, i) => {
      const entry = { name: i === uniqueDates.length - 1 ? 'Current' : `Match ${i + 1}`, day: i + 1 };
      (allHistory || []).filter(h => h.snapshot_date === date).forEach(h => {
        const team = teamsMap[h.fantasy_team_id];
        if (team) entry[fx(team.name)] = parseFloat(h.total_points);
      });
      return entry;
    });

    // Top performers — use player_points_history dates independently (sync dates differ from imported team history dates)
    let topPerformers = [];
    let topPerformerType = 'totals';

    // Fetch enough rows to find 2 distinct dates — limit(2) fails when many
    // players share the same snapshot_date (both rows return the same date)
    const { data: playerDateRows } = await supabase
      .from('player_points_history')
      .select('snapshot_date')
      .eq('season', seasonId)
      .order('snapshot_date', { ascending: false })
      .limit(500);

    const uniquePlayerDates = [...new Set((playerDateRows || []).map(r => r.snapshot_date))];
    const pLatest = uniquePlayerDates[0];
    const pPrev   = uniquePlayerDates[1];

    if (pLatest) {
      const [{ data: latestPts }, prevResult] = await Promise.all([
        supabase.from('player_points_history').select('player_name, points, fantasy_team_id').eq('snapshot_date', pLatest).eq('season', seasonId),
        pPrev
          ? supabase.from('player_points_history').select('player_name, points').eq('snapshot_date', pPrev).eq('season', seasonId)
          : Promise.resolve({ data: null })
      ]);

      if (prevResult.data?.length) {
        topPerformerType = 'gains';
        const prevPlayerMap = Object.fromEntries(prevResult.data.map(p => [p.player_name, parseFloat(p.points)]));
        topPerformers = (latestPts || [])
          .map(p => ({
            name: p.player_name,
            team: fx(teamsMap[p.fantasy_team_id]?.name ?? ''),
            points: parseFloat((parseFloat(p.points) - (prevPlayerMap[p.player_name] ?? 0)).toFixed(2))
          }))
          .filter(p => p.points > 0)
          .sort((a, b) => b.points - a.points)
          .slice(0, 15);
      } else {
        topPerformers = (latestPts || [])
          .map(p => ({
            name: p.player_name,
            team: fx(teamsMap[p.fantasy_team_id]?.name ?? ''),
            points: parseFloat(p.points)
          }))
          .filter(p => p.points > 0)
          .sort((a, b) => b.points - a.points)
          .slice(0, 15);
      }
    }

    const topPoints = standings[0]?.points ?? 0;
    standings.forEach((team, i) => {
      team.gapToFirst = i === 0 ? 0 : parseFloat((topPoints - team.points).toFixed(2));
      team.gapToNext  = i === 0 ? 0 : parseFloat((standings[i - 1].points - team.points).toFixed(2));
    });

    res.json({ season: seasonId, standings, chartData, topPerformers, topPerformerType });
  } catch (err) {
    console.error('GET /api/leaderboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

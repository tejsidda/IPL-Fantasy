const router = require('express').Router();
const supabase = require('../db/supabase');
const { getLogo } = require('../utils/logo');
const { getActiveSeason } = require('../utils/seasons');
const { fx } = require('../utils/formatName');

async function resolveSeasonId(query) {
  return query.season || await getActiveSeason();
}

// GET /api/teams?season=2026
router.get('/', async (req, res) => {
  try {
    const seasonId = await resolveSeasonId(req.query);
    const { data: teams, error } = await supabase.from('fantasy_teams').select('*');
    if (error) throw error;
    if (!seasonId) return res.json([]);

    const { data: dates } = await supabase
      .from('team_points_history')
      .select('snapshot_date')
      .eq('season', seasonId)
      .order('snapshot_date', { ascending: false })
      .limit(16);

    const uniqueDates = [...new Set((dates || []).map(d => d.snapshot_date))];
    const latestDate = uniqueDates[0];
    const prevDate = uniqueDates[1];

    const [{ data: currentPoints }, { data: prevPoints }] = await Promise.all([
      latestDate
        ? supabase.from('team_points_history').select('*').eq('season', seasonId).eq('snapshot_date', latestDate)
        : Promise.resolve({ data: [] }),
      prevDate
        ? supabase.from('team_points_history').select('*').eq('season', seasonId).eq('snapshot_date', prevDate)
        : Promise.resolve({ data: [] })
    ]);

    const currentMap = Object.fromEntries((currentPoints || []).map(p => [p.fantasy_team_id, parseFloat(p.total_points)]));
    const prevMap = Object.fromEntries((prevPoints || []).map(p => [p.fantasy_team_id, parseFloat(p.total_points)]));

    const withPoints = teams.map(t => ({
      ...t,
      pts: currentMap[t.id] ?? 0,
      prevPts: prevMap[t.id] ?? currentMap[t.id] ?? 0
    }));

    const sorted = [...withPoints].sort((a, b) => b.pts - a.pts);
    const prevSorted = [...withPoints].sort((a, b) => b.prevPts - a.prevPts);
    const prevRankMap = Object.fromEntries(prevSorted.map((t, i) => [t.id, i + 1]));

    res.json(sorted.map((team, i) => {
      const currentRank = i + 1;
      const prevRank = prevRankMap[team.id] ?? currentRank;
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
        points: team.pts,
        pointsChange: parseFloat((team.pts - team.prevPts).toFixed(2)),
        rank: currentRank,
        rankChange: prevRank - currentRank,
        players: []
      };
    }));
  } catch (err) {
    console.error('GET /api/teams error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/teams/:id?season=2026
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const seasonId = await resolveSeasonId(req.query);
    if (!seasonId) return res.status(503).json({ error: 'No active season. Create one in the Admin page.' });

    const [{ data: team, error }, { data: players }] = await Promise.all([
      supabase.from('fantasy_teams').select('*').eq('id', id).single(),
      supabase.from('players').select('*').eq('fantasy_team_id', id).eq('season', seasonId).order('is_captain', { ascending: false })
    ]);
    if (error || !team) return res.status(404).json({ error: 'Team not found' });

    // Use current squad player names to look up points — this handles traded players
    // correctly since player_points_history retains the old fantasy_team_id from sync time
    const playerNames = (players || []).map(p => p.name);

    const { data: dateRows } = playerNames.length
      ? await supabase
          .from('player_points_history')
          .select('snapshot_date')
          .in('player_name', playerNames)
          .eq('season', seasonId)
          .order('snapshot_date', { ascending: false })
          .limit(120)
      : { data: [] };
    const uniqueDates = [...new Set((dateRows || []).map(r => r.snapshot_date))];
    const latestDate = uniqueDates[0];
    const prevDate   = uniqueDates[1];

    const [{ data: playerPoints }, { data: prevPlayerPoints }, { data: allTeamPoints }, { data: recentGameStats }] = await Promise.all([
      latestDate && playerNames.length
        ? supabase.from('player_points_history').select('player_name, points').eq('snapshot_date', latestDate).eq('season', seasonId).in('player_name', playerNames)
        : Promise.resolve({ data: [] }),
      prevDate && playerNames.length
        ? supabase.from('player_points_history').select('player_name, points').eq('snapshot_date', prevDate).eq('season', seasonId).in('player_name', playerNames)
        : Promise.resolve({ data: [] }),
      latestDate
        ? supabase.from('team_points_history').select('fantasy_team_id, total_points').eq('snapshot_date', latestDate).eq('season', seasonId)
        : Promise.resolve({ data: [] }),
      // Most recent game score per player (for "to watch" logic: last game > 50 pts)
      playerNames.length
        ? supabase.from('player_gameday_stats').select('player_name, overall_points, gameday_id').in('player_name', playerNames).eq('season', seasonId).order('gameday_id', { ascending: false }).limit(100)
        : Promise.resolve({ data: [] })
    ]);

    const pointsMap     = Object.fromEntries((playerPoints     || []).map(p => [p.player_name, parseFloat(p.points)]));
    const prevPointsMap = Object.fromEntries((prevPlayerPoints || []).map(p => [p.player_name, parseFloat(p.points)]));
    // Most recent game score per player — take first occurrence (query ordered desc by gameday_id)
    const lastGameMap = {};
    for (const s of (recentGameStats || [])) {
      if (!(s.player_name in lastGameMap)) lastGameMap[s.player_name] = parseFloat(s.overall_points);
    }
    const sortedTotals = (allTeamPoints || []).sort((a, b) => b.total_points - a.total_points);
    const rank = sortedTotals.findIndex(t => t.fantasy_team_id === id) + 1;
    const teamTotal = sortedTotals.find(t => t.fantasy_team_id === id)?.total_points ?? 0;

    res.json({
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
      points: parseFloat(teamTotal),
      rank: rank || 0,
      rankChange: 0,
      pointsChange: 0,
      players: (players || []).map((p, idx) => ({
        id: `${p.fantasy_team_id}-${idx}`,
        dbId: p.id,
        apiId: p.player_api_id || '',
        name: p.name,
        role: p.role || 'Batter',
        imageUrl: p.player_api_id
          ? `https://fantasy.iplt20.com/classic/static-assets/build/images/players/onpitch/${p.player_api_id}.png`
          : `https://i.pravatar.cc/300?u=${encodeURIComponent(p.name)}`,
        iplTeam: p.ipl_team || '',
        iplTeamId: p.ipl_team_id || 0,
        isCaptain: p.is_captain,
        isOverseas: p.is_overseas,
        points: pointsMap[p.name] ?? 0,
        pointsToday: parseFloat(((pointsMap[p.name] ?? 0) - (prevPointsMap[p.name] ?? 0)).toFixed(2)),
        lastGamePoints: (p.name in lastGameMap) ? lastGameMap[p.name] : null
      }))
    });
  } catch (err) {
    console.error('GET /api/teams/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

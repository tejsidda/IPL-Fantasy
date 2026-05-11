const router = require('express').Router();
const supabase = require('../db/supabase');
const { getLogo } = require('../utils/logo');
const { getActiveSeason } = require('../utils/seasons');
const { fx } = require('../utils/formatName');

// GET /api/search?q=rohit&season=2026
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) return res.json({ teams: [], players: [] });

    const seasonId = req.query.season || await getActiveSeason();

    const [{ data: teams }, { data: players }, { data: allTeams }] = await Promise.all([
      supabase.from('fantasy_teams').select('*').ilike('name', `%${q}%`).limit(5),
      seasonId
        ? supabase.from('players').select('name, role, ipl_team, player_api_id, fantasy_team_id, is_captain, is_overseas').eq('season', seasonId).ilike('name', `%${q}%`).limit(10)
        : Promise.resolve({ data: [] }),
      supabase.from('fantasy_teams').select('*'),
    ]);

    // teamMap covers ALL teams so player results always get their auction team
    const teamMap = Object.fromEntries((allTeams || []).map(t => [t.id, t]));
    const playerNames = (players || []).map(p => p.name);

    let ptsMap = {};
    if (playerNames.length > 0 && seasonId) {
      const { data: latestRow } = await supabase
        .from('player_points_history')
        .select('snapshot_date')
        .eq('season', seasonId)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();
      if (latestRow?.snapshot_date) {
        const { data: pts } = await supabase
          .from('player_points_history')
          .select('player_name, points')
          .eq('season', seasonId)
          .eq('snapshot_date', latestRow.snapshot_date)
          .in('player_name', playerNames);
        ptsMap = Object.fromEntries((pts || []).map(r => [r.player_name, parseFloat(r.points)]));
      }
    }

    res.json({
      teams: (teams || []).map(t => ({
        id: t.id,
        name: fx(t.name),
        shortName: t.short_name,
        colors: { primary: t.color_primary, secondary: t.color_secondary },
        logoUrl: getLogo(t.short_name, t.color_primary, t.color_secondary),
      })),
      players: (players || []).map(p => {
        const team = teamMap[p.fantasy_team_id];
        return {
          name: p.name,
          apiId: p.player_api_id || '',
          role: p.role || 'Batter',
          iplTeam: p.ipl_team || '',
          isCaptain: p.is_captain,
          isOverseas: p.is_overseas,
          points: ptsMap[p.name] ?? 0,
          fantasyTeam: team ? {
            id: team.id,
            name: fx(team.name),
            colors: { primary: team.color_primary, secondary: team.color_secondary },
            logoUrl: getLogo(team.short_name, team.color_primary, team.color_secondary),
          } : null,
        };
      }),
    });
  } catch (err) {
    console.error('GET /api/search error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

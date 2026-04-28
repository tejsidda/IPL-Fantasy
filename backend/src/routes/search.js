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

    const [{ data: teams }, { data: players }] = await Promise.all([
      supabase.from('fantasy_teams').select('*').ilike('name', `%${q}%`).limit(5),
      seasonId
        ? supabase.from('players').select('name, role, ipl_team, player_api_id, fantasy_team_id, is_captain, is_overseas').eq('season', seasonId).ilike('name', `%${q}%`).limit(10)
        : Promise.resolve({ data: [] })
    ]);

    const teamMap = Object.fromEntries((teams || []).map(t => [t.id, t]));

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

const router = require('express').Router();
const supabase = require('../db/supabase');
const { clearSeasonCache } = require('../utils/seasons');
const { getLogo } = require('../utils/logo');
const { fx } = require('../utils/formatName');

// GET /api/seasons/champions — winner of every completed (non-active) season
router.get('/champions', async (req, res) => {
  try {
    const { data: seasons } = await supabase
      .from('seasons')
      .select('*')
      .eq('is_active', false)
      .order('id', { ascending: false });

    if (!seasons?.length) return res.json([]);

    const { data: teams } = await supabase.from('fantasy_teams').select('*');
    const teamsMap = Object.fromEntries((teams || []).map(t => [t.id, t]));

    const champions = [];
    for (const season of seasons) {
      const { data: latest } = await supabase
        .from('team_points_history')
        .select('snapshot_date')
        .eq('season', season.id)
        .order('snapshot_date', { ascending: false })
        .limit(1);

      if (!latest?.length) continue;

      const { data: top } = await supabase
        .from('team_points_history')
        .select('fantasy_team_id, total_points')
        .eq('season', season.id)
        .eq('snapshot_date', latest[0].snapshot_date)
        .order('total_points', { ascending: false })
        .limit(1);

      if (!top?.length) continue;

      const team = teamsMap[top[0].fantasy_team_id];
      if (!team) continue;

      champions.push({
        season: { id: season.id, name: season.name },
        champion: {
          id: team.id,
          name: fx(team.name),
          shortName: team.short_name,
          colors: { primary: team.color_primary, secondary: team.color_secondary },
          logoUrl: getLogo(team.short_name, team.color_primary, team.color_secondary),
          points: parseFloat(top[0].total_points)
        }
      });
    }

    res.json(champions);
  } catch (err) {
    console.error('GET /api/seasons/champions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/seasons
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('id', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/seasons — create a new season
router.post('/', async (req, res) => {
  const { id, name, is_active, start_date } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name are required' });

  // If setting this season as active, deactivate all others first
  if (is_active) {
    await supabase.from('seasons').update({ is_active: false }).neq('id', id);
    clearSeasonCache();
  }

  const { data, error } = await supabase
    .from('seasons')
    .upsert({ id, name, is_active: !!is_active, start_date: start_date || null })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// PATCH /api/seasons/:id/activate — switch active season
router.patch('/:id/activate', async (req, res) => {
  const { id } = req.params;
  await supabase.from('seasons').update({ is_active: false }).neq('id', id);
  const { data, error } = await supabase
    .from('seasons')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  clearSeasonCache();
  res.json(data);
});

module.exports = router;

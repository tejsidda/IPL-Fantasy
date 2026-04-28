const router = require('express').Router();
const supabase = require('../db/supabase');
const { getLogo } = require('../utils/logo');
const { getActiveSeason } = require('../utils/seasons');
const { fx } = require('../utils/formatName');

// GET /api/trades?teamId=X&season=Y  (teamId optional — omit to get all trades for admin)
router.get('/', async (req, res) => {
  try {
    const { teamId, season } = req.query;
    const seasonId = season || await getActiveSeason();
    if (!seasonId) return res.status(400).json({ error: 'No active season' });

    let query = supabase
      .from('trades')
      .select('*')
      .eq('season', seasonId)
      .order('trade_date', { ascending: false });

    if (teamId) query = query.or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);

    const { data: trades, error } = await query;
    if (error) throw error;
    if (!trades || !trades.length) return res.json([]);

    const tradeIds = trades.map(t => t.id);

    const { data: legs } = await supabase
      .from('trade_players')
      .select('trade_id, player_id, from_team_id, to_team_id')
      .in('trade_id', tradeIds);

    const playerIds = [...new Set((legs || []).map(l => l.player_id))];
    if (!playerIds.length) {
      return res.json(trades.map(t => ({
        id: t.id, trade_date: t.trade_date, season: t.season, notes: t.notes,
        team_a: null, team_b: null, players_a_to_b: [], players_b_to_a: []
      })));
    }

    const { data: players } = await supabase
      .from('players')
      .select('id, name, role, ipl_team, player_api_id')
      .in('id', playerIds);

    const playerMap = Object.fromEntries((players || []).map(p => [p.id, p]));
    const playerNames = (players || []).map(p => p.name);

    // Latest snapshot date for current points
    const { data: latestRow } = await supabase
      .from('player_points_history')
      .select('snapshot_date')
      .eq('season', seasonId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();
    const latestDate = latestRow?.snapshot_date;

    const { data: latestPts } = latestDate
      ? await supabase
          .from('player_points_history')
          .select('player_name, points')
          .eq('season', seasonId)
          .eq('snapshot_date', latestDate)
          .in('player_name', playerNames)
      : { data: [] };

    const ptsMap = Object.fromEntries((latestPts || []).map(p => [p.player_name, parseFloat(p.points)]));

    // All history entries for "since trade" calculation
    const { data: history } = await supabase
      .from('player_points_history')
      .select('player_name, snapshot_date, points')
      .eq('season', seasonId)
      .in('player_name', playerNames)
      .order('snapshot_date', { ascending: true });

    function ptsAtOrBefore(name, date) {
      const rows = (history || []).filter(r => r.player_name === name && r.snapshot_date <= date);
      return rows.length ? parseFloat(rows[rows.length - 1].points) : 0;
    }

    // Fetch team info
    const teamIds = [...new Set(trades.flatMap(t => [t.team_a_id, t.team_b_id]))];
    const { data: teams } = await supabase.from('fantasy_teams').select('*').in('id', teamIds);
    const teamMap = Object.fromEntries((teams || []).map(t => [t.id, t]));

    function teamShape(t) {
      if (!t) return null;
      return {
        id: t.id,
        name: fx(t.name),
        shortName: t.short_name,
        colors: { primary: t.color_primary, secondary: t.color_secondary },
        logoUrl: getLogo(t.short_name, t.color_primary, t.color_secondary)
      };
    }

    function playerShape(leg, tradeDate) {
      const p = playerMap[leg.player_id];
      if (!p) return null;
      const alltime = ptsMap[p.name] ?? 0;
      const atTrade = ptsAtOrBefore(p.name, tradeDate);
      return {
        id: leg.player_id,
        name: p.name,
        role: p.role,
        iplTeam: p.ipl_team,
        apiId: p.player_api_id || '',
        imageUrl: p.player_api_id
          ? `https://fantasy.iplt20.com/classic/static-assets/build/images/players/onpitch/${p.player_api_id}.png`
          : null,
        points_alltime: alltime,
        points_since_trade: Math.max(0, alltime - atTrade)
      };
    }

    res.json(trades.map(trade => {
      const tradeLeg = (legs || []).filter(l => l.trade_id === trade.id);
      return {
        id: trade.id,
        trade_date: trade.trade_date,
        season: trade.season,
        notes: trade.notes,
        team_a: teamShape(teamMap[trade.team_a_id]),
        team_b: teamShape(teamMap[trade.team_b_id]),
        players_a_to_b: tradeLeg
          .filter(l => l.from_team_id === trade.team_a_id)
          .map(l => playerShape(l, trade.trade_date))
          .filter(Boolean),
        players_b_to_a: tradeLeg
          .filter(l => l.from_team_id === trade.team_b_id)
          .map(l => playerShape(l, trade.trade_date))
          .filter(Boolean),
      };
    }));
  } catch (err) {
    console.error('GET /api/trades error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trades
router.post('/', async (req, res) => {
  try {
    const { trade_date, season, team_a_id, team_b_id, notes, players_a_to_b, players_b_to_a } = req.body;
    if (!trade_date || !team_a_id || !team_b_id) {
      return res.status(400).json({ error: 'trade_date, team_a_id, team_b_id required' });
    }
    const seasonId = season || await getActiveSeason();
    if (!seasonId) return res.status(400).json({ error: 'No active season' });

    const { data: trade, error } = await supabase
      .from('trades')
      .insert({ trade_date, season: seasonId, team_a_id, team_b_id, notes: notes || null })
      .select()
      .single();
    if (error) throw error;

    const legRows = [
      ...(players_a_to_b || []).map(pid => ({ trade_id: trade.id, player_id: pid, from_team_id: team_a_id, to_team_id: team_b_id })),
      ...(players_b_to_a || []).map(pid => ({ trade_id: trade.id, player_id: pid, from_team_id: team_b_id, to_team_id: team_a_id })),
    ];
    if (legRows.length) {
      const { error: le } = await supabase.from('trade_players').insert(legRows);
      if (le) throw le;

      // Flip fantasy_team_id for each traded player
      const allMoves = [
        ...(players_a_to_b || []).map(pid => ({ pid, to: team_b_id })),
        ...(players_b_to_a || []).map(pid => ({ pid, to: team_a_id })),
      ];
      for (const { pid, to } of allMoves) {
        const { error: ue } = await supabase
          .from('players')
          .update({ fantasy_team_id: to })
          .eq('id', pid)
          .eq('season', seasonId);
        if (ue) throw ue;
      }
    }

    res.json({ success: true, id: trade.id });
  } catch (err) {
    console.error('POST /api/trades error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trades/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('trades').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/trades/:id error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

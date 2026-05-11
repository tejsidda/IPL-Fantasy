const router = require('express').Router();
const supabase = require('../db/supabase');
const { getLogo } = require('../utils/logo');
const { getActiveSeason } = require('../utils/seasons');
const { fx } = require('../utils/formatName');
const iplApi = require('../services/iplApi');

function toUTC(str) {
  if (!str) return null;
  let s = String(str).trim();
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/);
  if (mdy) s = `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}T${mdy[4]}`;
  else s = s.replace(' ', 'T');
  if (!s.includes('+') && !s.toLowerCase().includes('z')) s += '+05:30';
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}
function toISTDate(utcDate) {
  const ist = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function dayLabel(dateStr) {
  const nowIST = toISTDate(new Date());
  if (dateStr === nowIST) return 'Today';
  const [ny, nm, nd] = nowIST.split('-').map(Number);
  const tomorrow = toISTDate(new Date(Date.UTC(ny, nm - 1, nd + 1)));
  if (dateStr === tomorrow) return 'Tomorrow';
  const [, mm, dd] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(mm, 10) - 1]} ${parseInt(dd, 10)}`;
}

router.get('/overview', async (req, res) => {
  try {
    const seasonId = req.query.season || await getActiveSeason();
    if (!seasonId) return res.status(400).json({ error: 'No active season' });

    const [
      { data: teams },
      { data: players },
      { data: trades },
      { data: tradePlayers },
      { data: history },
      { data: gamedayStats },
    ] = await Promise.all([
      supabase.from('fantasy_teams').select('*'),
      supabase.from('players').select('id, name, role, ipl_team, player_api_id, fantasy_team_id, is_captain').eq('season', seasonId),
      supabase.from('trades').select('*').eq('season', seasonId).order('trade_date', { ascending: false }),
      supabase.from('trade_players').select('*'),
      supabase.from('player_points_history').select('player_name, snapshot_date, points').eq('season', seasonId).order('snapshot_date', { ascending: true }),
      supabase.from('player_gameday_stats').select('player_name, player_api_id, fantasy_team_id, gameday_id, match_date, match_label, overall_points').eq('season', seasonId).order('match_date', { ascending: false }),
    ]);

    const teamMap = Object.fromEntries((teams || []).map(t => [t.id, t]));
    const playersById = Object.fromEntries((players || []).map(p => [p.id, p]));

    const teamShape = (t) => t ? ({
      id: t.id,
      name: fx(t.name),
      shortName: t.short_name,
      colors: { primary: t.color_primary, secondary: t.color_secondary },
      logoUrl: getLogo(t.short_name, t.color_primary, t.color_secondary),
    }) : null;

    // ── Latest points map ──────────────────────────────────────────
    const dates = [...new Set((history || []).map(h => h.snapshot_date))];
    const latestDate = dates[dates.length - 1];
    const latestPtsMap = Object.fromEntries(
      (history || []).filter(h => h.snapshot_date === latestDate)
        .map(h => [h.player_name, parseFloat(h.points)])
    );

    // Points at-or-before a given date (for "since trade")
    function ptsAtOrBefore(name, date) {
      const rows = (history || []).filter(r => r.player_name === name && r.snapshot_date <= date);
      return rows.length ? parseFloat(rows[rows.length - 1].points) : 0;
    }

    // Sum points after a date from gameday_stats (no captain 1.2x baked in — independent source)
    function gamedayPtsAfterDate(name, date) {
      return (gamedayStats || [])
        .filter(s => s.player_name === name && (s.match_date || '') > date)
        .reduce((sum, s) => sum + parseFloat(s.overall_points || 0), 0);
    }

    // Sum points per player from gameday_stats (no captain multiplier — independent of name-match issues in history)
    const gamedayTotalByName = {};
    (gamedayStats || []).forEach(s => {
      const n = s.player_name;
      if (!gamedayTotalByName[n]) gamedayTotalByName[n] = 0;
      gamedayTotalByName[n] += parseFloat(s.overall_points || 0);
    });

    // Map: player_name → is_captain (so we can strip 1.2× from history values)
    const isCapByName = Object.fromEntries((players || []).map(p => [p.name, !!p.is_captain]));

    // Robust all-time points: max of (gameday-stats sum, history-derived base)
    function alltimePts(name) {
      const fromHistory = latestPtsMap[name] ?? 0;
      const historyBase = isCapByName[name] ? fromHistory / 1.2 : fromHistory;
      const fromGameday = gamedayTotalByName[name] ?? 0;
      return Math.max(historyBase, fromGameday);
    }

    // ── TRADE REPORT CARD ──────────────────────────────────────────
    const legsByTrade = {};
    (tradePlayers || []).forEach(tp => {
      if (!legsByTrade[tp.trade_id]) legsByTrade[tp.trade_id] = [];
      legsByTrade[tp.trade_id].push(tp);
    });

    const tradeReport = (teams || []).map(team => {
      const teamTrades = (trades || []).filter(t => t.team_a_id === team.id || t.team_b_id === team.id);
      let netPts = 0;
      let totalGained = 0, totalLost = 0;
      let bestMove = null, worstMove = null;

      teamTrades.forEach(trade => {
        (legsByTrade[trade.id] || []).forEach(leg => {
          const p = playersById[leg.player_id];
          if (!p) return;
          const total = alltimePts(p.name);
          const playerInfo = {
            name: p.name,
            apiId: p.player_api_id || '',
            iplTeam: p.ipl_team,
            alltime_points: parseFloat(total.toFixed(2)),
            since_points: parseFloat(total.toFixed(2)), // kept for backwards-compat with frontend
            trade_date: trade.trade_date,
          };

          if (leg.to_team_id === team.id) {
            netPts += total;
            totalGained += total;
            if (!bestMove || total > bestMove.alltime_points) bestMove = playerInfo;
          } else if (leg.from_team_id === team.id) {
            netPts -= total;
            totalLost += total;
            if (!worstMove || total > worstMove.alltime_points) worstMove = playerInfo;
          }
        });
      });

      return {
        team: teamShape(team),
        netPts: parseFloat(netPts.toFixed(2)),
        gained: parseFloat(totalGained.toFixed(2)),
        lost: parseFloat(totalLost.toFixed(2)),
        tradesCount: teamTrades.length,
        bestMove,
        worstMove,
      };
    }).sort((a, b) => b.netPts - a.netPts);

    // ── CAPTAIN REPORT ─────────────────────────────────────────────
    const captainReport = (teams || []).map(team => {
      const squad = (players || []).filter(p => p.fantasy_team_id === team.id);
      const captain = squad.find(p => p.is_captain);

      // Base points: take max of (history-derived base, gameday-derived base)
      // This handles stale history snapshots and missing gameday backfills both
      const playerBase = squad.map(p => {
        const fromHistory = latestPtsMap[p.name] ?? 0;
        const historyBase = p.is_captain ? fromHistory / 1.2 : fromHistory;
        const fromGameday = gamedayTotalByName[p.name] ?? 0;
        const base = Math.max(historyBase, fromGameday);
        return {
          name: p.name,
          apiId: p.player_api_id || '',
          role: p.role,
          iplTeam: p.ipl_team,
          base,
          actual: p.is_captain ? base * 1.2 : base,
        };
      });

      const sortedByBase = [...playerBase].sort((a, b) => b.base - a.base);
      const topBase = sortedByBase[0];
      const captainBase = captain ? playerBase.find(p => p.name === captain.name) : null;

      const isOptimal = !!captain && topBase && topBase.name === captain.name;
      const missedPoints = (!isOptimal && captain && topBase && captainBase)
        ? parseFloat((0.2 * (topBase.base - captainBase.base)).toFixed(2))
        : 0;

      return {
        team: teamShape(team),
        captain: captain ? {
          name: captain.name,
          apiId: captain.player_api_id || '',
          role: captain.role,
          iplTeam: captain.ipl_team,
          actual: parseFloat((captainBase?.actual ?? 0).toFixed(2)),
          base: parseFloat((captainBase?.base ?? 0).toFixed(2)),
        } : null,
        shouldHavePicked: (!isOptimal && topBase) ? {
          name: topBase.name,
          apiId: topBase.apiId,
          role: topBase.role,
          iplTeam: topBase.iplTeam,
          base: parseFloat(topBase.base.toFixed(2)),
          ifCaptained: parseFloat((topBase.base * 1.2).toFixed(2)),
        } : null,
        missedPoints,
        isOptimal,
      };
    }).sort((a, b) => b.missedPoints - a.missedPoints);

    // ── HOT / COLD (last 6 games per player's IPL team, must've played ≥3) ────
    const playerIplTeam = Object.fromEntries((players || []).map(p => [p.name, p.ipl_team]));
    const gamedaysByIplTeam = {};

    (gamedayStats || []).forEach(s => {
      const ipl = playerIplTeam[s.player_name];
      if (!ipl) return;
      if (!gamedaysByIplTeam[ipl]) gamedaysByIplTeam[ipl] = new Map();
      const key = String(s.gameday_id);
      if (!gamedaysByIplTeam[ipl].has(key)) {
        gamedaysByIplTeam[ipl].set(key, { gameday_id: s.gameday_id, match_date: s.match_date, match_label: s.match_label });
      }
    });

    const iplTeamLastN = {};
    Object.entries(gamedaysByIplTeam).forEach(([ipl, m]) => {
      const arr = [...m.values()];
      arr.sort((a, b) => (b.match_date || '').localeCompare(a.match_date || ''));
      iplTeamLastN[ipl] = arr.slice(0, 6);
    });

    const playerGamedayMap = {};
    (gamedayStats || []).forEach(s => {
      if (!playerGamedayMap[s.player_name]) playerGamedayMap[s.player_name] = {};
      playerGamedayMap[s.player_name][s.gameday_id] = s;
    });

    function buildForm(p, teamShapeMap) {
      const recent = (iplTeamLastN[p.ipl_team] || []).map(g => {
        const entry = (playerGamedayMap[p.name] || {})[g.gameday_id];
        return {
          gameday_id: g.gameday_id,
          match_date: g.match_date,
          match_label: g.match_label || '',
          points: entry ? parseFloat(entry.overall_points || 0) : 0,
          dnp: !entry,
        };
      });
      const total = recent.reduce((s, x) => s + x.points, 0);
      const dnpCount = recent.filter(x => x.dnp).length;
      const playedCount = recent.length - dnpCount;
      return {
        name: p.name,
        apiId: p.player_api_id || '',
        role: p.role,
        iplTeam: p.ipl_team,
        fantasyTeam: teamShapeMap[p.fantasy_team_id] ? teamShape(teamShapeMap[p.fantasy_team_id]) : null,
        last5: recent,
        total: parseFloat(total.toFixed(2)),
        dnpCount,
        playedCount,
      };
    }

    const playerForms = (players || [])
      .map(p => buildForm(p, teamMap))
      .filter(p => p.last5.length > 0 && p.playedCount >= 3);

    const hot  = [...playerForms].sort((a, b) => b.total - a.total).slice(0, 8);
    const cold = [...playerForms].sort((a, b) => a.total - b.total).slice(0, 8);

    res.json({
      season: seasonId,
      tradeReport,
      captainReport,
      hotCold: { hot, cold },
    });
  } catch (err) {
    console.error('GET /api/stats/overview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/team/:teamId?season=X — team deep-dive
router.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const seasonId = req.query.season || await getActiveSeason();
    if (!seasonId) return res.status(400).json({ error: 'No active season' });

    const [
      { data: team },
      { data: players },
      { data: history },
      { data: gamedayStats },
    ] = await Promise.all([
      supabase.from('fantasy_teams').select('*').eq('id', teamId).single(),
      supabase.from('players').select('id, name, role, ipl_team, player_api_id, is_captain, is_overseas').eq('season', seasonId).eq('fantasy_team_id', teamId),
      supabase.from('player_points_history').select('player_name, snapshot_date, points').eq('season', seasonId).eq('fantasy_team_id', teamId).order('snapshot_date', { ascending: true }),
      supabase.from('player_gameday_stats').select('player_name, player_api_id, gameday_id, match_date, match_label, overall_points').eq('season', seasonId).eq('fantasy_team_id', teamId).order('match_date', { ascending: true }),
    ]);

    if (!team) return res.status(404).json({ error: 'Team not found' });

    const teamShape = {
      id: team.id,
      name: fx(team.name),
      shortName: team.short_name,
      colors: { primary: team.color_primary, secondary: team.color_secondary },
      logoUrl: getLogo(team.short_name, team.color_primary, team.color_secondary),
    };

    const playerIplMap = Object.fromEntries((players || []).map(p => [p.name, p.ipl_team]));
    const playerApiMap = Object.fromEntries((players || []).map(p => [p.name, p.player_api_id || '']));
    const playerRoleMap = Object.fromEntries((players || []).map(p => [p.name, p.role]));

    // ── Latest cumulative points per player (drives correlation) ──
    const histDates = [...new Set((history || []).map(h => h.snapshot_date))];
    const latestHistDate = histDates[histDates.length - 1];
    const latestPts = Object.fromEntries(
      (history || []).filter(h => h.snapshot_date === latestHistDate)
        .map(h => [h.player_name, parseFloat(h.points)])
    );

    // Gameday totals per player (independent of history's captain 1.2× quirk)
    const teamGamedayTotalByName = {};
    (gamedayStats || []).forEach(s => {
      const n = s.player_name;
      if (!teamGamedayTotalByName[n]) teamGamedayTotalByName[n] = 0;
      teamGamedayTotalByName[n] += parseFloat(s.overall_points || 0);
    });

    // ── CAPTAIN (one card for this team) ──
    const captainPlayer = (players || []).find(p => p.is_captain);
    const playerBaseList = (players || []).map(p => {
      const fromHistory = latestPts[p.name] ?? 0;
      const historyBase = p.is_captain ? fromHistory / 1.2 : fromHistory;
      const fromGameday = teamGamedayTotalByName[p.name] ?? 0;
      const base = Math.max(historyBase, fromGameday);
      return {
        name: p.name,
        apiId: p.player_api_id || '',
        role: p.role,
        iplTeam: p.ipl_team,
        base,
        actual: p.is_captain ? base * 1.2 : base,
      };
    });
    const topBasePick = [...playerBaseList].sort((a, b) => b.base - a.base)[0];
    const captainBaseEntry = captainPlayer ? playerBaseList.find(p => p.name === captainPlayer.name) : null;
    const captainIsOptimal = !!captainPlayer && topBasePick && topBasePick.name === captainPlayer.name;
    const captainMissed = (!captainIsOptimal && captainPlayer && topBasePick && captainBaseEntry)
      ? parseFloat((0.2 * (topBasePick.base - captainBaseEntry.base)).toFixed(2))
      : 0;
    const captainReport = {
      team: teamShape,
      captain: captainPlayer ? {
        name: captainPlayer.name,
        apiId: captainPlayer.player_api_id || '',
        role: captainPlayer.role,
        iplTeam: captainPlayer.ipl_team,
        actual: parseFloat((captainBaseEntry?.actual ?? 0).toFixed(2)),
        base: parseFloat((captainBaseEntry?.base ?? 0).toFixed(2)),
      } : null,
      shouldHavePicked: (!captainIsOptimal && topBasePick) ? {
        name: topBasePick.name,
        apiId: topBasePick.apiId,
        role: topBasePick.role,
        iplTeam: topBasePick.iplTeam,
        base: parseFloat(topBasePick.base.toFixed(2)),
        ifCaptained: parseFloat((topBasePick.base * 1.2).toFixed(2)),
      } : null,
      missedPoints: captainMissed,
      isOptimal: captainIsOptimal,
    };

    // ── MATCH DAYS — group gameday stats by gameday_id ──
    const matchMap = {};
    (gamedayStats || []).forEach(s => {
      const k = String(s.gameday_id);
      if (!matchMap[k]) matchMap[k] = {
        gameday_id: s.gameday_id,
        match_date: s.match_date,
        match_label: s.match_label || `Gameday ${s.gameday_id}`,
        total_points: 0,
        players: [],
        ipl_teams: new Set(),
      };
      const pts = parseFloat(s.overall_points || 0);
      matchMap[k].total_points += pts;
      matchMap[k].players.push({
        name: s.player_name,
        apiId: s.player_api_id || playerApiMap[s.player_name] || '',
        iplTeam: playerIplMap[s.player_name] || '',
        role: playerRoleMap[s.player_name] || '',
        points: parseFloat(pts.toFixed(2)),
      });
      if (playerIplMap[s.player_name]) matchMap[k].ipl_teams.add(playerIplMap[s.player_name]);
    });

    const matchDays = Object.values(matchMap)
      .map(m => ({
        ...m,
        ipl_teams: [...m.ipl_teams],
        total_points: parseFloat(m.total_points.toFixed(2)),
      }))
      .sort((a, b) => (a.match_date || '').localeCompare(b.match_date || ''));

    const sortedByPts = [...matchDays].sort((a, b) => b.total_points - a.total_points);
    const bestDays   = sortedByPts.slice(0, 3);
    const worstDays  = sortedByPts.slice(-3).reverse();
    const avgPerDay  = matchDays.length ? matchDays.reduce((s, m) => s + m.total_points, 0) / matchDays.length : 0;

    // ── IPL CORRELATION — points by IPL franchise ──
    const iplGroups = {};
    (players || []).forEach(p => {
      const ipl = p.ipl_team || 'UNK';
      if (!iplGroups[ipl]) iplGroups[ipl] = { ipl_team: ipl, players: [], player_count: 0, points: 0 };
      iplGroups[ipl].players.push({
        name: p.name,
        apiId: p.player_api_id || '',
        role: p.role,
        is_captain: p.is_captain,
        is_overseas: p.is_overseas,
        points: parseFloat((latestPts[p.name] ?? 0).toFixed(2)),
      });
      iplGroups[ipl].player_count += 1;
      iplGroups[ipl].points += (latestPts[p.name] ?? 0);
    });
    const totalPts = Object.values(iplGroups).reduce((s, g) => s + g.points, 0);
    const iplCorrelation = Object.values(iplGroups)
      .map(g => ({
        ...g,
        points: parseFloat(g.points.toFixed(2)),
        percentage: totalPts > 0 ? parseFloat(((g.points / totalPts) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.points - a.points);

    // ── SCHEDULE — upcoming matches grouped by IST date ──
    let schedule = [];
    try {
      const allFixtures = await iplApi.getAllFixtures();
      const upcoming = (allFixtures || []).filter(f => f.MatchStatus != 2 && f.IsLive == 0);
      upcoming.sort((a, b) => {
        const da = toUTC(a.MatchdateTime), db = toUTC(b.MatchdateTime);
        if (!da || !db) return 0;
        return da - db;
      });

      const byDate = {};
      upcoming.forEach(f => {
        const utc = toUTC(f.MatchdateTime);
        if (!utc) return;
        const istDate = toISTDate(utc);
        if (!byDate[istDate]) byDate[istDate] = [];
        const home = (f.HomeTeamShortName || '').toUpperCase();
        const away = (f.AwayTeamShortName || '').toUpperCase();
        const playersHome = (players || []).filter(p => (p.ipl_team || '').toUpperCase() === home);
        const playersAway = (players || []).filter(p => (p.ipl_team || '').toUpperCase() === away);
        byDate[istDate].push({
          gameday_id: f.TourGamedayId,
          home, away,
          home_id: f.HomeTeamId || 0,
          away_id: f.AwayTeamId || 0,
          players_home: playersHome.map(p => ({ name: p.name, apiId: p.player_api_id || '', role: p.role, is_captain: p.is_captain })),
          players_away: playersAway.map(p => ({ name: p.name, apiId: p.player_api_id || '', role: p.role, is_captain: p.is_captain })),
        });
      });

      schedule = Object.entries(byDate).map(([date, matches]) => {
        const allPlayers = matches.flatMap(m => [...m.players_home, ...m.players_away]);
        const uniqueNames = new Set();
        const yourPlayers = [];
        for (const p of allPlayers) {
          if (!uniqueNames.has(p.name)) { uniqueNames.add(p.name); yourPlayers.push(p); }
        }
        const conflicts = matches
          .filter(m => m.players_home.length > 0 && m.players_away.length > 0)
          .map(m => ({ home: m.home, away: m.away, players_home: m.players_home, players_away: m.players_away }));

        return {
          date,
          label: dayLabel(date),
          matches: matches.map(m => ({ gameday_id: m.gameday_id, home: m.home, away: m.away })),
          yourPlayers,
          yourPlayerCount: yourPlayers.length,
          conflicts,
        };
      }).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 14);
    } catch (e) {
      console.warn('Could not fetch fixtures for schedule preview:', e.message);
    }

    // ── HOT / COLD for this team (last 6 games per player's IPL team, ≥3 played) ──
    // Need all gameday stats (not just this team's) to find each IPL team's last 6 unique gamedays
    const { data: allGamedayStats } = await supabase
      .from('player_gameday_stats')
      .select('player_name, gameday_id, match_date, match_label, overall_points')
      .eq('season', seasonId)
      .order('match_date', { ascending: false });

    // For each player on THIS team, find their IPL team's last 6 unique gamedays
    const iplGamedaysAll = {};
    (allGamedayStats || []).forEach(s => {
      // Find any player on this team or others to get IPL team mapping
      const ipl = playerIplMap[s.player_name];
      if (!ipl) return;
      if (!iplGamedaysAll[ipl]) iplGamedaysAll[ipl] = new Map();
      const key = String(s.gameday_id);
      if (!iplGamedaysAll[ipl].has(key)) {
        iplGamedaysAll[ipl].set(key, { gameday_id: s.gameday_id, match_date: s.match_date, match_label: s.match_label });
      }
    });
    // Augment: also pull IPL team gamedays from non-this-team players in DB so we cover all matches
    // (playerIplMap only contains this team's players, so we need wider lookup)
    const { data: allPlayers } = await supabase.from('players').select('name, ipl_team').eq('season', seasonId);
    const allPlayerIpl = Object.fromEntries((allPlayers || []).map(p => [p.name, p.ipl_team]));
    (allGamedayStats || []).forEach(s => {
      const ipl = allPlayerIpl[s.player_name];
      if (!ipl) return;
      if (!iplGamedaysAll[ipl]) iplGamedaysAll[ipl] = new Map();
      const key = String(s.gameday_id);
      if (!iplGamedaysAll[ipl].has(key)) {
        iplGamedaysAll[ipl].set(key, { gameday_id: s.gameday_id, match_date: s.match_date, match_label: s.match_label });
      }
    });

    const iplLastN = {};
    Object.entries(iplGamedaysAll).forEach(([ipl, m]) => {
      const arr = [...m.values()];
      arr.sort((a, b) => (b.match_date || '').localeCompare(a.match_date || ''));
      iplLastN[ipl] = arr.slice(0, 6);
    });

    const teamPlayerGamedayMap = {};
    (allGamedayStats || []).forEach(s => {
      if (allPlayerIpl[s.player_name] && (players || []).some(p => p.name === s.player_name)) {
        if (!teamPlayerGamedayMap[s.player_name]) teamPlayerGamedayMap[s.player_name] = {};
        teamPlayerGamedayMap[s.player_name][s.gameday_id] = s;
      }
    });

    const teamPlayerForms = (players || []).map(p => {
      const recent = (iplLastN[p.ipl_team] || []).map(g => {
        const entry = (teamPlayerGamedayMap[p.name] || {})[g.gameday_id];
        return {
          gameday_id: g.gameday_id,
          match_date: g.match_date,
          match_label: g.match_label || '',
          points: entry ? parseFloat(entry.overall_points || 0) : 0,
          dnp: !entry,
        };
      });
      const total = recent.reduce((s, x) => s + x.points, 0);
      const dnpCount = recent.filter(x => x.dnp).length;
      const playedCount = recent.length - dnpCount;
      return {
        name: p.name,
        apiId: p.player_api_id || '',
        role: p.role,
        iplTeam: p.ipl_team,
        fantasyTeam: teamShape,
        last5: recent,
        total: parseFloat(total.toFixed(2)),
        dnpCount,
        playedCount,
      };
    }).filter(p => p.last5.length > 0 && p.playedCount >= 3);

    const teamHot  = [...teamPlayerForms].sort((a, b) => b.total - a.total).slice(0, 5);
    const teamCold = [...teamPlayerForms].sort((a, b) => a.total - b.total).slice(0, 5);

    res.json({
      team: teamShape,
      summary: {
        totalPoints: parseFloat(totalPts.toFixed(2)),
        playersCount: (players || []).length,
        matchesPlayed: matchDays.length,
        avgPerMatch: parseFloat(avgPerDay.toFixed(2)),
      },
      captain: captainReport,
      matchDays,
      bestDays,
      worstDays,
      iplCorrelation,
      schedule,
      hotCold: { hot: teamHot, cold: teamCold },
    });
  } catch (err) {
    console.error('GET /api/stats/team/:teamId error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

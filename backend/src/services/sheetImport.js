const axios = require('axios');
const supabase = require('../db/supabase');
const iplApi = require('./iplApi');

async function fetchSheetCsv(sheetUrl, sheetName) {
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('Invalid Google Sheets URL — could not extract sheet ID');
  const sheetId = match[1];
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const { data } = await axios.get(url, { timeout: 10000 });
  return data;
}

function parseCsv(csvText) {
  return csvText.split('\n').map(line => {
    const cells = [];
    let cell = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { cells.push(cell.trim()); cell = ''; }
      else { cell += ch; }
    }
    cells.push(cell.trim());
    return cells;
  });
}

// Points Table layout: team names in row 0 odd columns, players in rows 1+
function parsePointsTable(rows) {
  const PLAYER_COLS = [0, 2, 4, 6, 8, 10, 12, 14];
  const header = rows[0] || [];
  return PLAYER_COLS
    .map(col => ({ sheetName: (header[col] || '').trim(), col }))
    .filter(t => t.sheetName)
    .map(({ sheetName, col }) => ({
      sheetName,
      players: rows.slice(1).map(r => (r[col] || '').trim()).filter(Boolean)
    }));
}

// Points History layout: Date | Team1 | Team2 | ... (team names in row 0)
function parsePointsHistory(rows) {
  const header = rows[0] || [];
  const teamNames = header.slice(1).map(n => n.trim()).filter(Boolean);
  const entries = [];
  for (const row of rows.slice(1)) {
    const rawDate = (row[0] || '').trim();
    if (!rawDate) continue;
    // Normalise to YYYY-MM-DD
    const date = parseDate(rawDate);
    if (!date) continue;
    for (let i = 0; i < teamNames.length; i++) {
      const pts = parseFloat(row[i + 1]);
      if (!isNaN(pts)) {
        entries.push({ date, teamName: teamNames[i], points: pts });
      }
    }
  }
  return entries;
}

function parseDate(raw) {
  // Handle DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.split(/[\/\-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (c > 1900) return `${c}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`; // DD/MM/YYYY
    if (a > 1900) return `${a}-${String(b).padStart(2,'0')}-${String(c).padStart(2,'0')}`; // YYYY/MM/DD
  }
  return null;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}

function firstWord(name) {
  return name.toLowerCase().split(/[\s\/&,]+/)[0];
}

function matchTeam(sheetName, dbTeams) {
  const lower = sheetName.toLowerCase().trim();
  // All words in the sheet team name, e.g. "Basil/Anjith" → ["basil", "anjith"]
  const sheetWords = lower.split(/[\s\/&,]+/).filter(Boolean);
  const fw = sheetWords[0];

  // 1. Exact
  let t = dbTeams.find(t => t.name.toLowerCase().trim() === lower);
  if (t) return { team: t, method: 'exact' };

  // 2. First word matches first word of DB name ("Paul/Ashmitha" → "Paul x Ashmitha")
  t = dbTeams.find(t => firstWord(t.name) === fw);
  if (t) return { team: t, method: 'first-word' };

  // 3. Any word in sheet name matches first word of DB name
  //    handles reversed names like "Basil/Anjith" → "Anjith & Basil"
  t = dbTeams.find(dbTeam => sheetWords.includes(firstWord(dbTeam.name)));
  if (t) return { team: t, method: 'any-word' };

  // 4. Fuzzy first-word (handles 1-char typos like Ayyappan/Aiyappan)
  t = dbTeams.find(t => levenshtein(firstWord(t.name), fw) <= 1);
  if (t) return { team: t, method: 'fuzzy' };

  // 5. Fuzzy any-word
  t = dbTeams.find(dbTeam => sheetWords.some(w => levenshtein(firstWord(dbTeam.name), w) <= 1));
  if (t) return { team: t, method: 'fuzzy-any' };

  return null;
}

async function fetchIplPlayerData() {
  const map = {};
  try {
    const fixture = await iplApi.getLatestFixture();
    const players = await iplApi.getGamedayPlayers(fixture.TourGamedayId);
    players.forEach(p => {
      const playerId = (p.Id ?? p.PId ?? p.PlayerId ?? '').toString();
      map[p.Name] = {
        iplTeam: p.TeamShortName || '',
        iplTeamId: p.TeamId || 0,
        isOverseas: p.IsOverseas ?? false,
        // SkillName is the reliable source; SkillId as fallback (new API: 1=BAT,2=BWL,3=AR,4=WK)
        role: mapRole(p.SkillName ?? p.SkillId ?? p.PlayingRole ?? ''),
        playerId
      };
    });
    console.log(`Fetched IPL data for ${Object.keys(map).length} players (TourGamedayId: ${fixture.TourGamedayId})`);
  } catch (err) {
    console.warn('IPL player fetch failed (non-fatal):', err.message);
  }
  return map;
}

function normalizePlayerName(name) {
  return name.toLowerCase().trim().replace(/[.\-_']+/g, '').replace(/\s+/g, ' ');
}

function findPlayerData(name, iplMap) {
  // 1. Exact
  if (iplMap[name]) return iplMap[name];

  // 2. Case-insensitive + stripped punctuation
  const norm = normalizePlayerName(name);
  for (const [key, val] of Object.entries(iplMap)) {
    if (normalizePlayerName(key) === norm) return val;
  }

  // 3. Levenshtein on normalized full name (≤2 chars off handles single typos/abbreviations)
  let best = null, bestDist = Infinity;
  for (const [key, val] of Object.entries(iplMap)) {
    const dist = levenshtein(norm, normalizePlayerName(key));
    if (dist < bestDist && dist <= 2) { bestDist = dist; best = val; }
  }
  return best;
}

async function refreshPlayerData(seasonId) {
  const iplMap = await fetchIplPlayerData();
  if (!Object.keys(iplMap).length) throw new Error('Could not fetch IPL player data — try again shortly.');

  const { data: players, error } = await supabase.from('players').select('id, name').eq('season', seasonId);
  if (error) throw error;

  const notFound = [];
  let updated = 0;
  for (const player of (players || [])) {
    const iplData = findPlayerData(player.name, iplMap);
    if (iplData) {
      await supabase.from('players').update({
        role: iplData.role,
        ipl_team: iplData.iplTeam,
        ipl_team_id: iplData.iplTeamId,
        is_overseas: iplData.isOverseas,
        player_api_id: iplData.playerId
      }).eq('id', player.id);
      updated++;
    } else {
      notFound.push(player.name);
    }
  }
  return { updated, total: (players || []).length, notFound };
}

function mapRole(r) {
  if (r === null || r === undefined) return 'Batter';
  const u = r.toString().toUpperCase().trim();
  if (!u) return 'Batter';
  // String-based (SkillName / PlayingRole values)
  if (u.startsWith('WK') || u.includes('WICKET') || u.includes('KEEPER')) return 'WK-Batter';
  if (u === 'BAT' || u === 'BATSMAN' || u === 'BATTER') return 'Batter';
  if (u === 'AR' || u === 'ALL' || u.includes('ROUNDER')) return 'All-Rounder';
  if (u === 'BWL' || u === 'BOWL' || u === 'BOWLER' || u.includes('BOWL')) return 'Bowler';
  // Numeric SkillId (new API: 1=BATSMAN, 2=BOWLER, 3=ALL ROUNDER, 4=WICKET KEEPER)
  if (u === '1') return 'Batter';
  if (u === '2') return 'Bowler';
  if (u === '3') return 'All-Rounder';
  if (u === '4') return 'WK-Batter';
  return 'Batter';
}

// Import player assignments from the Points Table sheet
async function importPlayersFromSheet(sheetUrl, seasonId) {
  console.log(`Importing players for season ${seasonId}...`);
  const csv = await fetchSheetCsv(sheetUrl, 'Points Table');
  const rows = parseCsv(csv);
  const sheetTeams = parsePointsTable(rows);

  if (!sheetTeams.length) {
    throw new Error('No team data found. Check row 1 has team names in columns A,C,E,G,I,K,M,O and the sheet is public.');
  }

  const iplMap = await fetchIplPlayerData();
  const { data: dbTeams, error } = await supabase.from('fantasy_teams').select('id, name');
  if (error) throw error;

  const results = { imported: [], unmatched: [], warnings: [], playerWarnings: [] };

  for (const { sheetName, players } of sheetTeams) {
    const matchResult = matchTeam(sheetName, dbTeams);
    if (!matchResult) { results.unmatched.push(sheetName); continue; }

    const { team, method } = matchResult;
    if (method !== 'exact') results.warnings.push(`"${sheetName}" → "${team.name}" via ${method} match`);

    // Remove existing players for this team/season before re-inserting
    await supabase.from('players').delete().eq('fantasy_team_id', team.id).eq('season', seasonId);

    const rows = players.map((name, i) => {
      const iplData = findPlayerData(name, iplMap);
      if (!iplData) results.playerWarnings.push(`"${name}" (${team.name}) — not found in IPL Fantasy API`);
      return {
        name,
        fantasy_team_id: team.id,
        season: seasonId,
        is_captain: i === 0,
        ipl_team: iplData?.iplTeam || '',
        is_overseas: iplData?.isOverseas || false,
        role: iplData?.role || 'Batter',
        player_api_id: iplData?.playerId || ''
      };
    });

    const { error: insertErr } = await supabase.from('players').insert(rows);
    if (insertErr) results.warnings.push(`${team.name}: ${insertErr.message}`);
    else results.imported.push({ sheetName, dbName: team.name, count: rows.length });
  }

  return results;
}

// Import historical team totals from the Points History sheet into team_points_history
async function importHistoryFromSheet(sheetUrl, seasonId) {
  console.log(`Importing points history for season ${seasonId}...`);
  const csv = await fetchSheetCsv(sheetUrl, 'Points History');
  const rows = parseCsv(csv);
  const entries = parsePointsHistory(rows);

  if (!entries.length) throw new Error('No data found in Points History sheet.');

  const { data: dbTeams } = await supabase.from('fantasy_teams').select('id, name');
  const results = { imported: 0, skipped: 0, warnings: [] };

  const upserts = [];
  for (const { date, teamName, points } of entries) {
    const match = matchTeam(teamName, dbTeams);
    if (!match) { results.skipped++; continue; }
    upserts.push({
      snapshot_date: date,
      season: seasonId,
      fantasy_team_id: match.team.id,
      total_points: points
    });
  }

  if (upserts.length) {
    // Deduplicate — sheet may have repeated rows for the same date+team
    const dedupMap = new Map();
    for (const entry of upserts) {
      const key = `${entry.snapshot_date}|${entry.fantasy_team_id}|${entry.season}`;
      dedupMap.set(key, entry);
    }
    const deduped = Array.from(dedupMap.values());

    const { error } = await supabase
      .from('team_points_history')
      .upsert(deduped, { onConflict: 'snapshot_date,fantasy_team_id,season' });
    if (error) throw error;
    results.imported = deduped.length;
  }

  return results;
}

module.exports = { importPlayersFromSheet, importHistoryFromSheet, refreshPlayerData };

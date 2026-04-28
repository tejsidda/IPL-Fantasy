import React, { useState, useEffect, useCallback } from 'react';
import { triggerSync, fetchSeasons, fetchTeams, fetchTeam, fetchAllTrades, createTrade, deleteTrade, Season, Trade } from '../services/api';
import { Player } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function apiPost(path: string, body: object) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

export function AdminPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  // Create season form
  const [newSeasonId, setNewSeasonId] = useState('');
  const [newSeasonName, setNewSeasonName] = useState('');
  const [creatingSeasons, setCreatingSeason] = useState(false);

  // Import form
  const [sheetUrl, setSheetUrl] = useState('');
  const [importSeason, setImportSeason] = useState('');
  const [importType, setImportType] = useState<'players' | 'history'>('players');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Refresh player data
  const [refreshSeason, setRefreshSeason] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<any>(null);

  // Gameday stats sync
  const [gdSeason, setGdSeason]     = useState('');
  const [gdSyncing, setGdSyncing]   = useState(false);
  const [gdResult, setGdResult]     = useState<any>(null);

  // Sync form
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Trades
  const [allTeamsList, setAllTeamsList]   = useState<any[]>([]);
  const [tradeSeason, setTradeSeason]     = useState('');
  const [tradeDate, setTradeDate]         = useState(new Date().toISOString().split('T')[0]);
  const [tradeTeamA, setTradeTeamA]       = useState('');
  const [tradeTeamB, setTradeTeamB]       = useState('');
  const [teamAPlayers, setTeamAPlayers]   = useState<Player[]>([]);
  const [teamBPlayers, setTeamBPlayers]   = useState<Player[]>([]);
  const [playersAtoB, setPlayersAtoB]     = useState<number[]>([]);
  const [playersBtoA, setPlayersBtoA]     = useState<number[]>([]);
  const [tradeNotes, setTradeNotes]       = useState('');
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeResult, setTradeResult]     = useState<any>(null);
  const [allTrades, setAllTrades]         = useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);

  const loadSeasons = useCallback(async () => {
    try {
      const s = await fetchSeasons();
      setSeasons(s);
      const active = s.find(x => x.is_active) ?? s[0];
      if (active) {
        if (!importSeason)  setImportSeason(active.id);
        if (!refreshSeason) setRefreshSeason(active.id);
        if (!gdSeason)      setGdSeason(active.id);
        if (!tradeSeason)   setTradeSeason(active.id);
      }
    } catch { /* backend not up */ }
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then(r => r.ok ? setBackendOk(true) : setBackendOk(false))
      .catch(() => setBackendOk(false));
    loadSeasons();
    fetchTeams().then(setAllTeamsList).catch(console.error);
  }, [loadSeasons]);

  // Load team players when team selection changes
  useEffect(() => {
    if (!tradeTeamA || !tradeSeason) { setTeamAPlayers([]); return; }
    fetchTeam(tradeTeamA, tradeSeason).then(t => setTeamAPlayers(t.players)).catch(console.error);
  }, [tradeTeamA, tradeSeason]);

  useEffect(() => {
    if (!tradeTeamB || !tradeSeason) { setTeamBPlayers([]); return; }
    fetchTeam(tradeTeamB, tradeSeason).then(t => setTeamBPlayers(t.players)).catch(console.error);
  }, [tradeTeamB, tradeSeason]);

  // Load trades list when season changes
  useEffect(() => {
    if (!tradeSeason) return;
    setTradesLoading(true);
    fetchAllTrades(tradeSeason)
      .then(setAllTrades)
      .catch(console.error)
      .finally(() => setTradesLoading(false));
  }, [tradeSeason]);

  function togglePlayer(pid: number, side: 'a' | 'b') {
    const setter = side === 'a' ? setPlayersAtoB : setPlayersBtoA;
    setter(prev => prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]);
  }

  const handleAddTrade = async () => {
    if (!tradeDate || !tradeTeamA || !tradeTeamB || !tradeSeason) return;
    if (playersAtoB.length === 0 && playersBtoA.length === 0) {
      setTradeResult({ error: 'Select at least one player' });
      return;
    }
    setTradeSubmitting(true);
    setTradeResult(null);
    try {
      await createTrade({ trade_date: tradeDate, season: tradeSeason, team_a_id: tradeTeamA, team_b_id: tradeTeamB, players_a_to_b: playersAtoB, players_b_to_a: playersBtoA, notes: tradeNotes || undefined });
      setTradeResult({ success: true });
      setPlayersAtoB([]); setPlayersBtoA([]); setTradeNotes(''); setTradeTeamA(''); setTradeTeamB('');
      const fresh = await fetchAllTrades(tradeSeason);
      setAllTrades(fresh);
    } catch (e: any) {
      setTradeResult({ error: e.message });
    } finally {
      setTradeSubmitting(false);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (!confirm('Delete this trade?')) return;
    try {
      await deleteTrade(id);
      setAllTrades(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateSeason = async () => {
    if (!newSeasonId || !newSeasonName) return;
    setCreatingSeason(true);
    try {
      const isFirst = seasons.length === 0;
      await apiPost('/api/seasons', {
        id: newSeasonId,
        name: newSeasonName,
        is_active: isFirst || seasons.every(s => !s.is_active),
        start_date: `${newSeasonId}-03-22`
      });
      setNewSeasonId('');
      setNewSeasonName('');
      await loadSeasons();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreatingSeason(false);
    }
  };

  const handleActivate = async (id: string) => {
    await fetch(`${API_URL}/api/seasons/${id}/activate`, { method: 'PATCH' });
    await loadSeasons();
  };

  const handleImport = async () => {
    if (!sheetUrl.trim() || !importSeason) return;
    setImporting(true);
    setImportResult(null);
    const endpoint = importType === 'players' ? '/api/import/players' : '/api/import/history';
    try {
      const data = await apiPost(endpoint, { sheetUrl: sheetUrl.trim(), season: importSeason });
      setImportResult(data);
    } catch (err: any) {
      setImportResult({ error: err.message });
    } finally {
      setImporting(false);
    }
  };

  const handleRefresh = async () => {
    if (!refreshSeason) return;
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const data = await apiPost('/api/import/refresh-players', { season: refreshSeason });
      setRefreshResult(data);
    } catch (err: any) {
      setRefreshResult({ error: err.message });
    } finally {
      setRefreshing(false);
    }
  };

  const handleGdSync = async (force = false) => {
    if (!gdSeason) return;
    setGdSyncing(true);
    setGdResult(null);
    try {
      const data = await apiPost('/api/import/gameday-stats', { season: gdSeason, force });
      setGdResult(data);
    } catch (err: any) {
      setGdResult({ error: err.message });
    } finally {
      setGdSyncing(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      setSyncResult(await triggerSync());
    } catch (err: any) {
      setSyncResult({ error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans pb-16">
      <div className="bg-[#0B1530] py-8 px-4 mb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-white/50 text-sm mt-1">Set up seasons, import player data, and sync points</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-6">

        {/* Backend status */}
        <div className={`rounded-xl px-5 py-3 text-sm font-medium flex items-center gap-2 ${backendOk === null ? 'bg-gray-100 text-gray-500' : backendOk ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <div className={`w-2 h-2 rounded-full ${backendOk === null ? 'bg-gray-400' : backendOk ? 'bg-green-500' : 'bg-red-500'}`} />
          {backendOk === null ? 'Checking backend…' : backendOk ? `Backend connected — ${API_URL}` : `Cannot reach backend at ${API_URL} — is it running?`}
        </div>

        {/* Seasons */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
          <h2 className="font-bold text-gray-900 text-base mb-4">Seasons</h2>

          {seasons.length > 0 ? (
            <div className="space-y-2 mb-5">
              {seasons.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border-light bg-gray-50">
                  <div>
                    <span className="font-bold text-gray-800 text-sm">{s.name}</span>
                    {s.is_active && <span className="ml-2 text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                  </div>
                  {!s.is_active && (
                    <button onClick={() => handleActivate(s.id)} className="text-xs text-blue-600 font-bold hover:underline">
                      Set Active
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              No seasons found — create them below before importing data.
            </p>
          )}

          <div className="border-t border-border-light pt-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Add a season</p>
            <div className="flex gap-2">
              <input
                value={newSeasonId}
                onChange={e => setNewSeasonId(e.target.value)}
                placeholder="Year (e.g. 2025)"
                className="border border-border-light rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={newSeasonName}
                onChange={e => setNewSeasonName(e.target.value)}
                placeholder="Name (e.g. IPL 2025)"
                className="border border-border-light rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCreateSeason}
                disabled={creatingSeasons || !newSeasonId || !newSeasonName}
                className="bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                {creatingSeasons ? '…' : 'Add'}
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">First season created is automatically set as active.</p>
          </div>
        </div>

        {/* Import from Google Sheets */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
          <h2 className="font-bold text-gray-900 text-base mb-1">Import from Google Sheet</h2>
          <p className="text-gray-400 text-xs mb-4">Sheet must be shared: Share → Anyone with the link → Viewer</p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Season</label>
              <select
                value={importSeason}
                onChange={e => setImportSeason(e.target.value)}
                className="w-full border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {seasons.length === 0 && <option value="">— create a season first —</option>}
                {seasons.map(s => (
                  <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ✓' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Import type</label>
              <select
                value={importType}
                onChange={e => setImportType(e.target.value as 'players' | 'history')}
                className="w-full border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="players">Player assignments (Points Table)</option>
                <option value="history">Historical scores (Points History)</option>
              </select>
            </div>
          </div>

          <p className="text-gray-500 text-xs mb-3">
            {importType === 'players'
              ? 'Reads "Points Table" tab — team names in row 1 (cols A C E G I K M O), players listed below each.'
              : 'Reads "Points History" tab — Date in column A, one team-total column per team after that.'}
          </p>

          <input
            type="url"
            value={sheetUrl}
            onChange={e => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/..."
            className="w-full border border-border-light rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button
            onClick={handleImport}
            disabled={importing || !sheetUrl.trim() || !importSeason || seasons.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors"
          >
            {importing ? 'Importing…' : importType === 'players' ? 'Import Players' : 'Import History'}
          </button>

          {importResult && (
            <div className="mt-4 space-y-2 text-sm">
              {importResult.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  <strong>Error:</strong> {importResult.error}
                </div>
              )}
              {importResult.imported?.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="font-bold text-green-800 mb-1">✓ Imported {importResult.imported.length} team{importResult.imported.length !== 1 ? 's' : ''}</div>
                  {importResult.imported.map((t: any, i: number) => (
                    <div key={i} className="text-green-700">
                      {t.sheetName !== t.dbName ? `"${t.sheetName}" → ` : ''}{t.dbName || t.teamName} — {t.count ?? importResult.imported} rows
                    </div>
                  ))}
                </div>
              )}
              {importResult.imported > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                  ✓ {importResult.imported} rows imported
                </div>
              )}
              {importResult.unmatched?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="font-bold text-yellow-800 mb-1">⚠ Unmatched teams — not in database:</div>
                  {importResult.unmatched.map((n: string, i: number) => <div key={i} className="text-yellow-700">• {n}</div>)}
                </div>
              )}
              {importResult.warnings?.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="font-bold text-blue-800 mb-1">ℹ Notes:</div>
                  {importResult.warnings.map((w: string, i: number) => <div key={i} className="text-blue-700">• {w}</div>)}
                </div>
              )}
              {importResult.playerWarnings?.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="font-bold text-orange-800 mb-1">⚠ {importResult.playerWarnings.length} players not found in IPL API (will score 0):</div>
                  {importResult.playerWarnings.slice(0, 8).map((w: string, i: number) => <div key={i} className="text-orange-700">• {w}</div>)}
                  {importResult.playerWarnings.length > 8 && <div className="text-orange-500 mt-1">… and {importResult.playerWarnings.length - 8} more</div>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Refresh player data */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
          <h2 className="font-bold text-gray-900 text-base mb-1">Refresh Player Roles & Photos</h2>
          <p className="text-gray-500 text-sm mb-4">
            Re-fetches the IPL Fantasy API and updates each player's role, IPL team, overseas flag, and photo ID.
            Use this if players are showing as "Batter" or photos are missing after import.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={refreshSeason}
              onChange={e => setRefreshSeason(e.target.value)}
              className="border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ✓' : ''}</option>)}
            </select>
            <button
              onClick={handleRefresh}
              disabled={refreshing || !refreshSeason}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors"
            >
              {refreshing ? 'Refreshing…' : 'Refresh Now'}
            </button>
          </div>
          {refreshResult && (
            <div className="text-sm">
              {refreshResult.error
                ? <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"><strong>Error:</strong> {refreshResult.error}</div>
                : <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                      ✓ Updated <strong>{refreshResult.updated}</strong> of {refreshResult.total} players
                    </div>
                    {refreshResult.notFound?.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="font-bold text-orange-800 mb-1">⚠ {refreshResult.notFound.length} players not matched in IPL API:</div>
                        {refreshResult.notFound.slice(0, 6).map((n: string, i: number) => (
                          <div key={i} className="text-orange-700 text-xs">• {n}</div>
                        ))}
                        {refreshResult.notFound.length > 6 && <div className="text-orange-500 text-xs mt-1">…and {refreshResult.notFound.length - 6} more</div>}
                      </div>
                    )}
                  </div>}
            </div>
          )}
        </div>

        {/* Gameday stats backfill */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
          <h2 className="font-bold text-gray-900 text-base mb-1">Sync Match-by-Match Player Stats</h2>
          <p className="text-gray-500 text-sm mb-1">
            Fetches detailed per-match breakdown (batting, bowling, fielding) for every player from the IPL card-stats API.
            Only processes matches not yet stored — safe to run multiple times.
          </p>
          <p className="text-amber-600 text-xs bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
            Run <strong>Refresh Player Roles & Photos</strong> first so all players have their IPL team ID set.
            Only processes matches not yet stored — safe to run multiple times.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={gdSeason}
              onChange={e => setGdSeason(e.target.value)}
              className="border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {seasons.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ✓' : ''}</option>)}
            </select>
            <button
              onClick={() => handleGdSync(false)}
              disabled={gdSyncing || !gdSeason}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors"
            >
              {gdSyncing ? 'Syncing… (please wait)' : 'Sync New Matches'}
            </button>
            <button
              onClick={() => {
                if (confirm('This will delete all stored match stats for this season and re-fetch everything. Are you sure?')) {
                  handleGdSync(true);
                }
              }}
              disabled={gdSyncing || !gdSeason}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
            >
              Clear & Re-sync All
            </button>
          </div>
          {gdResult && (
            <div className="text-sm">
              {gdResult.error
                ? <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"><strong>Error:</strong> {gdResult.error}</div>
                : <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                      {gdResult.message
                        ? gdResult.message
                        : <>Processed <strong>{gdResult.processed}</strong> match{gdResult.processed !== 1 ? 'es' : ''}, stored <strong>{gdResult.inserted}</strong> player rows</>}
                    </div>
                    {gdResult.gamedays?.length > 0 && (
                      <div className="bg-gray-50 border border-border-light rounded-lg p-3 space-y-0.5 max-h-48 overflow-y-auto">
                        {gdResult.gamedays.map((g: string, i: number) => (
                          <div key={i} className="text-xs text-gray-600 font-mono">• {g}</div>
                        ))}
                      </div>
                    )}
                  </div>}
            </div>
          )}
        </div>

        {/* Sync */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
          <h2 className="font-bold text-gray-900 text-base mb-1">Sync Points from IPL Fantasy API</h2>
          <p className="text-gray-500 text-sm mb-4">
            Fetches the latest match's OverallPoints for every registered player and updates the leaderboard.
            Auto-syncs at 3:30 PM and 7:30 PM IST daily.
          </p>
          <button
            onClick={handleSync}
            disabled={syncing || seasons.every(s => !s.is_active)}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors"
          >
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
          {syncResult && (
            <div className="mt-4 text-sm">
              {syncResult.error
                ? <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"><strong>Error:</strong> {syncResult.error}</div>
                : <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                    ✓ Synced on <strong>{syncResult.date}</strong> (Season {syncResult.season}) — {syncResult.matched}/{syncResult.total} players matched
                  </div>}
            </div>
          )}
        </div>

        {/* Trades */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-border-light">
          <h2 className="font-bold text-gray-900 text-base mb-1">Record a Trade</h2>
          <p className="text-gray-400 text-xs mb-4">Log player swaps between two teams. Select players each side is giving away.</p>

          {/* Season + date row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Season</label>
              <select value={tradeSeason} onChange={e => setTradeSeason(e.target.value)}
                className="w-full border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' ✓' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Trade Date</label>
              <input type="date" value={tradeDate} onChange={e => setTradeDate(e.target.value)}
                className="w-full border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Team selectors */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Team A</label>
              <select value={tradeTeamA} onChange={e => { setTradeTeamA(e.target.value); setPlayersAtoB([]); }}
                className="w-full border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— select —</option>
                {allTeamsList.filter(t => t.id !== tradeTeamB).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Team B</label>
              <select value={tradeTeamB} onChange={e => { setTradeTeamB(e.target.value); setPlayersBtoA([]); }}
                className="w-full border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— select —</option>
                {allTeamsList.filter(t => t.id !== tradeTeamA).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          {/* Player pickers */}
          {(tradeTeamA || tradeTeamB) && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Team A gives */}
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                  {tradeTeamA ? `${allTeamsList.find(t => t.id === tradeTeamA)?.shortName ?? 'A'} gives` : 'A gives'}
                </div>
                <div className="border border-border-light rounded-xl max-h-56 overflow-y-auto divide-y divide-gray-50">
                  {teamAPlayers.length === 0 && (
                    <div className="px-3 py-4 text-xs text-gray-400 text-center">{tradeTeamA ? 'Loading…' : 'Pick Team A'}</div>
                  )}
                  {teamAPlayers.map(p => {
                    const pid = p.dbId ?? 0;
                    const checked = playersAtoB.includes(pid);
                    return (
                      <label key={p.id} className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={checked} onChange={() => pid && togglePlayer(pid, 'a')} className="rounded accent-blue-600" />
                        <div className="w-7 h-7 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-gray-400">
                          {p.imageUrl?.includes('iplt20.com')
                            ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : p.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-800 truncate">{p.name}</div>
                          <div className="text-[10px] text-gray-400">{p.iplTeam} · {p.role}</div>
                        </div>
                        <div className="num text-xs text-gray-500 flex-shrink-0">{Math.round(p.points ?? 0)}</div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Team B gives */}
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                  {tradeTeamB ? `${allTeamsList.find(t => t.id === tradeTeamB)?.shortName ?? 'B'} gives` : 'B gives'}
                </div>
                <div className="border border-border-light rounded-xl max-h-56 overflow-y-auto divide-y divide-gray-50">
                  {teamBPlayers.length === 0 && (
                    <div className="px-3 py-4 text-xs text-gray-400 text-center">{tradeTeamB ? 'Loading…' : 'Pick Team B'}</div>
                  )}
                  {teamBPlayers.map(p => {
                    const pid = p.dbId ?? 0;
                    const checked = playersBtoA.includes(pid);
                    return (
                      <label key={p.id} className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${checked ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={checked} onChange={() => pid && togglePlayer(pid, 'b')} className="rounded accent-blue-600" />
                        <div className="w-7 h-7 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-gray-400">
                          {p.imageUrl?.includes('iplt20.com')
                            ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover object-top" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            : p.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-800 truncate">{p.name}</div>
                          <div className="text-[10px] text-gray-400">{p.iplTeam} · {p.role}</div>
                        </div>
                        <div className="num text-xs text-gray-500 flex-shrink-0">{Math.round(p.points ?? 0)}</div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Notes + submit */}
          <div className="flex gap-3 mb-3">
            <input
              value={tradeNotes}
              onChange={e => setTradeNotes(e.target.value)}
              placeholder="Notes (optional)"
              className="flex-1 border border-border-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddTrade}
              disabled={tradeSubmitting || !tradeDate || !tradeTeamA || !tradeTeamB}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2 px-5 rounded-lg text-sm transition-colors whitespace-nowrap"
            >
              {tradeSubmitting ? 'Saving…' : 'Add Trade'}
            </button>
          </div>

          {tradeResult && (
            <div className={`text-sm rounded-lg px-4 py-3 mb-4 ${tradeResult.error ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              {tradeResult.error ? `Error: ${tradeResult.error}` : '✓ Trade recorded'}
            </div>
          )}

          {/* Existing trades list */}
          {allTrades.length > 0 && (
            <div className="border-t border-border-light pt-4 mt-2">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                {tradesLoading ? 'Loading…' : `${allTrades.length} trade${allTrades.length !== 1 ? 's' : ''} this season`}
              </p>
              <div className="space-y-2">
                {allTrades.map(trade => {
                  const dateStr = new Date(trade.trade_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const aGave = trade.players_a_to_b.map(p => p.name).join(', ') || '—';
                  const bGave = trade.players_b_to_a.map(p => p.name).join(', ') || '—';
                  return (
                    <div key={trade.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border-light bg-gray-50 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-gray-700 mb-0.5">
                          {dateStr} · {trade.team_a?.shortName ?? '?'} ↔ {trade.team_b?.shortName ?? '?'}
                        </div>
                        <div className="text-gray-500 truncate">
                          {trade.team_a?.shortName} gave: {aGave}
                        </div>
                        <div className="text-gray-500 truncate">
                          {trade.team_b?.shortName} gave: {bGave}
                        </div>
                        {trade.notes && <div className="text-gray-400 mt-0.5 italic">{trade.notes}</div>}
                      </div>
                      <button
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="text-red-400 hover:text-red-600 font-bold flex-shrink-0 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { fetchLeaderboard, fetchSeasons, LeaderboardData, Season } from '../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Team } from '../types';
import { TrophyIcon, MedalIcon } from '../components/Icons';

const EMPTY: LeaderboardData = { standings: [], chartData: [], topPerformers: [] };

export const LeaderboardPage: React.FC = () => {
  const [data, setData]               = useState<LeaderboardData>(EMPTY);
  const [seasons, setSeasons]         = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [loading, setLoading]         = useState(true);
  const [showPast, setShowPast]       = useState(false);
  const [expandedTable, setExpandedTable] = useState(false);

  useEffect(() => {
    fetchSeasons().then(s => {
      setSeasons(s);
      const active = s.find(x => x.is_active);
      if (active) setSelectedSeason(active.id);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedSeason) return;
    setLoading(true);
    fetchLeaderboard(selectedSeason)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedSeason]);

  const sortedTeams    = [...data.standings].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const activeSeason   = seasons.find(s => s.is_active);
  const pastSeasons    = seasons.filter(s => !s.is_active).sort((a, b) => b.id.localeCompare(a.id));
  const selectedObj    = seasons.find(s => s.id === selectedSeason);
  const isActiveSeason = selectedObj?.is_active ?? false;
  const champion       = sortedTeams[0];
  const runnerUp       = sortedTeams[1];
  const colCount       = isActiveSeason ? 6 : 5;

  function pickSeason(id: string) {
    setSelectedSeason(id);
    if (seasons.find(s => s.id === id)?.is_active) setShowPast(false);
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-gray-900 pb-20">

      {/* Season bar */}
      <div className="bg-white border-b border-border-light sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black uppercase tracking-widest text-gray-700">Points Table</h1>
            {isActiveSeason && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wider">Live</span>
            )}
            {!isActiveSeason && selectedObj && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wider">
                {selectedObj.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeSeason && (
              <button
                onClick={() => pickSeason(activeSeason.id)}
                className={cn(
                  'text-xs font-bold px-3 py-1.5 rounded-lg transition-colors',
                  isActiveSeason ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {activeSeason.name}
              </button>
            )}
            {pastSeasons.length > 0 && (
              <button
                onClick={() => setShowPast(p => !p)}
                className={cn(
                  'text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1',
                  showPast ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Past Seasons
                <span className="text-[9px]">{showPast ? '▲' : '▼'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Past season pills */}
        {showPast && pastSeasons.length > 0 && (
          <div className="border-t border-border-light bg-gray-50 px-4 sm:px-6 py-2.5">
            <div className="max-w-7xl mx-auto flex gap-2 flex-wrap">
              {pastSeasons.map(s => (
                <button
                  key={s.id}
                  onClick={() => pickSeason(s.id)}
                  className={cn(
                    'text-xs font-bold px-3 py-1 rounded-lg transition-colors',
                    selectedSeason === s.id
                      ? 'bg-gray-800 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-border-light'
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Champion / Runner-up banner — past seasons only */}
      {!isActiveSeason && !loading && champion && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
          <div className="grid grid-cols-2 gap-3">
            {/* Champion */}
            <div
              className="relative rounded-2xl overflow-hidden p-4 sm:p-6 flex items-center gap-3 sm:gap-5"
              style={{ background: 'linear-gradient(135deg, #7B5A10 0%, #BF8A1A 40%, #E8C04A 100%)' }}
            >
              <div className="absolute inset-0 pointer-events-none"
                   style={{ background: 'radial-gradient(circle at 80% 15%, rgba(255,255,255,0.25) 0%, transparent 55%)' }} />
              <img src={`/logos/${champion.id}.png`} alt={champion.name}
                   className="w-12 h-12 sm:w-16 sm:h-16 object-contain relative z-10 flex-shrink-0 drop-shadow-lg"
                   onError={e => { (e.target as HTMLImageElement).src = champion.logoUrl; }} />
              <div className="relative z-10 min-w-0">
                <div className="flex items-center gap-1 text-[9px] sm:text-micro font-black uppercase tracking-widest text-yellow-100 mb-0.5">
                  <TrophyIcon className="w-3 h-3 flex-shrink-0" /> Champion
                </div>
                <div className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                  {champion.name}
                </div>
                <div className="num text-yellow-100 text-sm mt-0.5">
                  {(champion.points ?? 0).toLocaleString()} pts
                </div>
              </div>
            </div>

            {/* Runner-up */}
            {runnerUp && (
              <div
                className="relative rounded-2xl overflow-hidden p-4 sm:p-6 flex items-center gap-3 sm:gap-5"
                style={{ background: 'linear-gradient(135deg, #3A3A4A 0%, #5E5E72 40%, #8E8EA0 100%)' }}
              >
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: 'radial-gradient(circle at 80% 15%, rgba(255,255,255,0.15) 0%, transparent 55%)' }} />
                <img src={`/logos/${runnerUp.id}.png`} alt={runnerUp.name}
                     className="w-12 h-12 sm:w-16 sm:h-16 object-contain relative z-10 flex-shrink-0 drop-shadow-lg"
                     onError={e => { (e.target as HTMLImageElement).src = runnerUp.logoUrl; }} />
                <div className="relative z-10 min-w-0">
                  <div className="flex items-center gap-1 text-[9px] sm:text-micro font-black uppercase tracking-widest text-gray-300 mb-0.5">
                    <MedalIcon className="w-3 h-3 flex-shrink-0" tone="silver" /> Runner-up
                  </div>
                  <div className="font-display font-bold text-white text-sm sm:text-lg leading-tight truncate">
                    {runnerUp.name}
                  </div>
                  <div className="num text-gray-300 text-sm mt-0.5">
                    {(runnerUp.points ?? 0).toLocaleString()} pts
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 flex flex-col lg:flex-row gap-6">

        {/* Standings table */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-border-light overflow-hidden relative">
          {/* Expand button — mobile only */}
          <div className="md:hidden flex justify-end px-3 pt-3">
            <button
              onClick={() => setExpandedTable(true)}
              className="flex items-center gap-1.5 text-label font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Expand table to full screen"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              <span>Expand</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead className="bg-surface-subtle border-b border-border-light">
                <tr className="text-gray-400 text-micro font-black uppercase tracking-widest">
                  <th className="p-4 text-center w-12">#</th>
                  <th className="p-4 pl-2 min-w-[180px] sticky left-0 bg-surface-subtle z-20">Team</th>
                  <th className="p-4 text-right whitespace-nowrap">Points</th>
                  {isActiveSeason && (
                    <th className="p-4 text-right whitespace-nowrap">Today</th>
                  )}
                  <th className="p-4 text-right whitespace-nowrap">Gap to P1</th>
                  <th className="p-4 pr-6 text-right whitespace-nowrap">Gap to ↑</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={colCount} className="p-10 text-center text-gray-400 text-sm">
                      Loading standings...
                    </td>
                  </tr>
                ) : sortedTeams.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="p-10 text-center text-gray-400 text-sm">
                      No data yet — import history or run a sync first.
                    </td>
                  </tr>
                ) : sortedTeams.map(team => (
                  <StandingsRow key={team.id} team={team} isActiveSeason={isActiveSeason} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Right-edge scroll affordance — mobile only */}
          <div
            className="md:hidden absolute right-0 top-0 bottom-0 w-8 pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgba(255,255,255,0.95), transparent)' }}
            aria-hidden="true"
          />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
            <div className="p-4 border-b border-border-light bg-surface-subtle">
              <h3 className="font-black text-xs uppercase tracking-widest text-gray-600">
                {isActiveSeason
                  ? (data.topPerformerType === 'gains' ? 'Top Gainers (Last Sync)' : 'Top Scorers Overall')
                  : 'Top Scorers'}
              </h3>
            </div>
            {data.topPerformers.length === 0 && !loading ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                {isActiveSeason
                  ? 'No data yet — run a sync first.'
                  : 'Player-level data not available for this season.'}
              </div>
            ) : (
              /* 5 rows visible on mobile (scrollable), all on desktop */
              <div className="overflow-y-auto max-h-[260px] lg:max-h-none thin-scroll">
                {data.topPerformers.map((p, i) => {
                  const matchedTeam = data.standings.find(t => t.name === p.team);
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-black text-gray-300 w-4">{i + 1}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-[13px] text-gray-900 truncate">{p.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {matchedTeam && (
                              <img src={`/logos/${matchedTeam.id}.png`} alt="" className="w-3 h-3 object-contain flex-shrink-0"
                                   onError={e => { (e.target as HTMLImageElement).src = matchedTeam.logoUrl; }} />
                            )}
                            <span className="text-micro text-gray-400 font-bold truncate">{p.team}</span>
                          </div>
                        </div>
                      </div>
                      <div className="num font-semibold text-green-600 text-sm flex-shrink-0 ml-2">
                        +{p.points}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <ExpandedTableOverlay
        open={expandedTable}
        onClose={() => setExpandedTable(false)}
        teams={sortedTeams}
        isActiveSeason={isActiveSeason}
      />

      {/* Chart */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-border-light p-6">
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-600 mb-6">Points Over Time</h3>
          {data.chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              Chart data will appear after multiple syncs.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false}
                         domain={['dataMin - 50', 'dataMax + 50']} width={50} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                    itemStyle={{ fontWeight: 700 }}
                    labelStyle={{ fontSize: '10px', color: '#6B7280', marginBottom: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  {sortedTeams.map(team => (
                    <Line
                      key={team.name}
                      type="monotone"
                      dataKey={team.name}
                      stroke={team.colors.primary}
                      strokeWidth={2}
                      dot={{ r: 2, fill: team.colors.primary, strokeWidth: 0 }}
                      activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function StandingsRow({ team, isActiveSeason }: { team: Team; isActiveSeason: boolean }) {
  const rankChange = team.rankChange ?? 0;
  const todayGain  = team.pointsChange ?? 0;
  const gapToFirst = team.gapToFirst ?? 0;
  const gapToNext  = team.gapToNext  ?? 0;
  const rank       = team.rank ?? 0;
  const isFirst    = rank === 1;
  const isSecond   = rank === 2;

  return (
    <tr
      className={cn(
        'hover:bg-gray-50 transition-colors group',
        !isActiveSeason && isFirst  && 'bg-yellow-50/50',
        !isActiveSeason && isSecond && 'bg-gray-50/70'
      )}
      style={isFirst && isActiveSeason ? { boxShadow: 'inset 3px 0 0 var(--color-gold)' } : undefined}
    >
      {/* Rank */}
      <td className="p-4 text-center">
        {!isActiveSeason && isFirst ? (
          <TrophyIcon className="w-6 h-6 mx-auto" />
        ) : !isActiveSeason && isSecond ? (
          <MedalIcon className="w-6 h-6 mx-auto" tone="silver" />
        ) : (
          <div className="flex flex-col items-center">
            <span className="font-black text-sm text-gray-800">{rank}</span>
            {isActiveSeason && rankChange > 0 && (
              <svg className="text-green-500 w-2.5 h-2.5 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-8 12h16z" />
              </svg>
            )}
            {isActiveSeason && rankChange < 0 && (
              <svg className="text-red-500 w-2.5 h-2.5 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 20l8-12H4z" />
              </svg>
            )}
          </div>
        )}
      </td>

      {/* Team */}
      <td className="p-4 pl-2 sticky left-0 bg-white group-hover:bg-gray-50 transition-colors">
        <Link to={`/team/${team.id}`} className="flex items-center gap-3 group-hover:opacity-80 transition-opacity">
          <img src={`/logos/${team.id}.png`} alt={team.shortName} className="w-10 h-10 flex-shrink-0 object-contain"
               onError={e => { (e.target as HTMLImageElement).src = team.logoUrl; }} />
          <div className="min-w-0">
            <span className="font-bold text-gray-900 text-sm block truncate">{team.name}</span>
            {!isActiveSeason && isFirst  && (
              <span className="text-micro font-black text-yellow-600 uppercase tracking-wider">Champion</span>
            )}
            {!isActiveSeason && isSecond && (
              <span className="text-micro font-black text-gray-500 uppercase tracking-wider">Runner-up</span>
            )}
          </div>
        </Link>
      </td>

      {/* Points */}
      <td className="p-4 text-right">
        <span className="num text-gray-900">
          {(team.points ?? 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
      </td>

      {/* Today — active season only */}
      {isActiveSeason && (
        <td className="p-4 text-right">
          {todayGain > 0 ? (
            <span className="num text-sm text-green-600">
              +{todayGain.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
          ) : (
            <span className="text-gray-300 text-sm">—</span>
          )}
        </td>
      )}

      {/* Gap to P1 */}
      <td className="p-4 text-right">
        {isFirst ? (
          <span className="font-bold text-xs px-2 py-0.5 rounded-md"
                style={{ color: 'var(--color-gold)', background: 'rgba(201,169,97,0.10)', border: '1px solid rgba(201,169,97,0.25)' }}>
            {isActiveSeason ? 'LEADER' : 'CHAMPION'}
          </span>
        ) : (
          <span className="num text-sm" style={{ color: 'var(--color-neg)' }}>
            −{gapToFirst.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
        )}
      </td>

      {/* Gap to next */}
      <td className="p-4 pr-6 text-right">
        {isFirst ? (
          <span className="text-gray-300 text-sm">—</span>
        ) : (
          <span className="num text-sm text-gray-500">
            −{gapToNext.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
        )}
      </td>
    </tr>
  );
}

function ExpandedTableOverlay({
  open, onClose, teams, isActiveSeason,
}: {
  open: boolean;
  onClose: () => void;
  teams: Team[];
  isActiveSeason: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-border-light flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Points Table</h2>
          {isActiveSeason && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wider">Live</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Close expanded table"
        >
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Hint */}
      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
        <p className="text-label text-blue-700 font-medium text-center">Pinch to zoom · Scroll to navigate</p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead className="bg-surface-subtle border-b border-border-light sticky top-0 z-10">
            <tr className="text-gray-400 text-micro font-black uppercase tracking-widest">
              <th className="p-4 text-center w-12">#</th>
              <th className="p-4 pl-2 min-w-[180px]">Team</th>
              <th className="p-4 text-right whitespace-nowrap">Points</th>
              {isActiveSeason && (
                <th className="p-4 text-right whitespace-nowrap">Today</th>
              )}
              <th className="p-4 text-right whitespace-nowrap">Gap to P1</th>
              <th className="p-4 pr-6 text-right whitespace-nowrap">Gap to ↑</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teams.map(team => (
              <StandingsRow key={team.id} team={team} isActiveSeason={isActiveSeason} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

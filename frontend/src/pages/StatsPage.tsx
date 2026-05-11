import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchStatsOverview,
  fetchTeamStats,
  fetchTeams,
  fetchAllTrades,
  StatsOverview,
  TradeReportTeam,
  CaptainReportTeam,
  PlayerForm,
  TeamStats,
  MatchDay,
  IplCorrelation,
  ScheduleDay,
  Trade,
} from '../services/api';
import { Team } from '../types';
import { cn } from '../lib/utils';
import { PlayerPhoto } from '../components/PlayerPhoto';
import { TeamLogo } from '../components/TeamLogo';

// ── Trade Report Row (compact horizontal list row) ────────────────
function TradeReportCard({ row }: { row: TradeReportTeam }) {
  const navigate = useNavigate();
  const { team, netPts, tradesCount, bestMove, worstMove } = row;
  const isPositive = netPts > 0;
  const isNeutral  = netPts === 0;
  const netColor   = isNeutral ? 'text-gray-400' : isPositive ? 'text-green-600' : 'text-red-500';

  if (tradesCount === 0) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-border-light">
        <TeamLogo team={team} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-700 truncate">{team.name}</div>
        </div>
        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex-shrink-0">No trades</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border-light overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <TeamLogo team={team} size="md" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-800 truncate">{team.name}</div>
          <div className="text-[10px] text-gray-400 font-medium">{tradesCount} trade{tradesCount === 1 ? '' : 's'}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={cn('num text-xl font-black leading-none', netColor)}>
            {isPositive ? '+' : ''}{Math.round(netPts).toLocaleString()}
          </div>
          <div className="text-[9px] text-gray-400 uppercase tracking-widest font-black mt-1">Net pts</div>
        </div>
      </div>

      {/* Best / worst rows */}
      <div className="px-4 py-2 space-y-1.5">
        {bestMove ? (
          <button onClick={() => bestMove.apiId && navigate(`/player/${bestMove.apiId}`)} className="w-full flex items-center gap-2.5 py-1 rounded transition-colors text-left hover:bg-green-50/50">
            <span className="text-green-600 font-black text-xs flex-shrink-0">↑</span>
            <PlayerPhoto apiId={bestMove.apiId} name={bestMove.name} size="sm" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Got</span>
              <span className="text-xs font-bold text-gray-800 ml-1.5 truncate">{bestMove.name}</span>
            </div>
            <div className="num text-xs font-black text-green-600 flex-shrink-0">{Math.round(bestMove.alltime_points)}</div>
          </button>
        ) : null}
        {worstMove ? (
          <button onClick={() => worstMove.apiId && navigate(`/player/${worstMove.apiId}`)} className="w-full flex items-center gap-2.5 py-1 rounded transition-colors text-left hover:bg-red-50/50">
            <span className="text-red-500 font-black text-xs flex-shrink-0">↓</span>
            <PlayerPhoto apiId={worstMove.apiId} name={worstMove.name} size="sm" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Gave</span>
              <span className="text-xs font-bold text-gray-800 ml-1.5 truncate">{worstMove.name}</span>
            </div>
            <div className="num text-xs font-black text-red-500 flex-shrink-0">{Math.round(worstMove.alltime_points)}</div>
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── Captain Report Row (compact horizontal list row) ──────────────
function CaptainReportCard({ row }: { row: CaptainReportTeam }) {
  const navigate = useNavigate();
  const { team, captain, shouldHavePicked, missedPoints, isOptimal } = row;

  if (!captain) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-border-light">
        <TeamLogo team={team} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-700 truncate">{team.name}</div>
        </div>
        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex-shrink-0">No captain</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-border-light overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <TeamLogo team={team} size="md" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-800 truncate">{team.name}</div>
        </div>
        <div className={cn(
          'text-[10px] font-black uppercase tracking-widest flex-shrink-0',
          isOptimal ? 'text-green-600' : 'text-amber-600'
        )}>
          {isOptimal ? '✓ Optimal' : `Missed ${Math.round(missedPoints)}`}
        </div>
      </div>

      {/* Pick rows */}
      <div className="px-4 py-2 space-y-1.5">
        <button onClick={() => captain.apiId && navigate(`/player/${captain.apiId}`)} className="w-full flex items-center gap-2.5 py-1 rounded transition-colors text-left hover:bg-gray-50">
          <span className="font-black text-xs flex-shrink-0" style={{ color: team.colors.primary }}>★</span>
          <PlayerPhoto apiId={captain.apiId} name={captain.name} size="sm" />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Picked</span>
            <span className="text-xs font-bold text-gray-800 ml-1.5 truncate">{captain.name}</span>
          </div>
          <div className="num text-xs font-black flex-shrink-0" style={{ color: team.colors.primary }}>{Math.round(captain.actual)}</div>
        </button>

        {shouldHavePicked ? (
          <button onClick={() => shouldHavePicked.apiId && navigate(`/player/${shouldHavePicked.apiId}`)} className="w-full flex items-center gap-2.5 py-1 rounded transition-colors text-left hover:bg-amber-50/50">
            <span className="text-amber-600 font-black text-xs flex-shrink-0">→</span>
            <PlayerPhoto apiId={shouldHavePicked.apiId} name={shouldHavePicked.name} size="sm" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Should've</span>
              <span className="text-xs font-bold text-gray-800 ml-1.5 truncate">{shouldHavePicked.name}</span>
            </div>
            <div className="num text-xs font-black text-amber-700 flex-shrink-0">{Math.round(shouldHavePicked.ifCaptained)}</div>
          </button>
        ) : (
          <div className="w-full flex items-center gap-2.5 py-1">
            <span className="text-green-600 font-black text-xs flex-shrink-0">✓</span>
            <span className="text-[10px] text-green-700 font-black uppercase tracking-widest">Best choice in squad</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Parse "MI vs CSK" → returns the team that is NOT the player's IPL team
function getOpponent(matchLabel: string, playerIplTeam: string): string {
  if (!matchLabel) return '?';
  const parts = matchLabel.split(/\s+vs?\.?\s+/i).map(s => s.trim().toUpperCase());
  if (parts.length < 2) return '?';
  const own = (playerIplTeam || '').toUpperCase();
  return parts.find(p => p && p !== own) || parts[parts.length - 1];
}

function positionLabel(idx: number) {
  return idx === 0 ? 'Last' : `L-${idx}`;
}

// ── Form Card ─────────────────────────────────────────────────────
function FormCard({ player, accent }: { player: PlayerForm; accent: 'hot' | 'cold' }) {
  const navigate = useNavigate();
  const isHot = accent === 'hot';
  const ft = player.fantasyTeam;

  return (
    <button onClick={() => player.apiId && navigate(`/player/${player.apiId}`)} className="w-full flex items-start gap-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left">
      <PlayerPhoto apiId={player.apiId} name={player.name} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-800 truncate">{player.name}</span>
          {ft && <span className="text-[10px] font-black truncate" style={{ color: ft.colors.primary }}>{ft.shortName}</span>}
          <span className="text-[10px] text-gray-300 font-medium ml-auto pl-1.5">{player.iplTeam}</span>
        </div>

        {/* Recent games — each cell shows opponent, score, position */}
        <div className="flex items-end gap-1 mt-1.5 overflow-x-auto no-scrollbar">
          {player.last5.map((g, i) => {
            const opp = getOpponent(g.match_label, player.iplTeam);
            const pillCls = g.dnp
              ? 'bg-gray-200 text-gray-400'
              : g.points >= 60 ? 'bg-green-100 text-green-700'
              : g.points >= 30 ? 'bg-blue-50 text-blue-700'
              : g.points > 0 ? 'bg-gray-100 text-gray-600'
              : 'bg-gray-100 text-gray-400';
            return (
              <div key={i} className="flex flex-col items-center flex-shrink-0">
                <div className="text-[8px] text-gray-400 font-bold leading-none mb-0.5">{positionLabel(i)}</div>
                <div className="text-[9px] text-gray-500 font-bold leading-none mb-0.5">vs {opp}</div>
                <span
                  className={cn('text-[9px] font-black px-1.5 py-1 rounded-md min-w-[34px] text-center leading-none', pillCls)}
                  title={`${g.match_label || `Gameday ${g.gameday_id}`} · ${g.dnp ? 'DNP' : Math.round(g.points) + ' pts'}`}
                >
                  {g.dnp ? 'DNP' : Math.round(g.points)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-shrink-0 text-right pt-0.5">
        <div className={cn('num text-sm font-black', isHot ? 'text-green-600' : player.dnpCount > 0 ? 'text-red-500' : 'text-gray-500')}>
          {isHot ? '+' : ''}{Math.round(player.total)}
        </div>
        {player.dnpCount > 0 && <div className="text-[9px] text-red-400 font-black uppercase tracking-widest">{player.dnpCount} DNP</div>}
      </div>
    </button>
  );
}

// ── Team Deep-Dive: Hero ──────────────────────────────────────────
function TeamHero({ stats }: { stats: TeamStats }) {
  const { team, summary } = stats;
  const primary = team.colors.primary;
  return (
    <div className="rounded-2xl overflow-hidden relative p-5 sm:p-6"
         style={{ background: `linear-gradient(135deg, ${primary}, ${team.colors.secondary || primary})` }}>
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      <div className="relative z-10 flex items-center gap-4">
        <TeamLogo team={team} className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-xl sm:text-2xl tracking-tight truncate">{team.name}</div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-2">
            <div>
              <div className="text-white/55 text-[9px] sm:text-[10px] uppercase tracking-widest font-black">Total</div>
              <div className="num text-white font-black text-sm sm:text-lg">{Math.round(summary.totalPoints).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-white/55 text-[9px] sm:text-[10px] uppercase tracking-widest font-black">Matches</div>
              <div className="num text-white font-black text-sm sm:text-lg">{summary.matchesPlayed}</div>
            </div>
            <div>
              <div className="text-white/55 text-[9px] sm:text-[10px] uppercase tracking-widest font-black">Avg / match</div>
              <div className="num text-white font-black text-sm sm:text-lg">{Math.round(summary.avgPerMatch).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Match Day Row ─────────────────────────────────────────────────
function MatchDayRow({ day, accent, primaryColor }: { day: MatchDay; accent: 'best' | 'worst'; primaryColor: string }) {
  const isBest = accent === 'best';
  return (
    <div className="bg-white rounded-lg border border-border-light px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{day.match_date}</div>
          <div className="text-xs font-bold text-gray-700 truncate">{day.match_label}</div>
        </div>
        <div className={cn('num text-sm font-black flex-shrink-0', isBest ? 'text-green-600' : 'text-red-500')}>
          {isBest ? '+' : ''}{Math.round(day.total_points)}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {day.players.sort((a, b) => b.points - a.points).slice(0, 5).map(p => (
          <span key={p.name} className="inline-flex items-center gap-1 text-[10px] bg-gray-50 px-1.5 py-0.5 rounded">
            <span className="font-bold text-gray-700">{p.name.split(' ').pop()}</span>
            <span className="num text-gray-400">{Math.round(p.points)}</span>
          </span>
        ))}
        {day.players.length === 0 && <span className="text-[10px] text-red-400 font-black uppercase tracking-widest">Nobody played</span>}
      </div>
    </div>
  );
}

// ── IPL Correlation Bar ───────────────────────────────────────────
function IplBreakdown({ rows, primary }: { rows: IplCorrelation[]; primary: string }) {
  if (!rows.length) return null;
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.ipl_team} className="bg-white rounded-lg border border-border-light p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-800">{r.ipl_team || '—'}</span>
              <span className="text-[10px] text-gray-400 font-bold">{r.player_count} player{r.player_count === 1 ? '' : 's'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="num text-sm font-black text-gray-700">{Math.round(r.points).toLocaleString()}</span>
              <span className="text-[10px] text-gray-400 font-bold">{r.percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${r.percentage}%`, backgroundColor: primary }} />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {r.players.map(p => (
              <span key={p.name} className="inline-flex items-center gap-1 text-[10px] bg-gray-50 px-1.5 py-0.5 rounded">
                <span className="font-bold text-gray-600">{p.name}</span>
                <span className="num text-gray-400">{Math.round(p.points)}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Schedule Day Card ─────────────────────────────────────────────
function ScheduleDayCard({ day }: { day: ScheduleDay }) {
  const navigate = useNavigate();
  const count = day.yourPlayerCount;
  const hasConflict = day.conflicts.length > 0;
  const category = count === 0 ? 'dead' : count >= 5 ? 'big' : 'normal';

  const palette = hasConflict
    ? { bg: 'bg-amber-50', border: 'border-amber-200', label: 'CONFLICT', tone: 'text-amber-700' }
    : category === 'dead' ? { bg: 'bg-red-50', border: 'border-red-200', label: 'DEAD DAY', tone: 'text-red-700' }
    : category === 'big'  ? { bg: 'bg-green-50', border: 'border-green-200', label: 'BIG DAY', tone: 'text-green-700' }
    : { bg: 'bg-white', border: 'border-border-light', label: 'NORMAL', tone: 'text-gray-500' };

  return (
    <div className={cn('rounded-xl border p-3', palette.bg, palette.border)}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs font-bold text-gray-800">{day.label}</div>
          <div className="text-[10px] text-gray-400">{day.matches.map(m => `${m.home} v ${m.away}`).join(' · ')}</div>
        </div>
        <div className="text-right">
          <div className={cn('text-[9px] font-black uppercase tracking-widest', palette.tone)}>{palette.label}</div>
          <div className="num text-sm font-black text-gray-700">{count} player{count === 1 ? '' : 's'}</div>
        </div>
      </div>

      {hasConflict && day.conflicts.map((c, i) => (
        <div key={i} className="bg-white/70 rounded-lg p-2 mb-1.5 last:mb-0">
          <div className="text-[10px] text-amber-700 font-black uppercase tracking-widest mb-1">{c.home} vs {c.away} — your players on both sides</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[9px] text-gray-400 font-bold mb-0.5">{c.home}</div>
              {c.players_home.map(p => (
                <button key={p.name} onClick={() => p.apiId && navigate(`/player/${p.apiId}`)} className="block text-[11px] font-bold text-gray-700 hover:text-amber-700 transition-colors text-left truncate w-full">{p.name}{p.is_captain && ' ★'}</button>
              ))}
            </div>
            <div>
              <div className="text-[9px] text-gray-400 font-bold mb-0.5">{c.away}</div>
              {c.players_away.map(p => (
                <button key={p.name} onClick={() => p.apiId && navigate(`/player/${p.apiId}`)} className="block text-[11px] font-bold text-gray-700 hover:text-amber-700 transition-colors text-left truncate w-full">{p.name}{p.is_captain && ' ★'}</button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {!hasConflict && count > 0 && (
        <div className="flex flex-wrap gap-1">
          {day.yourPlayers.map(p => (
            <button key={p.name} onClick={() => p.apiId && navigate(`/player/${p.apiId}`)} className="inline-flex items-center gap-1 text-[10px] bg-white/70 px-1.5 py-0.5 rounded hover:bg-white transition-colors">
              <span className="font-bold text-gray-700">{p.name}</span>
              {p.is_captain && <span className="text-amber-600">★</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Team Deep-Dive ────────────────────────────────────────────────
function TeamDeepDive({ stats }: { stats: TeamStats }) {
  const [formTab, setFormTab] = useState<'hot' | 'cold'>('hot');
  const primary = stats.team.colors.primary;
  const formList = formTab === 'hot' ? stats.hotCold.hot : stats.hotCold.cold;

  return (
    <div className="space-y-6">
      <TeamHero stats={stats} />

      {/* Captain Call — per-team */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Captain Call</h2>
          <span className="text-[10px] text-gray-400 font-medium">Did the 1.2× pay off?</span>
        </div>
        <CaptainReportCard row={stats.captain} />
      </section>

      {/* Form tracker — per-team */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Form Tracker</h2>
          <span className="text-[10px] text-gray-400 font-medium">Last 6 matches · played ≥3</span>
        </div>
        <div className="inline-flex items-center bg-gray-50 rounded-full p-1 border border-gray-200 mb-3">
          {(['hot', 'cold'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFormTab(t)}
              className={cn(
                'text-xs font-bold px-4 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5',
                formTab === t
                  ? t === 'hot' ? 'bg-green-600 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <span>{t === 'hot' ? '🔥' : '🧊'}</span>
              <span>{t === 'hot' ? 'Hot' : 'Cold'}</span>
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-border-light overflow-hidden divide-y divide-gray-50">
          {formList.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">No players with 3+ recent games yet</div>
          ) : formList.map(p => <FormCard key={p.name} player={p} accent={formTab} />)}
        </div>
      </section>

      {/* Best / Worst days */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Why They're Here</h2>
          <span className="text-[10px] text-gray-400 font-medium">Biggest jumps & dead days</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2">Best Days</div>
            <div className="space-y-2">
              {stats.bestDays.length === 0 ? <div className="text-xs text-gray-400">No data yet</div> : stats.bestDays.map(d => <MatchDayRow key={d.gameday_id} day={d} accent="best" primaryColor={primary} />)}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Worst Days</div>
            <div className="space-y-2">
              {stats.worstDays.length === 0 ? <div className="text-xs text-gray-400">No data yet</div> : stats.worstDays.map(d => <MatchDayRow key={d.gameday_id} day={d} accent="worst" primaryColor={primary} />)}
            </div>
          </div>
        </div>
      </section>

      {/* IPL correlation */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Where Points Come From</h2>
          <span className="text-[10px] text-gray-400 font-medium">Reliance by IPL franchise</span>
        </div>
        <IplBreakdown rows={stats.iplCorrelation} primary={primary} />
      </section>

      {/* Schedule */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Schedule Ahead</h2>
          <span className="text-[10px] text-gray-400 font-medium">Big days, dead days, conflicts</span>
        </div>
        {stats.schedule.length === 0 ? (
          <div className="bg-white rounded-xl border border-border-light p-6 text-center text-xs text-gray-400">No upcoming fixtures.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {stats.schedule.map(d => <ScheduleDayCard key={d.date} day={d} />)}
          </div>
        )}
      </section>
    </div>
  );
}

// ── All-trades view (expanded from Trade Report Card) ─────────────
function AllTradesView({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [trades, setTrades] = useState<Trade[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAllTrades().then(setTrades).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Rank by absolute swing (alltime points received vs given for each side)
  const ranked = (trades || []).map(t => {
    const gainA = t.players_b_to_a.reduce((s, p) => s + p.points_alltime, 0); // A got these
    const gainB = t.players_a_to_b.reduce((s, p) => s + p.points_alltime, 0); // B got these
    const swing = gainA - gainB; // +ve means A won
    return { trade: t, gainA, gainB, swing, magnitude: Math.abs(swing) };
  }).sort((a, b) => b.magnitude - a.magnitude);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">← Back</button>
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">All Trades</h2>
        </div>
        <span className="text-[10px] text-gray-400 font-medium">Ranked by impact</span>
      </div>

      {loading && <div className="py-16 text-center text-gray-400 text-sm tracking-widest uppercase">Loading…</div>}

      {!loading && ranked.length === 0 && (
        <div className="bg-white rounded-xl border border-border-light p-10 text-center">
          <div className="text-5xl mb-3 text-gray-200">⇄</div>
          <p className="text-sm font-bold text-gray-400">No trades this season</p>
        </div>
      )}

      <div className="space-y-3">
        {ranked.map(({ trade, gainA, gainB, swing }, idx) => {
          const dateStr = new Date(trade.trade_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const winner = swing > 0 ? trade.team_a : swing < 0 ? trade.team_b : null;
          const winnerSwing = Math.abs(swing);

          return (
            <div key={trade.id} className="bg-white rounded-xl border border-border-light overflow-hidden">
              {/* Header */}
              <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-300 num">#{idx + 1}</span>
                  <span className="text-xs font-bold text-gray-500">{dateStr}</span>
                  {trade.notes && <span className="text-[11px] text-gray-400 truncate max-w-[140px]">· {trade.notes}</span>}
                </div>
                {winner ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Winner</span>
                    {trade.team_a && trade.team_b && <TeamLogo team={winner} className="w-5 h-5" />}
                    <span className="text-xs font-black" style={{ color: winner.colors.primary }}>{winner.shortName}</span>
                    <span className="num text-xs font-black text-green-600">+{Math.round(winnerSwing)}</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Even</span>
                )}
              </div>

              {/* Two sides */}
              <div className="px-4 py-3 grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
                {/* A side */}
                <div>
                  {trade.team_a && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <TeamLogo team={trade.team_a} className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: trade.team_a.colors.primary }}>{trade.team_a.shortName} gave</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {trade.players_a_to_b.length === 0 && <span className="text-xs text-gray-300">—</span>}
                    {trade.players_a_to_b.map(p => (
                      <button
                        key={p.id}
                        onClick={() => p.apiId && navigate(`/player/${p.apiId}`)}
                        className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 transition-colors rounded-md px-2 py-1"
                      >
                        <PlayerPhoto apiId={p.apiId} name={p.name} size="xs" />
                        <span className="text-[11px] font-bold text-gray-700">{p.name}</span>
                        <span className="num text-[10px] text-gray-400">{Math.round(p.points_alltime)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="num text-[10px] text-gray-400 font-bold mt-2">A got back: {Math.round(gainA)} pts</div>
                </div>

                <div className="flex items-center justify-center pt-6 text-gray-300 font-black text-lg">⇄</div>

                {/* B side */}
                <div className="text-right">
                  {trade.team_b && (
                    <div className="flex items-center justify-end gap-1.5 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: trade.team_b.colors.primary }}>{trade.team_b.shortName} gave</span>
                      <TeamLogo team={trade.team_b} className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {trade.players_b_to_a.length === 0 && <span className="text-xs text-gray-300">—</span>}
                    {trade.players_b_to_a.map(p => (
                      <button
                        key={p.id}
                        onClick={() => p.apiId && navigate(`/player/${p.apiId}`)}
                        className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 transition-colors rounded-md px-2 py-1"
                      >
                        <PlayerPhoto apiId={p.apiId} name={p.name} size="xs" />
                        <span className="text-[11px] font-bold text-gray-700">{p.name}</span>
                        <span className="num text-[10px] text-gray-400">{Math.round(p.points_alltime)}</span>
                      </button>
                    ))}
                  </div>
                  <div className="num text-[10px] text-gray-400 font-bold mt-2">B got back: {Math.round(gainB)} pts</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export function StatsPage() {
  const [allTeams, setAllTeams]     = useState<Team[]>([]);
  const [selected, setSelected]     = useState<string>('all');
  const [overview, setOverview]     = useState<StatsOverview | null>(null);
  const [teamStats, setTeamStats]   = useState<TeamStats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [hotColdTab, setHotColdTab] = useState<'hot' | 'cold'>('hot');
  const [tradesExpanded, setTradesExpanded] = useState(false);

  useEffect(() => {
    fetchTeams().then(setAllTeams).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (selected === 'all') {
      setTeamStats(null);
      fetchStatsOverview().then(setOverview).catch(console.error).finally(() => setLoading(false));
    } else {
      fetchTeamStats(selected).then(setTeamStats).catch(console.error).finally(() => setLoading(false));
    }
  }, [selected]);

  const activeList = overview && (hotColdTab === 'hot' ? overview.hotCold.hot : overview.hotCold.cold);

  return (
    <div className="min-h-screen bg-surface font-sans pb-16">
      {/* Header */}
      <div className="bg-[#0B1530] py-6 px-4 mb-0">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white tracking-tight">Stats</h1>
          <p className="text-white/40 text-xs mt-0.5 font-medium">
            {selected === 'all' ? 'Trade scoreboard and player form' : 'Drill into one team'}
          </p>
        </div>
      </div>

      {/* Team selector */}
      <div className="bg-[#060E20] border-b border-white/[0.06] px-4 py-3 mb-6">
        <div className="max-w-5xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelected('all')}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-colors whitespace-nowrap',
              selected === 'all' ? 'bg-white text-[#0B1530]' : 'text-white/40 hover:text-white/70 border border-white/20'
            )}
          >
            All Teams
          </button>
          {allTeams.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className="flex-shrink-0 transition-all duration-200 rounded-lg p-0.5"
              style={{
                opacity: selected === 'all' || selected === t.id ? 1 : 0.28,
                outline: selected === t.id ? `2px solid ${t.colors.primary}` : 'none',
              }}
              title={t.name}
            >
              <TeamLogo team={t} size="sm" />
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 space-y-8">
        {loading && (
          <div className="py-16 text-center text-gray-400 text-sm tracking-widest uppercase">Loading…</div>
        )}

        {/* GROUP VIEW */}
        {!loading && selected === 'all' && overview && tradesExpanded && (
          <AllTradesView onBack={() => setTradesExpanded(false)} />
        )}

        {!loading && selected === 'all' && overview && !tradesExpanded && (
          <>
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Trade Report Card</h2>
                <button
                  onClick={() => setTradesExpanded(true)}
                  className="text-[11px] font-black text-gray-500 hover:text-gray-800 uppercase tracking-widest transition-colors"
                >
                  See all trades →
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {overview.tradeReport.map(row => <TradeReportCard key={row.team.id} row={row} />)}
              </div>
            </section>

            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">Form Tracker</h2>
                <span className="text-[10px] text-gray-400 font-medium">Last 5 IPL matches per player</span>
              </div>
              <div className="inline-flex items-center bg-gray-50 rounded-full p-1 border border-gray-200 mb-4">
                {(['hot', 'cold'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setHotColdTab(t)}
                    className={cn(
                      'text-xs font-bold px-4 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5',
                      hotColdTab === t
                        ? t === 'hot' ? 'bg-green-600 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    )}
                  >
                    <span>{t === 'hot' ? '🔥' : '🧊'}</span>
                    <span>{t === 'hot' ? 'Hot' : 'Cold'}</span>
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-border-light overflow-hidden divide-y divide-gray-50">
                {activeList && activeList.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-sm">No data yet — run a gameday-stats sync first.</div>
                ) : activeList?.map(p => <FormCard key={p.name} player={p} accent={hotColdTab} />)}
              </div>
            </section>
          </>
        )}

        {/* TEAM DEEP-DIVE */}
        {!loading && selected !== 'all' && teamStats && <TeamDeepDive stats={teamStats} />}
      </div>
    </div>
  );
}

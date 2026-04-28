import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPlayer } from '../services/api';
import { PlayerDetail, PlayerGameStat, PlayerTimeline } from '../types';
import { getIplLogo } from '../utils/iplTeams';

export function PlayerPage() {
  const { apiId } = useParams<{ apiId: string }>();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]    = useState('');

  useEffect(() => {
    if (!apiId) return;
    setLoading(true);
    fetchPlayer(apiId)
      .then(setPlayer)
      .catch(() => setError('Player not found or not in the active season.'))
      .finally(() => setLoading(false));
  }, [apiId]);

  if (loading) return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="text-white/30 text-xs font-bold tracking-widest uppercase">Loading…</div>
    </div>
  );
  if (error || !player) return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center gap-3">
      <p className="text-white/40 text-sm">{error || 'Player not found'}</p>
      <Link to="/" className="text-blue-400 text-sm hover:underline">← Back to home</Link>
    </div>
  );

  const primary   = player.fantasyTeam.colors.primary;
  const secondary = player.fantasyTeam.colors.secondary;
  const hasGames  = player.gameStats.length > 0;

  const avgPts = hasGames
    ? (player.totalPoints / player.gameStats.length).toFixed(1)
    : player.timeline.length
      ? (player.totalPoints / player.timeline.length).toFixed(1)
      : '—';

  const gamesCount = hasGames ? player.gameStats.length : player.timeline.length;

  return (
    <div className="min-h-screen bg-surface font-sans">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative bg-bg-deep overflow-hidden">

        {/* Left accent strip */}
        <div className="absolute top-0 left-0 bottom-0 w-1" style={{ background: primary }} />

        {/* Subtle colour wash */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: `radial-gradient(ellipse at 80% 50%, ${secondary}18 0%, transparent 65%)` }} />

        {/* Fantasy team logo — huge ghost watermark */}
        <div className="absolute right-[-40px] sm:right-[-10px] inset-y-0 flex items-center pointer-events-none" style={{ zIndex: 1 }}>
          <img
            src={`/logos/${player.fantasyTeam.id}.png`}
            alt=""
            className="h-[85%] w-auto object-contain"
            style={{ opacity: 0.07, mixBlendMode: 'screen' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8 relative" style={{ zIndex: 2 }}>

          {/* Back */}
          <Link to={`/team/${player.fantasyTeam.id}`}
                className="inline-flex items-center gap-1.5 text-white/35 hover:text-white/65 text-label font-bold uppercase tracking-widest mb-8 transition-colors">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5"
                 strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {player.fantasyTeam.name}
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-10">

            {/* Photo */}
            <div className="flex-shrink-0 w-24 h-28 sm:w-32 sm:h-36 rounded-xl overflow-hidden relative self-center sm:self-start"
                 style={{ boxShadow: `0 0 0 1px ${primary}30, 0 8px 32px rgba(0,0,0,0.5)` }}>
              <PlayerPhoto imageUrl={player.imageUrl} name={player.name} color={primary} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded"
                      style={{ background: `${primary}22`, color: primary }}>
                  {player.role === 'WK-Batter' ? 'Wicket-Keeper' : player.role}
                </span>
                {player.isCaptain && (
                  <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-400">
                    Captain
                  </span>
                )}
                {player.isOverseas && (
                  <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded bg-white/8 text-white/40">
                    Overseas
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-white leading-none tracking-tight mb-1.5">
                {player.name}
              </h1>

              {/* Sub-info */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-6">
                {player.iplTeam && (
                  <span className="text-white/45 text-sm font-medium">{player.iplTeam}</span>
                )}
                <span className="text-white/15 hidden sm:inline">·</span>
                <Link to={`/team/${player.fantasyTeam.id}`}
                      className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                  <img src={`/logos/${player.fantasyTeam.id}.png`} alt={player.fantasyTeam.name}
                       className="w-4 h-4 object-contain"
                       onError={e => { (e.target as HTMLImageElement).src = player.fantasyTeam.logoUrl; }} />
                  <span className="text-white/45 text-sm font-medium">{player.fantasyTeam.name}</span>
                </Link>
              </div>

              {/* Stats strip */}
              <div className="flex items-center gap-6">
                <div>
                  <div className="num text-2xl sm:text-3xl leading-none"
                       style={{ color: primary }}>
                    {player.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-micro text-white/30 font-bold uppercase tracking-widest mt-0.5">
                    Total pts
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="num text-2xl sm:text-3xl leading-none text-white/70">
                    {gamesCount}
                  </div>
                  <div className="text-micro text-white/30 font-bold uppercase tracking-widest mt-0.5">
                    {hasGames ? 'Matches' : 'Match days'}
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="num text-2xl sm:text-3xl leading-none text-white/70">
                    {avgPts}
                  </div>
                  <div className="text-micro text-white/30 font-bold uppercase tracking-widest mt-0.5">
                    Avg / match
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">

        {hasGames ? (
          <GameStatsList stats={player.gameStats} primary={primary} />
        ) : player.timeline.length > 0 ? (
          <TimelineList timeline={player.timeline} primary={primary} />
        ) : (
          <div className="bg-white rounded-xl p-12 text-center text-gray-400 text-sm border border-border-light">
            No match data yet — run a sync first.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Match breakdown (gameday stats) ────────────────────────────────────────

function GameStatsList({ stats, primary }: { stats: PlayerGameStat[]; primary: string }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      <SectionHeader label="Match by Match" color={primary} />
      <div className="space-y-1.5">
        {stats.map(stat => (
          <MatchRow
            key={stat.gameDayId}
            stat={stat}
            primary={primary}
            isOpen={open === stat.gameDayId}
            onToggle={() => setOpen(p => p === stat.gameDayId ? null : stat.gameDayId)}
          />
        ))}
      </div>
    </div>
  );
}

function MatchRow({ stat, primary, isOpen, onToggle }:
  { stat: PlayerGameStat; primary: string; isOpen: boolean; onToggle: () => void }) {

  const bat = stat.runsPoints + stat.fourPoints + stat.sixPoints + stat.halfCenturyPoints +
              stat.fullCenturyPoints + stat.runBonusPoints + stat.thirtyBonusPoints +
              stat.strikeRatePoints + stat.duckOutPoints;
  const bwl = stat.wicketPoints + stat.wktBonusPoints + stat.twoWkHaul + stat.threeWkHaul +
              stat.fourWkHaul + stat.fiveWkHaul + stat.economyRatePoint + stat.dotBonusPoint +
              stat.hatTrickPoints;
  const fld = stat.catchPoints + stat.catchBonusPoints + stat.stumpingPoints +
              stat.directRunOutPoints + stat.runOutPoints;

  const dateStr = stat.matchDate
    ? new Date(stat.matchDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : '';

  const matchParts = stat.matchLabel.split(' vs ');
  const homeShort  = matchParts[0]?.trim() ?? '';
  const awayShort  = matchParts[1]?.trim() ?? '';
  const homeLogo   = getIplLogo(homeShort);
  const awayLogo   = getIplLogo(awayShort);

  return (
    <div className="bg-white rounded-xl border border-border-light overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Gameday badge */}
        <div className="flex-shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
             style={{ background: `${primary}15`, color: primary }}>
          GD{stat.gameDayId}
        </div>

        {/* Match label + date */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {homeLogo
              ? <img src={homeLogo} alt={homeShort} className="w-5 h-5 object-contain flex-shrink-0" />
              : <span className="text-xs font-black text-gray-700">{homeShort}</span>}
            {homeLogo && <span className="text-xs font-black text-gray-700">{homeShort}</span>}
            <span className="text-[10px] text-gray-300 font-medium">vs</span>
            {awayLogo
              ? <img src={awayLogo} alt={awayShort} className="w-5 h-5 object-contain flex-shrink-0" />
              : <span className="text-xs font-black text-gray-700">{awayShort}</span>}
            {awayLogo && <span className="text-xs font-black text-gray-700">{awayShort}</span>}
          </div>
          {dateStr && <span className="text-label text-gray-400">{dateStr}</span>}
        </div>

        {/* Category totals — shown on sm+ */}
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          {bat !== 0 && <StatChip label="BAT" value={bat} />}
          {bwl !== 0 && <StatChip label="BWL" value={bwl} />}
          {fld !== 0 && <StatChip label="FLD" value={fld} />}
          {stat.momPoints > 0 && <StatChip label="MOM" value={stat.momPoints} />}
        </div>

        {/* Total */}
        <div className="flex-shrink-0 flex items-center gap-2 ml-2">
          <span className="num text-base text-gray-900">
            {stat.overallPoints}
          </span>
          <svg className={`w-3.5 h-3.5 text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
               fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
               strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Breakdown */}
      {isOpen && (
        <div className="border-t border-border-light px-4 py-4 bg-gray-50/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <StatGroup label="Batting" rows={[
              { label: 'Runs',             value: stat.runsPoints },
              { label: 'Fours',            value: stat.fourPoints },
              { label: 'Sixes',            value: stat.sixPoints },
              { label: '30+ Bonus',        value: stat.thirtyBonusPoints },
              { label: '50 Bonus',         value: stat.halfCenturyPoints },
              { label: '100 Bonus',        value: stat.fullCenturyPoints },
              { label: 'Run Bonus',        value: stat.runBonusPoints },
              { label: 'Strike Rate',      value: stat.strikeRatePoints },
              { label: 'Duck',             value: stat.duckOutPoints },
            ]} />
            <StatGroup label="Bowling" rows={[
              { label: 'Wickets',          value: stat.wicketPoints },
              { label: 'Wicket Bonus',     value: stat.wktBonusPoints },
              { label: '2-wkt Haul',       value: stat.twoWkHaul },
              { label: '3-wkt Haul',       value: stat.threeWkHaul },
              { label: '4-wkt Haul',       value: stat.fourWkHaul },
              { label: '5-wkt Haul',       value: stat.fiveWkHaul },
              { label: 'Economy',          value: stat.economyRatePoint },
              { label: 'Dot Balls',        value: stat.dotBonusPoint },
              { label: 'Hat-trick',        value: stat.hatTrickPoints },
            ]} />
            <StatGroup label="Fielding" rows={[
              { label: 'Catches',          value: stat.catchPoints },
              { label: 'Catch Bonus',      value: stat.catchBonusPoints },
              { label: 'Stumping',         value: stat.stumpingPoints },
              { label: 'Direct Run-out',   value: stat.directRunOutPoints },
              { label: 'Run-out',          value: stat.runOutPoints },
            ]} />
            <StatGroup label="Base" rows={[
              { label: 'Playing',          value: stat.playedPoints },
              { label: 'Man of the Match', value: stat.momPoints },
            ]} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatGroup({ label, rows }: { label: string; rows: { label: string; value: number }[] }) {
  const nonZero = rows.filter(r => r.value !== 0);
  if (!nonZero.length) return null;
  return (
    <div>
      <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</div>
      <div className="space-y-1">
        {nonZero.map(r => (
          <div key={r.label} className="flex items-baseline justify-between">
            <span className="text-xs text-gray-500 font-medium">{r.label}</span>
            <span className={`text-xs num ${r.value < 0 ? 'text-red-500' : 'text-gray-800'}`}>
              {r.value > 0 ? '+' : ''}{r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-micro font-bold text-gray-500">
      {label} <span className={`font-black ${value < 0 ? 'text-red-400' : 'text-gray-700'}`}>
        {value > 0 ? '+' : ''}{value}
      </span>
    </span>
  );
}

// ── Timeline fallback (until gameday stats are synced) ─────────────────────

function TimelineList({ timeline, primary }: { timeline: PlayerTimeline[]; primary: string }) {
  const reversed = [...timeline].reverse();
  return (
    <div>
      <SectionHeader label="Points History" color={primary} />
      <div className="bg-white rounded-xl border border-border-light overflow-hidden divide-y divide-gray-50">
        {reversed.map((row, i) => (
          <div key={row.date} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition-colors">
            <div className="flex items-center gap-4">
              <span className="text-label font-black text-gray-200 tabular-nums w-4 text-right">{reversed.length - i}</span>
              <div>
                <div className="text-sm font-bold text-gray-800">
                  {new Date(row.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="text-label text-gray-400 font-medium">
                  <span className="num">{row.cumulativePoints.toLocaleString()}</span> pts cumulative
                </div>
              </div>
            </div>
            <span className="text-sm num" style={{ color: primary }}>
              +{row.pointsGained}
            </span>
          </div>
        ))}
      </div>
      <p className="text-center text-label text-gray-400 mt-4 font-medium">
        Run Admin → Sync Match Stats to see per-match breakdown.
      </p>
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-0.5 h-4 rounded-full" style={{ background: color }} />
      <span className="text-micro font-black uppercase tracking-widest text-gray-500">{label}</span>
    </div>
  );
}

function PlayerPhoto({ imageUrl, name, color }: { imageUrl: string; name: string; color: string }) {
  const [err, setErr] = React.useState(false);
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  if (err) return (
    <div className="w-full h-full flex items-center justify-center text-2xl font-black"
         style={{ background: `${color}20`, color: `${color}80` }}>
      {initials}
    </div>
  );
  return (
    <img
      src={imageUrl}
      alt={name}
      onError={() => setErr(true)}
      className="w-full h-full object-cover object-top"
    />
  );
}

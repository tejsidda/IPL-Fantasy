import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchTeam, fetchTeams, fetchChampions, fetchUpcomingFixtures, fetchTrades, UpcomingFixtures, Trade, TradePlayer, TradeTeam } from '../services/api';
import { getIplLogo, getIplShort } from '../utils/iplTeams';
import { cn } from '../lib/utils';
import { Team, Player } from '../types';

function ordinal(n: number): string {
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function mixDark(hex: string, amount: number): string {
  const c = hex.replace('#', '');
  const r = Math.round(parseInt(c.slice(0, 2), 16) * (1 - amount));
  const g = Math.round(parseInt(c.slice(2, 4), 16) * (1 - amount));
  const b = Math.round(parseInt(c.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r},${g},${b})`;
}

export function TeamDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam]               = useState<Team | null>(null);
  const [allTeams, setAllTeams]       = useState<Team[]>([]);
  const [wonSeasons, setWonSeasons]   = useState<string[]>([]);
  const [fixtures, setFixtures]       = useState<UpcomingFixtures | null>(null);
  const [showAllPlaying, setShowAllPlaying] = useState(false);
  const [loading, setLoading]         = useState(true);

  // Tab + filters
  const [activeTab, setActiveTab]     = useState<'squad' | 'trades'>('squad');
  const [iplFilter, setIplFilter]     = useState('');
  const [roleFilter, setRoleFilter]   = useState('');

  // Trades
  const [trades, setTrades]           = useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [tradesLoaded, setTradesLoaded]   = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setShowAllPlaying(false);
    setActiveTab('squad');
    setIplFilter('');
    setRoleFilter('');
    setTrades([]);
    setTradesLoaded(false);
    Promise.all([
      fetchTeam(id),
      fetchTeams(),
      fetchChampions(),
      fetchUpcomingFixtures().catch(() => null),
    ])
      .then(([teamData, teamsData, champions, fixturesData]) => {
        setTeam(teamData);
        setAllTeams(teamsData);
        setWonSeasons(champions.filter(c => c.champion.id === id).map(c => c.season.name));
        setFixtures(fixturesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Lazy-load trades on first tab switch
  useEffect(() => {
    if (activeTab !== 'trades' || tradesLoaded || !id) return;
    setTradesLoading(true);
    fetchTrades(id)
      .then(setTrades)
      .catch(console.error)
      .finally(() => { setTradesLoading(false); setTradesLoaded(true); });
  }, [activeTab, tradesLoaded, id]);

  if (loading) return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="text-white/30 text-sm font-medium tracking-widest uppercase">Loading…</div>
    </div>
  );

  if (!team) return (
    <div className="min-h-screen flex items-center justify-center text-white">Team not found</div>
  );

  const primary   = team.colors.primary;
  const secondary = team.colors.secondary || primary;

  const wicketKeepers = team.players.filter(p => p.role === 'WK-Batter');
  const batters       = team.players.filter(p => p.role === 'Batter');
  const allRounders   = team.players.filter(p => p.role === 'All-Rounder');
  const bowlers       = team.players.filter(p => p.role === 'Bowler');

  const todaysScorers = team.players
    .filter(p => (p.pointsToday ?? 0) > 0)
    .sort((a, b) => (b.pointsToday ?? 0) - (a.pointsToday ?? 0));

  const upcomingIplTeams = new Set<string>();
  if (fixtures?.hasUpcoming) {
    for (const m of fixtures.matches) {
      upcomingIplTeams.add(m.homeTeamShort.toUpperCase());
      upcomingIplTeams.add(m.awayTeamShort.toUpperCase());
    }
  }
  const playingTomorrow = team.players.filter(p =>
    upcomingIplTeams.has(getIplShort(p.iplTeam ?? '').toUpperCase())
  );
  const watchPlayers  = playingTomorrow.filter(p => p.lastGamePoints !== null && (p.lastGamePoints ?? 0) > 50);
  const otherPlayers  = playingTomorrow.filter(p => !watchPlayers.includes(p));
  const showUpcoming  = !!(fixtures?.hasUpcoming && playingTomorrow.length > 0);

  // Player filter logic
  const iplTeams = [...new Set(team.players.map(p => p.iplTeam).filter(Boolean))].sort() as string[];
  const isFiltered = iplFilter !== '' || roleFilter !== '';
  const filteredPlayers = isFiltered
    ? team.players
        .filter(p => (!iplFilter || p.iplTeam === iplFilter) && (!roleFilter || p.role === roleFilter))
        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
    : [];

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: `${primary}09` }}>

      {/* ── Team switcher — mobile only ── */}
      <div className="sm:hidden bg-bg-deep border-b border-white/[0.06] py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="overflow-x-auto no-scrollbar py-1">
            <div className="flex gap-5 sm:gap-10 px-2 w-max mx-auto">
              {allTeams.map(t => {
                const isActive = t.id === team.id;
                return (
                  <Link
                    key={t.id}
                    to={`/team/${t.id}`}
                    className="flex-shrink-0 flex items-center justify-center transition-all duration-300"
                    style={{ opacity: isActive ? 1 : 0.35 }}
                  >
                    <img
                      src={`/logos/${t.id}.png`}
                      alt={t.shortName}
                      className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain"
                      onError={e => { (e.target as HTMLImageElement).src = t.logoUrl; }}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg,
            ${mixDark(primary, 0.70)} 0%,
            ${mixDark(primary, 0.82)} 38%,
            #060E1C               68%,
            #030810               100%)`
        }}
      >
        <div
          className="absolute -top-24 -right-24 w-[480px] h-[480px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${primary}18 0%, transparent 65%)` }}
        />

        {wonSeasons.length > 0 && (
          <>
            {/* Huge ghost trophy — right side, overflows top/bottom, clipped */}
            <div
              className="absolute right-[-50px] sm:right-[-20px] inset-y-0 flex items-center pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <img
                src="https://www.iplt20.com/assets/images/teams-trophy-new.png"
                alt=""
                className="h-[260px] sm:h-[340px] w-auto object-contain"
                style={{ opacity: 0.09, mixBlendMode: 'screen' }}
              />
            </div>
            {/* Championship years — big Bebas Neue spanning across the hero */}
            <div
              className="absolute left-0 right-0 bottom-[72px] pointer-events-none px-5"
              style={{ zIndex: 1 }}
            >
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 'clamp(30px, 5vw, 56px)',
                  color: 'white',
                  opacity: 0.09,
                  letterSpacing: '0.14em',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                {wonSeasons.join('   ·   ')}
              </span>
            </div>
          </>
        )}

        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-8 relative z-10">
          <div className="flex items-center gap-3">

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0">
                <div className="absolute inset-0 rounded-full blur-xl pointer-events-none" style={{ backgroundColor: `${secondary}38` }} />
                <img src={`/logos/${team.id}.png`} alt={team.name} className="relative w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).src = team.logoUrl; }} style={{ filter: `drop-shadow(0 0 10px ${primary}80)` }} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-white leading-tight">{team.name}</h1>
                </div>
                {wonSeasons.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <img src="https://www.iplt20.com/assets/images/teams-trophy-new.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0" />
                    <span className="text-sm sm:text-base font-bold" style={{ color: '#F5C842', letterSpacing: '0.04em' }}>
                      Champions · {wonSeasons.map(s => s.replace(/^IPL\s*/i, '')).join(' · ')}
                    </span>
                  </div>
                )}
                {team.owner && team.owner !== team.name && team.owner !== 'Unknown' && team.owner !== 'TBD' && (
                  <p className="text-white/35 text-micro font-medium mb-1">{team.owner}</p>
                )}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(team.rank ?? 0) > 0 && (
                    <span className="text-white/50 text-xs font-medium">{ordinal(team.rank ?? 0)} place</span>
                  )}
                  {(team.points ?? 0) > 0 && (
                    <span className="inline-flex items-center rounded-full py-0.5 px-2 text-xs text-white bg-white/[0.13]">
                      <span className="num">{(team.points ?? 0).toLocaleString()}</span>&nbsp;pts
                    </span>
                  )}
                  {(team.pointsChange ?? 0) > 0 && (
                    <span className="inline-flex items-center rounded-full py-0.5 px-2 text-xs font-bold text-green-300 bg-green-500/[0.17] border border-green-400/20">
                      <span className="num">+{team.pointsChange}</span>&nbsp;today
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Scorer ticker */}
        {todaysScorers.length > 0 && (
          <ScorerTicker scorers={todaysScorers} primaryColor={primary} />
        )}

        {/* Desktop team switcher — lives inside the hero */}
        <div className="hidden sm:block max-w-7xl mx-auto px-8 pb-6 relative z-10">
          <div className="flex justify-center gap-8 lg:gap-14">
            {allTeams.map(t => {
              const isActive = t.id === team.id;
              return (
                <Link
                  key={t.id}
                  to={`/team/${t.id}`}
                  className="flex-shrink-0 transition-all duration-300"
                  style={{ opacity: isActive ? 1 : 0.28 }}
                >
                  <img
                    src={`/logos/${t.id}.png`}
                    alt={t.shortName}
                    className="w-16 h-16 lg:w-24 lg:h-24 object-contain"
                    onError={e => { (e.target as HTMLImageElement).src = t.logoUrl; }}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Tab strip */}
        <div className="bg-white rounded-t-3xl max-w-7xl mx-auto px-6 pt-4 mt-3">
          <div className="flex gap-6 overflow-x-auto no-scrollbar text-sm font-bold pb-1">
            {(['squad', 'trades'] as const).map(tab => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-1 border-b-2 whitespace-nowrap uppercase transition-colors ${active ? '' : 'text-gray-400 hover:text-gray-600 border-transparent'}`}
                  style={active ? { color: primary, borderColor: primary } : {}}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {activeTab === 'squad' ? (
          <>
            {/* Player filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={iplFilter}
                onChange={e => setIplFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-offset-0"
                style={{ '--tw-ring-color': primary } as React.CSSProperties}
              >
                <option value="">All IPL Teams</option>
                {iplTeams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <div className="flex gap-1.5 flex-wrap">
                {['All', 'WK-Batter', 'Batter', 'All-Rounder', 'Bowler'].map(role => {
                  const val = role === 'All' ? '' : role;
                  const active = roleFilter === val;
                  return (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(val)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                      style={active
                        ? { backgroundColor: primary, color: '#fff' }
                        : { backgroundColor: '#f3f4f6', color: '#4b5563' }
                      }
                    >
                      {role}
                    </button>
                  );
                })}
              </div>

              {isFiltered && (
                <button
                  onClick={() => { setIplFilter(''); setRoleFilter(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 font-medium underline"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Upcoming match panel */}
            {showUpcoming && fixtures && (
              <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
                <div className="px-4 py-3 flex items-center gap-3 border-b border-border-light bg-gray-50/70">
                  <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: primary }} />
                  <span className="text-micro font-black uppercase tracking-widest text-gray-500 flex-1">Next Match</span>
                  <span className="text-micro font-black text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: primary }}>
                    {fixtures.dateLabel}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2 border-b border-border-light">
                  {fixtures.matches.map(m => {
                    const homeLogo = getIplLogo(m.homeTeamShort);
                    const awayLogo = getIplLogo(m.awayTeamShort);
                    return (
                      <div key={m.gamedayId} className="flex items-center gap-2">
                        {homeLogo ? <img src={homeLogo} alt={m.homeTeamShort} className="w-7 h-7 object-contain flex-shrink-0" /> : <span className="text-[9px] font-black text-gray-500 w-7 text-center">{m.homeTeamShort}</span>}
                        <span className="text-sm font-black text-gray-800">{m.homeTeamShort}</span>
                        <span className="text-micro text-gray-400 font-medium mx-0.5">vs</span>
                        <span className="text-sm font-black text-gray-800">{m.awayTeamShort}</span>
                        {awayLogo ? <img src={awayLogo} alt={m.awayTeamShort} className="w-7 h-7 object-contain flex-shrink-0" /> : <span className="text-[9px] font-black text-gray-500 w-7 text-center">{m.awayTeamShort}</span>}
                        {m.timeCDT && <span className="ml-auto text-label font-mono text-gray-400 flex-shrink-0">{m.timeCDT}</span>}
                      </div>
                    );
                  })}
                </div>
                {watchPlayers.length > 0 ? (
                  <>
                    <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Players to Watch</span>
                      <span className="text-[9px] text-gray-400">· &gt;50 pts last game</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {watchPlayers.map(p => <PlayingPlayerRow key={p.id} player={p} teamColor={primary} />)}
                    </div>
                    {otherPlayers.length > 0 && (
                      <>
                        <button
                          onClick={() => setShowAllPlaying(x => !x)}
                          className="w-full px-4 py-2.5 flex items-center justify-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-t border-border-light"
                        >
                          {showAllPlaying ? 'Show less ▲' : `Show all ${playingTomorrow.length} playing ${fixtures.dateLabel?.toLowerCase() ?? ''} ▼`}
                        </button>
                        {showAllPlaying && (
                          <div className="divide-y divide-gray-50 border-t border-border-light">
                            {otherPlayers.map(p => <PlayingPlayerRow key={p.id} player={p} teamColor={primary} />)}
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2.5 text-xs text-gray-400">
                      {playingTomorrow.length} player{playingTomorrow.length !== 1 ? 's' : ''} from your squad
                      {' '}play{playingTomorrow.length === 1 ? 's' : ''} {fixtures.dateLabel?.toLowerCase()}.
                    </div>
                    <button
                      onClick={() => setShowAllPlaying(x => !x)}
                      className="w-full px-4 py-2 flex items-center justify-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-t border-border-light"
                    >
                      {showAllPlaying ? 'Hide ▲' : `Show ${playingTomorrow.length} players ▼`}
                    </button>
                    {showAllPlaying && (
                      <div className="divide-y divide-gray-50 border-t border-border-light">
                        {playingTomorrow.map(p => <PlayingPlayerRow key={p.id} player={p} teamColor={primary} />)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Players — filtered flat list or grouped by role */}
            {isFiltered ? (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1 h-5 rounded-full" style={{ backgroundColor: primary }} />
                  <h2 className="text-xs font-black uppercase tracking-widest text-gray-600">
                    {filteredPlayers.length} Player{filteredPlayers.length !== 1 ? 's' : ''}
                    {iplFilter ? ` · ${iplFilter}` : ''}
                    {roleFilter ? ` · ${roleFilter}` : ''}
                  </h2>
                </div>
                {filteredPlayers.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                    {filteredPlayers.map(p => <PlayerRow key={p.id} player={p} teamColor={primary} />)}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-400 text-sm">No players match these filters</div>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <RoleSection title="Wicket-Keepers" players={wicketKeepers} teamColor={primary} />
                <RoleSection title="Batters"        players={batters}       teamColor={primary} />
                <RoleSection title="All-Rounders"   players={allRounders}   teamColor={primary} />
                <RoleSection title="Bowlers"        players={bowlers}       teamColor={primary} />
              </div>
            )}
          </>
        ) : (
          <TradesTab
            trades={trades}
            loading={tradesLoading}
            teamId={id!}
            primaryColor={primary}
          />
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function ScorerTicker({ scorers, primaryColor }: { scorers: Player[]; primaryColor: string }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? scorers : scorers.slice(0, 5);
  return (
    <div className="border-t border-white/[0.07]" style={{ background: 'rgba(0,0,0,0.38)' }}>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center overflow-x-auto no-scrollbar gap-0">
        <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white/25 mr-3 flex-shrink-0">Today</span>
        {visible.map((p, i) => (
          <React.Fragment key={p.id}>
            {i > 0 && <span className="text-white/15 mx-2.5 flex-shrink-0 select-none">|</span>}
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[11px] font-bold text-white/75 whitespace-nowrap">
                {p.name.split(' ').pop()}
              </span>
              {p.iplTeam && (
                <span className="text-[9px] text-white/30 whitespace-nowrap">{p.iplTeam}</span>
              )}
              <span className="text-[11px] font-black whitespace-nowrap" style={{ color: 'var(--color-pos)' }}>
                +{p.pointsToday}
              </span>
            </div>
          </React.Fragment>
        ))}
        {scorers.length > 5 && (
          <button
            onClick={() => setExpanded(x => !x)}
            className="ml-3 text-[9px] font-black uppercase tracking-widest text-white/35 hover:text-white/65 transition-colors flex-shrink-0"
          >
            {expanded ? 'less ▲' : `+${scorers.length - 5} more ▼`}
          </button>
        )}
      </div>
    </div>
  );
}

function TodayScorerRow({ player, rank, teamColor }: { player: Player; rank: number; teamColor: string }) {
  const [imgErr, setImgErr] = useState(false);
  const hasPhoto = player.imageUrl?.includes('iplt20.com') && !imgErr;
  const initials = player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span className="text-micro font-black text-white/20 w-4 text-right flex-shrink-0">{rank}</span>
      <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-label font-black" style={{ background: `${teamColor}35`, color: `${teamColor}bb` }}>
        {hasPhoto ? <img src={player.imageUrl} alt={player.name} onError={() => setImgErr(true)} className="w-full h-full object-cover object-top" /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-label font-bold truncate">{player.name}</div>
        {player.iplTeam && <div className="text-white/30 text-micro">{player.iplTeam}</div>}
      </div>
      <span className="text-green-400 num text-sm flex-shrink-0">+{player.pointsToday}</span>
    </div>
  );
}

function PlayingPlayerRow({ player, teamColor }: { player: Player; teamColor: string }) {
  const [imgErr, setImgErr] = useState(false);
  const hasPhoto = player.imageUrl?.includes('iplt20.com') && !imgErr;
  const initials = player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const iplLogo  = getIplLogo(player.iplTeam ?? '');
  const isWatch  = player.lastGamePoints !== null && (player.lastGamePoints ?? 0) > 50;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-black" style={{ background: `${teamColor}18`, color: `${teamColor}80` }}>
        {hasPhoto ? <img src={player.imageUrl} alt={player.name} onError={() => setImgErr(true)} className="w-full h-full object-cover object-top" /> : initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-gray-900 truncate">{player.name}</span>
          {player.isCaptain && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: teamColor }}>C</span>}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          {iplLogo && <img src={iplLogo} alt="" className="w-3 h-3 object-contain opacity-55 flex-shrink-0" />}
          <span className="text-label text-gray-400 truncate">{player.iplTeam}{player.role ? ` · ${player.role}` : ''}</span>
        </div>
      </div>
      {player.lastGamePoints !== null && (
        <div className="text-right flex-shrink-0">
          <div className={cn('text-sm num', isWatch ? 'text-green-600' : 'text-gray-400')}>{player.lastGamePoints}</div>
          <div className="text-[9px] text-gray-400 uppercase tracking-wide">last</div>
        </div>
      )}
    </div>
  );
}

function RoleSection({ title, players, teamColor }: { title: string; players: Player[]; teamColor: string }) {
  if (!players.length) return null;
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: teamColor }} />
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-600">{title}</h2>
        <span className="text-micro font-black px-2 py-0.5 rounded-full" style={{ background: `${teamColor}18`, color: teamColor }}>{players.length}</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
        {players.map(p => <PlayerRow key={p.id} player={p} teamColor={teamColor} />)}
      </div>
    </div>
  );
}

const PlayerRow: React.FC<{ player: Player; teamColor: string }> = ({ player, teamColor }) => {
  const navigate = useNavigate();
  const [imgErr, setImgErr] = React.useState(false);
  const hasPhoto   = player.imageUrl?.includes('iplt20.com') && !imgErr;
  const initials   = player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const canNavigate = !!player.apiId;
  const iplLogo    = getIplLogo(player.iplTeam ?? '');
  return (
    <div
      className={cn('bg-white rounded-xl flex items-center gap-2 p-2 sm:gap-3 sm:p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg', canNavigate ? 'cursor-pointer' : 'cursor-default')}
      style={{ boxShadow: `0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px ${teamColor}18` }}
      onClick={() => canNavigate && navigate(`/player/${player.apiId}`)}
    >
      <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center relative text-sm font-black" style={{ background: `linear-gradient(135deg, ${teamColor}22, ${teamColor}0a)`, color: `${teamColor}70` }}>
        {hasPhoto ? <img src={player.imageUrl} alt={player.name} onError={() => setImgErr(true)} className="w-full h-full object-cover object-top" /> : initials}
        {player.isCaptain && (
          <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 rounded-tl-lg flex items-center justify-center text-[8px] font-black text-white" style={{ backgroundColor: teamColor }}>C</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-bold text-gray-900 text-xs sm:text-sm leading-tight truncate">{player.name}</span>
          {player.isOverseas && (
            <span className="text-[9px] font-black tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: `${teamColor}18`, color: teamColor, border: `1px solid ${teamColor}30` }}>OVS</span>
          )}
        </div>
        {player.iplTeam && (
          <div className="flex items-center gap-1 mt-0.5">
            {iplLogo && <img src={iplLogo} alt="" className="w-3.5 h-3.5 object-contain opacity-55 flex-shrink-0" />}
            <p className="text-label text-gray-400 font-medium">{player.iplTeam}</p>
          </div>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="num text-sm" style={{ color: teamColor }}>{(player.points ?? 0).toLocaleString()}</div>
        <div className="text-micro text-gray-400 uppercase tracking-wider">pts</div>
        {(player.pointsToday ?? 0) > 0 && (
          <div className="text-micro text-green-500 font-bold flex items-center justify-end gap-0.5"><span>▲</span><span className="num">+{player.pointsToday}</span></div>
        )}
        {(player.pointsToday ?? 0) < 0 && (
          <div className="text-micro text-red-400 font-bold flex items-center justify-end gap-0.5"><span>▼</span><span className="num">{player.pointsToday}</span></div>
        )}
      </div>
    </div>
  );
};

// ── Trades tab ────────────────────────────────────────────────────

function TradesTab({ trades, loading, teamId, primaryColor }: {
  trades: Trade[]; loading: boolean; teamId: string; primaryColor: string;
}) {
  const [mode, setMode] = useState<'alltime' | 'since_trade'>('alltime');

  if (loading) return (
    <div className="py-12 text-center text-gray-400 text-sm tracking-widest uppercase">Loading trades…</div>
  );

  if (!trades.length) return (
    <div className="py-16 text-center">
      <div className="text-5xl mb-4 text-gray-200">⇄</div>
      <p className="text-sm font-bold text-gray-400">No trades this season</p>
    </div>
  );

  const summaries = trades.map(trade => {
    const isA = trade.team_a?.id === teamId;
    const players_out = isA ? trade.players_a_to_b : trade.players_b_to_a;
    const players_in  = isA ? trade.players_b_to_a : trade.players_a_to_b;
    const other_team  = isA ? trade.team_b : trade.team_a;
    const ptOut = players_out.reduce((s, p) => s + (mode === 'alltime' ? p.points_alltime : p.points_since_trade), 0);
    const ptIn  = players_in.reduce((s, p)  => s + (mode === 'alltime' ? p.points_alltime : p.points_since_trade), 0);
    return { trade, players_out, players_in, other_team, ptOut, ptIn, net: ptIn - ptOut };
  });

  const totalNet = summaries.reduce((s, t) => s + t.net, 0);
  const wins     = summaries.filter(t => t.net > 0).length;
  const losses   = summaries.filter(t => t.net < 0).length;
  const draws    = summaries.filter(t => t.net === 0).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-xl p-4 border border-border-light shadow-sm flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Trade Record</div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-black text-sm">{wins}W</span>
            <span className="text-gray-300">·</span>
            <span className="text-red-500 font-black text-sm">{losses}L</span>
            {draws > 0 && <><span className="text-gray-300">·</span><span className="text-gray-500 font-black text-sm">{draws}D</span></>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Net Points</div>
          <div className={`num text-xl font-black ${totalNet >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {totalNet >= 0 ? '+' : ''}{Math.round(totalNet).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Points:</span>
        {(['alltime', 'since_trade'] as const).map(val => (
          <button
            key={val}
            onClick={() => setMode(val)}
            className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            style={mode === val ? { backgroundColor: primaryColor, color: '#fff' } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
          >
            {val === 'alltime' ? 'All-Time' : 'Since Trade'}
          </button>
        ))}
      </div>

      {/* Trade cards */}
      <div className="space-y-3">
        {summaries.map(({ trade, players_in, players_out, other_team, ptIn, ptOut, net }) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            playersIn={players_in}
            playersOut={players_out}
            otherTeam={other_team}
            ptIn={ptIn}
            ptOut={ptOut}
            net={net}
            mode={mode}
          />
        ))}
      </div>
    </div>
  );
}

function TradeCard({ trade, playersIn, playersOut, otherTeam, ptIn, ptOut, net, mode }: {
  trade: Trade;
  playersIn: TradePlayer[];
  playersOut: TradePlayer[];
  otherTeam: TradeTeam | null;
  ptIn: number; ptOut: number; net: number;
  mode: 'alltime' | 'since_trade';
}) {
  const won  = net > 0;
  const lost = net < 0;
  const dateStr = new Date(trade.trade_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-border-light bg-gray-50/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">{dateStr}</span>
          {trade.notes && <span className="text-xs text-gray-400 truncate max-w-[120px]">· {trade.notes}</span>}
        </div>
        <div className="flex items-center gap-2">
          {otherTeam && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">vs</span>
              <img src={`/logos/${otherTeam.id}.png`} alt={otherTeam.shortName} className="w-5 h-5 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="text-xs font-black" style={{ color: otherTeam.colors.primary }}>{otherTeam.shortName}</span>
            </div>
          )}
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${won ? 'bg-green-100 text-green-700' : lost ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
            {won ? 'WIN' : lost ? 'LOSS' : 'DRAW'}
          </span>
        </div>
      </div>

      {/* Players */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">
          {/* You gave */}
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">You gave</div>
            <div className="flex flex-wrap gap-2">
              {playersOut.map(p => <TradePlayerChip key={p.id} player={p} mode={mode} />)}
            </div>
            <div className="mt-2 text-xs font-black text-red-500 num">
              -{Math.round(ptOut).toLocaleString()} pts
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center pt-7 text-gray-300 font-black text-lg">⇄</div>

          {/* You got */}
          <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">You got</div>
            <div className="flex flex-wrap gap-2">
              {playersIn.map(p => <TradePlayerChip key={p.id} player={p} mode={mode} />)}
            </div>
            <div className="mt-2 text-xs font-black text-green-600 num">
              +{Math.round(ptIn).toLocaleString()} pts
            </div>
          </div>
        </div>

        {/* Net */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
          <span className={`num text-sm font-black ${won ? 'text-green-600' : lost ? 'text-red-500' : 'text-gray-400'}`}>
            Net: {net >= 0 ? '+' : ''}{Math.round(net).toLocaleString()} pts
          </span>
        </div>
      </div>
    </div>
  );
}

function TradePlayerChip({ player, mode }: { player: TradePlayer; mode: 'alltime' | 'since_trade' }) {
  const [imgErr, setImgErr] = useState(false);
  const pts = mode === 'alltime' ? player.points_alltime : player.points_since_trade;
  const initials = player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-1 w-14">
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400 flex-shrink-0">
        {player.apiId && !imgErr ? (
          <img
            src={`https://fantasy.iplt20.com/classic/static-assets/build/images/players/onpitch/${player.apiId}.png`}
            alt={player.name}
            className="w-full h-full object-cover object-top"
            onError={() => setImgErr(true)}
          />
        ) : initials}
      </div>
      <div className="text-center w-full">
        <div className="text-[9px] font-bold text-gray-700 leading-tight truncate">{player.name.split(' ').pop()}</div>
        <div className="num text-[9px] text-gray-400">{Math.round(pts)}</div>
      </div>
    </div>
  );
}

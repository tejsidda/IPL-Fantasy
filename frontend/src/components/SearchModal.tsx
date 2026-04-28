import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { fetchSearch, SearchResult } from '../services/api';

interface Props {
  onClose: () => void;
}

export function SearchModal({ onClose }: Props) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults(null); return; }
    const timeout = setTimeout(() => {
      setLoading(true);
      fetchSearch(query)
        .then(setResults)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function go(path: string) {
    navigate(path);
    onClose();
  }

  const hasResults = results && (results.teams.length > 0 || results.players.length > 0);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg bg-[#111827] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search players or teams…"
            className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm font-medium"
          />
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[65vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-white/30 text-sm">Searching…</div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="px-4 py-6 text-center text-white/30 text-sm">No results for "{query}"</div>
          )}

          {!loading && query.length < 2 && (
            <div className="px-4 py-6 text-center text-white/30 text-sm">Type at least 2 characters to search</div>
          )}

          {/* Fantasy teams */}
          {!loading && results && results.teams.length > 0 && (
            <div>
              <div className="px-4 py-2 text-micro font-black uppercase tracking-widest text-white/30 bg-white/5">
                Auction Teams
              </div>
              {results.teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => go(`/team/${team.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center p-1.5"
                    style={{ background: `${team.colors.primary}25`, border: `1px solid ${team.colors.primary}40` }}
                  >
                    <img src={team.logoUrl} alt={team.shortName} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm">{team.name}</div>
                    <div className="text-white/35 text-label mt-0.5">{team.shortName}</div>
                  </div>
                  <svg className="w-4 h-4 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* Players */}
          {!loading && results && results.players.length > 0 && (
            <div>
              <div className="px-4 py-2 text-micro font-black uppercase tracking-widest text-white/30 bg-white/5">
                Players
              </div>
              {results.players.map((player, i) => (
                <button
                  key={i}
                  onClick={() => player.apiId ? go(`/player/${player.apiId}`) : undefined}
                  disabled={!player.apiId}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left disabled:cursor-default border-b border-white/5"
                >
                  {/* Player photo / initials */}
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black overflow-hidden"
                    style={{
                      background: player.fantasyTeam ? `${player.fantasyTeam.colors.primary}28` : 'rgba(255,255,255,0.08)',
                      color: player.fantasyTeam ? player.fantasyTeam.colors.primary : 'white',
                    }}
                  >
                    {player.apiId ? (
                      <img
                        src={`https://fantasy.iplt20.com/classic/static-assets/build/images/players/onpitch/${player.apiId}.png`}
                        alt={player.name}
                        className="w-full h-full object-cover object-top"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      player.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                    )}
                  </div>

                  {/* Name + info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-white font-bold text-sm truncate">{player.name}</span>
                      {player.isCaptain && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 flex-shrink-0">C</span>
                      )}
                      {player.isOverseas && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 flex-shrink-0">OVS</span>
                      )}
                    </div>

                    {/* Auction team — prominent */}
                    {player.fantasyTeam && (
                      <div className="flex items-center gap-1.5">
                        <img src={player.fantasyTeam.logoUrl} alt="" className="w-4 h-4 object-contain flex-shrink-0" />
                        <span
                          className="text-label font-black truncate"
                          style={{ color: player.fantasyTeam.colors.primary }}
                        >
                          {player.fantasyTeam.name}
                        </span>
                      </div>
                    )}

                    {/* IPL team + role — secondary */}
                    {(player.iplTeam || player.role) && (
                      <div className="text-white/30 text-micro mt-0.5 truncate">
                        {[player.iplTeam, player.role].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </div>

                  {player.apiId && (
                    <svg className="w-4 h-4 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

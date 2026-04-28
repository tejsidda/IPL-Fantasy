import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchTeams } from '../services/api';
import { Team } from '../types';

function ordinal(n: number): string {
  if (!n) return '';
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchTeams().then(setTeams).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-bg-deep relative overflow-hidden">
      <div className="absolute left-[-150px] top-[-50px] md:left-[-50px] pointer-events-none z-0">
        <img src="https://www.iplt20.com/assets/images/rounded_spiral_mobile.png" alt=""
          className="w-[300px] md:w-[450px] object-contain opacity-10 mix-blend-screen" />
      </div>
      <div className="absolute right-[-150px] top-[40%] md:right-[-50px] pointer-events-none z-0">
        <img src="https://www.iplt20.com/assets/images/footer-right-img.png" alt=""
          className="w-[300px] md:w-[450px] object-contain opacity-10 mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-5 sm:py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-10 sm:mb-16 pt-2 sm:pt-4">
          <img
            src="https://www.iplt20.com/assets/images/IPL_LOGO_CORPORATE_2024.png"
            alt="TATA IPL"
            className="h-16 sm:h-24 md:h-32 object-contain drop-shadow-xl"
          />
          <p className="text-white/40 text-micro sm:text-xs font-bold tracking-widest uppercase mt-2 sm:mt-3">
            Fantasy League · 2026
          </p>
        </div>

        {teams.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <div className="text-white/40 text-sm tracking-widest uppercase">Loading teams…</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-y-16 md:grid-cols-3 lg:grid-cols-4">
            {teams.map(team => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamCard({ team }: { team: Team }) {
  return (
    <Link to={`/team/${team.id}`} className="block group select-none">
      <div className="flex flex-col items-center text-center">

        {/* Logo + ordinal watermark — fixed height, clipped */}
        <div className="relative w-full h-32 sm:h-36 overflow-hidden flex items-center justify-center">
          {/* Ordinal watermark behind logo */}
          {(team.rank ?? 0) > 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 0 }}
            >
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '160px',
                  color: 'white',
                  opacity: 0.10,
                  lineHeight: 1,
                  userSelect: 'none',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                }}
              >
                {ordinal(team.rank ?? 0)}
              </span>
            </div>
          )}

          {/* Logo — sits above watermark, scales on hover */}
          <div
            className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.08]"
            style={{ zIndex: 1 }}
          >
            <img
              src={`/logos/${team.id}.png`}
              alt={team.name}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-xl"
            />
          </div>
        </div>

        {/* Team name */}
        <h3 className="text-white font-display font-bold text-[13px] sm:text-[15px] leading-snug mt-3 px-1">
          {team.name}
        </h3>

        {/* Total points */}
        {(team.points ?? 0) > 0 && (
          <p className="text-white/35 text-micro num mt-1.5">
            {(team.points ?? 0).toLocaleString()} pts
          </p>
        )}

        {/* Today's delta */}
        {(team.pointsChange ?? 0) > 0 && (
          <span
            className="mt-1.5 inline-flex items-center text-[9px] sm:text-micro font-bold rounded-full px-2 py-0.5"
            style={{ color: 'var(--color-pos)', background: 'var(--color-pos-bg)', border: '1px solid rgba(52,211,153,0.18)' }}
          >
            <span className="num">+{team.pointsChange}</span>&nbsp;today
          </span>
        )}
      </div>
    </Link>
  );
}

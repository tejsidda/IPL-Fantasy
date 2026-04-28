import { useState } from 'react';
import { Link, useLocation, matchPath } from 'react-router-dom';
import { Search } from 'lucide-react';
import { SearchModal } from './SearchModal';

const TEAM_NAMES: Record<string, string> = {
  hari:  'Hari',
  pa:    'Paul x Ashmitha',
  kp:    'Kushal x Parthiv',
  apr:   'Aiyappan x Reshma',
  tr:    'Tej x Rixith',
  ab:    'Anjith x Basil',
  ds:    'Deepthi x Sanjana',
  ar2:   'Ani x Rakshith',
};

const NAV_LINKS = [
  { label: 'Points Table', to: '/points-table' },
  { label: 'Teams',        to: '/' },
  { label: 'Admin',        to: '/admin' },
];

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const match = matchPath({ path: '/team/:id' }, location.pathname);
  const teamId = match?.params?.id;
  const isTeamPage = !!teamId;
  const navBg = '#0B1530';

  return (
    <>
      <header className="w-full font-sans relative z-50">
        {/* Main bar */}
        <div
          className="border-b border-white/10 py-3 px-4 md:px-8 flex items-center gap-4 relative transition-colors duration-500"
          style={{ backgroundColor: navBg }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />

          <Link to="/" className="relative z-10 shrink-0">
            <img src="https://documents.iplt20.com//ipl/assets/images/ipl-logo-new-old.png" alt="IPL" className="w-14 object-contain" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex flex-1 justify-center items-center gap-8 text-xs font-bold text-white tracking-widest uppercase relative z-10">
            {NAV_LINKS.map(({ label, to }) => {
              const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={active ? 'opacity-100 border-b-2 border-white pb-[1px]' : 'opacity-60 hover:opacity-100 transition-opacity'}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile nav — two direct buttons */}
          <div className="flex lg:hidden flex-1 justify-center items-center gap-2 relative z-10">
            {[{ label: 'Teams', to: '/' }, { label: 'Points Table', to: '/points-table' }].map(({ label, to }) => {
              const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={[
                    'text-label font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors',
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-white/55 hover:text-white hover:bg-white/10',
                  ].join(' ')}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-white relative z-10 ml-auto">
            <button
              onClick={() => setSearchOpen(true)}
              className="opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="bg-[#050D1F] py-2 px-4 md:px-8 text-xs font-medium text-gray-400 flex gap-2 overflow-x-auto no-scrollbar">
          <Link to="/" className="hover:text-white transition-colors whitespace-nowrap">Home</Link>
          <span>/</span>
          <Link to="/" className="hover:text-white transition-colors whitespace-nowrap">Teams</Link>
          {isTeamPage && teamId && TEAM_NAMES[teamId] && (
            <>
              <span>/</span>
              <span className="text-white whitespace-nowrap">{TEAM_NAMES[teamId]}</span>
            </>
          )}
        </div>
      </header>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </>
  );
}

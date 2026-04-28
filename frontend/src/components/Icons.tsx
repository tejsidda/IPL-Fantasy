export function TrophyIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 4h12v3a6 6 0 11-12 0V4z" fill="url(#tg)" />
      <path d="M9 14h6v3H9z" fill="url(#tg)" />
      <path d="M8 17h8v2H8z" fill="url(#tg)" />
      <path d="M3 5h3v2a3 3 0 003 3v1a4 4 0 01-4-4V5zM18 5h3v2a4 4 0 01-4 4v-1a3 3 0 003-3V5z" fill="url(#tg)" />
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E5C07A" />
          <stop offset="1" stopColor="#8C7440" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MedalIcon({ className = "", tone = "silver" }: { className?: string; tone?: "silver" | "bronze" }) {
  const colors = tone === "silver"
    ? { from: "#D8DDE6", to: "#7A8190" }
    : { from: "#D9A877", to: "#7B4A26" };
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="14" r="6" fill={`url(#m-${tone})`} />
      <path d="M9 3l3 8 3-8h-2l-1 3-1-3H9z" fill={`url(#m-${tone})`} />
      <defs>
        <linearGradient id={`m-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colors.from} />
          <stop offset="1" stopColor={colors.to} />
        </linearGradient>
      </defs>
    </svg>
  );
}

import { cn } from '../lib/utils';

interface TeamLogoLike {
  id: string;
  shortName: string;
  logoUrl: string;
}

interface TeamLogoProps {
  team: TeamLogoLike;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<NonNullable<TeamLogoProps['size']>, string> = {
  xs:  'w-7 h-7',
  sm:  'w-9 h-9',
  md:  'w-10 h-10',
  lg:  'w-12 h-12',
  xl:  'w-16 h-16',
  '2xl': 'w-20 h-20',
};

/**
 * Renders a team's PNG logo from /public/logos/{id}.png, with the server's
 * `logoUrl` as fallback (handles transparent-PNG and remote URL fallback in one
 * place — replaces the 15+ duplicated `<img onError>` snippets across pages).
 *
 * Override sizing entirely via `className` if a responsive size is needed.
 */
export function TeamLogo({ team, size = 'md', className, style }: TeamLogoProps) {
  return (
    <img
      src={`/logos/${team.id}.png`}
      alt={team.shortName}
      className={cn(SIZE_MAP[size], 'object-contain flex-shrink-0', className)}
      style={style}
      onError={e => { (e.target as HTMLImageElement).src = team.logoUrl; }}
    />
  );
}

import { useState } from 'react';
import { cn } from '../lib/utils';

interface PlayerPhotoProps {
  apiId?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  className?: string;
}

const SIZE_MAP: Record<NonNullable<PlayerPhotoProps['size']>, string> = {
  xs: 'w-6 h-6 text-[8px]',
  sm: 'w-7 h-7 text-[9px]',
  md: 'w-9 h-9 text-[10px]',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
};

/**
 * Renders a player's IPL Fantasy headshot from the official CDN with an
 * initials fallback if no apiId or the image errors. Single shared component
 * to replace the three near-identical implementations across pages.
 */
export function PlayerPhoto({
  apiId,
  name,
  size = 'md',
  shape = 'circle',
  className,
}: PlayerPhotoProps) {
  const [err, setErr] = useState(false);
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const shapeCls = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

  return (
    <div
      className={cn(
        'bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center font-black text-gray-400',
        shapeCls,
        SIZE_MAP[size],
        className,
      )}
    >
      {apiId && !err ? (
        <img
          src={`https://fantasy.iplt20.com/classic/static-assets/build/images/players/onpitch/${apiId}.png`}
          alt={name}
          className="w-full h-full object-cover object-top"
          onError={() => setErr(true)}
        />
      ) : initials}
    </div>
  );
}

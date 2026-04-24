import { cn } from '@/lib/utils/cn';

export interface HeraldicCartoucheProps {
  value: number;
  size: 'sm' | 'md' | 'lg';
  className?: string;
}

const CARTOUCHE_SIZES = {
  sm: { wrapper: 18, inner: 14, font: 11 },
  md: { wrapper: 32, inner: 26, font: 20 },
  lg: { wrapper: 48, inner: 40, font: 32 },
} as const;

/**
 * Cartouche héraldique en forme de bouclier avec fleur-de-lys au sommet et la valeur au centre.
 */
export function HeraldicCartouche({ value, size, className }: HeraldicCartoucheProps) {
  const s = CARTOUCHE_SIZES[size];
  const showFleur = size !== 'sm';
  return (
    <div
      className={cn('relative flex flex-col items-center', className)}
      style={{ width: s.wrapper }}
    >
      {showFleur && (
        <div
          className="absolute -top-1 text-center leading-none pointer-events-none"
          style={{
            color: 'var(--color-gold-bright)',
            fontSize: size === 'md' ? 9 : 14,
            textShadow: '0 1px 1px rgba(0,0,0,0.5)',
          }}
          aria-hidden
        >
          ⚜
        </div>
      )}
      <svg
        width={s.wrapper}
        height={s.wrapper * 1.15}
        viewBox="0 0 40 46"
        aria-hidden
        className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
      >
        {/* Bouclier externe doré */}
        <path
          d="M 2,4 L 38,4 L 38,28 Q 38,42 20,44 Q 2,42 2,28 Z"
          fill="url(#cartoucheGold)"
          stroke="#5c1010"
          strokeWidth="0.8"
        />
        {/* Bouclier interne bordeaux */}
        <path
          d="M 5,6 L 35,6 L 35,27 Q 35,39 20,41 Q 5,39 5,27 Z"
          fill="url(#cartoucheRed)"
        />
        <defs>
          <linearGradient id="cartoucheGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e6c88a" />
            <stop offset="100%" stopColor="#9c7d48" />
          </linearGradient>
          <linearGradient id="cartoucheRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a62424" />
            <stop offset="100%" stopColor="#5c1010" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-display font-bold pointer-events-none"
        style={{
          color: 'var(--color-gold-bright)',
          fontSize: s.font,
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          transform: showFleur ? 'translateY(8%)' : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}

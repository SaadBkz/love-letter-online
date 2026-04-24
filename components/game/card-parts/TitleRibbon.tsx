import { cn } from '@/lib/utils/cn';

export interface TitleRibbonProps {
  name: string;
  size: 'sm' | 'md' | 'lg';
  className?: string;
}

const RIBBON_SIZES = {
  sm: { h: 10, fs: 6, px: 4 },
  md: { h: 18, fs: 10, px: 7 },
  lg: { h: 26, fs: 15, px: 10 },
} as const;

/**
 * Bandeau décoratif en ruban pour le nom de la carte.
 * Forme de scroll via clip-path.
 */
export function TitleRibbon({ name, size, className }: TitleRibbonProps) {
  const s = RIBBON_SIZES[size];
  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{
        height: s.h,
        paddingLeft: s.px,
        paddingRight: s.px,
        background:
          'linear-gradient(180deg, var(--color-gold-bright) 0%, var(--color-gold) 55%, var(--color-gold-deep) 100%)',
        color: 'var(--color-ink)',
        clipPath:
          'polygon(0% 40%, 8% 0%, 92% 0%, 100% 40%, 96% 100%, 85% 85%, 15% 85%, 4% 100%)',
        border: 'none',
        boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
    >
      <span
        className="font-display font-semibold whitespace-nowrap"
        style={{
          fontSize: s.fs,
          letterSpacing: size === 'sm' ? '0.02em' : '0.06em',
          textShadow: '0 1px 0 rgba(255,240,200,0.4)',
        }}
      >
        {name}
      </span>
    </div>
  );
}

'use client';

import { CARD_NAME_FR, CARD_VALUE, type CardKind } from '@/lib/game';
import { CARD_VISUALS } from '@/lib/utils/card-visuals';
import { cn } from '@/lib/utils/cn';

export interface CardProps {
  kind: CardKind;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  /** Met en avant la carte (ex : Comtesse forcée) */
  highlight?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<CardProps['size']>, string> = {
  sm: 'w-[56px] h-[78px] text-[9px]',
  md: 'w-[96px] h-[134px] text-[11px]',
  lg: 'w-[160px] h-[224px] text-[13px]',
};

export function Card({
  kind,
  size = 'md',
  selected,
  disabled,
  onClick,
  className,
  highlight,
}: CardProps) {
  const visual = CARD_VISUALS[kind];
  const Icon = visual.icon;
  const value = CARD_VALUE[kind];
  const name = CARD_NAME_FR[kind];

  const isInteractive = !!onClick && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${value} — ${name}. ${visual.effect}`}
      className={cn(
        'relative rounded-[10%/7%] overflow-hidden transition-transform duration-150 select-none',
        'border border-[color:var(--color-ink)]/70 shadow-[0_2px_8px_rgba(0,0,0,0.5)]',
        isInteractive && 'cursor-pointer hover:-translate-y-1 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-gold)]',
        selected && 'ring-2 ring-[color:var(--color-gold)] -translate-y-2',
        highlight && 'ring-2 ring-[color:var(--color-danger)] animate-pulse',
        disabled && 'opacity-50 grayscale',
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        background:
          'linear-gradient(180deg, var(--color-parchment) 0%, var(--color-parchment-dark) 100%)',
      }}
    >
      {/* Bordure intérieure décorative */}
      <div
        className="absolute inset-[4px] rounded-[inherit] pointer-events-none"
        style={{ border: '1px solid var(--color-gold-deep)' }}
      />

      {/* Cartouche valeur (haut gauche) */}
      <div
        className={cn(
          'absolute top-[6%] left-[6%] rounded-full flex items-center justify-center font-display font-bold',
          'shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]',
        )}
        style={{
          background: 'var(--color-cartouche)',
          color: 'var(--color-gold-bright)',
          width: '28%',
          aspectRatio: '1',
          fontSize: size === 'sm' ? '14px' : size === 'md' ? '22px' : '34px',
          border: '1.5px solid var(--color-gold-deep)',
        }}
      >
        {value}
      </div>

      {/* Bandeau nom (haut droit) */}
      <div
        className={cn(
          'absolute top-[7%] right-[6%] px-[6%] py-[2%] rounded-sm font-display font-semibold',
          'whitespace-nowrap',
        )}
        style={{
          color: 'var(--color-ink)',
          fontSize: size === 'sm' ? '7px' : size === 'md' ? '10px' : '14px',
          letterSpacing: '0.04em',
        }}
      >
        {name}
      </div>

      {/* Illustration (centre) */}
      <div className="absolute inset-x-[10%] top-[32%] bottom-[34%] flex items-center justify-center">
        <Icon
          className="w-full h-full"
          style={{ color: visual.hue, opacity: 0.85 }}
          strokeWidth={1.2}
        />
      </div>

      {/* Effet (bas) */}
      <div
        className="absolute inset-x-[6%] bottom-[5%] text-center leading-tight italic"
        style={{
          color: 'var(--color-ink-soft)',
          fontSize: size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px',
        }}
      >
        {size === 'sm' ? null : truncate(visual.effect, size === 'md' ? 80 : 160)}
      </div>
    </button>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + '…';
}

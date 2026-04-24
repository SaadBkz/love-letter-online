'use client';

import { useEffect, useState } from 'react';
import { CARD_NAME_FR, CARD_VALUE, type CardKind } from '@/lib/game';
import { CARD_VISUALS } from '@/lib/utils/card-visuals';
import { cn } from '@/lib/utils/cn';
import { CornerOrnaments, ParchmentTexture } from './card-parts/CornerOrnaments';
import { HeraldicCartouche } from './card-parts/HeraldicCartouche';
import { TitleRibbon } from './card-parts/TitleRibbon';

export interface CardProps {
  kind: CardKind;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  highlight?: boolean;
  responsive?: boolean;
}

const SIZE_CLASSES: Record<NonNullable<CardProps['size']>, { w: number; h: number }> = {
  sm: { w: 60, h: 84 },
  md: { w: 104, h: 146 },
  lg: { w: 184, h: 258 },
};

const IMAGE_PATHS: Record<CardKind, string> = {
  Spy: '/cards/spy.png',
  Guard: '/cards/guard.png',
  Priest: '/cards/priest.png',
  Baron: '/cards/baron.png',
  Handmaid: '/cards/handmaid.png',
  Prince: '/cards/prince.png',
  Chancellor: '/cards/chancellor.png',
  King: '/cards/king.png',
  Countess: '/cards/countess.png',
  Princess: '/cards/princess.png',
};

// Cache module-level pour éviter de re-probe chaque montage
const imageStatusCache = new Map<CardKind, 'pending' | 'loaded' | 'missing'>();

function useCardImage(kind: CardKind) {
  const [status, setStatus] = useState<'pending' | 'loaded' | 'missing'>(
    () => imageStatusCache.get(kind) ?? 'pending',
  );
  useEffect(() => {
    if (status !== 'pending') return;
    const img = new Image();
    let alive = true;
    img.onload = () => {
      if (!alive) return;
      imageStatusCache.set(kind, 'loaded');
      setStatus('loaded');
    };
    img.onerror = () => {
      if (!alive) return;
      imageStatusCache.set(kind, 'missing');
      setStatus('missing');
    };
    img.src = IMAGE_PATHS[kind];
    return () => {
      alive = false;
    };
  }, [kind, status]);
  return status;
}

export function Card({
  kind,
  size = 'md',
  selected,
  disabled,
  onClick,
  className,
  highlight,
  responsive,
}: CardProps) {
  const visual = CARD_VISUALS[kind];
  const value = CARD_VALUE[kind];
  const name = CARD_NAME_FR[kind];
  const { w, h } = SIZE_CLASSES[size];
  const Icon = visual.icon;
  const imageStatus = useCardImage(kind);

  const isInteractive = !!onClick && !disabled;
  const isMd = size === 'md';

  const dimStyle = responsive
    ? {
        width: 'clamp(150px, calc((100vw - 60px) / 2), 220px)',
        aspectRatio: '0.714',
        height: 'auto' as const,
      }
    : { width: w, height: h };

  const baseButtonClasses = cn(
    'relative overflow-hidden transition-all duration-200 select-none shrink-0',
    'rounded-[8px] border shadow-[0_3px_10px_rgba(0,0,0,0.55)]',
    isInteractive &&
      'cursor-pointer hover:-translate-y-1.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-gold)]',
    selected && 'ring-2 ring-[color:var(--color-gold-bright)] -translate-y-2.5',
    highlight && 'ring-2 ring-[color:var(--color-danger)] animate-pulse',
    disabled && 'opacity-60 grayscale',
    className,
  );

  // Mode "full image" : l'image contient déjà tout (cadre, cartouche, banner, texte effet).
  if (imageStatus === 'loaded') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={`${value} — ${name}. ${visual.effect}`}
        className={baseButtonClasses}
        style={{
          ...dimStyle,
          borderColor: 'rgba(60,30,15,0.7)',
          background: 'var(--color-parchment-dark)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGE_PATHS[kind]}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </button>
    );
  }

  // Mode fallback : cadre SVG + silhouette lucide
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${value} — ${name}. ${visual.effect}`}
      className={baseButtonClasses}
      style={{
        ...dimStyle,
        borderColor: 'rgba(60,30,15,0.7)',
        background: 'linear-gradient(165deg, #faf0dd 0%, #f5e6c8 45%, #e8d4a8 100%)',
      }}
    >
      <CornerOrnaments />
      <div
        className="absolute pointer-events-none rounded-[4px]"
        style={{
          inset: size === 'sm' ? 3 : size === 'md' ? 5 : 7,
          border: '1px solid var(--color-gold-deep)',
          boxShadow: 'inset 0 0 0 1px rgba(230,200,138,0.4)',
        }}
      />
      <ParchmentTexture />

      <div
        className="absolute left-0 right-0 flex items-start justify-between"
        style={{
          top: size === 'sm' ? 4 : size === 'md' ? 6 : 9,
          paddingLeft: size === 'sm' ? 4 : size === 'md' ? 7 : 10,
          paddingRight: size === 'sm' ? 4 : size === 'md' ? 7 : 10,
        }}
      >
        <HeraldicCartouche value={value} size={size} />
        {size !== 'sm' && (
          <div className="flex-1 pl-1 pt-0.5 flex justify-end">
            <TitleRibbon name={name} size={size} />
          </div>
        )}
      </div>

      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{
          top: size === 'sm' ? '38%' : '32%',
          bottom: size === 'sm' ? '18%' : isMd ? '36%' : '38%',
          paddingLeft: size === 'sm' ? 6 : size === 'md' ? 10 : 14,
          paddingRight: size === 'sm' ? 6 : size === 'md' ? 10 : 14,
        }}
      >
        <Icon
          style={{
            color: visual.hue,
            opacity: 0.85,
            width: '55%',
            height: '55%',
          }}
          strokeWidth={1.3}
        />
      </div>

      {size === 'sm' && (
        <div
          className="absolute left-0 right-0 text-center font-display font-semibold pointer-events-none"
          style={{
            bottom: 3,
            color: 'var(--color-ink)',
            fontSize: 6.5,
          }}
        >
          {name}
        </div>
      )}
      {size !== 'sm' && (
        <div
          className="absolute left-0 right-0 text-center italic pointer-events-none"
          style={{
            bottom: isMd ? 5 : 9,
            paddingLeft: isMd ? 7 : 10,
            paddingRight: isMd ? 7 : 10,
            color: 'var(--color-ink-soft)',
            fontSize: isMd ? 7.5 : 9.5,
            lineHeight: 1.25,
          }}
        >
          {truncate(visual.effect, isMd ? 90 : 200)}
        </div>
      )}
    </button>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + '…';
}

'use client';

import { useState, useEffect } from 'react';
import type { CardKind } from '@/lib/game';
import { CARD_VISUALS } from '@/lib/utils/card-visuals';
import { cn } from '@/lib/utils/cn';

export interface PortraitProps {
  kind: CardKind;
  size: 'sm' | 'md' | 'lg';
  className?: string;
}

const PORTRAIT_HEIGHTS = {
  sm: 36,
  md: 68,
  lg: 110,
} as const;

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

/**
 * Affiche l'illustration de la carte.
 * Tente de charger le PNG depuis /public/cards/. Si absent, fallback vers une silhouette
 * SVG dans un médaillon doré.
 */
export function Portrait({ kind, size, className }: PortraitProps) {
  const [hasImage, setHasImage] = useState<boolean | null>(null);
  const src = IMAGE_PATHS[kind];
  const visual = CARD_VISUALS[kind];
  const Icon = visual.icon;
  const h = PORTRAIT_HEIGHTS[size];

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => alive && setHasImage(true);
    img.onerror = () => alive && setHasImage(false);
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);

  return (
    <div
      className={cn('relative flex items-center justify-center overflow-hidden', className)}
      style={{
        height: h,
        width: '100%',
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(255,235,180,0.4), rgba(245,230,200,0.1) 70%, transparent 100%)',
      }}
    >
      {hasImage === true ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          aria-hidden
          className="w-full h-full object-cover"
          style={{
            maskImage:
              'radial-gradient(ellipse at center, black 65%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 65%, transparent 100%)',
          }}
        />
      ) : (
        <>
          {/* Médaillon doré */}
          {size !== 'sm' && (
            <div
              className="absolute rounded-full"
              style={{
                width: h * 0.85,
                height: h * 0.85,
                border: '1.5px solid var(--color-gold-deep)',
                background:
                  'radial-gradient(circle at 30% 30%, rgba(255,235,180,0.25), rgba(60,30,20,0.05))',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
              }}
            />
          )}
          <Icon
            className="relative z-10"
            style={{
              color: visual.hue,
              opacity: 0.85,
              width: h * 0.55,
              height: h * 0.55,
            }}
            strokeWidth={1.3}
          />
        </>
      )}
    </div>
  );
}

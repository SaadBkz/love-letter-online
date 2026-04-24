'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardBackProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  count?: number;
}

const SIZE_CLASSES = {
  sm: { w: 60, h: 84 },
  md: { w: 104, h: 146 },
  lg: { w: 168, h: 236 },
} as const;

const BACK_IMAGE_PATH = '/cards/back.png';
let backImageStatus: 'pending' | 'loaded' | 'missing' = 'pending';

function useBackImage() {
  const [status, setStatus] = useState(backImageStatus);
  useEffect(() => {
    if (status !== 'pending') return;
    const img = new Image();
    let alive = true;
    img.onload = () => {
      if (!alive) return;
      backImageStatus = 'loaded';
      setStatus('loaded');
    };
    img.onerror = () => {
      if (!alive) return;
      backImageStatus = 'missing';
      setStatus('missing');
    };
    img.src = BACK_IMAGE_PATH;
    return () => {
      alive = false;
    };
  }, [status]);
  return status;
}

/**
 * Dos de carte : fond bordeaux profond avec motif baroque doré symétrique
 * et sceau enveloppe au centre.
 */
export function CardBack({ size = 'md', className, count }: CardBackProps) {
  const { w, h } = SIZE_CLASSES[size];
  const imgStatus = useBackImage();

  if (imgStatus === 'loaded') {
    return (
      <div
        className={cn('relative overflow-hidden shrink-0 rounded-[8px] border', className)}
        style={{
          width: w,
          height: h,
          borderColor: 'var(--color-gold-deep)',
          boxShadow: '0 3px 10px rgba(0,0,0,0.6)',
        }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BACK_IMAGE_PATH}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
        {count !== undefined && count > 1 && (
          <div
            className="absolute bottom-1 right-1 text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--color-gold-bright)' }}
          >
            ×{count}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden shrink-0 rounded-[8px] border', className)}
      style={{
        width: w,
        height: h,
        borderColor: 'var(--color-gold-deep)',
        background:
          'radial-gradient(ellipse at center, #5a1616 0%, #3d0e13 60%, #2a080c 100%)',
        boxShadow: '0 3px 10px rgba(0,0,0,0.6), inset 0 0 8px rgba(0,0,0,0.5)',
      }}
      aria-hidden
    >
      {/* Motif en filigrane doré */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 140"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="backGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e6c88a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#9c7d48" stopOpacity="0.7" />
          </linearGradient>
          <pattern
            id="diamondPattern"
            x="0"
            y="0"
            width="10"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 5,0 L 10,6 L 5,12 L 0,6 Z"
              fill="none"
              stroke="url(#backGold)"
              strokeWidth="0.3"
              opacity="0.45"
            />
          </pattern>
        </defs>

        {/* Motif losanges en arrière-plan */}
        <rect width="100" height="140" fill="url(#diamondPattern)" />

        {/* Bordure intérieure */}
        <rect
          x="4"
          y="4"
          width="92"
          height="132"
          fill="none"
          stroke="url(#backGold)"
          strokeWidth="0.6"
          opacity="0.85"
        />
        <rect
          x="7"
          y="7"
          width="86"
          height="126"
          fill="none"
          stroke="url(#backGold)"
          strokeWidth="0.3"
          opacity="0.6"
        />

        {/* Titre "Saad Letter" en script doré au centre (miniature du vrai back design) */}
        <text
          x="50"
          y="66"
          textAnchor="middle"
          fill="url(#backGold)"
          style={{
            fontFamily: 'var(--font-script), cursive',
            fontSize: 16,
            fontStyle: 'italic',
          }}
        >
          Saad
        </text>
        <text
          x="50"
          y="82"
          textAnchor="middle"
          fill="url(#backGold)"
          style={{
            fontFamily: 'var(--font-script), cursive',
            fontSize: 14,
            fontStyle: 'italic',
          }}
        >
          Letter
        </text>

        {/* Fleur-de-lys aux 4 coins */}
        {[
          [14, 14],
          [86, 14],
          [14, 126],
          [86, 126],
        ].map(([x, y], i) => (
          <text
            key={i}
            x={x}
            y={y}
            fontSize="7"
            textAnchor="middle"
            fill="url(#backGold)"
            opacity="0.8"
          >
            ⚜
          </text>
        ))}
      </svg>

      {count !== undefined && count > 1 && (
        <div
          className="absolute bottom-1 right-1 text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(0,0,0,0.7)',
            color: 'var(--color-gold-bright)',
          }}
        >
          ×{count}
        </div>
      )}
    </div>
  );
}

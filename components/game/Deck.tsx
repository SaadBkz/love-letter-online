'use client';

import { CardBack } from './CardBack';

export interface DeckProps {
  remaining: number;
}

export function Deck({ remaining }: DeckProps) {
  return (
    <div className="relative flex flex-col items-center gap-1">
      <div className="relative">
        {/* Effet 3D : 3 cartes empilées décalées */}
        {remaining > 0 && (
          <>
            <CardBack size="md" className="absolute -top-1 -left-1 opacity-60" />
            <CardBack size="md" className="absolute -top-0.5 -left-0.5 opacity-80" />
            <CardBack size="md" className="relative" />
          </>
        )}
        {remaining === 0 && (
          <div
            className="w-[96px] h-[134px] rounded-[10%/7%] flex items-center justify-center text-center text-[10px] italic opacity-50"
            style={{
              border: '1px dashed var(--color-gold-deep)',
              color: 'var(--color-parchment)',
            }}
          >
            pioche vide
          </div>
        )}
      </div>
      <div
        className="font-mono text-[11px] px-2 py-0.5 rounded"
        style={{
          background: 'rgba(0,0,0,0.5)',
          color: 'var(--color-gold-bright)',
        }}
      >
        {remaining} {remaining <= 1 ? 'carte' : 'cartes'}
      </div>
    </div>
  );
}

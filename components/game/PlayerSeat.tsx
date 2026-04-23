'use client';

import { Heart } from 'lucide-react';
import type { CardKind, Player } from '@/lib/game';
import { CardBack } from './CardBack';
import { Card } from './Card';
import { cn } from '@/lib/utils/cn';

export interface PlayerSeatProps {
  player: Player;
  /** Le joueur local (affichage privilégié) */
  isSelf?: boolean;
  /** Si c'est le joueur courant du tour */
  isCurrent?: boolean;
  /** Couleur identitaire */
  accent?: string;
  /** Orientation du seat (pour les latéraux en paysage) */
  orientation?: 'top' | 'left' | 'right' | 'bottom';
  className?: string;
}

export function PlayerSeat({
  player,
  isSelf,
  isCurrent,
  accent = 'var(--color-gold)',
  orientation = 'top',
  className,
}: PlayerSeatProps) {
  return (
    <div
      className={cn(
        'flex gap-2 items-center p-2 rounded-lg transition-all duration-300',
        orientation === 'left' && 'flex-col',
        orientation === 'right' && 'flex-col-reverse',
        isCurrent && 'ring-2 ring-offset-2 ring-offset-[color:var(--color-table)]',
        player.isEliminated && 'opacity-40 grayscale',
        className,
      )}
      style={{
        background: 'rgba(0,0,0,0.25)',
        borderLeft: `3px solid ${accent}`,
        ...(isCurrent ? { boxShadow: `0 0 16px ${accent}aa` } : {}),
      }}
    >
      {/* Avatar + nom + jetons */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0"
          style={{
            background: accent,
            color: 'var(--color-ink)',
            border: '1px solid var(--color-gold-deep)',
          }}
        >
          {player.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex flex-col min-w-0">
          <div
            className="font-display text-sm leading-tight truncate max-w-[100px]"
            style={{ color: 'var(--color-parchment)' }}
          >
            {player.name}
            {isSelf ? <span className="opacity-60 text-[10px] ml-1">(toi)</span> : null}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: player.tokens }).map((_, i) => (
              <Heart
                key={i}
                className="w-3 h-3 fill-[color:var(--color-danger)] stroke-[color:var(--color-cartouche-deep)]"
              />
            ))}
            <span className="text-[10px] font-mono opacity-70">({player.tokens})</span>
          </div>
        </div>
      </div>

      {/* Main (dos pour adversaires, face pour soi) */}
      <div className="flex gap-1">
        {isSelf
          ? player.hand.map((c, i) => <Card key={`${c}-${i}`} kind={c} size="sm" />)
          : player.hand.map((_, i) => <CardBack key={i} size="sm" />)}
        {player.isEliminated && (
          <span
            className="text-[10px] font-display uppercase tracking-wider pl-2 self-center"
            style={{ color: 'var(--color-danger)' }}
          >
            éliminé·e
          </span>
        )}
        {player.isProtected && (
          <span
            className="text-[10px] font-display uppercase tracking-wider pl-2 self-center"
            style={{ color: 'var(--color-gold-bright)' }}
          >
            protégé·e
          </span>
        )}
      </div>

      {/* Défausse */}
      {player.discard.length > 0 && (
        <DiscardPile cards={player.discard} />
      )}
    </div>
  );
}

function DiscardPile({ cards }: { cards: CardKind[] }) {
  return (
    <div className="flex gap-[2px] flex-wrap max-w-[160px]">
      {cards.map((c, i) => (
        <Card key={`${c}-${i}`} kind={c} size="sm" className="opacity-90" />
      ))}
    </div>
  );
}

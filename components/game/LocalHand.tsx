'use client';

import type { CardKind } from '@/lib/game';
import { Card } from './Card';
import { cn } from '@/lib/utils/cn';

export interface LocalHandProps {
  hand: CardKind[];
  /** Cartes jouables (ne sont pas disabled) */
  playable?: CardKind[];
  onSelect?: (card: CardKind, index: number) => void;
  /** Valeur sélectionnée (pour mise en évidence) */
  selectedIndex?: number | null;
  /** Indiquer visuellement la contrainte Comtesse */
  forcedCard?: CardKind | null;
  /** Main en lecture seule (pas mon tour) */
  readOnly?: boolean;
}

export function LocalHand({
  hand,
  playable,
  onSelect,
  selectedIndex,
  forcedCard,
  readOnly,
}: LocalHandProps) {
  return (
    <div className={cn('flex items-end gap-3 justify-center pb-2')}>
      {hand.map((c, i) => {
        const isPlayable = !readOnly && (playable ? playable.includes(c) : true);
        const isForced = forcedCard === c;
        return (
          <Card
            key={`${c}-${i}`}
            kind={c}
            size="lg"
            onClick={isPlayable && onSelect ? () => onSelect(c, i) : undefined}
            disabled={!isPlayable && !readOnly}
            selected={selectedIndex === i}
            highlight={isForced}
          />
        );
      })}
      {hand.length === 0 && (
        <div className="text-xs italic opacity-60 py-8">Aucune carte en main.</div>
      )}
    </div>
  );
}

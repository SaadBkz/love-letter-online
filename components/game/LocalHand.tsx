'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { CardKind } from '@/lib/game';
import { Card } from './Card';
import { cn } from '@/lib/utils/cn';

export interface LocalHandProps {
  hand: CardKind[];
  /** Nombre de cartes visibles (peut masquer la 2e en attendant la pioche manuelle) */
  visibleCount?: number;
  playable?: CardKind[];
  onSelect?: (card: CardKind, index: number) => void;
  selectedIndex?: number | null;
  forcedCard?: CardKind | null;
  readOnly?: boolean;
}

export function LocalHand({
  hand,
  visibleCount,
  playable,
  onSelect,
  selectedIndex,
  forcedCard,
  readOnly,
}: LocalHandProps) {
  const shown = visibleCount !== undefined ? hand.slice(0, visibleCount) : hand;

  return (
    <div className={cn('flex items-end gap-3 justify-center pb-2 min-h-[260px]')}>
      <AnimatePresence>
        {shown.map((c, i) => {
          const isPlayable = !readOnly && (playable ? playable.includes(c) : true);
          const isForced = forcedCard === c;
          return (
            <motion.div
              key={`${c}-${i}`}
              initial={{ y: 40, opacity: 0, rotateY: 180 }}
              animate={{ y: 0, opacity: 1, rotateY: 0 }}
              exit={{
                y: -80,
                opacity: 0,
                scale: 0.6,
                rotate: isPlayable ? 15 : 0,
                transition: { duration: 0.35 },
              }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Card
                kind={c}
                size="lg"
                responsive
                onClick={isPlayable && onSelect ? () => onSelect(c, i) : undefined}
                disabled={!isPlayable && !readOnly}
                selected={selectedIndex === i}
                highlight={isForced}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      {shown.length === 0 && (
        <div className="text-xs italic opacity-60 py-8">Aucune carte en main.</div>
      )}
    </div>
  );
}

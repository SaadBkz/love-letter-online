'use client';

import { motion } from 'motion/react';
import { CardBack } from './CardBack';
import { Card } from './Card';

export interface DeckProps {
  remaining: number;
  tappable?: boolean;
  revealingCard?: import('@/lib/game').CardKind | null;
  onTap?: () => void;
}

export function Deck({ remaining, tappable, revealingCard, onTap }: DeckProps) {
  return (
    <div className="relative flex flex-col items-center gap-1">
      <motion.button
        type="button"
        onClick={tappable ? onTap : undefined}
        disabled={!tappable}
        className="relative disabled:cursor-default"
        animate={
          tappable
            ? {
                scale: [1, 1.04, 1],
                filter: [
                  'drop-shadow(0 0 0px rgba(230,200,138,0))',
                  'drop-shadow(0 0 8px rgba(230,200,138,0.65))',
                  'drop-shadow(0 0 0px rgba(230,200,138,0))',
                ],
              }
            : {}
        }
        transition={
          tappable
            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
        aria-label={tappable ? 'Piocher une carte' : `Pioche (${remaining} cartes)`}
      >
        {remaining > 0 ? (
          <>
            <CardBack size="sm" className="absolute -top-1 -left-1 opacity-55" />
            <CardBack size="sm" className="absolute -top-0.5 -left-0.5 opacity-80" />
            <CardBack size="sm" className="relative" />
          </>
        ) : (
          <div
            className="w-[60px] h-[84px] rounded-[8px] flex items-center justify-center text-center text-[9px] italic opacity-50"
            style={{
              border: '1px dashed var(--color-gold-deep)',
              color: 'var(--color-parchment)',
            }}
          >
            vide
          </div>
        )}

        {/* Carte piochée qui se retourne (flip 3D) */}
        {revealingCard && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ perspective: 800 }}
          >
            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Card kind={revealingCard} size="sm" />
            </motion.div>
          </motion.div>
        )}
      </motion.button>

      <div
        className="font-mono text-[10px] px-1.5 py-0 rounded"
        style={{
          background: 'rgba(0,0,0,0.55)',
          color: 'var(--color-gold-bright)',
          border: '1px solid var(--color-gold-deep)',
        }}
      >
        {remaining}
      </div>

      {tappable && (
        <motion.div
          className="text-[9px] font-display uppercase tracking-widest"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ color: 'var(--color-gold-bright)' }}
        >
          Piocher
        </motion.div>
      )}
    </div>
  );
}

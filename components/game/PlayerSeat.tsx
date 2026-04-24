'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { CardKind, Player } from '@/lib/game';
import { CARD_NAME_FR, CARD_VALUE } from '@/lib/game';
import { HandmaidShield } from './HandmaidShield';
import { WaxSealToken } from './WaxSealToken';
import { cn } from '@/lib/utils/cn';

export interface PlayerSeatProps {
  player: Player;
  isCurrent?: boolean;
  accent?: string;
  className?: string;
  /** Jetons gagnés tout récemment (anim pop) */
  recentlyWon?: boolean;
}

export function PlayerSeat({
  player,
  isCurrent,
  accent = 'var(--color-gold)',
  className,
  recentlyWon,
}: PlayerSeatProps) {
  return (
    <motion.div
      className={cn(
        'relative flex gap-1.5 items-center px-1.5 py-1 rounded-md transition-colors',
        player.isEliminated && 'grayscale',
        className,
      )}
      animate={{
        opacity: player.isEliminated ? 0.45 : 1,
        x: player.isEliminated ? [0, -6, 6, -3, 3, 0] : 0,
      }}
      transition={{ duration: player.isEliminated ? 0.5 : 0.2 }}
      style={{
        background: 'rgba(0,0,0,0.25)',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      {/* Glow actif */}
      {isCurrent && !player.isEliminated && (
        <motion.div
          className="absolute -inset-0.5 rounded-md pointer-events-none"
          animate={{
            boxShadow: [
              `0 0 10px 0px ${accent}aa`,
              `0 0 18px 3px ${accent}cc`,
              `0 0 10px 0px ${accent}aa`,
            ],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Handmaid shield */}
      {player.isProtected && !player.isEliminated && <HandmaidShield />}

      {/* Avatar + nom + jetons — compact */}
      <div className="flex items-center gap-1.5 min-w-0 z-10 shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-xs shrink-0"
          style={{
            background: accent,
            color: 'var(--color-ink)',
            border: '1px solid var(--color-gold-deep)',
          }}
        >
          {player.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex flex-col min-w-0 leading-tight">
          <div
            className="font-display text-[12px] truncate max-w-[80px]"
            style={{ color: 'var(--color-parchment)' }}
          >
            {player.name}
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: player.tokens }).map((_, i) => (
              <WaxSealToken
                key={i}
                size="xs"
                pop={recentlyWon && i === player.tokens - 1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main (dos) */}
      <div className="flex gap-0.5 z-10 shrink-0">
        <AnimatePresence>
          {player.hand.map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <MiniCardBack />
            </motion.div>
          ))}
        </AnimatePresence>
        {player.isEliminated && (
          <span
            className="text-[9px] font-display uppercase tracking-wider pl-1 self-center"
            style={{ color: 'var(--color-danger)' }}
          >
            ✕
          </span>
        )}
      </div>

      {/* Défausse — occupe le reste avec overflow scroll horizontal */}
      {player.discard.length > 0 && (
        <div className="flex-1 min-w-0 overflow-x-auto z-10">
          <DiscardFan cards={player.discard} />
        </div>
      )}
    </motion.div>
  );
}

function MiniCardBack() {
  // Version ultra-compacte du dos pour les seats adversaires
  return (
    <div
      className="w-[30px] h-[42px] rounded-sm border"
      style={{
        borderColor: 'var(--color-gold-deep)',
        background:
          'radial-gradient(ellipse at center, #5a1616 0%, #3d0e13 60%, #2a080c 100%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.6)',
      }}
      aria-hidden
    />
  );
}

function DiscardFan({ cards }: { cards: CardKind[] }) {
  return (
    <div className="flex gap-[2px]">
      <AnimatePresence>
        {cards.map((c, i) => (
          <motion.div
            key={`${c}-${i}`}
            initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            title={CARD_NAME_FR[c]}
          >
            <MiniDiscardCard kind={c} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function MiniDiscardCard({ kind }: { kind: CardKind }) {
  return (
    <div
      className="w-[22px] h-[30px] rounded-sm flex items-center justify-center font-display font-bold shrink-0"
      style={{
        background:
          'linear-gradient(180deg, var(--color-parchment) 0%, var(--color-parchment-dark) 100%)',
        color: 'var(--color-ink)',
        border: '1px solid var(--color-gold-deep)',
      }}
      aria-label={CARD_NAME_FR[kind]}
      title={CARD_NAME_FR[kind]}
    >
      <span style={{ fontSize: 11, lineHeight: 1 }}>{CARD_VALUE[kind]}</span>
    </div>
  );
}

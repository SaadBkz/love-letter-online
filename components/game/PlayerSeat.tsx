'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { CardKind, Player } from '@/lib/game';
import { CARD_NAME_FR, CARD_VALUE } from '@/lib/game';
import { CardBack } from './CardBack';
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
        'relative flex gap-2 items-center p-2 rounded-lg transition-colors',
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
          className="absolute -inset-0.5 rounded-lg pointer-events-none"
          animate={{
            boxShadow: [
              `0 0 12px 0px ${accent}aa`,
              `0 0 24px 4px ${accent}cc`,
              `0 0 12px 0px ${accent}aa`,
            ],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Handmaid shield */}
      {player.isProtected && !player.isEliminated && <HandmaidShield />}

      {/* Avatar + nom + jetons */}
      <div className="flex items-center gap-2 min-w-0 z-10">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0"
          style={{
            background: accent,
            color: 'var(--color-ink)',
            border: '1px solid var(--color-gold-deep)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
          }}
        >
          {player.name[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex flex-col min-w-0">
          <div
            className="font-display text-sm leading-tight truncate max-w-[110px]"
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
            {player.tokens === 0 && (
              <span className="text-[9px] opacity-50 font-mono">0 jeton</span>
            )}
          </div>
        </div>
      </div>

      {/* Main (dos) */}
      <div className="flex gap-1 z-10">
        <AnimatePresence>
          {player.hand.map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.4, opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <CardBack size="sm" />
            </motion.div>
          ))}
        </AnimatePresence>
        {player.isEliminated && (
          <span
            className="text-[10px] font-display uppercase tracking-wider pl-2 self-center"
            style={{ color: 'var(--color-danger)' }}
          >
            ✕ éliminé·e
          </span>
        )}
      </div>

      {/* Défausse */}
      {player.discard.length > 0 && (
        <DiscardFan cards={player.discard} />
      )}
    </motion.div>
  );
}

function DiscardFan({ cards }: { cards: CardKind[] }) {
  return (
    <div className="flex gap-[2px] flex-wrap max-w-[180px] z-10">
      <AnimatePresence>
        {cards.map((c, i) => (
          <motion.div
            key={`${c}-${i}`}
            initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 0.95 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.05 }}
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
      className="w-[26px] h-[36px] rounded flex flex-col items-center justify-center font-display font-bold text-[11px] shrink-0"
      style={{
        background:
          'linear-gradient(180deg, var(--color-parchment) 0%, var(--color-parchment-dark) 100%)',
        color: 'var(--color-ink)',
        border: '1px solid var(--color-gold-deep)',
      }}
      aria-label={CARD_NAME_FR[kind]}
    >
      <span style={{ fontSize: 11, lineHeight: 1 }}>{CARD_VALUE[kind]}</span>
      <span style={{ fontSize: 7, opacity: 0.7, lineHeight: 1 }}>
        {CARD_NAME_FR[kind].slice(0, 3)}
      </span>
    </div>
  );
}

'use client';

import { motion } from 'motion/react';
import type { GameState, RoundEndSummary } from '@/lib/game';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/game/Card';

export interface RoundEndModalProps {
  open: boolean;
  state: GameState;
  summary: RoundEndSummary;
  onNextRound: () => void;
}

/**
 * Reveal scénarisé : on ne saute pas à la conclusion. Ordre d'apparition :
 *   1. Label "Mains révélées"           (instantané)
 *   2. Mains, une par une               (HAND_STAGGER × index)
 *   3. Badge "✓ manche" sur le/s gagnant·e/s
 *   4. Phrase de raison ("X seul·e survivant·e !" ou "Pioche vide…")
 *   5. Bonus Espionne (s'il y en a un)
 *   6. Bouton "Manche suivante"
 */
const HAND_STAGGER = 0.32;
const HANDS_LEAD = 0.15;
const POST_HANDS_GAP = 0.45;
const BONUS_GAP = 0.35;
const BUTTON_GAP = 0.5;

export function RoundEndModal({ open, state, summary, onNextRound }: RoundEndModalProps) {
  const winnerNames = summary.winners
    .map((id) => state.players.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(', ');
  const bonusName = summary.spyBonusTo
    ? state.players.find((p) => p.id === summary.spyBonusTo)?.name
    : null;

  const handCount = state.players.length;
  const lastHandAt = HANDS_LEAD + (handCount - 1) * HAND_STAGGER;
  const winnerBadgeAt = lastHandAt + POST_HANDS_GAP;
  const reasonAt = winnerBadgeAt + 0.35;
  const bonusAt = reasonAt + BONUS_GAP;
  const buttonAt = (bonusName ? bonusAt : reasonAt) + BUTTON_GAP;

  return (
    <Modal open={open} title={`Fin de la manche ${state.roundNumber}`} dismissable={false}>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="font-display text-sm uppercase tracking-wide mb-2 opacity-80">
            Mains révélées
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {state.players.map((p, i) => {
              const card = summary.finalHands[p.id];
              const isWinner = card != null && summary.winners.includes(p.id);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 14, rotateY: 90 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{
                    delay: HANDS_LEAD + i * HAND_STAGGER,
                    type: 'spring',
                    stiffness: 220,
                    damping: 20,
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-xs font-display opacity-80">{p.name}</span>
                  {card ? (
                    <Card kind={card} size="sm" />
                  ) : (
                    <div
                      className="w-[56px] h-[78px] rounded flex items-center justify-center text-[9px] italic opacity-50"
                      style={{ border: '1px dashed var(--color-ink-soft)' }}
                    >
                      éliminé·e
                    </div>
                  )}
                  <span className="text-[10px] font-mono">
                    {p.tokens} jeton{p.tokens > 1 ? 's' : ''}
                  </span>
                  {isWinner && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: winnerBadgeAt,
                        type: 'spring',
                        stiffness: 480,
                        damping: 14,
                      }}
                      className="text-[9px] font-display"
                      style={{ color: 'var(--color-success)' }}
                    >
                      ✓ manche
                    </motion.span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reasonAt, duration: 0.35 }}
        >
          <p className="font-display text-lg">
            {summary.reason === 'lastSurvivor'
              ? `${winnerNames} seul·e survivant·e !`
              : `Pioche vide. Plus haute carte : ${winnerNames}.`}
          </p>
          {bonusName && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: bonusAt, duration: 0.3 }}
              className="text-sm italic mt-1"
              style={{ color: 'var(--color-cartouche-deep)' }}
            >
              +1 jeton bonus Espionne pour {bonusName}.
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: buttonAt, duration: 0.3 }}
        >
          <Button onClick={onNextRound} className="w-full" variant="primary">
            Manche suivante
          </Button>
        </motion.div>
      </div>
    </Modal>
  );
}

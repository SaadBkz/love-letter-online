'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { GameState, RoundEndSummary } from '@/lib/game';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/game/Card';

const FORCE_AVAILABLE_AFTER_MS = 30_000;

export interface RoundEndModalProps {
  open: boolean;
  state: GameState;
  summary: RoundEndSummary;
  /**
   * Solo : appelé quand l'utilisateur clique "Manche suivante" — démarre
   *        immédiatement la manche suivante.
   * Multi : appelé quand l'utilisateur clique "Je suis prêt" — POST
   *        `/ready-next-round`. La manche suivante démarre automatiquement
   *        côté serveur quand tous les joueurs sont prêts.
   */
  onNextRound: () => void;
  /**
   * Si fourni : mode multi avec compteur de readiness. Affiche "X/N prêts"
   * et désactive le bouton si l'utilisateur est déjà dans la liste.
   * Si omis : mode solo (bouton direct "Manche suivante").
   */
  readyPlayers?: string[];
  /** Requis en mode multi pour savoir si l'utilisateur courant a cliqué. */
  currentUserId?: string;
  /**
   * Mode multi uniquement : appelé quand l'utilisateur clique "Forcer la
   * manche". Doit dispatcher un `startNextRound` côté serveur sans attendre
   * que les autres soient prêts (gère le cas AFK). Devient cliquable après
   * 30 s d'attente.
   */
  onForceNextRound?: () => void;
}

const HAND_STAGGER = 0.32;
const HANDS_LEAD = 0.15;
const POST_HANDS_GAP = 0.45;
const BONUS_GAP = 0.35;
const BUTTON_GAP = 0.5;

export function RoundEndModal({
  open,
  state,
  summary,
  onNextRound,
  readyPlayers,
  currentUserId,
  onForceNextRound,
}: RoundEndModalProps) {
  // Compteur de 30 s avant que le bouton "Forcer" devienne cliquable.
  // Le ticker est ré-armé à chaque ouverture du modal (clé state.roundNumber).
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(FORCE_AVAILABLE_AFTER_MS / 1000),
  );
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecondsLeft(Math.ceil(FORCE_AVAILABLE_AFTER_MS / 1000));
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, state.roundNumber]);
  const canForce = secondsLeft <= 0;

  // Debounce des boutons d'action : une fois cliqué, on les désactive
  // immédiatement pour empêcher le double-tap mobile (qui ferait dispatcher
  // 2 fois `startNextRound` ou `markReady` en très peu de temps, le 2ⁿᵈ
  // dispatch tombant sur un state déjà avancé → toast "Pas de manche à
  // démarrer"). Reset quand le modal se rouvre (nouvelle manche).
  const [submitting, setSubmitting] = useState<'next' | 'force' | null>(null);
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubmitting(null);
  }, [open, state.roundNumber]);
  function handleNextRoundClick() {
    if (submitting) return;
    setSubmitting('next');
    onNextRound();
  }
  function handleForceClick() {
    if (submitting) return;
    setSubmitting('force');
    onForceNextRound?.();
  }
  const winnerNames = summary.winners
    .map((id) => state.players.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(', ');
  const bonusName = summary.spyBonusTo
    ? state.players.find((p) => p.id === summary.spyBonusTo)?.name
    : null;

  const isMultiMode = readyPlayers !== undefined;
  const meIsReady = isMultiMode && currentUserId
    ? readyPlayers.includes(currentUserId)
    : false;
  const readyCount = isMultiMode ? readyPlayers.length : 0;
  const totalCount = state.players.length;

  const handCount = state.players.length;
  const lastHandAt = HANDS_LEAD + (handCount - 1) * HAND_STAGGER;
  const winnerBadgeAt = lastHandAt + POST_HANDS_GAP;
  const reasonAt = winnerBadgeAt + 0.35;
  const bonusAt = reasonAt + BONUS_GAP;
  const readinessAt = (bonusName ? bonusAt : reasonAt) + 0.4;
  const buttonAt = readinessAt + BUTTON_GAP;

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

        {isMultiMode && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: readinessAt, duration: 0.3 }}
            className="flex flex-col gap-2 px-3 py-2 rounded-md"
            style={{
              background: 'rgba(0,0,0,0.18)',
              border: '1px solid var(--color-gold-deep)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-display uppercase tracking-wider opacity-80">
                Prêts pour la manche suivante
              </span>
              <span
                className="font-mono text-sm font-bold"
                style={{ color: 'var(--color-gold-bright)' }}
              >
                {readyCount}/{totalCount}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {state.players.map((p) => {
                const isReady = readyPlayers!.includes(p.id);
                const isMe = p.id === currentUserId;
                return (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-display"
                    style={{
                      background: isReady ? 'rgba(107,142,78,0.25)' : 'rgba(0,0,0,0.25)',
                      color: isReady
                        ? 'var(--color-success, #6b8e4e)'
                        : 'var(--color-parchment)',
                      border: `1px solid ${isReady ? '#6b8e4e' : 'var(--color-gold-deep)'}`,
                      opacity: isReady ? 1 : 0.7,
                    }}
                  >
                    {isReady ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 inline-block opacity-40">○</span>}
                    {p.name}
                    {isMe && <span className="opacity-50">(toi)</span>}
                  </span>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: buttonAt, duration: 0.3 }}
          className="flex flex-col gap-2"
        >
          <Button
            onClick={handleNextRoundClick}
            className="w-full"
            variant="primary"
            disabled={meIsReady || submitting !== null}
          >
            {isMultiMode
              ? meIsReady
                ? `En attente des autres (${readyCount}/${totalCount})…`
                : submitting === 'next'
                  ? 'Envoi…'
                  : 'Je suis prêt'
              : submitting === 'next'
                ? 'Démarrage…'
                : 'Manche suivante'}
          </Button>

          {/* Bouton "Forcer" — multi uniquement, dispo après 30 s pour gérer
              les joueurs AFK qui ne cliqueraient jamais "Je suis prêt". */}
          {isMultiMode && onForceNextRound && readyCount < totalCount && (
            <Button
              onClick={handleForceClick}
              className="w-full"
              variant="ghost"
              disabled={!canForce || submitting !== null}
            >
              {submitting === 'force'
                ? 'Envoi…'
                : canForce
                  ? 'Forcer la manche suivante (passer outre les non-prêts)'
                  : `Forcer la manche suivante… (${secondsLeft} s)`}
            </Button>
          )}
        </motion.div>
      </div>
    </Modal>
  );
}

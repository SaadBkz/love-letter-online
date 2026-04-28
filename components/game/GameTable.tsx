'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ScrollText, HelpCircle } from 'lucide-react';
import type { Action, CardKind, GameState, PlayerId, RevealEvent } from '@/lib/game';
import {
  CARD_CAN_TARGET_SELF,
  CARD_NAME_FR,
  CARD_REQUIRES_TARGET,
  CARD_VALUE,
  playableCards,
  validAnyTargets,
  validOpponentTargets,
} from '@/lib/game';
import { PlayerSeat } from './PlayerSeat';
import { Deck } from './Deck';
import { LocalHand } from './LocalHand';
import { TargetPickerModal } from './modals/TargetPickerModal';
import { GuardGuessModal } from './modals/GuardGuessModal';
import { ChancellorModal } from './modals/ChancellorModal';
import { LogDrawer } from './modals/LogDrawer';
import { WaxSealToken } from './WaxSealToken';
import { GameLogFeed } from './GameLogFeed';
import { RevealBubble } from './RevealBubble';
import { cn } from '@/lib/utils/cn';

const ACCENT_COLORS = [
  '#c9a96e',
  '#a0564a',
  '#4a78a0',
  '#8b5a9e',
  '#6b8e4e',
  '#5a9e8b',
];

export interface GameTableProps {
  state: GameState;
  humanId: PlayerId;
  onAction: (action: Action) => void;
  onStartNewRound: () => void;
  onReplay: () => void;
}

/**
 * Une révélation est "privée" au joueur humain si :
 * - priestPeek : seul l'actor voit la carte. Donc montrer uniquement si actor === human.
 * - Les autres events sont publics (Guard, Baron, Prince, King, Princess).
 */
function shouldShowReveal(ev: RevealEvent, humanId: PlayerId): boolean {
  if (ev.type === 'priestPeek') {
    return ev.actorId === humanId;
  }
  return true;
}

export function GameTable({ state, humanId, onAction }: GameTableProps) {
  const human = state.players.find((p) => p.id === humanId)!;
  const opponents = state.players.filter((p) => p.id !== humanId);
  const current = state.players[state.currentPlayerIdx]!;
  // B2 : pendant `lastRoundSummary` (manche terminée), le `currentPlayerIdx`
  // peut pointer sur un éliminé (notamment après auto-suicide Princesse).
  // On fige `isHumanTurn` à false tant que la manche n'est pas relancée et
  // que le joueur courant n'est pas éliminé.
  const isHumanTurn =
    current.id === humanId &&
    state.turnPhase === 'play' &&
    !state.lastRoundSummary &&
    !current.isEliminated;
  const isHumanChancellor =
    current.id === humanId &&
    state.turnPhase === 'resolvingChancellor' &&
    !current.isEliminated;
  // B11 + B14 : feedback "X joue / réfléchit" pour TOUS les joueurs distants
  // (humains adverses en multi ou bots en solo), incluant la phase de
  // résolution Chancelière (sinon la partie a l'air figée pendant que le
  // joueur courant choisit l'ordre des cartes à remettre sous la pioche).
  const isRemoteCurrent =
    current.id !== humanId &&
    !current.isEliminated &&
    !state.lastRoundSummary &&
    (state.turnPhase === 'play' || state.turnPhase === 'resolvingChancellor');
  const remoteCurrentLabel = isRemoteCurrent
    ? state.turnPhase === 'resolvingChancellor'
      ? `${current.name} (Chancelière)`
      : current.name
    : null;

  const [pendingCard, setPendingCard] = useState<CardKind | null>(null);
  const [pendingTarget, setPendingTarget] = useState<PlayerId | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  // Manual draw : pour un tour donné (turnNumber + currentPlayerIdx), a-t-on "révélé" la carte piochée ?
  const turnKey = `${state.roundNumber}-${state.turnNumber}-${state.currentPlayerIdx}`;
  const [drawnTurnKey, setDrawnTurnKey] = useState<string | null>(null);
  const [revealingCard, setRevealingCard] = useState<CardKind | null>(null);
  const hasDrawn = drawnTurnKey === turnKey;

  // Auto-draw pour les bots : quand c'est au tour d'un bot, on simule la pioche après un délai.
  useEffect(() => {
    if (state.gamePhase !== 'playing' || state.lastRoundSummary) return;
    if (state.turnPhase !== 'play') return;
    if (!current.isBot || current.isEliminated) return;
    if (drawnTurnKey === turnKey) return;
    const t = setTimeout(() => {
      setDrawnTurnKey(turnKey);
    }, 400);
    return () => clearTimeout(t);
  }, [turnKey, state.turnPhase, state.gamePhase, state.lastRoundSummary, current.isBot, current.isEliminated, drawnTurnKey]);

  // B4 : reset les states UI locaux (carte choisie, cible) dès que ce n'est
  // plus mon tour ou qu'une manche se termine. Sinon le TargetPickerModal /
  // GuardGuessModal restent ouverts si le tour change pendant l'interaction
  // (refresh, élimination par un autre joueur via Pusher event, etc.).
  useEffect(() => {
    if (!isHumanTurn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingCard(null);
      setPendingTarget(null);
    }
  }, [isHumanTurn]);

  function handleDeckTap() {
    if (!isHumanTurn || hasDrawn) return;
    // La carte piochée est la 2ᵉ de la main dans notre état (auto-draw moteur).
    const drawn = human.hand[1];
    if (drawn) {
      setRevealingCard(drawn);
      setTimeout(() => {
        setDrawnTurnKey(turnKey);
        setRevealingCard(null);
      }, 600);
    } else {
      setDrawnTurnKey(turnKey);
    }
  }

  // Reveal bubble queue.
  //
  // B5 : on ne capture la longueur initiale du log qu'à la PREMIÈRE itération
  // où on voit un state. Avant, `useRef(state.log.length)` se figeait à 0 si
  // le composant montait avec un state vide (refresh très rapide en multi),
  // puis tous les reveals d'historique étaient rejoués → spam de bulles.
  const processedLogCountRef = useRef(-1);
  const [revealQueue, setRevealQueue] = useState<RevealEvent[]>([]);
  useEffect(() => {
    if (processedLogCountRef.current === -1) {
      // Premier tick utile : on saute tous les events déjà présents (refresh
      // ou état initial) sans rejouer leurs reveals.
      processedLogCountRef.current = state.log.length;
      return;
    }
    if (state.log.length <= processedLogCountRef.current) return;
    const newEntries = state.log.slice(processedLogCountRef.current);
    const newReveals: RevealEvent[] = [];
    for (const e of newEntries) {
      if (e.reveal && shouldShowReveal(e.reveal, humanId)) {
        newReveals.push(e.reveal);
      }
      // Plus aucun toast pour les events de jeu : tout passe par le feed central
      // (GameLogFeed). Les toasts restent réservés aux erreurs (action refusée,
      // erreur réseau) déclenchées ailleurs dans la page.
    }
    processedLogCountRef.current = state.log.length;
    if (newReveals.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRevealQueue((q) => [...q, ...newReveals]);
    }
  }, [state.log, humanId]);

  // Auto-dismiss reveal après une durée. Allongé pour laisser le temps de
  // voir l'animation complète (cartes → verdict décalé d'1.0–1.6s dans
  // RevealBubble.tsx).
  //
  // B12 : on dépend du HEAD de la queue, pas de la queue entière. Sinon
  // chaque push (ajout en queue) re-firait le useEffect → cleanup l'ancien
  // setTimeout et relançait un nouveau de zéro, faisant rester le head plus
  // longtemps que prévu.
  const revealHead = revealQueue[0] ?? null;
  useEffect(() => {
    if (!revealHead) return;
    const duration =
      revealHead.type === 'guardGuess'
        ? 3000
        : revealHead.type === 'kingSwap'
          ? 2200
          : 3300;
    const t = setTimeout(() => {
      setRevealQueue((q) => q.slice(1));
    }, duration);
    return () => clearTimeout(t);
  }, [revealHead]);

  // Vibration tactile au début de chaque tour humain (mobile).
  // Déduplication par (round, turn) pour éviter de re-vibrer sur
  // chaque mise à jour intermédiaire (Chancelière, etc.).
  const lastVibratedTurnRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isHumanTurn) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    const turnId = `${state.roundNumber}-${state.turnNumber}-${humanId}`;
    if (lastVibratedTurnRef.current === turnId) return;
    lastVibratedTurnRef.current = turnId;
    // Pattern visible : impulsion - pause - impulsion. Reste discret mais perceptible.
    navigator.vibrate([55, 55, 55]);
  }, [isHumanTurn, state.roundNumber, state.turnNumber, humanId]);

  const humanPlayable = useMemo(() => {
    if (!isHumanTurn || !hasDrawn) return [];
    return playableCards(state);
  }, [state, isHumanTurn, hasDrawn]);

  const forcedCountess = useMemo<CardKind | null>(() => {
    if (!isHumanTurn || !hasDrawn) return null;
    const hasCountess = human.hand.includes('Countess');
    const hasKingOrPrince = human.hand.includes('King') || human.hand.includes('Prince');
    return hasCountess && hasKingOrPrince ? 'Countess' : null;
  }, [human.hand, isHumanTurn, hasDrawn]);

  function handleCardSelect(card: CardKind) {
    if (!isHumanTurn || !hasDrawn) return;
    const needsTarget = CARD_REQUIRES_TARGET[card];
    if (!needsTarget) {
      if (card === 'Princess') {
        // Confirmation suicide
        const ok = window.confirm(
          'Défausser la Princesse = élimination immédiate. Tu confirmes ?',
        );
        if (!ok) return;
      }
      onAction({ kind: 'playCard', playerId: humanId, card });
      return;
    }
    const canSelf = CARD_CAN_TARGET_SELF[card];
    const opps = validOpponentTargets(state, humanId);
    if (opps.length === 0 && !canSelf) {
      onAction({ kind: 'playCard', playerId: humanId, card });
      return;
    }
    setPendingCard(card);
  }

  function handleTargetPick(targetId: string | null) {
    if (!pendingCard) return;
    if (pendingCard === 'Guard' && targetId) {
      setPendingTarget(targetId);
      return;
    }
    onAction({
      kind: 'playCard',
      playerId: humanId,
      card: pendingCard,
      ...(targetId ? { target: targetId } : {}),
    });
    setPendingCard(null);
    setPendingTarget(null);
  }

  function handleGuardGuess(guess: CardKind) {
    if (!pendingCard || !pendingTarget) return;
    onAction({
      kind: 'playCard',
      playerId: humanId,
      card: pendingCard,
      target: pendingTarget,
      guardGuess: guess,
    });
    setPendingCard(null);
    setPendingTarget(null);
  }

  function handleChancellorResolve(keep: CardKind, bottom: CardKind[]) {
    onAction({ kind: 'resolveChancellor', playerId: humanId, keep, bottom });
  }

  function handleCancel() {
    setPendingCard(null);
    setPendingTarget(null);
  }

  const pendingCardTargets = pendingCard
    ? CARD_CAN_TARGET_SELF[pendingCard]
      ? validAnyTargets(state, humanId, true)
      : validOpponentTargets(state, humanId)
    : [];

  const visibleHandCount = isHumanTurn && !hasDrawn ? 1 : human.hand.length;

  return (
    <div className="relative flex flex-col h-[100dvh] w-full max-w-md mx-auto overflow-hidden">
      {/* Header compact */}
      <header className="flex items-center justify-between px-2 py-1 border-b border-[color:var(--color-gold-deep)]/30 shrink-0 text-xs">
        <div className="font-display opacity-80 flex items-center gap-2">
          <span>M{state.roundNumber}·T{state.turnNumber}</span>
          <span className="opacity-50">·</span>
          <span style={{ color: 'var(--color-gold-bright)' }}>{human.name}</span>
          <span className="flex items-center gap-0.5">
            {Array.from({ length: human.tokens }).map((_, i) => (
              <WaxSealToken key={i} size="xs" />
            ))}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setLogOpen(true)}
            className="p-1.5 rounded hover:bg-white/10"
            aria-label="Historique"
          >
            <ScrollText className="w-4 h-4" style={{ color: 'var(--color-parchment)' }} />
          </button>
          <a
            href="/docs/rules.md"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-white/10"
            aria-label="Règles"
          >
            <HelpCircle className="w-4 h-4" style={{ color: 'var(--color-parchment)' }} />
          </a>
        </div>
      </header>

      {/* B3 + B13 : bandeau "À toi !" / "Tour de X" très visible, pour
          que les joueurs sachent toujours au tour de qui c'est. */}
      <TurnBanner
        isHumanTurn={isHumanTurn}
        isHumanChancellor={isHumanChancellor}
        hasDrawn={hasDrawn}
        currentName={current.name}
        currentEliminated={current.isEliminated}
        roundEnded={!!state.lastRoundSummary}
      />

      {/* Zone adversaires — compact */}
      <section className="flex flex-col gap-1 px-2 py-1 shrink-0">
        {opponents.map((p, i) => {
          const accent = ACCENT_COLORS[(i + 1) % ACCENT_COLORS.length]!;
          const isCurrent = current.id === p.id;
          return (
            <PlayerSeat
              key={p.id}
              player={p}
              isCurrent={isCurrent}
              accent={accent}
            />
          );
        })}
      </section>

      {/* Zone centrale : feed de logs (auto-scroll vers la dernière entrée) */}
      <section className="flex-1 min-h-0 px-2 py-1">
        <GameLogFeed
          log={state.log}
          thinkingPlayerName={remoteCurrentLabel}
        />
      </section>

      {/* Zone locale — Pioche (gauche) + Main (centre) + Défausse mini (sous) */}
      <section
        className={cn(
          'shrink-0 pt-1 pb-2 px-1 border-t transition-colors',
          isHumanTurn
            ? 'border-[color:var(--color-gold-bright)]'
            : 'border-[color:var(--color-gold-deep)]/30',
        )}
        style={
          isHumanTurn
            ? { boxShadow: '0 -4px 16px rgba(201,169,110,0.22)' }
            : undefined
        }
      >
        <div className="flex items-center gap-2 px-1">
          <div className="shrink-0">
            <Deck
              remaining={state.deck.length}
              tappable={isHumanTurn && !hasDrawn}
              revealingCard={revealingCard}
              onTap={handleDeckTap}
            />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-center">
            <LocalHand
              hand={human.hand}
              visibleCount={visibleHandCount}
              playable={humanPlayable}
              onSelect={isHumanTurn && hasDrawn ? handleCardSelect : undefined}
              forcedCard={forcedCountess}
              readOnly={!isHumanTurn || !hasDrawn}
            />
          </div>
        </div>
        {human.discard.length > 0 && (
          <div className="mt-1 flex items-center gap-1 px-1">
            <span className="text-[9px] opacity-60 font-display uppercase tracking-wider shrink-0">
              Défausse
            </span>
            <div className="flex gap-[2px] overflow-x-auto">
              {human.discard.map((c, i) => (
                <div key={`${c}-${i}`} className="shrink-0">
                  <MiniOwnDiscard kind={c} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Modals */}
      {pendingCard && !pendingTarget && (
        <TargetPickerModal
          open
          cardName={CARD_NAME_FR[pendingCard]}
          targets={pendingCardTargets}
          allowNoTarget={pendingCardTargets.length === 0}
          onPick={handleTargetPick}
          onCancel={handleCancel}
        />
      )}
      {pendingCard === 'Guard' && pendingTarget && (
        <GuardGuessModal
          open
          targetName={state.players.find((p) => p.id === pendingTarget)?.name ?? ''}
          onPick={handleGuardGuess}
          onCancel={handleCancel}
        />
      )}
      {isHumanChancellor && state.chancellorHand && (
        <ChancellorModal
          open
          cards={state.chancellorHand}
          onResolve={handleChancellorResolve}
        />
      )}

      {/* Reveal bubble queue */}
      <RevealBubble
        event={revealQueue[0] ?? null}
        players={state.players}
        onDismiss={() => setRevealQueue((q) => q.slice(1))}
      />

      <LogDrawer open={logOpen} onClose={() => setLogOpen(false)} log={state.log} />
    </div>
  );
}

function TurnBanner({
  isHumanTurn,
  isHumanChancellor,
  hasDrawn,
  currentName,
  currentEliminated,
  roundEnded,
}: {
  isHumanTurn: boolean;
  isHumanChancellor: boolean;
  hasDrawn: boolean;
  currentName: string;
  currentEliminated: boolean;
  roundEnded: boolean;
}) {
  // Pendant `lastRoundSummary`, le RoundEndModal couvre tout : on n'affiche
  // rien pour éviter une info contradictoire.
  if (roundEnded) return null;

  const isMine = isHumanTurn || isHumanChancellor;
  const message = isHumanChancellor
    ? 'À toi — choisis l\'ordre des cartes (Chancelière)'
    : isHumanTurn
      ? hasDrawn
        ? 'À toi — choisis une carte à jouer'
        : 'À toi — pioche une carte ↓'
      : currentEliminated
        ? 'En attente…'
        : `Tour de ${currentName}`;

  return (
    <motion.div
      key={isMine ? 'mine' : `other-${currentName}`}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="shrink-0 flex items-center justify-center px-3 py-1.5 border-b text-center font-display"
      style={{
        background: isMine
          ? 'linear-gradient(180deg, rgba(201,169,110,0.28) 0%, rgba(201,169,110,0.12) 100%)'
          : 'rgba(0,0,0,0.25)',
        borderColor: isMine
          ? 'var(--color-gold-bright)'
          : 'rgba(201,169,110,0.18)',
        color: isMine ? 'var(--color-gold-bright)' : 'var(--color-parchment)',
        fontWeight: isMine ? 700 : 500,
        fontSize: 13,
        letterSpacing: '0.02em',
        boxShadow: isMine ? '0 2px 12px rgba(230,200,138,0.18)' : 'none',
      }}
    >
      {isMine ? (
        <motion.span
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {message}
        </motion.span>
      ) : (
        <span>{message}</span>
      )}
    </motion.div>
  );
}

function MiniOwnDiscard({ kind }: { kind: CardKind }) {
  return (
    <div
      className="w-[22px] h-[30px] rounded-sm flex items-center justify-center font-display font-bold"
      style={{
        background:
          'linear-gradient(180deg, var(--color-parchment) 0%, var(--color-parchment-dark) 100%)',
        color: 'var(--color-ink)',
        border: '1px solid var(--color-gold-deep)',
      }}
      title={CARD_NAME_FR[kind]}
    >
      <span style={{ fontSize: 11, lineHeight: 1 }}>{CARD_VALUE[kind]}</span>
    </div>
  );
}

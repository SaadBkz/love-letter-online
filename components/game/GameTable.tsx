'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollText, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Action, CardKind, GameState, PlayerId } from '@/lib/game';
import {
  CARD_CAN_TARGET_SELF,
  CARD_NAME_FR,
  CARD_REQUIRES_TARGET,
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
import { cn } from '@/lib/utils/cn';

const ACCENT_COLORS = [
  '#c9a96e', // gold
  '#6b8e4e', // olive
  '#4a78a0', // steel blue
  '#a0564a', // terracotta
  '#8b5a9e', // violet
  '#5a9e8b', // teal
];

export interface GameTableProps {
  state: GameState;
  humanId: PlayerId;
  onAction: (action: Action) => void;
  onStartNewRound: () => void;
  onReplay: () => void;
  /** Nombre de logs au moment du dernier render, pour détecter les nouveaux events à toaster */
  lastLogSize?: number;
}

export function GameTable({ state, humanId, onAction }: GameTableProps) {
  const human = state.players.find((p) => p.id === humanId)!;
  const opponents = state.players.filter((p) => p.id !== humanId);
  const current = state.players[state.currentPlayerIdx]!;
  const isHumanTurn = current.id === humanId && state.turnPhase === 'play';
  const isHumanChancellor = current.id === humanId && state.turnPhase === 'resolvingChancellor';

  const [pendingCard, setPendingCard] = useState<CardKind | null>(null);
  const [pendingTarget, setPendingTarget] = useState<PlayerId | null>(null);
  const [logOpen, setLogOpen] = useState(false);

  // Toast sur nouveaux log entries (pour feedback visuel). Ref car pas besoin de re-render.
  const shownLogCountRef = useRef(state.log.length);
  useEffect(() => {
    if (state.log.length <= shownLogCountRef.current) return;
    const newEntries = state.log.slice(shownLogCountRef.current);
    for (const e of newEntries) {
      if (e.kind === 'info' || e.kind === 'play') continue;
      if (e.kind === 'reveal' && e.actorId !== humanId) continue;
      toast(e.text, {
        duration: e.kind === 'reveal' ? 6000 : 3500,
      });
    }
    shownLogCountRef.current = state.log.length;
  }, [state.log, humanId]);

  const humanPlayable = useMemo(() => {
    if (!isHumanTurn) return [];
    return playableCards(state);
  }, [state, isHumanTurn]);

  const forcedCountess = useMemo<CardKind | null>(() => {
    if (!isHumanTurn) return null;
    const hasCountess = human.hand.includes('Countess');
    const hasKingOrPrince = human.hand.includes('King') || human.hand.includes('Prince');
    return hasCountess && hasKingOrPrince ? 'Countess' : null;
  }, [human.hand, isHumanTurn]);

  const seenDiscardCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of state.players) {
      for (const c of p.discard) map[c] = (map[c] ?? 0) + 1;
    }
    for (const c of state.publicRemoved) map[c] = (map[c] ?? 0) + 1;
    for (const c of human.hand) map[c] = (map[c] ?? 0) + 1;
    return map;
  }, [state.players, state.publicRemoved, human.hand]);

  function handleCardSelect(card: CardKind) {
    if (!isHumanTurn) return;
    const needsTarget = CARD_REQUIRES_TARGET[card];
    if (!needsTarget) {
      // Défausse directe (Spy, Handmaid, Chancellor, Countess, Princess)
      onAction({ kind: 'playCard', playerId: humanId, card });
      return;
    }
    // Vérifier s'il y a des cibles valides
    const canSelf = CARD_CAN_TARGET_SELF[card];
    const opponents = validOpponentTargets(state, humanId);
    if (opponents.length === 0 && !canSelf) {
      // aucune cible valide → défausse sans effet
      onAction({ kind: 'playCard', playerId: humanId, card });
      return;
    }
    setPendingCard(card);
  }

  function handleTargetPick(targetId: string | null) {
    if (!pendingCard) return;
    if (pendingCard === 'Guard' && targetId) {
      setPendingTarget(targetId);
      // ne submit pas encore, attend la guess
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
    onAction({
      kind: 'resolveChancellor',
      playerId: humanId,
      keep,
      bottom,
    });
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

  return (
    <div className="relative flex flex-col h-[100dvh] w-full max-w-md mx-auto overflow-hidden">
      {/* Header : manche / tour / aide */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-[color:var(--color-gold-deep)]/30 shrink-0">
        <div className="text-xs font-display opacity-80">
          Manche {state.roundNumber} · Tour {state.turnNumber}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLogOpen(true)}
            className="p-2 rounded hover:bg-white/10"
            aria-label="Historique"
          >
            <ScrollText className="w-5 h-5" style={{ color: 'var(--color-parchment)' }} />
          </button>
          <a
            href="/docs/rules.md"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded hover:bg-white/10"
            aria-label="Règles"
          >
            <HelpCircle className="w-5 h-5" style={{ color: 'var(--color-parchment)' }} />
          </a>
        </div>
      </header>

      {/* Zone adversaires */}
      <section className="flex flex-col gap-2 px-3 py-2 shrink-0">
        {opponents.map((p, i) => {
          const accent = ACCENT_COLORS[i + 1] ?? '#c9a96e';
          const isCurrent = current.id === p.id;
          return (
            <PlayerSeat
              key={p.id}
              player={p}
              isCurrent={isCurrent}
              accent={accent}
              orientation="top"
            />
          );
        })}
      </section>

      {/* Zone centrale : pioche */}
      <section className="flex-1 flex items-center justify-center py-2 min-h-0">
        <Deck remaining={state.deck.length} />
      </section>

      {/* Indicateur de tour */}
      {isHumanTurn && (
        <div
          className="text-center py-1 font-display text-sm animate-pulse"
          style={{ color: 'var(--color-gold-bright)' }}
        >
          À toi de jouer
        </div>
      )}
      {!isHumanTurn && current.isBot && (
        <div
          className="text-center py-1 font-display text-sm opacity-70"
          style={{ color: 'var(--color-parchment)' }}
        >
          {current.name} réfléchit…
        </div>
      )}

      {/* Zone locale : ma main + ma défausse */}
      <section
        className={cn(
          'shrink-0 pt-2 pb-3 px-2 border-t',
          isHumanTurn
            ? 'border-[color:var(--color-gold-bright)] shadow-[0_-4px_16px_rgba(201,169,110,0.3)]'
            : 'border-[color:var(--color-gold-deep)]/30',
        )}
      >
        <div className="flex items-center justify-between mb-1 px-1">
          <div
            className="text-xs font-display"
            style={{ color: 'var(--color-gold-bright)' }}
          >
            {human.name} {human.isProtected ? '· protégé·e' : ''}
          </div>
          <div className="text-xs font-mono opacity-80">
            {human.tokens} jeton{human.tokens > 1 ? 's' : ''}
          </div>
        </div>
        <LocalHand
          hand={human.hand}
          playable={humanPlayable}
          onSelect={isHumanTurn ? handleCardSelect : undefined}
          forcedCard={forcedCountess}
          readOnly={!isHumanTurn}
        />
        {human.discard.length > 0 && (
          <div className="mt-2 flex items-center gap-2 px-1">
            <span className="text-[10px] opacity-60 font-display uppercase tracking-wider">
              Ma défausse
            </span>
            <div className="flex gap-[2px] overflow-x-auto">
              {human.discard.map((c, i) => (
                <div key={`${c}-${i}`} className="shrink-0">
                  <button
                    type="button"
                    className="cursor-default"
                    aria-label={CARD_NAME_FR[c]}
                  >
                    <MiniCard kind={c} />
                  </button>
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
          seenDiscard={seenDiscardCount}
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
      <LogDrawer open={logOpen} onClose={() => setLogOpen(false)} log={state.log} />
    </div>
  );
}

function MiniCard({ kind }: { kind: CardKind }) {
  // Petit badge compact pour la défausse locale
  return (
    <div
      className="w-[28px] h-[40px] rounded flex items-center justify-center font-display font-bold text-xs"
      style={{
        background: 'var(--color-parchment)',
        color: 'var(--color-ink)',
        border: '1px solid var(--color-gold-deep)',
      }}
    >
      {CARD_NAME_FR[kind]?.[0] ?? '?'}
    </div>
  );
}

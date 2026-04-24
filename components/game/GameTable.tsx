'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollText, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
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
import { BotThinking } from './BotThinking';
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
  const isHumanTurn = current.id === humanId && state.turnPhase === 'play';
  const isHumanChancellor = current.id === humanId && state.turnPhase === 'resolvingChancellor';
  const isBotTurn = !!current?.isBot && state.turnPhase === 'play' && !current.isEliminated;

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

  // Reveal bubble queue
  const processedLogCountRef = useRef(state.log.length);
  const [revealQueue, setRevealQueue] = useState<RevealEvent[]>([]);
  useEffect(() => {
    if (state.log.length <= processedLogCountRef.current) return;
    const newEntries = state.log.slice(processedLogCountRef.current);
    const newReveals: RevealEvent[] = [];
    for (const e of newEntries) {
      if (e.reveal && shouldShowReveal(e.reveal, humanId)) {
        newReveals.push(e.reveal);
      }
      // Toasts for non-reveal events (elim, win, bonus)
      if (!e.reveal && (e.kind === 'elim' || e.kind === 'win' || e.kind === 'bonus' || e.kind === 'protect')) {
        toast(e.text, { duration: 3000 });
      }
    }
    processedLogCountRef.current = state.log.length;
    if (newReveals.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRevealQueue((q) => [...q, ...newReveals]);
    }
  }, [state.log, humanId]);

  // Auto-dismiss reveal après une durée (Garde = 2s, autres selon type)
  useEffect(() => {
    if (revealQueue.length === 0) return;
    const head = revealQueue[0]!;
    const duration = head.type === 'guardGuess' ? 2000 : head.type === 'kingSwap' ? 1800 : 2400;
    const t = setTimeout(() => {
      setRevealQueue((q) => q.slice(1));
    }, duration);
    return () => clearTimeout(t);
  }, [revealQueue]);

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

      {/* Zone centrale : pioche + état */}
      <section className="flex-1 flex flex-col items-center justify-center min-h-0 gap-1 py-1">
        <Deck
          remaining={state.deck.length}
          tappable={isHumanTurn && !hasDrawn}
          revealingCard={revealingCard}
          onTap={handleDeckTap}
        />
        {isBotTurn && <BotThinking name={current.name} />}
        {isHumanTurn && (
          <div
            className="text-center font-display text-[11px] px-2"
            style={{ color: 'var(--color-gold-bright)' }}
          >
            {hasDrawn ? 'À toi — choisis une carte' : 'Tape la pioche ↑'}
          </div>
        )}
      </section>

      {/* Zone locale — compact */}
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
        <LocalHand
          hand={human.hand}
          visibleCount={visibleHandCount}
          playable={humanPlayable}
          onSelect={isHumanTurn && hasDrawn ? handleCardSelect : undefined}
          forcedCard={forcedCountess}
          readOnly={!isHumanTurn || !hasDrawn}
        />
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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Action, GameState } from '@/lib/game';
import { applyAction, createGame } from '@/lib/game';
import { decideBotAction } from '@/lib/game/bot';
import { GameTable } from '@/components/game/GameTable';
import { RoundEndModal } from '@/components/game/modals/RoundEndModal';
import { GameEndModal } from '@/components/game/modals/GameEndModal';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const BOT_NAMES = ['Elora', 'Cendre', 'Thibaut', 'Lyse', 'Arven'];

type Setup = {
  playerCount: 2 | 3 | 4;
  pseudo: string;
};

export default function SoloPage() {
  const [setup, setSetup] = useState<Setup | null>(null);

  if (!setup) {
    return <SetupForm onStart={(s) => setSetup(s)} />;
  }
  return <SoloGame setup={setup} onExit={() => setSetup(null)} />;
}

function SetupForm({ onStart }: { onStart: (s: Setup) => void }) {
  const [pseudo, setPseudo] = useState('');
  const [count, setCount] = useState<2 | 3 | 4>(3);

  const trimmed = pseudo.trim();
  const canStart = trimmed.length > 0 && trimmed.length <= 20;

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="text-center">
          <h1
            className="font-display text-2xl font-bold mb-1"
            style={{ color: 'var(--color-gold-bright)' }}
          >
            Nouvelle partie solo
          </h1>
          <p className="text-sm italic opacity-80" style={{ color: 'var(--color-parchment)' }}>
            Choisis ton pseudo et le nombre total de joueurs (toi + bots).
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-display uppercase tracking-wider opacity-80">Pseudo</span>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={20}
            placeholder="Annette"
            className="px-4 py-3 rounded font-display focus:outline-none focus:ring-2 focus:ring-[color:var(--color-gold)]"
            style={{
              background: 'var(--color-parchment)',
              color: 'var(--color-ink)',
              border: '1px solid var(--color-gold-deep)',
            }}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-display uppercase tracking-wider opacity-80">
            Nombre de joueurs
          </span>
          <div className="grid grid-cols-3 gap-2">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className="px-4 py-3 rounded font-display font-semibold transition-all"
                style={{
                  background:
                    count === n ? 'var(--color-cartouche)' : 'rgba(0,0,0,0.2)',
                  color:
                    count === n ? 'var(--color-gold-bright)' : 'var(--color-parchment)',
                  border: `1px solid ${count === n ? 'var(--color-gold)' : 'var(--color-gold-deep)'}`,
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-[11px] opacity-60 italic">
            Toi + {count - 1} bot{count - 1 > 1 ? 's' : ''}. Premier à{' '}
            <strong>3 manches gagnées</strong> remporte la partie.
          </p>
        </div>

        <Button
          onClick={() =>
            onStart({ pseudo: trimmed || 'Toi', playerCount: count })
          }
          disabled={!canStart}
          className="w-full"
        >
          Lancer la partie
        </Button>

        <Link href="/" className="text-center text-sm opacity-60 hover:opacity-100">
          ← Retour
        </Link>
      </div>
    </main>
  );
}

function SoloGame({ setup, onExit }: { setup: Setup; onExit: () => void }) {
  const humanId = 'human';
  const [state, setState] = useState<GameState>(() => buildInitialState(setup));
  const latestRef = useRef(state);
  latestRef.current = state;

  function buildInitialState(s: Setup): GameState {
    const players = [
      { id: humanId, name: s.pseudo, isBot: false },
      ...Array.from({ length: s.playerCount - 1 }, (_, i) => ({
        id: `bot-${i}`,
        name: BOT_NAMES[i % BOT_NAMES.length]!,
        isBot: true,
      })),
    ];
    return createGame({ players, seed: `solo-${Date.now()}` });
  }

  const handleAction = useCallback((action: Action) => {
    setState((prev) => {
      try {
        return applyAction(prev, action);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Action invalide';
        // Double-tap mobile (le 1er tap dispatche, le 2nd arrive après que le
        // state ait avancé) → "pas le tour de X" / "joueur éliminé". Succès UX,
        // on swallow. Comparaison lowercase pour résister aux variantes de
        // ponctuation (apostrophes droites/courbes, etc.).
        const lower = msg.toLowerCase();
        const isStaleClick =
          lower.includes('pas le tour') || lower.includes('joueur éliminé');
        if (!isStaleClick) {
          toast.error(msg);
        }
        return prev;
      }
    });
  }, []);

  const startNewRound = useCallback(() => {
    setState((prev) => {
      try {
        return applyAction(prev, { kind: 'startNextRound', playerId: humanId });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Impossible de démarrer la manche');
        return prev;
      }
    });
  }, []);

  const replay = useCallback(() => {
    setState(buildInitialState(setup));
  }, [setup]);

  // Boucle bot : quand c'est au tour d'un bot et que la partie est en cours, l'IA agit après un délai.
  useEffect(() => {
    if (state.gamePhase !== 'playing') return;
    if (state.lastRoundSummary) return; // attendre le clic "manche suivante"
    const current = state.players[state.currentPlayerIdx];
    if (!current?.isBot) return;
    if (current.isEliminated) return;
    const delay = 900 + Math.floor(Math.random() * 700);
    const t = setTimeout(() => {
      const s = latestRef.current;
      if (s.gamePhase !== 'playing') return;
      if (s.lastRoundSummary) return;
      const cur = s.players[s.currentPlayerIdx];
      if (!cur?.isBot) return;
      try {
        const action = decideBotAction(s);
        setState(applyAction(s, action));
      } catch (err) {
        console.error('Bot action error', err);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [state]);

  // Vibration tactile au début de mon tour : déplacée dans GameTable pour
  // couvrir aussi le mode multijoueur.

  const showRoundEnd =
    state.lastRoundSummary !== null &&
    state.gamePhase === 'playing' &&
    state.lastRoundSummary.reason &&
    // Ne pas afficher si la partie est terminée (GameEndModal prend le relais)
    state.winnerId === null;
  const showGameEnd = state.gamePhase === 'ended';

  return (
    <>
      <GameTable
        state={state}
        humanId={humanId}
        onAction={handleAction}
        onStartNewRound={startNewRound}
        onReplay={replay}
      />

      {/* Bouton quitter discret */}
      <button
        onClick={onExit}
        className="fixed top-3 left-3 z-30 text-xs opacity-60 hover:opacity-100 px-2 py-1 rounded bg-black/40"
        style={{ color: 'var(--color-parchment)' }}
      >
        ← Quitter
      </button>

      {showRoundEnd && state.lastRoundSummary && (
        <RoundEndModal
          open
          state={state}
          summary={state.lastRoundSummary}
          onNextRound={startNewRound}
        />
      )}

      {showGameEnd && <GameEndModal open state={state} onReplay={replay} />}
    </>
  );
}

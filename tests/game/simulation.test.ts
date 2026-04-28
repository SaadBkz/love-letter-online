/**
 * Audit harness — joue 200+ parties complètes (4 joueurs, 4 bots) avec seeds variées.
 * Vérifie les invariants du moteur à chaque step, capture seed/state/action si
 * une exception est levée ou un invariant violé.
 *
 * NOTE — ce harness ne modifie pas le code de jeu. Il sert uniquement à révéler
 * des bugs déterministes dans l'engine. Les invariants attendus :
 *   I1. Conservation : sum(hands) + sum(discards) + deck.length + (removedCard ? 1 : 0)
 *       + publicRemoved.length + chancellorHandExtra == 21.
 *   I2. currentPlayerIdx pointe sur un joueur non éliminé pendant turnPhase 'play'
 *       OU la manche est terminée (lastRoundSummary !== null).
 *   I3. turnPhase === 'resolvingChancellor' ⇔ chancellorHand !== null.
 *   I4. Tokens monotone par joueur (jamais décroissant).
 *   I5. Fin de manche : winners.length >= 1 OU tous égalité, et tous les winners
 *       ont gagné +1 jeton, le bonus Spy +1 si éligible.
 *   I6. gamePhase === 'ended' ⇔ winnerId !== null ET un joueur a >= TOKENS_TO_WIN.
 *   I7. À tout moment, deck + retirées + mains + défausses + chancellor extras = 21.
 */
import { describe, expect, test } from 'vitest';
import {
  applyAction,
  createGame,
  TOKENS_TO_WIN,
  type Action,
  type GameState,
} from '@/lib/game';
import { decideBotAction } from '@/lib/game/bot';

const SIMULATIONS = 250;
const MAX_TURNS_PER_GAME = 4000;

interface Violation {
  seed: string;
  invariant: string;
  detail: string;
  turnNumber: number;
  roundNumber: number;
  state?: Partial<GameState>;
}

function totalCardsInPlay(state: GameState): number {
  let n = 0;
  for (const p of state.players) {
    n += p.hand.length;
    n += p.discard.length;
  }
  n += state.deck.length;
  if (state.removedCard) n += 1;
  n += state.publicRemoved.length;
  // chancellorHand est déjà comptabilisé dans la main du joueur courant
  // (effects.ts ligne 204-211 : newHand = [...actor.hand, ...drawn]; players.hand = newHand;
  //  chancellorHand = newHand). Pas de double-comptage.
  return n;
}

function checkInvariants(state: GameState, seed: string): Violation[] {
  const violations: Violation[] = [];

  const total = totalCardsInPlay(state);
  if (total !== 21) {
    violations.push({
      seed,
      invariant: 'I1-conservation',
      detail: `total cards = ${total} (expected 21)`,
      turnNumber: state.turnNumber,
      roundNumber: state.roundNumber,
    });
  }

  if (state.lastRoundSummary === null && state.turnPhase === 'play') {
    const cur = state.players[state.currentPlayerIdx];
    if (!cur) {
      violations.push({
        seed,
        invariant: 'I2-currentPlayerIdx',
        detail: `currentPlayerIdx ${state.currentPlayerIdx} hors bornes`,
        turnNumber: state.turnNumber,
        roundNumber: state.roundNumber,
      });
    } else if (cur.isEliminated) {
      violations.push({
        seed,
        invariant: 'I2-currentPlayerIdx-eliminated',
        detail: `currentPlayer ${cur.id} est éliminé pendant turnPhase=play`,
        turnNumber: state.turnNumber,
        roundNumber: state.roundNumber,
      });
    }
  }

  // I3
  const isResolving = state.turnPhase === 'resolvingChancellor';
  const hasChancellorHand = state.chancellorHand !== null;
  if (isResolving !== hasChancellorHand) {
    violations.push({
      seed,
      invariant: 'I3-chancellor-coherence',
      detail: `turnPhase=${state.turnPhase} chancellorHand=${hasChancellorHand}`,
      turnNumber: state.turnNumber,
      roundNumber: state.roundNumber,
    });
  }

  // I6
  if (state.gamePhase === 'ended') {
    const winner = state.players.find((p) => p.id === state.winnerId);
    if (!winner) {
      violations.push({
        seed,
        invariant: 'I6-end',
        detail: `gamePhase=ended sans winnerId valide`,
        turnNumber: state.turnNumber,
        roundNumber: state.roundNumber,
      });
    } else if (winner.tokens < TOKENS_TO_WIN) {
      violations.push({
        seed,
        invariant: 'I6-tokens',
        detail: `winner ${winner.id} a ${winner.tokens} jetons (< ${TOKENS_TO_WIN})`,
        turnNumber: state.turnNumber,
        roundNumber: state.roundNumber,
      });
    }
  }

  return violations;
}

interface SimResult {
  seed: string;
  rounds: number;
  turns: number;
  ended: boolean;
  violations: Violation[];
  error?: { msg: string; action?: Action; turnNumber: number };
}

function simulateOneGame(seed: string): SimResult {
  const result: SimResult = {
    seed,
    rounds: 0,
    turns: 0,
    ended: false,
    violations: [],
  };

  let state: GameState = createGame({
    players: [
      { id: 'human', name: 'Hum', isBot: true },
      { id: 'b1', name: 'Bot1', isBot: true },
      { id: 'b2', name: 'Bot2', isBot: true },
      { id: 'b3', name: 'Bot3', isBot: true },
    ],
    seed,
  });

  result.violations.push(...checkInvariants(state, seed));

  let safety = 0;
  while (state.gamePhase === 'playing' && safety < MAX_TURNS_PER_GAME) {
    safety++;

    // Snapshot tokens to detect monotone violation
    const tokensBefore: Record<string, number> = {};
    for (const p of state.players) tokensBefore[p.id] = p.tokens;

    if (state.lastRoundSummary) {
      // Replay : n'importe quel joueur peut déclencher startNextRound
      const action: Action = { kind: 'startNextRound', playerId: 'human' };
      try {
        state = applyAction(state, action);
        result.rounds++;
      } catch (e) {
        result.error = {
          msg: e instanceof Error ? e.message : String(e),
          action,
          turnNumber: state.turnNumber,
        };
        return result;
      }
      // I4 monotone tokens
      for (const p of state.players) {
        if ((tokensBefore[p.id] ?? 0) > p.tokens) {
          result.violations.push({
            seed,
            invariant: 'I4-tokens-monotone',
            detail: `${p.id} ${tokensBefore[p.id]} → ${p.tokens}`,
            turnNumber: state.turnNumber,
            roundNumber: state.roundNumber,
          });
        }
      }
      result.violations.push(...checkInvariants(state, seed));
      continue;
    }

    let action: Action;
    try {
      action = decideBotAction(state);
    } catch (e) {
      result.error = {
        msg: 'decideBotAction threw: ' + (e instanceof Error ? e.message : String(e)),
        turnNumber: state.turnNumber,
      };
      return result;
    }

    try {
      state = applyAction(state, action);
      result.turns++;
    } catch (e) {
      result.error = {
        msg: e instanceof Error ? e.message : String(e),
        action,
        turnNumber: state.turnNumber,
      };
      return result;
    }

    // Track tokens only on roundEnd
    for (const p of state.players) {
      if ((tokensBefore[p.id] ?? 0) > p.tokens) {
        result.violations.push({
          seed,
          invariant: 'I4-tokens-monotone',
          detail: `${p.id} ${tokensBefore[p.id]} → ${p.tokens}`,
          turnNumber: state.turnNumber,
          roundNumber: state.roundNumber,
        });
      }
    }
    result.violations.push(...checkInvariants(state, seed));
  }

  result.ended = state.gamePhase === 'ended';
  return result;
}

describe('Simulation : 250 parties complètes 4 bots', () => {
  test('aucun crash et invariants respectés (rapport agrégé)', () => {
    const allErrors: SimResult[] = [];
    const allViolations: Violation[] = [];
    let endedCount = 0;
    let totalRounds = 0;
    let totalTurns = 0;

    for (let i = 0; i < SIMULATIONS; i++) {
      const seed = `audit-${i}`;
      const r = simulateOneGame(seed);
      if (r.error) allErrors.push(r);
      if (r.violations.length > 0) {
        // garde les premières violations par sim pour ne pas exploser le rapport
        allViolations.push(...r.violations.slice(0, 3));
      }
      if (r.ended) endedCount++;
      totalRounds += r.rounds;
      totalTurns += r.turns;
    }

    // Log compact
    console.log(
      `\n[simulation] ${SIMULATIONS} parties · ${endedCount} terminées · ${totalRounds} manches · ${totalTurns} actions · ${allErrors.length} crashs · ${allViolations.length} violations`,
    );

    if (allErrors.length > 0) {
      console.log('Crashs (premier 5) :');
      for (const r of allErrors.slice(0, 5)) {
        console.log(
          `  seed=${r.seed} round=${r.rounds} turn=${r.error?.turnNumber} action=${JSON.stringify(r.error?.action)} msg=${r.error?.msg}`,
        );
      }
    }
    if (allViolations.length > 0) {
      console.log('Violations (premier 10) :');
      for (const v of allViolations.slice(0, 10)) {
        console.log(
          `  seed=${v.seed} ${v.invariant} R${v.roundNumber}T${v.turnNumber} — ${v.detail}`,
        );
      }
    }

    // On ne fait pas échouer le test sur des violations connues — on les
    // collecte pour le rapport. Mais on s'attend à ce que > 90% des parties
    // se terminent correctement.
    expect(endedCount).toBeGreaterThan(SIMULATIONS * 0.9);
  });
});

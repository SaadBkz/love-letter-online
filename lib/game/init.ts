import type { CardKind, GameState, Player, PlayerId } from './types';
import { TOKENS_TO_WIN } from './types';
import { createRng, shuffle } from './random';
import { buildDeck } from './deck';

export interface CreateGameOptions {
  players: Array<{ id: PlayerId; name: string; isBot: boolean }>;
  seed?: string;
}

export function createGame(opts: CreateGameOptions): GameState {
  if (opts.players.length < 2 || opts.players.length > 6) {
    throw new Error('Love Letter supports 2 to 6 players');
  }
  const seed =
    opts.seed ??
    `game-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  const players: Player[] = opts.players.map((p) => ({
    id: p.id,
    name: p.name,
    isBot: p.isBot,
    hand: [],
    discard: [],
    isEliminated: false,
    isProtected: false,
    tokens: 0,
    hasPlayedSpy: false,
  }));
  const base: GameState = {
    seed,
    players,
    currentPlayerIdx: 0,
    deck: [],
    removedCard: null,
    publicRemoved: [],
    roundNumber: 0,
    turnNumber: 0,
    turnPhase: 'play',
    gamePhase: 'setup',
    winnerId: null,
    lastRoundSummary: null,
    chancellorHand: null,
    log: [],
  };
  return startNewRound(base);
}

/**
 * Initialise une nouvelle manche : mélange déterministe, distribution, choix du premier joueur.
 * Auto-draw pour le premier joueur de la manche.
 */
export function startNewRound(state: GameState): GameState {
  const nextRoundNumber = state.roundNumber + 1;
  const roundSeed = `${state.seed}-r${nextRoundNumber}`;
  const rng = createRng(roundSeed);
  const shuffled = shuffle(buildDeck(), rng);

  let idx = 0;
  const removedCard = shuffled[idx++]!;
  const publicRemoved: CardKind[] = [];
  if (state.players.length === 2) {
    publicRemoved.push(shuffled[idx++]!, shuffled[idx++]!, shuffled[idx++]!);
  }

  const players: Player[] = state.players.map((p) => ({
    ...p,
    hand: [shuffled[idx++]!],
    discard: [],
    isEliminated: false,
    isProtected: false,
    hasPlayedSpy: false,
  }));

  const deck = shuffled.slice(idx);

  let currentPlayerIdx = 0;
  if (state.lastRoundSummary && state.lastRoundSummary.winners.length > 0) {
    const winnerId = state.lastRoundSummary.winners[0]!;
    const winnerIdx = players.findIndex((p) => p.id === winnerId);
    if (winnerIdx >= 0) currentPlayerIdx = winnerIdx;
  }

  let next: GameState = {
    ...state,
    players,
    currentPlayerIdx,
    deck,
    removedCard,
    publicRemoved,
    roundNumber: nextRoundNumber,
    turnNumber: 1,
    turnPhase: 'play',
    gamePhase: 'playing',
    chancellorHand: null,
    log: [
      ...state.log,
      {
        round: nextRoundNumber,
        turn: 0,
        actorId: null,
        text: `Début de la manche ${nextRoundNumber}.`,
        kind: 'info',
      },
    ],
  };

  next = autoDrawForCurrentPlayer(next);
  return next;
}

/**
 * Pioche automatiquement 1 carte pour le joueur courant au début de son tour.
 * Si la pioche est vide : la manche se termine ailleurs (checkEndOfRound).
 */
export function autoDrawForCurrentPlayer(state: GameState): GameState {
  if (state.deck.length === 0) return state;
  const top = state.deck[0]!;
  const rest = state.deck.slice(1);
  const players = state.players.map((p, i) =>
    i === state.currentPlayerIdx ? { ...p, hand: [...p.hand, top] } : p,
  );
  return { ...state, deck: rest, players };
}

/**
 * Avance au prochain joueur non éliminé, retire la protection Servante du prochain joueur,
 * et pioche automatiquement.
 */
export function advanceTurn(state: GameState): GameState {
  const n = state.players.length;
  let idx = state.currentPlayerIdx;
  for (let k = 0; k < n; k++) {
    idx = (idx + 1) % n;
    if (!state.players[idx]!.isEliminated) break;
  }
  const nextPlayer = state.players[idx]!;
  const players = state.players.map((p) =>
    p.id === nextPlayer.id ? { ...p, isProtected: false } : p,
  );
  const next: GameState = {
    ...state,
    players,
    currentPlayerIdx: idx,
    turnNumber: state.turnNumber + 1,
    turnPhase: 'play',
    chancellorHand: null,
  };
  return autoDrawForCurrentPlayer(next);
}

export function tokensNeededToWin(state: GameState): number {
  return TOKENS_TO_WIN[state.players.length] ?? 3;
}

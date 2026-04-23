import type { GameState, Player, PlayerId } from './types';

export function currentPlayer(state: GameState): Player {
  const p = state.players[state.currentPlayerIdx];
  if (!p) throw new Error(`No current player at idx ${state.currentPlayerIdx}`);
  return p;
}

export function playerById(state: GameState, id: PlayerId): Player {
  const p = state.players.find((x) => x.id === id);
  if (!p) throw new Error(`Player ${id} not found`);
  return p;
}

export function playerIdx(state: GameState, id: PlayerId): number {
  const i = state.players.findIndex((x) => x.id === id);
  if (i < 0) throw new Error(`Player ${id} not found`);
  return i;
}

export function alivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.isEliminated);
}

/** Liste les joueurs (hors self) qui peuvent être ciblés par une carte adverse (pas éliminés, pas protégés). */
export function validOpponentTargets(state: GameState, actorId: PlayerId): Player[] {
  return state.players.filter((p) => !p.isEliminated && !p.isProtected && p.id !== actorId);
}

/** Tous les joueurs valides, y compris soi-même (utile pour Prince). */
export function validAnyTargets(state: GameState, actorId: PlayerId, canTargetSelf: boolean): Player[] {
  return state.players.filter((p) => {
    if (p.isEliminated) return false;
    if (p.isProtected && p.id !== actorId) return false; // la Servante ne protège pas contre soi-même
    if (p.id === actorId && !canTargetSelf) return false;
    return true;
  });
}

export function updatePlayer(
  state: GameState,
  playerId: PlayerId,
  patch: Partial<Player>,
): GameState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, ...patch } : p)),
  };
}

export function pushLog(
  state: GameState,
  entry: { actorId: PlayerId | null; text: string; kind: import('./types').LogEntryKind },
): GameState {
  return {
    ...state,
    log: [
      ...state.log,
      { round: state.roundNumber, turn: state.turnNumber, ...entry },
    ],
  };
}

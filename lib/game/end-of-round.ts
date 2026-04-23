import type { CardKind, GameState, Player, PlayerId, RoundEndSummary } from './types';
import { CARD_VALUE } from './types';
import { alivePlayers } from './utils';

/**
 * Vérifie si la manche doit se terminer.
 * Retourne un nouveau state si terminée, sinon null.
 */
export function checkEndOfRound(state: GameState): GameState | null {
  const alive = alivePlayers(state);
  if (alive.length <= 1) {
    return endRound(state, 'lastSurvivor');
  }
  // Fin de manche si la pioche est vide ET le joueur courant a déjà joué (son tour est terminé).
  // checkEndOfRound est appelée APRÈS chaque action, donc si deck est vide ici, la manche se termine.
  if (state.deck.length === 0) {
    return endRound(state, 'deckEmpty');
  }
  return null;
}

export function endRound(state: GameState, reason: 'lastSurvivor' | 'deckEmpty'): GameState {
  const alive = alivePlayers(state);
  let winners: PlayerId[] = [];
  const finalHands: Record<PlayerId, CardKind | null> = {};
  for (const p of state.players) {
    finalHands[p.id] = p.isEliminated ? null : (p.hand[0] ?? null);
  }

  if (reason === 'lastSurvivor') {
    winners = alive.map((p) => p.id);
  } else {
    // deckEmpty : plus haute valeur en main parmi les vivants
    const maxVal = Math.max(...alive.map((p) => CARD_VALUE[p.hand[0]!]));
    let top = alive.filter((p) => CARD_VALUE[p.hand[0]!] === maxVal);
    if (top.length > 1) {
      // Tie-break : somme des cartes défaussées
      const sum = (p: Player) => p.discard.reduce((s, c) => s + CARD_VALUE[c], 0);
      const maxSum = Math.max(...top.map(sum));
      top = top.filter((p) => sum(p) === maxSum);
    }
    winners = top.map((p) => p.id);
  }

  // Bonus Espionne : exactement UN joueur encore en lice a joué/défaussé au moins une Espionne.
  const spyPlayers = alive.filter((p) => p.hasPlayedSpy);
  const spyBonusTo = spyPlayers.length === 1 ? spyPlayers[0]!.id : null;

  // Attribution des jetons
  const players = state.players.map((p) => {
    let tokens = p.tokens;
    if (winners.includes(p.id)) tokens += 1;
    if (spyBonusTo === p.id) tokens += 1;
    return { ...p, tokens };
  });

  const summary: RoundEndSummary = { reason, winners, spyBonusTo, finalHands };

  // Vérifie fin de partie
  const needed = state.players.length === 2 ? 7 : state.players.length === 3 ? 5 : state.players.length === 4 ? 4 : 3;
  const gameWinner = players.find((p) => p.tokens >= needed);

  const logEntries: GameState['log'] = [];
  const winnerNames = winners
    .map((id) => players.find((p) => p.id === id)?.name ?? id)
    .join(', ');
  logEntries.push({
    round: state.roundNumber,
    turn: state.turnNumber,
    actorId: null,
    text:
      reason === 'lastSurvivor'
        ? `${winnerNames} remporte la manche (dernier·e survivant·e).`
        : `Pioche vide. ${winnerNames} remporte la manche à la plus haute carte.`,
    kind: 'win',
  });
  if (spyBonusTo) {
    const name = players.find((p) => p.id === spyBonusTo)?.name ?? spyBonusTo;
    logEntries.push({
      round: state.roundNumber,
      turn: state.turnNumber,
      actorId: spyBonusTo,
      text: `${name} gagne un jeton bonus pour avoir joué l'Espionne.`,
      kind: 'bonus',
    });
  }
  if (gameWinner) {
    logEntries.push({
      round: state.roundNumber,
      turn: state.turnNumber,
      actorId: gameWinner.id,
      text: `${gameWinner.name} remporte la partie !`,
      kind: 'win',
    });
  }

  return {
    ...state,
    players,
    turnPhase: 'play',
    chancellorHand: null,
    lastRoundSummary: summary,
    gamePhase: gameWinner ? 'ended' : 'playing',
    winnerId: gameWinner?.id ?? null,
    log: [...state.log, ...logEntries],
  };
}

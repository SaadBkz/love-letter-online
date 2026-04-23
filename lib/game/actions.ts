import type { Action, CardKind, GameState } from './types';
import { CARD_NAME_FR, CARD_REQUIRES_TARGET } from './types';
import { advanceTurn, startNewRound } from './init';
import { applyCardEffect } from './effects';
import { checkEndOfRound } from './end-of-round';
import { validateAction } from './validation';
import { currentPlayer, playerById, pushLog } from './utils';

/**
 * Applique une action sur le state. Retourne un nouveau state.
 * Jette une erreur si l'action est invalide.
 */
export function applyAction(state: GameState, action: Action): GameState {
  const v = validateAction(state, action);
  if (!v.ok) {
    throw new Error(`Action invalide: ${v.reason}`);
  }

  switch (action.kind) {
    case 'playCard':
      return playCard(state, action);
    case 'resolveChancellor':
      return resolveChancellor(state, action);
    case 'startNextRound':
      return startNewRound(state);
  }
}

function playCard(
  state: GameState,
  action: Extract<Action, { kind: 'playCard' }>,
): GameState {
  const actor = currentPlayer(state);
  const card = action.card;

  // 1. Retirer la carte de la main, ajouter à la défausse
  const handAfter = [...actor.hand];
  const idx = handAfter.indexOf(card);
  handAfter.splice(idx, 1);

  let next: GameState = {
    ...state,
    players: state.players.map((p) =>
      p.id === actor.id
        ? {
            ...p,
            hand: handAfter,
            discard: [...p.discard, card],
            hasPlayedSpy: card === 'Spy' ? true : p.hasPlayedSpy,
          }
        : p,
    ),
  };

  // Log générique de jeu (sauf cartes qui logguent via l'effet)
  if (card !== 'Priest' && card !== 'Baron' && card !== 'Guard' && card !== 'Prince' && card !== 'King' && card !== 'Chancellor' && card !== 'Princess') {
    next = pushLog(next, {
      actorId: actor.id,
      text: `${actor.name} défausse ${CARD_NAME_FR[card]}.`,
      kind: 'play',
    });
  } else if (card === 'Guard' || card === 'Priest' || card === 'Baron' || card === 'Prince' || card === 'King') {
    // Log du jeu de la carte (avant le résultat détaillé de l'effet)
    if (action.target) {
      const tgt = playerById(next, action.target);
      next = pushLog(next, {
        actorId: actor.id,
        text: `${actor.name} joue ${CARD_NAME_FR[card]} sur ${tgt.name}.`,
        kind: 'play',
      });
    } else {
      next = pushLog(next, {
        actorId: actor.id,
        text: `${actor.name} joue ${CARD_NAME_FR[card]} (aucune cible valide).`,
        kind: 'play',
      });
    }
  }

  // 2. Appliquer l'effet (sauf si cible requise et pas de cible valide — Servante/éliminés)
  const hasTargetRequired = CARD_REQUIRES_TARGET[card];
  const effectSkipped = hasTargetRequired && !action.target;

  if (!effectSkipped) {
    next = applyCardEffect(next, card, {
      actorId: actor.id,
      target: action.target,
      guardGuess: action.guardGuess,
    });
  }

  // 3. Pour Chancelière, on attend l'action resolveChancellor — ne pas avancer
  if (next.turnPhase === 'resolvingChancellor') {
    return next;
  }

  // 4. Vérifier fin de manche
  const ended = checkEndOfRound(next);
  if (ended) return ended;

  // 5. Avancer au prochain joueur
  return advanceTurn(next);
}

function resolveChancellor(
  state: GameState,
  action: Extract<Action, { kind: 'resolveChancellor' }>,
): GameState {
  const actor = currentPlayer(state);
  const keep: CardKind = action.keep;
  const bottom: CardKind[] = (() => {
    const hand = state.chancellorHand!;
    if (hand.length <= 1) return [];
    if (hand.length === 2) {
      const other = hand.find((c) => c !== keep) ?? hand[0]!;
      return [other];
    }
    return action.bottom;
  })();

  // Met la/les carte(s) au bas de la pioche : deck + ...bottom (dans l'ordre du joueur)
  const newDeck = [...state.deck, ...bottom];

  let next: GameState = {
    ...state,
    deck: newDeck,
    chancellorHand: null,
    turnPhase: 'play',
    players: state.players.map((p) =>
      p.id === actor.id ? { ...p, hand: [keep] } : p,
    ),
  };
  next = pushLog(next, {
    actorId: actor.id,
    text: `${actor.name} garde 1 carte et replace ${bottom.length} sous la pioche.`,
    kind: 'play',
  });

  // Fin de manche ?
  const ended = checkEndOfRound(next);
  if (ended) return ended;

  return advanceTurn(next);
}

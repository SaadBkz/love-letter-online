import type { CardKind, GameState, PlayerId } from './types';
import { CARD_ARTICLE_FR, CARD_NAME_FR, CARD_VALUE } from './types';
import { playerById, pushLog, updatePlayer } from './utils';

export interface EffectContext {
  actorId: PlayerId;
  target?: PlayerId;
  guardGuess?: CardKind;
}

/**
 * Applique l'effet d'une carte déjà retirée de la main et ajoutée à la défausse.
 * NE gère pas : la suppression de la carte de la main, l'ajout à la défausse, la fin de manche, l'advance.
 * Pour Chancelière : met le state en turnPhase='resolvingChancellor', NE fait PAS avancer le tour.
 */
export function applyCardEffect(
  state: GameState,
  card: CardKind,
  ctx: EffectContext,
): GameState {
  switch (card) {
    case 'Spy':
      return applySpy(state, ctx);
    case 'Guard':
      return applyGuard(state, ctx);
    case 'Priest':
      return applyPriest(state, ctx);
    case 'Baron':
      return applyBaron(state, ctx);
    case 'Handmaid':
      return applyHandmaid(state, ctx);
    case 'Prince':
      return applyPrince(state, ctx);
    case 'Chancellor':
      return applyChancellor(state, ctx);
    case 'King':
      return applyKing(state, ctx);
    case 'Countess':
      return applyCountess(state, ctx);
    case 'Princess':
      return applyPrincess(state, ctx);
  }
}

function applySpy(state: GameState, ctx: EffectContext): GameState {
  return updatePlayer(state, ctx.actorId, { hasPlayedSpy: true });
}

function applyGuard(state: GameState, ctx: EffectContext): GameState {
  if (!ctx.target || !ctx.guardGuess) {
    // cible protégée / absente : carte défaussée sans effet, déjà loggé en amont
    return state;
  }
  if (ctx.guardGuess === 'Guard') {
    // règle : on ne peut pas deviner Garde. Ne devrait pas arriver si validation en amont.
    return state;
  }
  const actor = playerById(state, ctx.actorId);
  const target = playerById(state, ctx.target);
  const targetCard = target.hand[0];
  const correct = targetCard === ctx.guardGuess;
  const article = CARD_ARTICLE_FR[ctx.guardGuess];
  const nameFr = CARD_NAME_FR[ctx.guardGuess];
  let next = pushLog(state, {
    actorId: ctx.actorId,
    text: `${actor.name} devine ${article}${nameFr} chez ${target.name} : ${correct ? 'touché' : 'raté'}.`,
    kind: correct ? 'elim' : 'info',
    reveal: {
      type: 'guardGuess',
      actorId: ctx.actorId,
      targetId: target.id,
      guess: ctx.guardGuess,
      correct,
    },
  });
  if (correct) {
    next = eliminatePlayer(next, target.id);
  }
  return next;
}

function applyPriest(state: GameState, ctx: EffectContext): GameState {
  if (!ctx.target) return state;
  const actor = playerById(state, ctx.actorId);
  const target = playerById(state, ctx.target);
  const card = target.hand[0];
  if (!card) return state;
  return pushLog(state, {
    actorId: ctx.actorId,
    text: `${actor.name} regarde la main de ${target.name} : ${card}.`,
    kind: 'reveal',
    reveal: { type: 'priestPeek', actorId: ctx.actorId, targetId: target.id, card },
  });
}

function applyBaron(state: GameState, ctx: EffectContext): GameState {
  if (!ctx.target) return state;
  const actor = playerById(state, ctx.actorId);
  const target = playerById(state, ctx.target);
  const a = actor.hand[0];
  const t = target.hand[0];
  if (!a || !t) return state;
  const av = CARD_VALUE[a];
  const tv = CARD_VALUE[t];
  const loserId = av > tv ? target.id : tv > av ? actor.id : null;
  let next = pushLog(state, {
    actorId: ctx.actorId,
    text: `${actor.name} compare sa main avec ${target.name} : ${a} vs ${t}.`,
    kind: 'reveal',
    reveal: {
      type: 'baronCompare',
      actorId: ctx.actorId,
      targetId: target.id,
      actorCard: a,
      targetCard: t,
      loserId,
    },
  });
  if (av > tv) {
    next = eliminatePlayer(next, target.id);
  } else if (tv > av) {
    next = eliminatePlayer(next, actor.id);
  } else {
    next = pushLog(next, {
      actorId: null,
      text: `Égalité : aucun·e éliminé·e.`,
      kind: 'info',
    });
  }
  return next;
}

function applyHandmaid(state: GameState, ctx: EffectContext): GameState {
  const actor = playerById(state, ctx.actorId);
  const next = updatePlayer(state, ctx.actorId, { isProtected: true });
  return pushLog(next, {
    actorId: ctx.actorId,
    text: `${actor.name} se protège avec la Servante jusqu'au prochain tour.`,
    kind: 'protect',
  });
}

function applyPrince(state: GameState, ctx: EffectContext): GameState {
  if (!ctx.target) return state;
  const target = playerById(state, ctx.target);
  const actor = playerById(state, ctx.actorId);
  const discarded = target.hand[0];
  if (!discarded) return state;

  // Princesse défaussée via Prince = élimination
  let next = updatePlayer(state, target.id, {
    hand: [],
    discard: [...target.discard, discarded],
    hasPlayedSpy: discarded === 'Spy' ? true : target.hasPlayedSpy,
  });
  next = pushLog(next, {
    actorId: ctx.actorId,
    text: `${actor.name} force ${target.name} à défausser : ${discarded}.`,
    kind: 'reveal',
    reveal: { type: 'princeForce', actorId: ctx.actorId, targetId: target.id, card: discarded },
  });
  if (discarded === 'Princess') {
    next = eliminatePlayer(next, target.id);
    return next;
  }
  // Pioche une nouvelle carte pour la cible (ou prend la removedCard si pioche vide)
  if (next.deck.length > 0) {
    const top = next.deck[0]!;
    const rest = next.deck.slice(1);
    next = {
      ...next,
      deck: rest,
      players: next.players.map((p) =>
        p.id === target.id ? { ...p, hand: [top] } : p,
      ),
    };
  } else if (next.removedCard) {
    const taken = next.removedCard;
    next = {
      ...next,
      removedCard: null,
      players: next.players.map((p) =>
        p.id === target.id ? { ...p, hand: [taken] } : p,
      ),
    };
    next = pushLog(next, {
      actorId: null,
      text: `${target.name} prend la carte mise de côté (pioche vide).`,
      kind: 'info',
    });
  }
  return next;
}

function applyChancellor(state: GameState, ctx: EffectContext): GameState {
  // Pioche jusqu'à 2 cartes supplémentaires, met le state en "resolvingChancellor"
  const actor = playerById(state, ctx.actorId);
  const drawn: CardKind[] = [];
  let deck = state.deck;
  while (drawn.length < 2 && deck.length > 0) {
    drawn.push(deck[0]!);
    deck = deck.slice(1);
  }
  const newHand = [...actor.hand, ...drawn];
  let next: GameState = {
    ...state,
    deck,
    players: state.players.map((p) =>
      p.id === actor.id ? { ...p, hand: newHand } : p,
    ),
    chancellorHand: newHand,
    turnPhase: 'resolvingChancellor',
  };
  next = pushLog(next, {
    actorId: ctx.actorId,
    text: `${actor.name} joue la Chancelière (+${drawn.length} carte${drawn.length > 1 ? 's' : ''}).`,
    kind: 'play',
  });
  return next;
}

function applyKing(state: GameState, ctx: EffectContext): GameState {
  if (!ctx.target) return state;
  const actor = playerById(state, ctx.actorId);
  const target = playerById(state, ctx.target);
  const a = actor.hand[0];
  const t = target.hand[0];
  if (!a || !t) return state;
  const next = {
    ...state,
    players: state.players.map((p) => {
      if (p.id === actor.id) return { ...p, hand: [t] };
      if (p.id === target.id) return { ...p, hand: [a] };
      return p;
    }),
  };
  return pushLog(next, {
    actorId: ctx.actorId,
    text: `${actor.name} échange sa main avec ${target.name}.`,
    kind: 'play',
    reveal: { type: 'kingSwap', actorId: ctx.actorId, targetId: target.id },
  });
}

function applyCountess(state: GameState, ctx: EffectContext): GameState {
  const actor = playerById(state, ctx.actorId);
  return pushLog(state, {
    actorId: ctx.actorId,
    text: `${actor.name} défausse la Comtesse.`,
    kind: 'play',
  });
}

function applyPrincess(state: GameState, ctx: EffectContext): GameState {
  const actor = playerById(state, ctx.actorId);
  let next = pushLog(state, {
    actorId: ctx.actorId,
    text: `${actor.name} défausse la Princesse et est éliminé·e.`,
    kind: 'elim',
    reveal: { type: 'princessSuicide', actorId: ctx.actorId },
  });
  next = eliminatePlayer(next, actor.id);
  return next;
}

/** Élimine un joueur et défausse sa main restante. */
export function eliminatePlayer(state: GameState, playerId: PlayerId): GameState {
  const p = state.players.find((x) => x.id === playerId);
  if (!p || p.isEliminated) return state;
  const extraDiscard = p.hand.filter((c) => c !== undefined);
  const hasSpyInHand = extraDiscard.some((c) => c === 'Spy');
  return {
    ...state,
    players: state.players.map((x) =>
      x.id === playerId
        ? {
            ...x,
            isEliminated: true,
            hand: [],
            discard: [...x.discard, ...extraDiscard],
            hasPlayedSpy: hasSpyInHand ? true : x.hasPlayedSpy,
          }
        : x,
    ),
  };
}

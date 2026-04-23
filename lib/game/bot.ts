import type { Action, CardKind, GameState, PlayerId } from './types';
import { CARD_VALUE, CARD_CAN_TARGET_SELF, CARD_REQUIRES_TARGET, CARD_COUNT } from './types';
import { createRng, pick, type Rng } from './random';
import { currentPlayer, validAnyTargets, validOpponentTargets } from './utils';
import { playableCards } from './validation';

/**
 * Décide de l'action d'un bot à partir du state courant.
 * Le bot courant doit être `state.players[state.currentPlayerIdx]`.
 *
 * Stratégie (v1) :
 * 1. Si la Comtesse est forcée par la règle → défausser la Comtesse.
 * 2. Sinon, choisir la carte de plus basse valeur sauf Princesse (jamais) et Espionne (évitée si possible).
 * 3. Cible : parmi les adversaires valides, préférer le joueur avec la plus grosse défausse (proche fin
 *    de manche). En l'absence, choisir aléatoirement.
 * 4. Garde : devine pondéré par probabilité (cartes non encore vues).
 * 5. Chancelière : garde la plus haute carte, remet les autres dans un ordre arbitraire.
 */
export function decideBotAction(state: GameState): Action {
  const bot = currentPlayer(state);

  if (state.turnPhase === 'resolvingChancellor') {
    return decideChancellor(state);
  }

  const rng = createRng(`${state.seed}-bot-${state.roundNumber}-${state.turnNumber}-${bot.id}`);
  const playable = playableCards(state);

  // Sélection de la carte à jouer
  const card = chooseCardToPlay(bot.hand, playable, rng);

  // Cible éventuelle
  const needsTarget = CARD_REQUIRES_TARGET[card];
  let target: PlayerId | undefined;
  let guardGuess: CardKind | undefined;
  if (needsTarget) {
    const canSelf = CARD_CAN_TARGET_SELF[card];
    const opponents = validOpponentTargets(state, bot.id);
    const anyTargets = validAnyTargets(state, bot.id, canSelf);
    if (opponents.length > 0) {
      target = pickBestTarget(state, opponents, rng);
    } else if (canSelf && anyTargets.some((p) => p.id === bot.id)) {
      target = bot.id; // Prince sur soi-même forcé
    } else {
      // aucune cible valide → on joue sans cible, la carte est défaussée sans effet
      target = undefined;
    }
  }

  if (card === 'Guard' && target) {
    guardGuess = pickGuardGuess(state, target, rng);
  }

  return { kind: 'playCard', playerId: bot.id, card, target, guardGuess };
}

function chooseCardToPlay(hand: CardKind[], playable: CardKind[], rng: Rng): CardKind {
  // Comtesse forcée : playable exclut déjà King/Prince si Comtesse en main.
  // Si la seule option est la Comtesse (main = [Countess, X] avec X=King/Prince), jouer Comtesse.
  const hasCountess = hand.includes('Countess');
  const hasKingOrPrince = hand.includes('King') || hand.includes('Prince');
  if (hasCountess && hasKingOrPrince) {
    return 'Countess';
  }

  // Filtrer les cartes jouables, exclure Princess (jamais volontaire)
  const candidates = playable.filter((c) => c !== 'Princess');
  if (candidates.length === 0) {
    // Ne reste que Princess → la jouer (auto-élimination, défaite assurée)
    return 'Princess';
  }

  // Si l'on peut éviter l'Espionne et que l'on en a encore une au moins, garder la plus utile.
  const nonSpy = candidates.filter((c) => c !== 'Spy');
  const pool = nonSpy.length > 0 ? nonSpy : candidates;

  // Jouer la plus basse valeur du pool
  const sorted = [...pool].sort((a, b) => CARD_VALUE[a] - CARD_VALUE[b]);
  // Un peu de variance : 80% la plus basse, 20% une autre aléatoire du pool
  if (pool.length > 1 && rng() < 0.2) {
    return pick(pool, rng);
  }
  return sorted[0]!;
}

function pickBestTarget(
  state: GameState,
  targets: ReturnType<typeof validOpponentTargets>,
  rng: Rng,
): PlayerId {
  // Préférer le joueur avec la plus grosse main connue (par défausse : plus ils ont défaussé
  // de cartes, plus leur nombre connu de cartes restantes est faible — moins d'intérêt).
  // Pragmatique : on préfère le joueur avec le MOINS de cartes défaussées (plus de mystère à briser).
  const sorted = [...targets].sort((a, b) => a.discard.length - b.discard.length);
  if (rng() < 0.3) return pick(targets, rng).id;
  return sorted[0]!.id;
}

function pickGuardGuess(state: GameState, targetId: PlayerId, rng: Rng): CardKind {
  // Compte les cartes encore "possibles" pour la cible : toutes les cartes non défaussées (publiquement)
  // et non dans notre main. Exclure Guard.
  const seen: Record<string, number> = {};
  for (const p of state.players) {
    for (const c of p.discard) seen[c] = (seen[c] ?? 0) + 1;
  }
  const bot = state.players.find((p) => p.id === state.players[state.currentPlayerIdx]!.id)!;
  for (const c of bot.hand) seen[c] = (seen[c] ?? 0) + 1;
  for (const c of state.publicRemoved) seen[c] = (seen[c] ?? 0) + 1;

  // Probabilités restantes par kind (hors Guard)
  const candidates: Array<{ kind: CardKind; weight: number }> = [];
  for (const [kindStr, total] of Object.entries(CARD_COUNT) as [CardKind, number][]) {
    if (kindStr === 'Guard') continue;
    const remaining = total - (seen[kindStr] ?? 0);
    if (remaining > 0) candidates.push({ kind: kindStr, weight: remaining });
  }
  if (candidates.length === 0) {
    // Par sécurité, devine Priest
    return 'Priest';
  }
  // Tire aléatoirement pondéré
  const totalWeight = candidates.reduce((s, c) => s + c.weight, 0);
  let r = rng() * totalWeight;
  for (const c of candidates) {
    r -= c.weight;
    if (r <= 0) return c.kind;
  }
  return candidates[candidates.length - 1]!.kind;
}

function decideChancellor(state: GameState): Action {
  const bot = currentPlayer(state);
  const hand = state.chancellorHand!;
  if (hand.length <= 1) {
    return { kind: 'resolveChancellor', playerId: bot.id, keep: hand[0] ?? 'Guard', bottom: [] };
  }
  // Garde la plus haute carte non-Princess si possible (Princess élimine si forcée)
  const sorted = [...hand].sort((a, b) => CARD_VALUE[b] - CARD_VALUE[a]);
  // Préférer Princess à garder seulement si pas forcée d'être défaussée plus tard → compromis : garder
  // la plus haute SAUF si c'est Princess et qu'il y a une alternative.
  let keep = sorted[0]!;
  if (keep === 'Princess' && sorted.length > 1) {
    keep = sorted[1]!;
  }
  const bottom = hand.filter((c, i, arr) => {
    // retirer une occurrence de keep
    if (c === keep && arr.slice(0, i).filter((x) => x === keep).length === 0) return false;
    return true;
  });
  return { kind: 'resolveChancellor', playerId: bot.id, keep, bottom };
}

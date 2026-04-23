import type { Action, CardKind, GameState } from './types';
import { CARD_CAN_TARGET_SELF, CARD_REQUIRES_TARGET } from './types';
import { currentPlayer, validAnyTargets, validOpponentTargets } from './utils';

export type ValidationResult = { ok: true } | { ok: false; reason: string };

export function validateAction(state: GameState, action: Action): ValidationResult {
  if (state.gamePhase === 'ended') {
    return { ok: false, reason: 'La partie est terminée.' };
  }
  const actor = currentPlayer(state);
  if (action.playerId !== actor.id) {
    return { ok: false, reason: `Ce n'est pas le tour de ${action.playerId}.` };
  }
  if (actor.isEliminated) {
    return { ok: false, reason: 'Joueur éliminé ne peut pas agir.' };
  }

  if (action.kind === 'startNextRound') {
    if (state.gamePhase !== 'playing' || !state.lastRoundSummary) {
      return { ok: false, reason: 'Pas de manche à démarrer.' };
    }
    return { ok: true };
  }

  if (action.kind === 'resolveChancellor') {
    if (state.turnPhase !== 'resolvingChancellor' || !state.chancellorHand) {
      return { ok: false, reason: 'Aucune Chancelière en attente.' };
    }
    const hand = [...state.chancellorHand];
    const selected = [action.keep, ...action.bottom];
    for (const c of selected) {
      const idx = hand.indexOf(c);
      if (idx < 0) {
        return { ok: false, reason: `Carte ${c} absente de la main temporaire.` };
      }
      hand.splice(idx, 1);
    }
    if (hand.length !== 0) {
      return { ok: false, reason: 'Sélection incomplète pour la Chancelière.' };
    }
    return { ok: true };
  }

  // action.kind === 'playCard'
  if (state.turnPhase !== 'play') {
    return { ok: false, reason: 'Tu dois finir de résoudre la Chancelière.' };
  }
  if (!actor.hand.includes(action.card)) {
    return { ok: false, reason: `La carte ${action.card} n'est pas dans ta main.` };
  }

  // Règle Comtesse : si Comtesse + (Roi ou Prince) → doit défausser Comtesse
  if (actor.hand.includes('Countess') && (action.card === 'King' || action.card === 'Prince')) {
    return {
      ok: false,
      reason: 'Tu dois défausser la Comtesse (tu as Comtesse + Roi/Prince).',
    };
  }

  // Cartes à cible
  if (CARD_REQUIRES_TARGET[action.card]) {
    const canSelf = CARD_CAN_TARGET_SELF[action.card];
    const anyTargets = validAnyTargets(state, actor.id, canSelf);
    const opponentTargets = validOpponentTargets(state, actor.id);
    const allValid = canSelf ? anyTargets : opponentTargets;

    if (action.target) {
      const tgt = state.players.find((p) => p.id === action.target);
      if (!tgt) return { ok: false, reason: `Cible inconnue ${action.target}.` };
      if (tgt.isEliminated) return { ok: false, reason: 'Cible éliminée.' };
      if (tgt.id === actor.id && !canSelf) {
        return { ok: false, reason: 'Tu ne peux pas te cibler toi-même.' };
      }
      // Servante : la cible protégée ne peut être ciblée SAUF si elle est elle-même l'actor (Prince)
      if (tgt.isProtected && tgt.id !== actor.id) {
        // Si tous les autres sont protégés/éliminés, on autorise à cibler un protégé
        // mais comme la règle dit "si toutes les cibles valides sont protégées la carte est défaussée sans effet",
        // on permet dans ce cas-là de jouer sans cible.
        if (opponentTargets.length > 0) {
          return { ok: false, reason: 'Cette cible est protégée.' };
        }
      }
    } else {
      // Pas de cible : autorisé uniquement si AUCUNE cible valide
      if (allValid.length > 0) {
        // Cas spécial Prince : tu peux toujours te cibler toi-même, donc au moins 1 cible valide
        return { ok: false, reason: `La carte ${action.card} requiert une cible.` };
      }
    }
  }

  // Guard guess
  if (action.card === 'Guard') {
    if (action.target) {
      if (!action.guardGuess) {
        return { ok: false, reason: 'Indique une valeur à deviner avec le Garde.' };
      }
      if (action.guardGuess === 'Guard') {
        return { ok: false, reason: 'Impossible de deviner Garde avec le Garde.' };
      }
    }
  }

  return { ok: true };
}

/** Renvoie les cartes de la main que le joueur est autorisé à jouer. */
export function playableCards(state: GameState): CardKind[] {
  const actor = currentPlayer(state);
  const hasCountess = actor.hand.includes('Countess');
  return actor.hand.filter((c) => {
    if (hasCountess && (c === 'King' || c === 'Prince')) return false;
    return true;
  });
}

import type { CardKind, GameState, Player, PlayerId } from './types';

/**
 * Renvoie une copie du state filtrée pour le joueur donné : les cartes en main
 * des autres joueurs sont masquées. Conserve la défausse (publique), les jetons,
 * le statut éliminé/protégé, etc.
 *
 * Utilisé par le serveur avant de diffuser le state à chaque client en multijoueur.
 */
export function filterStateForPlayer(state: GameState, viewerId: PlayerId): GameState {
  return {
    ...state,
    players: state.players.map((p): Player => {
      if (p.id === viewerId) return p;
      return {
        ...p,
        // On masque la main : on garde juste la taille, avec un marqueur neutre.
        hand: p.hand.map(() => 'Guard' as CardKind),
      };
    }),
    // removedCard face-down reste inconnue
    removedCard: state.removedCard ? ('Guard' as CardKind) : null,
    // chancellorHand (privé au joueur courant)
    chancellorHand:
      state.chancellorHand && state.players[state.currentPlayerIdx]?.id === viewerId
        ? state.chancellorHand
        : state.chancellorHand
          ? state.chancellorHand.map(() => 'Guard' as CardKind)
          : null,
    // Filtre les entrées de log privées (Prêtre)
    log: state.log.filter((e) => {
      if (e.reveal?.type === 'priestPeek') return e.reveal.actorId === viewerId;
      return true;
    }),
  };
}


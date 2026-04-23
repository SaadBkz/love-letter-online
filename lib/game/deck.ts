import type { CardKind } from './types';
import { CARD_COUNT } from './types';

/** Construit le deck complet (21 cartes) non mélangé. */
export function buildDeck(): CardKind[] {
  const deck: CardKind[] = [];
  for (const [kind, count] of Object.entries(CARD_COUNT) as [CardKind, number][]) {
    for (let i = 0; i < count; i++) deck.push(kind);
  }
  return deck;
}

import { describe, expect, test } from 'vitest';
import { buildDeck } from '@/lib/game/deck';
import { CARD_COUNT, CARD_VALUE, type CardKind } from '@/lib/game/types';

describe('buildDeck', () => {
  test('21 cartes au total', () => {
    expect(buildDeck()).toHaveLength(21);
  });

  test('distribution exacte', () => {
    const deck = buildDeck();
    for (const [kind, count] of Object.entries(CARD_COUNT) as [CardKind, number][]) {
      expect(deck.filter((c) => c === kind).length).toBe(count);
    }
  });

  test('valeurs conformes au rulebook', () => {
    expect(CARD_VALUE.Spy).toBe(0);
    expect(CARD_VALUE.Guard).toBe(1);
    expect(CARD_VALUE.Priest).toBe(2);
    expect(CARD_VALUE.Baron).toBe(3);
    expect(CARD_VALUE.Handmaid).toBe(4);
    expect(CARD_VALUE.Prince).toBe(5);
    expect(CARD_VALUE.Chancellor).toBe(6);
    expect(CARD_VALUE.King).toBe(7);
    expect(CARD_VALUE.Countess).toBe(8);
    expect(CARD_VALUE.Princess).toBe(9);
  });
});

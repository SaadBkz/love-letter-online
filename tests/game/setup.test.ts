import { describe, expect, test } from 'vitest';
import { createGame } from '@/lib/game';

describe('createGame', () => {
  test('2 joueurs : 3 cartes retirées face visible + 1 face cachée', () => {
    const state = createGame({
      players: [
        { id: 'a', name: 'A', isBot: false },
        { id: 'b', name: 'B', isBot: true },
      ],
      seed: 'seed-2p',
    });
    expect(state.publicRemoved).toHaveLength(3);
    expect(state.removedCard).not.toBeNull();
    // 21 - 1 removed face-down - 3 face-up - 2 dans les mains - 1 pioché auto = 14 dans la pioche
    expect(state.deck).toHaveLength(14);
    // Le joueur courant a 2 cartes (auto-draw), l'autre 1
    expect(state.players[0]!.hand).toHaveLength(2);
    expect(state.players[1]!.hand).toHaveLength(1);
  });

  test('3 joueurs : aucune carte face visible', () => {
    const state = createGame({
      players: [
        { id: 'a', name: 'A', isBot: false },
        { id: 'b', name: 'B', isBot: true },
        { id: 'c', name: 'C', isBot: true },
      ],
      seed: 'seed-3p',
    });
    expect(state.publicRemoved).toHaveLength(0);
    expect(state.removedCard).not.toBeNull();
    // 21 - 1 - 3 - 1 = 16 dans la pioche
    expect(state.deck).toHaveLength(16);
  });

  test('4 joueurs : mêmes règles que 3', () => {
    const state = createGame({
      players: Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, isBot: i > 0 })),
      seed: 'seed-4p',
    });
    expect(state.publicRemoved).toHaveLength(0);
    // 21 - 1 - 4 - 1 = 15 dans la pioche
    expect(state.deck).toHaveLength(15);
    expect(state.players[0]!.hand).toHaveLength(2);
  });

  test('rejette < 2 et > 6 joueurs', () => {
    expect(() =>
      createGame({ players: [{ id: 'a', name: 'A', isBot: false }] }),
    ).toThrow();
    expect(() =>
      createGame({
        players: Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, isBot: false })),
      }),
    ).toThrow();
  });

  test('déterministe avec même seed', () => {
    const opts = {
      players: [
        { id: 'a', name: 'A', isBot: false },
        { id: 'b', name: 'B', isBot: true },
        { id: 'c', name: 'C', isBot: true },
      ],
      seed: 'repro-seed',
    };
    const s1 = createGame(opts);
    const s2 = createGame(opts);
    expect(s1.deck).toEqual(s2.deck);
    expect(s1.removedCard).toBe(s2.removedCard);
    expect(s1.players.map((p) => p.hand)).toEqual(s2.players.map((p) => p.hand));
  });
});

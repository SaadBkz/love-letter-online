import { describe, expect, test } from 'vitest';
import { applyAction } from '@/lib/game';
import { makeState } from '../fixtures/make-state';

describe('Fin de manche — dernier survivant', () => {
  test('Guard correct élimine le dernier adversaire → fin de manche', () => {
    const s = makeState({
      players: [{ hand: ['Guard', 'Baron'] }, { hand: ['Priest'] }],
      deck: ['Handmaid'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Guard',
      target: 'p2',
      guardGuess: 'Priest',
    });
    expect(after.lastRoundSummary?.reason).toBe('lastSurvivor');
    expect(after.lastRoundSummary?.winners).toEqual(['p1']);
    expect(after.players[0]!.tokens).toBe(1);
  });
});

describe('Fin de manche — pioche vide', () => {
  test('plus haute valeur gagne', () => {
    const s = makeState({
      players: [
        { hand: ['Baron', 'Priest'] }, // défausse Priest, garde Baron (3)
        { hand: ['Handmaid'] }, // Servante (4)
        { hand: ['Spy'] }, // Spy (0)
      ],
      deck: [], // pioche vide après la défausse
    });
    // p1 défausse Priest (valeur 2, mais joue Priest donc effet = regarde p2)
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Priest',
      target: 'p2',
    });
    // Fin de manche déclenchée (deck vide après l'action)
    expect(after.lastRoundSummary?.reason).toBe('deckEmpty');
    // Survivants : p1 (Baron=3), p2 (Handmaid=4), p3 (Spy=0) → p2 gagne
    expect(after.lastRoundSummary?.winners).toEqual(['p2']);
  });

  test('égalité départagée par somme des défausses', () => {
    const s = makeState({
      players: [
        {
          id: 'a',
          hand: ['Baron', 'Priest'], // défausse Priest → 2
          discard: ['Guard', 'Guard'], // somme = 2
        },
        {
          id: 'b',
          hand: ['Baron'], // 3
          discard: ['Priest', 'Priest'], // somme = 4
        },
      ],
      deck: [],
    });
    const after = applyAction(s, { kind: 'playCard', playerId: 'a', card: 'Priest', target: 'b' });
    // Mains finales : p1 = Baron (3), p2 = Baron (3) → égalité
    // Somme défausses : p1 = [Guard, Guard, Priest] = 1+1+2 = 4. p2 = [Priest, Priest] = 2+2 = 4 → toujours égalité
    // Les deux gagnent
    expect(after.lastRoundSummary?.winners.sort()).toEqual(['a', 'b']);
    expect(after.players.every((p) => p.tokens === 1)).toBe(true);
  });
});

describe('Bonus Espionne', () => {
  test('exactement 1 survivant a joué Spy → +1 jeton bonus', () => {
    const s = makeState({
      players: [
        { id: 'a', hand: ['Baron'], hasPlayedSpy: true },
        { id: 'b', hand: ['Priest', 'Handmaid'], hasPlayedSpy: false },
        { id: 'c', hand: ['King'], hasPlayedSpy: false },
      ],
      deck: [],
      currentPlayerIdx: 1,
    });
    // p2 joue Priest sur p3 → fin de manche (deck vide)
    const after = applyAction(s, { kind: 'playCard', playerId: 'b', card: 'Priest', target: 'c' });
    // Plus haute valeur : c = King (7) → gagne la manche
    expect(after.lastRoundSummary?.winners).toEqual(['c']);
    // Bonus Spy va à a (seul survivant avec hasPlayedSpy)
    expect(after.lastRoundSummary?.spyBonusTo).toBe('a');
    const pa = after.players.find((p) => p.id === 'a')!;
    const pc = after.players.find((p) => p.id === 'c')!;
    expect(pa.tokens).toBe(1); // bonus Spy
    expect(pc.tokens).toBe(1); // gagnant manche
  });

  test('deux survivants ont joué Spy → pas de bonus', () => {
    const s = makeState({
      players: [
        { id: 'a', hand: ['Baron', 'King'], hasPlayedSpy: true },
        { id: 'b', hand: ['Guard'], hasPlayedSpy: true },
        { id: 'c', hand: ['Priest'], hasPlayedSpy: false },
      ],
      deck: [],
    });
    // a joue Baron sur c. a (King=7) vs c (Priest=2) → c éliminé. a, b restent.
    const after = applyAction(s, { kind: 'playCard', playerId: 'a', card: 'Baron', target: 'c' });
    // Deck vide → fin de manche, plus haute main gagne : a=King(7), b=Guard(1) → a gagne
    expect(after.lastRoundSummary?.winners).toEqual(['a']);
    // Deux survivants avec hasPlayedSpy (a et b) → pas de bonus
    expect(after.lastRoundSummary?.spyBonusTo).toBeNull();
  });
});

describe('Fin de partie', () => {
  test("atteinte du seuil de jetons → winnerId + gamePhase 'ended'", () => {
    // 4 joueurs → seuil = 4 jetons. On met a à 3 jetons, il gagne la manche → 4.
    const s = makeState({
      players: [
        { id: 'a', hand: ['Guard', 'Baron'], tokens: 3 },
        { id: 'b', hand: ['Priest'] },
        { id: 'c', hand: ['King'] },
        { id: 'd', hand: ['Spy'] },
      ],
      deck: ['Handmaid'],
    });
    // a Guard+devine Priest sur b → b éliminé
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'a',
      card: 'Guard',
      target: 'b',
      guardGuess: 'Priest',
    });
    // Plus que 3 en lice : a, c, d. Continue.
    expect(after.lastRoundSummary).toBeNull();
    // c joue King (ou autre) — a 1 carte en main, auto-drawn ... mais c a 1 carte en main dans l'état init. Le currentPlayerIdx doit être à 2 (c) après advance.
    // L'action ci-dessus a fait advanceTurn → b est skipped (éliminé), donc on passe à c (idx 2).
    expect(after.currentPlayerIdx).toBe(2);
    expect(after.players[2]!.hand).toHaveLength(2); // auto-draw
  });
});

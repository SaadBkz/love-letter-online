import { describe, expect, test } from 'vitest';
import { applyAction } from '@/lib/game';
import { makeState } from '../fixtures/make-state';

describe('Spy', () => {
  test('marque hasPlayedSpy', () => {
    const s = makeState({
      players: [
        { hand: ['Spy', 'Guard'] },
        { hand: ['Priest'] },
      ],
      deck: ['Baron'],
    });
    const after = applyAction(s, { kind: 'playCard', playerId: 'p1', card: 'Spy' });
    expect(after.players[0]!.hasPlayedSpy).toBe(true);
    expect(after.players[0]!.discard).toContain('Spy');
    // Tour passé à p2 qui a pioché Baron
    expect(after.currentPlayerIdx).toBe(1);
    expect(after.players[1]!.hand).toContain('Baron');
  });
});

describe('Guard', () => {
  test('devine correctement → cible éliminée', () => {
    const s = makeState({
      players: [
        { hand: ['Guard', 'Baron'] },
        { hand: ['Priest'] },
      ],
      deck: ['Handmaid'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Guard',
      target: 'p2',
      guardGuess: 'Priest',
    });
    expect(after.players[1]!.isEliminated).toBe(true);
    // Manche se termine car 1 survivant
    expect(after.lastRoundSummary).not.toBeNull();
    expect(after.lastRoundSummary?.winners).toEqual(['p1']);
  });

  test('devine incorrectement → rien', () => {
    const s = makeState({
      players: [
        { hand: ['Guard', 'Baron'] },
        { hand: ['Priest'] },
      ],
      deck: ['Handmaid'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Guard',
      target: 'p2',
      guardGuess: 'King',
    });
    expect(after.players[1]!.isEliminated).toBe(false);
  });

  test('rejette deviner Garde', () => {
    const s = makeState({
      players: [{ hand: ['Guard', 'Baron'] }, { hand: ['Priest'] }],
      deck: ['Handmaid'],
    });
    expect(() =>
      applyAction(s, {
        kind: 'playCard',
        playerId: 'p1',
        card: 'Guard',
        target: 'p2',
        guardGuess: 'Guard',
      }),
    ).toThrow();
  });

  test('rejette si cible protégée (Servante)', () => {
    const s = makeState({
      players: [
        { hand: ['Guard', 'Baron'] },
        { hand: ['Priest'], isProtected: true },
        { hand: ['King'] },
      ],
      deck: ['Handmaid'],
    });
    expect(() =>
      applyAction(s, {
        kind: 'playCard',
        playerId: 'p1',
        card: 'Guard',
        target: 'p2',
        guardGuess: 'Priest',
      }),
    ).toThrow();
  });

  test("Garde sans cible si TOUS les adversaires sont protégés → défaussée sans effet", () => {
    const s = makeState({
      players: [
        { hand: ['Guard', 'Baron'] },
        { hand: ['Priest'], isProtected: true },
      ],
      deck: ['Handmaid'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Guard',
    });
    expect(after.players[1]!.isEliminated).toBe(false);
    expect(after.players[0]!.discard).toContain('Guard');
  });
});

describe('Priest', () => {
  test('révèle la main de la cible (via log)', () => {
    const s = makeState({
      players: [{ hand: ['Priest', 'Baron'] }, { hand: ['King'] }],
      deck: ['Handmaid'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Priest',
      target: 'p2',
    });
    const revealLog = after.log.find((e) => e.kind === 'reveal' && e.text.includes('King'));
    expect(revealLog).toBeDefined();
  });
});

describe('Baron', () => {
  test('actor plus haut → target éliminé', () => {
    const s = makeState({
      players: [{ hand: ['Baron', 'King'] }, { hand: ['Priest'] }],
      deck: ['Handmaid'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Baron',
      target: 'p2',
    });
    expect(after.players[1]!.isEliminated).toBe(true);
  });

  test('target plus haut → actor éliminé', () => {
    const s = makeState({
      players: [{ hand: ['Baron', 'Priest'] }, { hand: ['King'] }],
      deck: ['Handmaid'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Baron',
      target: 'p2',
    });
    expect(after.players[0]!.isEliminated).toBe(true);
  });

  test('égalité → rien', () => {
    const s = makeState({
      players: [{ hand: ['Baron', 'King'] }, { hand: ['King'] }, { hand: ['Priest'] }],
      deck: ['Handmaid', 'Baron'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Baron',
      target: 'p2',
    });
    expect(after.players[0]!.isEliminated).toBe(false);
    expect(after.players[1]!.isEliminated).toBe(false);
  });
});

describe('Handmaid', () => {
  test('pose la protection', () => {
    const s = makeState({
      players: [{ hand: ['Handmaid', 'Baron'] }, { hand: ['Priest'] }, { hand: ['King'] }],
      deck: ['Guard', 'Prince'],
    });
    const after = applyAction(s, { kind: 'playCard', playerId: 'p1', card: 'Handmaid' });
    expect(after.players[0]!.isProtected).toBe(true);
  });

  test('protection levée au début du propre tour suivant', () => {
    const s = makeState({
      players: [
        { hand: ['Handmaid', 'Baron'] },
        { hand: ['Guard', 'Priest'] },
        { hand: ['King'] },
      ],
      deck: ['Prince', 'Chancellor', 'Countess'],
      currentPlayerIdx: 0,
    });
    // p1 joue Handmaid
    let next = applyAction(s, { kind: 'playCard', playerId: 'p1', card: 'Handmaid' });
    expect(next.players[0]!.isProtected).toBe(true);
    expect(next.currentPlayerIdx).toBe(1);
    // p2 joue Guard sur p1 → devrait échouer (protégé)
    expect(() =>
      applyAction(next, {
        kind: 'playCard',
        playerId: 'p2',
        card: 'Guard',
        target: 'p1',
        guardGuess: 'Baron',
      }),
    ).toThrow();
    // p2 joue Priest (sans cibler p1)
    next = applyAction(next, {
      kind: 'playCard',
      playerId: 'p2',
      card: 'Priest',
      target: 'p3',
    });
    // p3 joue sa carte (auto-pioche Chancellor lors du pass)
    next = applyAction(next, {
      kind: 'playCard',
      playerId: 'p3',
      card: 'King',
      target: 'p2',
    });
    // Retour au tour de p1 → protection levée
    expect(next.currentPlayerIdx).toBe(0);
    expect(next.players[0]!.isProtected).toBe(false);
  });
});

describe('Prince', () => {
  test('force la cible à défausser + piocher', () => {
    const s = makeState({
      players: [{ hand: ['Prince', 'Baron'] }, { hand: ['Priest'] }],
      deck: ['King', 'Handmaid'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Prince',
      target: 'p2',
    });
    expect(after.players[1]!.discard).toContain('Priest');
    expect(after.players[1]!.hand[0]).toBe('King');
  });

  test('défausse forcée de Princesse → élimination', () => {
    const s = makeState({
      players: [
        { hand: ['Prince', 'Baron'] },
        { hand: ['Princess'] },
        { hand: ['Priest'] },
      ],
      deck: ['King', 'Handmaid'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Prince',
      target: 'p2',
    });
    expect(after.players[1]!.isEliminated).toBe(true);
    expect(after.players[1]!.discard).toContain('Princess');
  });

  test('sur pioche vide → cible prend la carte retirée face cachée', () => {
    const s = makeState({
      players: [{ hand: ['Prince', 'Baron'] }, { hand: ['Priest'] }, { hand: ['King'] }],
      deck: [],
      removedCard: 'Handmaid',
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Prince',
      target: 'p2',
    });
    // La cible défausse Priest, prend Handmaid (la carte mise de côté)
    expect(after.players[1]!.discard).toContain('Priest');
    expect(after.players[1]!.hand[0]).toBe('Handmaid');
    expect(after.removedCard).toBeNull();
  });

  test('Prince sur soi-même autorisé', () => {
    const s = makeState({
      players: [{ hand: ['Prince', 'Baron'] }, { hand: ['Priest'] }, { hand: ['King'] }],
      deck: ['Handmaid'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Prince',
      target: 'p1',
    });
    expect(after.players[0]!.discard).toEqual(['Prince', 'Baron']);
    expect(after.players[0]!.hand[0]).toBe('Handmaid');
  });
});

describe('King', () => {
  test('échange les mains (le tour avance, p2 auto-pioche)', () => {
    const s = makeState({
      players: [{ hand: ['King', 'Baron'] }, { hand: ['Priest'] }, { hand: ['Handmaid'] }],
      deck: ['Guard', 'Prince'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'King',
      target: 'p2',
    });
    // p1 a échangé Baron ↔ Priest, garde Priest. Tour passe à p2 qui pioche Guard.
    expect(after.players[0]!.hand).toEqual(['Priest']);
    expect(after.players[1]!.hand).toEqual(['Baron', 'Guard']);
    expect(after.currentPlayerIdx).toBe(1);
  });
});

describe('Countess', () => {
  test('défausse sans effet', () => {
    const s = makeState({
      players: [{ hand: ['Countess', 'Baron'] }, { hand: ['Priest'] }, { hand: ['Handmaid'] }],
      deck: ['Guard', 'Prince'],
    });
    const after = applyAction(s, {
      kind: 'playCard',
      playerId: 'p1',
      card: 'Countess',
    });
    expect(after.players[0]!.discard).toContain('Countess');
  });

  test('forcée : avec Comtesse + Roi, jouer Roi est interdit', () => {
    const s = makeState({
      players: [{ hand: ['Countess', 'King'] }, { hand: ['Priest'] }],
      deck: ['Handmaid'],
    });
    expect(() =>
      applyAction(s, {
        kind: 'playCard',
        playerId: 'p1',
        card: 'King',
        target: 'p2',
      }),
    ).toThrow(/Comtesse/);
  });

  test('forcée : avec Comtesse + Prince, jouer Prince est interdit', () => {
    const s = makeState({
      players: [{ hand: ['Countess', 'Prince'] }, { hand: ['Priest'] }],
      deck: ['Handmaid'],
    });
    expect(() =>
      applyAction(s, {
        kind: 'playCard',
        playerId: 'p1',
        card: 'Prince',
        target: 'p2',
      }),
    ).toThrow(/Comtesse/);
  });

  test("bluff autorisé : Comtesse seule (sans Roi/Prince) peut être défaussée sans contrainte", () => {
    const s = makeState({
      players: [{ hand: ['Countess', 'Baron'] }, { hand: ['Priest'] }, { hand: ['Handmaid'] }],
      deck: ['Guard', 'Prince'],
    });
    const after = applyAction(s, { kind: 'playCard', playerId: 'p1', card: 'Countess' });
    expect(after.players[0]!.discard).toContain('Countess');
  });
});

describe('Princess', () => {
  test("défausser la Princesse = auto-élimination", () => {
    const s = makeState({
      players: [{ hand: ['Princess', 'Baron'] }, { hand: ['Priest'] }, { hand: ['Handmaid'] }],
      deck: ['Guard', 'Prince'],
    });
    const after = applyAction(s, { kind: 'playCard', playerId: 'p1', card: 'Princess' });
    expect(after.players[0]!.isEliminated).toBe(true);
    expect(after.players[0]!.discard).toContain('Princess');
  });
});

describe('Chancellor', () => {
  test('pioche 2, état resolvingChancellor, puis resolve', () => {
    const s = makeState({
      players: [{ hand: ['Chancellor', 'Baron'] }, { hand: ['Priest'] }, { hand: ['Handmaid'] }],
      deck: ['Guard', 'King', 'Prince'],
    });
    const mid = applyAction(s, { kind: 'playCard', playerId: 'p1', card: 'Chancellor' });
    expect(mid.turnPhase).toBe('resolvingChancellor');
    expect(mid.chancellorHand).toHaveLength(3);
    // La pioche a perdu 2 cartes, reste 1
    expect(mid.deck).toHaveLength(1);

    // Resolve : garde Baron, met Guard puis King en bas
    const resolved = applyAction(mid, {
      kind: 'resolveChancellor',
      playerId: 'p1',
      keep: 'Baron',
      bottom: ['Guard', 'King'],
    });
    expect(resolved.players[0]!.hand).toEqual(['Baron']);
    // Après resolve : deck = [Prince, Guard, King] ; puis tour → p2 qui auto-pioche Prince.
    // Deck final = [Guard, King]. p2 a Priest + Prince.
    expect(resolved.deck).toEqual(['Guard', 'King']);
    expect(resolved.players[1]!.hand).toContain('Prince');
    expect(resolved.turnPhase).toBe('play');
    expect(resolved.currentPlayerIdx).toBe(1);
  });

  test('pioche vide : rien à piocher, résout avec sa main seule', () => {
    const s = makeState({
      players: [{ hand: ['Chancellor', 'Baron'] }, { hand: ['Priest'] }, { hand: ['Handmaid'] }],
      deck: [],
      removedCard: 'Spy',
    });
    // Attention : Chancellor joué → p1 discard Chancellor, applyChancellor draw 0, chancellorHand = [Baron] (1 carte)
    const mid = applyAction(s, { kind: 'playCard', playerId: 'p1', card: 'Chancellor' });
    expect(mid.chancellorHand).toHaveLength(1);
    const resolved = applyAction(mid, {
      kind: 'resolveChancellor',
      playerId: 'p1',
      keep: 'Baron',
      bottom: [],
    });
    expect(resolved.players[0]!.hand).toEqual(['Baron']);
    // Deck toujours vide → fin de manche déclenchée
    expect(resolved.lastRoundSummary).not.toBeNull();
  });
});

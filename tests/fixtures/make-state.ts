import type { CardKind, GameState, Player, PlayerId } from '@/lib/game/types';

export interface MakeStateOpts {
  players: Array<{ id?: PlayerId; name?: string; hand: CardKind[]; discard?: CardKind[]; isEliminated?: boolean; isProtected?: boolean; tokens?: number; hasPlayedSpy?: boolean }>;
  deck?: CardKind[];
  removedCard?: CardKind | null;
  publicRemoved?: CardKind[];
  currentPlayerIdx?: number;
  turnPhase?: GameState['turnPhase'];
  chancellorHand?: CardKind[] | null;
  roundNumber?: number;
  turnNumber?: number;
  gamePhase?: GameState['gamePhase'];
  lastRoundSummary?: GameState['lastRoundSummary'];
}

/**
 * Fabrique un GameState complètement contrôlé pour les tests.
 * Ne tire rien aléatoirement : tout est explicite.
 */
export function makeState(opts: MakeStateOpts): GameState {
  const players: Player[] = opts.players.map((p, i) => ({
    id: p.id ?? `p${i + 1}`,
    name: p.name ?? `Player${i + 1}`,
    hand: [...p.hand],
    discard: p.discard ? [...p.discard] : [],
    isEliminated: p.isEliminated ?? false,
    isProtected: p.isProtected ?? false,
    tokens: p.tokens ?? 0,
    hasPlayedSpy: p.hasPlayedSpy ?? false,
    isBot: false,
  }));
  return {
    seed: 'test-seed',
    players,
    currentPlayerIdx: opts.currentPlayerIdx ?? 0,
    deck: opts.deck ? [...opts.deck] : [],
    removedCard: opts.removedCard ?? null,
    publicRemoved: opts.publicRemoved ? [...opts.publicRemoved] : [],
    roundNumber: opts.roundNumber ?? 1,
    turnNumber: opts.turnNumber ?? 1,
    turnPhase: opts.turnPhase ?? 'play',
    gamePhase: opts.gamePhase ?? 'playing',
    winnerId: null,
    lastRoundSummary: opts.lastRoundSummary ?? null,
    chancellorHand: opts.chancellorHand ?? null,
    log: [],
  };
}

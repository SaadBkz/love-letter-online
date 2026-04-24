// Love Letter — types du moteur de jeu pur (Z-Man 2019)
// Source de vérité des règles : docs/rules.md

export type CardKind =
  | 'Spy'
  | 'Guard'
  | 'Priest'
  | 'Baron'
  | 'Handmaid'
  | 'Prince'
  | 'Chancellor'
  | 'King'
  | 'Countess'
  | 'Princess';

export const CARD_VALUE: Record<CardKind, number> = {
  Spy: 0,
  Guard: 1,
  Priest: 2,
  Baron: 3,
  Handmaid: 4,
  Prince: 5,
  Chancellor: 6,
  King: 7,
  Countess: 8,
  Princess: 9,
};

export const CARD_COUNT: Record<CardKind, number> = {
  Spy: 2,
  Guard: 6,
  Priest: 2,
  Baron: 2,
  Handmaid: 2,
  Prince: 2,
  Chancellor: 2,
  King: 1,
  Countess: 1,
  Princess: 1,
};

export const CARD_NAME_FR: Record<CardKind, string> = {
  Spy: 'Espionne',
  Guard: 'Garde',
  Priest: 'Prêtre',
  Baron: 'Baron',
  Handmaid: 'Servante',
  Prince: 'Prince',
  Chancellor: 'Chancelière',
  King: 'Roi',
  Countess: 'Comtesse',
  Princess: 'Princesse',
};

/** Cartes qui doivent cibler un adversaire (ou soi-même pour Prince). */
export const CARD_REQUIRES_TARGET: Record<CardKind, boolean> = {
  Spy: false,
  Guard: true,
  Priest: true,
  Baron: true,
  Handmaid: false,
  Prince: true, // peut se cibler soi-même
  Chancellor: false,
  King: true,
  Countess: false,
  Princess: false,
};

/** Cartes qui ne peuvent pas cibler soi-même (le Prince peut). */
export const CARD_CAN_TARGET_SELF: Record<CardKind, boolean> = {
  Spy: false,
  Guard: false,
  Priest: false,
  Baron: false,
  Handmaid: false,
  Prince: true,
  Chancellor: false,
  King: false,
  Countess: false,
  Princess: false,
};

export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  hand: CardKind[];
  discard: CardKind[];
  isEliminated: boolean;
  isProtected: boolean;
  tokens: number;
  isBot: boolean;
  /** Vrai si le joueur a joué ou défaussé au moins une Espionne dans la manche. */
  hasPlayedSpy: boolean;
}

export type RoundEndReason = 'lastSurvivor' | 'deckEmpty';

export interface RoundEndSummary {
  reason: RoundEndReason;
  winners: PlayerId[];
  spyBonusTo: PlayerId | null;
  finalHands: Record<PlayerId, CardKind | null>;
}

export type GamePhase = 'setup' | 'playing' | 'ended';
export type TurnPhase = 'draw' | 'play' | 'resolvingChancellor';

export type LogEntryKind = 'info' | 'play' | 'elim' | 'protect' | 'reveal' | 'win' | 'bonus';

export type RevealEvent =
  | { type: 'guardGuess'; actorId: PlayerId; targetId: PlayerId; guess: CardKind; correct: boolean }
  | { type: 'priestPeek'; actorId: PlayerId; targetId: PlayerId; card: CardKind }
  | {
      type: 'baronCompare';
      actorId: PlayerId;
      targetId: PlayerId;
      actorCard: CardKind;
      targetCard: CardKind;
      loserId: PlayerId | null;
    }
  | { type: 'princeForce'; actorId: PlayerId; targetId: PlayerId; card: CardKind }
  | { type: 'kingSwap'; actorId: PlayerId; targetId: PlayerId }
  | { type: 'princessSuicide'; actorId: PlayerId };

export interface LogEntry {
  round: number;
  turn: number;
  actorId: PlayerId | null;
  text: string;
  kind: LogEntryKind;
  /** Données structurées pour les overlays dramatiques (bulles BD, reveals). */
  reveal?: RevealEvent;
}

export interface GameState {
  seed: string;
  /** Joueurs dans l'ordre du tour. */
  players: Player[];
  currentPlayerIdx: number;
  /** Pioche centrale (face cachée), index 0 = prochaine à piocher. */
  deck: CardKind[];
  /** Carte retirée face cachée en début de manche (inconnue sauf via Prince sur pioche vide). */
  removedCard: CardKind | null;
  /** 3 cartes retirées face visible (2 joueurs uniquement). */
  publicRemoved: CardKind[];
  roundNumber: number;
  turnNumber: number;
  turnPhase: TurnPhase;
  gamePhase: GamePhase;
  /** Gagnant·e de la partie (atteint le seuil de jetons). */
  winnerId: PlayerId | null;
  /** Résumé de la dernière manche terminée, pour affichage. */
  lastRoundSummary: RoundEndSummary | null;
  /** Pour Chancelière : 3 cartes en main temporaire. */
  chancellorHand: CardKind[] | null;
  log: LogEntry[];
}

export type Action =
  | {
      kind: 'playCard';
      playerId: PlayerId;
      card: CardKind;
      target?: PlayerId;
      guardGuess?: CardKind;
    }
  | {
      kind: 'resolveChancellor';
      playerId: PlayerId;
      keep: CardKind;
      /** Cartes à replacer sous la pioche, dans l'ordre du joueur (0 à 2 cartes selon le nombre piochable). */
      bottom: CardKind[];
    }
  | { kind: 'startNextRound'; playerId: PlayerId };

/** Nombre de jetons requis pour gagner selon le nombre de joueurs. */
export const TOKENS_TO_WIN: Record<number, number> = {
  2: 7,
  3: 5,
  4: 4,
  5: 3,
  6: 3,
};

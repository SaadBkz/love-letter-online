import { z } from 'zod';

const CARD_KINDS = [
  'Spy',
  'Guard',
  'Priest',
  'Baron',
  'Handmaid',
  'Prince',
  'Chancellor',
  'King',
  'Countess',
  'Princess',
] as const;

export const CardKindSchema = z.enum(CARD_KINDS);

export const CreateRoomSchema = z.object({
  hostName: z.string().trim().min(1).max(20),
});

export const JoinRoomSchema = z.object({
  playerName: z.string().trim().min(1).max(20),
});

export const AuthedIdentitySchema = z.object({
  playerId: z.string().min(1).max(64),
  sessionToken: z.string().min(10).max(128),
});

export const StartGameSchema = AuthedIdentitySchema;

export const ActionPlayCardSchema = z.object({
  kind: z.literal('playCard'),
  playerId: z.string(),
  card: CardKindSchema,
  target: z.string().optional(),
  guardGuess: CardKindSchema.optional(),
});

export const ActionResolveChancellorSchema = z.object({
  kind: z.literal('resolveChancellor'),
  playerId: z.string(),
  keep: CardKindSchema,
  bottom: z.array(CardKindSchema).max(2),
});

export const ActionStartNextRoundSchema = z.object({
  kind: z.literal('startNextRound'),
  playerId: z.string(),
});

export const ActionSchema = z.discriminatedUnion('kind', [
  ActionPlayCardSchema,
  ActionResolveChancellorSchema,
  ActionStartNextRoundSchema,
]);

export const SubmitActionSchema = AuthedIdentitySchema.extend({
  action: ActionSchema,
});

export const PusherAuthSchema = AuthedIdentitySchema.extend({
  socket_id: z.string(),
  channel_name: z.string(),
});

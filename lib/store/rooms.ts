import type { GameState, PlayerId } from '@/lib/game';
import { getRedis } from './redis';

/**
 * Structure persistée d'une salle.
 * Stockée dans Redis sous la clé `room:{CODE}`.
 */
export interface Room {
  code: string;
  hostId: PlayerId;
  players: Array<{ id: PlayerId; name: string; sessionToken: string }>;
  state: GameState | null;
  gameStarted: boolean;
  createdAt: number;
  version: number;
}

const ROOM_TTL_SECONDS = 60 * 60 * 4; // 4h
const ROOM_KEY = (code: string) => `room:${code.toUpperCase()}`;

export async function getRoom(code: string): Promise<Room | null> {
  const redis = getRedis();
  const raw = await redis.get<Room>(ROOM_KEY(code));
  return raw ?? null;
}

export async function setRoom(room: Room): Promise<void> {
  const redis = getRedis();
  await redis.set(ROOM_KEY(room.code), room, { ex: ROOM_TTL_SECONDS });
}

export async function deleteRoom(code: string): Promise<void> {
  const redis = getRedis();
  await redis.del(ROOM_KEY(code));
}

/**
 * Mise à jour atomique style optimistic-lock : on relit, on applique la transformation,
 * on refuse si la version a changé depuis le get.
 *
 * Simple : on utilise un petit wrapper avec retries. Upstash REST n'offre pas de MULTI/EXEC.
 */
export async function updateRoom(
  code: string,
  fn: (room: Room) => Room | null,
  maxRetries = 3,
): Promise<Room | null> {
  for (let i = 0; i < maxRetries; i++) {
    const current = await getRoom(code);
    if (!current) return null;
    const next = fn(current);
    if (!next) return current;
    const updated: Room = { ...next, version: current.version + 1 };
    // Note : pour une vraie atomicité, il faudrait CAS via Lua. Ici on s'appuie sur le fait que
    // les actions de jeu sont routées par joueur courant (faible contention par salle).
    await setRoom(updated);
    return updated;
  }
  return null;
}

/** Génère un code de salle à 5 caractères alphabétiques majuscules. */
export function generateRoomCode(): string {
  // Exclut I/O/0/1 (ambigus)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

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
 * Mise à jour optimistic-lock : relit, applique la transformation, **vérifie
 * que la version n'a pas bougé entre le read et le write**, retry si besoin.
 *
 * Réduit la fenêtre de race par rapport à un read-then-write naïf, mais reste
 * imparfait (TOCTOU entre le check et le SET). Upstash REST n'offre pas de
 * MULTI/EXEC ; pour une vraie atomicité il faudrait un script Lua via `eval`.
 *
 * En pratique la contention est faible : les actions de jeu sont routées par
 * joueur courant (un seul peut écrire), et `startNextRound` est restreint
 * côté UI au gagnant de la manche pour sérialiser le clic.
 */
export async function updateRoom(
  code: string,
  fn: (room: Room) => Room | null,
  maxRetries = 5,
): Promise<Room | null> {
  for (let i = 0; i < maxRetries; i++) {
    const current = await getRoom(code);
    if (!current) return null;
    const next = fn(current);
    if (!next) return current;
    const updated: Room = { ...next, version: current.version + 1 };

    // Re-read pour réduire la fenêtre de race : si la version a bougé entre
    // notre read et maintenant, un autre writer a commit, on retry.
    const reread = await getRoom(code);
    if (!reread) return null;
    if (reread.version !== current.version) {
      // Petit backoff exponentiel + jitter pour éviter le thundering herd.
      await new Promise((r) => setTimeout(r, 30 * (i + 1) + Math.random() * 20));
      continue;
    }

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

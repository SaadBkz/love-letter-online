'use client';

import type { Action } from '@/lib/game';

export interface RoomIdentity {
  code: string;
  playerId: string;
  sessionToken: string;
}

const STORAGE_KEY = (code: string) => `saad-letter.room.${code.toUpperCase()}`;

export function saveIdentity(identity: RoomIdentity) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY(identity.code), JSON.stringify(identity));
}

export function loadIdentity(code: string): RoomIdentity | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoomIdentity;
  } catch {
    return null;
  }
}

export function clearIdentity(code: string) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY(code));
}

export async function createRoom(hostName: string): Promise<RoomIdentity> {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ hostName }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Création impossible');
  const data = (await res.json()) as { code: string; playerId: string; sessionToken: string };
  saveIdentity(data);
  return data;
}

export async function joinRoom(code: string, playerName: string): Promise<RoomIdentity> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(code)}/join`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ playerName }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Rejoint impossible');
  const data = (await res.json()) as { playerId: string; sessionToken: string };
  const identity = { code: code.toUpperCase(), ...data };
  saveIdentity(identity);
  return identity;
}

export async function startGame(identity: RoomIdentity): Promise<void> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(identity.code)}/start`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ playerId: identity.playerId, sessionToken: identity.sessionToken }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Démarrage impossible');
}

export async function submitAction(identity: RoomIdentity, action: Action): Promise<void> {
  const res = await fetch(`/api/rooms/${encodeURIComponent(identity.code)}/actions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      playerId: identity.playerId,
      sessionToken: identity.sessionToken,
      action,
    }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Action refusée');
}

export interface RoomView {
  code: string;
  hostId: string;
  gameStarted: boolean;
  players: Array<{ id: string; name: string }>;
  state: import('@/lib/game').GameState | null;
  version: number;
  /** PlayerIds qui ont cliqué "Je suis prêt" en fin de manche. */
  nextRoundReady: string[];
}

export async function markReadyForNextRound(identity: RoomIdentity): Promise<void> {
  const res = await fetch(
    `/api/rooms/${encodeURIComponent(identity.code)}/ready-next-round`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        playerId: identity.playerId,
        sessionToken: identity.sessionToken,
      }),
    },
  );
  if (!res.ok) throw new Error((await res.json()).error ?? 'Impossible');
}

export async function fetchRoom(identity: RoomIdentity): Promise<RoomView> {
  const res = await fetch(
    `/api/rooms/${encodeURIComponent(identity.code)}?playerId=${encodeURIComponent(identity.playerId)}&sessionToken=${encodeURIComponent(identity.sessionToken)}`,
  );
  if (!res.ok) throw new Error((await res.json()).error ?? 'Salle indisponible');
  const raw = (await res.json()) as Partial<RoomView> & {
    code: string;
    hostId: string;
    gameStarted: boolean;
    players: Array<{ id: string; name: string }>;
    state: RoomView['state'];
    version: number;
  };
  return { nextRoundReady: [], ...raw } as RoomView;
}

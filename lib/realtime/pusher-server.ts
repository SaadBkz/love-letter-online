import Pusher from 'pusher';

let instance: Pusher | null = null;

export function getPusher(): Pusher {
  if (instance) return instance;
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;
  if (!appId || !key || !secret || !cluster) {
    throw new Error(
      'Pusher non configuré. Set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER.',
    );
  }
  instance = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return instance;
}

export function isPusherConfigured(): boolean {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  );
}

export const CHANNEL = (code: string) => `private-room-${code.toUpperCase()}`;

export const EVENTS = {
  roomUpdated: 'room-updated',
  playerJoined: 'player-joined',
  playerLeft: 'player-left',
  gameStarted: 'game-started',
} as const;

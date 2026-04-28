'use client';

import PusherClient, { type Channel } from 'pusher-js';
import type { RoomIdentity } from '@/lib/online/client';

let instance: PusherClient | null = null;
let currentIdentity: RoomIdentity | null = null;

export type ConnectionState =
  | 'initialized'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'failed'
  | 'disconnected';

/**
 * Crée (ou retourne) un client Pusher configuré avec l'identité donnée.
 * L'authorizer inclut playerId + sessionToken comme params de l'endpoint d'auth.
 */
export function getPusherClient(identity: RoomIdentity): PusherClient {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) {
    throw new Error('Pusher client non configuré.');
  }
  if (
    instance &&
    currentIdentity &&
    currentIdentity.playerId === identity.playerId &&
    currentIdentity.sessionToken === identity.sessionToken
  ) {
    return instance;
  }
  if (instance) {
    instance.disconnect();
  }
  currentIdentity = identity;
  instance = new PusherClient(key, {
    cluster,
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        const qs = new URLSearchParams({
          playerId: identity.playerId,
          sessionToken: identity.sessionToken,
        }).toString();
        fetch(`/api/pusher/auth?${qs}`, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            socket_id: socketId,
            channel_name: channel.name,
          }).toString(),
        })
          .then((r) => {
            if (!r.ok) throw new Error('Auth Pusher refusée');
            return r.json();
          })
          .then((data) => callback(null, data))
          .catch((err) => callback(err, null));
      },
    }),
  });
  return instance;
}

export function subscribeRoom(identity: RoomIdentity): Channel {
  const client = getPusherClient(identity);
  return client.subscribe(`private-room-${identity.code}`);
}

/**
 * S'abonne aux changements d'état de connexion. Permet au consommateur de
 * re-fetch l'état autoritatif après une coupure (Pusher events private ne
 * sont pas bufferés, on rate les events pendant la déconnexion).
 *
 * @returns une fonction de désabonnement.
 */
export function bindConnectionState(
  identity: RoomIdentity,
  onChange: (state: ConnectionState, previousState: ConnectionState) => void,
): () => void {
  const client = getPusherClient(identity);
  const handler = (states: { current: ConnectionState; previous: ConnectionState }) => {
    onChange(states.current, states.previous);
  };
  client.connection.bind('state_change', handler);
  return () => client.connection.unbind('state_change', handler);
}

export function disposePusherClient() {
  if (instance) {
    instance.disconnect();
    instance = null;
    currentIdentity = null;
  }
}

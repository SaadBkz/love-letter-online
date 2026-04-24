import { NextResponse } from 'next/server';
import { getPusher, isPusherConfigured } from '@/lib/realtime/pusher-server';
import { getRoom } from '@/lib/store/rooms';
import { isRedisConfigured } from '@/lib/store/redis';

export const runtime = 'nodejs';

/**
 * Endpoint d'auth Pusher pour les channels privés.
 * Pusher envoie un form-urlencoded avec socket_id + channel_name.
 * On attend aussi playerId et sessionToken en query string (ajouté par le client).
 */
export async function POST(req: Request) {
  if (!isPusherConfigured() || !isRedisConfigured()) {
    return NextResponse.json({ error: 'Online désactivé' }, { status: 503 });
  }

  const form = await req.formData();
  const socketId = String(form.get('socket_id') ?? '');
  const channelName = String(form.get('channel_name') ?? '');

  const url = new URL(req.url);
  const playerId = url.searchParams.get('playerId') ?? '';
  const sessionToken = url.searchParams.get('sessionToken') ?? '';

  if (!socketId || !channelName.startsWith('private-room-')) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
  }
  const code = channelName.slice('private-room-'.length);
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 });
  const me = room.players.find((p) => p.id === playerId);
  if (!me || me.sessionToken !== sessionToken) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const auth = getPusher().authorizeChannel(socketId, channelName);
  return NextResponse.json(auth);
}

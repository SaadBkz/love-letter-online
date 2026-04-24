import { NextResponse } from 'next/server';
import { isRedisConfigured } from '@/lib/store/redis';
import { getPusher, CHANNEL, EVENTS, isPusherConfigured } from '@/lib/realtime/pusher-server';
import { updateRoom } from '@/lib/store/rooms';
import { generatePlayerId, generateSessionToken } from '@/lib/store/session';
import { JoinRoomSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request, context: { params: Promise<{ code: string }> }) {
  if (!isRedisConfigured()) {
    return NextResponse.json({ error: 'Online désactivé' }, { status: 503 });
  }
  const { code } = await context.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = JoinRoomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalide' }, { status: 400 });
  }
  const playerId = generatePlayerId();
  const sessionToken = generateSessionToken();

  const updated = await updateRoom(code, (room) => {
    if (room.gameStarted) return null;
    if (room.players.length >= 6) return null;
    if (room.players.some((p) => p.name.toLowerCase() === parsed.data.playerName.toLowerCase())) {
      return null;
    }
    return {
      ...room,
      players: [...room.players, { id: playerId, name: parsed.data.playerName, sessionToken }],
    };
  });
  if (!updated) {
    return NextResponse.json(
      { error: 'Impossible de rejoindre (partie commencée, salle pleine, ou pseudo pris)' },
      { status: 409 },
    );
  }

  if (isPusherConfigured()) {
    await getPusher().trigger(CHANNEL(code), EVENTS.playerJoined, {
      players: updated.players.map((p) => ({ id: p.id, name: p.name })),
    });
  }

  return NextResponse.json({ playerId, sessionToken });
}

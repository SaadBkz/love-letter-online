import { NextResponse } from 'next/server';
import { isRedisConfigured } from '@/lib/store/redis';
import { generateRoomCode, setRoom } from '@/lib/store/rooms';
import { generatePlayerId, generateSessionToken } from '@/lib/store/session';
import { CreateRoomSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (!isRedisConfigured()) {
    return NextResponse.json(
      { error: 'Le multijoueur en ligne n\'est pas encore activé sur ce serveur.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = CreateRoomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Requête invalide' }, { status: 400 });
  }

  const code = generateRoomCode();
  const hostId = generatePlayerId();
  const sessionToken = generateSessionToken();

  await setRoom({
    code,
    hostId,
    players: [{ id: hostId, name: parsed.data.hostName, sessionToken }],
    state: null,
    gameStarted: false,
    createdAt: Date.now(),
    version: 0,
  });

  return NextResponse.json({ code, playerId: hostId, sessionToken });
}

import { NextResponse } from 'next/server';
import { isRedisConfigured } from '@/lib/store/redis';
import { getPusher, CHANNEL, EVENTS, isPusherConfigured } from '@/lib/realtime/pusher-server';
import { updateRoom } from '@/lib/store/rooms';
import { StartGameSchema } from '@/lib/validation/schemas';
import { createGame } from '@/lib/game';
import { filterStateForPlayer } from '@/lib/game/views';

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
  const parsed = StartGameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Identifiants manquants' }, { status: 400 });
  }

  const updated = await updateRoom(code, (room) => {
    if (room.gameStarted) return null;
    if (room.hostId !== parsed.data.playerId) return null;
    const me = room.players.find((p) => p.id === parsed.data.playerId);
    if (!me || me.sessionToken !== parsed.data.sessionToken) return null;
    if (room.players.length < 2) return null;

    const state = createGame({
      players: room.players.map((p) => ({ id: p.id, name: p.name, isBot: false })),
      seed: `online-${code}-${Date.now()}`,
    });

    return { ...room, state, gameStarted: true };
  });
  if (!updated) {
    return NextResponse.json(
      { error: 'Démarrage impossible (hôte uniquement, min 2 joueurs, pas déjà commencé)' },
      { status: 409 },
    );
  }

  if (isPusherConfigured() && updated.state) {
    // Broadcast une vue globale "partie démarrée" ; chaque client récupère ensuite son state via GET.
    await getPusher().trigger(CHANNEL(code), EVENTS.gameStarted, {
      version: updated.version,
    });
    // Broadcast le state par-joueur via events séparés (namespaced par playerId)
    for (const p of updated.players) {
      const view = filterStateForPlayer(updated.state, p.id);
      await getPusher().trigger(CHANNEL(code), `${EVENTS.roomUpdated}-${p.id}`, {
        state: view,
        version: updated.version,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

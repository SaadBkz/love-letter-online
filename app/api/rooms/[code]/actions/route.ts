import { NextResponse } from 'next/server';
import { isRedisConfigured } from '@/lib/store/redis';
import {
  getPusher,
  CHANNEL,
  EVENTS,
  isPusherConfigured,
} from '@/lib/realtime/pusher-server';
import { updateRoom } from '@/lib/store/rooms';
import { SubmitActionSchema } from '@/lib/validation/schemas';
import { applyAction } from '@/lib/game';
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
  const parsed = SubmitActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  let applyError: string | null = null;

  const updated = await updateRoom(code, (room) => {
    if (!room.gameStarted || !room.state) return null;
    const me = room.players.find((p) => p.id === parsed.data.playerId);
    if (!me || me.sessionToken !== parsed.data.sessionToken) return null;
    if (parsed.data.action.playerId !== me.id) return null;

    try {
      const nextState = applyAction(room.state, parsed.data.action);
      // Reset la liste readiness à chaque action de jeu : si on entre en
      // fin de manche, c'est une liste fraîche ; si on en sort (startNextRound
      // direct depuis le solo, par ex.), on nettoie aussi.
      return { ...room, state: nextState, nextRoundReady: [] };
    } catch (e) {
      applyError = e instanceof Error ? e.message : 'Action refusée';
      return null;
    }
  });

  if (applyError) {
    return NextResponse.json({ error: applyError }, { status: 422 });
  }
  if (!updated) {
    return NextResponse.json({ error: 'État de salle incohérent' }, { status: 409 });
  }

  // B6 : chaque trigger a son propre try/catch pour qu'une trigger en échec
  // (rate limit Pusher, timeout) n'empêche pas les suivantes. Les triggers
  // partent en parallèle pour réduire la latence. Si un client rate son
  // event, le re-fetch côté client (handleAction error path + reconnect)
  // sert de filet.
  if (isPusherConfigured() && updated.state) {
    const pusher = getPusher();
    const broadcasts = updated.players.map(async (p) => {
      const view = filterStateForPlayer(updated.state!, p.id);
      try {
        await pusher.trigger(CHANNEL(code), `${EVENTS.roomUpdated}-${p.id}`, {
          state: view,
          version: updated.version,
          nextRoundReady: updated.nextRoundReady ?? [],
        });
      } catch (err) {
        console.error(`pusher trigger failed for player ${p.id}`, err);
      }
    });
    await Promise.allSettled(broadcasts);
  }

  return NextResponse.json({ ok: true, version: updated.version });
}

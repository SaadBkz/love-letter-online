import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isRedisConfigured } from '@/lib/store/redis';
import {
  getPusher,
  CHANNEL,
  EVENTS,
  isPusherConfigured,
} from '@/lib/realtime/pusher-server';
import { updateRoom } from '@/lib/store/rooms';
import { applyAction } from '@/lib/game';
import { filterStateForPlayer } from '@/lib/game/views';

export const runtime = 'nodejs';

const BodySchema = z.object({
  playerId: z.string().min(1),
  sessionToken: z.string().min(1),
});

/**
 * POST /api/rooms/[code]/ready-next-round
 *
 * Marque le joueur comme "prêt" pour la manche suivante. Si tous les joueurs
 * de la salle sont prêts, applique automatiquement `startNextRound` et reset
 * la liste. Idempotent : un même joueur peut appeler 2 fois sans erreur.
 */
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
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  let outcome: 'ready-added' | 'all-ready' | 'already-ready' | 'no-round-end' = 'no-round-end';

  const updated = await updateRoom(code, (room) => {
    if (!room.gameStarted || !room.state) return null;
    const me = room.players.find((p) => p.id === parsed.data.playerId);
    if (!me || me.sessionToken !== parsed.data.sessionToken) return null;
    if (!room.state.lastRoundSummary || room.state.gamePhase !== 'playing') {
      // Pas de manche à démarrer (déjà avancée, ou partie terminée).
      outcome = 'no-round-end';
      return null;
    }

    const ready = room.nextRoundReady ?? [];
    if (ready.includes(parsed.data.playerId)) {
      outcome = 'already-ready';
      return room;
    }
    const newReady = [...ready, parsed.data.playerId];

    // Tous prêts → on auto-avance
    if (newReady.length >= room.players.length) {
      try {
        const nextState = applyAction(room.state, {
          kind: 'startNextRound',
          playerId: parsed.data.playerId,
        });
        outcome = 'all-ready';
        return { ...room, state: nextState, nextRoundReady: [] };
      } catch {
        // applyAction a refusé (race rare) — on reset la liste pour ne pas
        // bloquer, le client refetch et ressaisit.
        outcome = 'all-ready';
        return { ...room, nextRoundReady: [] };
      }
    }

    outcome = 'ready-added';
    return { ...room, nextRoundReady: newReady };
  });

  if (!updated) {
    return NextResponse.json(
      { error: outcome === 'no-round-end' ? 'Pas de manche à démarrer.' : 'Salle incohérente.' },
      { status: outcome === 'no-round-end' ? 409 : 422 },
    );
  }

  // Broadcast à tous les joueurs avec le state filtré et la liste de readiness
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

  return NextResponse.json({
    ok: true,
    outcome,
    readyCount: updated.nextRoundReady?.length ?? 0,
    totalPlayers: updated.players.length,
    version: updated.version,
  });
}

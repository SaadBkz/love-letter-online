import { NextResponse } from 'next/server';
import { isRedisConfigured } from '@/lib/store/redis';
import { getRoom } from '@/lib/store/rooms';
import { filterStateForPlayer } from '@/lib/game/views';

export const runtime = 'nodejs';

/**
 * GET /api/rooms/[code]?playerId=X&sessionToken=Y
 * Retourne l'état de la salle pour le joueur demandeur (state filtré si partie en cours).
 */
export async function GET(req: Request, context: { params: Promise<{ code: string }> }) {
  if (!isRedisConfigured()) {
    return NextResponse.json({ error: 'Online désactivé' }, { status: 503 });
  }
  const { code } = await context.params;
  const url = new URL(req.url);
  const playerId = url.searchParams.get('playerId') ?? '';
  const token = url.searchParams.get('sessionToken') ?? '';
  if (!playerId || !token) {
    return NextResponse.json({ error: 'Identifiants manquants' }, { status: 401 });
  }
  const room = await getRoom(code);
  if (!room) return NextResponse.json({ error: 'Salle introuvable' }, { status: 404 });
  const p = room.players.find((x) => x.id === playerId);
  if (!p || p.sessionToken !== token) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  return NextResponse.json({
    code: room.code,
    hostId: room.hostId,
    gameStarted: room.gameStarted,
    players: room.players.map((x) => ({ id: x.id, name: x.name })),
    state: room.state ? filterStateForPlayer(room.state, playerId) : null,
    version: room.version,
  });
}

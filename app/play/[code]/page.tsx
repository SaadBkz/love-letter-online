'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Action, GameState } from '@/lib/game';
import {
  loadIdentity,
  fetchRoom,
  startGame,
  submitAction,
  clearIdentity,
  type RoomIdentity,
  type RoomView,
} from '@/lib/online/client';
import {
  subscribeRoom,
  disposePusherClient,
  bindConnectionState,
} from '@/lib/realtime/pusher-client';
import { GameTable } from '@/components/game/GameTable';
import { RoundEndModal } from '@/components/game/modals/RoundEndModal';
import { GameEndModal } from '@/components/game/modals/GameEndModal';
import { Button } from '@/components/ui/Button';

export default function OnlineRoomPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? '').toUpperCase();
  const router = useRouter();

  const [identity, setIdentity] = useState<RoomIdentity | null>(null);
  const [room, setRoom] = useState<RoomView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const versionRef = useRef(-1);

  useEffect(() => {
    if (!code) return;
    const saved = loadIdentity(code);
    if (!saved) {
      router.replace(`/play/online?code=${code}`);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIdentity(saved);
  }, [code, router]);

  /**
   * Re-fetch authoritatif. Compare la version avant de remplacer le state
   * local : protection contre la race entre fetch initial et events Pusher
   * arrivés en parallèle (B1), et utilisé aussi à chaque reconnexion Pusher
   * pour combler les events manqués pendant une coupure (B15).
   */
  const refetch = useCallback(
    async (id: RoomIdentity) => {
      try {
        const r = await fetchRoom(id);
        // Toujours appliquer si la version reçue est ≥ que celle connue.
        // Le strict `>` aurait raté un re-fetch après reconnexion où la
        // version Redis n'a pas bougé mais notre state local est stale.
        if (r.version >= versionRef.current) {
          versionRef.current = r.version;
          setRoom(r);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    },
    [],
  );

  // Polling initial pour récupérer l'état
  useEffect(() => {
    if (!identity) return;
    let alive = true;
    fetchRoom(identity)
      .then((r) => {
        if (!alive) return;
        // B1 : ne PAS écraser un state plus récent reçu via Pusher
        // pendant que le fetch initial était en vol.
        if (r.version >= versionRef.current) {
          versionRef.current = r.version;
          setRoom(r);
        }
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Erreur'));
    return () => {
      alive = false;
    };
  }, [identity]);

  // Abonnement Pusher + réconciliation à la reconnexion
  useEffect(() => {
    if (!identity) return;
    let channel: ReturnType<typeof subscribeRoom> | null = null;
    let unbindConn: (() => void) | null = null;
    try {
      channel = subscribeRoom(identity);
      // B15 : à chaque transition vers 'connected', re-fetch pour rattraper
      // les events potentiellement perdus pendant la déconnexion.
      // Ignore le tout premier 'connected' (le fetch initial s'en charge).
      let firstConnect = true;
      unbindConn = bindConnectionState(identity, (current) => {
        if (current !== 'connected') return;
        if (firstConnect) {
          firstConnect = false;
          return;
        }
        refetch(identity);
      });
    } catch {
      return; // Pusher non configuré : on reste en mode polling minimal
    }

    const onPlayerJoined = (data: { players: Array<{ id: string; name: string }> }) => {
      setRoom((prev) => (prev ? { ...prev, players: data.players } : prev));
    };
    const onGameStarted = () => {
      refetch(identity);
    };
    const onRoomUpdated = (data: { state: GameState; version: number }) => {
      if (data.version > versionRef.current) {
        versionRef.current = data.version;
        setRoom((prev) =>
          prev ? { ...prev, state: data.state, version: data.version, gameStarted: true } : prev,
        );
      }
    };

    channel.bind('player-joined', onPlayerJoined);
    channel.bind('game-started', onGameStarted);
    channel.bind(`room-updated-${identity.playerId}`, onRoomUpdated);

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (unbindConn) unbindConn();
    };
  }, [identity, refetch]);

  useEffect(() => {
    return () => {
      disposePusherClient();
    };
  }, []);

  if (error) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
        <Link href="/" className="text-sm opacity-70 hover:opacity-100">
          ← Retour
        </Link>
      </main>
    );
  }

  if (!identity || !room) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center p-6">
        <p className="text-sm opacity-70 italic">Connexion à la salle {code}…</p>
      </main>
    );
  }

  if (!room.gameStarted) {
    return (
      <WaitingRoom
        room={room}
        identity={identity}
        onLeave={() => {
          clearIdentity(code);
          router.replace('/');
        }}
      />
    );
  }

  if (!room.state) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center p-6">
        <p className="text-sm opacity-70 italic">Chargement de la partie…</p>
      </main>
    );
  }

  async function handleAction(action: Action) {
    if (!identity) return;
    try {
      await submitAction(identity, action);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action refusée');
      // B6/B15 : si l'API rejette parce que notre state local est stale
      // (event Pusher manqué, version désynchronisée), on re-fetch
      // l'état autoritatif. Le joueur récupère un state à jour, le toast
      // explique pourquoi son action a été refusée.
      refetch(identity);
    }
  }

  async function handleStartNextRound() {
    if (!identity) return;
    try {
      await submitAction(identity, {
        kind: 'startNextRound',
        playerId: identity.playerId,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
      refetch(identity);
    }
  }

  async function handleReplay() {
    if (!identity) return;
    clearIdentity(code);
    router.replace('/');
  }

  const showRoundEnd =
    room.state.lastRoundSummary !== null &&
    room.state.gamePhase === 'playing' &&
    room.state.winnerId === null;
  const showGameEnd = room.state.gamePhase === 'ended';

  return (
    <>
      <GameTable
        state={room.state}
        humanId={identity.playerId}
        onAction={handleAction}
        onStartNewRound={handleStartNextRound}
        onReplay={handleReplay}
      />
      <button
        onClick={() => {
          clearIdentity(code);
          router.replace('/');
        }}
        className="fixed top-3 left-3 z-30 text-xs opacity-60 hover:opacity-100 px-2 py-1 rounded bg-black/40"
        style={{ color: 'var(--color-parchment)' }}
      >
        ← Quitter
      </button>
      {showRoundEnd && room.state.lastRoundSummary && (
        <RoundEndModal
          open
          state={room.state}
          summary={room.state.lastRoundSummary}
          onNextRound={handleStartNextRound}
          currentUserId={identity.playerId}
        />
      )}
      {showGameEnd && <GameEndModal open state={room.state} onReplay={handleReplay} />}
    </>
  );
}

function WaitingRoom({
  room,
  identity,
  onLeave,
}: {
  room: RoomView;
  identity: RoomIdentity;
  onLeave: () => void;
}) {
  const [starting, setStarting] = useState(false);
  const isHost = room.hostId === identity.playerId;
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/play/online?code=${room.code}`
      : '';

  async function handleStart() {
    setStarting(true);
    try {
      await startGame(identity);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
      setStarting(false);
    }
  }

  async function shareLink() {
    if (typeof navigator === 'undefined') return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Saad Letter',
          text: `Rejoins ma partie ! Code ${room.code}`,
          url: shareUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Lien copié dans le presse-papier');
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-4 items-center">
        <div className="text-center">
          <div className="text-xs font-display uppercase tracking-widest opacity-70">
            Code de salle
          </div>
          <div
            className="font-mono text-4xl tracking-[0.4em] mt-1"
            style={{ color: 'var(--color-gold-bright)' }}
          >
            {room.code}
          </div>
        </div>

        <Button onClick={shareLink} variant="secondary" className="w-full">
          Partager le lien
        </Button>

        <div className="w-full">
          <div className="text-xs font-display uppercase tracking-wider opacity-80 mb-2">
            Joueurs ({room.players.length}/6)
          </div>
          <ul className="flex flex-col gap-1">
            {room.players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 rounded"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderLeft: `3px solid var(--color-gold)`,
                  color: 'var(--color-parchment)',
                }}
              >
                <span className="font-display">{p.name}</span>
                {p.id === room.hostId && (
                  <span className="text-[10px] opacity-60 italic">hôte</span>
                )}
                {p.id === identity.playerId && (
                  <span className="text-[10px] opacity-60">(toi)</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isHost ? (
          <Button
            onClick={handleStart}
            disabled={starting || room.players.length < 2}
            className="w-full"
          >
            {starting
              ? 'Démarrage…'
              : room.players.length < 2
                ? 'Attend 2 joueurs minimum'
                : 'Lancer la partie'}
          </Button>
        ) : (
          <p className="text-xs italic opacity-70 text-center">
            En attente de l&apos;hôte pour lancer la partie…
          </p>
        )}

        <button onClick={onLeave} className="text-xs opacity-50 hover:opacity-80">
          Quitter
        </button>
      </div>
    </main>
  );
}

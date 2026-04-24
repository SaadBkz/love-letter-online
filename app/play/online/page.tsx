'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { createRoom, joinRoom } from '@/lib/online/client';

export default function OnlineLobbyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setPending(true);
    try {
      const { code } = await createRoom(name.trim());
      router.push(`/play/${code}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
      setPending(false);
    }
  }

  async function handleJoin() {
    if (!name.trim() || !code.trim()) return;
    setPending(true);
    try {
      const cleanCode = code.trim().toUpperCase();
      await joinRoom(cleanCode, name.trim());
      router.push(`/play/${cleanCode}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur');
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-6 py-10">
      <div className="w-full max-w-sm flex flex-col gap-5">
        <div className="text-center">
          <h1
            className="font-display text-2xl font-bold mb-1"
            style={{ color: 'var(--color-gold-bright)' }}
          >
            Partie en ligne
          </h1>
          <p className="text-sm italic opacity-80" style={{ color: 'var(--color-parchment)' }}>
            Crée une salle ou rejoins celle d&apos;un·e ami·e.
          </p>
        </div>

        {!mode && (
          <div className="flex flex-col gap-3">
            <Button onClick={() => setMode('create')} className="w-full">
              Créer une salle
            </Button>
            <Button onClick={() => setMode('join')} variant="secondary" className="w-full">
              Rejoindre avec un code
            </Button>
          </div>
        )}

        {mode && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-display uppercase tracking-wider opacity-80">
                Ton pseudo
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Annette"
                className="px-4 py-3 rounded font-display focus:outline-none focus:ring-2 focus:ring-[color:var(--color-gold)]"
                style={{
                  background: 'var(--color-parchment)',
                  color: 'var(--color-ink)',
                  border: '1px solid var(--color-gold-deep)',
                }}
                autoFocus
              />
            </label>

            {mode === 'join' && (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-display uppercase tracking-wider opacity-80">
                  Code de la salle
                </span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
                  placeholder="ABCDE"
                  maxLength={5}
                  className="px-4 py-3 rounded font-mono text-lg tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:ring-[color:var(--color-gold)]"
                  style={{
                    background: 'var(--color-parchment)',
                    color: 'var(--color-ink)',
                    border: '1px solid var(--color-gold-deep)',
                  }}
                />
              </label>
            )}

            <Button
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={pending || !name.trim() || (mode === 'join' && code.length !== 5)}
              className="w-full"
            >
              {pending
                ? '…'
                : mode === 'create'
                  ? 'Créer la salle'
                  : 'Rejoindre'}
            </Button>
            <button
              onClick={() => setMode(null)}
              className="text-center text-xs opacity-60 hover:opacity-100"
            >
              ← autre option
            </button>
          </div>
        )}

        <Link href="/" className="text-center text-sm opacity-60 hover:opacity-100">
          ← Accueil
        </Link>
      </div>
    </main>
  );
}

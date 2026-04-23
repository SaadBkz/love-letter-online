'use client';

import Link from 'next/link';
import { Trophy, Heart } from 'lucide-react';
import type { GameState } from '@/lib/game';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface GameEndModalProps {
  open: boolean;
  state: GameState;
  onReplay: () => void;
}

export function GameEndModal({ open, state, onReplay }: GameEndModalProps) {
  const winner = state.players.find((p) => p.id === state.winnerId);
  const ranked = [...state.players].sort((a, b) => b.tokens - a.tokens);

  return (
    <Modal open={open} title="Fin de la partie" dismissable={false}>
      <div className="flex flex-col items-center gap-4">
        <Trophy className="w-16 h-16" style={{ color: 'var(--color-gold-bright)' }} />
        <p className="font-display text-2xl text-center">
          {winner ? `${winner.name} remporte la partie !` : 'Partie terminée'}
        </p>

        <div className="w-full">
          <h3 className="font-display text-sm uppercase tracking-wide mb-2 opacity-80 text-center">
            Classement
          </h3>
          <ol className="flex flex-col gap-2">
            {ranked.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded"
                style={{
                  background: i === 0 ? 'var(--color-gold)' : 'rgba(0,0,0,0.1)',
                  color: i === 0 ? 'var(--color-ink)' : 'var(--color-ink)',
                }}
              >
                <span className="font-display">
                  {i + 1}. {p.name}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  {Array.from({ length: p.tokens }).map((_, j) => (
                    <Heart key={j} className="w-3 h-3 fill-[color:var(--color-danger)]" />
                  ))}
                  <span className="ml-1">{p.tokens}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex gap-2 w-full mt-2">
          <Button onClick={onReplay} className="flex-1" variant="primary">
            Rejouer
          </Button>
          <Link href="/" className="flex-1">
            <Button className="w-full" variant="ghost">
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}

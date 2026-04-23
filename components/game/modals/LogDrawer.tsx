'use client';

import { X } from 'lucide-react';
import type { LogEntry } from '@/lib/game';
import { cn } from '@/lib/utils/cn';

export interface LogDrawerProps {
  open: boolean;
  onClose: () => void;
  log: LogEntry[];
}

export function LogDrawer({ open, onClose, log }: LogDrawerProps) {
  const reversed = [...log].reverse();
  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 z-40 w-[90vw] max-w-sm transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full',
      )}
      aria-hidden={!open}
    >
      <div
        className="h-full overflow-y-auto p-4 border-l"
        style={{
          background: 'var(--color-table-deep)',
          borderColor: 'var(--color-gold-deep)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2
            className="font-display text-lg"
            style={{ color: 'var(--color-gold-bright)' }}
          >
            Historique
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10"
            aria-label="Fermer l'historique"
          >
            <X className="w-5 h-5" style={{ color: 'var(--color-parchment)' }} />
          </button>
        </div>
        <ol className="flex flex-col gap-1 text-xs">
          {reversed.map((e, i) => (
            <li
              key={i}
              className="px-2 py-1 rounded"
              style={{
                color:
                  e.kind === 'elim'
                    ? 'var(--color-danger)'
                    : e.kind === 'bonus' || e.kind === 'win'
                      ? 'var(--color-gold-bright)'
                      : 'var(--color-parchment)',
                background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
              }}
            >
              <span className="opacity-50 mr-2 font-mono">
                M{e.round}T{e.turn}
              </span>
              {e.text}
            </li>
          ))}
          {reversed.length === 0 && (
            <li className="italic opacity-60">Pas encore d&apos;actions.</li>
          )}
        </ol>
      </div>
    </div>
  );
}

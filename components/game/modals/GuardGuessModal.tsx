'use client';

import { type CardKind } from '@/lib/game';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/game/Card';

const GUESSABLE: CardKind[] = [
  'Spy',
  'Priest',
  'Baron',
  'Handmaid',
  'Prince',
  'Chancellor',
  'King',
  'Countess',
  'Princess',
];

export interface GuardGuessModalProps {
  open: boolean;
  targetName: string;
  onPick: (guess: CardKind) => void;
  onCancel: () => void;
}

export function GuardGuessModal({ open, targetName, onPick, onCancel }: GuardGuessModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={`Garde : quelle carte a ${targetName} ?`}>
      <p className="text-sm italic mb-3 opacity-80">
        Déclare haut et fort ce que tu crois avoir deviné.
      </p>
      <div className="grid grid-cols-3 gap-2 justify-items-center">
        {GUESSABLE.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => onPick(kind)}
            className="transition-transform hover:-translate-y-1 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-gold)] rounded"
            aria-label={`Deviner ${kind}`}
          >
            <Card kind={kind} size="sm" />
          </button>
        ))}
      </div>
      <Button variant="ghost" onClick={onCancel} className="w-full mt-4">
        Annuler
      </Button>
    </Modal>
  );
}

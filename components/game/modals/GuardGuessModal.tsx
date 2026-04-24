'use client';

import { CARD_NAME_FR, CARD_VALUE, type CardKind } from '@/lib/game';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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
      <p className="text-sm italic mb-4 opacity-80">
        Déclare haut et fort ce que tu crois avoir deviné. Pas d&apos;aide, que du flair.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {GUESSABLE.map((kind) => (
          <Button
            key={kind}
            variant="secondary"
            onClick={() => onPick(kind)}
            className="!px-2 !py-2 flex flex-col items-center h-auto min-h-[64px]"
          >
            <span className="font-display text-lg">{CARD_VALUE[kind]}</span>
            <span className="text-[10px] leading-tight">{CARD_NAME_FR[kind]}</span>
          </Button>
        ))}
      </div>
      <Button variant="ghost" onClick={onCancel} className="w-full mt-4">
        Annuler
      </Button>
    </Modal>
  );
}

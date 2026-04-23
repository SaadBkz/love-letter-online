'use client';

import { CARD_NAME_FR, CARD_VALUE, type CardKind, CARD_COUNT } from '@/lib/game';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

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
  /** Cartes déjà défaussées publiquement (toutes défausses confondues), pour aider. */
  seenDiscard: Record<string, number>;
  onPick: (guess: CardKind) => void;
  onCancel: () => void;
}

export function GuardGuessModal({
  open,
  targetName,
  seenDiscard,
  onPick,
  onCancel,
}: GuardGuessModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={`Garde : quelle carte a ${targetName} ?`}>
      <p className="text-sm italic mb-4 opacity-80">
        Choisis une valeur (Garde exclu). Les compteurs indiquent combien restent à trouver.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {GUESSABLE.map((kind) => {
          const seen = seenDiscard[kind] ?? 0;
          const remaining = CARD_COUNT[kind] - seen;
          const exhausted = remaining <= 0;
          return (
            <Button
              key={kind}
              variant={exhausted ? 'ghost' : 'secondary'}
              disabled={exhausted}
              onClick={() => onPick(kind)}
              className="!px-2 !py-2 flex flex-col items-center h-auto min-h-[64px]"
            >
              <span className="font-display text-lg">{CARD_VALUE[kind]}</span>
              <span className="text-[10px] leading-tight">{CARD_NAME_FR[kind]}</span>
              <span className={cn('text-[9px] opacity-60 font-mono')}>
                {remaining}/{CARD_COUNT[kind]}
              </span>
            </Button>
          );
        })}
      </div>
      <Button variant="ghost" onClick={onCancel} className="w-full mt-4">
        Annuler
      </Button>
    </Modal>
  );
}

'use client';

import type { Player } from '@/lib/game';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface TargetPickerModalProps {
  open: boolean;
  cardName: string;
  targets: Player[];
  /** Permet de jouer sans cible (si aucune valide). */
  allowNoTarget?: boolean;
  onPick: (targetId: string | null) => void;
  onCancel: () => void;
}

export function TargetPickerModal({
  open,
  cardName,
  targets,
  allowNoTarget,
  onPick,
  onCancel,
}: TargetPickerModalProps) {
  return (
    <Modal open={open} onClose={onCancel} title={`Choisis une cible pour ${cardName}`}>
      <div className="flex flex-col gap-2">
        {targets.length === 0 && !allowNoTarget ? (
          <p className="italic text-sm opacity-70">Aucune cible valide.</p>
        ) : (
          targets.map((t) => (
            <Button
              key={t.id}
              variant="secondary"
              onClick={() => onPick(t.id)}
              className="w-full"
            >
              {t.name}
              {t.discard.length > 0 && (
                <span className="ml-2 opacity-60 text-[10px]">
                  — défausse : {t.discard.length}
                </span>
              )}
            </Button>
          ))
        )}
        {allowNoTarget && (
          <Button variant="ghost" onClick={() => onPick(null)} className="w-full mt-2">
            Jouer sans cible (défausse sans effet)
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel} className="w-full mt-1">
          Annuler
        </Button>
      </div>
    </Modal>
  );
}

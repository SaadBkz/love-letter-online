'use client';

import { useMemo, useState } from 'react';
import type { CardKind } from '@/lib/game';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/game/Card';
import { cn } from '@/lib/utils/cn';

export interface ChancellorModalProps {
  open: boolean;
  cards: CardKind[]; // 1 à 3
  onResolve: (keep: CardKind, bottom: CardKind[]) => void;
}

/**
 * Flux :
 * 1. Choisir 1 carte à garder (keep).
 * 2. Si 2 cartes restent, choisir l'ordre : quelle va à la toute fin (dessous de la pioche) et laquelle au-dessus.
 */
export function ChancellorModal({ open, cards, onResolve }: ChancellorModalProps) {
  const [keepIdx, setKeepIdx] = useState<number | null>(null);
  const [orderedBottom, setOrderedBottom] = useState<number[]>([]);

  const remainingIndices = useMemo(() => {
    if (keepIdx === null) return [];
    return cards.map((_, i) => i).filter((i) => i !== keepIdx && !orderedBottom.includes(i));
  }, [cards, keepIdx, orderedBottom]);

  const canConfirm = (() => {
    if (keepIdx === null) return false;
    if (cards.length <= 1) return true;
    if (cards.length === 2) return true; // l'autre est auto-placée
    // cards.length === 3 : 2 cartes à ordonner
    return orderedBottom.length === 2;
  })();

  function reset() {
    setKeepIdx(null);
    setOrderedBottom([]);
  }

  function handleConfirm() {
    if (keepIdx === null) return;
    const keep = cards[keepIdx]!;
    let bottom: CardKind[];
    if (cards.length <= 1) bottom = [];
    else if (cards.length === 2) {
      const other = cards.find((_, i) => i !== keepIdx);
      bottom = other ? [other] : [];
    } else {
      bottom = orderedBottom.map((i) => cards[i]!);
    }
    onResolve(keep, bottom);
    reset();
  }

  return (
    <Modal open={open} title="Chancelière — choisis ce que tu gardes" dismissable={false}>
      {keepIdx === null ? (
        <>
          <p className="text-sm italic mb-3 opacity-80">
            Pioche les cartes ci-dessous. Garde-en 1, replace les autres sous la pioche.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {cards.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setKeepIdx(i)}
                className="transition-transform hover:-translate-y-1"
                aria-label={`Garder ${c}`}
              >
                <Card kind={c} size="md" />
              </button>
            ))}
          </div>
          <p className="text-xs italic mt-3 opacity-60 text-center">
            Tape la carte à garder.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm italic mb-3 opacity-80">
            Tu gardes : <span className="font-bold">{cards[keepIdx]}</span>.
            {cards.length >= 3 && ' Choisis l\'ordre sous la pioche (la 1ʳᵉ sera la plus haute).'}
          </p>
          {cards.length >= 3 && (
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex gap-2 items-center">
                <span className="text-xs opacity-60 w-20">Prochaine :</span>
                <div className="flex gap-2">
                  {remainingIndices.map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setOrderedBottom([...orderedBottom, i])}
                      className={cn('transition-transform hover:-translate-y-1')}
                    >
                      <Card kind={cards[i]!} size="sm" />
                    </button>
                  ))}
                  {orderedBottom[0] !== undefined && (
                    <div className="relative">
                      <Card kind={cards[orderedBottom[0]]!} size="sm" selected />
                      <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[color:var(--color-cartouche)] text-[color:var(--color-gold-bright)] text-xs font-bold flex items-center justify-center">
                        1
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {orderedBottom.length >= 1 && (
                <div className="flex gap-2 items-center">
                  <span className="text-xs opacity-60 w-20">Puis :</span>
                  <div className="flex gap-2">
                    {orderedBottom[1] !== undefined ? (
                      <div className="relative">
                        <Card kind={cards[orderedBottom[1]]!} size="sm" selected />
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[color:var(--color-cartouche)] text-[color:var(--color-gold-bright)] text-xs font-bold flex items-center justify-center">
                          2
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleConfirm} disabled={!canConfirm} className="flex-1">
              Confirmer
            </Button>
            <Button variant="ghost" onClick={reset}>
              Réinitialiser
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

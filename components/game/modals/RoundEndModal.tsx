'use client';

import type { GameState, RoundEndSummary } from '@/lib/game';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/game/Card';

export interface RoundEndModalProps {
  open: boolean;
  state: GameState;
  summary: RoundEndSummary;
  onNextRound: () => void;
}

export function RoundEndModal({ open, state, summary, onNextRound }: RoundEndModalProps) {
  const winnerNames = summary.winners
    .map((id) => state.players.find((p) => p.id === id)?.name)
    .filter(Boolean)
    .join(', ');
  const bonusName = summary.spyBonusTo
    ? state.players.find((p) => p.id === summary.spyBonusTo)?.name
    : null;

  return (
    <Modal open={open} title={`Fin de la manche ${state.roundNumber}`} dismissable={false}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="font-display text-lg">
            {summary.reason === 'lastSurvivor'
              ? `${winnerNames} seul·e survivant·e !`
              : `Pioche vide. Plus haute carte : ${winnerNames}.`}
          </p>
          {bonusName && (
            <p className="text-sm italic mt-1" style={{ color: 'var(--color-cartouche-deep)' }}>
              +1 jeton bonus Espionne pour {bonusName}.
            </p>
          )}
        </div>

        <div>
          <h3 className="font-display text-sm uppercase tracking-wide mb-2 opacity-80">
            Mains révélées
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {state.players.map((p) => {
              const card = summary.finalHands[p.id];
              return (
                <div key={p.id} className="flex flex-col items-center gap-1">
                  <span className="text-xs font-display opacity-80">{p.name}</span>
                  {card ? (
                    <Card kind={card} size="sm" />
                  ) : (
                    <div
                      className="w-[56px] h-[78px] rounded flex items-center justify-center text-[9px] italic opacity-50"
                      style={{ border: '1px dashed var(--color-ink-soft)' }}
                    >
                      éliminé·e
                    </div>
                  )}
                  <span className="text-[10px] font-mono">{p.tokens} jeton{p.tokens > 1 ? 's' : ''}</span>
                  {card && summary.winners.includes(p.id) && (
                    <span className="text-[9px] font-display" style={{ color: 'var(--color-success)' }}>
                      ✓ manche
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Button onClick={onNextRound} className="w-full" variant="primary">
          Manche suivante
        </Button>
      </div>
    </Modal>
  );
}

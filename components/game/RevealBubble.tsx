'use client';

import { motion, AnimatePresence } from 'motion/react';
import { CARD_ARTICLE_FR, CARD_NAME_FR, type CardKind, type Player, type RevealEvent } from '@/lib/game';
import { Card } from './Card';

export interface RevealBubbleProps {
  event: RevealEvent | null;
  players: Player[];
  onDismiss: () => void;
}

/**
 * Overlay de révélation : bulle de BD centrale pour Garde/Prêtre/Baron/Prince/Roi/Princesse.
 * Animations par spring motion. Cliquer ferme manuellement.
 */
export function RevealBubble({ event, players, onDismiss }: RevealBubbleProps) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.type + ('actorId' in event ? event.actorId : '') + ('targetId' in event ? event.targetId : '')}
          className="fixed inset-0 z-40 flex items-center justify-center p-4 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onDismiss}
          style={{ background: 'rgba(0,0,0,0.55)' }}
        >
          <motion.div
            initial={{ scale: 0.4, rotate: -6, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <RevealContent event={event} players={players} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RevealContent({ event, players }: { event: RevealEvent; players: Player[] }) {
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '?';
  switch (event.type) {
    case 'guardGuess':
      return (
        <GuardBubble
          actor={name(event.actorId)}
          target={name(event.targetId)}
          guess={event.guess}
          correct={event.correct}
        />
      );
    case 'priestPeek':
      return (
        <PriestBubble
          actor={name(event.actorId)}
          target={name(event.targetId)}
          card={event.card}
        />
      );
    case 'baronCompare':
      return (
        <BaronBubble
          actor={name(event.actorId)}
          target={name(event.targetId)}
          actorCard={event.actorCard}
          targetCard={event.targetCard}
          loserName={event.loserId ? name(event.loserId) : null}
        />
      );
    case 'princeForce':
      return (
        <PrinceBubble
          actor={name(event.actorId)}
          target={name(event.targetId)}
          card={event.card}
        />
      );
    case 'kingSwap':
      return <KingBubble actor={name(event.actorId)} target={name(event.targetId)} />;
    case 'princessSuicide':
      return <PrincessBubble actor={name(event.actorId)} />;
  }
}

function SpeechBubble({
  children,
  tone = 'light',
}: {
  children: React.ReactNode;
  tone?: 'light' | 'dark';
}) {
  return (
    <div
      className="relative rounded-2xl px-6 py-5 shadow-2xl max-w-sm"
      style={{
        background:
          tone === 'light'
            ? 'linear-gradient(180deg, #faf0dd 0%, #f5e6c8 100%)'
            : 'linear-gradient(180deg, #2a1810 0%, #1a0c08 100%)',
        color: tone === 'light' ? 'var(--color-ink)' : 'var(--color-parchment)',
        border: '2px solid var(--color-gold-deep)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Queue de la bulle */}
      <span
        className="absolute -bottom-3 left-10 w-6 h-6 rotate-45"
        style={{
          background:
            tone === 'light'
              ? 'linear-gradient(135deg, transparent 50%, #f5e6c8 50%)'
              : 'linear-gradient(135deg, transparent 50%, #1a0c08 50%)',
          borderRight: '2px solid var(--color-gold-deep)',
          borderBottom: '2px solid var(--color-gold-deep)',
        }}
      />
      {children}
    </div>
  );
}

function GuardBubble({
  actor,
  target,
  guess,
  correct,
}: {
  actor: string;
  target: string;
  guess: CardKind;
  correct: boolean;
}) {
  const article = CARD_ARTICLE_FR[guess];
  const articleCapitalized =
    article === "l'" ? "L'" : article.charAt(0).toUpperCase() + article.slice(1);
  return (
    <div className="flex flex-col items-center gap-3">
      <SpeechBubble>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="font-display text-xs uppercase tracking-widest opacity-60">
            {actor} déclare
          </span>
          <span className="font-display text-lg italic">à {target} :</span>
          <span
            className="font-display font-bold leading-tight uppercase mt-2"
            style={{
              fontSize: '1.3rem',
              letterSpacing: '0.04em',
              color: 'var(--color-cartouche-deep)',
              textShadow: '0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            « Tu as {article}
            {CARD_NAME_FR[guess]} ! »
          </span>
        </div>
      </SpeechBubble>

      {/* Illustration de la carte devinée */}
      <motion.div
        initial={{ scale: 0, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.25, type: 'spring', stiffness: 220, damping: 18 }}
      >
        <Card kind={guess} size="md" />
      </motion.div>

      <motion.div
        initial={{ scale: 0, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: correct ? -8 : 6, opacity: 1 }}
        transition={{ delay: 0.65, type: 'spring', stiffness: 500, damping: 14 }}
        className="px-6 py-2 rounded font-display font-bold uppercase tracking-wider"
        style={{
          background: correct ? '#a62424' : '#6b8e4e',
          color: '#f5e6c8',
          fontSize: '1.6rem',
          border: '2px solid',
          borderColor: correct ? '#5c1010' : '#4a6b33',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
        }}
      >
        {correct ? 'Touché !' : 'Raté.'}
      </motion.div>
      {/* articleCapitalized est gardé pour usage futur éventuel */}
      <span className="sr-only">{articleCapitalized}</span>
    </div>
  );
}

function PriestBubble({
  actor,
  target,
  card,
}: {
  actor: string;
  target: string;
  card: CardKind;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <SpeechBubble>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="font-display text-xs uppercase tracking-widest opacity-60">
            {actor} observe en secret
          </span>
          <span className="font-display text-sm italic">la main de {target}…</span>
        </div>
      </SpeechBubble>
      <motion.div
        initial={{ scale: 0, rotateY: 180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 220, damping: 18 }}
      >
        <Card kind={card} size="lg" />
      </motion.div>
    </div>
  );
}

function BaronBubble({
  actor,
  target,
  actorCard,
  targetCard,
  loserName,
}: {
  actor: string;
  target: string;
  actorCard: CardKind;
  targetCard: CardKind;
  loserName: string | null;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <SpeechBubble>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="font-display text-xs uppercase tracking-widest opacity-60">
            Duel du Baron
          </span>
          <span className="font-display text-sm italic">
            {actor} vs {target}
          </span>
        </div>
      </SpeechBubble>
      <div className="flex items-end gap-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-display" style={{ color: 'var(--color-parchment)' }}>
            {actor}
          </span>
          <Card kind={actorCard} size="md" />
        </div>
        <span
          className="font-display text-xl italic pb-12"
          style={{ color: 'var(--color-gold-bright)' }}
        >
          vs
        </span>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-display" style={{ color: 'var(--color-parchment)' }}>
            {target}
          </span>
          <Card kind={targetCard} size="md" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-5 py-2 rounded font-display font-bold uppercase tracking-wider"
        style={{
          background: loserName ? '#a62424' : '#5c3a28',
          color: '#f5e6c8',
          fontSize: '1rem',
          border: '2px solid #5c1010',
        }}
      >
        {loserName ? `${loserName} est éliminé·e` : 'Égalité — rien'}
      </motion.div>
    </div>
  );
}

function PrinceBubble({
  actor,
  target,
  card,
}: {
  actor: string;
  target: string;
  card: CardKind;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <SpeechBubble>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="font-display text-xs uppercase tracking-widest opacity-60">
            {actor} ordonne
          </span>
          <span className="font-display text-lg italic">{target} défausse…</span>
        </div>
      </SpeechBubble>
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, -10, 10, -6, 6, 0] }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <Card kind={card} size="lg" />
      </motion.div>
      {card === 'Princess' && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 500, damping: 16 }}
          className="px-5 py-2 rounded font-display font-bold uppercase tracking-wider"
          style={{
            background: '#a62424',
            color: '#f5e6c8',
            fontSize: '1.2rem',
            border: '2px solid #5c1010',
          }}
        >
          La Princesse tombe — {target} éliminé·e
        </motion.div>
      )}
    </div>
  );
}

function KingBubble({ actor, target }: { actor: string; target: string }) {
  return (
    <SpeechBubble tone="dark">
      <div className="flex flex-col items-center text-center gap-1">
        <span className="font-display text-xs uppercase tracking-widest opacity-60">
          Échange royal
        </span>
        <span
          className="font-display text-xl"
          style={{ color: 'var(--color-gold-bright)' }}
        >
          {actor} ⇄ {target}
        </span>
        <span className="text-xs italic opacity-70">Les mains sont échangées.</span>
      </div>
    </SpeechBubble>
  );
}

function PrincessBubble({ actor }: { actor: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <SpeechBubble>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="font-display text-xs uppercase tracking-widest opacity-60">
            Fatalité
          </span>
          <span className="font-display text-lg italic">
            {actor} défausse la Princesse…
          </span>
        </div>
      </SpeechBubble>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 12 }}
        className="px-6 py-2 rounded font-display font-bold uppercase tracking-wider"
        style={{
          background: '#a62424',
          color: '#f5e6c8',
          fontSize: '1.4rem',
          border: '2px solid #5c1010',
        }}
      >
        Éliminé·e
      </motion.div>
    </div>
  );
}

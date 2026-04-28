'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { LogEntry, LogEntryKind } from '@/lib/game';
import { BotThinking } from './BotThinking';

export interface GameLogFeedProps {
  log: LogEntry[];
  /**
   * Si non-null, rend une ligne « X réfléchit… » en bas du feed.
   * Couvre les bots en solo ET les humains adverses en multi (tout joueur
   * courant qui n'est pas l'utilisateur local), incluant la phase
   * Chancellière (où le label peut inclure "(Chancelière)").
   */
  thinkingPlayerName?: string | null;
}

const KIND_COLOR: Record<LogEntryKind, string> = {
  elim: 'var(--color-danger)',
  win: 'var(--color-gold-bright)',
  bonus: 'var(--color-gold-bright)',
  protect: '#6b8e4e',
  play: 'var(--color-parchment)',
  info: 'var(--color-parchment)',
  reveal: 'var(--color-parchment)',
};

const KIND_BULLET: Record<LogEntryKind, string> = {
  elim: '✕',
  win: '★',
  bonus: '✦',
  protect: '⛨',
  play: '›',
  info: '·',
  reveal: '·',
};

export function GameLogFeed({ log, thinkingPlayerName }: GameLogFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastLenRef = useRef(log.length);

  useEffect(() => {
    if (log.length === lastLenRef.current) return;
    lastLenRef.current = log.length;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [log.length]);

  return (
    <div
      className="relative h-full w-full mx-auto max-w-md flex flex-col overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(20,12,8,0.55) 0%, rgba(28,18,12,0.35) 100%)',
        borderTop: '1px solid rgba(201,169,110,0.18)',
        borderBottom: '1px solid rgba(201,169,110,0.18)',
      }}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 scroll-smooth"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-gold-deep) transparent',
        }}
      >
        {log.length === 0 ? (
          <p className="text-[11px] italic opacity-60 text-center pt-4" style={{ color: 'var(--color-parchment)' }}>
            La partie commence…
          </p>
        ) : (
          <ol className="flex flex-col gap-[3px]">
            <AnimatePresence initial={false}>
              {log.map((e, i) => {
                const isLatest = i === log.length - 1;
                return (
                  <motion.li
                    key={`${e.round}-${e.turn}-${i}`}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-[11px] leading-snug px-2 py-[3px] rounded flex items-baseline gap-1.5"
                    style={{
                      color: KIND_COLOR[e.kind],
                      background: isLatest ? 'rgba(230,200,138,0.08)' : 'transparent',
                      fontWeight: e.kind === 'elim' || e.kind === 'win' ? 600 : 400,
                    }}
                  >
                    <span
                      className="font-mono opacity-50 shrink-0"
                      style={{ fontSize: 9, minWidth: 26 }}
                    >
                      M{e.round}T{e.turn}
                    </span>
                    <span
                      className="shrink-0"
                      style={{ fontSize: 11, color: KIND_COLOR[e.kind], opacity: 0.75 }}
                    >
                      {KIND_BULLET[e.kind]}
                    </span>
                    <span className="break-words">{e.text}</span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        )}
      </div>

      {thinkingPlayerName && (
        <div className="px-3 py-1.5 border-t" style={{ borderColor: 'rgba(201,169,110,0.18)' }}>
          <BotThinking name={thinkingPlayerName} />
        </div>
      )}
    </div>
  );
}

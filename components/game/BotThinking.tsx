'use client';

import { motion } from 'motion/react';

export function BotThinking({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-xs italic"
      style={{ color: 'var(--color-parchment)' }}
    >
      <span className="opacity-70">{name} réfléchit</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--color-gold-bright)' }}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </span>
    </motion.div>
  );
}

'use client';

import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

/**
 * Overlay d'un bouclier doré animé autour d'un joueur protégé par la Servante.
 * À placer en child absolu d'un container relatif (ex : PlayerSeat).
 */
export function HandmaidShield() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none rounded-lg"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{
        opacity: [0.3, 0.7, 0.3],
        scale: [1.02, 1.05, 1.02],
      }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        boxShadow:
          'inset 0 0 0 2px var(--color-gold-bright), 0 0 24px 2px var(--color-gold) ',
      }}
      aria-hidden
    >
      <span
        className="absolute top-1 right-1 bg-[color:var(--color-gold)] rounded-full p-0.5"
        style={{ border: '1px solid var(--color-gold-deep)' }}
      >
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--color-ink)' }} />
      </span>
    </motion.div>
  );
}

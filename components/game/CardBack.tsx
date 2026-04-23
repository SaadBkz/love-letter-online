'use client';

import { Mail } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface CardBackProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  count?: number; // nombre de cartes empilées
}

const SIZE_CLASSES = {
  sm: 'w-[56px] h-[78px]',
  md: 'w-[96px] h-[134px]',
  lg: 'w-[160px] h-[224px]',
} as const;

export function CardBack({ size = 'md', className, count }: CardBackProps) {
  return (
    <div
      className={cn(
        'relative rounded-[10%/7%] overflow-hidden border border-[color:var(--color-ink)]/70',
        'shadow-[0_2px_8px_rgba(0,0,0,0.5)]',
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        background:
          'repeating-linear-gradient(45deg, #2a080c, #2a080c 4px, #3d0e13 4px, #3d0e13 8px)',
      }}
      aria-hidden
    >
      {/* Bordure intérieure dorée */}
      <div
        className="absolute inset-[6%] rounded-[inherit] pointer-events-none"
        style={{ border: '1px solid var(--color-gold-deep)' }}
      />
      {/* Sceau central */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, var(--color-gold-bright), var(--color-gold-deep))',
            width: '46%',
            aspectRatio: '1',
            border: '2px solid var(--color-cartouche-deep)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          <Mail
            className="w-[55%] h-[55%]"
            style={{ color: 'var(--color-cartouche-deep)' }}
            strokeWidth={2}
          />
        </div>
      </div>
      {count !== undefined && count > 1 && (
        <div
          className="absolute bottom-1 right-1 text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(0,0,0,0.6)',
            color: 'var(--color-gold-bright)',
          }}
        >
          ×{count}
        </div>
      )}
    </div>
  );
}

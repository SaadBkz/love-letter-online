import { cn } from '@/lib/utils/cn';

export interface WaxSealTokenProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  /** Animation "pop" au rendu (gain récent) */
  pop?: boolean;
}

const SIZE = { xs: 10, sm: 14, md: 22 } as const;

/**
 * Jeton d'affection stylisé comme un sceau de cire rouge imprimé d'un cœur.
 */
export function WaxSealToken({ size = 'sm', className, pop }: WaxSealTokenProps) {
  const px = SIZE[size];
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full relative',
        pop && 'animate-[seal-pop_0.5s_ease-out]',
        className,
      )}
      style={{
        width: px,
        height: px,
        background: 'radial-gradient(circle at 30% 30%, #c93232, #8b1a1a 55%, #5c1010 100%)',
        boxShadow:
          '0 1px 1px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.35)',
        border: '0.5px solid #3a0808',
      }}
      aria-hidden
    >
      <span
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          color: '#e6c88a',
          fontSize: px * 0.6,
          lineHeight: 1,
          textShadow: '0 1px 0 rgba(0,0,0,0.4)',
        }}
      >
        ♡
      </span>
    </span>
  );
}

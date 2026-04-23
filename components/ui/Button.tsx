'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'font-display font-semibold tracking-wide rounded-md transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-gold)] disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' && 'px-3 py-1.5 text-xs min-h-[36px]',
        size === 'md' && 'px-5 py-2.5 text-sm min-h-[44px]',
        size === 'lg' && 'px-7 py-3.5 text-base min-h-[52px]',
        variant === 'primary' &&
          'bg-[color:var(--color-cartouche)] text-[color:var(--color-gold-bright)] border border-[color:var(--color-gold-deep)] hover:bg-[color:var(--color-cartouche-deep)] active:scale-[0.98]',
        variant === 'secondary' &&
          'bg-[color:var(--color-gold)] text-[color:var(--color-ink)] border border-[color:var(--color-gold-deep)] hover:bg-[color:var(--color-gold-bright)] active:scale-[0.98]',
        variant === 'ghost' &&
          'bg-transparent text-[color:var(--color-parchment)] border border-[color:var(--color-gold-deep)]/50 hover:bg-[color:var(--color-gold-deep)]/20',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

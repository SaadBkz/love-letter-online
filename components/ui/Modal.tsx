'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  dismissable?: boolean;
  className?: string;
}

export function Modal({ open, onClose, title, children, dismissable = true, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable) onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, dismissable]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={dismissable ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={cn(
          'relative max-w-md w-full rounded-lg p-6 shadow-2xl',
          'border border-[color:var(--color-gold-deep)]',
          className,
        )}
        style={{
          background:
            'linear-gradient(180deg, var(--color-parchment) 0%, var(--color-parchment-dark) 100%)',
          color: 'var(--color-ink)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2
            className="font-display text-xl font-bold mb-4 pb-2 border-b"
            style={{ borderColor: 'var(--color-gold-deep)' }}
          >
            {title}
          </h2>
        )}
        {dismissable && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded hover:bg-[color:var(--color-ink)]/10"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Heart, Mail } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle at 30% 30%, var(--color-gold-bright), var(--color-gold-deep))',
            border: '2px solid var(--color-cartouche-deep)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <Mail
            className="w-10 h-10"
            style={{ color: 'var(--color-cartouche-deep)' }}
            strokeWidth={2}
          />
        </div>
        <h1
          className="font-display text-4xl sm:text-5xl font-bold tracking-tight"
          style={{ color: 'var(--color-gold-bright)' }}
        >
          Love Letter
        </h1>
        <p
          className="max-w-md text-base italic"
          style={{ color: 'var(--color-parchment)', opacity: 0.85 }}
        >
          Faire parvenir la lettre à la Princesse. 21 cartes, trop de traîtres.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/play/solo"
          className="font-display font-semibold px-6 py-4 rounded-md text-center transition-all hover:scale-[1.02] active:scale-[0.99]"
          style={{
            background: 'var(--color-cartouche)',
            color: 'var(--color-gold-bright)',
            border: '1px solid var(--color-gold-deep)',
          }}
        >
          Jouer contre des bots
        </Link>
        <button
          disabled
          className="font-display font-semibold px-6 py-4 rounded-md opacity-50 cursor-not-allowed"
          style={{
            background: 'transparent',
            color: 'var(--color-parchment)',
            border: '1px solid var(--color-gold-deep)',
          }}
          title="Bientôt"
        >
          Créer une partie en ligne
          <span className="block text-[10px] opacity-70 italic font-normal">bientôt</span>
        </button>
        <button
          disabled
          className="font-display font-semibold px-6 py-4 rounded-md opacity-50 cursor-not-allowed"
          style={{
            background: 'transparent',
            color: 'var(--color-parchment)',
            border: '1px solid var(--color-gold-deep)',
          }}
        >
          Rejoindre une salle
          <span className="block text-[10px] opacity-70 italic font-normal">bientôt</span>
        </button>
      </div>

      <footer
        className="absolute bottom-4 text-[10px] flex items-center gap-1 opacity-60"
        style={{ color: 'var(--color-parchment)' }}
      >
        <Heart className="w-3 h-3" /> Règles officielles Z-Man 2019
      </footer>
    </main>
  );
}

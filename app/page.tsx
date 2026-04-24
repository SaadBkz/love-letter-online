import Link from 'next/link';

export default function Home() {
  return (
    <main
      className="relative flex min-h-[100dvh] flex-col items-center justify-between px-6 py-10 overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 30%, #5a1616 0%, #3d0e13 55%, #2a080c 100%)',
      }}
    >
      {/* Motif losanges en arrière-plan, style dos de carte */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
        aria-hidden
      >
        <defs>
          <linearGradient id="homeGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e6c88a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#9c7d48" stopOpacity="0.4" />
          </linearGradient>
          <pattern
            id="homeDiamondPattern"
            x="0"
            y="0"
            width="26"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 13,0 L 26,16 L 13,32 L 0,16 Z"
              fill="none"
              stroke="url(#homeGold)"
              strokeWidth="0.7"
              opacity="0.55"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#homeDiamondPattern)" />
      </svg>

      {/* Bordure dorée décorative */}
      <div
        className="absolute inset-3 pointer-events-none rounded-lg"
        style={{
          border: '1px solid var(--color-gold-deep)',
          boxShadow: 'inset 0 0 0 1px rgba(230,200,138,0.18)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-2 mt-10 sm:mt-20">
        {/* Ornements haut */}
        <div
          className="flex items-center gap-3 opacity-80"
          style={{ color: 'var(--color-gold-bright)' }}
          aria-hidden
        >
          <span className="text-lg">⚜</span>
          <span className="text-[10px] font-display uppercase tracking-[0.4em] opacity-80">
            Une lettre à la Princesse
          </span>
          <span className="text-lg">⚜</span>
        </div>

        {/* Titre principal — script calligraphique matching le dos de carte */}
        <h1
          className="font-[family-name:var(--font-script)] font-normal text-center leading-[1.05] mt-3"
          style={{
            fontSize: 'clamp(3.5rem, 17.5vw, 6.4rem)',
            letterSpacing: '0.01em',
            background:
              'linear-gradient(180deg, #f5e6c8 0%, #e6c88a 40%, #c9a96e 70%, #9c7d48 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter:
              'drop-shadow(0 3px 2px rgba(0,0,0,0.5)) drop-shadow(0 0 24px rgba(230,200,138,0.25))',
            transform: 'rotate(-3deg)',
          }}
        >
          Saad
        </h1>
        <h1
          className="font-[family-name:var(--font-script)] font-normal text-center leading-[1.05] mt-2"
          style={{
            fontSize: 'clamp(3.5rem, 17.5vw, 6.4rem)',
            letterSpacing: '0.01em',
            background:
              'linear-gradient(180deg, #f5e6c8 0%, #e6c88a 40%, #c9a96e 70%, #9c7d48 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter:
              'drop-shadow(0 3px 2px rgba(0,0,0,0.5)) drop-shadow(0 0 24px rgba(230,200,138,0.25))',
            transform: 'rotate(-3deg)',
          }}
        >
          Letter
        </h1>

        <div
          className="mt-6 text-[10px] sm:text-xs font-display uppercase tracking-[0.3em] opacity-70"
          style={{ color: 'var(--color-parchment)' }}
        >
          2 à 6 joueurs · règles 2019
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-3 w-full max-w-xs pb-6">
        <Link
          href="/play/solo"
          className="font-display font-semibold px-6 py-4 rounded-md text-center transition-all hover:scale-[1.02] active:scale-[0.99] text-lg"
          style={{
            background:
              'linear-gradient(180deg, #a62424 0%, #8b1a1a 55%, #5c1010 100%)',
            color: 'var(--color-gold-bright)',
            border: '1px solid var(--color-gold-deep)',
            boxShadow:
              '0 3px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,240,200,0.2)',
            letterSpacing: '0.06em',
          }}
        >
          Jouer contre des bots
        </Link>
        <Link
          href="/play/online"
          className="font-display font-semibold px-6 py-3.5 rounded-md text-center transition-all hover:scale-[1.02] active:scale-[0.99]"
          style={{
            background: 'transparent',
            color: 'var(--color-parchment)',
            border: '1px solid var(--color-gold-deep)',
            letterSpacing: '0.04em',
          }}
        >
          Jouer en ligne avec des amis
        </Link>

        <div
          className="mt-4 flex items-center gap-2 text-[10px] opacity-60 self-center"
          style={{ color: 'var(--color-parchment)' }}
        >
          <span>⚜</span>
          <span className="italic">faire parvenir la lettre avant les autres</span>
          <span>⚜</span>
        </div>
      </div>
    </main>
  );
}

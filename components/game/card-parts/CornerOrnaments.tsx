/**
 * Ornements dorés aux 4 coins de la carte (scrollwork baroque simplifié).
 */
export function CornerOrnaments() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 140"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* Coin haut-gauche */}
      <g transform="translate(3,3)">
        <path
          d="M 0,12 Q 0,0 12,0 M 0,6 Q 4,2 8,4 M 6,0 Q 2,4 4,8"
          stroke="url(#goldScroll)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle cx="3" cy="3" r="0.9" fill="url(#goldScroll)" />
      </g>
      {/* Coin haut-droit */}
      <g transform="translate(97,3) scale(-1,1)">
        <path
          d="M 0,12 Q 0,0 12,0 M 0,6 Q 4,2 8,4 M 6,0 Q 2,4 4,8"
          stroke="url(#goldScroll)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle cx="3" cy="3" r="0.9" fill="url(#goldScroll)" />
      </g>
      {/* Coin bas-gauche */}
      <g transform="translate(3,137) scale(1,-1)">
        <path
          d="M 0,12 Q 0,0 12,0 M 0,6 Q 4,2 8,4 M 6,0 Q 2,4 4,8"
          stroke="url(#goldScroll)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle cx="3" cy="3" r="0.9" fill="url(#goldScroll)" />
      </g>
      {/* Coin bas-droit */}
      <g transform="translate(97,137) scale(-1,-1)">
        <path
          d="M 0,12 Q 0,0 12,0 M 0,6 Q 4,2 8,4 M 6,0 Q 2,4 4,8"
          stroke="url(#goldScroll)"
          strokeWidth="0.8"
          fill="none"
        />
        <circle cx="3" cy="3" r="0.9" fill="url(#goldScroll)" />
      </g>

      <defs>
        <linearGradient id="goldScroll" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e6c88a" />
          <stop offset="50%" stopColor="#c9a96e" />
          <stop offset="100%" stopColor="#9c7d48" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Texture parchemin (bruit subtil via filter SVG). */
export function ParchmentTexture() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-25 mix-blend-multiply"
      aria-hidden
    >
      <filter id="parchmentNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
        <feColorMatrix
          values="0 0 0 0 0.4
                  0 0 0 0 0.3
                  0 0 0 0 0.15
                  0 0 0 0.8 0"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#parchmentNoise)" />
    </svg>
  );
}

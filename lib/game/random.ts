import seedrandom from 'seedrandom';

export type Rng = () => number;

export function createRng(seed: string): Rng {
  return seedrandom(seed);
}

/** Fisher-Yates shuffle déterministe via RNG seedé. */
export function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/** Pick d'un élément aléatoire. */
export function pick<T>(arr: readonly T[], rng: Rng): T {
  const idx = Math.floor(rng() * arr.length);
  return arr[idx]!;
}

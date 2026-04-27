#!/usr/bin/env node
/**
 * Corrige le texte d'effet gravé en bas de `public/cards/king.png`.
 *
 * Le composite source `cards-sheet.png` a été généré avec le texte du Prince
 * sous la cellule du Roi. Plutôt que regénérer toute la planche, on recouvre
 * la bande parchemin du bas du Roi avec un nouveau parchemin + le bon texte.
 *
 * Backup : `public/cards/king.before-fix.png`.
 */
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const SRC = resolve(REPO_ROOT, 'public', 'cards', 'king.png');
const OUT = SRC;

// Géométrie de la bande parchemin (mesurée par échantillonnage pixel sur
// l'image 230×330 actuelle). Ajuster ici si la planche est régénérée.
const BAND = {
  x: 32,
  y: 242,
  w: 181,
  h: 58,
};

const PARCHMENT = '#e1c089';
const PARCHMENT_HI = '#ecd0a0';
const INK = '#3a2410';

// Texte officiel du Roi (cohérent avec lib/utils/card-visuals.ts et
// docs/rules.md, mais reformulé en "vous" pour matcher le style des
// autres cartes de la planche).
const LINES = [
  'Échangez votre main',
  'avec celle d’un·e autre',
  'joueur·se de votre choix.',
];

function buildOverlaySvg() {
  const { x, y, w, h } = BAND;
  const lineHeight = 13;
  const totalText = LINES.length * lineHeight;
  const firstBaseline = y + (h - totalText) / 2 + lineHeight - 2;
  const cx = x + w / 2;

  const texts = LINES.map((line, i) => {
    const ty = firstBaseline + i * lineHeight;
    const safe = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<text x="${cx}" y="${ty}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="10" font-style="italic" fill="${INK}">${safe}</text>`;
  }).join('\n  ');

  // Fond parchemin : léger dégradé pour matcher la texture environnante.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="230" height="330">
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${PARCHMENT_HI}"/>
      <stop offset="1" stop-color="${PARCHMENT}"/>
    </linearGradient>
  </defs>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#p)"/>
  ${texts}
</svg>`;
}

const svg = buildOverlaySvg();
const overlay = Buffer.from(svg);

await sharp(SRC)
  .composite([{ input: overlay, top: 0, left: 0 }])
  .png({ quality: 92 })
  .toFile(OUT + '.tmp');

// Atomic-ish replace
import('node:fs/promises').then(async (fs) => {
  await fs.rename(OUT + '.tmp', OUT);
  console.log('✅  king.png corrigé →', OUT);
  console.log('    bande:', BAND);
  console.log('    texte:', LINES.join(' / '));
});

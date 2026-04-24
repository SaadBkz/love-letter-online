#!/usr/bin/env node
/**
 * Découpe l'image composite "cards-sheet.png" en fichiers individuels.
 *
 * Disposition détectée (Saad Letter v1) :
 *   Rangée 1 : Espionne | Garde    | Prêtre
 *   Rangée 2 : Servante | Prince   | Chancelier
 *   Rangée 3 : Roi      | Princesse| Dos
 *
 * Baron (3) et Comtesse (8) absents de ce composite → restent en silhouette SVG.
 *
 * Usage :
 *   1. Enregistrer l'image à c:\Users\Love Letter\cards-sheet.png
 *   2. node scripts/split-cards-sheet.mjs
 */

import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const CANDIDATES = [
  resolve(REPO_ROOT, 'cards-sheet.png'),
  resolve(REPO_ROOT, '..', 'cards-sheet.png'),
];

const source = CANDIDATES.find((p) => existsSync(p));
if (!source) {
  console.error('❌  cards-sheet.png introuvable.');
  process.exit(1);
}

const outDir = resolve(REPO_ROOT, 'public', 'cards');
await mkdir(outDir, { recursive: true });

const meta = await sharp(source).metadata();
const W = meta.width ?? 0;
const H = meta.height ?? 0;
console.log(`📐  Source : ${source} (${W} × ${H})`);

/**
 * Grille 3×3. Pad externe + gap interne ajustables.
 * Les cartes ont une marge de bois autour de la zone de grille.
 */
const LAYOUT = {
  leftPad: 0.035,
  rightPad: 0.03,
  topPad: 0.025,
  bottomPad: 0.025,
  cols: 3,
  rows: 3,
  colGapRatio: 0.04, // gap entre cartes (% de la largeur d'une cellule)
  rowGapRatio: 0.03,
};

// [row][col] → nom de fichier output (null = skip ce slot)
const CARD_GRID = [
  ['spy', 'guard', 'priest'],
  ['handmaid', 'prince', 'chancellor'],
  ['king', 'princess', 'back'],
];

async function crop(left, top, width, height, outFile) {
  const ext = await sharp(source)
    .extract({
      left: Math.round(left),
      top: Math.round(top),
      width: Math.round(width),
      height: Math.round(height),
    })
    .png({ quality: 92 })
    .toFile(outFile);
  console.log(`  ✓ ${outFile.split(/[\\/]/).pop()} (${ext.width}×${ext.height})`);
}

const gridX0 = W * LAYOUT.leftPad;
const gridY0 = H * LAYOUT.topPad;
const gridW = W * (1 - LAYOUT.leftPad - LAYOUT.rightPad);
const gridH = H * (1 - LAYOUT.topPad - LAYOUT.bottomPad);
const cellW = gridW / LAYOUT.cols;
const cellH = gridH / LAYOUT.rows;
const colGap = cellW * LAYOUT.colGapRatio;
const rowGap = cellH * LAYOUT.rowGapRatio;

console.log('✂️   Découpe 3×3 :');
for (let r = 0; r < LAYOUT.rows; r++) {
  for (let c = 0; c < LAYOUT.cols; c++) {
    const name = CARD_GRID[r]?.[c];
    if (!name) continue;
    const x = gridX0 + c * cellW + colGap / 2;
    const y = gridY0 + r * cellH + rowGap / 2;
    const w = cellW - colGap;
    const h = cellH - rowGap;
    await crop(x, y, w, h, join(outDir, `${name}.png`));
  }
}

console.log('\n✅  Fichiers écrits dans public/cards/.');
console.log('   Baron (3) et Comtesse (8) absents du composite → silhouette SVG par défaut.');
console.log('   Si une découpe est décalée, ajuste LAYOUT en haut du script et relance.');

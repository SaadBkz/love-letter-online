# Prompts pour illustrations de cartes

Le style visuel cible est celui de la 2ᵉ édition Z-Man Games 2019 : peinture numérique, portrait mi-long d'un personnage dans un décor médiéval-fantasy, éclairage doux mais contrasté, palette riche, cadre déjà fourni par l'UI (ne pas inclure le cadre dans l'image).

## Règles communes (à ajouter à chaque prompt)

- Format : **768 × 1024 px minimum, ratio portrait 3:4** (sera recadré en zone 80% × 40% de la carte).
- **Fond à l'intérieur de la scène** (pas de fond transparent) — château, palais, bibliothèque, jardin royal.
- **Pas de texte, pas de bordure, pas de cadre** — juste la scène.
- **Pas de logo Z-Man** ni élément déposé de marque.
- Style : *medieval fantasy oil painting, semi-realistic, warm ambient light, painterly brushstrokes, cinematic composition, soft depth of field, 2019 Z-Man Love Letter card illustration style, artstation trending*.
- Utilisabilité : la silhouette du personnage doit être lisible à 128 px de haut.
- Exporter en **PNG avec transparence optionnelle autour du sujet** ou **JPG haute qualité** avec décor plein.

## Nom de fichier attendu

Déposer dans `public/cards/` :

- `spy.png`
- `guard.png`
- `priest.png`
- `baron.png`
- `handmaid.png`
- `prince.png`
- `chancellor.png`
- `king.png`
- `countess.png`
- `princess.png`
- `back.png` (dos de carte)

Le code détectera leur présence et substituera automatiquement les silhouettes SVG placeholders.

---

## 0 — Espionne (Spy)

> Semi-realistic medieval fantasy oil painting, half-body portrait of a sly hooded female spy with a dark violet cloak over burgundy leather, holding an unrolled parchment with wax seal and a small golden key at her waist, dimly lit stone archway behind with a sliver of candlelight, secretive sidelong glance, atmospheric shadows, painterly brushstrokes, warm torch highlights on face, 3:4 portrait composition, cinematic, trending on artstation.

## 1 — Garde (Guard)

> Semi-realistic medieval fantasy oil painting, half-body portrait of a determined young female royal guard in polished silver-steel plate armor with burgundy cloth underlay, gripping the hilt of a longsword diagonally across her chest, castle courtyard behind with ornate pillars, bright but overcast light, visible breastplate engravings of a rose sigil, confident expression, painterly brushstrokes, 3:4 portrait composition, warm skin tone, cinematic lighting.

## 2 — Prêtre (Priest)

> Semi-realistic medieval fantasy oil painting, half-body portrait of a dignified robed priest with a warm cocoa skin tone and short greying beard, wearing deep purple and gold embroidered robes with a three-pronged golden symbol staff, holding an open leather-bound tome, candlelit cathedral interior with stained glass behind, gentle intelligent gaze, painterly strokes, 3:4 portrait composition, soft rim lighting.

## 3 — Baron

> Semi-realistic medieval fantasy oil painting, half-body portrait of a stern middle-aged nobleman with dark silver-streaked hair, trimmed beard, ornate black and deep blue doublet with silver clasps, one hand resting on a sheathed ornate longsword, stone council-hall background with faint tapestries, candle-warm lighting, scrutinizing narrow-eyed expression, painterly strokes, 3:4 portrait composition.

## 4 — Servante (Handmaid)

> Semi-realistic medieval fantasy oil painting, half-body portrait of a kind-faced young handmaid with auburn hair braided over one shoulder, modest russet and cream dress with a white apron, holding a folded velvet cloth against her chest protectively, warmly lit kitchen or dressing chamber with copper utensils and drying herbs behind, serene small smile, painterly brushstrokes, 3:4 portrait composition.

## 5 — Prince

> Semi-realistic medieval fantasy oil painting, half-body portrait of a handsome young prince with warm brown skin, short dark curly hair, emerald green velvet doublet embroidered with gold vine patterns, one hand lifted gesturing at another person outside the frame, royal garden background with trellises, afternoon sunlight, confident charming expression, painterly brushstrokes, 3:4 portrait composition.

## 6 — Chancelière (Chancellor)

> Semi-realistic medieval fantasy oil painting, half-body portrait of a scholarly chancellor, bald with round gold-rimmed spectacles, wearing deep teal and gold embroidered academic robes, holding a quill pen in one hand and a rolled parchment in the other, library background with tall bookshelves and a globe, thoughtful analytical expression, warm candlelight, painterly brushstrokes, 3:4 portrait composition.

## 7 — Roi (King)

> Semi-realistic medieval fantasy oil painting, half-body portrait of a regal middle-aged king with a closely trimmed dark beard, wearing a heavy golden crown set with rubies, ermine-trimmed crimson royal mantle over a gold-embroidered tunic, holding a golden scepter, throne-room background with banners, commanding presence, painterly brushstrokes, 3:4 portrait composition.

## 8 — Comtesse (Countess)

> Semi-realistic medieval fantasy oil painting, half-body portrait of an elegant middle-aged countess with dark raven hair elaborately coiffed, wearing a deep plum gown with intricate gold brocade and a ruby pendant, holding a folded silk fan delicately, opulent palace antechamber background with velvet drapes, subtle knowing smirk, painterly brushstrokes, 3:4 portrait composition.

## 9 — Princesse (Princess)

> Semi-realistic medieval fantasy oil painting, half-body portrait of a gentle young princess with warm brown skin and long dark hair adorned with a delicate gold tiara, wearing a rich crimson gown with white cream sleeves, holding a sealed love letter with red wax to her chest with both hands, luxurious palace chamber background with drapes and a window onto gardens, soft hopeful expression, warm natural light, painterly brushstrokes, 3:4 portrait composition.

## Dos de carte (Back)

> Ornate decorative pattern design, burgundy red background with baroque gold filigree scrollwork radiating symmetrically from a central circular medallion, inside medallion a golden sealed envelope with red wax seal imprinted with a heart motif, subtle fleur-de-lys motifs in each corner, tiled ornamental pattern framing, clean flat vector-like illustration suitable for card back, no text, 3:4 portrait orientation, rich detail.

---

## Variante si Midjourney/DALL-E refuse (éthique/cohérence)

Pour chaque personnage, insister sur "fantasy illustration for card game", "non-photorealistic", "painterly".

## Checklist après génération

- [ ] Toutes les cartes ont la même palette (parchemin en fond subtil, dominante bordeaux/or/vert sur les personnages)
- [ ] Prince et Roi sont distinguables (le Prince jeune + couronne fine, le Roi mûr + grosse couronne)
- [ ] Espionne et Garde sont distinguables (Espionne encapuchonnée et cachée, Garde en armure plein jour)
- [ ] La Princesse est lisible comme "la plus précieuse" (robe plus riche, aura de lumière)
- [ ] Le dos de carte contraste clairement avec le recto (bordeaux vs parchemin)

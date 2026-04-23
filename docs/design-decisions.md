# Design decisions — v1 solo vs bots

Défauts verrouillés le 2026-04-24. À ajuster après première itération testée.

## Direction visuelle

- **Inspiration** : cartes physiques Z-Man 2019 (peinture fantasy, cartouche rouge, bandeau titre, bordure sombre, texte effet en bas).
- **Fond table** : velours bordeaux `#3d0e13` avec vignettage.
- **Parchemin cartes** : `#f5e6c8` (beige chaud), dégradé subtil vers `#e8d4a8`.
- **Cartouche valeur** : `#8b1a1a` (bordeaux), chiffre or `#c9a96e`.
- **Or / accents UI** : `#c9a96e`.
- **Texte corps** : `#2a1810` sur parchemin, `#f5e6c8` sur fond table.
- **Dark mode** : pas de toggle — l'app est en permanence sombre (la table EST le dark).

## Typographie

- **Titres / valeurs cartes / nom cartes** : Cinzel (Google Font, serif gravé romain).
- **Effet cartes / corps UI** : Lora (Google Font, serif lisible).
- **UI chiffres/boutons discrets** : Geist Mono (déjà scaffoldé) pour codes de salle, compteurs.

## Cartes

- **Ratio** : poker 2.5×3.5 (≈ 0.71).
- **Illustrations v1** : icônes lucide-react dans un frame stylisé (Espionne = `Scroll`, Garde = `Shield`, Prêtre = `BookOpen`, Baron = `Swords`, Servante = `Home`, Prince = `Crown`, Chancelière = `Feather`, Roi = `Crown`, Comtesse = `Gem`, Princesse = `Heart`). Note : 2 Couronnes pour Prince et Roi, on différenciera par la couleur.
  - Prince = couronne claire/argent, Roi = couronne dorée.
- **Illustrations finales** : à générer via IA en phase polish (v2).
- **Dos de carte** : motif enveloppe stylisée + sceau en cire, centré, sur fond parchemin foncé.
- **Effet défausse** : carte pivote face visible avec slide vers la zone défausse.

## Layout de la table de jeu (mobile portrait)

- **Orientation** : portrait only (fixé via CSS `rotate` si rotation détectée).
- **Disposition pour N joueurs** (moi = bottom center) :
  - 2 joueurs : 1 adversaire en haut.
  - 3 joueurs : 2 adversaires en haut (left/right).
  - 4 joueurs : 1 adversaire à gauche (90°), 1 au centre haut, 1 à droite (90°).
  - 5-6 joueurs : v2 (scope v1 = 2-4).
- **Ma main** : bas de l'écran, 2 cartes étalées, tactiles ≥ 80×110 dp, visibles en entier.
- **Ma défausse** : sous ma main, stack horizontal compacté (scroll si > 5 cartes).
- **Pioche centrale** : au centre de la table, stack 3D avec compteur "N restantes".
- **Défausses adversaires** : à côté de chaque avatar en éventail compact.
- **Jetons d'affection** : cœurs rouges + compteur numérique à côté de chaque avatar.

## Lobby / accueil

- **Page accueil** : logo + 3 CTA : "Jouer contre des bots" / "Créer une partie en ligne" (v2) / "Rejoindre" (v2).
- **Flow solo** : 1 écran → choisir nombre total de joueurs (2/3/4) → choisir pseudo → lancer.
- **Bots** : noms générés (Alice, Bob, Charlie), avatar couleur auto.

## Animations

- **Intensité** : fluide mais sobre, respecte `prefers-reduced-motion`.
- **Transitions clés** :
  - Carte piochée : slide depuis la pioche vers la main.
  - Carte défaussée : flip + slide vers la zone défausse.
  - Élimination : carte shake puis fade out.
  - Transition de tour : glow doré pulsant sur le joueur actif.
- **Sons** : aucun en v1.
- **Vibration tactile** : courte pulsation (10ms) au début de mon tour (via `navigator.vibrate`).

## Feedback utilisateur

- **Tour actif** : bordure dorée pulsante autour de la zone du joueur + banner "À toi de jouer".
- **Log des actions** : toasts sonner pour chaque événement + drawer "Historique" accessible via icône 📜.
- **Choix de cible** : tap carte → popup "Choisir une cible" avec avatars cliquables.
- **Garde** : popup avec grille des 8 valeurs (0=Espionne, 2→9). Affiche les cartes déjà défaussées par adversaire pour aider.
- **Chancelière** : popup "Garde 1 carte / réordonne les 2 autres sous la pioche" avec drag & drop ou boutons ↑↓.
- **Comtesse obligatoire** : toast info + badge sur la Comtesse, l'autre carte désactivée.

## Écrans de fin

- **Fin de manche** : modal avec révélation de toutes les mains, gagnant·e surligné·e, raison (survivor / max value / bonus Espionne), bouton "Manche suivante".
- **Fin de partie** : modal célébration podium avec jetons finaux de chaque joueur, bouton "Rejouer" / "Retour accueil".

## État éliminé en cours de manche

- Vue spectateur : table continue à s'animer, **mains adverses restent cachées** (respect info privée), ma main grisée visible, overlay "Éliminé·e — en attente de la prochaine manche".

## Aide

- Icône **?** en haut à droite → drawer avec les règles markdown (contenu = docs/rules.md).
- Tap long sur une carte → popup avec effet détaillé.
- Pas de tutoriel first-launch pour v1.

## Langue

- FR uniquement v1. Nom des cartes en FR (Garde, Prêtre, Espionne...).

## Accessibilité

- Ne **jamais** utiliser la couleur seule (toujours couleur + icône/forme/label).
- Respecter `prefers-reduced-motion`.
- Targets tactiles ≥ 44dp.
- Contraste WCAG AA minimum sur texte.

## Bots (v1)

- **Nombre** : 1 à 3 bots selon le nombre total de joueurs choisi.
- **IA** : heuristique simple, pas de ML :
  - Si main contient Comtesse + (Roi ou Prince) → défausser Comtesse.
  - Sinon, jouer la carte de valeur la plus basse **sauf** Princesse (jamais jouée volontairement, sauf forcé) et **sauf** Espionne (gardée si possible pour bonus fin de manche).
  - Cibles : aléatoire pondéré (éviter joueurs protégés par Servante, préférer joueurs avec défausse incluant Princesse par bluff léger).
  - Garde : deviner une valeur aléatoire parmi cartes non encore défaussées, pondérée par probabilité.
  - Chancelière : garder la plus haute carte, remettre les 2 autres en ordre aléatoire.
- **Timing** : 800-1500ms entre chaque action bot pour que le joueur suive.

## Scope explicitement exclu v1

- Pas de multi temps réel.
- Pas de Pusher, pas d'Upstash Redis.
- Pas de lobby multijoueur.
- Pas de persistance entre sessions (refresh = nouvelle partie).
- Pas de 5-6 joueurs.
- Pas de PWA.
- Pas de chat.
- Pas de spectateurs externes.
- Pas d'illustrations finales (icônes lucide en placeholder).

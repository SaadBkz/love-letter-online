import {
  Scroll,
  Shield,
  BookOpen,
  Swords,
  Home,
  Crown,
  Feather,
  Gem,
  Heart,
  type LucideIcon,
} from 'lucide-react';
import type { CardKind } from '@/lib/game';
import { CARD_NAME_FR, CARD_VALUE } from '@/lib/game';

export interface CardVisual {
  icon: LucideIcon;
  /** Couleur dominante de l'illustration (hex). */
  hue: string;
  /** Courte description de l'effet pour le pied de la carte. */
  effect: string;
}

export const CARD_VISUALS: Record<CardKind, CardVisual> = {
  Spy: {
    icon: Scroll,
    hue: '#6b4226',
    effect:
      'Aucun effet à la défausse. En fin de manche, si un·e seul·e survivant·e a joué au moins une Espionne, il/elle gagne +1 jeton.',
  },
  Guard: {
    icon: Shield,
    hue: '#2a3a5a',
    effect:
      'Désigne un·e joueur·se et nomme une carte autre que Garde. Si la main correspond, la cible est éliminée.',
  },
  Priest: {
    icon: BookOpen,
    hue: '#7a1e6b',
    effect: 'Regarde secrètement la main d\'un·e autre joueur·se.',
  },
  Baron: {
    icon: Swords,
    hue: '#3d3d3d',
    effect:
      'Compare ta main avec celle d\'un·e autre joueur·se. La plus basse est éliminée. Égalité : rien.',
  },
  Handmaid: {
    icon: Home,
    hue: '#8b4a18',
    effect: 'Tu es protégé·e jusqu\'à ton prochain tour : aucune carte adverse ne peut te cibler.',
  },
  Prince: {
    icon: Crown,
    hue: '#8b8b8b',
    effect:
      'Désigne un·e joueur·se (toi-même autorisé). Défausse sa main sans effet, puis pioche. Princesse défaussée = éliminé·e.',
  },
  Chancellor: {
    icon: Feather,
    hue: '#1a4e3c',
    effect:
      'Pioche 2 cartes. Garde 1 en main, replace les 2 autres sous la pioche dans l\'ordre de ton choix.',
  },
  King: {
    icon: Crown,
    hue: '#c9a96e',
    effect: 'Échange ta main avec celle d\'un·e autre joueur·se non protégé·e.',
  },
  Countess: {
    icon: Gem,
    hue: '#4b1d6a',
    effect:
      'Aucun effet. Si tu as la Comtesse ET (Roi OU Prince) en main, tu dois défausser la Comtesse.',
  },
  Princess: {
    icon: Heart,
    hue: '#d43a5a',
    effect: 'Si tu défausses la Princesse pour n\'importe quelle raison, tu es éliminé·e.',
  },
};

export function cardDisplayName(kind: CardKind): string {
  return `${CARD_VALUE[kind]} · ${CARD_NAME_FR[kind]}`;
}

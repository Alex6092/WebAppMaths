import type { Theme } from './types';

/** L'ambiance de l'app du CP (« Maths Magiques »), avec ses 12 récompenses. */
export const royaumeMagique: Theme = {
  id: 'royaume-magique',
  name: 'Royaume magique',
  description: 'Châteaux, flocons et créatures enchantées.',
  appTitle: '✨ Le Royaume magique ✨',
  mascot: '🦄',
  banner: '🏰❄️🦁',
  suggestedGrades: ['CP', 'CE1'],
  unlockCost: 0,
  // 🪙 n'existe pas dans la police emoji de Windows 10 : on garde un emoji plus ancien.
  currency: { singular: 'pièce', plural: 'pièces', icon: '💰' },
  colors: {
    primary: '#7b1fa2',
    primaryDark: '#4a148c',
    primarySoft: '#ce93d8',
    accent: '#f57f17',
    accentDark: '#e65100',
    background: 'linear-gradient(135deg, #e8f4fd 0%, #fce4ec 50%, #e8f5e9 100%)',
    surface: '#ffffff',
    text: '#311b92',
    textSoft: '#6a5a8c',
  },
  rewards: [
    { id: 'r1', name: 'Flocon magique', icon: '❄️', cost: 10 },
    { id: 'r2', name: 'Étoile brillante', icon: '⭐', cost: 15 },
    { id: 'r3', name: 'Lion courageux', icon: '🦁', cost: 25 },
    { id: 'r4', name: 'Château enchanté', icon: '🏰', cost: 35 },
    { id: 'r5', name: 'Rose de la forêt', icon: '🌹', cost: 50 },
    { id: 'r6', name: 'Couronne de reine', icon: '👑', cost: 70 },
    { id: 'r7', name: 'Miroir magique', icon: '🪞', cost: 90 },
    { id: 'r8', name: 'Cœur de glace', icon: '💎', cost: 120 },
    { id: 'r9', name: 'Baguette féerique', icon: '🪄', cost: 160 },
    { id: 'r10', name: 'Arc-en-ciel', icon: '🌈', cost: 200 },
    { id: 'r11', name: 'Licorne', icon: '🦄', cost: 250 },
    { id: 'r12', name: 'Dragon doré', icon: '🐉', cost: 350 },
  ],
};

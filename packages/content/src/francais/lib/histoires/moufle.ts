import type { Story } from './index';

export const moufle: Story = {
  id: 'moufle',
  title: 'La moufle',
  icon: '🧤',
  level: 1,
  source: 'conte traditionnel d’Ukraine',
  text: [
    'Un jour d’hiver, un petit garçon perd sa moufle dans la neige. Une souris la trouve et se glisse dedans : il y fait bien chaud !',
    'Une grenouille arrive : « Je peux entrer ? » « Oui ! » Puis viennent un lapin, un renard et même un gros ours. Tout le monde se serre dans la moufle.',
    'Enfin, un tout petit grillon veut entrer aussi. Il pousse, il pousse… Crac ! La moufle se déchire, et tous les animaux tombent dans la neige.',
  ],
  questions: [
    {
      ask: 'Quand se passe l’histoire ?',
      answer: '❄️ en hiver',
      wrong: ['☀️ en été', '🍂 en automne'],
      proof: 'Un jour d’hiver',
    },
    {
      ask: 'Qui perd sa moufle ?',
      answer: '👦 un petit garçon',
      wrong: ['👵 une grand-mère', '🐻 un ours'],
      proof: 'un petit garçon perd sa moufle',
    },
    {
      ask: 'Qui entre le premier dans la moufle ?',
      answer: '🐭 une souris',
      wrong: ['🐸 une grenouille', '🐰 un lapin'],
      proof: 'Une souris la trouve',
    },
    {
      ask: 'Quel est le plus gros animal dans la moufle ?',
      answer: '🐻 l’ours',
      wrong: ['🦊 le renard', '🐰 le lapin'],
      proof: 'même un gros ours',
    },
    {
      ask: 'Qui fait craquer la moufle ?',
      answer: '🦗 un grillon',
      wrong: ['🐻 l’ours', '🐭 la souris'],
      proof: 'un tout petit grillon',
    },
    {
      ask: 'Où tombent les animaux à la fin ?',
      answer: '❄️ dans la neige',
      wrong: ['💧 dans l’eau', '🏠 dans une maison'],
      proof: 'tombent dans la neige',
    },
  ],
};

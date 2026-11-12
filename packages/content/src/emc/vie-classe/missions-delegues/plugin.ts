import { defineLevels, definePlugin } from '@app/core';
import { DELEGATE_NOTION } from '../../domains';

interface Situation {
  question: string;
  right: string;
  wrong: [string, string];
  explanation: string;
}

const MISSIONS: Situation[] = [
  {
    question: 'Quel mot décrit le rôle d’un délégué de classe ?',
    right: 'Porte-parole',
    wrong: ['Chef de classe', 'Arbitre'],
    explanation: 'Le délégué transmet les idées de ses camarades et leur rapporte les décisions.',
  },
  {
    question: 'Qui un délégué représente-t-il ?',
    right: 'Tous les élèves de la classe',
    wrong: ['Ses amis seulement', 'Les élèves qui ont voté pour lui'],
    explanation:
      'Un délégué représente toute la classe, même les élèves qui ont voté pour quelqu’un d’autre.',
  },
  {
    question: 'Où discuter d’un projet pour sa propre classe ?',
    right: 'Au conseil de classe',
    wrong: ['Au conseil des délégués de l’école', 'À la cantine'],
    explanation: 'Au conseil de classe, on discute des idées et des projets de sa classe.',
  },
  {
    question: 'Où les délégués de plusieurs classes discutent-ils des projets pour l’école ?',
    right: 'Au conseil des délégués de l’école',
    wrong: ['Au conseil d’une seule classe', 'Dans la file de la cantine'],
    explanation:
      'Le conseil des délégués de l’école réunit les représentants de plusieurs classes.',
  },
  {
    question: 'Après un conseil, que fait un délégué ?',
    right: 'Il explique à sa classe les décisions prises.',
    wrong: [
      'Il change les décisions selon ses goûts.',
      'Il en parle seulement à son meilleur ami.',
    ],
    explanation: 'Le délégué rapporte à toute la classe les décisions et les projets discutés.',
  },
  {
    question: 'Quelle attitude aide un délégué à recueillir les idées de ses camarades ?',
    right: 'Écouter chacun jusqu’au bout.',
    wrong: ['Écouter seulement ceux qui parlent fort.', 'Interrompre ceux qui hésitent.'],
    explanation: 'Un délégué bienveillant laisse le temps à chaque élève de s’exprimer.',
  },
];

const SITUATIONS: Situation[] = [
  {
    question: 'Un camarade propose un jeu auquel tu n’as jamais joué. Que fais-tu ?',
    right: 'Je l’écoute et je note son idée.',
    wrong: ['Je passe tout de suite à mon idée.', 'Je choisis seulement les jeux que je connais.'],
    explanation: 'Être à l’écoute aide à recueillir toutes les propositions.',
  },
  {
    question: 'Le conseil de classe a lieu demain. Comment te prépares-tu ?',
    right: 'Je relis les propositions notées et je prépare ce que je vais dire.',
    wrong: ['Je laisse mes notes à la maison.', 'Je prépare seulement mon idée préférée.'],
    explanation:
      'Un délégué organisé prépare le conseil pour pouvoir présenter les idées de la classe.',
  },
  {
    question: 'Tu présentes une idée de Lina. Comment la rapportes-tu ?',
    right: 'Je redis son idée fidèlement.',
    wrong: ['Je change son idée pour qu’elle me plaise.', 'Je dis que cette idée vient de moi.'],
    explanation:
      'Le porte-parole respecte les paroles de ses camarades quand il transmet leurs idées.',
  },
  {
    question: 'Un élève te dit qu’il a peur de venir à l’école. Que fais-tu ?',
    right: 'Je l’écoute et je demande l’aide d’un adulte de confiance.',
    wrong: [
      'Je raconte son souci à toute la classe.',
      'Je lui promets de garder son souci pour moi.',
    ],
    explanation:
      'Un souci qui inquiète mérite l’aide d’un adulte. On peut proposer au camarade de l’accompagner.',
  },
  {
    question: 'Deux élèves proposent des choses différentes. Que fais-tu au conseil ?',
    right: 'Je présente leurs deux idées avec respect.',
    wrong: ['Je présente seulement celle de mon ami.', 'Je décide à la place de toute la classe.'],
    explanation:
      'Le délégué représente tous les élèves et permet de discuter de leurs propositions.',
  },
  {
    question: 'Tu veux parler pendant que quelqu’un présente son projet. Que fais-tu ?',
    right: 'J’attends mon tour, puis je parle poliment.',
    wrong: ['Je parle plus fort pour qu’on m’entende.', 'Je coupe la parole pour finir plus vite.'],
    explanation: 'Au conseil, attendre son tour permet à chacun de parler et d’être entendu.',
  },
];

export default definePlugin('mcq', {
  id: 'emc.vie-classe.missions-delegues',
  version: 1,
  title: 'Que fait un délégué de classe ?',
  icon: '🏫',
  notions: [DELEGATE_NOTION],
  expectedLevel: 2,
  levels: defineLevels([
    { label: 'Les missions et les conseils', grade: 'CE1', params: { situations: false } },
    { label: 'Dans la vie de classe', grade: 'CE1', params: { situations: true } },
  ]),
  minVariety: 6,

  generate({ rng, params }) {
    const situation = rng.pick(params.situations ? SITUATIONS : MISSIONS);
    const choices = rng.shuffle([situation.right, ...situation.wrong]).map((label, index) => ({
      id: String(index),
      label,
    }));
    return {
      widget: 'mcq',
      instruction: 'LIS la question et COCHE la bonne réponse.',
      prompt: situation.question,
      choices,
      layout: 'list',
      multiple: false,
      data: {
        answer: choices.find(({ label }) => label === situation.right)!.id,
        explanation: situation.explanation,
      },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),
  explain: (q) => q.data.explanation,
  signature: (q) => q.prompt!,
});

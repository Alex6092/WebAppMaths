import { compareMatch, defineLevels, definePlugin } from '@app/core';
import { retry } from '../../../lib/numbers';
import { MOMENTS, type Moment } from '../../lib/conjugaison';
import { capitalize } from '../../lib/indicateurs';
import { assemble, buildSentence } from '../../lib/phrases';
import { verbsOfKinds } from '../../lib/verbes';

// « Relie en respectant le temps du verbe » : Dimanche prochain, — je regarderai un documentaire.

interface Params {
  /** Phrases par moment (passé, présent, futur). */
  perMoment: number;
}

interface Data {
  /** Le moment de chaque fin de phrase, dans l'ordre affiché. */
  moments: Moment[];
  /** Pour chaque indicateur, la fin de phrase avec laquelle il a été écrit. */
  links: number[];
}

export default definePlugin<'match', Params, Data>('match', {
  id: 'francais.conjugaison.relie-indicateur',
  version: 1,
  title: 'Relie l’indicateur et la phrase',
  description: 'Relie chaque indicateur de temps à une fin de phrase au bon temps.',
  icon: '🔗',
  notions: ['francais.conjugaison.indicateurs-temps', 'francais.conjugaison.bon-temps'],
  expectedLevel: 2,
  levels: defineLevels<Params>([
    { label: 'Trois phrases', grade: 'CE1', params: { perMoment: 1 } },
    { label: 'Six phrases', grade: 'CE1', params: { perMoment: 2 } },
  ]),

  generate({ rng, params }) {
    const verbs = verbsOfKinds(['regular', 'spelling', 'group2', 'irregular']);
    const moments = MOMENTS.flatMap((m) => Array<Moment>(params.perMoment).fill(m));
    // Des indicateurs et des verbes tous différents.
    const sentences = retry(
      () =>
        moments.map((moment) =>
          buildSentence(rng, { verbs, moment, indicator: 'start', lessonIndicators: true }),
        ),
      (ss) =>
        new Set(ss.map((s) => s.indicator?.text)).size === ss.length &&
        new Set(ss.map((s) => s.verb.inf)).size === ss.length,
    );
    const left = rng.shuffle(sentences.map((_, i) => i));
    const right = rng.shuffle(sentences.map((_, i) => i));
    // La fin de phrase, sans l'indicateur : la majuscule ne reste qu'aux prénoms.
    const ending = (i: number) => {
      const s = sentences[i]!;
      const { text } = assemble({ ...s.pieces, indicator: null });
      return s.subject.kind === 'name' ? text : text.charAt(0).toLowerCase() + text.slice(1);
    };
    return {
      widget: 'match',
      instruction:
        'RELIE chaque indicateur de temps à une fin de phrase, en respectant le temps du verbe.',
      columns: [
        { cards: left.map((i) => ({ text: `${capitalize(sentences[i]!.indicator!.text)},` })) },
        { cards: right.map((i) => ({ text: ending(i) })) },
      ],
      data: {
        moments: right.map((i) => sentences[i]!.moment),
        links: left.map((i) => right.indexOf(i)),
      },
    };
  },

  solve: (q) => ({ links: [[...q.data.links]] }),

  // Deux fins de phrase au même temps vont aussi bien l'une que l'autre.
  check: (q, answer) =>
    compareMatch(
      { links: [q.data.links] },
      answer,
      (_c, a, b) => q.data.moments[a] === q.data.moments[b],
    ),

  explain: () =>
    'Regarde l’indicateur de temps : hier ou autrefois vont avec le passé, aujourd’hui avec le présent, demain avec le futur.',

  signature: (q) => q.columns[0]!.cards.map((c) => c.text).join('|'),
});

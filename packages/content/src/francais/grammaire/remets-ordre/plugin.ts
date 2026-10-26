import {
  compareOrder,
  defineLevels,
  definePlugin,
  type OrderTile,
  type Rng,
  type WordToken,
} from '@app/core';
import { simpleSentence } from '../../lib/phrase-defauts';
import type { Role } from '../../lib/phrases';

// Leçon « La phrase » : l'ordre des mots est important pour le sens.

interface Params {
  /** Étiquettes par groupes (« le petit chat ») plutôt que mot par mot. */
  grouped: boolean;
  indicator: boolean;
}

interface Data {
  /** Le bon ordre : numéros des étiquettes. */
  order: number[];
  /** Un autre ordre juste : l'indicateur de la fin placé juste après le verbe. */
  alt: number[] | null;
  text: string;
}

/**
 * Les étiquettes dans le bon ordre, avec le rôle de chacune : mot par mot ou par groupes ;
 * l'indicateur garde sa virgule.
 */
function pieces(
  tokens: readonly WordToken[],
  roles: readonly Role[],
  grouped: boolean,
): { tiles: OrderTile[]; tileRoles: Role[] } {
  const tiles: OrderTile[] = [];
  const tileRoles: Role[] = [];
  tokens.forEach((token, i) => {
    const last = tiles[tiles.length - 1];
    if (token.text === ',' && last) last.text += ',';
    else if (grouped && last && roles[i - 1] === roles[i] && !last.text.endsWith(','))
      last.text += ` ${token.text}`;
    else {
      tiles.push(token.text === '.' ? { text: '.', glue: true } : { text: token.text });
      tileRoles.push(roles[i]!);
    }
  });
  return { tiles, tileRoles };
}

/** « Adam fabriquera mercredi prochain une cabane. » : l'indicateur de la fin après le verbe. */
function indicatorAfterVerb(roles: readonly Role[]): number[] | null {
  const at = (role: Role) => roles.flatMap((r, k) => (r === role ? [k] : []));
  const indicator = at('indicator');
  if (indicator.length === 0 || indicator[0]! < at('compl')[0]!) return null;
  return [...at('subject'), ...at('verb'), ...indicator, ...at('compl'), ...at('punct')];
}

/** Un ordre mélangé, différent du bon. */
function shuffled(rng: Rng, n: number): number[] {
  const identity = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < 20; i++) {
    const perm = rng.shuffle(identity);
    if (perm.some((p, k) => p !== k)) return perm;
  }
  return identity.reverse();
}

export default definePlugin<'order', Params, Data>('order', {
  id: 'francais.grammaire.remets-ordre',
  version: 1,
  title: 'Remets les mots dans l’ordre',
  description: 'Touche les étiquettes pour écrire la phrase.',
  icon: '🧩',
  notions: ['francais.grammaire.ordre-mots'],
  expectedLevel: 3,
  levels: defineLevels<Params>([
    { label: 'Par groupes de mots', grade: 'CE1', params: { grouped: true, indicator: false } },
    { label: 'Mot par mot', grade: 'CE1', params: { grouped: false, indicator: false } },
    {
      label: 'Mot par mot, avec un indicateur de temps',
      grade: 'CE1',
      params: { grouped: false, indicator: true },
    },
  ]),

  generate({ rng, params }) {
    // Pas de sujet à deux prénoms : « Léa et Tom » s'écrit aussi « Tom et Léa ».
    let s = simpleSentence(rng, params.indicator);
    for (let i = 0; i < 20 && s.subject.text.includes(' et '); i++)
      s = simpleSentence(rng, params.indicator);
    const { tiles: ordered, tileRoles } = pieces(s.tokens, s.roles, params.grouped);
    // perm[i] : l'étiquette bien rangée montrée à la place i.
    const perm = shuffled(rng, ordered.length);
    const shown = (order: number[]) => order.map((k) => perm.indexOf(k));
    const alt = indicatorAfterVerb(tileRoles);
    return {
      widget: 'order',
      instruction: 'REMETS les mots dans l’ordre pour faire une phrase.',
      tiles: perm.map((k) => ({ ...ordered[k]! })),
      data: {
        order: shown(ordered.map((_, k) => k)),
        alt: alt && shown(alt),
        text: s.text,
      },
    };
  },

  solve: (q) => ({ order: [...q.data.order] }),

  check: (q, answer) =>
    compareOrder(q, q.data.alt ? [q.data.order, q.data.alt] : [q.data.order], answer),

  explain: (q) =>
    `La phrase : « ${q.data.text} » Elle commence par la majuscule et finit par le point.`,

  signature: (q) => q.data.text,
});

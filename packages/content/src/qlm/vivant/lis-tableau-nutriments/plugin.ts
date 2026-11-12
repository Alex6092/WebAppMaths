import { defineLevels, definePlugin } from '@app/core';
import { FAMILY_LABEL, FOOD_FAMILIES } from '../../lib/aliments';
import { NUTRIENT_FOODS, NUTRIENT_TABLE_NOTION, NUTRIENTS } from '../../lib/nutriments';

export default definePlugin('mcq', {
  id: 'qlm.vivant.lis-tableau-nutriments',
  version: 1,
  title: 'Lis le tableau des aliments',
  icon: '🥗',
  notions: [NUTRIENT_TABLE_NOTION],
  expectedLevel: 2,
  levels: defineLevels([
    { label: 'Trouve l’aliment le plus riche', grade: 'CE1', params: { family: false } },
    { label: 'Retrouve sa famille', grade: 'CE1', params: { family: true } },
  ]),

  generate({ rng, params }) {
    const column = rng.int(0, NUTRIENTS.length - 1);
    const nutrient = NUTRIENTS[column]!;
    // On construit un maximum unique en tirant les deux autres aliments parmi les valeurs inférieures.
    const eligible = NUTRIENT_FOODS.filter(
      (food) =>
        NUTRIENT_FOODS.filter((other) => other.values[column]! < food.values[column]!).length >= 2,
    );
    const best = rng.pick(eligible);
    const amount = best.values[column]!;
    const smaller = NUTRIENT_FOODS.filter((food) => food.values[column]! < amount);
    const foods = rng.shuffle([best, ...rng.sample(smaller, 2)]);
    const families = rng.shuffle([
      best.family,
      ...rng.sample(
        FOOD_FAMILIES.filter((family) => family !== best.family),
        2,
      ),
    ]);
    return {
      widget: 'mcq',
      instruction: 'LIS le tableau et COCHE la bonne réponse.',
      prompt: params.family
        ? `À quelle famille appartient l’aliment le plus riche en ${nutrient.label} ?`
        : `Quel aliment est le plus riche en ${nutrient.label} ?`,
      choices: params.family
        ? families.map((family) => ({ id: family, label: FAMILY_LABEL[family] }))
        : foods.map(({ name }) => ({ id: name, label: name })),
      table: {
        caption: 'Valeurs illustratives pour 100 grammes de chaque aliment',
        rowHeading: 'Aliment',
        columns: [...NUTRIENTS],
        rows: foods.map(({ name, values }) => ({ label: name, values: values.map(String) })),
      },
      multiple: false,
      layout: 'list',
      data: {
        column,
        amount,
        name: best.name,
        family: best.family,
        answer: params.family ? best.family : best.name,
      },
    };
  },

  solve: (q) => ({ selected: [q.data.answer] }),
  explain(q) {
    const { column, name, amount, family } = q.data;
    const { label, unit } = NUTRIENTS[column]!;
    return `Dans la colonne ${label}, la plus grande valeur est ${amount} ${unit.symbol}. C’est celle de l’aliment « ${name} », de la famille « ${FAMILY_LABEL[family]} ».`;
  },
  signature: (q) =>
    `${q.data.column}:${q
      .table!.rows.map(({ label }) => label)
      .sort()
      .join('|')}`,
});

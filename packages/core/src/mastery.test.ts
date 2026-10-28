import { describe, expect, it } from 'vitest';
import {
  masteryByNotion,
  mixablePlugins,
  notionMastery,
  pickMixPlugin,
  type AttemptRecord,
} from './mastery';
import { definePlugin, type AnyPlugin } from './plugin';
import { createRng } from './rng';

const expected = () => 4;
const attempt = (level: number, firstTryCorrect: boolean, solved = firstTryCorrect) =>
  ({ pluginId: 'p', level, firstTryCorrect, solved }) satisfies AttemptRecord;
const repeat = (n: number, r: AttemptRecord) => Array.from({ length: n }, () => r);

describe('maîtrise par notion', () => {
  it('commence « à découvrir »', () => {
    expect(notionMastery([], expected)).toEqual({ mastery: 0, status: 'new', attempts: 0 });
  });

  it('est acquise après 8 réussites sur les 10 dernières au niveau attendu', () => {
    const records = [...repeat(2, attempt(4, false)), ...repeat(8, attempt(4, true))];
    expect(notionMastery(records, expected).status).toBe('A');
    expect(notionMastery(records.slice(0, 9), expected).status).not.toBe('A');
  });

  it('compte moins les réussites à un niveau facile', () => {
    const easy = notionMastery(repeat(10, attempt(1, true)), expected);
    const hard = notionMastery(repeat(10, attempt(4, true)), expected);
    expect(easy).toMatchObject({ mastery: 25, status: 'NA' });
    expect(hard).toMatchObject({ mastery: 100, status: 'A' });
  });

  it('donne plus de poids aux tentatives récentes', () => {
    const better = notionMastery(
      [...repeat(5, attempt(4, false)), ...repeat(5, attempt(4, true))],
      expected,
    );
    const worse = notionMastery(
      [...repeat(5, attempt(4, true)), ...repeat(5, attempt(4, false))],
      expected,
    );
    expect(better.mastery).toBeGreaterThan(worse.mastery);
    expect(better.status).toBe('ECA');
    expect(worse.status).toBe('NA');
  });

  it('regroupe les tentatives des exercices d’une notion', () => {
    const plugins = [
      { id: 'a', notions: ['n1'], levels: [{}, {}], expectedLevel: 2 },
      { id: 'b', notions: ['n1', 'n2'], levels: [{}, {}] },
    ] as unknown as AnyPlugin[];
    const records = [
      { pluginId: 'a', level: 2, firstTryCorrect: true, solved: true },
      { pluginId: 'b', level: 1, firstTryCorrect: true, solved: true },
    ];
    const result = masteryByNotion(records, plugins, ['n1', 'n2', 'n3']);
    expect(result.n1).toMatchObject({ attempts: 2 });
    expect(result.n2).toMatchObject({ attempts: 1, mastery: 50 });
    expect(result.n3).toMatchObject({ status: 'new' });
  });
});

describe('mélange', () => {
  const make = (id: string, notion: string) =>
    definePlugin('number-input', {
      id,
      version: 1,
      title: id,
      notions: [notion],
      levels: [{ label: '', grade: 'CE1', params: {} }],
      generate: () => ({ widget: 'number-input', instruction: '', prompt: '{?}', data: {} }),
      solve: () => ({ value: '1' }),
    }) as AnyPlugin;
  const weak = make('weak', 'n1');
  const strong = make('strong', 'n2');

  it('choisit plus souvent les notions faibles et ne répète pas l’exercice précédent', () => {
    const rng = createRng(42);
    const masteries = {
      n1: { mastery: 10, status: 'NA' as const, attempts: 5 },
      n2: { mastery: 100, status: 'A' as const, attempts: 20 },
    };
    let weakCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (pickMixPlugin(rng, [weak, strong], ['n1', 'n2'], masteries).id === 'weak') weakCount++;
    }
    expect(weakCount).toBeGreaterThan(700);
    expect(pickMixPlugin(rng, [weak, strong], ['n1', 'n2'], masteries, 'weak').id).toBe('strong');
    expect(pickMixPlugin(rng, [weak], ['n1'], masteries, 'weak').id).toBe('weak');
  });

  it('laisse de côté un exercice trop long, sauf s’il n’y a que lui', () => {
    const story = { ...make('story', 'n3'), inMix: false } as AnyPlugin;
    expect(mixablePlugins([weak, story, strong]).map((p) => p.id)).toEqual(['weak', 'strong']);
    expect(mixablePlugins([story]).map((p) => p.id)).toEqual(['story']);
  });
});

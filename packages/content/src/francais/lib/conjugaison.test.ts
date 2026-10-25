import { describe, expect, it } from 'vitest';
import {
  acceptedForms,
  conjugate,
  PERSONS,
  verbKind,
  withSubject,
  type Tense,
} from './conjugaison';
import { VERBS } from './verbes';

const table = (verb: string, tense: Tense) =>
  PERSONS.map((p) => conjugate(verb, tense, p)).join(' ');

describe('conjugaison', () => {
  it('1er groupe régulier', () => {
    expect(table('chanter', 'present')).toBe('chante chantes chante chantons chantez chantent');
    expect(table('chanter', 'imparfait')).toBe(
      'chantais chantais chantait chantions chantiez chantaient',
    );
    expect(table('chanter', 'futur')).toBe(
      'chanterai chanteras chantera chanterons chanterez chanteront',
    );
    expect(table('crier', 'imparfait')).toBe('criais criais criait criions criiez criaient');
  });

  it('variantes d’orthographe du 1er groupe', () => {
    expect(table('manger', 'present')).toBe('mange manges mange mangeons mangez mangent');
    expect(table('manger', 'imparfait')).toBe(
      'mangeais mangeais mangeait mangions mangiez mangeaient',
    );
    expect(table('lancer', 'present')).toBe('lance lances lance lançons lancez lancent');
    expect(conjugate('commencer', 'imparfait', 5)).toBe('commençaient');
    expect(table('lever', 'present')).toBe('lève lèves lève levons levez lèvent');
    expect(conjugate('lever', 'futur', 0)).toBe('lèverai');
    expect(table('acheter', 'present')).toBe('achète achètes achète achetons achetez achètent');
    expect(table('appeler', 'present')).toBe('appelle appelles appelle appelons appelez appellent');
    expect(conjugate('jeter', 'futur', 3)).toBe('jetterons');
    expect(table('répéter', 'present')).toBe('répète répètes répète répétons répétez répètent');
    expect(acceptedForms('répéter', 'futur', 2)).toEqual(['répétera', 'répètera']);
    expect(table('nettoyer', 'present')).toBe(
      'nettoie nettoies nettoie nettoyons nettoyez nettoient',
    );
    expect(conjugate('nettoyer', 'futur', 0)).toBe('nettoierai');
    expect(table('chercher', 'present')).toBe(
      'cherche cherches cherche cherchons cherchez cherchent',
    );
    expect(conjugate('préparer', 'present', 0)).toBe('prépare');
  });

  it('2e groupe et irréguliers', () => {
    expect(table('finir', 'present')).toBe('finis finis finit finissons finissez finissent');
    expect(conjugate('finir', 'imparfait', 2)).toBe('finissait');
    expect(conjugate('finir', 'futur', 1)).toBe('finiras');
    expect(table('être', 'imparfait')).toBe('étais étais était étions étiez étaient');
    expect(table('aller', 'futur')).toBe('irai iras ira irons irez iront');
    expect(conjugate('faire', 'imparfait', 3)).toBe('faisions');
    expect(conjugate('voir', 'imparfait', 0)).toBe('voyais');
    expect(conjugate('apprendre', 'present', 5)).toBe('apprennent');
    expect(conjugate('venir', 'futur', 2)).toBe('viendra');
    expect(conjugate('construire', 'present', 5)).toBe('construisent');
  });

  it('élision de « je »', () => {
    expect(withSubject('je', 'aime')).toBe("j'aime");
    expect(withSubject('Je', 'habite')).toBe("J'habite");
    expect(withSubject('je', 'range')).toBe('je range');
  });

  it('classe les verbes par difficulté', () => {
    expect(verbKind('jouer')).toBe('regular');
    expect(verbKind('manger')).toBe('spelling');
    expect(verbKind('finir')).toBe('group2');
    expect(verbKind('prendre')).toBe('irregular');
  });

  it('sait conjuguer tous les verbes de la banque', () => {
    for (const verb of VERBS) {
      for (const tense of ['present', 'imparfait', 'futur'] as const) {
        for (const p of PERSONS)
          expect(conjugate(verb.inf, tense, p)).toMatch(/^[a-zçéèêëîïôûù]+$/);
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { questionSpeech } from './engine';
import type { PluginQuestion } from './question';

const mcq = (extra: object): PluginQuestion =>
  ({
    widget: 'mcq',
    instruction: 'COCHE le bon jour.',
    prompt: 'Quel jour vient après samedi ?',
    choices: [
      { id: '0', label: 'lundi' },
      { id: '6', label: 'dimanche' },
    ],
    multiple: false,
    data: null,
    ...extra,
  }) as PluginQuestion;

describe('ce que dit le bouton 🔊', () => {
  it('enchaîne consigne, question et choix sans point en trop', () => {
    expect(questionSpeech(mcq({}))).toBe(
      'COCHE le bon jour. Quel jour vient après samedi ? lundi, dimanche',
    );
  });

  it('ne lit pas en français ce qu’il faut écouter en anglais', () => {
    expect(questionSpeech(mcq({ listen: 'a rabbit', listenLang: 'en-GB' }))).not.toContain(
      'rabbit',
    );
    expect(questionSpeech(mcq({ listen: 'une carte… une carte.' }))).toContain(
      'COCHE le bon jour. une carte… une carte. Quel jour',
    );
  });
});

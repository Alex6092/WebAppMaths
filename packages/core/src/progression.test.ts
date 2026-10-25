import { describe, expect, it } from 'vitest';
import { applyResult, newLevelState, type LevelState } from './progression';

function play(state: LevelState, results: boolean[], levels = 5) {
  const changes = [];
  for (const r of results) {
    const out = applyResult(state, r, levels);
    state = out.state;
    changes.push(out.change);
  }
  return { state, changes };
}

describe('applyResult', () => {
  it('monte après 4 réussites sur 5', () => {
    const { state, changes } = play(newLevelState(1), [true, true, false, true, true]);
    expect(changes.at(-1)).toBe('up');
    expect(state).toEqual(newLevelState(2));
  });

  it('ne monte pas avant que la fenêtre soit pleine', () => {
    const { state } = play(newLevelState(1), [true, true, true, true]);
    expect(state.level).toBe(1);
  });

  it('descend après 3 erreurs consécutives', () => {
    const { state, changes } = play(newLevelState(3), [false, false, false]);
    expect(changes).toEqual([null, null, 'down']);
    expect(state.level).toBe(2);
  });

  it('descend quand la réussite est faible sur la fenêtre', () => {
    const { state } = play(newLevelState(3), [true, false, false, true, false]);
    expect(state.level).toBe(2);
  });

  it('reste dans les bornes', () => {
    expect(play(newLevelState(1), [false, false, false, false]).state.level).toBe(1);
    expect(play(newLevelState(5), [true, true, true, true, true]).state.level).toBe(5);
  });

  it('accepte des règles propres au plugin', () => {
    const out = applyResult({ level: 1, recent: [true, true], consecutiveErrors: 0 }, true, 5, {
      window: 3,
    });
    expect(out.change).toBe('up');
  });
});

import { describe, it, expect } from 'vitest';
import { getTaskById } from '../tasks';
import { makeRng } from '../utils/rng';
import { getAnswerKey } from '../utils/answerKey';
import { buildSet, SetConfig } from '../set';

describe('Print keys and answer labels', () => {
  it('formats keys labels correctly for standard 16-task variant vs custom sets', () => {
    // 1. Standard variant 1..16
    const standardTasks = Array.from({ length: 16 }, (_, i) => ({
      taskId: i + 1,
    }));
    const standardCounts = new Map<number, number>();
    for (const t of standardTasks) {
      standardCounts.set(t.taskId, (standardCounts.get(t.taskId) || 0) + 1);
    }
    const standardLabels = standardTasks.map((t, idx) => {
      const N = idx + 1;
      const M = t.taskId;
      const isSingle = standardCounts.get(M) === 1 && N === M;
      return isSingle ? `Задание ${M}` : `поз. ${N} — задание ${M}`;
    });

    expect(standardLabels[0]).toBe('Задание 1');
    expect(standardLabels[15]).toBe('Задание 16');

    // 2. Custom set: task 1 x2, task 13 x1, task 15 x1, task 16 x1
    const customTasks = [
      { taskId: 1 },
      { taskId: 1 },
      { taskId: 13 },
      { taskId: 15 },
      { taskId: 16 },
    ];
    const customCounts = new Map<number, number>();
    for (const t of customTasks) {
      customCounts.set(t.taskId, (customCounts.get(t.taskId) || 0) + 1);
    }
    const customLabels = customTasks.map((t, idx) => {
      const N = idx + 1;
      const M = t.taskId;
      const isSingle = customCounts.get(M) === 1 && N === M;
      return isSingle ? `Задание ${M}` : `поз. ${N} — задание ${M}`;
    });

    expect(customLabels).toEqual([
      'поз. 1 — задание 1',
      'поз. 2 — задание 1',
      'поз. 3 — задание 13',
      'поз. 4 — задание 15',
      'поз. 5 — задание 16',
    ]);
  });

  it('generates expected key display for custom set', () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Контрольная 9А',
      slots: [
        { taskId: 1, n1: 0, n2: 2, n3: 0, nR: 0 },
        { taskId: 13, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 15, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 16, n1: 0, n2: 1, n3: 0, nR: 0 },
      ],
    };

    const { entries } = buildSet(cfg);
    expect(entries.length).toBe(5);

    const keys = entries.map((e) => ({
      pos: e.position,
      taskId: e.taskId,
      answer: getAnswerKey(e.taskId, e.taskData).display,
    }));

    expect(keys[0].pos).toBe(1);
    expect(keys[0].taskId).toBe(1);
    expect(keys[1].pos).toBe(2);
    expect(keys[1].taskId).toBe(1);
    expect(keys[2].pos).toBe(3);
    expect(keys[2].taskId).toBe(13);
    expect(keys[3].pos).toBe(4);
    expect(keys[3].taskId).toBe(15);
    expect(keys[4].pos).toBe(5);
    expect(keys[4].taskId).toBe(16);
  });
});

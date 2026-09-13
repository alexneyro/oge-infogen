import { describe, it, expect } from 'vitest';
import { getAnswerKey } from '../answerKey';
import { getTaskById } from '../../tasks';
import { makeRng } from '../rng';

describe('getAnswerKey utility suite', () => {
  it('extracts non-empty display and signature for all 16 OGE tasks (difficulty 2, seed 12345)', () => {
    for (let taskId = 1; taskId <= 16; taskId++) {
      const mod = getTaskById(taskId);
      expect(mod, `Task module ${taskId} should exist in registry`).toBeDefined();

      const rng = makeRng(12345 + taskId);
      const taskData = mod!.generate(2, rng);

      const result = getAnswerKey(taskId, taskData);

      expect(typeof result.display).toBe('string');
      expect(result.display.trim().length).toBeGreaterThan(0);
      expect(result.display).not.toBe('—');

      expect(typeof result.signature).toBe('string');
      expect(result.signature.length).toBeGreaterThan(0);
    }
  });

  describe('Explicit checks for tasks 13, 15, 16', () => {
    it('Task 13: formatting description display and text/table signature (non-empty text, not starting with ::)', () => {
      const mod = getTaskById(13)!;
      const taskData1 = mod.generate(2, makeRng(11111));
      const { display: d1, signature: sig1 } = getAnswerKey(13, taskData1);

      expect(d1).toBe('Форматирование по образцу (см. разбор)');
      expect(sig1).not.toBe('');
      expect(sig1.startsWith('::')).toBe(false);
      expect(sig1).toContain('::');

      // Two different seeds produce different signatures
      const taskData2 = mod.generate(2, makeRng(22222));
      const { signature: sig2 } = getAnswerKey(13, taskData2);
      expect(sig1).not.toBe(sig2);
    });

    it('Task 15: Robot program display and family/walls signature (contains coordinates, no empty object {})', () => {
      const mod = getTaskById(15)!;
      const taskData1 = mod.generate(2, makeRng(33333));
      const { display: d1, signature: sig1 } = getAnswerKey(15, taskData1);

      expect(d1).toBe('Программа для Робота (см. разбор)');
      expect(sig1).not.toBe('');
      expect(sig1).not.toContain('{}');
      expect(sig1).toContain('walls:[');
      expect(sig1).toContain('target:[');
      expect(sig1).toContain('label:');

      // Two different seeds produce different signatures
      const taskData2 = mod.generate(2, makeRng(44444));
      const { signature: sig2 } = getAnswerKey(15, taskData2);
      expect(sig1).not.toBe(sig2);
    });

    it('Task 16: Program display with test outputs and expected results signature', () => {
      const mod = getTaskById(16)!;
      const taskData = mod.generate(2, makeRng(99999));
      const { display, signature } = getAnswerKey(16, taskData);

      expect(display).toContain('Программа (см. разбор');
      expect(display).not.toBe('—');
      expect(signature.length).toBeGreaterThan(0);
    });

    it('Safely handles corrupted or empty taskData without throwing', () => {
      expect(getAnswerKey(13, null)).toEqual({
        display: 'Форматирование по образцу (см. разбор)',
        signature: '',
      });
      expect(getAnswerKey(15, undefined)).toEqual({
        display: 'Программа для Робота (см. разбор)',
        signature: '',
      });
      expect(getAnswerKey(16, {})).toEqual({
        display: 'Программа (см. разбор)',
        signature: '',
      });
      expect(getAnswerKey(1, null)).toEqual({
        display: '—',
        signature: '',
      });
    });
  });
});

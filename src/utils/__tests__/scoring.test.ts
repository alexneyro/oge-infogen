import { describe, it, expect } from 'vitest';
import { scorePosition, gradeFromScore } from '../scoring';
import { buildSet, SetConfig } from '../../set';
import { getAnswerKey } from '../answerKey';
import { Task14Data } from '../../tasks/task14';

describe('scoring utility suite', () => {
  it('Task 1 (single-point): верный, неверный и пустой ответы', () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Тест 1',
      slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
    };
    const { entries } = buildSet(cfg);
    const entry = entries[0];
    const correctKey = getAnswerKey(entry.taskId, entry.taskData).display;

    // Верный ответ
    const resCorrect = scorePosition(entry.taskId, entry.taskData, correctKey);
    expect(resCorrect.score).toBe(1);
    expect(resCorrect.maxScore).toBe(1);
    expect(resCorrect.passed).toBe(true);

    // Неверный ответ
    const resWrong = scorePosition(entry.taskId, entry.taskData, 'НЕВЕРНО_9999');
    expect(resWrong.score).toBe(0);
    expect(resWrong.maxScore).toBe(1);
    expect(resWrong.passed).toBe(false);

    // Пустой ответ
    const resEmpty = scorePosition(entry.taskId, entry.taskData, '   ');
    expect(resEmpty.score).toBe(0);
    expect(resEmpty.maxScore).toBe(1);
    expect(resEmpty.passed).toBe(false);
  });

  it('Task 11 (single-point): проверка ответов', () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Тест 11',
      slots: [{ taskId: 11, n1: 0, n2: 0, n3: 1, nR: 0 }],
    };
    const { entries } = buildSet(cfg);
    const entry = entries[0];
    const correctKey = getAnswerKey(entry.taskId, entry.taskData).display;

    const resCorrect = scorePosition(entry.taskId, entry.taskData, correctKey);
    expect(resCorrect.score).toBe(1);
    expect(resCorrect.maxScore).toBe(1);
    expect(resCorrect.passed).toBe(true);

    const resWrong = scorePosition(entry.taskId, entry.taskData, 'случайный_ответ');
    expect(resWrong.score).toBe(0);
    expect(resWrong.maxScore).toBe(1);
    expect(resWrong.passed).toBe(false);
  });

  it('Task 14 (3-point task with checkScore): полный балл, частичный балл, 0 баллов', () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Тест 14',
      slots: [{ taskId: 14, n1: 0, n2: 1, n3: 0, nR: 0 }],
    };
    const { entries } = buildSet(cfg);
    const entry = entries[0];
    const tData = entry.taskData as Task14Data;

    const ans1 = String(tData.answers[0]);
    const ans2 = String(tData.answers[1]);

    // Полный балл (3 из 3: ответ1, ответ2 и флаг диаграммы '1')
    const resFull = scorePosition(14, tData, `${ans1}|${ans2}|1`);
    expect(resFull.score).toBe(3);
    expect(resFull.maxScore).toBe(3);
    expect(resFull.passed).toBe(true);

    // Частичный балл (2 из 3: ответ1 и ответ2, без диаграммы)
    const resPartial2 = scorePosition(14, tData, `${ans1}|${ans2}|0`);
    expect(resPartial2.score).toBe(2);
    expect(resPartial2.maxScore).toBe(3);
    expect(resPartial2.passed).toBe(false);

    // Частичный балл (1 из 3: только ответ1)
    const resPartial1 = scorePosition(14, tData, `${ans1}|неверно|0`);
    expect(resPartial1.score).toBe(1);
    expect(resPartial1.maxScore).toBe(3);
    expect(resPartial1.passed).toBe(false);

    // 0 баллов
    const resZero = scorePosition(14, tData, '000|000|0');
    expect(resZero.score).toBe(0);
    expect(resZero.maxScore).toBe(3);
    expect(resZero.passed).toBe(false);

    // Пустой ответ
    const resEmpty = scorePosition(14, tData, '');
    expect(resEmpty.score).toBe(0);
    expect(resEmpty.maxScore).toBe(3);
    expect(resEmpty.passed).toBe(false);
  });

  it('Task 16 (2-point task with checkScore): полный балл, частичный балл и пустой код', () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Тест 16',
      slots: [{ taskId: 16, n1: 0, n2: 1, n3: 0, nR: 0 }],
    };
    const { entries } = buildSet(cfg);
    const entry = entries[0];

    // Полный балл 2/2
    const resFull = scorePosition(16, entry.taskData, '2/2@@SRC@@auto@@LANG@@python@@CODE@@print(1)');
    expect(resFull.score).toBe(2);
    expect(resFull.maxScore).toBe(2);
    expect(resFull.passed).toBe(true);

    // Частичный балл 1/2
    const resPartial = scorePosition(16, entry.taskData, '1/2@@SRC@@auto@@LANG@@python@@CODE@@print(1)');
    expect(resPartial.score).toBe(1);
    expect(resPartial.maxScore).toBe(2);
    expect(resPartial.passed).toBe(false);

    // Без кода / пустой ответ
    const resEmpty = scorePosition(16, entry.taskData, '');
    expect(resEmpty.score).toBe(0);
    expect(resEmpty.maxScore).toBe(2);
    expect(resEmpty.passed).toBe(false);
  });

  it('Обработка несуществующего taskId и исключений', () => {
    const resNonExistent = scorePosition(999, {}, '123');
    expect(resNonExistent.score).toBe(0);
    expect(resNonExistent.maxScore).toBe(0);
    expect(resNonExistent.passed).toBe(false);

    // Передача некорректных данных, вызывающих исключение
    const resCorrupt = scorePosition(1, null, '123');
    expect(resCorrupt.score).toBe(0);
    expect(resCorrupt.maxScore).toBe(1);
    expect(resCorrupt.passed).toBe(false);
  });

  it('gradeFromScore: шкала оценок 2, 3, 4, 5', () => {
    // Для стандартного варианта ОГЭ (21 балл):
    // 0..4 -> 2
    expect(gradeFromScore(0, 21)).toBe(2);
    expect(gradeFromScore(4, 21)).toBe(2);
    // 5..10 -> 3
    expect(gradeFromScore(5, 21)).toBe(3);
    expect(gradeFromScore(10, 21)).toBe(3);
    // 11..16 -> 4
    expect(gradeFromScore(11, 21)).toBe(4);
    expect(gradeFromScore(16, 21)).toBe(4);
    // 17..21 -> 5
    expect(gradeFromScore(17, 21)).toBe(5);
    expect(gradeFromScore(21, 21)).toBe(5);

    // Для произвольного максимума (например, 10 баллов):
    expect(gradeFromScore(0, 10)).toBe(2);
    expect(gradeFromScore(2, 10)).toBe(2);
    expect(gradeFromScore(3, 10)).toBe(3);
    expect(gradeFromScore(6, 10)).toBe(4);
    expect(gradeFromScore(9, 10)).toBe(5);
    expect(gradeFromScore(10, 10)).toBe(5);

    // Граничный случай: max <= 0
    expect(gradeFromScore(0, 0)).toBe(2);
  });
});

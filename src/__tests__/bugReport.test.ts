import { describe, it, expect } from 'vitest';
import { MODE_LABELS } from '../types';
import { buildBugReportText } from '../utils/bugReport';

describe('Bug Report & Mode Labels', () => {
  it('MODE_LABELS содержит корректные подписи для всех трёх режимов: single, variant, set', () => {
    expect(MODE_LABELS.single).toBe('Тренажёр');
    expect(MODE_LABELS.variant).toBe('Вариант');
    expect(MODE_LABELS.set).toBe('Набор');
  });

  it('отчёт в режиме set содержит код набора, позицию и данные конкретного задания', () => {
    const report = buildBugReportText({
      activeMode: 'set',
      selectedTaskId: 3,
      currentSeed: 'TRAINER_SEED_999',
      difficulty: 1,
      variantInfo: null,
      setInfo: {
        code: 'SET_CODE_ABC123',
        seed: 'SET_SEED_XYZ789',
        totalTasks: 15,
        tasks: [
          { position: 1, taskId: 1, label: 'Задание 1 (№1)', difficulty: 1, subSeed: 101 },
          { position: 2, taskId: 5, label: 'Задание 5 (№2)', difficulty: 3, subSeed: 202 },
        ],
        activePosition: 2,
        taskId: 5,
        difficulty: 3,
        subSeed: 202,
      },
      reportTaskId: '2',
      reportText: 'Текст ошибки в задании набора',
      userAgent: 'MockBrowser/1.0',
    });

    expect(report).toContain('Режим: Набор');
    expect(report).toContain('Задание: Задание 5');
    expect(report).toContain('Позиция в наборе: 2 из 15');
    expect(report).toContain('Код набора: SET_CODE_ABC123');
    expect(report).toContain('Сид набора: SET_SEED_XYZ789');
    expect(report).toContain('Уровень сложности: 3 (Сложнее ОГЭ)');
    expect(report).toContain('Сид задания: 202');
    expect(report).toContain('User-Agent: MockBrowser/1.0');
    expect(report).toContain('Текст ошибки в задании набора');
  });

  it('отчёт в режиме set без выбора конкретного задания содержит код набора, сид набора и общее число заданий', () => {
    const report = buildBugReportText({
      activeMode: 'set',
      selectedTaskId: 7,
      currentSeed: 'TRAINER_SEED_777',
      difficulty: 2,
      variantInfo: null,
      setInfo: {
        code: 'SET_CODE_GENERAL',
        seed: 'SET_SEED_GENERAL',
        totalTasks: 10,
        tasks: [
          { position: 1, taskId: 1, label: 'Задание 1 (№1)', difficulty: 1, subSeed: 101 },
        ],
        activePosition: null,
        taskId: null,
        difficulty: null,
        subSeed: null,
      },
      reportTaskId: 'all',
      reportText: 'Общая ошибка в наборе',
      userAgent: 'MockBrowser/1.0',
    });

    expect(report).toContain('Режим: Набор');
    expect(report).toContain('Задание: не относится к конкретному заданию');
    expect(report).toContain('Код набора: SET_CODE_GENERAL');
    expect(report).toContain('Сид набора: SET_SEED_GENERAL');
    expect(report).toContain('Всего заданий: 10');
    expect(report).toContain('User-Agent: MockBrowser/1.0');
    expect(report).toContain('Общая ошибка в наборе');
  });

  it('отчёт в режиме set не содержит данных тренажёра (сид, номер и сложность тренажёра)', () => {
    const trainerSeed = 'SECRET_TRAINER_SEED_404';
    const trainerTaskId = 14;

    const report = buildBugReportText({
      activeMode: 'set',
      selectedTaskId: trainerTaskId,
      currentSeed: trainerSeed,
      difficulty: 1,
      variantInfo: null,
      setInfo: {
        code: 'SET_CODE_ISOLATED',
        seed: 'SET_SEED_ISOLATED',
        totalTasks: 5,
        tasks: [
          { position: 1, taskId: 2, label: 'Задание 2 (№1)', difficulty: 2, subSeed: 98765 },
        ],
        activePosition: 1,
        taskId: 2,
        difficulty: 2,
        subSeed: 98765,
      },
      reportTaskId: '1',
      reportText: 'Проверка изоляции от тренажёра',
      userAgent: 'MockBrowser/1.0',
    });

    // Должен содержать данные набора
    expect(report).toContain('Режим: Набор');
    expect(report).toContain('Задание: Задание 2');
    expect(report).toContain('Позиция в наборе: 1 из 5');
    expect(report).toContain('Код набора: SET_CODE_ISOLATED');
    expect(report).toContain('Сид набора: SET_SEED_ISOLATED');
    expect(report).toContain('Сид задания: 98765');

    // Категорически НЕ должен содержать сид тренажёра или номер задания тренажёра
    expect(report).not.toContain(trainerSeed);
    expect(report).not.toContain(`Задание ${trainerTaskId}`);
    expect(report).not.toContain('Задание: 14');
    expect(report).not.toContain('Сид: ' + trainerSeed);
  });
});

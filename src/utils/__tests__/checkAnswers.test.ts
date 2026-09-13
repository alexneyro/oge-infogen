import { describe, it, expect, vi } from 'vitest';
import { buildSet, SetConfig, shortSetCode } from '../../set';
import { checkSet, runProgramsForSet } from '../checkAnswers';
import { getAnswerKey } from '../answerKey';
import { ParseResult, parseAnswersText } from '../parseAnswers';
import * as task16Module from '../../tasks/task16';

describe('checkAnswers suite', () => {
  it('набор «1 L2 ×2, 11 L3 ×1, 16 L2 ×1»: верные ответы дают полный балл, неверные — ноль, задание 16 — manual', () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Тестовый набор',
      slots: [
        { taskId: 1, n1: 0, n2: 2, n3: 0, nR: 0 }, // pos 1, pos 2
        { taskId: 11, n1: 0, n2: 0, n3: 1, nR: 0 }, // pos 3
        { taskId: 16, n1: 0, n2: 1, n3: 0, nR: 0 }, // pos 4
      ],
    };

    const { entries } = buildSet(cfg);
    const code = shortSetCode(cfg);

    // Верный ответ для позиции 1
    const key1 = getAnswerKey(entries[0].taskId, entries[0].taskData).display;
    // Верный ответ для позиции 3 (задание 11)
    const key3 = Array.isArray(entries[2].taskData.acceptedAnswers)
      ? entries[2].taskData.acceptedAnswers[0]
      : entries[2].taskData.correctAnswer;

    const parsed: ParseResult = {
      student: 'Тестов Тест',
      grade: '9А',
      setCode: code,
      unreadLines: [],
      answers: [
        { position: 1, raw: String(key1), kind: 'line' }, // верный -> 1 балл
        { position: 2, raw: 'ЗАВЕДОМО_НЕВЕРНЫЙ_ОТВЕТ', kind: 'line' }, // неверный -> 0 баллов
        { position: 3, raw: String(key3), kind: 'line' }, // верный -> 1 балл
        { position: 4, raw: 'см. файл 4_программа.py', kind: 'line' }, // задание 16 -> 'manual', 0 баллов
      ],
    };

    const result = checkSet(entries, parsed, code);

    expect(result.rows).toHaveLength(4);
    expect(result.rows[0].status).toBe('correct');
    expect(result.rows[0].score).toBe(1);

    expect(result.rows[1].status).toBe('wrong');
    expect(result.rows[1].score).toBe(0);

    expect(result.rows[2].status).toBe('correct');
    expect(result.rows[2].score).toBe(1);

    expect(result.rows[3].status).toBe('manual');
    expect(result.rows[3].score).toBe(0);

    // Итоговый балл: 1 + 0 + 1 + 0 = 2
    expect(result.total).toBe(2);
    // Максимальный балл: 1 + 1 + 1 + 2 = 5 (у задания 16 maxPoints = 2)
    expect(result.max).toBe(5);
  });

  it('несовпадение setCode даёт запись в notes, но проверка выполняется', () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Тест',
      slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
    };
    const { entries } = buildSet(cfg);

    const parsed: ParseResult = {
      student: 'Тест',
      grade: '9А',
      setCode: 'OTHER_CODE',
      unreadLines: [],
      answers: [{ position: 1, raw: 'любой', kind: 'line' }],
    };

    const result = checkSet(entries, parsed, 'REAL_CODE');
    expect(result.notes.some((n) => n.includes('не совпадает с кодом текущего набора'))).toBe(true);
    expect(result.rows).toHaveLength(1);
  });

  it('пропущенная позиция даёт status empty', () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Тест',
      slots: [
        { taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 2, n1: 0, n2: 1, n3: 0, nR: 0 },
      ],
    };
    const { entries } = buildSet(cfg);

    const parsed: ParseResult = {
      student: 'Тест',
      grade: '9А',
      setCode: '12345',
      unreadLines: [],
      answers: [{ position: 1, raw: 'ответ', kind: 'line' }], // позиции 2 нет
    };

    const result = checkSet(entries, parsed, '12345');
    expect(result.rows[1].status).toBe('empty');
    expect(result.rows[1].score).toBe(0);
    expect(result.rows[1].raw).toBe('');
  });

  it('оценивает задание 14 по подпунктам и автопроверяет Робота 15 из блока', () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Проверочный набор',
      slots: [
        { taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 14, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 15, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 16, n1: 0, n2: 1, n3: 0, nR: 0 },
      ],
    };

    const { entries } = buildSet(cfg);
    const entry14 = entries[1];
    const taskData14 = entry14.taskData;
    const ans1 = taskData14.answers[0];
    const ans2 = taskData14.answers[1];

    const filledNotepad = `
Фамилия и имя: Петров Иван
Класс: 9В
Набор: Проверочный набор (2V80A597)

===== ОТВЕТЫ =====
1: ${entries[0].taskData.correctAnswer}
2.1: ${ans1}
2.2: ${ans2}
3:
--- начало программы ---
${entries[2].taskData.reference || ''}
--- конец программы ---
4:
--- начало программы ---
print(42)
--- конец программы ---
`;

    const parsed = parseAnswersText(filledNotepad);
    const checked = checkSet(entries, parsed, '2V80A597');

    // 1-я задача (taskId 1): верный ответ -> 1 б.
    expect(checked.rows[0].score).toBe(1);
    expect(checked.rows[0].status).toBe('correct');

    // 2-я задача (taskId 14): оба ответа верны -> 2 б. (из 3 макс, partialManual)
    expect(checked.rows[1].score).toBe(2);
    expect(checked.rows[1].partialManual).toBe(true);

    // 3-я задача (taskId 15): автопроверка эталонного решения -> 2 б.
    expect(checked.rows[2].score).toBe(2);
    expect(checked.rows[2].status).toBe('correct');

    // 4-я задача (taskId 16): manual статус
    expect(checked.rows[3].status).toBe('manual');
  });

  describe('runProgramsForSet with mocked runTests16', () => {
    it('вызывает runTests16 последовательно только для позиций с taskId 16', async () => {
      const cfg: SetConfig = {
        seed: '99999',
        title: 'Тест 16',
        slots: [
          { taskId: 1, n1: 1, n2: 0, n3: 0, nR: 0 }, // pos 1
          { taskId: 6, n1: 1, n2: 0, n3: 0, nR: 0 }, // pos 2
          { taskId: 16, n1: 0, n2: 1, n3: 1, nR: 0 }, // pos 3, pos 4
        ],
      };

      const { entries } = buildSet(cfg);

      const parsed: ParseResult = {
        student: 'Смирнов',
        grade: '9Б',
        setCode: 'CODE16',
        unreadLines: [],
        answers: [
          { position: 1, raw: '123', kind: 'line' },
          { position: 2, raw: '456', kind: 'line' },
          { position: 3, raw: 'print("hello 2")', kind: 'block' },
          { position: 4, raw: 'print("hello 4")', kind: 'block' },
        ],
      };

      const callOrder: number[] = [];
      const spy = vi.spyOn(task16Module, 'runTests16').mockImplementation(async (data: any, code: string) => {
        if (code.includes('hello 2')) {
          callOrder.push(3);
          return { score: 2, maxScore: 2, ran: true, details: ['тест 1: ок', 'тест 2: ок'] };
        }
        if (code.includes('hello 4')) {
          callOrder.push(4);
          return { score: 0, maxScore: 2, ran: false, details: ['автопроверка доступна только для Python'] };
        }
        return { score: 0, maxScore: 2, ran: false, details: ['неизвестный код'] };
      });

      const progressCalls: { done: number; total: number }[] = [];
      const results = await runProgramsForSet(
        entries,
        parsed,
        (done, total) => progressCalls.push({ done, total }),
        { 3: 'print("hello 2")' } // uploaded file for pos 3
      );

      expect(spy).toHaveBeenCalledTimes(2);
      expect(callOrder).toEqual([3, 4]); // Вызывается последовательно только для позиций 3 и 4
      expect(progressCalls).toEqual([
        { done: 0, total: 2 },
        { done: 1, total: 2 },
        { done: 2, total: 2 },
      ]);

      expect(results.get(3)).toEqual({
        score: 2,
        maxScore: 2,
        ran: true,
        details: ['тест 1: ок', 'тест 2: ок'],
      });

      expect(results.get(4)).toEqual({
        score: 0,
        maxScore: 2,
        ran: false,
        details: ['автопроверка доступна только для Python'],
      });

      spy.mockRestore();
    });

    it('при отсутствии кода набора в файле добавляет note об этом', () => {
      const cfg: SetConfig = {
        seed: '12345',
        title: 'Тестовый набор',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const { entries } = buildSet(cfg);

      const parsed: ParseResult = {
        student: 'Иванов',
        grade: '9А',
        setCode: '',
        unreadLines: [],
        answers: [{ position: 1, raw: '42', kind: 'line' }],
      };

      const result = checkSet(entries, parsed, 'REAL_CODE');
      expect(
        result.notes.some((n) =>
          n.includes('Код набора в файле не найден, проверка выполнена по структуре открытого набора')
        )
      ).toBe(true);
    });

    it('добавляет note о расхождении, если решение есть и в отдельном файле, и в блоке блокнота', () => {
      const cfg: SetConfig = {
        seed: '12345',
        title: 'Тест',
        slots: [{ taskId: 15, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const { entries } = buildSet(cfg);

      const parsed: ParseResult = {
        student: 'Иванов',
        grade: '9А',
        setCode: 'CODE1',
        unreadLines: [],
        answers: [{ position: 1, raw: 'использовать Робот\nалг\nнач\nвправо\nкон', kind: 'block' }],
      };

      const result = checkSet(entries, parsed, 'CODE1', {
        1: 'использовать Робот\nалг\nнач\nвлево\nкон',
      });

      expect(
        result.notes.some((n) =>
          n.includes('содержимое файла отличается от блока в блокноте')
        )
      ).toBe(true);
    });
  });
});

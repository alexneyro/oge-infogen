import { describe, it, expect, vi } from 'vitest';
import { buildSet, SetConfig, shortSetCode } from '../../set';
import {
  checkSet,
  CheckedRow,
  runProgramsForSet,
  getAutoScore14,
  applyDiagramToggle14,
  applyScoreChange,
  buildDetails15,
} from '../checkAnswers';
import { getAnswerKey } from '../answerKey';
import { ParseResult, parseAnswersText } from '../parseAnswers';
import * as task16Module from '../../tasks/task16';
import { task15, evaluateTask15, Task15Data } from '../../tasks/task15';
import type { CheckOutcome, InstanceResult } from '../../tasks/robot/checker';
import { ROBOT_FAMILIES } from '../../tasks/robot/field';

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

    it('передаёт passed и total из runTests16 в RunProgramsResult', async () => {
      const cfg: SetConfig = {
        seed: '99999',
        title: 'Тест 16 passed/total',
        slots: [{ taskId: 16, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const { entries } = buildSet(cfg);
      const parsed: ParseResult = {
        student: 'Тест',
        grade: '9А',
        setCode: 'CODE16',
        unreadLines: [],
        answers: [{ position: 1, raw: 'print(1)', kind: 'block' }],
      };

      const spy = vi.spyOn(task16Module, 'runTests16').mockResolvedValue({
        score: 1,
        maxScore: 2,
        ran: true,
        details: ['тест 1: пройден', 'тест 2: не пройден (ожидалось: "2", получено: "1")'],
        passed: 1,
        total: 2,
      });

      const results = await runProgramsForSet(entries, parsed);
      expect(results.get(1)).toEqual({
        score: 1,
        maxScore: 2,
        ran: true,
        details: ['тест 1: пройден', 'тест 2: не пройден (ожидалось: "2", получено: "1")'],
        passed: 1,
        total: 2,
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

  describe('задание 14: autoScore и галочка диаграммы', () => {
    it('checkSet записывает autoScore для задания 14, включая пустой ответ', () => {
      const cfg: SetConfig = {
        seed: '12345',
        title: 'Тест 14',
        slots: [
          { taskId: 14, n1: 0, n2: 2, n3: 0, nR: 0 },
        ],
      };
      const { entries } = buildSet(cfg);
      const ans1 = entries[0].taskData.answers[0];
      const ans2 = entries[0].taskData.answers[1];

      const parsed: ParseResult = {
        student: 'Тестов',
        grade: '9А',
        setCode: shortSetCode(cfg),
        unreadLines: [],
        answers: [
          { position: 1, sub: 1, raw: String(ans1), kind: 'line' },
          { position: 1, sub: 2, raw: String(ans2), kind: 'line' },
          // позиция 2 пустая
        ],
      };

      const checked = checkSet(entries, parsed, parsed.setCode);
      expect(checked.rows[0].score).toBe(2);
      expect(checked.rows[0].autoScore).toBe(2);
      expect(checked.rows[1].status).toBe('empty');
      expect(checked.rows[1].score).toBe(0);
      expect(checked.rows[1].autoScore).toBe(0);
    });

    it('getAutoScore14 возвращает запасной балл при отсутствии autoScore (в т.ч. score 3 -> 2)', () => {
      const legacyRow3: CheckedRow = {
        position: 1,
        taskId: 14,
        difficulty: 2,
        raw: '1) 10  2) 20',
        expected: '10 | 20',
        status: 'correct',
        score: 3,
        maxScore: 3,
        partialManual: true,
      };
      const legacyRow1: CheckedRow = { ...legacyRow3, score: 1 };
      const rowWithAuto: CheckedRow = { ...legacyRow3, score: 3, autoScore: 2 };

      expect(getAutoScore14(legacyRow3)).toBe(2);
      expect(getAutoScore14(legacyRow1)).toBe(1);
      expect(getAutoScore14(rowWithAuto)).toBe(2);
    });

    it('applyDiagramToggle14 переключает балл 2 -> 3 -> 2, обновляет status и не меняет autoScore', () => {
      const row: CheckedRow = {
        position: 1,
        taskId: 14,
        difficulty: 2,
        raw: '1) 10  2) 20',
        expected: '10 | 20',
        status: 'correct',
        score: 2,
        autoScore: 2,
        maxScore: 3,
        partialManual: true,
      };

      const checkedRow = applyDiagramToggle14(row, true);
      expect(checkedRow.score).toBe(3);
      expect(checkedRow.diagramOk).toBe(true);
      expect(checkedRow.status).toBe('correct');
      expect(checkedRow.autoScore).toBe(2);

      const uncheckedRow = applyDiagramToggle14(checkedRow, false);
      expect(uncheckedRow.score).toBe(2);
      expect(uncheckedRow.diagramOk).toBe(false);
      expect(uncheckedRow.status).toBe('correct');
      expect(uncheckedRow.autoScore).toBe(2);

      const emptyRow: CheckedRow = {
        position: 2,
        taskId: 14,
        difficulty: 2,
        raw: '',
        expected: '10 | 20',
        status: 'empty',
        score: 0,
        autoScore: 0,
        maxScore: 3,
        partialManual: true,
      };
      const emptyChecked = applyDiagramToggle14(emptyRow, true);
      expect(emptyChecked.score).toBe(1);
      expect(emptyChecked.status).toBe('correct');
      expect(applyDiagramToggle14(emptyChecked, false).status).toBe('empty');
    });

    it('applyScoreChange для partialManual: ручная правка 3 -> diagramOk true, 2 -> diagramOk false, autoScore не меняется', () => {
      const row: CheckedRow = {
        position: 1,
        taskId: 14,
        difficulty: 2,
        raw: '1) 10  2) 20',
        expected: '10 | 20',
        status: 'correct',
        score: 2,
        autoScore: 2,
        maxScore: 3,
        partialManual: true,
      };

      const raised = applyScoreChange(row, 3);
      expect(raised.score).toBe(3);
      expect(raised.diagramOk).toBe(true);
      expect(raised.status).toBe('correct');
      expect(raised.autoScore).toBe(2);

      const lowered = applyScoreChange(raised, 2);
      expect(lowered.score).toBe(2);
      expect(lowered.diagramOk).toBe(false);
      expect(lowered.status).toBe('correct');
      expect(lowered.autoScore).toBe(2);
    });

    it('ограничивает итоговый балл значением maxScore в applyDiagramToggle14 и applyScoreChange', () => {
      const row: CheckedRow = {
        position: 1,
        taskId: 14,
        difficulty: 2,
        raw: '1) 10  2) 20',
        expected: '10 | 20',
        status: 'correct',
        score: 2,
        autoScore: 2,
        maxScore: 2,
        partialManual: true,
      };

      const toggled = applyDiagramToggle14(row, true);
      expect(toggled.score).toBe(2);
      expect(toggled.diagramOk).toBe(true);
      expect(toggled.status).toBe('correct');

      const manualOverMax = applyScoreChange({ ...row, maxScore: 3 }, 10);
      expect(manualOverMax.score).toBe(3);
      expect(manualOverMax.diagramOk).toBe(true);
      expect(manualOverMax.status).toBe('correct');

      const manualNegative = applyScoreChange({ ...row, maxScore: 3 }, -5);
      expect(manualNegative.score).toBe(0);
      expect(manualNegative.diagramOk).toBe(false);
      expect(manualNegative.status).toBe('wrong');
    });
  });

  describe('задания 15 и 16: детали тестов и счётчики', () => {
    it('buildDetails15: parseError, провал с missing и extra, все пройдены', () => {
      const parseErrOutcome: CheckOutcome = {
        score: 0,
        maxScore: 2,
        totalInstances: 11,
        passedInstances: 0,
        parseError: { line: 4, message: 'Неизвестная команда «шаг»' },
      };
      expect(buildDetails15(parseErrOutcome)).toEqual([
        'Пройдено полей: 0 из 11',
        'Синтаксическая ошибка, строка 4: Неизвестная команда «шаг»',
      ]);

      const failOutcome: CheckOutcome = {
        score: 0,
        maxScore: 2,
        totalInstances: 11,
        passedInstances: 3,
        fail: {
          reason: 'Робот разрушился, попытавшись пройти сквозь стену',
          missing: ['1,1', '2,1'],
          extra: ['3,3'],
        } as unknown as InstanceResult,
      };
      expect(buildDetails15(failOutcome)).toEqual([
        'Пройдено полей: 3 из 11',
        'Робот разрушился, попытавшись пройти сквозь стену',
        'Не закрашено клеток: 2',
        'Закрашено лишних: 1',
      ]);

      const allPassedOutcome: CheckOutcome = {
        score: 2,
        maxScore: 2,
        totalInstances: 11,
        passedInstances: 11,
      };
      expect(buildDetails15(allPassedOutcome)).toEqual(['Пройдено полей: 11 из 11']);
    });

    it('evaluateTask15 и task15.checkScore дают одинаковый score на нескольких фикстурах', () => {
      const cfg: SetConfig = {
        seed: '12345',
        title: 'Робот тест',
        slots: [{ taskId: 15, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const { entries } = buildSet(cfg);
      const taskData = entries[0].taskData as Task15Data;

      // Фикстура с частично верным решением (score = 1: 1 пропущенная клетка из 4 -> tol = 1)
      const partialData: Task15Data = {
        familyId: ROBOT_FAMILIES[0].id,
        goalId: ROBOT_FAMILIES[0].goals[0].id,
        transform: 'id',
        statement: '',
        hint: '',
        reference: '',
        visible: {
          bounds: { minX: 0, maxX: 6, minY: 0, maxY: 5 },
          start: { x: 1, y: 1 },
          walls: new Set<string>(),
          target: new Set<string>(['1,1', '2,1', '3,1', '4,1']),
          label: 'test visible',
        },
        hidden: [
          {
            bounds: { minX: 0, maxX: 6, minY: 0, maxY: 5 },
            start: { x: 1, y: 1 },
            walls: new Set<string>(),
            target: new Set<string>(['1,1', '2,1', '3,1', '4,1']),
            label: 'test hidden',
          },
        ],
      };

      const partialCode = [
        'использовать Робот',
        'алг',
        'нач',
        '  закрасить',
        '  вправо',
        '  закрасить',
        '  вправо',
        '  закрасить',
        'кон',
      ].join('\n');

      const syntaxErrorCode = 'использовать Робот\nалг\nнач\n  прыгнуть\nкон';
      const emptyCode = '   \n  ';

      // Идеальное решение
      expect(evaluateTask15(taskData, taskData.reference).score).toBe(
        task15.checkScore!(taskData, taskData.reference).score
      );
      expect(task15.checkScore!(taskData, taskData.reference).score).toBe(2);

      // Частично верное решение (1 балл)
      expect(evaluateTask15(partialData, partialCode).score).toBe(1);
      expect(evaluateTask15(partialData, partialCode).score).toBe(
        task15.checkScore!(partialData, partialCode).score
      );

      // Пустой код (0 баллов)
      expect(evaluateTask15(taskData, emptyCode).score).toBe(0);
      expect(evaluateTask15(taskData, emptyCode).score).toBe(
        task15.checkScore!(taskData, emptyCode).score
      );

      // Синтаксическая ошибка (0 баллов)
      expect(evaluateTask15(taskData, syntaxErrorCode).score).toBe(0);
      expect(evaluateTask15(taskData, syntaxErrorCode).score).toBe(
        task15.checkScore!(taskData, syntaxErrorCode).score
      );
    });

    it('checkSet для задания 15 записывает testsPassed, testsTotal и details без тяжелых объектов', () => {
      const cfg: SetConfig = {
        seed: '12345',
        title: 'Робот checkSet',
        slots: [{ taskId: 15, n1: 0, n2: 2, n3: 0, nR: 0 }],
      };
      const { entries } = buildSet(cfg);
      const refCode = (entries[0].taskData as Task15Data).reference;
      const expectedScore = task15.checkScore!(entries[0].taskData, refCode).score;

      const parsed: ParseResult = {
        student: 'Сидоров',
        grade: '9А',
        setCode: shortSetCode(cfg),
        unreadLines: [],
        answers: [
          { position: 1, kind: 'block', raw: refCode },
          // позиция 2 пустая
        ],
      };

      const checked = checkSet(entries, parsed, parsed.setCode);
      const row1 = checked.rows[0];
      const row2 = checked.rows[1];

      expect(row1.score).toBe(expectedScore);
      expect(row1.testsTotal).toBeGreaterThan(0);
      expect(row1.testsPassed).toBe(row1.testsTotal);
      expect(row1.details).toEqual([`Пройдено полей: ${row1.testsPassed} из ${row1.testsTotal}`]);

      // Пустой код остаётся status 'empty' без новых полей
      expect(row2.status).toBe('empty');
      expect(row2.testsPassed).toBeUndefined();
      expect(row2.testsTotal).toBeUndefined();
      expect(row2.details).toBeUndefined();

      // Сериализация компактна и не содержит тяжелых полей (fail, instance, log)
      const json = JSON.stringify(checked.rows);
      expect(json.length).toBeLessThan(4096);
      const reparsed = JSON.parse(json) as Record<string, unknown>[];
      expect(reparsed[0]).not.toHaveProperty('fail');
      expect(reparsed[0]).not.toHaveProperty('instance');
      expect(reparsed[0]).not.toHaveProperty('log');
      expect(typeof reparsed[0].testsPassed).toBe('number');
      expect(typeof reparsed[0].testsTotal).toBe('number');
      expect(Array.isArray(reparsed[0].details)).toBe(true);
      expect((reparsed[0].details as unknown[]).every((d) => typeof d === 'string')).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  buildAssignmentSheets,
  AssignmentExportEntry,
  AssignmentExportResultRow,
  AssignmentExportAnswerEntry,
} from '../assignmentExport';

describe('buildAssignmentSheets', () => {
  const baseAssignment = {
    title: 'Домашняя работа №1',
    max_attempts: 3,
    set_config: { code: 'S2-ABCDEFG-0001-0001' },
  };

  it('(а) обычный случай: 3 ученика (сдал полностью, частично, не сдал), 4 позиции с max 1/1/2/3 — заголовки, значения, заливки, порядок', () => {
    const entries: AssignmentExportEntry[] = [
      { position: 1, taskId: 1, maxScore: 1 },
      { position: 2, taskId: 6, maxScore: 1 },
      { position: 3, taskId: 15, maxScore: 2 },
      { position: 4, taskId: 14, maxScore: 3 },
    ];

    const results: AssignmentExportResultRow[] = [
      {
        student_id: 's3',
        first_name: 'Пётр',
        last_name: 'Яковлев',
        email: 'yakovlev@example.com',
        submitted_at: null,
        score: null,
        max_score: null,
        time_spent_seconds: null,
        is_submitted: false,
        attempts: 0,
        best_session_id: null,
      },
      {
        student_id: 's2',
        first_name: 'Анна',
        last_name: 'Иванова',
        email: 'ivanova@example.com',
        submitted_at: '2026-11-17T10:30:00Z',
        score: 3,
        max_score: 7,
        time_spent_seconds: 930, // 15.5 мин
        is_submitted: true,
        attempts: 2,
        best_session_id: 'sess-2',
      },
      {
        student_id: 's1',
        first_name: 'Борис',
        last_name: 'Алексеев',
        email: 'alekseev@example.com',
        submitted_at: '2026-11-17T09:05:00Z',
        score: 7,
        max_score: 7,
        time_spent_seconds: 600, // 10 мин
        is_submitted: true,
        attempts: 1,
        best_session_id: 'sess-1',
      },
    ];

    const answersBySession: Record<string, Record<string, AssignmentExportAnswerEntry>> = {
      'sess-1': {
        '1': { answer: '42', correct: true, score: 1, maxScore: 1, taskId: 1 },
        '2': { answer: 'YES', correct: true, score: 1, maxScore: 1, taskId: 6 },
        '3': { answer: 'вправо\nзакрасить', correct: true, score: 2, maxScore: 2, taskId: 15 },
        '4': { answer: '12\n34.5', correct: true, score: 3, maxScore: 3, taskId: 14 },
      },
      'sess-2': {
        '1': { answer: '42', correct: true, score: 1, maxScore: 1, taskId: 1 },
        '2': { answer: 'NO', correct: false, score: 0, maxScore: 1, taskId: 6 },
        '3': { answer: 'вниз', correct: true, score: 1, maxScore: 2, taskId: 15 }, // частичный балл при correct: true!
        '4': { answer: '12\n0', correct: true, score: 1, maxScore: 3, taskId: 14 },
      },
    };

    const sheets = buildAssignmentSheets({
      assignment: baseAssignment,
      entries,
      results,
      answersBySession,
    });

    expect(sheets).toHaveLength(2);
    const [resSheet, ansSheet] = sheets;

    expect(resSheet.name).toBe('Результаты');
    expect(ansSheet.name).toBe('Ответы');
    expect(resSheet.freezeCols).toBe(1);
    expect(ansSheet.freezeCols).toBe(1);

    // Заголовки
    expect(resSheet.headers).toEqual([
      'Ученик',
      'Статус',
      'Итого',
      'Макс',
      '%',
      'Попытки',
      'Время (мин)',
      'Дата сдачи',
      'поз. 1 (№1, макс 1)',
      'поз. 2 (№6, макс 1)',
      'поз. 3 (№15, макс 2)',
      'поз. 4 (№14, макс 3)',
    ]);

    expect(ansSheet.headers).toEqual([
      'Ученик',
      'Статус',
      'Итого',
      'Макс',
      'поз. 1 (№1, макс 1)',
      'поз. 2 (№6, макс 1)',
      'поз. 3 (№15, макс 2)',
      'поз. 4 (№14, макс 3)',
    ]);

    // Порядок учеников: Алексеев -> Иванова -> Яковлев
    expect(resSheet.rows.map((r) => r[0])).toEqual([
      'Алексеев Борис',
      'Иванова Анна',
      'Яковлев Пётр',
    ]);
    expect(ansSheet.rows.map((r) => r[0])).toEqual([
      'Алексеев Борис',
      'Иванова Анна',
      'Яковлев Пётр',
    ]);

    // Строка 1 (Алексеев Борис — сдал полностью)
    const r0 = resSheet.rows[0];
    expect(r0[1]).toEqual({ v: 'Сдал', fill: 'green' });
    expect(r0[2]).toBe(7);
    expect(r0[3]).toBe(7);
    expect(r0[4]).toBe(100);
    expect(r0[5]).toBe('1/3');
    expect(r0[6]).toBe(10);
    expect(r0[7]).toEqual({ v: expect.any(Date), numFmt: 'dd.mm.yyyy hh:mm' }); // МСК = UTC+3
    const submittedDate = (r0[7] as { v: Date; numFmt: string }).v;
    expect(submittedDate.getUTCFullYear()).toBe(2026);
    expect(submittedDate.getUTCMonth()).toBe(10); // ноябрь (0-based)
    expect(submittedDate.getUTCDate()).toBe(17);
    expect(submittedDate.getUTCHours()).toBe(12);
    expect(submittedDate.getUTCMinutes()).toBe(5);
    expect(r0[8]).toEqual({ v: 1, fill: 'green' });
    expect(r0[9]).toEqual({ v: 1, fill: 'green' });
    expect(r0[10]).toEqual({ v: 2, fill: 'green' });
    expect(r0[11]).toEqual({ v: 3, fill: 'green' });

    // Строка 2 (Иванова Анна — частично)
    const r1 = resSheet.rows[1];
    expect(r1[4]).toBe(43); // 3/7 -> 43%
    expect(r1[6]).toBe(15.5);
    expect(r1[8]).toEqual({ v: 1, fill: 'green' });
    expect(r1[9]).toEqual({ v: 0, fill: 'red' });
    expect(r1[10]).toEqual({ v: 1, fill: 'yellow' });
    expect(r1[11]).toEqual({ v: 1, fill: 'yellow' });

    // Строка 3 (Яковлев Пётр — не сдал)
    const r2 = resSheet.rows[2];
    expect(r2[1]).toEqual({ v: 'Не сдал', fill: 'gray' });
    expect(r2[2]).toBeNull();
    expect(r2[3]).toBeNull();
    expect(r2[4]).toBeNull();
    expect(r2[5]).toBeNull();
    expect(r2[6]).toBeNull();
    expect(r2[7]).toBeNull();
    expect(r2.slice(8)).toEqual([null, null, null, null]);

    // Лист «Ответы»: заливки (включая частичный балл yellow даже при correct: true, многострочный answer сохранён)
    const a0 = ansSheet.rows[0];
    expect(a0[4]).toEqual({ v: '42', fill: 'green' });
    expect(a0[6]).toEqual({ v: 'вправо\nзакрасить', fill: 'green' });
    expect(a0[7]).toEqual({ v: '12\n34.5', fill: 'green' });

    const a1 = ansSheet.rows[1];
    expect(a1[4]).toEqual({ v: '42', fill: 'green' });
    expect(a1[5]).toEqual({ v: 'NO', fill: 'red' });
    expect(a1[6]).toEqual({ v: 'вниз', fill: 'yellow' });
    expect(a1[7]).toEqual({ v: '12\n0', fill: 'yellow' });

    const a2 = ansSheet.rows[2];
    expect(a2[1]).toEqual({ v: 'Не сдал', fill: 'gray' });
    expect(a2.slice(4)).toEqual([null, null, null, null]);
  });

  it('(б) пустой entries: позиции, taskId и maxScore берутся из answers лучших сессий по возрастанию позиции', () => {
    const results: AssignmentExportResultRow[] = [
      {
        student_id: 's1',
        first_name: 'Иван',
        last_name: 'Белов',
        submitted_at: '2026-11-17T10:00:00Z',
        score: 2,
        max_score: 4,
        time_spent_seconds: 120,
        is_submitted: true,
        attempts: 1,
        best_session_id: 'sess-1',
      },
      {
        student_id: 's2',
        first_name: 'Ольга',
        last_name: 'Волкова',
        submitted_at: '2026-11-17T11:00:00Z',
        score: 1,
        max_score: 4,
        time_spent_seconds: 180,
        is_submitted: true,
        attempts: 1,
        best_session_id: 'sess-2',
      },
    ];

    const answersBySession: Record<string, Record<string, AssignmentExportAnswerEntry>> = {
      'sess-1': {
        '3': { answer: '15', correct: true, score: 1, maxScore: 1, taskId: 5 },
      },
      'sess-2': {
        '1': { answer: '7', correct: true, score: 1, maxScore: 1, taskId: 2 },
        '2': { answer: 'code', correct: false, score: 0, maxScore: 2, taskId: 16 },
      },
    };

    const [resSheet, ansSheet] = buildAssignmentSheets({
      assignment: { title: 'Без кода', max_attempts: null, set_config: null },
      entries: [],
      results,
      answersBySession,
    });

    expect(resSheet.headers.slice(8)).toEqual([
      'поз. 1 (№2, макс 1)',
      'поз. 2 (№16, макс 2)',
      'поз. 3 (№5, макс 1)',
    ]);
    expect(ansSheet.headers.slice(4)).toEqual([
      'поз. 1 (№2, макс 1)',
      'поз. 2 (№16, макс 2)',
      'поз. 3 (№5, макс 1)',
    ]);
  });

  it('(в) пустой ответ сдавшего ученика даёт серую заливку (gray) в обоих листах и null в «Ответы»', () => {
    const entries: AssignmentExportEntry[] = [
      { position: 1, taskId: 3, maxScore: 1 },
      { position: 2, taskId: 4, maxScore: 1 },
    ];
    const results: AssignmentExportResultRow[] = [
      {
        student_id: 's1',
        first_name: 'Егор',
        last_name: 'Громов',
        submitted_at: '2026-11-17T12:00:00Z',
        score: 0,
        max_score: 2,
        time_spent_seconds: 60,
        is_submitted: true,
        attempts: 1,
        best_session_id: 'sess-empty',
      },
    ];
    const answersBySession: Record<string, Record<string, AssignmentExportAnswerEntry>> = {
      'sess-empty': {
        '1': { answer: '', correct: false, score: 0, maxScore: 1, taskId: 3 },
        '2': { answer: '   ', correct: false, score: 0, maxScore: 1, taskId: 4 },
      },
    };

    const [resSheet, ansSheet] = buildAssignmentSheets({
      assignment: baseAssignment,
      entries,
      results,
      answersBySession,
    });

    expect(resSheet.rows[0][8]).toEqual({ v: 0, fill: 'gray' });
    expect(resSheet.rows[0][9]).toEqual({ v: 0, fill: 'gray' });
    expect(ansSheet.rows[0][4]).toEqual({ v: null, fill: 'gray' });
    expect(ansSheet.rows[0][5]).toEqual({ v: null, fill: 'gray' });
  });

  it('(г) в листах отсутствуют email и слова «логин», «пароль» даже при пустом ФИО', () => {
    const results: AssignmentExportResultRow[] = [
      {
        student_id: 's1',
        first_name: '',
        last_name: '',
        email: 'secret-student@school.ru',
        submitted_at: '2026-11-17T12:00:00Z',
        score: 1,
        max_score: 1,
        time_spent_seconds: 30,
        is_submitted: true,
        attempts: 1,
        best_session_id: 'sess-1',
      },
    ];
    const answersBySession = {
      'sess-1': {
        '1': { answer: '99', correct: true, score: 1, maxScore: 1, taskId: 1 },
      },
    };

    const sheets = buildAssignmentSheets({
      assignment: baseAssignment,
      entries: [{ position: 1, taskId: 1, maxScore: 1 }],
      results,
      answersBySession,
    });

    const serialized = JSON.stringify(sheets).toLowerCase();
    expect(serialized).not.toContain('secret-student@school.ru');
    expect(serialized).not.toContain('email');
    expect(serialized).not.toContain('логин');
    expect(serialized).not.toContain('пароль');
    expect(sheets[0].rows[0][0]).toBe('Ученик');
  });
});

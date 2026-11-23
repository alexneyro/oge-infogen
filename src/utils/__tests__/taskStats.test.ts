import { describe, it, expect } from 'vitest';
import { aggregateTaskStats, StatsSessionInput } from '../taskStats';

describe('aggregateTaskStats', () => {
  const sampleSessions: StatsSessionInput[] = [
    // self: single / variant без assignment_id
    {
      mode: 'single',
      assignment_id: null,
      assignment_type: null,
      answers: {
        '1': { taskId: 12, correct: true, score: 2, maxScore: 2 },
        '2': 'строка без taskId (in_progress формат)',
        '3': { answer: 'abc' }, // объект без taskId
        '4': null,
      },
    },
    {
      mode: 'variant',
      assignment_id: null,
      assignment_type: null,
      answers: {
        '1': { taskId: 2, correct: false, score: 0, maxScore: 1 },
        '2': { taskId: 12, correct: false, score: 1, maxScore: 2 },
      },
    },
    // hw: homework с assignment_id и mode === 'set' без assignment_id
    {
      mode: 'set',
      assignment_id: 'a-hw',
      assignment_type: 'homework',
      answers: {
        '1': { taskId: 2, correct: true, score: 1, maxScore: 1 },
        '2': { taskId: 15, correct: true, score: 2, maxScore: 3 },
      },
    },
    {
      mode: 'set',
      assignment_id: null,
      assignment_type: null,
      answers: {
        '1': { taskId: 15, correct: false, score: 1, maxScore: 3 },
      },
    },
    // classwork
    {
      mode: 'set',
      assignment_id: 'a-cw',
      assignment_type: 'classwork',
      answers: {
        '1': { taskId: 5, correct: true, score: 1, maxScore: 1 },
        '2': { taskId: 15, correct: true, score: 3, maxScore: 3 },
      },
    },
    // mock
    {
      mode: 'mock',
      assignment_id: null,
      assignment_type: null,
      answers: {
        '1': { taskId: 1, correct: true, score: 1, maxScore: 1 },
        '2': { taskId: 12, correct: true, score: 2, maxScore: 2 },
      },
    },
    // сессия без answers
    {
      mode: 'single',
      assignment_id: null,
      assignment_type: null,
      answers: null,
    },
  ];

  it('фильтр "all" объединяет все категории, пропускает записи без taskId, сортирует по taskId и суммирует score/maxScore', () => {
    const result = aggregateTaskStats(sampleSessions, 'all');

    expect(result.map((r) => r.taskId)).toEqual([1, 2, 5, 12, 15]);
    expect(result).toEqual([
      { taskId: 1, total: 1, correct: 1, totalScore: 1, totalMaxScore: 1 },
      { taskId: 2, total: 2, correct: 1, totalScore: 1, totalMaxScore: 2 },
      { taskId: 5, total: 1, correct: 1, totalScore: 1, totalMaxScore: 1 },
      { taskId: 12, total: 3, correct: 2, totalScore: 5, totalMaxScore: 6 },
      { taskId: 15, total: 3, correct: 2, totalScore: 6, totalMaxScore: 9 },
    ]);
  });

  it('фильтр "self" включает только самостоятельные сессии', () => {
    expect(aggregateTaskStats(sampleSessions, 'self')).toEqual([
      { taskId: 2, total: 1, correct: 0, totalScore: 0, totalMaxScore: 1 },
      { taskId: 12, total: 2, correct: 1, totalScore: 3, totalMaxScore: 4 },
    ]);
  });

  it('фильтр "hw" включает только ДЗ', () => {
    expect(aggregateTaskStats(sampleSessions, 'hw')).toEqual([
      { taskId: 2, total: 1, correct: 1, totalScore: 1, totalMaxScore: 1 },
      { taskId: 15, total: 2, correct: 1, totalScore: 3, totalMaxScore: 6 },
    ]);
  });

  it('фильтр "classwork" включает только классные работы', () => {
    expect(aggregateTaskStats(sampleSessions, 'classwork')).toEqual([
      { taskId: 5, total: 1, correct: 1, totalScore: 1, totalMaxScore: 1 },
      { taskId: 15, total: 1, correct: 1, totalScore: 3, totalMaxScore: 3 },
    ]);
  });

  it('фильтр "mock" включает только пробники', () => {
    expect(aggregateTaskStats(sampleSessions, 'mock')).toEqual([
      { taskId: 1, total: 1, correct: 1, totalScore: 1, totalMaxScore: 1 },
      { taskId: 12, total: 1, correct: 1, totalScore: 2, totalMaxScore: 2 },
    ]);
  });
});

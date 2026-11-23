import { describe, it, expect } from 'vitest';
import {
  buildStudentsSheet,
  buildCredentialsSheet,
  ClassExportSessionRow,
} from '../classExport';
import type { ClassMemberWithProfile } from '../../hooks/useClasses';

function makeMember(
  id: string,
  firstName: string,
  lastName: string,
  opts?: {
    email?: string | null;
    joinedAt?: string;
    generatedLogin?: string | null;
    generatedPassword?: string | null;
  }
): ClassMemberWithProfile {
  return {
    student_id: id,
    joined_at: opts?.joinedAt ?? '2026-09-01T09:00:00Z',
    profiles: {
      first_name: firstName,
      last_name: lastName,
      email: opts?.email ?? `${id}@example.com`,
      role: 'student',
      generated_login: opts?.generatedLogin ?? null,
      generated_password: opts?.generatedPassword ?? null,
    },
  };
}

describe('classExport', () => {
  it('(а) сводка: ученик с двумя ДЗ (по одной попытке и с двумя попытками) — берётся лучшая попытка, средний % по работам, заливки', () => {
    const members: ClassMemberWithProfile[] = [
      makeMember('s3', 'Анна', 'Яковлева'),
      makeMember('s1', 'Борис', 'Алексеев'),
      makeMember('s2', 'Вера', 'Иванова'),
    ];

    const sessions: ClassExportSessionRow[] = [
      // Алексеев: ДЗ-1 (1 попытка: 10/10 = 100%) и ДЗ-2 (2 попытки: 2/10=20% позже и 4/10=40% раньше? Нет, лучшая 6/10=60%) -> средний (100+60)/2 = 80% (green)
      {
        user_id: 's1',
        created_at: '2026-11-10T08:00:00Z',
        status: 'completed',
        score: 10,
        max_score: 10,
        assignment_id: 'asg-1',
        mode: 'set',
        assignments: { assignment_type: 'homework' },
      },
      {
        user_id: 's1',
        created_at: '2026-11-11T08:00:00Z',
        status: 'completed',
        score: 2,
        max_score: 10,
        assignment_id: 'asg-2',
        mode: 'set',
        assignments: { assignment_type: 'homework' },
      },
      {
        user_id: 's1',
        created_at: '2026-11-12T08:00:00Z',
        status: 'completed',
        score: 6,
        max_score: 10,
        assignment_id: 'asg-2',
        mode: 'set',
        assignments: { assignment_type: 'homework' },
      },
      // Проверка равенства score: ДЗ-3 у Ивановой (две попытки по 5/10 -> берётся более ранняя 11:00 -> МСК 14:00)
      {
        user_id: 's2',
        created_at: '2026-11-15T13:00:00Z',
        status: 'completed',
        score: 5,
        max_score: 10,
        assignment_id: 'asg-3',
        mode: 'set',
        assignments: { assignment_type: 'homework' },
      },
      {
        user_id: 's2',
        created_at: '2026-11-15T11:00:00Z',
        status: 'completed',
        score: 5,
        max_score: 10,
        assignment_id: 'asg-3',
        mode: 'set',
        assignments: { assignment_type: 'homework' },
      },
      // Яковлева: 1/10 = 10% (red)
      {
        user_id: 's3',
        created_at: '2026-11-14T10:00:00Z',
        status: 'completed',
        score: 1,
        max_score: 10,
        assignment_id: 'asg-1',
        mode: 'set',
        assignments: { assignment_type: 'homework' },
      },
    ];

    const sheet = buildStudentsSheet({
      members,
      sessions,
      className: '9А',
      selectedTypes: ['homework'],
    });

    expect(sheet.name).toBe('Ученики');
    expect(sheet.freezeCols).toBe(1);
    expect(sheet.headers).toEqual([
      'Фамилия',
      'Имя',
      'Класс',
      'Дата вступления',
      'ДЗ: работ',
      'ДЗ: средний %',
      'Последняя работа (МСК)',
    ]);

    // Порядок сортировки: Алексеев -> Иванова -> Яковлева
    expect(sheet.rows.map((r) => [r[0], r[1]])).toEqual([
      ['Алексеев', 'Борис'],
      ['Иванова', 'Вера'],
      ['Яковлева', 'Анна'],
    ]);

    // Алексеев: 2 ДЗ, средний (100 + 60)/2 = 80 (green), последняя работа 12.11.2026 11:00 МСК
    expect(sheet.rows[0]).toEqual([
      'Алексеев',
      'Борис',
      '9А',
      '01.09.2026 12:00',
      2,
      { v: 80, fill: 'green' },
      '12.11.2026 11:00',
    ]);

    // Иванова: 1 ДЗ, 50% (yellow), выбрана самая ранняя при равенстве score (11:00 UTC -> 14:00 МСК)
    expect(sheet.rows[1]).toEqual([
      'Иванова',
      'Вера',
      '9А',
      '01.09.2026 12:00',
      1,
      { v: 50, fill: 'yellow' },
      '15.11.2026 14:00',
    ]);

    // Яковлева: 1 ДЗ, 10% (red)
    expect(sheet.rows[2]).toEqual([
      'Яковлева',
      'Анна',
      '9А',
      '01.09.2026 12:00',
      1,
      { v: 10, fill: 'red' },
      '14.11.2026 13:00',
    ]);
  });

  it('(б) пробник и вариант считаются по каждой сессии отдельно', () => {
    const members: ClassMemberWithProfile[] = [makeMember('s1', 'Иван', 'Петров')];
    const sessions: ClassExportSessionRow[] = [
      {
        user_id: 's1',
        created_at: '2026-11-01T10:00:00Z',
        status: 'completed',
        score: 10,
        max_score: 20, // 50%
        assignment_id: null,
        mode: 'mock',
      },
      {
        user_id: 's1',
        created_at: '2026-11-02T10:00:00Z',
        status: 'completed',
        score: 18,
        max_score: 20, // 90% -> среднее 70% (green)
        assignment_id: null,
        mode: 'mock',
      },
      {
        user_id: 's1',
        created_at: '2026-11-03T10:00:00Z',
        status: 'completed',
        score: 3,
        max_score: 10, // 30%
        assignment_id: null,
        mode: 'variant',
      },
      {
        user_id: 's1',
        created_at: '2026-11-04T10:00:00Z',
        status: 'completed',
        score: 5,
        max_score: 10, // 50% -> среднее 40% (yellow)
        assignment_id: null,
        mode: 'variant',
      },
    ];

    const sheet = buildStudentsSheet({
      members,
      sessions,
      className: '9Б',
      selectedTypes: ['mock', 'variant'],
    });

    expect(sheet.rows[0]).toEqual([
      'Петров',
      'Иван',
      '9Б',
      '01.09.2026 12:00',
      2,
      { v: 70, fill: 'green' },
      2,
      { v: 40, fill: 'yellow' },
      '04.11.2026 13:00',
    ]);
  });

  it('(в) незавершённые сессии и max_score = 0 игнорируются', () => {
    const members: ClassMemberWithProfile[] = [makeMember('s1', 'Мария', 'Сидорова')];
    const sessions: ClassExportSessionRow[] = [
      {
        user_id: 's1',
        created_at: '2026-11-05T10:00:00Z',
        status: 'in_progress',
        score: 10,
        max_score: 10,
        assignment_id: 'asg-1',
        mode: 'set',
        assignments: { assignment_type: 'homework' },
      },
      {
        user_id: 's1',
        created_at: '2026-11-06T10:00:00Z',
        status: null,
        score: 5,
        max_score: 10,
        assignment_id: null,
        mode: 'variant',
      },
      {
        user_id: 's1',
        created_at: '2026-11-07T10:00:00Z',
        status: 'completed',
        score: 0,
        max_score: 0,
        assignment_id: 'asg-2',
        mode: 'set',
        assignments: { assignment_type: 'homework' },
      },
      {
        user_id: 's1',
        created_at: '2026-11-08T10:00:00Z',
        status: 'completed',
        score: 8,
        max_score: 10,
        assignment_id: 'asg-3',
        mode: 'set',
        assignments: { assignment_type: 'homework' },
      },
    ];

    const sheet = buildStudentsSheet({
      members,
      sessions,
      className: '9В',
      selectedTypes: ['homework', 'variant'],
    });

    expect(sheet.rows[0]).toEqual([
      'Сидорова',
      'Мария',
      '9В',
      '01.09.2026 12:00',
      1,
      { v: 80, fill: 'green' },
      0,
      null,
      '08.11.2026 13:00',
    ]);
  });

  it('(г) ученик без работ: 0 для числа работ, null для среднего % и последней работы', () => {
    const members: ClassMemberWithProfile[] = [makeMember('s1', 'Олег', 'Новиков')];

    const sheet = buildStudentsSheet({
      members,
      sessions: [],
      className: '9Г',
      selectedTypes: ['homework', 'classwork'],
    });

    expect(sheet.rows[0]).toEqual([
      'Новиков',
      'Олег',
      '9Г',
      '01.09.2026 12:00',
      0,
      null,
      0,
      null,
      null,
    ]);
  });

  it('(д) колонки формируются только для выбранных типов в фиксированном порядке и без email/логина/пароля', () => {
    const members: ClassMemberWithProfile[] = [
      makeMember('s1', 'Дарья', 'Кузнецова', {
        email: 'secret-dasha@school.ru',
        generatedLogin: 'kuznetsova1234',
        generatedPassword: 'Dasha5678',
      }),
    ];

    // Передаём selectedTypes в произвольном порядке: Вариант, Пробники, Тренажёр, Классные, ДЗ -> должно отсортироваться как ДЗ, Классные, Пробники, Вариант, Тренажёр
    const allSheet = buildStudentsSheet({
      members,
      sessions: [],
      className: '9Д',
      selectedTypes: ['trainer', 'variant', 'mock', 'classwork', 'homework'],
    });

    expect(allSheet.headers).toEqual([
      'Фамилия',
      'Имя',
      'Класс',
      'Дата вступления',
      'ДЗ: работ',
      'ДЗ: средний %',
      'Классные: работ',
      'Классные: средний %',
      'Пробники: работ',
      'Пробники: средний %',
      'Вариант: работ',
      'Вариант: средний %',
      'Тренажёр: работ',
      'Тренажёр: средний %',
      'Последняя работа (МСК)',
    ]);

    const partialSheet = buildStudentsSheet({
      members,
      sessions: [],
      className: '9Д',
      selectedTypes: ['trainer', 'classwork'],
    });

    expect(partialSheet.headers).toEqual([
      'Фамилия',
      'Имя',
      'Класс',
      'Дата вступления',
      'Классные: работ',
      'Классные: средний %',
      'Тренажёр: работ',
      'Тренажёр: средний %',
      'Последняя работа (МСК)',
    ]);

    const serialized = JSON.stringify(allSheet).toLowerCase();
    expect(serialized).not.toContain('secret-dasha@school.ru');
    expect(serialized).not.toContain('kuznetsova1234');
    expect(serialized).not.toContain('dasha5678');
  });

  it('(е) buildCredentialsSheet: берёт только учеников с generated_login, не содержит email, возвращает null если таких нет', () => {
    const membersWithCreds: ClassMemberWithProfile[] = [
      makeMember('s1', 'Егор', 'Смирнов', {
        email: 'smirnov@oge-infogen.ru',
        generatedLogin: 'smirnov1111',
        generatedPassword: 'Egor2222',
      }),
      makeMember('s2', 'Ольга', 'Волкова', {
        email: 'volkova@gmail.com',
        generatedLogin: null,
        generatedPassword: null,
      }),
      makeMember('s3', 'Антон', 'Белов', {
        email: 'belov@oge-infogen.ru',
        generatedLogin: 'belov3333',
        generatedPassword: 'Anton4444',
      }),
    ];

    const sheet = buildCredentialsSheet({
      members: membersWithCreds,
      className: '9Е',
    });

    expect(sheet).not.toBeNull();
    expect(sheet!.name).toBe('Логины и пароли');
    expect(sheet!.freezeCols).toBe(1);
    expect(sheet!.headers).toEqual([
      'Фамилия',
      'Имя',
      'Класс',
      'Логин',
      'Пароль (при создании)',
    ]);
    expect(sheet!.rows).toEqual([
      ['Белов', 'Антон', '9Е', 'belov3333', 'Anton4444'],
      ['Смирнов', 'Егор', '9Е', 'smirnov1111', 'Egor2222'],
    ]);

    const serialized = JSON.stringify(sheet).toLowerCase();
    expect(serialized).not.toContain('smirnov@oge-infogen.ru');
    expect(serialized).not.toContain('volkova@gmail.com');
    expect(serialized).not.toContain('belov@oge-infogen.ru');
    expect(serialized).not.toContain('волкова');

    const emptySheet = buildCredentialsSheet({
      members: [
        makeMember('s2', 'Ольга', 'Волкова', {
          email: 'volkova@gmail.com',
          generatedLogin: null,
        }),
      ],
      className: '9Е',
    });

    expect(emptySheet).toBeNull();
  });
});

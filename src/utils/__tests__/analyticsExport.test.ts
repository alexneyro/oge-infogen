import { describe, it, expect } from 'vitest';
import { ClassMemberWithProfile } from '../../hooks/useClasses';
import { StatsSessionInput } from '../taskStats';
import { buildAnalyticsSheets, getMatrixCell } from '../analyticsExport';

function makeMember(
  id: string,
  lastName: string,
  firstName: string,
  email: string | null = null,
  generatedLogin: string | null = null,
  generatedPassword: string | null = null
): ClassMemberWithProfile {
  return {
    student_id: id,
    joined_at: '2026-09-01T10:00:00Z',
    profiles: {
      last_name: lastName,
      first_name: firstName,
      email,
      role: 'student',
      generated_login: generatedLogin,
      generated_password: generatedPassword,
    },
  };
}

describe('getMatrixCell', () => {
  it('обрабатывает отсутствующие данные и total === 0 как null / gray', () => {
    expect(getMatrixCell(undefined)).toEqual({ pct: null, level: 'gray' });
    expect(
      getMatrixCell({
        taskId: 1,
        total: 0,
        correct: 0,
        totalScore: 0,
        totalMaxScore: 0,
      })
    ).toEqual({ pct: null, level: 'gray' });
  });

  it('соблюдает пороги цветов 69/70 и 39/40', () => {
    expect(
      getMatrixCell({
        taskId: 1,
        total: 1,
        correct: 1,
        totalScore: 70,
        totalMaxScore: 100,
      })
    ).toEqual({ pct: 70, level: 'green' });
    expect(
      getMatrixCell({
        taskId: 1,
        total: 1,
        correct: 0,
        totalScore: 69,
        totalMaxScore: 100,
      })
    ).toEqual({ pct: 69, level: 'yellow' });
    expect(
      getMatrixCell({
        taskId: 1,
        total: 1,
        correct: 0,
        totalScore: 40,
        totalMaxScore: 100,
      })
    ).toEqual({ pct: 40, level: 'yellow' });
    expect(
      getMatrixCell({
        taskId: 1,
        total: 1,
        correct: 0,
        totalScore: 39,
        totalMaxScore: 100,
      })
    ).toEqual({ pct: 39, level: 'red' });
  });

  it('для total > 0 и totalMaxScore = 0 возвращает pct: 0 и level: red', () => {
    expect(
      getMatrixCell({
        taskId: 3,
        total: 2,
        correct: 0,
        totalScore: 0,
        totalMaxScore: 0,
      })
    ).toEqual({ pct: 0, level: 'red' });
  });
});

describe('buildAnalyticsSheets', () => {
  it('сортирует по алфавиту, включает всех учеников, хранит числа с numFmt/null и не содержит email/логин/пароль', () => {
    const members: ClassMemberWithProfile[] = [
      makeMember('u-petrov', 'Петров', 'Пётр', 'petrov@secret.ru', 'petrov1234', 'PassPetrov1'),
      makeMember('u-ivanov', 'Иванов', 'Иван', 'ivanov@secret.ru', 'ivanov5678', 'PassIvanov2'),
      makeMember('u-zero', 'Алексеев', 'Алексей', 'alekseev@secret.ru', 'alekseev9999', 'PassAlex3'),
    ];

    const sessionsByUser = new Map<string, StatsSessionInput[]>([
      [
        'u-petrov',
        [
          {
            mode: 'mock',
            assignment_id: null,
            assignment_type: null,
            answers: {
              '1': { taskId: 1, correct: true, score: 1, maxScore: 1 }, // 100% green
              '2': { taskId: 2, correct: false, score: 1, maxScore: 2 }, // 50% yellow
            },
          },
        ],
      ],
      [
        'u-zero',
        [
          {
            mode: 'single',
            assignment_id: null,
            assignment_type: null,
            answers: {
              '1': { taskId: 1, correct: false, score: 0, maxScore: 1 }, // 0% red
            },
          },
        ],
      ],
      // u-ivanov без сессий
    ]);

    const sheets = buildAnalyticsSheets({
      members,
      sessionsByUser,
      statsFilter: 'all',
      filterLabel: 'Все',
      className: '9А',
      exportedAt: '17.11.2026',
    });

    expect(sheets).toHaveLength(3);
    const [matrixSheet, classSheet, explanationSheet] = sheets;
    expect(matrixSheet.name).toBe('Матрица - Все');
    expect(matrixSheet.wrapData).toBeUndefined();
    expect(classSheet.wrapData).toBeUndefined();
    expect(matrixSheet.freezeCols).toBe(2);
    expect(matrixSheet.headers).toEqual([
      'Фамилия',
      'Имя',
      ...Array.from({ length: 16 }, (_, i) => `№${i + 1}`),
    ]);

    // Алфавитный порядок: Алексеев, Иванов, Петров
    expect(matrixSheet.rows.map((r) => [r[0], r[1]])).toEqual([
      ['Алексеев', 'Алексей'],
      ['Иванов', 'Иван'],
      ['Петров', 'Пётр'],
    ]);

    // Алексеев: №1 = 0 (number, red, numFmt), остальные null (gray, numFmt)
    expect(matrixSheet.rows[0][2]).toEqual({ v: 0, fill: 'red', numFmt: '0"%"' });
    expect(typeof (matrixSheet.rows[0][2] as { v: number }).v).toBe('number');
    expect(matrixSheet.rows[0][3]).toEqual({ v: null, fill: 'gray', numFmt: '0"%"' });

    // Иванов (без сессий): все 16 ячеек null и gray
    expect(matrixSheet.rows[1].slice(2)).toHaveLength(16);
    for (const cell of matrixSheet.rows[1].slice(2)) {
      expect(cell).toEqual({ v: null, fill: 'gray', numFmt: '0"%"' });
    }

    // Петров: №1 = 100 green, №2 = 50 yellow
    expect(matrixSheet.rows[2][2]).toEqual({ v: 100, fill: 'green', numFmt: '0"%"' });
    expect(matrixSheet.rows[2][3]).toEqual({ v: 50, fill: 'yellow', numFmt: '0"%"' });

    // Третий лист — Пояснение с классом, фильтром, датой, wrapData и ссылкой на фактическое имя листа класса
    expect(explanationSheet.name).toBe('Пояснение');
    expect(explanationSheet.headers).toEqual(['Параметр', 'Значение']);
    expect(explanationSheet.colWidths).toEqual([28, 90]);
    expect(explanationSheet.wrapData).toBe(true);
    expect(explanationSheet.rows).toContainEqual(['Класс', '9А']);
    expect(explanationSheet.rows).toContainEqual(['Источник работ', 'Все']);
    expect(explanationSheet.rows).toContainEqual(['Дата выгрузки', '17.11.2026']);
    expect(explanationSheet.rows).toContainEqual([
      `Лист «${classSheet.name}»`,
      'Итог по классу: суммы баллов по всем ученикам, процент считается от суммы, а не как среднее процентов учеников',
    ]);

    // Нигде (включая Пояснение) нет email, логина или пароля
    const serialized = JSON.stringify(sheets);
    expect(serialized).not.toContain('secret.ru');
    expect(serialized).not.toContain('petrov1234');
    expect(serialized).not.toContain('PassPetrov1');
    expect(serialized).not.toContain('ivanov5678');
    expect(serialized).not.toContain('PassIvanov2');
    expect(serialized).not.toContain('alekseev9999');
    expect(serialized).not.toContain('PassAlex3');
  });

  it('подставляет "Без имени" и пустоту, если фамилия и имя отсутствуют', () => {
    const members = [makeMember('u-anon', '', '', 'anon@secret.ru')];
    const sheets = buildAnalyticsSheets({
      members,
      sessionsByUser: new Map(),
      statsFilter: 'all',
      filterLabel: 'Все',
      className: 'Класс',
      exportedAt: '17.11.2026',
    });

    expect(sheets[0].rows[0][0]).toBe('Без имени');
    expect(sheets[0].rows[0][1]).toBe('');
  });

  it('учитывает фильтр: "mock" и "all" дают разные числа и корректные имена листов <= 31 символа', () => {
    const members = [makeMember('u1', 'Сидоров', 'Сидор')];
    const sessionsByUser = new Map<string, StatsSessionInput[]>([
      [
        'u1',
        [
          {
            mode: 'mock',
            assignment_id: null,
            assignment_type: null,
            answers: { '1': { taskId: 1, correct: true, score: 1, maxScore: 1 } },
          },
          {
            mode: 'single',
            assignment_id: null,
            assignment_type: null,
            answers: { '1': { taskId: 1, correct: false, score: 0, maxScore: 1 } },
          },
        ],
      ],
    ]);

    const allSheets = buildAnalyticsSheets({
      members,
      sessionsByUser,
      statsFilter: 'all',
      filterLabel: 'Все',
      className: '9Б',
      exportedAt: '17.11.2026',
    });
    const mockSheets = buildAnalyticsSheets({
      members,
      sessionsByUser,
      statsFilter: 'mock',
      filterLabel: 'Пробники',
      className: '9Б',
      exportedAt: '17.11.2026',
    });
    const selfSheets = buildAnalyticsSheets({
      members,
      sessionsByUser,
      statsFilter: 'self',
      filterLabel: 'Самостоятельные',
      className: '9Б',
      exportedAt: '17.11.2026',
    });

    // all: 1 / 2 = 50% yellow; mock: 1 / 1 = 100% green
    expect(allSheets[0].rows[0][2]).toEqual({ v: 50, fill: 'yellow', numFmt: '0"%"' });
    expect(mockSheets[0].rows[0][2]).toEqual({ v: 100, fill: 'green', numFmt: '0"%"' });

    expect(mockSheets[0].name).toBe('Матрица - Пробники');
    expect(mockSheets[1].name).toBe('Класс - Пробники');
    expect(mockSheets[2].rows).toContainEqual([
      `Лист «${mockSheets[1].name}»`,
      'Итог по классу: суммы баллов по всем ученикам, процент считается от суммы, а не как среднее процентов учеников',
    ]);
    expect(selfSheets[0].name).toBe('Матрица - Самостоятельные');
    expect(selfSheets[1].name).toBe('Класс - Самостоятельные');
    expect(selfSheets[2].rows).toContainEqual([
      `Лист «${selfSheets[1].name}»`,
      'Итог по классу: суммы баллов по всем ученикам, процент считается от суммы, а не как среднее процентов учеников',
    ]);
    for (const s of [...allSheets, ...mockSheets, ...selfSheets]) {
      expect(s.name.length).toBeLessThanOrEqual(31);
    }
  });

  it('лист "Класс" считает взвешенный процент (сумма баллов / сумма максимумов) и ставит numFmt', () => {
    const members = [
      makeMember('u1', 'Абрамов', 'Иван'),
      makeMember('u2', 'Борисов', 'Пётр'),
    ];
    // У первого 1/2 (50%), у второго 0/1 (0%). Среднее учеников было бы 25%, взвешенно 1/3 = 33%.
    const sessionsByUser = new Map<string, StatsSessionInput[]>([
      [
        'u1',
        [
          {
            mode: 'single',
            assignment_id: null,
            assignment_type: null,
            answers: {
              '1': { taskId: 13, correct: false, score: 1, maxScore: 2 },
            },
          },
        ],
      ],
      [
        'u2',
        [
          {
            mode: 'single',
            assignment_id: null,
            assignment_type: null,
            answers: {
              '1': { taskId: 13, correct: false, score: 0, maxScore: 1 },
            },
          },
        ],
      ],
    ]);

    const sheets = buildAnalyticsSheets({
      members,
      sessionsByUser,
      statsFilter: 'all',
      filterLabel: 'Все',
      className: '9В',
      exportedAt: '17.11.2026',
    });

    const summarySheet = sheets[1];
    expect(summarySheet.name).toBe('Класс - Все');
    expect(summarySheet.rows).toHaveLength(16);

    // Номер 13 (индекс 12): 2 решения, 0 верно, 1 балл, 3 макс, 33% red + numFmt
    expect(summarySheet.rows[12]).toEqual([
      13,
      2,
      0,
      1,
      3,
      { v: 33, fill: 'red', numFmt: '0"%"' },
    ]);

    // Номер без решений: пустые ячейки и gray + numFmt
    expect(summarySheet.rows[0]).toEqual([
      1,
      null,
      null,
      null,
      null,
      { v: null, fill: 'gray', numFmt: '0"%"' },
    ]);
  });
});

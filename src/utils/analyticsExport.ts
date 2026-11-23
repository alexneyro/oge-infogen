import { ClassMemberWithProfile } from '../hooks/useClasses';
import { StyledCell, StyledFillColor, StyledSheet } from '../lib/exportXlsx';
import {
  aggregateTaskStats,
  StatsFilter,
  StatsSessionInput,
  TaskStat,
} from './taskStats';

export function getMatrixCell(stat: TaskStat | undefined): {
  pct: number | null;
  level: StyledFillColor;
} {
  if (!stat || stat.total === 0) {
    return { pct: null, level: 'gray' };
  }

  const pct =
    stat.totalMaxScore > 0
      ? Math.round((stat.totalScore / stat.totalMaxScore) * 100)
      : 0;

  const level: StyledFillColor =
    pct >= 70 ? 'green' : pct >= 40 ? 'yellow' : 'red';

  return { pct, level };
}

export interface BuildAnalyticsSheetsInput {
  members: ClassMemberWithProfile[];
  sessionsByUser: Map<string, StatsSessionInput[]>;
  statsFilter: StatsFilter;
  filterLabel: string;
  className: string;
  exportedAt: string;
}

const TASK_NUMBERS = Array.from({ length: 16 }, (_, i) => i + 1);
const PCT_NUM_FMT = '0"%"';

function getMemberNameCols(member: ClassMemberWithProfile): {
  lastName: string;
  firstName: string;
} {
  const lastName = member.profiles?.last_name?.trim() || '';
  const firstName = member.profiles?.first_name?.trim() || '';
  if (!lastName && !firstName) {
    return { lastName: 'Без имени', firstName: '' };
  }
  return { lastName, firstName };
}

function formatAnalyticsSheetName(prefix: string, filterLabel: string): string {
  const cleanLabel = filterLabel.replace(/[\\/:*?\[\]]/g, ' ').trim();
  const maxLabelLength = Math.max(0, 31 - prefix.length);
  return `${prefix}${cleanLabel.slice(0, maxLabelLength)}`.trim();
}

export function buildAnalyticsSheets({
  members,
  sessionsByUser,
  statsFilter,
  filterLabel,
  className,
  exportedAt,
}: BuildAnalyticsSheetsInput): StyledSheet[] {
  const sortedMembers = [...members].sort((a, b) => {
    const nameA = getMemberNameCols(a);
    const nameB = getMemberNameCols(b);
    return (
      nameA.lastName.localeCompare(nameB.lastName, 'ru') ||
      nameA.firstName.localeCompare(nameB.firstName, 'ru')
    );
  });

  const totalsByTask = new Map<number, TaskStat>();
  for (const taskNum of TASK_NUMBERS) {
    totalsByTask.set(taskNum, {
      taskId: taskNum,
      total: 0,
      correct: 0,
      totalScore: 0,
      totalMaxScore: 0,
    });
  }

  const matrixRows: StyledCell[][] = sortedMembers.map((member) => {
    const { lastName, firstName } = getMemberNameCols(member);
    const studentSessions = sessionsByUser.get(member.student_id) || [];
    const aggregated = aggregateTaskStats(studentSessions, statsFilter);
    const byTaskId = new Map<number, TaskStat>();
    for (const stat of aggregated) {
      byTaskId.set(stat.taskId, stat);

      const summary = totalsByTask.get(stat.taskId);
      if (summary) {
        summary.total += stat.total;
        summary.correct += stat.correct;
        summary.totalScore += stat.totalScore;
        summary.totalMaxScore += stat.totalMaxScore;
      }
    }

    const taskCells: StyledCell[] = TASK_NUMBERS.map((taskNum) => {
      const cell = getMatrixCell(byTaskId.get(taskNum));
      return {
        v: cell.pct,
        fill: cell.level,
        numFmt: PCT_NUM_FMT,
      };
    });

    return [lastName, firstName, ...taskCells];
  });

  const byTaskSheet: StyledSheet = {
    name: formatAnalyticsSheetName('Матрица - ', filterLabel),
    headers: ['Фамилия', 'Имя', ...TASK_NUMBERS.map((n) => `№${n}`)],
    rows: matrixRows,
    freezeCols: 2,
    colWidths: [18, 16, ...TASK_NUMBERS.map(() => 8)],
  };

  const summaryRows: StyledCell[][] = TASK_NUMBERS.map((taskNum) => {
    const summary = totalsByTask.get(taskNum)!;
    const cell = getMatrixCell(summary);
    if (summary.total === 0) {
      return [
        taskNum,
        null,
        null,
        null,
        null,
        { v: cell.pct, fill: cell.level, numFmt: PCT_NUM_FMT },
      ];
    }

    return [
      taskNum,
      summary.total,
      summary.correct,
      summary.totalScore,
      summary.totalMaxScore,
      { v: cell.pct, fill: cell.level, numFmt: PCT_NUM_FMT },
    ];
  });

  const classSheetName = formatAnalyticsSheetName('Класс - ', filterLabel);

  const classSummarySheet: StyledSheet = {
    name: classSheetName,
    headers: [
      'Номер ОГЭ',
      'Решено раз',
      'Верно раз',
      'Баллы',
      'Макс. баллов',
      '%',
    ],
    rows: summaryRows,
  };

  const explanationSheet: StyledSheet = {
    name: 'Пояснение',
    headers: ['Параметр', 'Значение'],
    colWidths: [28, 90],
    wrapData: true,
    rows: [
      ['Класс', className],
      ['Источник работ', filterLabel],
      ['Дата выгрузки', exportedAt],
      [
        'Что в ячейках',
        'Процент набранных баллов по номеру ОГЭ: сумма набранных баллов / сумма максимальных, по всем решениям выбранного источника',
      ],
      ['Зелёный', '70% и выше'],
      ['Жёлтый', '40–69%'],
      ['Красный', 'ниже 40%'],
      [
        'Серая пустая ячейка',
        'нет данных: ученик не решал этот номер в выбранном источнике',
      ],
      [
        'Пустые ответы',
        'Пустой ответ в сданной работе считается как 0 баллов',
      ],
      [
        `Лист «${classSheetName}»`,
        'Итог по классу: суммы баллов по всем ученикам, процент считается от суммы, а не как среднее процентов учеников',
      ],
    ],
  };

  return [byTaskSheet, classSummarySheet, explanationSheet];
}

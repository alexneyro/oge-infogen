import { StyledCell, StyledFillColor, StyledSheet, mskDateTimeCell } from '../lib/exportXlsx';
import { getTaskById } from '../tasks';

export interface AssignmentExportEntry {
  position: number;
  taskId: number;
  maxScore: number;
}

export interface AssignmentExportAnswerEntry {
  answer?: unknown;
  correct?: boolean;
  score?: number;
  maxScore?: number;
  taskId?: number;
}

export interface AssignmentExportResultRow {
  student_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  time_spent_seconds: number | null;
  is_submitted: boolean;
  attempts: number;
  best_session_id?: string | null;
}

export interface BuildAssignmentSheetsInput {
  assignment: {
    title?: string | null;
    max_attempts?: number | null;
    set_config?: Record<string, unknown> | null;
  };
  entries: AssignmentExportEntry[];
  results: AssignmentExportResultRow[];
  answersBySession: Record<string, Record<string, AssignmentExportAnswerEntry>>;
}

function getStudentFullName(r: AssignmentExportResultRow): string {
  const firstName = (r.first_name || '').trim();
  const lastName = (r.last_name || '').trim();
  if (lastName && firstName) return `${lastName} ${firstName}`;
  return firstName || lastName || 'Ученик';
}

function resolveEntries(
  entries: AssignmentExportEntry[],
  results: AssignmentExportResultRow[],
  answersBySession: Record<string, Record<string, AssignmentExportAnswerEntry>>
): AssignmentExportEntry[] {
  if (entries.length > 0) {
    return [...entries].sort((a, b) => a.position - b.position);
  }

  const map = new Map<number, AssignmentExportEntry>();

  const collectFromAnswers = (sessionAnswers: Record<string, AssignmentExportAnswerEntry>) => {
    for (const [posKey, raw] of Object.entries(sessionAnswers)) {
      const pos = Number(posKey);
      if (!Number.isInteger(pos) || pos < 1) continue;
      if (!raw || typeof raw !== 'object') continue;

      const taskId =
        typeof raw.taskId === 'number' && Number.isFinite(raw.taskId)
          ? raw.taskId
          : Number(raw.taskId) || 0;
      const maxScore =
        typeof raw.maxScore === 'number' && raw.maxScore > 0
          ? raw.maxScore
          : taskId > 0
            ? (getTaskById(taskId)?.maxPoints ?? 1)
            : 1;

      const existing = map.get(pos);
      if (!existing || (existing.taskId === 0 && taskId > 0)) {
        map.set(pos, { position: pos, taskId, maxScore });
      }
    }
  };

  let collectedFromResults = false;
  for (const r of results) {
    if (!r.best_session_id) continue;
    const sessionAnswers = answersBySession[r.best_session_id];
    if (sessionAnswers && typeof sessionAnswers === 'object') {
      collectFromAnswers(sessionAnswers);
      collectedFromResults = true;
    }
  }

  if (!collectedFromResults) {
    for (const sessionAnswers of Object.values(answersBySession)) {
      if (sessionAnswers && typeof sessionAnswers === 'object') {
        collectFromAnswers(sessionAnswers);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.position - b.position);
}

export function buildAssignmentSheets(input: BuildAssignmentSheetsInput): StyledSheet[] {
  const { assignment, entries, results, answersBySession } = input;
  const resolvedEntries = resolveEntries(entries, results, answersBySession);

  const sortedResults = [...results].sort((a, b) => {
    const lastA = (a.last_name || '').trim();
    const lastB = (b.last_name || '').trim();
    const firstA = (a.first_name || '').trim();
    const firstB = (b.first_name || '').trim();
    return lastA.localeCompare(lastB, 'ru') || firstA.localeCompare(firstB, 'ru');
  });

  const posHeaders = resolvedEntries.map(
    (entry) => `поз. ${entry.position} (№${entry.taskId}, макс ${entry.maxScore})`
  );

  const resultsHeaders = [
    'Ученик',
    'Статус',
    'Итого',
    'Макс',
    '%',
    'Попытки',
    'Время (мин)',
    'Дата сдачи',
    ...posHeaders,
  ];

  const answersHeaders = ['Ученик', 'Статус', 'Итого', 'Макс', ...posHeaders];

  const resultsRows: StyledCell[][] = [];
  const answersRows: StyledCell[][] = [];

  for (const r of sortedResults) {
    const fullName = getStudentFullName(r);
    const statusCell: StyledCell = {
      v: r.is_submitted ? 'Сдал' : 'Не сдал',
      fill: r.is_submitted ? 'green' : 'gray',
    };
    const totalCell = r.is_submitted && r.score !== null ? r.score : null;
    const maxCell = r.is_submitted && r.max_score !== null ? r.max_score : null;
    const pctCell =
      r.is_submitted &&
      r.score !== null &&
      r.max_score !== null &&
      r.max_score > 0
        ? Math.round((r.score / r.max_score) * 100)
        : null;
    const attemptsCell: StyledCell =
      r.attempts > 0
        ? assignment.max_attempts
          ? `${r.attempts}/${assignment.max_attempts}`
          : r.attempts
        : null;
    const timeMinCell =
      r.is_submitted && typeof r.time_spent_seconds === 'number'
        ? Math.round((r.time_spent_seconds / 60) * 10) / 10
        : null;
    const submittedAtCell = r.submitted_at ? mskDateTimeCell(r.submitted_at) : null;

    const sessionAnswers =
      r.is_submitted && r.best_session_id ? answersBySession[r.best_session_id] : undefined;

    const resultPosCells: StyledCell[] = [];
    const answerPosCells: StyledCell[] = [];

    for (const entry of resolvedEntries) {
      if (!r.is_submitted) {
        resultPosCells.push(null);
        answerPosCells.push(null);
        continue;
      }

      const ans = sessionAnswers?.[String(entry.position)];
      const rawAnswer = ans?.answer;
      const answerStr =
        rawAnswer !== undefined && rawAnswer !== null ? String(rawAnswer) : '';
      const isEmptyAnswer = answerStr.trim() === '';

      const itemScore = typeof ans?.score === 'number' ? ans.score : 0;
      const itemMax =
        typeof ans?.maxScore === 'number' && ans.maxScore > 0
          ? ans.maxScore
          : entry.maxScore;

      // Лист «Результаты»: баллы и заливка
      let scoreFill: StyledFillColor;
      if (itemScore >= itemMax) {
        scoreFill = 'green';
      } else if (itemScore > 0) {
        scoreFill = 'yellow';
      } else if (isEmptyAnswer) {
        scoreFill = 'gray';
      } else {
        scoreFill = 'red';
      }
      resultPosCells.push({ v: itemScore, fill: scoreFill });

      // Лист «Ответы»: текст ответа и заливка
      if (itemScore > 0 && itemScore < itemMax) {
        answerPosCells.push({
          v: isEmptyAnswer ? null : answerStr,
          fill: 'yellow',
        });
      } else if (isEmptyAnswer) {
        answerPosCells.push({ v: null, fill: 'gray' });
      } else if (ans?.correct === true || itemScore >= itemMax) {
        answerPosCells.push({ v: answerStr, fill: 'green' });
      } else {
        answerPosCells.push({ v: answerStr, fill: 'red' });
      }
    }

    resultsRows.push([
      fullName,
      statusCell,
      totalCell,
      maxCell,
      pctCell,
      attemptsCell,
      timeMinCell,
      submittedAtCell,
      ...resultPosCells,
    ]);

    answersRows.push([fullName, statusCell, totalCell, maxCell, ...answerPosCells]);
  }

  const resultsColWidths = [
    24,
    12,
    10,
    10,
    10,
    12,
    14,
    19,
    ...resolvedEntries.map(() => 13),
  ];

  const answersColWidths = [24, 12, 10, 10, ...resolvedEntries.map(() => 22)];

  return [
    {
      name: 'Результаты',
      headers: resultsHeaders,
      rows: resultsRows,
      freezeCols: 1,
      colWidths: resultsColWidths,
    },
    {
      name: 'Ответы',
      headers: answersHeaders,
      rows: answersRows,
      freezeCols: 1,
      colWidths: answersColWidths,
    },
  ];
}

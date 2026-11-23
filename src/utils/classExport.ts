import { ClassMemberWithProfile } from '../hooks/useClasses';
import {
  StyledCell,
  StyledFillColor,
  StyledSheet,
  formatDateMsk,
} from '../lib/exportXlsx';
import { HistoryCategory, getSessionCategory } from './sessionCategory';

export interface ClassExportSessionRow {
  user_id: string;
  created_at: string;
  status: string | null;
  score: number | null;
  max_score: number | null;
  assignment_id: string | null;
  mode: string;
  assignments?: {
    assignment_type?: string | null;
  } | null;
}

export interface BuildStudentsSheetInput {
  members: ClassMemberWithProfile[];
  sessions: ClassExportSessionRow[];
  className: string;
  selectedTypes: HistoryCategory[];
}

export interface BuildCredentialsSheetInput {
  members: ClassMemberWithProfile[];
  className: string;
}

const ORDERED_WORK_TYPES: { id: HistoryCategory; label: string }[] = [
  { id: 'homework', label: 'ДЗ' },
  { id: 'classwork', label: 'Классные' },
  { id: 'mock', label: 'Пробники' },
  { id: 'variant', label: 'Вариант' },
  { id: 'trainer', label: 'Тренажёр' },
];

function sortMembersByName(members: ClassMemberWithProfile[]): ClassMemberWithProfile[] {
  return [...members].sort((a, b) => {
    const lastA = a.profiles?.last_name?.trim() || '';
    const lastB = b.profiles?.last_name?.trim() || '';
    const firstA = a.profiles?.first_name?.trim() || '';
    const firstB = b.profiles?.first_name?.trim() || '';
    return lastA.localeCompare(lastB, 'ru') || firstA.localeCompare(firstB, 'ru');
  });
}

function getPercentFill(avgPct: number): StyledFillColor {
  if (avgPct >= 70) return 'green';
  if (avgPct >= 40) return 'yellow';
  return 'red';
}

function parseTimestamp(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? 0 : ms;
}

interface CountedWork {
  userId: string;
  category: HistoryCategory;
  pct: number;
  score: number;
  createdAt: string;
  createdAtMs: number;
}

export function buildStudentsSheet({
  members,
  sessions,
  className,
  selectedTypes,
}: BuildStudentsSheetInput): StyledSheet {
  const selectedTypeSet = new Set<HistoryCategory>(selectedTypes);
  const activeTypes = ORDERED_WORK_TYPES.filter((t) => selectedTypeSet.has(t.id));

  const bestByAssignment = new Map<string, CountedWork>();
  const standaloneWorks: CountedWork[] = [];

  for (const s of sessions) {
    if (s.status !== 'completed') continue;
    if (typeof s.max_score !== 'number' || s.max_score <= 0) continue;
    if (typeof s.score !== 'number') continue;

    const category = getSessionCategory({
      mode: s.mode,
      assignment_id: s.assignment_id,
      assignment_type: s.assignments?.assignment_type ?? null,
    });
    if (!selectedTypeSet.has(category)) continue;

    const work: CountedWork = {
      userId: s.user_id,
      category,
      pct: (s.score / s.max_score) * 100,
      score: s.score,
      createdAt: s.created_at,
      createdAtMs: parseTimestamp(s.created_at),
    };

    if (s.assignment_id) {
      const key = `${s.user_id}::${s.assignment_id}`;
      const existing = bestByAssignment.get(key);
      if (
        !existing ||
        work.score > existing.score ||
        (work.score === existing.score && work.createdAtMs < existing.createdAtMs)
      ) {
        bestByAssignment.set(key, work);
      }
    } else {
      standaloneWorks.push(work);
    }
  }

  const worksByStudent = new Map<string, CountedWork[]>();
  const addWork = (work: CountedWork) => {
    const list = worksByStudent.get(work.userId);
    if (list) {
      list.push(work);
    } else {
      worksByStudent.set(work.userId, [work]);
    }
  };

  for (const work of bestByAssignment.values()) {
    addWork(work);
  }
  for (const work of standaloneWorks) {
    addWork(work);
  }

  const headers: string[] = ['Фамилия', 'Имя', 'Класс', 'Дата вступления'];
  for (const wt of activeTypes) {
    headers.push(`${wt.label}: работ`, `${wt.label}: средний %`);
  }
  headers.push('Последняя работа (МСК)');

  const sortedMembers = sortMembersByName(members);
  const rows: StyledCell[][] = sortedMembers.map((m) => {
    const firstName = m.profiles?.first_name?.trim() || '';
    const lastName = m.profiles?.last_name?.trim() || '';
    const studentWorks = worksByStudent.get(m.student_id) || [];

    const row: StyledCell[] = [
      lastName || '—',
      firstName || (lastName ? '—' : 'Ученик'),
      className,
      formatDateMsk(m.joined_at),
    ];

    for (const wt of activeTypes) {
      const typeWorks = studentWorks.filter((w) => w.category === wt.id);
      if (typeWorks.length === 0) {
        row.push(0, null);
      } else {
        const sumPct = typeWorks.reduce((acc, w) => acc + w.pct, 0);
        const avgPct = Math.round(sumPct / typeWorks.length);
        row.push(typeWorks.length, { v: avgPct, fill: getPercentFill(avgPct) });
      }
    }

    if (studentWorks.length === 0) {
      row.push(null);
    } else {
      let latest = studentWorks[0];
      for (let i = 1; i < studentWorks.length; i++) {
        if (studentWorks[i].createdAtMs > latest.createdAtMs) {
          latest = studentWorks[i];
        }
      }
      row.push(formatDateMsk(latest.createdAt));
    }

    return row;
  });

  return {
    name: 'Ученики',
    headers,
    rows,
    freezeCols: 1,
  };
}

export function buildCredentialsSheet({
  members,
  className,
}: BuildCredentialsSheetInput): StyledSheet | null {
  const credentialMembers = members.filter((m) => Boolean(m.profiles?.generated_login?.trim()));
  if (credentialMembers.length === 0) {
    return null;
  }

  const sortedMembers = sortMembersByName(credentialMembers);
  const rows: StyledCell[][] = sortedMembers.map((m) => {
    const firstName = m.profiles?.first_name?.trim() || '';
    const lastName = m.profiles?.last_name?.trim() || '';
    return [
      lastName || '—',
      firstName || (lastName ? '—' : 'Ученик'),
      className,
      m.profiles!.generated_login!.trim(),
      m.profiles?.generated_password || '—',
    ];
  });

  return {
    name: 'Логины и пароли',
    headers: ['Фамилия', 'Имя', 'Класс', 'Логин', 'Пароль (при создании)'],
    rows,
    freezeCols: 1,
  };
}

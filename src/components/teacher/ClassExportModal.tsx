import React, { useState, useEffect, useMemo } from 'react';
import { Download, AlertTriangle, X, Loader2 } from 'lucide-react';
import { ClassMemberWithProfile } from '../../hooks/useClasses';
import { supabase } from '../../lib/supabase';
import { getSessionCategory, HistoryCategory } from '../../utils/sessionCategory';
import { exportStyledWorkbook, StyledCell, StyledSheet, fetchAllPages, mskDateTimeCell } from '../../lib/exportXlsx';
import { buildCredentialsSheet, buildStudentsSheet } from '../../utils/classExport';

interface ClassExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  members: ClassMemberWithProfile[];
}

interface RawSessionRow {
  id: string;
  user_id: string;
  mode: string;
  score: number | null;
  max_score: number | null;
  time_spent_seconds: number | null;
  created_at: string;
  assignment_id: string | null;
  status: string | null;
  answers: Record<string, unknown> | null;
  variant_seed: string | null;
  assignments: {
    title: string | null;
    assignment_type: string | null;
  } | null;
}

interface AnswerEntry {
  taskId: number | string;
  answer?: unknown;
  correct?: boolean;
  score?: number;
  maxScore?: number;
}

type SheetKey = 'students' | 'sessions' | 'answers';

const WORK_TYPES: { id: HistoryCategory; label: string }[] = [
  { id: 'homework', label: 'ДЗ' },
  { id: 'classwork', label: 'Классные' },
  { id: 'mock', label: 'Пробники' },
  { id: 'variant', label: 'Вариант' },
  { id: 'trainer', label: 'Тренажёр' },
];

const WORK_TYPE_LABELS: Record<HistoryCategory, string> = {
  homework: 'ДЗ',
  classwork: 'Классные',
  mock: 'Пробники',
  variant: 'Вариант',
  trainer: 'Тренажёр',
};

const SHEET_OPTIONS: { id: SheetKey; label: string }[] = [
  { id: 'students', label: 'Ученики' },
  { id: 'sessions', label: 'Сессии' },
  { id: 'answers', label: 'Ответы' },
];

const DEFAULT_WORK_TYPES: HistoryCategory[] = ['homework', 'classwork', 'mock'];
const MAX_RECOMMENDED_ANSWER_ROWS = 20_000;

const mskDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Moscow',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function getMskDateKey(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return mskDateKeyFormatter.format(date);
}

function getStudentFullName(member: ClassMemberWithProfile | undefined): string {
  if (!member) return 'Ученик';
  const firstName = member.profiles?.first_name?.trim() || '';
  const lastName = member.profiles?.last_name?.trim() || '';
  if (lastName && firstName) return `${lastName} ${firstName}`;
  return firstName || lastName || member.profiles?.email || 'Ученик';
}

function isAnswerEntryWithTaskId(value: unknown): value is AnswerEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'taskId' in value &&
    (value as { taskId?: unknown }).taskId !== undefined &&
    (value as { taskId?: unknown }).taskId !== null
  );
}

function formatStatus(status: string | null): string {
  if (status === 'completed') return 'Завершена';
  if (status === 'in_progress') return 'В процессе';
  return status || '—';
}

function sortAnswerEntries(answers: Record<string, unknown>): [string, AnswerEntry][] {
  const entries: [string, AnswerEntry][] = [];
  for (const [posKey, rawEntry] of Object.entries(answers)) {
    if (isAnswerEntryWithTaskId(rawEntry)) {
      entries.push([posKey, rawEntry]);
    }
  }
  entries.sort(([a], [b]) => {
    const numA = Number(a);
    const numB = Number(b);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b, 'ru');
  });
  return entries;
}

export const ClassExportModal: React.FC<ClassExportModalProps> = ({
  isOpen,
  onClose,
  className,
  members,
}) => {
  const [periodMode, setPeriodMode] = useState<'all' | 'range'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<HistoryCategory[]>(DEFAULT_WORK_TYPES);
  const [selectedSheets, setSelectedSheets] = useState<SheetKey[]>([
    'students',
    'sessions',
  ]);

  const [sessions, setSessions] = useState<RawSessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportingCredentials, setExportingCredentials] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  const hasGeneratedCredentials = useMemo(
    () => members.some((m) => Boolean(m.profiles?.generated_login?.trim())),
    [members]
  );

  const memberIds = useMemo(() => members.map((m) => m.student_id), [members]);
  const memberIdsKey = useMemo(() => memberIds.join(','), [memberIds]);

  const memberMap = useMemo(() => {
    const map = new Map<string, ClassMemberWithProfile>();
    for (const m of members) {
      map.set(m.student_id, m);
    }
    return map;
  }, [members]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setLoadError(null);
    setExportError(null);
    setCredentialsError(null);

    if (memberIds.length === 0) {
      setSessions([]);
      setLoadingSessions(false);
      return;
    }

    const load = async () => {
      setLoadingSessions(true);
      try {
        const rows = await fetchAllPages<RawSessionRow>((from, to) =>
          (supabase as any)
            .from('sessions')
            .select(
              'id, user_id, mode, score, max_score, time_spent_seconds, created_at, assignment_id, status, answers, variant_seed, assignments(title, assignment_type)'
            )
            .in('user_id', memberIds)
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .range(from, to)
        );
        if (!cancelled) {
          setSessions(rows);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Не удалось загрузить сессии';
          setLoadError(message);
          setSessions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSessions(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, memberIdsKey]);

  const filteredSessions = useMemo(() => {
    const typeSet = new Set<HistoryCategory>(selectedTypes);
    return sessions.filter((s) => {
      const category = getSessionCategory({
        mode: s.mode,
        assignment_id: s.assignment_id,
        assignment_type: s.assignments?.assignment_type ?? null,
      });
      if (!typeSet.has(category)) return false;

      if (periodMode === 'range') {
        const dateKey = getMskDateKey(s.created_at);
        if (!dateKey) return false;
        if (dateFrom && dateKey < dateFrom) return false;
        if (dateTo && dateKey > dateTo) return false;
      }

      return true;
    });
  }, [sessions, selectedTypes, periodMode, dateFrom, dateTo]);

  const answerRowsCount = useMemo(() => {
    if (!selectedSheets.includes('answers')) return 0;
    let total = 0;
    for (const s of filteredSessions) {
      if (typeof s.answers === 'object' && s.answers !== null && !Array.isArray(s.answers)) {
        for (const entry of Object.values(s.answers)) {
          if (isAnswerEntryWithTaskId(entry)) {
            total += 1;
          }
        }
      }
    }
    return total;
  }, [filteredSessions, selectedSheets]);

  if (!isOpen) return null;

  const toggleWorkType = (type: HistoryCategory) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const toggleSheet = (sheet: SheetKey) => {
    setSelectedSheets((prev) =>
      prev.includes(sheet) ? prev.filter((item) => item !== sheet) : [...prev, sheet]
    );
  };

  const needsSessions =
    selectedSheets.includes('students') ||
    selectedSheets.includes('sessions') ||
    selectedSheets.includes('answers');
  const hasTooManyAnswers =
    selectedSheets.includes('answers') && answerRowsCount > MAX_RECOMMENDED_ANSWER_ROWS;
  const isBusy = (needsSessions && loadingSessions) || exporting;
  const isInvalidRange =
    periodMode === 'range' && Boolean(dateFrom) && Boolean(dateTo) && dateFrom > dateTo;
  const canDownload =
    !isBusy &&
    selectedSheets.length > 0 &&
    !loadError &&
    selectedTypes.length > 0 &&
    !isInvalidRange;

  const handleDownload = async () => {
    if (!canDownload) return;
    setExporting(true);
    setExportError(null);

    try {
      const sheets: StyledSheet[] = [];

      if (selectedSheets.includes('students')) {
        sheets.push(
          buildStudentsSheet({
            members,
            sessions: filteredSessions,
            className,
            selectedTypes,
          })
        );
      }

      if (selectedSheets.includes('sessions')) {
        const rows: StyledCell[][] = filteredSessions.map((s) => {
          const studentName = getStudentFullName(memberMap.get(s.user_id));
          const category = getSessionCategory({
            mode: s.mode,
            assignment_id: s.assignment_id,
            assignment_type: s.assignments?.assignment_type ?? null,
          });
          const pct =
            typeof s.score === 'number' && typeof s.max_score === 'number' && s.max_score > 0
              ? Math.round((s.score / s.max_score) * 100)
              : null;
          const timeMin =
            s.mode === 'mock'
              ? null
              : typeof s.time_spent_seconds === 'number'
                ? Math.round((s.time_spent_seconds / 60) * 10) / 10
                : null;

          return [
            studentName,
            className,
            mskDateTimeCell(s.created_at),
            WORK_TYPE_LABELS[category],
            s.assignments?.title?.trim() || '—',
            typeof s.score === 'number' ? s.score : null,
            typeof s.max_score === 'number' ? s.max_score : null,
            pct,
            timeMin,
            formatStatus(s.status),
            s.variant_seed || '—',
          ];
        });

        sheets.push({
          name: 'Сессии',
          headers: [
            'Ученик',
            'Класс',
            'Дата (МСК)',
            'Тип работы',
            'Название',
            'Балл',
            'Макс. балл',
            '%',
            'Время (мин)',
            'Статус',
            'Код набора',
          ],
          rows,
        });
      }

      if (selectedSheets.includes('answers')) {
        const rows: StyledCell[][] = [];

        for (const s of filteredSessions) {
          if (typeof s.answers !== 'object' || s.answers === null || Array.isArray(s.answers)) {
            continue;
          }
          const studentName = getStudentFullName(memberMap.get(s.user_id));
          const category = getSessionCategory({
            mode: s.mode,
            assignment_id: s.assignment_id,
            assignment_type: s.assignments?.assignment_type ?? null,
          });
          const categoryLabel = WORK_TYPE_LABELS[category];
          const dateMsk = mskDateTimeCell(s.created_at);
          const title = s.assignments?.title?.trim() || '—';

          const answerEntries = sortAnswerEntries(s.answers);
          for (const [posKey, entry] of answerEntries) {
            const posNum = /^\d+$/.test(posKey) ? Number(posKey) : posKey;
            const taskIdNum =
              typeof entry.taskId === 'number'
                ? entry.taskId
                : Number.isFinite(Number(entry.taskId))
                  ? Number(entry.taskId)
                  : String(entry.taskId);
            const answerText =
              entry.answer !== undefined &&
              entry.answer !== null &&
              String(entry.answer) !== ''
                ? String(entry.answer)
                : '—';

            rows.push([
              studentName,
              className,
              dateMsk,
              categoryLabel,
              title,
              posNum,
              taskIdNum,
              answerText,
              entry.correct ? 1 : 0,
              typeof entry.score === 'number' ? entry.score : null,
              typeof entry.maxScore === 'number' ? entry.maxScore : null,
            ]);
          }
        }

        sheets.push({
          name: 'Ответы',
          headers: [
            'Ученик',
            'Класс',
            'Дата (МСК)',
            'Тип работы',
            'Название',
            'Позиция',
            'Номер ОГЭ',
            'Ответ',
            'Верно',
            'Балл',
            'Макс. балл',
          ],
          rows,
        });
      }

      const todayMsk = mskDateKeyFormatter.format(new Date());
      const safeClassName = className.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Класс';
      await exportStyledWorkbook(`${safeClassName}_данные_${todayMsk}.xlsx`, sheets);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при создании файла';
      setExportError(message);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadCredentials = async () => {
    if (!hasGeneratedCredentials || exportingCredentials) return;
    setExportingCredentials(true);
    setCredentialsError(null);

    try {
      const sheet = buildCredentialsSheet({ members, className });
      if (!sheet) {
        setCredentialsError('Нет учеников, добавленных без аккаунта');
        return;
      }

      const todayMsk = mskDateKeyFormatter.format(new Date());
      const safeClassName = className.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Класс';
      await exportStyledWorkbook(`${safeClassName}_логины_${todayMsk}.xlsx`, [sheet]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при создании файла';
      setCredentialsError(message);
    } finally {
      setExportingCredentials(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={() => {
        if (!exporting && !exportingCredentials) onClose();
      }}
    >
      <div
        className="bg-theme-card border border-theme-border rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-theme-text">Экспорт данных класса</h3>
            <p className="text-xs text-theme-text-muted mt-0.5">{className}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={exporting || exportingCredentials}
            aria-label="Закрыть"
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Period */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">
            Период
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-theme-text cursor-pointer">
              <input
                type="radio"
                name="export-period"
                checked={periodMode === 'all'}
                onChange={() => setPeriodMode('all')}
                className="accent-blue-600 cursor-pointer"
              />
              <span>За всё время</span>
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-theme-text cursor-pointer">
              <input
                type="radio"
                name="export-period"
                checked={periodMode === 'range'}
                onChange={() => setPeriodMode('range')}
                className="accent-blue-600 cursor-pointer"
              />
              <span>Указать период</span>
            </label>
          </div>

          {periodMode === 'range' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label className="block space-y-1">
                <span className="text-[11px] text-theme-text-muted">с</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-[11px] text-theme-text-muted">по</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </label>
            </div>
          )}

          {isInvalidRange && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Дата начала периода не может быть позже даты окончания.
            </p>
          )}
        </div>

        {/* Work types */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">
            Типы работ
          </div>
          <div className="flex flex-wrap gap-2">
            {WORK_TYPES.map((wt) => {
              const checked = selectedTypes.includes(wt.id);
              return (
                <label
                  key={wt.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer select-none ${
                    checked
                      ? 'border-blue-500/60 bg-blue-500/10 text-theme-text font-medium'
                      : 'border-theme-border bg-theme-bg text-theme-text-sec hover:text-theme-text'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleWorkType(wt.id)}
                    className="accent-blue-600 cursor-pointer"
                  />
                  <span>{wt.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Sheets */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">
            Листы в файле
          </div>
          <div className="flex flex-wrap gap-2">
            {SHEET_OPTIONS.map((opt) => {
              const checked = selectedSheets.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-colors cursor-pointer select-none ${
                    checked
                      ? 'border-blue-500/60 bg-blue-500/10 text-theme-text font-medium'
                      : 'border-theme-border bg-theme-bg text-theme-text-sec hover:text-theme-text'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSheet(opt.id)}
                    className="accent-blue-600 cursor-pointer"
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Credentials export section */}
        <div className="space-y-2.5 pt-1 border-t border-theme-border/60">
          <div className="text-xs font-bold uppercase tracking-wider text-theme-text-muted">
            Логины и пароли
          </div>
          <p className="text-xs text-theme-text-sec">
            Отдельный файл для учеников, добавленных без аккаунта
          </p>
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              Файл содержит пароли учеников. Не пересылайте его и не публикуйте
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadCredentials}
              disabled={!hasGeneratedCredentials || exportingCredentials}
              aria-disabled={!hasGeneratedCredentials || exportingCredentials}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                !hasGeneratedCredentials
                  ? 'border-theme-border bg-theme-bg text-theme-text-muted opacity-50 cursor-not-allowed'
                  : 'border-theme-border bg-theme-bg hover:bg-theme-card text-theme-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {exportingCredentials ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Формируется...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать логины</span>
                </>
              )}
            </button>
            {!hasGeneratedCredentials && (
              <span className="text-xs text-theme-text-muted">
                Нет учеников, добавленных без аккаунта
              </span>
            )}
          </div>
          {credentialsError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {credentialsError}
            </div>
          )}
        </div>

        {/* Status / Counts / Warnings */}
        <div className="rounded-xl border border-theme-border bg-theme-bg/70 px-3.5 py-2.5 text-xs text-theme-text-sec space-y-1">
          {loadingSessions ? (
            <div className="flex items-center gap-2 text-theme-text-muted">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Загрузка сессий класса...</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {selectedSheets.includes('sessions') && (
                <span>
                  Сессий: <strong className="text-theme-text">{filteredSessions.length}</strong>
                </span>
              )}
              {selectedSheets.includes('answers') && (
                <span>
                  Строк ответов:{' '}
                  <strong className="text-theme-text">
                    {answerRowsCount.toLocaleString('ru-RU')}
                  </strong>
                </span>
              )}
              {selectedSheets.includes('students') && (
                <span>
                  Учеников: <strong className="text-theme-text">{members.length}</strong>
                </span>
              )}
              {selectedSheets.length === 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  Выберите хотя бы один лист для экспорта
                </span>
              )}
            </div>
          )}
        </div>

        {hasTooManyAnswers && !loadingSessions && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-semibold">
                В листе «Ответы» больше 20 000 строк ({answerRowsCount.toLocaleString('ru-RU')})
              </p>
              <p className="text-amber-700/90 dark:text-amber-200/80">
                Файл будет сформирован целиком без обрезания, но генерация может занять больше
                времени. При необходимости сузьте период или отключите лишние типы работ.
              </p>
            </div>
          </div>
        )}

        {(loadError || exportError) && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300">
            {loadError || exportError}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting || exportingCredentials}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-theme-border text-theme-text-sec hover:text-theme-text hover:bg-theme-bg transition-colors cursor-pointer disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!canDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Формируется...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Скачать</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

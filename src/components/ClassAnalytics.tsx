import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchAllPages, exportStyledWorkbook } from '../lib/exportXlsx';
import { ClassMemberWithProfile } from '../hooks/useClasses';
import {
  aggregateTaskStats,
  StatsFilter,
  StatsSessionInput,
  TaskStat,
} from '../utils/taskStats';
import { buildAnalyticsSheets, getMatrixCell } from '../utils/analyticsExport';

interface Props {
  classId: string;
  className?: string;
  members: ClassMemberWithProfile[];
}

interface RawAnalyticsSession {
  user_id: string;
  answers: Record<string, unknown> | null;
  mode: string | null;
  assignment_id: string | null;
  assignments: {
    assignment_type: string | null;
  } | null;
}

const FILTER_OPTIONS: ReadonlyArray<{ key: StatsFilter; label: string }> = [
  { key: 'all', label: 'Все' },
  { key: 'self', label: 'Самостоятельные' },
  { key: 'hw', label: 'По ДЗ' },
  { key: 'classwork', label: 'Классные' },
  { key: 'mock', label: 'Пробники' },
];

const mskDateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Moscow',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const ClassAnalytics: React.FC<Props> = ({ classId, className, members }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statsFilter, setStatsFilter] = useState<StatsFilter>('all');
  const [sessionsByUser, setSessionsByUser] = useState<Map<string, StatsSessionInput[]>>(
    () => new Map()
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async (isCancelledRef?: { current: boolean }) => {
    if (!members || members.length === 0) {
      setSessionsByUser(new Map());
      setLoadError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    const studentIds = members.map((m) => m.student_id);

    try {
      const sessions = await fetchAllPages<RawAnalyticsSession>((from, to) =>
        (supabase as any)
          .from('sessions')
          .select('user_id, answers, mode, assignment_id, assignments(assignment_type)')
          .in('user_id', studentIds)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
      );

      const grouped = new Map<string, StatsSessionInput[]>();
      for (const row of sessions) {
        const mapped: StatsSessionInput = {
          answers: row.answers ?? {},
          mode: row.mode ?? null,
          assignment_id: row.assignment_id ?? null,
          assignment_type: row.assignments?.assignment_type ?? null,
        };
        const arr = grouped.get(row.user_id) || [];
        arr.push(mapped);
        grouped.set(row.user_id, arr);
      }

      if (!isCancelledRef?.current) {
        setSessionsByUser(grouped);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching sessions for class analytics:', err);
      if (!isCancelledRef?.current) {
        setSessionsByUser(new Map());
        setLoadError('Не удалось загрузить аналитику');
        setLoading(false);
      }
    }
  }, [members]);

  useEffect(() => {
    const isCancelledRef = { current: false };
    loadAnalytics(isCancelledRef);

    return () => {
      isCancelledRef.current = true;
    };
  }, [classId, loadAnalytics]);

  const matrix = useMemo(() => {
    const result = new Map<string, Map<number, TaskStat>>();
    for (const member of members) {
      const studentSessions = sessionsByUser.get(member.student_id) || [];
      const aggregated = aggregateTaskStats(studentSessions, statsFilter);
      const byTaskId = new Map<number, TaskStat>();
      for (const stat of aggregated) {
        byTaskId.set(stat.taskId, stat);
      }
      result.set(member.student_id, byTaskId);
    }
    return result;
  }, [members, sessionsByUser, statsFilter]);

  const exportDisabled = loading || Boolean(loadError) || members.length === 0 || exporting;

  const handleExport = async () => {
    if (exportDisabled) return;
    setExporting(true);
    setExportError(null);
    try {
      const filterLabel =
        FILTER_OPTIONS.find((f) => f.key === statsFilter)?.label ?? 'Все';
      const resolvedClassName = className?.trim() || 'Класс';
      const safeClassName =
        resolvedClassName.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Класс';
      const safeFilterLabel =
        filterLabel.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Все';
      const now = new Date();
      const todayMsk = mskDateKeyFormatter.format(now);
      const exportedAt = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Moscow',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(now);
      const sheets = buildAnalyticsSheets({
        members,
        sessionsByUser,
        statsFilter,
        filterLabel,
        className: resolvedClassName,
        exportedAt,
      });
      await exportStyledWorkbook(
        `${safeClassName}_аналитика_${safeFilterLabel}_${todayMsk}.xlsx`,
        sheets
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Не удалось экспортировать файл';
      setExportError(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-theme-border bg-theme-card overflow-hidden">
      {/* Header and Legend */}
      <div className="p-4 border-b border-theme-border space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h4 className="text-base font-bold text-theme-text">Матрица ошибок</h4>
              <p className="text-xs text-theme-text-muted mt-0.5">
                По номерам ОГЭ
              </p>
            </div>

            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={handleExport}
                disabled={exportDisabled}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exporting ? 'Экспорт...' : 'Экспорт'}</span>
              </button>
              {exportError && (
                <p className="text-xs text-red-600 dark:text-red-400">{exportError}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-theme-border bg-theme-bg p-1">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatsFilter(f.key)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  statsFilter === f.key
                    ? 'bg-blue-600 text-white'
                    : 'text-theme-text-sec hover:text-theme-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-theme-text-sec">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500/90 shrink-0" />
            <span>≥ 70%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500/90 shrink-0" />
            <span>40–69%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/90 shrink-0" />
            <span>&lt; 40%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-theme-border/40 shrink-0" />
            <span>нет данных</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-theme-text-muted">
          Загрузка аналитики...
        </div>
      ) : loadError ? (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-theme-text-sec">{loadError}</p>
          <button
            type="button"
            onClick={() => loadAnalytics()}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          >
            Повторить
          </button>
        </div>
      ) : members.length === 0 ? (
        <div className="p-8 text-center text-xs text-theme-text-muted">
          В классе нет учеников
        </div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-theme-bg border-b border-theme-border">
                <th className="py-3 px-4 text-left text-xs font-semibold text-theme-text-muted uppercase tracking-wide whitespace-nowrap">
                  Ученик
                </th>
                {Array.from({ length: 16 }, (_, i) => i + 1).map((taskNum) => (
                  <th
                    key={taskNum}
                    className="py-3 px-2 text-center text-xs font-semibold text-theme-text-muted"
                  >
                    №{taskNum}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const lastName = member.profiles?.last_name?.trim() || '';
                const firstName = member.profiles?.first_name?.trim() || '';
                const firstInitial = firstName ? `${firstName[0]}.` : '';
                const displayName =
                  lastName || firstName
                    ? `${lastName} ${firstInitial}`.trim()
                    : member.profiles?.email || 'Ученик';

                const studentStats = matrix.get(member.student_id);

                return (
                  <tr
                    key={member.student_id}
                    className="border-b border-theme-border/50 hover:bg-theme-bg/40 transition-colors"
                  >
                    <td
                      onClick={() =>
                        navigate(`/teacher/classes/${classId}/students/${member.student_id}`)
                      }
                      className="py-3 px-4 text-sm font-medium text-theme-text whitespace-nowrap cursor-pointer hover:text-indigo-400 transition-colors"
                      title={displayName}
                    >
                      {displayName}
                    </td>
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((taskNum) => {
                      const stat = studentStats?.get(taskNum);
                      const { pct, level } = getMatrixCell(stat);

                      const bgClass =
                        level === 'green'
                          ? 'bg-emerald-500/90 text-white'
                          : level === 'yellow'
                            ? 'bg-yellow-500/90 text-gray-900'
                            : level === 'red'
                              ? 'bg-red-500/90 text-white'
                              : 'bg-theme-border/40 text-theme-text-muted';

                      const title =
                        stat && stat.total > 0
                          ? `№${taskNum}: набрано ${stat.totalScore} из ${stat.totalMaxScore} баллов, решено ${stat.total} раз`
                          : `№${taskNum}: нет данных`;

                      return (
                        <td key={taskNum} className="py-2 px-2 text-center">
                          <div
                            title={title}
                            className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold shadow-xs cursor-default ${bgClass}`}
                          >
                            {pct !== null ? `${pct}%` : '—'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

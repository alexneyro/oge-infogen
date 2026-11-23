import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { fetchAllPages } from '../../lib/fetchAllPages';

import {
  aggregateTaskStats,
  StatsFilter,
  StatsSessionInput,
} from '../../utils/taskStats';

export const StatsPage: React.FC = () => {
  const { user } = useAuth();

  const [statsFilter, setStatsFilter] = useState<StatsFilter>('all');
  const [rawSessions, setRawSessions] = useState<StatsSessionInput[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const taskStats = useMemo(
    () => aggregateTaskStats(rawSessions, statsFilter),
    [rawSessions, statsFilter]
  );

  const loadSessions = useCallback(async () => {
    if (!user?.id) return;

    setSessionsLoading(true);
    setLoadError(null);
    try {
      const allSessionRows = await fetchAllPages<any>((from, to) =>
        (supabase as any)
          .from('sessions')
          .select('answers, mode, assignment_id, assignments(assignment_type)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
      );

      setRawSessions(
        allSessionRows.map((row: any) => ({
          answers: row.answers ?? {},
          mode: row.mode ?? null,
          assignment_id: row.assignment_id ?? null,
          assignment_type: (row.assignments as any)?.assignment_type ?? null,
        }))
      );
    } catch {
      setLoadError('Не удалось загрузить статистику');
      setRawSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2.5 pb-4 border-b border-theme-border">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <BarChart2 className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-theme-text">Моя статистика</h1>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-theme-text">Статистика по заданиям</h2>
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-theme-border bg-theme-card p-1">
            {(
              [
                { key: 'all', label: 'Все' },
                { key: 'self', label: 'Самостоятельные' },
                { key: 'hw', label: 'По ДЗ' },
                { key: 'classwork', label: 'Классные' },
                { key: 'mock', label: 'Пробники' },
              ] as const
            ).map((f) => (
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
        {sessionsLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
            <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
            <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
          </div>
        ) : loadError ? (
          <div className="py-12 px-4 text-center rounded-2xl border border-theme-border bg-theme-card space-y-3">
            <p className="text-sm text-theme-text-sec">{loadError}</p>
            <button
              type="button"
              onClick={loadSessions}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              Повторить
            </button>
          </div>
        ) : taskStats.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-theme-border bg-theme-card">
            <p className="text-sm text-theme-text-sec">Нет данных — ученик ещё не решал задания</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-theme-border bg-theme-card shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-theme-border text-theme-text-muted uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">№</th>
                  <th className="py-3 px-4 font-bold">Решено раз</th>
                  <th className="py-3 px-4 font-bold">Правильно</th>
                  <th className="py-3 px-4 font-bold">% правильных</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/60">
                {taskStats.map((stat) => {
                  const pct = Math.round((stat.correct / stat.total) * 100);
                  const pctColor =
                    pct >= 70
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : pct >= 40
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400';

                  return (
                    <tr key={stat.taskId} className="hover:bg-theme-bg/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-theme-text">{stat.taskId}</td>
                      <td className="py-3.5 px-4 text-theme-text">{stat.total}</td>
                      <td className="py-3.5 px-4 text-theme-text">
                        {stat.correct} из {stat.total}
                      </td>
                      <td className={`py-3.5 px-4 font-semibold ${pctColor}`}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

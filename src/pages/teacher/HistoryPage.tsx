import React, { useState, useEffect } from 'react';
import { History, Zap, FileText, Layers, ClipboardList, EyeOff, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface SessionRecord {
  id: string;
  mode: string;
  score: number;
  max_score: number;
  time_spent_seconds: number;
  created_at: string;
  assignment_id: string | null;
  task_type: number | null;
  assignment_title?: string | null;
}

export const TeacherHistoryPage: React.FC = () => {
  const { user } = useAuth();

  const [hideTrainer, setHideTrainer] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        const { data: historyRows } = await (supabase as any)
          .from('sessions')
          .select('id, mode, score, max_score, time_spent_seconds, created_at, assignment_id, task_type, assignments(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        const mappedSessions: SessionRecord[] = (historyRows || []).map((row: any) => ({
          id: row.id,
          mode: row.mode,
          score: row.score,
          max_score: row.max_score,
          time_spent_seconds: row.time_spent_seconds ?? 0,
          created_at: row.created_at,
          assignment_id: row.assignment_id ?? null,
          task_type: row.task_type ?? null,
          assignment_title: (row as any).assignments?.title ?? null,
        }));
        setSessions(mappedSessions);
      } finally {
        setSessionsLoading(false);
      }
    };

    loadSessions();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2.5 pb-4 border-b border-theme-border">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <History className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-theme-text">История решений</h1>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-theme-text">История решений</h2>
          <button
            type="button"
            onClick={() => setHideTrainer((prev) => !prev)}
            className={`border rounded-lg px-3 py-1 text-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
              hideTrainer
                ? 'border-indigo-500 text-indigo-400'
                : 'border-theme-border text-theme-text-sec'
            }`}
          >
            {hideTrainer ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{hideTrainer ? 'Показать тренажёр' : 'Скрыть тренажёр'}</span>
          </button>
        </div>
        {sessionsLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
            <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
            <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-theme-border bg-theme-card">
            <p className="text-sm text-theme-text-sec">Решений пока нет</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-theme-border bg-theme-card shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-theme-border text-theme-text-muted uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Дата</th>
                  <th className="py-3 px-4 font-bold">Режим</th>
                  <th className="py-3 px-4 font-bold">Задание</th>
                  <th className="py-3 px-4 font-bold">Результат</th>
                  <th className="py-3 px-4 font-bold">Время</th>
                  <th className="py-3 px-4 font-bold">Название</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/60">
                {(hideTrainer ? sessions.filter((s) => s.mode !== 'single') : sessions).map((s) => {
                  const dateStr = new Date(s.created_at).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const modeLabel =
                    s.mode === 'single'
                      ? 'Тренажёр'
                      : s.mode === 'variant'
                        ? 'Вариант'
                        : s.mode === 'set'
                          ? 'Набор'
                          : s.mode;

                  const ModeIcon =
                    s.mode === 'single'
                      ? Zap
                      : s.mode === 'variant'
                        ? FileText
                        : s.mode === 'set'
                          ? Layers
                          : null;

                  const scoreColor =
                    s.score === s.max_score
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : s.score > 0
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400';

                  const timeStr =
                    s.time_spent_seconds === 0
                      ? '—'
                      : s.time_spent_seconds < 60
                        ? `${s.time_spent_seconds}с`
                        : `${Math.floor(s.time_spent_seconds / 60)}м ${s.time_spent_seconds % 60}с`;

                  return (
                    <tr key={s.id} className="hover:bg-theme-bg/40 transition-colors">
                      <td className="py-3.5 px-4 text-theme-text whitespace-nowrap">{dateStr}</td>
                      <td className="py-3.5 px-4 text-theme-text">
                        <div className="flex items-center gap-1.5">
                          {ModeIcon && <ModeIcon size={14} className="text-theme-text-sec shrink-0" />}
                          <span>{modeLabel}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-theme-text">
                        {s.mode === 'single' && s.task_type ? `№${s.task_type}` : '—'}
                      </td>
                      <td className={`py-3.5 px-4 font-semibold ${scoreColor}`}>
                        {s.score} / {s.max_score}
                      </td>
                      <td className="py-3.5 px-4 text-theme-text">{timeStr}</td>
                      <td className="py-3.5 px-4 text-theme-text">
                        {s.assignment_title ? (
                          <div className="flex items-center gap-1.5">
                            <ClipboardList size={14} className="text-theme-text-sec shrink-0" />
                            <span>{s.assignment_title}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
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

export const HistoryPage = TeacherHistoryPage;

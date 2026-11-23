import React, { useState } from 'react';
import { History, Zap, FileText, Layers, ClipboardList, EyeOff, Eye } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useSessionHistory } from '../../hooks/useSessionHistory';

const PAGE_SIZE = 50;

export const TeacherHistoryPage: React.FC = () => {
  const { user } = useAuth();

  const [hideTrainer, setHideTrainer] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    reload: reloadSessions,
  } = useSessionHistory(user?.id);

  const toggleHideTrainer = () => {
    setHideTrainer((prev) => !prev);
    setVisibleCount(PAGE_SIZE);
  };

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
            onClick={toggleHideTrainer}
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
        {(() => {
          const filteredSessions = hideTrainer
            ? sessions.filter((s) => s.mode !== 'single')
            : sessions;

          if (sessionsLoading) {
            return (
              <div className="space-y-3">
                <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
                <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
                <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
              </div>
            );
          }

          if (sessionsError) {
            return (
              <div className="py-12 px-4 text-center rounded-2xl border border-theme-border bg-theme-card space-y-3">
                <p className="text-sm text-theme-text-sec">{sessionsError}</p>
                <button
                  type="button"
                  onClick={reloadSessions}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                >
                  Повторить
                </button>
              </div>
            );
          }

          if (sessions.length === 0) {
            return (
              <div className="py-12 text-center rounded-2xl border border-theme-border bg-theme-card">
                <p className="text-sm text-theme-text-sec">Решений пока нет</p>
              </div>
            );
          }

          if (filteredSessions.length === 0) {
            return (
              <div className="py-12 text-center rounded-2xl border border-theme-border bg-theme-card">
                <p className="text-sm text-theme-text-sec">Нет записей по выбранным фильтрам</p>
              </div>
            );
          }

          const visibleSessions = filteredSessions.slice(0, visibleCount);
          const remainingCount = filteredSessions.length - visibleSessions.length;

          return (
            <div className="space-y-3">
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
                    {visibleSessions.map((s) => {
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
                            : s.mode === 'mock'
                              ? 'Пробник'
                              : s.mode === 'set'
                                ? 'Набор'
                                : s.mode;

                      const ModeIcon =
                        s.mode === 'single'
                          ? Zap
                          : s.mode === 'variant'
                            ? FileText
                            : s.mode === 'mock'
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-theme-text-muted">
                  Показано {visibleSessions.length} из {filteredSessions.length}
                </p>
                {remainingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text transition-colors cursor-pointer"
                  >
                    Показать ещё (осталось {remainingCount})
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export const HistoryPage = TeacherHistoryPage;

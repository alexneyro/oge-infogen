import React, { useState, useEffect } from 'react';
import { History, Zap, FileText, Layers, ClipboardList, EyeOff, Eye, CheckCircle2, XCircle, X, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { decodeSetShort, buildSet } from '../../set';
import { getAnswerKey } from '../../utils/answerKey';

interface SessionRecord {
  id: string;
  mode: string;
  score: number;
  max_score: number;
  time_spent_seconds: number;
  created_at: string;
  assignment_id: string | null;
  task_type: number | null;
  status?: string | null;
  assignment_type?: 'homework' | 'classwork' | null;
  assignment_title?: string | null;
}

interface ReviewEntry {
  position: number;
  taskId: number;
  userAnswer: string;
  correct: boolean;
  score: number;
  maxScore: number;
  expectedDisplay: string;
}

export const HistoryPage: React.FC = () => {
  const { user } = useAuth();

  const [hideTrainer, setHideTrainer] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [reviewSession, setReviewSession] = useState<{ title: string; entries: ReviewEntry[] } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const openReviewBySessionId = async (sessionId: string, title: string) => {
    setReviewLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('sessions')
        .select('answers, variant_seed')
        .eq('id', sessionId)
        .maybeSingle();

      if (error || !data) return;

      const answers: Record<string, unknown> = data.answers ?? {};
      const variantSeed: string | null = data.variant_seed ?? null;

      const entries: ReviewEntry[] = [];

      for (const [posStr, val] of Object.entries(answers)) {
        if (typeof val !== 'object' || val === null) continue;
        const a = val as {
          answer: string;
          correct: boolean;
          score: number;
          maxScore: number;
          taskId: number;
        };
        if (!('taskId' in a)) continue;

        entries.push({
          position: Number(posStr),
          taskId: a.taskId,
          userAnswer: a.answer ?? '',
          correct: a.correct,
          score: a.score,
          maxScore: a.maxScore,
          expectedDisplay: '—',
        });
      }

      if (variantSeed) {
        const cfg = decodeSetShort(variantSeed);
        if (cfg) {
          const { entries: builtEntries } = buildSet(cfg);
          for (const re of entries) {
            const be = builtEntries.find(e => e.position === re.position);
            if (be) {
              re.expectedDisplay = getAnswerKey(be.taskId, be.taskData).display;
            }
          }
        }
      }

      entries.sort((a, b) => a.position - b.position);
      setReviewSession({ title, entries });
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        const { data: historyRows } = await (supabase as any)
          .from('sessions')
          .select('id, mode, score, max_score, time_spent_seconds, created_at, assignment_id, task_type, status, assignments(title, assignment_type)')
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
          status: row.status ?? null,
          assignment_type: (row.assignments as any)?.assignment_type ?? null,
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
            <p className="text-sm text-theme-text-sec">Ученик ещё не решал задания</p>
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
                  <th className="py-3 px-4 font-bold">Ответы</th>
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

                  let modeLabel: string;
                  let ModeIcon: React.ElementType | null = null;
                  if (s.mode === 'single') {
                    modeLabel = 'Тренажёр';
                    ModeIcon = Zap;
                  } else if (s.mode === 'variant') {
                    modeLabel = 'Вариант';
                    ModeIcon = FileText;
                  } else if (s.mode === 'set') {
                    if (s.assignment_type === 'homework') {
                      modeLabel = 'ДЗ';
                      ModeIcon = ClipboardList;
                    } else if (s.assignment_type === 'classwork') {
                      modeLabel = 'Классная';
                      ModeIcon = Users;
                    } else {
                      modeLabel = 'Набор';
                      ModeIcon = Layers;
                    }
                  } else {
                    modeLabel = s.mode;
                  }

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
                      <td className="py-3.5 px-4 font-semibold">
                        {s.status === 'completed' ? (
                          <span className={scoreColor}>{s.score} / {s.max_score}</span>
                        ) : (
                          <span className="text-theme-text-muted">—</span>
                        )}
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
                      <td className="py-3.5 px-4">
                        {s.mode === 'set' && s.status === 'completed' ? (
                          <button
                            type="button"
                            onClick={() => openReviewBySessionId(
                              s.id, 
                              s.assignment_title || 'Набор'
                            )}
                            disabled={reviewLoading}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
                          >
                            <Eye size={12} />
                            Ответы
                          </button>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REVIEW SESSION MODAL */}
      {reviewSession && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setReviewSession(null)}
        >
          <div
            className="bg-theme-bg rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-theme-border"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-theme-border sticky top-0 bg-theme-bg z-10">
              <div>
                <h3 className="text-lg font-bold text-theme-text">Мои ответы</h3>
                <p className="text-sm text-theme-text-sec mt-0.5">{reviewSession.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {reviewLoading && (
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                )}
                <button
                  onClick={() => setReviewSession(null)}
                  className="p-2 rounded-lg hover:bg-theme-border/50 transition-colors text-theme-text-sec cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Итог */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-sm text-theme-text-sec">
                Верно:{' '}
                <span className="font-bold text-theme-text">
                  {reviewSession.entries.filter(e => e.correct).length}
                </span>{' '}
                из{' '}
                <span className="font-bold text-theme-text">
                  {reviewSession.entries.length}
                </span>{' '}
                · Баллы:{' '}
                <span className="font-bold text-theme-text">
                  {reviewSession.entries.reduce((s, e) => s + e.score, 0)}
                </span>{' '}
                /{' '}
                <span className="font-bold text-theme-text">
                  {reviewSession.entries.reduce((s, e) => s + e.maxScore, 0)}
                </span>
              </p>
            </div>

            {/* Таблица */}
            <div className="px-5 pb-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme-border text-theme-text-sec text-left">
                    <th className="py-2 pr-3 font-semibold">№</th>
                    <th className="py-2 pr-3 font-semibold">Задание</th>
                    <th className="py-2 pr-3 font-semibold">Ответ ученика</th>
                    <th className="py-2 pr-3 font-semibold">Правильный</th>
                    <th className="py-2 font-semibold">Балл</th>
                  </tr>
                </thead>
                <tbody>
                  {reviewSession.entries.map(entry => (
                    <tr key={entry.position} className="border-b border-theme-border/50 hover:bg-theme-card/50 transition-colors">
                      <td className="py-2.5 pr-3 font-mono text-theme-text-sec">{entry.position}</td>
                      <td className="py-2.5 pr-3 text-theme-text">ОГЭ {entry.taskId}</td>
                      <td className="py-2.5 pr-3 font-mono">
                        <span className={entry.correct ? 'text-green-600 dark:text-green-400' : entry.userAnswer ? 'text-red-500 dark:text-red-400' : 'text-theme-text-muted italic'}>
                          {entry.userAnswer || 'нет ответа'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-theme-text-sec">
                        {entry.expectedDisplay}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1">
                          {entry.correct
                            ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                            : <XCircle size={14} className="text-red-400 shrink-0" />
                          }
                          <span className="text-theme-text font-mono text-xs">
                            {entry.score}/{entry.maxScore}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

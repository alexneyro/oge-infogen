import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Check,
  Copy,
  Eye,
  X,
  Download,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { decodeSetShort, buildSet } from '../../set';
import { getAnswerKey } from '../../utils/answerKey';
import { getTaskById } from '../../tasks';
import { exportStyledWorkbook, fetchAllPages } from '../../lib/exportXlsx';
import {
  AssignmentExportAnswerEntry,
  AssignmentExportEntry,
  buildAssignmentSheets,
} from '../../utils/assignmentExport';

interface ReviewEntry {
  position: number;
  taskId: number;
  userAnswer: string;
  correct: boolean;
  score: number;
  maxScore: number;
  expectedDisplay: string;
  taskData: unknown;
}

interface ReviewSession {
  title: string;
  entries: ReviewEntry[];
}

export interface StudentResult {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  submitted_at: string | null;
  score: number | null;
  max_score: number | null;
  time_spent_seconds: number | null;
  is_submitted: boolean;
  attempts: number;
  best_session_id?: string | null;
}

export interface AssignmentDetail {
  id: string;
  title: string;
  class_id: string;
  class_name: string;
  due_date: string | null;
  max_attempts: number | null;
  is_active: boolean;
  created_at: string;
  set_config: Record<string, unknown> | null;
}

function formatDueDate(iso: string | null): string {
  if (!iso) return 'Без срока';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Без срока';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `до ${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} сек`;
  return `${mins} мин ${secs} сек`;
}

export const AssignmentDetailPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const setCode = assignment?.set_config?.code as string | undefined;

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
        const a = val as { answer: string; correct: boolean; score: number; maxScore: number; taskId: number; };
        if (!('taskId' in a)) continue;
        entries.push({
          position: Number(posStr),
          taskId: a.taskId,
          userAnswer: a.answer ?? '',
          correct: a.correct,
          score: a.score,
          maxScore: a.maxScore,
          expectedDisplay: '—',
          taskData: null,
        });
      }

      if (variantSeed) {
        const cfg = decodeSetShort(variantSeed);
        if (cfg) {
          const { entries: builtEntries } = buildSet(cfg);
          for (const re of entries) {
            const be = builtEntries.find(e => e.position === re.position);
            if (be) {
              re.taskData = be.taskData;
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
    if (!assignmentId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // a) запрос к assignments с join classes(name)
        const { data: assignRow, error: assignErr } = await (supabase as any)
          .from('assignments')
          .select('*, classes(name)')
          .eq('id', assignmentId)
          .maybeSingle();

        if (assignErr || !assignRow) {
          throw assignErr || new Error('Задание не найдено');
        }

        const detail: AssignmentDetail = {
          id: assignRow.id,
          title: assignRow.title,
          class_id: assignRow.class_id,
          class_name: assignRow.classes?.name || '—',
          due_date: assignRow.due_date,
          max_attempts: assignRow.max_attempts ?? null,
          is_active: assignRow.is_active,
          created_at: assignRow.created_at,
          set_config: assignRow.set_config,
        };
        setAssignment(detail);

        // b) запрос всех учеников класса
        const { data: memberRows, error: memberErr } = await (supabase as any)
          .from('class_members')
          .select('student_id, profiles(first_name, last_name, email)')
          .eq('class_id', detail.class_id);

        if (memberErr) throw memberErr;

        // c) запрос сессий
        const { data: sessionRows, error: sessionErr } = await (supabase as any)
          .from('sessions')
          .select('user_id, id, score, max_score, time_spent_seconds, created_at, status')
          .eq('assignment_id', assignmentId)
          .order('created_at', { ascending: true })
          .order('id', { ascending: true });

        if (sessionErr) throw sessionErr;

        // d) смержить: для каждого ученика найти его сессию, собрать StudentResult
        const sessionsByUser = new Map<string, any[]>();
        for (const s of sessionRows || []) {
          const arr = sessionsByUser.get(s.user_id) || [];
          arr.push(s);
          sessionsByUser.set(s.user_id, arr);
        }

        const merged: StudentResult[] = (memberRows || []).map((m: any) => {
          const sessions = sessionsByUser.get(m.student_id) || [];
          const completedSessions = sessions.filter((s: any) => s.status === 'completed');
          const best = completedSessions.reduce(
            (prev: any, curr: any) => (prev && prev.score >= curr.score ? prev : curr),
            null
          );
          return {
            student_id: m.student_id,
            first_name: m.profiles?.first_name || '',
            last_name: m.profiles?.last_name || '',
            email: m.profiles?.email || null,
            submitted_at: best ? best.created_at : null,
            score: best ? best.score : null,
            max_score: best ? best.max_score : null,
            time_spent_seconds: best ? best.time_spent_seconds : null,
            is_submitted: completedSessions.length > 0,
            attempts: completedSessions.length,
            best_session_id: best?.id ?? null,
          };
        });

        setResults(merged);
      } catch (e: any) {
        console.error('Error loading assignment details:', e);
        setError(e?.message || 'Ошибка загрузки результатов задания');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assignmentId, user?.id]);

  const totalStudents = results.length;
  const submittedCount = results.filter((r) => r.is_submitted).length;
  const notSubmittedCount = totalStudents - submittedCount;

  if (loading && !assignment) {
    return (
      <div className="space-y-5">
        <div className="animate-pulse h-8 w-40 rounded-xl bg-theme-border/30" />
        <div className="animate-pulse h-20 rounded-xl bg-theme-border/30" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="animate-pulse h-24 rounded-xl bg-theme-border/30" />
          <div className="animate-pulse h-24 rounded-xl bg-theme-border/30" />
          <div className="animate-pulse h-24 rounded-xl bg-theme-border/30" />
        </div>
        <div className="animate-pulse h-48 rounded-xl bg-theme-border/30" />
      </div>
    );
  }

  const handleExport = async () => {
    if (!results.length || !assignment) return;
    setExportLoading(true);
    try {
      let entries: AssignmentExportEntry[] = [];
      const code = assignment.set_config?.code;
      if (typeof code === 'string' && code.trim()) {
        try {
          const cfg = decodeSetShort(code);
          if (cfg) {
            const { entries: built } = buildSet(cfg);
            entries = built.map((e) => ({
              position: e.position,
              taskId: e.taskId,
              maxScore: getTaskById(e.taskId)?.maxPoints ?? 1,
            }));
          }
        } catch {
          entries = [];
        }
      }

      const bestIds = Array.from(
        new Set(
          results
            .map((r) => r.best_session_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        )
      );

      const answersBySession: Record<string, Record<string, AssignmentExportAnswerEntry>> = {};
      const CHUNK_SIZE = 200;
      for (let i = 0; i < bestIds.length; i += CHUNK_SIZE) {
        const chunkIds = bestIds.slice(i, i + CHUNK_SIZE);
        const rows = await fetchAllPages<{
          id: string;
          answers: Record<string, AssignmentExportAnswerEntry> | null;
        }>((from, to) =>
          (supabase as any)
            .from('sessions')
            .select('id, answers')
            .in('id', chunkIds)
            .order('id', { ascending: true })
            .range(from, to)
        );
        for (const row of rows) {
          if (row?.id) {
            answersBySession[row.id] = row.answers ?? {};
          }
        }
      }

      const sheets = buildAssignmentSheets({
        assignment,
        entries,
        results,
        answersBySession,
      });

      const safeTitle = (assignment.title || '').replace(/[\\/:*?"<>|]/g, '').trim();
      const fileName = `${safeTitle || 'задание'}_результаты.xlsx`;
      await exportStyledWorkbook(fileName, sheets);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('/teacher/assignments')}
          className="flex items-center space-x-1 text-sm text-theme-text-muted hover:text-theme-text cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Назад</span>
        </button>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-800 dark:text-red-200">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {assignment && (
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-theme-border">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg font-bold text-theme-text">{assignment.title}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                    assignment.is_active
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-theme-bg text-theme-text-muted border border-theme-border'
                  }`}
                >
                  {assignment.is_active ? 'Активно' : 'Неактивно'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-theme-text-muted">
                <span>Класс: <strong className="text-theme-text-sec">{assignment.class_name}</strong></span>
                <span>•</span>
                <span className="inline-flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDueDate(assignment.due_date)}</span>
                </span>
                <span>
                  {assignment.max_attempts ? `• Попыток: ${assignment.max_attempts}` : '• Попыток: не ограничено'}
                </span>
              </div>
              {setCode && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-theme-text-muted">Код набора:</span>
                  <span className="font-mono text-xs text-theme-text bg-theme-bg border border-theme-border rounded-lg px-2 py-0.5">
                    {setCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(setCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                    className="flex items-center space-x-1 text-xs text-theme-text-muted hover:text-theme-text transition-colors cursor-pointer"
                    title="Скопировать код"
                  >
                    {codeCopied
                      ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                      : <Copy className="w-3.5 h-3.5" />
                    }
                    <span>{codeCopied ? 'Скопировано!' : 'Скопировать'}</span>
                  </button>
                </div>
              )}
            </div>

            {results.length > 0 && (
              <button
                type="button"
                onClick={handleExport}
                disabled={exportLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exportLoading ? 'Экспорт...' : 'Экспорт в Excel'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {assignment && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-theme-border bg-theme-card flex items-center space-x-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-theme-text-muted">Всего учеников</p>
                <p className="text-xl font-bold text-theme-text">{totalStudents}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-theme-border bg-theme-card flex items-center space-x-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-theme-text-muted">Сдали</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {submittedCount}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-theme-border bg-theme-card flex items-center space-x-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-theme-text-muted">Не сдали</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {notSubmittedCount}
                </p>
              </div>
            </div>
          </div>

          {/* Student Results Table */}
          {results.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 rounded-2xl border border-theme-border bg-theme-card">
              <Users className="w-10 h-10 text-theme-text-muted stroke-1" />
              <p className="text-sm text-theme-text-sec">В классе пока нет учеников</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-theme-border bg-theme-card shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-theme-border text-theme-text-muted uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">ФИО</th>
                    <th className="py-3 px-4 font-bold">Статус</th>
                    <th className="py-3 px-4 font-bold">Балл</th>
                    <th className="py-3 px-4 font-bold">Попытки</th>
                    <th className="py-3 px-4 font-bold">Время</th>
                    <th className="py-3 px-4 font-bold">Дата сдачи</th>
                    <th className="py-3 px-4 font-bold">Ответы</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/60">
                  {results.map((result) => {
                    const firstName = result.first_name.trim();
                    const lastName = result.last_name.trim();
                    const fullName =
                      lastName && firstName
                        ? `${lastName} ${firstName}`
                        : firstName || lastName || result.email || 'Ученик';

                    return (
                      <tr
                        key={result.student_id}
                        onClick={() => {
                          if (assignment?.class_id) {
                            navigate(`/teacher/classes/${assignment.class_id}/students/${result.student_id}`);
                          }
                        }}
                        className="cursor-pointer hover:bg-theme-bg/60 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-theme-text">
                          {fullName}
                        </td>
                        <td className="py-3.5 px-4">
                          {result.is_submitted ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <span>✅ Сдал</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-theme-text-muted">
                              <span>⏳ Не сдал</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-theme-text">
                          {result.is_submitted && result.score !== null && result.max_score !== null ? (
                            <span className="inline-flex items-center space-x-1">
                              <Trophy className="w-3.5 h-3.5 text-amber-500" />
                              <span>{result.score}/{result.max_score}</span>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-theme-text-sec">
                          {result.attempts > 0
                            ? assignment.max_attempts
                              ? `${result.attempts} / ${assignment.max_attempts}`
                              : result.attempts
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-theme-text-sec">
                          {formatDuration(result.time_spent_seconds)}
                        </td>
                        <td className="py-3.5 px-4 text-theme-text-muted">
                          {formatDateTime(result.submitted_at)}
                        </td>
                        <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                          {result.best_session_id ? (
                            <button
                              onClick={() => openReviewBySessionId(result.best_session_id!, `${fullName} — ${assignment?.title || ''}`)}
                              disabled={reviewLoading}
                              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-400 transition-colors cursor-pointer disabled:opacity-50"
                              title="Посмотреть ответы"
                            >
                              <Eye size={14} />
                              <span>Ответы</span>
                            </button>
                          ) : (
                            <span className="text-theme-text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

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
            <div className="flex items-center justify-between p-5 border-b border-theme-border sticky top-0 bg-theme-bg z-10">
              <div>
                <h3 className="text-lg font-bold text-theme-text">Ответы ученика</h3>
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
            <div className="px-5 pt-4 pb-2">
              <p className="text-sm text-theme-text-sec">
                Верно: <span className="font-bold text-theme-text">{reviewSession.entries.filter(e => e.correct).length}</span> из <span className="font-bold text-theme-text">{reviewSession.entries.length}</span> · Баллы: <span className="font-bold text-theme-text">{reviewSession.entries.reduce((s, e) => s + e.score, 0)}</span> / <span className="font-bold text-theme-text">{reviewSession.entries.reduce((s, e) => s + e.maxScore, 0)}</span>
              </p>
            </div>
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
                      <td className="py-2.5 pr-3 font-mono text-theme-text-sec">{entry.expectedDisplay}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1">
                          {entry.correct
                            ? <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                            : <XCircle size={14} className="text-red-400 shrink-0" />
                          }
                          <span className="text-theme-text font-mono text-xs">{entry.score}/{entry.maxScore}</span>
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

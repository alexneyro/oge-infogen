import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, AlertCircle, Calendar, Clock, Lock, CheckCircle2, XCircle, X, Eye, Check } from 'lucide-react';
import { useAssignments, type Assignment } from '../../hooks/useAssignments';
import { useAuth } from '../../hooks/useAuth';
import { joinClassByCode } from '../../hooks/useJoinClass';
import { supabase } from '../../lib/supabase';
import { decodeSetShort, buildSet } from '../../set';
import { getAnswerKey } from '../../utils/answerKey';

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

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

interface SessionSummary {
  id: string;
  score: number | null;
  max_score: number | null;
  created_at: string;
  status: 'completed' | 'in_progress';
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

export const AssignmentsPage: React.FC = () => {
  const { assignments, loading, error, hasClasses, fetchAssignments } = useAssignments();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [expiredIds, setExpiredIds] = useState<Set<string>>(new Set());
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());
  const [attemptsMap, setAttemptsMap] = useState<Record<string, number>>({});
  const [sessionsMap, setSessionsMap] = useState<Record<string, SessionSummary[]>>({});
  const [reviewSession, setReviewSession] = useState<{ title: string; entries: ReviewEntry[] } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const joiningRef = useRef(false);
  const [joinNotice, setJoinNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('joinClassNotice');
    if (!raw) return;
    sessionStorage.removeItem('joinClassNotice');
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        (parsed.type === 'success' || parsed.type === 'error') &&
        typeof parsed.text === 'string' &&
        parsed.text
      ) {
        setJoinNotice({ type: parsed.type, text: parsed.text });
      }
    } catch {
      // ignore invalid JSON
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joiningRef.current) return;
    joiningRef.current = true;
    setJoining(true);
    setJoinNotice(null);
    try {
      const result = await joinClassByCode(inviteCode);
      setJoinNotice({
        type: result.ok ? 'success' : 'error',
        text: result.message,
      });
      if (result.ok) {
        setInviteCode('');
        await fetchAssignments();
      }
    } finally {
      joiningRef.current = false;
      setJoining(false);
    }
  };

  useEffect(() => {
    const loadAttempts = async () => {
      if (user?.id && assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id);
        if (assignmentIds.length > 0) {
          const { data: sessionRows } = await (supabase as any)
            .from('sessions')
            .select('id, assignment_id, score, max_score, created_at, status')
            .eq('user_id', user.id)
            .in('assignment_id', assignmentIds);
          const map: Record<string, number> = {};
          for (const s of sessionRows || []) {
            map[s.assignment_id] = (map[s.assignment_id] || 0) + 1;
          }
          setAttemptsMap(map);

          const sMap: Record<string, SessionSummary[]> = {};
          for (const s of sessionRows || []) {
            if (!sMap[s.assignment_id]) sMap[s.assignment_id] = [];
            sMap[s.assignment_id].push({
              id: s.id,
              score: s.score,
              max_score: s.max_score,
              created_at: s.created_at,
              status: s.status,
            });
          }
          // Сортировать каждый массив по дате убывания
          for (const key of Object.keys(sMap)) {
            sMap[key].sort((a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
          }
          setSessionsMap(sMap);
        }
      }
    };
    loadAttempts();
  }, [user?.id, assignments]);

  useEffect(() => {
    if (!assignments.length || !user?.id) return;

    const checkExpired = async () => {
      const now = new Date();
      const newExpired = new Set<string>();
      const newBlocked = new Set<string>();
      const newClosed = new Set<string>();
      const expiredClassworkIds: string[] = [];

      for (const a of assignments) {
        if (!a.is_active) {
          newClosed.add(a.id);
          newBlocked.add(a.id);
          continue;
        }

        if (!a.due_date) continue;
        if (now <= new Date(a.due_date)) continue;

        if ((a.assignment_type ?? 'homework') === 'classwork') {
          expiredClassworkIds.push(a.id);
        } else {
          newExpired.add(a.id);
          newBlocked.add(a.id);
        }
      }

      // Для классных проверить наличие in_progress сессии
      if (expiredClassworkIds.length > 0) {
        const { data: inProgRows } = await (supabase as any)
          .from('sessions')
          .select('assignment_id')
          .eq('user_id', user.id)
          .eq('status', 'in_progress')
          .in('assignment_id', expiredClassworkIds);

        const inProgSet = new Set(
          (inProgRows || []).map((r: any) => r.assignment_id)
        );

        for (const id of expiredClassworkIds) {
          if (!inProgSet.has(id)) {
            newExpired.add(id);
            newBlocked.add(id);
          }
        }
      }

      if (newClosed.size > 0) {
        setClosedIds(prev => new Set([...prev, ...newClosed]));
      }
      if (newExpired.size > 0) {
        setExpiredIds(prev => new Set([...prev, ...newExpired]));
      }
      if (newBlocked.size > 0) {
        setBlockedIds(prev => new Set([...prev, ...newBlocked]));
      }
    };

    checkExpired();
  }, [assignments, user?.id]);

  const [typeFilter, setTypeFilter] = useState<'all' | 'homework' | 'classwork'>('all');

  const activeAssignments = assignments;
  const filteredAssignments = activeAssignments.filter((a) =>
    typeFilter === 'all' ? true : (a.assignment_type || 'homework') === typeFilter
  );

  const isBlocked = (assignment: Assignment) => {
    if (blockedIds.has(assignment.id)) return true;
    if (assignment.max_attempts === null) return false;
    const used = attemptsMap[assignment.id] || 0;
    return used >= assignment.max_attempts;
  };

  const handleOpenCode = async (code: string, assignmentId: string) => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (assignment) {
      if (assignment.is_active === false) {
        setClosedIds(prev => new Set(prev).add(assignment.id));
        setBlockedIds(prev => new Set(prev).add(assignment.id));
        return;
      }
      if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
        const isClasswork = (assignment.assignment_type || 'homework') === 'classwork';
        if (isClasswork) {
          const { data: inProg } = await (supabase as any)
            .from('sessions')
            .select('id')
            .eq('assignment_id', assignment.id)
            .eq('user_id', user?.id)
            .eq('status', 'in_progress')
            .maybeSingle();

          if (!inProg) {
            setBlockedIds(prev => new Set(prev).add(assignment.id));
            setExpiredIds(prev => new Set(prev).add(assignment.id));
            return;
          }
        } else {
          setBlockedIds(prev => new Set(prev).add(assignment.id));
          setExpiredIds(prev => new Set(prev).add(assignment.id));
          return;
        }
      }

      const { data: sessionRows } = await (supabase as any)
        .from('sessions')
        .select('id')
        .eq('assignment_id', assignment.id)
        .eq('user_id', user?.id);
      const usedAttempts = sessionRows?.length || 0;
      if (assignment.max_attempts !== null && usedAttempts >= assignment.max_attempts) {
        setBlockedIds(prev => new Set(prev).add(assignment.id));
        return;
      }
    }
    const title = assignment?.title || 'Домашнее задание';
    const hideReview = assignment?.hide_review ?? false;
    const assignmentType = assignment?.assignment_type ?? 'homework';
    if (assignment?.class_id) {
      localStorage.setItem('pendingClassId', assignment.class_id);
    }
    localStorage.setItem('pendingSetCode', code);
    localStorage.setItem('pendingAssignmentId', assignmentId);
    localStorage.setItem('pendingAssignmentCode', code);
    localStorage.setItem('pendingAssignmentTitle', title);
    localStorage.setItem('pendingAssignmentHideReview', String(hideReview));
    localStorage.setItem('pendingAssignmentType', assignmentType);
    navigate('/');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openSetWithCode', { 
        detail: { code, title, assignmentId, hideReview, assignmentType } 
      }));
    }, 50);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2.5 pb-4 border-b border-theme-border">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <ClipboardList className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-theme-text">Мои задания</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {joinNotice && joinNotice.type === 'error' && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{joinNotice.text}</span>
        </div>
      )}

      {joinNotice && joinNotice.type === 'success' && (
        <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{joinNotice.text}</span>
        </div>
      )}

      {loading && activeAssignments.length === 0 && (
        <div className="space-y-3">
          <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
          <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
          <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
        </div>
      )}

      {!loading && activeAssignments.length === 0 && hasClasses === false && (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-theme-border bg-theme-card">
          <div className="w-12 h-12 rounded-2xl bg-theme-bg border border-theme-border flex items-center justify-center text-theme-text-muted">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-semibold text-theme-text">
            Вы пока не состоите ни в одном классе
          </h2>
          <p className="text-xs text-theme-text-muted max-w-sm">
            Введите код класса, который дал учитель, чтобы получать от него задания
          </p>
          <form onSubmit={handleJoinClass} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              maxLength={6}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="GCWB2F"
              disabled={joining}
              aria-label="Код класса"
              className="w-32 rounded-xl border border-theme-border bg-theme-bg px-3 py-2 text-sm text-center font-mono uppercase tracking-widest text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={joining}
              className="px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer"
            >
              Вступить
            </button>
          </form>
        </div>
      )}

      {!loading && activeAssignments.length === 0 && hasClasses !== false && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-theme-border bg-theme-card">
          <div className="w-12 h-12 rounded-2xl bg-theme-bg border border-theme-border flex items-center justify-center text-theme-text-muted">
            <ClipboardList className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-theme-text-muted">Активных заданий нет</p>
        </div>
      )}

      {activeAssignments.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {(['all', 'homework', 'classwork'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                typeFilter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-theme-bg border border-theme-border text-theme-text-sec hover:border-blue-500'
              }`}
            >
              {f === 'all' ? 'Все' : f === 'homework' ? 'Домашние' : 'Классные'}
            </button>
          ))}
        </div>
      )}

      {activeAssignments.length > 0 && (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => {
            const setCode = (assignment.set_config?.code as string | undefined)?.trim() || '';
            return (
              <div
                key={assignment.id}
                className="p-4 rounded-xl border border-theme-border bg-theme-card hover:border-theme-border/80 transition-colors flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-theme-text truncate">
                      {assignment.title}
                    </h3>
                    {assignment.class_name && (
                      <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shrink-0">
                        {assignment.class_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-theme-text-muted flex-wrap">
                    {closedIds.has(assignment.id) ? (
                      <span className="text-rose-500 dark:text-rose-400 font-medium">
                        Закрыто преподавателем
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className={
                          expiredIds.has(assignment.id)
                            ? 'text-rose-500 dark:text-rose-400 font-medium'
                            : ''
                        }>
                          {formatDueDate(assignment.due_date)}
                          {expiredIds.has(assignment.id) && ' · истёк'}
                        </span>
                      </span>
                    )}
                    {assignment.created_at && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Создано: {formatCreatedAt(assignment.created_at)}</span>
                      </span>
                    )}
                  </div>
                  {assignment.max_attempts !== null && (
                    <span className="text-sm text-theme-text-sec">
                      Попыток: {attemptsMap[assignment.id] || 0} из {assignment.max_attempts}
                    </span>
                  )}
                  {(() => {
                    const sessions = sessionsMap[assignment.id] || [];
                    if (!sessions.length) return null;
                    const completed = sessions.filter(s => s.status === 'completed');
                    const inProg = sessions.find(s => s.status === 'in_progress');
                    return (
                      <div className="mt-1.5 space-y-0.5">
                        {completed.length > 0 && (
                          <div className="text-xs text-theme-text-muted">
                            Завершённых попыток: <span className="font-semibold text-theme-text">{completed.length}</span>
                            {completed[0].score !== null && completed[0].max_score !== null && (
                              <span className="ml-1.5 text-theme-text-sec">
                                · Лучший балл:{' '}
                                <span className="font-semibold text-theme-text">
                                  {Math.max(...completed.map(s => s.score ?? 0))}/{completed[0].max_score}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                        {inProg && (
                          <div className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
                            <span>⚠️ Есть незавершённая попытка</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {assignment.hide_review && (
                    <span className="inline-flex items-center gap-1 text-xs text-theme-text-muted">
                      <Lock className="w-3 h-3" />
                      Разбор скрыт
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {(() => {
                    const sessions = sessionsMap[assignment.id] || [];
                    const best = sessions
                      .filter(s => s.status === 'completed')
                      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
                    if (!best) return null;
                    return (
                      <button
                        type="button"
                        onClick={() => openReviewBySessionId(best.id, assignment.title)}
                        disabled={reviewLoading}
                        className="px-3.5 py-2 rounded-xl bg-theme-bg border border-theme-border text-theme-text-sec hover:text-theme-text hover:border-theme-border/80 text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <Eye size={13} />
                        Результат
                      </button>
                    );
                  })()}

                  {closedIds.has(assignment.id) ? (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-2 rounded-xl bg-theme-bg border border-theme-border text-theme-text-muted text-xs font-semibold opacity-50 cursor-not-allowed shrink-0"
                    >
                      Закрыто
                    </button>
                  ) : expiredIds.has(assignment.id) ? (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-2 rounded-xl bg-theme-bg border border-theme-border text-rose-600 dark:text-rose-400 text-xs font-semibold opacity-60 cursor-not-allowed shrink-0"
                    >
                      Срок истёк
                    </button>
                  ) : isBlocked(assignment) ? (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-2 rounded-xl bg-theme-bg border border-theme-border text-theme-text-muted text-xs font-semibold opacity-50 cursor-not-allowed shrink-0"
                    >
                      Исчерпаны
                    </button>
                  ) : setCode ? (
                    <button
                      type="button"
                      onClick={() => handleOpenCode(assignment.set_config?.code as string, assignment.id)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      Открыть
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Нет кода набора"
                      className="px-3.5 py-2 rounded-xl bg-theme-bg border border-theme-border text-theme-text-muted text-xs font-semibold opacity-50 cursor-not-allowed shrink-0"
                    >
                      Открыть
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Copy, ChevronDown, Zap, FileText, Layers, ClipboardList, EyeOff, Eye, Users, CheckCircle2, XCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { decodeSetShort, buildSet } from '../../set';
import { getAnswerKey } from '../../utils/answerKey';

interface StudentProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  generated_login: string | null;
  generated_password: string | null;
  joined_at: string;
}

interface StudentAssignment {
  id: string;
  title: string;
  is_active: boolean;
  due_date: string | null;
  max_attempts: number | null;
  created_at: string;
  score: number | null;
  max_score: number | null;
  attempts: number;
  is_submitted: boolean;
  in_progress?: boolean;
  progress_score?: number | null;
  progress_max_score?: number | null;
  best_session_id: string | null;
  in_progress_session_id?: string | null;
  assignment_type?: 'homework' | 'classwork';
}

interface TaskStat {
  taskId: number;
  total: number;
  correct: number;
  totalScore: number;
  totalMaxScore: number;
}

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
  assignment_type?: 'homework' | 'classwork' | null;
  variant_seed?: string | null;
  answers?: Record<string, unknown> | null;
}

interface ReviewEntry {
  position: number;
  taskId: number;
  userAnswer: string;
  correct: boolean;
  score: number;
  maxScore: number;
  expectedDisplay: string;
  taskData: any;
}

export const StudentProfilePage: React.FC = () => {
  const { classId, studentId } = useParams<{ classId: string; studentId: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [activeTab, setActiveTab] = useState<'assignments' | 'stats' | 'history'>('assignments');
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<'all' | 'homework' | 'classwork'>('all');
  const [statsFilter, setStatsFilter] = useState<'all' | 'self' | 'hw'>('all');
  const [rawSessions, setRawSessions] = useState<Array<{ answers: Record<string, unknown>; assignment_id: string | null }>>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [hideTrainer, setHideTrainer] = useState(false);
  const [reviewSession, setReviewSession] = useState<{
    title: string;
    entries: ReviewEntry[];
  } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) =>
      assignmentTypeFilter === 'all' ? true : (a.assignment_type || 'homework') === assignmentTypeFilter
    );
  }, [assignments, assignmentTypeFilter]);

  const taskStats = useMemo(() => {
    const filtered = rawSessions.filter(s => {
      if (statsFilter === 'self') return !s.assignment_id;
      if (statsFilter === 'hw') return !!s.assignment_id;
      return true;
    });
    const map = new Map<number, TaskStat>();
    for (const session of filtered) {
      for (const entry of Object.values(session.answers)) {
        if (typeof entry !== 'object' || entry === null || !('taskId' in entry)) continue;
        const e = entry as { taskId: number; correct: boolean; score: number; maxScore: number };
        const existing = map.get(e.taskId) ?? { taskId: e.taskId, total: 0, correct: 0, totalScore: 0, totalMaxScore: 0 };
        existing.total += 1;
        existing.correct += e.correct ? 1 : 0;
        existing.totalScore += e.score;
        existing.totalMaxScore += e.maxScore;
        map.set(e.taskId, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.taskId - b.taskId);
  }, [rawSessions, statsFilter]);

  useEffect(() => {
    if (!classId || !studentId) return;

    const fetchStudent = async () => {
      setLoading(true);
      try {
        const { data } = await (supabase as any)
          .from('class_members')
          .select('joined_at, profiles(id, first_name, last_name, email, generated_login, generated_password)')
          .eq('class_id', classId)
          .eq('student_id', studentId)
          .single();

        if (data && data.profiles) {
          setStudent({
            id: data.profiles.id,
            first_name: data.profiles.first_name || '',
            last_name: data.profiles.last_name || '',
            email: data.profiles.email || null,
            generated_login: data.profiles.generated_login || null,
            generated_password: data.profiles.generated_password || null,
            joined_at: data.joined_at,
          });
        }

        setAssignmentsLoading(true);
        try {
          // a) получить все ДЗ класса
          const { data: assignmentRows } = await (supabase as any)
            .from('assignments')
            .select('id, title, is_active, due_date, max_attempts, created_at, assignment_type')
            .eq('class_id', classId)
            .order('created_at', { ascending: false });

          // b) получить все сессии ученика по этим ДЗ
          const assignmentIds = (assignmentRows || []).map((a: any) => a.id);
          let sessionRows: any[] = [];
          if (assignmentIds.length > 0) {
            const { data: sData } = await (supabase as any)
              .from('sessions')
              .select('id, assignment_id, score, max_score, created_at, status')
              .eq('user_id', studentId)
              .in('assignment_id', assignmentIds);
            sessionRows = sData || [];
          }

          // c) смержить
          const sessionsByAssignment = new Map<string, any[]>();
          for (const s of sessionRows) {
            const arr = sessionsByAssignment.get(s.assignment_id) || [];
            arr.push(s);
            sessionsByAssignment.set(s.assignment_id, arr);
          }

          const merged: StudentAssignment[] = (assignmentRows || []).map((a: any) => {
            const sessions = sessionsByAssignment.get(a.id) || [];
            const completedSessions = sessions.filter((s: any) => s.status === 'completed');
            const inProgressSession = sessions.find((s: any) => s.status === 'in_progress');
            const best = completedSessions.reduce(
              (prev: any, curr: any) => (prev && prev.score >= curr.score ? prev : curr),
              null
            );
            return {
              id: a.id,
              title: a.title,
              is_active: a.is_active,
              due_date: a.due_date,
              max_attempts: a.max_attempts ?? null,
              created_at: a.created_at,
              is_submitted: completedSessions.length > 0,
              in_progress: !completedSessions.length && !!inProgressSession,
              score: best ? best.score : null,
              max_score: best ? best.max_score : null,
              progress_score: inProgressSession?.score ?? null,
              progress_max_score: inProgressSession?.max_score ?? null,
              attempts: completedSessions.length,
              best_session_id: best ? (best.id ?? null) : null,
              in_progress_session_id: inProgressSession ? (inProgressSession.id ?? null) : null,
              assignment_type: a.assignment_type ?? 'homework',
            };
          });

          setAssignments(merged);
        } finally {
          setAssignmentsLoading(false);
        }

        setStatsLoading(true);
        try {
          const { data: sessionRows } = await (supabase as any)
            .from('sessions')
            .select('answers, mode, assignment_id')
            .eq('user_id', studentId);

          setRawSessions(sessionRows || []);
        } finally {
          setStatsLoading(false);
        }

        setSessionsLoading(true);
        try {
          const { data: historyRows } = await (supabase as any)
            .from('sessions')
            .select('id, mode, score, max_score, time_spent_seconds, created_at, assignment_id, task_type, answers, variant_seed, assignments(title, assignment_type)')
            .eq('user_id', studentId)
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
            assignment_type: (row as any).assignments?.assignment_type ?? 'homework',
            variant_seed: row.variant_seed ?? null,
            answers: row.answers ?? null,
          }));
          setSessions(mappedSessions);
        } finally {
          setSessionsLoading(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [classId, studentId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="animate-pulse h-6 w-32 rounded-xl bg-theme-border/30" />
        <div className="animate-pulse h-24 rounded-xl bg-theme-border/30" />
        <div className="animate-pulse h-32 rounded-xl bg-theme-border/30" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <button
          type="button"
          onClick={() => navigate(`/teacher/classes/${classId}`)}
          className="flex items-center space-x-1 text-sm text-theme-text-muted hover:text-theme-text cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к классу</span>
        </button>
        <div className="p-8 text-center rounded-2xl border border-theme-border bg-theme-card">
          <p className="text-sm text-theme-text-sec">Ученик не найден</p>
        </div>
      </div>
    );
  }

  const fullName =
    student.last_name && student.first_name
      ? `${student.last_name} ${student.first_name}`
      : student.first_name || student.last_name || student.email || 'Ученик';

  const joinedDate = new Date(student.joined_at).toLocaleDateString('ru-RU');

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate(`/teacher/classes/${classId}`)}
          className="flex items-center space-x-1 text-sm text-theme-text-muted hover:text-theme-text cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к классу</span>
        </button>

        <div className="p-4 rounded-xl border border-theme-border bg-theme-card space-y-1">
          <h1 className="text-lg font-bold text-theme-text">{fullName}</h1>
          {student.email && (
            <p className="text-xs text-theme-text-muted">{student.email}</p>
          )}
          <p className="text-xs text-theme-text-sec">
            В классе с {joinedDate}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-theme-border bg-theme-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCredentials(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-theme-text">
            <KeyRound size={16} className="text-amber-400" />
            Данные для входа
          </div>
          <ChevronDown
            size={16}
            className={`text-theme-text-sec transition-transform ${showCredentials ? 'rotate-180' : ''}`}
          />
        </button>
        {showCredentials && student.generated_login && (
          <div className="px-4 pb-4 font-mono text-sm border-t border-theme-border pt-3">
            <div className="flex justify-between items-center">
              <div>
                <div>Логин: <span className="font-bold text-theme-text">{student.generated_login}</span></div>
                <div>Пароль: <span className="font-bold text-theme-text">{student.generated_password}</span></div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Логин: ${student.generated_login}\nПароль: ${student.generated_password}`
                  );
                }}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <Copy size={14} /> Скопировать
              </button>
            </div>
          </div>
        )}
        {showCredentials && !student.generated_login && (
          <div className="px-4 pb-4 text-sm text-theme-text-sec border-t border-theme-border pt-3">
            {student.email}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-6 mb-4 border-b border-theme-border">
        {[
          { key: 'assignments', label: 'Задания' },
          { key: 'stats', label: 'Статистика' },
          { key: 'history', label: 'История' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px cursor-pointer ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-theme-text-sec hover:text-theme-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'assignments' && (
        assignmentsLoading ? (
          <div className="space-y-3">
            <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
            <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-theme-border bg-theme-card">
            <p className="text-sm text-theme-text-sec">Заданий для этого класса пока нет</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {(['all', 'homework', 'classwork'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAssignmentTypeFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    assignmentTypeFilter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-theme-bg border border-theme-border text-theme-text-sec hover:border-blue-500'
                  }`}
                >
                  {f === 'all' ? 'Все' : f === 'homework' ? 'ДЗ' : 'Классные'}
                </button>
              ))}
            </div>

            {filteredAssignments.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-theme-border bg-theme-card">
                <p className="text-sm text-theme-text-sec">Нет заданий выбранного типа</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-theme-border bg-theme-card shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-theme-border text-theme-text-muted uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4 font-bold">Название</th>
                      <th className="py-3 px-4 font-bold">Статус</th>
                      <th className="py-3 px-4 font-bold">Балл</th>
                      <th className="py-3 px-4 font-bold">Попытки</th>
                      <th className="py-3 px-4 font-bold">Срок</th>
                      <th className="py-3 px-4 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/60">
                    {filteredAssignments.map((a) => {
                      const dueStr = a.due_date
                        ? `до ${new Date(a.due_date).toLocaleDateString('ru-RU')}`
                        : 'Без срока';

                      return (
                        <tr key={a.id} className="hover:bg-theme-bg/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-theme-text">
                            <div className="flex items-center gap-2">
                              <span>{a.title}</span>
                              {!a.is_active && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-theme-bg text-theme-text-muted border border-theme-border">
                                  Неактивно
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {a.is_submitted ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                ✅ Сдано
                              </span>
                            ) : a.in_progress ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                ⚠️ Не завершил
                              </span>
                            ) : (
                              <span className="text-theme-text-muted">— Не открывал</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-theme-text">
                            {a.is_submitted && a.score !== null && a.max_score !== null ? (
                              `${a.score}/${a.max_score}`
                            ) : a.in_progress && a.progress_score !== null && a.progress_max_score !== null ? (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                {a.progress_score}/{a.progress_max_score} ⚠️
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-theme-text-sec">
                            {a.attempts > 0
                              ? a.max_attempts
                                ? `${a.attempts} / ${a.max_attempts}`
                                : a.attempts
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-theme-text-muted">{dueStr}</td>
                          <td className="py-3.5 px-2">
                            {(a.is_submitted && a.best_session_id) ? (
                              <button
                                onClick={() => openReviewBySessionId(a.best_session_id!, a.title)}
                                disabled={reviewLoading}
                                className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
                                title="Посмотреть ответы"
                              >
                                <Eye size={14} />
                                <span>Ответы</span>
                              </button>
                            ) : (a.in_progress && a.in_progress_session_id) ? (
                              <button
                                onClick={() => openReviewBySessionId(a.in_progress_session_id!, a.title)}
                                disabled={reviewLoading}
                                className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-700 disabled:opacity-40 transition-colors cursor-pointer"
                                title="Посмотреть незавершённые ответы"
                              >
                                <Eye size={14} />
                                <span className="text-amber-500">Ответы</span>
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      )}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-theme-text">Статистика по заданиям</h2>
            <div className="flex items-center gap-1 rounded-xl border border-theme-border bg-theme-card p-1">
              {(
                [
                  { key: 'all', label: 'Все' },
                  { key: 'self', label: 'Самостоятельные' },
                  { key: 'hw', label: 'По ДЗ' },
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
          {statsLoading ? (
            <div className="space-y-3">
              <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
              <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
              <div className="animate-pulse h-12 rounded-xl bg-theme-border/30" />
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
      )}
      {activeTab === 'history' && (
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
                            ? s.assignment_type === 'classwork'
                              ? 'Классная'
                              : s.assignment_type === 'homework'
                                ? 'ДЗ'
                                : 'Набор'
                            : s.mode;

                    const ModeIcon =
                      s.mode === 'single'
                        ? Zap
                        : s.mode === 'variant'
                          ? FileText
                          : s.mode === 'set'
                            ? s.assignment_type === 'classwork'
                              ? Users
                              : s.assignment_type === 'homework'
                                ? ClipboardList
                                : Layers
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
                          {s.assignment_title || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

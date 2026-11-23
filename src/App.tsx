import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Check, 
  X, 
  Compass, 
  Layers, 
  Menu, 
  ArrowRight, 
  RotateCcw, 
  Lightbulb, 
  GraduationCap, 
  Sliders, 
  AlertCircle,
  Key,
  Copy,
  Shuffle,
  Bug,
  FileText,
  Monitor
} from 'lucide-react';
import { OGE_TASKS, getTaskById } from './tasks';
import { Difficulty, TaskInstance, DIFFICULTY_LABELS, AppMode, MODE_LABELS } from './types';
import { LEVEL_STYLES, RANDOM_LEVEL_STYLE } from './levelStyles';
import { makeRng, hashSeed } from './utils/rng';
import { VariantView, VariantInfo } from './components/VariantView';
import { SetBuilderView, SetInfo } from './components/SetBuilderView';
import { ThemeToggle } from './components/ThemeToggle';
import { AuthStub } from './components/AuthStub';
import { AuthModal } from './components/AuthModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { TaskBadge } from './components/TaskBadge';
import { parseUserAnswer16 } from './tasks/task16';
import { buildBugReportText } from './utils/bugReport';
import { track } from './utils/analytics';
import { saveSession, startSession, completeSession, updateSessionAnswers } from './lib/sessions';
import { sendNotificationToTeacher } from './lib/notifications';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';
import { usePendingInvite } from './hooks/usePendingInvite';
import { useAssignments } from './hooks/useAssignments';
import { useClasses } from './hooks/useClasses';
import { AssignmentCreateModal } from './components/AssignmentCreateModal';
import { CabinetLayout } from './layouts/CabinetLayout';
import { TeacherProfilePage } from './pages/teacher/ProfilePage';
import { ClassesPage } from './pages/teacher/ClassesPage';
import { ClassDetailPage } from './pages/teacher/ClassDetailPage';
import { StudentProfilePage } from './pages/teacher/StudentProfilePage';
import { AssignmentsPage as TeacherAssignmentsPage } from './pages/teacher/AssignmentsPage';
import { AssignmentDetailPage } from './pages/teacher/AssignmentDetailPage';
import { TeacherStatsPage } from './pages/teacher/StatsPage';
import { TeacherHistoryPage } from './pages/teacher/HistoryPage';
import { AssignmentsPage as StudentAssignmentsPage } from './pages/student/AssignmentsPage';
import { StatsPage } from './pages/student/StatsPage';
import { HistoryPage } from './pages/student/HistoryPage';
import { ProfilePage } from './pages/student/ProfilePage';

export default function App() {
  const { user, profile, loading: authLoading, passwordRecovery, clearPasswordRecovery } = useAuth();
  usePendingInvite({
    userId: user?.id ?? null,
    role: profile?.role ?? null,
    authLoading,
    profileReady: Boolean(profile),
  });
  const { createAssignment, fetchAssignments } = useAssignments();
  const { classes } = useClasses();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{ title: string; seed: string; setConfig: Record<string, unknown> } | null>(null);
  const [pendingAssignmentId, setPendingAssignmentId] = useState<string | null>(null);
  const [pendingClassId, setPendingClassId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [assignmentMeta, setAssignmentMeta] = useState<{ code: string; title: string; hideReview: boolean; assignmentType?: 'homework' | 'classwork' } | null>(null);
  const userRef = useRef(user);
  userRef.current = user;
  const prevUserIdRef = useRef<string | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerSaveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAnswersRef = useRef<Record<string, string>>({});
  const lastElapsedRef = useRef<number>(0);
  const activeSessionIdRef = useRef<string | null>(null);
  const [initialSetAnswers, setInitialSetAnswers] = useState<Record<number, string> | null>(null);
  const [initialSetElapsed, setInitialSetElapsed] = useState<number>(0);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    if (!activeSessionId) {
      if (timerSaveInterval.current) {
        clearInterval(timerSaveInterval.current);
        timerSaveInterval.current = null;
      }
      return;
    }
    timerSaveInterval.current = setInterval(() => {
      if (activeSessionIdRef.current && lastElapsedRef.current > 0) {
        updateSessionAnswers(
          activeSessionIdRef.current,
          lastAnswersRef.current,
          lastElapsedRef.current,
        ).catch((err) => console.error('[timerSave] error:', err));
      }
    }, 30000);
    return () => {
      if (timerSaveInterval.current) {
        clearInterval(timerSaveInterval.current);
        timerSaveInterval.current = null;
      }
    };
  }, [activeSessionId]);
  // Mode state: 'single' (Task Trainer) vs 'variant' (Variant Mode) vs 'set' (Set Builder)
  const [activeMode, setActiveMode] = useState<AppMode>('single');

  useEffect(() => {
    const currentId = user?.id ?? null;
    const prevId = prevUserIdRef.current;
    const isRealLogout = !!prevId && !currentId;
    if (prevId && prevId !== currentId) {
      sessionStorage.removeItem('oge-checker-state-v1');
    }
    prevUserIdRef.current = currentId;

    if (isRealLogout) {
      // Сбрасываем состояние ДЗ
      setAssignmentMeta(null);
      setPendingAssignmentId(null);
      setActiveSessionId(null);
      setInitialSetAnswers(null);
      setInitialSetElapsed(0);
      lastElapsedRef.current = 0;
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
      // Сбрасываем режим
      setActiveMode('single');
      // Сбрасываем состояние тренажера
      setSelectedTaskId(null);
      setTaskInstance(null);
      setUserAnswer('');
      setIsSubmitted(false);
      setShowHints(false);
      setCurrentSeed(null);
      // Очищаем URL-параметры тренажера
      window.history.replaceState({}, '', window.location.pathname);
      // Очищаем sessionStorage (прогресс варианта и набора)
      sessionStorage.removeItem('oge:variant:v1');
      sessionStorage.removeItem('oge:set:v2');
      // Очищаем все pending-ключи из localStorage
      localStorage.removeItem('pendingAssignmentCode');
      localStorage.removeItem('pendingAssignmentTitle');
      localStorage.removeItem('pendingAssignmentHideReview');
      localStorage.removeItem('pendingAssignmentId');
      localStorage.removeItem('pendingAssignmentType');
      localStorage.removeItem('pendingSetCode');
      localStorage.removeItem('pendingInviteCode');
      localStorage.removeItem('pendingClassId');
    } else if (user) {
      // При входе в аккаунт ученика — выходим из режима набора
      if (profile?.role === 'student' && activeMode === 'set' && !assignmentMeta) {
        setActiveMode('single');
      }
    }
  }, [user, profile?.role]);
  const scrollPositions = useRef<Record<AppMode, number>>(
    { single: 0, variant: 0, set: 0 }
  );

  const handleModeChange = (next: AppMode) => {
    if (next === activeMode) return;                       // повторный клик по своей вкладке ничего не делает
    scrollPositions.current[activeMode] = window.scrollY;   // сохранили позицию уходящего режима
    setIsMobileMenuOpen(false);
    setActiveMode(next);
  };

  useLayoutEffect(() => {
    let rafId2: number | null = null;
    const restoreScroll = () => {
      const target = scrollPositions.current[activeMode];
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.max(0, Math.min(target, maxScroll)), behavior: 'auto' });
    };

    const rafId1 = requestAnimationFrame(() => {
      restoreScroll();
      rafId2 = requestAnimationFrame(() => {
        restoreScroll();
      });
    });

    return () => {
      cancelAnimationFrame(rafId1);
      if (rafId2 !== null) {
        cancelAnimationFrame(rafId2);
      }
    };
  }, [activeMode]);

  // Variant mode summary info for bug report
  const [variantInfo, setVariantInfo] = useState<VariantInfo | null>(null);
  // Set mode summary info for bug report
  const [setInfo, setSetInfo] = useState<SetInfo | null>(null);

  // State for active difficulty (1 - typovoy, 2 - sredniy, 3 - povyshenniy)
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  
  // Selected task id on the sidebar (1 to 16)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  // Current active generated task instance
  const [taskInstance, setTaskInstance] = useState<TaskInstance | null>(null);
  const taskCardRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const aside = asideRef.current;
    const main = mainRef.current;
    if (!aside || !main) return;

    if (activeMode !== 'single') {
      aside.style.maxHeight = '';
      return;
    }

    const STICKY_TOP = 105;
    const BOTTOM_GAP = 20;
    const MIN_H = 240;
    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      if (activeMode !== 'single' || window.innerWidth < 1024) {
        aside.style.maxHeight = '';
        return;
      }
      const top = Math.max(aside.getBoundingClientRect().top, STICKY_TOP);
      const avail = Math.min(
        window.innerHeight - STICKY_TOP - BOTTOM_GAP,
        main.getBoundingClientRect().bottom - top
      );
      aside.style.maxHeight = Math.max(MIN_H, avail) + 'px';
    };

    const scheduleUpdate = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(update);
    };

    update();

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    const ro = new ResizeObserver(scheduleUpdate);
    ro.observe(main);

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      ro.disconnect();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
  }, [activeMode]);
  
  // Inputs for task answers
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showHints, setShowHints] = useState<boolean>(false);

  const currentIsCorrect = isSubmitted && taskInstance
    ? (getTaskById(taskInstance.taskId)?.check(taskInstance.taskData, userAnswer) ?? false)
    : undefined;

  // Ref for tracking the last counted stats verdict for current task instance
  const lastCountedRef = useRef<{ id: string; correct: boolean } | null>(null);

  // Seed management for single task training
  const [currentSeed, setCurrentSeed] = useState<string | null>(null);
  const [customSeed, setCustomSeed] = useState<string>('');
  const [showCustomSeed, setShowCustomSeed] = useState<boolean>(false);
  const [seedCopied, setSeedCopied] = useState<boolean>(false);
  const [reportOpen, setReportOpen] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>('');
  const [reportTaskId, setReportTaskId] = useState<string>('all');
  const [reportCopiedOnce, setReportCopiedOnce] = useState<boolean>(false);
  const [clipboardFailed, setClipboardFailed] = useState<boolean>(false);

  // Score statistics for the current browser session
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  // Update statistics when submission status or correctness verdict changes
  useEffect(() => {
    if (!isSubmitted || currentIsCorrect === undefined || !taskInstance) return;

    const taskId = taskInstance.id;
    const isCorrectBool = currentIsCorrect;

    if (!lastCountedRef.current || lastCountedRef.current.id !== taskId) {
      lastCountedRef.current = { id: taskId, correct: isCorrectBool };
      setStats((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (isCorrectBool ? 1 : 0),
      }));
    } else if (lastCountedRef.current.correct !== isCorrectBool) {
      lastCountedRef.current = { id: taskId, correct: isCorrectBool };
      const delta = isCorrectBool ? 1 : -1;
      setStats((prev) => ({
        ...prev,
        correct: prev.correct + delta,
      }));
    }
  }, [isSubmitted, currentIsCorrect, taskInstance?.id]);

  // Mobile sidebar menu drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Method to handle generating a task
  const handleGenerate = (
    forceRandom: boolean = false,
    explicitSeed?: string,
    options?: { taskId?: number; difficulty?: Difficulty }
  ) => {
    const targetTaskId = options?.taskId ?? selectedTaskId;
    if (targetTaskId === null) return;
    
    const taskModule = getTaskById(targetTaskId);
    if (!taskModule) return;

    // Reset task state
    setUserAnswer('');
    setIsSubmitted(false);
    setShowHints(false);
    lastCountedRef.current = null;

    setTimeout(() => {
      const el = taskCardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const OFFSET = 115;
      const THRESHOLD = 120;
      // скроллить только если верх карточки выше навбара
      if (rect.top < OFFSET - THRESHOLD) {
        const targetY = window.scrollY + rect.top - OFFSET;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
    }, 50);

    const activeDiff = options?.difficulty ?? difficulty;

    let seedStr: string;

    if (explicitSeed !== undefined && explicitSeed.trim() !== '') {
      seedStr = explicitSeed.trim();
    } else if (forceRandom) {
      const rawRandom = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
      seedStr = rawRandom.toString();
      setCustomSeed('');
    } else if (customSeed.trim() !== '') {
      seedStr = customSeed.trim();
    } else if (currentSeed !== null && currentSeed !== '') {
      seedStr = currentSeed;
    } else {
      const rawRandom = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
      seedStr = rawRandom.toString();
    }

    // Single source of seed number for deterministic RNG
    const seedNum = hashSeed(`${seedStr}-L${activeDiff}`);
    const rng = makeRng(seedNum);

    const taskData = taskModule.generate(activeDiff, rng);
    if (taskData) {
      (taskData as any).seed = seedStr;
    }

    setCurrentSeed(seedStr);
    setTaskInstance({
      id: `${targetTaskId}-${seedStr}-${activeDiff}`,
      taskId: targetTaskId,
      difficulty: activeDiff,
      taskData
    });

    track('trainer_task_generated', { number: targetTaskId, level: activeDiff });

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('task', targetTaskId.toString());
      url.searchParams.set('seed', seedStr);
      url.searchParams.set('level', activeDiff.toString());
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleRandomTask = () => {
    const candidateTasks = OGE_TASKS.length > 1 && selectedTaskId !== null
      ? OGE_TASKS.filter((t) => t.id !== selectedTaskId)
      : OGE_TASKS;
    const randomTask = candidateTasks[Math.floor(Math.random() * candidateTasks.length)];
    const difficulties: Difficulty[] = [1, 2, 3];
    const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
    setSelectedTaskId(randomTask.id);
    setDifficulty(randomDiff);
    handleGenerate(false, undefined, { taskId: randomTask.id, difficulty: randomDiff });
  };

  // Mount effect to handle URL query parameters (?seed=...&task=...&level=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlSeed = params.get('seed');
    const urlTask = params.get('task');
    const urlDiff = params.get('diff') || params.get('level');

    const targetTaskId = urlTask ? parseInt(urlTask, 10) : (urlSeed ? 13 : null);
    const parsedDiff = urlDiff ? parseInt(urlDiff, 10) : NaN;
    const targetDiff: Difficulty = (parsedDiff === 1 || parsedDiff === 2 || parsedDiff === 3) ? (parsedDiff as Difficulty) : 1;

    if (targetTaskId !== null && !isNaN(targetTaskId)) {
      setSelectedTaskId(targetTaskId);
      setDifficulty(targetDiff);
      if (urlSeed && urlSeed.trim() !== '') {
        const cleanSeed = urlSeed.trim();
        setCustomSeed(cleanSeed);
        setShowCustomSeed(true);
        handleGenerate(false, cleanSeed, { taskId: targetTaskId, difficulty: targetDiff });
      }
    }
  }, []);

  useEffect(() => {
    const invite = new URLSearchParams(window.location.search).get('invite');
    if (invite !== null && invite.length === 6) {
      localStorage.setItem('pendingInviteCode', invite.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const pendingCode = localStorage.getItem('pendingAssignmentCode');
    const pendingTitle = localStorage.getItem('pendingAssignmentTitle') || '';
    const pendingHideReview = localStorage.getItem('pendingAssignmentHideReview') === 'true';
    if (pendingCode) {
      setAssignmentMeta({ code: pendingCode, title: pendingTitle, hideReview: pendingHideReview });
    }
  }, []);

  useEffect(() => {
    const handleOpenSetWithCode = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const code = detail?.code 
        || localStorage.getItem('pendingAssignmentCode') 
        || localStorage.getItem('pendingSetCode');
      // detail имеет приоритет над localStorage
      const title = detail?.title 
        || localStorage.getItem('pendingAssignmentTitle') 
        || '';
      if (code) {
        const assignmentCode = detail?.code 
          || localStorage.getItem('pendingAssignmentCode') 
          || code;
        // ИСПРАВЛЕНИЕ: detail?.title первым, localStorage вторым
        const assignmentTitle = detail?.title 
          || localStorage.getItem('pendingAssignmentTitle') 
          || title;
        const assignmentHideReviewVal = detail?.hideReview ?? (localStorage.getItem('pendingAssignmentHideReview') === 'true');
        const assignmentType = (detail?.assignmentType 
          || localStorage.getItem('pendingAssignmentType') 
          || 'homework') as 'homework' | 'classwork';
        if (assignmentCode) {
          console.log('[assignmentMeta] setting:', { 
            detailTitle: (e as CustomEvent).detail?.title,
            localTitle: localStorage.getItem('pendingAssignmentTitle'),
            assignmentTitle,
            assignmentType,
          });
          setAssignmentMeta({ code: assignmentCode, title: assignmentTitle, hideReview: assignmentHideReviewVal, assignmentType });
        }
        setActiveMode('set');

        const dispatchLoad = () => {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('loadSetCode', { detail: { code } }));
          }, 100);
        };

        const assignmentId = detail?.assignmentId 
          || localStorage.getItem('pendingAssignmentId');
        const classId = detail?.classId || localStorage.getItem('pendingClassId');
        if (classId) {
          setPendingClassId(classId);
        }
        const currentUser = userRef.current;

        if (assignmentId) {
          setPendingAssignmentId(assignmentId);

          // Загрузить существующую in_progress сессию с ответами
          if (currentUser) {
            (supabase as any)
              .from('sessions')
              .select('id, answers, time_spent_seconds')
              .eq('user_id', currentUser.id)
              .eq('assignment_id', assignmentId)
              .eq('status', 'in_progress')
              .maybeSingle()
              .then(({ data }: { data: any }) => {
                if (data?.id) {
                  setActiveSessionId(data.id);
                  if (data?.answers && Object.keys(data.answers).length > 0) {
                    // answers в БД хранятся в формате onFinish (с объектом {answer, score...})
                    // для in_progress через onAnswerChange хранятся как {position: answerString}
                    // Нужно определить формат и преобразовать в Record<number, string>
                    const raw = data.answers as Record<string, unknown>;
                    const converted: Record<number, string> = {};
                    for (const [k, v] of Object.entries(raw)) {
                      if (typeof v === 'string') {
                        // Формат onAnswerChange: { "1": "ответ" }
                        converted[Number(k)] = v;
                      } else if (typeof v === 'object' && v !== null && 'answer' in v) {
                        // Формат onFinish: { "1": { answer: "ответ", ... } }
                        converted[Number(k)] = String((v as any).answer ?? '');
                      }
                    }
                    if (Object.keys(converted).length > 0) {
                      setInitialSetAnswers(converted);
                      setInitialSetElapsed(data.time_spent_seconds ?? 0);
                    }
                  }
                } else if (assignmentType === 'classwork') {
                  // нет существующей сессии — создать новую
                  startSession(currentUser.id, assignmentId, null).then((sid) => {
                    if (sid) setActiveSessionId(sid);
                  });
                }
                dispatchLoad();
              })
              .catch((err: unknown) => {
                console.error('[openSetWithCode] error loading in_progress session:', err);
                if (assignmentType === 'classwork') {
                  startSession(currentUser.id, assignmentId, null).then((sid) => {
                    if (sid) setActiveSessionId(sid);
                  });
                }
                dispatchLoad();
              });
          } else {
            dispatchLoad();
          }
        } else {
          dispatchLoad();
        }
      }
    };
    window.addEventListener('openSetWithCode', handleOpenSetWithCode);
    return () => window.removeEventListener('openSetWithCode', handleOpenSetWithCode);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!activeSessionIdRef.current || !Object.keys(lastAnswersRef.current).length) return;
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
      // Используем sendBeacon через fetch keepalive
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/sessions?id=eq.${activeSessionIdRef.current}`;
      const body = JSON.stringify({
        answers: lastAnswersRef.current,
        time_spent_seconds: lastElapsedRef.current,
      });
      navigator.sendBeacon
        ? navigator.sendBeacon(
            url + '&apikey=' + import.meta.env.VITE_SUPABASE_ANON_KEY,
            new Blob([body], { type: 'application/json' })
          )
        : fetch(url, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Prefer': 'return=minimal',
            },
            body,
            keepalive: true,
          });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeSessionId]);

  const handleCopySeed = () => {
    if (!currentSeed) return;
    navigator.clipboard.writeText(currentSeed).then(() => {
      setSeedCopied(true);
      setTimeout(() => setSeedCopied(false), 2000);
    });
  };

  // Method to handle checking answer
  const handleCheck = () => {
    if (!taskInstance || selectedTaskId === null) return;
    setShowHints(false);
    setIsSubmitted(true);
    const taskMod = getTaskById(taskInstance.taskId);
    const isCorrect = taskMod ? taskMod.check(taskInstance.taskData, userAnswer) : false;
    const activeDiff = taskInstance.difficulty;
    track('trainer_answer_checked', {
      number: taskInstance.taskId,
      difficulty: activeDiff,
      correct: isCorrect ? 1 : 0,
    });
    if (user) {
      saveSession(user.id, {
        mode: 'single',
        variant_seed: currentSeed,
        score: isCorrect ? 1 : 0,
        max_score: 1,
        time_spent_seconds: 0,
        answers: { '1': { answer: userAnswer, correct: isCorrect, score: isCorrect ? 1 : 0, maxScore: 1, taskId: taskInstance.taskId } },
        task_type: taskInstance.taskId,
      });
    }
  };

  const handleVariantFinish = async (result: { score: number; maxScore: number; seed: string | null; timeSpentSeconds: number; answers: Record<string, unknown> }) => {
    if (!user) return;
    await saveSession(user.id, {
      mode: 'variant',
      variant_seed: result.seed,
      score: result.score,
      max_score: result.maxScore,
      time_spent_seconds: result.timeSpentSeconds,
      answers: result.answers,
      task_type: null,
    });
  };

  const handleAnswerChange = useCallback((
    answers: Record<string, string>,
    elapsedSeconds: number
  ) => {
    lastAnswersRef.current = answers;
    lastElapsedRef.current = elapsedSeconds;
    if (!activeSessionId) return;
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      updateSessionAnswers(
        activeSessionIdRef.current!,
        answers,
        elapsedSeconds,
      ).catch((err) => {
        console.error('[autoSaveAnswers] error:', err);
      });
    }, 10000);
  }, [activeSessionId]);

  const handleSetFinish = async (result: { score: number; maxScore: number; seed: string | null; timeSpentSeconds: number; answers: Record<string, unknown> }) => {
    if (!user) return;
    const finishedAssignmentId = pendingAssignmentId || localStorage.getItem('pendingAssignmentId');
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    lastAnswersRef.current = {};
    lastElapsedRef.current = 0;
    try {
      if (activeSessionId) {
        await completeSession(activeSessionId, {
          score: result.score,
          max_score: result.maxScore,
          time_spent_seconds: result.timeSpentSeconds,
          answers: result.answers,
          variant_seed: result.seed,
        });
        setActiveSessionId(null);
      } else {
        await saveSession(user.id, {
          mode: 'set',
          variant_seed: result.seed,
          score: result.score,
          max_score: result.maxScore,
          time_spent_seconds: result.timeSpentSeconds,
          answers: result.answers,
          task_type: null,
          assignment_id: finishedAssignmentId ?? undefined,
        });
      }
      localStorage.removeItem('pendingAssignmentId');
      localStorage.removeItem('pendingAssignmentCode');
      localStorage.removeItem('pendingAssignmentTitle');
      localStorage.removeItem('pendingAssignmentType');
      setPendingAssignmentId(null);

      if (finishedAssignmentId) {
        try {
          const studentName = [profile?.last_name, profile?.first_name].filter(Boolean).join(' ') || user.email || 'Ученик';
          const t = result.timeSpentSeconds;
          const timeSpent = t < 60 ? `${t}с` : `${Math.floor(t / 60)}м ${t % 60}с`;
          await sendNotificationToTeacher(finishedAssignmentId, 'set_finished', {
            title: 'Ученик сдал работу',
            message: `${studentName} завершил задание: ${assignmentMeta?.title || 'Без названия'}`,
            assignmentTitle: assignmentMeta?.title,
            assignmentId: finishedAssignmentId,
            studentName,
            score: result.score,
            maxScore: result.maxScore,
            timeSpent,
          });
        } catch {
          // ignore
        }
        setPendingClassId(null);
        localStorage.removeItem('pendingClassId');
      }
    } catch {
      // ignore
    }
  };

  const handleCreateAssignmentFromSet = (params: { title: string; seed: string; setConfig: Record<string, unknown> }) => {
    setPendingAssignment(params);
    setAssignmentModalOpen(true);
  };

  const handleAssignmentSubmit = async (params: { classId: string; title: string; dueDate: string | null; maxAttempts: number | null; hideReview?: boolean; assignmentType: 'homework' | 'classwork' }) => {
    if (!pendingAssignment) return;
    await createAssignment({
      classId: params.classId,
      title: params.title,
      variantSeed: pendingAssignment.seed,
      setConfig: pendingAssignment.setConfig,
      dueDate: params.dueDate,
      maxAttempts: params.maxAttempts,
      hideReview: params.hideReview ?? false,
      assignmentType: params.assignmentType,
    });
  };

  const handleSelectTask = (id: number) => {
    setSelectedTaskId(id);
    setTaskInstance(null); // Clear previous generated task to show "Ready to Generate" state
    setUserAnswer('');
    setIsSubmitted(false);
    setShowHints(false);
    lastCountedRef.current = null;
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleCloseReport = () => {
    setReportOpen(false);
    setReportText('');
    setReportTaskId('all');
    setReportCopiedOnce(false);
    setClipboardFailed(false);
    setEmailCopied(false);
    if (emailCopiedTimerRef.current) {
      clearTimeout(emailCopiedTimerRef.current);
    }
  };

  const [emailCopied, setEmailCopied] = useState<boolean>(false);
  const emailCopiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (emailCopiedTimerRef.current) {
        clearTimeout(emailCopiedTimerRef.current);
      }
    };
  }, []);

  const handleCopyEmail = async () => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText('oge-infogen@gmail.com');
      }
    } catch {
      // ignore
    }
    setEmailCopied(true);
    if (emailCopiedTimerRef.current) {
      clearTimeout(emailCopiedTimerRef.current);
    }
    emailCopiedTimerRef.current = setTimeout(() => {
      setEmailCopied(false);
    }, 2000);
  };

  const buildReportText = () =>
    buildBugReportText({
      activeMode,
      selectedTaskId,
      currentSeed,
      difficulty,
      variantInfo,
      setInfo,
      reportTaskId,
      reportText,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'не определен',
    });

  const handleCopyBugReport = async () => {
    const textToCopy = buildReportText();
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setReportCopiedOnce(true);
        setClipboardFailed(false);
        track('bug_report_copied', { mode: activeMode });
      } else {
        setReportCopiedOnce(true);
        setClipboardFailed(true);
      }
    } catch {
      setReportCopiedOnce(true);
      setClipboardFailed(true);
    }
  };

  useEffect(() => {
    if (!reportOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseReport();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reportOpen]);

  const isSingleCheckDisabled = !taskInstance
    || (taskInstance.taskId === 16
      ? !parseUserAnswer16(userAnswer).code.trim()
      : !userAnswer.trim());

  return (
    <>
    <Routes>
      <Route path="/" element={
    <div className={`min-h-screen transition-[color,background-color,border-color,box-shadow] duration-500 bg-theme-bg text-theme-text`}>
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-theme-card border-b border-theme-border/80 transition-colors shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center">
          {/* Левая зона: бренд и подпись */}
          <div className="flex items-center space-x-3 shrink-0 justify-self-start">
            <span className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
              <Monitor className="w-5 h-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight whitespace-nowrap leading-[1.1]" id="main-title">
                Инфоген
              </h1>
              <p className="text-[11px] text-theme-text-muted leading-[1.15] max-w-[190px] hidden lg:block">
                <span className="block">Генератор заданий и вариантов</span>
                <span className="block">ОГЭ по&nbsp;информатике</span>
              </p>
            </div>
          </div>

          {/* Центральная зона: переключатель режимов */}
          <div className="justify-self-center hidden sm:flex items-center p-1 bg-theme-bg rounded-xl border border-theme-border/80">
            <button
              onClick={() => handleModeChange('single')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeMode === 'single'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-theme-text-sec hover:text-theme-text'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{MODE_LABELS.single}</span>
            </button>
            <button
              onClick={() => handleModeChange('variant')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeMode === 'variant'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-theme-text-sec hover:text-theme-text'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{MODE_LABELS.variant}</span>
            </button>
            {assignmentMeta && (
              <div className="flex items-center">
                <button
                  onClick={() => handleModeChange('set')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                    activeMode === 'set'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-theme-text-sec hover:text-theme-text'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>ДЗ</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignmentMeta(null);
                    setPendingAssignmentId(null);
                    localStorage.removeItem('pendingAssignmentCode');
                    localStorage.removeItem('pendingAssignmentTitle');
                    localStorage.removeItem('pendingAssignmentId');
                    localStorage.removeItem('pendingAssignmentHideReview');
                    if (activeMode === 'set') handleModeChange('single');
                  }}
                  className="ml-0.5 p-1 rounded-md text-theme-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Закрыть ДЗ"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {profile?.role !== 'student' && !assignmentMeta && (
              <button
                onClick={() => handleModeChange('set')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeMode === 'set'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-theme-text-sec hover:text-theme-text'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>{MODE_LABELS.set}</span>
              </button>
            )}
          </div>

          {/* Правая зона: тема, профиль, гамбургер */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 justify-self-end">
            {/* Theme switcher */}
            <ThemeToggle />

            {/* User auth stub */}
            <AuthStub />

            {/* Mobile menu trigger */}
            {activeMode === 'single' && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text-sec transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Toggle menu"
                id="mobile-menu-btn"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* WORKSPACE CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Mobile Mode Switcher Bar */}
        <div className="flex sm:hidden items-center justify-center p-1 mb-6 bg-theme-card rounded-xl border border-theme-border shadow-xs no-print">
          <button
            onClick={() => handleModeChange('single')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeMode === 'single'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-theme-text-sec'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{MODE_LABELS.single}</span>
          </button>
          <button
            onClick={() => handleModeChange('variant')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              activeMode === 'variant'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-theme-text-sec'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{MODE_LABELS.variant}</span>
          </button>
          {assignmentMeta && (
            <div className="flex items-center flex-1">
              <button
                onClick={() => handleModeChange('set')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  activeMode === 'set'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-theme-text-sec'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>ДЗ</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setAssignmentMeta(null);
                  setPendingAssignmentId(null);
                  localStorage.removeItem('pendingAssignmentCode');
                  localStorage.removeItem('pendingAssignmentTitle');
                  localStorage.removeItem('pendingAssignmentId');
                  localStorage.removeItem('pendingAssignmentHideReview');
                  if (activeMode === 'set') handleModeChange('single');
                }}
                className="ml-0.5 p-1 rounded-md text-theme-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Закрыть ДЗ"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {profile?.role !== 'student' && !assignmentMeta && (
            <button
              onClick={() => handleModeChange('set')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                activeMode === 'set'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-theme-text-sec'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{MODE_LABELS.set}</span>
            </button>
          )}
        </div>

        {activeMode === 'variant' ? (
          <VariantView onVariantInfoChange={setVariantInfo} onFinish={handleVariantFinish} />
        ) : activeMode === 'set' ? (
          <SetBuilderView
            onSetInfoChange={setSetInfo}
            onFinish={handleSetFinish}
            onAnswerChange={handleAnswerChange}
            onCreateAssignment={profile?.role === 'teacher' ? handleCreateAssignmentFromSet : undefined}
            assignmentCode={assignmentMeta?.code}
            assignmentTitle={assignmentMeta?.title}
            hideReviewUntilFinish={assignmentMeta?.hideReview ?? false}
            isTeacher={profile?.role === 'teacher'}
            initialAnswers={initialSetAnswers ?? undefined}
            initialElapsed={initialSetElapsed}
            onElapsedChange={(elapsed) => { lastElapsedRef.current = elapsed; }}
            onInitialAnswersApplied={() => setInitialSetAnswers(null)}
            onRequestAuth={() => {
              setShowAuthModal(true);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* SIDEBAR FOR OGE TASKS (COLLAPSIBLE ON MOBILE) */}
          <aside
            ref={asideRef}
            className="hidden lg:flex lg:flex-col lg:col-span-4 bg-theme-card border border-theme-border rounded-2xl shadow-sm overflow-hidden sticky top-[105px] lg:max-h-[calc(100vh-125px)]"
          >
            <div className="p-4 border-b border-theme-border/80 bg-theme-bg flex items-center justify-between shrink-0">
              <span className="flex items-center space-x-2 font-bold text-theme-text-sec text-xs tracking-wider uppercase">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span>Задания экзамена</span>
              </span>
              <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-md font-mono font-bold text-slate-600">
                1–16
              </span>
            </div>

            {/* Tasks list */}
            <nav className="divide-y divide-slate-100 dark:divide-slate-800 flex-1 min-h-0 overflow-y-auto overflow-x-hidden sidebar-scroll">
              {OGE_TASKS.map((task) => {
                const isSelected = selectedTaskId === task.id;
                return (
                  <button
                    key={task.id}
                    onClick={() => handleSelectTask(task.id)}
                    id={`task-btn-${task.id}`}
                    className={`task-slot w-full text-left p-4 flex items-start space-x-3 transition-all ${
                      isSelected 
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-l-blue-600 font-medium' 
                        : 'border-l-4 border-l-transparent hover:bg-theme-bg/60'
                    }`}
                  >
                    <TaskBadge id={task.id} size="sm" active={isSelected} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-theme-text'} truncate`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] text-theme-text-muted truncate mt-0.5">
                        {task.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* MAIN CONTROLLER / TASK DISPENSARY PANEL */}
          <main ref={mainRef} className="lg:col-span-8 space-y-6 min-w-0">
            
            {/* CENTRAL PARAMETERS SELECTOR CARD */}
            <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-theme-text-muted uppercase tracking-wider flex items-center space-x-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <span>Параметры генератора</span>
              </h2>

              <div className="max-w-md space-y-4">
                {/* DIFFICULTY LEVEL */}
                <div>
                  <label className="block text-xs font-bold text-theme-text-muted uppercase tracking-wide mb-2.5">
                    Уровень сложности:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2" id="difficulty-selector">
                    {([1, 2, 3] as Difficulty[]).map((level) => {
                      const isActive = difficulty === level;
                      return (
                        <button
                          key={level}
                          id={`difficulty-btn-${level}`}
                          onClick={() => {
                            setDifficulty(level);
                            if (selectedTaskId !== null && taskInstance !== null) {
                              const seedToKeep = currentSeed || (customSeed.trim() !== '' ? customSeed.trim() : undefined);
                              handleGenerate(false, seedToKeep, { taskId: selectedTaskId, difficulty: level });
                            }
                          }}
                          className={`py-2 sm:py-2.5 px-1 sm:px-2 text-xs font-semibold whitespace-nowrap rounded-lg border transition-all cursor-pointer ${
                            isActive 
                              ? LEVEL_STYLES[level].activeButton 
                              : LEVEL_STYLES[level].inactiveButton
                          }`}
                        >
                          {DIFFICULTY_LABELS[level]}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={handleRandomTask}
                      id="header-random-task-btn"
                      className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-theme-border bg-theme-bg/60 text-theme-text hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-200 dark:hover:border-amber-800 transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      <span>Случайное задание</span>
                    </button>
                  </div>
                </div>

                {/* OPTIONAL CUSTOM SEED (COLLAPSED / SUBTLE) */}
                <div className="pt-2 border-t border-theme-border/60">
                  <button
                    onClick={() => setShowCustomSeed(!showCustomSeed)}
                    className="text-[11px] font-semibold text-theme-text-muted hover:text-theme-text flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <Key className="h-3.5 w-3.5 text-blue-500" />
                    <span>{showCustomSeed ? 'Скрыть «Свой сид»' : 'Указать свой сид (опционально)'}</span>
                  </button>

                  {showCustomSeed && (
                    <div className="mt-2.5 flex items-center space-x-2">
                      <input
                        type="text"
                        value={customSeed}
                        onChange={(e) => setCustomSeed(e.target.value)}
                        placeholder="Введите значение сида..."
                        className="px-3 py-1.5 text-xs font-mono bg-theme-bg border border-theme-border rounded-xl text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none flex-1"
                      />
                      <button
                        onClick={() => handleGenerate(false, customSeed)}
                        disabled={!customSeed.trim() || selectedTaskId === null}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shrink-0 ${
                          customSeed.trim() && selectedTaskId !== null
                            ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs'
                            : 'bg-theme-bg border border-theme-border text-theme-text-muted cursor-not-allowed opacity-60'
                        }`}
                      >
                        Применить сид
                      </button>
                      {customSeed.trim() && (
                        <button
                          onClick={() => setCustomSeed('')}
                          className="text-[11px] text-theme-text-muted hover:text-theme-text px-1 font-medium cursor-pointer"
                        >
                          Сбросить
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DYNAMIC GENERATED TASK BLOCK */}
            <div className="transition-[color,background-color,border-color,box-shadow] duration-300 rounded-2xl p-6 bg-theme-card border border-theme-border shadow-sm">
              
              <AnimatePresence mode="wait">
                
                {/* EMPTY/PLACEHOLDER STATE */}
                {!taskInstance ? (
                  <motion.div
                    key="empty-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center flex flex-col items-center justify-center max-w-2xl mx-auto py-6"
                  >
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-40"></div>
                      <span className="relative z-10 w-12 h-12 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                        <Sparkles className="h-5 w-5" />
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-theme-text mb-1">
                      {selectedTaskId !== null 
                        ? `Задание ${selectedTaskId} готово к генерации` 
                        : 'Выберите задание ОГЭ'}
                    </h3>
                    
                    <p className="text-xs text-theme-text-muted leading-relaxed mb-6 max-w-md">
                      {selectedTaskId !== null
                        ? 'Нажмите кнопку для генерации задачи. Условия и данные создаются на основе сида.'
                        : 'Выберите тему в левой панели или начните со случайного задания.'}
                    </p>

                    <button
                      onClick={() => {
                        if (selectedTaskId === null) {
                          handleRandomTask();
                        } else {
                          handleGenerate(false);
                        }
                      }}
                      id="generate-task-btn"
                      className="inline-flex items-center space-x-2 py-2.5 px-6 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-md shadow-blue-200/50"
                    >
                      {selectedTaskId !== null ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Сгенерировать</span>
                        </>
                      ) : (
                        <>
                          <Shuffle className="h-3.5 w-3.5" />
                          <span>Случайное задание</span>
                        </>
                      )}
                    </button>
                    
                    {/* Simplified friendly educational badges block */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-8 pt-6 border-t border-theme-border/60 items-stretch">
                      <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-xl text-left flex flex-col h-full">
                        <h4 className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider leading-[1.2] mb-1.5">
                          Тренажёр — по одному номеру
                        </h4>
                        <p className="text-[10px] text-theme-text-muted leading-relaxed flex-1">
                          Выбирайте задание ОГЭ по информатике из списка слева и решайте столько раз, сколько нужно.
                        </p>
                      </div>
                      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl text-left flex flex-col h-full">
                        <h4 className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider leading-[1.2] mb-1.5">
                          Вариант — экзамен целиком
                        </h4>
                        <p className="text-[10px] text-theme-text-muted leading-relaxed flex-1">
                          Все 16 номеров с выбором сложности для каждого и таймером, как на настоящем ОГЭ.
                        </p>
                      </div>
                      <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-xl text-left flex flex-col h-full">
                        <h4 className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider leading-[1.2] mb-1.5">
                          Набор — свой список заданий
                        </h4>
                        <p className="text-[10px] text-theme-text-muted leading-relaxed flex-1">
                          Задайте количество заданий каждого уровня, получите код и откройте набор потом по нему же.
                        </p>
                      </div>
                    </div>

                  </motion.div>
                ) : (
                  
                  /* ACTIVE TASK VISUALS AND RENDERING */
                  <motion.div
                    key={taskInstance.id}
                    ref={taskCardRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    
                    {/* Header line of active task */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-theme-border">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <TaskBadge id={taskInstance.taskId} size="sm" active={true} />
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${LEVEL_STYLES[taskInstance.difficulty].badge}`}>
                            {DIFFICULTY_LABELS[taskInstance.difficulty]}
                          </span>

                          {/* Current seed info with copy button */}
                          {currentSeed && (
                            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wider bg-theme-bg/60 text-theme-text-muted border border-theme-border">
                              <span>Сид: <strong className="text-theme-text">{currentSeed}</strong></span>
                              <button
                                onClick={handleCopySeed}
                                className="ml-1 p-0.5 hover:text-blue-600 transition-colors cursor-pointer text-theme-text-muted"
                                title="Скопировать сид"
                              >
                                {seedCopied ? <Check className="h-3.5 w-3.5 text-blue-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                        <h3 className="text-base font-extrabold tracking-tight text-theme-text break-words">
                          {getTaskById(taskInstance.taskId)?.title}
                        </h3>
                      </div>

                      {/* Header Regenerate button */}
                      <button
                        onClick={() => handleGenerate(true)}
                        title="Сгенерировать заново (новый случайный сид)"
                        className="w-full sm:w-auto px-3 py-2 text-xs font-bold bg-theme-bg hover:bg-theme-border/50 text-theme-text border border-theme-border rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 sm:self-start"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-blue-600" />
                        <span>Сгенерировать заново</span>
                      </button>
                    </div>

                    {/* DYNAMIC RENDER FROM MODULE */}
                    <div className="py-2 text-theme-text">
                      {getTaskById(taskInstance.taskId)?.render(
                        taskInstance.taskData,
                        {
                          userAnswer,
                          setUserAnswer,
                          isSubmitted,
                          showHints,
                          isCorrect: currentIsCorrect,
                          onCheck: handleCheck,
                          isCheckDisabled: isSingleCheckDisabled,
                        }
                      )}
                    </div>

                    {/* ACTION FOOTER BAR */}
                    <div className="pt-4 border-t border-theme-border/50 flex flex-wrap items-center justify-between gap-4">
                      
                      {/* Left: Hint status toggler */}
                      {!isSubmitted ? (
                        <button
                          onClick={() => {
                            const next = !showHints;
                            setShowHints(next);
                            if (next && taskInstance) {
                              track('hint_shown', { number: taskInstance.taskId });
                            }
                          }}
                          className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            showHints 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' 
                              : 'hover:bg-theme-bg border border-theme-border text-theme-text-sec'
                          }`}
                        >
                          <Lightbulb className="h-3.5 w-3.5" />
                          <span>{showHints ? 'Скрыть подсказку' : 'Показать подсказку'}</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      {/* Right: Submission controls */}
                      <div className="flex items-center space-x-2">
                        {!isSubmitted ? (
                          <>
                            {((taskInstance?.taskId === 16 && !parseUserAnswer16(userAnswer).code.trim()) ||
                              (taskInstance?.taskId === 15 && !userAnswer.trim())) && (
                              <span className="text-xs text-theme-text-muted font-medium italic mr-1">
                                Введите код программы
                              </span>
                            )}
                            <button
                              onClick={handleCheck}
                              id="check-btn"
                              disabled={isSingleCheckDisabled}
                              className={`py-2 px-5 text-xs font-bold rounded-xl transition-all ${
                                (taskInstance?.taskId === 16 ? parseUserAnswer16(userAnswer).code.trim() : userAnswer.trim())
                                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-200/50 dark:shadow-none cursor-pointer'
                                  : 'bg-theme-bg border border-theme-border text-theme-text-muted cursor-not-allowed'
                              }`}
                            >
                              Проверить ответ
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleGenerate(true)}
                            className="py-2 px-5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <span>Сгенерировать заново</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                    </div>

                  </motion.div>
                )}

              </AnimatePresence>

            </div>

            {/* STUDY RECOMMENDATIONS BLOCK */}
            <div className="bg-theme-statement-bg border border-theme-statement-border rounded-2xl p-5 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
                <AlertCircle className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Рекомендация по подготовке</span>
              </h3>
              <p className="text-[11px] text-theme-text-muted leading-relaxed">
                Регулярное решение тренировочных заданий разной сложности помогает лучше закрепить материал ОГЭ по информатике. Если задача вызывает затруднения, воспользуйтесь кнопкой «Показать подсказку» для просмотра пошагового алгоритма работы.
              </p>
            </div>

          </main>

        </div>
        )}

        {/* FOOTER */}
        <footer className="mt-8 pt-6 border-t border-theme-border text-xs text-theme-text-muted flex flex-wrap items-center justify-between gap-3 no-print">
          <span>Инфоген · автор: Алексей Яруллин</span>
          <button
            type="button"
            onClick={() => {
              if (activeMode === 'set' && setInfo?.activePosition !== null && setInfo?.activePosition !== undefined) {
                setReportTaskId(String(setInfo.activePosition));
              } else {
                setReportTaskId('all');
              }
              setReportOpen(true);
            }}
            className="inline-flex items-center gap-1.5 hover:text-theme-text transition-colors cursor-pointer"
          >
            <Bug className="h-3.5 w-3.5" />
            <span>Сообщить об ошибке</span>
          </button>
        </footer>

      </div>

      {/* BUG REPORT MODAL */}
      {reportOpen && (
        <div 
          onClick={handleCloseReport}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-theme-card border border-theme-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-theme-border">
              <h3 className="text-sm font-bold text-theme-text flex items-center space-x-2">
                <Bug className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Сообщить об ошибке</span>
              </h3>
              <button
                onClick={handleCloseReport}
                className="p-1 rounded-md text-theme-text-muted hover:bg-theme-bg hover:text-theme-text transition-colors cursor-pointer"
                title="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Readonly data block */}
            <div className="p-3 bg-theme-bg border border-theme-border rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-theme-text-muted">
                <span>Режим:</span>
                <span className="font-semibold text-theme-text">{MODE_LABELS[activeMode]}</span>
              </div>

              {activeMode === 'variant' ? (
                <div className="space-y-1">
                  <label className="block text-theme-text-muted">Задание:</label>
                  <select
                    value={reportTaskId}
                    onChange={(e) => setReportTaskId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-theme-card border border-theme-border rounded-lg text-theme-text focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">не относится к конкретному заданию</option>
                    {variantInfo?.tasks.map((task) => (
                      <option key={task.id} value={String(task.id)}>
                        {task.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : activeMode === 'set' ? (
                setInfo && setInfo.tasks.length > 0 ? (
                  <div className="space-y-1">
                    <label className="block text-theme-text-muted">Задание:</label>
                    <select
                      value={reportTaskId}
                      onChange={(e) => setReportTaskId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-theme-card border border-theme-border rounded-lg text-theme-text focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="all">не относится к конкретному заданию</option>
                      {setInfo.tasks.map((task) => (
                        <option key={task.position} value={String(task.position)}>
                          {task.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-theme-text-muted">
                    <span>Задание:</span>
                    <span className="font-semibold text-theme-text">не относится к конкретному заданию</span>
                  </div>
                )
              ) : (
                <div className="flex justify-between items-center text-theme-text-muted">
                  <span>Задание:</span>
                  <span className="font-semibold text-theme-text">
                    {selectedTaskId !== null ? selectedTaskId : 'интерфейс (задание не открыто)'}
                  </span>
                </div>
              )}

              {activeMode === 'variant' ? (
                <div className="space-y-1.5 pt-1 border-t border-theme-border/50">
                  {variantInfo?.seed && (
                    <div className="flex justify-between items-center text-theme-text-muted">
                      <span>Сид:</span>
                      <span className="font-mono font-semibold text-theme-text">
                        {variantInfo.seed}
                      </span>
                    </div>
                  )}
                  {variantInfo?.code && (
                    <div className="space-y-0.5">
                      <span className="text-theme-text-muted text-[11px]">Код варианта:</span>
                      <div className="p-2 bg-theme-card border border-theme-border rounded-lg font-mono text-[11px] text-theme-text break-all max-h-16 overflow-y-auto select-all">
                        {variantInfo.code}
                      </div>
                    </div>
                  )}
                </div>
              ) : activeMode === 'set' ? (
                <div className="space-y-1.5 pt-1 border-t border-theme-border/50">
                  {(() => {
                    const foundTask =
                      reportTaskId !== 'all'
                        ? setInfo?.tasks.find((t) => String(t.position) === reportTaskId) ?? null
                        : null;

                    return (
                      <>
                        {foundTask && (
                          <div className="flex justify-between items-center text-theme-text-muted">
                            <span>Позиция в наборе:</span>
                            <span className="font-semibold text-theme-text">
                              {foundTask.position}
                              {setInfo?.totalTasks ? ` из ${setInfo.totalTasks}` : ''}
                            </span>
                          </div>
                        )}
                        {setInfo?.code && (
                          <div className="space-y-0.5">
                            <span className="text-theme-text-muted text-[11px]">Код набора:</span>
                            <div className="p-2 bg-theme-card border border-theme-border rounded-lg font-mono text-[11px] text-theme-text break-all max-h-16 overflow-y-auto select-all">
                              {setInfo.code}
                            </div>
                          </div>
                        )}
                        {setInfo?.seed && (
                          <div className="flex justify-between items-center text-theme-text-muted">
                            <span>Сид набора:</span>
                            <span className="font-mono font-semibold text-theme-text">
                              {setInfo.seed}
                            </span>
                          </div>
                        )}
                        {foundTask ? (
                          <>
                            <div className="flex justify-between items-center text-theme-text-muted">
                              <span>Уровень сложности:</span>
                              <span className="font-semibold text-theme-text">
                                {foundTask.difficulty} ({DIFFICULTY_LABELS[foundTask.difficulty]})
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-theme-text-muted">
                              <span>Сид задания:</span>
                              <span className="font-mono font-semibold text-theme-text">
                                {foundTask.subSeed}
                              </span>
                            </div>
                          </>
                        ) : (
                          setInfo?.totalTasks && setInfo.totalTasks > 0 ? (
                            <div className="flex justify-between items-center text-theme-text-muted">
                              <span>Всего заданий:</span>
                              <span className="font-semibold text-theme-text">
                                {setInfo.totalTasks}
                              </span>
                            </div>
                          ) : null
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-1.5 pt-1 border-t border-theme-border/50">
                  {currentSeed && (
                    <div className="flex justify-between items-center text-theme-text-muted">
                      <span>Сид:</span>
                      <span className="font-mono font-semibold text-theme-text">{currentSeed}</span>
                    </div>
                  )}
                </div>
              )}

              {activeMode !== 'set' && (
                <div className="flex justify-between items-center text-theme-text-muted">
                  <span>Уровень сложности:</span>
                  <span className="font-semibold text-theme-text">
                    {activeMode === 'variant'
                      ? (reportTaskId === 'all'
                          ? (variantInfo?.difficultyInfo || 'настраиваемая (16 заданий)')
                          : (() => {
                              const found = variantInfo?.tasks.find((t) => String(t.id) === reportTaskId);
                              return found ? DIFFICULTY_LABELS[found.difficulty] : (variantInfo?.difficultyInfo || 'настраиваемая (16 заданий)');
                            })())
                      : `${difficulty} (${DIFFICULTY_LABELS[difficulty]})`}
                  </span>
                </div>
              )}
            </div>

            {/* Textarea */}
            <div>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Опишите, что произошло..."
                rows={4}
                className="w-full px-3 py-2 text-xs bg-theme-bg border border-theme-border rounded-xl text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* Actions / Feedback */}
            <div className="space-y-2">
              {clipboardFailed ? (
                <div className="space-y-2">
                  <p className="text-xs text-theme-text-muted flex flex-wrap items-center gap-1.5">
                    <span>Не удалось скопировать автоматически. Скопируйте текст ниже и отправьте на</span>
                    <a
                      href="mailto:oge-infogen@gmail.com"
                      className="underline hover:text-theme-text transition-colors break-all"
                    >
                      oge-infogen@gmail.com
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      aria-label={emailCopied ? 'Адрес скопирован' : 'Скопировать адрес email'}
                      title={emailCopied ? 'Скопировано' : 'Скопировать email'}
                      className="text-xs text-theme-text-muted hover:text-theme-text inline-flex items-center gap-1 cursor-pointer transition-colors p-0.5 rounded"
                    >
                      {emailCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Скопировано
                          </span>
                        </>
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span>:</span>
                  </p>
                  <textarea
                    readOnly
                    value={buildReportText()}
                    rows={4}
                    className="w-full px-3 py-2 text-xs font-mono bg-theme-bg border border-theme-border rounded-xl text-theme-text"
                  />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCopyBugReport}
                    disabled={!reportText.trim()}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      reportText.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md shadow-blue-200/50 dark:shadow-none'
                        : 'bg-theme-bg border border-theme-border text-theme-text-muted cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{reportCopiedOnce ? 'Скопировать ещё раз' : 'Скопировать баг-репорт'}</span>
                  </button>

                  <p className="text-xs text-theme-text-muted text-center flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span>Скопируйте текст и отправьте на</span>
                    <a
                      href="mailto:oge-infogen@gmail.com"
                      className="underline hover:text-theme-text transition-colors break-all"
                    >
                      oge-infogen@gmail.com
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      aria-label={emailCopied ? 'Адрес скопирован' : 'Скопировать адрес email'}
                      title={emailCopied ? 'Скопировано' : 'Скопировать email'}
                      className="text-xs text-theme-text-muted hover:text-theme-text inline-flex items-center gap-1 cursor-pointer transition-colors p-0.5 rounded"
                    >
                      {emailCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Скопировано
                          </span>
                        </>
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE COLLAPSED SIDEBAR NAVIGATION DRAWERS */}
      <AnimatePresence>
        {isMobileMenuOpen && activeMode === 'single' && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-theme-card border-l border-theme-border z-50 p-6 flex flex-col shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-theme-border">
                <span className="flex items-center space-x-2 font-bold text-theme-text text-sm">
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Выберите задание ОГЭ</span>
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-md text-theme-text-muted hover:bg-theme-bg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile list */}
              <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                {OGE_TASKS.map((task) => {
                  const isSelected = selectedTaskId === task.id;
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleSelectTask(task.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-start space-x-3 ${
                        isSelected 
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <TaskBadge id={task.id} size="md" active={isSelected} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${isSelected ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-theme-text'} truncate`}>
                          {task.title}
                        </p>
                        <p className="text-[10px] text-theme-text-muted truncate mt-0.5">
                          {task.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {assignmentModalOpen && pendingAssignment && (
        <AssignmentCreateModal
          isOpen={assignmentModalOpen}
          onClose={() => { setAssignmentModalOpen(false); setPendingAssignment(null); }}
          defaultTitle={pendingAssignment.title}
          variantSeed={pendingAssignment.seed}
          setConfig={pendingAssignment.setConfig}
          classes={classes}
          onSubmit={handleAssignmentSubmit}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

    </div>
      } />
      <Route element={<CabinetLayout />}>
        <Route path="/teacher/profile" element={<TeacherProfilePage />} />
        <Route path="/teacher/classes" element={<ClassesPage />} />
        <Route path="/teacher/classes/:classId" element={<ClassDetailPage />} />
        <Route path="/teacher/classes/:classId/students/:studentId" element={<StudentProfilePage />} />
        <Route path="/teacher/assignments" element={<TeacherAssignmentsPage />} />
        <Route path="/teacher/assignments/:assignmentId" element={<AssignmentDetailPage />} />
        <Route path="/teacher/stats" element={<TeacherStatsPage />} />
        <Route path="/teacher/history" element={<TeacherHistoryPage />} />
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student/assignments" element={<StudentAssignmentsPage />} />
        <Route path="/student/stats" element={<StatsPage />} />
        <Route path="/student/history" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <ResetPasswordModal isOpen={passwordRecovery} onDone={clearPasswordRecovery} />
    </>
  );
}

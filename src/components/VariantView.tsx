import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import {
  Sliders,
  Sparkles,
  Copy,
  Check,
  Key,
  AlertTriangle,
  Shuffle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Printer
} from 'lucide-react';
import { SessionBanner } from './SessionBanner';
import { Difficulty, TaskInstance, DIFFICULTY_LABELS } from '../types';
import { LEVEL_STYLES, RANDOM_LEVEL_STYLE } from '../levelStyles';
import { OGE_TASKS, getTaskById } from '../tasks';
import { TaskBadge } from './TaskBadge';
import { parseUserAnswer, encodeUserAnswer } from '../tasks/task14';
import { parseUserAnswer16 } from '../tasks/task16';
import { parseTask13Answer } from '../tasks/task13';
import {
  CONTENT_VERSION,
  VariantConfig,
  buildVariant,
  encodeVariant,
  decodeVariant,
  generateVariantSeed
} from '../variant';
import { getAnswerKey } from '../utils/answerKey';
import { PrintDocument } from './PrintDocument';
import { printDocument } from '../utils/print';

// Exam countdown timer configuration
export const EXAM_DURATION_SECONDS = 2 * 3600 + 30 * 60; // 2 hours 30 minutes = 9000s
export const LOW_TIME_THRESHOLD_SECONDS = 5 * 60; // 5 minutes = 300s

function formatTimeHHMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatElapsedHuman(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return `${hours} ч ${minutes} мин ${seconds} сек`;
  }
  if (minutes > 0) {
    return `${minutes} мин ${seconds} сек`;
  }
  return `${seconds} сек`;
}

// Total max points for full OGE variant (21 points)
export const TOTAL_MAX_POINTS = OGE_TASKS.reduce((acc, t) => acc + t.maxPoints, 0); // 21

// OGE 5-point grading thresholds: 0–4 -> "2", 5–10 -> "3", 11–16 -> "4", 17–21 -> "5"
export function calculateGrade(score: number): number {
  if (score >= 17) return 5;
  if (score >= 11) return 4;
  if (score >= 5) return 3;
  return 2;
}

export interface VariantTaskItem {
  id: number;
  label: string;
  difficulty: Difficulty;
}

export interface VariantInfo {
  seed: string | null;
  code: string | null;
  tasks: VariantTaskItem[];
  taskInfo: string;
  difficultyInfo: string;
}

interface VariantViewProps {
  onVariantInfoChange?: (info: VariantInfo) => void;
}

interface PerTaskState {
  userAnswer: string;
  showHints: boolean;
}

// Helper to format correct answer display across all task types
function getDisplayAnswer(taskData: any, taskId?: number): string {
  return getAnswerKey(taskId ?? taskData?.taskId ?? 0, taskData).display;
}

// Formats the user's answer for display in the summary table.
// Task 14 stores answers as "ans1|ans2|chartFlag" — show only the two answers.
function getDisplayUserAnswer(taskId: number, rawAnswer: string): string | null {
  if (taskId === 13) {
    if (!rawAnswer || !rawAnswer.trim()) return null;
    const doc = parseTask13Answer(rawAnswer);
    if (!doc || !doc.paragraphs) return null;

    const numParas = doc.paragraphs.length;
    let tableStr = 'нет';
    if (doc.table && doc.table.rows.length > 0) {
      const r = doc.table.rows.length;
      let c = 0;
      doc.table.rows.forEach(row => {
        let rowCols = 0;
        row.forEach(cell => {
          rowCols += cell.colSpan || 1;
        });
        if (rowCols > c) c = rowCols;
      });
      tableStr = `${r}×${c}`;
    }

    let countB = 0;
    let countI = 0;
    let countU = 0;

    doc.paragraphs.forEach(p => {
      p.spans.forEach(s => {
        if (s.b) countB++;
        if (s.i) countI++;
        if (s.u) countU++;
      });
    });

    if (doc.table) {
      doc.table.rows.forEach(row => {
        row.forEach(cell => {
          cell.spans.forEach(s => {
            if (s.b) countB++;
            if (s.i) countI++;
            if (s.u) countU++;
          });
        });
      });
    }

    return `абзацев: ${numParas}; таблица ${tableStr}; Ж:${countB} К:${countI} П:${countU}`;
  }
  if (taskId === 14) {
    const [a1, a2] = parseUserAnswer(rawAnswer);
    const t1 = a1.trim();
    const t2 = a2.trim();
    if (!t1 && !t2) return null;
    return `${t1 || '—'} / ${t2 || '—'}`;
  }
  if (taskId === 16) {
    const parsed = parseUserAnswer16(rawAnswer);
    const trimmedCode = (parsed.code || '').trim();
    return trimmedCode ? trimmedCode : null;
  }
  const trimmed = (rawAnswer || '').trim();
  return trimmed ? trimmed : null;
}

export const VARIANT_STORAGE_KEY = 'oge:variant:v1';

export interface VariantSessionStateV1 {
  version: 1;
  code: string;
  taskStates: Record<number, PerTaskState>;
  isSubmitted: boolean;
  expandedTasks?: Record<number, boolean>;
  showConfigPanel?: boolean;
  timeRemaining?: number;
  finalElapsedSeconds?: number | null;
  isPaused?: boolean;
}

export function loadSavedVariantState(): {
  code: string;
  variantConfig: VariantConfig;
  variantTasks: TaskInstance[];
  taskStates: Record<number, PerTaskState>;
  isSubmitted: boolean;
  expandedTasks: Record<number, boolean>;
  showConfigPanel: boolean;
  timeRemaining: number;
  finalElapsedSeconds: number | null;
  isPaused: boolean;
} | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(VARIANT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.version === 1 && typeof data.code === 'string' && data.code.trim()) {
      const cfg = decodeVariant(data.code.trim());
      if (!cfg) {
        return null;
      }
      const tasks = buildVariant(cfg);
      const isSubmitted = Boolean(data.isSubmitted);
      const timeRemaining =
        typeof data.timeRemaining === 'number' && data.timeRemaining >= 0 && data.timeRemaining <= EXAM_DURATION_SECONDS
          ? data.timeRemaining
          : (isSubmitted ? 0 : EXAM_DURATION_SECONDS);
      const finalElapsedSeconds =
        typeof data.finalElapsedSeconds === 'number'
          ? data.finalElapsedSeconds
          : (isSubmitted ? EXAM_DURATION_SECONDS - timeRemaining : null);
      const isPaused = Boolean(data.isPaused);

      return {
        code: data.code.trim(),
        variantConfig: cfg,
        variantTasks: tasks,
        taskStates: data.taskStates && typeof data.taskStates === 'object' ? data.taskStates : {},
        isSubmitted,
        expandedTasks: data.expandedTasks && typeof data.expandedTasks === 'object' ? data.expandedTasks : {},
        showConfigPanel: typeof data.showConfigPanel === 'boolean' ? data.showConfigPanel : false,
        timeRemaining,
        finalElapsedSeconds,
        isPaused,
      };
    }
  } catch {
    // If invalid JSON or any error, silently start with clean state
  }
  return null;
}

export function VariantView({ onVariantInfoChange }: VariantViewProps) {
  const savedVariant = useMemo(() => loadSavedVariantState(), []);

  // Configured difficulties for each of the 16 tasks (default L1 or from saved variant)
  const [difficulties, setDifficulties] = useState<Difficulty[]>(
    () => savedVariant?.variantConfig.difficulties ?? (Array(16).fill(1) as Difficulty[])
  );

  // Active generated variant state
  const [variantConfig, setVariantConfig] = useState<VariantConfig | null>(
    () => savedVariant?.variantConfig ?? null
  );
  const [variantTasks, setVariantTasks] = useState<TaskInstance[] | null>(
    () => savedVariant?.variantTasks ?? null
  );

  // Code input & messages
  const [inputCode, setInputCode] = useState<string>(
    () => savedVariant?.code ?? ''
  );
  const [codeError, setCodeError] = useState<string | null>(null);
  const [versionWarning, setVersionWarning] = useState<string | null>(() => {
    if (savedVariant && savedVariant.variantConfig.contentVersion !== CONTENT_VERSION) {
      return `Вариант собран на другой версии контента (v${savedVariant.variantConfig.contentVersion}, текущая v${CONTENT_VERSION}). Некоторые задания могут отличаться.`;
    }
    return null;
  });

  // UI state
  const [copied, setCopied] = useState<boolean>(false);
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(
    () => savedVariant?.showConfigPanel ?? (savedVariant ? false : true)
  );

  // State for user answers and hint toggles for each task in the variant
  const [taskStates, setTaskStates] = useState<Record<number, PerTaskState>>(
    () => savedVariant?.taskStates ?? {}
  );

  // Variant completion & summary state
  const [isSubmitted, setIsSubmitted] = useState<boolean>(
    () => savedVariant?.isSubmitted ?? false
  );
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>(
    () => savedVariant?.expandedTasks ?? {}
  );

  // Print menu state
  const [showPrintMenu, setShowPrintMenu] = useState<boolean>(false);
  const [printAnswers, setPrintAnswers] = useState<'none' | 'inline' | 'keys'>('none');
  const [printSolutions, setPrintSolutions] = useState<boolean>(false);
  const printMenuRef = useRef<HTMLDivElement>(null);

  // Close print menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(event.target as Node)) {
        setShowPrintMenu(false);
      }
    };
    if (showPrintMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPrintMenu]);

  // Countdown timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(
    () => savedVariant?.timeRemaining ?? EXAM_DURATION_SECONDS
  );
  const [isPaused, setIsPaused] = useState<boolean>(
    () => savedVariant?.isPaused ?? false
  );
  const [finalElapsedSeconds, setFinalElapsedSeconds] = useState<number | null>(
    () => savedVariant?.finalElapsedSeconds ?? null
  );

  const resetTimer = () => {
    setIsPaused(false);
    setTimeRemaining(EXAM_DURATION_SECONDS);
    setFinalElapsedSeconds(null);
  };

  // Timer countdown ticking effect based on accumulated seconds (1 tick per sec)
  useEffect(() => {
    if (!variantTasks || isSubmitted || isPaused) return;

    const intervalId = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [variantTasks, isSubmitted, isPaused]);

  // Auto-finish variant when time expires (0 seconds left)
  useEffect(() => {
    if (timeRemaining === 0 && !isSubmitted && variantTasks) {
      setIsSubmitted(true);
      setFinalElapsedSeconds(EXAM_DURATION_SECONDS);
      setShowConfirmModal(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [timeRemaining, isSubmitted, variantTasks]);

  // Pause card height tracking for dynamic vertical centering
  const [pauseCardHeight, setPauseCardHeight] = useState<number>(0);
  const pauseCardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isPaused || !pauseCardRef.current) return;
    const updateHeight = () => {
      if (pauseCardRef.current) {
        setPauseCardHeight(pauseCardRef.current.getBoundingClientRect().height);
      }
    };
    updateHeight();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateHeight);
      ro.observe(pauseCardRef.current);
      return () => {
        ro.disconnect();
      };
    }
  }, [isPaused]);

  // Sync variant state info with parent for bug report modal & footer
  useEffect(() => {
    if (!onVariantInfoChange) return;
    if (!variantConfig || !variantTasks) {
      onVariantInfoChange({
        seed: null,
        code: null,
        tasks: [],
        taskInfo: 'интерфейс (вариант не сгенерирован)',
        difficultyInfo: 'настраиваемая (16 заданий)',
      });
    } else {
      const openTaskIdx = Object.keys(expandedTasks).find(k => expandedTasks[Number(k)]);
      const openTaskNumber = openTaskIdx !== undefined && variantTasks[Number(openTaskIdx)]
        ? variantTasks[Number(openTaskIdx)].taskId
        : null;

      const taskText = openTaskNumber !== null
        ? `Задание ${openTaskNumber} (разбор в варианте)`
        : '1–16 (все задания варианта)';

      const taskList: VariantTaskItem[] = variantTasks.map(t => {
        const def = getTaskById(t.taskId);
        return {
          id: t.taskId,
          label: `Задание ${t.taskId} (${def?.title || `№${t.taskId}`})`,
          difficulty: t.difficulty
        };
      });

      onVariantInfoChange({
        seed: encodeVariant(variantConfig),
        code: encodeVariant(variantConfig),
        tasks: taskList,
        taskInfo: taskText,
        difficultyInfo: '16 заданий (настраиваемая)',
      });
    }
  }, [variantConfig, variantTasks, expandedTasks, onVariantInfoChange]);

  // Save variant state to sessionStorage
  useEffect(() => {
    try {
      if (typeof sessionStorage === 'undefined') return;
      if (!variantConfig) {
        sessionStorage.removeItem(VARIANT_STORAGE_KEY);
        return;
      }
      const code = encodeVariant(variantConfig);
      const stateToSave: VariantSessionStateV1 = {
        version: 1,
        code,
        taskStates,
        isSubmitted,
        expandedTasks,
        showConfigPanel,
        timeRemaining,
        finalElapsedSeconds,
        isPaused,
      };
      sessionStorage.setItem(VARIANT_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore
    }
  }, [variantConfig, taskStates, isSubmitted, expandedTasks, showConfigPanel, timeRemaining, finalElapsedSeconds, isPaused]);

  // Pause / Resume handler
  const handleTogglePause = () => {
    if (isSubmitted) return;
    setIsPaused(prev => !prev);
  };

  // Quick preset setters
  const handleSetAllDifficulties = (level: Difficulty) => {
    setDifficulties(Array(16).fill(level) as Difficulty[]);
  };

  const handleSetRandomDifficulties = () => {
    const randoms = Array.from({ length: 16 }, () =>
      (Math.floor(Math.random() * 3) + 1) as Difficulty
    );
    setDifficulties(randoms);
  };

  const handleDifficultyChange = (index: number, level: Difficulty) => {
    setDifficulties(prev => {
      const next = [...prev];
      next[index] = level;
      return next;
    });
  };

  // Generate a new variant
  const handleGenerateVariant = () => {
    const randomSeed = generateVariantSeed();
    const cfg: VariantConfig = {
      seed: randomSeed,
      difficulties: [...difficulties],
      contentVersion: CONTENT_VERSION
    };

    const tasks = buildVariant(cfg);
    setVariantConfig(cfg);
    setVariantTasks(tasks);
    setCodeError(null);
    setVersionWarning(null);
    setTaskStates({});
    setIsSubmitted(false);
    setShowConfirmModal(false);
    setExpandedTasks({});
    setShowConfigPanel(false);
    resetTimer();
  };

  // Open variant by code
  const handleOpenVariantCode = () => {
    const trimmed = inputCode.trim();
    if (!trimmed) {
      setCodeError('Введите код варианта');
      return;
    }

    const cfg = decodeVariant(trimmed);
    if (!cfg) {
      setCodeError('Не удалось распознать код варианта. Проверьте правильность строки.');
      return;
    }

    const tasks = buildVariant(cfg);

    setVariantConfig(cfg);
    setVariantTasks(tasks);
    setDifficulties(cfg.difficulties);
    setCodeError(null);
    setTaskStates({});
    setIsSubmitted(false);
    setShowConfirmModal(false);
    setExpandedTasks({});
    setShowConfigPanel(false);
    resetTimer();

    if (cfg.contentVersion !== CONTENT_VERSION) {
      setVersionWarning(
        `Вариант собран на другой версии контента (v${cfg.contentVersion}, текущая v${CONTENT_VERSION}). Некоторые задания могут отличаться.`
      );
    } else {
      setVersionWarning(null);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (!variantConfig) return;
    const code = encodeVariant(variantConfig);
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Helper for per-task state mutation
  const getTaskState = (index: number): PerTaskState => {
    return taskStates[index] || { userAnswer: '', showHints: false };
  };

  const updateTaskState = (index: number, patch: Partial<PerTaskState>) => {
    setTaskStates(prev => ({
      ...prev,
      [index]: { ...getTaskState(index), ...patch }
    }));
  };

  // Variant completion handlers
  const unansweredCount = variantTasks
    ? variantTasks.filter((instance, idx) => {
        const raw = getTaskState(idx).userAnswer;
        if (instance.taskId === 14) {
          const [a1, a2] = parseUserAnswer(raw);
          return !a1.trim() || !a2.trim();
        }
        return !raw.trim();
      }).length
    : 0;

  const handleFinishClick = () => {
    if (!variantTasks) return;
    if (unansweredCount > 0) {
      setShowConfirmModal(true);
    } else {
      confirmFinishVariant();
    }
  };

  const confirmFinishVariant = () => {
    setFinalElapsedSeconds(EXAM_DURATION_SECONDS - timeRemaining);
    setIsSubmitted(true);
    setShowConfirmModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTaskExpand = (idx: number) => {
    setExpandedTasks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Total earned points & grade calculation
  const totalEarnedPoints = variantTasks
    ? variantTasks.reduce((acc, instance, idx) => {
        const taskMod = OGE_TASKS[idx];
        if (!taskMod) return acc;
        const st = getTaskState(idx);
        if (typeof taskMod.checkScore === 'function') {
          return acc + taskMod.checkScore(instance.taskData, st.userAnswer).score;
        }
        if (instance.taskId >= 13) return acc;
        const isCorrect = taskMod.check(instance.taskData, st.userAnswer);
        const maxPts = getTaskById(instance.taskId)?.maxPoints ?? 1;
        return acc + (isCorrect ? maxPts : 0);
      }, 0)
    : 0;

  const grade = calculateGrade(totalEarnedPoints);

  const currentCode = variantConfig ? encodeVariant(variantConfig) : '';

  return (
    <div>
      <div className="space-y-6 no-print">
        {/* INPUT VARIANT CODE / LOAD SECTION */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold">
              <Key className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-theme-text">Ввести код варианта</h3>
              <p className="text-[11px] text-theme-text-muted">
                Откройте ранее сгенерированный вариант по его уникальному коду
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                setCodeError(null);
              }}
              placeholder="Вставьте код варианта..."
              className="flex-1 md:w-64 px-3 py-2 text-xs font-mono bg-theme-bg border border-theme-border rounded-xl text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={handleOpenVariantCode}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
            >
              Открыть
            </button>
          </div>
        </div>

        {codeError && (
          <p className="mt-2 text-xs text-rose-500 font-semibold flex items-center space-x-1">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{codeError}</span>
          </p>
        )}
      </div>

      {/* VARIANT CONFIGURATION PANEL */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-theme-border pb-4">
          <div>
            <h2 className="text-sm font-bold text-theme-text flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-blue-600" />
              <span>Настройка нового варианта (16 заданий)</span>
            </h2>
            <p className="text-xs text-theme-text-muted mt-0.5">
              Укажите желаемую сложность для каждого задания ОГЭ
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleSetAllDifficulties(1)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${LEVEL_STYLES[1].presetButton}`}
            >
              {`Все L1 (${DIFFICULTY_LABELS[1]})`}
            </button>
            <button
              onClick={() => handleSetAllDifficulties(2)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${LEVEL_STYLES[2].presetButton}`}
            >
              {`Все L2 (${DIFFICULTY_LABELS[2]})`}
            </button>
            <button
              onClick={() => handleSetAllDifficulties(3)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${LEVEL_STYLES[3].presetButton}`}
            >
              {`Все L3 (${DIFFICULTY_LABELS[3]})`}
            </button>
            <button
              onClick={handleSetRandomDifficulties}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center space-x-1 ${RANDOM_LEVEL_STYLE.button}`}
            >
              <Shuffle className="h-3 w-3" />
              <span>Случайно</span>
            </button>
          </div>
        </div>

        {/* 16 Tasks Difficulty Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {OGE_TASKS.map((task, idx) => {
            const currentDiff = difficulties[idx] || 1;
            return (
              <div
                key={task.id}
                className="p-3 bg-theme-bg/60 border border-theme-border rounded-xl flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <TaskBadge id={task.id} size="sm" />
                  <span className="text-xs font-semibold text-theme-text truncate" title={task.title}>
                    {task.title}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1">
                  {([1, 2, 3] as Difficulty[]).map((level) => {
                    const isActive = currentDiff === level;
                    return (
                      <button
                        key={level}
                        onClick={() => handleDifficultyChange(idx, level)}
                        className={`py-1 text-xs font-bold rounded transition-all ${
                          isActive
                            ? LEVEL_STYLES[level].activeButton
                            : LEVEL_STYLES[level].inactiveButton
                        }`}
                      >
                        L{level}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerateVariant}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Сгенерировать вариант</span>
          </button>
        </div>
      </div>

      {/* GENERATED VARIANT CONTENT */}
      {variantTasks && variantConfig && (
        <div className="space-y-6">

          {/* STICKY TOP BANNER (HIDDEN WHEN SUBMITTED) */}
          {!isSubmitted && (
            <SessionBanner
              timerMode="countdown"
              seconds={timeRemaining}
              isPaused={isPaused}
              onTogglePause={handleTogglePause}
              onFinish={handleFinishClick}
              finishLabel="Завершить"
              lowTimeThreshold={LOW_TIME_THRESHOLD_SECONDS}
            />
          )}

          {/* HEADER ABOVE TASK TABLE / LIST: VARIANT SEED, BADGES, CODE, COPY, PRINT/PDF (NORMAL DOCUMENT FLOW) */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-xs font-bold text-theme-text uppercase tracking-wider">
                  Вариант {encodeVariant(variantConfig)}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  16 заданий
                </span>
                {isSubmitted && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                    Завершён
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="bg-theme-bg border border-theme-border font-mono text-xs px-3 py-2 rounded-xl text-blue-600 dark:text-blue-400 font-bold max-w-xs truncate">
                  {currentCode}
                </div>

                <button
                  onClick={handleCopyCode}
                  className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-theme-bg border border-theme-border text-theme-text hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
                </button>

                {/* Print / PDF dropdown */}
                <div className="relative" ref={printMenuRef}>
                  <button
                    onClick={() => setShowPrintMenu(!showPrintMenu)}
                    className="px-3 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer bg-theme-bg border border-theme-border text-theme-text hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    title="Печать / Экспорт варианта в PDF"
                  >
                    <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Печать / PDF</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showPrintMenu && (
                    <div className="absolute right-0 mt-2 w-72 bg-theme-card border border-theme-border rounded-2xl p-4 shadow-xl z-50 space-y-4 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between border-b border-theme-border pb-2">
                        <span className="text-xs font-bold text-theme-text flex items-center space-x-1.5">
                          <Printer className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Параметры печати / PDF</span>
                        </span>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-theme-text-muted uppercase tracking-wider block">
                          Ответы:
                        </label>
                        <div className="space-y-1.5">
                          <label className="flex items-center space-x-2 text-xs text-theme-text cursor-pointer hover:text-blue-600 transition-colors">
                            <input
                              type="radio"
                              name="printAnswers"
                              checked={printAnswers === 'none'}
                              onChange={() => setPrintAnswers('none')}
                              className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Без ответов (для ученика)</span>
                          </label>
                          <label className="flex items-center space-x-2 text-xs text-theme-text cursor-pointer hover:text-blue-600 transition-colors">
                            <input
                              type="radio"
                              name="printAnswers"
                              checked={printAnswers === 'inline'}
                              onChange={() => setPrintAnswers('inline')}
                              className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Ответы у номеров заданий</span>
                          </label>
                          <label className="flex items-center space-x-2 text-xs text-theme-text cursor-pointer hover:text-blue-600 transition-colors">
                            <input
                              type="radio"
                              name="printAnswers"
                              checked={printAnswers === 'keys'}
                              onChange={() => setPrintAnswers('keys')}
                              className="text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>Ключи в конце варианта</span>
                          </label>
                        </div>
                      </div>

                      <div className="border-t border-theme-border pt-2">
                        <label className="flex items-center space-x-2 text-xs text-theme-text cursor-pointer hover:text-blue-600 transition-colors">
                          <input
                            type="checkbox"
                            checked={printSolutions}
                            onChange={(e) => setPrintSolutions(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-semibold">С подробным разбором</span>
                        </label>
                      </div>

                      <button
                        onClick={() => {
                          setShowPrintMenu(false);
                          setTimeout(() => {
                            printDocument();
                          }, 60);
                        }}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Распечатать / Сохранить в PDF</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* VERSION WARNING BANNER IF NEEDED */}
            {versionWarning && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>{versionWarning}</span>
              </div>
            )}
          </div>

          {/* SUMMARY TABLE WHEN SUBMITTED */}
          {isSubmitted && (
            <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border pb-4">
                <div>
                  <h2 className="text-base font-extrabold text-theme-text flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span>Итоговая сводка результатов варианта</span>
                  </h2>
                  <p className="text-xs text-theme-text-muted mt-0.5">
                    Вариант {encodeVariant(variantConfig)} завершён. Все ответы зафиксированы и проверены.
                  </p>
                </div>

                {/* Score, Elapsed Time & Grade Display */}
                <div className="flex items-center space-x-3 shrink-0">
                  {finalElapsedSeconds !== null && (
                    <div className="bg-theme-bg border border-theme-border px-3.5 py-2 rounded-xl text-center shadow-xs">
                      <div className="text-[10px] uppercase font-bold text-theme-text-muted tracking-wider">Время</div>
                      <div className="text-xs font-bold text-theme-text mt-0.5 whitespace-nowrap">
                        {formatElapsedHuman(finalElapsedSeconds)}
                      </div>
                    </div>
                  )}

                  <div className="bg-theme-bg border border-theme-border px-4 py-2 rounded-xl text-center shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-theme-text-muted tracking-wider">Баллы</div>
                    <div className="text-base font-black text-blue-600 dark:text-blue-400">
                      {totalEarnedPoints} <span className="text-xs font-normal text-theme-text-muted">из {TOTAL_MAX_POINTS}</span>
                    </div>
                  </div>

                  <div className={`border px-4 py-2 rounded-xl text-center min-w-[75px] shadow-xs ${
                    grade === 5
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : grade === 4
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                      : grade === 3
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  }`}>
                    <div className="text-[10px] uppercase font-bold text-current/80 tracking-wider">Оценка</div>
                    <div className="text-base font-black">{grade}</div>
                  </div>
                </div>
              </div>

              {/* Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-theme-border text-theme-text-muted uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-2.5 px-3">№</th>
                      <th className="py-2.5 px-3">Тема</th>
                      <th className="py-2.5 px-3">Ваш ответ</th>
                      <th className="py-2.5 px-3">Верный ответ</th>
                      <th className="py-2.5 px-3">Баллы</th>
                      <th className="py-2.5 px-3">Статус</th>
                      <th className="py-2.5 px-3 text-right">Разбор</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border/60">
                    {variantTasks.map((instance, idx) => {
                      const taskMod = OGE_TASKS[idx];
                      const st = getTaskState(idx);
                      const hasCheckScore = typeof taskMod.checkScore === 'function';
                      const inDev = instance.taskId >= 13 && !hasCheckScore;
                      const isExpanded = !!expandedTasks[idx];
                      const maxPts = getTaskById(instance.taskId)?.maxPoints ?? 1;

                      let earnedPts = 0;
                      if (hasCheckScore) {
                        earnedPts = taskMod.checkScore!(instance.taskData, st.userAnswer).score;
                      } else if (!inDev) {
                        const isCorrect = taskMod.check(instance.taskData, st.userAnswer);
                        earnedPts = isCorrect ? maxPts : 0;
                      }

                      return (
                        <React.Fragment key={instance.id}>
                          <tr className="hover:bg-theme-bg/50 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-theme-text">
                              №{instance.taskId}
                            </td>
                            <td className="py-3 px-3 font-semibold text-theme-text max-w-xs truncate" title={taskMod.title}>
                              {taskMod.title}
                            </td>
                            <td className={`py-3 px-3 font-mono text-theme-text ${[13, 15, 16].includes(instance.taskId) ? '' : 'font-bold'}`}>
                              {(() => {
                                const displayUser = getDisplayUserAnswer(instance.taskId, st.userAnswer);
                                if (displayUser === null) {
                                  return (
                                    <span className="text-theme-text-muted font-normal italic">нет ответа</span>
                                  );
                                }
                                if ([13, 15, 16].includes(instance.taskId)) {
                                  return (
                                    <pre className="whitespace-pre-wrap break-words text-[11px] leading-snug font-mono max-w-[320px] max-h-[7.5rem] overflow-y-auto px-2 py-1 rounded bg-theme-bg border border-theme-border text-left">
                                      {displayUser}
                                    </pre>
                                  );
                                }
                                return (
                                  <span className="px-2 py-0.5 rounded bg-theme-bg border border-theme-border">
                                    {displayUser}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {getDisplayAnswer(instance.taskData, instance.taskId)}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-theme-text whitespace-nowrap">
                              {inDev ? (
                                <span className="text-theme-text-muted font-normal text-[11px]">
                                  0 / {maxPts} <span className="text-[10px] italic">— вручную</span>
                                </span>
                              ) : (
                                <span>
                                  {earnedPts} / {maxPts}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {inDev ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                  <span>Оценивается вручную</span>
                                </span>
                              ) : earnedPts === maxPts ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Верно</span>
                                </span>
                              ) : earnedPts > 0 ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  <HelpCircle className="h-3.5 w-3.5" />
                                  <span>Частично {earnedPts}/{maxPts}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Неверно</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => toggleTaskExpand(idx)}
                                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-theme-bg hover:bg-theme-border/50 text-theme-text border border-theme-border transition-all inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Скрыть' : 'Разбор'}</span>
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expandable row detail */}
                          {isExpanded && (
                            <tr className="bg-theme-bg/80">
                              <td colSpan={7} className="p-4 border-t border-theme-border/60">
                                <div className="p-3 bg-theme-card border border-theme-border rounded-xl text-xs text-theme-text leading-relaxed">
                                  {taskMod.render(instance.taskData, {
                                    userAnswer: st.userAnswer,
                                    setUserAnswer: () => {},
                                    isSubmitted: true,
                                    showHints: false,
                                    isCorrect: taskMod.check(instance.taskData, st.userAnswer)
                                  })}
                                </div>
                              </td>
                            </tr>
                          )}

                          {/* Task 14 diagram self-check row */}
                          {instance.taskId === 14 && (() => {
                            const [u1_14, u2_14, flag_14] = parseUserAnswer(getTaskState(idx).userAnswer);
                            return (
                              <tr key={`selfcheck-${instance.id}`} className="bg-theme-bg/40">
                                <td colSpan={7} className="py-3 px-3">
                                  <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-theme-text">
                                    <input
                                      type="checkbox"
                                      checked={flag_14 === '1'}
                                      onChange={(e) =>
                                        updateTaskState(idx, {
                                          userAnswer: encodeUserAnswer(u1_14, u2_14, e.target.checked ? '1' : '0')
                                        })
                                      }
                                      className="w-4 h-4 rounded border-theme-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className="font-semibold">Задание 14 — самопроверка диаграммы:</span>
                                    <span>Моя диаграмма совпала с примером — засчитать 1 балл</span>
                                  </label>
                                </td>
                              </tr>
                            );
                          })()}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RENDER ALL 16 TASKS ON ONE SCROLLABLE PAGE */}
          {!isSubmitted && (
            <div id="variant-tasks-container" className="relative">
              {/* PAUSED STATE BANNER */}
              {isPaused && (
                <div
                  className="sticky z-40 pointer-events-none h-0"
                  style={{
                    top:
                      pauseCardHeight > 0
                        ? `max(0px, calc(50vh - ${Math.round(pauseCardHeight / 2)}px))`
                        : 'max(0px, calc(50vh - 7rem))',
                  }}
                >
                  <div className="absolute inset-x-0 top-0 pointer-events-none flex justify-center">
                    <div
                      ref={pauseCardRef}
                      className="w-full max-w-7xl mx-auto pointer-events-auto bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-2xl p-6 text-center space-y-3 shadow-md"
                    >
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Pause className="h-6 w-6 fill-current" />
                      </div>
                      <h3 className="text-base font-bold text-theme-text">Вариант поставлен на паузу</h3>
                      <p className="text-xs text-theme-text-muted max-w-md mx-auto">
                        Отсчёт времени остановлен ({formatTimeHHMMSS(timeRemaining)}). Задания скрыты до продолжения. Нажмите «Продолжить», чтобы возобновить работу.
                      </p>
                      <button
                        onClick={handleTogglePause}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center space-x-2"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        <span>Продолжить выполнение</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div
                inert={isPaused ? true : undefined}
                className={`space-y-8 transition-all ${isPaused ? 'blur-md pointer-events-none select-none opacity-30' : ''}`}
              >
                {variantTasks.map((instance, idx) => {
                const taskMod = OGE_TASKS[idx];
                const st = getTaskState(idx);
                const isCorrect = taskMod.check(instance.taskData, st.userAnswer);
                const hasCheckScore = typeof taskMod.checkScore === 'function';
                const inDev = instance.taskId >= 13 && !hasCheckScore;
                const maxPts = getTaskById(instance.taskId)?.maxPoints ?? 1;
                const earnedPts = hasCheckScore
                  ? taskMod.checkScore!(instance.taskData, st.userAnswer).score
                  : (isCorrect ? maxPts : 0);

                return (
                  <div
                    key={instance.id}
                    id={`variant-task-${instance.taskId}`}
                    className={`bg-theme-card border rounded-2xl p-6 shadow-sm space-y-4 transition-colors ${
                      isSubmitted
                        ? inDev
                          ? 'border-amber-300 dark:border-amber-800'
                          : earnedPts === maxPts
                          ? 'border-emerald-300 dark:border-emerald-800'
                          : earnedPts > 0
                          ? 'border-amber-300 dark:border-amber-800'
                          : 'border-rose-300 dark:border-rose-800'
                        : 'border-theme-border'
                    }`}
                  >
                    {/* Task Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-theme-border">
                      <div className="flex items-center space-x-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow-sm">
                          {instance.taskId}
                        </span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                              ОГЭ Задание {instance.taskId}
                            </span>
                            <span
                              className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded font-bold ${LEVEL_STYLES[instance.difficulty].badge}`}
                            >
                              {`L${instance.difficulty} ${DIFFICULTY_LABELS[instance.difficulty]}`}
                            </span>
                          </div>
                          <h3 className="text-sm font-extrabold text-theme-text mt-1">
                            {taskMod.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Task Content Render */}
                    <div className="py-2 text-theme-text">
                      {taskMod.render(instance.taskData, {
                        userAnswer: st.userAnswer,
                        setUserAnswer: (val: string) => {
                          if (!isSubmitted) {
                            updateTaskState(idx, { userAnswer: val });
                          }
                        },
                        isSubmitted: isSubmitted,
                        showHints: st.showHints || isSubmitted,
                        isCorrect: isSubmitted ? isCorrect : undefined
                      })}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* BOTTOM ACTION BUTTON / STATUS BAR */}
          {!isSubmitted ? (
            <div className="pt-6 pb-12 flex justify-center">
              <button
                onClick={handleFinishClick}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Завершить вариант</span>
              </button>
            </div>
          ) : (
            <div className="pt-6 pb-12 flex justify-center">
              <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Вариант завершён. Результаты зафиксированы в сводке выше.</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
              <span className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h3 className="text-base font-bold text-theme-text">Завершить вариант?</h3>
            </div>

            <p className="text-xs text-theme-text-muted leading-relaxed">
              Осталось <strong className="text-theme-text font-bold">{unansweredCount}</strong> незаполненных заданий. Завершить всё равно?
            </p>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-theme-text-sec bg-theme-bg hover:bg-theme-border/50 border border-theme-border rounded-xl transition-all cursor-pointer"
              >
                Продолжить решение
              </button>
              <button
                onClick={confirmFinishVariant}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Завершить всё равно
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* PRINT-ONLY DOCUMENT */}
      {variantTasks && variantConfig && (
        <div className="print-only">
          <PrintDocument
            tasks={variantTasks.map((t) => ({
              taskId: t.taskId,
              difficulty: t.difficulty,
              taskData: t.taskData,
              seed: variantConfig.seed,
            }))}
            options={{
              answers: printAnswers,
              solutions: printSolutions,
              title: 'Тренировочный вариант ОГЭ по информатике',
              code: currentCode || encodeVariant(variantConfig),
              seed: variantConfig.seed,
            }}
          />
        </div>
      )}

    </div>
  );
}


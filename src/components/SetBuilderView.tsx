import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Printer,
  Download,
  AlertTriangle,
  FileText,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Trash2,
  SlidersHorizontal,
  Shuffle,
  RotateCcw,
} from 'lucide-react';
import { getTaskById } from '../tasks';
import { Difficulty } from '../types';
import {
  SetConfig,
  SetSlot,
  SetEntry,
  buildSet,
  encodeSetShort,
  decodeSetShort,
  fileCode,
  normalizeSeed,
  generateSetSeed,
} from '../set';

export interface SetTaskItem {
  position: number;
  taskId: number;
  label: string;
  difficulty: Difficulty;
  subSeed: number;
}

export interface SetInfo {
  code: string | null;
  seed: string | null;
  totalTasks: number;
  tasks: SetTaskItem[];
  activePosition: number | null;
  taskId: number | null;
  difficulty: Difficulty | null;
  subSeed: number | null;
}

export interface SetBuilderViewProps {
  onSetInfoChange?: (info: SetInfo) => void;
}
import { PrintDocument } from './PrintDocument';
import { printDocument } from '../utils/print';
import { buildSetZipBlob } from '../utils/exportSet';
import { saveBlob } from '../utils/download';
import { scorePosition } from '../utils/scoring';
import { track } from '../utils/analytics';
import { SetCheckerBlock } from './SetCheckerBlock';
import { TaskAnswerPanel, TaskPanelCheckState } from './TaskAnswerPanel';
import { SessionBanner, formatBannerTime } from './SessionBanner';
import { LEVEL_STYLES, RANDOM_LEVEL_STYLE } from '../levelStyles';

export const SET_STORAGE_KEY = 'oge:set:v2';

export function createDefaultSlots(): SetSlot[] {
  return Array.from({ length: 16 }, (_, i) => ({
    taskId: i + 1,
    n1: 0,
    n2: 0,
    n3: 0,
    nR: 0,
  }));
}

export function normalizeSlots(slots?: SetSlot[]): SetSlot[] {
  const map = new Map<number, SetSlot>();
  for (let t = 1; t <= 16; t++) {
    map.set(t, { taskId: t, n1: 0, n2: 0, n3: 0, nR: 0 });
  }
  if (Array.isArray(slots)) {
    for (const s of slots) {
      if (s && s.taskId >= 1 && s.taskId <= 16) {
        map.set(s.taskId, {
          taskId: s.taskId,
          n1: Math.max(0, Math.min(20, Math.floor(s.n1 || 0))),
          n2: Math.max(0, Math.min(20, Math.floor(s.n2 || 0))),
          n3: Math.max(0, Math.min(20, Math.floor(s.n3 || 0))),
          nR: Math.max(0, Math.min(20, Math.floor(s.nR || 0))),
        });
      }
    }
  }
  return Array.from(map.values());
}

export interface SetSessionStateV2 {
  version: 2;
  builtCode: string;
  seed: string;
  title: string;
  slots: SetSlot[];
  hasBuilt: boolean;
  userAnswers: Record<number, string>;
  panelStates: Record<number, TaskPanelCheckState>;
  allowStudentCheck: boolean;
  elapsedSeconds?: number;
  isPaused?: boolean;
  isFinished?: boolean;
  replacements?: Record<number, number>;
}

export function loadSavedSetState(): {
  title: string;
  seed: string;
  slots: SetSlot[];
  hasBuilt: boolean;
  builtCode: string;
  builtEntries: SetEntry[];
  userAnswers: Record<number, string>;
  panelStates: Record<number, TaskPanelCheckState>;
  allowStudentCheck: boolean;
  elapsedSeconds: number;
  isPaused: boolean;
  isFinished: boolean;
  replacements: Record<number, number>;
} | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(SET_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.version === 2 && typeof data.builtCode === 'string') {
      let builtEntries: SetEntry[] = [];
      const savedReplacements: Record<number, number> =
        data.replacements && typeof data.replacements === 'object' ? data.replacements : {};

      if (data.hasBuilt && data.builtCode) {
        const decoded = decodeSetShort(data.builtCode);
        const fallbackSlots = Array.isArray(data.slots) ? data.slots : [];
        const slotsToUse =
          decoded && decoded.slots && decoded.slots.some((s) => s.n1 > 0 || s.n2 > 0 || s.n3 > 0 || s.nR > 0)
            ? decoded.slots
            : fallbackSlots;
        const seedToUse =
          typeof data.seed === 'string' && data.seed.trim() ? data.seed : (decoded?.seed ?? '1');
        const replacementsToUse = decoded?.replacements ?? savedReplacements;

        if (slotsToUse.length > 0) {
          const result = buildSet({
            seed: seedToUse,
            title: typeof data.title === 'string' ? data.title : '',
            slots: slotsToUse,
            replacements: replacementsToUse,
          });
          builtEntries = result.entries;
        }
      }
      const rawTitle = typeof data.title === 'string' ? data.title : '';
      const initialTitle = rawTitle === 'Набор тренировочных заданий' ? '' : rawTitle;
      return {
        title: initialTitle,
        seed: typeof data.seed === 'string' ? data.seed : '',
        slots: Array.isArray(data.slots) ? normalizeSlots(data.slots) : createDefaultSlots(),
        hasBuilt: Boolean(data.hasBuilt),
        builtCode: data.builtCode,
        builtEntries,
        userAnswers: data.userAnswers && typeof data.userAnswers === 'object' ? data.userAnswers : {},
        panelStates: data.panelStates && typeof data.panelStates === 'object' ? data.panelStates : {},
        allowStudentCheck: typeof data.allowStudentCheck === 'boolean' ? data.allowStudentCheck : true,
        elapsedSeconds:
          typeof data.elapsedSeconds === 'number' && Number.isFinite(data.elapsedSeconds)
            ? Math.max(0, Math.floor(data.elapsedSeconds))
            : 0,
        isPaused: Boolean(data.isPaused),
        isFinished: Boolean(data.isFinished),
        replacements: savedReplacements,
      };
    }
  } catch {
    // If invalid JSON or any error, silently start with clean state
  }
  return null;
}

export function plural(n: number, one: string, twoToFour: string, many: string): string {
  const abs = Math.abs(n);
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 19) {
    return many;
  }
  if (mod10 === 1) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return twoToFour;
  }
  return many;
}

export interface SlotColorClasses {
  focusRing: string;
  active: string;
}

export const SLOT_STEPPER_COLORS: Record<'n1' | 'n2' | 'n3' | 'nR', SlotColorClasses> = {
  n1: {
    focusRing: 'focus-within:ring-emerald-500',
    active: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold',
  },
  n2: {
    focusRing: 'focus-within:ring-indigo-500',
    active: 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold',
  },
  n3: {
    focusRing: 'focus-within:ring-rose-500',
    active: 'border-rose-500 text-rose-600 dark:text-rose-400 font-bold',
  },
  nR: {
    focusRing: 'focus-within:ring-amber-500',
    active: 'border-amber-500 text-amber-600 dark:text-amber-400 font-bold',
  },
};

export const SLOT_STEPPER_LABELS: Record<
  'n1' | 'n2' | 'n3' | 'nR',
  { badge: string; inputSuffix: string }
> = {
  n1: { badge: 'L1', inputSuffix: 'уровень 1' },
  n2: { badge: 'L2', inputSuffix: 'уровень 2' },
  n3: { badge: 'L3', inputSuffix: 'уровень 3' },
  nR: { badge: 'RND', inputSuffix: 'RND' },
};

export interface SlotStepperProps {
  taskId: number;
  taskNumber: string;
  field: 'n1' | 'n2' | 'n3' | 'nR';
  value: number;
  colorClasses: SlotColorClasses;
  canIncrement: boolean;
  onAdjust: (taskId: number, field: 'n1' | 'n2' | 'n3' | 'nR', delta: 1 | -1) => void;
  onUpdate: (taskId: number, field: 'n1' | 'n2' | 'n3' | 'nR', value: string) => void;
}

export function SlotStepper({
  taskId,
  taskNumber,
  field,
  value,
  colorClasses,
  canIncrement,
  onAdjust,
  onUpdate,
}: SlotStepperProps) {
  const { badge, inputSuffix } = SLOT_STEPPER_LABELS[field];
  return (
    <td className="py-3.5 px-2 text-center border-l border-theme-border/60">
      <div
        className={`inline-flex items-center justify-between border rounded-xl h-9 w-[74px] sm:w-[76px] transition-colors focus-within:ring-2 ${colorClasses.focusRing} ${
          value > 0
            ? `bg-theme-card ${colorClasses.active}`
            : 'bg-theme-bg/40 border-theme-border text-theme-text-muted'
        }`}
      >
        <button
          type="button"
          tabIndex={-1}
          disabled={value <= 0}
          onClick={() => onAdjust(taskId, field, -1)}
          aria-label={`Убрать ${badge} из задания ${taskNumber}`}
          title={`Убрать ${badge} из задания ${taskNumber}`}
          className="w-[22px] h-full flex items-center justify-center text-xs font-bold shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded-l-xl select-none"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          max={20}
          value={value === 0 ? '' : value}
          placeholder="0"
          onChange={(e) => onUpdate(taskId, field, e.target.value)}
          aria-label={`Задание ${taskId} ${inputSuffix}`}
          className="w-[30px] sm:w-[32px] h-full p-0 text-center font-bold text-sm bg-transparent border-0 text-inherit focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-theme-text-muted/60"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={value >= 20 || !canIncrement}
          onClick={() => onAdjust(taskId, field, 1)}
          aria-label={`Добавить ${badge} к заданию ${taskNumber}`}
          title={`Добавить ${badge} к заданию ${taskNumber}`}
          className="w-[22px] h-full flex items-center justify-center text-xs font-bold shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 rounded-r-xl select-none"
        >
          +
        </button>
      </div>
    </td>
  );
}

export function SetBuilderView({ onSetInfoChange }: SetBuilderViewProps = {}) {
  const savedState = useMemo(() => loadSavedSetState(), []);

  // Configuration state
  const [title, setTitle] = useState<string>(() => {
    const t = savedState?.title ?? '';
    return t === 'Набор тренировочных заданий' ? '' : t;
  });
  const effectiveTitle = title.trim() || 'Набор заданий';
  const [seedFromLoadedCode, setSeedFromLoadedCode] = useState<string>('');
  const [slots, setSlots] = useState<SetSlot[]>(
    () => savedState?.slots ?? createDefaultSlots()
  );
  const [builtSlots, setBuiltSlots] = useState<SetSlot[] | null>(
    () => (savedState?.hasBuilt ? savedState.slots : null)
  );
  const [builtSeed, setBuiltSeed] = useState<string>(
    () => (savedState?.hasBuilt ? savedState.seed : '')
  );
  const [builtTitle, setBuiltTitle] = useState<string>(
    () => (savedState?.hasBuilt ? savedState.title : '')
  );

  // Built set results
  const [builtEntries, setBuiltEntries] = useState<SetEntry[]>(() => savedState?.builtEntries ?? []);
  const [builtCode, setBuiltCode] = useState<string>(() => savedState?.builtCode ?? '');
  const [hasBuilt, setHasBuilt] = useState<boolean>(() => savedState?.hasBuilt ?? false);
  const [replacements, setReplacements] = useState<Record<number, number>>(
    () => savedState?.replacements ?? {}
  );
  const [activePosition, setActivePosition] = useState<number | null>(null);

  // Stopwatch & Completion state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => savedState?.elapsedSeconds ?? 0);
  const [isPaused, setIsPaused] = useState<boolean>(() => savedState?.isPaused ?? false);
  const [isFinished, setIsFinished] = useState<boolean>(() => savedState?.isFinished ?? false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [buildNonce, setBuildNonce] = useState<number>(0);

  // User input answers inside the preview (position -> answer)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>(() => savedState?.userAnswers ?? {});

  // Panel check & solution states (position -> { submitted, showSolution, result })
  const [panelStates, setPanelStates] = useState<Record<number, TaskPanelCheckState>>(
    () => savedState?.panelStates ?? {}
  );

  // Flag: allowStudentCheck (Exam mode inverted in UI)
  // TODO: перенести в набор/аккаунты, когда появится бэкенд
  const [allowStudentCheck, setAllowStudentCheck] = useState<boolean>(
    () => savedState?.allowStudentCheck ?? true
  );

  // Code input & clipboard
  const [inputCode, setInputCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  // Teacher block toggle
  const [showTeacherBlock, setShowTeacherBlock] = useState<boolean>(false);

  // Print options
  const [showPrintMenu, setShowPrintMenu] = useState<boolean>(false);
  const printMenuRef = useRef<HTMLDivElement>(null);
  const [printAnswers, setPrintAnswers] = useState<'none' | 'inline' | 'keys'>('none');
  const [printSolutions, setPrintSolutions] = useState<boolean>(false);

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

  // Stopwatch interval: +1s per tick when hasBuilt && !isFinished && !isPaused
  useEffect(() => {
    if (!hasBuilt || isFinished || isPaused) return;

    const intervalId = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [hasBuilt, isFinished, isPaused]);

  // ZIP Export options
  const [includeNotepad, setIncludeNotepad] = useState<boolean>(true);
  const renderTimerStartedRef = useRef<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [zipMissing, setZipMissing] = useState<string[]>([]);

  const isConfigDirty = useMemo(() => {
    if (!hasBuilt) return false;
    if (title.trim() !== builtTitle) return true;
    if (!builtSlots) return true;
    return slots.some((s, i) => {
      const b = builtSlots[i];
      return !b || s.taskId !== b.taskId || s.n1 !== b.n1 || s.n2 !== b.n2 || s.n3 !== b.n3 || s.nR !== b.nR;
    });
  }, [hasBuilt, title, builtTitle, slots, builtSlots]);

  // Current config object
  const currentConfig: SetConfig = useMemo(
    () => ({
      seed: (builtSeed || seedFromLoadedCode).trim(),
      title: hasBuilt ? builtTitle : title.trim(),
      slots,
      replacements: hasBuilt && !isConfigDirty ? replacements : undefined,
    }),
    [builtSeed, seedFromLoadedCode, hasBuilt, builtTitle, title, slots, replacements, isConfigDirty]
  );

  // Short code for current configuration
  const currentShortCode = useMemo(() => {
    try {
      return encodeSetShort(currentConfig);
    } catch {
      return '';
    }
  }, [currentConfig]);

  // 5-char file code for current configuration
  const currentFileCode = useMemo(() => {
    try {
      return fileCode(currentConfig);
    } catch {
      return '';
    }
  }, [currentConfig]);

  useEffect(() => {
    try {
      if (typeof sessionStorage === 'undefined') return;
      const stateToSave: SetSessionStateV2 = {
        version: 2,
        builtCode,
        seed: builtSeed,
        title,
        slots,
        hasBuilt,
        userAnswers,
        panelStates,
        allowStudentCheck,
        elapsedSeconds,
        isPaused,
        isFinished,
        replacements,
      };
      sessionStorage.setItem(SET_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore storage quota or access errors
    }
  }, [
    builtCode,
    builtSeed,
    title,
    slots,
    hasBuilt,
    userAnswers,
    panelStates,
    allowStudentCheck,
    elapsedSeconds,
    isPaused,
    isFinished,
    replacements,
  ]);

  // Sync set state info with parent for bug report modal & footer
  useEffect(() => {
    if (!onSetInfoChange) return;

    if (!hasBuilt || builtEntries.length === 0) {
      onSetInfoChange({
        code: builtCode || currentShortCode || null,
        seed: builtSeed || null,
        totalTasks: 0,
        tasks: [],
        activePosition: null,
        taskId: null,
        difficulty: null,
        subSeed: null,
      });
      return;
    }

    const taskList: SetTaskItem[] = builtEntries.map((e) => {
      const def = getTaskById(e.taskId);
      return {
        position: e.position,
        taskId: e.taskId,
        label: `№${e.position}. Задание ${e.taskId} (${def?.title || `№${e.taskId}`}) — L${e.difficulty}`,
        difficulty: e.difficulty,
        subSeed: e.subSeed,
      };
    });

    const activeEntry =
      activePosition !== null
        ? builtEntries.find((e) => e.position === activePosition) ?? null
        : null;

    onSetInfoChange({
      code: builtCode || currentShortCode || null,
      seed: builtSeed || null,
      totalTasks: builtEntries.length,
      tasks: taskList,
      activePosition: activeEntry ? activeEntry.position : null,
      taskId: activeEntry ? activeEntry.taskId : null,
      difficulty: activeEntry ? activeEntry.difficulty : null,
      subSeed: activeEntry ? activeEntry.subSeed : null,
    });
  }, [
    onSetInfoChange,
    hasBuilt,
    builtEntries,
    builtCode,
    currentShortCode,
    builtSeed,
    activePosition,
  ]);

  useEffect(() => {
    if (import.meta.env.DEV && renderTimerStartedRef.current) {
      renderTimerStartedRef.current = false;
      console.timeEnd('render');
    }
  }, [builtEntries, buildNonce]);

  // Aggregate totals
  const totalCount = useMemo(() => {
    return slots.reduce((sum, s) => sum + s.n1 + s.n2 + s.n3 + s.nR, 0);
  }, [slots]);

  const activeTasksCount = useMemo(() => {
    return slots.filter((s) => s.n1 + s.n2 + s.n3 + s.nR > 0).length;
  }, [slots]);

  const totalMaxPoints = useMemo(() => {
    return slots.reduce((sum, s) => {
      const taskMod = getTaskById(s.taskId);
      const pts = taskMod?.maxPoints ?? 1;
      const count = s.n1 + s.n2 + s.n3 + s.nR;
      return sum + pts * count;
    }, 0);
  }, [slots]);

  // Slot update handler
  const handleUpdateSlot = (
    taskId: number,
    field: 'n1' | 'n2' | 'n3' | 'nR',
    value: string
  ) => {
    const parsed = parseInt(value, 10);
    const num = isNaN(parsed) ? 0 : Math.max(0, Math.min(20, parsed));
    setSlots((prev) =>
      prev.map((s) => (s.taskId === taskId ? { ...s, [field]: num } : s))
    );
  };

  const handleAdjustSlot = (
    taskId: number,
    field: 'n1' | 'n2' | 'n3' | 'nR',
    delta: 1 | -1
  ) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.taskId !== taskId) return s;
        const cur = s[field];
        if (delta === -1 && cur <= 0) return s;
        if (delta === 1 && (cur >= 20 || totalCount >= 640)) return s;
        const nextVal = Math.max(0, Math.min(20, cur + delta));
        return { ...s, [field]: nextVal };
      })
    );
  };

  const handlePanelStateChange = useCallback((pos: number, st: TaskPanelCheckState) => {
    setActivePosition(pos);
    setPanelStates((prev) => {
      const cur = prev[pos];
      if (
        cur &&
        cur.submitted === st.submitted &&
        cur.showSolution === st.showSolution &&
        cur.result === st.result
      ) {
        return prev;
      }
      return {
        ...prev,
        [pos]: st,
      };
    });
  }, []);

  const resetSessionProgress = () => {
    setActivePosition(null);
    setUserAnswers({});
    setPanelStates({});
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsFinished(false);
    setShowConfirmModal(false);
    setBuildNonce((prev) => prev + 1);
  };

  // Build the set
  const handleBuild = () => {
    if (totalCount === 0 || totalCount > 640) return;
    setActivePosition(null);
    setCodeError(null);
    setZipMissing([]);

    const rawSeed = seedFromLoadedCode.trim();
    const effectiveSeed = rawSeed ? normalizeSeed(rawSeed) : generateSetSeed();

    const rawTitle = title.trim();

    const targetConfig: SetConfig = {
      seed: effectiveSeed,
      title: rawTitle,
      slots,
    };

    let newCode = '';
    try {
      newCode = encodeSetShort(targetConfig);
    } catch {
      setCodeError('Не удалось закодировать набор');
      return;
    }

    const result = buildSet(targetConfig);
    track('set_created', { tasks_count: result.entries.length });
    if (import.meta.env.DEV) {
      renderTimerStartedRef.current = true;
      console.time('render');
    }
    setBuiltEntries(result.entries);
    setBuiltCode(newCode);
    setBuiltSlots(slots);
    setBuiltSeed(effectiveSeed);
    setBuiltTitle(rawTitle);
    setHasBuilt(true);
    setReplacements({});
    setInputCode('');
    setSeedFromLoadedCode('');
    resetSessionProgress();
  };

  // Load from code (accepts short code)
  const handleLoadFromCode = () => {
    const raw = inputCode.trim();
    if (!raw) {
      setCodeError('Введите код набора для загрузки');
      return;
    }

    const decoded = decodeSetShort(raw);
    if (!decoded) {
      setCodeError('Не удалось распознать код набора. Проверьте правильность строки.');
      return;
    }

    const decodedSlots = Array.isArray(decoded.slots) ? decoded.slots : [];
    const decodedTotal = decodedSlots.reduce(
      (sum, s) => sum + s.n1 + s.n2 + s.n3 + s.nR,
      0
    );
    if (decodedTotal > 640) {
      setCodeError(`Слишком много: ${decodedTotal} из 640 максимум`);
      return;
    }

    setCodeError(null);
    setZipMissing([]);

    let newCode = '';
    try {
      newCode = encodeSetShort(decoded);
    } catch {
      newCode = '';
    }

    setSeedFromLoadedCode(decoded.seed);
    const targetTitle = decoded.title?.trim() || effectiveTitle;
    if (decoded.title) {
      setTitle(decoded.title);
    }
    const normalizedSlots = normalizeSlots(decoded.slots);
    setSlots(normalizedSlots);

    const decodedReplacements = decoded.replacements || {};
    setReplacements(decodedReplacements);

    const result = buildSet({
      seed: decoded.seed,
      title: targetTitle,
      slots: normalizedSlots,
      replacements: decodedReplacements,
    });
    if (import.meta.env.DEV) {
      renderTimerStartedRef.current = true;
      console.time('render');
    }
    setBuiltEntries(result.entries);
    setBuiltCode(newCode);
    setBuiltSlots(normalizedSlots);
    setBuiltSeed(decoded.seed);
    setBuiltTitle(targetTitle);
    setHasBuilt(true);
    resetSessionProgress();
  };

  // Replace a task at a specific position with a newly generated seed
  const handleReplaceTask = (position: number) => {
    if (isFinished || !hasBuilt) return;
    setActivePosition(position);
    const entry = builtEntries.find((e) => e.position === position);
    if (!entry) return;

    let newSubSeed = (Math.floor(Math.random() * 0xffffffff) >>> 0) || 1;
    if (newSubSeed === entry.subSeed) {
      newSubSeed = ((entry.subSeed + 1) >>> 0) || 1;
    }

    const nextReplacements: Record<number, number> = {
      ...replacements,
      [position]: newSubSeed,
    };
    setReplacements(nextReplacements);

    const targetConfig: SetConfig = {
      seed: builtSeed,
      title: builtTitle,
      slots: builtSlots || slots,
      replacements: nextReplacements,
    };

    let newCode = '';
    try {
      newCode = encodeSetShort(targetConfig);
    } catch {
      newCode = builtCode;
    }

    const result = buildSet(targetConfig);
    setBuiltEntries(result.entries);
    setBuiltCode(newCode);

    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[position];
      return next;
    });
    setPanelStates((prev) => {
      const next = { ...prev };
      delete next[position];
      return next;
    });

    setBuildNonce((prev) => prev + 1);
  };

  // Completion & finish flow
  const unansweredCount = useMemo(() => {
    return builtEntries.filter((entry) => {
      const ans = (userAnswers[entry.position] || '').trim();
      if (entry.taskId === 14) {
        const parts = ans.split('|');
        const a1 = (parts[0] || '').trim();
        const a2 = (parts[1] || '').trim();
        return !a1 || !a2;
      }
      return !ans;
    }).length;
  }, [builtEntries, userAnswers]);

  const summaryStats = useMemo(() => {
    if (!isFinished) {
      return {
        totalScore: 0,
        totalMaxScore: 0,
        answeredCount: 0,
        breakdown: [],
      };
    }

    let totalScore = 0;
    let totalMaxScore = 0;
    let answeredCount = 0;

    const breakdown = builtEntries.map((entry) => {
      const ans = userAnswers[entry.position] || '';
      const hasAnswer = Boolean(ans.trim());
      if (hasAnswer) {
        answeredCount += 1;
      }

      const res = scorePosition(entry.taskId, entry.taskData, ans);
      const score = res?.score ?? 0;
      const maxScore = res?.maxScore ?? (getTaskById(entry.taskId)?.maxPoints ?? 1);

      totalScore += score;
      totalMaxScore += maxScore;

      let statusLabel: 'верно' | 'неверно' | 'частично' | 'без ответа' = 'без ответа';
      if (hasAnswer) {
        if (score === maxScore && maxScore > 0) {
          statusLabel = 'верно';
        } else if (score > 0) {
          statusLabel = 'частично';
        } else {
          statusLabel = 'неверно';
        }
      }

      return {
        position: entry.position,
        taskId: entry.taskId,
        score,
        maxScore,
        statusLabel,
      };
    });

    return {
      totalScore,
      totalMaxScore,
      answeredCount,
      breakdown,
    };
  }, [isFinished, builtEntries, userAnswers]);

  const confirmFinish = () => {
    const newPanelStates: Record<number, TaskPanelCheckState> = {};
    for (const entry of builtEntries) {
      const ans = userAnswers[entry.position] || '';
      const score = scorePosition(entry.taskId, entry.taskData, ans);
      newPanelStates[entry.position] = {
        submitted: true,
        showSolution: false,
        result: score,
      };
    }
    setPanelStates(newPanelStates);
    setIsFinished(true);
    setShowConfirmModal(false);
  };

  const handleFinishClick = () => {
    if (!hasBuilt || isFinished) return;
    if (unansweredCount > 0) {
      setShowConfirmModal(true);
    } else {
      confirmFinish();
    }
  };

  // Download ZIP Archive
  const handleDownloadZip = async () => {
    if (!hasBuilt || builtEntries.length === 0) return;
    setIsExportingZip(true);
    setZipMissing([]);
    try {
      let entriesToExport = builtEntries;
      if (isConfigDirty) {
        const result = buildSet(currentConfig);
        entriesToExport = result.entries;
        setBuiltEntries(result.entries);
        setBuiltCode(currentShortCode);
      }
      const { blob, missing } = await buildSetZipBlob(entriesToExport, currentConfig, {
        includeNotepad,
      });
      const currentFileCode = fileCode(currentConfig);
      const rawTitleForZip = (hasBuilt ? builtTitle : title).trim();
      const safeTitle = (rawTitleForZip || 'Набор заданий').replace(/[/\\:*?"<>|]/g, '_').trim() || 'Набор заданий';
      const filename = `${safeTitle}_${currentFileCode}.zip`;
      saveBlob(blob, filename);
      track('set_downloaded', { tasks_count: entriesToExport.length });
      if (missing && missing.length > 0) {
        setZipMissing(missing);
      }
    } catch (err) {
      console.error('Failed to export ZIP archive', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Copy code
  const handleCopyCode = () => {
    const codeToCopy = builtCode || currentShortCode;
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  // Bulk slot adjustments across tasks
  const bulkAdjust = (
    field: 'n1' | 'n2' | 'n3' | 'nR',
    delta: 1 | -1,
    range: 12 | 16
  ) => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.taskId > range) return slot;
        const currentVal = slot[field];
        const newVal = Math.max(0, Math.min(20, currentVal + delta));
        if (newVal === currentVal) return slot;
        return { ...slot, [field]: newVal };
      })
    );
  };

  const clearColumn = (field: 'n1' | 'n2' | 'n3' | 'nR') => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot[field] === 0) return slot;
        return { ...slot, [field]: 0 };
      })
    );
  };

  const clearAllSlots = () => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.n1 === 0 && slot.n2 === 0 && slot.n3 === 0 && slot.nR === 0) return slot;
        return { ...slot, n1: 0, n2: 0, n3: 0, nR: 0 };
      })
    );
  };

  return (
    <div>
      <div className="space-y-8 animate-in fade-in duration-300 no-print">
        {/* BUILDER CONFIGURATION PANEL */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-theme-text flex items-center space-x-2">
                <span>Настройка набора тренировочных заданий</span>
              </h2>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Соберите свой набор: задайте количество заданий каждого уровня сложности
              </p>
            </div>
          </div>
        </div>

        {/* Top input parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="set-title-input" className="text-[11px] font-bold text-theme-text-muted uppercase tracking-wider block">
              НАЗВАНИЕ (НЕОБЯЗАТЕЛЬНО)
            </label>
            <input
              id="set-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Набор заданий"
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-3.5 py-2 text-xs font-medium text-theme-text placeholder:text-theme-text-muted/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Load from Code Input & Load */}
          <div className="space-y-1.5">
            <label htmlFor="set-input-code" className="text-[11px] font-bold text-theme-text-muted uppercase tracking-wider block">
              ЗАГРУЗИТЬ ПО КОДУ
            </label>
            <div className="flex items-center space-x-1.5">
              <input
                id="set-input-code"
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setCodeError(null);
                }}
                placeholder="Вставьте код набора..."
                aria-label="Поле ввода кода набора для загрузки"
                className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-[11px] font-mono text-theme-text placeholder:text-theme-text-muted/60 focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
              />
              <button
                type="button"
                onClick={handleLoadFromCode}
                title="Загрузить из кода"
                aria-label="Загрузить из кода"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Загрузить
              </button>
            </div>
            <p className="text-[10px] text-theme-text-muted mt-0.5">
              Восстановит ранее сохранённый набор
            </p>
          </div>
        </div>

        {/* Code Error Warning if any */}
        {codeError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-xs text-rose-800 dark:text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{codeError}</span>
          </div>
        )}

        {/* 16 TASKS TABLE */}
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-theme-border bg-theme-card">
            <table className="w-full table-fixed min-w-[720px] border-collapse text-xs">
              <colgroup>
                <col className="w-[5%]" style={{ width: '5%' }} />
                <col className="w-[34%]" style={{ width: '34%' }} />
                <col className="w-[13%]" style={{ width: '13%' }} />
                <col className="w-[13%]" style={{ width: '13%' }} />
                <col className="w-[13%]" style={{ width: '13%' }} />
                <col className="w-[13%]" style={{ width: '13%' }} />
                <col className="w-[9%]" style={{ width: '9%' }} />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-theme-card text-theme-text-muted font-bold text-[11px] shadow-xs">
                <tr className="border-b border-theme-border/60">
                  <th className="py-3 px-3 text-left font-bold uppercase tracking-wider text-[11px] text-theme-text-muted">
                    №
                  </th>
                  <th className="py-3 px-3 text-left font-bold uppercase tracking-wider text-[11px] text-theme-text-muted">
                    ЗАДАНИЕ
                  </th>
                  <th colSpan={4} className="py-3 px-2 text-center font-bold uppercase tracking-wider text-[11px] text-theme-text-muted border-l border-theme-border/60">
                    КОЛИЧЕСТВО ПО УРОВНЯМ
                  </th>
                  <th className="py-3 px-3 text-center font-bold uppercase tracking-wider text-[11px] text-theme-text-muted border-l border-theme-border/60">
                    ВСЕГО
                  </th>
                </tr>
                <tr className="border-b-2 border-theme-border text-theme-text-muted">
                  <th className="py-2.5 px-3"></th>
                  <th className="py-2.5 px-3"></th>
                  <th className="py-2.5 px-2 text-center border-l border-theme-border/60">
                    <div className="h-6 flex items-center justify-center gap-2 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap ${LEVEL_STYLES[1].badge}`}>
                        <span className="font-bold">L1</span>
                        <span>Легче ОГЭ</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => clearColumn('n1')}
                        aria-label="L1: очистить колонку"
                        title="L1: очистить колонку"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                  <th className="py-2.5 px-2 text-center border-l border-theme-border/60">
                    <div className="h-6 flex items-center justify-center gap-2 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap ${LEVEL_STYLES[2].badge}`}>
                        <span className="font-bold">L2</span>
                        <span>Как на ОГЭ</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => clearColumn('n2')}
                        aria-label="L2: очистить колонку"
                        title="L2: очистить колонку"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                  <th className="py-2.5 px-2 text-center border-l border-theme-border/60">
                    <div className="h-6 flex items-center justify-center gap-2 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap ${LEVEL_STYLES[3].badge}`}>
                        <span className="font-bold">L3</span>
                        <span>Сложнее ОГЭ</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => clearColumn('n3')}
                        aria-label="L3: очистить колонку"
                        title="L3: очистить колонку"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                  <th className="py-2.5 px-2 text-center border-l border-theme-border/60">
                    <div className="h-6 flex items-center justify-center gap-2 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap ${RANDOM_LEVEL_STYLE.badge}`}>
                        <Shuffle className="w-3 h-3" />
                        <span>Случайно</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => clearColumn('nR')}
                        aria-label="RND: очистить колонку"
                        title="RND: очистить колонку"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                  <th className="py-2.5 px-2 text-center border-l border-theme-border/60">
                    <div className="h-6 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={clearAllSlots}
                        aria-label="Очистить все задания"
                        title="Очистить все задания"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                </tr>

                {/* Quick Fill Row 1: Первая часть (1–12) */}
                <tr className="bg-slate-50/75 dark:bg-slate-900/40 border-b border-theme-border/60">
                  <td className="py-3 px-3"></td>
                  <td className="py-3 pr-4 pl-3 text-right font-medium text-xs sm:text-sm text-theme-text">
                    Первая часть (1–12)
                  </td>
                  <td className="py-3 px-2 text-center border-l border-theme-border/60">
                    <div className="inline-flex items-center justify-center rounded-xl border border-theme-border/80 bg-theme-card px-2.5 py-1 shadow-2xs gap-3">
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n1', -1, 12)}
                        aria-label="L1: убрать по одному в заданиях 1–12"
                        title="L1: убрать по одному в заданиях 1–12"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n1', 1, 12)}
                        aria-label="L1: добавить по одному в задания 1–12"
                        title="L1: добавить по одному в задания 1–12"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center border-l border-theme-border/60">
                    <div className="inline-flex items-center justify-center rounded-xl border border-theme-border/80 bg-theme-card px-2.5 py-1 shadow-2xs gap-3">
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n2', -1, 12)}
                        aria-label="L2: убрать по одному в заданиях 1–12"
                        title="L2: убрать по одному в заданиях 1–12"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n2', 1, 12)}
                        aria-label="L2: добавить по одному в задания 1–12"
                        title="L2: добавить по одному в задания 1–12"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center border-l border-theme-border/60">
                    <div className="inline-flex items-center justify-center rounded-xl border border-theme-border/80 bg-theme-card px-2.5 py-1 shadow-2xs gap-3">
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n3', -1, 12)}
                        aria-label="L3: убрать по одному в заданиях 1–12"
                        title="L3: убрать по одному в заданиях 1–12"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n3', 1, 12)}
                        aria-label="L3: добавить по одному в задания 1–12"
                        title="L3: добавить по одному в задания 1–12"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center border-l border-theme-border/60">
                    <div className="inline-flex items-center justify-center rounded-xl border border-theme-border/80 bg-theme-card px-2.5 py-1 shadow-2xs gap-3">
                      <button
                        type="button"
                        onClick={() => bulkAdjust('nR', -1, 12)}
                        aria-label="RND: убрать по одному в заданиях 1–12"
                        title="RND: убрать по одному в заданиях 1–12"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-amber-600 dark:hover:text-amber-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkAdjust('nR', 1, 12)}
                        aria-label="RND: добавить по одному в задания 1–12"
                        title="RND: добавить по одному в задания 1–12"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-amber-600 dark:hover:text-amber-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center border-l border-theme-border/60"></td>
                </tr>

                {/* Quick Fill Row 2: Весь вариант (1–16) */}
                <tr className="bg-slate-50/75 dark:bg-slate-900/40 border-b border-theme-border/60">
                  <td className="py-3 px-3"></td>
                  <td className="py-3 pr-4 pl-3 text-right font-medium text-xs sm:text-sm text-theme-text">
                    Весь вариант (1–16)
                  </td>
                  <td className="py-3 px-2 text-center border-l border-theme-border/60">
                    <div className="inline-flex items-center justify-center rounded-xl border border-theme-border/80 bg-theme-card px-2.5 py-1 shadow-2xs gap-3">
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n1', -1, 16)}
                        aria-label="L1: убрать по одному в заданиях 1–16"
                        title="L1: убрать по одному в заданиях 1–16"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n1', 1, 16)}
                        aria-label="L1: добавить по одному в задания 1–16"
                        title="L1: добавить по одному в задания 1–16"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center border-l border-theme-border/60">
                    <div className="inline-flex items-center justify-center rounded-xl border border-theme-border/80 bg-theme-card px-2.5 py-1 shadow-2xs gap-3">
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n2', -1, 16)}
                        aria-label="L2: убрать по одному в заданиях 1–16"
                        title="L2: убрать по одному в заданиях 1–16"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n2', 1, 16)}
                        aria-label="L2: добавить по одному в задания 1–16"
                        title="L2: добавить по одному в задания 1–16"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center border-l border-theme-border/60">
                    <div className="inline-flex items-center justify-center rounded-xl border border-theme-border/80 bg-theme-card px-2.5 py-1 shadow-2xs gap-3">
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n3', -1, 16)}
                        aria-label="L3: убрать по одному в заданиях 1–16"
                        title="L3: убрать по одному в заданиях 1–16"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkAdjust('n3', 1, 16)}
                        aria-label="L3: добавить по одному в задания 1–16"
                        title="L3: добавить по одному в задания 1–16"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center border-l border-theme-border/60">
                    <div className="inline-flex items-center justify-center rounded-xl border border-theme-border/80 bg-theme-card px-2.5 py-1 shadow-2xs gap-3">
                      <button
                        type="button"
                        onClick={() => bulkAdjust('nR', -1, 16)}
                        aria-label="RND: убрать по одному в заданиях 1–16"
                        title="RND: убрать по одному в заданиях 1–16"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-amber-600 dark:hover:text-amber-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkAdjust('nR', 1, 16)}
                        aria-label="RND: добавить по одному в задания 1–16"
                        title="RND: добавить по одному в задания 1–16"
                        className="w-4 h-4 flex items-center justify-center text-theme-text-muted hover:text-amber-600 dark:hover:text-amber-400 text-xs font-bold leading-none cursor-pointer transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center border-l border-theme-border/60"></td>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/60">
                {slots.map((slot) => {
                  const task = getTaskById(slot.taskId);
                  const rowSum = slot.n1 + slot.n2 + slot.n3 + slot.nR;
                  const isRowEmpty = rowSum === 0;
                  const taskNumber = String(slot.taskId).padStart(2, '0');
                  const canIncrement = totalCount < 640;
                  return (
                    <tr
                      key={`slot-${slot.taskId}`}
                      className={`even:bg-theme-bg/25 transition-colors ${
                        isRowEmpty ? 'text-theme-text-muted' : 'text-theme-text'
                      }`}
                    >
                      <td className="py-3.5 px-3 font-bold text-theme-text text-xs sm:text-sm">
                        {taskNumber}
                      </td>
                      <td className="py-3.5 px-3 text-left font-semibold text-xs sm:text-sm text-theme-text leading-snug">
                        {task?.title ?? `Задание ${slot.taskId}`}
                      </td>
                      <SlotStepper
                        taskId={slot.taskId}
                        taskNumber={taskNumber}
                        field="n1"
                        value={slot.n1}
                        colorClasses={SLOT_STEPPER_COLORS.n1}
                        canIncrement={canIncrement}
                        onAdjust={handleAdjustSlot}
                        onUpdate={handleUpdateSlot}
                      />
                      <SlotStepper
                        taskId={slot.taskId}
                        taskNumber={taskNumber}
                        field="n2"
                        value={slot.n2}
                        colorClasses={SLOT_STEPPER_COLORS.n2}
                        canIncrement={canIncrement}
                        onAdjust={handleAdjustSlot}
                        onUpdate={handleUpdateSlot}
                      />
                      <SlotStepper
                        taskId={slot.taskId}
                        taskNumber={taskNumber}
                        field="n3"
                        value={slot.n3}
                        colorClasses={SLOT_STEPPER_COLORS.n3}
                        canIncrement={canIncrement}
                        onAdjust={handleAdjustSlot}
                        onUpdate={handleUpdateSlot}
                      />
                      <SlotStepper
                        taskId={slot.taskId}
                        taskNumber={taskNumber}
                        field="nR"
                        value={slot.nR}
                        colorClasses={SLOT_STEPPER_COLORS.nR}
                        canIncrement={canIncrement}
                        onAdjust={handleAdjustSlot}
                        onUpdate={handleUpdateSlot}
                      />
                      <td className="py-3.5 px-3 text-center text-xs sm:text-sm border-l border-theme-border/60">
                        <span className={rowSum > 0 ? 'font-bold text-theme-text' : 'text-theme-text-muted'}>
                          {rowSum}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-theme-border bg-theme-card/70 font-semibold text-xs text-theme-text">
                <tr>
                  <td colSpan={2} className="py-3 px-3">
                    <span className="text-theme-text-muted">Активных номеров: </span>
                    <strong className="font-bold text-theme-text">{activeTasksCount}</strong>
                    <span className="text-theme-text-muted text-[11px] ml-1">из 16</span>
                  </td>
                  <td colSpan={4} className="py-3 px-2 text-right text-theme-text-muted">
                    Всего заданий:
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-blue-600 dark:text-blue-400 text-sm border-l border-theme-border/60">
                    {totalCount}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* BOTTOM TOTALS & ACTION CONTROLS */}
        <div className="pt-4 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-theme-bg border border-theme-border px-3 py-1.5 rounded-xl font-medium text-theme-text">
              Всего заданий: <strong className="font-bold text-blue-600">{totalCount}</strong>
            </div>
            <div className="bg-theme-bg border border-theme-border px-3 py-1.5 rounded-xl font-medium text-theme-text">
              Макс. балл: <strong className="font-bold text-indigo-600">{totalMaxPoints}</strong>
            </div>
            {totalCount >= 160 && (
              <span className="text-[11px] text-amber-500/90 font-medium">
                {totalCount} заданий — сборка архива займёт ~{Math.ceil(totalCount * 0.035)} сек
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Download Archive & Notepad option */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadZip}
                disabled={!hasBuilt || builtEntries.length === 0 || isExportingZip}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center space-x-1.5 transition-all ${
                  hasBuilt && builtEntries.length > 0 && !isExportingZip
                    ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 cursor-pointer shadow-xs'
                    : 'bg-theme-bg/50 text-theme-text-muted border-theme-border/50 cursor-not-allowed opacity-60'
                }`}
                title={hasBuilt ? 'Скачать архив набора' : 'Сначала соберите набор'}
              >
                {isExportingZip ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Сборка архива...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Скачать архив</span>
                  </>
                )}
              </button>
              <label className="flex items-center space-x-1.5 text-xs text-theme-text cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeNotepad}
                  onChange={(e) => setIncludeNotepad(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-medium">Добавить блокнот для ответов</span>
              </label>
            </div>

            {/* Build Button */}
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={handleBuild}
                disabled={totalCount === 0 || totalCount > 640}
                className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-2 transition-all ${
                  totalCount === 0 || totalCount > 640
                    ? 'bg-gray-400 dark:bg-gray-600 opacity-50 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 cursor-pointer'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>Собрать набор</span>
              </button>
              {totalCount > 640 && (
                <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">
                  Слишком много: {totalCount} из 640 максимум
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DIRTY CONFIG WARNING BANNER */}
      {isConfigDirty && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-semibold text-amber-950 dark:text-amber-100">
                Конфигурация набора изменилась: распечатанные или экспортированные материалы больше не соответствуют.
              </span>
              <div className="text-[11px] text-amber-800 dark:text-amber-300">
                Код собранного набора: <span className="font-mono font-bold select-all break-all">{builtCode}</span> (текущий код: <span className="font-mono font-bold select-all break-all">{currentShortCode}</span>). Соберите набор заново перед печатью или экспортом.
              </div>
            </div>
          </div>
          <button
            onClick={handleBuild}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs shrink-0 flex items-center space-x-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Пересобрать</span>
          </button>
        </div>
      )}

      {/* MISSING ATTACHMENTS BANNER IF ANY */}
      {zipMissing.length > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2 shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Не удалось включить некоторые вложения в архив:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-900 dark:text-amber-300 pl-1 font-mono">
            {zipMissing.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* STICKY TOP BANNER (HIDDEN WHEN FINISHED) */}
      {hasBuilt && !isFinished && (
        <SessionBanner
          timerMode="stopwatch"
          seconds={elapsedSeconds}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused((prev) => !prev)}
          onFinish={handleFinishClick}
          finishLabel="Завершить"
        />
      )}

      {/* TEACHER BLOCK (COLLAPSIBLE, NOT STICKY) */}
      {hasBuilt && builtEntries.length > 0 && (
        <div>
          <div className={`w-fit flex items-center h-14 ${!isFinished ? 'sm:!-mt-[5.5rem]' : ''}`}>
            <button
              type="button"
              onClick={() => setShowTeacherBlock((prev) => !prev)}
              aria-expanded={showTeacherBlock}
              className="px-3 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer bg-theme-bg border border-theme-border text-theme-text hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <span>Для учителя</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showTeacherBlock ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {showTeacherBlock && (
            <div className="mt-4">
              <SetCheckerBlock
                entries={builtEntries}
                currentSetCode={currentShortCode}
                fileCodeLabel={currentFileCode}
              />
            </div>
          )}
        </div>
      )}

      {/* ASSEMBLED TASKS LIST */}
      {hasBuilt && (
        <div className="space-y-6">
          {/* HEADER ABOVE TASK TABLE / LIST: SET TITLE, BADGES, CODE, COPY, DOWNLOAD ARCHIVE, PRINT/PDF */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-xs font-bold text-theme-text uppercase tracking-wider">
                  {builtTitle || effectiveTitle}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  {builtEntries.length} {plural(builtEntries.length, 'задание', 'задания', 'заданий')}
                </span>
                {isFinished && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                    Завершён
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap gap-2">
                <div className="bg-theme-bg border border-theme-border font-mono text-xs px-3 py-2 rounded-xl text-blue-600 dark:text-blue-400 font-bold max-w-xs break-all">
                  {builtCode}
                </div>

                <button
                  onClick={handleCopyCode}
                  className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                    codeCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-theme-bg border border-theme-border text-theme-text hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                  title="Копировать код набора"
                >
                  {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{codeCopied ? 'Скопировано!' : 'Копировать'}</span>
                </button>

                <button
                  onClick={handleDownloadZip}
                  disabled={!hasBuilt || builtEntries.length === 0 || isExportingZip}
                  className="px-3 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer bg-theme-bg border border-theme-border text-theme-text hover:bg-blue-50 dark:hover:bg-blue-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Скачать архив набора"
                >
                  {isExportingZip ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span>Сборка архива...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>Скачать архив</span>
                    </>
                  )}
                </button>

                {/* Print / PDF dropdown */}
                <div className="relative" ref={printMenuRef}>
                  <button
                    onClick={() => {
                      const next = !showPrintMenu;
                      setShowPrintMenu(next);
                      if (next) {
                        track('print_opened', { mode: 'set' });
                      }
                    }}
                    disabled={!hasBuilt || builtEntries.length === 0}
                    className="px-3 py-2 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer bg-theme-bg border border-theme-border text-theme-text hover:bg-blue-50 dark:hover:bg-blue-950/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Печать / Экспорт набора в PDF"
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
                          <span>Параметры печати набора</span>
                        </span>
                        <button
                          onClick={() => setShowPrintMenu(false)}
                          className="text-theme-text-muted hover:text-theme-text text-xs p-1"
                        >
                          &times;
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-theme-text-muted uppercase tracking-wider block">
                          Ответы к заданиям:
                        </label>
                        <div className="space-y-1.5 text-xs text-theme-text">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="set-print-answers"
                              checked={printAnswers === 'none'}
                              onChange={() => setPrintAnswers('none')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Без ответов (для ученика)</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="set-print-answers"
                              checked={printAnswers === 'inline'}
                              onChange={() => setPrintAnswers('inline')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Ответы у номеров заданий</span>
                          </label>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="set-print-answers"
                              checked={printAnswers === 'keys'}
                              onChange={() => setPrintAnswers('keys')}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Ключи в конце набора</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-theme-border">
                        <label className="flex items-center space-x-2 text-xs text-theme-text cursor-pointer">
                          <input
                            type="checkbox"
                            checked={printSolutions}
                            onChange={(e) => setPrintSolutions(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-semibold">С подробным разбором</span>
                        </label>
                      </div>

                      {isConfigDirty && (
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center space-x-2 text-[11px] text-amber-900 dark:text-amber-200">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>Параметры набора были изменены. Соберите набор заново перед печатью.</span>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (isConfigDirty) return;
                          setShowPrintMenu(false);
                          setTimeout(() => {
                            printDocument();
                          }, 60);
                        }}
                        className={`w-full py-2.5 px-4 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                          isConfigDirty ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <Printer className="h-4 w-4" />
                        <span>{isConfigDirty ? 'Сначала пересоберите набор' : 'Распечатать / Сохранить в PDF'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Checkbox: Скрыть проверку до завершения */}
            <div className="mt-3 pt-3 border-t border-theme-border/60 flex items-center justify-between flex-wrap gap-2">
              <label className="flex items-center space-x-2 text-xs font-semibold text-theme-text cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!allowStudentCheck}
                  onChange={(e) => setAllowStudentCheck(!e.target.checked)}
                  disabled={isFinished}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                />
                <span>Скрыть проверку до завершения</span>
              </label>
            </div>
          </div>

          {/* SUMMARY BLOCK AFTER FINISH (ABOVE POSITIONS LIST) */}
          {isFinished && (
            <div
              id="set-summary-block"
              className="bg-theme-card border border-theme-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-theme-text flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Итоговая сводка набора</span>
                  </h3>
                  <p className="text-xs text-theme-text-muted mt-0.5">
                    Выполнение завершено. Результаты зафиксированы.
                  </p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
                    {summaryStats.totalScore} из {summaryStats.totalMaxScore} баллов
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-theme-bg border border-theme-border text-xs text-theme-text font-mono">
                    Время: <strong className="text-theme-text">{formatBannerTime(elapsedSeconds)}</strong>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-theme-bg border border-theme-border text-xs font-medium text-theme-text">
                    Отвечено {summaryStats.answeredCount} из {builtEntries.length}
                  </div>
                </div>
              </div>

              {/* Разбивка по позициям */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-theme-text uppercase tracking-wider">
                  Разбивка по позициям
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {summaryStats.breakdown.map((item) => {
                    let statusBadgeClass = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700';
                    if (item.statusLabel === 'верно') {
                      statusBadgeClass = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
                    } else if (item.statusLabel === 'частично') {
                      statusBadgeClass = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
                    } else if (item.statusLabel === 'неверно') {
                      statusBadgeClass = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
                    }

                    return (
                      <div
                        key={item.position}
                        className="p-3 rounded-xl border border-theme-border bg-theme-bg/60 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold text-theme-text truncate">
                            Позиция {item.position} <span className="font-normal text-theme-text-muted">(Задание {item.taskId})</span>
                          </div>
                          <div className="text-theme-text-muted text-[11px]">
                            балл {item.score} из {item.maxScore}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${statusBadgeClass}`}>
                          {item.statusLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {builtEntries.map((entry) => (
              <div
                key={`${builtCode}-${entry.id}-${isFinished ? 'finished' : 'active'}-${buildNonce}`}
                id={`task-entry-wrapper-${entry.position}`}
                className="relative group/card"
                onClick={() => setActivePosition(entry.position)}
                onFocus={() => setActivePosition(entry.position)}
              >
                {!isFinished && (
                  <div className="absolute top-4 sm:top-5 right-4 sm:right-6 z-10">
                    <button
                      type="button"
                      id={`btn-replace-task-${entry.position}`}
                      onClick={() => handleReplaceTask(entry.position)}
                      title="Заменить задание на этой позиции"
                      aria-label={`Заменить задание на позиции ${entry.position}`}
                      className="px-2.5 py-1 text-xs font-semibold text-theme-text-muted hover:text-blue-600 dark:hover:text-blue-400 bg-theme-card/90 hover:bg-theme-card border border-theme-border/80 hover:border-blue-400/60 dark:hover:border-blue-500/60 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover/card:rotate-45" />
                      <span>Заменить</span>
                    </button>
                  </div>
                )}
                <TaskAnswerPanel
                  position={entry.position}
                  taskId={entry.taskId}
                  difficulty={entry.difficulty}
                  taskData={entry.taskData}
                  userAnswer={userAnswers[entry.position] || ''}
                  onAnswerChange={(val: string) => {
                    setActivePosition(entry.position);
                    if (isFinished) return;
                    setUserAnswers((prev) => ({
                      ...prev,
                      [entry.position]: val,
                    }));
                  }}
                  mode={isFinished || allowStudentCheck ? 'check' : 'save'}
                  initialSubmitted={isFinished ? true : panelStates[entry.position]?.submitted}
                  initialShowSolution={panelStates[entry.position]?.showSolution ?? false}
                  initialResult={
                    isFinished
                      ? scorePosition(entry.taskId, entry.taskData, userAnswers[entry.position] || '')
                      : (panelStates[entry.position]?.result ?? null)
                  }
                  onPanelStateChange={handlePanelStateChange}
                />
              </div>
            ))}
          </div>

          {/* BOTTOM ACTION BUTTON */}
          {!isFinished ? (
            <div className="pt-6 pb-12 flex justify-center">
              <button
                onClick={handleFinishClick}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="h-5 w-5" />
                <span>Завершить набор</span>
              </button>
            </div>
          ) : (
            <div className="pt-6 pb-12 flex justify-center">
              <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Набор завершён. Время выполнения зафиксировано.</span>
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
              <h3 className="text-base font-bold text-theme-text">Завершить набор?</h3>
            </div>

            <p className="text-xs text-theme-text-muted leading-relaxed">
              Остались незаполненные позиции ({unansweredCount} из {builtEntries.length}). Завершить?
            </p>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-theme-text-sec bg-theme-bg hover:bg-theme-border/50 border border-theme-border rounded-xl transition-all cursor-pointer"
              >
                Продолжить решение
              </button>
              <button
                onClick={confirmFinish}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/20"
              >
                Всё равно завершить
              </button>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* PRINT-ONLY DOCUMENT */}
      {hasBuilt && builtEntries.length > 0 && (
        <div className="print-only">
          <PrintDocument
            tasks={builtEntries.map((e) => ({
              taskId: e.taskId,
              difficulty: e.difficulty,
              taskData: e.taskData,
              seed: e.subSeed,
            }))}
            options={{
              answers: printAnswers,
              solutions: printSolutions,
              title: builtTitle || effectiveTitle,
              code: builtCode || currentShortCode || builtSeed,
              seed: builtSeed,
            }}
          />
        </div>
      )}
    </div>
  );
}

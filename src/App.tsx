import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
import { TaskBadge } from './components/TaskBadge';
import { parseUserAnswer16 } from './tasks/task16';
import { buildBugReportText } from './utils/bugReport';

export default function App() {
  // Mode state: 'single' (Task Trainer) vs 'variant' (Variant Mode) vs 'set' (Set Builder)
  const [activeMode, setActiveMode] = useState<AppMode>('single');
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
  const [copiedTarget, setCopiedTarget] = useState<'email' | null>(null);
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
    setCopiedTarget(null);
    setClipboardFailed(false);
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
      } else {
        setReportCopiedOnce(true);
        setClipboardFailed(true);
      }
    } catch {
      setReportCopiedOnce(true);
      setClipboardFailed(true);
    }
  };

  const handleCopyEmail = async () => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText('АДРЕС');
        setCopiedTarget('email');
      } else {
        setCopiedTarget('email');
      }
    } catch {
      setCopiedTarget('email');
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

  return (
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
        </div>

        {activeMode === 'variant' ? (
          <VariantView onVariantInfoChange={setVariantInfo} />
        ) : activeMode === 'set' ? (
          <SetBuilderView onSetInfoChange={setSetInfo} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* SIDEBAR FOR OGE TASKS (COLLAPSIBLE ON MOBILE) */}
          <aside className="hidden lg:block lg:col-span-4 bg-theme-card border border-theme-border rounded-2xl shadow-sm overflow-hidden sticky top-20">
            <div className="p-4 border-b border-theme-border/80 bg-theme-bg flex items-center justify-between">
              <span className="flex items-center space-x-2 font-bold text-theme-text-sec text-xs tracking-wider uppercase">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span>Задания экзамена</span>
              </span>
              <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-md font-mono font-bold text-slate-600">
                1–16
              </span>
            </div>

            {/* Tasks list */}
            <nav className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[calc(100vh-140px)] lg:max-h-[calc(100vh-156px)] overflow-y-auto overflow-x-hidden sidebar-scroll">
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
          <main className="lg:col-span-8 space-y-6 min-w-0">
            
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
                          isCorrect: currentIsCorrect
                        }
                      )}
                    </div>

                    {/* ACTION FOOTER BAR */}
                    <div className="pt-4 border-t border-theme-border/50 flex flex-wrap items-center justify-between gap-4">
                      
                      {/* Left: Hint status toggler */}
                      {!isSubmitted ? (
                        <button
                          onClick={() => setShowHints(!showHints)}
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
                              disabled={
                                taskInstance?.taskId === 16
                                  ? !parseUserAnswer16(userAnswer).code.trim()
                                  : !userAnswer.trim()
                              }
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
          <span>Инфоген · генератор заданий и вариантов ОГЭ по информатике</span>
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
                              <span>SubSeed:</span>
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
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="text-xs text-theme-text-muted hover:text-theme-text inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      <span>АДРЕС</span>
                    </button>
                    {copiedTarget === 'email' && (
                      <span className="text-xs text-theme-text-muted">Адрес скопирован</span>
                    )}
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

                  <div className="text-xs text-theme-text-muted text-center flex items-center justify-center flex-wrap gap-1.5 pt-1">
                    <span>Отправить на</span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="text-xs text-theme-text-muted hover:text-theme-text inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Copy className="h-3 w-3" />
                      <span>АДРЕС</span>
                    </button>
                    {copiedTarget === 'email' && (
                      <span className="text-xs text-theme-text-muted">Адрес скопирован</span>
                    )}
                  </div>
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

    </div>
  );
}

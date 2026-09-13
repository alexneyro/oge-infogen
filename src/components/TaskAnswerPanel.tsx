import React, { useState, useEffect, useRef } from 'react';
import { Difficulty, DIFFICULTY_LABELS } from '../types';
import { getTaskById } from '../tasks';
import { scorePosition, PositionScore } from '../utils/scoring';
import { runTests16, parseUserAnswer16, encodeUserAnswer16 } from '../tasks/task16';
import {
  Check,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  BookOpen,
  Loader2,
} from 'lucide-react';

export interface TaskPanelCheckState {
  submitted: boolean;
  showSolution: boolean;
  result: PositionScore | null;
}

export interface TaskAnswerPanelProps {
  position: number;
  taskId: number;
  difficulty: Difficulty;
  taskData: unknown;
  userAnswer: string;
  onAnswerChange: (val: string) => void;
  mode: 'check' | 'save';
  onScoreUpdate?: (position: number, result: PositionScore | null) => void;
  initialSubmitted?: boolean;
  initialShowSolution?: boolean;
  initialResult?: PositionScore | null;
  onPanelStateChange?: (position: number, state: TaskPanelCheckState) => void;
}

/**
 * Переключает флаг самопроверки круговой диаграммы задания 14 (3-й сегмент: ans1|ans2|flag).
 * - "5|7" -> "5|7|1"
 * - "5|7|1" -> "5|7|0" (повторный клик возвращает '0')
 * - "5|7|0|1" -> "5|7|1" (нормализация сегментов до ровно 3)
 * - "" или пробелы -> "" (пустой ответ не превращается в искусственный "||1")
 */
export function toggleChartFlag14(userAnswer: string): string {
  if (!userAnswer || !userAnswer.trim()) {
    return '';
  }
  const parts = userAnswer.split('|');
  const u1 = parts[0] ?? '';
  const u2 = parts[1] ?? '';
  const currentFlag = parts[2] ?? '0';
  const newFlag = currentFlag === '1' ? '0' : '1';
  return `${u1}|${u2}|${newFlag}`;
}

export const TaskAnswerPanel: React.FC<TaskAnswerPanelProps> = ({
  position,
  taskId,
  difficulty,
  taskData,
  userAnswer,
  onAnswerChange,
  mode,
  onScoreUpdate,
  initialSubmitted = false,
  initialShowSolution = false,
  initialResult = null,
  onPanelStateChange,
}) => {
  const [submitted, setSubmitted] = useState<boolean>(initialSubmitted);
  const [showSolution, setShowSolution] = useState<boolean>(initialShowSolution);
  const [result, setResult] = useState<PositionScore | null>(initialResult);
  const [isChecking16, setIsChecking16] = useState<boolean>(false);
  const [check16FailedRan, setCheck16FailedRan] = useState<string | null>(null);
  const [lastCheckedAnswer, setLastCheckedAnswer] = useState<string | null>(
    initialSubmitted ? userAnswer : null
  );

  const onPanelStateChangeRef = useRef(onPanelStateChange);
  useEffect(() => {
    onPanelStateChangeRef.current = onPanelStateChange;
  });

  const prevStateRef = useRef<TaskPanelCheckState>({
    submitted,
    showSolution,
    result,
  });

  useEffect(() => {
    const prev = prevStateRef.current;
    if (
      prev.submitted !== submitted ||
      prev.showSolution !== showSolution ||
      prev.result !== result
    ) {
      prevStateRef.current = { submitted, showSolution, result };
      onPanelStateChangeRef.current?.(position, { submitted, showSolution, result });
    }
  }, [position, submitted, showSolution, result]);

  // Флаг самопроверки диаграммы для задания 14 (третий сегмент ans1|ans2|flag)
  const getFlag14 = (): string => {
    if (taskId !== 14 || !userAnswer) return '0';
    const parts = userAnswer.split('|');
    return parts[2] ?? '0';
  };

  const handleToggleChart14 = () => {
    if (!userAnswer || !userAnswer.trim()) {
      return;
    }
    const newAnswer = toggleChartFlag14(userAnswer);

    // Единственное исключение из логики сброса:
    // самопроверка диаграммы в задании 14 обновляет lastCheckedAnswer синхронно
    // с новым ответом. Благодаря этому эффект сброса состояния не срабатывает
    // (userAnswer === lastCheckedAnswer), submitted остаётся true, showSolution
    // не меняется, кнопка не возвращается в «Проверить», а результат сразу пересчитывается.
    setLastCheckedAnswer(newAnswer);
    onAnswerChange(newAnswer);
    const newScore = scorePosition(taskId, taskData, newAnswer);
    setResult(newScore);
    onScoreUpdate?.(position, newScore);
  };

  const taskMod = getTaskById(taskId);
  if (!taskMod) {
    return (
      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-700">
        Задание №{taskId} не найдено в реестре
      </div>
    );
  }

  // Reset state when the user changes their answer after a check
  useEffect(() => {
    if (mode === 'check' && submitted && lastCheckedAnswer !== null && userAnswer !== lastCheckedAnswer) {
      setSubmitted(false);
      setResult(null);
      setShowSolution(false);
      setCheck16FailedRan(null);
      setLastCheckedAnswer(null);
      onScoreUpdate?.(position, null);
    }
  }, [userAnswer, lastCheckedAnswer, submitted, mode, position, onScoreUpdate]);

  const handleCheck = async () => {
    if (taskId === 16) {
      setIsChecking16(true);
      setCheck16FailedRan(null);
      try {
        const parsed = parseUserAnswer16(userAnswer);
        const langKey = (parsed.lang || 'python').toLowerCase() as 'python' | 'pascal' | 'cpp';
        const testRes = await runTests16(taskData, parsed.code, langKey);

        if (!testRes.ran) {
          setLastCheckedAnswer(userAnswer);
          setSubmitted(true);
          setCheck16FailedRan(testRes.details[0] || 'проверить автоматически не удалось');
          const scoreRes: PositionScore = {
            passed: false,
            score: 0,
            maxScore: 2,
            details: testRes.details,
          };
          setResult(scoreRes);
          onScoreUpdate?.(position, scoreRes);
        } else {
          const updatedAnswer = encodeUserAnswer16(
            testRes.score,
            testRes.maxScore,
            'auto',
            langKey,
            parsed.code
          );
          onAnswerChange(updatedAnswer);
          setLastCheckedAnswer(updatedAnswer);
          setSubmitted(true);
          const scoreRes: PositionScore = {
            passed: testRes.score === testRes.maxScore && testRes.maxScore > 0,
            score: testRes.score,
            maxScore: testRes.maxScore,
            details: testRes.details,
          };
          setResult(scoreRes);
          onScoreUpdate?.(position, scoreRes);
        }
      } catch {
        setLastCheckedAnswer(userAnswer);
        setSubmitted(true);
        setCheck16FailedRan('не удалось загрузить среду Python');
        const scoreRes: PositionScore = {
          passed: false,
          score: 0,
          maxScore: 2,
          details: ['не удалось загрузить среду Python'],
        };
        setResult(scoreRes);
        onScoreUpdate?.(position, scoreRes);
      } finally {
        setIsChecking16(false);
      }
      return;
    }

    setLastCheckedAnswer(userAnswer);
    setSubmitted(true);
    const scoreRes = scorePosition(taskId, taskData, userAnswer);
    setResult(scoreRes);
    onScoreUpdate?.(position, scoreRes);
  };

  const handleSave = () => {
    setSubmitted(true);
  };

  const isAnswerEmpty = taskId === 16
    ? !parseUserAnswer16(userAnswer).code.trim()
    : !userAnswer.trim();

  return (
    <div
      id={`set-entry-${position}`}
      className={`bg-theme-card border rounded-2xl p-6 shadow-sm space-y-4 transition-colors ${
        submitted && mode === 'check' && result
          ? result.passed
            ? 'border-emerald-300 dark:border-emerald-800'
            : result.score > 0
            ? 'border-amber-300 dark:border-amber-800'
            : 'border-rose-300 dark:border-rose-800'
          : 'border-theme-border'
      }`}
    >
      {/* TASK HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-theme-border">
        <div className="flex items-center space-x-3">
          <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            {position}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-theme-text">
                Задание {taskId}
              </span>
              <span
                className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded font-bold ${
                  difficulty === 1
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : difficulty === 2
                    ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300'
                    : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                }`}
              >
                {`L${difficulty} ${DIFFICULTY_LABELS[difficulty]}`}
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-theme-text mt-1">
              {taskMod.title}
            </h4>
          </div>
        </div>
      </div>

      {/* TASK MODULE CONTENT (RENDERED EXACTLY ONCE) */}
      <div className="py-2 text-theme-text">
        <fieldset
          disabled={taskId >= 13 ? (submitted && !showSolution) : submitted}
          className="contents border-0 p-0 m-0"
        >
          {taskId === 13 ? (
            <div
              className={submitted ? '[&_.border-dashed]:pointer-events-none [&_.border-dashed]:select-none' : undefined}
              onPasteCapture={(e) => {
                if (submitted) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onKeyDownCapture={(e) => {
                if (submitted && ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V'))) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onDropCapture={(e) => {
                if (submitted) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClickCapture={(e) => {
                if (submitted) {
                  const target = e.target as HTMLElement;
                  if (target.closest('button')?.textContent?.trim() === 'Очистить') {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }
              }}
            >
              {taskMod.render(taskData, {
                userAnswer,
                setUserAnswer: submitted ? () => {} : onAnswerChange,
                isSubmitted: showSolution,
                showHints: false,
                isCorrect: result?.passed,
              })}
            </div>
          ) : taskId === 16 ? (
            <div
              onClickCapture={(e) => {
                if (submitted) {
                  const target = e.target as HTMLElement;
                  const btn = target.closest('button');
                  if (btn) {
                    const txt = (btn.textContent || '').trim();
                    // Табы эталонного решения (стр. 907-923) работают:
                    if (txt === 'Python' || txt === 'Паскаль' || txt === 'С++' || txt === 'C++') {
                      return;
                    }
                    // Кнопка «Отменить» (стр. 656, 673) работает:
                    if (txt.includes('Отменить')) {
                      return;
                    }
                    // Все остальные кнопки (прогон тестов, выбор языка решения, кнопки самооценки) блокируются:
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }
              }}
            >
              {taskMod.render(taskData, {
                userAnswer,
                setUserAnswer: submitted ? () => {} : onAnswerChange,
                isSubmitted: showSolution,
                showHints: false,
                isCorrect: result?.passed,
              })}
            </div>
          ) : (
            <div>
              {taskMod.render(taskData, {
                userAnswer,
                setUserAnswer: submitted ? () => {} : onAnswerChange,
                isSubmitted: showSolution,
                showHints: false,
                isCorrect: result?.passed,
              })}
            </div>
          )}
        </fieldset>
      </div>

      {/* ACTION CONTROLS & VERDICT FOOTER */}
      <div className="pt-3 border-t border-theme-border/60 flex flex-wrap items-center justify-end gap-3">
        {mode === 'check' ? (
          !submitted ? (
            <button
              onClick={handleCheck}
              disabled={isChecking16 || isAnswerEmpty}
              className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all ${
                isChecking16 || isAnswerEmpty
                  ? 'bg-theme-bg border border-theme-border text-theme-text-muted cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white cursor-pointer'
              }`}
            >
              {isChecking16 ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Проверяю… (загрузка среды Python может занять до 20 с)</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Проверить</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowSolution((prev) => !prev)}
              className="px-4 py-2 bg-theme-bg hover:bg-theme-border/50 text-theme-text border border-theme-border text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-600" />
              <span>{showSolution ? 'Свернуть разбор' : 'Показать разбор'}</span>
            </button>
          )
        ) : (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>{submitted ? 'Обновить сохранение' : 'Сохранить ответ'}</span>
          </button>
        )}
      </div>

      {/* VERDICT BOXES */}
      {submitted && (
        <div className="pt-2 animate-in fade-in space-y-3">
          {mode === 'check' && check16FailedRan && (
            <div className="p-3.5 rounded-xl border bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-center space-x-2.5 text-xs font-bold">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Проверить автоматически не удалось: {check16FailedRan}</span>
            </div>
          )}

          {mode === 'check' && !check16FailedRan && result !== null && (
            <div
              className={`p-3.5 rounded-xl border flex items-center space-x-2.5 text-xs font-bold ${
                result.passed
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : result.score > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
              }`}
            >
              {result.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : result.score > 0 ? (
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>
                {result.maxScore > 1
                  ? result.passed
                    ? `Верно (${result.score} из ${result.maxScore} баллов)`
                    : result.score > 0
                    ? `Частично верно (${result.score} из ${result.maxScore} баллов)`
                    : `Неверно (${result.score} из ${result.maxScore} баллов)`
                  : result.passed
                  ? 'Верно (1 балл)'
                  : 'Неверно (0 баллов)'}
              </span>
            </div>
          )}

          {mode === 'check' && taskId === 14 && (
            <div className="p-3 bg-theme-bg/60 border border-theme-border rounded-xl space-y-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-theme-text select-none">
                <input
                  type="checkbox"
                  data-selfcheck-chart="true"
                  checked={getFlag14() === '1'}
                  onChange={handleToggleChart14}
                  className="w-4 h-4 rounded border-theme-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="font-semibold">Моя диаграмма совпадает с эталонной</span>
              </label>
              <div className="text-[11px] text-theme-text-muted pl-6">
                Самопроверка. При сдаче работы балл за диаграмму выставляет учитель
              </div>
            </div>
          )}

          {mode === 'save' && (
            <div className="p-3.5 rounded-xl border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Ответ сохранён</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

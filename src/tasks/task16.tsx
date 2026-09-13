import React, { useState, useEffect, useRef } from 'react';
import { TaskModule, Difficulty } from '../types';
import { makeRng } from '../utils/rng';
import { runPythonTests, killWorker, PyTestResult } from '../utils/pyRunner';
import { compareOutput } from '../utils/answerCompare';
import { StatementBlock, StatementText, BlockLabel, DataTable, Th, Td } from '../components/task-ui';

export type ProgrammingLanguage = 'Python' | 'Паскаль' | 'С++';
export const PROGRAMMING_LANGUAGES: ProgrammingLanguage[] = ['Python', 'Паскаль', 'С++'];

function langToKey(lang: ProgrammingLanguage): string {
  switch (lang) {
    case 'Python':
      return 'python';
    case 'Паскаль':
      return 'pascal';
    case 'С++':
      return 'cpp';
  }
}

function keyToLang(key: string): ProgrammingLanguage {
  switch ((key || '').toLowerCase()) {
    case 'pascal':
      return 'Паскаль';
    case 'cpp':
      return 'С++';
    case 'alg':
    case 'basic':
    case 'python':
    default:
      return 'Python';
  }
}

export interface Task16Data {
  statement: string;
  sampleInput: string;
  sampleOutput: string;
  tests: { input: string; expected: string }[];
  solutionCode: {
    python: string;
    pascal: string;
    cpp: string;
  };
  hint: string;
  explanation: string;
  kind?: 'for' | 'while' | 'radix';
  aggregation?: 'sum' | 'count' | 'max' | 'min' | 'avg';
}

export interface ParsedAnswer16 {
  score: number;
  maxScore: number;
  passed: number;
  total: number;
  source: 'auto' | 'self';
  lang: string;
  code: string;
}

export async function runTests16(
  taskData: any,
  code: string,
  lang: 'python' | 'pascal' | 'cpp',
  opts?: { timeoutMs?: number }
): Promise<{ score: number; maxScore: number; ran: boolean; details: string[] }> {
  const normLang = (lang || '').toLowerCase();
  if (normLang !== 'python') {
    return {
      score: 0,
      maxScore: 2,
      ran: false,
      details: ['автопроверка доступна только для Python']
    };
  }

  const trimmedCode = (code || '').trim();
  if (!trimmedCode) {
    return {
      score: 0,
      maxScore: 2,
      ran: false,
      details: ['код программы не предоставлен']
    };
  }

  const tests: { input: string; expected: string }[] = taskData?.tests || [];
  if (!tests.length) {
    return {
      score: 0,
      maxScore: 2,
      ran: false,
      details: ['в задании отсутствуют тесты для проверки']
    };
  }

  const timeoutMs = opts?.timeoutMs ?? 5000;
  const details: string[] = [];

  let results: PyTestResult[];
  try {
    results = await runPythonTests(
      trimmedCode,
      tests,
      undefined,
      undefined,
      undefined,
      timeoutMs
    );
  } catch {
    return {
      score: 0,
      maxScore: 2,
      ran: false,
      details: ['не удалось загрузить среду Python']
    };
  }

  if (!results || results.length !== tests.length) {
    return {
      score: 0,
      maxScore: 2,
      ran: false,
      details: ['не удалось завершить выполнение всех тестов']
    };
  }

  let failedCount = 0;
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const res = results[i];

    if (res.timedOut) {
      failedCount++;
      details.push(`тест ${i + 1}: превышено время (возможен бесконечный цикл)`);
    } else if (res.error) {
      failedCount++;
      details.push(`тест ${i + 1}: ошибка выполнения (${res.error})`);
    } else {
      const isPass = compareOutput(test.expected, res.output);
      if (isPass) {
        details.push(`тест ${i + 1}: пройден`);
      } else {
        failedCount++;
        const received = (res.output || '').trim();
        details.push(
          `тест ${i + 1}: не пройден (ожидалось: "${test.expected}", получено: "${received || '—'}")`
        );
      }
    }
  }

  let score = 0;
  if (failedCount === 0) {
    score = 2;
  } else if (failedCount === 1) {
    score = 1;
  } else {
    score = 0;
  }

  return {
    score,
    maxScore: 2,
    ran: true,
    details
  };
}

export function parseUserAnswer16(raw: string): ParsedAnswer16 {
  if (!raw) {
    return { score: -1, maxScore: 2, passed: 0, total: 0, source: 'auto', lang: 'python', code: '' };
  }
  const codeIndex = raw.indexOf('@@CODE@@');
  if (codeIndex === -1) {
    return { score: -1, maxScore: 2, passed: 0, total: 0, source: 'auto', lang: 'python', code: raw };
  }

  const header = raw.substring(0, codeIndex);
  const code = raw.substring(codeIndex + 8);

  if (header.includes('@@SRC@@')) {
    const [scorePart, rest] = header.split('@@SRC@@');
    const [scoreStr, maxScoreStr] = (scorePart || '-1/2').split('/');
    const parsedScore = parseInt(scoreStr, 10);
    const score = isNaN(parsedScore) ? -1 : parsedScore;
    const maxScore = parseInt(maxScoreStr, 10) || 2;

    let source: 'auto' | 'self' = 'auto';
    let lang = 'python';

    if (rest) {
      const [srcStr, langStr] = rest.split('@@LANG@@');
      if (srcStr === 'self' || srcStr === 'auto') {
        source = srcStr;
      }
      if (langStr) {
        lang = langStr;
      }
    }

    return { score, maxScore, passed: 0, total: 0, source, lang, code };
  } else {
    // Old format: `${passed}/${total}`
    const [passedStr, totalStr] = header.split('/');
    const passed = parseInt(passedStr, 10) || 0;
    const total = parseInt(totalStr, 10) || 0;

    let score = -1;
    if (total > 0) {
      const failed = total - passed;
      if (failed === 0) score = 2;
      else if (failed === 1) score = 1;
      else score = 0;
    }

    return { score, maxScore: 2, passed, total, source: 'auto', lang: 'python', code };
  }
}

export function encodeUserAnswer16(
  score: number,
  maxScore: number,
  source: 'auto' | 'self',
  lang: string,
  code: string
): string {
  return `${score}/${maxScore}@@SRC@@${source}@@LANG@@${lang}@@CODE@@${code}`;
}

export interface EvaluatedTestResult extends PyTestResult {
  passed: boolean;
}

function Task16Component({
  taskData,
  state
}: {
  taskData: Task16Data;
  state: {
    userAnswer: string;
    setUserAnswer: (val: string) => void;
    isSubmitted?: boolean;
    showHints?: boolean;
    isCorrect?: boolean;
  };
}) {
  const parsed = parseUserAnswer16(state.userAnswer);

  const [selectedLang, setSelectedLang] = useState<ProgrammingLanguage>(() => keyToLang(parsed.lang));
  const [codeBuffers, setCodeBuffers] = useState<Record<ProgrammingLanguage, string>>({
    'Python': parsed.lang === 'python' ? parsed.code : '',
    'Паскаль': parsed.lang === 'pascal' ? parsed.code : '',
    'С++': parsed.lang === 'cpp' ? parsed.code : ''
  });

  const [solutionLang, setSolutionLang] = useState<'Python' | 'Паскаль' | 'С++'>('Python');

  // Execution states (Python auto-test runner)
  const [isRunningTrial, setIsRunningTrial] = useState<boolean>(false);
  const [isRunningFull, setIsRunningFull] = useState<boolean>(false);
  const [isPyodideLoading, setIsPyodideLoading] = useState<boolean>(false);
  const [loadSeconds, setLoadSeconds] = useState<number>(0);
  const [currentTestIndex, setCurrentTestIndex] = useState<number>(0);

  // Results
  const [trialResult, setTrialResult] = useState<EvaluatedTestResult | null>(null);
  const [fullResults, setFullResults] = useState<EvaluatedTestResult[]>([]);

  const [pyodideError, setPyodideError] = useState<string | null>(null);

  const abortRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasRunFullRef = useRef<boolean>(false);

  const currentCode = codeBuffers[selectedLang] || '';

  // Sync external state changes
  useEffect(() => {
    const currentParsed = parseUserAnswer16(state.userAnswer);
    const parsedLang = keyToLang(currentParsed.lang);
    setCodeBuffers((prev) => {
      if (prev[parsedLang] !== currentParsed.code && currentParsed.code) {
        return {
          ...prev,
          [parsedLang]: currentParsed.code
        };
      }
      return prev;
    });
    if (currentParsed.lang) {
      setSelectedLang(parsedLang);
    }
  }, [state.userAnswer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSelectLang = (lang: ProgrammingLanguage) => {
    if (state.isSubmitted) return;
    setSelectedLang(lang);
    const langCode = codeBuffers[lang] || '';
    const langKey = langToKey(lang);
    const isPy = lang === 'Python';
    const source = (isPy && !pyodideError) ? 'auto' : 'self';
    const initialScore = (isPy && !pyodideError) ? 0 : -1;
    state.setUserAnswer(encodeUserAnswer16(initialScore, 2, source, langKey, langCode));
  };

  const handleCodeChange = (newCode: string) => {
    setCodeBuffers((prev) => ({
      ...prev,
      [selectedLang]: newCode
    }));

    hasRunFullRef.current = false;
    setTrialResult(null);
    setFullResults([]);

    const isPy = selectedLang === 'Python';
    const source = (isPy && !pyodideError) ? 'auto' : 'self';
    const langKey = langToKey(selectedLang);

    if (!state.isSubmitted) {
      const score = (isPy && !pyodideError) ? 0 : -1;
      state.setUserAnswer(encodeUserAnswer16(score, 2, source, langKey, newCode));
    } else {
      state.setUserAnswer(encodeUserAnswer16(parsed.score, 2, parsed.source, langKey, newCode));
    }
  };

  const handleSelfScoreChange = (scoreVal: number) => {
    const langKey = langToKey(selectedLang);
    state.setUserAnswer(encodeUserAnswer16(scoreVal, 2, 'self', langKey, currentCode));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = currentCode.substring(0, start) + '    ' + currentCode.substring(end);
      handleCodeChange(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleCancelRun = () => {
    abortRef.current.cancelled = true;
    killWorker();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunningTrial(false);
    setIsRunningFull(false);
    setIsPyodideLoading(false);
    setLoadSeconds(0);
  };

  // Trial Run for Python (runs test 1)
  const handleTrialRun = async () => {
    if (!currentCode.trim() || isRunningTrial || isRunningFull || state.isSubmitted || selectedLang !== 'Python') return;

    abortRef.current = { cancelled: false };
    setIsRunningTrial(true);
    setIsPyodideLoading(true);
    setLoadSeconds(0);
    setTrialResult(null);
    setPyodideError(null);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLoadSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const runResults = await runPythonTests(
        currentCode,
        [taskData.tests[0]],
        (_currIndex, _total, statusMsg) => {
          if (statusMsg.includes('Выполняется тест')) {
            setIsPyodideLoading(false);
            if (timerRef.current) clearInterval(timerRef.current);
          }
        },
        (_testIdx, rawRes) => {
          setIsPyodideLoading(false);
          if (timerRef.current) clearInterval(timerRef.current);
          const isPass =
            !rawRes.error &&
            !rawRes.timedOut &&
            compareOutput(taskData.tests[0].expected, rawRes.output);

          setTrialResult({
            ...rawRes,
            passed: isPass
          });
        },
        () => abortRef.current.cancelled
      );

      if (!abortRef.current.cancelled && runResults.length > 0) {
        const res0 = runResults[0];
        const isPass = !res0.error && !res0.timedOut && compareOutput(taskData.tests[0].expected, res0.output);
        setTrialResult({
          ...res0,
          passed: isPass
        });
      }
    } catch (err) {
      setPyodideError(
        'Интерпретатор Python не загрузился. Оцените решение самостоятельно после отправки ответа.'
      );
      const langKey = langToKey(selectedLang);
      state.setUserAnswer(encodeUserAnswer16(-1, 2, 'self', langKey, currentCode));
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRunningTrial(false);
      setIsPyodideLoading(false);
    }
  };

  // Full Run on submission for Python
  const runFullTests = async () => {
    if (!currentCode.trim() || isRunningFull || selectedLang !== 'Python') return;

    hasRunFullRef.current = true;
    abortRef.current = { cancelled: false };
    setIsRunningFull(true);
    setIsPyodideLoading(true);
    setLoadSeconds(0);
    setCurrentTestIndex(1);
    setFullResults([]);
    setPyodideError(null);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLoadSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const runResults = await runPythonTests(
        currentCode,
        taskData.tests,
        (currIndex, _total, statusMsg) => {
          if (statusMsg.includes('Выполняется тест')) {
            setIsPyodideLoading(false);
            if (timerRef.current) clearInterval(timerRef.current);
          }
          setCurrentTestIndex(currIndex);
        },
        (testIdx, rawRes) => {
          setIsPyodideLoading(false);
          if (timerRef.current) clearInterval(timerRef.current);

          const isPass =
            !rawRes.error &&
            !rawRes.timedOut &&
            compareOutput(taskData.tests[testIdx].expected, rawRes.output);

          const evalRes: EvaluatedTestResult = {
            ...rawRes,
            passed: isPass
          };

          setFullResults((prev) => {
            const next = [...prev];
            next[testIdx] = evalRes;
            return next;
          });
        },
        () => abortRef.current.cancelled
      );

      if (!abortRef.current.cancelled) {
        const evalResults: EvaluatedTestResult[] = runResults.map((res, i) => {
          const isPass = !res.error && !res.timedOut && compareOutput(taskData.tests[i].expected, res.output);
          return {
            ...res,
            passed: isPass
          };
        });

        const passedCount = evalResults.filter((r) => r.passed).length;
        const failedCount = evalResults.length - passedCount;
        let score = 0;
        if (failedCount === 0) score = 2;
        else if (failedCount === 1) score = 1;
        else score = 0;

        setFullResults(evalResults);
        state.setUserAnswer(encodeUserAnswer16(score, 2, 'auto', 'python', currentCode));
      }
    } catch (err) {
      setPyodideError(
        'Интерпретатор Python не загрузился. Оцените решение самостоятельно после отправки ответа.'
      );
      const langKey = langToKey(selectedLang);
      state.setUserAnswer(encodeUserAnswer16(-1, 2, 'self', langKey, currentCode));
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRunningFull(false);
      setIsPyodideLoading(false);
    }
  };

  // Trigger full test suite automatically when submitted for Python
  useEffect(() => {
    if (state.isSubmitted && selectedLang === 'Python' && !hasRunFullRef.current && !isRunningFull && currentCode.trim()) {
      runFullTests();
    }
  }, [state.isSubmitted, selectedLang]);

  const isRunning = isRunningTrial || isRunningFull;

  const fullPassedCount = fullResults.filter((r) => r.passed).length;
  const fullTotalCount = taskData.tests.length;
  const fullFailedCount = fullTotalCount - fullPassedCount;
  let pointsText = '0 баллов';
  if (fullFailedCount === 0) {
    pointsText = '2 балла';
  } else if (fullFailedCount === 1) {
    pointsText = '1 балл';
  }
  const fullSummaryLine = `Пройдено ${fullPassedCount} из ${fullTotalCount} тестов — ${pointsText}`;

  const editorLabels: Record<ProgrammingLanguage, string> = {
    'Python': 'Исходный код программы (Python 3):',
    'Паскаль': 'Исходный код программы (Паскаль):',
    'С++': 'Исходный код программы (C++):'
  };

  const editorPlaceholders: Record<ProgrammingLanguage, string> = {
    'Python': '# Напишите ваше решение на Python\nn = int(input())\n# ...',
    'Паскаль': '// Напишите ваше решение на Паскале\nvar n: integer;\n// ...',
    'С++': '// Напишите ваше решение на C++\n#include <iostream>\nusing namespace std;\n// ...'
  };

  return (
    <div className="space-y-6 text-theme-text">
      {/* Statement */}
      <StatementBlock>
        <StatementText>
          {taskData.statement}
        </StatementText>

        {/* Sample Input/Output Table */}
        <div className="space-y-2 pt-1">
          <BlockLabel className="mb-0">
            Пример работы программы:
          </BlockLabel>
          <DataTable className="max-w-lg">
            <thead>
              <tr>
                <Th className="text-left w-1/2 font-mono text-xs">
                  Входные данные
                </Th>
                <Th className="text-left w-1/2 font-mono text-xs">
                  Выходные данные
                </Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="whitespace-pre align-top font-mono text-xs text-left">
                  {taskData.sampleInput}
                </Td>
                <Td className="whitespace-pre align-top font-mono text-xs font-bold text-left !text-emerald-600 dark:!text-emerald-400">
                  {taskData.sampleOutput}
                </Td>
              </tr>
            </tbody>
          </DataTable>
        </div>
      </StatementBlock>

      {/* Language Selector Bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
          {PROGRAMMING_LANGUAGES.map((lang) => {
            const isActive = selectedLang === lang;
            const label = lang === 'Python' ? 'Python' : `${lang} (без автопроверки)`;
            return (
              <button
                key={lang}
                type="button"
                disabled={state.isSubmitted}
                onClick={() => handleSelectLang(lang)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                  state.isSubmitted ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <BlockLabel className="mb-0">
            {editorLabels[selectedLang]}
          </BlockLabel>
          <span className="text-xs text-theme-text-muted">
            Нажмите Tab для отступа в 4 пробела
          </span>
        </div>

        <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-inner">
          <textarea
            rows={10}
            disabled={state.isSubmitted || isRunning}
            value={currentCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder={editorPlaceholders[selectedLang]}
            style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' }}
            className="w-full min-h-[260px] p-4 font-mono text-sm leading-relaxed text-slate-100 bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
          />
        </div>

        {/* Loading Indicator / Timeout Notice for Python */}
        {selectedLang === 'Python' && isPyodideLoading && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <div>
                <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  Загрузка интерпретатора Python... ({loadSeconds} сек.)
                </div>
                <div className="text-[11px] text-theme-text-muted">
                  первый запуск, около 10 МБ, дальше будет быстро
                </div>
              </div>
            </div>

            {loadSeconds > 45 && (
              <div className="pt-2 border-t border-blue-500/20 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Что-то долго. Проверьте интернет-соединение
                </span>
                <button
                  type="button"
                  onClick={handleCancelRun}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Отменить
                </button>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar when running full tests on submission */}
        {selectedLang === 'Python' && isRunningFull && !isPyodideLoading && (
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span>Проверка: тест {Math.min(currentTestIndex, taskData.tests.length)} из {taskData.tests.length}</span>
              <button
                type="button"
                onClick={handleCancelRun}
                className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
              >
                Отменить
              </button>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${(fullResults.length / taskData.tests.length) * 100}%` }}
                className="bg-blue-500 h-full transition-all duration-300"
              />
            </div>
          </div>
        )}

        {/* Run Button Bar or Non-Python Explanation */}
        {selectedLang === 'Python' ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={!currentCode.trim() || isRunning || state.isSubmitted}
              onClick={handleTrialRun}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                !currentCode.trim() || isRunning || state.isSubmitted
                  ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white'
              }`}
            >
              {isRunningTrial ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Запуск...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Запустить программу</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
            Автоматическая проверка доступна только для Python. Напишите решение и сверьте его с примером в разборе после отправки ответа.
          </div>
        )}
      </div>

      {/* Fallback Self-Check Option if Pyodide Error */}
      {selectedLang === 'Python' && pyodideError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
          <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            {pyodideError}
          </div>
        </div>
      )}

      {/* Trial Run Results Table for Python (1 test only) */}
      {!state.isSubmitted && selectedLang === 'Python' && trialResult && (
        <div className="space-y-2 pt-2">
          <BlockLabel>
            Результат запуска
          </BlockLabel>
          <DataTable>
            <thead>
              <tr>
                <Th className="text-center w-12 font-mono text-xs">№</Th>
                <Th className="text-left font-mono text-xs">Входные данные</Th>
                <Th className="text-left font-mono text-xs">Ожидалось</Th>
                <Th className="text-left font-mono text-xs">Получено</Th>
                <Th className="text-center w-36 font-mono text-xs">Статус</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="text-center font-bold font-mono text-xs text-theme-text-sec">1</Td>
                <Td className="text-left whitespace-pre font-mono text-xs">
                  {taskData.tests[0].input}
                </Td>
                <Td className="text-left font-mono text-xs font-bold whitespace-pre-line !text-emerald-600 dark:!text-emerald-400">
                  {taskData.tests[0].expected}
                </Td>
                <Td className="text-left font-mono text-xs whitespace-pre-line">
                  {trialResult.output.trim() || '—'}
                </Td>
                <Td className="text-center font-mono text-xs">
                  {trialResult.timedOut ? (
                    <span className="inline-block px-2 py-0.5 rounded font-sans text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Превышено время
                    </span>
                  ) : trialResult.error ? (
                    <span className="inline-block px-2 py-0.5 rounded font-sans text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Ошибка
                    </span>
                  ) : trialResult.passed ? (
                    <span className="inline-block px-2 py-0.5 rounded font-sans text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Пройден
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded font-sans text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Не пройден
                    </span>
                  )}
                </Td>
              </tr>

              {trialResult.timedOut && (
                <tr className="bg-rose-50 dark:bg-rose-950/30">
                  <Td colSpan={5} className="font-mono text-xs text-rose-700 dark:text-rose-400 text-left">
                    <strong>Сообщение:</strong> Превышено время выполнения (5 секунд) — возможно, в программе бесконечный цикл.
                  </Td>
                </tr>
              )}

              {trialResult.error && !trialResult.timedOut && (
                <tr className="bg-rose-50 dark:bg-rose-950/30">
                  <Td colSpan={5} className="font-mono text-xs text-rose-700 dark:text-rose-400 text-left">
                    <strong>Сообщение об ошибке:</strong> {trialResult.error}
                  </Td>
                </tr>
              )}
            </tbody>
          </DataTable>
          <p className="text-xs text-theme-text-muted italic pt-1">
            При проверке ответа программа будет запущена и на других тестах.
          </p>
        </div>
      )}

      {/* Submitted Results Table for Python (All tests) */}
      {state.isSubmitted && selectedLang === 'Python' && fullResults.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="p-3 bg-theme-bg border border-theme-border rounded-xl text-xs font-bold text-theme-text">
            {fullSummaryLine}
          </div>

          <BlockLabel>
            Результаты тестирования:
          </BlockLabel>
          <DataTable>
            <thead>
              <tr>
                <Th className="text-center w-12 font-mono text-xs">№</Th>
                <Th className="text-left font-mono text-xs">Входные данные</Th>
                <Th className="text-left font-mono text-xs">Ожидалось</Th>
                <Th className="text-left font-mono text-xs">Получено</Th>
                <Th className="text-center w-36 font-mono text-xs">Статус</Th>
              </tr>
            </thead>
            <tbody>
              {taskData.tests.map((test, idx) => {
                const res = fullResults[idx];
                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <Td className="text-center font-bold font-mono text-xs text-theme-text-sec">
                        {idx + 1}
                      </Td>
                      <Td className="text-left whitespace-pre font-mono text-xs">
                        {test.input}
                      </Td>
                      <Td className="text-left font-mono text-xs font-bold whitespace-pre-line !text-emerald-600 dark:!text-emerald-400">
                        {test.expected}
                      </Td>
                      <Td className="text-left font-mono text-xs whitespace-pre-line">
                        {res ? res.output.trim() || '—' : '—'}
                      </Td>
                      <Td className="text-center font-mono text-xs">
                        {!res ? (
                          <span className="text-theme-text-muted font-sans">—</span>
                        ) : res.timedOut ? (
                          <span className="inline-block px-2 py-0.5 rounded font-sans text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Превышено время
                          </span>
                        ) : res.error ? (
                          <span className="inline-block px-2 py-0.5 rounded font-sans text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Ошибка
                          </span>
                        ) : res.passed ? (
                          <span className="inline-block px-2 py-0.5 rounded font-sans text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Пройден
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded font-sans text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            Не пройден
                          </span>
                        )}
                      </Td>
                    </tr>

                    {res && res.timedOut && (
                      <tr className="bg-rose-50 dark:bg-rose-950/30">
                        <Td colSpan={5} className="font-mono text-xs text-rose-700 dark:text-rose-400 text-left">
                          <strong>Сообщение:</strong> Превышено время выполнения (5 секунд) — возможно, в программе бесконечный цикл.
                        </Td>
                      </tr>
                    )}

                    {res && res.error && !res.timedOut && (
                      <tr className="bg-rose-50 dark:bg-rose-950/30">
                        <Td colSpan={5} className="font-mono text-xs text-rose-700 dark:text-rose-400 text-left">
                          <strong>Сообщение об ошибке:</strong> {res.error}
                        </Td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </DataTable>
        </div>
      )}

      {/* Explanation and Solution Examples when Submitted */}
      {state.isSubmitted && (
        <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl space-y-4 mt-4">
          <div className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <span>Разбор задачи и пример решения:</span>
          </div>

          <p className="text-xs md:text-sm leading-relaxed whitespace-pre-line text-theme-text">
            {taskData.explanation}
          </p>

          <div className="space-y-2">
            <BlockLabel>
              Пример решения:
            </BlockLabel>

            <div className="rounded-xl border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden shadow-lg">
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 border-b border-slate-800">
                {(['Python', 'Паскаль', 'С++'] as const).map((lang) => {
                  const isActive = solutionLang === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSolutionLang(lang)}
                      className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>

              <div className="p-4 overflow-x-auto bg-slate-900/90">
                <pre
                  style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' }}
                  className="font-mono text-xs sm:text-sm leading-relaxed text-slate-100 whitespace-pre"
                >
                  {solutionLang === 'Python' && taskData.solutionCode.python}
                  {solutionLang === 'Паскаль' && taskData.solutionCode.pascal}
                  {solutionLang === 'С++' && taskData.solutionCode.cpp}
                </pre>
              </div>
            </div>
          </div>

          {/* Test cases table for non-Python */}
          {selectedLang !== 'Python' && (
            <div className="space-y-2 pt-2">
              <BlockLabel>
                Тестовые данные для проверки:
              </BlockLabel>
              <DataTable>
                <thead>
                  <tr>
                    <Th className="text-center w-12 font-mono text-xs">№</Th>
                    <Th className="text-left font-mono text-xs">Входные данные</Th>
                    <Th className="text-left font-mono text-xs">Ожидаемый вывод</Th>
                  </tr>
                </thead>
                <tbody>
                  {taskData.tests.map((test, idx) => (
                    <tr key={idx}>
                      <Td className="text-center font-bold font-mono text-xs text-theme-text-sec">
                        {idx + 1}
                      </Td>
                      <Td className="text-left whitespace-pre font-mono text-xs">
                        {test.input}
                      </Td>
                      <Td className="text-left font-mono text-xs font-bold !text-emerald-600 dark:!text-emerald-400">
                        {test.expected}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
              <p className="text-xs text-theme-text-muted italic pt-1">
                Запустите свою программу с этими данными и сверьте результат.
              </p>
            </div>
          )}

          {/* Self-Assessment Block for Non-Python */}
          {(parsed.source === 'self' || selectedLang !== 'Python') && (
            <div className="p-4 bg-theme-card border border-theme-border rounded-xl space-y-3 mt-3">
              <BlockLabel>
                Оцените своё решение по критериям ОГЭ
              </BlockLabel>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { val: 2, label: '2 — программа работает верно на всех тестах' },
                  { val: 1, label: '1 — программа даёт неверный результат ровно на одном тесте' },
                  { val: 0, label: '0 — программа не работает или содержит существенные ошибки' }
                ].map((opt) => {
                  const isSelected = parsed.score === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => handleSelfScoreChange(opt.val)}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-theme-bg text-theme-text-muted border-theme-border hover:border-theme-text-sec'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] text-theme-text-muted italic">
                Балл выставлен самостоятельно и в статистике учитывается отдельно.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hint Callout */}
      {state.showHints && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 rounded-xl space-y-1">
          <strong className="font-bold">Подсказка к заданию:</strong>
          <p className="leading-relaxed">{taskData.hint}</p>
        </div>
      )}
    </div>
  );
}

type CondFamily =
  | 'parity'
  | 'divisibility'
  | 'compare'
  | 'decimal'
  | 'radix_sum_div'
  | 'radix_has_digit'
  | 'perfect_square'
  | 'decimal_palindrome'
  | 'decimal_sum_div'
  | 'decimal_first_digit'
  | 'div_and_not_div';

interface ConditionPreamble {
  py?: string;
  pas?: string;
  cpp?: string;
  varPas?: string;
  varCpp?: string;
}

interface Condition {
  family: CondFamily;
  textPlural: string;            // фрагмент для мн. ч., напр. «кратны 7»
  textSingular: string;          // фрагмент для ед. ч., напр. «кратен 7»
  textGenitivePlural?: string;   // фрагмент для количества, напр. «чисел, кратных 7,»
  textNeuter?: string;           // согласованное определение среднего рода («чётное», «двузначное», «кратное 9»)
  test: (x: number) => boolean; // предикат для расчёта ответа
  py: string;                   // выражение для if в Python, напр. 'x % 7 == 0'
  pas: string;                  // то же для Паскаля, напр. 'x mod 7 = 0'
  cpp: string;                  // то же для C++, напр. 'x % 7 == 0'
  preamble?: ConditionPreamble; // вычисляемый перед ифом блок
}

function formatNum(x: number): string {
  if (x < 0) {
    return '−' + Math.abs(x);
  }
  return String(x);
}

function indentCode(code: string | undefined, spaces: number): string {
  if (!code) return '';
  const pad = ' '.repeat(spaces);
  return code.split('\n').map((line) => (line.trim() ? pad + line : '')).join('\n') + '\n';
}

function getRadixName(p: number): string {
  if (p === 2) return 'в двоичной системе счисления';
  if (p === 8) return 'в восьмеричной системе счисления';
  if (p === 16) return 'в шестнадцатеричной системе счисления';
  return `в системе счисления с основанием ${p}`;
}

function getAggStr(agg: 'max' | 'min' | 'sum' | 'count', cond: Condition): string {
  const neuter = cond.textNeuter;
  const isSingleWord = neuter && !neuter.includes(' ');
  if (isSingleWord) {
    if (agg === 'max') return `наибольшее ${neuter} число последовательности`;
    if (agg === 'min') return `наименьшее ${neuter} число последовательности`;
    if (agg === 'sum') return `сумму ${neuter} чисел последовательности`;
    if (agg === 'count') return `количество ${neuter} чисел последовательности`;
  }
  if (agg === 'max') return `наибольшее число последовательности, которое ${cond.textSingular}`;
  if (agg === 'min') return `наименьшее число последовательности, которое ${cond.textSingular}`;
  if (agg === 'sum') return `сумму элементов последовательности, которые ${cond.textPlural}`;
  return `количество элементов последовательности, которые ${cond.textPlural}`;
}

function makeConditionForFamily(
  family: CondFamily,
  rng: ReturnType<typeof makeRng>,
  LIMIT: number,
  isIntegerMode: boolean = false,
  agg?: 'sum' | 'count' | 'max' | 'min' | 'avg',
  varSuffix: string = ''
): Condition {
  const s = varSuffix;
  switch (family) {
    case 'parity': {
      const isEven = rng.pick([true, false]);
      if (isEven) {
        return {
          family: 'parity',
          textPlural: 'чётны',
          textSingular: 'чётно',
          textGenitivePlural: 'чётных чисел',
          textNeuter: 'чётное',
          test: (x) => x % 2 === 0,
          py: 'x % 2 == 0',
          pas: 'x mod 2 = 0',
          cpp: 'x % 2 == 0'
        };
      } else {
        return {
          family: 'parity',
          textPlural: 'нечётны',
          textSingular: 'нечётно',
          textGenitivePlural: 'нечётных чисел',
          textNeuter: 'нечётное',
          test: (x) => x % 2 !== 0,
          py: 'x % 2 != 0',
          pas: 'x mod 2 <> 0',
          cpp: 'x % 2 != 0'
        };
      }
    }

    case 'divisibility': {
      const k = rng.int(3, 9);
      return {
        family: 'divisibility',
        textPlural: `кратны ${k}`,
        textSingular: `кратно ${k}`,
        textGenitivePlural: `чисел, кратных ${k},`,
        textNeuter: `кратное ${k}`,
        test: (x) => x % k === 0,
        py: `x % ${k} == 0`,
        pas: `x mod ${k} = 0`,
        cpp: `x % ${k} == 0`
      };
    }

    case 'compare': {
      let minX = 10;
      let maxX = Math.max(minX + 10, Math.floor(LIMIT * 0.5));
      if (isIntegerMode) {
        minX = -Math.floor(LIMIT * 0.5);
        maxX = Math.floor(LIMIT * 0.5);
      } else {
        minX = Math.max(10, Math.floor(LIMIT * 0.1));
      }

      const rawX = rng.int(minX, maxX);
      let X = rawX;
      if (LIMIT <= 1000) {
        X = Math.round(rawX / 10) * 10;
      } else if (LIMIT <= 5000) {
        X = Math.round(rawX / 100) * 100;
      } else {
        X = Math.round(rawX / 1000) * 1000;
      }
      if (isIntegerMode) {
        if (X === 0) X = rng.pick([-10, 10]);
        X = Math.max(-Math.floor(LIMIT * 0.5), Math.min(X, Math.floor(LIMIT * 0.5)));
      } else {
        X = Math.max(10, Math.min(X, Math.floor(LIMIT * 0.5)));
      }

      let allowedSubs: ('gt' | 'lt' | 'gte' | 'lte')[] = ['gt', 'lt', 'gte', 'lte'];
      if (agg === 'min') {
        allowedSubs = ['gte', 'gt'];
      } else if (agg === 'max') {
        allowedSubs = ['lte', 'lt'];
      }

      const sub = rng.pick(allowedSubs);
      const formattedX = formatNum(X);

      if (sub === 'gt') {
        return {
          family: 'compare',
          textPlural: `строго больше ${formattedX}`,
          textSingular: `строго больше ${formattedX}`,
          textGenitivePlural: `чисел, строго больших ${formattedX},`,
          textNeuter: `строго большее ${formattedX}`,
          test: (x) => x > X,
          py: `x > ${X}`,
          pas: `x > ${X}`,
          cpp: `x > ${X}`
        };
      } else if (sub === 'lt') {
        return {
          family: 'compare',
          textPlural: `строго меньше ${formattedX}`,
          textSingular: `строго меньше ${formattedX}`,
          textGenitivePlural: `чисел, строго меньших ${formattedX},`,
          textNeuter: `строго меньшее ${formattedX}`,
          test: (x) => x < X,
          py: `x < ${X}`,
          pas: `x < ${X}`,
          cpp: `x < ${X}`
        };
      } else if (sub === 'gte') {
        return {
          family: 'compare',
          textPlural: `не меньше ${formattedX}`,
          textSingular: `не меньше ${formattedX}`,
          textGenitivePlural: `чисел, не меньших ${formattedX},`,
          textNeuter: `не меньшее ${formattedX}`,
          test: (x) => x >= X,
          py: `x >= ${X}`,
          pas: `x >= ${X}`,
          cpp: `x >= ${X}`
        };
      } else {
        return {
          family: 'compare',
          textPlural: `не превышают ${formattedX}`,
          textSingular: `не превышает ${formattedX}`,
          textGenitivePlural: `чисел, не превышающих ${formattedX},`,
          textNeuter: `не превышающее ${formattedX}`,
          test: (x) => x <= X,
          py: `x <= ${X}`,
          pas: `x <= ${X}`,
          cpp: `x <= ${X}`
        };
      }
    }

    case 'decimal': {
      const sub = rng.pick(['ends_d', 'two_digit', 'three_digit']);
      if (sub === 'ends_d') {
        const d = rng.int(0, 9);
        return {
          family: 'decimal',
          textPlural: `оканчиваются на цифру ${d}`,
          textSingular: `оканчивается на цифру ${d}`,
          textGenitivePlural: `чисел, оканчивающихся на цифру ${d},`,
          textNeuter: `оканчивающееся на цифру ${d}`,
          test: (x) => Math.abs(x) % 10 === d,
          py: `x % 10 == ${d}`,
          pas: `x mod 10 = ${d}`,
          cpp: `x % 10 == ${d}`
        };
      } else if (sub === 'two_digit') {
        return {
          family: 'decimal',
          textPlural: 'являются двузначными',
          textSingular: 'является двузначным',
          textGenitivePlural: 'двузначных чисел',
          textNeuter: 'двузначное',
          test: (x) => x >= 10 && x <= 99,
          py: '10 <= x <= 99',
          pas: '(x >= 10) and (x <= 99)',
          cpp: 'x >= 10 && x <= 99'
        };
      } else {
        return {
          family: 'decimal',
          textPlural: 'являются трёхзначными',
          textSingular: 'является трёхзначным',
          textGenitivePlural: 'трёхзначных чисел',
          textNeuter: 'трёхзначное',
          test: (x) => x >= 100 && x <= 999,
          py: '100 <= x <= 999',
          pas: '(x >= 100) and (x <= 999)',
          cpp: 'x >= 100 && x <= 999'
        };
      }
    }

    case 'radix_sum_div': {
      const p = rng.int(2, 16);
      const k = rng.int(2, 9);
      const radName = getRadixName(p);
      return {
        family: 'radix_sum_div',
        textPlural: `имеют сумму цифр ${radName}, кратную ${k}`,
        textSingular: `имеет сумму цифр ${radName}, кратную ${k}`,
        textGenitivePlural: `чисел, сумма цифр которых ${radName} кратна ${k},`,
        textNeuter: `с суммой цифр ${radName}, кратной ${k}`,
        test: (x) => {
          let temp = Math.abs(x);
          let sum = 0;
          while (temp > 0) {
            sum += temp % p;
            temp = Math.floor(temp / p);
          }
          return sum % k === 0;
        },
        py: `sum_d${s} % ${k} == 0`,
        pas: `sum_d${s} mod ${k} = 0`,
        cpp: `sum_d${s} % ${k} == 0`,
        preamble: {
          py: `sum_d${s} = 0\ntemp_x${s} = x\nwhile temp_x${s} > 0:\n    sum_d${s} += temp_x${s} % ${p}\n    temp_x${s} //= ${p}`,
          pas: `sum_d${s} := 0;\ntemp_x${s} := x;\nwhile temp_x${s} > 0 do\nbegin\n  sum_d${s} := sum_d${s} + (temp_x${s} mod ${p});\n  temp_x${s} := temp_x${s} div ${p};\nend;`,
          cpp: `sum_d${s} = 0;\ntemp_x${s} = x;\nwhile (temp_x${s} > 0) {\n    sum_d${s} += temp_x${s} % ${p};\n    temp_x${s} /= ${p};\n}`,
          varPas: `sum_d${s}, temp_x${s}: integer;`,
          varCpp: `int sum_d${s}, temp_x${s};`
        }
      };
    }

    case 'radix_has_digit': {
      const p = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 16]);
      const d = rng.int(0, p - 1);
      const dStr = p === 16 && d >= 10 ? 'ABCDEF'[d - 10] : String(d);
      const isNamed = p === 2 || p === 8 || p === 16;
      const radName = getRadixName(p);

      const textSingular = isNamed
        ? `содержит цифру ${dStr} в записи ${radName}`
        : `содержит цифру ${dStr} в записи по основанию ${p}`;

      const textPlural = isNamed
        ? `содержат цифру ${dStr} в записи ${radName}`
        : `содержат цифру ${dStr} в записи по основанию ${p}`;

      const textGenitivePlural = isNamed
        ? `чисел, в записи которых ${radName} есть цифра ${dStr},`
        : `чисел, в записи которых по основанию ${p} есть цифра ${dStr},`;

      const textNeuter = isNamed
        ? `содержащее цифру ${dStr} в записи ${radName}`
        : `содержащее цифру ${dStr} в записи по основанию ${p}`;

      return {
        family: 'radix_has_digit',
        textPlural,
        textSingular,
        textGenitivePlural,
        textNeuter,
        test: (x) => {
          let temp = Math.abs(x);
          while (temp > 0) {
            if (temp % p === d) return true;
            temp = Math.floor(temp / p);
          }
          return false;
        },
        py: `has_d${s}`,
        pas: `has_d${s}`,
        cpp: `has_d${s}`,
        preamble: {
          py: `has_d${s} = False\ntemp_x${s} = x\nwhile temp_x${s} > 0:\n    if temp_x${s} % ${p} == ${d}:\n        has_d${s} = True\n        break\n    temp_x${s} //= ${p}`,
          pas: `has_d${s} := false;\ntemp_x${s} := x;\nwhile temp_x${s} > 0 do\nbegin\n  if temp_x${s} mod ${p} = ${d} then\n  begin\n    has_d${s} := true;\n    break;\n  end;\n  temp_x${s} := temp_x${s} div ${p};\nend;`,
          cpp: `has_d${s} = false;\ntemp_x${s} = x;\nwhile (temp_x${s} > 0) {\n    if (temp_x${s} % ${p} == ${d}) {\n        has_d${s} = true;\n        break;\n    }\n    temp_x${s} /= ${p};\n}`,
          varPas: `has_d${s}: boolean; temp_x${s}: integer;`,
          varCpp: `bool has_d${s}; int temp_x${s};`
        }
      };
    }

    case 'perfect_square': {
      return {
        family: 'perfect_square',
        textPlural: 'являются квадратами натуральных чисел',
        textSingular: 'является квадратом натурального числа',
        textGenitivePlural: 'чисел, являющихся квадратами натуральных чисел,',
        textNeuter: 'являющееся квадратом натурального числа',
        test: (x) => {
          if (x < 1) return false;
          const r = Math.round(Math.sqrt(x));
          return r * r === x;
        },
        py: `is_sq${s}`,
        pas: `is_sq${s}`,
        cpp: `is_sq${s}`,
        preamble: {
          py: `is_sq${s} = False\nr${s} = 1\nwhile r${s} * r${s} < x:\n    r${s} += 1\nif r${s} * r${s} == x:\n    is_sq${s} = True`,
          pas: `is_sq${s} := false;\nr${s} := 1;\nwhile r${s} * r${s} < x do\n  r${s} := r${s} + 1;\nif r${s} * r${s} = x then\n  is_sq${s} := true;`,
          cpp: `is_sq${s} = false;\nr${s} = 1;\nwhile (r${s} * r${s} < x) {\n    r${s}++;\n}\nif (r${s} * r${s} == x) {\n    is_sq${s} = true;\n}`,
          varPas: `is_sq${s}: boolean; r${s}: integer;`,
          varCpp: `bool is_sq${s}; int r${s};`
        }
      };
    }

    case 'decimal_palindrome': {
      return {
        family: 'decimal_palindrome',
        textPlural: 'являются палиндромами в десятичной записи',
        textSingular: 'является палиндромом в десятичной записи',
        textGenitivePlural: 'чисел, являющихся палиндромами в десятичной записи,',
        textNeuter: 'являющееся палиндромом',
        test: (x) => {
          let temp = Math.abs(x);
          let rev = 0;
          while (temp > 0) {
            rev = rev * 10 + (temp % 10);
            temp = Math.floor(temp / 10);
          }
          return rev === Math.abs(x);
        },
        py: `is_pal${s}`,
        pas: `is_pal${s}`,
        cpp: `is_pal${s}`,
        preamble: {
          py: `rev${s} = 0\ntemp_x${s} = x\nwhile temp_x${s} > 0:\n    rev${s} = rev${s} * 10 + (temp_x${s} % 10)\n    temp_x${s} //= 10\nis_pal${s} = (rev${s} == x)`,
          pas: `rev${s} := 0;\ntemp_x${s} := x;\nwhile temp_x${s} > 0 do\nbegin\n  rev${s} := rev${s} * 10 + (temp_x${s} mod 10);\n  temp_x${s} := temp_x${s} div 10;\nend;\nis_pal${s} := (rev${s} = x);`,
          cpp: `rev${s} = 0;\ntemp_x${s} = x;\nwhile (temp_x${s} > 0) {\n    rev${s} = rev${s} * 10 + (temp_x${s} % 10);\n    temp_x${s} /= 10;\n}\nis_pal${s} = (rev${s} == x);`,
          varPas: `is_pal${s}: boolean; rev${s}, temp_x${s}: integer;`,
          varCpp: `bool is_pal${s}; int rev${s}, temp_x${s};`
        }
      };
    }

    case 'decimal_sum_div': {
      const k = rng.int(2, 9);
      return {
        family: 'decimal_sum_div',
        textPlural: `имеют сумму цифр десятичной записи, кратную ${k}`,
        textSingular: `имеет сумму цифр десятичной записи, кратную ${k}`,
        textGenitivePlural: `чисел, сумма цифр десятичной записи которых кратна ${k},`,
        textNeuter: `с суммой цифр, кратной ${k}`,
        test: (x) => {
          let temp = Math.abs(x);
          let sum = 0;
          while (temp > 0) {
            sum += temp % 10;
            temp = Math.floor(temp / 10);
          }
          return sum % k === 0;
        },
        py: `sum_d${s} % ${k} == 0`,
        pas: `sum_d${s} mod ${k} = 0`,
        cpp: `sum_d${s} % ${k} == 0`,
        preamble: {
          py: `sum_d${s} = 0\ntemp_x${s} = x\nwhile temp_x${s} > 0:\n    sum_d${s} += temp_x${s} % 10\n    temp_x${s} //= 10`,
          pas: `sum_d${s} := 0;\ntemp_x${s} := x;\nwhile temp_x${s} > 0 do\nbegin\n  sum_d${s} := sum_d${s} + (temp_x${s} mod 10);\n  temp_x${s} := temp_x${s} div 10;\nend;`,
          cpp: `sum_d${s} = 0;\ntemp_x${s} = x;\nwhile (temp_x${s} > 0) {\n    sum_d${s} += temp_x${s} % 10;\n    temp_x${s} /= 10;\n}`,
          varPas: `sum_d${s}, temp_x${s}: integer;`,
          varCpp: `int sum_d${s}, temp_x${s};`
        }
      };
    }

    case 'decimal_first_digit': {
      const d = rng.int(1, 9);
      return {
        family: 'decimal_first_digit',
        textPlural: `имеют первую цифру десятичной записи, равную ${d}`,
        textSingular: `имеет первую цифру десятичной записи, равную ${d}`,
        textGenitivePlural: `чисел, первая цифра десятичной записи которых равна ${d},`,
        textNeuter: `с первой цифрой ${d}`,
        test: (x) => {
          let temp = Math.abs(x);
          while (temp >= 10) temp = Math.floor(temp / 10);
          return temp === d;
        },
        py: `first_d${s} == ${d}`,
        pas: `first_d${s} = ${d}`,
        cpp: `first_d${s} == ${d}`,
        preamble: {
          py: `first_d${s} = x\nwhile first_d${s} >= 10:\n    first_d${s} //= 10`,
          pas: `first_d${s} := x;\nwhile first_d${s} >= 10 do\n  first_d${s} := first_d${s} div 10;`,
          cpp: `first_d${s} = x;\nwhile (first_d${s} >= 10) {\n    first_d${s} /= 10;\n}`,
          varPas: `first_d${s}: integer;`,
          varCpp: `int first_d${s};`
        }
      };
    }

    case 'div_and_not_div': {
      const a = rng.int(3, 9);
      let b = rng.int(2, 9);
      while (b === a) b = rng.int(2, 9);
      return {
        family: 'div_and_not_div',
        textPlural: `делятся на ${a}, но не делятся на ${b}`,
        textSingular: `делится на ${a}, но не делится на ${b}`,
        textGenitivePlural: `чисел, делящихся на ${a}, но не делящихся на ${b},`,
        textNeuter: `делящееся на ${a}, но не делящееся на ${b}`,
        test: (x) => x % a === 0 && x % b !== 0,
        py: `x % ${a} == 0 and x % ${b} != 0`,
        pas: `(x mod ${a} = 0) and (x mod ${b} <> 0)`,
        cpp: `x % ${a} == 0 && x % ${b} != 0`
      };
    }
  }
}

function safePick<T>(arr: T[] | undefined | null, rng: ReturnType<typeof makeRng>): T | null {
  if (!arr || arr.length === 0) return null;
  return rng.pick(arr);
}

interface CondContext {
  kind: 'for' | 'while' | 'radix';
  agg: 'sum' | 'count' | 'max' | 'min';
  isIntegerMode: boolean;
  LIMIT: number;
  NMAX: number;
  radixP: number;
  radixM: number;
  radixD: number;
  radixDStr: string;
  cond1: Condition | null;
  cond2: Condition | null;
  matching: number[];
  nonMatching: number[];
  combinedTest: (x: number) => boolean;
  poolA: number[];
  poolB: number[];
}

function generateL2(rng: ReturnType<typeof makeRng>): Task16Data {
  const LIMIT_CANDIDATES = [1000, 3000, 5000, 10000, 30000];

  const calcWithCond = (nums: number[], testFn: (x: number) => boolean, ctx: CondContext): number => {
    const matched = nums.filter(testFn);
    if (ctx.agg === 'sum') return matched.reduce((a, b) => a + b, 0);
    if (ctx.agg === 'count') return matched.length;
    if (ctx.agg === 'max') {
      if (matched.length === 0) return ctx.isIntegerMode ? -ctx.LIMIT - 1 : 0;
      return Math.max(...matched);
    }
    if (ctx.agg === 'min') {
      if (matched.length === 0) {
        if (ctx.kind === 'radix') {
          const maxVal = Math.pow(ctx.radixP, ctx.radixM) - 1;
          return maxVal + 1;
        }
        return ctx.LIMIT + 1;
      }
      return Math.min(...matched);
    }
    return 0;
  };

  const checkSignificance = (suite: number[][], ctx: CondContext): boolean => {
    let testCond1: (x: number) => boolean;
    let testCond2: (x: number) => boolean;

    if (ctx.kind === 'radix') {
      const minVal = Math.pow(ctx.radixP, ctx.radixM - 1);
      const maxVal = Math.pow(ctx.radixP, ctx.radixM) - 1;
      testCond1 = (x: number) => x >= minVal && x <= maxVal;
      testCond2 = (x: number) => x % ctx.radixP === ctx.radixD;
    } else {
      if (!ctx.cond1 || !ctx.cond2) return true;
      testCond1 = ctx.cond1.test;
      testCond2 = ctx.cond2.test;
    }

    const allCond1Same = suite.every(
      (tc) => calcWithCond(tc, testCond1, ctx) === calcWithCond(tc, ctx.combinedTest, ctx)
    );
    const allCond2Same = suite.every(
      (tc) => calcWithCond(tc, testCond2, ctx) === calcWithCond(tc, ctx.combinedTest, ctx)
    );

    if (allCond1Same || allCond2Same) {
      return false;
    }
    return true;
  };

  const buildFallbackConditions = (
    kind: 'for' | 'while' | 'radix',
    agg: 'sum' | 'count' | 'max' | 'min',
    isIntegerMode: boolean,
    LIMIT: number,
    NMAX: number,
    radixP: number,
    radixM: number,
    radixD: number,
    radixDStr: string
  ): CondContext => {
    const cond1: Condition = {
      family: 'parity',
      textPlural: 'чётны',
      textSingular: 'чётно',
      test: (x: number) => x % 2 === 0,
      py: 'x % 2 == 0',
      pas: 'x mod 2 = 0',
      cpp: 'x % 2 == 0'
    };

    let sub: 'gte' | 'lte' = 'lte';
    if (agg === 'min') {
      sub = 'gte';
    } else if (agg === 'max') {
      sub = 'lte';
    } else {
      sub = isIntegerMode ? 'gte' : 'lte';
    }

    let limitThresh = 0;
    if (sub === 'gte') {
      limitThresh = isIntegerMode ? -Math.round(LIMIT * 0.2) : Math.round(LIMIT * 0.2);
    } else {
      limitThresh = Math.round(LIMIT * 0.4);
    }

    let matching: number[] = [];
    let nonMatching: number[] = [];

    for (let fbAttempt = 0; fbAttempt < 5; fbAttempt++) {
      let roundedThresh = limitThresh;
      if (LIMIT <= 1000) roundedThresh = Math.round(roundedThresh / 10) * 10;
      else if (LIMIT <= 5000) roundedThresh = Math.round(roundedThresh / 100) * 100;
      else roundedThresh = Math.round(roundedThresh / 1000) * 1000;

      const testFn = (x: number) => (sub === 'gte' ? x >= roundedThresh : x <= roundedThresh);

      let c1Count = 0;
      let c2Count = 0;
      let bothCount = 0;
      const mList: number[] = [];
      const nmList: number[] = [];
      const startX = isIntegerMode ? -LIMIT : 1;
      for (let x = startX; x <= LIMIT; x++) {
        if (x === 0) continue;
        const t1 = cond1.test(x);
        const t2 = testFn(x);
        if (t1) c1Count++;
        if (t2) c2Count++;
        if (t1 && t2) {
          bothCount++;
          mList.push(x);
        } else {
          nmList.push(x);
        }
      }

      if (bothCount !== c1Count && bothCount !== c2Count && mList.length >= 20) {
        limitThresh = roundedThresh;
        matching = mList;
        nonMatching = nmList;
        break;
      }

      const shift = Math.round(LIMIT * 0.1);
      if (sub === 'gte') {
        limitThresh += isIntegerMode ? shift : -shift;
      } else {
        limitThresh += shift;
      }
    }

    if (matching.length < 20) {
      sub = 'lte';
      const roundedThresh = Math.round(LIMIT * 0.5);
      limitThresh = roundedThresh;
      matching = [];
      nonMatching = [];
      const startX = isIntegerMode ? -LIMIT : 1;
      for (let x = startX; x <= LIMIT; x++) {
        if (x === 0) continue;
        const t1 = cond1.test(x);
        const t2 = x <= limitThresh;
        if (t1 && t2) {
          matching.push(x);
        } else {
          nonMatching.push(x);
        }
      }
    }

    const f = formatNum(limitThresh);
    const codeStr = sub === 'gte' ? `>= ${limitThresh}` : `<= ${limitThresh}`;
    const cond2: Condition = {
      family: 'compare',
      textPlural: sub === 'gte' ? `не меньше ${f}` : `не превышают ${f}`,
      textSingular: sub === 'gte' ? `не меньше ${f}` : `не превышает ${f}`,
      test: (x: number) => (sub === 'gte' ? x >= limitThresh : x <= limitThresh),
      py: `x ${codeStr}`,
      pas: `x ${codeStr}`,
      cpp: `x ${codeStr}`
    };

    const combinedTest = (x: number) => cond1.test(x) && cond2.test(x);
    const poolA: number[] = [];
    const poolB: number[] = [];
    const startX = isIntegerMode ? -LIMIT : 1;
    for (let x = startX; x <= LIMIT; x++) {
      if (x === 0) continue;
      const t1 = cond1.test(x);
      const t2 = cond2.test(x);
      if (t1 && !t2) poolA.push(x);
      if (!t1 && t2) poolB.push(x);
    }

    return {
      kind, agg, isIntegerMode, LIMIT, NMAX, radixP, radixM, radixD, radixDStr,
      cond1, cond2, matching, nonMatching, combinedTest, poolA, poolB
    };
  };

  const poolsViable = (ctx: CondContext): boolean => {
    if (ctx.matching.length === 0) return false;
    const { agg, matching, poolA, poolB } = ctx;
    if (agg === 'max') {
      let mMin = Infinity;
      for (let i = 0; i < matching.length; i++) {
        if (matching[i] < mMin) mMin = matching[i];
      }
      const hasPoolA = poolA.some((x) => x > mMin);
      const hasPoolB = poolB.some((x) => x > mMin);
      return hasPoolA && hasPoolB;
    } else if (agg === 'min') {
      let mMax = -Infinity;
      for (let i = 0; i < matching.length; i++) {
        if (matching[i] > mMax) mMax = matching[i];
      }
      const hasPoolA = poolA.some((x) => x < mMax);
      const hasPoolB = poolB.some((x) => x < mMax);
      return hasPoolA && hasPoolB;
    } else {
      const hasPoolA = poolA.some((x) => Math.abs(x) > 10);
      const hasPoolB = poolB.some((x) => Math.abs(x) > 10);
      return hasPoolA && hasPoolB;
    }
  };

  const buildConditions = (): CondContext | null => {
    const kind = rng.pick(['for', 'while', 'radix'] as const);
    const agg = rng.pick(['sum', 'count', 'max', 'min'] as const);

    const NMAX = rng.pick([100, 300, 500, 1000]);

    const isIntegerMode = (kind === 'for' || kind === 'while') && rng.pick([true, false, false]);

    let LIMIT = 10000;
    let radixP = 8;
    let radixM = 2;
    let radixD = 0;
    let radixDStr = '0';

    if (kind === 'for' || kind === 'while') {
      LIMIT = rng.pick(LIMIT_CANDIDATES);
    } else {
      radixP = rng.pick([8, 16]);
      radixM = rng.pick([2, 3]);
      radixD = rng.int(0, radixP - 1);
      radixDStr = radixD.toString(radixP).toUpperCase();

      let validLimits = LIMIT_CANDIDATES.filter((lim) => lim >= 2 * Math.pow(radixP, radixM));
      while (validLimits.length === 0 && radixM > 1) {
        radixM--;
        validLimits = LIMIT_CANDIDATES.filter((lim) => lim >= 2 * Math.pow(radixP, radixM));
      }
      LIMIT = rng.pick(validLimits);
    }

    if (kind === 'radix') {
      const minVal = Math.pow(radixP, radixM - 1);
      const maxVal = Math.pow(radixP, radixM) - 1;
      const combinedTest = (x: number) => x % radixP === radixD && x >= minVal && x <= maxVal;

      const matching: number[] = [];
      const nonMatching: number[] = [];
      const poolA: number[] = [];
      const poolB: number[] = [];

      for (let x = 1; x <= LIMIT; x++) {
        if (combinedTest(x)) matching.push(x);
        else nonMatching.push(x);

        if (x >= minVal && x <= maxVal && x % radixP !== radixD) poolA.push(x);
        if ((x < minVal || x > maxVal) && x % radixP === radixD) poolB.push(x);
      }

      const ctx: CondContext = {
        kind, agg, isIntegerMode, LIMIT, NMAX, radixP, radixM, radixD, radixDStr,
        cond1: null, cond2: null, matching, nonMatching, combinedTest, poolA, poolB
      };
      if (!poolsViable(ctx)) return null;
      return ctx;
    }

    let cond1: Condition | null = null;
    let cond2: Condition | null = null;
    let matching: number[] = [];
    let nonMatching: number[] = [];

    for (let attempt = 0; attempt < 20; attempt++) {
      const families: CondFamily[] = isIntegerMode
        ? ['parity', 'divisibility', 'compare']
        : ['parity', 'divisibility', 'compare', 'decimal'];

      const fam1 = rng.pick(families);
      const fam2 = rng.pick(families.filter((f) => f !== fam1));

      const c1 = makeConditionForFamily(fam1, rng, LIMIT, isIntegerMode, agg);
      const c2 = makeConditionForFamily(fam2, rng, LIMIT, isIntegerMode, agg);

      let c1Count = 0;
      let c2Count = 0;
      let bothCount = 0;
      const mList: number[] = [];
      const nmList: number[] = [];

      const startX = isIntegerMode ? -LIMIT : 1;
      for (let x = startX; x <= LIMIT; x++) {
        if (x === 0) continue;
        const t1 = c1.test(x);
        const t2 = c2.test(x);
        if (t1) c1Count++;
        if (t2) c2Count++;
        if (t1 && t2) {
          bothCount++;
          mList.push(x);
        } else {
          nmList.push(x);
        }
      }

      if (bothCount === c1Count || bothCount === c2Count) continue;

      const negMCount = mList.filter((x) => x < 0).length;
      const posMCount = mList.filter((x) => x > 0).length;

      if (isIntegerMode) {
        if (negMCount >= 10 && posMCount >= 10) {
          cond1 = c1;
          cond2 = c2;
          matching = mList;
          nonMatching = nmList;
          break;
        }
      } else {
        if (mList.length >= 30) {
          cond1 = c1;
          cond2 = c2;
          matching = mList;
          nonMatching = nmList;
          break;
        }
      }
    }

    if (matching.length < 20) {
      const fbCtx = buildFallbackConditions(kind, agg, isIntegerMode, LIMIT, NMAX, radixP, radixM, radixD, radixDStr);
      if (!poolsViable(fbCtx)) return null;
      return fbCtx;
    }

    const combinedTest = (x: number) => cond1!.test(x) && cond2!.test(x);
    const poolA: number[] = [];
    const poolB: number[] = [];
    const startX = isIntegerMode ? -LIMIT : 1;
    for (let x = startX; x <= LIMIT; x++) {
      if (x === 0) continue;
      const t1 = cond1!.test(x);
      const t2 = cond2!.test(x);
      if (t1 && !t2) poolA.push(x);
      if (!t1 && t2) poolB.push(x);
    }

    const ctx: CondContext = {
      kind, agg, isIntegerMode, LIMIT, NMAX, radixP, radixM, radixD, radixDStr,
      cond1, cond2, matching, nonMatching, combinedTest, poolA, poolB
    };
    if (!poolsViable(ctx)) return null;
    return ctx;
  };

  const buildTestSuite = (ctx: CondContext): number[][] | null => {
    const { kind, agg, isIntegerMode, LIMIT, matching, nonMatching, combinedTest, poolA, poolB } = ctx;

    const matchingNeg = matching.filter((x) => x < 0);
    const nonMatchingNeg = nonMatching.filter((x) => x < 0);

    const pickM = () => safePick(matching, rng);
    const pickNM = () => safePick(nonMatching, rng);

    // test 1: sample test
    const n1 = rng.int(3, 5);
    const m1 = pickM();
    const nm1 = pickNM();
    if (m1 === null || nm1 === null) return null;
    const test1: number[] = [m1, nm1];
    while (test1.length < n1) {
      const v = rng.pick([true, false]) ? pickM() : pickNM();
      if (v === null) return null;
      test1.push(v);
    }

    if (agg === 'count') {
      let it1 = 0;
      while (calcWithCond(test1, combinedTest, ctx) === test1.length || calcWithCond(test1, combinedTest, ctx) === 0) {
        if (++it1 > 50) return null;
        const freshM = pickM();
        const freshNM = pickNM();
        if (freshM === null || freshNM === null) return null;
        test1[0] = freshM;
        test1[1] = freshNM;
        for (let i = 2; i < test1.length; i++) {
          const v = rng.pick([true, false]) ? pickM() : pickNM();
          if (v === null) return null;
          test1[i] = v;
        }
      }
    } else {
      let it1 = 0;
      while (test1.filter(combinedTest).length === 0 || test1.filter(combinedTest).length === test1.length) {
        if (++it1 > 50) return null;
        const freshM = pickM();
        const freshNM = pickNM();
        if (freshM === null || freshNM === null) return null;
        test1[0] = freshM;
        test1[1] = freshNM;
      }
    }

    // test 2: long matching test
    const n2 = rng.int(6, 8);
    const test2: number[] = [];
    for (let i = 0; i < n2; i++) {
      const v = (isIntegerMode && matchingNeg.length > 0) ? safePick(matchingNeg, rng) : pickM();
      if (v === null) return null;
      test2.push(v);
    }

    // test 3: long mixed test with contender A (from poolA)
    const n3 = rng.int(6, 8);
    const test3: number[] = [];
    for (let i = 0; i < n3; i++) {
      const v = i % 2 === 0 ? pickM() : pickNM();
      if (v === null) return null;
      test3.push(v);
    }

    const ans3 = calcWithCond(test3, combinedTest, ctx);
    let candPoolA: number[] = [];
    if (agg === 'max') candPoolA = poolA.filter((x) => x > ans3);
    else if (agg === 'min') candPoolA = poolA.filter((x) => x < ans3);
    else candPoolA = poolA.filter((x) => Math.abs(x) > 10);

    const contenderA = safePick(candPoolA, rng);
    if (contenderA === null || contenderA === 0) return null;

    const targetIdx3 = rng.int(0, test3.length - 1);
    let contenderIdx3 = -1;
    for (let offset = 0; offset < test3.length; offset++) {
      const i = (targetIdx3 + offset) % test3.length;
      const isM = combinedTest(test3[i]);
      if (isM && test3.filter(combinedTest).length <= 1) continue;
      contenderIdx3 = i;
      break;
    }
    if (contenderIdx3 === -1) return null;
    test3[contenderIdx3] = contenderA;

    // test 4: short test
    const n4 = rng.int(1, 2);
    const m4 = pickM();
    if (m4 === null) return null;
    const test4: number[] = [m4];
    if (n4 > 1) {
      const nm4 = pickNM();
      if (nm4 === null) return null;
      test4.push(nm4);
    }

    // test 5: specialized test with contender B (from poolB)
    let test5: number[] = [];
    if (agg === 'count' || agg === 'sum') {
      const n5 = rng.int(4, 6);
      for (let i = 0; i < n5; i++) {
        const v = pickNM();
        if (v === null) return null;
        test5.push(v);
      }
    } else if (agg === 'max') {
      const n5 = rng.int(6, 8);
      let nmMax = -Infinity;
      for (let i = 0; i < nonMatching.length; i++) {
        if (nonMatching[i] > nmMax) nmMax = nonMatching[i];
      }
      const validCandidates = matching.filter((x) => x < nmMax);
      const targetMax = safePick(validCandidates, rng);
      if (targetMax === null) return null;

      const greaterNM = nonMatching.filter((nm) => nm > targetMax);
      const smallerM = matching.filter((m) => m < targetMax);
      if (greaterNM.length === 0 || smallerM.length === 0) return null;

      const nm1 = safePick(greaterNM, rng);
      const nm2 = safePick(greaterNM, rng);
      const m1 = safePick(smallerM, rng);
      const m2 = safePick(smallerM, rng);
      if (nm1 === null || nm2 === null || m1 === null || m2 === null) return null;

      test5 = [m1, nm1, targetMax, m2, nm2];
      while (test5.length < n5) {
        const v = (rng.pick([true, false]) && greaterNM.length > 0) ? safePick(greaterNM, rng) : pickNM();
        if (v === null) return null;
        test5.push(v);
      }
    } else { // min
      const n5 = rng.int(6, 8);
      let nmMin = Infinity;
      for (let i = 0; i < nonMatching.length; i++) {
        if (nonMatching[i] < nmMin) nmMin = nonMatching[i];
      }
      const validCandidates = matching.filter((x) => x > nmMin);
      const targetMin = safePick(validCandidates, rng);
      if (targetMin === null) return null;

      const smallerNM = nonMatching.filter((nm) => nm < targetMin);
      const greaterM = matching.filter((m) => m > targetMin);
      if (smallerNM.length === 0 || greaterM.length === 0) return null;

      const nm1 = safePick(smallerNM, rng);
      const nm2 = safePick(smallerNM, rng);
      const m1 = safePick(greaterM, rng);
      const m2 = safePick(greaterM, rng);
      if (nm1 === null || nm2 === null || m1 === null || m2 === null) return null;

      test5 = [m1, nm1, targetMin, m2, nm2];
      while (test5.length < n5) {
        const v = (rng.pick([true, false]) && smallerNM.length > 0) ? safePick(smallerNM, rng) : pickNM();
        if (v === null) return null;
        test5.push(v);
      }
    }

    const ans5 = calcWithCond(test5, combinedTest, ctx);
    let candPoolB: number[] = [];
    if (agg === 'max') candPoolB = poolB.filter((x) => x > ans5);
    else if (agg === 'min') candPoolB = poolB.filter((x) => x < ans5);
    else candPoolB = poolB.filter((x) => Math.abs(x) > 10);

    const contenderB = safePick(candPoolB, rng);
    if (contenderB === null || contenderB === 0) return null;

    const targetIdx5 = rng.int(0, test5.length - 1);
    let contenderIdx5 = -1;
    for (let offset = 0; offset < test5.length; offset++) {
      const i = (targetIdx5 + offset) % test5.length;
      if ((agg === 'max' || agg === 'min') && i === 2) continue;
      const isM = combinedTest(test5[i]);
      if (isM && test5.filter(combinedTest).length <= 1) continue;
      contenderIdx5 = i;
      break;
    }
    if (contenderIdx5 === -1) return null;
    test5[contenderIdx5] = contenderB;

    const suite = [test1, test2, test3, test4, test5];

    if (isIntegerMode) {
      for (let tcIdx = 0; tcIdx < suite.length; tcIdx++) {
        const tc = suite[tcIdx];
        const hasNeg = tc.some((x) => x < 0);
        if (!hasNeg) {
          const negVal = safePick(nonMatchingNeg.length > 0 ? nonMatchingNeg : matchingNeg, rng);
          if (negVal === null) return null;
          const matchingCount = tc.filter(combinedTest).length;

          let safeIdx = -1;
          for (let i = tc.length - 1; i >= 0; i--) {
            if (tcIdx === 2 && i === contenderIdx3) continue;
            if (tcIdx === 4 && i === contenderIdx5) continue;
            if (tcIdx === 4 && (agg === 'max' || agg === 'min') && i === 2) continue;
            const isMatching = combinedTest(tc[i]);
            if (isMatching && matchingCount <= 1 && !combinedTest(negVal)) continue;
            safeIdx = i;
            break;
          }

          if (safeIdx !== -1) {
            tc[safeIdx] = negVal;
          } else {
            tc.push(negVal);
          }
        }
      }
    }

    if (agg === 'max' || agg === 'min') {
      for (const tc of suite) {
        if (tc.filter(combinedTest).length === 0) {
          return null;
        }
      }
    }

    return suite;
  };

  let lastCtx: CondContext | null = null;
  let finalCtx: CondContext | null = null;
  let finalSuite: number[][] | null = null;

  for (let genAttempt = 0; genAttempt < 8; genAttempt++) {
    const ctx = buildConditions();
    if (ctx) lastCtx = ctx;
    if (!ctx) continue;
    for (let testAttempt = 0; testAttempt < 10; testAttempt++) {
      const suite = buildTestSuite(ctx);
      if (!suite) continue;
      if (!checkSignificance(suite, ctx)) continue;
      finalCtx = ctx;
      finalSuite = suite;
      break;
    }
    if (finalSuite) break;
  }

  if (!finalSuite || !finalCtx) {
    const fallbackKind = (lastCtx?.kind === 'radix' || !lastCtx) ? 'while' : lastCtx.kind;
    const fallbackAgg = lastCtx ? lastCtx.agg : 'max';
    const fallbackIsIntegerMode = lastCtx ? lastCtx.isIntegerMode : false;
    const fallbackNMAX = lastCtx ? lastCtx.NMAX : 1000;
    const fallbackLimit = (lastCtx?.kind === 'radix' || !lastCtx)
      ? rng.pick(LIMIT_CANDIDATES)
      : lastCtx.LIMIT;

    finalCtx = buildFallbackConditions(
      fallbackKind,
      fallbackAgg,
      fallbackIsIntegerMode,
      fallbackLimit,
      fallbackNMAX,
      8,
      2,
      0,
      '0'
    );
    for (let attempt = 0; attempt < 10; attempt++) {
      const suite = buildTestSuite(finalCtx);
      if (suite) {
        finalSuite = suite;
        break;
      }
    }

    if (!finalSuite) {
      finalCtx = buildFallbackConditions(
        fallbackKind,
        'count',
        fallbackIsIntegerMode,
        fallbackLimit,
        fallbackNMAX,
        8,
        2,
        0,
        '0'
      );
      for (let attempt = 0; attempt < 10; attempt++) {
        const suite = buildTestSuite(finalCtx);
        if (suite) {
          finalSuite = suite;
          break;
        }
      }
    }
  }

  // Safety net if finalSuite is still null
  if (!finalSuite || !finalCtx) {
    throw new Error('Failed to generate valid test suite for Task 16 L2');
  }

  const { kind, agg, isIntegerMode, LIMIT, NMAX, radixP, radixM, radixD, radixDStr, cond1, cond2 } = finalCtx;

  const tests = finalSuite.map((nums) => {
    let inputStr = '';
    if (kind === 'for') {
      inputStr = `${nums.length}\n${nums.join('\n')}`;
    } else {
      inputStr = `${nums.join('\n')}\n0`;
    }
    const expectedStr = String(calcWithCond(nums, finalCtx!.combinedTest, finalCtx!));
    return {
      input: inputStr,
      expected: expectedStr
    };
  });

  const sampleInput = tests[0].input;
  const sampleOutput = tests[0].expected;

  let aggMain = '';
  let aggOut = '';
  if (agg === 'count') {
    aggMain = 'количество элементов';
    aggOut = 'количество искомых элементов последовательности';
  } else if (agg === 'sum') {
    aggMain = 'сумму элементов';
    aggOut = 'сумму искомых элементов последовательности';
  } else if (agg === 'max') {
    aggMain = 'наибольшее число';
    aggOut = 'значение максимального искомого элемента последовательности';
  } else {
    aggMain = 'наименьшее число';
    aggOut = 'значение минимального искомого элемента последовательности';
  }

  let statement = '';
  const seqTypeStr = isIntegerMode ? 'целых' : 'натуральных';
  const seqTypeAcc = isIntegerMode ? 'целые' : 'натуральные';

  let p1 = '';
  let p2 = '';
  const p4 = `Программа должна напечатать одно число — ${aggOut}` +
    ((agg === 'max' || agg === 'min') ? ' (гарантируется, что хотя бы одно такое число в последовательности есть)' : '') + '.';

  if (kind === 'for') {
    const condRelStr = (agg === 'count' || agg === 'sum')
      ? `которые ${cond1!.textPlural} и ${cond2!.textPlural}`
      : `которое ${cond1!.textSingular} и ${cond2!.textSingular}`;
    const limStr = isIntegerMode ? `по модулю не превышающих ${LIMIT}` : `не превышающих ${LIMIT}`;
    p1 = `Напишите программу, которая определяет ${aggMain} последовательности ${seqTypeStr} чисел, ${condRelStr}.`;
    p2 = `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), а затем N ${seqTypeStr} чисел, ${limStr}, каждое с новой строки.`;
  } else if (kind === 'while') {
    const condRelStr = (agg === 'count' || agg === 'sum')
      ? `которые ${cond1!.textPlural} и ${cond2!.textPlural}`
      : `которое ${cond1!.textSingular} и ${cond2!.textSingular}`;
    const limStr = isIntegerMode ? `по модулю не превышающие ${LIMIT}` : `не превышающие ${LIMIT}`;
    p1 = `Напишите программу, которая определяет ${aggMain} последовательности ${seqTypeStr} чисел, ${condRelStr}.`;
    p2 = `Программа получает на вход ${seqTypeAcc} числа, ${limStr}. Количество введённых чисел неизвестно, но не превышает ${NMAX}. Последовательность чисел заканчивается числом 0 (0 — признак окончания ввода, не входит в последовательность).`;
  } else {
    const radixSystemStr = radixP === 8 ? 'восьмеричной' : 'шестнадцатеричной';
    const radixDigitStr = radixM === 2 ? 'двузначна' : 'трёхзначна';
    const relWord = (agg === 'count' || agg === 'sum') ? 'запись которых' : 'запись которого';
    const condRelStr = `${relWord} в ${radixSystemStr} системе счисления ${radixDigitStr} и оканчивается на цифру ${radixDStr}`;
    p1 = `Напишите программу, которая определяет ${aggMain} последовательности натуральных чисел, ${condRelStr}.`;
    p2 = `Программа получает на вход натуральные числа. Количество введённых чисел неизвестно, но не превышает ${NMAX}. Последовательность чисел заканчивается числом 0 (0 — признак окончания ввода, не входит в последовательность).`;
  }

  statement = `${p1}\n\n${p2}\n\n${p4}`;

  let pyCond = '';
  let pasCond = '';
  let cppCond = '';

  if (kind === 'radix') {
    const minVal = Math.pow(radixP, radixM - 1);
    const maxVal = Math.pow(radixP, radixM) - 1;
    pyCond = `${minVal} <= x <= ${maxVal} and x % ${radixP} == ${radixD}`;
    pasCond = `(x >= ${minVal}) and (x <= ${maxVal}) and (x mod ${radixP} = ${radixD})`;
    cppCond = `x >= ${minVal} && x <= ${maxVal} && x % ${radixP} == ${radixD}`;
  } else {
    pyCond = `${cond1!.py} and ${cond2!.py}`;
    pasCond = `(${cond1!.pas}) and (${cond2!.pas})`;
    cppCond = `${cond1!.cpp} && ${cond2!.cpp}`;
  }

  let pyInit = '0';
  let pasInit = '0';
  let cppInit = '0';

  if (agg === 'sum' || agg === 'count') {
    pyInit = '0';
    pasInit = '0';
    cppInit = '0';
  } else if (agg === 'max') {
    if (isIntegerMode) {
      const initVal = -LIMIT - 1;
      pyInit = String(initVal);
      pasInit = String(initVal);
      cppInit = String(initVal);
    } else {
      pyInit = '0';
      pasInit = '0';
      cppInit = '0';
    }
  } else { // min
    if (kind === 'radix') {
      const maxVal = Math.pow(radixP, radixM) - 1;
      const initVal = maxVal + 1;
      pyInit = String(initVal);
      pasInit = String(initVal);
      cppInit = String(initVal);
    } else {
      const initVal = LIMIT + 1;
      pyInit = String(initVal);
      pasInit = String(initVal);
      cppInit = String(initVal);
    }
  }

  // Python solution
  let pyCode = '';
  if (kind === 'for') {
    if (agg === 'count') {
      pyCode = `n = int(input())\ncount = 0\nfor _ in range(n):\n    x = int(input())\n    if ${pyCond}:\n        count += 1\nprint(count)`;
    } else if (agg === 'sum') {
      pyCode = `n = int(input())\ns = 0\nfor _ in range(n):\n    x = int(input())\n    if ${pyCond}:\n        s += x\nprint(s)`;
    } else if (agg === 'max') {
      pyCode = `n = int(input())\nmx = ${pyInit}\nfor _ in range(n):\n    x = int(input())\n    if ${pyCond} and x > mx:\n        mx = x\nprint(mx)`;
    } else {
      pyCode = `n = int(input())\nmn = ${pyInit}\nfor _ in range(n):\n    x = int(input())\n    if ${pyCond} and x < mn:\n        mn = x\nprint(mn)`;
    }
  } else {
    if (agg === 'count') {
      pyCode = `x = int(input())\ncount = 0\nwhile x != 0:\n    if ${pyCond}:\n        count += 1\n    x = int(input())\nprint(count)`;
    } else if (agg === 'sum') {
      pyCode = `x = int(input())\ns = 0\nwhile x != 0:\n    if ${pyCond}:\n        s += x\n    x = int(input())\nprint(s)`;
    } else if (agg === 'max') {
      pyCode = `x = int(input())\nmx = ${pyInit}\nwhile x != 0:\n    if ${pyCond} and x > mx:\n        mx = x\n    x = int(input())\nprint(mx)`;
    } else {
      pyCode = `x = int(input())\nmn = ${pyInit}\nwhile x != 0:\n    if ${pyCond} and x < mn:\n        mn = x\n    x = int(input())\nprint(mn)`;
    }
  }

  // Pascal solution
  let pasCode = '';
  if (kind === 'for') {
    if (agg === 'max') {
      pasCode = `var n, i, x, mx: integer;\nbegin\n  readln(n);\n  mx := ${pasInit};\n  for i := 1 to n do\n  begin\n    readln(x);\n    if (${pasCond}) and (x > mx) then\n      mx := x;\n  end;\n  writeln(mx);\nend.`;
    } else if (agg === 'min') {
      pasCode = `var n, i, x, mn: integer;\nbegin\n  readln(n);\n  mn := ${pasInit};\n  for i := 1 to n do\n  begin\n    readln(x);\n    if (${pasCond}) and (x < mn) then\n      mn := x;\n  end;\n  writeln(mn);\nend.`;
    } else if (agg === 'sum') {
      pasCode = `var n, i, x: integer;\n  s: int64;\nbegin\n  readln(n);\n  s := 0;\n  for i := 1 to n do\n  begin\n    readln(x);\n    if ${pasCond} then\n      s := s + x;\n  end;\n  writeln(s);\nend.`;
    } else {
      pasCode = `var n, i, x, count: integer;\nbegin\n  readln(n);\n  count := 0;\n  for i := 1 to n do\n  begin\n    readln(x);\n    if ${pasCond} then\n      count := count + 1;\n  end;\n  writeln(count);\nend.`;
    }
  } else {
    if (agg === 'max') {
      pasCode = `var x, mx: integer;\nbegin\n  readln(x);\n  mx := ${pasInit};\n  while x <> 0 do\n  begin\n    if (${pasCond}) and (x > mx) then\n      mx := x;\n    readln(x);\n  end;\n  writeln(mx);\nend.`;
    } else if (agg === 'min') {
      pasCode = `var x, mn: integer;\nbegin\n  readln(x);\n  mn := ${pasInit};\n  while x <> 0 do\n  begin\n    if (${pasCond}) and (x < mn) then\n      mn := x;\n    readln(x);\n  end;\n  writeln(mn);\nend.`;
    } else if (agg === 'sum') {
      pasCode = `var x: integer;\n  s: int64;\nbegin\n  readln(x);\n  s := 0;\n  while x <> 0 do\n  begin\n    if ${pasCond} then\n      s := s + x;\n    readln(x);\n  end;\n  writeln(s);\nend.`;
    } else {
      pasCode = `var x, count: integer;\nbegin\n  readln(x);\n  count := 0;\n  while x <> 0 do\n  begin\n    if ${pasCond} then\n      count := count + 1;\n    readln(x);\n  end;\n  writeln(count);\nend.`;
    }
  }

  // C++ solution
  let cppCode = '';
  if (kind === 'for') {
    if (agg === 'max') {
      cppCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x, mx = ${cppInit};\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (${cppCond} && x > mx) {\n            mx = x;\n        }\n    }\n    cout << mx;\n    return 0;\n}`;
    } else if (agg === 'min') {
      cppCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x, mn = ${cppInit};\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (${cppCond} && x < mn) {\n            mn = x;\n        }\n    }\n    cout << mn;\n    return 0;\n}`;
    } else if (agg === 'sum') {
      cppCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x;\n    long long s = 0;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (${cppCond}) {\n            s += x;\n        }\n    }\n    cout << s;\n    return 0;\n}`;
    } else {
      cppCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x, count = 0;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (${cppCond}) {\n            count++;\n        }\n    }\n    cout << count;\n    return 0;\n}`;
    }
  } else {
    if (agg === 'max') {
      cppCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    int x, mx = ${cppInit};\n    cin >> x;\n    while (x != 0) {\n        if (${cppCond} && x > mx) {\n            mx = x;\n        }\n        cin >> x;\n    }\n    cout << mx;\n    return 0;\n}`;
    } else if (agg === 'min') {
      cppCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    int x, mn = ${cppInit};\n    cin >> x;\n    while (x != 0) {\n        if (${cppCond} && x < mn) {\n            mn = x;\n        }\n        cin >> x;\n    }\n    cout << mn;\n    return 0;\n}`;
    } else if (agg === 'sum') {
      cppCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    int x;\n    long long s = 0;\n    cin >> x;\n    while (x != 0) {\n        if (${cppCond}) {\n            s += x;\n        }\n        cin >> x;\n    }\n    cout << s;\n    return 0;\n}`;
    } else {
      cppCode = `#include <iostream>\nusing namespace std;\n\nint main() {\n    int x, count = 0;\n    cin >> x;\n    while (x != 0) {\n        if (${cppCond}) {\n            count++;\n        }\n        cin >> x;\n    }\n    cout << count;\n    return 0;\n}`;
    }
  }

  const solutionCode = {
    python: pyCode,
    pascal: pasCode,
    cpp: cppCode
  };

  // Hint text
  let hint = '';
  if (kind === 'for') {
    hint += `Сначала считывается количество чисел N, после чего в цикле от 1 до N поочерёдно обрабатывается каждое введённое число. `;
  } else {
    hint += `Так как признаком окончания ввода служит ноль, первое число считывается до цикла, а каждое следующее — в конце его тела. `;
  }

  if (kind === 'radix') {
    const minVal = Math.pow(radixP, radixM - 1);
    const maxVal = Math.pow(radixP, radixM) - 1;
    hint += `Разрядность числа в системе счисления с основанием ${radixP} проверяется сравнением с границами диапазона от ${minVal} до ${maxVal}, а последняя цифра — остатком от деления на ${radixP}. `;
  } else {
    hint += `Оба условия проверяются одновременно внутри цикла с помощью логической связки «И». `;
  }

  const initDisplay = formatNum(Number(pyInit));

  if (agg === 'count') {
    hint += `Переменная-счётчик перед началом цикла инициализируется нулём и увеличивается на единицу при выполнении условий.`;
  } else if (agg === 'sum') {
    hint += `Переменная для накопления суммы перед началом цикла инициализируется нулём и увеличивается на величину текущего числа при выполнении условий.`;
  } else if (agg === 'max') {
    if (isIntegerMode) {
      hint += `Переменная для поиска максимума инициализируется числом ${initDisplay} (значение меньше любого возможного элемента), так как все числа по модулю не превышают ${LIMIT}, и любое введённое число гарантированно превысит стартовое значение.`;
    } else {
      hint += `Переменная для поиска максимума инициализируется нулём, так как все введённые числа по условию являются натуральными.`;
    }
  } else {
    if (kind === 'radix') {
      const maxVal = Math.pow(radixP, radixM) - 1;
      hint += `Переменная для поиска минимума перед циклом инициализируется числом ${maxVal + 1} (верхняя граница диапазона разрядности плюс единица), чтобы любое подходящее число оказалось меньше неё.`;
    } else {
      hint += `Переменная для поиска минимума перед циклом инициализируется числом ${LIMIT + 1} (число, заведомо большее любого возможного элемента), так как все числа ${isIntegerMode ? 'по модулю ' : ''}не превышают ${LIMIT}, чтобы первое же подходящее число обновляло её значение.`;
    }
  }

  // Explanation text
  let step1 = '';
  let step2 = '';
  let step3 = '';
  let step4 = '';
  const step5 = '5. Вывести итоговый результат на экран.';

  if (kind === 'for') {
    step1 = `1. Считать количество элементов N и инициализировать переменную ответа (${agg === 'max' || agg === 'min' ? initDisplay : '0'}).`;
    step2 = '2. Организовать цикл от 1 до N для считывания каждого очередного числа.';
  } else {
    step1 = `1. Инициализировать переменную ответа (${agg === 'max' || agg === 'min' ? initDisplay : '0'}) и считать первое число последовательности.`;
    step2 = '2. Организовать цикл while, выполняющийся до появления числа 0 (признака окончания ввода).';
  }

  if (kind === 'radix') {
    const minVal = Math.pow(radixP, radixM - 1);
    const maxVal = Math.pow(radixP, radixM) - 1;
    const radixSystemStr = radixP === 8 ? 'восьмеричной' : 'шестнадцатеричной';
    const digitWord = radixM === 2 ? 'двузначные' : 'трёхзначные';
    const expMin = radixM === 2 ? `${radixP}¹` : `${radixP}²`;
    const expMax = radixM === 2 ? `${radixP}²` : `${radixP}³`;
    const digitExpl = `${digitWord} в ${radixSystemStr} системе счисления — это числа от ${minVal} = ${expMin} до ${maxVal} = ${expMax} − 1`;
    const remainderExpl = radixD === 0
      ? `оканчивается ли ${radixSystemStr} запись на 0, то есть равен ли нулю остаток от деления на ${radixP}`
      : `оканчивается ли ${radixSystemStr} запись на ${radixDStr}, то есть равен ли остаток от деления на ${radixP} цифре ${radixDStr}`;
    step3 = `3. Внутри цикла проверить, является ли число подходящей разрядности (${digitExpl}) и ${remainderExpl}.`;
  } else {
    step3 = '3. Внутри цикла проверить одновременное выполнение обоих заданных условий.';
  }

  const actionStr =
    agg === 'count' ? 'увеличить счётчик на 1' :
    agg === 'sum' ? 'прибавить число к сумме' :
    agg === 'max' ? 'обновить максимум при превышении' :
    'обновить минимум при меньшем значении';

  if (kind === 'for') {
    step4 = `4. Если условие выполняется, ${actionStr}.`;
  } else {
    step4 = `4. Если условие выполняется, ${actionStr}, после чего считать следующее число в конце тела цикла.`;
  }

  let typError = '';
  const hasParity = cond1?.family === 'parity' || cond2?.family === 'parity';

  if (isIntegerMode && agg === 'max') {
    typError = 'Типичная ошибка: инициализация максимума нулём (mx = 0), из-за чего при последовательности из одних отрицательных чисел программа выведет 0 вместо верного отрицательного максимума.';
  } else if (isIntegerMode && agg === 'min') {
    typError = 'Типичная ошибка: инициализация минимума нулём или недостаточно большим числом.';
  } else if (kind === 'while' || kind === 'radix') {
    if (agg === 'max' || agg === 'min') {
      typError = 'Типичная ошибка: поиск экстремума среди всех введённых чисел без учёта условия, а также обработка завершающего нуля как элемента последовательности.';
    } else {
      typError = 'Типичная ошибка: считывание числа только внутри цикла, из-за чего теряется первый элемент, или объявление переменной-накопителя внутри цикла.';
    }
  } else {
    if (agg === 'max' || agg === 'min') {
      typError = 'Типичная ошибка: поиск экстремума среди всех введённых чисел с проверкой условия только при выводе результата.';
    } else {
      typError = 'Типичная ошибка: объявление переменной-накопителя внутри тела цикла, из-за чего её значение сбрасывается на каждой итерации.';
    }
  }

  if (isIntegerMode && hasParity) {
    typError += ' Дополнительно обратите внимание: проверка нечётности вида x % 2 == 1 даёт неверный результат для отрицательных чисел в C++ и Pascal (где -3 % 2 равно -1), используйте x % 2 != 0.';
  }

  const explanation = `Алгоритм решения:\n${step1}\n${step2}\n${step3}\n${step4}\n${step5}\n\n${typError}`;

  return {
    kind,
    aggregation: agg,
    statement,
    sampleInput,
    sampleOutput,
    tests,
    solutionCode,
    hint,
    explanation
  };
}

function buildTask16L3Data(
  LIMIT: number,
  NMAX: number,
  isIntegerMode: boolean,
  agg: 'avg' | 'sum' | 'count' | 'max' | 'min',
  scheme: 'A' | 'B',
  threshold: number,
  direction: 'gte' | 'lte',
  condA: Condition | null,
  condB: Condition | null,
  tests: { input: string; expected: string; nums: number[] }[],
  outputMode: 'two' | 'one' | 'pair',
  loopKind: 'for' | 'while'
): Task16Data {
  const sampleInput = tests[0].input;
  const sampleOutput = tests[0].expected;

  if (outputMode === 'pair') {
    const seqTypeStr = isIntegerMode ? 'целых' : 'натуральных';
    const limitStr = isIntegerMode ? `по модулю не превышающих ${LIMIT}` : `не превышающих ${LIMIT}`;
    const seqTypeAccStr = isIntegerMode ? 'целые числа' : 'натуральные числа';
    const limitStrWhile = isIntegerMode ? `по модулю не превышающие ${LIMIT}` : `не превышающие ${LIMIT}`;
    const aggStr = getAggStr(agg as 'max' | 'min', condA!);

    const inputStr = loopKind === 'for'
      ? `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), затем N ${seqTypeStr} чисел, ${limitStr}, каждое с новой строки.`
      : `Программа получает на вход ${seqTypeAccStr}, ${limitStrWhile}, каждое с новой строки. ` +
        `Количество чисел не превышает ${NMAX}, признак окончания последовательности — число 0 (в последовательность оно не входит).`;

    const statement =
      `Напишите программу, которая обрабатывает последовательность ${seqTypeStr} чисел.\n\n` +
      `${inputStr}\n\n` +
      `Программа должна вывести:\n` +
      `— в первой строке: ${aggStr} (гарантируется, что такое число в последовательности есть);\n` +
      `— во второй строке: его порядковый номер в последовательности. Элементы последовательности нумеруются начиная с единицы.\n\n` +
      `Если такое значение встречается несколько раз, программа должна вывести номер его первого вхождения.`;

    const varName = agg === 'max' ? 'mx' : 'mn';
    const idxName = agg === 'max' ? 'mx_idx' : 'mn_idx';
    const compOp = agg === 'max' ? '>' : '<';

    let pyCode = '';
    let pasCode = '';
    let cppCode = '';

    if (loopKind === 'for') {
      pyCode =
        `n = int(input())\n` +
        `found = False\n` +
        `${varName} = 0\n` +
        `${idxName} = 0\n` +
        `for i in range(1, n + 1):\n` +
        `    x = int(input())\n` +
        `    if ${condA!.py}:\n` +
        `        if not found or x ${compOp} ${varName}:\n` +
        `            ${varName} = x\n` +
        `            ${idxName} = i\n` +
        `            found = True\n` +
        `print(${varName})\n` +
        `print(${idxName})`;

      pasCode =
        `var n, i, x, ${varName}, ${idxName}: integer;\n` +
        `    found: boolean;\n` +
        `begin\n` +
        `  readln(n);\n` +
        `  found := false;\n` +
        `  ${varName} := 0;\n` +
        `  ${idxName} := 0;\n` +
        `  for i := 1 to n do\n` +
        `  begin\n` +
        `    readln(x);\n` +
        `    if ${condA!.pas} then\n` +
        `    begin\n` +
        `      if not found or (x ${compOp} ${varName}) then\n` +
        `      begin\n` +
        `        ${varName} := x;\n` +
        `        ${idxName} := i;\n` +
        `        found := true;\n` +
        `      end;\n` +
        `    end;\n` +
        `  end;\n` +
        `  writeln(${varName});\n` +
        `  writeln(${idxName});\n` +
        `end.`;

      cppCode =
        `#include <iostream>\n` +
        `using namespace std;\n\n` +
        `int main() {\n` +
        `    int n, x, ${varName} = 0, ${idxName} = 0;\n` +
        `    bool found = false;\n` +
        `    cin >> n;\n` +
        `    for (int i = 1; i <= n; i++) {\n` +
        `        cin >> x;\n` +
        `        if (${condA!.cpp}) {\n` +
        `            if (!found || x ${compOp} ${varName}) {\n` +
        `                ${varName} = x;\n` +
        `                ${idxName} = i;\n` +
        `                found = true;\n` +
        `            }\n` +
        `        }\n` +
        `    }\n` +
        `    cout << ${varName} << endl;\n` +
        `    cout << ${idxName} << endl;\n` +
        `    return 0;\n` +
        `}`;
    } else {
      pyCode =
        `x = int(input())\n` +
        `found = False\n` +
        `${varName} = 0\n` +
        `${idxName} = 0\n` +
        `i = 1\n` +
        `while x != 0:\n` +
        `    if ${condA!.py}:\n` +
        `        if not found or x ${compOp} ${varName}:\n` +
        `            ${varName} = x\n` +
        `            ${idxName} = i\n` +
        `            found = True\n` +
        `    i += 1\n` +
        `    x = int(input())\n` +
        `print(${varName})\n` +
        `print(${idxName})`;

      pasCode =
        `var x, i, ${varName}, ${idxName}: integer;\n` +
        `    found: boolean;\n` +
        `begin\n` +
        `  readln(x);\n` +
        `  found := false;\n` +
        `  ${varName} := 0;\n` +
        `  ${idxName} := 0;\n` +
        `  i := 1;\n` +
        `  while x <> 0 do\n` +
        `  begin\n` +
        `    if ${condA!.pas} then\n` +
        `    begin\n` +
        `      if not found or (x ${compOp} ${varName}) then\n` +
        `      begin\n` +
        `        ${varName} := x;\n` +
        `        ${idxName} := i;\n` +
        `        found := true;\n` +
        `      end;\n` +
        `    end;\n` +
        `    i := i + 1;\n` +
        `    readln(x);\n` +
        `  end;\n` +
        `  writeln(${varName});\n` +
        `  writeln(${idxName});\n` +
        `end.`;

      cppCode =
        `#include <iostream>\n` +
        `using namespace std;\n\n` +
        `int main() {\n` +
        `    int x, i = 1, ${varName} = 0, ${idxName} = 0;\n` +
        `    bool found = false;\n` +
        `    cin >> x;\n` +
        `    while (x != 0) {\n` +
        `        if (${condA!.cpp}) {\n` +
        `            if (!found || x ${compOp} ${varName}) {\n` +
        `                ${varName} = x;\n` +
        `                ${idxName} = i;\n` +
        `                found = true;\n` +
        `            }\n` +
        `        }\n` +
        `        i++;\n` +
        `        cin >> x;\n` +
        `    }\n` +
        `    cout << ${varName} << endl;\n` +
        `    cout << ${idxName} << endl;\n` +
        `    return 0;\n` +
        `}`;
    }

    const hint = loopKind === 'for'
      ? `Заведите переменные для хранения ${agg === 'max' ? 'максимума' : 'минимума'} и его порядкового номера (${idxName}), а также логический флаг found, изначально ложный.\n` +
        `Считывая числа по порядку (нумерация от 1 до N), при выполнении условия обновляйте ${agg === 'max' ? 'максимум' : 'минимум'} и его номер только при первом совпадении (found == False) или при строгом ${agg === 'max' ? 'увеличении' : 'уменьшении'} (x ${compOp} ${varName}).\n` +
        `ВАЖНО: использование нестрогого сравнения (${agg === 'max' ? '≥' : '≤'}) приведёт к сохранению номера последнего вхождения ${agg === 'max' ? 'максимума' : 'минимума'}, а не первого.`
      : `Заведите переменные для хранения ${agg === 'max' ? 'максимума' : 'минимума'}, его порядкового номера (${idxName}), счётчик позиции i (начиная с 1) и логический флаг found, изначально ложный.\n` +
        `Так как признаком окончания ввода служит ноль, считывайте числа в цикле while x != 0. Порядковый номер i увеличивается на 1 на каждом шаге цикла. Завершающий ноль в последовательность не входит и не обрабатывается.\n` +
        `При выполнении условия обновляйте ${agg === 'max' ? 'максимум' : 'минимум'} и его номер только при первом совпадении (found == False) или при строгом ${agg === 'max' ? 'увеличении' : 'уменьшении'} (x ${compOp} ${varName}).\n` +
        `ВАЖНО: использование нестрогого сравнения (${agg === 'max' ? '≥' : '≤'}) приведёт к сохранению номера последнего вхождения ${agg === 'max' ? 'максимума' : 'минимума'}, а не первого.`;

    const explanation = loopKind === 'for'
      ? `Алгоритм решения:\n` +
        `1. Считать количество элементов N.\n` +
        `2. Инициализировать переменные ${varName}, ${idxName} и логический флаг found = False.\n` +
        `3. В цикле от i = 1 до N считывать очередной элемент x.\n` +
        `4. Если x ${condA!.textSingular}:\n` +
        `   — Если found == False или x ${compOp} ${varName}, обновить значение (${varName} = x), номер (${idxName} = i) и установить found = True.\n` +
        `5. Вывести в первой строке ${varName}, во второй строке ${idxName}.\n\n` +
        `Разбор частых ошибок:\n` +
        `— Использование нестрогого сравнения (x ${agg === 'max' ? '≥' : '≤'} ${varName}): при равенстве значений номер перезапишется, и программа выведет номер ПОСЛЕДНЕГО вхождения ${agg === 'max' ? 'максимума' : 'минимума'}, а не первого.\n` +
        `— Вывод номера последнего подходящего элемента: если обновлять номер вне условия строгого ${agg === 'max' ? 'максимума' : 'минимума'} (или обновлять его при любом подходящем элементе), будет выведен номер последнего прочитанного числа, удовлетворяющего условию.\n` +
        `— Нумерация только подходящих элементов: номер i должен увеличиваться на каждом шаге цикла для ВСЕХ чисел последовательности, а не только для тех, что прошли проверку.`
      : `Алгоритм решения:\n` +
        `1. Инициализировать переменные ${varName}, ${idxName}, счётчик i = 1, логический флаг found = False и считать первое число x.\n` +
        `2. В цикле while x != 0 обрабатывать текущий элемент.\n` +
        `3. Если x ${condA!.textSingular}:\n` +
        `   — Если found == False или x ${compOp} ${varName}, обновить значение (${varName} = x), номер (${idxName} = i) и установить found = True.\n` +
        `4. Увеличить счётчик i на 1 и считать следующее число x в конце тела цикла.\n` +
        `5. Вывести в первой строке ${varName}, во второй строке ${idxName}.\n\n` +
        `Разбор частых ошибок:\n` +
        `— Использование нестрогого сравнения (x ${agg === 'max' ? '≥' : '≤'} ${varName}): при равенстве значений номер перезапишется, и программа выведет номер ПОСЛЕДНЕГО вхождения ${agg === 'max' ? 'максимума' : 'минимума'}, а не первого.\n` +
        `— Обработка завершающего нуля: ноль является признаком конца ввода и не должен влиять на результат или позицию.\n` +
        `— Увеличение счётчика i только для подходящих чисел: номер i должен увеличиваться на каждом шаге цикла для ВСЕХ чисел последовательности.`;

    return {
      kind: loopKind,
      aggregation: agg,
      statement,
      sampleInput,
      sampleOutput,
      tests: tests.map((t) => ({ input: t.input, expected: t.expected })),
      solutionCode: {
        python: pyCode,
        pascal: pasCode,
        cpp: cppCode
      },
      hint,
      explanation
    };
  } else if (outputMode === 'one') {
    const seqTypeStr = isIntegerMode ? 'целых' : 'натуральных';
    const limitStr = isIntegerMode ? `по модулю не превышающих ${LIMIT}` : `не превышающих ${LIMIT}`;
    const seqTypeAccStr = isIntegerMode ? 'целые числа' : 'натуральные числа';
    const limitStrWhile = isIntegerMode ? `по модулю не превышающие ${LIMIT}` : `не превышающие ${LIMIT}`;
    const aggStr = getAggStr(agg as 'max' | 'min', condA!);

    const inputStr = loopKind === 'for'
      ? `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), затем N ${seqTypeStr} чисел, ${limitStr}, каждое с новой строки.`
      : `Программа получает на вход ${seqTypeAccStr}, ${limitStrWhile}, каждое с новой строки. ` +
        `Количество чисел не превышает ${NMAX}, признак окончания последовательности — число 0 (в последовательность оно не входит).`;

    const statement =
      `Напишите программу, которая обрабатывает последовательность ${seqTypeStr} чисел.\n\n` +
      `${inputStr}\n\n` +
      `Программа должна вывести ${aggStr}.\nЕсли таких чисел в последовательности нет, программа должна вывести NO.`;

    const varName = agg === 'max' ? 'mx' : 'mn';
    const compOp = agg === 'max' ? '>' : '<';

    const preamblePy = indentCode(condA?.preamble?.py, 4);
    const varPasPreamble = condA?.preamble?.varPas ? `    ${condA.preamble.varPas}\n` : '';
    const preamblePas = indentCode(condA?.preamble?.pas, 4);
    const varCppPreamble = condA?.preamble?.varCpp ? `    ${condA.preamble.varCpp}\n` : '';
    const preambleCpp = indentCode(condA?.preamble?.cpp, 8);

    let pyCode = '';
    let pasCode = '';
    let cppCode = '';

    if (loopKind === 'for') {
      pyCode =
        `n = int(input())\n` +
        `found = False\n` +
        `${varName} = 0\n` +
        `for _ in range(n):\n` +
        `    x = int(input())\n` +
        preamblePy +
        `    if ${condA!.py}:\n` +
        `        if not found or x ${compOp} ${varName}:\n` +
        `            ${varName} = x\n` +
        `            found = True\n` +
        `if found:\n` +
        `    print(${varName})\n` +
        `else:\n` +
        `    print("NO")`;

      pasCode =
        `var n, i, x, ${varName}: integer;\n` +
        `    found: boolean;\n` +
        varPasPreamble +
        `begin\n` +
        `  readln(n);\n` +
        `  found := false;\n` +
        `  ${varName} := 0;\n` +
        `  for i := 1 to n do\n` +
        `  begin\n` +
        `    readln(x);\n` +
        preamblePas +
        `    if ${condA!.pas} then\n` +
        `    begin\n` +
        `      if not found or (x ${compOp} ${varName}) then\n` +
        `      begin\n` +
        `        ${varName} := x;\n` +
        `        found := true;\n` +
        `      end;\n` +
        `    end;\n` +
        `  end;\n` +
        `  if found then\n` +
        `    writeln(${varName})\n` +
        `  else\n` +
        `    writeln('NO');\n` +
        `end.`;

      cppCode =
        `#include <iostream>\n` +
        `using namespace std;\n\n` +
        `int main() {\n` +
        `    int n, x, ${varName} = 0;\n` +
        `    bool found = false;\n` +
        varCppPreamble +
        `    cin >> n;\n` +
        `    for (int i = 0; i < n; i++) {\n` +
        `        cin >> x;\n` +
        preambleCpp +
        `        if (${condA!.cpp}) {\n` +
        `            if (!found || x ${compOp} ${varName}) {\n` +
        `                ${varName} = x;\n` +
        `                found = true;\n` +
        `            }\n` +
        `        }\n` +
        `    }\n` +
        `    if (found) {\n` +
        `        cout << ${varName} << endl;\n` +
        `    } else {\n` +
        `        cout << "NO" << endl;\n` +
        `    }\n` +
        `    return 0;\n` +
        `}`;
    } else {
      pyCode =
        `x = int(input())\n` +
        `found = False\n` +
        `${varName} = 0\n` +
        `while x != 0:\n` +
        preamblePy +
        `    if ${condA!.py}:\n` +
        `        if not found or x ${compOp} ${varName}:\n` +
        `            ${varName} = x\n` +
        `            found = True\n` +
        `    x = int(input())\n` +
        `if found:\n` +
        `    print(${varName})\n` +
        `else:\n` +
        `    print("NO")`;

      pasCode =
        `var x, ${varName}: integer;\n` +
        `    found: boolean;\n` +
        varPasPreamble +
        `begin\n` +
        `  readln(x);\n` +
        `  found := false;\n` +
        `  ${varName} := 0;\n` +
        `  while x <> 0 do\n` +
        `  begin\n` +
        preamblePas +
        `    if ${condA!.pas} then\n` +
        `    begin\n` +
        `      if not found or (x ${compOp} ${varName}) then\n` +
        `      begin\n` +
        `        ${varName} := x;\n` +
        `        found := true;\n` +
        `      end;\n` +
        `    end;\n` +
        `    readln(x);\n` +
        `  end;\n` +
        `  if found then\n` +
        `    writeln(${varName})\n` +
        `  else\n` +
        `    writeln('NO');\n` +
        `end.`;

      cppCode =
        `#include <iostream>\n` +
        `using namespace std;\n\n` +
        `int main() {\n` +
        `    int x, ${varName} = 0;\n` +
        `    bool found = false;\n` +
        varCppPreamble +
        `    cin >> x;\n` +
        `    while (x != 0) {\n` +
        preambleCpp +
        `        if (${condA!.cpp}) {\n` +
        `            if (!found || x ${compOp} ${varName}) {\n` +
        `                ${varName} = x;\n` +
        `                found = true;\n` +
        `            }\n` +
        `        }\n` +
        `        cin >> x;\n` +
        `    }\n` +
        `    if (found) {\n` +
        `        cout << ${varName} << endl;\n` +
        `    } else {\n` +
        `        cout << "NO" << endl;\n` +
        `    }\n` +
        `    return 0;\n` +
        `}`;
    }

    const hint = loopKind === 'for'
      ? `Заведите переменную для хранения ${agg === 'max' ? 'максимума' : 'минимума'} и логический флаг found, изначально ложный, показывающий, был ли найден хотя бы один подходящий элемент.\n` +
        `В цикле N раз считывайте числа. Если очередной элемент удовлетворяет условию, обновите ${agg === 'max' ? 'максимум' : 'минимум'} (при первом совпадении или если новое число ${agg === 'max' ? 'больше' : 'меньше'} текущего) и установите found = True.\n` +
        `После завершения цикла выведите результат или «NO», если found == False.`
      : `Заведите переменную для хранения ${agg === 'max' ? 'максимума' : 'минимума'} и логический флаг found, изначально ложный.\n` +
        `Так как признаком окончания ввода служит ноль, считывайте числа в цикле while x != 0 (первое число считывается до цикла, следующее — в конце тела цикла). Число 0 в последовательность не входит.\n` +
        `Если очередной элемент удовлетворяет условию, обновите ${agg === 'max' ? 'максимум' : 'минимум'} (при первом совпадении или если новое число ${agg === 'max' ? 'больше' : 'меньше'} текущего) и установите found = True.\n` +
        `После завершения цикла выведите результат или «NO», если found == False.`;

    const initExample = agg === 'max' ? (isIntegerMode ? -LIMIT - 1 : 0) : LIMIT + 1;
    const explanation = loopKind === 'for'
      ? `Алгоритм решения:\n` +
        `1. Считать количество элементов N.\n` +
        `2. Инициализировать логическую переменную found = False (или признак того, что элемент не найден).\n` +
        `3. В цикле N раз считывать очередной элемент x.\n` +
        `4. Если x ${condA!.textSingular}:\n` +
        `   — Если found == False или x ${compOp} ${varName}, обновлять значение (${varName} = x) и устанавливать found = True.\n` +
        `5. После завершения цикла выводим значение (${varName}), если found == True, иначе выводим «NO».\n\n` +
        `Способы проверки наличия подходящих элементов:\n` +
        `— Использование логического флага (found): начальное значение False, при найденном элементе меняется на True.\n` +
        `— Инициализация начальным экстремумом: присвоить переменной заведомо невозможное значение (например, ${initExample}), а в конце проверить, изменилось ли значение переменной.`
      : `Алгоритм решения:\n` +
        `1. Инициализировать логическую переменную found = False и считать первое число x.\n` +
        `2. В цикле while x != 0 обрабатывать числа до появления нуля.\n` +
        `3. Если x ${condA!.textSingular}:\n` +
        `   — Если found == False или x ${compOp} ${varName}, обновлять значение (${varName} = x) и устанавливать found = True.\n` +
        `4. Считывать следующее число x в конце тела цикла.\n` +
        `5. После завершения цикла выводим значение (${varName}), если found == True, иначе выводим «NO».\n\n` +
        `Способы проверки наличия подходящих элементов:\n` +
        `— Использование логического флага (found): начальное значение False, при найденном элементе меняется на True.\n` +
        `— Инициализация начальным экстремумом: присвоить переменной заведомо невозможное значение (например, ${initExample}), а в конце проверить, изменилось ли значение переменной.`;

    return {
      kind: loopKind,
      aggregation: agg,
      statement,
      sampleInput,
      sampleOutput,
      tests: tests.map((t) => ({ input: t.input, expected: t.expected })),
      solutionCode: {
        python: pyCode,
        pascal: pasCode,
        cpp: cppCode
      },
      hint,
      explanation
    };
  } else {
    if (!condB) {
      throw new Error('condB is required for outputMode two');
    }

    let aggStr = '';
    if (scheme === 'A') {
      if (agg === 'avg') aggStr = 'среднее арифметическое всех элементов последовательности, округлив до одного знака после запятой';
      else if (agg === 'sum') aggStr = 'сумму всех элементов последовательности';
      else if (agg === 'max') aggStr = 'максимальный элемент последовательности';
      else if (agg === 'min') aggStr = 'минимальный элемент последовательности';
    } else {
      aggStr = getAggStr(agg as 'max' | 'min' | 'sum' | 'count', condA!);
    }

    const numWord = threshold === 1 ? 'одного' : threshold === 2 ? 'двух' : 'трёх';
    const dirText = direction === 'gte' ? 'не менее' : 'не более';
    let flagStr = '';
    if (threshold === 1 && direction === 'gte') {
      flagStr = `в последовательности есть хотя бы одно число, которое ${condB.textSingular}`;
    } else if (condB.textGenitivePlural) {
      flagStr = `количество ${condB.textGenitivePlural} ${dirText} ${numWord}`;
    } else {
      flagStr = `количество чисел, которые ${condB.textPlural}, ${dirText} ${numWord}`;
    }

    const seqTypeStr = isIntegerMode ? 'целых' : 'натуральных';
    const limitStr = isIntegerMode ? `по модулю не превышающих ${LIMIT}` : `не превышающих ${LIMIT}`;
    const seqTypeAccStr = isIntegerMode ? 'целые числа' : 'натуральные числа';
    const limitStrWhile = isIntegerMode ? `по модулю не превышающие ${LIMIT}` : `не превышающие ${LIMIT}`;
    const line1Guarantee = (scheme === 'B' && (agg === 'max' || agg === 'min'))
      ? ' (гарантируется, что такое число в последовательности есть)'
      : '';

    const inputStr = loopKind === 'for'
      ? `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), затем N ${seqTypeStr} чисел, ${limitStr}, каждое с новой строки.`
      : `Программа получает на вход ${seqTypeAccStr}, ${limitStrWhile}, каждое с новой строки. ` +
        `Количество чисел не превышает ${NMAX}, признак окончания последовательности — число 0 (в последовательность оно не входит).`;

    const statement =
      `Напишите программу, которая обрабатывает последовательность ${seqTypeStr} чисел.\n\n` +
      `${inputStr}\n\n` +
      `Программа должна вывести:\n` +
      `— в первой строке: ${aggStr}${line1Guarantee};\n` +
      `— во второй строке: «YES», если ${flagStr}, иначе «NO».`;

    let pyInit = '';
    let pasInit = '';
    let cppInit = '';

    if (agg === 'avg' || agg === 'sum') {
      pyInit = 's = 0\n';
      pasInit = '  s := 0;\n';
      cppInit = '    int s = 0;\n';
    } else if (agg === 'count') {
      pyInit = 'cnt_agg = 0\n';
      pasInit = '  cnt_agg := 0;\n';
      cppInit = '    int cnt_agg = 0;\n';
    } else if (agg === 'max') {
      const initVal = isIntegerMode ? -LIMIT - 1 : 0;
      pyInit = `mx = ${initVal}\n`;
      pasInit = `  mx := ${initVal};\n`;
      cppInit = `    int mx = ${initVal};\n`;
    } else if (agg === 'min') {
      const initVal = LIMIT + 1;
      pyInit = `mn = ${initVal}\n`;
      pasInit = `  mn := ${initVal};\n`;
      cppInit = `    int mn = ${initVal};\n`;
    }

    let pyAggBody = '';
    let pasAggBody = '';
    let cppAggBody = '';

    if (scheme === 'A') {
      if (agg === 'avg' || agg === 'sum') {
        pyAggBody = 's += x\n';
        pasAggBody = '    s := s + x;\n';
        cppAggBody = '        s += x;\n';
      } else if (agg === 'max') {
        pyAggBody = 'if x > mx:\n        mx = x\n';
        pasAggBody = '    if x > mx then mx := x;\n';
        cppAggBody = '        if (x > mx) mx = x;\n';
      } else if (agg === 'min') {
        pyAggBody = 'if x < mn:\n        mn = x\n';
        pasAggBody = '    if x < mn then mn := x;\n';
        cppAggBody = '        if (x < mn) mn = x;\n';
      }
    } else {
      if (agg === 'sum') {
        pyAggBody = `if ${condA!.py}:\n        s += x\n`;
        pasAggBody = `    if ${condA!.pas} then\n      s := s + x;\n`;
        cppAggBody = `        if (${condA!.cpp}) s += x;\n`;
      } else if (agg === 'count') {
        pyAggBody = `if ${condA!.py}:\n        cnt_agg += 1\n`;
        pasAggBody = `    if ${condA!.pas} then\n      cnt_agg := cnt_agg + 1;\n`;
        cppAggBody = `        if (${condA!.cpp}) cnt_agg++;\n`;
      } else if (agg === 'max') {
        pyAggBody = `if ${condA!.py} and x > mx:\n        mx = x\n`;
        pasAggBody = `    if (${condA!.pas}) and (x > mx) then\n      mx := x;\n`;
        cppAggBody = `        if (${condA!.cpp} && x > mx) mx = x;\n`;
      } else if (agg === 'min') {
        pyAggBody = `if ${condA!.py} and x < mn:\n        mn = x\n`;
        pasAggBody = `    if (${condA!.pas}) and (x < mn) then\n      mn := x;\n`;
        cppAggBody = `        if (${condA!.cpp} && x < mn) mn = x;\n`;
      }
    }

    const preamblePyA = scheme === 'B' ? indentCode(condA?.preamble?.py, 4) : '';
    const preamblePyB = indentCode(condB.preamble?.py, 4);

    const varPasA = scheme === 'B' && condA?.preamble?.varPas ? `    ${condA.preamble.varPas}\n` : '';
    const varPasB = condB.preamble?.varPas ? `    ${condB.preamble.varPas}\n` : '';
    const preamblePasA = scheme === 'B' ? indentCode(condA?.preamble?.pas, 4) : '';
    const preamblePasB = indentCode(condB.preamble?.pas, 4);

    const varCppA = scheme === 'B' && condA?.preamble?.varCpp ? `    ${condA.preamble.varCpp}\n` : '';
    const varCppB = condB.preamble?.varCpp ? `    ${condB.preamble.varCpp}\n` : '';
    const preambleCppA = scheme === 'B' ? indentCode(condA?.preamble?.cpp, 8) : '';
    const preambleCppB = indentCode(condB.preamble?.cpp, 8);

    let pyCode = '';
    let pasCode = '';
    let cppCode = '';

    if (loopKind === 'for') {
      pyCode =
        `n = int(input())\n` +
        pyInit +
        `cnt_flag = 0\n` +
        `for _ in range(n):\n` +
        `    x = int(input())\n` +
        preamblePyA +
        (pyAggBody ? `    ${pyAggBody}` : '') +
        preamblePyB +
        `    if ${condB.py}:\n` +
        `        cnt_flag += 1\n` +
        (agg === 'avg'
          ? `avg10 = (10 * s + n // 2) // n\nprint(f"{avg10 // 10}.{avg10 % 10}")\n`
          : agg === 'sum'
          ? `print(s)\n`
          : agg === 'count'
          ? `print(cnt_agg)\n`
          : agg === 'max'
          ? `print(mx)\n`
          : `print(mn)\n`) +
        `if cnt_flag ${direction === 'gte' ? '>=' : '<='} ${threshold}:\n` +
        `    print("YES")\n` +
        `else:\n` +
        `    print("NO")`;

      pasCode =
        `var n, i, x, ${agg === 'sum' ? 's, ' : ''}${agg === 'count' ? 'cnt_agg, ' : ''}${agg === 'max' ? 'mx, ' : ''}${agg === 'min' ? 'mn, ' : ''}cnt_flag${agg === 'avg' ? ', avg10' : ''}: integer;\n` +
        (agg === 'avg' ? `    s: int64;\n` : '') +
        varPasA +
        varPasB +
        `begin\n` +
        `  readln(n);\n` +
        pasInit +
        `  cnt_flag := 0;\n` +
        `  for i := 1 to n do\n` +
        `  begin\n` +
        `    readln(x);\n` +
        preamblePasA +
        pasAggBody +
        preamblePasB +
        `    if ${condB.pas} then\n` +
        `      cnt_flag := cnt_flag + 1;\n` +
        `  end;\n` +
        (agg === 'avg'
          ? `  avg10 := (10 * s + n div 2) div n;\n  writeln(avg10 div 10, '.', avg10 mod 10);\n`
          : agg === 'sum'
          ? `  writeln(s);\n`
          : agg === 'count'
          ? `  writeln(cnt_agg);\n`
          : agg === 'max'
          ? `  writeln(mx);\n`
          : `  writeln(mn);\n`) +
        `  if cnt_flag ${direction === 'gte' ? '>=' : '<='} ${threshold} then\n` +
        `    writeln('YES')\n` +
        `  else\n` +
        `    writeln('NO');\n` +
        `end.`;

      cppCode =
        `#include <iostream>\n` +
        `using namespace std;\n\n` +
        `int main() {\n` +
        `    int n, x, cnt_flag = 0;\n` +
        cppInit +
        varCppA +
        varCppB +
        `    cin >> n;\n` +
        `    for (int i = 0; i < n; i++) {\n` +
        `        cin >> x;\n` +
        preambleCppA +
        cppAggBody +
        preambleCppB +
        `        if (${condB.cpp}) {\n` +
        `            cnt_flag++;\n` +
        `        }\n` +
        `    }\n` +
        (agg === 'avg'
          ? `    int avg10 = (10 * s + n / 2) / n;\n    cout << avg10 / 10 << "." << avg10 % 10 << endl;\n`
          : agg === 'sum'
          ? `    cout << s << endl;\n`
          : agg === 'count'
          ? `    cout << cnt_agg << endl;\n`
          : agg === 'max'
          ? `    cout << mx << endl;\n`
          : `    cout << mn << endl;\n`) +
        `    if (cnt_flag ${direction === 'gte' ? '>=' : '<='} ${threshold}) {\n` +
        `        cout << "YES" << endl;\n` +
        `    } else {\n` +
        `        cout << "NO" << endl;\n` +
        `    }\n` +
        `    return 0;\n` +
        `}`;
    } else {
      if (agg === 'avg') {
        pyCode =
          `x = int(input())\n` +
          `s = 0\n` +
          `cnt_all = 0\n` +
          `cnt_flag = 0\n` +
          `while x != 0:\n` +
          `    cnt_all += 1\n` +
          `    s += x\n` +
          preamblePyB +
          `    if ${condB.py}:\n` +
          `        cnt_flag += 1\n` +
          `    x = int(input())\n` +
          `avg10 = (10 * s + cnt_all // 2) // cnt_all\n` +
          `print(f"{avg10 // 10}.{avg10 % 10}")\n` +
          `if cnt_flag ${direction === 'gte' ? '>=' : '<='} ${threshold}:\n` +
          `    print("YES")\n` +
          `else:\n` +
          `    print("NO")`;

        pasCode =
          `var x, cnt_flag, cnt_all, avg10: integer;\n` +
          `    s: int64;\n` +
          varPasB +
          `begin\n` +
          `  readln(x);\n` +
          `  s := 0;\n` +
          `  cnt_all := 0;\n` +
          `  cnt_flag := 0;\n` +
          `  while x <> 0 do\n` +
          `  begin\n` +
          `    cnt_all := cnt_all + 1;\n` +
          `    s := s + x;\n` +
          preamblePasB +
          `    if ${condB.pas} then\n` +
          `      cnt_flag := cnt_flag + 1;\n` +
          `    readln(x);\n` +
          `  end;\n` +
          `  avg10 := (10 * s + cnt_all div 2) div cnt_all;\n` +
          `  writeln(avg10 div 10, '.', avg10 mod 10);\n` +
          `  if cnt_flag ${direction === 'gte' ? '>=' : '<='} ${threshold} then\n` +
          `    writeln('YES')\n` +
          `  else\n` +
          `    writeln('NO');\n` +
          `end.`;

        cppCode =
          `#include <iostream>\n` +
          `using namespace std;\n\n` +
          `int main() {\n` +
          `    int x, cnt_flag = 0, cnt_all = 0;\n` +
          `    long long s = 0;\n` +
          varCppB +
          `    cin >> x;\n` +
          `    while (x != 0) {\n` +
          `        cnt_all++;\n` +
          `        s += x;\n` +
          preambleCppB +
          `        if (${condB.cpp}) {\n` +
          `            cnt_flag++;\n` +
          `        }\n` +
          `        cin >> x;\n` +
          `    }\n` +
          `    int avg10 = (10 * s + cnt_all / 2) / cnt_all;\n` +
          `    cout << avg10 / 10 << "." << avg10 % 10 << endl;\n` +
          `    if (cnt_flag ${direction === 'gte' ? '>=' : '<='} ${threshold}) {\n` +
          `        cout << "YES" << endl;\n` +
          `    } else {\n` +
          `        cout << "NO" << endl;\n` +
          `    }\n` +
          `    return 0;\n` +
          `}`;
      } else {
        pyCode =
          `x = int(input())\n` +
          pyInit +
          `cnt_flag = 0\n` +
          `while x != 0:\n` +
          preamblePyA +
          (pyAggBody ? `    ${pyAggBody}` : '') +
          preamblePyB +
          `    if ${condB.py}:\n` +
          `        cnt_flag += 1\n` +
          `    x = int(input())\n` +
          (agg === 'sum'
            ? `print(s)\n`
            : agg === 'count'
            ? `print(cnt_agg)\n`
            : agg === 'max'
            ? `print(mx)\n`
            : `print(mn)\n`) +
          `if cnt_flag ${direction === 'gte' ? '>=' : '<='} ${threshold}:\n` +
          `    print("YES")\n` +
          `else:\n` +
          `    print("NO")`;

        pasCode =
          `var x, ${agg === 'sum' ? 's, ' : ''}${agg === 'count' ? 'cnt_agg, ' : ''}${agg === 'max' ? 'mx, ' : ''}${agg === 'min' ? 'mn, ' : ''}cnt_flag: integer;\n` +
          varPasA +
          varPasB +
          `begin\n` +
          `  readln(x);\n` +
          pasInit +
          `  cnt_flag := 0;\n` +
          `  while x <> 0 do\n` +
          `  begin\n` +
          preamblePasA +
          pasAggBody +
          preamblePasB +
          `    if ${condB.pas} then\n` +
          `      cnt_flag := cnt_flag + 1;\n` +
          `    readln(x);\n` +
          `  end;\n` +
          (agg === 'sum'
            ? `  writeln(s);\n`
            : agg === 'count'
            ? `  writeln(cnt_agg);\n`
            : agg === 'max'
            ? `  writeln(mx);\n`
            : `  writeln(mn);\n`) +
          `  if cnt_flag ${direction === 'gte' ? '>=' : '<='} ${threshold} then\n` +
          `    writeln('YES')\n` +
          `  else\n` +
          `    writeln('NO');\n` +
          `end.`;

        cppCode =
          `#include <iostream>\n` +
          `using namespace std;\n\n` +
          `int main() {\n` +
          `    int x, cnt_flag = 0;\n` +
          cppInit +
          varCppA +
          varCppB +
          `    cin >> x;\n` +
          `    while (x != 0) {\n` +
          preambleCppA +
          cppAggBody +
          preambleCppB +
          `        if (${condB.cpp}) {\n` +
          `            cnt_flag++;\n` +
          `        }\n` +
          `        cin >> x;\n` +
          `    }\n` +
          (agg === 'sum'
            ? `    cout << s << endl;\n`
            : agg === 'count'
            ? `    cout << cnt_agg << endl;\n`
            : agg === 'max'
            ? `    cout << mx << endl;\n`
            : `    cout << mn << endl;\n`) +
          `    if (cnt_flag ${direction === 'gte' ? '>=' : '<='} ${threshold}) {\n` +
          `        cout << "YES" << endl;\n` +
          `    } else {\n` +
          `        cout << "NO" << endl;\n` +
          `    }\n` +
          `    return 0;\n` +
          `}`;
      }
    }

    const hint = loopKind === 'for'
      ? `Заведите отдельные переменные для ответа первой строки (агрегации) и для подсчёта количества элементов, удовлетворяющих условию второй строки (флага).\n` +
        `В цикле N раз считывайте числа, обновляйте значение первой строки и увеличивайте счётчик флага при выполнении соответствующего условия.\n` +
        `После завершения цикла выведите результат агрегации в первой строке и «YES»/«NO» во второй.` +
        (agg === 'avg' ? '\nДля вычисления среднего с 1 знаком после запятой используйте целочисленную формулу с округлением, чтобы избежать погрешностей вещественной арифметики.' : '')
      : `Заведите отдельные переменные для ответа первой строки (агрегации) и для подсчёта количества элементов, удовлетворяющих условию второй строки (флага).\n` +
        `Считывайте числа в цикле while x != 0 (первое число считывается до цикла, каждое следующее — в конце тела цикла). Завершающий ноль в последовательность не входит.\n` +
        `Внутри цикла обновляйте значение первой строки и увеличивайте счётчик флага при выполнении соответствующего условия.\n` +
        `После завершения цикла выведите результат агрегации в первой строке и «YES»/«NO» во второй.` +
        (agg === 'avg' ? '\nДля вычисления среднего с 1 знаком после запятой ведите также счётчик всех обработанных элементов и используйте целочисленную формулу с округлением.' : '');

    let aggStep4 = '';
    if (scheme === 'A') {
      if (agg === 'avg') aggStep4 = '4. Вычислять сумму s всех элементов последовательности.';
      else if (agg === 'sum') aggStep4 = '4. Добавлять x к общей сумме s.';
      else if (agg === 'max') aggStep4 = '4. Если x > mx, обновлять значение максимума mx = x.';
      else if (agg === 'min') aggStep4 = '4. Если x < mn, обновлять значение минимума mn = x.';
    } else {
      if (agg === 'sum') aggStep4 = `4. Если x ${condA!.textSingular}, добавлять x к общей сумме s.`;
      else if (agg === 'count') aggStep4 = `4. Если x ${condA!.textSingular}, увеличивать счётчик cnt_agg на 1.`;
      else if (agg === 'max') aggStep4 = `4. Если x ${condA!.textSingular} и x > mx, обновлять значение максимума mx = x.`;
      else if (agg === 'min') aggStep4 = `4. Если x ${condA!.textSingular} и x < mn, обновлять значение минимума mn = x.`;
    }

    const explanation = loopKind === 'for'
      ? `Алгоритм решения:\n` +
        `1. Считать количество элементов N.\n` +
        `2. Инициализировать переменные для агрегации и счётчик флага (cnt_flag = 0).\n` +
        `3. В цикле N раз считывать очередной элемент x.\n` +
        `${aggStep4}\n` +
        `5. Проверять условие флага (вторая строка): если x удовлетворяет условию, увеличивать cnt_flag на 1.\n` +
        `6. После завершения цикла выводим сначала результат первой строки, а во второй строке «YES», если ${flagStr}, иначе «NO».\n\n` +
        `Способы проверки флага:\n` +
        `— Основной способ: вести счётчик подходящих элементов и по окончании цикла сравнить его с порогом ${threshold}.\n` +
        `— Альтернативный способ (для порога 1): использовать логическую флаг-переменную, переключаемую в True при первом совпадении.` +
        (agg === 'avg' && scheme === 'A'
          ? `\n\nТипичная ошибка: делить сумму подходящих под условие флага элементов на их количество, тогда как требуется среднее арифметическое ВСЕХ N элементов всей последовательности.`
          : scheme === 'B'
          ? `\n\nТипичная ошибка: путать условия для первой и второй строк и вычислять агрегацию по условию флага.`
          : '')
      : `Алгоритм решения:\n` +
        `1. Инициализировать переменные для агрегации, счётчик флага (cnt_flag = 0) и считать первое число x.\n` +
        `2. В цикле while x != 0 обрабатывать элементы до появления нуля.\n` +
        `${aggStep4}\n` +
        `4. Проверять условие флага (вторая строка): если x удовлетворяет условию, увеличивать cnt_flag на 1.\n` +
        `5. Считывать следующее число x в конце тела цикла.\n` +
        `6. После завершения цикла выводим сначала результат первой строки, а во второй строке «YES», если ${flagStr}, иначе «NO».\n\n` +
        `Способы проверки флага:\n` +
        `— Основной способ: вести счётчик подходящих элементов и по окончании цикла сравнить его с порогом ${threshold}.\n` +
        `— Альтернативный способ (для порога 1): использовать логическую флаг-переменную, переключаемую в True при первом совпадении.` +
        (agg === 'avg' && scheme === 'A'
          ? `\n\nТипичная ошибка: делить сумму подходящих под условие флага элементов на их количество, тогда как требуется среднее арифметическое ВСЕХ элементов всей последовательности.`
          : scheme === 'B'
          ? `\n\nТипичная ошибка: путать условия для первой и второй строк и вычислять агрегацию по условию флага.`
          : '');

    return {
      kind: loopKind,
      aggregation: agg,
      statement,
      sampleInput,
      sampleOutput,
      tests: tests.map((t) => ({ input: t.input, expected: t.expected })),
      solutionCode: {
        python: pyCode,
        pascal: pasCode,
        cpp: cppCode
      },
      hint,
      explanation
    };
  }
}

const LIGHT_FAMILIES: CondFamily[] = [
  'parity',
  'divisibility',
  'compare',
  'decimal',
  'div_and_not_div'
];

const HEAVY_FAMILIES: CondFamily[] = [
  'radix_sum_div',
  'radix_has_digit',
  'perfect_square',
  'decimal_palindrome',
  'decimal_sum_div',
  'decimal_first_digit'
];

const INTEGER_FAMILIES: CondFamily[] = ['parity', 'divisibility', 'compare'];

export function generateL3(rng: ReturnType<typeof makeRng>): Task16Data {
  for (let attempt = 0; attempt < 200; attempt++) {
    const loopKind = rng.pick(['for', 'while'] as const);
    const outputMode = rng.pick(['two', 'one', 'pair'] as const);
    const LIMIT = rng.pick([100, 300, 500, 1000, 3000, 5000, 10000]);
    const NMAX = rng.pick([30, 50, 100, 300, 1000]);

    if (outputMode === 'pair') {
      const agg = rng.pick(['max', 'min'] as const);
      const isIntegerMode = rng.pick([true, false]);

      const families: CondFamily[] = isIntegerMode
        ? INTEGER_FAMILIES
        : [...LIGHT_FAMILIES, ...HEAVY_FAMILIES];

      const famA = rng.pick(families);
      if (LIMIT < 1000 && HEAVY_FAMILIES.includes(famA)) continue;

      const condA = makeConditionForFamily(famA, rng, LIMIT, isIntegerMode, agg, '_a');
      if (condA.preamble) continue;

      const minVal = isIntegerMode ? -LIMIT : 1;
      const maxVal = LIMIT;
      const candidates: number[] = [];

      for (let x = minVal; x <= maxVal; x++) {
        if (x !== 0) candidates.push(x);
      }

      const poolA: number[] = [];
      const poolNotA: number[] = [];
      for (let i = 0; i < candidates.length; i++) {
        const x = candidates[i];
        if (condA.test(x)) poolA.push(x);
        else poolNotA.push(x);
      }

      if (poolA.length < 5 || poolNotA.length < 5) continue;

      const sortedPoolA = [...poolA].sort((a, b) => (agg === 'max' ? a - b : b - a));

      const otherRoles = rng.shuffle([
        'dupMax',
        'laterSuitable',
        'firstPos',
        'lastPos'
      ] as const);

      const roles: ('unsuitablePrefix' | 'dupMax' | 'laterSuitable' | 'firstPos' | 'lastPos')[] = [
        'unsuitablePrefix',
        ...otherRoles
      ];

      const shortIdx = rng.pick([0, 1, 2, 3, 4]);
      const remainingIndices = [0, 1, 2, 3, 4].filter((i) => i !== shortIdx);
      const longIdx = rng.pick(remainingIndices);

      const testNs: number[] = [];
      for (let t = 0; t < 5; t++) {
        if (t === shortIdx) {
          testNs.push(rng.int(3, 5));
        } else if (t === longIdx) {
          testNs.push(rng.int(20, 30));
        } else {
          testNs.push(rng.int(6, 12));
        }
      }

      const tests: { input: string; expected: string; nums: number[] }[] = [];
      let validSuite = true;

      for (let t = 0; t < 5; t++) {
        const N = testNs[t];
        const role = roles[t];
        let testBuilt = false;

        for (let testAttempt = 0; testAttempt < 20; testAttempt++) {
          const halfStart = Math.floor(sortedPoolA.length / 2);
          const optVal = sortedPoolA[rng.int(halfStart, sortedPoolA.length - 1)];

          const poolASub = poolA.filter((x) => (agg === 'max' ? x < optVal : x > optVal));
          if (poolASub.length < 1) continue;

          const nums: number[] = new Array(N);

          if (role === 'firstPos') {
            nums[0] = optVal;
            const numOtherA = Math.min(rng.int(1, 3), N - 1);
            const otherVals: number[] = [];
            for (let i = 0; i < numOtherA; i++) otherVals.push(rng.pick(poolASub));
            for (let i = 0; i < (N - 1 - numOtherA); i++) otherVals.push(rng.pick(poolNotA));
            const shuffledRest = rng.shuffle(otherVals);
            for (let i = 0; i < N - 1; i++) nums[i + 1] = shuffledRest[i];
          } else if (role === 'lastPos') {
            nums[N - 1] = optVal;
            const numOtherA = Math.min(rng.int(1, 3), N - 1);
            const otherVals: number[] = [];
            for (let i = 0; i < numOtherA; i++) otherVals.push(rng.pick(poolASub));
            for (let i = 0; i < (N - 1 - numOtherA); i++) otherVals.push(rng.pick(poolNotA));
            const shuffledRest = rng.shuffle(otherVals);
            for (let i = 0; i < N - 1; i++) nums[i] = shuffledRest[i];
          } else if (role === 'unsuitablePrefix') {
            const pOpt = N <= 3 ? 2 : rng.int(2, N - 1);
            nums[pOpt] = optVal;
            for (let i = 0; i < pOpt; i++) nums[i] = rng.pick(poolNotA);
            const numOtherA = Math.min(rng.int(1, 3), N - 1 - pOpt);
            const remainingVals: number[] = [];
            for (let i = 0; i < numOtherA; i++) remainingVals.push(rng.pick(poolASub));
            for (let i = 0; i < (N - 1 - pOpt - numOtherA); i++) remainingVals.push(rng.pick(poolNotA));
            const shuffledRest = rng.shuffle(remainingVals);
            for (let i = pOpt + 1; i < N; i++) nums[i] = shuffledRest[i - (pOpt + 1)];
          } else if (role === 'laterSuitable') {
            const pOpt = rng.int(0, N - 2);
            nums[pOpt] = optVal;
            const pSub = rng.int(pOpt + 1, N - 1);
            nums[pSub] = rng.pick(poolASub);
            for (let i = 0; i < N; i++) {
              if (i !== pOpt && i !== pSub) {
                nums[i] = rng.pick(rng.pick([true, false]) ? poolASub : poolNotA);
              }
            }
          } else if (role === 'dupMax') {
            const p1 = rng.int(0, Math.max(0, N - 3));
            const p2 = p1 + rng.int(2, Math.max(2, N - 1 - p1));
            nums[p1] = optVal;
            nums[p2] = optVal;
            for (let i = 0; i < N; i++) {
              if (i !== p1 && i !== p2) {
                nums[i] = rng.pick(rng.pick([true, false]) ? poolASub : poolNotA);
              }
            }
          }

          let bestVal = 0;
          let bestIdx = 0;
          let found = false;

          for (let i = 0; i < N; i++) {
            const x = nums[i];
            if (condA.test(x)) {
              if (!found || (agg === 'max' ? x > bestVal : x < bestVal)) {
                bestVal = x;
                bestIdx = i + 1;
                found = true;
              }
            }
          }

          if (!found) continue;

          if (role === 'firstPos' && bestIdx !== 1) continue;
          if (role === 'lastPos' && bestIdx !== N) continue;
          if (role === 'unsuitablePrefix') {
            if (bestIdx < 3) continue;
            let unsuitBefore = 0;
            for (let i = 0; i < bestIdx - 1; i++) {
              if (!condA.test(nums[i])) unsuitBefore++;
            }
            if (unsuitBefore < 2) continue;
          }
          if (role === 'laterSuitable') {
            let hasLater = false;
            for (let i = bestIdx; i < N; i++) {
              if (condA.test(nums[i])) { hasLater = true; break; }
            }
            if (!hasLater) continue;
          }
          if (role === 'dupMax') {
            const indicesOfBest: number[] = [];
            for (let i = 0; i < N; i++) {
              if (nums[i] === bestVal) indicesOfBest.push(i + 1);
            }
            if (indicesOfBest.length < 2 || indicesOfBest[1] < indicesOfBest[0] + 2) {
              continue;
            }
          }

          const testInput = loopKind === 'while'
            ? `${nums.join('\n')}\n0`
            : `${N}\n${nums.join('\n')}`;

          tests.push({
            input: testInput,
            expected: `${bestVal}\n${bestIdx}`,
            nums
          });
          testBuilt = true;
          break;
        }

        if (!testBuilt) {
          validSuite = false;
          break;
        }
      }

      if (!validSuite || tests.length < 5) continue;

      return buildTask16L3Data(
        LIMIT, NMAX, isIntegerMode, agg, 'B', 1, 'gte', condA, null, tests, 'pair', loopKind
      );
    } else if (outputMode === 'one') {
      const agg = rng.pick(['max', 'min'] as const);
      const isIntegerMode = rng.pick([true, false]);

      const families: CondFamily[] = isIntegerMode
        ? INTEGER_FAMILIES
        : [...LIGHT_FAMILIES, ...HEAVY_FAMILIES];

      const famA = rng.pick(families);
      if (LIMIT < 1000 && HEAVY_FAMILIES.includes(famA)) continue;

      const condA = makeConditionForFamily(famA, rng, LIMIT, isIntegerMode, agg, '_a');
      if (loopKind === 'while' && condA.preamble) continue;

      const minVal = isIntegerMode ? -LIMIT : 1;
      const maxVal = LIMIT;
      const candidates: number[] = [];

      for (let x = minVal; x <= maxVal; x++) {
        if (x !== 0) candidates.push(x);
      }

      const poolA: number[] = [];
      const poolNotA: number[] = [];
      for (let i = 0; i < candidates.length; i++) {
        const x = candidates[i];
        if (condA.test(x)) poolA.push(x);
        else poolNotA.push(x);
      }

      if (poolA.length < 5 || poolNotA.length < 5) continue;

      let poolASpecial: number[] = [];
      if (isIntegerMode) {
        if (agg === 'max') {
          poolASpecial = poolA.filter((x) => x < 0);
        } else {
          poolASpecial = poolA.filter((x) => x > 0);
        }
        if (poolASpecial.length < 2) continue;
      }

      const availableForNo = [1, 2, 3, 4];
      const noIdx = rng.pick(availableForNo);
      const availableForOne = [1, 2, 3, 4].filter((i) => i !== noIdx);
      const oneIdx = rng.pick(availableForOne);
      const remainingForSpecial = [0, 1, 2, 3, 4].filter((i) => i !== noIdx && i !== oneIdx);
      const specialIdx = rng.pick(remainingForSpecial);

      const testNs: number[] = [];
      const targetACnts: number[] = [];

      for (let t = 0; t < 5; t++) {
        if (t === noIdx) {
          testNs.push(rng.int(3, 5));
          targetACnts.push(0);
        } else if (t === oneIdx) {
          testNs.push(t === 4 ? rng.int(20, 30) : rng.int(5, 10));
          targetACnts.push(1);
        } else if (t === specialIdx) {
          testNs.push(t === 4 ? rng.int(20, 30) : rng.int(6, 12));
          targetACnts.push(rng.int(2, 4));
        } else if (t === 4) {
          testNs.push(rng.int(20, 30));
          targetACnts.push(rng.int(2, 5));
        } else {
          testNs.push(rng.int(6, 12));
          targetACnts.push(rng.int(2, 4));
        }
      }

      const tests: { input: string; expected: string; nums: number[]; cntA: number; allASpecial: boolean; trapDiff: boolean }[] = [];
      let validSuite = true;

      for (let t = 0; t < 5; t++) {
        const N = testNs[t];
        const targetA = targetACnts[t];
        if (targetA > N) {
          validSuite = false;
          break;
        }
        const targetNotA = N - targetA;

        let testBuilt = false;
        for (let testAttempt = 0; testAttempt < 20; testAttempt++) {
          let nums: number[] = [];
          if (isIntegerMode && t === specialIdx) {
            for (let i = 0; i < targetA; i++) nums.push(rng.pick(poolASpecial));
          } else {
            for (let i = 0; i < targetA; i++) nums.push(rng.pick(poolA));
          }
          for (let i = 0; i < targetNotA; i++) nums.push(rng.pick(poolNotA));
          nums = rng.shuffle(nums);

          const aNums = nums.filter((x) => condA.test(x));
          const cntA = aNums.length;

          if (cntA !== targetA) continue;

          const globalExt = agg === 'max' ? Math.max(...nums) : Math.min(...nums);
          const extOfA = cntA === 0 ? null : (agg === 'max' ? Math.max(...aNums) : Math.min(...aNums));
          const trapDiff = cntA === 0 || extOfA !== globalExt;

          if (targetA >= 1 && !trapDiff) continue;

          const allASpecial = cntA > 0 && (
            agg === 'max'
              ? aNums.every((x) => x < 0)
              : aNums.every((x) => x > 0)
          );
          const expected = cntA === 0 ? 'NO' : String(extOfA);

          const testInput = loopKind === 'while'
            ? `${nums.join('\n')}\n0`
            : `${N}\n${nums.join('\n')}`;

          tests.push({
            input: testInput,
            expected,
            nums,
            cntA,
            allASpecial,
            trapDiff
          });
          testBuilt = true;
          break;
        }

        if (!testBuilt) {
          validSuite = false;
          break;
        }
      }

      if (!validSuite || tests.length < 5) continue;

      const hasZero = tests.some((t) => t.cntA === 0);
      const hasOne = tests.some((t) => t.cntA === 1);
      const ge2Count = tests.filter((t) => t.cntA >= 2).length;
      const hasSpecialTest = isIntegerMode ? tests.some((t) => t.cntA > 0 && t.allASpecial) : true;
      const sampleValid = tests[0].cntA >= 2;

      // trapDiff гарантирован внутри ретрая генерации nums
      if (!hasZero || !hasOne || ge2Count < 3 || !hasSpecialTest || !sampleValid) continue;

      return buildTask16L3Data(
        LIMIT, NMAX, isIntegerMode, agg, 'B', 1, 'gte', condA, null, tests, 'one', loopKind
      );
    } else {
      const scheme = rng.pick(['A', 'B'] as const);
      const agg = scheme === 'A'
        ? rng.pick(['avg', 'sum', 'max', 'min'] as const)
        : rng.pick(['sum', 'count', 'max', 'min'] as const);
      if (loopKind === 'while' && agg === 'avg') continue;
      const isIntegerMode = agg === 'avg' ? false : rng.pick([true, false]);

      const threshold = rng.int(1, 3);
      const direction = rng.pick(['gte', 'lte'] as const);

      const families: CondFamily[] = isIntegerMode
        ? INTEGER_FAMILIES
        : [...LIGHT_FAMILIES, ...HEAVY_FAMILIES];

      let condA: Condition | null = null;
      let condB: Condition;

      if (scheme === 'B') {
        const famA = rng.pick(families);
        const isHeavyA = HEAVY_FAMILIES.includes(famA);
        const possibleB = isHeavyA
          ? families.filter((f) => LIGHT_FAMILIES.includes(f) && f !== famA)
          : families.filter((f) => f !== famA);

        if (possibleB.length === 0) continue;

        const famB = rng.pick(possibleB);
        if (LIMIT < 1000 && (HEAVY_FAMILIES.includes(famA) || HEAVY_FAMILIES.includes(famB)))
          continue;

        condA = makeConditionForFamily(famA, rng, LIMIT, isIntegerMode, agg, '_a');
        condB = makeConditionForFamily(famB, rng, LIMIT, isIntegerMode, undefined, '_b');

        if (condA.preamble && condB.preamble) continue;
        if (loopKind === 'while' && (condA.preamble || condB.preamble)) continue;
      } else {
        const famB = rng.pick(families);
        if (LIMIT < 1000 && HEAVY_FAMILIES.includes(famB)) continue;

        condB = makeConditionForFamily(famB, rng, LIMIT, isIntegerMode, undefined, '_b');
        if (loopKind === 'while' && condB.preamble) continue;
      }

      const minVal = isIntegerMode ? -LIMIT : 1;
      const maxVal = LIMIT;
      const candidates: number[] = [];

      for (let x = minVal; x <= maxVal; x++) {
        if (x !== 0) candidates.push(x);
      }

      const targetCnts = [
        threshold,
        threshold === 1 ? rng.pick([3, 4]) : threshold - 1,
        0,
        threshold + 1,
        rng.pick([threshold, threshold + 1, 0])
      ];

      const maxTarget = Math.max(...targetCnts);
      let assignedLong = false;
      let assignedShort = false;

      const testNs: number[] = [];
      for (let t = 0; t < 5; t++) {
        if (!assignedShort && targetCnts[t] === 0) {
          testNs.push(rng.int(2, 4));
          assignedShort = true;
        } else if (!assignedLong && targetCnts[t] === maxTarget) {
          testNs.push(rng.int(20, 30));
          assignedLong = true;
        } else {
          testNs.push(rng.int(6, 12));
        }
      }

      let validSuite = true;

      if (scheme === 'A') {
        const poolB = candidates.filter((x) => condB.test(x));
        const poolNotB = candidates.filter((x) => !condB.test(x));

        if (poolB.length < 5 || poolNotB.length < 5) continue;

        const tests: { input: string; expected: string; nums: number[]; cntB: number; trapDiff: boolean; bNumsCount: number }[] = [];

        for (let t = 0; t < 5; t++) {
          const N = testNs[t];
          const targetB = targetCnts[t];
          if (targetB > N) {
            validSuite = false;
            break;
          }
          const targetNotB = N - targetB;

          let nums: number[] = [];
          let sum = 0;
          let cntB = 0;
          let validNums = false;
          let line1 = '';
          let bNums: number[] = [];
          let trapDiff = false;

          for (let numAttempt = 0; numAttempt < 20; numAttempt++) {
            nums = [];
            for (let i = 0; i < targetB; i++) nums.push(rng.pick(poolB));
            for (let i = 0; i < targetNotB; i++) nums.push(rng.pick(poolNotB));
            nums = rng.shuffle(nums);

            sum = nums.reduce((a, b) => a + b, 0);
            cntB = nums.filter((x) => condB.test(x)).length;

            if (cntB !== targetB) continue;

            if (agg === 'avg') {
              if (Math.abs(20 * sum) % (2 * N) === N) {
                continue;
              }
            }

            if (agg === 'avg') {
              const avg10 = Math.floor((10 * sum + Math.floor(N / 2)) / N);
              line1 = `${Math.floor(avg10 / 10)}.${Math.abs(avg10 % 10)}`;
            } else if (agg === 'sum') {
              line1 = String(sum);
            } else if (agg === 'max') {
              line1 = String(Math.max(...nums));
            } else {
              line1 = String(Math.min(...nums));
            }

            bNums = nums.filter((x) => condB.test(x));
            trapDiff = false;
            if (bNums.length === 0) {
              trapDiff = true;
            } else {
              let trapLine1 = '';
              if (agg === 'avg') {
                const sumB = bNums.reduce((a, b) => a + b, 0);
                const NB = bNums.length;
                const avg10B = Math.floor((10 * sumB + Math.floor(NB / 2)) / NB);
                trapLine1 = `${Math.floor(avg10B / 10)}.${Math.abs(avg10B % 10)}`;
              } else if (agg === 'sum') {
                trapLine1 = String(bNums.reduce((a, b) => a + b, 0));
              } else if (agg === 'max') {
                trapLine1 = String(Math.max(...bNums));
              } else {
                trapLine1 = String(Math.min(...bNums));
              }
              trapDiff = line1 !== trapLine1;
            }

            if (bNums.length >= 1 && !trapDiff) continue;

            validNums = true;
            break;
          }

          if (!validNums) {
            validSuite = false;
            break;
          }

          const flag = direction === 'gte' ? cntB >= threshold : cntB <= threshold;

          const testInput = loopKind === 'while'
            ? `${nums.join('\n')}\n0`
            : `${N}\n${nums.join('\n')}`;

          tests.push({
            input: testInput,
            expected: `${line1}\n${flag ? 'YES' : 'NO'}`,
            nums,
            cntB,
            trapDiff,
            bNumsCount: bNums.length
          });
        }

        if (!validSuite || tests.length < 5) continue;

        const hasThreshold = tests.some((t) => t.cntB === threshold);
        const hasZero = tests.some((t) => t.cntB === 0);
        const hasThresholdMinus1 = threshold > 1 ? tests.some((t) => t.cntB === threshold - 1) : true;
        const hasYes = tests.some((t) => t.expected.endsWith('YES'));
        const hasNo = tests.some((t) => t.expected.endsWith('NO'));
        const trapDiffCount = tests.filter((t) => t.trapDiff).length;
        const nonZeroTrapDiffCount = tests.filter((t) => t.bNumsCount >= 1 && t.trapDiff).length;
        const hasSampleTrapDiff = tests[0].trapDiff;

        if (!hasThreshold || !hasZero || !hasThresholdMinus1 || !hasYes || !hasNo || !hasSampleTrapDiff || trapDiffCount < 3 || nonZeroTrapDiffCount < 2) continue;

        return buildTask16L3Data(
          LIMIT, NMAX, isIntegerMode, agg, scheme, threshold, direction, null, condB, tests, 'two', loopKind
        );
      } else {
        const poolBoth: number[] = [];
        const poolAOnly: number[] = [];
        const poolBOnly: number[] = [];
        const poolNeither: number[] = [];
        for (let i = 0; i < candidates.length; i++) {
          const x = candidates[i];
          const tA = condA!.test(x);
          const tB = condB.test(x);
          if (tA && tB) poolBoth.push(x);
          else if (tA && !tB) poolAOnly.push(x);
          else if (!tA && tB) poolBOnly.push(x);
          else poolNeither.push(x);
        }

        if (
          poolBoth.length < 3 ||
          poolAOnly.length < 3 ||
          poolBOnly.length < 3 ||
          poolNeither.length < 3
        ) {
          continue;
        }

        const tests: { input: string; expected: string; nums: number[]; cntB: number; trapDiff: boolean; bNumsCount: number }[] = [];

        for (let t = 0; t < 5; t++) {
          const N = testNs[t];
          const targetB = targetCnts[t];
          if (targetB > N) {
            validSuite = false;
            break;
          }

          const targetNotB = N - targetB;

          let kBoth = targetB > 0 ? rng.int(1, Math.min(targetB, poolBoth.length)) : 0;
          let kBOnly = targetB - kBoth;
          if (kBOnly > poolBOnly.length) {
            kBOnly = poolBOnly.length;
            kBoth = targetB - kBOnly;
          }

          let kAOnly = targetNotB > 0 ? rng.int(0, Math.min(targetNotB, poolAOnly.length)) : 0;
          let kNeither = targetNotB - kAOnly;
          if (kNeither > poolNeither.length) {
            kNeither = poolNeither.length;
            kAOnly = targetNotB - kNeither;
          }

          if (kBoth + kAOnly === 0) {
            if (kAOnly < poolAOnly.length && kNeither > 0) {
              kAOnly++;
              kNeither--;
            } else if (kBoth < poolBoth.length && kBOnly > 0) {
              kBoth++;
              kBOnly--;
            } else {
              validSuite = false;
              break;
            }
          }

          let nums: number[] = [];
          for (let i = 0; i < kBoth; i++) nums.push(rng.pick(poolBoth));
          for (let i = 0; i < kBOnly; i++) nums.push(rng.pick(poolBOnly));
          for (let i = 0; i < kAOnly; i++) nums.push(rng.pick(poolAOnly));
          for (let i = 0; i < kNeither; i++) nums.push(rng.pick(poolNeither));

          nums = rng.shuffle(nums);

          const aNums = nums.filter((x) => condA!.test(x));
          const bNums = nums.filter((x) => condB.test(x));
          const cntB = bNums.length;

          if (cntB !== targetB || ((agg === 'max' || agg === 'min') && aNums.length === 0)) {
            validSuite = false;
            break;
          }

          const flag = direction === 'gte' ? cntB >= threshold : cntB <= threshold;

          let line1 = '';
          if (agg === 'sum') {
            line1 = String(aNums.reduce((a, b) => a + b, 0));
          } else if (agg === 'count') {
            line1 = String(aNums.length);
          } else if (agg === 'max') {
            line1 = String(Math.max(...aNums));
          } else {
            line1 = String(Math.min(...aNums));
          }

          let trapDiff = false;
          if (bNums.length === 0) {
            trapDiff = true;
          } else {
            let trapLine1 = '';
            if (agg === 'sum') {
              trapLine1 = String(bNums.reduce((a, b) => a + b, 0));
            } else if (agg === 'count') {
              trapLine1 = String(bNums.length);
            } else if (agg === 'max') {
              trapLine1 = String(Math.max(...bNums));
            } else {
              trapLine1 = String(Math.min(...bNums));
            }
            trapDiff = line1 !== trapLine1;
          }

          const testInput = loopKind === 'while'
            ? `${nums.join('\n')}\n0`
            : `${N}\n${nums.join('\n')}`;

          tests.push({
            input: testInput,
            expected: `${line1}\n${flag ? 'YES' : 'NO'}`,
            nums,
            cntB,
            trapDiff,
            bNumsCount: bNums.length
          });
        }

        if (!validSuite || tests.length < 5) continue;

        const hasThreshold = tests.some((t) => t.cntB === threshold);
        const hasZero = tests.some((t) => t.cntB === 0);
        const hasThresholdMinus1 = threshold > 1 ? tests.some((t) => t.cntB === threshold - 1) : true;
        const hasYes = tests.some((t) => t.expected.endsWith('YES'));
        const hasNo = tests.some((t) => t.expected.endsWith('NO'));
        const trapDiffCount = tests.filter((t) => t.trapDiff).length;
        const nonZeroTrapDiffCount = tests.filter((t) => t.bNumsCount >= 1 && t.trapDiff).length;
        const hasSampleTrapDiff = tests[0].trapDiff;

        if (!hasThreshold || !hasZero || !hasThresholdMinus1 || !hasYes || !hasNo || !hasSampleTrapDiff || trapDiffCount < 3 || nonZeroTrapDiffCount < 2) continue;

        return buildTask16L3Data(
          LIMIT, NMAX, isIntegerMode, agg, scheme, threshold, direction, condA, condB, tests, 'two', loopKind
        );
      }
    }
  }

  // Fallback variant to guarantee no throw
  const fbLimit = 1000;
  const fbAgg = 'sum';
  const fbScheme = 'A';
  const fbIsInteger = false;
  const fbThreshold = 2;
  const fbDirection = 'gte';
  const fbCondB: Condition = {
    family: 'parity',
    textPlural: 'чётны',
    textSingular: 'чётно',
    textGenitivePlural: 'чётных чисел',
    test: (x) => x % 2 === 0,
    py: 'x % 2 == 0',
    pas: 'x mod 2 = 0',
    cpp: 'x % 2 == 0'
  };

  const fbCandidates: number[] = [];
  for (let x = 1; x <= fbLimit; x++) fbCandidates.push(x);

  const fbPoolB = fbCandidates.filter((x) => fbCondB.test(x));
  const fbPoolNotB = fbCandidates.filter((x) => !fbCondB.test(x));

  const fbTestNs = [4, 25, 8, 8, 8];
  const fbTargetCnts = [2, 1, 0, 3, 2];

  const tests: { input: string; expected: string; nums: number[] }[] = [];
  for (let t = 0; t < 5; t++) {
    const N = fbTestNs[t];
    const targetB = Math.min(N, fbTargetCnts[t]);
    const targetNotB = N - targetB;

    let nums: number[] = [];
    for (let i = 0; i < targetB; i++) nums.push(rng.pick(fbPoolB));
    for (let i = 0; i < targetNotB; i++) nums.push(rng.pick(fbPoolNotB));
    nums = rng.shuffle(nums);

    const sum = nums.reduce((a, b) => a + b, 0);
    const cntB = nums.filter((x) => fbCondB.test(x)).length;
    const flag = cntB >= fbThreshold;
    tests.push({
      input: `${N}\n${nums.join('\n')}`,
      expected: `${sum}\n${flag ? 'YES' : 'NO'}`,
      nums
    });
  }

  const fbNMAX = rng.pick([30, 50, 100, 300, 1000]);

  return buildTask16L3Data(
    fbLimit, fbNMAX, fbIsInteger, fbAgg, fbScheme, fbThreshold, fbDirection, null, fbCondB, tests, 'two', 'for'
  );
}

export const task16: TaskModule = {
  id: 16,
  title: 'Программирование (Обработка числовой последовательности)',
  description: 'Написание и отладка программы обработки последовательности чисел на Python.',
  topics: ['Программирование', 'Обработка последовательностей'], // TODO: уточнить формулировки
  maxPoints: 2,

  generate: (difficulty: Difficulty, rng: ReturnType<typeof makeRng>): Task16Data => {
    if (difficulty === 3) {
      return generateL3(rng);
    }
    if (difficulty === 2) {
      return generateL2(rng);
    }
    const LIMIT = rng.pick([1000, 3000, 5000, 10000, 30000]);
    const NMAX = rng.pick([100, 300, 500, 1000]);

    const templates = [
      'sum',
      'count_even',
      'count_odd',
      'count_gt_x',
      'max',
      'min',
      'count_div_k'
    ];

    const chosenTemplate = rng.pick(templates);

    let statement = '';
    let solutionCode = {
      python: '',
      pascal: '',
      cpp: ''
    };
    let explanation = '';
    let hint = '';
    let calc: (nums: number[]) => number = () => 0;

    let testCases: number[][] = [];
    let X = 0;
    let k = 0;

    switch (chosenTemplate) {
      case 'sum': {
        statement =
          'Напишите программу, которая вычисляет сумму последовательности натуральных чисел.\n' +
          `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), а затем N натуральных чисел, не превышающих ${LIMIT}, каждое с новой строки.\n` +
          'Программа должна вывести одно число — сумму всех введённых чисел.';

        calc = (nums) => nums.reduce((a, b) => a + b, 0);

        hint =
          'Так как количество элементов N известно, число повторений цикла задано заранее. До начала цикла создайте переменную-накопитель и присвойте ей значение 0. Внутри цикла считывайте очередное число и прибавляйте его к накопителю. Результат выводите один раз после завершения цикла, а не на каждом шаге.';

        explanation =
          `Алгоритм решения:\n` +
          `1. Считываем количество элементов N.\n` +
          `2. Создаём переменную-накопитель s = 0 для хранения текущей суммы.\n` +
          `3. В цикле N раз считываем очередное число x и прибавляем его к сумме (s += x).\n` +
          `4. По завершении цикла выводим полученную сумму s.\n` +
          `Типичная ошибка: вывод внутри цикла вместо вывода после него.`;

        solutionCode = {
          python: `n = int(input())\ns = 0\nfor _ in range(n):\n    x = int(input())\n    s += x\nprint(s)`,
          pascal: `var n, i, x: integer;\n  s: int64;\nbegin\n  readln(n);\n  s := 0;\n  for i := 1 to n do\n  begin\n    readln(x);\n    s := s + x;\n  end;\n  writeln(s);\nend.`,
          cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x;\n    long long s = 0;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        s += x;\n    }\n    cout << s;\n    return 0;\n}`
        };

        const nSample = rng.int(3, 5);
        const sampleNums = Array.from({ length: nSample }, () => rng.int(5, 50));

        const n2 = rng.int(6, 8);
        const test2 = Array.from({ length: n2 }, (_, i) => {
          if (i % 3 === 0) return rng.int(1, Math.min(100, LIMIT));
          if (i % 3 === 1) return rng.int(Math.floor(LIMIT / 4), Math.floor(LIMIT / 2));
          return rng.int(Math.floor(LIMIT / 2), LIMIT);
        });

        const test3 = [rng.int(10, Math.min(500, LIMIT))];

        const n4 = rng.int(3, 6);
        const test4 = Array.from({ length: n4 }, () => 1);

        const n5 = rng.int(3, 6);
        const test5 = Array.from({ length: n5 }, () => rng.int(Math.max(1, LIMIT - 20), LIMIT));

        testCases = [sampleNums, test2, test3, test4, test5];
        break;
      }

      case 'count_even': {
        statement =
          'Напишите программу, которая определяет количество чётных чисел в последовательности.\n' +
          `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), а затем N натуральных чисел, не превышающих ${LIMIT}, каждое с новой строки.\n` +
          'Программа должна вывести одно число — количество чётных чисел.';

        calc = (nums) => nums.filter((x) => x % 2 === 0).length;

        hint =
          'Заведите переменную-счётчик и перед циклом присвойте ей ноль. Внутри цикла проверяйте остаток от деления очередного числа на 2. Если число чётное, увеличивайте счётчик ровно на единицу, а не прибавляйте само введённое число. Выведите счётчик по окончании цикла.';

        explanation =
          `Алгоритм решения:\n` +
          `1. Считываем количество элементов N.\n` +
          `2. Создаём переменную-счётчик count = 0.\n` +
          `3. В цикле N раз считываем очередное число x и проверяем условие чётности (x % 2 == 0). Если остаток от деления на 2 равен 0, увеличиваем счётчик count на 1.\n` +
          `4. По завершении цикла выводим значение счётчика count.\n` +
          `Типичная ошибка: прибавляют само число вместо единицы.`;

        solutionCode = {
          python: `n = int(input())\ncount = 0\nfor _ in range(n):\n    x = int(input())\n    if x % 2 == 0:\n        count += 1\nprint(count)`,
          pascal: `var n, i, x, count: integer;\nbegin\n  readln(n);\n  count := 0;\n  for i := 1 to n do\n  begin\n    readln(x);\n    if x mod 2 = 0 then\n      count := count + 1;\n  end;\n  writeln(count);\nend.`,
          cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x, count = 0;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (x % 2 == 0) count++;\n    }\n    cout << count;\n    return 0;\n}`
        };

        const nSample = rng.int(3, 5);
        const sampleNums = Array.from({ length: nSample }, () => rng.int(1, 100));

        const n2 = rng.int(6, 8);
        const test2 = Array.from({ length: n2 }, () => {
          const mult = rng.int(1, Math.max(1, Math.floor(LIMIT / 2)));
          return mult * 2;
        });

        const n3 = rng.int(3, 6);
        const test3 = Array.from({ length: n3 }, () => rng.int(1, Math.min(50, Math.floor(LIMIT / 2))) * 2 - 1);

        const test4 = [rng.int(1, 100)];

        const test5 = [1, 2, Math.max(1, LIMIT - 1), LIMIT, 5];

        testCases = [sampleNums, test2, test3, test4, test5];
        break;
      }

      case 'count_odd': {
        statement =
          'Напишите программу, которая определяет количество нечётных чисел в последовательности.\n' +
          `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), а затем N натуральных чисел, не превышающих ${LIMIT}, каждое с новой строки.\n` +
          'Программа должна вывести одно число — количество нечётных чисел.';

        calc = (nums) => nums.filter((x) => x % 2 === 1).length;

        hint =
          'Заведите переменную-счётчик и перед циклом присвойте ей ноль. Внутри цикла проверяйте остаток от деления очередного числа на 2. Если число нечётное, увеличивайте счётчик ровно на единицу, а не прибавляйте само введённое число. Выведите счётчик по окончании цикла.';

        explanation =
          `Алгоритм решения:\n` +
          `1. Считываем количество элементов N.\n` +
          `2. Создаём переменную-счётчик count = 0.\n` +
          `3. В цикле N раз считываем очередное число x и проверяем условие нечётности (x % 2 != 0). Если остаток от деления на 2 не равен 0, увеличиваем счётчик count на 1.\n` +
          `4. По завершении цикла выводим значение счётчика count.\n` +
          `Типичная ошибка: прибавляют само число вместо единицы.`;

        solutionCode = {
          python: `n = int(input())\ncount = 0\nfor _ in range(n):\n    x = int(input())\n    if x % 2 != 0:\n        count += 1\nprint(count)`,
          pascal: `var n, i, x, count: integer;\nbegin\n  readln(n);\n  count := 0;\n  for i := 1 to n do\n  begin\n    readln(x);\n    if x mod 2 <> 0 then\n      count := count + 1;\n  end;\n  writeln(count);\nend.`,
          cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x, count = 0;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (x % 2 != 0) count++;\n    }\n    cout << count;\n    return 0;\n}`
        };

        const nSample = rng.int(3, 5);
        const sampleNums = Array.from({ length: nSample }, () => rng.int(1, 100));

        const n2 = rng.int(6, 8);
        const test2 = Array.from({ length: n2 }, () => {
          const mult = rng.int(0, Math.max(0, Math.floor((LIMIT - 1) / 2)));
          return mult * 2 + 1;
        });

        const n3 = rng.int(3, 6);
        const test3 = Array.from({ length: n3 }, () => rng.int(1, Math.min(50, Math.floor(LIMIT / 2))) * 2);

        const test4 = [rng.int(1, 100)];

        const test5 = [1, 2, Math.max(1, LIMIT - 1), LIMIT, 4];

        testCases = [sampleNums, test2, test3, test4, test5];
        break;
      }

      case 'count_gt_x': {
        const minX = Math.max(20, Math.floor(LIMIT / 10));
        const maxX = Math.max(minX, Math.floor(LIMIT / 2));
        X = rng.int(minX, maxX);
        statement =
          `Напишите программу, которая определяет количество чисел в последовательности, строго больших ${X}.\n` +
          `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), а затем N натуральных чисел, не превышающих ${LIMIT}, каждое с новой строки.\n` +
          `Программа должна вывести одно число — количество чисел, больших ${X}.`;

        calc = (nums) => nums.filter((x) => x > X).length;

        hint =
          `Инициализируйте счётчик нулём до начала цикла. Внутри цикла сравнивайте каждое прочитанное число с числом ${X}. Для подсчёта подходят только числа, строго большие ${X}, само число ${X} подходить не должно. Увеличивайте счётчик на единицу при выполнении условия и выведите его после цикла.`;

        explanation =
          `Алгоритм решения:\n` +
          `1. Считываем количество элементов N.\n` +
          `2. Создаём переменную-счётчик count = 0.\n` +
          `3. В цикле N раз считываем очередное число x и проверяем условие x > ${X}. Если число строго больше ${X}, увеличиваем счётчик count на 1.\n` +
          `4. По завершении цикла выводим значение счётчика count.\n` +
          `Типичная ошибка: нестрогое неравенство вместо строгого.`;

        solutionCode = {
          python: `n = int(input())\ncount = 0\nfor _ in range(n):\n    x = int(input())\n    if x > ${X}:\n        count += 1\nprint(count)`,
          pascal: `var n, i, x, count: integer;\nbegin\n  readln(n);\n  count := 0;\n  for i := 1 to n do\n  begin\n    readln(x);\n    if x > ${X} then\n      count := count + 1;\n  end;\n  writeln(count);\nend.`,
          cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x, count = 0;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (x > ${X}) count++;\n    }\n    cout << count;\n    return 0;\n}`
        };

        const nSample = rng.int(3, 5);
        const sampleNums = Array.from({ length: nSample }, () => rng.int(Math.max(1, X - 10), Math.min(LIMIT, X + 20)));

        const n2 = rng.int(6, 8);
        const test2 = Array.from({ length: n2 }, () => rng.int(X + 1, LIMIT));

        const n3 = rng.int(3, 6);
        const test3 = Array.from({ length: n3 }, () => rng.int(Math.max(1, X - 100), X));

        const test4 = [rng.int(Math.floor(LIMIT * 0.6), LIMIT)];

        const test5 = [Math.max(1, X - 5), X, Math.min(LIMIT, X + 1), X, rng.int(Math.floor(LIMIT * 0.5), LIMIT)];

        testCases = [sampleNums, test2, test3, test4, test5];
        break;
      }

      case 'max': {
        statement =
          'Напишите программу, которая находит максимальное число в последовательности натуральных чисел.\n' +
          `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), а затем N натуральных чисел, не превышающих ${LIMIT}, каждое с новой строки.\n` +
          'Программа должна вывести одно число — наибольшее из введённых чисел.';

        calc = (nums) => Math.max(...nums);

        hint =
          'До начала цикла запишите в переменную для ответа начальное значение 0, находящееся за пределами диапазона натуральных чисел. В цикле N раз считывайте очередное число и сравнивайте его с текущим максимумом. Если введённое число больше сохранённого ответа, обновляйте его значение. После завершения цикла выведите найденный максимум.';

        explanation =
          `Алгоритм решения:\n` +
          `1. Считываем количество элементов N.\n` +
          `2. Инициализируем переменную mx нулём. Поскольку все числа последовательности натуральные (не меньше 1), ноль гарантированно меньше любого введённого числа, и первое же прочитанное число заменит его.\n` +
          `3. В цикле N раз считываем очередное число x и сравниваем его с mx. Если x > mx, обновляем максимум: mx = x.\n` +
          `4. По завершении цикла выводим найденное значение mx.\n` +
          `Типичная ошибка: взять для максимума слишком большое начальное значение — тогда ни одно число последовательности его не превысит, и в ответе останется это начальное значение.`;

        solutionCode = {
          python: `n = int(input())\nmx = 0\nfor _ in range(n):\n    x = int(input())\n    if x > mx:\n        mx = x\nprint(mx)`,
          pascal: `var n, i, x, mx: integer;\nbegin\n  readln(n);\n  mx := 0;\n  for i := 1 to n do\n  begin\n    readln(x);\n    if x > mx then\n      mx := x;\n  end;\n  writeln(mx);\nend.`,
          cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x, mx = 0;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (x > mx) mx = x;\n    }\n    cout << mx;\n    return 0;\n}`
        };

        const nSample = rng.int(3, 5);
        const sampleNums = Array.from({ length: nSample }, () => rng.int(10, Math.min(200, LIMIT)));

        const n2 = rng.int(6, 8);
        const val2 = rng.int(Math.floor(LIMIT / 4), Math.floor(LIMIT * 0.8));
        const test2 = Array.from({ length: n2 }, () => val2);

        const test3 = [rng.int(Math.floor(LIMIT * 0.6), LIMIT)];

        const test4 = [LIMIT, rng.int(1, Math.floor(LIMIT / 2)), rng.int(1, Math.floor(LIMIT / 2)), rng.int(1, Math.floor(LIMIT / 2))];

        const n5 = rng.int(6, 8);
        const maxVal5 = LIMIT;
        const maxIndex5 = rng.int(1, n5 - 2);
        const test5 = Array.from({ length: n5 }, (_, i) => {
          if (i === maxIndex5) return maxVal5;
          return rng.int(1, Math.max(1, Math.floor(LIMIT / 2)));
        });

        testCases = [sampleNums, test2, test3, test4, test5];
        break;
      }

      case 'min': {
        statement =
          'Напишите программу, которая находит минимальное число в последовательности натуральных чисел.\n' +
          `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), а затем N натуральных чисел, не превышающих ${LIMIT}, каждое с новой строки.\n` +
          'Программа должна вывести одно число — наименьшее из введённых чисел.';

        calc = (nums) => Math.min(...nums);

        hint =
          `До начала цикла сохраните в переменную для ответа границу ${LIMIT + 1}, заведомо превышающую любое допустимое число. В цикле N раз считывайте очередное число и сравнивайте его с текущим минимумом. Если новое число меньше текущего ответа, записывайте его в переменную. По окончании цикла выведите полученный минимум.`;

        explanation =
          `Алгоритм решения:\n` +
          `1. Считываем количество элементов N.\n` +
          `2. Инициализируем переменную mn значением ${LIMIT + 1}. По условию задачи числа не превышают ${LIMIT}, поэтому ${LIMIT + 1} гарантированно больше любого введённого числа, и первое же прочитанное число заменит его.\n` +
          `3. В цикле N раз считываем очередное число x и сравниваем его с mn. Если x < mn, обновляем минимум: mn = x.\n` +
          `4. По завершении цикла выводим найденное значение mn.\n` +
          `Типичная ошибка: взять для минимума ноль — тогда ответ всегда нуль; или подставить границу, не сверив её с условием задачи.`;

        solutionCode = {
          python: `n = int(input())\nmn = ${LIMIT + 1}\nfor _ in range(n):\n    x = int(input())\n    if x < mn:\n        mn = x\nprint(mn)`,
          pascal: `var n, i, x, mn: integer;\nbegin\n  readln(n);\n  mn := ${LIMIT + 1};\n  for i := 1 to n do\n  begin\n    readln(x);\n    if x < mn then\n      mn := x;\n  end;\n  writeln(mn);\nend.`,
          cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x, mn = ${LIMIT + 1};\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (x < mn) mn = x;\n    }\n    cout << mn;\n    return 0;\n}`
        };

        const nSample = rng.int(3, 5);
        const sampleNums = Array.from({ length: nSample }, () => rng.int(10, Math.min(200, LIMIT)));

        const n2Len = rng.int(6, 8);
        const val2 = rng.int(Math.floor(LIMIT * 0.6), LIMIT);
        const test2 = Array.from({ length: n2Len }, () => val2);

        const test3 = [rng.int(Math.floor(LIMIT * 0.7), LIMIT)];

        const test4 = [1, rng.int(Math.floor(LIMIT * 0.5), LIMIT), rng.int(Math.floor(LIMIT * 0.5), LIMIT), rng.int(Math.floor(LIMIT * 0.5), LIMIT)];

        const n5Len = rng.int(6, 8);
        const minVal5 = rng.int(Math.floor(LIMIT * 0.6), Math.floor(LIMIT * 0.7));
        const minIndex5 = rng.int(1, n5Len - 2);
        const test5 = Array.from({ length: n5Len }, (_, i) => {
          if (i === minIndex5) return minVal5;
          return rng.int(minVal5 + 10, LIMIT);
        });

        testCases = [sampleNums, test2, test3, test4, test5];
        break;
      }

      case 'count_div_k': {
        k = rng.int(2, 9);
        statement =
          `Напишите программу, которая определяет количество чисел в последовательности, кратных ${k}.\n` +
          `Программа получает на вход число N (1 ≤ N ≤ ${NMAX}), а затем N натуральных чисел, не превышающих ${LIMIT}, каждое с новой строки.\n` +
          `Программа должна вывести одно число — количество чисел, кратных ${k}.`;

        calc = (nums) => nums.filter((x) => x % k === 0).length;

        hint =
          `До начала цикла обнулите переменную-счётчик. Внутри цикла проверяйте, равен ли нулю остаток от деления очередного числа на ${k}. Используйте операцию взятия остатка, а не результат целочисленного деления. Если условие выполняется, прибавляйте единицу к счётчику.`;

        explanation =
          `Алгоритм решения:\n` +
          `1. Считываем количество элементов N.\n` +
          `2. Создаём переменную-счётчик count = 0.\n` +
          `3. В цикле N раз считываем очередное число x и проверяем условие кратности ${k} (x % ${k} == 0). Если остаток от деления на ${k} равен 0, увеличиваем счётчик count на 1.\n` +
          `4. По завершении цикла выводим значение счётчика count.\n` +
          `Типичная ошибка: путают остаток (%) и целочисленное деление (//).`;

        solutionCode = {
          python: `n = int(input())\ncount = 0\nfor _ in range(n):\n    x = int(input())\n    if x % ${k} == 0:\n        count += 1\nprint(count)`,
          pascal: `var n, i, x, count: integer;\nbegin\n  readln(n);\n  count := 0;\n  for i := 1 to n do\n  begin\n    readln(x);\n    if x mod ${k} = 0 then\n      count := count + 1;\n  end;\n  writeln(count);\nend.`,
          cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int n, x, count = 0;\n    cin >> n;\n    for (int i = 0; i < n; i++) {\n        cin >> x;\n        if (x % ${k} == 0) count++;\n    }\n    cout << count;\n    return 0;\n}`
        };

        const nSample = rng.int(3, 5);
        const sampleNums = [k, k + 1, k * 2, k * 3 + 1, k * 4];

        const n2Len = rng.int(6, 8);
        const test2 = Array.from({ length: n2Len }, () => {
          const mult = rng.int(1, Math.max(1, Math.floor(LIMIT / k)));
          return mult * k;
        });

        const n3 = rng.int(3, 6);
        const startMult = Math.max(1, Math.floor(LIMIT / (2 * k)));
        const test3 = Array.from({ length: n3 }, (_, i) => (startMult + i) * k + 1).filter((x) => x <= LIMIT);

        const test4 = [(Math.floor(LIMIT / k) - 1) * k];

        const test5 = [k, Math.max(1, k - 1), k * 2, Math.floor(LIMIT / 2), LIMIT - (LIMIT % k)];

        testCases = [sampleNums, test2, test3, test4, test5];
        break;
      }
    }

    const tests = testCases.map((nums) => {
      const inputStr = `${nums.length}\n${nums.join('\n')}`;
      const expectedStr = String(calc(nums));
      return {
        input: inputStr,
        expected: expectedStr
      };
    });

    const sampleInput = tests[0].input;
    const sampleOutput = tests[0].expected;

    return {
      statement,
      sampleInput,
      sampleOutput,
      tests,
      solutionCode,
      hint,
      explanation
    };
  },

  render: (taskData, state) => {
    return <Task16Component taskData={taskData as Task16Data} state={state} />;
  },

  check: (_taskData, userAnswer) => {
    const { score, maxScore } = parseUserAnswer16(userAnswer);
    if (score < 0) return false;
    return score === maxScore && maxScore > 0;
  },

  checkScore: (_taskData, userAnswer) => {
    const { score, maxScore, code } = parseUserAnswer16(userAnswer);
    if (!code.trim()) {
      return { score: 0, maxScore: 2 };
    }
    return { score: Math.max(0, score), maxScore: maxScore || 2 };
  }
};

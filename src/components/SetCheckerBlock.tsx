import React, { useState, useMemo } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Check,
  X,
  User,
  AlertTriangle,
  Play,
  Loader2,
} from 'lucide-react';
import { SetEntry } from '../set';
import { getTaskById } from '../tasks';
import { DIFFICULTY_LABELS } from '../types';
import { parseAnswersText, ParseResult } from '../utils/parseAnswers';
import { readTextFile } from '../utils/readTextFile';
import { checkSet, CheckedRow, runProgramsForSet } from '../utils/checkAnswers';
import { gradeFromScore } from '../utils/scoring';
import { track } from '../utils/analytics';

export interface SetCheckerBlockProps {
  entries: SetEntry[];
  currentSetCode: string;
  fileCodeLabel?: string;
}

interface StudentSubmission {
  id: string;
  fileName: string;
  parsed: ParseResult;
  rows: CheckedRow[];
  notes: string[];
  unreadLines: string[];
  attachedProgramFiles?: Record<number, string>;
}

const GRADE_LABELS: Record<number, string> = {
  2: '«2» (Неудовлетворительно)',
  3: '«3» (Удовлетворительно)',
  4: '«4» (Хорошо)',
  5: '«5» (Отлично)',
};

export function SetCheckerBlock({ entries, currentSetCode, fileCodeLabel }: SetCheckerBlockProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const activeSubmission = submissions.find((s) => s.id === activeSubId) || submissions[0] || null;

  // Обработка загрузки одного или нескольких файлов (.txt, .py)
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);

    // Разделяем файлы на блокноты и вспомогательные файлы программ
    const notepads: { file: File; text: string }[] = [];
    const auxiliaryFiles: { fileName: string; text: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await readTextFile(file);
        if (file.name.endsWith('.py') || file.name.includes('_робот') || file.name.includes('_программа')) {
          auxiliaryFiles.push({ fileName: file.name, text });
        } else {
          notepads.push({ file, text });
        }
      } catch (err: any) {
        console.error(`Ошибка чтения файла ${file.name}:`, err);
      }
    }

    // Если загружены только файлы программ без блокнота, создадим фиктивный блокнот
    if (notepads.length === 0 && auxiliaryFiles.length > 0) {
      notepads.push({
        file: new File([], auxiliaryFiles[0].fileName),
        text: '===== ОТВЕТЫ =====',
      });
    }

    const newSubs: StudentSubmission[] = [];

    // Привязываем вспомогательные файлы программ к конкретным блокнотам
    const notepadFilesMap: Record<number, string>[] = notepads.map(() => ({}));
    const unmatchedAuxFiles: string[] = [];

    for (const aux of auxiliaryFiles) {
      let pos: number | null = null;
      const leadingNumMatch = aux.fileName.match(/^(\d{1,2})[_\.]/);
      if (leadingNumMatch) {
        pos = parseInt(leadingNumMatch[1], 10);
      } else {
        const innerNumMatch = aux.fileName.match(/(?:_|^)(\d{1,2})(?:_|\.|$)/);
        if (innerNumMatch) {
          pos = parseInt(innerNumMatch[1], 10);
        }
      }

      if (pos === null) {
        unmatchedAuxFiles.push(aux.fileName);
        continue;
      }

      const parts = aux.fileName.split('_');
      let auxPrefix = '';
      if (parts.length > 1 && !/^\d+$/.test(parts[0].trim())) {
        auxPrefix = parts[0].trim().toLowerCase();
      }

      let matchedIdx = -1;
      if (auxPrefix) {
        for (let i = 0; i < notepads.length; i++) {
          const np = notepads[i];
          const npBase = np.file.name.replace(/\.[^/.]+$/, '').trim().toLowerCase();
          const npPrefix = np.file.name.split('_')[0].trim().toLowerCase();
          if (
            npBase === auxPrefix ||
            npPrefix === auxPrefix ||
            npBase.startsWith(auxPrefix) ||
            auxPrefix.startsWith(npPrefix)
          ) {
            matchedIdx = i;
            break;
          }
        }
      }

      if (matchedIdx !== -1) {
        notepadFilesMap[matchedIdx][pos] = aux.text;
      } else if (notepads.length === 1) {
        notepadFilesMap[0][pos] = aux.text;
      } else {
        unmatchedAuxFiles.push(aux.fileName);
      }
    }

    for (let i = 0; i < notepads.length; i++) {
      const { file, text } = notepads[i];
      const parsed = parseAnswersText(text);
      const attachedProgramFiles = notepadFilesMap[i] || {};

      const checkResult = checkSet(entries, parsed, currentSetCode, attachedProgramFiles);

      // Если есть непривязанные файлы при нескольких блокнотах — добавляем предупреждение
      if (unmatchedAuxFiles.length > 0) {
        for (const unattachedName of unmatchedAuxFiles) {
          checkResult.notes.push(
            `Файл ${unattachedName} не удалось привязать к работе, переименуйте его или вставьте программу в блок блокнота.`
          );
        }
      }

      newSubs.push({
        id: `${file.name}-${Date.now()}-${i}`,
        fileName: file.name,
        parsed,
        rows: checkResult.rows,
        notes: checkResult.notes,
        unreadLines: parsed.unreadLines,
        attachedProgramFiles,
      });
    }

    if (newSubs.length > 0) {
      setSubmissions((prev) => [...prev, ...newSubs]);
      setActiveSubId(newSubs[0].id);

      const totalStudents = newSubs.length;
      const avgScore = Math.round(
        newSubs.reduce((acc, s) => acc + s.rows.reduce((a, r) => a + r.score, 0), 0) / totalStudents
      );
      track('set_answers_uploaded', { students_count: totalStudents });
      track('set_answers_checked', { students_count: totalStudents, avg_score: avgScore });
    }
    setIsProcessing(false);
  };

  // Обработка ручного ввода текста
  const handleCheckPastedText = () => {
    if (!pastedText.trim()) return;

    const parsed = parseAnswersText(pastedText);
    const checkResult = checkSet(entries, parsed, currentSetCode);

    const sub: StudentSubmission = {
      id: `manual-paste-${Date.now()}`,
      fileName: 'Введённый текст',
      parsed,
      rows: checkResult.rows,
      notes: checkResult.notes,
      unreadLines: parsed.unreadLines,
    };

    setSubmissions((prev) => [sub, ...prev]);
    setActiveSubId(sub.id);
  };

  const hasTask16 = entries.some((e) => e.taskId === 16);
  const [isRunningPrograms, setIsRunningPrograms] = useState<boolean>(false);
  const [programsProgress, setProgramsProgress] = useState<{ done: number; total: number } | null>(
    null
  );

  // Прогон программ для текущей активной работы
  const handleRunProgramsForActive = async () => {
    if (!activeSubmission || isRunningPrograms || !hasTask16) return;
    const task16Count = entries.filter((e) => e.taskId === 16).length;
    setIsRunningPrograms(true);
    setProgramsProgress({ done: 0, total: task16Count });

    try {
      const resultMap = await runProgramsForSet(
        entries,
        activeSubmission.parsed,
        (done, total) => setProgramsProgress({ done, total }),
        activeSubmission.attachedProgramFiles
      );

      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.id !== activeSubmission.id) return sub;

          const updatedRows = sub.rows.map((row) => {
            if (!resultMap.has(row.position)) return row;
            const res = resultMap.get(row.position)!;

            if (res.ran) {
              const newStatus: 'correct' | 'wrong' =
                res.score === row.maxScore ? 'correct' : res.score > 0 ? 'correct' : 'wrong';
              return {
                ...row,
                score: res.score,
                status: newStatus,
                details: res.details,
              };
            } else {
              return {
                ...row,
                details: res.details,
                // При ran: false статус остается 'manual' с пояснением
              };
            }
          });

          return { ...sub, rows: updatedRows };
        })
      );
    } catch (err) {
      console.error('Ошибка прогона программ:', err);
    } finally {
      setIsRunningPrograms(false);
      setProgramsProgress(null);
    }
  };

  // Прогон программ для всех загруженных работ
  const handleRunProgramsForAll = async () => {
    if (submissions.length === 0 || isRunningPrograms || !hasTask16) return;
    setIsRunningPrograms(true);

    try {
      for (let sIdx = 0; sIdx < submissions.length; sIdx++) {
        const sub = submissions[sIdx];
        const resultMap = await runProgramsForSet(
          entries,
          sub.parsed,
          (done, total) => setProgramsProgress({ done, total }),
          sub.attachedProgramFiles
        );

        setSubmissions((prev) =>
          prev.map((s) => {
            if (s.id !== sub.id) return s;

            const updatedRows = s.rows.map((row) => {
              if (!resultMap.has(row.position)) return row;
              const res = resultMap.get(row.position)!;

              if (res.ran) {
                const newStatus: 'correct' | 'wrong' =
                  res.score === row.maxScore ? 'correct' : res.score > 0 ? 'correct' : 'wrong';
                return {
                  ...row,
                  score: res.score,
                  status: newStatus,
                  details: res.details,
                };
              } else {
                return {
                  ...row,
                  details: res.details,
                };
              }
            });

            return { ...s, rows: updatedRows };
          })
        );
      }
    } catch (err) {
      console.error('Ошибка прогона всех программ:', err);
    } finally {
      setIsRunningPrograms(false);
      setProgramsProgress(null);
    }
  };

  // Ручное изменение балла для позиции
  const handleScoreChange = (submissionId: string, position: number, newScore: number) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id !== submissionId) return sub;
        const updatedRows = sub.rows.map((row) => {
          if (row.position !== position) return row;
          const clampedScore = Math.max(0, Math.min(row.maxScore, newScore));
          let newStatus = row.status;
          if (clampedScore === row.maxScore) newStatus = 'correct';
          else if (clampedScore === 0 && row.raw === '') newStatus = 'empty';
          else if (clampedScore === 0) newStatus = 'wrong';
          else newStatus = 'correct'; // частичный балл

          return {
            ...row,
            score: clampedScore,
            status: newStatus,
          };
        });
        return { ...sub, rows: updatedRows };
      })
    );
  };

  // Ручное переключение зачтено/не зачтено
  const handleToggleRowStatus = (
    submissionId: string,
    position: number,
    target: 'correct' | 'wrong'
  ) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id !== submissionId) return sub;
        const updatedRows = sub.rows.map((row) => {
          if (row.position !== position) return row;
          const score = target === 'correct' ? row.maxScore : 0;
          return {
            ...row,
            score,
            status: target,
          };
        });
        return { ...sub, rows: updatedRows };
      })
    );
  };

  // Удаление работы из списка
  const handleRemoveSubmission = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmissions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeSubId === id) {
        setActiveSubId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  };

  // Подсчет баллов для активной работы
  const activeTotalScore = activeSubmission
    ? activeSubmission.rows.reduce((sum, r) => sum + r.score, 0)
    : 0;

  const activeMaxScore = activeSubmission
    ? activeSubmission.rows.reduce((sum, r) => sum + r.maxScore, 0)
    : entries.reduce((sum, e) => {
        const mod = getTaskById(e.taskId);
        return sum + (mod?.maxPoints ?? 1);
      }, 0);

  const activeGrade = gradeFromScore(activeTotalScore, activeMaxScore);
  const activeGradeLabel = GRADE_LABELS[activeGrade] ?? '';

  // Фактические границы отметок для текущего набора (определяются перебором)
  const gradeThresholds = useMemo(() => {
    if (activeMaxScore <= 0) return { min3: null, min4: null, min5: null };
    let min3: number | null = null;
    let min4: number | null = null;
    let min5: number | null = null;
    for (let s = 0; s <= activeMaxScore; s++) {
      const g = gradeFromScore(s, activeMaxScore);
      if (min3 === null && g >= 3) min3 = s;
      if (min4 === null && g >= 4) min4 = s;
      if (min5 === null && g >= 5) min5 = s;
    }
    return { min3, min4, min5 };
  }, [activeMaxScore]);

  return (
    <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-theme-border pb-4">
        <div>
          <h3 className="text-lg font-bold text-theme-text flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>Проверка заполненных блокнотов</span>
          </h3>
          <p className="text-xs text-theme-text-muted mt-1">
            Загрузите заполненные файлы блокнотов учащихся (<code>Фамилия_{fileCodeLabel || 'XXXXX'}.txt</code>) или вставьте текст ответов для мгновенной автопроверки.
          </p>
        </div>

        {/* Переключатель вкладок */}
        <div className="flex items-center space-x-1 bg-theme-bg p-1 rounded-xl border border-theme-border text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Загрузить файл(ы)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Вставить текстом</span>
          </button>
        </div>
      </div>

      {/* Форма ввода (Загрузка или Текст) */}
      {activeTab === 'upload' ? (
        <div className="border-2 border-dashed border-theme-border hover:border-blue-500 rounded-2xl p-6 text-center transition-colors bg-theme-bg/50">
          <input
            type="file"
            id="answers-file-input"
            accept=".txt,.py"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <label
            htmlFor="answers-file-input"
            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-theme-text">
              Нажмите для выбора файлов или перетащите блокноты и файлы программ сюда
            </p>
            <p className="text-xs text-theme-text-muted">
              Поддерживаются текстовые файлы (.txt) и скрипты (.py) в кодировках UTF-8 и Windows-1251. Можно выбрать сразу блокноты и файлы программ класса.
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder={`Фамилия и имя: Иванов Иван\nКласс: 9А\nНабор: Контрольная (${currentSetCode})\n\n===== ОТВЕТЫ =====\n1: 42\n2: 15\n...`}
            rows={6}
            className="w-full text-xs font-mono p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCheckPastedText}
              disabled={!pastedText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Проверить введённый текст</span>
            </button>
          </div>
        </div>
      )}

      {/* Список загруженных работ и таблица результатов */}
      {submissions.length > 0 && (
        <div className="space-y-6 pt-2 border-t border-theme-border">
          {/* Сетка: список учеников слева (если файлов > 1) и детальный отчёт справа */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Список учеников (колонка слева) */}
            <div className="lg:col-span-1 space-y-2 border-r border-theme-border pr-0 lg:pr-4">
              <div className="flex items-center justify-between pb-2 border-b border-theme-border">
                <span className="text-xs font-bold text-theme-text uppercase tracking-wider">
                  Работы ({submissions.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSubmissions([]);
                    setActiveSubId(null);
                  }}
                  className="text-[11px] text-rose-600 hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Очистить все</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {submissions.map((sub) => {
                  const subTotal = sub.rows.reduce((sum, r) => sum + r.score, 0);
                  const subMax = sub.rows.reduce((sum, r) => sum + r.maxScore, 0);
                  const isActive = sub.id === activeSubmission?.id;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setActiveSubId(sub.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs'
                          : 'bg-theme-bg/40 border-theme-border hover:bg-theme-bg'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold text-theme-text truncate">
                          {sub.parsed.student || sub.fileName}
                        </div>
                        <div className="text-[11px] text-theme-text-muted flex items-center space-x-1.5">
                          <span>{sub.parsed.grade || 'Класс не указан'}</span>
                          <span>&bull;</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {subTotal}/{subMax} б.
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveSubmission(sub.id, e)}
                        className="text-theme-text-muted hover:text-rose-600 p-1 rounded-lg"
                        title="Удалить работу"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Детальный отчет по выбранному ученику (колонка справа) */}
            {activeSubmission && (
              <div className="lg:col-span-3 space-y-4">
                {/* Шапка работы ученика */}
                <div className="bg-theme-bg p-4 rounded-2xl border border-theme-border flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <h4 className="text-base font-extrabold text-theme-text">
                        {activeSubmission.parsed.student || 'Фамилия не указана'}
                      </h4>
                      {activeSubmission.parsed.grade && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-xs">
                          {activeSubmission.parsed.grade}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-theme-text-muted">
                      Файл: <span className="font-mono text-theme-text">{activeSubmission.fileName}</span>
                      {activeSubmission.parsed.setCode && (
                        <> &bull; Код набора в файле: <span className="font-mono font-bold text-theme-text">{activeSubmission.parsed.setCode}</span></>
                      )}
                    </p>
                  </div>

                  {/* Итог и оценка */}
                  <div className="flex items-center space-x-4 bg-theme-card p-3 rounded-xl border border-theme-border shadow-xs">
                    <div className="text-right">
                      <div className="text-[11px] text-theme-text-muted uppercase font-bold tracking-wider">
                        Итоговый балл
                      </div>
                      <div className="text-lg font-black text-theme-text">
                        <span className="text-blue-600 dark:text-blue-400">{activeTotalScore}</span>
                        <span className="text-theme-text-muted font-normal text-sm"> / {activeMaxScore}</span>
                      </div>
                    </div>

                    {activeMaxScore > 0 && (
                      <>
                        <div className="h-8 w-px bg-theme-border" />

                        <div>
                          <div className="text-[11px] text-theme-text-muted uppercase font-bold tracking-wider">
                            Оценка ОГЭ
                          </div>
                          <div className="text-lg font-black flex items-center space-x-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-sm ${
                                activeGrade >= 4
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                  : activeGrade === 3
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                              }`}
                            >
                              {activeGradeLabel}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Пометка о шкале ОГЭ */}
                {activeMaxScore > 0 && (
                  <p className="text-[11px] text-theme-text-muted italic">
                    * Отметка ориентировочная: она пересчитана пропорционально шкале ОГЭ (21 балл за полный вариант из 16 заданий). Для этого набора (макс. {activeMaxScore} б.): {[
                      gradeThresholds.min3 !== null ? `«3» — от ${gradeThresholds.min3} б` : null,
                      gradeThresholds.min4 !== null ? `«4» — от ${gradeThresholds.min4} б` : null,
                      gradeThresholds.min5 !== null ? `«5» — от ${gradeThresholds.min5} б` : null,
                    ].filter(Boolean).join(', ')}. На коротких наборах одна ошибка сильнее влияет на отметку, чем на полном варианте.
                  </p>
                )}

                {/* Предупреждения (notes) и нераспознанные строки (unreadLines) */}
                {(activeSubmission.notes.length > 0 || activeSubmission.unreadLines.length > 0) && (
                  <div className="space-y-2">
                    {activeSubmission.notes.map((note, i) => (
                      <div
                        key={`note-${i}`}
                        className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start space-x-2"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{note}</span>
                      </div>
                    ))}

                    {activeSubmission.unreadLines.length > 0 && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-300 space-y-1">
                        <div className="font-bold flex items-center space-x-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-slate-500" />
                          <span>Нераспознанные или пропущенные строки из файла:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 pl-1">
                          {activeSubmission.unreadLines.map((line, idx) => (
                            <li key={idx} className="truncate">
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Блок действий с программами (если в наборе есть задание 16) */}
                {hasTask16 && (
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center space-x-1.5">
                        <Play className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Автопроверка программ (задание 16)</span>
                      </div>
                      <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                        Выполняет тестирование программ на Python через Pyodide и автоматически выставляет баллы (0, 1 или 2 балла).
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleRunProgramsForActive}
                        disabled={isRunningPrograms}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                      >
                        {isRunningPrograms ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>
                              Прогон программ... {programsProgress ? `(${programsProgress.done}/${programsProgress.total})` : ''}
                            </span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            <span>Прогнать программы (задание 16)</span>
                          </>
                        )}
                      </button>

                      {submissions.length > 1 && (
                        <button
                          type="button"
                          onClick={handleRunProgramsForAll}
                          disabled={isRunningPrograms}
                          className="px-3 py-2 bg-theme-bg hover:bg-theme-border/50 text-theme-text border border-theme-border rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="Прогнать для всех загруженных работ"
                        >
                          <span>Прогнать для всех работ</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Таблица результатов по каждому заданию */}
                <div className="overflow-x-auto rounded-xl border border-theme-border">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-theme-bg border-b border-theme-border text-theme-text-muted uppercase text-[10px] tracking-wider font-bold">
                        <th className="py-2.5 px-3 w-12 text-center">Поз.</th>
                        <th className="py-2.5 px-3">Задание</th>
                        <th className="py-2.5 px-3">Ответ ученика</th>
                        <th className="py-2.5 px-3">Эталонный ответ</th>
                        <th className="py-2.5 px-3 w-28 text-center">Статус</th>
                        <th className="py-2.5 px-3 w-32 text-center">Балл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {activeSubmission.rows.map((row) => {
                        const taskMod = getTaskById(row.taskId);

                        // Стилизация строк в зависимости от статуса
                        let rowBg = 'bg-theme-card hover:bg-theme-bg/40';
                        if (row.status === 'wrong') {
                          rowBg = 'bg-rose-50/70 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/30';
                        } else if (row.status === 'manual') {
                          rowBg = 'bg-amber-50/70 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-950/30';
                        } else if (row.status === 'empty') {
                          rowBg = 'bg-slate-50/40 dark:bg-slate-900/20 opacity-75';
                        } else if (row.status === 'correct') {
                          rowBg = 'bg-emerald-50/50 dark:bg-emerald-950/15 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/25';
                        }

                        return (
                          <tr key={`row-${row.position}`} className={`transition-colors ${rowBg}`}>
                            {/* Позиция */}
                            <td className="py-2.5 px-3 text-center font-bold font-mono text-theme-text">
                              {row.position}
                            </td>

                            {/* Задание */}
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-theme-text">
                                ОГЭ {row.taskId}. {taskMod?.title || 'Задание'}
                              </div>
                              <div className="text-[10px] text-theme-text-muted">
                                {`L${row.difficulty} ${DIFFICULTY_LABELS[row.difficulty]}`}
                              </div>
                            </td>

                            {/* Ответ ученика */}
                            <td className="py-2.5 px-3 font-mono">
                              {row.raw ? (
                                <span className="text-theme-text font-bold">{row.raw}</span>
                              ) : (
                                <span className="text-theme-text-muted italic">нет ответа</span>
                              )}
                            </td>

                            {/* Эталон */}
                            <td className="py-2.5 px-3 font-mono text-theme-text-muted">
                              {row.expected}
                            </td>

                            {/* Статус */}
                            <td className="py-2.5 px-3 text-center">
                              {row.partialManual ? (
                                <div className="inline-flex flex-col items-center gap-0.5">
                                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                    row.score > 0
                                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  }`}>
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Авто: {row.score}/2 б.</span>
                                  </span>
                                  <span className="text-[9px] text-theme-text-muted">+1 б. диаграмма</span>
                                </div>
                              ) : (
                                <>
                                  {row.status === 'correct' && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px]">
                                      <CheckCircle className="h-3 w-3" />
                                      <span>Верно</span>
                                    </span>
                                  )}
                                  {row.status === 'wrong' && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                                      <XCircle className="h-3 w-3" />
                                      <span>Неверно</span>
                                    </span>
                                  )}
                                  {row.status === 'manual' && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                                      <AlertCircle className="h-3 w-3" />
                                      <span>Вручную</span>
                                    </span>
                                  )}
                                  {row.status === 'empty' && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                                      <span>Пусто</span>
                                    </span>
                                  )}
                                  {row.details && row.details.length > 0 && (
                                    <div className="text-[10px] text-theme-text-muted mt-1 max-w-[200px] truncate" title={row.details.join('\n')}>
                                      {row.details.join(', ')}
                                    </div>
                                  )}
                                </>
                              )}
                            </td>

                            {/* Балл и кнопки переключения */}
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                {row.maxScore > 1 ? (
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={row.maxScore}
                                      value={row.score}
                                      onChange={(e) =>
                                        handleScoreChange(
                                          activeSubmission.id,
                                          row.position,
                                          parseInt(e.target.value, 10) || 0
                                        )
                                      }
                                      className="w-12 text-center p-1 rounded-md border border-theme-border bg-theme-bg font-bold text-xs"
                                    />
                                    <span className="text-theme-text-muted font-normal text-[11px]">
                                      /{row.maxScore}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleRowStatus(
                                          activeSubmission.id,
                                          row.position,
                                          'correct'
                                        )
                                      }
                                      className={`p-1 rounded-md transition-colors ${
                                        row.score === row.maxScore
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-theme-bg text-theme-text-muted hover:text-emerald-600 border border-theme-border'
                                      }`}
                                      title="Зачесть (1 балл)"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>

                                    <span className="font-bold text-xs w-6 text-center">
                                      {row.score}/{row.maxScore}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleRowStatus(
                                          activeSubmission.id,
                                          row.position,
                                          'wrong'
                                        )
                                      }
                                      className={`p-1 rounded-md transition-colors ${
                                        row.score === 0
                                          ? 'bg-rose-600 text-white'
                                          : 'bg-theme-bg text-theme-text-muted hover:text-rose-600 border border-theme-border'
                                      }`}
                                      title="Не зачесть (0 баллов)"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

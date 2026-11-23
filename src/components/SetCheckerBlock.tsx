import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronDown,
  Download,
  Search,
  UserCheck,
} from 'lucide-react';
import { checkTask13 } from '../tasks/task13/check';
import { DEFAULT_SPEC } from '../tasks/task13/spec';
import { parsePastedHtml } from '../tasks/task13/html';
import { Task14PieChart } from '../tasks/task14';
import { buildSet, decodeSetShort, SetEntry } from '../set';
import { getTaskById } from '../tasks';
import { DIFFICULTY_LABELS } from '../types';
import { parseAnswersText, ParseResult } from '../utils/parseAnswers';
import { readTextFile } from '../utils/readTextFile';
import {
  checkSet,
  CheckedRow,
  runProgramsForSet,
  getAutoScore14,
  applyDiagramToggle14,
  applyScoreChange,
} from '../utils/checkAnswers';
import { gradeFromScore } from '../utils/scoring';
import { track } from '../utils/analytics';
import { supabase } from '../lib/supabase';
import { useClasses, ClassMemberWithProfile } from '../hooks/useClasses';
import { findStudentMatches } from '../utils/matchStudent';
import { compareClassNames } from '../utils/compareClassNames';

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
  resolvedCode?: string;
  attached?: {
    studentId: string;
    studentName: string;
    className: string;
  };
}

const CHECKER_STORAGE_KEY = 'oge-checker-state-v1';

function loadCheckerState(): { submissions: StudentSubmission[]; activeSubId: string | null } | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(CHECKER_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.submissions)) return data;
    return null;
  } catch {
    return null;
  }
}

interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  searchPlaceholder = 'Поиск...',
  emptyText = 'Ничего не найдено',
  disabled = false,
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const selectedOption = options.find((o) => o.value === value) || null;
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-[11px] font-bold text-theme-text-muted uppercase tracking-wider mb-1">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => {
            if (!prev) setQuery('');
            return !prev;
          });
        }}
        className="w-full px-3 py-2 rounded-xl border border-theme-border bg-theme-bg text-xs text-left flex items-center justify-between gap-2 text-theme-text hover:border-blue-500/60 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
      >
        <span className={`truncate ${selectedOption ? 'font-medium text-theme-text' : 'text-theme-text-muted'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-theme-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-theme-border bg-theme-card shadow-lg overflow-hidden">
          <div className="p-2 border-b border-theme-border flex items-center gap-1.5 bg-theme-bg/60">
            <Search className="h-3.5 w-3.5 text-theme-text-muted shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="w-full bg-transparent text-xs text-theme-text placeholder:text-theme-text-muted focus:outline-none"
            />
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-theme-border/40">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2.5 text-xs text-theme-text-muted text-center">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold'
                        : 'text-theme-text hover:bg-theme-bg'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getStudentFullName(member: ClassMemberWithProfile): string {
  const full = [member.profiles?.last_name, member.profiles?.first_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  return full || member.profiles?.email || 'Ученик';
}

function getStudentShortName(member: ClassMemberWithProfile): string {
  const last = member.profiles?.last_name?.trim() || '';
  const first = member.profiles?.first_name?.trim() || '';
  if (last && first) return `${last} ${first.charAt(0)}.`;
  return last || first || member.profiles?.email || 'Ученик';
}

const GRADE_LABELS: Record<number, string> = {
  2: '«2» (Неудовлетворительно)',
  3: '«3» (Удовлетворительно)',
  4: '«4» (Хорошо)',
  5: '«5» (Отлично)',
};

function resolveEntries(
  parsed: ParseResult,
  currentSetCode: string,
  currentEntries: SetEntry[]
): { entries: SetEntry[]; resolvedCode: string; fromNotepad: boolean } {
  const noteCode = parsed.setCode?.trim().toUpperCase();
  const openCode = currentSetCode?.trim().toUpperCase();
  if (noteCode && noteCode !== openCode) {
    try {
      const decoded = decodeSetShort(parsed.setCode.trim());
      if (decoded) {
        const result = buildSet(decoded);
        if (result.entries.length > 0) {
          return { entries: result.entries, resolvedCode: parsed.setCode.trim(), fromNotepad: true };
        }
      }
    } catch {
      // fallback to current
    }
  }
  return { entries: currentEntries, resolvedCode: currentSetCode, fromNotepad: false };
}

export function SetCheckerBlock({ entries, currentSetCode, fileCodeLabel }: SetCheckerBlockProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const saved = useMemo(() => loadCheckerState(), []);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(saved?.submissions ?? []);
  const [activeSubId, setActiveSubId] = useState<string | null>(saved?.activeSubId ?? null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.setItem(CHECKER_STORAGE_KEY, JSON.stringify({ submissions, activeSubId }));
    } catch {
      // ignore storage errors
    }
  }, [submissions, activeSubId]);

  const { classes, loading: classesLoading } = useClasses();
  const [selectionBySubId, setSelectionBySubId] = useState<
    Record<string, { classId: string; studentId: string; touched?: boolean }>
  >({});
  const [showAttachModal, setShowAttachModal] = useState<boolean>(false);
  const [isAttaching, setIsAttaching] = useState<boolean>(false);
  const [attachError, setAttachError] = useState<string | null>(null);

  const sortedClasses = useMemo(() => {
    return [...classes]
      .sort((a, b) => compareClassNames(a.name, b.name))
      .map((cls) => ({
        ...cls,
        members: [...cls.members].sort((a, b) => {
          const lastA = (a.profiles?.last_name || '').trim();
          const lastB = (b.profiles?.last_name || '').trim();
          const cmpLast = lastA.localeCompare(lastB, 'ru');
          if (cmpLast !== 0) return cmpLast;
          const firstA = (a.profiles?.first_name || '').trim();
          const firstB = (b.profiles?.first_name || '').trim();
          return firstA.localeCompare(firstB, 'ru');
        }),
      }));
  }, [classes]);

  useEffect(() => {
    if (submissions.length === 0 || sortedClasses.length === 0) return;

    setSelectionBySubId((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const sub of submissions) {
        if (sub.attached || prev[sub.id]?.touched) continue;
        const matches = findStudentMatches(sub.parsed.student, sub.parsed.grade, sortedClasses);
        if (matches.length === 1) {
          const existing = prev[sub.id];
          if (
            !existing ||
            existing.classId !== matches[0].classId ||
            existing.studentId !== matches[0].studentId
          ) {
            next[sub.id] = {
              classId: matches[0].classId,
              studentId: matches[0].studentId,
            };
            changed = true;
          }
        }
      }

      return changed ? next : prev;
    });
  }, [submissions, sortedClasses]);

  const activeSubmission = submissions.find((s) => s.id === activeSubId) || submissions[0] || null;

  const activeSubmissionEntries = useMemo(() => {
    if (!activeSubmission) return [];
    return resolveEntries(activeSubmission.parsed, currentSetCode, entries).entries;
  }, [activeSubmission?.id, activeSubmission?.parsed.setCode, currentSetCode, entries]);
  const activeSelection = activeSubmission
    ? selectionBySubId[activeSubmission.id] || { classId: '', studentId: '' }
    : { classId: '', studentId: '' };
  const selectedClass = sortedClasses.find((c) => c.id === activeSelection.classId) || null;
  const selectedStudentMember =
    selectedClass?.members.find((m) => m.student_id === activeSelection.studentId) || null;

  const classOptions = useMemo<SearchableOption[]>(
    () => sortedClasses.map((c) => ({ value: c.id, label: c.name })),
    [sortedClasses]
  );

  const studentOptions = useMemo<SearchableOption[]>(
    () =>
      selectedClass
        ? selectedClass.members.map((m) => ({
            value: m.student_id,
            label: getStudentFullName(m),
          }))
        : [],
    [selectedClass]
  );

  const handleExportExcel = async () => {
    const { utils, writeFile } = await import('xlsx');

    // Собираем все уникальные позиции из всех работ, сортируем
    const allPositions = Array.from(
      new Set(submissions.flatMap((s) => s.rows.map((r) => r.position)))
    ).sort((a, b) => a - b);

    // Заголовки
    const header = [
      'Фамилия и имя',
      'Класс',
      'Балл',
      'Оценка',
      ...allPositions.map((p) => `Зад. ${p}`),
    ];

    // Строки
    const rows = submissions.map((sub) => {
      const total = sub.rows.reduce((sum, r) => sum + r.score, 0);
      const max = sub.rows.reduce((sum, r) => sum + r.maxScore, 0);
      const grade = gradeFromScore(total, max);
      const scoreByPos: Record<number, number> = {};
      sub.rows.forEach((r) => {
        scoreByPos[r.position] = r.score;
      });
      return [
        sub.parsed.student || sub.fileName,
        sub.parsed.grade || '—',
        total,
        grade,
        ...allPositions.map((p) => scoreByPos[p] ?? '—'),
      ];
    });

    const ws = utils.aoa_to_sheet([header, ...rows]);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Результаты');
    writeFile(wb, `результаты_${fileCodeLabel || currentSetCode || 'набор'}.xlsx`);
  };

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

      const { entries: resolvedEntries, resolvedCode, fromNotepad } = resolveEntries(parsed, currentSetCode, entries);
      const checkResult = checkSet(resolvedEntries, parsed, resolvedCode, attachedProgramFiles);
      if (fromNotepad) {
        checkResult.notes.unshift(`Проверка выполнена по коду набора из блокнота (${parsed.setCode}).`);
      }

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
        resolvedCode,
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
    const { entries: resolvedEntries, resolvedCode, fromNotepad } = resolveEntries(parsed, currentSetCode, entries);
    const checkResult = checkSet(resolvedEntries, parsed, resolvedCode);
    if (fromNotepad) {
      checkResult.notes.unshift(`Проверка выполнена по коду набора из блокнота (${parsed.setCode}).`);
    }

    const sub: StudentSubmission = {
      id: `manual-paste-${Date.now()}`,
      fileName: 'Введённый текст',
      parsed,
      rows: checkResult.rows,
      notes: checkResult.notes,
      unreadLines: parsed.unreadLines,
      resolvedCode,
    };

    setSubmissions((prev) => [sub, ...prev]);
    setActiveSubId(sub.id);
  };

  const hasTask16 = activeSubmission?.rows.some((r) => r.taskId === 16) ?? entries.some((e) => e.taskId === 16);
  const [isRunningPrograms, setIsRunningPrograms] = useState<boolean>(false);
  const [programsProgress, setProgramsProgress] = useState<{ done: number; total: number } | null>(
    null
  );

  // Прогон программ для текущей активной работы
  const handleRunProgramsForActive = async () => {
    if (!activeSubmission || isRunningPrograms || !hasTask16) return;
    const task16Count = activeSubmission?.rows.filter((r) => r.taskId === 16).length ?? entries.filter((e) => e.taskId === 16).length;
    setIsRunningPrograms(true);
    setProgramsProgress({ done: 0, total: task16Count });

    try {
      const activeEntries = resolveEntries(activeSubmission.parsed, currentSetCode, entries).entries;
      const resultMap = await runProgramsForSet(
        activeEntries,
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
                testsPassed: res.passed,
                testsTotal: res.total,
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
        const task16Count = sub.rows.filter((r) => r.taskId === 16).length ?? entries.filter((e) => e.taskId === 16).length;
        setProgramsProgress({ done: 0, total: task16Count });

        const subEntries = resolveEntries(sub.parsed, currentSetCode, entries).entries;
        const resultMap = await runProgramsForSet(
          subEntries,
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
                  testsPassed: res.passed,
                  testsTotal: res.total,
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
        const updatedRows = sub.rows.map((row) =>
          row.position === position ? applyScoreChange(row, newScore) : row
        );
        return { ...sub, rows: updatedRows };
      })
    );
  };

  // Переключение галочки «Диаграмма верна (+1 б.)» для задания 14
  const handleToggleDiagram = (submissionId: string, position: number, checked: boolean) => {
    setSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id !== submissionId) return sub;
        const updatedRows = sub.rows.map((row) =>
          row.position === position ? applyDiagramToggle14(row, checked) : row
        );
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

  const hasUngradedManual = activeSubmission
    ? activeSubmission.rows.some((r) => r.status === 'manual' && r.score === 0)
    : false;

  const handleConfirmAttach = async () => {
    if (
      !activeSubmission ||
      !selectedClass ||
      !selectedStudentMember ||
      activeSubmission.attached ||
      isAttaching
    ) {
      return;
    }

    const targetSubId = activeSubmission.id;
    const studentId = selectedStudentMember.student_id;
    const classId = selectedClass.id;
    const studentShortName = getStudentShortName(selectedStudentMember);
    const className = selectedClass.name;

    const answers: Record<
      number,
      {
        answer: string;
        correct: boolean;
        score: number;
        maxScore: number;
        taskId: number;
      }
    > = {};

    for (const row of activeSubmission.rows) {
      answers[row.position] = {
        answer: row.raw,
        correct: row.score > 0,
        score: row.score,
        maxScore: row.maxScore,
        taskId: row.taskId,
      };
    }

    setIsAttaching(true);
    setAttachError(null);

    try {
      const { data, error } = await supabase.functions.invoke('attach-mock-result', {
        body: {
          studentId,
          classId,
          setCode: activeSubmission.resolvedCode ?? currentSetCode,
          score: activeTotalScore,
          maxScore: activeMaxScore,
          notebookStudent: activeSubmission.parsed.student,
          notebookGrade: activeSubmission.parsed.grade,
          answers,
        },
      });

      if (error) {
        let errMsg = error.message || 'Не удалось прикрепить результат';
        try {
          const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
          if (ctx && typeof ctx.json === 'function') {
            const errBody = await ctx.json();
            if (errBody?.error) errMsg = errBody.error;
          }
        } catch {
          // ignore json parse errors
        }
        throw new Error(errMsg);
      }

      if (!data?.ok) {
        throw new Error(data?.error || 'Не удалось прикрепить результат');
      }

      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === targetSubId
            ? {
                ...sub,
                attached: {
                  studentId,
                  studentName: studentShortName,
                  className,
                },
              }
            : sub
        )
      );
      setShowAttachModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка при прикреплении результата';
      setAttachError(msg);
    } finally {
      setIsAttaching(false);
    }
  };

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

  const [task13Inputs, setTask13Inputs] = useState<Record<string, string>>({});
  const [task13Parsed, setTask13Parsed] = useState<Record<string, any>>({});
  const [task13Reports, setTask13Reports] = useState<
    Record<
      string,
      { score: number; items: { id: string; label: string; status: string; expected: string; actual: string }[] }
    >
  >({});
  const [task13Open, setTask13Open] = useState<Record<string, boolean>>({});
  const [task14Open, setTask14Open] = useState<Record<string, boolean>>({});
  const [testsOpen, setTestsOpen] = useState<Record<string, boolean>>({});

  const handleCheck13 = (
    submissionId: string,
    position: number,
    taskData: unknown,
    html: string
  ) => {
    const rowKey = `${submissionId}-${position}`;
    try {
      const parsed = task13Parsed[rowKey] || parsePastedHtml(html);
      const report = checkTask13(
        (taskData as any).doc,
        parsed,
        (taskData as any).doc?.spec || DEFAULT_SPEC
      );
      setTask13Reports((prev) => ({
        ...prev,
        [rowKey]: { score: report.score, items: report.items },
      }));
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id !== submissionId
            ? sub
            : {
                ...sub,
                rows: sub.rows.map((r) =>
                  r.position === position && r.taskId === 13
                    ? { ...r, score: report.score, status: report.score > 0 ? 'correct' : 'wrong' }
                    : r
                ),
              }
        )
      );
    } catch (e) {
      console.error('task13 check error', e);
    }
  };

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
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFileUpload(files);
          }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors bg-theme-bg/50 ${
            isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-theme-border hover:border-blue-500'
          }`}
        >
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
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmissions([]);
                      setActiveSubId(null);
                      setSelectionBySubId({});
                      setAttachError(null);
                      setShowAttachModal(false);
                    }}
                    className="text-[11px] text-rose-600 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Очистить все</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="text-[11px] text-emerald-600 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    <span>Скачать Excel</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {submissions.map((sub) => {
                  const subTotal = sub.rows.reduce((sum, r) => sum + r.score, 0);
                  const subMax = sub.rows.reduce((sum, r) => sum + r.maxScore, 0);
                  const isActive = sub.id === activeSubmission?.id;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setActiveSubId(sub.id);
                        setAttachError(null);
                        setShowAttachModal(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs'
                          : 'bg-theme-bg/40 border-theme-border hover:bg-theme-bg'
                      }`}
                    >
                      <div className="truncate pr-2 min-w-0">
                        <div className="font-bold text-theme-text truncate flex items-center gap-1.5">
                          {sub.attached && (
                            <CheckCircle
                              className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                              aria-label={`Прикреплено: ${sub.attached.studentName} (${sub.attached.className})`}
                            />
                          )}
                          <span className="truncate">{sub.parsed.student || sub.fileName}</span>
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
                        className="text-theme-text-muted hover:text-rose-600 p-1 rounded-lg shrink-0"
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

                {/* Блок привязки результата к ученику (Пробник) */}
                <div className="bg-theme-bg p-4 rounded-2xl border border-theme-border space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-theme-text">
                        Привязка к ученику
                      </h5>
                    </div>
                    <span className="text-xs text-theme-text-muted">
                      Из блокнота:{' '}
                      <span className="font-medium text-theme-text">
                        {activeSubmission.parsed.student || '—'}, {activeSubmission.parsed.grade || '—'}
                      </span>
                    </span>
                  </div>

                  {activeSubmission.attached ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Прикреплено: {activeSubmission.attached.studentName} ({activeSubmission.attached.className})
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <SearchableSelect
                          label="Класс"
                          value={activeSelection.classId}
                          options={classOptions}
                          placeholder={classesLoading ? 'Загрузка классов...' : 'Выберите класс'}
                          searchPlaceholder="Поиск класса..."
                          emptyText="Классы не найдены"
                          disabled={classesLoading || sortedClasses.length === 0 || isAttaching}
                          onChange={(newClassId) => {
                            setSelectionBySubId((prev) => ({
                              ...prev,
                              [activeSubmission.id]: {
                                classId: newClassId,
                                studentId: '',
                                touched: true,
                              },
                            }));
                            setAttachError(null);
                          }}
                        />

                        <SearchableSelect
                          label="Ученик"
                          value={activeSelection.studentId}
                          options={studentOptions}
                          placeholder={selectedClass ? 'Выберите ученика' : 'Сначала выберите класс'}
                          searchPlaceholder="Поиск ученика..."
                          emptyText="Ученики не найдены"
                          disabled={!selectedClass || isAttaching}
                          onChange={(newStudentId) => {
                            setSelectionBySubId((prev) => ({
                              ...prev,
                              [activeSubmission.id]: {
                                classId: activeSelection.classId,
                                studentId: newStudentId,
                                touched: true,
                              },
                            }));
                            setAttachError(null);
                          }}
                        />

                        <button
                          type="button"
                          disabled={!selectedStudentMember || !!activeSubmission.attached || isAttaching}
                          onClick={() => {
                            setAttachError(null);
                            setShowAttachModal(true);
                          }}
                          className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer h-[34px]"
                        >
                          <UserCheck className="h-4 w-4" />
                          <span>Прикрепить к ученику</span>
                        </button>
                      </div>

                      {!classesLoading && sortedClasses.length === 0 && (
                        <p className="text-[11px] text-theme-text-muted">
                          Нет доступных классов. Войдите как учитель и создайте класс, чтобы прикреплять результаты.
                        </p>
                      )}
                    </>
                  )}

                  {attachError && !showAttachModal && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{attachError}</span>
                    </div>
                  )}
                </div>

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
                        <th className="py-2.5 px-3">Правильный ответ</th>
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
                          <React.Fragment key={`row-group-${row.position}`}>
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
                                {row.taskId === 16 && row.status === 'manual'
                                  ? 'Запустите проверку программ'
                                  : row.expected}
                              </td>

                            {/* Статус */}
                            <td className="py-2.5 px-3 text-center">
                              {row.partialManual ? (
                                (() => {
                                  const autoScore = getAutoScore14(row);
                                  return (
                                    <div className="inline-flex flex-col items-center gap-0.5">
                                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                        autoScore > 0
                                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                      }`}>
                                        <AlertCircle className="h-3 w-3" />
                                        <span>Авто: {autoScore}/2 б.</span>
                                      </span>
                                      <span className="text-[9px] text-theme-text-muted">+1 б. диаграмма</span>
                                    </div>
                                  );
                                })()
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
                                  {row.testsTotal !== undefined ? (
                                    <div className="mt-1">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                          (row.testsPassed ?? 0) === row.testsTotal
                                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                        }`}
                                      >
                                        Тесты: {row.testsPassed ?? 0}/{row.testsTotal}
                                      </span>
                                    </div>
                                  ) : (
                                    row.details && row.details.length > 0 && (
                                      <div className="text-[10px] text-theme-text-muted mt-1 max-w-[200px] truncate" title={row.details.join('\n')}>
                                        {row.details.join(', ')}
                                      </div>
                                    )
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
                          {row.taskId === 13 && (row.status === 'manual' || Boolean(row.task13Data)) && (() => {
                            const rowKey = `${activeSubmission.id}-${row.position}`;
                            const report = task13Reports[rowKey];
                            return (
                              <tr key={`task13-check-${row.position}`} className="bg-amber-50/30 dark:bg-amber-950/10">
                                <td colSpan={6} className="px-4 py-3">
                                  <div className="space-y-2">
                                    <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
                                      <AlertCircle className="h-3.5 w-3.5" />
                                      <span>Ученик отметил задание как выполненное — вставьте текст документа для проверки</span>
                                    </div>
                                    {!report && (
                                      <div
                                        tabIndex={0}
                                        onPaste={(e) => {
                                          e.preventDefault();
                                          const html = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain');
                                          if (!html) return;
                                          try {
                                            const parsed = parsePastedHtml(html);
                                            setTask13Inputs((prev) => ({ ...prev, [rowKey]: html }));
                                            setTask13Parsed((prev) => ({ ...prev, [rowKey]: parsed }));
                                          } catch {
                                            setTask13Inputs((prev) => ({ ...prev, [rowKey]: html }));
                                          }
                                        }}
                                        className={`p-4 border-2 border-dashed rounded-xl transition-colors focus:outline-none min-h-[120px] text-xs ${
                                          task13Parsed[rowKey]
                                            ? 'border-emerald-500/50 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'
                                            : 'border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 hover:border-emerald-500/50 focus:border-emerald-500'
                                        }`}
                                      >
                                        {task13Parsed[rowKey] ? (
                                          <div>
                                            <div className="flex justify-between items-center mb-2">
                                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Документ вставлен</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setTask13Inputs((prev) => {
                                                    const n = { ...prev };
                                                    delete n[rowKey];
                                                    return n;
                                                  });
                                                  setTask13Parsed((prev) => {
                                                    const n = { ...prev };
                                                    delete n[rowKey];
                                                    return n;
                                                  });
                                                  setTask13Reports((prev) => {
                                                    const n = { ...prev };
                                                    delete n[rowKey];
                                                    return n;
                                                  });
                                                  setTask13Open((prev) => {
                                                    const n = { ...prev };
                                                    delete n[rowKey];
                                                    return n;
                                                  });
                                                }}
                                                className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                                              >
                                                Очистить
                                              </button>
                                            </div>
                                            <div className="font-serif space-y-1">
                                              {task13Parsed[rowKey].paragraphs?.map((para: any, pIdx: number) => (
                                                <p key={pIdx} style={{ fontSize: `${task13Parsed[rowKey].fontSizes?.[pIdx] || 12}pt` }}>
                                                  {para.spans?.map((s: any, sIdx: number) => (
                                                    <span
                                                      key={sIdx}
                                                      style={{
                                                        fontWeight: s.b ? 'bold' : undefined,
                                                        fontStyle: s.i ? 'italic' : undefined,
                                                        textDecoration: s.u ? 'underline' : undefined,
                                                      }}
                                                    >
                                                      {s.text}
                                                    </span>
                                                  ))}
                                                </p>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center justify-center h-20 text-center text-slate-500">
                                            <span className="font-medium">Нажмите сюда и вставьте (Ctrl+V) документ из редактора</span>
                                            <span className="text-[11px] text-slate-400 mt-1">(MS Word, LibreOffice, Google Docs и др.)</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {task13Inputs[rowKey] && !report && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCheck13(activeSubmission.id, row.position, row.task13Data, task13Inputs[rowKey])
                                        }
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                                      >
                                        Проверить
                                      </button>
                                    )}
                                    {report && (
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="text-xs font-bold text-theme-text">
                                            Результат: {report.score}/2 балла
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setTask13Inputs((prev) => {
                                                const n = { ...prev };
                                                delete n[rowKey];
                                                return n;
                                              });
                                              setTask13Parsed((prev) => {
                                                const n = { ...prev };
                                                delete n[rowKey];
                                                return n;
                                              });
                                              setTask13Reports((prev) => {
                                                const n = { ...prev };
                                                delete n[rowKey];
                                                return n;
                                              });
                                              setTask13Open((prev) => {
                                                const n = { ...prev };
                                                delete n[rowKey];
                                                return n;
                                              });
                                            }}
                                            className="text-[11px] text-rose-500 hover:underline cursor-pointer"
                                          >
                                            Вставить другой текст
                                          </button>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setTask13Open((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))}
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                                        >
                                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${task13Open[rowKey] ? 'rotate-180' : ''}`} />
                                          <span>{task13Open[rowKey] ? 'Скрыть разбор' : 'Показать разбор'}</span>
                                        </button>
                                        {task13Open[rowKey] && (
                                          <div className="space-y-1 pl-2 border-l-2 border-theme-border">
                                            {report.items.map((item: any) => (
                                              <div
                                                key={item.id}
                                                className={`text-[11px] flex items-start space-x-1.5 ${
                                                  item.status === 'ok'
                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                    : 'text-rose-700 dark:text-rose-400'
                                                }`}
                                              >
                                                <span>{item.status === 'ok' ? '✓' : '✗'}</span>
                                                <span>
                                                  {item.label}:{' '}
                                                  {item.status !== 'ok' ? `${item.actual} (нужно: ${item.expected})` : item.expected}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })()}
                          {row.taskId === 14 && row.partialManual && (() => {
                            const rowKey14 = `task14-${row.position}`;
                            const entry = activeSubmissionEntries.find((e) => e.position === row.position);
                            const chartData = entry?.taskData?.chartData;
                            const hasChart = Boolean(chartData && chartData.length > 0);
                            return (
                              <tr key={`task14-diagram-${row.position}`} className="bg-blue-50/30 dark:bg-blue-950/10">
                                <td colSpan={6} className="px-4 py-2">
                                  <div className="flex flex-wrap items-center gap-4">
                                    <label className="inline-flex items-center space-x-2 text-xs font-bold text-theme-text cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(row.diagramOk)}
                                        onChange={(e) =>
                                          handleToggleDiagram(activeSubmission.id, row.position, e.target.checked)
                                        }
                                        className="rounded border-theme-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <span>Диаграмма верна (+1 б.)</span>
                                    </label>
                                    {hasChart && (
                                      <button
                                        type="button"
                                        onClick={() => setTask14Open((prev) => ({ ...prev, [rowKey14]: !prev[rowKey14] }))}
                                        className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
                                      >
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${task14Open[rowKey14] ? 'rotate-180' : ''}`} />
                                        <span>{task14Open[rowKey14] ? 'Скрыть диаграмму' : 'Показать примерную диаграмму'}</span>
                                      </button>
                                    )}
                                  </div>
                                  {hasChart && task14Open[rowKey14] && (
                                    <div className="mt-3 max-w-sm">
                                      <p className="text-[11px] text-theme-text-muted mb-2">
                                        Сравните с работой ученика и отметьте галочку «Диаграмма верна». Балл можно поправить вручную в поле выше.
                                      </p>
                                      <Task14PieChart chartData={chartData} />
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })()}
                          {(row.taskId === 15 || row.taskId === 16) && (row.testsTotal !== undefined || (row.details && row.details.length > 0)) && (() => {
                            const rowKeyTests = `${activeSubmission.id}-${row.position}`;
                            const isOpen = Boolean(testsOpen[rowKeyTests]);
                            return (
                              <tr key={`tests-details-${row.position}`} className="bg-slate-50/50 dark:bg-slate-900/20">
                                <td colSpan={6} className="px-4 py-2">
                                  <button
                                    type="button"
                                    onClick={() => setTestsOpen((prev) => ({ ...prev, [rowKeyTests]: !prev[rowKeyTests] }))}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                                  >
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    <span>
                                      {row.testsTotal !== undefined
                                        ? `Посмотреть тесты (${row.testsPassed ?? 0}/${row.testsTotal})`
                                        : 'Посмотреть тесты'}
                                    </span>
                                  </button>
                                  {isOpen && row.details && row.details.length > 0 && (
                                    <div className="mt-2 space-y-1 pl-2 border-l-2 border-theme-border font-mono">
                                      {row.details.map((line, idx) => {
                                        let lineColor = 'text-theme-text';
                                        if (row.taskId === 16) {
                                          if (line.includes(': пройден')) {
                                            lineColor = 'text-emerald-700 dark:text-emerald-400';
                                          } else if (
                                            line.includes('не пройден') ||
                                            line.includes('ошибка выполнения') ||
                                            line.includes('превышено время')
                                          ) {
                                            lineColor = 'text-rose-700 dark:text-rose-400';
                                          }
                                        } else if (row.taskId === 15 && idx > 0) {
                                          lineColor = 'text-rose-700 dark:text-rose-400';
                                        }
                                        return (
                                          <div key={idx} className={`text-[11px] whitespace-pre-wrap break-words ${lineColor}`}>
                                            {line}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
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
          </div>
        </div>
      )}

      {/* Модалка подтверждения прикрепления к ученику */}
      {showAttachModal && activeSubmission && selectedClass && selectedStudentMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-base font-bold text-theme-text">
                Подтверждение привязки
              </h4>
              <button
                type="button"
                disabled={isAttaching}
                onClick={() => setShowAttachModal(false)}
                className="text-theme-text-muted hover:text-theme-text p-1 rounded-lg cursor-pointer"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-theme-text leading-relaxed">
              Прикрепить работу с ФИО из блокнота «{activeSubmission.parsed.student || '—'}» ученику «{getStudentFullName(selectedStudentMember)}» ({selectedClass.name})? Результат: {activeTotalScore}/{activeMaxScore}
            </p>

            {hasUngradedManual && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Задания 13/16 ещё не оценены</span>
              </div>
            )}

            {attachError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{attachError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isAttaching}
                onClick={() => setShowAttachModal(false)}
                className="px-4 py-2 rounded-xl border border-theme-border bg-theme-bg text-xs font-bold text-theme-text hover:bg-theme-border/40 disabled:opacity-50 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={isAttaching}
                onClick={handleConfirmAttach}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                {isAttaching ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Прикрепить</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

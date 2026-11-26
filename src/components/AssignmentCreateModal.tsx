import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, BookOpen, Users, ChevronDown, Search } from 'lucide-react';
import type { ClassWithMembers, ClassMemberWithProfile } from '../hooks/useClasses';
import { compareClassNames } from '../utils/compareClassNames';

export interface AssignmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle: string;
  variantSeed: string | null;
  setConfig: Record<string, unknown> | null;
  classes: ClassWithMembers[];
  onSubmit: (params: {
    classId: string;
    title: string;
    dueDate: string | null;
    maxAttempts: number | null;
    hideReview?: boolean;
    assignmentType: 'homework' | 'classwork';
    studentIds?: string[];
  }) => Promise<void>;
}

function formatStudentName(member: ClassMemberWithProfile): string {
  const last = (member.profiles?.last_name ?? '').trim();
  const first = (member.profiles?.first_name ?? '').trim();
  if (last && first) return `${last} ${first}`;
  if (last || first) return last || first;
  return member.profiles?.email || 'Ученик';
}

export function AssignmentCreateModal({
  isOpen,
  onClose,
  defaultTitle,
  classes,
  onSubmit,
}: AssignmentCreateModalProps) {
  const sortedClasses = useMemo(
    () => [...classes].sort((a, b) => compareClassNames(a.name, b.name)),
    [classes]
  );

  const [selectedClassId, setSelectedClassId] = useState<string>(sortedClasses[0]?.id || '');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(() => {
    const firstClass = sortedClasses[0];
    return new Set((firstClass?.members ?? []).map((m) => m.student_id));
  });
  const [isRecipientsOpen, setIsRecipientsOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [assignmentType, setAssignmentType] = useState<'homework' | 'classwork'>('homework');
  const [title, setTitle] = useState<string>(defaultTitle);
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [maxAttempts, setMaxAttempts] = useState<string>('');
  const [hideReview, setHideReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectAllRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);

  const today = new Date().toISOString().split('T')[0];

  const selectedClass = useMemo(
    () => sortedClasses.find((c) => c.id === selectedClassId) ?? null,
    [sortedClasses, selectedClassId]
  );

  const sortedMembers = useMemo(() => {
    const members = selectedClass?.members ?? [];
    return [...members].sort((a, b) => {
      const lastA = (a.profiles?.last_name ?? '').trim();
      const lastB = (b.profiles?.last_name ?? '').trim();
      const cmpLast = lastA.localeCompare(lastB, 'ru');
      if (cmpLast !== 0) return cmpLast;
      const firstA = (a.profiles?.first_name ?? '').trim();
      const firstB = (b.profiles?.first_name ?? '').trim();
      const cmpFirst = firstA.localeCompare(firstB, 'ru');
      if (cmpFirst !== 0) return cmpFirst;
      return formatStudentName(a).localeCompare(formatStudentName(b), 'ru');
    });
  }, [selectedClass]);

  const totalMembersCount = sortedMembers.length;
  const selectedMembersCount = useMemo(
    () => sortedMembers.filter((m) => selectedStudentIds.has(m.student_id)).length,
    [sortedMembers, selectedStudentIds]
  );

  const allSelected = totalMembersCount > 0 && selectedMembersCount === totalMembersCount;
  const noneSelected = totalMembersCount > 0 && selectedMembersCount === 0;
  const partiallySelected = selectedMembersCount > 0 && selectedMembersCount < totalMembersCount;

  const filteredMembers = useMemo(() => {
    const query = recipientSearch.trim().toLowerCase();
    if (!query) return sortedMembers;
    return sortedMembers.filter((m) => {
      const last = (m.profiles?.last_name ?? '').trim().toLowerCase();
      const first = (m.profiles?.first_name ?? '').trim().toLowerCase();
      const fullLastFirst = `${last} ${first}`.trim();
      const fullFirstLast = `${first} ${last}`.trim();
      const email = (m.profiles?.email ?? '').toLowerCase();
      return (
        last.includes(query) ||
        first.includes(query) ||
        fullLastFirst.includes(query) ||
        fullFirstLast.includes(query) ||
        email.includes(query)
      );
    });
  }, [sortedMembers, recipientSearch]);

  useEffect(() => {
    if (dueDate === today) {
      const d = new Date();
      d.setHours(d.getHours() + 1, 0, 0, 0);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setDueTime(`${hh}:${mm}`);
    }
  }, [dueDate, today]);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      const initialClass = sortedClasses[0];
      setSelectedClassId(initialClass?.id || '');
      setSelectedStudentIds(new Set((initialClass?.members ?? []).map((m) => m.student_id)));
      setIsRecipientsOpen(false);
      setRecipientSearch('');
      setAssignmentType('homework');
      setTitle(defaultTitle);
      setDueDate('');
      setDueTime('');
      setMaxAttempts('');
      setHideReview(false);
      setIsSubmitting(false);
      setError(null);
    } else if (!isOpen && wasOpenRef.current) {
      setIsRecipientsOpen(false);
      setRecipientSearch('');
      setAssignmentType('homework');
      setDueDate('');
      setDueTime('');
      setMaxAttempts('');
      setHideReview(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, defaultTitle, sortedClasses]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedClassId && sortedClasses.length > 0) {
      const first = sortedClasses[0];
      setSelectedClassId(first.id);
      setSelectedStudentIds(new Set((first.members ?? []).map((m) => m.student_id)));
    }
  }, [isOpen, selectedClassId, sortedClasses]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = partiallySelected;
    }
  }, [partiallySelected, isRecipientsOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleClassChange = (nextClassId: string) => {
    setSelectedClassId(nextClassId);
    setRecipientSearch('');
    const nextClass = sortedClasses.find((c) => c.id === nextClassId);
    setSelectedStudentIds(new Set((nextClass?.members ?? []).map((m) => m.student_id)));
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(sortedMembers.map((m) => m.student_id)));
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Укажите название домашнего задания');
      return;
    }

    if (!selectedClassId) {
      setError('Выберите класс');
      return;
    }

    if (noneSelected) {
      setError('Выберите хотя бы одного ученика');
      return;
    }

    if (maxAttempts && (parseInt(maxAttempts) < 1 || parseInt(maxAttempts) > 99)) {
      setError('Количество попыток должно быть от 1 до 99');
      return;
    }

    const studentIdsToSubmit =
      totalMembersCount === 0 || allSelected
        ? []
        : sortedMembers
            .filter((m) => selectedStudentIds.has(m.student_id))
            .map((m) => m.student_id);

    setIsSubmitting(true);
    try {
      await onSubmit({
        classId: selectedClassId,
        title: title.trim(),
        dueDate: assignmentType === 'classwork'
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          : (dueDate && dueTime ? `${dueDate}T${dueTime}` : dueDate || null),
        maxAttempts: maxAttempts ? parseInt(maxAttempts) : null,
        hideReview,
        assignmentType,
        studentIds: studentIdsToSubmit,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка при выдаче ДЗ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-theme-card rounded-2xl border border-theme-border shadow-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between border-b border-theme-border pb-3">
          <h3 className="text-base font-bold text-theme-text">Выдать как ДЗ</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-theme-text-muted uppercase tracking-wider">
              Название задания
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Набор заданий"
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text placeholder:text-theme-text-muted/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-theme-text-muted uppercase tracking-wider">
              Класс
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortedClasses.length === 0 ? (
                <option value="">Нет доступных классов</option>
              ) : (
                sortedClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {totalMembersCount > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-theme-text-muted uppercase tracking-wider">
                Кому
              </label>
              <button
                type="button"
                aria-expanded={isRecipientsOpen}
                onClick={() => setIsRecipientsOpen((prev) => !prev)}
                className="w-full bg-theme-bg border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text flex items-center justify-between hover:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
              >
                <span>
                  {allSelected
                    ? 'Весь класс'
                    : `Выбрано ${selectedMembersCount} из ${totalMembersCount}`}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-theme-text-muted transition-transform ${
                    isRecipientsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isRecipientsOpen && (
                <div className="border border-theme-border rounded-xl bg-theme-bg p-3 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-theme-text cursor-pointer select-none shrink-0">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleToggleAll}
                        className="w-4 h-4 rounded border-theme-border text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Все</span>
                    </label>
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-theme-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        placeholder="Поиск по фамилии или имени"
                        className="w-full bg-theme-card border border-theme-border rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-theme-text placeholder:text-theme-text-muted/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-theme-border/40 pr-1">
                    {filteredMembers.length === 0 ? (
                      <p className="py-3 text-center text-xs text-theme-text-muted">
                        Ученики не найдены
                      </p>
                    ) : (
                      filteredMembers.map((member) => {
                        const checked = selectedStudentIds.has(member.student_id);
                        return (
                          <label
                            key={member.student_id}
                            className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg hover:bg-theme-card/70 cursor-pointer select-none text-xs text-theme-text"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleStudent(member.student_id)}
                              className="w-4 h-4 rounded border-theme-border text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                            />
                            <span className="truncate">{formatStudentName(member)}</span>
                          </label>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-1 border-t border-theme-border/60 flex items-center justify-between text-[11px] text-theme-text-muted">
                    <span>
                      Выбрано {selectedMembersCount} из {totalMembersCount}
                    </span>
                  </div>
                </div>
              )}

              {noneSelected && (
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  Выберите хотя бы одного ученика
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-theme-text-muted uppercase tracking-wider">
              Тип задания
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('homework');
                }}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  assignmentType === 'homework'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-theme-bg border-theme-border text-theme-text-sec hover:border-blue-500'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Домашнее задание
              </button>
              <button
                type="button"
                onClick={() => setAssignmentType('classwork')}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  assignmentType === 'classwork'
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-theme-bg border-theme-border text-theme-text-sec hover:border-emerald-500'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Классная работа
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-theme-text-muted uppercase tracking-wider">
              {assignmentType === 'classwork' ? 'Срок сдачи (24 часа автоматически)' : 'Срок сдачи (необязательно)'}
            </label>
            {assignmentType === 'classwork' ? (
              <div className="px-3.5 py-2 bg-theme-bg border border-theme-border rounded-xl text-xs text-theme-text-muted">
                Срок сдачи будет установлен автоматически — через 24 часа после выдачи
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dueDate}
                  min={today}
                  onChange={(e) => setDueDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      (e.target as HTMLInputElement).showPicker?.();
                    } catch {
                      // ignore
                    }
                  }}
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500 dark:[color-scheme:dark] cursor-pointer"
                />
                <input
                  type="time"
                  value={dueTime}
                  min={dueDate === today ? new Date().toTimeString().slice(0, 5) : undefined}
                  onChange={(e) => setDueTime(e.target.value)}
                  onClick={(e) => {
                    try {
                      (e.target as HTMLInputElement).showPicker?.();
                    } catch {
                      // ignore
                    }
                  }}
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500 dark:[color-scheme:dark] cursor-pointer"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-1">
              Макс. количество попыток (необязательно)
            </label>
            <input
              type="number"
              min="1"
              max="99"
              value={maxAttempts}
              onChange={e => setMaxAttempts(e.target.value)}
              placeholder="Без ограничений"
              className="w-full px-3 py-2 rounded-lg border border-theme-border bg-theme-bg text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="hide-review"
              checked={hideReview}
              onChange={e => setHideReview(e.target.checked)}
              className="w-4 h-4 rounded border-theme-border text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="hide-review" className="text-sm font-medium text-theme-text cursor-pointer select-none">
              Скрыть разборы до завершения
            </label>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center space-x-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-theme-bg border border-theme-border text-theme-text hover:bg-theme-border/40 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting || classes.length === 0 || noneSelected}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shadow-xs cursor-pointer"
            >
              {isSubmitting ? 'Сохранение...' : 'Выдать ДЗ'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

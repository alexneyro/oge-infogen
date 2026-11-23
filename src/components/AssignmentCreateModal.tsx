import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, BookOpen, Users } from 'lucide-react';
import type { ClassWithMembers } from '../hooks/useClasses';
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
  }) => Promise<void>;
}

export function AssignmentCreateModal({
  isOpen,
  onClose,
  defaultTitle,
  classes,
  onSubmit,
}: AssignmentCreateModalProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [assignmentType, setAssignmentType] = useState<'homework' | 'classwork'>('homework');
  const [title, setTitle] = useState<string>(defaultTitle);
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [maxAttempts, setMaxAttempts] = useState<string>('');
  const [hideReview, setHideReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

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
    if (isOpen) {
      setSelectedClassId(classes[0]?.id || '');
      setAssignmentType('homework');
      setTitle(defaultTitle);
      setDueDate('');
      setDueTime('');
      setMaxAttempts('');
      setHideReview(false);
      setIsSubmitting(false);
      setError(null);
    } else {
      setAssignmentType('homework');
      setDueDate('');
      setDueTime('');
      setMaxAttempts('');
      setHideReview(false);
    }
  }, [isOpen, defaultTitle, classes]);

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

    if (maxAttempts && (parseInt(maxAttempts) < 1 || parseInt(maxAttempts) > 99)) {
      setError('Количество попыток должно быть от 1 до 99');
      return;
    }

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
      <div className="relative bg-theme-card rounded-2xl border border-theme-border shadow-2xl p-6 w-full max-w-md mx-4 space-y-4">
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
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classes.length === 0 ? (
                <option value="">Нет доступных классов</option>
              ) : (
                [...classes]
                  .sort((a, b) => compareClassNames(a.name, b.name))
                  .map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-theme-text-muted uppercase tracking-wider">
              Тип задания
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('homework');
                  // сбрасываем срок если был автоустановлен
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
              disabled={isSubmitting || classes.length === 0}
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

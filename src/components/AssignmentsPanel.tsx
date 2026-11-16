import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ClipboardList, X, AlertCircle, Calendar, Clock } from 'lucide-react';
import { useAssignments } from '../hooks/useAssignments';

export interface AssignmentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAssignment?: (code: string) => void;
}

function formatDueDate(iso: string | null): string {
  if (!iso) return 'Без срока';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Без срока';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `до ${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export const AssignmentsPanel: React.FC<AssignmentsPanelProps> = ({
  isOpen,
  onClose,
  onOpenAssignment,
}) => {
  const { assignments, loading, error, fetchAssignments } = useAssignments();

  useEffect(() => {
    if (isOpen) {
      fetchAssignments();
    }
  }, [isOpen, fetchAssignments]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeAssignments = assignments.filter((a) => a.is_active);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className="relative h-full w-full max-w-lg bg-theme-card border-l border-theme-border shadow-2xl flex flex-col z-50 text-left animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Мои задания"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-theme-border shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-theme-text">Мои задания</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors cursor-pointer"
            aria-label="Закрыть панель"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading && activeAssignments.length === 0 && (
            <div className="space-y-3">
              <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
              <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
              <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
            </div>
          )}

          {/* Empty State */}
          {!loading && activeAssignments.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-theme-bg border border-theme-border flex items-center justify-center text-theme-text-muted">
                <ClipboardList className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-theme-text-muted">Активных заданий нет</p>
            </div>
          )}

          {/* Assignments List */}
          {activeAssignments.length > 0 && (
            <div className="space-y-3">
              {activeAssignments.map((assignment) => {
                const setCode = (assignment.set_config?.code as string | undefined)?.trim() || '';
                return (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-xl border border-theme-border bg-theme-bg/50 hover:bg-theme-bg transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-theme-text truncate">
                          {assignment.title}
                        </h3>
                        {assignment.class_name && (
                          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shrink-0">
                            {assignment.class_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-theme-text-muted flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatDueDate(assignment.due_date)}</span>
                        </span>
                        {assignment.created_at && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>Создано: {formatCreatedAt(assignment.created_at)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {setCode ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenAssignment?.(setCode);
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
                      >
                        Открыть
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="Нет кода набора"
                        className="px-3.5 py-2 rounded-xl bg-theme-bg border border-theme-border text-theme-text-muted text-xs font-semibold opacity-50 cursor-not-allowed shrink-0"
                      >
                        Открыть
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

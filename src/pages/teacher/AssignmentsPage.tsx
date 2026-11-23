import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, AlertCircle, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAssignments, type Assignment } from '../../hooks/useAssignments';
import { useClasses } from '../../hooks/useClasses';
import { buildClassFilterOptions, getEmptyFilterMessage } from '../../utils/classFilterOptions';

const PAGE_SIZE = 50;

function formatDueDate(iso: string | null): string {
  if (!iso) return 'Без срока';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Без срока';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function getStatus(a: Assignment): 'active' | 'expired' | 'closed' {
  if (!a.is_active) return 'closed';
  if (a.due_date && new Date() > new Date(a.due_date)) return 'expired';
  return 'active';
}

export const AssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { assignments, loading, error, fetchAssignments, toggleAssignment, deleteAssignment } = useAssignments();
  const { classes } = useClasses();
  const [typeFilter, setTypeFilter] = useState<'all' | 'homework' | 'classwork'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [confirmModal, setConfirmModal] = useState<{
    type: 'toggle' | 'delete';
    assignmentId: string;
    newValue?: boolean;
    title: string;
  } | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const classOptions = buildClassFilterOptions(classes, assignments);

  const filteredAssignments = assignments
    .filter((a) => (typeFilter === 'all' ? true : (a.assignment_type || 'homework') === typeFilter))
    .filter((a) => (classFilter === 'all' ? true : a.class_id === classFilter))
    .filter((a) => {
      if (statusFilter === 'all') return true;
      const s = getStatus(a);
      if (statusFilter === 'active') return s === 'active';
      if (statusFilter === 'inactive') return s === 'expired' || s === 'closed';
      return true;
    });

  const emptyFilterMessage = getEmptyFilterMessage({
    classFilter,
    assignments,
    filteredCount: filteredAssignments.length,
  });
  const visibleAssignments = filteredAssignments.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2.5 pb-4 border-b border-theme-border">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <ClipboardList className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-theme-text">Задания</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && assignments.length === 0 && (
        <div className="space-y-3">
          <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
          <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
          <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
        </div>
      )}

      {!loading && assignments.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-theme-border bg-theme-card">
          <div className="w-12 h-12 rounded-2xl bg-theme-bg border border-theme-border flex items-center justify-center text-theme-text-muted">
            <ClipboardList className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-theme-text-muted">Заданий пока нет</p>
        </div>
      )}

      {assignments.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          {(['all', 'homework', 'classwork'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setTypeFilter(f);
                setVisibleCount(PAGE_SIZE);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                typeFilter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-theme-bg border border-theme-border text-theme-text-sec hover:border-blue-500'
              }`}
            >
              {f === 'all' ? 'Все' : f === 'homework' ? 'Домашние' : 'Классные'}
            </button>
          ))}

          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="px-3 py-1.5 rounded-lg text-xs border border-theme-border bg-theme-bg text-theme-text-sec cursor-pointer"
          >
            <option value="all">Все классы</option>
            {classOptions.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setVisibleCount(PAGE_SIZE);
            }}
            className="px-3 py-1.5 rounded-lg text-xs border border-theme-border bg-theme-bg text-theme-text-sec cursor-pointer"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="inactive">Закрытые / Истёкшие</option>
          </select>
        </div>
      )}

      {assignments.length > 0 && emptyFilterMessage && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-theme-border bg-theme-card">
          <div className="w-12 h-12 rounded-2xl bg-theme-bg border border-theme-border flex items-center justify-center text-theme-text-muted">
            <ClipboardList className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-theme-text-muted">{emptyFilterMessage}</p>
        </div>
      )}

      {assignments.length > 0 && !emptyFilterMessage && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-theme-border bg-theme-card shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-theme-border text-theme-text-muted uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-bold">Название</th>
                  <th className="py-3 px-4 font-bold">Класс</th>
                  <th className="py-3 px-4 font-bold">Срок</th>
                  <th className="py-3 px-4 font-bold text-center">Статус</th>
                  <th className="py-3 px-4 font-bold">Дата создания</th>
                  <th className="py-3 px-4 font-bold text-center">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/60">
                {visibleAssignments.map((assignment) => (
                <tr
                  key={assignment.id}
                  onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                  className="hover:bg-theme-bg/40 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-semibold text-theme-text">
                    {assignment.title}
                  </td>
                  <td className="py-3.5 px-4 text-theme-text-sec">
                    {assignment.class_name || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-theme-text-sec">
                    {formatDueDate(assignment.due_date)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {(() => {
                      const st = getStatus(assignment);
                      if (st === 'active') {
                        return (
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Активно
                          </span>
                        );
                      }
                      if (st === 'expired') {
                        return (
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Истёк срок
                          </span>
                        );
                      }
                      return (
                        <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-theme-bg text-theme-text-muted border border-theme-border">
                          Закрыто
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3.5 px-4 text-theme-text-muted">
                    {formatCreatedAt(assignment.created_at)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {getStatus(assignment) === 'closed' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmModal({
                              type: 'toggle',
                              assignmentId: assignment.id,
                              newValue: true,
                              title: assignment.title,
                            });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-theme-border bg-theme-bg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium transition-colors cursor-pointer"
                          title="Открыть задание"
                        >
                          <ToggleRight size={14} />
                          <span>Открыть</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmModal({
                              type: 'toggle',
                              assignmentId: assignment.id,
                              newValue: false,
                              title: assignment.title,
                            });
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-theme-border bg-theme-bg hover:bg-theme-border/40 text-theme-text-sec text-xs font-medium transition-colors cursor-pointer"
                          title="Закрыть задание"
                        >
                          <ToggleLeft size={14} />
                          <span>Закрыть</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmModal({
                            type: 'delete',
                            assignmentId: assignment.id,
                            title: assignment.title,
                          });
                        }}
                        className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                        title="Удалить задание"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
          {filteredAssignments.length > visibleCount && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-theme-text-muted">
                Показано {visibleAssignments.length} из {filteredAssignments.length}
              </p>
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text transition-colors cursor-pointer"
              >
                Показать ещё
              </button>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="bg-theme-card rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4 border border-theme-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-theme-text">
              {confirmModal.type === 'toggle'
                ? confirmModal.newValue === false
                  ? 'Закрыть задание?'
                  : 'Открыть задание?'
                : 'Удалить задание?'}
            </h3>

            <p className="text-xs text-theme-text-sec leading-relaxed">
              {confirmModal.type === 'toggle'
                ? confirmModal.newValue === false
                  ? `Ученики больше не смогут открыть «${confirmModal.title}». Можно будет снова открыть.`
                  : `Ученики снова смогут открывать «${confirmModal.title}».`
                : `Задание «${confirmModal.title}» и все связанные сессии будут удалены. Это действие нельзя отменить.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-theme-border text-theme-text-sec hover:bg-theme-bg transition-colors text-xs font-semibold cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmModal.type === 'toggle') {
                    await toggleAssignment(confirmModal.assignmentId, confirmModal.newValue!);
                  } else {
                    await deleteAssignment(confirmModal.assignmentId);
                  }
                  setConfirmModal(null);
                }}
                className={`px-4 py-2 rounded-xl text-white transition-colors text-xs font-semibold cursor-pointer ${
                  confirmModal.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

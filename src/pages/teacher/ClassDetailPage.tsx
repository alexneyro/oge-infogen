import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  Link2,
  UserPlus,
  UserMinus,
  Users,
  Trash2,
  ClipboardList,
  ToggleLeft,
  ToggleRight,
  Plus,
  Download,
  Pencil,
} from 'lucide-react';
import { useClasses } from '../../hooks/useClasses';
import { useAssignments } from '../../hooks/useAssignments';
import { supabase } from '../../lib/supabase';
import { ClassAnalytics } from '../../components/ClassAnalytics';
import { ClassExportModal } from '../../components/teacher/ClassExportModal';
import { RenameClassModal } from '../../components/RenameClassModal';

export const ClassDetailPage: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const {
    classes,
    loading,
    addStudentWithoutEmail,
    fetchClasses,
    removeStudent,
    renameClass,
    deleteClass,
  } = useClasses();

  const [activeTab, setActiveTab] = useState<'students' | 'assignments' | 'analytics'>('students');
  const [showAddStudent, setShowAddStudent] = useState<'none' | 'generated'>('none');
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [addStudentError, setAddStudentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ studentId: string; studentName: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const { assignments, fetchAssignments, toggleAssignment, deleteAssignment } = useAssignments();
  const [confirmAssignmentModal, setConfirmAssignmentModal] = useState<{
    type: 'toggle' | 'delete';
    assignmentId: string;
    newValue?: boolean;
    title: string;
  } | null>(null);

  useEffect(() => {
    if (activeTab === 'assignments') fetchAssignments();
  }, [activeTab, fetchAssignments]);

  function getStatus(a: { is_active: boolean; due_date: string | null }) {
    if (!a.is_active) return 'closed';
    if (a.due_date && new Date() > new Date(a.due_date)) return 'expired';
    return 'active';
  }

  const activeClass = classes.find((c) => c.id === classId);
  const classAssignments = assignments.filter((a) => a.class_id === classId);

  const resetAddStudentState = () => {
    setShowAddStudent('none');
    setStudentFirstName('');
    setStudentLastName('');
    setAddStudentError(null);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleAddGenerated = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClass || !studentFirstName.trim() || !studentLastName.trim()) return;

    setIsSubmitting(true);
    setAddStudentError(null);

    const res = await addStudentWithoutEmail(
      activeClass.id,
      studentFirstName,
      studentLastName
    );
    setIsSubmitting(false);

    if (res.error) {
      setAddStudentError(res.error);
    } else {
      resetAddStudentState();
    }
  };

  const handleRemoveStudent = (studentId: string, studentName: string) => {
    setConfirmRemove({ studentId, studentName });
  };

  const confirmRemoveStudent = async () => {
    if (!confirmRemove || !classId) return;
    const { error } = await removeStudent(classId, confirmRemove.studentId);
    if (error) alert('Ошибка при исключении ученика: ' + error);
    setConfirmRemove(null);
  };

  const handleConfirmDeleteClass = async () => {
    if (!classId) return;
    setIsDeletingClass(true);
    const { error } = await deleteClass(classId);
    setIsDeletingClass(false);
    if (error) {
      alert('Ошибка при удалении класса: ' + error);
      return;
    }
    setConfirmDelete(false);
    navigate('/teacher/classes');
  };

  if (loading && !activeClass) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-8 w-48 rounded-xl bg-theme-border/30" />
        <div className="animate-pulse h-28 rounded-xl bg-theme-border/30" />
        <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
        <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
      </div>
    );
  }

  if (!loading && !activeClass) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/teacher/classes')}
          className="flex items-center space-x-1 text-sm text-theme-text-muted hover:text-theme-text cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </button>

        <div className="text-center py-12 px-4 space-y-2 rounded-2xl border border-theme-border bg-theme-card">
          <Users className="w-10 h-10 text-theme-text-muted mx-auto stroke-1" />
          <p className="text-sm text-theme-text-sec">Класс не найден</p>
        </div>
      </div>
    );
  }

  if (!activeClass) return null;

  return (
    <div className="space-y-5">
      {/* Back button & Class Info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/teacher/classes')}
            className="flex items-center space-x-1 text-sm text-theme-text-muted hover:text-theme-text cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            title="Удалить класс"
          >
            <Trash2 className="w-4 h-4" />
            <span>Удалить класс</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-theme-text">
                {activeClass.name}
              </h3>
              <button
                type="button"
                onClick={() => setIsRenameOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme-border bg-theme-bg text-xs font-medium text-theme-text-sec hover:text-theme-text hover:bg-theme-border/30 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Переименовать</span>
              </button>
            </div>
            <p className="text-xs text-theme-text-muted">
              {activeClass.members.length}{' '}
              {activeClass.members.length === 1
                ? 'ученик'
                : activeClass.members.length >= 2 && activeClass.members.length <= 4
                ? 'ученика'
                : 'учеников'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopyCode(activeClass.invite_code)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-card border border-theme-border text-xs text-theme-text-sec hover:text-theme-text transition-colors cursor-pointer"
            title="Скопировать код приглашения"
          >
            <span className="font-mono">Код: {activeClass.invite_code}</span>
            {copiedCode === activeClass.invite_code ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-theme-text-muted" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme-border mb-4">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'students'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-theme-text-muted hover:text-theme-text'
          }`}
        >
          Ученики
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'assignments'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-theme-text-muted hover:text-theme-text'
          }`}
        >
          Задания
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-theme-text-muted hover:text-theme-text'
          }`}
        >
          Аналитика
        </button>
      </div>

      {activeTab === 'students' && (
        <>
          {/* Add Student block */}
          <div className="p-4 rounded-xl border border-theme-border bg-theme-card space-y-3">
            <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider">
              Добавить ученика
            </h4>

            {showAddStudent === 'none' && (
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `https://oge-infogen.ru?invite=${activeClass.invite_code}`
                      );
                      const key = 'invite-link-' + activeClass.invite_code;
                      setCopiedCode(key);
                      setTimeout(() => setCopiedCode(null), 2000);
                    } catch {
                      // fallback
                    }
                  }}
                  className="flex items-center space-x-1.5 border border-theme-border bg-theme-bg hover:bg-theme-border/40 text-theme-text rounded-xl px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
                >
                  {copiedCode === 'invite-link-' + activeClass.invite_code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Пригласить по ссылке</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetAddStudentState();
                    setShowAddStudent('generated');
                  }}
                  className="flex items-center space-x-1.5 border border-theme-border bg-theme-bg hover:bg-theme-border/40 text-theme-text rounded-xl px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Без аккаунта</span>
                </button>
              </div>
            )}

            {/* Form: Add without Email (Generated) */}
            {showAddStudent === 'generated' && (
              <form onSubmit={handleAddGenerated} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-theme-text-muted">
                      Фамилия
                    </label>
                    <input
                      type="text"
                      required
                      value={studentLastName}
                      onChange={(e) => setStudentLastName(e.target.value)}
                      placeholder="Иванов"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-theme-text-muted">
                      Имя
                    </label>
                    <input
                      type="text"
                      required
                      value={studentFirstName}
                      onChange={(e) => setStudentFirstName(e.target.value)}
                      placeholder="Иван"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {addStudentError && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {addStudentError}
                  </p>
                )}

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-medium transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? 'Создание...' : 'Создать'}
                  </button>
                  <button
                    type="button"
                    onClick={resetAddStudentState}
                    className="text-xs text-theme-text-muted hover:text-theme-text cursor-pointer transition-colors px-2 py-1"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Members List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider">
                Ученики ({activeClass.members.length})
              </h4>
              {activeClass.members.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Экспорт данных</span>
                  </button>
                </div>
              )}
            </div>

            {activeClass.members.length === 0 ? (
              <p className="text-xs text-theme-text-sec py-4 text-center">
                Учеников пока нет
              </p>
            ) : (
              <div className="space-y-2">
                {[...activeClass.members].sort((a, b) => {
                  const lastA = a.profiles?.last_name?.trim() || '';
                  const lastB = b.profiles?.last_name?.trim() || '';
                  const firstA = a.profiles?.first_name?.trim() || '';
                  const firstB = b.profiles?.first_name?.trim() || '';
                  return lastA.localeCompare(lastB, 'ru') || firstA.localeCompare(firstB, 'ru');
                }).map((member) => {
                  const firstName = member.profiles?.first_name?.trim() || '';
                  const lastName = member.profiles?.last_name?.trim() || '';
                  const fullName =
                    lastName && firstName
                      ? `${lastName} ${firstName}`
                      : firstName || lastName || member.profiles?.email || 'Ученик';

                  const joinedDate = new Date(member.joined_at).toLocaleDateString('ru-RU');

                  return (
                    <div
                      key={member.student_id}
                      className="rounded-xl border border-theme-border bg-theme-card text-xs overflow-hidden"
                    >
                      <div
                        onClick={() => navigate(`/teacher/classes/${classId}/students/${member.student_id}`)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-theme-text">{fullName}</p>
                          {member.profiles?.email && (
                            <p className="text-[11px] text-theme-text-muted mt-0.5">
                              {member.profiles.email}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[11px] text-theme-text-muted">{joinedDate}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveStudent(member.student_id, fullName);
                            }}
                            className="p-1 rounded-lg text-theme-text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="Удалить из класса"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {classAssignments.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-theme-border bg-theme-card">
              <ClipboardList className="w-8 h-8 text-theme-text-muted" />
              <p className="text-sm text-theme-text-muted">Заданий для этого класса пока нет</p>
            </div>
          )}
          {classAssignments.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-theme-border bg-theme-card shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-theme-border text-theme-text-muted uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-bold">Название</th>
                    <th className="py-3 px-4 font-bold">Тип</th>
                    <th className="py-3 px-4 font-bold">Срок</th>
                    <th className="py-3 px-4 font-bold text-center">Статус</th>
                    <th className="py-3 px-4 font-bold">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/60">
                  {classAssignments.map((assignment) => {
                    const status = getStatus(assignment);
                    return (
                      <tr
                        key={assignment.id}
                        onClick={() => navigate(`/teacher/assignments/${assignment.id}`)}
                        className="hover:bg-theme-bg/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-semibold text-theme-text">
                          {assignment.title}
                        </td>
                        <td className="py-3.5 px-4 text-theme-text-sec">
                          {assignment.assignment_type === 'classwork' ? 'Классная' : 'ДЗ'}
                        </td>
                        <td className="py-3.5 px-4 text-theme-text-sec">
                          {assignment.due_date
                            ? new Date(assignment.due_date).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Без срока'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {status === 'active' && (
                            <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              Активно
                            </span>
                          )}
                          {status === 'expired' && (
                            <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              Истёк срок
                            </span>
                          )}
                          {status === 'closed' && (
                            <span className="px-2 py-1 rounded-lg text-[11px] font-bold bg-theme-bg text-theme-text-muted border border-theme-border">
                              Закрыто
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAssignmentModal({
                                  type: 'toggle',
                                  assignmentId: assignment.id,
                                  newValue: !assignment.is_active,
                                  title: assignment.title,
                                })
                              }
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-theme-border bg-theme-bg text-theme-text-sec hover:text-theme-text transition-colors cursor-pointer"
                            >
                              {assignment.is_active ? (
                                <>
                                  <ToggleLeft size={13} /> Закрыть
                                </>
                              ) : (
                                <>
                                  <ToggleRight size={13} /> Открыть
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAssignmentModal({
                                  type: 'delete',
                                  assignmentId: assignment.id,
                                  title: assignment.title,
                                })
                              }
                              className="p-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <ClassAnalytics
          classId={classId!}
          className={activeClass.name}
          members={activeClass.members}
        />
      )}

      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-base font-bold text-theme-text">Исключить ученика?</h3>
            <p className="text-sm text-theme-text-muted">
              Ученик <strong className="text-theme-text">{confirmRemove.studentName}</strong> будет удалён из класса.
            </p>
            <div className="flex items-center space-x-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 text-sm rounded-xl border border-theme-border text-theme-text-muted hover:text-theme-text transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmRemoveStudent}
                className="px-4 py-2 text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors cursor-pointer"
              >
                Исключить
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-base font-bold text-theme-text">Удалить класс?</h3>
            <p className="text-sm text-theme-text-muted">
              Удалить класс? Все ученики будут исключены.
            </p>
            <div className="flex items-center space-x-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeletingClass}
                className="px-4 py-2 text-sm rounded-xl border border-theme-border text-theme-text-muted hover:text-theme-text transition-colors cursor-pointer disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClass}
                disabled={isDeletingClass}
                className="px-4 py-2 text-sm rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingClass ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment confirmation modal */}
      {confirmAssignmentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setConfirmAssignmentModal(null)}
        >
          <div
            className="bg-theme-card border border-theme-border rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-theme-text">
              {confirmAssignmentModal.type === 'toggle'
                ? confirmAssignmentModal.newValue === false
                  ? 'Закрыть задание?'
                  : 'Открыть задание?'
                : 'Удалить задание?'}
            </h3>

            <p className="text-xs text-theme-text-sec leading-relaxed">
              {confirmAssignmentModal.type === 'toggle'
                ? confirmAssignmentModal.newValue === false
                  ? `Ученики больше не смогут открыть «${confirmAssignmentModal.title}». Можно будет снова открыть.`
                  : `Ученики снова смогут открывать «${confirmAssignmentModal.title}».`
                : `Задание «${confirmAssignmentModal.title}» и все связанные сессии будут удалены. Это действие нельзя отменить.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAssignmentModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-theme-border text-theme-text-sec hover:bg-theme-bg transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (confirmAssignmentModal.type === 'toggle') {
                    await toggleAssignment(
                      confirmAssignmentModal.assignmentId,
                      confirmAssignmentModal.newValue!
                    );
                  } else {
                    await deleteAssignment(confirmAssignmentModal.assignmentId);
                  }
                  await fetchAssignments();
                  setConfirmAssignmentModal(null);
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-colors cursor-pointer ${
                  confirmAssignmentModal.type === 'delete'
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
      <ClassExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        className={activeClass.name}
        members={activeClass.members}
      />
      <RenameClassModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        initialName={activeClass.name}
        onSubmit={async (newName) => {
          const res = await renameClass(activeClass.id, newName);
          return res.error ? { ok: false, error: res.error } : { ok: true };
        }}
      />
    </div>
  );
};

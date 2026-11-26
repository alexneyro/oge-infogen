import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  GraduationCap,
  X,
  Plus,
  Copy,
  Check,
  ArrowLeft,
  Link2,
  UserPlus,
  AlertCircle,
  Users,
  KeyRound,
  UserMinus,
} from 'lucide-react';
import { useClasses } from '../hooks/useClasses';
import { supabase } from '../lib/supabase';
import { pluralRu } from '../utils/pluralize';

export interface ClassesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClassesPanel: React.FC<ClassesPanelProps> = ({ isOpen, onClose }) => {
  const {
    classes,
    loading,
    error,
    fetchClasses,
    createClass,
    addStudentWithoutEmail,
  } = useClasses();

  // Internal states
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [showAddStudent, setShowAddStudent] = useState<'none' | 'generated'>('none');
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  // Close on Escape & disable body scroll
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

  // Reset internal states on panel close
  useEffect(() => {
    if (!isOpen) {
      setActiveClassId(null);
      setShowCreateForm(false);
      setNewClassName('');
      setCreateError(null);
      resetAddStudentState();
    }
  }, [isOpen]);

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

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setIsSubmitting(true);
    setCreateError(null);

    const res = await createClass(newClassName);
    setIsSubmitting(false);

    if (res.error) {
      setCreateError(res.error);
    } else {
      setNewClassName('');
      setShowCreateForm(false);
    }
  };

  const handleAddGenerated = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClassId || !studentFirstName.trim() || !studentLastName.trim()) return;

    setIsSubmitting(true);
    setAddStudentError(null);

    const res = await addStudentWithoutEmail(
      activeClassId,
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

  const handleRemoveStudent = async (studentId: string) => {
    if (!activeClassId) return;
    if (!window.confirm('Удалить ученика из класса?')) return;
    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('class_id', activeClassId)
      .eq('student_id', studentId);
    if (!error) {
      if (expandedStudentId === studentId) setExpandedStudentId(null);
      await fetchClasses();
    }
  };

  if (!isOpen) return null;

  const activeClass = classes.find((c) => c.id === activeClassId);

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
        aria-label="Мои классы"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-theme-border shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-theme-text">Мои классы</h2>
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

          {/* VIEW A: LIST OF CLASSES */}
          {!activeClassId && (
            <div className="space-y-4">
              {/* Create Class Actions / Form */}
              {!showCreateForm ? (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Создать класс</span>
                </button>
              ) : (
                <form
                  onSubmit={handleCreateClass}
                  className="p-4 rounded-xl border border-theme-border bg-theme-bg/60 space-y-3"
                >
                  <label className="block text-xs font-semibold text-theme-text">
                    Название нового класса
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Например: 9А Информатика"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-theme-card border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    autoFocus
                  />
                  {createError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>
                  )}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmitting ? 'Создание...' : 'Создать'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewClassName('');
                        setCreateError(null);
                      }}
                      className="text-sm text-theme-text-muted hover:text-theme-text cursor-pointer transition-colors px-2 py-1"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}

              {/* Loading Skeletons */}
              {loading && classes.length === 0 && (
                <div className="space-y-3">
                  <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
                  <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
                  <div className="animate-pulse h-16 rounded-xl bg-theme-border/30" />
                </div>
              )}

              {/* Empty state */}
              {!loading && classes.length === 0 && (
                <div className="text-center py-12 px-4 space-y-2">
                  <Users className="w-10 h-10 text-theme-text-muted mx-auto stroke-1" />
                  <p className="text-sm text-theme-text-sec">
                    Классов пока нет. Создайте первый!
                  </p>
                </div>
              )}

              {/* Class Cards */}
              <div className="space-y-3">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-xl border border-theme-border bg-theme-card hover:border-theme-border/80 transition-all shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-theme-text">
                          {cls.name}
                        </h3>
                        <p className="text-xs text-theme-text-muted mt-0.5">
                          {cls.members.length} {pluralRu(cls.members.length, 'ученик', 'ученика', 'учеников')}
                        </p>
                      </div>

                      {/* Invite Code badge */}
                      <button
                        type="button"
                        onClick={() => handleCopyCode(cls.invite_code)}
                        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-theme-bg border border-theme-border text-xs text-theme-text-sec hover:text-theme-text transition-colors cursor-pointer"
                        title="Нажмите, чтобы скопировать код приглашения"
                      >
                        <span className="font-mono font-medium">Код: {cls.invite_code}</span>
                        {copiedCode === cls.invite_code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-theme-text-muted" />
                        )}
                      </button>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveClassId(cls.id)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center space-x-1"
                      >
                        <span>Открыть</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW B: CLASS DETAIL PAGE */}
          {activeClassId && activeClass && (
            <div className="space-y-5">
              {/* Back button & Class Info */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveClassId(null);
                    resetAddStudentState();
                  }}
                  className="flex items-center space-x-1 text-sm text-theme-text-muted hover:text-theme-text cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Назад</span>
                </button>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h3 className="text-lg font-bold text-theme-text">
                      {activeClass.name}
                    </h3>
                    <p className="text-xs text-theme-text-muted">
                      {activeClass.members.length} {pluralRu(activeClass.members.length, 'ученик', 'ученика', 'учеников')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(activeClass.invite_code)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-bg border border-theme-border text-xs text-theme-text-sec hover:text-theme-text transition-colors cursor-pointer"
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

              {/* Add Student block */}
              <div className="p-4 rounded-xl border border-theme-border bg-theme-bg/50 space-y-3">
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
                      className="flex items-center space-x-1.5 border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text rounded-xl px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
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
                      className="flex items-center space-x-1.5 border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text rounded-xl px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer"
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
                          className="w-full px-3 py-2 text-xs rounded-xl bg-theme-card border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                          className="w-full px-3 py-2 text-xs rounded-xl bg-theme-card border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider">
                  Ученики ({activeClass.members.length})
                </h4>

                {activeClass.members.length === 0 ? (
                  <p className="text-xs text-theme-text-sec py-4 text-center">
                    Учеников пока нет
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeClass.members.map((member) => {
                      const firstName = member.profiles?.first_name?.trim() || '';
                      const lastName = member.profiles?.last_name?.trim() || '';
                      const fullName = lastName && firstName
                        ? `${lastName} ${firstName}`
                        : firstName || lastName || member.profiles?.email || 'Ученик';

                      const joinedDate = new Date(member.joined_at).toLocaleDateString('ru-RU');

                      return (
                        <div key={member.student_id} className="rounded-xl border border-theme-border bg-theme-card text-xs overflow-hidden">
                          {/* Основная строка */}
                          <div className="p-3 flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-theme-text">{fullName}</p>
                              {member.profiles?.email && (
                                <p className="text-[11px] text-theme-text-muted mt-0.5">{member.profiles.email}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="text-[11px] text-theme-text-muted">{joinedDate}</span>
                              {/* Кнопка показать/скрыть credentials — только если есть в профиле */}
                              {member.profiles?.generated_login && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedStudentId(prev => prev === member.student_id ? null : member.student_id)}
                                  className="p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                                  title="Показать данные для входа"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {/* Кнопка удалить из класса */}
                              <button
                                type="button"
                                onClick={() => handleRemoveStudent(member.student_id)}
                                className="p-1 rounded-lg text-theme-text-muted hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                title="Удалить из класса"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Блок credentials — раскрывается */}
                          {expandedStudentId === member.student_id && member.profiles?.generated_login && (
                            <div className="px-3 pb-3 pt-0 border-t border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 font-mono space-y-1">
                              <p className="pt-2"><span className="text-theme-text-muted">Логин: </span><span className="font-bold">{member.profiles.generated_login}</span></p>
                              <p><span className="text-theme-text-muted">Пароль: </span><span className="font-bold">{member.profiles.generated_password}</span></p>
                              <div className="flex items-center space-x-2 pt-1">
                                <button type="button"
                                  onClick={() => navigator.clipboard.writeText(`Логин: ${member.profiles!.generated_login}\nПароль: ${member.profiles!.generated_password}`)}
                                  className="flex items-center space-x-1 text-amber-700 dark:text-amber-300 hover:underline cursor-pointer">
                                  <Copy className="w-3 h-3" /><span>Скопировать</span>
                                </button>
                                <button type="button"
                                  onClick={() => setExpandedStudentId(null)}
                                  className="flex items-center space-x-1 text-theme-text-muted hover:text-theme-text cursor-pointer">
                                  <X className="w-3 h-3" /><span>Скрыть</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

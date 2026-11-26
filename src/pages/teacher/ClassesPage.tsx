import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Copy,
  Check,
  AlertCircle,
  Users,
} from 'lucide-react';
import { useClasses } from '../../hooks/useClasses';
import { compareClassNames } from '../../utils/compareClassNames';
import { pluralRu } from '../../utils/pluralize';

export const ClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    classes,
    loading,
    error,
    createClass,
  } = useClasses();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  const setActiveClassId = (id: string) => navigate(`/teacher/classes/${id}`);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-2.5 pb-4 border-b border-theme-border">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <GraduationCap className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-theme-text">Мои классы</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-800 dark:text-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* LIST OF CLASSES */}
      <div className="space-y-4">
        {!showCreateForm ? (
          <div>
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Создать класс</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleCreateClass}
            className="p-4 rounded-xl border border-theme-border bg-theme-card space-y-3"
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
              className="w-full px-3 py-2 text-sm rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
          <div className="text-center py-12 px-4 space-y-2 rounded-2xl border border-theme-border bg-theme-card">
            <Users className="w-10 h-10 text-theme-text-muted mx-auto stroke-1" />
            <p className="text-sm text-theme-text-sec">
              Классов пока нет. Создайте первый!
            </p>
          </div>
        )}

        {/* Class Cards */}
        <div className="space-y-3">
          {[...classes].sort((a, b) => compareClassNames(a.name, b.name)).map((cls) => (
            <div
              key={cls.id}
              onClick={() => setActiveClassId(cls.id)}
              className="p-4 rounded-xl border border-theme-border bg-theme-card hover:border-theme-border/80 transition-all shadow-xs flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-theme-text">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-theme-text-muted mt-0.5">
                    {cls.members.length}{' '}
                    {pluralRu(cls.members.length, 'ученик', 'ученика', 'учеников')}
                  </p>
                </div>

                {/* Invite Code badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyCode(cls.invite_code);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveClassId(cls.id);
                  }}
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
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, AlertCircle } from 'lucide-react';

export interface RenameClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  onSubmit: (newName: string) => Promise<{ ok: boolean; error?: string }>;
}

export const RenameClassModal: React.FC<RenameClassModalProps> = ({
  isOpen,
  onClose,
  initialName,
  onSubmit,
}) => {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleClose = useCallback(() => {
    if (loading) return;
    onCloseRef.current();
  }, [loading]);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setName(initialName);
      setError(null);
      setLoading(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCloseRef.current();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Название класса не может быть пустым');
      return;
    }
    if (trimmed.length > 40) {
      setError('Название класса должно быть не длиннее 40 символов');
      return;
    }
    if (trimmed === initialName.trim()) {
      setError('Название не изменилось');
      return;
    }

    setLoading(true);
    try {
      const res = await onSubmit(trimmed);
      if (res.ok) {
        onCloseRef.current();
      } else {
        setError(res.error || 'Не удалось переименовать класс');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось переименовать класс');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        data-testid="rename-class-modal-backdrop"
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : handleClose}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-theme-card border border-theme-border shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-class-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <h3 id="rename-class-modal-title" className="text-sm font-bold text-theme-text">
              Переименовать класс
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="rename-class-modal-name" className="block text-xs font-medium text-theme-text-muted">
              Название класса
            </label>
            <input
              id="rename-class-modal-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              disabled={loading}
              placeholder="Название класса"
              className="w-full px-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <p className="text-xs text-theme-text-muted leading-relaxed">
            Код приглашения и состав класса не изменятся
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium rounded-xl border border-theme-border bg-theme-bg text-theme-text-sec hover:text-theme-text transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

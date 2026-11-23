import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MIN_PASSWORD_LENGTH } from '../lib/passwordPolicy';

export interface ResetPasswordModalProps {
  isOpen: boolean;
  onDone: () => void;
}

const AUTO_CLOSE_DELAY_MS = 2500;

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onDone }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneCalledRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const clearDoneTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearDoneTimer();
    if (doneCalledRef.current) return;
    doneCalledRef.current = true;
    onDoneRef.current();
  }, [clearDoneTimer]);

  useEffect(() => {
    if (isOpen) {
      clearDoneTimer();
      doneCalledRef.current = false;
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsDone(false);
    } else {
      clearDoneTimer();
    }
  }, [isOpen, clearDoneTimer]);

  useEffect(() => {
    return () => {
      clearDoneTimer();
    };
  }, [clearDoneTimer]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        finish();
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, finish]);

  if (!isOpen) return null;

  const translateError = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('new password should be different from the old password')) {
      return 'Новый пароль должен отличаться от старого';
    }
    if (lower.includes('password should be at least')) {
      return `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`;
    }
    if (lower.includes('rate limit')) {
      return 'Слишком много попыток. Пожалуйста, подождите немного';
    }
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Пароль должен быть минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMessage(translateError(error.message));
      } else {
        setSuccessMessage('Пароль изменён');
        setIsDone(true);
        clearDoneTimer();
        timerRef.current = setTimeout(() => {
          finish();
        }, AUTO_CLOSE_DELAY_MS);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Произошла непредвиденная ошибка';
      setErrorMessage(translateError(msg));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : finish}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-theme-card border border-theme-border shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 id="reset-password-modal-title" className="text-sm font-bold text-theme-text">
              Задайте новый пароль
            </h3>
          </div>
          <button
            type="button"
            onClick={finish}
            disabled={loading}
            className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success message banner */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start space-x-2 text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {isDone ? 'Пароль изменён. Теперь вы можете входить с новым паролем.' : successMessage}
            </span>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {isDone ? (
          <button
            type="button"
            onClick={finish}
            className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
          >
            Готово
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="reset-new-password" className="block text-xs font-medium text-theme-text-muted">
                Новый пароль
              </label>
              <div className="relative">
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-8 pr-9 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <Lock className="w-4 h-4 text-theme-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-theme-text-muted hover:text-theme-text cursor-pointer p-0.5 disabled:opacity-50"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="reset-confirm-password" className="block text-xs font-medium text-theme-text-muted">
                Повторите пароль
              </label>
              <div className="relative">
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-8 pr-9 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <Lock className="w-4 h-4 text-theme-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2 text-theme-text-muted hover:text-theme-text cursor-pointer p-0.5 disabled:opacity-50"
                  aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Сохранение...' : 'Сохранить пароль'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};


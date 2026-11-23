import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, EyeOff, User, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, resetPassword } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { UserRole } from '../lib/database.types';
import { MIN_PASSWORD_LENGTH } from '../lib/passwordPolicy';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'login' | 'register' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<ViewMode>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [inviteCode, setInviteCode] = useState('');

  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when modal opens or view changes
  useEffect(() => {
    if (isOpen) {
      setView('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    } else {
      setInviteCode('');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && view === 'register') {
      const pending = localStorage.getItem('pendingInviteCode');
      if (pending) {
        setInviteCode(pending);
      }
    }
  }, [isOpen, view]);

  // Handle ESC key
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

  const translateError = (msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials')) {
      return 'Неверный email или пароль';
    }
    if (lower.includes('already registered') || lower.includes('user already exists')) {
      return 'Пользователь с таким email уже зарегистрирован';
    }
    if (lower.includes('password should be at least')) {
      return `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`;
    }
    if (lower.includes('rate limit')) {
      return 'Слишком много попыток. Пожалуйста, подождите немного';
    }
    if (lower.includes('email not confirmed')) {
      return 'Почта не подтверждена. Откройте письмо со ссылкой подтверждения.';
    }
    return msg;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithEmail(cleanEmail, password);
      if (error) {
        setErrorMessage(translateError(error.message));
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Произошла непредвиденная ошибка';
      setErrorMessage(translateError(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim();

    if (!cleanFirstName || !cleanLastName || !cleanEmail || !password || !confirmPassword) {
      setErrorMessage('Все поля обязательны для заполнения');
      return;
    }

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
      const { data: signUpData, error } = await signUpWithEmail(cleanEmail, password, cleanFirstName, cleanLastName, role);
      if (error) {
        setErrorMessage(translateError(error.message));
      } else if (
        signUpData.user &&
        Array.isArray(signUpData.user.identities) &&
        signUpData.user.identities.length === 0
      ) {
        if (role === 'student' && inviteCode.trim()) {
          localStorage.setItem('pendingInviteCode', inviteCode.trim().toUpperCase());
        }
        setErrorMessage('Этот email уже зарегистрирован. Войдите в аккаунт или нажмите «Забыли пароль?»');
        return;
      } else {
        const newUserId = signUpData.user?.id;
        if (role === 'student' && inviteCode.trim() && newUserId) {
          const { data: rpcData } = await (supabase as any).rpc('join_class_by_invite', {
            p_invite_code: inviteCode.trim().toUpperCase(),
            p_student_id: newUserId,
          });
          // rpcData.error можно игнорировать — не критично для регистрации
        }
        localStorage.removeItem('pendingInviteCode');
        setSuccessMessage('Проверьте почту — мы отправили письмо для подтверждения');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Произошла непредвиденная ошибка';
      setErrorMessage(translateError(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Введите адрес электронной почты');
      return;
    }

    setLoading(true);
    try {
      const { error } = await resetPassword(cleanEmail);
      if (error) {
        setErrorMessage(translateError(error.message));
      } else {
        setSuccessMessage('Ссылка для сброса пароля отправлена на почту');
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
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-theme-card border border-theme-border shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 id="auth-modal-title" className="text-sm font-bold text-theme-text">
              {view === 'login' && 'Вход в аккаунт'}
              {view === 'register' && 'Регистрация'}
              {view === 'reset' && 'Восстановление пароля'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success message banner */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start space-x-2 text-xs text-emerald-800 dark:text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-2 text-xs text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* LOGIN VIEW */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-theme-text-muted">
                Почта / логин
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.ru или oge_bigfox32"
                  autoComplete="username"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-theme-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-theme-text-muted">
                  Пароль
                </label>
                <button
                  type="button"
                  onClick={() => setView('reset')}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Забыли пароль?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-8 pr-9 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-theme-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-theme-text-muted hover:text-theme-text cursor-pointer p-0.5"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Загрузка...' : 'Войти'}
            </button>

            <div className="pt-2 text-center border-t border-theme-border/60">
              <button
                type="button"
                onClick={() => setView('register')}
                className="text-xs text-theme-text-sec hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                Нет аккаунта? <span className="text-blue-600 dark:text-blue-400 font-semibold underline">Зарегистрироваться</span>
              </button>
            </div>
          </form>
        )}

        {/* REGISTER VIEW */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-theme-text-muted">
                Фамилия
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Иванов"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <User className="w-4 h-4 text-theme-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-theme-text-muted">
                Имя
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Иван"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <User className="w-4 h-4 text-theme-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-theme-text-muted">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-theme-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-theme-text-muted">
                Код класса <span className="text-theme-text-muted/70 font-normal">(если есть)</span>
              </label>
              <input
                type="text"
                disabled={role === 'teacher'}
                value={role === 'teacher' ? '' : inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder={role === 'teacher' ? 'Для учителя не нужно' : 'GCWB2F'}
                className="w-full px-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* Role radio selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-theme-text-muted">
                Роль
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    role === 'student'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'border-theme-border bg-theme-bg text-theme-text-sec hover:text-theme-text'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={role === 'student'}
                    onChange={() => setRole('student')}
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  <span>Ученик</span>
                </label>

                <label
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    role === 'teacher'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'border-theme-border bg-theme-bg text-theme-text-sec hover:text-theme-text'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={role === 'teacher'}
                    onChange={() => setRole('teacher')}
                    className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                  <span>Учитель</span>
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-theme-text-muted">
                Пароль (минимум {MIN_PASSWORD_LENGTH} символов)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-8 pr-9 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-theme-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-theme-text-muted hover:text-theme-text cursor-pointer p-0.5"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-theme-text-muted">
                Подтверждение пароля
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-8 pr-9 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-theme-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2 text-theme-text-muted hover:text-theme-text cursor-pointer p-0.5"
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
              {loading ? 'Загрузка...' : 'Создать аккаунт'}
            </button>

            <div className="pt-2 text-center border-t border-theme-border/60">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-xs text-theme-text-sec hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                Уже есть аккаунт? <span className="text-blue-600 dark:text-blue-400 font-semibold underline">Войти</span>
              </button>
            </div>
          </form>
        )}

        {/* RESET VIEW */}
        {view === 'reset' && (
          <form onSubmit={handleReset} className="space-y-3.5">
            <p className="text-xs text-theme-text-sec leading-relaxed">
              Введите email, указанный при регистрации, и мы отправим ссылку для восстановления пароля.
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-theme-text-muted">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-theme-bg border border-theme-border text-theme-text placeholder:text-theme-text-muted focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-theme-text-muted absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Загрузка...' : 'Отправить ссылку'}
            </button>

            <div className="pt-2 text-center border-t border-theme-border/60">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Вернуться ко входу
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

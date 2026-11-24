import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, KeyRound, Eye, EyeOff, Check, AlertCircle, Bell, Pencil } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { MIN_PASSWORD_LENGTH } from '../../lib/passwordPolicy';
import { RenameNameModal } from '../../components/RenameNameModal';

export const TeacherProfilePage: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [metrics, setMetrics] = useState({ classCount: 0, studentCount: 0, assignmentCount: 0 });
  const [notifInterval, setNotifInterval] = useState<'instant' | 'daily' | 'never'>('instant');
  const [notifTime, setNotifTime] = useState<string>('18:00');
  const [saving, setSaving] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const loadNotifSettings = async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('notification_interval, notification_time')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        if (data.notification_interval) {
          const val = data.notification_interval as 'instant' | 'daily' | 'never';
          if (val === 'instant' || val === 'daily' || val === 'never') {
            setNotifInterval(val);
          }
        }
        if (data.notification_time) {
          setNotifTime(data.notification_time);
        }
      } else if (profile) {
        if (profile.notification_interval) {
          setNotifInterval(profile.notification_interval as 'instant' | 'daily' | 'never');
        }
        if ((profile as any).notification_time) {
          setNotifTime((profile as any).notification_time);
        }
      }
    };
    loadNotifSettings();
  }, [user?.id, profile]);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data: classes } = await (supabase as any)
        .from('classes')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('is_archived', false);
      const classIds = (classes || []).map((c: any) => c.id);
      let studentCount = 0;
      if (classIds.length > 0) {
        const { count } = await (supabase as any)
          .from('class_members')
          .select('student_id', { count: 'exact', head: true })
          .in('class_id', classIds);
        studentCount = count ?? 0;
      }
      const { count: assignCount } = await (supabase as any)
        .from('assignments')
        .select('id', { count: 'exact', head: true })
        .in('class_id', classIds.length > 0 ? classIds : ['00000000-0000-0000-0000-000000000000']);
      setMetrics({
        classCount: classIds.length,
        studentCount,
        assignmentCount: assignCount ?? 0,
      });
    };
    load();
  }, [user?.id]);

  const handleRenameSubmit = async (
    first: string,
    last: string
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!user?.id) {
      return { ok: false, error: 'Пользователь не найден' };
    }
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          first_name: first,
          last_name: last,
          display_name: `${first} ${last}`,
        })
        .eq('id', user.id);

      if (error) {
        return { ok: false, error: error.message || 'Не удалось сохранить имя и фамилию' };
      }

      await refreshProfile();
      return { ok: true };
    } catch (err: unknown) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Не удалось сохранить имя и фамилию',
      };
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);
    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailError('Введите корректный email');
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setEmailLoading(false);
    if (error) {
      setEmailError(error.message);
    } else {
      setEmailSuccess(true);
      setNewEmail('');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (!currentPassword) {
      setPwError('Введите текущий пароль');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPwError(`Пароль должен быть минимум ${MIN_PASSWORD_LENGTH} символов`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Пароли не совпадают');
      return;
    }
    if (newPassword === currentPassword) {
      setPwError('Новый пароль должен отличаться от старого');
      return;
    }
    if (!user?.email) {
      setPwError('Не удалось определить email пользователя');
      return;
    }

    setPwLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        const msg = (signInError.message || '').toLowerCase();
        if (msg.includes('rate limit') || (signInError as { status?: number }).status === 429) {
          setPwError('Слишком много попыток. Подождите немного');
        } else {
          setPwError('Текущий пароль неверный');
        }
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPwError(error.message);
      } else {
        setPwSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwSuccess(false), 3000);
      }
    } catch {
      setPwError('Не удалось проверить текущий пароль');
    } finally {
      setPwLoading(false);
    }
  };

  const handleIntervalChange = async (newVal: 'instant' | 'daily' | 'never') => {
    if (!user?.id) return;
    setNotifSuccess(false);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    setNotifError(null);
    setNotifInterval(newVal);
    setSaving(true);

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          notification_interval: newVal,
          notification_time: notifTime,
        })
        .eq('id', user.id);

      if (error) {
        setNotifError(error.message);
      } else {
        setNotifSuccess(true);
        successTimeoutRef.current = setTimeout(() => {
          setNotifSuccess(false);
        }, 2000);
      }
    } catch (e: any) {
      setNotifError(e?.message || 'Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (newTime: string) => {
    setNotifTime(newTime);
    setNotifSuccess(false);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    setNotifError(null);
    if (timeDebounceRef.current) {
      clearTimeout(timeDebounceRef.current);
    }
    timeDebounceRef.current = setTimeout(async () => {
      if (!user?.id) return;
      setSaving(true);
      try {
        const { error } = await (supabase as any)
          .from('profiles')
          .update({
            notification_interval: notifInterval,
            notification_time: newTime,
          })
          .eq('id', user.id);

        if (error) {
          setNotifError(error.message);
        } else {
          setNotifSuccess(true);
          successTimeoutRef.current = setTimeout(() => {
            setNotifSuccess(false);
          }, 2000);
        }
      } catch (e: any) {
        setNotifError(e?.message || 'Ошибка сохранения настроек');
      } finally {
        setSaving(false);
      }
    }, 800);
  };

  const fullName =
    [profile?.last_name, profile?.first_name].filter(Boolean).join(' ') ||
    user?.email ||
    'Учитель';

  const fn = profile?.first_name?.trim()?.[0] || '';
  const ln = profile?.last_name?.trim()?.[0] || '';
  const initials = (fn && ln ? `${fn}${ln}` : fn || ln || (user?.email ? user.email[0] : 'У')).toUpperCase();

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center space-x-2.5 pb-4 border-b border-theme-border">
        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold text-theme-text">Профиль</h1>
      </div>

      {/* Карточка профиля */}
      <div className="bg-theme-card rounded-2xl border border-theme-border p-6">
        {/* Верхняя часть: аватар, инфо и метрики */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-theme-text truncate">{fullName}</h2>
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 shrink-0">
                Учитель
              </span>
              <button
                type="button"
                onClick={() => setIsRenameOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme-border bg-theme-bg text-xs font-medium text-theme-text-sec hover:text-theme-text hover:bg-theme-border/30 transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Изменить имя</span>
              </button>
            </div>
            {user?.email && (
              <div className="flex items-center gap-1 text-sm text-theme-text-muted">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { label: 'В системе с', value: joinedDate ?? '—' },
                { label: 'Классов', value: String(metrics.classCount) },
                { label: 'Учеников', value: String(metrics.studentCount) },
                { label: 'Выдано работ', value: String(metrics.assignmentCount) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-theme-bg border border-theme-border px-3 py-2 min-w-[100px]">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-theme-text-muted">{label}</div>
                  <div className="text-base font-bold text-theme-text mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Настройки уведомлений */}
      <div className="bg-theme-card rounded-2xl border border-theme-border p-6">
        <div className="flex items-center gap-1.5 mb-1">
          <Bell className="w-4 h-4 text-theme-text-muted" />
          <h3 className="text-sm font-semibold text-theme-text">Настройки уведомлений</h3>
        </div>
        <p className="text-xs text-theme-text-muted mb-4">
          Как часто отправлять вам email-уведомления о сдаче работ учениками
        </p>

        <div className="space-y-2.5 max-w-md">
          {[
            { value: 'instant', label: 'Сразу при завершении работы' },
            { value: 'daily', label: 'Раз в день' },
            { value: 'never', label: 'Не отправлять' },
          ].map((item) => (
            <label
              key={item.value}
              className={`flex items-center space-x-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                notifInterval === item.value
                  ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 text-theme-text'
                  : 'border-theme-border bg-theme-bg hover:bg-theme-border/20 text-theme-text-sec'
              }`}
            >
              <input
                type="radio"
                name="notification_interval"
                value={item.value}
                checked={notifInterval === item.value}
                onChange={() => handleIntervalChange(item.value as 'instant' | 'daily' | 'never')}
                disabled={saving}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-theme-border"
              />
              <span className="text-sm font-medium">{item.label}</span>
            </label>
          ))}
        </div>

        {notifInterval === 'daily' && (
          <div className="mt-4 p-4 rounded-xl border border-theme-border bg-theme-bg/50 max-w-md space-y-2">
            <label className="block text-xs font-semibold text-theme-text">
              Время отправки (по МСК)
            </label>
            <input
              type="time"
              value={notifTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              onClick={(e) => {
                try {
                  (e.target as HTMLInputElement).showPicker?.();
                } catch {
                  // ignore
                }
              }}
              disabled={saving}
              className="w-full bg-theme-bg border border-theme-border rounded-xl px-3.5 py-2 text-sm text-theme-text focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:[color-scheme:dark] cursor-pointer"
            />
            <p className="text-xs text-theme-text-muted">
              Время учитывается по московскому времени (UTC+3)
            </p>
          </div>
        )}

        {saving && (
          <div className="text-xs text-theme-text-muted mt-3">
            Сохранение...
          </div>
        )}

        {!saving && notifSuccess && (
          <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 mt-3">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>Настройки сохранены</span>
          </div>
        )}

        {notifError && (
          <div className="flex items-center space-x-2 text-xs text-red-600 dark:text-red-400 mt-3">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{notifError}</span>
          </div>
        )}
      </div>

      {/* Сменить email */}
      <div className="bg-theme-card rounded-2xl border border-theme-border p-6">
        <div className="flex items-center gap-1.5 mb-1">
          <Mail className="w-4 h-4 text-theme-text-muted" />
          <h3 className="text-sm font-semibold text-theme-text">Сменить email</h3>
        </div>
        <p className="text-xs text-theme-text-muted mb-3">
          {user?.email && user.email.includes('@') && !user.email.includes('generated')
            ? `Текущий: ${user.email}`
            : 'Сейчас используется сгенерированный логин'}
        </p>

        <form onSubmit={handleChangeEmail} className="space-y-3">
          <div className="max-w-md">
            <input
              type="email"
              placeholder="Новый email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-xl border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {emailError && (
            <div className="flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          {emailSuccess && (
            <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>На новый адрес отправлено письмо с подтверждением</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={emailLoading || !newEmail.trim()}
              className="px-4 py-2 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer"
            >
              {emailLoading ? 'Сохранение...' : 'Сменить email'}
            </button>
          </div>
        </form>
      </div>

      {/* Карточка смены пароля */}
      <div className="bg-theme-card rounded-2xl border border-theme-border p-6">
        <div className="flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-theme-text-muted" />
          <h3 className="text-sm font-semibold text-theme-text">Сменить пароль</h3>
        </div>

        <form onSubmit={handleChangePassword} className="mt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Текущий пароль */}
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                placeholder="Текущий пароль"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={pwLoading}
                className="w-full rounded-xl border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/40 pr-10 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(p => !p)}
                disabled={pwLoading}
                aria-label={showCurrent ? 'Скрыть пароль' : 'Показать пароль'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Новый пароль */}
            <div className="relative sm:col-start-1">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={pwLoading}
                className="w-full rounded-xl border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/40 pr-10 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowNew(p => !p)}
                disabled={pwLoading}
                aria-label={showNew ? 'Скрыть пароль' : 'Показать пароль'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Подтверждение */}
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Повторите новый пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={pwLoading}
                className="w-full rounded-xl border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/40 pr-10 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(p => !p)}
                disabled={pwLoading}
                aria-label={showConfirm ? 'Скрыть пароль' : 'Показать пароль'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Живая валидация */}
          <div className="flex flex-wrap gap-4 text-xs">
            <span className={newPassword.length >= MIN_PASSWORD_LENGTH ? 'text-emerald-500' : 'text-theme-text-muted'}>
              {newPassword.length >= MIN_PASSWORD_LENGTH ? '✓' : '○'} Не менее {MIN_PASSWORD_LENGTH} символов
            </span>
            <span className={newPassword && confirmPassword && newPassword === confirmPassword ? 'text-emerald-500' : 'text-theme-text-muted'}>
              {newPassword && confirmPassword && newPassword === confirmPassword ? '✓' : '○'} Пароли совпадают
            </span>
          </div>

          {/* Ошибка */}
          {pwError && (
            <div className="flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}

          {/* Успех */}
          {pwSuccess && (
            <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Пароль успешно изменён!</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={pwLoading || !currentPassword || newPassword.length < MIN_PASSWORD_LENGTH || newPassword !== confirmPassword}
              className="px-4 py-2 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer"
            >
              {pwLoading ? 'Сохранение...' : 'Сменить пароль'}
            </button>
          </div>
        </form>
      </div>

      <RenameNameModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        initialFirstName={profile?.first_name ?? ''}
        initialLastName={profile?.last_name ?? ''}
        confirmText="Имя изменится в вашем профиле"
        onSubmit={handleRenameSubmit}
      />
    </div>
  );
};

export const ProfilePage = TeacherProfilePage;
export default TeacherProfilePage;

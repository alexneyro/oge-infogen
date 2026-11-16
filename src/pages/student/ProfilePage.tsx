import React, { useState, useEffect } from 'react';
import { KeyRound, Copy, ChevronDown, ChevronUp, Eye, EyeOff, Check, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

type ExtendedProfile = NonNullable<ReturnType<typeof useAuth>['profile']> & {
  generated_login?: string | null;
  generated_password?: string | null;
  streak_current?: number | null;
};

export const ProfilePage: React.FC = () => {
  const { profile: rawProfile, user } = useAuth();
  const profile = rawProfile as ExtendedProfile | null;
  const [showCredentials, setShowCredentials] = useState(false);
  const [metrics, setMetrics] = useState({ totalSolved: 0, correct: 0, streak: profile?.streak_current ?? 0 });
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await (supabase as any)
        .from('sessions')
        .select('score, max_score, mode')
        .eq('user_id', user.id);
      const rows = data || [];
      const totalSolved = rows.length;
      const correct = rows.filter((r: any) => r.score === r.max_score && r.max_score > 0).length;
      setMetrics({
        totalSolved,
        correct,
        streak: profile?.streak_current ?? 0,
      });
    };
    load();
  }, [user?.id, profile?.streak_current]);

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
    if (newPassword.length < 8) {
      setPwError('Пароль должен быть минимум 8 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Пароли не совпадают');
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const firstInitial = profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : '';
  const lastInitial = profile?.last_name ? profile.last_name.charAt(0).toUpperCase() : '';
  const initials = (firstInitial + lastInitial) || 'У';

  const fullName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.first_name || profile?.last_name || 'Ученик';

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const pct = metrics.totalSolved > 0 ? Math.round((metrics.correct / metrics.totalSolved) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Карточка профиля */}
      <div className="bg-theme-card rounded-2xl border border-theme-border p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-theme-text truncate">{fullName}</h2>
              <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 shrink-0">
                Ученик
              </span>
            </div>
            {(profile?.email || user?.email) && (
              <div className="text-sm text-theme-text-muted truncate">
                {profile?.email || user?.email}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { label: 'В системе с', value: joinedDate ?? '—' },
                { label: 'Решено', value: String(metrics.totalSolved) },
                { label: 'Верно', value: `${pct}%` },
                { label: 'Серия', value: String(metrics.streak) },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-theme-bg border border-theme-border px-3 py-2 min-w-[90px]">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-theme-text-muted">{label}</div>
                  <div className="text-base font-bold text-theme-text mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Данные для входа (только если есть generated_login) */}
      {profile?.generated_login && (
        <div className="bg-theme-card rounded-2xl border border-theme-border overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCredentials((prev) => !prev)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-theme-text">
              <KeyRound size={16} className="text-amber-400" />
              Данные для входа
            </div>
            {showCredentials ? (
              <ChevronUp size={16} className="text-theme-text-sec" />
            ) : (
              <ChevronDown size={16} className="text-theme-text-sec" />
            )}
          </button>
          {showCredentials && (
            <div className="px-5 pb-4 font-mono text-sm border-t border-theme-border pt-3">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div>Логин: <span className="font-bold text-theme-text">{profile.generated_login}</span></div>
                  <div>Пароль: <span className="font-bold text-theme-text">{profile.generated_password}</span></div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Логин: ${profile.generated_login}\nПароль: ${profile.generated_password}`
                    );
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Copy size={14} /> Скопировать
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Смена пароля */}
      <div className="bg-theme-card rounded-2xl border border-theme-border p-6">
        <div className="flex items-center gap-1.5 mb-4">
          <KeyRound className="w-4 h-4 text-theme-text-muted" />
          <h3 className="text-sm font-semibold text-theme-text">Сменить пароль</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="Новый пароль"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/40 pr-10"
              />
              <button type="button" onClick={() => setShowNew(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text cursor-pointer">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Повторите новый пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-theme-border bg-theme-bg px-3 py-2.5 text-sm text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-500/40 pr-10"
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text cursor-pointer">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className={newPassword.length >= 8 ? 'text-emerald-500' : 'text-theme-text-muted'}>
              {newPassword.length >= 8 ? '✓' : '○'} Не менее 8 символов
            </span>
            <span className={newPassword && confirmPassword && newPassword === confirmPassword ? 'text-emerald-500' : 'text-theme-text-muted'}>
              {newPassword && confirmPassword && newPassword === confirmPassword ? '✓' : '○'} Пароли совпадают
            </span>
          </div>
          {pwError && (
            <div className="flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Пароль успешно изменён!</span>
            </div>
          )}
          <button
            type="submit"
            disabled={pwLoading || !newPassword || !confirmPassword}
            className="px-4 py-2 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors cursor-pointer"
          >
            {pwLoading ? 'Сохранение...' : 'Сменить пароль'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

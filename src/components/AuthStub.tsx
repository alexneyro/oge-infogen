import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, History, Bell, GraduationCap, BarChart2, ClipboardList, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { signOut } from '../lib/auth';
import { AuthModal } from './AuthModal';

function formatNotificationDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

export const AuthStub: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsPanelRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationsPanelRef.current &&
        !notificationsPanelRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  // Loading skeleton button
  if (loading) {
    return (
      <div 
        className="w-8 h-8 rounded-full bg-theme-border animate-pulse shrink-0"
        aria-hidden="true"
      />
    );
  }

  // Not logged in: show Login button
  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="h-9 px-3 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text font-medium text-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer flex items-center space-x-1.5 shrink-0 shadow-xs"
          aria-label="Вход в аккаунт"
          id="auth-stub-btn"
        >
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Войти</span>
        </button>

        <AuthModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  // Logged in: show user avatar button & dropdown menu
  const firstName = profile?.first_name?.trim() || '';
  const lastName = profile?.last_name?.trim() || '';
  const rawName = lastName && firstName
    ? `${lastName} ${firstName}`
    : firstName || lastName || user.email || 'Пользователь';
  const avatarLetter = (lastName[0] || firstName[0] || 'U').toUpperCase();
  const roleLabel = profile?.role === 'teacher' ? 'Учитель' : 'Ученик';

  return (
    <div className="sm:relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="relative w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer select-none"
        aria-label="Меню пользователя"
        aria-expanded={isDropdownOpen}
      >
        {avatarLetter}
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs translate-x-1 -translate-y-1"
            aria-label={`Непрочитанных уведомлений: ${unreadCount}`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 max-sm:right-3 top-full mt-2 w-48 rounded-xl bg-theme-card border border-theme-border shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
          {/* User info header (read-only) */}
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-theme-text truncate" title={rawName}>
              {rawName}
            </p>
            <p className="text-[11px] text-theme-text-muted mt-0.5">
              {roleLabel}
            </p>
          </div>

          <div className="my-1 border-t border-theme-border/60" />

          {/* Для учителя — Мои классы и Мои задания */}
          {profile?.role === 'teacher' && (
            <>
              <button
                type="button"
                onClick={() => { navigate('/teacher/profile'); setIsDropdownOpen(false); }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-theme-text hover:bg-theme-bg rounded-lg transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-theme-text-muted" />
                <span>Профиль</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate('/teacher/classes');
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-theme-text hover:bg-theme-bg rounded-lg transition-colors cursor-pointer text-left"
              >
                <GraduationCap className="w-3.5 h-3.5 text-theme-text-muted" />
                <span>Мои классы</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate('/teacher/assignments');
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-theme-text hover:bg-theme-bg rounded-lg transition-colors cursor-pointer text-left"
              >
                <ClipboardList className="w-3.5 h-3.5 text-theme-text-muted" />
                <span>Мои задания</span>
              </button>
            </>
          )}

          {/* Для ученика — Мои задания */}
          {profile?.role === 'student' && (
            <>
              <button
                type="button"
                onClick={() => { navigate('/student/profile'); setIsDropdownOpen(false); }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-theme-text hover:bg-theme-bg rounded-lg transition-colors cursor-pointer text-left"
              >
                <User className="w-3.5 h-3.5 text-theme-text-muted" />
                <span>Профиль</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate('/student/assignments');
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-theme-text hover:bg-theme-bg rounded-lg transition-colors cursor-pointer text-left"
              >
                <ClipboardList className="w-3.5 h-3.5 text-theme-text-muted" />
                <span>Мои задания</span>
              </button>
            </>
          )}

          {/* Профиль */}
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(false);
              navigate(profile?.role === 'teacher' ? '/teacher/stats' : '/student/stats');
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-theme-text hover:bg-theme-bg rounded-lg transition-colors cursor-pointer text-left"
          >
            <BarChart2 className="w-3.5 h-3.5 text-theme-text-muted" />
            <span>Моя статистика</span>
          </button>

          {/* История */}
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen(false);
              navigate(profile?.role === 'teacher' ? '/teacher/history' : '/student/history');
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-theme-text hover:bg-theme-bg rounded-lg transition-colors cursor-pointer text-left"
          >
            <History className="w-3.5 h-3.5 text-theme-text-muted" />
            <span>История решений</span>
          </button>

          {/* Уведомления */}
          <button
            type="button"
            onClick={() => {
              setShowNotifications(true);
              setIsDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs text-theme-text hover:bg-theme-bg rounded-lg transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center space-x-2">
              <Bell className="w-3.5 h-3.5 text-theme-text-muted" />
              <span>Уведомления</span>
            </div>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <div className="my-1 border-t border-theme-border/60" />

          {/* Выйти */}
          <button
            type="button"
            onClick={async () => {
              setIsDropdownOpen(false);
              await signOut();
              // Очищаем данные ДЗ из localStorage
              localStorage.removeItem('pendingAssignmentCode');
              localStorage.removeItem('pendingAssignmentTitle');
              localStorage.removeItem('pendingAssignmentHideReview');
              localStorage.removeItem('pendingAssignmentId');
              localStorage.removeItem('pendingSetCode');
              navigate('/');
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>
      )}

      {/* Панель уведомлений */}
      {showNotifications && (
        <div
          ref={notificationsPanelRef}
          className="absolute left-3 right-3 top-full mt-2 z-50 w-auto sm:left-auto sm:right-0 sm:w-80 rounded-2xl bg-theme-card border border-theme-border shadow-xl text-left overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-theme-border flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-theme-text">Уведомления</h3>
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Все прочитаны
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="w-6 h-6 rounded-lg hover:bg-theme-bg text-theme-text-muted hover:text-theme-text flex items-center justify-center transition-colors cursor-pointer text-base leading-none font-semibold"
                aria-label="Закрыть уведомления"
              >
                ×
              </button>
            </div>
          </div>

          {/* List of notifications */}
          <div className="max-h-[min(24rem,60vh)] overflow-y-auto divide-y divide-theme-border">
            {notifLoading && notifications.length === 0 ? (
              <div className="p-6 text-center text-xs theme-text-muted">
                Загрузка...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm theme-text-muted">
                Уведомлений пока нет
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.is_read;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.type === 'new_assignment' && n.payload?.assignmentId) {
                        navigate('/student/assignments');
                        setShowNotifications(false);
                      } else if (n.type === 'set_finished' && n.payload?.assignmentId) {
                        navigate(`/teacher/assignments/${n.payload.assignmentId}`);
                        setShowNotifications(false);
                      } else if (n.type === 'mock_attached') {
                        navigate('/student/history');
                        setShowNotifications(false);
                      }
                    }}
                    className={`p-3.5 border-b border-theme-border cursor-pointer transition-colors hover:bg-theme-bg/60 last:border-b-0 ${
                      isUnread
                        ? 'border-l-2 border-blue-500 bg-blue-500/5'
                        : ''
                    }`}
                  >
                    {n.payload?.title && (
                      <p className="font-bold text-xs text-theme-text leading-snug">
                        {n.payload.title}
                      </p>
                    )}
                    {n.payload?.message && (
                      <p className="theme-text-muted text-sm mt-0.5 leading-snug">
                        {n.payload.message}
                      </p>
                    )}
                    {n.payload?.maxAttempts !== undefined && n.payload?.maxAttempts !== null && (
                      <p className="text-xs text-theme-text-muted mt-0.5">
                        Попыток: {n.payload.maxAttempts}
                      </p>
                    )}
                    {n.payload?.dueDate && (
                      <p className="text-xs text-theme-text-muted mt-0.5">
                        {'Срок: ' + new Date(n.payload.dueDate).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                    <p className="text-[11px] text-theme-text-muted mt-1.5 opacity-70">
                      {formatNotificationDate(n.created_at)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

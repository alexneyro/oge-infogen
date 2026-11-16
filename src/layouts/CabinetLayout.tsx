import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { GraduationCap, ClipboardList, BarChart2, History, Monitor, Menu, X, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AuthStub } from '../components/AuthStub';
import { ThemeToggle } from '../components/ThemeToggle';

export const CabinetLayout: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  if (loading || (user && profile == null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const pathname = location.pathname;
  if (pathname.startsWith('/teacher/') && profile?.role !== 'teacher') {
    return <Navigate to="/" replace />;
  }

  if (pathname.startsWith('/student/') && profile?.role !== 'student') {
    return <Navigate to="/" replace />;
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `w-full flex items-center space-x-2.5 px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
      isActive
        ? 'bg-theme-bg rounded-lg text-blue-600 dark:text-blue-400'
        : 'text-theme-text-sec hover:text-theme-text hover:bg-theme-bg/50 rounded-lg'
    }`;

  const renderNavItems = (onItemClick?: () => void) => (
    <>
      <nav className="space-y-1">
        {profile?.role === 'teacher' && (
          <>
            <NavLink to="/teacher/profile" onClick={onItemClick} className={navLinkClass}>
              <User className="w-4 h-4 shrink-0" />
              <span>Профиль</span>
            </NavLink>
            <NavLink to="/teacher/classes" onClick={onItemClick} className={navLinkClass}>
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Классы</span>
            </NavLink>
            <NavLink to="/teacher/assignments" onClick={onItemClick} className={navLinkClass}>
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Задания</span>
            </NavLink>
            <NavLink to="/teacher/stats" onClick={onItemClick} className={navLinkClass}>
              <BarChart2 className="w-4 h-4 shrink-0" />
              <span>Моя статистика</span>
            </NavLink>
            <NavLink to="/teacher/history" onClick={onItemClick} className={navLinkClass}>
              <History className="w-4 h-4 shrink-0" />
              <span>История решений</span>
            </NavLink>
          </>
        )}

        {profile?.role === 'student' && (
          <>
            <NavLink to="/student/profile" onClick={onItemClick} className={navLinkClass}>
              <User className="w-4 h-4 shrink-0" />
              <span>Профиль</span>
            </NavLink>
            <NavLink to="/student/assignments" onClick={onItemClick} className={navLinkClass}>
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Задания</span>
            </NavLink>
            <NavLink to="/student/stats" onClick={onItemClick} className={navLinkClass}>
              <BarChart2 className="w-4 h-4 shrink-0" />
              <span>Статистика</span>
            </NavLink>
            <NavLink to="/student/history" onClick={onItemClick} className={navLinkClass}>
              <History className="w-4 h-4 shrink-0" />
              <span>История</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t border-theme-border/60 mt-auto pt-4">
        <NavLink to="/" onClick={onItemClick} className={navLinkClass}>
          <Monitor className="w-4 h-4 shrink-0" />
          <span>Тренажёр</span>
        </NavLink>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-theme-bg text-theme-text transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-theme-card border-b border-theme-border/80 transition-colors shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-20 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center">
          {/* Левая зона: бренд и подпись */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 shrink-0 justify-self-start cursor-pointer text-left"
          >
            <span className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0">
              <Monitor className="w-5 h-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400 tracking-tight whitespace-nowrap leading-[1.1]" id="main-title">
                Инфоген
              </h1>
              <p className="text-[11px] text-theme-text-muted leading-[1.15] max-w-[190px] hidden lg:block">
                <span className="block">Генератор заданий и вариантов</span>
                <span className="block">ОГЭ по&nbsp;информатике</span>
              </p>
            </div>
          </button>

          {/* Центральная пустая ячейка сетки для полного совпадения с App.tsx */}
          <div className="hidden sm:block" />

          {/* Правая зона: тема, профиль, гамбургер */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 justify-self-end">
            <ThemeToggle />
            <AuthStub />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text-sec transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              aria-label="Открыть меню"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Body with Sidebar & Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 h-[calc(100vh-4rem)] lg:h-[calc(100vh-5rem)] sticky top-16 lg:top-20 bg-theme-card border-r border-theme-border p-3">
          {renderNavItems()}
        </aside>

        {/* Mobile Drawer (from right side) */}
        <div
          className={`fixed inset-0 z-50 md:hidden transition-opacity duration-200 ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside
            className={`fixed top-0 right-0 bottom-0 z-10 w-64 bg-theme-card border-l border-theme-border shadow-xl flex flex-col p-4 transition-transform duration-200 ${
              isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-theme-border">
              <span className="text-sm font-bold text-theme-text">Навигация</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg cursor-pointer"
                aria-label="Закрыть меню"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavItems(() => setIsMobileMenuOpen(false))}
          </aside>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

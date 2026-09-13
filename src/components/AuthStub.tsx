import React, { useState, useEffect } from 'react';
import { User, X, Info } from 'lucide-react';

export const AuthStub: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text-sec hover:text-theme-text transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer flex items-center justify-center shrink-0"
        aria-label="Вход в аккаунт"
        title="Вход в аккаунт"
        id="auth-stub-btn"
      >
        <User className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Card */}
          <div
            className="relative w-full max-w-sm rounded-2xl bg-theme-card border border-theme-border shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-left"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <div className="flex items-center justify-between pb-2 border-b border-theme-border/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 id="auth-modal-title" className="text-sm font-bold text-theme-text">
                  Личный кабинет
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-bg transition-colors cursor-pointer"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2 flex items-start space-x-3 text-theme-text-sec">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">
                Аккаунты появятся позже
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

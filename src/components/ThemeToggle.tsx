import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, Theme } from '../hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Светлая', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Тёмная', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'Системная', icon: <Laptop className="w-4 h-4" /> },
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl border border-theme-border bg-theme-card hover:bg-theme-bg text-theme-text-sec hover:text-theme-text transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer flex items-center justify-center shrink-0"
        aria-label="Переключить тему оформления"
        title={`Тема: ${theme === 'system' ? `Системная (${resolvedTheme === 'dark' ? 'тёмная' : 'светлая'})` : theme === 'dark' ? 'Тёмная' : 'Светлая'}`}
        id="theme-toggle-btn"
      >
        {theme === 'system' ? (
          <Laptop className="w-4 h-4" />
        ) : theme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl bg-theme-card border border-theme-border shadow-lg p-1 z-50 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
          role="menu"
          aria-orientation="vertical"
        >
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                    : 'text-theme-text-sec hover:bg-theme-bg hover:text-theme-text'
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0">{opt.icon}</span>
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

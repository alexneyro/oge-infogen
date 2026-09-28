import React from 'react';
import { Clock, Pause, Play, CheckCircle2 } from 'lucide-react';

export interface SessionBannerProps {
  title?: string;
  badges?: React.ReactNode;
  timerMode: 'countdown' | 'stopwatch';
  seconds: number;
  isPaused: boolean;
  onTogglePause?: () => void;
  onFinish?: () => void;
  finishLabel?: string;
  finishDisabled?: boolean;
  lowTimeThreshold?: number;
}

export function formatBannerTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export const SessionBanner: React.FC<SessionBannerProps> = ({
  title,
  badges,
  timerMode,
  seconds,
  isPaused,
  onTogglePause,
  onFinish,
  finishLabel = 'Завершить',
  finishDisabled = false,
  lowTimeThreshold = 300,
}) => {
  const formattedTime = formatBannerTime(seconds);

  return (
    <div
      id="session-banner"
      className="sticky top-16 lg:top-20 z-30 bg-theme-card/95 backdrop-blur-md border border-theme-border rounded-2xl px-3 sm:px-4 h-14 max-h-14 flex items-center justify-between sm:justify-end gap-2 shadow-md w-full sm:w-fit sm:ml-auto overflow-hidden shrink-0"
    >
      {/* Title + badges on the left (only if title is provided) */}
      {title && (
        <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden mr-1 sm:mr-2">
          <span
            title={title}
            className="text-xs sm:text-sm font-bold text-theme-text uppercase tracking-wider truncate shrink"
          >
            {title}
          </span>
          {badges && (
            <div className="flex items-center space-x-1.5 shrink-0">
              {badges}
            </div>
          )}
        </div>
      )}

      {/* Timer and Finish action */}
      <div
        className={`flex items-center space-x-1.5 sm:space-x-2 shrink-0 whitespace-nowrap ${
          title ? '' : 'w-full justify-between sm:w-auto sm:justify-end'
        }`}
      >
        {/* Timer pill */}
        <div
          className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 rounded-xl border transition-colors font-mono text-xs sm:text-sm font-bold shrink-0 ${
            timerMode === 'countdown' && seconds <= lowTimeThreshold
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse'
              : isPaused
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
              : 'bg-theme-bg border-theme-border text-theme-text'
          }`}
        >
          <Clock
            className={`h-3.5 w-3.5 shrink-0 ${
              timerMode === 'countdown' && seconds <= lowTimeThreshold
                ? 'text-rose-600 dark:text-rose-400 animate-spin'
                : 'text-blue-600 dark:text-blue-400'
            }`}
          />
          <span className="tracking-wider whitespace-nowrap">
            {formattedTime}
          </span>
          {onTogglePause && (
            <button
              type="button"
              onClick={onTogglePause}
              title={isPaused ? 'Продолжить' : 'Пауза'}
              aria-label={isPaused ? 'Продолжить' : 'Пауза'}
              className="ml-0.5 p-1 rounded-lg hover:bg-theme-border/50 text-theme-text-muted hover:text-theme-text transition-colors cursor-pointer shrink-0"
            >
              {isPaused ? (
                <Play className="h-3 w-3 text-emerald-600 fill-emerald-600" />
              ) : (
                <Pause className="h-3 w-3 text-amber-600 fill-amber-600" />
              )}
            </button>
          )}
        </div>

        {/* Finish button */}
        {onFinish && (
          <button
            type="button"
            onClick={onFinish}
            disabled={finishDisabled}
            className="px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center space-x-1 shadow-xs transition-all cursor-pointer shrink-0 border border-rose-500 whitespace-nowrap"
            title={finishLabel}
          >
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{finishLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};

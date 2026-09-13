import React from 'react';

export type TaskBadgeStatus = 'none' | 'correct' | 'partial' | 'wrong';
export type TaskBadgeSize = 'sm' | 'md';

export interface TaskBadgeProps {
  id: number;
  status?: TaskBadgeStatus;
  size?: TaskBadgeSize;
  active?: boolean;
  className?: string;
}

export const TaskBadge: React.FC<TaskBadgeProps> = ({
  id,
  status = 'none',
  size = 'sm',
  active = false,
  className = '',
}) => {
  const formattedId = String(id).padStart(2, '0');

  const sizeClasses =
    size === 'md'
      ? 'w-7 h-7 text-xs rounded-lg'
      : 'w-6 h-6 text-[11px] rounded-md';

  let colorClasses = '';

  if (status === 'correct') {
    colorClasses =
      'bg-emerald-100 text-emerald-800 border-emerald-300/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30';
  } else if (status === 'partial') {
    colorClasses =
      'bg-amber-100 text-amber-800 border-amber-300/80 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30';
  } else if (status === 'wrong') {
    colorClasses =
      'bg-rose-100 text-rose-800 border-rose-300/80 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30';
  } else if (active) {
    colorClasses = 'bg-blue-600 text-white shadow-xs';
  } else {
    colorClasses =
      'bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/80';
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-bold shrink-0 select-none transition-colors ${sizeClasses} ${colorClasses} ${className}`}
      data-task-id={id}
      data-status={status}
    >
      {formattedId}
    </span>
  );
};

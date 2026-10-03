export interface LevelStyle {
  activeButton: string;
  inactiveButton: string;
  badge: string;
  text: string;
  presetButton: string;
}

const INACTIVE_BUTTON_STYLE =
  'bg-theme-card border border-theme-border text-theme-text-sec hover:bg-theme-bg';

const L1_STYLE: LevelStyle = {
  activeButton:
    'bg-emerald-600 text-white border border-emerald-600 font-bold shadow-xs',
  inactiveButton: INACTIVE_BUTTON_STYLE,
  badge:
    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  text: 'text-emerald-700 dark:text-emerald-300',
  presetButton:
    'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60',
};

const L2_STYLE: LevelStyle = {
  activeButton:
    'bg-indigo-600 text-white border border-indigo-600 font-bold shadow-xs',
  inactiveButton: INACTIVE_BUTTON_STYLE,
  badge:
    'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  text: 'text-indigo-700 dark:text-indigo-300',
  presetButton:
    'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-950/60',
};

const L3_STYLE: LevelStyle = {
  activeButton:
    'bg-rose-600 text-white border border-rose-600 font-bold shadow-xs',
  inactiveButton: INACTIVE_BUTTON_STYLE,
  badge:
    'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  text: 'text-rose-700 dark:text-rose-300',
  presetButton:
    'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/60',
};

export const LEVEL_STYLES: Record<'L1' | 'L2' | 'L3' | 1 | 2 | 3, LevelStyle> = {
  L1: L1_STYLE,
  L2: L2_STYLE,
  L3: L3_STYLE,
  1: L1_STYLE,
  2: L2_STYLE,
  3: L3_STYLE,
};

export const RANDOM_LEVEL_STYLE = {
  button:
    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/60',
  badge:
    'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  text: 'text-amber-700 dark:text-amber-300',
};

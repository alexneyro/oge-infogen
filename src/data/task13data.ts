/**
 * Модуль данных для Задания 13 ОГЭ (Презентация и текстовый документ).
 * 
 * СИНТАКСИС ТЕКСТА:
 * - [слово] — кандидат на выделение (жирный, курсив, подчёркивание).
 * - ^3^ — верхний индекс (например, м^3^, см^2^).
 * - || — разделитель абзацев.
 * 
 * СИНТАКСИС ТАБЛИЦ (по столбцам):
 * - Числа хранятся числами (не строками).
 * - Случайные числа задаются объектом { min, max, step }.
 * - Строки (string) используются только для текстовых значений (например, 'Жидкое').
 * - Шапка задаётся через label и unit у столбцов, объединение — через headerGroups.
 * - Итоговая строка задаётся через totalsRow и total: 'sum'.
 */

import { TaskSpec, SPEC_L1, SPEC_L2, SPEC_L3, TASK13_SPEC_PRESETS } from '../tasks/task13/spec';
import { TASK13_TEXTS_L1 } from './task13/textsL1';
import { TASK13_TEXTS_L2 } from './task13/textsL2';
import { TASK13_TEXTS_L3 } from './task13/textsL3';
import { TASK13_TABLES_L1 } from './task13/tablesL1';
import { TASK13_TABLES_L2 } from './task13/tablesL2';
import { TASK13_TABLES_L3 } from './task13/tablesL3';

export { SPEC_L1, SPEC_L2, SPEC_L3, TASK13_SPEC_PRESETS };
export { TASK13_TEXTS_L1, TASK13_TEXTS_L2, TASK13_TEXTS_L3 };
export { TASK13_TABLES_L1, TASK13_TABLES_L2, TASK13_TABLES_L3 };

export interface Task13TextSrc {
  id: string;
  level: 1 | 2 | 3;
  tags: string[];
  hasHeading: boolean;
  heading?: string;
  body: string;
}

export interface Task13TableRow {
  id: string;
  label: string;
}

export interface Task13TableColumn {
  id: string;
  label: string;
  /**
   * Единица измерения (должна соответствовать масштабу значений в values;
   * для значений вида 2700 указывать 'кг/м^3^', а не 'г/см^3^';
   * надстрочные индексы записываются как ^3^).
   */
  unit?: string;
  align: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  kind: 'text' | 'number';
  total?: 'sum';
  values: Record<string, number | string | { min: number; max: number; step: number }>;
}

export interface Task13TableHeaderGroup {
  label: string;
  columnIds: string[];
}

export interface Task13TableSrc {
  id: string;
  level: 1 | 2 | 3;
  tags: string[];
  titleRow?: string;
  objectColumnLabel?: string;
  rows: Task13TableRow[];
  columns: Task13TableColumn[];
  headerGroups?: Task13TableHeaderGroup[];
  totalsRow?: { label: string };
}

export const TASK13_TEXTS: Task13TextSrc[] = [
  ...TASK13_TEXTS_L1,
  ...TASK13_TEXTS_L2,
  ...TASK13_TEXTS_L3,
];

export const TASK13_TABLES: Task13TableSrc[] = [
  ...TASK13_TABLES_L1,
  ...TASK13_TABLES_L2,
  ...TASK13_TABLES_L3,
];



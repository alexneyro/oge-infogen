import type { Doc } from './parse';

/**
 * Проверяет наличие объединённых ячеек в таблице.
 */
export function hasMergedCells(table?: Doc['table'] | null): boolean {
  if (!table || !table.rows || table.rows.length === 0) return false;
  return table.rows.some(r => r.some(c => (c.colSpan || 1) > 1 || (c.rowSpan || 1) > 1));
}

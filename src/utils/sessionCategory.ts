export type HistoryCategory = 'trainer' | 'variant' | 'homework' | 'classwork' | 'mock';

export const CATEGORY_FILTERS: { id: HistoryCategory; label: string }[] = [
  { id: 'trainer', label: 'Тренажёр' },
  { id: 'variant', label: 'Вариант' },
  { id: 'homework', label: 'ДЗ' },
  { id: 'classwork', label: 'Классные' },
  { id: 'mock', label: 'Пробники' },
];

export function getSessionCategory(s: {
  mode: string;
  assignment_id: string | null;
  assignment_type?: string | null;
}): HistoryCategory {
  if (s.mode === 'single') return 'trainer';
  if (s.mode === 'variant') return 'variant';
  if (s.mode === 'mock') return 'mock';
  if (s.mode === 'set') {
    if (s.assignment_id) {
      return s.assignment_type === 'classwork' ? 'classwork' : 'homework';
    }
    return 'homework';
  }
  return 'trainer';
}

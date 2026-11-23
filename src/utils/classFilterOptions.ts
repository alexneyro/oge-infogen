import { compareClassNames } from './compareClassNames';

export interface ClassFilterInput {
  id: string;
  name: string;
}

export interface AssignmentClassFilterInput {
  class_id: string;
  class_name?: string | null;
}

export interface ClassFilterOption {
  id: string;
  name: string;
}

export function buildClassFilterOptions(
  classes: ReadonlyArray<ClassFilterInput>,
  assignments: ReadonlyArray<AssignmentClassFilterInput>
): ClassFilterOption[] {
  const byId = new Map<string, string>();

  for (const cls of classes) {
    if (!byId.has(cls.id)) {
      byId.set(cls.id, cls.name);
    }
  }

  for (const assignment of assignments) {
    if (!assignment.class_id || byId.has(assignment.class_id)) continue;
    const trimmed = assignment.class_name?.trim();
    byId.set(assignment.class_id, trimmed || '—');
  }

  return Array.from(byId.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => compareClassNames(a.name, b.name));
}

export interface EmptyFilterMessageInput {
  classFilter: string;
  assignments: ReadonlyArray<{ class_id: string }>;
  filteredCount: number;
}

export function getEmptyFilterMessage({
  classFilter,
  assignments,
  filteredCount,
}: EmptyFilterMessageInput): string | null {
  if (filteredCount > 0) return null;
  if (classFilter !== 'all' && !assignments.some((a) => a.class_id === classFilter)) {
    return 'Вы пока не выдавали задания этому классу';
  }
  return 'Нет заданий по выбранным фильтрам';
}

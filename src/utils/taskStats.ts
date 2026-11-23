export interface TaskStat {
  taskId: number;
  total: number;
  correct: number;
  totalScore: number;
  totalMaxScore: number;
}

export type StatsCategory = 'self' | 'hw' | 'classwork' | 'mock';
export type StatsFilter = 'all' | StatsCategory;

export interface StatsSessionInput {
  answers: Record<string, unknown> | null | undefined;
  mode?: string | null;
  assignment_id: string | null;
  assignment_type?: string | null;
}

export function getStatsCategory(s: {
  mode?: string | null;
  assignment_id: string | null;
  assignment_type?: string | null;
}): StatsCategory {
  if (s.mode === 'mock') return 'mock';
  if (s.assignment_id) return s.assignment_type === 'classwork' ? 'classwork' : 'hw';
  if (s.mode === 'set') return 'hw';
  return 'self';
}

export function aggregateTaskStats(
  sessions: StatsSessionInput[],
  filter: StatsFilter
): TaskStat[] {
  const filtered = sessions.filter((s) => filter === 'all' || getStatsCategory(s) === filter);
  const map = new Map<number, TaskStat>();
  for (const session of filtered) {
    if (!session.answers || typeof session.answers !== 'object') continue;
    for (const entry of Object.values(session.answers)) {
      if (typeof entry !== 'object' || entry === null || !('taskId' in entry)) continue;
      const e = entry as { taskId: number; correct: boolean; score: number; maxScore: number };
      const existing = map.get(e.taskId) ?? {
        taskId: e.taskId,
        total: 0,
        correct: 0,
        totalScore: 0,
        totalMaxScore: 0,
      };
      existing.total += 1;
      existing.correct += e.correct ? 1 : 0;
      existing.totalScore += e.score;
      existing.totalMaxScore += e.maxScore;
      map.set(e.taskId, existing);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.taskId - b.taskId);
}

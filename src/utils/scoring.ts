import { getTaskById } from '../tasks';

export interface PositionScore {
  score: number;
  maxScore: number;
  passed: boolean;
  details?: string[];
}

/**
 * Оценивает ответ пользователя на конкретную позицию задания ОГЭ.
 * - Для заданий с методом checkScore вызывает checkScore.
 * - Для остальных заданий вызывает бинарный check() и возвращает 0 или maxPoints.
 * - Пустой или состоящий только из пробелов ответ возвращает 0 баллов без вызова check/checkScore.
 * - Любые исключения внутри check/checkScore перехватываются, возвращая 0 баллов.
 */
export function scorePosition(taskId: number, taskData: unknown, userAnswer: string): PositionScore {
  const mod = getTaskById(taskId);
  const defaultMaxPoints = mod?.maxPoints ?? 1;

  if (!mod) {
    return { score: 0, maxScore: 0, passed: false };
  }

  // Пустой/пробельный userAnswer -> { score: 0, maxScore, passed: false } без вызова check
  if (!userAnswer || !userAnswer.trim()) {
    return { score: 0, maxScore: defaultMaxPoints, passed: false };
  }

  try {
    if (typeof mod.checkScore === 'function') {
      const res = mod.checkScore(taskData, userAnswer);
      const score = typeof res.score === 'number' ? res.score : 0;
      const maxScore = typeof res.maxScore === 'number' ? res.maxScore : defaultMaxPoints;
      return {
        score,
        maxScore,
        passed: score === maxScore && maxScore > 0,
      };
    }

    if (typeof mod.check === 'function') {
      const passed = Boolean(mod.check(taskData, userAnswer));
      return {
        score: passed ? defaultMaxPoints : 0,
        maxScore: defaultMaxPoints,
        passed,
      };
    }

    return { score: 0, maxScore: defaultMaxPoints, passed: false };
  } catch (_err) {
    // Любое исключение внутри check/checkScore перехватывать и возвращать нули, наружу не пробрасывать
    return { score: 0, maxScore: defaultMaxPoints, passed: false };
  }
}

/**
 * Вычисляет школьную оценку (2..5) по набранным баллам и максимальному баллу.
 *
 * В VariantView (строки 73–79) используется шкала ОГЭ для полного варианта (21 балл):
 *   0–4 балла   -> "2" (0% – 23.7%)
 *   5–10 баллов  -> "3" (23.8% – 52.3%)
 *   11–16 баллов -> "4" (52.4% – 80.9%)
 *   17–21 балл   -> "5" (81.0% – 100%)
 *
 * Для произвольного набора с другим максимальным баллом (max !== 21) применяется
 * пропорциональный пересчёт относительно шкалы ОГЭ (21 балл).
 */
export function gradeFromScore(score: number, max: number): number {
  if (max <= 0) return 2;
  const safeScore = Math.max(0, Math.min(score, max));
  const ratio = safeScore / max;

  // Пороги пересчитаны от 21 балла:
  // 5: >= 17/21 (~0.8095)
  // 4: >= 11/21 (~0.5238)
  // 3: >= 5/21  (~0.2381)
  // 2: < 5/21
  if (ratio >= 17 / 21) return 5;
  if (ratio >= 11 / 21) return 4;
  if (ratio >= 5 / 21) return 3;
  return 2;
}

declare global {
  interface Window {
    ym?: (...args: any[]) => void;
  }
}

export function track(event: string, params?: Record<string, string | number>): void {
  try {
    if (import.meta.env.DEV) return;
    const ymId = import.meta.env.VITE_YM_ID;
    if (!ymId) return;
    if (typeof window === 'undefined' || typeof window.ym !== 'function') return;

    const numericId = Number(ymId);
    if (!numericId || isNaN(numericId)) return;

    if (params) {
      window.ym(numericId, 'reachGoal', event, params);
    } else {
      window.ym(numericId, 'reachGoal', event);
    }
  } catch {
    // Никаких исключений наружу
  }
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { track } from '../analytics';

describe('analytics track', () => {
  const originalYm = window.ym;

  beforeEach(() => {
    delete (window as any).ym;
    vi.stubEnv('DEV', false as any);
    vi.stubEnv('VITE_YM_ID', '12345678');
  });

  afterEach(() => {
    if (originalYm !== undefined) {
      window.ym = originalYm;
    } else {
      delete (window as any).ym;
    }
    vi.unstubAllEnvs();
  });

  it('does not throw and does nothing when window.ym is missing', () => {
    delete (window as any).ym;
    expect(() => {
      track('trainer_task_generated', { number: 1, level: 1 });
    }).not.toThrow();
    expect(window.ym).toBeUndefined();
  });

  it('does nothing when import.meta.env.DEV is true', () => {
    const ymMock = vi.fn();
    window.ym = ymMock;
    vi.stubEnv('DEV', true as any);

    track('variant_created', { tasks_count: 16 });
    expect(ymMock).not.toHaveBeenCalled();
  });

  it('does nothing when VITE_YM_ID is empty', () => {
    const ymMock = vi.fn();
    window.ym = ymMock;
    vi.stubEnv('VITE_YM_ID', '');

    track('set_created', { tasks_count: 10 });
    expect(ymMock).not.toHaveBeenCalled();
  });

  it('calls window.ym reachGoal with correct parameters in production when ym is present', () => {
    const ymMock = vi.fn();
    window.ym = ymMock;

    track('trainer_task_generated', { number: 5, level: 2 });
    expect(ymMock).toHaveBeenCalledWith(12345678, 'reachGoal', 'trainer_task_generated', {
      number: 5,
      level: 2,
    });
  });
});

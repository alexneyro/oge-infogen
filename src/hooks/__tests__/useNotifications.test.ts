import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';

const { useAuthMock, fromMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock('../useAuth', () => ({
  useAuth: useAuthMock,
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { useNotifications, NotificationItem } from '../useNotifications';

interface RecordedCalls {
  deleteCalls: Array<{ eq: Array<[string, unknown]>; lt: Array<[string, unknown]> }>;
  listCalls: Array<{ selectArgs: unknown[]; eq: Array<[string, unknown]>; limit?: number }>;
  countCalls: Array<{ selectArgs: unknown[]; eq: Array<[string, unknown]> }>;
  updateCalls: Array<{ payload: unknown; eq: Array<[string, unknown]> }>;
}

function makeNotificationsMock(options?: {
  listData?: NotificationItem[];
  listError?: unknown;
  count?: number | null;
  countError?: unknown;
  deleteError?: unknown;
  deleteReject?: boolean;
}) {
  const calls: RecordedCalls = {
    deleteCalls: [],
    listCalls: [],
    countCalls: [],
    updateCalls: [],
  };

  fromMock.mockImplementation((table: string) => {
    expect(table).toBe('notifications');
    return {
      delete: () => {
        const entry = { eq: [] as Array<[string, unknown]>, lt: [] as Array<[string, unknown]> };
        calls.deleteCalls.push(entry);
        const builder: any = {
          eq: (col: string, val: unknown) => {
            entry.eq.push([col, val]);
            return builder;
          },
          lt: (col: string, val: unknown) => {
            entry.lt.push([col, val]);
            if (options?.deleteReject) {
              return Promise.reject(new Error('Cleanup network error'));
            }
            return Promise.resolve({ error: options?.deleteError ?? null });
          },
        };
        return builder;
      },
      select: (...selectArgs: unknown[]) => {
        const opts = selectArgs[1] as { count?: string; head?: boolean } | undefined;
        if (opts?.head) {
          const entry = { selectArgs, eq: [] as Array<[string, unknown]> };
          calls.countCalls.push(entry);
          const builder: any = {
            eq: (col: string, val: unknown) => {
              entry.eq.push([col, val]);
              if (entry.eq.length >= 2) {
                return Promise.resolve({
                  count: options?.count ?? 0,
                  error: options?.countError ?? null,
                });
              }
              return builder;
            },
          };
          return builder;
        }

        const entry: RecordedCalls['listCalls'][number] = { selectArgs, eq: [] };
        calls.listCalls.push(entry);
        const builder: any = {
          eq: (col: string, val: unknown) => {
            entry.eq.push([col, val]);
            return builder;
          },
          order: () => builder,
          limit: (n: number) => {
            entry.limit = n;
            return Promise.resolve({
              data: options?.listData ?? [],
              error: options?.listError ?? null,
            });
          },
        };
        return builder;
      },
      update: (payload: unknown) => {
        const entry = { payload, eq: [] as Array<[string, unknown]> };
        calls.updateCalls.push(entry);
        const builder: any = {
          eq: (col: string, val: unknown) => {
            entry.eq.push([col, val]);
            if (entry.eq.length >= 2) {
              return Promise.resolve({ error: null });
            }
            return builder;
          },
        };
        return builder;
      },
    };
  });

  return calls;
}

function makeFakeItems(count: number, unreadFlags?: boolean[]): NotificationItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `n-${i + 1}`,
    type: 'new_assignment',
    payload: { title: `Уведомление ${i + 1}` },
    is_read: unreadFlags ? !unreadFlags[i] : false,
    created_at: '2026-11-17T10:00:00Z',
  }));
}

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: { id: 'user-1' },
      profile: null,
      session: null,
      loading: false,
      profileError: false,
      refreshProfile: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('загружает до 50 уведомлений и берёт unreadCount из отдельного count-запроса (список 50, count 73)', async () => {
    const items = makeFakeItems(50);
    const calls = makeNotificationsMock({ listData: items, count: 73 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.notifications).toHaveLength(50);
    });

    expect(result.current.unreadCount).toBe(73);
    expect(calls.listCalls).toHaveLength(1);
    expect(calls.listCalls[0].limit).toBe(50);
    expect(calls.countCalls).toHaveLength(1);
    expect(calls.countCalls[0].selectArgs).toEqual(['id', { count: 'exact', head: true }]);
    expect(calls.countCalls[0].eq).toEqual([
      ['user_id', 'user-1'],
      ['is_read', false],
    ]);
  });

  it('при ошибке запроса счётчика считает unreadCount по загруженным строкам', async () => {
    const items = makeFakeItems(4, [true, false, true, false]);
    makeNotificationsMock({
      listData: items,
      count: null,
      countError: { message: 'Count failed' },
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.notifications).toHaveLength(4);
    });

    expect(result.current.unreadCount).toBe(2);
  });

  it('автоочистка вызывается один раз для user.id с фильтрами is_read=true и lt created_at (30 дней назад)', async () => {
    const now = new Date('2026-11-18T10:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    const calls = makeNotificationsMock({ listData: makeFakeItems(2), count: 2 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.notifications).toHaveLength(2);
    });

    expect(calls.deleteCalls).toHaveLength(1);
    expect(calls.deleteCalls[0].eq).toEqual([
      ['user_id', 'user-1'],
      ['is_read', true],
    ]);
    const expectedCutoff = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(calls.deleteCalls[0].lt).toEqual([['created_at', expectedCutoff]]);

    // Повторная загрузка не запускает автоочистку повторно
    await act(async () => {
      await result.current.fetchNotifications();
    });

    expect(calls.deleteCalls).toHaveLength(1);
    expect(calls.listCalls).toHaveLength(2);
  });

  it('ошибка автоочистки логируется в console.error и не мешает загрузке', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const items = makeFakeItems(3);
    makeNotificationsMock({
      listData: items,
      count: 5,
      deleteError: { message: 'Delete denied' },
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.notifications).toHaveLength(3);
    });

    expect(result.current.unreadCount).toBe(5);
    expect(errorSpy).toHaveBeenCalled();

    // Также при reject в delete
    errorSpy.mockClear();
    cleanup();
    makeNotificationsMock({
      listData: items,
      count: 6,
      deleteReject: true,
    });
    const { result: result2 } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result2.current.loading).toBe(false);
      expect(result2.current.notifications).toHaveLength(3);
    });
    expect(result2.current.unreadCount).toBe(6);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('markAllAsRead передаёт фильтр is_read=false в update', async () => {
    const calls = makeNotificationsMock({ listData: makeFakeItems(2), count: 2 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.notifications).toHaveLength(2);
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(calls.updateCalls).toHaveLength(1);
    expect(calls.updateCalls[0].payload).toEqual({ is_read: true });
    expect(calls.updateCalls[0].eq).toEqual([
      ['user_id', 'user-1'],
      ['is_read', false],
    ]);
  });
});

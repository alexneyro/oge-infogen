import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { useSessionHistory } from '../useSessionHistory';

function makeRawRow(idx: number) {
  return {
    id: `session-${idx}`,
    mode: idx % 3 === 0 ? 'mock' : 'single',
    score: 1,
    max_score: 1,
    time_spent_seconds: 12,
    created_at: `2026-11-17T10:00:${String(idx % 60).padStart(2, '0')}Z`,
    assignment_id: null,
    task_type: idx % 3 === 0 ? null : 5,
    status: 'completed',
    assignments: null,
  };
}

interface RecordedQuery {
  table: string;
  selectCols: string;
  eqCalls: [string, unknown][];
  orderCalls: [string, { ascending?: boolean } | undefined][];
  rangeCalls: [number, number][];
}

function createFakeSupabaseFrom(
  allRows: any[],
  options?: { failOnPage?: number }
) {
  const queries: RecordedQuery[] = [];
  let pageCount = 0;

  fromMock.mockImplementation((table: string) => {
    const query: RecordedQuery = {
      table,
      selectCols: '',
      eqCalls: [],
      orderCalls: [],
      rangeCalls: [],
    };
    queries.push(query);

    const builder = {
      select(cols: string) {
        query.selectCols = cols;
        return builder;
      },
      eq(col: string, val: unknown) {
        query.eqCalls.push([col, val]);
        return builder;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        query.orderCalls.push([col, opts]);
        return builder;
      },
      async range(from: number, to: number) {
        query.rangeCalls.push([from, to]);
        pageCount += 1;
        if (options?.failOnPage && pageCount === options.failOnPage) {
          return { data: null, error: new Error('DB timeout') };
        }
        return { data: allRows.slice(from, to + 1), error: null };
      },
    };

    return builder;
  });

  return { queries };
}

describe('useSessionHistory', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('загружает 2500 строк за 3 страницы, передаёт оба .order(created_at, id) и не выбирает answers/variant_seed', async () => {
    const allRows = Array.from({ length: 2500 }, (_, i) => makeRawRow(i));
    const { queries } = createFakeSupabaseFrom(allRows);

    const { result } = renderHook(() => useSessionHistory('student-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.sessions).toHaveLength(2500);
    });

    expect(result.current.error).toBeNull();
    expect(queries).toHaveLength(3);
    expect(queries[0].rangeCalls).toEqual([[0, 999]]);
    expect(queries[1].rangeCalls).toEqual([[1000, 1999]]);
    expect(queries[2].rangeCalls).toEqual([[2000, 2999]]);

    for (const q of queries) {
      expect(q.table).toBe('sessions');
      expect(q.eqCalls).toEqual([['user_id', 'student-1']]);
      expect(q.orderCalls).toEqual([
        ['created_at', { ascending: false }],
        ['id', { ascending: false }],
      ]);
      expect(q.selectCols).not.toContain('answers');
      expect(q.selectCols).not.toContain('variant_seed');
    }
  });

  it('при ошибке страницы возвращает error, пустой список и сбрасывает error при reload()', async () => {
    const allRows = Array.from({ length: 1500 }, (_, i) => makeRawRow(i));
    createFakeSupabaseFrom(allRows, { failOnPage: 2 });

    const { result } = renderHook(() => useSessionHistory('student-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Не удалось загрузить историю');
    });

    expect(result.current.sessions).toEqual([]);

    // Успешный reload() сбрасывает error и загружает данные
    createFakeSupabaseFrom(allRows);
    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.sessions).toHaveLength(1500);
    });
    expect(result.current.error).toBeNull();
  });

  it('при enabled=false не делает запросов, при переключении true -> false -> true не перегружает повторно', async () => {
    const rows = Array.from({ length: 10 }, (_, i) => makeRawRow(i));
    const { queries } = createFakeSupabaseFrom(rows);

    const { result, rerender } = renderHook(
      ({ userId, enabled }: { userId?: string; enabled: boolean }) =>
        useSessionHistory(userId, enabled),
      { initialProps: { userId: 'student-1', enabled: false } }
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.sessions).toEqual([]);
    expect(queries).toHaveLength(0);

    // Включаем вкладку — стартует загрузка
    rerender({ userId: 'student-1', enabled: true });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.sessions).toHaveLength(10);
    });
    expect(queries).toHaveLength(1);

    // Переключаем вкладку туда и обратно — повторного запроса нет
    rerender({ userId: 'student-1', enabled: false });
    rerender({ userId: 'student-1', enabled: true });
    expect(queries).toHaveLength(1);
    expect(result.current.sessions).toHaveLength(10);
  });

  it('при смене userId сбрасывает данные и загружает заново', async () => {
    const rowsUser1 = Array.from({ length: 3 }, (_, i) => makeRawRow(i));
    createFakeSupabaseFrom(rowsUser1);

    const { result, rerender } = renderHook(
      ({ userId }: { userId?: string }) => useSessionHistory(userId, true),
      { initialProps: { userId: 'student-1' } }
    );

    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(3);
    });

    const rowsUser2 = Array.from({ length: 5 }, (_, i) => makeRawRow(i + 100));
    createFakeSupabaseFrom(rowsUser2);
    rerender({ userId: 'student-2' });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.sessions).toHaveLength(5);
    });
    expect(result.current.sessions[0].id).toBe('session-100');
  });

  it('на первом рендере с enabled=true и userId пустое состояние не показывается (loading=true)', async () => {
    let resolveFirst!: (val: { data: any[]; error: null }) => void;
    fromMock.mockImplementationOnce(() => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        range: () =>
          new Promise<{ data: any[]; error: null }>((res) => {
            resolveFirst = res;
          }),
      };
      return builder;
    });

    const snapshots: { loading: boolean; error: string | null; count: number }[] = [];

    const { result, rerender } = renderHook(
      ({ userId, enabled }: { userId?: string; enabled: boolean }) => {
        const state = useSessionHistory(userId, enabled);
        snapshots.push({
          loading: state.loading,
          error: state.error,
          count: state.sessions.length,
        });
        return state;
      },
      { initialProps: { userId: 'student-1', enabled: true } }
    );

    // Первый рендер до завершения эффекта: loading=true
    expect(snapshots[0]).toEqual({ loading: true, error: null, count: 0 });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveFirst({ data: [makeRawRow(1)], error: null });
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.sessions).toHaveLength(1);

    // Переключение enabled: false -> true (для нового userId) сразу ставит loading=true на первом рендере
    snapshots.length = 0;
    rerender({ userId: 'student-2', enabled: false });
    expect(snapshots[0]).toEqual({ loading: false, error: null, count: 0 });

    createFakeSupabaseFrom([makeRawRow(2), makeRawRow(3)]);
    snapshots.length = 0;
    rerender({ userId: 'student-2', enabled: true });
    expect(snapshots[0]).toEqual({ loading: true, error: null, count: 0 });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.sessions).toHaveLength(2);
    });
  });
});

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

import { useAssignments } from '../useAssignments';

describe('useAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('для teacher на первом рендере loading = true и assignments = [], после загрузки loading = false', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1' },
      profile: { id: 'teacher-1', role: 'teacher' },
      session: null,
      loading: false,
    });

    let resolveQuery!: (val: { data: any[]; error: null }) => void;
    fromMock.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () =>
            new Promise((res) => {
              resolveQuery = res;
            }),
        }),
      }),
    }));

    const snapshots: { loading: boolean; count: number }[] = [];
    const { result } = renderHook(() => {
      const state = useAssignments();
      snapshots.push({ loading: state.loading, count: state.assignments.length });
      return state;
    });

    expect(snapshots[0]).toEqual({ loading: true, count: 0 });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveQuery({
        data: [
          {
            id: 'a-1',
            class_id: 'c-1',
            title: 'ДЗ 1',
            variant_seed: null,
            set_config: null,
            due_date: null,
            max_attempts: null,
            hide_review: false,
            assignment_type: 'homework',
            created_at: '2026-11-17T10:00:00Z',
            is_active: true,
            classes: { name: '9А' },
          },
        ],
        error: null,
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.assignments).toHaveLength(1);
    expect(result.current.assignments[0].class_name).toBe('9А');
  });

  it('для student на первом рендере loading = true, после загрузки пустых или непустых классов loading = false', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-1' },
      profile: { id: 'student-1', role: 'student' },
      session: null,
      loading: false,
    });

    let resolveMembers!: (val: { data: any[]; error: null }) => void;
    fromMock.mockImplementation((table: string) => {
      if (table === 'class_members') {
        return {
          select: () => ({
            eq: () =>
              new Promise((res) => {
                resolveMembers = res;
              }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const snapshots: { loading: boolean; count: number }[] = [];
    const { result } = renderHook(() => {
      const state = useAssignments();
      snapshots.push({ loading: state.loading, count: state.assignments.length });
      return state;
    });

    expect(snapshots[0]).toEqual({ loading: true, count: 0 });

    await act(async () => {
      resolveMembers({ data: [], error: null });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.assignments).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('при ошибке загрузки для student loading = false и error задана', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-err' },
      profile: { id: 'student-err', role: 'student' },
      session: null,
      loading: false,
    });

    fromMock.mockImplementation(() => ({
      select: () => ({
        eq: () => Promise.resolve({ data: null, error: new Error('Query failed') }),
      }),
    }));

    const { result } = renderHook(() => useAssignments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Query failed');
    expect(result.current.hasClasses).toBeNull();
  });

  it('hasClasses = false если ученик не состоит ни в одном классе', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-no-class' },
      profile: { id: 'student-no-class', role: 'student' },
      session: null,
      loading: false,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'class_members') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [], error: null }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useAssignments());
    expect(result.current.hasClasses).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.hasClasses).toBe(false);
    expect(result.current.assignments).toEqual([]);
  });

  it('hasClasses = true если ученик состоит в классе, но заданий нет', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-with-empty-class' },
      profile: { id: 'student-with-empty-class', role: 'student' },
      session: null,
      loading: false,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'class_members') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [{ class_id: 'class-1' }], error: null }),
          }),
        };
      }
      if (table === 'assignments') {
        return {
          select: () => ({
            in: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useAssignments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.hasClasses).toBe(true);
    expect(result.current.assignments).toEqual([]);
  });

  it('hasClasses = null для учителя и при смене пользователя сбрасывается в null', async () => {
    let currentAuth = {
      user: { id: 'student-1' },
      profile: { id: 'student-1', role: 'student' as 'student' | 'teacher' },
      session: null,
      loading: false,
    };
    useAuthMock.mockImplementation(() => currentAuth);

    let resolveSecondMembers!: (val: { data: any[]; error: null }) => void;
    fromMock.mockImplementation((table: string) => {
      if (table === 'class_members') {
        return {
          select: () => ({
            eq: (_col: string, uid: string) => {
              if (uid === 'student-1') {
                return Promise.resolve({ data: [], error: null });
              }
              return new Promise((res) => {
                resolveSecondMembers = res;
              });
            },
          }),
        };
      }
      if (table === 'assignments') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
            in: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result, rerender } = renderHook(() => useAssignments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.hasClasses).toBe(false);

    currentAuth = {
      user: { id: 'student-2' },
      profile: { id: 'student-2', role: 'student' },
      session: null,
      loading: false,
    };
    rerender();

    await waitFor(() => {
      expect(result.current.hasClasses).toBeNull();
    });

    await act(async () => {
      resolveSecondMembers({ data: [{ class_id: 'c-2' }], error: null });
    });

    await waitFor(() => {
      expect(result.current.hasClasses).toBe(true);
    });

    currentAuth = {
      user: { id: 'teacher-1' },
      profile: { id: 'teacher-1', role: 'teacher' },
      session: null,
      loading: false,
    };
    rerender();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.hasClasses).toBeNull();
  });

  it('hasClasses = null при ошибке загрузки после наличия класса и при ошибке чтения class_members', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'student-err-classes' },
      profile: { id: 'student-err-classes', role: 'student' },
      session: null,
      loading: false,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'class_members') {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: [{ class_id: 'c-1' }], error: null }),
          }),
        };
      }
      if (table === 'assignments') {
        return {
          select: () => ({
            in: () => ({
              order: () => Promise.resolve({ data: null, error: new Error('Assignments failed') }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useAssignments());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Assignments failed');
    expect(result.current.hasClasses).toBeNull();
  });
});



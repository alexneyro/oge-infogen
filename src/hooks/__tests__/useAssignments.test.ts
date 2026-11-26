import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';

const { useAuthMock, fromMock, sendNotificationToClassMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  fromMock: vi.fn(),
  sendNotificationToClassMock: vi.fn(),
}));

vi.mock('../useAuth', () => ({
  useAuth: useAuthMock,
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock('../../lib/notifications', () => ({
  sendNotificationToClass: sendNotificationToClassMock,
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

  it('createAssignment без studentIds (весь класс) ставит audience="class" и не вставляет в assignment_targets', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1' },
      profile: { id: 'teacher-1', role: 'teacher' },
      session: null,
      loading: false,
    });
    sendNotificationToClassMock.mockResolvedValue(undefined);

    const insertedAssignments: any[] = [];
    const targetInserts: any[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
          insert: (row: any) => {
            insertedAssignments.push(row);
            return {
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'a-class' }, error: null }),
              }),
            };
          },
        };
      }
      if (table === 'assignment_targets') {
        return {
          insert: (rows: any) => {
            targetInserts.push(rows);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useAssignments());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let res!: { error: string | null; id?: string };
    await act(async () => {
      res = await result.current.createAssignment({
        classId: 'c-1',
        title: 'ДЗ всему классу',
        variantSeed: 'SEED1',
        setConfig: null,
        dueDate: null,
        maxAttempts: null,
        hideReview: false,
        assignmentType: 'homework',
      });
    });

    expect(res).toEqual({ error: null, id: 'a-class' });
    expect(insertedAssignments).toHaveLength(1);
    expect(insertedAssignments[0].audience).toBe('class');
    expect(targetInserts).toHaveLength(0);
    expect(sendNotificationToClassMock).toHaveBeenCalledWith(
      'c-1',
      'teacher-1',
      'new_assignment',
      expect.objectContaining({ assignmentId: 'a-class' }),
      undefined
    );
  });

  it('createAssignment с пустым studentIds=[] не допускает audience="selected" (ставит audience="class" и не вставляет targets)', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1' },
      profile: { id: 'teacher-1', role: 'teacher' },
      session: null,
      loading: false,
    });
    sendNotificationToClassMock.mockResolvedValue(undefined);

    const insertedAssignments: any[] = [];
    const targetInserts: any[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
          insert: (row: any) => {
            insertedAssignments.push(row);
            return {
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'a-empty' }, error: null }),
              }),
            };
          },
        };
      }
      if (table === 'assignment_targets') {
        return {
          insert: (rows: any) => {
            targetInserts.push(rows);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useAssignments());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let res!: { error: string | null; id?: string };
    await act(async () => {
      res = await result.current.createAssignment({
        classId: 'c-1',
        title: 'ДЗ пустой список',
        variantSeed: null,
        setConfig: null,
        dueDate: null,
        maxAttempts: null,
        hideReview: false,
        assignmentType: 'homework',
        studentIds: [],
      });
    });

    expect(res).toEqual({ error: null, id: 'a-empty' });
    expect(insertedAssignments[0].audience).toBe('class');
    expect(targetInserts).toHaveLength(0);
    expect(sendNotificationToClassMock).toHaveBeenCalledWith(
      'c-1',
      'teacher-1',
      'new_assignment',
      expect.any(Object),
      undefined
    );
  });

  it('createAssignment с выбранными studentIds вставляет audience="selected", assignment_targets и передаёт их в sendNotificationToClass', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1' },
      profile: { id: 'teacher-1', role: 'teacher' },
      session: null,
      loading: false,
    });
    sendNotificationToClassMock.mockResolvedValue(undefined);

    const insertedAssignments: any[] = [];
    const targetInserts: any[] = [];

    fromMock.mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
          insert: (row: any) => {
            insertedAssignments.push(row);
            return {
              select: () => ({
                single: () => Promise.resolve({ data: { id: 'a-sel' }, error: null }),
              }),
            };
          },
        };
      }
      if (table === 'assignment_targets') {
        return {
          insert: (rows: any) => {
            targetInserts.push(rows);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useAssignments());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let res!: { error: string | null; id?: string };
    await act(async () => {
      res = await result.current.createAssignment({
        classId: 'c-1',
        title: 'Индивидуальное ДЗ',
        variantSeed: null,
        setConfig: null,
        dueDate: null,
        maxAttempts: null,
        hideReview: false,
        assignmentType: 'classwork',
        studentIds: ['s-1', 's-2', 's-1'],
      });
    });

    expect(res).toEqual({ error: null, id: 'a-sel' });
    expect(insertedAssignments[0].audience).toBe('selected');
    expect(targetInserts).toEqual([
      [
        { assignment_id: 'a-sel', student_id: 's-1' },
        { assignment_id: 'a-sel', student_id: 's-2' },
      ],
    ]);
    expect(sendNotificationToClassMock).toHaveBeenCalledWith(
      'c-1',
      'teacher-1',
      'new_assignment',
      expect.objectContaining({ assignmentId: 'a-sel' }),
      ['s-1', 's-2']
    );
  });

  it('createAssignment при ошибке вставки assignment_targets удаляет созданное задание и возвращает ошибку', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1' },
      profile: { id: 'teacher-1', role: 'teacher' },
      session: null,
      loading: false,
    });

    const deletedEqCalls: Array<[string, unknown]> = [];

    fromMock.mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'a-rollback' }, error: null }),
            }),
          }),
          delete: () => ({
            eq: (col: string, val: unknown) => {
              deletedEqCalls.push([col, val]);
              return Promise.resolve({ error: null });
            },
          }),
        };
      }
      if (table === 'assignment_targets') {
        return {
          insert: () => Promise.resolve({ error: { message: 'FK failed' } }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const { result } = renderHook(() => useAssignments());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let res!: { error: string | null; id?: string };
    await act(async () => {
      res = await result.current.createAssignment({
        classId: 'c-1',
        title: 'Сломанное ДЗ',
        variantSeed: null,
        setConfig: null,
        dueDate: null,
        maxAttempts: null,
        hideReview: false,
        assignmentType: 'homework',
        studentIds: ['s-1'],
      });
    });

    expect(res).toEqual({ error: 'Не удалось выдать задание выбранным ученикам' });
    expect(deletedEqCalls).toEqual([['id', 'a-rollback']]);
    expect(sendNotificationToClassMock).not.toHaveBeenCalled();
  });
});



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
    functions: { invoke: vi.fn() },
  },
}));

import { useClasses } from '../useClasses';
import { supabase } from '../../lib/supabase';

describe('useClasses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('на первом рендере для teacher с готовым user/profile loading = true и classes пустой, после загрузки loading = false', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1' },
      profile: { id: 'teacher-1', role: 'teacher' },
      session: null,
      loading: false,
    });

    let resolveClasses!: (val: { data: any[]; error: null }) => void;
    fromMock.mockImplementation((table: string) => {
      if (table === 'classes') {
        const builder = {
          select: () => builder,
          eq: vi.fn(() => {
            // второй .eq('is_archived', false) возвращает Promise
            if ((builder.eq as ReturnType<typeof vi.fn>).mock.calls.length === 2) {
              return new Promise<{ data: any[]; error: null }>((res) => {
                resolveClasses = res;
              });
            }
            return builder;
          }),
        };
        return builder;
      }
      if (table === 'class_members') {
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: [
                  {
                    class_id: 'class-1',
                    student_id: 'student-1',
                    joined_at: '2026-11-17T10:00:00Z',
                    profiles: {
                      first_name: 'Анна',
                      last_name: 'Петрова',
                      email: 'anna@example.com',
                      role: 'student',
                      generated_login: null,
                      generated_password: null,
                    },
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const snapshots: { loading: boolean; count: number }[] = [];
    const { result } = renderHook(() => {
      const state = useClasses();
      snapshots.push({ loading: state.loading, count: state.classes.length });
      return state;
    });

    // Первый кадр до завершения загрузки
    expect(snapshots[0]).toEqual({ loading: true, count: 0 });
    expect(result.current.loading).toBe(true);
    expect(result.current.classes).toEqual([]);

    await act(async () => {
      resolveClasses({
        data: [
          {
            id: 'class-1',
            name: '9А Информатика',
            invite_code: 'ABC123',
            created_at: '2026-11-17T09:00:00Z',
            is_archived: false,
          },
        ],
        error: null,
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.classes).toHaveLength(1);
    expect(result.current.classes[0].name).toBe('9А Информатика');
    expect(result.current.classes[0].members).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('для пользователя без классов после загрузки loading = false и classes = []', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-empty' },
      profile: { id: 'teacher-empty', role: 'teacher' },
      session: null,
      loading: false,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'classes') {
        const builder = {
          select: () => builder,
          eq: vi.fn(() => {
            if ((builder.eq as ReturnType<typeof vi.fn>).mock.calls.length === 2) {
              return Promise.resolve({ data: [], error: null });
            }
            return builder;
          }),
        };
        return builder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    const snapshots: { loading: boolean; count: number }[] = [];
    const { result } = renderHook(() => {
      const state = useClasses();
      snapshots.push({ loading: state.loading, count: state.classes.length });
      return state;
    });

    expect(snapshots[0]).toEqual({ loading: true, count: 0 });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.classes).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('при ошибке загрузки loading становится false, а error отображается (без вечного скелетона)', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-err' },
      profile: { id: 'teacher-err', role: 'teacher' },
      session: null,
      loading: false,
    });

    fromMock.mockImplementation(() => {
      const builder = {
        select: () => builder,
        eq: vi.fn(() => {
          if ((builder.eq as ReturnType<typeof vi.fn>).mock.calls.length === 2) {
            return Promise.resolve({ data: null, error: { message: 'DB failed' } });
          }
          return builder;
        }),
      };
      return builder;
    });

    const { result } = renderHook(() => useClasses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('DB failed');
    expect(result.current.classes).toEqual([]);
  });

  it('пока authLoading = true, loading = true; без пользователя после авторизации loading = false', async () => {
    useAuthMock.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      loading: true,
    });

    const { result, rerender } = renderHook(() => useClasses());
    expect(result.current.loading).toBe(true);
    expect(fromMock).not.toHaveBeenCalled();

    useAuthMock.mockReturnValue({
      user: null,
      profile: null,
      session: null,
      loading: false,
    });
    rerender();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.classes).toEqual([]);
  });

  it('addStudentWithoutEmail преобразует ошибку Password should be at least из error.context.json() в русский текст', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1' },
      profile: { id: 'teacher-1', role: 'teacher' },
      session: null,
      loading: false,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'classes') {
        const builder = {
          select: () => builder,
          eq: vi.fn(() => {
            if ((builder.eq as ReturnType<typeof vi.fn>).mock.calls.length === 2) {
              return Promise.resolve({ data: [], error: null });
            }
            return builder;
          }),
        };
        return builder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          json: async () => ({ error: 'Password should be at least 6 characters.' }),
        },
      } as any,
    });

    const { result } = renderHook(() => useClasses());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let res!: Awaited<ReturnType<typeof result.current.addStudentWithoutEmail>>;
    await act(async () => {
      res = await result.current.addStudentWithoutEmail('class-1', 'И', 'Ким');
    });
    expect(res).toEqual({ error: 'Слишком короткий пароль. Попробуйте ещё раз' });
  });

  it('addStudentWithoutEmail при успехе возвращает credentials', async () => {
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1' },
      profile: { id: 'teacher-1', role: 'teacher' },
      session: null,
      loading: false,
    });

    fromMock.mockImplementation((table: string) => {
      if (table === 'classes') {
        const builder = {
          select: () => builder,
          eq: vi.fn(() => {
            if ((builder.eq as ReturnType<typeof vi.fn>).mock.calls.length === 2) {
              return Promise.resolve({ data: [], error: null });
            }
            return builder;
          }),
        };
        return builder;
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { userId: 'student-1' },
      error: null,
    });

    const { result } = renderHook(() => useClasses());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let res!: Awaited<ReturnType<typeof result.current.addStudentWithoutEmail>>;
    await act(async () => {
      res = await result.current.addStudentWithoutEmail('class-1', 'Иван', 'Ким');
    });
    expect(res.error).toBeNull();
    expect(res.credentials).toBeDefined();
    expect(res.credentials?.login).toMatch(/^kim\d{4}$/);
    expect(res.credentials?.password).toMatch(/^Ivan\d{4}$/);
  });
});

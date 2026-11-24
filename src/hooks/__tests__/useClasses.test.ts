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

  describe('renameClass', () => {
    const setupTeacherWithClasses = (
      initialClasses: Array<{ id: string; name: string; invite_code: string; created_at: string; is_archived: boolean }>,
      updateResult: { data: any; error: any } = { data: [{ id: 'class-1' }], error: null }
    ) => {
      useAuthMock.mockReturnValue({
        user: { id: 'teacher-1' },
        profile: { id: 'teacher-1', role: 'teacher' },
        session: null,
        loading: false,
      });

      const selectAfterUpdateMock = vi.fn().mockResolvedValue(updateResult);
      const eqAfterUpdateMock = vi.fn(() => ({ select: selectAfterUpdateMock }));
      const updateMock = vi.fn((_payload: { name: string }) => ({ eq: eqAfterUpdateMock }));

      let currentClasses = initialClasses;

      fromMock.mockImplementation((table: string) => {
        if (table === 'classes') {
          const builder = {
            select: () => builder,
            eq: vi.fn(() => {
              if ((builder.eq as ReturnType<typeof vi.fn>).mock.calls.length === 2) {
                return Promise.resolve({ data: currentClasses, error: null });
              }
              return builder;
            }),
            update: (payload: { name: string }) => {
              if (!updateResult.error && updateResult.data && updateResult.data.length > 0) {
                currentClasses = currentClasses.map((c) =>
                  c.id === 'class-1' ? { ...c, name: payload.name } : c
                );
              }
              return updateMock(payload);
            },
          };
          return builder;
        }
        if (table === 'class_members') {
          return {
            select: () => ({
              in: () => Promise.resolve({ data: [], error: null }),
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      return { updateMock, eqAfterUpdateMock, selectAfterUpdateMock };
    };

    const sampleClasses = [
      { id: 'class-1', name: '9А', invite_code: 'AAA111', created_at: '2026-11-17T09:00:00Z', is_archived: false },
      { id: 'class-2', name: '10Б Информатика', invite_code: 'BBB222', created_at: '2026-11-17T09:00:00Z', is_archived: false },
    ];

    it('отклоняет пустое название и не обращается к update', async () => {
      const { updateMock } = setupTeacherWithClasses(sampleClasses);
      const { result } = renderHook(() => useClasses());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let res!: { error: string | null };
      await act(async () => {
        res = await result.current.renameClass('class-1', '');
      });
      expect(res.error).toBe('Название класса не может быть пустым');
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('отклоняет название из одних пробелов и не обращается к update', async () => {
      const { updateMock } = setupTeacherWithClasses(sampleClasses);
      const { result } = renderHook(() => useClasses());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let res!: { error: string | null };
      await act(async () => {
        res = await result.current.renameClass('class-1', '   \t  ');
      });
      expect(res.error).toBe('Название класса не может быть пустым');
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('отклоняет название длиннее 40 символов и не обращается к update', async () => {
      const { updateMock } = setupTeacherWithClasses(sampleClasses);
      const { result } = renderHook(() => useClasses());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let res!: { error: string | null };
      await act(async () => {
        res = await result.current.renameClass('class-1', 'А'.repeat(41));
      });
      expect(res.error).toBe('Название класса должно быть не длиннее 40 символов');
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('отклоняет дубликат названия другого класса без учёта регистра', async () => {
      const { updateMock } = setupTeacherWithClasses(sampleClasses);
      const { result } = renderHook(() => useClasses());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let res!: { error: string | null };
      await act(async () => {
        res = await result.current.renameClass('class-1', '  10б информатика  ');
      });
      expect(res.error).toBe('Класс с таким названием уже существует');
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('считает 0 обновлённых строк ошибкой и возвращает «Не удалось переименовать класс»', async () => {
      const { updateMock, eqAfterUpdateMock, selectAfterUpdateMock } = setupTeacherWithClasses(
        sampleClasses,
        { data: [], error: null }
      );
      const { result } = renderHook(() => useClasses());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let res!: { error: string | null };
      await act(async () => {
        res = await result.current.renameClass('class-1', '9В');
      });
      expect(updateMock).toHaveBeenCalledWith({ name: '9В' });
      expect(eqAfterUpdateMock).toHaveBeenCalledWith('id', 'class-1');
      expect(selectAfterUpdateMock).toHaveBeenCalledWith('id');
      expect(res.error).toBe('Не удалось переименовать класс');
    });

    it('при успехе обновляет класс, перезагружает список и отражает новое имя в classes', async () => {
      const { updateMock, eqAfterUpdateMock, selectAfterUpdateMock } = setupTeacherWithClasses(
        sampleClasses,
        { data: [{ id: 'class-1' }], error: null }
      );
      const { result } = renderHook(() => useClasses());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let res!: { error: string | null };
      await act(async () => {
        res = await result.current.renameClass('class-1', '  9А Профиль  ');
      });
      expect(res).toEqual({ error: null });
      expect(updateMock).toHaveBeenCalledWith({ name: '9А Профиль' });
      expect(eqAfterUpdateMock).toHaveBeenCalledWith('id', 'class-1');
      expect(selectAfterUpdateMock).toHaveBeenCalledWith('id');
      expect(result.current.classes.find((c) => c.id === 'class-1')?.name).toBe('9А Профиль');
    });
  });
});

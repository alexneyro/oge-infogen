import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react';

const { getSessionMock, onAuthStateChangeMock, fromMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
    from: fromMock,
  },
}));

import { AuthProvider } from '../AuthContext';
import { useAuth } from '../../hooks/useAuth';

function makeWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
}

describe('AuthProvider & useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('вне AuthProvider useAuth бросает понятную ошибку', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    spy.mockRestore();
  });

  it('при успешной загрузке loading становится false только после получения профиля', async () => {
    const fakeUser = { id: 'user-1', email: 't@example.com' };
    const fakeSession = { user: fakeUser, access_token: 'tok' };
    const fakeProfile = { id: 'user-1', role: 'teacher', first_name: 'Иван', last_name: 'Иванов' };

    let resolveSession!: (val: { data: { session: unknown } }) => void;
    getSessionMock.mockImplementationOnce(
      () =>
        new Promise((res) => {
          resolveSession = res;
        })
    );

    let resolveProfile!: (val: { data: unknown; error: null }) => void;
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () =>
            new Promise((res) => {
              resolveProfile = res;
            }),
        }),
      }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();

    // Сессия получена, но профиль ещё грузится -> loading всё ещё true
    await act(async () => {
      resolveSession({ data: { session: fakeSession } });
    });

    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.session).toEqual(fakeSession);
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(true);

    // Профиль получен -> loading становится false
    await act(async () => {
      resolveProfile({ data: fakeProfile, error: null });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.profile).toEqual(fakeProfile);
  });

  it('при исключении в fetchProfile loading становится false, а profile = null', async () => {
    const fakeUser = { id: 'user-2', email: 'u2@example.com' };
    const fakeSession = { user: fakeUser };

    getSessionMock.mockResolvedValueOnce({ data: { session: fakeSession } });
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.reject(new Error('Network error')),
        }),
      }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.profile).toBeNull();
    expect(result.current.profileError).toBe(true);
  });

  it('при ошибке supabase в fetchProfile loading становится false, а profile = null', async () => {
    const fakeUser = { id: 'user-3', email: 'u3@example.com' };
    const fakeSession = { user: fakeUser };

    getSessionMock.mockResolvedValueOnce({ data: { session: fakeSession } });
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Not found' } }),
        }),
      }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.profile).toBeNull();
    expect(result.current.profileError).toBe(true);
  });

  it('без пользователя loading становится false сразу после getSession и profiles не запрашивается', async () => {
    getSessionMock.mockResolvedValueOnce({ data: { session: null } });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.session).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('onAuthStateChange вызывает fetchProfile синхронно без возврата Promise и сбрасывает профиль при выходе', async () => {
    let authCallback!: (event: string, session: unknown) => unknown;
    onAuthStateChangeMock.mockImplementationOnce((cb: (event: string, session: unknown) => unknown) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    getSessionMock.mockResolvedValueOnce({ data: { session: null } });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fakeUser = { id: 'user-4', email: 'u4@example.com' };
    const fakeProfile = { id: 'user-4', role: 'student' };
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: fakeProfile, error: null }),
        }),
      }),
    }));

    let cbReturn: unknown;
    await act(async () => {
      cbReturn = authCallback('SIGNED_IN', { user: fakeUser });
    });
    // Колбэк не async (не возвращает Promise)
    expect(cbReturn).toBeUndefined();

    await waitFor(() => {
      expect(result.current.profile).toEqual(fakeProfile);
    });

    await act(async () => {
      authCallback('SIGNED_OUT', null);
    });
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.profileError).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('refreshProfile успешно возвращает профиль и сбрасывает profileError', async () => {
    const fakeUser = { id: 'user-5', email: 'u5@example.com' };
    const fakeProfile = { id: 'user-5', role: 'student', first_name: 'Анна' };

    getSessionMock.mockResolvedValueOnce({ data: { session: { user: fakeUser } } });
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Temporary error' } }),
        }),
      }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.profile).toBeNull();
    expect(result.current.profileError).toBe(true);

    let resolveRetry!: (val: { data: unknown; error: null }) => void;
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () =>
            new Promise((res) => {
              resolveRetry = res;
            }),
        }),
      }),
    }));

    act(() => {
      result.current.refreshProfile();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.profileError).toBe(false);

    await act(async () => {
      resolveRetry({ data: fakeProfile, error: null });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.profile).toEqual(fakeProfile);
    expect(result.current.profileError).toBe(false);
  });

  it('повторная ошибка при уже загруженном профиле того же пользователя не сбрасывает профиль и profileError остаётся false', async () => {
    let authCallback!: (event: string, session: unknown) => unknown;
    onAuthStateChangeMock.mockImplementationOnce((cb: (event: string, session: unknown) => unknown) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const fakeUser = { id: 'user-6', email: 'u6@example.com' };
    const fakeProfile = { id: 'user-6', role: 'teacher', first_name: 'Олег' };

    getSessionMock.mockResolvedValueOnce({ data: { session: { user: fakeUser } } });
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: fakeProfile, error: null }),
        }),
      }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.profile).toEqual(fakeProfile);
    expect(result.current.profileError).toBe(false);

    // Повторный запрос на TOKEN_REFRESHED падает
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Timeout' } }),
        }),
      }),
    }));

    await act(async () => {
      authCallback('TOKEN_REFRESHED', { user: fakeUser });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.profile).toEqual(fakeProfile);
    expect(result.current.profileError).toBe(false);
  });

  it('при смене пользователя профиль предыдущего не сохраняется и чужой профиль игнорируется', async () => {
    let authCallback!: (event: string, session: unknown) => unknown;
    onAuthStateChangeMock.mockImplementationOnce((cb: (event: string, session: unknown) => unknown) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const userA = { id: 'user-a', email: 'a@example.com' };
    const profileA = { id: 'user-a', role: 'teacher' };
    const userB = { id: 'user-b', email: 'b@example.com' };

    getSessionMock.mockResolvedValueOnce({ data: { session: { user: userA } } });
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: profileA, error: null }),
        }),
      }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.profile).toEqual(profileA);
    });

    // При входе user-b возвращается профиль user-a или ошибка — профиль A не остаётся
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Failed' } }),
        }),
      }),
    }));

    await act(async () => {
      authCallback('SIGNED_IN', { user: userB });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual(userB);
    expect(result.current.profile).toBeNull();
    expect(result.current.profileError).toBe(true);
  });

  it('внутри React.StrictMode (mount → cleanup → mount) профиль загружается, loading=false, profileError=false', async () => {
    const fakeUser = { id: 'user-strict', email: 'strict@example.com' };
    const fakeProfile = { id: 'user-strict', role: 'student', first_name: 'Пётр' };
    const unsubscribeMock = vi.fn();

    onAuthStateChangeMock.mockImplementation(() => ({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    }));
    getSessionMock.mockResolvedValue({ data: { session: { user: fakeUser } } });
    fromMock.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: fakeProfile, error: null }),
        }),
      }),
    }));

    const { result, unmount } = renderHook(() => useAuth(), {
      wrapper: makeWrapper(),
      reactStrictMode: true,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.profile).toEqual(fakeProfile);
    expect(result.current.profileError).toBe(false);
    expect(onAuthStateChangeMock).toHaveBeenCalledTimes(2);
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);

    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(2);
  });

  it('если пришёл профиль с id другого пользователя, profileError=true, loading=false, profile=null', async () => {
    const fakeUser = { id: 'user-7', email: 'u7@example.com' };
    const foreignProfile = { id: 'other-user', role: 'teacher', first_name: 'Чужой' };

    getSessionMock.mockResolvedValueOnce({ data: { session: { user: fakeUser } } });
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: foreignProfile, error: null }),
        }),
      }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.profile).toBeNull();
    expect(result.current.profileError).toBe(true);
  });

  it('после выхода (onAuthStateChange с session=null) profile=null, profileError=false, loading=false, даже если до этого был profileError=true', async () => {
    let authCallback!: (event: string, session: unknown) => unknown;
    onAuthStateChangeMock.mockImplementationOnce((cb: (event: string, session: unknown) => unknown) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const fakeUser = { id: 'user-8', email: 'u8@example.com' };
    getSessionMock.mockResolvedValueOnce({ data: { session: { user: fakeUser } } });
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Network failure' } }),
        }),
      }),
    }));

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.profile).toBeNull();
    expect(result.current.profileError).toBe(true);

    await act(async () => {
      authCallback('SIGNED_OUT', null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.profileError).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('событие PASSWORD_RECOVERY ставит passwordRecovery = true, а clearPasswordRecovery сбрасывает его в false', async () => {
    let authCallback!: (event: string, session: unknown) => unknown;
    onAuthStateChangeMock.mockImplementationOnce((cb: (event: string, session: unknown) => unknown) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    getSessionMock.mockResolvedValueOnce({ data: { session: null } });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.passwordRecovery).toBe(false);

    const fakeUser = { id: 'rec-user-1', email: 'rec@example.com' };
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'rec-user-1', role: 'student' }, error: null }),
        }),
      }),
    }));

    await act(async () => {
      authCallback('PASSWORD_RECOVERY', { user: fakeUser });
    });

    expect(result.current.passwordRecovery).toBe(true);

    act(() => {
      result.current.clearPasswordRecovery();
    });

    expect(result.current.passwordRecovery).toBe(false);
  });

  it('выход (session = null) сбрасывает passwordRecovery в false', async () => {
    let authCallback!: (event: string, session: unknown) => unknown;
    onAuthStateChangeMock.mockImplementationOnce((cb: (event: string, session: unknown) => unknown) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    getSessionMock.mockResolvedValueOnce({ data: { session: null } });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fakeUser = { id: 'rec-user-2', email: 'rec2@example.com' };
    fromMock.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'rec-user-2', role: 'teacher' }, error: null }),
        }),
      }),
    }));

    await act(async () => {
      authCallback('PASSWORD_RECOVERY', { user: fakeUser });
    });
    expect(result.current.passwordRecovery).toBe(true);

    await act(async () => {
      authCallback('SIGNED_OUT', null);
    });
    expect(result.current.passwordRecovery).toBe(false);
  });

  it('обычные события SIGNED_IN и TOKEN_REFRESHED не ставят passwordRecovery = true', async () => {
    let authCallback!: (event: string, session: unknown) => unknown;
    onAuthStateChangeMock.mockImplementationOnce((cb: (event: string, session: unknown) => unknown) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    getSessionMock.mockResolvedValueOnce({ data: { session: null } });

    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fakeUser = { id: 'norm-user', email: 'norm@example.com' };
    fromMock.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'norm-user', role: 'student' }, error: null }),
        }),
      }),
    }));

    await act(async () => {
      authCallback('SIGNED_IN', { user: fakeUser });
    });
    expect(result.current.passwordRecovery).toBe(false);

    await act(async () => {
      authCallback('TOKEN_REFRESHED', { user: fakeUser });
    });
    expect(result.current.passwordRecovery).toBe(false);
  });
});


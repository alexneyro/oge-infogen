import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';

const { navigateMock, joinClassByCodeMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  joinClassByCodeMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../useJoinClass', () => ({
  joinClassByCode: joinClassByCodeMock,
}));

import { usePendingInvite, type UsePendingInviteParams } from '../usePendingInvite';

describe('usePendingInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('ничего не делает, если в localStorage нет ключа pendingInviteCode', () => {
    renderHook(() =>
      usePendingInvite({
        userId: 'student-1',
        role: 'student',
        authLoading: false,
        profileReady: true,
      })
    );

    expect(joinClassByCodeMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('joinClassNotice')).toBeNull();
  });

  it('пока профиль не загружен или идёт authLoading — ничего не делает', () => {
    localStorage.setItem('pendingInviteCode', 'GCWB2F');

    const { rerender } = renderHook<void, UsePendingInviteParams>(
      (props) => usePendingInvite(props),
      {
        initialProps: {
          userId: 'student-1',
          role: null,
          authLoading: false,
          profileReady: false,
        },
      }
    );

    expect(localStorage.getItem('pendingInviteCode')).toBe('GCWB2F');
    expect(joinClassByCodeMock).not.toHaveBeenCalled();

    rerender({
      userId: 'student-1',
      role: 'student',
      authLoading: true,
      profileReady: true,
    });

    expect(localStorage.getItem('pendingInviteCode')).toBe('GCWB2F');
    expect(joinClassByCodeMock).not.toHaveBeenCalled();

    rerender({
      userId: null,
      role: 'student',
      authLoading: false,
      profileReady: true,
    });

    expect(localStorage.getItem('pendingInviteCode')).toBe('GCWB2F');
    expect(joinClassByCodeMock).not.toHaveBeenCalled();
  });

  it('для teacher удаляет ключ pendingInviteCode и не вызывает RPC', () => {
    localStorage.setItem('pendingInviteCode', 'GCWB2F');

    renderHook(() =>
      usePendingInvite({
        userId: 'teacher-1',
        role: 'teacher',
        authLoading: false,
        profileReady: true,
      })
    );

    expect(localStorage.getItem('pendingInviteCode')).toBeNull();
    expect(joinClassByCodeMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('для student синхронно удаляет ключ до завершения RPC, вызывает RPC один раз в StrictMode, пишет notice и делает navigate', async () => {
    localStorage.setItem('pendingInviteCode', 'GCWB2F');

    let resolveJoin!: (res: { ok: boolean; message: string }) => void;
    joinClassByCodeMock.mockImplementation(
      () =>
        new Promise((res) => {
          resolveJoin = res;
        })
    );

    renderHook(
      () =>
        usePendingInvite({
          userId: 'student-1',
          role: 'student',
          authLoading: false,
          profileReady: true,
        }),
      { reactStrictMode: true }
    );

    expect(localStorage.getItem('pendingInviteCode')).toBeNull();
    expect(joinClassByCodeMock).toHaveBeenCalledTimes(1);
    expect(joinClassByCodeMock).toHaveBeenCalledWith('GCWB2F');
    expect(navigateMock).not.toHaveBeenCalled();

    resolveJoin({
      ok: true,
      message: 'Вы вступили в класс. Задания от учителя появятся на этой странице.',
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/student/assignments');
    });

    expect(JSON.parse(sessionStorage.getItem('joinClassNotice')!)).toEqual({
      type: 'success',
      text: 'Вы вступили в класс. Задания от учителя появятся на этой странице.',
    });
  });

  it('при ошибке joinClassByCode для student записывает error notice и переходит на /student/assignments', async () => {
    localStorage.setItem('pendingInviteCode', 'BAD000');
    joinClassByCodeMock.mockResolvedValue({
      ok: false,
      message: 'Класс с таким кодом не найден. Проверьте код.',
    });

    renderHook(() =>
      usePendingInvite({
        userId: 'student-1',
        role: 'student',
        authLoading: false,
        profileReady: true,
      })
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/student/assignments');
    });

    expect(JSON.parse(sessionStorage.getItem('joinClassNotice')!)).toEqual({
      type: 'error',
      text: 'Класс с таким кодом не найден. Проверьте код.',
    });
  });
});

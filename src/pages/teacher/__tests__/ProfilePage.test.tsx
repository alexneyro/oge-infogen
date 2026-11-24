import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { useAuthMock, refreshProfileMock, updateMock, eqMock, signInWithPasswordMock, updateUserMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  refreshProfileMock: vi.fn(),
  updateMock: vi.fn(),
  eqMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  updateUserMock: vi.fn(),
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: useAuthMock,
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
      updateUser: updateUserMock,
    },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            })),
          })),
          update: updateMock,
        };
      }
      if (table === 'classes') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            })),
          })),
        };
      }
      if (table === 'assignments') {
        return {
          select: vi.fn(() => ({
            in: vi.fn().mockResolvedValue({ count: 0 }),
          })),
        };
      }
      return {};
    }),
  },
}));

import { TeacherProfilePage } from '../ProfilePage';

describe('TeacherProfilePage — смена имени и фамилии через модал', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockReturnValue({ eq: eqMock });
    eqMock.mockResolvedValue({ error: null });
    signInWithPasswordMock.mockResolvedValue({ data: {}, error: null });
    updateUserMock.mockResolvedValue({ data: {}, error: null });
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1', email: 'teacher@example.com', created_at: '2026-01-01T00:00:00Z' },
      profile: {
        id: 'teacher-1',
        role: 'teacher',
        first_name: 'Елена',
        last_name: 'Смирнова',
        display_name: 'Елена Смирнова',
        email: 'teacher@example.com',
        notification_interval: 'instant',
        notification_time: '18:00',
      },
      refreshProfile: refreshProfileMock,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('открывает RenameNameModal, без подтверждения не вызывает update, после подтверждения сохраняет и вызывает refreshProfile', async () => {
    render(<TeacherProfilePage />);

    expect(screen.queryByLabelText('Имя')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Изменить имя' }));

    const firstInput = screen.getByLabelText('Имя') as HTMLInputElement;
    const lastInput = screen.getByLabelText('Фамилия') as HTMLInputElement;
    expect(firstInput.value).toBe('Елена');
    expect(lastInput.value).toBe('Смирнова');

    fireEvent.change(firstInput, { target: { value: '  Ольга ' } });
    fireEvent.change(lastInput, { target: { value: ' Кузнецова ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(screen.getByText('Изменить имя на «Кузнецова Ольга»?')).toBeTruthy();
    expect(screen.getByText('Имя изменится в вашем профиле')).toBeTruthy();
    expect(updateMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Да, изменить' }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({
        first_name: 'Ольга',
        last_name: 'Кузнецова',
        display_name: 'Ольга Кузнецова',
      });
    });

    expect(eqMock).toHaveBeenCalledWith('id', 'teacher-1');
    expect(refreshProfileMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('показывает ошибку в модале при сбое Supabase и не вызывает refreshProfile', async () => {
    eqMock.mockResolvedValueOnce({ error: { message: 'Permission denied' } });

    render(<TeacherProfilePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Изменить имя' }));
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Ольга' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Да, изменить' }));

    await waitFor(() => {
      expect(screen.getByText('Permission denied')).toBeTruthy();
    });

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(refreshProfileMock).not.toHaveBeenCalled();
  });
});

describe('TeacherProfilePage — смена пароля с подтверждением текущим паролем', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockReturnValue({ eq: eqMock });
    eqMock.mockResolvedValue({ error: null });
    signInWithPasswordMock.mockResolvedValue({ data: {}, error: null });
    updateUserMock.mockResolvedValue({ data: {}, error: null });
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1', email: 'teacher@example.com', created_at: '2026-01-01T00:00:00Z' },
      profile: {
        id: 'teacher-1',
        role: 'teacher',
        first_name: 'Елена',
        last_name: 'Смирнова',
        display_name: 'Елена Смирнова',
        email: 'teacher@example.com',
        notification_interval: 'instant',
        notification_time: '18:00',
      },
      refreshProfile: refreshProfileMock,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('блокирует кнопку «Сменить пароль» при пустом текущем пароле, даже если новый и подтверждение заполнены корректно', () => {
    render(<TeacherProfilePage />);

    const currentInput = screen.getByPlaceholderText('Текущий пароль') as HTMLInputElement;
    const newInput = screen.getByPlaceholderText('Новый пароль') as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText('Повторите новый пароль') as HTMLInputElement;
    const submitBtn = screen.getByRole('button', { name: 'Сменить пароль' }) as HTMLButtonElement;

    expect(currentInput.getAttribute('autocomplete')).toBe('current-password');
    expect(submitBtn.disabled).toBe(true);

    fireEvent.change(newInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmInput, { target: { value: 'newpass123' } });

    expect(submitBtn.disabled).toBe(true);

    fireEvent.change(currentInput, { target: { value: 'oldpass123' } });
    expect(submitBtn.disabled).toBe(false);
  });

  it('если новый пароль равен текущему, показывает ошибку и не вызывает signInWithPassword и updateUser', async () => {
    render(<TeacherProfilePage />);

    fireEvent.change(screen.getByPlaceholderText('Текущий пароль'), { target: { value: 'samepass123' } });
    fireEvent.change(screen.getByPlaceholderText('Новый пароль'), { target: { value: 'samepass123' } });
    fireEvent.change(screen.getByPlaceholderText('Повторите новый пароль'), { target: { value: 'samepass123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Сменить пароль' }));

    await waitFor(() => {
      expect(screen.getByText('Новый пароль должен отличаться от старого')).toBeTruthy();
    });

    expect(signInWithPasswordMock).not.toHaveBeenCalled();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('при неверном текущем пароле показывает ошибку и не вызывает updateUser', async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    });

    render(<TeacherProfilePage />);

    fireEvent.change(screen.getByPlaceholderText('Текущий пароль'), { target: { value: 'wrongpass' } });
    fireEvent.change(screen.getByPlaceholderText('Новый пароль'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Повторите новый пароль'), { target: { value: 'newpass123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Сменить пароль' }));

    await waitFor(() => {
      expect(screen.getByText('Текущий пароль неверный')).toBeTruthy();
    });

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'teacher@example.com',
      password: 'wrongpass',
    });
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('при rate limit от signInWithPassword показывает сообщение о слишком частых попытках и не вызывает updateUser', async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Email rate limit exceeded', status: 429 },
    });

    render(<TeacherProfilePage />);

    fireEvent.change(screen.getByPlaceholderText('Текущий пароль'), { target: { value: 'oldpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Новый пароль'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Повторите новый пароль'), { target: { value: 'newpass123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Сменить пароль' }));

    await waitFor(() => {
      expect(screen.getByText('Слишком много попыток. Подождите немного')).toBeTruthy();
    });

    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('при верном текущем пароле вызывает signInWithPassword, затем updateUser и очищает все три поля', async () => {
    render(<TeacherProfilePage />);

    const currentInput = screen.getByPlaceholderText('Текущий пароль') as HTMLInputElement;
    const newInput = screen.getByPlaceholderText('Новый пароль') as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText('Повторите новый пароль') as HTMLInputElement;

    fireEvent.change(currentInput, { target: { value: 'oldpass123' } });
    fireEvent.change(newInput, { target: { value: 'newpass123' } });
    fireEvent.change(confirmInput, { target: { value: 'newpass123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Сменить пароль' }));

    await waitFor(() => {
      expect(screen.getByText('Пароль успешно изменён!')).toBeTruthy();
    });

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'teacher@example.com',
      password: 'oldpass123',
    });
    expect(updateUserMock).toHaveBeenCalledWith({ password: 'newpass123' });
    expect(signInWithPasswordMock.mock.invocationCallOrder[0]).toBeLessThan(
      updateUserMock.mock.invocationCallOrder[0]
    );
    expect(currentInput.value).toBe('');
    expect(newInput.value).toBe('');
    expect(confirmInput.value).toBe('');
  });
});

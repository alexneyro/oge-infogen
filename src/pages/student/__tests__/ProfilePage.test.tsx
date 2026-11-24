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

vi.mock('../../../lib/fetchAllPages', () => ({
  fetchAllPages: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: signInWithPasswordMock,
      updateUser: updateUserMock,
    },
    from: vi.fn(() => ({
      update: updateMock,
    })),
  },
}));

import { ProfilePage } from '../ProfilePage';

describe('Student ProfilePage — смена имени и фамилии через модал', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockReturnValue({ eq: eqMock });
    eqMock.mockResolvedValue({ error: null });
    signInWithPasswordMock.mockResolvedValue({ data: {}, error: null });
    updateUserMock.mockResolvedValue({ data: {}, error: null });
    useAuthMock.mockReturnValue({
      user: { id: 'student-1', email: 'student@example.com', created_at: '2026-01-01T00:00:00Z' },
      profile: {
        id: 'student-1',
        role: 'student',
        first_name: 'Иван',
        last_name: 'Петров',
        display_name: 'Иван Петров',
        email: 'student@example.com',
      },
      refreshProfile: refreshProfileMock,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('открывает RenameNameModal по кнопке, без подтверждения не вызывает update, после подтверждения сохраняет и обновляет профиль', async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Решено номеров')).toBeTruthy();
    });

    expect(screen.queryByLabelText('Имя')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Изменить имя' }));

    const firstInput = screen.getByLabelText('Имя') as HTMLInputElement;
    const lastInput = screen.getByLabelText('Фамилия') as HTMLInputElement;
    expect(firstInput.value).toBe('Иван');
    expect(lastInput.value).toBe('Петров');

    fireEvent.change(firstInput, { target: { value: '  Артём  ' } });
    fireEvent.change(lastInput, { target: { value: '  Соколов-Белов  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(screen.getByText('Изменить имя на «Соколов-Белов Артём»?')).toBeTruthy();
    expect(
      screen.getByText('Имя изменится в вашем профиле и будет видно учителю. Старые результаты останутся за вами')
    ).toBeTruthy();
    expect(updateMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Да, изменить' }));

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({
        first_name: 'Артём',
        last_name: 'Соколов-Белов',
        display_name: 'Артём Соколов-Белов',
      });
    });

    expect(eqMock).toHaveBeenCalledWith('id', 'student-1');
    expect(refreshProfileMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('показывает ошибку в модале при сбое Supabase и не вызывает refreshProfile', async () => {
    eqMock.mockResolvedValueOnce({ error: { message: 'Ошибка базы данных' } });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Решено номеров')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Изменить имя' }));
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Пётр' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Да, изменить' }));

    await waitFor(() => {
      expect(screen.getByText('Ошибка базы данных')).toBeTruthy();
    });

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(refreshProfileMock).not.toHaveBeenCalled();
  });
});

describe('Student ProfilePage — смена пароля с подтверждением текущим паролем', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMock.mockReturnValue({ eq: eqMock });
    eqMock.mockResolvedValue({ error: null });
    signInWithPasswordMock.mockResolvedValue({ data: {}, error: null });
    updateUserMock.mockResolvedValue({ data: {}, error: null });
    useAuthMock.mockReturnValue({
      user: { id: 'student-1', email: 'student@example.com', created_at: '2026-01-01T00:00:00Z' },
      profile: {
        id: 'student-1',
        role: 'student',
        first_name: 'Иван',
        last_name: 'Петров',
        display_name: 'Иван Петров',
        email: 'student@example.com',
      },
      refreshProfile: refreshProfileMock,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('блокирует кнопку «Сменить пароль» при пустом текущем пароле, даже если новый и подтверждение заполнены корректно', async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Решено номеров')).toBeTruthy();
    });

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
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Решено номеров')).toBeTruthy();
    });

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

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Решено номеров')).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText('Текущий пароль'), { target: { value: 'wrongpass' } });
    fireEvent.change(screen.getByPlaceholderText('Новый пароль'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByPlaceholderText('Повторите новый пароль'), { target: { value: 'newpass123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Сменить пароль' }));

    await waitFor(() => {
      expect(screen.getByText('Текущий пароль неверный')).toBeTruthy();
    });

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: 'student@example.com',
      password: 'wrongpass',
    });
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('при rate limit от signInWithPassword показывает сообщение о слишком частых попытках и не вызывает updateUser', async () => {
    signInWithPasswordMock.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Email rate limit exceeded', status: 429 },
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Решено номеров')).toBeTruthy();
    });

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
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Решено номеров')).toBeTruthy();
    });

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
      email: 'student@example.com',
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

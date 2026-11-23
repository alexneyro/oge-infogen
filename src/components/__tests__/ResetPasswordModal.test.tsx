import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';

const { updateUserMock } = vi.hoisted(() => ({
  updateUserMock: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: updateUserMock,
    },
  },
}));

import { ResetPasswordModal } from '../ResetPasswordModal';

describe('ResetPasswordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('при isOpen=false ничего не рендерится', () => {
    const { container } = render(<ResetPasswordModal isOpen={false} onDone={vi.fn()} />);
    expect(container.innerHTML).toBe('');
    expect(screen.queryByText('Задайте новый пароль')).toBeNull();
  });

  it('короткий пароль отклоняется без запроса к supabase', () => {
    render(<ResetPasswordModal isOpen={true} onDone={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить пароль' }));

    expect(screen.getByText('Пароль должен быть минимум 6 символов')).toBeTruthy();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('несовпадающие пароли отклоняются без запроса к supabase', () => {
    render(<ResetPasswordModal isOpen={true} onDone={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'other123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить пароль' }));

    expect(screen.getByText('Пароли не совпадают')).toBeTruthy();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it('успешное сохранение вызывает updateUser, показывает подтверждение, скрывает поля и не вызывает onDone сразу', async () => {
    vi.useFakeTimers();
    updateUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const onDone = vi.fn();

    render(<ResetPasswordModal isOpen={true} onDone={onDone} />);

    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'newpass123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Сохранить пароль' }));
    });

    expect(updateUserMock).toHaveBeenCalledWith({ password: 'newpass123' });
    expect(screen.getByText(/Пароль изменён/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Готово' })).toBeTruthy();
    expect(screen.queryByLabelText('Новый пароль')).toBeNull();
    expect(screen.queryByLabelText('Повторите пароль')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Сохранить пароль' })).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('через 2500 мс после успеха onDone вызывается ровно 1 раз', async () => {
    vi.useFakeTimers();
    updateUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const onDone = vi.fn();

    render(<ResetPasswordModal isOpen={true} onDone={onDone} />);

    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'newpass123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Сохранить пароль' }));
    });

    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2499);
    });
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('клик по «Готово» вызывает onDone 1 раз, и таймер не вызывает его второй раз', async () => {
    vi.useFakeTimers();
    updateUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const onDone = vi.fn();

    render(<ResetPasswordModal isOpen={true} onDone={onDone} />);

    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'newpass123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Сохранить пароль' }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'Готово' }));
    expect(onDone).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('размонтирование до истечения таймера не вызывает onDone', async () => {
    vi.useFakeTimers();
    updateUserMock.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
    const onDone = vi.fn();

    const { unmount } = render(<ResetPasswordModal isOpen={true} onDone={onDone} />);

    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'newpass123' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Сохранить пароль' }));
    });

    expect(onDone).not.toHaveBeenCalled();
    unmount();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onDone).not.toHaveBeenCalled();
  });

  it('ошибка "New password should be different from the old password" показывается по-русски', async () => {
    updateUserMock.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'New password should be different from the old password' },
    });
    const onDone = vi.fn();

    render(<ResetPasswordModal isOpen={true} onDone={onDone} />);

    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'samepass123' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'samepass123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить пароль' }));

    await waitFor(() => {
      expect(screen.getByText('Новый пароль должен отличаться от старого')).toBeTruthy();
    });
    expect(onDone).not.toHaveBeenCalled();
  });

  it('кнопка «Закрыть» вызывает onDone без вызова updateUser', () => {
    const onDone = vi.fn();
    render(<ResetPasswordModal isOpen={true} onDone={onDone} />);

    fireEvent.click(screen.getByRole('button', { name: 'Закрыть' }));

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});


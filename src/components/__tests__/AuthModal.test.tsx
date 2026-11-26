import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { signUpWithEmailMock, signInWithEmailMock, resetPasswordMock, rpcMock } = vi.hoisted(() => ({
  signUpWithEmailMock: vi.fn(),
  signInWithEmailMock: vi.fn(),
  resetPasswordMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  signInWithEmail: signInWithEmailMock,
  signUpWithEmail: signUpWithEmailMock,
  resetPassword: resetPasswordMock,
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

import { AuthModal } from '../AuthModal';

function openRegisterForm() {
  render(<AuthModal isOpen={true} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Зарегистрироваться/i }));
}

function fillBaseRegisterFields() {
  fireEvent.change(screen.getByPlaceholderText('Иванов'), { target: { value: 'Петров' } });
  fireEvent.change(screen.getByPlaceholderText('Иван'), { target: { value: 'Иван' } });
  fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'user@example.com' } });
  const passwordInputs = screen.getAllByPlaceholderText('••••••••');
  fireEvent.change(passwordInputs[0], { target: { value: 'secret123' } });
  fireEvent.change(passwordInputs[1], { target: { value: 'secret123' } });
}

describe('AuthModal — регистрация и код класса', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    rpcMock.mockResolvedValue({ data: { ok: true }, error: null });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('a) ученик с кодом «abc123»: вызывает rpc join_class_by_invite один раз с ABC123 и удаляет pendingInviteCode', async () => {
    localStorage.setItem('pendingInviteCode', 'OLD999');
    signUpWithEmailMock.mockResolvedValue({
      data: { user: { id: 'student-123' } },
      error: null,
    });

    openRegisterForm();
    fillBaseRegisterFields();
    fireEvent.change(screen.getByPlaceholderText('GCWB2F'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(signUpWithEmailMock).toHaveBeenCalledWith(
        'user@example.com',
        'secret123',
        'Иван',
        'Петров',
        'student'
      );
    });

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledTimes(1);
    });
    expect(rpcMock).toHaveBeenCalledWith('join_class_by_invite', {
      p_invite_code: 'ABC123',
      p_student_id: 'student-123',
    });
    expect(localStorage.getItem('pendingInviteCode')).toBeNull();
  });

  it('b) учитель с введённым кодом: rpc не вызывается, signUpWithEmail вызван с role teacher', async () => {
    signUpWithEmailMock.mockResolvedValue({
      data: { user: { id: 'teacher-1' } },
      error: null,
    });

    openRegisterForm();
    fillBaseRegisterFields();
    fireEvent.change(screen.getByPlaceholderText('GCWB2F'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByLabelText('Учитель'));
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(signUpWithEmailMock).toHaveBeenCalledWith(
        'user@example.com',
        'secret123',
        'Иван',
        'Петров',
        'teacher'
      );
    });

    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('c) учитель при pendingInviteCode в localStorage: rpc не вызывается, ключ удалён после успешной регистрации', async () => {
    localStorage.setItem('pendingInviteCode', 'INV777');
    signUpWithEmailMock.mockResolvedValue({
      data: { user: { id: 'teacher-2' } },
      error: null,
    });

    openRegisterForm();
    expect((screen.getByPlaceholderText('GCWB2F') as HTMLInputElement).value).toBe('INV777');

    fireEvent.click(screen.getByLabelText('Учитель'));
    fillBaseRegisterFields();
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(
        screen.getByText('Проверьте почту — мы отправили письмо для подтверждения')
      ).toBeTruthy();
    });

    expect(signUpWithEmailMock).toHaveBeenCalledWith(
      'user@example.com',
      'secret123',
      'Иван',
      'Петров',
      'teacher'
    );
    expect(rpcMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('pendingInviteCode')).toBeNull();
  });

  it('d) при выбранной роли «Учитель» поле кода disabled и пустое, после возврата на «Ученик» активно и содержит введённый ранее код', () => {
    openRegisterForm();

    const studentCodeInput = screen.getByPlaceholderText('GCWB2F') as HTMLInputElement;
    expect(studentCodeInput.disabled).toBe(false);
    fireEvent.change(studentCodeInput, { target: { value: 'abc123' } });
    expect(studentCodeInput.value).toBe('abc123');

    fireEvent.click(screen.getByLabelText('Учитель'));
    const teacherCodeInput = screen.getByPlaceholderText('Для учителя не нужно') as HTMLInputElement;
    expect(teacherCodeInput.disabled).toBe(true);
    expect(teacherCodeInput.value).toBe('');
    expect(teacherCodeInput.className).toContain('disabled:opacity-60');
    expect(teacherCodeInput.className).toContain('disabled:cursor-not-allowed');

    fireEvent.click(screen.getByLabelText('Ученик'));
    const restoredCodeInput = screen.getByPlaceholderText('GCWB2F') as HTMLInputElement;
    expect(restoredCodeInput.disabled).toBe(false);
    expect(restoredCodeInput.value).toBe('abc123');
  });

  it('e) при ошибке signUp ключ pendingInviteCode не удаляется', async () => {
    localStorage.setItem('pendingInviteCode', 'KEEP99');
    signUpWithEmailMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });

    openRegisterForm();
    fillBaseRegisterFields();
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(
        screen.getByText('Пользователь с таким email уже зарегистрирован')
      ).toBeTruthy();
    });

    expect(rpcMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('pendingInviteCode')).toBe('KEEP99');
  });

  it('f) пароль из 5 символов отклоняется, а из 6 символов принимается', async () => {
    signUpWithEmailMock.mockResolvedValue({
      data: { user: { id: 'student-pw6' } },
      error: null,
    });

    openRegisterForm();
    fireEvent.change(screen.getByPlaceholderText('Иванов'), { target: { value: 'Петров' } });
    fireEvent.change(screen.getByPlaceholderText('Иван'), { target: { value: 'Иван' } });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), { target: { value: 'user@example.com' } });

    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInputs[0], { target: { value: '12345' } });
    fireEvent.change(passwordInputs[1], { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    expect(screen.getByText('Пароль должен быть минимум 6 символов')).toBeTruthy();
    expect(signUpWithEmailMock).not.toHaveBeenCalled();

    fireEvent.change(passwordInputs[0], { target: { value: '123456' } });
    fireEvent.change(passwordInputs[1], { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(signUpWithEmailMock).toHaveBeenCalledWith(
        'user@example.com',
        '123456',
        'Иван',
        'Петров',
        'student'
      );
    });
  });

  it('g) identities: [] при error: null показывает ошибку занятого email, не показывает «Проверьте почту», не вызывает rpc и не удаляет pendingInviteCode', async () => {
    localStorage.setItem('pendingInviteCode', 'KEEP99');
    signUpWithEmailMock.mockResolvedValue({
      data: { user: { id: 'existing-1', identities: [] } },
      error: null,
    });

    openRegisterForm();
    fillBaseRegisterFields();
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(
        screen.getByText('Этот email уже зарегистрирован. Войдите в аккаунт или нажмите «Забыли пароль?»')
      ).toBeTruthy();
    });

    expect(screen.queryByText(/Проверьте почту/)).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('pendingInviteCode')).toBe('KEEP99');
  });

  it('h) identities: [] для ученика с кодом «abc123» сохраняет pendingInviteCode = ABC123 в localStorage', async () => {
    signUpWithEmailMock.mockResolvedValue({
      data: { user: { id: 'existing-student', identities: [] } },
      error: null,
    });

    openRegisterForm();
    fillBaseRegisterFields();
    fireEvent.change(screen.getByPlaceholderText('GCWB2F'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(
        screen.getByText('Этот email уже зарегистрирован. Войдите в аккаунт или нажмите «Забыли пароль?»')
      ).toBeTruthy();
    });

    expect(screen.queryByText(/Проверьте почту/)).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('pendingInviteCode')).toBe('ABC123');
  });

  it('i) identities: [] для учителя с введённым кодом не записывает pendingInviteCode', async () => {
    signUpWithEmailMock.mockResolvedValue({
      data: { user: { id: 'existing-teacher', identities: [] } },
      error: null,
    });

    openRegisterForm();
    fillBaseRegisterFields();
    fireEvent.change(screen.getByPlaceholderText('GCWB2F'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByLabelText('Учитель'));
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(
        screen.getByText('Этот email уже зарегистрирован. Войдите в аккаунт или нажмите «Забыли пароль?»')
      ).toBeTruthy();
    });

    expect(screen.queryByText(/Проверьте почту/)).toBeNull();
    expect(rpcMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('pendingInviteCode')).toBeNull();
  });

  it('j) identities: [{ id: "1" }] при error: null показывает «Проверьте почту…» как раньше', async () => {
    signUpWithEmailMock.mockResolvedValue({
      data: { user: { id: 'new-user-1', identities: [{ id: '1' }] } },
      error: null,
    });

    openRegisterForm();
    fillBaseRegisterFields();
    fireEvent.click(screen.getByRole('button', { name: 'Создать аккаунт' }));

    await waitFor(() => {
      expect(
        screen.getByText('Проверьте почту — мы отправили письмо для подтверждения')
      ).toBeTruthy();
    });
  });

  it('k) вход: ошибка «Email not confirmed» переводится на русский язык', async () => {
    signInWithEmailMock.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Email not confirmed' },
    });

    render(<AuthModal isOpen={true} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('example@mail.ru или oge_bigfox32'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }));

    await waitFor(() => {
      expect(
        screen.getByText('Почта не подтверждена. Откройте письмо со ссылкой подтверждения.')
      ).toBeTruthy();
    });
  });

  it('l) с initialScreen="register" и showInviteNotice=true сразу открывается на регистрации с плашкой, кодом, ролью «Ученик» и переключением на вход', () => {
    localStorage.setItem('pendingInviteCode', 'GCWB2F');

    render(
      <AuthModal
        isOpen={true}
        onClose={vi.fn()}
        initialScreen="register"
        showInviteNotice={true}
      />
    );

    expect(screen.getByText('Регистрация')).toBeTruthy();
    expect(screen.getByText('Вы вступаете в класс по приглашению')).toBeTruthy();
    expect((screen.getByPlaceholderText('GCWB2F') as HTMLInputElement).value).toBe('GCWB2F');
    expect((screen.getByLabelText('Ученик') as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('button', { name: 'Создать аккаунт' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Уже есть аккаунт\?\s*Войти/i }));

    expect(screen.getByText('Вход в аккаунт')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeTruthy();
    expect(localStorage.getItem('pendingInviteCode')).toBe('GCWB2F');
  });

  it('m) без initialScreen и showInviteNotice открывается на входе без плашки приглашения', () => {
    localStorage.setItem('pendingInviteCode', 'GCWB2F');

    render(<AuthModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Вход в аккаунт')).toBeTruthy();
    expect(screen.queryByText('Вы вступаете в класс по приглашению')).toBeNull();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeTruthy();
  });
});


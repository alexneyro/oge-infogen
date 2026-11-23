import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const {
  useAssignmentsMock,
  useAuthMock,
  joinClassByCodeMock,
  navigateMock,
  fetchAssignmentsMock,
} = vi.hoisted(() => ({
  useAssignmentsMock: vi.fn(),
  useAuthMock: vi.fn(),
  joinClassByCodeMock: vi.fn(),
  navigateMock: vi.fn(),
  fetchAssignmentsMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../../../hooks/useAssignments', () => ({
  useAssignments: useAssignmentsMock,
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: useAuthMock,
}));

vi.mock('../../../hooks/useJoinClass', () => ({
  joinClassByCode: joinClassByCodeMock,
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { AssignmentsPage } from '../AssignmentsPage';

describe('AssignmentsPage — пустой экран и вступление в класс', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    fetchAssignmentsMock.mockResolvedValue(undefined);
    useAuthMock.mockReturnValue({
      user: { id: 'student-1' },
      profile: { id: 'student-1', role: 'student' },
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it('hasClasses === false: показывает карточку ввода кода класса вместо «Активных заданий нет»', () => {
    useAssignmentsMock.mockReturnValue({
      assignments: [],
      loading: false,
      error: null,
      hasClasses: false,
      fetchAssignments: fetchAssignmentsMock,
    });

    render(<AssignmentsPage />);

    expect(screen.getByText('Вы пока не состоите ни в одном классе')).toBeTruthy();
    expect(screen.getByText('Введите код класса, который дал учитель, чтобы получать от него задания')).toBeTruthy();
    expect(screen.queryByText('Активных заданий нет')).toBeNull();

    const input = screen.getByPlaceholderText('GCWB2F') as HTMLInputElement;
    expect(input.maxLength).toBe(6);
    fireEvent.change(input, { target: { value: 'abc123' } });
    expect(input.value).toBe('ABC123');
    expect(screen.getByRole('button', { name: 'Вступить' })).toBeTruthy();
  });

  it('hasClasses === true и заданий нет: показывает «Активных заданий нет» без формы кода', () => {
    useAssignmentsMock.mockReturnValue({
      assignments: [],
      loading: false,
      error: null,
      hasClasses: true,
      fetchAssignments: fetchAssignmentsMock,
    });

    render(<AssignmentsPage />);

    expect(screen.getByText('Активных заданий нет')).toBeTruthy();
    expect(screen.queryByText('Вы пока не состоите ни в одном классе')).toBeNull();
  });

  it('hasClasses === null и заданий нет: показывает «Активных заданий нет» без формы кода', () => {
    useAssignmentsMock.mockReturnValue({
      assignments: [],
      loading: false,
      error: null,
      hasClasses: null,
      fetchAssignments: fetchAssignmentsMock,
    });

    render(<AssignmentsPage />);

    expect(screen.getByText('Активных заданий нет')).toBeTruthy();
    expect(screen.queryByText('Вы пока не состоите ни в одном классе')).toBeNull();
  });

  it('отправка кода блокирует поле и кнопку, защищает от двойного клика и при успехе вызывает fetchAssignments', async () => {
    useAssignmentsMock.mockReturnValue({
      assignments: [],
      loading: false,
      error: null,
      hasClasses: false,
      fetchAssignments: fetchAssignmentsMock,
    });

    let resolveJoin!: (res: { ok: boolean; message: string }) => void;
    joinClassByCodeMock.mockImplementation(
      () =>
        new Promise((res) => {
          resolveJoin = res;
        })
    );

    render(<AssignmentsPage />);

    const input = screen.getByPlaceholderText('GCWB2F') as HTMLInputElement;
    const button = screen.getByRole('button', { name: 'Вступить' }) as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'gcwb2f' } });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(joinClassByCodeMock).toHaveBeenCalledTimes(1);
    expect(joinClassByCodeMock).toHaveBeenCalledWith('GCWB2F');
    expect(input.disabled).toBe(true);
    expect(button.disabled).toBe(true);

    resolveJoin({
      ok: true,
      message: 'Вы вступили в класс. Задания от учителя появятся на этой странице.',
    });

    await waitFor(() => {
      expect(
        screen.getByText('Вы вступили в класс. Задания от учителя появятся на этой странице.')
      ).toBeTruthy();
    });
    expect(input.disabled).toBe(false);
    expect(button.disabled).toBe(false);
    expect(fetchAssignmentsMock).toHaveBeenCalledTimes(2);
  });

  it('читает joinClassNotice из sessionStorage при монтировании, показывает inline-блок и удаляет ключ', () => {
    sessionStorage.setItem(
      'joinClassNotice',
      JSON.stringify({
        type: 'success',
        text: 'Вы вступили в класс. Задания от учителя появятся на этой странице.',
      })
    );
    useAssignmentsMock.mockReturnValue({
      assignments: [],
      loading: false,
      error: null,
      hasClasses: true,
      fetchAssignments: fetchAssignmentsMock,
    });

    render(<AssignmentsPage />);

    expect(
      screen.getByText('Вы вступили в класс. Задания от учителя появятся на этой странице.')
    ).toBeTruthy();
    expect(sessionStorage.getItem('joinClassNotice')).toBeNull();
  });

  it('показывает error notice из sessionStorage и удаляет ключ', () => {
    sessionStorage.setItem(
      'joinClassNotice',
      JSON.stringify({
        type: 'error',
        text: 'Класс с таким кодом не найден. Проверьте код.',
      })
    );
    useAssignmentsMock.mockReturnValue({
      assignments: [],
      loading: false,
      error: null,
      hasClasses: false,
      fetchAssignments: fetchAssignmentsMock,
    });

    render(<AssignmentsPage />);

    expect(screen.getByText('Класс с таким кодом не найден. Проверьте код.')).toBeTruthy();
    expect(sessionStorage.getItem('joinClassNotice')).toBeNull();
  });
});

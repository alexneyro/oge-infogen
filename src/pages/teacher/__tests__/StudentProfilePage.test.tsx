import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const {
  navigateMock,
  rpcMock,
  classMemberSingleMock,
  assignmentsOrderMock,
  assignmentTargetsInMock,
  assignmentTargetsEqMock,
  sessionsInMock,
  sessionsOrderIdMock,
  fromMock,
} = vi.hoisted(() => {
  const assignmentsOrderMock = vi.fn();
  const assignmentTargetsEqMock = vi.fn();
  const assignmentTargetsInMock = vi.fn(() => ({ eq: assignmentTargetsEqMock }));
  const sessionsOrderIdMock = vi.fn();
  const sessionsOrderCreatedMock = vi.fn(() => ({ order: sessionsOrderIdMock }));
  const sessionsInMock = vi.fn(() => ({ order: sessionsOrderCreatedMock }));
  const classMemberSingleMock = vi.fn();

  const fromMock = vi.fn((table: string) => {
    if (table === 'class_members') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: classMemberSingleMock,
            })),
          })),
        })),
      };
    }
    if (table === 'assignments') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: assignmentsOrderMock,
          })),
        })),
      };
    }
    if (table === 'assignment_targets') {
      return {
        select: vi.fn(() => ({
          in: assignmentTargetsInMock,
        })),
      };
    }
    if (table === 'sessions') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: sessionsInMock,
          })),
        })),
      };
    }
    return {};
  });

  return {
    navigateMock: vi.fn(),
    rpcMock: vi.fn(),
    classMemberSingleMock,
    assignmentsOrderMock,
    assignmentTargetsInMock,
    assignmentTargetsEqMock,
    sessionsInMock,
    sessionsOrderIdMock,
    fromMock,
  };
});

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ classId: 'class-1', studentId: 'student-1' }),
}));

vi.mock('../../../hooks/useSessionHistory', () => ({
  useSessionHistory: () => ({
    sessions: [],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('../../../lib/fetchAllPages', () => ({
  fetchAllPages: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
  },
}));

import { StudentProfilePage } from '../StudentProfilePage';

describe('StudentProfilePage (учитель) — переименование ученика через модал', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    classMemberSingleMock.mockResolvedValue({
      data: {
        joined_at: '2026-01-10T00:00:00Z',
        profiles: {
          id: 'student-1',
          first_name: 'Иван',
          last_name: 'Петров',
          email: 'ivan@example.com',
          generated_login: null,
          generated_password: null,
        },
      },
    });
    rpcMock.mockResolvedValue({ error: null });
    assignmentsOrderMock.mockResolvedValue({ data: [], error: null });
    assignmentTargetsEqMock.mockResolvedValue({ data: [], error: null });
    sessionsOrderIdMock.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    cleanup();
  });

  it('открывает RenameNameModal, не вызывает rpc без подтверждения, после подтверждения вызывает rpc и перезагружает ученика', async () => {
    classMemberSingleMock
      .mockResolvedValueOnce({
        data: {
          joined_at: '2026-01-10T00:00:00Z',
          profiles: {
            id: 'student-1',
            first_name: 'Иван',
            last_name: 'Петров',
            email: 'ivan@example.com',
            generated_login: null,
            generated_password: null,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          joined_at: '2026-01-10T00:00:00Z',
          profiles: {
            id: 'student-1',
            first_name: 'Пётр',
            last_name: 'Сидоров',
            email: 'ivan@example.com',
            generated_login: null,
            generated_password: null,
          },
        },
      });

    render(<StudentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Петров Иван')).toBeTruthy();
    });

    expect(screen.queryByLabelText('Имя')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Изменить имя' }));

    const firstInput = screen.getByLabelText('Имя') as HTMLInputElement;
    const lastInput = screen.getByLabelText('Фамилия') as HTMLInputElement;
    expect(firstInput.value).toBe('Иван');
    expect(lastInput.value).toBe('Петров');

    fireEvent.change(firstInput, { target: { value: ' Пётр ' } });
    fireEvent.change(lastInput, { target: { value: ' Сидоров ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(screen.getByText('Изменить имя на «Сидоров Пётр»?')).toBeTruthy();
    expect(
      screen.getByText('Имя изменится и у ученика в его личном кабинете, а также в журналах и экспортах. Выполненные работы сохранятся')
    ).toBeTruthy();
    expect(rpcMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Да, изменить' }));

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith('teacher_rename_student', {
        p_student_id: 'student-1',
        p_first_name: 'Пётр',
        p_last_name: 'Сидоров',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Сидоров Пётр')).toBeTruthy();
    });
    expect(classMemberSingleMock).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('показывает русское сообщение на шаге 2 для ошибок Forbidden и Invalid name', async () => {
    render(<StudentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Петров Иван')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Изменить имя' }));
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Пётр' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    rpcMock.mockResolvedValueOnce({ error: { message: 'Forbidden: not your student' } });
    fireEvent.click(screen.getByRole('button', { name: 'Да, изменить' }));

    await waitFor(() => {
      expect(screen.getByText('Нет прав на изменение имени этого ученика')).toBeTruthy();
    });

    rpcMock.mockResolvedValueOnce({ error: { message: 'Invalid name format' } });
    fireEvent.click(screen.getByRole('button', { name: 'Да, изменить' }));

    await waitFor(() => {
      expect(screen.getByText('Некорректное имя или фамилия')).toBeTruthy();
    });
  });

  it('не вызывает rpc при невалидном имени или фамилии', async () => {
    render(<StudentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Петров Иван')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Изменить имя' }));
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Иван--2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(rpcMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Имя:/)).toBeTruthy();
  });
});

describe('StudentProfilePage (учитель) — фильтрация вкладки «Задания» по audience и assignment_targets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    classMemberSingleMock.mockResolvedValue({
      data: {
        joined_at: '2026-01-10T00:00:00Z',
        profiles: {
          id: 'student-1',
          first_name: 'Иван',
          last_name: 'Петров',
          email: 'ivan@example.com',
          generated_login: null,
          generated_password: null,
        },
      },
    });
    assignmentsOrderMock.mockResolvedValue({ data: [], error: null });
    assignmentTargetsEqMock.mockResolvedValue({ data: [], error: null });
    sessionsOrderIdMock.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    cleanup();
  });

  const makeAssignment = (id: string, title: string, audience: 'class' | 'selected') => ({
    id,
    title,
    is_active: true,
    due_date: null,
    max_attempts: null,
    created_at: '2026-02-01T10:00:00Z',
    assignment_type: 'homework',
    audience,
  });

  it('показывает задание с audience="class" и не делает лишний запрос к assignment_targets', async () => {
    assignmentsOrderMock.mockResolvedValueOnce({
      data: [makeAssignment('a-class', 'Общее задание', 'class')],
      error: null,
    });

    render(<StudentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Общее задание')).toBeTruthy();
    });

    expect(fromMock).not.toHaveBeenCalledWith('assignment_targets');
    expect(sessionsInMock).toHaveBeenCalledWith('assignment_id', ['a-class']);
  });

  it('показывает задание с audience="selected", если для ученика есть строка в assignment_targets', async () => {
    assignmentsOrderMock.mockResolvedValueOnce({
      data: [makeAssignment('a-sel', 'Индивидуальное задание', 'selected')],
      error: null,
    });
    assignmentTargetsEqMock.mockResolvedValueOnce({
      data: [{ assignment_id: 'a-sel' }],
      error: null,
    });

    render(<StudentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Индивидуальное задание')).toBeTruthy();
    });

    expect(assignmentTargetsInMock).toHaveBeenCalledWith('assignment_id', ['a-sel']);
    expect(assignmentTargetsEqMock).toHaveBeenCalledWith('student_id', 'student-1');
    expect(sessionsInMock).toHaveBeenCalledWith('assignment_id', ['a-sel']);
  });

  it('скрывает задание с audience="selected", если для ученика нет строки в assignment_targets', async () => {
    assignmentsOrderMock.mockResolvedValueOnce({
      data: [makeAssignment('a-other', 'Чужое задание', 'selected')],
      error: null,
    });
    assignmentTargetsEqMock.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    render(<StudentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Заданий для этого класса пока нет')).toBeTruthy();
    });

    expect(screen.queryByText('Чужое задание')).toBeNull();
    expect(sessionsInMock).not.toHaveBeenCalled();
  });

  it('в смешанном списке оставляет только задания для класса и выданные этому ученику', async () => {
    assignmentsOrderMock.mockResolvedValueOnce({
      data: [
        makeAssignment('a-class', 'Классное ДЗ', 'class'),
        makeAssignment('a-mine', 'Моё выбранное ДЗ', 'selected'),
        makeAssignment('a-foreign', 'Чужое выбранное ДЗ', 'selected'),
      ],
      error: null,
    });
    assignmentTargetsEqMock.mockResolvedValueOnce({
      data: [{ assignment_id: 'a-mine' }],
      error: null,
    });

    render(<StudentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Классное ДЗ')).toBeTruthy();
      expect(screen.getByText('Моё выбранное ДЗ')).toBeTruthy();
    });

    expect(screen.queryByText('Чужое выбранное ДЗ')).toBeNull();
    expect(assignmentTargetsInMock).toHaveBeenCalledWith('assignment_id', ['a-mine', 'a-foreign']);
    expect(sessionsInMock).toHaveBeenCalledWith('assignment_id', ['a-class', 'a-mine']);
  });

  it('при ошибке загрузки assignment_targets показывает сообщение об ошибке и не показывает список заданий', async () => {
    assignmentsOrderMock.mockResolvedValueOnce({
      data: [
        makeAssignment('a-class', 'Классное ДЗ', 'class'),
        makeAssignment('a-sel', 'Выбранное ДЗ', 'selected'),
      ],
      error: null,
    });
    assignmentTargetsEqMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network error' },
    });

    render(<StudentProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('Не удалось загрузить задания')).toBeTruthy();
    });

    expect(screen.queryByText('Классное ДЗ')).toBeNull();
    expect(screen.queryByText('Выбранное ДЗ')).toBeNull();
    expect(sessionsInMock).not.toHaveBeenCalled();
  });
});

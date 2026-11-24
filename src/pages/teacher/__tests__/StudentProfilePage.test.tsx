import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const { navigateMock, rpcMock, classMemberSingleMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  rpcMock: vi.fn(),
  classMemberSingleMock: vi.fn(),
}));

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
    from: vi.fn((table: string) => {
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
              order: vi.fn().mockResolvedValue({ data: [] }),
            })),
          })),
        };
      }
      return {};
    }),
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';

const { fromMock, navigateMock, useAuthMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  navigateMock: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ assignmentId: 'assign-1' }),
  useNavigate: () => navigateMock,
}));

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: useAuthMock,
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { AssignmentDetailPage } from '../AssignmentDetailPage';

describe('AssignmentDetailPage — фильтрация журнала по assignment_targets и текущему составу класса', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({
      user: { id: 'teacher-1' },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('для audience="selected" оставляет только пересечение assignment_targets и class_members и показывает пометку', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'assignments') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    id: 'assign-1',
                    title: 'Индивидуальная работа',
                    class_id: 'class-1',
                    classes: { name: '9А' },
                    due_date: null,
                    max_attempts: null,
                    is_active: true,
                    audience: 'selected',
                    created_at: '2026-11-20T10:00:00Z',
                    set_config: null,
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'class_members') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  {
                    student_id: 's-1',
                    profiles: { first_name: 'Иван', last_name: 'Иванов', email: null },
                  },
                  {
                    student_id: 's-2',
                    profiles: { first_name: 'Пётр', last_name: 'Петров', email: null },
                  },
                  {
                    student_id: 's-3',
                    profiles: { first_name: 'Анна', last_name: 'Сидорова', email: null },
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === 'assignment_targets') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  { student_id: 's-1' },
                  { student_id: 's-3' },
                  // s-removed уже удалён из class_members
                  { student_id: 's-removed' },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === 'sessions') {
        const orderChain: any = {
          order: () => orderChain,
          then: (resolve: (val: any) => void) =>
            resolve({
              data: [
                {
                  user_id: 's-1',
                  id: 'sess-1',
                  score: 8,
                  max_score: 10,
                  time_spent_seconds: 120,
                  created_at: '2026-11-21T10:00:00Z',
                  status: 'completed',
                },
                {
                  // сессия ученика, удалённого из класса
                  user_id: 's-removed',
                  id: 'sess-removed',
                  score: 10,
                  max_score: 10,
                  time_spent_seconds: 100,
                  created_at: '2026-11-21T10:00:00Z',
                  status: 'completed',
                },
              ],
              error: null,
            }),
        };
        return {
          select: () => ({
            eq: () => orderChain,
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    render(<AssignmentDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Индивидуальная работа')).toBeTruthy();
    });

    expect(screen.getByText('Выдано выбранным ученикам: 2')).toBeTruthy();

    // Иванов сдал, Сидорова не сдала; Петров (не в targets) и s-removed (не в class_members) не в журнале
    expect(screen.getByText('Иванов Иван')).toBeTruthy();
    expect(screen.getByText('Сидорова Анна')).toBeTruthy();
    expect(screen.queryByText('Петров Пётр')).toBeNull();

    // Счётчики: Всего учеников = 2, Сдали = 1, Не сдали = 1
    const totalCard = screen.getByText('Всего учеников').parentElement!;
    const submittedCard = screen.getByText('Сдали').parentElement!;
    const notSubmittedCard = screen.getByText('Не сдали').parentElement!;
    expect(totalCard.textContent).toContain('2');
    expect(submittedCard.textContent).toContain('1');
    expect(notSubmittedCard.textContent).toContain('1');
  });

  it('для audience="class" не запрашивает assignment_targets и показывает всех учеников класса без пометки', async () => {
    const queriedTables: string[] = [];

    fromMock.mockImplementation((table: string) => {
      queriedTables.push(table);
      if (table === 'assignments') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    id: 'assign-1',
                    title: 'Общее задание',
                    class_id: 'class-1',
                    classes: { name: '9А' },
                    due_date: null,
                    max_attempts: null,
                    is_active: true,
                    audience: 'class',
                    created_at: '2026-11-20T10:00:00Z',
                    set_config: null,
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      if (table === 'class_members') {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  {
                    student_id: 's-1',
                    profiles: { first_name: 'Иван', last_name: 'Иванов', email: null },
                  },
                  {
                    student_id: 's-2',
                    profiles: { first_name: 'Пётр', last_name: 'Петров', email: null },
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === 'sessions') {
        const orderChain: any = {
          order: () => orderChain,
          then: (resolve: (val: any) => void) => resolve({ data: [], error: null }),
        };
        return {
          select: () => ({
            eq: () => orderChain,
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    render(<AssignmentDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Общее задание')).toBeTruthy();
    });

    expect(queriedTables).not.toContain('assignment_targets');
    expect(screen.queryByText(/Выдано выбранным ученикам/)).toBeNull();
    expect(screen.getByText('Иванов Иван')).toBeTruthy();
    expect(screen.getByText('Петров Пётр')).toBeTruthy();
  });
});

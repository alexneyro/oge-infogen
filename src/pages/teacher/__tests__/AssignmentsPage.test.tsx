import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

const {
  useAssignmentsMock,
  useClassesMock,
  navigateMock,
  fetchAssignmentsMock,
  toggleAssignmentMock,
  deleteAssignmentMock,
} = vi.hoisted(() => ({
  useAssignmentsMock: vi.fn(),
  useClassesMock: vi.fn(),
  navigateMock: vi.fn(),
  fetchAssignmentsMock: vi.fn(),
  toggleAssignmentMock: vi.fn(),
  deleteAssignmentMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../../../hooks/useAssignments', () => ({
  useAssignments: useAssignmentsMock,
}));

vi.mock('../../../hooks/useClasses', () => ({
  useClasses: useClassesMock,
}));

import { AssignmentsPage } from '../AssignmentsPage';

describe('teacher AssignmentsPage — фильтр по классам', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAssignmentsMock.mockResolvedValue(undefined);
    useClassesMock.mockReturnValue({
      classes: [
        { id: 'c10', name: '10А', invite_code: 'AAA111', created_at: '2026-10-01T10:00:00Z', is_archived: false, members: [] },
        { id: 'c9a', name: '9А', invite_code: 'BBB222', created_at: '2026-10-02T10:00:00Z', is_archived: false, members: [] },
        { id: 'c9b', name: '9Б', invite_code: 'CCC333', created_at: '2026-10-03T10:00:00Z', is_archived: false, members: [] },
      ],
      loading: false,
      error: null,
    });
    useAssignmentsMock.mockReturnValue({
      assignments: [
        {
          id: 'a1',
          class_id: 'c9a',
          class_name: '9А',
          title: 'ДЗ по графам',
          variant_seed: null,
          set_config: null,
          due_date: null,
          max_attempts: null,
          hide_review: false,
          assignment_type: 'homework',
          created_at: '2026-11-10T10:00:00Z',
          is_active: true,
        },
      ],
      loading: false,
      error: null,
      fetchAssignments: fetchAssignmentsMock,
      toggleAssignment: toggleAssignmentMock,
      deleteAssignment: deleteAssignmentMock,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('при 3 классах и заданиях только у одного показывает в select «Все классы» и все 3 класса', () => {
    render(<AssignmentsPage />);

    const selects = screen.getAllByRole('combobox');
    const classSelect = selects[0] as HTMLSelectElement;
    const optionTexts = Array.from(classSelect.options).map((o) => o.text);

    expect(optionTexts).toEqual(['Все классы', '9А', '9Б', '10А']);
    expect(screen.getByText('ДЗ по графам')).toBeTruthy();
  });

  it('выбор класса без заданий показывает «Вы пока не выдавали задания этому классу»', () => {
    render(<AssignmentsPage />);

    const classSelect = screen.getAllByRole('combobox')[0] as HTMLSelectElement;
    fireEvent.change(classSelect, { target: { value: 'c10' } });

    expect(classSelect.value).toBe('c10');
    expect(screen.queryByText('ДЗ по графам')).toBeNull();
    expect(screen.getByText('Вы пока не выдавали задания этому классу')).toBeTruthy();
  });

  it('при 60 заданиях видно 50 и кнопка «Показать ещё», после клика видно 60 и кнопка исчезла', () => {
    const manyAssignments = Array.from({ length: 60 }, (_, idx) => ({
      id: `a-${idx + 1}`,
      class_id: 'c9a',
      class_name: '9А',
      title: `Задание #${idx + 1}`,
      variant_seed: null,
      set_config: null,
      due_date: null,
      max_attempts: null,
      hide_review: false,
      assignment_type: 'homework' as const,
      created_at: '2026-11-10T10:00:00Z',
      is_active: true,
    }));

    useAssignmentsMock.mockReturnValue({
      assignments: manyAssignments,
      loading: false,
      error: null,
      fetchAssignments: fetchAssignmentsMock,
      toggleAssignment: toggleAssignmentMock,
      deleteAssignment: deleteAssignmentMock,
    });

    render(<AssignmentsPage />);

    expect(screen.getByText('Задание #1')).toBeTruthy();
    expect(screen.getByText('Задание #50')).toBeTruthy();
    expect(screen.queryByText('Задание #51')).toBeNull();
    expect(screen.getByText('Показано 50 из 60')).toBeTruthy();

    const showMoreBtn = screen.getByRole('button', { name: 'Показать ещё' });
    fireEvent.click(showMoreBtn);

    expect(screen.getByText('Задание #60')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Показать ещё' })).toBeNull();
    expect(screen.queryByText(/Показано 60 из 60/)).toBeNull();
  });

  it('смена фильтра сбрасывает счётчик на 50', () => {
    const manyAssignments = Array.from({ length: 60 }, (_, idx) => ({
      id: `a-${idx + 1}`,
      class_id: 'c9a',
      class_name: '9А',
      title: `Задание #${idx + 1}`,
      variant_seed: null,
      set_config: null,
      due_date: null,
      max_attempts: null,
      hide_review: false,
      assignment_type: 'homework' as const,
      created_at: '2026-11-10T10:00:00Z',
      is_active: true,
    }));

    useAssignmentsMock.mockReturnValue({
      assignments: manyAssignments,
      loading: false,
      error: null,
      fetchAssignments: fetchAssignmentsMock,
      toggleAssignment: toggleAssignmentMock,
      deleteAssignment: deleteAssignmentMock,
    });

    render(<AssignmentsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Показать ещё' }));
    expect(screen.getByText('Задание #60')).toBeTruthy();

    // Смена фильтра по типу (на «Домашние») сбрасывает счётчик на 50
    fireEvent.click(screen.getByRole('button', { name: 'Домашние' }));

    expect(screen.getByText('Задание #50')).toBeTruthy();
    expect(screen.queryByText('Задание #51')).toBeNull();
    expect(screen.getByText('Показано 50 из 60')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Показать ещё' })).toBeTruthy();
  });
});

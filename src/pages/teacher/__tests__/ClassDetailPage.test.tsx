import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { useState } from 'react';

const { useClassesMock, navigateMock } = vi.hoisted(() => ({
  useClassesMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ classId: 'class-1' }),
  useNavigate: () => navigateMock,
}));

vi.mock('../../../hooks/useClasses', () => ({
  useClasses: useClassesMock,
}));

vi.mock('../../../hooks/useAssignments', () => ({
  useAssignments: () => ({
    assignments: [],
    fetchAssignments: vi.fn(),
    toggleAssignment: vi.fn(),
    deleteAssignment: vi.fn(),
  }),
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../../components/ClassAnalytics', () => ({
  ClassAnalytics: () => <div data-testid="class-analytics" />,
}));

vi.mock('../../../components/teacher/ClassExportModal', () => ({
  ClassExportModal: () => null,
}));

import { ClassDetailPage } from '../ClassDetailPage';

describe('ClassDetailPage — кнопка «Переименовать» и обновление названия', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('кнопка «Переименовать» открывает окно, а после сохранения название класса сразу обновляется без перезагрузки', async () => {
    const renameClassSpy = vi.fn();

    const Wrapper = () => {
      const [classes, setClasses] = useState([
        {
          id: 'class-1',
          name: '9А Информатика',
          invite_code: 'ABC123',
          created_at: '2026-01-01T00:00:00Z',
          is_archived: false,
          members: [],
        },
      ]);

      useClassesMock.mockReturnValue({
        classes,
        loading: false,
        addStudentWithoutEmail: vi.fn(),
        fetchClasses: vi.fn(),
        removeStudent: vi.fn(),
        deleteClass: vi.fn(),
        renameClass: async (id: string, newName: string) => {
          renameClassSpy(id, newName);
          setClasses((prev) =>
            prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
          );
          return { error: null };
        },
      });

      return <ClassDetailPage />;
    };

    render(<Wrapper />);

    expect(screen.getByText('9А Информатика')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Переименовать' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Переименовать класс')).toBeTruthy();
    expect(screen.getByText('Код приглашения и состав класса не изменятся')).toBeTruthy();

    const input = screen.getByLabelText('Название класса') as HTMLInputElement;
    expect(input.value).toBe('9А Информатика');

    fireEvent.change(input, { target: { value: '10Б Профиль' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    expect(renameClassSpy).toHaveBeenCalledWith('class-1', '10Б Профиль');
    expect(screen.getByText('10Б Профиль')).toBeTruthy();
    expect(screen.queryByText('9А Информатика')).toBeNull();
  });
});

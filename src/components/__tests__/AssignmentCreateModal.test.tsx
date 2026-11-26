import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { AssignmentCreateModal, type AssignmentCreateModalProps } from '../AssignmentCreateModal';
import type { ClassWithMembers } from '../../hooks/useClasses';

const makeMember = (id: string, firstName: string, lastName: string) => ({
  student_id: id,
  joined_at: '2026-10-01T10:00:00Z',
  profiles: {
    first_name: firstName,
    last_name: lastName,
    email: `${id}@example.com`,
    role: 'student',
    generated_login: null,
    generated_password: null,
  },
});

const classesFixture: ClassWithMembers[] = [
  {
    id: 'c-9a',
    name: '9А',
    invite_code: 'AAA111',
    created_at: '2026-10-01T10:00:00Z',
    is_archived: false,
    members: [
      makeMember('s-petrov', 'Пётр', 'Петров'),
      makeMember('s-ivanov', 'Иван', 'Иванов'),
      makeMember('s-sidorova', 'Анна', 'Сидорова'),
    ],
  },
  {
    id: 'c-10b',
    name: '10Б',
    invite_code: 'BBB222',
    created_at: '2026-10-02T10:00:00Z',
    is_archived: false,
    members: [
      makeMember('s-orlov', 'Олег', 'Орлов'),
      makeMember('s-belova', 'Мария', 'Белова'),
    ],
  },
  {
    id: 'c-empty',
    name: '11В',
    invite_code: 'CCC333',
    created_at: '2026-10-03T10:00:00Z',
    is_archived: false,
    members: [],
  },
];

describe('AssignmentCreateModal — выбор получателей («Кому»)', () => {
  let onSubmitMock: ReturnType<typeof vi.fn<AssignmentCreateModalProps['onSubmit']>>;
  let onCloseMock: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    vi.clearAllMocks();
    onSubmitMock = vi.fn<AssignmentCreateModalProps['onSubmit']>().mockResolvedValue(undefined);
    onCloseMock = vi.fn<() => void>();
  });

  afterEach(() => {
    cleanup();
  });

  it('по умолчанию выбраны все ученики («Весь класс») и передаётся пустой studentIds', async () => {
    render(
      <AssignmentCreateModal
        isOpen={true}
        onClose={onCloseMock}
        defaultTitle="Тренировочный набор"
        variantSeed="SEED1"
        setConfig={{}}
        classes={classesFixture}
        onSubmit={onSubmitMock}
      />
    );

    expect(screen.getByRole('button', { name: /Весь класс/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Выдать ДЗ' }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });

    expect(onSubmitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        classId: 'c-9a',
        studentIds: [],
      })
    );
  });

  it('снятие одного ученика обновляет счётчик и передаёт массив id без него; ученики отсортированы по фамилии', async () => {
    render(
      <AssignmentCreateModal
        isOpen={true}
        onClose={onCloseMock}
        defaultTitle="ДЗ 1"
        variantSeed="SEED1"
        setConfig={{}}
        classes={classesFixture}
        onSubmit={onSubmitMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Весь класс/i }));

    // Порядок: Иванов Иван, Петров Пётр, Сидорова Анна
    const studentLabels = ['Иванов Иван', 'Петров Пётр', 'Сидорова Анна'].map((name) =>
      screen.getByText(name)
    );
    expect(
      studentLabels[0].compareDocumentPosition(studentLabels[1]) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      studentLabels[1].compareDocumentPosition(studentLabels[2]) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    const petrovCheckbox = screen.getByLabelText('Петров Пётр') as HTMLInputElement;
    fireEvent.click(petrovCheckbox);
    expect(petrovCheckbox.checked).toBe(false);

    expect(screen.getByRole('button', { name: /Выбрано 2 из 3/i })).toBeTruthy();
    expect(screen.getAllByText('Выбрано 2 из 3')).toHaveLength(2);

    const allCheckbox = screen.getByLabelText('Все') as HTMLInputElement;
    expect(allCheckbox.checked).toBe(false);
    expect(allCheckbox.indeterminate).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Выдать ДЗ' }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });

    expect(onSubmitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        classId: 'c-9a',
        studentIds: ['s-ivanov', 's-sidorova'],
      })
    );
  });

  it('чекбокс «Все» снимает и ставит выбор со всех; когда никого не выбрано, кнопка блокируется и видна подсказка', () => {
    render(
      <AssignmentCreateModal
        isOpen={true}
        onClose={onCloseMock}
        defaultTitle="ДЗ 1"
        variantSeed="SEED1"
        setConfig={{}}
        classes={classesFixture}
        onSubmit={onSubmitMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Весь класс/i }));

    const allCheckbox = screen.getByLabelText('Все') as HTMLInputElement;
    expect(allCheckbox.checked).toBe(true);

    // Снимаем со всех
    fireEvent.click(allCheckbox);
    expect(allCheckbox.checked).toBe(false);
    expect((screen.getByLabelText('Иванов Иван') as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText('Петров Пётр') as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText('Сидорова Анна') as HTMLInputElement).checked).toBe(false);

    expect(screen.getByText('Выберите хотя бы одного ученика')).toBeTruthy();
    const submitBtn = screen.getByRole('button', { name: 'Выдать ДЗ' }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    // Ставим обратно всем
    fireEvent.click(allCheckbox);
    expect(allCheckbox.checked).toBe(true);
    expect((screen.getByLabelText('Иванов Иван') as HTMLInputElement).checked).toBe(true);
    expect(submitBtn.disabled).toBe(false);
    expect(screen.queryByText('Выберите хотя бы одного ученика')).toBeNull();
  });

  it('поиск фильтрует список по фамилии и имени', () => {
    render(
      <AssignmentCreateModal
        isOpen={true}
        onClose={onCloseMock}
        defaultTitle="ДЗ 1"
        variantSeed="SEED1"
        setConfig={{}}
        classes={classesFixture}
        onSubmit={onSubmitMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Весь класс/i }));

    const searchInput = screen.getByPlaceholderText('Поиск по фамилии или имени');
    fireEvent.change(searchInput, { target: { value: 'анна' } });

    expect(screen.getByText('Сидорова Анна')).toBeTruthy();
    expect(screen.queryByText('Иванов Иван')).toBeNull();
    expect(screen.queryByText('Петров Пётр')).toBeNull();

    fireEvent.change(searchInput, { target: { value: 'несуществующий' } });
    expect(screen.getByText('Ученики не найдены')).toBeTruthy();
  });

  it('смена класса сбрасывает выбор на всех учеников нового класса, а в пустом классе поле «Кому» скрыто', async () => {
    render(
      <AssignmentCreateModal
        isOpen={true}
        onClose={onCloseMock}
        defaultTitle="ДЗ 1"
        variantSeed="SEED1"
        setConfig={{}}
        classes={classesFixture}
        onSubmit={onSubmitMock}
      />
    );

    // Снимаем одного ученика в 9А
    fireEvent.click(screen.getByRole('button', { name: /Весь класс/i }));
    fireEvent.click(screen.getByLabelText('Петров Пётр'));
    expect(screen.getByRole('button', { name: /Выбрано 2 из 3/i })).toBeTruthy();

    // Переключаем класс на 10Б -> выбор сбрасывается на «Весь класс» (2 из 2)
    const classSelect = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(classSelect, { target: { value: 'c-10b' } });

    expect(screen.getByRole('button', { name: /Весь класс/i })).toBeTruthy();
    expect(screen.getByText('Белова Мария')).toBeTruthy();
    expect(screen.getByText('Орлов Олег')).toBeTruthy();
    expect((screen.getByLabelText('Белова Мария') as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText('Орлов Олег') as HTMLInputElement).checked).toBe(true);

    // Переключаем класс на пустой 11В -> поле «Кому» не показывается
    fireEvent.change(classSelect, { target: { value: 'c-empty' } });
    expect(screen.queryByText('Кому')).toBeNull();
    expect(screen.queryByRole('button', { name: /Весь класс/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Выдать ДЗ' }));
    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          classId: 'c-empty',
          studentIds: [],
        })
      );
    });
  });
});

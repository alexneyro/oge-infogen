import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { RenameNameModal } from '../RenameNameModal';

describe('RenameNameModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    initialFirstName: 'Иван',
    initialLastName: 'Петров',
    confirmText: 'Предупреждение для проверки',
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onSubmit.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    cleanup();
  });

  it('показывает ошибку валидации и не переходит на шаг 2 при невалидном имени', () => {
    render(<RenameNameModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Иван123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(screen.getByText(/Имя: Допустимы только буквы, пробел и дефис/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Да, изменить' })).toBeNull();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('показывает «Имя не изменилось», если значения не изменились', () => {
    render(<RenameNameModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: '  Иван  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(screen.getByText('Имя не изменилось')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Да, изменить' })).toBeNull();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('переходит на шаг 2 и сохраняет введённые значения при нажатии «Назад»', () => {
    render(<RenameNameModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: '  Артём  ' } });
    fireEvent.change(screen.getByLabelText('Фамилия'), { target: { value: '  Соколов-Белов ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));

    expect(screen.getByText('Изменить имя на «Соколов-Белов Артём»?')).toBeTruthy();
    expect(screen.getByText('Предупреждение для проверки')).toBeTruthy();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));

    expect((screen.getByLabelText('Имя') as HTMLInputElement).value).toBe('Артём');
    expect((screen.getByLabelText('Фамилия') as HTMLInputElement).value).toBe('Соколов-Белов');
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('блокирует кнопки и закрытие пока onSubmit выполняется, затем закрывает модал при успехе', async () => {
    let resolveSubmit!: (val: { ok: boolean; error?: string }) => void;
    const pendingPromise = new Promise<{ ok: boolean; error?: string }>((resolve) => {
      resolveSubmit = resolve;
    });
    defaultProps.onSubmit.mockReturnValueOnce(pendingPromise);

    render(<RenameNameModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Пётр' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Да, изменить' }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('Пётр', 'Петров');

    const submitBtn = screen.getByRole('button', { name: 'Сохранение...' }) as HTMLButtonElement;
    const backBtn = screen.getByRole('button', { name: 'Назад' }) as HTMLButtonElement;
    const closeBtn = screen.getByRole('button', { name: 'Закрыть' }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    expect(backBtn.disabled).toBe(true);
    expect(closeBtn.disabled).toBe(true);

    // Попытки закрыть через Esc и фон во время загрузки игнорируются
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('rename-modal-backdrop'));
    expect(defaultProps.onClose).not.toHaveBeenCalled();

    resolveSubmit({ ok: true });

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('остаётся на шаге 2 и показывает ошибку при { ok: false, error }', async () => {
    defaultProps.onSubmit.mockResolvedValueOnce({ ok: false, error: 'Ошибка сервера' });

    render(<RenameNameModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Пётр' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Да, изменить' }));

    await waitFor(() => {
      expect(screen.getByText('Ошибка сервера')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Да, изменить' })).toBeTruthy();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('сбрасывает состояние при повторном открытии и закрывается по Esc и клику на фон', () => {
    const { rerender } = render(<RenameNameModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Пётр' } });
    fireEvent.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByText('Изменить имя на «Петров Пётр»?')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    rerender(<RenameNameModal {...defaultProps} isOpen={false} />);
    rerender(
      <RenameNameModal
        {...defaultProps}
        isOpen={true}
        initialFirstName="Сергей"
        initialLastName="Волков"
      />
    );

    expect((screen.getByLabelText('Имя') as HTMLInputElement).value).toBe('Сергей');
    expect((screen.getByLabelText('Фамилия') as HTMLInputElement).value).toBe('Волков');
    expect(screen.queryByRole('button', { name: 'Да, изменить' })).toBeNull();

    fireEvent.click(screen.getByTestId('rename-modal-backdrop'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});

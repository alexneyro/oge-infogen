import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { RenameClassModal } from '../RenameClassModal';

describe('RenameClassModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    initialName: '9А Информатика',
    onSubmit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onSubmit.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    cleanup();
  });

  it('показывает подсказку и валидирует пустое, слишком длинное и неизменившееся название', () => {
    render(<RenameClassModal {...defaultProps} />);

    expect(screen.getByText('Код приглашения и состав класса не изменятся')).toBeTruthy();

    const input = screen.getByLabelText('Название класса') as HTMLInputElement;
    expect(input.value).toBe('9А Информатика');

    // Не изменилось (с пробелами по краям)
    fireEvent.change(input, { target: { value: '  9А Информатика  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(screen.getByText('Название не изменилось')).toBeTruthy();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();

    // Пустое / пробелы
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(screen.getByText('Название класса не может быть пустым')).toBeTruthy();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();

    // Длиннее 40 символов
    fireEvent.change(input, { target: { value: 'А'.repeat(41) } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(screen.getByText('Название класса должно быть не длиннее 40 символов')).toBeTruthy();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('блокирует форму и закрытие на время запроса, затем закрывает модал при успехе', async () => {
    let resolveSubmit!: (val: { ok: boolean; error?: string }) => void;
    const pendingPromise = new Promise<{ ok: boolean; error?: string }>((resolve) => {
      resolveSubmit = resolve;
    });
    defaultProps.onSubmit.mockReturnValueOnce(pendingPromise);

    render(<RenameClassModal {...defaultProps} />);

    const input = screen.getByLabelText('Название класса') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  10А Профиль  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('10А Профиль');

    const submitBtn = screen.getByRole('button', { name: 'Сохранение...' }) as HTMLButtonElement;
    const cancelBtn = screen.getByRole('button', { name: 'Отмена' }) as HTMLButtonElement;
    const closeBtn = screen.getByRole('button', { name: 'Закрыть' }) as HTMLButtonElement;
    expect(input.disabled).toBe(true);
    expect(submitBtn.disabled).toBe(true);
    expect(cancelBtn.disabled).toBe(true);
    expect(closeBtn.disabled).toBe(true);

    // Esc и клик по фону игнорируются во время запроса
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByTestId('rename-class-modal-backdrop'));
    expect(defaultProps.onClose).not.toHaveBeenCalled();

    resolveSubmit({ ok: true });

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('остаётся открытым и показывает ошибку при { ok: false, error }', async () => {
    defaultProps.onSubmit.mockResolvedValueOnce({
      ok: false,
      error: 'Класс с таким названием уже существует',
    });

    render(<RenameClassModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Название класса'), { target: { value: '10Б' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(screen.getByText('Класс с таким названием уже существует')).toBeTruthy();
    });
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('сбрасывает состояние при повторном открытии и закрывается по Esc и клику на фон', () => {
    const { rerender } = render(<RenameClassModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText('Название класса'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(screen.getByText('Название класса не может быть пустым')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);

    rerender(<RenameClassModal {...defaultProps} isOpen={false} />);
    rerender(
      <RenameClassModal
        {...defaultProps}
        isOpen={true}
        initialName="11В"
      />
    );

    expect((screen.getByLabelText('Название класса') as HTMLInputElement).value).toBe('11В');
    expect(screen.queryByText('Название класса не может быть пустым')).toBeNull();

    fireEvent.click(screen.getByTestId('rename-class-modal-backdrop'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(2);
  });
});

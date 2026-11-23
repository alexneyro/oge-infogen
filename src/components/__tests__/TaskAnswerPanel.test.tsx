import { describe, it, expect } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskAnswerPanel, toggleChartFlag14 } from '../TaskAnswerPanel';
import { task1 } from '../../tasks/task1';
import { task14 } from '../../tasks/task14';
import { task15 } from '../../tasks/task15';
import { OGE_TASKS } from '../../tasks';
import { TaskModule } from '../../types';
import { makeRng } from '../../utils/rng';

function TestWrapper(props: {
  initialAnswer?: string;
  mode?: 'check' | 'save';
  correctAnswer?: string;
}) {
  const taskData = task1.generate(2, makeRng(12345));
  const [userAnswer, setUserAnswer] = useState(
    props.initialAnswer ?? (props.correctAnswer ? (taskData as any).correctAnswer : '999')
  );

  return (
    <TaskAnswerPanel
      position={1}
      taskId={1}
      difficulty={2}
      taskData={taskData}
      userAnswer={userAnswer}
      onAnswerChange={setUserAnswer}
      mode={props.mode ?? 'check'}
    />
  );
}

function TestWrapper15(props: {
  initialAnswer?: string;
  mode?: 'check' | 'save';
}) {
  const taskData = task15.generate(2, makeRng(12345));
  const [userAnswer, setUserAnswer] = useState(
    props.initialAnswer ?? 'использовать Робот\nалг\nнач\nвправо\nкон'
  );

  return (
    <TaskAnswerPanel
      position={15}
      taskId={15}
      difficulty={2}
      taskData={taskData}
      userAnswer={userAnswer}
      onAnswerChange={setUserAnswer}
      mode={props.mode ?? 'check'}
    />
  );
}

function TestWrapper14(props: {
  initialAnswer?: string;
  mode?: 'check' | 'save';
  onAnswerChange?: (ans: string) => void;
}) {
  const taskData = task14.generate(2, makeRng(12345));
  // Две верные цифры в ответе (ans1|ans2|flag)
  const defaultAnswer = `${taskData.answers[0]}|${taskData.answers[1]}|0`;
  const [userAnswer, setUserAnswer] = useState(props.initialAnswer ?? defaultAnswer);

  return (
    <TaskAnswerPanel
      position={14}
      taskId={14}
      difficulty={2}
      taskData={taskData}
      userAnswer={userAnswer}
      onAnswerChange={(ans) => {
        setUserAnswer(ans);
        props.onAnswerChange?.(ans);
      }}
      mode={props.mode ?? 'check'}
    />
  );
}

const MOCK_TASK_ID = 999;
const mockTaskModule: TaskModule = {
  id: MOCK_TASK_ID,
  title: 'Mock Task Module',
  description: 'Mock Task Description',
  topics: [],
  maxPoints: 1,
  generate: () => ({ test: true }),
  check: () => true,
  render: (_taskData: any, state: any) => (
    <div data-testid="mock-task-container">
      <span data-testid="flag-showHints">{String(state.showHints)}</span>
      <span data-testid="flag-isSubmitted">{String(state.isSubmitted)}</span>
    </div>
  ),
};

function TestWrapperMock(props: { mode?: 'check' | 'save' }) {
  const [userAnswer, setUserAnswer] = useState('any');
  return (
    <TaskAnswerPanel
      position={1}
      taskId={MOCK_TASK_ID}
      difficulty={1}
      taskData={{ test: true }}
      userAnswer={userAnswer}
      onAnswerChange={setUserAnswer}
      mode={props.mode ?? 'check'}
    />
  );
}

describe('TaskAnswerPanel component', () => {
  it('после клика «Проверить» вердикт виден, а разметки разбора нет', () => {
    render(<TestWrapper initialAnswer="123" mode="check" />);

    const checkBtn = screen.getByRole('button', { name: /проверить/i });
    expect(checkBtn).toBeDefined();

    // Разбор не должен быть виден до проверки
    expect(screen.queryByText(/подробное решение/i)).toBeNull();

    fireEvent.click(checkBtn);

    // Вердикт виден
    expect(screen.getByText(/неверно|верно/i)).toBeDefined();

    // Разметки разбора всё ещё нет (он свёрнут)
    expect(screen.queryByText(/подробное решение/i)).toBeNull();

    // Кнопка стала «Показать разбор»
    expect(screen.getByRole('button', { name: /показать разбор/i })).toBeDefined();
  });

  it('после клика «Показать разбор» разбор появляется, повторный клик скрывает', () => {
    render(<TestWrapper initialAnswer="123" mode="check" />);

    // Нажимаем «Проверить»
    fireEvent.click(screen.getByRole('button', { name: /проверить/i }));

    const toggleBtn = screen.getByRole('button', { name: /показать разбор/i });
    expect(toggleBtn).toBeDefined();

    // Кликаем «Показать разбор»
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/подробное решение/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /свернуть разбор/i })).toBeDefined();

    // Повторный клик скрывает разбор
    fireEvent.click(screen.getByRole('button', { name: /свернуть разбор/i }));
    expect(screen.queryByText(/подробное решение/i)).toBeNull();
    expect(screen.getByRole('button', { name: /показать разбор/i })).toBeDefined();
  });

  it('после клика «Проверить» поле задания 1 disabled, остаётся disabled при открытии разбора, и ссылки «Изменить ответ» нет', () => {
    render(<TestWrapper initialAnswer="123" mode="check" />);

    const input = screen.getByPlaceholderText(/введите/i);
    const fieldset = input.closest('fieldset');
    expect(fieldset?.disabled).toBe(false);

    // Нажимаем «Проверить»
    fireEvent.click(screen.getByRole('button', { name: /проверить/i }));
    expect(screen.getByText(/неверно|верно/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /показать разбор/i })).toBeDefined();

    // Поле ввода теперь заблокировано
    expect(fieldset?.disabled).toBe(true);
    expect(input.closest('fieldset')?.disabled).toBe(true);
    expect(screen.queryByText(/изменить ответ/i)).toBeNull();

    // Открываем разбор
    fireEvent.click(screen.getByRole('button', { name: /показать разбор/i }));
    expect(screen.getByText(/подробное решение/i)).toBeDefined();

    // Поле ввода по-прежнему заблокировано
    expect(fieldset?.disabled).toBe(true);
    expect(input.closest('fieldset')?.disabled).toBe(true);
    expect(screen.queryByText(/изменить ответ/i)).toBeNull();
  });

  it('в mode="save" нет ни вердикта, ни тумблера разбора', () => {
    render(<TestWrapper initialAnswer="123" mode="save" />);

    // Кнопка сохранения видна
    const saveBtn = screen.getByRole('button', { name: /сохранить ответ/i });
    expect(saveBtn).toBeDefined();

    // Нет кнопки «Проверить» и тумблера разбора
    expect(screen.queryByRole('button', { name: /^проверить$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /показать разбор/i })).toBeNull();
    expect(screen.queryByText(/подробное решение/i)).toBeNull();

    // Кликаем «Сохранить ответ»
    fireEvent.click(saveBtn);

    // Появляется плашка «Ответ сохранён», но нет вердикта (баллов/верно/неверно) и нет разбора
    expect(screen.getByText(/ответ сохранён/i)).toBeDefined();
    expect(screen.queryByText(/неверно/i)).toBeNull();
    expect(screen.queryByText(/верно \(/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /показать разбор/i })).toBeNull();
    expect(screen.queryByText(/подробное решение/i)).toBeNull();
  });

  it('для задания 15: после «Проверить» ввод блокируется, остаётся заблокированным при открытии разбора', () => {
    render(<TestWrapper15 mode="check" />);

    const textarea = screen.getByPlaceholderText(/использовать Робот/i) as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(false);

    // Нажимаем «Проверить»
    fireEvent.click(screen.getByRole('button', { name: /проверить/i }));

    // Вердикт отображается
    expect(screen.getByText(/из 2 баллов/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /показать разбор/i })).toBeDefined();

    // Поле ввода заблокировано (через fieldset)
    expect(textarea.closest('fieldset')?.disabled).toBe(true);
    expect(screen.queryByText(/изменить ответ/i)).toBeNull();

    // Открываем разбор
    fireEvent.click(screen.getByRole('button', { name: /показать разбор/i }));
    expect(screen.getByText(/разбор задачи и пример решения/i)).toBeDefined();

    // Поле ввода по-прежнему заблокировано (через state.isSubmitted на самом textarea)
    expect(textarea.disabled).toBe(true);
    expect(screen.queryByText(/изменить ответ/i)).toBeNull();
  });

  it('модуль получает showHints: false независимо от состояния разбора (через мок-модуль, который пишет полученные флаги в разметку)', () => {
    OGE_TASKS.push(mockTaskModule);
    try {
      render(<TestWrapperMock mode="check" />);

      // До нажатия «Проверить»
      expect(screen.getByTestId('flag-showHints').textContent).toBe('false');
      expect(screen.getByTestId('flag-isSubmitted').textContent).toBe('false');

      // Нажимаем «Проверить»
      fireEvent.click(screen.getByRole('button', { name: /проверить/i }));
      expect(screen.getByTestId('flag-showHints').textContent).toBe('false');
      expect(screen.getByTestId('flag-isSubmitted').textContent).toBe('false');

      // Открываем разбор
      fireEvent.click(screen.getByRole('button', { name: /показать разбор/i }));
      expect(screen.getByTestId('flag-showHints').textContent).toBe('false');
      expect(screen.getByTestId('flag-isSubmitted').textContent).toBe('true');

      // Закрываем разбор
      fireEvent.click(screen.getByRole('button', { name: /свернуть разбор/i }));
      expect(screen.getByTestId('flag-showHints').textContent).toBe('false');
      expect(screen.getByTestId('flag-isSubmitted').textContent).toBe('false');
    } finally {
      const idx = OGE_TASKS.findIndex((t) => t.id === MOCK_TASK_ID);
      if (idx !== -1) OGE_TASKS.splice(idx, 1);
    }
  });

  it('задание 14: до «Проверить» чекбокса нет; после «Проверить» с двумя верными числами вердикт 2 из 3; после клика по чекбоксу вердикт становится 3 из 3, а кнопка НЕ вернулась в «Проверить»; повторный клик возвращает 2 из 3', () => {
    render(<TestWrapper14 mode="check" />);

    // До «Проверить» чекбокса нет
    expect(screen.queryByRole('checkbox', { name: /моя диаграмма совпадает с эталонной/i })).toBeNull();
    const checkBtn = screen.getByRole('button', { name: /^проверить$/i });
    expect(checkBtn).toBeDefined();

    // Нажимаем «Проверить» с двумя верными числами
    fireEvent.click(checkBtn);

    // Вердикт 2 из 3 баллов
    expect(screen.getByText(/2 из 3/i)).toBeDefined();

    // Чекбокс самопроверки диаграммы появился и не отмечен
    const checkbox = screen.getByRole('checkbox', { name: /моя диаграмма совпадает с эталонной/i }) as HTMLInputElement;
    expect(checkbox).toBeDefined();
    expect(checkbox.checked).toBe(false);

    // Кликаем по чекбоксу — вердикт становится 3 из 3, а кнопка НЕ вернулась в «Проверить»
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
    expect(screen.getByText(/3 из 3/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /^проверить$/i })).toBeNull();
    expect(screen.getByRole('button', { name: /показать разбор/i })).toBeDefined();

    // Повторный клик возвращает 2 из 3, кнопка по-прежнему не вернулась в «Проверить»
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
    expect(screen.getByText(/2 из 3/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /^проверить$/i })).toBeNull();
    expect(screen.getByRole('button', { name: /показать разбор/i })).toBeDefined();
  });

  it('задание 14 в mode="save": чекбокса нет ни до, ни после сохранения', () => {
    render(<TestWrapper14 mode="save" />);

    // До сохранения чекбокса нет
    expect(screen.queryByRole('checkbox', { name: /моя диаграмма совпадает с эталонной/i })).toBeNull();

    // Нажимаем «Сохранить ответ»
    fireEvent.click(screen.getByRole('button', { name: /сохранить ответ/i }));

    // Ответ сохранён, но чекбокса нет
    expect(screen.getByText(/ответ сохранён/i)).toBeDefined();
    expect(screen.queryByRole('checkbox', { name: /моя диаграмма совпадает с эталонной/i })).toBeNull();
  });

  it('сохраняет вердикт и не сбрасывает submitted при монтировании с initialSubmitted=true и initialResult', async () => {
    const taskData = task1.generate(2, makeRng(12345));
    const dummyScore = {
      passed: true,
      score: 1,
      maxScore: 1,
      details: ['Ответ верный'],
    };

    render(
      <TaskAnswerPanel
        position={1}
        taskId={1}
        difficulty={2}
        taskData={taskData}
        userAnswer="42"
        onAnswerChange={() => {}}
        mode="check"
        initialSubmitted={true}
        initialResult={dummyScore}
      />
    );

    // Дожидаемся отработки всех эффектов первого рендера
    await waitFor(() => {
      // Вердикт ВСЁ ЕЩЁ в DOM
      expect(screen.getByText(/Верно \(1 балл\)/)).toBeTruthy();
      // Кнопка «Показать разбор» на месте, а не вернулась в «Проверить»
      expect(screen.getByRole('button', { name: /показать разбор/i })).toBeTruthy();
      expect(screen.queryByRole('button', { name: /^проверить$/i })).toBeNull();
    });
  });

  describe('краевые случаи handleToggleChart14 / toggleChartFlag14', () => {
    it('userAnswer === "5|7" (без третьего сегмента) -> после первого клика "5|7|1", а не "5|7|0|1"; повторный клик возвращает "5|7|0"', () => {
      const step1 = toggleChartFlag14('5|7');
      expect(step1).toBe('5|7|1');
      expect(step1).not.toBe('5|7|0|1');

      const step2 = toggleChartFlag14(step1);
      expect(step2).toBe('5|7|0');
    });

    it('userAnswer === "" или пробелы -> результат пустая строка "", а не "||1"', () => {
      expect(toggleChartFlag14('')).toBe('');
      expect(toggleChartFlag14('')).not.toBe('||1');
      expect(toggleChartFlag14('   ')).toBe('');
      expect(toggleChartFlag14('  ')).toBe('');
    });

    it('входы "5", "5|", "|7", "  ": ни в одном случае не появляется "undefined" и сегментов ровно 3 (кроме пустых)', () => {
      // Вход "5": одно поле заполнено, второго нет
      const res5 = toggleChartFlag14('5');
      expect(res5).toBe('5||1');
      expect(res5.includes('undefined')).toBe(false);
      expect(res5.split('|').length).toBe(3);

      // Повторный клик для "5" -> "5||0"
      const res5_toggle = toggleChartFlag14(res5);
      expect(res5_toggle).toBe('5||0');
      expect(res5_toggle.includes('undefined')).toBe(false);
      expect(res5_toggle.split('|').length).toBe(3);

      // Вход "5|": первое поле заполнено, разделитель есть, второго нет
      const res5Pipe = toggleChartFlag14('5|');
      expect(res5Pipe).toBe('5||1');
      expect(res5Pipe.includes('undefined')).toBe(false);
      expect(res5Pipe.split('|').length).toBe(3);

      // Вход "|7": первое поле пустое, второе заполнено
      const resPipe7 = toggleChartFlag14('|7');
      expect(resPipe7).toBe('|7|1');
      expect(resPipe7.includes('undefined')).toBe(false);
      expect(resPipe7.split('|').length).toBe(3);

      // Вход "  ": пробелы возвращают пустую строку без сегментов и без undefined
      const resSpaces = toggleChartFlag14('  ');
      expect(resSpaces).toBe('');
      expect(resSpaces.includes('undefined')).toBe(false);
    });

    it('userAnswer с лишними сегментами "5|7|0|1" нормализуется до ровно 3 сегментов "5|7|1"', () => {
      const normalized = toggleChartFlag14('5|7|0|1');
      expect(normalized).toBe('5|7|1');
      expect(normalized.split('|').length).toBe(3);
    });

    it('в UI TaskAnswerPanel при initialAnswer="5|7": клик по чекбоксу обновляет ответ в "5|7|1", повторный клик в "5|7|0"', () => {
      const answers: string[] = [];
      render(
        <TestWrapper14
          initialAnswer="5|7"
          mode="check"
          onAnswerChange={(ans) => answers.push(ans)}
        />
      );

      // Нажимаем «Проверить»
      const checkBtn = screen.getByRole('button', { name: /^проверить$/i });
      fireEvent.click(checkBtn);

      // Чекбокс появился
      const checkbox = screen.getByRole('checkbox', { name: /моя диаграмма совпадает с эталонной/i }) as HTMLInputElement;
      expect(checkbox).toBeDefined();
      expect(checkbox.checked).toBe(false);

      // Первый клик по чекбоксу
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
      expect(answers[answers.length - 1]).toBe('5|7|1');
      expect(answers[answers.length - 1]).not.toBe('5|7|0|1');

      // Повторный клик по чекбоксу
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
      expect(answers[answers.length - 1]).toBe('5|7|0');
    });

    it('в UI TaskAnswerPanel при initialAnswer="": кнопка «Проверить» заблокирована, чекбокс не отображается, ответ не становится "||1"', () => {
      const answers: string[] = [];
      render(
        <TestWrapper14
          initialAnswer=""
          mode="check"
          onAnswerChange={(ans) => answers.push(ans)}
        />
      );

      const checkBtn = screen.getByRole('button', { name: /^проверить$/i }) as HTMLButtonElement;
      expect(checkBtn.disabled).toBe(true);
      expect(screen.queryByRole('checkbox', { name: /моя диаграмма совпадает с эталонной/i })).toBeNull();
      expect(answers).toEqual([]);
    });
  });
});

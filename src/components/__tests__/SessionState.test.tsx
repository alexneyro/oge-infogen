import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SetBuilderView, SET_STORAGE_KEY, loadSavedSetState, plural } from '../SetBuilderView';
import { VariantView, VARIANT_STORAGE_KEY, loadSavedVariantState } from '../VariantView';
import { encodeSetShort, decodeSetShort, buildSet, fileCode } from '../../set';
import * as setModule from '../../set';
import { encodeVariant } from '../../variant';
import * as scoringModule from '../../utils/scoring';

const VARIANT_STORAGE_VERSION = 1;
const LEGACY_STORAGE_VERSION = 1;

describe('Session Storage Persistence & Restoration Suite', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('SetBuilderView state persistence', () => {
    it('restores built set, user answers, panel states and exam mode from sessionStorage', () => {
      const validConfig = {
        seed: '54321',
        title: 'Тестовый набор 9Б',
        slots: [
          { taskId: 1, n1: 1, n2: 0, n3: 0, nR: 0 },
          { taskId: 2, n1: 0, n2: 1, n3: 0, nR: 0 },
        ],
      };
      const code = encodeSetShort(validConfig);
      const savedState = {
        version: 2,
        builtCode: code,
        seed: '54321',
        title: 'Тестовый набор 9Б',
        slots: validConfig.slots,
        hasBuilt: true,
        userAnswers: { 1: '42', 2: '108' },
        panelStates: {
          1: { submitted: true, showSolution: false, result: { score: 1, maxScore: 1, passed: true } },
        },
        allowStudentCheck: false, // Exam mode enabled
      };

      sessionStorage.setItem(SET_STORAGE_KEY, JSON.stringify(savedState));

      const loaded = loadSavedSetState();
      expect(loaded).not.toBeNull();
      expect(loaded?.builtCode).toBe(code);
      expect(loaded?.hasBuilt).toBe(true);
      expect(loaded?.userAnswers[1]).toBe('42');
      expect(loaded?.userAnswers[2]).toBe('108');
      expect(loaded?.panelStates[1]?.submitted).toBe(true);
      expect(loaded?.allowStudentCheck).toBe(false);

      const { container } = render(<SetBuilderView />);

      // Verify the title is displayed
      expect(screen.getAllByText(/Тестовый набор 9Б/).length).toBeGreaterThan(0);

      // Verify input answers are present in DOM
      const inputs = container.querySelectorAll('input[type="text"]');
      const inputValues = Array.from(inputs).map((el) => (el as HTMLInputElement).value);
      expect(inputValues).toContain('42');
      expect(inputValues).toContain('108');

      // Verify exam mode switch is checked (since allowStudentCheck is false, !allowStudentCheck is true)
      const examCheckbox = screen.getByRole('checkbox', { name: /Скрыть проверку до завершения/i }) as HTMLInputElement;
      expect(examCheckbox.checked).toBe(true);
    });

    it('silently starts with clean state if sessionStorage contains invalid JSON', () => {
      sessionStorage.setItem(SET_STORAGE_KEY, '{{bad-json-syntax');

      const loaded = loadSavedSetState();
      expect(loaded).toBeNull();

      // Component mounts without throwing any error
      const { container } = render(<SetBuilderView />);
      const titleInput = container.querySelector('#set-title-input') as HTMLInputElement;
      expect(titleInput).not.toBeNull();
      expect(titleInput.value).toBe('');
      expect(titleInput.placeholder).toBe('Набор заданий');
    });

    it('silently starts with clean state if version is unsupported or code is broken', () => {
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 999, // unsupported future version
          builtCode: 'INVALID_CODE',
          hasBuilt: true,
        })
      );

      const loaded = loadSavedSetState();
      expect(loaded).toBeNull();

      expect(() => render(<SetBuilderView />)).not.toThrow();
    });

    it('сессия устаревшей версии (v1) в sessionStorage отбрасывается молча, компонент стартует с дефолтами', () => {
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: LEGACY_STORAGE_VERSION,
          builtCode: 'LEGACY_V1_CODE',
          hasBuilt: true,
        })
      );

      const loaded = loadSavedSetState();
      expect(loaded).toBeNull();

      const { container } = render(<SetBuilderView />);
      const titleInput = container.querySelector('#set-title-input') as HTMLInputElement;
      expect(titleInput).not.toBeNull();
      expect(titleInput.value).toBe('');
      expect(titleInput.placeholder).toBe('Набор заданий');
    });

    it('clears answers and panel states when a new set is generated with a new seed', () => {
      const initialConfig = {
        seed: '11111',
        title: 'Первый набор',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const initialCode = encodeSetShort(initialConfig);

      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: initialCode,
          seed: '11111',
          title: 'Первый набор',
          slots: initialConfig.slots,
          hasBuilt: true,
          userAnswers: { 1: 'старый_ответ' },
          panelStates: { 1: { submitted: true, showSolution: false, result: null } },
          allowStudentCheck: true,
        })
      );

      render(<SetBuilderView />);
      expect(screen.getByDisplayValue('старый_ответ')).toBeTruthy();

      // Click "Собрать набор" (generates a new set with fresh seed)
      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      fireEvent.click(buildButton);

      // Old answer must be cleared
      expect(screen.queryByDisplayValue('старый_ответ')).toBeNull();

      // Updated sessionStorage should have empty userAnswers
      const rawStored = sessionStorage.getItem(SET_STORAGE_KEY);
      expect(rawStored).not.toBeNull();
      const stored = JSON.parse(rawStored!);
      expect(stored.userAnswers).toEqual({});
      expect(stored.panelStates).toEqual({});
    });

    it('отображает ровно 16 строк заданий в таблице', () => {
      render(<SetBuilderView />);
      for (let t = 1; t <= 16; t++) {
        expect(screen.getByLabelText(`Задание ${t} уровень 1`)).toBeTruthy();
        expect(screen.getByLabelText(`Задание ${t} уровень 2`)).toBeTruthy();
        expect(screen.getByLabelText(`Задание ${t} уровень 3`)).toBeTruthy();
        expect(screen.getByLabelText(`Задание ${t} RND`)).toBeTruthy();
      }
    });

    it('в DOM нет input сида и нет кнопок пресетов', () => {
      render(<SetBuilderView />);
      expect(screen.queryByLabelText(/СИД/i)).toBeNull();
      expect(screen.queryByRole('textbox', { name: /СИД/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Сбросить всё/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Все 1–16/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /1–12 Ур/i })).toBeNull();
    });

    it('кнопки в шапке колонок имеют корректные aria-label и понятные подсказки', () => {
      render(<SetBuilderView />);
      const btn16 = screen.getByLabelText('L1: добавить по одному в задания 1–16');
      const btn12 = screen.getByLabelText('L1: добавить по одному в задания 1–12');
      expect(btn16.textContent).toBe('+');
      expect(btn12.textContent).toBe('+');
      expect(btn16.getAttribute('title')).toBe('L1: добавить по одному в задания 1–16');
      expect(btn12.getAttribute('title')).toBe('L1: добавить по одному в задания 1–12');
    });

    it('«+» на L2 в строке 1–12: n2=1 у заданий 1–12, n2=0 у 13–16', () => {
      render(<SetBuilderView />);
      const btn12 = screen.getByLabelText('L2: добавить по одному в задания 1–12');
      fireEvent.click(btn12);

      for (let t = 1; t <= 12; t++) {
        const input = screen.getByLabelText(`Задание ${t} уровень 2`) as HTMLInputElement;
        expect(input.value).toBe('1');
      }
      for (let t = 13; t <= 16; t++) {
        const input = screen.getByLabelText(`Задание ${t} уровень 2`) as HTMLInputElement;
        expect(input.value === '' || input.value === '0').toBe(true);
      }

      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      expect(buildButton).toHaveProperty('disabled', false);
      fireEvent.click(buildButton);

      expect(screen.getByText('12 заданий')).toBeTruthy();
      const raw = sessionStorage.getItem(SET_STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      const decoded = decodeSetShort(parsed.builtCode);
      expect(decoded).not.toBeNull();
      const built = buildSet(decoded!);
      expect(built.entries).toHaveLength(12);
      expect(built.entries.every((e, idx) => e.taskId === idx + 1 && e.difficulty === 2)).toBe(true);
    });

    it('«+» на L2 в строке 1–16 трижды: n2=3 у всех 16', () => {
      render(<SetBuilderView />);
      const plusBtn = screen.getByLabelText('L2: добавить по одному в задания 1–16');
      fireEvent.click(plusBtn);
      fireEvent.click(plusBtn);
      fireEvent.click(plusBtn);

      for (let t = 1; t <= 16; t++) {
        const input = screen.getByLabelText(`Задание ${t} уровень 2`) as HTMLInputElement;
        expect(input.value).toBe('3');
      }
    });

    it('«−» на L2 в строке 1–16 четыре раза после этого: n2=0 у всех, отрицательных нет', () => {
      render(<SetBuilderView />);
      const plusBtn = screen.getByLabelText('L2: добавить по одному в задания 1–16');
      fireEvent.click(plusBtn);
      fireEvent.click(plusBtn);
      fireEvent.click(plusBtn);

      const minusBtn = screen.getByLabelText('L2: убрать по одному в заданиях 1–16');
      fireEvent.click(minusBtn);
      fireEvent.click(minusBtn);
      fireEvent.click(minusBtn);
      fireEvent.click(minusBtn);

      for (let t = 1; t <= 16; t++) {
        const input = screen.getByLabelText(`Задание ${t} уровень 2`) as HTMLInputElement;
        expect(input.value === '' || input.value === '0').toBe(true);
        expect(Number(input.value || 0)).toBeGreaterThanOrEqual(0);
      }
    });

    it('корзина на L2 обнуляет только n2, n1/n3/nR не меняются', () => {
      render(<SetBuilderView />);
      fireEvent.click(screen.getByLabelText('L1: добавить по одному в задания 1–16'));
      fireEvent.click(screen.getByLabelText('L2: добавить по одному в задания 1–16'));
      fireEvent.click(screen.getByLabelText('L3: добавить по одному в задания 1–16'));
      fireEvent.click(screen.getByLabelText('RND: добавить по одному в задания 1–16'));

      fireEvent.click(screen.getByLabelText('L2: очистить колонку'));

      for (let t = 1; t <= 16; t++) {
        const inputL1 = screen.getByLabelText(`Задание ${t} уровень 1`) as HTMLInputElement;
        const inputL2 = screen.getByLabelText(`Задание ${t} уровень 2`) as HTMLInputElement;
        const inputL3 = screen.getByLabelText(`Задание ${t} уровень 3`) as HTMLInputElement;
        const inputRND = screen.getByLabelText(`Задание ${t} RND`) as HTMLInputElement;
        expect(inputL1.value).toBe('1');
        expect(inputL2.value === '' || inputL2.value === '0').toBe(true);
        expect(inputL3.value).toBe('1');
        expect(inputRND.value).toBe('1');
      }
    });

    it('корзина в шапке столбца Всего обнуляет все значения во всей таблице', () => {
      render(<SetBuilderView />);
      fireEvent.click(screen.getByLabelText('L1: добавить по одному в задания 1–16'));
      fireEvent.click(screen.getByLabelText('L2: добавить по одному в задания 1–16'));
      fireEvent.click(screen.getByLabelText('L3: добавить по одному в задания 1–16'));
      fireEvent.click(screen.getByLabelText('RND: добавить по одному в задания 1–16'));

      const clearAllBtn = screen.getByLabelText('Очистить все задания');
      expect(clearAllBtn.getAttribute('title')).toBe('Очистить все задания');
      fireEvent.click(clearAllBtn);

      for (let t = 1; t <= 16; t++) {
        const inputL1 = screen.getByLabelText(`Задание ${t} уровень 1`) as HTMLInputElement;
        const inputL2 = screen.getByLabelText(`Задание ${t} уровень 2`) as HTMLInputElement;
        const inputL3 = screen.getByLabelText(`Задание ${t} уровень 3`) as HTMLInputElement;
        const inputRND = screen.getByLabelText(`Задание ${t} RND`) as HTMLInputElement;
        expect(inputL1.value === '' || inputL1.value === '0').toBe(true);
        expect(inputL2.value === '' || inputL2.value === '0').toBe(true);
        expect(inputL3.value === '' || inputL3.value === '0').toBe(true);
        expect(inputRND.value === '' || inputRND.value === '0').toBe(true);
      }
    });

    it('бейджи уровней сложности присутствуют в шапке и не являются кнопками', () => {
      render(<SetBuilderView />);
      const l1 = screen.getByText('Легче ОГЭ');
      const l2 = screen.getByText('Как на ОГЭ');
      const l3 = screen.getByText('Сложнее ОГЭ');
      const rnd = screen.getByText('Случайно');

      expect(l1).toBeTruthy();
      expect(l2).toBeTruthy();
      expect(l3).toBeTruthy();
      expect(rnd).toBeTruthy();

      expect(l1.closest('button')).toBeNull();
      expect(l2.closest('button')).toBeNull();
      expect(l3.closest('button')).toBeNull();
      expect(rnd.closest('button')).toBeNull();
    });

    it('в DOM нет кнопок с текстом "1–16", "1–12", "Сбросить всё", "Новый набор"', () => {
      render(<SetBuilderView />);
      const allButtons = screen.getAllByRole('button');
      for (const btn of allButtons) {
        const text = btn.textContent?.trim();
        expect(text).not.toBe('1–16');
        expect(text).not.toBe('1–12');
        expect(text).not.toBe('Сбросить всё');
        expect(text).not.toBe('Новый набор');
      }
    });

    it('рендерится 16 строк и 64 инпута', () => {
      const { container } = render(<SetBuilderView />);
      const rows = container.querySelectorAll('tbody tr');
      expect(rows.length).toBe(16);

      const inputs = container.querySelectorAll('tbody input');
      expect(inputs.length).toBe(64);
    });

    it('две сборки подряд без загрузки кода дают РАЗНЫЕ builtCode', () => {
      render(<SetBuilderView />);
      const btn12 = screen.getByLabelText('L1: добавить по одному в задания 1–12');
      fireEvent.click(btn12);

      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      fireEvent.click(buildButton);
      const raw1 = JSON.parse(sessionStorage.getItem(SET_STORAGE_KEY)!);
      const code1 = raw1.builtCode;
      expect(code1).toBeTruthy();

      fireEvent.click(buildButton);
      const raw2 = JSON.parse(sessionStorage.getItem(SET_STORAGE_KEY)!);
      const code2 = raw2.builtCode;
      expect(code2).toBeTruthy();
      expect(code1).not.toBe(code2);
    });

    it('загрузка кода → сборка без изменений даёт ТОТ ЖЕ builtCode', () => {
      render(<SetBuilderView />);
      const codeInput = screen.getByLabelText(/Поле ввода кода набора для загрузки/i) as HTMLInputElement;
      const testCode = 'S2-ABC1234-1NP2-000100010001000100010001000100010001000100010001';
      fireEvent.change(codeInput, { target: { value: testCode } });

      const loadBtn = screen.getByRole('button', { name: /Загрузить из кода/i });
      fireEvent.click(loadBtn);

      const raw1 = JSON.parse(sessionStorage.getItem(SET_STORAGE_KEY)!);
      const code1 = raw1.builtCode;
      expect(code1).toBe(testCode);

      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      fireEvent.click(buildButton);

      const raw2 = JSON.parse(sessionStorage.getItem(SET_STORAGE_KEY)!);
      const code2 = raw2.builtCode;
      expect(code2).toBe(testCode);
      expect(code1).toBe(code2);
    });

    it('после сборки isConfigDirty === false, кнопки экспорта не disabled', () => {
      render(<SetBuilderView />);
      const btn12 = screen.getByLabelText('L2: добавить по одному в задания 1–12');
      fireEvent.click(btn12);

      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      fireEvent.click(buildButton);

      const printButtons = screen.getAllByRole('button', { name: /Печать/i });
      expect(printButtons.length).toBeGreaterThan(0);
      expect(printButtons[0]).toHaveProperty('disabled', false);
      expect(screen.queryByText(/Конфигурация набора изменилась/i)).toBeNull();
    });

    it('после сборки поле "ЗАГРУЗИТЬ ПО КОДУ" пустое', () => {
      render(<SetBuilderView />);
      const codeInput = screen.getByLabelText(/Поле ввода кода набора для загрузки/i) as HTMLInputElement;
      const testCode = 'S2-ABC1234-1NP2-000100010001000100010001000100010001000100010001';
      fireEvent.change(codeInput, { target: { value: testCode } });
      expect(codeInput.value).toBe(testCode);

      const loadBtn = screen.getByRole('button', { name: /Загрузить из кода/i });
      fireEvent.click(loadBtn);

      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      fireEvent.click(buildButton);

      expect(codeInput.value).toBe('');
    });

    it('при N=641 кнопка сборки disabled, при N=640 активна', () => {
      render(<SetBuilderView />);
      // 16 tasks with 20 in L1 and 20 in L2 = 16 * 40 = 640 tasks
      for (let i = 1; i <= 16; i++) {
        const l1 = screen.getByLabelText(`Задание ${i} уровень 1`) as HTMLInputElement;
        const l2 = screen.getByLabelText(`Задание ${i} уровень 2`) as HTMLInputElement;
        fireEvent.change(l1, { target: { value: '20' } });
        fireEvent.change(l2, { target: { value: '20' } });
      }

      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      expect(buildButton).toHaveProperty('disabled', false);
      expect(screen.queryByText(/Слишком много/i)).toBeNull();

      // Add 1 more in L3 of Task 1 -> 641 tasks
      const l3Task1 = screen.getByLabelText('Задание 1 уровень 3') as HTMLInputElement;
      fireEvent.change(l3Task1, { target: { value: '1' } });

      expect(buildButton).toHaveProperty('disabled', true);
      expect(screen.getByText('Слишком много: 641 из 640 максимум')).toBeTruthy();

      // Change back to 0 -> 640 tasks, active again
      fireEvent.change(l3Task1, { target: { value: '0' } });
      expect(buildButton).toHaveProperty('disabled', false);
      expect(screen.queryByText(/Слишком много/i)).toBeNull();
    });

    it('при N=200 виден текст с оценкой времени, при N=100 не виден', () => {
      render(<SetBuilderView />);

      // Set 10 tasks with 10 each in L1 -> 100 tasks
      for (let i = 1; i <= 10; i++) {
        const l1 = screen.getByLabelText(`Задание ${i} уровень 1`) as HTMLInputElement;
        fireEvent.change(l1, { target: { value: '10' } });
      }
      expect(screen.queryByText(/сборка архива займёт/i)).toBeNull();

      // Set 10 tasks with 20 each in L1 -> 200 tasks (200 >= 160)
      for (let i = 1; i <= 10; i++) {
        const l1 = screen.getByLabelText(`Задание ${i} уровень 1`) as HTMLInputElement;
        fireEvent.change(l1, { target: { value: '20' } });
      }
      // S = Math.ceil(200 * 0.035)
      expect(screen.getByText(`200 заданий — сборка архива займёт ~${Math.ceil(200 * 0.035)} сек`)).toBeTruthy();
    });

    it('сборка с пустым названием даёт непустое имя файла блокнота', () => {
      render(<SetBuilderView />);
      const titleInput = screen.getByLabelText(/НАЗВАНИЕ/i) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: '   ' } });

      const btn12 = screen.getByLabelText('L1: добавить по одному в задания 1–12');
      fireEvent.click(btn12);

      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      fireEvent.click(buildButton);

      expect(screen.getAllByText('Набор заданий').length).toBeGreaterThan(0);
      const raw = sessionStorage.getItem(SET_STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      const decoded = decodeSetShort(parsed.builtCode);
      expect(decoded).not.toBeNull();
      const safeTitle = (decoded!.title.trim() || 'Набор заданий').replace(/[/\\:*?"<>|]/g, '_').trim() || 'Набор';
      const fCode = fileCode(decoded!);
      const filename = `${safeTitle}_${fCode}.zip`;
      expect(filename).toContain('Набор заданий_');
      expect(filename).not.toContain('undefined');
      expect(filename).not.toContain('null');
    });

    it('plural: 1/3/5/33 дают «задание/задания/заданий/задания»', () => {
      expect(plural(1, 'задание', 'задания', 'заданий')).toBe('задание');
      expect(plural(3, 'задание', 'задания', 'заданий')).toBe('задания');
      expect(plural(5, 'задание', 'задания', 'заданий')).toBe('заданий');
      expect(plural(33, 'задание', 'задания', 'заданий')).toBe('задания');
    });

    it('если encodeSetShort бросает, набор не собирается и виден codeError', () => {
      const spy = vi.spyOn(setModule, 'encodeSetShort').mockImplementation(() => {
        throw new Error('Encoding error');
      });
      try {
        render(<SetBuilderView />);
        const btn12 = screen.getByLabelText('L1: добавить по одному в задания 1–12');
        fireEvent.click(btn12);

        const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
        fireEvent.click(buildButton);

        expect(screen.getByText('Не удалось закодировать набор')).toBeTruthy();
        expect(screen.queryByText(/Завершить/i)).toBeNull();
        expect(screen.getByTitle('Сначала соберите набор')).toBeTruthy();
      } finally {
        spy.mockRestore();
      }
    });

    it('ввод 20 в L2 задания 3 и сборка дают ровно 20 позиций задания 3 уровня 2', () => {
      render(<SetBuilderView />);
      const inputL2Task3 = screen.getByLabelText('Задание 3 уровень 2') as HTMLInputElement;
      fireEvent.change(inputL2Task3, { target: { value: '20' } });

      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      fireEvent.click(buildButton);

      expect(screen.getByText('20 заданий')).toBeTruthy();
      expect(screen.getAllByText(/Задание 3/i).length).toBeGreaterThanOrEqual(20);

      const raw = sessionStorage.getItem(SET_STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.slots[2]).toEqual({ taskId: 3, n1: 0, n2: 20, n3: 0, nR: 0 });
      const decoded = decodeSetShort(parsed.builtCode);
      expect(decoded).not.toBeNull();
      const built = buildSet(decoded!);
      expect(built.entries).toHaveLength(20);
      expect(built.entries.every((e) => e.taskId === 3 && e.difficulty === 2)).toBe(true);
    });

    it('ввод «25» клампится до 20, ввод «-5» до 0', () => {
      render(<SetBuilderView />);
      const input = screen.getByLabelText('Задание 3 уровень 2') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '25' } });
      expect(input.value).toBe('20');

      fireEvent.change(input, { target: { value: '-5' } });
      expect(input.value === '' || input.value === '0').toBe(true);
      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      expect(buildButton).toHaveProperty('disabled', true);
    });

    it('RND=3 у задания 5 даёт 3 позиции, все уровни в диапазоне 1..3', () => {
      render(<SetBuilderView />);
      const inputRndTask5 = screen.getByLabelText('Задание 5 RND') as HTMLInputElement;
      fireEvent.change(inputRndTask5, { target: { value: '3' } });

      const buildButton = screen.getByRole('button', { name: /Собрать набор/i });
      fireEvent.click(buildButton);

      expect(screen.getByText('3 задания')).toBeTruthy();
      expect(screen.getAllByText(/Задание 5/i).length).toBeGreaterThanOrEqual(3);

      const raw = sessionStorage.getItem(SET_STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.slots[4]).toEqual({ taskId: 5, n1: 0, n2: 0, n3: 0, nR: 3 });
      const decoded = decodeSetShort(parsed.builtCode);
      expect(decoded).not.toBeNull();
      const built = buildSet(decoded!);
      expect(built.entries).toHaveLength(3);
      expect(
        built.entries.every((e) => e.taskId === 5 && e.difficulty >= 1 && e.difficulty <= 3)
      ).toBe(true);
    });
  });

  describe('VariantView state persistence', () => {
    it('restores variant tasks, user answers, and submission status from sessionStorage', () => {
      const variantConfig = {
        seed: 'OGE-TEST1',
        difficulties: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as any,
        contentVersion: 2,
      };
      const code = encodeVariant(variantConfig);
      const savedVariant = {
        version: VARIANT_STORAGE_VERSION,
        code,
        taskStates: {
          0: { userAnswer: '35', showHints: false },
          1: { userAnswer: '0101', showHints: true },
        },
        isSubmitted: false,
        showConfigPanel: false,
      };

      sessionStorage.setItem(VARIANT_STORAGE_KEY, JSON.stringify(savedVariant));

      const loaded = loadSavedVariantState();
      expect(loaded).not.toBeNull();
      expect(loaded?.code).toBe(code);
      expect(loaded?.taskStates[0].userAnswer).toBe('35');
      expect(loaded?.taskStates[1].userAnswer).toBe('0101');

      const mockVariantInfoChange = () => {};
      render(<VariantView onVariantInfoChange={mockVariantInfoChange} />);

      // Restores user answers into input fields
      expect(screen.getByDisplayValue('35')).toBeTruthy();
      expect(screen.getByDisplayValue('0101')).toBeTruthy();
    });

    it('silently falls back to clean state on corrupted JSON in VariantView', () => {
      sessionStorage.setItem(VARIANT_STORAGE_KEY, 'corrupted{json');

      const loaded = loadSavedVariantState();
      expect(loaded).toBeNull();

      const mockVariantInfoChange = () => {};
      expect(() => render(<VariantView onVariantInfoChange={mockVariantInfoChange} />)).not.toThrow();
    });

    it('clears answers when generating a new variant', () => {
      const variantConfig = {
        seed: 'OGE-OLD',
        difficulties: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as any,
        contentVersion: 2,
      };
      const code = encodeVariant(variantConfig);
      sessionStorage.setItem(
        VARIANT_STORAGE_KEY,
        JSON.stringify({
          version: VARIANT_STORAGE_VERSION,
          code,
          taskStates: { 0: { userAnswer: 'старый_ответ_вар', showHints: false } },
          isSubmitted: false,
          showConfigPanel: true,
        })
      );

      const mockVariantInfoChange = () => {};
      render(<VariantView onVariantInfoChange={mockVariantInfoChange} />);
      expect(screen.getByDisplayValue('старый_ответ_вар')).toBeTruthy();

      // Click "Сгенерировать вариант"
      const generateBtn = screen.getByRole('button', { name: /Сгенерировать вариант/i });
      fireEvent.click(generateBtn);

      // Old answer must be cleared
      expect(screen.queryByDisplayValue('старый_ответ_вар')).toBeNull();
    });

    it('persists and restores timeRemaining in VariantView session state', () => {
      const variantConfig = {
        seed: 'OGE-TIMER1',
        difficulties: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as any,
        contentVersion: 2,
      };
      const code = encodeVariant(variantConfig);
      sessionStorage.setItem(
        VARIANT_STORAGE_KEY,
        JSON.stringify({
          version: VARIANT_STORAGE_VERSION,
          code,
          taskStates: {},
          isSubmitted: false,
          showConfigPanel: false,
          timeRemaining: 4500,
        })
      );

      const loaded = loadSavedVariantState();
      expect(loaded?.timeRemaining).toBe(4500);

      const mockVariantInfoChange = () => {};
      render(<VariantView onVariantInfoChange={mockVariantInfoChange} />);

      // Banner should display formatted time for 4500 seconds (1:15:00)
      expect(screen.getByText('1:15:00')).toBeTruthy();
    });

    it('gracefully provides default timeRemaining when loading legacy state without timer field', () => {
      const variantConfig = {
        seed: 'OGE-LEGACY',
        difficulties: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as any,
        contentVersion: 2,
      };
      const code = encodeVariant(variantConfig);
      sessionStorage.setItem(
        VARIANT_STORAGE_KEY,
        JSON.stringify({
          version: VARIANT_STORAGE_VERSION,
          code,
          taskStates: {},
          isSubmitted: false,
        })
      );

      const loaded = loadSavedVariantState();
      expect(loaded).not.toBeNull();
      expect(loaded?.timeRemaining).toBe(9000); // EXAM_DURATION_SECONDS
      expect(loaded?.isPaused).toBe(false);
    });

    it('persists and restores isPaused state, keeping paused state on reload', () => {
      const variantConfig = {
        seed: 'OGE-PAUSE1',
        difficulties: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as any,
        contentVersion: 2,
      };
      const code = encodeVariant(variantConfig);
      sessionStorage.setItem(
        VARIANT_STORAGE_KEY,
        JSON.stringify({
          version: VARIANT_STORAGE_VERSION,
          code,
          taskStates: {},
          isSubmitted: false,
          timeRemaining: 3600,
          isPaused: true,
        })
      );

      const loaded = loadSavedVariantState();
      expect(loaded?.isPaused).toBe(true);
      expect(loaded?.timeRemaining).toBe(3600);

      const mockVariantInfoChange = () => {};
      render(<VariantView onVariantInfoChange={mockVariantInfoChange} />);

      // Pause button should have label/title "Продолжить" because it is paused
      expect(screen.getByTitle('Продолжить')).toBeTruthy();
      expect(screen.getByText('1:00:00')).toBeTruthy();
    });

    it('applies inert attribute to task container and shows updated text when variant is paused', () => {
      const variantConfig = {
        seed: 'OGE-PAUSE-INERT',
        difficulties: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as any,
        contentVersion: 2,
      };
      const code = encodeVariant(variantConfig);
      sessionStorage.setItem(
        VARIANT_STORAGE_KEY,
        JSON.stringify({
          version: VARIANT_STORAGE_VERSION,
          code,
          taskStates: {},
          isSubmitted: false,
          timeRemaining: 3600,
          isPaused: true,
        })
      );
      render(<VariantView onVariantInfoChange={() => {}} />);
      const inertContainers = document.querySelectorAll('div[inert]');
      expect(inertContainers.length).toBeGreaterThan(0);
      expect(screen.getByText(/Задания скрыты до продолжения/i)).toBeTruthy();
    });

    it('renders pause card with sticky centering classes when isPaused is true, unpauses on click, and hides when isPaused is false', () => {
      const variantConfig = {
        seed: 'OGE-PAUSE-CARD',
        difficulties: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as any,
        contentVersion: 2,
      };
      const code = encodeVariant(variantConfig);
      sessionStorage.setItem(
        VARIANT_STORAGE_KEY,
        JSON.stringify({
          version: VARIANT_STORAGE_VERSION,
          code,
          taskStates: {},
          isSubmitted: false,
          timeRemaining: 3600,
          isPaused: true,
        })
      );
      render(<VariantView onVariantInfoChange={() => {}} />);

      // при isPaused=true карточка паузы есть в DOM
      const title = screen.getByText('Вариант поставлен на паузу');
      expect(title).toBeTruthy();

      const card = title.closest('div.bg-amber-50') as HTMLElement;
      expect(card).toBeTruthy();
      expect(card.classList.contains('pointer-events-auto')).toBe(true);

      const outerLayer = card.closest('div.sticky') as HTMLElement;
      expect(outerLayer).toBeTruthy();
      expect(outerLayer.classList.contains('fixed')).toBe(false);
      expect(outerLayer.classList.contains('sticky')).toBe(true);
      expect(outerLayer.classList.contains('pointer-events-none')).toBe(true);
      expect(outerLayer.classList.contains('h-0')).toBe(true);
      expect(outerLayer.style.top).toContain('max(0px');
      expect(outerLayer.className).not.toMatch(/-mb-/);
      expect(card.classList.contains('pointer-events-auto')).toBe(true);

      // блок заданий при isPaused=true имеет inert и классы blur-md pointer-events-none
      const tasksContainer = document.querySelector('#variant-tasks-container');
      expect(tasksContainer).toBeTruthy();
      const taskBlock = tasksContainer?.querySelector('.blur-md') as HTMLElement;
      expect(taskBlock).toBeTruthy();
      expect(taskBlock.hasAttribute('inert') || taskBlock.getAttribute('inert') !== null).toBe(true);
      expect(taskBlock.classList.contains('blur-md')).toBe(true);
      expect(taskBlock.classList.contains('pointer-events-none')).toBe(true);

      // клик по кнопке внутри вызывает снятие паузы
      const resumeBtn = screen.getByRole('button', { name: /Продолжить выполнение/i });
      fireEvent.click(resumeBtn);

      // при isPaused=false карточки в DOM нет
      expect(screen.queryByText('Вариант поставлен на паузу')).toBeNull();
    });

    it('triggers auto-submit exactly once when countdown timer reaches 0', () => {
      vi.useFakeTimers();
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      const variantConfig = {
        seed: 'OGE-AUTOFINISH',
        difficulties: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] as any,
        contentVersion: 2,
      };
      const code = encodeVariant(variantConfig);
      sessionStorage.setItem(
        VARIANT_STORAGE_KEY,
        JSON.stringify({
          version: VARIANT_STORAGE_VERSION,
          code,
          taskStates: {},
          isSubmitted: false,
          timeRemaining: 2,
          isPaused: false,
        })
      );

      const mockVariantInfoChange = vi.fn();
      render(<VariantView onVariantInfoChange={mockVariantInfoChange} />);

      // At start, not submitted yet
      expect(scrollToSpy).not.toHaveBeenCalled();

      // Advance by 1 second -> timeRemaining becomes 1
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(scrollToSpy).not.toHaveBeenCalled();

      // Advance by 1 second -> timeRemaining becomes 0 -> auto-submit triggers
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(scrollToSpy).toHaveBeenCalledTimes(1);

      // Advance further by multiple seconds -> ensures auto-finish is called strictly once
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(scrollToSpy).toHaveBeenCalledTimes(1);

      // Results summary and finished badge are displayed
      expect(screen.getByText(/Итоговая сводка результатов варианта/i)).toBeTruthy();

      // SessionBanner is not rendered when isSubmitted is true
      expect(document.querySelector('#session-banner')).toBeNull();

      scrollToSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('SetBuilderView stopwatch & completion flow', () => {
    it('stopwatch increases by 1 per 1000ms tick when active', () => {
      vi.useFakeTimers();
      const validConfig = {
        seed: '12345',
        title: 'Тестовый секундомер',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(validConfig);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '12345',
          title: 'Тестовый секундомер',
          slots: validConfig.slots,
          hasBuilt: true,
          userAnswers: {},
          panelStates: {},
          allowStudentCheck: true,
          elapsedSeconds: 0,
          isPaused: false,
          isFinished: false,
        })
      );

      render(<SetBuilderView />);

      const banner = document.querySelector('#session-banner');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain('00:00');

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(banner?.textContent).toContain('00:01');

      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(banner?.textContent).toContain('00:06');

      vi.useRealTimers();
    });

    it('tick does not increase value when isPaused is true', () => {
      vi.useFakeTimers();
      const validConfig = {
        seed: '12345',
        title: 'Пауза в наборе',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(validConfig);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '12345',
          title: 'Пауза в наборе',
          slots: validConfig.slots,
          hasBuilt: true,
          userAnswers: {},
          panelStates: {},
          allowStudentCheck: true,
          elapsedSeconds: 15,
          isPaused: true,
          isFinished: false,
        })
      );

      render(<SetBuilderView />);

      const banner = document.querySelector('#session-banner');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain('00:15');

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(banner?.textContent).toContain('00:15');

      vi.useRealTimers();
    });

    it('persists and restores elapsedSeconds and isPaused from sessionStorage', () => {
      const validConfig = {
        seed: '99887',
        title: 'Сохранённый секундомер',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(validConfig);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '99887',
          title: 'Сохранённый секундомер',
          slots: validConfig.slots,
          hasBuilt: true,
          userAnswers: {},
          panelStates: {},
          allowStudentCheck: true,
          elapsedSeconds: 75,
          isPaused: true,
          isFinished: false,
        })
      );

      const loaded = loadSavedSetState();
      expect(loaded?.elapsedSeconds).toBe(75);
      expect(loaded?.isPaused).toBe(true);
      expect(loaded?.isFinished).toBe(false);

      render(<SetBuilderView />);
      const banner = document.querySelector('#session-banner');
      expect(banner?.textContent).toContain('01:15');
      expect(screen.getByTitle('Продолжить')).toBeTruthy();
    });

    it('mounts without error when sessionStorage contains legacy JSON without new timer fields', () => {
      const validConfig = {
        seed: '55555',
        title: 'Старый JSON набора',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(validConfig);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '55555',
          title: 'Старый JSON набора',
          slots: validConfig.slots,
          hasBuilt: true,
          userAnswers: {},
          panelStates: {},
          allowStudentCheck: true,
        })
      );

      const loaded = loadSavedSetState();
      expect(loaded).not.toBeNull();
      expect(loaded?.elapsedSeconds).toBe(0);
      expect(loaded?.isPaused).toBe(false);
      expect(loaded?.isFinished).toBe(false);

      expect(() => render(<SetBuilderView />)).not.toThrow();
      const banner = document.querySelector('#session-banner');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain('00:00');
    });

    it('after finish banner is absent from DOM and answer fields are locked', () => {
      const validConfig = {
        seed: '77777',
        title: 'Завершённый набор',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(validConfig);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '77777',
          title: 'Завершённый набор',
          slots: validConfig.slots,
          hasBuilt: true,
          userAnswers: { 1: '42' },
          panelStates: { 1: { submitted: true, showSolution: false, result: { score: 1, maxScore: 1, passed: true } } },
          allowStudentCheck: true,
          elapsedSeconds: 120,
          isPaused: false,
          isFinished: true,
        })
      );

      const { container } = render(<SetBuilderView />);

      // Banner is absent from DOM
      expect(document.querySelector('#session-banner')).toBeNull();

      // "Завершён" badge is present
      expect(screen.getByText('Завершён')).toBeTruthy();

      // Task fieldset is disabled
      const fieldset = container.querySelector('fieldset');
      expect(fieldset).not.toBeNull();
      expect(fieldset?.disabled).toBe(true);
      const input = fieldset?.querySelector('input');
      expect(input).not.toBeNull();
      expect(input?.value).toBe('42');

      // "Показать разбор" button is present and solution is collapsed by default
      expect(screen.getByText(/Показать разбор/i)).toBeTruthy();
      expect(screen.queryByText(/Свернуть разбор/i)).toBeNull();
    });

    it('new build resets elapsedSeconds to 0 and clears finished status', () => {
      const validConfig = {
        seed: '88888',
        title: 'Сброс таймера',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(validConfig);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '88888',
          title: 'Сброс таймера',
          slots: validConfig.slots,
          hasBuilt: true,
          userAnswers: { 1: '10' },
          panelStates: {},
          allowStudentCheck: true,
          elapsedSeconds: 300,
          isPaused: true,
          isFinished: true,
        })
      );

      render(<SetBuilderView />);

      // Initially finished -> no banner
      expect(document.querySelector('#session-banner')).toBeNull();

      // Click "Собрать набор" button
      const buildButtons = screen.getAllByRole('button', { name: /Собрать набор/i });
      fireEvent.click(buildButtons[0]);

      // Banner reappears with 00:00
      const banner = document.querySelector('#session-banner');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain('00:00');
    });

    it('resets summary in DOM, isFinished, userAnswers, and elapsedSeconds on rebuilding the same set after completion', () => {
      const validConfig = {
        seed: '12345',
        title: 'Тест сброса при пересборке',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(validConfig);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '12345',
          title: 'Тест сброса при пересборке',
          slots: validConfig.slots,
          hasBuilt: true,
          userAnswers: { 1: 'тестовый_ответ' },
          panelStates: {
            1: { submitted: true, showSolution: false, result: null },
          },
          allowStudentCheck: true,
          elapsedSeconds: 120,
          isPaused: false,
          isFinished: true,
        })
      );

      render(<SetBuilderView />);

      // Сводка присутствует до повторной сборки
      expect(document.querySelector('#set-summary-block')).not.toBeNull();
      expect(screen.getByDisplayValue('тестовый_ответ')).toBeTruthy();

      // Нажимаем «Собрать набор» (тот же состав, тот же seed)
      const buildBtn = screen.getAllByRole('button', { name: /Собрать набор/i })[0];
      fireEvent.click(buildBtn);

      // Сводки нет в DOM
      expect(document.querySelector('#set-summary-block')).toBeNull();

      // Ответы пустые (проверяем значение input в DOM, а не только state)
      expect(screen.queryByDisplayValue('тестовый_ответ')).toBeNull();
      const entryEl = document.querySelector('#set-entry-1');
      const inputEl = entryEl?.querySelector('input[type="text"]') as HTMLInputElement;
      expect(inputEl).not.toBeNull();
      expect(inputEl.value).toBe('');

      // Секундомер сброшен на 00:00
      const banner = document.querySelector('#session-banner');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain('00:00');

      // Состояние в sessionStorage сброшено
      const saved = loadSavedSetState();
      expect(saved?.isFinished).toBe(false);
      expect(saved?.userAnswers).toEqual({});
      expect(saved?.panelStates).toEqual({});
      expect(saved?.elapsedSeconds).toBe(0);
    });

    it('resets summary in DOM, isFinished, userAnswers, and elapsedSeconds on loading the same set code after completion', () => {
      const validConfig = {
        seed: '12345',
        title: 'Тест сброса при загрузке по коду',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(validConfig);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '12345',
          title: 'Тест сброса при загрузке по коду',
          slots: validConfig.slots,
          hasBuilt: true,
          userAnswers: { 1: 'ответ_для_кода' },
          panelStates: {
            1: { submitted: true, showSolution: false, result: null },
          },
          allowStudentCheck: true,
          elapsedSeconds: 200,
          isPaused: false,
          isFinished: true,
        })
      );

      render(<SetBuilderView />);

      // Сводка присутствует до загрузки по коду
      expect(document.querySelector('#set-summary-block')).not.toBeNull();
      expect(screen.getByDisplayValue('ответ_для_кода')).toBeTruthy();

      // Вводим код в поле «ЗАГРУЗИТЬ ПО КОДУ» и нажимаем «Загрузить»
      const codeInput = screen.getByLabelText(/Поле ввода кода набора для загрузки/i) as HTMLInputElement;
      fireEvent.change(codeInput, { target: { value: code } });
      const loadBtn = screen.getByTitle('Загрузить из кода');
      fireEvent.click(loadBtn);

      // Сводки нет в DOM
      expect(document.querySelector('#set-summary-block')).toBeNull();

      // Ответы пустые (проверяем значение input в DOM, а не только state)
      expect(screen.queryByDisplayValue('ответ_для_кода')).toBeNull();
      const entryEl = document.querySelector('#set-entry-1');
      const inputEl = entryEl?.querySelector('input[type="text"]') as HTMLInputElement;
      expect(inputEl).not.toBeNull();
      expect(inputEl.value).toBe('');

      // Секундомер сброшен на 00:00
      const banner = document.querySelector('#session-banner');
      expect(banner).not.toBeNull();
      expect(banner?.textContent).toContain('00:00');

      // Состояние в sessionStorage сброшено
      const saved = loadSavedSetState();
      expect(saved?.isFinished).toBe(false);
      expect(saved?.userAnswers).toEqual({});
      expect(saved?.panelStates).toEqual({});
      expect(saved?.elapsedSeconds).toBe(0);
    });

    it('does not invoke scorePosition on user input changes before isFinished is true', () => {
      const scoreSpy = vi.spyOn(scoringModule, 'scorePosition');
      const validConfig = {
        seed: '12345',
        title: 'Тест без вызова скоринга',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(validConfig);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '12345',
          title: 'Тест без вызова скоринга',
          slots: validConfig.slots,
          hasBuilt: true,
          userAnswers: {},
          panelStates: {},
          allowStudentCheck: false,
          elapsedSeconds: 10,
          isPaused: false,
          isFinished: false,
        })
      );

      render(<SetBuilderView />);
      scoreSpy.mockClear();

      const input = screen.getAllByPlaceholderText(/Введите (число|слово)/i)[0];
      fireEvent.change(input, { target: { value: 'новый_ответ' } });

      // scorePosition must NOT have been called because isFinished is false
      expect(scoreSpy).not.toHaveBeenCalled();
      scoreSpy.mockRestore();
    });

    it('confirmFinish recalculates score using current answer without fixing stale result', () => {
      const validConfig = {
        seed: '12345',
        title: 'Тест пересчёта',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(validConfig);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '12345',
          title: 'Тест пересчёта',
          slots: validConfig.slots,
          hasBuilt: true,
          userAnswers: { 1: '999999_wrong' },
          panelStates: {
            1: {
              submitted: true,
              showSolution: false,
              result: { score: 1, maxScore: 1, isCorrect: true },
            },
          },
          allowStudentCheck: true,
          elapsedSeconds: 50,
          isPaused: false,
          isFinished: false,
        })
      );

      render(<SetBuilderView />);

      // Banner finish button
      const finishBtn = screen.getAllByRole('button', { name: /Завершить/i })[0];
      fireEvent.click(finishBtn);

      // Verify the state saved to sessionStorage has score 0, not stale score 1
      const saved = JSON.parse(sessionStorage.getItem(SET_STORAGE_KEY) || '{}');
      expect(saved.isFinished).toBe(true);
      expect(saved.panelStates[1].result.score).toBe(0);
      expect(saved.panelStates[1].result.passed).toBe(false);
    });

    it('сводка отсутствует до завершения и появляется после', () => {
      const config = {
        seed: '11111',
        title: 'Набор тест 1',
        slots: [
          { taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 },
          { taskId: 2, n1: 0, n2: 1, n3: 0, nR: 0 },
        ],
      };
      const code = encodeSetShort(config);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '11111',
          title: 'Набор тест 1',
          slots: config.slots,
          hasBuilt: true,
          userAnswers: {},
          panelStates: {},
          allowStudentCheck: true,
          elapsedSeconds: 35,
          isPaused: false,
          isFinished: false,
        })
      );
      render(<SetBuilderView />);

      // Сводка отсутствует до завершения
      expect(document.querySelector('#set-summary-block')).toBeNull();

      // Нажимаем «Завершить»
      const finishBtn = screen.getAllByRole('button', { name: /Завершить/i })[0];
      fireEvent.click(finishBtn);

      // При наличии неотвеченных появляется модальное окно подтверждения
      const confirmBtn = screen.getByRole('button', { name: /Всё равно завершить/i });
      fireEvent.click(confirmBtn);

      // Сводка появляется после завершения
      const summaryBlock = document.querySelector('#set-summary-block');
      expect(summaryBlock).not.toBeNull();
      expect(summaryBlock?.textContent).toContain('Итоговая сводка набора');
    });

    it('сумма баллов совпадает с суммой по позициям', () => {
      const config = {
        seed: '22222',
        title: 'Набор тест 2',
        slots: [
          { taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 },
          { taskId: 2, n1: 0, n2: 1, n3: 0, nR: 0 },
        ],
      };
      const built = buildSet(config);
      const correctAns1 = String(built.entries[0].taskData.correctAnswer);
      const code = encodeSetShort(config);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '22222',
          title: 'Набор тест 2',
          slots: config.slots,
          hasBuilt: true,
          // Верный ответ для позиции 1, ответ 'wrong' неверный для позиции 2
          userAnswers: { 1: correctAns1, 2: 'wrong' },
          panelStates: {
            // Подложенный противоположный result: проверяем, что сводка считает scorePosition по userAnswers, а не опирается на stale panelStates.result
            1: { submitted: true, showSolution: false, result: { score: 0, maxScore: 1, passed: false } },
            2: { submitted: true, showSolution: false, result: { score: 1, maxScore: 1, passed: true } },
          },
          allowStudentCheck: true,
          elapsedSeconds: 50,
          isPaused: false,
          isFinished: true,
        })
      );
      render(<SetBuilderView />);

      const summaryBlock = document.querySelector('#set-summary-block');
      expect(summaryBlock).not.toBeNull();
      // Сумма баллов пересчитывается: позиция 1 (верный ответ) -> 1 балл, позиция 2 ('wrong') -> 0 баллов = 1 из 2
      expect(summaryBlock?.textContent).toContain('1 из 2 баллов');
      expect(summaryBlock?.textContent).toContain('Позиция 1');
      expect(summaryBlock?.textContent).toContain('Позиция 2');
      expect(summaryBlock?.textContent).toContain('балл 1 из 1');
      expect(summaryBlock?.textContent).toContain('балл 0 из 1');
      expect(summaryBlock?.textContent).toContain('верно');
      expect(summaryBlock?.textContent).toContain('неверно');
    });

    it('счётчик «отвечено N из M» верен при частично заполненном наборе', () => {
      const config = {
        seed: '33333',
        title: 'Набор тест 3',
        slots: [
          { taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 },
          { taskId: 2, n1: 0, n2: 1, n3: 0, nR: 0 },
          { taskId: 3, n1: 0, n2: 1, n3: 0, nR: 0 },
        ],
      };
      const code = encodeSetShort(config);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '33333',
          title: 'Набор тест 3',
          slots: config.slots,
          hasBuilt: true,
          userAnswers: { 1: 'ответ1', 3: 'ответ3' }, // Позиция 2 не заполнена
          panelStates: {},
          allowStudentCheck: true,
          elapsedSeconds: 80,
          isPaused: false,
          isFinished: true,
        })
      );
      render(<SetBuilderView />);

      const summaryBlock = document.querySelector('#set-summary-block');
      expect(summaryBlock).not.toBeNull();
      expect(summaryBlock?.textContent).toContain('Отвечено 2 из 3');
      expect(summaryBlock?.textContent).toContain('без ответа');
    });

    it('время в сводке равно elapsedSeconds на момент завершения', () => {
      const config = {
        seed: '44444',
        title: 'Набор тест 4',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(config);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '44444',
          title: 'Набор тест 4',
          slots: config.slots,
          hasBuilt: true,
          userAnswers: { 1: '42' },
          panelStates: {},
          allowStudentCheck: true,
          elapsedSeconds: 3725, // 1h 2m 5s -> "1:02:05"
          isPaused: false,
          isFinished: true,
        })
      );
      render(<SetBuilderView />);

      const summaryBlock = document.querySelector('#set-summary-block');
      expect(summaryBlock).not.toBeNull();
      expect(summaryBlock?.textContent).toContain('1:02:05');
    });

    it('сводка восстанавливается после ремоунта с сохранённым sessionStorage', () => {
      const config = {
        seed: '55555',
        title: 'Набор тест 5',
        slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
      };
      const built = buildSet(config);
      const correctAns = String(built.entries[0].taskData.correctAnswer);
      const code = encodeSetShort(config);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: '55555',
          title: 'Набор тест 5',
          slots: config.slots,
          hasBuilt: true,
          userAnswers: { 1: correctAns },
          panelStates: {
            1: { submitted: true, showSolution: false, result: { score: 1, maxScore: 1, passed: true } },
          },
          allowStudentCheck: true,
          elapsedSeconds: 95,
          isPaused: false,
          isFinished: true,
        })
      );

      const { unmount } = render(<SetBuilderView />);
      const firstRenderBlock = document.querySelector('#set-summary-block');
      expect(firstRenderBlock).not.toBeNull();
      expect(firstRenderBlock?.textContent).toContain('1 из 1 баллов');
      expect(firstRenderBlock?.textContent).toContain('01:35');
      unmount();

      // Второй рендер (симуляция перезагрузки/F5 с существующим sessionStorage)
      render(<SetBuilderView />);
      const reloadedBlock = document.querySelector('#set-summary-block');
      expect(reloadedBlock).not.toBeNull();
      expect(reloadedBlock?.textContent).toContain('1 из 1 баллов');
      expect(reloadedBlock?.textContent).toContain('01:35');
    });

    it('после «Завершить» и повторной сборки того же набора с тем же seed значения input в DOM пусты', () => {
      const config = {
        seed: 'TEST-REBUILD-EMPTY',
        title: 'Набор тест повторная сборка',
        slots: [{ taskId: 1, n1: 0, n2: 2, n3: 0, nR: 0 }],
      };
      const code = encodeSetShort(config);
      sessionStorage.setItem(
        SET_STORAGE_KEY,
        JSON.stringify({
          version: 2,
          builtCode: code,
          seed: 'TEST-REBUILD-EMPTY',
          title: 'Набор тест повторная сборка',
          slots: config.slots,
          hasBuilt: true,
          userAnswers: { 1: '', 2: '' },
          panelStates: {
            1: { submitted: true, showSolution: true, result: { score: 0, maxScore: 1, passed: false } },
            2: { submitted: true, showSolution: true, result: { score: 0, maxScore: 1, passed: false } },
          },
          allowStudentCheck: true,
          elapsedSeconds: 120,
          isPaused: false,
          isFinished: false,
        })
      );

      render(<SetBuilderView />);

      // До повторной сборки задания проверены с пустым ответом, кнопки «Проверить» скрыты
      expect(screen.queryAllByRole('button', { name: /^Проверить$/i })).toHaveLength(0);
      expect(document.querySelector('#set-entry-1')?.textContent).toContain('Неверно');

      // Нажимаем «Собрать набор» (повторная сборка того же набора с тем же seed)
      const buildBtn = screen.getByRole('button', { name: /Собрать набор/i });
      fireEvent.click(buildBtn);

      // Проверяем, что благодаря buildNonce панель перемонтировалась:
      // разбор и вердикт убраны, кнопки «Проверить» снова присутствуют в DOM
      expect(screen.getAllByRole('button', { name: /^Проверить$/i })).toHaveLength(2);
      expect(document.querySelector('#set-entry-1')?.textContent).not.toContain('Неверно');

      // Поля ввода пусты
      const entry1 = document.querySelector('#set-entry-1');
      const input1 = entry1?.querySelector('input[type="text"]') as HTMLInputElement;
      expect(input1).not.toBeNull();
      expect(input1.value).toBe('');

      // #set-summary-block отсутствует в DOM
      expect(document.querySelector('#set-summary-block')).toBeNull();

      // #session-banner показывает 00:00
      const banner = document.querySelector('#session-banner');
      expect(banner?.textContent).toContain('00:00');
    });
  });
});


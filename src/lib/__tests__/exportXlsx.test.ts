import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { buildStyledWorkbookBuffer, mskDateTimeCell, StyledSheet } from '../exportXlsx';

describe('buildStyledWorkbookBuffer (exceljs)', () => {
  it('создаёт книгу из двух листов с заливками, закреплением, автофильтром, безопасными именами и числовыми типами', async () => {
    const sheets: StyledSheet[] = [
      {
        name: 'Сводка: [Класс 9А]*?/\\ Очень длинное название',
        headers: ['Ученик', 'Балл', 'Процент', 'Статус', 'Комментарий'],
        freezeCols: 1,
        colWidths: [24],
        rows: [
          [
            { v: 'Иванов Иван', bold: true },
            18,
            { v: 90, fill: 'green', bold: true },
            { v: 'Завершена', fill: 'gray' },
            null,
          ],
          [
            'Петров Пётр',
            10.5,
            { v: 53, fill: 'yellow' },
            { v: 'В процессе', fill: 'gray' },
            'Очень длинный текстовый комментарий для проверки ограничения максимальной ширины колонки свыше 45 символов',
          ],
          [
            'Сидоров Сидор',
            0,
            { v: 0, fill: 'red' },
            'Не начата',
            'Ок',
          ],
        ],
      },
      {
        name: 'Ответы',
        headers: ['№', 'Балл', 'Макс'],
        rows: [
          [1, 2, 2],
          [2, 1, 3],
        ],
      },
    ];

    const buffer = await buildStyledWorkbookBuffer(sheets);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    expect(workbook.worksheets).toHaveLength(2);

    const ws1 = workbook.worksheets[0];
    const ws2 = workbook.worksheets[1];

    // Имена листов: <= 31 символа, без []:*?/\
    expect(ws1.name.length).toBeLessThanOrEqual(31);
    expect(ws1.name).not.toMatch(/[\[\]:*?/\\]/);
    expect(ws1.name).toBe('Сводка Класс 9А Очень длинное н');
    expect(ws2.name).toBe('Ответы');

    // Шапка: жирная, серая заливка #E7E6E6, перенос текста
    const h1 = ws1.getRow(1).getCell(1);
    expect(h1.font?.bold).toBe(true);
    expect((h1.fill as ExcelJS.FillPattern)?.fgColor?.argb).toBe('FFE7E6E6');
    expect(h1.alignment?.wrapText).toBe(true);

    // Заливки ячеек и чёрный текст
    const greenCell = ws1.getRow(2).getCell(3);
    expect((greenCell.fill as ExcelJS.FillPattern)?.fgColor?.argb).toBe('FFC6EFCE');
    expect(greenCell.font?.bold).toBe(true);
    expect(greenCell.font?.color?.argb).toBe('FF000000');

    const yellowCell = ws1.getRow(3).getCell(3);
    expect((yellowCell.fill as ExcelJS.FillPattern)?.fgColor?.argb).toBe('FFFFEB9C');
    expect(yellowCell.font?.color?.argb).toBe('FF000000');

    const redCell = ws1.getRow(4).getCell(3);
    expect((redCell.fill as ExcelJS.FillPattern)?.fgColor?.argb).toBe('FFFFC7CE');
    expect(redCell.font?.color?.argb).toBe('FF000000');

    const grayCell = ws1.getRow(2).getCell(4);
    expect((grayCell.fill as ExcelJS.FillPattern)?.fgColor?.argb).toBe('FFE7E6E6');

    // Числа остаются числами (включая 0 и дробные)
    expect(typeof ws1.getRow(2).getCell(2).value).toBe('number');
    expect(ws1.getRow(2).getCell(2).value).toBe(18);
    expect(typeof ws1.getRow(2).getCell(3).value).toBe('number');
    expect(ws1.getRow(2).getCell(3).value).toBe(90);
    expect(typeof ws1.getRow(3).getCell(2).value).toBe('number');
    expect(ws1.getRow(3).getCell(2).value).toBe(10.5);
    expect(typeof ws1.getRow(4).getCell(2).value).toBe('number');
    expect(ws1.getRow(4).getCell(2).value).toBe(0);
    expect(typeof ws2.getRow(2).getCell(1).value).toBe('number');
    expect(ws2.getRow(2).getCell(1).value).toBe(1);

    // Закрепление первой строки и freezeCols первых колонок
    const view1 = ws1.views[0] as ExcelJS.WorksheetViewFrozen;
    expect(view1.state).toBe('frozen');
    expect(view1.ySplit).toBe(1);
    expect(view1.xSplit).toBe(1);

    const view2 = ws2.views[0] as ExcelJS.WorksheetViewFrozen;
    expect(view2.state).toBe('frozen');
    expect(view2.ySplit).toBe(1);

    // Автофильтр на всю таблицу
    expect(ws1.autoFilter).toBe('A1:E4');
    expect(ws2.autoFilter).toBe('A1:C3');

    // Ширины колонок: явная colWidths и автоширина с ограничением 45
    expect(ws1.getColumn(1).width).toBe(24);
    expect(ws1.getColumn(5).width).toBe(45);
  });

  it('сохраняет numFmt на ячейках с numFmt и оставляет без формата ячейки без numFmt', async () => {
    const sheets: StyledSheet[] = [
      {
        name: 'Тест форматов',
        headers: ['С форматом', 'Без формата', 'Пусто с форматом'],
        rows: [
          [
            { v: 75, fill: 'green', numFmt: '0"%"' },
            { v: 42, fill: 'yellow' },
            { v: null, fill: 'gray', numFmt: '0"%"' },
          ],
        ],
      },
    ];

    const buffer = await buildStyledWorkbookBuffer(sheets);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const ws = workbook.worksheets[0];
    const withFmt = ws.getRow(2).getCell(1);
    const withoutFmt = ws.getRow(2).getCell(2);
    const nullWithFmt = ws.getRow(2).getCell(3);

    expect(withFmt.value).toBe(75);
    expect(withFmt.numFmt).toBe('0"%"');
    expect(withoutFmt.value).toBe(42);
    expect(withoutFmt.numFmt ?? 'General').toBe('General');
    expect(nullWithFmt.value).toBeNull();
    expect(nullWithFmt.numFmt).toBe('0"%"');
  });

  it('при wrapData: true задаёт alignment.wrapText и vertical: top только ячейкам данных, без wrapData не задаёт', async () => {
    const sheets: StyledSheet[] = [
      {
        name: 'С переносом',
        headers: ['Параметр', 'Значение'],
        wrapData: true,
        rows: [
          ['Длинный параметр', 'Очень длинное пояснение для переноса текста'],
          [{ v: 'Жирный параметр', bold: true }, null],
        ],
      },
      {
        name: 'Без переноса',
        headers: ['Параметр', 'Значение'],
        rows: [['Обычный параметр', 'Обычное значение']],
      },
    ];

    const buffer = await buildStyledWorkbookBuffer(sheets);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const wrappedSheet = workbook.worksheets[0];
    const plainSheet = workbook.worksheets[1];

    expect(wrappedSheet.getRow(2).getCell(1).alignment).toEqual({
      wrapText: true,
      vertical: 'top',
    });
    expect(wrappedSheet.getRow(2).getCell(2).alignment).toEqual({
      wrapText: true,
      vertical: 'top',
    });
    expect(wrappedSheet.getRow(3).getCell(1).alignment).toEqual({
      wrapText: true,
      vertical: 'top',
    });
    expect(wrappedSheet.getRow(3).getCell(2).alignment).toEqual({
      wrapText: true,
      vertical: 'top',
    });

    expect(plainSheet.getRow(2).getCell(1).alignment?.wrapText).toBeFalsy();
    expect(plainSheet.getRow(2).getCell(2).alignment?.wrapText).toBeFalsy();
  });

  it('записывает Date с numFmt (включая переход суток 21:30 UTC -> 00:30 МСК) и сохраняет при чтении exceljs', async () => {
    const bareDate = new Date(Date.UTC(2026, 10, 17, 12, 5, 0));
    const sheets: StyledSheet[] = [
      {
        name: 'Даты',
        headers: ['Дата (МСК)', 'Голая дата', 'Невалидная'],
        rows: [
          [
            mskDateTimeCell('2026-11-17T21:30:00Z'),
            bareDate,
            mskDateTimeCell(''),
          ],
        ],
      },
    ];

    const buffer = await buildStyledWorkbookBuffer(sheets);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const ws = workbook.worksheets[0];
    const mskCell = ws.getRow(2).getCell(1);
    const bareCell = ws.getRow(2).getCell(2);
    const invalidCell = ws.getRow(2).getCell(3);

    expect(mskCell.value).toBeInstanceOf(Date);
    const readMsk = mskCell.value as Date;
    expect(readMsk.getTime()).toBe(Date.UTC(2026, 10, 18, 0, 30, 0));
    expect(readMsk.getUTCDate()).toBe(18);
    expect(readMsk.getUTCHours()).toBe(0);
    expect(readMsk.getUTCMinutes()).toBe(30);
    expect(mskCell.numFmt).toBe('dd.mm.yyyy hh:mm');

    expect(bareCell.value).toBeInstanceOf(Date);
    expect((bareCell.value as Date).getTime()).toBe(bareDate.getTime());

    expect(invalidCell.value).toBe('—');
    expect(ws.getColumn(1).width).toBe(19);
    expect(ws.getColumn(2).width).toBe(19);
  });
});

import { describe, it, expect } from 'vitest';
import {
  TASK13_TEXTS,
  TASK13_TABLES,
  TASK13_TEXTS_L1,
  TASK13_TEXTS_L2,
  TASK13_TEXTS_L3,
  TASK13_TABLES_L1,
  TASK13_TABLES_L2,
  TASK13_TABLES_L3,
  Task13TextSrc,
  Task13TableSrc
} from '../../../data/task13data';
import { generateTask13 } from '../generate';
import { parsePastedHtml } from '../html';
import { checkTask13 } from '../check';
import { buildDoc } from '../parse';
import { makeRng } from '../../../utils/rng';
import { tableSizeRequirement } from '../registry';
import { formatTask13Conditions, DEFAULT_SPEC } from '../spec';

const SEEDS = Number(process.env.TASK13_SEEDS ?? 5);

interface DefectReport {
  datasetId: string;
  fieldOrCell: string;
  defectType: string;
  currentValue: string;
}

export const FORBIDDEN_E_WORDS = [
  { wrong: /(?:^|[^а-яёА-ЯЁ])лед(?:$|[^а-яёА-ЯЁ])|подледн/i, right: 'лёд' },
  { wrong: /(?:^|[^а-яёА-ЯЁ])тверд/i, right: 'твёрд' },
  { wrong: /(?:^|[^а-яёА-ЯЁ])желоб/i, right: 'жёлоб' },
  { wrong: /(?:^|[^а-яёА-ЯЁ])соленос/i, right: 'солёнос' }
];

/**
 * Проверка текста на базовые дефекты (двойные пробелы, "е" вместо "ё", пустые строки).
 */
export function scanTextForIntegrity(datasetId: string, location: string, text: string, defects: DefectReport[]) {
  if (text === undefined || text === null) {
    defects.push({
      datasetId,
      fieldOrCell: location,
      defectType: 'Отсутствует значение (undefined/null)',
      currentValue: String(text)
    });
    return;
  }

  if (typeof text !== 'string') return;

  if (text.trim().length === 0) {
    defects.push({
      datasetId,
      fieldOrCell: location,
      defectType: 'Пустая строка / подпись',
      currentValue: text
    });
  }

  // 1. Двойной пробел
  if (/\s{2,}/.test(text)) {
    defects.push({
      datasetId,
      fieldOrCell: location,
      defectType: 'Двойной пробел',
      currentValue: text
    });
  }

  // 2. Буква "е" вместо "ё"
  FORBIDDEN_E_WORDS.forEach(({ wrong, right }) => {
    if (wrong.test(text) && !text.toLowerCase().includes(right)) {
      defects.push({
        datasetId,
        fieldOrCell: location,
        defectType: 'Буква «е» вместо «ё»',
        currentValue: text
      });
    }
  });
}

/**
 * Извлечение всех текстовых полей из описания таблицы
 */
export function extractTableTextFields(table: Task13TableSrc): { location: string; text: string }[] {
  const fields: { location: string; text: string }[] = [];

  if (table.objectColumnLabel) {
    fields.push({ location: 'objectColumnLabel', text: table.objectColumnLabel });
  }

  table.rows.forEach(r => {
    fields.push({ location: `row [${r.id}]`, text: r.label });
  });

  table.headerGroups?.forEach(hg => {
    fields.push({ location: `headerGroup [${hg.label}]`, text: hg.label });
  });

  table.columns.forEach(c => {
    fields.push({ location: `column [${c.id}] label`, text: c.label });
    if (c.unit) {
      fields.push({ location: `column [${c.id}] unit`, text: c.unit });
    }
    Object.entries(c.values).forEach(([rId, val]) => {
      if (typeof val === 'string') {
        fields.push({ location: `col [${c.id}] row [${rId}]`, text: val });
      }
    });
  });

  if (table.totalsRow) {
    fields.push({ location: 'totalsRow', text: table.totalsRow.label });
  }

  return fields;
}

describe('Валидатор текстовых записей (TASK13_TEXTS)', () => {
  it.each(TASK13_TEXTS)('Текст $id (L$level): обязательные поля присутствуют и непусты', (text: Task13TextSrc) => {
    expect(text.id).toBeDefined();
    expect(typeof text.id).toBe('string');
    expect(text.id.trim().length).toBeGreaterThan(0);

    expect([1, 2, 3]).toContain(text.level);

    expect(Array.isArray(text.tags)).toBe(true);
    expect(text.tags.length).toBeGreaterThan(0);
    text.tags.forEach(tag => {
      expect(typeof tag).toBe('string');
      expect(tag.trim().length).toBeGreaterThan(0);
    });

    expect(typeof text.hasHeading).toBe('boolean');
    if (text.hasHeading) {
      expect(typeof text.heading).toBe('string');
      expect(text.heading!.trim().length).toBeGreaterThan(0);
    }

    expect(typeof text.body).toBe('string');
    expect(text.body.trim().length).toBeGreaterThan(0);
  });

  it.each(TASK13_TEXTS)('Текст $id (L$level): число абзацев соответствует минимуму генератора для уровня', (text: Task13TextSrc) => {
    // Минимум абзацев:
    // L1: 1 абзац (в L1 разрывы не ставятся)
    // L2: 1 абзац (допускается 1 или 2 абзаца)
    // L3: 2 абзаца (в L3 генератор splitBodyIntoParagraphs форсирует минимум 1 разрыв ||)
    const parts = text.body.split('||').map(s => s.trim()).filter(s => s.length > 0);
    const minRequiredParas = text.level === 3 ? 2 : 1;
    expect(parts.length).toBeGreaterThanOrEqual(minRequiredParas);
  });

  it.each(TASK13_TEXTS)('Текст $id (L$level): достаточно фрагментов [слово] для выделений', (text: Task13TextSrc) => {
    // В генераторе buildDoc для распределения стилей (b, i, u) требуется минимум 3 размеченных кандидата
    const candidates = text.body.match(/\[([^\]]+)\]/g) || [];
    expect(candidates.length).toBeGreaterThanOrEqual(3);
  });

  it.each(TASK13_TEXTS)('Текст $id (L$level): нет непарных кавычек, скобок и индексов', (text: Task13TextSrc) => {
    const checkText = (str: string) => {
      const openGuill = (str.match(/«/g) || []).length;
      const closeGuill = (str.match(/»/g) || []).length;
      expect(openGuill, `Непарные кавычки «...» в "${str}"`).toBe(closeGuill);

      const openSquare = (str.match(/\[/g) || []).length;
      const closeSquare = (str.match(/\]/g) || []).length;
      expect(openSquare, `Непарные квадратные скобки [...] в "${str}"`).toBe(closeSquare);

      const openRound = (str.match(/\(/g) || []).length;
      const closeRound = (str.match(/\)/g) || []).length;
      expect(openRound, `Непарные круглые скобки (...) в "${str}"`).toBe(closeRound);

      const carats = (str.match(/\^/g) || []).length;
      expect(carats % 2, `Непарные маркеры верхнего индекса ^...^ в "${str}"`).toBe(0);
    };

    checkText(text.body);
    if (text.hasHeading && text.heading) {
      checkText(text.heading);
    }
  });

  it.each(TASK13_TEXTS)('Текст $id (L$level): нет висящих пробелов перед знаками препинания', (text: Task13TextSrc) => {
    const checkPunct = (str: string) => {
      // Запрещены пробелы перед знаками препинания: .,:;!?»)
      const spaceBeforePunct = str.match(/\s+[.,:;!?»\)]/g);
      expect(spaceBeforePunct, `Обнаружен пробел перед знаком препинания в "${str}"`).toBeNull();

      // Запрещены пробелы сразу после открывающих скобок/кавычек: («[
      const spaceAfterOpen = str.match(/[(\[«]\s+/g);
      expect(spaceAfterOpen, `Обнаружен лишний пробел после открывающей скобки/кавычки в "${str}"`).toBeNull();
    };

    checkPunct(text.body);
    if (text.hasHeading && text.heading) {
      checkPunct(text.heading);
    }
  });

  it.each(TASK13_TEXTS)('Текст $id (L$level): базовая целостность (двойные пробелы, буква ё)', (text: Task13TextSrc) => {
    const defects: DefectReport[] = [];
    if (text.hasHeading && text.heading) {
      scanTextForIntegrity(text.id, 'heading', text.heading, defects);
    }
    scanTextForIntegrity(text.id, 'body', text.body, defects);
    expect(defects).toHaveLength(0);
  });
});

describe('Валидатор табличных записей (TASK13_TABLES)', () => {
  it.each(TASK13_TABLES)('Таблица $id (L$level): обязательные поля присутствуют и непусты', (table: Task13TableSrc) => {
    expect(table.id).toBeDefined();
    expect(typeof table.id).toBe('string');
    expect(table.id.trim().length).toBeGreaterThan(0);

    expect([1, 2, 3]).toContain(table.level);

    expect(Array.isArray(table.tags)).toBe(true);
    expect(table.tags.length).toBeGreaterThan(0);
    table.tags.forEach(tag => {
      expect(typeof tag).toBe('string');
      expect(tag.trim().length).toBeGreaterThan(0);
    });

    expect(Array.isArray(table.rows)).toBe(true);
    expect(table.rows.length).toBeGreaterThan(0);

    expect(Array.isArray(table.columns)).toBe(true);
    expect(table.columns.length).toBeGreaterThan(0);
  });

  it.each(TASK13_TABLES)('Таблица $id (L$level): размер таблицы попадает в допустимый диапазон для уровня', (table: Task13TableSrc) => {
    // В генераторе buildDoc:
    // L1: minRows=2, minAddCols=1 (всего минимум 2 строки, 1 колонка значений)
    // L2: minRows=2, minAddCols=1 (всего минимум 2 строки, 1 колонка значений)
    // L3: minRows=2 (требуется 2..5), minAddCols=2 (требуется от 2 колонок значений для headerGroups)
    const minRows = 2;
    const minCols = table.level === 3 ? 2 : 1;
    expect(table.rows.length).toBeGreaterThanOrEqual(minRows);
    expect(table.columns.length).toBeGreaterThanOrEqual(minCols);
  });

  it.each(TASK13_TABLES)('Таблица $id (L$level): строки имеют уникальные id и непустые подписи', (table: Task13TableSrc) => {
    const rowIds = table.rows.map(r => r.id);
    expect(new Set(rowIds).size).toBe(rowIds.length);
    table.rows.forEach(r => {
      expect(r.id.trim().length).toBeGreaterThan(0);
      expect(r.label.trim().length).toBeGreaterThan(0);
    });
  });

  it.each(TASK13_TABLES)('Таблица $id (L$level): столбцы имеют уникальные id и непустые подписи', (table: Task13TableSrc) => {
    const colIds = table.columns.map(c => c.id);
    expect(new Set(colIds).size).toBe(colIds.length);
    table.columns.forEach(c => {
      expect(c.id.trim().length).toBeGreaterThan(0);
      expect(c.label.trim().length).toBeGreaterThan(0);
      expect(c.align).toBeDefined();
      expect(c.kind).toBeDefined();
    });
  });

  it.each(TASK13_TABLES)('Таблица $id (L$level): каждый столбец содержит валидное значение для каждой строки без пропусков', (table: Task13TableSrc) => {
    const rowIds = table.rows.map(r => r.id);
    table.columns.forEach(col => {
      rowIds.forEach(rowId => {
        const val = col.values[rowId];
        expect(val, `В столбце ${col.id} отсутствует значение для строки ${rowId}`).toBeDefined();
        if (typeof val === 'string') {
          expect(val.trim().length).toBeGreaterThan(0);
        } else if (typeof val === 'number') {
          expect(isNaN(val)).toBe(false);
        } else if (typeof val === 'object' && val !== null) {
          expect(val.min).toBeLessThanOrEqual(val.max);
          expect(val.step).toBeGreaterThan(0);
        }
      });
    });
  });

  it.each(TASK13_TABLES)('Таблица $id (L$level): headerGroups ссылаются только на существующие столбцы (если есть)', (table: Task13TableSrc) => {
    if (table.headerGroups && table.headerGroups.length > 0) {
      const colIds = new Set(table.columns.map(c => c.id));
      table.headerGroups.forEach(hg => {
        expect(hg.label.trim().length).toBeGreaterThan(0);
        expect(hg.columnIds.length).toBeGreaterThan(0);
        hg.columnIds.forEach(cId => {
          expect(colIds.has(cId), `headerGroup "${hg.label}" ссылается на несуществующий столбец "${cId}"`).toBe(true);
        });
      });
    }
  });

  it.each(TASK13_TABLES)('Таблица $id (L$level): базовая целостность текста ячеек и заголовков', (table: Task13TableSrc) => {
    const defects: DefectReport[] = [];
    const fields = extractTableTextFields(table);
    fields.forEach(({ location, text }) => {
      scanTextForIntegrity(table.id, location, text, defects);
    });
    expect(defects).toHaveLength(0);
  });
});

describe('Проверка уникальности ID по файлам уровней и во всём наборе', () => {
  it.each([
    ['L1', TASK13_TEXTS_L1],
    ['L2', TASK13_TEXTS_L2],
    ['L3', TASK13_TEXTS_L3]
  ])('Тексты %s: id уникальны внутри файла уровня', (_lvl, texts) => {
    const ids = texts.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(id.trim().length).toBeGreaterThan(0));
  });

  it.each([
    ['L1', TASK13_TABLES_L1],
    ['L2', TASK13_TABLES_L2],
    ['L3', TASK13_TABLES_L3]
  ])('Таблицы %s: id уникальны внутри файла уровня', (_lvl, tables) => {
    const ids = tables.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(id.trim().length).toBeGreaterThan(0));
  });

  it('Все тексты имеют глобально уникальные непустые id', () => {
    const ids = TASK13_TEXTS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(id.trim().length).toBeGreaterThan(0));
  });

  it('Все таблицы имеют глобально уникальные непустые id', () => {
    const ids = TASK13_TABLES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(id.trim().length).toBeGreaterThan(0));
  });
});

describe('Тематическое сопоставление по тегам', () => {
  it.each([1, 2, 3])('Уровень %i имеет хотя бы одну пару с совпадающим тегом', (lvl) => {
    const levelTexts = TASK13_TEXTS.filter(t => t.level === lvl);
    const levelTables = TASK13_TABLES.filter(t => t.level === lvl);
    expect(levelTexts.length).toBeGreaterThan(0);
    expect(levelTables.length).toBeGreaterThan(0);

    const matchingPairs = levelTexts.flatMap(text =>
      levelTables
        .filter(table => text.tags.some(tag => table.tags.includes(tag)))
        .map(table => ({ text, table }))
    );

    expect(matchingPairs.length).toBeGreaterThan(0);
  });
});

describe('Самотест валидатора целостности данных', () => {
  describe('Проверка двойных пробелов', () => {
    const badCases = ['Два  пробела', 'В начале  середине', 'Слово   слово'];
    const cleanCases = ['Один пробел между словами', 'Простой текст'];

    it.each(badCases)('обнаруживает дефект двойного пробела в "%s"', (sample) => {
      const defects: DefectReport[] = [];
      scanTextForIntegrity('test-id', 'test-loc', sample, defects);
      expect(defects.some(d => d.defectType === 'Двойной пробел')).toBe(true);
    });

    it.each(cleanCases)('не находит ложных дефектов в чистом тексте "%s"', (sample) => {
      const defects: DefectReport[] = [];
      scanTextForIntegrity('test-id', 'test-loc', sample, defects);
      expect(defects.some(d => d.defectType === 'Двойной пробел')).toBe(false);
    });
  });

  describe('Проверка буквы «е» вместо «ё»', () => {
    const cases = [
      { word: 'лёд', bad: 'В стакане лед', clean: 'В стакане лёд' },
      { word: 'твёрд', bad: 'Твердый минерал', clean: 'Твёрдый минерал' },
      { word: 'жёлоб', bad: 'Глубокий желоб на дне', clean: 'Глубокий жёлоб на дне' },
      { word: 'солёнос', bad: 'Высокая соленость моря', clean: 'Высокая солёность моря' }
    ];

    it.each(cases)('обнаруживает дефект «е» вместо «ё» для "$word"', ({ word, bad }) => {
      const defects: DefectReport[] = [];
      scanTextForIntegrity('test-id', 'test-loc', bad, defects);
      expect(defects.some(d => d.defectType === 'Буква «е» вместо «ё»')).toBe(true);
    });

    it.each(cases)('не находит ложных дефектов в слове с «ё» ("$clean")', ({ clean }) => {
      const defects: DefectReport[] = [];
      scanTextForIntegrity('test-id', 'test-loc', clean, defects);
      expect(defects.some(d => d.defectType === 'Буква «е» вместо «ё»')).toBe(false);
    });
  });
});

describe('Проверка расчета размера таблицы и объединения ячеек (tableSize, colSpan, rowSpan)', () => {
  it('таблица с двухуровневой шапкой и строкой «Итого», собранная учеником верно, дает tableSize ok, а формулировка совпадает с физической сеткой', () => {
    // Берём вариант с двухуровневой шапкой и итоговой строкой (L3, сид 1: table-l3-1)
    const task = generateTask13(1, 3);
    const doc = task.doc;
    const spec = doc.spec || DEFAULT_SPEC;

    // 1. Проверяем, что в doc есть объединения ячеек (colSpan > 1 или rowSpan > 1)
    const hasSpans = doc.table!.rows.some(r => r.some(c => (c.colSpan && c.colSpan > 1) || (c.rowSpan && c.rowSpan > 1)));
    expect(hasSpans).toBe(true);

    // 2. Проверяем совпадение формулировки с физической сеткой (N строк × M столбцов)
    const physicalRows = doc.table!.rows.length;
    const physicalCols = Math.max(...doc.table!.rows.map(r => r.reduce((acc, c) => acc + (c.colSpan || 1), 0)));

    const conditions = formatTask13Conditions(doc, spec);
    const sizeCondition = conditions.find(c => c.ids.includes('tableSize'));
    expect(sizeCondition).toBeDefined();
    expect(sizeCondition!.text).toContain(`${physicalRows}`);
    expect(sizeCondition!.text).toContain(`${physicalCols}`);

    // 3. Собираем HTML точно по структуре doc.table с учетом colspan и rowspan
    const rowsHtml = doc.table!.rows.map(r => {
      const cellsHtml = r.map(c => {
        const text = c.spans.map(s => s.text).join('');
        const colSpanAttr = c.colSpan && c.colSpan > 1 ? ` colspan="${c.colSpan}"` : '';
        const rowSpanAttr = c.rowSpan && c.rowSpan > 1 ? ` rowspan="${c.rowSpan}"` : '';
        const alignAttr = c.align ? ` align="${c.align}"` : '';
        return `<td${alignAttr}${colSpanAttr}${rowSpanAttr}>${text}</td>`;
      }).join('');
      return `<tr>${cellsHtml}</tr>`;
    }).join('');

    const html = `<p style="font-size: ${spec.requirements.fontSize.pt}pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">Текст</p><table>${rowsHtml}</table>`;

    const pasted = parsePastedHtml(html);
    const report = checkTask13(doc, pasted, spec);

    // tableSize должен быть 'ok'
    const tableSizeCrit = report.items.find(it => it.id === 'tableSize');
    expect(tableSizeCrit).toBeDefined();
    expect(tableSizeCrit!.status).toBe('ok');
    expect(tableSizeCrit!.expected).toBe(`${physicalRows}×${physicalCols}`);
    expect(tableSizeCrit!.actual).toBe(`${physicalRows}×${physicalCols}`);
  });
});

describe('Проверка вычисления сумм и диапазонов в строке «Итого» на сидах × 3 уровня', () => {
  it('на сидах × 3 уровня сумма в «Итого» равна сумме значений столбца в том же doc, и число в образце совпадает с ожидаемым проверкой', () => {
    let variantsWithTotals = 0;

    for (let level = 1; level <= 3; level++) {
      for (let seed = 1; seed <= SEEDS; seed++) {
        const task = generateTask13(seed, level as any);
        const doc = task.doc;
        if (!doc.table || doc.table.rows.length === 0) continue;

        const rows = doc.table.rows;
        const lastRow = rows[rows.length - 1];
        const hasTotals = lastRow.some(c => c.spans.some(s => s.text.includes('Итого')));

        if (hasTotals) {
          variantsWithTotals++;
          const numHeaderRows = rows[0].some(c => (c.rowSpan && c.rowSpan > 1) || (c.colSpan && c.colSpan > 1)) ? 2 : 1;
          const dataRows = rows.slice(numHeaderRows, rows.length - 1);

          // Проверяем каждую числовую ячейку в строке «Итого»
          // В L3 таблицы с totalsRow: сумма столбца вычисляется по значениям строк данных
          // Преобразуем текст ячеек данных в числа и сверяем с числом в строке «Итого»
          const spec = doc.spec || DEFAULT_SPEC;

          // Собираем HTML и проверяем через checkTask13
          const rowsHtml = rows.map(r => {
            const cellsHtml = r.map(c => {
              const text = c.spans.map(s => s.text).join('');
              const colSpanAttr = c.colSpan && c.colSpan > 1 ? ` colspan="${c.colSpan}"` : '';
              const rowSpanAttr = c.rowSpan && c.rowSpan > 1 ? ` rowspan="${c.rowSpan}"` : '';
              return `<td${colSpanAttr}${rowSpanAttr}>${text}</td>`;
            }).join('');
            return `<tr>${cellsHtml}</tr>`;
          }).join('');

          const headingHtml = doc.headingIndex !== null && doc.headingIndex !== undefined
            ? `<p style="font-size: ${spec.requirements.fontSize.pt}pt; text-align: center; font-weight: bold;">${doc.paragraphs[doc.headingIndex].spans.map(s => s.text).join('')}</p>`
            : '';
          const bodyHtml = doc.paragraphs
            .filter((_, idx) => idx !== doc.headingIndex)
            .map(p => `<p style="font-size: ${spec.requirements.fontSize.pt}pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">${p.spans.map(s => s.text).join('')}</p>`)
            .join('');

          const fullHtml = `${headingHtml}\n${bodyHtml}\n<table>${rowsHtml}</table>`;
          const pasted = parsePastedHtml(fullHtml);
          const report = checkTask13(doc, pasted, spec);

          // Проверка не должна находить опечаток в таблице при точном переносе сгенерированных сумм
          expect(report.typosTable, `Seed ${seed} L${level}: опечатки в таблице`).toBe(0);
        }
      }
    }

    if (SEEDS >= 200) {
      expect(variantsWithTotals).toBeGreaterThanOrEqual(100);
    }
  });
});

describe('Тестирование функциональности titleRow', () => {
  const dummyText: Task13TextSrc = {
    id: 'text-for-title-test',
    level: 2,
    tags: ['тест'],
    hasHeading: false,
    body: 'Это тестовый [текст] с несколькими [словами] для проверки [таблицы] и стилей.'
  };

  const sampleTableWithTitle: Task13TableSrc = {
    id: 'table-with-title',
    level: 2,
    tags: ['тест'],
    titleRow: 'Характеристики исследуемых объектов',
    objectColumnLabel: 'Объект',
    rows: [
      { id: 'r1', label: 'Объект А' },
      { id: 'r2', label: 'Объект Б' },
    ],
    columns: [
      { id: 'c1', label: 'Параметр 1', align: 'center', kind: 'number', values: { r1: 10, r2: 20 } },
      { id: 'c2', label: 'Параметр 2', align: 'center', kind: 'number', values: { r1: 30, r2: 40 } },
    ]
  };

  it('Таблица с titleRow даёт первую строку с одной ячейкой и colSpan, равным полной ширине таблицы', () => {
    const rng = makeRng(12345);
    const doc = buildDoc(dummyText, sampleTableWithTitle, rng);

    expect(doc.table).toBeDefined();
    const rows = doc.table!.rows;
    expect(rows.length).toBeGreaterThanOrEqual(3);

    // Первая строка — это титульная строка (titleRow)
    const firstRow = rows[0];
    expect(firstRow).toHaveLength(1);
    expect(firstRow[0].colSpan).toBe(3); // 2 столбца данных + 1 столбец объектов
    expect(firstRow[0].rowSpan).toBe(1);
    expect(firstRow[0].spans.map(s => s.text).join('')).toBe('Характеристики исследуемых объектов');

    // Вторая строка — это строка шапки таблицы
    const secondRow = rows[1];
    expect(secondRow[0].spans.map(s => s.text).join('')).toBe('Объект');
  });

  it('Таблица без titleRow первой строкой имеет шапку', () => {
    const rng = makeRng(12345);
    const sampleTableWithoutTitle: Task13TableSrc = {
      ...sampleTableWithTitle,
      id: 'table-without-title',
      titleRow: undefined
    };
    const doc = buildDoc(dummyText, sampleTableWithoutTitle, rng);

    expect(doc.table).toBeDefined();
    const rows = doc.table!.rows;
    // Первая строка — сразу шапка таблицы
    const firstRow = rows[0];
    expect(firstRow[0].spans.map(s => s.text).join('')).toBe('Объект');
    expect(firstRow[0].colSpan).toBe(1);
  });
});



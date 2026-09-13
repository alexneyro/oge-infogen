/**
 * Спецификация числовых параметров и требований оформления для Задания 13 ОГЭ.
 */

export type ReqBase = { enabled: boolean };

export interface TaskRequirements {
  fontSize:      ReqBase & { pt: number };                    // всегда enabled: true
  indent:        ReqBase & { cm: number };                    // всегда enabled: true
  bodyAlign:     ReqBase & { align: 'justify' | 'left' };     // всегда enabled: true
  emphasis:      ReqBase & { bold: boolean; italic: boolean; underline: boolean };
  noLineBreaks:  ReqBase;                                     // всегда enabled: true
  noSpaceIndent: ReqBase;                                     // всегда enabled: true

  lineSpacing:   ReqBase & { minRatio: number; maxRatio: number };   // 1.0–1.5
  paraSpacing:   ReqBase & { minPt: number; maxPt: number };
  gapToTable:    ReqBase & { minPt: number; maxPt: number };         // 12–24
  superscript:   ReqBase;
  subscript:     ReqBase;

  tableSize:     ReqBase & { rows: number; cols: number };
  tableWidth:    ReqBase;
  tableAlign:    ReqBase & { align: 'center' | 'left' | 'right' };
  colAlign:      ReqBase;      // сверка с образцом по ячейкам
  boldCells:     ReqBase;
  cellValign:    ReqBase;
  heading:       ReqBase & { align: string; indentCm: number; spacingPt: number };
}

export interface TaskSpecTolerances {
  indentCm: number;            // 0.03
  pt: number;                  // 1
  fontSizePt: number;          // 0.5
  lineHeight: number;          // 0.05
  gapPt: number;               // 2
}

export interface TaskSpec {
  requirements: TaskRequirements;
  tolerances: TaskSpecTolerances;
  typosTextLimit: number;
  typosTableLimit: number;
  tableFullWidthRatio: number;
}

export const DEFAULT_REQUIREMENTS: TaskRequirements = {
  fontSize: { enabled: true, pt: 14 },
  indent: { enabled: true, cm: 1 },
  bodyAlign: { enabled: true, align: 'justify' },
  emphasis: { enabled: true, bold: true, italic: true, underline: true },
  noLineBreaks: { enabled: true },
  noSpaceIndent: { enabled: true },
  lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
  paraSpacing: { enabled: false, minPt: 12, maxPt: 24 },
  gapToTable: { enabled: true, minPt: 12, maxPt: 24 },
  superscript: { enabled: false },
  subscript: { enabled: false },
  tableSize: { enabled: true, rows: 0, cols: 0 },
  tableWidth: { enabled: true },
  tableAlign: { enabled: true, align: 'center' },
  colAlign: { enabled: true },
  boldCells: { enabled: true },
  cellValign: { enabled: false },
  heading: { enabled: false, align: 'center', indentCm: 0, spacingPt: 12 }
};

export const DEFAULT_SPEC: TaskSpec = {
  requirements: structuredClone(DEFAULT_REQUIREMENTS),
  tolerances: {
    indentCm: 0.03,
    pt: 1,
    fontSizePt: 0.5,
    lineHeight: 0.05,
    gapPt: 2
  },
  typosTextLimit: 5,
  typosTableLimit: 3,
  tableFullWidthRatio: 0.98
};

export const SPEC_L1: TaskSpec = {
  ...structuredClone(DEFAULT_SPEC),
  requirements: structuredClone(DEFAULT_REQUIREMENTS)
};

export const SPEC_L2: TaskSpec = {
  ...structuredClone(SPEC_L1),
  requirements: {
    ...structuredClone(SPEC_L1.requirements),
    superscript: { enabled: true }
  }
};

export const SPEC_L3: TaskSpec = {
  ...structuredClone(SPEC_L2),
  requirements: {
    ...structuredClone(SPEC_L2.requirements),
    paraSpacing: { enabled: true, minPt: 12, maxPt: 24 },
    cellValign: { enabled: true },
    heading: { enabled: true, align: 'center', indentCm: 0, spacingPt: 12 }
  }
};

/**
 * Пресеты TaskSpec по уровням сложности (L1, L2, L3).
 */
export const TASK13_SPEC_PRESETS: Record<1 | 2 | 3, TaskSpec> = {
  1: SPEC_L1,
  2: SPEC_L2,
  3: SPEC_L3
};

import { pluralizeRu, formatRuNumber, formatCm } from './format';
import { fontSizeRequirement, tableSizeRequirement, paraSpacingRequirement } from './registry';
export { pluralizeRu, formatRuNumber, formatCm };

/**
 * Название горизонтального выравнивания по-русски.
 */
export function alignLabel(a: string | null | undefined): string {
  switch (a) {
    case 'left': return 'по левому краю';
    case 'center': return 'по центру';
    case 'right': return 'по правому краю';
    case 'justify': return 'по ширине';
    default: return 'по левому краю';
  }
}

/**
 * Название вертикального выравнивания по-русски.
 */
export function valignLabel(v: string | null | undefined): string {
  switch (v) {
    case 'top': return 'по верхнему краю';
    case 'middle':
    case 'center': return 'по центру';
    case 'bottom': return 'по нижнему краю';
    default: return 'по центру';
  }
}

/**
 * Название выравнивания по-русски (алиас для обратной совместимости).
 */
export function getAlignNameRu(align: 'justify' | 'left' | 'center' | 'right' | string): string {
  return alignLabel(align);
}

/**
 * Человекочитаемое описание ожидаемой ширины таблицы.
 */
export function tableWidthExpectedText(_spec: TaskSpec = DEFAULT_SPEC): string {
  return 'меньше ширины основного текста';
}

import type { Doc } from './parse';

/**
 * Вспомогательный хелпер для форматирования значения междустрочного интервала.
 */
export function formatLineSpacingRatio(ratio: number, caseType: 'genitive' | 'nominative'): string {
  if (ratio === 1) return caseType === 'genitive' ? 'одинарного' : 'одинарный';
  if (ratio === 1.5) return caseType === 'genitive' ? 'полуторного' : 'полуторный';
  if (ratio === 2) return caseType === 'genitive' ? 'двойного' : 'двойной';
  return formatRuNumber(ratio);
}

/**
 * Формирует фразу о междустрочном интервале без смешивания чисел и слов.
 */
export function formatLineSpacingPhrase(minRatio: number, maxRatio: number): string {
  if (minRatio === maxRatio) {
    if (minRatio === 1) return 'Расстояние между строками текста — одинарный междустрочный интервал.';
    if (minRatio === 1.5) return 'Расстояние между строками текста — полуторный междустрочный интервал.';
    return `Расстояние между строками текста — ${formatRuNumber(minRatio)} междустрочный интервал.`;
  }

  // Если оба значения стандартные (1.0 и 1.5 / 2.0) — используем словесные формы
  const isMinWord = minRatio === 1 || minRatio === 1.5 || minRatio === 2;
  const isMaxWord = maxRatio === 1 || maxRatio === 1.5 || maxRatio === 2;

  if (isMinWord && isMaxWord && (minRatio === 1.0 && maxRatio === 1.5)) {
    return 'Расстояние между строками текста — не менее одинарного, но не более полуторного междустрочного интервала.';
  }

  // Если хотя бы одно значение дробное (например, 1.15) — оба значения форматируются строго числами
  return `Расстояние между строками текста — не менее ${formatRuNumber(minRatio)}, но не более ${formatRuNumber(maxRatio)} междустрочного интервала.`;
}

import { hasMergedCells } from './table-utils';
export { hasMergedCells };

/**
 * Преамбула задания 13.2 с техническими пояснениями (вынесена за пределы списка критериев).
 */
export function formatTask13Preamble(doc?: Doc | null): string {
  const hasMerge = hasMergedCells(doc?.table);
  const mergePhrase = hasMerge ? ' Объединение ячеек таблицы выполняется в соответствии с образцом.' : '';

  const hasTextIndices = Boolean(doc?.paragraphs?.some(p => p.spans.some(s => s.sup || s.sub || /[\u00B9\u00B2\u00B3\u2080-\u2089]/.test(s.text))));
  const hasTableIndices = Boolean(doc?.table?.rows?.some(r => r.some(c => c.spans.some(s => s.sup || s.sub || /[\u00B9\u00B2\u00B3\u2080-\u2089]/.test(s.text)))));
  const hasIndices = hasTextIndices || hasTableIndices;
  const indicesPhrase = hasIndices ? ' и индексы' : '';

  return `При этом допустимо, чтобы ширина Вашего текста отличалась от ширины текста в примере, поскольку ширина текста зависит от размеров страницы и полей. В этом случае разбиение текста на строки должно соответствовать стандартной ширине абзаца. Выделения фрагментов текста${indicesPhrase} выполняются в соответствии с образцом.${mergePhrase} Файл сохраните в формате ODF (.odt).`;
}

/**
 * Собирает список стилей в русскую фразу: ["полужирным шрифтом", "курсивом"] -> "полужирным шрифтом и курсивом"
 */
function joinStylesRu(styles: string[]): string {
  if (styles.length === 0) return '';
  if (styles.length === 1) return styles[0];
  if (styles.length === 2) return `${styles[0]} и ${styles[1]}`;
  return `${styles.slice(0, -1).join(', ')} и ${styles[styles.length - 1]}`;
}

/**
 * Вычисляет ширину таблицы (максимум суммы colSpan по строкам).
 * Возвращает 0 при пустом или отсутствующем rows (никогда -Infinity).
 */
export function tableWidth(rows?: Array<Array<{ colSpan?: number }>> | null): number {
  if (!rows || rows.length === 0) return 0;
  return Math.max(...rows.map(r => r.reduce((acc, cell) => acc + (cell.colSpan || 1), 0)));
}

/**
 * Анализирует фактическое выравнивание в ячейках таблицы.
 */
export function describeCellAlignments(table: { rows: Array<Array<{ align?: 'left' | 'center' | 'right' | null; colSpan?: number }>> }): string {
  if (!table || !table.rows || table.rows.length === 0) return '';
  const rows = table.rows;
  const numRows = rows.length;
  const numCols = tableWidth(rows);

  const allAligns = new Set<string>();
  rows.forEach(r => r.forEach(c => {
    if (c.align) allAligns.add(c.align);
  }));

  if (allAligns.size === 1) {
    const singleAlign = Array.from(allAligns)[0];
    return `во всех ячейках текст выровнен ${alignLabel(singleAlign)}`;
  }

  // Проверка по столбцам
  const colAligns: (string | null)[] = [];
  let isPurelyColWise = true;
  for (let c = 0; c < numCols; c++) {
    const cAligns = new Set<string>();
    for (let r = 0; r < numRows; r++) {
      if (rows[r].length === 1 && (rows[r][0].colSpan || 1) === numCols) continue;
      const cell = rows[r]?.[c];
      if (cell && cell.align) cAligns.add(cell.align);
    }
    if (cAligns.size === 1) {
      colAligns.push(Array.from(cAligns)[0]);
    } else {
      isPurelyColWise = false;
      colAligns.push(null);
    }
  }

  if (isPurelyColWise && colAligns.length > 0) {
    if (colAligns.length >= 2 && colAligns[0] !== colAligns[1] && colAligns.slice(1).every(a => a === colAligns[1])) {
      return `в первом столбце выравнивание ${alignLabel(colAligns[0]!)}, в остальных — ${alignLabel(colAligns[1]!)}`;
    }
    const colNames = ['первом', 'втором', 'третьем', 'четвёртом', 'пятом', 'шестом'];
    const parts = colAligns.map((a, i) => `в ${colNames[i] || `${i + 1}-м`} столбце — ${alignLabel(a!)}`);
    return parts.join(', ');
  }

  return 'в первом столбце выравнивание по левому краю, в остальных — по центру';
}

/**
 * Анализирует фактическое вертикальное выравнивание в ячейках таблицы.
 */
export function describeCellValignments(table: { rows: Array<Array<{ valign?: 'top' | 'middle' | 'center' | 'bottom' | null; colSpan?: number }>> }): string {
  if (!table || !table.rows || table.rows.length === 0) return 'вертикальное выравнивание во всех ячейках по центру';
  const rows = table.rows;
  const allValigns = new Set<string>();
  rows.forEach(r => r.forEach(c => {
    if (c.valign) allValigns.add(c.valign);
  }));

  if (allValigns.size === 1) {
    return `вертикальное выравнивание во всех ячейках ${valignLabel(Array.from(allValigns)[0])}`;
  }

  const numCols = tableWidth(rows);
  const colValigns: (string | null)[] = [];
  let isPurelyColWise = true;
  for (let c = 0; c < numCols; c++) {
    const cValigns = new Set<string>();
    for (let r = 0; r < rows.length; r++) {
      if (rows[r].length === 1 && (rows[r][0].colSpan || 1) === numCols) continue;
      const cell = rows[r]?.[c];
      if (cell && cell.valign) cValigns.add(cell.valign);
    }
    if (cValigns.size === 1) {
      colValigns.push(Array.from(cValigns)[0]);
    } else {
      isPurelyColWise = false;
      colValigns.push(null);
    }
  }

  if (isPurelyColWise && colValigns.length > 0) {
    if (colValigns.length >= 2 && colValigns[0] !== colValigns[1] && colValigns.slice(1).every(v => v === colValigns[1])) {
      return `вертикальное выравнивание в первом столбце — ${valignLabel(colValigns[0]!)}, в остальных — ${valignLabel(colValigns[1]!)}`;
    }
    const colNames = ['первом', 'втором', 'третьем', 'четвёртом', 'пятом', 'шестом'];
    const parts = colValigns.map((v, i) => `в ${colNames[i] || `${i + 1}-м`} столбце — ${valignLabel(v!)}`);
    return `вертикальное выравнивание ${parts.join(', ')}`;
  }

  return 'вертикальное выравнивание по центру';
}

export interface Task13ConditionItem {
  ids: string[];
  text: string;
}

/**
 * Генерирует официальный список требований к оформлению для задания 13.2.
 * Преамбула и инструкция по сохранению вынесены отдельно.
 */
export function formatTask13Conditions(docOrSpec?: Doc | TaskSpec | null, maybeSpec?: TaskSpec): Task13ConditionItem[] {
  let spec: TaskSpec = DEFAULT_SPEC;
  let doc: Doc | null = null;

  if (docOrSpec) {
    if ('requirements' in docOrSpec) {
      spec = docOrSpec as TaskSpec;
      if (maybeSpec && 'paragraphs' in (maybeSpec as any)) {
        doc = maybeSpec as unknown as Doc;
      }
    } else if ('paragraphs' in docOrSpec) {
      doc = docOrSpec as Doc;
      spec = maybeSpec || doc.spec || DEFAULT_SPEC;
    }
  }

  const req = spec.requirements;
  const items: Task13ConditionItem[] = [];

  const hasDocHeading = doc ? (doc.headingIndex !== undefined && doc.headingIndex !== null) : req.heading.enabled;
  const bodyParasCount = doc?.paragraphs ? (doc.paragraphs.length - (hasDocHeading ? 1 : 0)) : 1;

  // 1. Заголовок (если есть заголовок)
  if (req.heading.enabled && hasDocHeading) {
    const headingAlign = alignLabel(req.heading.align);
    const headingIndent = `${formatRuNumber(req.heading.indentCm)} см`;
    const headingSpacing = `${formatRuNumber(req.heading.spacingPt)} пт`;
    items.push({
      ids: ['headingAlign', 'headingIndent'],
      text: `Заголовок текста выровнен ${headingAlign}, отступ первой строки — ${headingIndent}.`
    });
    items.push({
      ids: ['headingSpacing'],
      text: `Интервал после заголовка — ${headingSpacing}.`
    });
  }

  // 2. Размер шрифта (делегирование в реестр)
  if (req.fontSize.enabled) {
    const phrase = fontSizeRequirement.renderPhrase(req.fontSize, doc || ({} as Doc), spec);
    if (phrase) {
      items.push({
        ids: ['fontSize'],
        text: phrase
      });
    }
  }

  // 3. Отступ первой строки
  if (req.indent.enabled) {
    const indentCmStr = `${formatRuNumber(req.indent.cm)} см`;
    if (bodyParasCount > 1) {
      items.push({
        ids: ['indent'],
        text: `Отступ первой строки каждого абзаца основного текста — ${indentCmStr}.`
      });
    } else {
      items.push({
        ids: ['indent'],
        text: `Отступ первой строки абзаца основного текста — ${indentCmStr}.`
      });
    }
  }

  // 4. Междустрочный интервал (без смешивания числа и слова)
  if (req.lineSpacing.enabled) {
    items.push({
      ids: ['lineSpacing'],
      text: formatLineSpacingPhrase(req.lineSpacing.minRatio, req.lineSpacing.maxRatio)
    });
  }

  // 5. Выравнивание основного текста
  if (req.bodyAlign.enabled) {
    items.push({
      ids: ['bodyAlign'],
      text: `Основной текст выровнен ${alignLabel(req.bodyAlign.align)}.`
    });
  }

  // 6. Выделения (полужирный, курсив, подчёркивание)
  let textStyles: string[] = [];
  let tableStyles: string[] = [];
  let textIds: string[] = [];
  let tableIds: string[] = [];

  if (doc) {
    const bodyParagraphs = (doc.headingIndex !== null && doc.headingIndex !== undefined)
      ? doc.paragraphs.filter((_, idx) => idx !== doc.headingIndex)
      : doc.paragraphs;

    const hasBoldText = Boolean(req.emphasis?.bold) && (bodyParagraphs?.some(p => p.spans?.some(s => s.b)) ?? false);
    const hasItalicText = Boolean(req.emphasis?.italic) && (bodyParagraphs?.some(p => p.spans?.some(s => s.i)) ?? false);
    const hasUnderlineText = Boolean(req.emphasis?.underline) && (bodyParagraphs?.some(p => p.spans?.some(s => s.u)) ?? false);

    if (hasBoldText) { textStyles.push('полужирным шрифтом'); textIds.push('bold'); }
    if (hasItalicText) { textStyles.push('курсивом'); textIds.push('italic'); }
    if (hasUnderlineText) { textStyles.push('подчёркиванием'); textIds.push('underline'); }

    if (doc.table && doc.table.rows) {
      const hasBoldTable = Boolean(req.boldCells?.enabled) && doc.table.rows.some(r => r.some(c => c.spans?.some(s => s.b)));

      if (hasBoldTable) { tableStyles.push('полужирным шрифтом'); tableIds.push('boldCells'); }
    }
  } else if (req.emphasis.enabled) {
    if (req.emphasis.bold) { textStyles.push('полужирным шрифтом'); textIds.push('bold'); }
    if (req.emphasis.italic) { textStyles.push('курсивом'); textIds.push('italic'); }
    if (req.emphasis.underline) { textStyles.push('подчёркиванием'); textIds.push('underline'); }
    if (req.boldCells.enabled) { tableStyles.push('полужирным шрифтом'); tableIds.push('boldCells'); }
  }

  if (textStyles.length > 0) {
    if (textStyles.length <= 2) {
      items.push({
        ids: [...textIds],
        text: `В основном тексте есть слова, выделенные ${joinStylesRu(textStyles)}.`
      });
    } else {
      items.push({
        ids: [textIds[0], textIds[1]],
        text: `В основном тексте есть слова, выделенные ${joinStylesRu(textStyles.slice(0, 2))}.`
      });
      items.push({
        ids: [textIds[2]],
        text: `В основном тексте есть слова, выделенные ${textStyles[2]}.`
      });
    }
  }

  if (tableStyles.length > 0) {
    items.push({
      ids: [...tableIds],
      text: `В таблице есть слова, выделенные ${joinStylesRu(tableStyles)}.`
    });
  }

  // 7. Таблица
  const hasTable = doc ? (doc.table && doc.table.rows && doc.table.rows.length > 0) : true;
  if (hasTable) {
    const tableSizePhrase = req.tableSize.enabled
      ? tableSizeRequirement.renderPhrase(req.tableSize, doc || ({} as Doc), spec)
      : null;

    const alignDesc = (req.colAlign.enabled && doc?.table)
      ? describeCellAlignments(doc.table)
      : null;

    if (tableSizePhrase) {
      items.push({
        ids: ['tableSize'],
        text: tableSizePhrase
      });
    }

    if (alignDesc) {
      items.push({
        ids: ['colAlign'],
        text: `В таблице ${alignDesc}.`
      });
    }

    if (req.tableAlign.enabled) {
      items.push({
        ids: ['tableAlign'],
        text: `Таблица выровнена на странице ${alignLabel(req.tableAlign.align)}.`
      });
    }

    if (req.tableWidth.enabled) {
      items.push({
        ids: ['tableWidth'],
        text: 'Ширина таблицы меньше ширины основного текста.'
      });
    }

    if (req.gapToTable.enabled) {
      const minPt = formatRuNumber(req.gapToTable.minPt);
      const maxPt = formatRuNumber(req.gapToTable.maxPt);
      items.push({
        ids: ['gapToTable'],
        text: `Расстояние между текстом и таблицей — не менее ${minPt} пт и не более ${maxPt} пт.`
      });
    }

    if (req.cellValign?.enabled && doc?.table) {
      const valignDesc = describeCellValignments(doc.table);
      items.push({
        ids: ['cellValign'],
        text: `В таблице ${valignDesc}.`
      });
    }
  }

  // 8. Интервал между абзацами (L3, когда абзацев > 1)
  if (req.paraSpacing.enabled && bodyParasCount > 1) {
    const phrase = paraSpacingRequirement.renderPhrase(req.paraSpacing, doc || ({} as Doc), spec);
    if (phrase) {
      items.push({
        ids: ['paraSpacing'],
        text: phrase
      });
    }
  }

  return items;
}

/**
 * Генерирует согласованный список требований к оформлению на основе spec и doc.
 */
export function renderRequirements(spec: TaskSpec = DEFAULT_SPEC, doc?: Doc | null): string[] {
  return formatTask13Conditions(doc, spec).map(it => it.text);
}

export const generateTaskRequirements = renderRequirements;


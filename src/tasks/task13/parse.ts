import { RNG } from '../../utils/rng';
import { Task13TextSrc, Task13TableSrc } from '../../data/task13data';
import { TaskSpec, DEFAULT_SPEC, TASK13_SPEC_PRESETS } from './spec';
import {
  fontSizeRequirement,
  tableSizeRequirement,
  paraSpacingRequirement,
  indentRequirement,
  lineSpacingRequirement,
  bodyAlignRequirement,
  gapToTableRequirement,
  tableWidthRequirement
} from './registry';

export interface Span {
  text: string;
  b?: boolean;
  i?: boolean;
  u?: boolean;
  sup?: boolean;
  sub?: boolean;
  fontFamily?: string;
  fontSizePt?: number;
}

export interface Para {
  spans: Span[];
}

export interface Cell {
  spans: Span[];
  colSpan: number;
  rowSpan: number;
  align?: 'left' | 'center' | 'right' | null;
  valign?: 'top' | 'middle' | 'bottom' | null;
  hasLineBreak?: boolean;
}

export interface DocMeta {
  hasTotalsRow?: boolean;
  sourceHasTotalsRow?: boolean;
  hasSumCol?: boolean;
  leadingNonSumCount?: number;
}

export function buildDocMeta(tableSrc?: Task13TableSrc | null, selectedCols?: any[]): DocMeta {
  const hasSumCol = Boolean(selectedCols && selectedCols.some(col => col.total === 'sum'));
  const sourceHasTotalsRow = Boolean(tableSrc?.totalsRow);
  const hasTotalsRow = Boolean(sourceHasTotalsRow && hasSumCol);
  let leadingNonSumCount = 0;

  if (hasTotalsRow && selectedCols) {
    for (const col of selectedCols) {
      if (col.total === 'sum') {
        break;
      }
      leadingNonSumCount++;
    }
  }

  return {
    hasTotalsRow,
    sourceHasTotalsRow,
    hasSumCol,
    leadingNonSumCount: hasTotalsRow ? leadingNonSumCount : 0
  };
}

export interface Doc {
  headingIndex?: number | null;
  paragraphs: Para[];
  table: {
    rows: Cell[][];
  } | null;
  spec?: TaskSpec;
  meta?: DocMeta;
}

/**
 * Вспомогательная функция для разбора текста ячейки таблицы (поддержка ^индекса^).
 */
function parseCellSpans(text: string): Span[] {
  const spans: Span[] = [];
  const regex = /\^([^\^]+)\^|([^\^]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match[1] !== undefined) {
      spans.push({ text: match[1], sup: true });
    } else if (match[2] !== undefined) {
      spans.push({ text: match[2] });
    }
  }

  return spans.length > 0 ? spans : [{ text }];
}

/**
 * Разделяет тело текста на абзацы по маркерам '||' с учётом уровня сложности.
 */
function splitBodyIntoParagraphs(body: string, level: 1 | 2 | 3, rng: RNG): string[] {
  const parts = body.split('||').map(s => s.trim()).filter(s => s.length > 0);
  if (parts.length <= 1) {
    return parts.length === 1 ? parts : [body.replace(/\|\|/g, ' ').replace(/\s+/g, ' ').trim()];
  }

  const numBreaks = parts.length - 1;
  const breakDecisions: boolean[] = [];

  if (level === 1) {
    // L1: всегда 1 абзац (0 разрывов)
    for (let i = 0; i < numBreaks; i++) breakDecisions.push(false);
  } else if (level === 2) {
    // L2: 0 или 1 разрыв (1 или 2 абзаца)
    const shouldBreak = rng.int(0, 1) === 1;
    if (shouldBreak) {
      const breakIdx = rng.int(0, numBreaks - 1);
      for (let i = 0; i < numBreaks; i++) {
        breakDecisions.push(i === breakIdx);
      }
    } else {
      for (let i = 0; i < numBreaks; i++) breakDecisions.push(false);
    }
  } else {
    // L3: минимум 1 разрыв (2 и более абзацев)
    let anyBreak = false;
    for (let i = 0; i < numBreaks; i++) {
      const b = rng.int(0, 1) === 1;
      breakDecisions.push(b);
      if (b) anyBreak = true;
    }
    if (!anyBreak && numBreaks > 0) {
      const forcedIdx = rng.int(0, numBreaks - 1);
      breakDecisions[forcedIdx] = true;
    }
  }

  const result: string[] = [];
  let currentPara = parts[0];
  for (let i = 0; i < numBreaks; i++) {
    if (breakDecisions[i]) {
      result.push(currentPara);
      currentPara = parts[i + 1];
    } else {
      currentPara = currentPara + ' ' + parts[i + 1];
    }
  }
  result.push(currentPara);
  return result;
}

type OptKey =
  | 'b'
  | 'i'
  | 'u'
  | 'boldCells'
  | 'gapToTable'
  | 'tableAlign'
  | 'tableWidth'
  | 'paraSpacing'
  | 'heading'
  | 'cellValign'
  | 'colAlign';

function getConditionCount(
  selected: Set<OptKey>,
  hasHeading: boolean,
  parasCount: number,
  level: number
): number {
  let count = 5; // Core: fontSize, indent, lineSpacing, bodyAlign, tableSize
  if (selected.has('heading') && hasHeading) count += 2;
  let textStylesCount = 0;
  if (selected.has('b')) textStylesCount++;
  if (selected.has('i')) textStylesCount++;
  if (selected.has('u')) textStylesCount++;
  if (textStylesCount === 1 || textStylesCount === 2) count += 1;
  else if (textStylesCount === 3) count += 2;
  if (selected.has('boldCells')) count += 1;
  if (selected.has('colAlign')) count += 1;
  if (selected.has('tableAlign')) count += 1;
  if (selected.has('tableWidth')) count += 1;
  if (selected.has('gapToTable')) count += 1;
  if (selected.has('paraSpacing') && parasCount > 1) count += 1;
  if (selected.has('cellValign') && level === 3) count += 1;
  return count;
}

/**
 * Собирает структурированный документ Doc на основе описания текста и таблицы.
 */
export function buildDoc(textSrc: Task13TextSrc, tableSrc: Task13TableSrc, rng: RNG, customSpec?: Partial<TaskSpec>): Doc {
  const rawPreset = TASK13_SPEC_PRESETS[textSrc.level] || DEFAULT_SPEC;
  const basePreset: TaskSpec = structuredClone(rawPreset);
  const mergedSpec: TaskSpec = {
    ...basePreset,
    ...(customSpec ? structuredClone(customSpec) : {}),
    requirements: {
      ...basePreset.requirements,
      ...(customSpec?.requirements ? structuredClone(customSpec.requirements) : {})
    },
    tolerances: {
      ...basePreset.tolerances,
      ...(customSpec?.tolerances ? structuredClone(customSpec.tolerances) : {})
    }
  };

  // --- 1. РАЗБОР ТЕКСТА И ВЫБОР ОПЦИОНАЛЬНЫХ ТРЕБОВАНИЙ ПО СИДУ ---
  const rawParagraphs = splitBodyIntoParagraphs(textSrc.body, textSrc.level, rng);
  const parasCount = rawParagraphs.length;
  const canHaveHeading = Boolean(textSrc.hasHeading && textSrc.heading && textSrc.heading.trim().length > 0);

  // Целевое число пунктов формулировки (L1: 7..8, L2: 9..10, L3: 11..12)
  let targetCount = 8;
  if (textSrc.level === 1) targetCount = rng.pick([7, 8]);
  else if (textSrc.level === 2) targetCount = rng.pick([9, 10]);
  else targetCount = rng.pick([11, 12]);

  const selected = new Set<OptKey>();
  const eligible: OptKey[] = ['b', 'i', 'u', 'boldCells', 'gapToTable', 'tableAlign', 'tableWidth', 'colAlign'];
  if (canHaveHeading) eligible.push('heading');
  if (parasCount > 1) eligible.push('paraSpacing');
  if (textSrc.level === 3) eligible.push('cellValign');

  let attempts = 0;
  while (getConditionCount(selected, canHaveHeading, parasCount, textSrc.level) < targetCount && attempts < 100) {
    attempts++;
    const remaining = eligible.filter(k => !selected.has(k));
    if (remaining.length === 0) break;
    const candidate = rng.pick(remaining);
    const testSet = new Set(selected);
    testSet.add(candidate);
    const newCount = getConditionCount(testSet, canHaveHeading, parasCount, textSrc.level);
    if (newCount <= targetCount) {
      selected.add(candidate);
    }
  }

  // --- 2. ФОРМАТИРОВАНИЕ ТЕКСТА ПО ВЫБРАННЫМ СТИЛЯМ ---
  const chosenStyles: ('b' | 'i' | 'u')[] = [];
  if (selected.has('b')) chosenStyles.push('b');
  if (selected.has('i')) chosenStyles.push('i');
  if (selected.has('u')) chosenStyles.push('u');

  // Находим всех кандидатов [слово] во всех абзацах
  const candidateMatches: { paraIdx: number; text: string }[] = [];
  const candRegex = /\[([^\]]+)\]/g;
  rawParagraphs.forEach((paraText, paraIdx) => {
    let m: RegExpExecArray | null;
    while ((m = candRegex.exec(paraText)) !== null) {
      candidateMatches.push({ paraIdx, text: m[1] });
    }
  });

  const totalCandidates = candidateMatches.length;
  const candidateStyleMap = new Map<number, 'b' | 'i' | 'u'>();
  if (chosenStyles.length > 0 && totalCandidates > 0) {
    // Сколько слов выделять начертанием — зависит от уровня:
    // L1: 3–6, L2: 5–8, L3: 7–15 (не больше числа кандидатов [слово])
    const levelRanges: Record<1 | 2 | 3, [number, number]> = {
      1: [3, 6],
      2: [5, 8],
      3: [7, 15]
    };
    const [minWords, maxWords] = levelRanges[textSrc.level] || levelRanges[1];
    const numWordsToFormat = Math.max(
      chosenStyles.length,
      Math.min(maxWords, totalCandidates >= minWords ? rng.int(minWords, maxWords) : totalCandidates)
    );
    const indices = Array.from({ length: totalCandidates }, (_, i) => i);
    const shuffledIndices = rng.shuffle(indices);
    const chosenIndices = shuffledIndices.slice(0, Math.min(numWordsToFormat, totalCandidates));

    const stylesPool: ('b' | 'i' | 'u')[] = [...chosenStyles];
    while (stylesPool.length < chosenIndices.length) {
      stylesPool.push(rng.pick(chosenStyles));
    }
    const assignedStyles = rng.shuffle(stylesPool);

    chosenIndices.forEach((candIdx, i) => {
      candidateStyleMap.set(candIdx, assignedStyles[i]);
    });
  }

  // Строим итоговые абзацы и спаны
  let globalCandCounter = 0;
  const bodyParagraphs: Para[] = rawParagraphs.map(paraText => {
    const spans: Span[] = [];
    const tokenRegex = /\[([^\]]+)\]|\^([^\^]+)\^|([^\[\^]+)/g;
    let tokenMatch: RegExpExecArray | null;

    while ((tokenMatch = tokenRegex.exec(paraText)) !== null) {
      if (tokenMatch[1] !== undefined) {
        // Кандидат [слово]
        const candText = tokenMatch[1];
        const currentIdx = globalCandCounter++;
        const style = candidateStyleMap.get(currentIdx);

        if (style) {
          spans.push({
            text: candText,
            b: style === 'b',
            i: style === 'i',
            u: style === 'u'
          });
        } else {
          spans.push({ text: candText });
        }
      } else if (tokenMatch[2] !== undefined) {
        // Верхний индекс ^3^
        spans.push({ text: tokenMatch[2], sup: true });
      } else if (tokenMatch[3] !== undefined) {
        // Обычный текст
        spans.push({ text: tokenMatch[3] });
      }
    }

    return { spans };
  });

  // Обработка заголовка (только если выбрано heading)
  const hasHeading = selected.has('heading') && canHaveHeading;
  let headingIndex: number | null = null;
  const paragraphs: Para[] = [];

  if (hasHeading) {
    headingIndex = 0;
    paragraphs.push({
      spans: [{ text: textSrc.heading!.trim(), b: true }]
    });
  }
  paragraphs.push(...bodyParagraphs);

  // --- 3. РАЗБОР И ВЫЧИСЛЕНИЕ ЯЧЕЕК ТАБЛИЦЫ ---
  const objectColumnHeader = tableSrc.objectColumnLabel || 'Название';

  // Выбираем строки и столбцы с учётом уровня сложности по сиду
  const numAvailableRows = tableSrc.rows.length;
  let minRows = 2;
  let maxRows = 5;
  if (textSrc.level === 1) {
    minRows = 2;
    maxRows = Math.min(3, numAvailableRows);
  } else if (textSrc.level === 2) {
    minRows = 2;
    maxRows = Math.min(4, numAvailableRows);
  } else {
    minRows = Math.min(3, numAvailableRows);
    maxRows = Math.min(5, numAvailableRows);
  }
  minRows = Math.min(minRows, numAvailableRows);
  maxRows = Math.max(minRows, maxRows);
  const targetRowCount = rng.int(minRows, maxRows);

  const allRowIndices = Array.from({ length: numAvailableRows }, (_, i) => i);
  const shuffledRowIndices = rng.shuffle(allRowIndices).sort((a, b) => a - b);
  let selectedRowIndices = shuffledRowIndices.slice(0, targetRowCount).sort((a, b) => a - b);
  let selectedRows = selectedRowIndices.map(i => tableSrc.rows[i]);

  const numAvailableCols = tableSrc.columns.length;
  let minAddCols = 1;
  let maxAddCols = 3;
  if (textSrc.level === 1) {
    minAddCols = 1;
    maxAddCols = Math.min(2, numAvailableCols);
  } else if (textSrc.level === 2) {
    minAddCols = 1;
    maxAddCols = Math.min(3, numAvailableCols);
  } else {
    minAddCols = Math.min(2, numAvailableCols);
    maxAddCols = Math.min(3, numAvailableCols);
  }
  minAddCols = Math.min(minAddCols, numAvailableCols);
  maxAddCols = Math.max(minAddCols, maxAddCols);
  const targetAddColCount = rng.int(minAddCols, maxAddCols);

  const allColIndices = Array.from({ length: numAvailableCols }, (_, i) => i);
  const selectedColIndices = rng.shuffle(allColIndices).slice(0, targetAddColCount).sort((a, b) => a - b);
  const selectedCols = selectedColIndices.map(i => tableSrc.columns[i]);

  // 3.0. Учёт итоговой строки: не более 7 строк всего (шапка + данные + итого)
  const willAddTotals = Boolean(tableSrc.totalsRow && selectedCols.some(c => c.total === 'sum'));
  const activeGroupsPreview = (tableSrc.headerGroups || []).filter(
    g => g.columnIds.filter(cid => selectedCols.some(sc => sc.id === cid)).length >= 2
  );
  const headerRowCount = (tableSrc.titleRow ? 1 : 0) + (activeGroupsPreview.length > 0 ? 2 : 1);
  const maxDataRowsAllowed = 7 - headerRowCount - (willAddTotals ? 1 : 0);
  if (maxDataRowsAllowed < selectedRowIndices.length) {
    selectedRowIndices = shuffledRowIndices.slice(0, Math.min(maxDataRowsAllowed, targetRowCount)).sort((a, b) => a - b);
    selectedRows = selectedRowIndices.map(i => tableSrc.rows[i]);
  }

  // 3.1. Вычисляем фактические значения ячеек (числа, диапазоны, текст)
  const evaluatedCellValues: Record<string, Record<string, number | string>> = {};
  for (const row of selectedRows) {
    evaluatedCellValues[row.id] = {};
    for (const col of selectedCols) {
      const val = col.values[row.id];
      if (typeof val === 'object' && val !== null) {
        const stepsCount = Math.floor((val.max - val.min) / val.step);
        const randomStep = rng.int(0, stepsCount);
        evaluatedCellValues[row.id][col.id] = val.min + randomStep * val.step;
      } else if (typeof val === 'number') {
        evaluatedCellValues[row.id][col.id] = val;
      } else {
        evaluatedCellValues[row.id][col.id] = val ?? '';
      }
    }
  }

  // 3.2. Вычисляем автосуммы для столбцов с total: 'sum'
  const evaluatedTotals: Record<string, number> = {};
  for (const col of selectedCols) {
    if (col.total === 'sum') {
      let sum = 0;
      for (const row of selectedRows) {
        const val = evaluatedCellValues[row.id][col.id];
        if (typeof val === 'number') {
          sum += val;
        } else if (typeof val === 'string') {
          const num = parseInt(val.replace(/[\s\u00A0]/g, ''), 10);
          if (!isNaN(num)) sum += num;
        }
      }
      evaluatedTotals[col.id] = sum;
    }
  }

  // 3.3. Форматирование чисел по фактическим значениям столбца (разрядный пробел)
  const formattedStrings: Record<string, Record<string, string>> = {};
  for (const row of selectedRows) {
    formattedStrings[row.id] = {};
  }
  const formattedTotalsStrings: Record<string, string> = {};

  for (const col of selectedCols) {
    const isYearCol = /год|запуск/i.test(col.label);

    // Собираем все числа столбца
    const numbersInCol: { val: number; isYear: boolean }[] = [];
    for (const row of selectedRows) {
      const v = evaluatedCellValues[row.id][col.id];
      if (typeof v === 'number') {
        const isYear = isYearCol && v >= 1000 && v <= 2999;
        numbersInCol.push({ val: v, isYear });
      }
    }
    if (col.total === 'sum' && evaluatedTotals[col.id] !== undefined) {
      numbersInCol.push({ val: evaluatedTotals[col.id], isYear: false });
    }

    const nonYearNums = numbersInCol.filter(n => !n.isYear);
    const hasFiveOrMoreDigits = nonYearNums.some(n => Math.abs(n.val) >= 10000);

    const formatNum = (numVal: number, isYear: boolean): string => {
      if (isYear) return numVal.toString();
      if (hasFiveOrMoreDigits && Math.abs(numVal) >= 1000) {
        return numVal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      }
      return numVal.toString();
    };

    for (const row of selectedRows) {
      const rawVal = evaluatedCellValues[row.id][col.id];
      if (typeof rawVal === 'number') {
        const isYear = isYearCol && rawVal >= 1000 && rawVal <= 2999;
        formattedStrings[row.id][col.id] = formatNum(rawVal, isYear);
      } else {
        formattedStrings[row.id][col.id] = String(rawVal);
      }
    }

    if (col.total === 'sum' && evaluatedTotals[col.id] !== undefined) {
      formattedTotalsStrings[col.id] = formatNum(evaluatedTotals[col.id], false);
    }
  }

  // 3.4. Сборка строк и ячеек таблицы
  const hasBoldCells = selected.has('boldCells');
  const hasColAlign = selected.has('colAlign');
  const hasCellValign = selected.has('cellValign') && textSrc.level === 3;

  const tableRows: Cell[][] = [];

  // Заголовок таблицы (titleRow)
  if (tableSrc.titleRow) {
    tableRows.push([
      {
        spans: parseCellSpans(tableSrc.titleRow).map(s => ({ ...s, b: hasBoldCells })),
        colSpan: selectedCols.length + 1,
        rowSpan: 1,
        align: 'center',
        valign: hasCellValign ? 'middle' : null
      }
    ]);
  }

  const activeHeaderGroups = (tableSrc.headerGroups || []).filter(group => {
    const colsInGroup = group.columnIds.filter(cid => selectedCols.some(sc => sc.id === cid));
    return colsInGroup.length >= 2;
  });
  const hasHeaderGroups = activeHeaderGroups.length > 0;

  if (hasHeaderGroups) {
    // Двухуровневая шапка: Строка 1
    const headerRow1: Cell[] = [
      {
        spans: [{ text: objectColumnHeader, b: hasBoldCells }],
        colSpan: 1,
        rowSpan: 2,
        align: hasColAlign ? 'left' : 'center',
        valign: hasCellValign ? 'middle' : null
      }
    ];

    const visitedGroupLabels = new Set<string>();
    for (const col of selectedCols) {
      const group = activeHeaderGroups.find(g => g.columnIds.includes(col.id));
      if (group) {
        if (!visitedGroupLabels.has(group.label)) {
          visitedGroupLabels.add(group.label);
          const groupColSpan = group.columnIds.filter(cid => selectedCols.some(sc => sc.id === cid)).length;
          headerRow1.push({
            spans: parseCellSpans(group.label).map(s => ({ ...s, b: hasBoldCells })),
            colSpan: groupColSpan,
            rowSpan: 1,
            align: 'center',
            valign: hasCellValign ? 'middle' : null
          });
        }
      } else {
        const headerText = col.unit ? `${col.label}, ${col.unit}` : col.label;
        headerRow1.push({
          spans: parseCellSpans(headerText).map(s => ({ ...s, b: hasBoldCells })),
          colSpan: 1,
          rowSpan: 2,
          align: 'center',
          valign: hasCellValign ? (col.valign || 'middle') : null
        });
      }
    }
    tableRows.push(headerRow1);

    // Двухуровневая шапка: Строка 2
    const headerRow2: Cell[] = [];
    for (const col of selectedCols) {
      const group = activeHeaderGroups.find(g => g.columnIds.includes(col.id));
      if (group) {
        const headerText = col.unit ? `${col.label}, ${col.unit}` : col.label;
        headerRow2.push({
          spans: parseCellSpans(headerText).map(s => ({ ...s, b: hasBoldCells })),
          colSpan: 1,
          rowSpan: 1,
          align: 'center',
          valign: hasCellValign ? (col.valign || 'middle') : null
        });
      }
    }
    if (headerRow2.length > 0) {
      tableRows.push(headerRow2);
    }
  } else {
    // Одноуровневая шапка
    const headerRow: Cell[] = [
      {
        spans: [{ text: objectColumnHeader, b: hasBoldCells }],
        colSpan: 1,
        rowSpan: 1,
        align: hasColAlign ? 'left' : 'center',
        valign: hasCellValign ? 'middle' : null
      }
    ];
    for (const col of selectedCols) {
      const headerText = col.unit ? `${col.label}, ${col.unit}` : col.label;
      headerRow.push({
        spans: parseCellSpans(headerText).map(s => ({ ...s, b: hasBoldCells })),
        colSpan: 1,
        rowSpan: 1,
        align: 'center',
        valign: hasCellValign ? (col.valign || 'middle') : null
      });
    }
    tableRows.push(headerRow);
  }

  // Строки данных
  for (const row of selectedRows) {
    const dataRowCells: Cell[] = [
      {
        spans: [{ text: row.label }],
        colSpan: 1,
        rowSpan: 1,
        align: hasColAlign ? 'left' : 'center',
        valign: hasCellValign ? 'middle' : null
      }
    ];
    for (const col of selectedCols) {
      const valStr = formattedStrings[row.id][col.id];
      dataRowCells.push({
        spans: parseCellSpans(valStr),
        colSpan: 1,
        rowSpan: 1,
        align: col.align || 'center',
        valign: hasCellValign ? (col.valign || 'middle') : null
      });
    }
    tableRows.push(dataRowCells);
  }

  // Итоговая строка (totalsRow)
  const meta = buildDocMeta(tableSrc, selectedCols);

  if (meta.hasTotalsRow) {
    const firstCellColSpan = 1 + (meta.leadingNonSumCount || 0);

    const totalRowCells: Cell[] = [
      {
        spans: [{ text: tableSrc.totalsRow!.label, b: hasBoldCells }],
        colSpan: firstCellColSpan,
        rowSpan: 1,
        align: hasColAlign ? 'left' : 'center',
        valign: hasCellValign ? 'middle' : null
      }
    ];

    // Добавляем оставшиеся столбцы (все они являются суммовыми)
    const colsAfterLeading = selectedCols.slice(meta.leadingNonSumCount || 0);
    for (const col of colsAfterLeading) {
      const sumStr = formattedTotalsStrings[col.id] || '0';
      totalRowCells.push({
        spans: parseCellSpans(sumStr).map(s => ({ ...s, b: hasBoldCells })),
        colSpan: 1,
        rowSpan: 1,
        align: 'center',
        valign: hasCellValign ? 'middle' : null
      });
    }

    tableRows.push(totalRowCells);
  }

  // --- 4. СИНХРОНИЗАЦИЯ ТРЕБОВАНИЙ SPEC ---
  const hasTable = tableRows.length > 0;
  const tempDocForGen: Doc = {
    headingIndex: hasHeading ? 0 : null,
    paragraphs,
    table: hasTable ? {
      rows: tableRows
    } : null,
    meta
  };

  // ЯДРО ТРЕБОВАНИЙ (объявляется и проверяется всегда)
  mergedSpec.requirements.fontSize = fontSizeRequirement.generateValue(rng, tempDocForGen);
  mergedSpec.requirements.indent = indentRequirement.generateValue(rng, tempDocForGen);
  mergedSpec.requirements.bodyAlign = bodyAlignRequirement.generateValue(rng, tempDocForGen);
  mergedSpec.requirements.lineSpacing = lineSpacingRequirement.generateValue(rng, tempDocForGen);
  mergedSpec.requirements.tableSize = tableSizeRequirement.generateValue(rng, tempDocForGen);

  // ОПЦИОНАЛЬНЫЕ ТРЕБОВАНИЯ
  mergedSpec.requirements.emphasis = {
    enabled: chosenStyles.length > 0,
    bold: selected.has('b'),
    italic: selected.has('i'),
    underline: selected.has('u')
  };
  mergedSpec.requirements.boldCells = {
    enabled: hasBoldCells
  };
  mergedSpec.requirements.noLineBreaks = { enabled: true };
  mergedSpec.requirements.noSpaceIndent = { enabled: true };

  mergedSpec.requirements.heading = hasHeading
    ? {
        enabled: true,
        align: 'center',
        indentCm: 0,
        spacingPt: rng.pick([6, 12])
      }
    : {
        enabled: false,
        align: 'center',
        indentCm: 0,
        spacingPt: 12
      };

  mergedSpec.requirements.gapToTable = selected.has('gapToTable')
    ? gapToTableRequirement.generateValue(rng, tempDocForGen)
    : { enabled: false, minPt: 18, maxPt: 24 };

  mergedSpec.requirements.tableAlign = selected.has('tableAlign')
    ? { enabled: true, align: 'center' }
    : { enabled: false, align: 'center' };

  mergedSpec.requirements.tableWidth = selected.has('tableWidth')
    ? { enabled: true }
    : { enabled: false };

  mergedSpec.requirements.colAlign = selected.has('colAlign')
    ? { enabled: true }
    : { enabled: false };

  mergedSpec.requirements.cellValign = (selected.has('cellValign') && textSrc.level === 3)
    ? { enabled: true }
    : { enabled: false };

  mergedSpec.requirements.paraSpacing = (selected.has('paraSpacing') && parasCount > 1)
    ? paraSpacingRequirement.generateValue(rng, tempDocForGen, mergedSpec)
    : { enabled: false, minPt: 6, maxPt: 12 };

  // Индексы: требование включается только если в образце есть верхний/нижний индекс
  // (правило spec.md: «нет индексов — нет требования к индексам»)
  const hasDocSup = paragraphs.some(p => p.spans.some(s => s.sup)) ||
    tableRows.some(r => r.some(c => c.spans.some(s => s.sup)));
  const hasDocSub = paragraphs.some(p => p.spans.some(s => s.sub)) ||
    tableRows.some(r => r.some(c => c.spans.some(s => s.sub)));
  mergedSpec.requirements.superscript = { enabled: hasDocSup };
  mergedSpec.requirements.subscript = { enabled: hasDocSub };

  // Обеспечиваем непересечение интервалов: gapToTable.minPt > paraSpacing.maxPt
  if (mergedSpec.requirements.gapToTable.enabled && mergedSpec.requirements.paraSpacing.enabled) {
    if (mergedSpec.requirements.gapToTable.minPt <= mergedSpec.requirements.paraSpacing.maxPt) {
      mergedSpec.requirements.gapToTable.minPt = mergedSpec.requirements.paraSpacing.maxPt + 6;
      mergedSpec.requirements.gapToTable.maxPt = mergedSpec.requirements.gapToTable.minPt + 6;
    }
  }

  // Если передан customSpec с явными требованиями — применяем их поверх
  if (customSpec?.requirements) {
    Object.entries(customSpec.requirements).forEach(([key, val]) => {
      if (val !== undefined) {
        (mergedSpec.requirements as any)[key] = val;
      }
    });
  }

  return {
    headingIndex: hasHeading ? 0 : null,
    paragraphs,
    table: tableRows.length > 0 ? {
      rows: tableRows
    } : null,
    spec: mergedSpec,
    meta
  };
}

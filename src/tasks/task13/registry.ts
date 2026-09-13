import { RNG } from '../../utils/rng';
import { Doc, Para, Cell } from './parse';
import { PastedDoc } from './html';
import { TaskSpec, TaskSpecTolerances, DEFAULT_SPEC, alignLabel, formatLineSpacingPhrase } from './spec';
import { CritResult, MarkLocation } from './check';
import { formatRuNumber, pluralizeRu } from './format';

export interface RequirementDefinition<T = any> {
  id: string;
  unit: string;
  group: 'text' | 'table' | 'info';
  declare: 'text' | 'trap' | 'none';
  formulationPoint: string;
  isCore: boolean;
  isEligible: (doc: Doc, spec?: TaskSpec) => boolean;
  generateValue: (rng: RNG, doc: Doc, currentReqs?: any) => T;
  renderPhrase: (value: T, doc: Doc, spec?: TaskSpec) => string | null;
  check: (
    value: T,
    pasted: PastedDoc,
    doc: Doc,
    tolerances: TaskSpecTolerances,
    spec?: TaskSpec
  ) => CritResult;
}

// 1. tableSize Requirement
export const tableSizeRequirement: RequirementDefinition<{ rows: number; cols: number; enabled: boolean }> = {
  id: 'tableSize',
  unit: 'tableSize',
  group: 'table',
  declare: 'text',
  formulationPoint: 'Размер таблицы (строки и столбцы)',
  isCore: true,
  isEligible: (doc: Doc) => Boolean(doc.table && doc.table.rows && doc.table.rows.length > 0),
  generateValue: (_rng: RNG, doc: Doc) => {
    const hasTable = Boolean(doc.table && doc.table.rows && doc.table.rows.length > 0);
    const rows = doc.table?.rows.length || 0;
    const cols = doc.table && doc.table.rows.length > 0
      ? Math.max(...doc.table.rows.map((r: Cell[]) => r.reduce((acc: number, c: Cell) => acc + (c.colSpan || 1), 0)))
      : 0;
    return {
      enabled: hasTable,
      rows,
      cols
    };
  },
  renderPhrase: (value: { rows: number; cols: number; enabled: boolean }, doc: Doc) => {
    if (!value.enabled && (!doc.table || !doc.table.rows || doc.table.rows.length === 0)) return null;
    const numRows = doc.table?.rows.length || value.rows;
    const numCols = doc.table && doc.table.rows.length > 0
      ? Math.max(...doc.table.rows.map((r: Cell[]) => r.reduce((acc: number, c: Cell) => acc + (c.colSpan || 1), 0)))
      : value.cols;
    const rowsWord = pluralizeRu(numRows, 'строку', 'строки', 'строк');
    const colsWord = pluralizeRu(numCols, 'столбец', 'столбца', 'столбцов');
    return `Таблица содержит ${numRows} ${rowsWord} и ${numCols} ${colsWord}.`;
  },
  check: (value, pasted, doc, _tolerances) => {
    const targetRows = doc.table ? doc.table.rows.length : (value?.rows || 0);
    const targetCols = doc.table
      ? Math.max(...doc.table.rows.map((r: Cell[]) => r.reduce((acc: number, cell: Cell) => acc + (cell.colSpan || 1), 0)))
      : (value?.cols || 0);

    const pastedRows = pasted.table?.rows ? pasted.table.rows.length : 0;
    const pastedCols = pasted.table?.rows && pasted.table.rows.length > 0
      ? Math.max(...pasted.table.rows.map(r => r.reduce((acc, cell) => acc + (cell.colSpan || 1), 0)))
      : 0;

    const isTableSizeOk = (pastedRows === targetRows && pastedCols === targetCols);

    return {
      id: 'tableSize',
      label: 'Размер таблицы',
      status: isTableSizeOk ? 'ok' : 'fail',
      expected: `${targetRows}×${targetCols}`,
      actual: `${pastedRows}×${pastedCols}`,
      group: 'table',
      unit: 'tableSize',
      hintPath: 'Таблица → Размер таблицы'
    };
  }
};

// 2. fontSize Requirement
export const fontSizeRequirement: RequirementDefinition<{ pt: number; enabled: boolean }> = {
  id: 'fontSize',
  unit: 'fontSize',
  group: 'text',
  declare: 'text',
  formulationPoint: 'Размер шрифта основного текста',
  isCore: true,
  isEligible: (_doc: Doc) => true,
  generateValue: (rng: RNG) => {
    const pt = rng.pick([12, 13, 14]);
    return {
      enabled: true,
      pt
    };
  },
  renderPhrase: (value) => {
    const fontPtStr = `${formatRuNumber(value.pt)} ${pluralizeRu(value.pt, 'пункт', 'пункта', 'пунктов')}`;
    return `Данный текст должен быть набран шрифтом размером ${fontPtStr} обычного начертания.`;
  },
  check: (value, pasted, _doc, tolerances) => {
    const expectedFontStr = `${formatRuNumber(value.pt)} пт`;
    const nonNullSizes = (pasted.fontSizes || []).filter((s: number | null): s is number => s !== null);

    if (!pasted.fontSizes || pasted.fontSizes.length === 0 || nonNullSizes.length === 0) {
      if (pasted.generator === 'libreoffice') {
        return {
          id: 'fontSize',
          label: `Размер шрифта ${expectedFontStr}`,
          status: 'fail',
          expected: expectedFontStr,
          actual: 'размер шрифта не изменён (используется размер по умолчанию)',
          group: 'text',
          unit: 'fontSize',
          hintPath: `Формат → Шрифт → Размер (${value.pt} pt)`
        };
      } else {
        return {
          id: 'fontSize',
          label: `Размер шрифта ${expectedFontStr}`,
          status: 'unknown',
          unknownReason: 'unparsed',
          expected: expectedFontStr,
          actual: 'не удалось определить',
          group: 'text',
          unit: 'fontSize',
          hintPath: `Формат → Шрифт → Размер (${value.pt} pt)`
        };
      }
    }

    const wrongSize = nonNullSizes.find((s: number) => Math.abs(s - value.pt) > tolerances.fontSizePt);
    if (wrongSize !== undefined) {
      const badParas: MarkLocation[] = [];
      pasted.fontSizes.forEach((s: number | null, idx: number) => {
        if (s !== null && Math.abs(s - value.pt) > tolerances.fontSizePt) {
          badParas.push({ kind: 'para', para: idx });
        }
      });
      return {
        id: 'fontSize',
        label: `Размер шрифта ${expectedFontStr}`,
        status: 'fail',
        expected: expectedFontStr,
        actual: `${formatRuNumber(wrongSize)} пт`,
        group: 'text',
        unit: 'fontSize',
        hintPath: `Формат → Шрифт → Размер (${value.pt} pt)`,
        marks: badParas
      };
    }

    return {
      id: 'fontSize',
      label: `Размер шрифта ${expectedFontStr}`,
      status: 'ok',
      expected: expectedFontStr,
      actual: expectedFontStr,
      group: 'text',
      unit: 'fontSize',
      hintPath: `Формат → Шрифт → Размер (${value.pt} pt)`
    };
  }
};

// 3. paraSpacing Requirement
export const paraSpacingRequirement: RequirementDefinition<{ minPt: number; maxPt: number; enabled: boolean }> = {
  id: 'paraSpacing',
  unit: 'paraSpacing',
  group: 'text',
  declare: 'text',
  formulationPoint: 'Интервал между абзацами текста',
  isCore: false,
  isEligible: (doc: Doc) => {
    const hasDocHeading = doc.headingIndex !== undefined && doc.headingIndex !== null;
    const bodyParasCount = doc.paragraphs ? (doc.paragraphs.length - (hasDocHeading ? 1 : 0)) : 1;
    return bodyParasCount > 1;
  },
  generateValue: (rng: RNG, _doc: Doc) => {
    const minPt = rng.pick([4, 6]);
    const maxPt = rng.pick([10, 12]);
    return {
      enabled: true,
      minPt,
      maxPt
    };
  },
  renderPhrase: (value, doc) => {
    const hasDocHeading = doc ? (doc.headingIndex !== undefined && doc.headingIndex !== null) : false;
    const bodyParasCount = doc?.paragraphs ? (doc.paragraphs.length - (hasDocHeading ? 1 : 0)) : 1;
    if (!value.enabled || bodyParasCount <= 1) return null;
    const minPtStr = formatRuNumber(value.minPt);
    const maxPtStr = formatRuNumber(value.maxPt);
    return `Интервал между абзацами текста — не менее ${minPtStr} пт и не более ${maxPtStr} пт.`;
  },
  check: (value, pasted, doc, tolerances) => {
    const targetHasHeading = doc.headingIndex !== undefined && doc.headingIndex !== null;
    const bodyStartParaIdx = (targetHasHeading && pasted.headingIndex !== null && pasted.headingIndex !== undefined)
      ? (pasted.headingIndex + 1)
      : 0;
    const bodyStartGapIdx = bodyStartParaIdx;
    const gapsToCheck = (pasted.paraGaps || []).slice(bodyStartGapIdx);

    const minPt = value.minPt;
    const maxPt = value.maxPt;
    const tol = tolerances.gapPt;
    const inRange = (v: number) => v >= (minPt - tol) && v <= (maxPt + tol);
    const useSum = pasted.generator === 'libreoffice' || pasted.generator === 'word';

    const badGaps: { para1: number; para2: number; eff: number; gapIdx: number }[] = [];
    const allEffs: number[] = [];

    gapsToCheck.forEach((g: { max: number; sum: number }, idx: number) => {
      const eff = useSum ? g.sum : (inRange(g.sum) ? g.sum : g.max);
      allEffs.push(eff);
      const ok = inRange(eff);
      if (!ok) {
        const p1 = bodyStartGapIdx + idx + 1;
        const p2 = p1 + 1;
        badGaps.push({ para1: p1, para2: p2, eff, gapIdx: bodyStartGapIdx + idx });
      }
    });

    const expParaSpacingStr = `от ${formatRuNumber(minPt)} до ${formatRuNumber(maxPt)} пт между абзацами`;
    if (badGaps.length === 0) {
      let actualStr = '';
      if (allEffs.length === 1) {
        actualStr = `${Math.round(allEffs[0])} пт`;
      } else if (allEffs.length > 1) {
        const minEff = Math.round(Math.min(...allEffs));
        const maxEff = Math.round(Math.max(...allEffs));
        actualStr = minEff === maxEff ? `${minEff} пт` : `${minEff}–${maxEff} пт`;
      } else {
        actualStr = '1 абзац';
      }

      return {
        id: 'paraSpacing',
        label: `Интервал между абзацами (${formatRuNumber(minPt)}–${formatRuNumber(maxPt)} пт)`,
        status: 'ok',
        expected: expParaSpacingStr,
        actual: actualStr,
        group: 'text',
        unit: 'paraSpacing',
        hintPath: 'Формат → Абзац → Отступы и интервалы (перед/после абзаца)'
      };
    } else {
      const formattedBad = badGaps.map(b => `между абзацами ${b.para1} и ${b.para2}: ${Math.round(b.eff)} пт`);
      let actualStr = '';
      if (formattedBad.length <= 3) {
        actualStr = formattedBad.join('; ');
      } else {
        actualStr = `${formattedBad.slice(0, 3).join('; ')} и ещё ${formattedBad.length - 3}`;
      }

      const marks: MarkLocation[] = badGaps.map(b => ({ kind: 'para', para: b.gapIdx }));

      return {
        id: 'paraSpacing',
        label: `Интервал между абзацами (${formatRuNumber(minPt)}–${formatRuNumber(maxPt)} пт)`,
        status: 'fail',
        expected: expParaSpacingStr,
        actual: actualStr,
        group: 'text',
        unit: 'paraSpacing',
        hintPath: 'Формат → Абзац → Отступы и интервалы (перед/после абзаца)',
        marks
      };
    }
  }
};

// 4. indent Requirement
export const indentRequirement: RequirementDefinition<{ cm: number; enabled: boolean }> = {
  id: 'indent',
  unit: 'indent',
  group: 'text',
  declare: 'text',
  formulationPoint: 'Отступ первой строки (красная строка)',
  isCore: true,
  isEligible: (_doc: Doc) => true,
  generateValue: (rng: RNG) => {
    const cm = rng.pick([1.0, 1.25, 1.5]);
    return {
      enabled: true,
      cm
    };
  },
  renderPhrase: (value, doc) => {
    if (!value.enabled) return null;
    const hasDocHeading = doc ? (doc.headingIndex !== undefined && doc.headingIndex !== null) : false;
    const bodyParasCount = doc?.paragraphs ? (doc.paragraphs.length - (hasDocHeading ? 1 : 0)) : 1;
    const indentCmStr = `${formatRuNumber(value.cm)} см`;
    if (bodyParasCount > 1) {
      return `Отступ первой строки каждого абзаца основного текста — ${indentCmStr}.`;
    } else {
      return `Отступ первой строки абзаца основного текста — ${indentCmStr}.`;
    }
  },
  check: (value, pasted, doc, tolerances) => {
    const targetHasHeading = doc.headingIndex !== undefined && doc.headingIndex !== null;
    const bodyStartParaIdx = (targetHasHeading && pasted.headingIndex !== null && pasted.headingIndex !== undefined)
      ? (pasted.headingIndex + 1)
      : 0;
    const expIndentStr = `${formatRuNumber(value.cm)} см`;
    const bodyIndentBySpaces = (pasted.indentBySpaces || []).slice(bodyStartParaIdx);
    const hasIndentBySpaces = bodyIndentBySpaces.some(b => b);

    if (hasIndentBySpaces) {
      const badParas: MarkLocation[] = [];
      bodyIndentBySpaces.forEach((b, idx) => {
        if (b) badParas.push({ kind: 'para', para: bodyStartParaIdx + idx });
      });
      return {
        id: 'noSpaceIndent',
        label: `Отступ первой строки (${expIndentStr})`,
        status: 'fail',
        expected: `${expIndentStr} (свойство абзаца)`,
        actual: 'отступ сделан пробелами/табуляцией',
        group: 'text',
        unit: 'indent',
        hintPath: `Формат → Абзац → Отступы → Первая строка (${expIndentStr})`,
        marks: badParas
      };
    }

    const bodyIndents = (pasted.indents || []).slice(bodyStartParaIdx);
    const nonNullIndents = bodyIndents.filter((i): i is number => i !== null);
    if (!pasted.indents || pasted.indents.length === 0 || nonNullIndents.length === 0) {
      return {
        id: 'indent',
        label: `Отступ первой строки (${expIndentStr})`,
        status: 'unknown',
        unknownReason: 'unparsed',
        expected: expIndentStr,
        actual: 'не удалось определить',
        group: 'text',
        unit: 'indent',
        hintPath: `Формат → Абзац → Отступы → Первая строка (${expIndentStr})`
      };
    }

    const wrongIndent = nonNullIndents.find(i => Math.abs(i - value.cm) > tolerances.indentCm);
    if (wrongIndent !== undefined) {
      const badParas: MarkLocation[] = [];
      bodyIndents.forEach((i, idx) => {
        if (i !== null && Math.abs(i - value.cm) > tolerances.indentCm) {
          badParas.push({ kind: 'para', para: bodyStartParaIdx + idx });
        }
      });
      return {
        id: 'indent',
        label: `Отступ первой строки (${expIndentStr})`,
        status: 'fail',
        expected: `${expIndentStr} (±${formatRuNumber(tolerances.indentCm)} см)`,
        actual: `${formatRuNumber(wrongIndent)} см`,
        group: 'text',
        unit: 'indent',
        hintPath: `Формат → Абзац → Отступы → Первая строка (${expIndentStr})`,
        marks: badParas
      };
    }

    return {
      id: 'indent',
      label: `Отступ первой строки (${expIndentStr})`,
      status: 'ok',
      expected: expIndentStr,
      actual: expIndentStr,
      group: 'text',
      unit: 'indent',
      hintPath: `Формат → Абзац → Отступы → Первая строка (${expIndentStr})`
    };
  }
};

// 5. lineSpacing Requirement
export const lineSpacingRequirement: RequirementDefinition<{ minRatio: number; maxRatio: number; enabled: boolean }> = {
  id: 'lineSpacing',
  unit: 'lineSpacing',
  group: 'text',
  declare: 'text',
  formulationPoint: 'Межстрочный интервал',
  isCore: true,
  isEligible: (_doc: Doc) => true,
  generateValue: (rng: RNG) => {
    const minRatio = rng.pick([1.0, 1.15]);
    const maxRatio = 1.5;
    return {
      enabled: true,
      minRatio,
      maxRatio
    };
  },
  renderPhrase: (value) => {
    if (!value.enabled) return null;
    return formatLineSpacingPhrase(value.minRatio, value.maxRatio);
  },
  check: (value, pasted, _doc, tolerances) => {
    const expLhStr = `${formatRuNumber(value.minRatio)}–${formatRuNumber(value.maxRatio)}`;
    const nonNullLh = (pasted.lineHeights || []).filter((lh): lh is number => lh !== null);
    if (!pasted.lineHeights || pasted.lineHeights.length === 0 || nonNullLh.length === 0) {
      return {
        id: 'lineSpacing',
        label: `Междустрочный интервал (${expLhStr})`,
        status: 'unknown',
        unknownReason: 'unparsed',
        expected: expLhStr,
        actual: 'не удалось определить',
        group: 'text',
        unit: 'lineSpacing',
        hintPath: 'Формат → Абзац → Междустрочный интервал'
      };
    }

    const wrongLh = nonNullLh.find(lh => lh < (value.minRatio - tolerances.lineHeight) || lh > (value.maxRatio + tolerances.lineHeight));
    if (wrongLh !== undefined) {
      const badParas: MarkLocation[] = [];
      pasted.lineHeights.forEach((lh, idx) => {
        if (lh !== null && (lh < (value.minRatio - tolerances.lineHeight) || lh > (value.maxRatio + tolerances.lineHeight))) {
          badParas.push({ kind: 'para', para: idx });
        }
      });
      return {
        id: 'lineSpacing',
        label: `Междустрочный интервал (${expLhStr})`,
        status: 'fail',
        expected: expLhStr,
        actual: `${formatRuNumber(wrongLh)}`,
        group: 'text',
        unit: 'lineSpacing',
        hintPath: 'Формат → Абзац → Междустрочный интервал',
        marks: badParas
      };
    }

    const uniqueLhs = Array.from(new Set(nonNullLh.map(lh => formatRuNumber(lh))));
    const actualLhStr = uniqueLhs.join(', ');

    return {
      id: 'lineSpacing',
      label: `Междустрочный интервал (${expLhStr})`,
      status: 'ok',
      expected: expLhStr,
      actual: actualLhStr,
      group: 'text',
      unit: 'lineSpacing',
      hintPath: 'Формат → Абзац → Междустрочный интервал'
    };
  }
};

// 6. bodyAlign Requirement
export const bodyAlignRequirement: RequirementDefinition<{ align: 'justify' | 'left'; enabled: boolean }> = {
  id: 'bodyAlign',
  unit: 'bodyAlign',
  group: 'text',
  declare: 'text',
  formulationPoint: 'Выравнивание основного текста',
  isCore: true,
  isEligible: (_doc: Doc) => true,
  generateValue: (rng: RNG) => {
    const align = rng.pick(['justify' as const, 'left' as const]);
    return {
      enabled: true,
      align
    };
  },
  renderPhrase: (value) => {
    if (!value.enabled) return null;
    return `Основной текст выровнен ${alignLabel(value.align)}.`;
  },
  check: (value, pasted, doc, _tolerances) => {
    const targetHasHeading = doc.headingIndex !== undefined && doc.headingIndex !== null;
    const bodyStartParaIdx = (targetHasHeading && pasted.headingIndex !== null && pasted.headingIndex !== undefined)
      ? (pasted.headingIndex + 1)
      : 0;
    const alignNameRu = alignLabel(value.align);
    const bodyAligns = (pasted.aligns || []).slice(bodyStartParaIdx);
    const nonNullAligns = bodyAligns.filter((a): a is string => a !== null);
    if (!pasted.aligns || pasted.aligns.length === 0 || nonNullAligns.length === 0) {
      return {
        id: 'bodyAlign',
        label: `Выравнивание основного текста ${alignNameRu}`,
        status: 'unknown',
        unknownReason: 'unparsed',
        expected: `${alignNameRu} (${value.align})`,
        actual: 'не удалось определить',
        group: 'text',
        unit: 'bodyAlign',
        hintPath: `Формат → Абзац → Выравнивание (${alignNameRu})`
      };
    }

    const wrongAlign = bodyAligns.find(a => a !== value.align);
    if (wrongAlign !== undefined) {
      const badParas: MarkLocation[] = [];
      bodyAligns.forEach((a, idx) => {
        if (a !== null && a !== value.align) {
          badParas.push({ kind: 'para', para: bodyStartParaIdx + idx });
        }
      });
      return {
        id: 'bodyAlign',
        label: `Выравнивание основного текста ${alignNameRu}`,
        status: 'fail',
        expected: `${alignNameRu} (${value.align})`,
        actual: wrongAlign ? alignLabel(wrongAlign) : `не ${alignNameRu}`,
        group: 'text',
        unit: 'bodyAlign',
        hintPath: `Формат → Абзац → Выравнивание (${alignNameRu})`,
        marks: badParas
      };
    }

    return {
      id: 'bodyAlign',
      label: `Выравнивание основного текста ${alignNameRu}`,
      status: 'ok',
      expected: `${alignNameRu} (${value.align})`,
      actual: alignNameRu,
      group: 'text',
      unit: 'bodyAlign',
      hintPath: `Формат → Абзац → Выравнивание (${alignNameRu})`
    };
  }
};

// 7. gapToTable Requirement
export const gapToTableRequirement: RequirementDefinition<{ minPt: number; maxPt: number; enabled: boolean }> = {
  id: 'gapToTable',
  unit: 'gapToTable',
  group: 'table',
  declare: 'text',
  formulationPoint: 'Расстояние между текстом и таблицей',
  isCore: false,
  isEligible: (doc: Doc) => Boolean(doc.table && doc.table.rows && doc.table.rows.length > 0),
  generateValue: (rng: RNG, doc: Doc) => {
    const hasTable = Boolean(doc.table && doc.table.rows && doc.table.rows.length > 0);
    const minPt = rng.pick([15, 18, 20]);
    const maxPt = rng.pick([24, 28, 30]);
    return {
      enabled: hasTable,
      minPt,
      maxPt
    };
  },
  renderPhrase: (value, doc) => {
    if (!value.enabled || !doc.table || !doc.table.rows || doc.table.rows.length === 0) return null;
    const minPt = formatRuNumber(value.minPt);
    const maxPt = formatRuNumber(value.maxPt);
    return `Расстояние между текстом и таблицей — не менее ${minPt} пт и не более ${maxPt} пт.`;
  },
  check: (value, pasted, doc, tolerances) => {
    const expGapTableStr = `${formatRuNumber(value.minPt)}–${formatRuNumber(value.maxPt)} пт`;
    const totalParasCount = pasted.paragraphs ? pasted.paragraphs.length : 0;
    if (!pasted.table || !pasted.table.rows || pasted.table.rows.length === 0) {
      return {
        id: 'gapToTable',
        label: `Интервал между текстом и таблицей (${expGapTableStr})`,
        status: 'unknown',
        unknownReason: 'blocked',
        expected: expGapTableStr,
        actual: 'не проверено (таблица не создана)',
        group: 'table',
        unit: 'gapToTable',
        hintPath: 'Формат → Абзац → Отступ после'
      };
    }

    if (pasted.emptyParasBeforeTable && pasted.emptyParasBeforeTable > 0) {
      return {
        id: 'gapToTable',
        label: `Интервал между текстом и таблицей (${expGapTableStr})`,
        status: 'unknown',
        unknownReason: 'blocked',
        expected: expGapTableStr,
        actual: 'интервал задан пустыми абзацами',
        group: 'table',
        unit: 'gapToTable',
        hintPath: 'Формат → Абзац → Отступ после'
      };
    }

    if (pasted.gapToTablePt === null || isNaN(pasted.gapToTablePt)) {
      return {
        id: 'gapToTable',
        label: `Интервал между текстом и таблицей (${expGapTableStr})`,
        status: 'unknown',
        unknownReason: 'unparsed',
        expected: expGapTableStr,
        actual: 'не удалось определить',
        group: 'table',
        unit: 'gapToTable',
        hintPath: 'Формат → Абзац → Отступ после'
      };
    }

    if (pasted.gapToTablePt < (value.minPt - tolerances.gapPt) || pasted.gapToTablePt > (value.maxPt + tolerances.gapPt)) {
      return {
        id: 'gapToTable',
        label: `Интервал между текстом и таблицей (${expGapTableStr})`,
        status: 'fail',
        expected: expGapTableStr,
        actual: `${Math.round(pasted.gapToTablePt)} пт`,
        group: 'table',
        unit: 'gapToTable',
        hintPath: 'Формат → Абзац → Отступ после',
        marks: [{ kind: 'para', para: totalParasCount > 0 ? totalParasCount - 1 : 0 }]
      };
    }

    return {
      id: 'gapToTable',
      label: `Интервал между текстом и таблицей (${expGapTableStr})`,
      status: 'ok',
      expected: expGapTableStr,
      actual: `${Math.round(pasted.gapToTablePt)} пт`,
      group: 'table',
      unit: 'gapToTable',
      hintPath: 'Формат → Абзац → Отступ после'
    };
  }
};

// 8. tableWidth Requirement
export const tableWidthRequirement: RequirementDefinition<{ enabled: boolean }> = {
  id: 'tableWidth',
  unit: 'tableWidth',
  group: 'table',
  declare: 'text',
  formulationPoint: 'Ширина таблицы меньше ширины основного текста',
  isCore: false,
  isEligible: (doc: Doc) => Boolean(doc.table && doc.table.rows && doc.table.rows.length > 0),
  generateValue: (_rng: RNG, doc: Doc) => {
    const hasTable = Boolean(doc.table && doc.table.rows && doc.table.rows.length > 0);
    return {
      enabled: hasTable
    };
  },
  renderPhrase: (value, doc) => {
    if (!value.enabled || !doc.table || !doc.table.rows || doc.table.rows.length === 0) return null;
    return 'Ширина таблицы меньше ширины основного текста.';
  },
  check: (_value, pasted, _doc, _tolerances, spec) => {
    const fullWidthRatio = spec?.tableFullWidthRatio ?? 0.98;
    const expTableWidth = 'меньше ширины основного текста';
    if (pasted.tableWidthRatio === null || isNaN(pasted.tableWidthRatio)) {
      return {
        id: 'tableWidth',
        label: 'Ширина таблицы',
        status: 'unknown',
        unknownReason: 'unparsed',
        expected: expTableWidth,
        actual: 'не удалось определить',
        group: 'table',
        unit: 'tableWidth',
        hintPath: 'Свойства таблицы → Ширина'
      };
    }
    if (pasted.tableWidthRatio >= fullWidthRatio) {
      return {
        id: 'tableWidth',
        label: 'Ширина таблицы',
        status: 'fail',
        expected: expTableWidth,
        actual: 'растянута во всю ширину текста',
        group: 'table',
        unit: 'tableWidth',
        hintPath: 'Свойства таблицы → Ширина, затем Выравнивание таблицы'
      };
    }
    return {
      id: 'tableWidth',
      label: 'Ширина таблицы',
      status: 'ok',
      expected: expTableWidth,
      actual: 'уже ширины текста',
      group: 'table',
      unit: 'tableWidth',
      hintPath: 'Свойства таблицы → Ширина'
    };
  }
};

// 9. headingSpacing Requirement
export const headingSpacingRequirement: RequirementDefinition<{ spacingPt: number; enabled: boolean }> = {
  id: 'headingSpacing',
  unit: 'headingSpacing',
  group: 'text',
  declare: 'text',
  formulationPoint: 'Интервал после заголовка',
  isCore: false,
  isEligible: (doc: Doc) => doc.headingIndex !== undefined && doc.headingIndex !== null,
  generateValue: (rng: RNG, _doc: Doc) => {
    const spacingPt = rng.pick([6, 12, 18]);
    return {
      enabled: true,
      spacingPt
    };
  },
  renderPhrase: (value, doc) => {
    const hasHeading = doc ? (doc.headingIndex !== undefined && doc.headingIndex !== null) : false;
    if (!value.enabled || !hasHeading) return null;
    return `Интервал после заголовка — ${formatRuNumber(value.spacingPt)} пт.`;
  },
  check: (value, pasted, _doc, tolerances) => {
    const expHeadingSpacingStr = `${formatRuNumber(value.spacingPt)} пт`;
    const hIdx = (pasted.headingIndex !== null && pasted.headingIndex !== undefined) ? pasted.headingIndex : 0;
    const hGap = (pasted.paraGaps && pasted.paraGaps.length > hIdx) ? pasted.paraGaps[hIdx] : null;

    if (hGap === null) {
      return {
        id: 'headingSpacing',
        label: `Интервал после заголовка (${expHeadingSpacingStr})`,
        status: 'unknown',
        unknownReason: 'unparsed',
        expected: expHeadingSpacingStr,
        actual: 'не удалось определить',
        group: 'text',
        unit: 'headingSpacing',
        hintPath: `Формат → Абзац → Отступ после (${expHeadingSpacingStr})`
      };
    }

    const useSum = pasted.generator === 'libreoffice' || pasted.generator === 'word';
    const inHeadingRange = (v: number) => Math.abs(v - value.spacingPt) <= tolerances.pt;
    const eff = useSum ? hGap.sum : (inHeadingRange(hGap.sum) ? hGap.sum : hGap.max);
    const isHeadingSpacingOk = inHeadingRange(eff);

    if (!isHeadingSpacingOk) {
      return {
        id: 'headingSpacing',
        label: `Интервал после заголовка (${expHeadingSpacingStr})`,
        status: 'fail',
        expected: `${expHeadingSpacingStr} (±${formatRuNumber(tolerances.pt)} пт)`,
        actual: `${Math.round(eff)} пт`,
        group: 'text',
        unit: 'headingSpacing',
        hintPath: `Формат → Абзац → Отступ после (${expHeadingSpacingStr})`,
        marks: [{ kind: 'para', para: hIdx }]
      };
    }

    return {
      id: 'headingSpacing',
      label: `Интервал после заголовка (${expHeadingSpacingStr})`,
      status: 'ok',
      expected: expHeadingSpacingStr,
      actual: `${Math.round(eff)} пт`,
      group: 'text',
      unit: 'headingSpacing',
      hintPath: `Формат → Абзац → Отступ после (${expHeadingSpacingStr})`
    };
  }
};

export const REQUIREMENTS_REGISTRY: Record<string, RequirementDefinition> = {
  tableSize: tableSizeRequirement,
  fontSize: fontSizeRequirement,
  paraSpacing: paraSpacingRequirement,
  indent: indentRequirement,
  lineSpacing: lineSpacingRequirement,
  bodyAlign: bodyAlignRequirement,
  gapToTable: gapToTableRequirement,
  tableWidth: tableWidthRequirement,
  headingSpacing: headingSpacingRequirement
};

export interface RequirementPolicyItem {
  id: string;
  unit: string;
  group: 'text' | 'table' | 'info';
  declare: 'text' | 'sample' | 'trap' | 'none';
  justification: string;
  formulationPoint: string;
  modifierOf?: string; // ID родительского требования, если критерий является уточняющей ловушкой
}

export const ALLOWED_SAMPLE_DECLARED_IDS = [
  'superscript',
  'subscript',
  'tableMerge',
  'supTable',
  'subTable'
] as const;

export const ALLOWED_TRAP_IDS = [
  'noSpaceIndent',
  'nobreaks',
  'emptyParas',
  'plainBody',
  'typosText',
  'typosTable',
  'cellLineBreak',
  'paraCount'
] as const;

export const ALLOWED_NONE_IDS = [
  'fontFamily',
  'tableFontSize',
  'textMatch'
] as const;

export const TASK13_REQUIREMENTS_POLICY: RequirementPolicyItem[] = [
  {
    id: 'fontSize',
    unit: 'fontSize',
    group: 'text',
    declare: 'text',
    justification: 'Размер шрифта основного текста объявляется в тексте задания (11–16 пт) по спецификации ФИПИ.',
    formulationPoint: 'Данный текст должен быть набран шрифтом размером N пунктов обычного начертания'
  },
  {
    id: 'indent',
    unit: 'indent',
    group: 'text',
    declare: 'text',
    justification: 'Отступ первой строки (красная строка) объявляется в тексте задания (обычно 1 см) по спецификации ФИПИ.',
    formulationPoint: 'Отступ первой строки абзаца основного текста — N см'
  },
  {
    id: 'noSpaceIndent',
    unit: 'indent',
    group: 'text',
    declare: 'trap',
    modifierOf: 'indent',
    justification: 'Ловушка имитации красной строки пробелами или символами табуляции вместо абзацного отступа.',
    formulationPoint: '—'
  },
  {
    id: 'lineSpacing',
    unit: 'lineSpacing',
    group: 'text',
    declare: 'text',
    justification: 'Межстрочный интервал задаётся в тексте задания (одинарный, полуторный, от 1.0 до 1.5) по спецификации ФИПИ.',
    formulationPoint: 'Расстояние между строками текста — ...'
  },
  {
    id: 'bodyAlign',
    unit: 'bodyAlign',
    group: 'text',
    declare: 'text',
    justification: 'Выравнивание основного текста (по ширине / по левому краю) объявляется в тексте задания по спецификации ФИПИ.',
    formulationPoint: 'Основной текст выровнен по ширине / по левому краю'
  },
  {
    id: 'nobreaks',
    unit: 'noLineBreaks',
    group: 'text',
    declare: 'trap',
    modifierOf: 'paraCount',
    justification: 'Ловушка принудительных разрывов строк <br> (Shift+Enter) вместо абзацев <p>.',
    formulationPoint: '—'
  },
  {
    id: 'paraSpacing',
    unit: 'paraSpacing',
    group: 'text',
    declare: 'text',
    justification: 'Интервал между абзацами задаётся в тексте задания (L3, когда абзацев > 1).',
    formulationPoint: 'Интервал между абзацами текста — не менее X пт и не более Y пт'
  },
  {
    id: 'emptyParas',
    unit: 'paraSpacing',
    group: 'text',
    declare: 'trap',
    modifierOf: 'paraSpacing',
    justification: 'Ловушка создания межабзацных интервалов пустыми строками/абзацами Enter вместо настроек абзаца.',
    formulationPoint: '—'
  },
  {
    id: 'gapToTable',
    unit: 'gapToTable',
    group: 'table',
    declare: 'text',
    justification: 'Интервал между текстом и таблицей задаётся в тексте задания (не менее 18 пт и не более 24 пт).',
    formulationPoint: 'Расстояние между текстом и таблицей — не менее X пт и не более Y пт'
  },
  {
    id: 'headingSpacing',
    unit: 'headingSpacing',
    group: 'text',
    declare: 'text',
    justification: 'Интервал после заголовка объявляется в тексте задания, если заголовок присутствует.',
    formulationPoint: 'интервал после заголовка — N пт'
  },
  {
    id: 'tableSize',
    unit: 'tableSize',
    group: 'table',
    declare: 'text',
    justification: 'Количество строк и столбцов таблицы объявляется в тексте задания.',
    formulationPoint: 'Таблица содержит N строк и M столбцов'
  },
  {
    id: 'tableRows',
    unit: 'tableRows',
    group: 'table',
    declare: 'text',
    justification: 'Число строк таблицы соответствует заданию.',
    formulationPoint: 'Число строк таблицы'
  },
  {
    id: 'tableCols',
    unit: 'tableCols',
    group: 'table',
    declare: 'text',
    justification: 'Число столбцов таблицы соответствует заданию.',
    formulationPoint: 'Число столбцов таблицы'
  },
  {
    id: 'tableAlign',
    unit: 'tableAlign',
    group: 'table',
    declare: 'text',
    justification: 'Выравнивание таблицы на странице объявляется в тексте задания (по центру/по левому краю).',
    formulationPoint: 'Таблица выровнена на странице по центру / по левому краю'
  },
  {
    id: 'tableWidth',
    unit: 'tableWidth',
    group: 'table',
    declare: 'text',
    justification: 'Требование к ширине таблицы объявляется в тексте задания («меньше ширины основного текста»).',
    formulationPoint: 'Ширина таблицы меньше ширины основного текста'
  },
  {
    id: 'bold',
    unit: 'emphasis',
    group: 'text',
    declare: 'text',
    justification: 'Конкретные слова для полужирного выделения в тексте определяются по образцу (в тексте задания объявляется только общее наличие).',
    formulationPoint: 'В тексте есть слова, выделенные полужирным шрифтом (образец)'
  },
  {
    id: 'italic',
    unit: 'emphasis',
    group: 'text',
    declare: 'text',
    justification: 'Конкретные слова для курсивного выделения в тексте определяются по образцу.',
    formulationPoint: 'В тексте есть слова, выделенные курсивом (образец)'
  },
  {
    id: 'underline',
    unit: 'emphasis',
    group: 'text',
    declare: 'text',
    justification: 'Конкретные слова для подчёркивания определяются по образцу.',
    formulationPoint: 'В тексте есть слова, выделенные подчёркиванием (образец)'
  },
  {
    id: 'emphasisMissing',
    unit: 'emphasis',
    group: 'text',
    declare: 'text',
    justification: 'Пропущенные выделения текста по образцу.',
    formulationPoint: 'Выделения текста (образец)'
  },
  {
    id: 'plainBody',
    unit: 'plainBody',
    group: 'text',
    declare: 'trap',
    modifierOf: 'bold',
    justification: 'Ловушка сплошного выделения всего текста полужирным/курсивом (модифицирует ошибку выделений).',
    formulationPoint: '—'
  },
  {
    id: 'superscript',
    unit: 'superscript',
    group: 'text',
    declare: 'sample',
    justification: 'Верхние индексы (степени, единицы измерения) определяются по визуальному образцу.',
    formulationPoint: 'Символы в верхнем индексе (образец)'
  },
  {
    id: 'subscript',
    unit: 'subscript',
    group: 'text',
    declare: 'sample',
    justification: 'Нижние индексы (химические формулы и т.д.) определяются по визуальному образцу.',
    formulationPoint: 'Символы в нижнем индексе (образец)'
  },
  {
    id: 'headingAlign',
    unit: 'headingAlign',
    group: 'text',
    declare: 'text',
    justification: 'Выравнивание заголовка видно на образце и дублируется в тексте условий.',
    formulationPoint: 'Заголовок текста выровнен по центру / по левому краю'
  },
  {
    id: 'headingIndent',
    unit: 'headingIndent',
    group: 'text',
    declare: 'text',
    justification: 'Отступ заголовка (обычно 0 см) видно на образце и дублируется в тексте условий.',
    formulationPoint: 'отступ первой строки — 0 см'
  },
  {
    id: 'headingBold',
    unit: 'headingBold',
    group: 'text',
    declare: 'text',
    justification: 'Начертание заголовка (полужирный) видно на образце.',
    formulationPoint: 'Начертание заголовка (образец)'
  },
  {
    id: 'headingItalic',
    unit: 'headingItalic',
    group: 'text',
    declare: 'text',
    justification: 'Курсивное начертание заголовка видно на образце.',
    formulationPoint: 'Начертание заголовка (образец)'
  },
  {
    id: 'headingUnderline',
    unit: 'headingUnderline',
    group: 'text',
    declare: 'text',
    justification: 'Подчёркивание заголовка видно на образце.',
    formulationPoint: 'Подчёркивание заголовка (образец)'
  },
  {
    id: 'colAlign',
    unit: 'colAlign',
    group: 'table',
    declare: 'text',
    justification: 'Выравнивание данных по столбцам таблицы видно на образце и описывается в тексте задания.',
    formulationPoint: 'В таблице в первом столбце выравнивание ..., в остальных — ...'
  },
  {
    id: 'cellAlign',
    unit: 'cellAlign',
    group: 'table',
    declare: 'text',
    justification: 'Выравнивание текста в ячейках таблицы определяется по визуальному образцу.',
    formulationPoint: 'Выравнивание в ячейках (образец)'
  },
  {
    id: 'boldCells',
    unit: 'boldCells',
    group: 'table',
    declare: 'text',
    justification: 'Полужирные ячейки шапки/строк таблицы видны на образце.',
    formulationPoint: 'В таблице есть слова, выделенные полужирным шрифтом (образец)'
  },
  {
    id: 'tableMerge',
    unit: 'tableMerge',
    group: 'table',
    declare: 'sample',
    justification: 'Объединение ячеек таблицы (colspan/rowspan) видно на образце.',
    formulationPoint: 'Объединение ячеек (образец)'
  },
  {
    id: 'fontFamily',
    unit: 'fontFamily',
    group: 'info',
    declare: 'none',
    justification: 'Гарнитура шрифта (Times New Roman / Calibri / Liberation Serif) носит рекомендательный характер и не влияет на оценку по спецификации ФИПИ.',
    formulationPoint: '—'
  },
  {
    id: 'tableFontSize',
    unit: 'tableFontSize',
    group: 'info',
    declare: 'none',
    justification: 'Размер шрифта в таблице в тексте задания не регламентируется и не влияет на балл.',
    formulationPoint: '—'
  },
  {
    id: 'tableExists',
    unit: 'tableExists',
    group: 'table',
    declare: 'text',
    justification: 'Наличие таблицы в документе.',
    formulationPoint: 'Таблица присутствует'
  },
  {
    id: 'typosText',
    unit: 'typosText',
    group: 'text',
    declare: 'trap',
    justification: 'Текст не должен содержать опечаток и ошибок пунктуации (запрет, проверяется при нарушении).',
    formulationPoint: 'Текст без опечаток'
  },
  {
    id: 'typosTable',
    unit: 'typosTable',
    group: 'table',
    declare: 'trap',
    justification: 'Таблица не должна содержать опечаток и ошибок пунктуации (запрет, проверяется при нарушении).',
    formulationPoint: 'Таблица без опечаток'
  },
  {
    id: 'cellValign',
    unit: 'cellValign',
    group: 'table',
    declare: 'text',
    justification: 'Вертикальное выравнивание в ячейках таблицы указывается в тексте задания.',
    formulationPoint: 'Вертикальное выравнивание ячеек таблицы'
  },
  {
    id: 'cellLineBreak',
    unit: 'cellLineBreak',
    group: 'table',
    declare: 'trap',
    justification: 'Принудительные переносы строк в ячейках таблицы (запрет лишних / проверка при нарушении).',
    formulationPoint: 'Переносы строк в ячейках таблицы'
  },
  {
    id: 'supTable',
    unit: 'supTable',
    group: 'table',
    declare: 'sample',
    justification: 'Верхний индекс в ячейках таблицы по образцу.',
    formulationPoint: 'Верхний индекс в таблице'
  },
  {
    id: 'subTable',
    unit: 'subTable',
    group: 'table',
    declare: 'sample',
    justification: 'Нижний индекс в ячейках таблицы по образцу.',
    formulationPoint: 'Нижний индекс в таблице'
  },
  {
    id: 'paraCount',
    unit: 'paraCount',
    group: 'text',
    declare: 'trap',
    justification: 'Запрет лишних/пропущенных абзацев (число абзацев основного текста).',
    formulationPoint: 'Число абзацев'
  },
  {
    id: 'textMatch',
    unit: 'textMatch',
    group: 'info',
    declare: 'none',
    justification: 'Информационная метрика соответствия введённого текста эталону (процент сходства).',
    formulationPoint: '—'
  }
];

/**
 * Формирует список ошибок для показа пользователю с учётом модификаторов-ловушек.
 * Если ловушка (modifierOf) сработала ('fail'), она заменяет ошибку основного требования,
 * исключая дублирование штрафов и сообщений.
 */
export function buildDisplayErrors(
  items: CritResult[],
  policy: RequirementPolicyItem[] = TASK13_REQUIREMENTS_POLICY
): CritResult[] {
  const policyMap = new Map<string, RequirementPolicyItem>();
  policy.forEach(p => policyMap.set(p.id, p));

  const failingModifiers = new Map<string, CritResult>();
  const tableExistsFailed = items.some(it => it.id === 'tableExists' && it.status === 'fail');
  const tableSizeFailed = items.some(it => (it.id === 'tableSize' || it.id === 'tableRows' || it.id === 'tableCols') && it.status === 'fail');

  items.forEach(it => {
    if (it.status === 'fail') {
      const pol = policyMap.get(it.id);
      if (pol && pol.modifierOf) {
        failingModifiers.set(pol.modifierOf, it);
      }
    }
  });

  const result: CritResult[] = [];
  const handledParents = new Set<string>();

  items.forEach(it => {
    const pol = policyMap.get(it.id);

    // Если этот элемент сам является модификатором и он сработал
    if (pol && pol.modifierOf) {
      if (it.status === 'fail') {
        result.push(it);
        handledParents.add(pol.modifierOf);
      }
      return;
    }

    // Если родительское требование перекрыто сработавшим модификатором, пропускаем его
    if (handledParents.has(it.id) || (failingModifiers.has(it.id) && it.status === 'fail')) {
      return;
    }

    result.push(it);
  });

  return result;
}

/**
 * Фильтрует критерии для отображения в интерфейсе пользователя:
 * - Объявленные требования (declare: 'text') присутствуют ВСЕГДА.
 * - Ловушки (declare: 'trap') присутствуют ТОЛЬКО при их срабатывании (status: 'fail').
 * - Нейтральные критерии (declare: 'none') показываются только информационно/при срабатывании.
 * - Статус 'unknown' сохраняется и различает причины ("таблица отсутствует" vs "параметр не извлечён").
 */
export function filterCriteriaForUi(
  items: CritResult[],
  policy: RequirementPolicyItem[] = TASK13_REQUIREMENTS_POLICY
): CritResult[] {
  const policyMap = new Map<string, RequirementPolicyItem>();
  policy.forEach(p => policyMap.set(p.id, p));

  const modifiedItems = buildDisplayErrors(items, policy);

  return modifiedItems.filter(it => {
    const pol = policyMap.get(it.id);
    if (!pol) return true;

    // Ловушки (declare: 'trap') показываются только если они сработали как ошибка
    if (pol.declare === 'trap') {
      return it.status === 'fail';
    }

    // Нейтральные (declare: 'none') показываются только если сработали
    if (pol.declare === 'none') {
      return it.status === 'fail';
    }

    // Объявленные требования (text) показываются всегда
    return true;
  });
}



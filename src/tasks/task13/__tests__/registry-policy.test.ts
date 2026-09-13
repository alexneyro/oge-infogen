import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TASK13_REQUIREMENTS_POLICY, REQUIREMENTS_REGISTRY, ALLOWED_SAMPLE_DECLARED_IDS, ALLOWED_TRAP_IDS, ALLOWED_NONE_IDS, filterCriteriaForUi, buildDisplayErrors } from '../registry';
import { generateTask13 } from '../generate';
import { parsePastedHtml, PastedDoc } from '../html';
import { checkTask13, computeScore, CritResult, isCritError } from '../check';
import { formatTask13Conditions, formatTask13Preamble, formatLineSpacingPhrase, DEFAULT_SPEC, SPEC_L1, SPEC_L2, SPEC_L3, TaskSpec, generateTaskRequirements, tableWidth } from '../spec';
import { Doc } from '../parse';
import { RNG } from '../../../utils/rng';
import { renderCompliantHtml } from './fixtures/render';

describe('Task 13 Comprehensive Registry & Verification Tests (G2-Fix)', () => {
  // 1. Состав критериев
  it('1. Repertoire of criteria: all check.ts criteria IDs exist in policy registry and match score-reducing list', () => {
    const policyIds = TASK13_REQUIREMENTS_POLICY.map(p => p.id);
    expect(policyIds.length).toBe(TASK13_REQUIREMENTS_POLICY.length);
    expect(policyIds.length).toBeGreaterThanOrEqual(28);

    // Explicit list of all IDs that can reduce the score / participate in evaluation
    const EXPECTED_SCORE_REDUCING_IDS = [
      'bold', 'italic', 'underline', 'boldCells', 'emphasisMissing', 'plainBody',
      'bodyAlign', 'headingAlign', 'cellAlign', 'colAlign', 'tableAlign',
      'fontSize', 'tableFontSize', 'headingSpacing', 'lineSpacing', 'indent',
      'headingIndent', 'tableSize', 'tableRows', 'tableCols', 'tableExists',
      'tableWidth', 'gapToTable', 'paraSpacing', 'superscript', 'subscript',
      'supTable', 'subTable', 'cellValign', 'cellLineBreak', 'noSpaceIndent',
      'nobreaks', 'emptyParas', 'paraCount', 'typosText', 'typosTable', 'fontFamily'
    ];

    // Every expected ID must be defined in policy registry
    EXPECTED_SCORE_REDUCING_IDS.forEach(id => {
      expect(policyIds, `Policy must define ${id}`).toContain(id);
    });

    // Run check on a test document to verify emitted items IDs are in the policy
    const task = generateTask13(42, 3);
    const html = `<p style="text-indent: 1.25cm; text-align: justify; font-size: 14pt; line-height: 1.5; font-family: 'Times New Roman';">Текст</p>`;
    const pasted = parsePastedHtml(html);
    const report = checkTask13(task.doc, pasted, task.doc.spec);

    report.items.forEach(item => {
      expect(policyIds, `Item ${item.id} produced by check.ts must exist in registry policy`).toContain(item.id);
    });
  });

  // 1b. Проверка sample-критериев
  it('1b. Sample-declared criteria: exact match with ALLOWED_SAMPLE_DECLARED_IDS in both directions', () => {
    const actualSampleIds = TASK13_REQUIREMENTS_POLICY
      .filter(p => p.declare === 'sample')
      .map(p => p.id)
      .sort();
    const expectedSampleIds = [...ALLOWED_SAMPLE_DECLARED_IDS].sort();

    expect(actualSampleIds, 'Actual sample-declared IDs in policy must exactly match ALLOWED_SAMPLE_DECLARED_IDS').toEqual(expectedSampleIds);
  });

  // 1c. Проверка trap-критериев
  it('1c. Trap criteria: exact match with ALLOWED_TRAP_IDS in both directions', () => {
    const actualTrapIds = TASK13_REQUIREMENTS_POLICY
      .filter(p => p.declare === 'trap')
      .map(p => p.id)
      .sort();
    const expectedTrapIds = [...ALLOWED_TRAP_IDS].sort();

    expect(actualTrapIds, 'Actual trap IDs in policy must exactly match ALLOWED_TRAP_IDS in both directions').toEqual(expectedTrapIds);
  });

  // 1d. Проверка none-критериев
  it('1d. None-declared criteria: exact match with ALLOWED_NONE_IDS in both directions', () => {
    const actualNoneIds = TASK13_REQUIREMENTS_POLICY
      .filter(p => p.declare === 'none')
      .map(p => p.id)
      .sort();
    const expectedNoneIds = [...ALLOWED_NONE_IDS].sort();

    expect(actualNoneIds, 'Actual none IDs in policy must exactly match ALLOWED_NONE_IDS in both directions').toEqual(expectedNoneIds);
  });

  // 2. Логика модификаторов
  it('2. Modifier logic: groups whitespace indent and empty paragraph errors under parent criteria', () => {
    const rawErrors: CritResult[] = [
      {
        id: 'noSpaceIndent',
        label: 'Отступ пробелами',
        status: 'fail',
        expected: 'отступ абзаца задан в свойствах',
        actual: 'отступ сделан пробелами',
        group: 'text',
        unit: 'noSpaceIndent'
      },
      {
        id: 'indent',
        label: 'Отступ первой строки',
        status: 'fail',
        expected: '1,25 см',
        actual: '0 см',
        group: 'text',
        unit: 'indent'
      },
      {
        id: 'emptyParas',
        label: 'Пустые абзацы',
        status: 'fail',
        expected: 'без пустых строк',
        actual: 'обнаружены пустые строки',
        group: 'text',
        unit: 'emptyParas'
      },
      {
        id: 'paraSpacing',
        label: 'Интервал между абзацами',
        status: 'fail',
        expected: '6–12 пт',
        actual: '0 пт',
        group: 'text',
        unit: 'paraSpacing'
      }
    ];

    const displayErrors = buildDisplayErrors(rawErrors);
    const displayIds = displayErrors.map(e => e.id);

    // Modifier traps should override parent errors
    expect(displayIds).toContain('noSpaceIndent');
    expect(displayIds).not.toContain('indent');

    expect(displayIds).toContain('emptyParas');
    expect(displayIds).not.toContain('paraSpacing');
  });

  // 3. Правило показа (UI display rules)
  it('3. UI Display rules: handles empty doc, single-word doc, and correct doc', () => {
    const task = generateTask13(101, 3);

    // Scenario A: Empty doc
    const emptyPasted = parsePastedHtml('');
    const emptyReport = checkTask13(task.doc, emptyPasted, task.doc.spec);
    const emptyUi = filterCriteriaForUi(emptyReport.items);

    // Core requirements must still be visible in UI
    expect(emptyUi.some(it => it.id === 'fontSize')).toBe(true);
    expect(emptyUi.some(it => it.id === 'indent')).toBe(true);
    // Traps with "ok" or not triggered should NOT appear
    expect(emptyUi.some(it => it.id === 'noSpaceIndent' && it.status === 'ok')).toBe(false);
    expect(emptyUi.some(it => it.id === 'emptyParas' && it.status === 'ok')).toBe(false);

    // Scenario B: Single word doc
    const singleWordPasted = parsePastedHtml('<p>Слово</p>');
    const singleWordReport = checkTask13(task.doc, singleWordPasted, task.doc.spec);
    const singleWordUi = filterCriteriaForUi(singleWordReport.items);
    expect(singleWordUi.some(it => it.id === 'fontSize')).toBe(true);
    expect(singleWordUi.some(it => it.id === 'tableSize')).toBe(true);

    // Scenario C: Correct doc
    const correctHtml = `
      <p style="text-indent: 1.25cm; text-align: justify; font-size: 14pt; line-height: 1.5; font-family: 'Times New Roman';">
        <b>Тестовый</b> заголовок и текст.
      </p>
    `;
    const correctPasted = parsePastedHtml(correctHtml);
    const correctReport = checkTask13(task.doc, correctPasted, task.doc.spec);
    const correctUi = filterCriteriaForUi(correctReport.items);
    // No traps with status 'ok' should be shown
    const trapIds = TASK13_REQUIREMENTS_POLICY.filter(p => p.declare === 'trap' || p.declare === 'none').map(p => p.id);
    trapIds.forEach(trapId => {
      expect(correctUi.some(it => it.id === trapId && it.status === 'ok')).toBe(false);
    });
  });

  // 5. Круговой тест (Circular test)
  it('5. Circular test: rendering doc to compliant HTML parses and passes with 2/2 score', () => {
    const task = generateTask13(777, 1);
    const spec = task.doc.spec!;
    const req = spec.requirements;

    // Render compliant HTML matching spec requirements
    const indentCm = req.indent.cm;
    const fontSizePt = req.fontSize.pt;
    const lineSpacing = req.lineSpacing.minRatio;
    const align = req.bodyAlign.align;

    const pStyles = `text-indent: ${indentCm}cm; text-align: ${align}; font-size: ${fontSizePt}pt; line-height: ${lineSpacing}; font-family: 'Times New Roman';`;

    const htmlParts: string[] = [];
    task.doc.paragraphs.forEach(p => {
      const textSpans = p.spans.map(s => {
        let t = s.text;
        if (s.b) t = `<b>${t}</b>`;
        if (s.i) t = `<i>${t}</i>`;
        if (s.u) t = `<u>${t}</u>`;
        return t;
      }).join('');
      htmlParts.push(`<p style="${pStyles}">${textSpans}</p>`);
    });

    if (task.doc.table) {
      const tableRowsHtml = task.doc.table.rows.map(r => {
        const cellsHtml = r.map(c => {
          let cellText = c.spans.map(s => {
            let t = s.text;
            if (s.b) t = `<b>${t}</b>`;
            if (s.i) t = `<i>${t}</i>`;
            if (s.u) t = `<u>${t}</u>`;
            return t;
          }).join('');
          return `<td align="${c.align || 'center'}" style="font-size: ${fontSizePt}pt;">${cellText}</td>`;
        }).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');

      htmlParts.push(`<table align="center" style="margin-top: 18pt; width: 80%;">${tableRowsHtml}</table>`);
    }

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(task.doc, pasted, spec);

    expect(report.score).toBe(2);
    expect(report.maxScore).toBe(2);
  });

  // 6. Тест на 11 пт и 16 пт
  it('6. Synthetic documents test: 11pt and 16pt with 1.15x and point-based spacing', () => {
    // 11 pt variant
    const task11 = generateTask13(1111, 1);
    task11.doc.spec!.requirements.fontSize.pt = 11;
    task11.doc.spec!.requirements.lineSpacing.minRatio = 1.15;
    task11.doc.spec!.requirements.lineSpacing.maxRatio = 1.5;

    const html11 = `
      <p style="font-size: 11pt; line-height: 1.15; text-indent: 1.25cm; text-align: justify; font-family: 'Times New Roman';">
        ${task11.doc.paragraphs[0]?.spans.map(s => s.text).join('') || 'Тестовый текст одиннадцать пунктов.'}
      </p>
    `;
    const pasted11 = parsePastedHtml(html11);
    const report11 = checkTask13(task11.doc, pasted11, task11.doc.spec);
    const fontCrit11 = report11.items.find(i => i.id === 'fontSize');
    expect(fontCrit11?.status).toBe('ok');

    // 16 pt variant
    const task16 = generateTask13(1616, 1);
    task16.doc.spec!.requirements.fontSize.pt = 16;
    task16.doc.spec!.requirements.lineSpacing.minRatio = 1.0;
    task16.doc.spec!.requirements.lineSpacing.maxRatio = 1.5;

    const html16 = `
      <p style="font-size: 16pt; line-height: 1.5; text-indent: 1.25cm; text-align: justify; font-family: 'Times New Roman';">
        ${task16.doc.paragraphs[0]?.spans.map(s => s.text).join('') || 'Тестовый текст шестнадцать пунктов.'}
      </p>
    `;
    const pasted16 = parsePastedHtml(html16);
    const report16 = checkTask13(task16.doc, pasted16, task16.doc.spec);
    const fontCrit16 = report16.items.find(i => i.id === 'fontSize');
    expect(fontCrit16?.status).toBe('ok');
  });

  // 10. gapToTable: ошибка попадает в группу table и влияет на табличную часть балла
  it('10. gapToTable: error belongs to table group and affects table score', () => {
    const task = generateTask13(1234, 1);
    const spec = task.doc.spec!;
    const req = spec.requirements;
    req.gapToTable = { enabled: true, minPt: 18, maxPt: 24 };

    const pStyles = `text-indent: ${req.indent.cm}cm; text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Times New Roman';`;
    const htmlParts: string[] = [];
    task.doc.paragraphs.forEach(p => {
      const textSpans = p.spans.map(s => {
        let t = s.text;
        if (s.b) t = `<b>${t}</b>`;
        if (s.i) t = `<i>${t}</i>`;
        if (s.u) t = `<u>${t}</u>`;
        return t;
      }).join('');
      htmlParts.push(`<p style="${pStyles}">${textSpans}</p>`);
    });

    const tableRowsHtml = task.doc.table!.rows.map(r => {
      const cellsHtml = r.map(c => {
        let cellText = c.spans.map(s => {
          let t = s.text;
          if (s.b) t = `<b>${t}</b>`;
          if (s.i) t = `<i>${t}</i>`;
          if (s.u) t = `<u>${t}</u>`;
          return t;
        }).join('');
        return `<td align="${c.align || 'center'}" style="font-size: ${req.fontSize.pt}pt;">${cellText}</td>`;
      }).join('');
      return `<tr>${cellsHtml}</tr>`;
    }).join('');

    // Table gap is deliberately wrong (margin-top: 6pt instead of 18-24pt)
    htmlParts.push(`<table align="center" style="margin-top: 6pt; width: 80%;">${tableRowsHtml}</table>`);

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(task.doc, pasted, spec);

    const gapItem = report.items.find(i => i.id === 'gapToTable');
    expect(gapItem).toBeDefined();
    expect(gapItem?.group).toBe('table');
    expect(gapItem?.status).toBe('fail');
    expect(report.vText).toBe(0);
    expect(report.vTable).toBeGreaterThan(0);
    expect(report.score).toBe(1); // Text has 0 errors, table has gap error -> 1 point
  });

  // 11. lineSpacing: actual из реального значения
  it('11. lineSpacing: actual contains "1,3" for document with 1.3 line height', () => {
    const task = generateTask13(5555, 1);
    const spec = task.doc.spec!;
    spec.requirements.lineSpacing = { enabled: true, minRatio: 1.0, maxRatio: 1.5 };

    const html = `
      <p style="line-height: 1.3; font-size: 14pt; text-indent: 1.25cm; text-align: justify;">
        ${task.doc.paragraphs[0]?.spans.map(s => s.text).join('')}
      </p>
    `;
    const pasted = parsePastedHtml(html);
    const report = checkTask13(task.doc, pasted, spec);
    const lineSpacingItem = report.items.find(i => i.id === 'lineSpacing');

    expect(lineSpacingItem).toBeDefined();
    expect(lineSpacingItem?.actual).toContain('1,3');
  });

  // 12. Тест: задание без таблицы, идеальный ответ → 2 балла
  it('12. Task without table: perfect answer scores 2 points', () => {
    const task = generateTask13(9999, 1);
    const docWithoutTable: Doc = {
      headingIndex: null,
      paragraphs: task.doc.paragraphs,
      table: null
    };
    const spec = structuredClone(task.doc.spec!);
    const req = spec.requirements;
    req.tableSize.enabled = false;
    req.tableWidth.enabled = false;
    req.gapToTable.enabled = false;
    req.tableAlign.enabled = false;
    req.boldCells.enabled = false;

    const pStyles = `text-indent: ${req.indent.cm}cm; text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Times New Roman';`;
    const htmlParts: string[] = [];
    task.doc.paragraphs.forEach(p => {
      const textSpans = p.spans.map(s => {
        let t = s.text;
        if (s.b) t = `<b>${t}</b>`;
        if (s.i) t = `<i>${t}</i>`;
        if (s.u) t = `<u>${t}</u>`;
        return t;
      }).join('');
      htmlParts.push(`<p style="${pStyles}">${textSpans}</p>`);
    });

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(docWithoutTable, pasted, spec);

    expect(report.vText).toBe(0);
    expect(report.vTable).toBe(0);
    expect(report.score).toBe(2);
  });

  // 13. Документ с отступом пробелами → ровно одна ошибка в displayErrors и 1 балл
  it('13. Document with space-based indent has exactly 1 error in displayErrors and score is 1 point', () => {
    const task = generateTask13(7777, 1);
    const spec = task.doc.spec!;
    const req = spec.requirements;

    // Indent is done via spaces instead of text-indent
    const pStyles = `text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Times New Roman';`;
    const htmlParts: string[] = [];
    task.doc.paragraphs.forEach(p => {
      const textSpans = p.spans.map(s => {
        let t = s.text;
        if (s.b) t = `<b>${t}</b>`;
        if (s.i) t = `<i>${t}</i>`;
        if (s.u) t = `<u>${t}</u>`;
        return t;
      }).join('');
      htmlParts.push(`<p style="${pStyles}">&nbsp;&nbsp;&nbsp;&nbsp;${textSpans}</p>`);
    });

    if (task.doc.table) {
      const tableRowsHtml = task.doc.table.rows.map(r => {
        const cellsHtml = r.map(c => {
          let cellText = c.spans.map(s => {
            let t = s.text;
            if (s.b) t = `<b>${t}</b>`;
            if (s.i) t = `<i>${t}</i>`;
            if (s.u) t = `<u>${t}</u>`;
            return t;
          }).join('');
          return `<td align="${c.align || 'center'}" style="font-size: ${req.fontSize.pt}pt;">${cellText}</td>`;
        }).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');

      htmlParts.push(`<table align="center" style="margin-top: 18pt; width: 80%;">${tableRowsHtml}</table>`);
    }

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(task.doc, pasted, spec);

    // Assert on displayErrors (the array that goes directly into score computation)
    const textErrors = report.displayErrors.filter(e => e.group === 'text' && e.status === 'fail');
    expect(textErrors.length).toBe(1);
    expect(textErrors[0].unit).toBe('indent');
    expect(report.vText).toBe(1);
    expect(report.vTable).toBe(0);
    expect(report.score).toBe(1);
  });

  // 15. На сиде, где underline не выбран, документ без подчёркнутых слов получает 2/2
  it('15. When underline requirement is not selected, document without underlined words receives 2/2', () => {
    let foundSeed: number | null = null;
    for (let seed = 1; seed <= 200; seed++) {
      const task = generateTask13(seed, 1);
      if (!task.doc.spec?.requirements.emphasis.underline) {
        foundSeed = seed;
        break;
      }
    }

    if (foundSeed === null) {
      expect.fail('Could not find a seed without underline requirement among 200 seeds');
    }

    const task = generateTask13(foundSeed, 1);
    const spec = task.doc.spec!;

    // В образце документа нет подчёркивания
    expect(task.doc.paragraphs.some(p => p.spans.some(s => s.u))).toBe(false);

    // Документ без подчёркивания, полностью соответствующий заданию
    const baseHtml = renderCompliantHtml(task);
    const pasted = parsePastedHtml(baseHtml);
    const report = checkTask13(task.doc, pasted, spec);

    expect(report.vText, `vText must be 0 for clean submission without underline`).toBe(0);
    expect(report.score, `Score must be 2 for clean submission without underline`).toBe(2);
  });

  // 16. На сиде, где noSpaceIndent не в выбранном наборе, документ с отступом пробелами получает ошибку и 1 балл
  it('16. When noSpaceIndent is not in declared set, document with space-based indent receives error and 1 point', () => {
    let foundSeed: number | null = null;
    for (let seed = 1; seed <= 200; seed++) {
      const task = generateTask13(seed, 1);
      const conditions = formatTask13Conditions(task.doc, task.doc.spec);
      const declaredIds = conditions.flatMap(c => c.ids);
      if (!declaredIds.includes('noSpaceIndent')) {
        foundSeed = seed;
        break;
      }
    }

    if (foundSeed === null) {
      expect.fail('Could not find a seed where noSpaceIndent is not declared among 200 seeds');
    }

    const task = generateTask13(foundSeed, 1);
    const spec = task.doc.spec!;

    // Документ с пробельным отступом вместо text-indent
    const spaceIndentHtml = renderCompliantHtml(task, { spaceIndent: true });
    const pasted = parsePastedHtml(spaceIndentHtml);
    const report = checkTask13(task.doc, pasted, spec);

    // Должна быть зафиксирована ошибка отступа (noSpaceIndent или indent)
    const indentCrit = report.items.find(it => it.id === 'noSpaceIndent' || it.id === 'indent');
    expect(indentCrit, 'Indent criterion must be checked').toBeDefined();
    expect(indentCrit?.status, 'Indent criterion must fail due to space indent').toBe('fail');

    // Балл за текст снижается на 1 (vText = 1), итоговый балл 1 из 2
    expect(report.vText, 'vText must be 1 due to indent error').toBe(1);
    expect(report.score, 'Score must be 1 point').toBe(1);
  });

  // 18. Документ с пробельным отступом и ручными переносами строк даёт ровно 2 ошибки (noSpaceIndent и nobreaks), а не 4
  it('18. Document with space-based indent AND manual line breaks produces exactly 2 errors in displayErrors, not 4', () => {
    const task = generateTask13(101, 1);
    const spec = task.doc.spec!;
    const req = spec.requirements;
    const pStyles = `text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Times New Roman';`;

    // Формируем первый абзац с точным текстом задания, но с пробельным отступом (&nbsp;&nbsp;&nbsp;&nbsp;) и тегом <br> внутри
    const p0 = task.doc.paragraphs[0];
    const textSpans = p0.spans.map(s => {
      let t = s.text;
      if (s.b) t = `<b>${t}</b>`;
      if (s.i) t = `<i>${t}</i>`;
      if (s.u) t = `<u>${t}</u>`;
      if (s.sup) t = `<sup>${t}</sup>`;
      if (s.sub) t = `<sub>${t}</sub>`;
      return t;
    }).join('');

    // Вставляем <br> в середину текста первого абзаца
    const halfLen = Math.floor(textSpans.length / 2);
    const splitIdx = textSpans.indexOf(' ', halfLen);
    const withBr = splitIdx !== -1
      ? textSpans.slice(0, splitIdx) + '<br>' + textSpans.slice(splitIdx + 1)
      : textSpans + '<br>перенос';

    const htmlParts: string[] = [];
    htmlParts.push(`<p style="${pStyles}">&nbsp;&nbsp;&nbsp;&nbsp;${withBr}</p>`);

    // Остальные абзацы
    task.doc.paragraphs.slice(1).forEach(p => {
      const spans = p.spans.map(s => {
        let t = s.text;
        if (s.b) t = `<b>${t}</b>`;
        if (s.i) t = `<i>${t}</i>`;
        if (s.u) t = `<u>${t}</u>`;
        if (s.sup) t = `<sup>${t}</sup>`;
        if (s.sub) t = `<sub>${t}</sub>`;
        return t;
      }).join('');
      htmlParts.push(`<p style="text-indent: ${req.indent.cm}cm; ${pStyles}">${spans}</p>`);
    });

    if (task.doc.table) {
      const tableRowsHtml = task.doc.table.rows.map(r => {
        const cellsHtml = r.map(c => {
          let cellText = c.spans.map(s => {
            let t = s.text;
            if (s.b) t = `<b>${t}</b>`;
            if (s.i) t = `<i>${t}</i>`;
            if (s.u) t = `<u>${t}</u>`;
            if (s.sup) t = `<sup>${t}</sup>`;
            if (s.sub) t = `<sub>${t}</sub>`;
            return t;
          }).join('');
          const valignAttr = c.valign ? `valign="${c.valign}"` : '';
          const alignAttr = c.align ? `align="${c.align}"` : 'align="center"';
          const colspanAttr = c.colSpan && c.colSpan > 1 ? `colspan="${c.colSpan}"` : '';
          const rowspanAttr = c.rowSpan && c.rowSpan > 1 ? `rowspan="${c.rowSpan}"` : '';
          return `<td ${alignAttr} ${valignAttr} ${colspanAttr} ${rowspanAttr} style="font-size: ${req.fontSize.pt}pt;">${cellText}</td>`;
        }).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');

      const tAlign = req.tableAlign?.align || 'center';
      const gap = req.gapToTable?.minPt || 12;
      htmlParts.push(`<table align="${tAlign}" style="margin-top: ${gap}pt; width: 80%;">${tableRowsHtml}</table>`);
    }

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(task.doc, pasted, spec);

    const failedDisplayErrors = report.displayErrors.filter(e => e.status === 'fail');
    const failedIds = failedDisplayErrors.map(e => e.id).sort();

    // Должно быть ровно 2 ошибки: noSpaceIndent и nobreaks (а не 4 из-за дубликатов indent/indentBySpaces/hasLineBreaks/paraCount)
    expect(failedDisplayErrors.length, `Expected exactly 2 failing errors in displayErrors, got: ${failedIds.join(', ')}`).toBe(2);
    expect(failedIds).toEqual(['noSpaceIndent', 'nobreaks'].sort());
  });

  // 19. Документ с нарушениями только fontFamily и tableFontSize получает 2/2 балла
  it('19. Document with only fontFamily and tableFontSize violations receives 2/2 score', () => {
    const task = generateTask13(202, 1);
    const spec = task.doc.spec!;
    const req = spec.requirements;

    // Шрифтовая гарнитура основного текста недопустимая ('Comic Sans MS'), кегль в таблице сильно отличается (например, 28pt)
    const pStyles = `text-indent: ${req.indent.cm}cm; text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Comic Sans MS';`;

    const htmlParts: string[] = [];
    task.doc.paragraphs.forEach(p => {
      const spans = p.spans.map(s => {
        let t = s.text;
        if (s.b) t = `<b>${t}</b>`;
        if (s.i) t = `<i>${t}</i>`;
        if (s.u) t = `<u>${t}</u>`;
        if (s.sup) t = `<sup>${t}</sup>`;
        if (s.sub) t = `<sub>${t}</sub>`;
        return t;
      }).join('');
      htmlParts.push(`<p style="${pStyles}">${spans}</p>`);
    });

    if (task.doc.table) {
      const tableRowsHtml = task.doc.table.rows.map(r => {
        const cellsHtml = r.map(c => {
          let cellText = c.spans.map(s => {
            let t = s.text;
            if (s.b) t = `<b>${t}</b>`;
            if (s.i) t = `<i>${t}</i>`;
            if (s.u) t = `<u>${t}</u>`;
            if (s.sup) t = `<sup>${t}</sup>`;
            if (s.sub) t = `<sub>${t}</sub>`;
            return t;
          }).join('');
          const valignAttr = c.valign ? `valign="${c.valign}"` : '';
          const alignAttr = c.align ? `align="${c.align}"` : 'align="center"';
          const colspanAttr = c.colSpan && c.colSpan > 1 ? `colspan="${c.colSpan}"` : '';
          const rowspanAttr = c.rowSpan && c.rowSpan > 1 ? `rowspan="${c.rowSpan}"` : '';
          // Размер шрифта 28pt вместо req.fontSize.pt
          return `<td ${alignAttr} ${valignAttr} ${colspanAttr} ${rowspanAttr} style="font-size: 28pt;">${cellText}</td>`;
        }).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');

      const tAlign = req.tableAlign?.align || 'center';
      const gap = req.gapToTable?.minPt || 12;
      htmlParts.push(`<table align="${tAlign}" style="margin-top: ${gap}pt; width: 80%;">${tableRowsHtml}</table>`);
    }

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(task.doc, pasted, spec);

    // Проверяем, что fontFamily и tableFontSize действительно получили статус 'fail'
    const fontFamilyItem = report.items.find(it => it.id === 'fontFamily');
    const tableFontSizeItem = report.items.find(it => it.id === 'tableFontSize');

    expect(fontFamilyItem?.status, 'fontFamily must fail on Comic Sans').toBe('fail');
    if (task.doc.table) {
      expect(tableFontSizeItem?.status, 'tableFontSize must fail on 28pt').toBe('fail');
    }

    // При этом баллы за текст и таблицу не снижаются: vText = 0, vTable = 0, score = 2
    expect(report.vText, 'vText must be 0 (fontFamily is declare: none)').toBe(0);
    expect(report.vTable, 'vTable must be 0 (tableFontSize is declare: none)').toBe(0);
    expect(report.score, 'Total score must be 2/2').toBe(2);
  });

  // 20. Документ с верным форматированием, но с полностью посторонним текстом
  it('20. Document with correct formatting but completely foreign text scores 1 point (or 0 if no table)', () => {
    const task = generateTask13(303, 1);
    const spec = task.doc.spec!;
    const req = spec.requirements;

    const pStyles = `text-indent: ${req.indent.cm}cm; text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Times New Roman';`;

    // Создаём абзацы с правильным форматированием, но совершенно посторонним текстом
    const htmlParts: string[] = [
      `<p style="${pStyles}">Это совершенно произвольный посторонний текст, который никак не совпадает с исходным заданием и образцом.</p>`,
      `<p style="${pStyles}">Второй абзац постороннего текста для проверки того, как система реагирует на несовпадающий текст при верном форматировании.</p>`
    ];

    if (task.doc.table) {
      const tableRowsHtml = task.doc.table.rows.map(r => {
        const cellsHtml = r.map(c => {
          let cellText = c.spans.map(s => {
            let t = s.text;
            if (s.b) t = `<b>${t}</b>`;
            if (s.i) t = `<i>${t}</i>`;
            if (s.u) t = `<u>${t}</u>`;
            if (s.sup) t = `<sup>${t}</sup>`;
            if (s.sub) t = `<sub>${t}</sub>`;
            return t;
          }).join('');
          const valignAttr = c.valign ? `valign="${c.valign}"` : '';
          const alignAttr = c.align ? `align="${c.align}"` : 'align="center"';
          const colspanAttr = c.colSpan && c.colSpan > 1 ? `colspan="${c.colSpan}"` : '';
          const rowspanAttr = c.rowSpan && c.rowSpan > 1 ? `rowspan="${c.rowSpan}"` : '';
          return `<td ${alignAttr} ${valignAttr} ${colspanAttr} ${rowspanAttr} style="font-size: ${req.fontSize.pt}pt;">${cellText}</td>`;
        }).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');

      const tAlign = req.tableAlign?.align || 'center';
      const gap = req.gapToTable?.minPt || 12;
      htmlParts.push(`<table align="${tAlign}" style="margin-top: ${gap}pt; width: 80%;">${tableRowsHtml}</table>`);
    }

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(task.doc, pasted, spec);

    // Фактический результат:
    // vText > 0 (сработала ловушка typosText из-за опечаток/расхождения текста > лимита, а также требования стилей фрагментов)
    // vTable = 0 (таблица оформлена и заполнена идеально)
    // Итоговый балл: score = 1 из 2 баллов (балл за таблицу выставлен, за текст снят)
    expect(report.typosText).toBeGreaterThan(spec.typosTextLimit);
    expect(report.vText, 'vText must be > 0 due to text failure').toBeGreaterThan(0);
    expect(report.vTable, 'vTable must be 0 for compliant table').toBe(0);
    expect(report.score, 'Total score must be 1 point (factual)').toBe(1);
  });

  // 21. Таблица 2×2 вместо требуемых 3×3 — ровно 1 ошибка (tableSize), а не 3 (tableSize + tableRows + tableCols)
  it('21. Table 2x2 instead of required 3x3 produces exactly 1 failing error (tableSize), not 3', () => {
    // Выбираем сид с таблицей не менее 3x3
    let task = generateTask13(404, 1);
    for (let s = 404; s < 500; s++) {
      task = generateTask13(s, 1);
      const cols = tableWidth(task.doc.table?.rows);
      if (task.doc.table && task.doc.table.rows.length >= 3 && cols >= 3) break;
    }
    const spec = task.doc.spec!;
    const req = spec.requirements;
    const pStyles = `text-indent: ${req.indent.cm}cm; text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Times New Roman';`;

    const htmlParts: string[] = [];
    task.doc.paragraphs.forEach(p => {
      const spans = p.spans.map(s => {
        let t = s.text;
        if (s.b) t = `<b>${t}</b>`;
        if (s.i) t = `<i>${t}</i>`;
        if (s.u) t = `<u>${t}</u>`;
        if (s.sup) t = `<sup>${t}</sup>`;
        if (s.sub) t = `<sub>${t}</sub>`;
        return t;
      }).join('');
      htmlParts.push(`<p style="${pStyles}">${spans}</p>`);
    });

    // Создаём таблицу 2x2 вместо требуемой 3x3
    const tAlign = req.tableAlign?.align || 'center';
    const gap = req.gapToTable?.minPt || 12;
    htmlParts.push(`
      <table align="${tAlign}" style="margin-top: ${gap}pt; width: 80%;">
        <tr><td style="font-size: ${req.fontSize.pt}pt;">1</td><td style="font-size: ${req.fontSize.pt}pt;">2</td></tr>
        <tr><td style="font-size: ${req.fontSize.pt}pt;">3</td><td style="font-size: ${req.fontSize.pt}pt;">4</td></tr>
      </table>
    `);

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(task.doc, pasted, spec);

    const tableDimensionErrors = report.displayErrors.filter(e =>
      e.status === 'fail' && ['tableSize', 'tableRows', 'tableCols'].includes(e.id)
    );

    expect(tableDimensionErrors.length, 'Must produce exactly 1 error for table dimensions').toBe(1);
    expect(tableDimensionErrors[0].id).toBe('tableSize');
  });

  // 22. Неверное выравнивание в столбце — ровно 1 ошибка (colAlign), а не 2 (colAlign + cellAlign)
  it('22. Wrong alignment in column produces exactly 1 failing error (colAlign), not 2', () => {
    let task = generateTask13(505, 1);
    for (let s = 505; s < 600; s++) {
      task = generateTask13(s, 1);
      if (task.doc.table && task.doc.spec?.requirements.colAlign?.enabled) break;
    }
    const spec = task.doc.spec!;
    const req = spec.requirements;
    const pStyles = `text-indent: ${req.indent.cm}cm; text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Times New Roman';`;

    const htmlParts: string[] = [];
    task.doc.paragraphs.forEach(p => {
      const spans = p.spans.map(s => {
        let t = s.text;
        if (s.b) t = `<b>${t}</b>`;
        if (s.i) t = `<i>${t}</i>`;
        if (s.u) t = `<u>${t}</u>`;
        if (s.sup) t = `<sup>${t}</sup>`;
        if (s.sub) t = `<sub>${t}</sub>`;
        return t;
      }).join('');
      htmlParts.push(`<p style="${pStyles}">${spans}</p>`);
    });

    if (task.doc.table) {
      const tableRowsHtml = task.doc.table.rows.map(r => {
        const cellsHtml = r.map((c, cIdx) => {
          let cellText = c.spans.map(s => {
            let t = s.text;
            if (s.b) t = `<b>${t}</b>`;
            if (s.i) t = `<i>${t}</i>`;
            if (s.u) t = `<u>${t}</u>`;
            if (s.sup) t = `<sup>${t}</sup>`;
            if (s.sub) t = `<sub>${t}</sub>`;
            return t;
          }).join('');
          const valignAttr = c.valign ? `valign="${c.valign}"` : '';
          // Для первого столбца инвертируем выравнивание ('right' вместо 'center'/'left')
          const badAlign = (c.align || 'center') === 'right' ? 'left' : 'right';
          const alignAttr = cIdx === 0 ? `align="${badAlign}"` : `align="${c.align || 'center'}"`;
          const colspanAttr = c.colSpan && c.colSpan > 1 ? `colspan="${c.colSpan}"` : '';
          const rowspanAttr = c.rowSpan && c.rowSpan > 1 ? `rowspan="${c.rowSpan}"` : '';
          return `<td ${alignAttr} ${valignAttr} ${colspanAttr} ${rowspanAttr} style="font-size: ${req.fontSize.pt}pt;">${cellText}</td>`;
        }).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');

      const tAlign = req.tableAlign?.align || 'center';
      const gap = req.gapToTable?.minPt || 12;
      htmlParts.push(`<table align="${tAlign}" style="margin-top: ${gap}pt; width: 80%;">${tableRowsHtml}</table>`);
    }

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(task.doc, pasted, spec);

    const alignErrors = report.displayErrors.filter(e =>
      e.status === 'fail' && ['colAlign', 'cellAlign'].includes(e.id)
    );

    expect(alignErrors.length, 'Must produce exactly 1 error for column/cell alignment').toBe(1);
    expect(alignErrors[0].id).toBe('colAlign');
  });

  // 23. Документ вообще без таблицы, когда таблица требуется — ровно 1 ошибка (tableExists), а не 2 (tableExists + tableSize)
  it('23. Document with no table when table is required produces exactly 1 failing error (tableExists), not 2', () => {
    let task = generateTask13(606, 1);
    for (let s = 606; s < 700; s++) {
      task = generateTask13(s, 1);
      if (task.doc.table && task.doc.spec?.requirements.tableSize?.enabled) break;
    }
    const spec = task.doc.spec!;
    const req = spec.requirements;
    const pStyles = `text-indent: ${req.indent.cm}cm; text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Times New Roman';`;

    // Документ содержит только текст, без таблицы
    const htmlParts: string[] = [];
    task.doc.paragraphs.forEach(p => {
      const spans = p.spans.map(s => {
        let t = s.text;
        if (s.b) t = `<b>${t}</b>`;
        if (s.i) t = `<i>${t}</i>`;
        if (s.u) t = `<u>${t}</u>`;
        if (s.sup) t = `<sup>${t}</sup>`;
        if (s.sub) t = `<sub>${t}</sub>`;
        return t;
      }).join('');
      htmlParts.push(`<p style="${pStyles}">${spans}</p>`);
    });

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(task.doc, pasted, spec);

    const failedTableErrors = report.displayErrors.filter(e =>
      e.group === 'table' && e.status === 'fail'
    );

    // Должна быть ровно 1 ошибка со статусом fail — tableExists (остальные требования к таблице имеют статус unknown)
    expect(failedTableErrors.length, `Expected exactly 1 failing table error, got: ${failedTableErrors.map(e => e.id).join(', ')}`).toBe(1);
    expect(failedTableErrors[0].id).toBe('tableExists');
  });

  // 24. Граничный тест на опечатки: typosText == limit -> score 2, typosText == limit + 1 -> score 1
  it('24. Boundary test on typos: exact limit typos -> score 2, limit + 1 typos -> score 1', () => {
    const task = generateTask13(707, 1);
    const spec = task.doc.spec!;
    const req = spec.requirements;
    const pStyles = `text-indent: ${req.indent.cm}cm; text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Times New Roman';`;

    // Функция сборки HTML с заданным числом опечаток в словах основного текста
    const buildHtmlWithTypos = (typosCount: number): string => {
      let replaced = 0;
      const htmlParts: string[] = [];

      task.doc.paragraphs.forEach(p => {
        const spans = p.spans.map(s => {
          let text = s.text;
          if (replaced < typosCount) {
            // Заменяем слова на слова с опечаткой (добавляем суффикс к обычному слову без форматирования)
            const words = text.split(/(\s+)/);
            for (let w = 0; w < words.length && replaced < typosCount; w++) {
              if (/[а-яА-Яa-zA-Z]{3,}/.test(words[w]) && !s.b && !s.i && !s.u && !s.sup && !s.sub) {
                words[w] = words[w] + 'ошибка';
                replaced++;
              }
            }
            text = words.join('');
          }
          let t = text;
          if (s.b) t = `<b>${t}</b>`;
          if (s.i) t = `<i>${t}</i>`;
          if (s.u) t = `<u>${t}</u>`;
          if (s.sup) t = `<sup>${t}</sup>`;
          if (s.sub) t = `<sub>${t}</sub>`;
          return t;
        }).join('');
        htmlParts.push(`<p style="${pStyles}">${spans}</p>`);
      });

      if (task.doc.table) {
        const tableRowsHtml = task.doc.table.rows.map(r => {
          const cellsHtml = r.map(c => {
            let cellText = c.spans.map(s => {
              let t = s.text;
              if (s.b) t = `<b>${t}</b>`;
              if (s.i) t = `<i>${t}</i>`;
              if (s.u) t = `<u>${t}</u>`;
              if (s.sup) t = `<sup>${t}</sup>`;
              if (s.sub) t = `<sub>${t}</sub>`;
              return t;
            }).join('');
            const valignAttr = c.valign ? `valign="${c.valign}"` : '';
            const alignAttr = c.align ? `align="${c.align}"` : 'align="center"';
            const colspanAttr = c.colSpan && c.colSpan > 1 ? `colspan="${c.colSpan}"` : '';
            const rowspanAttr = c.rowSpan && c.rowSpan > 1 ? `rowspan="${c.rowSpan}"` : '';
            return `<td ${alignAttr} ${valignAttr} ${colspanAttr} ${rowspanAttr} style="font-size: ${req.fontSize.pt}pt;">${cellText}</td>`;
          }).join('');
          return `<tr>${cellsHtml}</tr>`;
        }).join('');

        const tAlign = req.tableAlign?.align || 'center';
        const gap = req.gapToTable?.minPt || 12;
        htmlParts.push(`<table align="${tAlign}" style="margin-top: ${gap}pt; width: 80%;">${tableRowsHtml}</table>`);
      }

      return htmlParts.join('');
    };

    // 1) Ровно лимит опечаток (5 опечаток)
    const exactLimitHtml = buildHtmlWithTypos(spec.typosTextLimit);
    const pastedExact = parsePastedHtml(exactLimitHtml);
    const reportExact = checkTask13(task.doc, pastedExact, spec);

    expect(reportExact.typosText, `Expected exactly ${spec.typosTextLimit} typos`).toBe(spec.typosTextLimit);
    expect(reportExact.vText, 'vText must be 0 when typosText == limit').toBe(0);
    expect(reportExact.vTable, 'vTable must be 0 for compliant table').toBe(0);
    expect(reportExact.score, 'Score must be 2 when typos count equals limit').toBe(2);

    // 2) Лимит + 1 опечатка (6 опечаток)
    const overLimitHtml = buildHtmlWithTypos(spec.typosTextLimit + 1);
    const pastedOver = parsePastedHtml(overLimitHtml);
    const reportOver = checkTask13(task.doc, pastedOver, spec);

    expect(reportOver.typosText, `Expected exactly ${spec.typosTextLimit + 1} typos`).toBe(spec.typosTextLimit + 1);
    expect(reportOver.vText, 'vText must be > 0 when typosText == limit + 1').toBeGreaterThan(0);
    expect(reportOver.vTable, 'vTable must be 0 for compliant table').toBe(0);
    expect(reportOver.score, 'Score must be 1 when typos count is limit + 1').toBe(1);
  });

  // 25. Текст, набранный целиком строчными буквами, даёт опечатки сверх лимита и балл 1
  it('25. Document with all lowercase letters produces typos exceeding limit and scores 1 point', () => {
    // Находим сид, где в тексте содержится больше заглавных букв (предложений/имён), чем typosTextLimit
    let task = generateTask13(101, 2);
    for (let s = 101; s < 200; s++) {
      task = generateTask13(s, 2);
      const full = task.doc.paragraphs.map(p => p.spans.map(sp => sp.text).join('')).join(' ');
      const caps = (full.match(/\b\p{Lu}\p{Ll}*/gu) || []).length;
      if (caps > (task.doc.spec?.typosTextLimit || 5)) break;
    }
    const spec = task.doc.spec!;
    const req = spec.requirements;
    const pStyles = `text-indent: ${req.indent.cm}cm; text-align: ${req.bodyAlign.align}; font-size: ${req.fontSize.pt}pt; line-height: ${req.lineSpacing.minRatio}; font-family: 'Times New Roman';`;

    const htmlParts: string[] = [];
    task.doc.paragraphs.forEach(p => {
      const spans = p.spans.map(s => {
        // Переводим текст в нижний регистр
        let t = s.text.toLowerCase();
        if (s.b) t = `<b>${t}</b>`;
        if (s.i) t = `<i>${t}</i>`;
        if (s.u) t = `<u>${t}</u>`;
        if (s.sup) t = `<sup>${t}</sup>`;
        if (s.sub) t = `<sub>${t}</sub>`;
        return t;
      }).join('');
      htmlParts.push(`<p style="${pStyles}">${spans}</p>`);
    });

    if (task.doc.table) {
      const tableRowsHtml = task.doc.table.rows.map(r => {
        const cellsHtml = r.map(c => {
          let cellText = c.spans.map(s => {
            let t = s.text;
            if (s.b) t = `<b>${t}</b>`;
            if (s.i) t = `<i>${t}</i>`;
            if (s.u) t = `<u>${t}</u>`;
            if (s.sup) t = `<sup>${t}</sup>`;
            if (s.sub) t = `<sub>${t}</sub>`;
            return t;
          }).join('');
          const valignAttr = c.valign ? `valign="${c.valign}"` : '';
          const alignAttr = c.align ? `align="${c.align}"` : 'align="center"';
          const colspanAttr = c.colSpan && c.colSpan > 1 ? `colspan="${c.colSpan}"` : '';
          const rowspanAttr = c.rowSpan && c.rowSpan > 1 ? `rowspan="${c.rowSpan}"` : '';
          return `<td ${alignAttr} ${valignAttr} ${colspanAttr} ${rowspanAttr} style="font-size: ${req.fontSize.pt}pt;">${cellText}</td>`;
        }).join('');
        return `<tr>${cellsHtml}</tr>`;
      }).join('');

      const tAlign = req.tableAlign?.align || 'center';
      const gap = req.gapToTable?.minPt || 12;
      htmlParts.push(`<table align="${tAlign}" style="margin-top: ${gap}pt; width: 80%;">${tableRowsHtml}</table>`);
    }

    const pasted = parsePastedHtml(htmlParts.join(''));
    const report = checkTask13(task.doc, pasted, spec);

    // В тексте образца есть заглавные буквы (в начале предложений, именах собственных и т.д.)
    // Поэтому при переводе всего текста в строчные буквы возникают опечатки по регистру
    expect(report.typosText, 'Typos count must be greater than limit due to lowercase casing').toBeGreaterThan(spec.typosTextLimit);
    expect(report.vText, 'vText must be > 0 because typosText failed').toBeGreaterThan(0);
    expect(report.vTable, 'vTable must be 0 for valid table').toBe(0);
    expect(report.score, 'Score must be 1 point').toBe(1);
  });

  // 26. Текст совпадает с образцом, но все длинные тире заменены на дефисы — опечаток 0, балл 2
  it('26. Text matching sample with em/en-dashes replaced by regular hyphens produces 0 typos and score 2', () => {
    const docText = 'Марс — четвёртая планета — исследуется аппаратами.';
    const pastedText = 'Марс - четвёртая планета - исследуется аппаратами.';
    const doc: Doc = {
      headingIndex: null,
      paragraphs: [{ spans: [{ text: docText }] }],
      table: {
        rows: [
          [{ spans: [{ text: 'Объект — Марс' }], colSpan: 1, rowSpan: 1, align: 'center', valign: 'middle' }]
        ]
      }
    };
    const spec: TaskSpec = {
      ...structuredClone(DEFAULT_SPEC),
      requirements: {
        ...structuredClone(DEFAULT_SPEC.requirements),
        fontSize: { enabled: true, pt: 14 },
        indent: { enabled: true, cm: 1.25 },
        bodyAlign: { enabled: true, align: 'justify' },
        lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
        emphasis: { enabled: false, bold: false, italic: false, underline: false },
        tableWidth: { enabled: false },
        tableSize: { enabled: true, rows: 1, cols: 1 },
        tableAlign: { enabled: false, align: 'center' },
        boldCells: { enabled: false },
        colAlign: { enabled: false },
        gapToTable: { enabled: false, minPt: 12, maxPt: 24 },
        paraSpacing: { enabled: false, minPt: 6, maxPt: 12 }
      }
    };

    const html = `
      <p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">${pastedText}</p>
      <table align="center"><tr><td align="center" valign="middle" style="font-size: 14pt;">Объект - Марс</td></tr></table>
    `;
    const pasted = parsePastedHtml(html);
    const report = checkTask13(doc, pasted, spec);

    expect(report.typosText).toBe(0);
    expect(report.typosTable).toBe(0);
    expect(report.vText).toBe(0);
    expect(report.vTable).toBe(0);
    expect(report.score).toBe(2);
  });

  // 27. Текст совпадает с образцом, но убраны три запятые — ровно 3 опечатки, балл 2 (в пределах лимита 5)
  it('27. Text with exactly 3 missing commas produces 3 typos and scores 2 points', () => {
    const docText = 'Текст содержит слово раз, слово два, слово три, и больше ничего.';
    const pastedText = 'Текст содержит слово раз слово два слово три и больше ничего.';
    const doc: Doc = {
      headingIndex: null,
      paragraphs: [{ spans: [{ text: docText }] }],
      table: {
        rows: [
          [{ spans: [{ text: 'Ячейка' }], colSpan: 1, rowSpan: 1, align: 'center', valign: 'middle' }]
        ]
      }
    };
    const spec: TaskSpec = {
      ...structuredClone(DEFAULT_SPEC),
      requirements: {
        ...structuredClone(DEFAULT_SPEC.requirements),
        fontSize: { enabled: true, pt: 14 },
        indent: { enabled: true, cm: 1.25 },
        bodyAlign: { enabled: true, align: 'justify' },
        lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
        emphasis: { enabled: false, bold: false, italic: false, underline: false },
        tableWidth: { enabled: false },
        tableSize: { enabled: true, rows: 1, cols: 1 },
        tableAlign: { enabled: true, align: 'center' },
        boldCells: { enabled: false },
        colAlign: { enabled: false },
        gapToTable: { enabled: false, minPt: 12, maxPt: 24 },
        paraSpacing: { enabled: false, minPt: 6, maxPt: 12 }
      }
    };

    const html = `
      <p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">${pastedText}</p>
      <table align="center"><tr><td align="center" valign="middle" style="font-size: 14pt;">Ячейка</td></tr></table>
    `;
    const pasted = parsePastedHtml(html);
    const report = checkTask13(doc, pasted, spec);

    expect(report.typosText).toBe(3);
    expect(report.vText).toBe(0);
    expect(report.vTable).toBe(0);
    expect(report.score).toBe(2);
  });

  // 28. Текст совпадает с образцом, но убраны шесть запятых — опечаток 6, балл 1
  it('28. Text with 6 missing commas produces 6 typos and scores 1 point', () => {
    const docText = 'Один, два, три, четыре, пять, шесть, семь.';
    const pastedText = 'Один два три четыре пять шесть семь.';
    const doc: Doc = {
      headingIndex: null,
      paragraphs: [{ spans: [{ text: docText }] }],
      table: {
        rows: [
          [{ spans: [{ text: 'Ячейка' }], colSpan: 1, rowSpan: 1, align: 'center', valign: 'middle' }]
        ]
      }
    };
    const spec: TaskSpec = {
      ...structuredClone(DEFAULT_SPEC),
      requirements: {
        ...structuredClone(DEFAULT_SPEC.requirements),
        fontSize: { enabled: true, pt: 14 },
        indent: { enabled: true, cm: 1.25 },
        bodyAlign: { enabled: true, align: 'justify' },
        lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
        emphasis: { enabled: false, bold: false, italic: false, underline: false },
        tableWidth: { enabled: false },
        tableSize: { enabled: true, rows: 1, cols: 1 },
        tableAlign: { enabled: true, align: 'center' },
        boldCells: { enabled: false },
        colAlign: { enabled: false },
        gapToTable: { enabled: false, minPt: 12, maxPt: 24 },
        paraSpacing: { enabled: false, minPt: 6, maxPt: 12 }
      }
    };

    const html = `
      <p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">${pastedText}</p>
      <table align="center"><tr><td align="center" valign="middle" style="font-size: 14pt;">Ячейка</td></tr></table>
    `;
    const pasted = parsePastedHtml(html);
    const report = checkTask13(doc, pasted, spec);

    expect(report.typosText).toBe(6);
    expect(report.vText).toBeGreaterThan(0);
    expect(report.vTable).toBe(0);
    expect(report.score).toBe(1);
  });

  // 29. Текст совпадает с образцом, но все кавычки заменены с «ёлочек» на типографские “ ” — опечаток 0, балл 2
  it('29. Text matching sample with guillemets replaced by typographical quotes “ ” produces 0 typos and score 2', () => {
    const docText = 'Планета «Марс» изучается станцией «Маринер-4».';
    const pastedText = 'Планета “Марс” изучается станцией “Маринер-4”.';
    const doc: Doc = {
      headingIndex: null,
      paragraphs: [{ spans: [{ text: docText }] }],
      table: {
        rows: [
          [{ spans: [{ text: 'Миссия «Викинг»' }], colSpan: 1, rowSpan: 1, align: 'center', valign: 'middle' }]
        ]
      }
    };
    const spec: TaskSpec = {
      ...structuredClone(DEFAULT_SPEC),
      requirements: {
        ...structuredClone(DEFAULT_SPEC.requirements),
        fontSize: { enabled: true, pt: 14 },
        indent: { enabled: true, cm: 1.25 },
        bodyAlign: { enabled: true, align: 'justify' },
        lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
        emphasis: { enabled: false, bold: false, italic: false, underline: false },
        tableWidth: { enabled: false },
        tableSize: { enabled: true, rows: 1, cols: 1 },
        tableAlign: { enabled: true, align: 'center' },
        boldCells: { enabled: false },
        colAlign: { enabled: false },
        gapToTable: { enabled: false, minPt: 12, maxPt: 24 },
        paraSpacing: { enabled: false, minPt: 6, maxPt: 12 }
      }
    };

    const html = `
      <p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">${pastedText}</p>
      <table align="center"><tr><td align="center" valign="middle" style="font-size: 14pt;">Миссия “Викинг”</td></tr></table>
    `;
    const pasted = parsePastedHtml(html);
    const report = checkTask13(doc, pasted, spec);

    expect(report.typosText).toBe(0);
    expect(report.typosTable).toBe(0);
    expect(report.vText).toBe(0);
    expect(report.vTable).toBe(0);
    expect(report.score).toBe(2);
  });

  // 30. Текст совпадает с образцом, но все кавычки заменены на прямые " " — опечаток 0, балл 2
  it('30. Text matching sample with guillemets replaced by straight quotes " " produces 0 typos and score 2', () => {
    const docText = 'Планета «Марс» изучается станцией «Маринер-4».';
    const pastedText = 'Планета "Марс" изучается станцией "Маринер-4".';
    const doc: Doc = {
      headingIndex: null,
      paragraphs: [{ spans: [{ text: docText }] }],
      table: {
        rows: [
          [{ spans: [{ text: 'Миссия «Викинг»' }], colSpan: 1, rowSpan: 1, align: 'center', valign: 'middle' }]
        ]
      }
    };
    const spec: TaskSpec = {
      ...structuredClone(DEFAULT_SPEC),
      requirements: {
        ...structuredClone(DEFAULT_SPEC.requirements),
        fontSize: { enabled: true, pt: 14 },
        indent: { enabled: true, cm: 1.25 },
        bodyAlign: { enabled: true, align: 'justify' },
        lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
        emphasis: { enabled: false, bold: false, italic: false, underline: false },
        tableWidth: { enabled: false },
        tableSize: { enabled: true, rows: 1, cols: 1 },
        tableAlign: { enabled: true, align: 'center' },
        boldCells: { enabled: false },
        colAlign: { enabled: false },
        gapToTable: { enabled: false, minPt: 12, maxPt: 24 },
        paraSpacing: { enabled: false, minPt: 6, maxPt: 12 }
      }
    };

    const html = `
      <p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">${pastedText}</p>
      <table align="center"><tr><td align="center" valign="middle" style="font-size: 14pt;">Миссия "Викинг"</td></tr></table>
    `;
    const pasted = parsePastedHtml(html);
    const report = checkTask13(doc, pasted, spec);

    expect(report.typosText).toBe(0);
    expect(report.typosTable).toBe(0);
    expect(report.vText).toBe(0);
    expect(report.vTable).toBe(0);
    expect(report.score).toBe(2);
  });

  // 31. Текст совпадает с образцом, но в слове с дефисом внутри («Маринер-4») дефис заменён на короткое тире – и на длинное — , опечаток 0, балл 2
  it('31. Text matching sample with internal hyphens replaced by en-dash and em-dash produces 0 typos and score 2', () => {
    const docText = 'Автоматическая станция Маринер-4 и зонд Вояджер-2 исследовали планеты.';
    const pastedText = 'Автоматическая станция Маринер–4 и зонд Вояджер—2 исследовали планеты.';
    const doc: Doc = {
      headingIndex: null,
      paragraphs: [{ spans: [{ text: docText }] }],
      table: {
        rows: [
          [{ spans: [{ text: 'Аппарат Маринер-4' }], colSpan: 1, rowSpan: 1, align: 'center', valign: 'middle' }]
        ]
      }
    };
    const spec: TaskSpec = {
      ...structuredClone(DEFAULT_SPEC),
      requirements: {
        ...structuredClone(DEFAULT_SPEC.requirements),
        fontSize: { enabled: true, pt: 14 },
        indent: { enabled: true, cm: 1.25 },
        bodyAlign: { enabled: true, align: 'justify' },
        lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
        emphasis: { enabled: false, bold: false, italic: false, underline: false },
        tableWidth: { enabled: false },
        tableSize: { enabled: true, rows: 1, cols: 1 },
        tableAlign: { enabled: true, align: 'center' },
        boldCells: { enabled: false },
        colAlign: { enabled: false },
        gapToTable: { enabled: false, minPt: 12, maxPt: 24 },
        paraSpacing: { enabled: false, minPt: 6, maxPt: 12 }
      }
    };

    const html = `
      <p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">${pastedText}</p>
      <table align="center"><tr><td align="center" valign="middle" style="font-size: 14pt;">Аппарат Маринер–4</td></tr></table>
    `;
    const pasted = parsePastedHtml(html);
    const report = checkTask13(doc, pasted, spec);

    expect(report.typosText).toBe(0);
    expect(report.typosTable).toBe(0);
    expect(report.vText).toBe(0);
    expect(report.vTable).toBe(0);
    expect(report.score).toBe(2);
  });

  // 32. Текст совпадает с образцом, но обычный пробел между числом и единицей («10 см») заменён на неразрывный U+00A0 — опечаток 0, балл 2
  it('32. Text matching sample with space between number and unit replaced by non-breaking space U+00A0 produces 0 typos and score 2', () => {
    const docText = 'Длина образца составляет 10 см и масса 25 кг.';
    const pastedText = 'Длина образца составляет 10\u00A0см и масса 25\u00A0кг.';
    const doc: Doc = {
      headingIndex: null,
      paragraphs: [{ spans: [{ text: docText }] }],
      table: {
        rows: [
          [{ spans: [{ text: 'Диаметр 10 см' }], colSpan: 1, rowSpan: 1, align: 'center', valign: 'middle' }]
        ]
      }
    };
    const spec: TaskSpec = {
      ...structuredClone(DEFAULT_SPEC),
      requirements: {
        ...structuredClone(DEFAULT_SPEC.requirements),
        fontSize: { enabled: true, pt: 14 },
        indent: { enabled: true, cm: 1.25 },
        bodyAlign: { enabled: true, align: 'justify' },
        lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
        emphasis: { enabled: false, bold: false, italic: false, underline: false },
        tableWidth: { enabled: false },
        tableSize: { enabled: true, rows: 1, cols: 1 },
        tableAlign: { enabled: true, align: 'center' },
        boldCells: { enabled: false },
        colAlign: { enabled: false },
        gapToTable: { enabled: false, minPt: 12, maxPt: 24 },
        paraSpacing: { enabled: false, minPt: 6, maxPt: 12 }
      }
    };

    const html = `
      <p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">${pastedText}</p>
      <table align="center"><tr><td align="center" valign="middle" style="font-size: 14pt;">Диаметр 10\u00A0см</td></tr></table>
    `;
    const pasted = parsePastedHtml(html);
    const report = checkTask13(doc, pasted, spec);

    expect(report.typosText).toBe(0);
    expect(report.typosTable).toBe(0);
    expect(report.vText).toBe(0);
    expect(report.vTable).toBe(0);
    expect(report.score).toBe(2);
  });

  // 35. Аудит статуса unknown на lo-broken-l1.json и документе без line-height и margin
  it('35. Unknown status audit on broken fixture and missing css properties', () => {
    // 1) Фикстура lo-broken-l1.json
    const fixturePath = path.resolve(__dirname, '../__fixtures__/lo-broken-l1.json');
    const fixtureContent = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const pastedBroken = parsePastedHtml(fixtureContent.html);
    const brokenDoc: Doc = {
      headingIndex: fixtureContent.task.headingIndex ?? null,
      paragraphs: fixtureContent.task.targetText || [],
      table: fixtureContent.task.targetTable || null
    };
    const brokenSpec: TaskSpec = {
      ...DEFAULT_SPEC,
      requirements: fixtureContent.task.requirements || DEFAULT_SPEC.requirements
    };
    const reportBroken = checkTask13(brokenDoc, pastedBroken, brokenSpec);
    const brokenUnknownItems = reportBroken.items.filter(it => it.status === 'unknown');
    const brokenUnknownIds = brokenUnknownItems.map(it => it.id);

    console.log(`[Test 35] lo-broken-l1 unknown criteria count: ${brokenUnknownIds.length}, IDs: [${brokenUnknownIds.join(', ')}]`);
    expect(brokenUnknownIds).toEqual(['gapToTable']);

    // 2) Документ, где у абзацев отсутствуют свойства line-height и margin
    const htmlNoMarginsNoLineHeight = `
      <p style="font-size: 14pt; text-indent: 1cm; text-align: justify; font-family: 'Times New Roman';">Первый абзац основного текста задания без междустрочного интервала и отступов.</p>
      <p style="font-size: 14pt; text-indent: 1cm; text-align: justify; font-family: 'Times New Roman';">Второй абзац основного текста задания без междустрочного интервала и отступов.</p>
      <table align="center" style="width: 70%;"><tr><td style="font-size: 14pt;" align="center">Ячейка 1</td><td style="font-size: 14pt;" align="center">Ячейка 2</td></tr></table>
    `;
    const pastedNoProps = parsePastedHtml(htmlNoMarginsNoLineHeight);
    const testDoc: Doc = {
      paragraphs: [
        { spans: [{ text: 'Первый абзац основного текста задания без междустрочного интервала и отступов.' }] },
        { spans: [{ text: 'Второй абзац основного текста задания без междустрочного интервала и отступов.' }] }
      ],
      table: {
        rows: [[
          { spans: [{ text: 'Ячейка 1' }], colSpan: 1, rowSpan: 1, align: 'center' },
          { spans: [{ text: 'Ячейка 2' }], colSpan: 1, rowSpan: 1, align: 'center' }
        ]]
      }
    };
    // Проверяем на L1 спецификации (где paraSpacing disabled, gapToTable enabled)
    const reportNoPropsL1 = checkTask13(testDoc, pastedNoProps, SPEC_L1);
    const noPropsL1UnknownItems = reportNoPropsL1.items.filter(it => it.status === 'unknown');
    const noPropsL1UnknownIds = noPropsL1UnknownItems.map(it => it.id).sort();

    console.log(`[Test 35] L1 without line-height & margin unknown count: ${noPropsL1UnknownIds.length}, IDs: [${noPropsL1UnknownIds.join(', ')}]`);
    expect(noPropsL1UnknownIds).toEqual([]);

    // Проверяем на L3 спецификации (где paraSpacing enabled, gapToTable enabled)
    const reportNoPropsL3 = checkTask13(testDoc, pastedNoProps, SPEC_L3);
    const noPropsL3UnknownItems = reportNoPropsL3.items.filter(it => it.status === 'unknown');
    const noPropsL3UnknownIds = noPropsL3UnknownItems.map(it => it.id).sort();

    console.log(`[Test 35] L3 without line-height & margin unknown count: ${noPropsL3UnknownIds.length}, IDs: [${noPropsL3UnknownIds.join(', ')}]`);
    expect(noPropsL3UnknownIds).toEqual([]);
  });

  // 36. Вложенные таблицы в <center> и <div align="center"> и проверка lo-broken-l1
  it('36. Nested table inside <center> and <div align="center"> and lo-broken-l1 fixture', () => {
    // 1) HTML с <center><table>...</table></center>
    const htmlCenter = `
      <p style="font-size: 14pt; text-indent: 1cm; text-align: justify; font-family: 'Times New Roman';">Текст параграфа</p>
      <center>
        <table width="300" border="1">
          <tr><td align="left">Ячейка 1</td><td align="center">Ячейка 2</td></tr>
        </table>
      </center>
    `;
    const pastedCenter = parsePastedHtml(htmlCenter);
    expect(pastedCenter.table).not.toBeNull();
    expect(pastedCenter.table?.rows.length).toBe(1);
    expect(pastedCenter.tableAlign).toBe('center');

    const testDocCenter: Doc = {
      paragraphs: [{ spans: [{ text: 'Текст параграфа' }] }],
      table: {
        rows: [[
          { spans: [{ text: 'Ячейка 1' }], colSpan: 1, rowSpan: 1, align: 'left' },
          { spans: [{ text: 'Ячейка 2' }], colSpan: 1, rowSpan: 1, align: 'center' }
        ]]
      }
    };
    const reportCenter = checkTask13(testDocCenter, pastedCenter, SPEC_L1);
    const tableExistsItemCenter = reportCenter.items.find(i => i.id === 'tableExists');
    expect(tableExistsItemCenter).toBeUndefined(); // tableExists добавляется только при отсутствии таблицы

    // 2) HTML с <div align="center"><table>...</table></div>
    const htmlDiv = `
      <p style="font-size: 14pt; text-indent: 1cm; text-align: justify; font-family: 'Times New Roman';">Текст параграфа</p>
      <div align="center">
        <table width="300" border="1">
          <tr><td align="left">Ячейка 1</td><td align="center">Ячейка 2</td></tr>
        </table>
      </div>
    `;
    const pastedDiv = parsePastedHtml(htmlDiv);
    expect(pastedDiv.table).not.toBeNull();
    expect(pastedDiv.table?.rows.length).toBe(1);
    expect(pastedDiv.tableAlign).toBe('center');

    const reportDiv = checkTask13(testDocCenter, pastedDiv, SPEC_L1);
    const tableExistsItemDiv = reportDiv.items.find(i => i.id === 'tableExists');
    expect(tableExistsItemDiv).toBeUndefined();

    // 3) Фикстура lo-broken-l1
    const fixturePath = path.resolve(__dirname, '../__fixtures__/lo-broken-l1.json');
    const fixtureContent = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const pastedBroken = parsePastedHtml(fixtureContent.html);
    expect(pastedBroken.table).not.toBeNull();
    expect(pastedBroken.table?.rows.length).toBe(3);

    const brokenDoc: Doc = {
      headingIndex: fixtureContent.task.headingIndex ?? null,
      paragraphs: fixtureContent.task.targetText || [],
      table: fixtureContent.task.targetTable || null
    };
    const brokenSpec: TaskSpec = {
      ...DEFAULT_SPEC,
      requirements: fixtureContent.task.requirements || DEFAULT_SPEC.requirements
    };
    const reportBroken = checkTask13(brokenDoc, pastedBroken, brokenSpec);

    // tableExists отсутствует (таблица найдена)
    expect(reportBroken.items.find(i => i.id === 'tableExists')).toBeUndefined();

    // typosTable присутствует и отмечает опечатку «679» в строке 1 (Марс)
    const typosTableItem = reportBroken.items.find(i => i.id === 'typosTable');
    expect(typosTableItem).toBeDefined();
    expect(typosTableItem?.actual).toBe('опечаток: 1');
    expect(typosTableItem?.marks).toEqual([{ kind: 'cell', row: 1, col: 1 }]);
  });

  // 37. Сравнение парсинга DOMParser (браузер) и jsdom (node/vitest)
  it('37. Parser output parity: DOMParser vs jsdom', () => {
    const html = `
      <p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; line-height: 1.5; margin-bottom: 12pt;">Тестовый параграф</p>
      <center><table width="300"><tr><td>Ячейка 1</td><td>Ячейка 2</td></tr></table></center>
    `;
    const resDirect = parsePastedHtml(html);

    // Имитируем DOMParser
    const jsdom = require('jsdom');
    const dom = new jsdom.JSDOM();
    const originalDOMParser = globalThis.DOMParser;
    try {
      globalThis.DOMParser = dom.window.DOMParser;
      const resSimulatedBrowser = parsePastedHtml(html);
      expect(resDirect).toEqual(resSimulatedBrowser);
    } finally {
      globalThis.DOMParser = originalDOMParser;
    }
  });

  // 38. Пустые абзацы перед таблицей: ровно 1 штрафная единица (emptyParas), gapToTable status: unknown blocked
  it('38. Empty paragraph before table only penalizes emptyParas, gapToTable is unknown: blocked', () => {
    const doc: Doc = {
      paragraphs: [{ spans: [{ text: 'Абзац идеального текста задания.' }] }],
      table: {
        rows: [
          [
            { spans: [{ text: '1' }], colSpan: 1, rowSpan: 1, align: 'left' },
            { spans: [{ text: '2' }], colSpan: 1, rowSpan: 1, align: 'center' }
          ]
        ]
      }
    };

    const spec: TaskSpec = {
      ...DEFAULT_SPEC,
      requirements: {
        ...DEFAULT_SPEC.requirements,
        fontSize: { enabled: true, pt: 14 },
        indent: { enabled: true, cm: 1.25 },
        bodyAlign: { enabled: true, align: 'justify' },
        lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
        tableSize: { enabled: true, rows: 1, cols: 2 },
        colAlign: { enabled: true },
        gapToTable: { enabled: true, minPt: 12, maxPt: 24 }
      }
    };

    const htmlWithEmptyPara = `
      <p style="font-size: 14pt; line-height: 1.2; text-indent: 1.25cm; text-align: justify;">Абзац идеального текста задания.</p>
      <p><br/></p>
      <table align="center" style="width: 70%;"><tr><td align="left" style="font-size: 14pt;">1</td><td align="center" style="font-size: 14pt;">2</td></tr></table>
    `;

    const pasted = parsePastedHtml(htmlWithEmptyPara);
    const report = checkTask13(doc, pasted, spec);

    // Ровно 1 критическая ошибка
    const critErrors = report.items.filter(isCritError);
    expect(critErrors.map(e => e.id)).toEqual(['emptyParas']);

    // gapToTable помечен как unknownReason: 'blocked'
    const gapToTableItem = report.items.find(i => i.id === 'gapToTable');
    expect(gapToTableItem).toBeDefined();
    expect(gapToTableItem?.status).toBe('unknown');
    expect(gapToTableItem?.unknownReason).toBe('blocked');

    // Баллы: vText = 1, vTable = 0, score = 1
    expect(report.vText).toBe(1);
    expect(report.vTable).toBe(0);
    expect(report.score).toBe(1);
  });
});



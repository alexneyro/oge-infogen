import { describe, it, expect } from 'vitest';
import { TASK13_REQUIREMENTS_POLICY } from '../registry';
import { generateTask13 } from '../generate';
import { parsePastedHtml } from '../html';
import { checkTask13 } from '../check';
import { formatTask13Conditions, formatTask13Preamble, formatLineSpacingPhrase, DEFAULT_SPEC, generateTaskRequirements, tableWidth } from '../spec';
import { Doc } from '../parse';
import { renderCompliantHtml } from './fixtures/render';

const SEEDS = Number(process.env.TASK13_SEEDS ?? 5);

describe.concurrent('Task 13 Multi-Seed Audits', () => {
  // 4. Диапазоны интервалов (Spacing ranges)
  it('4. Spacing ranges: min < max and gapToTable.min > paraSpacing.max across seeds per level (L1-L3)', () => {
    [1, 2, 3].forEach(level => {
      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 401 + level * 10000;
        const task = generateTask13(seed, level as any);
        const req = task.doc.spec!.requirements;

        if (req.paraSpacing.enabled) {
          expect(req.paraSpacing.minPt).toBeLessThan(req.paraSpacing.maxPt);
          expect(req.paraSpacing.minPt).toBeGreaterThanOrEqual(4);
          expect(req.paraSpacing.maxPt).toBeLessThanOrEqual(12);
        }

        if (req.gapToTable.enabled) {
          expect(req.gapToTable.minPt).toBeLessThan(req.gapToTable.maxPt);
          expect(req.gapToTable.minPt).toBeGreaterThanOrEqual(15);
          expect(req.gapToTable.maxPt).toBeLessThanOrEqual(30);
        }

        if (req.paraSpacing.enabled && req.gapToTable.enabled) {
          expect(req.gapToTable.minPt).toBeGreaterThan(req.paraSpacing.maxPt);
        }
      }
    });
  }, 60000);

  // 7. Формулировка
  it('7. Conditions formulation: L1 7-8 items, L2 9-10 items, L3 11-12 items across seeds, no word+number mixing, preamble separated', () => {
    const preamble = formatTask13Preamble();
    expect(preamble).toContain('В этом случае разбиение текста на строки');
    expect(preamble).toContain('.odt');

    const mixedCheck1 = formatLineSpacingPhrase(1.15, 1.5);
    expect(mixedCheck1).toBe('Расстояние между строками текста — не менее 1,15, но не более 1,5 междустрочного интервала.');
    expect(mixedCheck1).not.toContain('полуторного');

    const wordCheck = formatLineSpacingPhrase(1.0, 1.5);
    expect(wordCheck).toBe('Расстояние между строками текста — не менее одинарного, но не более полуторного междустрочного интервала.');

    [1, 2, 3].forEach(level => {
      const minExpected = level === 1 ? 7 : level === 2 ? 9 : 11;
      const maxExpected = level === 1 ? 8 : level === 2 ? 10 : 12;

      if (level === 1 || level === 3) {
        const seed = 1;
        const task = generateTask13(seed, level as any);
        const conditions = formatTask13Conditions(task.doc, task.doc.spec);
        console.log(`[Test 7 stdout] L${level} seed=${seed}: ${conditions.length} пунктов:`);
        conditions.forEach((c, idx) => console.log(`  ${idx + 1}. ${c.text}`));
      }

      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 733 + level * 10000;
        const task = generateTask13(seed, level as any);
        const conditions = formatTask13Conditions(task.doc, task.doc.spec);

        expect(
          conditions.length,
          `Seed ${seed} at level ${level} has ${conditions.length} condition items (expected ${minExpected}-${maxExpected})`
        ).toBeGreaterThanOrEqual(minExpected);
        expect(
          conditions.length,
          `Seed ${seed} at level ${level} has ${conditions.length} condition items (expected ${minExpected}-${maxExpected})`
        ).toBeLessThanOrEqual(maxExpected);

        conditions.forEach((cond, idx) => {
          expect(cond.text).not.toContain('разбиение текста на строки должно соответствовать');
          expect(cond.text).not.toContain('.odt');

          expect(
            cond.text.length,
            `Seed ${seed} L${level} item ${idx + 1} ("${cond.text}") is ${cond.text.length} chars (must be <= 120)`
          ).toBeLessThanOrEqual(120);

          expect(
            cond.ids.length,
            `Seed ${seed} L${level} item ${idx + 1} has ${cond.ids.length} requirements (${cond.ids.join(', ')}) (must be <= 2)`
          ).toBeLessThanOrEqual(2);
        });
      }
    });
  }, 60000);

  // 8. Сверка двух независимых источников
  it('8. Two independent sources comparison: List A (formulation declared IDs) === List B (checkTask13 score-reducing requirement IDs)', () => {
    const preamble = formatTask13Preamble();
    expect(preamble).toContain('в соответствии с образцом');

    const inCheckNotFormulation = new Map<string, { seed: number; level: number }>();
    const inFormulationNotCheck = new Map<string, { seed: number; level: number }>();

    [1, 2, 3].forEach(level => {
      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 1337 + level * 10000;
        const task = generateTask13(seed, level as any);
        const spec = task.doc.spec!;

        const conditions = formatTask13Conditions(task.doc, spec);
        const listA = Array.from(new Set(conditions.flatMap(c => c.ids))).sort();

        const baseHtml = renderCompliantHtml(task);
        const pasted = parsePastedHtml(baseHtml);
        const report = checkTask13(task.doc, pasted, spec);

        const listB = Array.from(
          new Set(
            report.items
              .filter(item => {
                const pol = TASK13_REQUIREMENTS_POLICY.find(p => p.id === item.id);
                return pol && pol.declare === 'text' && (item.group === 'text' || item.group === 'table');
              })
              .map(item => item.id)
          )
        ).sort();

        const onlyB = listB.filter(id => !listA.includes(id));
        const onlyA = listA.filter(id => !listB.includes(id));

        onlyB.forEach(id => {
          if (!inCheckNotFormulation.has(id)) {
            inCheckNotFormulation.set(id, { seed, level });
          }
        });

        onlyA.forEach(id => {
          if (!inFormulationNotCheck.has(id)) {
            inFormulationNotCheck.set(id, { seed, level });
          }
        });
      }
    });

    if (inCheckNotFormulation.size > 0 || inFormulationNotCheck.size > 0) {
      const msgParts = ['\n[РАСХОЖДЕНИЯ ДВУХ ИСТОЧНИКОВ ТРЕБОВАНИЙ]:'];

      msgParts.push(`\n1. Снимают балл (declare: 'text'), но ОТСУТСТВУЮТ в тексте задания (${inCheckNotFormulation.size} шт.):`);
      if (inCheckNotFormulation.size === 0) {
        msgParts.push('   (нет)');
      } else {
        Array.from(inCheckNotFormulation.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([id, ex]) => {
            msgParts.push(`   - ${id} (пример: seed ${ex.seed}, L${ex.level})`);
          });
      }

      msgParts.push(`\n2. Есть в тексте задания, но НЕ СНИМАЮТ балл (${inFormulationNotCheck.size} шт.):`);
      if (inFormulationNotCheck.size === 0) {
        msgParts.push('   (нет)');
      } else {
        Array.from(inFormulationNotCheck.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([id, ex]) => {
            msgParts.push(`   - ${id} (пример: seed ${ex.seed}, L${ex.level})`);
          });
      }

      expect.fail(msgParts.join('\n'));
    }
  }, 60000);

  // 9. gapToTable.minPt > paraSpacing.maxPt
  it('9. gapToTable.minPt > paraSpacing.maxPt across seeds (L1-L3)', () => {
    [1, 2, 3].forEach(level => {
      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 499 + level * 10000;
        const task = generateTask13(seed, level as any);
        const req = task.doc.spec!.requirements;
        if (req.gapToTable.enabled && req.paraSpacing.enabled) {
          expect(
            req.gapToTable.minPt,
            `Seed ${seed}: gapToTable.minPt (${req.gapToTable.minPt}) must be > paraSpacing.maxPt (${req.paraSpacing.maxPt})`
          ).toBeGreaterThan(req.paraSpacing.maxPt);
        }
      }
    });
  }, 60000);

  // 14. Множество id, снимающих балл, является подмножеством выбранного набора формулировки
  it('14. Strict subset policy: score-reducing requirement IDs in checkTask13 must be a subset of declared formulation IDs', () => {
    [1, 2, 3].forEach(level => {
      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 2027 + level * 10000;
        const task = generateTask13(seed, level as any);
        const spec = task.doc.spec!;

        const conditions = formatTask13Conditions(task.doc, spec);
        const declaredIds = new Set(conditions.flatMap(c => c.ids));

        const baseHtml = renderCompliantHtml(task);
        const pasted = parsePastedHtml(baseHtml);
        const report = checkTask13(task.doc, pasted, spec);

        const scoreReducingDeclaredIds = Array.from(
          new Set(
            report.items
              .filter(item => {
                const pol = TASK13_REQUIREMENTS_POLICY.find(p => p.id === item.id);
                return pol && pol.declare === 'text' && (item.group === 'text' || item.group === 'table');
              })
              .map(item => item.id)
          )
        );

        scoreReducingDeclaredIds.forEach(id => {
          expect(
            declaredIds.has(id),
            `Seed ${seed} L${level}: score-reducing ID "${id}" is evaluated by checkTask13 but not declared in formulation`
          ).toBe(true);
        });
      }
    });
  }, 60000);

  // 17. Распределение числа пунктов (гистограмма)
  it('17. Histogram of condition counts across seeds × 3 levels', () => {
    const hist: Record<number, Record<number, number>> = { 1: {}, 2: {}, 3: {} };
    [1, 2, 3].forEach(level => {
      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 733 + level * 10000;
        const task = generateTask13(seed, level as any);
        const conditions = formatTask13Conditions(task.doc, task.doc.spec);
        const count = conditions.length;
        hist[level][count] = (hist[level][count] || 0) + 1;
      }
    });
    console.log('HISTOGRAM_RESULT:', JSON.stringify(hist));
    expect(true).toBe(true);
  }, 60000);

  // 33. Сверка списка требований между generateTaskRequirements и formatTask13Conditions
  it('33. Consistency test: generateTaskRequirements (UI list) exactly matches formatTask13Conditions', () => {
    [1, 2, 3].forEach(level => {
      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 733 + level * 10000;
        const task = generateTask13(seed, level as any);
        const spec = task.doc.spec || DEFAULT_SPEC;

        const uiRequirements = generateTaskRequirements(spec, task.doc);
        const conditionItems = formatTask13Conditions(task.doc, spec);
        const conditionTexts = conditionItems.map(it => it.text);

        if (JSON.stringify(uiRequirements) !== JSON.stringify(conditionTexts)) {
          console.error(`Mismatch at seed=${seed}, level=${level}:`);
          console.error('generateTaskRequirements:', uiRequirements);
          console.error('formatTask13Conditions:', conditionTexts);
        }

        expect(
          uiRequirements,
          `Seed ${seed} L${level}: generateTaskRequirements must match formatTask13Conditions texts`
        ).toEqual(conditionTexts);
      }
    });
  }, 60000);

  // 34. Аудит статуса unknown при идеальном ответе
  it('34. Unknown status audit: ideal answer never produces unknown status', () => {
    let variantsWithUnknown = 0;
    const unknownIds = new Set<string>();

    [1, 2, 3].forEach(level => {
      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 733 + level * 10000;
        const task = generateTask13(seed, level as any);
        const spec = task.doc.spec || DEFAULT_SPEC;

        const perfectHtml = renderCompliantHtml(task);
        const pasted = parsePastedHtml(perfectHtml);
        const report = checkTask13(task.doc, pasted, spec);

        const currentUnknowns = report.items.filter(item => item.status === 'unknown');
        if (currentUnknowns.length > 0) {
          variantsWithUnknown++;
          currentUnknowns.forEach(u => unknownIds.add(u.id));
        }
      }
    });

    console.log(`[Test 34] Multi-seed check: ${variantsWithUnknown} variants with unknown, IDs: [${Array.from(unknownIds).join(', ')}]`);

    expect(variantsWithUnknown, `Found ${variantsWithUnknown} variants with unknown status (IDs: ${Array.from(unknownIds).join(', ')})`).toBe(0);
    expect(unknownIds.size).toBe(0);
  }, 60000);

  // 39. Declare "sample" & indices parity: indices phrase in preamble matches index criteria presence in report.items
  it('39. Indices parity: preamble index phrase matches report.items index criteria', () => {
    const indicesByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    const phraseByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

    [1, 2, 3].forEach(level => {
      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 421 + level * 10000;
        const task = generateTask13(seed, level as any);
        const spec = task.doc.spec!;

        const preamble = formatTask13Preamble(task.doc);
        const hasPreambleIndices = preamble.includes('индексы');

        const baseHtml = renderCompliantHtml(task);
        const pasted = parsePastedHtml(baseHtml);
        const report = checkTask13(task.doc, pasted, spec);

        const indexIds = ['superscript', 'subscript', 'supTable', 'subTable'];
        const hasReportIndices = report.items.some(item => indexIds.includes(item.id));

        if (hasReportIndices) indicesByLevel[level]++;
        if (hasPreambleIndices) phraseByLevel[level]++;

        expect(
          hasPreambleIndices,
          `Seed ${seed} L${level}: preamble index phrase (${hasPreambleIndices}) must match report.items index presence (${hasReportIndices})`
        ).toBe(hasReportIndices);
      }
    });

    console.log(`[Test 39] Indices count by level: L1=${indicesByLevel[1]}, L2=${indicesByLevel[2]}, L3=${indicesByLevel[3]}`);
    console.log(`[Test 39] Phrase count by level: L1=${phraseByLevel[1]}, L2=${phraseByLevel[2]}, L3=${phraseByLevel[3]}`);

    expect(indicesByLevel[1]).toBe(phraseByLevel[1]);
    expect(indicesByLevel[2]).toBe(phraseByLevel[2]);
    expect(indicesByLevel[3]).toBe(phraseByLevel[3]);
  }, 60000);

  // 40. Table merge parity: preamble merge phrase count === report.items tableMerge count
  it('40. Table merge parity: preamble merge phrase matches tableMerge presence in report.items', () => {
    let preambleMergeCount = 0;
    let reportMergeCount = 0;

    [1, 2, 3].forEach(level => {
      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 733 + level * 10000;
        const task = generateTask13(seed, level as any);
        const spec = task.doc.spec!;

        const preamble = formatTask13Preamble(task.doc);
        const hasPreambleMerge = preamble.includes('Объединение ячеек таблицы выполняется в соответствии с образцом.');

        const baseHtml = renderCompliantHtml(task);
        const pasted = parsePastedHtml(baseHtml);
        const report = checkTask13(task.doc, pasted, spec);

        const hasReportMerge = report.items.some(item => item.id === 'tableMerge');

        if (hasPreambleMerge) preambleMergeCount++;
        if (hasReportMerge) reportMergeCount++;

        expect(
          hasPreambleMerge,
          `Seed ${seed} L${level}: preamble merge phrase (${hasPreambleMerge}) must match report.items tableMerge presence (${hasReportMerge})`
        ).toBe(hasReportMerge);
      }
    });

    console.log(`[Test 40] Multi-seed: preamble merge count = ${preambleMergeCount}, report tableMerge count = ${reportMergeCount}`);
    expect(preambleMergeCount).toBe(reportMergeCount);
  }, 60000);

  // 41. totalsRow structural integrity and sum columns
  it('41. totalsRow structural integrity: validates case (a) and case (b) across seeds × 3 levels', () => {
    const caseAByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    const caseBByLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

    [1, 2, 3].forEach(level => {
      for (let i = 1; i <= SEEDS; i++) {
        const seed = i * 513 + level * 10000;
        const task = generateTask13(seed, level as any);
        const table = task.doc.table;
        const meta = task.doc.meta;

        if (table && table.rows.length > 0 && meta) {
          const sourceHasTotalsRow = meta.sourceHasTotalsRow;
          const hasSumCol = meta.hasSumCol;
          const hasTotalsRow = meta.hasTotalsRow;

          // Case (a): source has totalsRow, but selected cols have no sum col -> totalsRow is NOT created
          if (sourceHasTotalsRow && !hasSumCol) {
            caseAByLevel[level]++;
            expect(hasTotalsRow).toBe(false);
          }

          // Case (b): totalsRow is created
          if (hasTotalsRow) {
            caseBByLevel[level]++;
            expect(sourceHasTotalsRow).toBe(true);
            expect(hasSumCol).toBe(true);

            const lastRow = table.rows[table.rows.length - 1];
            const leadingNonSumCount = meta.leadingNonSumCount || 0;

            // colSpan of first cell equals 1 + leading non-sum columns
            expect(lastRow[0].colSpan).toBe(1 + leadingNonSumCount);

            // Sum of colSpans across the totals row equals the full table width
            const expectedTableWidth = tableWidth(table.rows);
            const totalsRowWidth = lastRow.reduce((sum, cell) => sum + (cell.colSpan || 1), 0);
            expect(totalsRowWidth).toBe(expectedTableWidth);
          }
        }
      }
    });

    console.log(`[Test 41] Case (a) count by level: L1=${caseAByLevel[1]}, L2=${caseAByLevel[2]}, L3=${caseAByLevel[3]}`);
    console.log(`[Test 41] Case (b) count by level: L1=${caseBByLevel[1]}, L2=${caseBByLevel[2]}, L3=${caseBByLevel[3]}`);

    expect(caseBByLevel[1] + caseBByLevel[2] + caseBByLevel[3]).toBeGreaterThan(0);
  }, 60000);
});

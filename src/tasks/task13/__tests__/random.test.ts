import { describe, it, expect } from 'vitest';
import { generateTask13 } from '../generate';
import { Difficulty } from '../../../types';

describe('Task 13 Random Generation and Requirements Suite', () => {
  const levels: Difficulty[] = [1, 2, 3];

  levels.forEach(level => {
    describe(`Level ${level} (200 seeds)`, () => {
      it(`enforces all core requirements are present across 200 seeds (or documents missing element reason)`, () => {
        const missingElementExceptions: { seed: number; req: string; reason: string }[] = [];

        for (let i = 1; i <= 200; i++) {
          const seed = i * 997 + level * 10000;
          const task = generateTask13(seed, level);
          expect(task.doc.spec).toBeDefined();
          const reqs = task.doc.spec!.requirements;

          // 1. Всегда обязательные без условий (ядро)
          expect(reqs.fontSize.enabled, `fontSize disabled on seed ${seed}`).toBe(true);
          expect(reqs.indent.enabled, `indent disabled on seed ${seed}`).toBe(true);
          expect(reqs.bodyAlign.enabled, `bodyAlign disabled on seed ${seed}`).toBe(true);
          expect(reqs.noLineBreaks.enabled, `noLineBreaks disabled on seed ${seed}`).toBe(true);
          expect(reqs.noSpaceIndent.enabled, `noSpaceIndent disabled on seed ${seed}`).toBe(true);
          expect(reqs.lineSpacing.enabled, `lineSpacing disabled on seed ${seed}`).toBe(true);

          // 2. Обязательные при наличии таблицы (ядро)
          const hasTable = task.doc.table !== null;
          if (hasTable) {
            expect(reqs.tableSize.enabled, `tableSize disabled on seed ${seed}`).toBe(true);
          } else {
            expect(reqs.tableSize.enabled).toBe(false);
            missingElementExceptions.push({ seed, req: 'tableRequirements', reason: 'в документе отсутствует таблица' });
          }

          // 3. Выделения полужирным в шапке / таблице
          if (reqs.boldCells.enabled) {
            const hasBoldInTable = task.doc.table?.rows.some(r => r.some(c => c.spans.some(s => s.b))) ?? false;
            expect(hasBoldInTable, `boldCells enabled but no bold cells in table on seed ${seed}`).toBe(true);
          }

          // 4. Выделения в тексте/таблице
          if (reqs.emphasis.enabled) {
            const hasEmphasisInDoc = task.doc.paragraphs.some(p => p.spans.some(s => s.b || s.i || s.u)) ||
              (task.doc.table?.rows.some(r => r.some(c => c.spans.some(s => s.b || s.i || s.u))) ?? false);
            expect(hasEmphasisInDoc, `emphasis enabled but no styled words on seed ${seed}`).toBe(true);
          }
        }

        // Если были исключения по отсутствию элементов — логируем их
        if (missingElementExceptions.length > 0) {
          console.log(`[L${level}] Исключения ядра по причине отсутствия элемента (${missingElementExceptions.length}):`, missingElementExceptions);
        }
      });

      it(`enforces condition presence and element presence on 200 seeds`, () => {
        for (let i = 1; i <= 200; i++) {
          const seed = i * 997 + level * 10000;
          const task = generateTask13(seed, level);
          expect(task.doc.spec).toBeDefined();
          const reqs = task.doc.spec!.requirements;

          // 2. Ни одно требование не включено при отсутствии элемента в образце
          if (reqs.heading.enabled) {
            expect(task.doc.headingIndex, `headingIndex missing for seed ${seed}`).not.toBeNull();
            expect(task.doc.paragraphs[task.doc.headingIndex!], `heading paragraph missing for seed ${seed}`).toBeDefined();
          }

          if (reqs.superscript.enabled) {
            const hasSup = task.doc.paragraphs.some(p => p.spans.some(s => s.sup)) ||
              (task.doc.table?.rows.some(r => r.some(c => c.spans.some(s => s.sup))) ?? false);
            expect(hasSup, `superscript enabled but missing in doc for seed ${seed}`).toBe(true);
          }

          if (reqs.subscript.enabled) {
            const hasSub = task.doc.paragraphs.some(p => p.spans.some(s => s.sub)) ||
              (task.doc.table?.rows.some(r => r.some(c => c.spans.some(s => s.sub))) ?? false);
            expect(hasSub, `subscript enabled but missing in doc for seed ${seed}`).toBe(true);
          }

          if (reqs.boldCells.enabled) {
            const hasBoldInTable = task.doc.table?.rows.some(r => r.some(c => c.spans.some(s => s.b))) ?? false;
            expect(hasBoldInTable, `boldCells enabled but no bold cells in table for seed ${seed}`).toBe(true);
          }

          if (reqs.paraSpacing.enabled) {
            const bodyParas = task.doc.headingIndex === 0 ? task.doc.paragraphs.slice(1) : task.doc.paragraphs;
            expect(bodyParas.length, `paraSpacing enabled but body has only 1 paragraph for seed ${seed}`).toBeGreaterThan(1);
          }

          // 3. Таблица и её границы
          expect(task.doc.table, `table must exist for seed ${seed}`).not.toBeNull();
          const table = task.doc.table!;
          const numRows = table.rows.length;
          const numCols = Math.max(...table.rows.map(r => r.reduce((acc, cell) => acc + (cell.colSpan || 1), 0)));

          // Строк в таблице: от 2 (шапка + данные) до 7 (шапка двухуровневая + 4 строки + итог)
          expect(numRows).toBeGreaterThanOrEqual(2);
          expect(numRows).toBeLessThanOrEqual(7);

          // Столбцов: 1 ключевой + 1..3 дополнительных = 2..4
          expect(numCols).toBeGreaterThanOrEqual(2);
          expect(numCols).toBeLessThanOrEqual(4);

          // 4. Проверка totalsRow (если строка итогов присутствует)
          const lastRow = table.rows[table.rows.length - 1];
          const isTotalsRow = lastRow[0]?.spans.some(s => /всего|итого/i.test(s.text));
          if (isTotalsRow) {
            // Определяем, двухуровневая ли шапка
            const headerRowCount = table.rows.findIndex(r => !r[0]?.spans.some(s => s.b) || r[0]?.rowSpan === 1 && r[0]?.colSpan === 1);
            const dataStartIndex = headerRowCount > 0 ? headerRowCount : 1;
            const dataRows = table.rows.slice(dataStartIndex, table.rows.length - 1);

            // Проверяем каждый столбец с суммой
            for (let c = 0; c < numCols; c++) {
              // Ищем ячейку в totalsRow
              const totalCell = lastRow.find((_, idx) => {
                // Вычисляем абсолютный индекс колонки с учётом colSpan
                let currCol = 0;
                for (let k = 0; k < idx; k++) {
                  currCol += lastRow[k].colSpan || 1;
                }
                return currCol === c;
              });

              if (totalCell) {
                const totalText = totalCell.spans.map(s => s.text).join('').replace(/[\s\u00A0]/g, '');
                const totalNum = parseInt(totalText, 10);
                if (!isNaN(totalNum) && totalNum > 0 && !/всего|итого|суммарно/i.test(totalText)) {
                  // Считаем сумму по строкам данных для этого столбца
                  let sumData = 0;
                  let hasNumericData = false;
                  dataRows.forEach(dr => {
                    const cell = dr.find((_, idx) => {
                      let currCol = 0;
                      for (let k = 0; k < idx; k++) {
                        currCol += dr[k].colSpan || 1;
                      }
                      return currCol === c;
                    });
                    if (cell) {
                      const txt = cell.spans.map(s => s.text).join('').replace(/[\s\u00A0]/g, '');
                      const n = parseInt(txt, 10);
                      if (!isNaN(n)) {
                        sumData += n;
                        hasNumericData = true;
                      }
                    }
                  });

                  if (hasNumericData) {
                    expect(totalNum, `Total sum mismatch for column ${c} on seed ${seed}`).toBe(sumData);
                  }
                }
              }
            }
          }

          // 5. В столбце нет смешанного оформления разрядов
          for (let c = 0; c < numCols; c++) {
            const colCells: string[] = [];
            table.rows.forEach(r => {
              let currCol = 0;
              for (let idx = 0; idx < r.length; idx++) {
                const cell = r[idx];
                const span = cell.colSpan || 1;
                if (currCol === c) {
                  colCells.push(cell.spans.map(s => s.text).join(''));
                }
                currCol += span;
              }
            });

            // Находим все числовые значения
            const numValues: { text: string; num: number; hasSpace: boolean; isYear: boolean }[] = [];
            colCells.forEach(txt => {
              const clean = txt.trim();
              if (/^\d{1,3}(?: \d{3})*$/.test(clean) || /^\d+$/.test(clean)) {
                const num = parseInt(clean.replace(/\s+/g, ''), 10);
                const isYear = num >= 1000 && num <= 2999 && (clean === String(num));
                numValues.push({
                  text: clean,
                  num,
                  hasSpace: clean.includes(' '),
                  isYear
                });
              }
            });

            const nonYears = numValues.filter(n => !n.isYear);
            const has5Digits = nonYears.some(n => Math.abs(n.num) >= 10000);

            if (has5Digits) {
              // Все числа >= 1000 обязаны иметь разрядный пробел
              nonYears.filter(n => n.num >= 1000).forEach(n => {
                expect(n.hasSpace, `Expected digit spacing in ${n.text} for column ${c} (seed ${seed})`).toBe(true);
              });
            } else {
              // Никакие 4-значные числа не должны иметь разрядных пробелов
              nonYears.filter(n => n.num >= 1000 && n.num < 10000).forEach(n => {
                expect(n.hasSpace, `Unexpected digit spacing in 4-digit ${n.text} for column ${c} (seed ${seed})`).toBe(false);
              });
            }
          }
        }
      });

      it(`enforces parameter values for fontSize, indent, gapToTable, and lineSpacing are strictly from specification lists on 200 seeds`, () => {
        const ALLOWED_FONT_SIZES = [12, 13, 14];
        const ALLOWED_INDENTS_CM = [1.0, 1.25, 1.5];
        const ALLOWED_GAP_MIN_PT = [6, 12, 15, 18, 20];
        const ALLOWED_GAP_MAX_PT = [18, 24, 28, 30];
        const ALLOWED_LINE_SPACING_MIN = [1.0, 1.15];
        const ALLOWED_LINE_SPACING_MAX = [1.5];

        for (let i = 1; i <= 200; i++) {
          const seed = i * 997 + level * 10000;
          const task = generateTask13(seed, level);
          const reqs = task.doc.spec!.requirements;

          // fontSize
          expect(reqs.fontSize.enabled).toBe(true);
          expect(ALLOWED_FONT_SIZES).toContain(reqs.fontSize.pt);

          // indent
          expect(reqs.indent.enabled).toBe(true);
          expect(ALLOWED_INDENTS_CM).toContain(reqs.indent.cm);

          // gapToTable (если включено требование)
          if (reqs.gapToTable.enabled) {
            expect(ALLOWED_GAP_MIN_PT).toContain(reqs.gapToTable.minPt);
            expect(ALLOWED_GAP_MAX_PT).toContain(reqs.gapToTable.maxPt);
          }

          // lineSpacing
          expect(reqs.lineSpacing.enabled).toBe(true);
          expect(ALLOWED_LINE_SPACING_MIN).toContain(reqs.lineSpacing.minRatio);
          expect(ALLOWED_LINE_SPACING_MAX).toContain(reqs.lineSpacing.maxRatio);
        }
      });
    });
  });

  it('enforces gapToTable.minPt > paraSpacing.maxPt and minPt < maxPt across 200 seeds × 3 levels', () => {
    levels.forEach(level => {
      for (let i = 1; i <= 200; i++) {
        const seed = i * 997 + level * 10000;
        const task = generateTask13(seed, level);
        const reqs = task.doc.spec!.requirements;

        if (reqs.paraSpacing.enabled) {
          expect(
            reqs.paraSpacing.minPt,
            `Seed ${seed} (L${level}): paraSpacing minPt (${reqs.paraSpacing.minPt}) must be < maxPt (${reqs.paraSpacing.maxPt})`
          ).toBeLessThan(reqs.paraSpacing.maxPt);
        }

        if (reqs.gapToTable.enabled) {
          expect(
            reqs.gapToTable.minPt,
            `Seed ${seed} (L${level}): gapToTable minPt (${reqs.gapToTable.minPt}) must be < maxPt (${reqs.gapToTable.maxPt})`
          ).toBeLessThan(reqs.gapToTable.maxPt);
        }

        if (reqs.gapToTable.enabled && reqs.paraSpacing.enabled) {
          expect(
            reqs.gapToTable.minPt,
            `Seed ${seed} (L${level}): gapToTable.minPt (${reqs.gapToTable.minPt}) must be > paraSpacing.maxPt (${reqs.paraSpacing.maxPt})`
          ).toBeGreaterThan(reqs.paraSpacing.maxPt);
        }
      }
    });
  });

  it('guarantees generation determinism: generating task twice for 20 seeds × 3 levels produces identical JSON.stringify', () => {
    levels.forEach(level => {
      for (let i = 1; i <= 20; i++) {
        const seed = i * 1337 + level * 10000;
        const task1 = generateTask13(seed, level);
        const task2 = generateTask13(seed, level);

        expect(
          JSON.stringify(task1),
          `Seed ${seed} (L${level}) must produce identical task instances on repeated generation`
        ).toBe(JSON.stringify(task2));
      }
    });
  });
});

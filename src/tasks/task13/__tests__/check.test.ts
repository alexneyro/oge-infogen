import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parsePastedHtml } from '../html';
import { checkTask13, computeScore, isCritError, CritResult, describeMerges } from '../check';
import { indentRequirement, tableWidthRequirement, gapToTableRequirement, TASK13_REQUIREMENTS_POLICY } from '../registry';
import { DEFAULT_SPEC, TaskSpec } from '../spec';
import { generateTask13 } from '../generate';
import { Doc } from '../parse';
import { renderCompliantHtml } from './fixtures/render';

interface FixtureData {
  meta: {
    seed: string;
    level: string;
    source: string;
    description: string;
  };
  html: string;
  task: {
    seed?: string;
    level?: string;
    requirements?: any;
    targetText?: any[];
    targetTable?: { rows: any[][] };
    headingIndex?: number | null;
    doc?: {
      paragraphs?: any[];
      table?: { rows: any[][] };
    };
  };
  expected: {
    score: number;
    maxScore: number;
    typosText: number;
    typosTable: number;
    failedCriteria?: string[];
    unknownCriteria?: string[];
  };
}

function formatCriteriaTable(items: CritResult[]): string {
  const header = 'id | unit | group | status | expected | actual';
  const rows = items.map(it =>
    `${it.id} | ${it.unit} | ${it.group} | ${it.status} | ${it.expected} | ${it.actual}`
  );
  return [header, ...rows].join('\n');
}

describe('Task 13 Verification Tests', () => {
  const fixturesDir = path.resolve(__dirname, '../__fixtures__');
  const fixtureFiles = fs.existsSync(fixturesDir)
    ? fs.readdirSync(fixturesDir).filter(f => f.endsWith('.json'))
    : [];

  it('has at least one fixture file', () => {
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });

  fixtureFiles.forEach(file => {
    const filePath = path.join(fixturesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const fixture: FixtureData = JSON.parse(content);

    it(`evaluates fixture "${file}" (${fixture.meta.description || fixture.meta.source})`, () => {
      const pasted = parsePastedHtml(fixture.html);

      const doc: Doc = {
        headingIndex: fixture.task.headingIndex ?? null,
        paragraphs: fixture.task.targetText || fixture.task.doc?.paragraphs || [],
        table: fixture.task.targetTable || fixture.task.doc?.table || null,
      };

      const customSpec: TaskSpec = {
        ...structuredClone(DEFAULT_SPEC),
        requirements: fixture.task.requirements || DEFAULT_SPEC.requirements,
      };

      const report = checkTask13(doc, pasted, customSpec);

      const actualFailedIds = report.items
        .filter(it => it.status === 'fail')
        .map(it => it.id)
        .sort();

      const expectedFailedIds = [...(fixture.expected.failedCriteria || [])].sort();

      const actualUnknownIds = report.items
        .filter(it => it.status === 'unknown')
        .map(it => it.id)
        .sort();

      const expectedUnknownIds = [...(fixture.expected.unknownCriteria || [])].sort();

      const missingFailed = expectedFailedIds.filter(id => !actualFailedIds.includes(id));
      const extraFailed = actualFailedIds.filter(id => !expectedFailedIds.includes(id));

      const missingUnknown = expectedUnknownIds.filter(id => !actualUnknownIds.includes(id));
      const extraUnknown = actualUnknownIds.filter(id => !expectedUnknownIds.includes(id));

      const tableOutput = formatCriteriaTable(report.items);

      if (
        report.score !== fixture.expected.score ||
        report.maxScore !== fixture.expected.maxScore ||
        report.typosText !== fixture.expected.typosText ||
        report.typosTable !== fixture.expected.typosTable ||
        missingFailed.length > 0 ||
        extraFailed.length > 0 ||
        missingUnknown.length > 0 ||
        extraUnknown.length > 0
      ) {
        console.error(`\n[CRITERIA TABLE FOR ${file}]\n${tableOutput}\n`);
        if (missingFailed.length > 0) {
          console.error(`Missing expected failed criteria: ${missingFailed.join(', ')}`);
        }
        if (extraFailed.length > 0) {
          console.error(`Extra unexpected failed criteria: ${extraFailed.join(', ')}`);
        }
        if (missingUnknown.length > 0) {
          console.error(`Missing expected unknown criteria: ${missingUnknown.join(', ')}`);
        }
        if (extraUnknown.length > 0) {
          console.error(`Extra unexpected unknown criteria: ${extraUnknown.join(', ')}`);
        }
      }

      expect(
        {
          score: report.score,
          maxScore: report.maxScore,
          typosText: report.typosText,
          typosTable: report.typosTable,
          failedCriteria: actualFailedIds,
          unknownCriteria: actualUnknownIds,
        },
        `Mismatch in fixture ${file}:\n` +
        `Failed Missing: [${missingFailed.join(', ')}], Extra: [${extraFailed.join(', ')}]\n` +
        `Unknown Missing: [${missingUnknown.join(', ')}], Extra: [${extraUnknown.join(', ')}]\n` +
        tableOutput
      ).toEqual({
        score: fixture.expected.score,
        maxScore: fixture.expected.maxScore,
        typosText: fixture.expected.typosText,
        typosTable: fixture.expected.typosTable,
        failedCriteria: expectedFailedIds,
        unknownCriteria: expectedUnknownIds,
      });
    });

    it(`verifies invariant: unknown criteria do not increase violation counts in "${file}"`, () => {
      const pasted = parsePastedHtml(fixture.html);

      const doc: Doc = {
        headingIndex: fixture.task.headingIndex ?? null,
        paragraphs: fixture.task.targetText || fixture.task.doc?.paragraphs || [],
        table: fixture.task.targetTable || fixture.task.doc?.table || null,
      };

      const customSpec: TaskSpec = {
        ...structuredClone(DEFAULT_SPEC),
        requirements: fixture.task.requirements || DEFAULT_SPEC.requirements,
      };

      const report = checkTask13(doc, pasted, customSpec);

      // Арифметический расчёт нарушений только из fail/declare:text unknown критериев по unit:
      const failTextUnits = new Set<string>();
      const failTableUnits = new Set<string>();
      const policyMap = new Map<string, string>();
      TASK13_REQUIREMENTS_POLICY.forEach(p => policyMap.set(p.id, p.declare));

      report.items.forEach(it => {
        const declare = policyMap.get(it.id);
        const isFailed = it.status === 'fail' || (declare === 'text' && isCritError(it));
        if (isFailed) {
          if (it.group === 'text') {
            if (it.unit === 'typosText') {
              if (report.typosText > customSpec.typosTextLimit) {
                failTextUnits.add(it.unit);
              }
            } else {
              failTextUnits.add(it.unit);
            }
          } else if (it.group === 'table') {
            if (it.unit === 'typosTable') {
              if (report.typosTable > customSpec.typosTableLimit) {
                failTableUnits.add(it.unit);
              }
            } else {
              failTableUnits.add(it.unit);
            }
          }
        }
      });

      expect(report.vText).toBe(failTextUnits.size);
      expect(report.vTable).toBe(failTableUnits.size);

      const unknownItems = report.items.filter(it => it.status === 'unknown' && policyMap.get(it.id) !== 'text');
      const unknownUnitsInText = unknownItems.filter(it => it.group === 'text').map(it => it.unit);
      const unknownUnitsInTable = unknownItems.filter(it => it.group === 'table').map(it => it.unit);

      if (unknownUnitsInText.length > 0) {
        const withUnknownTextUnits = new Set([...failTextUnits, ...unknownUnitsInText]);
        if (withUnknownTextUnits.size > failTextUnits.size) {
          expect(report.vText).toBeLessThan(withUnknownTextUnits.size);
        }
      }

      if (unknownUnitsInTable.length > 0) {
        const withUnknownTableUnits = new Set([...failTableUnits, ...unknownUnitsInTable]);
        if (withUnknownTableUnits.size > failTableUnits.size) {
          expect(report.vTable).toBeLessThan(withUnknownTableUnits.size);
        }
      }
    });

    it(`verifies invariant: "fail always penalizes" in "${file}"`, () => {
      const pasted = parsePastedHtml(fixture.html);

      const doc: Doc = {
        headingIndex: fixture.task.headingIndex ?? null,
        paragraphs: fixture.task.targetText || fixture.task.doc?.paragraphs || [],
        table: fixture.task.targetTable || fixture.task.doc?.table || null,
      };

      const customSpec: TaskSpec = {
        ...structuredClone(DEFAULT_SPEC),
        requirements: fixture.task.requirements || DEFAULT_SPEC.requirements,
      };

      const report = checkTask13(doc, pasted, customSpec);

      // Множество штрафных единиц, реально сформированное и отражённое в vText/vTable
      const penalizedTextUnits = new Set<string>();
      const penalizedTableUnits = new Set<string>();
      const policyMap = new Map<string, string>();
      TASK13_REQUIREMENTS_POLICY.forEach(p => policyMap.set(p.id, p.declare));

      // В checkTask13 штрафные единицы берутся из report.vText и множества textFailUnits/tableFailUnits
      report.items.forEach(it => {
        const declare = policyMap.get(it.id);
        const isFailed = it.status === 'fail' || (declare === 'text' && isCritError(it));
        if (isFailed) {
          if (it.group === 'text') {
            if (it.unit === 'typosText') {
              if (report.typosText > customSpec.typosTextLimit) {
                penalizedTextUnits.add(it.unit);
              }
            } else {
              penalizedTextUnits.add(it.unit);
            }
          } else if (it.group === 'table') {
            if (it.unit === 'typosTable') {
              if (report.typosTable > customSpec.typosTableLimit) {
                penalizedTableUnits.add(it.unit);
              }
            } else {
              penalizedTableUnits.add(it.unit);
            }
          }
        }
      });

      // Проверяем, что report.vText и report.vTable строго равны размеру множества penalizedUnits
      expect(report.vText).toBe(penalizedTextUnits.size);
      expect(report.vTable).toBe(penalizedTableUnits.size);

      const unpenalizedFailedCriteria: Array<{
        id: string;
        unit: string;
        group: string;
        status: string;
        reason: string;
      }> = [];

      report.items.forEach(it => {
        if (it.status === 'fail') {
          if (it.group === 'info') {
            // Допустимое исключение: группа info не влияет на штрафы
            return;
          }

          if (it.group === 'text') {
            if (!penalizedTextUnits.has(it.unit)) {
              let reason = `unit "${it.unit}" не учтён в штрафных единицах текста (vText = ${report.vText})`;
              if (it.unit === 'typosText') {
                reason = `typosText (${report.typosText}) <= typosTextLimit (${customSpec.typosTextLimit}), но критерий получил статус fail`;
              }
              unpenalizedFailedCriteria.push({
                id: it.id,
                unit: it.unit,
                group: it.group,
                status: it.status,
                reason,
              });
            }
          } else if (it.group === 'table') {
            if (!penalizedTableUnits.has(it.unit)) {
              let reason = `unit "${it.unit}" не учтён в штрафных единицах таблицы (vTable = ${report.vTable})`;
              if (it.unit === 'typosTable') {
                reason = `typosTable (${report.typosTable}) <= typosTableLimit (${customSpec.typosTableLimit}), но критерий получил статус fail`;
              }
              unpenalizedFailedCriteria.push({
                id: it.id,
                unit: it.unit,
                group: it.group,
                status: it.status,
                reason,
              });
            }
          } else {
            unpenalizedFailedCriteria.push({
              id: it.id,
              unit: it.unit,
              group: it.group as string,
              status: it.status,
              reason: `Неизвестная группа "${it.group}", unit не учтён ни в text, ни в table`,
            });
          }
        }
      });

      if (unpenalizedFailedCriteria.length > 0) {
        const errorLines = unpenalizedFailedCriteria.map(
          c => `${c.id} | ${c.unit} | ${c.group} | ${c.status} -> Причина пропуска: ${c.reason}`
        );
        console.error(
          `\n[ИНВАРИАНТ НАРУШЕН В ФИКСТУРЕ "${file}"]: критерии со статусом fail не внесли свой unit в штрафные единицы:\n` +
          errorLines.join('\n') + '\n'
        );
      }

      expect(
        unpenalizedFailedCriteria,
        `Критерии со статусом fail не попали в штрафные единицы в фикстуре "${file}":\n` +
        unpenalizedFailedCriteria.map(c => `${c.id} | ${c.unit} | ${c.group} | ${c.status} -> ${c.reason}`).join('\n')
      ).toEqual([]);
    });
  });

  describe('Сверка разрядных пробелов в ячейках таблицы', () => {
    it('эталон "12 104" vs ввод ученика "12104" даёт 2 опечатки в таблице и не ломает размер/выравнивание', () => {
      const doc: Doc = {
        paragraphs: [{ spans: [{ text: 'Текст задания.' }] }],
        table: {
          rows: [
            [
              { spans: [{ text: 'Параметр', b: true }], align: 'left', colSpan: 1, rowSpan: 1 },
              { spans: [{ text: 'Значение', b: true }], align: 'center', colSpan: 1, rowSpan: 1 }
            ],
            [
              { spans: [{ text: 'Венера' }], align: 'left', colSpan: 1, rowSpan: 1 },
              { spans: [{ text: '12 104' }], align: 'center', colSpan: 1, rowSpan: 1 }
            ]
          ]
        }
      };

      const pasted = parsePastedHtml(`
        <html>
          <body>
            <p align="justify" style="font-size: 14pt; margin-bottom: 0.5cm; text-indent: 1cm">Текст задания.</p>
            <table width="300" align="center">
              <tr>
                <td><p><b>Параметр</b></p></td>
                <td align="center"><p><b>Значение</b></p></td>
              </tr>
              <tr>
                <td><p>Венера</p></td>
                <td align="center"><p>12104</p></td>
              </tr>
            </table>
          </body>
        </html>
      `);

      const report = checkTask13(doc, pasted, DEFAULT_SPEC);
      expect(report.typosTable).toBe(2);
      const typosTableCrit = report.items.find(it => it.id === 'typosTable');
      expect(typosTableCrit?.status).toBe('ok');
      expect(typosTableCrit?.actual).toContain('опечаток: 2');

      // Проверяем, что другие критерии таблицы не пострадали ложно
      const tableSizeCrit = report.items.find(it => it.id === 'tableSize');
      expect(tableSizeCrit?.status).toBe('ok');
    });

    it('эталон "899" vs ввод ученика "8 99" даёт 2 опечатки в таблице', () => {
      const doc: Doc = {
        paragraphs: [{ spans: [{ text: 'Текст задания.' }] }],
        table: {
          rows: [
            [
              { spans: [{ text: 'Название', b: true }], align: 'left', colSpan: 1, rowSpan: 1 },
              { spans: [{ text: 'Масса, кг', b: true }], align: 'center', colSpan: 1, rowSpan: 1 }
            ],
            [
              { spans: [{ text: 'Curiosity' }], align: 'left', colSpan: 1, rowSpan: 1 },
              { spans: [{ text: '899' }], align: 'center', colSpan: 1, rowSpan: 1 }
            ]
          ]
        }
      };

      const pasted = parsePastedHtml(`
        <html>
          <body>
            <p align="justify" style="font-size: 14pt; margin-bottom: 0.5cm; text-indent: 1cm">Текст задания.</p>
            <table width="300" align="center">
              <tr>
                <td><p><b>Название</b></p></td>
                <td align="center"><p><b>Масса, кг</b></p></td>
              </tr>
              <tr>
                <td><p>Curiosity</p></td>
                <td align="center"><p>8 99</p></td>
              </tr>
            </table>
          </body>
        </html>
      `);

      const report = checkTask13(doc, pasted, DEFAULT_SPEC);
      expect(report.typosTable).toBe(2);
      const typosTableCrit = report.items.find(it => it.id === 'typosTable');
      expect(typosTableCrit?.status).toBe('ok');
      expect(typosTableCrit?.actual).toContain('опечаток: 2');
    });
  });

  describe('computeScore score calculation unit tests', () => {
    it('1. ноль ошибок → 2 балла', () => {
      const res = computeScore([], 0, 0, true, true, true);
      expect(res.score).toBe(2);
      expect(res.vText).toBe(0);
      expect(res.vTable).toBe(0);
    });

    it('2. одна ошибка → 1 балл', () => {
      const singleError: CritResult = {
        id: 'fontSize',
        label: 'Размер шрифта',
        status: 'fail',
        expected: '14 пт',
        actual: '12 пт',
        group: 'text',
        unit: 'fontSize'
      };
      const res = computeScore([singleError], 0, 0, true, true, true);
      expect(res.score).toBe(1);
      expect(res.vText).toBe(1);
      expect(res.vTable).toBe(0);
    });

    it('3. две ошибки → 0 баллов', () => {
      const twoErrors: CritResult[] = [
        { id: 'fontSize', label: 'Шрифт', status: 'fail', expected: '14 пт', actual: '12 пт', group: 'text', unit: 'fontSize' },
        { id: 'tableAlign', label: 'Таблица', status: 'fail', expected: 'по центру', actual: 'по левому краю', group: 'table', unit: 'tableAlign' }
      ];
      const res = computeScore(twoErrors, 0, 0, true, true, true);
      expect(res.score).toBe(0);
      expect(res.vText).toBe(1);
      expect(res.vTable).toBe(1);
    });

    it('4. документ, где отступ сделан пробелами → одна ошибка про отступ и 1 балл', () => {
      const doc: Doc = {
        paragraphs: [{ spans: [{ text: 'Текст первого абзаца задания для проверки отступа.' }] }],
        table: null
      };
      const spec: TaskSpec = {
        ...DEFAULT_SPEC,
        requirements: {
          ...DEFAULT_SPEC.requirements,
          fontSize: { enabled: true, pt: 14 },
          indent: { enabled: true, cm: 1.25 },
          bodyAlign: { enabled: true, align: 'justify' },
          lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
          emphasis: { enabled: false, bold: false, italic: false, underline: false },
          tableWidth: { enabled: false },
          tableSize: { enabled: false, rows: 0, cols: 0 },
          tableAlign: { enabled: false, align: 'center' },
          boldCells: { enabled: false },
          colAlign: { enabled: false },
          gapToTable: { enabled: false, minPt: 12, maxPt: 24 }
        }
      };

      const html = `<p style="font-size: 14pt; line-height: 1.5; text-align: justify; font-family: 'Times New Roman';">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Текст первого абзаца задания для проверки отступа.</p>`;
      const pasted = parsePastedHtml(html);
      const report = checkTask13(doc, pasted, spec);

      const failedErrors = report.displayErrors.filter(e => e.status === 'fail');
      const indentErrors = failedErrors.filter(e => e.unit === 'indent' || e.id === 'indent' || e.id === 'noSpaceIndent');

      expect(indentErrors.length).toBe(1);
      expect(indentErrors[0].id).toBe('noSpaceIndent');
      expect(failedErrors.length).toBe(1);
      expect(report.score).toBe(1);
    });

    it('5. задание без таблицы, всё остальное верно → 2 балла', () => {
      const doc: Doc = {
        paragraphs: [{ spans: [{ text: 'Текст первого абзаца задания без таблицы.' }] }],
        table: null
      };
      const spec: TaskSpec = {
        ...DEFAULT_SPEC,
        requirements: {
          ...DEFAULT_SPEC.requirements,
          fontSize: { enabled: true, pt: 14 },
          indent: { enabled: true, cm: 1.25 },
          bodyAlign: { enabled: true, align: 'justify' },
          lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
          emphasis: { enabled: false, bold: false, italic: false, underline: false },
          tableWidth: { enabled: false },
          tableSize: { enabled: false, rows: 0, cols: 0 },
          tableAlign: { enabled: false, align: 'center' },
          boldCells: { enabled: false },
          colAlign: { enabled: false },
          gapToTable: { enabled: false, minPt: 12, maxPt: 24 }
        }
      };

      const html = `<p style="font-size: 14pt; text-indent: 1.25cm; line-height: 1.5; text-align: justify; font-family: 'Times New Roman';">Текст первого абзаца задания без таблицы.</p>`;
      const pasted = parsePastedHtml(html);
      const report = checkTask13(doc, pasted, spec);

      const failedErrors = report.displayErrors.filter(e => e.status === 'fail');
      expect(failedErrors.length).toBe(0);
      expect(report.score).toBe(2);
    });

    it('6. документ, где расстояние до таблицы сделано пустым абзацем, остальное верно → ровно одна ошибка emptyParas, vText 1, vTable 0, score 1', () => {
      const doc: Doc = {
        paragraphs: [{ spans: [{ text: 'Основной текст задания для проверки интервала.' }] }],
        table: {
          rows: [
            [
              { spans: [{ text: 'Ячейка 1' }], colSpan: 1, rowSpan: 1, align: 'left' },
              { spans: [{ text: 'Ячейка 2' }], colSpan: 1, rowSpan: 1, align: 'center' }
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
          bodyAlign: { enabled: true, align: 'left' },
          tableSize: { enabled: true, rows: 1, cols: 2 },
          colAlign: { enabled: true },
          gapToTable: { enabled: true, minPt: 18, maxPt: 24 }
        }
      };

      const htmlWithEmptyPara = `
        <p style="font-size: 14pt; text-indent: 1.25cm; text-align: left; margin: 0; line-height: 1.2; font-family: 'Times New Roman';">Основной текст задания для проверки интервала.</p>
        <p style="margin: 0;">&nbsp;</p>
        <table align="center" style="margin: 0; width: 70%;"><tr><td align="left" style="font-size: 14pt;">Ячейка 1</td><td align="center" style="font-size: 14pt;">Ячейка 2</td></tr></table>
      `;

      const pasted = parsePastedHtml(htmlWithEmptyPara);
      const report = checkTask13(doc, pasted, spec);

      const failedErrors = report.displayErrors.filter(e => e.status === 'fail');
      expect(failedErrors.length).toBe(1);
      expect(failedErrors[0].id).toBe('emptyParas');
      expect(report.vText).toBe(1);
      expect(report.vTable).toBe(0);
      expect(report.score).toBe(1);

      const gapCrit = report.items.find(i => i.id === 'gapToTable');
      expect(gapCrit?.status).toBe('unknown');
      expect((gapCrit as any)?.unknownReason).toBe('blocked');
    });
  });

  describe('tableWidth requirement tests', () => {
    const dummyDoc: Doc = {
      paragraphs: [{ spans: [{ text: 'Пример основного текста параграфа.' }] }],
      table: { rows: [[{ spans: [{ text: '1' }], colSpan: 1, rowSpan: 1 }]] }
    };

    it('tableWidth: условие формулируется без процентов', () => {
      const phrase = tableWidthRequirement.renderPhrase({ enabled: true }, dummyDoc);
      expect(phrase).toBe('Ширина таблицы меньше ширины основного текста.');
      expect(phrase).not.toContain('%');
    });

    it('tableWidth: таблица уже ширины текста проходит, во всю ширину даёт fail', () => {
      const pasted85 = {
        ...parsePastedHtml('<p>Текст</p><table><tr><td>1</td></tr></table>'),
        tableWidthRatio: 0.85
      };

      const resFor85 = tableWidthRequirement.check(
        { enabled: true },
        pasted85,
        dummyDoc,
        DEFAULT_SPEC.tolerances,
        DEFAULT_SPEC
      );
      expect(resFor85.status).toBe('ok');
      expect(resFor85.expected).toBe('меньше ширины основного текста');
      expect(resFor85.expected).not.toContain('%');

      const pastedFull = {
        ...parsePastedHtml('<p>Текст</p><table><tr><td>1</td></tr></table>'),
        tableWidthRatio: 0.99
      };
      const resFull = tableWidthRequirement.check(
        { enabled: true },
        pastedFull,
        dummyDoc,
        DEFAULT_SPEC.tolerances,
        DEFAULT_SPEC
      );
      expect(resFull.status).toBe('fail');
      expect(resFull.expected).toBe('меньше ширины основного текста');
      expect(resFull.expected).not.toContain('%');
    });
  });

  describe('indent tolerance tests', () => {
    const dummyDoc: Doc = {
      paragraphs: [{ spans: [{ text: 'Текст абзаца' }] }],
      table: null
    };

    it('indent tolerance: 1,12 см даёт fail и для требования 1,0, и для 1,25', () => {
      const pasted112 = {
        ...parsePastedHtml('<p style="text-indent: 1.12cm;">Текст абзаца</p>'),
        indents: [1.12]
      };

      const resFor10 = indentRequirement.check(
        { enabled: true, cm: 1.0 },
        pasted112,
        dummyDoc,
        DEFAULT_SPEC.tolerances,
        DEFAULT_SPEC
      );
      expect(resFor10.status).toBe('fail');

      const resFor125 = indentRequirement.check(
        { enabled: true, cm: 1.25 },
        pasted112,
        dummyDoc,
        DEFAULT_SPEC.tolerances,
        DEFAULT_SPEC
      );
      expect(resFor125.status).toBe('fail');
    });

    it('indent tolerance: значение с типичным округлением экспорта (1,24 см при требовании 1,25) даёт ok', () => {
      const pasted124 = {
        ...parsePastedHtml('<p style="text-indent: 1.24cm;">Текст абзаца</p>'),
        indents: [1.24]
      };

      const res = indentRequirement.check(
        { enabled: true, cm: 1.25 },
        pasted124,
        dummyDoc,
        DEFAULT_SPEC.tolerances,
        DEFAULT_SPEC
      );
      expect(res.status).toBe('ok');
    });
  });

  describe('NaN and unknown handling in criteria and score calculation', () => {
    it('gapBeforeTablePt = NaN → unknown', () => {
      const dummyDoc: Doc = {
        paragraphs: [{ spans: [{ text: 'Текст' }] }],
        table: { rows: [[{ spans: [{ text: 'Ячейка' }], colSpan: 1, rowSpan: 1 }]] }
      };
      const pasted = {
        ...parsePastedHtml('<p>Текст</p><table><tr><td>Ячейка</td></tr></table>'),
        gapToTablePt: NaN
      };
      const res = gapToTableRequirement.check(
        { enabled: true, minPt: 12, maxPt: 24 },
        pasted,
        dummyDoc,
        DEFAULT_SPEC.tolerances,
        DEFAULT_SPEC
      );
      expect(res.status).toBe('unknown');
    });

    it('документ, где lineSpacing не определился (unknown), не получает 2 балла', () => {
      const doc: Doc = {
        paragraphs: [{ spans: [{ text: 'Текст абзаца задания.' }] }],
        table: null
      };
      const spec: TaskSpec = {
        ...DEFAULT_SPEC,
        requirements: {
          ...DEFAULT_SPEC.requirements,
          fontSize: { enabled: true, pt: 14 },
          indent: { enabled: true, cm: 1.25 },
          bodyAlign: { enabled: true, align: 'justify' },
          lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 },
          emphasis: { enabled: false, bold: false, italic: false, underline: false },
          tableWidth: { enabled: false },
          tableSize: { enabled: false, rows: 0, cols: 0 },
          tableAlign: { enabled: false, align: 'center' },
          boldCells: { enabled: false },
          colAlign: { enabled: false },
          gapToTable: { enabled: false, minPt: 12, maxPt: 24 }
        }
      };

      // Документ без информации о line-height (lineHeights: [null])
      const pasted = {
        ...parsePastedHtml('<p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; font-family: \'Times New Roman\';">Текст абзаца задания.</p>'),
        lineHeights: []
      };

      const report = checkTask13(doc, pasted, spec);
      const lsItem = report.displayErrors.find(e => e.id === 'lineSpacing');
      expect(lsItem).toBeDefined();
      expect(lsItem?.status).toBe('unknown');
      // Так как lineSpacing имеет declare: 'text', unknown статус приводит к снятию балла
      expect(report.score).not.toBe(2);
      expect(report.score).toBe(1);
    });

    it('значения 0 (отступ 0 см, интервал между абзацами 0 пт, расстояние до таблицы 0 пт) дают статус fail (не unknown)', () => {
      const doc: Doc = {
        paragraphs: [
          { spans: [{ text: 'Первый абзац текста задания.' }] },
          { spans: [{ text: 'Второй абзац текста задания.' }] }
        ],
        table: {
          rows: [[{ spans: [{ text: 'Ячейка' }], colSpan: 1, rowSpan: 1 }]]
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
          paraSpacing: { enabled: true, minPt: 6, maxPt: 12 },
          gapToTable: { enabled: true, minPt: 18, maxPt: 24 },
          emphasis: { enabled: false, bold: false, italic: false, underline: false },
          tableWidth: { enabled: false },
          tableSize: { enabled: false, rows: 0, cols: 0 },
          tableAlign: { enabled: false, align: 'center' },
          boldCells: { enabled: false },
          colAlign: { enabled: false }
        }
      };

      // HTML с явными нулевыми значениями: text-indent: 0cm, margin-bottom: 0pt, margin-top: 0pt
      const html = `
        <p style="font-size: 14pt; line-height: 1.2; text-indent: 0cm; margin-bottom: 0pt; text-align: justify; font-family: 'Times New Roman';">Первый абзац текста задания.</p>
        <p style="font-size: 14pt; line-height: 1.2; text-indent: 0cm; margin-bottom: 0pt; text-align: justify; font-family: 'Times New Roman';">Второй абзац текста задания.</p>
        <table style="margin-top: 0pt; margin-bottom: 0pt;"><tr><td style="font-size: 14pt;">Ячейка</td></tr></table>
      `;
      const pasted = parsePastedHtml(html);

      // Проверка парсера
      expect(pasted.indents).toEqual([0, 0]);
      expect(pasted.paraGaps?.[0]?.sum).toBe(0);
      expect(pasted.gapToTablePt).toBe(0);

      // Проверка критериев
      const report = checkTask13(doc, pasted, spec);

      const indentItem = report.items.find(i => i.id === 'indent');
      expect(indentItem).toBeDefined();
      expect(indentItem?.status).toBe('fail');
      expect(indentItem?.actual).toContain('0 см');

      const paraSpacingItem = report.items.find(i => i.id === 'paraSpacing');
      expect(paraSpacingItem).toBeDefined();
      expect(paraSpacingItem?.status).toBe('fail');
      expect(paraSpacingItem?.actual).toContain('0 пт');

      const gapItem = report.items.find(i => i.id === 'gapToTable');
      expect(gapItem).toBeDefined();
      expect(gapItem?.status).toBe('fail');
      expect(gapItem?.actual).toContain('0 пт');

      // 2 ошибки по тексту (indent=1, paraSpacing=1 -> vText=2) и 1 ошибка по таблице (gapToTable -> vTable=1)
      expect(report.vText).toBe(2);
      expect(report.vTable).toBe(1);
      expect(report.score).toBe(0);

      // Если только indent = 0 см при идеальных остальных
      const htmlOnlyIndent0 = `
        <p style="font-size: 14pt; line-height: 1.2; text-indent: 0cm; margin-bottom: 8pt; text-align: justify; font-family: 'Times New Roman';">Первый абзац текста задания.</p>
        <p style="font-size: 14pt; line-height: 1.2; text-indent: 0cm; margin-bottom: 0pt; text-align: justify; font-family: 'Times New Roman';">Второй абзац текста задания.</p>
        <table style="margin-top: 20pt; margin-bottom: 0pt; width: 70%;" align="center"><tr><td style="font-size: 14pt;" align="center">Ячейка</td></tr></table>
      `;
      const pastedOnlyIndent0 = parsePastedHtml(htmlOnlyIndent0);
      const reportOnlyIndent0 = checkTask13(doc, pastedOnlyIndent0, spec);
      const indentOnly = reportOnlyIndent0.items.find(i => i.id === 'indent');
      expect(indentOnly?.status).toBe('fail');
      expect(reportOnlyIndent0.vText).toBe(1);
      expect(reportOnlyIndent0.vTable).toBe(0);
      expect(reportOnlyIndent0.score).toBe(1);
    });

    it('18. Paragraph with margin-bottom: auto and margin-top: 10qq does not produce NaN, checks paraSpacing and gapToTable', () => {
      const doc: Doc = {
        paragraphs: [
          { spans: [{ text: 'Первый абзац текста задания.' }] },
          { spans: [{ text: 'Второй абзац текста задания.' }] }
        ],
        table: {
          rows: [[{ spans: [{ text: 'Ячейка' }], colSpan: 1, rowSpan: 1, align: 'center' }]]
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
          paraSpacing: { enabled: true, minPt: 6, maxPt: 12 },
          gapToTable: { enabled: true, minPt: 18, maxPt: 24 },
          emphasis: { enabled: false, bold: false, italic: false, underline: false },
          tableWidth: { enabled: false }
        }
      };

      const html = `
        <p style="font-size: 14pt; line-height: 1.2; text-indent: 1.25cm; margin-bottom: auto; text-align: justify; font-family: 'Times New Roman';">Первый абзац текста задания.</p>
        <p style="font-size: 14pt; line-height: 1.2; text-indent: 1.25cm; margin-top: 10qq; margin-bottom: 0pt; text-align: justify; font-family: 'Times New Roman';">Второй абзац текста задания.</p>
        <table style="margin-top: 20pt; margin-bottom: 0pt; width: 70%;" align="center"><tr><td style="font-size: 14pt;" align="center">Ячейка</td></tr></table>
      `;

      const pasted = parsePastedHtml(html);

      // Проверяем, что ни в одном массиве нет NaN
      expect(pasted.paraGaps.every(g => !isNaN(g.after) && !isNaN(g.before) && !isNaN(g.sum) && !isNaN(g.max))).toBe(true);
      expect(pasted.indents.every(v => v === null || !isNaN(v))).toBe(true);
      expect(pasted.lineHeights.every(v => v === null || !isNaN(v))).toBe(true);
      if (pasted.gapToTablePt !== null) {
        expect(isNaN(pasted.gapToTablePt)).toBe(false);
      }

      // margin-bottom: auto парсится как null -> 0 pt, margin-top: 10qq парсится как 10 pt
      // Межабзацный интервал между p0 и p1 = mb(0) + mt(10) = 10 pt (входит в диапазон 6-12 пт -> status: 'ok')
      const report = checkTask13(doc, pasted, spec);
      const paraSpacingItem = report.items.find(i => i.id === 'paraSpacing');
      expect(paraSpacingItem).toBeDefined();
      expect(paraSpacingItem?.status).toBe('ok');
      expect(paraSpacingItem?.actual).toContain('10 пт');

      // gapToTable = mb(0) + tableMt(20) = 20 pt (входит в диапазон 18-24 пт -> status: 'ok')
      const gapItem = report.items.find(i => i.id === 'gapToTable');
      expect(gapItem).toBeDefined();
      expect(gapItem?.status).toBe('ok');
      expect(gapItem?.actual).toContain('20 пт');
    });

    it('19. Document with missing line-height in paragraphs defaults to 1.0 (ok status, 2/2 score)', () => {
      const doc: Doc = {
        paragraphs: [
          { spans: [{ text: 'Первый абзац текста задания.' }] },
          { spans: [{ text: 'Второй абзац текста задания.' }] }
        ],
        table: {
          rows: [[{ spans: [{ text: 'Ячейка' }], colSpan: 1, rowSpan: 1, align: 'center' }]]
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
          paraSpacing: { enabled: true, minPt: 6, maxPt: 12 },
          gapToTable: { enabled: true, minPt: 18, maxPt: 24 },
          emphasis: { enabled: false, bold: false, italic: false, underline: false },
          tableWidth: { enabled: false }
        }
      };

      // HTML без свойства line-height вообще
      const htmlNoLineHeight = `
        <p style="font-size: 14pt; text-indent: 1.25cm; margin-bottom: 8pt; text-align: justify; font-family: 'Times New Roman';">Первый абзац текста задания.</p>
        <p style="font-size: 14pt; text-indent: 1.25cm; margin-bottom: 0pt; text-align: justify; font-family: 'Times New Roman';">Второй абзац текста задания.</p>
        <table style="margin-top: 20pt; margin-bottom: 0pt; width: 70%;" align="center"><tr><td style="font-size: 14pt;" align="center">Ячейка</td></tr></table>
      `;

      const pasted = parsePastedHtml(htmlNoLineHeight);
      expect(pasted.lineHeights).toEqual([1.0, 1.0]);

      const report = checkTask13(doc, pasted, spec);
      const lsItem = report.items.find(i => i.id === 'lineSpacing');
      expect(lsItem).toBeDefined();
      expect(lsItem?.status).toBe('ok');
      expect(lsItem?.actual).toBe('1');
      expect(report.score).toBe(2);
      expect(report.vText).toBe(0);
      expect(report.vTable).toBe(0);
    });

    it('20. Document without table produces exactly 1 error in displayErrors (tableExists), score 1, vText 0', () => {
      const doc: Doc = {
        paragraphs: [
          { spans: [{ text: 'Основной текст задания для проверки без таблицы.' }] }
        ],
        table: {
          rows: [
            [
              { spans: [{ text: 'Ячейка 1' }], colSpan: 1, rowSpan: 1, align: 'left' },
              { spans: [{ text: 'Ячейка 2' }], colSpan: 1, rowSpan: 1, align: 'center' }
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
          emphasis: { enabled: false, bold: false, italic: false, underline: false },
          tableSize: { enabled: true, rows: 1, cols: 2 },
          colAlign: { enabled: true },
          gapToTable: { enabled: true, minPt: 18, maxPt: 24 }
        }
      };

      // HTML только с текстом (без таблицы)
      const htmlNoTable = `
        <p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">Основной текст задания для проверки без таблицы.</p>
      `;

      const pasted = parsePastedHtml(htmlNoTable);
      const report = checkTask13(doc, pasted, spec);

      const errors = report.displayErrors.filter(it => isCritError(it));
      expect(errors.length).toBe(1);
      expect(errors[0].id).toBe('tableExists');
      expect(report.score).toBe(1);
      expect(report.vText).toBe(0);
      expect(report.vTable).toBe(1);
      expect(Number.isFinite(report.vTable)).toBe(true);
    });

    it('21. Document with unrecognized lineSpacing produces lineSpacing in errors and score 1 (vText 1, vTable 0)', () => {
      const doc: Doc = {
        paragraphs: [
          { spans: [{ text: 'Текст абзаца с нераспознанным межстрочным интервалом.' }] }
        ],
        table: {
          rows: [
            [
              { spans: [{ text: 'Ячейка 1' }], colSpan: 1, rowSpan: 1, align: 'left' },
              { spans: [{ text: 'Ячейка 2' }], colSpan: 1, rowSpan: 1, align: 'center' }
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
          emphasis: { enabled: false, bold: false, italic: false, underline: false },
          tableSize: { enabled: true, rows: 1, cols: 2 },
          colAlign: { enabled: true },
          gapToTable: { enabled: true, minPt: 18, maxPt: 24 }
        }
      };

      const html = `
        <p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify; line-height: 1.2; font-family: 'Times New Roman';">Текст абзаца с нераспознанным межстрочным интервалом.</p>
        <table align="center" style="margin-top: 20pt; width: 70%;"><tr><td align="left" style="font-size: 14pt;">Ячейка 1</td><td align="center" style="font-size: 14pt;">Ячейка 2</td></tr></table>
      `;

      const pasted = parsePastedHtml(html);
      // Симулируем случай, когда интервал не удалось определить (нераспознанное значение / пустой массив)
      pasted.lineHeights = [];

      const report = checkTask13(doc, pasted, spec);
      const errors = report.displayErrors.filter(it => isCritError(it));

      expect(errors.map(e => e.id)).toContain('lineSpacing');
      expect(report.score).toBe(1);
      expect(report.vText).toBe(1);
      expect(report.vTable).toBe(0);
    });

    it('22. Changing actual text does not affect score or isCritError result', () => {
      const doc: Doc = {
        paragraphs: [
          { spans: [{ text: 'Абзац текста.' }] }
        ],
        table: {
          rows: [
            [
              { spans: [{ text: 'A' }], colSpan: 1, rowSpan: 1, align: 'left' },
              { spans: [{ text: 'B' }], colSpan: 1, rowSpan: 1, align: 'center' }
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
          tableSize: { enabled: true, rows: 1, cols: 2 }
        }
      };

      // HTML without table
      const pasted = parsePastedHtml('<p style="font-size: 14pt; text-indent: 1.25cm; text-align: justify;">Текст</p>');
      const report1 = checkTask13(doc, pasted, spec);

      // Mutate every item's actual text to arbitrary strings
      const modifiedDisplayErrors = report1.displayErrors.map(item => ({
        ...item,
        actual: 'Совершенно произвольная строка для ученика'
      }));

      // Verify isCritError is invariant to actual text changes
      for (let i = 0; i < report1.displayErrors.length; i++) {
        expect(isCritError(modifiedDisplayErrors[i])).toBe(isCritError(report1.displayErrors[i]));
      }

      // Verify score calculation is invariant to actual text changes
      const recomputed = computeScore(
        modifiedDisplayErrors,
        report1.typosText,
        report1.typosTable,
        true,
        false,
        true
      );
      expect(recomputed.score).toBe(report1.score);
      expect(recomputed.vText).toBe(report1.vText);
      expect(recomputed.vTable).toBe(report1.vTable);
    });

    it('23. Paragraphs with line-height: normal (a) fails and gives 1 score at minRatio 1.15; (b) passes and gives 2 score at minRatio 1.0', () => {
      const doc: Doc = {
        paragraphs: [
          { spans: [{ text: 'Абзац текста с нормальным интервалом.' }] }
        ],
        table: {
          rows: [
            [
              { spans: [{ text: 'A' }], colSpan: 1, rowSpan: 1, align: 'left' },
              { spans: [{ text: 'B' }], colSpan: 1, rowSpan: 1, align: 'center' }
            ]
          ]
        }
      };

      const html = `
        <p style="font-size: 14pt; line-height: normal; text-indent: 1.25cm; text-align: justify; font-family: 'Times New Roman';">Абзац текста с нормальным интервалом.</p>
        <table align="center" style="margin-top: 20pt; width: 70%;"><tr><td align="left" style="font-size: 14pt;">A</td><td align="center" style="font-size: 14pt;">B</td></tr></table>
      `;
      const pasted = parsePastedHtml(html);

      // (a) minRatio 1.15 -> lineSpacing fails, score 1 (vText 1, vTable 0)
      const specA: TaskSpec = {
        ...DEFAULT_SPEC,
        requirements: {
          ...DEFAULT_SPEC.requirements,
          fontSize: { enabled: true, pt: 14 },
          indent: { enabled: true, cm: 1.25 },
          bodyAlign: { enabled: true, align: 'justify' },
          lineSpacing: { enabled: true, minRatio: 1.15, maxRatio: 1.5 },
          emphasis: { enabled: false, bold: false, italic: false, underline: false },
          tableSize: { enabled: true, rows: 1, cols: 2 },
          colAlign: { enabled: true },
          gapToTable: { enabled: true, minPt: 18, maxPt: 24 }
        }
      };
      const reportA = checkTask13(doc, pasted, specA);
      const errorsA = reportA.displayErrors.filter(isCritError);
      expect(errorsA.map(e => e.id)).toContain('lineSpacing');
      expect(reportA.score).toBe(1);
      expect(reportA.vText).toBe(1);
      expect(reportA.vTable).toBe(0);

      // (b) minRatio 1.0 -> lineSpacing ok, score 2 (vText 0, vTable 0)
      const specB: TaskSpec = {
        ...specA,
        requirements: {
          ...specA.requirements,
          lineSpacing: { enabled: true, minRatio: 1.0, maxRatio: 1.5 }
        }
      };
      const reportB = checkTask13(doc, pasted, specB);
      const errorsB = reportB.displayErrors.filter(isCritError);
      expect(errorsB.map(e => e.id)).not.toContain('lineSpacing');
      expect(reportB.score).toBe(2);
      expect(reportB.vText).toBe(0);
      expect(reportB.vTable).toBe(0);
    });

    it('24. Document without recognized paragraphs results in vText >= 1 and score 0 (if table also missing) or score 1 (if table is correct)', () => {
      const doc: Doc = {
        paragraphs: [
          { spans: [{ text: 'Текст абзаца задания.' }] }
        ],
        table: {
          rows: [
            [
              { spans: [{ text: 'A' }], colSpan: 1, rowSpan: 1, align: 'left' },
              { spans: [{ text: 'B' }], colSpan: 1, rowSpan: 1, align: 'center' }
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
          tableSize: { enabled: true, rows: 1, cols: 2 },
          colAlign: { enabled: true },
          gapToTable: { enabled: true, minPt: 18, maxPt: 24 }
        }
      };

      // Case 1: No paragraphs, but table is correct -> vText >= 1, vTable = 0 -> score 1
      const htmlTableOnly = `
        <table align="center" style="margin-top: 20pt; width: 70%;"><tr><td align="left" style="font-size: 14pt;">A</td><td align="center" style="font-size: 14pt;">B</td></tr></table>
      `;
      const pastedTableOnly = parsePastedHtml(htmlTableOnly);
      const reportTableOnly = checkTask13(doc, pastedTableOnly, spec);

      expect(reportTableOnly.vText).toBeGreaterThanOrEqual(1);
      expect(reportTableOnly.vTable).toBe(0);
      expect(reportTableOnly.score).toBe(1);

      // Case 2: No paragraphs and no table (completely empty HTML) -> vText >= 1, vTable >= 1 -> score 0
      const pastedEmpty = parsePastedHtml('');
      const reportEmpty = checkTask13(doc, pastedEmpty, spec);

      expect(reportEmpty.vText).toBeGreaterThanOrEqual(1);
      expect(reportEmpty.vTable).toBeGreaterThanOrEqual(1);
      expect(reportEmpty.score).toBe(0);
    });

    it('25. describeMerges produces pure geometric coordinate descriptions without string/word dependencies', () => {
      // 1. No merges -> fallback text
      const tableNoMerges: Doc['table'] = {
        rows: [
          [
            { spans: [{ text: 'A' }], colSpan: 1, rowSpan: 1, align: 'left' },
            { spans: [{ text: 'B' }], colSpan: 1, rowSpan: 1, align: 'center' }
          ]
        ]
      };
      expect(describeMerges(tableNoMerges)).toBe('объединения по образцу');

      // 2. Horizontal merge: Row 1, columns 1-2
      const tableHorizontal: Doc['table'] = {
        rows: [
          [
            { spans: [{ text: 'Merged header' }], colSpan: 2, rowSpan: 1, align: 'center' }
          ],
          [
            { spans: [{ text: 'C1' }], colSpan: 1, rowSpan: 1, align: 'left' },
            { spans: [{ text: 'C2' }], colSpan: 1, rowSpan: 1, align: 'right' }
          ]
        ]
      };
      expect(describeMerges(tableHorizontal)).toBe('строка 1: объединены столбцы 1–2');

      // 3. Vertical merge: Col 1, rows 1-2
      const tableVertical: Doc['table'] = {
        rows: [
          [
            { spans: [{ text: 'V-Merged' }], colSpan: 1, rowSpan: 2, align: 'center' },
            { spans: [{ text: 'R1' }], colSpan: 1, rowSpan: 1, align: 'left' }
          ],
          [
            { spans: [{ text: 'R2' }], colSpan: 1, rowSpan: 1, align: 'left' }
          ]
        ]
      };
      expect(describeMerges(tableVertical)).toBe('столбец 1: строки 1–2 объединены по вертикали');

      // 4. Block 2x2 merge: Rows 1-2, Cols 1-2
      const tableBlock: Doc['table'] = {
        rows: [
          [
            { spans: [{ text: '2x2' }], colSpan: 2, rowSpan: 2, align: 'center' },
            { spans: [{ text: 'Side 1' }], colSpan: 1, rowSpan: 1, align: 'left' }
          ],
          [
            { spans: [{ text: 'Side 2' }], colSpan: 1, rowSpan: 1, align: 'left' }
          ]
        ]
      };
      expect(describeMerges(tableBlock)).toBe('строки 1–2, столбцы 1–2 объединены');
    });
  });

  describe('Punctuation and Typo Verification Tests', () => {
    it('em-dashes replaced with hyphens produces 0 typos and score 2', () => {
      const task = generateTask13(1, 3);
      let html = renderCompliantHtml(task);
      html = html.replace(/[—–]/g, '-');
      const pasted = parsePastedHtml(html);
      const report = checkTask13(task.doc, pasted, task.doc.spec);
      const typoItem = report.items.find(it => it.id === 'typosText');
      expect(typoItem?.status).toBe('ok');
      expect(typoItem?.actual).toBe('опечаток: 0');
      expect(report.score).toBe(2);
    });

    it('3 commas removed produces exactly 3 typos, status ok, and score 2 (within limit of 5)', () => {
      const task = generateTask13(1, 3);
      let html = renderCompliantHtml(task);
      const tableIdx = html.indexOf('<table');
      let textPart = tableIdx !== -1 ? html.slice(0, tableIdx) : html;
      const tablePart = tableIdx !== -1 ? html.slice(tableIdx) : '';
      let count = 0;
      textPart = textPart.replace(/,/g, (m) => {
        if (count < 3) { count++; return ''; }
        return m;
      });
      expect(count).toBe(3);
      const pasted = parsePastedHtml(textPart + tablePart);
      const report = checkTask13(task.doc, pasted, task.doc.spec);
      const typoItem = report.items.find(it => it.id === 'typosText');
      expect(typoItem?.status).toBe('ok');
      expect(typoItem?.actual).toContain('опечаток: 3');
      expect(report.vText).toBe(0);
      expect(report.score).toBe(2);
    });

    it('6 commas removed produces exactly 6 typos, status fail, and score 1 (exceeds limit of 5)', () => {
      const task = generateTask13(1, 3);
      let html = renderCompliantHtml(task);
      const tableIdx = html.indexOf('<table');
      let textPart = tableIdx !== -1 ? html.slice(0, tableIdx) : html;
      const tablePart = tableIdx !== -1 ? html.slice(tableIdx) : '';
      let count = 0;
      textPart = textPart.replace(/,/g, (m) => {
        if (count < 6) { count++; return ''; }
        return m;
      });
      expect(count).toBe(6);
      const pasted = parsePastedHtml(textPart + tablePart);
      const report = checkTask13(task.doc, pasted, task.doc.spec);
      const typoItem = report.items.find(it => it.id === 'typosText');
      expect(typoItem?.status).toBe('fail');
      expect(typoItem?.actual).toContain('опечаток: 6');
      expect(report.vText).toBe(1);
      expect(report.vTable).toBe(0);
      expect(report.score).toBe(1);
    });
  });
});


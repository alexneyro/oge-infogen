import { JSDOM } from 'jsdom';
const dom = new JSDOM();
(global as any).DOMParser = dom.window.DOMParser;
(global as any).Node = dom.window.Node;

import { generateTask13 } from '../src/tasks/task13/generate';
import { parsePastedHtml } from '../src/tasks/task13/html';
import { checkTask13 } from '../src/tasks/task13/check';
import { Doc } from '../src/tasks/task13/parse';
import { TaskSpec, DEFAULT_SPEC } from '../src/tasks/task13/spec';
import { Difficulty } from '../src/types';

export function renderSampleHtml(doc: Doc, spec: TaskSpec = DEFAULT_SPEC): string {
  const effectiveSpec = doc.spec || spec || DEFAULT_SPEC;
  const req = effectiveSpec.requirements;

  let bodyContent = '';

  doc.paragraphs.forEach((para, idx) => {
    const isHeading = doc.headingIndex !== undefined && doc.headingIndex !== null && idx === doc.headingIndex;
    const isLastBeforeTable = idx === doc.paragraphs.length - 1 && doc.table !== null;

    const align = isHeading ? (req.heading?.align || 'center') : (req.bodyAlign.align || 'justify');
    const indentCm = isHeading ? (req.heading?.indentCm ?? 0) : req.indent.cm;
    const fsPt = req.fontSize.pt;

    let marginPt = 7.1; // ~0.25cm
    if (isHeading) {
      marginPt = req.heading?.spacingPt ?? 12;
    } else if (isLastBeforeTable && req.gapToTable.enabled) {
      marginPt = (req.gapToTable.minPt + req.gapToTable.maxPt) / 2; // e.g. 15 or 18 pt
    } else if (req.paraSpacing.enabled) {
      marginPt = (req.paraSpacing.minPt + req.paraSpacing.maxPt) / 2; // e.g. 12 or 18 pt
    }

    const spanHtml = para.spans.map(s => {
      let t = s.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (s.sup) t = `<sup>${t}</sup>`;
      if (s.sub) t = `<sub>${t}</sub>`;
      if (s.b) t = `<b>${t}</b>`;
      if (s.i) t = `<i>${t}</i>`;
      if (s.u) t = `<u>${t}</u>`;
      return t;
    }).join('');

    bodyContent += `<p align="${align}" style="font-size: ${fsPt}pt; text-indent: ${indentCm}cm; margin-bottom: ${marginPt}pt; line-height: 115%;">${spanHtml}</p>\n`;
  });

  if (doc.table && doc.table.rows && doc.table.rows.length > 0) {
    const tableAlign = req.tableAlign.align || 'center';
    let tableWidthStyle = 'width: 70%; margin: 0 auto;';
    if (tableAlign === 'left') tableWidthStyle = 'width: 70%; margin-left: 0;';
    if (tableAlign === 'right') tableWidthStyle = 'width: 70%; margin-right: 0; margin-left: auto;';

    let tableRowsHtml = '';
    doc.table.rows.forEach(r => {
      let cellsHtml = '';
      r.forEach(c => {
        const cAlign = c.align || 'left';
        const cValign = c.valign || 'middle';
        const colSpanAttr = c.colSpan > 1 ? ` colspan="${c.colSpan}"` : '';
        const rowSpanAttr = c.rowSpan > 1 ? ` rowspan="${c.rowSpan}"` : '';

        const cellSpanHtml = c.spans.map(s => {
          let t = s.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if (s.sup) t = `<sup>${t}</sup>`;
          if (s.sub) t = `<sub>${t}</sub>`;
          if (s.b) t = `<b>${t}</b>`;
          if (s.i) t = `<i>${t}</i>`;
          if (s.u) t = `<u>${t}</u>`;
          return t;
        }).join('');

        cellsHtml += `<td${colSpanAttr}${rowSpanAttr} align="${cAlign}" valign="${cValign}" style="border: 1px solid #000; padding: 0.1cm;"><p align="${cAlign}"><font style="font-size: ${req.fontSize.pt}pt">${cellSpanHtml}</font></p></td>`;
      });
      tableRowsHtml += `<tr>${cellsHtml}</tr>\n`;
    });

    bodyContent += `<center><table width="344" align="${tableAlign}" cellpadding="2" cellspacing="0" style="${tableWidthStyle}">\n${tableRowsHtml}</table></center>\n`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
  <meta name="generator" content="LibreOffice 25.8.5.2 (Windows)"/>
  <style type="text/css">
    @page { size: 21cm 29.7cm; margin: 2cm }
    p { line-height: 115%; margin-bottom: 0.25cm; background: transparent }
    em { font-style: italic }
    strong { font-weight: bold }
  </style>
</head>
<body lang="ru-RU" dir="ltr">
${bodyContent}
</body>
</html>`;
}

async function runRoundTripTest() {
  const levels: Difficulty[] = [1, 2, 3];
  const summary: Record<number, { total: number; perfect: number; failedCriteria: Record<string, number>; sampleFails: any[] }> = {};

  for (const lvl of levels) {
    summary[lvl] = { total: 200, perfect: 0, failedCriteria: {}, sampleFails: [] };
    for (let i = 1; i <= 200; i++) {
      const seed = i * 997 + lvl * 10000;
      const task = generateTask13(seed, lvl);
      const html = renderSampleHtml(task.doc, task.doc.spec);
      const pasted = parsePastedHtml(html);
      const report = checkTask13(task.doc, pasted, task.doc.spec);

      const isPerfect = report.score === report.maxScore && report.vText === 0 && report.vTable === 0;
      if (isPerfect) {
        summary[lvl].perfect++;
      } else {
        const failedItems = report.items.filter(it => it.status === 'fail');
        failedItems.forEach(it => {
          summary[lvl].failedCriteria[it.id] = (summary[lvl].failedCriteria[it.id] || 0) + 1;
        });
        if (summary[lvl].sampleFails.length < 5) {
          summary[lvl].sampleFails.push({
            seed,
            score: `${report.score}/${report.maxScore}`,
            vText: report.vText,
            vTable: report.vTable,
            failed: failedItems.map(it => `${it.id} (${it.actual} vs exp ${it.expected})`)
          });
        }
      }
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

runRoundTripTest();

import React from 'react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { StatementBlock, StatementText, StatementNote } from '../components/task-ui';
import { TASK13_TEXTS, TASK13_TABLES, Task13TextSrc, Task13TableSrc } from '../data/task13data';
import { buildDoc, Doc, Span, Cell } from './task13/parse';
import { TaskSpec, DEFAULT_SPEC, generateTaskRequirements, formatTask13Preamble } from './task13/spec';
import { parsePastedHtml, PastedDoc } from './task13/html';
import { checkTask13, Task13Report, CritResult } from './task13/check';
import { filterCriteriaForUi, TASK13_REQUIREMENTS_POLICY } from './task13/registry';
import { generateTask13, Task13, Task13Data } from './task13/generate';

export type { Task13, Task13Data };
export { generateTask13 };

const defaultEmptyPasted: PastedDoc = {
  headingIndex: null,
  paragraphs: [],
  table: null,
  generator: null,
  fontSizes: [],
  aligns: [],
  indents: [],
  indentBySpaces: [],
  hasLineBreaks: [],
  lineHeights: [],
  paraGaps: [],
  gapToTablePt: null,
  tableAlign: null,
  tableWidthRatio: null,
  valigns: [],
  cellHasLineBreak: [],
  boldFragments: [],
  italicFragments: [],
  underlineFragments: [],
  supFragments: [],
  subFragments: [],
  emptyParaCount: 0,
  emptyParasBeforeTable: 0
};

export function parseTask13Answer(raw: string): PastedDoc | null {
  if (!raw || !raw.trim()) return null;
  try {
    const obj = JSON.parse(raw);
    if (obj && Array.isArray(obj.paragraphs)) {
      return obj as PastedDoc;
    }
  } catch (e) {
    // Игнорируем ошибку парсинга
  }
  return null;
}

function cleanWord(str: string): string {
  let s = str.toLowerCase().replace(/ё/g, 'е');
  s = s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  return s;
}

interface MarkDetail {
  nums: number[];
  punct?: boolean;
  isNotice?: boolean;
}

function renderSpans(spans: Span[]) {
  return spans.map((s, idx) => {
    let node: React.ReactNode = s.text;
    if (s.sup) node = <sup>{node}</sup>;
    if (s.sub) node = <sub>{node}</sub>;
    if (s.b) node = <strong>{node}</strong>;
    if (s.i) node = <em>{node}</em>;
    if (s.u) node = <u>{node}</u>;
    return <React.Fragment key={idx}>{node}</React.Fragment>;
  });
}

function renderPastedSpans(
  spans: Span[],
  pIdx: number,
  wordMarksMap: Map<string, MarkDetail>,
  showHighlight: boolean
) {
  let wordCounter = 0;
  return spans.map((s, sIdx) => {
    const parts = s.text.split(/(\s+)/);
    return (
      <React.Fragment key={sIdx}>
        {parts.map((part, partIdx) => {
          if (!part) return null;
          if (/^\s+$/.test(part)) {
            return <React.Fragment key={partIdx}>{part}</React.Fragment>;
          }

          const clean = cleanWord(part);
          let markDetail: MarkDetail | undefined;
          if (clean) {
            const currentWordIdx = wordCounter++;
            markDetail = wordMarksMap.get(`${pIdx}:${currentWordIdx}`);
          }

          let node: React.ReactNode = part;
          if (s.sup) node = <sup>{node}</sup>;
          if (s.sub) node = <sub>{node}</sub>;
          if (s.b) node = <strong>{node}</strong>;
          if (s.i) node = <em>{node}</em>;
          if (s.u) node = <u>{node}</u>;

          if (showHighlight && markDetail) {
            if (markDetail.nums.length > 0) {
              const isPunct = markDetail.punct;
              const containerCls = isPunct
                ? 'bg-amber-100 dark:bg-amber-950/40 underline decoration-wavy decoration-amber-500 rounded px-0.5 inline-block'
                : 'bg-rose-100 dark:bg-rose-950/40 underline decoration-wavy decoration-rose-500 rounded px-0.5 inline-block';
              const badgeCls = isPunct
                ? 'text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded px-1 py-0.5'
                : 'text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900 border border-rose-300 dark:border-rose-700 rounded px-1 py-0.5';

              return (
                <span key={partIdx} className={containerCls}>
                  {node}
                  <sup className="ml-0.5">
                    <span className={badgeCls}>
                      {markDetail.nums.join(',')}
                    </span>
                  </sup>
                </span>
              );
            } else if (markDetail.isNotice) {
              return (
                <span key={partIdx} className="bg-amber-50 dark:bg-amber-950/30 underline decoration-dotted decoration-amber-500 rounded px-0.5 inline-block">
                  {node}
                  <sup className="ml-0.5">
                    <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/80 border border-amber-300 dark:border-amber-700 rounded px-1 py-0.5" title="Замечание: опечатка в пределах нормы (не снижает балл)">
                      ℹ️
                    </span>
                  </sup>
                </span>
              );
            }
          }

          return <React.Fragment key={partIdx}>{node}</React.Fragment>;
        })}
      </React.Fragment>
    );
  });
}

function renderDocTable(table: { rows: Cell[][] } | null, spec: TaskSpec = DEFAULT_SPEC) {
  if (!table || !table.rows || table.rows.length === 0) return null;
  const tableAlign = spec.requirements.tableAlign.align;
  const tableAlignClass = tableAlign === 'left' ? 'justify-start' : tableAlign === 'right' ? 'justify-end' : 'justify-center';
  const tableWidthPercent = Math.min(Math.round((spec.tableFullWidthRatio ?? 0.8) * 100 * 0.75), 90); // Визуальное отображение ~70%
  const gapPt = spec.requirements.gapToTable.minPt;
  return (
    <div className={`flex ${tableAlignClass} mt-[${gapPt}pt] mb-4`}>
      <table className={`w-[${tableWidthPercent}%] border-collapse border border-slate-800 text-sm`}>
        <tbody>
          {table.rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx === 0 ? 'font-bold' : ''}>
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  colSpan={cell.colSpan}
                  rowSpan={cell.rowSpan}
                  className={`border border-slate-800 px-3 py-1.5 align-middle ${
                    cell.align === 'center' || (cIdx > 0 && cell.align !== 'left')
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {renderSpans(cell.spans)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderPastedDocTable(
  table: { rows: Cell[][] } | null,
  cellMarksMap: Map<string, MarkDetail>,
  showHighlight: boolean
) {
  if (!table || !table.rows || table.rows.length === 0) return null;
  return (
    <div className="flex justify-center mt-[18pt] mb-4">
      <table className="w-[70%] border-collapse border border-slate-700 text-sm">
        <tbody>
          {table.rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx === 0 ? 'font-bold' : ''}>
              {row.map((cell, cIdx) => {
                const cellDetail = cellMarksMap.get(`${rIdx}:${cIdx}`);
                const isCellError = showHighlight && cellDetail && cellDetail.nums.length > 0;
                const isCellNotice = showHighlight && cellDetail && !isCellError && cellDetail.isNotice;
                const isPunct = cellDetail?.punct;
                return (
                  <td
                    key={cIdx}
                    colSpan={cell.colSpan}
                    rowSpan={cell.rowSpan}
                    className={`border px-3 py-1.5 align-middle ${
                      isCellError
                        ? isPunct
                          ? 'border-2 border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100'
                          : 'border-2 border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100'
                        : isCellNotice
                        ? 'border-2 border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100'
                        : 'border-slate-700'
                    } ${
                      cell.align === 'center' || (cIdx > 0 && cell.align !== 'left')
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {renderSpans(cell.spans)}
                    {isCellError && (
                      <sup className="ml-1">
                        <span className={`text-[10px] font-bold rounded px-1 py-0.5 ${
                          isPunct
                            ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900 border border-amber-300 dark:border-amber-700'
                            : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900 border border-rose-300 dark:border-rose-700'
                        }`}>
                          {cellDetail.nums.join(',')}
                        </span>
                      </sup>
                    )}
                    {isCellNotice && (
                      <sup className="ml-1">
                        <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/80 border border-amber-300 dark:border-amber-700 rounded px-1 py-0.5" title="Замечание: опечатка в пределах нормы (не снижает балл)">
                          ℹ️
                        </span>
                      </sup>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CritItemRow({ item, failNum }: { item: CritResult; failNum?: number }) {
  const policy = TASK13_REQUIREMENTS_POLICY.find(p => p.id === item.id);
  const isDeclared = policy ? policy.declare === 'text' : true;

  return (
    <div
      className={`p-3 rounded-md border text-sm flex items-start gap-3 ${
        item.status === 'ok'
          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-slate-800 dark:text-slate-200'
          : item.status === 'fail' || (item.status === 'unknown' && isDeclared)
          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-slate-800 dark:text-slate-200'
          : 'bg-slate-100 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700/50 text-slate-700 dark:text-slate-300'
      }`}
    >
      <div className="mt-0.5 text-base font-bold shrink-0 flex items-center gap-1.5">
        {item.status === 'ok' && <span className="text-emerald-600 dark:text-emerald-400">✓</span>}
        {item.status === 'fail' && (
          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
            ✕ {failNum !== undefined && <span className="text-xs bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded px-1">#{failNum}</span>}
          </span>
        )}
        {item.status === 'unknown' && (
          isDeclared ? (
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
              ✕ {failNum !== undefined && <span className="text-xs bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded px-1">#{failNum}</span>}
            </span>
          ) : (
            <span className="text-slate-500">?</span>
          )
        )}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
        </div>

        {item.status === 'fail' && (
          <div className="text-xs space-y-0.5 text-slate-700 dark:text-slate-300">
            <div><span className="text-slate-500 dark:text-slate-400">Требуется:</span> {item.expected}</div>
            <div><span className="text-slate-500 dark:text-slate-400">У вас:</span> <span className="text-rose-600 dark:text-rose-300 font-medium">{item.actual}</span></div>
          </div>
        )}

        {item.status === 'unknown' && (
          <div className="text-xs space-y-0.5 text-slate-700 dark:text-slate-300">
            {isDeclared ? (
              <div className="text-rose-600 dark:text-rose-400 font-medium">
                Не удалось определить — засчитано как ошибка
              </div>
            ) : (
              <div className="text-slate-500 dark:text-slate-400">
                Не удалось определить параметр (вставьте HTML из Word/LibreOffice).
              </div>
            )}
            {item.expected && (
              <div><span className="text-slate-500 dark:text-slate-400">Требуется:</span> {item.expected}</div>
            )}
          </div>
        )}

        {item.hintPath && (
          <div className="text-[11px] text-amber-700 dark:text-amber-300/80 italic mt-1">
            💡 Ориентир: {item.hintPath}
          </div>
        )}
      </div>
    </div>
  );
}

const DEBUG_TASK13 = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV && import.meta.env.VITE_TASK13_DEBUG === '1';

const Task13Component: React.FC<{ taskData: Task13Data; state: TaskModuleState }> = ({ taskData, state }) => {
  const [showHighlight, setShowHighlight] = React.useState(true);
  const [rawHtml, setRawHtml] = React.useState<string>('');
  const [copiedDebug, setCopiedDebug] = React.useState(false);
  const pastedDoc = parseTask13Answer(state.userAnswer);
  const isParseFailed = pastedDoc?.parseFailed === true;
  const effectiveSpec = taskData.doc.spec || DEFAULT_SPEC;
  const report: Task13Report | null = state.isSubmitted && !isParseFailed
    ? checkTask13(taskData.doc, pastedDoc || defaultEmptyPasted, effectiveSpec)
    : null;

  // Построение карт ошибок и нумерации
  const failedItems = report ? report.items.filter(it => it.status === 'fail') : [];
  const noticeItems = report ? report.items.filter(it => it.status === 'ok' && it.marks && it.marks.length > 0) : [];
  const failIndexMap = new Map<string, number>();
  const wordMarksMap = new Map<string, MarkDetail>();
  const cellMarksMap = new Map<string, MarkDetail>();
  const paraMarksMap = new Map<number, number[]>();

  if (state.isSubmitted && report) {
    failedItems.forEach((item, idx) => {
      const errorNum = idx + 1;
      failIndexMap.set(item.id, errorNum);

      if (item.marks) {
        item.marks.forEach(m => {
          if (m.kind === 'word' && m.para !== undefined && m.word !== undefined) {
            const key = `${m.para}:${m.word}`;
            const existing = wordMarksMap.get(key) || { nums: [], punct: false };
            existing.nums.push(errorNum);
            if (m.punct) existing.punct = true;
            wordMarksMap.set(key, existing);
          } else if (m.kind === 'cell' && m.row !== undefined && m.col !== undefined) {
            const key = `${m.row}:${m.col}`;
            const existing = cellMarksMap.get(key) || { nums: [], punct: false };
            existing.nums.push(errorNum);
            if (m.punct) existing.punct = true;
            cellMarksMap.set(key, existing);
          } else if (m.kind === 'para' && m.para !== undefined) {
            const list = paraMarksMap.get(m.para) || [];
            list.push(errorNum);
            paraMarksMap.set(m.para, list);
          }
        });
      }
    });

    noticeItems.forEach(item => {
      if (item.marks) {
        item.marks.forEach(m => {
          if (m.kind === 'word' && m.para !== undefined && m.word !== undefined) {
            const key = `${m.para}:${m.word}`;
            const existing = wordMarksMap.get(key) || { nums: [], punct: false, isNotice: true };
            existing.isNotice = true;
            if (m.punct) existing.punct = true;
            wordMarksMap.set(key, existing);
          } else if (m.kind === 'cell' && m.row !== undefined && m.col !== undefined) {
            const key = `${m.row}:${m.col}`;
            const existing = cellMarksMap.get(key) || { nums: [], punct: false, isNotice: true };
            existing.isNotice = true;
            if (m.punct) existing.punct = true;
            cellMarksMap.set(key, existing);
          }
        });
      }
    });
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (state.isSubmitted) return;
    e.preventDefault();

    let htmlData = e.clipboardData.getData('text/html');
    setRawHtml(htmlData || '');
    if (!htmlData || !htmlData.trim()) {
      const textData = e.clipboardData.getData('text/plain');
      if (textData && textData.trim()) {
        htmlData = textData
          .trim()
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => `<p>${line.trim()}</p>`)
          .join('');
      }
    }

    if (!htmlData || !htmlData.trim()) return;

    const parsed = parsePastedHtml(htmlData);
    state.setUserAnswer(JSON.stringify(parsed));
  };

  const handleClear = () => {
    if (!state.isSubmitted) {
      state.setUserAnswer('');
      setRawHtml('');
    }
  };

  const debugParsed = pastedDoc
    ? {
        generator: pastedDoc.generator,
        fontSizes: pastedDoc.fontSizes,
        aligns: pastedDoc.aligns,
        indents: pastedDoc.indents,
        indentBySpaces: pastedDoc.indentBySpaces,
        hasLineBreaks: pastedDoc.hasLineBreaks,
        lineHeights: pastedDoc.lineHeights,
        paraGaps: pastedDoc.paraGaps,
        gapToTablePt: pastedDoc.gapToTablePt,
        emptyParaCount: pastedDoc.emptyParaCount,
        emptyParasBeforeTable: pastedDoc.emptyParasBeforeTable,
        tableAlign: pastedDoc.tableAlign,
        tableWidthRatio: pastedDoc.tableWidthRatio,
        table: pastedDoc.table
          ? {
              size: `${pastedDoc.table.rows.length}x${pastedDoc.table.rows[0]?.length || 0}`,
              rows: pastedDoc.table.rows.map(row =>
                row.map(cell => ({
                  colSpan: cell.colSpan,
                  rowSpan: cell.rowSpan,
                  align: cell.align
                }))
              )
            }
          : null
      }
    : null;

  const handleCopyDebug = () => {
    const taskDump = {
      seed: taskData.seed || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('seed') : null) || 'unknown',
      level: taskData.level || 'L1',
      requirements: effectiveSpec.requirements,
      targetText: taskData.doc.paragraphs,
      targetTable: taskData.doc.table
    };

    const currentReport = report || checkTask13(taskData.doc, pastedDoc || defaultEmptyPasted, effectiveSpec);

    const criteriaLines = currentReport.items.map(it =>
      `${it.id} | ${it.unit} | ${it.group} | ${it.status} | ${it.expected} | ${it.actual}`
    ).join('\n');

    const resultDump = [
      `Score: ${currentReport.score} / ${currentReport.maxScore}`,
      `Violations: text=${currentReport.vText === Infinity ? 'Infinity' : currentReport.vText}, table=${currentReport.vTable === Infinity ? 'Infinity' : currentReport.vTable}`,
      `Typos: text=${currentReport.typosText} (limit ${currentReport.limits.typosText}), table=${currentReport.typosTable} (limit ${currentReport.limits.typosTable})`,
      `\nCriteria (id | unit | group | status | expected | actual):`,
      criteriaLines
    ].join('\n');

    const debugText = [
      `Raw HTML length: ${rawHtml.length}`,
      `--- TASK ---\n${JSON.stringify(taskDump, null, 2)}`,
      `--- RAW HTML ---\n${rawHtml}`,
      `--- PARSED DOC (with text) ---\n${JSON.stringify(pastedDoc, null, 2)}`,
      `--- RESULT ---\n${resultDump}`
    ].join('\n\n');

    navigator.clipboard.writeText(debugText).then(() => {
      setCopiedDebug(true);
      setTimeout(() => setCopiedDebug(false), 2000);
    });
  };

  let statsStr = '';
  if (pastedDoc) {
    const numParas = pastedDoc.paragraphs.length;
    let tableStr = 'нет';
    if (pastedDoc.table && pastedDoc.table.rows.length > 0) {
      const r = pastedDoc.table.rows.length;
      let c = 0;
      pastedDoc.table.rows.forEach(row => {
        let rowCols = 0;
        row.forEach(cell => {
          rowCols += cell.colSpan || 1;
        });
        if (rowCols > c) c = rowCols;
      });
      tableStr = `${r}×${c}`;
    }

    let countB = 0;
    let countI = 0;
    let countU = 0;

    pastedDoc.paragraphs.forEach(p => {
      p.spans.forEach(s => {
        if (s.b) countB++;
        if (s.i) countI++;
        if (s.u) countU++;
      });
    });

    if (pastedDoc.table) {
      pastedDoc.table.rows.forEach(row => {
        row.forEach(cell => {
          cell.spans.forEach(s => {
            if (s.b) countB++;
            if (s.i) countI++;
            if (s.u) countU++;
          });
        });
      });
    }

    statsStr = `абзацев: ${numParas}, таблица: ${tableStr}, выделений: Ж:${countB} К:${countI} П:${countU}`;
  }

  const filteredUiItems = report ? filterCriteriaForUi(report.items) : [];
  const textItems = filteredUiItems.filter(it => it.group === 'text');
  const tableItems = filteredUiItems.filter(it => it.group === 'table');
  const textMatchItem = report ? report.items.find(it => it.id === 'textMatch') : null;
  const similarityMatch = textMatchItem?.actual.match(/(\d+)%/);
  const similarityPercent = similarityMatch ? parseInt(similarityMatch[1], 10) : 100;
  const showTextMatchWarning = similarityPercent < 95;
  const taskRequirements = generateTaskRequirements(effectiveSpec, taskData.doc);

  return (
    <div className="space-y-6">
      {/* БЛОК 1: ТЕКСТ ЗАДАНИЯ И ТРЕБОВАНИЯ */}
      <StatementBlock>
        <StatementText>
          Создайте в текстовом редакторе документ и напишите в нём следующий текст, точно воспроизведя всё оформление текста, имеющееся в образце.
        </StatementText>
        <ul className="list-disc list-inside space-y-1">
          {taskRequirements.map((req, idx) => (
            <li key={idx}>{req}</li>
          ))}
        </ul>
        <StatementNote className="text-xs">
          {formatTask13Preamble(taskData.doc)}
        </StatementNote>
      </StatementBlock>

      {/* БЛОК 2: ОБРАЗЕЦ ДОКУМЕНТА */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Образец оформления
        </div>
        <div
          className="bg-white rounded-lg border border-slate-300 shadow-md p-6 text-slate-900 font-serif select-none"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {taskData.doc.paragraphs.map((para, pIdx) => {
            const isHeading = taskData.doc.headingIndex !== undefined && taskData.doc.headingIndex !== null && pIdx === taskData.doc.headingIndex;
            if (isHeading) {
              return (
                <p
                  key={pIdx}
                  className="font-bold text-center"
                  style={{
                    textIndent: `${effectiveSpec.requirements.heading.indentCm}cm`,
                    fontSize: `${effectiveSpec.requirements.fontSize.pt}pt`,
                    marginBottom: `${effectiveSpec.requirements.heading.spacingPt}pt`,
                    lineHeight: 1.15
                  }}
                >
                  {renderSpans(para.spans)}
                </p>
              );
            }
            return (
              <p
                key={pIdx}
                className={`mb-3 ${effectiveSpec.requirements.bodyAlign.align === 'justify' ? 'text-justify' : 'text-left'}`}
                style={{
                  textIndent: `${effectiveSpec.requirements.indent.cm}cm`,
                  fontSize: `${effectiveSpec.requirements.fontSize.pt}pt`,
                  lineHeight: 1.15
                }}
              >
                {renderSpans(para.spans)}
              </p>
            );
          })}
          {renderDocTable(taskData.doc.table, effectiveSpec)}
        </div>
      </div>

      {/* БЛОК 3: ЗОНА ВСТАВКИ И ПРЕВЬЮ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ваш документ
          </div>
          <div className="flex items-center gap-4">
            {state.isSubmitted && (failedItems.length > 0 || noticeItems.length > 0) && (
              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showHighlight}
                  onChange={e => setShowHighlight(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Показать подсветку ошибок
              </label>
            )}
            {pastedDoc && !state.isSubmitted && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Очистить
              </button>
            )}
          </div>
        </div>

        <div
          tabIndex={state.isSubmitted ? -1 : 0}
          onPaste={handlePaste}
          className={`p-6 border-2 border-dashed rounded-lg transition-colors focus:outline-none min-h-[160px] ${
            isParseFailed
              ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
              : pastedDoc
              ? 'border-emerald-500/50 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-emerald-500/50 focus:border-emerald-500'
          }`}
        >
          {isParseFailed ? (
            <div className="flex flex-col items-center justify-center h-28 text-center text-rose-600 dark:text-rose-400 space-y-1">
              <span className="font-semibold text-sm">
                ⚠️ Не удалось разобрать вставленный фрагмент
              </span>
              <span className="text-xs text-rose-500 dark:text-rose-400/80">
                Попробуйте скопировать и вставить документ повторно из текстового редактора
              </span>
            </div>
          ) : pastedDoc ? (
            <div className="font-serif">
              {pastedDoc.paragraphs.map((para, pIdx) => {
                const fs = pastedDoc.fontSizes[pIdx];
                const align = pastedDoc.aligns[pIdx];
                const indent = pastedDoc.indents[pIdx];
                const paraErrors = paraMarksMap.get(pIdx);
                const isParaError = showHighlight && paraErrors && paraErrors.length > 0;

                return (
                  <div key={pIdx} className="relative mb-3">
                    {isParaError && (
                      <div className="inline-block mb-1">
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900 border border-rose-300 dark:border-rose-700 rounded px-1.5 py-0.5 mr-1.5 shadow-sm">
                          № {paraErrors.join(',')}
                        </span>
                      </div>
                    )}
                    <p
                      className="leading-relaxed"
                      style={{
                        fontSize: fs ? `${fs}pt` : undefined,
                        textAlign: (align as any) || undefined,
                        textIndent: indent !== null ? `${indent}cm` : undefined
                      }}
                    >
                      {renderPastedSpans(para.spans, pIdx, wordMarksMap, showHighlight)}
                    </p>
                  </div>
                );
              })}
              {renderPastedDocTable(pastedDoc.table, cellMarksMap, showHighlight)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 text-center text-slate-500 text-sm">
              <span className="font-medium">
                Нажмите сюда и вставьте (Ctrl+V) документ из редактора
              </span>
              <span className="text-xs text-slate-400 mt-1">
                (MS Word, LibreOffice, Google Docs и др.)
              </span>
            </div>
          )}
        </div>

        {statsStr && (
          <div className="text-xs font-mono text-slate-500 text-right">
            {statsStr}
          </div>
        )}

        {/* ВРЕМЕННЫЙ ОТЛАДОЧНЫЙ БЛОК */}
        {DEBUG_TASK13 && pastedDoc && (
          <details className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-mono space-y-3">
            <summary className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              Отладка (временно) — длина raw HTML: {rawHtml.length} символов
            </summary>
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-sans">
                  Сырой HTML:
                </span>
                <button
                  type="button"
                  onClick={handleCopyDebug}
                  className="px-2.5 py-1 text-xs font-sans font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors shadow-sm"
                >
                  {copiedDebug ? '✓ Скопировано!' : 'Скопировать отладку в буфер'}
                </button>
              </div>
              <textarea
                readOnly
                value={rawHtml}
                rows={6}
                className="w-full p-2 text-[11px] font-mono rounded bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-all"
                placeholder="Сырой HTML появится при вставке…"
              />
              <div className="text-slate-500 font-sans mt-2">
                Разобранные свойства документа (без текста):
              </div>
              <pre className="p-2 text-[11px] rounded bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-x-auto max-h-64">
                {JSON.stringify(debugParsed, null, 2)}
              </pre>
            </div>
          </details>
        )}

        {/* НУМЕРОВАННЫЙ СПИСОК ОШИБОК И ЗАМЕЧАНИЯ ПОД ПРЕВЬЮ */}
        {state.isSubmitted && (failedItems.length > 0 || noticeItems.length > 0) && (
          <div className="mt-4 space-y-3">
            {failedItems.length > 0 && (
              <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-sm space-y-2">
                <div className="font-semibold text-rose-900 dark:text-rose-200">
                  Список ошибок ({failedItems.length}):
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-800 dark:text-slate-200 text-xs">
                  {failedItems.map((item, idx) => (
                    <li key={item.id} className="leading-relaxed">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
                      {' — '}
                      <span className="text-slate-500 dark:text-slate-400">требуется:</span> {item.expected}
                      {', '}
                      <span className="text-slate-500 dark:text-slate-400">у вас:</span>{' '}
                      <span className="text-rose-600 dark:text-rose-300 font-medium">{item.actual}</span>
                      {item.hintPath && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-300/80 italic ml-4 mt-0.5">
                          💡 {item.hintPath}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {noticeItems.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-sm space-y-1.5">
                <div className="font-semibold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                  <span>ℹ️</span>
                  <span>Замечания (в пределах нормы, не снижают балл):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-800 dark:text-slate-200 text-xs">
                  {noticeItems.map(item => (
                    <li key={item.id} className="leading-relaxed">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{item.label}</span>
                      {' — '}
                      <span className="text-amber-800 dark:text-amber-300 font-medium">{item.actual}</span>
                      {' '}
                      <span className="text-slate-500 dark:text-slate-400">({item.expected})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* БЛОК 4: РЕЗУЛЬТАТ ПРОВЕРКИ КРИТЕРИЕВ */}
      {state.isSubmitted && isParseFailed && (
        <div className="mt-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200 space-y-2">
          <div className="font-semibold text-base flex items-center gap-2">
            <span>⚠️</span>
            <span>Не удалось разобрать вставленный фрагмент</span>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
            Структура вставленного текста не распознана или повреждена при вставке. Проверка критериев и таблицы не проводилась. Скопируйте документ из текстового редактора и вставьте снова.
          </p>
        </div>
      )}

      {state.isSubmitted && !isParseFailed && report && (
        <div className="mt-6 p-4 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Результат проверки:</span>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Балл: <span className={report.score === 2 ? 'text-emerald-600 dark:text-emerald-400' : report.score === 1 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}>{report.score}</span> из {report.maxScore}
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 font-mono">
              нарушений: текст {report.vText === Infinity ? '∞' : report.vText}, таблица {report.vTable === Infinity ? '∞' : report.vTable}; опечаток: текст {report.typosText} (лимит {report.limits.typosText}), таблица {report.typosTable} (лимит {report.limits.typosTable})
            </div>
          </div>

          <div className="space-y-4">
            {showTextMatchWarning && textMatchItem && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-md text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
                <span>⚠️ <strong>{textMatchItem.label}:</strong> {textMatchItem.actual} (рекомендуется вставить текст из условия задания)</span>
              </div>
            )}

            {report.items.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 italic p-3 text-center">
                Ответ не вставлен
              </div>
            ) : (
              <>
                {textItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Основной текст
                    </div>
                    {textItems.map(item => (
                      <CritItemRow
                        key={item.id}
                        item={item}
                        failNum={failIndexMap.get(item.id)}
                      />
                    ))}
                  </div>
                )}

                {tableItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Таблица
                    </div>
                    {tableItems.map(item => (
                      <CritItemRow
                        key={item.id}
                        item={item}
                        failNum={failIndexMap.get(item.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ПОДСКАЗКА ПО ПРИНЦИПАМ */}
      {state.showHints && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-sm rounded-lg text-amber-800 dark:text-amber-200 space-y-1">
          <strong>Подсказка по оформлению:</strong>
          <ul className="list-disc list-inside space-y-1 text-xs mt-1">
            <li>Отступ первой строки и выравнивание текста должны быть заданы в свойствах абзаца редактора, а не с помощью пробелов или переносов строк.</li>
            <li>В тексте обязательно должны присутствовать все три начертания: полужирный, курсив и подчёркнутый.</li>
            <li>В таблице проверяется точное совпадение количества строк, столбцов, заголовков и выравнивания.</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export const task13: TaskModule = {
  id: 13,
  title: 'Создание текстового документа',
  description: 'Проверка правил форматирования текста и таблиц в текстовом редакторе.',
  topics: ['Текстовый редактор', 'Форматирование'], // TODO: уточнить формулировки
  maxPoints: 2,

  generate: (difficulty: Difficulty, rng) => {
    return generateTask13(rng, difficulty);
  },

  render: (taskData: Task13Data, state: TaskModuleState) => {
    return <Task13Component taskData={taskData} state={state} />;
  },

  check: (taskData: Task13Data, userAnswer: string) => {
    const pasted = parseTask13Answer(userAnswer) || defaultEmptyPasted;
    const report = checkTask13(taskData.doc, pasted, taskData.doc.spec || DEFAULT_SPEC);
    return report.score === 2;
  },

  checkScore: (taskData: Task13Data, userAnswer: string) => {
    const pasted = parseTask13Answer(userAnswer) || defaultEmptyPasted;
    const report = checkTask13(taskData.doc, pasted, taskData.doc.spec || DEFAULT_SPEC);
    return { score: report.score, maxScore: report.maxScore };
  }
};

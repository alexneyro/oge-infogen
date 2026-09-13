import { Doc, Cell } from './parse';
import { TaskSpec, DEFAULT_SPEC, formatRuNumber, pluralizeRu, getAlignNameRu, alignLabel, valignLabel, tableWidthExpectedText, describeCellAlignments, describeCellValignments, tableWidth } from './spec';
import { hasMergedCells } from './table-utils';
import { PastedDoc } from './html';
import {
  fontSizeRequirement,
  tableSizeRequirement,
  paraSpacingRequirement,
  indentRequirement,
  lineSpacingRequirement,
  bodyAlignRequirement,
  gapToTableRequirement,
  tableWidthRequirement,
  buildDisplayErrors,
  TASK13_REQUIREMENTS_POLICY
} from './registry';

export type CritStatus = 'ok' | 'fail' | 'unknown';

export interface MarkLocation {
  kind: 'word' | 'cell' | 'para';
  para?: number;
  word?: number;
  row?: number;
  col?: number;
  punct?: boolean;
}

export interface CritResult {
  id: string;
  label: string;
  status: CritStatus;
  unknownReason?: 'blocked' | 'unparsed';
  expected: string;
  actual: string;
  group: 'text' | 'table' | 'info';
  unit: string;        // нарушения считаются по уникальным unit, не по строкам
  hintPath?: string;   // ориентир в редакторе
  marks?: MarkLocation[];
}

export interface Task13Report {
  items: CritResult[];
  displayErrors: CritResult[];
  limits: { typosText: number; typosTable: number };
  typosText: number;
  typosTable: number;
  paraCountMismatch?: boolean;
  vText: number;
  vTable: number;
  score: number;
  maxScore: 2;
}

export function describeExpectedBoldCells(docTable: Doc['table']): string {
  if (!docTable || !docTable.rows || docTable.rows.length === 0) return 'полужирный шрифт в ячейках таблицы';
  let allRow0Bold = true;
  let row0HasCells = false;
  let otherRowsHaveBold = false;

  docTable.rows.forEach((r, rIdx) => {
    r.forEach(cell => {
      const isBold = (cell.spans || []).filter(s => s.text.trim().length > 0).every(s => s.b);
      if (rIdx === 0) {
        row0HasCells = true;
        if (!isBold) allRow0Bold = false;
      } else {
        if (isBold) otherRowsHaveBold = true;
      }
    });
  });

  if (row0HasCells && allRow0Bold && !otherRowsHaveBold) {
    return 'первая строка таблицы (шапка)';
  }

  const boldCellsList: string[] = [];
  docTable.rows.forEach((r, rIdx) => {
    const rowBoldCells: string[] = [];
    r.forEach((cell, cIdx) => {
      const spans = (cell.spans || []).filter(s => s.text.trim().length > 0);
      if (spans.length > 0 && spans.every(s => s.b)) {
        const text = spans.map(s => s.text).join('').trim();
        const short = text.length > 20 ? text.slice(0, 18) + '…' : text;
        rowBoldCells.push(short ? `«${short}»` : `ячейка [${rIdx + 1},${cIdx + 1}]`);
      }
    });
    if (rowBoldCells.length === r.length && r.length > 1) {
      boldCellsList.push(`строка ${rIdx + 1}`);
    } else if (rowBoldCells.length > 0) {
      boldCellsList.push(rowBoldCells.join(', '));
    }
  });

  return boldCellsList.length > 0 ? boldCellsList.join('; ') : 'полужирные ячейки таблицы';
}

export function describeMerges(table: Doc['table']): string {
  if (!table || !table.rows || table.rows.length === 0) return 'объединения по образцу';

  const numRows = table.rows.length;
  const occupied: boolean[][] = Array.from({ length: numRows + 10 }, () => []);

  const detailedParts: string[] = [];
  const compactParts: string[] = [];

  table.rows.forEach((row, rIdx) => {
    let colIdx = 0;
    row.forEach(cell => {
      while (occupied[rIdx][colIdx]) {
        colIdx++;
      }
      const colSpan = cell.colSpan || 1;
      const rowSpan = cell.rowSpan || 1;

      for (let dr = 0; dr < rowSpan; dr++) {
        for (let dc = 0; dc < colSpan; dc++) {
          occupied[rIdx + dr][colIdx + dc] = true;
        }
      }

      const startRow = rIdx + 1;
      const endRow = rIdx + rowSpan;
      const startCol = colIdx + 1;
      const endCol = colIdx + colSpan;

      if (colSpan > 1 && rowSpan === 1) {
        detailedParts.push(`строка ${startRow}: объединены столбцы ${startCol}–${endCol}`);
        compactParts.push(`строка ${startRow}: столбцы ${startCol}–${endCol}`);
      } else if (rowSpan > 1 && colSpan === 1) {
        detailedParts.push(`столбец ${startCol}: строки ${startRow}–${endRow} объединены по вертикали`);
        compactParts.push(`столбец ${startCol}: строки ${startRow}–${endRow}`);
      } else if (colSpan > 1 && rowSpan > 1) {
        detailedParts.push(`строки ${startRow}–${endRow}, столбцы ${startCol}–${endCol} объединены`);
        compactParts.push(`строки ${startRow}–${endRow}, столбцы ${startCol}–${endCol}`);
      }

      colIdx += colSpan;
    });
  });

  if (detailedParts.length === 0) return 'объединения по образцу';
  const full = detailedParts.join('; ');
  if (full.length <= 120) {
    return full;
  }
  const compact = compactParts.join('; ');
  return compact.length <= 120 ? compact : compact.slice(0, 117) + '…';
}

export function isCritError(it: CritResult): boolean {
  if (it.status === 'fail') return true;
  if (it.status === 'unknown') {
    return it.unknownReason !== 'blocked';
  }
  return false;
}

export function computeScore(
  displayErrors: CritResult[],
  typosText: number,
  typosTable: number,
  hasParagraphs: boolean,
  pastedHasTable: boolean,
  docHasTable: boolean = true,
  typosTextLimit: number = 5,
  typosTableLimit: number = 3
): { score: number; vText: number; vTable: number } {
  const policyMap = new Map<string, string>();
  TASK13_REQUIREMENTS_POLICY.forEach(p => policyMap.set(p.id, p.declare));

  const textFailUnits = new Set<string>();
  displayErrors.forEach(it => {
    const declare = policyMap.get(it.id);
    if (declare === 'none') return;
    const isFailed = it.status === 'fail' || (declare === 'text' && isCritError(it));
    if (it.group === 'text' && isFailed) {
      if (it.unit === 'typosText') {
        if (typosText > typosTextLimit) {
          textFailUnits.add(it.unit);
        }
      } else {
        textFailUnits.add(it.unit);
      }
    }
  });

  const tableFailUnits = new Set<string>();
  displayErrors.forEach(it => {
    const declare = policyMap.get(it.id);
    if (declare === 'none') return;
    const isFailed = it.status === 'fail' || (declare === 'text' && isCritError(it));
    if (it.group === 'table' && isFailed) {
      if (it.unit === 'typosTable') {
        if (typosTable > typosTableLimit) {
          tableFailUnits.add(it.unit);
        }
      } else {
        tableFailUnits.add(it.unit);
      }
    }
  });

  const vText = !hasParagraphs ? Math.max(1, textFailUnits.size) : textFailUnits.size;
  const vTable = !docHasTable ? 0 : (!pastedHasTable ? Math.max(1, tableFailUnits.size) : tableFailUnits.size);

  let score = 0;
  if (vText === 0 && vTable === 0) {
    score = 2;
  } else if (vText === 0 || vTable === 0) {
    score = 1;
  } else {
    score = 0;
  }

  return { score, vText, vTable };
}

export const SUP_CHARS = /[\u00B9\u00B2\u00B3]/;
export const SUB_CHARS = /[\u2080-\u2089]/;
export const IDX_MAP: Record<string, string> = {
  '\u00B9': '1', '\u00B2': '2', '\u00B3': '3',
  '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3', '\u2084': '4',
  '\u2085': '5', '\u2086': '6', '\u2087': '7', '\u2088': '8', '\u2089': '9'
};

export const normText = (s: string) =>
  s.replace(/[\u00B9\u00B2\u00B3\u2080-\u2089]/g, ch => IDX_MAP[ch] || ch)
   .replace(/[\u00A0\u202F]/g, ' ').replace(/[«»""“”„‘’]/g, '"').replace(/[–—]/g, '-')
   .replace(/ё/g, 'е').replace(/Ё/g, 'е')
   .replace(/\s+/g, ' ').trim().toLowerCase();

export const normPunct = (s: string) =>
  s.replace(/[\u00A0\u202F]/g, ' ').replace(/[«»""“”„‘’]/g, '"').replace(/[–—]/g, '-')
   .replace(/\s+/g, '').trim().toLowerCase();

export const PUNCT_NAMES: Record<string, string> = {
  '.': 'точка', ',': 'запятая', ':': 'двоеточие', ';': 'точка с запятой',
  '-': 'тире', '"': 'кавычка', '(': 'скобка', ')': 'скобка',
  '!': 'восклицательный знак', '?': 'вопросительный знак',
  '…': 'многоточие', '/': 'дробь', '%': 'процент', '№': 'номер'
};
export const punctName = (ch: string) => PUNCT_NAMES[ch] || `«${ch}»`;

export function getPunctDiff(tPunct: string, pPunct: string): { missing: string[]; extra: string[] } {
  const normT = normPunct(tPunct);
  const normP = normPunct(pPunct);

  const tCounts = new Map<string, number>();
  for (const ch of normT) {
    tCounts.set(ch, (tCounts.get(ch) || 0) + 1);
  }

  const pCounts = new Map<string, number>();
  for (const ch of normP) {
    pCounts.set(ch, (pCounts.get(ch) || 0) + 1);
  }

  const missing: string[] = [];
  const extra: string[] = [];

  tCounts.forEach((cnt, ch) => {
    const pCnt = pCounts.get(ch) || 0;
    if (cnt > pCnt) {
      for (let k = 0; k < cnt - pCnt; k++) missing.push(ch);
    }
  });

  pCounts.forEach((cnt, ch) => {
    const tCnt = tCounts.get(ch) || 0;
    if (cnt > tCnt) {
      for (let k = 0; k < cnt - tCnt; k++) extra.push(ch);
    }
  });

  return { missing, extra };
}

export function formatPunctDetails(missing: string[], extra: string[]): string {
  const parts: string[] = [];
  if (missing.length > 0) {
    const list = missing.slice(0, 3).join(', ');
    const more = missing.length > 3 ? ` и ещё ${missing.length - 3}` : '';
    parts.push(`пропущено: ${list}${more}`);
  }
  if (extra.length > 0) {
    const list = extra.slice(0, 3).join(', ');
    const more = extra.length > 3 ? ` и ещё ${extra.length - 3}` : '';
    parts.push(`лишнее: ${list}${more}`);
  }
  return parts.join('; ');
}

export const fullText = (paras: string[]) => normText(paras.join(' '));

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  if (an > 4000 || bn > 4000) {
    return Math.max(an, bn);
  }

  const minLen = Math.min(an, bn);
  const maxLen = Math.max(an, bn);
  if (minLen / maxLen < 0.5) {
    return maxLen;
  }

  const s1 = a;
  const s2 = b;
  const n = s1.length;
  const m = s2.length;
  if (n === 0) return m;
  if (m === 0) return n;

  // Make str1 the shorter string to use O(min(n, m)) memory
  let str1 = s1;
  let str2 = s2;
  if (n > m) {
    str1 = s2;
    str2 = s1;
  }

  const l1 = str1.length;
  const l2 = str2.length;

  let prev = new Array(l1 + 1);
  let curr = new Array(l1 + 1);

  for (let j = 0; j <= l1; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= l2; i++) {
    curr[0] = i;
    const c2 = str2.charCodeAt(i - 1);
    for (let j = 1; j <= l1; j++) {
      const cost = str1.charCodeAt(j - 1) === c2 ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // deletion
        curr[j - 1] + 1,    // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    const temp = prev;
    prev = curr;
    curr = temp;
  }

  return prev[l1];
}

function formatFragmentList(missing: string[], extra: string[]): string {
  const formatFrag = (f: string) => (f.length > 30 ? f.slice(0, 30) + '…' : f);
  const missingStr =
    missing.length > 0
      ? `пропущено: ${missing
          .slice(0, 3)
          .map(w => `"${formatFrag(w)}"`)
          .join(', ')}${missing.length > 3 ? ' и др.' : ''}`
      : '';
  const extraStr =
    extra.length > 0
      ? `лишнее: ${extra
          .slice(0, 3)
          .map(w => `"${formatFrag(w)}"`)
          .join(', ')}${extra.length > 3 ? ' и др.' : ''}`
      : '';
  let actualStr = [missingStr, extraStr].filter(Boolean).join('; ');
  if (actualStr.length > 150) {
    actualStr = actualStr.slice(0, 147) + '...';
  }
  return actualStr;
}

export function getDocFragments(doc: Doc, styleKey: 'b' | 'i' | 'u' | 'sup' | 'sub'): string[] {
  const frags: string[] = [];
  (doc.paragraphs || []).forEach(p => {
    (p.spans || []).forEach(s => {
      const isStyled = styleKey === 'sup'
        ? (!!s.sup || SUP_CHARS.test(s.text))
        : styleKey === 'sub'
        ? (!!s.sub || SUB_CHARS.test(s.text))
        : !!s[styleKey];
      if (isStyled) {
        const txt = normText(s.text);
        if (txt) frags.push(txt);
      }
    });
  });
  return frags.sort();
}

export function getPastedFragments(pasted: PastedDoc, styleKey: 'b' | 'i' | 'u' | 'sup' | 'sub'): string[] {
  const frags: string[] = [];
  if (styleKey === 'b' && pasted.boldFragments && pasted.boldFragments.length > 0) {
    return [...pasted.boldFragments].map(normText).filter(Boolean).sort();
  }
  if (styleKey === 'i' && pasted.italicFragments && pasted.italicFragments.length > 0) {
    return [...pasted.italicFragments].map(normText).filter(Boolean).sort();
  }
  if (styleKey === 'u' && pasted.underlineFragments && pasted.underlineFragments.length > 0) {
    return [...pasted.underlineFragments].map(normText).filter(Boolean).sort();
  }
  (pasted.paragraphs || []).forEach(p => {
    (p.spans || []).forEach(s => {
      const isStyled = styleKey === 'sup'
        ? (!!s.sup || SUP_CHARS.test(s.text))
        : styleKey === 'sub'
        ? (!!s.sub || SUB_CHARS.test(s.text))
        : !!s[styleKey as 'b' | 'i' | 'u'];
      if (isStyled) {
        const txt = normText(s.text);
        if (txt) frags.push(txt);
      }
    });
  });
  return frags.sort();
}

interface WordToken {
  text: string;
  cleanText: string;
  lead: string;
  trail: string;
  b: boolean;
  i: boolean;
  u: boolean;
  sup: boolean;
  sub?: boolean;
  paraIdx: number;
  wordIdx: number;
  rowIdx?: number;
  colIdx?: number;
}

function cleanWord(str: string): string {
  let s = str
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/[«»""“”„‘’]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/ё/g, 'е')
    .replace(/Ё/g, 'Е');
  s = s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  return s;
}

function getTextWords(docOrPasted: Doc | PastedDoc): WordToken[] {
  const words: WordToken[] = [];
  (docOrPasted.paragraphs || []).forEach((p, pIdx) => {
    let wordIdxInPara = 0;
    let pendingLead = '';
    let prevSpanEndedWithSpace = true;

    (p.spans || []).forEach(s => {
      let text = s.text;
      if (!text) return;

      if (!prevSpanEndedWithSpace && !/^\s/.test(text) && words.length > 0 && words[words.length - 1].paraIdx === pIdx) {
        const leadPunctMatch = text.match(/^[^\p{L}\p{N}\s]+/u);
        if (leadPunctMatch) {
          words[words.length - 1].trail += leadPunctMatch[0];
          text = text.slice(leadPunctMatch[0].length);
        }
      }

      const parts = text.split(/\s+/);
      parts.forEach(part => {
        if (!part) return;
        const clean = cleanWord(part);
        if (clean) {
          const leadMatch = part.match(/^[^\p{L}\p{N}]+/u)?.[0] || '';
          const trailMatch = part.match(/[^\p{L}\p{N}]+$/u)?.[0] || '';
          words.push({
            text: part,
            cleanText: clean,
            lead: pendingLead + leadMatch,
            trail: trailMatch,
            b: !!s.b,
            i: !!s.i,
            u: !!s.u,
            sup: !!s.sup || SUP_CHARS.test(part),
            sub: !!s.sub || SUB_CHARS.test(part),
            paraIdx: pIdx,
            wordIdx: wordIdxInPara
          });
          wordIdxInPara++;
          pendingLead = '';
        } else {
          pendingLead += part;
        }
      });

      prevSpanEndedWithSpace = /\s$/.test(s.text);
    });

    if (pendingLead && words.length > 0 && words[words.length - 1].paraIdx === pIdx) {
      words[words.length - 1].trail += pendingLead;
    }
  });
  return words;
}

function getTableWords(docOrPasted: Doc | PastedDoc): WordToken[] {
  const words: WordToken[] = [];
  if (!docOrPasted.table || !docOrPasted.table.rows) return words;

  docOrPasted.table.rows.forEach((r, rIdx) => {
    r.forEach((cell, cIdx) => {
      let wordIdxInCell = 0;
      let pendingLead = '';
      let prevSpanEndedWithSpace = true;

      (cell.spans || []).forEach(s => {
        let text = s.text;
        if (!text) return;

        if (!prevSpanEndedWithSpace && !/^\s/.test(text) && words.length > 0 && words[words.length - 1].rowIdx === rIdx && words[words.length - 1].colIdx === cIdx) {
          const leadPunctMatch = text.match(/^[^\p{L}\p{N}\s]+/u);
          if (leadPunctMatch) {
            words[words.length - 1].trail += leadPunctMatch[0];
            text = text.slice(leadPunctMatch[0].length);
          }
        }

        const parts = text.split(/\s+/);
        parts.forEach(part => {
          if (!part) return;
          const clean = cleanWord(part);
          if (clean) {
            const leadMatch = part.match(/^[^\p{L}\p{N}]+/u)?.[0] || '';
            const trailMatch = part.match(/[^\p{L}\p{N}]+$/u)?.[0] || '';
            words.push({
              text: part,
              cleanText: clean,
              lead: pendingLead + leadMatch,
              trail: trailMatch,
              b: !!s.b,
              i: !!s.i,
              u: !!s.u,
              sup: !!s.sup || SUP_CHARS.test(part),
              sub: !!s.sub || SUB_CHARS.test(part),
              paraIdx: -1,
              wordIdx: wordIdxInCell,
              rowIdx: rIdx,
              colIdx: cIdx
            });
            wordIdxInCell++;
            pendingLead = '';
          } else {
            pendingLead += part;
          }
        });

        prevSpanEndedWithSpace = /\s$/.test(s.text);
      });
      if (pendingLead && words.length > 0 && words[words.length - 1].rowIdx === rIdx && words[words.length - 1].colIdx === cIdx) {
        words[words.length - 1].trail += pendingLead;
      }
    });
  });
  return words;
}

function alignWordsLCS(targetWords: WordToken[], pastedWords: WordToken[]): {
  matchedPairs: [number, number][];
  typos: number;
} {
  const N = targetWords.length;
  const M = pastedWords.length;

  if (N === 0 || M === 0) {
    return { matchedPairs: [], typos: Math.max(N, M) };
  }

  const LIMIT = 1000;
  const ratio = Math.min(N, M) / Math.max(N, M || 1);
  if (N > LIMIT || M > LIMIT || (Math.max(N, M) > 0 && ratio < 0.5)) {
    return { matchedPairs: [], typos: Math.max(N, M) };
  }

  const dp: number[][] = Array.from({ length: N + 1 }, () => Array(M + 1).fill(0));

  for (let i = 0; i <= N; i++) dp[i][0] = i;
  for (let j = 0; j <= M; j++) dp[0][j] = j;

  for (let i = 1; i <= N; i++) {
    for (let j = 1; j <= M; j++) {
      if (targetWords[i - 1].cleanText === pastedWords[j - 1].cleanText) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  let i = N;
  let j = M;
  const matchedPairs: [number, number][] = [];

  while (i > 0 && j > 0) {
    if (targetWords[i - 1].cleanText === pastedWords[j - 1].cleanText) {
      matchedPairs.push([i - 1, j - 1]);
      i--;
      j--;
    } else {
      const minCost = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      if (minCost === dp[i - 1][j - 1]) {
        i--;
        j--;
      } else if (minCost === dp[i - 1][j]) {
        i--;
      } else {
        j--;
      }
    }
  }

  matchedPairs.reverse();

  return {
    matchedPairs,
    typos: dp[N][M]
  };
}

export function checkTask13(doc: Doc, pasted: PastedDoc, customSpec?: TaskSpec): Task13Report {
  const spec: TaskSpec = customSpec || doc.spec || DEFAULT_SPEC;
  const req = spec.requirements;
  const items: CritResult[] = [];

  // --- 1. ГРУППА 'text' ---
  const pastedParaCount = (pasted.paragraphs || []).length;
  const docParaCount = doc.paragraphs.length;
  const paraCountMismatch = pastedParaCount !== docParaCount;
  const isParaCountOk = !paraCountMismatch;

  if (isParaCountOk) {
    items.push({
      id: 'paraCount',
      label: 'Структура текста (число абзацев)',
      status: 'ok',
      expected: `${docParaCount} ${pluralizeRu(docParaCount, 'абзац', 'абзаца', 'абзацев')} основного текста`,
      actual: `${pastedParaCount} ${pluralizeRu(pastedParaCount, 'абзац', 'абзаца', 'абзацев')}`,
      group: 'text',
      unit: 'nobreaks',
      hintPath: 'Сверьте разбиение текста на абзацы с образцом'
    });
  } else {
    const diff = pastedParaCount - docParaCount;
    const diffStr = diff > 0 ? `лишних ${diff}` : `не хватает ${Math.abs(diff)}`;
    items.push({
      id: 'paraCount',
      label: 'Структура текста (число абзацев)',
      status: 'fail',
      expected: `${docParaCount} ${pluralizeRu(docParaCount, 'абзац', 'абзаца', 'абзацев')} основного текста`,
      actual: `${pastedParaCount} — ${diffStr}`,
      group: 'text',
      unit: 'nobreaks',
      hintPath: 'Сверьте разбиение текста на абзацы с образцом'
    });
  }

  const emptyParaCount = pasted.emptyParaCount || 0;
  if (emptyParaCount > 0) {
    items.push({
      id: 'emptyParas',
      label: 'Пустые абзацы',
      status: 'fail',
      expected: 'интервал задан параметрами абзаца',
      actual: `вставлено пустых абзацев: ${emptyParaCount}`,
      group: 'text',
      unit: 'nobreaks',
      hintPath: 'Формат → Абзац → Отступы и интервалы'
    });
  } else {
    items.push({
      id: 'emptyParas',
      label: 'Пустые абзацы',
      status: 'ok',
      expected: 'интервал задан параметрами абзаца',
      actual: 'нет пустых абзацев',
      group: 'text',
      unit: 'nobreaks',
      hintPath: 'Формат → Абзац → Отступы и интервалы'
    });
  }

  const targetTextWords = getTextWords(doc);
  const pastedTextWords = getTextWords(pasted);
  const { matchedPairs: textMatchedPairs, typos: typosTextWords } = alignWordsLCS(targetTextWords, pastedTextWords);
  const targetHasHeading = doc.headingIndex !== undefined && doc.headingIndex !== null;

  // text similarity
  const docFull = fullText(doc.paragraphs.map(p => (p.spans || []).map(s => s.text).join('')));
  const pastedFull = fullText((pasted.paragraphs || []).map(p => (p.spans || []).map(s => s.text).join('')));
  const maxLen = Math.max(docFull.length, pastedFull.length);
  const dist = levenshtein(docFull, pastedFull);
  const similarity = maxLen === 0 ? 1 : 1 - dist / maxLen;

  items.push({
    id: 'textMatch',
    label: 'Соответствие текста образцу',
    status: 'ok',
    expected: 'текст по заданию',
    actual: `сходство ${Math.round(similarity * 100)}%`,
    group: 'info',
    unit: 'textMatch',
    hintPath: 'Вставьте текст, предложенный в условии задания'
  });

  // Подсчёт расхождений в знаках препинания
  let punctTypos = 0;
  const punctMismatchPastedIndices = new Set<number>();
  const punctMissing: string[] = [];
  const punctExtra: string[] = [];

  textMatchedPairs.forEach(([tIdx, pIdx]) => {
    const tw = targetTextWords[tIdx];
    const pw = pastedTextWords[pIdx];
    const leadMatch = normPunct(tw.lead) === normPunct(pw.lead);
    const trailMatch = normPunct(tw.trail) === normPunct(pw.trail);
    if (!leadMatch || !trailMatch) {
      punctTypos++;
      punctMismatchPastedIndices.add(pIdx);

      const wordStr = pw.cleanText.length > 30 ? pw.cleanText.slice(0, 30) + '…' : pw.cleanText;

      if (!leadMatch) {
        const { missing, extra } = getPunctDiff(tw.lead, pw.lead);
        missing.forEach(ch => punctMissing.push(`${punctName(ch)} перед «${wordStr}»`));
        extra.forEach(ch => punctExtra.push(`${punctName(ch)} перед «${wordStr}»`));
      }

      if (!trailMatch) {
        const { missing, extra } = getPunctDiff(tw.trail, pw.trail);
        missing.forEach(ch => punctMissing.push(`${punctName(ch)} после «${wordStr}»`));
        extra.forEach(ch => punctExtra.push(`${punctName(ch)} после «${wordStr}»`));
      }
    }
  });

  const typosText = typosTextWords + punctTypos;

  // font check (делегирование в реестр)
  if (req.fontSize.enabled) {
    items.push(fontSizeRequirement.check(req.fontSize, pasted, doc, spec.tolerances, spec));
  }

  // fontFamily (fontFamily)
  const knownBadFonts = ['comic sans', 'courier', 'consolas', 'monaco', 'monospace'];
  let fontFamilyFailed = false;
  const detectedFamilies: string[] = [];
  (pasted.paragraphs || []).forEach(p => {
    (p.spans || []).forEach(s => {
      if (s.fontFamily) {
        const famLower = s.fontFamily.toLowerCase();
        detectedFamilies.push(s.fontFamily);
        if (knownBadFonts.some(bf => famLower.includes(bf))) {
          fontFamilyFailed = true;
        }
      }
    });
  });

  if (fontFamilyFailed) {
    items.push({
      id: 'fontFamily',
      label: 'Гарнитура шрифта',
      status: 'fail',
      expected: 'стандартный шрифт с засечками или без (Times New Roman / Calibri)',
      actual: `недопустимый шрифт (${detectedFamilies[0]})`,
      group: 'info',
      unit: 'fontFamily',
      hintPath: 'Формат → Шрифт → Гарнитура'
    });
  } else {
    items.push({
      id: 'fontFamily',
      label: 'Гарнитура шрифта',
      status: 'ok',
      expected: 'стандартный шрифт с засечками или без (Times New Roman / Calibri)',
      actual: 'соответствует',
      group: 'info',
      unit: 'fontFamily',
      hintPath: 'Формат → Шрифт → Гарнитура'
    });
  }

  // bold / italic / underline (styles)
  if (req.emphasis.enabled) {
    const styleLabels = {
      b: { id: 'bold', label: 'Полужирное выделение', hint: 'Главная → Ж (Ctrl+B)' },
      i: { id: 'italic', label: 'Курсивное выделение', hint: 'Главная → К (Ctrl+I)' },
      u: { id: 'underline', label: 'Подчёркнутое выделение', hint: 'Главная → Ч (Ctrl+U)' }
    };

    const styleTypes: ('b' | 'i' | 'u')[] = [];
    if (req.emphasis.bold) styleTypes.push('b');
    if (req.emphasis.italic) styleTypes.push('i');
    if (req.emphasis.underline) styleTypes.push('u');

    const targetHasAnyStyles = targetTextWords.some(w => (req.emphasis.bold && w.b) || (req.emphasis.italic && w.i) || (req.emphasis.underline && w.u));

    if (targetHasAnyStyles) {
      styleTypes.forEach(styleKey => {
        const info = styleLabels[styleKey];
        const docFrags = getDocFragments(doc, styleKey);
        const pastedFrags = getPastedFragments(pasted, styleKey);

        if (docFrags.length === 0 && pastedFrags.length === 0) {
          return;
        }

        // Multi-set diff
        const docCounts = new Map<string, number>();
        docFrags.forEach(f => docCounts.set(f, (docCounts.get(f) || 0) + 1));
        const pastedCounts = new Map<string, number>();
        pastedFrags.forEach(f => pastedCounts.set(f, (pastedCounts.get(f) || 0) + 1));

        const missing: string[] = [];
        const extra: string[] = [];

        docCounts.forEach((cnt, f) => {
          const pCnt = pastedCounts.get(f) || 0;
          if (cnt > pCnt) {
            for (let k = 0; k < cnt - pCnt; k++) missing.push(f);
          }
        });

        pastedCounts.forEach((cnt, f) => {
          const dCnt = docCounts.get(f) || 0;
          if (cnt > dCnt) {
            for (let k = 0; k < cnt - dCnt; k++) extra.push(f);
          }
        });

        const marks: MarkLocation[] = [];
        (pasted.paragraphs || []).forEach((p, pIdx) => {
          let wIdx = 0;
          (p.spans || []).forEach(s => {
            const parts = s.text.split(/\s+/);
            parts.forEach(part => {
              if (!part) return;
              const cln = cleanWord(part);
              if (cln) {
                const normPart = normText(part);
                if (s[styleKey] && extra.includes(normPart)) {
                  marks.push({ kind: 'word', para: pIdx, word: wIdx });
                }
                wIdx++;
              }
            });
          });
        });

        if (missing.length === 0 && extra.length === 0) {
          items.push({
            id: info.id,
            label: info.label,
            status: 'ok',
            expected: `выделено фрагментов: ${docFrags.length}`,
            actual: 'совпадает',
            group: 'text',
            unit: 'emphasis',
            hintPath: info.hint
          });
        } else {
          const actualStr = formatFragmentList(missing, extra);

          items.push({
            id: info.id,
            label: info.label,
            status: 'fail',
            expected: `выделено фрагментов: ${docFrags.length}`,
            actual: actualStr,
            group: 'text',
            unit: 'emphasis',
            hintPath: info.hint,
            marks
          });
        }
      });
    }
  }

  // plainBody (plainBody) — проверяем, что ни один абзац основного текста не выделен целиком
  // Заголовок в этой проверке не участвует
  const bodyStartIdxForPlain = (targetHasHeading && pasted.headingIndex !== null && pasted.headingIndex !== undefined)
    ? (pasted.headingIndex + 1)
    : 0;
  const entireStyleViolations: { paraNum: number; styleName: string; paraIdx: number }[] = [];

  (pasted.paragraphs || []).forEach((para, pIdx) => {
    if (pIdx < bodyStartIdxForPlain) return; // пропускаем заголовок

    const nonWhitespaceSpans = (para.spans || []).filter(s => s.text.trim().length > 0);
    if (nonWhitespaceSpans.length === 0) return;

    const allBold = nonWhitespaceSpans.every(s => s.b);
    const allItalic = nonWhitespaceSpans.every(s => s.i);
    const allUnderline = nonWhitespaceSpans.every(s => s.u);

    // Номер абзаца для пользователя: 1-indexed относительно основного текста
    const paraNum = pIdx - bodyStartIdxForPlain + 1;

    if (allBold) {
      entireStyleViolations.push({ paraNum, styleName: 'полужирным', paraIdx: pIdx });
    } else if (allItalic) {
      entireStyleViolations.push({ paraNum, styleName: 'курсивом', paraIdx: pIdx });
    } else if (allUnderline) {
      entireStyleViolations.push({ paraNum, styleName: 'подчёркиванием', paraIdx: pIdx });
    }
  });

  if (entireStyleViolations.length === 0) {
    items.push({
      id: 'plainBody',
      label: 'Прямой шрифт без начертаний в тексте',
      status: 'ok',
      expected: 'основной текст обычного начертания (без целиком выделенных абзацев)',
      actual: 'основной текст обычного начертания',
      group: 'text',
      unit: 'plainBody',
      hintPath: 'Формат → Очистить форматирование'
    });
  } else {
    const violationDescriptions = entireStyleViolations.map(v => `абзац ${v.paraNum} выделен целиком ${v.styleName}`).join(', ');
    const marks: MarkLocation[] = entireStyleViolations.map(v => ({ kind: 'para', para: v.paraIdx }));
    items.push({
      id: 'plainBody',
      label: 'Прямой шрифт без начертаний в тексте',
      status: 'fail',
      expected: 'основной текст обычного начертания (без целиком выделенных абзацев)',
      actual: violationDescriptions,
      group: 'text',
      unit: 'plainBody',
      hintPath: 'Формат → Очистить форматирование',
      marks
    });
  }

  // supText (supText) - только если в эталоне текста есть верхний индекс
  const targetTextHasSup = targetTextWords.some(w => w.sup);
  if (targetTextHasSup) {
    const docFrags = getDocFragments(doc, 'sup');
    const pastedFrags = getPastedFragments(pasted, 'sup');

    // Multi-set diff
    const docCounts = new Map<string, number>();
    docFrags.forEach(f => docCounts.set(f, (docCounts.get(f) || 0) + 1));
    const pastedCounts = new Map<string, number>();
    pastedFrags.forEach(f => pastedCounts.set(f, (pastedCounts.get(f) || 0) + 1));

    const missing: string[] = [];
    const extra: string[] = [];

    docCounts.forEach((cnt, f) => {
      const pCnt = pastedCounts.get(f) || 0;
      if (cnt > pCnt) {
        for (let k = 0; k < cnt - pCnt; k++) missing.push(f);
      }
    });

    pastedCounts.forEach((cnt, f) => {
      const dCnt = docCounts.get(f) || 0;
      if (cnt > dCnt) {
        for (let k = 0; k < cnt - dCnt; k++) extra.push(f);
      }
    });

    const supMarks: MarkLocation[] = [];
    (pasted.paragraphs || []).forEach((p, pIdx) => {
      let wIdx = 0;
      (p.spans || []).forEach(s => {
        const parts = s.text.split(/\s+/);
        parts.forEach(part => {
          if (!part) return;
          const cln = cleanWord(part);
          if (cln) {
            const normPart = normText(part);
            const hasSup = s.sup || SUP_CHARS.test(part);
            if (hasSup && extra.includes(normPart)) {
              supMarks.push({ kind: 'word', para: pIdx, word: wIdx });
            }
            wIdx++;
          }
        });
      });
    });

    if (missing.length === 0 && extra.length === 0) {
      items.push({
        id: 'superscript',
        label: 'Верхний индекс в тексте',
        status: 'ok',
        expected: `выделено фрагментов: ${docFrags.length}`,
        actual: 'совпадает',
        group: 'text',
        unit: 'superscript',
        hintPath: 'Формат → Символ → Надстрочный (Ctrl+Shift+P)'
      });
    } else {
      const actualStr = formatFragmentList(missing, extra);

      items.push({
        id: 'superscript',
        label: 'Верхний индекс в тексте',
        status: 'fail',
        expected: `выделено фрагментов: ${docFrags.length}`,
        actual: actualStr,
        group: 'text',
        unit: 'superscript',
        hintPath: 'Формат → Символ → Надстрочный (Ctrl+Shift+P)',
        marks: supMarks
      });
    }
  }

  // subText (subscript) - только если в эталоне текста есть нижний индекс
  const targetTextHasSub = targetTextWords.some(w => w.sub);
  if (targetTextHasSub) {
    const docFrags = getDocFragments(doc, 'sub');
    const pastedFrags = getPastedFragments(pasted, 'sub');

    const docCounts = new Map<string, number>();
    docFrags.forEach(f => docCounts.set(f, (docCounts.get(f) || 0) + 1));
    const pastedCounts = new Map<string, number>();
    pastedFrags.forEach(f => pastedCounts.set(f, (pastedCounts.get(f) || 0) + 1));

    const missing: string[] = [];
    const extra: string[] = [];

    docCounts.forEach((cnt, f) => {
      const pCnt = pastedCounts.get(f) || 0;
      if (cnt > pCnt) {
        for (let k = 0; k < cnt - pCnt; k++) missing.push(f);
      }
    });

    pastedCounts.forEach((cnt, f) => {
      const dCnt = docCounts.get(f) || 0;
      if (cnt > dCnt) {
        for (let k = 0; k < cnt - dCnt; k++) extra.push(f);
      }
    });

    const subMarks: MarkLocation[] = [];
    (pasted.paragraphs || []).forEach((p, pIdx) => {
      let wIdx = 0;
      (p.spans || []).forEach(s => {
        const parts = s.text.split(/\s+/);
        parts.forEach(part => {
          if (!part) return;
          const cln = cleanWord(part);
          if (cln) {
            const normPart = normText(part);
            const hasSub = s.sub || SUB_CHARS.test(part);
            if (hasSub && extra.includes(normPart)) {
              subMarks.push({ kind: 'word', para: pIdx, word: wIdx });
            }
            wIdx++;
          }
        });
      });
    });

    if (missing.length === 0 && extra.length === 0) {
      items.push({
        id: 'subscript',
        label: 'Нижний индекс в тексте',
        status: 'ok',
        expected: `выделено фрагментов: ${docFrags.length}`,
        actual: 'совпадает',
        group: 'text',
        unit: 'subscript',
        hintPath: 'Формат → Символ → Подстрочный (Ctrl+Shift+B)'
      });
    } else {
      const actualStr = formatFragmentList(missing, extra);

      items.push({
        id: 'subscript',
        label: 'Нижний индекс в тексте',
        status: 'fail',
        expected: `выделено фрагментов: ${docFrags.length}`,
        actual: actualStr,
        group: 'text',
        unit: 'subscript',
        hintPath: 'Формат → Символ → Подстрочный (Ctrl+Shift+B)',
        marks: subMarks
      });
    }
  }

  // heading checks - только если в эталоне есть заголовок и требование включено
  if (req.heading.enabled && targetHasHeading) {
    const expHeadingAlignRu = alignLabel(req.heading.align);
    const expHeadingIndentStr = `${formatRuNumber(req.heading.indentCm)} см`;
    const expHeadingSpacingStr = `${formatRuNumber(req.heading.spacingPt)} пт`;

    // 1) headingAlign (headingAlign)
    const pHeadingAlign = (pasted.aligns && pasted.headingIndex !== null && pasted.headingIndex !== undefined)
      ? pasted.aligns[pasted.headingIndex]
      : (pasted.aligns && pasted.aligns.length > 0 ? pasted.aligns[0] : null);

    if (pHeadingAlign === null) {
      items.push({
        id: 'headingAlign',
        label: `Выравнивание заголовка ${expHeadingAlignRu}`,
        status: 'unknown',
        unknownReason: 'unparsed',
        expected: expHeadingAlignRu,
        actual: 'не удалось определить',
        group: 'text',
        unit: 'headingAlign',
        hintPath: `Формат → Абзац → Выравнивание (${expHeadingAlignRu})`
      });
    } else if (pHeadingAlign === req.heading.align) {
      items.push({
        id: 'headingAlign',
        label: `Выравнивание заголовка ${expHeadingAlignRu}`,
        status: 'ok',
        expected: expHeadingAlignRu,
        actual: expHeadingAlignRu,
        group: 'text',
        unit: 'headingAlign',
        hintPath: `Формат → Абзац → Выравнивание (${expHeadingAlignRu})`
      });
    } else {
      items.push({
        id: 'headingAlign',
        label: `Выравнивание заголовка ${expHeadingAlignRu}`,
        status: 'fail',
        expected: expHeadingAlignRu,
        actual: `выравнивание ${alignLabel(pHeadingAlign)}`,
        group: 'text',
        unit: 'headingAlign',
        hintPath: `Формат → Абзац → Выравнивание (${expHeadingAlignRu})`,
        marks: [{ kind: 'para', para: pasted.headingIndex ?? 0 }]
      });
    }

    // 2) headingIndent (headingIndent)
    const pHeadingIndentBySpaces = (pasted.indentBySpaces && pasted.headingIndex !== null && pasted.headingIndex !== undefined)
      ? pasted.indentBySpaces[pasted.headingIndex]
      : (pasted.indentBySpaces && pasted.indentBySpaces.length > 0 ? pasted.indentBySpaces[0] : false);

    const pHeadingIndent = (pasted.indents && pasted.headingIndex !== null && pasted.headingIndex !== undefined)
      ? pasted.indents[pasted.headingIndex]
      : (pasted.indents && pasted.indents.length > 0 ? pasted.indents[0] : null);

    if (pHeadingIndentBySpaces) {
      items.push({
        id: 'headingIndent',
        label: `Отступ первой строки заголовка (${expHeadingIndentStr})`,
        status: 'fail',
        expected: `${expHeadingIndentStr} (свойство абзаца)`,
        actual: 'отступ сделан пробелами/табуляцией',
        group: 'text',
        unit: 'headingIndent',
        hintPath: `Формат → Абзац → Отступы → Первая строка (${expHeadingIndentStr})`,
        marks: [{ kind: 'para', para: pasted.headingIndex ?? 0 }]
      });
    } else if (pHeadingIndent === null) {
      items.push({
        id: 'headingIndent',
        label: `Отступ первой строки заголовка (${expHeadingIndentStr})`,
        status: 'unknown',
        unknownReason: 'unparsed',
        expected: `${expHeadingIndentStr}`,
        actual: 'не удалось определить',
        group: 'text',
        unit: 'headingIndent',
        hintPath: `Формат → Абзац → Отступы → Первая строка (${expHeadingIndentStr})`
      });
    } else if (Math.abs(pHeadingIndent - req.heading.indentCm) > spec.tolerances.indentCm) {
      items.push({
        id: 'headingIndent',
        label: `Отступ первой строки заголовка (${expHeadingIndentStr})`,
        status: 'fail',
        expected: `${expHeadingIndentStr} (±${formatRuNumber(spec.tolerances.indentCm)} см)`,
        actual: `отступ ${formatRuNumber(pHeadingIndent)} см`,
        group: 'text',
        unit: 'headingIndent',
        hintPath: `Формат → Абзац → Отступы → Первая строка (${expHeadingIndentStr})`,
        marks: [{ kind: 'para', para: pasted.headingIndex ?? 0 }]
      });
    } else {
      items.push({
        id: 'headingIndent',
        label: `Отступ первой строки заголовка (${expHeadingIndentStr})`,
        status: 'ok',
        expected: `${expHeadingIndentStr}`,
        actual: `${formatRuNumber(pHeadingIndent)} см`,
        group: 'text',
        unit: 'headingIndent',
        hintPath: `Формат → Абзац → Отступы → Первая строка (${expHeadingIndentStr})`
      });
    }

    // 3) headingSpacing (headingSpacing) — интервал после заголовка
    const hIdx = (pasted.headingIndex !== null && pasted.headingIndex !== undefined) ? pasted.headingIndex : 0;
    const hGap = (pasted.paraGaps && pasted.paraGaps.length > hIdx) ? pasted.paraGaps[hIdx] : null;

    if (hGap === null) {
      items.push({
        id: 'headingSpacing',
        label: `Интервал после заголовка (${expHeadingSpacingStr})`,
        status: 'unknown',
        unknownReason: 'unparsed',
        expected: expHeadingSpacingStr,
        actual: 'не удалось определить',
        group: 'text',
        unit: 'headingSpacing',
        hintPath: `Формат → Абзац → Отступ после (${expHeadingSpacingStr})`
      });
    } else {
      const useSum = pasted.generator === 'libreoffice' || pasted.generator === 'word';
      const inHeadingRange = (v: number) => Math.abs(v - req.heading.spacingPt) <= spec.tolerances.pt;
      const eff = useSum ? hGap.sum : (inHeadingRange(hGap.sum) ? hGap.sum : hGap.max);
      const isHeadingSpacingOk = inHeadingRange(eff);

      if (!isHeadingSpacingOk) {
        items.push({
          id: 'headingSpacing',
          label: `Интервал после заголовка (${expHeadingSpacingStr})`,
          status: 'fail',
          expected: `${expHeadingSpacingStr} (±${formatRuNumber(spec.tolerances.pt)} пт)`,
          actual: `${Math.round(eff)} пт`,
          group: 'text',
          unit: 'headingSpacing',
          hintPath: `Формат → Абзац → Отступ после (${expHeadingSpacingStr})`,
          marks: [{ kind: 'para', para: hIdx }]
        });
      } else {
        items.push({
          id: 'headingSpacing',
          label: `Интервал после заголовка (${expHeadingSpacingStr})`,
          status: 'ok',
          expected: expHeadingSpacingStr,
          actual: `${Math.round(eff)} пт`,
          group: 'text',
          unit: 'headingSpacing',
          hintPath: `Формат → Абзац → Отступ после (${expHeadingSpacingStr})`
        });
      }
    }
  }

  // lineSpacing (делегирование в реестр)
  if (req.lineSpacing.enabled) {
    items.push(lineSpacingRequirement.check(req.lineSpacing, pasted, doc, spec.tolerances, spec));
  }

  // paraSpacing (делегирование в реестр)
  if (req.paraSpacing.enabled) {
    items.push(paraSpacingRequirement.check(req.paraSpacing, pasted, doc, spec.tolerances, spec));
  }

  // gapToTable (делегирование в реестр) - только если в задании есть таблица
  if (req.gapToTable.enabled && !!doc.table) {
    items.push(gapToTableRequirement.check(req.gapToTable, pasted, doc, spec.tolerances, spec));
  }

  // bodyAlign (делегирование в реестр)
  if (req.bodyAlign.enabled) {
    items.push(bodyAlignRequirement.check(req.bodyAlign, pasted, doc, spec.tolerances, spec));
  }

  // indent & indentBySpaces (делегирование в реестр)
  if (req.indent.enabled) {
    items.push(indentRequirement.check(req.indent, pasted, doc, spec.tolerances, spec));
  }

  // nobreaks (nobreaks) — в основном тексте не должно быть <br>
  const hasLineBreaks = (pasted.hasLineBreaks || []).some(b => b);
  if (hasLineBreaks) {
    const badParas: MarkLocation[] = [];
    (pasted.hasLineBreaks || []).forEach((b, idx) => {
      if (b) badParas.push({ kind: 'para', para: idx });
    });
    items.push({
      id: 'nobreaks',
      label: 'Отсутствие разрывов строк <br> в тексте',
      status: 'fail',
      expected: 'без разрывов строк <br> в тексте',
      actual: 'есть принудительные переносы <br>',
      group: 'text',
      unit: 'nobreaks',
      hintPath: 'Абзацы не должны разделяться разрывами строк (Shift+Enter)',
      marks: badParas
    });
  } else {
    items.push({
      id: 'nobreaks',
      label: 'Отсутствие разрывов строк <br> в тексте',
      status: 'ok',
      expected: 'без разрывов строк <br> в тексте',
      actual: 'нет переносов',
      group: 'text',
      unit: 'nobreaks',
      hintPath: 'Абзацы не должны разделяться разрывами строк (Shift+Enter)'
    });
  }

  // typosText (typosText) — объединяет орфографию и пунктуацию
  const matchedPastedIndices = new Set(textMatchedPairs.map(([, pIdx]) => pIdx));
  const typosTextMarks: MarkLocation[] = [];
  pastedTextWords.forEach((pw, pIdx) => {
    if (!matchedPastedIndices.has(pIdx)) {
      typosTextMarks.push({ kind: 'word', para: pw.paraIdx, word: pw.wordIdx });
    } else if (punctMismatchPastedIndices.has(pIdx)) {
      typosTextMarks.push({ kind: 'word', para: pw.paraIdx, word: pw.wordIdx, punct: true });
    }
  });

  const actualTyposTextCount = typosText > 50 ? 'более 50' : `${typosText}`;
  let actualTyposTextStr = `опечаток: ${actualTyposTextCount}`;
  if (typosText > 0 && punctTypos > 0) {
    const details = formatPunctDetails(punctMissing, punctExtra);
    if (details) {
      actualTyposTextStr += ` (${details})`;
    }
  }

  items.push({
    id: 'typosText',
    label: 'Орфография и пунктуация в тексте',
    status: typosText <= spec.typosTextLimit ? 'ok' : 'fail',
    expected: `без опечаток (≤${spec.typosTextLimit})`,
    actual: actualTyposTextStr,
    group: 'text',
    unit: 'typosText',
    hintPath: 'Внимательно сверяйте текст и знаки препинания с образцом',
    ...(typosTextMarks.length > 0 ? { marks: typosTextMarks } : {})
  });

  // --- 2. ГРУППА 'table' ---
  let typosTable = 0;
  const pastedHasTable = !!pasted.table && !!pasted.table.rows && pasted.table.rows.length > 0;

  if (doc.table) {
    const targetTableWords = getTableWords(doc);
    const pastedTableWords = getTableWords(pasted);

    if (!pastedHasTable) {
      items.push({
        id: 'tableExists',
        label: 'Наличие таблицы',
        status: 'fail',
        expected: 'таблица присутствует',
        actual: 'таблица отсутствует',
        group: 'table',
        unit: 'tableExists',
        hintPath: 'Вставка → Таблица'
      });
      if (req.tableSize.enabled) {
        const targetRows = doc.table?.rows?.length || 0;
        const targetCols = tableWidth(doc.table?.rows);
        items.push({
          id: 'tableSize',
          label: 'Размер таблицы',
          status: 'unknown',
          unknownReason: 'blocked',
          expected: `${targetRows} строк(и) на ${targetCols} столбцов`,
          actual: 'не проверено (таблица не создана)',
          group: 'table',
          unit: 'tableSize',
          hintPath: 'Вставка → Таблица'
        });
      }
      if (req.tableWidth.enabled) {
        items.push({
          id: 'tableWidth',
          label: 'Ширина таблицы',
          status: 'unknown',
          unknownReason: 'blocked',
          expected: tableWidthExpectedText(spec),
          actual: 'не проверено (таблица не создана)',
          group: 'table',
          unit: 'tableWidth',
          hintPath: 'Свойства таблицы → Ширина'
        });
      }
      if (req.tableAlign.enabled) {
        items.push({
          id: 'tableAlign',
          label: 'Положение таблицы на странице',
          status: 'unknown',
          unknownReason: 'blocked',
          expected: alignLabel(req.tableAlign.align),
          actual: 'не проверено (таблица не создана)',
          group: 'table',
          unit: 'tableAlign',
          hintPath: 'Свойства таблицы → Выравнивание'
        });
      }
      if (req.colAlign.enabled) {
        items.push({
          id: 'colAlign',
          label: 'Выравнивание в ячейках таблицы',
          status: 'unknown',
          unknownReason: 'blocked',
          expected: doc.table ? describeCellAlignments(doc.table) : 'выравнивание по столбцам согласно заданию',
          actual: 'не проверено (таблица не создана)',
          group: 'table',
          unit: 'colAlign',
          hintPath: 'Формат → Выравнивание ячеек'
        });
      }
    } else {
      const targetRows = doc.table ? doc.table.rows.length : 0;
      const targetCols = doc.table ? Math.max(...doc.table.rows.map(r => r.reduce((acc, cell) => acc + (cell.colSpan || 1), 0))) : 0;
      const pastedRows = pasted.table!.rows.length;
      const pastedCols = Math.max(...pasted.table!.rows.map(r => r.reduce((acc, cell) => acc + (cell.colSpan || 1), 0)));
      const isTableSizeOk = (pastedRows === targetRows && pastedCols === targetCols);

      // tableSize (делегирование в реестр)
      if (req.tableSize.enabled) {
        items.push(tableSizeRequirement.check(req.tableSize, pasted, doc, spec.tolerances, spec));
      }

      // tableMerge (tableMerge) - только если в эталоне есть объединения
      const targetHasMerge = hasMergedCells(doc.table);
      if (targetHasMerge) {
        let mergeMatch = true;
        if (pasted.table!.rows.length !== doc.table!.rows.length) {
          mergeMatch = false;
        } else {
          for (let r = 0; r < doc.table!.rows.length; r++) {
            const tRow = doc.table!.rows[r];
            const pRow = pasted.table!.rows[r];
            if (!pRow || pRow.length !== tRow.length) {
              mergeMatch = false;
              break;
            }
            for (let c = 0; c < tRow.length; c++) {
              if (
                (pRow[c].colSpan || 1) !== (tRow[c].colSpan || 1) ||
                (pRow[c].rowSpan || 1) !== (tRow[c].rowSpan || 1)
              ) {
                mergeMatch = false;
                break;
              }
            }
            if (!mergeMatch) break;
          }
        }

        items.push({
          id: 'tableMerge',
          label: 'Объединение ячеек таблицы',
          status: mergeMatch ? 'ok' : 'fail',
          expected: describeMerges(doc.table),
          actual: mergeMatch ? 'объединены верно' : 'объединения не совпадают',
          group: 'table',
          unit: 'tableMerge',
          hintPath: 'Макет таблицы → Объединить ячейки'
        });
      }

      // tableWidth (делегирование в реестр)
      if (req.tableWidth.enabled) {
        items.push(tableWidthRequirement.check(req.tableWidth, pasted, doc, spec.tolerances, spec));
      }

      // boldCells (boldCells)
      const targetBoldMap: boolean[][] = [];
      let targetAnyBold = false;
      let targetRow0OnlyBold = true;

      doc.table.rows.forEach((r, rIdx) => {
        const rowBold: boolean[] = [];
        r.forEach(cell => {
          const spans = (cell.spans || []).filter(s => s.text.trim().length > 0);
          if (spans.length === 0) {
            rowBold.push(false);
          } else {
            const isBold = spans.every(s => s.b);
            rowBold.push(isBold);
            if (isBold) {
              targetAnyBold = true;
              if (rIdx !== 0) {
                targetRow0OnlyBold = false;
              }
            }
          }
        });
        targetBoldMap.push(rowBold);
      });

      // Если в образце нет ни одной полужирной ячейки — критерий в items не добавлять вообще
      if (req.boldCells.enabled && targetAnyBold) {
        if (!isTableSizeOk) {
          items.push({
            id: 'boldCells',
            label: 'Полужирные ячейки таблицы',
            status: 'unknown',
            unknownReason: 'blocked',
            expected: describeExpectedBoldCells(doc.table),
            actual: 'не удалось определить (размер таблицы не совпадает)',
            group: 'table',
            unit: 'boldCells',
            hintPath: 'Формат → Полужирный (Ctrl+B)'
          });
        } else {
          // Карта жирности ячеек вставленного документа
          const pastedBoldMap: boolean[][] = [];
          pasted.table!.rows.forEach(r => {
            const rowBold: boolean[] = [];
            r.forEach(cell => {
              const spans = (cell.spans || []).filter(s => s.text.trim().length > 0);
              if (spans.length === 0) {
                rowBold.push(false);
              } else {
                const isBold = spans.every(s => s.b);
                rowBold.push(isBold);
              }
            });
            pastedBoldMap.push(rowBold);
          });

          const boldMarks: MarkLocation[] = [];
          const missingBoldTexts: string[] = [];
          const extraBoldTexts: string[] = [];

          let allRow0Missing = true;
          let row0HasCells = false;

          targetBoldMap.forEach((tRow, rIdx) => {
            const pRow = pastedBoldMap[rIdx] || [];
            tRow.forEach((tIsBold, cIdx) => {
              const pIsBold = pRow[cIdx] || false;
              const cell = pasted.table!.rows[rIdx]?.[cIdx] || doc.table!.rows[rIdx]?.[cIdx];
              const cellText = (cell?.spans || []).map(s => s.text).join('').trim() || `ячейка [${rIdx + 1},${cIdx + 1}]`;
              const shortText = cellText.length > 20 ? cellText.slice(0, 18) + '…' : `«${cellText}»`;

              if (rIdx === 0 && tIsBold) {
                row0HasCells = true;
                if (pIsBold) {
                  allRow0Missing = false;
                }
              }

              if (tIsBold && !pIsBold) {
                boldMarks.push({ kind: 'cell', row: rIdx, col: cIdx });
                missingBoldTexts.push(shortText);
              } else if (!tIsBold && pIsBold) {
                boldMarks.push({ kind: 'cell', row: rIdx, col: cIdx });
                extraBoldTexts.push(shortText);
              }
            });
          });

          const isBoldOk = boldMarks.length === 0;
          let actualText = 'совпадает с требуемым';

          if (!isBoldOk) {
            if (targetRow0OnlyBold && row0HasCells && allRow0Missing && extraBoldTexts.length === 0) {
              actualText = 'заголовок не полужирный';
            } else {
              const parts: string[] = [];
              if (missingBoldTexts.length > 0) {
                const list = missingBoldTexts.slice(0, 3).join(', ');
                parts.push(`не выделены: ${list}${missingBoldTexts.length > 3 ? ' и др.' : ''}`);
              }
              if (extraBoldTexts.length > 0) {
                const list = extraBoldTexts.slice(0, 3).join(', ');
                parts.push(`лишнее выделение: ${list}${extraBoldTexts.length > 3 ? ' и др.' : ''}`);
              }
              actualText = parts.join('; ');
            }
          }

          items.push({
            id: 'boldCells',
            label: 'Полужирные ячейки таблицы',
            status: isBoldOk ? 'ok' : 'fail',
            expected: describeExpectedBoldCells(doc.table),
            actual: actualText,
            group: 'table',
            unit: 'boldCells',
            hintPath: 'Формат → Полужирный (Ctrl+B)',
            ...(isBoldOk ? {} : { marks: boldMarks })
          });
        }
      }

      // colAlign (colAlign) - сверка выравнивания в ячейках с эталоном
      if (req.colAlign.enabled) {
        const colAlignMarks: MarkLocation[] = [];
        const colAlignErrors: string[] = [];
        if (doc.table && pasted.table) {
          pasted.table.rows.forEach((pRow, rIdx) => {
            const tRow = doc.table!.rows[rIdx];
            if (!tRow) return;
            pRow.forEach((pCell, cIdx) => {
              const tCell = tRow[cIdx];
              if (!tCell) return;
              const expectedAlign = tCell.align || 'left';
              const actualAlign = pCell.align || 'left';
              if (expectedAlign !== actualAlign) {
                colAlignMarks.push({ kind: 'cell', row: rIdx, col: cIdx });
                const cell = pasted.table!.rows[rIdx]?.[cIdx] || doc.table!.rows[rIdx]?.[cIdx];
                const cellText = (cell?.spans || []).map(s => s.text).join('').trim();
                const label = cellText ? (cellText.length > 15 ? `«${cellText.slice(0, 13)}…»` : `«${cellText}»`) : `[${rIdx + 1}, ${cIdx + 1}]`;
                colAlignErrors.push(`${label}: ${alignLabel(actualAlign)} вместо ${alignLabel(expectedAlign)}`);
              }
            });
          });
        }

        const colAlignOk = colAlignMarks.length === 0;
        let actualColAlign = 'соответствует';
        if (!colAlignOk) {
          const list = colAlignErrors.slice(0, 3).join('; ');
          actualColAlign = `не совпадает (${list}${colAlignErrors.length > 3 ? ' и др.' : ''})`;
        }

        const expectedColAlign = doc.table ? describeCellAlignments(doc.table) : 'выравнивание по столбцам согласно заданию';

        items.push({
          id: 'colAlign',
          label: 'Горизонтальное выравнивание в ячейках таблицы',
          status: colAlignOk ? 'ok' : 'fail',
          expected: expectedColAlign,
          actual: actualColAlign,
          group: 'table',
          unit: 'colAlign',
          hintPath: 'Формат → Выравнивание',
          ...(colAlignOk ? {} : { marks: colAlignMarks })
        });
      }

      // cellValign (cellValign) - только если в эталоне явно задан valign
      const targetHasValign = doc.table ? doc.table.rows.some(r => r.some(c => c.valign !== undefined && c.valign !== null)) : false;
      if (targetHasValign && doc.table && pasted.table) {
        const valignMarks: MarkLocation[] = [];
        const valignErrors: string[] = [];
        pasted.table.rows.forEach((pRow, rIdx) => {
          const tRow = doc.table!.rows[rIdx];
          if (!tRow) return;
          pRow.forEach((pCell, cIdx) => {
            const tCell = tRow[cIdx];
            if (!tCell || !tCell.valign) return;
            const expectedValign = tCell.valign;
            const actualValign = (pCell.valign) || (pasted.valigns && pasted.valigns[rIdx] && pasted.valigns[rIdx][cIdx]) || null;
            if (actualValign !== expectedValign) {
              valignMarks.push({ kind: 'cell', row: rIdx, col: cIdx });
              const cell = pasted.table!.rows[rIdx]?.[cIdx] || doc.table!.rows[rIdx]?.[cIdx];
              const cellText = (cell?.spans || []).map(s => s.text).join('').trim();
              const label = cellText ? (cellText.length > 15 ? `«${cellText.slice(0, 13)}…»` : `«${cellText}»`) : `[${rIdx + 1}, ${cIdx + 1}]`;
              valignErrors.push(`${label}: ${valignLabel(actualValign)} вместо ${valignLabel(expectedValign)}`);
            }
          });
        });

        const isValignOk = valignMarks.length === 0;
        let actualValign = 'соответствует';
        if (!isValignOk) {
          const list = valignErrors.slice(0, 3).join('; ');
          actualValign = `не совпадает (${list}${valignErrors.length > 3 ? ' и др.' : ''})`;
        }

        const expectedCellValign = doc.table ? describeCellValignments(doc.table) : 'по центру';

        items.push({
          id: 'cellValign',
          label: 'Вертикальное выравнивание в ячейках таблицы',
          status: isValignOk ? 'ok' : 'fail',
          expected: expectedCellValign,
          actual: actualValign,
          group: 'table',
          unit: 'cellValign',
          hintPath: 'Таблица → Свойства ячейки → Вертикальное выравнивание',
          ...(isValignOk ? {} : { marks: valignMarks })
        });
      }

      // cellLineBreak (cellLineBreak) - только если в эталоне есть принудительный перенос <br> в ячейке
      const targetHasCellLineBreak = doc.table ? doc.table.rows.some(r => r.some(c => !!c.hasLineBreak)) : false;
      if (targetHasCellLineBreak && doc.table && pasted.table) {
        const lineBreakMarks: MarkLocation[] = [];
        pasted.table.rows.forEach((pRow, rIdx) => {
          const tRow = doc.table!.rows[rIdx];
          if (!tRow) return;
          pRow.forEach((pCell, cIdx) => {
            const tCell = tRow[cIdx];
            if (!tCell || !tCell.hasLineBreak) return;
            const actualHasBr = !!pCell.hasLineBreak || (pasted.cellHasLineBreak && pasted.cellHasLineBreak[rIdx] && pasted.cellHasLineBreak[rIdx][cIdx]);
            if (!actualHasBr) {
              lineBreakMarks.push({ kind: 'cell', row: rIdx, col: cIdx });
            }
          });
        });

        const isLineBreakOk = lineBreakMarks.length === 0;
        const targetBrCells: string[] = [];
        doc.table.rows.forEach((row, rIdx) => {
          row.forEach((cell, cIdx) => {
            if (cell.hasLineBreak) {
              const cellText = cell.spans.map(s => s.text).join('').replace(/\n/g, ' ').trim();
              const shortText = cellText.length > 20 ? cellText.slice(0, 18) + '…' : cellText;
              targetBrCells.push(`ячейка [${rIdx + 1}, ${cIdx + 1}]${shortText ? ` («${shortText}»)` : ''}`);
            }
          });
        });
        const expectedLineBreaks = targetBrCells.length > 0
          ? `перенос строк в ячейках: ${targetBrCells.join(', ')}`
          : 'перенос строк в ячейках согласно образцу';

        items.push({
          id: 'cellLineBreak',
          label: 'Перенос строк в ячейках таблицы',
          status: isLineBreakOk ? 'ok' : 'fail',
          expected: expectedLineBreaks,
          actual: isLineBreakOk ? 'соответствует' : 'отсутствует перенос строки в ячейке',
          group: 'table',
          unit: 'cellLineBreak',
          hintPath: 'Используйте Shift+Enter для переноса строки внутри ячейки',
          ...(isLineBreakOk ? {} : { marks: lineBreakMarks })
        });
      }

      // supTable (supTable) - только если в эталоне таблицы есть верхний индекс
      const hasSupLike = (cell: Cell) =>
        (cell.spans || []).some(s => s.sup) ||
        SUP_CHARS.test((cell.spans || []).map(s => s.text).join(''));

      const targetTableHasSup = (doc.table?.rows || []).some(r => r.some(hasSupLike));
      if (targetTableHasSup) {
        const pastedTableHasSup = (pasted.table?.rows || []).some(r => r.some(hasSupLike));
        const supTableMarks: MarkLocation[] = [];
        if (doc.table && pasted.table) {
          doc.table.rows.forEach((tRow, rIdx) => {
            const pRow = pasted.table!.rows[rIdx];
            if (!pRow) return;
            tRow.forEach((tCell, cIdx) => {
              const pCell = pRow[cIdx];
              if (!pCell) return;
              const tHasSup = hasSupLike(tCell);
              const pHasSup = hasSupLike(pCell);
              if (tHasSup !== pHasSup) {
                supTableMarks.push({ kind: 'cell', row: rIdx, col: cIdx });
              }
            });
          });
        }

        items.push({
          id: 'supTable',
          label: 'Верхний индекс в таблице',
          status: pastedTableHasSup ? 'ok' : 'fail',
          expected: 'обозначен надстрочным знаком',
          actual: pastedTableHasSup ? 'верно' : 'нет верхнего индекса',
          group: 'table',
          unit: 'supTable',
          hintPath: 'Шрифт → Надстрочный знак (Ctrl+Shift++)',
          ...(pastedTableHasSup ? {} : { marks: supTableMarks })
        });
      }

      // subTable (subTable) - только если в эталоне таблицы есть нижний индекс
      const hasSubLike = (cell: Cell) =>
        (cell.spans || []).some(s => s.sub) ||
        SUB_CHARS.test((cell.spans || []).map(s => s.text).join(''));

      const targetTableHasSub = (doc.table?.rows || []).some(r => r.some(hasSubLike));
      if (targetTableHasSub) {
        const pastedTableHasSub = (pasted.table?.rows || []).some(r => r.some(hasSubLike));
        const subTableMarks: MarkLocation[] = [];
        if (doc.table && pasted.table) {
          doc.table.rows.forEach((tRow, rIdx) => {
            const pRow = pasted.table!.rows[rIdx];
            if (!pRow) return;
            tRow.forEach((tCell, cIdx) => {
              const pCell = pRow[cIdx];
              if (!pCell) return;
              const tHasSub = hasSubLike(tCell);
              const pHasSub = hasSubLike(pCell);
              if (tHasSub !== pHasSub) {
                subTableMarks.push({ kind: 'cell', row: rIdx, col: cIdx });
              }
            });
          });
        }

        items.push({
          id: 'subTable',
          label: 'Нижний индекс в таблице',
          status: pastedTableHasSub ? 'ok' : 'fail',
          expected: 'обозначен подстрочным знаком',
          actual: pastedTableHasSub ? 'верно' : 'нет нижнего индекса',
          group: 'table',
          unit: 'subTable',
          hintPath: 'Формат → Символ → Подстрочный (Ctrl+Shift+B)',
          ...(pastedTableHasSub ? {} : { marks: subTableMarks })
        });
      }

      // tableAlign (tableAlign)
      // Если tableWidthRatio >= spec.tableFullWidthRatio — критерий tableAlign не добавлять в items вообще
      if (req.tableAlign.enabled) {
        const isFullWidthTable = pasted.tableWidthRatio !== null && pasted.tableWidthRatio >= spec.tableFullWidthRatio;
        const expTableAlignRu = alignLabel(req.tableAlign.align);
        if (!isFullWidthTable) {
          if (pasted.tableAlign === null) {
            items.push({
              id: 'tableAlign',
              label: `Выравнивание таблицы (${expTableAlignRu})`,
              status: 'unknown',
              unknownReason: 'unparsed',
              expected: `${expTableAlignRu} (${req.tableAlign.align})`,
              actual: 'не удалось определить',
              group: 'table',
              unit: 'tableAlign',
              hintPath: `Макет таблицы → Выравнивание (${expTableAlignRu})`
            });
          } else if (pasted.tableAlign === req.tableAlign.align) {
            items.push({
              id: 'tableAlign',
              label: `Выравнивание таблицы (${expTableAlignRu})`,
              status: 'ok',
              expected: `${expTableAlignRu} (${req.tableAlign.align})`,
              actual: expTableAlignRu,
              group: 'table',
              unit: 'tableAlign',
              hintPath: `Макет таблицы → Выравнивание (${expTableAlignRu})`
            });
          } else {
            items.push({
              id: 'tableAlign',
              label: `Выравнивание таблицы (${expTableAlignRu})`,
              status: 'fail',
              expected: `${expTableAlignRu} (${req.tableAlign.align})`,
              actual: `выравнивание ${alignLabel(pasted.tableAlign)}`,
              group: 'table',
              unit: 'tableAlign',
              hintPath: `Макет таблицы → Выравнивание (${expTableAlignRu})`
            });
          }
        }
      }

      // tableFontSize (tableFontSize)
      // Допускается размер шрифта в таблице на 1–2 пт меньше или равный основному тексту
      const textPt = req.fontSize.pt;
      const minAllowedTablePt = textPt - 2 - spec.tolerances.fontSizePt;
      const maxAllowedTablePt = textPt + spec.tolerances.fontSizePt;

      const tableCellFontSizes: number[] = [];
      (pasted.table?.rows || []).forEach(r => {
        r.forEach(c => {
          (c.spans || []).forEach(s => {
            if (s.fontSizePt !== undefined && s.fontSizePt !== null) {
              tableCellFontSizes.push(s.fontSizePt);
            }
          });
        });
      });

      if (tableCellFontSizes.length === 0) {
        items.push({
          id: 'tableFontSize',
          label: 'Размер шрифта в таблице',
          status: 'ok',
          expected: `на 1–2 пт меньше или равен тексту (${textPt - 2}–${textPt} пт)`,
          actual: 'соответствует основному тексту',
          group: 'info',
          unit: 'tableFontSize',
          hintPath: 'Формат → Шрифт → Размер'
        });
      } else {
        const wrongTableFontSize = tableCellFontSizes.find(pt => pt < minAllowedTablePt || pt > maxAllowedTablePt);
        if (wrongTableFontSize !== undefined) {
          items.push({
            id: 'tableFontSize',
            label: 'Размер шрифта в таблице',
            status: 'fail',
            expected: `на 1–2 пт меньше или равен тексту (${textPt - 2}–${textPt} пт)`,
            actual: `${formatRuNumber(wrongTableFontSize)} пт`,
            group: 'info',
            unit: 'tableFontSize',
            hintPath: 'Формат → Шрифт → Размер'
          });
        } else {
          const avgTablePt = Math.round(tableCellFontSizes.reduce((a, b) => a + b, 0) / tableCellFontSizes.length);
          items.push({
            id: 'tableFontSize',
            label: 'Размер шрифта в таблице',
            status: 'ok',
            expected: `на 1–2 пт меньше или равен тексту (${textPt - 2}–${textPt} пт)`,
            actual: `${avgTablePt} пт`,
            group: 'info',
            unit: 'tableFontSize',
            hintPath: 'Формат → Шрифт → Размер'
          });
        }
      }

      // typosTable (typosTable)
      if (!isTableSizeOk) {
        typosTable = 0;
        items.push({
          id: 'typosTable',
          label: 'Орфография в таблице',
          status: 'unknown',
          unknownReason: 'blocked',
          expected: `без опечаток (≤${spec.typosTableLimit})`,
          actual: 'не проверено (размер таблицы не совпадает)',
          group: 'table',
          unit: 'typosTable',
          hintPath: 'Внимательно сверяйте текст таблицы с образцом'
        });
      } else {
        const { matchedPairs: tableMatchedPairs, typos: typosTableWords } = alignWordsLCS(targetTableWords, pastedTableWords);
        let tablePunctTypos = 0;
        const tablePunctMissing: string[] = [];
        const tablePunctExtra: string[] = [];

        tableMatchedPairs.forEach(([tIdx, pIdx]) => {
          const tw = targetTableWords[tIdx];
          const pw = pastedTableWords[pIdx];
          const leadMatch = normPunct(tw.lead) === normPunct(pw.lead);
          const trailMatch = normPunct(tw.trail) === normPunct(pw.trail);
          if (!leadMatch || !trailMatch) {
            tablePunctTypos++;

            const wordStr = pw.cleanText.length > 30 ? pw.cleanText.slice(0, 30) + '…' : pw.cleanText;
            const rHuman = (pw.rowIdx !== undefined ? pw.rowIdx : 0) + 1;
            const cHuman = (pw.colIdx !== undefined ? pw.colIdx : 0) + 1;
            const locStr = ` (строка ${rHuman}, столбец ${cHuman})`;

            if (!leadMatch) {
              const { missing, extra } = getPunctDiff(tw.lead, pw.lead);
              missing.forEach(ch => tablePunctMissing.push(`${punctName(ch)} перед «${wordStr}»${locStr}`));
              extra.forEach(ch => tablePunctExtra.push(`${punctName(ch)} перед «${wordStr}»${locStr}`));
            }

            if (!trailMatch) {
              const { missing, extra } = getPunctDiff(tw.trail, pw.trail);
              missing.forEach(ch => tablePunctMissing.push(`${punctName(ch)} после «${wordStr}»${locStr}`));
              extra.forEach(ch => tablePunctExtra.push(`${punctName(ch)} после «${wordStr}»${locStr}`));
            }
          }
        });
        typosTable = typosTableWords + tablePunctTypos;

        const typosTableMarks: MarkLocation[] = [];
        if (doc.table && pasted.table) {
          doc.table.rows.forEach((tRow, rIdx) => {
            const pRow = pasted.table!.rows[rIdx];
            if (!pRow) return;
            tRow.forEach((tCell, cIdx) => {
              const pCell = pRow[cIdx];
              if (!pCell) return;
              const tWords = (tCell.spans || []).flatMap(s => s.text.split(/\s+/)).map(cleanWord).filter(Boolean).join(' ');
              const pWords = (pCell.spans || []).flatMap(s => s.text.split(/\s+/)).map(cleanWord).filter(Boolean).join(' ');
              const tPunct = (tCell.spans || []).flatMap(s => s.text.split(/\s+/)).map(normPunct).join(' ');
              const pPunct = (pCell.spans || []).flatMap(s => s.text.split(/\s+/)).map(normPunct).join(' ');
              if (tWords !== pWords) {
                typosTableMarks.push({ kind: 'cell', row: rIdx, col: cIdx });
              } else if (tPunct !== pPunct) {
                typosTableMarks.push({ kind: 'cell', row: rIdx, col: cIdx, punct: true });
              }
            });
          });
        }

        const actualTyposTable = typosTable > 50 ? 'более 50' : `${typosTable}`;
        let actualTyposTableStr = `опечаток: ${actualTyposTable}`;
        if (typosTable > 0 && tablePunctTypos > 0) {
          const punctDetails = formatPunctDetails(tablePunctMissing, tablePunctExtra);
          if (punctDetails) {
            actualTyposTableStr += ` (${punctDetails})`;
          }
        }

        items.push({
          id: 'typosTable',
          label: 'Орфография в таблице',
          status: typosTable <= spec.typosTableLimit ? 'ok' : 'fail',
          expected: `без опечаток (≤${spec.typosTableLimit})`,
          actual: actualTyposTableStr,
          group: 'table',
          unit: 'typosTable',
          hintPath: 'Внимательно сверяйте текст таблицы с образцом',
          ...(typosTableMarks.length > 0 ? { marks: typosTableMarks } : {})
        });
      }
    }
  }

  // --- ПОДСЧЁТ БАЛЛА ---
  const displayErrors = buildDisplayErrors(items);
  const docHasTable = Boolean(doc.table && doc.table.rows && doc.table.rows.length > 0);
  const hasParagraphs = Boolean(pasted.paragraphs && pasted.paragraphs.length > 0);

  const { score, vText, vTable } = computeScore(
    displayErrors,
    typosText,
    typosTable,
    hasParagraphs,
    pastedHasTable,
    docHasTable,
    spec.typosTextLimit,
    spec.typosTableLimit
  );

  return {
    items,
    displayErrors,
    limits: {
      typosText: spec.typosTextLimit,
      typosTable: spec.typosTableLimit
    },
    typosText,
    typosTable,
    paraCountMismatch,
    vText,
    vTable,
    score,
    maxScore: 2
  };
}

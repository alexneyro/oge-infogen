import React from 'react';
import { TaskModule, Difficulty } from '../types';
import { RNG } from '../utils/rng';
import { pickStable, pickManyStable } from '../utils/stablePick';
import { rawWords, ThemeInfo } from '../data/words';
import { StatementBlock, StatementText, StatementQuestion, SubBlock, BlockLabel, DataTable, Th, Td, AnswerField, AnswerChip, VerdictBox, HintBox } from '../components/task-ui';

function getThemeWords(theme: ThemeInfo): string[] {
  if (!theme || !theme.words) return [];
  const allWords = Object.values(theme.words).flat();
  return Array.from(new Set(allWords));
}

interface PoolQuery {
  id: string;
  vec: number[];
  zones: string[];
  zonesStr: string;
  getText: (a: string, b: string, c: string) => string;
  calc: () => number;
}

function createPool(zoneVals: Record<string, number>): PoolQuery[] {
  const { x1, x2, x3, x4, x5, x6, x7 } = zoneVals;
  return [
    {
      id: 'A',
      vec: [1, 0, 0, 1, 1, 1, 0],
      zones: ['x1', 'x4', 'x5', 'x6'],
      zonesStr: '(x1 + x6) + (x4 + x5)',
      getText: (a) => a,
      calc: () => x1 + x4 + x5 + x6,
    },
    {
      id: 'B',
      vec: [0, 1, 0, 1, 1, 0, 1],
      zones: ['x2', 'x4', 'x5', 'x7'],
      zonesStr: '(x2 + x7) + (x4 + x5)',
      getText: (_, b) => b,
      calc: () => x2 + x4 + x5 + x7,
    },
    {
      id: 'C',
      vec: [0, 0, 1, 0, 1, 1, 1],
      zones: ['x3', 'x5', 'x6', 'x7'],
      zonesStr: '(x3 + x7) + (x5 + x6)',
      getText: (_a, _b, c) => c,
      calc: () => x3 + x5 + x6 + x7,
    },
    {
      id: 'A_B',
      vec: [0, 0, 0, 1, 1, 0, 0],
      zones: ['x4', 'x5'],
      zonesStr: 'x4 + x5',
      getText: (a, b) => `${a} & ${b}`,
      calc: () => x4 + x5,
    },
    {
      id: 'A_C',
      vec: [0, 0, 0, 0, 1, 1, 0],
      zones: ['x5', 'x6'],
      zonesStr: 'x5 + x6',
      getText: (a, _b, c) => `${a} & ${c}`,
      calc: () => x5 + x6,
    },
    {
      id: 'B_C',
      vec: [0, 0, 0, 0, 1, 0, 1],
      zones: ['x5', 'x7'],
      zonesStr: 'x5 + x7',
      getText: (_a, b, c) => `${b} & ${c}`,
      calc: () => x5 + x7,
    },
    {
      id: 'A_B_C',
      vec: [0, 0, 0, 0, 1, 0, 0],
      zones: ['x5'],
      zonesStr: 'x5',
      getText: (a, b, c) => `${a} & ${b} & ${c}`,
      calc: () => x5,
    },
    {
      id: 'A_BorC',
      vec: [0, 0, 0, 1, 1, 1, 0],
      zones: ['x4', 'x5', 'x6'],
      zonesStr: 'x4 + x5 + x6',
      getText: (a, b, c) => `${a} & (${b} | ${c})`,
      calc: () => x4 + x5 + x6,
    },
    {
      id: 'B_AorC',
      vec: [0, 0, 0, 1, 1, 0, 1],
      zones: ['x4', 'x5', 'x7'],
      zonesStr: 'x4 + x5 + x7',
      getText: (a, b, c) => `${b} & (${a} | ${c})`,
      calc: () => x4 + x5 + x7,
    },
    {
      id: 'C_AorB',
      vec: [0, 0, 0, 0, 1, 1, 1],
      zones: ['x5', 'x6', 'x7'],
      zonesStr: 'x5 + x6 + x7',
      getText: (a, b, c) => `${c} & (${a} | ${b})`,
      calc: () => x5 + x6 + x7,
    },
    {
      id: 'AorB',
      vec: [1, 1, 0, 1, 1, 1, 1],
      zones: ['x1', 'x2', 'x4', 'x5', 'x6', 'x7'],
      zonesStr: '(x1 + x6) + (x2 + x7) + (x4 + x5)',
      getText: (a, b) => `${a} | ${b}`,
      calc: () => x1 + x2 + x4 + x5 + x6 + x7,
    },
    {
      id: 'AorC',
      vec: [1, 0, 1, 1, 1, 1, 1],
      zones: ['x1', 'x3', 'x4', 'x5', 'x6', 'x7'],
      zonesStr: '(x1 + x4) + (x3 + x7) + (x5 + x6)',
      getText: (a, _b, c) => `${a} | ${c}`,
      calc: () => x1 + x3 + x4 + x5 + x6 + x7,
    },
    {
      id: 'BorC',
      vec: [0, 1, 1, 1, 1, 1, 1],
      zones: ['x2', 'x3', 'x4', 'x5', 'x6', 'x7'],
      zonesStr: '(x2 + x4) + (x3 + x6) + (x5 + x7)',
      getText: (_a, b, c) => `${b} | ${c}`,
      calc: () => x2 + x3 + x4 + x5 + x6 + x7,
    },
    {
      id: 'AorBorC',
      vec: [1, 1, 1, 1, 1, 1, 1],
      zones: ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7'],
      zonesStr: 'x1 + x2 + x3 + x4 + x5 + x6 + x7',
      getText: (a, b, c) => `${a} | ${b} | ${c}`,
      calc: () => x1 + x2 + x3 + x4 + x5 + x6 + x7,
    },
  ];
}

// Linear Algebra Solvability Check (3x3 determinant)
function det3(m: number[][]): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

function solve3(m: number[][], b: number[]): number[] | null {
  const d = det3(m);
  if (d === 0) return null;
  const mx = [
    [b[0], m[0][1], m[0][2]],
    [b[1], m[1][1], m[1][2]],
    [b[2], m[2][1], m[2][2]],
  ];
  const my = [
    [m[0][0], b[0], m[0][2]],
    [m[1][0], b[1], m[1][2]],
    [m[2][0], b[2], m[2][2]],
  ];
  const mz = [
    [m[0][0], m[0][1], b[0]],
    [m[1][0], m[1][1], b[1]],
    [m[2][0], m[2][1], b[2]],
  ];
  return [det3(mx) / d, det3(my) / d, det3(mz) / d];
}

function findCoeffs(
  v1: number[],
  v2: number[],
  v3: number[],
  target: number[]
): number[] | null {
  for (let r1 = 0; r1 < 7; r1++) {
    for (let r2 = r1 + 1; r2 < 7; r2++) {
      for (let r3 = r2 + 1; r3 < 7; r3++) {
        const m = [
          [v1[r1], v2[r1], v3[r1]],
          [v1[r2], v2[r2], v3[r2]],
          [v1[r3], v2[r3], v3[r3]],
        ];
        const b = [target[r1], target[r2], target[r3]];
        const sol = solve3(m, b);
        if (sol) {
          let ok = true;
          for (let i = 0; i < 7; i++) {
            const val = sol[0] * v1[i] + sol[1] * v2[i] + sol[2] * v3[i];
            if (Math.abs(val - target[i]) > 1e-6) {
              ok = false;
              break;
            }
          }
          if (ok) return sol.map((x) => Math.round(x));
        }
      }
    }
  }
  return null;
}

function solveKCoeffs(queries: PoolQuery[], targetVec: number[]): number[] | null {
  const k = queries.length;
  const A: number[][] = [];
  for (let r = 0; r < 7; r++) {
    const row: number[] = [];
    for (let c = 0; c < k; c++) {
      row.push(queries[c].vec[r]);
    }
    row.push(targetVec[r]);
    A.push(row);
  }

  let pivotRow = 0;
  const pivotCols: number[] = [];
  for (let col = 0; col < k && pivotRow < 7; col++) {
    let sel = pivotRow;
    while (sel < 7 && Math.abs(A[sel][col]) < 1e-9) sel++;
    if (sel === 7) continue;

    [A[pivotRow], A[sel]] = [A[sel], A[pivotRow]];

    const div = A[pivotRow][col];
    for (let c = 0; c <= k; c++) A[pivotRow][c] /= div;

    for (let r = 0; r < 7; r++) {
      if (r !== pivotRow && Math.abs(A[r][col]) > 1e-9) {
        const mult = A[r][col];
        for (let c = 0; c <= k; c++) {
          A[r][c] -= mult * A[pivotRow][c];
        }
      }
    }
    pivotCols.push(col);
    pivotRow++;
  }

  for (let r = pivotRow; r < 7; r++) {
    if (Math.abs(A[r][k]) > 1e-9) return null;
  }

  const freeCols: number[] = [];
  for (let c = 0; c < k; c++) {
    if (!pivotCols.includes(c)) freeCols.push(c);
  }

  const searchVals = [0, 1, -1, 2, -2, 3, -3];

  function evaluateFree(freeVals: number[]): number[] | null {
    const coeffs = new Array(k).fill(0);
    for (let j = 0; j < freeCols.length; j++) {
      coeffs[freeCols[j]] = freeVals[j];
    }
    for (let i = 0; i < pivotCols.length; i++) {
      const col = pivotCols[i];
      let val = A[i][k];
      for (let j = 0; j < freeCols.length; j++) {
        val -= A[i][freeCols[j]] * freeVals[j];
      }
      if (Math.abs(val - Math.round(val)) > 1e-6) return null;
      coeffs[col] = Math.round(val);
    }

    for (let r = 0; r < 7; r++) {
      let sum = 0;
      for (let c = 0; c < k; c++) sum += coeffs[c] * queries[c].vec[r];
      if (sum !== targetVec[r]) return null;
    }

    return coeffs;
  }

  if (freeCols.length === 0) {
    return evaluateFree([]);
  }

  const freeVals = new Array(freeCols.length).fill(0);
  function searchFree(fIdx: number): number[] | null {
    if (fIdx === freeCols.length) {
      return evaluateFree(freeVals);
    }
    for (const val of searchVals) {
      freeVals[fIdx] = val;
      const res = searchFree(fIdx + 1);
      if (res) return res;
    }
    return null;
  }

  return searchFree(0);
}

function usesAllWords(
  qOrQueries: PoolQuery | PoolQuery[],
  q2OrQt?: PoolQuery,
  q3?: PoolQuery,
  qtParam?: PoolQuery
): boolean {
  let queries: PoolQuery[] = [];
  let qt: PoolQuery;

  if (Array.isArray(qOrQueries)) {
    queries = qOrQueries;
    qt = q2OrQt!;
  } else {
    queries = [qOrQueries, q2OrQt!, q3!];
    qt = qtParam!;
  }

  const allQs = [...queries, qt];
  const covA = [0, 3, 4, 5].some((idx) => allQs.some((q) => q.vec[idx] === 1));
  const covB = [1, 3, 4, 6].some((idx) => allQs.some((q) => q.vec[idx] === 1));
  const covC = [2, 4, 5, 6].some((idx) => allQs.some((q) => q.vec[idx] === 1));

  const idA = allQs.some((q) => q.id.includes('A'));
  const idB = allQs.some((q) => q.id.includes('B'));
  const idC = allQs.some((q) => q.id.includes('C'));

  return covA && covB && covC && idA && idB && idC;
}

function getZoneIndex(z: string): number {
  return parseInt(z.slice(1), 10);
}

function getSortedZonesStr(zones: string[]): string {
  return zones
    .slice()
    .sort((a, b) => getZoneIndex(a) - getZoneIndex(b))
    .join(' + ');
}

function formatNCombination(
  items: { coeff: number; text: string }[]
): string {
  return items
    .map((item, idx) => {
      const c = item.coeff;
      const t = item.text;
      const absC = Math.abs(c);
      const nStr = `N(${t})`;
      const termStr = absC === 1 ? nStr : `${absC}·${nStr}`;

      if (idx === 0) {
        return c < 0 ? `−${termStr}` : termStr;
      } else {
        return c < 0 ? ` − ${termStr}` : ` + ${termStr}`;
      }
    })
    .join('');
}

function formatNumCombination(
  items: { coeff: number; val: number }[]
): string {
  return items
    .map((item, idx) => {
      const c = item.coeff;
      const v = item.val;
      const absC = Math.abs(c);
      const valStr = absC === 1 ? `${v}` : `${absC}·${v}`;

      if (idx === 0) {
        return c < 0 ? `−${valStr}` : valStr;
      } else {
        return c < 0 ? ` − ${valStr}` : ` + ${valStr}`;
      }
    })
    .join('');
}

function computeNumSteps(
  items: { coeff: number; val: number }[],
  ans: number
): string {
  const rawStr = formatNumCombination(items);

  const prodItems = items.map((item) => ({
    coeff: item.coeff < 0 ? -1 : 1,
    val: Math.abs(item.coeff * item.val),
  }));
  const prodStr = formatNumCombination(prodItems);

  let posSum = 0;
  let negSum = 0;
  for (const item of items) {
    const prod = item.coeff * item.val;
    if (prod > 0) posSum += prod;
    else if (prod < 0) negSum += Math.abs(prod);
  }

  let groupedStr = '';
  if (posSum > 0 && negSum > 0) {
    groupedStr = `${posSum} − ${negSum}`;
  } else if (posSum > 0) {
    groupedStr = `${posSum}`;
  } else {
    groupedStr = `−${negSum}`;
  }

  const ansStr = `${ans}`;

  const steps = [rawStr, prodStr, groupedStr, ansStr];
  const uniqueSteps: string[] = [];
  for (const s of steps) {
    if (
      s &&
      (uniqueSteps.length === 0 ||
        uniqueSteps[uniqueSteps.length - 1] !== s)
    ) {
      uniqueSteps.push(s);
    }
  }

  return uniqueSteps.join(' = ');
}

function formatQueryZoneLine(
  q: PoolQuery,
  c: number,
  a: string,
  b: string,
  cWord: string
): string {
  const zSorted = getSortedZonesStr(q.zones);
  const text = q.getText(a, b, cWord);
  const absC = Math.abs(c);
  const nStr = `N(${text})`;

  let termName = '';
  if (c === 1) termName = nStr;
  else if (c === -1) termName = `−${nStr}`;
  else if (c > 1) termName = `${c}·${nStr}`;
  else termName = `−${absC}·${nStr}`;

  let expanded = '';
  const isMulti = q.zones.length > 1;
  if (c === 1) expanded = zSorted;
  else if (c === -1) expanded = isMulti ? `−(${zSorted})` : `−${zSorted}`;
  else if (c > 1) expanded = isMulti ? `${c}·(${zSorted})` : `${c}·${zSorted}`;
  else expanded = isMulti ? `−${absC}·(${zSorted})` : `−${absC}·${zSorted}`;

  return `   • ${termName} = ${expanded}`;
}

function formatZoneCombination(
  queries: PoolQuery[],
  coeffsList: number[]
): string {
  const zoneNet: Record<string, number> = {
    x1: 0,
    x2: 0,
    x3: 0,
    x4: 0,
    x5: 0,
    x6: 0,
    x7: 0,
  };

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    const c = coeffsList[i];
    for (const z of q.zones) {
      zoneNet[z] = (zoneNet[z] || 0) + c;
    }
  }

  const allZoneNames = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7'];
  const activeZones = allZoneNames.filter((z) => zoneNet[z] !== 0);

  return activeZones
    .map((z, idx) => {
      const c = zoneNet[z];
      const absC = Math.abs(c);
      const zTerm = absC === 1 ? z : `${absC}·${z}`;

      if (idx === 0) {
        return c < 0 ? `−${zTerm}` : zTerm;
      } else {
        return c < 0 ? ` − ${zTerm}` : ` + ${zTerm}`;
      }
    })
    .join('');
}

export const task8: TaskModule = {
  id: 8,
  title: 'Поисковые запросы в Интернете с логическими связками',
  description: 'Расчет количества найденных страниц по логическим связкам И (&) и ИЛИ (|).',
  topics: ['Поисковые запросы', 'Круги Эйлера'], // TODO: уточнить формулировки
  maxPoints: 1,

  generate: (difficulty: Difficulty, rng: RNG) => {
    const seed = Math.floor(rng.next() * 0x100000000);
    if (difficulty === 3) {
      // LEVEL 3: 3-circle Venn diagram / 4-6 queries or zero-intersection system
      const validThemeKeys = Object.keys(rawWords).filter((key) => {
        const words = getThemeWords(rawWords[key]);
        return words.length >= 3;
      });

      const themeKey = pickStable(validThemeKeys, seed, 'task8:theme:L3', (s) => s);
      const themeWords = getThemeWords(rawWords[themeKey]);

      const pickedWords = pickManyStable(themeWords, seed, `task8:word:L3:${themeKey}`, (s) => s, 3);
      const wordA = pickedWords[0];
      const wordB = pickedWords[1];
      const wordC = pickedWords[2];

      const scenario = rng.pick([1, 2]);

      let x1 = 0;
      let x2 = 0;
      let x3 = 0;
      let x4 = 0;
      let x5 = 0;
      let x6 = 0;
      let x7 = 0;

      let tableEntries: { query: string; count: number }[] = [];
      let askedQuery = '';
      let correctAnswerNumber = 0;
      let shortHint = '';
      let hint = '';

      if (scenario === 1) {
        // Scenario 1: target via linear combination of k (4..6) queries
        x1 = rng.int(20, 400);
        x2 = rng.int(20, 400);
        x3 = rng.int(20, 400);
        x4 = rng.int(20, 400);
        x5 = rng.int(20, 400);
        x6 = rng.int(20, 400);
        x7 = rng.int(20, 400);

        const zoneVals: Record<string, number> = { x1, x2, x3, x4, x5, x6, x7 };
        const pool = createPool(zoneVals);

        const k = rng.pick([4, 5, 6]);

        let targetQuery: PoolQuery | null = null;
        let selectedQueries: PoolQuery[] = [];
        let coeffs: number[] = [];

        const shuffledTargets = rng.shuffle(pool);
        for (const tCandidate of shuffledTargets) {
          const candidates = pool.filter((q) => q.id !== tCandidate.id);
          for (let attempt = 0; attempt < 80; attempt++) {
            const subset = rng.shuffle(candidates).slice(0, k);
            const cSol = solveKCoeffs(subset, tCandidate.vec);
            if (cSol) {
              const nonZeroCount = cSol.filter((c) => c !== 0).length;
              const activeQueries = subset.filter((_, idx) => cSol[idx] !== 0);
              if (nonZeroCount >= 4 && usesAllWords(activeQueries, tCandidate)) {
                targetQuery = tCandidate;
                selectedQueries = subset;
                coeffs = cSol;
                break;
              }
            }
          }
          if (targetQuery) break;
        }

        if (!targetQuery) {
          // Fallback default for Scenario 1
          targetQuery = pool.find((q) => q.id === 'AorBorC')!;
          selectedQueries = [
            pool.find((q) => q.id === 'A_B')!,
            pool.find((q) => q.id === 'A_C')!,
            pool.find((q) => q.id === 'B_C')!,
            pool.find((q) => q.id === 'A')!,
            pool.find((q) => q.id === 'B')!,
            pool.find((q) => q.id === 'C')!,
          ];
          coeffs = [-1, -1, -1, 1, 1, 1];
        }

        const tableOrder = rng.shuffle(selectedQueries.map((_, idx) => idx));
        const displayQueries = tableOrder.map((idx) => selectedQueries[idx]);
        const displayCoeffs = tableOrder.map((idx) => coeffs[idx]);

        tableEntries = displayQueries.map((q) => ({
          query: q.getText(wordA, wordB, wordC),
          count: q.calc(),
        }));

        askedQuery = targetQuery.getText(wordA, wordB, wordC);
        correctAnswerNumber = targetQuery.calc();

        const introL3 =
          `Пусть A — множество страниц со словом «${wordA}», B — со словом «${wordB}», C — со словом «${wordC}».\n` +
          `Разобьём диаграмму на 7 зон: x1 — только A, x2 — только B, x3 — только C, x4 — A и B (без C), x5 — A и B и C (центр), x6 — A и C (без B), x7 — B и C (без A).\n\n`;

        const eqLines =
          `Составим систему уравнений по данным из таблицы:\n` +
          displayQueries
            .map(
              (q, idx) =>
                `   ${idx + 1}) N(${q.getText(wordA, wordB, wordC)}) = ${getSortedZonesStr(q.zones)} = ${q.calc()}`
            )
            .join('\n') +
          `\n\n` +
          `Искомый запрос: N(${askedQuery}) = ${getSortedZonesStr(targetQuery.zones)}.\n\n`;

        const combo = displayQueries.map((q, idx) => ({
          q,
          coeff: displayCoeffs[idx],
        }));
        const orderedCombo = [
          ...combo.filter((c) => c.coeff > 0),
          ...combo.filter((c) => c.coeff < 0),
        ];

        const nItems = orderedCombo.map((item) => ({
          coeff: item.coeff,
          text: item.q.getText(wordA, wordB, wordC),
        }));

        const numItems = orderedCombo.map((item) => ({
          coeff: item.coeff,
          val: item.q.calc(),
        }));

        const zoneLines = orderedCombo.map((item) =>
          formatQueryZoneLine(item.q, item.coeff, wordA, wordB, wordC)
        );
        const totalZoneStr = formatZoneCombination(
          orderedCombo.map((item) => item.q),
          orderedCombo.map((item) => item.coeff)
        );

        const solutionSteps =
          `Выразим искомый запрос как линейную комбинацию данных:\n` +
          `   N(${askedQuery}) = ${formatNCombination(nItems)}\n\n` +
          `Подставим значения из таблицы:\n` +
          `   N(${askedQuery}) = ${computeNumSteps(numItems, correctAnswerNumber)}\n\n` +
          `Проверка по зонам диаграммы:\n` +
          `${zoneLines.join('\n')}\n` +
          `   Итого по зонам: ${totalZoneStr} — это в точности зоны искомого запроса. ✓\n\n` +
          `Ответ: ${correctAnswerNumber}`;

        shortHint = `Запишите запросы через зоны x1..x7. Выразите N(${askedQuery}) через линейную комбинацию данных из таблицы.`;
        hint = introL3 + eqLines + solutionSteps;
      } else {
        // Scenario 2: full system with one pairwise intersection = 0
        const zeroPairs = ['A_B', 'A_C', 'B_C'];
        const zeroPairKey = rng.pick(zeroPairs);

        if (zeroPairKey === 'A_B') {
          x4 = 0;
          x5 = 0;
          x1 = rng.int(20, 400);
          x2 = rng.int(20, 400);
          x3 = rng.int(20, 400);
          x6 = rng.int(20, 400);
          x7 = rng.int(20, 400);
        } else if (zeroPairKey === 'A_C') {
          x5 = 0;
          x6 = 0;
          x1 = rng.int(20, 400);
          x2 = rng.int(20, 400);
          x3 = rng.int(20, 400);
          x4 = rng.int(20, 400);
          x7 = rng.int(20, 400);
        } else {
          // B_C
          x5 = 0;
          x7 = 0;
          x1 = rng.int(20, 400);
          x2 = rng.int(20, 400);
          x3 = rng.int(20, 400);
          x4 = rng.int(20, 400);
          x6 = rng.int(20, 400);
        }

        const zoneVals: Record<string, number> = { x1, x2, x3, x4, x5, x6, x7 };
        const pool = createPool(zoneVals);

        const canonicalQueryIds = ['A', 'B', 'C', 'A_B', 'A_C', 'B_C'];
        const tableQueries = canonicalQueryIds.map(
          (id) => pool.find((q) => q.id === id)!
        );

        const candidateTargets = pool.filter(
          (q) =>
            !canonicalQueryIds.includes(q.id) && usesAllWords(tableQueries, q)
        );

        const targetQuery =
          candidateTargets.length > 0
            ? rng.pick(candidateTargets)
            : pool.find((q) => q.id === 'A_BorC')!;

        const displayQueries = rng.shuffle(tableQueries);

        tableEntries = displayQueries.map((q) => ({
          query: q.getText(wordA, wordB, wordC),
          count: q.calc(),
        }));

        askedQuery = targetQuery.getText(wordA, wordB, wordC);
        correctAnswerNumber = targetQuery.calc();

        const introL3 =
          `Пусть A — множество страниц со словом «${wordA}», B — со словом «${wordB}», C — со словом «${wordC}».\n` +
          `Разобьём диаграмму на 7 зон: x1 — только A, x2 — только B, x3 — только C, x4 — A и B (без C), x5 — A и B и C (центр), x6 — A и C (без B), x7 — B и C (без A).\n\n`;

        const eqLines =
          `Составим систему уравнений по данным из таблицы:\n` +
          displayQueries
            .map(
              (q, idx) =>
                `   ${idx + 1}) N(${q.getText(wordA, wordB, wordC)}) = ${getSortedZonesStr(q.zones)} = ${q.calc()}`
            )
            .join('\n') +
          `\n\n` +
          `Искомый запрос: N(${askedQuery}) = ${getSortedZonesStr(targetQuery.zones)}.\n\n`;

        let zeroQueryText = '';
        let zeroZones: string[] = [];
        if (zeroPairKey === 'A_B') {
          zeroQueryText = `${wordA} & ${wordB}`;
          zeroZones = ['x4', 'x5'];
        } else if (zeroPairKey === 'A_C') {
          zeroQueryText = `${wordA} & ${wordC}`;
          zeroZones = ['x5', 'x6'];
        } else {
          zeroQueryText = `${wordB} & ${wordC}`;
          zeroZones = ['x5', 'x7'];
        }

        const zeroStep = `Из запроса N(${zeroQueryText}) = 0 следует, что зоны ${zeroZones[0]} и ${zeroZones[1]} равны 0.\n\n`;

        let zoneCalcText = '';
        const valAB = x4 + x5;
        const valAC = x5 + x6;
        const valBC = x5 + x7;
        const valA = x1 + x4 + x5 + x6;
        const valB = x2 + x4 + x5 + x7;
        const valC = x3 + x5 + x6 + x7;

        if (zeroPairKey === 'A_B') {
          zoneCalcText =
            `Найдём значения остальных зон из уравнений системы:\n` +
            `   • Из N(${wordA} & ${wordC}) = x5 + x6 = ${valAC} следует x6 = ${valAC} − x5 = ${x6}\n` +
            `   • Из N(${wordB} & ${wordC}) = x5 + x7 = ${valBC} следует x7 = ${valBC} − x5 = ${x7}\n` +
            `   • Из N(${wordA}) = x1 + x4 + x5 + x6 = ${valA} следует x1 = ${valA} − x6 = ${x1}\n` +
            `   • Из N(${wordB}) = x2 + x4 + x5 + x7 = ${valB} следует x2 = ${valB} − x7 = ${x2}\n` +
            `   • Из N(${wordC}) = x3 + x5 + x6 + x7 = ${valC} следует x3 = ${valC} − x6 − x7 = ${valC} − ${x6} − ${x7} = ${x3}\n\n`;
        } else if (zeroPairKey === 'A_C') {
          zoneCalcText =
            `Найдём значения остальных зон из уравнений системы:\n` +
            `   • Из N(${wordA} & ${wordB}) = x4 + x5 = ${valAB} следует x4 = ${valAB} − x5 = ${x4}\n` +
            `   • Из N(${wordB} & ${wordC}) = x5 + x7 = ${valBC} следует x7 = ${valBC} − x5 = ${x7}\n` +
            `   • Из N(${wordA}) = x1 + x4 + x5 + x6 = ${valA} следует x1 = ${valA} − x4 = ${x1}\n` +
            `   • Из N(${wordB}) = x2 + x4 + x5 + x7 = ${valB} следует x2 = ${valB} − x4 − x7 = ${valB} − ${x4} − ${x7} = ${x2}\n` +
            `   • Из N(${wordC}) = x3 + x5 + x6 + x7 = ${valC} следует x3 = ${valC} − x7 = ${x3}\n\n`;
        } else {
          zoneCalcText =
            `Найдём значения остальных зон из уравнений системы:\n` +
            `   • Из N(${wordA} & ${wordB}) = x4 + x5 = ${valAB} следует x4 = ${valAB} − x5 = ${x4}\n` +
            `   • Из N(${wordA} & ${wordC}) = x5 + x6 = ${valAC} следует x6 = ${valAC} − x5 = ${x6}\n` +
            `   • Из N(${wordA}) = x1 + x4 + x5 + x6 = ${valA} следует x1 = ${valA} − x4 − x6 = ${valA} − ${x4} − ${x6} = ${x1}\n` +
            `   • Из N(${wordB}) = x2 + x4 + x5 + x7 = ${valB} следует x2 = ${valB} − x4 = ${x2}\n` +
            `   • Из N(${wordC}) = x3 + x5 + x6 + x7 = ${valC} следует x3 = ${valC} − x6 = ${x3}\n\n`;
        }

        const targetZonesSorted = targetQuery.zones
          .slice()
          .sort((a, b) => getZoneIndex(a) - getZoneIndex(b));
        const targetZonesStr = targetZonesSorted.join(' + ');
        const targetNumSumStr = targetZonesSorted
          .map((z) => zoneVals[z])
          .join(' + ');

        const finalStep =
          `Искомый запрос: N(${askedQuery}) = ${targetZonesStr} = ${targetNumSumStr} = ${correctAnswerNumber}.\n\n` +
          `Ответ: ${correctAnswerNumber}`;

        const solutionSteps = zeroStep + zoneCalcText + finalStep;
        shortHint = `Запишите запросы через зоны x1..x7. Запрос со значением 0 обнуляет соответствующие зоны. Найдите оставшиеся зоны и вычислите N(${askedQuery}).`;
        hint = introL3 + eqLines + solutionSteps;
      }

      const statement =
        `В таблице приведены запросы и количество страниц, которые нашел поисковый сервер по каждому запросу в некотором сегменте сети Интернет:\n\n` +
        tableEntries.map((e) => `${e.query}: ${e.count} тыс.`).join('\n') +
        '\n\n' +
        `Считается, что все запросы выполнялись практически одновременно, так что набор страниц, содержащих все искомые слова, не изменялся за время выполнения запросов.\n\n` +
        `Какое количество страниц (в тысячах) будет найдено по запросу «${askedQuery}»?`;

      return {
        isL2: true,
        wordA,
        wordB,
        wordC,
        zones: {
          x1,
          x2,
          x3,
          x4,
          x5,
          x6,
          x7,
        },
        askedQuery,
        tableEntries,
        statement,
        correctAnswer: String(correctAnswerNumber),
        shortHint,
        hint,
      };
    }

    if (difficulty === 2) {
      // LEVEL 2: 3-circle Venn diagram / 3 queries dynamic generation with solvability check
      const validThemeKeys = Object.keys(rawWords).filter((key) => {
        const words = getThemeWords(rawWords[key]);
        return words.length >= 3;
      });

      const themeKey = pickStable(validThemeKeys, seed, 'task8:theme:L2', (s) => s);
      const themeWords = getThemeWords(rawWords[themeKey]);

      const pickedWords = pickManyStable(themeWords, seed, `task8:word:L2:${themeKey}`, (s) => s, 3);
      const wordA = pickedWords[0];
      const wordB = pickedWords[1];
      const wordC = pickedWords[2];

      // Generate 7 disjoint regions (positive integers 20..400)
      const x1 = rng.int(20, 400); // only A
      const x2 = rng.int(20, 400); // only B
      const x3 = rng.int(20, 400); // only C
      const x4 = rng.int(20, 400); // A & B (no C)
      const x5 = rng.int(20, 400); // center A & B & C
      const x6 = rng.int(20, 400); // A & C (no B)
      const x7 = rng.int(20, 400); // B & C (no A)

      const zoneVals: Record<string, number> = { x1, x2, x3, x4, x5, x6, x7 };

      const pool = createPool(zoneVals);

      // Solvability search algorithm
      let targetQuery: PoolQuery = pool[0];
      let selectedTriplet: PoolQuery[] = [];
      let coeffs: number[] = [];

      // Try picking target and valid triplet
      const shuffledTargets = rng.shuffle(pool);
      let found = false;

      for (const tCandidate of shuffledTargets) {
        const candidates = pool.filter((q) => q.id !== tCandidate.id);
        const validTriplets: { triplet: PoolQuery[]; c: number[] }[] = [];

        for (let i = 0; i < candidates.length; i++) {
          for (let j = i + 1; j < candidates.length; j++) {
            for (let k = j + 1; k < candidates.length; k++) {
              const q1 = candidates[i];
              const q2 = candidates[j];
              const q3 = candidates[k];
              const cSol = findCoeffs(q1.vec, q2.vec, q3.vec, tCandidate.vec);
              if (
                cSol &&
                usesAllWords(q1, q2, q3, tCandidate)
              ) {
                validTriplets.push({ triplet: [q1, q2, q3], c: cSol });
              }
            }
          }
        }

        if (validTriplets.length > 0) {
          const chosen = rng.pick(validTriplets);
          targetQuery = tCandidate;
          selectedTriplet = chosen.triplet;
          coeffs = chosen.c;
          found = true;
          break;
        }
      }

      if (!found) {
        // Fallback default
        targetQuery = pool.find((q) => q.id === 'A_B_C')!;
        selectedTriplet = [
          pool.find((q) => q.id === 'A_B')!,
          pool.find((q) => q.id === 'A_C')!,
          pool.find((q) => q.id === 'A_BorC')!,
        ];
        coeffs = [1, 1, -1];
      }

      // Randomize display order of the 3 table entries
      const tableOrder = rng.shuffle([0, 1, 2]);
      const displayQueries = tableOrder.map((idx) => selectedTriplet[idx]);
      const displayCoeffs = tableOrder.map((idx) => coeffs[idx]);

      const q1 = displayQueries[0];
      const q2 = displayQueries[1];
      const q3 = displayQueries[2];

      const val1 = q1.calc();
      const val2 = q2.calc();
      const val3 = q3.calc();
      const correctAnswerNumber = targetQuery.calc();

      const tableEntries = displayQueries.map((q) => ({
        query: q.getText(wordA, wordB, wordC),
        count: q.calc(),
      }));

      const askedQuery = targetQuery.getText(wordA, wordB, wordC);

      const introL2 =
        `Пусть A — множество страниц со словом «${wordA}», B — со словом «${wordB}», C — со словом «${wordC}».\n` +
        `Разобьём диаграмму на 7 зон: x1 — только A, x2 — только B, x3 — только C, x4 — A и B (без C), x5 — A и B и C (центр), x6 — A и C (без B), x7 — B и C (без A).\n\n`;

      const eqLines =
        `Составим систему уравнений по данным из таблицы:\n` +
        `   1) N(${q1.getText(wordA, wordB, wordC)}) = ${getSortedZonesStr(q1.zones)} = ${val1}\n` +
        `   2) N(${q2.getText(wordA, wordB, wordC)}) = ${getSortedZonesStr(q2.zones)} = ${val2}\n` +
        `   3) N(${q3.getText(wordA, wordB, wordC)}) = ${getSortedZonesStr(q3.zones)} = ${val3}\n\n` +
        `Искомый запрос: N(${askedQuery}) = ${getSortedZonesStr(targetQuery.zones)}.\n\n`;

      const items = [
        { q: q1, v: val1, c: displayCoeffs[0], idx: 1 },
        { q: q2, v: val2, c: displayCoeffs[1], idx: 2 },
        { q: q3, v: val3, c: displayCoeffs[2], idx: 3 },
      ];
      const posItems = items.filter((x) => x.c === 1);
      const negItems = items.filter((x) => x.c === -1);

      let solutionSteps = '';

      if (
        targetQuery.zones.length === 1 &&
        posItems.length === 2 &&
        negItems.length === 1 &&
        displayCoeffs.every((c) => c === 1 || c === -1)
      ) {
        const p1 = posItems[0];
        const p2 = posItems[1];
        const ng = negItems[0];

        const zTarget = targetQuery.zones[0];
        const zExtra1 = getSortedZonesStr(
          p1.q.zones.filter((z) => z !== zTarget)
        );
        const zExtra2 = getSortedZonesStr(
          p2.q.zones.filter((z) => z !== zTarget)
        );

        solutionSteps =
          `Выразим переменные из уравнений ${p1.idx}) и ${p2.idx}) через искомую ${zTarget}:\n` +
          `   • Из ${p1.idx}): ${zExtra1} = ${p1.v} − ${zTarget}\n` +
          `   • Из ${p2.idx}): ${zExtra2} = ${p2.v} − ${zTarget}\n\n` +
          `Подставим эти выражения в уравнение ${ng.idx}):\n` +
          `   (${p1.v} − ${zTarget}) + ${zTarget} + (${p2.v} − ${zTarget}) = ${ng.v}\n\n` +
          `Приведём подобные слагаемые:\n` +
          `   ${p1.v + p2.v} − ${zTarget} = ${ng.v}\n` +
          `   ${zTarget} = ${p1.v + p2.v} − ${ng.v} = ${correctAnswerNumber}\n\n` +
          `Ответ: ${correctAnswerNumber}`;
      } else {
        const combo = displayQueries.map((q, idx) => ({
          q,
          coeff: displayCoeffs[idx],
        }));
        const orderedCombo = [
          ...combo.filter((c) => c.coeff > 0),
          ...combo.filter((c) => c.coeff < 0),
        ];

        const nItems = orderedCombo.map((item) => ({
          coeff: item.coeff,
          text: item.q.getText(wordA, wordB, wordC),
        }));

        const numItems = orderedCombo.map((item) => ({
          coeff: item.coeff,
          val: item.q.calc(),
        }));

        const zoneLines = orderedCombo.map((item) =>
          formatQueryZoneLine(item.q, item.coeff, wordA, wordB, wordC)
        );
        const totalZoneStr = formatZoneCombination(
          orderedCombo.map((item) => item.q),
          orderedCombo.map((item) => item.coeff)
        );

        solutionSteps =
          `Выразим искомый запрос как линейную комбинацию данных:\n` +
          `   N(${askedQuery}) = ${formatNCombination(nItems)}\n\n` +
          `Подставим значения из таблицы:\n` +
          `   N(${askedQuery}) = ${computeNumSteps(numItems, correctAnswerNumber)}\n\n` +
          `Проверка по зонам диаграммы:\n` +
          `${zoneLines.join('\n')}\n` +
          `   Итого по зонам: ${totalZoneStr} — это в точности зоны искомого запроса. ✓\n\n` +
          `Ответ: ${correctAnswerNumber}`;
      }

      const shortHint = `Запишите запросы через зоны x1..x7. Решите систему уравнений для нахождения N(${askedQuery}).`;
      const hint = introL2 + eqLines + solutionSteps;

      const statement =
        `В таблице приведены запросы и количество страниц, которые нашел поисковый сервер по каждому запросу в некотором сегменте сети Интернет:\n\n` +
        tableEntries.map((e) => `${e.query}: ${e.count} тыс.`).join('\n') +
        '\n\n' +
        `Считается, что все запросы выполнялись практически одновременно, так что набор страниц, содержащих все искомые слова, не изменялся за время выполнения запросов.\n\n` +
        `Какое количество страниц (в тысячах) будет найдено по запросу «${askedQuery}»?`;

      return {
        isL2: true,
        wordA,
        wordB,
        wordC,
        zones: {
          x1,
          x2,
          x3,
          x4,
          x5,
          x6,
          x7,
        },
        askedQuery,
        tableEntries,
        statement,
        correctAnswer: String(correctAnswerNumber),
        shortHint,
        hint,
      };
    }

    // LEVEL 1: 2-circle Venn diagram (default)
    // Select theme and word pair from rawWords
    const validThemeKeys = Object.keys(rawWords).filter((key) => {
      const words = getThemeWords(rawWords[key]);
      return words.length >= 2;
    });

    const themeKey = pickStable(validThemeKeys, seed, 'task8:theme:L1', (s) => s);
    const themeWords = getThemeWords(rawWords[themeKey]);

    const [wordA, wordB] = pickManyStable(themeWords, seed, `task8:word:L1:${themeKey}`, (s) => s, 2);

    // Generate values from disjoint regions (only_A, only_B, both)
    const onlyA = rng.int(50, 800);
    const onlyB = rng.int(50, 800);
    const both = rng.int(50, 800);

    // Calculate all 4 query values
    const valA = onlyA + both;
    const valB = onlyB + both;
    const valAnd = both;
    const valOr = onlyA + onlyB + both;

    const allQueries = [
      { id: 'or', query: `${wordA} | ${wordB}`, count: valOr },
      { id: 'and', query: `${wordA} & ${wordB}`, count: valAnd },
      { id: 'a', query: `${wordA}`, count: valA },
      { id: 'b', query: `${wordB}`, count: valB },
    ];

    // Select which of the 4 queries is asked in the question
    const askedIndex = rng.int(0, 3);
    const askedItem = allQueries[askedIndex];
    const tableEntries = allQueries.filter((_, idx) => idx !== askedIndex);

    // Build formula explanation step-by-step
    let shortHint = '';
    let step2Text = '';
    let step3Text = '';

    if (askedItem.id === 'or') {
      shortHint = `Используйте формулу объединения двух множеств:\nN(${wordA} | ${wordB}) = N(${wordA}) + N(${wordB}) − N(${wordA} & ${wordB}).`;
      step2Text = `N(${wordA}) = ${valA}, N(${wordB}) = ${valB}, N(${wordA} & ${wordB}) = ${valAnd}`;
      step3Text = `N(${wordA} | ${wordB}) = ${valA} + ${valB} − ${valAnd} = ${valA + valB} − ${valAnd}`;
    } else if (askedItem.id === 'and') {
      shortHint = `Выразите пересечение множеств из основной формулы:\nN(${wordA} & ${wordB}) = N(${wordA}) + N(${wordB}) − N(${wordA} | ${wordB}).`;
      step2Text = `N(${wordA}) = ${valA}, N(${wordB}) = ${valB}, N(${wordA} | ${wordB}) = ${valOr}`;
      step3Text = `N(${wordA} & ${wordB}) = ${valA} + ${valB} − ${valOr} = ${valA + valB} − ${valOr}`;
    } else if (askedItem.id === 'a') {
      shortHint = `Выразите количество страниц по запросу «${wordA}» из основной формулы:\nN(${wordA}) = N(${wordA} | ${wordB}) + N(${wordA} & ${wordB}) − N(${wordB}).`;
      step2Text = `N(${wordA} | ${wordB}) = ${valOr}, N(${wordA} & ${wordB}) = ${valAnd}, N(${wordB}) = ${valB}`;
      step3Text = `N(${wordA}) = ${valOr} + ${valAnd} − ${valB} = ${valOr + valAnd} − ${valB}`;
    } else {
      shortHint = `Выразите количество страниц по запросу «${wordB}» из основной формулы:\nN(${wordB}) = N(${wordA} | ${wordB}) + N(${wordA} & ${wordB}) − N(${wordA}).`;
      step2Text = `N(${wordA} | ${wordB}) = ${valOr}, N(${wordA} & ${wordB}) = ${valAnd}, N(${wordA}) = ${valA}`;
      step3Text = `N(${wordB}) = ${valOr} + ${valAnd} − ${valA} = ${valOr + valAnd} − ${valA}`;
    }

    const hint = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n` +
      `Шаг 1. Формула включений-исключений для двух запросов (круги Эйлера):\n` +
      `   N(${wordA} | ${wordB}) = N(${wordA}) + N(${wordB}) − N(${wordA} & ${wordB})\n\n` +
      `Шаг 2. Данные из таблицы:\n` +
      `   ${step2Text}\n\n` +
      `Шаг 3. Вычисление искомого запроса («${askedItem.query}»):\n` +
      `   ${step3Text} = ${askedItem.count}\n\n` +
      `Проверка по областям диаграммы Эйлера-Венна:\n` +
      `   • Только «${wordA}»: ${onlyA} тыс.\n` +
      `   • Только «${wordB}»: ${onlyB} тыс.\n` +
      `   • Пересечение («${wordA} & ${wordB}»): ${both} тыс.\n` +
      `   • Итого «${wordA} | ${wordB}»: ${onlyA} + ${onlyB} + ${both} = ${valOr} тыс.\n\n` +
      `Правильный ответ: ${askedItem.count}`;

    const statement = `В таблице приведены запросы и количество страниц, которые нашел поисковый сервер по каждому запросу в некотором сегменте сети Интернет:\n\n` +
      tableEntries.map(e => `${e.query}: ${e.count} тыс.`).join('\n') + '\n\n' +
      `Считается, что все запросы выполнялись практически одновременно, так что набор страниц, содержащих все искомые слова, не изменялся за время выполнения запросов.\n\n` +
      `Какое количество страниц (в тысячах) будет найдено по запросу «${askedItem.query}»?`;

    return {
      wordA,
      wordB,
      onlyA,
      onlyB,
      both,
      valA,
      valB,
      valAnd,
      valOr,
      askedQuery: askedItem.query,
      tableEntries,
      statement,
      correctAnswer: String(askedItem.count),
      shortHint,
      hint,
    };
  },

  render: (taskData, state) => {
    return (
      <div className="space-y-4">
        {/* Task Statement Box */}
        <StatementBlock>
          <StatementText>
            В таблице приведены запросы и количество страниц, которые нашел поисковый сервер по каждому запросу в некотором сегменте сети Интернет:
          </StatementText>

          {/* Table */}
          <DataTable className="my-3 max-w-md">
            <thead>
              <tr>
                <Th className="text-left">Запрос</Th>
                <Th className="text-right">Количество страниц (тыс.)</Th>
              </tr>
            </thead>
            <tbody>
              {taskData.tableEntries?.map((row: any, idx: number) => (
                <tr key={idx} className="hover:bg-theme-bg/30">
                  <Td className="text-left font-mono font-semibold">
                    {row.query}
                  </Td>
                  <Td className="text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    {row.count}
                  </Td>
                </tr>
              ))}
            </tbody>
          </DataTable>

          <p className="text-xs text-theme-text-muted italic leading-relaxed">
            Считается, что все запросы выполнялись практически одновременно, так что набор страниц, содержащих все искомые слова, не изменялся за время выполнения запросов.
          </p>

          <StatementQuestion className="pt-2 border-t border-theme-statement-border/50">
            Какое количество страниц (в тысячах) будет найдено по запросу <span className="font-mono text-blue-700 dark:text-blue-300 font-extrabold">«{taskData.askedQuery}»</span>?
          </StatementQuestion>
        </StatementBlock>

        {/* Answer Input */}
        <AnswerField
          label="Ваш ответ (в тысячах):"
          value={state.userAnswer}
          onChange={(val) => state.setUserAnswer(val)}
          disabled={state.isSubmitted}
          placeholder="Введите число…"
        />

        {/* Verification Result Feedback Overlay */}
        {state.isSubmitted && (
          <VerdictBox status={state.isCorrect ? 'correct' : 'wrong'}>
            {state.isCorrect ? (
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Верно! Ответ правильный.</span>
              </span>
            ) : (
              <div className="space-y-1">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span>Неверно.</span>
                </span>
                <p className="text-[11px] font-medium opacity-95">
                  Правильный ответ: <AnswerChip>{taskData.correctAnswer}</AnswerChip>
                </p>
              </div>
            )}
          </VerdictBox>
        )}

        {/* Hints & Explanations */}
        {state.showHints && !state.isSubmitted && taskData.shortHint && (
          <HintBox>
            <strong className="font-bold block mb-1">💡 Подсказка:</strong>
            <p className="whitespace-pre-line leading-relaxed">{taskData.shortHint}</p>
          </HintBox>
        )}

        {state.isSubmitted && taskData.isL2 && (
          <SubBlock>
            <BlockLabel>Диаграмма Эйлера-Венна (7 областей):</BlockLabel>
            <div className="w-full overflow-x-auto py-2 flex justify-center items-center">
              <svg viewBox="0 0 500 420" className="w-full max-w-2xl h-auto select-none">
                {/* Word Labels */}
                <text x="120" y="45" textAnchor="end" className="font-extrabold text-sm fill-slate-900 dark:fill-slate-100">
                  A: «{taskData.wordA}»
                </text>
                <text x="380" y="45" textAnchor="start" className="font-extrabold text-sm fill-slate-900 dark:fill-slate-100">
                  B: «{taskData.wordB}»
                </text>
                <text x="250" y="395" textAnchor="middle" className="font-extrabold text-sm fill-slate-900 dark:fill-slate-100">
                  C: «{taskData.wordC}»
                </text>

                {/* 3 Circles */}
                <circle cx="180" cy="160" r="100" fill="none" className="stroke-indigo-500 dark:stroke-indigo-400 stroke-2" />
                <circle cx="320" cy="160" r="100" fill="none" className="stroke-indigo-500 dark:stroke-indigo-400 stroke-2" />
                <circle cx="250" cy="270" r="100" fill="none" className="stroke-indigo-500 dark:stroke-indigo-400 stroke-2" />

                {/* 7 Zone numbers */}
                <text x="130" y="135" textAnchor="middle" dominantBaseline="central" className="font-extrabold text-base fill-slate-900 dark:fill-slate-100">1</text>
                <text x="370" y="135" textAnchor="middle" dominantBaseline="central" className="font-extrabold text-base fill-slate-900 dark:fill-slate-100">2</text>
                <text x="250" y="330" textAnchor="middle" dominantBaseline="central" className="font-extrabold text-base fill-slate-900 dark:fill-slate-100">3</text>
                <text x="250" y="135" textAnchor="middle" dominantBaseline="central" className="font-extrabold text-base fill-slate-900 dark:fill-slate-100">4</text>
                <text x="250" y="195" textAnchor="middle" dominantBaseline="central" className="font-extrabold text-base fill-slate-900 dark:fill-slate-100">5</text>
                <text x="195" y="230" textAnchor="middle" dominantBaseline="central" className="font-extrabold text-base fill-slate-900 dark:fill-slate-100">6</text>
                <text x="305" y="230" textAnchor="middle" dominantBaseline="central" className="font-extrabold text-base fill-slate-900 dark:fill-slate-100">7</text>
              </svg>
            </div>
          </SubBlock>
        )}

        {state.isSubmitted && taskData.hint && (
          <div className="p-5 bg-theme-solution-bg border border-theme-solution-border text-sm text-theme-solution-text rounded-xl leading-relaxed whitespace-pre-line shadow-sm font-semibold">
            <strong className="block text-slate-900 dark:text-white font-extrabold text-base mb-2">📖 Подробный разбор:</strong>
            <div className="space-y-1">
              {taskData.hint}
            </div>
          </div>
        )}
      </div>
    );
  },

  check: (taskData, userAnswer) => {
    if (!userAnswer) return false;
    const cleanUser = userAnswer.trim().replace(/\s+/g, '');
    const cleanCorrect = String(taskData.correctAnswer).trim();
    return cleanUser === cleanCorrect;
  },
};

import { Difficulty } from '../../types';
import { TASK13_TEXTS, TASK13_TABLES, Task13TextSrc, Task13TableSrc } from '../../data/task13data';
import { buildDoc, Doc } from './parse';
import { makeRng, RNG } from '../../utils/rng';
import { pickStable } from '../../utils/stablePick';

export interface Task13Data {
  doc: Doc;
  sourceTextId: string;
  sourceTableId: string;
  seed?: string;
  level?: string;
}

export type Task13 = Task13Data;

/**
 * Чистая детерминированная функция генерации задания 13.
 * Не зависит от React, DOM, URL и Math.random.
 */
export function generateTask13(seedOrRng: number | RNG, difficulty: Difficulty): Task13 {
  const rng = typeof seedOrRng === 'number' ? makeRng(seedOrRng) : seedOrRng;
  const seed = Math.floor(rng.next() * 0x100000000);

  const levelTexts = TASK13_TEXTS.filter(t => t.level === difficulty);
  const levelTables = TASK13_TABLES.filter(t => t.level === difficulty);

  const matchingPairs: { text: Task13TextSrc; table: Task13TableSrc }[] = [];
  levelTexts.forEach(text => {
    levelTables.forEach(table => {
      if (text.tags.some(tag => table.tags.includes(tag))) {
        matchingPairs.push({ text, table });
      }
    });
  });

  let selectedText: Task13TextSrc;
  let selectedTable: Task13TableSrc;

  if (matchingPairs.length > 0) {
    const pair = pickStable(matchingPairs, seed, 'task13:pair', (p) => `${p.text.id}|${p.table.id}`);
    selectedText = pair.text;
    selectedTable = pair.table;
  } else {
    selectedText = pickStable(levelTexts.length > 0 ? levelTexts : TASK13_TEXTS, seed, 'task13:text', (t) => t.id);
    selectedTable = pickStable(levelTables.length > 0 ? levelTables : TASK13_TABLES, seed, 'task13:table', (t) => t.id);
  }

  const doc = buildDoc(selectedText, selectedTable, rng);

  const taskData: Task13 = {
    doc,
    sourceTextId: selectedText.id,
    sourceTableId: selectedTable.id,
    level: `L${difficulty}`
  };

  return taskData;
}

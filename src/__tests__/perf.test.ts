import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { buildSet, SetConfig, SetSlot } from '../set';
import { PrintDocument } from '../components/PrintDocument';
import { buildSetZipBlob } from '../utils/exportSet';

function createSlots(N: number): SetSlot[] {
  const slots: SetSlot[] = [];
  if (N === 16) {
    for (let i = 1; i <= 16; i++) slots.push({ taskId: i, n1: 1, n2: 0, n3: 0, nR: 0 });
  } else if (N === 80) {
    for (let i = 1; i <= 16; i++) slots.push({ taskId: i, n1: 2, n2: 1, n3: 1, nR: 1 });
  } else if (N === 160) {
    for (let i = 1; i <= 16; i++) slots.push({ taskId: i, n1: 3, n2: 3, n3: 2, nR: 2 });
  } else if (N === 240) {
    for (let i = 1; i <= 16; i++) slots.push({ taskId: i, n1: 4, n2: 4, n3: 4, nR: 3 });
  } else if (N === 400) {
    for (let i = 1; i <= 16; i++) slots.push({ taskId: i, n1: 7, n2: 6, n3: 6, nR: 6 });
  } else if (N === 780) {
    for (let i = 1; i <= 16; i++) {
      if (i <= 12) slots.push({ taskId: i, n1: 13, n2: 12, n3: 12, nR: 12 });
      else slots.push({ taskId: i, n1: 12, n2: 12, n3: 12, nR: 12 });
    }
  } else if (N === 1280) {
    for (let i = 1; i <= 16; i++) slots.push({ taskId: i, n1: 20, n2: 20, n3: 20, nR: 20 });
  }
  return slots;
}

describe('Performance and Scalability Profiling (P1, P2, P3)', () => {
  it('buildSet, PrintDocument, and buildSetZipBlob execute within operational bounds for N=16, 80, 160, 240, 400', async () => {
    const testNs = [16, 80, 160, 240, 400];

    for (const N of testNs) {
      const slots = createSlots(N);
      const cfg: SetConfig = { seed: '1NHJ12L', title: `Набор заданий N=${N}`, slots };

      // P1: Сборка набора
      const t0 = performance.now();
      const built = buildSet(cfg);
      const p1Duration = performance.now() - t0;

      expect(built.entries).toHaveLength(N);
      expect(p1Duration).toBeLessThan(10000);

      // P2: Рендер печатного документа
      const t1 = performance.now();
      const html = renderToString(
        React.createElement(PrintDocument, {
          tasks: built.entries.map((e) => ({
            taskId: e.taskId,
            difficulty: e.difficulty,
            taskData: e.taskData,
            seed: e.subSeed,
          })),
          options: { answers: 'keys', solutions: false, title: cfg.title, code: 'S2-PERF' },
        })
      );
      const p2Duration = performance.now() - t1;

      expect(html.length).toBeGreaterThan(1000);
      expect(p2Duration).toBeLessThan(10000);

      // P3: Формирование ZIP-архива
      const t2 = performance.now();
      const zipResult = await buildSetZipBlob(built.entries, cfg, { includeNotepad: true });
      const p3Duration = performance.now() - t2;

      expect(zipResult.blob.size).toBeGreaterThan(1000);
      expect(p3Duration).toBeLessThan(30000);
    }
  }, 90000);

  it('buildSet scales to N=1280 without memory exhaustion or infinite loops', () => {
    const slots = createSlots(1280);
    const cfg: SetConfig = { seed: '1NHJ12L', title: 'Большой набор N=1280', slots };

    const t0 = performance.now();
    const built = buildSet(cfg);
    const duration = performance.now() - t0;

    expect(built.entries).toHaveLength(1280);
    expect(duration).toBeLessThan(10000);
  }, 20000);
});

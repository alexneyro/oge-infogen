import { describe, it, expect } from 'vitest';
import {
  buildSet,
  encodeSetShort,
  decodeSetShort,
  fileCode,
  normalizeSeed,
  SetConfig,
  SetSlot,
  generateSetSeed,
} from '../set';
import { numToBase34 } from '../utils/base34';

describe('Set Model & S2 Format Suite (src/set.ts)', () => {
  // 6a) round-trip: 200 случайных конфигов
  it('6a) round-trip: 200 случайных конфигов восстанавливают slots (включая нулевые поля) и seed вербатим', () => {
    for (let iter = 0; iter < 200; iter++) {
      const seed = generateSetSeed();
      // Случайная ненулевая маска активных слотов (1..16)
      let mask = 0;
      while (mask === 0) {
        mask = Math.floor(Math.random() * 0x10000);
      }

      const slots: SetSlot[] = [];
      for (let t = 1; t <= 16; t++) {
        const bit = 1 << (16 - t);
        if (mask & bit) {
          // Хотя бы одно ненулевое поле, чтобы слот был активен
          let n1 = Math.floor(Math.random() * 21);
          let n2 = Math.floor(Math.random() * 21);
          let n3 = Math.floor(Math.random() * 21);
          let nR = Math.floor(Math.random() * 21);
          if (n1 === 0 && n2 === 0 && n3 === 0 && nR === 0) {
            n2 = 1;
          }
          slots.push({ taskId: t, n1, n2, n3, nR });
        } else {
          slots.push({ taskId: t, n1: 0, n2: 0, n3: 0, nR: 0 });
        }
      }

      const cfg: SetConfig = {
        seed,
        title: `Набор ${iter}`,
        slots,
      };

      const code = encodeSetShort(cfg);
      expect(code.startsWith('S2-')).toBe(true);

      const decoded = decodeSetShort(code);
      expect(decoded).not.toBeNull();
      expect(decoded!.seed).toBe(seed);
      expect(decoded!.slots).toEqual(slots);
    }
  });

  // 6b) длина кода при 16 активных заданиях и при 5 активных — посчитай оба числа
  it('6b) длина кода при 16 активных заданиях равна 80, при 5 активных — 36', () => {
    const seed = '1NHJ12L';
    const slots16: SetSlot[] = Array.from({ length: 16 }, (_, i) => ({
      taskId: i + 1,
      n1: 1,
      n2: 1,
      n3: 1,
      nR: 1,
    }));
    const code16 = encodeSetShort({ seed, title: 'Все 16', slots: slots16 });
    // S2- (3) + 7 (seed) + - (1) + 4 (mask) + - (1) + 16 * 4 (64) = 80
    expect(code16.length).toBe(80);

    const slots5: SetSlot[] = Array.from({ length: 16 }, (_, i) => ({
      taskId: i + 1,
      n1: i < 5 ? 1 : 0,
      n2: 0,
      n3: 0,
      nR: 0,
    }));
    const code5 = encodeSetShort({ seed, title: '5 заданий', slots: slots5 });
    // S2- (3) + 7 (seed) + - (1) + 4 (mask) + - (1) + 5 * 4 (20) = 36
    expect(code5.length).toBe(36);
  });

  // 6c) невалидные коды → null: '', 'S2', 'S2-', 'S2-1NHJ12L-0000-', mask=0, неверная длина тела, n=21 в теле, код варианта 'V2-7N3E9MK-66M2X'
  it('6c) невалидные коды возвращают null', () => {
    const invalidCodes = [
      '',
      'S2',
      'S2-',
      'S2-1NHJ12L-0000-',
      'S2-1NHJ12L-0000-0000', // mask = 0
      'S2-1NHJ12L-0001-00', // неверная длина тела (2 вместо 4)
      'S2-1NHJ12L-0001-00000', // неверная длина тела (5 вместо 4)
      // nR = 21: значение 21 * 21^3 = 194481 -> в base34 4-значное число
      'S2-1NHJ12L-0WC0-' + numToBase34(194481).padStart(4, '0'),
      'V2-7N3E9MK-66M2X', // код варианта
    ];

    for (const bad of invalidCodes) {
      expect(decodeSetShort(bad)).toBeNull();
    }
  });

  // 6d) устойчивость к регистру, пробелам, дефисам; O→0 и I→1 в теле
  it('6d) устойчивость к регистру, пробелам, дефисам; O→0 и I→1 в теле', () => {
    const seed = '1000000';
    const slots: SetSlot[] = Array.from({ length: 16 }, (_, i) => ({
      taskId: i + 1,
      n1: i === 0 ? 1 : 0,
      n2: 0,
      n3: 0,
      nR: 0,
    }));
    const code = encodeSetShort({ seed, title: 'Test', slots });
    // Заменяем нули на 'O', единицы на 'I', нижний регистр, лишние пробелы и дефисы
    const corrupted = '  ' + code.replace(/0/g, 'O').replace(/1/g, 'I').toLowerCase() + '  ';
    const decoded = decodeSetShort(corrupted);

    expect(decoded).not.toBeNull();
    expect(decoded!.seed).toBe(seed);
    expect(decoded!.slots![0].n1).toBe(1);
    expect(decoded!.slots![0].taskId).toBe(1);
  });

  // 6e) стабильность: если у задания 3 меняется количество (было 1, стало 5), subSeed заданий 4..16 НЕ меняются
  it('6e) стабильность: изменение количества у задания 3 не сдвигает subSeed заданий 4..16', () => {
    const seed = '7N3E9MK';
    const slotsA: SetSlot[] = Array.from({ length: 16 }, (_, i) => ({
      taskId: i + 1,
      n1: 1,
      n2: 0,
      n3: 0,
      nR: 0,
    }));
    const slotsB: SetSlot[] = Array.from({ length: 16 }, (_, i) => ({
      taskId: i + 1,
      n1: i + 1 === 3 ? 5 : 1,
      n2: 0,
      n3: 0,
      nR: 0,
    }));

    const resA = buildSet({ seed, title: 'A', slots: slotsA });
    const resB = buildSet({ seed, title: 'B', slots: slotsB });

    for (let t = 4; t <= 16; t++) {
      const entryA = resA.entries.find((e) => e.taskId === t);
      const entryB = resB.entries.find((e) => e.taskId === t);
      expect(entryA).toBeDefined();
      expect(entryB).toBeDefined();
      expect(entryA!.subSeed).toBe(entryB!.subSeed);
    }
  });

  // 6f) R-экземпляры дают случайное распределение уровней 1..3, детерминированное сидом
  it('6f) R-экземпляры дают случайное распределение уровней 1..3, детерминированное сидом', () => {
    const seed = '7N3E9MK';
    const slots: SetSlot[] = [
      { taskId: 1, n1: 0, n2: 0, n3: 0, nR: 18 },
    ];
    const res1 = buildSet({ seed, title: 'R-test', slots });
    const res2 = buildSet({ seed, title: 'R-test', slots });

    expect(res1.entries.length).toBe(18);
    // Детерминированность
    expect(res1.entries.map((e) => e.difficulty)).toEqual(res2.entries.map((e) => e.difficulty));

    // Распределение покрывает все три уровня 1..3
    const diffs = new Set(res1.entries.map((e) => e.difficulty));
    expect(diffs.has(1)).toBe(true);
    expect(diffs.has(2)).toBe(true);
    expect(diffs.has(3)).toBe(true);
  });

  // 6g) случайный экземпляр уровня d и фиксированный экземпляр того же уровня d в одном слоте имеют разный taskData (проверка маркера R)
  it('6g) случайный экземпляр уровня d и фиксированный экземпляр того же уровня d имеют разный taskData (маркер R)', () => {
    const seed = '7N3E9MK';
    const slots: SetSlot[] = [
      { taskId: 1, n1: 1, n2: 1, n3: 1, nR: 10 },
    ];
    const res = buildSet({ seed, title: 'Fixed vs R', slots });
    const fixedEntries = res.entries.slice(0, 3); // n1, n2, n3
    const rEntries = res.entries.slice(3); // nR

    for (const r of rEntries) {
      const matchingFixed = fixedEntries.find((f) => f.difficulty === r.difficulty);
      if (matchingFixed) {
        expect(r.subSeed).not.toBe(matchingFixed.subSeed);
        expect(JSON.stringify(r.taskData)).not.toBe(JSON.stringify(matchingFixed.taskData));
      }
    }
  });

  // 6h) encodeSetShort бросает Error при любом n > 20
  it('6h) encodeSetShort бросает Error при любом n > 20', () => {
    const seed = '7N3E9MK';
    expect(() =>
      encodeSetShort({
        seed,
        title: 'Error test',
        slots: [{ taskId: 1, n1: 21, n2: 0, n3: 0, nR: 0 }],
      })
    ).toThrow(/n1 exceeds maximum of 20/);

    expect(() =>
      encodeSetShort({
        seed,
        title: 'Error test',
        slots: [{ taskId: 2, n1: 0, n2: 0, n3: 0, nR: 25 }],
      })
    ).toThrow(/nR exceeds maximum of 20/);
  });

  // 6i) normalizeSeed сохраняет 7-значный base34-сид вербатим, а для 12345 даёт '12345'
  it('6i) normalizeSeed сохраняет 7-значный base34-сид вербатим, а для 12345 даёт "12345"', () => {
    expect(normalizeSeed('7N3E9MK')).toBe('7N3E9MK');
    expect(normalizeSeed('12345')).toBe('12345');
    expect(normalizeSeed('007')).toBe('7');
    expect(normalizeSeed('  ')).toMatch(/^[0-9A-HJ-NP-Z]{7}$/);
    expect(normalizeSeed(undefined)).toMatch(/^[0-9A-HJ-NP-Z]{7}$/);
  });

  // 6j) жёстко прописанные ожидаемые строки для A, B, C
  it('6j) жёстко прописанные ожидаемые строки для A, B, C с seed 1NHJ12L', () => {
    const seed = '1NHJ12L';
    const cfgA: SetConfig = {
      seed,
      title: 'A',
      slots: [{ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 }],
    };
    const codeA = encodeSetShort(cfgA);
    expect(codeA).toBe('S2-1NHJ12L-0UBS-000M');
    const decA = decodeSetShort(codeA);
    expect(decA).not.toBeNull();
    if (!decA || !decA.slots) throw new Error('decA null');
    expect(decA.slots.find((s) => s.taskId === 1)).toEqual({
      taskId: 1,
      n1: 0,
      n2: 1,
      n3: 0,
      nR: 0,
    });
    expect(
      decA.slots
        .filter((s) => s.taskId !== 1)
        .every((s) => s.n1 === 0 && s.n2 === 0 && s.n3 === 0 && s.nR === 0)
    ).toBe(true);

    const cfgB: SetConfig = {
      seed,
      title: 'B',
      slots: [{ taskId: 16, n1: 0, n2: 1, n3: 0, nR: 0 }],
    };
    const codeB = encodeSetShort(cfgB);
    expect(codeB).toBe('S2-1NHJ12L-0001-000M');
    const decB = decodeSetShort(codeB);
    expect(decB).not.toBeNull();
    if (!decB || !decB.slots) throw new Error('decB null');
    expect(decB.slots.find((s) => s.taskId === 16)).toEqual({
      taskId: 16,
      n1: 0,
      n2: 1,
      n3: 0,
      nR: 0,
    });
    expect(
      decB.slots
        .filter((s) => s.taskId !== 16)
        .every((s) => s.n1 === 0 && s.n2 === 0 && s.n3 === 0 && s.nR === 0)
    ).toBe(true);

    const cfgC: SetConfig = {
      seed,
      title: 'C',
      slots: [
        { taskId: 1, n1: 1, n2: 0, n3: 0, nR: 0 },
        { taskId: 2, n1: 1, n2: 0, n3: 0, nR: 0 },
        { taskId: 3, n1: 1, n2: 0, n3: 0, nR: 0 },
        { taskId: 4, n1: 1, n2: 0, n3: 0, nR: 0 },
        { taskId: 5, n1: 1, n2: 0, n3: 0, nR: 0 },
      ],
    };
    const codeC = encodeSetShort(cfgC);
    expect(codeC).toBe('S2-1NHJ12L-1LXA-00010001000100010001');
    const decC = decodeSetShort(codeC);
    expect(decC).not.toBeNull();
    if (!decC || !decC.slots) throw new Error('decC null');
    for (let t = 1; t <= 5; t++) {
      expect(decC.slots.find((s) => s.taskId === t)).toEqual({
        taskId: t,
        n1: 1,
        n2: 0,
        n3: 0,
        nR: 0,
      });
    }
    expect(
      decC.slots
        .filter((s) => s.taskId > 5)
        .every((s) => s.n1 === 0 && s.n2 === 0 && s.n3 === 0 && s.nR === 0)
    ).toBe(true);
  });

  // Детерминированность buildSet и дедупликация
  it('один и тот же SetConfig, вызванный дважды, даёт идентичные entries', () => {
    const cfg: SetConfig = {
      seed: '1NHJ12L',
      title: 'Контрольная',
      slots: [
        { taskId: 1, n1: 0, n2: 3, n3: 0, nR: 0 },
        { taskId: 6, n1: 2, n2: 0, n3: 0, nR: 0 },
        { taskId: 11, n1: 0, n2: 0, n3: 2, nR: 0 },
      ],
    };

    const run1 = buildSet(cfg);
    const run2 = buildSet(cfg);

    expect(JSON.stringify(run1.entries)).toBe(JSON.stringify(run2.entries));
    expect(run1.warnings).toEqual(run2.warnings);
    expect(run1.entries.length).toBe(7);
  });

  it('пять задач одного типа дедуплицируются', () => {
    const cfg: SetConfig = {
      seed: '1NHJ12L',
      title: 'Пять задач №1',
      slots: [{ taskId: 1, n1: 0, n2: 5, n3: 0, nR: 0 }],
    };

    const { entries, warnings } = buildSet(cfg);
    expect(entries.length).toBe(5);
    expect(warnings).toEqual([]);

    const signatures = entries.map((e) => JSON.stringify(e.taskData));
    const uniqueSignatures = new Set(signatures);
    expect(uniqueSignatures.size).toBe(5);
  });

  it('fileCode детерминирован, ровно 5 символов, разные наборы дают разные метки', () => {
    const cfg1: SetConfig = {
      seed: '1NHJ12A',
      title: 'Набор 1',
      slots: [{ taskId: 1, n1: 0, n2: 2, n3: 0, nR: 0 }],
    };
    const cfg2: SetConfig = {
      seed: '1NHJ12B',
      title: 'Набор 2',
      slots: [{ taskId: 1, n1: 0, n2: 2, n3: 0, nR: 0 }],
    };
    const code1a = fileCode(cfg1);
    const code1b = fileCode(cfg1);
    const code2 = fileCode(cfg2);

    expect(code1a).toBe(code1b);
    expect(code1a).toHaveLength(5);
    expect(code1a).toMatch(/^[0-9A-HJ-NP-Z]{5}$/);
    expect(code2).toHaveLength(5);
    expect(code1a).not.toBe(code2);
  });

  describe('S3 Format & Task Replacement Suite', () => {
    it('S3 encoding: пустой объект или отсутствие replacements даёт S2 код', () => {
      const cfgWithout: SetConfig = {
        seed: '1NHJ12L',
        title: 'Без замен',
        slots: [{ taskId: 1, n1: 0, n2: 2, n3: 0, nR: 0 }],
      };
      const cfgEmpty: SetConfig = {
        ...cfgWithout,
        replacements: {},
      };
      expect(encodeSetShort(cfgWithout).startsWith('S2-')).toBe(true);
      expect(encodeSetShort(cfgEmpty).startsWith('S2-')).toBe(true);
      expect(encodeSetShort(cfgWithout)).toBe(encodeSetShort(cfgEmpty));
    });

    it('S3 encoding & decoding round-trip с одной и несколькими заменами', () => {
      const cfg: SetConfig = {
        seed: '1NHJ12L',
        title: 'С заменой',
        slots: [
          { taskId: 1, n1: 0, n2: 3, n3: 0, nR: 0 },
          { taskId: 2, n1: 2, n2: 0, n3: 0, nR: 0 },
        ],
        replacements: {
          2: 12345678,
          4: 87654321,
        },
      };

      const code = encodeSetShort(cfg);
      expect(code.startsWith('S3-')).toBe(true);

      const decoded = decodeSetShort(code);
      expect(decoded).not.toBeNull();
      expect(decoded!.seed).toBe('1NHJ12L');
      expect(decoded!.replacements).toEqual({
        2: 12345678,
        4: 87654321,
      });
    });

    it('S3 encoding сортирует замены по позиции канонически', () => {
      const cfg1: SetConfig = {
        seed: '1NHJ12L',
        title: 'A',
        slots: [{ taskId: 1, n1: 5, n2: 0, n3: 0, nR: 0 }],
        replacements: { 2: 100, 4: 200 },
      };
      const cfg2: SetConfig = {
        seed: '1NHJ12L',
        title: 'B',
        slots: [{ taskId: 1, n1: 5, n2: 0, n3: 0, nR: 0 }],
        replacements: { 4: 200, 2: 100 },
      };
      expect(encodeSetShort(cfg1)).toBe(encodeSetShort(cfg2));
    });

    it('buildSet с replacements меняет только целевую позицию, сохраняет entry.id и не трогает остальные', () => {
      const baseCfg: SetConfig = {
        seed: '1NHJ12L',
        title: 'Тест замен',
        slots: [{ taskId: 1, n1: 0, n2: 3, n3: 0, nR: 0 }],
      };
      const baseRes = buildSet(baseCfg);
      expect(baseRes.entries.length).toBe(3);

      const replacedCfg: SetConfig = {
        ...baseCfg,
        replacements: { 2: 99999999 },
      };
      const repRes = buildSet(replacedCfg);
      expect(repRes.entries.length).toBe(3);

      // Позиция 1 и 3 должны быть идентичны
      expect(repRes.entries[0].subSeed).toBe(baseRes.entries[0].subSeed);
      expect(repRes.entries[0].taskData).toEqual(baseRes.entries[0].taskData);
      expect(repRes.entries[0].id).toBe(baseRes.entries[0].id);

      expect(repRes.entries[2].subSeed).toBe(baseRes.entries[2].subSeed);
      expect(repRes.entries[2].taskData).toEqual(baseRes.entries[2].taskData);
      expect(repRes.entries[2].id).toBe(baseRes.entries[2].id);

      // Позиция 2 заменена, но entry.id сохранён!
      expect(repRes.entries[1].subSeed).toBe(99999999);
      expect(repRes.entries[1].taskData).not.toEqual(baseRes.entries[1].taskData);
      expect(repRes.entries[1].id).toBe(baseRes.entries[1].id);
    });

    it('S3 невалидные коды возвращают null', () => {
      const validS2 = encodeSetShort({
        seed: '1NHJ12L',
        title: 'Test',
        slots: [{ taskId: 1, n1: 1, n2: 0, n3: 0, nR: 0 }],
      });
      // Превращаем S2 в S3 без хвоста reps
      const s3WithoutReps = 'S3' + validS2.slice(2);
      expect(decodeSetShort(s3WithoutReps)).toBeNull();

      // Неполный чанк (8 символов вместо 9)
      expect(decodeSetShort(s3WithoutReps + '-01000000')).toBeNull();

      // Недопустимая позиция 0
      expect(decodeSetShort(s3WithoutReps + '-000000001')).toBeNull();

      // Позиция больше количества заданий (всего 1 задание, позиция 2)
      expect(decodeSetShort(s3WithoutReps + '-020000001')).toBeNull();
    });

    it('S3 устойчивость к регистру, пробелам, дефисам; O->0 и I->1 в хвосте', () => {
      const cfg: SetConfig = {
        seed: '1NHJ12L',
        title: 'Test',
        slots: [{ taskId: 1, n1: 2, n2: 0, n3: 0, nR: 0 }],
        replacements: { 1: 100 },
      };
      const code = encodeSetShort(cfg);
      const corrupted = '  ' + code.replace(/0/g, 'O').replace(/1/g, 'I').toLowerCase() + '  ';
      const decoded = decodeSetShort(corrupted);
      expect(decoded).not.toBeNull();
      expect(decoded!.seed).toBe('1NHJ12L');
      expect(decoded!.replacements).toEqual({ 1: 100 });
    });
  });
});

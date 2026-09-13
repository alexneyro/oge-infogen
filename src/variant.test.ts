import { describe, it, expect } from 'vitest';
import {
  encodeVariant,
  decodeVariant,
  buildVariant,
  generateVariantSeed,
  VariantConfig,
  CONTENT_VERSION
} from './variant';
import { encodeSetShort, decodeSetShort, SetConfig } from './set';
import { BASE34_ALPHABET } from './utils/base34';
import { Difficulty } from './types';

describe('Variant reproducibility and serialization suite', () => {
  it('guarantees that identical variant link/code reproduces identical tasks and difficulties', () => {
    const testConfigs: VariantConfig[] = [
      {
        seed: 'OGE-ALPHA',
        difficulties: [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1],
        contentVersion: CONTENT_VERSION
      },
      {
        seed: 'OGE-BETA',
        difficulties: [3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 3, 3],
        contentVersion: CONTENT_VERSION
      },
      {
        seed: 'OGE-GAMMA',
        difficulties: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        contentVersion: CONTENT_VERSION
      }
    ];

    testConfigs.forEach(originalCfg => {
      const encodedCode = encodeVariant(originalCfg);
      const decodedCfgClientA = decodeVariant(encodedCode);
      const decodedCfgClientB = decodeVariant(encodedCode);

      expect(decodedCfgClientA).not.toBeNull();
      expect(decodedCfgClientB).not.toBeNull();

      expect(decodedCfgClientA!.difficulties).toEqual(originalCfg.difficulties);
      expect(decodedCfgClientB!.difficulties).toEqual(originalCfg.difficulties);
      expect(decodedCfgClientA!.seed).toBe(originalCfg.seed);
      expect(decodedCfgClientB!.seed).toBe(originalCfg.seed);

      const tasksClientA = buildVariant(decodedCfgClientA!);
      const tasksClientB = buildVariant(decodedCfgClientB!);

      expect(tasksClientA.length).toBe(16);
      expect(tasksClientB.length).toBe(16);

      expect(JSON.stringify(tasksClientA)).toBe(JSON.stringify(tasksClientB));

      tasksClientA.forEach((task, idx) => {
        expect(task.difficulty).toBe(originalCfg.difficulties[idx]);
      });
    });
  });

  // 6a) property-тест: 200 случайных конфигов
  it('property-test: 200 random configs roundtrip with exact seed and difficulties', () => {
    const fixedSeeds = ['OGE-8K2PQ', 'abc123', '007', '9А-контрольная'];

    for (let i = 0; i < 200; i++) {
      const isCanonical = i < 100;
      let seed: string;
      if (isCanonical) {
        seed = generateVariantSeed();
      } else if (i < 100 + fixedSeeds.length) {
        seed = fixedSeeds[i - 100];
      } else {
        const arbitrarySeeds = [
          'TEST-REBUILD-EMPTY',
          'variant-9Б',
          'Exam_2026!#',
          'hello world',
          '1234567890',
          'custom:seed:value'
        ];
        seed = arbitrarySeeds[i % arbitrarySeeds.length] + '-' + i;
      }

      const difficulties: Difficulty[] = Array.from({ length: 16 }, () =>
        (Math.floor(Math.random() * 3) + 1) as Difficulty
      );

      const cfg: VariantConfig = {
        seed,
        difficulties,
        contentVersion: CONTENT_VERSION
      };

      const code = encodeVariant(cfg);
      const decoded = decodeVariant(code);

      expect(decoded).not.toBeNull();
      expect(decoded!.seed).toBe(cfg.seed);
      expect(decoded!.difficulties).toEqual(cfg.difficulties);
    }
  });

  // 6b) для канонического сида length(encodeVariant(cfg)) === 16 (V2-<seed7>-<diff5>)
  it('canonical seed produces encoded variant code with exact length 16', () => {
    for (let i = 0; i < 20; i++) {
      const seed = generateVariantSeed();
      const difficulties: Difficulty[] = Array.from({ length: 16 }, () =>
        (Math.floor(Math.random() * 3) + 1) as Difficulty
      );
      const cfg: VariantConfig = {
        seed,
        difficulties,
        contentVersion: CONTENT_VERSION
      };
      const code = encodeVariant(cfg);
      expect(code.length).toBe(16);
      expect(code.startsWith('V2-')).toBe(true);
      expect(code.split('-').length).toBe(3);
    }
  });

  // 6c) buildVariant(cfg) глубоко равен buildVariant(decodeVariant(encodeVariant(cfg)))
  it('buildVariant reproduces identical task instances after encode/decode', () => {
    const testSeeds = [generateVariantSeed(), 'OGE-8K2PQ', '9А-контрольная'];
    testSeeds.forEach(seed => {
      const cfg: VariantConfig = {
        seed,
        difficulties: [1, 2, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 2, 3],
        contentVersion: CONTENT_VERSION
      };
      const originalTasks = buildVariant(cfg);
      const roundtripConfig = decodeVariant(encodeVariant(cfg))!;
      const rebuiltTasks = buildVariant(roundtripConfig);

      expect(rebuiltTasks).toEqual(originalTasks);
    });
  });

  // 6d) невалидный вход → null
  it('rejects invalid codes with null', () => {
    expect(decodeVariant('')).toBeNull();
    expect(decodeVariant('ZZZ')).toBeNull();
    expect(decodeVariant('2-')).toBeNull();
    expect(decodeVariant('V2-')).toBeNull();
    expect(decodeVariant('V2-8K2PQ')).toBeNull();
    expect(decodeVariant('V2-ABCDEFG-ZZZZZ')).toBeNull();
    expect(decodeVariant('V2X-00000-')).toBeNull();
    // Старый формат 2- не поддерживается
    expect(decodeVariant('2-8K2PQ-00000')).toBeNull();
    // Старый base64 больше не поддерживается
    const oldBase64 = 'JTdCJTIydiUyMiUzQTIlMkMlMjJkJTIyJTNBJTIyMTExMTExMTExMTExMTExMSUyMiUyQyUyMnMlMjIlM0ElMjJPR0UtVFJJQUwlMjIlN0Q';
    expect(decodeVariant(oldBase64)).toBeNull();
  });

  // 6e) generateVariantSeed: 1000 вызовов — всегда ровно 7 символов, все символы из BASE34_ALPHABET, нет I и O, доля дублей 0
  it('generateVariantSeed produces unique 7-character base34 seeds without I and O', () => {
    const seen = new Set<string>();
    const base34CharSet = new Set(BASE34_ALPHABET.split(''));

    for (let i = 0; i < 1000; i++) {
      const seed = generateVariantSeed();
      expect(seed.length).toBe(7);
      expect(seed.includes('I')).toBe(false);
      expect(seed.includes('O')).toBe(false);
      for (const ch of seed) {
        expect(base34CharSet.has(ch)).toBe(true);
      }
      seen.add(seed);
    }
    expect(seen.size).toBe(1000);
  });

  // 6f) стабильность: смена difficulties[6] при том же сиде оставляет taskData остальных 15 заданий глубоко равными
  it('stability: changing difficulty of task 7 leaves all other 15 tasks deeply equal', () => {
    const seed = generateVariantSeed();
    const diffsA: Difficulty[] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const diffsB: Difficulty[] = [1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1];

    const tasksA = buildVariant({ seed, difficulties: diffsA, contentVersion: CONTENT_VERSION });
    const tasksB = buildVariant({ seed, difficulties: diffsB, contentVersion: CONTENT_VERSION });

    expect(tasksA.length).toBe(16);
    expect(tasksB.length).toBe(16);

    for (let i = 0; i < 16; i++) {
      if (i === 6) {
        expect(tasksA[i].difficulty).toBe(1);
        expect(tasksB[i].difficulty).toBe(3);
      } else {
        expect(tasksA[i].taskData).toEqual(tasksB[i].taskData);
      }
    }
  });

  // 4a) декод компактного кода, набранного вручную с ошибками (O→0, I→1, пробелы, строчные, без дефисов)
  it('decodes manually typed compact codes with typos, spaces, lowercase, and without hyphens', () => {
    const canonicalSeed = '8K2PQ7M';
    // Сложности с цифрами 0 и 1 в 5-символьном diff:
    const cfg: VariantConfig = {
      seed: canonicalSeed,
      difficulties: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // diff5 = '00000'
      contentVersion: CONTENT_VERSION
    };

    const standardCode = encodeVariant(cfg); // V2-8K2PQ7M-00000
    const expected = decodeVariant(standardCode);
    expect(expected).not.toBeNull();

    // Замена 0 на O, пробелы вместо дефисов, нижний регистр
    const codeWithOAndSpaces = 'v2 8k2pq7m ooooo';
    expect(decodeVariant(codeWithOAndSpaces)).toEqual(expected);

    // Без дефисов и пробелов, со смешанными O
    const codeNoHyphens = 'V28K2PQ7MOOOOO';
    expect(decodeVariant(codeNoHyphens)).toEqual(expected);

    // Тест с 1 -> I
    const cfgWithOnes: VariantConfig = {
      seed: '8K2PQ7M',
      difficulties: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      contentVersion: CONTENT_VERSION
    };
    const codeOnes = encodeVariant(cfgWithOnes);
    // Заменяем цифры 1 на I, строчный регистр
    const codeWithI = codeOnes.toLowerCase().replace(/1/g, 'i').replace(/-/g, ' ');
    expect(decodeVariant(codeWithI)).toEqual(cfgWithOnes);
  });

  // 4b) взаимная изоляция: decodeVariant(encodeSetShort) === null && decodeSetShort(encodeVariant) === null
  it('guarantees complete mutual rejection between set codes and variant codes', () => {
    const sampleSet: SetConfig = {
      seed: '1156',
      title: 'Контрольный набор',
      slots: [
        { taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 2, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 3, n1: 0, n2: 1, n3: 0, nR: 0 }
      ]
    };

    const setCode = encodeSetShort(sampleSet);
    expect(decodeVariant(setCode)).toBeNull();

    const variantCode = encodeVariant({
      seed: generateVariantSeed(),
      difficulties: [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1],
      contentVersion: CONTENT_VERSION
    });
    expect(decodeSetShort(variantCode)).toBeNull();
  });

  // 4c) round-trip через sessionStorage и отбрасывание мусора без throw
  it('roundtrips valid state through sessionStorage and discards junk gracefully', () => {
    const STORAGE_KEY = 'oge_variant_state_v1';
    const originalCfg: VariantConfig = {
      seed: generateVariantSeed(),
      difficulties: [1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1],
      contentVersion: CONTENT_VERSION
    };
    const validCode = encodeVariant(originalCfg);

    // Сохранение
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, code: validCode }));

    // Восстановление
    const loadedRaw = sessionStorage.getItem(STORAGE_KEY);
    expect(loadedRaw).not.toBeNull();
    const parsedData = JSON.parse(loadedRaw!);
    expect(parsedData.version).toBe(1);

    const restoredCfg = decodeVariant(parsedData.code);
    expect(restoredCfg).toEqual(originalCfg);

    // Запись невалидного кода
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, code: 'INVALID-TRASH-DATA' }));

    expect(() => {
      const junkRaw = sessionStorage.getItem(STORAGE_KEY);
      const junkData = JSON.parse(junkRaw!);
      const decodedJunk = decodeVariant(junkData.code);
      if (!decodedJunk) {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }).not.toThrow();

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

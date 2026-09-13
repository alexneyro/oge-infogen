import { Difficulty } from './types';
import { hashSeed, makeRng } from './utils/rng';
import { getTaskById } from './tasks';
import { getAnswerKey } from './utils/answerKey';
import { numToBase34, base34ToNum, generateSetSeed } from './utils/base34';

export const SET_VERSION = 2;

export function mix32(x: number): number {
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

/**
 * Нормализует сид набора:
 * - если строка пустая/undefined/только пробелы — генерирует случайный 7-значный base34-сид;
 * - если строка канонический 7-значный base34 сид (/^[0-9A-HJ-NP-Z]{7}$/) — возвращает вербатим;
 * - если строка состоит только из цифр — возвращает её без ведущих нулей (или '0', если все нули);
 * - иначе возвращает строковое представление 32-битного хеша String(hashSeed(seed)).
 */
export function normalizeSeed(seed?: string): string {
  const trimmed = (seed ?? '').trim();
  if (!trimmed) {
    return generateSetSeed();
  }
  if (/^[0-9A-HJ-NP-Z]{7}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d+$/.test(trimmed)) {
    const withoutLeadingZeros = trimmed.replace(/^0+/, '');
    return withoutLeadingZeros.length > 0 ? withoutLeadingZeros : '0';
  }
  return String(hashSeed(trimmed));
}

export interface SetSlot {
  taskId: number;
  n1: number;
  n2: number;
  n3: number;
  nR: number;
}

export interface SetConfig {
  seed: string;
  slots?: SetSlot[];
  title: string;
  replacements?: Record<number, number>; // position (1-based) -> subSeed (uint32)
}

export interface SetEntry {
  position: number; // 1-based, порядок в наборе
  taskId: number;
  difficulty: Difficulty;
  subSeed: number;
  taskData: any;
  id: string; // уникален в пределах набора
}

export interface BuildSetResult {
  entries: SetEntry[];
  warnings: string[];
}

export function buildSet(cfg: SetConfig): BuildSetResult {
  const normSeed = normalizeSeed(cfg.seed);
  const entries: SetEntry[] = [];
  const warnings: string[] = [];

  let currentPosition = 1;
  const warnedTaskUnserializable = new Set<number>();
  // Map of taskId -> Map<answerSignature, firstPosition>
  const taskAnswerSignatures = new Map<number, Map<string, number>>();

  const rawSlots = cfg.slots || [];
  const sortedSlots = [...rawSlots].sort((a, b) => a.taskId - b.taskId);

  for (const slot of sortedSlots) {
    const mod = getTaskById(slot.taskId);
    if (!mod) {
      warnings.push(`Задание с номером ${slot.taskId} не найдено в реестре и было пропущено.`);
      continue;
    }

    const n1 = Math.max(0, Math.min(20, Math.floor(slot.n1 || 0)));
    const n2 = Math.max(0, Math.min(20, Math.floor(slot.n2 || 0)));
    const n3 = Math.max(0, Math.min(20, Math.floor(slot.n3 || 0)));
    const nR = Math.max(0, Math.min(20, Math.floor(slot.nR || 0)));

    if (n1 + n2 + n3 + nR === 0) {
      continue;
    }

    if (!taskAnswerSignatures.has(slot.taskId)) {
      taskAnswerSignatures.set(slot.taskId, new Map<string, number>());
    }
    const seenAnswerSignatures = taskAnswerSignatures.get(slot.taskId)!;

    // Fixed difficulty groups: diff 1, 2, 3
    const diffGroups: { diff: Difficulty; count: number }[] = [
      { diff: 1, count: n1 },
      { diff: 2, count: n2 },
      { diff: 3, count: n3 },
    ];

    for (const group of diffGroups) {
      if (group.count <= 0) continue;
      const seenSignatures = new Set<string>();

      for (let localIndex = 1; localIndex <= group.count; localIndex++) {
        const position = currentPosition++;
        const baseSeed = hashSeed(`${normSeed}|${slot.taskId}|${group.diff}|${localIndex}`);
        let finalSubSeed = mix32(baseSeed) || 1;
        let taskData: any = null;
        let fullSignature = '';
        let isUnique = false;

        const MAX_RETRIES = 20;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          if (attempt > 0) {
            const retryBase = hashSeed(`${normSeed}|${slot.taskId}|${group.diff}|${localIndex}|retry${attempt}`);
            finalSubSeed = mix32(retryBase ^ Math.imul(attempt, 0x85ebca6b)) || 1;
          }

          const rng = makeRng(finalSubSeed);
          taskData = mod.generate(group.diff, rng);
          const ansKey = getAnswerKey(slot.taskId, taskData);

          try {
            fullSignature = JSON.stringify(taskData) + '::' + ansKey.signature;
          } catch {
            if (!warnedTaskUnserializable.has(slot.taskId)) {
              warnedTaskUnserializable.add(slot.taskId);
              warnings.push(`Задание ${slot.taskId}: структура taskData не сериализуема, дедупликация пропущена.`);
            }
            isUnique = true;
            break;
          }

          if (!seenSignatures.has(fullSignature)) {
            seenSignatures.add(fullSignature);
            isUnique = true;
            break;
          }
        }

        if (!isUnique) {
          warnings.push(
            `Задание ${slot.taskId} (уровень ${group.diff}): не удалось получить ${group.count} уникальных вариантов, есть повторы.`
          );
        }

        // Check answer duplicate signature within same taskId
        let ansKey = getAnswerKey(slot.taskId, taskData);
        if (ansKey.signature) {
          if (seenAnswerSignatures.has(ansKey.signature)) {
            const firstPos = seenAnswerSignatures.get(ansKey.signature)!;
            const retryAnsBase = hashSeed(`${normSeed}|${slot.taskId}|${group.diff}|${localIndex}|retryAns1`);
            const candidateSubSeed = mix32(retryAnsBase ^ 0xa435b871) || 1;
            const candidateRng = makeRng(candidateSubSeed);
            const candidateData = mod.generate(group.diff, candidateRng);
            const candidateAnsKey = getAnswerKey(slot.taskId, candidateData);

            if (candidateAnsKey.signature && !seenAnswerSignatures.has(candidateAnsKey.signature)) {
              taskData = candidateData;
              finalSubSeed = candidateSubSeed;
              ansKey = candidateAnsKey;
              seenAnswerSignatures.set(candidateAnsKey.signature, position);
            } else {
              warnings.push(
                `Задание ${slot.taskId} (уровень ${group.diff}): у позиций ${firstPos} и ${position} одинаковый ответ — в базе мало материала, уменьшите количество или дождитесь наполнения.`
              );
            }
          } else {
            seenAnswerSignatures.set(ansKey.signature, position);
          }
        }

        entries.push({
          position,
          taskId: slot.taskId,
          difficulty: group.diff,
          subSeed: finalSubSeed,
          taskData,
          id: `${cfg.seed}-${slot.taskId}-${position}`,
        });
      }
    }

    // Random difficulty group (nR)
    if (nR > 0) {
      const seenSignatures = new Set<string>();

      for (let k = 1; k <= nR; k++) {
        const position = currentPosition++;
        const resolvedDiff = ((hashSeed(`${normSeed}|R|${slot.taskId}|${k}`) % 3) + 1) as Difficulty;
        const tag = `R${k}`;

        const baseSeed = hashSeed(`${normSeed}|${slot.taskId}|${resolvedDiff}|${tag}`);
        let finalSubSeed = mix32(baseSeed) || 1;
        let taskData: any = null;
        let fullSignature = '';
        let isUnique = false;

        const MAX_RETRIES = 20;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          if (attempt > 0) {
            const retryBase = hashSeed(`${normSeed}|${slot.taskId}|${resolvedDiff}|${tag}|retry${attempt}`);
            finalSubSeed = mix32(retryBase ^ Math.imul(attempt, 0x85ebca6b)) || 1;
          }

          const rng = makeRng(finalSubSeed);
          taskData = mod.generate(resolvedDiff, rng);
          const ansKey = getAnswerKey(slot.taskId, taskData);

          try {
            fullSignature = JSON.stringify(taskData) + '::' + ansKey.signature;
          } catch {
            if (!warnedTaskUnserializable.has(slot.taskId)) {
              warnedTaskUnserializable.add(slot.taskId);
              warnings.push(`Задание ${slot.taskId}: структура taskData не сериализуема, дедупликация пропущена.`);
            }
            isUnique = true;
            break;
          }

          if (!seenSignatures.has(fullSignature)) {
            seenSignatures.add(fullSignature);
            isUnique = true;
            break;
          }
        }

        if (!isUnique) {
          warnings.push(
            `Задание ${slot.taskId} (уровень ${resolvedDiff}): не удалось получить ${nR} уникальных вариантов, есть повторы.`
          );
        }

        let ansKey = getAnswerKey(slot.taskId, taskData);
        if (ansKey.signature) {
          if (seenAnswerSignatures.has(ansKey.signature)) {
            const firstPos = seenAnswerSignatures.get(ansKey.signature)!;
            const retryAnsBase = hashSeed(`${normSeed}|${slot.taskId}|${resolvedDiff}|${tag}|retryAns1`);
            const candidateSubSeed = mix32(retryAnsBase ^ 0xa435b871) || 1;
            const candidateRng = makeRng(candidateSubSeed);
            const candidateData = mod.generate(resolvedDiff, candidateRng);
            const candidateAnsKey = getAnswerKey(slot.taskId, candidateData);

            if (candidateAnsKey.signature && !seenAnswerSignatures.has(candidateAnsKey.signature)) {
              taskData = candidateData;
              finalSubSeed = candidateSubSeed;
              ansKey = candidateAnsKey;
              seenAnswerSignatures.set(candidateAnsKey.signature, position);
            } else {
              warnings.push(
                `Задание ${slot.taskId} (уровень ${resolvedDiff}): у позиций ${firstPos} и ${position} одинаковый ответ — в базе мало материала, уменьшите количество или дождитесь наполнения.`
              );
            }
          } else {
            seenAnswerSignatures.set(ansKey.signature, position);
          }
        }

        entries.push({
          position,
          taskId: slot.taskId,
          difficulty: resolvedDiff,
          subSeed: finalSubSeed,
          taskData,
          id: `${cfg.seed}-${slot.taskId}-${position}`,
        });
      }
    }
  }

  // Post-processing: apply individual task replacements
  if (cfg.replacements && typeof cfg.replacements === 'object') {
    for (const [posStr, subSeedVal] of Object.entries(cfg.replacements)) {
      const pos = Number(posStr);
      if (!Number.isInteger(pos) || pos < 1 || typeof subSeedVal !== 'number' || isNaN(subSeedVal)) {
        continue;
      }
      const entry = entries.find((e) => e.position === pos);
      if (!entry) continue;

      const mod = getTaskById(entry.taskId);
      if (!mod) continue;

      const finalSubSeed = (subSeedVal >>> 0) || 1;
      const rng = makeRng(finalSubSeed);
      const newTaskData = mod.generate(entry.difficulty, rng);

      entry.subSeed = finalSubSeed;
      entry.taskData = newTaskData;
      // entry.id is strictly preserved
    }
  }

  return { entries, warnings };
}

export { BASE34_ALPHABET, generateSetSeed } from './utils/base34';

export function encodeItemSlot(slot: SetSlot): string {
  if (slot.n1 > 20) throw new Error(`n1 exceeds maximum of 20 for task ${slot.taskId}`);
  if (slot.n2 > 20) throw new Error(`n2 exceeds maximum of 20 for task ${slot.taskId}`);
  if (slot.n3 > 20) throw new Error(`n3 exceeds maximum of 20 for task ${slot.taskId}`);
  if (slot.nR > 20) throw new Error(`nR exceeds maximum of 20 for task ${slot.taskId}`);
  if (slot.n1 < 0 || slot.n2 < 0 || slot.n3 < 0 || slot.nR < 0) {
    throw new Error(`Count out of bounds (0..20) for task ${slot.taskId}`);
  }
  const val = slot.n1 + 21 * slot.n2 + 441 * slot.n3 + 9261 * slot.nR;
  return numToBase34(val).padStart(4, '0');
}

export function decodeItemSlot(str4: string, taskId: number): SetSlot | null {
  if (str4.length !== 4) return null;
  const val = base34ToNum(str4);
  if (val < 0 || val > 194480) return null;
  let rem = val;
  const n1 = rem % 21;
  rem = Math.floor(rem / 21);
  const n2 = rem % 21;
  rem = Math.floor(rem / 21);
  const n3 = rem % 21;
  rem = Math.floor(rem / 21);
  const nR = rem % 21;
  return { taskId, n1, n2, n3, nR };
}

/**
 * Кодирует SetConfig в короткий бумажный код версии 2.
 * Кодирует ТОЛЬКО seed и slots (название набора не входит).
 * Схема: S2-<seed7>-<mask4>-<slotsPayload>
 */
export function encodeSetShort(cfg: SetConfig): string {
  let seed7 = '';
  const trimmed = (cfg.seed ?? '').trim();
  if (/^[0-9A-HJ-NP-Z]{7}$/.test(trimmed)) {
    seed7 = trimmed;
  } else {
    const norm = normalizeSeed(cfg.seed);
    if (/^[0-9A-HJ-NP-Z]{7}$/.test(norm)) {
      seed7 = norm;
    } else {
      const seedNum = parseInt(norm, 10);
      seed7 = numToBase34(isNaN(seedNum) ? hashSeed(norm) : seedNum).padStart(7, '0');
    }
  }

  const rawSlots = cfg.slots || [];
  const slotMap = new Map<number, SetSlot>();
  for (const s of rawSlots) {
    if (s.taskId >= 1 && s.taskId <= 16) {
      if (s.n1 > 20) throw new Error(`n1 exceeds maximum of 20 for task ${s.taskId}`);
      if (s.n2 > 20) throw new Error(`n2 exceeds maximum of 20 for task ${s.taskId}`);
      if (s.n3 > 20) throw new Error(`n3 exceeds maximum of 20 for task ${s.taskId}`);
      if (s.nR > 20) throw new Error(`nR exceeds maximum of 20 for task ${s.taskId}`);
      if (s.n1 < 0 || s.n2 < 0 || s.n3 < 0 || s.nR < 0) {
        throw new Error(`Count out of bounds (0..20) for task ${s.taskId}`);
      }
      slotMap.set(s.taskId, s);
    }
  }

  // mask4: бит 15 (0x8000) = задание 1, бит 0 = задание 16, MSB-first
  let mask = 0;
  const activeSlots: SetSlot[] = [];
  for (let t = 1; t <= 16; t++) {
    const s = slotMap.get(t);
    if (s && (s.n1 > 0 || s.n2 > 0 || s.n3 > 0 || s.nR > 0)) {
      mask |= (1 << (16 - t));
      activeSlots.push(s);
    }
  }

  if (mask === 0) {
    mask = (1 << 15);
    activeSlots.push({ taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 });
  }

  const mask4 = numToBase34(mask).padStart(4, '0');
  const slotsEncoded = activeSlots.map(encodeItemSlot).join('');

  // Encode replacements if present
  const totalEntries = activeSlots.reduce((sum, s) => sum + s.n1 + s.n2 + s.n3 + s.nR, 0);
  const rawReps = cfg.replacements || {};
  const validReps: [number, number][] = [];

  for (const [k, v] of Object.entries(rawReps)) {
    const pos = Number(k);
    if (
      Number.isInteger(pos) &&
      pos >= 1 &&
      pos <= totalEntries &&
      typeof v === 'number' &&
      !isNaN(v)
    ) {
      validReps.push([pos, v >>> 0]);
    }
  }

  if (validReps.length === 0) {
    return `S2-${seed7}-${mask4}-${slotsEncoded}`;
  }

  // Deterministic order: sort by position ascending
  validReps.sort((a, b) => a[0] - b[0]);

  const repsEncoded = validReps
    .map(([pos, seed]) => {
      const posStr = numToBase34(pos).padStart(2, '0');
      const seedStr = numToBase34(seed).padStart(7, '0');
      return `${posStr}${seedStr}`;
    })
    .join('');

  return `S3-${seed7}-${mask4}-${slotsEncoded}-${repsEncoded}`;
}

/**
 * Декодирует короткий код набора формата S2 или S3 (с заменами).
 * Регистронезависимо, игнорирует пробелы и дефисы, нормализует O->0 и I->1 только после S2/S3.
 * При ошибке возвращает null.
 */
export function decodeSetShort(code: string): SetConfig | null {
  if (!code || typeof code !== 'string') return null;

  try {
    const trimmed = code.trim().toUpperCase();
    const noHyphensSpaces = trimmed.replace(/[\s-]/g, '');
    const isS2 = noHyphensSpaces.startsWith('S2');
    const isS3 = noHyphensSpaces.startsWith('S3');
    if (!isS2 && !isS3) return null;

    const rawBody = noHyphensSpaces.slice(2);
    const body = rawBody.replace(/O/g, '0').replace(/I/g, '1');

    if (body.length < 11) return null;

    const seedPart = body.slice(0, 7);
    if (!/^[0-9A-HJ-NP-Z]{7}$/.test(seedPart)) return null;

    const maskPart = body.slice(7, 11);
    const mask = base34ToNum(maskPart);
    if (mask <= 0 || mask >= 65536) return null;

    let popcount = 0;
    for (let i = 0; i < 16; i++) {
      if ((mask & (1 << i)) !== 0) popcount++;
    }

    if (popcount === 0) return null;
    const basePayloadLen = 11 + 4 * popcount;

    if (isS2) {
      if (body.length !== basePayloadLen) return null;
    } else {
      const repsLen = body.length - basePayloadLen;
      if (repsLen <= 0 || repsLen % 9 !== 0) return null;
    }

    const payload = body.slice(11, basePayloadLen);
    let payloadIdx = 0;
    const slots: SetSlot[] = [];

    for (let t = 1; t <= 16; t++) {
      if ((mask & (1 << (16 - t))) !== 0) {
        const str4 = payload.slice(payloadIdx, payloadIdx + 4);
        payloadIdx += 4;
        const decodedSlot = decodeItemSlot(str4, t);
        if (!decodedSlot) return null;
        if (decodedSlot.n1 === 0 && decodedSlot.n2 === 0 && decodedSlot.n3 === 0 && decodedSlot.nR === 0) {
          return null;
        }
        slots.push(decodedSlot);
      } else {
        slots.push({ taskId: t, n1: 0, n2: 0, n3: 0, nR: 0 });
      }
    }

    let replacements: Record<number, number> | undefined = undefined;
    if (isS3) {
      const totalEntries = slots.reduce((sum, s) => sum + s.n1 + s.n2 + s.n3 + s.nR, 0);
      const repsPart = body.slice(basePayloadLen);
      replacements = {};
      for (let i = 0; i < repsPart.length; i += 9) {
        const posStr = repsPart.slice(i, i + 2);
        const seedStr = repsPart.slice(i + 2, i + 9);
        const pos = base34ToNum(posStr);
        const subSeed = base34ToNum(seedStr);
        if (pos <= 0 || pos > totalEntries) return null;
        if (subSeed < 0 || subSeed > 0xffffffff) return null;
        replacements[pos] = subSeed;
      }
    }

    return {
      seed: seedPart,
      title: '',
      slots,
      ...(replacements && Object.keys(replacements).length > 0 ? { replacements } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Алиас для совместимости с внешними модулями экспорта.
 */
export function encodeSet(cfg: SetConfig): string {
  return encodeSetShort(cfg);
}

/**
 * Возвращает короткий бумажный код набора (encodeSetShort).
 * Безопасен для использования в именах файлов, печати и README.
 */
export function shortSetCode(cfg: SetConfig): string {
  return encodeSetShort(cfg);
}

/**
 * Возвращает 5-символьную метку набора из BASE34_ALPHABET для формирования имён файлов.
 * Формируется как base34 от mix32(hashSeed(encodeSetShort(cfg))), дополненный нулями слева до 5 символов.
 * Это только метка для файлов, набор она не восстанавливает.
 */
export function fileCode(cfg: SetConfig): string {
  const shortCode = encodeSetShort(cfg);
  const hash = mix32(hashSeed(shortCode));
  const num5 = hash % (34 ** 5);
  return numToBase34(num5).padStart(5, '0');
}

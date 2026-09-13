import { Difficulty, TaskInstance } from './types';
import { hashSeed, makeRng } from './utils/rng';
import { OGE_TASKS } from './tasks';
import { numToBase34, base34ToNum, generateBase34Seed } from './utils/base34';

export const CONTENT_VERSION = 2;

export interface VariantConfig {
  seed: string;
  difficulties: Difficulty[];
  contentVersion: number;
}

export function generateVariantSeed(): string {
  return generateBase34Seed(7);
}

export function buildVariant(cfg: VariantConfig): TaskInstance[] {
  return OGE_TASKS.map((mod, idx) => {
    const diff = cfg.difficulties[idx] ?? cfg.difficulties[0] ?? 1;
    const subSeed = hashSeed(`${cfg.seed}|${mod.id}|${diff}`);
    const rng = makeRng(subSeed);
    const taskData = mod.generate(diff, rng);

    return {
      id: `${cfg.seed}-${mod.id}`,
      taskId: mod.id,
      difficulty: diff,
      taskData
    };
  });
}

export function encodeVariant(cfg: VariantConfig): string {
  const diffs: Difficulty[] = [];
  for (let i = 0; i < 16; i++) {
    const d = cfg.difficulties?.[i] ?? 1;
    diffs.push(d >= 1 && d <= 3 ? d : 1);
  }
  let num = 0;
  for (let i = 0; i < 16; i++) {
    num = num * 3 + (diffs[i] - 1);
  }
  const diff5 = numToBase34(num).padStart(5, '0');

  if (typeof cfg.seed === 'string' && /^[0-9A-HJ-NP-Z]{7}$/.test(cfg.seed)) {
    return `V2-${cfg.seed}-${diff5}`;
  }

  return `V2X-${diff5}-${cfg.seed}`;
}

export function decodeVariant(code: string): VariantConfig | null {
  if (!code || typeof code !== 'string') return null;
  const trimmed = code.trim();
  if (!trimmed) return null;

  // 1) Extended form: starts with 'V2X-' (case-insensitive prefix check)
  if (trimmed.slice(0, 4).toUpperCase() === 'V2X-') {
    const secondHyphen = trimmed.indexOf('-', 4);
    if (secondHyphen === -1) return null;
    const diffPart = trimmed.slice(4, secondHyphen);
    const seedPart = trimmed.slice(secondHyphen + 1);
    if (!seedPart) return null;
    if (diffPart.length !== 5) return null;

    const diffNum = base34ToNum(diffPart);
    if (diffNum < 0 || diffNum >= 43046721) return null;

    const diffs: Difficulty[] = [];
    let rem = diffNum;
    for (let p = 15; p >= 0; p--) {
      const pow = Math.pow(3, p);
      const digit = Math.floor(rem / pow);
      if (digit < 0 || digit > 2) return null;
      diffs.push((digit + 1) as Difficulty);
      rem %= pow;
    }

    return {
      seed: seedPart,
      difficulties: diffs,
      contentVersion: CONTENT_VERSION
    };
  }

  // 2) Compact form: must start with 'V2' (case-insensitive), 14 characters total after removing spaces/hyphens
  const upper = trimmed.toUpperCase();
  const noSpacesHyphens = upper.replace(/[\s-]/g, '');
  if (noSpacesHyphens.startsWith('V2') && noSpacesHyphens.length === 14) {
    const prefix = 'V2';
    const rest = noSpacesHyphens.slice(2).replace(/O/g, '0').replace(/I/g, '1');
    const cleaned = prefix + rest;
    const seedPart = cleaned.slice(2, 9);
    const diffPart = cleaned.slice(9, 14);

    if (!/^[0-9A-HJ-NP-Z]{7}$/.test(seedPart)) return null;

    const diffNum = base34ToNum(diffPart);
    if (diffNum < 0 || diffNum >= 43046721) return null;

    const diffs: Difficulty[] = [];
    let rem = diffNum;
    for (let p = 15; p >= 0; p--) {
      const pow = Math.pow(3, p);
      const digit = Math.floor(rem / pow);
      if (digit < 0 || digit > 2) return null;
      diffs.push((digit + 1) as Difficulty);
      rem %= pow;
    }

    return {
      seed: seedPart,
      difficulties: diffs,
      contentVersion: CONTENT_VERSION
    };
  }

  return null;
}

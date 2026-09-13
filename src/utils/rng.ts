export interface RNG {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(arr: T[]): T;
  shuffle<T>(arr: T[]): T[];
}

export function hashSeed(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function makeRng(seed: number): RNG {
  let state = seed >>> 0;

  const next = (): number => {
    let t = (state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    const floorMin = Math.ceil(min);
    const floorMax = Math.floor(max);
    if (floorMin >= floorMax) return floorMin;
    return Math.floor(next() * (floorMax - floorMin + 1)) + floorMin;
  };

  const pick = <T>(arr: T[]): T => {
    if (!arr || arr.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const index = Math.floor(next() * arr.length);
    return arr[index];
  };

  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  };

  return { next, int, pick, shuffle };
}

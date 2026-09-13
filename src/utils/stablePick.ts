import { hashSeed } from './rng';
import { mix32 } from '../set';

export function weightOf(seed: number, tag: string, id: string): number {
  return mix32(hashSeed(`${seed}|${tag}|${id}`));
}

export function pickStable<T>(
  items: T[],
  seed: number,
  tag: string,
  idOf: (item: T) => string
): T {
  if (!items || items.length === 0) {
    throw new Error('Cannot pick from empty array');
  }

  let bestItem = items[0];
  let bestId = idOf(bestItem);
  let bestWeight = weightOf(seed, tag, bestId);

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const id = idOf(item);
    const weight = weightOf(seed, tag, id);
    if (weight > bestWeight || (weight === bestWeight && id < bestId)) {
      bestItem = item;
      bestId = id;
      bestWeight = weight;
    }
  }

  return bestItem;
}

export function pickManyStable<T>(
  items: T[],
  seed: number,
  tag: string,
  idOf: (item: T) => string,
  count: number
): T[] {
  if (!items || items.length === 0 || count <= 0) {
    return [];
  }

  const decorated = items.map((item) => {
    const id = idOf(item);
    const weight = weightOf(seed, tag, id);
    return { item, id, weight };
  });

  decorated.sort((a, b) => {
    if (b.weight > a.weight) return 1;
    if (b.weight < a.weight) return -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const take = Math.min(count, decorated.length);
  return decorated.slice(0, take).map((d) => d.item);
}

export function shuffleStable<T>(
  items: T[],
  seed: number,
  tag: string,
  idOf: (item: T) => string
): T[] {
  return pickManyStable(items, seed, tag, idOf, items.length);
}

import { describe, it, expect } from 'vitest';
import {
  weightOf,
  pickStable,
  pickManyStable,
  shuffleStable,
} from '../stablePick';

interface Item {
  id: string;
  name: string;
}

describe('stablePick utility', () => {
  it('независимость от порядка: pickStable на массиве и на его reverse() даёт один результат', () => {
    const items: Item[] = [
      { id: 'item_1', name: 'Первый' },
      { id: 'item_2', name: 'Второй' },
      { id: 'item_3', name: 'Третий' },
      { id: 'item_4', name: 'Четвертый' },
      { id: 'item_5', name: 'Пятый' },
      { id: 'item_6', name: 'Шестой' },
      { id: 'item_7', name: 'Седьмой' },
      { id: 'item_8', name: 'Восьмой' },
    ];
    const reversed = [...items].reverse();

    for (let seed = 1; seed <= 50; seed++) {
      const normalResult = pickStable(items, seed, 'order_test', (x) => x.id);
      const reversedResult = pickStable(reversed, seed, 'order_test', (x) => x.id);
      expect(normalResult.id).toBe(reversedResult.id);
    }
  });

  it('независимость от длины: при добавлении 50 новых элементов к пулу из 50 доля изменившихся результатов по 1000 сидам не превышает 60%', () => {
    const pool50: Item[] = Array.from({ length: 50 }, (_, i) => ({
      id: `id_${i}`,
      name: `Item ${i}`,
    }));
    const pool100: Item[] = Array.from({ length: 100 }, (_, i) => ({
      id: `id_${i}`,
      name: `Item ${i}`,
    }));

    let changedCount = 0;
    const totalSeeds = 1000;

    for (let seed = 1; seed <= totalSeeds; seed++) {
      const res50 = pickStable(pool50, seed, 'scale_50_100', (x) => x.id);
      const res100 = pickStable(pool100, seed, 'scale_50_100', (x) => x.id);
      if (res50.id !== res100.id) {
        changedCount++;
      }
    }

    const ratio = changedCount / totalSeeds;
    console.log(
      `Доля изменившихся результатов при добавлении 50 элементов к 50: ${(ratio * 100).toFixed(2)}% (${changedCount}/${totalSeeds})`
    );

    expect(ratio).toBeLessThanOrEqual(0.6);
  });

  it('при добавлении 1 элемента к пулу из 100 доля изменившихся результатов по 1000 сидам не превышает 3%', () => {
    const pool100: Item[] = Array.from({ length: 100 }, (_, i) => ({
      id: `id_${i}`,
      name: `Item ${i}`,
    }));
    const pool101: Item[] = Array.from({ length: 101 }, (_, i) => ({
      id: `id_${i}`,
      name: `Item ${i}`,
    }));

    let changedCount = 0;
    const totalSeeds = 1000;

    for (let seed = 1; seed <= totalSeeds; seed++) {
      const res100 = pickStable(pool100, seed, 'scale_100_101', (x) => x.id);
      const res101 = pickStable(pool101, seed, 'scale_100_101', (x) => x.id);
      if (res100.id !== res101.id) {
        changedCount++;
      }
    }

    const ratio = changedCount / totalSeeds;
    console.log(
      `Доля изменившихся результатов при добавлении 1 элемента к 100: ${(ratio * 100).toFixed(2)}% (${changedCount}/${totalSeeds})`
    );

    expect(ratio).toBeLessThanOrEqual(0.03);
  });

  it('разные tag при одном seed и пуле дают разные элементы хотя бы в 50% случаев из 100 сидов', () => {
    const pool: Item[] = Array.from({ length: 30 }, (_, i) => ({
      id: `element_${i}`,
      name: `Element ${i}`,
    }));

    let diffCount = 0;
    const totalSeeds = 100;

    for (let seed = 1; seed <= totalSeeds; seed++) {
      const resA = pickStable(pool, seed, 'categoryA', (x) => x.id);
      const resB = pickStable(pool, seed, 'categoryB', (x) => x.id);
      if (resA.id !== resB.id) {
        diffCount++;
      }
    }

    const ratio = diffCount / totalSeeds;
    expect(ratio).toBeGreaterThanOrEqual(0.5);
  });

  it('pickManyStable возвращает ровно count различных элементов без повторов', () => {
    const pool: Item[] = Array.from({ length: 25 }, (_, i) => ({
      id: `item_${i}`,
      name: `Item ${i}`,
    }));

    const count = 7;
    const picked = pickManyStable(pool, 424242, 'many_test', (x) => x.id, count);

    expect(picked).toHaveLength(count);
    const uniqueIds = new Set(picked.map((x) => x.id));
    expect(uniqueIds.size).toBe(count);

    // При count >= pool.length возвращает все элементы без повторов
    const allPicked = pickManyStable(pool, 424242, 'many_test', (x) => x.id, 50);
    expect(allPicked).toHaveLength(pool.length);
    expect(new Set(allPicked.map((x) => x.id)).size).toBe(pool.length);
  });

  it('детерминизм: два вызова с теми же аргументами строго равны', () => {
    const pool: Item[] = Array.from({ length: 15 }, (_, i) => ({
      id: `entry_${i}`,
      name: `Entry ${i}`,
    }));

    for (let seed = 100; seed <= 110; seed++) {
      const pick1 = pickStable(pool, seed, 'det_tag', (x) => x.id);
      const pick2 = pickStable(pool, seed, 'det_tag', (x) => x.id);
      expect(pick1).toEqual(pick2);

      const many1 = pickManyStable(pool, seed, 'det_tag', (x) => x.id, 5);
      const many2 = pickManyStable(pool, seed, 'det_tag', (x) => x.id, 5);
      expect(many1).toEqual(many2);

      const shuf1 = shuffleStable(pool, seed, 'det_tag', (x) => x.id);
      const shuf2 = shuffleStable(pool, seed, 'det_tag', (x) => x.id);
      expect(shuf1).toEqual(shuf2);
    }
  });

  it('пустой массив: выбрасывает ошибку "Cannot pick from empty array"', () => {
    expect(() => pickStable([], 123, 'empty', (x: Item) => x.id)).toThrow(
      'Cannot pick from empty array'
    );
    expect(pickManyStable([], 123, 'empty', (x: Item) => x.id, 3)).toEqual([]);
  });
});

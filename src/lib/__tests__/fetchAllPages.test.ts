import { describe, it, expect, vi } from 'vitest';
import { fetchAllPages } from '../fetchAllPages';

describe('fetchAllPages', () => {
  it('загружает 2500 строк в исходном порядке без дублей ровно за 3 страницы', async () => {
    const source = Array.from({ length: 2500 }, (_, i) => ({ id: i }));
    const buildQuery = vi.fn(async (from: number, to: number) => ({
      data: source.slice(from, to + 1),
      error: null,
    }));

    const result = await fetchAllPages(buildQuery);

    expect(buildQuery).toHaveBeenCalledTimes(3);
    expect(buildQuery).toHaveBeenNthCalledWith(1, 0, 999);
    expect(buildQuery).toHaveBeenNthCalledWith(2, 1000, 1999);
    expect(buildQuery).toHaveBeenNthCalledWith(3, 2000, 2999);
    expect(result).toHaveLength(2500);
    expect(result).toEqual(source);
    expect(new Set(result.map((r) => r.id)).size).toBe(2500);
  });

  it('при ровно 2000 строках запрашивает 3 страницы (последняя пустая) и возвращает 2000 строк', async () => {
    const source = Array.from({ length: 2000 }, (_, i) => ({ id: i }));
    const buildQuery = vi.fn(async (from: number, to: number) => ({
      data: source.slice(from, to + 1),
      error: null,
    }));

    const result = await fetchAllPages(buildQuery);

    expect(buildQuery).toHaveBeenCalledTimes(3);
    expect(buildQuery).toHaveBeenNthCalledWith(1, 0, 999);
    expect(buildQuery).toHaveBeenNthCalledWith(2, 1000, 1999);
    expect(buildQuery).toHaveBeenNthCalledWith(3, 2000, 2999);
    expect(result).toHaveLength(2000);
    expect(result).toEqual(source);
  });

  it('отклоняет промис при ошибке на второй странице и не возвращает частичный результат', async () => {
    const source = Array.from({ length: 2500 }, (_, i) => ({ id: i }));
    let callCount = 0;
    const buildQuery = vi.fn(async (from: number, to: number) => {
      callCount += 1;
      if (callCount === 2) {
        return { data: null, error: { message: 'Ошибка сети на 2-й странице' } };
      }
      return { data: source.slice(from, to + 1), error: null };
    });

    await expect(fetchAllPages(buildQuery)).rejects.toThrow('Ошибка сети на 2-й странице');
    expect(buildQuery).toHaveBeenCalledTimes(2);
  });
});

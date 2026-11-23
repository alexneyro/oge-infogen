import { describe, it, expect } from 'vitest';
import { compareClassNames } from '../compareClassNames';

describe('compareClassNames', () => {
  it('ставит 9А перед 10А', () => {
    expect(compareClassNames('9А', '10А')).toBeLessThan(0);
    expect(compareClassNames('10А', '9А')).toBeGreaterThan(0);
    expect(['10А', '9А'].sort(compareClassNames)).toEqual(['9А', '10А']);
  });

  it('не зависит от регистра (9а и 9А равны)', () => {
    expect(compareClassNames('9а', '9А')).toBe(0);
    expect(compareClassNames('9А', '9а')).toBe(0);
  });

  it('сортирует кириллицу между собой: 9г, 9а, 9б -> 9а, 9б, 9г', () => {
    expect(['9г', '9а', '9б'].sort(compareClassNames)).toEqual(['9а', '9б', '9г']);
  });

  it('не вызывает ошибку на пустых строках', () => {
    expect(() => compareClassNames('', '')).not.toThrow();
    expect(compareClassNames('', '')).toBe(0);
    expect(() => ['', '9А', ''].sort(compareClassNames)).not.toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { buildClassFilterOptions, getEmptyFilterMessage } from '../classFilterOptions';

describe('buildClassFilterOptions', () => {
  it('включает класс без заданий из classes', () => {
    const result = buildClassFilterOptions(
      [
        { id: 'c1', name: '9А' },
        { id: 'c2', name: '9Б' },
      ],
      [{ class_id: 'c1', class_name: '9А' }]
    );

    expect(result).toEqual([
      { id: 'c1', name: '9А' },
      { id: 'c2', name: '9Б' },
    ]);
  });

  it('включает архивный класс, который есть только в assignments', () => {
    const result = buildClassFilterOptions(
      [{ id: 'c1', name: '9А' }],
      [
        { class_id: 'c1', class_name: '9А' },
        { class_id: 'c-arch', class_name: '8В (архив)' },
      ]
    );

    expect(result).toEqual([
      { id: 'c-arch', name: '8В (архив)' },
      { id: 'c1', name: '9А' },
    ]);
  });

  it('схлопывает дубликаты по id между classes и assignments и внутри списков', () => {
    const result = buildClassFilterOptions(
      [
        { id: 'c1', name: '9А' },
        { id: 'c1', name: '9А дубль' },
      ],
      [
        { class_id: 'c1', class_name: '9А старое имя' },
        { class_id: 'c2', class_name: '9Б' },
        { class_id: 'c2', class_name: '9Б' },
      ]
    );

    expect(result).toEqual([
      { id: 'c1', name: '9А' },
      { id: 'c2', name: '9Б' },
    ]);
  });

  it('сортирует по-русски и ставит 10А после 9А, а не перед ней', () => {
    const result = buildClassFilterOptions(
      [
        { id: 'c10', name: '10А' },
        { id: 'cYa', name: 'Ясельная' },
        { id: 'c9b', name: '9Б' },
        { id: 'c9a', name: '9А' },
        { id: 'cA', name: 'А-группа' },
      ],
      []
    );

    expect(result.map((o) => o.name)).toEqual(['9А', '9Б', '10А', 'А-группа', 'Ясельная']);
  });

  it('подставляет «—» при пустом class_name у класса только из заданий', () => {
    const result = buildClassFilterOptions(
      [],
      [
        { class_id: 'c-null', class_name: null },
        { class_id: 'c-empty', class_name: '   ' },
        { class_id: 'c-undef' },
      ]
    );

    expect(result).toEqual([
      { id: 'c-null', name: '—' },
      { id: 'c-empty', name: '—' },
      { id: 'c-undef', name: '—' },
    ]);
  });

  it('возвращает [] при пустых входных массивах', () => {
    expect(buildClassFilterOptions([], [])).toEqual([]);
  });
});

describe('getEmptyFilterMessage', () => {
  it('для класса без заданий возвращает «Вы пока не выдавали задания этому классу»', () => {
    expect(
      getEmptyFilterMessage({
        classFilter: 'c10',
        assignments: [{ class_id: 'c9a' }],
        filteredCount: 0,
      })
    ).toBe('Вы пока не выдавали задания этому классу');
  });

  it('для класса с заданиями, скрытыми другим фильтром, возвращает «Нет заданий по выбранным фильтрам»', () => {
    expect(
      getEmptyFilterMessage({
        classFilter: 'c9a',
        assignments: [{ class_id: 'c9a' }],
        filteredCount: 0,
      })
    ).toBe('Нет заданий по выбранным фильтрам');
  });

  it('при classFilter === "all" и пустом результате возвращает «Нет заданий по выбранным фильтрам»', () => {
    expect(
      getEmptyFilterMessage({
        classFilter: 'all',
        assignments: [{ class_id: 'c9a' }],
        filteredCount: 0,
      })
    ).toBe('Нет заданий по выбранным фильтрам');
  });

  it('при непустом результате возвращает null', () => {
    expect(
      getEmptyFilterMessage({
        classFilter: 'c9a',
        assignments: [{ class_id: 'c9a' }],
        filteredCount: 2,
      })
    ).toBeNull();
  });
});

/**
 * Модуль форматирования чисел и согласования грамматических форм для Задания 13.
 */

/**
 * Склонение существительных с числительными в русском языке.
 * @param n Число
 * @param one Форма для 1 (строка, столбец, пункт, сантиметр)
 * @param two Форма для 2-4 (строки, столбца, пункта, сантиметра)
 * @param five Форма для 5-0 и 11-19 (строк, столбцов, пунктов, сантиметров)
 */
export function pluralizeRu(n: number, one: string, two: string, five: string): string {
  const abs = Math.abs(n);
  // Если число дробное (например, 1.5, 1.25), в русском языке согласуется как «1,5 пункта / сантиметра / строки» (родительный падеж единственного числа)
  if (!Number.isInteger(abs)) {
    return two;
  }
  const mod100 = abs % 100;
  const mod10 = abs % 10;
  if (mod100 >= 11 && mod100 <= 19) {
    return five;
  }
  if (mod10 === 1) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return two;
  }
  return five;
}

/**
 * Форматирует число в русском формате с десятичной запятой вместо точки (например, 1.25 -> "1,25").
 */
export function formatRuNumber(n: number): string {
  return n.toString().replace('.', ',');
}

/**
 * Форматирует значение в сантиметрах со строгим согласованием:
 * например: 1 -> "1 см", 1.25 -> "1,25 см".
 */
export function formatCm(cm: number): string {
  return `${formatRuNumber(cm)} см`;
}

/**
 * Форматирует значение в пунктах (сокращённо: "12 пт", "14 пт").
 */
export function formatPt(pt: number): string {
  return `${formatRuNumber(pt)} пт`;
}

/**
 * Форматирует значение в пунктах полными словами:
 * например: 1 -> "1 пункт", 2 -> "2 пункта", 5 -> "5 пунктов", 14 -> "14 пунктов".
 */
export function formatPtFull(pt: number): string {
  return `${formatRuNumber(pt)} ${pluralizeRu(pt, 'пункт', 'пункта', 'пунктов')}`;
}

/**
 * Форматирует число строк с согласованием:
 * например: 1 -> "1 строка", 2 -> "2 строки", 5 -> "5 строк", 21 -> "21 строка".
 */
export function formatRowsCount(count: number): string {
  return `${count} ${pluralizeRu(count, 'строка', 'строки', 'строк')}`;
}

/**
 * Форматирует число строк в винительном падеже («содержит N строк»):
 * например: 1 -> "1 строку", 2 -> "2 строки", 5 -> "5 строк", 21 -> "21 строку".
 */
export function formatRowsCountAccusative(count: number): string {
  return `${count} ${pluralizeRu(count, 'строку', 'строки', 'строк')}`;
}

/**
 * Форматирует число столбцов с согласованием:
 * например: 1 -> "1 столбец", 2 -> "2 столбца", 5 -> "5 столбцов", 21 -> "21 столбец".
 */
export function formatColsCount(count: number): string {
  return `${count} ${pluralizeRu(count, 'столбец', 'столбца', 'столбцов')}`;
}

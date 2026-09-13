/**
 * Universal answer normalization utility.
 * - Trim and strip all whitespace
 * - Lowercase
 * - Cyrillic 'ё' -> 'е'
 * - Latin homoglyphs -> Cyrillic lowercase equivalents (e.g. 'a' -> 'а', 'c' -> 'с', 'b' -> 'в')
 * - Comma -> dot in decimal numbers (e.g. "3,5" -> "3.5")
 * - Strictly preserves character order (essential for sequence answers like "БГАВ")
 */

const LATIN_TO_CYRILLIC_HOMOGLYPHS: Record<string, string> = {
  a: 'а',
  b: 'в',
  c: 'с',
  e: 'е',
  h: 'н',
  k: 'к',
  m: 'м',
  o: 'о',
  p: 'р',
  t: 'т',
  x: 'х',
  y: 'у',
};

export function normalizeAnswer(s: string | null | undefined): string {
  if (!s) return '';
  const str = String(s)
    .trim()
    .replace(/\s+/g, '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/,/g, '.');

  let result = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    result += LATIN_TO_CYRILLIC_HOMOGLYPHS[ch] || ch;
  }
  return result;
}

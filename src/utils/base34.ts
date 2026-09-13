// 34-символьный алфавит: исключены символы I и O во избежание путаницы с 1 и 0 при переписывании с бумаги.
export const BASE34_ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function numToBase34(n: number): string {
  if (n === 0) return '0';
  let res = '';
  let cur = Math.floor(Math.abs(n));
  while (cur > 0) {
    const rem = cur % 34;
    res = BASE34_ALPHABET[rem] + res;
    cur = Math.floor(cur / 34);
  }
  return res || '0';
}

export function charToBase34Val(ch: string): number {
  if (ch === 'O' || ch === 'o') return 0;
  if (ch === 'I' || ch === 'i') return 1;
  const idx = BASE34_ALPHABET.indexOf(ch.toUpperCase());
  return idx >= 0 ? idx : -1;
}

export function base34ToNum(str: string): number {
  if (!str) return -1;
  let val = 0;
  for (let i = 0; i < str.length; i++) {
    const d = charToBase34Val(str[i]);
    if (d < 0) return -1;
    val = val * 34 + d;
    if (val > Number.MAX_SAFE_INTEGER) return -1;
  }
  return val;
}

export function generateBase34Seed(len: number): string {
  let result = '';
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint8Array(len * 2);
    while (result.length < len) {
      crypto.getRandomValues(buf);
      for (let i = 0; i < buf.length && result.length < len; i++) {
        const byte = buf[i];
        if (byte < 238) {
          result += BASE34_ALPHABET[byte % 34];
        }
      }
    }
  } else {
    while (result.length < len) {
      result += BASE34_ALPHABET[Math.floor(Math.random() * 34)];
    }
  }
  return result;
}

export function generateSetSeed(): string {
  return generateBase34Seed(7);
}

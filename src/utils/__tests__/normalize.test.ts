import { describe, it, expect } from 'vitest';
import { normalizeAnswer } from '../normalize';

describe('normalizeAnswer utility suite', () => {
  it('handles Latin vs Cyrillic homoglyphs correctly', () => {
    // Latin 'C' and Cyrillic 'С'
    expect(normalizeAnswer('C')).toBe('с');
    expect(normalizeAnswer('С')).toBe('с');
    expect(normalizeAnswer('C')).toBe(normalizeAnswer('С'));

    // Latin 'A', 'B', 'E', 'H', 'K', 'M', 'O', 'P', 'T', 'X'
    expect(normalizeAnswer('ABEKMOPTX')).toBe(normalizeAnswer('АВЕКМОРТХ'));
    expect(normalizeAnswer('abekmoptx')).toBe(normalizeAnswer('авекмортх'));
  });

  it('normalizes ё to е', () => {
    expect(normalizeAnswer('Ёлка')).toBe('елка');
    expect(normalizeAnswer('ежик')).toBe(normalizeAnswer('ёжик'));
    expect(normalizeAnswer('Пётр')).toBe('петр');
    expect(normalizeAnswer('клён')).toBe(normalizeAnswer('клен'));
    expect(normalizeAnswer('Фёдоров')).toBe(normalizeAnswer('Федоров'));
    expect(normalizeAnswer('Кёрлинг')).toBe(normalizeAnswer('керлинг'));
  });

  it('strips all whitespace and trims', () => {
    expect(normalizeAnswer('   а   б   в   ')).toBe('абв');
    expect(normalizeAnswer('\tслово \n другое\r\n')).toBe('словодругое');
  });

  it('converts comma to dot in decimal numbers', () => {
    expect(normalizeAnswer('3,5')).toBe('3.5');
    expect(normalizeAnswer('12, 45')).toBe('12.45');
    expect(normalizeAnswer('0,75 | 14,2')).toBe('0.75|14.2');
  });

  it('strictly preserves character order in answers like БГАВ', () => {
    expect(normalizeAnswer('БГАВ')).toBe('бгав');
    expect(normalizeAnswer('ВГБА')).toBe('вгба');
    expect(normalizeAnswer('БГАВ')).not.toBe(normalizeAnswer('ВГБА'));
  });

  it('safely handles empty or null/undefined inputs', () => {
    expect(normalizeAnswer('')).toBe('');
    expect(normalizeAnswer(null as any)).toBe('');
    expect(normalizeAnswer(undefined as any)).toBe('');
  });
});

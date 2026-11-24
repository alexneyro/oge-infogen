import { describe, it, expect } from 'vitest';
import { validateName } from '../nameValidation';

describe('validateName', () => {
  it('отклоняет пустую строку и строку из одних пробелов', () => {
    expect(validateName('')).toEqual({ ok: false, error: expect.any(String) });
    expect(validateName('   ')).toEqual({ ok: false, error: expect.any(String) });
  });

  it('обрезает пробелы по краям и возвращает очищенное значение', () => {
    expect(validateName('  Иван  ')).toEqual({ ok: true, value: 'Иван' });
    expect(validateName('\tАнна-Мария\n')).toEqual({ ok: true, value: 'Анна-Мария' });
  });

  it('разрешает кириллицу (включая ё/Ё), латиницу, одиночный дефис и одиночный пробел между буквами', () => {
    expect(validateName('Алёна')).toEqual({ ok: true, value: 'Алёна' });
    expect(validateName('Ёлкина')).toEqual({ ok: true, value: 'Ёлкина' });
    expect(validateName('Анна-Мария')).toEqual({ ok: true, value: 'Анна-Мария' });
    expect(validateName('Де Ла Круз')).toEqual({ ok: true, value: 'Де Ла Круз' });
    expect(validateName('Jean-Luc')).toEqual({ ok: true, value: 'Jean-Luc' });
  });

  it('отклоняет цифры и посторонние символы', () => {
    expect(validateName('Иван1')).toEqual({ ok: false, error: expect.any(String) });
    expect(validateName('123')).toEqual({ ok: false, error: expect.any(String) });
    expect(validateName('Анна!')).toEqual({ ok: false, error: expect.any(String) });
    expect(validateName('Иван_П')).toEqual({ ok: false, error: expect.any(String) });
  });

  it('разрешает ровно 40 символов и отклоняет строку длиннее 40 символов', () => {
    const exact40 = 'А'.repeat(40);
    const tooLong41 = 'А'.repeat(41);

    expect(validateName(exact40)).toEqual({ ok: true, value: exact40 });
    expect(validateName(`  ${exact40}  `)).toEqual({ ok: true, value: exact40 });
    expect(validateName(tooLong41)).toEqual({ ok: false, error: expect.any(String) });
  });

  it('отклоняет двойное тире, двойной пробел и дефис по краям', () => {
    expect(validateName('Анна--Мария')).toEqual({ ok: false, error: expect.any(String) });
    expect(validateName('Анна  Мария')).toEqual({ ok: false, error: expect.any(String) });
    expect(validateName('Анна - Мария')).toEqual({ ok: false, error: expect.any(String) });
    expect(validateName('-Анна')).toEqual({ ok: false, error: expect.any(String) });
    expect(validateName('Анна-')).toEqual({ ok: false, error: expect.any(String) });
  });
});

export type NameValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

const MAX_NAME_LENGTH = 40;
const ALLOWED_CHARS_RE = /^[а-яА-ЯёЁa-zA-Z -]+$/;
const VALID_NAME_STRUCTURE_RE = /^[а-яА-ЯёЁa-zA-Z]+(?:[ -][а-яА-ЯёЁa-zA-Z]+)*$/;

export function validateName(value: string): NameValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false, error: 'Введите значение' };
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `Максимум ${MAX_NAME_LENGTH} символов` };
  }

  if (!ALLOWED_CHARS_RE.test(trimmed)) {
    return { ok: false, error: 'Допустимы только буквы, пробел и дефис' };
  }

  if (!VALID_NAME_STRUCTURE_RE.test(trimmed)) {
    return { ok: false, error: 'Пробел и дефис допускаются только по одному между буквами' };
  }

  return { ok: true, value: trimmed };
}

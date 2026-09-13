import { describe, it, expect } from 'vitest';
import { buildRtfString } from '../rtf';

describe('buildRtfString', () => {
  it('creates valid RTF with escaped Cyrillic, backslashes, and curly braces', () => {
    const rawText = `Тестовый заголовок с {фигурными} скобками и \\обратным\\ слэшем.
Вторая строка: Пушкин & Чехов!
Спецсимволы: <тег> "кавычки" 'апостроф'`;

    const rtf = buildRtfString(rawText);

    // 1. Verify header exists
    expect(rtf).toContain('{\\rtf1\\ansi\\ansicpg1251\\deff0');
    expect(rtf).toContain('{\\fonttbl{\\f0\\fnil\\fcharset204 Times New Roman;}}');

    // 2. Verify escaped braces and backslashes
    expect(rtf).toContain('\\{');
    expect(rtf).toContain('\\}');
    expect(rtf).toContain('\\\\');

    // 3. Verify that raw Cyrillic (unicode > 127) is NOT present in the rtf body
    // Characters with code > 127 must be converted to \uNNNN?
    const hasRawCyrillic = /[а-яА-ЯёЁ]/.test(rtf);
    expect(hasRawCyrillic).toBe(false);

    // 4. Verify unicode escaping of Cyrillic characters
    // 'Т' is charCode 1058 -> \u1058?
    // 'е' is charCode 1077 -> \u1077?
    // 'с' is charCode 1089 -> \u1089?
    // 'т' is charCode 1090 -> \u1090?
    expect(rtf).toContain('\\u1058?\\u1077?\\u1089?\\u1090?');
    // 'фигурными' wrapped in escaped braces: \{\u1092?...\}
    expect(rtf).toContain('\\{\\u1092?\\u1080?\\u1075?\\u1091?\\u1088?\\u1085?\\u1099?\\u1084?\\u1080?\\}');
    // 'обратным' wrapped in escaped backslashes: \\\u1086?...\\
    expect(rtf).toContain('\\\\\\u1086?\\u1073?\\u1088?\\u1072?\\u1090?\\u1085?\\u1099?\\u1084?\\\\');

    // 5. Verify line breaks as \par
    expect(rtf).toContain('\\par\n');
  });
});

import { describe, it, expect } from 'vitest';
import { parseAnswersText } from '../parseAnswers';
import { readTextFile } from '../readTextFile';
import { buildSet, SetConfig } from '../../set';
import { buildSetZipBlob } from '../exportSet';
import JSZip from 'jszip';

describe('parseAnswers suite', () => {
  it('штатный блокнот, сгенерированный buildSetZipBlob, разбирается полностью', async () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Контрольная 9А',
      slots: [
        { taskId: 1, n1: 0, n2: 2, n3: 0, nR: 0 },
        { taskId: 2, n1: 0, n2: 1, n3: 0, nR: 0 },
      ],
    };

    const { entries } = buildSet(cfg);
    const { blob } = await buildSetZipBlob(entries, cfg, { includeNotepad: true });
    const zip = await JSZip.loadAsync(blob);

    // Находим файл блокнота ответов
    const notepadFile = Object.keys(zip.files).find((name) =>
      name.includes('ответы/Фамилия_')
    );
    expect(notepadFile).toBeDefined();

    const origContent = await zip.files[notepadFile!].async('string');

    // Заполняем имя, класс и ответы
    const filledContent = origContent
      .replace('Фамилия и имя: ', 'Фамилия и имя: Иванов Иван')
      .replace('Класс: ', 'Класс: 9Б')
      .replace('1: ', '1: 42')
      .replace('2: ', '2: привет')
      .replace('3: ', '3: 100');

    const parsed = parseAnswersText(filledContent);

    expect(parsed.student).toBe('Иванов Иван');
    expect(parsed.grade).toBe('9Б');
    expect(parsed.setCode).toMatch(/^[A-Z0-9-]+$/);
    expect(parsed.answers).toHaveLength(3);
    expect(parsed.answers[0]).toEqual({ position: 1, raw: '42', kind: 'line' });
    expect(parsed.answers[1]).toEqual({ position: 2, raw: 'привет', kind: 'line' });
    expect(parsed.answers[2]).toEqual({ position: 3, raw: '100', kind: 'line' });
    expect(parsed.unreadLines).toHaveLength(0);
  });

  it('строки с # игнорируются; форматы «5 - ответ», «5) ответ», «5.ответ» читаются', () => {
    const text = `
# Комментарий в начале
Фамилия и имя: Петров Петр
Класс: 9А
Набор: Тест (ABCDE)
===== ОТВЕТЫ =====
# Еще комментарий
1 - ответ один
2) ответ два
3.ответ три
4: ответ четыре
5 – ответ пять
`;
    const parsed = parseAnswersText(text);

    expect(parsed.student).toBe('Петров Петр');
    expect(parsed.grade).toBe('9А');
    expect(parsed.setCode).toBe('ABCDE');
    expect(parsed.answers).toHaveLength(5);
    expect(parsed.answers[0]).toEqual({ position: 1, raw: 'ответ один', kind: 'line' });
    expect(parsed.answers[1]).toEqual({ position: 2, raw: 'ответ два', kind: 'line' });
    expect(parsed.answers[2]).toEqual({ position: 3, raw: 'ответ три', kind: 'line' });
    expect(parsed.answers[3]).toEqual({ position: 4, raw: 'ответ четыре', kind: 'line' });
    expect(parsed.answers[4]).toEqual({ position: 5, raw: 'ответ пять', kind: 'line' });
    expect(parsed.unreadLines).toHaveLength(0);
  });

  it('мусорные строки попадают в unreadLines', () => {
    const text = `
Фамилия и имя: Сидоров
Непонятная строка в шапке
===== ОТВЕТЫ =====
1: верный
какой-то произвольный текст без номера
2: тоже ответ
`;
    const parsed = parseAnswersText(text);

    expect(parsed.student).toBe('Сидоров');
    expect(parsed.answers).toHaveLength(2);
    expect(parsed.unreadLines).toContain('Непонятная строка в шапке');
    expect(parsed.unreadLines).toContain('какой-то произвольный текст без номера');
  });

  it('дубль номера: берётся последнее непустое значение', () => {
    const text = `
===== ОТВЕТЫ =====
1: первое значение
1: второе значение
2: значение
2: 
`;
    const parsed = parseAnswersText(text);

    expect(parsed.answers).toHaveLength(2);
    expect(parsed.answers[0]).toEqual({ position: 1, raw: 'второе значение', kind: 'line' });
    expect(parsed.answers[1]).toEqual({ position: 2, raw: 'значение', kind: 'line' });
    expect(parsed.unreadLines.length).toBeGreaterThanOrEqual(2);
  });

  it('текст без маркера «=====» разбирается как ответы и распознает шапку', () => {
    const text = `
Фамилия и имя: Смирнов
Класс: 9В
1: альфа
2: бета
3: гамма
`;
    const parsed = parseAnswersText(text);

    expect(parsed.student).toBe('Смирнов');
    expect(parsed.grade).toBe('9В');
    expect(parsed.answers).toHaveLength(3);
    expect(parsed.answers[0]).toEqual({ position: 1, raw: 'альфа', kind: 'line' });
    expect(parsed.answers[1]).toEqual({ position: 2, raw: 'бета', kind: 'line' });
    expect(parsed.answers[2]).toEqual({ position: 3, raw: 'гамма', kind: 'line' });
  });

  it('файл в windows-1251 читается без U+FFFD', async () => {
    // Создаем строку на русском в windows-1251
    // В CP1251 'Привет' -> [0xCF, 0xF0, 0xE8, 0xE2, 0xE5, 0xF2]
    // «1: Тест» -> [0x31, 0x3A, 0x20, 0xD2, 0xE5, 0xF1, 0xF2]
    const cp1251Bytes = new Uint8Array([
      0x31, 0x3a, 0x20, 0xd2, 0xe5, 0xf1, 0xf2, 0x0d, 0x0a, // 1: Тест
    ]);

    const blob = new Blob([cp1251Bytes]);
    const text = await readTextFile(blob);

    expect(text).not.toContain('\uFFFD');
    expect(text).toContain('1: Тест');

    const parsed = parseAnswersText(text);
    expect(parsed.answers[0]).toEqual({ position: 1, raw: 'Тест', kind: 'line' });
  });

  describe('parseAnswersText with blocks and sub-answers', () => {
    it('парсит обычные однострочные ответы и шапку', () => {
      const text = `
Фамилия и имя: Сидоров Алексей
Класс: 9Б
Набор: Проверочная (2A3B4C)

===== ОТВЕТЫ =====
1: 42
2: 128
3: не знаю
`;
      const res = parseAnswersText(text);
      expect(res.student).toBe('Сидоров Алексей');
      expect(res.grade).toBe('9Б');
      expect(res.setCode).toBe('2A3B4C');
      expect(res.answers.length).toBe(3);
      expect(res.answers[0]).toEqual({ position: 1, raw: '42', kind: 'line' });
      expect(res.answers[1]).toEqual({ position: 2, raw: '128', kind: 'line' });
      expect(res.answers[2]).toEqual({ position: 3, raw: 'не знаю', kind: 'line' });
    });

    it('парсит поднаветы 14.1 и 14.2', () => {
      const text = `
===== ОТВЕТЫ =====
1: 15
14.1: 52
14.2: 44.5
# 14.3 диаграмма
`;
      const res = parseAnswersText(text);
      expect(res.answers.length).toBe(3);
      expect(res.answers[0]).toEqual({ position: 1, raw: '15', kind: 'line' });
      expect(res.answers[1]).toEqual({ position: 14, sub: 1, raw: '52', kind: 'line' });
      expect(res.answers[2]).toEqual({ position: 14, sub: 2, raw: '44.5', kind: 'line' });
    });

    it('парсит многострочные блоки кода (Робот и Python)', () => {
      const text = `
===== ОТВЕТЫ =====
1: 10
2:
--- начало программы ---
использовать Робот
алг
нач
  вправо
  закрасить
кон
--- конец программы ---
3: 99
`;
      const res = parseAnswersText(text);
      expect(res.answers.length).toBe(3);
      expect(res.answers[0]).toEqual({ position: 1, raw: '10', kind: 'line' });
      expect(res.answers[1].position).toBe(2);
      expect(res.answers[1].kind).toBe('block');
      expect(res.answers[1].raw).toContain('использовать Робот');
      expect(res.answers[1].raw).toContain('закрасить');
      expect(res.answers[2]).toEqual({ position: 3, raw: '99', kind: 'line' });
    });

    it('не игнорирует комментарии со знаком # внутри блока программы', () => {
      const pythonCode = `
# задание 16, язык Python
4:
--- начало программы ---
# читаем данные
n = int(input())
# считаем результат
print(n * 2)
--- конец программы ---
`;
      const res = parseAnswersText(pythonCode);
      const ans4 = res.answers.find((a) => a.position === 4);
      expect(ans4).toBeDefined();
      expect(ans4?.kind).toBe('block');
      expect(ans4?.raw).toContain('# читаем данные');
      expect(ans4?.raw).toContain('print(n * 2)');
    });

    it('толерантен к разделителям дефисов и регистру маркеров блоков', () => {
      const text = `
===== ОТВЕТЫ =====
1:
-- НАЧАЛО  ПРОГРАММЫ ---
x = 5
print(x)
------- КОНЕЦ   ПРОГРАММЫ ----
`;
      const res = parseAnswersText(text);
      expect(res.answers.length).toBe(1);
      expect(res.answers[0].position).toBe(1);
      expect(res.answers[0].kind).toBe('block');
      expect(res.answers[0].raw).toBe('x = 5\nprint(x)');
    });

    it('предупреждает при незакрытом блоке', () => {
      const text = `
===== ОТВЕТЫ =====
1:
--- начало программы ---
print('hello')
`;
      const res = parseAnswersText(text);
      expect(res.answers.length).toBe(1);
      expect(res.answers[0].raw).toBe("print('hello')");
      expect(res.unreadLines.some((l) => l.includes('не был закрыт'))).toBe(true);
    });

    it('читает код набора из закомментированной строки «# код набора: ...», когда обычная строка «Набор:» удалена', () => {
      const text = `
Фамилия и имя: Иванов Иван
Класс: 9Б
# код набора: 2V80A597 — не удаляйте эту строку

===== ОТВЕТЫ =====
# комментарий перед позицией
1: 42
2: привет
`;
      const res = parseAnswersText(text);
      expect(res.student).toBe('Иванов Иван');
      expect(res.grade).toBe('9Б');
      expect(res.setCode).toBe('2V80A597');
      expect(res.answers).toHaveLength(2);
      expect(res.answers[0]).toEqual({ position: 1, raw: '42', kind: 'line' });
      expect(res.answers[1]).toEqual({ position: 2, raw: 'привет', kind: 'line' });
      expect(res.unreadLines).toHaveLength(0);
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { buildSetZipBlob, generateNotepadContent } from '../exportSet';
import { buildSet, SetConfig, shortSetCode, fileCode } from '../../set';
import * as attachmentsModule from '../attachments';

describe('exportSet suite: buildSetZipBlob', () => {
  it('набор «1 L2 ×2, 11 L3 ×2, 16 L2 ×1» создаёт корректную структуру архива с позиционными именами файлов', async () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Контрольная 9А',
      slots: [
        { taskId: 1, n1: 0, n2: 2, n3: 0, nR: 0 },
        { taskId: 11, n1: 0, n2: 0, n3: 2, nR: 0 },
        { taskId: 16, n1: 0, n2: 1, n3: 0, nR: 0 },
      ],
    };

    const { entries } = buildSet(cfg);
    expect(entries.length).toBe(5);
    expect(entries.map((e) => e.position)).toEqual([1, 2, 3, 4, 5]);

    const shortCode = shortSetCode(cfg);
    const fCode = fileCode(cfg);
    expect(fCode).toHaveLength(5);
    expect(fCode).toMatch(/^[0-9A-HJ-NP-Z]{5}$/);

    const safeTitle = 'Контрольная 9А';
    const rootFolder = `${safeTitle}_${fCode}`;

    const { blob, missing } = await buildSetZipBlob(entries, cfg, { includeNotepad: true });

    expect(missing).toEqual([]);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Проверка наличия README.txt
    const readmeFile = zip.file(`${rootFolder}/README.txt`);
    expect(readmeFile).not.toBeNull();
    const readmeText = await readmeFile!.async('string');
    expect(readmeText).toContain(`НАБОР ЗАДАНИЙ: Контрольная 9А`);
    expect(readmeText).toContain(`Короткий код: ${shortCode}`);
    expect(readmeText).toContain(`Метка файлов: ${fCode}`);
    expect(readmeText).toContain('поз. 1 — задание 1 (уровень 2)');
    expect(readmeText).toContain('поз. 2 — задание 1 (уровень 2)');
    expect(readmeText).toContain('поз. 3 — задание 11 (уровень 3) — файл: files/11-3_archive.zip');
    expect(readmeText).toContain('поз. 4 — задание 11 (уровень 3) — файл: files/11-4_archive.zip');
    expect(readmeText).toContain('поз. 5 — задание 16 (уровень 2)');
    expect(readmeText).toContain('этой строкой можно восстановить набор в программе');
    expect(readmeText).toContain('Практическое задание 16 (Python)');

    // 2. Проверка files/ (позиции 3 и 4 для задания 11, отсутствие файлов для задания 1)
    expect(zip.file(`${rootFolder}/files/11-3_archive.zip`)).not.toBeNull();
    expect(zip.file(`${rootFolder}/files/11-4_archive.zip`)).not.toBeNull();
    expect(zip.file(`${rootFolder}/files/1-1_attachment.zip`)).toBeNull();
    expect(zip.file(`${rootFolder}/files/1-2_attachment.zip`)).toBeNull();

    // 3. Проверка блокнота и заготовки для задания 16
    const notepadFile = zip.file(`${rootFolder}/ответы/Фамилия_${fCode}.txt`);
    expect(notepadFile).not.toBeNull();
    const notepadText = await notepadFile!.async('string');
    expect(notepadText).toContain('Фамилия и имя:');
    expect(notepadText).toContain('Класс:');
    expect(notepadText).toContain(`Набор: Контрольная 9А (${shortCode})`);
    expect(notepadText).toContain(`# код набора: ${shortCode} — не удаляйте эту строку`);
    expect(notepadText).toContain('===== ОТВЕТЫ =====');
    expect(notepadText).toContain('1:');
    expect(notepadText).toContain('2:');
    expect(notepadText).toContain('3:');
    expect(notepadText).toContain('4:');
    expect(notepadText).toContain('# задание 16, язык Python');
    expect(notepadText).toContain('5:');
    expect(notepadText).toContain('--- начало программы ---');
    expect(notepadText).toContain('--- конец программы ---');

    // Заготовка Python для позиции 5
    const pyFile = zip.file(`${rootFolder}/ответы/5_программа.py`);
    expect(pyFile).not.toBeNull();
    const pyText = await pyFile!.async('string');
    expect(pyText).toContain('# Задание 16 (позиция 5). Программа на языке Python');

    // 4. Проверка BOM для всех текстовых файлов
    const allFileNames = Object.keys(zip.files);
    const textFileNames = allFileNames.filter(
      (f) => !zip.files[f].dir && (f.endsWith('.txt') || f.endsWith('.py'))
    );
    expect(textFileNames.length).toBeGreaterThanOrEqual(3);

    for (const fileName of textFileNames) {
      const u8 = await zip.file(fileName)!.async('uint8array');
      expect(u8[0], `BOM byte 0 in ${fileName}`).toBe(0xef);
      expect(u8[1], `BOM byte 1 in ${fileName}`).toBe(0xbb);
      expect(u8[2], `BOM byte 2 in ${fileName}`).toBe(0xbf);
    }
  });

  it('при includeNotepad: false папки ответов с блокнотом и заготовками нет', async () => {
    const cfg: SetConfig = {
      seed: '54321',
      title: 'Без Блокнота',
      slots: [
        { taskId: 15, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 16, n1: 0, n2: 1, n3: 0, nR: 0 },
      ],
    };

    const { entries } = buildSet(cfg);
    const fCode = fileCode(cfg);
    const rootFolder = `Без Блокнота_${fCode}`;

    const { blob, missing } = await buildSetZipBlob(entries, cfg, { includeNotepad: false });
    expect(missing).toEqual([]);

    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const allFiles = Object.keys(zip.files);
    const answerFiles = allFiles.filter((p) => p.includes('/ответы/'));
    expect(answerFiles).toEqual([]);
    expect(zip.file(`${rootFolder}/README.txt`)).not.toBeNull();
  });

  it('сломанное вложение (buildAttachment throws) добавляет имя файла в missing, а blob всё равно создаётся', async () => {
    const cfg: SetConfig = {
      seed: '99999',
      title: 'Сбойное Вложение',
      slots: [
        { taskId: 11, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 14, n1: 0, n2: 1, n3: 0, nR: 0 },
      ],
    };

    const { entries } = buildSet(cfg);

    // Мокаем buildAttachment так, чтобы для задания 11 выбрасывалось исключение
    const originalBuildAttachment = attachmentsModule.buildAttachment;
    const spy = vi.spyOn(attachmentsModule, 'buildAttachment').mockImplementation(async (taskId: number, taskData: any) => {
      if (taskId === 11) {
        throw new Error('Simulated attachment generation failure');
      }
      return originalBuildAttachment(taskId, taskData);
    });

    try {
      const { blob, missing } = await buildSetZipBlob(entries, cfg, { includeNotepad: true });
      expect(missing).toContain('11-1_archive.zip');
      expect(missing.length).toBe(1);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);

      const arrayBuffer = await blob.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const fCode = fileCode(cfg);
      const rootFolder = `Сбойное Вложение_${fCode}`;

      // 14-2_table.xlsx должен присутствовать
      expect(zip.file(`${rootFolder}/files/14-2_table.xlsx`)).not.toBeNull();
      // 11-1_archive.zip отсутствует из-за ошибки
      expect(zip.file(`${rootFolder}/files/11-1_archive.zip`)).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it('генерирует корректный шаблон блокнота для 1, 14, 15, 16', () => {
    const cfg: SetConfig = {
      seed: '12345',
      title: 'Проверочный набор',
      slots: [
        { taskId: 1, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 14, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 15, n1: 0, n2: 1, n3: 0, nR: 0 },
        { taskId: 16, n1: 0, n2: 1, n3: 0, nR: 0 },
      ],
    };

    const { entries } = buildSet(cfg);
    expect(entries.length).toBe(4);

    const shortCode = shortSetCode(cfg);
    const notepad = generateNotepadContent(entries, cfg);
    expect(notepad).toContain(`Набор: Проверочный набор (${shortCode})`);
    expect(notepad).toContain(`# код набора: ${shortCode} — не удаляйте эту строку`);
    expect(notepad).toContain('1: ');
    expect(notepad).toContain('2.1: ');
    expect(notepad).toContain('2.2: ');
    expect(notepad).toContain('# 2.3 (диаграмма) проверяет учитель');
    expect(notepad).toContain('# задание 15, язык КуМир');
    expect(notepad).toContain('3:');
    expect(notepad).toContain('--- начало программы ---');
    expect(notepad).toContain('# задание 16, язык Python');
    expect(notepad).toContain('4:');
  });
});

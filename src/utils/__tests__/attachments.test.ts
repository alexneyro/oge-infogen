import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { attachmentName, buildAttachment } from '../attachments';
import { buildTask11ZipBlob } from '../../tasks/task11';
import { buildTask12ZipBlob, FileNode } from '../../tasks/task12';
import { buildTask14XlsxBlob, Task14Data } from '../../tasks/task14';
import { WORKS } from '../../data/texts11';

describe('Attachments & Export utility suite', () => {
  it('generates proper attachment filenames according to task ID and index', () => {
    expect(attachmentName(11, 1, 'zip')).toBe('11-1_archive.zip');
    expect(attachmentName(12, 2, 'zip')).toBe('12-2_files.zip');
    expect(attachmentName(14, 1, 'xlsx')).toBe('14-1_table.xlsx');
    expect(attachmentName(1, 1, 'zip')).toBe('1-1_attachment.zip');
  });

  it('buildTask11ZipBlob generates a valid zip archive with non-empty files and tracks missing files', async () => {
    const selectedWorks = [WORKS[0], WORKS[1]];
    // Test L1 (flat structure)
    const { blob: blobL1, missing: missingL1 } = await buildTask11ZipBlob('DEMO-11', 1, 'Prose', selectedWorks);
    expect(blobL1).toBeInstanceOf(Blob);
    expect(blobL1.size).toBeGreaterThan(0);
    expect(missingL1).toEqual([]);

    const arrayBufferL1 = await blobL1.arrayBuffer();
    const zipL1 = await JSZip.loadAsync(arrayBufferL1);

    for (const work of selectedWorks) {
      const baseName = (work.displayName || work.file).replace(/\.(txt|html|docx)$/i, '');
      const fileEntry = zipL1.file(`DEMO-11/${baseName}.txt`);
      expect(fileEntry).not.toBeNull();
      const content = await fileEntry!.async('string');
      expect(content.length).toBeGreaterThan(0);
    }

    // Test L2 (subfolder structure with txt, htm, and docx)
    const { blob: blobL2, missing: missingL2 } = await buildTask11ZipBlob('DEMO-11', 2, 'Prose', selectedWorks);
    expect(blobL2).toBeInstanceOf(Blob);
    expect(blobL2.size).toBeGreaterThan(0);
    expect(missingL2).toEqual([]);
    const arrayBufferL2 = await blobL2.arrayBuffer();
    const zipL2 = await JSZip.loadAsync(arrayBufferL2);

    for (const work of selectedWorks) {
      const baseName = (work.displayName || work.file).replace(/\.(txt|html|htm|docx|rtf)$/i, '');
      const txtEntry = zipL2.file(`DEMO-11/${work.subdir}/${baseName}.txt`);
      const htmEntry = zipL2.file(`DEMO-11/${work.subdir}/${baseName}.htm`);
      const docxEntry = zipL2.file(`DEMO-11/${work.subdir}/${baseName}.docx`);
      expect(txtEntry).not.toBeNull();
      expect(htmEntry).not.toBeNull();
      expect(docxEntry).not.toBeNull();
      const txtContent = await txtEntry!.async('string');
      expect(txtContent.length).toBeGreaterThan(0);
    }

    // Test L3 (subfolder structure with txt and diverse htm/docx/rtf)
    const testWorksL3 = [WORKS[0], WORKS[1], WORKS[2], WORKS[3]];
    const { blob: blobL3, missing: missingL3 } = await buildTask11ZipBlob('DEMO-11', 3, 'Prose', testWorksL3);
    expect(blobL3).toBeInstanceOf(Blob);
    expect(blobL3.size).toBeGreaterThan(0);
    expect(missingL3).toEqual([]);
    const arrayBufferL3 = await blobL3.arrayBuffer();
    const zipL3 = await JSZip.loadAsync(arrayBufferL3);

    const baseName0 = (testWorksL3[0].displayName || testWorksL3[0].file).replace(/\.(txt|html|htm|docx|rtf)$/i, '');
    const baseName1 = (testWorksL3[1].displayName || testWorksL3[1].file).replace(/\.(txt|html|htm|docx|rtf)$/i, '');
    const baseName2 = (testWorksL3[2].displayName || testWorksL3[2].file).replace(/\.(txt|html|htm|docx|rtf)$/i, '');

    // Work 0 has txt, htm, docx
    expect(zipL3.file(`DEMO-11/${testWorksL3[0].subdir}/${baseName0}.txt`)).not.toBeNull();
    expect(zipL3.file(`DEMO-11/${testWorksL3[0].subdir}/${baseName0}.htm`)).not.toBeNull();
    expect(zipL3.file(`DEMO-11/${testWorksL3[0].subdir}/${baseName0}.docx`)).not.toBeNull();

    // Work 1 has txt, rtf
    expect(zipL3.file(`DEMO-11/${testWorksL3[1].subdir}/${baseName1}.txt`)).not.toBeNull();
    expect(zipL3.file(`DEMO-11/${testWorksL3[1].subdir}/${baseName1}.rtf`)).not.toBeNull();

    // Work 2 has txt, docx, rtf
    expect(zipL3.file(`DEMO-11/${testWorksL3[2].subdir}/${baseName2}.txt`)).not.toBeNull();
    expect(zipL3.file(`DEMO-11/${testWorksL3[2].subdir}/${baseName2}.docx`)).not.toBeNull();
    expect(zipL3.file(`DEMO-11/${testWorksL3[2].subdir}/${baseName2}.rtf`)).not.toBeNull();

    // Test missing files handling: empty content work
    const emptyWork = {
      id: 'empty_work',
      author: 'Тест',
      title: 'Пустой',
      file: 'empty.txt',
      displayName: 'Пустой.txt',
      path: '',
      subdir: 'Тест',
      characters: [],
      phrases: [],
      hooks: [],
      relations: [],
      situations: [],
    };
    const { blob: blobEmpty, missing: missingEmpty } = await buildTask11ZipBlob('DEMO-MISSING', 1, 'Тест', [WORKS[0], emptyWork]);
    expect(blobEmpty).toBeInstanceOf(Blob);
    expect(missingEmpty).toContain('Пустой.txt');
    const zipEmpty = await JSZip.loadAsync(await blobEmpty.arrayBuffer());
    expect(zipEmpty.file('DEMO-MISSING/Пустой.txt')).toBeNull();
    expect(zipEmpty.file('DEMO-MISSING/Хамелеон.txt')).not.toBeNull();
  });

  it('buildTask12ZipBlob generates a valid zip archive with expected structure and byte sizes', async () => {
    const files: FileNode[] = [
      {
        name: 'rasskaz_01',
        ext: 'txt',
        fullName: 'rasskaz_01.txt',
        sizeBytes: 1500,
        genre: 'Проза',
        author: 'Чехов',
        relPath: 'Проза/Чехов/rasskaz_01.txt',
      },
      {
        name: 'stih_01',
        ext: 'html',
        fullName: 'stih_01.html',
        sizeBytes: 2400,
        genre: 'Поэзия',
        author: 'Пушкин',
        relPath: 'Поэзия/Пушкин/stih_01.html',
      },
    ];

    const blob = await buildTask12ZipBlob('DEMO-12', files);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    for (const file of files) {
      const fileEntry = zip.file(`DEMO-12/${file.genre}/${file.author}/${file.fullName}`);
      expect(fileEntry).not.toBeNull();
      const bytes = await fileEntry!.async('uint8array');
      expect(bytes.length).toBe(file.sizeBytes);
    }
  });

  it('buildTask14XlsxBlob generates a valid xlsx workbook with sheets and headers', async () => {
    const mockData: Task14Data = {
      rows: [
        { district: 'Северный', subject: 'Информатика', score: 85 },
        { district: 'Южный', subject: 'Физика', score: 92 },
      ],
      columns: [
        { key: 'district', label: 'Округ', letter: 'A' },
        { key: 'subject', label: 'Предмет', letter: 'B' },
        { key: 'score', label: 'Балл', letter: 'C' },
      ],
      questions: ['Средний балл', 'Количество участников'],
      answers: [88.5, 2],
      chartData: [{ district: 'Северный', count: 1 }, { district: 'Южный', count: 1 }],
      chartTitle: 'Распределение участников',
      statement: 'Тестовое задание 14',
      shortHint: 'Подсказка',
      hint: 'Полная подсказка',
      formula1: '=AVERAGE(...)',
      formula2: '=COUNTIF(...)',
      themeName: 'Ученики',
    };

    const blob = await buildTask14XlsxBlob(mockData);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    const arrayBuffer = await blob.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    expect(workbook.SheetNames).toContain('Ученики');

    const sheet = workbook.Sheets['Ученики'];
    const rows = XLSX.utils.sheet_to_json(sheet);
    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual({
      'Округ': 'Северный',
      'Предмет': 'Информатика',
      'Балл': 85,
    });
  });

  it('buildAttachment routes task IDs correctly and returns null for unattached tasks', async () => {
    const task11Data = {
      rootDir: 'DEMO-11',
      level: 1,
      subdir: 'Prose',
      selectedWorks: [WORKS[0]],
    };
    const blob11 = await buildAttachment(11, task11Data);
    expect(blob11).not.toBeNull();
    expect(blob11!.size).toBeGreaterThan(0);

    const task12Data = {
      rootDir: 'DEMO-12',
      files: [{
        name: 'test',
        ext: 'txt',
        fullName: 'test.txt',
        sizeBytes: 100,
        genre: 'Проза',
        author: 'Чехов',
        relPath: 'Проза/Чехов/test.txt',
      }],
    };
    const blob12 = await buildAttachment(12, task12Data);
    expect(blob12).not.toBeNull();
    expect(blob12!.size).toBeGreaterThan(0);

    const blob1 = await buildAttachment(1, {});
    expect(blob1).toBeNull();

    const blobNull = await buildAttachment(11, null);
    expect(blobNull).toBeNull();
  });
});

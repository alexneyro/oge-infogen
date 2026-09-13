import { SetEntry, SetConfig, shortSetCode, fileCode } from '../set';
import { buildAttachment, attachmentName } from './attachments';

export interface BuildSetZipOptions {
  includeNotepad: boolean;
}

export interface BuildSetZipResult {
  blob: Blob;
  missing: string[];
}

export function generateNotepadContent(entries: SetEntry[], cfg: SetConfig): string {
  const shortCode = shortSetCode(cfg);
  const lines: string[] = [
    '# Блокнот для внесения ответов',
    '# Строки, начинающиеся со знака #, являются комментариями и не считываются при автоматической проверке.',
    '# Вписывайте ответы строго после двоеточия на соответствующей строке.',
    '#',
    'Фамилия и имя: ',
    'Класс: ',
    `Набор: ${cfg.title || 'Набор заданий'} (${shortCode})`,
    `# код набора: ${shortCode} — не удаляйте эту строку`,
    '',
    '===== ОТВЕТЫ =====',
  ];

  for (const entry of entries) {
    if (entry.taskId === 14) {
      lines.push(`${entry.position}.1: `);
      lines.push(`${entry.position}.2: `);
      lines.push(`# ${entry.position}.3 (диаграмма) проверяет учитель`);
    } else if (entry.taskId === 15) {
      lines.push(`# задание 15, язык КуМир`);
      lines.push(`${entry.position}:`);
      lines.push('--- начало программы ---');
      lines.push('');
      lines.push('--- конец программы ---');
    } else if (entry.taskId === 16) {
      lines.push(`# задание 16, язык Python`);
      lines.push(`${entry.position}:`);
      lines.push('--- начало программы ---');
      lines.push('');
      lines.push('--- конец программы ---');
    } else {
      lines.push(`${entry.position}: `);
    }
  }

  lines.push('');
  return lines.join('\r\n');
}

/**
 * Создаёт ZIP-архив набора заданий со следующей структурой:
 * <Название>_<shortSetCode>/
 *   README.txt
 *   files/
 *   ответы/
 *
 * Все текстовые файлы записываются в кодировке UTF-8 с BOM (\uFEFF).
 */
export async function buildSetZipBlob(
  entries: SetEntry[],
  cfg: SetConfig,
  opts: { includeNotepad: boolean }
): Promise<BuildSetZipResult> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const missing: string[] = [];

  const shortCode = shortSetCode(cfg);
  const fCode = fileCode(cfg);
  const safeTitle = (cfg.title || 'Набор').replace(/[/\\:*?"<>|]/g, '_').trim() || 'Набор';
  const rootFolderName = `${safeTitle}_${fCode}`;

  const withBom = (text: string) => '\uFEFF' + text;

  // 1. Формирование файлов вложений в files/
  const attachmentFiles = new Set<number>();

  for (const entry of entries) {
    // Вложения формируются только если buildAttachment возвращает не-null
    const kind = entry.taskId === 14 ? 'xlsx' : 'zip';
    const fileName = attachmentName(entry.taskId, entry.position, kind);

    try {
      const attBlob = await buildAttachment(entry.taskId, entry.taskData);
      if (attBlob) {
        const attBuffer = await attBlob.arrayBuffer();
        // Вложения (.zip, .xlsx) уже сжаты, сохраняем с STORE
        zip.file(`${rootFolderName}/files/${fileName}`, attBuffer, { compression: 'STORE' });
        attachmentFiles.add(entry.position);
      }
    } catch (err) {
      missing.push(fileName);
    }
  }

  // 2. Формирование README.txt
  const dateStr = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const positionLines = entries.map((entry) => {
    const kind = entry.taskId === 14 ? 'xlsx' : 'zip';
    const fileName = attachmentName(entry.taskId, entry.position, kind);
    const filePart = attachmentFiles.has(entry.position) ? ` — файл: files/${fileName}` : '';
    return `поз. ${entry.position} — задание ${entry.taskId} (уровень ${entry.difficulty})${filePart}`;
  });

  const hasTask14 = entries.some((e) => e.taskId === 14);
  const hasTask15 = entries.some((e) => e.taskId === 15);
  const hasTask16 = entries.some((e) => e.taskId === 16);

  const instructions: string[] = [
    `1. Печать: задания набора можно распечатать через генератор, указав короткий код ${shortCode}.`,
    `2. Ответы: в папке «ответы» находится файл «Фамилия_${fCode}.txt» для внесения ответов учащимися.`,
  ];

  if (hasTask14) {
    instructions.push(
      '3. Задание 14 (Электронные таблицы): числовые ответы на вопросы 1 и 2 вносятся в строки N.1 и N.2 блокнота. Диаграмма (пункт 3) оценивается учителем вручную.'
    );
  }

  if (hasTask15 && hasTask16) {
    instructions.push(
      '4. Практические задания 15 (Робот) и 16 (Python): код программы можно вставить прямо в блок между «--- начало программы ---» и «--- конец программы ---» в файле блокнота, либо сохранить в отдельные файлы-заготовки в папке «ответы».'
    );
  } else if (hasTask15) {
    instructions.push(
      '4. Практическое задание 15 (Робот): программу на языке КуМир можно вставить в блок блокнота («--- начало программы ---») или сохранить в файл-заготовку «_робот.txt».'
    );
  } else if (hasTask16) {
    instructions.push(
      '4. Практическое задание 16 (Python): решение можно вставить в блок блокнота («--- начало программы ---») или сохранить в файл-заготовку «_программа.py».'
    );
  }

  const readmeContent = [
    `НАБОР ЗАДАНИЙ: ${cfg.title || 'Набор заданий'}`,
    `Короткий код: ${shortCode}`,
    `Метка файлов: ${fCode}`,
    `Дата формирования: ${dateStr}`,
    '',
    `Код восстановления набора:`,
    shortCode,
    `(этой строкой можно восстановить набор в программе)`,
    '',
    'СПИСОК ПОЗИЦИЙ:',
    ...positionLines,
    '',
    'ИНСТРУКЦИИ:',
    ...instructions,
    '',
  ].join('\r\n');

  zip.file(`${rootFolderName}/README.txt`, withBom(readmeContent));

  // 3. Формирование папки ответы/ при includeNotepad
  if (opts.includeNotepad) {
    const notepadContent = generateNotepadContent(entries, cfg);

    zip.file(
      `${rootFolderName}/ответы/Фамилия_${fCode}.txt`,
      withBom(notepadContent)
    );

    // Заготовки для заданий 15 и 16
    for (const entry of entries) {
      if (entry.taskId === 15) {
        const robotContent = [
          `# Задание 15 (позиция ${entry.position}). Программа для исполнителя Робот`,
          `# Напишите решение ниже:`,
          '',
        ].join('\r\n');
        zip.file(
          `${rootFolderName}/ответы/${entry.position}_робот.txt`,
          withBom(robotContent)
        );
      } else if (entry.taskId === 16) {
        const progContent = [
          `# Задание 16 (позиция ${entry.position}). Программа на языке Python`,
          `# Напишите решение ниже:`,
          '',
        ].join('\r\n');
        zip.file(
          `${rootFolderName}/ответы/${entry.position}_программа.py`,
          withBom(progContent)
        );
      }
    }
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return { blob, missing };
}

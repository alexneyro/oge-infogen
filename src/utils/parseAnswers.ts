export interface ParsedAnswer {
  position: number;
  sub?: number;
  raw: string;
  kind: 'line' | 'block';
}

export interface ParseResult {
  answers: ParsedAnswer[];
  student: string; // из «Фамилия и имя:»
  grade: string; // из «Класс:»
  setCode: string; // короткий код из строки «Набор: … (XXXXX)»
  unreadLines: string[];
}

const BLOCK_START_RE = /^\s*-{2,}\s*начало\s+программы\s*-{2,}\s*$/i;
const BLOCK_END_RE = /^\s*-{2,}\s*конец\s+программы\s*-{2,}\s*$/i;

/**
 * Парсит текст блокнота с ответами ученика.
 * Поддерживает:
 * - Однострочные ответы «N: ответ»
 * - Поднаветы «N.M: ответ» (например, «14.1: 52», «14.2: 44.5»)
 * - Многострочные блоки кода «--- начало программы ---» ... «--- конец программы ---»
 *   (внутри блоков комментарии # не вырезаются, отступы сохраняются)
 */
export function parseAnswersText(text: string): ParseResult {
  const result: ParseResult = {
    answers: [],
    student: '',
    grade: '',
    setCode: '',
    unreadLines: [],
  };

  if (!text || typeof text !== 'string') {
    return result;
  }

  // Убираем BOM, если закрался
  const cleanText = text.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/);

  // Проверяем наличие разделителя «=====»
  const separatorIndex = lines.findIndex((l) => /^\s*={3,}/.test(l));

  let headerLines: string[] = [];
  let answerLines: string[] = [];

  if (separatorIndex !== -1) {
    headerLines = lines.slice(0, separatorIndex);
    answerLines = lines.slice(separatorIndex + 1);
  } else {
    // Разделителя нет: весь текст разбираем, но попытаемся распознать шапку
    answerLines = lines;
  }

  // 1. Разбор шапки (если есть явная секция шапки)
  for (const rawLine of headerLines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith('#')) {
      const commentCodeMatch = line.match(/^#\s*код\s+набора\s*:\s*([A-Za-z0-9_-]+)/i);
      if (commentCodeMatch && !result.setCode) {
        result.setCode = commentCodeMatch[1].trim();
      }
      continue;
    }

    const studentMatch = line.match(/^Фамилия(?:\s+и\s+имя)?\s*:\s*(.*)$/i);
    if (studentMatch) {
      result.student = studentMatch[1].trim();
      continue;
    }

    const gradeMatch = line.match(/^Класс\s*:\s*(.*)$/i);
    if (gradeMatch) {
      result.grade = gradeMatch[1].trim();
      continue;
    }

    const setMatch = line.match(/^Набор\s*:\s*(.*)$/i);
    if (setMatch) {
      const fullSet = setMatch[1].trim();
      // Ищем код в скобках (XXXXX) или всю строку
      const codeInParens = fullSet.match(/\(([A-Za-z0-9_-]+)\)/);
      const code = codeInParens ? codeInParens[1].trim() : fullSet;
      if (code && !result.setCode) {
        result.setCode = code;
      }
      continue;
    }

    result.unreadLines.push(rawLine);
  }

  // 2. Разбор ответов
  // Состояние парсера блоков:
  let inBlock = false;
  let blockPos = 0;
  let blockLines: string[] = [];
  let pendingPosForBlock: number | null = null;

  // Карта для ответов: ключ string `${pos}.${sub || 0}` -> ParsedAnswer & origLine
  const answersMap = new Map<string, { answer: ParsedAnswer; origLine: string }>();

  const saveAnswer = (ans: ParsedAnswer, origLine: string) => {
    const key = `${ans.position}.${ans.sub ?? 0}`;
    if (answersMap.has(key)) {
      const existing = answersMap.get(key)!;
      if (ans.raw !== '' && existing.answer.raw !== '') {
        result.unreadLines.push(
          `Дубликат позиции ${ans.position}${ans.sub ? '.' + ans.sub : ''}: заменено новым значением`
        );
        answersMap.set(key, { answer: ans, origLine });
      } else if (ans.raw !== '' && existing.answer.raw === '') {
        answersMap.set(key, { answer: ans, origLine });
      } else {
        result.unreadLines.push(
          `Дубликат позиции ${ans.position}${ans.sub ? '.' + ans.sub : ''}: проигнорирована повторная пустая строка`
        );
      }
    } else {
      answersMap.set(key, { answer: ans, origLine });
    }
  };

  for (let i = 0; i < answerLines.length; i++) {
    const rawLine = answerLines[i];
    const trimmed = rawLine.trim();

    // Если мы внутри блока программы:
    if (inBlock) {
      if (BLOCK_END_RE.test(trimmed)) {
        // Завершение блока
        inBlock = false;
        // Триммируем пустые строки только в начале и конце блока, сохраняя внутренние отступы и строки
        let startIdx = 0;
        while (startIdx < blockLines.length && blockLines[startIdx].trim() === '') {
          startIdx++;
        }
        let endIdx = blockLines.length - 1;
        while (endIdx >= startIdx && blockLines[endIdx].trim() === '') {
          endIdx--;
        }
        const cleanedBlock = startIdx <= endIdx ? blockLines.slice(startIdx, endIdx + 1).join('\n') : '';
        saveAnswer(
          {
            position: blockPos,
            raw: cleanedBlock,
            kind: 'block',
          },
          `[блок позиции ${blockPos}]`
        );
        blockLines = [];
        blockPos = 0;
        continue;
      } else {
        // Внутри блока сохраняем строку как есть (включая # комментарии)
        blockLines.push(rawLine);
        continue;
      }
    }

    // Вне блока: пустые строки и комментарии пропускаем
    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('#')) {
      const commentCodeMatch = trimmed.match(/^#\s*код\s+набора\s*:\s*([A-Za-z0-9_-]+)/i);
      if (commentCodeMatch && !result.setCode) {
        result.setCode = commentCodeMatch[1].trim();
      }
      continue;
    }

    // Если нет шапки, проверим на строки заголовка
    if (separatorIndex === -1) {
      const sMatch = trimmed.match(/^Фамилия(?:\s+и\s+имя)?\s*:\s*(.*)$/i);
      if (sMatch && !result.student) {
        result.student = sMatch[1].trim();
        continue;
      }
      const gMatch = trimmed.match(/^Класс\s*:\s*(.*)$/i);
      if (gMatch && !result.grade) {
        result.grade = gMatch[1].trim();
        continue;
      }
      const setMatch = trimmed.match(/^Набор\s*:\s*(.*)$/i);
      if (setMatch) {
        const fullSet = setMatch[1].trim();
        const codeInParens = fullSet.match(/\(([A-Za-z0-9_-]+)\)/);
        const code = codeInParens ? codeInParens[1].trim() : fullSet;
        if (code && !result.setCode) {
          result.setCode = code;
        }
        continue;
      }
    }

    // Проверяем на маркер начала блока: --- начало программы ---
    if (BLOCK_START_RE.test(trimmed)) {
      if (pendingPosForBlock !== null) {
        inBlock = true;
        blockPos = pendingPosForBlock;
        pendingPosForBlock = null;
        blockLines = [];
        continue;
      } else {
        // Начало блока без предварительной позиции
        result.unreadLines.push(`Маркер начала программы без указания позиции: «${trimmed}»`);
        continue;
      }
    }

    // Если ранее была строка позиции с пустым ответом, а следующая строка — не маркер блока
    if (pendingPosForBlock !== null) {
      // Сохраняем как обычную пустую позицию
      saveAnswer(
        {
          position: pendingPosForBlock,
          raw: '',
          kind: 'line',
        },
        `${pendingPosForBlock}:`
      );
      pendingPosForBlock = null;
    }

    // Проверяем формат «N.M: ответ» (поднаветы, например, 14.1, 14.2)
    const subMatch = rawLine.match(/^\s*(\d{1,2})\s*[.]\s*(\d{1,2})\s*[:.)\-–]?\s*(.*)$/);
    if (subMatch) {
      const pos = parseInt(subMatch[1], 10);
      const sub = parseInt(subMatch[2], 10);
      const rawAns = subMatch[3].trim();
      saveAnswer(
        {
          position: pos,
          sub,
          raw: rawAns,
          kind: 'line',
        },
        rawLine
      );
      continue;
    }

    // Проверяем формат «N: ответ»
    const answerMatch = rawLine.match(/^\s*(\d{1,2})\s*[:.)\-–]?\s*(.*)$/);
    if (answerMatch) {
      const pos = parseInt(answerMatch[1], 10);
      const rawAns = answerMatch[2].trim();

      // Если ответ пустой (или строка вида "15:" / "15: "), возможно дальше идёт блок программы
      if (rawAns === '') {
        // Проверим следующую непустую строку на BLOCK_START_RE
        let nextNonEmpty = '';
        for (let j = i + 1; j < answerLines.length; j++) {
          const nextTrim = answerLines[j].trim();
          if (nextTrim) {
            nextNonEmpty = nextTrim;
            break;
          }
        }
        if (BLOCK_START_RE.test(nextNonEmpty)) {
          pendingPosForBlock = pos;
          continue;
        }
      }

      saveAnswer(
        {
          position: pos,
          raw: rawAns,
          kind: 'line',
        },
        rawLine
      );
      continue;
    }

    result.unreadLines.push(rawLine);
  }

  // Если блок остался незакрытым
  if (inBlock) {
    result.unreadLines.push(`Предупреждение: блок программы для позиции ${blockPos} не был закрыт (отсутствует «--- конец программы ---»)`);
    let startIdx = 0;
    while (startIdx < blockLines.length && blockLines[startIdx].trim() === '') {
      startIdx++;
    }
    let endIdx = blockLines.length - 1;
    while (endIdx >= startIdx && blockLines[endIdx].trim() === '') {
      endIdx--;
    }
    const cleanedBlock = startIdx <= endIdx ? blockLines.slice(startIdx, endIdx + 1).join('\n') : '';
    saveAnswer(
      {
        position: blockPos,
        raw: cleanedBlock,
        kind: 'block',
      },
      `[блок позиции ${blockPos}]`
    );
  } else if (pendingPosForBlock !== null) {
    saveAnswer(
      {
        position: pendingPosForBlock,
        raw: '',
        kind: 'line',
      },
      `${pendingPosForBlock}:`
    );
  }

  // Формируем отсортированный массив answers
  const sortedEntries = Array.from(answersMap.values()).sort((a, b) => {
    if (a.answer.position !== b.answer.position) {
      return a.answer.position - b.answer.position;
    }
    return (a.answer.sub ?? 0) - (b.answer.sub ?? 0);
  });

  result.answers = sortedEntries.map((e) => e.answer);

  return result;
}

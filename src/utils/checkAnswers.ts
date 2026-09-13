import { Difficulty, TaskModule } from '../types';
import { SetEntry } from '../set';
import { getTaskById } from '../tasks';
import { getAnswerKey } from './answerKey';
import { ParseResult, ParsedAnswer } from './parseAnswers';
import { runTests16, parseUserAnswer16 } from '../tasks/task16';

export interface CheckedRow {
  position: number;
  taskId: number;
  difficulty: Difficulty;
  raw: string; // что прочитано
  expected: string; // getAnswerKey(...).display
  status: 'correct' | 'wrong' | 'empty' | 'manual';
  score: number;
  maxScore: number;
  partialManual?: boolean; // Например, задание 14: авто 2 балла + 1 балл диаграмма вручную
  subAnswers?: { sub: number; raw: string; correct?: boolean }[];
  details?: string[];
}

export interface CheckSetResult {
  rows: CheckedRow[];
  total: number;
  max: number;
  notes: string[];
}

export interface RunProgramsResult {
  score: number;
  maxScore: number;
  ran: boolean;
  details: string[];
}

/**
 * Прогоняет автопроверку для всех заданий 16 в наборе ПОСЛЕДОВАТЕЛЬНО.
 *
 * @param entries Список заданий набора
 * @param parsed Распарсенный блокнот ученика
 * @param onProgress Callback прогресса (done, total)
 * @param uploadedFiles Дополнительные файлы программ (например, 16_программа.py)
 */
export async function runProgramsForSet(
  entries: SetEntry[],
  parsed: ParseResult,
  onProgress?: (done: number, total: number) => void,
  uploadedFiles?: Record<number, string>
): Promise<Map<number, RunProgramsResult>> {
  const resultMap = new Map<number, RunProgramsResult>();

  // Группировка ответов блокнота по position
  const answersByPos = new Map<number, ParsedAnswer[]>();
  for (const ans of parsed.answers) {
    const arr = answersByPos.get(ans.position) || [];
    arr.push(ans);
    answersByPos.set(ans.position, arr);
  }

  const task16Entries = entries.filter((e) => e.taskId === 16);
  const total = task16Entries.length;

  if (total === 0) {
    onProgress?.(0, 0);
    return resultMap;
  }

  let done = 0;
  onProgress?.(0, total);

  for (const entry of task16Entries) {
    const fileContent = uploadedFiles?.[entry.position];
    const posAnswers = answersByPos.get(entry.position) || [];

    let code = fileContent;
    if (!code) {
      const blockAns = posAnswers.find((a) => a.kind === 'block');
      code = blockAns ? blockAns.raw : posAnswers[0]?.raw ?? '';
    }

    const parsed16 = parseUserAnswer16(code || '');
    const cleanCode = parsed16.code || code || '';
    const lang = (parsed16.lang || 'python').toLowerCase() as 'python' | 'pascal' | 'cpp';

    try {
      const testRes = await runTests16(entry.taskData, cleanCode, lang);
      resultMap.set(entry.position, testRes);
    } catch {
      resultMap.set(entry.position, {
        score: 0,
        maxScore: 2,
        ran: false,
        details: ['не удалось загрузить среду Python'],
      });
    }

    done++;
    onProgress?.(done, total);
  }

  return resultMap;
}

/**
 * Оценивает результаты набора заданий на основе распарсенных ответов и опциональных файлов-решений.
 * Сопоставление происходит строго по position.
 *
 * @param entries Список сгенерированных заданий набора
 * @param parsed Распарсенный блокнот ученика
 * @param currentSetCode Текущий короткий код набора для сверки
 * @param uploadedFiles Дополнительные файлы (например, '15_робот.txt', '16_программа.py'), привязанные к позиции
 */
export function checkSet(
  entries: SetEntry[],
  parsed: ParseResult,
  currentSetCode?: string,
  uploadedFiles?: Record<number, string>
): CheckSetResult {
  const rows: CheckedRow[] = [];
  const notes: string[] = [];
  let totalScore = 0;
  let maxScore = 0;

  // 1. Проверка совпадения кода набора
  if (parsed.setCode && currentSetCode) {
    const normParsed = parsed.setCode.trim().toUpperCase();
    const normCurrent = currentSetCode.trim().toUpperCase();
    if (normParsed !== normCurrent) {
      notes.push(
        `Внимание: код набора в файле (${parsed.setCode}) не совпадает с кодом текущего набора (${currentSetCode}). Проверка выполнена по структуре открытого набора.`
      );
    }
  } else if (!parsed.setCode) {
    notes.push(
      'Код набора в файле не найден, проверка выполнена по структуре открытого набора.'
    );
  }

  // Группировка ответов блокнота по position
  const answersByPos = new Map<number, ParsedAnswer[]>();
  for (const ans of parsed.answers) {
    const arr = answersByPos.get(ans.position) || [];
    arr.push(ans);
    answersByPos.set(ans.position, arr);
  }

  let hasManualTasks = false;

  // 2. Проход по позициям набора
  for (const entry of entries) {
    const mod: TaskModule | undefined = getTaskById(entry.taskId);
    const itemMax = mod?.maxPoints ?? 1;
    maxScore += itemMax;

    const answerKey = getAnswerKey(entry.taskId, entry.taskData);
    const expected = answerKey.display;

    // Решение из отдельного загруженного файла (приоритет над блоком блокнота)
    const fileContent = uploadedFiles?.[entry.position];
    const posAnswers = answersByPos.get(entry.position) || [];

    // Задание 14: числовые ответы на вопросы 1 и 2 (14.1, 14.2) + ручная диаграмма
    if (entry.taskId === 14) {
      const sub1 = posAnswers.find((a) => a.sub === 1)?.raw ?? '';
      const sub2 = posAnswers.find((a) => a.sub === 2)?.raw ?? '';
      const lineAns = posAnswers.find((a) => !a.sub)?.raw ?? '';

      let a1 = sub1;
      let a2 = sub2;

      // Если ученик записал в одну строку через разделители "|" или пробел/запятую
      if (!a1 && !a2 && lineAns) {
        if (lineAns.includes('|')) {
          const parts = lineAns.split('|');
          a1 = parts[0]?.trim() ?? '';
          a2 = parts[1]?.trim() ?? '';
        } else {
          const parts = lineAns.split(/[\s,;]+/);
          a1 = parts[0]?.trim() ?? '';
          a2 = parts[1]?.trim() ?? '';
        }
      }

      const compositeUserAnswer = `${a1}|${a2}|0`;
      const rawDisplay = a1 || a2 ? `1) ${a1 || '—'}  2) ${a2 || '—'}` : lineAns || '';

      if (!a1 && !a2 && !lineAns) {
        rows.push({
          position: entry.position,
          taskId: entry.taskId,
          difficulty: entry.difficulty,
          raw: '',
          expected,
          status: 'empty',
          score: 0,
          maxScore: itemMax,
          partialManual: true,
        });
        continue;
      }

      let score = 0;
      if (mod?.checkScore) {
        const res = mod.checkScore(entry.taskData, compositeUserAnswer);
        score = res.score; // от 0 до 2 за автопроверку вопросов 1 и 2
      }

      totalScore += score;

      rows.push({
        position: entry.position,
        taskId: entry.taskId,
        difficulty: entry.difficulty,
        raw: rawDisplay,
        expected,
        status: score === 2 ? 'correct' : score > 0 ? 'correct' : 'wrong',
        score,
        maxScore: itemMax,
        partialManual: true,
        subAnswers: [
          { sub: 1, raw: a1 },
          { sub: 2, raw: a2 },
        ],
      });
      continue;
    }

    // Задание 15 (Робот): автопроверка через checkScore
    if (entry.taskId === 15) {
      // Приоритет: отдельный файл _робот.txt -> блок блокнота -> обычная строка
      const blockAns = posAnswers.find((a) => a.kind === 'block');
      const blockOrLineCode = blockAns ? blockAns.raw : posAnswers[0]?.raw ?? '';

      if (fileContent && blockOrLineCode && fileContent.trim() !== blockOrLineCode.trim()) {
        notes.push(
          `Позиция ${entry.position} (задание 15): решение взято из отдельного файла программы (содержимое файла отличается от блока в блокноте).`
        );
      }

      let codeToTest = fileContent;
      if (!codeToTest) {
        codeToTest = blockOrLineCode;
      }

      const trimmedCode = (codeToTest || '').trim();
      if (!trimmedCode) {
        rows.push({
          position: entry.position,
          taskId: entry.taskId,
          difficulty: entry.difficulty,
          raw: '',
          expected: 'Программа для Робота (автопроверка)',
          status: 'empty',
          score: 0,
          maxScore: itemMax,
        });
        continue;
      }

      let score = 0;
      if (mod?.checkScore) {
        const res = mod.checkScore(entry.taskData, trimmedCode);
        score = res.score;
      } else if (mod?.check) {
        const ok = mod.check(entry.taskData, trimmedCode);
        score = ok ? itemMax : 0;
      }

      totalScore += score;
      const firstLine = trimmedCode.split('\n')[0] || '';
      const summaryRaw = trimmedCode.length > 50 ? `${firstLine}... (${trimmedCode.split('\n').length} строк)` : trimmedCode;

      rows.push({
        position: entry.position,
        taskId: entry.taskId,
        difficulty: entry.difficulty,
        raw: summaryRaw,
        expected: 'Программа для Робота',
        status: score === itemMax ? 'correct' : score > 0 ? 'correct' : 'wrong',
        score,
        maxScore: itemMax,
      });
      continue;
    }

    // Задание 13: ручная проверка учителем (форматирование документа)
    if (entry.taskId === 13) {
      hasManualTasks = true;
      const raw = posAnswers[0]?.raw ?? '';
      rows.push({
        position: entry.position,
        taskId: entry.taskId,
        difficulty: entry.difficulty,
        raw,
        expected: 'Проверяется учителем по файлу-решению',
        status: 'manual',
        score: 0,
        maxScore: itemMax,
      });
      continue;
    }

    // Задание 16: ручная проверка учителем (пока нет асинхронного pyRunner в пакетном чекере)
    if (entry.taskId === 16) {
      hasManualTasks = true;
      const blockAns = posAnswers.find((a) => a.kind === 'block');
      const blockOrLineCode = blockAns ? blockAns.raw : posAnswers[0]?.raw ?? '';

      if (fileContent && blockOrLineCode && fileContent.trim() !== blockOrLineCode.trim()) {
        notes.push(
          `Позиция ${entry.position} (задание 16): решение взято из отдельного файла программы (содержимое файла отличается от блока в блокноте).`
        );
      }

      let code = fileContent;
      if (!code) {
        code = blockOrLineCode;
      }
      const rawDisplay = (code || '').trim()
        ? `[код Python: ${(code || '').trim().split('\n').length} строк]`
        : '';
      rows.push({
        position: entry.position,
        taskId: entry.taskId,
        difficulty: entry.difficulty,
        raw: rawDisplay,
        expected: 'Проверяется учителем (задание 16)',
        status: 'manual',
        score: 0,
        maxScore: itemMax,
      });
      continue;
    }

    // Обычные задания (1-12)
    const raw = (posAnswers[0]?.raw ?? '').trim();

    if (!raw) {
      rows.push({
        position: entry.position,
        taskId: entry.taskId,
        difficulty: entry.difficulty,
        raw: '',
        expected,
        status: 'empty',
        score: 0,
        maxScore: itemMax,
      });
      continue;
    }

    // Проверка ответа через модуль задания
    let score = 0;
    let isCorrect = false;

    if (mod?.checkScore) {
      const res = mod.checkScore(entry.taskData, raw);
      score = res.score;
      isCorrect = score === itemMax;
    } else if (mod?.check) {
      isCorrect = mod.check(entry.taskData, raw);
      score = isCorrect ? itemMax : 0;
    }

    totalScore += score;

    rows.push({
      position: entry.position,
      taskId: entry.taskId,
      difficulty: entry.difficulty,
      raw,
      expected,
      status: isCorrect ? 'correct' : 'wrong',
      score,
      maxScore: itemMax,
    });
  }

  if (hasManualTasks) {
    notes.push(
      'Практические задания 13 и 16 требуют ручной проверки учителем (выставите баллы в таблице).'
    );
  }

  // Проверка на ответы вне диапазона позиций набора
  const maxPosition = entries.length > 0 ? Math.max(...entries.map((e) => e.position)) : 0;
  for (const ans of parsed.answers) {
    if (ans.position > maxPosition || ans.position < 1) {
      notes.push(
        `Ответ для позиции ${ans.position} («${ans.raw}») проигнорирован: в текущем наборе всего ${entries.length} заданий.`
      );
    }
  }

  return {
    rows,
    total: totalScore,
    max: maxScore,
    notes,
  };
}

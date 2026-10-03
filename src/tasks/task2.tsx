import React from 'react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { RNG } from '../utils/rng';
import { pickStable } from '../utils/stablePick';
import {
  StatementBlock,
  StatementText,
  StatementQuestion,
  SubBlock,
  BlockLabel,
  DataBlock,
  DataTable,
  Th,
  Td,
  AnswerField,
  AnswerChip,
  VerdictBox,
  HintBox,
} from '../components/task-ui';

export type CodeAlphabet = 'symbols' | 'morse' | 'digits_33';
export type SubType = 'decode_word' | 'count_letters' | 'find_unique_cipher' | 'find_repeating_letters';
export type ConstraintType = 'no_repeats';
export type RepeatMode = 'repeating' | 'non_repeating';

export interface CodeEntry {
  letter: string;
  code: string;
}

export interface DecodedStep {
  letter: string;
  code: string;
}

export interface DecodedPath {
  steps: DecodedStep[];
  word: string;
  validUnderConstraint: boolean;
  rejectReason?: string;
}

export interface Task2Data {
  level: Difficulty;
  subType: SubType;
  constraintType?: ConstraintType;
  alphabet?: CodeAlphabet;
  lang?: 'cyrillic' | 'latin';
  codeTable?: CodeEntry[];
  encodedMessage?: string;
  targetWord?: string;
  correctAnswer: string;
  statementIntro: string;
  constraintText?: string;
  questionText: string;
  shortHint: string;
  explanation: string;
  decodingsAnalysis?: DecodedPath[];
  // Subtype 1 fields
  ciphers?: string[];
  uniqueCipher?: string;
  cipherDecodingsMap?: Record<string, string[]>;
  // Subtype 2 fields
  repeatMode?: RepeatMode;
  letterCounts?: Record<string, number>;
}

export const RU_ALPHABET = [
  'А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ё', 'Ж', 'З', 'И',
  'Й', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т',
  'У', 'Ф', 'Х', 'Ц', 'Ч', 'Ш', 'Щ', 'Ъ', 'Ы', 'Ь',
  'Э', 'Ю', 'Я'
];

export const EN_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z'
];

// Пулы символьных кодов для уровней 1–2 (длина кодов 1–3 символа)
export const SYMBOL_POOLS_L1L2: string[][] = [
  // Двоичный
  ['0', '1', '00', '01', '10', '11', '000', '001', '010', '011', '100', '101', '110', '111'],
  // Троичный
  ['0', '1', '2', '00', '01', '02', '10', '11', '12', '20', '21', '22', '000', '001', '012', '021', '102', '120', '210', '222'],
  // Кружки
  ['•', '○', '••', '•○', '○•', '○○', '•••', '••○', '•○•', '○••', '○○•', '○○○'],
  // Точки и o
  ['.', 'o', '..', '.o', 'o.', 'oo', '...', '..o', '.o.', 'o..', 'oo.', 'ooo'],
  // Спецсимволы
  ['@', '~', '+', '#', '*', '@~', '+@', '~#', '#*', '@+', '~+', '+#', '*@', '~*', '@~+', '+#*'],
  // Треугольники
  ['▲', '▼', '▲▲', '▲▼', '▼▲', '▼▼', '▲▲▲', '▲▲▼', '▲▼▲', '▼▲▲'],
  // Звёзды
  ['★', '☆', '★☆', '☆★', '★★', '☆☆', '★★★', '★★☆', '☆★☆', '☆★★'],
  // Ромбы
  ['◆', '◇', '◆◇', '◇◆', '◆◆', '◇◇', '◆◆◇', '◇◆◇', '◆◇◆'],
  // Плюсы и минусы
  ['+', '-', '++', '+-', '-+', '--', '+++', '++-', '+-+', '-++'],
  // Стрелки
  ['→', '↑', '→→', '→↑', '↑→', '↑↑', '→→→', '→→↑', '→↑→', '↑→→', '↑↑→', '↑↑↑'],
  // Слэши
  ['/', '\\', '//', '/\\', '\\/', '\\\\', '///', '//\\', '/\\/', '\\//', '\\\\/'],
  // Восклицания
  ['!', '?', '!!', '!?', '?!', '??', '!!!', '!!?', '!?!', '?!!', '??!', '???'],
];

// Пулы символьных кодов для уровня 3 (длина кодов 1–4 символа)
export const SYMBOL_POOLS_L3: string[][] = [
  // Двоичный расширенный
  ['0', '1', '00', '01', '10', '11', '000', '001', '010', '100', '111',
   '0000', '0001', '0010', '0011', '1000', '1001', '1010', '1100', '1111'],
  // Троичный расширенный
  ['0', '1', '2', '00', '01', '10', '11', '20', '22', '000', '001', '012',
   '0000', '0001', '0012', '0102', '1002', '1200', '2001', '2222'],
  // Треугольники расширенные
  ['▲', '▼', '▲▲', '▲▼', '▼▲', '▼▼', '▲▲▲', '▲▲▼', '▲▼▲', '▼▲▲',
   '▲▲▲▲', '▲▲▲▼', '▲▲▼▲', '▲▼▲▲', '▼▲▲▲', '▼▼▲▲', '▼▲▼▲', '▼▼▼▼'],
  // Звёзды расширенные
  ['★', '☆', '★☆', '☆★', '★★', '☆☆', '★★★', '★★☆', '☆★☆', '☆★★',
   '★★★★', '★★★☆', '★★☆★', '★☆★★', '☆★★★', '☆☆★★', '☆★☆★', '☆☆☆☆'],
  // Кружки расширенные
  ['•', '○', '••', '•○', '○•', '○○', '•••', '••○', '•○•', '○••',
   '••••', '•••○', '••○•', '•○••', '○•••', '○○••', '○•○•', '○○○○'],
  // Стрелки расширенные
  ['→', '↑', '→→', '→↑', '↑→', '↑↑', '→→→', '→→↑', '→↑→', '↑→→',
   '→→→→', '→→→↑', '→→↑→', '→↑→→', '↑→→→', '↑↑→→', '↑→↑→', '↑↑↑↑'],
];

/**
 * Finds ALL possible prefix decompositions of encoded message using codeTable.
 */
export function findAllDecodings(
  encoded: string,
  table: CodeEntry[]
): DecodedStep[][] {
  const results: DecodedStep[][] = [];

  function search(index: number, currentPath: DecodedStep[]) {
    if (index === encoded.length) {
      results.push([...currentPath]);
      return;
    }

    for (const entry of table) {
      if (encoded.startsWith(entry.code, index)) {
        currentPath.push(entry);
        search(index + entry.code.length, currentPath);
        currentPath.pop();
      }
    }
  }

  search(0, []);
  return results;
}

/**
 * Finds all valid letter combinations for a numeric string in 1..33 alphabet.
 */
export function findAlphabetDecodings(numStr: string): string[] {
  const results: string[] = [];

  function search(idx: number, currentWord: string) {
    if (idx === numStr.length) {
      results.push(currentWord);
      return;
    }

    if (numStr[idx] !== '0') {
      // 1-digit code (1..9)
      const code1 = parseInt(numStr.substring(idx, idx + 1), 10);
      if (code1 >= 1 && code1 <= 33) {
        search(idx + 1, currentWord + RU_ALPHABET[code1 - 1]);
      }
      // 2-digit code (10..33)
      if (idx + 2 <= numStr.length) {
        const code2 = parseInt(numStr.substring(idx, idx + 2), 10);
        if (code2 >= 10 && code2 <= 33) {
          search(idx + 2, currentWord + RU_ALPHABET[code2 - 1]);
        }
      }
    }
  }

  search(0, '');
  return results;
}

/**
 * Finds all valid letter combinations for a numeric string in 1..26 Latin alphabet.
 */
export function findLatinAlphabetDecodings(numStr: string): string[] {
  const results: string[] = [];

  function search(idx: number, currentWord: string) {
    if (idx === numStr.length) {
      results.push(currentWord);
      return;
    }

    if (numStr[idx] !== '0') {
      // 1-digit code (1..9)
      const code1 = parseInt(numStr.substring(idx, idx + 1), 10);
      if (code1 >= 1 && code1 <= 26) {
        search(idx + 1, currentWord + EN_ALPHABET[code1 - 1]);
      }
      // 2-digit code (10..26)
      if (idx + 2 <= numStr.length) {
        const code2 = parseInt(numStr.substring(idx, idx + 2), 10);
        if (code2 >= 10 && code2 <= 26) {
          search(idx + 2, currentWord + EN_ALPHABET[code2 - 1]);
        }
      }
    }
  }

  search(0, '');
  return results;
}

/**
 * Solves decodings and analyzes compliance with "no_repeats" constraint.
 */
export function solveDecodings(
  encoded: string,
  table: CodeEntry[]
): DecodedPath[] {
  const rawPaths = findAllDecodings(encoded, table);
  const analyzed: DecodedPath[] = [];

  for (const steps of rawPaths) {
    const word = steps.map(s => s.letter).join('');
    let valid = true;
    let reason = '';

    const seen = new Set<string>();
    for (const s of steps) {
      if (seen.has(s.letter)) {
        valid = false;
        reason = `буква «${s.letter}» повторяется`;
        break;
      }
      seen.add(s.letter);
    }

    analyzed.push({
      steps,
      word,
      validUnderConstraint: valid,
      rejectReason: reason
    });
  }

  return analyzed;
}

/**
 * Builds code table for given letters and alphabet (symbols or morse).
 */
function generateCodeTable(letters: string[], alphabet: CodeAlphabet, rng: RNG): CodeEntry[] | null {
  let candidates: string[] = [];

  if (alphabet === 'symbols') {
    candidates = rng.pick(SYMBOL_POOLS_L1L2);
  } else {
    // morse
    candidates = [
      '•', '−',
      '••', '•−', '−•', '−−',
      '•••', '••−', '•−•', '•−−', '−••', '−•−', '−−•', '−−−'
    ];
  }

  const shuffled = rng.shuffle(candidates);
  const table: CodeEntry[] = [];
  const usedCodes = new Set<string>();

  for (let i = 0; i < letters.length; i++) {
    const code = shuffled.find(c => !usedCodes.has(c));
    if (!code) return null;
    usedCodes.add(code);
    table.push({ letter: letters[i], code });
  }

  return table;
}

/**
 * Generates short guiding hint (shown before submitting answer).
 */
export function buildShortHint(alphabet: CodeAlphabet): string {
  const alphName = alphabet === 'morse'
    ? 'точек и тире'
    : 'значков';

  return `• Начинайте расшифровку сообщения слева направо по цепочке ${alphName}.\n` +
    `• Сравнивайте начальный фрагмент сообщения с кодами букв из таблицы и пробуйте возможные варианты.\n` +
    `• Если при некотором варианте остаток сообщения не удаётся сопоставить с таблицей, вернитесь на шаг назад.\n` +
    `• При наличии нескольких вариантов расшифровки исключайте те, где буквы повторяются.`;
}

/**
 * Builds full step-by-step plain text explanation for standard tasks.
 */
export function buildExplanation(taskData: {
  codeTable?: CodeEntry[];
  encodedMessage?: string;
  subType: SubType;
  correctAnswer: string;
  targetWord?: string;
  decodingsAnalysis?: DecodedPath[];
}): string {
  const lines: string[] = [];

  lines.push('ШАГ 1. ПОШАГОВЫЙ ПЕРЕБОР И АНАЛИЗ ДЕКОДИРОВАНИЙ');
  lines.push(`Зашифрованное сообщение: ${taskData.encodedMessage || ''}`);
  lines.push('Ограничение: все буквы в исходном сообщении не повторяются.');
  lines.push('');
  lines.push(`Проанализируем все возможные варианты разбиения сообщения «${taskData.encodedMessage || ''}» по таблице кодов:`);
  lines.push('');

  const analysis = taskData.decodingsAnalysis || [];
  const totalDecodings = analysis.length;
  lines.push(`Всего найдено вариантов полного сопоставления с таблицей: ${totalDecodings}.`);
  lines.push('');

  analysis.forEach((path, idx) => {
    const stepsStr = path.steps.map(s => `${s.letter} (${s.code})`).join(' + ');
    lines.push(`Вариант ${idx + 1}: ${stepsStr} -> слово «${path.word}»`);
    if (path.validUnderConstraint) {
      lines.push('  Статус: УДОВЛЕТВОРЯЕТ условию (все буквы уникальны).');
    } else {
      lines.push(`  Статус: ОТБРАСЫВАЕТСЯ (${path.rejectReason}).`);
    }
    lines.push('');
  });

  lines.push('ШАГ 2. ИТОГОВЫЙ ВЫВОД');
  lines.push('С учётом условия уникальности букв существует ровно одно верное разбиение.');
  lines.push(`Корректное расшифрованное слово: ${taskData.targetWord || ''}.`);

  if (taskData.subType === 'count_letters') {
    lines.push(`Количество букв в исходном сообщении: ${taskData.correctAnswer}.`);
  } else {
    lines.push(`Ответ: ${taskData.correctAnswer}.`);
  }

  return lines.join('\n');
}

/**
 * Normalizes user answer for Cyrillic or Latin comparison without auto-translating layouts.
 */
function normalizeWord(s: string, lang: 'cyrillic' | 'latin' = 'cyrillic'): string {
  const cleaned = s.trim().toUpperCase();
  if (lang === 'latin') {
    return cleaned.replace(/[^A-Z]/g, '');
  }
  return cleaned.replace(/[^А-ЯЁ]/g, '');
}

/**
 * Converts string into set of normalized letters.
 */
function getNormalizedLetterSet(s: string, lang: 'cyrillic' | 'latin' = 'cyrillic'): Set<string> {
  const norm = normalizeWord(s, lang);
  return new Set(norm.split(''));
}

/**
 * Compares two sets of string values for equality.
 */
function areSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

/**
 * Generates Subtype 1 Binary: "find_unique_cipher" with symbols/binary code table (Level 2)
 */
function generateSubtype1BinaryTask(difficulty: Difficulty, rng: RNG): Task2Data | null {
  for (let attempt = 0; attempt < 300; attempt++) {
    const pool = rng.pick(difficulty === 3 ? SYMBOL_POOLS_L3 : SYMBOL_POOLS_L1L2);
    const candidates = pool;
    const numCodes = rng.int(5, 6);
    const shuffledPool = rng.shuffle(candidates);
    const selectedCodes = shuffledPool.slice(0, numCodes);
    const lengths = new Set(selectedCodes.map(c => c.length));
    if (lengths.size < 2) continue;

    const shuffledLetters = rng.shuffle(RU_ALPHABET);
    const table: CodeEntry[] = selectedCodes.map((code, idx) => ({
      letter: shuffledLetters[idx],
      code
    }));

    const numCiphers = rng.int(3, 4);
    const numAmbiguous = numCiphers - 1;

    const candidateCiphers: { cipher: string; decodings: string[] }[] = [];
    for (let c = 0; c < 30; c++) {
      const wordLen = rng.int(3, 5);
      const chosenEntries: CodeEntry[] = [];
      for (let i = 0; i < wordLen; i++) {
        chosenEntries.push(rng.pick(table));
      }
      const cipher = chosenEntries.map(e => e.code).join('');
      if (candidateCiphers.some(cand => cand.cipher === cipher)) continue;

      const paths = findAllDecodings(cipher, table);
      const decodings = paths.map(p => p.map(s => s.letter).join(''));
      candidateCiphers.push({ cipher, decodings });
    }

    const uniques = candidateCiphers.filter(e => e.decodings.length === 1);
    const ambiguous = candidateCiphers.filter(e => e.decodings.length >= 2 && e.decodings.length <= 5);

    if (uniques.length >= 1 && ambiguous.length >= numAmbiguous) {
      const selectedUnique = rng.pick(uniques);
      const selectedAmbiguous = rng.shuffle(ambiguous).slice(0, numAmbiguous);

      const allCiphers = rng.shuffle([selectedUnique, ...selectedAmbiguous]);
      const ciphersList = allCiphers.map(e => e.cipher);
      const targetWord = selectedUnique.decodings[0];
      const cipherDecodingsMap: Record<string, string[]> = {};
      allCiphers.forEach(e => {
        cipherDecodingsMap[e.cipher] = e.decodings;
      });

      const statementIntro = 'Ваня шифрует русские слова, записывая вместо каждой буквы её код по таблице (без пробелов). Некоторые шифровки можно расшифровать несколькими способами.';

      const ciphersText = ciphersList.map((c, i) => `${i + 1}) ${c}`).join('\n');
      const questionText = `Даны ${numCiphers} ${numCiphers === 3 ? 'шифровки' : 'шифровки'}:\n${ciphersText}\n\nТолько одна из них расшифровывается единственным способом. Найдите её и расшифруйте. В ответе запишите полученное слово.`;

      const shortHint = '• Сопоставляйте фрагменты каждой шифровки с кодами букв из кодовой таблицы.\n' +
        '• Для каждой шифровки попробуйте составить все возможные слова.\n' +
        '• Ищите ту шифровку, для которой возможен строго один вариант разбиения на коды из таблицы.';

      const expLines: string[] = [];
      expLines.push('ШАГ 1. СТРУКТУРА КОДОВОЙ ТАБЛИЦЫ И УСЛОВИЕ');
      expLines.push('Для кодирования букв используется неравномерный код.');
      expLines.push('Записи без пробелов могут допускать неоднозначность, так как фрагменты кодов могут перекрываться.');
      expLines.push('');
      expLines.push('ШАГ 2. АНАЛИЗ ПРЕДЛОЖЕННЫХ ШИФРОВОК');
      expLines.push('');

      allCiphers.forEach((item, idx) => {
        expLines.push(`Шифровка ${idx + 1}: ${item.cipher}`);
        if (item.decodings.length > 1) {
          expLines.push(`  Статус: НЕОДНОЗНАЧНА (всего вариантов: ${item.decodings.length}).`);
          expLines.push(`  Примеры расшифровок: "${item.decodings[0]}" и "${item.decodings[1]}".`);
        } else {
          expLines.push(`  Статус: ЕДИНСТВЕННЫЙ ВАРИАНТ!`);
          expLines.push(`  Единственная расшифровка даёт слово: "${item.decodings[0]}".`);
        }
        expLines.push('');
      });

      expLines.push('ШАГ 3. ИТОГОВЫЙ ВЫВОД');
      expLines.push(`Только шифровка "${selectedUnique.cipher}" имеет ровно один вариант расшифровки.`);
      expLines.push(`Ответ: ${targetWord}.`);

      return {
        level: difficulty,
        subType: 'find_unique_cipher',
        alphabet: 'symbols',
        lang: 'cyrillic',
        correctAnswer: targetWord,
        statementIntro,
        questionText,
        shortHint,
        explanation: expLines.join('\n'),
        ciphers: ciphersList,
        uniqueCipher: selectedUnique.cipher,
        cipherDecodingsMap,
        targetWord,
        codeTable: table
      };
    }
  }
  return null;
}

/**
 * Generates Subtype 1: "find_unique_cipher" (Level 3)
 */
function generateSubtype1Task(difficulty: Difficulty, rng: RNG): Task2Data | null {
  for (let attempt = 0; attempt < 300; attempt++) {
    const candidates: string[] = [];

    for (let c = 0; c < 35; c++) {
      const wordLen = rng.int(3, 5); // 3..5 letters
      const wordChars: string[] = [];
      for (let i = 0; i < wordLen; i++) {
        const randChar = rng.pick(RU_ALPHABET);
        wordChars.push(randChar);
      }
      const numStr = wordChars.map(ch => (RU_ALPHABET.indexOf(ch) + 1).toString()).join('');
      if (numStr.length >= 6 && numStr.length <= 7 && !candidates.includes(numStr)) {
        candidates.push(numStr);
      }
    }

    const numCiphers = difficulty === 3 ? rng.int(5, 6) : 4;
    const numAmb = numCiphers - 1;

    if (candidates.length < numCiphers) continue;

    const evaluated = candidates.map(str => ({
      cipher: str,
      decodings: findAlphabetDecodings(str)
    }));

    const uniques = evaluated.filter(e => e.decodings.length === 1);
    const ambiguous = evaluated.filter(e => e.decodings.length >= 2);

    if (uniques.length >= 1 && ambiguous.length >= numAmb) {
      const selectedUnique = rng.pick(uniques);
      const shuffledAmb = rng.shuffle(ambiguous).slice(0, numAmb);

      const allFour = rng.shuffle([selectedUnique, ...shuffledAmb]);
      const ciphersList = allFour.map(e => e.cipher);
      const targetWord = selectedUnique.decodings[0];
      const cipherDecodingsMap: Record<string, string[]> = {};
      allFour.forEach(e => {
        cipherDecodingsMap[e.cipher] = e.decodings;
      });

      const statementIntro = 'Ваня шифрует русские слова, записывая вместо каждой буквы её номер в алфавите (без пробелов). Некоторые шифровки можно расшифровать несколькими способами. Например, 311333 может означать ВАЛЯ, ЭЛЯ или ВААВВВ.';

      const ciphersText = ciphersList.map((c, i) => `${i + 1}) ${c}`).join('\n');
      const questionText = `Даны ${numCiphers} ${numCiphers === 4 ? 'шифровки' : 'шифровок'}:\n${ciphersText}\n\nТолько одна из них расшифровывается единственным способом. Найдите её и расшифруйте. В ответе запишите полученное слово.`;

      const shortHint = '• Номера букв в алфавите: от 1 (А) до 33 (Я).\n' +
        '• Число «1» может означать букву А (1) или быть частью двузначного номера (10–19).\n' +
        '• Для каждой шифровки попробуйте составить все возможные слова.\n' +
        '• Ищите ту шифровку, для которой возможен строго один вариант разбиения на номера 1–33.';

      const expLines: string[] = [];
      expLines.push('ШАГ 1. СТРУКТУРА АЛФАВИТА И УСЛОВИЕ');
      expLines.push('Буквы русского алфавита пронумерованы от 1 до 33 (А=1, Б=2, ..., Я=33).');
      expLines.push('Записи без пробелов допускают неоднозначность, так как цифра "1" может быть буквой А или началом двузначного числа (например, 10=И, 12=К и т.д.).');
      expLines.push('');
      expLines.push('ШАГ 2. АНАЛИЗ ПРЕДЛОЖЕННЫХ ШИФРОВОК');
      expLines.push('');

      allFour.forEach((item, idx) => {
        expLines.push(`Шифровка ${idx + 1}: ${item.cipher}`);
        if (item.decodings.length > 1) {
          expLines.push(`  Статус: НЕОДНОЗНАЧНА (всего вариантов: ${item.decodings.length}).`);
          expLines.push(`  Примеры расшифровок: "${item.decodings[0]}" и "${item.decodings[1]}".`);
        } else {
          expLines.push(`  Статус: ЕДИНСТВЕННЫЙ ВАРИАНТ!`);
          expLines.push(`  Единственная расшифровка даёт слово: "${item.decodings[0]}".`);
        }
        expLines.push('');
      });

      expLines.push('ШАГ 3. ИТОГОВЫЙ ВЫВОД');
      expLines.push(`Только шифровка "${selectedUnique.cipher}" имеет ровно один вариант расшифровки.`);
      expLines.push(`Ответ: ${targetWord}.`);

      return {
        level: difficulty,
        subType: 'find_unique_cipher',
        lang: 'cyrillic',
        correctAnswer: targetWord,
        statementIntro,
        questionText,
        shortHint,
        explanation: expLines.join('\n'),
        ciphers: ciphersList,
        uniqueCipher: selectedUnique.cipher,
        cipherDecodingsMap,
        targetWord
      };
    }
  }
  return null;
}

/**
 * Generates Subtype 1 EN: "find_unique_cipher" (English A-Z 1..26)
 */
function generateSubtype1TaskEn(difficulty: Difficulty, rng: RNG): Task2Data | null {
  for (let attempt = 0; attempt < 300; attempt++) {
    const candidates: string[] = [];

    for (let c = 0; c < 35; c++) {
      const wordLen = rng.int(3, 5); // 3..5 letters
      const wordChars: string[] = [];
      for (let i = 0; i < wordLen; i++) {
        const randChar = rng.pick(EN_ALPHABET);
        wordChars.push(randChar);
      }
      const numStr = wordChars.map(ch => (EN_ALPHABET.indexOf(ch) + 1).toString()).join('');
      if (numStr.length >= 6 && numStr.length <= 8 && !candidates.includes(numStr)) {
        candidates.push(numStr);
      }
    }

    const numCiphers = difficulty === 3 ? rng.int(5, 6) : 4;
    const numAmb = numCiphers - 1;

    if (candidates.length < numCiphers) continue;

    const evaluated = candidates.map(str => ({
      cipher: str,
      decodings: findLatinAlphabetDecodings(str)
    }));

    const uniques = evaluated.filter(e => e.decodings.length === 1);
    const ambiguous = evaluated.filter(e => e.decodings.length >= 2);

    if (uniques.length >= 1 && ambiguous.length >= numAmb) {
      const selectedUnique = rng.pick(uniques);
      const shuffledAmb = rng.shuffle(ambiguous).slice(0, numAmb);

      const allFour = rng.shuffle([selectedUnique, ...shuffledAmb]);
      const ciphersList = allFour.map(e => e.cipher);
      const targetWord = selectedUnique.decodings[0];
      const cipherDecodingsMap: Record<string, string[]> = {};
      allFour.forEach(e => {
        cipherDecodingsMap[e.cipher] = e.decodings;
      });

      const statementIntro = 'Ваня шифрует английские слова, записывая вместо каждой буквы её номер в английском алфавите (без пробелов). Некоторые шифровки можно расшифровать несколькими способами.';

      const ciphersText = ciphersList.map((c, i) => `${i + 1}) ${c}`).join('\n');
      const questionText = `Даны ${numCiphers} ${numCiphers === 4 ? 'шифровки' : 'шифровок'}:\n${ciphersText}\n\nТолько одна из них расшифровывается единственным способом. Найдите её и расшифруйте. В ответе запишите полученное слово.\n\nОбратите внимание: в задании используется английский алфавит (A=1, B=2, ..., Z=26). Ответ запишите латинскими буквами.`;

      const shortHint = '• Номера букв в английском алфавите: от 1 (A) до 26 (Z).\n' +
        '• Число «1» может означать букву A (1) или быть частью двузначного номера (10–19).\n' +
        '• Для каждой шифровки попробуйте составить все возможные слова из латинских букв.\n' +
        '• Ищите ту шифровку, для которой возможен строго один вариант разбиения на номера 1–26.';

      const expLines: string[] = [];
      expLines.push('ШАГ 1. СТРУКТУРА АЛФАВИТА И УСЛОВИЕ');
      expLines.push('Буквы английского алфавита пронумерованы от 1 до 26 (A=1, B=2, ..., Z=26).');
      expLines.push('Записи без пробелов допускают неоднозначность, так как цифра "1" может быть буквой A или началом двузначного числа (например, 10=J, 12=L и т.д.).');
      expLines.push('');
      expLines.push('ШАГ 2. АНАЛИЗ ПРЕДЛОЖЕННЫХ ШИФРОВОК');
      expLines.push('');

      allFour.forEach((item, idx) => {
        expLines.push(`Шифровка ${idx + 1}: ${item.cipher}`);
        if (item.decodings.length > 1) {
          expLines.push(`  Статус: НЕОДНОЗНАЧНА (всего вариантов: ${item.decodings.length}).`);
          expLines.push(`  Примеры расшифровок: "${item.decodings[0]}" и "${item.decodings[1]}".`);
        } else {
          expLines.push(`  Статус: ЕДИНСТВЕННЫЙ ВАРИАНТ!`);
          expLines.push(`  Единственная расшифровка даёт слово: "${item.decodings[0]}".`);
        }
        expLines.push('');
      });

      expLines.push('ШАГ 3. ИТОГОВЫЙ ВЫВОД');
      expLines.push(`Только шифровка "${selectedUnique.cipher}" имеет ровно один вариант расшифровки.`);
      expLines.push(`Ответ: ${targetWord}.`);

      return {
        level: difficulty,
        subType: 'find_unique_cipher',
        lang: 'latin',
        correctAnswer: targetWord,
        statementIntro,
        questionText,
        shortHint,
        explanation: expLines.join('\n'),
        ciphers: ciphersList,
        uniqueCipher: selectedUnique.cipher,
        cipherDecodingsMap,
        targetWord
      };
    }
  }
  return null;
}

const CHARACTERS = ['Алексей', 'Дмитрий', 'Сергей', 'Никита', 'Артём'];

/**
 * Generates Subtype 2: "find_repeating_letters" (Level 3)
 */
function generateSubtype2Task(difficulty: Difficulty, rng: RNG, char: string): Task2Data | null {
  const letterPool = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т'];

  for (let attempt = 0; attempt < 500; attempt++) {
    const shuffledLetters = rng.shuffle(letterPool);
    const numTableLetters = rng.int(5, 6); // 5..6 letters
    const tableLetters = shuffledLetters.slice(0, numTableLetters);
    const table = generateCodeTable(tableLetters, 'symbols', rng);
    if (!table) continue;

    // Word length 7..9 letters for genuine OGE #23 level complexity
    const wordLen = rng.int(7, 9);
    const wordLetters: string[] = [];

    // Ensure multiple repeating letters
    const rep1 = tableLetters[0];
    const rep2 = tableLetters[1];
    wordLetters.push(rep1, rep1, rep2, rep2);

    while (wordLetters.length < wordLen) {
      const randChar = rng.pick(tableLetters);
      wordLetters.push(randChar);
    }

    const shuffledWordLetters = rng.shuffle(wordLetters);
    const targetWord = shuffledWordLetters.join('');

    const counts: Record<string, number> = {};
    for (const c of targetWord) {
      counts[c] = (counts[c] || 0) + 1;
    }

    const repeatingList = Object.keys(counts).filter(c => counts[c] > 1).sort();
    const nonRepeatingList = Object.keys(counts).filter(c => counts[c] === 1).sort();

    if (repeatingList.length < 2 || nonRepeatingList.length === 0) continue;

    const encoded = targetWord.split('').map(c => {
      const entry = table.find(t => t.letter === c);
      return entry ? entry.code : '';
    }).join('');

    if (!encoded) continue;

    const rawPaths = findAllDecodings(encoded, table);
    if (rawPaths.length !== 1) continue;

    const repeatMode: RepeatMode = rng.next() < 0.5 ? 'repeating' : 'non_repeating';
    const targetSet = repeatMode === 'repeating' ? repeatingList : nonRepeatingList;
    const correctAnswer = targetSet.join('');

    const statementIntro = `Разведчик ${char} прислал зашифрованную радиограмму, записанную с помощью кодовой таблицы.`;

    const questionText = repeatMode === 'repeating'
      ? 'Расшифруйте сообщение. Определите, какие буквы в нём повторяются. В ответе запишите эти буквы без пробелов и запятых.'
      : 'Расшифруйте сообщение. Определите, какие буквы в нём НЕ повторяются. В ответе запишите эти буквы без пробелов и запятых.';

    const shortHint = '• Расшифруйте зашифрованное сообщение слева направо по кодовой таблице.\n' +
      '• Выпишите получившуюся последовательность букв.\n' +
      '• Посчитайте, сколько раз встречается каждая буква в расшифрованном слове.\n' +
      `• Запишите в ответ только ${repeatMode === 'repeating' ? 'повторяющиеся' : 'не повторяющиеся'} буквы.`;

    const breakdownSteps = targetWord.split('').map(c => {
      const entry = table.find(t => t.letter === c);
      return `${entry ? entry.code : ''} (${c})`;
    }).join(' + ');

    const expLines: string[] = [];
    expLines.push('ШАГ 1. РАСШИФРОВКА СООБЩЕНИЯ');
    expLines.push(`Зашифрованное сообщение: ${encoded}`);
    expLines.push(`Разбиение на коды по кодовой таблице: ${breakdownSteps}`);
    expLines.push(`Расшифрованное слово: ${targetWord}.`);
    expLines.push('');
    expLines.push('ШАГ 2. ПОДСЧЁТ ЧАСТОТЫ БУКВ');
    Object.keys(counts).sort().forEach(charKey => {
      expLines.push(`  Буква "${charKey}" встречается: ${counts[charKey]} раз(а).`);
    });
    expLines.push('');
    expLines.push('ШАГ 3. ИТОГОВЫЙ ВЫВОД');
    if (repeatMode === 'repeating') {
      expLines.push(`Повторяющиеся буквы (встречаются более 1 раза): ${repeatingList.join(', ')}.`);
    } else {
      expLines.push(`Не повторяющиеся буквы (встречаются ровно 1 раз): ${nonRepeatingList.join(', ')}.`);
    }
    expLines.push(`Ответ: ${correctAnswer}.`);

    return {
      level: difficulty,
      subType: 'find_repeating_letters',
      lang: 'cyrillic',
      correctAnswer,
      statementIntro,
      questionText,
      shortHint,
      explanation: expLines.join('\n'),
      alphabet: 'symbols',
      codeTable: table,
      encodedMessage: encoded,
      targetWord,
      repeatMode,
      letterCounts: counts
    };
  }
  return null;
}

/**
 * Generates Subtype 2 EN: "find_repeating_letters" with Latin symbols
 */
function generateSubtype2TaskEn(difficulty: Difficulty, rng: RNG, char: string): Task2Data | null {
  const letterPool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  for (let attempt = 0; attempt < 500; attempt++) {
    const shuffledLetters = rng.shuffle(letterPool);
    const numTableLetters = rng.int(5, 6); // 5..6 letters
    const tableLetters = shuffledLetters.slice(0, numTableLetters);
    const table = generateCodeTable(tableLetters, 'symbols', rng);
    if (!table) continue;

    const wordLen = rng.int(7, 9); // 7..9 letters
    const wordLetters: string[] = [];

    const rep1 = tableLetters[0];
    const rep2 = tableLetters[1];
    wordLetters.push(rep1, rep1, rep2, rep2);

    while (wordLetters.length < wordLen) {
      const randChar = rng.pick(tableLetters);
      wordLetters.push(randChar);
    }

    const shuffledWordLetters = rng.shuffle(wordLetters);
    const targetWord = shuffledWordLetters.join('');

    const counts: Record<string, number> = {};
    for (const c of targetWord) {
      counts[c] = (counts[c] || 0) + 1;
    }

    const repeatingList = Object.keys(counts).filter(c => counts[c] > 1).sort();
    const nonRepeatingList = Object.keys(counts).filter(c => counts[c] === 1).sort();

    if (repeatingList.length < 2 || nonRepeatingList.length === 0) continue;

    const encoded = targetWord.split('').map(c => {
      const entry = table.find(t => t.letter === c);
      return entry ? entry.code : '';
    }).join('');

    if (!encoded) continue;

    const rawPaths = findAllDecodings(encoded, table);
    if (rawPaths.length !== 1) continue;

    const repeatMode: RepeatMode = rng.next() < 0.5 ? 'repeating' : 'non_repeating';
    const targetSet = repeatMode === 'repeating' ? repeatingList : nonRepeatingList;
    const correctAnswer = targetSet.join('');

    const statementIntro = `Разведчик ${char} прислал зашифрованную радиограмму, записанную с помощью кодовой таблицы.`;

    const questionText = (repeatMode === 'repeating'
      ? 'Расшифруйте сообщение. Определите, какие буквы в нём повторяются. В ответе запишите эти буквы без пробелов и запятых.'
      : 'Расшифруйте сообщение. Определите, какие буквы в нём НЕ повторяются. В ответе запишите эти буквы без пробелов и запятых.') +
      '\n\nОбратите внимание: в задании используется английский алфавит. Ответ запишите латинскими буквами.';

    const shortHint = '• Расшифруйте зашифрованное сообщение слева направо по кодовой таблице.\n' +
      '• Выпишите получившуюся последовательность английских букв.\n' +
      '• Посчитайте, сколько раз встречается каждая буква в расшифрованном слове.\n' +
      `• Запишите в ответ только ${repeatMode === 'repeating' ? 'повторяющиеся' : 'не повторяющиеся'} английские буквы.`;

    const breakdownSteps = targetWord.split('').map(c => {
      const entry = table.find(t => t.letter === c);
      return `${entry ? entry.code : ''} (${c})`;
    }).join(' + ');

    const expLines: string[] = [];
    expLines.push('ШАГ 1. РАСШИФРОВКА СООБЩЕНИЯ');
    expLines.push(`Зашифрованное сообщение: ${encoded}`);
    expLines.push(`Разбиение на коды по кодовой таблице: ${breakdownSteps}`);
    expLines.push(`Расшифрованное слово: ${targetWord}.`);
    expLines.push('');
    expLines.push('ШАГ 2. ПОДСЧЁТ ЧАСТОТЫ БУКВ');
    Object.keys(counts).sort().forEach(charKey => {
      expLines.push(`  Буква "${charKey}" встречается: ${counts[charKey]} раз(а).`);
    });
    expLines.push('');
    expLines.push('ШАГ 3. ИТОГОВЫЙ ВЫВОД');
    if (repeatMode === 'repeating') {
      expLines.push(`Повторяющиеся буквы (встречаются более 1 раза): ${repeatingList.join(', ')}.`);
    } else {
      expLines.push(`Не повторяющиеся буквы (встречаются ровно 1 раз): ${nonRepeatingList.join(', ')}.`);
    }
    expLines.push(`Ответ: ${correctAnswer}.`);

    return {
      level: difficulty,
      subType: 'find_repeating_letters',
      lang: 'latin',
      correctAnswer,
      statementIntro,
      questionText,
      shortHint,
      explanation: expLines.join('\n'),
      alphabet: 'symbols',
      codeTable: table,
      encodedMessage: encoded,
      targetWord,
      repeatMode,
      letterCounts: counts
    };
  }
  return null;
}

/**
 * Fallback generator if retries exceed budget.
 */
function getFallbackTask(difficulty: Difficulty, char: string): Task2Data {
  const codeTable: CodeEntry[] = [
    { letter: 'А', code: '@+' },
    { letter: 'Б', code: '~#' },
    { letter: 'В', code: '@' },
    { letter: 'Г', code: '+~' },
    { letter: 'Д', code: '@+~' }
  ];
  const encodedMessage = '@+~#@+';

  const analysis: DecodedPath[] = [
    {
      steps: [
        { letter: 'А', code: '@+' },
        { letter: 'Б', code: '~#' },
        { letter: 'А', code: '@+' }
      ],
      word: 'АБА',
      validUnderConstraint: false,
      rejectReason: 'буква "А" повторяется'
    },
    {
      steps: [
        { letter: 'В', code: '@' },
        { letter: 'Г', code: '+~' },
        { letter: 'Б', code: '~#' },
        { letter: 'А', code: '@+' }
      ],
      word: 'ВГБА',
      validUnderConstraint: true
    }
  ];

  const subType: SubType = difficulty === 1 ? 'decode_word' : 'count_letters';
  const correctAnswer = subType === 'decode_word' ? 'ВГБА' : '4';

  const questionText = subType === 'decode_word'
    ? 'Расшифруйте сообщение, если известно, что буквы в нём не повторяются. В ответе запишите полученную последовательность букв.'
    : 'Сколько букв содержалось в исходном сообщении, если известно, что буквы в нём не повторяются?';

  const taskData: Task2Data = {
    level: difficulty,
    subType,
    constraintType: 'no_repeats',
    alphabet: 'symbols',
    codeTable,
    encodedMessage,
    targetWord: 'ВГБА',
    correctAnswer,
    statementIntro: `Разведчик ${char} прислал зашифрованную радиограмму, записанную с помощью кодовой таблицы.`,
    constraintText: 'Буквы в сообщении не повторяются.',
    questionText,
    shortHint: buildShortHint('symbols'),
    explanation: '',
    decodingsAnalysis: analysis
  };

  taskData.explanation = buildExplanation(taskData);
  return taskData;
}

/**
 * Generates standard single-message decode_word or count_letters task.
 */
function generateStandardTask(
  difficulty: Difficulty,
  subType: 'decode_word' | 'count_letters',
  lang: 'cyrillic' | 'latin',
  rng: RNG,
  char: string
): Task2Data | null {
  const alphabets: CodeAlphabet[] = difficulty === 1
    ? ['symbols']
    : ['symbols', 'morse'];

  const alphabet = rng.pick(alphabets);

  let wordMinLen: number;
  let wordMaxLen: number;
  let tableMinLetters: number;
  let tableMaxLetters: number;

  if (subType === 'count_letters') {
    tableMinLetters = 6;
    tableMaxLetters = 8;
    wordMinLen = 4;
    wordMaxLen = Math.max(4, tableMinLetters - 1); // слово всегда короче таблицы
  } else if (difficulty === 1) {
    tableMinLetters = 5;
    tableMaxLetters = 6;
    wordMinLen = 3;
    wordMaxLen = 5;
  } else if (difficulty === 2) {
    tableMinLetters = 5;
    tableMaxLetters = 6;
    wordMinLen = 4;
    wordMaxLen = 6;
  } else {
    // difficulty 3
    tableMinLetters = 5;
    tableMaxLetters = 6;
    wordMinLen = 5;
    wordMaxLen = 8;
  }

  const cyrPool = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П', 'Р', 'С', 'Т'];
  const latinPool = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const letterPool = lang === 'latin' ? latinPool : cyrPool;

  for (let attempt = 0; attempt < 300; attempt++) {
    const shuffledLetters = rng.shuffle(letterPool);
    const numLetters = rng.int(tableMinLetters, tableMaxLetters);
    const tableLetters = shuffledLetters.slice(0, numLetters);

    const table = generateCodeTable(tableLetters, alphabet, rng);
    if (!table) continue;

    const targetLen = rng.int(wordMinLen, subType === 'count_letters' ? numLetters - 1 : wordMaxLen);

    const candidates = rng.shuffle(tableLetters);
    if (candidates.length < targetLen) continue;
    const wordLetters = candidates.slice(0, targetLen);

    const targetWord = wordLetters.join('');

    const encoded = targetWord.split('').map(c => {
      const entry = table.find(t => t.letter === c);
      return entry ? entry.code : '';
    }).join('');

    if (!encoded) continue;

    const analysis = solveDecodings(encoded, table);
    const totalUnfiltered = analysis.length;
    const validFiltered = analysis.filter(p => p.validUnderConstraint);

    if (totalUnfiltered > 1 && validFiltered.length === 1) {
      const singleValid = validFiltered[0];

      const statementIntro = `Разведчик ${char} прислал зашифрованную радиограмму, записанную с помощью кодовой таблицы.`;

      let questionText = '';
      let correctAnswer = '';

      if (subType === 'decode_word') {
        questionText = lang === 'latin'
          ? 'Расшифруйте сообщение, если известно, что буквы в нём не повторяются. В ответе запишите полученную последовательность букв.\n\nОбратите внимание: в задании используется английский алфавит. Ответ запишите латинскими буквами.'
          : 'Расшифруйте сообщение, если известно, что буквы в нём не повторяются. В ответе запишите полученную последовательность букв.';
        correctAnswer = singleValid.word;
      } else {
        questionText = 'Сколько букв содержалось в исходном сообщении, если известно, что буквы в нём не повторяются?';
        correctAnswer = String(singleValid.word.length);
      }

      const taskData: Task2Data = {
        level: difficulty,
        subType,
        constraintType: 'no_repeats',
        alphabet,
        lang,
        codeTable: table,
        encodedMessage: encoded,
        targetWord: singleValid.word,
        correctAnswer,
        statementIntro,
        constraintText: 'Буквы в сообщении не повторяются.',
        questionText,
        shortHint: buildShortHint(alphabet),
        explanation: '',
        decodingsAnalysis: analysis
      };

      taskData.explanation = buildExplanation(taskData);
      return taskData;
    }
  }

  return null;
}

/**
 * Task2 module export according to task contract.
 */
export const task2: TaskModule = {
  id: 2,
  title: 'Декодирование сообщений',
  description: 'Расшифровка зашифрованных последовательностей по кодовой таблице с учётом уникальности букв.',
  topics: ['Кодирование информации', 'Декодирование сообщений'], // TODO: уточнить формулировки
  maxPoints: 1,

  generate: (difficulty: Difficulty, rng: RNG): Task2Data => {
    const seed = Math.floor(rng.next() * 0x100000000);
    const char = pickStable(CHARACTERS, seed, `task2:character:L${difficulty}`, (s) => s);

    if (difficulty === 3) {
      // 6 подтипов примерно поровну (~16% каждый):
      // 1. decode_word кириллица
      // 2. decode_word латиница
      // 3. find_repeating_letters кириллица
      // 4. find_repeating_letters латиница
      // 5. find_unique_cipher числовой русский (generateSubtype1Task)
      // 6. find_unique_cipher числовой английский (generateSubtype1TaskEn)
      const choice = rng.int(1, 6);
      let task: Task2Data | null = null;

      if (choice === 1) {
        task = generateStandardTask(difficulty, 'decode_word', 'cyrillic', rng, char);
      } else if (choice === 2) {
        task = generateStandardTask(difficulty, 'decode_word', 'latin', rng, char);
      } else if (choice === 3) {
        task = generateSubtype2Task(difficulty, rng, char);
      } else if (choice === 4) {
        task = generateSubtype2TaskEn(difficulty, rng, char);
      } else if (choice === 5) {
        task = generateSubtype1Task(difficulty, rng);
      } else {
        task = generateSubtype1TaskEn(difficulty, rng);
      }

      if (task) return task;

      const fallbacks = [
        () => generateStandardTask(difficulty, 'decode_word', 'cyrillic', rng, char),
        () => generateStandardTask(difficulty, 'decode_word', 'latin', rng, char),
        () => generateSubtype2Task(difficulty, rng, char),
        () => generateSubtype2TaskEn(difficulty, rng, char),
        () => generateSubtype1Task(difficulty, rng),
        () => generateSubtype1TaskEn(difficulty, rng)
      ];
      for (const fn of fallbacks) {
        const res = fn();
        if (res) return res;
      }
      return getFallbackTask(difficulty, char);
    }

    if (difficulty === 2) {
      // 4 подтипа примерно поровну (25% каждый):
      // 1. decode_word — символы или морзе, слова 4–6 букв
      // 2. count_letters — символы или морзе, с фейковой буквой в таблице
      // 3. find_repeating_letters — только кириллица
      // 4. find_unique_cipher_binary — только кириллица
      const choice = rng.int(1, 4);
      let task: Task2Data | null = null;

      if (choice === 1) {
        task = generateStandardTask(difficulty, 'decode_word', 'cyrillic', rng, char);
      } else if (choice === 2) {
        task = generateStandardTask(difficulty, 'count_letters', 'cyrillic', rng, char);
      } else if (choice === 3) {
        task = generateSubtype2Task(difficulty, rng, char);
      } else {
        task = generateSubtype1BinaryTask(difficulty, rng);
      }

      if (task) return task;

      const fallbacks = [
        () => generateStandardTask(difficulty, 'decode_word', 'cyrillic', rng, char),
        () => generateStandardTask(difficulty, 'count_letters', 'cyrillic', rng, char),
        () => generateSubtype2Task(difficulty, rng, char),
        () => generateSubtype1BinaryTask(difficulty, rng)
      ];
      for (const fn of fallbacks) {
        const res = fn();
        if (res) return res;
      }
      return getFallbackTask(difficulty, char);
    }

    // difficulty === 1 (easy): всегда decode_word, alphabet: symbols, слова 3–5 букв
    const easyTask = generateStandardTask(1, 'decode_word', 'cyrillic', rng, char);
    if (easyTask) return easyTask;

    return getFallbackTask(difficulty, char);
  },

  render: (taskData: Task2Data, state: TaskModuleState) => {
    const isCountType = taskData.subType === 'count_letters';
    const isUniqueType = taskData.subType === 'find_unique_cipher';

    return (
      <div className="space-y-4">
        <StatementBlock>
          {/* Statement Intro */}
          <StatementText>
            {taskData.statementIntro}
          </StatementText>

          {/* Code Table or Alphabet Table */}
          {taskData.codeTable ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-theme-text-muted">
                <BlockLabel className="mb-0">Кодовая таблица</BlockLabel>
                <span>Алфавит: {taskData.alphabet === 'morse' ? 'азбука Морзе' : 'значки'}</span>
              </div>
              <DataTable>
                <thead>
                  <tr>
                    <Th>Буква</Th>
                    {taskData.codeTable.map((entry, idx) => (
                      <Th key={idx} className="text-base text-blue-600 dark:text-blue-400">
                        {entry.letter}
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td className="font-sans font-medium text-theme-text-muted">Код</Td>
                    {taskData.codeTable.map((entry, idx) => (
                      <Td key={idx} className="font-mono font-bold">
                        {entry.code}
                      </Td>
                    ))}
                  </tr>
                </tbody>
              </DataTable>
            </div>
          ) : isUniqueType ? (
            <SubBlock>
              <div className="flex items-center justify-between mb-2">
                <BlockLabel className="mb-0">Алфавит с номерами букв</BlockLabel>
                <span className="text-xs font-medium text-theme-text-muted">
                  {taskData.lang === 'latin' ? '1 — A ... 26 — Z' : '1 — А ... 33 — Я'}
                </span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 text-center text-xs">
                {(taskData.lang === 'latin' ? EN_ALPHABET : RU_ALPHABET).map((char, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded-lg bg-theme-bg/60 border border-theme-border flex flex-col items-center"
                  >
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">{char}</span>
                    <span className="font-mono text-theme-text-muted">{idx + 1}</span>
                  </div>
                ))}
              </div>
            </SubBlock>
          ) : null}

          {/* Encoded Message Box */}
          {!isUniqueType && taskData.encodedMessage ? (
            <DataBlock label="Зашифрованное сообщение" size="lg">
              <span className="font-bold tracking-widest break-all">
                {taskData.encodedMessage}
              </span>
            </DataBlock>
          ) : null}

          {/* Question Statement */}
          <SubBlock>
            <StatementQuestion>
              {taskData.questionText}
            </StatementQuestion>
          </SubBlock>
        </StatementBlock>

        {/* User Answer Input */}
        <AnswerField
          label={
            isCountType
              ? 'Ваш ответ (число):'
              : taskData.subType === 'find_repeating_letters'
              ? 'Ваш ответ (буквы без пробелов):'
              : 'Ваш ответ (расшифрованное слово):'
          }
          value={state.userAnswer}
          onChange={(val) => state.setUserAnswer(val)}
          disabled={state.isSubmitted}
          mono
          placeholder={
            isCountType
              ? 'Например: 6'
              : taskData.subType === 'find_repeating_letters'
              ? taskData.lang === 'latin'
                ? 'Например: AB'
                : 'Например: АБ'
              : taskData.lang === 'latin'
              ? 'Например: LOVE'
              : 'Например: ВАЛЯ'
          }
        />

        {/* Short Hint */}
        {state.showHints && !state.isSubmitted && (
          <HintBox>
            <strong className="block font-bold text-sm mb-1.5">💡 Подсказка к решению:</strong>
            <p className="whitespace-pre-line leading-relaxed">{taskData.shortHint}</p>
          </HintBox>
        )}

        {/* Post-submission Solution Explanation (Plain Text) */}
        {state.isSubmitted && (
          <VerdictBox status={state.isCorrect ? 'correct' : 'wrong'}>
            {state.isCorrect ? (
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Верно! Ответ правильный.</span>
              </span>
            ) : (
              <div className="space-y-1.5">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span>Неверно.</span>
                </span>
                <p className="text-xs font-semibold">
                  Правильный ответ:{' '}
                  <AnswerChip>{taskData.correctAnswer}</AnswerChip>
                </p>
              </div>
            )}
          </VerdictBox>
        )}

        {state.isSubmitted && (
          <SubBlock className="space-y-2">
            <BlockLabel className="mb-0">Пошаговое объяснение решения:</BlockLabel>
            <div className="p-4 rounded-lg bg-theme-input-bg border border-theme-border font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-theme-text shadow-inner">
              {taskData.explanation}
            </div>
          </SubBlock>
        )}
      </div>
    );
  },

  check: (taskData: Task2Data, userAnswer: string): boolean => {
    if (!userAnswer || !userAnswer.trim()) return false;

    const lang = taskData.lang || 'cyrillic';

    if (taskData.subType === 'count_letters') {
      const u = parseInt(userAnswer.trim(), 10);
      const c = parseInt(taskData.correctAnswer.trim(), 10);
      return !isNaN(u) && u === c;
    }

    if (taskData.subType === 'find_repeating_letters') {
      const userSet = getNormalizedLetterSet(userAnswer, lang);
      const correctSet = getNormalizedLetterSet(taskData.correctAnswer, lang);
      return areSetsEqual(userSet, correctSet);
    }

    const normUser = normalizeWord(userAnswer, lang);
    const normCorrect = normalizeWord(taskData.correctAnswer, lang);
    return normUser === normCorrect;
  }
};

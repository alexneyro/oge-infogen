import React from 'react';
import { TaskModule, Difficulty } from '../types';
import { getFilteredWords, MALE_NAMES, FEMALE_NAMES, past, type Gender } from '../data/words';
import { getFilteredSentences } from '../data/sentences';
import { RNG } from '../utils/rng';
import { pickStable, pickManyStable } from '../utils/stablePick';
import { StatementBlock, StatementText, AnswerField, AnswerChip, VerdictBox, HintBox } from '../components/task-ui';

/**
 * Helper to dynamically render a string containing base references like "3C_16" or "177_10"
 * with HTML <sub> subscript tags for the base and "16^1" with <sup> superscript tags for exponents,
 * and replacing "*" asterisk multiplication with middle-dots "·".
 */
const renderTextWithSubscripts = (text: string): React.ReactNode => {
  if (!text) return null;

  // 1. Replace asterisk with mathematical multiplication dot (·)
  const processedText = text.replace(/\*/g, '·');

  // 2. Use combined regex to match subscripts and superscripts
  const regex = /([A-Za-z0-9]+)_([0-9x]+)|([A-Za-z0-9]+)\^([A-Za-z0-9]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(processedText)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(processedText.substring(lastIndex, matchIndex));
    }

    if (match[1] !== undefined) {
      // Subscript match: word_base
      const num = match[1];
      const base = match[2];
      parts.push(
        <span key={`${matchIndex}-${num}`} className="inline-flex items-baseline font-bold text-slate-900 dark:text-slate-100">
          <span>{num}</span>
          <sub className="ml-px text-slate-600 dark:text-slate-350 font-bold" style={{ verticalAlign: 'sub', fontSize: '70%', lineHeight: '0' }}>{base}</sub>
        </span>
      );
    } else if (match[3] !== undefined) {
      // Superscript match: base^exponent
      const baseNum = match[3];
      const exponent = match[4];
      parts.push(
        <span key={`${matchIndex}-${baseNum}`} className="inline-flex items-baseline font-bold text-slate-900 dark:text-slate-100">
          <span>{baseNum}</span>
          <sup className="mr-px text-amber-750 dark:text-amber-300 font-bold" style={{ verticalAlign: 'super', fontSize: '75%', lineHeight: '0' }}>{exponent}</sup>
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < processedText.length) {
    parts.push(processedText.substring(lastIndex));
  }

  return <>{parts}</>;
};

const plural = (n: number, forms: [string, string, string]) => {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return forms[1];
  return forms[2];
};

const encodingIntro = (rng: RNG, bits: number) => {
  if (bits === 8) {
    const name = rng.pick(['Windows-1251', 'КОИ-8']);
    return `В кодировке ${name} каждый символ кодируется 8 битами.`;
  }
  return `В одной из кодировок Unicode каждый символ кодируется ${bits} битами.`;
};

const pickPerson = (rng: RNG, seed: number) => {
  const gender: Gender = rng.int(0, 1) === 0 ? 'm' : 'f';
  const name = pickStable(gender === 'm' ? MALE_NAMES : FEMALE_NAMES, seed, `task1:name:${gender}`, (s) => s);
  return { name, gender };
};

const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Subtype: "найти вычеркнутое слово" for Level 2 (and Level 1 with forced 8 bits)
 */
const generateWordRemovalSubtype = (
  rng: RNG,
  mode: 'comma' | 'space' = 'comma',
  forcedBits?: number,
  op: 'remove' | 'add' = 'remove',
  ask: 'word' | 'count' = 'word'
) => {
  const seed = Math.floor(rng.next() * 0x100000000);
  const filtered = getFilteredWords();
  const themes = Object.keys(filtered);
  let selectedWords: string[] = [];
  let themeName = '';
  let bits = 8;
  let removedWord = '';
  let targetLengths: number[] = [];
  let attempt = 0;

  while (true) {
    attempt++;
    if (attempt > 200) {
      const sortedThemes = themes.slice().sort();
      const fallbackTheme = sortedThemes.find(t => {
        const d = filtered[t];
        const lens = Object.keys(d.words).map(Number).filter(l => d.words[l] && d.words[l].length > 0);
        return lens.length >= 5;
      });
      if (!fallbackTheme) {
        throw new Error('Недостаточно слов в банке слов для формирования задания 1 (требуется тема минимум с 5 длинами слов)');
      }
      themeName = fallbackTheme;
    } else {
      themeName = pickStable(themes, seed, `task1:theme:${attempt}`, (s) => s);
    }
    const themeData = filtered[themeName];
    const availableLengths = Object.keys(themeData.words)
      .map(Number)
      .filter(len => themeData.words[len] && themeData.words[len].length > 0)
      .sort((a, b) => a - b);
    
    if (availableLengths.length < 5) {
      continue; // try another theme
    }

    const minCount = 5;
    const maxCount = Math.min(7, availableLengths.length);
    const count = rng.int(minCount, maxCount);

    // Pick count unique lengths randomly
    const shuffledLengths = rng.shuffle(availableLengths);
    targetLengths = shuffledLengths.slice(0, count).sort((a, b) => a - b);

    // Pick one random word from each selected length
    selectedWords = targetLengths.map(len => {
      const wordsOfLen = themeData.words[len];
      return pickStable(wordsOfLen, seed, `task1:word:${themeName}:${len}`, (s) => s);
    });

    break;
  }

  // Randomly select encoding: 8, 16, 32 bits (or forcedBits if provided)
  const encodings = [8, 16, 32];
  bits = forcedBits ?? rng.pick(encodings);
  const bytesPerChar = bits / 8;

  const sep = mode === 'comma' ? ', ' : ' ';
  const extra = mode === 'comma' ? 2 : 1;
  const extraName = mode === 'comma' ? 'запятую и пробел' : 'пробел';

  // Randomly select one word to be removed
  const removedIndex = rng.int(0, selectedWords.length - 1);
  removedWord = selectedWords[removedIndex];
  const removedWordLength = removedWord.length;
  const volumeDiffBytes = (removedWordLength + extra) * bytesPerChar;

  // Shuffle selected words to show randomly in the word list (unbiased)
  const shuffledList = rng.shuffle(selectedWords);

  const totalChars = shuffledList.join(sep).length;
  const remainChars = totalChars - (removedWordLength + extra);

  const themeInfo = filtered[themeName];
  const encIntro = encodingIntro(rng, bits);
  const wordRemovalText = mode === 'comma' ? 'лишними запятой и пробелом' : 'лишним пробелом';
  const addText = mode === 'comma' ? 'вместе с запятой и пробелом' : 'вместе с пробелом';

  const isCanonical = rng.next() < 0.5;
  const questionEnding = isCanonical
    ? `при этом размер нового текста в данной кодировке оказался на ${volumeDiffBytes} ${plural(volumeDiffBytes, ['байт', 'байта', 'байт'])} меньше, чем размер исходного. Напишите в ответе вычеркнутое слово.`
    : `при этом информационный объём текста уменьшился на ${volumeDiffBytes} ${plural(volumeDiffBytes, ['байт', 'байта', 'байт'])}. Какое слово было удалено?`;

  const addEnding = isCanonical
    ? `Его размер в данной кодировке на ${volumeDiffBytes} ${plural(volumeDiffBytes, ['байт', 'байта', 'байт'])} больше исходного. Напишите в ответе дописанное слово.`
    : `Информационный объём текста увеличился на ${volumeDiffBytes} ${plural(volumeDiffBytes, ['байт', 'байта', 'байт'])}. Какое слово было дописано?`;

  let statement: string;

  if (mode === 'space') {
    const introPhrase = themeInfo.intro.replace('записаны', 'через пробел записаны');
    const wordListStr = `«${capFirst(shuffledList.join(sep))}»`;
    const mainQuestion = ask === 'count'
      ? `${encIntro} Одно из слов вычеркнули вместе с лишним пробелом, при этом информационный объём текста уменьшился на ${volumeDiffBytes} ${plural(volumeDiffBytes, ['байт', 'байта', 'байт'])}. Сколько символов осталось в тексте? В ответе укажите только число.`
      : op === 'add'
      ? `${encIntro} В исходный список дописали одно слово вместе с пробелом; получился список, приведённый выше. ${addEnding}`
      : `${encIntro} Одно из слов вычеркнули вместе с ${wordRemovalText}, ${questionEnding}`;
    statement = `${introPhrase}\n${wordListStr}\n\n${mainQuestion}`;
  } else {
    const person = pickPerson(rng, seed);
    const verb = past(rng.pick(['написал', 'записал']), person.gender);
    const listStr = capFirst(`${shuffledList.join(sep)} — ${themeInfo.tail}`);
    const mainQuestion = op === 'add'
      ? `В исходное предложение дописали ${themeInfo.questionForm} вместе с запятой и пробелом; получилось предложение, приведённое выше. ${addEnding}`
      : `${capFirst(themeInfo.questionForm)} вычеркнули вместе с ${wordRemovalText}, ${questionEnding}`;
    statement = `${encIntro}\n${person.name} ${verb} предложение:\n«${listStr}».\n\n${mainQuestion}`;
  }

  if (ask === 'count') {
  const shortHintCount = `Уменьшение объёма подсказывает, сколько символов исчезло из текста. Отдельно прикиньте, сколько символов было в списке изначально — вместе с пробелами между словами.`;

    const hintCount = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n` +
      `Шаг 1. Переведём информационный вес одного символа из бит в байты.\n` +
      `Один символ кодируется ${bits} битами. Так как 1 байт = 8 бит, один символ занимает:\n` +
      `   ${bits} / 8 = ${bytesPerChar} ${plural(bytesPerChar, ['байт', 'байта', 'байт'])}.\n\n` +
      `Шаг 2. Найдём, сколько символов было удалено.\n` +
      `Разделим уменьшение объёма на вес одного символа:\n` +
      `   ${volumeDiffBytes} / ${bytesPerChar} = ${removedWordLength + extra} ${plural(removedWordLength + extra, ['символ', 'символа', 'символов'])}.\n\n` +
      `Шаг 3. Посчитаем количество символов в исходном тексте.\n` +
      shuffledList.map(w => `   • «${w}» — ${w.length} ${plural(w.length, ['буква', 'буквы', 'букв'])}`).join('\n') + `\n` +
      `Сумма длин слов: ${shuffledList.reduce((a, w) => a + w.length, 0)}, пробелов между словами: ${shuffledList.length - 1}.\n` +
      `   Итого: ${totalChars} ${plural(totalChars, ['символ', 'символа', 'символов'])}.\n\n` +
      `Шаг 4. Вычтем удалённые символы.\n` +
      `   ${totalChars} − ${removedWordLength + extra} = ${remainChars} ${plural(remainChars, ['символ', 'символа', 'символов'])}.\n\n` +
      `Правильный ответ: ${remainChars}`;

    return {
      correctAnswer: remainChars.toString(),
      statement,
      shortHint: shortHintCount,
      hint: hintCount
    };
  }

  const shortHint = op === 'add'
    ? `Изменение объёма зависит только от того, сколько символов добавилось. Помните, что вместе со словом в список приходит и разделитель.`
    : `Изменение объёма зависит только от того, сколько символов исчезло. Помните, что вместе со словом из списка пропадает и разделитель.`;

  let hint = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n` +
    `Шаг 1. Переведём информационный вес одного символа из бит в байты.\n` +
    `Один символ кодируется ${bits} битами. Так как 1 байт = 8 бит, один символ занимает:\n` +
    `   ${bits} / 8 = ${bytesPerChar} ${plural(bytesPerChar, ['байт', 'байта', 'байт'])}.\n\n` +
    `Шаг 2. Вычислим длину ${op === 'add' ? 'дописанного' : 'удалённого'} слова.\n` +
    `Разделим ${op === 'add' ? 'увеличение' : 'уменьшение'} информационного объёма в байтах на вес одного символа в байтах, чтобы найти общее количество ${op === 'add' ? 'дописанных' : 'удалённых'} символов:\n` +
    `   ${volumeDiffBytes} / ${bytesPerChar} = ${removedWordLength + extra} ${plural(removedWordLength + extra, ['символ', 'символа', 'символов'])}.\n` +
    `Так как слово ${op === 'add' ? 'дописали' : 'удалили'} ${op === 'add' ? addText : `вместе с ${wordRemovalText}`} (${extra} ${extra === 1 ? 'символ' : 'символа'}), длина самого слова равна:\n` +
    `   ${removedWordLength + extra} − ${extra} = ${removedWordLength} ${plural(removedWordLength, ['буква', 'буквы', 'букв'])}.\n\n` +
    `Шаг 3. Найдём в списке слово, состоящее из ${removedWordLength} букв.\n` +
    `Давайте определим длину каждого слова в списке:\n` +
    shuffledList.map(w => `   • «${w}» — ${w.length} ${plural(w.length, ['буква', 'буквы', 'букв'])}`).join('\n') + `\n\n` +
    `Следовательно, ${op === 'add' ? 'дописано' : 'удалено'} слово «${removedWord}» (содержит ${removedWordLength} ${plural(removedWordLength, ['буква', 'буквы', 'букв'])}).\n\n` +
    `Проверка объёма:\n` +
    `   (${removedWordLength} + ${extra}) · ${bytesPerChar} = ${volumeDiffBytes} ${plural(volumeDiffBytes, ['байт', 'байта', 'байт'])}.\n\n` +
    `Правильный ответ: ${removedWord}`;

  return {
    correctAnswer: removedWord,
    statement,
    shortHint,
    hint
  };
};

/**
 * Subtype: "размер предложения"
 */
const generateSentenceSizeSubtype = (rng: RNG) => {
  const seed = Math.floor(rng.next() * 0x100000000);
  const phrase = pickStable(getFilteredSentences(), seed, 'task1:sentence', (s) => s);
  const L = phrase.length;
  const bits = rng.pick([8, 16, 32]);
  // при 8 битах ответ в байтах вырождается в простой подсчёт символов
  const unit: 'битах' | 'байтах' =
    bits === 8 ? 'битах' : (rng.next() < 0.5 ? 'битах' : 'байтах');
  const answer = unit === 'битах' ? L * bits : (L * bits) / 8;

  const intro = encodingIntro(rng, bits);
  const isCanonical = rng.next() < 0.5;
  const statement = isCanonical
    ? `${intro}\nОпределите размер следующего предложения в данной кодировке:\n\n${phrase}\n\nОтвет укажите в ${unit}, только число.`
    : `${intro}\nОпределите размер следующего предложения в данной кодировке:\n«${phrase}»\nКавычки в подсчёт не входят. Ответ укажите в ${unit}, только число.`;

  const shortHint = unit === 'битах'
    ? `В подсчёт входят все символы подряд: буквы, пробелы и знаки препинания. Остаётся связать их число с весом одного символа.`
    : `В подсчёт входят все символы подряд: буквы, пробелы и знаки препинания. Учтите, что вес символа задан в битах, а ответ нужен в байтах.`;

  const bytesPerChar = bits / 8;
  let hint = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n` +
    `Шаг 1. Посчитаем количество символов в предложении.\n` +
    `Всего символов в предложении — ${L}, включая пробелы и знаки препинания.\n\n`;

  if (unit === 'битах') {
    hint += `Шаг 2. Вычислим информационный объём предложения в битах.\n` +
      `Так как один символ кодируется ${bits} битами, умножим число символов на вес одного символа:\n` +
      `   ${L} · ${bits} = ${answer} ${plural(answer, ['бит', 'бита', 'бит'])}.\n\n` +
      `Правильный ответ: ${answer}`;
  } else {
    hint += `Шаг 2. Переведём информационный вес одного символа из бит в байты.\n` +
      `Поскольку 1 байт = 8 бит, а каждый символ кодируется ${bits} битами, один символ занимает:\n` +
      `   ${bits} / 8 = ${bytesPerChar} ${plural(bytesPerChar, ['байт', 'байта', 'байт'])}.\n\n` +
      `Шаг 3. Вычислим информационный объём предложения в байтах.\n` +
      `Умножим количество символов в предложении на вес одного символа в байтах:\n` +
      `   ${L} · ${bytesPerChar} = ${answer} ${plural(answer, ['байт', 'байта', 'байт'])}.\n\n` +
      `Правильный ответ: ${answer}`;
  }

  return {
    correctAnswer: answer.toString(),
    statement,
    shortHint,
    hint
  };
};

/**
 * Level 1: "размер предложения" (50%) или "вычеркнутое слово" (8 бит, 50%)
 */
const generateLevel1 = (rng: RNG) => {
  if (rng.next() < 0.5) {
    return generateSentenceSizeSubtype(rng);
  }
  return generateWordRemovalSubtype(rng, rng.int(1, 4) === 1 ? 'space' : 'comma', 8);
};

/**
 * Level 2: "вычеркнутое слово"
 */
const generateLevel2 = (rng: RNG) => {
  const op = rng.next() < 0.5 ? 'remove' : 'add';
  return generateWordRemovalSubtype(rng, rng.int(1, 4) === 1 ? 'space' : 'comma', undefined, op);
};

const generateRecodeSubtype = (rng: RNG) => {
  // пары кодировок: разница веса символа 2 или 3 байта
  // (пара 8<->16 исключена: там Δ численно равно числу символов)
  const pairs = [
    { from: 8,  to: 32, d: 3 },
    { from: 32, to: 8,  d: 3 },
    { from: 16, to: 32, d: 2 },
    { from: 32, to: 16, d: 2 },
  ];
  const p = rng.pick(pairs);
  const grew = p.to > p.from;

  const useKB = rng.int(1, 3) === 1;
  let chars: number;
  if (useKB) {
    // Δ должно делиться на 1024
    const base = p.d === 2 ? 512 : 1024;
    chars = base * rng.int(1, 6);
  } else {
    chars = rng.int(10, 400) * 10;
  }

  const diffBytes = chars * p.d;
  const diffKB = diffBytes / 1024;
  const shown = useKB ? diffKB : diffBytes;
  const unitWord = useKB ? 'Кбайт' : plural(diffBytes, ['байт', 'байта', 'байт']);

  const koi = rng.int(0, 1) === 0;

  const nameOfPrep = (b: number, koi: boolean) =>
    b === 8 ? (koi ? 'однобайтовой кодировке КОИ-8' : 'однобайтовой кодировке Windows-1251')
    : b === 16 ? '16-битной кодировке Unicode'
    : '32-битной кодировке Unicode';

  const nameOfAcc = (b: number, koi: boolean) =>
    b === 8 ? (koi ? 'однобайтовую кодировку КОИ-8' : 'однобайтовую кодировку Windows-1251')
    : b === 16 ? '16-битную кодировку Unicode'
    : '32-битную кодировку Unicode';

  const verb = grew ? 'увеличился' : 'уменьшился';

  const statement =
    `Текст, записанный в ${nameOfPrep(p.from, koi)}, перекодировали в ${nameOfAcc(p.to, koi)}. ` +
    `При этом информационный объём текста ${verb} на ${shown} ${unitWord}. ` +
    `Сколько символов содержит текст? В ответе укажите только число.`;

  const shortHint =
    `Каждый символ после перекодировки стал весить иначе, и объём текста изменился именно из-за этой разницы. Число символов при перекодировке не меняется.`;

  let hint = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n` +
    `Шаг 1. Найдём вес одного символа в каждой кодировке.\n` +
    `Было: ${p.from} / 8 = ${p.from / 8} ${plural(p.from / 8, ['байт', 'байта', 'байт'])} на символ.\n` +
    `Стало: ${p.to} / 8 = ${p.to / 8} ${plural(p.to / 8, ['байт', 'байта', 'байт'])} на символ.\n\n` +
    `Шаг 2. Найдём изменение объёма на один символ.\n` +
    `|${p.to / 8} − ${p.from / 8}| = ${p.d} ${plural(p.d, ['байт', 'байта', 'байт'])}.\n\n`;

  if (useKB) {
    hint += `Шаг 3. Переведём изменение объёма из Кбайт в байты.\n` +
      `${diffKB} · 1024 = ${diffBytes} ${plural(diffBytes, ['байт', 'байта', 'байт'])}.\n\n` +
      `Шаг 4. Найдём количество символов.\n` +
      `   ${diffBytes} / ${p.d} = ${chars}.\n\n`;
  } else {
    hint += `Шаг 3. Найдём количество символов.\n` +
      `   ${diffBytes} / ${p.d} = ${chars}.\n\n`;
  }

  hint += `Правильный ответ: ${chars}`;

  return { correctAnswer: chars.toString(), statement, shortHint, hint };
};

/**
 * Subtype: "вычеркнули два слова"
 */
const generateTwoWordRemovalSubtype = (rng: RNG, forcedBits?: number) => {
  const seed = Math.floor(rng.next() * 0x100000000);
  const filtered = getFilteredWords();
  const themes = Object.keys(filtered);

  const pairSumsUnique = (lens: number[]) => {
    const sums = new Set<number>();
    for (let i = 0; i < lens.length; i++) {
      for (let j = i + 1; j < lens.length; j++) {
        const s = lens[i] + lens[j];
        if (sums.has(s)) return false;
        sums.add(s);
      }
    }
    return true;
  };

  let selectedWords: string[] = [];
  let themeName = '';
  let guard = 0;

  while (guard++ < 200) {
    themeName = pickStable(themes, seed, `task1:theme:${guard}`, (s) => s);
    const themeData = filtered[themeName];
    const availableLengths = Object.keys(themeData.words)
      .map(Number)
      .filter(len => themeData.words[len] && themeData.words[len].length > 0)
      .sort((a, b) => a - b);

    if (availableLengths.length < 5) continue;

    const count = rng.int(5, Math.min(6, availableLengths.length));
    const lens = rng.shuffle(availableLengths).slice(0, count).sort((a, b) => a - b);
    if (!pairSumsUnique(lens)) continue;

    selectedWords = lens.map(len => pickStable(themeData.words[len], seed, `task1:word:${themeName}:${len}`, (s) => s));
    break;
  }

  if (selectedWords.length === 0) {
    return generateWordRemovalSubtype(rng, 'space', forcedBits, 'remove', 'word');
  }

  const themeInfo = filtered[themeName];
  const bits = forcedBits ?? rng.pick([8, 16, 32]);
  const bytesPerChar = bits / 8;

  const shuffledList = rng.shuffle(selectedWords);
  const picked = rng.shuffle(selectedWords.slice()).slice(0, 2);
  const lenSum = picked[0].length + picked[1].length;

  const mode: 'comma' | 'space' = rng.int(1, 4) === 1 ? 'space' : 'comma';
  const extra = mode === 'comma' ? 4 : 2;
  const extraName = mode === 'comma' ? 'две запятые и два пробела' : 'два лишних пробела';
  const removedWith = mode === 'comma'
    ? 'вместе с лишними запятыми и пробелами'
    : 'вместе с лишними пробелами';
  const volumeDiffBytes = (lenSum + extra) * bytesPerChar;

  const variantA = (picked[0] + picked[1]).toLowerCase();
  const variantB = (picked[1] + picked[0]).toLowerCase();

  const encIntro = encodingIntro(rng, bits);
  const answerRule = `Напишите в ответе оба вычеркнутых слова подряд, без пробела. Порядок слов может быть любым.`;
  const questionTail = `Два слова вычеркнули ${removedWith}, при этом информационный объём текста ` +
    `уменьшился на ${volumeDiffBytes} ${plural(volumeDiffBytes, ['байт', 'байта', 'байт'])}. ${answerRule}`;

  let statement: string;
  let displayList: string[];

  if (mode === 'comma') {
    const person = pickPerson(rng, seed);
    const verb = past(rng.pick(['написал', 'записал']), person.gender);
    displayList = shuffledList.map((w, i) => (i === 0 ? capFirst(w) : w));
    const listStr = `${displayList.join(', ')} — ${themeInfo.tail}`;
    statement = `${encIntro}\n${person.name} ${verb} предложение:\n«${listStr}».\n\n${questionTail}`;
  } else {
    const introPhrase = themeInfo.intro.replace('записаны', 'через пробел записаны');
    displayList = shuffledList.map((w, i) => (i === 0 ? capFirst(w) : w));
    statement = `${introPhrase}\n«${displayList.join(' ')}»\n\n${encIntro} ${questionTail}`;
  }

  const shortHint = `Изменение объёма говорит, сколько всего символов исчезло. Вместе с каждым из двух слов пропадает и его разделитель, а буквы обоих слов складываются в общую сумму.`;

  const hint = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n` +
    `Шаг 1. Переведём информационный вес одного символа из бит в байты.\n` +
    `Один символ кодируется ${bits} битами. Так как 1 байт = 8 бит, один символ занимает:\n` +
    `   ${bits} / 8 = ${bytesPerChar} ${plural(bytesPerChar, ['байт', 'байта', 'байт'])}.\n\n` +
    `Шаг 2. Найдём, сколько всего символов было удалено.\n` +
    `Разделим уменьшение объёма на вес одного символа:\n` +
    `   ${volumeDiffBytes} / ${bytesPerChar} = ${lenSum + extra} ${plural(lenSum + extra, ['символ', 'символа', 'символов'])}.\n\n` +
    `Шаг 3. Вычтем лишние разделители (${extraName}).\n` +
    `   ${lenSum + extra} − ${extra} = ${lenSum} ${plural(lenSum, ['буква', 'буквы', 'букв'])} — столько букв в двух словах вместе.\n\n` +
    `Шаг 4. Определим длину каждого слова в списке:\n` +
    displayList.map(w => `   • «${w}» — ${w.length} ${plural(w.length, ['буква', 'буквы', 'букв'])}`).join('\n') + `\n\n` +
    `Шаг 5. Подберём пару слов с суммой длин ${lenSum}.\n` +
    `Подходит единственная пара: «${picked[0]}» и «${picked[1]}» (${picked[0].length} + ${picked[1].length} = ${lenSum}).\n\n` +
    `Правильный ответ: ${variantA} (или ${variantB})`;

  return {
    correctAnswer: variantA,
    altAnswers: [variantB],
    statement,
    shortHint,
    hint
  };
};

/**
 * Level 3: "объём текста по страницам"
 */
const generateLevel3 = (rng: RNG) => {
  const roll = rng.int(1, 4);
  if (roll === 1) {
    return generateRecodeSubtype(rng);
  }
  if (roll === 2) {
    return generateWordRemovalSubtype(rng, 'space', undefined, 'remove', 'count');
  }
  if (roll === 3) {
    return generateTwoWordRemovalSubtype(rng);
  }
  const isReverse = rng.next() < 0.5;

  let P = 0, R = 0, C = 0;
  let bits: 8 | 16 = 8;
  let unit: 'байтах' | 'Кбайтах' = 'байтах';
  let totalBytes = 0;
  let targetKB = 0;

  // Decide 50/50
  unit = rng.next() < 0.5 ? 'байтах' : 'Кбайтах';
  bits = rng.next() < 0.5 ? 8 : 16;
  const bytesPerChar = bits / 8;

  const hiddenParam = isReverse ? rng.pick(['P', 'R', 'C']) : null;

  let validSetup = false;
  while (!validSetup) {
    if (unit === 'байтах') {
      P = rng.int(5, 20);     // 5..20
      R = rng.int(20, 50);   // 20..50
      C = rng.int(40, 80);   // 40..80
      const totalChars = P * R * C;
      totalBytes = totalChars * bytesPerChar;
      validSetup = true;
    } else {
      // "Кбайтах" - build from targetKB
      let found = false;
      while (!found) {
        targetKB = rng.int(5, 50); // 5..50
        const totalChars = (targetKB * 1024) / bytesPerChar; // (targetKB * 1024 * 8) / bits
        
        const pValues = Array.from({ length: 20 - 5 + 1 }, (_, i) => i + 5);
        const rValues = Array.from({ length: 50 - 20 + 1 }, (_, i) => i + 20);

        // Randomly shuffle arrays
        const shuffledP = rng.shuffle(pValues);
        const shuffledR = rng.shuffle(rValues);

        for (const pVal of shuffledP) {
          for (const rVal of shuffledR) {
            const pr = pVal * rVal;
            if (totalChars % pr === 0) {
              const cVal = totalChars / pr;
              if (cVal >= 40 && cVal <= 80) {
                const ans = hiddenParam === 'P' ? pVal : hiddenParam === 'R' ? rVal : cVal;
                if (isReverse && ans === targetKB) {
                  // degenerate case: answer matches targetKB
                  continue;
                }
                P = pVal;
                R = rVal;
                C = cVal;
                totalBytes = totalChars * bytesPerChar;
                found = true;
                validSetup = true;
                break;
              }
            }
          }
          if (found) break;
        }
      }
    }
  }

  const totalChars = P * R * C;

  if (!isReverse) {
    // Direct subtype
    const answer = unit === 'байтах' ? totalBytes : targetKB;

    const encIntro = encodingIntro(rng, bits);
    const statement = `${encIntro}\nТекст содержит ${P} ${plural(P, ['страница', 'страницы', 'страниц'])}, на каждой ${R} ${plural(R, ['строка', 'строки', 'строк'])}, в каждой строке ${C} ${plural(C, ['символ', 'символа', 'символов'])}. Определите объём текста в ${unit}. В ответе укажите только число.`;

    const shortHint = `Объём текста определяется числом символов и весом одного символа. А число символов складывается из страниц, строк и длины строки.`;

    let hint = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n` +
      `Шаг 1. Вычислим общее количество символов в данном тексте.\n` +
      `Для этого перемножим число страниц, количество строк на странице и количество символов в одной строке:\n` +
      `   ${P} · ${R} · ${C} = ${totalChars} ${plural(totalChars, ['символ', 'символа', 'символов'])}.\n\n` +
      `Шаг 2. Вычислим размер всего текста в байтах.\n` +
      `Один символ кодируется ${bits} битами, что равно:\n` +
      `   ${bits} / 8 = ${bits / 8} ${plural(bits / 8, ['байт', 'байта', 'байт'])}.\n` +
      `Умножим общее число символов на вес одного символа:\n` +
      `   ${totalChars} · ${bits / 8} = ${totalBytes} ${plural(totalBytes, ['байт', 'байта', 'байт'])}.\n\n`;

    if (unit === 'Кбайтах') {
      hint += `Шаг 3. Переведём информационный объём из байт в Кбайты.\n` +
        `Так как 1 Кбайт = 1024 байта, разделим полученное значение в байтах на 1024:\n` +
        `   ${totalBytes} / 1024 = ${answer} Кбайт.\n\n`;
    }

    hint += `Правильный ответ: ${answer}`;

    return {
      correctAnswer: answer.toString(),
      statement,
      shortHint,
      hint
    };
  } else {
    // Reverse subtype
    let statement = '';
    let answer = 0;
    let knownPart = '';

    const encIntro = encodingIntro(rng, bits);
    const volumeText = unit === 'байтах' ? `${totalBytes} ${plural(totalBytes, ['байт', 'байта', 'байт'])}` : `${targetKB} Кбайт`;

    if (hiddenParam === 'P') {
      statement = `${encIntro}\nОбъём текста равен ${volumeText}. На каждой странице ${R} ${plural(R, ['строка', 'строки', 'строк'])}, в каждой строке ${C} ${plural(C, ['символ', 'символа', 'символов'])}. Сколько страниц в тексте? В ответе укажите только число.`;
      answer = P;
      knownPart = `известны: количество строк на странице (${R}) и число символов в строке (${C}).\n` +
                  `Суммарное количество символов на одной странице составляет:\n` +
                  `   ${R} · ${C} = ${R * C} ${plural(R * C, ['символ', 'символа', 'символов'])}.\n` +
                  `Разделим общее количество символов в тексте на число символов на одной странице, чтобы найти количество страниц:\n` +
                  `   ${totalChars} / ${R * C} = ${P}.`;
    } else if (hiddenParam === 'R') {
      statement = `${encIntro}\nОбъём текста равен ${volumeText}. В тексте всего ${P} ${plural(P, ['страница', 'страницы', 'страниц'])}, в каждой строке ${C} ${plural(C, ['символ', 'символа', 'символов'])}. Сколько строк на каждой странице? В ответе укажите только число.`;
      answer = R;
      knownPart = `известны: общее число страниц (${P}) и число символов в строке (${C}).\n` +
                  `Суммарное количество символов во всём тексте в пересчёте на одну строку каждой страницы составляет:\n` +
                  `   ${P} · ${C} = ${P * C} ${plural(P * C, ['символ', 'символа', 'символов'])}.\n` +
                  `Разделим общее количество символов на произведение известных параметров, чтобы получить количество строк на странице:\n` +
                  `   ${totalChars} / (${P} · ${C}) = ${R}.`;
    } else {
      statement = `${encIntro}\nОбъём текста равен ${volumeText}. В тексте всего ${P} ${plural(P, ['страница', 'страницы', 'страниц'])}, на каждой странице ${R} ${plural(R, ['строка', 'строки', 'строк'])}. Сколько символов в каждой строке? В ответе укажите только число.`;
      answer = C;
      knownPart = `известны: число страниц (${P}) и число строк на странице (${R}).\n` +
                  `Вычислим общее количество строк во всём тексте:\n` +
                  `   ${P} · ${R} = ${P * R} ${plural(P * R, ['строка', 'строки', 'строк'])}.\n` +
                  `Разделим общее количество символов на полное число строк, чтобы узнать ширину строки в символах:\n` +
                  `   ${totalChars} / (${P} · ${R}) = ${C}.`;
    }

    const shortHint = `Вес одного символа связывает объём в байтах с числом символов. Известные параметры покажут, какая часть произведения уже задана, а какая ищется.`;

    let stepNum = 1;
    let hint = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n`;

    if (unit === 'Кбайтах') {
      hint += `Шаг 1. Переведём информационный объём текста из Кбайт в байты.\n` +
        `Так как 1 Кбайт = 1024 байта, умножим объём в Кбайтах на 1024:\n` +
        `   ${targetKB} · 1024 = ${totalBytes} ${plural(totalBytes, ['байт', 'байта', 'байт'])}.\n\n`;
      stepNum = 2;
    }

    hint += `Шаг ${stepNum}. Вычислим общее количество символов в тексте.\n` +
      `Один символ кодируется ${bits} битами. Так как 1 байт = 8 бит, один символ занимает ${bits} / 8 = ${bytesPerChar} ${plural(bytesPerChar, ['байт', 'байта', 'байт'])}.\n` +
      `Разделим общий объём в байтах на информационный вес одного символа, чтобы найти общее число символов в тексте:\n` +
      `   ${totalBytes} / ${bytesPerChar} = ${totalChars} ${plural(totalChars, ['символ', 'символа', 'символов'])}.\n\n`;

    hint += `Шаг ${stepNum + 1}. Найдём неизвестный параметр.\n` +
      `Нам ${knownPart}\n\n`;

    hint += `Правильный ответ: ${answer}`;

    return {
      correctAnswer: answer.toString(),
      statement,
      shortHint,
      hint
    };
  }
};

export const task1: TaskModule = {
  id: 1,
  title: 'Количественные параметры информационных объектов',
  description: 'Определение информационного объема текста в различных кодировках.',
  topics: ['Кодирование текста', 'Информационный объём'], // TODO: уточнить формулировки
  maxPoints: 1,

  generate: (difficulty: Difficulty, rng: RNG) => {
    if (difficulty === 1) {
      return generateLevel1(rng);
    } else if (difficulty === 2) {
      return generateLevel2(rng);
    } else {
      return generateLevel3(rng);
    }
  },

  render: (taskData, state) => {
    return (
      <div className="space-y-4">
        {/* Task statement with highly readable and contrasty styling */}
        <StatementBlock>
          <StatementText>
            {renderTextWithSubscripts(taskData.statement)}
          </StatementText>
        </StatementBlock>

        {/* Input field */}
        <AnswerField
          label="Ваш ответ:"
          value={state.userAnswer}
          onChange={(val) => state.setUserAnswer(val)}
          disabled={state.isSubmitted}
          placeholder={/^\d+$/.test(taskData.correctAnswer) ? "Введите число…" : "Введите слово…"}
        />

        {/* Verification Result Feedback Overlay */}
        {state.isSubmitted && (
          <VerdictBox status={state.isCorrect ? 'correct' : 'wrong'}>
            {state.isCorrect ? (
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Верно! Ответ правильный.</span>
              </span>
            ) : (
              <div className="space-y-1">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span>Неверно.</span>
                </span>
                <p className="text-[11px] font-medium opacity-95">
                   Правильный ответ: <AnswerChip>{taskData.correctAnswer}</AnswerChip>
                </p>
              </div>
            )}
          </VerdictBox>
        )}

        {/* Clue Hint (shortHint) before submission */}
        {state.showHints && !state.isSubmitted && (
          <HintBox>
            <strong className="block font-extrabold text-sm mb-1.5">💡 Подсказка-наводка:</strong>
            {renderTextWithSubscripts(taskData.shortHint)}
          </HintBox>
        )}

        {/* Full explanation of the solution shown AFTER check */}
        {state.isSubmitted && (
          <div className="p-5 bg-theme-solution-bg border border-theme-solution-border text-sm text-theme-solution-text rounded-xl leading-relaxed whitespace-pre-line shadow-sm font-semibold">
            <strong className="block text-slate-900 dark:text-white font-extrabold text-base mb-2">📖 Подробное решение (полный разбор):</strong>
            <div className="space-y-1">
              {renderTextWithSubscripts(taskData.hint)}
            </div>
          </div>
        )}
      </div>
    );
  },

  check: (taskData, userAnswer) => {
    const normalize = (str: string) => {
      const u = str.trim().toUpperCase().replace(/Ё/g, 'Е');
      const map: Record<string, string> = {
        'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H',
        'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T',
        'Х': 'X', 'У': 'Y'
      };
      return u.split('').map(char => map[char] || char).join('');
    };
    const accepted = [taskData.correctAnswer, ...(taskData.altAnswers ?? [])];
    return accepted.some((ans: string) => normalize(userAnswer) === normalize(ans));
  }
};

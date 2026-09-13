import { TASK13_TEXTS, TASK13_TABLES } from '../src/data/task13data';
import { WORKS, Work, Character } from '../src/data/texts11';
import { RAW_SENTENCES } from '../src/data/sentences';
import {
  LAST_NAMES_MALE,
  LAST_NAMES_FEMALE,
  FIRST_NAMES_MALE,
  FIRST_NAMES_FEMALE,
  DISTRICTS,
  SCHOOL_SUBJECTS,
  PRODUCT_CATEGORIES,
  PRODUCTS,
  SHOPS,
  DEPARTMENTS,
  CITIES,
  COUNTRIES,
  SPORTS,
  CAR_BRANDS,
  WEATHER_MONTHS,
  WIND_DIRECTIONS,
  TASK14_THEMES,
} from '../src/data/task14themes';
import {
  FILE_NAMES,
  EXTENSIONS,
  SITES,
  ZONES,
  PROTOCOLS,
  DIRS,
  DIRS_DATED,
  MAIL_DOMAINS,
  MAIL_LOGINS,
  INTRO_TEMPLATES_URL,
  INTRO_TEMPLATES_MAIL,
  MOVE_TEMPLATES,
} from '../src/data/urls';
import { rawWords, MALE_NAMES, FEMALE_NAMES } from '../src/data/words';
import fs from 'fs';
import path from 'path';

interface Defect {
  datasetId: string;
  location: string;
  message: string;
  code?: string;
}

// Whitelist коротких значений (< 3 символов)
// Банки данных и поля, в которых допустимы значения короче 3 символов:
// - WIND_DIRECTIONS: одно- и двухбуквенные стороны света («С», «Ю», «СВ» и т.д.)
// - ZONES: короткие доменные зоны («ru», «su», «io» и т.д.)
// - EXTENSIONS: расширения файлов («7z», «gz», «py», «js» и т.д.)
// - CAR_BRANDS: короткие названия автомобильных марок («ИЖ», «GMC», «RAM» и т.д.)
// - FIRST_NAMES_MALE: короткие мужские имена («Ян» и т.д.)
// - FIRST_NAMES_FEMALE: короткие женские имена («Ия» и т.д.)
// - TASK13_TABLES_UNIT: единицы измерения в таблицах задания 13 («м», «кг», «%», «‰», «°C»)
const SHORT_ITEM_WHITELIST = new Set<string>([
  'WIND_DIRECTIONS',
  'ZONES',
  'EXTENSIONS',
  'CAR_BRANDS',
  'FIRST_NAMES_MALE',
  'FIRST_NAMES_FEMALE',
  'TASK13_TABLES_UNIT',
]);

// Минимальные размеры банков, от которых зависят циклы выбора в task14
const MIN_BANK_SIZES: Record<string, number> = {
  DISTRICTS: 4,
  SHOPS: 5,
  PRODUCT_CATEGORIES: 5,
  DEPARTMENTS: 4,
  CITIES: 4,
  COUNTRIES: 4,
  CAR_BRANDS: 4,
  WEATHER_MONTHS: 4,
};

interface BankStats {
  name: string;
  elements: number;
  errors: number;
  warnings: number;
}
const bankStatsList: BankStats[] = [];

const FORBIDDEN_E_WORDS = [
  { wrong: /(?:^|[^а-яёА-ЯЁ])лед(?:$|[^а-яёА-ЯЁ])|подледн/i, right: 'лёд' },
  { wrong: /(?:^|[^а-яёА-ЯЁ])тверд/i, right: 'твёрд' },
  { wrong: /(?:^|[^а-яёА-ЯЁ])желоб/i, right: 'жёлоб' },
  { wrong: /(?:^|[^а-яёА-ЯЁ])соленос/i, right: 'солёнос' }
];

const defects: Defect[] = [];

function checkStringBank(
  bankName: string,
  items: string[],
  options?: {
    allowShort?: boolean;
    isSentenceBank?: boolean;
  }
): number {
  let errors = 0;
  const seen = new Set<string>();

  items.forEach((item, idx) => {
    const loc = `[${idx}]`;

    // 1. EMPTY_ITEM
    if (item.length === 0) {
      defects.push({
        datasetId: bankName,
        location: loc,
        message: '[EMPTY_ITEM] Пустая строка в банке',
        code: 'EMPTY_ITEM',
      });
      errors++;
      return;
    }

    // 2. TRIM
    if (item !== item.trim()) {
      defects.push({
        datasetId: bankName,
        location: loc,
        message: `[TRIM] Ведущие или концевые пробелы: "${item}"`,
        code: 'TRIM',
      });
      errors++;
    }

    // 3. DOUBLE_SPACE
    if (/\s{2,}/.test(item)) {
      defects.push({
        datasetId: bankName,
        location: loc,
        message: `[DOUBLE_SPACE] Двойной пробел: "${item}"`,
        code: 'DOUBLE_SPACE',
      });
      errors++;
    }

    // 4. DUP_ITEM
    if (seen.has(item)) {
      defects.push({
        datasetId: bankName,
        location: loc,
        message: `[DUP_ITEM] Точный дубль элемента внутри банка: "${item}"`,
        code: 'DUP_ITEM',
      });
      errors++;
    }
    seen.add(item);

    // 5. SHORT_ITEM (< 3 символов)
    const baseBankName = bankName.split(/[:.]/)[0];
    const isWhitelistedShort =
      options?.allowShort ||
      SHORT_ITEM_WHITELIST.has(bankName) ||
      SHORT_ITEM_WHITELIST.has(baseBankName);

    if (item.length < 3 && !isWhitelistedShort) {
      defects.push({
        datasetId: bankName,
        location: loc,
        message: `[SHORT_ITEM] Элемент короче 3 символов: "${item}"`,
        code: 'SHORT_ITEM',
      });
      errors++;
    }

    // 6. LATIN_HOMOGLYPH
    // Латинские омоглифы в русских словах (a c e o p x y k H B M T и др. внутри слова с кириллицей)
    const tokens = item.split(/[\s,.:;!?\-\/\\()"'`{}<>]+/);
    const hasMixedToken = tokens.some(tok => /[а-яёА-ЯЁ]/.test(tok) && /[a-zA-Z]/.test(tok));
    const isSingleWordBank =
      bankName.startsWith('rawWords') ||
      bankName.includes('NAMES') ||
      bankName === 'CITIES' ||
      bankName === 'COUNTRIES';
    const hasMixedLettersInItem = isSingleWordBank && /[а-яёА-ЯЁ]/.test(item) && /[a-zA-Z]/.test(item);

    if (hasMixedToken || hasMixedLettersInItem) {
      defects.push({
        datasetId: bankName,
        location: loc,
        message: `[LATIN_HOMOGLYPH] Латинские символы/омоглифы в русском слове: "${item}"`,
        code: 'LATIN_HOMOGLYPH',
      });
      errors++;
    }
  });

  bankStatsList.push({
    name: bankName,
    elements: items.length,
    errors,
    warnings: 0,
  });

  return errors;
}

function checkText(datasetId: string, location: string, text: string | undefined | null) {
  if (text === undefined || text === null) {
    defects.push({ datasetId, location, message: 'Отсутствует значение' });
    return;
  }
  if (typeof text !== 'string') return;

  if (text.trim().length === 0) {
    defects.push({ datasetId, location, message: 'Пустая строка / подпись' });
  }
  if (/\s{2,}/.test(text)) {
    defects.push({ datasetId, location, message: `Двойной пробел: "${text}"` });
  }
  FORBIDDEN_E_WORDS.forEach(({ wrong, right }) => {
    if (wrong.test(text) && !text.toLowerCase().includes(right)) {
      defects.push({ datasetId, location, message: `«е» вместо «ё» (ожидалось «${right}»): "${text}"` });
    }
  });
}

// 1. Проверка уникальности ID текстов
const textIds = new Set<string>();
TASK13_TEXTS.forEach(t => {
  if (textIds.has(t.id)) {
    defects.push({ datasetId: t.id, location: 'id', message: `Дублирующийся ID текста: ${t.id}` });
  }
  textIds.add(t.id);
  if (t.hasHeading && t.heading) checkText(t.id, 'heading', t.heading);
  checkText(t.id, 'body', t.body);
});

// 2. Проверка уникальности ID таблиц и структуры
const tableIds = new Set<string>();
TASK13_TABLES.forEach(tbl => {
  if (tableIds.has(tbl.id)) {
    defects.push({ datasetId: tbl.id, location: 'id', message: `Дублирующийся ID таблицы: ${tbl.id}` });
  }
  tableIds.add(tbl.id);

  if (tbl.objectColumnLabel) {
    checkText(tbl.id, 'objectColumnLabel', tbl.objectColumnLabel);
  }

  const rowIds = new Set<string>();
  tbl.rows.forEach(r => {
    if (rowIds.has(r.id)) {
      defects.push({ datasetId: tbl.id, location: `row[${r.id}]`, message: `Дублирующийся ID строки: ${r.id}` });
    }
    rowIds.add(r.id);
    checkText(tbl.id, `row[${r.id}] label`, r.label);
  });

  const colIds = new Set<string>();
  tbl.columns.forEach(c => {
    if (colIds.has(c.id)) {
      defects.push({ datasetId: tbl.id, location: `col[${c.id}]`, message: `Дублирующийся ID столбца: ${c.id}` });
    }
    colIds.add(c.id);
    checkText(tbl.id, `col[${c.id}] label`, c.label);
    if (c.unit) checkText(tbl.id, `col[${c.id}] unit`, c.unit);

    // Проверка заполнения значений по строкам
    tbl.rows.forEach(r => {
      const val = c.values[r.id];
      if (val === undefined || val === null) {
        defects.push({ datasetId: tbl.id, location: `col[${c.id}].values[${r.id}]`, message: 'Отсутствует значение для строки' });
      } else if (typeof val === 'string') {
        checkText(tbl.id, `col[${c.id}].values[${r.id}]`, val);
      } else if (typeof val === 'object') {
        if (val.min > val.max) {
          defects.push({ datasetId: tbl.id, location: `col[${c.id}].values[${r.id}]`, message: `min (${val.min}) > max (${val.max})` });
        }
        if (val.step <= 0) {
          defects.push({ datasetId: tbl.id, location: `col[${c.id}].values[${r.id}]`, message: `step (${val.step}) <= 0` });
        }
      }
    });
  });

  // Проверка titleRow
  if (tbl.titleRow !== undefined && tbl.titleRow !== null) {
    if (typeof tbl.titleRow !== 'string' || tbl.titleRow.trim().length === 0) {
      defects.push({
        datasetId: tbl.id,
        location: 'titleRow',
        message: 'Пустая строка titleRow',
        code: 'EMPTY_ITEM'
      });
    } else {
      checkText(tbl.id, 'titleRow', tbl.titleRow);

      if (tbl.level === 1) {
        defects.push({
          datasetId: tbl.id,
          location: 'titleRow',
          message: `titleRow допустим только на уровнях 2 и 3 (задан на L1): "${tbl.titleRow}"`,
          code: 'TITLE_ON_L1'
        });
      }

      if (tbl.titleRow.length > 60) {
        defects.push({
          datasetId: tbl.id,
          location: 'titleRow',
          message: `Длина titleRow превышает 60 символов (${tbl.titleRow.length}): "${tbl.titleRow}"`,
          code: 'TITLE_TOO_LONG'
        });
      }

      if (tbl.titleRow.trim().endsWith('.')) {
        defects.push({
          datasetId: tbl.id,
          location: 'titleRow',
          message: `titleRow не должен заканчиваться точкой: "${tbl.titleRow}"`,
          code: 'TITLE_TRAILING_DOT'
        });
      }
    }
  }

  // Проверка headerGroups
  tbl.headerGroups?.forEach(hg => {
    checkText(tbl.id, `headerGroup[${hg.label}]`, hg.label);
    if (hg.columnIds.length === 0) {
      defects.push({ datasetId: tbl.id, location: `headerGroup[${hg.label}]`, message: 'Пустой список columnIds' });
    }
    hg.columnIds.forEach(cid => {
      if (!colIds.has(cid)) {
        defects.push({ datasetId: tbl.id, location: `headerGroup[${hg.label}]`, message: `Неизвестный columnId: ${cid}` });
      }
    });
  });

  if (tbl.totalsRow) {
    checkText(tbl.id, 'totalsRow', tbl.totalsRow.label);
  }
});

// 3. Проверка тегов
[1, 2, 3].forEach(lvl => {
  const levelTexts = TASK13_TEXTS.filter(t => t.level === lvl);
  const levelTables = TASK13_TABLES.filter(t => t.level === lvl);
  if (levelTexts.length === 0) {
    defects.push({ datasetId: `level-${lvl}`, location: 'texts', message: `Нет текстов для уровня ${lvl}` });
  }
  if (levelTables.length === 0) {
    defects.push({ datasetId: `level-${lvl}`, location: 'tables', message: `Нет таблиц для уровня ${lvl}` });
  }
  const matchingPairs = levelTexts.flatMap(t =>
    levelTables.filter(tbl => t.tags.some(tag => tbl.tags.includes(tag)))
  );
  if (matchingPairs.length === 0) {
    defects.push({ datasetId: `level-${lvl}`, location: 'tags', message: `Нет совпадающих пар текстов и таблиц по тегам для уровня ${lvl}` });
  }
});

// ==========================================
// 4. Проверка данных Задания 11 (texts11)
// ==========================================

function normalizeForComparison(s: string): string {
  return s.toLowerCase();
}

type Task11IssueCode =
  | 'NOT_FOUND'
  | 'AMBIGUOUS'
  | 'MULTI_LOCAL'
  | 'WRONG_WORK'
  | 'EMPTY'
  | 'DUP_ACTION'
  | 'DUPLICATE'
  | 'NO_ANCHOR'
  | 'COPYPASTE'
  | 'BAD_REF'
  | 'CIRCULAR';

interface Task11Issue {
  workId: string;
  clueType: 'phrase' | 'hook' | 'relation' | 'action' | 'anchor' | 'situation';
  text: string;
  code: Task11IssueCode;
  detail?: string;
  ownCount?: number;
  lines?: number[];
  isWarning?: boolean;
}

const task11Errors: Task11Issue[] = [];
const task11TableItems: Task11Issue[] = [];
const task11Warnings: string[] = [];

// A. Уникальность work.id
const workIds = new Set<string>();
WORKS.forEach(w => {
  if (workIds.has(w.id)) {
    const err: Task11Issue = {
      workId: w.id,
      clueType: 'relation',
      text: w.id,
      code: 'AMBIGUOUS',
      detail: `Дублирующийся work.id: ${w.id}`
    };
    task11Errors.push(err);
    task11TableItems.push(err);
    defects.push({ datasetId: `task11:${w.id}`, location: 'work.id', message: `Дублирующийся work.id: ${w.id}` });
  }
  workIds.add(w.id);
});

// B. Существование файлов по work.path и чтение
const normalizedWorkTexts: Record<string, string> = {};
const workRawTexts: Record<string, string> = {};
const workLines: Record<string, string[]> = {};

WORKS.forEach(w => {
  const fullPath = path.join(process.cwd(), 'public', 'texts', w.path);
  if (!fs.existsSync(fullPath)) {
    const err: Task11Issue = {
      workId: w.id,
      clueType: 'relation',
      text: w.path,
      code: 'NOT_FOUND',
      detail: `Файл не найден по пути: ${w.path}`
    };
    task11Errors.push(err);
    task11TableItems.push(err);
    defects.push({ datasetId: `task11:${w.id}`, location: 'work.path', message: `Файл не найден: public/texts/${w.path}` });
  } else {
    const raw = fs.readFileSync(fullPath, 'utf8');
    if (!raw || !raw.trim()) {
      const err: Task11Issue = {
        workId: w.id,
        clueType: 'relation',
        text: w.path,
        code: 'EMPTY',
        detail: `Файл пуст: ${w.path}`
      };
      task11Errors.push(err);
      task11TableItems.push(err);
      defects.push({ datasetId: `task11:${w.id}`, location: 'work.path', message: `Файл пуст: public/texts/${w.path}` });
    } else {
      normalizedWorkTexts[w.id] = normalizeForComparison(raw);
      workRawTexts[w.id] = raw;
      workLines[w.id] = raw.split(/\r?\n/);
    }
  }
});

// C & E. Проверка подсказок phrase, hook, relation
const countsByType = {
  phrase: 0,
  hook: 0,
  relation: 0,
  action: 0,
  anchor: 0,
  situation: 0
};

const errorsByCode: Record<Task11IssueCode, number> = {
  NOT_FOUND: 0,
  AMBIGUOUS: 0,
  MULTI_LOCAL: 0,
  WRONG_WORK: 0,
  EMPTY: 0,
  DUP_ACTION: 0,
  DUPLICATE: 0,
  NO_ANCHOR: 0,
  COPYPASTE: 0,
  BAD_REF: 0,
  CIRCULAR: 0
};

function recordTask11Error(err: Task11Issue) {
  err.isWarning = false;
  task11Errors.push(err);
  task11TableItems.push(err);
  errorsByCode[err.code] = (errorsByCode[err.code] || 0) + 1;
  defects.push({
    datasetId: `task11:${err.workId}`,
    location: `${err.clueType} [${err.code}]`,
    message: err.detail ? `${err.text.slice(0, 60)} (${err.detail})` : `${err.text.slice(0, 60)}`
  });
}

function formatLineNumbers(lineOccurrences: number[]): string {
  const countsByLine = new Map<number, number>();
  lineOccurrences.forEach(l => {
    countsByLine.set(l, (countsByLine.get(l) || 0) + 1);
  });

  const entries: string[] = [];
  countsByLine.forEach((count, line) => {
    if (count > 1) {
      entries.push(`строка ${line} (×${count})`);
    } else {
      entries.push(`строка ${line}`);
    }
  });

  return entries.join(', ');
}

let multiLocalWarningsCount = 0;
let suppressedMultiLocalCount = 0;

function recordTask11Warning(warn: Task11Issue) {
  warn.isWarning = true;
  task11TableItems.push(warn);
  if (warn.code === 'MULTI_LOCAL') {
    multiLocalWarningsCount++;
  }
  const linesStr = warn.lines && warn.lines.length > 0 ? ` (${formatLineNumbers(warn.lines)})` : '';
  task11Warnings.push(`[${warn.workId}] [${warn.clueType}] MULTI_LOCAL: "${warn.text}" — вхождений в своём файле: ${warn.ownCount}${linesStr}`);
}

function findOccurrencesAndLines(
  workId: string,
  query: string
): { ownCount: number; lines: number[] } {
  const fullText = normalizedWorkTexts[workId] || '';
  const lines = workLines[workId] || [];
  if (!query) {
    return { ownCount: 0, lines: [] };
  }

  let ownCount = 0;
  let pos = 0;
  while ((pos = fullText.indexOf(query, pos)) !== -1) {
    ownCount++;
    pos += query.length;
  }

  const lineNumbers: number[] = [];
  lines.forEach((line, idx) => {
    const lineLower = line.toLowerCase();
    let lPos = 0;
    while ((lPos = lineLower.indexOf(query, lPos)) !== -1) {
      lineNumbers.push(idx + 1);
      lPos += query.length;
    }
  });

  return { ownCount, lines: lineNumbers };
}

function isSelfAnswering(query: string | undefined | null, character: Character | undefined): boolean {
  if (!character || !query) return false;
  const q = query.toLowerCase().trim();
  const parts = [character.name, character.surname, character.patronymic]
    .filter((p): p is string => !!p && !!p.trim())
    .map(p => p.toLowerCase().trim());
  return parts.some(p => p === q || p.includes(q) || q.includes(p));
}

function getAnsweringCharacterForRelation(w: Work, targetName: string): Character | undefined {
  const tLower = targetName.toLowerCase().trim();
  return w.characters.find(c => {
    const parts = [c.name, c.surname, c.patronymic]
      .filter((p): p is string => !!p && !!p.trim())
      .map(p => p.toLowerCase().trim());
    return parts.some(p => p === tLower || tLower.includes(p) || p.includes(tLower));
  });
}

interface SubstringOnlyClue {
  workId: string;
  clueType: string;
  clue: string;
  containerWords: string[];
  lines: number[];
}

const substringOnlyClues: SubstringOnlyClue[] = [];

function checkAndRecordSubstringOnly(workId: string, clueType: string, rawClue: string | undefined | null) {
  if (!rawClue || !rawClue.trim()) return;
  const q = rawClue.toLowerCase().trim();
  const lines = workLines[workId] || [];
  let total = 0;
  let partOfLonger = 0;
  const containers = new Set<string>();
  const lineOccurrences: number[] = [];

  const isLetter = (ch: string) => /\p{L}/u.test(ch);

  lines.forEach((line, idx) => {
    const lLower = line.toLowerCase();
    let pos = 0;
    while ((pos = lLower.indexOf(q, pos)) !== -1) {
      total++;
      const before = pos > 0 ? line[pos - 1] : '';
      const after = pos + q.length < line.length ? line[pos + q.length] : '';
      const isEmbedded = isLetter(before) || isLetter(after);
      if (isEmbedded) {
        partOfLonger++;
        let s = pos;
        while (s > 0 && isLetter(line[s - 1])) s--;
        let e = pos + q.length;
        while (e < line.length && isLetter(line[e])) e++;
        containers.add(line.slice(s, e));
      }
      lineOccurrences.push(idx + 1);
      pos += q.length;
    }
  });

  if (total > 0 && total === partOfLonger) {
    substringOnlyClues.push({
      workId,
      clueType,
      clue: rawClue,
      containerWords: Array.from(containers),
      lines: lineOccurrences
    });
  }
}

function checkLiteralClue(
  workId: string,
  clueType: 'phrase' | 'hook' | 'relation',
  rawText: string | undefined | null,
  seenInWork: Set<string>,
  answeringChar?: Character
) {
  countsByType[clueType]++;
  if (!rawText || !rawText.trim()) {
    recordTask11Error({ workId, clueType, text: '', code: 'EMPTY' });
    return;
  }
  const normQuery = normalizeForComparison(rawText);
  if (!normQuery) {
    recordTask11Error({ workId, clueType, text: rawText, code: 'EMPTY' });
    return;
  }

  checkAndRecordSubstringOnly(workId, clueType, rawText);

  // Проверка дублирования внутри одного произведения
  const clueKey = `${clueType}:${normQuery}`;
  if (seenInWork.has(clueKey)) {
    recordTask11Error({
      workId,
      clueType,
      text: rawText,
      code: 'DUPLICATE',
      detail: `Подсказка типа ${clueType} продублирована внутри одного произведения`
    });
  } else {
    seenInWork.add(clueKey);
  }

  const { ownCount, lines } = findOccurrencesAndLines(workId, normQuery);
  const otherWorks: string[] = [];
  for (const [id, fullText] of Object.entries(normalizedWorkTexts)) {
    if (id !== workId && fullText.includes(normQuery)) {
      otherWorks.push(id);
    }
  }

  if (otherWorks.length >= 1) {
    recordTask11Error({
      workId,
      clueType,
      text: rawText,
      code: 'AMBIGUOUS',
      ownCount,
      lines,
      detail: `Найдено в других работах (${otherWorks.length}): ${otherWorks.join(', ')}`
    });
  } else if (ownCount === 0) {
    recordTask11Error({
      workId,
      clueType,
      text: rawText,
      code: 'NOT_FOUND',
      ownCount: 0,
      lines: [],
      detail: `Не найдено в файле произведения ${workId}`
    });
  } else if (ownCount >= 2) {
    if (isSelfAnswering(rawText, answeringChar)) {
      suppressedMultiLocalCount++;
    } else {
      recordTask11Warning({
        workId,
        clueType,
        text: rawText,
        code: 'MULTI_LOCAL',
        ownCount,
        lines,
        detail: `Вхождений: ${ownCount}, ${formatLineNumbers(lines)}`
      });
    }
  }
}

// D. Проверка action на непустоту и уникальность
const seenActions = new Map<string, { workId: string; charId: string }>();

WORKS.forEach(w => {
  if (w.isStub) return;
  const seenInWork = new Set<string>();

  // E. Проверка наличия хотя бы одной подсказки каждого типа (warning)
  if (w.phrases.length === 0) {
    task11Warnings.push(`[${w.id}] Нет ни одной подсказки типа phrase`);
  }
  if (w.hooks.length === 0) {
    task11Warnings.push(`[${w.id}] Нет ни одной подсказки типа hook`);
  }
  if (w.relations.length === 0) {
    task11Warnings.push(`[${w.id}] Нет ни одной подсказки типа relation`);
  }

  // Phrases
  w.phrases.forEach(p => {
    checkLiteralClue(w.id, 'phrase', p.quote, seenInWork);
    if (p.aboutId !== undefined) {
      const aboutChar = w.characters.find(c => c.id === p.aboutId);
      if (!aboutChar) {
        recordTask11Error({
          workId: w.id,
          clueType: 'phrase',
          text: p.aboutId,
          code: 'BAD_REF',
          detail: `aboutId "${p.aboutId}" не найден среди characters произведения ${w.id}`
        });
      }
    }
  });

  // Situations
  (w.situations || []).forEach(s => {
    countsByType.situation++;
    if (!s.text || !s.text.trim()) {
      recordTask11Error({ workId: w.id, clueType: 'situation', text: '', code: 'EMPTY', detail: 'Пустой text в Situation' });
      return;
    }
    if (!s.anchor || !s.anchor.trim()) {
      recordTask11Error({ workId: w.id, clueType: 'situation', text: s.text, code: 'EMPTY', detail: 'Пустой anchor в Situation' });
      return;
    }

    if (!s.text.toLowerCase().includes(s.anchor.toLowerCase())) {
      recordTask11Error({
        workId: w.id,
        clueType: 'situation',
        text: s.anchor,
        code: 'NO_ANCHOR',
        detail: `anchor "${s.anchor}" отсутствует внутри text "${s.text}"`
      });
    }

    const normText = normalizeForComparison(s.text);
    for (const [fId, fullText] of Object.entries(normalizedWorkTexts)) {
      if (fullText.includes(normText)) {
        recordTask11Error({
          workId: w.id,
          clueType: 'situation',
          text: s.text,
          code: 'COPYPASTE',
          detail: `Текст ситуации целиком скопирован из файла ${fId}`
        });
      }
    }

    checkAndRecordSubstringOnly(w.id, 'situation', s.anchor);

    const normAnchor = normalizeForComparison(s.anchor);
    const { ownCount, lines } = findOccurrencesAndLines(w.id, normAnchor);
    const otherWorks: string[] = [];
    for (const [id, fullText] of Object.entries(normalizedWorkTexts)) {
      if (id !== w.id && fullText.includes(normAnchor)) {
        otherWorks.push(id);
      }
    }

    const answeringChar = w.characters.find(c => c.id === s.answerId);

    if (otherWorks.length >= 1) {
      recordTask11Error({
        workId: w.id,
        clueType: 'situation',
        text: s.anchor,
        code: 'AMBIGUOUS',
        ownCount,
        lines,
        detail: `Найдено в других работах (${otherWorks.length}): ${otherWorks.join(', ')}`
      });
    } else if (ownCount === 0) {
      recordTask11Error({
        workId: w.id,
        clueType: 'situation',
        text: s.anchor,
        code: 'NOT_FOUND',
        ownCount: 0,
        lines: [],
        detail: `Не найдено в файле произведения ${w.id}`
      });
    } else if (ownCount >= 2) {
      if (isSelfAnswering(s.anchor, answeringChar)) {
        suppressedMultiLocalCount++;
      } else {
        recordTask11Warning({
          workId: w.id,
          clueType: 'situation',
          text: s.anchor,
          code: 'MULTI_LOCAL',
          ownCount,
          lines,
          detail: `Вхождений: ${ownCount}, ${formatLineNumbers(lines)}`
        });
      }
    }

    const char = w.characters.find(c => c.id === s.answerId);
    if (!char) {
      recordTask11Error({
        workId: w.id,
        clueType: 'situation',
        text: s.answerId,
        code: 'BAD_REF',
        detail: `answerId "${s.answerId}" не найден среди characters произведения ${w.id}`
      });
    } else {
      const ansNames = [char.name, char.surname].filter((n): n is string => !!n);
      for (const n of ansNames) {
        if (normAnchor.includes(n.toLowerCase())) {
          recordTask11Error({
            workId: w.id,
            clueType: 'situation',
            text: s.anchor,
            code: 'CIRCULAR',
            detail: `anchor "${s.anchor}" содержит имя или фамилию персонажа "${n}"`
          });
        }
      }
    }
  });

  // Hooks
  w.hooks.forEach(h => {
    const ansChar = w.characters.find(c => c.id === h.leadsTo);
    checkLiteralClue(w.id, 'hook', h.word, seenInWork, ansChar);
  });

  // Relations
  w.relations.forEach(r => {
    const ansChar = getAnsweringCharacterForRelation(w, r.targetName);
    checkLiteralClue(w.id, 'relation', r.targetName, seenInWork, ansChar);
  });

  // Characters actions
  w.characters.forEach(c => {
    if (c.action !== undefined) {
      countsByType.action++;
      const actionText = c.action;
      if (!actionText || !actionText.trim()) {
        recordTask11Error({ workId: w.id, clueType: 'action', text: '', code: 'EMPTY' });
      } else {
        const trimmed = actionText.trim();
        if (seenActions.has(trimmed)) {
          const prev = seenActions.get(trimmed)!;
          recordTask11Error({
            workId: w.id,
            clueType: 'action',
            text: trimmed,
            code: 'DUP_ACTION',
            detail: `Дубликат с ${prev.workId}:${prev.charId}`
          });
        } else {
          seenActions.set(trimmed, { workId: w.id, charId: c.id });
        }
      }
    }

    // Role and action CIRCULAR check
    if (c.acts !== false && (c.role || c.action)) {
      const names = [c.name, c.surname].filter((n): n is string => !!n);
      const combined = `${c.role || ''} ${c.action || ''}`.toLowerCase();
      for (const n of names) {
        if (n.length >= 3 && combined.includes(n.toLowerCase())) {
          recordTask11Error({
            workId: w.id,
            clueType: 'action',
            text: `${c.role || ''} ${c.action || ''}`,
            code: 'CIRCULAR',
            detail: `Роль или действие персонажа ${c.id} содержит его имя/фамилию "${n}"`
          });
        }
      }
    }

    // Anchor check for active characters with non-empty action
    if (c.acts !== false && c.action && c.action.trim()) {
      countsByType.anchor++;
      if (!c.anchor || !c.anchor.trim()) {
        recordTask11Error({
          workId: w.id,
          clueType: 'anchor',
          text: `[${c.id}] (нет anchor)`,
          code: 'EMPTY',
          detail: `Отсутствует anchor для действующего персонажа ${c.id}`
        });
      } else {
        checkAndRecordSubstringOnly(w.id, 'anchor', c.anchor);

        const normAnchor = normalizeForComparison(c.anchor);
        const { ownCount, lines } = findOccurrencesAndLines(w.id, normAnchor);
        const otherWorks: string[] = [];
        for (const [id, fullText] of Object.entries(normalizedWorkTexts)) {
          if (id !== w.id && fullText.includes(normAnchor)) {
            otherWorks.push(id);
          }
        }

        if (otherWorks.length >= 1) {
          recordTask11Error({
            workId: w.id,
            clueType: 'anchor',
            text: c.anchor,
            code: 'AMBIGUOUS',
            ownCount,
            lines,
            detail: `Найдено в других работах (${otherWorks.length}): ${otherWorks.join(', ')}`
          });
        } else if (ownCount === 0) {
          recordTask11Error({
            workId: w.id,
            clueType: 'anchor',
            text: c.anchor,
            code: 'NOT_FOUND',
            ownCount: 0,
            lines: [],
            detail: `Не найдено в файле произведения ${w.id}`
          });
        } else if (ownCount >= 2) {
          if (isSelfAnswering(c.anchor, c)) {
            suppressedMultiLocalCount++;
          } else {
            recordTask11Warning({
              workId: w.id,
              clueType: 'anchor',
              text: c.anchor,
              code: 'MULTI_LOCAL',
              ownCount,
              lines,
              detail: `Вхождений: ${ownCount}, ${formatLineNumbers(lines)}`
            });
          }
        }
      }
    }
  });
});

// Вывод отчёта по заданию 11
console.log('\n======================================================');
console.log('            ВАЛИДАЦИЯ ДАННЫХ ЗАДАНИЯ 11');
console.log('======================================================\n');

if (task11TableItems.length > 0) {
  console.log('ТАБЛИЦА ОШИБОК И ПРЕДУПРЕЖДЕНИЙ ЗАДАНИЯ 11:');
  console.log('work.id | тип подсказки | текст подсказки (до 60 симв.) | код проблемы | вхождений в своём файле');
  console.log('---|---|---|---|---');
  task11TableItems.forEach(e => {
    const textSnippet = (e.text.length > 60 ? e.text.slice(0, 57) + '...' : e.text).replace(/\n/g, ' ');
    let occStr = '-';
    if (e.ownCount !== undefined) {
      if (e.code === 'MULTI_LOCAL' && e.lines && e.lines.length > 0) {
        occStr = `${e.ownCount} (${formatLineNumbers(e.lines)})`;
      } else {
        occStr = `${e.ownCount}`;
      }
    }
    console.log(`${e.workId} | ${e.clueType} | "${textSnippet}" | ${e.code} | ${occStr}`);
  });
  console.log('');
}

if (substringOnlyClues.length > 0) {
  console.log('ПОДСКАЗКИ, ВСТРЕЧАЮЩИЕСЯ ТОЛЬКО КАК ЧАСТЬ БОЛЕЕ ДЛИННОГО СЛОВА:');
  console.log('work.id | тип | строка подсказки | найденное слово-контейнер | номера строк');
  console.log('---|---|---|---|---');
  substringOnlyClues.forEach(s => {
    console.log(`${s.workId} | ${s.clueType} | "${s.clue}" | ${s.containerWords.join(', ')} | ${formatLineNumbers(s.lines)}`);
  });
  console.log('');
}

console.log('СВОДКА ЗАДАНИЯ 11:');
console.log(`  - Проверено подсказок по типам:`);
console.log(`      * phrase:    ${countsByType.phrase}`);
console.log(`      * hook:      ${countsByType.hook}`);
console.log(`      * relation:  ${countsByType.relation}`);
console.log(`      * action:    ${countsByType.action}`);
console.log(`      * anchor:    ${countsByType.anchor}`);
console.log(`      * situation: ${countsByType.situation}`);
console.log(`      * ВСЕГО:     ${countsByType.phrase + countsByType.hook + countsByType.relation + countsByType.action + countsByType.anchor + countsByType.situation}`);
console.log(`  - Число ошибок по кодам:`);
console.log(`      * NOT_FOUND:  ${errorsByCode.NOT_FOUND}`);
console.log(`      * AMBIGUOUS:  ${errorsByCode.AMBIGUOUS}`);
console.log(`      * WRONG_WORK: ${errorsByCode.WRONG_WORK}`);
console.log(`      * EMPTY:      ${errorsByCode.EMPTY}`);
console.log(`      * DUP_ACTION: ${errorsByCode.DUP_ACTION}`);
console.log(`      * DUPLICATE:  ${errorsByCode.DUPLICATE}`);
console.log(`      * NO_ANCHOR:  ${errorsByCode.NO_ANCHOR}`);
console.log(`      * COPYPASTE:  ${errorsByCode.COPYPASTE}`);
console.log(`      * BAD_REF:    ${errorsByCode.BAD_REF}`);
console.log(`      * CIRCULAR:   ${errorsByCode.CIRCULAR}`);
console.log(`      * ВСЕГО:      ${task11Errors.length}`);
console.log(`  - Число предупреждений: ${task11Warnings.length}`);
console.log(`      * MULTI_LOCAL (активных):  ${multiLocalWarningsCount}`);
console.log(`      * MULTI_LOCAL (подавлено): ${suppressedMultiLocalCount} (самоотвечающие)`);
task11Warnings.forEach(w => console.log(`      [ПРЕДУПРЕЖДЕНИЕ] ${w}`));
console.log('======================================================\n');

// ==========================================
// 5. Проверка банков Задания 14 (task14themes.ts)
// ==========================================

const t14BanksMap: Record<string, string[]> = {
  DISTRICTS,
  SHOPS,
  PRODUCT_CATEGORIES,
  DEPARTMENTS,
  CITIES,
  COUNTRIES,
  CAR_BRANDS,
  WEATHER_MONTHS,
};

// Проверка минимальных размеров банков task14
Object.entries(MIN_BANK_SIZES).forEach(([bankName, minSize]) => {
  const arr = t14BanksMap[bankName];
  if (arr && arr.length < minSize) {
    defects.push({
      datasetId: bankName,
      location: 'size',
      message: `[BANK_TOO_SMALL] Размер банка ${bankName} (${arr.length}) меньше допустимого минимума (${minSize})`,
      code: 'BANK_TOO_SMALL',
    });
  }
});

checkStringBank('LAST_NAMES_MALE', LAST_NAMES_MALE);
checkStringBank('LAST_NAMES_FEMALE', LAST_NAMES_FEMALE);
checkStringBank('FIRST_NAMES_MALE', FIRST_NAMES_MALE);
checkStringBank('FIRST_NAMES_FEMALE', FIRST_NAMES_FEMALE);
checkStringBank('DISTRICTS', DISTRICTS);
checkStringBank('SCHOOL_SUBJECTS', SCHOOL_SUBJECTS);
checkStringBank('PRODUCT_CATEGORIES', PRODUCT_CATEGORIES);
checkStringBank('PRODUCTS', PRODUCTS);
checkStringBank('SHOPS', SHOPS);
checkStringBank('DEPARTMENTS', DEPARTMENTS);
checkStringBank('CITIES', CITIES);
checkStringBank('COUNTRIES', COUNTRIES);
checkStringBank('SPORTS', SPORTS);
checkStringBank('CAR_BRANDS', CAR_BRANDS);
checkStringBank('WEATHER_MONTHS', WEATHER_MONTHS);
checkStringBank('WIND_DIRECTIONS', WIND_DIRECTIONS);

// Проверка структуры TASK14_THEMES
let t14ThemeErrors = 0;
TASK14_THEMES.forEach((theme, idx) => {
  const loc = `[${idx}] (${theme.id})`;
  const requiredFields = [
    { field: 'id', val: theme.id },
    { field: 'title', val: theme.title },
    { field: 'entitySingular', val: theme.entitySingular },
    { field: 'entityGenitivePlural', val: theme.entityGenitivePlural },
    { field: 'entityName', val: theme.entityName },
    { field: 'mainCategoryName', val: theme.mainCategoryName },
  ];
  requiredFields.forEach(({ field, val }) => {
    if (!val || val.length === 0) {
      defects.push({
        datasetId: 'TASK14_THEMES',
        location: `${loc}.${field}`,
        message: `[EMPTY_ITEM] Пустое поле ${field} в описании темы`,
        code: 'EMPTY_ITEM',
      });
      t14ThemeErrors++;
    }
  });

  const allFields = [
    theme.id,
    theme.title,
    theme.entitySingular,
    theme.entityGenitivePlural,
    theme.entityName,
    theme.mainCategoryName,
    theme.numberUnit,
  ];
  allFields.forEach(val => {
    if (val && val !== val.trim()) {
      defects.push({
        datasetId: 'TASK14_THEMES',
        location: loc,
        message: `[TRIM] Ведущие или концевые пробелы в теме: "${val}"`,
        code: 'TRIM',
      });
      t14ThemeErrors++;
    }
    if (val && /\s{2,}/.test(val)) {
      defects.push({
        datasetId: 'TASK14_THEMES',
        location: loc,
        message: `[DOUBLE_SPACE] Двойной пробел в теме: "${val}"`,
        code: 'DOUBLE_SPACE',
      });
      t14ThemeErrors++;
    }
  });
});
bankStatsList.push({
  name: 'TASK14_THEMES',
  elements: TASK14_THEMES.length,
  errors: t14ThemeErrors,
  warnings: 0,
});

// ==========================================
// 6. Проверка банков URL (urls.ts)
// ==========================================

checkStringBank('SITES', SITES);
checkStringBank('ZONES', ZONES);
checkStringBank('PROTOCOLS', PROTOCOLS);
checkStringBank('DIRS', DIRS);
checkStringBank('DIRS_DATED', DIRS_DATED);
checkStringBank('MAIL_DOMAINS', MAIL_DOMAINS);
checkStringBank('MAIL_LOGINS', MAIL_LOGINS);
checkStringBank('INTRO_TEMPLATES_URL', INTRO_TEMPLATES_URL, { isSentenceBank: true });
checkStringBank('INTRO_TEMPLATES_MAIL', INTRO_TEMPLATES_MAIL, { isSentenceBank: true });
checkStringBank('MOVE_TEMPLATES', MOVE_TEMPLATES, { isSentenceBank: true });

// FILE_NAMES по категориям
let fileNamesTotalElements = 0;
let fileNamesTotalErrors = 0;
Object.entries(FILE_NAMES).forEach(([cat, list]) => {
  fileNamesTotalElements += list.length;
  fileNamesTotalErrors += checkStringBank(`FILE_NAMES:${cat}`, list);
});
bankStatsList.push({
  name: 'FILE_NAMES (все категории)',
  elements: fileNamesTotalElements,
  errors: fileNamesTotalErrors,
  warnings: 0,
});

// EXTENSIONS по категориям
let extensionsTotalElements = 0;
let extensionsTotalErrors = 0;
Object.entries(EXTENSIONS).forEach(([cat, list]) => {
  extensionsTotalElements += list.length;
  extensionsTotalErrors += checkStringBank(`EXTENSIONS:${cat}`, list, { allowShort: true });
});
bankStatsList.push({
  name: 'EXTENSIONS (все категории)',
  elements: extensionsTotalElements,
  errors: extensionsTotalErrors,
  warnings: 0,
});

// ==========================================
// 7. Проверка предложений (sentences.ts)
// ==========================================

checkStringBank('RAW_SENTENCES', RAW_SENTENCES, { isSentenceBank: true });

// ==========================================
// 8. Проверка банков слов (words.ts)
// ==========================================

checkStringBank('MALE_NAMES', MALE_NAMES);
checkStringBank('FEMALE_NAMES', FEMALE_NAMES);

// Whitelist коротких слов (< 3 символов) для rawWords:
// "яд" — игровой термин из банка Бравл Старс
const RAW_WORDS_SHORT_ITEM_WHITELIST = new Set<string>([
  'яд',
]);

// rawWords по темам и группам длин
let rawWordsTotalElements = 0;
let rawWordsTotalErrors = 0;

Object.entries(rawWords).forEach(([themeName, themeData]) => {
  let themeElements = 0;
  let themeErrors = 0;
  const themeSeen = new Set<string>();

  Object.entries(themeData.words).forEach(([lenStr, wList]) => {
    themeElements += wList.length;

    (wList as string[]).forEach((word: string, idx: number) => {
      const loc = `${themeName}:${lenStr}[${idx}]`;

      // 1. EMPTY_ITEM
      if (word.length === 0) {
        defects.push({
          datasetId: `rawWords:${themeName}`,
          location: loc,
          message: '[EMPTY_ITEM] Пустая строка в банке',
          code: 'EMPTY_ITEM',
        });
        themeErrors++;
        return;
      }

      // 2. TRIM
      if (word !== word.trim()) {
        defects.push({
          datasetId: `rawWords:${themeName}`,
          location: loc,
          message: `[TRIM] Ведущие или концевые пробелы: "${word}"`,
          code: 'TRIM',
        });
        themeErrors++;
      }

      // 3. DOUBLE_SPACE
      if (/\s{2,}/.test(word)) {
        defects.push({
          datasetId: `rawWords:${themeName}`,
          location: loc,
          message: `[DOUBLE_SPACE] Двойной пробел: "${word}"`,
          code: 'DOUBLE_SPACE',
        });
        themeErrors++;
      }

      // 4. DUP_ITEM (внутри темы)
      if (themeSeen.has(word)) {
        defects.push({
          datasetId: `rawWords:${themeName}`,
          location: loc,
          message: `[DUP_ITEM] Точный дубль элемента внутри темы: "${word}"`,
          code: 'DUP_ITEM',
        });
        themeErrors++;
      }
      themeSeen.add(word);

      // 5. SHORT_ITEM (< 3 символов)
      if (word.length < 3 && !RAW_WORDS_SHORT_ITEM_WHITELIST.has(word)) {
        defects.push({
          datasetId: `rawWords:${themeName}`,
          location: loc,
          message: `[SHORT_ITEM] Элемент короче 3 символов: "${word}"`,
          code: 'SHORT_ITEM',
        });
        themeErrors++;
      }

      // 6. LATIN_HOMOGLYPH
      const tokens = word.split(/[\s,.:;!?\-\/\\()"'`{}<>]+/);
      const hasMixedToken = tokens.some((tok: string) => /[а-яёА-ЯЁ]/.test(tok) && /[a-zA-Z]/.test(tok));
      const hasMixedItem = /[а-яёА-ЯЁ]/.test(word) && /[a-zA-Z]/.test(word);

      if (hasMixedToken || hasMixedItem) {
        defects.push({
          datasetId: `rawWords:${themeName}`,
          location: loc,
          message: `[LATIN_HOMOGLYPH] Латинские символы/омоглифы в русском слове: "${word}"`,
          code: 'LATIN_HOMOGLYPH',
        });
        themeErrors++;
      }
    });
  });

  rawWordsTotalElements += themeElements;
  rawWordsTotalErrors += themeErrors;
  bankStatsList.push({
    name: `rawWords:${themeName}`,
    elements: themeElements,
    errors: themeErrors,
    warnings: 0,
  });
});

bankStatsList.push({
  name: 'rawWords (все темы суммарно)',
  elements: rawWordsTotalElements,
  errors: rawWordsTotalErrors,
  warnings: 0,
});

// ==========================================
// Информационные списки
// ==========================================

// words.ts: слова, встречающиеся в двух и более темах
const wordThemeMap = new Map<string, Set<string>>();
for (const [theme, info] of Object.entries(rawWords)) {
  for (const list of Object.values(info.words)) {
    for (const w of list) {
      if (!wordThemeMap.has(w)) wordThemeMap.set(w, new Set());
      wordThemeMap.get(w)!.add(theme);
    }
  }
}
const crossThemeWords = Array.from(wordThemeMap.entries())
  .filter(([_, themes]) => themes.size > 1)
  .sort((a, b) => a[0].localeCompare(b[0], 'ru'));

console.log('======================================================');
console.log('ИНФОРМАЦИОННЫЙ СПИСОК: СЛОВА, ВСТРЕЧАЮЩИЕСЯ В 2+ ТЕМАХ (words.ts):');
console.log('======================================================');
console.log('слово | темы');
console.log('---|---');
crossThemeWords.forEach(([word, themes]) => {
  console.log(`${word} | ${Array.from(themes).join(', ')}`);
});
console.log(`\nВСЕГО слов в нескольких темах: ${crossThemeWords.length}\n`);

// urls.ts EXTENSIONS: дубли между категориями
const extCategoryMap = new Map<string, string[]>();
for (const [cat, exts] of Object.entries(EXTENSIONS)) {
  for (const ext of exts) {
    if (!extCategoryMap.has(ext)) extCategoryMap.set(ext, []);
    extCategoryMap.get(ext)!.push(cat);
  }
}
const crossCategoryExts = Array.from(extCategoryMap.entries())
  .filter(([_, cats]) => cats.length > 1)
  .sort((a, b) => a[0].localeCompare(b[0]));

console.log('======================================================');
console.log('ИНФОРМАЦИОННЫЙ СПИСОК: РАСШИРЕНИЯ В НЕСКОЛЬКИХ КАТЕГОРИЯХ (urls.ts EXTENSIONS):');
console.log('======================================================');
console.log('расширение | категории');
console.log('---|---');
crossCategoryExts.forEach(([ext, cats]) => {
  console.log(`${ext} | ${cats.join(', ')}`);
});
console.log(`\nВСЕГО дублирующихся расширений: ${crossCategoryExts.length}\n`);

// ==========================================
// Итоговая сводка по всем банкам
// ==========================================

console.log('======================================================');
console.log('ИТОГОВАЯ СВОДКА ПО БАНКАМ ДАННЫХ:');
console.log('======================================================');
console.log('банк | элементов | ошибок | предупреждений');
console.log('---|---|---|---');

// Статистика по заданию 13 и заданию 11
const task13TextsErrors = defects.filter(d => TASK13_TEXTS.some(t => t.id === d.datasetId)).length;
const task13TablesErrors = defects.filter(d => TASK13_TABLES.some(t => t.id === d.datasetId)).length;

console.log(`TASK13_TEXTS | ${TASK13_TEXTS.length} | ${task13TextsErrors} | 0`);
console.log(`TASK13_TABLES | ${TASK13_TABLES.length} | ${task13TablesErrors} | 0`);
console.log(`WORKS (Задание 11) | ${WORKS.length} | ${task11Errors.length} | ${task11Warnings.length}`);

// Все остальные банки
bankStatsList.forEach(stat => {
  console.log(`${stat.name} | ${stat.elements} | ${stat.errors} | ${stat.warnings}`);
});
console.log('======================================================\n');

if (defects.length > 0) {
  console.error(`\n[CHECK:DATA] Обнаружено дефектов: ${defects.length}\n`);
  defects.forEach(d => {
    console.error(`  - [${d.datasetId}] (${d.location}): ${d.message}`);
  });
  process.exit(1);
} else {
  console.log(`\n[CHECK:DATA] Все данные валидны:`);
  console.log(`  - Задание 13 текстов: ${TASK13_TEXTS.length}`);
  console.log(`  - Задание 13 таблиц: ${TASK13_TABLES.length}`);
  console.log(`  - Задание 11 произведений: ${WORKS.length}`);
  console.log(`  - Дефектов не обнаружено.\n`);
  process.exit(0);
}


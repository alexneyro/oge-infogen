import React from 'react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { RNG } from '../utils/rng';
import { pickStable, pickManyStable } from '../utils/stablePick';
import { normalizeAnswer } from '../utils/normalize';
import { StatementBlock, StatementText, StatementQuestion, SubBlock, BlockLabel, AnswerField, AnswerChip, VerdictBox, HintBox } from '../components/task-ui';
import {
  FILE_NAMES,
  EXTENSIONS,
  SITES,
  ZONES,
  DIRS,
  DIRS_DATED,
  MAIL_LOGINS,
  MOVE_TEMPLATES,
  INTRO_TEMPLATES_URL,
  INTRO_TEMPLATES_MAIL,
  FileNamesByCategory
} from '../data/urls';

export type Task7Subtype = 'email' | 'short_url' | 'url_tricky' | 'ip' | 'move';
export type LabelType = 'letter' | 'digit';

export interface Task7Fragment {
  label: string;
  text: string;
}

export interface Task7Data {
  difficulty: Difficulty;
  subtype: Task7Subtype;
  fragments: Task7Fragment[];
  correctAnswer: string;
  statementIntro: string;
  questionText: string;
  shortHint: string;
  explanation: string;
}

const RU_LABELS = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П'];

interface LabelInfo {
  labelType: LabelType;
  labels: string[];
  rangeText: string;
  unitPlural: string;
}

function getLabelInfo(count: number, forcedType?: LabelType, rng?: RNG): LabelInfo {
  const isLetter = rng ? rng.next() < 0.5 : Math.random() < 0.5;
  const labelType = forcedType || (isLetter ? 'letter' : 'digit');
  if (labelType === 'letter') {
    const labels = RU_LABELS.slice(0, count);
    const first = labels[0];
    const last = labels[count - 1];
    return {
      labelType: 'letter',
      labels,
      rangeText: `буквами от ${first} до ${last}`,
      unitPlural: 'букв'
    };
  } else {
    const labels = Array.from({ length: count }, (_, i) => String(i + 1));
    return {
      labelType: 'digit',
      labels,
      rangeText: `цифрами от 1 до ${count}`,
      unitPlural: 'цифр'
    };
  }
}

function pickFileAndExt(
  rng: RNG | undefined,
  seed: number,
  levelTag: 'L1' | 'L2' | 'L3'
): { fileName: string; extension: string; category: string } {
  const categories = Object.keys(FILE_NAMES) as (keyof FileNamesByCategory)[];
  
  const isCat = rng ? rng.next() < 0.75 : Math.random() < 0.75;
  if (isCat) {
    const cat = pickStable(categories, seed, `task7:fileCat:${levelTag}`, (s) => s);
    const fileList = FILE_NAMES[cat];
    const extList = EXTENSIONS[cat];
    const fileName = pickStable(fileList, seed, `task7:fileName:${levelTag}:${cat}`, (s) => s);
    const extension = pickStable(extList, seed, `task7:fileExt:${levelTag}:${cat}`, (s) => s);
    return { fileName, extension, category: String(cat) };
  } else {
    const [catFile, catExt] = pickManyStable(categories, seed, `task7:fileCatMixed:${levelTag}`, (s) => s, 2);
    const fileList = FILE_NAMES[catFile];
    const extList = EXTENSIONS[catExt];
    const fileName = pickStable(fileList, seed, `task7:fileName:${levelTag}:${catFile}`, (s) => s);
    const extension = pickStable(extList, seed, `task7:fileExt:${levelTag}:${catExt}`, (s) => s);
    return { fileName, extension, category: 'mixed' };
  }
}

function permute4<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  function p(curr: T[], rest: T[]) {
    if (rest.length === 0) {
      result.push(curr);
      return;
    }
    for (let i = 0; i < rest.length; i++) {
      p([...curr, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]);
    }
  }
  p([], arr);
  return result;
}

function isValidIPv4(s: string): boolean {
  const parts = s.split('.');
  if (parts.length !== 4) return false;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return false;
    if (part.length > 1 && part.startsWith('0')) return false;
    const num = Number(part);
    if (num < 0 || num > 255) return false;
  }
  return true;
}

function generateTrickyIP(rng?: RNG): { ipString: string; chunks: string[] } {
  for (let attempt = 0; attempt < 200; attempt++) {
    const o1 = rng ? rng.int(10, 229) : Math.floor(Math.random() * 220) + 10;
    const o2 = rng ? rng.int(1, 250) : Math.floor(Math.random() * 250) + 1;
    const o3 = rng ? rng.int(1, 250) : Math.floor(Math.random() * 250) + 1;
    const o4 = rng ? rng.int(1, 250) : Math.floor(Math.random() * 250) + 1;
    
    const ipStr = `${o1}.${o2}.${o3}.${o4}`;
    
    const len = ipStr.length;
    const cuts: number[] = [];
    while (cuts.length < 3) {
      const idx = rng ? rng.int(1, len - 1) : Math.floor(Math.random() * (len - 1)) + 1;
      if (!cuts.includes(idx)) cuts.push(idx);
    }
    cuts.sort((a, b) => a - b);
    
    const f0 = ipStr.slice(0, cuts[0]);
    const f1 = ipStr.slice(cuts[0], cuts[1]);
    const f2 = ipStr.slice(cuts[1], cuts[2]);
    const f3 = ipStr.slice(cuts[2]);
    
    const candFragments = [f0, f1, f2, f3];
    
    let validCount = 0;
    const perms = permute4(candFragments);
    for (const pPerm of perms) {
      if (isValidIPv4(pPerm.join(''))) {
        validCount++;
      }
    }
    
    if (validCount === 1) {
      return { ipString: ipStr, chunks: candFragments };
    }
  }

  return {
    ipString: '192.168.21.14',
    chunks: ['192.', '168.2', '1.1', '4']
  };
}

function assembleTaskFromChunks(
  difficulty: Difficulty,
  subtype: Task7Subtype,
  orderedChunks: string[],
  statementIntro: string,
  questionText: string,
  shortHint: string,
  explanationSteps: string,
  forcedLabelType?: LabelType,
  distractors?: { text: string; reason: string }[],
  rng?: RNG
): Task7Data {
  const uniqueChunks: string[] = [];
  orderedChunks.forEach(chunk => {
    if (!uniqueChunks.includes(chunk)) {
      uniqueChunks.push(chunk);
    }
  });

  if (distractors) {
    distractors.forEach(d => {
      if (!uniqueChunks.includes(d.text)) {
        uniqueChunks.push(d.text);
      }
    });
  }

  const count = uniqueChunks.length;
  const labelInfo = getLabelInfo(count, forcedLabelType, rng);

  const shuffledUnique = rng ? rng.shuffle(uniqueChunks) : uniqueChunks.slice().sort(() => Math.random() - 0.5);
  const chunkToLabelMap = new Map<string, string>();
  
  const fragments: Task7Fragment[] = shuffledUnique.map((text, i) => {
    const label = labelInfo.labels[i];
    chunkToLabelMap.set(text, label);
    return { label, text };
  });
  
  const correctAnswer = orderedChunks.map(chunk => chunkToLabelMap.get(chunk)!).join('');
  
  const labelWord = labelInfo.labelType === 'letter' ? 'буква' : 'цифра';
  let stepsText = '';
  orderedChunks.forEach((chunk, origIdx) => {
    stepsText += `${origIdx + 1}. Фрагмент "${chunk}" — ${labelWord} ${chunkToLabelMap.get(chunk)}\n`;
  });

  let distractorExplanation = '';
  if (distractors && distractors.length > 0) {
    distractorExplanation = '\nЛишние (неиспользуемые) фрагменты:\n' +
      distractors.map(d => {
        const label = chunkToLabelMap.get(d.text);
        return `• Фрагмент "${d.text}" (${labelWord} ${label}) — лишний: ${d.reason}`;
      }).join('\n') + '\n';
  }

  const seqWord = labelInfo.labelType === 'letter' ? 'букв' : 'цифр';
  const fullExplanation = `${explanationSteps}\n\nСборка фрагментов по порядку:\n${stepsText}${distractorExplanation}\nИтоговая последовательность ${seqWord}: ${correctAnswer}.\nОтвет: ${correctAnswer}`;

  return {
    difficulty,
    subtype,
    fragments,
    correctAnswer,
    statementIntro,
    questionText,
    shortHint,
    explanation: fullExplanation
  };
}

function generateEmailLoginChunks(rng: RNG | undefined, seed: number): { loginStr: string; loginChunks: string[] } {
  const isComposite = (rng ? rng.next() : Math.random()) < 0.5;
  const pool = [...MAIL_LOGINS, ...FILE_NAMES.documents, ...FILE_NAMES.universal];

  if (isComposite) {
    const numWords = (rng ? rng.next() : Math.random()) < 0.5 ? 2 : 3;
    const picked = pickManyStable(pool, seed, 'task7:mailLogin:L1', (s) => s.toLowerCase(), numWords).map(s => s.toLowerCase());
    const loginStr = picked.join('_');

    if (numWords === 2) {
      return {
        loginStr,
        loginChunks: [`${picked[0]}_`, picked[1]]
      };
    } else {
      const splitType = rng ? rng.next() : Math.random();
      if (splitType < 0.34) {
        return {
          loginStr,
          loginChunks: [`${picked[0]}_`, `${picked[1]}_`, picked[2]]
        };
      } else if (splitType < 0.67) {
        return {
          loginStr,
          loginChunks: [`${picked[0]}_${picked[1]}_`, picked[2]]
        };
      } else {
        return {
          loginStr,
          loginChunks: [`${picked[0]}_`, `${picked[1]}_${picked[2]}`]
        };
      }
    }
  } else {
    const w = pickStable(MAIL_LOGINS, seed, 'task7:mailLoginSingle:L1', (s) => s);
    return {
      loginStr: w,
      loginChunks: [w]
    };
  }
}

function generateEmailServerChunks(rng: RNG | undefined, seed: number): { serverStr: string; serverChunks: string[] } {
  const hasSubdomain = (rng ? rng.next() : Math.random()) < 0.5;
  const zone = pickStable(ZONES, seed, 'task7:zone:L1', (s) => s);

  if (hasSubdomain) {
    const [site1, site2] = pickManyStable(SITES, seed, 'task7:site:L1', (s) => s, 2);
    const serverStr = `${site1}.${site2}.${zone}`;

    const rand = rng ? rng.next() : Math.random();
    let serverChunks: string[];
    if (rand < 0.25) {
      serverChunks = [site1, '.', site2, '.' + zone];
    } else if (rand < 0.5) {
      serverChunks = [site1 + '.', site2 + '.', zone];
    } else if (rand < 0.75) {
      serverChunks = [site1, '.' + site2, '.', zone];
    } else {
      serverChunks = [site1 + '.', site2, '.' + zone];
    }
    return { serverStr, serverChunks };
  } else {
    const site1 = pickStable(SITES, seed, 'task7:site:L1', (s) => s);
    const serverStr = `${site1}.${zone}`;
    const rand = rng ? rng.next() : Math.random();
    let serverChunks: string[];
    if (rand < 0.33) {
      serverChunks = [site1, '.' + zone];
    } else if (rand < 0.66) {
      serverChunks = [site1 + '.', zone];
    } else {
      serverChunks = [site1, '.', zone];
    }
    return { serverStr, serverChunks };
  }
}

function generateLevel1Email(difficulty: Difficulty, rng: RNG | undefined, seed: number): Task7Data {
  const { loginStr, loginChunks } = generateEmailLoginChunks(rng, seed);
  const { serverStr, serverChunks } = generateEmailServerChunks(rng, seed);
  const fullEmail = `${loginStr}@${serverStr}`;
  const orderedChunks = [...loginChunks, '@', ...serverChunks];

  const uniqueCount = new Set(orderedChunks).size;
  const labelInfo = getLabelInfo(uniqueCount, undefined, rng);

  const introTmpl = rng ? rng.pick(INTRO_TEMPLATES_MAIL) : INTRO_TEMPLATES_MAIL[Math.floor(Math.random() * INTRO_TEMPLATES_MAIL.length)];
  const introText = introTmpl.replace('{login}', loginStr).replace('{server}', serverStr);

  const statementIntro = `${introText} Фрагменты адреса электронной почты закодированы ${labelInfo.rangeText}.`;
  const questionText = `Запишите последовательность этих ${labelInfo.unitPlural}, кодирующую этот адрес.`;
  const shortHint = `Адрес электронной почты имеет структуру: [логин / имя ящика] + [символ @] + [сервер]. Собирайте фрагменты строго по порядку символов.`;

  let loginDesc = '';
  if (loginChunks.length === 1) {
    loginDesc = `логин: "${loginChunks[0]}"`;
  } else {
    loginDesc = `логин (состоит из частей): ${loginChunks.map(c => `"${c}"`).join(', ')}`;
  }

  const serverDesc = `почтовый сервер (состоит из фрагментов): ${serverChunks.map(c => `"${c}"`).join(', ')}`;

  const explanationSteps = `Адрес электронной почты собирается по схеме: [логин] @ [имя сервера] [доменная зона]. Обратите внимание, что имя сервера, доменная зона (например, .ru, .studio) и части логина даны отдельными фрагментами.\nРазбор фрагментов: ${loginDesc}; символ @; ${serverDesc}.\nПолный почтовый адрес: ${fullEmail}`;

  return assembleTaskFromChunks(difficulty, 'email', orderedChunks, statementIntro, questionText, shortHint, explanationSteps, labelInfo.labelType, undefined, rng);
}

function generateLevel1ShortUrl(difficulty: Difficulty, rng: RNG | undefined, seed: number): Task7Data {
  const protocols = ['http', 'https', 'ftp'];
  const protocol = rng ? rng.pick(protocols) : protocols[Math.floor(Math.random() * 3)];
  const zone = pickStable(ZONES, seed, 'task7:zone:L1', (s) => s);
  const server = pickStable(SITES, seed, 'task7:site:L1', (s) => s);
  const { fileName, extension } = pickFileAndExt(rng, seed, 'L1');
  
  const fullUrl = `${protocol}://${server}.${zone}/${fileName}.${extension}`;
  
  const variations = [
    // Style A: Standalone '/' for path slash (protocol delimiter '://' is strictly intact in L1)
    [protocol, '://', server, '.' + zone, '/', fileName, '.' + extension],
    [protocol, '://', server + '.' + zone, '/', fileName, '.' + extension],

    // Style B: Attached path slashes (no standalone '/')
    [protocol, '://', server, '.' + zone + '/', fileName, '.' + extension],
    [protocol, '://', server, '.' + zone, '/' + fileName, '.' + extension],
    [protocol, '://', server + '.' + zone + '/', fileName, '.' + extension]
  ];
  const orderedChunks = rng ? rng.pick(variations) : variations[Math.floor(Math.random() * variations.length)];

  const uniqueCount = new Set(orderedChunks).size;
  const labelInfo = getLabelInfo(uniqueCount, undefined, rng);

  const introTmpl = rng ? rng.pick(INTRO_TEMPLATES_URL) : INTRO_TEMPLATES_URL[Math.floor(Math.random() * INTRO_TEMPLATES_URL.length)];
  const introText = introTmpl
    .replace('{file}', `${fileName}.${extension}`)
    .replace('{server}', `${server}.${zone}`)
    .replace('{protocol}', protocol);

  const statementIntro = `${introText} Фрагменты адреса файла закодированы ${labelInfo.rangeText}.`;
  const questionText = `Запишите последовательность этих ${labelInfo.unitPlural}, кодирующую адрес указанного файла в сети Интернет.`;
  const shortHint = `Адрес файла в сети Интернет строится так: сначала протокол (например http), затем разделитель ://, затем имя сервера вместе с доменной зоной (доменная зона пишется с точкой, например .ru), затем при наличии путь к файлу через символ /, и в конце имя файла с расширением (расширение тоже с точкой, например .doc). Соберите фрагменты в этом порядке.`;
  const explanationSteps = `Правила построения полного адреса файла в сети Интернет:\n1. Протокол доступа: ${protocol}\n2. Разделитель: ://\n3. Имя сервера: ${server}\n4. Доменная зона: .${zone}\n5. Разделитель: /\n6. Имя файла: ${fileName}\n7. Расширение файла: .${extension}\nПолный URL-адрес: ${fullUrl}`;

  return assembleTaskFromChunks(difficulty, 'short_url', orderedChunks, statementIntro, questionText, shortHint, explanationSteps, labelInfo.labelType, undefined, rng);
}

function generateLevel2TrickyUrl(difficulty: Difficulty, rng: RNG | undefined, seed: number): Task7Data {
  const protocols = ['http', 'https', 'ftp', 'sftp'];
  const protocol = rng ? rng.pick(protocols) : protocols[Math.floor(Math.random() * 4)];
  const zone = pickStable(ZONES, seed, 'task7:zone:L2', (s) => s);
  const server = pickStable(SITES, seed, 'task7:site:L2', (s) => s);
  const { fileName, extension } = pickFileAndExt(rng, seed, 'L2');

  const fullUrl = `${protocol}://${server}.${zone}/${fileName}.${extension}`;

  const variations = [
    // Style A: Standalone '/' for path slash (may split protocol delimiter)
    [protocol, '://', server, '.' + zone, '/', fileName, '.' + extension],
    [protocol, '://', server + '.' + zone, '/', fileName, '.' + extension],
    [protocol, ':', '//', server, '.' + zone, '/', fileName, '.' + extension],
    [protocol, ':', '/', '/', server, '.' + zone, '/', fileName, '.' + extension],
    [protocol, ':', '/', '/', server + '.' + zone, '/', fileName, '.' + extension],

    // Style B: Attached path slashes (no standalone '/')
    [protocol, '://', server, '.' + zone + '/', fileName, '.' + extension],
    [protocol, '://', server, '.' + zone, '/' + fileName, '.' + extension],
    [protocol, ':', '//', server, '.' + zone + '/', fileName, '.' + extension],
    [protocol, ':', '//', server, '.' + zone, '/' + fileName, '.' + extension],
    [protocol, ':', '/', '/', server + '.' + zone + '/', fileName, '.' + extension],
    [protocol, ':', '/', '/', server, '.' + zone + '/', fileName, '.' + extension]
  ];
  const orderedChunks = rng ? rng.pick(variations) : variations[Math.floor(Math.random() * variations.length)];

  const uniqueCount = new Set(orderedChunks).size;
  const labelInfo = getLabelInfo(uniqueCount, undefined, rng);

  const introTmpl = rng ? rng.pick(INTRO_TEMPLATES_URL) : INTRO_TEMPLATES_URL[Math.floor(Math.random() * INTRO_TEMPLATES_URL.length)];
  const introText = introTmpl
    .replace('{file}', `${fileName}.${extension}`)
    .replace('{server}', `${server}.${zone}`)
    .replace('{protocol}', protocol);

  const statementIntro = `${introText} Фрагменты адреса файла закодированы ${labelInfo.rangeText}.`;
  const questionText = `Запишите последовательность этих ${labelInfo.unitPlural}, кодирующую адрес указанного файла в сети Интернет.`;
  const shortHint = `Адрес файла в сети Интернет строится так: сначала протокол (например http), затем разделитель ://, затем имя сервера вместе с доменной зоной (доменная зона пишется с точкой, например .ru), затем при наличии путь к файлу через символ /, и в конце имя файла с расширением (расширение тоже с точкой, например .doc). Обращайте внимание на знаки препинания (точки и слэши), приклеенные к различным фрагментам.`;
  const explanationSteps = `Составляем URL-адрес из фрагментов с разной нарезкой символов:\n1. Протокол и начало адреса\n2. Сервер и доменная зона\n3. Имя и расширение файла\nПолный URL-адрес: ${fullUrl}`;

  return assembleTaskFromChunks(difficulty, 'url_tricky', orderedChunks, statementIntro, questionText, shortHint, explanationSteps, labelInfo.labelType, undefined, rng);
}

function generateLevel2IP(difficulty: Difficulty, rng?: RNG): Task7Data {
  const { ipString, chunks } = generateTrickyIP(rng);
  const labelInfo = getLabelInfo(chunks.length, undefined, rng);

  const statementIntro = `Некоторая фирма восстанавливает фрагменты IP-адреса. Практикант записал фрагменты IP-адреса, но перепутал их порядок. Фрагменты закодированы ${labelInfo.rangeText}.`;
  const questionText = `Запишите последовательность этих ${labelInfo.unitPlural}, кодирующую данный IP-адрес.`;
  const shortHint = `IP-адрес состоит из четырёх чисел от 0 до 255, разделённых точками. Ни одно из чисел не может превышать 255 или содержать лишние начальные нули.`;

  const explanationSteps = `Для восстановления IP-адреса фрагменты необходимо соединить встык в правильном порядке. Корректный IP-адрес состоит из 4 чисел в диапазоне от 0 до 255, разделённых точками.\n` +
    `Обратите внимание: фрагменты уже содержат точки внутри, поэтому добавлять лишние точки между кусками не нужно — куски просто приставляются друг к другу, а разделители-точки уже встроены в нужных местах.\n\n` +
    `Соединяем фрагменты по порядку:\n` +
    `• 1-й фрагмент: "${chunks[0]}"\n` +
    `• 2-й фрагмент: "${chunks[1]}"\n` +
    `• 3-й фрагмент: "${chunks[2]}"\n` +
    `• 4-й фрагмент: "${chunks[3]}"\n` +
    `Итоговый IP-адрес: ${ipString}\n\n` +
    `Этот порядок единственно верный: при любом другом порядке составления фрагментов либо одно из чисел получается больше 255, либо в адресе оказывается неверное количество чисел (не 4).`;

  return assembleTaskFromChunks(difficulty, 'ip', chunks, statementIntro, questionText, shortHint, explanationSteps, labelInfo.labelType, undefined, rng);
}

function pickDistractorDir(excluded: string[], seed: number): string {
  const pool = [...DIRS, ...DIRS_DATED, 'temp', 'old', 'archive', 'backup', 'drafts', 'raw'];
  const candidates = pool.filter(d => !excluded.includes(d));
  return pickStable(candidates, seed, 'task7:distractorDir:L3', (s) => s) || 'old_files';
}

function generateLevel3Move(difficulty: Difficulty, rng: RNG | undefined, seed: number): Task7Data {
  const { fileName, extension } = pickFileAndExt(rng, seed, 'L3');
  const file = `${fileName}.${extension}`;
  const site = pickStable(SITES, seed, 'task7:site:L3', (s) => s);
  const zone = pickStable(ZONES, seed, 'task7:zone:L3', (s) => s);
  const server = `${site}.${zone}`;
  const protocols = ['http', 'https', 'ftp'];
  const protocol = rng ? rng.pick(protocols) : protocols[Math.floor(Math.random() * 3)];
  
  const [dir, dir1] = pickManyStable(DIRS, seed, 'task7:dir:L3', (s) => s, 2);
  const dir2 = pickStable(DIRS_DATED, seed, 'task7:dirDated:L3', (s) => s);

  const templateIndex = rng ? rng.int(0, MOVE_TEMPLATES.length - 1) : Math.floor(Math.random() * MOVE_TEMPLATES.length);
  const rawTmpl = MOVE_TEMPLATES[templateIndex];

  const tmplText = rawTmpl
    .replace('{file}', file)
    .replace('{server}', server)
    .replace('{dir}', dir)
    .replace('{dir1}', dir1)
    .replace('{dir2}', dir2)
    .replace('{protocol}', protocol);

  let orderedChunks: string[] = [];
  let newUrl = '';
  const distractors: { text: string; reason: string }[] = [];

  const extra1 = pickDistractorDir([dir, dir1, dir2, site, zone, protocol, fileName, extension], seed);

  switch (templateIndex) {
    case 0:
      newUrl = `${protocol}://${server}/${dir}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir, '/', file];
      distractors.push({
        text: extra1,
        reason: `он относится к прежнему состоянию файловой структуры, а при переносе из корневого каталога в "${dir}" в адресе не используется`
      });
      break;
    case 1:
      newUrl = `${protocol}://${server}/${dir2}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir2, '/', file];
      distractors.push({
        text: dir1,
        reason: `он относится к прежнему расположению файла (до переноса в каталог "${dir2}") и в новом адресе не используется`
      });
      break;
    case 2:
      newUrl = `${protocol}://${server}/${dir}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir, '/', file];
      distractors.push({
        text: extra1,
        reason: `файл перемещён в созданный каталог "${dir}", а каталог "${extra1}" в условии не относится к новому адресу`
      });
      break;
    case 3:
      newUrl = `${protocol}://${server}/${dir}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir, '/', file];
      distractors.push({
        text: extra1,
        reason: `на новом сервере файл размещён в каталоге "${dir}", а каталог "${extra1}" в итоговом адресе не используется`
      });
      break;
    case 4:
      newUrl = `${protocol}://${server}/${dir1}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir1, '/', file];
      distractors.push({
        text: dir2,
        reason: `файл переместили из подкаталога "${dir2}" на уровень выше (в каталог "${dir1}"), поэтому "${dir2}" больше не входит в новый адрес`
      });
      break;
    case 5:
      newUrl = `${protocol}://${server}/${dir2}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir2, '/', file];
      distractors.push({
        text: dir1,
        reason: `старое имя каталога "${dir1}" после переименования в "${dir2}" в адресе не используется`
      });
      break;
    case 6:
      newUrl = `${protocol}://${server}/${dir1}/${dir2}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir1, '/', dir2, '/', file];
      distractors.push({
        text: extra1,
        reason: `файл перемещён в подкаталог "${dir2}" внутри "${dir1}", а каталог "${extra1}" в новом адресе не используется`
      });
      break;
    case 7:
      newUrl = `${protocol}://${server}/${dir1}/${dir2}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir1, '/', dir2, '/', file];
      distractors.push({
        text: extra1,
        reason: `файл перенесён в каталог "${dir1}/${dir2}", а каталог "${extra1}" в итоговом адресе не используется`
      });
      break;
    case 8:
      newUrl = `${protocol}://${server}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', file];
      distractors.push({
        text: dir1,
        reason: `файл перенесён в корневой каталог сервера, поэтому прежний каталог "${dir1}" в новом адресе не используется`
      });
      break;
    case 9:
      newUrl = `${protocol}://${server}/${dir}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir, '/', file];
      distractors.push({
        text: extra1,
        reason: `файл размещён в каталоге "${dir}", а каталог "${extra1}" в адресе не используется`
      });
      break;
    case 10:
      newUrl = `${protocol}://${server}/${dir}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir, '/', file];
      distractors.push({
        text: extra1,
        reason: `файл выложен в каталог "${dir}", а каталог "${extra1}" в сетевом адресе не используется`
      });
      break;
    case 11:
      newUrl = `${protocol}://${server}/${dir1}/${dir2}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir1, '/', dir2, '/', file];
      distractors.push({
        text: extra1,
        reason: `файл перенесён по пути "${dir1}/${dir2}", а каталог "${extra1}" в обновлённой структуре не используется`
      });
      break;
    case 12:
      newUrl = `${protocol}://${server}/${dir1}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir1, '/', file];
      distractors.push({
        text: extra1,
        reason: `файл размещён в каталоге "${dir1}", а каталог "${extra1}" в итоговом адресе не используется`
      });
      break;
    case 13:
      newUrl = `${protocol}://${server}/${dir2}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir2, '/', file];
      distractors.push({
        text: dir1,
        reason: `файл перемещён в раздел "${dir2}", а каталог "${dir1}" в адресе не используется`
      });
      break;
    default:
      newUrl = `${protocol}://${server}/${dir}/${file}`;
      orderedChunks = [protocol, '://', site, '.' + zone, '/', dir, '/', file];
      distractors.push({
        text: extra1,
        reason: `каталог "${extra1}" в адресе не используется`
      });
      break;
  }

  const allChunksForCount = [...orderedChunks, ...distractors.map(d => d.text)];
  const uniqueCount = new Set(allChunksForCount).size;
  const labelInfo = getLabelInfo(uniqueCount, undefined, rng);

  const statementIntro = `${tmplText} Фрагменты нового адреса закодированы ${labelInfo.rangeText}.`;
  const questionText = `Запишите последовательность этих ${labelInfo.unitPlural}, кодирующую новый адрес этого файла в сети Интернет.`;
  const shortHint = `Определите структуру нового адреса после перемещения: [протокол] + [://] + [сервер] + [/] + [путь к файлу с каталогами]. Отсеивайте неиспользуемые фрагменты-ловушки.`;
  const explanationSteps = `Проанализируем условие перемещения и составим новый адрес файла:\nОписание изменения: ${tmplText}\nНовый полный URL-адрес файла: ${newUrl}`;

  return assembleTaskFromChunks(difficulty, 'move', orderedChunks, statementIntro, questionText, shortHint, explanationSteps, labelInfo.labelType, distractors, rng);
}

export const task7: TaskModule = {
  id: 7,
  title: 'Информационно-коммуникационные технологии',
  description: 'Адресация файлов в сети Интернет, восстановление IP-адресов и адресов электронной почты.',
  topics: ['Компьютерные сети', 'Адресация в сети'], // TODO: уточнить формулировки
  maxPoints: 1,

  generate: (difficulty: Difficulty, rng: RNG): Task7Data => {
    const seed = Math.floor(rng.next() * 0x100000000);
    if (difficulty === 1) {
      return (rng ? rng.next() : Math.random()) < 0.25 ? generateLevel1Email(1, rng, seed) : generateLevel1ShortUrl(1, rng, seed);
    } else if (difficulty === 2) {
      return (rng ? rng.next() : Math.random()) < 0.25 ? generateLevel2IP(2, rng) : generateLevel2TrickyUrl(2, rng, seed);
    } else {
      return generateLevel3Move(3, rng, seed);
    }
  },

  render: (taskData: Task7Data, state: TaskModuleState) => {
    const isDigitSequence = /^[0-9]+$/.test(taskData.correctAnswer);
    const unitText = isDigitSequence ? 'цифр' : 'букв';
    const examplePlaceholder = isDigitSequence ? 'Например: 31425...' : 'Например: ВБГЕДА...';

    return (
      <div className="space-y-4">
        {/* Intro statement and fragments */}
        <StatementBlock>
          <StatementText>
            {taskData.statementIntro}
          </StatementText>

          {/* Fragments List */}
          <SubBlock>
            <BlockLabel>Фрагменты адреса:</BlockLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {taskData.fragments.map((frag) => (
                <div
                  key={frag.label}
                  className="flex items-center space-x-3 p-3 bg-theme-card border border-theme-border rounded-xl shadow-xs transition-colors hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <span className="flex-none w-7 h-7 flex items-center justify-center font-extrabold text-sm rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {frag.label}
                  </span>
                  <code className="font-mono font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/60 select-all">
                    {frag.text}
                  </code>
                </div>
              ))}
            </div>
          </SubBlock>

          {/* Question Text */}
          <StatementQuestion className="pt-2 border-t border-theme-statement-border/50">
            {taskData.questionText}
          </StatementQuestion>
        </StatementBlock>

        {/* Input Field */}
        <AnswerField
          label={`Ваш ответ (последовательность ${unitText}):`}
          value={state.userAnswer}
          onChange={(val) => state.setUserAnswer(val)}
          disabled={state.isSubmitted}
          placeholder={examplePlaceholder}
          mono={true}
          maxWidth="xs"
        />

        {/* Feedback Overlay */}
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

        {/* Hint before submission */}
        {state.showHints && !state.isSubmitted && (
          <HintBox>
            <strong className="block font-extrabold text-sm mb-1.5">💡 Подсказка-наводка:</strong>
            {taskData.shortHint}
          </HintBox>
        )}

        {/* Explanation after submission */}
        {state.isSubmitted && (
          <div className="p-5 bg-theme-solution-bg border border-theme-solution-border text-sm text-theme-solution-text rounded-xl leading-relaxed whitespace-pre-line shadow-sm font-semibold">
            <strong className="block text-slate-900 dark:text-white font-extrabold text-base mb-2">📖 Подробное решение:</strong>
            <div className="space-y-1">
              {taskData.explanation}
            </div>
          </div>
        )}
      </div>
    );
  },

  check: (taskData: Task7Data, userAnswer: string) => {
    if (!userAnswer) return false;
    return normalizeAnswer(userAnswer) === normalizeAnswer(taskData.correctAnswer);
  }
};

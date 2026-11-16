import React, { useState } from 'react';
import { Download, FolderArchive, FileText } from 'lucide-react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { WORKS, Work, Character, Hook, Phrase, Relation, Situation } from '../data/texts11';
import { RNG, hashSeed } from '../utils/rng';
import { saveBlob } from '../utils/download';
import { buildDocxBlob } from '../utils/docx';
import { buildRtfString } from '../utils/rtf';

function localMix32(x: number): number {
  x = (x ^ (x >>> 16)) >>> 0;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x = (x ^ (x >>> 15)) >>> 0;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

function weightOf(seed: number, tag: string, id: string): number {
  return localMix32(hashSeed(`${seed}|${tag}|${id}`));
}

function pickStable<T>(
  items: T[],
  seed: number,
  tag: string,
  idOf: (item: T) => string
): T {
  if (!items || items.length === 0) {
    throw new Error('Cannot pick from empty array');
  }

  let bestItem = items[0];
  let bestId = idOf(bestItem);
  let bestWeight = weightOf(seed, tag, bestId);

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const id = idOf(item);
    const weight = weightOf(seed, tag, id);
    if (weight > bestWeight || (weight === bestWeight && id < bestId)) {
      bestItem = item;
      bestId = id;
      bestWeight = weight;
    }
  }

  return bestItem;
}

function pickManyStable<T>(
  items: T[],
  seed: number,
  tag: string,
  idOf: (item: T) => string,
  count: number
): T[] {
  if (!items || items.length === 0 || count <= 0) {
    return [];
  }

  const decorated = items.map((item) => {
    const id = idOf(item);
    const weight = weightOf(seed, tag, id);
    return { item, id, weight };
  });

  decorated.sort((a, b) => {
    if (b.weight > a.weight) return 1;
    if (b.weight < a.weight) return -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const take = Math.min(count, decorated.length);
  return decorated.slice(0, take).map((d) => d.item);
}

function shuffleStable<T>(
  items: T[],
  seed: number,
  tag: string,
  idOf: (item: T) => string
): T[] {
  return pickManyStable(items, seed, tag, idOf, items.length);
}
import {
  StatementBlock,
  StatementText,
  SubBlock,
  BlockLabel,
  AnswerField,
  AnswerChip,
  ActionButton,
  VerdictBox,
  HintBox,
} from '../components/task-ui';

/**
 * Extensible file generator function for text-based formats (plain text and HTML).
 * Note: .docx is generated separately via buildDocxBlob (src/utils/docx.ts)
 * because OOXML is a binary ZIP archive, not a plain text string.
 */
export function buildFile(text: string, format: 'txt' | 'html'): string {
  if (format === 'html') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Текст произведения</title>
  <style>
    body { font-family: sans-serif; margin: 20px; line-height: 1.6; }
    pre { white-space: pre-wrap; font-family: serif; font-size: 16px; }
  </style>
</head>
<body>
  <pre>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
  }
  // Default plain text (.txt)
  return text;
}

const textCache = new Map<string, string>();

export interface Task11ZipResult {
  blob: Blob;
  missing: string[];
}

// Build zip archive blob helper
export async function buildTask11ZipBlob(
  rootDir: string,
  level: Difficulty,
  defaultSubdir: string,
  works: Work[]
): Promise<Task11ZipResult> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const rootFolder = zip.folder(rootDir) || zip;
  const missing: string[] = [];

  let numLevel: Difficulty;
  if (typeof level === 'number' && (level === 1 || level === 2 || level === 3)) {
    numLevel = level;
  } else {
    console.warn(`[Task 11 Zip] Non-numeric or unexpected level received: ${JSON.stringify(level)}, normalizing to Difficulty.`);
    const parsed = parseInt(String(level).replace(/\D/g, ''), 10);
    numLevel = (parsed === 2 || parsed === 3 ? parsed : 1) as Difficulty;
  }

  for (let i = 0; i < works.length; i++) {
    const work = works[i];
    let rawContent = '';

    if (work.path) {
      if (textCache.has(work.path)) {
        rawContent = textCache.get(work.path)!;
      } else {
        // Node / test environment fallback
        if (typeof process !== 'undefined' && Boolean(process.versions?.node)) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const localPath = path.resolve(process.cwd(), 'public/texts', work.path);
            if (fs.existsSync(localPath)) {
              rawContent = fs.readFileSync(localPath, 'utf-8');
              if (rawContent && rawContent.trim()) {
                textCache.set(work.path, rawContent);
              }
            }
          } catch {
            // ignore
          }
        }

        // Browser fetch
        if (!rawContent && typeof fetch === 'function') {
          try {
            const origin = typeof window !== 'undefined' && window.location && window.location.origin
              ? window.location.origin
              : typeof document !== 'undefined' && document.baseURI
              ? document.baseURI
              : 'http://localhost:3000';
            const fetchPath = work.path.startsWith('/') ? work.path : `/texts/${work.path}`;
            const url = new URL(fetchPath, origin);
            const response = await fetch(url.toString());
            if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              if (!contentType.includes('text/html') || work.path.endsWith('.html')) {
                rawContent = await response.text();
                if (rawContent && rawContent.trim()) {
                  textCache.set(work.path, rawContent);
                }
              }
            }
          } catch (fetchErr) {
            console.warn(`[Task 11 Zip] Failed network fetch for ${work.path}:`, fetchErr);
          }
        }
      }
    }

    if (!rawContent || !rawContent.trim()) {
      const missingName = work.displayName || work.file;
      console.warn(`[Task 11 Zip] Content missing for work "${missingName}"`);
      missing.push(missingName);
      continue;
    }

    const displayFileName = work.displayName || work.file;
    const baseName = displayFileName.replace(/\.(txt|html|htm|docx|rtf)$/i, '');

    if (numLevel === 1) {
      // Level 1: flat structure directly in rootFolder
      try {
        const txtContent = buildFile(rawContent, 'txt');
        rootFolder.file(`${baseName}.txt`, txtContent);
      } catch (err) {
        console.error(`[Task 11 Zip Error] Failed to add ${baseName}.txt (L1):`, err);
        missing.push(`${baseName}.txt`);
      }
    } else {
      // Subdirectory structure for L2/L3
      const targetSubdir = work.subdir || defaultSubdir;
      const subFolder = rootFolder.folder(targetSubdir) || rootFolder;

      // 1. Always add .txt
      try {
        const txtContent = buildFile(rawContent, 'txt');
        subFolder.file(`${baseName}.txt`, txtContent);
      } catch (err) {
        console.error(`[Task 11 Zip Error] Failed to add ${baseName}.txt (L${numLevel}):`, err);
        missing.push(`${targetSubdir}/${baseName}.txt`);
      }

      if (numLevel === 2) {
        // Level 2: all 3 formats (.txt, .htm, .docx) for each work
        try {
          const htmlContent = buildFile(rawContent, 'html');
          subFolder.file(`${baseName}.htm`, htmlContent);
        } catch (err) {
          console.error(`[Task 11 Zip Error] Failed to add ${baseName}.htm (L2):`, err);
          missing.push(`${targetSubdir}/${baseName}.htm`);
        }

        try {
          const docxBlob = await buildDocxBlob(rawContent, baseName);
          const docxBuffer = await docxBlob.arrayBuffer();
          subFolder.file(`${baseName}.docx`, docxBuffer);
        } catch (err) {
          console.error(`[Task 11 Zip Error] Failed to add ${baseName}.docx (L2):`, err);
          missing.push(`${targetSubdir}/${baseName}.docx`);
        }
      } else if (numLevel === 3) {
        // Level 3: .txt plus 1-2 formats from .htm / .docx / .rtf
        // Deterministic distribution across works ensuring all 4 extensions exist in archive
        const l3FormatPattern: ('htm' | 'docx' | 'rtf')[][] = [
          ['htm', 'docx'],
          ['rtf'],
          ['docx', 'rtf'],
          ['htm'],
          ['htm', 'rtf'],
          ['docx'],
        ];
        const extraFormats = l3FormatPattern[i % l3FormatPattern.length];

        for (const fmt of extraFormats) {
          if (fmt === 'htm') {
            try {
              const htmlContent = buildFile(rawContent, 'html');
              subFolder.file(`${baseName}.htm`, htmlContent);
            } catch (err) {
              console.error(`[Task 11 Zip Error] Failed to add ${baseName}.htm (L3):`, err);
              missing.push(`${targetSubdir}/${baseName}.htm`);
            }
          } else if (fmt === 'docx') {
            try {
              const docxBlob = await buildDocxBlob(rawContent, baseName);
              const docxBuffer = await docxBlob.arrayBuffer();
              subFolder.file(`${baseName}.docx`, docxBuffer);
            } catch (err) {
              console.error(`[Task 11 Zip Error] Failed to add ${baseName}.docx (L3):`, err);
              missing.push(`${targetSubdir}/${baseName}.docx`);
            }
          } else if (fmt === 'rtf') {
            try {
              const rtfContent = buildRtfString(rawContent);
              subFolder.file(`${baseName}.rtf`, rtfContent);
            } catch (err) {
              console.error(`[Task 11 Zip Error] Failed to add ${baseName}.rtf (L3):`, err);
              missing.push(`${targetSubdir}/${baseName}.rtf`);
            }
          }
        }
      }
    }
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
  });
  return { blob, missing };
}

// Download zip archive helper
export async function downloadTask11Zip(rootDir: string, level: Difficulty, defaultSubdir: string, works: Work[]): Promise<void> {
  const { blob } = await buildTask11ZipBlob(rootDir, level, defaultSubdir, works);
  saveBlob(blob, `${rootDir}.zip`);
}

// Answer normalization helper (re-exported from universal utility)
import { normalizeAnswer } from '../utils/normalize';
export { normalizeAnswer };

function getAuthorGenitive(authorName: string): string {
  if (authorName.includes('Пушкин')) return 'А. С. Пушкина';
  if (authorName.includes('Гоголь')) return 'Н. В. Гоголя';
  if (authorName.includes('Чехов')) return 'А. П. Чехова';
  if (authorName.includes('Тургенев')) return 'И. С. Тургенева';
  return authorName;
}

export interface Task11Data {
  level: Difficulty;
  rootDir: string;
  author: string;
  authorGenitive: string;
  subdir: string;
  selectedWorks: Work[];
  targetWork: Work;
  questionType: 'phrase' | 'hook_detail' | 'relation' | 'role_action' | 'situation';
  expectedType: 'fullname';
  statement: string;
  clueDescription: string;
  questionTarget: string;
  targetCharacter: Character;
  acceptedAnswers: string[];
  explanation: {
    level: Difficulty;
    title: string;
    file: string;
    subdir: string;
    clue: string;
    charName: string;
    charRole: string;
    acceptedList: string[];
  };
  subtype?: 'A' | 'B';
}

function getObjectReference(word: string): string {
  const w = word.toLowerCase();
  const places = ['крепость', 'деревня', 'город', 'усадьба', 'площадь', 'кабак', 'склад', 'конюшня', 'церковь', 'поместье', 'марьино', 'жадрино', 'маниловка', 'сечь', 'никольское', 'ненарадово'];
  const items = ['тулуп', 'шпагу', 'картинки', 'капот', 'халат', 'бричка', 'кафтан', 'портсигар', 'лапотках', 'пальто', 'узелок', 'решетом', 'крыжовником', 'цигаркой', 'шинели'];

  if (places.some(p => w.includes(p))) {
    return 'этим местом';
  }
  if (items.some(i => w.includes(i))) {
    return 'этим предметом';
  }
  return 'этой деталью';
}

function isCharacterNameHook(hookWord: string, work: Work): { isNameHook: boolean; char?: Character; matchedField?: 'name' | 'surname' } {
  const normHook = normalizeAnswer(hookWord);
  for (const char of work.characters) {
    if (char.surname) {
      const normSur = normalizeAnswer(char.surname);
      if (
        normHook === normSur ||
        (normSur.length >= 4 && normHook.startsWith(normSur.slice(0, normSur.length - 1))) ||
        (normHook.length >= 4 && normSur.startsWith(normHook.slice(0, normHook.length - 1)))
      ) {
        return { isNameHook: true, char, matchedField: 'surname' };
      }
    }
    if (char.name) {
      const normName = normalizeAnswer(char.name);
      if (
        normHook === normName ||
        (normName.length >= 4 && normHook.startsWith(normName.slice(0, normName.length - 1)))
      ) {
        return { isNameHook: true, char, matchedField: 'name' };
      }
    }
  }
  return { isNameHook: false };
}

function getAcceptedSingleWordAnswers(char: Character, targetField: 'name' | 'surname' | 'any' = 'any'): string[] {
  const result: string[] = [];

  const addVariants = (word?: string) => {
    if (!word) return;
    const w = word.trim();
    if (w.includes(' ')) return; // single word only

    result.push(w);
    if (w.includes('ё')) {
      result.push(w.replace(/ё/g, 'е'));
    }
  };

  if (targetField === 'surname' || targetField === 'any') {
    addVariants(char.surname);
  }
  if (targetField === 'name' || targetField === 'any') {
    addVariants(char.name);
  }

  // Deduplicate using normalizeAnswer
  const seen = new Set<string>();
  const uniqueList: string[] = [];
  for (const item of result) {
    const norm = normalizeAnswer(item);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      uniqueList.push(item);
    }
  }

  return uniqueList;
}

function getTargetPromptAndField(char: Character): { prompt: string; field: 'name' | 'surname' | 'any' } {
  if (char.surname && !char.name) {
    return { prompt: 'фамилию этого героя', field: 'surname' };
  }
  if (char.name && !char.surname) {
    return { prompt: 'имя этого героя', field: 'name' };
  }
  return { prompt: 'имя или фамилию этого героя', field: 'any' };
}

function mergeRelationAcceptedAnswers(baseAnswers: string[], rel?: Relation | null): string[] {
  if (!rel?.acceptedAnswers || rel.acceptedAnswers.length === 0) {
    return baseAnswers;
  }
  return Array.from(new Set([...baseAnswers, ...rel.acceptedAnswers]));
}

function getRelationQuestionData(candWork: Work, rel: Relation, rootDir: string): {
  statement: string;
  targetChar: Character;
  targetPrompt: string;
  chosenClueText: string;
  acceptedAnswers: string[];
} | null {
  const fromChar = candWork.characters.find(c => c.id === rel.fromId);
  if (!fromChar) return null;

  let res: {
    statement: string;
    targetChar: Character;
    targetPrompt: string;
    chosenClueText: string;
    acceptedAnswers: string[];
  } | null = null;

  if (candWork.id === 'chehov_hameleon' && rel.fromId === 'vladimir') {
    const vladimir = candWork.characters.find(c => c.id === 'vladimir');
    if (!vladimir) return null;
    const targetPrompt = 'его имя';
    const statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, упоминается генерал Жигалов. Назовите брата генерала Жигалова. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;
    res = {
      statement,
      targetChar: vladimir,
      targetPrompt,
      chosenClueText: `связь: брат генерала Жигалова`,
      acceptedAnswers: getAcceptedSingleWordAnswers(vladimir, 'name')
    };
  } else if (candWork.id === 'chehov_loshadinaya_familiya' && rel.fromId === 'ivan_evseich') {
    const ivan = candWork.characters.find(c => c.id === 'ivan_evseich');
    if (!ivan) return null;
    const targetPrompt = 'имя или отчество этого героя';
    const statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, упоминается генерал-майор Булдеев. Назовите приказчика генерала Булдеева. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;
    res = {
      statement,
      targetChar: ivan,
      targetPrompt,
      chosenClueText: `связь: приказчик генерала Булдеева`,
      acceptedAnswers: getAcceptedSingleWordAnswers(ivan, 'any')
    };
  } else if (candWork.id === 'chehov_zloumyshlennik' && rel.fromId === 'denis') {
    const kuzmaChar: Character = {
      id: 'kuzma',
      name: 'Кузьма',
      surname: 'Григорьев',
      role: 'брат Дениса',
      acts: false
    };
    const targetPrompt = 'его имя';
    const statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, действует персонаж Денис Григорьев. Назовите брата персонажа Денис Григорьев. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;
    res = {
      statement,
      targetChar: kuzmaChar,
      targetPrompt,
      chosenClueText: `связь: брат Дениса Григорьева`,
      acceptedAnswers: ['Кузьма', 'Кузьму']
    };
  } else if (candWork.id === 'chehov_tolstyi_i_tonkiy') {
    if (rel.fromId === 'misha') {
      const porfiriy = candWork.characters.find(c => c.id === 'porfiriy');
      if (!porfiriy) return null;
      const targetPrompt = 'его имя';
      const statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, действует персонаж Миша (толстый). Назовите друга детства персонажа Миша. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;
      res = {
        statement,
        targetChar: porfiriy,
        targetPrompt,
        chosenClueText: `связь: друг детства персонажа Миша`,
        acceptedAnswers: getAcceptedSingleWordAnswers(porfiriy, 'name')
      };
    } else if (rel.fromId === 'porfiriy') {
      const misha = candWork.characters.find(c => c.id === 'misha');
      if (!misha) return null;
      const targetPrompt = 'его имя';
      const statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, действует персонаж Порфирий (тонкий). Назовите друга детства персонажа Порфирий. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;
      res = {
        statement,
        targetChar: misha,
        targetPrompt,
        chosenClueText: `связь: друг детства персонажа Порфирий`,
        acceptedAnswers: getAcceptedSingleWordAnswers(misha, 'name')
      };
    }
  }

  if (!res) {
    let targetChar = candWork.characters.find(c => c.id === rel.targetName || c.surname === rel.targetName || c.name === rel.targetName);
    if (!targetChar) {
      targetChar = candWork.characters.find(c => c.id === rel.fromId);
      if (!targetChar) return null;
    }
    const fromName = [fromChar.name, fromChar.surname].filter(Boolean).join(' ') || fromChar.role;
    const { prompt: targetPrompt, field: targetField } = getTargetPromptAndField(targetChar);
    const statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, упоминается персонаж ${fromName}. Назовите ${rel.kind} персонажа ${fromName}. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;
    res = {
      statement,
      targetChar,
      targetPrompt,
      chosenClueText: `связь: ${rel.kind} персонажа ${fromName}`,
      acceptedAnswers: getAcceptedSingleWordAnswers(targetChar, targetField)
    };
  }

  if (res) {
    return {
      ...res,
      acceptedAnswers: mergeRelationAcceptedAnswers(res.acceptedAnswers, rel)
    };
  }

  return null;
}

function getAboutIdQuestionData(candWork: Work, phrase: Phrase, rootDir: string): {
  statement: string;
  targetChar: Character;
  targetPrompt: string;
  chosenClueText: string;
  acceptedAnswers: string[];
} | null {
  if (!phrase.aboutId) return null;
  const speakerChar = candWork.characters.find(c => c.id === phrase.speakerId);
  const aboutChar = candWork.characters.find(c => c.id === phrase.aboutId);
  if (!aboutChar) return null;

  const speakerName = (speakerChar?.surname || speakerChar?.name)
    ? (speakerChar?.surname || speakerChar?.name)
    : (speakerChar?.role || 'герой');

  const { prompt: targetPrompt, field: targetField } = getTargetPromptAndField(aboutChar);

  const statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, персонаж ${speakerName} произносит реплику: «${phrase.quote}». О ком говорит персонаж ${speakerName}? С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;

  return {
    statement,
    targetChar: aboutChar,
    targetPrompt,
    chosenClueText: `реплика ${speakerName}: «${phrase.quote}»`,
    acceptedAnswers: getAcceptedSingleWordAnswers(aboutChar, targetField)
  };
}

function getSituationQuestionData(candWork: Work, sit: Situation, rootDir: string): {
  statement: string;
  targetChar: Character;
  targetPrompt: string;
  chosenClueText: string;
  acceptedAnswers: string[];
} | null {
  const char = candWork.characters.find(c => c.id === sit.answerId);
  if (!char) return null;

  const { prompt: targetPrompt, field: targetField } = getTargetPromptAndField(char);

  const statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, описана такая ситуация: «${sit.text}». Выберите из описания подходящее для поиска слово и выясните ${targetPrompt}.`;

  return {
    statement,
    targetChar: char,
    targetPrompt,
    chosenClueText: `описание ситуации: «${sit.text}»`,
    acceptedAnswers: getAcceptedSingleWordAnswers(char, targetField)
  };
}

function getLongPhraseQuestionData(candWork: Work, phrase: Phrase, rootDir: string): {
  statement: string;
  targetChar: Character;
  targetPrompt: string;
  chosenClueText: string;
  acceptedAnswers: string[];
} | null {
  if (phrase.quote.length < 60) return null;

  const speakerChar = candWork.characters.find(c => c.id === phrase.speakerId);
  if (!speakerChar || (!speakerChar.name && !speakerChar.surname)) return null;

  const answerWords = [speakerChar.name, speakerChar.surname].filter((w): w is string => !!w);
  if (answerWords.some(w => w.length >= 3 && phrase.quote.toLowerCase().includes(w.toLowerCase()))) {
    return null;
  }

  const { prompt: targetPrompt, field: targetField } = getTargetPromptAndField(speakerChar);
  const statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, один из героев произносит фразу: «${phrase.quote}». С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;

  return {
    statement,
    targetChar: speakerChar,
    targetPrompt,
    chosenClueText: `длинная цитата: «${phrase.quote}»`,
    acceptedAnswers: getAcceptedSingleWordAnswers(speakerChar, targetField)
  };
}

export function generateTask11Data(difficulty: Difficulty = 1, rng?: RNG): Task11Data {
  const seed = rng ? Math.floor(rng.next() * 0x100000000) : Math.floor(Math.random() * 0x100000000);
  const level: Difficulty = (difficulty === 2 || difficulty === 3) ? difficulty : 1;
  const rootDirOptions = ['DEMO-11', 'OGE_11', 'LITERATURA', 'PROSE_11'];
  const rootDir = rng ? rng.pick(rootDirOptions) : rootDirOptions[Math.floor(Math.random() * rootDirOptions.length)];

  // Exclude isStub works from selection pool
  const activeWorks = WORKS.filter(w => !w.isStub);
  const worksSource = activeWorks.length > 0 ? activeWorks : WORKS;

  const activeSubtype: 'A' | 'B' = (seed % 2 === 0) ? 'A' : 'B';

  let selectedWorks: Work[] = [];

  if (level === 1) {
    // L1: 1 author, 3-4 works (author with >= 3 works, or author with max works)
    const authors = Array.from(new Set(worksSource.map(w => w.author)));
    const eligibleAuthors = authors.filter(author => worksSource.filter(w => w.author === author).length >= 3);
    let chosenAuthor: string;
    if (eligibleAuthors.length > 0) {
      chosenAuthor = rng
        ? pickStable(eligibleAuthors, seed, 'task11:author', a => a)
        : eligibleAuthors[Math.floor(Math.random() * eligibleAuthors.length)];
    } else {
      const authorCounts = authors.map(author => ({ author, count: worksSource.filter(w => w.author === author).length }));
      authorCounts.sort((a, b) => b.count - a.count);
      chosenAuthor = authorCounts[0]?.author || authors[0];
    }
    const authorWorks = worksSource.filter(w => w.author === chosenAuthor);
    const numWorks = Math.min(authorWorks.length, rng ? rng.int(3, 4) : Math.floor(Math.random() * 2) + 3);
    selectedWorks = rng
      ? pickManyStable(authorWorks, seed, 'task11:works:L1', w => w.id, numWorks)
      : [...authorWorks].sort(() => Math.random() - 0.5).slice(0, numWorks);
  } else {
    // L2 / L3: Multiple authors (2-4 authors), 5-8 works
    const authors = Array.from(new Set(worksSource.map(w => w.author)));
    const numAuthors = Math.min(authors.length, level === 2 ? (rng ? rng.int(2, 3) : 2 + Math.floor(Math.random() * 2)) : (rng ? rng.int(3, 4) : 3 + Math.floor(Math.random() * 2)));
    const shuffledAuthors = rng
      ? pickManyStable(authors, seed, 'task11:authors', a => a, numAuthors)
      : [...authors].sort(() => Math.random() - 0.5).slice(0, numAuthors);

    const worksPool = worksSource.filter(w => shuffledAuthors.includes(w.author));
    const numWorks = Math.min(worksPool.length, rng ? rng.int(5, 8) : Math.floor(Math.random() * 4) + 5);
    selectedWorks = rng
      ? pickManyStable(worksPool, seed, `task11:works:L${level}`, w => w.id, numWorks)
      : [...worksPool].sort(() => Math.random() - 0.5).slice(0, numWorks);

    // Ensure at least 2 distinct authors in L2/L3
    const selectedAuthors = new Set(selectedWorks.map(w => w.author));
    if (selectedAuthors.size < 2 && worksSource.length > selectedWorks.length) {
      const otherWorks = worksSource.filter(w => !selectedAuthors.has(w.author));
      if (otherWorks.length > 0) {
        const otherWork = rng
          ? pickStable(otherWorks, seed, 'task11:extraWork', w => w.id)
          : otherWorks[Math.floor(Math.random() * otherWorks.length)];
        selectedWorks.push(otherWork);
      }
    }
  }

  // Candidate works shuffled by seed
  const candidateWorks = rng
    ? shuffleStable(selectedWorks, seed, `task11:candidates:L${level}`, w => w.id)
    : [...selectedWorks].sort(() => Math.random() - 0.5);

  let targetWork = candidateWorks[0];
  let questionType: 'phrase' | 'hook_detail' | 'relation' | 'role_action' | 'situation' = 'phrase';
  const expectedType: 'fullname' = 'fullname';
  let statement = '';
  let chosenClueText = '';
  let chosenTargetText = '';
  let targetChar: Character | undefined;
  let acceptedAnswers: string[] = [];
  let foundValid = false;

  if (level === 1) {
    // L1: Direct literal clues, asking about the figurehead.
    // Two subtypes: A (names subdir) and B (names only rootDir).
    for (const candWork of candidateWorks) {
      const authorGenitive = getAuthorGenitive(candWork.author);
      const locText = activeSubtype === 'A'
        ? `в подкаталоге ${candWork.subdir} каталога ${rootDir}`
        : `в каталоге ${rootDir}`;

      const availableTypesList: ('phrase' | 'hook_detail' | 'relation' | 'role_action')[] = [
        'phrase',
        'hook_detail',
        'relation',
        'role_action'
      ];
      const availableTypes = rng ? rng.shuffle(availableTypesList) : ([...availableTypesList].sort(() => Math.random() - 0.5) as any);

      for (const qType of availableTypes) {
        if (qType === 'phrase') {
          for (const phrase of candWork.phrases) {
            const char = candWork.characters.find(c => c.id === phrase.speakerId);
            if (char && char.acts !== false && (char.name || char.surname)) {
              const answerWords = [char.name, char.surname].filter((w): w is string => !!w);
              if (answerWords.some(w => w.length >= 3 && phrase.quote.toLowerCase().includes(w.toLowerCase()))) continue;

              targetWork = candWork;
              questionType = 'phrase';
              targetChar = char;
              chosenClueText = `фраза: «${phrase.quote}»`;

              const { prompt: targetPrompt, field: targetField } = getTargetPromptAndField(char);
              chosenTargetText = targetPrompt;

              statement = `В одном из произведений ${authorGenitive}, текст которого приведён ${locText}, один из героев произносит фразу: «${phrase.quote}». С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;

              acceptedAnswers = getAcceptedSingleWordAnswers(char, targetField);
              foundValid = true;
              break;
            }
          }
          if (foundValid) break;

        } else if (qType === 'hook_detail') {
          for (const hook of candWork.hooks) {
            const char = candWork.characters.find(c => c.id === hook.leadsTo);
            if (!char) continue;

            const nameCheck = isCharacterNameHook(hook.word, candWork);
            const isName = hook.isName === true || nameCheck.isNameHook;

            if (isName) {
              const matchedField = nameCheck.matchedField || (char.surname && normalizeAnswer(char.surname) === normalizeAnswer(hook.word) ? 'surname' : 'name');

              if (matchedField === 'surname') {
                if (char.name && !char.name.includes(' ') && normalizeAnswer(char.name) !== normalizeAnswer(hook.word)) {
                  targetWork = candWork;
                  questionType = 'hook_detail';
                  targetChar = char;
                  chosenClueText = `упоминание героя по фамилии «${hook.word}»`;
                  chosenTargetText = 'имя этого героя';
                  statement = `В одном из произведений ${authorGenitive}, текст которого приведён ${locText}, упоминается герой по фамилии ${hook.word}. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните имя этого героя.`;
                  acceptedAnswers = getAcceptedSingleWordAnswers(char, 'name');
                  foundValid = true;
                  break;
                }
              } else if (matchedField === 'name') {
                if (char.surname && !char.surname.includes(' ') && normalizeAnswer(char.surname) !== normalizeAnswer(hook.word)) {
                  targetWork = candWork;
                  questionType = 'hook_detail';
                  targetChar = char;
                  chosenClueText = `упоминание героя по имени «${hook.word}»`;
                  chosenTargetText = 'его фамилию';
                  statement = `В одном из произведений ${authorGenitive}, текст которого приведён ${locText}, упоминается герой по имени ${hook.word}. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните его фамилию.`;
                  acceptedAnswers = getAcceptedSingleWordAnswers(char, 'surname');
                  foundValid = true;
                  break;
                }
              }
            } else {
              if (char.name || char.surname) {
                const answerWords = [char.name, char.surname].filter((w): w is string => !!w);
                if (answerWords.some(w => w.length >= 3 && hook.word.toLowerCase().includes(w.toLowerCase()))) continue;

                targetWork = candWork;
                questionType = 'hook_detail';
                targetChar = char;
                chosenClueText = `слово/упоминание "${hook.word}"`;

                const objRef = getObjectReference(hook.word);
                let targetPrompt = `имя или фамилию героя, связанного с ${objRef}`;
                let targetField: 'name' | 'surname' | 'any' = 'any';
                if (char.surname && !char.name) {
                  targetPrompt = `фамилию героя, связанного с ${objRef}`;
                  targetField = 'surname';
                } else if (char.name && !char.surname) {
                  targetPrompt = `имя героя, связанного с ${objRef}`;
                  targetField = 'name';
                }
                chosenTargetText = targetPrompt;

                statement = `В одном из произведений ${authorGenitive}, текст которого приведён ${locText}, упоминается ${hook.word}. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;
                acceptedAnswers = getAcceptedSingleWordAnswers(char, targetField);
                foundValid = true;
                break;
              }
            }
          }
          if (foundValid) break;

        } else if (qType === 'relation') {
          for (const rel of candWork.relations) {
            const char = candWork.characters.find(c => c.id === rel.fromId);
            if (char && (char.name || char.surname)) {
              const answerWords = [char.name, char.surname].filter((w): w is string => !!w);
              const clueLower = `${rel.kind} ${rel.targetName}`.toLowerCase();
              if (answerWords.some(w => w.length >= 3 && clueLower.includes(w.toLowerCase()))) continue;

              targetWork = candWork;
              questionType = 'relation';
              targetChar = char;
              chosenClueText = `связь: ${rel.kind} — ${rel.targetName}`;

              const { prompt: targetPrompt, field: targetField } = getTargetPromptAndField(char);
              chosenTargetText = targetPrompt;

              statement = `В одном из произведений ${authorGenitive}, текст которого приведён ${locText}, упоминается персонаж, чья связь с другим героем описана так: ${rel.kind} — ${rel.targetName}. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;
              const baseAnswers = getAcceptedSingleWordAnswers(char, targetField);
              acceptedAnswers = mergeRelationAcceptedAnswers(baseAnswers, rel);
              foundValid = true;
              break;
            }
          }
          if (foundValid) break;

        } else if (qType === 'role_action') {
          const validActionChars = candWork.characters.filter(c => {
            if (c.acts === false) return false;
            if (!c.role || !c.action) return false;
            if (!c.name && !c.surname) return false;

            const answerWords = [c.name, c.surname].filter((w): w is string => !!w);
            const clueLower = `${c.role} ${c.action}`.toLowerCase();
            if (answerWords.some(w => w.length >= 3 && clueLower.includes(w.toLowerCase()))) {
              return false;
            }
            return true;
          });

          if (validActionChars.length > 0) {
            const char = rng
              ? pickStable(validActionChars, seed, `task11:actionChar:${candWork.id}`, c => c.id)
              : validActionChars[Math.floor(Math.random() * validActionChars.length)];
            targetWork = candWork;
            questionType = 'role_action';
            targetChar = char;

            const { prompt: targetPrompt, field: targetField } = getTargetPromptAndField(char);
            const roleCap = char.role.charAt(0).toUpperCase() + char.role.slice(1);
            chosenClueText = `${roleCap} ${char.action}`;
            chosenTargetText = targetPrompt;

            statement = `В одном из произведений ${authorGenitive}, текст которого приведён ${locText}, ${roleCap} ${char.action}. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните ${targetPrompt}.`;
            acceptedAnswers = getAcceptedSingleWordAnswers(char, targetField);
            foundValid = true;
            break;
          }
        }
      }
      if (foundValid) break;
    }

  } else if (level === 2) {
    // L2: Literal clue, subdirectory is NEVER named.
    // Asks about a related character (via aboutId for phrase, or relations for relation).
    for (const candWork of candidateWorks) {
      const availableTypesList: ('phrase' | 'relation')[] = ['phrase', 'relation'];
      const availableTypes = rng ? rng.shuffle(availableTypesList) : ([...availableTypesList].sort(() => Math.random() - 0.5) as any);

      for (const qType of availableTypes) {
        if (qType === 'phrase') {
          const phrasesWithAbout = candWork.phrases.filter(p => !!p.aboutId);
          if (phrasesWithAbout.length === 0) continue; // If no aboutId, do not issue phrase on L2

          const phrase = rng
            ? pickStable(phrasesWithAbout, seed, `task11:L2phrase:${candWork.id}`, p => p.quote)
            : phrasesWithAbout[0];

          const data = getAboutIdQuestionData(candWork, phrase, rootDir);
          if (data) {
            targetWork = candWork;
            questionType = 'phrase';
            targetChar = data.targetChar;
            statement = data.statement;
            chosenClueText = data.chosenClueText;
            chosenTargetText = data.targetPrompt;
            acceptedAnswers = data.acceptedAnswers;
            foundValid = true;
            break;
          }
        } else if (qType === 'relation') {
          if (candWork.relations.length === 0) continue; // If no relation, do not issue relation on L2

          const rel = rng
            ? pickStable(candWork.relations, seed, `task11:L2rel:${candWork.id}`, r => `${r.fromId}-${r.targetName}`)
            : candWork.relations[0];

          const data = getRelationQuestionData(candWork, rel, rootDir);
          if (data) {
            targetWork = candWork;
            questionType = 'relation';
            targetChar = data.targetChar;
            statement = data.statement;
            chosenClueText = data.chosenClueText;
            chosenTargetText = data.targetPrompt;
            acceptedAnswers = data.acceptedAnswers;
            foundValid = true;
            break;
          }
        }
      }
      if (foundValid) break;
    }

  } else {
    // L3: Subdirectory is NEVER named.
    // Two subtypes: A (situation) and B (long phrase >= 60 chars).
    const l3EligibleWorks = candidateWorks.filter(w => (w.situations && w.situations.length > 0) || w.phrases.some(p => p.quote.length >= 60));
    const worksToTry = l3EligibleWorks.length > 0 ? l3EligibleWorks : candidateWorks;

    const subtypesToTry: ('A' | 'B')[] = activeSubtype === 'A' ? ['A', 'B'] : ['B', 'A'];

    for (const sub of subtypesToTry) {
      if (sub === 'A') {
        for (const candWork of worksToTry) {
          if (!candWork.situations || candWork.situations.length === 0) continue;
          const sit = rng
            ? pickStable(candWork.situations, seed, `task11:L3sit:${candWork.id}`, s => s.id)
            : candWork.situations[0];
          const data = getSituationQuestionData(candWork, sit, rootDir);
          if (data) {
            targetWork = candWork;
            questionType = 'situation';
            targetChar = data.targetChar;
            statement = data.statement;
            chosenClueText = data.chosenClueText;
            chosenTargetText = data.targetPrompt;
            acceptedAnswers = data.acceptedAnswers;
            foundValid = true;
            break;
          }
        }
      } else {
        for (const candWork of worksToTry) {
          const longPhrases = candWork.phrases.filter(p => p.quote.length >= 60);
          if (longPhrases.length === 0) continue;
          const phrase = rng
            ? pickStable(longPhrases, seed, `task11:L3longPhrase:${candWork.id}`, p => p.quote)
            : longPhrases[0];
          const data = getLongPhraseQuestionData(candWork, phrase, rootDir);
          if (data) {
            targetWork = candWork;
            questionType = 'phrase';
            targetChar = data.targetChar;
            statement = data.statement;
            chosenClueText = data.chosenClueText;
            chosenTargetText = data.targetPrompt;
            acceptedAnswers = data.acceptedAnswers;
            foundValid = true;
            break;
          }
        }
      }
      if (foundValid) break;
    }
  }

  // Fallback if no specific condition matched
  if (!targetChar) {
    targetWork = candidateWorks[0];
    if (level === 1) {
      targetChar = targetWork.characters[0] || { id: 'ochumelov', surname: 'Очумелов', role: 'полицейский надзиратель', action: 'проводит разбирательство из-за укушенного пальца', acts: true };
      const authorGenitive = getAuthorGenitive(targetWork.author);
      questionType = 'role_action';
      const roleCap = targetChar.role.charAt(0).toUpperCase() + targetChar.role.slice(1);
      const actionText = targetChar.action || 'проводит разбирательство из-за укушенного пальца';
      chosenClueText = `${roleCap} ${actionText}`;
      chosenTargetText = 'его фамилию';
      const locationText = activeSubtype === 'A'
        ? `в подкаталоге ${targetWork.subdir} каталога ${rootDir}`
        : `в каталоге ${rootDir}`;
      statement = `В одном из произведений ${authorGenitive}, текст которого приведён ${locationText}, ${roleCap} ${actionText}. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните его фамилию.`;
      acceptedAnswers = getAcceptedSingleWordAnswers(targetChar, 'surname');
    } else if (level === 2) {
      let resolved = false;
      for (const w of candidateWorks) {
        const phraseWithAbout = w.phrases.find(p => !!p.aboutId);
        if (phraseWithAbout) {
          const data = getAboutIdQuestionData(w, phraseWithAbout, rootDir);
          if (data) {
            targetWork = w;
            targetChar = data.targetChar;
            questionType = 'phrase';
            statement = data.statement;
            chosenClueText = data.chosenClueText;
            chosenTargetText = data.targetPrompt;
            acceptedAnswers = data.acceptedAnswers;
            resolved = true;
            break;
          }
        }
        if (w.relations.length > 0) {
          const data = getRelationQuestionData(w, w.relations[0], rootDir);
          if (data) {
            targetWork = w;
            targetChar = data.targetChar;
            questionType = 'relation';
            statement = data.statement;
            chosenClueText = data.chosenClueText;
            chosenTargetText = data.targetPrompt;
            acceptedAnswers = data.acceptedAnswers;
            resolved = true;
            break;
          }
        }
      }
      if (!resolved) {
        targetChar = targetWork.characters[0];
        questionType = 'relation';
        statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, упоминается персонаж ${targetChar.surname || targetChar.name}. С помощью поисковых средств операционной системы и текстового редактора или браузера выясните его фамилию.`;
        acceptedAnswers = getAcceptedSingleWordAnswers(targetChar, 'surname');
      }
    } else {
      let resolved = false;
      for (const w of candidateWorks) {
        if (w.situations && w.situations.length > 0) {
          const sit = w.situations[0];
          const data = getSituationQuestionData(w, sit, rootDir);
          if (data) {
            targetWork = w;
            targetChar = data.targetChar;
            questionType = 'situation';
            statement = data.statement;
            chosenClueText = data.chosenClueText;
            chosenTargetText = data.targetPrompt;
            acceptedAnswers = data.acceptedAnswers;
            resolved = true;
            break;
          }
        }
      }
      if (!resolved) {
        targetChar = targetWork.characters[0];
        questionType = 'situation';
        statement = `В одном из произведений, тексты которых приведены в каталоге ${rootDir}, описана ключевая ситуация сюжета. Выберите подходящее для поиска слово и выясните фамилию главного героя.`;
        acceptedAnswers = getAcceptedSingleWordAnswers(targetChar, 'surname');
      }
    }
  }

  const resolvedChar: Character = targetChar || targetWork.characters[0] || {
    id: 'default_char',
    surname: 'Герой',
    role: 'герой'
  };

  return {
    level,
    rootDir,
    author: targetWork.author,
    authorGenitive: getAuthorGenitive(targetWork.author),
    subdir: (level === 1 && activeSubtype === 'B') ? '' : targetWork.subdir,
    selectedWorks,
    targetWork,
    questionType,
    expectedType,
    statement,
    clueDescription: chosenClueText,
    questionTarget: chosenTargetText,
    targetCharacter: resolvedChar,
    acceptedAnswers,
    subtype: level === 1 || level === 3 ? activeSubtype : undefined,
    explanation: {
      level,
      title: targetWork.title,
      file: targetWork.displayName || targetWork.file,
      subdir: targetWork.subdir,
      clue: chosenClueText,
      charName: [resolvedChar.name, resolvedChar.surname].filter(Boolean).join(' '),
      charRole: resolvedChar.role,
      acceptedList: acceptedAnswers
    }
  };
}

interface Task11ViewProps {
  taskData: Task11Data;
  state: TaskModuleState;
}

const Task11View: React.FC<Task11ViewProps> = ({ taskData, state }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [missingFiles, setMissingFiles] = useState<string[]>([]);

  const numLevel: Difficulty = (
    typeof taskData.level === 'number'
      ? taskData.level
      : parseInt(String(taskData.level).replace(/\D/g, ''), 10) || 1
  ) as Difficulty;

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setMissingFiles([]);
      const { blob, missing } = await buildTask11ZipBlob(
        taskData.rootDir,
        numLevel,
        taskData.subdir,
        taskData.selectedWorks
      );
      saveBlob(blob, `${taskData.rootDir}.zip`);
      if (missing.length > 0) {
        setMissingFiles(missing);
      }
    } catch (err) {
      console.error('Failed to download zip:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const isCorrect = state.isSubmitted ? task11.check(taskData, state.userAnswer) : undefined;

  return (
    <div className="space-y-4">
      {/* Task statement box */}
      <StatementBlock>
        <StatementText>
          {taskData.statement}
        </StatementText>

        {/* Download button */}
        <div className="pt-1">
          <ActionButton
            onClick={handleDownload}
            disabled={isDownloading}
            icon={<FolderArchive className="w-4 h-4" />}
          >
            <span>{isDownloading ? 'Формирование архива…' : `Скачать архив (${taskData.rootDir}.zip)`}</span>
            <Download className="w-4 h-4 ml-1 opacity-80" />
          </ActionButton>
          {missingFiles.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-sm">
              <p className="font-semibold">Внимание: не удалось загрузить следующие файлы (архив сформирован без них):</p>
              <ul className="list-disc list-inside mt-1 text-xs space-y-0.5">
                {missingFiles.map((file, idx) => (
                  <li key={idx}>{file}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-theme-text-muted mt-2">
            {numLevel === 1
              ? 'Архив содержит файлы произведений в корне и только в формате .txt.'
              : numLevel === 2
              ? 'Архив содержит подкаталоги по авторам с файлами в форматах .txt, .htm и .docx.'
              : 'Архив содержит подкаталоги по авторам с файлами в форматах .txt, .htm, .docx и .rtf.'}
          </p>
        </div>
      </StatementBlock>

      {/* Answer input form */}
      <AnswerField
        label="Ответ (одно слово — имя или фамилия героя):"
        value={state.userAnswer}
        onChange={(val) => state.setUserAnswer(val)}
        disabled={state.isSubmitted}
        placeholder="Например: Очумелов или Гринев"
      />

      {state.isSubmitted && (
        <VerdictBox status={isCorrect ? 'correct' : 'wrong'}>
          {isCorrect ? (
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
                Допустимые ответы:{' '}
                {taskData.explanation.acceptedList.map((a, i) => (
                  <React.Fragment key={a}>
                    {i > 0 && ', '}
                    <AnswerChip>{a}</AnswerChip>
                  </React.Fragment>
                ))}
              </p>
            </div>
          )}
        </VerdictBox>
      )}

      {/* Hint section (shown before submission when requested) */}
      {state.showHints && !state.isSubmitted && (
        <HintBox>
          <strong className="block font-bold text-sm mb-1.5">💡 Подсказка:</strong>
          <p className="text-sm leading-relaxed">
            {numLevel === 1 && (
              <>Скачайте и распакуйте архив. Перейдите в каталог <code className="bg-theme-bg/80 px-1 py-0.5 rounded border border-theme-border">/{taskData.rootDir}/</code>. Откройте по очереди файлы произведения. В каждом файле нажмите <kbd className="px-1.5 py-0.5 bg-theme-bg border border-theme-border rounded text-xs font-mono">Ctrl+F</kbd> и введите ключевое слово или фразу из условия. Найдя нужный фрагмент, определите искомого персонажа.</>
            )}
            {numLevel === 2 && (
              <>Скачайте и распакуйте архив. Найдите подкаталог нужного автора <code className="bg-theme-bg/80 px-1 py-0.5 rounded border border-theme-border">/{taskData.rootDir}/{taskData.subdir}/</code>. Откройте находящиеся в нём файлы (в формате .txt, .htm или .docx). Нажмите <kbd className="px-1.5 py-0.5 bg-theme-bg border border-theme-border rounded text-xs font-mono">Ctrl+F</kbd> и введите ключевое слово. Определите имя или фамилию персонажа.</>
            )}
            {numLevel === 3 && (
              <>Скачайте и распакуйте архив. Поскольку автор в условии не указан, воспользуйтесь сквозным поиском по всем подкаталогам архива <code className="bg-theme-bg/80 px-1 py-0.5 rounded border border-theme-border">/{taskData.rootDir}/</code> с помощью проводника Windows / системы или откройте файлы из подкаталогов по очереди (в форматах .txt, .htm, .docx, .rtf). Введите ключевую зацепку — она встречается ровно в одном произведении архива.</>
            )}
          </p>
        </HintBox>
      )}

      {/* Explanation section (shown only after submission / showing answer) */}
      {state.isSubmitted && (
        <SubBlock className="space-y-3">
          <strong className="block font-extrabold text-base text-theme-text">
            📖 Разбор решения (Уровень L{numLevel})
          </strong>
          <div className="space-y-2 text-sm text-theme-text leading-relaxed">
            <p>
              1. Скачайте и распакуйте архив <code className="bg-theme-input-bg border border-theme-border px-1.5 py-0.5 rounded text-theme-text">{taskData.rootDir}.zip</code>.
            </p>
            {numLevel === 1 ? (
              <p>
                2. Перейдите в корневой каталог архива <code className="bg-theme-input-bg border border-theme-border px-1.5 py-0.5 rounded text-theme-text">/{taskData.rootDir}/</code>.
              </p>
            ) : numLevel === 2 ? (
              <p>
                2. Перейдите в подкаталог автора <code className="bg-theme-input-bg border border-theme-border px-1.5 py-0.5 rounded text-theme-text">/{taskData.rootDir}/{taskData.subdir}/</code>.
              </p>
            ) : (
              <p>
                2. В условии L3 автор не указан. Выполните поиск по содержимому всех подкаталогов в <code className="bg-theme-input-bg border border-theme-border px-1.5 py-0.5 rounded text-theme-text">/{taskData.rootDir}/</code> (или проверьте файлы по очереди).
              </p>
            )}
            <p>
              3. Воспользуйтесь поиском по файлам (<kbd className="px-1.5 py-0.5 bg-theme-bg border border-theme-border rounded text-xs font-mono">Ctrl+F</kbd> в текстовом редакторе или браузере).
            </p>
            <p>
              4. По зацепке «<strong className="text-theme-text font-bold">{taskData.clueDescription}</strong>» находим единственный подходящий файл:
              <br />
              <span className="inline-flex items-center gap-1.5 mt-1 font-semibold text-blue-600 dark:text-blue-400">
                <FileText className="w-4 h-4" /> «{taskData.explanation.title}»
                {numLevel > 1 && ` (подкаталог /${taskData.explanation.subdir}/, файл ${taskData.explanation.file})`}
                {numLevel === 1 && ` (файл ${taskData.explanation.file})`}
              </span>
            </p>
            <p>
              5. Искомый персонаж: <strong className="font-bold text-theme-text">{taskData.explanation.charName}</strong> ({taskData.explanation.charRole}).
            </p>
            <p className="pt-1 text-xs text-theme-text-muted">
              Допустимые варианты ответа: {taskData.explanation.acceptedList.map(a => `«${a}»`).join(', ')}.
            </p>
          </div>
        </SubBlock>
      )}
    </div>
  );
};

export const task11: TaskModule = {
  id: 11,
  title: 'Поиск информации в файлах и каталогах',
  description: 'Поиск слова или имени персонажа в текстах произведений.',
  topics: ['Поиск информации в файлах', 'Текстовый поиск'], // TODO: уточнить формулировки
  maxPoints: 1,

  generate: (difficulty: Difficulty, rng: RNG): Task11Data => {
    return generateTask11Data(difficulty, rng);
  },

  render: (taskData: Task11Data, state: TaskModuleState) => {
    return <Task11View taskData={taskData} state={state} />;
  },

  check: (taskData: Task11Data, userAnswer: string): boolean => {
    if (!userAnswer) return false;
    const trimmed = userAnswer.trim();
    // Answer must be a single word without spaces
    if (trimmed.includes(' ') || trimmed.includes('\t') || trimmed.includes('\n')) {
      return false;
    }
    const normUser = normalizeAnswer(trimmed);
    if (!normUser) return false;

    return taskData.acceptedAnswers.some(ans => normalizeAnswer(ans) === normUser);
  }
};

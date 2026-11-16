import React, { useState } from 'react';
import { Download, FolderArchive, FolderTree } from 'lucide-react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { RNG } from '../utils/rng';
import { saveBlob } from '../utils/download';
import {
  StatementBlock,
  StatementText,
  SubBlock,
  BlockLabel,
  DataTable,
  Th,
  Td,
  AnswerField,
  AnswerChip,
  ActionButton,
  VerdictBox,
  HintBox,
} from '../components/task-ui';

export interface FileNode {
  name: string;        // e.g. "rasskaz_01"
  ext: string;         // e.g. "txt", "html", "htm", "pdf", "png", "jpg", "jpeg"
  fullName: string;    // e.g. "rasskaz_01.txt"
  sizeBytes: number;   // size in bytes
  genre: string;       // e.g. "Проза"
  author: string;      // e.g. "Чехов"
  relPath: string;     // e.g. "Проза/Чехов/rasskaz_01.txt"
}

export interface SubdirSummary {
  path: string;        // e.g. "Проза/Чехов"
  genre: string;
  author: string;
  totalFiles: number;
  matchingFiles: number;
  ext1MatchingFiles?: number;
  ext2MatchingFiles?: number;
}

export interface Task12Data {
  level: Difficulty;
  rootDir: string;
  files: FileNode[];
  statement: string;
  correctAnswer: string;
  questionType: string;
  criteriaDesc: string;
  hintText: string;
  explanationSteps: string[];
  subdirSummaries: SubdirSummary[];
  extensionsInfo?: {
    ext1: string;
    ext2: string;
  };
}

export async function buildTask12ZipBlob(rootDir: string, files: FileNode[]): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const rootFolder = zip.folder(rootDir) || zip;

  for (const file of files) {
    const genreFolder = rootFolder.folder(file.genre) || rootFolder;
    const authorFolder = genreFolder.folder(file.author) || genreFolder;
    const buffer = new Uint8Array(file.sizeBytes);
    authorFolder.file(file.fullName, buffer);
  }

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
  });
}

export async function downloadTask12Zip(rootDir: string, files: FileNode[]): Promise<void> {
  const blob = await buildTask12ZipBlob(rootDir, files);
  saveBlob(blob, `${rootDir}.zip`);
}

const ROOT_DIRS_POOL = ['DEMO-12', 'OGE_12', 'PROSE_12', 'LITERATURA_12', 'POETRY_12', 'ARCHIVE_12'];

const GENRE_AUTHORS: Record<string, string[]> = {
  'Проза': ['Чехов', 'Гоголь', 'Достоевский', 'Тургенев'],
  'Поэзия': ['Пушкин', 'Блок', 'Есенин', 'Лермонтов'],
  'Драма': ['Островский', 'Грибоедов', 'Булгаков', 'Сухово-Кобылин'],
};

const EXTENSIONS = ['txt', 'html', 'htm', 'pdf', 'png', 'jpg', 'jpeg'];

const NAME_TEMPLATES = [
  'rasskaz', 'povest', 'glava', 'stihotvorenie', 'pismo', 'zametka',
  'konspekt', 'otryvok', 'tekst', 'dnevnik', 'statias', 'otchet', 'fraza',
  'izdanie', 'tom_sobranij', 'monografiya', 'kniga', 'sbornik', 'almanah',
  'broshura', 'uchebnik', 'rukopis', 'tom_1', 'tom_2', 'sochineniya',
  'illustration', 'portret', 'risunok', 'skan', 'foto', 'gravyura', 'oblozhka'
];

function getRandomInt(min: number, max: number, rng: RNG): number {
  return rng.int(min, max);
}

function getRandomItem<T>(arr: T[], rng: RNG): T {
  return rng.pick(arr);
}

function getRandomItems<T>(arr: T[], count: number, rng: RNG): T[] {
  return rng.shuffle(arr).slice(0, Math.min(count, arr.length));
}

function generateTask12Data(difficulty: Difficulty = 1, rng: RNG): Task12Data {
  const level: Difficulty = (difficulty === 2 || difficulty === 3) ? difficulty : 1;
  const rootDir = getRandomItem(ROOT_DIRS_POOL, rng);

  // Pick 2 or 3 genres
  const availableGenres = Object.keys(GENRE_AUTHORS);
  const selectedGenres = getRandomItems(availableGenres, getRandomInt(2, 3, rng), rng);

  // Build list of (genre, author) pairs
  const subdirsList: { genre: string; author: string; path: string }[] = [];
  for (const genre of selectedGenres) {
    const authors = getRandomItems(GENRE_AUTHORS[genre], getRandomInt(2, 3, rng), rng);
    for (const author of authors) {
      subdirsList.push({
        genre,
        author,
        path: `${genre}/${author}`
      });
    }
  }

  const files: FileNode[] = [];
  let statement = '';
  let criteriaDesc = '';
  let hintText = '';
  let explanationSteps: string[] = [];
  let matchingFilter: (f: FileNode) => boolean = () => false;
  let ext1Filter: ((f: FileNode) => boolean) | undefined = undefined;
  let ext2Filter: ((f: FileNode) => boolean) | undefined = undefined;
  let extensionsInfo: { ext1: string; ext2: string } | undefined = undefined;

  if (level === 1) {
    // L1: One criterion (single extension)
    const variant = getRandomInt(1, 3, rng);
    const extTarget = getRandomItem(EXTENSIONS, rng);

    if (variant === 1) {
      // V1: All subfolders
      statement = `Сколько файлов с расширением .${extTarget} содержится в каталоге ${rootDir} и всех его подкаталогах? В ответе укажите только число.`;
      criteriaDesc = `файлы с расширением .${extTarget} во всех подкаталогах каталога ${rootDir}`;
      hintText = `В поиске Проводника для папки /${rootDir}/ введите маску *.${extTarget}. Посчитайте общее количество найденных файлов в строке состояния.`;

      matchingFilter = (f) => f.ext.toLowerCase() === extTarget.toLowerCase();

      explanationSteps = [
        `1. Откройте корневую папку /${rootDir}/.`,
        `2. В поле поиска введите *.${extTarget} (без учёта регистра, но строго для расширения .${extTarget}).`,
        `3. Проводник найдёт все подходящие файлы во всех вложенных папках.`
      ];
    } else if (variant === 2) {
      // V2: Single author folder
      const targetSub = getRandomItem(subdirsList, rng);
      statement = `Сколько файлов с расширением .${extTarget} содержится в подкаталоге ${rootDir}/${targetSub.genre}/${targetSub.author}? В ответе укажите только число.`;
      criteriaDesc = `файлы с расширением .${extTarget} только в подкаталоге /${rootDir}/${targetSub.genre}/${targetSub.author}/`;
      hintText = `Перейдите именно в папку /${rootDir}/${targetSub.genre}/${targetSub.author}/. Введите в поиске *.${extTarget} и посчитайте файлы в этой конкретной папке.`;

      matchingFilter = (f) => f.genre === targetSub.genre && f.author === targetSub.author && f.ext.toLowerCase() === extTarget.toLowerCase();

      explanationSteps = [
        `1. Перейдите строго в папку /${rootDir}/${targetSub.genre}/${targetSub.author}/.`,
        `2. Введите в поиске *.${extTarget}. Файлы с расширением .${extTarget} из других папок и авторов не учитываются.`
      ];
    } else {
      // V3: Multiple authors in a single genre
      const targetGenre = getRandomItem(selectedGenres, rng);
      const genreSubdirs = subdirsList.filter(s => s.genre === targetGenre);
      const chosenAuthors = getRandomItems(genreSubdirs.map(s => s.author), Math.min(2, genreSubdirs.length), rng);
      const authorsStr = chosenAuthors.join(' и ');

      statement = `Сколько файлов с расширением .${extTarget} содержится в подкаталогах ${authorsStr} каталога ${rootDir}/${targetGenre}? В ответе укажите только число.`;
      criteriaDesc = `файлы с расширением .${extTarget} в подкаталогах (${chosenAuthors.map(a => `${targetGenre}/${a}`).join(', ')})`;
      hintText = `Откройте подкаталоги ${chosenAuthors.join(', ')} в папке /${rootDir}/${targetGenre}/, посчитайте файлы *.${extTarget} в каждом из них и сложите полученные значения.`;

      matchingFilter = (f) => f.genre === targetGenre && chosenAuthors.includes(f.author) && f.ext.toLowerCase() === extTarget.toLowerCase();

      explanationSteps = [
        `1. Откройте папку /${rootDir}/${targetGenre}/.`,
        `2. Найдите файлы *.${extTarget} отдельно для подкаталогов: ${chosenAuthors.map(a => `/${targetGenre}/${a}/`).join(', ')}.`,
        `3. Сложите количество файлов из этих подкаталогов.`
      ];
    }

    // Populate files for L1
    for (const sub of subdirsList) {
      const isTargetFolder = (variant === 1) ||
        (variant === 2 && matchingFilter({ name: 'test', ext: extTarget, fullName: `test.${extTarget}`, sizeBytes: 1000, genre: sub.genre, author: sub.author, relPath: `${sub.path}/test.${extTarget}` })) ||
        (variant === 3 && matchingFilter({ name: 'test', ext: extTarget, fullName: `test.${extTarget}`, sizeBytes: 1000, genre: sub.genre, author: sub.author, relPath: `${sub.path}/test.${extTarget}` }));

      const targetCount = isTargetFolder ? getRandomInt(3, 7, rng) : getRandomInt(2, 5, rng);
      for (let i = 1; i <= targetCount; i++) {
        const nameBase = `${getRandomItem(NAME_TEMPLATES, rng)}_${String(i).padStart(2, '0')}`;
        const sizeBytes = getRandomInt(1024, 50 * 1024, rng);
        files.push({
          name: nameBase,
          ext: extTarget,
          fullName: `${nameBase}.${extTarget}`,
          sizeBytes,
          genre: sub.genre,
          author: sub.author,
          relPath: `${sub.path}/${nameBase}.${extTarget}`
        });
      }

      // Generate noise files including twin extensions
      const noiseExts = EXTENSIONS.filter(e => e !== extTarget);
      const noiseCount = getRandomInt(5, 9, rng);
      for (let i = 1; i <= noiseCount; i++) {
        const noiseExt = getRandomItem(noiseExts, rng);
        const nameBase = `item_${getRandomItem(NAME_TEMPLATES, rng)}_${String(i).padStart(2, '0')}`;
        const sizeBytes = getRandomInt(500, 64 * 1024, rng);
        files.push({
          name: nameBase,
          ext: noiseExt,
          fullName: `${nameBase}.${noiseExt}`,
          sizeBytes,
          genre: sub.genre,
          author: sub.author,
          relPath: `${sub.path}/${noiseExt}`
        });
      }
    }

  } else if (level === 2) {
    // L2: Two extensions
    const isOrVariant = rng.next() < 0.5;
    let ext1 = '';
    let ext2 = '';

    if (isOrVariant) {
      // Variant A: Two extensions across all subfolders
      const pickedExts = getRandomItems(EXTENSIONS, 2, rng);
      ext1 = pickedExts[0];
      ext2 = pickedExts[1];

      statement = `Сколько файлов с расширением .${ext1} или .${ext2} содержится в каталоге ${rootDir} и всех его подкаталогах? В ответе укажите только число.`;
      criteriaDesc = `файлы с расширением .${ext1} или .${ext2} во всех подкаталогах каталога ${rootDir}`;
      hintText = `Посчитайте файлы по маске *.${ext1}, затем по маске *.${ext2}, и сложите эти числа. Обратите внимание: .htm и .html, а также .jpg и .jpeg — это разные расширения!`;

      ext1Filter = (f) => f.ext.toLowerCase() === ext1.toLowerCase();
      ext2Filter = (f) => f.ext.toLowerCase() === ext2.toLowerCase();
      matchingFilter = (f) => ext1Filter!(f) || ext2Filter!(f);

      explanationSteps = [
        `1. В папке /${rootDir}/ выполните поиск по маске *.${ext1}.`,
        `2. Затем выполните поиск по маске *.${ext2}.`,
        `3. Сложите количества найденных файлов обеих категорий (учитывая, что расширения .${ext1} и .${ext2} различаются).`
      ];

      for (const sub of subdirsList) {
        // ext1 files
        const count1 = getRandomInt(2, 5, rng);
        for (let i = 1; i <= count1; i++) {
          const nameBase = `doc1_${getRandomItem(NAME_TEMPLATES, rng)}_${String(i).padStart(2, '0')}`;
          const sizeBytes = getRandomInt(1024, 40 * 1024, rng);
          files.push({
            name: nameBase, ext: ext1, fullName: `${nameBase}.${ext1}`,
            sizeBytes, genre: sub.genre, author: sub.author, relPath: `${sub.path}/${nameBase}.${ext1}`
          });
        }
        // ext2 files
        const count2 = getRandomInt(2, 5, rng);
        for (let i = 1; i <= count2; i++) {
          const nameBase = `doc2_${getRandomItem(NAME_TEMPLATES, rng)}_${String(i).padStart(2, '0')}`;
          const sizeBytes = getRandomInt(1024, 40 * 1024, rng);
          files.push({
            name: nameBase, ext: ext2, fullName: `${nameBase}.${ext2}`,
            sizeBytes, genre: sub.genre, author: sub.author, relPath: `${sub.path}/${nameBase}.${ext2}`
          });
        }
        // noise files
        const noiseExts = EXTENSIONS.filter(e => e !== ext1 && e !== ext2);
        const noiseCount = getRandomInt(4, 7, rng);
        for (let i = 1; i <= noiseCount; i++) {
          const noiseExt = getRandomItem(noiseExts, rng);
          const nameBase = `noise_${getRandomItem(NAME_TEMPLATES, rng)}_${String(i).padStart(2, '0')}`;
          const sizeBytes = getRandomInt(500, 50 * 1024, rng);
          files.push({
            name: nameBase, ext: noiseExt, fullName: `${nameBase}.${noiseExt}`,
            sizeBytes, genre: sub.genre, author: sub.author, relPath: `${sub.path}/${nameBase}.${noiseExt}`
          });
        }
      }

    } else {
      // Variant B: Two extensions in different sets of subdirectories/genres
      ext1 = getRandomItem(['txt', 'html', 'pdf', 'png', 'jpg'], rng);
      ext2 = getRandomItem(EXTENSIONS.filter(e => e !== ext1), rng);

      const sub1 = subdirsList[0];
      const remainingSubs = subdirsList.slice(1);
      const chosenSub2List = getRandomItems(remainingSubs, Math.min(2, remainingSubs.length), rng);

      const path1Str = `${rootDir}/${sub1.genre}/${sub1.author}`;
      const path2Str = chosenSub2List.map(s => `${rootDir}/${s.genre}/${s.author}`).join(' и ');

      statement = `Сколько всего файлов с расширением .${ext1} в подкаталоге ${path1Str} и с расширением .${ext2} в подкаталогах ${path2Str}? В ответе укажите только число.`;
      criteriaDesc = `файлы .${ext1} в /${path1Str}/ и файлы .${ext2} в (${chosenSub2List.map(s => `/${s.path}/`).join(', ')})`;
      hintText = `Посчитайте файлы .${ext1} только в папке /${path1Str}/. Затем посчитайте файлы .${ext2} в папках (${chosenSub2List.map(s => s.path).join(', ')}). Сложите полученные результаты.`;

      ext1Filter = (f: FileNode) => f.genre === sub1.genre && f.author === sub1.author && f.ext.toLowerCase() === ext1.toLowerCase();
      ext2Filter = (f: FileNode) => chosenSub2List.some(s => s.genre === f.genre && s.author === f.author) && f.ext.toLowerCase() === ext2.toLowerCase();

      matchingFilter = (f) => ext1Filter!(f) || ext2Filter!(f);

      explanationSteps = [
        `1. В папке /${path1Str}/ посчитайте файлы с расширением .${ext1}.`,
        `2. В папках ${chosenSub2List.map(s => `/${rootDir}/${s.path}/`).join(' и ')} посчитайте файлы с расширением .${ext2}.`,
        `3. Сложите полученные количества.`
      ];

      for (const sub of subdirsList) {
        // Add ext1 and ext2 files
        const count1 = getRandomInt(2, 6, rng);
        for (let i = 1; i <= count1; i++) {
          const nameBase = `file1_${String(i).padStart(2, '0')}`;
          const sizeBytes = getRandomInt(1024, 40 * 1024, rng);
          files.push({
            name: nameBase, ext: ext1, fullName: `${nameBase}.${ext1}`,
            sizeBytes, genre: sub.genre, author: sub.author, relPath: `${sub.path}/${nameBase}.${ext1}`
          });
        }

        const count2 = getRandomInt(2, 6, rng);
        for (let i = 1; i <= count2; i++) {
          const nameBase = `file2_${String(i).padStart(2, '0')}`;
          const sizeBytes = getRandomInt(1024, 40 * 1024, rng);
          files.push({
            name: nameBase, ext: ext2, fullName: `${nameBase}.${ext2}`,
            sizeBytes, genre: sub.genre, author: sub.author, relPath: `${sub.path}/${nameBase}.${ext2}`
          });
        }

        // Noise files
        const noiseExts = EXTENSIONS.filter(e => e !== ext1 && e !== ext2);
        const noiseCount = getRandomInt(4, 7, rng);
        for (let i = 1; i <= noiseCount; i++) {
          const noiseExt = getRandomItem(noiseExts, rng);
          const nameBase = `noise_${String(i).padStart(2, '0')}`;
          const sizeBytes = getRandomInt(500, 50 * 1024, rng);
          files.push({
            name: nameBase, ext: noiseExt, fullName: `${nameBase}.${noiseExt}`,
            sizeBytes, genre: sub.genre, author: sub.author, relPath: `${sub.path}/${nameBase}.${noiseExt}`
          });
        }
      }
    }

    extensionsInfo = { ext1, ext2 };

  } else {
    // L3: Size filter
    const extTarget = getRandomItem(['pdf', 'png', 'txt', 'html', 'jpg'], rng);
    const useBytesUnit = rng.next() < 0.5;
    const mode = (rng.next() < 0.5) ? 'more' : 'less';

    let thresholdText = '';
    let thresholdBytes = 0;

    if (useBytesUnit) {
      // Bytes threshold e.g. 1200, 1500, 1800, 2000, 2500, 3000, 4000, 5000, 7000, 10000, 12000, 15000, 20000, 25000
      const bVals = [1200, 1500, 1800, 2000, 2500, 3000, 4000, 5000, 7000, 10000, 12000, 15000, 20000, 25000];
      thresholdBytes = getRandomItem(bVals, rng);
      thresholdText = `${thresholdBytes} байт`;

      hintText = `Выполните поиск *.${extTarget} в папке /${rootDir}/. Настройте фильтр по размеру или отсортируйте результаты по размеру и отсчитайте нужные файлы с размером ${mode === 'more' ? '>' : '<'} ${thresholdBytes} байт.`;
      explanationSteps = [
        `1. В папке /${rootDir}/ выполните поиск всех файлов *.${extTarget}.`,
        `2. Порог размера задан в байтах: ${thresholdBytes} байт.`,
        `3. Отсортируйте полученные файлы по размеру и отберите только те, у которых размер строго ${mode === 'more' ? 'больше' : 'меньше'} ${thresholdBytes} байт.`
      ];
    } else {
      // KB threshold e.g. 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30
      const kbVals = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30];
      const selectedKB = getRandomItem(kbVals, rng);
      thresholdBytes = selectedKB * 1024;
      thresholdText = `${selectedKB} КБ`;

      hintText = `Выполните поиск *.${extTarget} в папке /${rootDir}/. Переведите порог из КБ в байты (${selectedKB} КБ = ${thresholdBytes} байт, так как 1 КБ = 1024 байт). Отсортируйте результаты по размеру и отсчитайте подходящие файлы.`;
      explanationSteps = [
        `1. В папке /${rootDir}/ выполните поиск всех файлов *.${extTarget}.`,
        `2. Переведите условие размера из КБ в байты: ${selectedKB} КБ = ${selectedKB} × 1024 = ${thresholdBytes} байт (так как 1 КБ = 1024 байта).`,
        `3. Отсортируйте полученные файлы по размеру и отберите только те, у которых размер строго ${mode === 'more' ? 'больше' : 'меньше'} ${thresholdBytes} байт.`
      ];
    }

    const modeText = mode === 'more' ? 'более' : 'менее';
    statement = `Сколько файлов с расширением .${extTarget} размером ${modeText} ${thresholdText} содержится в каталоге ${rootDir} и всех его подкаталогах? В ответе укажите только число.`;
    criteriaDesc = `файлы .${extTarget} размером ${modeText} ${thresholdText} во всех подкаталогах`;

    matchingFilter = (f) => {
      if (f.ext.toLowerCase() !== extTarget.toLowerCase()) return false;
      return mode === 'more' ? f.sizeBytes > thresholdBytes : f.sizeBytes < thresholdBytes;
    };

    // Guarantee files both above and below threshold, including boundary files!
    for (const sub of subdirsList) {
      // Larger files
      const largerCount = getRandomInt(2, 4, rng);
      for (let i = 1; i <= largerCount; i++) {
        const nameBase = `large_${getRandomItem(NAME_TEMPLATES, rng)}_${String(i).padStart(2, '0')}`;
        const sizeBytes = thresholdBytes + getRandomInt(100, 20 * 1024, rng);
        files.push({
          name: nameBase, ext: extTarget, fullName: `${nameBase}.${extTarget}`,
          sizeBytes, genre: sub.genre, author: sub.author, relPath: `${sub.path}/${nameBase}.${extTarget}`
        });
      }

      // Smaller files
      const smallerCount = getRandomInt(2, 4, rng);
      for (let i = 1; i <= smallerCount; i++) {
        const nameBase = `small_${getRandomItem(NAME_TEMPLATES, rng)}_${String(i).padStart(2, '0')}`;
        const sizeBytes = Math.max(200, thresholdBytes - getRandomInt(50, Math.max(60, Math.min(20 * 1024, thresholdBytes - 100)), rng));
        files.push({
          name: nameBase, ext: extTarget, fullName: `${nameBase}.${extTarget}`,
          sizeBytes, genre: sub.genre, author: sub.author, relPath: `${sub.path}/${nameBase}.${extTarget}`
        });
      }

      // Boundary file near threshold (exactly at threshold)
      const boundarySize = thresholdBytes; // strictly equal -> does not match strictly > or <
      files.push({
        name: `boundary_${getRandomItem(NAME_TEMPLATES, rng)}`, ext: extTarget, fullName: `boundary_${getRandomItem(NAME_TEMPLATES, rng)}.${extTarget}`,
        sizeBytes: boundarySize, genre: sub.genre, author: sub.author, relPath: `${sub.path}/boundary_${getRandomItem(NAME_TEMPLATES, rng)}.${extTarget}`
      });

      // Noise files with other extensions
      const noiseExts = EXTENSIONS.filter(e => e !== extTarget);
      const noiseCount = getRandomInt(4, 7, rng);
      for (let i = 1; i <= noiseCount; i++) {
        const noiseExt = getRandomItem(noiseExts, rng);
        const nameBase = `noise_${String(i).padStart(2, '0')}`;
        const sizeBytes = getRandomInt(300, 40 * 1024, rng);
        files.push({
          name: nameBase, ext: noiseExt, fullName: `${nameBase}.${noiseExt}`,
          sizeBytes, genre: sub.genre, author: sub.author, relPath: `${sub.path}/${nameBase}.${noiseExt}`
        });
      }
    }
  }

  // Calculate matching count
  const matchingFiles = files.filter(matchingFilter);
  const correctAnswer = String(matchingFiles.length);

  // Compute subdirectory breakdown summaries
  const subdirSummaries: SubdirSummary[] = subdirsList.map(sub => {
    const subFiles = files.filter(f => f.genre === sub.genre && f.author === sub.author);
    const matches = subFiles.filter(matchingFilter);
    if (extensionsInfo && ext1Filter && ext2Filter) {
      const ext1Matches = subFiles.filter(ext1Filter);
      const ext2Matches = subFiles.filter(ext2Filter);
      return {
        path: sub.path,
        genre: sub.genre,
        author: sub.author,
        totalFiles: subFiles.length,
        matchingFiles: matches.length,
        ext1MatchingFiles: ext1Matches.length,
        ext2MatchingFiles: ext2Matches.length,
      };
    }
    return {
      path: sub.path,
      genre: sub.genre,
      author: sub.author,
      totalFiles: subFiles.length,
      matchingFiles: matches.length
    };
  });

  return {
    level,
    rootDir,
    files,
    statement,
    correctAnswer,
    questionType: `L${level}`,
    criteriaDesc,
    hintText,
    explanationSteps,
    subdirSummaries,
    extensionsInfo
  };
}

interface Task12ViewProps {
  taskData: Task12Data;
  state: TaskModuleState;
}

const Task12View: React.FC<Task12ViewProps> = ({ taskData, state }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadTask12Zip(taskData.rootDir, taskData.files);
    } catch (err) {
      console.error('Failed to download zip:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const isCorrect = state.isSubmitted ? task12.check(taskData, state.userAnswer) : undefined;

  const totalExt1 = taskData.subdirSummaries.reduce((sum, s) => sum + (s.ext1MatchingFiles || 0), 0);
  const totalExt2 = taskData.subdirSummaries.reduce((sum, s) => sum + (s.ext2MatchingFiles || 0), 0);

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
        </div>
      </StatementBlock>

      {/* Answer input form */}
      <AnswerField
        label="Ответ (целое число — количество файлов):"
        value={state.userAnswer}
        onChange={(val) => state.setUserAnswer(val)}
        disabled={state.isSubmitted}
        placeholder="Например: 14"
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
                Правильный ответ:{' '}
                <AnswerChip>{taskData.correctAnswer}</AnswerChip>
              </p>
            </div>
          )}
        </VerdictBox>
      )}

      {/* Hint section (shown before submission when requested) */}
      {state.showHints && !state.isSubmitted && (
        <HintBox>
          <strong className="block font-bold text-sm mb-1.5">💡 Подсказка по поиску средствами ОС:</strong>
          <p className="text-sm leading-relaxed">
            {taskData.hintText}
          </p>
        </HintBox>
      )}

      {/* Explanation section (shown only after submission) */}
      {state.isSubmitted && (
        <SubBlock className="space-y-4">
          <strong className="block font-extrabold text-base text-theme-text">
            📖 Разбор решения (Уровень L{taskData.level})
          </strong>

          <div className="space-y-2 text-sm text-theme-text leading-relaxed">
            <p>
              Критерий отбора: <strong className="font-bold text-theme-text">{taskData.criteriaDesc}</strong>.
            </p>
            {taskData.explanationSteps.map((step, idx) => (
              <p key={idx}>{step}</p>
            ))}
          </div>

          {/* Subdirectory Breakdown Table */}
          <div className="pt-2 space-y-2">
            <BlockLabel className="mb-0 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5" /> Распределение подходящих файлов по подкаталогам:
            </BlockLabel>
            <DataTable>
              <thead>
                <tr>
                  <Th className="text-left">Подкаталог</Th>
                  <Th className="text-center">Всего файлов</Th>
                  {taskData.extensionsInfo ? (
                    <>
                      <Th className="text-right">Файлы .{taskData.extensionsInfo.ext1}</Th>
                      <Th className="text-right">Файлы .{taskData.extensionsInfo.ext2}</Th>
                    </>
                  ) : (
                    <Th className="text-right">Подходящих по условию</Th>
                  )}
                </tr>
              </thead>
              <tbody>
                {taskData.subdirSummaries.map((summary, idx) => (
                  <tr key={idx} className={summary.matchingFiles > 0 ? 'bg-blue-500/5' : ''}>
                    <Td className="text-left font-medium">
                      /{taskData.rootDir}/{summary.path}/
                    </Td>
                    <Td className="text-center text-theme-text-muted">{summary.totalFiles}</Td>
                    {taskData.extensionsInfo ? (
                      <>
                        <Td className="text-right font-bold text-blue-600 dark:text-blue-400">
                          {summary.ext1MatchingFiles ?? 0}
                        </Td>
                        <Td className="text-right font-bold text-blue-600 dark:text-blue-400">
                          {summary.ext2MatchingFiles ?? 0}
                        </Td>
                      </>
                    ) : (
                      <Td className="text-right font-bold text-blue-600 dark:text-blue-400">
                        {summary.matchingFiles}
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
              {taskData.extensionsInfo && (
                <tfoot>
                  <tr className="bg-theme-bg/80 font-semibold text-theme-text border-t-2 border-theme-border">
                    <Td className="text-left font-bold">Итого:</Td>
                    <Td className="text-center text-theme-text-muted">
                      {taskData.subdirSummaries.reduce((sum, s) => sum + s.totalFiles, 0)}
                    </Td>
                    <Td className="text-right text-blue-600 dark:text-blue-400 font-bold">
                      {totalExt1}
                    </Td>
                    <Td className="text-right text-blue-600 dark:text-blue-400 font-bold">
                      {totalExt2}
                    </Td>
                  </tr>
                </tfoot>
              )}
            </DataTable>
          </div>

          <div className="pt-2 text-sm font-semibold text-theme-text flex items-center gap-2 border-t border-theme-border">
            {taskData.extensionsInfo ? (
              <span>Итог: {totalExt1} + {totalExt2} = <AnswerChip>{taskData.correctAnswer}</AnswerChip></span>
            ) : (
              <span>Итого правильный ответ: <AnswerChip>{taskData.correctAnswer}</AnswerChip></span>
            )}
          </div>
        </SubBlock>
      )}
    </div>
  );
};

export const task12: TaskModule = {
  id: 12,
  title: 'Анализ файловой структуры',
  description: 'Подсчёт количества файлов по заданным расширениям, папкам и размерам.',
  topics: ['Файловая система', 'Маски файлов'], // TODO: уточнить формулировки
  maxPoints: 1,

  generate: (difficulty: Difficulty, rng: RNG): Task12Data => {
    return generateTask12Data(difficulty, rng);
  },

  render: (taskData: Task12Data, state: TaskModuleState) => {
    return <Task12View taskData={taskData} state={state} />;
  },

  check: (taskData: Task12Data, userAnswer: string): boolean => {
    if (!userAnswer) return false;
    const cleaned = userAnswer.trim();
    if (!/^-?\d+$/.test(cleaned)) {
      return false;
    }
    const userNum = parseInt(cleaned, 10);
    const correctNum = parseInt(taskData.correctAnswer, 10);
    return userNum === correctNum;
  }
};

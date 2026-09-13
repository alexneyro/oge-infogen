import React from 'react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { RNG } from '../utils/rng';
import {
  StatementBlock,
  StatementText,
  StatementQuestion,
  SubBlock,
  AnswerField,
  AnswerChip,
  VerdictBox,
  HintBox,
} from '../components/task-ui';

export type CmdType = 'add' | 'sub' | 'mul' | 'div' | 'square' | 'strip';

export interface CommandSpec {
  num: number;
  type: CmdType;
  param?: number | 'b';
  label: string;
}

export type Task5Subtype = 'direct' | 'find_b' | 'count_programs' | 'find_missing_cmd';

export interface Task5Data {
  subtype: Task5Subtype;
  commands: CommandSpec[];
  executorName: string;
  startVal: number;
  targetVal: number;
  maxLen: number;
  exactLen?: boolean;
  progStr?: string;
  missingIdx?: number;
  bValue?: number;
  statement: string;
  questionStr: string;
  correctAnswer: string;
  shortHint: string;
  explanation: string;
}

/**
 * Applies a command to a natural number.
 * Returns the new value if step is valid and stays natural (>= 1), else null.
 */
export function applyCommand(x: number, cmd: CommandSpec, bVal?: number): number | null {
  if (x < 1 || !Number.isInteger(x)) return null;

  const param = typeof cmd.param === 'number' ? cmd.param : bVal;

  switch (cmd.type) {
    case 'add': {
      if (param === undefined || param < 1) return null;
      const res = x + param;
      return res >= 1 ? res : null;
    }
    case 'sub': {
      if (param === undefined || param < 1) return null;
      const res = x - param;
      return res >= 1 ? res : null;
    }
    case 'mul': {
      if (param === undefined || param < 2) return null;
      const res = x * param;
      return res >= 1 ? res : null;
    }
    case 'div': {
      if (param === undefined || param < 2) return null;
      if (x % param !== 0) return null;
      const res = x / param;
      return res >= 1 ? res : null;
    }
    case 'square': {
      const res = x * x;
      return res >= 1 ? res : null;
    }
    case 'strip': {
      if (x < 10) return null;
      const res = Math.floor(x / 10);
      return res >= 1 ? res : null;
    }
    default:
      return null;
  }
}

/**
 * Runs a program (array of command numbers) on startVal.
 */
export function runProgram(
  startVal: number,
  prog: number[],
  commands: CommandSpec[],
  bVal?: number
): { finalVal: number | null; steps: { from: number; cmdNum: number; cmdLabel: string; to: number }[] } {
  let curr = startVal;
  const steps: { from: number; cmdNum: number; cmdLabel: string; to: number }[] = [];

  for (const num of prog) {
    const cmd = commands.find(c => c.num === num);
    if (!cmd) return { finalVal: null, steps };

    const next = applyCommand(curr, cmd, bVal);
    if (next === null) return { finalVal: null, steps };

    let label = cmd.label;
    if (cmd.param === 'b' && bVal !== undefined) {
      if (cmd.type === 'add') label = `Прибавь ${bVal}`;
      else if (cmd.type === 'sub') label = `Вычти ${bVal}`;
      else if (cmd.type === 'mul') label = `Умножь на ${bVal}`;
      else if (cmd.type === 'div') label = `Раздели на ${bVal}`;
    }

    steps.push({ from: curr, cmdNum: num, cmdLabel: label, to: next });
    curr = next;
  }

  return { finalVal: curr, steps };
}

/**
 * Traverses program tree to find all valid program sequences from startVal to targetVal.
 */
export function findPrograms(
  startVal: number,
  targetVal: number,
  commands: CommandSpec[],
  maxLen: number,
  exactLen: boolean = false,
  bVal?: number
): number[][] {
  const results: number[][] = [];
  const queue: { val: number; path: number[] }[] = [{ val: startVal, path: [] }];

  while (queue.length > 0) {
    const { val, path } = queue.shift()!;

    if (exactLen) {
      if (path.length === maxLen) {
        if (targetVal === 0 || val === targetVal) {
          results.push(path);
        }
        continue;
      }
    } else {
      if (path.length > 0 && (targetVal === 0 || val === targetVal)) {
        results.push(path);
      }
      if (path.length >= maxLen) {
        continue;
      }
    }

    for (const cmd of commands) {
      const next = applyCommand(val, cmd, bVal);
      if (next !== null) {
        queue.push({ val: next, path: [...path, cmd.num] });
      }
    }
  }

  return results;
}

// Explanation Generators

export function usesAllCommands(prog: number[], commands: CommandSpec[]): boolean {
  const used = new Set(prog);
  return commands.every(c => used.has(c.num));
}

export function checkBEquationDegree(
  prog: number[],
  commands: CommandSpec[],
  bCmdNum: number
): { degree: number; valid: boolean } {
  const bCmd = commands.find(c => c.num === bCmdNum);
  if (!bCmd) return { degree: 0, valid: false };

  let bCount = 0;
  let bIntroduced = false;

  for (const cmdNum of prog) {
    if (cmdNum === bCmdNum) {
      bCount++;
      bIntroduced = true;
    }
    const cmd = commands.find(c => c.num === cmdNum);
    if (bIntroduced && cmd && cmd.type === 'square') {
      // b passed through square! Exceeds constraints.
      return { degree: 999, valid: false };
    }
  }

  if (bCount === 0) return { degree: 0, valid: false };

  let degree = 1;
  if (bCmd.type === 'mul' || bCmd.type === 'div') {
    degree = bCount;
  } else {
    degree = 1;
  }

  if (degree > 2) return { degree, valid: false };
  return { degree, valid: true };
}

function buildExplanationDirect(
  executorName: string,
  commands: CommandSpec[],
  startVal: number,
  targetVal: number,
  maxLen: number,
  correctAnswer: string
): string {
  const lines: string[] = [];
  lines.push(`Шаг 1. Анализ условия задачи`);
  lines.push(`Дано: ${executorName} с системами команд:`);
  commands.forEach(c => lines.push(`${c.num}. ${c.label}`));
  lines.push(`Требуется получить из числа ${startVal} число ${targetVal}, используя не более ${maxLen} команд.`);
  lines.push(``);
  lines.push(`Шаг 2. Выполнение найденной программы ${correctAnswer}`);

  const prog = correctAnswer.split('').map(Number);
  const res = runProgram(startVal, prog, commands);

  lines.push(`• Исходное число: ${startVal}`);
  res.steps.forEach((s, idx) => {
    lines.push(`• Шаг ${idx + 1} (Команда ${s.cmdNum}: ${s.cmdLabel}): ${s.from} -> ${s.to}`);
  });

  lines.push(``);
  lines.push(`В результате выполнения ${prog.length} команд из числа ${startVal} получено число ${targetVal}.`);
  lines.push(``);
  lines.push(`Шаг 3. Итоговый ответ`);
  lines.push(`Ответ: ${correctAnswer}.`);

  return lines.join('\n');
}

function buildExplanationFindB(
  executorName: string,
  commands: CommandSpec[],
  progStr: string,
  startVal: number,
  targetVal: number,
  bValue: number,
  bCmdNum: number
): string {
  const lines: string[] = [];
  lines.push(`Шаг 1. Анализ программы и составление уравнения`);
  lines.push(`Дано: ${executorName} с системами команд:`);
  commands.forEach(c => lines.push(`${c.num}. ${c.label}`));
  lines.push(`Программа ${progStr} переводит число ${startVal} в число ${targetVal}.`);
  lines.push(``);
  lines.push(`Проследим за изменением числа по шагам программы:`);

  const prog = progStr.split('').map(Number);
  let exprStr = `${startVal}`;
  let currNum = startVal;
  let isParamInvolved = false;

  for (let i = 0; i < prog.length; i++) {
    const cmdNum = prog[i];
    const cmd = commands.find(c => c.num === cmdNum)!;

    if (cmdNum === bCmdNum) {
      isParamInvolved = true;
      if (cmd.type === 'add') exprStr = `(${exprStr} + b)`;
      else if (cmd.type === 'sub') exprStr = `(${exprStr} - b)`;
      else if (cmd.type === 'mul') exprStr = `(${exprStr} * b)`;
      else if (cmd.type === 'div') exprStr = `(${exprStr} / b)`;
      lines.push(`• Шаг ${i + 1} (Команда ${cmdNum}): выражение имеет вид ${exprStr}`);
    } else {
      if (!isParamInvolved) {
        const nextNum = applyCommand(currNum, cmd)!;
        lines.push(`• Шаг ${i + 1} (Команда ${cmdNum}): ${currNum} -> ${nextNum}`);
        currNum = nextNum;
        exprStr = `${currNum}`;
      } else {
        if (cmd.type === 'add' && typeof cmd.param === 'number') {
          exprStr = `(${exprStr} + ${cmd.param})`;
        } else if (cmd.type === 'sub' && typeof cmd.param === 'number') {
          exprStr = `(${exprStr} - ${cmd.param})`;
        } else if (cmd.type === 'mul' && typeof cmd.param === 'number') {
          exprStr = `(${exprStr} * ${cmd.param})`;
        } else if (cmd.type === 'div' && typeof cmd.param === 'number') {
          exprStr = `(${exprStr} / ${cmd.param})`;
        } else if (cmd.type === 'square') {
          exprStr = `(${exprStr})^2`;
        }
        lines.push(`• Шаг ${i + 1} (Команда ${cmdNum}): выражение имеет вид ${exprStr}`);
      }
    }
  }

  lines.push(``);
  lines.push(`Шаг 2. Нахождение неизвестного параметра b`);
  lines.push(`Приравниваем итоговое выражение к числу ${targetVal}:`);
  lines.push(`${exprStr} = ${targetVal}`);
  lines.push(`Решая полученное уравнение относительно b, получаем b = ${bValue}.`);
  lines.push(``);
  lines.push(`Проверка: подставляем b = ${bValue} в программу:`);

  const testRes = runProgram(startVal, prog, commands, bValue);
  testRes.steps.forEach((s, idx) => {
    lines.push(`  Шаг ${idx + 1}: команда ${s.cmdNum} (${s.cmdLabel}) над числом ${s.from} дает ${s.to}`);
  });
  lines.push(`Все промежуточные результаты являются натуральными числами, а итоговый результат равен ${targetVal}.`);
  lines.push(``);
  lines.push(`Шаг 3. Итоговый ответ`);
  lines.push(`Значение b: ${bValue}.`);

  return lines.join('\n');
}

function buildExplanationCountPrograms(
  executorName: string,
  commands: CommandSpec[],
  startVal: number,
  targetVal: number,
  maxLen: number,
  exactLen: boolean,
  matchingProgs: number[][]
): string {
  const lines: string[] = [];
  lines.push(`Шаг 1. Анализ условия задачи`);
  lines.push(`Дано: ${executorName} с системами команд:`);
  commands.forEach(c => lines.push(`${c.num}. ${c.label}`));
  lines.push(`Требуется найти количество программ, содержащих ${exactLen ? `ровно ${maxLen}` : `не более ${maxLen}`} команд, которые переводят число ${startVal} в число ${targetVal}.`);
  lines.push(``);
  lines.push(`Шаг 2. Разбор подходящих программ`);
  lines.push(`Найдены следующие программы (${matchingProgs.length} шт.):`);

  matchingProgs.forEach((prog, pIdx) => {
    const res = runProgram(startVal, prog, commands);
    const progStr = prog.join('');
    const stepChain = res.steps.map(s => `${s.from} -(${s.cmdLabel})-> ${s.to}`).join(', ');
    lines.push(`${pIdx + 1}) Программа ${progStr}: ${stepChain}`);
  });

  lines.push(``);
  lines.push(`Шаг 3. Итоговый ответ`);
  lines.push(`Количество подходящих программ: ${matchingProgs.length}.`);

  return lines.join('\n');
}

function buildExplanationFindMissingCmd(
  executorName: string,
  commands: CommandSpec[],
  progWithQuestion: string,
  startVal: number,
  targetVal: number,
  missingIdx: number,
  correctCmdNum: number
): string {
  const lines: string[] = [];
  lines.push(`Шаг 1. Анализ программы с пропуском`);
  lines.push(`Дано: ${executorName} с системами команд:`);
  commands.forEach(c => lines.push(`${c.num}. ${c.label}`));
  lines.push(`Программа ${progWithQuestion} переводит число ${startVal} в число ${targetVal}.`);
  lines.push(``);
  lines.push(`Шаг 2. Проверка возможных вариантов для пропущенной команды`);

  const tokens = progWithQuestion.split(' ');

  commands.forEach(c => {
    const testTokens = [...tokens];
    testTokens[missingIdx] = String(c.num);
    const testProg = testTokens.map(Number);
    const res = runProgram(startVal, testProg, commands);

    if (res.finalVal === null) {
      lines.push(`• Вариант (Команда ${c.num}: ${c.label}): программа ${testProg.join('')} приводит к недопустимому шагу.`);
    } else if (res.finalVal === targetVal) {
      lines.push(`• Вариант (Команда ${c.num}: ${c.label}): программа ${testProg.join('')} переводит ${startVal} в ${res.finalVal} -> ПОДХОДИТ!`);
    } else {
      lines.push(`• Вариант (Команда ${c.num}: ${c.label}): программа ${testProg.join('')} переводит ${startVal} в ${res.finalVal} (а должно быть ${targetVal}) -> не подходит.`);
    }
  });

  lines.push(``);
  lines.push(`Шаг 3. Итоговый ответ`);
  lines.push(`Пропущенный номер команды: ${correctCmdNum}.`);

  return lines.join('\n');
}

export function isValidCommandSet(commands: CommandSpec[]): boolean {
  if (commands.length < 2) return false;

  // Prohibit more than one additive command (add/sub) in the set.
  // This strictly forbids combining add + sub, or multiple adds/subs.
  const additiveCount = commands.filter(c => c.type === 'add' || c.type === 'sub').length;
  if (additiveCount > 1) return false;

  for (let i = 0; i < commands.length; i++) {
    for (let j = i + 1; j < commands.length; j++) {
      const c1 = commands[i];
      const c2 = commands[j];

      // Exact duplicate check
      if (c1.type === c2.type && c1.param === c2.param) return false;
    }
  }

  return true;
}

export function findShortestProgramLength(
  startVal: number,
  targetVal: number,
  commands: CommandSpec[],
  maxLen: number = 6,
  bVal?: number
): number | null {
  if (startVal === targetVal) return 0;

  const queue: { val: number; len: number }[] = [{ val: startVal, len: 0 }];
  const visited = new Set<number>([startVal]);

  while (queue.length > 0) {
    const { val, len } = queue.shift()!;
    if (len >= maxLen) continue;

    for (const cmd of commands) {
      const nxt = applyCommand(val, cmd, bVal);
      if (nxt !== null) {
        if (nxt === targetVal) {
          return len + 1;
        }
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push({ val: nxt, len: len + 1 });
        }
      }
    }
  }

  return null;
}

export function generateRandomCommands(numCmds: number, rng?: RNG): CommandSpec[] {
  const pool: { type: CmdType; param?: number; labelFn: (p?: number) => string }[] = [
    { type: 'add', param: 1, labelFn: p => `Прибавь ${p}` },
    { type: 'add', param: 2, labelFn: p => `Прибавь ${p}` },
    { type: 'add', param: 3, labelFn: p => `Прибавь ${p}` },
    { type: 'add', param: 4, labelFn: p => `Прибавь ${p}` },
    { type: 'sub', param: 1, labelFn: p => `Вычти ${p}` },
    { type: 'sub', param: 2, labelFn: p => `Вычти ${p}` },
    { type: 'sub', param: 3, labelFn: p => `Вычти ${p}` },
    { type: 'mul', param: 2, labelFn: p => `Умножь на ${p}` },
    { type: 'mul', param: 3, labelFn: p => `Умножь на ${p}` },
    { type: 'mul', param: 4, labelFn: p => `Умножь на ${p}` },
    { type: 'div', param: 2, labelFn: p => `Раздели на ${p}` },
    { type: 'div', param: 3, labelFn: p => `Раздели на ${p}` },
    { type: 'square', labelFn: () => 'Возведи в квадрат' },
    { type: 'strip', labelFn: () => 'Зачеркни последнюю цифру' }
  ];

  for (let attempt = 0; attempt < 100; attempt++) {
    const shuffled = rng ? rng.shuffle(pool) : [...pool].sort(() => Math.random() - 0.5);
    const chosen: CommandSpec[] = [];

    for (const item of shuffled) {
      if (chosen.length >= numCmds) break;

      const candidateCmd: CommandSpec = {
        num: chosen.length + 1,
        type: item.type,
        param: item.param,
        label: item.labelFn(item.param)
      };

      const testSet = [...chosen, candidateCmd];
      if (isValidCommandSet(testSet)) {
        chosen.push(candidateCmd);
      }
    }

    if (chosen.length === numCmds) {
      return chosen.map((c, idx) => ({ ...c, num: idx + 1 }));
    }
  }

  const fallbackPool: CommandSpec[] = [
    { num: 1, type: 'add', param: 1, label: 'Прибавь 1' },
    { num: 2, type: 'mul', param: 2, label: 'Умножь на 2' },
    { num: 3, type: 'square', label: 'Возведи в квадрат' },
    { num: 4, type: 'div', param: 2, label: 'Раздели на 2' },
    { num: 5, type: 'strip', label: 'Зачеркни последнюю цифру' },
    { num: 6, type: 'mul', param: 3, label: 'Умножь на 3' }
  ];
  return fallbackPool.slice(0, numCmds).map((c, idx) => ({ ...c, num: idx + 1 }));
}

export function getRandomMaxLen(rng?: RNG): number {
  const r = rng ? rng.next() : Math.random();
  if (r < 0.50) return 5;
  if (r < 0.80) return 4;
  return 6;
}

// Helper to find shortest paths from startVal to all reachable numbers
function buildShortestMap(startVal: number, commands: CommandSpec[], maxSearchDepth: number = 6) {
  const shortestMap = new Map<number, number[]>();
  const queue: { val: number; path: number[] }[] = [{ val: startVal, path: [] }];
  const visited = new Set<number>([startVal]);

  while (queue.length > 0) {
    const { val, path } = queue.shift()!;
    if (path.length >= 4 && val > 0 && val !== startVal && val <= 150) {
      if (!shortestMap.has(val)) {
        shortestMap.set(val, path);
      }
    }
    if (path.length < maxSearchDepth) {
      for (const cmd of commands) {
        const nxt = applyCommand(val, cmd);
        if (nxt !== null && nxt > 0 && nxt <= 300 && !visited.has(nxt)) {
          visited.add(nxt);
          queue.push({ val: nxt, path: [...path, cmd.num] });
        }
      }
    }
  }
  return shortestMap;
}

const CHARACTERS = ['Вычислитель', 'Калькулятор', 'Утроитель', 'Удвоитель', 'Прибавитель'];

// Generators for Level 1, 2, 3

function generateLevel1(rng: RNG): Task5Data {
  const executorName = CHARACTERS[0]
    ? `Исполнитель «${CHARACTERS[0]}»`
    : 'Исполнитель «Калькулятор»';

  const desiredL = getRandomMaxLen(rng);

  for (let attempt = 0; attempt < 300; attempt++) {
    const k1 = rng.int(1, 5); // 1..5
    const k2 = rng.int(2, 3); // 2..3

    const typeCombo = rng.next();
    let commands: CommandSpec[];

    if (typeCombo < 0.35) {
      commands = [
        { num: 1, type: 'add', param: k1, label: `Прибавь ${k1}` },
        { num: 2, type: 'mul', param: k2, label: `Умножь на ${k2}` }
      ];
    } else if (typeCombo < 0.70) {
      commands = [
        { num: 1, type: 'mul', param: k2, label: `Умножь на ${k2}` },
        { num: 2, type: 'add', param: k1, label: `Прибавь ${k1}` }
      ];
    } else {
      const kSub = rng.int(1, 3);
      commands = [
        { num: 1, type: 'sub', param: kSub, label: `Вычти ${kSub}` },
        { num: 2, type: 'mul', param: k2, label: `Умножь на ${k2}` }
      ];
    }

    if (!isValidCommandSet(commands)) continue;

    const startVal = rng.int(2, 9); // 2..9

    const shortestMap = buildShortestMap(startVal, commands, 6);

    let candidateTargets = Array.from(shortestMap.keys()).filter(tVal => {
      const p = shortestMap.get(tVal)!;
      return p.length === desiredL && usesAllCommands(p, commands);
    });

    if (candidateTargets.length === 0) {
      for (const altL of [5, 4, 6]) {
        candidateTargets = Array.from(shortestMap.keys()).filter(tVal => {
          const p = shortestMap.get(tVal)!;
          return p.length === altL && usesAllCommands(p, commands);
        });
        if (candidateTargets.length > 0) break;
      }
    }

    if (candidateTargets.length === 0) continue;

    const targetVal = rng.pick(candidateTargets);
    const shortestProg = shortestMap.get(targetVal)!;
    const L = shortestProg.length;
    const maxLen = L;
    const correctAnswer = shortestProg.join('');

    const statement = `${executorName} имеет следующую систему команд:\n` +
      commands.map(c => `${c.num}. ${c.label}`).join('\n');

    const questionStr = `Составьте программу получения из числа ${startVal} числа ${targetVal}, содержащую не более ${maxLen} команд. В ответе запишите только последовательность номеров команд без пробелов и разделителей.`;

    const shortHint = `• Выполните анализ операций «задом наперёд» от числа ${targetVal} к числу ${startVal}.\n• Проверьте, какие команды применимы на каждом шаге.\n• Не превышайте ограничение в ${maxLen} команд.`;

    const explanation = buildExplanationDirect(
      executorName, commands, startVal, targetVal, maxLen, correctAnswer
    );

    return {
      subtype: 'direct',
      commands,
      executorName,
      startVal,
      targetVal,
      maxLen,
      statement,
      questionStr,
      correctAnswer,
      shortHint,
      explanation
    };
  }

  // Fallback
  const fallbackCmds: CommandSpec[] = [
    { num: 1, type: 'add', param: 2, label: 'Прибавь 2' },
    { num: 2, type: 'mul', param: 2, label: 'Умножь на 2' }
  ];
  const explanation = buildExplanationDirect(
    executorName, fallbackCmds, 2, 28, 5, '21212'
  );

  return {
    subtype: 'direct',
    commands: fallbackCmds,
    executorName,
    startVal: 2,
    targetVal: 28,
    maxLen: 5,
    statement: `${executorName} имеет следующую систему команд:\n1. Прибавь 2\n2. Умножь на 2`,
    questionStr: 'Составьте программу получения из числа 2 числа 28, содержащую не более 5 команд. В ответе запишите только последовательность номеров команд без пробелов и разделителей.',
    correctAnswer: '21212',
    shortHint: 'Двигайтесь от большего числа к меньшему, заменяя умножение делением.',
    explanation
  };
}

function generateLevel2(rng: RNG): Task5Data {
  const executorName = CHARACTERS[0]
    ? `Исполнитель «${CHARACTERS[0]}»`
    : 'Исполнитель «Вычислитель»';

  const isSubtypeFindB = rng.next() < 0.5;

  for (let attempt = 0; attempt < 300; attempt++) {
    if (isSubtypeFindB) {
      // Subtype Find B
      const bCmdNum = rng.next() < 0.5 ? 1 : 2;
      const otherCmdNum = bCmdNum === 1 ? 2 : 1;

      const bTypeRand = rng.next();
      let bCmd: CommandSpec;
      let otherCmd: CommandSpec;

      const secretB = rng.int(2, 6); // 2..6

      if (bTypeRand < 0.35) {
        // sub b + mul K
        const mulK = rng.int(2, 3);
        bCmd = { num: bCmdNum, type: 'sub', param: 'b', label: 'Вычти b' };
        otherCmd = { num: otherCmdNum, type: 'mul', param: mulK, label: `Умножь на ${mulK}` };
      } else if (bTypeRand < 0.70) {
        // add b + mul K
        const mulK = rng.int(2, 3);
        bCmd = { num: bCmdNum, type: 'add', param: 'b', label: 'Прибавь b' };
        otherCmd = { num: otherCmdNum, type: 'mul', param: mulK, label: `Умножь на ${mulK}` };
      } else {
        // mul b + add K
        const addK = rng.int(1, 3);
        bCmd = { num: bCmdNum, type: 'mul', param: 'b', label: 'Умножь на b' };
        otherCmd = { num: otherCmdNum, type: 'add', param: addK, label: `Прибавь ${addK}` };
      }

      const cmd1 = bCmdNum === 1 ? bCmd : otherCmd;
      const cmd2 = bCmdNum === 2 ? bCmd : otherCmd;
      const commands = [cmd1, cmd2];

      if (!isValidCommandSet(commands)) continue;

      const desiredL = getRandomMaxLen(rng);
      const progLen = desiredL;
      const prog: number[] = [];
      for (let i = 0; i < progLen; i++) {
        prog.push(rng.next() < 0.5 ? 1 : 2);
      }
      if (!usesAllCommands(prog, commands)) continue;

      const eqCheck = checkBEquationDegree(prog, commands, bCmdNum);
      if (!eqCheck.valid) continue;
      if (rng.next() < 0.70 && eqCheck.degree > 1) continue; // Preference for linear degree 1

      const startVal = rng.int(2, 9);
      const res = runProgram(startVal, prog, commands, secretB);

      if (res.finalVal === null || res.finalVal <= startVal || res.finalVal > 200) continue;
      const targetVal = res.finalVal;

      // Ensure shortest path length is >= 4
      const shortestLen = findShortestProgramLength(startVal, targetVal, commands, progLen, secretB);
      if (shortestLen === null || shortestLen < 4) continue;

      // Check uniqueness of b in [1..50]
      const validBs: number[] = [];
      for (let candB = 1; candB <= 50; candB++) {
        const testRes = runProgram(startVal, prog, commands, candB);
        if (testRes.finalVal === targetVal) {
          validBs.push(candB);
        }
      }

      if (validBs.length !== 1 || validBs[0] !== secretB) continue;

      const progStr = prog.join('');
      const bMinVal = bCmd.type === 'mul' || bCmd.type === 'div' ? 2 : 1;
      const statement = `${executorName} имеет следующую систему команд:\n` +
        `1. ${cmd1.label}\n` +
        `2. ${cmd2.label}\n` +
        `(где b — неизвестное натуральное число, b ≥ ${bMinVal})`;

      const questionStr = `Известно, что программа ${progStr} переводит число ${startVal} в число ${targetVal}. Определите значение b.`;

      const shortHint = `• Запишите цепочку вычислений с переменной b по шагам программы ${progStr}.\n• Составьте и решите уравнение относительно b.\n• Убедитесь, что найденное b дает натуральные результаты на всех шагах.`;

      const explanation = buildExplanationFindB(
        executorName, commands, progStr, startVal, targetVal, secretB, bCmdNum
      );

      return {
        subtype: 'find_b',
        commands,
        executorName,
        startVal,
        targetVal,
        maxLen: progLen,
        progStr,
        bValue: secretB,
        statement,
        questionStr,
        correctAnswer: String(secretB),
        shortHint,
        explanation
      };

    } else {
      // Subtype Direct with advanced commands (square, div, strip)
      const advRand = rng.next();
      let commands: CommandSpec[];

      if (advRand < 0.25) {
        // square + sub
        const kSub = rng.int(1, 4);
        commands = [
          { num: 1, type: 'square', label: 'Возведи в квадрат' },
          { num: 2, type: 'sub', param: kSub, label: `Вычти ${kSub}` }
        ];
      } else if (advRand < 0.50) {
        // add + div
        const addK = rng.int(3, 7);
        const divK = rng.int(2, 3); // 2 or 3
        commands = [
          { num: 1, type: 'add', param: addK, label: `Прибавь ${addK}` },
          { num: 2, type: 'div', param: divK, label: `Раздели на ${divK}` }
        ];
      } else if (advRand < 0.75) {
        // add + strip
        const addK = rng.int(2, 5);
        commands = [
          { num: 1, type: 'add', param: addK, label: `Прибавь ${addK}` },
          { num: 2, type: 'strip', label: 'Зачеркни последнюю цифру' }
        ];
      } else {
        // sub + mul
        const subK = rng.int(1, 3);
        const mulK = rng.int(2, 3);
        commands = [
          { num: 1, type: 'sub', param: subK, label: `Вычти ${subK}` },
          { num: 2, type: 'mul', param: mulK, label: `Умножь на ${mulK}` }
        ];
      }

      if (!isValidCommandSet(commands)) continue;

      const startVal = rng.int(2, 9);
      const desiredL = getRandomMaxLen(rng);

      const shortestMap = buildShortestMap(startVal, commands, 6);

      let candidateTargets = Array.from(shortestMap.keys()).filter(tVal => {
        const p = shortestMap.get(tVal)!;
        return p.length === desiredL && usesAllCommands(p, commands);
      });

      if (candidateTargets.length === 0) {
        for (const altL of [5, 4, 6]) {
          candidateTargets = Array.from(shortestMap.keys()).filter(tVal => {
            const p = shortestMap.get(tVal)!;
            return p.length === altL && usesAllCommands(p, commands);
          });
          if (candidateTargets.length > 0) break;
        }
      }

      if (candidateTargets.length === 0) continue;

      const targetVal = rng.pick(candidateTargets);
      const shortestProg = shortestMap.get(targetVal)!;
      const L = shortestProg.length;
      const maxLen = L;
      const correctAnswer = shortestProg.join('');

      const statement = `${executorName} имеет следующую систему команд:\n` +
        commands.map(c => `${c.num}. ${c.label}`).join('\n');

      const questionStr = `Составьте программу получения из числа ${startVal} числа ${targetVal}, содержащую не более ${maxLen} команд. В ответе запишите только последовательность номеров команд без пробелов и разделителей.`;

      const shortHint = `• Анализируйте доступность команд на каждом шаге (например, деление выполняется только нацело, а при зачёркивании цифры число должно быть двухзначным).\n• Не превышайте ограничение в ${maxLen} команд.`;

      const explanation = buildExplanationDirect(
        executorName, commands, startVal, targetVal, maxLen, correctAnswer
      );

      return {
        subtype: 'direct',
        commands,
        executorName,
        startVal,
        targetVal,
        maxLen,
        statement,
        questionStr,
        correctAnswer,
        shortHint,
        explanation
      };
    }
  }

  // Fallback to level 1 if loop exhausts
  return generateLevel1(rng);
}

function generateLevel3(rng: RNG): Task5Data {
  const executorName = CHARACTERS[0]
    ? `Исполнитель «${CHARACTERS[0]}»`
    : 'Исполнитель «Автомат»';

  const subTypeRand = rng.next();

  for (let attempt = 0; attempt < 300; attempt++) {
    if (subTypeRand < 0.35) {
      // Subtype A: count_programs (3 commands)
      const exactLen = rng.next() < 0.5;
      const maxLen = getRandomMaxLen(rng);
      const commands = generateRandomCommands(3, rng);

      if (!isValidCommandSet(commands)) continue;

      const startVal = rng.int(1, 5);

      const allProgs = findPrograms(startVal, 0, commands, maxLen, exactLen);
      const valGroupMap = new Map<number, number[][]>();
      allProgs.forEach(prog => {
        const res = runProgram(startVal, prog, commands);
        if (res.finalVal !== null && res.finalVal > startVal && res.finalVal <= 150) {
          if (!valGroupMap.has(res.finalVal)) {
            valGroupMap.set(res.finalVal, []);
          }
          valGroupMap.get(res.finalVal)!.push(prog);
        }
      });

      const shortestMap = buildShortestMap(startVal, commands, maxLen);

      const candidateTargets = Array.from(valGroupMap.entries()).filter(
        ([tVal, progs]) => {
          if (progs.length < 2 || progs.length > 15) return false;
          const shortestProg = shortestMap.get(tVal);
          if (!shortestProg || shortestProg.length < 4) return false;
          return usesAllCommands(shortestProg, commands);
        }
      );

      if (candidateTargets.length === 0) continue;

      const [targetVal, matchingProgs] = rng.pick(candidateTargets);
      const correctAnswer = String(matchingProgs.length);

      const statement = `${executorName} имеет следующую систему команд:\n` +
        commands.map(c => `${c.num}. ${c.label}`).join('\n');

      const questionStr = `Сколько существует программ, содержащих ${exactLen ? `ровно ${maxLen}` : `не более ${maxLen}`} команд, которые переводят число ${startVal} в число ${targetVal}?`;

      const shortHint = `• Постройте дерево всех возможных ветвлений команд от числа ${startVal}.\n• Проверяйте условия выполнения команд и их итоговое значение на шаге ${maxLen}.\n• Посчитайте количество веток, закончившихся числом ${targetVal}.`;

      const explanation = buildExplanationCountPrograms(
        executorName, commands, startVal, targetVal, maxLen, exactLen, matchingProgs
      );

      return {
        subtype: 'count_programs',
        commands,
        executorName,
        startVal,
        targetVal,
        maxLen,
        exactLen,
        statement,
        questionStr,
        correctAnswer,
        shortHint,
        explanation
      };

    } else if (subTypeRand < 0.7) {
      // Subtype C: find_missing_cmd (3 commands)
      const numCmds = 3;
      const commands = generateRandomCommands(3, rng);

      if (!isValidCommandSet(commands)) continue;

      const progLen = getRandomMaxLen(rng);
      const fullProg: number[] = [];
      for (let i = 0; i < progLen; i++) {
        fullProg.push(rng.int(1, numCmds));
      }
      if (!usesAllCommands(fullProg, commands)) continue;

      const startVal = rng.int(2, 7);
      const res = runProgram(startVal, fullProg, commands);

      if (res.finalVal === null || res.finalVal <= startVal || res.finalVal > 150) continue;
      const targetVal = res.finalVal;

      // Ensure shortest program to targetVal is >= 4
      const shortestLen = findShortestProgramLength(startVal, targetVal, commands, progLen);
      if (shortestLen === null || shortestLen < 4) continue;

      const missingIdx = rng.int(0, progLen - 1);
      const correctCmdNum = fullProg[missingIdx];

      // Test uniqueness
      const validCmds: number[] = [];
      commands.forEach(c => {
        const testProg = [...fullProg];
        testProg[missingIdx] = c.num;
        const testRes = runProgram(startVal, testProg, commands);
        if (testRes.finalVal === targetVal) {
          validCmds.push(c.num);
        }
      });

      if (validCmds.length !== 1 || validCmds[0] !== correctCmdNum) continue;

      const progTokens = fullProg.map((num, idx) => idx === missingIdx ? '?' : String(num));
      const progWithQuestion = progTokens.join(' ');

      const statement = `${executorName} имеет следующую систему команд:\n` +
        commands.map(c => `${c.num}. ${c.label}`).join('\n');

      const questionStr = `Известно, что программа ${progWithQuestion} переводит число ${startVal} в число ${targetVal}. Какая команда пропущена вместо знака '?'? В ответе укажите номер команды.`;

      const shortHint = `• Выполните известные команды программы до знака '?'.\n• Проверьте по очереди каждую команду (1, 2, 3) на месте пропуска.\n• Найдите тот номер команды, при котором продолжение программы даст в точности ${targetVal}.`;

      const explanation = buildExplanationFindMissingCmd(
        executorName, commands, progWithQuestion, startVal, targetVal, missingIdx, correctCmdNum
      );

      return {
        subtype: 'find_missing_cmd',
        commands,
        executorName,
        startVal,
        targetVal,
        maxLen: progLen,
        progStr: progWithQuestion,
        missingIdx,
        statement,
        questionStr,
        correctAnswer: String(correctCmdNum),
        shortHint,
        explanation
      };

    } else {
      // Subtype D: 3 commands direct "Build a program"
      const commands = generateRandomCommands(3, rng);

      const startVal = rng.int(2, 7);
      const desiredL = getRandomMaxLen(rng);

      const shortestMap = buildShortestMap(startVal, commands, 6);

      let candidateTargets = Array.from(shortestMap.keys()).filter(tVal => {
        const p = shortestMap.get(tVal)!;
        return p.length === desiredL && usesAllCommands(p, commands);
      });

      if (candidateTargets.length === 0) {
        for (const altL of [5, 4, 6]) {
          candidateTargets = Array.from(shortestMap.keys()).filter(tVal => {
            const p = shortestMap.get(tVal)!;
            return p.length === altL && usesAllCommands(p, commands);
          });
          if (candidateTargets.length > 0) break;
        }
      }

      if (candidateTargets.length === 0) continue;

      const targetVal = rng.pick(candidateTargets);
      const shortestProg = shortestMap.get(targetVal)!;
      const L = shortestProg.length;
      const maxLen = L;
      const correctAnswer = shortestProg.join('');

      const statement = `${executorName} имеет следующую систему команд:\n` +
        commands.map(c => `${c.num}. ${c.label}`).join('\n');

      const questionStr = `Составьте программу получения из числа ${startVal} числа ${targetVal}, содержащую не более ${maxLen} команд. В ответе запишите только последовательность номеров команд без пробелов и разделителей.`;

      const shortHint = `• В распоряжении ${commands.length} команд. Для нахождения оптимальной цепочки из ${startVal} в ${targetVal} оценивайте применимость команд от ${targetVal} назад к ${startVal}.\n• Ответ не должен превышать ${maxLen} команд.`;

      const explanation = buildExplanationDirect(
        executorName, commands, startVal, targetVal, maxLen, correctAnswer
      );

      return {
        subtype: 'direct',
        commands,
        executorName,
        startVal,
        targetVal,
        maxLen,
        statement,
        questionStr,
        correctAnswer,
        shortHint,
        explanation
      };
    }
  }

  return generateLevel2(rng);
}

// Checker function

export function checkTask5(taskData: Task5Data, userAnswer: string): boolean {
  const cleanAns = userAnswer.trim().replace(/\s+/g, '');
  if (!cleanAns) return false;

  if (taskData.subtype === 'direct') {
    const prog = cleanAns.split('').map(Number);
    if (prog.some(isNaN)) {
      return cleanAns === taskData.correctAnswer.trim();
    }
    if (prog.length > taskData.maxLen) return false;

    const res = runProgram(taskData.startVal, prog, taskData.commands);
    if (res.finalVal === taskData.targetVal) {
      return true;
    }
    return cleanAns === taskData.correctAnswer.trim();
  }

  return cleanAns === taskData.correctAnswer.trim();
}

// React UI Component

export const Task5Renderer: React.FC<{ taskData: Task5Data; state: TaskModuleState }> = ({ taskData, state }) => {
  return (
    <div className="space-y-4">
      {/* Statement and Commands */}
      <StatementBlock>
        {/* System of Commands */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-theme-text-muted block">
            Система команд исполнителя:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {taskData.commands.map(cmd => (
              <div
                key={cmd.num}
                className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-theme-bg/60 border border-theme-border"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800">
                  {cmd.num}
                </span>
                <span className="font-medium text-sm text-theme-text">
                  {cmd.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Task Question Box */}
        <SubBlock>
          <StatementQuestion>
            {taskData.questionStr}
          </StatementQuestion>
        </SubBlock>
      </StatementBlock>

      {/* Answer Input */}
      <AnswerField
        label="Ваш ответ:"
        value={state.userAnswer}
        onChange={(val) => state.setUserAnswer(val)}
        disabled={state.isSubmitted}
        mono
        placeholder={
          taskData.subtype === 'direct'
            ? 'Последовательность номеров команд'
            : taskData.subtype === 'find_b'
            ? 'Введите число'
            : taskData.subtype === 'count_programs'
            ? 'Введите количество'
            : 'Номер команды'
        }
      />

      {/* Guiding Hint BEFORE submission */}
      {state.showHints && !state.isSubmitted && (
        <HintBox>
          <strong className="block font-bold text-sm mb-1.5">💡 Подсказка к решению:</strong>
          <p className="whitespace-pre-line leading-relaxed">{taskData.shortHint}</p>
        </HintBox>
      )}

      {/* Feedback status on submit */}
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

      {/* Full Detailed Solution AFTER submission */}
      {state.isSubmitted && (
        <SubBlock className="space-y-2">
          <strong className="block font-extrabold text-base text-theme-text">📖 Подробное решение</strong>
          <div className="text-sm leading-relaxed whitespace-pre-line text-theme-text">
            {taskData.explanation}
          </div>
        </SubBlock>
      )}
    </div>
  );
};

// Task Module Export

export const task5: TaskModule = {
  id: 5,
  title: 'Анализ алгоритмов для исполнителей',
  description: 'Линейные алгоритмы, поиски программ и параметров команд.',
  topics: ['Линейные алгоритмы', 'Формальные исполнители'], // TODO: уточнить формулировки
  maxPoints: 1,

  generate: (difficulty: Difficulty, rng: RNG): Task5Data => {
    if (difficulty === 1) {
      return generateLevel1(rng);
    } else if (difficulty === 2) {
      return generateLevel2(rng);
    } else {
      return generateLevel3(rng);
    }
  },

  render: (taskData, state) => {
    return <Task5Renderer taskData={taskData} state={state} />;
  },

  check: (taskData, userAnswer) => {
    return checkTask5(taskData, userAnswer);
  }
};

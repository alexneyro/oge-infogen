import React, { useState } from 'react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { RNG } from '../utils/rng';
import {
  StatementBlock,
  StatementText,
  StatementQuestion,
  SubBlock,
  BlockLabel,
  AnswerField,
  AnswerChip,
  VerdictBox,
  HintBox,
} from '../components/task-ui';

export type Language = 'Python' | 'Паскаль' | 'Алгоритмический' | 'Бейсик' | 'С++';
export const LANGUAGES: Language[] = ['Python', 'Паскаль', 'Алгоритмический', 'Бейсик', 'С++'];

export type ComparisonOp = '>' | '<' | '>=' | '<=' | '==' | '!=';
export type LogicalOp = 'or' | 'and';

export interface Clause {
  variable: 's' | 't';
  arith?: {
    op: '%' | '//';
    operand: number | 's' | 't';
  };
  op: ComparisonOp;
  value: number | 'A' | 's' | 't';
}

export interface ProgramModel {
  clause1: Clause;
  clause2?: Clause;
  logicalOp?: LogicalOp;
}

export function formatClauseIndex(clause: Clause): string {
  const varStr = clause.variable === 's' ? 'i[0]' : 'i[1]';
  let lhs = varStr;
  if (clause.arith) {
    let operandStr: string;
    if (typeof clause.arith.operand === 'number') {
      operandStr = String(clause.arith.operand);
    } else {
      operandStr = clause.arith.operand === 's' ? 'i[0]' : 'i[1]';
    }
    lhs = `(${varStr} ${clause.arith.op} ${operandStr})`;
  }
  let valStr: string;
  if (typeof clause.value === 'number') {
    valStr = String(clause.value);
  } else if (clause.value === 'A') {
    valStr = 'A';
  } else {
    valStr = clause.value === 's' ? 'i[0]' : 'i[1]';
  }
  return `${lhs} ${clause.op} ${valStr}`;
}

export function formatConditionIndex(model: ProgramModel): string {
  const c1 = formatClauseIndex(model.clause1);
  if (!model.clause2 || !model.logicalOp) {
    return c1;
  }
  const c2 = formatClauseIndex(model.clause2);
  const op = model.logicalOp === 'or' ? 'or' : 'and';
  return `(${c1}) ${op} (${c2})`;
}

export function formatClause(clause: Clause, lang: Language = 'Python'): string {
  const varStr = clause.variable;
  let lhs: string = varStr;
  if (clause.arith) {
    let arithOpStr = '';
    if (clause.arith.op === '%') {
      if (lang === 'Паскаль' || lang === 'Алгоритмический' || lang === 'Бейсик') {
        arithOpStr = 'mod';
      } else {
        arithOpStr = '%';
      }
    } else if (clause.arith.op === '//') {
      if (lang === 'Паскаль' || lang === 'Алгоритмический') {
        arithOpStr = 'div';
      } else if (lang === 'Бейсик') {
        arithOpStr = '\\';
      } else if (lang === 'С++') {
        arithOpStr = '/';
      } else {
        arithOpStr = '//';
      }
    }
    const operandStr = typeof clause.arith.operand === 'number' ? String(clause.arith.operand) : clause.arith.operand;
    lhs = `(${varStr} ${arithOpStr} ${operandStr})`;
  }

  let opStr: string = clause.op;
  if (clause.op === '==') {
    if (lang === 'Python' || lang === 'С++') {
      opStr = '==';
    } else {
      opStr = '=';
    }
  } else if (clause.op === '!=') {
    if (lang === 'Python' || lang === 'С++') {
      opStr = '!=';
    } else {
      opStr = '<>';
    }
  } else if (clause.op === '>=') {
    opStr = lang === 'Алгоритмический' ? '≥' : '>=';
  } else if (clause.op === '<=') {
    opStr = lang === 'Алгоритмический' ? '≤' : '<=';
  }

  const valStr = typeof clause.value === 'number' ? String(clause.value) : String(clause.value);

  return `${lhs} ${opStr} ${valStr}`;
}

export function formatCondition(model: ProgramModel, lang: Language): string {
  const c1 = formatClause(model.clause1, lang);
  if (!model.clause2 || !model.logicalOp) {
    return c1;
  }
  const c2 = formatClause(model.clause2, lang);

  switch (lang) {
    case 'Python': {
      const op = model.logicalOp === 'or' ? 'or' : 'and';
      return `(${c1}) ${op} (${c2})`;
    }
    case 'Паскаль': {
      const op = model.logicalOp === 'or' ? 'or' : 'and';
      return `(${c1}) ${op} (${c2})`;
    }
    case 'Алгоритмический': {
      const op = model.logicalOp === 'or' ? 'или' : 'и';
      return `(${c1}) ${op} (${c2})`;
    }
    case 'Бейсик': {
      const op = model.logicalOp === 'or' ? 'OR' : 'AND';
      return `(${c1}) ${op} (${c2})`;
    }
    case 'С++': {
      const op = model.logicalOp === 'or' ? '||' : '&&';
      return `((${c1}) ${op} (${c2}))`;
    }
  }
}

export function renderProgram(model: ProgramModel, lang: Language): string {
  const cond = formatCondition(model, lang);

  switch (lang) {
    case 'Python':
      return `s = int(input())
t = int(input())
if ${cond}:
    print("YES")
else:
    print("NO")`;

    case 'Паскаль':
      return `var s, t: integer;
begin
  readln(s);
  readln(t);
  if ${cond} then
    writeln('YES')
  else
    writeln('NO')
end.`;

    case 'Алгоритмический':
      return `алг
нач
  цел s, t
  ввод s, t
  если ${cond} то
    вывод "YES"
  иначе
    вывод "NO"
  все
кон`;

    case 'Бейсик':
      return `DIM s, t AS INTEGER
INPUT s
INPUT t
IF ${cond} THEN
  PRINT "YES"
ELSE
  PRINT "NO"
ENDIF`;

    case 'С++':
      return `#include <iostream>
using namespace std;

int main() {
    int s, t;
    cin >> s >> t;
    if ${cond}
        cout << "YES";
    else
        cout << "NO";
    return 0;
}`;
  }
}

export function evalClause(clause: Clause, s: number, t: number, A: number): boolean {
  let val = clause.variable === 's' ? s : t;
  if (clause.arith) {
    let m: number;
    if (typeof clause.arith.operand === 'number') {
      m = clause.arith.operand;
    } else {
      m = clause.arith.operand === 's' ? s : t;
    }
    if (m === 0) return false;
    if (clause.arith.op === '%') {
      val = ((val % m) + m) % m;
    } else if (clause.arith.op === '//') {
      val = Math.floor(val / m);
    }
  }
  let target: number;
  if (typeof clause.value === 'number') {
    target = clause.value;
  } else if (clause.value === 'A') {
    target = A;
  } else {
    target = clause.value === 's' ? s : t;
  }
  switch (clause.op) {
    case '>': return val > target;
    case '<': return val < target;
    case '>=': return val >= target;
    case '<=': return val <= target;
    case '==': return val === target;
    case '!=': return val !== target;
  }
}

export function evalModel(model: ProgramModel, s: number, t: number, A: number): boolean {
  const res1 = evalClause(model.clause1, s, t, A);
  if (!model.clause2 || !model.logicalOp) return res1;
  const res2 = evalClause(model.clause2, s, t, A);
  if (model.logicalOp === 'or') return res1 || res2;
  return res1 && res2;
}

function getArithDescription(clause: Clause): string {
  if (!clause.arith) return '';
  const v = clause.variable;
  const k = clause.arith.operand;
  if (clause.arith.op === '%') {
    if (typeof k === 'number') {
      if (k === 2 && clause.op === '==' && clause.value === 0) {
        return `"${v} % 2 == 0" означает, что число ${v} чётное`;
      }
      if (k === 2 && clause.op === '==' && clause.value === 1) {
        return `"${v} % 2 == 1" означает, что число ${v} нечётное`;
      }
      if (clause.op === '==' && clause.value === 0) {
        return `"${v} % ${k} == 0" означает, что число ${v} делится на ${k} без остатка`;
      }
      if (clause.op === '!=' && clause.value === 0) {
        return `"${v} % ${k} != 0" означает, что число ${v} не делится на ${k} нацело`;
      }
      return `"${v} % ${k}" — остаток от деления числа ${v} на ${k}`;
    } else {
      return `"${v} % ${k}" — остаток от деления числа ${v} на ${k}`;
    }
  } else if (clause.arith.op === '//') {
    return `"${v} // ${k}" — результат целочисленного деления числа ${v} на ${k}`;
  }
  return '';
}

const makeSimpleClause = (varName: 's' | 't', rng?: RNG): Clause => {
  const ops: ComparisonOp[] = ['>', '<', '>=', '<=', '==', '!='];
  const op = rng ? rng.pick(ops) : ops[Math.floor(Math.random() * ops.length)];
  const otherVar = varName === 's' ? 't' : 's';
  const compareWithVar = rng ? rng.next() < 0.35 : Math.random() < 0.35;
  if (compareWithVar) {
    return { variable: varName, op, value: otherVar };
  } else {
    const val = rng ? rng.int(0, 15) : Math.floor(Math.random() * 16); // 0..15
    return { variable: varName, op, value: val };
  }
};

const makeArithClauseLevel1 = (varName: 's' | 't', rng?: RNG): Clause => {
  const ops: ComparisonOp[] = ['>', '<', '>=', '<=', '==', '!='];
  const otherVar = varName === 's' ? 't' : 's';
  const arithOp: '%' | '//' = (rng ? rng.next() : Math.random()) < 0.5 ? '%' : '//';

  const useVarOperand = (rng ? rng.next() : Math.random()) < 0.35;

  if (useVarOperand) {
    if (arithOp === '%') {
      const op = (rng ? rng.next() : Math.random()) < 0.6
        ? ((rng ? rng.next() : Math.random()) < 0.5 ? '==' : '!=')
        : (rng ? rng.pick(ops) : ops[Math.floor(Math.random() * ops.length)]);
      const val = rng ? rng.int(0, 3) : Math.floor(Math.random() * 4); // 0..3
      return { variable: varName, arith: { op: '%', operand: otherVar }, op, value: val };
    } else {
      const op = rng ? rng.pick(ops) : ops[Math.floor(Math.random() * ops.length)];
      const val = rng ? rng.int(1, 4) : Math.floor(Math.random() * 4) + 1; // 1..4
      return { variable: varName, arith: { op: '//', operand: otherVar }, op, value: val };
    }
  } else {
    const kList = [2, 3, 4, 5];
    const k = rng ? rng.pick(kList) : kList[Math.floor(Math.random() * 4)];
    if (arithOp === '%') {
      const op = (rng ? rng.next() : Math.random()) < 0.7 ? '==' : '!=';
      const val = (rng ? rng.next() : Math.random()) < 0.5 ? 0 : (op === '==' && k === 2 ? 1 : (rng ? rng.int(0, k - 1) : Math.floor(Math.random() * k)));
      return { variable: varName, arith: { op: '%', operand: k }, op, value: val };
    } else {
      const op = rng ? rng.pick(ops) : ops[Math.floor(Math.random() * ops.length)];
      const val = rng ? rng.int(1, 5) : Math.floor(Math.random() * 5) + 1; // 1..5
      return { variable: varName, arith: { op: '//', operand: k }, op, value: val };
    }
  }
};

const generateLevel1 = (rng: RNG) => {
  const logicalOps: LogicalOp[] = ['or', 'and'];

  let model: ProgramModel = { clause1: { variable: 's', op: '>', value: 10 } };
  let pairs: [number, number][] = [];
  let target: 'YES' | 'NO' = 'YES';
  let targetCount = 0;

  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    const singleClause = rng.next() < 0.2;
    if (singleClause) {
      const useArith = rng.next() < 0.5;
      const clause1 = useArith ? makeArithClauseLevel1('s', rng) : makeSimpleClause('s', rng);
      model = { clause1 };
    } else {
      const arithChoice = rng.next();
      const logOp = rng.pick(logicalOps);
      if (arithChoice < 0.4) {
        const clause1 = makeArithClauseLevel1('s', rng);
        const clause2 = makeSimpleClause('t', rng);
        model = { clause1, clause2, logicalOp: logOp };
      } else if (arithChoice < 0.8) {
        const clause1 = makeSimpleClause('s', rng);
        const clause2 = makeArithClauseLevel1('t', rng);
        model = { clause1, clause2, logicalOp: logOp };
      } else {
        const clause1 = makeSimpleClause('s', rng);
        const clause2 = makeSimpleClause('t', rng);
        model = { clause1, clause2, logicalOp: logOp };
      }
    }

    const hasArith = Boolean(model.clause1.arith || model.clause2?.arith);

    const sIsDivisor = (model.clause1.arith?.operand === 's') || (model.clause2?.arith?.operand === 's');
    const tIsDivisor = (model.clause1.arith?.operand === 't') || (model.clause2?.arith?.operand === 't');

    const usesConstDivS = (model.clause1.variable === 's' && model.clause1.arith?.op === '//' && typeof model.clause1.arith.operand === 'number') ||
                         (model.clause2?.variable === 's' && model.clause2?.arith?.op === '//' && typeof model.clause2.arith.operand === 'number');
    const usesConstDivT = (model.clause1.variable === 't' && model.clause1.arith?.op === '//' && typeof model.clause1.arith.operand === 'number') ||
                         (model.clause2?.variable === 't' && model.clause2?.arith?.op === '//' && typeof model.clause2.arith.operand === 'number');

    target = rng.next() < 0.5 ? 'YES' : 'NO';

    let pairAttempts = 0;
    let validPairsFound = false;

    while (pairAttempts < 50) {
      pairAttempts++;
      const numPairs = 9;
      pairs = [];

      for (let i = 0; i < numPairs; i++) {
        let s: number;
        let t: number;

        if (!hasArith) {
          s = rng.int(-10, 15);
          t = rng.int(-10, 15);
        } else {
          if (sIsDivisor) {
            s = rng.int(1, 15);
          } else if (usesConstDivS) {
            s = rng.int(0, 20);
          } else {
            s = rng.int(0, 15);
          }

          if (tIsDivisor) {
            t = rng.int(1, 15);
          } else if (usesConstDivT) {
            t = rng.int(0, 20);
          } else {
            t = rng.int(0, 15);
          }
        }

        pairs.push([s, t]);
      }

      // Branch coverage check
      let c1TrueCount = 0;
      let c2TrueCount = 0;
      for (const [s, t] of pairs) {
        if (evalClause(model.clause1, s, t, 0)) c1TrueCount++;
        if (model.clause2 && evalClause(model.clause2, s, t, 0)) c2TrueCount++;
      }

      if (c1TrueCount === 0 || c1TrueCount === 9) continue;
      if (model.clause2 && (c2TrueCount === 0 || c2TrueCount === 9)) continue;

      let yesCount = 0;
      for (const [s, t] of pairs) {
        if (evalModel(model, s, t, 0)) {
          yesCount++;
        }
      }
      const noCount = pairs.length - yesCount;
      targetCount = target === 'YES' ? yesCount : noCount;

      if (yesCount > 0 && noCount > 0 && targetCount > 0) {
        validPairsFound = true;
        break;
      }
    }

    if (validPairsFound) {
      break;
    }
  }

  const pairsFormatted = pairs.map(([s, t]) => `(${s}, ${t})`).join('; ');
  const pairsStr = pairs.map(([s, t]) => `(${s}, ${t})`).join(', ');
  const correctAnswer = String(targetCount);

  const statementIntro = 'Ниже на пяти языках программирования записан один и тот же алгоритм:';
  const questionStr = `Было проведено ${pairs.length} запусков программы, при которых в качестве параметров s и t вводились следующие пары чисел:\n${pairsFormatted}\n\nСколько раз программа выведет "${target}"?`;

  const shortHint = `Для каждого из ${pairs.length} запусков с парой чисел (s, t) подставьте s и t в условие программы. Если условие истинно, программа печатает "YES", иначе — "NO". Посчитайте количество запусков, давших результат "${target}".`;

  const breakdownLines: string[] = [];
  breakdownLines.push(`Проверим условие для каждой из ${pairs.length} пар чисел:\n`);

  if (model.clause1.arith || (model.clause2 && model.clause2.arith)) {
    breakdownLines.push(`Пояснение к операторам:`);
    if (model.clause1.arith) {
      const desc = getArithDescription(model.clause1);
      if (desc) breakdownLines.push(`- ${desc}`);
    }
    if (model.clause2 && model.clause2.arith) {
      const desc = getArithDescription(model.clause2);
      if (desc) breakdownLines.push(`- ${desc}`);
    }
    breakdownLines.push(``);
  }

  for (let i = 0; i < pairs.length; i++) {
    const [s, t] = pairs[i];
    const c1 = evalClause(model.clause1, s, t, 0);
    const c2 = model.clause2 ? evalClause(model.clause2, s, t, 0) : true;
    const res = evalModel(model, s, t, 0);
    const output = res ? 'YES' : 'NO';
    const isTarget = output === target;

    const opRu = model.logicalOp === 'or' ? 'ИЛИ' : 'И';

    let c1Str = formatClause(model.clause1, 'Python');
    c1Str = c1Str.replace(/\bs\b/g, String(s)).replace(/\bt\b/g, String(t));

    let c2Str = model.clause2 ? formatClause(model.clause2, 'Python') : '';
    if (c2Str) {
      c2Str = c2Str.replace(/\bs\b/g, String(s)).replace(/\bt\b/g, String(t));
    }

    breakdownLines.push(
      `${i + 1}) Пара (${s}, ${t}): ` +
      `${c1Str} [${c1 ? 'истина' : 'ложь'}] ` +
      `${model.clause2 ? `${opRu} ${c2Str} [${c2 ? 'истина' : 'ложь'}] ` : ''}` +
      `=> результат: ${output} ${isTarget ? '✓' : ''}`
    );
  }

  breakdownLines.push(`\nВсего выведено "${target}": ${correctAnswer} раз(а).`);

  const condIndex = formatConditionIndex(model);
  const ifCond = target === 'YES' ? condIndex : `not (${condIndex})`;
  const pythonSnippet = 
`x = [${pairsStr}]  # пары чисел (s, t)
cnt = 0
for i in x:  # i[0] — это s, i[1] — это t
    if ${ifCond}:
        cnt += 1
print(cnt)`;

  const hint = breakdownLines.join('\n') + `\n\n--- Решение перебором на Python ---\n\n` + pythonSnippet;

  return {
    level: 1,
    model,
    pairs,
    pairsStr,
    target,
    correctAnswer,
    statementIntro,
    questionStr,
    shortHint,
    hint,
    pythonSnippet
  };
};

type Level2QuestionType = 'count' | 'max' | 'min';

const generateLevel2 = (rng: RNG) => {
  const ops: ComparisonOp[] = ['>', '<', '>=', '<='];
  const logicalOps: LogicalOp[] = ['or', 'and'];
  const questionTypes: Level2QuestionType[] = ['count', 'max', 'min'];

  let model: ProgramModel = { clause1: { variable: 's', op: '>', value: 10 } };
  let pairs: [number, number][] = [];
  let target: 'YES' | 'NO' = 'YES';
  let questionType: Level2QuestionType = 'count';
  let N = 3;
  let validAs: number[] = [];
  let correctAnswer = '';

  let attempts = 0;
  while (attempts < 300) {
    attempts++;

    const aInSecondClause = rng.next() < 0.7;
    const constVar = aInSecondClause ? 's' : 't';
    const aVar = aInSecondClause ? 't' : 's';

    const opConst = rng.pick(ops);
    const opA = rng.pick(ops);
    const valConst = rng.int(4, 15); // 4..15
    const logOp = rng.pick(logicalOps);

    const clauseConst: Clause = { variable: constVar, op: opConst, value: valConst };
    const clauseA: Clause = { variable: aVar, op: opA, value: 'A' };

    model = aInSecondClause
      ? { clause1: clauseConst, clause2: clauseA, logicalOp: logOp }
      : { clause1: clauseA, clause2: clauseConst, logicalOp: logOp };

    const useNegatives = rng.next() < 0.45;

    target = rng.next() < 0.5 ? 'YES' : 'NO';
    questionType = rng.pick(questionTypes);
    N = rng.int(2, 7); // 2..7

    let pairAttempts = 0;
    let validModelPairsFound = false;

    while (pairAttempts < 50) {
      pairAttempts++;

      pairs = [];
      for (let i = 0; i < 9; i++) {
        let s: number;
        let t: number;
        if (useNegatives) {
          s = rng.int(-10, 15);
          t = rng.int(-10, 15);
        } else {
          s = rng.int(1, 22);
          t = rng.int(1, 22);
        }
        pairs.push([s, t]);
      }

      validAs = [];
      for (let A = -200; A <= 200; A++) {
        let matches = 0;
        for (const [s, t] of pairs) {
          const isYes = evalModel(model, s, t, A);
          if ((target === 'YES' && isYes) || (target === 'NO' && !isYes)) {
            matches++;
          }
        }
        if (matches === N) {
          validAs.push(A);
        }
      }

      if (validAs.length === 0) continue;

      const includesMinBoundary = validAs.includes(-200);
      const includesMaxBoundary = validAs.includes(200);

      let currentAns = '';
      let refA: number | null = null;

      if (questionType === 'count') {
        if (includesMinBoundary || includesMaxBoundary) continue;
        if (validAs.length < 1 || validAs.length > 10) continue;
        currentAns = String(validAs.length);
        refA = validAs[0];
      } else if (questionType === 'max') {
        if (includesMaxBoundary) continue;
        const maxA = Math.max(...validAs);
        currentAns = String(maxA);
        refA = maxA;
      } else if (questionType === 'min') {
        if (includesMinBoundary) continue;
        const minA = Math.min(...validAs);
        currentAns = String(minA);
        refA = minA;
      }

      if (refA === null) continue;

      // Branch coverage check on refA
      let c1TrueCount = 0;
      let c2TrueCount = 0;
      for (const [s, t] of pairs) {
        if (evalClause(model.clause1, s, t, refA)) c1TrueCount++;
        if (model.clause2 && evalClause(model.clause2, s, t, refA)) c2TrueCount++;
      }

      if (c1TrueCount === 0 || c1TrueCount === 9) continue;
      if (model.clause2 && (c2TrueCount === 0 || c2TrueCount === 9)) continue;

      correctAnswer = currentAns;
      validModelPairsFound = true;
      break;
    }

    if (validModelPairsFound) {
      break;
    }
  }

  const pairsFormatted = pairs.map(([s, t]) => `(${s}, ${t})`).join('; ');
  const pairsStr = pairs.map(([s, t]) => `(${s}, ${t})`).join(', ');

  let questionTypeName = '';
  if (questionType === 'count') {
    questionTypeName = `Укажите количество целых значений A, при которых программа выведет "${target}" ровно ${N} раз(а).`;
  } else if (questionType === 'max') {
    questionTypeName = `Укажите наибольшее целое значение A, при котором программа выведет "${target}" ровно ${N} раз(а).`;
  } else {
    questionTypeName = `Укажите наименьшее целое значение A, при котором программа выведет "${target}" ровно ${N} раз(а).`;
  }

  const statementIntro = 'Ниже на пяти языках программирования записан один и тот же алгоритм:';
  const questionStr = `Было проведено 9 запусков программы, при которых в качестве параметров s и t вводились следующие пары чисел:\n${pairsFormatted}\n\n${questionTypeName}`;

  const shortHint = `Определите, какие из 9 пар дают результат "${target}" независимо от значения A, а для остальных пар найдите условие на A. Подберите параметр A так, чтобы получилось ровно ${N} совпадений.`;

  const pythonCond = formatCondition(model, 'Python');
  
  const alwaysMatches: string[] = [];
  const neverMatches: string[] = [];
  const dependsOnA: string[] = [];

  for (let i = 0; i < pairs.length; i++) {
    const [s, t] = pairs[i];
    
    const resLow = evalModel(model, s, t, -1000);
    const resHigh = evalModel(model, s, t, 1000);
    const targetLow = target === 'YES' ? resLow : !resLow;
    const targetHigh = target === 'YES' ? resHigh : !resHigh;

    if (targetLow && targetHigh) {
      alwaysMatches.push(`(${s}, ${t})`);
    } else if (!targetLow && !targetHigh) {
      neverMatches.push(`(${s}, ${t})`);
    } else {
      dependsOnA.push(`(${s}, ${t})`);
    }
  }

  const explanationLines: string[] = [];
  explanationLines.push(`ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n`);
  explanationLines.push(`Условие программы (Python): ${pythonCond}`);
  explanationLines.push(`Целевой результат: ровно ${N} раз(а) выводится "${target}".\n`);

  explanationLines.push(`1) Анализ 9 пар чисел:`);
  explanationLines.push(`   - Пары, которые ВСЕГДА выводят "${target}" (независимо от A): ${alwaysMatches.length > 0 ? alwaysMatches.join(', ') : 'нет'}`);
  explanationLines.push(`   - Пары, которые НИКОГДА не выводят "${target}": ${neverMatches.length > 0 ? neverMatches.join(', ') : 'нет'}`);
  explanationLines.push(`   - Пары, вывод которых зависит от значения A: ${dependsOnA.length > 0 ? dependsOnA.join(', ') : 'нет'}\n`);

  explanationLines.push(`2) Поиск подходящих значений A:`);
  explanationLines.push(`   Проверив диапазон возможных значений A, находим все целые A, при которых ровно ${N} пар дают результат "${target}".`);
  explanationLines.push(`   Множество подходящих значений A: [${validAs.slice(0, 15).join(', ')}${validAs.length > 15 ? ', ...' : ''}]`);

  if (questionType === 'count') {
    explanationLines.push(`   Вопрос требует найти КОЛИЧЕСТВО таких значений A.`);
    explanationLines.push(`   Всего подходящих значений: ${validAs.length}.`);
  } else if (questionType === 'max') {
    explanationLines.push(`   Вопрос требует найти НАИБОЛЬШЕЕ из этих значений A.`);
    explanationLines.push(`   Максимальное A: ${Math.max(...validAs)}.`);
  } else {
    explanationLines.push(`   Вопрос требует найти НАИМЕНЬШЕЕ из этих значений A.`);
    explanationLines.push(`   Минимальное A: ${Math.min(...validAs)}.`);
  }

  explanationLines.push(`\nПравильный ответ: ${correctAnswer}`);

  const condIndex = formatConditionIndex(model);
  const ifCond = target === 'YES' ? condIndex : `not (${condIndex})`;

  let pythonSnippet = '';
  if (questionType === 'count') {
    pythonSnippet =
`x = [${pairsStr}]  # пары чисел (s, t)
valid_A = []  # список подходящих значений A
for A in range(-200, 201):  # перебираем возможные A
    cnt = 0
    for i in x:  # i[0] — это s, i[1] — это t
        if ${ifCond}:
            cnt += 1
    if cnt == ${N}:
        valid_A.append(A)

print(len(valid_A))`;
  } else if (questionType === 'max') {
    pythonSnippet =
`x = [${pairsStr}]  # пары чисел (s, t)
result = -200  # для наибольшего A
for A in range(-200, 201):  # перебираем возможные A
    cnt = 0
    for i in x:  # i[0] — это s, i[1] — это t
        if ${ifCond}:
            cnt += 1
    if cnt == ${N}:
        result = max(result, A)  # обновляем максимальное A

print(result)`;
  } else {
    pythonSnippet =
`x = [${pairsStr}]  # пары чисел (s, t)
result = 200  # для наименьшего A
for A in range(-200, 201):  # перебираем возможные A
    cnt = 0
    for i in x:  # i[0] — это s, i[1] — это t
        if ${ifCond}:
            cnt += 1
    if cnt == ${N}:
        result = min(result, A)  # обновляем минимальное A

print(result)`;
  }

  const hint = explanationLines.join('\n') + `\n\n--- Решение перебором на Python ---\n\n` + pythonSnippet;

  return {
    level: 2,
    model,
    pairs,
    pairsStr,
    target,
    N,
    questionType,
    correctAnswer,
    statementIntro,
    questionStr,
    shortHint,
    hint,
    pythonSnippet
  };
};

const generateLevel3 = (rng: RNG) => {
  const ops: ComparisonOp[] = ['>', '<', '>=', '<=', '==', '!='];
  const logicalOps: LogicalOp[] = ['or', 'and'];
  const questionTypes: Level2QuestionType[] = ['count', 'max', 'min'];

  let model: ProgramModel = { clause1: { variable: 's', op: '>', value: 10 } };
  let pairs: [number, number][] = [];
  let target: 'YES' | 'NO' = 'YES';
  let questionType: Level2QuestionType = 'count';
  let N = 3;
  let validAs: number[] = [];
  let correctAnswer = '';

  let attempts = 0;
  while (attempts < 300) {
    attempts++;

    const aInSecondClause = rng.next() < 0.5;
    const constVar = aInSecondClause ? 's' : 't';
    const aVar = aInSecondClause ? 't' : 's';

    const constHasArith = rng.next() < 0.6;
    const aHasArith = constHasArith ? (rng.next() < 0.4) : true;

    const makeClause = (varName: 's' | 't', isA: boolean, hasArith: boolean): Clause => {
      if (!hasArith) {
        const op = rng.pick(ops);
        const val = isA ? 'A' : rng.int(1, 20);
        return { variable: varName, op, value: val };
      }

      const arithOp: '%' | '//' = rng.next() < 0.5 ? '%' : '//';
      if (arithOp === '%') {
        const kList = [2, 3, 4, 5];
        const k = rng.pick(kList);
        if (isA) {
          const op = rng.next() < 0.7 ? '==' : rng.pick(ops);
          return { variable: varName, arith: { op: '%', operand: k }, op, value: 'A' };
        } else {
          const op = rng.next() < 0.7 ? '==' : '!=';
          const val = rng.next() < 0.5 ? 0 : rng.int(0, k - 1);
          return { variable: varName, arith: { op: '%', operand: k }, op, value: val };
        }
      } else {
        const kList = [2, 3, 4, 5];
        const k = rng.pick(kList);
        const op = rng.pick(ops);
        const val = isA ? 'A' : rng.int(1, 8);
        return { variable: varName, arith: { op: '//', operand: k }, op, value: val };
      }
    };

    const clauseConst = makeClause(constVar, false, constHasArith);
    const clauseA = makeClause(aVar, true, aHasArith);
    const logOp = rng.pick(logicalOps);

    model = aInSecondClause
      ? { clause1: clauseConst, clause2: clauseA, logicalOp: logOp }
      : { clause1: clauseA, clause2: clauseConst, logicalOp: logOp };

    const hasArith = Boolean(clauseConst.arith || clauseA.arith);
    const useNegatives = !hasArith && (rng.next() < 0.45);

    const sIsDivisor = (clauseConst.arith?.operand === 's') || (clauseA.arith?.operand === 's');
    const tIsDivisor = (clauseConst.arith?.operand === 't') || (clauseA.arith?.operand === 't');

    target = rng.next() < 0.5 ? 'YES' : 'NO';
    questionType = rng.pick(questionTypes);
    N = rng.int(2, 7); // 2..7

    let pairAttempts = 0;
    let validModelPairsFound = false;

    while (pairAttempts < 50) {
      pairAttempts++;

      pairs = [];
      for (let i = 0; i < 9; i++) {
        let s: number;
        let t: number;
        if (!hasArith) {
          if (useNegatives) {
            s = rng.int(-10, 15);
            t = rng.int(-10, 15);
          } else {
            s = rng.int(1, 22);
            t = rng.int(1, 22);
          }
        } else {
          if (sIsDivisor) {
            s = rng.int(1, 15);
          } else {
            s = rng.int(0, 20);
          }

          if (tIsDivisor) {
            t = rng.int(1, 15);
          } else {
            t = rng.int(0, 20);
          }
        }
        pairs.push([s, t]);
      }

      validAs = [];
      for (let A = -200; A <= 200; A++) {
        let matches = 0;
        for (const [s, t] of pairs) {
          const isYes = evalModel(model, s, t, A);
          if ((target === 'YES' && isYes) || (target === 'NO' && !isYes)) {
            matches++;
          }
        }
        if (matches === N) {
          validAs.push(A);
        }
      }

      if (validAs.length === 0) continue;

      const includesMinBoundary = validAs.includes(-200);
      const includesMaxBoundary = validAs.includes(200);

      let currentAns = '';
      let refA: number | null = null;

      if (questionType === 'count') {
        if (includesMinBoundary || includesMaxBoundary) continue;
        if (validAs.length < 1 || validAs.length > 10) continue;
        currentAns = String(validAs.length);
        refA = validAs[0];
      } else if (questionType === 'max') {
        if (includesMaxBoundary) continue;
        const maxA = Math.max(...validAs);
        currentAns = String(maxA);
        refA = maxA;
      } else if (questionType === 'min') {
        if (includesMinBoundary) continue;
        const minA = Math.min(...validAs);
        currentAns = String(minA);
        refA = minA;
      }

      if (refA === null) continue;

      // Branch coverage check on refA
      let c1TrueCount = 0;
      let c2TrueCount = 0;
      for (const [s, t] of pairs) {
        if (evalClause(model.clause1, s, t, refA)) c1TrueCount++;
        if (model.clause2 && evalClause(model.clause2, s, t, refA)) c2TrueCount++;
      }

      if (c1TrueCount === 0 || c1TrueCount === 9) continue;
      if (model.clause2 && (c2TrueCount === 0 || c2TrueCount === 9)) continue;

      correctAnswer = currentAns;
      validModelPairsFound = true;
      break;
    }

    if (validModelPairsFound) {
      break;
    }
  }

  const pairsFormatted = pairs.map(([s, t]) => `(${s}, ${t})`).join('; ');
  const pairsStr = pairs.map(([s, t]) => `(${s}, ${t})`).join(', ');

  let questionTypeName = '';
  if (questionType === 'count') {
    questionTypeName = `Укажите количество целых значений A, при которых программа выведет "${target}" ровно ${N} раз(а).`;
  } else if (questionType === 'max') {
    questionTypeName = `Укажите наибольшее целое значение A, при котором программа выведет "${target}" ровно ${N} раз(а).`;
  } else {
    questionTypeName = `Укажите наименьшее целое значение A, при котором программа выведет "${target}" ровно ${N} раз(а).`;
  }

  const statementIntro = 'Ниже на пяти языках программирования записан один и тот же алгоритм:';
  const questionStr = `Было проведено 9 запусков программы, при которых в качестве параметров s и t вводились следующие пары чисел:\n${pairsFormatted}\n\n${questionTypeName}`;

  const shortHint = `Определите, какие из 9 пар дают результат "${target}" независимо от значения A, а для остальных пар найдите условие на A (с учётом остатка от деления или целочисленного деления). Подберите параметр A так, чтобы получилось ровно ${N} совпадений.`;

  const pythonCond = formatCondition(model, 'Python');

  const alwaysMatches: string[] = [];
  const neverMatches: string[] = [];
  const dependsOnA: string[] = [];

  for (let i = 0; i < pairs.length; i++) {
    const [s, t] = pairs[i];
    const resLow = evalModel(model, s, t, -1000);
    const resHigh = evalModel(model, s, t, 1000);
    const targetLow = target === 'YES' ? resLow : !resLow;
    const targetHigh = target === 'YES' ? resHigh : !resHigh;

    if (targetLow && targetHigh) {
      alwaysMatches.push(`(${s}, ${t})`);
    } else if (!targetLow && !targetHigh) {
      neverMatches.push(`(${s}, ${t})`);
    } else {
      dependsOnA.push(`(${s}, ${t})`);
    }
  }

  const explanationLines: string[] = [];
  explanationLines.push(`ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n`);
  explanationLines.push(`Условие программы (Python): ${pythonCond}`);
  explanationLines.push(`Целевой результат: ровно ${N} раз(а) выводится "${target}".\n`);

  explanationLines.push(`1) Пояснение к условным операторам:`);
  if (model.clause1.arith) {
    const desc = getArithDescription(model.clause1);
    if (desc) explanationLines.push(`   - ${desc}`);
  }
  if (model.clause2 && model.clause2.arith) {
    const desc = getArithDescription(model.clause2);
    if (desc) explanationLines.push(`   - ${desc}`);
  }
  explanationLines.push(``);

  explanationLines.push(`2) Анализ 9 пар чисел:`);
  explanationLines.push(`   - Пары, которые ВСЕГДА выводят "${target}" (независимо от A): ${alwaysMatches.length > 0 ? alwaysMatches.join(', ') : 'нет'}`);
  explanationLines.push(`   - Пары, которые НИКОГДА не выводят "${target}": ${neverMatches.length > 0 ? neverMatches.join(', ') : 'нет'}`);
  explanationLines.push(`   - Пары, вывод которых зависит от значения A: ${dependsOnA.length > 0 ? dependsOnA.join(', ') : 'нет'}\n`);

  explanationLines.push(`3) Поиск подходящих значений A:`);
  explanationLines.push(`   Проверив диапазон возможных значений A, находим все целые A, при которых ровно ${N} пар дают результат "${target}".`);
  explanationLines.push(`   Множество подходящих значений A: [${validAs.slice(0, 15).join(', ')}${validAs.length > 15 ? ', ...' : ''}]`);

  if (questionType === 'count') {
    explanationLines.push(`   Вопрос требует найти КОЛИЧЕСТВО таких значений A.`);
    explanationLines.push(`   Всего подходящих значений: ${validAs.length}.`);
  } else if (questionType === 'max') {
    explanationLines.push(`   Вопрос требует найти НАИБОЛЬШЕЕ из этих значений A.`);
    explanationLines.push(`   Максимальное A: ${Math.max(...validAs)}.`);
  } else {
    explanationLines.push(`   Вопрос требует найти НАИМЕНЬШЕЕ из этих значений A.`);
    explanationLines.push(`   Минимальное A: ${Math.min(...validAs)}.`);
  }

  explanationLines.push(`\nПравильный ответ: ${correctAnswer}`);

  const condIndex = formatConditionIndex(model);
  const ifCond = target === 'YES' ? condIndex : `not (${condIndex})`;

  let pythonSnippet = '';
  if (questionType === 'count') {
    pythonSnippet =
`x = [${pairsStr}]  # пары чисел (s, t)
valid_A = []  # список подходящих значений A
for A in range(-200, 201):  # перебираем возможные A
    cnt = 0
    for i in x:  # i[0] — это s, i[1] — это t
        if ${ifCond}:
            cnt += 1
    if cnt == ${N}:
        valid_A.append(A)

print(len(valid_A))`;
  } else if (questionType === 'max') {
    pythonSnippet =
`x = [${pairsStr}]  # пары чисел (s, t)
result = -200  # для наибольшего A
for A in range(-200, 201):  # перебираем возможные A
    cnt = 0
    for i in x:  # i[0] — это s, i[1] — это t
        if ${ifCond}:
            cnt += 1
    if cnt == ${N}:
        result = max(result, A)  # обновляем максимальное A

print(result)`;
  } else {
    pythonSnippet =
`x = [${pairsStr}]  # пары чисел (s, t)
result = 200  # для наименьшего A
for A in range(-200, 201):  # перебираем возможные A
    cnt = 0
    for i in x:  # i[0] — это s, i[1] — это t
        if ${ifCond}:
            cnt += 1
    if cnt == ${N}:
        result = min(result, A)  # обновляем минимальное A

print(result)`;
  }

  const hint = explanationLines.join('\n') + `\n\n--- Решение перебором на Python ---\n\n` + pythonSnippet;

  return {
    level: 3,
    model,
    pairs,
    pairsStr,
    target,
    N,
    questionType,
    correctAnswer,
    statementIntro,
    questionStr,
    shortHint,
    hint,
    pythonSnippet
  };
};

const Task6Renderer: React.FC<{ taskData: any; state: TaskModuleState }> = ({ taskData, state }) => {
  const [selectedLang, setSelectedLang] = useState<Language>('Python');

  const codeText = renderProgram(taskData.model, selectedLang);

  return (
    <div className="space-y-4">
      <StatementBlock>
        <StatementText>
          {taskData.statementIntro}
        </StatementText>

        {/* Language Switcher Tabs & Code Container */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-md">
          <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 border-b border-slate-800">
            {LANGUAGES.map((lang) => {
              const isActive = selectedLang === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLang(lang)}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>

          <pre
            style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' }}
            className="p-4 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed text-slate-100 whitespace-pre"
          >
            {codeText}
          </pre>
        </div>

        <StatementQuestion>
          {taskData.questionStr}
        </StatementQuestion>
      </StatementBlock>

      <AnswerField
        label="Ваш ответ (число):"
        value={state.userAnswer}
        onChange={(val) => state.setUserAnswer(val)}
        disabled={state.isSubmitted}
        placeholder="Введите число…"
      />

      {state.showHints && !state.isSubmitted && (
        <HintBox>
          <strong className="block font-bold text-sm mb-1.5">💡 Подсказка:</strong>
          <p className="whitespace-pre-line leading-relaxed">{taskData.shortHint}</p>
        </HintBox>
      )}

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
        <SubBlock className="space-y-3">
          <strong className="block font-extrabold text-base text-theme-text">
            📖 Подробное решение (полный разбор):
          </strong>
          <pre
            style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "calt" 0' }}
            className="whitespace-pre-wrap font-mono text-xs sm:text-sm bg-theme-input-bg p-4 rounded-lg border border-theme-border overflow-x-auto text-theme-text leading-relaxed"
          >
            {taskData.hint}
          </pre>
        </SubBlock>
      )}
    </div>
  );
};

export const task6: TaskModule = {
  id: 6,
  title: 'Программа с условным оператором',
  description: 'Анализ работы программы с условными операторами и параметрами.',
  topics: ['Ветвление в алгоритмах', 'Анализ программ'], // TODO: уточнить формулировки
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
    return <Task6Renderer taskData={taskData} state={state} />;
  },

  check: (taskData, userAnswer) => {
    return taskData.correctAnswer.trim() === userAnswer.trim();
  }
};

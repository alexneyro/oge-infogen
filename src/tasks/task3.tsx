import React from 'react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { RNG } from '../utils/rng';
import {
  StatementBlock,
  StatementText,
  SubBlock,
  BlockLabel,
  AnswerField,
  AnswerChip,
  ChoiceButton,
  VerdictBox,
  HintBox,
} from '../components/task-ui';

export type RelationOp = '<' | '<=' | '>' | '>=' | '=' | '!=';
export type QuestionType = 'min' | 'max' | 'count';
export type DomainType = 'all' | 'natural' | 'two-digit' | 'three-digit';

export interface LeafNode {
  type: 'cmp' | 'parity' | 'div' | 'firstdigit';
  op?: RelationOp;
  k?: number;
  parity?: 'even' | 'odd';
  divK?: number;
  useMultipleWording?: boolean;
}

export interface InternalNode {
  type: 'and' | 'or' | 'not';
  children: LogicalNode[];
}

export type LogicalNode = LeafNode | InternalNode;

export interface TaskDomain {
  type: DomainType;
  label: string;
  rangeText: string;
  minX: number;
  maxX: number;
  filter: (x: number) => boolean;
}

export interface CombDetails {
  is3Digit: boolean;
  d1Desc: string;
  d1Count: number;
  d2Desc?: string;
  d2Count?: number;
  d3Desc: string;
  d3Count: number;
  totalCalc: string;
  step1Notes?: string[];
  d1Lines?: string[];
  d3Lines?: string[];
}

export interface Task3Data {
  statement: string;
  expressionText: string;
  domainLabel: string;
  questionType: QuestionType;
  wantTrue: boolean;
  correctAnswer: string;
  options?: string[];
  shortHint: string;
  explanation: string;
  combDetails?: CombDetails;
  tree?: LogicalNode;
}

// Pluralization helper for numbers: 1 «число», 2-4 «числа», 5-20 «чисел»
export function pluralNumbers(n: number): string {
  const absN = Math.abs(n);
  const rem100 = absN % 100;
  const rem10 = absN % 10;
  if (rem100 >= 11 && rem100 <= 14) {
    return `${n} чисел`;
  }
  if (rem10 === 1) {
    return `${n} число`;
  }
  if (rem10 >= 2 && rem10 <= 4) {
    return `${n} числа`;
  }
  return `${n} чисел`;
}

// Divisibility rule hint for k in {2, 3, 4, 5, 6, 9, 10}
export function divisibilityHint(k: number, negated: boolean, useMultipleWording: boolean = true): string | null {
  switch (k) {
    case 2:
      return negated ? 'последняя цифра нечётная (1, 3, 5, 7, 9)' : 'последняя цифра чётная (0, 2, 4, 6, 8)';
    case 5:
      return negated ? 'последняя цифра не 0 и не 5' : 'последняя цифра 0 или 5';
    case 10:
      return negated ? 'последняя цифра не 0' : 'последняя цифра 0';
    case 3:
      if (useMultipleWording) {
        return negated ? 'сумма цифр не кратна 3' : 'сумма цифр кратна 3';
      }
      return negated ? 'сумма цифр не делится на 3' : 'сумма цифр делится на 3';
    case 9:
      if (useMultipleWording) {
        return negated ? 'сумма цифр не кратна 9' : 'сумма цифр кратна 9';
      }
      return negated ? 'сумма цифр не делится на 9' : 'сумма цифр делится на 9';
    case 4:
      if (useMultipleWording) {
        return negated
          ? 'две последние цифры образуют число, не кратное 4'
          : 'две последние цифры образуют число, кратное 4';
      }
      return negated
        ? 'две последние цифры образуют число, которое не делится на 4'
        : 'две последние цифры образуют число, которое делится на 4';
    case 6:
      if (useMultipleWording) {
        return negated
          ? 'число нечётное или сумма цифр не кратна 3'
          : 'число чётное и сумма цифр кратна 3';
      }
      return negated
        ? 'число нечётное или сумма цифр не делится на 3'
        : 'число чётное и сумма цифр делится на 3';
    default:
      return null;
  }
}

// Evaluate boolean value of a node for a given integer x
export function evalNode(node: LogicalNode, x: number): boolean {
  switch (node.type) {
    case 'cmp': {
      const k = node.k!;
      switch (node.op) {
        case '<': return x < k;
        case '<=': return x <= k;
        case '>': return x > k;
        case '>=': return x >= k;
        case '=': return x === k;
        case '!=': return x !== k;
      }
      return false;
    }
    case 'parity': {
      const absX = Math.abs(x);
      return node.parity === 'even' ? absX % 2 === 0 : absX % 2 !== 0;
    }
    case 'firstdigit': {
      let absX = Math.abs(x);
      while (absX >= 10) {
        absX = Math.floor(absX / 10);
      }
      return node.parity === 'even' ? absX % 2 === 0 : absX % 2 !== 0;
    }
    case 'div': {
      const absX = Math.abs(x);
      return absX % node.divK! === 0;
    }
    case 'not':
      return !evalNode(node.children[0], x);
    case 'and':
      return node.children.every(child => evalNode(child, x));
    case 'or':
      return node.children.some(child => evalNode(child, x));
  }
}

// Format logical node into standard OGE notation
export function renderNodeText(node: LogicalNode): string {
  if (node.type === 'cmp') {
    return `(X ${node.op} ${node.k})`;
  }
  if (node.type === 'parity') {
    return node.parity === 'even' ? `(X чётное)` : `(X нечётное)`;
  }
  if (node.type === 'firstdigit') {
    return node.parity === 'even' ? `(первая цифра чётная)` : `(первая цифра нечётная)`;
  }
  if (node.type === 'div') {
    return node.useMultipleWording ? `(X кратно ${node.divK})` : `(X делится на ${node.divK})`;
  }
  if (node.type === 'not') {
    const child = node.children[0];
    const childStr = renderNodeText(child);
    if (child.type === 'and' || child.type === 'or') {
      return `НЕ (${childStr})`;
    }
    return `НЕ ${childStr}`;
  }
  if (node.type === 'and' || node.type === 'or') {
    const left = node.children[0];
    const right = node.children[1];

    let leftStr = renderNodeText(left);
    let rightStr = renderNodeText(right);

    if (node.type === 'and') {
      if (left.type === 'or') {
        leftStr = `(${leftStr})`;
      }
      if (right.type === 'or') {
        rightStr = `(${rightStr})`;
      }
    } else {
      if (left.type === 'and') {
        leftStr = `(${leftStr})`;
      }
      if (right.type === 'and') {
        rightStr = `(${rightStr})`;
      }
    }

    const opStr = node.type === 'and' ? 'И' : 'ИЛИ';
    return `${leftStr} ${opStr} ${rightStr}`;
  }
  return '';
}

// Domains setup (No explicit range domain)
export function getDomain(type: DomainType): TaskDomain {
  switch (type) {
    case 'natural':
      return {
        type: 'natural',
        label: 'натуральных чисел X',
        rangeText: 'X ≥ 1',
        minX: 1,
        maxX: 10000,
        filter: (x) => x >= 1
      };
    case 'two-digit':
      return {
        type: 'two-digit',
        label: 'двузначных целых чисел X',
        rangeText: '10 ≤ X ≤ 99',
        minX: 10,
        maxX: 99,
        filter: (x) => x >= 10 && x <= 99
      };
    case 'three-digit':
      return {
        type: 'three-digit',
        label: 'трёхзначных целых чисел X',
        rangeText: '100 ≤ X ≤ 999',
        minX: 100,
        maxX: 999,
        filter: (x) => x >= 100 && x <= 999
      };
    case 'all':
    default:
      return {
        type: 'all',
        label: 'целых чисел X',
        rangeText: 'все целые числа',
        minX: -10000,
        maxX: 10000,
        filter: () => true
      };
  }
}

// Level 1 Tree Builder
function generateLevel1Tree(isMultipleChoice: boolean, rng: RNG): { tree: LogicalNode; qType: QuestionType; domain: TaskDomain } {
  const qType: QuestionType = rng.next() < 0.5 ? 'min' : 'max';
  const domain = getDomain(rng.next() < 0.4 ? 'natural' : 'all');
  
  const pattern = rng.int(0, 3);
  let tree: LogicalNode;
  
  let a: number;
  let b: number;

  if (isMultipleChoice) {
    // Choose scale for Level 1 multiple choice numbers: 50% 2-digit, 35% 3-digit, 15% 4-digit
    const scaleRand = rng.next();
    if (scaleRand < 0.50) {
      // Two-digit: 12..85
      a = rng.int(12, 85);
      b = a + rng.int(12, 41);
    } else if (scaleRand < 0.85) {
      // Three-digit: 120..850
      a = rng.int(120, 849);
      b = a + rng.int(50, 249);
    } else {
      // Four-digit: 1200..8500
      a = rng.int(1200, 8499);
      b = a + rng.int(300, 1799);
    }
  } else {
    // Moderate numbers for free input Level 1 (5..100)
    a = rng.int(5, 44);
    b = a + rng.int(8, 37);
  }

  if (pattern === 0) {
    // НЕ (X < a) И (X < b)  -> a <= X < b
    tree = {
      type: 'and',
      children: [
        { type: 'not', children: [{ type: 'cmp', op: '<', k: a }] },
        { type: 'cmp', op: '<', k: b }
      ]
    };
  } else if (pattern === 1) {
    // (X > a) И НЕ (X > b)  -> a < X <= b
    tree = {
      type: 'and',
      children: [
        { type: 'cmp', op: '>', k: a },
        { type: 'not', children: [{ type: 'cmp', op: '>', k: b }] }
      ]
    };
  } else if (pattern === 2) {
    // НЕ (X <= a) И (X <= b) -> a < X <= b
    tree = {
      type: 'and',
      children: [
        { type: 'not', children: [{ type: 'cmp', op: '<=', k: a }] },
        { type: 'cmp', op: '<=', k: b }
      ]
    };
  } else {
    // (X >= a) И НЕ (X >= b) -> a <= X < b
    tree = {
      type: 'and',
      children: [
        { type: 'cmp', op: '>=', k: a },
        { type: 'not', children: [{ type: 'cmp', op: '>=', k: b }] }
      ]
    };
  }

  return { tree, qType, domain };
}

// Level 2 Tree Builder
// Guaranteed: NOT attached to a WHOLE parenthesized clause with two conditions inside:
// e.g. НЕ ((cond1) И/ИЛИ (cond2))
// Optionally combined with a 3rd condition (cmp, div, parity, or firstdigit) in ~50% of tasks.
function generateLevel2Tree(rng: RNG): { tree: LogicalNode; qType: QuestionType; domain: TaskDomain } {
  const qType: QuestionType = rng.next() < 0.5 ? 'min' : 'max';
  let hasDivOrFirstDigit = false;

  const innerOp: 'and' | 'or' = rng.next() < 0.5 ? 'and' : 'or';
  
  const a = rng.int(5, 39);
  const b = a + rng.int(8, 32);

  let cond1: LogicalNode;
  let cond2: LogicalNode;

  if (innerOp === 'and') {
    if (rng.next() < 0.35) {
      const divK = rng.pick([2, 3, 4, 5, 6, 7, 8, 9]);
      cond1 = { type: 'cmp', op: '>', k: a };
      cond2 = { type: 'div', divK, useMultipleWording: rng.next() < 0.5 };
      hasDivOrFirstDigit = true;
    } else {
      cond1 = { type: 'cmp', op: '>', k: a };
      cond2 = { type: 'cmp', op: '<', k: b };
    }
  } else {
    if (rng.next() < 0.35) {
      const divK = rng.pick([2, 3, 4, 5, 6, 7, 8, 9]);
      cond1 = { type: 'cmp', op: '<', k: a };
      cond2 = { type: 'div', divK, useMultipleWording: rng.next() < 0.5 };
      hasDivOrFirstDigit = true;
    } else {
      cond1 = { type: 'cmp', op: '<', k: a };
      cond2 = { type: 'cmp', op: '>', k: b };
    }
  }

  const notNode: LogicalNode = {
    type: 'not',
    children: [{
      type: innerOp,
      children: [cond1, cond2]
    }]
  };

  let tree: LogicalNode = notNode;

  // Approx 50% of tasks include a third clause outside NOT
  const hasThird = rng.next() < 0.5;

  if (hasThird) {
    const thirdTypeRand = rng.next();
    let thirdCond: LogicalNode;

    if (thirdTypeRand < 0.25) {
      let c: number;
      let cmpOp: RelationOp;
      if (qType === 'max') {
        c = b + rng.int(5, 24);
        cmpOp = '<';
      } else {
        c = Math.max(1, a - rng.int(1, 10));
        cmpOp = '>';
      }
      thirdCond = { type: 'cmp', op: cmpOp, k: c };
    } else if (thirdTypeRand < 0.50) {
      const divK = rng.pick([2, 3, 4, 5, 6, 7, 8, 9]);
      thirdCond = { type: 'div', divK, useMultipleWording: rng.next() < 0.5 };
      hasDivOrFirstDigit = true;
    } else if (thirdTypeRand < 0.75) {
      const parity = rng.next() < 0.5 ? 'even' : 'odd';
      thirdCond = { type: 'parity', parity };
    } else {
      const parity = rng.next() < 0.5 ? 'even' : 'odd';
      thirdCond = { type: 'firstdigit', parity };
      hasDivOrFirstDigit = true;
    }

    const notFirst = rng.next() < 0.5;
    tree = {
      type: 'and',
      children: notFirst ? [notNode, thirdCond] : [thirdCond, notNode]
    };
  }

  const domainType = hasDivOrFirstDigit ? 'natural' : (rng.next() < 0.5 ? 'natural' : 'all');
  const domain = getDomain(domainType);

  return { tree, qType, domain };
}

function getPluralVar(n: number): string {
  if (n === 1) return 'вариант';
  if (n >= 2 && n <= 4) return 'варианта';
  return 'вариантов';
}

function formatFirstDigitSet(s: number[]): string {
  if (s.length === 0) return 'нет подходящих цифр';
  const str = s.join(', ');
  const isAllEven = s.every(d => d % 2 === 0);
  const isAllOdd = s.every(d => d % 2 !== 0);
  if (isAllEven && s.length === 4) return `чётная (${str})`;
  if (isAllOdd && s.length === 5) return `нечётная (${str})`;
  const minD = Math.min(...s);
  const maxD = Math.max(...s);
  if (s.length === maxD - minD + 1 && s.length > 1) {
    return `от ${minD} до ${maxD} (${str})`;
  }
  return `цифры ${str}`;
}

function formatLastDigitSet(s: number[]): string {
  if (s.length === 0) return 'нет подходящих цифр';
  if (s.length === 1 && s[0] === 0) return `кратность 10 (цифра 0)`;
  if (s.length === 2 && s.includes(0) && s.includes(5)) return `кратность 5 (цифры 0, 5)`;
  if (s.length === 5 && s.every(d => d % 2 === 0)) return `чётность (цифры 0, 2, 4, 6, 8)`;
  if (s.length === 5 && s.every(d => d % 2 !== 0)) return `нечётность (цифры 1, 3, 5, 7, 9)`;
  if (s.length === 8 && !s.includes(0) && !s.includes(5)) return `не кратно 5 (цифры 1..4, 6..9)`;
  if (s.length === 9 && !s.includes(0)) return `не кратно 10 (цифры 1..9)`;
  return `цифры ${s.join(', ')}`;
}

// Level 3 Tree Builder
function generateLevel3Tree(rng: RNG): {
  tree: LogicalNode;
  qType: QuestionType;
  domain: TaskDomain;
  isSubtypeA?: boolean;
} {
  const isSubtypeA = rng.next() < 0.6; // 60% Subtype A (Combinatorial)

  if (isSubtypeA) {
    const is3Digit = rng.next() < 0.7; // 70% 3-digit, 30% 2-digit
    const domainType: DomainType = is3Digit ? 'three-digit' : 'two-digit';
    const domain = getDomain(domainType);
    const qType: QuestionType = 'count';

    const patternType = rng.int(0, 3);
    let tree: LogicalNode;

    const aCutoff = is3Digit
      ? rng.pick([200, 300, 400, 500, 600, 700])
      : rng.pick([20, 30, 40, 50, 60, 70]);

    const fdParity: 'even' | 'odd' = rng.next() < 0.5 ? 'even' : 'odd';
    const divKChoice = rng.pick([2, 5, 10]);
    const useWording = rng.next() < 0.5;

    const fdNode: LogicalNode = { type: 'firstdigit', parity: fdParity };
    const divNode: LogicalNode = { type: 'div', divK: divKChoice, useMultipleWording: useWording };
    const cmpNode: LogicalNode = { type: 'cmp', op: rng.next() < 0.5 ? '>=' : '<', k: aCutoff };

    if (patternType === 0) {
      // NOT( (cmp) OR (firstdigit) ) AND (div 2,5,10)
      const innerLogicOp: 'and' | 'or' = rng.next() < 0.5 ? 'or' : 'and';
      const notClause: LogicalNode = {
        type: 'not',
        children: [{
          type: innerLogicOp,
          children: [cmpNode, fdNode]
        }]
      };
      tree = {
        type: 'and',
        children: [notClause, divNode]
      };
    } else if (patternType === 1) {
      // ((firstdigit) AND (cmp)) AND (div 2,5,10)
      const fdNot = rng.next() < 0.3;
      const actualFdNode = fdNot ? { type: 'not', children: [fdNode] } as LogicalNode : fdNode;
      tree = {
        type: 'and',
        children: [
          { type: 'and', children: [actualFdNode, cmpNode] },
          divNode
        ]
      };
    } else if (patternType === 2) {
      // ((firstdigit) AND (cmp)) AND NOT(div 2,5,10)
      const notDivNode: LogicalNode = {
        type: 'not',
        children: [divNode]
      };
      tree = {
        type: 'and',
        children: [
          { type: 'and', children: [fdNode, cmpNode] },
          notDivNode
        ]
      };
    } else {
      // (firstdigit) AND NOT((cmp) OR (div 2,5,10))
      const innerLogicOp: 'and' | 'or' = rng.next() < 0.5 ? 'or' : 'and';
      const notClause: LogicalNode = {
        type: 'not',
        children: [{
          type: innerLogicOp,
          children: [cmpNode, divNode]
        }]
      };
      tree = {
        type: 'and',
        children: [fdNode, notClause]
      };
    }

    return { tree, qType, domain, isSubtypeA: true };
  }

  // Subtype B (~40% of Level 3): Non-digit-factored divisibility (by 3, 6, 7, 8, 9)
  const randQ = rng.next();
  const qType: QuestionType = randQ < 0.4 ? 'count' : (randQ < 0.7 ? 'min' : 'max');

  let domainType: DomainType;
  if (qType === 'count') {
    domainType = rng.pick(['natural', 'two-digit', 'three-digit'] as DomainType[]);
  } else {
    domainType = rng.next() < 0.5 ? 'natural' : 'all';
  }

  const domain = getDomain(domainType);
  const divK = rng.pick([3, 6, 7, 8, 9]);

  const pattern = rng.int(0, 3);
  let tree: LogicalNode;

  if (pattern === 0) {
    // НЕ (X делится на k) И (X >= a) И (X <= b)
    const a = rng.int(10, 29);
    const b = a + rng.int(10, 34);
    tree = {
      type: 'and',
      children: [
        {
          type: 'and',
          children: [
            { type: 'not', children: [{ type: 'div', divK, useMultipleWording: rng.next() < 0.5 }] },
            { type: 'cmp', op: '>=', k: a }
          ]
        },
        { type: 'cmp', op: '<=', k: b }
      ]
    };
  } else if (pattern === 1) {
    // НЕ ((X < a) ИЛИ (X делится на k)) И (X < b)
    const a = rng.int(5, 19);
    const b = a + rng.int(10, 39);
    tree = {
      type: 'and',
      children: [
        {
          type: 'not',
          children: [{
            type: 'or',
            children: [
              { type: 'cmp', op: '<', k: a },
              { type: 'div', divK, useMultipleWording: rng.next() < 0.5 }
            ]
          }]
        },
        { type: 'cmp', op: '<', k: b }
      ]
    };
  } else if (pattern === 2) {
    // ((первая цифра parity) И (X >= a)) И НЕ (X кратно divK)
    const parityChoice: 'even' | 'odd' = rng.next() < 0.5 ? 'even' : 'odd';
    const a = rng.int(10, 29);
    tree = {
      type: 'and',
      children: [
        {
          type: 'and',
          children: [
            { type: 'firstdigit', parity: parityChoice },
            { type: 'cmp', op: '>=', k: a }
          ]
        },
        { type: 'not', children: [{ type: 'div', divK, useMultipleWording: rng.next() < 0.5 }] }
      ]
    };
  } else {
    // НЕ ((первая цифра parity) И (X кратно divK)) И (X <= b)
    const parityChoice: 'even' | 'odd' = rng.next() < 0.5 ? 'even' : 'odd';
    const b = rng.int(20, 69);
    tree = {
      type: 'and',
      children: [
        {
          type: 'not',
          children: [
            {
              type: 'and',
              children: [
                { type: 'firstdigit', parity: parityChoice },
                { type: 'div', divK, useMultipleWording: rng.next() < 0.5 }
              ]
            }
          ]
        },
        { type: 'cmp', op: '<=', k: b }
      ]
    };
  }

  return { tree, qType, domain };
}

// Generate options for Level 1 multiple choice.
// Ensures distractors are NOT adjacent ±1/±2, well spaced, distinct, and plausible.
function generateLevel1Options(
  correctAns: number,
  isMatchFn: (x: number) => boolean,
  domainFilterFn: (x: number) => boolean,
  rng: RNG
): string[] | undefined {
  const wrongSet = new Set<number>();
  
  const absAns = Math.abs(correctAns);
  const mag = Math.pow(10, Math.floor(Math.log10(absAns || 1)));
  const stepUnit = Math.max(5, Math.floor(mag * 0.35));

  const multipliers = [
    -3, 3, -5, 5, -2, 2, -4, 4, -7, 7, -6, 6, -8, 8, -10, 10, -12, 12, -15, 15
  ];

  for (const m of multipliers) {
    if (wrongSet.size >= 3) break;
    const candidate = correctAns + m * stepUnit;
    if (Math.abs(candidate - correctAns) >= 3 && domainFilterFn(candidate) && !isMatchFn(candidate)) {
      wrongSet.add(candidate);
    }
  }

  if (wrongSet.size < 3) {
    for (let delta = stepUnit; delta <= stepUnit * 25; delta += 4) {
      if (wrongSet.size >= 3) break;
      const c1 = correctAns + delta;
      if (Math.abs(c1 - correctAns) >= 3 && domainFilterFn(c1) && !isMatchFn(c1)) {
        wrongSet.add(c1);
      }
      if (wrongSet.size >= 3) break;
      const c2 = correctAns - delta;
      if (Math.abs(c2 - correctAns) >= 3 && domainFilterFn(c2) && !isMatchFn(c2)) {
        wrongSet.add(c2);
      }
    }
  }

  if (wrongSet.size < 3) return undefined;

  const arr = [correctAns, ...Array.from(wrongSet)].map(String);
  return rng.shuffle(arr);
}

// Generate guiding hint (shown BEFORE answer submission)
function buildShortHint(
  tree: LogicalNode,
  domain: TaskDomain,
  qType: QuestionType,
  wantTrue: boolean,
  options?: string[]
): string {
  const hints: string[] = [];
  const targetWord = wantTrue ? 'ИСТИННО' : 'ЛОЖНО';

  if (options) {
    hints.push(`• Даны числа: ${options.join(', ')}. Подставляйте каждое из этих чисел по очереди вместо X и вычисляйте результат.`);
    hints.push(`• Найдите единственное число, при котором логическое выражение становится ${targetWord}.`);
    hints.push(`• Обратите внимание на порядок действий: сначала выражения в скобках, затем отрицание НЕ, после чего операции И и ИЛИ.`);
    return hints.join('\n');
  }

  const children = 'children' in tree ? (tree as InternalNode).children : [];

  if (!wantTrue) {
    hints.push(`• Требуется, чтобы выражение было ЛОЖНО. Это значит, что для искомого X значение всей логической формулы должно быть равно False.`);
  }

  if (tree.type === 'not' || (tree.type === 'and' && children.some(c => c.type === 'not'))) {
    hints.push(`• Раскройте отрицание НЕ: знак сравнения меняется на противоположный (например, НЕ (X < a) равносильно X >= a, а НЕ (X > b) равносильно X <= b).`);
  } else {
    hints.push(`• Проанализируйте простые условия в скобках.`);
  }

  if (tree.type === 'and' || children.some(c => c.type === 'and')) {
    hints.push(`• Связка И означает одновременное выполнение всех условий.`);
  } else if (tree.type === 'or' || children.some(c => c.type === 'or')) {
    hints.push(`• Связка ИЛИ означает выполнение хотя бы одного из условий.`);
  }

  hints.push(`• Отметьте решения на числовой прямой, чтобы определить подходящую область значений X.`);

  if (qType === 'min') {
    hints.push(`• Из найденных подходящих чисел выберите НАИМЕНЬШЕЕ целое число.`);
  } else if (qType === 'max') {
    hints.push(`• Из найденных подходящих чисел выберите НАИБОЛЬШЕЕ целое число.`);
  } else {
    hints.push(`• Подсчитайте количество всех подходящих целых чисел из области (${domain.rangeText}).`);
  }

  return hints.join('\n');
}

export function negateNode(node: LogicalNode): LogicalNode {
  switch (node.type) {
    case 'cmp': {
      let op = node.op;
      if (op === '<') op = '>=';
      else if (op === '<=') op = '>';
      else if (op === '>') op = '<=';
      else if (op === '>=') op = '<';
      else if (op === '=') op = '!=';
      else if (op === '!=') op = '=';
      return { ...node, op };
    }
    case 'parity':
    case 'firstdigit': {
      return { ...node, parity: node.parity === 'even' ? 'odd' : 'even' };
    }
    case 'div': {
      return { type: 'not', children: [node] };
    }
    case 'not':
      return node.children[0];
    case 'and':
      return { type: 'or', children: node.children.map(negateNode) };
    case 'or':
      return { type: 'and', children: node.children.map(negateNode) };
  }
}

export function flattenNary(node: LogicalNode): LogicalNode {
  if (node.type === 'and' || node.type === 'or') {
    const flattenedChildren: LogicalNode[] = [];
    for (const child of node.children) {
      const flatChild = flattenNary(child);
      if (flatChild.type === node.type && 'children' in flatChild) {
        flattenedChildren.push(...flatChild.children);
      } else {
        flattenedChildren.push(flatChild);
      }
    }
    return { type: node.type, children: flattenedChildren };
  }
  if (node.type === 'not') {
    return { type: 'not', children: [flattenNary(node.children[0])] };
  }
  return node;
}

function cmpCutoffDigit(node: LeafNode, is3Digit: boolean): number {
  const k = node.k || 0;
  return is3Digit ? Math.floor(k / 100) : Math.floor(k / 10);
}

function findNodesInTree(tree: LogicalNode): {
  notClauses: { notNode: InternalNode; innerNode: LogicalNode }[];
  cmpNodes: LeafNode[];
  fdNodes: LeafNode[];
  divNodes: LeafNode[];
} {
  const notClauses: { notNode: InternalNode; innerNode: LogicalNode }[] = [];
  const cmpNodes: LeafNode[] = [];
  const fdNodes: LeafNode[] = [];
  const divNodes: LeafNode[] = [];

  function traverse(node: LogicalNode) {
    if (node.type === 'not') {
      notClauses.push({ notNode: node as InternalNode, innerNode: node.children[0] });
      traverse(node.children[0]);
    } else if (node.type === 'and' || node.type === 'or') {
      node.children.forEach(traverse);
    } else if (node.type === 'cmp') {
      cmpNodes.push(node as LeafNode);
    } else if (node.type === 'firstdigit') {
      fdNodes.push(node as LeafNode);
    } else if (node.type === 'div') {
      divNodes.push(node as LeafNode);
    }
  }

  traverse(tree);
  return { notClauses, cmpNodes, fdNodes, divNodes };
}

export const DEMORGAN_OR_TO_AND = 'Раскрываем отрицание по закону де Моргана: НЕ (A ИЛИ B) равносильно НЕ A И НЕ B, то есть ИЛИ меняется на И, а каждое условие заменяется на противоположное.';
export const DEMORGAN_AND_TO_OR = 'Раскрываем отрицание по закону де Моргана: НЕ (A И B) равносильно НЕ A ИЛИ НЕ B, то есть И меняется на ИЛИ, а каждое условие заменяется на противоположное.';
export const NEGATE_WHOLE = 'Выражение должно быть ЛОЖНО, поэтому отрицаем его целиком по закону де Моргана:';

function buildCombExplanationDetails(
  tree: LogicalNode,
  is3Digit: boolean,
  wantTrue: boolean,
  S1: number[],
  S3: number[]
): { step1Notes: string[]; d1Lines: string[]; d3Lines: string[] } {
  const step1Notes: string[] = [];
  const d1Lines: string[] = [];
  const d3Lines: string[] = [];

  const { notClauses, cmpNodes, fdNodes, divNodes } = findNodesInTree(tree);

  let handledNotClause = false;

  for (const nc of notClauses) {
    const inner = nc.innerNode;
    if (inner.type === 'or' || inner.type === 'and') {
      const children = inner.children;
      const cmp = children.find(c => c.type === 'cmp') as LeafNode | undefined;
      const fd = children.find(c => c.type === 'firstdigit') as LeafNode | undefined;
      const div = children.find(c => c.type === 'div') as LeafNode | undefined;

      if (cmp && fd) {
        handledNotClause = true;
        const dCut = cmpCutoffDigit(cmp, is3Digit);
        const negatedCmp = negateNode(cmp) as LeafNode;
        const negatedCmpOpSign = negatedCmp.op;
        const negatedFd = negateNode(fd) as LeafNode;

        if (inner.type === 'and') {
          step1Notes.push('• ' + DEMORGAN_AND_TO_OR);
          step1Notes.push('• Получаем:');
          step1Notes.push(`  – ${renderNodeText(negatedCmp)} (первая цифра ${negatedCmpOpSign} ${dCut});`);
          step1Notes.push(`  – ${renderNodeText(negatedFd)}.`);
          step1Notes.push(`• Выражение принимает вид: ${renderNodeText(negatedCmp)} ИЛИ ${renderNodeText(negatedFd)}.`);

          const excludedD1 = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => !S1.includes(d));
          d1Lines.push(`Условие на первую цифру: ${renderNodeText(negatedCmp)} ИЛИ ${renderNodeText(negatedFd)}.`);
          d1Lines.push(`Разберём варианты первой цифры от 1 до 9:`);
          d1Lines.push(`– Цифры ${negatedCmpOpSign} ${dCut} удовлетворяют первому условию (${renderNodeText(negatedCmp).replace(/^\(|\)$/g, '')}).`);
          d1Lines.push(`– ${fd.parity === 'even' ? 'Нечётные' : 'Чётные'} цифры удовлетворяют второму условию.`);
          if (excludedD1.length > 0) {
            const wordSingular = excludedD1.length === 1;
            d1Lines.push(`– ${wordSingular ? 'Единственная цифра' : 'Цифры'}, не удовлетворяющая ни одному из условий: ${excludedD1.join(', ')} (так как первая цифра ${negatedCmp.op === '<' || negatedCmp.op === '<=' ? '>=' : '<'} ${dCut} и первая цифра ${fd.parity === 'even' ? 'чётная' : 'нечётная'}).`);
            d1Lines.push(`Исключаем ${wordSingular ? 'её' : 'их'}. Подходят цифры: ${S1.join(', ')} — всего ${S1.length} ${getPluralVar(S1.length)}.`);
          } else {
            d1Lines.push(`Все цифры от 1 до 9 удовлетворяют хотя бы одному условию → всего 9 ${getPluralVar(9)}.`);
          }
        } else if (inner.type === 'or') {
          step1Notes.push('• ' + DEMORGAN_OR_TO_AND);
          step1Notes.push('• Получаем:');
          step1Notes.push(`  – ${renderNodeText(negatedCmp)} (первая цифра ${negatedCmpOpSign} ${dCut});`);
          step1Notes.push(`  – ${renderNodeText(negatedFd)}.`);
          step1Notes.push(`• Выражение принимает вид: ${renderNodeText(negatedCmp)} И ${renderNodeText(negatedFd)}.`);

          d1Lines.push(`Первая цифра должна одновременно удовлетворять двум условиям: ${renderNodeText(negatedCmp)} И ${renderNodeText(negatedFd)}.`);
          d1Lines.push(`1) Первая цифра ${negatedCmpOpSign} ${dCut} (так как ${renderNodeText(negatedCmp).replace(/^\(|\)$/g, '')});`);
          d1Lines.push(`2) Первая цифра ${fd.parity === 'even' ? 'нечётная' : 'чётная'}.`);
          d1Lines.push(`Среди цифр от 1 до 9 обоим условиям одновременно удовлетворяют: ${S1.join(', ')} — всего ${S1.length} ${getPluralVar(S1.length)}.`);
        }
      } else if (cmp && div) {
        handledNotClause = true;
        const dCut = cmpCutoffDigit(cmp, is3Digit);
        const negatedCmp = negateNode(cmp) as LeafNode;
        const negatedCmpOpSign = negatedCmp.op;
        const invertedDiv = div.useMultipleWording ? `(X не кратно ${div.divK})` : `(X не делится на ${div.divK})`;
        const hint = divisibilityHint(div.divK!, true, !!div.useMultipleWording);

        if (inner.type === 'or') {
          step1Notes.push('• ' + DEMORGAN_OR_TO_AND);
          step1Notes.push(`• Получаем: ${renderNodeText(negatedCmp)} И ${invertedDiv}.`);

          const fd = fdNodes[0];
          if (fd) {
            d1Lines.push(`Первая цифра выбирается из диапазона от 1 до 9.`);
            d1Lines.push(`Условия: ${renderNodeText(fd)} И ${renderNodeText(negatedCmp)}, то есть первая цифра ${negatedCmpOpSign} ${dCut}.`);
            d1Lines.push(`Подходят цифры: ${S1.join(', ')} — всего ${S1.length} ${getPluralVar(S1.length)}.`);
          } else {
            d1Lines.push(`Условие ${renderNodeText(negatedCmp)}: первая цифра ${negatedCmpOpSign} ${dCut} (так как ${renderNodeText(negatedCmp).replace(/^\(|\)$/g, '')}).`);
            d1Lines.push(`Подходят цифры: ${S1.join(', ')} — всего ${S1.length} ${getPluralVar(S1.length)}.`);
          }

          d3Lines.push(`Условие ${invertedDiv}: ${hint}.`);
          d3Lines.push(`Подходят цифры: ${S3.join(', ')} — всего ${S3.length} ${getPluralVar(S3.length)}.`);
        } else if (inner.type === 'and') {
          step1Notes.push('• ' + DEMORGAN_AND_TO_OR);
          step1Notes.push(`• Получаем: ${renderNodeText(negatedCmp)} ИЛИ ${invertedDiv}.`);
        }
      }
    }
  }

  if (!handledNotClause) {
    for (const nc of notClauses) {
      if (nc.innerNode.type === 'div') {
        const div = nc.innerNode as LeafNode;
        const invertedDiv = div.useMultipleWording ? `(X не кратно ${div.divK})` : `(X не делится на ${div.divK})`;
        const hint = divisibilityHint(div.divK!, true, !!div.useMultipleWording);
        step1Notes.push(`• Раскрываем отрицание: ${invertedDiv}.`);
        if (d3Lines.length === 0) {
          d3Lines.push(`Условие ${invertedDiv}: ${hint}.`);
          d3Lines.push(`Подходят цифры: ${S3.join(', ')} — всего ${S3.length} ${getPluralVar(S3.length)}.`);
        }
      } else if (nc.innerNode.type === 'firstdigit') {
        const fd = nc.innerNode as LeafNode;
        const negatedFd = negateNode(fd) as LeafNode;
        step1Notes.push(`• Раскрываем отрицание: ${renderNodeText(negatedFd)}.`);
        if (d1Lines.length === 0) {
          d1Lines.push(`Условие ${renderNodeText(negatedFd)}: первой цифрой должна быть ${fd.parity === 'even' ? 'нечётная' : 'чётная'} цифра.`);
          d1Lines.push(`Подходят цифры: ${S1.join(', ')} — всего ${S1.length} ${getPluralVar(S1.length)}.`);
        }
      }
    }
  }

  if (d1Lines.length === 0) {
    const cmp = cmpNodes[0];
    const fd = fdNodes[0];
    d1Lines.push(`Первая цифра выбирается из диапазона от 1 до 9.`);
    if (cmp && fd) {
      const dCut = cmpCutoffDigit(cmp, is3Digit);
      d1Lines.push(`Условия: ${renderNodeText(fd)} И ${renderNodeText(cmp)}, то есть первая цифра ${cmp.op} ${dCut}.`);
    } else if (cmp) {
      const dCut = cmpCutoffDigit(cmp, is3Digit);
      d1Lines.push(`Условие ${renderNodeText(cmp)}: первая цифра ${cmp.op} ${dCut}.`);
    } else if (fd) {
      d1Lines.push(`Условие ${renderNodeText(fd)}: первая цифра ${fd.parity === 'even' ? 'чётная' : 'нечётная'}.`);
    }
    d1Lines.push(`Подходят цифры: ${S1.join(', ')} — всего ${S1.length} ${getPluralVar(S1.length)}.`);
  }

  if (d3Lines.length === 0) {
    const div = divNodes[0];
    d3Lines.push(`Последняя цифра выбирается из диапазона от 0 до 9.`);
    if (div) {
      const hint = divisibilityHint(div.divK!, false, !!div.useMultipleWording);
      d3Lines.push(`Условие ${renderNodeText(div)}: ${hint || (div.useMultipleWording ? `число X кратно ${div.divK}` : `число X делится на ${div.divK}`)}.`);
    }
    d3Lines.push(`Подходят цифры: ${S3.join(', ')} — всего ${S3.length} ${getPluralVar(S3.length)}.`);
  }

  return { step1Notes, d1Lines, d3Lines };
}

/**
 * Форматирует отсортированный список подходящих чисел в виде отрезков и отдельных чисел.
 * Если хотя бы одна граница отрезка отрицательна — «от start до end».
 * Для отрезков из неотрицательных чисел — компактный вид «start–end».
 * Для отдельных чисел — само число в виде строки.
 */
export function formatMatchesList(matches: number[]): string {
  if (matches.length === 0) return '';
  const intervals: Array<{ start: number; end: number }> = [];
  let curStart = matches[0];
  let curEnd = matches[0];

  for (let i = 1; i < matches.length; i++) {
    const x = matches[i];
    if (x === curEnd + 1) {
      curEnd = x;
    } else {
      intervals.push({ start: curStart, end: curEnd });
      curStart = x;
      curEnd = x;
    }
  }
  intervals.push({ start: curStart, end: curEnd });

  const formattedParts = intervals.map(({ start, end }) => {
    if (start === end) {
      return String(start);
    }
    if (start < 0 || end < 0) {
      return `от ${start} до ${end}`;
    }
    return `${start}–${end}`;
  });

  return formattedParts.join(', ');
}

export function hasNotNode(node: LogicalNode): boolean {
  if (node.type === 'not') return true;
  if ('children' in node) {
    return node.children.some(hasNotNode);
  }
  return false;
}

export function findCompoundNot(node: LogicalNode): InternalNode | null {
  if (node.type === 'not') {
    const inner = node.children[0];
    if (inner && (inner.type === 'and' || inner.type === 'or')) return node;
  }
  if ('children' in node) {
    for (const ch of node.children) {
      const found = findCompoundNot(ch);
      if (found) return found;
    }
  }
  return null;
}

export function simplifyWorkingTree(node: LogicalNode): LogicalNode {
  if (node.type === 'not') {
    const child = node.children[0];
    if (child.type === 'not') {
      return simplifyWorkingTree(child.children[0]);
    }
    if (child.type === 'and' || child.type === 'or') {
      return simplifyWorkingTree(negateNode(child));
    }
    if (child.type === 'cmp' || child.type === 'parity' || child.type === 'firstdigit') {
      return negateNode(child);
    }
    if (child.type === 'div') {
      return node;
    }
  }
  if (node.type === 'and' || node.type === 'or') {
    const simplified: LogicalNode = {
      type: node.type,
      children: node.children.map(simplifyWorkingTree)
    };
    return flattenNary(simplified);
  }
  return node;
}

export function getWorkingTree(tree: LogicalNode, wantTrue: boolean): LogicalNode {
  if (!wantTrue) {
    if (tree.type === 'not') {
      return simplifyWorkingTree(tree.children[0]);
    } else {
      return simplifyWorkingTree(negateNode(tree));
    }
  } else {
    return simplifyWorkingTree(tree);
  }
}

function stripParens(s: string): string {
  if (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let canStrip = true;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') {
        depth--;
        if (depth === 0 && i < s.length - 1) {
          canStrip = false;
          break;
        }
      }
    }
    if (canStrip) return s.slice(1, -1);
  }
  return s;
}

export function renderExplanationNodeText(node: LogicalNode): string {
  if (node.type === 'cmp') {
    return `(X ${node.op} ${node.k})`;
  }
  if (node.type === 'parity') {
    return node.parity === 'even' ? '(X чётное)' : '(X нечётное)';
  }
  if (node.type === 'firstdigit') {
    return node.parity === 'even' ? '(первая цифра чётная)' : '(первая цифра нечётная)';
  }
  if (node.type === 'div') {
    return node.useMultipleWording ? `(X кратно ${node.divK})` : `(X делится на ${node.divK})`;
  }
  if (node.type === 'not') {
    const child = node.children[0];
    if (child.type === 'cmp') {
      const opInvert: Record<RelationOp, RelationOp> = {
        '<': '>=', '<=': '>', '>': '<=', '>=': '<', '=': '!=', '!=': '='
      };
      return `(X ${opInvert[child.op as RelationOp]} ${child.k})`;
    }
    if (child.type === 'parity') {
      return child.parity === 'even' ? '(X нечётное)' : '(X чётное)';
    }
    if (child.type === 'firstdigit') {
      return child.parity === 'even' ? '(первая цифра нечётная)' : '(первая цифра чётная)';
    }
    if (child.type === 'div') {
      return child.useMultipleWording ? `(X не кратно ${child.divK})` : `(X не делится на ${child.divK})`;
    }
    return renderExplanationNodeText(negateNode(child));
  }
  if (node.type === 'and') {
    return node.children.map(c => {
      if (c.type === 'or') {
        const inner = c.children.map(sub => stripParens(renderExplanationNodeText(sub))).join(' ИЛИ ');
        return `(${inner})`;
      }
      return renderExplanationNodeText(c);
    }).join(' И ');
  }
  if (node.type === 'or') {
    return node.children.map(c => {
      if (c.type === 'and') {
        const inner = c.children.map(sub => stripParens(renderExplanationNodeText(sub))).join(' И ');
        return `(${inner})`;
      }
      return renderExplanationNodeText(c);
    }).join(' ИЛИ ');
  }
  return '';
}

// Generate step-by-step explanation
export function buildExplanation(
  tree: LogicalNode,
  domain: TaskDomain,
  qType: QuestionType,
  wantTrue: boolean,
  matches: number[],
  correctAnswer: string,
  options?: string[],
  combDetails?: CombDetails
): { text: string } {
  const exprText = renderNodeText(tree);
  const targetWord = wantTrue ? 'ИСТИННО' : 'ЛОЖНО';

  if (combDetails) {
    // Safety check: verify product matches actual engine count
    const calcProd = combDetails.d1Count * (combDetails.is3Digit ? 10 : 1) * combDetails.d3Count;
    if (calcProd !== matches.length) {
      combDetails = undefined;
    }
  }

  if (combDetails) {
    const lines: string[] = [];

    lines.push(`Шаг 1. Анализ логического выражения и раскрытие отрицаний`);
    lines.push(`Дано выражение: ${exprText}. Требуется найти количество ${combDetails.is3Digit ? 'трёхзначных' : 'двузначных'} чисел, для которых выражение ${targetWord}.`);
    lines.push(`Операция И (конъюнкция) истинна, только если истинны все её составные части.`);

    if (combDetails.step1Notes && combDetails.step1Notes.length > 0) {
      combDetails.step1Notes.forEach(note => lines.push(note));
    }

    lines.push(`Условия в выражении налагают независимые ограничения на отдельные разряды числа, поэтому применим комбинаторный подсчёт по разрядам.`);
    lines.push(``);

    lines.push(`Шаг 2. Разбор ограничений по разрядам`);
    lines.push(`Все условия на разряды должны выполняться одновременно.`);

    lines.push(`• Первая (старшая) цифра:`);
    if (combDetails.d1Lines && combDetails.d1Lines.length > 0) {
      combDetails.d1Lines.forEach(l => lines.push(`  ${l}`));
    } else {
      lines.push(`  ${combDetails.d1Desc} → ${combDetails.d1Count} ${getPluralVar(combDetails.d1Count)}.`);
    }

    if (combDetails.is3Digit) {
      lines.push(`• Вторая (средняя) цифра:`);
      lines.push(`  Вторая цифра не ограничена условиями выражения и может быть любой цифрой от 0 до 9 → ${combDetails.d2Count ?? 10} ${getPluralVar(combDetails.d2Count ?? 10)}.`);
      lines.push(`• Третья (последняя) цифра:`);
    } else {
      lines.push(`• Вторая (последняя) цифра:`);
    }
    if (combDetails.d3Lines && combDetails.d3Lines.length > 0) {
      combDetails.d3Lines.forEach(l => lines.push(`  ${l}`));
    } else {
      lines.push(`  ${combDetails.d3Desc} → ${combDetails.d3Count} ${getPluralVar(combDetails.d3Count)}.`);
    }

    lines.push(``);
    lines.push(`Шаг 3. Подсчёт общего количества чисел`);
    lines.push(`Перемножаем количество вариантов для каждого разряда:`);
    lines.push(`${combDetails.totalCalc}`);
    lines.push(``);
    lines.push(`Шаг 4. Итоговый ответ`);
    lines.push(`Количество подходящих чисел X: ${correctAnswer}.`);

    return { text: lines.join('\n') };
  }

  const lines: string[] = [];
  const workingTree = getWorkingTree(tree, wantTrue);

  lines.push(`Шаг 1. Анализ логического выражения`);
  lines.push(`Дано выражение: ${exprText}. Требуется найти X, для которого выражение ${targetWord}.`);

  const compoundNot = findCompoundNot(tree);
  const needsDeMorgan = (wantTrue && compoundNot !== null) || (!wantTrue && (tree.type === 'and' || tree.type === 'or'));

  if (tree.type === 'not' && !wantTrue) {
    lines.push(`Выражение с НЕ ложно, когда его внутренняя часть истинна.`);
  }

  if (needsDeMorgan) {
    if (!wantTrue && (tree.type === 'and' || tree.type === 'or')) {
      if (tree.type === 'and') {
        lines.push(DEMORGAN_AND_TO_OR);
      } else {
        lines.push(DEMORGAN_OR_TO_AND);
      }
    } else if (wantTrue && compoundNot) {
      const inner = compoundNot.children[0];
      if (inner.type === 'or') {
        lines.push(DEMORGAN_OR_TO_AND);
      } else if (inner.type === 'and') {
        lines.push(DEMORGAN_AND_TO_OR);
      }
    }
  }

  if (workingTree.type === 'and') {
    lines.push(`Операция И (конъюнкция) истинна, только если истинны все её составные части.`);
  } else if (workingTree.type === 'or') {
    lines.push(`Операция ИЛИ (дизъюнкция) истинна, если истинна хотя бы одна часть.`);
  }

  lines.push(``);
  lines.push(`Шаг 2. Раскрытие отрицаний и связок`);

  if (hasNotNode(tree) || !wantTrue) {
    let step2Phrase: string;
    if (tree.type === 'not' && !wantTrue) {
      // НЕ(A) ложно → внутренность истинна, де Морган не применяется
      step2Phrase = `НЕ(...) ложно, когда его внутренняя часть истинна. Ищем X, при котором:`;
    } else if (wantTrue && compoundNot !== null) {
      // wantTrue + есть НЕ(А И В) внутри → применялся де Морган
      step2Phrase = `После раскрытия по закону де Моргана выражение равносильно:`;
    } else if (!wantTrue && (tree.type === 'and' || tree.type === 'or')) {
      // !wantTrue + корень and/or → отрицали всё дерево через де Морган
      step2Phrase = `После раскрытия отрицания по закону де Моргана выражение равносильно:`;
    } else {
      step2Phrase = `После раскрытия отрицания выражение равносильно:`;
    }
    lines.push(`${step2Phrase} ${renderExplanationNodeText(workingTree)}.`);
  }

  if (workingTree.type === 'and') {
    if (workingTree.children.length === 2) {
      lines.push(`Оба условия должны выполняться одновременно.`);
    } else if (workingTree.children.length >= 3) {
      lines.push(`Все условия должны выполняться одновременно.`);
    }
  } else if (workingTree.type === 'or') {
    lines.push(`Достаточно, чтобы выполнялось хотя бы одно условие.`);
  }

  if ('children' in workingTree && workingTree.children.length > 1) {
    workingTree.children.forEach((c, idx) => {
      lines.push(`• Условие ${idx + 1}: ${renderExplanationNodeText(c)}`);
      let divK: number | undefined;
      let isNegated = false;
      let useMultiple = true;
      if (c.type === 'div') {
        divK = c.divK;
        useMultiple = !!c.useMultipleWording;
      } else if (c.type === 'not' && c.children[0]?.type === 'div') {
        divK = c.children[0].divK;
        useMultiple = !!c.children[0].useMultipleWording;
        isNegated = true;
      }
      if (divK !== undefined) {
        const hint = divisibilityHint(divK, isNegated, useMultiple);
        if (hint) {
          lines.push(`  Признак делимости: ${hint}.`);
        }
      }
    });
  } else if (workingTree.type === 'div' && workingTree.divK !== undefined) {
    const hint = divisibilityHint(workingTree.divK, false, !!workingTree.useMultipleWording);
    if (hint) {
      lines.push(`  Признак делимости: ${hint}.`);
    }
  } else if (workingTree.type === 'not' && workingTree.children[0]?.type === 'div' && workingTree.children[0].divK !== undefined) {
    const hint = divisibilityHint(workingTree.children[0].divK, true, !!workingTree.children[0].useMultipleWording);
    if (hint) {
      lines.push(`  Признак делимости: ${hint}.`);
    }
  }

  lines.push(``);
  lines.push(`Шаг 3. Проверка чисел`);

  if (options) {
    lines.push(`Проверяем каждое из четырёх заданных чисел:`);
    options.forEach((optStr) => {
      const xVal = parseInt(optStr);
      const rawRes = evalNode(tree, xVal);
      const isMatch = wantTrue ? rawRes : !rawRes;
      lines.push(`• X = ${xVal}: значение = ${rawRes ? 'ИСТИНА' : 'ЛОЖЬ'} → ${isMatch ? 'подходит (ОТВЕТ)' : 'не подходит'}`);
    });
  } else {
    const normalizedRangeText = domain.rangeText.replace(/≥/g, '>=').replace(/≤/g, '<=');
    lines.push(`Учитываем условие для ${domain.label} (${normalizedRangeText}).`);
    if (matches.length > 0) {
      const formatted = formatMatchesList(matches);
      const parts = formatted.split(', ');
      const searchMin = Math.min(-20000, domain.minX - 500);
      const searchMax = Math.max(20000, domain.maxX + 500);
      const maxVal = Math.max(...matches);
      const minVal = Math.min(...matches);
      if (qType === 'min' && maxVal >= searchMax - 5) {
        const candidateParts = parts.length > 1 ? parts.slice(0, -1).slice(0, 5) : [];
        const sample = candidateParts.length > 0 ? candidateParts.join(', ') : matches.slice(0, 5).join(', ');
        lines.push(`Подходящие числа X (где выражение ${targetWord}): [ ${sample}, … ].`);
      } else if (qType === 'max' && minVal <= searchMin + 5) {
        const candidateParts = parts.length > 1 ? parts.slice(1).slice(-5) : [];
        const sample = candidateParts.length > 0 ? candidateParts.join(', ') : matches.slice(-5).join(', ');
        lines.push(`Подходящие числа X (где выражение ${targetWord}): [ …, ${sample} ].`);
      } else if (parts.length <= 8) {
        lines.push(`Подходящие числа X (где выражение ${targetWord}): [ ${formatted} ] (всего ${pluralNumbers(matches.length)}).`);
      } else {
        const sample = parts.slice(0, 5).join(', ');
        const last = parts[parts.length - 1];
        lines.push(`Подходящие числа X (где выражение ${targetWord}): [ ${sample}, ..., ${last} ] (всего ${pluralNumbers(matches.length)}).`);
      }
    } else {
      lines.push(`Подходящих чисел X не найдено.`);
    }
  }

  lines.push(``);
  lines.push(`Шаг 4. Итоговый ответ`);
  if (options) {
    lines.push(`Единственным верным вариантом является ${correctAnswer}.`);
  } else if (qType === 'min') {
    lines.push(`Наименьшее подходящее значение X: ${correctAnswer}.`);
  } else if (qType === 'max') {
    lines.push(`Наибольшее подходящее значение X: ${correctAnswer}.`);
  } else {
    lines.push(`Количество подходящих чисел X: ${correctAnswer}.`);
  }

  return { text: lines.join('\n') };
}

export const task3: TaskModule = {
  id: 3,
  title: 'Значение логического выражения',
  description: 'Поиск наименьшего/наибольшего целого числа X или подсчёт количества чисел, удовлетворяющих логическому высказыванию.',
  topics: ['Логические высказывания', 'Алгебра логики'], // TODO: уточнить формулировки
  maxPoints: 1,

  generate: (difficulty: Difficulty, rng: RNG): Task3Data => {
    let attempts = 0;

    while (attempts < 300) {
      attempts++;

      // Level 1: 50% chance for multiple choice, 50% chance for free input.
      // Levels 2 and 3: always free input.
      const isMultipleChoiceLevel1 = difficulty === 1 && rng.next() < 0.5;

      let genRes: { tree: LogicalNode; qType: QuestionType; domain: TaskDomain; isSubtypeA?: boolean };
      if (difficulty === 1) {
        genRes = generateLevel1Tree(isMultipleChoiceLevel1, rng);
      } else if (difficulty === 2) {
        genRes = generateLevel2Tree(rng);
      } else {
        genRes = generateLevel3Tree(rng);
      }

      const { tree, qType, domain, isSubtypeA } = genRes;

      // Random flag for TRUE vs FALSE requirement (50/50)
      const wantTrue = rng.next() < 0.5;

      // Search technical range
      const searchMin = Math.min(-20000, domain.minX - 500);
      const searchMax = Math.max(20000, domain.maxX + 500);

      const matches: number[] = [];
      let checkedInDomain = 0;

      for (let x = searchMin; x <= searchMax; x++) {
        if (domain.filter(x)) {
          checkedInDomain++;
          const rawBool = evalNode(tree, x);
          const isMatch = wantTrue ? rawBool : !rawBool;
          if (isMatch) {
            matches.push(x);
          }
        }
      }

      // Validation Checks: Non-degeneracy (must not be empty, must not be all)
      if (matches.length === 0 || matches.length === checkedInDomain) {
        continue;
      }

      // Compute combDetails for Subtype A if applicable
      let combDetails: CombDetails | undefined = undefined;

      if (isSubtypeA) {
        const is3Digit = domain.type === 'three-digit';
        const S1: number[] = [];
        const S3: number[] = [];

        for (let d1 = 1; d1 <= 9; d1++) {
          let satisfies = false;
          for (let d3 = 0; d3 <= 9; d3++) {
            const testX = is3Digit ? d1 * 100 + 50 + d3 : d1 * 10 + d3;
            const raw = evalNode(tree, testX);
            if (wantTrue ? raw : !raw) {
              satisfies = true;
              break;
            }
          }
          if (satisfies) S1.push(d1);
        }

        for (let d3 = 0; d3 <= 9; d3++) {
          let satisfies = false;
          for (let d1 = 1; d1 <= 9; d1++) {
            const testX = is3Digit ? d1 * 100 + 50 + d3 : d1 * 10 + d3;
            const raw = evalNode(tree, testX);
            if (wantTrue ? raw : !raw) {
              satisfies = true;
              break;
            }
          }
          if (satisfies) S3.push(d3);
        }

        let isCartesian = S1.length > 0 && S3.length > 0;
        if (isCartesian) {
          for (let d1 = 1; d1 <= 9; d1++) {
            for (let d3 = 0; d3 <= 9; d3++) {
              const testX = is3Digit ? d1 * 100 + 50 + d3 : d1 * 10 + d3;
              const raw = evalNode(tree, testX);
              const actual = wantTrue ? raw : !raw;
              const expected = S1.includes(d1) && S3.includes(d3);
              if (actual !== expected) {
                isCartesian = false;
                break;
              }
            }
            if (!isCartesian) break;
          }
        }

        const calcTotal = is3Digit ? S1.length * 10 * S3.length : S1.length * S3.length;

        if (!isCartesian || matches.length !== calcTotal) {
          continue; // Re-generate attempt if product doesn't match brute-force engine!
        }

        const { step1Notes, d1Lines, d3Lines } = buildCombExplanationDetails(tree, is3Digit, wantTrue, S1, S3);

        combDetails = {
          is3Digit,
          d1Desc: formatFirstDigitSet(S1),
          d1Count: S1.length,
          d2Desc: is3Digit ? 'любая цифра от 0 до 9' : undefined,
          d2Count: is3Digit ? 10 : undefined,
          d3Desc: formatLastDigitSet(S3),
          d3Count: S3.length,
          totalCalc: is3Digit ? `${S1.length} × 10 × ${S3.length} = ${calcTotal}` : `${S1.length} × ${S3.length} = ${calcTotal}`,
          step1Notes,
          d1Lines,
          d3Lines
        };
      }

      let answerStr = '';

      if (qType === 'min') {
        const minVal = Math.min(...matches);
        if (minVal <= searchMin + 5) {
          continue; // Unbounded below
        }
        // Non-triviality check for min
        if (domain.type === 'natural' && minVal <= 3) {
          continue;
        }
        if (domain.type === 'two-digit' && minVal <= 11) {
          continue;
        }
        if (domain.type === 'three-digit' && minVal <= 101) {
          continue;
        }
        answerStr = String(minVal);
      } else if (qType === 'max') {
        const maxVal = Math.max(...matches);
        if (maxVal >= searchMax - 5) {
          continue; // Unbounded above
        }
        // Non-triviality check for max
        if (domain.type === 'two-digit' && maxVal >= 98) {
          continue;
        }
        if (domain.type === 'three-digit' && maxVal >= 998) {
          continue;
        }
        answerStr = String(maxVal);
      } else if (qType === 'count') {
        const minVal = Math.min(...matches);
        const maxVal = Math.max(...matches);
        if (minVal <= searchMin + 5 || maxVal >= searchMax - 5) {
          continue;
        }
        if (matches.length < 1 || matches.length >= checkedInDomain) {
          continue;
        }
        answerStr = String(matches.length);
      }

      const options = isMultipleChoiceLevel1 && (qType === 'min' || qType === 'max')
        ? generateLevel1Options(
            parseInt(answerStr),
            (x) => (wantTrue ? evalNode(tree, x) : !evalNode(tree, x)),
            domain.filter,
            rng
          )
        : undefined;

      const exprText = renderNodeText(tree);
      const targetWord = wantTrue ? 'ИСТИННО' : 'ЛОЖНО';

      let questionText = '';
      if (options) {
        questionText = `Даны четыре числа: ${options.join(', ')}. Укажите число, для которого ${targetWord} логическое выражение:`;
      } else if (qType === 'min') {
        if (domain.type === 'all') {
          questionText = `Напишите наименьшее целое число X, для которого ${targetWord} логическое выражение:`;
        } else {
          questionText = `Напишите наименьшее из ${domain.label}, для которого ${targetWord} логическое выражение:`;
        }
      } else if (qType === 'max') {
        if (domain.type === 'all') {
          questionText = `Напишите наибольшее целое число X, для которого ${targetWord} логическое выражение:`;
        } else {
          questionText = `Напишите наибольшее из ${domain.label}, для которого ${targetWord} логическое выражение:`;
        }
      } else {
        questionText = `Сколько существует ${domain.label}, для которых ${targetWord} логическое выражение:`;
      }

      const shortHint = buildShortHint(tree, domain, qType, wantTrue, options);

      const { text: explanation } = buildExplanation(
        tree,
        domain,
        qType,
        wantTrue,
        matches,
        answerStr,
        options,
        combDetails
      );

      return {
        statement: questionText,
        expressionText: exprText,
        domainLabel: domain.label,
        questionType: qType,
        wantTrue,
        correctAnswer: answerStr,
        options,
        shortHint,
        explanation,
        combDetails,
        tree
      };
    }

    // Fallback if loop exceeded
    return {
      statement: 'Даны четыре числа: 18, 25, 42, 60. Укажите число, для которого ИСТИННО логическое выражение:',
      expressionText: 'НЕ (X < 30) И (X < 50)',
      domainLabel: 'целых чисел X',
      questionType: 'min',
      wantTrue: true,
      correctAnswer: '42',
      options: ['18', '25', '42', '60'],
      shortHint: '• Даны числа: 18, 25, 42, 60. Подставляйте каждое из этих чисел по очереди вместо X.',
      explanation: 'НЕ (X < 30) равносильно (X >= 30). В сочетании с (X < 50) получаем 30 <= X < 50. Единственное подходящее число из предложенных — 42.',
    };
  },

  render: (taskData: Task3Data, state: TaskModuleState) => {
    return (
      <div className="space-y-4">
        {/* Task Question Statement */}
        <StatementBlock>
          <StatementText>
            {taskData.statement}
          </StatementText>

          {/* Logical Expression Card */}
          <SubBlock className="text-center py-4">
            <span className="text-lg sm:text-xl font-mono font-bold tracking-wide text-theme-text">
              {taskData.expressionText}
            </span>
          </SubBlock>
        </StatementBlock>

        {/* Multiple Choice Options or Free Text Input */}
        {taskData.options ? (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-theme-text">Ваш ответ:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {taskData.options.map((opt, idx) => (
                <ChoiceButton
                  key={idx}
                  selected={state.userAnswer === opt}
                  disabled={state.isSubmitted}
                  onClick={() => state.setUserAnswer(opt)}
                >
                  {opt}
                </ChoiceButton>
              ))}
            </div>
          </div>
        ) : (
          <AnswerField
            label="Ваш ответ:"
            value={state.userAnswer}
            onChange={(val) => state.setUserAnswer(val)}
            disabled={state.isSubmitted}
            mono
            placeholder="Введите целое число…"
          />
        )}

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
          <SubBlock className="space-y-4">
            <strong className="block font-extrabold text-base text-theme-text">📖 Подробное решение</strong>
            <div className="text-sm leading-relaxed whitespace-pre-line text-theme-text">
              {taskData.explanation}
            </div>
          </SubBlock>
        )}
      </div>
    );
  },

  check: (taskData: Task3Data, userAnswer: string) => {
    if (!userAnswer) return false;
    const cleanUser = userAnswer.trim();
    const cleanCorrect = taskData.correctAnswer.trim();
    return cleanUser === cleanCorrect;
  }
};

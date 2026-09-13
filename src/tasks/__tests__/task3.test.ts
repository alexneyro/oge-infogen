import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  task3,
  buildExplanation,
  getDomain,
  LogicalNode,
  Task3Data,
  formatMatchesList,
  negateNode,
  flattenNary,
  evalNode,
  getWorkingTree,
  renderExplanationNodeText,
  pluralNumbers,
  divisibilityHint,
  hasNotNode,
  DEMORGAN_OR_TO_AND,
  DEMORGAN_AND_TO_OR,
  NEGATE_WHOLE
} from '../task3';
import { makeRng } from '../../utils/rng';

describe('Task 3 Core & Explanation Suite', () => {
  it('(a) explains NOT((X < 11) OR (X > 20)) with wantTrue = true via equivalent expression and simultaneous conditions', () => {
    const domain = getDomain('all');
    const treeA: LogicalNode = {
      type: 'not',
      children: [{
        type: 'or',
        children: [
          { type: 'cmp', op: '<', k: 11 },
          { type: 'cmp', op: '>', k: 20 }
        ]
      }]
    };

    const explanation = buildExplanation(
      treeA,
      domain,
      'min',
      true,
      [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      '11'
    );

    expect(explanation.text).toContain('равносильно: (X >= 11) И (X <= 20)');
    expect(explanation.text).toContain('Оба условия должны выполняться одновременно.');
    expect(explanation.text).toContain('• Условие 1: (X >= 11)');
    expect(explanation.text).toContain('• Условие 2: (X <= 20)');
  });

  it('(b) explains NOT((X > 32) AND (X делится на 3)) with wantTrue = false with transition phrase and conjunction property', () => {
    const domain = getDomain('natural');
    const treeB: LogicalNode = {
      type: 'not',
      children: [{
        type: 'and',
        children: [
          { type: 'cmp', op: '>', k: 32 },
          { type: 'div', divK: 3, useMultipleWording: false }
        ]
      }]
    };

    const explanation = buildExplanation(
      treeB,
      domain,
      'count',
      false,
      [33, 36, 39, 42],
      '4'
    );

    const step1 = explanation.text.split('Шаг 2')[0];
    expect(step1).toContain('Выражение с НЕ ложно, когда его внутренняя часть истинна.');
    expect(step1).toContain('Операция И (конъюнкция) истинна, только если истинны все её составные части.');
  });

  it('(c) across 60 seeds x 3 levels, if Step 2 has 2 or more condition items or digit items, a connector explanation must be present', () => {
    const coveredCounts = { 1: 0, 2: 0, 3: 0 };
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let seed = 1; seed <= 60; seed++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(seed)) as Task3Data;
        const step2 = data.explanation.split('Шаг 2')[1]?.split('Шаг 3')[0] || '';
        const lines = step2.split('\n').map((l) => l.trim());
        const condLines = lines.filter((l) => l.startsWith('• Условие'));
        const digitLines = lines.filter((l) => l.startsWith('• Первая') || l.startsWith('• Вторая') || l.startsWith('• Третья'));

        const isCovered = condLines.length >= 2 || digitLines.length >= 2;
        if (isCovered) {
          coveredCounts[lvl as 1 | 2 | 3]++;
          const hasConnector = step2.includes('одновременно') || step2.includes('хотя бы одно');
          expect(
            hasConnector,
            `Missing connector phrase in lvl=${lvl}, seed=${seed}`
          ).toBe(true);
        }
      }
    }
    console.log(`[Test c] Covered tasks by level: L1=${coveredCounts[1]}/60, L2=${coveredCounts[2]}/60, L3=${coveredCounts[3]}/60`);
    expect(coveredCounts[1]).toBeGreaterThan(0);
    expect(coveredCounts[2]).toBeGreaterThan(0);
    expect(coveredCounts[3]).toBeGreaterThan(0);
  });

  it('for all tasks where combinatorics branch triggered, digit labels do not exceed number of digits', () => {
    let combCount = 0;
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let seed = 1; seed <= 60; seed++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(seed)) as Task3Data;
        if (data.combDetails) {
          combCount++;
          const explanationLower = data.explanation.toLowerCase();
          if (!data.combDetails.is3Digit) {
            expect(explanationLower).not.toContain('третья');
          } else {
            expect(explanationLower).not.toContain('четвёртая');
          }
        }
      }
    }
    expect(combCount).toBeGreaterThan(0);
  });

  it('(d) across 60 seeds x 3 levels, correctAnswer and expressionText are strictly preserved', () => {
    const entries: string[] = [];
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let seed = 1; seed <= 60; seed++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(seed)) as Task3Data;
        entries.push(`${lvl}:${seed}:${data.expressionText}:${data.correctAnswer}`);
      }
    }

    const hash = crypto.createHash('sha256').update(entries.join('\n')).digest('hex');
    expect(entries.length).toBe(180);
    expect(hash).toBe('a09abee5808f2fd591d9cb24d9c2c90dda4d565bea732fd5067f0e2727a64c4a');

    // Sample spot checks
    expect(entries[0]).toBe('1:1:(X > 24) И НЕ (X > 36):25');
    expect(entries[1]).toBe('1:2:НЕ (X <= 40) И (X <= 66):41');
    expect(entries[2]).toBe('1:3:НЕ (X < 35) И (X < 57):35');
    expect(entries[3]).toBe('1:4:НЕ (X < 14) И (X < 37):14');
    expect(entries[4]).toBe('1:5:(X >= 602) И НЕ (X >= 654):653');
  });

  it('(e) determinism is strictly preserved across repeated generations', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let seed = 1; seed <= 10; seed++) {
        const data1 = task3.generate(lvl as 1 | 2 | 3, makeRng(seed)) as Task3Data;
        const data2 = task3.generate(lvl as 1 | 2 | 3, makeRng(seed)) as Task3Data;

        expect(data1.statement).toBe(data2.statement);
        expect(data1.expressionText).toBe(data2.expressionText);
        expect(data1.correctAnswer).toBe(data2.correctAnswer);
        expect(data1.explanation).toBe(data2.explanation);
      }
    }
  });

  it('formats matches list with single numbers and non-negative ranges correctly', () => {
    expect(formatMatchesList([])).toBe('');
    expect(formatMatchesList([5])).toBe('5');
    expect(formatMatchesList([1, 2, 3])).toBe('1–3');
    expect(formatMatchesList([10, 11, 12, 20, 25, 26])).toBe('10–12, 20, 25–26');
  });

  it('formats matches list with negative boundaries using "от ... до ..."', () => {
    expect(formatMatchesList([-5, -4, -3])).toBe('от -5 до -3');
    expect(formatMatchesList([-20000, -19999, -19998, 39])).toBe('от -20000 до -19998, 39');
    expect(formatMatchesList([-10, -9, -8, 0, 1, 2])).toBe('от -10 до -8, 0–2');
  });

  it('ensures absence of Python keywords in explanations across generated tasks', () => {
    const bannedSnippets = ['python', 'Python', 'print(', 'range(', 'for x in'];
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let seed = 1; seed <= 20; seed++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(seed)) as Task3Data;
        for (const snippet of bannedSnippets) {
          expect(data.explanation).not.toContain(snippet);
        }
      }
    }
  });

  it('validates task integrity: non-empty explanation, Step 1, Step 4, and valid correctAnswer', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let seed = 1; seed <= 20; seed++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(seed)) as Task3Data;
        expect(data.explanation.length).toBeGreaterThan(0);
        expect(data.explanation).toContain('Шаг 1');
        expect(data.explanation).toContain('Шаг 4');
        expect(data.correctAnswer.length).toBeGreaterThan(0);
        expect(Number.isNaN(Number(data.correctAnswer))).toBe(false);
      }
    }
  });

  it('negateNode correctly inverts comparison operators', () => {
    expect(negateNode({ type: 'cmp', op: '<', k: 10 })).toEqual({ type: 'cmp', op: '>=', k: 10 });
    expect(negateNode({ type: 'cmp', op: '<=', k: 10 })).toEqual({ type: 'cmp', op: '>', k: 10 });
    expect(negateNode({ type: 'cmp', op: '>', k: 10 })).toEqual({ type: 'cmp', op: '<=', k: 10 });
    expect(negateNode({ type: 'cmp', op: '>=', k: 10 })).toEqual({ type: 'cmp', op: '<', k: 10 });
    expect(negateNode({ type: 'cmp', op: '=', k: 10 })).toEqual({ type: 'cmp', op: '!=', k: 10 });
    expect(negateNode({ type: 'cmp', op: '!=', k: 10 })).toEqual({ type: 'cmp', op: '=', k: 10 });
  });

  it('negateNode correctly inverts parity and firstdigit predicates', () => {
    expect(negateNode({ type: 'parity', parity: 'even' })).toEqual({ type: 'parity', parity: 'odd' });
    expect(negateNode({ type: 'parity', parity: 'odd' })).toEqual({ type: 'parity', parity: 'even' });
    expect(negateNode({ type: 'firstdigit', parity: 'even' })).toEqual({ type: 'firstdigit', parity: 'odd' });
    expect(negateNode({ type: 'firstdigit', parity: 'odd' })).toEqual({ type: 'firstdigit', parity: 'even' });
  });

  it('negateNode correctly handles div, not, and de Morgan on and/or', () => {
    const divNode: LogicalNode = { type: 'div', divK: 5 };
    expect(negateNode(divNode)).toEqual({ type: 'not', children: [divNode] });

    const notNode: LogicalNode = { type: 'not', children: [divNode] };
    expect(negateNode(notNode)).toEqual(divNode);

    const andNode: LogicalNode = {
      type: 'and',
      children: [
        { type: 'cmp', op: '<', k: 5 },
        { type: 'cmp', op: '>', k: 10 }
      ]
    };
    expect(negateNode(andNode)).toEqual({
      type: 'or',
      children: [
        { type: 'cmp', op: '>=', k: 5 },
        { type: 'cmp', op: '<=', k: 10 }
      ]
    });
  });

  it('flattenNary flattens nested conjunctions and disjunctions', () => {
    const nestedAnd: LogicalNode = {
      type: 'and',
      children: [
        {
          type: 'and',
          children: [
            { type: 'cmp', op: '>', k: 1 },
            { type: 'cmp', op: '>', k: 2 }
          ]
        },
        { type: 'cmp', op: '>', k: 3 }
      ]
    };
    const flattened = flattenNary(nestedAnd);
    expect(flattened.type).toBe('and');
    if ('children' in flattened) {
      expect(flattened.children.length).toBe(3);
      expect(flattened.children[0]).toEqual({ type: 'cmp', op: '>', k: 1 });
      expect(flattened.children[1]).toEqual({ type: 'cmp', op: '>', k: 2 });
      expect(flattened.children[2]).toEqual({ type: 'cmp', op: '>', k: 3 });
    }
  });

  it('evalNode matches workingTree equivalence across 60 seeds x 3 levels over the search domain', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 60; s++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        const tree = data.tree!;
        const wantTrue = data.wantTrue;
        const workingTree = getWorkingTree(tree, wantTrue);

        const diffs: number[] = [];
        for (let x = -2000; x <= 2000; x++) {
          const orig = evalNode(tree, x) === wantTrue;
          const work = evalNode(workingTree, x) === true;
          if (orig !== work) {
            diffs.push(x);
            if (diffs.length >= 5) break;
          }
        }
        expect(diffs, `Mismatch at lvl=${lvl}, seed=${s}: ${data.expressionText} diffs: ${diffs}`).toEqual([]);
      }
    }
  });

  it('generates valid multiple-choice options for Level 1 when enabled', () => {
    let foundMC = false;
    for (let s = 1; s <= 50; s++) {
      const data = task3.generate(1, makeRng(s)) as Task3Data;
      if (data.options) {
        foundMC = true;
        expect(data.options.length).toBe(4);
        expect(data.options).toContain(data.correctAnswer);
        break;
      }
    }
    expect(foundMC).toBe(true);
  });

  it('generates valid questions and answers for all question types (min, max, count)', () => {
    const seenQTypes = new Set<string>();
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 30; s++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        seenQTypes.add(data.questionType);
      }
    }
    expect(seenQTypes.has('min')).toBe(true);
    expect(seenQTypes.has('max')).toBe(true);
    expect(seenQTypes.has('count')).toBe(true);
  });

  it('invariant test: condition texts in explanation strictly match workingTree.children across 60 seeds x 3 levels', () => {
    let testedCount = 0;
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 60; s++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        if (data.combDetails) continue;
        const workingTree = getWorkingTree(data.tree!, data.wantTrue);
        if ('children' in workingTree && workingTree.children.length > 1) {
          const step2 = data.explanation.split('Шаг 2')[1]?.split('Шаг 3')[0] || '';
          const lines = step2.split('\n').map((l) => l.trim());
          const condLines = lines.filter((l) => l.startsWith('• Условие'));
          const condTexts = condLines.map((line) => line.match(/^• Условие \d+:\s*(.+)$/)![1].trim());
          const expected = workingTree.children.map((c) => renderExplanationNodeText(c));
          expect(condTexts).toEqual(expected);
          testedCount++;
        }
      }
    }
    expect(testedCount).toBeGreaterThan(0);
  });

  it('pluralNumbers formats numbers correctly for all requested test cases', () => {
    expect(pluralNumbers(1)).toBe('1 число');
    expect(pluralNumbers(2)).toBe('2 числа');
    expect(pluralNumbers(4)).toBe('4 числа');
    expect(pluralNumbers(5)).toBe('5 чисел');
    expect(pluralNumbers(11)).toBe('11 чисел');
    expect(pluralNumbers(13)).toBe('13 чисел');
    expect(pluralNumbers(14)).toBe('14 чисел');
    expect(pluralNumbers(21)).toBe('21 число');
    expect(pluralNumbers(22)).toBe('22 числа');
    expect(pluralNumbers(24)).toBe('24 числа');
    expect(pluralNumbers(25)).toBe('25 чисел');
    expect(pluralNumbers(100)).toBe('100 чисел');
    expect(pluralNumbers(101)).toBe('101 число');
    expect(pluralNumbers(102)).toBe('102 числа');
    expect(pluralNumbers(105)).toBe('105 чисел');
    expect(pluralNumbers(111)).toBe('111 чисел');
    expect(pluralNumbers(1000)).toBe('1000 чисел');
  });

  it('divisibilityHint returns correct hints for all k in both positive and negated modes', () => {
    // positive (negated = false)
    expect(divisibilityHint(2, false)).toBe('последняя цифра чётная (0, 2, 4, 6, 8)');
    expect(divisibilityHint(3, false)).toBe('сумма цифр кратна 3');
    expect(divisibilityHint(4, false)).toBe('две последние цифры образуют число, кратное 4');
    expect(divisibilityHint(5, false)).toBe('последняя цифра 0 или 5');
    expect(divisibilityHint(6, false)).toBe('число чётное и сумма цифр кратна 3');
    expect(divisibilityHint(9, false)).toBe('сумма цифр кратна 9');
    expect(divisibilityHint(10, false)).toBe('последняя цифра 0');
    expect(divisibilityHint(7, false)).toBeNull();

    // negated (negated = true)
    expect(divisibilityHint(2, true)).toBe('последняя цифра нечётная (1, 3, 5, 7, 9)');
    expect(divisibilityHint(3, true)).toBe('сумма цифр не кратна 3');
    expect(divisibilityHint(4, true)).toBe('две последние цифры образуют число, не кратное 4');
    expect(divisibilityHint(5, true)).toBe('последняя цифра не 0 и не 5');
    expect(divisibilityHint(6, true)).toBe('число нечётное или сумма цифр не кратна 3');
    expect(divisibilityHint(9, true)).toBe('сумма цифр не кратна 9');
    expect(divisibilityHint(10, true)).toBe('последняя цифра не 0');
    expect(divisibilityHint(7, true)).toBeNull();
  });

  it('ensures absence of "НЕ (" and "((" in Step 2 and condition/digit lines across 60 seeds x 3 levels', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 60; s++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        const step2 = data.explanation.split('Шаг 2')[1]?.split('Шаг 3')[0] || '';
        expect(step2).not.toContain('НЕ (');
        expect(step2).not.toContain('((');
      }
    }
  });

  it('for 60 seeds x 3 levels explanation contains "Дано выражение:" and expressionText appears verbatim', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 60; s++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        expect(data.explanation).toContain(`Дано выражение: ${data.expressionText}.`);
      }
    }
  });

  it('de Morgan phrase test: bidirectional check across 60 seeds x 3 levels and edge cases', () => {
    function hasCompoundNot(node: LogicalNode): boolean {
      if (node.type === 'not') {
        const inner = node.children[0];
        if (inner.type === 'and' || inner.type === 'or') return true;
      }
      if ('children' in node) {
        return node.children.some(hasCompoundNot);
      }
      return false;
    }

    let testedCount = 0;
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 60; s++) {
        testedCount++;
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        const tree = data.tree!;
        const criterion = (data.wantTrue && hasCompoundNot(tree)) || (!data.wantTrue && (tree.type === 'and' || tree.type === 'or'));
        const hasPhrase = data.explanation.includes('де Моргана');
        expect(hasPhrase, `Mismatch at lvl=${lvl}, seed=${s}: expected ${criterion}`).toBe(criterion);
      }
    }
    console.log(`[de Morgan test] Verified bidirectional criterion on ${testedCount} tasks across 60 seeds x 3 levels.`);
    expect(testedCount).toBe(180);

    // Explicit case (i) from 2.5: (X > 5) И НЕ ((X < 10) ИЛИ (X > 25)), wantTrue = true -> phrase MUST be present
    const domain = getDomain('all');
    const treeI: LogicalNode = {
      type: 'and',
      children: [
        { type: 'cmp', op: '>', k: 5 },
        {
          type: 'not',
          children: [{
            type: 'or',
            children: [
              { type: 'cmp', op: '<', k: 10 },
              { type: 'cmp', op: '>', k: 25 }
            ]
          }]
        }
      ]
    };
    const expI = buildExplanation(treeI, domain, 'min', true, [26], '26');
    expect(expI.text).toContain(DEMORGAN_OR_TO_AND);

    // Explicit case (iii) from 2.5: single (X > 10), wantTrue = true -> phrase MUST NOT be present
    const treeIII: LogicalNode = {
      type: 'cmp',
      op: '>',
      k: 10
    };
    const expIII = buildExplanation(treeIII, domain, 'min', true, [11], '11');
    expect(expIII.text).not.toContain('де Моргана');

    // Case НЕ (X делится на 3), wantTrue = true -> phrase MUST NOT be present (leaf NOT)
    const treeLeafNot: LogicalNode = {
      type: 'not',
      children: [{ type: 'div', divK: 3 }]
    };
    const expLeafNot = buildExplanation(treeLeafNot, domain, 'min', true, [1], '1');
    expect(expLeafNot.text).not.toContain('де Моргана');
  });

  it('provides de Morgan phrase and OR disjunction explanation when root is AND and wantTrue = false', () => {
    const domain = getDomain('all');
    const treeAnd: LogicalNode = {
      type: 'and',
      children: [
        { type: 'cmp', op: '>', k: 10 },
        { type: 'cmp', op: '<', k: 25 }
      ]
    };

    const explanation = buildExplanation(
      treeAnd,
      domain,
      'min',
      false,
      [10, 9, 8],
      '10'
    );

    expect(explanation.text).toContain(DEMORGAN_AND_TO_OR);
    expect(explanation.text).toContain('Операция ИЛИ (дизъюнкция) истинна, если истинна хотя бы одна часть.');
    expect(explanation.text).toContain('Достаточно, чтобы выполнялось хотя бы одно условие.');
  });

  it('verifies that "(всего" is present in Step 3 when bounded, and omitted when ellipsis format is used across 60 seeds x 3 levels', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 60; s++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        const step3 = data.explanation.split('Шаг 3')[1]?.split('Шаг 4')[0] || '';
        if (step3.includes('Подходящие числа X')) {
          if (step3.includes('…')) {
            expect(step3, `Unbounded range should not contain "(всего" in lvl=${lvl}, seed=${s}`).not.toContain('(всего ');
          } else {
            expect(step3, `Missing "(всего" in lvl=${lvl}, seed=${s}`).toContain('(всего ');
          }
        }
      }
    }
  });

  it('verifies absence of glyphs ≥ and ≤ in Step 2 across 60 seeds x 3 levels', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 60; s++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        const step2 = data.explanation.split('Шаг 2')[1]?.split('Шаг 3')[0] || '';
        expect(step2, `Found glyph ≥ in Step 2 for lvl=${lvl}, seed=${s}`).not.toContain('≥');
        expect(step2, `Found glyph ≤ in Step 2 for lvl=${lvl}, seed=${s}`).not.toContain('≤');
      }
    }
  });

  it('verifies combinatorial block coverage for L3 seed 19: d1Lines lists all conditions on the first digit', () => {
    const data = task3.generate(3, makeRng(19)) as Task3Data;
    expect(data.combDetails).toBeDefined();
    expect(data.combDetails?.d1Lines).toBeDefined();
    const d1Text = data.combDetails!.d1Lines!.join('\n');
    expect(d1Text).toContain('(первая цифра чётная)');
    expect(d1Text).toContain('(X >= 40)');
    expect(d1Text).toContain('то есть первая цифра >= 4');
  });

  it('verifies absence of glyphs ≥ and ≤ across entire explanation for 60 seeds x 3 levels', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 60; s++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        expect(data.explanation, `Found ≥ in explanation for lvl=${lvl}, seed=${s}`).not.toContain('≥');
        expect(data.explanation, `Found ≤ in explanation for lvl=${lvl}, seed=${s}`).not.toContain('≤');
      }
    }
  });

  it('verifies that for qType count, correctAnswer does not exceed domain size', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 60; s++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        if (data.questionType === 'count') {
          const ans = Number(data.correctAnswer);
          expect(ans).toBeLessThanOrEqual(999);
          if (data.domainLabel.includes('двузначных')) {
            expect(ans).toBeLessThanOrEqual(90);
          } else if (data.domainLabel.includes('трёхзначных')) {
            expect(ans).toBeLessThanOrEqual(900);
          }
          expect(data.domainLabel).not.toBe('целых чисел X');
        }
      }
    }
  });

  it('verifies explanation does not contain substring 20000 across 60 seeds x 3 levels', () => {
    for (let lvl = 1; lvl <= 3; lvl++) {
      for (let s = 1; s <= 60; s++) {
        const data = task3.generate(lvl as 1 | 2 | 3, makeRng(s)) as Task3Data;
        expect(data.explanation, `Found 20000 in explanation for lvl=${lvl}, seed=${s}`).not.toContain('20000');
      }
    }
  });

  it('verifies case 3.3(a) generates de Morgan phrase for compound NOT in conjunction', () => {
    const treeA: LogicalNode = {
      type: 'and',
      children: [
        {
          type: 'not',
          children: [{
            type: 'or',
            children: [
              { type: 'cmp', op: '<', k: 25 },
              { type: 'cmp', op: '>', k: 53 }
            ]
          }]
        },
        { type: 'parity', parity: 'odd' }
      ]
    };
    const domain = getDomain('all');
    const explanation = buildExplanation(
      treeA,
      domain,
      'max',
      true,
      [25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53],
      '53'
    );
    expect(explanation.text).toContain(DEMORGAN_OR_TO_AND);
  });
});

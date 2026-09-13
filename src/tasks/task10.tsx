import React from 'react';
import { TaskModule, Difficulty } from '../types';
import { RNG } from '../utils/rng';
import { StatementBlock, StatementText, AnswerField, AnswerChip, VerdictBox, HintBox } from '../components/task-ui';

/**
 * Generator for Level 2 (Medium): Compare three numbers represented in different bases (2, 8, 16, 10).
 * Finding the largest or smallest of them, and outputting the decimal value.
 */
const generateCompareThreeNumbers = (rng?: RNG) => {
  const val1 = rng ? rng.int(20, 180) : Math.floor(Math.random() * (180 - 20 + 1)) + 20; // 20 to 180
  
  // Choose offsets ensuring all values are unique and in [20, 200]
  let val2 = val1;
  while (val2 === val1) {
    const offset = rng ? rng.int(-10, 10) : Math.floor(Math.random() * 21) - 10; // -10 to 10
    if (offset !== 0 && (val1 + offset >= 20) && (val1 + offset <= 200)) {
      val2 = val1 + offset;
    }
  }
  
  let val3 = val1;
  while (val3 === val1 || val3 === val2) {
    const offset = rng ? rng.int(-10, 10) : Math.floor(Math.random() * 21) - 10; // -10 to 10
    if (offset !== 0 && (val1 + offset !== val2 - val1) && (val1 + offset >= 20) && (val1 + offset <= 200)) {
      val3 = val1 + offset;
    }
  }

  const availableBases = [2, 8, 16];
  // Shuffle/pick 3 unique bases
  const pickedBases = rng ? rng.shuffle(availableBases) : [...availableBases].sort(() => Math.random() - 0.5);
  const base1 = pickedBases[0];
  const base2 = pickedBases[1];
  const base3 = pickedBases[2];

  const str1 = val1.toString(base1).toUpperCase();
  const str2 = val2.toString(base2).toUpperCase();
  const str3 = val3.toString(base3).toUpperCase();

  const askLargest = (rng ? rng.next() : Math.random()) < 0.5;
  const questionTypeStr = askLargest ? 'наибольшее' : 'наименьшее';

  let correctAnswerVal = val1;
  if (askLargest) {
    correctAnswerVal = Math.max(val1, val2, val3);
  } else {
    correctAnswerVal = Math.min(val1, val2, val3);
  }
  const correctAnswer = correctAnswerVal.toString();

  const statement = `Даны три числа, записанные в разных системах счисления:
- ${str1} в системе счисления с основанием ${base1},
- ${str2} в системе счисления с основанием ${base2},
- ${str3} в системе счисления с основанием ${base3}.

Найдите ${questionTypeStr} из этих чисел. В ответе запишите его в десятичной системе счисления. В ответе укажите только число, без указания системы счисления.`;

  const shortHint = `Чтобы сравнить числа, записанные в разных системах счисления, наиболее простым способом является перевод каждого из них в десятичную систему счисления (с основанием 10) по степеням соответствующего основания. После перевода сравните полученные десятичные значения и выберите ${questionTypeStr} из них.`;

  const getToDecimalExplanation = (numStr: string, base: number, decVal: number): string => {
    if (base === 10) {
      return `   - Число ${numStr} уже представлено в системе счисления с основанием 10:\n` +
             `     ${numStr}_10 = ${decVal}`;
    }
    return `   - Пронумеруем разряды числа ${numStr} справа налево (начиная с нуля):\n` +
           `     Разряды (степени):  ${numStr.split('').map((_, i) => numStr.length - 1 - i).join('  ')}\n` +
           `     Цифры числа:        ${numStr.split('').join('  ')}\n` +
           `     Разложим по степеням основания ${base} и вычислим сумму:\n` +
           `     ${numStr}_${base} = ${numStr.split('').reverse().map((char, index) => `${char} * ${base}^${index}`).reverse().join(' + ')} = ${decVal}_10`;
  };

  const hint = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n` +
    `Шаг 1. Переведём все три числа в десятичную систему счисления (основание 10):\n\n` +
    `1. Число ${str1} (основание ${base1}):\n` +
    `${getToDecimalExplanation(str1, base1, val1)}\n\n` +
    `2. Число ${str2} (основание ${base2}):\n` +
    `${getToDecimalExplanation(str2, base2, val2)}\n\n` +
    `3. Число ${str3} (основание ${base3}):\n` +
    `${getToDecimalExplanation(str3, base3, val3)}\n\n` +
    `Шаг 2. Сравним полученные десятичные числа:\n` +
    `   Получены значения: ${val1}, ${val2}, ${val3}.\n` +
    `   Требуется найти ${questionTypeStr} число.\n` +
    `   Среди чисел ${val1}, ${val2}, ${val3} ${questionTypeStr} значение — это ${correctAnswerVal}.\n\n` +
    `Правильный ответ: ${correctAnswer}`;

  return {
    correctAnswer,
    statement,
    shortHint,
    hint
  };
};

/**
 * Generator for Level 2 (Medium): Sum or count of specific digits of a number in a given base.
 * Supports:
 * - Subtype A: Sum of digits (translated to/from base 10 and 2, 8, 16)
 * - Subtype B: Count of units/zeros in binary (translated from decimal to base 2)
 */
const generateSumOrCountOfDigits = (rng?: RNG) => {
  const isSumQuestion = (rng ? rng.next() : Math.random()) < 0.5;

  let statement = '';
  let correctAnswer = '';
  let shortHint = '';
  let hint = 'ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n';

  // Help calculate sum of hex values
  const getSumOfDigits = (str: string) => {
    let sum = 0;
    const hexDigits = '0123456789ABCDEF';
    const parts: string[] = [];
    const detailsParts: string[] = [];

    for (const char of str) {
      const val = hexDigits.indexOf(char);
      sum += val;
      if (val >= 10) {
        parts.push(`${val} (из буквы ${char})`);
        detailsParts.push(`${char} (${val})`);
      } else {
        parts.push(`${val}`);
        detailsParts.push(`${char}`);
      }
    }

    const expression = parts.join(' + ');
    const details = detailsParts.join(' + ');
    return { sum, expression, details };
  };

  // Helper to generate step-by-step division process
  const getDivisionDetailsLocal = (val: number, base: number): string => {
    let steps: string[] = [];
    let tempValue = val;
    if (tempValue === 0) {
      return `   • 0 : ${base} = 0 (остаток 0)`;
    }
    while (tempValue > 0) {
      const quotient = Math.floor(tempValue / base);
      const remainder = tempValue % base;
      let remainderStr = remainder.toString();
      if (base === 16 && remainder >= 10) {
        const hexDigits = '0123456789ABCDEF';
        remainderStr = `${remainder} (${hexDigits[remainder]})`;
      }
      steps.push(`   • ${tempValue} : ${base} = ${quotient} (остаток: ${remainderStr})`);
      tempValue = quotient;
    }
    return steps.join('\n');
  };

  if (isSumQuestion) {
    // SUBTYPE A: Sum of digits (system 2, 8, 16 is translated to/from system 10)
    const decimalValue = rng ? rng.int(50, 500) : Math.floor(Math.random() * (500 - 50 + 1)) + 50;
    const nonDecBases = [2, 8, 16];
    let fromBase = 10;
    let toBase = 10;

    if ((rng ? rng.next() : Math.random()) < 0.5) {
      // Direction 1: Non-decimal -> Decimal (base 10)
      fromBase = rng ? rng.pick(nonDecBases) : nonDecBases[Math.floor(Math.random() * nonDecBases.length)];
      toBase = 10;
    } else {
      // Direction 2: Decimal (base 10) -> Non-decimal
      fromBase = 10;
      toBase = rng ? rng.pick(nonDecBases) : nonDecBases[Math.floor(Math.random() * nonDecBases.length)];
    }

    const fromStr = decimalValue.toString(fromBase).toUpperCase();
    const toStr = decimalValue.toString(toBase).toUpperCase();

    const { sum, expression, details } = getSumOfDigits(toStr);
    correctAnswer = sum.toString();

    statement = `Дано число ${fromStr} в системе счисления с основанием ${fromBase}. Запишите его в системе счисления с основанием ${toBase} и найдите сумму его цифр. В ответе укажите только число.`;
    shortHint = `Сначала переведите число ${fromStr} из основания ${fromBase} в систему счисления с основанием ${toBase}, а затем сложите все его цифры.` +
                (toBase === 16 ? ` Обратите внимание, что в шестнадцатеричной системе буквы A–F при подсчёте суммы считаются как числа от 10 до 15.` : ``);

    let stepNum = 1;
    if (fromBase !== 10) {
      const toDecimalExplanation = `   Пронумеруем разряды числа ${fromStr} справа налево (начиная с нуля):\n` +
        `   Разряды (степени):  ${fromStr.split('').map((_, i) => fromStr.length - 1 - i).join('  ')}\n` +
        `   Цифры числа:        ${fromStr.split('').join('  ')}\n` +
        `   Разложим по степеням основания ${fromBase} и вычислим сумму:\n` +
        `   ${fromStr}_${fromBase} = ${fromStr.split('').reverse().map((char, index) => `${char} * ${fromBase}^${index}`).reverse().join(' + ')} = ${decimalValue}_10`;

      hint += `Шаг ${stepNum}. Переведём число ${fromStr} из системы счисления с основанием ${fromBase} в десятичную систему счисления (основание 10):\n` +
        toDecimalExplanation + `\n\n`;
      stepNum++;
    }

    if (toBase !== 10) {
      const fromDecimalExplanation = `   Для этого выполним последовательное деление десятичного числа ${decimalValue} на ${toBase} с остатком, пока не получим частное 0:\n` +
        `${getDivisionDetailsLocal(decimalValue, toBase)}\n\n` +
        `   Выписываем полученные остатки в обратном порядке (снизу вверх) и получаем запись числа в системе счисления с основанием ${toBase}: ${toStr}.`;

      hint += `Шаг ${stepNum}. Переведём десятичное число ${decimalValue} в систему счисления с основанием ${toBase} (последовательное деление на основание):\n` +
        fromDecimalExplanation + `\n\n`;
      stepNum++;
    }

    hint += `Шаг ${stepNum}. Найдём сумму цифр полученного числа ${toStr}_${toBase}:\n` +
      `   Запись числа: ${toStr}\n` +
      `   Сложим все цифры${toBase === 16 ? ' (при этом буквы A–F считаются как числа от 10 до 15)' : ''}: ${details} = ${expression} = ${sum}.\n\n` +
      `Правильный ответ: ${sum}`;

  } else {
    // SUBTYPE B: Count of ones or zeros in binary representation
    const decimalValue = rng ? rng.int(50, 500) : Math.floor(Math.random() * (500 - 50 + 1)) + 50;
    const fromBase = 10;
    const toBase = 2;

    const fromStr = decimalValue.toString(fromBase);
    const toStr = decimalValue.toString(toBase);

    const askOnes = (rng ? rng.next() : Math.random()) < 0.5;
    const targetDigit = askOnes ? '1' : '0';
    const digitName = askOnes ? 'единиц' : 'нулей';

    const count = toStr.split(targetDigit).length - 1;
    correctAnswer = count.toString();

    statement = `Дано число ${fromStr} в системе счисления с основанием 10. Запишите его в двоичной системе счисления и определите, сколько в полученной записи ${digitName}. В ответе укажите только число.`;
    shortHint = `Сначала переведите число ${fromStr} из десятичной системы счисления в двоичную (последовательным делением на 2), а затем посчитайте количество ${digitName} в полученной записи.`;

    let stepNum = 1;

    const fromDecimalExplanation = `   Для этого выполним последовательное деление десятичного числа ${decimalValue} на 2 с остатком, пока не получим частное 0:\n` +
      `${getDivisionDetailsLocal(decimalValue, 2)}\n\n` +
      `   Выписываем полученные остатки в обратном порядке (снизу вверх) и получаем запись числа в двоичной системе счисления: ${toStr}.`;

    hint += `Шаг ${stepNum}. Переведём десятичное число ${decimalValue} в двоичную систему счисления (последовательное деление на 2):\n` +
      fromDecimalExplanation + `\n\n`;
    stepNum++;

    const highlightedStr = toStr.split('').map(char => char === targetDigit ? `[${char}]` : char).join(' ');
    
    let countText = '';
    if (count === 1) {
      countText = '1 раз';
    } else if (count >= 2 && count <= 4) {
      countText = `${count} раза`;
    } else {
      countText = `${count} раз`;
    }

    hint += `Шаг ${stepNum}. Посчитаем, сколько раз цифра ${targetDigit} встречается в двоичной записи ${toStr}_2:\n` +
      `   Запись числа: ${toStr}\n` +
      `   Подсветим искомые цифры (${digitName}): ${highlightedStr}\n` +
      `   Цифра ${targetDigit} встречается ровно ${countText}.\n\n` +
      `Правильный ответ: ${count}`;
  }

  return {
    correctAnswer,
    statement,
    shortHint,
    hint
  };
};

/**
 * Generator for Level 3 (Hard / Повышенный): Evaluate an expression with mixed base systems.
 */
const generateMixedBaseExpression = (rng?: RNG) => {
  let val1 = 0, val2 = 0, val3 = 0;
  let base1 = 0, base2 = 0, base3 = 0;
  let str1 = '', str2 = '', str3 = '';
  let op1 = '+', op2 = '+';
  let numOperands = 2;
  let result = 0;

  while (true) {
    numOperands = (rng ? rng.next() : Math.random()) < 0.5 ? 2 : 3;

    const bases1 = [2, 8, 16];
    base1 = rng ? rng.pick(bases1) : bases1[Math.floor(Math.random() * 3)];
    const bases2 = bases1.filter(b => b !== base1);
    base2 = rng ? rng.pick(bases2) : bases2[Math.floor(Math.random() * 2)];
    if (numOperands === 3) {
      const bases3 = bases1.filter(b => b !== base2);
      base3 = rng ? rng.pick(bases3) : bases3[Math.floor(Math.random() * 2)];
    }

    val1 = rng ? rng.int(10, 100) : Math.floor(Math.random() * (100 - 10 + 1)) + 10;
    val2 = rng ? rng.int(10, 100) : Math.floor(Math.random() * (100 - 10 + 1)) + 10;
    if (numOperands === 3) {
      val3 = rng ? rng.int(10, 100) : Math.floor(Math.random() * (100 - 10 + 1)) + 10;
    }

    op1 = (rng ? rng.next() : Math.random()) < 0.5 ? '+' : '-';
    if (numOperands === 3) {
      op2 = (rng ? rng.next() : Math.random()) < 0.5 ? '+' : '-';
    }

    if (numOperands === 2) {
      result = (op1 === '+') ? val1 + val2 : val1 - val2;
    } else {
      const temp = (op1 === '+') ? val1 + val2 : val1 - val2;
      result = (op2 === '+') ? temp + val3 : temp - val3;
    }

    if (result > 0) {
      str1 = val1.toString(base1).toUpperCase();
      str2 = val2.toString(base2).toUpperCase();
      if (numOperands === 3) {
        str3 = val3.toString(base3).toUpperCase();
      }
      break;
    }
  }

  const displayOp1 = op1 === '-' ? '−' : '+';
  const displayOp2 = op2 === '-' ? '−' : '+';

  let exprStr = '';
  if (numOperands === 2) {
    exprStr = `${str1} (основание ${base1}) ${displayOp1} ${str2} (основание ${base2})`;
  } else {
    exprStr = `${str1} (основание ${base1}) ${displayOp1} ${str2} (основание ${base2}) ${displayOp2} ${str3} (основание ${base3})`;
  }

  const statement = `Вычислите значение выражения:\n${exprStr}\n\nОтвет запишите в десятичной системе счисления. В ответе укажите только число.`;

  const shortHint = `Переведите каждое число в десятичную систему (по степеням основания), затем выполните арифметические действия по порядку.`;

  const getLocalDecimalExplanation = (numStr: string, base: number, decVal: number): string => {
    return `   Пронумеруем разряды числа ${numStr} справа налево (начиная с нуля):\n` +
           `     Разряды (степени):  ${numStr.split('').map((_, i) => numStr.length - 1 - i).join('  ')}\n` +
           `     Цифры числа:        ${numStr.split('').join('  ')}\n` +
           `     Разложим по степеням основания ${base} и вычислим сумму:\n` +
           `     ${numStr}_${base} = ${numStr.split('').reverse().map((char, index) => `${char} * ${base}^${index}`).reverse().join(' + ')} = ${decVal}_10`;
  };

  let hint = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n`;
  hint += `Шаг 1. Переведём все числа в десятичную систему счисления (основание 10):\n\n`;
  hint += `1. Число ${str1} (основание ${base1}):\n` + getLocalDecimalExplanation(str1, base1, val1) + `\n\n`;
  hint += `2. Число ${str2} (основание ${base2}):\n` + getLocalDecimalExplanation(str2, base2, val2) + `\n\n`;
  if (numOperands === 3) {
    hint += `3. Число ${str3} (основание ${base3}):\n` + getLocalDecimalExplanation(str3, base3, val3) + `\n\n`;
  }

  hint += `Шаг 2. Выполним арифметические действия в десятичной системе счисления:\n`;
  if (numOperands === 2) {
    hint += `   Выражение: ${val1} ${displayOp1} ${val2}\n`;
    hint += `   Вычисление: ${val1} ${displayOp1} ${val2} = ${result}\n\n`;
  } else {
    const step1Result = (op1 === '+') ? val1 + val2 : val1 - val2;
    hint += `   Выражение: ${val1} ${displayOp1} ${val2} ${displayOp2} ${val3}\n`;
    hint += `   1) Первое действие: ${val1} ${displayOp1} ${val2} = ${step1Result}\n`;
    hint += `   2) Второе действие: ${step1Result} ${displayOp2} ${val3} = ${result}\n\n`;
  }

  hint += `Правильный ответ: ${result}`;

  return {
    correctAnswer: result.toString(),
    statement,
    shortHint,
    hint
  };
};

/**
 * Generator for Level 3 (Hard / Повышенный): Non-standard bases.
 * Supports:
 * - Subtype A: Translate a single number between a non-standard base (3,5,6,7,9,11,12,13,14,15) and base 10.
 * - Subtype B: Find the sum of digits of a translation between non-standard base and base 10.
 */
const generateNonStandardBases = (rng?: RNG) => {
  const pool = [3, 5, 6, 7, 9, 11, 12, 13, 14, 15];
  const nonStandardBase = rng ? rng.pick(pool) : pool[Math.floor(Math.random() * pool.length)];
  const isSum = (rng ? rng.next() : Math.random()) < 0.5;

  const decimalValue = rng ? rng.int(20, 150) : Math.floor(Math.random() * (150 - 20 + 1)) + 20;

  let fromBase = 10;
  let toBase = 10;

  if ((rng ? rng.next() : Math.random()) < 0.5) {
    fromBase = 10;
    toBase = nonStandardBase;
  } else {
    fromBase = nonStandardBase;
    toBase = 10;
  }

  const fromStr = decimalValue.toString(fromBase).toUpperCase();
  const toStr = decimalValue.toString(toBase).toUpperCase();

  // Helper to generate step-by-step division process
  const getDivisionDetailsLocal = (val: number, base: number): string => {
    let steps: string[] = [];
    let tempValue = val;
    if (tempValue === 0) {
      return `   • 0 : ${base} = 0 (остаток 0)`;
    }
    while (tempValue > 0) {
      const quotient = Math.floor(tempValue / base);
      const remainder = tempValue % base;
      let remainderStr = remainder.toString();
      if (base > 10 && remainder >= 10) {
        const char = String.fromCharCode(65 + (remainder - 10)); // A, B, C...
        remainderStr = `${remainder} (${char})`;
      }
      steps.push(`   • ${tempValue} : ${base} = ${quotient} (остаток: ${remainderStr})`);
      tempValue = quotient;
    }
    return steps.join('\n');
  };

  // Helper to generate step-by-step conversion to decimal
  const getToDecimalExplanationLocal = (numStr: string, base: number, decVal: number): string => {
    const lettersMap: Record<string, number> = {
      'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15
    };
    const parts: string[] = [];
    const reversed = numStr.split('').reverse();
    for (let index = reversed.length - 1; index >= 0; index--) {
      const char = reversed[index];
      const val = lettersMap[char] !== undefined ? lettersMap[char] : parseInt(char, 10);
      parts.push(`${char} * ${base}^${index}`);
    }
    const sumExpr = parts.join(' + ');

    let numericSumExpr = '';
    const hasLetters = numStr.split('').some(c => lettersMap[c] !== undefined);
    if (hasLetters) {
      const numParts = reversed.map((char, index) => {
        const val = lettersMap[char] !== undefined ? lettersMap[char] : parseInt(char, 10);
        return `${val} * ${base}^${index}`;
      }).reverse();
      numericSumExpr = `\n     Заменив буквы их числовыми значениями:\n     = ${numParts.join(' + ')}`;
    }

    return `   - Пронумеруем разряды числа ${numStr} справа налево (начиная с нуля):\n` +
           `     Разряды (степени):  ${numStr.split('').map((_, i) => numStr.length - 1 - i).join('  ')}\n` +
           `     Цифры числа:        ${numStr.split('').join('  ')}\n` +
           `     Разложим по степеням основания ${base} и вычислим сумму:\n` +
           `     ${numStr}_${base} = ${sumExpr}${numericSumExpr} = ${decVal}_10`;
  };

  const getSumOfDigitsLocal = (str: string, base: number) => {
    let sum = 0;
    const digitsMap: Record<string, number> = {};
    const hexDigits = '0123456789ABCDEF';
    for (let i = 0; i < base; i++) {
       const char = hexDigits[i];
       digitsMap[char] = i;
    }
    const parts: string[] = [];
    const detailsParts: string[] = [];

    for (const char of str) {
      const val = digitsMap[char] !== undefined ? digitsMap[char] : 0;
      sum += val;
      if (val >= 10) {
        parts.push(`${val} (из буквы ${char})`);
        detailsParts.push(`${char} (${val})`);
      } else {
        parts.push(`${val}`);
        detailsParts.push(`${char}`);
      }
    }

    const expression = parts.join(' + ');
    const details = detailsParts.join(' + ');
    return { sum, expression, details };
  };

  let statement = '';
  let correctAnswer = '';
  let shortHint = '';
  let hint = 'ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n';

  if (!isSum) {
    // OPERATION A: Simple translate
    correctAnswer = toStr;
    statement = `Переведите число ${fromStr} из системы счисления с основанием ${fromBase} в систему счисления с основанием ${toBase}. В ответе укажите только число.`;

    if (fromBase === 10) {
      shortHint = `Чтобы перевести десятичное число ${fromStr} в систему счисления с основанием ${toBase}, вам нужно последовательно делить число на ${toBase} с остатком, записывая остатки от деления. Запись всех полученных остатков в обратном порядке — снизу вверх даст искомое число.`;
      if (toBase > 10) {
        shortHint += ` Обратите внимание, что буквенные обозначения в системе счисления с основанием ${toBase} соответствуют следующим значениям: A = 10, B = 11, C = 12, D = 13, E = 14.`;
      }

      hint += `Шаг 1. Переведём число ${decimalValue} из десятичной системы счисления в систему счисления с основанием ${toBase} (последовательное деление на основание):\n` +
        getDivisionDetailsLocal(decimalValue, toBase) + `\n\n` +
        `Выписываем остатки снизу вверх и получаем число в целевой системе: ${toStr}.\n\n` +
        `Правильный ответ: ${toStr}`;
    } else {
      shortHint = `Чтобы перевести число ${fromStr} из системы счисления с основанием ${fromBase} в десятичную, разложите его по степеням основания ${fromBase}. Пронумеруйте разряды числа ${fromStr} справа налево (начиная с 0), умножьте каждую цифру на ${fromBase} в соответствующей степени и сложите полученные результаты.`;
      if (fromBase > 10) {
        shortHint += ` Обратите внимание, что буквенные обозначения при расчётах переводятся в числовые значения: A = 10, B = 11, C = 12, D = 13, E = 14.`;
      }

      hint += `Шаг 1. Переведём число ${fromStr} из системы счисления с основанием ${fromBase} в десятичную систему счисления (основание 10):\n` +
        getToDecimalExplanationLocal(fromStr, fromBase, decimalValue) + `\n\n` +
        `Правильный ответ: ${toStr}`;
    }
  } else {
    // OPERATION B: Sum of digits
    const { sum, expression, details } = getSumOfDigitsLocal(toStr, toBase);
    correctAnswer = sum.toString();

    statement = `Дано число ${fromStr} в системе счисления с основанием ${fromBase}. Запишите его в системе счисления с основанием ${toBase} и найдите сумму его цифр. В ответе укажите только число.`;

    if (toBase > 10) {
      shortHint = `Сначала переведите число ${fromStr} из основания ${fromBase} в систему счисления с основанием ${toBase}, а затем сложите все его цифры.` +
                  ` Обратите внимание, что буквенные обозначения при подсчёте суммы считаются как их числовые значения: A = 10, B = 11, C = 12, D = 13, E = 14.`;
    } else {
      shortHint = `Сначала переведите число ${fromStr} из основания ${fromBase} в систему счисления с основанием ${toBase}, а затем сложите все его цифры.`;
      if (fromBase > 10) {
        shortHint += ` При переводе из основания ${fromBase} в десятичную, обратите внимание на значения букв: A = 10, B = 11, C = 12, D = 13, E = 14.`;
      }
    }

    let stepNum = 1;
    if (fromBase === 10) {
      hint += `Шаг ${stepNum}. Переведём число ${decimalValue} из десятичной системы счисления в систему счисления с основанием ${toBase} (последовательное деление на основание):\n` +
        getDivisionDetailsLocal(decimalValue, toBase) + `\n\n` +
        `Выписываем остатки снизу вверх и получаем запись числа в системе счисления с основанием ${toBase}: ${toStr}.\n\n`;
      stepNum++;
    } else {
      hint += `Шаг ${stepNum}. Переведём число ${fromStr} из системы счисления с основанием ${fromBase} в десятичную систему счисления (основание 10):\n` +
        getToDecimalExplanationLocal(fromStr, fromBase, decimalValue) + `\n\n`;
      stepNum++;
    }

    hint += `Шаг ${stepNum}. Найдём сумму цифр полученного числа ${toStr}_${toBase}:\n` +
      `   Запись числа: ${toStr}\n` +
      `   Сложим все цифры: ${details} = ${expression} = ${sum}.\n\n` +
      `Правильный ответ: ${sum}`;
  }

  return {
    correctAnswer,
    statement,
    shortHint,
    hint
  };
};

/**
 * Generator for Level 3 (Hard / Повышенный): Find base of unknown system of numeration.
 * Supports finding base x for equation N_x = M_10.
 * In this version, N is strictly 2-digit, using only digits 0..9, with x in 3..16 (excluding 10).
 */
const generateFindBase = (rng?: RNG) => {
  let x = 0;
  let N = "";
  let M = 0;
  let valid = false;

  while (!valid) {
    x = rng ? rng.int(3, 16) : Math.floor(Math.random() * (16 - 3 + 1)) + 3; // [3..16]
    if (x === 10) {
      continue; // Prevent degenerate case where N_10 = M_10
    }

    const maxDigit = Math.min(9, x - 1);
    const dig1 = rng ? rng.int(1, maxDigit) : Math.floor(Math.random() * maxDigit) + 1; // 1..maxDigit
    const dig2 = rng ? rng.int(0, maxDigit) : Math.floor(Math.random() * (maxDigit + 1)); // 0..maxDigit

    const tempN = `${dig1}${dig2}`;
    const decimalVal = dig1 * x + dig2;

    // Check uniqueness of solution in range [3..16]
    let solutionsCount = 0;
    for (let y = 3; y <= 16; y++) {
      if (y === 10) continue; // Skip degenerate base 10
      // For any other base, check if digits are valid in base y
      if (dig1 < y && dig2 < y) {
        if (dig1 * y + dig2 === decimalVal) {
          solutionsCount++;
        }
      }
    }

    if (solutionsCount === 1) {
      N = tempN;
      M = decimalVal;
      valid = true;
    }
  }

  const dig1 = parseInt(N[0], 10);
  const dig2 = parseInt(N[1], 10);

  const statement = `В некоторой системе счисления с основанием x число записывается как ${N}, а его значение в десятичной системе равно ${M}. Найдите основание x. В ответе укажите только число.`;

  const shortHint = `Запишите число по разрядам, где каждая цифра умножается на основание в степени её позиции, и подберите основание, дающее нужное значение.`;

  let hint = 'ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n';
  hint += `Шаг 1. Представим двузначное число ${N}_x в развёрнутом виде по степеням неизвестного основания x:\n` +
          `   ${N}_x = ${dig1} · x¹ + ${dig2} · x⁰\n` +
          `   Поскольку x⁰ = 1, а x¹ = x, запись принимает вид:\n` +
          `   ${N}_x = ${dig1} · x + ${dig2}\n\n` +
          `Шаг 2. Составим уравнение, приравняв полученное выражение к десятичному значению ${M}:\n` +
          `   ${dig1} · x + ${dig2} = ${M}\n\n` +
          `Шаг 3. Решим полученное линейное уравнение:\n` +
          `   ${dig1} · x = ${M} - ${dig2}\n` +
          `   ${dig1} · x = ${M - dig2}\n`;
  if (dig1 > 1) {
    hint += `   x = ${M - dig2} / ${dig1}\n`;
  }
  hint += `   x = ${x}\n\n` +
          `Проверка:\n` +
          `   ${dig1} · ${x} + ${dig2} = ${dig1 * x} + ${dig2} = ${M} (верно).\n\n` +
          `Правильный ответ: ${x}`;

  return {
    correctAnswer: x.toString(),
    statement,
    shortHint,
    hint
  };
};

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

export const task10: TaskModule = {
  id: 10,
  title: 'Системы счисления',
  description: 'Перевод чисел между системами счисления с разными основаниями.',
  topics: ['Системы счисления', 'Сравнение чисел'], // TODO: уточнить формулировки
  maxPoints: 1,
  
  generate: (difficulty: Difficulty, rng: RNG) => {
    if (difficulty === 1) {
      let fromBase = 10;
      let toBase = 10;
      const nonDecBases = [2, 8, 16];
      // Pick one non-decimal base and base 10 (2↔10, 8↔10, 16↔10)
      const otherBase = rng ? rng.pick(nonDecBases) : nonDecBases[Math.floor(Math.random() * nonDecBases.length)];
      if ((rng ? rng.next() : Math.random()) < 0.5) {
        fromBase = otherBase;
        toBase = 10;
      } else {
        fromBase = 10;
        toBase = otherBase;
      }

      // Generate an integer between 10 and 255
      const decimalValue = rng ? rng.int(10, 255) : Math.floor(Math.random() * (255 - 10 + 1)) + 10;
      
      // Represent in source and target bases (uppercase letters A-F)
      const fromStr = decimalValue.toString(fromBase).toUpperCase();
      const toStr = decimalValue.toString(toBase).toUpperCase();

      const statement = `Дано число ${fromStr}, записанное в системе счисления с основанием ${fromBase}. Запишите это число в системе счисления с основанием ${toBase}. В ответе укажите только число, без указания системы счисления.`;

      // Short thought-guiding hint before submission (Краткая наводка)
      let shortHint = '';
      if (fromBase === 10) {
        shortHint = `Чтобы перевести десятичное число ${fromStr} в систему счисления с основанием ${toBase}, вам нужно последовательно делить число на ${toBase}, записывая остатки от деления. Запишите все полученные остатки в обратном порядке — снизу вверх, это и будет искомым числом.`;
      } else if (toBase === 10) {
        shortHint = `Чтобы перевести число ${fromStr} из системы счисления с основанием ${fromBase} в десятичную, разложите его по степеням основания ${fromBase}. Пронумеруйте разряды числа ${fromStr} справа налево (начиная с 0), умножьте каждую цифру на ${fromBase} в соответствующей степени и сложите полученные результаты.`;
      } else {
        shortHint = `Для перевода числа ${fromStr} из основания ${fromBase} в основание ${toBase}, сначала переведите его в десятичную систему счисления (разложив по степеням основания ${fromBase}), а затем полученное десятичное число переведите в целевую систему с основанием ${toBase}, последовательно деля его на ${toBase} с остатком.`;
      }

      // Helper to generate step-by-step division process for comprehensive explanation
      const getDivisionDetails = (val: number, base: number): string => {
        let steps: string[] = [];
        let tempValue = val;
        if (tempValue === 0) {
          return `   • 0 : ${base} = 0 (остаток 0)`;
        }
        while (tempValue > 0) {
          const quotient = Math.floor(tempValue / base);
          const remainder = tempValue % base;
          let remainderStr = remainder.toString();
          if (base === 16 && remainder >= 10) {
            const hexDigits = '0123456789ABCDEF';
            remainderStr = `${remainder} (${hexDigits[remainder]})`;
          }
          steps.push(`   • ${tempValue} : ${base} = ${quotient} (остаток: ${remainderStr})`);
          tempValue = quotient;
        }
        return steps.join('\n');
      };

      // Comprehensive resolution details (ПОЛНЫЙ РАЗБОР)
      const toDecimalExplanation = `   Пронумеруем разряды числа ${fromStr} справа налево (начиная с нуля):\n` +
        `   Разряды (степени):  ${fromStr.split('').map((_, i) => fromStr.length - 1 - i).join('  ')}\n` +
        `   Цифры числа:        ${fromStr.split('').join('  ')}\n` +
        `   Запишем сумму произведений цифр числа на основание ${fromBase} в соответствующих степенях:\n` +
        `   ${fromStr}_${fromBase} = ${fromStr.split('').reverse().map((char, index) => `${char} * ${fromBase}^${index}`).reverse().join(' + ')} = ${decimalValue}_10`;

      const fromDecimalExplanation = `   Для этого выполним последовательное деление ${decimalValue} на ${toBase} с остатком, пока не получим частное 0:\n` +
        `${getDivisionDetails(decimalValue, toBase)}\n\n` +
        `   Выписываем полученные остатки в обратном порядке (снизу вверх) и получаем искомое число: ${toStr}.`;

      let hint = `ПОЛНЫЙ ПОШАГОВЫЙ РАЗБОР:\n\n`;

      if (fromBase !== 10 && toBase === 10) {
        hint += `Переведём число ${fromStr} из системы счисления с основанием ${fromBase} в систему счисления с основанием 10 (разложение по степеням):\n` +
          toDecimalExplanation + `\n\n` +
          `Правильный ответ: ${toStr}`;
      } else if (fromBase === 10 && toBase !== 10) {
        hint += `Переведём число ${decimalValue} из системы счисления с основанием 10 в систему счисления с основанием ${toBase} (последовательное деление на основание):\n` +
          fromDecimalExplanation + `\n\n` +
          `Правильный ответ: ${toStr}`;
      } else {
        hint += `Шаг 1. Перевод исходного числа ${fromStr} (основание ${fromBase}) в десятичную систему счисления (основание 10):\n` +
          toDecimalExplanation + `\n\n` +
          `Шаг 2. Перевод полученного десятичного числа ${decimalValue} в целевую систему счисления с основанием ${toBase}:\n` +
          fromDecimalExplanation + `\n\n` +
          `Правильный ответ: ${toStr}`;
      }

      return {
        fromBase,
        toBase,
        decimalValue,
        fromStr,
        correctAnswer: toStr,
        statement,
        shortHint,
        hint
      };
    } else if (difficulty === 2) {
      const level2Types = [
        generateCompareThreeNumbers,
        generateSumOrCountOfDigits
      ];
      const selectedGenerator = rng ? rng.pick(level2Types) : level2Types[Math.floor(Math.random() * level2Types.length)];
      return selectedGenerator(rng);
    } else {
      const level3Types = [
        generateMixedBaseExpression,
        generateNonStandardBases,
        generateFindBase
      ];
      const selectedGenerator = rng ? rng.pick(level3Types) : level3Types[Math.floor(Math.random() * level3Types.length)];
      return selectedGenerator(rng);
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
          placeholder="Введите число…"
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
      const u = str.trim().toUpperCase();
      const map: Record<string, string> = {
        'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H',
        'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T',
        'Х': 'X', 'У': 'Y'
      };
      return u.split('').map(char => map[char] || char).join('');
    };
    return normalize(userAnswer) === normalize(taskData.correctAnswer);
  }
};

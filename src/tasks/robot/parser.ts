import { Dir } from './types';

export class RobotParseError extends Error {
  line: number;

  constructor(message: string, line: number) {
    super(message);
    this.name = 'RobotParseError';
    this.line = line;
  }
}

export type Cond =
  | { kind: 'free'; dir: Dir }
  | { kind: 'wall'; dir: Dir }
  | { kind: 'painted' }
  | { kind: 'clean' }
  | { kind: 'not'; a: Cond }
  | { kind: 'and'; a: Cond; b: Cond }
  | { kind: 'or'; a: Cond; b: Cond };

export type Stmt =
  | { kind: 'move'; dir: Dir; line: number }
  | { kind: 'paint'; line: number }
  | { kind: 'if'; cond: Cond; then: Stmt[]; else: Stmt[]; line: number }
  | { kind: 'switch'; cases: { cond: Cond; body: Stmt[] }[]; otherwise: Stmt[]; line: number }
  | { kind: 'while'; cond: Cond; body: Stmt[]; line: number }
  | { kind: 'repeat'; times: number; body: Stmt[]; line: number }
  | { kind: 'until'; cond: Cond; body: Stmt[]; line: number }
  | { kind: 'assert'; cond: Cond; line: number };

export interface Program {
  body: Stmt[];
}

interface Token {
  text: string;
  line: number;
}

// Tokenizer & Lexer
function tokenize(source: string): Token[] {
  // 1. Normalization
  let normalized = source.replace(/\u00A0/g, ' ').replace(/\r/g, '');

  const rawLines = normalized.split('\n');
  const tokens: Token[] = [];

  for (let lIdx = 0; lIdx < rawLines.length; lIdx++) {
    const lineNum = lIdx + 1;
    let lineStr = rawLines[lIdx];

    // Remove comments (| to end of line)
    const pipeIdx = lineStr.indexOf('|');
    if (pipeIdx !== -1) {
      lineStr = lineStr.slice(0, pipeIdx);
    }

    lineStr = lineStr.toLowerCase().replace(/ё/g, 'е');

    // Split on spaces and special symbols ( ) : ;
    let cur = '';
    for (let i = 0; i < lineStr.length; i++) {
      const ch = lineStr[i];
      if (ch === '(' || ch === ')' || ch === ':' || ch === ';') {
        if (cur.trim()) {
          tokens.push({ text: cur.trim(), line: lineNum });
          cur = '';
        }
        if (ch !== ';') {
          // ';' is discarded
          tokens.push({ text: ch, line: lineNum });
        }
      } else if (/\s/.test(ch)) {
        if (cur.trim()) {
          tokens.push({ text: cur.trim(), line: lineNum });
          cur = '';
        }
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) {
      tokens.push({ text: cur.trim(), line: lineNum });
    }
  }

  return tokens;
}

const FORBIDDEN_WORDS = new Set([
  ':=',
  'цел',
  'вещ',
  'лог',
  'лит',
  'таб',
  'ввод',
  'вывод',
]);

export function parseKumir(source: string): Program {
  const tokens = tokenize(source);

  // Check forbidden keywords before parsing
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (FORBIDDEN_WORDS.has(tok.text)) {
      throw new RobotParseError(
        `Строка ${tok.line}: переменные и арифметика не поддерживаются, используйте нц пока или нц N раз`,
        tok.line
      );
    }
    if (tok.text === 'нц' && i + 1 < tokens.length && tokens[i + 1].text === 'для') {
      throw new RobotParseError(
        `Строка ${tok.line}: переменные и арифметика не поддерживаются, используйте нц пока или нц N раз`,
        tok.line
      );
    }
  }

  let pos = 0;

  function peek(): Token | null {
    return pos < tokens.length ? tokens[pos] : null;
  }

  function advance(): Token {
    const tok = tokens[pos];
    pos++;
    return tok;
  }

  // Pre-process & skip header statements
  function skipHeader(): void {
    while (pos < tokens.length) {
      const tok = peek()!;
      if (
        tok.text === 'использовать' &&
        pos + 1 < tokens.length &&
        (tokens[pos + 1].text === 'робот' || tokens[pos + 1].text === 'робот_')
      ) {
        advance();
        advance();
        continue;
      }

      if (tok.text === 'алг') {
        advance();
        // Skip rest of line (algorithm name)
        const algLine = tok.line;
        while (peek() && peek()!.line === algLine) {
          advance();
        }
        continue;
      }

      if (tok.text === 'дано' || tok.text === 'надо') {
        advance();
        const headerLine = tok.line;
        while (peek() && peek()!.line === headerLine) {
          advance();
        }
        continue;
      }

      if (tok.text === 'нач') {
        advance();
        continue;
      }

      break;
    }
  }

  skipHeader();

  const body = parseStmts(false, false, false);

  if (pos < tokens.length) {
    const tok = peek()!;
    if (tok.text === 'кон') {
      advance();
      // Skip any header-like lines or empty tokens after 'кон'
      while (pos < tokens.length) {
        const nextTok = peek()!;
        if (
          nextTok.text === 'алг' ||
          nextTok.text === 'нач' ||
          nextTok.text === 'дано' ||
          nextTok.text === 'надо' ||
          (nextTok.text === 'использовать' &&
            pos + 1 < tokens.length &&
            (tokens[pos + 1].text === 'робот' || tokens[pos + 1].text === 'робот_'))
        ) {
          advance();
          const line = nextTok.line;
          while (peek() && peek()!.line === line) advance();
        } else {
          throw new RobotParseError(`Строка ${nextTok.line}: код после "кон" не выполняется`, nextTok.line);
        }
      }
    } else {
      throw new RobotParseError(`Строка ${tok.line}: непонятная команда "${tok.text}"`, tok.line);
    }
  }

  if (body.length === 0) {
    throw new RobotParseError('Программа пуста', 0);
  }

  return { body };

  function parseStmts(stopAtВсе: boolean, stopAtКц: boolean, stopAtПриИлиИначеИлиВсе: boolean): Stmt[] {
    const stmts: Stmt[] = [];

    while (pos < tokens.length) {
      const tok = peek()!;

      if (tok.text === 'кон') {
        break;
      }

      if (stopAtВсе && tok.text === 'все') {
        break;
      }

      if (stopAtКц && (tok.text === 'кц' || tok.text === 'кц_при')) {
        break;
      }

      if (
        stopAtПриИлиИначеИлиВсе &&
        (tok.text === 'при' || tok.text === 'иначе' || tok.text === 'все')
      ) {
        break;
      }

      if (stopAtВсе && tok.text === 'иначе') {
        break;
      }

      // Check header statements inside body (just skip them gracefully if misplaced)
      if (
        tok.text === 'использовать' &&
        pos + 1 < tokens.length &&
        (tokens[pos + 1].text === 'робот' || tokens[pos + 1].text === 'робот_')
      ) {
        advance();
        advance();
        continue;
      }
      if (tok.text === 'нач') {
        advance();
        continue;
      }

      // Commands
      if (tok.text === 'вверх') {
        advance();
        stmts.push({ kind: 'move', dir: 'up', line: tok.line });
      } else if (tok.text === 'вниз') {
        advance();
        stmts.push({ kind: 'move', dir: 'down', line: tok.line });
      } else if (tok.text === 'влево') {
        advance();
        stmts.push({ kind: 'move', dir: 'left', line: tok.line });
      } else if (tok.text === 'вправо') {
        advance();
        stmts.push({ kind: 'move', dir: 'right', line: tok.line });
      } else if (tok.text === 'закрасить') {
        advance();
        stmts.push({ kind: 'paint', line: tok.line });
      } else if (tok.text === 'если') {
        stmts.push(parseIf());
      } else if (tok.text === 'выбор') {
        stmts.push(parseSwitch());
      } else if (tok.text === 'нц') {
        stmts.push(parseLoop());
      } else if (tok.text === 'утв') {
        advance();
        const cond = parseCond();
        stmts.push({ kind: 'assert', cond, line: tok.line });
      } else if (tok.text === 'все' || tok.text === 'кц' || tok.text === 'кц_при' || tok.text === 'иначе' || tok.text === 'при') {
        // Unexpected keywords if we are not expecting them
        throw new RobotParseError(`Строка ${tok.line}: неожиданный "${tok.text}"`, tok.line);
      } else {
        throw new RobotParseError(`Строка ${tok.line}: непонятная команда "${tok.text}"`, tok.line);
      }
    }

    return stmts;
  }

  function parseIf(): Stmt {
    const ifTok = advance(); // 'если'
    const cond = parseCond();

    const toTok = peek();
    if (!toTok || toTok.text !== 'то') {
      const line = toTok ? toTok.line : ifTok.line;
      throw new RobotParseError(`Строка ${line}: после "если" ожидается "то"`, line);
    }
    advance(); // 'то'

    const thenStmts = parseStmts(true, false, false);

    let elseStmts: Stmt[] = [];
    if (peek() && peek()!.text === 'иначе') {
      advance(); // 'иначе'
      elseStmts = parseStmts(true, false, false);
    }

    const vseTok = peek();
    if (!vseTok || vseTok.text !== 'все') {
      const line = vseTok ? vseTok.line : ifTok.line;
      throw new RobotParseError(`Строка ${ifTok.line}: не хватает "все"`, ifTok.line);
    }
    advance(); // 'все'

    return {
      kind: 'if',
      cond,
      then: thenStmts,
      else: elseStmts,
      line: ifTok.line,
    };
  }

  function parseSwitch(): Stmt {
    const swTok = advance(); // 'выбор'
    const cases: { cond: Cond; body: Stmt[] }[] = [];
    let otherwise: Stmt[] = [];

    while (peek() && peek()!.text === 'при') {
      advance(); // 'при'
      const cond = parseCond();
      const colonTok = peek();
      if (!colonTok || colonTok.text !== ':') {
        const line = colonTok ? colonTok.line : swTok.line;
        throw new RobotParseError(`Строка ${line}: после условия в "при" ожидается двоеточие ":"`, line);
      }
      advance(); // ':'
      const body = parseStmts(false, false, true);
      cases.push({ cond, body });
    }

    if (peek() && peek()!.text === 'иначе') {
      advance(); // 'иначе'
      otherwise = parseStmts(true, false, false);
    }

    const vseTok = peek();
    if (!vseTok || vseTok.text !== 'все') {
      throw new RobotParseError(`Строка ${swTok.line}: не хватает "все"`, swTok.line);
    }
    advance(); // 'все'

    return {
      kind: 'switch',
      cases,
      otherwise,
      line: swTok.line,
    };
  }

  function parseLoop(): Stmt {
    const loopTok = advance(); // 'нц'
    const nextTok = peek();

    if (!nextTok) {
      throw new RobotParseError(`Строка ${loopTok.line}: не хватает "кц"`, loopTok.line);
    }

    if (nextTok.text === 'пока') {
      advance(); // 'пока'
      const cond = parseCond();
      const body = parseStmts(false, true, false);
      const kcTok = peek();
      if (!kcTok || kcTok.text !== 'кц') {
        throw new RobotParseError(`Строка ${loopTok.line}: не хватает "кц"`, loopTok.line);
      }
      advance(); // 'кц'
      return { kind: 'while', cond, body, line: loopTok.line };
    }

    if (/^\d+$/.test(nextTok.text)) {
      const numTok = advance(); // number
      const times = parseInt(numTok.text, 10);
      const razTok = peek();
      if (!razTok || razTok.text !== 'раз') {
        const line = razTok ? razTok.line : numTok.line;
        throw new RobotParseError(`Строка ${line}: ожидается "раз" после числа`, line);
      }
      advance(); // 'раз'
      if (times <= 0) {
        throw new RobotParseError(`Строка ${numTok.line}: нц ... раз требует число больше 0`, numTok.line);
      }
      const body = parseStmts(false, true, false);
      const kcTok = peek();
      if (!kcTok || kcTok.text !== 'кц') {
        throw new RobotParseError(`Строка ${loopTok.line}: не хватает "кц"`, loopTok.line);
      }
      advance(); // 'кц'
      return { kind: 'repeat', times, body, line: loopTok.line };
    }

    // Otherwise it's either "нц ... кц_при <cond>" or "нц ... кц"
    const body = parseStmts(false, true, false);
    const endLoopTok = peek();

    if (!endLoopTok) {
      throw new RobotParseError(`Строка ${loopTok.line}: не хватает "кц"`, loopTok.line);
    }

    if (endLoopTok.text === 'кц_при') {
      advance(); // 'кц_при'
      const cond = parseCond();
      return { kind: 'until', cond, body, line: loopTok.line };
    }

    if (endLoopTok.text === 'кц') {
      advance(); // 'кц'
      // Infinite loop or until break? "нц ... кц" without condition is repeat infinite/times
      // In Kumir "нц ... кц" without 'пока'/'раз' is infinite loop unless ended, but supported as repeat infinity (or times = MAX)
      return { kind: 'repeat', times: 200000, body, line: loopTok.line };
    }

    throw new RobotParseError(`Строка ${loopTok.line}: не хватает "кц"`, loopTok.line);
  }

  // Expression parser for conditions
  // Priorities: 'не' > 'и' > 'или', parenthesized expressions
  function parseCond(): Cond {
    return parseOr();
  }

  function parseOr(): Cond {
    let left = parseAnd();
    while (peek() && peek()!.text === 'или') {
      advance(); // 'или'
      const right = parseAnd();
      left = { kind: 'or', a: left, b: right };
    }
    return left;
  }

  function parseAnd(): Cond {
    let left = parseNot();
    while (peek() && peek()!.text === 'и') {
      advance(); // 'и'
      const right = parseNot();
      left = { kind: 'and', a: left, b: right };
    }
    return left;
  }

  function parseNot(): Cond {
    if (peek() && peek()!.text === 'не') {
      advance(); // 'не'
      const cond = parseNot();
      return { kind: 'not', a: cond };
    }
    return parsePrimaryCond();
  }

  function parsePrimaryCond(): Cond {
    const tok = peek();
    if (!tok) {
      throw new RobotParseError('Ожидается условие', tokens.length > 0 ? tokens[tokens.length - 1].line : 1);
    }

    if (tok.text === '(') {
      advance(); // '('
      const cond = parseCond();
      const closeTok = peek();
      if (!closeTok || closeTok.text !== ')') {
        const line = closeTok ? closeTok.line : tok.line;
        throw new RobotParseError(`Строка ${line}: ожидается закрывающая скобка ")"` , line);
      }
      advance(); // ')'
      return cond;
    }

    // Direction primitives: "сверху свободно", "сверху стена", etc.
    const dirs: Array<{ prefix: string; dir: Dir }> = [
      { prefix: 'сверху', dir: 'up' },
      { prefix: 'снизу', dir: 'down' },
      { prefix: 'слева', dir: 'left' },
      { prefix: 'справа', dir: 'right' },
    ];

    for (const d of dirs) {
      if (tok.text === d.prefix) {
        advance(); // direction word
        const next = peek();
        if (!next) {
          throw new RobotParseError(`Строка ${tok.line}: неполное условие после "${tok.text}"`, tok.line);
        }
        if (next.text === 'свободно') {
          advance();
          return { kind: 'free', dir: d.dir };
        }
        if (next.text === 'стена') {
          advance();
          return { kind: 'wall', dir: d.dir };
        }
        throw new RobotParseError(`Строка ${next.line}: после "${tok.text}" ожидается "свободно" или "стена"`, next.line);
      }
    }

    if (tok.text === 'клетка') {
      advance(); // 'клетка'
      const next = peek();
      if (!next) {
        throw new RobotParseError(`Строка ${tok.line}: неполное условие после "клетка"`, tok.line);
      }
      if (next.text === 'закрашена') {
        advance();
        return { kind: 'painted' };
      }
      if (next.text === 'чистая') {
        advance();
        return { kind: 'clean' };
      }
      throw new RobotParseError(`Строка ${next.line}: после "клетка" ожидается "закрашена" или "чистая"`, next.line);
    }

    throw new RobotParseError(`Строка ${tok.line}: нераспознанное условие "${tok.text}"`, tok.line);
  }
}

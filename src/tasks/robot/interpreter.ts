import { Cell, Dir, FieldInstance } from './types';
import { Cond, Program, Stmt } from './parser';
import { hasWall, key } from './field';

export interface StepLogEntry {
  x: number;
  y: number;
  action: 'start' | 'move' | 'paint';
  dir?: Dir;
}

export type RunStatus = 'ok' | 'crashed' | 'timeout' | 'assert';

export interface RunResult {
  status: RunStatus;
  x: number;
  y: number; // финальная позиция
  painted: Set<string>; // ключи "x,y"
  steps: number;
  log: StepLogEntry[];
  crashDir?: Dir; // направление, в котором робот въехал в стену
  failLine?: number; // строка команды, вызвавшей crash или ложное утв
}

export function runProgram(
  prog: Program,
  field: FieldInstance,
  opts?: { maxSteps?: number; maxLog?: number }
): RunResult {
  const maxSteps = opts?.maxSteps ?? 200000;
  const maxLog = opts?.maxLog ?? 20000;

  let rx = field.start.x;
  let ry = field.start.y;
  const painted = new Set<string>();
  const log: StepLogEntry[] = [{ x: rx, y: ry, action: 'start' }];
  let steps = 0;

  function pushLog(entry: StepLogEntry) {
    if (log.length < maxLog) {
      log.push(entry);
    }
  }

  function evalCond(c: Cond): boolean {
    steps++;
    switch (c.kind) {
      case 'free':
        return !hasWall(field.walls, rx, ry, c.dir);
      case 'wall':
        return hasWall(field.walls, rx, ry, c.dir);
      case 'painted':
        return painted.has(key(rx, ry));
      case 'clean':
        return !painted.has(key(rx, ry));
      case 'not':
        return !evalCond(c.a);
      case 'and':
        return evalCond(c.a) && evalCond(c.b);
      case 'or':
        return evalCond(c.a) || evalCond(c.b);
    }
  }

  type ExecutionResult =
    | { status: 'continue' }
    | { status: 'crashed'; dir: Dir; line: number }
    | { status: 'timeout' }
    | { status: 'assert'; line: number };

  function executeStmts(stmts: Stmt[]): ExecutionResult {
    for (const stmt of stmts) {
      if (steps >= maxSteps) {
        return { status: 'timeout' };
      }

      switch (stmt.kind) {
        case 'move': {
          steps++;
          if (hasWall(field.walls, rx, ry, stmt.dir)) {
            return { status: 'crashed', dir: stmt.dir, line: stmt.line };
          }
          if (stmt.dir === 'up') ry += 1;
          else if (stmt.dir === 'down') ry -= 1;
          else if (stmt.dir === 'left') rx -= 1;
          else if (stmt.dir === 'right') rx += 1;

          pushLog({ x: rx, y: ry, action: 'move', dir: stmt.dir });
          break;
        }

        case 'paint': {
          steps++;
          painted.add(key(rx, ry));
          pushLog({ x: rx, y: ry, action: 'paint' });
          break;
        }

        case 'assert': {
          if (!evalCond(stmt.cond)) {
            return { status: 'assert', line: stmt.line };
          }
          break;
        }

        case 'if': {
          const condVal = evalCond(stmt.cond);
          const targetStmts = condVal ? stmt.then : stmt.else;
          const res = executeStmts(targetStmts);
          if (res.status !== 'continue') return res;
          break;
        }

        case 'switch': {
          let matched = false;
          for (const caseBranch of stmt.cases) {
            if (evalCond(caseBranch.cond)) {
              matched = true;
              const res = executeStmts(caseBranch.body);
              if (res.status !== 'continue') return res;
              break;
            }
          }
          if (!matched && stmt.otherwise.length > 0) {
            const res = executeStmts(stmt.otherwise);
            if (res.status !== 'continue') return res;
          }
          break;
        }

        case 'while': {
          while (evalCond(stmt.cond)) {
            if (steps >= maxSteps) return { status: 'timeout' };
            const res = executeStmts(stmt.body);
            if (res.status !== 'continue') return res;
          }
          break;
        }

        case 'repeat': {
          for (let i = 0; i < stmt.times; i++) {
            if (steps >= maxSteps) return { status: 'timeout' };
            const res = executeStmts(stmt.body);
            if (res.status !== 'continue') return res;
          }
          break;
        }

        case 'until': {
          while (true) {
            if (steps >= maxSteps) return { status: 'timeout' };
            const res = executeStmts(stmt.body);
            if (res.status !== 'continue') return res;
            if (evalCond(stmt.cond)) {
              break;
            }
          }
          break;
        }
      }
    }

    return { status: 'continue' };
  }

  const res = executeStmts(prog.body);

  if (res.status === 'crashed') {
    return {
      status: 'crashed',
      x: rx,
      y: ry,
      painted,
      steps,
      log,
      crashDir: res.dir,
      failLine: res.line,
    };
  }

  if (res.status === 'assert') {
    return {
      status: 'assert',
      x: rx,
      y: ry,
      painted,
      steps,
      log,
      failLine: res.line,
    };
  }

  if (res.status === 'timeout') {
    return {
      status: 'timeout',
      x: rx,
      y: ry,
      painted,
      steps,
      log,
    };
  }

  return {
    status: 'ok',
    x: rx,
    y: ry,
    painted,
    steps,
    log,
  };
}

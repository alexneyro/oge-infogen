import { Dir, FieldInstance, RobotFamily, RobotGoal, Rng } from './types';
import { applyGoal } from './field';
import { parseKumir, RobotParseError } from './parser';
import { runProgram, RunStatus, StepLogEntry } from './interpreter';

export interface InstanceResult {
  instance: FieldInstance;
  status: RunStatus;
  extra: string[];
  missing: string[];
  log: StepLogEntry[];
  finalX: number;
  finalY: number;
  crashDir?: Dir;
  failLine?: number;
  perfect: boolean;
  tolerable: boolean;
  reason: string;
}

export interface CheckOutcome {
  score: 0 | 1 | 2;
  maxScore: 2;
  parseError?: { message: string; line: number };
  fail?: InstanceResult;
  totalInstances: number;
}

export function buildInstances(
  family: RobotFamily,
  goal: RobotGoal,
  rng: Rng
): { visible: FieldInstance; hidden: FieldInstance[] } {
  const visP = family.visibleParams(rng, goal.id);
  const visible = applyGoal(family.build(visP), goal, visP);

  const hidP = family.hiddenParams(rng, goal.id);
  const hidden = hidP.map((p) => applyGoal(family.build(p), goal, p));

  return { visible, hidden };
}

export function checkSolution(
  code: string,
  family: RobotFamily,
  visible: FieldInstance,
  hidden: FieldInstance[]
): CheckOutcome {
  const allInstances = [visible, ...hidden];
  const totalInstances = allInstances.length;

  if (!code || !code.trim()) {
    return {
      score: 0,
      maxScore: 2,
      totalInstances,
    };
  }

  let prog;
  try {
    prog = parseKumir(code);
  } catch (err) {
    if (err instanceof RobotParseError) {
      return {
        score: 0,
        maxScore: 2,
        parseError: { message: err.message, line: err.line },
        totalInstances,
      };
    }
    return {
      score: 0,
      maxScore: 2,
      parseError: { message: (err as Error).message || 'Ошибка синтаксиса', line: 1 },
      totalInstances,
    };
  }

  let firstFail: InstanceResult | undefined = undefined;
  let allPerfect = true;
  let allTolerable = true;

  for (const instance of allInstances) {
    const runRes = runProgram(prog, instance);

    const extra: string[] = [];
    for (const p of runRes.painted) {
      if (!instance.target.has(p)) {
        extra.push(p);
      }
    }

    const missing: string[] = [];
    for (const t of instance.target) {
      if (!runRes.painted.has(t)) {
        missing.push(t);
      }
    }

    const perfect = runRes.status === 'ok' && extra.length === 0 && missing.length === 0;
    const tol = Math.min(10, Math.floor(instance.target.size / 3));
    const tolerable = runRes.status === 'ok' && extra.length <= tol && missing.length <= tol;

    let reason = '';
    if (runRes.status === 'crashed') {
      reason = 'Робот разрушился, попытавшись пройти сквозь стену';
    } else if (runRes.status === 'timeout') {
      reason = 'Алгоритм не завершился (зацикливание)';
    } else if (runRes.status === 'assert') {
      reason = 'Нарушено утверждение (утв)';
    } else if (!perfect) {
      const parts: string[] = [];
      if (missing.length > 0) {
        parts.push(`Не закрашено клеток: ${missing.length}`);
      }
      if (extra.length > 0) {
        parts.push(`Закрашено лишних клеток: ${extra.length}`);
      }
      reason = parts.join('; ');
    }

    const instResult: InstanceResult = {
      instance,
      status: runRes.status,
      extra,
      missing,
      log: runRes.log,
      finalX: runRes.x,
      finalY: runRes.y,
      crashDir: runRes.crashDir,
      failLine: runRes.failLine,
      perfect,
      tolerable,
      reason,
    };

    if (!perfect && !firstFail) {
      firstFail = instResult;
    }

    if (!perfect) {
      allPerfect = false;
    }
    if (!tolerable) {
      allTolerable = false;
    }
  }

  let score: 0 | 1 | 2 = 0;
  if (allPerfect) {
    score = 2;
  } else if (allTolerable) {
    score = 1;
  } else {
    score = 0;
  }

  return {
    score,
    maxScore: 2,
    fail: firstFail,
    totalInstances,
  };
}

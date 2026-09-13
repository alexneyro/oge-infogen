import { makeRng, hashSeed } from './utils/rng';
import { task10 } from './tasks/task10';
import { task12 } from './tasks/task12';
import { task15 } from './tasks/task15';
import { Difficulty } from './types';
import { runSelfTest } from './tasks/robot/selftest';
import { dumpAll } from './tasks/robot/selftest-dump.node';

export function runDeterminismCheck() {
  const tasks = [
    { id: 'task10', module: task10 },
    { id: 'task12', module: task12 },
    { id: 'task15', module: task15 },
  ];
  const difficulties: Difficulty[] = [1, 2, 3];

  const results: Array<{ taskId: string; difficulty: number; result: string }> = [];
  let allPassed = true;

  for (const t of tasks) {
    for (const diff of difficulties) {
      const seedStr = `TEST-42|${t.id}|${diff}`;
      const seed = hashSeed(seedStr);

      const rng1 = makeRng(seed);
      const res1 = t.module.generate(diff, rng1);

      const rng2 = makeRng(seed);
      const res2 = t.module.generate(diff, rng2);

      const match = JSON.stringify(res1) === JSON.stringify(res2);
      if (!match) {
        allPassed = false;
      }

      results.push({
        taskId: t.id,
        difficulty: diff,
        result: match ? 'OK' : 'FAIL',
      });
    }
  }

  console.table(results);
  console.log(`Determinism check: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);

  console.log(runSelfTest());
  dumpAll(undefined, 'reports/task15-dump.txt');
  console.log('Dump generated at reports/task15-dump.txt');
}

runDeterminismCheck();

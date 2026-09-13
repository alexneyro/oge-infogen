import fs from 'node:fs';
import path from 'node:path';
import { ALL_TRANSFORMS, TransformId, transformInstance } from './transform';
import { ROBOT_FAMILIES } from './field';
import { buildInstances } from './checker';
import { renderAsciiGrid } from './selftest';

export interface DumpAllOptions {
  families?: string[];
  goals?: string[];
  transforms?: TransformId[];
}

export function dumpAll(opts?: DumpAllOptions, outPath: string = 'reports/task15-dump.txt'): string {
  const chunks: string[] = [];
  for (const family of ROBOT_FAMILIES) {
    if (opts?.families && opts.families.length > 0 && !opts.families.includes(family.id)) {
      continue;
    }
    for (const goal of family.goals) {
      if (opts?.goals && opts.goals.length > 0 && !opts.goals.includes(goal.id)) {
        continue;
      }
      const makeLcgRng = (seed: number) => {
        let s = seed >>> 0;
        return {
          int(a: number, b: number): number {
            s = (Math.imul(1664525, s) + 1013904223) >>> 0;
            return a + (s % (b - a + 1));
          },
          pick<T>(arr: T[]): T {
            return arr[this.int(0, arr.length - 1)];
          },
        };
      };
      const rng = makeLcgRng(123456);
      const { visible } = buildInstances(family, goal, rng);

      const transforms = opts?.transforms && opts.transforms.length > 0 ? opts.transforms : ALL_TRANSFORMS;

      for (const t of transforms) {
        const transformedVisible = transformInstance(visible, t);
        const stmtText = goal.statement(t);
        const ascii = renderAsciiGrid(transformedVisible);

        chunks.push(`=== ${family.id} / ${goal.id} / ${t} ===\n${stmtText}\n${ascii}\n`);
      }
    }
  }
  const result = chunks.join('\n');
  try {
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outPath, result, 'utf-8');
  } catch (e) {
    console.error(`Failed to write dump file: ${e}`);
  }
  return result;
}


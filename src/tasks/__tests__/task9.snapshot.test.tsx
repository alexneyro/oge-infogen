import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createHash } from 'crypto';
import { task9 } from '../task9';
import { makeRng } from '../../utils/rng';
import { Difficulty, TaskModuleState } from '../../types';

export const TASK9_SNAPSHOT_HASHES: Record<string, string> = {
  'L1_S1': '3385760303363c1b5d6dfe06e44e4a4b28e5f21c91f0ccf3b43179857898324e',
  'L1_S42': 'ed1def256d296e0b65f5cbbd12d5bf25161afbbe0e689406be050fcf47430e3b',
  'L1_S100': '76358d6964f8b6b164a4df53894e6c490a47ea8316a9dca19e305f33519981b1',
  'L1_S2024': '72e3b3b4c5ea99e0a825e28977127799e7fce0dc9885b730a864b0a5e031b520',
  'L1_S9999': '1b164de7c7ea5081f0720c3ff8f1a9fd6c41609c5972cf453c5e8e8674223d20',
  'L2_S1': 'd81eae097721c720c727a1a5195003c82a4d12206be5a22638f50f62d717e0e6',
  'L2_S42': '8c3ef5145515d2a1cc6c48e80e19ccc1d928cef6d6a1241e38783e77273a39dd',
  'L2_S100': '62345cbbc9dcb5bd56459084f805a604e26d9849dd90e205e6b0c95b71112299',
  'L2_S2024': '081b3f2abc984ae5b8bdf31ffd51fbcd2c474a54cca24a0d0d4470505b53f90c',
  'L2_S9999': '3c4157be692cc6091e7e6adf850cd48b63857584b0425aca50d58837bc947ba1',
  'L3_S1': '604ffe8a5f80a789509d3a52c88b5e754ed96477376e8dca2008b1283d7be548',
  'L3_S42': '1bd551ccbf2367d5dfb899360f618026ffd3930798d60128243fc6ac5d734fc9',
  'L3_S100': '26869205ea9fe53ee6399a83d18dbaddbd9b7584588eb934b095d733012944f1',
  'L3_S2024': 'b33389ba6b217093901850bc11fdfbb3ca2c12452f5f764e6d313ba36fc2cac4',
  'L3_S9999': '010ec1eda49b8e154865495b1b9eff245fd76fe30668d2719e25b834d23aaa7f',
};

const SEEDS = [1, 42, 100, 2024, 9999];
const LEVELS: Difficulty[] = [1, 2, 3];

describe('Task 9 SVG Render Snapshot Suite', () => {
  const dummyState: TaskModuleState = {
    userAnswer: '',
    setUserAnswer: () => {},
    isSubmitted: false,
    showHints: false,
  };

  for (const level of LEVELS) {
    for (const seed of SEEDS) {
      const caseKey = `L${level}_S${seed}`;
      it(`matches snapshot SHA-256 for ${caseKey}`, () => {
        const rng = makeRng(seed);
        const taskData = task9.generate(level, rng);
        const rendered = renderToString(task9.render(taskData, dummyState));
        const hash = createHash('sha256').update(rendered).digest('hex');
        expect(hash).toBe(TASK9_SNAPSHOT_HASHES[caseKey]);
      });
    }
  }
});

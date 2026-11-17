import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createHash } from 'crypto';
import { task9 } from '../task9';
import { makeRng } from '../../utils/rng';
import { Difficulty, TaskModuleState } from '../../types';

export const TASK9_SNAPSHOT_HASHES: Record<string, string> = {
  'L1_S1': '1cef63df1ed42effac622556fdebb38c9a38ba48246e0fe635b87b44a300a6e0',
  'L1_S42': 'af9bec6e15e9aea2c872cf7df5a827b0e4fd1add0757e7287292b66f42ac021c',
  'L1_S100': 'e54dea83fa317a77cbeb4bb6586ee11e6c79ae4295f9eb585fc2082bbb038a83',
  'L1_S2024': '11f2683999ffd3f36916e4336d292db0af25d29a6117b8c933136feb3659cbe6',
  'L1_S9999': 'a76cb2f18fa3c38b3c22aebda0c182b680af66deb2347615e2394fdabae58066',
  'L2_S1': 'd1b023e5501b5191b08551eb67e6a13cd1a85b467931c19e2f43c1ddad3ba1ee',
  'L2_S42': '0eade91730c7d7c6bc750d591f8608b32a1c907f179a90c29d59a03c6e3c00de',
  'L2_S100': '9b0ebcc8ceee153200f2f38ece172fb003cb3cfbe592999845c8f10b415564f6',
  'L2_S2024': 'a334dc99ee5b7e8d4c49eddefb4e983ee4c5018ccfa25382cc6daaf6c1ee43b3',
  'L2_S9999': 'ea6aba22b779ee3d972761554c79e40eff0cb69a100a4e0b4e61a64c155e68fd',
  'L3_S1': '33b6b0df898b706d77f84d55cbf24034d0c4087875d08caba20ebfae5b5132ad',
  'L3_S42': '4b69e7fe34b590fc08977a452545f3e87a57822ca4e1f1b3ec18860533644395',
  'L3_S100': '6f34fa311004424987b2e474a96e02c90584e08711433bc8efa390ac1e3c76ec',
  'L3_S2024': '39432af089266c021a27a20790d76bd8efe918785d5b06e8db0e5a59c5c02bdd',
  'L3_S9999': 'f7ea3f247599d352c37963272ea67a48c7412083711c4838adf8a757e5c33db9',
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

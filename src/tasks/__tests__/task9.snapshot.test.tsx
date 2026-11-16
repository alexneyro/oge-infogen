import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createHash } from 'crypto';
import { task9 } from '../task9';
import { makeRng } from '../../utils/rng';
import { Difficulty, TaskModuleState } from '../../types';

export const TASK9_SNAPSHOT_HASHES: Record<string, string> = {
  'L1_S1': '7a202d227cb6fe07606441ff34f2057e8a98cf80d63e8f67e2f28e8688d341d2',
  'L1_S42': 'b2117189a7fbaa7b0f681ed5660fb09abb119da95a8bac868817693ae6a88f50',
  'L1_S100': 'c8b61af1ccd97032b13f58260dd7bd06b7173832ec8ea745d71ee609f6110e57',
  'L1_S2024': '1521d92a1b8c2cd3d0cfe05d7cceff5b7a2d83dfc2aa90fb288d966963f0ad9b',
  'L1_S9999': '55e307de65206fefe954aefa06b48323e2710cd95d0b8bba9882aac058b7fd1a',
  'L2_S1': '34ef3d03a9168c99cbabd2a9590733335c6ea8c50c40a6bcf998266461bc2cc8',
  'L2_S42': 'c8155fc3ec71387f093d2a3d4155dc85b2f49fbaf4fa87419e649920b0416294',
  'L2_S100': '2c752ec13e0119a919235adfc3b6e36f22357eb367e3a86e770398c23f1ef149',
  'L2_S2024': 'a0ab01529099da1d731237b45430bc34bd8e2e611bca16f7c967aa88144c37ed',
  'L2_S9999': '5eaeb4ff4c306a5a6c1926e6b72ec9d4b14231c6e53a5f0f32604e132cafe90e',
  'L3_S1': '90b7d067783d707f39e32f452a91d232ba2db0795d60999d20134ecfb0f11593',
  'L3_S42': '648add929dbaee1abe3c8f065f449f0c7ccf24f1b1f27812990edfc3ba9f88fe',
  'L3_S100': '2e73d27179b0d630665f6e3e8cf17dfaef01efe68758abb914261d7b833774fc',
  'L3_S2024': '53f7480d2272aa40c2a06c27d14988a77a89693f895ccc2b5d9e93fdb409751b',
  'L3_S9999': 'b0a5d16f77de23b7c168e9c09a1143a39ec0551686b417a53f8024547f3eb825',
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

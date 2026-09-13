import { Dir, FieldInstance } from './types';
import { addWallAbove, addWallBelow, addWallLeft, addWallRight, computeBounds, key } from './field';

export type TransformId = 'id' | 'r90' | 'r180' | 'r270' | 'm' | 'mr90' | 'mr180' | 'mr270';

export const ALL_TRANSFORMS: TransformId[] = [
  'id',
  'r90',
  'r180',
  'r270',
  'm',
  'mr90',
  'mr180',
  'mr270',
];

// Matrix 2x2: [a, b, c, d] representing [a b; c d]
type Matrix2x2 = [number, number, number, number];

const TRANSFORM_MATRICES: Record<TransformId, Matrix2x2> = {
  id: [1, 0, 0, 1],
  r90: [0, -1, 1, 0],
  r180: [-1, 0, 0, -1],
  r270: [0, 1, -1, 0],
  m: [1, 0, 0, -1],
  mr90: [0, 1, 1, 0],
  mr180: [-1, 0, 0, 1],
  mr270: [0, -1, -1, 0],
};

const DIR_VECTORS: Record<Dir, [number, number]> = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0],
};

export function transformDir(d: Dir, t: TransformId): Dir {
  if (t === 'id') return d;
  const m = TRANSFORM_MATRICES[t];
  const [vx, vy] = DIR_VECTORS[d];
  const nx = m[0] * vx + m[1] * vy;
  const ny = m[2] * vx + m[3] * vy;

  if (nx === 0 && ny === 1) return 'up';
  if (nx === 0 && ny === -1) return 'down';
  if (nx === -1 && ny === 0) return 'left';
  if (nx === 1 && ny === 0) return 'right';

  return d;
}

export function transformInstance(inst: FieldInstance, t: TransformId): FieldInstance {
  if (t === 'id') return inst;

  const matrix = TRANSFORM_MATRICES[t];

  const transformPoint = (x: number, y: number) => {
    return {
      x: matrix[0] * x + matrix[1] * y,
      y: matrix[2] * x + matrix[3] * y,
    };
  };

  // Raw start transformation
  const rawStart = transformPoint(inst.start.x, inst.start.y);
  const dx = -rawStart.x;
  const dy = -rawStart.y;

  const newStart = { x: 0, y: 0 };

  // Target transformation
  const newTarget = new Set<string>();
  for (const tKey of inst.target) {
    const [tx, ty] = tKey.split(',').map(Number);
    const p = transformPoint(tx, ty);
    newTarget.add(key(p.x + dx, p.y + dy));
  }

  // Walls transformation
  const newWalls = new Set<string>();
  for (const wallKey of inst.walls) {
    if (wallKey.startsWith('H:')) {
      const [wx, wy] = wallKey.slice(2).split(',').map(Number);
      const p = transformPoint(wx, wy);
      const newSideDir = transformDir('up', t);
      const fx = p.x + dx;
      const fy = p.y + dy;

      if (newSideDir === 'up') addWallAbove(newWalls, fx, fy);
      else if (newSideDir === 'down') addWallBelow(newWalls, fx, fy);
      else if (newSideDir === 'left') addWallLeft(newWalls, fx, fy);
      else if (newSideDir === 'right') addWallRight(newWalls, fx, fy);
    } else if (wallKey.startsWith('V:')) {
      const [wx, wy] = wallKey.slice(2).split(',').map(Number);
      const p = transformPoint(wx, wy);
      const newSideDir = transformDir('right', t);
      const fx = p.x + dx;
      const fy = p.y + dy;

      if (newSideDir === 'up') addWallAbove(newWalls, fx, fy);
      else if (newSideDir === 'down') addWallBelow(newWalls, fx, fy);
      else if (newSideDir === 'left') addWallLeft(newWalls, fx, fy);
      else if (newSideDir === 'right') addWallRight(newWalls, fx, fy);
    }
  }

  const bounds = computeBounds(newWalls, newTarget, newStart);

  return {
    walls: newWalls,
    start: newStart,
    target: newTarget,
    bounds,
    label: inst.label ? `${inst.label} [${t}]` : t,
    params: inst.params,
  };
}

export function inverseTransformPoint(x: number, y: number, t: TransformId): { x: number; y: number } {
  if (t === 'id') return { x, y };
  const m = TRANSFORM_MATRICES[t];
  const det = m[0] * m[3] - m[1] * m[2];
  const inv = [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det];
  return {
    x: Math.round(inv[0] * x + inv[1] * y),
    y: Math.round(inv[2] * x + inv[3] * y),
  };
}

const MOVEMENT_WORDS: Record<Dir, string> = {
  up: 'вверх',
  down: 'вниз',
  left: 'влево',
  right: 'вправо',
};

const CONDITION_WORDS: Record<Dir, string> = {
  up: 'сверху',
  down: 'снизу',
  left: 'слева',
  right: 'справа',
};

const WORD_TO_DIR_TYPE: Record<string, { dir: Dir; type: 'move' | 'cond' }> = {
  вверх: { dir: 'up', type: 'move' },
  вниз: { dir: 'down', type: 'move' },
  влево: { dir: 'left', type: 'move' },
  вправо: { dir: 'right', type: 'move' },

  сверху: { dir: 'up', type: 'cond' },
  снизу: { dir: 'down', type: 'cond' },
  слева: { dir: 'left', type: 'cond' },
  справа: { dir: 'right', type: 'cond' },

  вверху: { dir: 'up', type: 'cond' },
  внизу: { dir: 'down', type: 'cond' },
};

export function transformCode(code: string, t: TransformId): string {
  if (t === 'id') return code;

  const regex = /(?<=^|[^а-яА-ЯёЁ_])(вверх|вниз|влево|вправо|сверху|снизу|слева|справа|вверху|внизу)(?=[^а-яА-ЯёЁ_]|$)/gi;

  return code.replace(regex, (match) => {
    const lower = match.toLowerCase();
    const info = WORD_TO_DIR_TYPE[lower];
    if (!info) return match;

    const newDir = transformDir(info.dir, t);
    const targetLower =
      info.type === 'move' ? MOVEMENT_WORDS[newDir] : CONDITION_WORDS[newDir];

    if (match === match.toUpperCase()) {
      return targetLower.toUpperCase();
    }
    if (match[0] === match[0].toUpperCase()) {
      return targetLower.charAt(0).toUpperCase() + targetLower.slice(1);
    }
    return targetLower;
  });
}

import { Dir, FieldInstance, num, Rng } from './types';
import { applyGoal, ROBOT_FAMILIES } from './field';
import { buildInstances, checkSolution } from './checker';
import { ALL_TRANSFORMS, inverseTransformPoint, TransformId, transformCode, transformDir, transformInstance } from './transform';
import { dirFromRobotWord, oppositeDir, sideWord, wallAdjGen } from './orient';

export function renderAsciiGrid(inst: FieldInstance): string {
  const { minX, maxX, minY, maxY } = inst.bounds;
  const lines: string[] = [];

  for (let y = maxY; y >= minY; y--) {
    let topLine = '';
    for (let x = minX; x <= maxX; x++) {
      const wallAbove = inst.walls.has(`H:${x},${y}`);
      topLine += '+' + (wallAbove ? '───' : '   ');
    }
    topLine += '+';
    lines.push(topLine);

    let cellLine = '';
    for (let x = minX; x <= maxX; x++) {
      const wallLeft = inst.walls.has(`V:${x - 1},${y}`);
      cellLine += wallLeft ? '│' : ' ';

      const isStart = inst.start.x === x && inst.start.y === y;
      const isTarget = inst.target.has(`${x},${y}`);

      let content = ' · ';
      if (isStart && isTarget) {
        content = ' R█';
      } else if (isStart) {
        content = ' R ';
      } else if (isTarget) {
        content = ' █ ';
      }
      cellLine += content;
    }
    const wallRight = inst.walls.has(`V:${maxX},${y}`);
    cellLine += wallRight ? '│' : ' ';
    lines.push(cellLine);
  }

  let bottomLine = '';
  for (let x = minX; x <= maxX; x++) {
    const wallBelow = inst.walls.has(`H:${x},${minY - 1}`);
    bottomLine += '+' + (wallBelow ? '───' : '   ');
  }
  bottomLine += '+';
  lines.push(bottomLine);

  return lines.join('\n');
}

export function isCellInsideRoomWalls(inst: FieldInstance, cx: number, cy: number): boolean {
  const { minX, maxX, minY, maxY } = inst.bounds;
  const w = inst.walls;
  let oddRays = 0;

  let c = 0;
  for (let x = cx; x <= maxX; x++) if (hasWallInDir(w, x, cy, 'right')) c++;
  if (c % 2 === 1) oddRays++;

  c = 0;
  for (let x = cx; x >= minX; x--) if (hasWallInDir(w, x, cy, 'left')) c++;
  if (c % 2 === 1) oddRays++;

  c = 0;
  for (let y = cy; y <= maxY; y++) if (hasWallInDir(w, cx, y, 'up')) c++;
  if (c % 2 === 1) oddRays++;

  c = 0;
  for (let y = cy; y >= minY; y--) if (hasWallInDir(w, cx, y, 'down')) c++;
  if (c % 2 === 1) oddRays++;

  return oddRays >= 3;
}

export function hasWallInDir(walls: Set<string>, x: number, y: number, d: Dir): boolean {
  switch (d) {
    case 'up':
      return walls.has(`H:${x},${y}`);
    case 'down':
      return walls.has(`H:${x},${y - 1}`);
    case 'left':
      return walls.has(`V:${x - 1},${y}`);
    case 'right':
      return walls.has(`V:${x},${y}`);
  }
}

export function getSnakeWallSegmentData(
  inst: FieldInstance
): { side: Dir; cells: { x: number; y: number }[] }[] {
  const result: { side: Dir; cells: { x: number; y: number }[] }[] = [];
  const dirs: Dir[] = ['up', 'down', 'left', 'right'];

  let curr = { ...inst.start };
  let wallDir: Dir | null = null;
  for (const d of dirs) {
    if (hasWallInDir(inst.walls, curr.x, curr.y, d)) {
      wallDir = d;
      break;
    }
  }
  if (!wallDir) {
    throw new Error('Snake-wall geometry: start cell has no adjacent wall');
  }

  for (let seg = 0; seg < 5; seg++) {
    const side = oppositeDir(wallDir);
    const segCells: { x: number; y: number }[] = [];

    const perpDirs: Dir[] =
      wallDir === 'up' || wallDir === 'down' ? ['left', 'right'] : ['up', 'down'];

    let moveDir: Dir | null = null;
    for (const pd of perpDirs) {
      const stepX = pd === 'right' ? curr.x + 1 : pd === 'left' ? curr.x - 1 : curr.x;
      const stepY = pd === 'up' ? curr.y + 1 : pd === 'down' ? curr.y - 1 : curr.y;
      if (hasWallInDir(inst.walls, stepX, stepY, wallDir)) {
        moveDir = pd;
        break;
      }
    }

    if (!moveDir) {
      throw new Error(`Snake-wall geometry: segment ${seg + 1} has no valid movement direction along wall`);
    }

    let loopGuard = 0;
    while (hasWallInDir(inst.walls, curr.x, curr.y, wallDir)) {
      if (++loopGuard > 1000) {
        throw new Error(`Snake-wall geometry: infinite loop detected in segment ${seg + 1}`);
      }
      segCells.push({ x: curr.x, y: curr.y });
      const nextX = moveDir === 'right' ? curr.x + 1 : moveDir === 'left' ? curr.x - 1 : curr.x;
      const nextY = moveDir === 'up' ? curr.y + 1 : moveDir === 'down' ? curr.y - 1 : curr.y;
      if (!hasWallInDir(inst.walls, nextX, nextY, wallDir)) {
        break;
      }
      curr = { x: nextX, y: nextY };
    }

    if (segCells.length < 2) {
      throw new Error(`Snake-wall geometry: segment ${seg + 1} has fewer than 2 cells (got ${segCells.length})`);
    }

    result.push({ side, cells: segCells });

    if (seg < 4) {
      const oldWallDir: Dir = wallDir;
      let newWallDir: Dir | null = null;
      for (const d of perpDirs) {
        if (hasWallInDir(inst.walls, curr.x, curr.y, d)) {
          newWallDir = d;
          break;
        }
      }
      if (!newWallDir) {
        for (const pd of perpDirs) {
          const stepX = pd === 'right' ? curr.x + 1 : pd === 'left' ? curr.x - 1 : curr.x;
          const stepY = pd === 'up' ? curr.y + 1 : pd === 'down' ? curr.y - 1 : curr.y;
          for (const d of ['up', 'down', 'left', 'right'] as Dir[]) {
            if (d !== oldWallDir && hasWallInDir(inst.walls, stepX, stepY, d)) {
              newWallDir = d;
              curr = { x: stepX, y: stepY };
              break;
            }
          }
          if (newWallDir) break;
        }
      }
      if (!newWallDir) {
        throw new Error(`Snake-wall geometry: failed to transition from segment ${seg + 1} to segment ${seg + 2}`);
      }
      wallDir = newWallDir;
    }
  }

  return result;
}

export function getSnakeWallGeometricSides(inst: FieldInstance): Dir[] {
  return getSnakeWallSegmentData(inst).map((d) => d.side);
}

export function runSnakeWallMutationTest(): boolean {
  const family = ROBOT_FAMILIES.find((f) => f.id === 'snake-wall');
  if (!family) throw new Error('snake-wall family not found');
  const goal = family.goals.find((g) => g.id === 'all-sides');
  if (!goal) throw new Error('snake-wall all-sides goal not found');

  const rng = makeLcgRng(123456);
  const { visible } = buildInstances(family, goal, rng);

  const normalStmt = goal.statement('id');
  const geomSidesNormal = getSnakeWallGeometricSides(visible);

  // Check normal statement against pairwise invariant
  const segNames = ['первого', 'второго', 'третьего', 'четвёртого', 'пятого'];
  for (let k = 0; k < 5; k++) {
    const expectedWord = sideWord(geomSidesNormal[k]);
    const regex = new RegExp(`${segNames[k]}\\s*—\\s*([а-яА-ЯёЁ]+)`);
    const match = normalStmt.match(regex);
    if (!match || match[1] !== expectedWord) {
      throw new Error(`Snake-wall normal statement failed invariant at segment ${k + 1}`);
    }
  }

  // Mutated statement: swap 1st segment side word from 'выше' to 'ниже'
  const goodSideWord = sideWord(geomSidesNormal[0]);
  const badSideWord = sideWord(oppositeDir(geomSidesNormal[0]));
  const mutatedStmt = normalStmt.replace(
    new RegExp(`первого\\s*—\\s*${goodSideWord}`),
    `первого — ${badSideWord}`
  );

  let mutatedCaught = false;
  const match1 = mutatedStmt.match(/первого\s*—\s*([а-яА-ЯёЁ]+)/);
  if (!match1 || match1[1] !== goodSideWord) {
    mutatedCaught = true;
  }

  if (!mutatedCaught) {
    throw new Error('Snake-wall mutation test failed: mutated statement unexpectedly passed invariant check');
  }

  console.log('snake-wall mutation test: PASSED');
  return true;
}

export function testTransformCode(): boolean {
  const testPhrases = [
    { input: 'пока сверху свободно', dir: 'up' as Dir },
    { input: 'пока снизу стена', dir: 'down' as Dir },
    { input: 'пока слева свободно', dir: 'left' as Dir },
    { input: 'пока справа стена', dir: 'right' as Dir },
  ];

  for (const t of ALL_TRANSFORMS) {
    for (const item of testPhrases) {
      const res = transformCode(item.input, t);
      const expectedDir = transformDir(item.dir, t);
      const expectedWord =
        expectedDir === 'up' ? 'сверху' :
        expectedDir === 'down' ? 'снизу' :
        expectedDir === 'left' ? 'слева' : 'справа';
      if (!res.includes(expectedWord)) {
        throw new Error(
          `transformCode test failed for [${t}] on "${item.input}": got "${res}", expected word "${expectedWord}"`
        );
      }

      // Idempotency check: transforming already transformed text with 'id' must return it unchanged
      const idRes = transformCode(res, 'id');
      if (idRes !== res) {
        throw new Error(
          `transformCode idempotency check failed for [${t}]: "${res}" changed to "${idRes}" when transformed with 'id'`
        );
      }
    }
  }

  console.log('transformCode test: PASSED');
  return true;
}

function makeLcgRng(seed = 12345): Rng {
  let s = seed;
  const next = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return {
    int: (a: number, b: number) => {
      const min = Math.ceil(Math.min(a, b));
      const max = Math.floor(Math.max(a, b));
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick: <T>(arr: T[]): T => {
      const idx = Math.floor(next() * arr.length);
      return arr[idx];
    },
  };
}

export function runSelfTest(opts?: {
  collectAll?: boolean;
  mutateGoalId?: string;
  mutateFn?: (inst: FieldInstance) => void;
}): string {
  const collectAll = opts?.collectAll ?? false;
  runSnakeWallMutationTest();
  testTransformCode();

  const lines: string[] = ['=== САМОПРОВЕРКА РОБОТА (ЗАДАНИЕ 15) ===\n'];

  // Distribution check
  let l1Count = 0;
  let l2Count = 0;
  let l3Count = 0;
  let totalGoalCount = 0;
  for (const family of ROBOT_FAMILIES) {
    for (const goal of family.goals) {
      totalGoalCount++;
      const effLevel = goal.level ?? family.level;
      if (effLevel === 1) l1Count++;
      else if (effLevel === 2) l2Count++;
      else if (effLevel === 3) l3Count++;
    }
  }
  if (totalGoalCount !== 36 || l1Count !== 9 || l2Count !== 19 || l3Count !== 8) {
    lines.push(
      `ОШИБКА РАСПРЕДЕЛЕНИЯ ЦЕЛЕЙ: L1=${l1Count} (ожидалось 9), L2=${l2Count} (ожидалось 19), L3=${l3Count} (ожидалось 8), всего=${totalGoalCount} (ожидалось 36)`
    );
    process.exitCode = 1;
  }

  let passedGoals = 0;
  let totalGoals = 0;

  for (const family of ROBOT_FAMILIES) {
    for (const goal of family.goals) {
      totalGoals++;
      const rng = makeLcgRng(123456);
      const visP = family.visibleParams(rng, goal.id);
      const hidP = family.hiddenParams(rng, goal.id);
      const visible = applyGoal(family.build(visP), goal, visP);
      const hidden = hidP.map((p) => applyGoal(family.build(p), goal, p));

      if (opts?.mutateGoalId === goal.id && opts.mutateFn) {
        opts.mutateFn(visible);
      }

      const rawAllInstances = [visible, ...hidden];
      const allParams = [visP, ...hidP];

      let passedTransforms = 0;
      const failInfoStrs: string[] = [];

      for (const t of ALL_TRANSFORMS) {
        const transformedVisible = transformInstance(visible, t);
        const transformedHidden = hidden.map((inst) => transformInstance(inst, t));
        const transformedRef = transformCode(goal.reference, t);

        // Geometry check on transformed instances
        let geomOk = true;
        let geomErr = '';
        const allTransformed = [transformedVisible, ...transformedHidden];

        for (let i = 0; i < allTransformed.length; i++) {
          const inst = allTransformed[i];
          if (inst.target.size === 0) {
            geomOk = false;
            geomErr = `Инстанс ${i} (${inst.label}): целевое множество клеток (target) пустое`;
            break;
          }

          const { minX, maxX, minY, maxY } = inst.bounds;
          if (
            inst.start.x < minX ||
            inst.start.x > maxX ||
            inst.start.y < minY ||
            inst.start.y > maxY
          ) {
            geomOk = false;
            geomErr = `Инстанс ${i} (${inst.label}): старт (${inst.start.x},${inst.start.y}) выходит за границы [${minX}..${maxX}, ${minY}..${maxY}]`;
            break;
          }

          for (const tKey of inst.target) {
            const [tx, ty] = tKey.split(',').map(Number);
            if (tx < minX || tx > maxX || ty < minY || ty > maxY) {
              geomOk = false;
              geomErr = `Инстанс ${i} (${inst.label}): целевая клетка ${tKey} выходит за границы [${minX}..${maxX}, ${minY}..${maxY}]`;
              break;
            }
          }
          if (!geomOk) break;

          // Target connectivity invariant check for path goals
          const pathGoals = [
            'around-wall',
            'around-corner-to-gap',
            'under-left',
            'above-left',
            'under-to-gap',
            'cross-to-far-end',
            'cross-to-near-end',
            'perimeter',
            'perimeter-no-gap',
            'all-sides',
          ];
          if (pathGoals.includes(goal.id) && inst.target.size > 1) {
            const targets = Array.from(inst.target).map((k) => {
              const [x, y] = k.split(',').map(Number);
              return { x, y };
            });

            // Find a valid ordering where each cell is adjacent to the previous one
            const visited = new Array(targets.length).fill(false);
            const path: { x: number; y: number }[] = [];

            const isAdj = (a: { x: number; y: number }, b: { x: number; y: number }) =>
              Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

            const dfs = (currIdx: number): boolean => {
              path.push(targets[currIdx]);
              visited[currIdx] = true;
              if (path.length === targets.length) return true;

              for (let nextIdx = 0; nextIdx < targets.length; nextIdx++) {
                if (!visited[nextIdx] && isAdj(targets[currIdx], targets[nextIdx])) {
                  if (dfs(nextIdx)) return true;
                }
              }

              visited[currIdx] = false;
              path.pop();
              return false;
            };

            let connected = false;
            for (let startIdx = 0; startIdx < targets.length; startIdx++) {
              if (dfs(startIdx)) {
                connected = true;
                break;
              }
            }

            if (!connected) {
              geomOk = false;
              geomErr = `Инстанс ${i} (${inst.label}): целевые клетки не образуют связный путь (нарушена соседность по стороне)`;
              break;
            }
          }
        }

        if (!geomOk) {
          failInfoStrs.push(`Ориентация [${t}]: ОШИБКА ГЕОМЕТРИИ — ${geomErr}`);
          if (!collectAll) break;
          continue;
        }

        // Independent rect-outside check: start and ALL target cells MUST be strictly OUTSIDE room rectangle
        if (family.id === 'rect-outside') {
          for (let idx = 0; idx < allTransformed.length; idx++) {
            const inst = allTransformed[idx];
            if (isCellInsideRoomWalls(inst, inst.start.x, inst.start.y)) {
              geomOk = false;
              geomErr = `rect-outside: старт (${inst.start.x},${inst.start.y}) попал внутрь комнаты`;
              break;
            }

            for (const tKey of inst.target) {
              const [tx, ty] = tKey.split(',').map(Number);
              if (isCellInsideRoomWalls(inst, tx, ty)) {
                geomOk = false;
                geomErr = `rect-outside: клетка ${tKey} попала внутрь комнаты`;
                break;
              }
            }
            if (!geomOk) break;
          }

          if (!geomOk) {
            failInfoStrs.push(`Ориентация [${t}]: ОШИБКА rect-outside — ${geomErr}`);
            if (!collectAll) break;
            continue;
          }

          // Non-tautological geometric invariant check for rect-outside
          if (goal.id === 'around-wall') {
            const geomGapDir = getGeomGapDir(transformedVisible);
            const geomGapWord = wallAdjGen(geomGapDir);
            const stmtText = goal.statement(t);
            const m = stmtText.match(/В (верхней|нижней|левой|правой|сверху|снизу|слева|справа) стене/);
            let textGapWord = '';
            if (m) {
              const w = m[1];
              if (w === 'верхней' || w === 'сверху') textGapWord = 'верхней';
              else if (w === 'нижней' || w === 'снизу') textGapWord = 'нижней';
              else if (w === 'левой' || w === 'слева') textGapWord = 'левой';
              else if (w === 'правой' || w === 'справа') textGapWord = 'правой';
            }
            if (geomGapWord !== textGapWord) {
              failInfoStrs.push(`Ориентация [${t}]: ОШИБКА rect-outside — геометрическая сторона прохода '${geomGapWord}' не совпадает с текстом '${textGapWord}'`);
              if (!collectAll) break;
              continue;
            }
          }

          if (goal.id === 'around-corner-to-gap') {
            const geomGapDir = getGeomGapDir(transformedVisible);
            const geomAdjDir = getGeomAdjWallDir(transformedVisible, geomGapDir);
            const geomGapWord = wallAdjGen(geomGapDir);
            const geomAdjWord = wallAdjGen(geomAdjDir);

            const stmtText = goal.statement(t);
            const m = stmtText.match(/В (верхней|нижней|левой|правой|сверху|снизу|слева|справа) стене, смежной с (верхней|нижней|левой|правой|сверху|снизу|слева|справа) стеной/);
            let textGapWord = '';
            let textAdjWord = '';
            if (m) {
              const parseWord = (w: string) => {
                if (w === 'верхней' || w === 'сверху') return 'верхней';
                if (w === 'нижней' || w === 'снизу') return 'нижней';
                if (w === 'левой' || w === 'слева') return 'левой';
                if (w === 'правой' || w === 'справа') return 'правой';
                return w;
              };
              textGapWord = parseWord(m[1]);
              textAdjWord = parseWord(m[2]);
            }
            if (geomGapWord !== textGapWord || geomAdjWord !== textAdjWord) {
              failInfoStrs.push(`Ориентация [${t}]: ОШИБКА rect-outside — сторона прохода или смежная стена по геометрии ('${geomGapWord}', '${geomAdjWord}') не совпадает с текстом ('${textGapWord}', '${textAdjWord}')`);
              if (!collectAll) break;
              continue;
            }
          }

          if (goal.id === 'outer-corners') {
            for (let idx = 0; idx < allTransformed.length; idx++) {
              const inst = allTransformed[idx];
              let hMaxY = -Infinity, hMinY = Infinity, vMaxX = -Infinity, vMinX = Infinity;
              for (const w of inst.walls) {
                if (w.startsWith('H:')) {
                  const wy = Number(w.slice(2).split(',')[1]);
                  if (wy > hMaxY) hMaxY = wy;
                  if (wy < hMinY) hMinY = wy;
                } else if (w.startsWith('V:')) {
                  const wx = Number(w.slice(2).split(',')[0]);
                  if (wx > vMaxX) vMaxX = wx;
                  if (wx < vMinX) vMinX = wx;
                }
              }
              const roomMinX = vMinX + 1;
              const roomMaxX = vMaxX;
              const roomMinY = hMinY + 1;
              const roomMaxY = hMaxY;

              const expectedCorners = new Set([
                `${roomMinX - 1},${roomMaxY + 1}`,
                `${roomMaxX + 1},${roomMaxY + 1}`,
                `${roomMaxX + 1},${roomMinY - 1}`,
                `${roomMinX - 1},${roomMinY - 1}`,
              ]);

              const targetSet = inst.target;
              const matchTarget = expectedCorners.size === targetSet.size && [...expectedCorners].every((k) => targetSet.has(k));
              const startKey = `${inst.start.x},${inst.start.y}`;
              const startInTarget = targetSet.has(startKey);

              if (!matchTarget || !startInTarget) {
                geomOk = false;
                geomErr = `rect-outside / outer-corners: несовпадение углов (match=${matchTarget}) или старт (${startKey}) не в целевом множестве (startInTarget=${startInTarget}). Ожидались [${Array.from(expectedCorners).join(' ')}], получены [${Array.from(targetSet).join(' ')}]`;
                break;
              }
            }
            if (!geomOk) {
              failInfoStrs.push(`Ориентация [${t}]: ОШИБКА rect-outside — ${geomErr}`);
              if (!collectAll) break;
              continue;
            }
          }
        }

        // Helpers for rect-outside geometric gap side and adjacent wall side
        function getGeomGapDir(inst: FieldInstance): Dir {
          let hMaxY = -Infinity, hMinY = Infinity, vMaxX = -Infinity, vMinX = Infinity;
          for (const w of inst.walls) {
            if (w.startsWith('H:')) {
              const wy = Number(w.slice(2).split(',')[1]);
              if (wy > hMaxY) hMaxY = wy;
              if (wy < hMinY) hMinY = wy;
            } else if (w.startsWith('V:')) {
              const wx = Number(w.slice(2).split(',')[0]);
              if (wx > vMaxX) vMaxX = wx;
              if (wx < vMinX) vMinX = wx;
            }
          }

          const W = vMaxX - vMinX;
          const H = hMaxY - hMinY;

          let topCount = 0, bottomCount = 0, leftCount = 0, rightCount = 0;
          for (const w of inst.walls) {
            if (w.startsWith('H:')) {
              const wy = Number(w.slice(2).split(',')[1]);
              if (wy === hMaxY) topCount++;
              if (wy === hMinY) bottomCount++;
            } else if (w.startsWith('V:')) {
              const wx = Number(w.slice(2).split(',')[0]);
              if (wx === vMinX) leftCount++;
              if (wx === vMaxX) rightCount++;
            }
          }

          if (topCount < W) return 'up';
          if (bottomCount < W) return 'down';
          if (leftCount < H) return 'left';
          if (rightCount < H) return 'right';
          throw new Error('rect-outside geometry: no wall with gap found');
        }

        function getGeomAdjWallDir(inst: FieldInstance, gapDir: Dir): Dir {
          let hMaxY = -Infinity, hMinY = Infinity, vMaxX = -Infinity, vMinX = Infinity;
          for (const w of inst.walls) {
            if (w.startsWith('H:')) {
              const wy = Number(w.slice(2).split(',')[1]);
              if (wy > hMaxY) hMaxY = wy;
              if (wy < hMinY) hMinY = wy;
            } else if (w.startsWith('V:')) {
              const wx = Number(w.slice(2).split(',')[0]);
              if (wx > vMaxX) vMaxX = wx;
              if (wx < vMinX) vMinX = wx;
            }
          }

          if (gapDir === 'up' || gapDir === 'down') {
            return Math.abs(inst.start.x - vMinX) <= 1 ? 'left' : 'right';
          } else {
            return Math.abs(inst.start.y - hMaxY) <= 1 ? 'up' : 'down';
          }
        }

        // Geometric invariant check for multi-gap-wall and multi-gap-wall-barrier
        if (family.id === 'multi-gap-wall' || family.id === 'multi-gap-wall-barrier') {
          // Check untransformed instances (visible + hidden) for wall gaps at ends and barrier invariant
          for (let idx = 0; idx < rawAllInstances.length; idx++) {
            const rawInst = rawAllInstances[idx];
            const p = allParams[idx];
            const L = num(p, 'L');
            if (L > 0) {
              // End cells x=0 and x=L-1 must have solid wall above
              const hasStartWall = rawInst.walls.has('H:0,0');
              const hasEndWall = rawInst.walls.has(`H:${L - 1},0`);
              if (!hasStartWall || !hasEndWall) {
                geomOk = false;
                geomErr = `${family.id} (инстанс ${idx}): проход касается конца стены (startWall=${hasStartWall}, endWall=${hasEndWall})`;
                break;
              }

              if (family.id === 'multi-gap-wall-barrier') {
                const xB = num(p, 'xB');
                const hasBarrierWall = rawInst.walls.has(`V:${xB - 1},0`);
                const hasAdjSolidWall = rawInst.walls.has(`H:${xB},0`);
                if (!hasBarrierWall || !hasAdjSolidWall) {
                  geomOk = false;
                  geomErr = `multi-gap-wall-barrier (инстанс ${idx}): перегородка на xB=${xB} отсутствует (hasBarrier=${hasBarrierWall}) или смежная клетка справа не имеет сплошной стены (hasAdj=${hasAdjSolidWall})`;
                  break;
                }
              }
            }
          }
          if (!geomOk) {
            failInfoStrs.push(`Ориентация [${t}]: ОШИБКА ИНВАРИАНТА — ${geomErr}`);
            if (!collectAll) break;
            continue;
          }
        }

        // Pairwise invariant check for snake-wall
        if (family.id === 'snake-wall') {
          const stmtText = goal.statement(t);
          const segData = getSnakeWallSegmentData(transformedVisible);

          // Check bend indices invariant
          let totalCells = 0;
          const bendIndices: number[] = [];
          for (let i = 0; i < segData.length; i++) {
            totalCells += segData[i].cells.length;
            if (i < segData.length - 1) {
              bendIndices.push(totalCells - 1);
            }
          }
          if (bendIndices.length < 3 || bendIndices[0] <= 0 || bendIndices[bendIndices.length - 1] >= totalCells - 1) {
            failInfoStrs.push(`Ориентация [${t}]: ОШИБКА snake-wall — перегибы [${bendIndices.join(', ')}] выходят за пределы (0, ${totalCells - 1})`);
            if (!collectAll) break;
            continue;
          }

          const segNames = ['первого', 'второго', 'третьего', 'четвёртого', 'пятого'];
          const extractedWords: (string | null)[] = [null, null, null, null, null];

          for (let k = 0; k < 5; k++) {
            const regex = new RegExp(`${segNames[k]}\\s*—\\s*([а-яА-ЯёЁ]+)`);
            const match = stmtText.match(regex);
            if (match) {
              extractedWords[k] = match[1];
            }
          }

          for (let k = 0; k < 5; k++) {
            const isPaintedSeg =
              goal.id === 'all-sides' || (goal.id === 'marked-sides' && k !== 2);

            const expectedWord = sideWord(segData[k].side);
            const actualWord = extractedWords[k];

            if (isPaintedSeg) {
              if (!actualWord) {
                geomOk = false;
                geomErr = `Честный инвариант snake-wall: не найден текст для отрезка ${k + 1} (${segNames[k]})`;
                break;
              }

              if (actualWord !== expectedWord) {
                geomOk = false;
                geomErr = `Честный инвариант snake-wall: для отрезка ${k + 1} (${segNames[k]}) в условии «${actualWord}», а по геометрии «${expectedWord}»`;
                break;
              }

              for (const cell of segData[k].cells) {
                const kStr = `${cell.x},${cell.y}`;
                if (!transformedVisible.target.has(kStr)) {
                  geomOk = false;
                  geomErr = `Честный инвариант snake-wall: клетка ${kStr} отрезка ${k + 1} отсутствует в target`;
                  break;
                }
              }
              if (!geomOk) break;
            } else {
              for (const cell of segData[k].cells) {
                const kStr = `${cell.x},${cell.y}`;
                if (transformedVisible.target.has(kStr)) {
                  geomOk = false;
                  geomErr = `Честный инвариант snake-wall: незакрашиваемая клетка ${kStr} отрезка ${k + 1} присутствует в target`;
                  break;
                }
              }
              if (!geomOk) break;
            }
          }

          if (!geomOk) {
            failInfoStrs.push(`Ориентация [${t}]: ОШИБКА ИНВАРИАНТА — ${geomErr}`);
            if (!collectAll) break;
            continue;
          }
        }

        const refRes = checkSolution(
          transformedRef,
          family,
          transformedVisible,
          transformedHidden
        );

        if (refRes.score !== 2) {
          const details = refRes.fail
            ? `провал на ${refRes.fail.instance.label}: ${refRes.fail.reason}`
            : 'ошибка вычисления';
          failInfoStrs.push(`Ориентация [${t}]: эталон получил ${refRes.score} баллов (${details})`);
          if (!collectAll) break;
          continue;
        }

        passedTransforms++;
      }

      if (failInfoStrs.length === 0 && passedTransforms === ALL_TRANSFORMS.length) {
        passedGoals++;
        lines.push(
          `${family.id} / ${goal.id}: OK, ${passedTransforms}/${ALL_TRANSFORMS.length} ориентаций, инстансов ${rawAllInstances.length}`
        );
      } else {
        lines.push(`${family.id} / ${goal.id}: ОШИБКА — ${failInfoStrs.join('; ')}`);
      }
    }
  }

  lines.push('');
  lines.push(`Итог: Пройдено ${passedGoals} из ${totalGoals} целей`);
  if (passedGoals < totalGoals) {
    process.exitCode = 1;
  }
  return lines.join('\n');
}

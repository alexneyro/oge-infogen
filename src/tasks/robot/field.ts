import { Bounds, Cell, Dir, FieldInstance, FamilyParams, GapParam, Rng, RobotFamily, RobotGoal, num, gapsOf } from './types';
import { TransformId, transformDir } from './transform';
import {
  condWord,
  moveWord,
  hwallGapUnderLeftStatement,
  hwallGapUnderLeftHint,
  hwallGapOnlyStatement,
  hwallGapOnlyHint,
  hwallGapBothSidesLeftStatement,
  hwallGapBothSidesLeftHint,
  hwallGapAboveLeftStatement,
  hwallGapAboveLeftHint,
  hwallGapMidUnderToGapStatement,
  hwallGapMidUnderToGapHint,
  hwallGapMidGapOnlyStatement,
  hwallGapMidGapOnlyHint,
  cornerGapUnderCornerStatement,
  cornerGapUnderCornerHint,
  cornerGapOnlyStatement,
  cornerGapOnlyHint,
  fipiClassicUnderCornerGapsStatement,
  fipiClassicUnderCornerGapsHint,
  fipiClassicGapsOnlyStatement,
  fipiClassicGapsOnlyHint,
  stairsAllStepsStatement,
  stairsAllStepsHint,
  stairsStepCornersStatement,
  stairsStepCornersHint,
  hwallCrossStatement,
  hwallCrossHint,
  hwallCrossNearStatement,
  hwallCrossNearHint,
  riseVerbInfinitive,
  roomPerimeterStatement,
  roomPerimeterHint,
  roomCornersStatement,
  roomCornersHint,
  corridorAllStatement,
  corridorAllHint,
  corridorEndsStatement,
  corridorEndsHint,
  corridorMidBothEndsStatement,
  corridorMidBothEndsHint,
  corridorMidAllFromMidStatement,
  corridorMidAllFromMidHint,
  multiGapWallUnderGapsStatement,
  multiGapWallUnderGapsHint,
  multiGapWallUnderWallStatement,
  multiGapWallUnderWallHint,
  multiGapWallBarrierUnderGapsStatement,
  multiGapWallBarrierUnderGapsHint,
  multiGapWallBarrierUnderWallStatement,
  multiGapWallBarrierUnderWallHint,
  snakeWallMarkedSidesStatement,
  snakeWallMarkedSidesHint,
  snakeWallAllSidesStatement,
  snakeWallAllSidesHint,
  stairsTurnAllStepsStatement,
  stairsTurnAllStepsHint,
  stairsTurnAscentOnlyStatement,
  stairsTurnAscentOnlyHint,
  stairsTurnVarAllStepsStatement,
  stairsTurnVarAllStepsHint,
  stairsTurnVarStepCornersStatement,
  stairsTurnVarStepCornersHint,
  stairsTurnVarAscentOnlyStatement,
  stairsTurnVarAscentOnlyHint,
  rectOutsideAroundWallStatement,
  rectOutsideAroundWallHint,
  rectOutsideAroundCornerToGapStatement,
  rectOutsideAroundCornerToGapHint,
  rectOutsideOuterCornersStatement,
  rectOutsideOuterCornersHint,
  roomGapPerimeterNoGapStatement,
  roomGapPerimeterNoGapHint,
  roomGapGapOnlyStatement,
  roomGapGapOnlyHint,
} from './orient';

export function key(x: number, y: number): string {
  return `${x},${y}`;
}

export function addWallAbove(walls: Set<string>, x: number, y: number): void {
  walls.add(`H:${x},${y}`);
}

export function addWallBelow(walls: Set<string>, x: number, y: number): void {
  walls.add(`H:${x},${y - 1}`);
}

export function addWallRight(walls: Set<string>, x: number, y: number): void {
  walls.add(`V:${x},${y}`);
}

export function addWallLeft(walls: Set<string>, x: number, y: number): void {
  walls.add(`V:${x - 1},${y}`);
}

export function hasWallAbove(walls: Set<string>, x: number, y: number): boolean {
  return walls.has(`H:${x},${y}`);
}

export function hasWallBelow(walls: Set<string>, x: number, y: number): boolean {
  return walls.has(`H:${x},${y - 1}`);
}

export function hasWallRight(walls: Set<string>, x: number, y: number): boolean {
  return walls.has(`V:${x},${y}`);
}

export function hasWallLeft(walls: Set<string>, x: number, y: number): boolean {
  return walls.has(`V:${x - 1},${y}`);
}

export function hasWall(walls: Set<string>, x: number, y: number, dir: 'up' | 'down' | 'left' | 'right'): boolean {
  switch (dir) {
    case 'up':
      return hasWallAbove(walls, x, y);
    case 'down':
      return hasWallBelow(walls, x, y);
    case 'right':
      return hasWallRight(walls, x, y);
    case 'left':
      return hasWallLeft(walls, x, y);
  }
}

export function computeBounds(walls: Set<string>, target: Set<string>, start: Cell): Bounds {
  let minX = start.x;
  let maxX = start.x;
  let minY = start.y;
  let maxY = start.y;

  const update = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  for (const tKey of target) {
    const [x, y] = tKey.split(',').map(Number);
    update(x, y);
  }

  for (const wKey of walls) {
    const [type, coordStr] = wKey.split(':');
    const [x, y] = coordStr.split(',').map(Number);
    update(x, y);
    if (type === 'H') {
      update(x, y + 1);
    } else if (type === 'V') {
      update(x + 1, y);
    }
  }

  return {
    minX: minX - 1,
    maxX: maxX + 1,
    minY: minY - 1,
    maxY: maxY + 1,
  };
}

export function applyGoal(base: FieldInstance, goal: RobotGoal, p: FamilyParams): FieldInstance {
  const target = goal.target(p, base);
  const bounds = computeBounds(base.walls, target, base.start);
  return {
    ...base,
    target,
    bounds,
  };
}

// Семейство 1: hwall-gap
const familyHwallGap: RobotFamily = {
  id: 'hwall-gap',
  level: 1,
  origin: 'вариант ОГЭ',
  title: 'Горизонтальная стена с проходом',
  build: (p: FamilyParams): FieldInstance => {
    const L = num(p, 'L');
    const w = num(p, 'w');
    const gapStart = num(p, 'p');
    const walls = new Set<string>();

    for (let x = 0; x < L; x++) {
      if (x < gapStart || x >= gapStart + w) {
        addWallAbove(walls, x, 0);
      }
    }

    const start = { x: 0, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `L=${L}, w=${w}, p=${gapStart}`,
    };
  },
  goals: [
    {
      id: 'under-left',
      title: 'Под стеной левее прохода',
      statement: hwallGapUnderLeftStatement,
      hint: hwallGapUnderLeftHint,
      target: (p: FamilyParams) => {
        const gapStart = num(p, 'p');
        const target = new Set<string>();
        for (let x = 0; x < gapStart; x++) {
          target.add(key(x, 0));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    закрасить
    вправо
  кц
кон`,
    },
    {
      id: 'gap-only',
      title: 'Под проходом',
      statement: hwallGapOnlyStatement,
      hint: hwallGapOnlyHint,
      target: (p: FamilyParams) => {
        const gapStart = num(p, 'p');
        const w = num(p, 'w');
        const target = new Set<string>();
        for (let x = gapStart; x < gapStart + w; x++) {
          target.add(key(x, 0));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    вправо
  кц
  нц пока сверху свободно
    закрасить
    вправо
  кц
кон`,
    },
    {
      id: 'both-sides-left',
      title: 'Под и над стеной левее прохода',
      statement: hwallGapBothSidesLeftStatement,
      hint: hwallGapBothSidesLeftHint,
      target: (p: FamilyParams) => {
        const gapStart = num(p, 'p');
        const target = new Set<string>();
        for (let x = 0; x < gapStart; x++) {
          target.add(key(x, 0));
          target.add(key(x, 1));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    закрасить
    вправо
  кц
  вверх
  влево
  нц пока снизу стена
    закрасить
    влево
  кц
кон`,
    },
    {
      id: 'above-left',
      title: 'Над стеной левее прохода',
      statement: hwallGapAboveLeftStatement,
      hint: hwallGapAboveLeftHint,
      target: (p: FamilyParams) => {
        const gapStart = num(p, 'p');
        const target = new Set<string>();
        for (let x = 0; x < gapStart; x++) {
          target.add(key(x, 1));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  влево
  вверх
  вправо
  нц пока снизу стена
    закрасить
    вправо
  кц
кон`,
    },
  ],
  visibleParams: (rng: Rng, goalId?: string): FamilyParams => {
    if (goalId === 'gap-only') {
      const w = rng.int(3, 4);
      const p = rng.int(3, 4);
      const L = Math.min(12, Math.max(9, p + w + rng.int(2, 4)));
      return { L, w, p };
    }
    if (goalId === 'both-sides-left') {
      const p = rng.int(2, 3);
      const w = rng.int(2, 3);
      const L = Math.min(12, Math.max(9, p + w + rng.int(3, 5)));
      return { L, w, p };
    }
    const p = rng.int(3, 6);
    const w = rng.int(2, 3);
    const L = Math.min(12, Math.max(9, p + w + rng.int(2, 4)));
    return { L, w, p };
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { L: 6, w: 1, p: 1 },
      { L: 6, w: 1, p: 4 },
      { L: 10, w: 1, p: 1 },
      { L: 10, w: 3, p: 1 },
      { L: 10, w: 3, p: 6 },
      { L: 8, w: 2, p: 3 },
      { L: 7, w: 1, p: 5 },
      { L: 9, w: 2, p: 1 },
      { L: 9, w: 2, p: 6 },
      { L: 10, w: 4, p: 2 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dWallRel = condWord(transformDir('up', t));
    const dAlong = moveWord(transformDir('right', t));
    const dThrough = moveWord(transformDir('up', t));
    const dReturn = moveWord(transformDir('left', t));
    const dStart = moveWord(transformDir('left', t));
    const dOppWallRel = condWord(transformDir('down', t));

    switch (goal.id) {
      case 'under-left':
        return [
          `Запустить цикл «нц пока ${dWallRel} стена» (пока робот находится под стеной).`,
          `Внутри цикла закрашивать текущую клетку и делать шаг ${dAlong} вдоль стены.`,
          `Завершить цикл при выходе в проход (как только ${dWallRel} станет свободно).`,
        ];
      case 'gap-only':
        return [
          `Первым циклом «нц пока ${dWallRel} стена» дойти до начала прохода без закрашивания, двигаясь ${dAlong}.`,
          `Вторым циклом «нц пока ${dWallRel} свободно» двигаться ${dAlong} и закрашивать клетки, пока длится проход.`,
          `Остановиться сразу после завершения прохода, когда робот снова окажется у стены.`,
        ];
      case 'both-sides-left':
        return [
          `Первым циклом «нц пока ${dWallRel} стена» закрасить клетки с первой стороны стены, двигаясь ${dAlong} до прохода.`,
          `Перейти через проход на другую сторону стены: сделать шаг ${dThrough} и шаг ${dReturn}.`,
          `Вторым циклом «нц пока ${dOppWallRel} стена» двигаться ${dReturn} и закрашивать клетки с противоположной стороны стены.`,
          `Завершить цикл при выходе за край стены.`,
        ];
      case 'above-left':
        return [
          `Обогнуть край стены с торца, сделав шаг ${dStart}, шаг ${dThrough} и шаг ${dAlong}.`,
          `Запустить цикл «нц пока ${dOppWallRel} стена» для движения ${dAlong} с противоположной стороны стены.`,
          `Внутри цикла закрашивать текущую клетку и делать шаг ${dAlong}.`,
          `Остановиться при выходе к проходу (когда ${dOppWallRel} перестанет быть стеной).`,
        ];
      default:
        return [];
    }
  },
  typicalMistake: (t: TransformId, goal: RobotGoal): string => {
    const dThrough = moveWord(transformDir('up', t));
    const dReturn = moveWord(transformDir('left', t));

    switch (goal.id) {
      case 'under-left':
        return 'Проход за пределы стены из-за неверной проверки условия свободно/стена или попытка сделать лишний шаг после прохода.';
      case 'gap-only':
        return 'Закрашивание клеток под самой стеной вместо клеток прохода или пропуск первого цикла перемещения до начала прохода.';
      case 'both-sides-left':
        return `Забыть сделать шаг ${dReturn} после перехода через проход ${dThrough}, из-за чего робот начинает закрашивать клетки над самѝм проходом.`;
      case 'above-left':
        return 'Закрашивание клеток с первой стороны стены или ошибочный переход через стену вне прохода, приводящий к столкновению.';
      default:
        return '';
    }
  },
};

// Семейство 1.5: hwall-gap-mid
const familyHwallGapMid: RobotFamily = {
  id: 'hwall-gap-mid',
  level: 1,
  origin: 'вариант ОГЭ',
  title: 'Горизонтальная стена с проходом (робот в середине)',
  build: (p: FamilyParams): FieldInstance => {
    const L = num(p, 'L');
    const w = num(p, 'w');
    const gapStart = num(p, 'p');
    const startX = num(p, 'startX', 2);
    const walls = new Set<string>();

    for (let x = 0; x < L; x++) {
      if (x < gapStart || x >= gapStart + w) {
        addWallAbove(walls, x, 0);
      }
    }

    const start = { x: startX, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `L=${L}, w=${w}, p=${gapStart}, startX=${startX}`,
    };
  },
  goals: [
    {
      id: 'under-to-gap',
      title: 'Под стеной от Робота до прохода',
      statement: hwallGapMidUnderToGapStatement,
      hint: hwallGapMidUnderToGapHint,
      target: (p: FamilyParams) => {
        const gapStart = num(p, 'p');
        const startX = num(p, 'startX', 2);
        const target = new Set<string>();
        for (let x = startX; x < gapStart; x++) {
          target.add(key(x, 0));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    закрасить
    вправо
  кц
кон`,
    },
    {
      id: 'gap-only',
      title: 'Под проходом',
      statement: hwallGapMidGapOnlyStatement,
      hint: hwallGapMidGapOnlyHint,
      target: (p: FamilyParams) => {
        const gapStart = num(p, 'p');
        const w = num(p, 'w');
        const target = new Set<string>();
        for (let x = gapStart; x < gapStart + w; x++) {
          target.add(key(x, 0));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    вправо
  кц
  нц пока сверху свободно
    закрасить
    вправо
  кц
кон`,
    },
  ],
  visibleParams: (rng: Rng, _goalId?: string): FamilyParams => {
    const startX = rng.int(2, 4);
    const dist = rng.int(2, 5);
    const p = startX + dist;
    const w = rng.int(2, 3);
    const L = Math.max(12, p + w + rng.int(2, 4));
    return { L, w, p, startX };
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { L: 10, w: 1, p: 4, startX: 2 },
      { L: 12, w: 2, p: 7, startX: 2 },
      { L: 14, w: 1, p: 8, startX: 3 },
      { L: 15, w: 3, p: 9, startX: 3 },
      { L: 11, w: 2, p: 5, startX: 2 },
      { L: 13, w: 1, p: 6, startX: 2 },
      { L: 16, w: 3, p: 10, startX: 4 },
      { L: 12, w: 2, p: 6, startX: 3 },
      { L: 14, w: 2, p: 8, startX: 2 },
      { L: 10, w: 1, p: 5, startX: 3 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dWallRel = condWord(transformDir('up', t));
    const dAlong = moveWord(transformDir('right', t));

    switch (goal.id) {
      case 'under-to-gap':
        return [
          `Запустить цикл «нц пока ${dWallRel} стена» (пока робот находится под стеной).`,
          `Внутри цикла закрашивать текущую клетку и делать шаг ${dAlong} по направлению к проходу.`,
          `Завершить цикл при выходе в проход (как только ${dWallRel} станет свободно).`,
        ];
      case 'gap-only':
        return [
          `Первым циклом «нц пока ${dWallRel} стена» дойти от начальной клетки до прохода без закрашивания, двигаясь ${dAlong}.`,
          `Вторым циклом «нц пока ${dWallRel} свободно» двигаться ${dAlong} и закрашивать клетки, пока длится проход.`,
          `Остановиться сразу после завершения прохода, когда робот снова окажется у стены.`,
        ];
      default:
        return [];
    }
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    switch (goal.id) {
      case 'under-to-gap':
        return 'Закрашивание клеток прохода из-за лишнего шага или неверной проверки условия остановки цикла.';
      case 'gap-only':
        return 'Закрашивание клеток под самой стеной перед проходом или пропуск первого цикла перемещения до начала прохода.';
      default:
        return '';
    }
  },
};

// Семейство 1.6: hwall-cross
const familyHwallCross: RobotFamily = {
  id: 'hwall-cross',
  level: 2,
  origin: 'вариант ОГЭ',
  title: 'Горизонтальная стена с проходом (переход на другую сторону)',
  build: (p: FamilyParams): FieldInstance => {
    const L = num(p, 'L');
    const w = num(p, 'w');
    const gapStart = num(p, 'p');
    const startX = num(p, 'startX', 2);
    const walls = new Set<string>();

    for (let x = 0; x < L; x++) {
      if (x < gapStart || x >= gapStart + w) {
        addWallAbove(walls, x, 0);
      }
    }

    const start = { x: startX, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `L=${L}, w=${w}, p=${gapStart}, startX=${startX}`,
    };
  },
  goals: [
    {
      id: 'cross-to-far-end',
      title: 'Над стеной от прохода до дальнего конца',
      statement: hwallCrossStatement,
      hint: hwallCrossHint,
      target: (p: FamilyParams) => {
        const gapStart = num(p, 'p');
        const w = num(p, 'w');
        const L = num(p, 'L');
        const target = new Set<string>();
        for (let x = gapStart + w; x < L; x++) {
          target.add(key(x, 1));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    вправо
  кц
  вверх
  нц пока снизу свободно
    вправо
  кц
  нц пока снизу стена
    закрасить
    вправо
  кц
кон`,
    },
    {
      id: 'cross-to-near-end',
      title: 'Над стеной от прохода до ближнего конца',
      statement: hwallCrossNearStatement,
      hint: hwallCrossNearHint,
      target: (p: FamilyParams) => {
        const gapStart = num(p, 'p');
        const target = new Set<string>();
        for (let x = 0; x < gapStart; x++) {
          target.add(key(x, 1));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    вправо
  кц
  вверх
  влево
  нц пока снизу стена
    закрасить
    влево
  кц
кон`,
    },
  ],
  visibleParams: (rng: Rng, goalId?: string): FamilyParams => {
    while (true) {
      const startX = rng.int(2, 4);
      const dist = rng.int(2, 4);
      const p = startX + dist;
      const w = rng.int(2, 3);
      const L = p + w + (goalId === 'cross-to-near-end' ? rng.int(2, 4) : rng.int(3, 5));
      if (startX >= 2 && p - startX >= 2) {
        return { L, w, p, startX };
      }
    }
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { L: 10, w: 1, p: 3, startX: 1 },
      { L: 12, w: 1, p: 7, startX: 2 },
      { L: 14, w: 2, p: 8, startX: 2 },
      { L: 15, w: 3, p: 9, startX: 3 },
      { L: 11, w: 1, p: 5, startX: 2 },
      { L: 13, w: 2, p: 6, startX: 1 },
      { L: 16, w: 3, p: 10, startX: 4 },
      { L: 10, w: 2, p: 5, startX: 3 },
      { L: 14, w: 1, p: 8, startX: 2 },
      { L: 12, w: 3, p: 5, startX: 2 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dWallRel = condWord(transformDir('up', t));
    const dAlong = moveWord(transformDir('right', t));
    const dThrough = moveWord(transformDir('up', t));
    const dBack = moveWord(transformDir('left', t));
    const dOppWallRel = condWord(transformDir('down', t));

    if (goal.id === 'cross-to-near-end') {
      return [
        `Первым циклом «нц пока ${dWallRel} стена» дойти до начала прохода, двигаясь ${dAlong}.`,
        `Перейти через проход на противоположную сторону стены: сделать шаг ${dThrough}.`,
        `Сделать шаг ${dBack}, чтобы оказаться над стеной со стороны ближнего конца.`,
        `Циклом «нц пока ${dOppWallRel} стена» двигаться ${dBack} и закрашивать клетки вдоль стены до её ближнего конца.`,
      ];
    }

    return [
      `Первым циклом «нц пока ${dWallRel} стена» дойти до начала прохода, двигаясь ${dAlong}.`,
      `Перейти через проход на противоположную сторону стены: сделать шаг ${dThrough}.`,
      `Циклом «нц пока ${dOppWallRel} свободно» двигаться ${dAlong} до противоположного края прохода, где снова появится стена.`,
      `Циклом «нц пока ${dOppWallRel} стена» двигаться ${dAlong} и закрашивать клетки вдоль стены до её конца.`,
    ];
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    if (goal.id === 'cross-to-near-end') {
      return 'Движение после перехода через проход в ту же сторону, что и до него, вместо разворота и возврата назад к ближнему концу стены.';
    }
    return 'Попытка обогнуть стену с торца вместо перехода через проход, либо закрашивание клеток с исходной стороны стены или клеток в самóм проходе.';
  },
};

// Семейство 2: corner-gap
const familyCornerGap: RobotFamily = {
  id: 'corner-gap',
  level: 2,
  origin: 'вариант ОГЭ',
  title: 'Угол со сплошной вертикальной стеной и проходом в горизонтальной',
  build: (p: FamilyParams): FieldInstance => {
    const L = num(p, 'L');
    const M = num(p, 'M');
    const w = num(p, 'w');
    const gapStart = num(p, 'p');
    const walls = new Set<string>();

    for (let x = 0; x < L; x++) {
      if (x < gapStart || x >= gapStart + w) {
        addWallAbove(walls, x, 0);
      }
    }
    for (let y = 0; y >= -(M - 1); y--) {
      addWallRight(walls, L - 1, y);
    }

    const start = { x: 0, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `L=${L}, M=${M}, w=${w}, p=${gapStart}`,
    };
  },
  goals: [
    {
      id: 'under-corner',
      level: 2,
      title: 'Под горизонтальной и внутри вертикальной',
      statement: cornerGapUnderCornerStatement,
      hint: cornerGapUnderCornerHint,
      target: (p: FamilyParams) => {
        const L = num(p, 'L');
        const M = num(p, 'M');
        const w = num(p, 'w');
        const gapStart = num(p, 'p');
        const target = new Set<string>();
        for (let x = 0; x < L; x++) {
          if (x < gapStart || x >= gapStart + w) {
            target.add(key(x, 0));
          }
        }
        for (let y = 0; y >= -(M - 1); y--) {
          target.add(key(L - 1, y));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока справа свободно
    если сверху стена то
      закрасить
    все
    вправо
  кц
  нц пока справа стена
    закрасить
    вниз
  кц
кон`,
    },
    {
      id: 'gap-only',
      title: 'Проход в горизонтальной стене',
      statement: cornerGapOnlyStatement,
      hint: cornerGapOnlyHint,
      target: (p: FamilyParams) => {
        const w = num(p, 'w');
        const gapStart = num(p, 'p');
        const target = new Set<string>();
        for (let x = gapStart; x < gapStart + w; x++) {
          target.add(key(x, 0));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    вправо
  кц
  нц пока сверху свободно
    закрасить
    вправо
  кц
кон`,
    },
  ],
  visibleParams: (rng: Rng, goalId?: string): FamilyParams => {
    if (goalId === 'gap-only') {
      const w = rng.int(3, 4);
      const p = rng.int(3, 4);
      const L = Math.min(12, Math.max(9, p + w + rng.int(2, 4)));
      const M = rng.int(4, 6);
      return { L, M, w, p };
    }
    const p = rng.int(2, 3);
    const M = rng.int(2, 3);
    const w = rng.int(2, 3);
    const L = Math.min(12, Math.max(9, p + w + rng.int(3, 5)));
    return { L, M, w, p };
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { L: 7, M: 4, w: 1, p: 1 },
      { L: 7, M: 4, w: 1, p: 5 },
      { L: 12, M: 8, w: 1, p: 1 },
      { L: 12, M: 8, w: 4, p: 1 },
      { L: 12, M: 8, w: 4, p: 7 },
      { L: 10, M: 6, w: 2, p: 3 },
      { L: 8, M: 5, w: 3, p: 2 },
      { L: 11, M: 7, w: 1, p: 6 },
      { L: 9, M: 4, w: 2, p: 1 },
      { L: 10, M: 8, w: 3, p: 4 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dAlong1 = moveWord(transformDir('right', t));
    const dWall1 = condWord(transformDir('up', t));
    const dWall2 = condWord(transformDir('right', t));
    const dAlong2 = moveWord(transformDir('down', t));

    switch (goal.id) {
      case 'under-corner':
        return [
          `Первым циклом «нц пока ${dWall2} свободно» двигаться ${dAlong1} вдоль первой стены до угла.`,
          `Внутри первого цикла с помощью условия «если ${dWall1} стена» закрашивать только клетки у стены, пропуская проход.`,
          `Вторым циклом «нц пока ${dWall2} стена» двигаться ${dAlong2} вдоль второй стены и закрашивать все её клетки.`,
          `Завершить движение при выходе за край второй стены.`,
        ];
      case 'gap-only':
        return [
          `Первым циклом «нц пока ${dWall1} стена» двигаться ${dAlong1} до начала прохода без закрашивания.`,
          `Вторым циклом «нц пока ${dWall1} свободно» двигаться ${dAlong1} и закрашивать только клетки прохода.`,
          `Остановиться при появлении стены ${dWall1} за проходом.`,
        ];
      default:
        return [];
    }
  },
  typicalMistake: (t: TransformId, goal: RobotGoal): string => {
    const dWall1 = condWord(transformDir('up', t));

    switch (goal.id) {
      case 'under-corner':
        return `Закрашивание клеток прохода из-за отсутствия проверки «если ${dWall1} стена» во время движения к углу.`;
      case 'gap-only':
        return 'Продолжение движения и закрашивания до самого угла вместо остановки в конце прохода.';
      default:
        return '';
    }
  },
};

// Семейство 3: fipi-classic
const familyFipiClassic: RobotFamily = {
  id: 'fipi-classic',
  level: 2,
  origin: 'вариант ОГЭ',
  title: 'Угол с двумя проходами (классика ФИПИ)',
  build: (p: FamilyParams): FieldInstance => {
    const L = num(p, 'L');
    const M = num(p, 'M');
    const w1 = num(p, 'w1');
    const p1 = num(p, 'p1');
    const w2 = num(p, 'w2');
    const q2 = num(p, 'q2');
    const walls = new Set<string>();

    for (let x = 0; x < L; x++) {
      if (x < p1 || x >= p1 + w1) {
        addWallAbove(walls, x, 0);
      }
    }

    for (let i = 0; i < M; i++) {
      const y = -i;
      if (i < q2 || i >= q2 + w2) {
        addWallRight(walls, L - 1, y);
      }
    }

    const start = { x: 0, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `L=${L}, M=${M}, w1=${w1}, p1=${p1}, w2=${w2}, q2=${q2}`,
    };
  },
  goals: [
    {
      id: 'under-corner-gaps',
      title: 'Под и внутри стен с проходами',
      statement: fipiClassicUnderCornerGapsStatement,
      hint: fipiClassicUnderCornerGapsHint,
      target: (p: FamilyParams) => {
        const L = num(p, 'L');
        const M = num(p, 'M');
        const w1 = num(p, 'w1');
        const p1 = num(p, 'p1');
        const w2 = num(p, 'w2');
        const q2 = num(p, 'q2');
        const target = new Set<string>();
        for (let x = 0; x < L; x++) {
          if (x < p1 || x >= p1 + w1) {
            target.add(key(x, 0));
          }
        }
        for (let i = 0; i < M; i++) {
          const y = -i;
          if (i < q2 || i >= q2 + w2) {
            target.add(key(L - 1, y));
          }
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    закрасить
    вправо
  кц
  нц пока сверху свободно
    вправо
  кц
  нц пока справа свободно
    закрасить
    вправо
  кц
  нц пока справа стена
    закрасить
    вниз
  кц
  нц пока справа свободно
    вниз
  кц
  нц пока справа стена
    закрасить
    вниз
  кц
кон`,
    },
    {
      id: 'gaps-only',
      title: 'Только два прохода',
      statement: fipiClassicGapsOnlyStatement,
      hint: fipiClassicGapsOnlyHint,
      target: (p: FamilyParams) => {
        const L = num(p, 'L');
        const w1 = num(p, 'w1');
        const p1 = num(p, 'p1');
        const w2 = num(p, 'w2');
        const q2 = num(p, 'q2');
        const target = new Set<string>();
        for (let x = p1; x < p1 + w1; x++) {
          target.add(key(x, 0));
        }
        for (let i = q2; i < q2 + w2; i++) {
          target.add(key(L - 1, -i));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    вправо
  кц
  нц пока сверху свободно
    закрасить
    вправо
  кц
  нц пока справа свободно
    вправо
  кц
  нц пока справа стена
    вниз
  кц
  нц пока справа свободно
    закрасить
    вниз
  кц
кон`,
    },
  ],
  visibleParams: (rng: Rng, goalId?: string): FamilyParams => {
    if (goalId === 'gaps-only') {
      const w1 = rng.int(2, 3);
      const w2 = rng.int(2, 3);
      const p1 = rng.int(2, 3);
      const q2 = rng.int(2, 3);
      const L = p1 + w1 + rng.int(2, 4);
      const M = q2 + w2 + rng.int(2, 4);
      return { L, M, w1, p1, w2, q2 };
    }
    const p1 = 2;
    const w1 = 2;
    const L = 6;
    const q2 = 2;
    const w2 = 2;
    const M = 6;
    return { L, M, w1, p1, w2, q2 };
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { L: 8, M: 6, w1: 1, p1: 1, w2: 1, q2: 1 },
      { L: 8, M: 6, w1: 1, p1: 6, w2: 1, q2: 4 },
      { L: 12, M: 10, w1: 1, p1: 1, w2: 1, q2: 1 },
      { L: 12, M: 10, w1: 4, p1: 1, w2: 3, q2: 1 },
      { L: 12, M: 10, w1: 4, p1: 7, w2: 3, q2: 6 },
      { L: 10, M: 8, w1: 2, p1: 3, w2: 2, q2: 3 },
      { L: 9, M: 7, w1: 1, p1: 4, w2: 2, q2: 2 },
      { L: 11, M: 9, w1: 3, p1: 2, w2: 1, q2: 5 },
      { L: 8, M: 10, w1: 2, p1: 1, w2: 3, q2: 5 },
      { L: 12, M: 6, w1: 3, p1: 5, w2: 1, q2: 1 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dAlong1 = moveWord(transformDir('right', t));
    const dWall1 = condWord(transformDir('up', t));
    const dAlong2 = moveWord(transformDir('down', t));
    const dWall2 = condWord(transformDir('right', t));

    switch (goal.id) {
      case 'under-corner-gaps':
        return [
          `Закрасить первый участок у первой стены циклом «нц пока ${dWall1} стена», двигаясь ${dAlong1}.`,
          `Пройти проход первой стены без закрашивания циклом «нц пока ${dWall1} свободно».`,
          `Закрасить второй участок первой стены до угла циклом «нц пока ${dWall1} стена».`,
          `Повернуть и закрасить участок второй стены до прохода циклом «нц пока ${dWall2} стена», двигаясь ${dAlong2}.`,
          `Пройти второй проход циклом «нц пока ${dWall2} свободно» без закрашивания.`,
          `Закрасить остаток второй стены циклом «нц пока ${dWall2} стена».`,
        ];
      case 'gaps-only':
        return [
          `Дойти до первого прохода циклом «нц пока ${dWall1} стена», двигаясь ${dAlong1}.`,
          `Закрасить клетки первого прохода циклом «нц пока ${dWall1} свободно».`,
          `Дойти до угла циклом «нц пока ${dWall1} стена» и повернуться к второй стене, двигаясь ${dAlong1}.`,
          `Закрасить клетки второго прохода циклом «нц пока ${dWall2} свободно», двигаясь ${dAlong2}.`,
        ];
      default:
        return [];
    }
  },
  typicalMistake: (t: TransformId, goal: RobotGoal): string => {
    const dWall1 = condWord(transformDir('up', t));

    switch (goal.id) {
      case 'under-corner-gaps':
        return `Перепутанные условия в циклах (например, использование «пока ${dWall1} свободно» вместо «пока ${dWall1} стена»), что приводит к пропуску закрашивания или столкновению.`;
      case 'gaps-only':
        return 'Закрашивание участков стен вместо проходов или неверная остановка во втором проходе.';
      default:
        return '';
    }
  },
};

// Семейство 4: stairs
const familyStairs: RobotFamily = {
  id: 'stairs',
  level: 2,
  origin: 'вариант ОГЭ',
  title: 'Лестница (поднимающаяся вправо)',
  build: (p: FamilyParams): FieldInstance => {
    const K = num(p, 'K');
    const walls = new Set<string>();
    let currentX = 0;

    const widthList: number[] = [];
    for (let i = 0; i < K; i++) {
      const w = num(p, `w${i}`, 1);
      widthList.push(w);
      for (let x = currentX; x < currentX + w; x++) {
        addWallBelow(walls, x, i);
      }
      if (i < K - 1) {
        addWallRight(walls, currentX + w - 1, i);
      }
      currentX += w;
    }

    const start = { x: 0, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `K=${K}, widths=[${widthList.join(',')}]`,
    };
  },
  goals: [
    {
      id: 'all-steps',
      title: 'Все клетки на ступенях',
      statement: stairsAllStepsStatement,
      hint: stairsAllStepsHint,
      target: (p: FamilyParams) => {
        const K = num(p, 'K');
        const target = new Set<string>();
        let currentX = 0;
        for (let i = 0; i < K; i++) {
          const w = num(p, `w${i}`, 1);
          for (let x = currentX; x < currentX + w; x++) {
            target.add(key(x, i));
          }
          currentX += w;
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока снизу стена
    закрасить
    если справа свободно то
      вправо
    иначе
      вверх
      вправо
    все
  кц
кон`,
    },
    {
      id: 'step-corners',
      title: 'Крайние клетки ступеней (перед вертикальным уступом)',
      statement: stairsStepCornersStatement,
      hint: stairsStepCornersHint,
      target: (p: FamilyParams) => {
        const K = num(p, 'K');
        const target = new Set<string>();
        let currentX = 0;
        for (let i = 0; i < K; i++) {
          const w = num(p, `w${i}`, 1);
          if (i < K - 1) {
            target.add(key(currentX + w - 1, i));
          }
          currentX += w;
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока снизу стена
    если справа стена то
      закрасить
      вверх
      вправо
    иначе
      вправо
    все
  кц
кон`,
    },
  ],
  visibleParams: (rng: Rng, goalId?: string): FamilyParams => {
    const K = goalId === 'step-corners' ? rng.int(4, 5) : rng.int(3, 4);
    const widths: number[] = [];
    for (let i = 0; i < K; i++) {
      widths.push(rng.int(2, 4));
    }
    if (widths.every((w) => w === widths[0])) {
      widths[widths.length - 1] = widths[0] === 2 ? 3 : 2;
    }
    const params: FamilyParams = { K };
    for (let i = 0; i < K; i++) {
      params[`w${i}`] = widths[i];
    }
    return params;
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { K: 4, w0: 1, w1: 1, w2: 1, w3: 1 },
      { K: 4, w0: 3, w1: 3, w2: 3, w3: 3 },
      { K: 2, w0: 2, w1: 2 },
      { K: 6, w0: 1, w1: 2, w2: 1, w3: 3, w4: 2, w5: 1 },
      { K: 4, w0: 1, w1: 3, w2: 1, w3: 3 },
      { K: 4, w0: 1, w1: 3, w2: 2, w3: 3 },
      { K: 4, w0: 3, w1: 2, w2: 3, w3: 1 },
      { K: 5, w0: 2, w1: 1, w2: 3, w3: 1, w4: 2 },
      { K: 3, w0: 3, w1: 1, w2: 2 },
      { K: 5, w0: 1, w1: 1, w2: 2, w3: 3, w4: 1 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dStepWall = condWord(transformDir('down', t));
    const dStepMove = moveWord(transformDir('right', t));
    const dRiserWall = condWord(transformDir('right', t));
    const dRiseAction = riseVerbInfinitive(transformDir('up', t));

    switch (goal.id) {
      case 'all-steps':
        return [
          `Запустить основной цикл «нц пока ${dStepWall} стена» для обхода всех ступеней лестницы.`,
          `На каждом шаге закрашивать текущую клетку ступени.`,
          `С помощью условия «если ${dRiserWall} свободно» делать шаг ${dStepMove} вдоль текущей ступени.`,
          `Если достигнута вертикальная стенка ступени (иначе), ${dRiseAction} и шагнуть ${dStepMove} на следующую ступень.`,
          `Завершить алгоритм при сходе с последней ступени.`,
        ];
      case 'step-corners':
        return [
          `Двигаться по ступеням циклом «нц пока ${dStepWall} стена».`,
          `Проверять наличие вертикальной стенки ступени условием «если ${dRiserWall} стена».`,
          `При достижении вертикального уступа закрасить крайнюю клетку ступени, ${dRiseAction} и шагнуть ${dStepMove} на следующую ступень.`,
          `В остальных клетках просто делать шаг ${dStepMove} без закрашивания.`,
        ];
      default:
        return [];
    }
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    switch (goal.id) {
      case 'all-steps':
        return 'Попытка закрасить вертикальные стенки ступеней или лишний подъём за пределы последней ступени.';
      case 'step-corners':
        return 'Закрашивание всех клеток ступеней вместо только крайних клеток перед вертикальным уступом.';
      default:
        return '';
    }
  },
};

// Семейство 5: room
const familyRoom: RobotFamily = {
  id: 'room',
  level: 2,
  origin: 'вариант ОГЭ',
  title: 'Замкнутая комната (внутренний периметр)',
  build: (p: FamilyParams): FieldInstance => {
    const W = num(p, 'W');
    const H = num(p, 'H');
    const startX = num(p, 'startX');
    const startY = num(p, 'startY');

    const walls = new Set<string>();

    for (let x = 0; x < W; x++) {
      addWallBelow(walls, x, 0);
      addWallAbove(walls, x, H - 1);
    }
    for (let y = 0; y < H; y++) {
      addWallLeft(walls, 0, y);
      addWallRight(walls, W - 1, y);
    }

    const start = { x: startX, y: startY };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `W=${W}, H=${H}, start=(${startX},${startY})`,
    };
  },
  goals: [
    {
      id: 'perimeter',
      title: 'Весь внутренний периметр',
      statement: roomPerimeterStatement,
      hint: roomPerimeterHint,
      target: (p: FamilyParams) => {
        const W = num(p, 'W');
        const H = num(p, 'H');
        const target = new Set<string>();
        for (let x = 0; x < W; x++) {
          for (let y = 0; y < H; y++) {
            if (x === 0 || x === W - 1 || y === 0 || y === H - 1) {
              target.add(key(x, y));
            }
          }
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока слева свободно
    влево
  кц
  нц пока снизу свободно
    вниз
  кц
  нц пока справа свободно
    закрасить
    вправо
  кц
  нц пока сверху свободно
    закрасить
    вверх
  кц
  нц пока слева свободно
    закрасить
    влево
  кц
  нц пока снизу свободно
    закрасить
    вниз
  кц
  закрасить
кон`,
    },
    {
      id: 'corners',
      title: 'Четыре угла комнаты',
      statement: roomCornersStatement,
      hint: roomCornersHint,
      target: (p: FamilyParams) => {
        const W = num(p, 'W');
        const H = num(p, 'H');
        const target = new Set<string>();
        target.add(key(0, 0));
        target.add(key(W - 1, 0));
        target.add(key(W - 1, H - 1));
        target.add(key(0, H - 1));
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока слева свободно
    влево
  кц
  нц пока снизу свободно
    вниз
  кц
  закрасить
  нц пока справа свободно
    вправо
  кц
  закрасить
  нц пока сверху свободно
    вверх
  кц
  закрасить
  нц пока слева свободно
    влево
  кц
  закрасить
кон`,
    },
  ],
  visibleParams: (rng: Rng): FamilyParams => {
    const W = rng.int(4, 6);
    const H = rng.int(4, 5);
    const startX = rng.int(1, W - 2);
    const startY = rng.int(1, H - 2);
    return { W, H, startX, startY };
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { W: 3, H: 3, startX: 1, startY: 1 },
      { W: 10, H: 8, startX: 4, startY: 3 },
      { W: 3, H: 8, startX: 1, startY: 4 },
      { W: 10, H: 3, startX: 5, startY: 1 },
      { W: 6, H: 5, startX: 0, startY: 0 },
      { W: 6, H: 5, startX: 5, startY: 0 },
      { W: 6, H: 5, startX: 0, startY: 4 },
      { W: 6, H: 5, startX: 5, startY: 4 },
      { W: 7, H: 7, startX: 3, startY: 3 },
      { W: 8, H: 6, startX: 0, startY: 2 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dLeft = moveWord(transformDir('left', t));
    const dCondLeft = condWord(transformDir('left', t));
    const dDown = moveWord(transformDir('down', t));
    const dCondDown = condWord(transformDir('down', t));
    const dRight = moveWord(transformDir('right', t));
    const dCondRight = condWord(transformDir('right', t));
    const dUp = moveWord(transformDir('up', t));
    const dCondUp = condWord(transformDir('up', t));

    switch (goal.id) {
      case 'perimeter':
        return [
          `Дойти до исходного угла комнаты двумя циклами: «нц пока ${dCondLeft} свободно» (${dLeft}) и «нц пока ${dCondDown} свободно» (${dDown}).`,
          `Пройти и закрасить первую стенку циклом «нц пока ${dCondRight} свободно», двигаясь ${dRight}.`,
          `Пройти и закрасить вторую стенку циклом «нц пока ${dCondUp} свободно», двигаясь ${dUp}.`,
          `Пройти и закрасить третью стенку циклом «нц пока ${dCondLeft} свободно», двигаясь ${dLeft}.`,
          `Пройти и закрасить четвёртую стенку циклом «нц пока ${dCondDown} свободно», двигаясь ${dDown}.`,
          `Закрасить последнюю (исходную) угловую клетку после завершения полного обхода.`,
        ];
      case 'corners':
        return [
          `Переместиться в первый угол комнаты циклами «нц пока ${dCondLeft} свободно» (${dLeft}) и «нц пока ${dCondDown} свободно» (${dDown}).`,
          `Закрасить первый угол и дойти до второго угла циклом «нц пока ${dCondRight} свободно» (${dRight}).`,
          `Закрасить второй угол и дойти до третьей угловой клетки циклом «нц пока ${dCondUp} свободно» (${dUp}).`,
          `Закрасить третий угол и дойти до четвёртого угла циклом «нц пока ${dCondLeft} свободно» (${dLeft}).`,
          `Закрасить четвёртый угол.`,
        ];
      default:
        return [];
    }
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    switch (goal.id) {
      case 'perimeter':
        return 'Попытка сразу закрашивать периметр без предварительного перехода в угол комнаты или пропуск закрашивания последней клетки.';
      case 'corners':
        return 'Закрашивание промежуточных клеток вдоль стен вместо закрашивания исключительно угловых клеток.';
      default:
        return '';
    }
  },
};

// Семейство: room-gap
const familyRoomGap: RobotFamily = {
  id: 'room-gap',
  level: 3,
  origin: 'синтетическая',
  title: 'Замкнутая комната с проходом в стене',
  build: (p: FamilyParams): FieldInstance => {
    const W = num(p, 'W');
    const H = num(p, 'H');
    const gapStart = num(p, 'gapStart');
    const gapWidth = num(p, 'gapWidth');
    const startX = num(p, 'startX');
    const startY = num(p, 'startY');

    const walls = new Set<string>();

    for (let x = 0; x < W; x++) {
      addWallBelow(walls, x, 0);
    }
    for (let x = 0; x < W; x++) {
      if (x < gapStart || x >= gapStart + gapWidth) {
        addWallAbove(walls, x, H - 1);
      }
    }
    for (let y = 0; y < H; y++) {
      addWallLeft(walls, 0, y);
      addWallRight(walls, W - 1, y);
    }

    const start = { x: startX, y: startY };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);

    return {
      walls,
      start,
      target,
      bounds,
      label: `W=${W}, H=${H}, gap=(${gapStart},w=${gapWidth}), start=(${startX},${startY})`,
    };
  },
  goals: [
    {
      id: 'perimeter-no-gap',
      title: 'Периметр кроме прохода',
      statement: roomGapPerimeterNoGapStatement,
      hint: roomGapPerimeterNoGapHint,
      target: (p: FamilyParams) => {
        const W = num(p, 'W');
        const H = num(p, 'H');
        const gapStart = num(p, 'gapStart');
        const gapWidth = num(p, 'gapWidth');
        const target = new Set<string>();

        for (let x = 0; x < W; x++) {
          for (let y = 0; y < H; y++) {
            if (x === 0 || x === W - 1 || y === 0 || y === H - 1) {
              if (y === H - 1 && x >= gapStart && x < gapStart + gapWidth) {
                continue;
              }
              target.add(key(x, y));
            }
          }
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока слева свободно
    влево
  кц
  нц пока снизу свободно
    вниз
  кц
  нц пока справа свободно
    если снизу стена то
      закрасить
    все
    вправо
  кц
  нц пока сверху свободно
    если справа стена то
      закрасить
    все
    вверх
  кц
  нц пока слева свободно
    если сверху стена то
      закрасить
    все
    влево
  кц
  нц пока снизу свободно
    если слева стена то
      закрасить
    все
    вниз
  кц
  если снизу стена то
    закрасить
  все
кон`,
    },
    {
      id: 'gap-only',
      level: 2,
      title: 'Клетки напротив прохода',
      statement: roomGapGapOnlyStatement,
      hint: roomGapGapOnlyHint,
      target: (p: FamilyParams) => {
        const H = num(p, 'H');
        const gapStart = num(p, 'gapStart');
        const gapWidth = num(p, 'gapWidth');
        const target = new Set<string>();

        for (let x = gapStart; x < gapStart + gapWidth; x++) {
          target.add(key(x, H - 1));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока слева свободно
    влево
  кц
  нц пока снизу свободно
    вниз
  кц
  нц пока справа свободно
    если не снизу стена то
      закрасить
    все
    вправо
  кц
  нц пока сверху свободно
    если не справа стена то
      закрасить
    все
    вверх
  кц
  нц пока слева свободно
    если не сверху стена то
      закрасить
    все
    влево
  кц
  нц пока снизу свободно
    если не слева стена то
      закрасить
    все
    вниз
  кц
  если не снизу стена то
    закрасить
  все
кон`,
    },
  ],
  visibleParams: (rng: Rng): FamilyParams => {
    const W = rng.int(5, 7);
    const H = rng.int(4, 6);
    const gapWidth = 2;
    const gapStart = rng.int(1, W - 1 - gapWidth);
    const startX = rng.int(1, W - 2);
    const startY = rng.int(1, H - 2);
    return { W, H, gapStart, gapWidth, startX, startY };
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { W: 5, H: 4, gapStart: 1, gapWidth: 1, startX: 2, startY: 2 },
      { W: 6, H: 5, gapStart: 4, gapWidth: 1, startX: 1, startY: 1 },
      { W: 8, H: 3, gapStart: 3, gapWidth: 1, startX: 4, startY: 1 },
      { W: 3, H: 8, gapStart: 1, gapWidth: 1, startX: 1, startY: 4 },
      { W: 6, H: 4, gapStart: 1, gapWidth: 2, startX: 3, startY: 1 },
      { W: 4, H: 3, gapStart: 2, gapWidth: 1, startX: 1, startY: 1 },
      { W: 10, H: 8, gapStart: 4, gapWidth: 2, startX: 5, startY: 3 },
      { W: 6, H: 6, gapStart: 2, gapWidth: 1, startX: 0, startY: 0 },
      { W: 7, H: 5, gapStart: 3, gapWidth: 2, startX: 3, startY: 4 },
      { W: 7, H: 6, gapStart: 4, gapWidth: 2, startX: 2, startY: 2 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dStart1 = moveWord(transformDir('left', t));
    const dStart2 = moveWord(transformDir('down', t));
    const isNoGap = goal.id === 'perimeter-no-gap';
    return [
      `Перейти в стартовый угол двумя циклами «нц пока ${condWord(transformDir('left', t))} свободно: ${dStart1}: кц» и «нц пока ${condWord(transformDir('down', t))} свободно: ${dStart2}: кц».`,
      `Пройти вдоль всех 4 стен комнаты последовательными циклами движения до угла.`,
      `Внутри циклов проверять наличие стены сбоку: ${isNoGap ? '«если <сбоку> стена то закрасить все»' : '«если не <сбоку> стена то закрасить все»'}.`,
      `Клетки напротив прохода ${isNoGap ? 'автоматически пропустятся' : 'закрасятся, когда сбоку нет стены'}.`,
    ];
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    if (goal.id === 'perimeter-no-gap') {
      return 'Опора на «пока сбоку стена» в условии цикла — цикл завершается раньше времени при достижении прохода вместо угла.';
    }
    return 'Закрашивание клеток вдоль сплошных стен или преждевременное завершение обхода стены при обнаружении прохода.';
  },
};

// Семейство 6: corridor
const familyCorridor: RobotFamily = {
  id: 'corridor',
  level: 1,
  origin: 'вариант ОГЭ',
  title: 'Коридор из двух параллельных стен',
  build: (p: FamilyParams): FieldInstance => {
    const L = num(p, 'L');
    const walls = new Set<string>();

    for (let x = 0; x < L; x++) {
      addWallAbove(walls, x, 0);
      addWallBelow(walls, x, 0);
    }
    addWallLeft(walls, 0, 0);
    addWallRight(walls, L - 1, 0);

    const start = { x: 0, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `L=${L}`,
    };
  },
  goals: [
    {
      id: 'all',
      title: 'Все клетки коридора',
      statement: corridorAllStatement,
      hint: corridorAllHint,
      target: (p: FamilyParams) => {
        const target = new Set<string>();
        const L = num(p, 'L');
        for (let x = 0; x < L; x++) {
          target.add(key(x, 0));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока справа свободно
    закрасить
    вправо
  кц
  закрасить
кон`,
    },
    {
      id: 'ends',
      title: 'Первая и последняя клетки коридора',
      statement: corridorEndsStatement,
      hint: corridorEndsHint,
      target: (p: FamilyParams) => {
        const target = new Set<string>();
        const L = num(p, 'L');
        target.add(key(0, 0));
        target.add(key(L - 1, 0));
        return target;
      },
      reference: `использовать Робот
алг
нач
  закрасить
  нц пока справа свободно
    вправо
  кц
  закрасить
кон`,
    },
  ],
  visibleParams: (rng: Rng): FamilyParams => {
    return { L: rng.int(6, 8) };
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { L: 5 },
      { L: 6 },
      { L: 7 },
      { L: 8 },
      { L: 9 },
      { L: 10 },
      { L: 11 },
      { L: 12 },
      { L: 13 },
      { L: 14 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dAlong = moveWord(transformDir('right', t));
    const dBlocked = condWord(transformDir('right', t));
    if (goal.id === 'ends') {
      return [
        `Закрасить текущую (первую) клетку коридора.`,
        `Циклом «нц пока ${dBlocked} свободно» перемещаться ${dAlong} без закрашивания до противоположной стены.`,
        `Закрасить последнюю клетку коридора перед стеной.`,
      ];
    }
    return [
      `Запустить цикл «нц пока ${dBlocked} свободно» для движения ${dAlong} вдоль коридора.`,
      `Внутри цикла закрашивать текущую клетку и делать шаг ${dAlong}.`,
      `Завершить цикл при достижении стены и закрасить последнюю клетку коридора.`,
    ];
  },
  typicalMistake: (t: TransformId, goal: RobotGoal): string => {
    const dBlocked = condWord(transformDir('right', t));
    if (goal.id === 'ends') {
      return 'Закрашивание промежуточных клеток коридора или попытка сделать лишний шаг после выхода из цикла.';
    }
    return `Забыть закрасить последнюю клетку коридора после выхода из цикла «пока ${dBlocked} свободно».`;
  },
};

// Семейство corridor-mid
const familyCorridorMid: RobotFamily = {
  id: 'corridor-mid',
  level: 2,
  origin: 'вариант ОГЭ',
  title: 'Коридор из двух параллельных стен (старт внутри)',
  build: (p: FamilyParams): FieldInstance => {
    const L = num(p, 'L');
    const startX = num(p, 'startX');
    const walls = new Set<string>();

    for (let x = 0; x < L; x++) {
      addWallAbove(walls, x, 0);
      addWallBelow(walls, x, 0);
    }
    addWallLeft(walls, 0, 0);
    addWallRight(walls, L - 1, 0);

    const start = { x: startX, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `L=${L}, startX=${startX}`,
    };
  },
  goals: [
    {
      id: 'both-ends',
      title: 'Первая и последняя клетки коридора',
      statement: corridorMidBothEndsStatement,
      hint: corridorMidBothEndsHint,
      target: (p: FamilyParams) => {
        const target = new Set<string>();
        const L = num(p, 'L');
        target.add(key(0, 0));
        target.add(key(L - 1, 0));
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока слева свободно
    влево
  кц
  закрасить
  нц пока справа свободно
    вправо
  кц
  закрасить
кон`,
    },
    {
      id: 'all-from-mid',
      title: 'Все клетки коридора',
      statement: corridorMidAllFromMidStatement,
      hint: corridorMidAllFromMidHint,
      target: (p: FamilyParams) => {
        const target = new Set<string>();
        const L = num(p, 'L');
        for (let x = 0; x < L; x++) {
          target.add(key(x, 0));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока слева свободно
    влево
  кц
  нц пока справа свободно
    закрасить
    вправо
  кц
  закрасить
кон`,
    },
  ],
  visibleParams: (rng: Rng): FamilyParams => {
    const L = rng.int(8, 10);
    const startX = rng.int(2, L - 3);
    return { L, startX };
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { L: 7, startX: 2 },
      { L: 8, startX: 3 },
      { L: 9, startX: 2 },
      { L: 10, startX: 4 },
      { L: 11, startX: 3 },
      { L: 12, startX: 5 },
      { L: 10, startX: 2 },
      { L: 11, startX: 4 },
      { L: 12, startX: 3 },
      { L: 13, startX: 5 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dLeft = moveWord(transformDir('left', t));
    const dLeftCond = condWord(transformDir('left', t));
    const dRight = moveWord(transformDir('right', t));
    const dRightCond = condWord(transformDir('right', t));

    if (goal.id === 'both-ends') {
      return [
        `Циклом «нц пока ${dLeftCond} свободно» дойти ${dLeft} до стены на ближнем конце коридора.`,
        `Закрасить первую крайнюю клетку.`,
        `Циклом «нц пока ${dRightCond} свободно» пройти через весь коридор ${dRight} до противоположной стены.`,
        `Закрасить вторую крайнюю клетку.`,
      ];
    }
    return [
      `Циклом «нц пока ${dLeftCond} свободно» пройдите ${dLeft} до стены у одного конца коридора без закрашивания.`,
      `Запустите второй цикл «нц пока ${dRightCond} свободно», двигаясь ${dRight} к противоположному концу.`,
      `Внутри второго цикла закрашивайте текущую клетку и делайте шаг ${dRight}.`,
      `Закрасьте последнюю клетку перед стеной у противоположного конца.`,
    ];
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    if (goal.id === 'both-ends') {
      return 'Закрашивание стартовой или промежуточных клеток вместо движения до торцов, либо закрашивание только одного конца.';
    }
    return 'Попытка закрашивать клетки в первом цикле движения к первому концу, из-за чего часть клеток остаётся пропущенной при развороте, либо забытая последняя клетка у второго торца.';
  },
};

// Семейство 7: multi-gap-wall
const familyMultiGapWall: RobotFamily = {
  id: 'multi-gap-wall',
  level: 3,
  origin: 'синтетическая',
  title: 'Стена с несколькими проходами',
  build: (p: FamilyParams): FieldInstance => {
    const L = num(p, 'L');
    const gaps = gapsOf(p);
    const isGap = new Array(L).fill(false);
    for (const g of gaps) {
      if (g.start <= 0 || g.start + g.width >= L) {
        throw new Error(`Gap [${g.start}, ${g.start + g.width}) touches wall end for L=${L}`);
      }
      for (let x = g.start; x < g.start + g.width; x++) {
        if (x < L) isGap[x] = true;
      }
    }

    const walls = new Set<string>();
    for (let x = 0; x < L; x++) {
      if (!isGap[x]) {
        addWallAbove(walls, x, 0);
      }
    }

    // Vertical wall limiter at right end (x = L - 1, extending up y = 0, 1, 2)
    addWallRight(walls, L - 1, 0);
    addWallRight(walls, L - 1, 1);
    addWallRight(walls, L - 1, 2);

    const start = { x: 0, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `L=${L}, gaps=${gaps.length}`,
    };
  },
  goals: [
    {
      id: 'under-gaps',
      title: 'Клетки под проходами',
      statement: multiGapWallUnderGapsStatement,
      hint: multiGapWallUnderGapsHint,
      target: (p: FamilyParams) => {
        const target = new Set<string>();
        const gaps = gapsOf(p);
        for (const g of gaps) {
          for (let x = g.start; x < g.start + g.width; x++) {
            target.add(key(x, 0));
          }
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока справа свободно
    если не сверху стена то
      закрасить
    все
    вправо
  кц
кон`,
    },
    {
      id: 'under-wall',
      title: 'Клетки под сплошными участками стены',
      statement: multiGapWallUnderWallStatement,
      hint: multiGapWallUnderWallHint,
      target: (p: FamilyParams) => {
        const target = new Set<string>();
        const L = num(p, 'L');
        const gaps = gapsOf(p);
        const isGap = new Array(L).fill(false);
        for (const g of gaps) {
          for (let x = g.start; x < g.start + g.width; x++) {
            if (x < L) isGap[x] = true;
          }
        }
        for (let x = 0; x < L; x++) {
          if (!isGap[x]) {
            target.add(key(x, 0));
          }
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока справа свободно
    если сверху стена то
      закрасить
    все
    вправо
  кц
  закрасить
кон`,
    },
  ],
  visibleParams: (rng: Rng): FamilyParams => {
    const numGaps = rng.int(2, 3);
    const gaps: GapParam[] = [];
    let currentX = 1 + rng.int(0, 1);
    let hasWidth2 = false;

    for (let i = 0; i < numGaps; i++) {
      const width = rng.int(1, 2);
      if (width === 2) hasWidth2 = true;
      gaps.push({ start: currentX, width });
      currentX += width + 1 + rng.int(0, 1);
    }

    if (!hasWidth2) {
      const idx = rng.int(0, gaps.length - 1);
      gaps[idx].width = 2;
    }

    const lastGap = gaps[gaps.length - 1];
    const L = lastGap.start + lastGap.width + 1 + rng.int(0, 1);
    return { L, gaps };
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { L: 8, gaps: [{ start: 1, width: 1 }, { start: 4, width: 2 }] },
      { L: 9, gaps: [{ start: 1, width: 2 }, { start: 5, width: 1 }] },
      { L: 10, gaps: [{ start: 2, width: 1 }, { start: 5, width: 2 }] },
      { L: 11, gaps: [{ start: 1, width: 1 }, { start: 4, width: 2 }, { start: 8, width: 1 }] },
      { L: 10, gaps: [{ start: 2, width: 2 }, { start: 6, width: 1 }] },
      { L: 12, gaps: [{ start: 1, width: 2 }, { start: 5, width: 2 }, { start: 9, width: 1 }] },
      { L: 11, gaps: [{ start: 2, width: 1 }, { start: 5, width: 2 }, { start: 9, width: 1 }] },
      { L: 8, gaps: [{ start: 1, width: 1 }, { start: 4, width: 2 }] },
      { L: 9, gaps: [{ start: 2, width: 2 }, { start: 6, width: 1 }] },
      { L: 11, gaps: [{ start: 1, width: 1 }, { start: 4, width: 2 }, { start: 8, width: 1 }] },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dAlong = moveWord(transformDir('right', t));
    const dBlocked = condWord(transformDir('right', t));
    const dWallRel = condWord(transformDir('up', t));
    if (goal.id === 'under-gaps') {
      return [
        `Запустить цикл «нц пока ${dBlocked} свободно» для движения ${dAlong} вдоль стены.`,
        `На каждом шаге проверять условие «если не ${dWallRel} стена»: закрашивать клетку под проходом.`,
        `Делать шаг ${dAlong} на каждой итерации.`,
        `Завершить цикл при достижении перпендикулярного ограничителя.`,
      ];
    }
    return [
      `Запустить цикл «нц пока ${dBlocked} свободно» для движения ${dAlong} вдоль стены.`,
      `На каждом шаге проверять условие «если ${dWallRel} стена»: закрашивать клетку под сплошным участком.`,
      `Делать шаг ${dAlong} на каждой итерации.`,
      `После выхода из цикла закрасить последнюю клетку под стеной перед ограничителем.`,
    ];
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    if (goal.id === 'under-gaps') {
      return 'Закрашивание клеток под сплошной стеной вместо проходов или попытка считать проходы фиксированным числом итераций.';
    }
    return 'Забыть закрасить последнюю клетку перед ограничителем после выхода из цикла или закрашивание клеток под проходами.';
  },
};

// Семейство multi-gap-wall-barrier
const familyMultiGapWallBarrier: RobotFamily = {
  id: 'multi-gap-wall-barrier',
  level: 3,
  origin: 'вариант ОГЭ',
  title: 'Стена с несколькими проходами и перегородкой',
  build: (p: FamilyParams): FieldInstance => {
    const L = num(p, 'L');
    const gaps = gapsOf(p);
    const xB = num(p, 'xB');
    const lengthB = num(p, 'lengthB');
    const lengthEnd = num(p, 'lengthEnd', lengthB);

    const isGap = new Array(L).fill(false);
    for (const g of gaps) {
      if (g.start <= 0 || g.start + g.width >= L) {
        throw new Error(`Gap [${g.start}, ${g.start + g.width}) touches wall end for L=${L}`);
      }
      for (let x = g.start; x < g.start + g.width; x++) {
        if (x < L) isGap[x] = true;
      }
    }

    if (isGap[xB - 1] || isGap[xB]) {
      throw new Error(`Barrier at xB=${xB} touches a gap at xB-1 or xB`);
    }

    const walls = new Set<string>();
    for (let x = 0; x < L; x++) {
      if (!isGap[x]) {
        addWallAbove(walls, x, 0);
      }
    }

    // Vertical barrier at xB (between xB - 1 and xB) extending DOWN lengthB cells
    for (let y = 0; y > -lengthB; y--) {
      addWallRight(walls, xB - 1, y);
    }

    // Vertical end wall at right end (between L - 1 and L)
    for (let y = 2; y >= -lengthEnd + 1; y--) {
      addWallRight(walls, L - 1, y);
    }

    const start = { x: 0, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);
    return {
      walls,
      start,
      target,
      bounds,
      label: `L=${L}, xB=${xB}, lenB=${lengthB}, lenEnd=${lengthEnd}`,
    };
  },
  goals: [
    {
      id: 'under-gaps',
      title: 'Клетки под проходами',
      statement: multiGapWallBarrierUnderGapsStatement,
      hint: multiGapWallBarrierUnderGapsHint,
      target: (p: FamilyParams) => {
        const target = new Set<string>();
        const gaps = gapsOf(p);
        for (const g of gaps) {
          for (let x = g.start; x < g.start + g.width; x++) {
            target.add(key(x, 0));
          }
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    нц пока справа свободно
      если не сверху стена то
        закрасить
      все
      вправо
    кц
    нц пока справа стена
      вниз
    кц
    вправо
    вверх
    нц пока сверху свободно и слева стена
      вверх
    кц
  кц
кон`,
    },
    {
      id: 'under-wall',
      title: 'Клетки под сплошными участками стены',
      statement: multiGapWallBarrierUnderWallStatement,
      hint: multiGapWallBarrierUnderWallHint,
      target: (p: FamilyParams) => {
        const target = new Set<string>();
        const L = num(p, 'L');
        const gaps = gapsOf(p);
        const isGap = new Array(L).fill(false);
        for (const g of gaps) {
          for (let x = g.start; x < g.start + g.width; x++) {
            if (x < L) isGap[x] = true;
          }
        }
        for (let x = 0; x < L; x++) {
          if (!isGap[x]) {
            target.add(key(x, 0));
          }
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока сверху стена
    нц пока справа свободно
      если сверху стена то
        закрасить
      все
      вправо
    кц
    если сверху стена то
      закрасить
    все
    нц пока справа стена
      вниз
    кц
    вправо
    вверх
    нц пока сверху свободно и слева стена
      вверх
    кц
  кц
кон`,
    },
  ],
  visibleParams: (rng: Rng): FamilyParams => {
    while (true) {
      const L = rng.int(10, 14);
      const numGaps = rng.int(2, 3);
      const gaps: GapParam[] = [];
      let curX = 1;
      for (let i = 0; i < numGaps; i++) {
        const width = rng.int(1, 2);
        if (curX + width >= L - 2) break;
        gaps.push({ start: curX, width });
        curX += width + rng.int(2, 3);
      }
      if (gaps.length < 2) continue;
      const lastGap = gaps[gaps.length - 1];
      if (lastGap.start + lastGap.width >= L - 1) continue;

      const isGap = new Array(L).fill(false);
      for (const g of gaps) {
        for (let x = g.start; x < g.start + g.width; x++) {
          if (x < L) isGap[x] = true;
        }
      }

      const candidates: number[] = [];
      for (let x = 2; x < L - 2; x++) {
        if (!isGap[x - 1] && !isGap[x]) {
          candidates.push(x);
        }
      }
      if (candidates.length === 0) continue;
      const xB = candidates[rng.int(0, candidates.length - 1)];
      const lengthB = rng.int(2, 3);
      const lengthEnd = lengthB + rng.int(0, 1);
      return { L, gaps, xB, lengthB, lengthEnd };
    }
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { L: 10, gaps: [{ start: 1, width: 1 }, { start: 6, width: 2 }], xB: 4, lengthB: 2, lengthEnd: 3 },
      { L: 12, gaps: [{ start: 2, width: 2 }, { start: 8, width: 1 }], xB: 5, lengthB: 3, lengthEnd: 3 },
      { L: 14, gaps: [{ start: 1, width: 1 }, { start: 5, width: 2 }, { start: 10, width: 2 }], xB: 8, lengthB: 2, lengthEnd: 4 },
      { L: 11, gaps: [{ start: 2, width: 1 }, { start: 7, width: 2 }], xB: 4, lengthB: 3, lengthEnd: 4 },
      { L: 13, gaps: [{ start: 1, width: 2 }, { start: 8, width: 2 }], xB: 5, lengthB: 2, lengthEnd: 3 },
      { L: 15, gaps: [{ start: 2, width: 2 }, { start: 6, width: 1 }, { start: 11, width: 2 }], xB: 9, lengthB: 3, lengthEnd: 3 },
      { L: 12, gaps: [{ start: 1, width: 1 }, { start: 6, width: 2 }], xB: 3, lengthB: 2, lengthEnd: 4 },
      { L: 10, gaps: [{ start: 2, width: 1 }, { start: 7, width: 1 }], xB: 5, lengthB: 3, lengthEnd: 3 },
      { L: 14, gaps: [{ start: 1, width: 2 }, { start: 6, width: 2 }, { start: 11, width: 1 }], xB: 4, lengthB: 2, lengthEnd: 4 },
      { L: 13, gaps: [{ start: 2, width: 1 }, { start: 8, width: 2 }], xB: 5, lengthB: 3, lengthEnd: 4 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dAlong = moveWord(transformDir('right', t));
    const dBlocked = condWord(transformDir('right', t));
    const dWallRel = condWord(transformDir('up', t));
    const dDown = moveWord(transformDir('down', t));
    const dUp = moveWord(transformDir('up', t));
    const dUpRel = condWord(transformDir('up', t));
    const dLeftRel = condWord(transformDir('left', t));

    if (goal.id === 'under-gaps') {
      return [
        `Запустить внешний цикл «нц пока ${dWallRel} стена» для движения вдоль всей горизонтальной стены.`,
        `Внутренним циклом «нц пока ${dBlocked} свободно» двигаться ${dAlong}, закрашивая клетки под проходами (условие «если не ${dWallRel} стена»).`,
        `При остановке у перегородки или ограничителя обойти её: циклом «пока ${dBlocked} стена» двигаться ${dDown}, сделать шаг ${dAlong}, двигаться ${dUp} и циклом «пока ${dUpRel} свободно и ${dLeftRel} стена» двигаться к стене.`,
        `Внешний цикл завершится на дальнем конце, так как за торцевым ограничителем стены нет.`,
      ];
    }
    return [
      `Запустить внешний цикл «нц пока ${dWallRel} стена» для движения вдоль всей горизонтальной стены.`,
      `Внутренним циклом «нц пока ${dBlocked} свободно» двигаться ${dAlong}, закрашивая клетки под сплошной стеной (условие «если ${dWallRel} стена»).`,
      `Закрасить последнюю клетку перед перегородкой или ограничителем (условие «если ${dWallRel} стена»).`,
      `Обойти перегородку: циклом «пока ${dBlocked} стена» двигаться ${dDown}, сделать шаг ${dAlong}, двигаться ${dUp} и циклом «пока ${dUpRel} свободно и ${dLeftRel} стена» двигаться к стене.`,
    ];
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    if (goal.id === 'under-gaps') {
      return 'Закрашивание клеток под сплошной стеной или попытка пройти сквозь вертикальную перегородку без её обхода.';
    }
    return 'Забытая последняя клетка перед перегородкой или пропуск закрашивания после её обхода.';
  },
};

// Семейство snake-wall
export interface SnakeSegment {
  dir: Dir;
  paintSide: Dir;
}

export const SNAKE_SEGMENTS: readonly SnakeSegment[] = [
  { dir: 'right', paintSide: 'up' },
  { dir: 'down', paintSide: 'left' },
  { dir: 'left', paintSide: 'up' },
  { dir: 'down', paintSide: 'right' },
  { dir: 'right', paintSide: 'up' },
];

const familySnakeWall: RobotFamily = {
  id: 'snake-wall',
  level: 2,
  origin: 'вариант ОГЭ',
  title: 'Змейка из пяти отрезков стены',
  shapeFromFigure: true,
  build: (p: FamilyParams): FieldInstance => {
    const a1 = num(p, 'a1');
    const a2 = num(p, 'a2');
    const a3 = num(p, 'a3');
    const a4 = num(p, 'a4');
    const a5 = num(p, 'a5');

    const walls = new Set<string>();

    // Segment 1 wall: below row 0, x = 0..a1-1 (a1 segments)
    for (let x = 0; x < a1; x++) {
      addWallBelow(walls, x, 0);
    }

    // Segment 2 wall: right of col a1, y = 0 down to -a2+1 (a2 segments)
    for (let y = 0; y > -a2; y--) {
      addWallRight(walls, a1, y);
    }

    // Segment 3 wall: below row -a2, x = a1-a3+1..a1 (a3 segments)
    for (let x = a1 - a3 + 1; x <= a1; x++) {
      addWallBelow(walls, x, -a2);
    }

    // Segment 4 wall: left of col a1-a3, y = -a2 down to -a2-a4+1 (a4 segments)
    for (let y = -a2; y > -a2 - a4; y--) {
      addWallLeft(walls, a1 - a3, y);
    }

    // Segment 5 wall: below row -a2-a4, x = a1-a3..a1-a3+a5-1 (a5 segments)
    for (let x = a1 - a3; x < a1 - a3 + a5; x++) {
      addWallBelow(walls, x, -a2 - a4);
    }

    const start = { x: 0, y: 0 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);

    return {
      walls,
      start,
      target,
      bounds,
      label: `a1=${a1}, a2=${a2}, a3=${a3}, a4=${a4}, a5=${a5}`,
    };
  },
  goals: [
    {
      id: 'marked-sides',
      title: 'Закрасить клетки у 1, 2, 4 и 5 отрезков',
      statement: snakeWallMarkedSidesStatement,
      hint: snakeWallMarkedSidesHint,
      target: (p: FamilyParams) => {
        const a1 = num(p, 'a1');
        const a2 = num(p, 'a2');
        const a3 = num(p, 'a3');
        const a4 = num(p, 'a4');
        const a5 = num(p, 'a5');
        const target = new Set<string>();

        // Segment 1 cells
        for (let x = 0; x < a1; x++) {
          target.add(key(x, 0));
        }
        // Segment 2 cells
        for (let y = 0; y > -a2; y--) {
          target.add(key(a1, y));
        }
        // Segment 4 cells
        for (let y = -a2; y > -a2 - a4; y--) {
          target.add(key(a1 - a3, y));
        }
        // Segment 5 cells
        for (let x = a1 - a3; x < a1 - a3 + a5; x++) {
          target.add(key(x, -a2 - a4));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока снизу стена
    закрасить
    вправо
  кц
  нц пока справа стена
    закрасить
    вниз
  кц
  нц пока снизу стена
    влево
  кц
  нц пока слева стена
    закрасить
    вниз
  кц
  нц пока снизу стена
    закрасить
    вправо
  кц
кон`,
    },
    {
      id: 'all-sides',
      title: 'Закрасить клетки вдоль всех пяти отрезков',
      statement: snakeWallAllSidesStatement,
      hint: snakeWallAllSidesHint,
      target: (p: FamilyParams) => {
        const a1 = num(p, 'a1');
        const a2 = num(p, 'a2');
        const a3 = num(p, 'a3');
        const a4 = num(p, 'a4');
        const a5 = num(p, 'a5');
        const target = new Set<string>();

        // Segment 1 cells
        for (let x = 0; x < a1; x++) {
          target.add(key(x, 0));
        }
        // Segment 2 cells
        for (let y = 0; y > -a2; y--) {
          target.add(key(a1, y));
        }
        // Segment 3 cells
        for (let x = a1; x >= a1 - a3 + 1; x--) {
          target.add(key(x, -a2));
        }
        // Segment 4 cells
        for (let y = -a2; y > -a2 - a4; y--) {
          target.add(key(a1 - a3, y));
        }
        // Segment 5 cells
        for (let x = a1 - a3; x < a1 - a3 + a5; x++) {
          target.add(key(x, -a2 - a4));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока снизу стена
    закрасить
    вправо
  кц
  нц пока справа стена
    закрасить
    вниз
  кц
  нц пока снизу стена
    закрасить
    влево
  кц
  нц пока слева стена
    закрасить
    вниз
  кц
  нц пока снизу стена
    закрасить
    вправо
  кц
кон`,
    },
  ],
  visibleParams: (rng: Rng): FamilyParams => {
    while (true) {
      const a1 = rng.int(2, 4);
      const a2 = rng.int(2, 4);
      const a3 = rng.int(2, 4);
      const a4 = rng.int(2, 4);
      const a5 = rng.int(2, 4);
      const minX = Math.min(0, a1 - a3);
      const maxX = Math.max(a1, a1 - a3 + a5);
      const width = maxX - minX;
      const height = a2 + a4;
      if (width <= 6 && height <= 6) {
        return { a1, a2, a3, a4, a5 };
      }
    }
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { a1: 2, a2: 2, a3: 2, a4: 2, a5: 2 },
      { a1: 3, a2: 3, a3: 3, a4: 3, a5: 3 },
      { a1: 4, a2: 4, a3: 4, a4: 4, a5: 4 },
      { a1: 5, a2: 5, a3: 5, a4: 5, a5: 5 },
      { a1: 2, a2: 4, a3: 2, a4: 5, a5: 3 },
      { a1: 5, a2: 2, a3: 4, a4: 2, a5: 5 },
      { a1: 2, a2: 2, a3: 3, a4: 5, a5: 5 },
      { a1: 5, a2: 4, a3: 3, a4: 2, a5: 2 },
      { a1: 3, a2: 5, a3: 2, a4: 4, a5: 2 },
      { a1: 4, a2: 2, a3: 5, a4: 3, a5: 4 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const d1 = moveWord(transformDir('right', t));
    const w1 = condWord(transformDir('down', t));

    const d2 = moveWord(transformDir('down', t));
    const w2 = condWord(transformDir('right', t));

    const d3 = moveWord(transformDir('left', t));
    const w3 = condWord(transformDir('down', t));

    const d4 = moveWord(transformDir('down', t));
    const w4 = condWord(transformDir('left', t));

    const d5 = moveWord(transformDir('right', t));
    const w5 = condWord(transformDir('down', t));

    const isMarked = goal.id === 'marked-sides';

    return [
      `Пройти циклом вдоль 1-го отрезка (${d1}), закрашивая клетки, пока есть стена ${w1}.`,
      `Повернуть и пройти циклом вдоль 2-го отрезка (${d2}), закрашивая клетки, пока есть стена ${w2}.`,
      `Повернуть и пройти циклом вдоль 3-го отрезка (${d3}), ${isMarked ? 'БЕЗ закрашивания' : 'закрашивая'} клеток, пока есть стена ${w3}.`,
      `Повернуть и пройти циклом вдоль 4-го отрезка (${d4}), закрашивая клетки, пока есть стена ${w4}.`,
      `Повернуть и пройти циклом вдоль 5-го отрезка (${d5}), закрашивая клетки, пока есть стена ${w5}.`,
    ];
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    if (goal.id === 'marked-sides') {
      return 'Закрашивание клеток вдоль 3-го отрезка, застревание на углах или пропуск закрашивания клеток на стыках отрезков.';
    }
    return 'Пропуск закрашивания одного из отрезков или застревание на угловых стыках при смене направления.';
  },
};

// Семейство 12: stairs-turn
const familyStairsTurn: RobotFamily = {
  id: 'stairs-turn',
  level: 2,
  origin: 'вариант ОГЭ',
  title: 'Лестница с поворотом (спуск и подъём)',
  build: (p: FamilyParams): FieldInstance => {
    const K1 = num(p, 'K1');
    const K2 = num(p, 'K2');
    const walls = new Set<string>();

    for (let i = 0; i < K1; i++) {
      const y = K1 - i;
      addWallBelow(walls, i, y);
      if (i > 0) {
        addWallLeft(walls, i, y);
      }
    }

    addWallBelow(walls, K1, 0);
    addWallLeft(walls, K1, 0);

    for (let j = 1; j <= K2; j++) {
      const x = K1 + j;
      const y = j;
      addWallBelow(walls, x, y);
      addWallLeft(walls, x, y - 1);
    }

    const endX = K1 + K2;
    const endY = K2;
    addWallRight(walls, endX, endY);

    const start = { x: 0, y: K1 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);

    return {
      walls,
      start,
      target,
      bounds,
      label: `K1=${K1}, K2=${K2}`,
    };
  },
  goals: [
    {
      id: 'all-steps',
      title: 'Все клетки на ступенях',
      statement: stairsTurnAllStepsStatement,
      hint: stairsTurnAllStepsHint,
      target: (p: FamilyParams) => {
        const K1 = num(p, 'K1');
        const K2 = num(p, 'K2');
        const target = new Set<string>();
        for (let i = 0; i <= K1; i++) {
          target.add(key(i, K1 - i));
        }
        for (let j = 1; j <= K2; j++) {
          target.add(key(K1 + j, j));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока справа свободно
    закрасить
    вправо
    вниз
  кц
  нц пока снизу стена
    закрасить
    если справа стена то
      вверх
    все
    если справа свободно то
      вправо
    все
  кц
кон`,
    },
    {
      id: 'ascent-only',
      title: 'Клетки на ступенях подъёма',
      statement: stairsTurnAscentOnlyStatement,
      hint: stairsTurnAscentOnlyHint,
      target: (p: FamilyParams) => {
        const K1 = num(p, 'K1');
        const K2 = num(p, 'K2');
        const target = new Set<string>();
        target.add(key(K1, 0));
        for (let j = 1; j <= K2; j++) {
          target.add(key(K1 + j, j));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока справа свободно
    вправо
    вниз
  кц
  нц пока снизу стена
    закрасить
    если справа стена то
      вверх
    все
    если справа свободно то
      вправо
    все
  кц
кон`,
    },
  ],
  visibleParams: (rng: Rng): FamilyParams => {
    const K1 = rng.int(3, 4);
    const K2 = rng.int(3, 4);
    return { K1, K2 };
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { K1: 1, K2: 1 },
      { K1: 5, K2: 2 },
      { K1: 2, K2: 5 },
      { K1: 4, K2: 4 },
      { K1: 3, K2: 3 },
      { K1: 1, K2: 4 },
      { K1: 4, K2: 1 },
      { K1: 2, K2: 2 },
      { K1: 5, K2: 5 },
      { K1: 3, K2: 4 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dAlong1 = moveWord(transformDir('right', t));
    const dDown1 = moveWord(transformDir('down', t));
    const dCheck1 = condWord(transformDir('right', t));
    const dWall2 = condWord(transformDir('down', t));
    const dRiser2 = condWord(transformDir('right', t));
    const dUp2 = moveWord(transformDir('up', t));
    const dAlong2 = moveWord(transformDir('right', t));

    if (goal.id === 'ascent-only') {
      return [
        `Спускаться по ступеням спуска циклом «нц пока ${dCheck1} свободно», делая шаги ${dAlong1} и ${dDown1} без закрашивания.`,
        `От нижней площадки пройти по ступеням подъёма циклом «нц пока ${dWall2} стена», закрашивая клетки каждой ступени.`,
      ];
    }

    return [
      `Первым циклом «нц пока ${dCheck1} свободно» двигаться по ступеням, закрашивая каждую клетку и делая шаги ${dAlong1} и ${dDown1}.`,
      `При выходе на площадку запустить второй цикл «нц пока ${dWall2} стена».`,
      `Закрашивать текущую клетку ступени.`,
      `Условием «если ${dRiser2} стена» двигаться ${dUp2} на уступе, а затем шагать ${dAlong2}.`,
      `Завершить алгоритм при сходе с верхней ступени.`,
    ];
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    if (goal.id === 'ascent-only') {
      return 'Закрашивание клеток на ступенях спуска или запуск подъёма до достижения площадки.';
    }
    return 'Застревание в месте смены спуска на подъём или попытка сделать лишний шаг после последней ступени.';
  },
};

interface StairsVarGeometry {
  descent: { x: number; y: number }[];
  platform: { x: number; y: number };
  ascent: { x: number; y: number }[];
  hd: number[];
  ha: number[];
  totalDescent: number;
}

function stairsTurnVarGeometry(p: FamilyParams): StairsVarGeometry {
  const K1 = num(p, 'K1');
  const K2 = num(p, 'K2');
  const hd: number[] = [];
  const ha: number[] = [];
  let totalDescent = 0;
  for (let i = 0; i < K1; i++) {
    const h = num(p, `hd${i}`, 1);
    hd.push(h);
    totalDescent += h;
  }
  for (let j = 0; j < K2; j++) {
    ha.push(num(p, `ha${j}`, 1));
  }

  const descent: { x: number; y: number }[] = [];
  let currentY = totalDescent;
  for (let i = 0; i < K1; i++) {
    currentY -= hd[i];
    descent.push({ x: i, y: currentY });
  }

  const platform = { x: K1, y: 0 };

  const ascent: { x: number; y: number }[] = [];
  currentY = 0;
  for (let j = 0; j < K2; j++) {
    currentY += ha[j];
    ascent.push({ x: K1 + 1 + j, y: currentY });
  }

  return { descent, platform, ascent, hd, ha, totalDescent };
}

// Семейство 13: stairs-turn-var
const familyStairsTurnVar: RobotFamily = {
  id: 'stairs-turn-var',
  level: 3,
  origin: 'синтетическая',
  title: 'Лестница с поворотом (переменная высота)',
  build: (p: FamilyParams): FieldInstance => {
    const geom = stairsTurnVarGeometry(p);
    const K1 = geom.descent.length;
    const K2 = geom.ascent.length;
    const walls = new Set<string>();

    let currentY = geom.totalDescent;

    for (let i = 0; i < K1; i++) {
      const h = geom.hd[i];
      const x = i;
      if (i > 0) {
        for (let y = currentY - h; y < currentY; y++) {
          addWallLeft(walls, x, y);
        }
      }
      currentY -= h;
      addWallBelow(walls, x, currentY);
    }

    addWallBelow(walls, K1, 0);

    currentY = 0;
    for (let j = 0; j < K2; j++) {
      const h = geom.ha[j];
      const x = K1 + 1 + j;
      for (let k = 0; k < h; k++) {
        const y = currentY + k;
        addWallLeft(walls, x, y);
      }
      currentY += h;
      addWallBelow(walls, x, currentY);
    }

    const endX = K1 + K2;
    addWallRight(walls, endX, currentY);

    const start = { x: 0, y: geom.descent[0].y };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);

    return {
      walls,
      start,
      target,
      bounds,
      label: `K1=${K1}, K2=${K2}, totalH=${geom.totalDescent}`,
    };
  },
  goals: [
    {
      id: 'all-steps',
      title: 'Опорные клетки всех ступеней',
      statement: stairsTurnVarAllStepsStatement,
      hint: stairsTurnVarAllStepsHint,
      target: (p: FamilyParams) => {
        const geom = stairsTurnVarGeometry(p);
        const target = new Set<string>();
        for (const cell of geom.descent) {
          target.add(key(cell.x, cell.y));
        }
        target.add(key(geom.platform.x, geom.platform.y));
        for (const cell of geom.ascent) {
          target.add(key(cell.x, cell.y));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока справа свободно
    нц пока снизу свободно
      вниз
    кц
    закрасить
    вправо
  кц
  нц пока снизу стена
    закрасить
    нц пока справа стена
      вверх
    кц
    если справа свободно то
      вправо
    все
  кц
кон`,
    },
    {
      id: 'step-corners',
      title: 'Угловые клетки у основания уступов',
      statement: stairsTurnVarStepCornersStatement,
      hint: stairsTurnVarStepCornersHint,
      target: (p: FamilyParams) => {
        const geom = stairsTurnVarGeometry(p);
        const target = new Set<string>();

        for (let i = 1; i < geom.descent.length; i++) {
          target.add(key(geom.descent[i].x, geom.descent[i].y));
        }

        target.add(key(geom.platform.x, geom.platform.y));

        for (let j = 0; j < geom.ascent.length; j++) {
          target.add(key(geom.ascent[j].x, geom.ascent[j].y));
        }

        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока справа свободно
    нц пока снизу свободно
      вниз
    кц
    если слева стена то
      закрасить
    все
    вправо
  кц
  закрасить
  нц пока снизу стена
    нц пока справа стена
      вверх
    кц
    если справа свободно то
      вправо
    все
    если снизу стена и справа стена то
      закрасить
    все
  кц
кон`,
    },
    {
      id: 'ascent-only',
      title: 'Опорные клетки ступеней подъёма',
      statement: stairsTurnVarAscentOnlyStatement,
      hint: stairsTurnVarAscentOnlyHint,
      target: (p: FamilyParams) => {
        const geom = stairsTurnVarGeometry(p);
        const target = new Set<string>();
        target.add(key(geom.platform.x, geom.platform.y));
        for (let j = 0; j < geom.ascent.length; j++) {
          target.add(key(geom.ascent[j].x, geom.ascent[j].y));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока справа свободно
    нц пока снизу свободно
      вниз
    кц
    вправо
  кц
  нц пока снизу стена
    закрасить
    нц пока справа стена
      вверх
    кц
    если справа свободно то
      вправо
    все
  кц
кон`,
    },
  ],
  visibleParams: (rng: Rng): FamilyParams => {
    while (true) {
      const K1 = rng.int(3, 4);
      const K2 = rng.int(3, 4);
      const hd: number[] = [];
      for (let i = 0; i < K1; i++) {
        hd.push(rng.int(1, 2));
      }
      const ha: number[] = [];
      for (let j = 0; j < K2; j++) {
        ha.push(rng.int(1, 2));
      }
      const sumHd = hd.reduce((a, b) => a + b, 0);
      const sumHa = ha.reduce((a, b) => a + b, 0);
      if (sumHd <= 7 && sumHa <= 7) {
        const params: FamilyParams = { K1, K2 };
        for (let i = 0; i < K1; i++) {
          params[`hd${i}`] = hd[i];
        }
        for (let j = 0; j < K2; j++) {
          params[`ha${j}`] = ha[j];
        }
        return params;
      }
    }
  },
  hiddenParams: (_rng: Rng): FamilyParams[] => {
    return [
      { K1: 1, K2: 1, hd0: 1, ha0: 1 },
      { K1: 2, K2: 2, hd0: 1, hd1: 1, ha0: 1, ha1: 1 },
      { K1: 3, K2: 2, hd0: 1, hd1: 2, hd2: 1, ha0: 3, ha1: 1 },
      { K1: 2, K2: 3, hd0: 2, hd1: 1, ha0: 1, ha1: 3, ha2: 2 },
      { K1: 4, K2: 4, hd0: 1, hd1: 1, hd2: 1, hd3: 1, ha0: 1, ha1: 1, ha2: 1, ha3: 1 },
      { K1: 3, K2: 3, hd0: 3, hd1: 2, hd2: 4, ha0: 2, ha1: 3, ha2: 1 },
      { K1: 1, K2: 3, hd0: 1, ha0: 2, ha1: 1, ha2: 3 },
      { K1: 3, K2: 1, hd0: 2, hd1: 1, hd2: 3, ha0: 1 },
      { K1: 4, K2: 2, hd0: 1, hd1: 1, hd2: 2, hd3: 1, ha0: 1, ha1: 1 },
      { K1: 2, K2: 4, hd0: 3, hd1: 3, ha0: 1, ha1: 1, ha2: 1, ha3: 1 },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dAlong1 = moveWord(transformDir('right', t));
    const dDown1 = moveWord(transformDir('down', t));
    const dCheck1 = condWord(transformDir('right', t));
    const dWall2 = condWord(transformDir('down', t));
    const dRiser2 = condWord(transformDir('right', t));
    const dUp2 = moveWord(transformDir('up', t));
    const dAlong2 = moveWord(transformDir('right', t));

    if (goal.id === 'ascent-only') {
      return [
        `Двигаться по ступеням циклом «нц пока ${dCheck1} свободно». На каждой ступени двигаться без закрашивания до дна вложенным циклом «нц пока ${dWall2} свободно» (${dDown1}), затем делать шаг ${dAlong1}.`,
        `От площадки пройти по ступеням подъёма циклом «нц пока ${dWall2} стена», закрашивая опорные клетки каждой ступени.`,
      ];
    }

    return [
      `На этапе спуска двигаться циклом «нц пока ${dCheck1} свободно».`,
      `Вложенным циклом «нц пока ${dWall2} свободно» двигаться ${dDown1} на всю высоту уступа до пола ступени.`,
      `Закрасить клетку ступени и сделать шаг ${dAlong1}.`,
      `На этапе подъёма использовать цикл «нц пока ${dWall2} стена».`,
      `Закрасить клетку и двигаться вложенным циклом «нц пока ${dRiser2} стена» (${dUp2}) на всю высоту уступа.`,
      `Шагнуть ${dAlong2} на следующую ступень.`,
    ];
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    if (goal.id === 'ascent-only') {
      return 'Закрашивание клеток на спуске или ошибка во вложенных циклах при подъёме по уступам.';
    }
    return 'Предположение, что высота уступа всегда равна 1 клетке, приводящее к столкновению при подъёме или пропуску клеток.';
  },
};

// Семейство 14: rect-outside
const familyRectOutside: RobotFamily = {
  id: 'rect-outside',
  level: 2,
  origin: 'вариант ОГЭ',
  title: 'Прямоугольная комната (робот снаружи)',
  build: (p: FamilyParams): FieldInstance => {
    const W = num(p, 'W');
    const H = num(p, 'H');
    const gapStart = num(p, 'p');
    const w = num(p, 'w');
    const topGap = num(p, 'topGap', 1);
    const rightGap = num(p, 'rightGap', 0);
    const walls = new Set<string>();

    // Top wall: above row 0 (x = 0..W-1)
    for (let x = 0; x < W; x++) {
      if (topGap === 0 || x < gapStart || x >= gapStart + w) {
        addWallAbove(walls, x, 0);
      }
    }

    // Right wall: right of col W-1 (y = 0 down to -H+1)
    for (let y = 0; y > -H; y--) {
      const distFromTop = -y;
      if (rightGap === 0 || distFromTop < gapStart || distFromTop >= gapStart + w) {
        addWallRight(walls, W - 1, y);
      }
    }

    // Bottom wall: below row -H+1 (x = 0..W-1)
    for (let x = 0; x < W; x++) {
      addWallBelow(walls, x, -H + 1);
    }

    // Left wall: left of col 0 (y = 0 down to -H+1)
    for (let y = 0; y > -H; y--) {
      addWallLeft(walls, 0, y);
    }

    // Robot starts OUTSIDE top-left corner
    const isOuterCorners = topGap === 0 && rightGap === 0;
    const start = isOuterCorners ? { x: -1, y: 1 } : { x: 0, y: 1 };
    const target = new Set<string>();
    const bounds = computeBounds(walls, target, start);

    return {
      walls,
      start,
      target,
      bounds,
      label: `W=${W}, H=${H}, p=${gapStart}, w=${w}`,
      params: p,
    };
  },
  goals: [
    {
      id: 'around-wall',
      title: 'Вдоль стены снаружи до прохода',
      level: 1,
      statement: rectOutsideAroundWallStatement,
      hint: rectOutsideAroundWallHint,
      target: (p: FamilyParams) => {
        const gapStart = num(p, 'p');
        const target = new Set<string>();
        for (let x = 0; x < gapStart; x++) {
          target.add(key(x, 1));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока снизу стена
    закрасить
    вправо
  кц
кон`,
    },
    {
      id: 'around-corner-to-gap',
      title: 'Огибая угол комнаты до прохода',
      statement: rectOutsideAroundCornerToGapStatement,
      hint: rectOutsideAroundCornerToGapHint,
      target: (p: FamilyParams) => {
        const W = num(p, 'W');
        const gapStart = num(p, 'p');
        const target = new Set<string>();
        for (let x = 0; x <= W; x++) {
          target.add(key(x, 1));
        }
        for (let y = 0; y > -gapStart; y--) {
          target.add(key(W, y));
        }
        return target;
      },
      reference: `использовать Робот
алг
нач
  нц пока снизу стена
    закрасить
    вправо
  кц
  закрасить
  вниз
  нц пока слева стена
    закрасить
    вниз
  кц
кон`,
    },
    {
      id: 'outer-corners',
      title: 'Внешние угловые клетки комнаты',
      statement: rectOutsideOuterCornersStatement,
      hint: rectOutsideOuterCornersHint,
      target: (p: FamilyParams) => {
        const W = num(p, 'W');
        const H = num(p, 'H');
        // Room rectangle in id orientation: x in [0, W-1], y in [-H+1, 0]
        const roomMinX = 0;
        const roomMaxX = W - 1;
        const roomMinY = -H + 1;
        const roomMaxY = 0;
        // 4 outer diagonal corners surrounding the room rectangle
        const corners = [
          { x: roomMinX - 1, y: roomMaxY + 1 }, // (-1, 1) = start
          { x: roomMaxX + 1, y: roomMaxY + 1 }, // (W, 1)
          { x: roomMaxX + 1, y: roomMinY - 1 }, // (W, -H)
          { x: roomMinX - 1, y: roomMinY - 1 }, // (-1, -H)
        ];
        return new Set(corners.map((c) => key(c.x, c.y)));
      },
      reference: `использовать Робот
алг
нач
  закрасить
  вправо
  нц пока снизу стена
    вправо
  кц
  закрасить
  вниз
  нц пока слева стена
    вниз
  кц
  закрасить
  влево
  нц пока сверху стена
    влево
  кц
  закрасить
кон`,
    },
  ],
  visibleParams: (rng: Rng, goalId?: string): FamilyParams => {
    const W = rng.int(6, 8);
    const H = rng.int(4, 6);
    const w = rng.int(2, 3);
    const p = rng.int(2, 4);
    if (goalId === 'around-corner-to-gap') {
      return { W, H, p, w, topGap: 0, rightGap: 1 };
    }
    if (goalId === 'outer-corners') {
      return { W, H, p, w, topGap: 0, rightGap: 0 };
    }
    return { W, H, p, w, topGap: 1, rightGap: 0 };
  },
  hiddenParams: (_rng: Rng, goalId?: string): FamilyParams[] => {
    const isCornerToGap = goalId === 'around-corner-to-gap';
    const isOuterCorners = goalId === 'outer-corners';
    const topGap = isCornerToGap || isOuterCorners ? 0 : 1;
    const rightGap = isCornerToGap ? 1 : 0;

    return [
      { W: 5, H: 4, p: 1, w: 1, topGap, rightGap },
      { W: 8, H: 6, p: 1, w: 3, topGap, rightGap },
      { W: 10, H: 8, p: 6, w: 1, topGap, rightGap },
      { W: 7, H: 5, p: 3, w: 2, topGap, rightGap },
      { W: 9, H: 6, p: 2, w: 4, topGap, rightGap },
      { W: 6, H: 4, p: 4, w: 1, topGap, rightGap },
      { W: 8, H: 5, p: 1, w: 2, topGap, rightGap },
      { W: 10, H: 7, p: 5, w: 3, topGap, rightGap },
      { W: 7, H: 6, p: 2, w: 1, topGap, rightGap },
      { W: 9, H: 5, p: 4, w: 2, topGap, rightGap },
    ];
  },
  solutionSteps: (t: TransformId, goal: RobotGoal): string[] => {
    const dAlong = moveWord(transformDir('right', t));
    const dDown = moveWord(transformDir('down', t));
    const dWall = condWord(transformDir('up', t));
    const dSideWall = condWord(transformDir('left', t));

    if (goal.id === 'around-corner-to-gap') {
      return [
        `Первым циклом «нц пока ${dWall} стена» закрашивать клетки и двигаться ${dAlong} вдоль верхней стены комнаты.`,
        `После прохода верхней стены повернуть и запустить второй цикл «нц пока ${dSideWall} стена» для движения ${dDown} вдоль боковой стены.`,
        `Остановиться при выходе к проходу в боковой стене.`,
      ];
    }

    if (goal.id === 'outer-corners') {
      return [
        `Закрасить первую внешнюю угловую клетку у старта.`,
        `Двигаться ${dAlong} до угла комнаты и закрасить вторую угловую клетку.`,
        `Обогнуть внешние стены комнаты, закрашивая угловые клетки на каждом повороте.`,
      ];
    }

    return [
      `Запустить цикл «нц пока ${dWall} стена» для движения ${dAlong} вдоль внешней стороны стены.`,
      `Внутри цикла закрашивать текущую клетку и делать шаг ${dAlong}.`,
      `Остановиться при выходе к проходу (когда ${dWall} станет свободно).`,
    ];
  },
  typicalMistake: (_t: TransformId, goal: RobotGoal): string => {
    if (goal.id === 'around-corner-to-gap') {
      return 'Забыть повернуть на углу комнаты или проскочить проход в боковой стене.';
    }
    if (goal.id === 'outer-corners') {
      return 'Пропуск одной из угловых клеток или закрашивание лишних промежуточных клеток вдоль стен.';
    }
    return 'Проход за пределы стены или попытка проникнуть внутрь комнаты через проход.';
  },
};

export const ROBOT_FAMILIES: RobotFamily[] = [
  familyHwallGap,
  familyHwallGapMid,
  familyHwallCross,
  familyCornerGap,
  familyFipiClassic,
  familyStairs,
  familyCorridor,
  familyCorridorMid,
  familyRoom,
  familyRoomGap,
  familyMultiGapWall,
  familyMultiGapWallBarrier,
  familySnakeWall,
  familyStairsTurn,
  familyStairsTurnVar,
  familyRectOutside,
];


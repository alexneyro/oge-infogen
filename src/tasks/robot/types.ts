import { TransformId } from './transform';

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Cell {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface FieldInstance {
  walls: Set<string>; // ключи "H:x,y" (стена сверху от x,y) и "V:x,y" (стена справа от x,y)
  start: Cell; // стартовая клетка робота
  target: Set<string>; // клетки "x,y", которые ОБЯЗАНЫ быть закрашены
  bounds: Bounds; // прямоугольник для отрисовки (только стены и целевые клетки)
  label: string; // краткое имя инстанса для отладки
  params?: FamilyParams;
}

export interface GapParam {
  start: number;
  width: number;
}

export interface FamilyParams {
  [k: string]: number | GapParam[] | undefined;
  gaps?: GapParam[];
}

export function num(p: FamilyParams, key: string, fallback?: number): number {
  const val = p[key];
  if (typeof val === 'number') {
    return val;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Expected number parameter '${key}', got ${typeof val}`);
}

export function gapsOf(p: FamilyParams): GapParam[] {
  const val = p.gaps;
  if (!Array.isArray(val)) {
    throw new Error(`Expected GapParam[] for 'gaps', got ${typeof val}`);
  }
  return val;
}

export interface Rng {
  int: (a: number, b: number) => number;
  pick: <T>(arr: T[]) => T;
}

export interface RobotGoal {
  id: string; // латиницей
  title: string; // краткое имя по-русски, для отладки
  level?: 1 | 2 | 3; // опциональный уровень сложности цели (по умолчанию совпадает с семейством)
  statement: (t: TransformId) => string; // ПОЛНЫЙ текст условия для этой пары семейство+цель
  hint: (t: TransformId) => string;
  target: (p: FamilyParams, base: FieldInstance) => Set<string>; // клетки, которые надо закрасить
  reference: string; // эталон в каноничной ориентации
}

export interface RobotFamily {
  id: string; // латиницей, напр. 'hwall-gap'
  level: 1 | 2 | 3;
  origin?: 'вариант ОГЭ' | 'синтетическая';
  title: string; // по-русски
  shapeFromFigure?: boolean;
  goals: RobotGoal[];
  build: (p: FamilyParams) => FieldInstance;
  visibleParams: (rng: Rng, goalId?: string) => FamilyParams; // параметры для показываемого инстанса
  hiddenParams: (rng: Rng, goalId?: string) => FamilyParams[]; // 8-12 краевых наборов
  solutionSteps: (t: TransformId, goal: RobotGoal) => string[];
  typicalMistake: (t: TransformId, goal: RobotGoal) => string;
}

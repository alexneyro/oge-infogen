import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  FileCode,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { RNG } from '../utils/rng';
import { Dir, FieldInstance } from './robot/types';
import { key, ROBOT_FAMILIES } from './robot/field';
import { buildInstances, checkSolution, CheckOutcome } from './robot/checker';
import { runProgram, StepLogEntry } from './robot/interpreter';
import { parseKumir, RobotParseError } from './robot/parser';
import { ALL_TRANSFORMS, TransformId, transformCode, transformInstance } from './robot/transform';
import { useIsDarkTheme } from '../hooks/useIsDarkTheme';
import {
  StatementBlock,
  StatementText,
  SubBlock,
  BlockLabel,
  CodeBlock,
  VerdictBox,
  HintBox,
  DataTable,
  Th,
  Td,
} from '../components/task-ui';

export interface Task15Data {
  familyId: string;
  goalId: string;
  transform: TransformId;
  statement: string;
  hint: string;
  reference: string;
  visible: FieldInstance;
  hidden: FieldInstance[];
  solutionSteps?: string[];
  typicalMistake?: string;
}

interface RobotCanvasPalette {
  bg: string;
  gridCellFill: string;
  gridStroke: string;
  wallStroke: string;
  targetFill: string;
  targetStroke: string;
  paintedFill: string;
  paintedStroke: string;
  missingFill: string;
  missingStroke: string;
  missingHatch: string;
  extraFill: string;
  extraStroke: string;
  robotFill: string;
  robotStroke: string;
  robotText: string;
  crashStroke: string;
}

const ROBOT_THEME_PALETTES: Record<'light' | 'dark', RobotCanvasPalette> = {
  light: {
    bg: '#ffffff',
    gridCellFill: '#ffffff',
    gridStroke: '#d4d4d8',
    wallStroke: '#1e293b',
    targetFill: 'rgba(16, 185, 129, 0.15)',
    targetStroke: 'rgba(16, 185, 129, 0.6)',
    paintedFill: '#dbeafe',
    paintedStroke: '#60a5fa',
    missingFill: 'rgba(245, 158, 11, 0.15)',
    missingStroke: '#f59e0b',
    missingHatch: '#f59e0b',
    extraFill: 'rgba(244, 63, 94, 0.25)',
    extraStroke: '#f43f5e',
    robotFill: '#f59e0b',
    robotStroke: '#78350f',
    robotText: '#1e293b',
    crashStroke: '#ef4444',
  },
  dark: {
    bg: '#0f172a',
    gridCellFill: '#0f172a',
    gridStroke: '#1e293b',
    wallStroke: '#ffffff',
    targetFill: 'rgba(16, 185, 129, 0.2)',
    targetStroke: 'rgba(16, 185, 129, 0.4)',
    paintedFill: '#134e4a',
    paintedStroke: '#14b8a6',
    missingFill: 'rgba(245, 158, 11, 0.15)',
    missingStroke: '#f59e0b',
    missingHatch: '#fbbf24',
    extraFill: 'rgba(244, 63, 94, 0.5)',
    extraStroke: '#fb7185',
    robotFill: '#f59e0b',
    robotStroke: '#78350f',
    robotText: '#0f172a',
    crashStroke: '#f43f5e',
  },
};

const CELL_SIZE = 40;

export interface RobotCanvasProps {
  instance: FieldInstance;
  log?: StepLogEntry[];
  extra?: string[];
  missing?: string[];
  showTarget?: boolean;
  crashDir?: Dir;
  animate?: boolean;
}

export const RobotCanvas: React.FC<RobotCanvasProps> = ({
  instance,
  log,
  extra = [],
  missing = [],
  showTarget = true,
  crashDir,
  animate = true,
}) => {
  const isDark = useIsDarkTheme();
  const themeMode: 'light' | 'dark' = isDark ? 'dark' : 'light';
  const palette = ROBOT_THEME_PALETTES[themeMode];

  const totalSteps = log ? log.length : 0;

  const [stepIdx, setStepIdx] = useState<number>(totalSteps > 0 ? totalSteps - 1 : 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(12); // steps per second

  // Reset state on instance/log/theme change
  useEffect(() => {
    setStepIdx(log && log.length > 0 ? log.length - 1 : 0);
    setIsPlaying(false);
  }, [instance, log, themeMode]);

  // Animation interval effect
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || !log || log.length === 0) {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    const intervalMs = 1000 / speed;
    const batchSize = log.length > 3000 ? Math.ceil(log.length / 500) : 1;

    const tick = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = time - lastTimeRef.current;

      if (delta >= intervalMs) {
        lastTimeRef.current = time;
        setStepIdx((prev) => {
          const next = prev + batchSize;
          if (next >= log.length - 1) {
            setIsPlaying(false);
            return log.length - 1;
          }
          return next;
        });
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      lastTimeRef.current = 0;
    };
  }, [isPlaying, speed, log, themeMode]);

  // Compute bounding box
  const bounds = useMemo(() => {
    const startX = instance?.start?.x;
    const startY = instance?.start?.y;

    if (startX === undefined || startY === undefined) {
      return { minX: -3, maxX: 3, minY: -3, maxY: 3 };
    }

    let minX = startX;
    let maxX = startX;
    let minY = startY;
    let maxY = startY;

    if (instance?.target) {
      for (const tKey of instance.target) {
        const [tx, ty] = tKey.split(',').map(Number);
        if (!isNaN(tx) && !isNaN(ty)) {
          if (tx < minX) minX = tx;
          if (tx > maxX) maxX = tx;
          if (ty < minY) minY = ty;
          if (ty > maxY) maxY = ty;
        }
      }
    }

    if (instance?.walls) {
      for (const wallKey of instance.walls) {
        if (wallKey.startsWith('H:')) {
          const [wx, wy] = wallKey.slice(2).split(',').map(Number);
          if (!isNaN(wx) && !isNaN(wy)) {
            if (wx < minX) minX = wx;
            if (wx > maxX) maxX = wx;
            if (wy < minY) minY = wy;
            if (wy + 1 > maxY) maxY = wy + 1;
          }
        } else if (wallKey.startsWith('V:')) {
          const [wx, wy] = wallKey.slice(2).split(',').map(Number);
          if (!isNaN(wx) && !isNaN(wy)) {
            if (wx < minX) minX = wx;
            if (wx + 1 > maxX) maxX = wx + 1;
            if (wy < minY) minY = wy;
            if (wy > maxY) maxY = wy;
          }
        }
      }
    }

    if (log && log.length > 0) {
      for (const entry of log) {
        if (entry && entry.action === 'paint' && !isNaN(entry.x) && !isNaN(entry.y)) {
          if (entry.x < minX) minX = entry.x;
          if (entry.x > maxX) maxX = entry.x;
          if (entry.y < minY) minY = entry.y;
          if (entry.y > maxY) maxY = entry.y;
        }
      }
    }

    // плюс отступ 1 клетка со всех сторон
    minX = minX - 1;
    maxX = maxX + 1;
    minY = minY - 1;
    maxY = maxY + 1;

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;

    if (width < 7) {
      const diff = 7 - width;
      const leftAdd = Math.floor(diff / 2);
      const rightAdd = diff - leftAdd;
      minX -= leftAdd;
      maxX += rightAdd;
    }

    if (height < 7) {
      const diff = 7 - height;
      const topAdd = Math.floor(diff / 2);
      const bottomAdd = diff - topAdd;
      maxY += topAdd;
      minY -= bottomAdd;
    }

    return {
      minX,
      maxX,
      minY,
      maxY,
    };
  }, [instance, log]);

  const widthCells = bounds.maxX - bounds.minX + 1;
  const heightCells = bounds.maxY - bounds.minY + 1;

  const viewBoxWidth = widthCells * CELL_SIZE;
  const viewBoxHeight = heightCells * CELL_SIZE;

  // Painted cells up to stepIdx
  const paintedAtStep = useMemo(() => {
    const set = new Set<string>();
    if (!log || log.length === 0) return set;
    const limit = Math.min(Math.max(0, stepIdx), log.length - 1);
    for (let i = 0; i <= limit; i++) {
      const entry = log[i];
      if (entry && entry.action === 'paint') {
        set.add(key(entry.x, entry.y));
      }
    }
    return set;
  }, [log, stepIdx]);

  // Current robot position
  const currentPos = useMemo(() => {
    if (!log || log.length === 0) return instance?.start ?? { x: 0, y: 0 };
    const limit = Math.min(Math.max(0, stepIdx), log.length - 1);
    const entry = log[limit];
    if (!entry) return instance?.start ?? { x: 0, y: 0 };
    return { x: entry.x, y: entry.y };
  }, [log, stepIdx, instance]);

  const isAtEnd = Boolean(
    log &&
    log.length > 0 &&
    Math.min(Math.max(0, stepIdx), log.length - 1) === log.length - 1
  );

  // Grid cells list
  const gridCells = useMemo(() => {
    const list: { x: number; y: number }[] = [];
    for (let x = bounds.minX; x <= bounds.maxX; x++) {
      for (let y = bounds.minY; y <= bounds.maxY; y++) {
        list.push({ x, y });
      }
    }
    return list;
  }, [bounds]);

  // Parse wall lines
  const wallLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
    for (const wallKey of instance.walls) {
      if (wallKey.startsWith('H:')) {
        const [wx, wy] = wallKey.slice(2).split(',').map(Number);
        // Horizontal wall at y + 1
        const svgX1 = (wx - bounds.minX) * CELL_SIZE;
        const svgX2 = (wx - bounds.minX + 1) * CELL_SIZE;
        const svgY = (bounds.maxY - (wy + 1)) * CELL_SIZE;
        lines.push({ x1: svgX1, y1: svgY, x2: svgX2, y2: svgY, key: wallKey });
      } else if (wallKey.startsWith('V:')) {
        const [wx, wy] = wallKey.slice(2).split(',').map(Number);
        // Vertical wall at x + 1
        const svgX = (wx - bounds.minX + 1) * CELL_SIZE;
        const svgY1 = (bounds.maxY - (wy + 1)) * CELL_SIZE;
        const svgY2 = (bounds.maxY - wy) * CELL_SIZE;
        lines.push({ x1: svgX, y1: svgY1, x2: svgX, y2: svgY2, key: wallKey });
      }
    }
    return lines;
  }, [instance.walls, bounds]);

  // Helper to convert cell (x,y) to SVG top-left
  const getCellSvgPos = (x: number, y: number) => {
    return {
      svgX: (x - bounds.minX) * CELL_SIZE,
      svgY: (bounds.maxY - (y + 1)) * CELL_SIZE,
    };
  };

  const robotSvgCenter = {
    cx: (currentPos.x - bounds.minX + 0.5) * CELL_SIZE,
    cy: (bounds.maxY - currentPos.y - 0.5) * CELL_SIZE,
  };

  const showControls = animate && log && log.length > 0;

  return (
    <div
      className="flex flex-col items-center w-full rounded-xl p-3 select-none transition-colors duration-150"
      style={{ backgroundColor: palette.bg }}
    >
      {/* SVG Canvas Container */}
      <div className="w-full flex justify-center items-center overflow-x-auto p-1">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="drop-shadow-sm transition-all duration-150 shrink-0"
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '100%',
            maxWidth: `${widthCells * CELL_SIZE}px`,
            minWidth: `${widthCells * 28}px`,
            minHeight: `${heightCells * 28}px`,
            backgroundColor: palette.bg,
          }}
        >
          <defs>
            {/* Hatch pattern for missing cells */}
            <pattern
              id="missing-hatch"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="8" stroke={palette.missingHatch} strokeWidth="2.5" />
            </pattern>

            {/* Crash Arrow Marker */}
            <marker
              id="crash-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={palette.crashStroke} />
            </marker>
          </defs>

          {/* Background rect */}
          <rect width={viewBoxWidth} height={viewBoxHeight} fill={palette.bg} />

          {/* Layer 1: Grid Background & Lines */}
          <g id="layer-grid">
            {gridCells.map(({ x, y }) => {
              const { svgX, svgY } = getCellSvgPos(x, y);
              return (
                <rect
                  key={`cell-${x},${y}`}
                  x={svgX}
                  y={svgY}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={palette.gridCellFill}
                  stroke={palette.gridStroke}
                  strokeWidth="0.8"
                />
              );
            })}
          </g>

          {/* Layer 2: Target Cells */}
          {showTarget && (
            <g id="layer-target">
              {Array.from(instance.target).map((tKey: string) => {
                const [tx, ty] = tKey.split(',').map(Number);
                const { svgX, svgY } = getCellSvgPos(tx, ty);
                return (
                  <rect
                    key={`target-${tKey}`}
                    x={svgX + 2}
                    y={svgY + 2}
                    width={CELL_SIZE - 4}
                    height={CELL_SIZE - 4}
                    rx={4}
                    fill={palette.targetFill}
                    stroke={palette.targetStroke}
                    strokeWidth="1"
                    strokeDasharray="3 2"
                  />
                );
              })}
            </g>
          )}

          {/* Layer 3: Painted Cells by Robot */}
          <g id="layer-painted">
            {Array.from(paintedAtStep).map((pKey: string) => {
              const [px, py] = pKey.split(',').map(Number);
              const { svgX, svgY } = getCellSvgPos(px, py);
              return (
                <rect
                  key={`painted-${pKey}`}
                  x={svgX + 1}
                  y={svgY + 1}
                  width={CELL_SIZE - 2}
                  height={CELL_SIZE - 2}
                  rx={3}
                  fill={palette.paintedFill}
                  stroke={palette.paintedStroke}
                  strokeWidth="1"
                />
              );
            })}
          </g>

          {/* Layer 4: Missing Target Cells (Only at end) */}
          {isAtEnd && missing.length > 0 && (
            <g id="layer-missing">
              {missing.map((mKey: string) => {
                const [mx, my] = mKey.split(',').map(Number);
                const { svgX, svgY } = getCellSvgPos(mx, my);
                return (
                  <g key={`missing-${mKey}`}>
                    <rect
                      x={svgX + 2}
                      y={svgY + 2}
                      width={CELL_SIZE - 4}
                      height={CELL_SIZE - 4}
                      rx={4}
                      fill={palette.missingFill}
                      stroke={palette.missingStroke}
                      strokeWidth="2"
                    />
                    <rect
                      x={svgX + 2}
                      y={svgY + 2}
                      width={CELL_SIZE - 4}
                      height={CELL_SIZE - 4}
                      rx={4}
                      fill="url(#missing-hatch)"
                      className="opacity-70"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Layer 5: Extra Cells Painted (Only at end) */}
          {isAtEnd && extra.length > 0 && (
            <g id="layer-extra">
              {extra.map((eKey: string) => {
                const [ex, ey] = eKey.split(',').map(Number);
                const { svgX, svgY } = getCellSvgPos(ex, ey);
                return (
                  <rect
                    key={`extra-${eKey}`}
                    x={svgX + 1}
                    y={svgY + 1}
                    width={CELL_SIZE - 2}
                    height={CELL_SIZE - 2}
                    rx={3}
                    fill={palette.extraFill}
                    stroke={palette.extraStroke}
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}

          {/* Layer 6: Walls */}
          <g id="layer-walls">
            {wallLines.map((w) => (
              <line
                key={`wall-${w.key}`}
                x1={w.x1}
                y1={w.y1}
                x2={w.x2}
                y2={w.y2}
                stroke={palette.wallStroke}
                strokeWidth="7"
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Layer 7: Robot */}
          <g id="layer-robot">
            <circle
              cx={robotSvgCenter.cx}
              cy={robotSvgCenter.cy}
              r={CELL_SIZE * 0.36}
              fill={palette.robotFill}
              stroke={palette.robotStroke}
              strokeWidth="2"
              className="shadow-md"
            />
            <text
              x={robotSvgCenter.cx}
              y={robotSvgCenter.cy + 4}
              textAnchor="middle"
              fill={palette.robotText}
              className="font-black text-xs select-none"
            >
              Р
            </text>
          </g>

          {/* Layer 8: Crash Direction Arrow */}
          {isAtEnd && crashDir && (
            <g id="layer-crash">
              {(() => {
                let dx = 0;
                let dy = 0;
                if (crashDir === 'up') dy = -CELL_SIZE * 0.55;
                if (crashDir === 'down') dy = CELL_SIZE * 0.55;
                if (crashDir === 'left') dx = -CELL_SIZE * 0.55;
                if (crashDir === 'right') dx = CELL_SIZE * 0.55;

                return (
                  <line
                    x1={robotSvgCenter.cx}
                    y1={robotSvgCenter.cy}
                    x2={robotSvgCenter.cx + dx}
                    y2={robotSvgCenter.cy + dy}
                    stroke={palette.crashStroke}
                    strokeWidth="3.5"
                    markerEnd="url(#crash-arrow)"
                  />
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      {/* Controls Bar */}
      {showControls && (
        <div className="w-full mt-2 pt-2 border-t border-theme-border flex flex-wrap items-center justify-between gap-3 text-xs text-theme-text">
          {/* Playback Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStepIdx(0);
              }}
              title="Сброс к началу"
              className="px-3 py-2.5 rounded-xl border border-theme-border bg-theme-bg/60 text-theme-text hover:bg-theme-bg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shadow-sm text-xs font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStepIdx((p) => Math.max(0, p - 1));
              }}
              disabled={stepIdx <= 0}
              title="Шаг назад"
              className="px-3 py-2.5 rounded-xl border border-theme-border bg-theme-bg/60 text-theme-text hover:bg-theme-bg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shadow-sm text-xs font-semibold"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (stepIdx >= totalSteps - 1) {
                  setStepIdx(0);
                }
                setIsPlaying(!isPlaying);
              }}
              title={isPlaying ? 'Пауза' : 'Воспроизведение'}
              className="px-3.5 py-2.5 rounded-xl border border-theme-border bg-theme-bg/60 text-theme-text hover:bg-theme-bg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shadow-sm text-xs font-semibold"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStepIdx((p) => Math.min(totalSteps - 1, p + 1));
              }}
              disabled={stepIdx >= totalSteps - 1}
              title="Шаг вперёд"
              className="px-3 py-2.5 rounded-xl border border-theme-border bg-theme-bg/60 text-theme-text hover:bg-theme-bg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shadow-sm text-xs font-semibold"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Step Counter */}
          <div className="font-mono text-xs text-theme-text-muted bg-theme-bg px-3 py-2 rounded-xl border border-theme-border flex items-center">
            Шаг&nbsp;<span className="text-theme-text font-bold">{stepIdx + 1}</span>&nbsp;из&nbsp;
            <span className="text-theme-text">{totalSteps}</span>
          </div>

          {/* Speed Slider */}
          <div className="flex items-center space-x-2">
            <span className="text-theme-text-muted whitespace-nowrap">Скорость: {speed}/с</span>
            <input
              type="range"
              min="1"
              max="60"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-20 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

function ensureFieldInstance(inst: any): FieldInstance {
  return {
    ...inst,
    walls: inst.walls instanceof Set ? inst.walls : new Set(inst.walls || []),
    target: inst.target instanceof Set ? inst.target : new Set(inst.target || []),
  };
}

function formatParseErrorMessage(msg: string): string {
  if (!msg) return '';
  return msg.replace(/^Строка\s+\d+\s*:\s*/i, '').replace(/^Строка\s+\d+\s*/i, '').trim();
}

const DEFAULT_CODE_TEMPLATE = `использовать Робот
алг
нач
  
кон`;

interface RobotErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface RobotErrorBoundaryState {
  hasError: boolean;
}

class RobotErrorBoundary extends React.Component<
  RobotErrorBoundaryProps,
  RobotErrorBoundaryState
> {
  props: RobotErrorBoundaryProps;
  state: RobotErrorBoundaryState = { hasError: false };

  constructor(props: RobotErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(): RobotErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RobotErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
          {this.props.fallbackMessage || 'Ошибка отображения поля'}
        </div>
      );
    }
    return this.props.children;
  }
}

interface TestRunResult {
  parseError?: { message: string; line: number };
  status?: 'ok' | 'crashed' | 'timeout' | 'assert';
  log?: StepLogEntry[];
}

const Task15Component: React.FC<{
  taskData: Task15Data;
  state: TaskModuleState;
}> = ({ taskData, state }) => {
  const visibleInst = useMemo(() => ensureFieldInstance(taskData.visible), [taskData.visible]);
  const hiddenInsts = useMemo(
    () => (taskData.hidden || []).map(ensureFieldInstance),
    [taskData.hidden]
  );

  const family = useMemo(
    () => ROBOT_FAMILIES.find((f) => f.id === taskData.familyId) || ROBOT_FAMILIES[0],
    [taskData.familyId]
  );

  const goal = useMemo(
    () => family.goals.find((g) => g.id === taskData.goalId) || family.goals[0],
    [family, taskData.goalId]
  );

  const transformId = taskData.transform || 'id';

  const solutionSteps = useMemo(() => {
    if (taskData.solutionSteps && taskData.solutionSteps.length > 0) {
      return taskData.solutionSteps;
    }
    return family.solutionSteps(transformId, goal);
  }, [taskData.solutionSteps, family, transformId, goal]);

  const typicalMistake = useMemo(() => {
    if (typeof taskData.typicalMistake === 'string') {
      return taskData.typicalMistake;
    }
    return family.typicalMistake(transformId, goal);
  }, [taskData.typicalMistake, family, transformId, goal]);

  // Local code state initialized from state.userAnswer or template
  const [code, setCode] = useState<string>(() => {
    if (typeof state.userAnswer === 'string') {
      return state.userAnswer;
    }
    return DEFAULT_CODE_TEMPLATE;
  });

  // Keep state.userAnswer in sync with code
  useEffect(() => {
    if (state.userAnswer !== code) {
      state.setUserAnswer(code);
    }
  }, [code, state]);

  // Test run on visible field state
  const [testRunResult, setTestRunResult] = useState<TestRunResult | null>(null);

  // Run only on visible instance for trial run
  const handleRunVisible = () => {
    try {
      const prog = parseKumir(code);
      const runRes = runProgram(prog, visibleInst);
      setTestRunResult({
        status: runRes.status,
        log: runRes.log,
      });
    } catch (err: unknown) {
      if (err instanceof RobotParseError) {
        setTestRunResult({
          parseError: {
            message: err.message,
            line: err.line,
          },
        });
      } else if (err && typeof err === 'object' && 'message' in err) {
        const parseErr = err as { message: string; line?: number };
        setTestRunResult({
          parseError: {
            message: parseErr.message,
            line: typeof parseErr.line === 'number' ? parseErr.line : 0,
          },
        });
      } else {
        setTestRunResult({
          parseError: {
            message: 'Синтаксическая ошибка в программе',
            line: 0,
          },
        });
      }
    }
  };

  // Compute final solution score & outcomes when submitted
  const submissionEvaluation = useMemo(() => {
    if (!state.isSubmitted) return null;

    const answerCode =
      typeof state.userAnswer === 'string' && state.userAnswer.trim()
        ? state.userAnswer
        : code;

    const outcome: CheckOutcome = checkSolution(answerCode, family, visibleInst, hiddenInsts);
    let visibleLog: StepLogEntry[] | null = null;

    if (outcome.score === 2) {
      try {
        const prog = parseKumir(answerCode);
        const runRes = runProgram(prog, visibleInst);
        visibleLog = runRes.log;
      } catch {
        // Ignore
      }
    }

    return { outcome, visibleLog };
  }, [state.isSubmitted, state.userAnswer, code, family, visibleInst, hiddenInsts]);

  return (
    <div className="space-y-6 text-theme-text">
      {/* 1. Statement */}
      <StatementBlock>
        <StatementText>
          {taskData.statement}
        </StatementText>
      </StatementBlock>

      {/* 2. Collapsible FIPI Commands Help */}
      <SubBlock>
        <details className="group">
          <summary className="w-full flex items-center justify-between text-sm font-semibold text-theme-text hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer list-none">
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              Система команд исполнителя Робот
            </span>
            <ChevronDown className="w-4 h-4 text-theme-text-muted group-open:rotate-180 transition-transform" />
          </summary>

          <div className="pt-3 mt-3 border-t border-theme-border text-xs text-theme-text space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-theme-border p-4 bg-theme-bg/60">
                <BlockLabel>Команды движения и закрашивания:</BlockLabel>
                <DataTable>
                  <tbody>
                    <tr>
                      <Td className="text-left font-mono font-bold text-blue-600 dark:text-blue-400">вверх, вниз, влево, вправо</Td>
                      <Td className="text-left font-mono text-theme-text-muted">перемещение на 1 клетку</Td>
                    </tr>
                    <tr>
                      <Td className="text-left font-mono font-bold text-blue-600 dark:text-blue-400">закрасить</Td>
                      <Td className="text-left font-mono text-theme-text-muted">закрашивание текущей клетки</Td>
                    </tr>
                  </tbody>
                </DataTable>
              </div>
              <div className="rounded-lg border border-theme-border p-4 bg-theme-bg/60">
                <BlockLabel>Условия-примитивы:</BlockLabel>
                <DataTable>
                  <tbody>
                    <tr>
                      <Td className="text-left font-mono font-bold text-blue-600 dark:text-blue-400">сверху / снизу / слева / справа свободно</Td>
                    </tr>
                    <tr>
                      <Td className="text-left font-mono font-bold text-blue-600 dark:text-blue-400">сверху / снизу / слева / справа стена</Td>
                    </tr>
                    <tr>
                      <Td className="text-left font-mono font-bold text-blue-600 dark:text-blue-400">клетка закрашена / клетка чистая</Td>
                    </tr>
                  </tbody>
                </DataTable>
              </div>
            </div>

            <div className="rounded-lg border border-theme-border p-4 bg-theme-bg/60">
              <BlockLabel>Конструкции управления и связки (и, или, не, скобки):</BlockLabel>
              <DataTable>
                <tbody>
                  <tr>
                    <Td className="text-left align-top font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap font-mono">ветвление</Td>
                    <Td className="text-left align-top whitespace-pre font-mono">если &lt;условие&gt; то &lt;команды&gt; [ иначе &lt;команды&gt; ] все</Td>
                  </tr>
                  <tr>
                    <Td className="text-left align-top font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap font-mono">цикл пока</Td>
                    <Td className="text-left align-top whitespace-pre font-mono">нц пока &lt;условие&gt; &lt;команды&gt; кц</Td>
                  </tr>
                  <tr>
                    <Td className="text-left align-top font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap font-mono">цикл N раз</Td>
                    <Td className="text-left align-top whitespace-pre font-mono">нц &lt;число&gt; раз &lt;команды&gt; кц</Td>
                  </tr>
                  <tr>
                    <Td className="text-left align-top font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap font-mono">выбор</Td>
                    <Td className="text-left align-top whitespace-pre font-mono">выбор при &lt;условие&gt; : &lt;команды&gt; [ иначе &lt;команды&gt; ] все</Td>
                  </tr>
                  <tr>
                    <Td className="text-left align-top font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap font-mono">утверждение</Td>
                    <Td className="text-left align-top whitespace-pre font-mono">утв &lt;условие&gt;</Td>
                  </tr>
                </tbody>
              </DataTable>
            </div>
          </div>
        </details>
      </SubBlock>

      {/* 3. Condition Field Image */}
      <RobotErrorBoundary fallbackMessage="Ошибка отображения поля из условия">
        <div className="space-y-2">
          <BlockLabel>
            {family.shapeFromFigure
              ? 'Вид поля из условия (форма стены как на рисунке, длины отрезков могут отличаться):'
              : 'Вид поля из условия (пример расположения стен):'}
          </BlockLabel>
          <div className="rounded-xl border border-theme-border overflow-hidden shadow-sm flex items-center justify-center p-2">
            <RobotCanvas
              instance={visibleInst}
              showTarget={true}
              animate={false}
            />
          </div>
        </div>
      </RobotErrorBoundary>

      {/* 4. Code Input Field */}
      <div className="space-y-2">
        <BlockLabel>Исходный код программы (язык КуМир):</BlockLabel>
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-md">
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Редактор КуМир</span>
            <span className="font-mono text-[11px] text-slate-500">КуМир 2.1</span>
          </div>
          <textarea
            rows={14}
            value={code}
            onChange={(e) => {
              const val = e.target.value;
              setCode(val);
              state.setUserAnswer(val);
            }}
            disabled={state.isSubmitted}
            autoComplete="off"
            spellCheck={false}
            placeholder={`использовать Робот\nалг\nнач\n  | Напишите код здесь\nкон`}
            className="w-full font-mono text-xs sm:text-sm bg-slate-900 text-slate-100 p-4 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed resize-y"
          />
        </div>
      </div>

      {/* 5. Button "Запустить на поле из условия" & 6. Trial Run Results Display (Only before submission) */}
      {!state.isSubmitted && (
        <div className="space-y-4">
          <div>
            <button
              type="button"
              disabled={!code.trim()}
              onClick={handleRunVisible}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer ${
                !code.trim()
                  ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white'
              }`}
            >
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>Запустить на поле из условия</span>
            </button>
          </div>

          {testRunResult && (
            <div className="space-y-3 pt-1">
              {testRunResult.parseError ? (
                <VerdictBox status="wrong">
                  <div className="flex items-center gap-2 font-bold text-base">
                    <AlertTriangle className="w-5 h-5" />
                    {testRunResult.parseError.line > 0
                      ? `Ошибка в программе (Строка ${testRunResult.parseError.line})`
                      : 'Ошибка в программе'}
                  </div>
                  <p className="text-sm font-normal mt-1">
                    {formatParseErrorMessage(testRunResult.parseError.message)}
                  </p>
                </VerdictBox>
              ) : (
                <div className="space-y-3">
                  <div className="px-4 py-2.5 bg-theme-bg/80 border border-theme-border rounded-xl text-sm text-theme-text font-medium flex items-center gap-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Результат прогона:</span>
                    <span>
                      {testRunResult.status === 'crashed' && 'Робот разрушился'}
                      {testRunResult.status === 'timeout' && 'Алгоритм не завершился (зацикливание)'}
                      {testRunResult.status === 'assert' && 'Нарушено утверждение (утв)'}
                      {testRunResult.status === 'ok' && 'Выполнение завершено'}
                    </span>
                  </div>
                  {testRunResult.log && (
                    <RobotErrorBoundary fallbackMessage="Ошибка отображения результата прогона">
                      <div className="rounded-xl border border-theme-border overflow-hidden shadow-sm flex items-center justify-center p-2">
                        <RobotCanvas
                          instance={visibleInst}
                          log={testRunResult.log}
                          showTarget={true}
                          animate={true}
                        />
                      </div>
                    </RobotErrorBoundary>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. Submission Results Display (Only when state.isSubmitted === true) */}
      {state.isSubmitted && submissionEvaluation && (
        <RobotErrorBoundary fallbackMessage="Ошибка отображения итоговой проверки">
          <div className="space-y-4 pt-4 border-t border-theme-border">
            <BlockLabel className="text-sm">Итоговая проверка решения:</BlockLabel>

            {/* Result Score & Status Display */}
            <div className="space-y-4">
              <VerdictBox
                status={
                  submissionEvaluation.outcome.score === 2
                    ? 'correct'
                    : submissionEvaluation.outcome.score === 1
                    ? 'partial'
                    : 'wrong'
                }
              >
                <div className="flex items-center gap-2 text-lg font-bold">
                  {submissionEvaluation.outcome.score === 2 && (
                    <CheckCircle2 className="w-5 h-5 text-status-correct" />
                  )}
                  {submissionEvaluation.outcome.score === 1 && (
                    <AlertTriangle className="w-5 h-5 text-status-partial" />
                  )}
                  {submissionEvaluation.outcome.score === 0 && (
                    <XCircle className="w-5 h-5 text-status-wrong" />
                  )}
                  {submissionEvaluation.outcome.score} из 2 баллов
                </div>
                <div className="text-sm font-medium mt-1 opacity-90">
                  {submissionEvaluation.outcome.parseError
                    ? 'Программа содержит синтаксическую ошибку и не была выполнена'
                    : submissionEvaluation.outcome.score === 2
                    ? 'Алгоритм верно работает при всех допустимых расположениях стен.'
                    : submissionEvaluation.outcome.score === 1
                    ? 'Алгоритм завершается и робот цел, но закрашивание неточное: часть нужных клеток пропущена или закрашены лишние.'
                    : submissionEvaluation.outcome.fail?.reason ||
                      'Алгоритм не выполнил условие задачи.'}
                </div>
                {submissionEvaluation.outcome.parseError && (
                  <div className="text-sm text-status-wrong font-mono mt-1">
                    {submissionEvaluation.outcome.parseError.line > 0
                      ? `Строка ${submissionEvaluation.outcome.parseError.line}: ${formatParseErrorMessage(
                          submissionEvaluation.outcome.parseError.message
                        )}`
                      : formatParseErrorMessage(submissionEvaluation.outcome.parseError.message)}
                  </div>
                )}
              </VerdictBox>

              {/* Fail instance canvas */}
              {!submissionEvaluation.outcome.parseError && submissionEvaluation.outcome.fail && (
                <div className="space-y-2">
                  <div
                    className="text-sm font-semibold text-status-wrong flex items-center gap-2 cursor-help"
                    title={submissionEvaluation.outcome.fail.instance.label}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Провальный тест (скрытый)</span>
                  </div>

                  {(() => {
                    const N = submissionEvaluation.outcome.fail.missing.length;
                    const M = submissionEvaluation.outcome.fail.extra.length;
                    const parts: string[] = [];
                    if (N > 0) parts.push(`Не закрашено клеток: ${N}`);
                    if (M > 0) {
                      if (N > 0) {
                        parts.push(`закрашено лишних: ${M}`);
                      } else {
                        parts.push(`Закрашено лишних: ${M}`);
                      }
                    }
                    if (parts.length === 0) return null;
                    return (
                      <div className="text-sm text-theme-text font-medium">
                        {parts.join(', ')}.
                      </div>
                    );
                  })()}

                  <RobotErrorBoundary fallbackMessage="Ошибка отображения провального теста">
                    <div className="rounded-xl border border-theme-border overflow-hidden shadow-sm flex items-center justify-center p-2">
                      <RobotCanvas
                        instance={submissionEvaluation.outcome.fail.instance}
                        log={submissionEvaluation.outcome.fail.log}
                        extra={submissionEvaluation.outcome.fail.extra}
                        missing={submissionEvaluation.outcome.fail.missing}
                        crashDir={submissionEvaluation.outcome.fail.crashDir}
                        animate={true}
                      />
                    </div>
                  </RobotErrorBoundary>

                  {(() => {
                    const fail = submissionEvaluation.outcome.fail;
                    const inst = fail.instance;
                    const log = fail.log || [];
                    const painted = new Set<string>();
                    for (const entry of log) {
                      if (entry.action === 'paint') {
                        painted.add(`${entry.x},${entry.y}`);
                      }
                    }

                    const hasCorrect = Array.from(inst.target).some((k: string) => painted.has(k));
                    const hasMissing = fail.missing.length > 0;
                    const hasExtra = fail.extra.length > 0;
                    const hasWalls = inst.walls.size > 0;
                    const hasRobot = true;

                    return (
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-theme-text-muted pt-1">
                        {hasCorrect && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded bg-blue-300 dark:bg-indigo-600 border border-blue-400 dark:border-indigo-400 inline-block" />
                            <span>закрашено верно</span>
                          </div>
                        )}
                        {hasMissing && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500 inline-block" />
                            <span>нужно было закрасить</span>
                          </div>
                        )}
                        {hasExtra && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded bg-rose-500/30 dark:bg-rose-500/50 border border-rose-400 inline-block" />
                            <span>закрашено лишнее</span>
                          </div>
                        )}
                        {hasWalls && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-1 rounded bg-slate-800 dark:bg-slate-200 inline-block" />
                            <span>стена</span>
                          </div>
                        )}
                        {hasRobot && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 dark:bg-amber-400 text-slate-900 font-bold border border-slate-800 dark:border-amber-200 flex items-center justify-center text-[9px] leading-none inline-flex">
                              Р
                            </span>
                            <span>робот</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Success 2 points: playback on visible instance */}
              {submissionEvaluation.outcome.score === 2 && submissionEvaluation.visibleLog && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-status-correct flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Демонстрация работы алгоритма на тестовом поле:</span>
                  </div>
                  <RobotErrorBoundary fallbackMessage="Ошибка отображения демонстрации решения">
                    <div className="rounded-xl border border-theme-border overflow-hidden shadow-sm flex items-center justify-center p-2">
                      <RobotCanvas
                        instance={visibleInst}
                        log={submissionEvaluation.visibleLog}
                        showTarget={true}
                        animate={true}
                      />
                    </div>
                  </RobotErrorBoundary>
                </div>
              )}
            </div>
          </div>
        </RobotErrorBoundary>
      )}

      {/* 8. Hint Block */}
      {state.showHints && (
        <HintBox>
          <div className="font-semibold flex items-center gap-2 mb-1">
            <Lightbulb className="w-4 h-4" />
            <span>Подсказка по заданию:</span>
          </div>
          <p className="leading-relaxed">{taskData.hint || goal.hint(transformId)}</p>
        </HintBox>
      )}

      {/* 9. Reference Solution & Breakdown Block (When Submitted) */}
      {state.isSubmitted && (
        <SubBlock className="space-y-4">
          <div className="text-sm font-bold text-theme-text flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>Разбор задачи и пример решения:</span>
          </div>

          {solutionSteps.length > 0 && (
            <div className="space-y-1.5">
              <BlockLabel>Алгоритм решения:</BlockLabel>
              <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-theme-text">
                {solutionSteps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {typicalMistake && (
            <div className="text-xs md:text-sm text-theme-text leading-relaxed">
              <span className="font-semibold text-status-wrong">Типичная ошибка: </span>
              {typicalMistake}
            </div>
          )}

          <div className="space-y-2">
            <CodeBlock label="ПРИМЕР РЕШЕНИЯ (КУМИР):">
              {taskData.reference || ''}
            </CodeBlock>
          </div>
        </SubBlock>
      )}
    </div>
  );
};

export const task15: TaskModule = {
  id: 15,
  title: 'Исполнитель «Робот» (КуМир)',
  description:
    'Написание алгоритма управления Роботом на языке КуМир для закрашивания клеток у неизвестных стен.',
  topics: ['Исполнитель Робот', 'Алгоритмизация'], // TODO: уточнить формулировки
  maxPoints: 2,

  generate: (difficulty: Difficulty, rng: RNG): Task15Data => {
    // Collect all (family, goal) pairs with effective level
    const options: { family: typeof ROBOT_FAMILIES[0]; goal: typeof ROBOT_FAMILIES[0]['goals'][0]; level: 1 | 2 | 3 }[] = [];
    for (const family of ROBOT_FAMILIES) {
      for (const goal of family.goals) {
        options.push({
          family,
          goal,
          level: goal.level ?? family.level,
        });
      }
    }

    let available = options.filter((o) => o.level === difficulty);
    if (available.length === 0) {
      available = options.filter((o) => o.level <= difficulty);
    }
    if (available.length === 0) {
      available = options;
    }

    const t = rng.pick(ALL_TRANSFORMS);
    const chosen = rng.pick(available);
    const family = chosen.family;
    const goal = chosen.goal;
    const { visible: rawVisible, hidden: rawHidden } = buildInstances(family, goal, rng);

    const visible = transformInstance(rawVisible, t);
    const hidden = rawHidden.map((inst) => transformInstance(inst, t));
    const statement = goal.statement(t);
    const hint = goal.hint(t);
    const reference = transformCode(goal.reference, t);
    const solutionSteps = family.solutionSteps(t, goal);
    const typicalMistake = family.typicalMistake(t, goal);

    return {
      familyId: family.id,
      goalId: goal.id,
      transform: t,
      statement,
      hint,
      reference,
      visible,
      hidden,
      solutionSteps,
      typicalMistake,
    };
  },

  render: (taskData: Task15Data, state: TaskModuleState) => {
    return <Task15Component taskData={taskData} state={state} />;
  },

  check: (taskData: Task15Data, userAnswer: string): boolean => {
    if (!userAnswer || !userAnswer.trim()) return false;
    try {
      const family = ROBOT_FAMILIES.find((f) => f.id === taskData.familyId) || ROBOT_FAMILIES[0];
      const visible = ensureFieldInstance(taskData.visible);
      const hidden = (taskData.hidden || []).map(ensureFieldInstance);
      const res = checkSolution(userAnswer, family, visible, hidden);
      return res.score === 2;
    } catch {
      return false;
    }
  },

  checkScore: (taskData: Task15Data, userAnswer: string): { score: number; maxScore: number } => {
    if (!userAnswer || !userAnswer.trim()) {
      return { score: 0, maxScore: 2 };
    }
    try {
      const family = ROBOT_FAMILIES.find((f) => f.id === taskData.familyId) || ROBOT_FAMILIES[0];
      const visible = ensureFieldInstance(taskData.visible);
      const hidden = (taskData.hidden || []).map(ensureFieldInstance);
      const res = checkSolution(userAnswer, family, visible, hidden);
      return { score: res.score, maxScore: 2 };
    } catch {
      return { score: 0, maxScore: 2 };
    }
  },
};

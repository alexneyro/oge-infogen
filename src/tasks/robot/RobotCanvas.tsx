import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { Dir, FieldInstance } from './types';
import { StepLogEntry } from './interpreter';
import { key } from './field';

export interface RobotCanvasProps {
  instance: FieldInstance;
  log?: StepLogEntry[];
  extra?: string[];
  missing?: string[];
  showTarget?: boolean;
  crashDir?: Dir;
  animate?: boolean;
}

const CELL_SIZE = 40;

export const RobotCanvas: React.FC<RobotCanvasProps> = ({
  instance,
  log,
  extra = [],
  missing = [],
  showTarget = true,
  crashDir,
  animate = true,
}) => {
  const totalSteps = log ? log.length : 0;

  const [stepIdx, setStepIdx] = useState<number>(totalSteps > 0 ? totalSteps - 1 : 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(12); // steps per second

  // Reset state on instance/log change
  useEffect(() => {
    setStepIdx(log && log.length > 0 ? log.length - 1 : 0);
    setIsPlaying(false);
  }, [instance, log]);

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
  }, [isPlaying, speed, log]);

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
    <div className="flex flex-col items-center w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl select-none">
      {/* SVG Canvas Container */}
      <div className="w-full flex justify-center items-center overflow-x-auto p-2">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="drop-shadow-md transition-all duration-150 shrink-0"
          preserveAspectRatio="xMidYMid meet"
          style={{
            width: '100%',
            maxWidth: `${widthCells * CELL_SIZE}px`,
            minWidth: `${widthCells * 28}px`,
            minHeight: `${heightCells * 28}px`,
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
              <line x1="0" y1="0" x2="0" y2="8" className="stroke-amber-400 stroke-[2.5]" />
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
              <path d="M 0 1 L 10 5 L 0 9 z" className="fill-rose-500" />
            </marker>
          </defs>

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
                  className="fill-slate-900/40 stroke-slate-800/80 stroke-[0.8]"
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
                    className="fill-emerald-500/20 stroke-emerald-500/40 stroke-1 stroke-dasharray-2"
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
                  className="fill-indigo-600/85 dark:fill-indigo-500/90 stroke-indigo-400/50 stroke-1"
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
                      className="fill-amber-500/15 stroke-amber-500 stroke-2"
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
                    className="fill-rose-500/50 stroke-rose-400 stroke-2"
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
                className="stroke-slate-100 dark:stroke-slate-200 stroke-[7]"
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
              className="fill-amber-400 dark:fill-amber-400 stroke-amber-200 stroke-2 shadow-lg"
            />
            <text
              x={robotSvgCenter.cx}
              y={robotSvgCenter.cy + 4}
              textAnchor="middle"
              className="font-black text-xs fill-slate-900 select-none"
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
                    className="stroke-rose-500 stroke-[3.5]"
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
        <div className="w-full mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          {/* Playback Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStepIdx(0);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="В начало"
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
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition-colors"
              title="Шаг назад"
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
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center space-x-1 shadow-md"
              title={isPlaying ? 'Пауза' : 'Старт'}
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
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition-colors"
              title="Шаг вперёд"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Step Counter */}
          <div className="font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50">
            Шаг <span className="text-indigo-400 font-bold">{stepIdx + 1}</span> из{' '}
            <span className="text-slate-200">{totalSteps}</span>
          </div>

          {/* Speed Slider */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 whitespace-nowrap">Скорость: {speed}/с</span>
            <input
              type="range"
              min="1"
              max="60"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-20 accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

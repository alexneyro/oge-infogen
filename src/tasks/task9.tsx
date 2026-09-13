import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { RNG } from '../utils/rng';
import { StatementBlock, StatementText, StatementQuestion, SubBlock, BlockLabel, AnswerField, AnswerChip, VerdictBox, HintBox } from '../components/task-ui';

export const RU_ALPHABET = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К', 'Л', 'М', 'Н', 'О', 'П'];
export const EN_ALPHABET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

export type Task9Subtype = 'simple' | 'mandatory_1' | 'forbidden_1' | 'mandatory_2' | 'mandatory_1_forbidden_1';

export interface Task9Node {
  id: number;          // 0 .. V-1
  name: string;        // 'А', 'Б', ... or 'A', 'B', ...
  layer: number;       // 0 .. L_max
  x: number;
  y: number;
}

export interface Task9Edge {
  from: number;        // u
  to: number;          // v
}

export interface Task9Data {
  difficulty: Difficulty;
  subtype: Task9Subtype;
  alphabet: 'ru' | 'en';
  nodes: Task9Node[];
  edges: Task9Edge[];
  startNode: string;              // e.g. 'А'
  endNode: string;                // e.g. 'К'
  mandatoryNodes: string[];       // e.g. ['В'] or ['В', 'Е']
  forbiddenNodes: string[];       // e.g. ['Д']
  correctAnswer: string;          // e.g. "12"
  statementIntro: string;
  questionText: string;
  shortHint: string;
  explanation: string;
}

interface RenderPoint {
  x: number;
  y: number;
}

function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function segmentsIntersect(a1: RenderPoint, a2: RenderPoint, b1: RenderPoint, b2: RenderPoint): boolean {
  if ((Math.abs(a1.x - b1.x) < 1e-4 && Math.abs(a1.y - b1.y) < 1e-4) ||
      (Math.abs(a1.x - b2.x) < 1e-4 && Math.abs(a1.y - b2.y) < 1e-4) ||
      (Math.abs(a2.x - b1.x) < 1e-4 && Math.abs(a2.y - b1.y) < 1e-4) ||
      (Math.abs(a2.x - b2.x) < 1e-4 && Math.abs(a2.y - b2.y) < 1e-4)) {
    return false;
  }
  function ccw(p1: RenderPoint, p2: RenderPoint, p3: RenderPoint) {
    return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
  }
  return (ccw(a1, b1, b2) !== ccw(a2, b1, b2)) && (ccw(a1, a2, b1) !== ccw(a1, a2, b2));
}

function sampleBezier(u: RenderPoint, control: RenderPoint, v: RenderPoint, steps = 10): RenderPoint[] {
  const points: RenderPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const invT = 1 - t;
    const x = invT * invT * u.x + 2 * invT * t * control.x + t * t * v.x;
    const y = invT * invT * u.y + 2 * invT * t * control.y + t * t * v.y;
    points.push({ x, y });
  }
  return points;
}

function distToPolyline(p: RenderPoint, polyline: RenderPoint[]): number {
  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distToSegment(p.x, p.y, polyline[i].x, polyline[i].y, polyline[i + 1].x, polyline[i + 1].y);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

interface PolylineBBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function computePolylineBBox(polyline: RenderPoint[]): PolylineBBox {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < polyline.length; i++) {
    const p = polyline[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

function computePolylineSegBoxes(polyline: RenderPoint[]): PolylineBBox[] {
  const boxes: PolylineBBox[] = [];
  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = polyline[i];
    const p2 = polyline[i + 1];
    boxes.push({
      minX: Math.min(p1.x, p2.x),
      maxX: Math.max(p1.x, p2.x),
      minY: Math.min(p1.y, p2.y),
      maxY: Math.max(p1.y, p2.y),
    });
  }
  return boxes;
}

function countPolylineIntersections(
  poly1: RenderPoint[],
  poly2: RenderPoint[],
  bbox1?: PolylineBBox,
  bbox2?: PolylineBBox,
  segBoxes1?: PolylineBBox[],
  segBoxes2?: PolylineBBox[]
): number {
  const b1 = bbox1 || computePolylineBBox(poly1);
  const b2 = bbox2 || computePolylineBBox(poly2);
  if (b1.maxX < b2.minX || b1.minX > b2.maxX || b1.maxY < b2.minY || b1.minY > b2.maxY) {
    return 0;
  }
  const sb1 = segBoxes1 || computePolylineSegBoxes(poly1);
  const sb2 = segBoxes2 || computePolylineSegBoxes(poly2);
  let count = 0;
  for (let i = 0; i < poly1.length - 1; i++) {
    const box1 = sb1[i];
    for (let j = 0; j < poly2.length - 1; j++) {
      const box2 = sb2[j];
      if (
        box1.maxX < box2.minX ||
        box1.minX > box2.maxX ||
        box1.maxY < box2.minY ||
        box1.minY > box2.maxY
      ) {
        continue;
      }
      if (segmentsIntersect(poly1[i], poly1[i + 1], poly2[j], poly2[j + 1])) {
        count++;
      }
    }
  }
  return count;
}

function polylineProximityPenalty(
  polyA: RenderPoint[],
  polyB: RenderPoint[],
  threshold = 16,
  bboxA?: PolylineBBox,
  bboxB?: PolylineBBox,
  segBoxesA?: PolylineBBox[],
  segBoxesB?: PolylineBBox[]
): number {
  const nA = polyA.length;
  const nB = polyB.length;
  if (nA === 0 || nB === 0) return 0;

  const bA = bboxA || computePolylineBBox(polyA);
  const bB = bboxB || computePolylineBBox(polyB);
  if (
    bA.minX > bB.maxX + threshold ||
    bA.maxX < bB.minX - threshold ||
    bA.minY > bB.maxY + threshold ||
    bA.maxY < bB.minY - threshold
  ) {
    return 0;
  }

  const sbA = segBoxesA || computePolylineSegBoxes(polyA);
  const sbB = segBoxesB || computePolylineSegBoxes(polyB);

  const intersectSegs = new Set<number>();
  for (let i = 0; i < nA - 1; i++) {
    const boxA = sbA[i];
    for (let j = 0; j < nB - 1; j++) {
      const boxB = sbB[j];
      if (
        boxA.maxX < boxB.minX - threshold ||
        boxA.minX > boxB.maxX + threshold ||
        boxA.maxY < boxB.minY - threshold ||
        boxA.minY > boxB.maxY + threshold
      ) {
        continue;
      }
      if (segmentsIntersect(polyA[i], polyA[i + 1], polyB[j], polyB[j + 1])) {
        intersectSegs.add(i);
        break;
      }
    }
  }

  const excludedSamples = new Set<number>();
  excludedSamples.add(0);
  excludedSamples.add(nA - 1);

  for (const segIdx of intersectSegs) {
    for (let idx = segIdx - 1; idx <= segIdx + 2; idx++) {
      if (idx >= 0 && idx < nA) {
        excludedSamples.add(idx);
      }
    }
  }

  let penalty = 0;
  for (let k = 0; k < nA; k++) {
    if (excludedSamples.has(k)) continue;

    const p = polyA[k];
    const distToB0 = Math.hypot(p.x - polyB[0].x, p.y - polyB[0].y);
    const distToBEnd = Math.hypot(p.x - polyB[nB - 1].x, p.y - polyB[nB - 1].y);
    if (distToB0 < 20 || distToBEnd < 20) continue;

    const d = distToPolyline(p, polyB);
    if (d < threshold) {
      penalty += (threshold - d);
    }
  }

  return penalty;
}

function getSignPreference(offset: number, prevOffsetsFromU: number[]): boolean {
  if (prevOffsetsFromU.length === 0 || offset === 0) return false;
  const lastOffset = prevOffsetsFromU[prevOffsetsFromU.length - 1];
  if (lastOffset > 0) return offset < 0;
  if (lastOffset < 0) return offset > 0;
  return false;
}

/**
 * Counts paths from startNode to endNode under constraints (DFS).
 */
function evaluateGraph(
  numVertices: number,
  adjOut: number[][],
  startNode: number,
  endNode: number,
  mandatoryNodes: number[],
  forbiddenNodes: number[]
): { totalPaths: number; validPaths: number } {
  let totalPaths = 0;
  let validPaths = 0;
  const forbSet = new Set(forbiddenNodes);

  function dfs(u: number, path: number[]) {
    if (u === endNode) {
      totalPaths++;
      const hasAllMandatory = mandatoryNodes.every(m => path.includes(m));
      const hasNoForbidden = !path.some(node => forbSet.has(node));
      if (hasAllMandatory && hasNoForbidden) {
        validPaths++;
      }
      return;
    }
    for (const v of adjOut[u]) {
      dfs(v, [...path, v]);
    }
  }

  dfs(startNode, [startNode]);
  return { totalPaths, validPaths };
}

/**
 * Calculates DP step-by-step for the entire graph in a single unified table.
 * N(v) is the number of valid paths from startNode to v satisfying mandatory/forbidden conditions up to v.
 * Returns N array, explanation lines for Step 2, and result N[numVertices - 1].
 */
function computeSingleTableDP(
  numVertices: number,
  adjIn: number[][],
  alphabet: string[],
  mandatoryIndices: number[],
  forbiddenIndices: number[]
): { N: number[]; lines: string[]; result: number } {
  const forbSet = new Set(forbiddenIndices);
  const mSorted = [...mandatoryIndices].sort((a, b) => a - b);
  const N = new Array(numVertices).fill(0);
  const lines: string[] = [];

  N[0] = 1;
  lines.push(`N(${alphabet[0]}) = 1`);

  for (let i = 1; i < numVertices; i++) {
    const name = alphabet[i];

    if (forbSet.has(i)) {
      N[i] = 0;
      lines.push(`N(${name}) = 0 (город ${name} исключён по условию)`);
      continue;
    }

    const allIn = adjIn[i];
    const validIn: number[] = [];
    const bypassedMap = new Map<string, number[]>(); // bypassNote -> array of u

    for (const u of allIn) {
      if (forbSet.has(u)) {
        continue; // forbidden node, N[u] is 0
      }

      let bypassedNote: string | null = null;
      if (mSorted.length === 1) {
        const m1 = mSorted[0];
        if (i > m1 && u < m1) {
          bypassedNote = `обязательного города ${alphabet[m1]}`;
        }
      } else if (mSorted.length === 2) {
        const m1 = mSorted[0];
        const m2 = mSorted[1];
        if (i > m1 && i <= m2 && u < m1) {
          bypassedNote = `обязательного города ${alphabet[m1]}`;
        } else if (i > m2) {
          if (u < m1) {
            bypassedNote = `обязательных городов ${alphabet[m1]} и ${alphabet[m2]}`;
          } else if (u < m2) {
            bypassedNote = `обязательного города ${alphabet[m2]}`;
          }
        }
      }

      if (bypassedNote) {
        if (!bypassedMap.has(bypassedNote)) {
          bypassedMap.set(bypassedNote, []);
        }
        bypassedMap.get(bypassedNote)!.push(u);
      } else {
        validIn.push(u);
      }
    }

    let sum = 0;
    for (const u of validIn) {
      sum += N[u];
    }
    N[i] = sum;

    // Build comment for bypassed edges if any
    let bypassComment = '';
    if (bypassedMap.size > 0) {
      const parts: string[] = [];
      for (const [note, uList] of bypassedMap.entries()) {
        const edgeStr = uList.map(u => `${alphabet[u]} -> ${name}`).join(', ');
        if (uList.length === 1) {
          parts.push(`дорога ${edgeStr} идёт в обход ${note}, не учитывается`);
        } else {
          parts.push(`дороги ${edgeStr} идут в обход ${note}, не учитываются`);
        }
      }
      bypassComment = ` (${parts.join('; ')})`;
    }

    if (validIn.length === 0) {
      lines.push(`N(${name}) = 0${bypassComment}`);
    } else if (validIn.length === 1) {
      const u = validIn[0];
      const uName = alphabet[u];
      lines.push(`N(${name}) = N(${uName}) = ${sum}${bypassComment}`);
    } else {
      const termsStr = validIn.map(u => `N(${alphabet[u]})`).join(' + ');
      const valsStr = validIn.map(u => N[u]).join(' + ');
      lines.push(`N(${name}) = ${termsStr} = ${valsStr} = ${sum}${bypassComment}`);
    }
  }

  return { N, lines, result: N[numVertices - 1] };
}

/**
 * Builds guiding hint without giving away the answer.
 */
function buildShortHint(
  subtype: Task9Subtype,
  startNode: string,
  endNode: string,
  mandatoryNodes: string[],
  forbiddenNodes: string[]
): string {
  let text = `Используйте метод последовательного подсчёта по городам от стартового города ${startNode} к конечному городу ${endNode}.\n` +
    `Примите N(${startNode}) = 1. Для каждого следующего города количество путей равно сумме N всех городов, из которых в него напрямую входят стрелки.\n`;

  if (forbiddenNodes.length > 0) {
    text += `• Для условия «не заходя в город ${forbiddenNodes.join(', ')}»: исключите данный город из расчётов (примите N = 0) и не учитывайте входящие и выходящие из него дороги.\n`;
  }
  if (mandatoryNodes.length > 0) {
    text += `• Для условия «проходящих через город ${mandatoryNodes.join(', ')}»: при расчёте для городов после обязательного пункта учитывайте только дороги, идущие из обязательного города или прошедшие через него (дороги в обход не учитываются).\n`;
  }
  text += `Ответом является значение N в конечном городе ${endNode}.`;
  return text;
}

/**
 * Generates plain text explanation step-by-step without Markdown/LaTeX/backticks/Python.
 */
function buildExplanation(
  numVertices: number,
  adjIn: number[][],
  alphabet: string[],
  subtype: Task9Subtype,
  startNode: string,
  endNode: string,
  mandatoryIndices: number[],
  forbiddenIndices: number[]
): string {
  const lines: string[] = [];
  const mandNames = mandatoryIndices.map(i => alphabet[i]);
  const forbNames = forbiddenIndices.map(i => alphabet[i]);

  lines.push('ШАГ 1. ПРИНЦИП РЕШЕНИЯ');
  lines.push('Для подсчёта количества путей используется метод последовательного подсчёта по городам.');
  lines.push(`Для стартового города N(${startNode}) = 1. Для каждого следующего города N(город) равно сумме N всех городов, из которых в него напрямую входят стрелки.`);

  if (subtype === 'mandatory_1') {
    lines.push(`Маршрут должен обязательно проходить через город ${mandNames[0]}. Для городов, расположенных после города ${mandNames[0]}, учитываются только дороги, прошедшие через него. Дороги, идущие в обход города ${mandNames[0]}, не учитываются.`);
  } else if (subtype === 'forbidden_1') {
    lines.push(`По условию заходить в город ${forbNames[0]} запрещено, поэтому данный город исключается из расчёта (N(${forbNames[0]}) = 0) и не учитывается при подсчёте дорог.`);
  } else if (subtype === 'mandatory_2') {
    lines.push(`Маршрут должен обязательно проходить через города ${mandNames[0]} и ${mandNames[1]}. Дороги, идущие в обход этих обязательных городов, не учитываются.`);
  } else if (subtype === 'mandatory_1_forbidden_1') {
    lines.push(`По условию заходить в город ${forbNames[0]} запрещено, поэтому N(${forbNames[0]}) = 0.`);
    lines.push(`Маршрут должен обязательно проходить через город ${mandNames[0]}, поэтому дороги, идущие в обход города ${mandNames[0]}, не учитываются.`);
  }

  lines.push('');
  lines.push('ШАГ 2. ПОСЛЕДОВАТЕЛЬНЫЙ РАСЧЁТ ЗНАЧЕНИЙ N');

  const dp = computeSingleTableDP(numVertices, adjIn, alphabet, mandatoryIndices, forbiddenIndices);
  lines.push(...dp.lines);
  lines.push('');

  let condStr = '';
  if (subtype === 'mandatory_1') {
    condStr = `, проходящих через город ${mandNames[0]}`;
  } else if (subtype === 'forbidden_1') {
    condStr = `, не заходящих в город ${forbNames[0]}`;
  } else if (subtype === 'mandatory_2') {
    condStr = `, проходящих через города ${mandNames[0]} и ${mandNames[1]}`;
  } else if (subtype === 'mandatory_1_forbidden_1') {
    condStr = `, проходящих через город ${mandNames[0]} и не заходящих в город ${forbNames[0]}`;
  }

  lines.push(`Итоговое количество путей из города ${startNode} в город ${endNode}${condStr} равно ${dp.result}.`);
  lines.push('');
  lines.push(`Ответ: ${dp.result}`);

  return lines.join('\n');
}

/**
 * Attempts candidate graph generation.
 */
function tryGenerateGraph(
  difficulty: Difficulty,
  alphabet: string[],
  relaxed: boolean = false,
  rng?: RNG
): Task9Data | null {
  const isL1 = difficulty === 1;
  const isL2 = difficulty === 2;

  const numVertices = isL1
    ? ((rng ? rng.next() : Math.random()) < 0.5 ? 5 : 6)
    : isL2
    ? ((rng ? rng.next() : Math.random()) < 0.5 ? 6 : 7)
    : (rng ? rng.int(7, 9) : Math.floor(Math.random() * 3) + 7); // 7, 8, 9

  let subtype: Task9Subtype = 'simple';
  if (difficulty === 2) {
    subtype = 'mandatory_1';
  } else if (difficulty === 3) {
    const r = rng ? rng.next() : Math.random();
    if (r < 0.4) subtype = 'mandatory_2';
    else if (r < 0.7) subtype = 'mandatory_1_forbidden_1';
    else subtype = 'forbidden_1';
  }

  const numLayers = isL1 ? 3 : isL2 ? 4 : (rng ? rng.next() : Math.random()) < 0.5 ? 4 : 5;
  const layers: number[] = new Array(numVertices).fill(0);
  layers[0] = 0;
  layers[numVertices - 1] = numLayers;

  const middleLayersCount = numLayers - 1;
  const middleNodesCount = numVertices - 2;

  const assignedLayers: number[] = [];
  for (let l = 1; l < numLayers; l++) {
    assignedLayers.push(l);
  }
  const extraNodes = middleNodesCount - assignedLayers.length;
  for (let e = 0; e < extraNodes; e++) {
    const randL = rng ? rng.int(1, middleLayersCount) : 1 + Math.floor(Math.random() * middleLayersCount);
    assignedLayers.push(randL);
  }
  assignedLayers.sort((a, b) => a - b);

  for (let i = 1; i < numVertices - 1; i++) {
    layers[i] = assignedLayers[i - 1];
  }

  const layerNodes: number[][] = Array.from({ length: numLayers + 1 }, () => []);
  for (let i = 0; i < numVertices; i++) {
    layerNodes[layers[i]].push(i);
  }

  for (let l = 1; l < numLayers; l++) {
    if (layerNodes[l].length === 0) return null;
  }

  const adjOut: number[][] = Array.from({ length: numVertices }, () => []);
  const adjIn: number[][] = Array.from({ length: numVertices }, () => []);
  const edgeSet = new Set<string>();

  const maxOutDegree = 3;
  const maxInDegree = 3;

  function addEdge(u: number, v: number): boolean {
    if (u >= v) return false;
    const key = `${u}->${v}`;
    if (edgeSet.has(key)) return false;
    if (adjOut[u].length >= maxOutDegree || adjIn[v].length >= maxInDegree) return false;

    edgeSet.add(key);
    adjOut[u].push(v);
    adjIn[v].push(u);
    return true;
  }

  for (let l = 0; l < numLayers; l++) {
    const currentList = layerNodes[l];
    const nextList = layerNodes[l + 1];
    for (const u of currentList) {
      const v = rng ? rng.pick(nextList) : nextList[Math.floor(Math.random() * nextList.length)];
      addEdge(u, v);
    }
    for (const v of nextList) {
      const u = rng ? rng.pick(currentList) : currentList[Math.floor(Math.random() * currentList.length)];
      addEdge(u, v);
    }
  }

  const edgeProb = isL1 ? 0.3 : isL2 ? 0.4 : 0.45;
  for (let i = 0; i < numVertices; i++) {
    for (let j = i + 1; j < numVertices; j++) {
      if (i === 0 && j === numVertices - 1 && numLayers > 2) continue;
      if ((rng ? rng.next() : Math.random()) < edgeProb) {
        addEdge(i, j);
      }
    }
  }

  const middleIndices = Array.from({ length: numVertices - 2 }, (_, i) => i + 1);
  let mandatoryIndices: number[] = [];
  let forbiddenIndices: number[] = [];

  if (subtype === 'mandatory_1') {
    const m = rng ? rng.pick(middleIndices) : middleIndices[Math.floor(Math.random() * middleIndices.length)];
    mandatoryIndices = [m];
  } else if (subtype === 'mandatory_2') {
    if (middleIndices.length < 2) return null;
    const shuffled = rng ? rng.shuffle(middleIndices) : [...middleIndices].sort(() => Math.random() - 0.5);
    mandatoryIndices = [shuffled[0], shuffled[1]].sort((a, b) => a - b);
  } else if (subtype === 'forbidden_1') {
    const f = rng ? rng.pick(middleIndices) : middleIndices[Math.floor(Math.random() * middleIndices.length)];
    forbiddenIndices = [f];
  } else if (subtype === 'mandatory_1_forbidden_1') {
    if (middleIndices.length < 2) return null;
    const shuffled = rng ? rng.shuffle(middleIndices) : [...middleIndices].sort(() => Math.random() - 0.5);
    mandatoryIndices = [shuffled[0]];
    forbiddenIndices = [shuffled[1]];
  }

  const evalResult = evaluateGraph(
    numVertices,
    adjOut,
    0,
    numVertices - 1,
    mandatoryIndices,
    forbiddenIndices
  );

  const { totalPaths, validPaths } = evalResult;

  if (validPaths <= 0) return null;

  if (!relaxed) {
    if (difficulty === 1) {
      if (validPaths < 4 || validPaths > 20) return null;
    } else if (difficulty === 2) {
      if (validPaths < 15 || validPaths > 60 || validPaths >= totalPaths) return null;
    } else if (difficulty === 3) {
      if (validPaths < 25 || validPaths > 100 || validPaths >= totalPaths) return null;
    }
  } else {
    if (difficulty === 1) {
      if (validPaths < 3 || validPaths > 25) return null;
    } else if (difficulty === 2) {
      if (validPaths < 8 || validPaths > 60 || validPaths >= totalPaths) return null;
    } else if (difficulty === 3) {
      if (validPaths < 12 || validPaths > 100 || validPaths >= totalPaths) return null;
    }
  }

  const startNodeName = alphabet[0];
  const endNodeName = alphabet[numVertices - 1];
  const mandatoryNodes = mandatoryIndices.map(i => alphabet[i]);
  const forbiddenNodes = forbiddenIndices.map(i => alphabet[i]);

  const xStart = 60;
  const xEnd = 660;
  const yCenter = 220;

  const nodes: Task9Node[] = [];
  for (let l = 0; l <= numLayers; l++) {
    const group = layerNodes[l];
    const k = group.length;
    const x = xStart + l * ((xEnd - xStart) / numLayers);

    const yMin = 70;
    const yMax = 370;

    group.forEach((vIdx, i) => {
      let y = yCenter;
      if (k > 1) {
        y = yMin + i * ((yMax - yMin) / (k - 1));
      }
      nodes.push({
        id: vIdx,
        name: alphabet[vIdx],
        layer: l,
        x,
        y
      });
    });
  }

  nodes.sort((a, b) => a.id - b.id);

  const edgesMap = new Map<string, Task9Edge>();
  for (let u = 0; u < numVertices; u++) {
    for (const v of adjOut[u]) {
      const key = `${u}->${v}`;
      if (!edgesMap.has(key)) {
        edgesMap.set(key, { from: u, to: v });
      }
    }
  }
  const edges = Array.from(edgesMap.values());

  const statementIntro = `На рисунке представлена схема дорог, связывающих города ${alphabet.slice(0, numVertices).join(', ')}. По каждой дороге можно двигаться только в одном направлении, указанном стрелкой.`;

  let questionText = '';
  if (subtype === 'simple') {
    questionText = `Сколько существует различных путей из города ${startNodeName} в город ${endNodeName}?`;
  } else if (subtype === 'mandatory_1') {
    questionText = `Сколько существует различных путей из города ${startNodeName} в город ${endNodeName}, проходящих через город ${mandatoryNodes[0]}?`;
  } else if (subtype === 'mandatory_2') {
    questionText = `Сколько существует различных путей из города ${startNodeName} в город ${endNodeName}, проходящих через города ${mandatoryNodes[0]} и ${mandatoryNodes[1]}?`;
  } else if (subtype === 'forbidden_1') {
    questionText = `Сколько существует различных путей из города ${startNodeName} в город ${endNodeName}, не заходящих в город ${forbiddenNodes[0]}?`;
  } else if (subtype === 'mandatory_1_forbidden_1') {
    questionText = `Сколько существует различных путей из города ${startNodeName} в город ${endNodeName}, проходящих через город ${mandatoryNodes[0]}, но не заходящих в город ${forbiddenNodes[0]}?`;
  }

  const shortHint = buildShortHint(subtype, startNodeName, endNodeName, mandatoryNodes, forbiddenNodes);
  const explanation = buildExplanation(
    numVertices,
    adjIn,
    alphabet,
    subtype,
    startNodeName,
    endNodeName,
    mandatoryIndices,
    forbiddenIndices
  );

  return {
    difficulty,
    subtype,
    alphabet: alphabet === RU_ALPHABET ? 'ru' : 'en',
    nodes,
    edges,
    startNode: startNodeName,
    endNode: endNodeName,
    mandatoryNodes,
    forbiddenNodes,
    correctAnswer: String(validPaths),
    statementIntro,
    questionText,
    shortHint,
    explanation
  };
}

function buildDeterministicFallback(alphabet: string[]): Task9Data {
  const startNodeName = alphabet[0];
  const endNodeName = alphabet[5];
  const edges: Task9Edge[] = [
    { from: 0, to: 1 }, { from: 0, to: 2 },
    { from: 1, to: 3 }, { from: 1, to: 4 },
    { from: 2, to: 4 }, { from: 2, to: 5 },
    { from: 3, to: 5 }, { from: 4, to: 5 }
  ];
  const nodes: Task9Node[] = [
    { id: 0, name: alphabet[0], layer: 0, x: 60, y: 220 },
    { id: 1, name: alphabet[1], layer: 1, x: 260, y: 120 },
    { id: 2, name: alphabet[2], layer: 1, x: 260, y: 320 },
    { id: 3, name: alphabet[3], layer: 2, x: 460, y: 120 },
    { id: 4, name: alphabet[4], layer: 2, x: 460, y: 320 },
    { id: 5, name: alphabet[5], layer: 3, x: 660, y: 220 },
  ];
  const adjIn: number[][] = [[], [0], [0], [1], [1, 2], [2, 3, 4]];
  const statementIntro = `На рисунке представлена схема дорог, связывающих города ${alphabet.slice(0, 6).join(', ')}. По каждой дороге можно двигаться только в одном направлении, указанном стрелкой.`;
  const questionText = `Сколько существует различных путей из города ${startNodeName} в город ${endNodeName}?`;
  return {
    difficulty: 1,
    subtype: 'simple',
    alphabet: alphabet === RU_ALPHABET ? 'ru' : 'en',
    nodes,
    edges,
    startNode: startNodeName,
    endNode: endNodeName,
    mandatoryNodes: [],
    forbiddenNodes: [],
    correctAnswer: '4',
    statementIntro,
    questionText,
    shortHint: buildShortHint('simple', startNodeName, endNodeName, [], []),
    explanation: buildExplanation(6, adjIn, alphabet, 'simple', startNodeName, endNodeName, [], [])
  };
}

export interface RenderEdge {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number;
  midY: number;
  isCurve: boolean;
}

export interface Task9Layout {
  uniqueEdges: Task9Edge[];
  renderEdgesMap: Map<string, RenderEdge>;
}

export function computeTask9Layout(taskData: Task9Data): Task9Layout {
  const nodesMap = new Map<number, Task9Node>();
  taskData.nodes.forEach(n => nodesMap.set(n.id, n));

  const uniqueEdgesMap = new Map<string, Task9Edge>();
  (taskData.edges || []).forEach(edge => {
    const key = `${edge.from}->${edge.to}`;
    if (!uniqueEdgesMap.has(key)) {
      uniqueEdgesMap.set(key, edge);
    }
  });
  const uniqueEdges = Array.from(uniqueEdgesMap.values());

  const allNodes = taskData.nodes;
  const R = 18;

  // Candidate offsets for arc curvature
  const candidateOffsets = [-55, -40, -28, -16, 0, 16, 28, 40, 55];
  const W1 = 3; // weight for crossings
  const W2 = 5; // weight for near node penalty
  const W3 = 6; // weight for edge proximity penalty

  interface PlacedEdge {
    edge: Task9Edge;
    u: Task9Node;
    v: Task9Node;
    control: RenderPoint;
    offset: number;
    polyline: RenderPoint[];
    bbox: PolylineBBox;
    segBoxes: PolylineBBox[];
  }

  const placedEdges: PlacedEdge[] = [];

  // Sort edges: short layerDiff <= 1 first, then long layerDiff >= 2 sorted by diff then u.x
  const sortedEdgesToPlace = [...uniqueEdges].sort((a, b) => {
    const uA = nodesMap.get(a.from)!;
    const vA = nodesMap.get(a.to)!;
    const uB = nodesMap.get(b.from)!;
    const vB = nodesMap.get(b.to)!;
    const diffA = vA.layer - uA.layer;
    const diffB = vB.layer - uB.layer;
    if (diffA <= 1 && diffB > 1) return -1;
    if (diffA > 1 && diffB <= 1) return 1;
    if (diffA !== diffB) return diffA - diffB;
    return uA.x - uB.x;
  });

  for (const edge of sortedEdgesToPlace) {
    const u = nodesMap.get(edge.from)!;
    const v = nodesMap.get(edge.to)!;
    const layerDiff = v.layer - u.layer;

    const midX = (u.x + v.x) / 2;
    const midY = (u.y + v.y) / 2;
    const len = Math.hypot(v.x - u.x, v.y - u.y) || 1;
    const nx = -(v.y - u.y) / len;
    const ny = (v.x - u.x) / len;

    const numSamples = layerDiff >= 2 ? 28 : 10;

    // Check straight line (offset = 0)
    const straightControl = { x: midX, y: midY };
    const straightPoly = sampleBezier(u, straightControl, v, numSamples);
    const straightBBox = computePolylineBBox(straightPoly);
    const straightSegBoxes = computePolylineSegBoxes(straightPoly);

    let straightNearPenalty = 0;
    let nearbyNodesCount = 0;
    for (const node of allNodes) {
      if (node.id === u.id || node.id === v.id) continue;
      const d = distToPolyline(node, straightPoly);
      if (d < 35) nearbyNodesCount++;
      if (d < 32) straightNearPenalty += (32 - d);
      if (d < R) straightNearPenalty += 200;
    }

    let straightCrossings = 0;
    let straightEdgeProximityPen = 0;
    for (const prev of placedEdges) {
      straightCrossings += countPolylineIntersections(
        straightPoly,
        prev.polyline,
        straightBBox,
        prev.bbox,
        straightSegBoxes,
        prev.segBoxes
      );
      straightEdgeProximityPen += polylineProximityPenalty(
        straightPoly,
        prev.polyline,
        16,
        straightBBox,
        prev.bbox,
        straightSegBoxes,
        prev.segBoxes
      );
    }

    const nearbyEdgesCount = straightCrossings;
    const isHotZone = (nearbyNodesCount + nearbyEdgesCount >= 3) || straightNearPenalty > 0 || straightCrossings > 0 || straightEdgeProximityPen > 0;

    let bestOffset = 0;
    let bestControl = straightControl;
    let bestPoly = straightPoly;
    let bestBBox = straightBBox;
    let bestSegBoxes = straightSegBoxes;

    if (layerDiff >= 2 || isHotZone) {
      let minCost = Infinity;
      let minAbsOffset = Infinity;
      let bestIsPrefSign = false;

      const prevOffsetsFromU = placedEdges
        .filter(p => p.u.id === u.id && Math.abs(p.offset) > 0)
        .map(p => p.offset);

      for (const offset of candidateOffsets) {
        const rawCy = midY + offset * ny;
        const rawCx = midX + offset * nx;
        const cy = Math.max(10, Math.min(430, rawCy));
        const cx = Math.max(10, Math.min(710, rawCx));
        const control = { x: cx, y: cy };
        const poly = sampleBezier(u, control, v, numSamples);
        const polyBBox = computePolylineBBox(poly);
        const polySegBoxes = computePolylineSegBoxes(poly);

        let nearNodePen = 0;
        for (const node of allNodes) {
          if (node.id === u.id || node.id === v.id) continue;
          const d = distToPolyline(node, poly);
          if (d < 32) nearNodePen += (32 - d);
          if (d < R) nearNodePen += 200;
        }

        let crossings = 0;
        let edgeProximityPen = 0;
        for (const prev of placedEdges) {
          crossings += countPolylineIntersections(
            poly,
            prev.polyline,
            polyBBox,
            prev.bbox,
            polySegBoxes,
            prev.segBoxes
          );
          edgeProximityPen += polylineProximityPenalty(
            poly,
            prev.polyline,
            16,
            polyBBox,
            prev.bbox,
            polySegBoxes,
            prev.segBoxes
          );
        }

        const cost = crossings * W1 + nearNodePen * W2 + edgeProximityPen * W3;
        const absOff = Math.abs(offset);
        const isPref = getSignPreference(offset, prevOffsetsFromU);

        let isBetter = false;
        if (cost < minCost) {
          isBetter = true;
        } else if (cost === minCost) {
          if (isPref && !bestIsPrefSign) {
            isBetter = true;
          } else if (isPref === bestIsPrefSign) {
            if (absOff < minAbsOffset) {
              isBetter = true;
            }
          }
        }

        if (isBetter) {
          minCost = cost;
          bestIsPrefSign = isPref;
          minAbsOffset = absOff;
          bestOffset = offset;
          bestControl = control;
          bestPoly = poly;
          bestBBox = polyBBox;
          bestSegBoxes = polySegBoxes;
        }
      }
    }

    placedEdges.push({
      edge,
      u,
      v,
      control: bestControl,
      offset: bestOffset,
      polyline: bestPoly,
      bbox: bestBBox,
      segBoxes: bestSegBoxes
    });
  }

  // Arrowhead Attachment Points on Node Circle Boundaries with angular dispersal
  const renderEdgesMap = new Map<string, RenderEdge>();

  const nodeIncoming = new Map<number, { edgeKey: string; angle: number }[]>();
  const nodeOutgoing = new Map<number, { edgeKey: string; angle: number }[]>();

  placedEdges.forEach(item => {
    const key = `${item.edge.from}->${item.edge.to}`;
    const u = item.u;
    const v = item.v;
    const ctrl = item.control;

    const outDx = ctrl.x - u.x;
    const outDy = ctrl.y - u.y;
    const outAngle = Math.atan2(outDy, outDx);

    const inDx = v.x - ctrl.x;
    const inDy = v.y - ctrl.y;
    const inAngle = Math.atan2(inDy, inDx);

    if (!nodeOutgoing.has(u.id)) nodeOutgoing.set(u.id, []);
    nodeOutgoing.get(u.id)!.push({ edgeKey: key, angle: outAngle });

    if (!nodeIncoming.has(v.id)) nodeIncoming.set(v.id, []);
    nodeIncoming.get(v.id)!.push({ edgeKey: key, angle: inAngle });
  });

  const edgeAdjustedAngles = new Map<string, { outAngle: number; inAngle: number }>();
  placedEdges.forEach(item => {
    const key = `${item.edge.from}->${item.edge.to}`;
    const u = item.u;
    const v = item.v;
    const ctrl = item.control;
    const outAngle = Math.atan2(ctrl.y - u.y, ctrl.x - u.x);
    const inAngle = Math.atan2(v.y - ctrl.y, v.x - ctrl.x);
    edgeAdjustedAngles.set(key, { outAngle, inAngle });
  });

  // Disperse incoming angles at each node v if difference < 15 deg (0.2618 rad)
  nodeIncoming.forEach((list) => {
    if (list.length > 1) {
      list.sort((a, b) => a.angle - b.angle);
      let hasClose = false;
      for (let i = 0; i < list.length - 1; i++) {
        if (Math.abs(list[i + 1].angle - list[i].angle) < 0.2618) {
          hasClose = true;
          break;
        }
      }
      if (hasClose) {
        const k = list.length;
        const avgAngle = list.reduce((sum, item) => sum + item.angle, 0) / k;
        const step = 0.244; // ~14 degrees
        list.forEach((item, idx) => {
          const adjInAngle = avgAngle + (idx - (k - 1) / 2) * step;
          const current = edgeAdjustedAngles.get(item.edgeKey)!;
          edgeAdjustedAngles.set(item.edgeKey, { ...current, inAngle: adjInAngle });
        });
      }
    }
  });

  // Disperse outgoing angles at each node u if difference < 15 deg (0.2618 rad)
  nodeOutgoing.forEach((list) => {
    if (list.length > 1) {
      list.sort((a, b) => a.angle - b.angle);
      let hasClose = false;
      for (let i = 0; i < list.length - 1; i++) {
        if (Math.abs(list[i + 1].angle - list[i].angle) < 0.2618) {
          hasClose = true;
          break;
        }
      }
      if (hasClose) {
        const k = list.length;
        const avgAngle = list.reduce((sum, item) => sum + item.angle, 0) / k;
        const step = 0.244; // ~14 degrees
        list.forEach((item, idx) => {
          const adjOutAngle = avgAngle + (idx - (k - 1) / 2) * step;
          const current = edgeAdjustedAngles.get(item.edgeKey)!;
          edgeAdjustedAngles.set(item.edgeKey, { ...current, outAngle: adjOutAngle });
        });
      }
    }
  });

  placedEdges.forEach(item => {
    const key = `${item.edge.from}->${item.edge.to}`;
    const { outAngle, inAngle } = edgeAdjustedAngles.get(key)!;
    const u = item.u;
    const v = item.v;

    const x1 = u.x + Math.cos(outAngle) * R;
    const y1 = u.y + Math.sin(outAngle) * R;

    const x2 = v.x - Math.cos(inAngle) * R;
    const y2 = v.y - Math.sin(inAngle) * R;

    const isCurve = Math.abs(item.offset) > 0;

    renderEdgesMap.set(key, {
      key: `e-${item.edge.from}-${item.edge.to}`,
      x1,
      y1,
      x2,
      y2,
      midX: item.control.x,
      midY: item.control.y,
      isCurve
    });
  });

  return { uniqueEdges, renderEdgesMap };
}

const layoutCache = new WeakMap<Task9Data, Task9Layout>();

export function getTask9Layout(taskData: Task9Data): Task9Layout {
  let layout = layoutCache.get(taskData);
  if (!layout) {
    layout = computeTask9Layout(taskData);
    layoutCache.set(taskData, layout);
  }
  return layout;
}

export const task9: TaskModule = {
  id: 9,
  title: 'Анализ информации, представленной в виде схем',
  description: 'Подсчёт количества различных путей в ориентированном графе (схема дорог).',
  topics: ['Анализ схем и графов', 'Подсчёт путей'], // TODO: уточнить формулировки
  maxPoints: 1,

  generate: (difficulty: Difficulty, rng: RNG): Task9Data => {
    const isRu = (rng ? rng.next() : Math.random()) < 0.5;
    const alphabet = isRu ? RU_ALPHABET : EN_ALPHABET;

    for (let attempt = 0; attempt < 300; attempt++) {
      const candidate = tryGenerateGraph(difficulty, alphabet, false, rng);
      if (candidate) return candidate;
    }

    for (let attempt = 0; attempt < 200; attempt++) {
      const candidate = tryGenerateGraph(difficulty, alphabet, true, rng);
      if (candidate) return candidate;
    }

    for (let attempt = 0; attempt < 100; attempt++) {
      const candidate = tryGenerateGraph(1, alphabet, true, rng);
      if (candidate) return candidate;
    }

    return buildDeterministicFallback(alphabet);
  },

  render: (taskData: Task9Data, state: TaskModuleState) => {
    if (!taskData || !taskData.nodes) {
      return (
        <div className="p-4 text-center text-slate-500">
          Загрузка задания...
        </div>
      );
    }

    const { uniqueEdges, renderEdgesMap } = getTask9Layout(taskData);

    return (
      <div className="space-y-4">
        {/* Task statement block */}
        <StatementBlock>
          <StatementText>
            {taskData.statementIntro}
          </StatementText>

          {/* SVG Diagram SubBlock */}
          <SubBlock>
            <BlockLabel>Схема дорог (ориентированный граф):</BlockLabel>

            <div className="w-full overflow-x-auto py-2 flex justify-center items-center">
              <svg
                viewBox="0 0 720 440"
                className="w-full max-w-2xl h-auto select-none"
              >
                <defs>
                  <marker
                    id="task9-arrow"
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" className="fill-indigo-600 dark:fill-indigo-400" />
                  </marker>
                </defs>

                {/* Render edges */}
                {uniqueEdges.map((edge) => {
                  const edgeKey = `${edge.from}->${edge.to}`;
                  const rEdge = renderEdgesMap.get(edgeKey);
                  if (!rEdge) return null;

                  if (!rEdge.isCurve) {
                    return (
                      <line
                        key={rEdge.key}
                        x1={rEdge.x1}
                        y1={rEdge.y1}
                        x2={rEdge.x2}
                        y2={rEdge.y2}
                        className="stroke-indigo-500 dark:stroke-indigo-400 stroke-2"
                        markerEnd="url(#task9-arrow)"
                      />
                    );
                  } else {
                    return (
                      <path
                        key={rEdge.key}
                        d={`M ${rEdge.x1} ${rEdge.y1} Q ${rEdge.midX} ${rEdge.midY} ${rEdge.x2} ${rEdge.y2}`}
                        fill="none"
                        className="stroke-indigo-500 dark:stroke-indigo-400 stroke-2 opacity-85"
                        markerEnd="url(#task9-arrow)"
                      />
                    );
                  }
                })}

                {/* Render nodes */}
                {taskData.nodes.map((node) => {
                  const circleClass = "fill-slate-50 dark:fill-slate-800 stroke-indigo-600 dark:stroke-indigo-400 stroke-2";

                  return (
                    <g key={`n-${node.id}`}>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={18}
                        className={circleClass}
                      />
                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        className="font-extrabold text-sm fill-slate-900 dark:fill-slate-100 select-none"
                      >
                        {node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </SubBlock>

          {/* Question Text */}
          <StatementQuestion className="pt-2 border-t border-theme-statement-border/50">
            {taskData.questionText}
          </StatementQuestion>
        </StatementBlock>

        {/* Input field */}
        <AnswerField
          label="Ваш ответ (число):"
          value={state.userAnswer}
          onChange={(val) => state.setUserAnswer(val)}
          disabled={state.isSubmitted}
          placeholder="Введите количество путей…"
          maxWidth="xs"
        />

        {/* Verification Result Feedback Overlay */}
        {state.isSubmitted && (
          <VerdictBox status={state.isCorrect ? 'correct' : 'wrong'}>
            {state.isCorrect ? (
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Верно! Ответ правильный.</span>
              </span>
            ) : (
              <div className="space-y-1">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span>Неверно.</span>
                </span>
                <p className="text-[11px] font-medium opacity-95">
                  Правильный ответ: <AnswerChip>{taskData.correctAnswer}</AnswerChip>
                </p>
              </div>
            )}
          </VerdictBox>
        )}

        {/* Clue Hint (shortHint) before submission */}
        {state.showHints && !state.isSubmitted && (
          <HintBox>
            <strong className="block font-extrabold text-sm mb-1.5">💡 Подсказка-наводка:</strong>
            {taskData.shortHint}
          </HintBox>
        )}

        {/* Full explanation of the solution shown AFTER submission */}
        {state.isSubmitted && (
          <div className="p-5 bg-theme-solution-bg border border-theme-solution-border text-sm text-theme-solution-text rounded-xl leading-relaxed whitespace-pre-line shadow-sm font-semibold">
            <strong className="block text-slate-900 dark:text-white font-extrabold text-base mb-2">📖 Подробное решение (подсчёт по городам):</strong>
            <div className="space-y-1">
              {taskData.explanation}
            </div>
          </div>
        )}
      </div>
    );
  },

  check: (taskData: Task9Data, userAnswer: string) => {
    if (!userAnswer) return false;
    const cleanUser = userAnswer.trim();
    const cleanCorrect = taskData.correctAnswer.trim();
    return parseInt(cleanUser, 10) === parseInt(cleanCorrect, 10);
  }
};

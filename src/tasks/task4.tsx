import React from 'react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { RNG } from '../utils/rng';
import {
  StatementBlock,
  StatementText,
  StatementQuestion,
  SubBlock,
  BlockLabel,
  DataTable,
  Th,
  Td,
  AnswerField,
  AnswerChip,
  VerdictBox,
  HintBox,
} from '../components/task-ui';

export const CITIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export type Task4Subtype = 'simple' | 'mandatory_1' | 'forbidden_1' | 'mandatory_2';

export interface PathResult {
  nodes: number[]; // Index of vertices, e.g. [0, 2, 4] -> A -> C -> E
  edges: number[]; // Edge weights, e.g. [5, 3]
  totalLength: number;
}

export interface Task4Data {
  level: Difficulty;
  subtype: Task4Subtype;
  vertices: string[];              // e.g. ['A', 'B', 'C', 'D', 'E', 'F']
  matrix: (number | null)[][];    // N x N adjacency matrix
  startNode: string;              // 'A'
  endNode: string;                // 'F'
  mandatoryNodes: string[];       // e.g. ['C'] or ['C', 'E']
  forbiddenNode?: string;         // e.g. 'D'
  correctAnswer: string;          // e.g. "14"
  statementIntro: string;
  questionText: string;
  shortHint: string;
  explanation: string;
}

/**
 * Finds ALL simple paths in a weighted graph from startNode to endNode.
 */
export function findAllPaths(
  matrix: (number | null)[][],
  startNode: number,
  endNode: number,
  forbiddenNode?: number
): PathResult[] {
  const n = matrix.length;
  const results: PathResult[] = [];

  function dfs(
    curr: number,
    visited: boolean[],
    currentNodes: number[],
    currentEdges: number[],
    currentLength: number
  ) {
    if (curr === endNode) {
      results.push({
        nodes: [...currentNodes],
        edges: [...currentEdges],
        totalLength: currentLength
      });
      return;
    }

    for (let next = 0; next < n; next++) {
      if (forbiddenNode !== undefined && next === forbiddenNode) continue;
      if (visited[next]) continue;
      const weight = matrix[curr][next];
      if (weight !== null) {
        visited[next] = true;
        currentNodes.push(next);
        currentEdges.push(weight);
        dfs(next, visited, currentNodes, currentEdges, currentLength + weight);
        currentNodes.pop();
        currentEdges.pop();
        visited[next] = false;
      }
    }
  }

  const visited = new Array(n).fill(false);
  visited[startNode] = true;
  if (forbiddenNode !== undefined) visited[forbiddenNode] = true;

  dfs(startNode, visited, [startNode], [], 0);
  return results;
}

/**
 * Computes standard greedy path from startNode to endNode by picking smallest unvisited edge at each step.
 */
export function getGreedyPath(
  matrix: (number | null)[][],
  startNode: number,
  endNode: number
): PathResult | null {
  const n = matrix.length;
  const visited = new Array(n).fill(false);
  const nodes = [startNode];
  const edges: number[] = [];
  let current = startNode;
  visited[current] = true;
  let totalLen = 0;

  while (current !== endNode) {
    let bestNext = -1;
    let minW = Infinity;

    for (let next = 0; next < n; next++) {
      if (!visited[next] && matrix[current][next] !== null) {
        const w = matrix[current][next]!;
        if (w < minW) {
          minW = w;
          bestNext = next;
        }
      }
    }

    if (bestNext === -1) return null; // Stuck

    visited[bestNext] = true;
    nodes.push(bestNext);
    edges.push(minW);
    totalLen += minW;
    current = bestNext;
  }

  return { nodes, edges, totalLength: totalLen };
}

/**
 * Checks if path satisfies mandatory and forbidden constraints.
 */
function isValidUnderConstraint(
  path: PathResult,
  mandatoryIndices: number[],
  forbiddenIdx?: number
): boolean {
  if (forbiddenIdx !== undefined && path.nodes.includes(forbiddenIdx)) {
    return false;
  }
  for (const m of mandatoryIndices) {
    if (!path.nodes.includes(m)) return false;
  }
  return true;
}

/**
 * Builds step-by-step plain text explanation without Markdown/LaTeX/backticks/Python.
 * Shows optimal route, 3-5 closest valid competitors, and 1-2 key traps.
 */
function buildExplanation(
  vertices: string[],
  startNode: string,
  endNode: string,
  subtype: Task4Subtype,
  mandatoryNodes: string[],
  forbiddenNode: string | undefined,
  allPaths: PathResult[],
  validPaths: PathResult[],
  minLen: number,
  greedyPath: PathResult | null
): string {
  const lines: string[] = [];

  lines.push('ШАГ 1. УСЛОВИЕ И ОГРАНИЧЕНИЯ');
  lines.push(`Начальный пункт: ${startNode}.`);
  lines.push(`Конечный пункт: ${endNode}.`);

  if (subtype === 'mandatory_1') {
    lines.push(`Обязательный промежуточный пункт: ${mandatoryNodes[0]}.`);
  } else if (subtype === 'mandatory_2') {
    lines.push(`Обязательные промежуточные пункты: ${mandatoryNodes.join(' и ')} (в любом порядке).`);
  } else if (subtype === 'forbidden_1') {
    lines.push(`Запрещённый пункт (маршрут не должен проходить через него): ${forbiddenNode}.`);
  } else {
    lines.push('Ограничения по промежуточным пунктам отсутствуют.');
  }
  lines.push('Передвигаться можно только по дорогам, длина которых указана в таблице.');
  lines.push('');

  lines.push('ШАГ 2. АНАЛИЗ КЛЮЧЕВЫХ МАРШРУТОВ');

  const sortedValid = [...validPaths].sort((a, b) => a.totalLength - b.totalLength);
  const optimalPath = sortedValid[0];
  const routeKey = (p: PathResult) => p.nodes.join(',');
  const routeStr = (p: PathResult) => p.nodes.map(i => vertices[i]).join(' -> ');
  const stepsStr = (p: PathResult) => p.edges.join(' + ');

  lines.push('1) Кратчайший допустимый маршрут:');
  lines.push(`   Маршрут: ${routeStr(optimalPath)}`);
  lines.push(`   Длина: ${stepsStr(optimalPath)} = ${optimalPath.totalLength} км.`);
  lines.push('');

  // 3-5 closest valid competing routes
  const competitors = sortedValid.slice(1, 4);
  if (competitors.length > 0) {
    lines.push('2) Ближайшие конкурирующие допустимые маршруты:');
    competitors.forEach((p) => {
      const diff = p.totalLength - minLen;
      lines.push(`   • ${routeStr(p)}: ${stepsStr(p)} = ${p.totalLength} км (длиннее на ${diff} км).`);
    });
    lines.push('');
  }

  // Trap routes: strictly INVALID paths that violate constraints
  const validKeys = new Set(validPaths.map(routeKey));
  const invalidPaths = allPaths.filter(p => !validKeys.has(routeKey(p)));
  const trapCandidates: PathResult[] = [];

  if (greedyPath && !validKeys.has(routeKey(greedyPath))) {
    trapCandidates.push(greedyPath);
  }

  for (const inv of invalidPaths) {
    if (trapCandidates.length >= 2) break;
    if (!trapCandidates.some(t => routeKey(t) === routeKey(inv))) {
      trapCandidates.push(inv);
    }
  }

  if (trapCandidates.length > 0) {
    lines.push('3) Характерные маршруты-ловушки:');
    trapCandidates.slice(0, 2).forEach((p) => {
      const pNodes = p.nodes.map(i => vertices[i]);
      const pRouteStr = pNodes.join(' -> ');
      const pStepsStr = p.edges.join(' + ');
      let reason = '';
      if (forbiddenNode && pNodes.includes(forbiddenNode)) {
        reason = `проходит через запрещённый пункт ${forbiddenNode}`;
      } else if (mandatoryNodes.length > 0) {
        const missing = mandatoryNodes.filter(m => !pNodes.includes(m));
        if (missing.length > 0) {
          reason = `не проходит через обязательный пункт ${missing.join(', ')}`;
        }
      }
      if (!reason) {
        reason = 'не удовлетворяет ограничениям задачи';
      }
      lines.push(`   • ${pRouteStr} (${pStepsStr} = ${p.totalLength} км): НЕ ПОДХОДИТ (${reason}).`);
    });
    lines.push('');
  }

  lines.push('ШАГ 3. ИТОГОВЫЙ ВЫВОД');
  lines.push(`Минимальная длина кратчайшего пути с учётом всех условий: ${minLen} км.`);
  lines.push(`Ответ: ${minLen}.`);

  return lines.join('\n');
}

/**
 * Helper to construct fallback templates if random generator misses constraints after many attempts.
 */
function getFallbackTask(difficulty: Difficulty): Task4Data {
  if (difficulty === 1) {
    const vertices = ['A', 'B', 'C', 'D', 'E'];
    const matrix: (number | null)[][] = [
      [null, 3, 4, null, null],
      [3, null, 1, 5, null],
      [4, 1, null, 2, 6],
      [null, 5, 2, null, 3],
      [null, null, 6, 3, null]
    ];
    const allPaths = findAllPaths(matrix, 0, 4);
    const minLen = 9; // A -> C -> D -> E = 4 + 2 + 3 = 9
    const validPaths = allPaths;

    const explanation = buildExplanation(
      vertices, 'A', 'E', 'simple', [], undefined,
      allPaths, validPaths, minLen, null
    );

    return {
      level: 1,
      subtype: 'simple',
      vertices,
      matrix,
      startNode: 'A',
      endNode: 'E',
      mandatoryNodes: [],
      correctAnswer: String(minLen),
      statementIntro: 'Между населёнными пунктами A, B, C, D, E построены дороги, протяжённость которых (в километрах) приведена в таблице. Отсутствие числа в таблице означает, что прямой дороги между пунктами нет.',
      questionText: 'Найдите длину кратчайшего пути между пунктами A и E. Передвигаться можно только по дорогам, протяжённость которых указана в таблице.',
      shortHint: '• Постройте дерево путей от начального пункта A к конечному пункту E.\n• Посчитайте сумму расстояний для каждого возможного маршрута.\n• Выберите наименьшее итоговое число.',
      explanation
    };
  }

  if (difficulty === 2) {
    const vertices = ['A', 'B', 'C', 'D', 'E', 'F'];
    const matrix: (number | null)[][] = [
      [null, 2, 6, 5, null, null],
      [2, null, null, null, 4, null],
      [6, null, null, 2, null, 4],
      [5, null, 2, null, null, null],
      [null, 4, null, null, null, 3],
      [null, null, 4, null, 3, null]
    ];
    const allPaths = findAllPaths(matrix, 0, 5);
    const validPaths = allPaths.filter(p => p.nodes.includes(2));
    const minLen = 10; // A -> C -> F = 6 + 4 = 10 or A -> D -> C -> F = 5 + 2 + 4 = 11

    const explanation = buildExplanation(
      vertices, 'A', 'F', 'mandatory_1', ['C'], undefined,
      allPaths, validPaths, minLen, { nodes: [0, 1, 4, 5], edges: [2, 4, 3], totalLength: 9 }
    );

    return {
      level: 2,
      subtype: 'mandatory_1',
      vertices,
      matrix,
      startNode: 'A',
      endNode: 'F',
      mandatoryNodes: ['C'],
      correctAnswer: String(minLen),
      statementIntro: 'Между населёнными пунктами A, B, C, D, E, F построены дороги, протяжённость которых (в километрах) приведена в таблице. Отсутствие числа в таблице означает, что прямой дороги между пунктами нет.',
      questionText: 'Найдите длину кратчайшего пути между пунктами A и F, проходящего через пункт C. Передвигаться можно только по дорогам, протяжённость которых указана в таблице.',
      shortHint: '• Выпишите из таблицы все возможные варианты движения из A в F.\n• Засчитывайте только те маршруты, которые обязательно проходят через пункт C.\n• Обратите внимание: короткий путь A-B-E-F пропускает пункт C и является ловушкой!',
      explanation
    };
  }

  // Difficulty 3 fallback
  const vertices = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const matrix: (number | null)[][] = [
    [null, 2, 4, 2, null, null, null],
    [2, null, 2, null, null, null, null],
    [4, 2, null, 3, 3, null, 4],
    [2, null, 3, null, 2, null, 3],
    [null, null, 3, 2, null, 2, 4],
    [null, null, null, null, 2, null, 3],
    [null, null, 4, 3, 4, 3, null]
  ];
  const allPaths = findAllPaths(matrix, 0, 6);
  const validPaths = allPaths.filter(p => p.nodes.includes(2) && p.nodes.includes(4));
  const minLen = 11; // A -> C -> E -> G = 4 + 3 + 4 = 11 OR A -> D -> E -> C -> G = 2 + 2 + 3 + 4 = 11

  const explanation = buildExplanation(
    vertices, 'A', 'G', 'mandatory_2', ['C', 'E'], undefined,
    allPaths, validPaths, minLen, { nodes: [0, 3, 6], edges: [2, 3], totalLength: 5 }
  );

  return {
    level: 3,
    subtype: 'mandatory_2',
    vertices,
    matrix,
    startNode: 'A',
    endNode: 'G',
    mandatoryNodes: ['C', 'E'],
    correctAnswer: String(minLen),
    statementIntro: 'Между населёнными пунктами A, B, C, D, E, F, G построены дороги, протяжённость которых (в километрах) приведена в таблице. Отсутствие числа в таблице означает, что прямой дороги между пунктами нет.',
    questionText: 'Найдите длину кратчайшего пути между пунктами A и G, проходящего через пункты C и E (в любом порядке). Передвигаться можно только по дорогам, протяжённость которых указана в таблице.',
    shortHint: '• Постройте варианты движения от A к G.\n• Убедитесь, что маршрут содержит ОБА обязательных пункта (C и E).\n• Не выбирайте самый короткий прямой путь A-D-G, так как он пропускает C и E.',
    explanation
  };
}

export const task4: TaskModule = {
  id: 4,
  title: 'Формальные описания объектов и процессов',
  description: 'Поиск кратчайшего пути по таблице расстояний (графу).',
  topics: ['Анализ моделей', 'Графы и таблицы'], // TODO: уточнить формулировки
  maxPoints: 1,

  generate: (difficulty: Difficulty, rng: RNG): Task4Data => {
    const weightsPool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15];

    for (let attempt = 0; attempt < 350; attempt++) {
      let numVertices = 4;
      if (difficulty === 1) {
        numVertices = rng.next() < 0.5 ? 4 : 5;
      } else if (difficulty === 2) {
        numVertices = rng.next() < 0.5 ? 5 : 6;
      } else {
        numVertices = rng.next() < 0.5 ? 6 : 7;
      }

      const vertices = CITIES.slice(0, numVertices);

      let startIdx = 0;
      let endIdx = numVertices - 1;

      if (difficulty === 2) {
        // End node is arbitrary (1..numVertices - 1)
        startIdx = 0;
        endIdx = rng.int(1, numVertices - 1);
      } else if (difficulty === 3) {
        // Both start and end node are arbitrary (startIdx !== endIdx)
        startIdx = rng.int(0, numVertices - 1);
        do {
          endIdx = rng.int(0, numVertices - 1);
        } while (endIdx === startIdx);
      }

      // Candidate intermediate indices (strictly excluding startIdx and endIdx)
      const midCandidates: number[] = [];
      for (let i = 0; i < numVertices; i++) {
        if (i !== startIdx && i !== endIdx) {
          midCandidates.push(i);
        }
      }

      let subtype: Task4Subtype = 'simple';
      let mandatoryIndices: number[] = [];
      let forbiddenIdx: number | undefined = undefined;

      if (difficulty === 2) {
        if (midCandidates.length < 1) continue;
        if (rng.next() < 0.7) {
          subtype = 'mandatory_1';
          const m1 = rng.pick(midCandidates);
          mandatoryIndices = [m1];
        } else {
          subtype = 'forbidden_1';
          forbiddenIdx = rng.pick(midCandidates);
        }
      } else if (difficulty === 3) {
        subtype = 'mandatory_2';
        if (midCandidates.length < 2) continue;
        const shuffledMids = rng.shuffle(midCandidates);
        mandatoryIndices = [shuffledMids[0], shuffledMids[1]].sort((a, b) => a - b);
      }

      // Generate random symmetric adjacency matrix
      const matrix: (number | null)[][] = Array.from({ length: numVertices }, () =>
        new Array(numVertices).fill(null)
      );

      for (let i = 0; i < numVertices; i++) {
        for (let j = i + 1; j < numVertices; j++) {
          const isDirect = (i === Math.min(startIdx, endIdx) && j === Math.max(startIdx, endIdx));
          const prob = isDirect ? 0.35 : 0.6;
          if (rng.next() < prob) {
            const w = rng.pick(weightsPool);
            matrix[i][j] = w;
            matrix[j][i] = w;
          }
        }
      }

      // Find ALL simple paths in graph from startIdx to endIdx
      const allPaths = findAllPaths(matrix, startIdx, endIdx, forbiddenIdx);
      if (allPaths.length < 2) continue;

      // Filter paths according to constraints
      let validPaths = allPaths;
      if (subtype === 'mandatory_1') {
        const m = mandatoryIndices[0];
        validPaths = allPaths.filter(p => p.nodes.includes(m));
      } else if (subtype === 'mandatory_2') {
        const m1 = mandatoryIndices[0];
        const m2 = mandatoryIndices[1];
        validPaths = allPaths.filter(p => p.nodes.includes(m1) && p.nodes.includes(m2));
      }

      if (validPaths.length === 0) continue;

      // Requirement for Level 3: multiple different routes passing through both mandatory points exist
      if (difficulty === 3 && validPaths.length < 2) continue;

      // Find optimal path & min length
      let minLen = Infinity;
      for (const p of validPaths) {
        if (p.totalLength < minLen) {
          minLen = p.totalLength;
        }
      }
      if (!isFinite(minLen)) continue;

      // Common guard across all difficulty levels: direct route must not be optimal
      if (matrix[startIdx][endIdx] !== null && matrix[startIdx][endIdx]! <= minLen) {
        continue;
      }
      if (validPaths.some(p => p.totalLength === minLen && p.nodes.length <= 2)) {
        continue;
      }

      // Check greedy path trap for Levels 2 and 3
      const greedyPath = getGreedyPath(matrix, startIdx, endIdx);

      if (difficulty >= 2) {
        let greedyIsTrap = false;
        const directWeight = matrix[startIdx][endIdx];

        if (directWeight !== null) {
          if (subtype === 'mandatory_1' || subtype === 'mandatory_2') {
            // Direct edge misses mandatory points! Trap!
            greedyIsTrap = true;
          } else if (subtype === 'forbidden_1' && forbiddenIdx !== undefined && (startIdx === forbiddenIdx || endIdx === forbiddenIdx)) {
            greedyIsTrap = true;
          } else if (directWeight > minLen) {
            greedyIsTrap = true;
          }
        }

        if (greedyPath) {
          const greedyValid = isValidUnderConstraint(greedyPath, mandatoryIndices, forbiddenIdx);
          if (!greedyValid || greedyPath.totalLength > minLen) {
            greedyIsTrap = true;
          }
        }

        if (!greedyIsTrap) continue;
      }

      // Prepare taskData
      const startNode = vertices[startIdx];
      const endNode = vertices[endIdx];
      const mandatoryNodes = mandatoryIndices.map(i => vertices[i]);
      const forbiddenNode = forbiddenIdx !== undefined ? vertices[forbiddenIdx] : undefined;

      const statementIntro = `Между населёнными пунктами ${vertices.join(', ')} построены дороги, протяжённость которых (в километрах) приведена в таблице. Отсутствие числа в таблице означает, что прямой дороги между пунктами нет.`;

      let questionText = `Найдите длину кратчайшего пути между пунктами ${startNode} и ${endNode}. Передвигаться можно только по дорогам, протяжённость которых указана в таблице.`;

      if (subtype === 'mandatory_1') {
        questionText = `Найдите длину кратчайшего пути между пунктами ${startNode} и ${endNode}, проходящего через пункт ${mandatoryNodes[0]}. Передвигаться можно только по дорогам, протяжённость которых указана в таблице.`;
      } else if (subtype === 'forbidden_1') {
        questionText = `Найдите длину кратчайшего пути между пунктами ${startNode} и ${endNode}, не проходящего через пункт ${forbiddenNode}. Передвигаться можно только по дорогам, протяжённость которых указана в таблице.`;
      } else if (subtype === 'mandatory_2') {
        questionText = `Найдите длину кратчайшего пути между пунктами ${startNode} и ${endNode}, проходящего через пункты ${mandatoryNodes.join(' и ')} (в любом порядке). Передвигаться можно только по дорогам, протяжённость которых указана в таблице.`;
      }

      let shortHint = '• Выпишите все возможные варианты движения от начального пункта к конечному.\n• Проверьте выполнение всех условий прохода через обязательные пункты или обхода запрещённых.\n• Сложите расстояния на каждом звене пути и выберите минимальную итоговую сумму.';

      if (subtype === 'mandatory_1' || subtype === 'mandatory_2') {
        shortHint += `\n• Внимание: более короткий прямой маршрут, пропускающий обязательный пункт ${mandatoryNodes.join(', ')}, не является верным ответом.`;
      } else if (subtype === 'forbidden_1') {
        shortHint += `\n• Внимание: маршуты, проходящие через пункт ${forbiddenNode}, использовать нельзя!`;
      }

      const explanation = buildExplanation(
        vertices, startNode, endNode, subtype,
        mandatoryNodes, forbiddenNode, allPaths, validPaths, minLen, greedyPath
      );

      return {
        level: difficulty,
        subtype,
        vertices,
        matrix,
        startNode,
        endNode,
        mandatoryNodes,
        forbiddenNode,
        correctAnswer: String(minLen),
        statementIntro,
        questionText,
        shortHint,
        explanation
      };
    }

    // Fallback if random attempts fail
    return getFallbackTask(difficulty);
  },

  render: (taskData: Task4Data, state: TaskModuleState) => {
    return (
      <div className="space-y-4">
        {/* Statement intro, matrix and question */}
        <StatementBlock>
          <StatementText>
            {taskData.statementIntro}
          </StatementText>

          {/* Adjacency Matrix Table */}
          <DataTable>
            <thead>
              <tr>
                <Th className="w-12 bg-theme-bg/80"></Th>
                {taskData.vertices.map((v) => (
                  <Th key={v} className="text-base">
                    {v}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taskData.vertices.map((rowV, rIdx) => (
                <tr key={rowV}>
                  <Td className="font-bold bg-theme-bg/60 text-base">
                    {rowV}
                  </Td>
                  {taskData.vertices.map((colV, cIdx) => {
                    const val = taskData.matrix[rIdx][cIdx];
                    const isDiag = rIdx === cIdx;
                    return (
                      <Td
                        key={colV}
                        className={`font-mono text-base ${
                          isDiag
                            ? 'text-theme-text-muted bg-slate-100 dark:bg-slate-800/50'
                            : val !== null
                            ? 'font-bold text-theme-text'
                            : 'text-theme-text-muted/40'
                        }`}
                      >
                        {isDiag ? '—' : val !== null ? val : ''}
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </DataTable>

          {/* Question Text */}
          <StatementQuestion>
            {taskData.questionText}
          </StatementQuestion>
        </StatementBlock>

        {/* Input Area */}
        <AnswerField
          label="Ваш ответ (длина кратчайшего пути):"
          value={state.userAnswer}
          onChange={(val) => state.setUserAnswer(val)}
          disabled={state.isSubmitted}
          mono
          maxWidth="xs"
          placeholder="Например: 12"
        />

        {/* Hint Box */}
        {state.showHints && !state.isSubmitted && (
          <HintBox>
            <strong className="block font-bold text-sm mb-1.5">💡 Подсказка к решению:</strong>
            <p className="whitespace-pre-line leading-relaxed">{taskData.shortHint}</p>
          </HintBox>
        )}

        {/* Explanation / Solution Display after submission */}
        {state.isSubmitted && (
          <VerdictBox status={state.isCorrect ? 'correct' : 'wrong'}>
            {state.isCorrect ? (
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Верно! Ответ правильный.</span>
              </span>
            ) : (
              <div className="space-y-1.5">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span>Неверно.</span>
                </span>
                <p className="text-xs font-semibold">
                  Правильный ответ:{' '}
                  <AnswerChip>{taskData.correctAnswer}</AnswerChip>
                </p>
              </div>
            )}
          </VerdictBox>
        )}

        {state.isSubmitted && (
          <SubBlock className="space-y-2">
            <BlockLabel className="mb-0">Подробный разбор решения:</BlockLabel>
            <div className="text-sm leading-relaxed whitespace-pre-line text-theme-text">
              {taskData.explanation}
            </div>
          </SubBlock>
        )}
      </div>
    );
  },

  check: (taskData: Task4Data, userAnswer: string): boolean => {
    if (!userAnswer || !userAnswer.trim()) return false;
    const u = parseInt(userAnswer.trim(), 10);
    const c = parseInt(taskData.correctAnswer.trim(), 10);
    return !isNaN(u) && u === c;
  }
};

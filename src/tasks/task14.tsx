// банки имён заморожены: расширение меняет ответы ранее выданных вариантов
import React from 'react';
import { TaskModule, Difficulty, TaskModuleState } from '../types';
import { RNG } from '../utils/rng';
import { pickStable, pickManyStable } from '../utils/stablePick';
import { saveBlob } from '../utils/download';
import { Download } from 'lucide-react';
import {
  StatementBlock,
  StatementText,
  SubBlock,
  BlockLabel,
  DataTable,
  Th,
  Td,
  AnswerField,
  AnswerChip,
  ActionButton,
  VerdictBox,
  HintBox,
} from '../components/task-ui';
import {
  LAST_NAMES_MALE,
  LAST_NAMES_FEMALE,
  FIRST_NAMES_MALE,
  FIRST_NAMES_FEMALE,
  DISTRICTS,
  SCHOOL_SUBJECTS,
  PRODUCTS,
  PRODUCT_CATEGORIES,
  SHOPS,
  DEPARTMENTS,
  CITIES,
  COUNTRIES,
  SPORTS,
  CAR_BRANDS,
  WEATHER_MONTHS,
  WIND_DIRECTIONS,
  TASK14_THEMES,
  Task14ThemeDef,
} from '../data/task14themes';

export type StudentRow = Record<string, string | number>;

export interface Task14ColumnHeader {
  key: string;
  label: string;
  letter: string;
}

export interface Task14Data {
  rows: Record<string, string | number>[];
  columns: Task14ColumnHeader[];
  questions: [string, string];
  answers: [number, number];
  chartData: { district: string; count: number }[];
  chartTitle: string;
  statement: string;
  shortHint: string;
  hint: string;
  formula1: string;
  formula2: string;
  themeName: string;
}

export function parseUserAnswer(userAnswer: string): [string, string, string] {
  if (!userAnswer) return ['', '', '0'];
  const parts = userAnswer.split('|');
  return [parts[0] ?? '', parts[1] ?? '', parts[2] ?? '0'];
}

export function encodeUserAnswer(u1: string, u2: string, flag: string): string {
  return `${u1.trim()}|${u2.trim()}|${flag}`;
}

export const Task14PieChart: React.FC<{ chartData: { district: string; count: number }[] }> = ({ chartData }) => {
  const total = chartData.reduce((acc, d) => acc + d.count, 0) || 1;
  const colors = [
    '#6366f1', '#10b981', '#f59e0b', '#06b6d4',
    '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
    '#3b82f6', '#84cc16', '#a855f7', '#06b6d4'
  ];

  let currentAngle = -Math.PI / 2;
  const slices = chartData.map((item, idx) => {
    const fraction = item.count / total;
    const angleLength = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleLength;
    currentAngle = endAngle;

    const r = 80;
    const cx = 100;
    const cy = 100;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const largeArcFlag = angleLength > Math.PI ? 1 : 0;
    const pathData = fraction >= 0.9999
      ? `M ${cx - r},${cy} A ${r},${r} 0 1,0 ${cx + r},${cy} A ${r},${r} 0 1,0 ${cx - r},${cy}`
      : `M ${cx},${cy} L ${x1.toFixed(2)},${y1.toFixed(2)} A ${r},${r} 0 ${largeArcFlag},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;

    const midAngle = startAngle + angleLength / 2;
    const labelRadius = r * 0.65;
    const lx = cx + labelRadius * Math.cos(midAngle);
    const ly = cy + labelRadius * Math.sin(midAngle);
    const pct = Math.round(fraction * 100);

    return {
      district: item.district,
      count: item.count,
      pct,
      pathData,
      color: colors[idx % colors.length],
      lx,
      ly,
      angleLength,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 bg-theme-bg/60 rounded-xl border border-theme-border">
      <div className="relative w-44 h-44 shrink-0">
        <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
          {slices.map((slice, idx) => (
            <path
              key={idx}
              d={slice.pathData}
              fill={slice.color}
              stroke="#0f172a"
              strokeWidth="2"
              className="transition-all duration-200 hover:opacity-90"
            />
          ))}
          {slices.map((slice, idx) => (
            slice.pct >= 5 && (
              <text
                key={idx}
                x={slice.lx}
                y={slice.ly}
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="central"
                className="drop-shadow-md select-none font-mono"
              >
                {slice.count}
              </text>
            )
          ))}
        </svg>
      </div>

      <div className="space-y-2 text-xs font-mono max-h-60 overflow-y-auto pr-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-sans">
          Легенда и подписи данных:
        </div>
        {slices.map((slice, idx) => (
          <div key={idx} className="flex items-center gap-2.5">
            <span
              className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white/20"
              style={{ backgroundColor: slice.color }}
            />
            <span className="text-slate-200 font-sans font-medium min-w-[80px]">
              {slice.district}:
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {slice.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function cleanNumber(str: string): number | null {
  if (!str) return null;
  const clean = str.trim().replace(/\s+/g, '').replace(',', '.');
  if (clean === '') return null;
  const val = Number(clean);
  return isNaN(val) ? null : val;
}

function sampleArr<T>(rng: RNG, arr: T[], count: number): T[] {
  return rng.shuffle(arr).slice(0, Math.min(count, arr.length));
}

function samplePeople(rng: RNG, count: number): { lastName: string; firstName: string }[] {
  const result: { lastName: string; firstName: string }[] = [];
  const seen = new Set<string>();
  let failedAttempts = 0;
  while (result.length < count && failedAttempts < 200) {
    const gender = rng.pick(['m', 'f']);
    const lastName = gender === 'm' ? rng.pick(LAST_NAMES_MALE) : rng.pick(LAST_NAMES_FEMALE);
    const firstName = gender === 'm' ? rng.pick(FIRST_NAMES_MALE) : rng.pick(FIRST_NAMES_FEMALE);
    const key = `${lastName} ${firstName}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ lastName, firstName });
      failedAttempts = 0;
    } else {
      failedAttempts++;
    }
  }

  // Fallback: если за 200 попыток не набрано нужное число строк, добираем детерминированно через pickNextCyclic
  let curMaleLast = LAST_NAMES_MALE[0];
  let curMaleFirst = FIRST_NAMES_MALE[0];
  let curFemaleLast = LAST_NAMES_FEMALE[0];
  let curFemaleFirst = FIRST_NAMES_FEMALE[0];
  let fallbackCount = 0;
  while (result.length < count && fallbackCount < 1000) {
    fallbackCount++;
    curMaleLast = pickNextCyclic(LAST_NAMES_MALE, curMaleLast);
    curMaleFirst = pickNextCyclic(FIRST_NAMES_MALE, curMaleFirst);
    const keyM = `${curMaleLast} ${curMaleFirst}`;
    if (!seen.has(keyM)) {
      seen.add(keyM);
      result.push({ lastName: curMaleLast, firstName: curMaleFirst });
      if (result.length >= count) break;
    }
    curFemaleLast = pickNextCyclic(LAST_NAMES_FEMALE, curFemaleLast);
    curFemaleFirst = pickNextCyclic(FIRST_NAMES_FEMALE, curFemaleFirst);
    const keyF = `${curFemaleLast} ${curFemaleFirst}`;
    if (!seen.has(keyF)) {
      seen.add(keyF);
      result.push({ lastName: curFemaleLast, firstName: curFemaleFirst });
    }
  }

  return result;
}

function boolRng(rng: RNG, prob: number): boolean {
  return rng.next() < prob;
}

function pickNextCyclic<T>(subset: T[], current: T): T {
  const idx = subset.indexOf(current);
  if (idx === -1 || subset.length <= 1) return current;
  return subset[(idx + 1) % subset.length];
}

function quoteName(val: string): string {
  if (!val) return val;
  if (val.startsWith('«')) return val;
  return `«${val}»`;
}

function isProperNameCol(colKey: string): boolean {
  return (
    colKey === 'shop' ||
    colKey === 'category' ||
    colKey === 'productName' ||
    colKey === 'sport' ||
    colKey === 'brand' ||
    colKey.startsWith('subj_')
  );
}

interface Task14ViewProps {
  taskData: Task14Data;
  state: TaskModuleState;
}

export async function buildTask14XlsxBlob(taskData: Task14Data): Promise<Blob> {
  const XLSX = await import('xlsx');
  const headers = taskData.columns.map((c) => c.label);
  const wsData = taskData.rows.map((row) => {
    const obj: Record<string, any> = {};
    taskData.columns.forEach((c) => {
      obj[c.label] = row[c.key];
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(wsData, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, taskData.themeName || 'Данные');
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', compression: true });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

const Task14View: React.FC<Task14ViewProps> = ({ taskData, state }) => {
  const [u1, u2, flag] = parseUserAnswer(state.userAnswer);

  const handleU1Change = (val: string) => {
    state.setUserAnswer(encodeUserAnswer(val, u2, flag));
  };

  const handleU2Change = (val: string) => {
    state.setUserAnswer(encodeUserAnswer(u1, val, flag));
  };

  const handleDownloadXLSX = async () => {
    const blob = await buildTask14XlsxBlob(taskData);
    saveBlob(blob, 'zadanie14.xlsx');
  };

  const n1 = cleanNumber(u1);
  const n2 = cleanNumber(u2);

  const is1Correct = state.isSubmitted && n1 !== null && Math.abs(n1 - taskData.answers[0]) < 0.01;
  const is2Correct = state.isSubmitted && n2 !== null && Math.abs(n2 - taskData.answers[1]) < 0.01;

  return (
    <div className="space-y-4">
      {/* Statement & Data Table Box */}
      <StatementBlock>
        <StatementText>
          {taskData.statement}
        </StatementText>

        {/* Data Sample Table (First 5 rows) */}
        <div className="space-y-2 pt-1">
          <BlockLabel className="mb-0">Первые 5 строк таблицы данных:</BlockLabel>
          <DataTable>
            <thead>
              <tr>
                <Th className="font-mono text-center w-12">№</Th>
                {taskData.columns.map((col) => (
                  <Th key={col.key} className="font-mono text-left">
                    {col.letter} ({col.label})
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taskData.rows.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="hover:bg-theme-bg/40">
                  <Td className="font-mono text-center text-theme-text-muted">{idx + 2}</Td>
                  {taskData.columns.map((col) => {
                    const rawVal = row[col.key];
                    const displayVal =
                      typeof rawVal === 'string' && isProperNameCol(col.key)
                        ? quoteName(rawVal)
                        : rawVal;
                    return (
                      <Td key={col.key} className="text-left font-medium">
                        {displayVal}
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </DataTable>
        </div>

        {/* XLSX Download Button */}
        <div className="pt-1">
          <ActionButton
            onClick={handleDownloadXLSX}
            icon={<Download className="w-4 h-4" />}
          >
            <span>Скачать таблицу данных (.xlsx)</span>
          </ActionButton>
        </div>
      </StatementBlock>

      {/* Answer Form Box */}
      <div className="space-y-4">
        {/* Question 1 Input */}
        <div className="space-y-2">
          <AnswerField
            label={`Вопрос 1: ${taskData.questions[0]}`}
            value={u1}
            onChange={handleU1Change}
            disabled={state.isSubmitted}
            placeholder="Число (например, 139)"
            maxWidth="sm"
          />
          {state.isSubmitted && (
            <VerdictBox status={is1Correct ? 'correct' : 'wrong'}>
              {is1Correct ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>Вопрос 1: Верно! Ответ правильный.</span>
                </span>
              ) : (
                <div className="space-y-1.5">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <span>Вопрос 1: Неверно.</span>
                  </span>
                  <p className="text-xs font-semibold">
                    Правильный ответ:{' '}
                    <AnswerChip>{taskData.answers[0]}</AnswerChip>
                  </p>
                </div>
              )}
            </VerdictBox>
          )}
        </div>

        {/* Question 2 Input */}
        <div className="space-y-2">
          <AnswerField
            label={`Вопрос 2: ${taskData.questions[1]}`}
            value={u2}
            onChange={handleU2Change}
            disabled={state.isSubmitted}
            placeholder="Число (например, 52)"
            maxWidth="sm"
          />
          {state.isSubmitted && (
            <VerdictBox status={is2Correct ? 'correct' : 'wrong'}>
              {is2Correct ? (
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span>Вопрос 2: Верно! Ответ правильный.</span>
                </span>
              ) : (
                <div className="space-y-1.5">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <span>Вопрос 2: Неверно.</span>
                  </span>
                  <p className="text-xs font-semibold">
                    Правильный ответ:{' '}
                    <AnswerChip>{taskData.answers[1]}</AnswerChip>
                  </p>
                </div>
              )}
            </VerdictBox>
          )}
        </div>
      </div>

      {/* Hint section */}
      {state.showHints && !state.isSubmitted && (
        <HintBox>
          <strong className="block font-bold text-sm mb-1">💡 Подсказка:</strong>
          <p className="whitespace-pre-line text-sm leading-relaxed">{taskData.shortHint}</p>
        </HintBox>
      )}

      {/* Detailed Explanation on Submit */}
      {state.isSubmitted && taskData.hint && (
        <SubBlock className="space-y-4">
          <div>
            <strong className="block font-extrabold text-base text-theme-text mb-2">
              📖 Подробный разбор:
            </strong>
            <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm bg-theme-input-bg p-4 rounded-lg border border-theme-border text-theme-text leading-relaxed">
              {taskData.hint}
            </pre>
          </div>

          <div className="pt-3 border-t border-theme-border space-y-2">
            <BlockLabel className="mb-0">
              Примерная круговая диаграмма (Задание 3):
            </BlockLabel>
            <Task14PieChart chartData={taskData.chartData} />
          </div>
        </SubBlock>
      )}
    </div>
  );
};

function bellInt(rng: RNG, min: number, max: number): number {
  if (rng.next() < 0.15) {
    return min + Math.round(rng.next() * (max - min));
  } else {
    const t = (rng.next() + rng.next()) / 2;
    return min + Math.round(t * (max - min));
  }
}

function bellDecimal(rng: RNG, min: number, max: number): number {
  // дробное с 1 знаком, колокол; min может быть отрицательным
  const scaledMin = Math.round(min * 10);
  const scaledMax = Math.round(max * 10);
  return bellInt(rng, scaledMin, scaledMax) / 10;
}

function skewInt(rng: RNG, min: number, max: number): number {
  // Правый скос: много значений у нижней границы, редкий хвост к максимуму.
  // 15% равномерно (чтобы дорогие значения всё же появлялись), 85% скошено вниз.
  if (rng.next() < 0.15) {
    return min + Math.round(rng.next() * (max - min));
  } else {
    const t = Math.min(rng.next(), rng.next()); // минимум двух → скос влево
    return min + Math.round(t * (max - min));
  }
}

function appendAnswerTail(
  qText: string,
  rawAns: number,
  isFractional: boolean,
  answerCol: string,
  rowNum: number,
  difficulty: Difficulty,
  rng: RNG
): { text: string; ans: number } {
  const cleanText = qText.replace(/ \((?:Ответ округлите|Ответ запишите)[^)]*\)/g, '').trim();

  if (!isFractional) {
    const ans = Number.isInteger(rawAns) ? Math.round(rawAns) : Number(rawAns.toFixed(1));
    const text = `${cleanText} Ответ на этот вопрос запишите в ячейку ${answerCol}${rowNum} таблицы.`;
    return { text, ans };
  }

  if (difficulty === 3) {
    const mode = rng.pick(['int', 'd1', 'd2']);
    if (mode === 'int') {
      const ans = Math.round(rawAns);
      const text = `${cleanText} Ответ на этот вопрос запишите в ячейку ${answerCol}${rowNum} таблицы. Ответ округлите до целого числа.`;
      return { text, ans };
    } else if (mode === 'd1') {
      const ans = Number(rawAns.toFixed(1));
      const text = `${cleanText} Ответ на этот вопрос запишите в ячейку ${answerCol}${rowNum} таблицы. Ответ округлите до одного знака после запятой.`;
      return { text, ans };
    } else {
      const ans = Number(rawAns.toFixed(2));
      const text = `${cleanText} Ответ на этот вопрос запишите в ячейку ${answerCol}${rowNum} таблицы. Ответ округлите до двух знаков после запятой.`;
      return { text, ans };
    }
  } else if (difficulty === 2) {
    const ans = Number(rawAns.toFixed(2));
    const text = `${cleanText} Ответ на этот вопрос запишите в ячейку ${answerCol}${rowNum} таблицы с точностью не менее двух знаков после запятой.`;
    return { text, ans };
  } else {
    const ans = Number(rawAns.toFixed(2));
    const text = `${cleanText} Ответ на этот вопрос запишите в ячейку ${answerCol}${rowNum} таблицы.`;
    return { text, ans };
  }
}

export const task14: TaskModule = {
  id: 14,
  title: 'Обработка больших массивов данных в электронных таблицах',
  description: 'Выполнение вычислений в электронных таблицах по формулам и построение диаграмм.',
  topics: ['Электронные таблицы', 'Обработка данных'], // TODO: уточнить формулировки
  maxPoints: 3,

  generate: (difficulty: Difficulty, rng: RNG): Task14Data => {
    const seed = Math.floor(rng.next() * 0x100000000);
    const themeDef: Task14ThemeDef = pickStable(
      TASK14_THEMES,
      seed,
      `task14:theme:L${difficulty}`,
      (t) => t.id
    );
    const rowCount = difficulty === 1 ? rng.int(250, 500) : rng.int(500, 1000);
    const maxRowIndex = rowCount + 1; // Rows start at 2, so row 2..maxRowIndex

    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    const rows: Record<string, string | number>[] = [];
    let columns: Task14ColumnHeader[] = [];

    const getColLetter = (key: string) => {
      const col = columns.find((c) => c.key === key);
      return col ? col.letter : 'A';
    };

    let q1Text = '';
    let q2Text = '';
    let q3Text = '';

    let ans1 = 0;
    let ans2 = 0;
    let isFractional1 = false;
    let isFractional2 = false;

    let formula1 = '';
    let formula2 = '';
    let solution1 = '';
    let solution2 = '';

    let chartData: { district: string; count: number }[] = [];
    let chartTitle = '';
    let subjectChartThreshold: number | null = null;

    if (themeDef.id === 'students') {
      const numSubjects = difficulty === 1 ? rng.int(1, 2) : difficulty === 2 ? rng.int(2, 3) : rng.int(3, 4);
      const activeSubjects = pickManyStable(SCHOOL_SUBJECTS, seed, `task14:subjects:L${difficulty}`, (s) => s, numSubjects);
      const districtSubSet = pickManyStable(DISTRICTS, seed, `task14:districts:L${difficulty}`, (s) => s, rng.int(4, 6));

      columns = [
        { key: 'lastName', label: 'Фамилия', letter: '' },
        { key: 'firstName', label: 'Имя', letter: '' },
        { key: 'district', label: 'Округ', letter: '' },
        ...activeSubjects.map((subj, idx) => ({
          key: `subj_${idx}`,
          label: subj,
          letter: '',
        })),
      ];
      columns.forEach((col, idx) => {
        col.letter = LETTERS[idx];
      });

      // Q1 pre-selection
      const q1Kind = difficulty === 1
        ? rng.pick(['count', 'maxmin'])
        : difficulty === 2
        ? rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin'])
        : rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin', 'percentage']);
      let maxminSubjIdx = -1;
      let isMax = false;

      if (q1Kind === 'maxmin') {
        maxminSubjIdx = rng.int(0, activeSubjects.length - 1);
        isMax = boolRng(rng, 0.5);
      }

      const people = samplePeople(rng, rowCount);
      for (let i = 0; i < rowCount; i++) {
        const { lastName, firstName } = people[i];
        const district = rng.pick(districtSubSet);

        const rowObj: Record<string, string | number> = {
          lastName,
          firstName,
          district,
        };

        activeSubjects.forEach((_, idx) => {
          rowObj[`subj_${idx}`] = bellInt(rng, 0, 100);
        });

        rows.push(rowObj);
      }

      const distLetter = getColLetter('district');

      // Q1 formulation
      if (q1Kind === 'maxmin') {
        const sName = activeSubjects[maxminSubjIdx];
        const sLetter = getColLetter(`subj_${maxminSubjIdx}`);
        if (isMax) {
          q1Text = `Каков наибольший тестовый балл по предмету ${quoteName(sName)} среди всех учеников?`;
          ans1 = Math.max(...rows.map((r) => Number(r[`subj_${maxminSubjIdx}`])));
          formula1 = `=МАКС(${sLetter}2:${sLetter}${maxRowIndex})`;
          solution1 = `Фильтровать не нужно: выделите весь столбец «${sName}» и примените функцию МАКС.`;
        } else {
          q1Text = `Каков наименьший тестовый балл по предмету ${quoteName(sName)} среди всех учеников?`;
          ans1 = Math.min(...rows.map((r) => Number(r[`subj_${maxminSubjIdx}`])));
          formula1 = `=МИН(${sLetter}2:${sLetter}${maxRowIndex})`;
          solution1 = `Фильтровать не нужно: выделите весь столбец «${sName}» и примените функцию МИН.`;
        }
      } else if (q1Kind === 'average') {
        const sIdx = rng.int(0, activeSubjects.length - 1);
        const sName = activeSubjects[sIdx];
        const sLetter = getColLetter(`subj_${sIdx}`);
        const targetDist = rng.pick(districtSubSet);

        q1Text = `Каков средний тестовый балл по предмету ${quoteName(sName)} у учеников из округа ${targetDist}?`;
        const filtered = rows.filter((r) => r.district === targetDist);
        const sum = filtered.reduce((acc, r) => acc + Number(r[`subj_${sIdx}`]), 0);
        ans1 = filtered.length === 0 ? 0 : sum / filtered.length;
        formula1 = `=СРЗНАЧЕСЛИ(${distLetter}2:${distLetter}${maxRowIndex}; "${targetDist}"; ${sLetter}2:${sLetter}${maxRowIndex})`;
        solution1 = `Отфильтруйте столбец «Округ» = «${targetDist}», скопируйте отфильтрованные значения столбца «${sName}» на новый лист и примените функцию СРЗНАЧ.`;
        isFractional1 = true;
      } else if (q1Kind === 'sum') {
        const sIdx = rng.int(0, activeSubjects.length - 1);
        const sName = activeSubjects[sIdx];
        const sLetter = getColLetter(`subj_${sIdx}`);
        const targetDist = rng.pick(districtSubSet);

        q1Text = `Какова сумма баллов по предмету ${quoteName(sName)} у учеников из округа ${targetDist}?`;
        const filtered = rows.filter((r) => r.district === targetDist);
        const sumVal = filtered.reduce((acc, r) => acc + Number(r[`subj_${sIdx}`]), 0);
        ans1 = Math.round(sumVal);
        formula1 = `=СУММЕСЛИ(${distLetter}2:${distLetter}${maxRowIndex}; "${targetDist}"; ${sLetter}2:${sLetter}${maxRowIndex})`;
        solution1 = `Отфильтруйте столбец «Округ» = «${targetDist}», скопируйте отфильтрованные значения столбца «${sName}» на новый лист и примените функцию СУММ.`;
      } else if (q1Kind === 'cond_maxmin') {
        const sIdx = rng.int(0, activeSubjects.length - 1);
        const sName = activeSubjects[sIdx];
        const sLetter = getColLetter(`subj_${sIdx}`);
        const targetDist = rng.pick(districtSubSet);
        const filtered = rows.filter((r) => r.district === targetDist);

        if (filtered.length === 0) {
          q1Text = `Сколько учеников учатся в округе ${targetDist}?`;
          ans1 = 0;
          formula1 = `=СЧЁТЕСЛИ(${distLetter}2:${distLetter}${maxRowIndex}; "${targetDist}")`;
          solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Округ» и оставьте только «${targetDist}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
        } else {
          const isCondMax = boolRng(rng, 0.5);
          if (isCondMax) {
            q1Text = `Каков наибольший тестовый балл по предмету ${quoteName(sName)} у учеников из округа ${targetDist}?`;
            ans1 = Math.max(...filtered.map((r) => Number(r[`subj_${sIdx}`])));
            formula1 = `=МАКСЕСЛИ(${sLetter}2:${sLetter}${maxRowIndex}; ${distLetter}2:${distLetter}${maxRowIndex}; "${targetDist}")`;
            solution1 = `Отфильтруйте столбец «Округ» = «${targetDist}», скопируйте отфильтрованные значения столбца «${sName}» на новый лист и найдите среди них наибольшее (МАКС).`;
          } else {
            q1Text = `Каков наименьший тестовый балл по предмету ${quoteName(sName)} у учеников из округа ${targetDist}?`;
            ans1 = Math.min(...filtered.map((r) => Number(r[`subj_${sIdx}`])));
            formula1 = `=МИНЕСЛИ(${sLetter}2:${sLetter}${maxRowIndex}; ${distLetter}2:${distLetter}${maxRowIndex}; "${targetDist}")`;
            solution1 = `Отфильтруйте столбец «Округ» = «${targetDist}», скопируйте отфильтрованные значения столбца «${sName}» на новый лист и найдите среди них наименьшее (МИН).`;
          }
        }
      } else if (q1Kind === 'percentage') {
        const targetDist = rng.pick(districtSubSet);
        q1Text = `Какой процент от общего числа учеников составляют ученики из округа ${targetDist}?`;
        const countTarget = rows.filter((r) => r.district === targetDist).length;
        ans1 = (countTarget / rowCount) * 100;
        formula1 = `=СЧЁТЕСЛИ(${distLetter}2:${distLetter}${maxRowIndex}; "${targetDist}")/${rowCount}*100`;
        solution1 = `Посчитайте количество строк по условию (как в Способе 1 — фильтром), разделите на общее число строк (${rowCount}) и умножьте на 100.`;
        isFractional1 = true;
      } else {
        if (boolRng(rng, 0.5)) {
          const targetDist = rng.pick(districtSubSet);
          q1Text = `Сколько учеников учатся в округе ${targetDist}?`;
          ans1 = rows.filter((r) => r.district === targetDist).length;
          formula1 = `=СЧЁТЕСЛИ(${distLetter}2:${distLetter}${maxRowIndex}; "${targetDist}")`;
          solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Округ» и оставьте только «${targetDist}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
        } else {
          const sIdx = rng.int(0, activeSubjects.length - 1);
          const sName = activeSubjects[sIdx];
          const sLetter = getColLetter(`subj_${sIdx}`);
          const thresh = rng.int(40, 85);

          q1Text = `Сколько учеников получили по предмету ${quoteName(sName)} больше ${thresh} баллов?`;
          ans1 = rows.filter((r) => Number(r[`subj_${sIdx}`]) > thresh).length;
          formula1 = `=СЧЁТЕСЛИ(${sLetter}2:${sLetter}${maxRowIndex}; ">${thresh}")`;
          solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «${sName}» и оставьте только значения больше ${thresh}. Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
        }
      }

      // Q2 - independent entity selection from districtSubSet
      const targetDist2 = rng.pick(districtSubSet);
      const sIdx2 = rng.int(0, activeSubjects.length - 1);
      const sName2 = activeSubjects[sIdx2];
      const sLetter2 = getColLetter(`subj_${sIdx2}`);
      const thresh2 = rng.int(40, 85);

      if (difficulty === 3 && boolRng(rng, 0.35)) {
        const distA = rng.pick(districtSubSet);
        const distB = pickNextCyclic(districtSubSet, distA);
        const filteredA = rows.filter((r) => r.district === distA);
        const filteredB = rows.filter((r) => r.district === distB);
        const avgA = filteredA.length ? filteredA.reduce((acc, r) => acc + Number(r[`subj_${sIdx2}`]), 0) / filteredA.length : 0;
        const avgB = filteredB.length ? filteredB.reduce((acc, r) => acc + Number(r[`subj_${sIdx2}`]), 0) / filteredB.length : 0;
        q2Text = `На сколько различается средний тестовый балл по предмету ${quoteName(sName2)} у учеников из округа ${distA} и округа ${distB}?`;
        ans2 = Math.abs(avgA - avgB);
        formula2 = `=ABS(СРЗНАЧЕСЛИ(${distLetter}2:${distLetter}${maxRowIndex}; "${distA}"; ${sLetter2}2:${sLetter2}${maxRowIndex}) - СРЗНАЧЕСЛИ(${distLetter}2:${distLetter}${maxRowIndex}; "${distB}"; ${sLetter2}2:${sLetter2}${maxRowIndex}))`;
        solution2 = `Посчитайте среднее по столбцу «${sName2}» отдельно для «${distA}» и для «${distB}» (каждое — фильтром, как в Способе 1). Затем найдите разницу двух средних и возьмите её по модулю (без знака минус).`;
        isFractional2 = true;
      } else if (difficulty === 3 && activeSubjects.length >= 2 && boolRng(rng, 0.5)) {
        const sIdx3 = (sIdx2 + 1) % activeSubjects.length;
        const sName3 = activeSubjects[sIdx3];
        const sLetter3 = getColLetter(`subj_${sIdx3}`);
        const thresh3 = rng.int(40, 85);

        q2Text = `Сколько учеников из округа ${targetDist2} получили по предмету ${quoteName(sName2)} больше ${thresh2} баллов и по предмету ${quoteName(sName3)} больше ${thresh3} баллов?`;
        ans2 = rows.filter(
          (r) =>
            r.district === targetDist2 &&
            Number(r[`subj_${sIdx2}`]) > thresh2 &&
            Number(r[`subj_${sIdx3}`]) > thresh3
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${distLetter}2:${distLetter}${maxRowIndex}; "${targetDist2}"; ${sLetter2}2:${sLetter2}${maxRowIndex}; ">${thresh2}"; ${sLetter3}2:${sLetter3}${maxRowIndex}; ">${thresh3}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Округ» = «${targetDist2}», затем добавьте фильтр по столбцу «${sName2}» (больше ${thresh2}) и по столбцу «${sName3}» (больше ${thresh3}). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      } else if (difficulty >= 2 && boolRng(rng, 0.4)) {
        const low = rng.int(20, 50);
        const high = low + rng.int(20, 35);
        q2Text = `Сколько учеников получили по предмету ${quoteName(sName2)} от ${low} до ${high} баллов?`;
        ans2 = rows.filter((r) => Number(r[`subj_${sIdx2}`]) >= low && Number(r[`subj_${sIdx2}`]) <= high).length;
        formula2 = `=СЧЁТЕСЛИМН(${sLetter2}2:${sLetter2}${maxRowIndex}; ">=${low}"; ${sLetter2}2:${sLetter2}${maxRowIndex}; "<=${high}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте столбец «${sName2}», оставив значения от ${low} до ${high}. Посчитайте оставшиеся строки функцией СЧЁТЗ.`;
      } else {
        q2Text = `Сколько учеников из округа ${targetDist2} получили по предмету ${quoteName(sName2)} больше ${thresh2} баллов?`;
        ans2 = rows.filter(
          (r) => r.district === targetDist2 && Number(r[`subj_${sIdx2}`]) > thresh2
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${distLetter}2:${distLetter}${maxRowIndex}; "${targetDist2}"; ${sLetter2}2:${sLetter2}${maxRowIndex}; ">${thresh2}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Округ» = «${targetDist2}», затем добавьте фильтр по столбцу «${sName2}» (больше ${thresh2}). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      }

      // Chart
      const numSectors = difficulty === 3 ? rng.int(3, 5) : 3;
      if (activeSubjects.length >= 2 && boolRng(rng, 0.4)) {
        const subjChartThresh = rng.int(50, 75);
        subjectChartThreshold = subjChartThresh;
        chartTitle = `распределение количества учеников, набравших более ${subjChartThresh} баллов по предметам`;
        const chosenSubjects = sampleArr(rng, activeSubjects, numSectors);
        chartData = chosenSubjects.map((sName) => {
          const sIdx = activeSubjects.indexOf(sName);
          return {
            district: quoteName(sName),
            count: rows.filter((r) => Number(r[`subj_${sIdx}`]) > subjChartThresh).length,
          };
        });
      } else {
        chartTitle = 'распределение учеников по округам';
        const chosenDists = sampleArr(rng, districtSubSet, numSectors);
        chartData = chosenDists.map((d) => ({
          district: d,
          count: rows.filter((r) => r.district === d).length,
        }));
      }
    } else if (themeDef.id === 'products') {
      const isSubtypeA = boolRng(rng, 0.5); // A: Geography (Shop, City), B: Category (Category, Shop)

      if (isSubtypeA) {
        // Подтип A («Товары по географии»)
        const shopSubSet = pickManyStable(SHOPS, seed, `task14:shops:L${difficulty}`, (s) => s, rng.int(5, 12));
        const citySubSet = pickManyStable(CITIES, seed, `task14:cities:L${difficulty}`, (s) => s, rng.int(5, 12));
        const productSubPool = pickManyStable(PRODUCTS, seed, `task14:products:L${difficulty}`, (s) => s, 25);

        columns = [
          { key: 'productName', label: 'Название товара', letter: '' },
          { key: 'shop', label: 'Магазин', letter: '' },
          { key: 'city', label: 'Город', letter: '' },
          { key: 'price', label: 'Цена (руб.)', letter: '' },
        ];
        if (difficulty >= 2) {
          columns.push({ key: 'quantity', label: 'Количество (шт.)', letter: '' });
        }
        columns.forEach((col, idx) => {
          col.letter = LETTERS[idx];
        });

        // Q1 pre-selection
        const q1Kind = difficulty === 1
          ? rng.pick(['count', 'maxmin'])
          : difficulty === 2
          ? rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin'])
          : rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin', 'percentage', 'sumproduct']);
        let targetNumCol: 'price' | 'quantity' | null = null;
        let isMax = false;

        if (q1Kind === 'maxmin') {
          targetNumCol = difficulty >= 2 ? rng.pick(['price', 'quantity']) : 'price';
          isMax = boolRng(rng, 0.5);
        }

        for (let i = 0; i < rowCount; i++) {
          const rowObj: Record<string, string | number> = {
            productName: rng.pick(productSubPool),
            shop: rng.pick(shopSubSet),
            city: rng.pick(citySubSet),
            price: skewInt(rng, 50, 10000),
          };
          if (difficulty >= 2) {
            rowObj.quantity = bellInt(rng, 0, 500);
          }
          rows.push(rowObj);
        }

        const shopLetter = getColLetter('shop');
        const cityLetter = getColLetter('city');
        const priceLetter = getColLetter('price');
        const qtyLetter = difficulty >= 2 ? getColLetter('quantity') : '';

        const askByShop = boolRng(rng, 0.5);
        const targetShop = rng.pick(shopSubSet);
        const targetCity = rng.pick(citySubSet);

        if (q1Kind === 'maxmin') {
          if (targetNumCol === 'price') {
            q1Text = isMax
              ? 'Какова наибольшая цена товара среди всех представленных?'
              : 'Какова наименьшая цена товара среди всех представленных?';
            ans1 = isMax
              ? Math.max(...rows.map((r) => Number(r.price)))
              : Math.min(...rows.map((r) => Number(r.price)));
            formula1 = isMax
              ? `=МАКС(${priceLetter}2:${priceLetter}${maxRowIndex})`
              : `=МИН(${priceLetter}2:${priceLetter}${maxRowIndex})`;
            solution1 = isMax
              ? 'Фильтровать не нужно: выделите весь столбец «Цена (руб.)» и примените функцию МАКС.'
              : 'Фильтровать не нужно: выделите весь столбец «Цена (руб.)» и примените функцию МИН.';
          } else {
            q1Text = isMax
              ? 'Каково наибольшее количество товара среди всех представленных?'
              : 'Каково наименьшее количество товара среди всех представленных?';
            ans1 = isMax
              ? Math.max(...rows.map((r) => Number(r.quantity)))
              : Math.min(...rows.map((r) => Number(r.quantity)));
            formula1 = isMax
              ? `=МАКС(${qtyLetter}2:${qtyLetter}${maxRowIndex})`
              : `=МИН(${qtyLetter}2:${qtyLetter}${maxRowIndex})`;
            solution1 = isMax
              ? 'Фильтровать не нужно: выделите весь столбец «Количество (шт.)» и примените функцию МАКС.'
              : 'Фильтровать не нужно: выделите весь столбец «Количество (шт.)» и примените функцию МИН.';
          }
        } else if (q1Kind === 'average') {
          if (askByShop) {
            q1Text = `Какова средняя цена товаров в магазине ${quoteName(targetShop)}?`;
            const filtered = rows.filter((r) => r.shop === targetShop);
            const sum = filtered.reduce((acc, r) => acc + Number(r.price), 0);
            ans1 = filtered.length === 0 ? 0 : sum / filtered.length;
            formula1 = `=СРЗНАЧЕСЛИ(${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop}"; ${priceLetter}2:${priceLetter}${maxRowIndex})`;
            solution1 = `Отфильтруйте столбец «Магазин» = «${targetShop}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и примените функцию СРЗНАЧ.`;
          } else {
            q1Text = `Какова средняя цена товаров в городе ${targetCity}?`;
            const filtered = rows.filter((r) => r.city === targetCity);
            const sum = filtered.reduce((acc, r) => acc + Number(r.price), 0);
            ans1 = filtered.length === 0 ? 0 : sum / filtered.length;
            formula1 = `=СРЗНАЧЕСЛИ(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity}"; ${priceLetter}2:${priceLetter}${maxRowIndex})`;
            solution1 = `Отфильтруйте столбец «Город» = «${targetCity}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и примените функцию СРЗНАЧ.`;
          }
          isFractional1 = true;
        } else if (q1Kind === 'sum') {
          if (askByShop) {
            q1Text = `Какова суммарная стоимость товаров в магазине ${quoteName(targetShop)}?`;
            const filtered = rows.filter((r) => r.shop === targetShop);
            const sumVal = filtered.reduce((acc, r) => acc + Number(r.price), 0);
            ans1 = Math.round(sumVal);
            formula1 = `=СУММЕСЛИ(${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop}"; ${priceLetter}2:${priceLetter}${maxRowIndex})`;
            solution1 = `Отфильтруйте столбец «Магазин» = «${targetShop}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и примените функцию СУММ.`;
          } else {
            q1Text = `Какова суммарная стоимость товаров в городе ${targetCity}?`;
            const filtered = rows.filter((r) => r.city === targetCity);
            const sumVal = filtered.reduce((acc, r) => acc + Number(r.price), 0);
            ans1 = Math.round(sumVal);
            formula1 = `=СУММЕСЛИ(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity}"; ${priceLetter}2:${priceLetter}${maxRowIndex})`;
            solution1 = `Отфильтруйте столбец «Город» = «${targetCity}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и примените функцию СУММ.`;
          }
        } else if (q1Kind === 'cond_maxmin') {
          const isCondMax = boolRng(rng, 0.5);
          if (askByShop) {
            const filtered = rows.filter((r) => r.shop === targetShop);
            if (filtered.length === 0) {
              q1Text = `Сколько товаров продаётся в магазине ${quoteName(targetShop)}?`;
              ans1 = 0;
              formula1 = `=СЧЁТЕСЛИ(${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop}")`;
              solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Магазин» и оставьте только «${targetShop}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
            } else if (isCondMax) {
              q1Text = `Какова наибольшая цена товара в магазине ${quoteName(targetShop)}?`;
              ans1 = Math.max(...filtered.map((r) => Number(r.price)));
              formula1 = `=МАКСЕСЛИ(${priceLetter}2:${priceLetter}${maxRowIndex}; ${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop}")`;
              solution1 = `Отфильтруйте столбец «Магазин» = «${targetShop}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и найдите среди них наибольшее (МАКС).`;
            } else {
              q1Text = `Какова наименьшая цена товара в магазине ${quoteName(targetShop)}?`;
              ans1 = Math.min(...filtered.map((r) => Number(r.price)));
              formula1 = `=МИНЕСЛИ(${priceLetter}2:${priceLetter}${maxRowIndex}; ${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop}")`;
              solution1 = `Отфильтруйте столбец «Магазин» = «${targetShop}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и найдите среди них наименьшее (МИН).`;
            }
          } else {
            const filtered = rows.filter((r) => r.city === targetCity);
            if (filtered.length === 0) {
              q1Text = `Сколько товаров продаётся в городе ${targetCity}?`;
              ans1 = 0;
              formula1 = `=СЧЁТЕСЛИ(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity}")`;
              solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Город» и оставьте только «${targetCity}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
            } else if (isCondMax) {
              q1Text = `Какова наибольшая цена товара в городе ${targetCity}?`;
              ans1 = Math.max(...filtered.map((r) => Number(r.price)));
              formula1 = `=МАКСЕСЛИ(${priceLetter}2:${priceLetter}${maxRowIndex}; ${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity}")`;
              solution1 = `Отфильтруйте столбец «Город» = «${targetCity}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и найдите среди них наибольшее (МАКС).`;
            } else {
              q1Text = `Какова наименьшая цена товара в городе ${targetCity}?`;
              ans1 = Math.min(...filtered.map((r) => Number(r.price)));
              formula1 = `=МИНЕСЛИ(${priceLetter}2:${priceLetter}${maxRowIndex}; ${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity}")`;
              solution1 = `Отфильтруйте столбец «Город» = «${targetCity}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и найдите среди них наименьшее (МИН).`;
            }
          }
        } else if (q1Kind === 'sumproduct') {
          if (askByShop) {
            q1Text = `Какова общая стоимость всех товаров в магазине ${quoteName(targetShop)}?`;
            const filtered = rows.filter((r) => r.shop === targetShop);
            ans1 = filtered.reduce((acc, r) => acc + Number(r.price) * Number(r.quantity), 0);
            formula1 = `=СУММПРОИЗВ((${shopLetter}2:${shopLetter}${maxRowIndex}="${targetShop}")*(${priceLetter}2:${priceLetter}${maxRowIndex})*(${qtyLetter}2:${qtyLetter}${maxRowIndex}))`;
            solution1 = `Отфильтруйте по столбцу «Магазин» = «${targetShop}», на новом листе в отдельном столбце перемножьте «Цена» и «Количество» построчно, затем сложите результаты функцией СУММ.`;
          } else {
            q1Text = `Какова общая стоимость всех товаров в городе ${targetCity}?`;
            const filtered = rows.filter((r) => r.city === targetCity);
            ans1 = filtered.reduce((acc, r) => acc + Number(r.price) * Number(r.quantity), 0);
            formula1 = `=СУММПРОИЗВ((${cityLetter}2:${cityLetter}${maxRowIndex}="${targetCity}")*(${priceLetter}2:${priceLetter}${maxRowIndex})*(${qtyLetter}2:${qtyLetter}${maxRowIndex}))`;
            solution1 = `Отфильтруйте по столбцу «Город» = «${targetCity}», на новом листе в отдельном столбце перемножьте «Цена» и «Количество» построчно, затем сложите результаты функцией СУММ.`;
          }
        } else if (q1Kind === 'percentage') {
          if (askByShop) {
            q1Text = `Какой процент от общего числа товаров составляют товары в магазине ${quoteName(targetShop)}?`;
            const countTarget = rows.filter((r) => r.shop === targetShop).length;
            ans1 = (countTarget / rowCount) * 100;
            formula1 = `=СЧЁТЕСЛИ(${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop}")/${rowCount}*100`;
          } else {
            q1Text = `Какой процент от общего числа товаров составляют товары в городе ${targetCity}?`;
            const countTarget = rows.filter((r) => r.city === targetCity).length;
            ans1 = (countTarget / rowCount) * 100;
            formula1 = `=СЧЁТЕСЛИ(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity}")/${rowCount}*100`;
          }
          solution1 = `Посчитайте количество строк по условию (как в Способе 1 — фильтром), разделите на общее число строк (${rowCount}) и умножьте на 100.`;
          isFractional1 = true;
        } else {
          if (askByShop) {
            q1Text = `Сколько товаров продаётся в магазине ${quoteName(targetShop)}?`;
            ans1 = rows.filter((r) => r.shop === targetShop).length;
            formula1 = `=СЧЁТЕСЛИ(${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop}")`;
            solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Магазин» и оставьте только «${targetShop}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
          } else {
            q1Text = `Сколько товаров продаётся в городе ${targetCity}?`;
            ans1 = rows.filter((r) => r.city === targetCity).length;
            formula1 = `=СЧЁТЕСЛИ(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity}")`;
            solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Город» и оставьте только «${targetCity}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
          }
        }

        const targetShop2 = rng.pick(shopSubSet);
        const targetCity2 = rng.pick(citySubSet);
        const priceThresh = rng.int(200, 5000);
        const qtyThresh = rng.int(50, 250);

        if (difficulty === 3 && boolRng(rng, 0.35)) {
          const shopA = rng.pick(shopSubSet);
          const shopB = pickNextCyclic(shopSubSet, shopA);
          const filteredA = rows.filter((r) => r.shop === shopA);
          const filteredB = rows.filter((r) => r.shop === shopB);
          const avgA = filteredA.length ? filteredA.reduce((acc, r) => acc + Number(r.price), 0) / filteredA.length : 0;
          const avgB = filteredB.length ? filteredB.reduce((acc, r) => acc + Number(r.price), 0) / filteredB.length : 0;
          q2Text = `На сколько различается средняя цена товаров в магазине ${quoteName(shopA)} и магазине ${quoteName(shopB)}?`;
          ans2 = Math.abs(avgA - avgB);
          formula2 = `=ABS(СРЗНАЧЕСЛИ(${shopLetter}2:${shopLetter}${maxRowIndex}; "${shopA}"; ${priceLetter}2:${priceLetter}${maxRowIndex}) - СРЗНАЧЕСЛИ(${shopLetter}2:${shopLetter}${maxRowIndex}; "${shopB}"; ${priceLetter}2:${priceLetter}${maxRowIndex}))`;
          solution2 = `Посчитайте среднее по столбцу «Цена (руб.)» отдельно для «${shopA}» и для «${shopB}» (каждое — фильтром, как в Способе 1). Затем найдите разницу двух средних и возьмите её по модулю (без знака минус).`;
          isFractional2 = true;
        } else if (difficulty === 3 && boolRng(rng, 0.35)) {
          q2Text = `Сколько товаров в магазине ${quoteName(targetShop2)} стоят дороже ${priceThresh} рублей и имеются в количестве более ${qtyThresh} шт.?`;
          ans2 = rows.filter(
            (r) => r.shop === targetShop2 && Number(r.price) > priceThresh && Number(r.quantity) > qtyThresh
          ).length;
          formula2 = `=СЧЁТЕСЛИМН(${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop2}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; ">${priceThresh}"; ${qtyLetter}2:${qtyLetter}${maxRowIndex}; ">${qtyThresh}")`;
          solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Магазин» = «${targetShop2}», затем добавьте фильтр по столбцу «Цена (руб.)» (дороже ${priceThresh} рублей) и по столбцу «Количество (шт.)» (более ${qtyThresh} шт.). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
        } else if (difficulty >= 2 && boolRng(rng, 0.35)) {
          const low = rng.int(200, 2000);
          const high = low + rng.int(1000, 3000);
          q2Text = `Сколько товаров имеют цену от ${low} до ${high} рублей?`;
          ans2 = rows.filter((r) => Number(r.price) >= low && Number(r.price) <= high).length;
          formula2 = `=СЧЁТЕСЛИМН(${priceLetter}2:${priceLetter}${maxRowIndex}; ">=${low}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; "<=${high}")`;
          solution2 = `Скопируйте таблицу на новый лист, отфильтруйте столбец «Цена (руб.)», оставив значения от ${low} до ${high}. Посчитайте оставшиеся строки функцией СЧЁТЗ.`;
        } else {
          const q2Kind = rng.int(1, 3);
          if (q2Kind === 1) {
            q2Text = `Сколько товаров в магазине ${quoteName(targetShop2)} дороже ${priceThresh} рублей?`;
            ans2 = rows.filter(
              (r) => r.shop === targetShop2 && Number(r.price) > priceThresh
            ).length;
            formula2 = `=СЧЁТЕСЛИМН(${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop2}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; ">${priceThresh}")`;
            solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Магазин» = «${targetShop2}», затем добавьте фильтр по столбцу «Цена (руб.)» (дороже ${priceThresh} рублей). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
          } else if (q2Kind === 2) {
            q2Text = `Сколько товаров в городе ${targetCity2} продаётся в магазине ${quoteName(targetShop2)}?`;
            ans2 = rows.filter(
              (r) => r.city === targetCity2 && r.shop === targetShop2
            ).length;
            formula2 = `=СЧЁТЕСЛИМН(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity2}"; ${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop2}")`;
            solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Город» = «${targetCity2}», затем добавьте фильтр по столбцу «Магазин» = «${targetShop2}». Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
          } else {
            q2Text = `Сколько товаров в городе ${targetCity2} дороже ${priceThresh} рублей?`;
            ans2 = rows.filter(
              (r) => r.city === targetCity2 && Number(r.price) > priceThresh
            ).length;
            formula2 = `=СЧЁТЕСЛИМН(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity2}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; ">${priceThresh}")`;
            solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Город» = «${targetCity2}», затем добавьте фильтр по столбцу «Цена (руб.)» (дороже ${priceThresh} рублей). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
          }
        }

        const numSectors = difficulty === 3 ? rng.int(3, 5) : 3;
        const chartByShop = boolRng(rng, 0.5);
        if (chartByShop) {
          chartTitle = 'распределение товаров по магазинам';
          const chosenShops = sampleArr(rng, shopSubSet, numSectors);
          chartData = chosenShops.map((s) => ({
            district: quoteName(s),
            count: rows.filter((r) => r.shop === s).length,
          }));
        } else {
          chartTitle = 'распределение товаров по городам';
          const chosenCities = sampleArr(rng, citySubSet, numSectors);
          chartData = chosenCities.map((c) => ({
            district: c,
            count: rows.filter((r) => r.city === c).length,
          }));
        }
      } else {
        // Подтип B («Товары по категории»)
        const catSubSet = pickManyStable(PRODUCT_CATEGORIES, seed, `task14:categories:L${difficulty}`, (s) => s, rng.int(5, 12));
        const shopSubSet = pickManyStable(SHOPS, seed, `task14:shops_cat:L${difficulty}`, (s) => s, rng.int(5, 12));

        columns = [
          { key: 'category', label: 'Категория товара', letter: '' },
          { key: 'shop', label: 'Магазин', letter: '' },
          { key: 'price', label: 'Цена (руб.)', letter: '' },
        ];
        if (difficulty >= 2) {
          columns.push({ key: 'quantity', label: 'Количество (шт.)', letter: '' });
        }
        columns.forEach((col, idx) => {
          col.letter = LETTERS[idx];
        });

        // Q1 pre-selection
        const q1Kind = difficulty === 1
          ? rng.pick(['count', 'maxmin'])
          : difficulty === 2
          ? rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin'])
          : rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin', 'percentage', 'sumproduct']);
        let targetNumCol: 'price' | 'quantity' | null = null;
        let isMax = false;

        if (q1Kind === 'maxmin') {
          targetNumCol = difficulty >= 2 ? rng.pick(['price', 'quantity']) : 'price';
          isMax = boolRng(rng, 0.5);
        }

        for (let i = 0; i < rowCount; i++) {
          const rowObj: Record<string, string | number> = {
            category: rng.pick(catSubSet),
            shop: rng.pick(shopSubSet),
            price: skewInt(rng, 50, 10000),
          };
          if (difficulty >= 2) {
            rowObj.quantity = bellInt(rng, 0, 500);
          }
          rows.push(rowObj);
        }

        const catLetter = getColLetter('category');
        const shopLetter = getColLetter('shop');
        const priceLetter = getColLetter('price');
        const qtyLetter = difficulty >= 2 ? getColLetter('quantity') : '';

        const targetCat = rng.pick(catSubSet);

        if (q1Kind === 'maxmin') {
          if (targetNumCol === 'price') {
            q1Text = isMax
              ? 'Какова наибольшая цена товара среди всех представленных?'
              : 'Какова наименьшая цена товара среди всех представленных?';
            ans1 = isMax
              ? Math.max(...rows.map((r) => Number(r.price)))
              : Math.min(...rows.map((r) => Number(r.price)));
            formula1 = isMax
              ? `=МАКС(${priceLetter}2:${priceLetter}${maxRowIndex})`
              : `=МИН(${priceLetter}2:${priceLetter}${maxRowIndex})`;
            solution1 = isMax
              ? 'Фильтровать не нужно: выделите весь столбец «Цена (руб.)» и примените функцию МАКС.'
              : 'Фильтровать не нужно: выделите весь столбец «Цена (руб.)» и примените функцию МИН.';
          } else {
            q1Text = isMax
              ? 'Каково наибольшее количество товара среди всех представленных?'
              : 'Каково наименьшее количество товара среди всех представленных?';
            ans1 = isMax
              ? Math.max(...rows.map((r) => Number(r.quantity)))
              : Math.min(...rows.map((r) => Number(r.quantity)));
            formula1 = isMax
              ? `=МАКС(${qtyLetter}2:${qtyLetter}${maxRowIndex})`
              : `=МИН(${qtyLetter}2:${qtyLetter}${maxRowIndex})`;
            solution1 = isMax
              ? 'Фильтровать не нужно: выделите весь столбец «Количество (шт.)» и примените функцию МАКС.'
              : 'Фильтровать не нужно: выделите весь столбец «Количество (шт.)» и примените функцию МИН.';
          }
        } else if (q1Kind === 'average') {
          q1Text = `Какова средняя цена товаров категории ${quoteName(targetCat)}?`;
          const filtered = rows.filter((r) => r.category === targetCat);
          const sum = filtered.reduce((acc, r) => acc + Number(r.price), 0);
          ans1 = filtered.length === 0 ? 0 : sum / filtered.length;
          formula1 = `=СРЗНАЧЕСЛИ(${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat}"; ${priceLetter}2:${priceLetter}${maxRowIndex})`;
          solution1 = `Отфильтруйте столбец «Категория товара» = «${targetCat}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и примените функцию СРЗНАЧ.`;
          isFractional1 = true;
        } else if (q1Kind === 'sum') {
          q1Text = `Какова суммарная стоимость товаров категории ${quoteName(targetCat)}?`;
          const filtered = rows.filter((r) => r.category === targetCat);
          const sumVal = filtered.reduce((acc, r) => acc + Number(r.price), 0);
          ans1 = Math.round(sumVal);
          formula1 = `=СУММЕСЛИ(${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat}"; ${priceLetter}2:${priceLetter}${maxRowIndex})`;
          solution1 = `Отфильтруйте столбец «Категория товара» = «${targetCat}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и примените функцию СУММ.`;
        } else if (q1Kind === 'cond_maxmin') {
          const isCondMax = boolRng(rng, 0.5);
          const filtered = rows.filter((r) => r.category === targetCat);
          if (filtered.length === 0) {
            q1Text = `Сколько товаров относятся к категории ${quoteName(targetCat)}?`;
            ans1 = 0;
            formula1 = `=СЧЁТЕСЛИ(${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat}")`;
            solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Категория товара» и оставьте только «${targetCat}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
          } else if (isCondMax) {
            q1Text = `Какова наибольшая цена товара в категории ${quoteName(targetCat)}?`;
            ans1 = Math.max(...filtered.map((r) => Number(r.price)));
            formula1 = `=МАКСЕСЛИ(${priceLetter}2:${priceLetter}${maxRowIndex}; ${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat}")`;
            solution1 = `Отфильтруйте столбец «Категория товара» = «${targetCat}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и найдите среди них наибольшее (МАКС).`;
          } else {
            q1Text = `Какова наименьшая цена товара в категории ${quoteName(targetCat)}?`;
            ans1 = Math.min(...filtered.map((r) => Number(r.price)));
            formula1 = `=МИНЕСЛИ(${priceLetter}2:${priceLetter}${maxRowIndex}; ${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat}")`;
            solution1 = `Отфильтруйте столбец «Категория товара» = «${targetCat}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и найдите среди них наименьшее (МИН).`;
          }
        } else if (q1Kind === 'sumproduct') {
          q1Text = `Какова общая стоимость всех товаров категории ${quoteName(targetCat)}?`;
          const filtered = rows.filter((r) => r.category === targetCat);
          ans1 = filtered.reduce((acc, r) => acc + Number(r.price) * Number(r.quantity), 0);
          formula1 = `=СУММПРОИЗВ((${catLetter}2:${catLetter}${maxRowIndex}="${targetCat}")*(${priceLetter}2:${priceLetter}${maxRowIndex})*(${qtyLetter}2:${qtyLetter}${maxRowIndex}))`;
          solution1 = `Отфильтруйте по столбцу «Категория товара» = «${targetCat}», на новом листе в отдельном столбце перемножьте «Цена» и «Количество» построчно, затем сложите результаты функцией СУММ.`;
        } else if (q1Kind === 'percentage') {
          q1Text = `Какой процент от общего числа товаров составляют товары категории ${quoteName(targetCat)}?`;
          const countTarget = rows.filter((r) => r.category === targetCat).length;
          ans1 = (countTarget / rowCount) * 100;
          formula1 = `=СЧЁТЕСЛИ(${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat}")/${rowCount}*100`;
          solution1 = `Посчитайте количество строк по условию (как в Способе 1 — фильтром), разделите на общее число строк (${rowCount}) и умножьте на 100.`;
          isFractional1 = true;
        } else {
          q1Text = `Сколько товаров относятся к категории ${quoteName(targetCat)}?`;
          ans1 = rows.filter((r) => r.category === targetCat).length;
          formula1 = `=СЧЁТЕСЛИ(${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat}")`;
          solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Категория товара» и оставьте только «${targetCat}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
        }

        const targetCat2 = rng.pick(catSubSet);
        const targetShop2 = rng.pick(shopSubSet);
        const priceThresh = rng.int(200, 5000);
        const qtyThresh = rng.int(50, 250);

        if (difficulty === 3 && boolRng(rng, 0.35)) {
          const catA = rng.pick(catSubSet);
          const catB = pickNextCyclic(catSubSet, catA);
          const filteredA = rows.filter((r) => r.category === catA);
          const filteredB = rows.filter((r) => r.category === catB);
          const avgA = filteredA.length ? filteredA.reduce((acc, r) => acc + Number(r.price), 0) / filteredA.length : 0;
          const avgB = filteredB.length ? filteredB.reduce((acc, r) => acc + Number(r.price), 0) / filteredB.length : 0;
          q2Text = `На сколько различается средняя цена товаров категории ${quoteName(catA)} и категории ${quoteName(catB)}?`;
          ans2 = Math.abs(avgA - avgB);
          formula2 = `=ABS(СРЗНАЧЕСЛИ(${catLetter}2:${catLetter}${maxRowIndex}; "${catA}"; ${priceLetter}2:${priceLetter}${maxRowIndex}) - СРЗНАЧЕСЛИ(${catLetter}2:${catLetter}${maxRowIndex}; "${catB}"; ${priceLetter}2:${priceLetter}${maxRowIndex}))`;
          solution2 = `Посчитайте среднее по столбцу «Цена (руб.)» отдельно для «${catA}» и для «${catB}» (каждое — фильтром, как в Способе 1). Затем найдите разницу двух средних и возьмите её по модулю (без знака минус).`;
          isFractional2 = true;
        } else if (difficulty === 3 && boolRng(rng, 0.4)) {
          q2Text = `Сколько товаров категории ${quoteName(targetCat2)} стоят дороже ${priceThresh} рублей и имеются в количестве более ${qtyThresh} шт.?`;
          ans2 = rows.filter(
            (r) => r.category === targetCat2 && Number(r.price) > priceThresh && Number(r.quantity) > qtyThresh
          ).length;
          formula2 = `=СЧЁТЕСЛИМН(${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat2}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; ">${priceThresh}"; ${qtyLetter}2:${qtyLetter}${maxRowIndex}; ">${qtyThresh}")`;
          solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Категория товара» = «${targetCat2}», затем добавьте фильтр по столбцу «Цена (руб.)» (дороже ${priceThresh} рублей) и по столбцу «Количество (шт.)» (более ${qtyThresh} шт.). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
        } else if (difficulty >= 2 && boolRng(rng, 0.4)) {
          const low = rng.int(200, 2000);
          const high = low + rng.int(1000, 3000);
          q2Text = `Сколько товаров категории ${quoteName(targetCat2)} имеют цену от ${low} до ${high} рублей?`;
          ans2 = rows.filter((r) => r.category === targetCat2 && Number(r.price) >= low && Number(r.price) <= high).length;
          formula2 = `=СЧЁТЕСЛИМН(${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat2}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; ">=${low}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; "<=${high}")`;
          solution2 = `Скопируйте таблицу на новый лист, отфильтруйте столбец «Цена (руб.)», оставив значения от ${low} до ${high} (при необходимости добавьте фильтр по «Категория товара» = «${targetCat2}»). Посчитайте оставшиеся строки функцией СЧЁТЗ.`;
        } else if (boolRng(rng, 0.5)) {
          q2Text = `Сколько товаров категории ${quoteName(targetCat2)} дороже ${priceThresh} рублей?`;
          ans2 = rows.filter(
            (r) => r.category === targetCat2 && Number(r.price) > priceThresh
          ).length;
          formula2 = `=СЧЁТЕСЛИМН(${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat2}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; ">${priceThresh}")`;
          solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Категория товара» = «${targetCat2}», затем добавьте фильтр по столбцу «Цена (руб.)» (дороже ${priceThresh} рублей). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
        } else {
          q2Text = `Сколько товаров категории ${quoteName(targetCat2)} продаётся в магазине ${quoteName(targetShop2)}?`;
          ans2 = rows.filter(
            (r) => r.category === targetCat2 && r.shop === targetShop2
          ).length;
          formula2 = `=СЧЁТЕСЛИМН(${catLetter}2:${catLetter}${maxRowIndex}; "${targetCat2}"; ${shopLetter}2:${shopLetter}${maxRowIndex}; "${targetShop2}")`;
          solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Категория товара» = «${targetCat2}», затем добавьте фильтр по столбцу «Магазин» = «${targetShop2}». Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
        }

        const numSectors = difficulty === 3 ? rng.int(3, 5) : 3;
        chartTitle = 'распределение товаров по категориям';
        const chosenCats = sampleArr(rng, catSubSet, numSectors);
        chartData = chosenCats.map((c) => ({
          district: quoteName(c),
          count: rows.filter((r) => r.category === c).length,
        }));
      }
    } else if (themeDef.id === 'employees') {
      const deptSubSet = pickManyStable(DEPARTMENTS, seed, `task14:departments:L${difficulty}`, (s) => s, rng.int(4, 7));
      const citySubSet = pickManyStable(CITIES, seed, `task14:cities_emp:L${difficulty}`, (s) => s, rng.int(4, 7));

      columns = [
        { key: 'lastName', label: 'Фамилия', letter: '' },
        { key: 'firstName', label: 'Имя', letter: '' },
        { key: 'department', label: 'Отдел', letter: '' },
        { key: 'city', label: 'Город', letter: '' },
        { key: 'salary', label: 'Зарплата (руб.)', letter: '' },
      ];
      if (difficulty >= 2) {
        columns.push({ key: 'experience', label: 'Стаж (лет)', letter: '' });
      }
      if (difficulty === 3) {
        columns.push({ key: 'age', label: 'Возраст (лет)', letter: '' });
      }
      columns.forEach((col, idx) => {
        col.letter = LETTERS[idx];
      });

      // Q1 pre-selection
      const q1Kind = difficulty === 1
        ? rng.pick(['count', 'maxmin'])
        : difficulty === 2
        ? rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin'])
        : rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin', 'percentage']);
      let targetNumCol: 'salary' | 'experience' | 'age' | null = null;
      let isMax = false;

      if (q1Kind === 'maxmin') {
        const options: ('salary' | 'experience' | 'age')[] = ['salary'];
        if (difficulty >= 2) options.push('experience');
        if (difficulty === 3) options.push('age');
        targetNumCol = rng.pick(options);
        isMax = boolRng(rng, 0.5);
      }

      const people = samplePeople(rng, rowCount);
      for (let i = 0; i < rowCount; i++) {
        const { lastName, firstName } = people[i];

        const rowObj: Record<string, string | number> = {
          lastName,
          firstName,
          department: rng.pick(deptSubSet),
          city: rng.pick(citySubSet),
          salary: skewInt(rng, 30, 200) * 1000,
        };
        if (difficulty >= 2) {
          rowObj.experience = bellInt(rng, 0, 40);
        }
        if (difficulty === 3) {
          rowObj.age = bellInt(rng, 18, 65);
        }
        rows.push(rowObj);
      }

      const deptLetter = getColLetter('department');
      const cityLetter = getColLetter('city');
      const salLetter = getColLetter('salary');
      const expLetter = difficulty >= 2 ? getColLetter('experience') : '';
      const ageLetter = difficulty === 3 ? getColLetter('age') : '';

      const targetDept = rng.pick(deptSubSet);
      const targetCity = rng.pick(citySubSet);

      if (q1Kind === 'maxmin') {
        if (targetNumCol === 'salary') {
          q1Text = isMax
            ? 'Какова наибольшая зарплата среди всех сотрудников?'
            : 'Какова наименьшая зарплата среди всех сотрудников?';
          ans1 = isMax
            ? Math.max(...rows.map((r) => Number(r.salary)))
            : Math.min(...rows.map((r) => Number(r.salary)));
          formula1 = isMax
            ? `=МАКС(${salLetter}2:${salLetter}${maxRowIndex})`
            : `=МИН(${salLetter}2:${salLetter}${maxRowIndex})`;
          solution1 = isMax
            ? 'Фильтровать не нужно: выделите весь столбец «Зарплата (руб.)» и примените функцию МАКС.'
            : 'Фильтровать не нужно: выделите весь столбец «Зарплата (руб.)» и примените функцию МИН.';
        } else if (targetNumCol === 'experience') {
          q1Text = isMax
            ? 'Каков наибольший стаж работы среди всех сотрудников?'
            : 'Каков наименьший стаж работы среди всех сотрудников?';
          ans1 = isMax
            ? Math.max(...rows.map((r) => Number(r.experience)))
            : Math.min(...rows.map((r) => Number(r.experience)));
          formula1 = isMax
            ? `=МАКС(${expLetter}2:${expLetter}${maxRowIndex})`
            : `=МИН(${expLetter}2:${expLetter}${maxRowIndex})`;
          solution1 = isMax
            ? 'Фильтровать не нужно: выделите весь столбец «Стаж (лет)» и примените функцию МАКС.'
            : 'Фильтровать не нужно: выделите весь столбец «Стаж (лет)» и примените функцию МИН.';
        } else {
          q1Text = isMax
            ? 'Каков наибольший возраст среди всех сотрудников?'
            : 'Каков наименьший возраст среди всех сотрудников?';
          ans1 = isMax
            ? Math.max(...rows.map((r) => Number(r.age)))
            : Math.min(...rows.map((r) => Number(r.age)));
          formula1 = isMax
            ? `=МАКС(${ageLetter}2:${ageLetter}${maxRowIndex})`
            : `=МИН(${ageLetter}2:${ageLetter}${maxRowIndex})`;
          solution1 = isMax
            ? 'Фильтровать не нужно: выделите весь столбец «Возраст (лет)» и примените функцию МАКС.'
            : 'Фильтровать не нужно: выделите весь столбец «Возраст (лет)» и примените функцию МИН.';
        }
      } else if (q1Kind === 'average') {
        q1Text = `Какова средняя зарплата сотрудников из города ${targetCity}?`;
        const filtered = rows.filter((r) => r.city === targetCity);
        const sum = filtered.reduce((acc, r) => acc + Number(r.salary), 0);
        ans1 = filtered.length === 0 ? 0 : sum / filtered.length;
        formula1 = `=СРЗНАЧЕСЛИ(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity}"; ${salLetter}2:${salLetter}${maxRowIndex})`;
        solution1 = `Отфильтруйте столбец «Город» = «${targetCity}», скопируйте отфильтрованные значения столбца «Зарплата (руб.)» на новый лист и примените функцию СРЗНАЧ.`;
        isFractional1 = true;
      } else if (q1Kind === 'sum') {
        q1Text = `Каков суммарный фонд заработной платы сотрудников отдела ${targetDept}?`;
        const filtered = rows.filter((r) => r.department === targetDept);
        const sumVal = filtered.reduce((acc, r) => acc + Number(r.salary), 0);
        ans1 = Math.round(sumVal);
        formula1 = `=СУММЕСЛИ(${deptLetter}2:${deptLetter}${maxRowIndex}; "${targetDept}"; ${salLetter}2:${salLetter}${maxRowIndex})`;
        solution1 = `Отфильтруйте столбец «Отдел» = «${targetDept}», скопируйте отфильтрованные значения столбца «Зарплата (руб.)» на новый лист и примените функцию СУММ.`;
      } else if (q1Kind === 'cond_maxmin') {
        const isCondMax = boolRng(rng, 0.5);
        const filtered = rows.filter((r) => r.department === targetDept);
        if (filtered.length === 0) {
          q1Text = `Сколько сотрудников работают в отделе ${targetDept}?`;
          ans1 = 0;
          formula1 = `=СЧЁТЕСЛИ(${deptLetter}2:${deptLetter}${maxRowIndex}; "${targetDept}")`;
          solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Отдел» и оставьте только «${targetDept}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
        } else if (isCondMax) {
          q1Text = `Какова наибольшая зарплата сотрудников в отделе ${targetDept}?`;
          ans1 = Math.max(...filtered.map((r) => Number(r.salary)));
          formula1 = `=МАКСЕСЛИ(${salLetter}2:${salLetter}${maxRowIndex}; ${deptLetter}2:${deptLetter}${maxRowIndex}; "${targetDept}")`;
          solution1 = `Отфильтруйте столбец «Отдел» = «${targetDept}», скопируйте отфильтрованные значения столбца «Зарплата (руб.)» на новый лист и найдите среди них наибольшее (МАКС).`;
        } else {
          q1Text = `Какова наименьшая зарплата сотрудников в отделе ${targetDept}?`;
          ans1 = Math.min(...filtered.map((r) => Number(r.salary)));
          formula1 = `=МИНЕСЛИ(${salLetter}2:${salLetter}${maxRowIndex}; ${deptLetter}2:${deptLetter}${maxRowIndex}; "${targetDept}")`;
          solution1 = `Отфильтруйте столбец «Отдел» = «${targetDept}», скопируйте отфильтрованные значения столбца «Зарплата (руб.)» на новый лист и найдите среди них наименьшее (МИН).`;
        }
      } else if (q1Kind === 'percentage') {
        q1Text = `Какой процент от общего числа сотрудников составляют сотрудники из города ${targetCity}?`;
        const countTarget = rows.filter((r) => r.city === targetCity).length;
        ans1 = (countTarget / rowCount) * 100;
        formula1 = `=СЧЁТЕСЛИ(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity}")/${rowCount}*100`;
        solution1 = `Посчитайте количество строк по условию (как в Способе 1 — фильтром), разделите на общее число строк (${rowCount}) и умножьте на 100.`;
        isFractional1 = true;
      } else {
        q1Text = `Сколько сотрудников работают в отделе ${targetDept}?`;
        ans1 = rows.filter((r) => r.department === targetDept).length;
        formula1 = `=СЧЁТЕСЛИ(${deptLetter}2:${deptLetter}${maxRowIndex}; "${targetDept}")`;
        solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Отдел» и оставьте только «${targetDept}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
      }

      const targetDept2 = rng.pick(deptSubSet);
      const targetCity2 = rng.pick(citySubSet);
      const salaryThresh = rng.int(50, 150) * 1000;
      const expThresh = rng.int(3, 15);

      if (difficulty === 3 && boolRng(rng, 0.35)) {
        const deptA = rng.pick(deptSubSet);
        const deptB = pickNextCyclic(deptSubSet, deptA);
        const filteredA = rows.filter((r) => r.department === deptA);
        const filteredB = rows.filter((r) => r.department === deptB);
        const avgA = filteredA.length ? filteredA.reduce((acc, r) => acc + Number(r.salary), 0) / filteredA.length : 0;
        const avgB = filteredB.length ? filteredB.reduce((acc, r) => acc + Number(r.salary), 0) / filteredB.length : 0;
        q2Text = `На сколько различается средняя зарплата сотрудников в отделе ${deptA} и отделе ${deptB}?`;
        ans2 = Math.abs(avgA - avgB);
        formula2 = `=ABS(СРЗНАЧЕСЛИ(${deptLetter}2:${deptLetter}${maxRowIndex}; "${deptA}"; ${salLetter}2:${salLetter}${maxRowIndex}) - СРЗНАЧЕСЛИ(${deptLetter}2:${deptLetter}${maxRowIndex}; "${deptB}"; ${salLetter}2:${salLetter}${maxRowIndex}))`;
        solution2 = `Посчитайте среднее по столбцу «Зарплата (руб.)» отдельно для «${deptA}» и для «${deptB}» (каждое — фильтром, как в Способе 1). Затем найдите разницу двух средних и возьмите её по модулю (без знака минус).`;
        isFractional2 = true;
      } else if (difficulty === 3 && boolRng(rng, 0.4)) {
        q2Text = `Сколько сотрудников из отдела ${targetDept2} получают зарплату больше ${salaryThresh} рублей и имеют стаж больше ${expThresh} лет?`;
        ans2 = rows.filter(
          (r) => r.department === targetDept2 && Number(r.salary) > salaryThresh && Number(r.experience) > expThresh
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${deptLetter}2:${deptLetter}${maxRowIndex}; "${targetDept2}"; ${salLetter}2:${salLetter}${maxRowIndex}; ">${salaryThresh}"; ${expLetter}2:${expLetter}${maxRowIndex}; ">${expThresh}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Отдел» = «${targetDept2}», затем добавьте фильтр по столбцу «Зарплата (руб.)» (больше ${salaryThresh} рублей) и по столбцу «Стаж (лет)» (больше ${expThresh} лет). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      } else if (difficulty >= 2 && boolRng(rng, 0.4)) {
        const low = rng.int(40, 80) * 1000;
        const high = low + rng.int(30, 70) * 1000;
        q2Text = `Сколько сотрудников получают зарплату от ${low} до ${high} рублей?`;
        ans2 = rows.filter((r) => Number(r.salary) >= low && Number(r.salary) <= high).length;
        formula2 = `=СЧЁТЕСЛИМН(${salLetter}2:${salLetter}${maxRowIndex}; ">=${low}"; ${salLetter}2:${salLetter}${maxRowIndex}; "<=${high}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте столбец «Зарплата (руб.)», оставив значения от ${low} до ${high}. Посчитайте оставшиеся строки функцией СЧЁТЗ.`;
      } else if (difficulty >= 2 && boolRng(rng, 0.5)) {
        q2Text = `Сколько сотрудников из города ${targetCity2} имеют стаж больше ${expThresh} лет?`;
        ans2 = rows.filter(
          (r) => r.city === targetCity2 && Number(r.experience) > expThresh
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity2}"; ${expLetter}2:${expLetter}${maxRowIndex}; ">${expThresh}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Город» = «${targetCity2}», затем добавьте фильтр по столбцу «Стаж (лет)» (больше ${expThresh} лет). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      } else {
        q2Text = `Сколько сотрудников из отдела ${targetDept2} получают зарплату больше ${salaryThresh} рублей?`;
        ans2 = rows.filter(
          (r) => r.department === targetDept2 && Number(r.salary) > salaryThresh
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${deptLetter}2:${deptLetter}${maxRowIndex}; "${targetDept2}"; ${salLetter}2:${salLetter}${maxRowIndex}; ">${salaryThresh}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Отдел» = «${targetDept2}», затем добавьте фильтр по столбцу «Зарплата (руб.)» (больше ${salaryThresh} рублей). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      }

      const numSectors = difficulty === 3 ? rng.int(3, 5) : 3;
      if (difficulty === 3 && boolRng(rng, 0.4)) {
        chartTitle = 'распределение сотрудников по диапазонам зарплаты';
        const salaryBins = [
          { label: 'До 50 000 руб.', min: 0, max: 50000 },
          { label: '50 000 – 100 000 руб.', min: 50001, max: 100000 },
          { label: '100 000 – 150 000 руб.', min: 100001, max: 150000 },
          { label: 'Свыше 150 000 руб.', min: 150001, max: Infinity },
        ];
        const chosenBins = sampleArr(rng, salaryBins, numSectors);
        chartData = chosenBins.map((bin) => ({
          district: bin.label,
          count: rows.filter((r) => Number(r.salary) >= bin.min && Number(r.salary) <= bin.max).length,
        }));
      } else {
        chartTitle = 'распределение сотрудников по отделам';
        const chosenDepts = sampleArr(rng, deptSubSet, numSectors);
        chartData = chosenDepts.map((d) => ({
          district: d,
          count: rows.filter((r) => r.department === d).length,
        }));
      }
    } else if (themeDef.id === 'athletes') {
      const sportSubSet = pickManyStable(SPORTS, seed, `task14:sports:L${difficulty}`, (s) => s, rng.int(4, 8));
      const countrySubSet = pickManyStable(COUNTRIES, seed, `task14:countries:L${difficulty}`, (s) => s, rng.int(4, 8));

      columns = [
        { key: 'lastName', label: 'Фамилия', letter: '' },
        { key: 'firstName', label: 'Имя', letter: '' },
        { key: 'sport', label: 'Вид спорта', letter: '' },
        { key: 'country', label: 'Страна', letter: '' },
        { key: 'points', label: 'Очки', letter: '' },
      ];
      if (difficulty >= 2) {
        columns.push({ key: 'age', label: 'Возраст (лет)', letter: '' });
      }
      columns.forEach((col, idx) => {
        col.letter = LETTERS[idx];
      });

      // Q1 pre-selection
      const q1Kind = difficulty === 1
        ? rng.pick(['count', 'maxmin'])
        : difficulty === 2
        ? rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin'])
        : rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin', 'percentage']);
      let targetNumCol: 'points' | 'age' | null = null;
      let isMax = false;

      if (q1Kind === 'maxmin') {
        const options: ('points' | 'age')[] = ['points'];
        if (difficulty >= 2) options.push('age');
        targetNumCol = rng.pick(options);
        isMax = boolRng(rng, 0.5);
      }

      const people = samplePeople(rng, rowCount);
      for (let i = 0; i < rowCount; i++) {
        const { lastName, firstName } = people[i];

        const rowObj: Record<string, string | number> = {
          lastName,
          firstName,
          sport: rng.pick(sportSubSet),
          country: rng.pick(countrySubSet),
          points: bellInt(rng, 0, 1000),
        };
        if (difficulty >= 2) {
          rowObj.age = bellInt(rng, 14, 40);
        }
        rows.push(rowObj);
      }

      const sportLetter = getColLetter('sport');
      const countryLetter = getColLetter('country');
      const pointsLetter = getColLetter('points');
      const ageLetter = difficulty >= 2 ? getColLetter('age') : '';

      const targetSport = rng.pick(sportSubSet);
      const targetCountry = rng.pick(countrySubSet);

      if (q1Kind === 'maxmin') {
        if (targetNumCol === 'points') {
          q1Text = isMax
            ? 'Каково наибольшее количество очков среди всех спортсменов?'
            : 'Каково наименьшее количество очков среди всех спортсменов?';
          ans1 = isMax
            ? Math.max(...rows.map((r) => Number(r.points)))
            : Math.min(...rows.map((r) => Number(r.points)));
          formula1 = isMax
            ? `=МАКС(${pointsLetter}2:${pointsLetter}${maxRowIndex})`
            : `=МИН(${pointsLetter}2:${pointsLetter}${maxRowIndex})`;
          solution1 = isMax
            ? 'Фильтровать не нужно: выделите весь столбец «Очки» и примените функцию МАКС.'
            : 'Фильтровать не нужно: выделите весь столбец «Очки» и примените функцию МИН.';
        } else {
          q1Text = isMax
            ? 'Каков наибольший возраст среди всех спортсменов?'
            : 'Каков наименьший возраст среди всех спортсменов?';
          ans1 = isMax
            ? Math.max(...rows.map((r) => Number(r.age)))
            : Math.min(...rows.map((r) => Number(r.age)));
          formula1 = isMax
            ? `=МАКС(${ageLetter}2:${ageLetter}${maxRowIndex})`
            : `=МИН(${ageLetter}2:${ageLetter}${maxRowIndex})`;
          solution1 = isMax
            ? 'Фильтровать не нужно: выделите весь столбец «Возраст (лет)» и примените функцию МАКС.'
            : 'Фильтровать не нужно: выделите весь столбец «Возраст (лет)» и примените функцию МИН.';
        }
      } else if (q1Kind === 'average') {
        q1Text = `Каково среднее количество очков у спортсменов из страны ${targetCountry}?`;
        const filtered = rows.filter((r) => r.country === targetCountry);
        const sum = filtered.reduce((acc, r) => acc + Number(r.points), 0);
        ans1 = filtered.length === 0 ? 0 : sum / filtered.length;
        formula1 = `=СРЗНАЧЕСЛИ(${countryLetter}2:${countryLetter}${maxRowIndex}; "${targetCountry}"; ${pointsLetter}2:${pointsLetter}${maxRowIndex})`;
        solution1 = `Отфильтруйте столбец «Страна» = «${targetCountry}», скопируйте отфильтрованные значения столбца «Очки» на новый лист и примените функцию СРЗНАЧ.`;
        isFractional1 = true;
      } else if (q1Kind === 'sum') {
        q1Text = `Какова сумма очков у спортсменов из страны ${targetCountry}?`;
        const filtered = rows.filter((r) => r.country === targetCountry);
        const sumVal = filtered.reduce((acc, r) => acc + Number(r.points), 0);
        ans1 = Math.round(sumVal);
        formula1 = `=СУММЕСЛИ(${countryLetter}2:${countryLetter}${maxRowIndex}; "${targetCountry}"; ${pointsLetter}2:${pointsLetter}${maxRowIndex})`;
        solution1 = `Отфильтруйте столбец «Страна» = «${targetCountry}», скопируйте отфильтрованные значения столбца «Очки» на новый лист и примените функцию СУММ.`;
      } else if (q1Kind === 'cond_maxmin') {
        const isCondMax = boolRng(rng, 0.5);
        const filtered = rows.filter((r) => r.country === targetCountry);
        if (filtered.length === 0) {
          q1Text = `Сколько спортсменов представляют страну ${targetCountry}?`;
          ans1 = 0;
          formula1 = `=СЧЁТЕСЛИ(${countryLetter}2:${countryLetter}${maxRowIndex}; "${targetCountry}")`;
          solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Страна» и оставьте только «${targetCountry}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
        } else if (isCondMax) {
          q1Text = `Каково наибольшее количество очков у спортсменов из страны ${targetCountry}?`;
          ans1 = Math.max(...filtered.map((r) => Number(r.points)));
          formula1 = `=МАКСЕСЛИ(${pointsLetter}2:${pointsLetter}${maxRowIndex}; ${countryLetter}2:${countryLetter}${maxRowIndex}; "${targetCountry}")`;
          solution1 = `Отфильтруйте столбец «Страна» = «${targetCountry}», скопируйте отфильтрованные значения столбца «Очки» на новый лист и найдите среди них наибольшее (МАКС).`;
        } else {
          q1Text = `Каково наименьшее количество очков у спортсменов из страны ${targetCountry}?`;
          ans1 = Math.min(...filtered.map((r) => Number(r.points)));
          formula1 = `=МИНЕСЛИ(${pointsLetter}2:${pointsLetter}${maxRowIndex}; ${countryLetter}2:${countryLetter}${maxRowIndex}; "${targetCountry}")`;
          solution1 = `Отфильтруйте столбец «Страна» = «${targetCountry}», скопируйте отфильтрованные значения столбца «Очки» на новый лист и найдите среди них наименьшее (МИН).`;
        }
      } else if (q1Kind === 'percentage') {
        q1Text = `Какой процент от общего числа спортсменов составляют спортсмены из страны ${targetCountry}?`;
        const countTarget = rows.filter((r) => r.country === targetCountry).length;
        ans1 = (countTarget / rowCount) * 100;
        formula1 = `=СЧЁТЕСЛИ(${countryLetter}2:${countryLetter}${maxRowIndex}; "${targetCountry}")/${rowCount}*100`;
        solution1 = `Посчитайте количество строк по условию (как в Способе 1 — фильтром), разделите на общее число строк (${rowCount}) и умножьте на 100.`;
        isFractional1 = true;
      } else {
        q1Text = `Сколько спортсменов занимаются видом спорта ${quoteName(targetSport)}?`;
        ans1 = rows.filter((r) => r.sport === targetSport).length;
        formula1 = `=СЧЁТЕСЛИ(${sportLetter}2:${sportLetter}${maxRowIndex}; "${targetSport}")`;
        solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Вид спорта» и оставьте только «${targetSport}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
      }

      const targetSport2 = rng.pick(sportSubSet);
      const targetCountry2 = rng.pick(countrySubSet);
      const pointsThresh = rng.int(300, 800);
      const ageThresh = rng.int(18, 30);

      if (difficulty === 3 && boolRng(rng, 0.35)) {
        const cA = rng.pick(countrySubSet);
        const cB = pickNextCyclic(countrySubSet, cA);
        const filteredA = rows.filter((r) => r.country === cA);
        const filteredB = rows.filter((r) => r.country === cB);
        const avgA = filteredA.length ? filteredA.reduce((acc, r) => acc + Number(r.points), 0) / filteredA.length : 0;
        const avgB = filteredB.length ? filteredB.reduce((acc, r) => acc + Number(r.points), 0) / filteredB.length : 0;
        q2Text = `На сколько различается среднее количество очков у спортсменов из страны ${cA} и страны ${cB}?`;
        ans2 = Math.abs(avgA - avgB);
        formula2 = `=ABS(СРЗНАЧЕСЛИ(${countryLetter}2:${countryLetter}${maxRowIndex}; "${cA}"; ${pointsLetter}2:${pointsLetter}${maxRowIndex}) - СРЗНАЧЕСЛИ(${countryLetter}2:${countryLetter}${maxRowIndex}; "${cB}"; ${pointsLetter}2:${pointsLetter}${maxRowIndex}))`;
        solution2 = `Посчитайте среднее по столбцу «Очки» отдельно для «${cA}» и для «${cB}» (каждое — фильтром, как в Способе 1). Затем найдите разницу двух средних и возьмите её по модулю (без знака минус).`;
        isFractional2 = true;
      } else if (difficulty === 3 && boolRng(rng, 0.4)) {
        q2Text = `Сколько спортсменов из страны ${targetCountry2} занимаются видом спорта ${quoteName(targetSport2)} и набрали больше ${pointsThresh} очков?`;
        ans2 = rows.filter(
          (r) => r.country === targetCountry2 && r.sport === targetSport2 && Number(r.points) > pointsThresh
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${countryLetter}2:${countryLetter}${maxRowIndex}; "${targetCountry2}"; ${sportLetter}2:${sportLetter}${maxRowIndex}; "${targetSport2}"; ${pointsLetter}2:${pointsLetter}${maxRowIndex}; ">${pointsThresh}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Страна» = «${targetCountry2}», затем добавьте фильтр по столбцу «Вид спорта» = «${targetSport2}» и по столбцу «Очки» (больше ${pointsThresh} очков). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      } else if (difficulty >= 2 && boolRng(rng, 0.4)) {
        const low = rng.int(200, 500);
        const high = low + rng.int(200, 400);
        q2Text = `Сколько спортсменов набрали от ${low} до ${high} очков?`;
        ans2 = rows.filter((r) => Number(r.points) >= low && Number(r.points) <= high).length;
        formula2 = `=СЧЁТЕСЛИМН(${pointsLetter}2:${pointsLetter}${maxRowIndex}; ">=${low}"; ${pointsLetter}2:${pointsLetter}${maxRowIndex}; "<=${high}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте столбец «Очки», оставив значения от ${low} до ${high}. Посчитайте оставшиеся строки функцией СЧЁТЗ.`;
      } else if (difficulty >= 2 && boolRng(rng, 0.5)) {
        q2Text = `Сколько спортсменов старше ${ageThresh} лет занимаются видом спорта ${quoteName(targetSport2)}?`;
        ans2 = rows.filter(
          (r) => r.sport === targetSport2 && Number(r.age) > ageThresh
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${sportLetter}2:${sportLetter}${maxRowIndex}; "${targetSport2}"; ${ageLetter}2:${ageLetter}${maxRowIndex}; ">${ageThresh}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Вид спорта» = «${targetSport2}», затем добавьте фильтр по столбцу «Возраст (лет)» (старше ${ageThresh} лет). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      } else {
        q2Text = `Сколько спортсменов из страны ${targetCountry2} набрали больше ${pointsThresh} очков?`;
        ans2 = rows.filter(
          (r) => r.country === targetCountry2 && Number(r.points) > pointsThresh
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${countryLetter}2:${countryLetter}${maxRowIndex}; "${targetCountry2}"; ${pointsLetter}2:${pointsLetter}${maxRowIndex}; ">${pointsThresh}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Страна» = «${targetCountry2}», затем добавьте фильтр по столбцу «Очки» (больше ${pointsThresh} очков). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      }

      const numSectors = difficulty === 3 ? rng.int(3, 5) : 3;
      chartTitle = 'распределение спортсменов по видам спорта';
      const chosenSports = sampleArr(rng, sportSubSet, numSectors);
      chartData = chosenSports.map((s) => ({
        district: quoteName(s),
        count: rows.filter((r) => r.sport === s).length,
      }));
    } else if (themeDef.id === 'cars') {
      const brandSubSet = pickManyStable(CAR_BRANDS, seed, `task14:brands:L${difficulty}`, (s) => s, rng.int(6, 14));
      const citySubSet = pickManyStable(CITIES, seed, `task14:cities_car:L${difficulty}`, (s) => s, rng.int(5, 12));

      columns = [
        { key: 'brand', label: 'Марка', letter: '' },
        { key: 'city', label: 'Город', letter: '' },
        { key: 'price', label: 'Цена (руб.)', letter: '' },
      ];
      if (difficulty >= 2) {
        columns.push({ key: 'mileage', label: 'Пробег (км)', letter: '' });
      }
      columns.push({ key: 'year', label: 'Год выпуска', letter: '' });

      columns.forEach((col, idx) => {
        col.letter = LETTERS[idx];
      });

      // Q1 pre-selection
      const q1Kind = difficulty === 1
        ? rng.pick(['count', 'maxmin'])
        : difficulty === 2
        ? rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin'])
        : rng.pick(['count', 'average', 'maxmin', 'sum', 'cond_maxmin', 'percentage']);
      let targetNumCol: 'price' | 'mileage' | null = null;
      let isMax = false;

      if (q1Kind === 'maxmin') {
        targetNumCol = difficulty >= 2 ? rng.pick(['price', 'mileage']) : 'price';
        isMax = boolRng(rng, 0.5);
      }

      for (let i = 0; i < rowCount; i++) {
        const rowObj: Record<string, string | number> = {
          brand: rng.pick(brandSubSet),
          city: rng.pick(citySubSet),
          price: skewInt(rng, 300000, 15000000),
          year: bellInt(rng, 2005, 2024),
        };
        if (difficulty >= 2) {
          rowObj.mileage = skewInt(rng, 0, 300000);
        }
        rows.push(rowObj);
      }

      const brandLetter = getColLetter('brand');
      const cityLetter = getColLetter('city');
      const priceLetter = getColLetter('price');
      const mileageLetter = difficulty >= 2 ? getColLetter('mileage') : '';

      const targetBrand = rng.pick(brandSubSet);
      const targetCity = rng.pick(citySubSet);

      if (q1Kind === 'maxmin') {
        if (targetNumCol === 'price') {
          q1Text = isMax
            ? 'Какова наибольшая цена автомобиля среди всех представленных?'
            : 'Какова наименьшая цена автомобиля среди всех представленных?';
          ans1 = isMax
            ? Math.max(...rows.map((r) => Number(r.price)))
            : Math.min(...rows.map((r) => Number(r.price)));
          formula1 = isMax
            ? `=МАКС(${priceLetter}2:${priceLetter}${maxRowIndex})`
            : `=МИН(${priceLetter}2:${priceLetter}${maxRowIndex})`;
          solution1 = isMax
            ? 'Фильтровать не нужно: выделите весь столбец «Цена (руб.)» и примените функцию МАКС.'
            : 'Фильтровать не нужно: выделите весь столбец «Цена (руб.)» и примените функцию МИН.';
        } else {
          q1Text = isMax
            ? 'Каков наибольший пробег автомобиля среди всех представленных?'
            : 'Каков наименьший пробег автомобиля среди всех представленных?';
          ans1 = isMax
            ? Math.max(...rows.map((r) => Number(r.mileage)))
            : Math.min(...rows.map((r) => Number(r.mileage)));
          formula1 = isMax
            ? `=МАКС(${mileageLetter}2:${mileageLetter}${maxRowIndex})`
            : `=МИН(${mileageLetter}2:${mileageLetter}${maxRowIndex})`;
          solution1 = isMax
            ? 'Фильтровать не нужно: выделите весь столбец «Пробег (км)» и примените функцию МАКС.'
            : 'Фильтровать не нужно: выделите весь столбец «Пробег (км)» и примените функцию МИН.';
        }
      } else if (q1Kind === 'average') {
        q1Text = `Какова средняя цена автомобилей марки ${quoteName(targetBrand)}?`;
        const filtered = rows.filter((r) => r.brand === targetBrand);
        const sum = filtered.reduce((acc, r) => acc + Number(r.price), 0);
        ans1 = filtered.length === 0 ? 0 : sum / filtered.length;
        formula1 = `=СРЗНАЧЕСЛИ(${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand}"; ${priceLetter}2:${priceLetter}${maxRowIndex})`;
        solution1 = `Отфильтруйте столбец «Марка» = «${targetBrand}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и примените функцию СРЗНАЧ.`;
        isFractional1 = true;
      } else if (q1Kind === 'sum') {
        q1Text = `Какова суммарная стоимость всех автомобилей марки ${quoteName(targetBrand)}?`;
        const filtered = rows.filter((r) => r.brand === targetBrand);
        const sumVal = filtered.reduce((acc, r) => acc + Number(r.price), 0);
        ans1 = Math.round(sumVal);
        formula1 = `=СУММЕСЛИ(${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand}"; ${priceLetter}2:${priceLetter}${maxRowIndex})`;
        solution1 = `Отфильтруйте столбец «Марка» = «${targetBrand}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и примените функцию СУММ.`;
      } else if (q1Kind === 'cond_maxmin') {
        const filtered = rows.filter((r) => r.brand === targetBrand);
        if (filtered.length === 0) {
          q1Text = `Сколько автомобилей марки ${quoteName(targetBrand)}?`;
          ans1 = 0;
          formula1 = `=СЧЁТЕСЛИ(${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand}")`;
          solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Марка» и оставьте только «${targetBrand}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
        } else {
          const isCondMax = boolRng(rng, 0.5);
          if (isCondMax) {
            q1Text = `Какова наибольшая цена автомобиля марки ${quoteName(targetBrand)}?`;
            ans1 = Math.max(...filtered.map((r) => Number(r.price)));
            formula1 = `=МАКСЕСЛИ(${priceLetter}2:${priceLetter}${maxRowIndex}; ${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand}")`;
            solution1 = `Отфильтруйте столбец «Марка» = «${targetBrand}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и найдите среди них наибольшее (МАКС).`;
          } else {
            q1Text = `Какова наименьшая цена автомобиля марки ${quoteName(targetBrand)}?`;
            ans1 = Math.min(...filtered.map((r) => Number(r.price)));
            formula1 = `=МИНЕСЛИ(${priceLetter}2:${priceLetter}${maxRowIndex}; ${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand}")`;
            solution1 = `Отфильтруйте столбец «Марка» = «${targetBrand}», скопируйте отфильтрованные значения столбца «Цена (руб.)» на новый лист и найдите среди них наименьшее (МИН).`;
          }
        }
      } else if (q1Kind === 'percentage') {
        q1Text = `Какой процент от общего числа автомобилей составляют автомобили марки ${quoteName(targetBrand)}?`;
        const countTarget = rows.filter((r) => r.brand === targetBrand).length;
        ans1 = (countTarget / rowCount) * 100;
        formula1 = `=СЧЁТЕСЛИ(${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand}")/${rowCount}*100`;
        solution1 = `Посчитайте количество строк по условию (как в Способе 1 — фильтром), разделите на общее число строк (${rowCount}) и умножьте на 100.`;
        isFractional1 = true;
      } else {
        if (boolRng(rng, 0.5)) {
          q1Text = `Сколько автомобилей марки ${quoteName(targetBrand)}?`;
          ans1 = rows.filter((r) => r.brand === targetBrand).length;
          formula1 = `=СЧЁТЕСЛИ(${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand}")`;
          solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Марка» и оставьте только «${targetBrand}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
        } else {
          q1Text = `Сколько автомобилей находятся в городе ${targetCity}?`;
          ans1 = rows.filter((r) => r.city === targetCity).length;
          formula1 = `=СЧЁТЕСЛИ(${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity}")`;
          solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Город» и оставьте только «${targetCity}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
        }
      }

      // Q2 - independent entity selection from brandSubSet and citySubSet
      const targetBrand2 = rng.pick(brandSubSet);
      const targetCity2 = rng.pick(citySubSet);
      const priceThresh = rng.int(500, 10000) * 1000;
      const mileageThresh = rng.int(50, 200) * 1000;

      if (difficulty === 3 && boolRng(rng, 0.35)) {
        const brandA = rng.pick(brandSubSet);
        const brandB = pickNextCyclic(brandSubSet, brandA);
        const filteredA = rows.filter((r) => r.brand === brandA);
        const filteredB = rows.filter((r) => r.brand === brandB);
        const avgA = filteredA.length ? filteredA.reduce((acc, r) => acc + Number(r.price), 0) / filteredA.length : 0;
        const avgB = filteredB.length ? filteredB.reduce((acc, r) => acc + Number(r.price), 0) / filteredB.length : 0;
        q2Text = `На сколько различается средняя цена автомобилей между марками ${quoteName(brandA)} и ${quoteName(brandB)}?`;
        ans2 = Math.abs(avgA - avgB);
        formula2 = `=ABS(СРЗНАЧЕСЛИ(${brandLetter}2:${brandLetter}${maxRowIndex}; "${brandA}"; ${priceLetter}2:${priceLetter}${maxRowIndex}) - СРЗНАЧЕСЛИ(${brandLetter}2:${brandLetter}${maxRowIndex}; "${brandB}"; ${priceLetter}2:${priceLetter}${maxRowIndex}))`;
        solution2 = `Посчитайте среднее по столбцу «Цена (руб.)» отдельно для «${brandA}» и для «${brandB}» (каждое — фильтром, как в Способе 1). Затем найдите разницу двух средних и возьмите её по модулю (без знака минус).`;
        isFractional2 = true;
      } else if (difficulty === 3 && boolRng(rng, 0.35)) {
        q2Text = `Сколько автомобилей марки ${quoteName(targetBrand2)} в городе ${targetCity2} стоят дороже ${priceThresh} рублей?`;
        ans2 = rows.filter(
          (r) => r.brand === targetBrand2 && r.city === targetCity2 && Number(r.price) > priceThresh
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand2}"; ${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity2}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; ">${priceThresh}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Марка» = «${targetBrand2}», затем добавьте фильтр по столбцу «Город» = «${targetCity2}» и по столбцу «Цена (руб.)» (дороже ${priceThresh} рублей). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      } else if (difficulty >= 2 && boolRng(rng, 0.35)) {
        const low = rng.int(500, 4000) * 1000;
        const high = low + rng.int(2000, 5000) * 1000;
        q2Text = `Сколько автомобилей имеют цену от ${low} до ${high} рублей?`;
        ans2 = rows.filter((r) => Number(r.price) >= low && Number(r.price) <= high).length;
        formula2 = `=СЧЁТЕСЛИМН(${priceLetter}2:${priceLetter}${maxRowIndex}; ">=${low}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; "<=${high}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте столбец «Цена (руб.)», оставив значения от ${low} до ${high}. Посчитайте оставшиеся строки функцией СЧЁТЗ.`;
      } else if (difficulty >= 2 && boolRng(rng, 0.35)) {
        q2Text = `Сколько автомобилей марки ${quoteName(targetBrand2)} имеют пробег меньше ${mileageThresh} км?`;
        ans2 = rows.filter(
          (r) => r.brand === targetBrand2 && Number(r.mileage) < mileageThresh
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand2}"; ${mileageLetter}2:${mileageLetter}${maxRowIndex}; "<${mileageThresh}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Марка» = «${targetBrand2}», затем добавьте фильтр по столбцу «Пробег (км)» (меньше ${mileageThresh} км). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      } else {
        const choice = boolRng(rng, 0.5);
        if (choice) {
          q2Text = `Сколько автомобилей марки ${quoteName(targetBrand2)} в городе ${targetCity2}?`;
          ans2 = rows.filter(
            (r) => r.brand === targetBrand2 && r.city === targetCity2
          ).length;
          formula2 = `=СЧЁТЕСЛИМН(${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand2}"; ${cityLetter}2:${cityLetter}${maxRowIndex}; "${targetCity2}")`;
          solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Марка» = «${targetBrand2}», затем добавьте фильтр по столбцу «Город» = «${targetCity2}». Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
        } else {
          q2Text = `Сколько автомобилей марки ${quoteName(targetBrand2)} стоят дороже ${priceThresh} рублей?`;
          ans2 = rows.filter(
            (r) => r.brand === targetBrand2 && Number(r.price) > priceThresh
          ).length;
          formula2 = `=СЧЁТЕСЛИМН(${brandLetter}2:${brandLetter}${maxRowIndex}; "${targetBrand2}"; ${priceLetter}2:${priceLetter}${maxRowIndex}; ">${priceThresh}")`;
          solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Марка» = «${targetBrand2}», затем добавьте фильтр по столбцу «Цена (руб.)» (дороже ${priceThresh} рублей). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
        }
      }

      const numSectors = difficulty === 3 ? rng.int(3, 5) : 3;
      chartTitle = 'распределение автомобилей по маркам';
      const chosenBrands = sampleArr(rng, brandSubSet, numSectors);
      chartData = chosenBrands.map((b) => ({
        district: quoteName(b),
        count: rows.filter((r) => r.brand === b).length,
      }));
    } else if (themeDef.id === 'weather') {
      const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      const SEASONS: Record<string, string[]> = {
        'зимние': ['Декабрь', 'Январь', 'Февраль'],
        'весенние': ['Март', 'Апрель', 'Май'],
        'летние': ['Июнь', 'Июль', 'Август'],
        'осенние': ['Сентябрь', 'Октябрь', 'Ноябрь'],
      };

      columns = [
        { key: 'day', label: 'День', letter: '' },
        { key: 'month', label: 'Месяц', letter: '' },
        { key: 'temp', label: 'Температура (°C)', letter: '' },
        { key: 'precip', label: 'Осадки (мм)', letter: '' },
      ];
      if (difficulty >= 2) {
        columns.push({ key: 'pressure', label: 'Давление (мм рт. ст.)', letter: '' });
      }
      columns.push({ key: 'windDir', label: 'Направление ветра', letter: '' });
      if (difficulty >= 2) {
        columns.push({ key: 'windSpeed', label: 'Скорость ветра (м/с)', letter: '' });
      }

      columns.forEach((col, idx) => {
        col.letter = LETTERS[idx];
      });

      // Q1 pre-selection
      const q1Kind = difficulty === 1
        ? rng.pick(['count', 'maxmin'])
        : difficulty === 2
        ? rng.pick(['count', 'average', 'maxmin', 'seasonavg'])
        : rng.pick(['count', 'average', 'maxmin', 'seasonavg', 'percentage']);

      let maxminCol: 'temp' | 'precip' | 'windSpeed' = 'temp';
      let isMax = false;

      if (q1Kind === 'maxmin') {
        const options: ('temp' | 'precip' | 'windSpeed')[] = ['temp'];
        if (difficulty >= 2) {
          options.push('precip', 'windSpeed');
        }
        maxminCol = rng.pick(options);
        isMax = boolRng(rng, 0.5);
      }

      // Generate exactly 365 rows for 1 year
      for (let m = 0; m < 12; m++) {
        const daysInM = DAYS_IN_MONTH[m];
        const monthName = WEATHER_MONTHS[m];
        for (let d = 1; d <= daysInM; d++) {
          let tempVal: number;
          if (m === 11 || m === 0 || m === 1) {
            tempVal = bellDecimal(rng, -28, -2);
          } else if (m >= 2 && m <= 4) {
            tempVal = bellDecimal(rng, -5, 18);
          } else if (m >= 5 && m <= 7) {
            tempVal = bellDecimal(rng, 12, 32);
          } else {
            tempVal = bellDecimal(rng, -3, 16);
          }

          const rowObj: Record<string, string | number> = {
            day: d,
            month: monthName,
            temp: tempVal,
            precip: bellDecimal(rng, 0, 25),
            windDir: rng.pick(WIND_DIRECTIONS),
          };
          if (difficulty >= 2) {
            rowObj.pressure = bellInt(rng, 730, 780);
            rowObj.windSpeed = bellDecimal(rng, 0, 20);
          }
          rows.push(rowObj);
        }
      }

      const weatherMaxRowIndex = 366;

      const monthLetter = getColLetter('month');
      const tempLetter = getColLetter('temp');
      const precipLetter = getColLetter('precip');
      const windDirLetter = getColLetter('windDir');
      const windSpeedLetter = difficulty >= 2 ? getColLetter('windSpeed') : '';

      const targetMonth = rng.pick(WEATHER_MONTHS);
      const targetWindDir = rng.pick(WIND_DIRECTIONS);

      if (q1Kind === 'maxmin') {
        if (maxminCol === 'temp') {
          q1Text = isMax
            ? 'Какова наибольшая температура за год?'
            : 'Какова наименьшая температура за год?';
          ans1 = isMax
            ? Math.max(...rows.map((r) => Number(r.temp)))
            : Math.min(...rows.map((r) => Number(r.temp)));
          formula1 = isMax
            ? `=МАКС(${tempLetter}2:${tempLetter}${weatherMaxRowIndex})`
            : `=МИН(${tempLetter}2:${tempLetter}${weatherMaxRowIndex})`;
          solution1 = isMax
            ? 'Фильтровать не нужно: выделите весь столбец «Температура (°C)» и примените функцию МАКС.'
            : 'Фильтровать не нужно: выделите весь столбец «Температура (°C)» и примените функцию МИН.';
        } else if (maxminCol === 'precip') {
          q1Text = isMax
            ? 'Каково наибольшее количество осадков за день за год?'
            : 'Каково наименьшее количество осадков за день за год?';
          ans1 = isMax
            ? Math.max(...rows.map((r) => Number(r.precip)))
            : Math.min(...rows.map((r) => Number(r.precip)));
          formula1 = isMax
            ? `=МАКС(${precipLetter}2:${precipLetter}${weatherMaxRowIndex})`
            : `=МИН(${precipLetter}2:${precipLetter}${weatherMaxRowIndex})`;
          solution1 = isMax
            ? 'Фильтровать не нужно: выделите весь столбец «Осадки (мм)» и примените функцию МАКС.'
            : 'Фильтровать не нужно: выделите весь столбец «Осадки (мм)» и примените функцию МИН.';
        } else {
          q1Text = isMax
            ? 'Какова наибольшая скорость ветра за год?'
            : 'Какова наименьшая скорость ветра за год?';
          ans1 = isMax
            ? Math.max(...rows.map((r) => Number(r.windSpeed)))
            : Math.min(...rows.map((r) => Number(r.windSpeed)));
          formula1 = isMax
            ? `=МАКС(${windSpeedLetter}2:${windSpeedLetter}${weatherMaxRowIndex})`
            : `=МИН(${windSpeedLetter}2:${windSpeedLetter}${weatherMaxRowIndex})`;
          solution1 = isMax
            ? 'Фильтровать не нужно: выделите весь столбец «Скорость ветра (м/с)» и примените функцию МАКС.'
            : 'Фильтровать не нужно: выделите весь столбец «Скорость ветра (м/с)» и примените функцию МИН.';
        }
      } else if (q1Kind === 'average') {
        q1Text = `Какова средняя температура в месяце ${quoteName(targetMonth)}?`;
        const filtered = rows.filter((r) => r.month === targetMonth);
        const sum = filtered.reduce((acc, r) => acc + Number(r.temp), 0);
        ans1 = filtered.length === 0 ? 0 : sum / filtered.length;
        formula1 = `=СРЗНАЧЕСЛИ(${monthLetter}2:${monthLetter}${weatherMaxRowIndex}; "${targetMonth}"; ${tempLetter}2:${tempLetter}${weatherMaxRowIndex})`;
        solution1 = `Отфильтруйте столбец «Месяц» = «${targetMonth}», скопируйте отфильтрованные значения столбца «Температура (°C)» на новый лист и примените функцию СРЗНАЧ.`;
        isFractional1 = true;
      } else if (q1Kind === 'seasonavg') {
        const seasonName = rng.pick(['весенние', 'летние', 'осенние']);
        const seasonMonths = SEASONS[seasonName];
        q1Text = `Какова средняя температура в ${seasonName} месяцы?`;
        const filtered = rows.filter((r) => seasonMonths.includes(r.month as string));
        const sum = filtered.reduce((acc, r) => acc + Number(r.temp), 0);
        ans1 = filtered.length === 0 ? 0 : sum / filtered.length;
        const [m1, m2, m3] = seasonMonths;
        let startRow = 61;
        let endRow = 152;
        if (seasonName === 'летние') {
          startRow = 153;
          endRow = 244;
        } else if (seasonName === 'осенние') {
          startRow = 245;
          endRow = 335;
        }
        formula1 = `=СРЗНАЧ(${tempLetter}${startRow}:${tempLetter}${endRow})`;
        solution1 = `Выделите на этом же листе подряд идущие строки выбранного сезона (${m1}–${m3}) в столбце «Температура (°C)» и примените функцию СРЗНАЧ — копировать не нужно, месяцы сезона идут подряд.`;
        isFractional1 = true;
      } else if (q1Kind === 'percentage') {
        q1Text = `Какой процент от общего числа дней приходится на месяц ${quoteName(targetMonth)}?`;
        const countTarget = rows.filter((r) => r.month === targetMonth).length;
        ans1 = (countTarget / 365) * 100;
        formula1 = `=СЧЁТЕСЛИ(${monthLetter}2:${monthLetter}${weatherMaxRowIndex}; "${targetMonth}")/365*100`;
        solution1 = `Посчитайте количество строк по условию (как в Способе 1 — фильтром), разделите на общее число строк (365) и умножьте на 100.`;
        isFractional1 = true;
      } else {
        const choice = boolRng(rng, 0.5);
        if (choice) {
          q1Text = `Сколько дней наблюдалось направление ветра ${quoteName(targetWindDir)}?`;
          ans1 = rows.filter((r) => r.windDir === targetWindDir).length;
          formula1 = `=СЧЁТЕСЛИ(${windDirLetter}2:${windDirLetter}${weatherMaxRowIndex}; "${targetWindDir}")`;
          solution1 = `Скопируйте таблицу на новый лист, включите фильтр (Данные → Фильтр) по столбцу «Направление ветра» и оставьте только «${targetWindDir}». Затем скопируйте отфильтрованные строки и примените функцию СЧЁТЗ, чтобы посчитать их количество.`;
        } else {
          q1Text = `Сколько дней в месяце ${quoteName(targetMonth)} дул ветер направления ${quoteName(targetWindDir)}?`;
          ans1 = rows.filter((r) => r.month === targetMonth && r.windDir === targetWindDir).length;
          formula1 = `=СЧЁТЕСЛИМН(${monthLetter}2:${monthLetter}${weatherMaxRowIndex}; "${targetMonth}"; ${windDirLetter}2:${windDirLetter}${weatherMaxRowIndex}; "${targetWindDir}")`;
          solution1 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Месяц» = «${targetMonth}», затем добавьте фильтр по столбцу «Направление ветра» = «${targetWindDir}». Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
        }
      }

      // Q2 pre-selection (independent entity selection from Q1)
      const targetMonth2 = rng.pick(WEATHER_MONTHS);
      const targetWindDir2 = rng.pick(WIND_DIRECTIONS);

      if (difficulty === 3 && boolRng(rng, 0.35)) {
        const monthA = rng.pick(WEATHER_MONTHS);
        const monthB = pickNextCyclic(WEATHER_MONTHS, monthA);
        const filteredA = rows.filter((r) => r.month === monthA);
        const filteredB = rows.filter((r) => r.month === monthB);
        const avgA = filteredA.length ? filteredA.reduce((acc, r) => acc + Number(r.temp), 0) / filteredA.length : 0;
        const avgB = filteredB.length ? filteredB.reduce((acc, r) => acc + Number(r.temp), 0) / filteredB.length : 0;
        q2Text = `На сколько различается средняя температура между месяцем ${quoteName(monthA)} и месяцем ${quoteName(monthB)}?`;
        ans2 = Math.abs(avgA - avgB);
        formula2 = `=ABS(СРЗНАЧЕСЛИ(${monthLetter}2:${monthLetter}${weatherMaxRowIndex}; "${monthA}"; ${tempLetter}2:${tempLetter}${weatherMaxRowIndex}) - СРЗНАЧЕСЛИ(${monthLetter}2:${monthLetter}${weatherMaxRowIndex}; "${monthB}"; ${tempLetter}2:${tempLetter}${weatherMaxRowIndex}))`;
        solution2 = `Посчитайте среднее по столбцу «Температура (°C)» отдельно для «${monthA}» и для «${monthB}» (каждое — фильтром, как в Способе 1). Затем найдите разницу двух средних и возьмите её по модулю (без знака минус).`;
        isFractional2 = true;
      } else if (difficulty >= 2 && boolRng(rng, 0.35)) {
        const windThresh = rng.int(3, 12);
        q2Text = `Сколько дней дул ветер направления ${quoteName(targetWindDir2)} со скоростью более ${windThresh} м/с?`;
        ans2 = rows.filter(
          (r) => r.windDir === targetWindDir2 && Number(r.windSpeed) > windThresh
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${windDirLetter}2:${windDirLetter}${weatherMaxRowIndex}; "${targetWindDir2}"; ${windSpeedLetter}2:${windSpeedLetter}${weatherMaxRowIndex}; ">${windThresh}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Направление ветра» = «${targetWindDir2}», затем добавьте фильтр по столбцу «Скорость ветра (м/с)» (более ${windThresh} м/с). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      } else if (difficulty >= 2 && boolRng(rng, 0.35)) {
        const low = rng.int(-15, 15);
        const high = low + rng.int(5, 15);
        q2Text = `Сколько дней температура была от ${low} до ${high} градусов?`;
        ans2 = rows.filter((r) => Number(r.temp) >= low && Number(r.temp) <= high).length;
        formula2 = `=СЧЁТЕСЛИМН(${tempLetter}2:${tempLetter}${weatherMaxRowIndex}; ">=${low}"; ${tempLetter}2:${tempLetter}${weatherMaxRowIndex}; "<=${high}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте столбец «Температура (°C)», оставив значения от ${low} до ${high}. Посчитайте оставшиеся строки функцией СЧЁТЗ.`;
      } else {
        const monthRows = rows.filter((r) => r.month === targetMonth2);
        const temps = monthRows.map((r) => Number(r.temp));
        const minT = Math.min(...temps);
        const maxT = Math.max(...temps);
        let nThresh = Math.round(minT + (maxT - minT) * 0.4);
        if (isNaN(nThresh)) nThresh = 0;
        q2Text = `Сколько дней в месяце ${quoteName(targetMonth2)} температура была выше ${nThresh} градусов?`;
        ans2 = rows.filter(
          (r) => r.month === targetMonth2 && Number(r.temp) > nThresh
        ).length;
        formula2 = `=СЧЁТЕСЛИМН(${monthLetter}2:${monthLetter}${weatherMaxRowIndex}; "${targetMonth2}"; ${tempLetter}2:${tempLetter}${weatherMaxRowIndex}; ">${nThresh}")`;
        solution2 = `Скопируйте таблицу на новый лист, отфильтруйте по столбцу «Месяц» = «${targetMonth2}», затем добавьте фильтр по столбцу «Температура (°C)» (выше ${nThresh} градусов). Скопируйте оставшиеся строки и посчитайте их количество функцией СЧЁТЗ.`;
      }

      const numSectors = difficulty === 3 ? rng.int(3, 5) : 3;
      chartTitle = 'распределение дней по направлениям ветра';
      const chosenDirs = pickManyStable(WIND_DIRECTIONS, seed, `task14:wind_directions:L${difficulty}`, (s) => s, numSectors);
      chartData = chosenDirs.map((d) => ({
        district: quoteName(d),
        count: rows.filter((r) => r.windDir === d).length,
      }));
    }

    // Cell addresses calculation based on dynamic column count
    const answerColIndex = columns.length + 3;
    const answerCol = LETTERS[answerColIndex] || 'H';
    const chartColIndex = columns.length + 2;
    const chartCell = `${LETTERS[chartColIndex] || 'G'}6`;

    // Append answer tails to questions
    const res1 = appendAnswerTail(q1Text, ans1, isFractional1, answerCol, 2, difficulty, rng);
    q1Text = res1.text;
    ans1 = res1.ans;

    const res2 = appendAnswerTail(q2Text, ans2, isFractional2, answerCol, 3, difficulty, rng);
    q2Text = res2.text;
    ans2 = res2.ans;

    // Filter out zero count sectors from chartData
    chartData = chartData.filter((item) => item.count > 0);

    const categoriesList = chartData.map((item) => quoteName(item.district)).join(', ');
    if (subjectChartThreshold !== null) {
      q3Text = `Постройте круговую диаграмму, отображающую соотношение количества учеников, набравших более ${subjectChartThreshold} баллов по предметам: ${categoriesList}. Левый верхний угол диаграммы разместите вблизи ячейки ${chartCell}.`;
    } else {
      q3Text = `Постройте круговую диаграмму, отображающую соотношение числа ${categoriesList}. Левый верхний угол диаграммы разместите вблизи ячейки ${chartCell}.`;
    }

    const colDescList = columns.map((col) => `• Столбец ${col.letter}: ${col.label}`).join('\n');

    const statement = `В электронной таблице приведены данные: ${themeDef.title.toLowerCase()}.
Ниже приведены первые 5 строк таблицы:

${colDescList}

Выполните следующие задания:
1. ${q1Text}
2. ${q2Text}
3. ${q3Text}`;

    const shortHint = `Отфильтруйте или отсортируйте таблицу по нужной категории, затем выполните требуемое действие над отобранными значениями (подсчёт количества, сумма, среднее, наибольшее или наименьшее). Для диаграммы сначала подсчитайте значения по каждой категории, а затем постройте по ним круговую диаграмму.`;

    const benchmarkLines = chartData
      .map((item) => `   • ${item.district}: ${item.count}`)
      .join('\n');

    const hint = `Подробный разбор задания 14 (${themeDef.title}):

1. ${q1Text}
   Правильный ответ: ${ans1}

   Способ 1 (формулой):
   Формула: ${formula1}

   Способ 2 (вручную):
   ${solution1}

2. ${q2Text}
   Правильный ответ: ${ans2}

   Способ 1 (формулой):
   Формула: ${formula2}

   Способ 2 (вручную):
   ${solution2}

3. Круговая диаграмма (${chartTitle}):
   Правильные значения:
${benchmarkLines}

   На диаграмме обязательно должны присутствовать:
   - Легенда с названиями категорий
   - Подписи данных (числовые значения)
   Сравните со своей диаграммой. Если категории, значения и подписи совпадают — засчитайте себе +1 балл (в режиме варианта отметьте галочку в разборе).`;

    return {
      rows,
      columns,
      questions: [q1Text, q2Text],
      answers: [ans1, ans2],
      chartData,
      chartTitle,
      statement,
      shortHint,
      hint,
      formula1,
      formula2,
      themeName: themeDef.title,
    };
  },

  render: (taskData: Task14Data, state: TaskModuleState) => (
    <Task14View taskData={taskData} state={state} />
  ),

  check: (taskData: Task14Data, userAnswer: string): boolean => {
    if (!userAnswer) return false;
    const [u1, u2] = parseUserAnswer(userAnswer);
    const num1 = cleanNumber(u1);
    const num2 = cleanNumber(u2);

    return (
      num1 !== null &&
      Math.abs(num1 - taskData.answers[0]) < 0.01 &&
      num2 !== null &&
      Math.abs(num2 - taskData.answers[1]) < 0.01
    );
  },

  checkScore: (
    taskData: Task14Data,
    userAnswer: string
  ): { score: number; maxScore: number } => {
    if (!userAnswer) return { score: 0, maxScore: 3 };
    const [u1, u2, flag] = parseUserAnswer(userAnswer);

    const num1 = cleanNumber(u1);
    const num2 = cleanNumber(u2);

    const is1Correct = num1 !== null && Math.abs(num1 - taskData.answers[0]) < 0.01;
    const is2Correct = num2 !== null && Math.abs(num2 - taskData.answers[1]) < 0.01;
    const isChartDone = flag === '1';

    let score = 0;
    if (is1Correct) score += 1;
    if (is2Correct) score += 1;
    if (isChartDone) score += 1;

    return { score, maxScore: 3 };
  },
};

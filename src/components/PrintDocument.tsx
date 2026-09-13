import React from 'react';
import { Difficulty } from '../types';
import { getTaskById } from '../tasks';
import { attachmentName } from '../utils/attachments';
import { getAnswerKey } from '../utils/answerKey';

export interface PrintTaskItem {
  taskId: number;
  subId?: string;
  difficulty: Difficulty;
  taskData: any;
  seed?: number | string;
}

export interface PrintDocumentOptions {
  answers: 'none' | 'inline' | 'keys';
  solutions: boolean;
  title: string;
  code: string;
}

export interface PrintDocumentProps {
  tasks: PrintTaskItem[];
  options: PrintDocumentOptions;
}

export function getDisplayAnswer(taskData: any, taskId?: number): string {
  return getAnswerKey(taskId ?? taskData?.taskId ?? 0, taskData).display;
}

export function PrintDocument({ tasks, options }: PrintDocumentProps) {
  const currentDate = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const taskCounts = React.useMemo(() => {
    const counts = new Map<number, number>();
    for (const t of tasks) {
      counts.set(t.taskId, (counts.get(t.taskId) || 0) + 1);
    }
    return counts;
  }, [tasks]);

  return (
    <div className="print-document bg-white text-black font-sans text-[11pt] leading-normal p-4 max-w-4xl mx-auto">
      {/* HEADER SECTION */}
      <header className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-wide text-black">
              {options.title || 'Тренировочный вариант ОГЭ по информатике'}
            </h1>
            <p className="text-sm font-mono mt-1 text-black">
              Код варианта: <strong className="font-bold">{options.code}</strong> &bull; Дата: {currentDate}
            </p>
          </div>
          <div className="text-right text-xs text-gray-700 font-mono">
            Всего заданий: {tasks.length}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-dashed border-gray-400 flex flex-wrap justify-between items-center text-sm font-serif gap-4">
          <div className="flex-1 min-w-[280px]">
            Фамилия, имя: <span className="inline-block border-b border-black w-3/4 ml-1">&nbsp;</span>
          </div>
          <div className="w-36">
            Класс: <span className="inline-block border-b border-black w-16 ml-1">&nbsp;</span>
          </div>
          <div className="w-32 text-right">
            Оценка: <span className="inline-block border border-black w-12 h-6 align-middle text-center">&nbsp;</span>
          </div>
        </div>
      </header>

      {/* TASKS LIST */}
      <main className="space-y-6">
        {tasks.map((task, idx) => {
          const taskMod = getTaskById(task.taskId);
          if (!taskMod) return null;

          const taskNumber = idx + 1;
          const displayAns = getDisplayAnswer(task.taskData, task.taskId);

          return (
            <article
              key={`${task.taskId}-${task.seed}-${idx}`}
              className="task-print-block break-inside-avoid pb-4 mb-5 border-b border-gray-300"
            >
              {/* Task Header */}
              <div className="flex items-baseline justify-between gap-4 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold font-mono text-base border-2 border-black px-2 py-0.5 rounded-sm">
                    {taskNumber}
                  </span>
                  <h2 className="font-bold text-sm text-black">
                    {taskMod.title} (Задание {task.taskId})
                  </h2>
                </div>

                {options.answers === 'inline' && (
                  <div className="text-sm font-mono font-bold bg-gray-100 px-2 py-0.5 border border-black rounded-xs">
                    Ответ: {displayAns}
                  </div>
                )}
              </div>

              {/* Task Statement and interactive content rendered as static print content */}
              <div className="task-print-content text-sm leading-relaxed my-2 text-black">
                {taskMod.render(task.taskData, {
                  userAnswer: '',
                  setUserAnswer: () => {},
                  isSubmitted: options.solutions,
                  showHints: options.solutions,
                  isCorrect: true,
                })}
              </div>

              {/* Attachment file note for tasks 11, 12, 14 */}
              {task.taskId === 11 && (
                <p className="mt-2 text-xs font-mono font-semibold text-gray-800">
                  📁 Файл к заданию: files/{attachmentName(11, taskNumber, 'zip')}
                </p>
              )}
              {task.taskId === 12 && (
                <p className="mt-2 text-xs font-mono font-semibold text-gray-800">
                  📁 Файл к заданию: files/{attachmentName(12, taskNumber, 'zip')}
                </p>
              )}
              {task.taskId === 14 && (
                <p className="mt-2 text-xs font-mono font-semibold text-gray-800">
                  📁 Файл к заданию: files/{attachmentName(14, taskNumber, 'xlsx')}
                </p>
              )}

              {/* Computer-based notice for tasks 15 and 16 */}
              {(task.taskId === 15 || task.taskId === 16) && (
                <p className="mt-2 text-xs italic text-gray-700">
                  💻 Задание выполняется на компьютере с использованием специализированного программного обеспечения.
                </p>
              )}
            </article>
          );
        })}
      </main>

      {/* ANSWERS KEYS SECTION (if options.answers === 'keys') */}
      {options.answers === 'keys' && (
        <section className="print-keys-section break-before-page pt-6 mt-8">
          <header className="border-b-2 border-black pb-2 mb-4">
            <h2 className="text-lg font-bold uppercase tracking-wider text-black">
              Ответы: {options.title} ({options.code})
            </h2>
            <p className="text-xs text-gray-600">Дата генерации ключей: {currentDate}</p>
          </header>

          <table className="w-full border-collapse border border-black text-sm my-4">
            <thead>
              <tr className="bg-gray-100 border-b border-black">
                <th className="border border-black p-2 text-left w-52 font-bold">Задание</th>
                <th className="border border-black p-2 text-left font-bold">Правильный ответ</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => {
                const N = idx + 1;
                const M = task.taskId;
                const isSingleMatch = taskCounts.get(M) === 1 && N === M;
                const label = isSingleMatch ? `Задание ${M}` : `поз. ${N} — задание ${M}`;

                return (
                  <tr key={`ans-key-${task.taskId}-${idx}`} className="border-b border-gray-300">
                    <td className="border border-black p-2 text-left font-mono font-bold whitespace-nowrap">
                      {label}
                    </td>
                    <td className="border border-black p-2 font-mono text-sm">
                      {getDisplayAnswer(task.taskData, task.taskId)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

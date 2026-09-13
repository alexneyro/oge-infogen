import { normalizeAnswer } from './normalize';

export interface AnswerKeyResult {
  display: string;
  signature: string;
}

/**
 * Universal answer extractor and signature builder for all 16 OGE tasks.
 * - display: Human-readable answer for PDF printing / key tables.
 * - signature: Normalized, compact string representation for deduplication comparisons.
 *
 * Never throws exceptions (returns fallback if invalid data).
 */
export function getAnswerKey(taskId: number, taskData: any): AnswerKeyResult {
  try {
    if (!taskData) {
      return getFallbackForTask(taskId);
    }

    switch (taskId) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 12: {
        const rawAns = taskData.correctAnswer;
        if (rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== '') {
          const str = String(rawAns).trim();
          return {
            display: str,
            signature: normalizeAnswer(str),
          };
        }
        return { display: '—', signature: '' };
      }

      case 11: {
        if (Array.isArray(taskData.acceptedAnswers) && taskData.acceptedAnswers.length > 0) {
          const display = taskData.acceptedAnswers.join(' / ');
          const signature = normalizeAnswer(taskData.acceptedAnswers[0]);
          return { display, signature };
        }
        if (taskData.correctAnswer !== undefined && taskData.correctAnswer !== null) {
          const str = String(taskData.correctAnswer).trim();
          return {
            display: str,
            signature: normalizeAnswer(str),
          };
        }
        return { display: '—', signature: '' };
      }

      case 14: {
        if (Array.isArray(taskData.answers) && taskData.answers.length > 0) {
          const display = taskData.answers.join(' | ');
          const signature = taskData.answers
            .map((a: any) => normalizeAnswer(String(a)))
            .join('|');
          return { display, signature };
        }
        return { display: '—', signature: '' };
      }

      case 13: {
        const display = 'Форматирование по образцу (см. разбор)';
        let textPart = '';
        try {
          const doc = taskData.doc;
          if (doc && Array.isArray(doc.paragraphs) && doc.paragraphs.length > 0) {
            const rawText = doc.paragraphs
              .map((p: any) =>
                Array.isArray(p?.spans)
                  ? p.spans.map((s: any) => s?.text ?? '').join('')
                  : ''
              )
              .join('\n');
            textPart = normalizeAnswer(rawText);
          }
        } catch {
          textPart = '';
        }

        if (!textPart && taskData.sourceTextId) {
          textPart = normalizeAnswer(String(taskData.sourceTextId));
        }

        const tablePart = JSON.stringify(taskData.doc?.table || {});
        const signature = `${textPart}::${tablePart}`;
        return { display, signature };
      }

      case 15: {
        const display = 'Программа для Робота (см. разбор)';
        const familyId = String(taskData.familyId || '');
        const visible = taskData.visible || {};

        let wallsStr = '';
        try {
          if (visible.walls) {
            const arr = Array.isArray(visible.walls)
              ? visible.walls
              : visible.walls instanceof Set || typeof (visible.walls as any)[Symbol.iterator] === 'function'
              ? Array.from(visible.walls as Iterable<any>)
              : Object.keys(visible.walls);
            wallsStr = arr.map(String).sort().join(',');
          }
        } catch {
          wallsStr = '';
        }

        let targetStr = '';
        try {
          if (visible.target) {
            const arr = Array.isArray(visible.target)
              ? visible.target
              : visible.target instanceof Set || typeof (visible.target as any)[Symbol.iterator] === 'function'
              ? Array.from(visible.target as Iterable<any>)
              : Object.keys(visible.target);
            targetStr = arr.map(String).sort().join(',');
          }
        } catch {
          targetStr = '';
        }

        const label = String(visible.label || '');
        const signature = `${familyId}::walls:[${wallsStr}]::target:[${targetStr}]::label:${label}`;
        return { display, signature };
      }

      case 16: {
        let display = 'Программа (см. разбор)';
        if (Array.isArray(taskData.tests) && taskData.tests.length > 0) {
          const outputs = taskData.tests
            .slice(0, 3)
            .map((t: any) => String(t.expected ?? ''))
            .join(', ');
          if (outputs) {
            display = `Программа (см. разбор; ожидаемые выводы: ${outputs})`;
          }
        }

        let signature = '';
        if (Array.isArray(taskData.tests) && taskData.tests.length > 0) {
          signature = taskData.tests
            .map((t: any) => normalizeAnswer(String(t.expected ?? '')))
            .join(';');
        } else if (taskData.solutionCode?.python) {
          signature = normalizeAnswer(taskData.solutionCode.python);
        }

        return { display, signature };
      }

      default: {
        // Generic fallback for any unexpected task ID
        if (taskData.correctAnswer !== undefined && taskData.correctAnswer !== null) {
          const str = String(taskData.correctAnswer).trim();
          return {
            display: str,
            signature: normalizeAnswer(str),
          };
        }
        if (Array.isArray(taskData.acceptedAnswers) && taskData.acceptedAnswers.length > 0) {
          return {
            display: taskData.acceptedAnswers.join(' / '),
            signature: normalizeAnswer(taskData.acceptedAnswers[0]),
          };
        }
        if (Array.isArray(taskData.answers) && taskData.answers.length > 0) {
          return {
            display: taskData.answers.join(' | '),
            signature: taskData.answers.map((a: any) => normalizeAnswer(String(a))).join('|'),
          };
        }
        return { display: '—', signature: '' };
      }
    }
  } catch (_e) {
    return getFallbackForTask(taskId);
  }
}

function getFallbackForTask(taskId: number): AnswerKeyResult {
  switch (taskId) {
    case 13:
      return { display: 'Форматирование по образцу (см. разбор)', signature: '' };
    case 15:
      return { display: 'Программа для Робота (см. разбор)', signature: '' };
    case 16:
      return { display: 'Программа (см. разбор)', signature: '' };
    default:
      return { display: '—', signature: '' };
  }
}

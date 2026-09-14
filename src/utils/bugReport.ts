import { AppMode, Difficulty, MODE_LABELS, DIFFICULTY_LABELS } from '../types';
import { VariantInfo } from '../components/VariantView';
import { SetInfo } from '../components/SetBuilderView';

export interface BugReportParams {
  activeMode: AppMode;
  selectedTaskId: number | null;
  currentSeed: string | null;
  difficulty: Difficulty;
  variantInfo: VariantInfo | null;
  setInfo: SetInfo | null;
  reportTaskId: string;
  reportText: string;
  userAgent?: string;
}

export function buildBugReportText({
  activeMode,
  selectedTaskId,
  currentSeed,
  difficulty,
  variantInfo,
  setInfo,
  reportTaskId,
  reportText,
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'не определен',
}: BugReportParams): string {
  const lines: string[] = [];

  switch (activeMode) {
    case 'single': {
      lines.push(`Режим: ${MODE_LABELS.single}`);
      const taskStr = selectedTaskId !== null ? String(selectedTaskId) : 'интерфейс (задание не открыто)';
      lines.push(`Задание: ${taskStr}`);
      if (currentSeed) {
        lines.push(`Сид: ${currentSeed}`);
      }
      lines.push(`Уровень сложности: ${difficulty} (${DIFFICULTY_LABELS[difficulty]})`);
      lines.push(`User-Agent: ${userAgent}`);
      lines.push('');
      lines.push(reportText.trim());
      break;
    }

    case 'variant': {
      lines.push(`Режим: ${MODE_LABELS.variant}`);
      let taskStr: string;
      let diffStr: string;

      if (reportTaskId === 'all') {
        taskStr = 'не относится к конкретному заданию';
        diffStr = variantInfo?.difficultyInfo || 'настраиваемая (16 заданий)';
      } else {
        const found = variantInfo?.tasks.find((t) => String(t.id) === reportTaskId);
        taskStr = found ? found.label : `Задание ${reportTaskId}`;
        diffStr = found
          ? DIFFICULTY_LABELS[found.difficulty]
          : (variantInfo?.difficultyInfo || 'настраиваемая (16 заданий)');
      }

      lines.push(`Задание: ${taskStr}`);
      if (variantInfo?.seed) {
        lines.push(`Сид: ${variantInfo.seed}`);
      }
      if (variantInfo?.code) {
        lines.push(`Код варианта: ${variantInfo.code}`);
      }
      lines.push(`Уровень сложности: ${diffStr}`);
      lines.push(`User-Agent: ${userAgent}`);
      lines.push('');
      lines.push(reportText.trim());
      break;
    }

    case 'set': {
      lines.push(`Режим: ${MODE_LABELS.set}`);

      const foundTask =
        reportTaskId !== 'all'
          ? setInfo?.tasks.find((t) => String(t.position) === reportTaskId) ?? null
          : null;

      if (foundTask) {
        lines.push(`Задание: Задание ${foundTask.taskId}`);
        lines.push(
          `Позиция в наборе: ${foundTask.position}${setInfo?.totalTasks ? ` из ${setInfo.totalTasks}` : ''}`
        );
        if (setInfo?.code) {
          lines.push(`Код набора: ${setInfo.code}`);
        }
        if (setInfo?.seed) {
          lines.push(`Сид набора: ${setInfo.seed}`);
        }
        lines.push(
          `Уровень сложности: ${foundTask.difficulty} (${DIFFICULTY_LABELS[foundTask.difficulty]})`
        );
        lines.push(`SubSeed: ${foundTask.subSeed}`);
      } else {
        lines.push('Задание: не относится к конкретному заданию');
        if (setInfo?.code) {
          lines.push(`Код набора: ${setInfo.code}`);
        }
        if (setInfo?.seed) {
          lines.push(`Сид набора: ${setInfo.seed}`);
        }
        if (setInfo?.totalTasks && setInfo.totalTasks > 0) {
          lines.push(`Всего заданий: ${setInfo.totalTasks}`);
        }
      }

      lines.push(`User-Agent: ${userAgent}`);
      lines.push('');
      lines.push(reportText.trim());
      break;
    }
  }

  return lines.join('\n');
}

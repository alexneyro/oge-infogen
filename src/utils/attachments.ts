import { buildTask11ZipBlob } from '../tasks/task11';
import { buildTask12ZipBlob } from '../tasks/task12';
import { buildTask14XlsxBlob } from '../tasks/task14';

export type AttachmentKind = 'zip' | 'xlsx';

export function attachmentName(taskId: number, index: number, kind: AttachmentKind): string {
  let label = 'attachment';
  if (taskId === 11) {
    label = 'archive';
  } else if (taskId === 12) {
    label = 'files';
  } else if (taskId === 14) {
    label = 'table';
  }
  return `${taskId}-${index}_${label}.${kind}`;
}

export async function buildAttachment(taskId: number, taskData: any): Promise<Blob | null> {
  if (!taskData) return null;
  if (taskId === 11) {
    const result = await buildTask11ZipBlob(
      taskData.rootDir,
      taskData.level,
      taskData.subdir,
      taskData.selectedWorks
    );
    return result.blob;
  }
  if (taskId === 12) {
    return await buildTask12ZipBlob(taskData.rootDir, taskData.files);
  }
  if (taskId === 14) {
    return await buildTask14XlsxBlob(taskData);
  }
  return null;
}

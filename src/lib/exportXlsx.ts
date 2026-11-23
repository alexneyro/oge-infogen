import { saveBlob } from '../utils/download';

export interface ExportSheet {
  name: string;
  headers: string[];
  rows: (string | number | null)[][];
}

function sanitizeSheetName(rawName: string, usedNames: Set<string>): string {
  const cleaned = rawName.replace(/[\[\]:*?/\\]/g, '').trim() || 'Лист';
  const base = cleaned.slice(0, 31);

  if (!usedNames.has(base)) {
    usedNames.add(base);
    return base;
  }

  let counter = 2;
  while (true) {
    const suffix = `_${counter}`;
    const candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
    counter += 1;
  }
}

async function applyFreezeTopRow(wbout: ArrayBuffer): Promise<ArrayBuffer> {
  try {
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(wbout);
    const sheetPaths = Object.keys(zip.files).filter((path) =>
      /^xl\/worksheets\/sheet\d+\.xml$/i.test(path)
    );

    await Promise.all(
      sheetPaths.map(async (path) => {
        const xml = await zip.file(path)?.async('string');
        if (!xml || xml.includes('<pane ')) return;

        const updated = xml.replace(
          /<sheetView([^/>]*)\/>/g,
          '<sheetView$1><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView>'
        );
        if (updated !== xml) {
          zip.file(path, updated);
        }
      })
    );

    return await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
  } catch {
    return wbout;
  }
}

export async function exportWorkbook(fileName: string, sheets: ExportSheet[]): Promise<void> {
  if (sheets.length === 0) return;

  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const sheet of sheets) {
    const sheetName = sanitizeSheetName(sheet.name, usedNames);
    const aoa: (string | number | null)[][] = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    if (sheet.headers.length > 0) {
      ws['!cols'] = sheet.headers.map((header, colIdx) => {
        let maxLen = header.length;
        for (const row of sheet.rows) {
          const val = row[colIdx];
          if (val !== null && val !== undefined) {
            const len = String(val).length;
            if (len > maxLen) maxLen = len;
          }
        }
        return { wch: Math.min(45, Math.max(10, maxLen + 3)) };
      });

      ws['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: sheet.rows.length, c: sheet.headers.length - 1 },
        }),
      };
    }

    const wsAny = ws as Record<string, unknown>;
    wsAny['!views'] = [{ state: 'frozen', ySplit: 1 }];
    wsAny['!freeze'] = {
      xSplit: 0,
      ySplit: 1,
      topLeftCell: 'A2',
      activePane: 'bottomLeft',
      state: 'frozen',
    };

    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  }

  const rawBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
    compression: true,
  }) as ArrayBuffer;

  const finalBuffer = await applyFreezeTopRow(rawBuffer);
  const blob = new Blob([finalBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveBlob(blob, fileName);
}

export { fetchAllPages } from './fetchAllPages';

const mskDateTimeFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatDateMsk(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const parts = mskDateTimeFormatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  const day = get('day');
  const month = get('month');
  const year = get('year');
  const hour = get('hour');
  const minute = get('minute');

  if (!day || !month || !year || !hour || !minute) return '—';
  return `${day}.${month}.${year} ${hour}:${minute}`;
}

export function mskDateTimeCell(iso: string): StyledCell {
  if (!iso) return '—';
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return '—';
  // exceljs пишет getTime() как есть, Excel показывает без пояса, Москва без перехода на летнее время (UTC+3)
  return {
    v: new Date(ms + 3 * 3600 * 1000),
    numFmt: 'dd.mm.yyyy hh:mm',
  };
}

export type StyledFillColor = 'green' | 'yellow' | 'red' | 'gray';

export type StyledCell =
  | string
  | number
  | Date
  | null
  | {
      v: string | number | Date | null;
      fill?: StyledFillColor;
      bold?: boolean;
      numFmt?: string;
    };

export interface StyledSheet {
  name: string;
  headers: string[];
  rows: StyledCell[][];
  freezeCols?: number;
  colWidths?: number[];
  wrapData?: boolean;
}

const STYLED_FILL_ARGB: Record<StyledFillColor, string> = {
  green: 'FFC6EFCE',
  yellow: 'FFFFEB9C',
  red: 'FFFFC7CE',
  gray: 'FFE7E6E6',
};

function unwrapStyledCell(cell: StyledCell): {
  value: string | number | Date | null;
  fill?: StyledFillColor;
  bold?: boolean;
  numFmt?: string;
} {
  if (cell instanceof Date) {
    return { value: cell };
  }
  if (cell !== null && typeof cell === 'object') {
    return {
      value: cell.v ?? null,
      fill: cell.fill,
      bold: cell.bold,
      numFmt: cell.numFmt,
    };
  }
  return { value: cell ?? null };
}

export async function buildStyledWorkbookBuffer(sheets: StyledSheet[]): Promise<ArrayBuffer> {
  const excelMod = await import('exceljs');
  const ExcelJS =
    (excelMod as unknown as { default?: typeof excelMod }).default ?? excelMod;
  const workbook = new ExcelJS.Workbook();
  const usedNames = new Set<string>();

  for (const sheet of sheets) {
    const sheetName = sanitizeSheetName(sheet.name, usedNames);
    const freezeCols = Math.max(0, Math.floor(sheet.freezeCols ?? 0));

    const ws = workbook.addWorksheet(sheetName, {
      views: [
        {
          state: 'frozen',
          ySplit: 1,
          xSplit: freezeCols,
        },
      ],
    });

    if (sheet.headers.length > 0) {
      const headerRow = ws.addRow(sheet.headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FF000000' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: STYLED_FILL_ARGB.gray },
        };
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
    }

    for (const rowCells of sheet.rows) {
      const rawValues = rowCells.map((cell) => unwrapStyledCell(cell).value);
      const row = ws.addRow(rawValues);

      rowCells.forEach((cellDef, idx) => {
        const parsed = unwrapStyledCell(cellDef);
        if (!parsed.fill && !parsed.bold && !parsed.numFmt && !sheet.wrapData) return;

        const cell = row.getCell(idx + 1);
        if (parsed.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: STYLED_FILL_ARGB[parsed.fill] },
          };
        }
        if (parsed.fill || parsed.bold) {
          cell.font = {
            color: { argb: 'FF000000' },
            ...(parsed.bold ? { bold: true } : {}),
          };
        }
        if (parsed.numFmt) {
          cell.numFmt = parsed.numFmt;
        }
        if (sheet.wrapData) {
          cell.alignment = { wrapText: true, vertical: 'top' };
        }
      });
    }

    if (sheet.headers.length > 0) {
      ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: sheet.rows.length + 1, column: sheet.headers.length },
      };

      sheet.headers.forEach((header, colIdx) => {
        const explicitWidth = sheet.colWidths?.[colIdx];
        if (typeof explicitWidth === 'number' && explicitWidth > 0) {
          ws.getColumn(colIdx + 1).width = explicitWidth;
          return;
        }

        let maxLen = header.length;
        for (const row of sheet.rows) {
          const val = unwrapStyledCell(row[colIdx] ?? null).value;
          if (val !== null && val !== undefined) {
            const len = val instanceof Date ? 16 : String(val).length;
            if (len > maxLen) maxLen = len;
          }
        }
        ws.getColumn(colIdx + 1).width = Math.min(45, Math.max(10, maxLen + 3));
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

export async function exportStyledWorkbook(
  fileName: string,
  sheets: StyledSheet[]
): Promise<void> {
  if (sheets.length === 0) return;

  const buffer = await buildStyledWorkbookBuffer(sheets);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveBlob(blob, fileName);
}

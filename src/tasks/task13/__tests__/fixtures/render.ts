import { Doc } from '../../parse';
import { DEFAULT_SPEC } from '../../spec';

// Helper for rendering compliant HTML
export function renderCompliantHtml(task: { doc: Doc }, options?: { spaceIndent?: boolean }): string {
  const doc = task.doc;
  const spec = doc.spec || DEFAULT_SPEC;
  const req = spec.requirements;
  const htmlParts: string[] = [];

  doc.paragraphs.forEach((p, pIdx) => {
    const isHeading = doc.headingIndex !== null && doc.headingIndex !== undefined && pIdx === doc.headingIndex;
    const textSpans = p.spans.map(s => {
      let t = s.text;
      if (s.sup) t = `<sup>${t}</sup>`;
      if (s.sub) t = `<sub>${t}</sub>`;
      if (s.b) t = `<b>${t}</b>`;
      if (s.i) t = `<i>${t}</i>`;
      if (s.u) t = `<u>${t}</u>`;
      return t;
    }).join('');

    if (isHeading) {
      const headingAlign = req.heading.align || 'center';
      const headingIndent = options?.spaceIndent ? 0 : (req.heading.indentCm || 0);
      const headingSpacing = req.heading.spacingPt || 12;
      const prefix = (options?.spaceIndent && (req.heading.indentCm || 0) > 0) ? '&nbsp;&nbsp;&nbsp;&nbsp;' : '';
      const indentStyle = options?.spaceIndent ? '' : `text-indent: ${headingIndent}cm; `;
      htmlParts.push(`<p style="font-size: ${req.fontSize.pt}pt; ${indentStyle}text-align: ${headingAlign}; margin-bottom: ${headingSpacing}pt; line-height: 1.2; font-family: 'Times New Roman'; font-weight: bold;">${prefix}${textSpans}</p>`);
    } else {
      const align = req.bodyAlign.align || 'justify';
      const indent = req.indent.cm || 1;
      const spacing = req.paraSpacing.enabled ? req.paraSpacing.minPt : 6;
      const lineRatio = req.lineSpacing.minRatio || 1.15;
      const prefix = options?.spaceIndent ? '&nbsp;&nbsp;&nbsp;&nbsp;' : '';
      const indentStyle = options?.spaceIndent ? '' : `text-indent: ${indent}cm; `;
      htmlParts.push(`<p style="font-size: ${req.fontSize.pt}pt; ${indentStyle}text-align: ${align}; margin-bottom: ${spacing}pt; line-height: ${lineRatio}; font-family: 'Times New Roman';">${prefix}${textSpans}</p>`);
    }
  });

  if (doc.table && doc.table.rows && doc.table.rows.length > 0) {
    const tableGap = req.gapToTable.enabled ? req.gapToTable.minPt : 18;
    const tableAlign = req.tableAlign.align || 'center';
    const tableRowsHtml = doc.table.rows.map(r => {
      const cellsHtml = r.map(c => {
        const cellText = c.spans.map(s => {
          let t = s.text;
          if (s.sup) t = `<sup>${t}</sup>`;
          if (s.sub) t = `<sub>${t}</sub>`;
          if (s.b) t = `<b>${t}</b>`;
          if (s.i) t = `<i>${t}</i>`;
          if (s.u) t = `<u>${t}</u>`;
          return t;
        }).join('');
        const cAlign = c.align || 'center';
        const cValign = c.valign || (req.cellValign.enabled ? 'middle' : 'middle');
        const colSpanAttr = c.colSpan > 1 ? ` colspan="${c.colSpan}"` : '';
        const rowSpanAttr = c.rowSpan > 1 ? ` rowspan="${c.rowSpan}"` : '';
        return `<td align="${cAlign}" valign="${cValign}" style="font-size: ${req.fontSize.pt}pt;"${colSpanAttr}${rowSpanAttr}>${cellText}</td>`;
      }).join('');
      return `<tr>${cellsHtml}</tr>`;
    }).join('');

    htmlParts.push(`<table align="${tableAlign}" style="margin-top: ${tableGap}pt; width: 70%;">${tableRowsHtml}</table>`);
  }

  return htmlParts.join('\n');
}

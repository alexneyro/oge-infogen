import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { buildDocxBlob } from '../docx';

describe('buildDocxBlob', () => {
  it('creates valid OOXML docx and properly escapes XML entities & < > with Cyrillic text', async () => {
    const rawText = `Александр Пушкин & Николай Гоголь
Строка с символами <тег> и >больше< & "кавычки" 'апостроф'

Пустая строка выше, а здесь ещё текст:
1 < 2 && 5 > 3 & special chars`;

    const blob = await buildDocxBlob(rawText, 'Тестовый документ');
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    const zip = await JSZip.loadAsync(blob);

    // Verify first file is [Content_Types].xml
    const filenames = Object.keys(zip.files);
    expect(filenames[0]).toBe('[Content_Types].xml');

    // Verify required OOXML parts exist
    expect(zip.file('[Content_Types].xml')).not.toBeNull();
    expect(zip.file('_rels/.rels')).not.toBeNull();
    expect(zip.file('word/_rels/document.xml.rels')).not.toBeNull();
    expect(zip.file('word/document.xml')).not.toBeNull();

    const documentXml = await zip.file('word/document.xml')!.async('string');

    // Verify content contains escaped XML entities
    expect(documentXml).toContain('Александр Пушкин &amp; Николай Гоголь');
    expect(documentXml).toContain('&lt;тег&gt;');
    expect(documentXml).toContain('&gt;больше&lt;');
    expect(documentXml).toContain('&amp;&amp;');
    expect(documentXml).toContain('<w:p/>'); // Empty line representation

    // Verify that inside <w:t> tags there are no raw unescaped & < >
    const wtMatches = documentXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
    expect(wtMatches.length).toBeGreaterThan(0);

    for (const match of wtMatches) {
      const textInside = match.replace(/^<w:t[^>]*>/, '').replace(/<\/w:t>$/, '');
      // Text inside <w:t> must not contain raw unescaped & (unless followed by amp;, lt;, gt;, quot;, apos;)
      // Nor raw < or >
      expect(textInside).not.toMatch(/<|>/);
      expect(textInside).not.toMatch(/&(?!amp;|lt;|gt;|quot;|apos;)/);
    }
  });
});

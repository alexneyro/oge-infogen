import { Doc, Para, Cell, Span } from './parse';

export interface PastedDoc extends Doc {
  parseFailed?: boolean;
  generator: 'libreoffice' | 'word' | 'gdocs' | null;
  fontSizes: (number | null)[];
  aligns: (string | null)[];
  indents: (number | null)[];
  indentBySpaces: boolean[];
  hasLineBreaks: boolean[];
  lineHeights: (number | null)[];
  paraGaps: Array<{ after: number; before: number; sum: number; max: number }>;
  gapToTablePt: number | null;
  emptyParaCount: number;
  emptyParasBeforeTable: number;
  tableAlign: 'left' | 'center' | 'right' | null;
  tableWidthRatio: number | null;
  valigns: ('top' | 'middle' | 'bottom' | null)[][];
  cellHasLineBreak: boolean[][];
  boldFragments?: string[];
  italicFragments?: string[];
  underlineFragments?: string[];
  supFragments?: string[];
  subFragments?: string[];
}

export function parsePastedHtml(html: string): PastedDoc {
  try {
    if (!html || !html.trim()) {
      return {
        headingIndex: null,
        paragraphs: [],
        table: null,
        generator: null,
        fontSizes: [],
        aligns: [],
        indents: [],
        indentBySpaces: [],
        hasLineBreaks: [],
        lineHeights: [],
        paraGaps: [],
        gapToTablePt: null,
        emptyParaCount: 0,
        emptyParasBeforeTable: 0,
        tableAlign: null,
        tableWidthRatio: null,
        valigns: [],
        cellHasLineBreak: [],
        boldFragments: [],
        italicFragments: [],
        underlineFragments: [],
        supFragments: [],
        subFragments: []
      };
    }

    let doc: Document;
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      doc = parser.parseFromString(html, 'text/html');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const jsdom = require('jsdom');
      const dom = new jsdom.JSDOM(html);
      doc = dom.window.document;
    }

    // Определение генератора разметки
    let generator: 'libreoffice' | 'word' | 'gdocs' | null = null;
    const metaGen = (doc.querySelector('meta[name="generator"]')?.getAttribute('content') || '').toLowerCase();
    const htmlLower = html.toLowerCase();
    if (metaGen.includes('libreoffice') || htmlLower.includes('libreoffice')) {
      generator = 'libreoffice';
    } else if (
      metaGen.includes('microsoft word') ||
      htmlLower.includes('microsoft word') ||
      htmlLower.includes('mso-') ||
      htmlLower.includes('urn:schemas-microsoft-com:office')
    ) {
      generator = 'word';
    } else if (
      metaGen.includes('google docs') ||
      htmlLower.includes('google docs') ||
      htmlLower.includes('docs-internal-guid')
    ) {
      generator = 'gdocs';
    }

    // 1. Извлекаем стили из <style> и @page
    const styleRulesMap = new Map<string, Record<string, string>>();
    let pageTextWidthCm: number | null = null;

    doc.querySelectorAll('style').forEach(styleEl => {
      const cssText = styleEl.textContent || '';

      // Парсинг @page (например: @page { size: 21cm 29.7cm; margin: 2cm } или @page { margin-left: 3cm; margin-right: 1.5cm; })
      const pageRegex = /@page\s*(?:[^{]*)\{([^}]+)\}/gi;
      let pageM: RegExpExecArray | null;
      while ((pageM = pageRegex.exec(cssText)) !== null) {
        const pageBody = pageM[1];
        let pageWidthCm = 21.0; // А4 по умолчанию
        let marginLeftCm = 2.0;
        let marginRightCm = 2.0;
        let marginAllCm: number | null = null;

        pageBody.split(';').forEach(decl => {
          const colon = decl.indexOf(':');
          if (colon > -1) {
            const prop = decl.substring(0, colon).trim().toLowerCase();
            const val = decl.substring(colon + 1).trim().toLowerCase();
            if (prop === 'size') {
              const parts = val.split(/\s+/);
              const w = parseCm(parts[0]);
              if (w) pageWidthCm = w;
            } else if (prop === 'margin') {
              const parts = val.split(/\s+/);
              if (parts.length === 1) {
                const m = parseCm(parts[0]);
                if (m !== null) marginAllCm = m;
              } else if (parts.length === 2 || parts.length === 3) {
                const mLR = parseCm(parts[1]);
                if (mLR !== null) {
                  marginLeftCm = mLR;
                  marginRightCm = mLR;
                }
              } else if (parts.length >= 4) {
                const mR = parseCm(parts[1]);
                const mL = parseCm(parts[3]);
                if (mR !== null) marginRightCm = mR;
                if (mL !== null) marginLeftCm = mL;
              }
            } else if (prop === 'margin-left') {
              const mL = parseCm(val);
              if (mL !== null) marginLeftCm = mL;
            } else if (prop === 'margin-right') {
              const mR = parseCm(val);
              if (mR !== null) marginRightCm = mR;
            }
          }
        });

        if (marginAllCm !== null) {
          marginLeftCm = marginAllCm;
          marginRightCm = marginAllCm;
        }

        const calculatedWidth = pageWidthCm - marginLeftCm - marginRightCm;
        if (calculatedWidth > 0) {
          pageTextWidthCm = calculatedWidth;
        }
      }

      const ruleRegex = /([^{]+)\{([^}]+)\}/g;
      let m: RegExpExecArray | null;
      while ((m = ruleRegex.exec(cssText)) !== null) {
        const selector = m[1].trim();
        if (selector.startsWith('@')) continue;
        const body = m[2].trim();
        const styleObj: Record<string, string> = {};
        body.split(';').forEach(decl => {
          const colon = decl.indexOf(':');
          if (colon > -1) {
            const prop = decl.substring(0, colon).trim().toLowerCase();
            const val = decl.substring(colon + 1).trim();
            if (prop && val) styleObj[prop] = val;
          }
        });
        selector.split(',').forEach(s => {
          const cleanS = s.trim().toLowerCase();
          if (cleanS) {
            styleRulesMap.set(cleanS, { ...(styleRulesMap.get(cleanS) || {}), ...styleObj });
          }
        });
      }
    });

    // Хелпер получения собственных стилей элемента (без наследования от родителя)
    function getOwnCss(el: Element): Record<string, string> {
      const result: Record<string, string> = {};
      const tag = el.tagName.toLowerCase();

      // 1) Правила селекторов из <style>
      if (styleRulesMap.has(tag)) {
        Object.assign(result, styleRulesMap.get(tag));
      }
      Array.from(el.classList).forEach(cls => {
        const dotCls = '.' + cls.toLowerCase();
        if (styleRulesMap.has(dotCls)) {
          Object.assign(result, styleRulesMap.get(dotCls));
        }
        const tagDotCls = tag + '.' + cls.toLowerCase();
        if (styleRulesMap.has(tagDotCls)) {
          Object.assign(result, styleRulesMap.get(tagDotCls));
        }
      });

      // 2) Инлайновый style (приоритет над <style>)
      const inlineStyle = el.getAttribute('style');
      if (inlineStyle) {
        inlineStyle.split(';').forEach(decl => {
          const colon = decl.indexOf(':');
          if (colon > -1) {
            const prop = decl.substring(0, colon).trim().toLowerCase();
            const val = decl.substring(colon + 1).trim().toLowerCase();
            if (prop && val) result[prop] = val;
          }
        });
      }

      return result;
    }

    // Хелпер получения объединённого CSS для элемента
    function getCombinedCss(el: Element, parentCss: Record<string, string> = {}): Record<string, string> {
      const result: Record<string, string> = { ...parentCss };
      const tag = el.tagName.toLowerCase();

      // 1) Правила селекторов
      if (styleRulesMap.has(tag)) {
        Object.assign(result, styleRulesMap.get(tag));
      }
      Array.from(el.classList).forEach(cls => {
        const dotCls = '.' + cls.toLowerCase();
        if (styleRulesMap.has(dotCls)) {
          Object.assign(result, styleRulesMap.get(dotCls));
        }
        const tagDotCls = tag + '.' + cls.toLowerCase();
        if (styleRulesMap.has(tagDotCls)) {
          Object.assign(result, styleRulesMap.get(tagDotCls));
        }
      });

      // 2) Атрибуты выравнивания и стиля
      const alignAttr = el.getAttribute('align');
      if (alignAttr) {
        result['text-align'] = alignAttr.toLowerCase();
      }

      // 3) Инлайновый style
      const inlineStyle = el.getAttribute('style');
      if (inlineStyle) {
        inlineStyle.split(';').forEach(decl => {
          const colon = decl.indexOf(':');
          if (colon > -1) {
            const prop = decl.substring(0, colon).trim().toLowerCase();
            const val = decl.substring(colon + 1).trim();
            if (prop && val) result[prop] = val;
          }
        });
      }

      return result;
    }

    // Хелперы парсинга pt и cm
    function parsePt(valStr: string | undefined, parentPt: number = 12): number | null {
      if (!valStr) return null;
      const s = valStr.trim().toLowerCase();
      if (s.endsWith('pt')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num;
      }
      if (s.endsWith('px')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num * 0.75;
      }
      if (s.endsWith('em') || s.endsWith('rem')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num * parentPt;
      }
      if (s.endsWith('%')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : parentPt * (num / 100);
      }
      if (s.endsWith('cm')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num * 28.3465;
      }
      if (s.endsWith('mm')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num * 2.83465;
      }
      if (s.endsWith('in')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num * 72;
      }
      const num = parseFloat(s);
      return isNaN(num) ? null : num;
    }

    function parseCm(valStr: string | undefined): number | null {
      if (!valStr) return null;
      const s = valStr.trim().toLowerCase();
      if (s.endsWith('cm')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num;
      }
      if (s.endsWith('mm')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num / 10;
      }
      if (s.endsWith('pt')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num * 0.0352778;
      }
      if (s.endsWith('px')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num * 0.0264583;
      }
      if (s.endsWith('in')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num * 2.54;
      }
      const num = parseFloat(s);
      return isNaN(num) ? null : num;
    }

    function parseLineHeight(valStr: string | undefined, fontPt: number | null): number | null {
      if (!valStr) return null;
      const s = valStr.trim().toLowerCase();
      if (s === 'normal') return 1.0;
      if (s.endsWith('%')) {
        const num = parseFloat(s);
        return isNaN(num) ? null : num / 100;
      }
      if (s.endsWith('pt')) {
        const pt = parseFloat(s);
        if (isNaN(pt)) return null;
        return fontPt && fontPt > 0 ? pt / fontPt : pt / 14;
      }
      if (s.endsWith('px')) {
        const px = parseFloat(s);
        if (isNaN(px)) return null;
        const pt = px * 0.75;
        return fontPt && fontPt > 0 ? pt / fontPt : pt / 14;
      }
      const num = parseFloat(s);
      return isNaN(num) ? null : num;
    }

    const NODE_ELEMENT = 1;
    const NODE_TEXT = 3;
    const DOC_POS_FOLLOWING = 4;

    // Вспомогательная функция для определения font-size конкретного узла DOM
    function getNodeFontSizePt(node: Node): number | null {
      // 1) Поднимаемся по предкам в поиске инлайн-стиля font-size
      let curr: Node | null = node.nodeType === NODE_TEXT ? node.parentNode : node;
      while (curr && curr.nodeType === NODE_ELEMENT) {
        const el = curr as Element;
        const styleAttr = el.getAttribute('style');
        if (styleAttr) {
          const match = /font-size\s*:\s*([^;]+)/i.exec(styleAttr);
          if (match) {
            const parsed = parsePt(match[1]);
            if (parsed !== null) return parsed;
          }
        }
        curr = curr.parentNode;
      }

      // 2) Если нет инлайн-стиля — проверяем атрибут <font size="N">
      curr = node.nodeType === NODE_TEXT ? node.parentNode : node;
      while (curr && curr.nodeType === NODE_ELEMENT) {
        const el = curr as Element;
        if (el.tagName.toLowerCase() === 'font') {
          const sizeAttr = el.getAttribute('size');
          if (sizeAttr) {
            const sNum = parseInt(sizeAttr.trim(), 10);
            const fontMap: Record<number, number> = {
              1: 8,
              2: 10,
              3: 12,
              4: 14,
              5: 18,
              6: 24,
              7: 36
            };
            if (fontMap[sNum] !== undefined) {
              return fontMap[sNum];
            }
          }
        }
        curr = curr.parentNode;
      }

      return null;
    }

    // Вычисление размера шрифта элемента по всем текстовым узлам
    function computeElementFontSizePt(container: Element): number | null {
      const sizes: number[] = [];
      let hasAnyText = false;

      function scan(n: Node) {
        if (n.nodeType === NODE_TEXT) {
          const raw = (n.nodeValue || '').replace(/[\r\n\t ]+/g, ' ').replace(/\u200B/g, '');
          if (raw.trim().length > 0) {
            hasAnyText = true;
            const sz = getNodeFontSizePt(n);
            if (sz !== null) {
              sizes.push(sz);
            } else {
              sizes.push(-1); // не задан
            }
          }
          return;
        }
        if (n.nodeType === NODE_ELEMENT) {
          const tag = (n as Element).tagName.toLowerCase();
          if (tag === 'script' || tag === 'style' || tag === 'o:p') return;
          Array.from(n.childNodes).forEach(scan);
        }
      }

      scan(container);

      if (!hasAnyText || sizes.length === 0) return null;
      if (sizes.some(s => s === -1)) return null; // Если хотя бы у части не задан
      const first = sizes[0];
      const allSame = sizes.every(s => Math.abs(s - first) < 0.25);
      return allSame ? first : null;
    }

    // Извлечение спанов текста из любого элемента DOM
    function extractSpansFromNode(
      node: Node,
      parentCss: Record<string, string>,
      currentFlags: { b?: boolean; i?: boolean; u?: boolean; sup?: boolean; sub?: boolean; fontFamily?: string; fontSizePt?: number }
    ): Span[] {
      const spans: Span[] = [];

      if (node.nodeType === NODE_TEXT) {
        let text = node.nodeValue || '';
        // 2) Нормализация пробелов в тексте спанов:
        // обычные пробелы, \n, \r, \t сворачиваем в один пробел, как браузер.
        // \u00A0 (NBSP) НЕ сворачиваем и НЕ приравниваем к обычному пробелу.
        text = text.replace(/[\r\n\t ]+/g, ' ').replace(/\u200B/g, '');
        if (text) {
          spans.push({
            text,
            ...(currentFlags.b ? { b: true } : {}),
            ...(currentFlags.i ? { i: true } : {}),
            ...(currentFlags.u ? { u: true } : {}),
            ...(currentFlags.sup ? { sup: true } : {}),
            ...(currentFlags.sub ? { sub: true } : {}),
            ...(currentFlags.fontFamily ? { fontFamily: currentFlags.fontFamily } : {}),
            ...(currentFlags.fontSizePt !== undefined ? { fontSizePt: currentFlags.fontSizePt } : {})
          });
        }
        return spans;
      }

      if (node.nodeType === NODE_ELEMENT) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();

        // Пропускаем o:p, script, style
        if (tag === 'o:p' || tag === 'script' || tag === 'style') {
          return spans;
        }

        const elCss = getCombinedCss(el, parentCss);
        const ownCss = getOwnCss(el);

        // Курсив:
        // если в ownCss есть font-style — italic/oblique дают true, любое другое значение (normal) даёт false;
        // иначе если тег i или em — true;
        // иначе наследовать currentFlags.i.
        let isI: boolean = !!currentFlags.i;
        if (ownCss['font-style'] !== undefined) {
          const fs = ownCss['font-style'].toLowerCase().trim();
          isI = fs === 'italic' || fs === 'oblique';
        } else if (tag === 'i' || tag === 'em') {
          isI = true;
        }

        // Полужирный:
        // если в ownCss есть font-weight — bold/bolder или число >= 600 дают true, normal/lighter или число < 600 дают false;
        // иначе если тег b или strong — true;
        // иначе наследовать currentFlags.b.
        let isB: boolean = !!currentFlags.b;
        if (ownCss['font-weight'] !== undefined) {
          const fw = ownCss['font-weight'].toLowerCase().trim();
          const num = parseInt(fw, 10);
          if (!isNaN(num)) {
            isB = num >= 600;
          } else if (fw === 'bold' || fw === 'bolder') {
            isB = true;
          } else if (fw === 'normal' || fw === 'lighter') {
            isB = false;
          } else {
            isB = false;
          }
        } else if (tag === 'b' || tag === 'strong') {
          isB = true;
        }

        // Подчёркивание:
        // если в ownCss есть text-decoration или text-decoration-line — значение, содержащее underline, даёт true, значение none даёт false;
        // иначе если тег u или ins — true;
        // иначе наследовать currentFlags.u.
        let isU: boolean = !!currentFlags.u;
        const td = (ownCss['text-decoration'] || ownCss['text-decoration-line'] || '').toLowerCase().trim();
        if (td) {
          if (td.includes('underline')) {
            isU = true;
          } else if (td === 'none') {
            isU = false;
          }
        } else if (tag === 'u' || tag === 'ins') {
          isU = true;
        }

        // Надстрочный:
        // если в ownCss есть vertical-align — super даёт true, baseline/другое даёт false;
        // иначе если тег sup — true;
        // иначе наследовать currentFlags.sup.
        let isSup: boolean = !!currentFlags.sup;
        if (ownCss['vertical-align'] !== undefined) {
          const va = ownCss['vertical-align'].toLowerCase().trim();
          isSup = va.includes('super');
        } else if (tag === 'sup') {
          isSup = true;
        }

        // Подстрочный:
        // если в ownCss есть vertical-align — sub даёт true, baseline/другое даёт false;
        // иначе если тег sub — true;
        // иначе наследовать currentFlags.sub.
        let isSub: boolean = !!currentFlags.sub;
        if (ownCss['vertical-align'] !== undefined) {
          const va = ownCss['vertical-align'].toLowerCase().trim();
          isSub = va.includes('sub');
        } else if (tag === 'sub') {
          isSub = true;
        }

        // Гарнитура шрифта (font-family):
        let currentFontFamily = currentFlags.fontFamily;
        const ff = (elCss['font-family'] || (tag === 'font' ? el.getAttribute('face') : null) || '').trim();
        if (ff) {
          currentFontFamily = ff;
        }

        // Размер шрифта (font-size):
        let currentFontSizePt = currentFlags.fontSizePt;
        const ownFs = parsePt(elCss['font-size']);
        if (ownFs !== null) {
          currentFontSizePt = ownFs;
        }

        const flags = { b: isB, i: isI, u: isU, sup: isSup, sub: isSub, fontFamily: currentFontFamily, fontSizePt: currentFontSizePt };

        Array.from(el.childNodes).forEach(child => {
          spans.push(...extractSpansFromNode(child, elCss, flags));
        });
      }

      return spans;
    }

    function mergeSpans(rawSpans: Span[]): Span[] {
      const merged: Span[] = [];
      for (const s of rawSpans) {
        if (!s.text) continue;
        if (merged.length > 0) {
          const last = merged[merged.length - 1];
          if (
            !!last.b === !!s.b &&
            !!last.i === !!s.i &&
            !!last.u === !!s.u &&
            !!last.sup === !!s.sup &&
            !!last.sub === !!s.sub &&
            last.fontFamily === s.fontFamily &&
            last.fontSizePt === s.fontSizePt
          ) {
            last.text += s.text;
            continue;
          }
        }
        merged.push({ ...s });
      }
      return merged;
    }

    // Обрезка ведущих и замыкающих обычных пробелов у абзаца
    function trimParaSpans(spans: Span[]): Span[] {
      if (spans.length === 0) return spans;

      // Обрезаем ведущие обычные пробелы (не \u00A0)
      for (let i = 0; i < spans.length; i++) {
        const trimmed = spans[i].text.replace(/^[ ]+/, '');
        if (trimmed !== spans[i].text) {
          spans[i] = { ...spans[i], text: trimmed };
        }
        if (spans[i].text.length > 0) {
          break;
        }
      }

      // Обрезаем замыкающие обычные пробелы (не \u00A0)
      for (let i = spans.length - 1; i >= 0; i--) {
        const trimmed = spans[i].text.replace(/[ ]+$/, '');
        if (trimmed !== spans[i].text) {
          spans[i] = { ...spans[i], text: trimmed };
        }
        if (spans[i].text.length > 0) {
          break;
        }
      }

      return spans.filter(s => s.text.length > 0);
    }

    // 2. Ищем абзацы
    const bodyEl = doc.body;
    const bodyCss = getCombinedCss(bodyEl);

    function findParaElements(container: Element): { el: Element; css: Record<string, string> }[] {
      const result: { el: Element; css: Record<string, string> }[] = [];

      function walk(node: Element, parentCss: Record<string, string>) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'table' || tag === 'style' || tag === 'script') return;

        const elCss = getCombinedCss(node, parentCss);
        const isBlock = ['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'].includes(tag);

        if (isBlock) {
          const childBlocks = Array.from(node.children).filter(c => {
            const cTag = c.tagName.toLowerCase();
            return cTag !== 'table' && ['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'].includes(cTag);
          });

          if (childBlocks.length > 0) {
            Array.from(node.children).forEach(c => walk(c, elCss));
          } else {
            result.push({ el: node, css: elCss });
          }
        } else {
          Array.from(node.children).forEach(c => walk(c, elCss));
        }
      }

      walk(container, bodyCss);

      if (result.length === 0 && (container.textContent || '').trim().length > 0) {
        result.push({ el: container, css: bodyCss });
      }

      return result;
    }

    const paraInfoList = findParaElements(bodyEl);
    const tableEl = doc.querySelector('table');

    let lastParaBeforeTableIndex = -1;
    if (tableEl) {
      for (let i = paraInfoList.length - 1; i >= 0; i--) {
        const pEl = paraInfoList[i].el;
        if ((pEl.compareDocumentPosition(tableEl) & DOC_POS_FOLLOWING) !== 0) {
          lastParaBeforeTableIndex = i;
          break;
        }
      }
      if (lastParaBeforeTableIndex === -1 && paraInfoList.length > 0) {
        lastParaBeforeTableIndex = paraInfoList.length - 1;
      }
    }

    const paragraphs: Para[] = [];
    const fontSizes: (number | null)[] = [];
    const aligns: (string | null)[] = [];
    const indents: (number | null)[] = [];
    const indentBySpaces: boolean[] = [];
    const hasLineBreaks: boolean[] = [];
    const lineHeights: (number | null)[] = [];
    const marginTopPts: number[] = [];
    const marginBottomPts: number[] = [];
    let lastValidParaInfoIdx = -1;
    let emptyParaCount = 0;
    let emptyParasBeforeTable = 0;

    // Подсчёт пустых абзацев строго между содержательными элементами
    const paraEmptyFlags = paraInfoList.map(({ el, css }) => {
      const rawSpans = extractSpansFromNode(el, css, {});
      const merged = mergeSpans(rawSpans);
      const spans = trimParaSpans(merged);
      const fullText = spans.map(s => s.text).join('');
      const hasImgOrTable = el.querySelector('img, table') !== null;
      const isEmpty = !fullText.trim() && !hasImgOrTable;
      return { isEmpty, spans };
    });

    const isNodeContent = (node: Element, idx: number): boolean => {
      if (node.tagName.toLowerCase() === 'table') return true;
      if (node.querySelector('table')) return true;
      const pIdx = paraInfoList.findIndex(p => p.el === node);
      if (pIdx !== -1) {
        return !paraEmptyFlags[pIdx].isEmpty;
      }
      return (node.textContent || '').trim().length > 0 || node.querySelector('img') !== null;
    };

    const topNodes = Array.from(bodyEl.children).filter(c => {
      const tag = c.tagName.toLowerCase();
      return tag !== 'style' && tag !== 'script';
    });

    let firstContentNodeIdx = -1;
    let lastContentNodeIdx = -1;
    topNodes.forEach((node, idx) => {
      if (isNodeContent(node, idx)) {
        if (firstContentNodeIdx === -1) firstContentNodeIdx = idx;
        lastContentNodeIdx = idx;
      }
    });

    const isCountedEmptyPara = new Array(paraInfoList.length).fill(false);

    if (firstContentNodeIdx !== -1 && lastContentNodeIdx > firstContentNodeIdx) {
      paraInfoList.forEach(({ el }, idx) => {
        if (paraEmptyFlags[idx].isEmpty) {
          // Проверяем, находится ли абзац строго между первым и последним содержательным узлом верхнего уровня
          const topAncestor = topNodes.find(n => n === el || n.contains(el));
          if (topAncestor) {
            const nodeIdx = topNodes.indexOf(topAncestor);
            if (nodeIdx > firstContentNodeIdx && nodeIdx < lastContentNodeIdx) {
              emptyParaCount++;
              isCountedEmptyPara[idx] = true;
            }
          }
        }
      });
    }

    // Хелпер парсинга margin в pt
    const parseMarginPt = (css: Record<string, string>, side: 'top' | 'bottom'): number | null => {
      const val = css[`margin-${side}`] || css['margin'];
      if (!val) return null;
      const parts = val.trim().split(/\s+/);
      let s = parts[0];
      if (parts.length === 2) {
        s = parts[0];
      } else if (parts.length === 3) {
        s = side === 'top' ? parts[0] : parts[2];
      } else if (parts.length === 4) {
        s = side === 'top' ? parts[0] : parts[2];
      }
      return parsePt(s);
    };

    paraInfoList.forEach(({ el, css }, idx) => {
      const { isEmpty, spans } = paraEmptyFlags[idx];
      if (isEmpty) {
        if (isCountedEmptyPara[idx] && tableEl && (el.compareDocumentPosition(tableEl) & DOC_POS_FOLLOWING) !== 0) {
          emptyParasBeforeTable++;
        }
        return;
      }

      lastValidParaInfoIdx = idx;
      paragraphs.push({ spans });

      // 1) Размер шрифта абзаца вычисляется по всем его текстовым узлам (через inline-стиль / font size)
      const fs = computeElementFontSizePt(el);
      fontSizes.push(fs);

      const parsedLh = parseLineHeight(css['line-height'], fs);
      const lh = parsedLh !== null ? parsedLh : 1.0;
      lineHeights.push(lh);

      let align = css['text-align'] || null;
      if (align) {
        align = align.toLowerCase();
        if (!['left', 'center', 'right', 'justify'].includes(align)) {
          align = null;
        }
      }
      // ПРАВКА 1: aligns — если у абзаца нет ни атрибута align, ни text-align — подставлять 'left' (не null) для libreoffice/word
      if (!align && (generator === 'libreoffice' || generator === 'word')) {
        align = 'left';
      }
      aligns.push(align);

      let indent = parseCm(css['text-indent']);
      // ПРАВКА 1: indents — если нет text-indent и нет margin-left — подставлять 0 (не null) для libreoffice/word
      if (indent === null && (generator === 'libreoffice' || generator === 'word')) {
        const ml = parseCm(css['margin-left']);
        if (ml === null) {
          indent = 0;
        }
      }
      indents.push(indent);

      const mt = parseMarginPt(css, 'top');
      const mb = parseMarginPt(css, 'bottom');
      marginTopPts.push(mt !== null ? mt : 0);
      marginBottomPts.push(mb !== null ? mb : 0);

      // 1) indentBySpaces: считать true ТОЛЬКО если абзац начинается с неразрывного пробела (\u00A0),
      // табуляции (\t) или их последовательности. Срезать ведущие переносы строк перед проверкой.
      // Применять ТОЛЬКО к абзацам верхнего уровня (не внутри td/th).
      const isInsideCell = el.closest('td, th') !== null;
      if (isInsideCell) {
        indentBySpaces.push(false);
      } else {
        const rawTextContent = el.textContent || '';
        const lead = rawTextContent.replace(/^[\r\n]+/, '');
        const startsWithNbspOrTab = /^[\u00A0\t]/.test(lead);
        indentBySpaces.push(startsWithNbspOrTab);
      }

      const hasBr = el.querySelector('br') !== null;
      hasLineBreaks.push(hasBr);
    });

    // Стыки между текстовыми абзацами (не считая стык с таблицей)
    const paraGaps: Array<{ after: number; before: number; sum: number; max: number }> = [];
    for (let i = 0; i < paragraphs.length - 1; i++) {
      const after = marginBottomPts[i] || 0;
      const before = marginTopPts[i + 1] || 0;
      paraGaps.push({
        after,
        before,
        sum: after + before,
        max: Math.max(after, before)
      });
    }

    // 3. Таблица (первая <table>)
    let tableObj: { rows: Cell[][] } | null = null;

    let gapToTablePt: number | null = null;
    let tableAlign: 'left' | 'center' | 'right' | null = null;
    let tableWidthRatio: number | null = null;
    const valigns: ('top' | 'middle' | 'bottom' | null)[][] = [];
    const cellHasLineBreak: boolean[][] = [];

    if (tableEl) {
      const tableCss = getCombinedCss(tableEl, bodyCss);
      const tableMt = parseMarginPt(tableCss, 'top') || 0;
      const lastParaMb = marginBottomPts.length > 0 ? (marginBottomPts[marginBottomPts.length - 1] || 0) : 0;

      // Считаем высоту пустых абзацев между последним текстовым абзацем и таблицей
      let emptyParasHeight = 0;
      if (lastValidParaInfoIdx !== -1) {
        for (let i = lastValidParaInfoIdx + 1; i < paraInfoList.length; i++) {
          const pEl = paraInfoList[i].el;
          if ((pEl.compareDocumentPosition(tableEl) & DOC_POS_FOLLOWING) !== 0) {
            const pCss = paraInfoList[i].css;
            const pFs = computeElementFontSizePt(pEl) || 14;
            const pLh = parseLineHeight(pCss['line-height'], pFs) || 1.0;
            const pEmptyH = pFs * pLh;
            const pMt = parseMarginPt(pCss, 'top') || 0;
            const pMb = parseMarginPt(pCss, 'bottom') || 0;
            emptyParasHeight += pEmptyH + pMt + pMb;
          }
        }
      }

      gapToTablePt = lastParaMb + tableMt + emptyParasHeight;

      // 3) tableAlign: считать 'center', если таблица имеет предка <center> или [align="center"], либо align="center", либо margin-left/right: auto
      const hasCenterAncestor = tableEl.closest('center') !== null ||
        tableEl.closest('[align="center"]') !== null ||
        tableEl.closest('[style*="text-align: center"], [style*="text-align:center"]') !== null;
      const alignAttr = (tableEl.getAttribute('align') || '').toLowerCase().trim();

      if (
        hasCenterAncestor ||
        alignAttr === 'center' ||
        (tableCss['margin-left'] === 'auto' && tableCss['margin-right'] === 'auto') ||
        (tableCss['margin'] || '').includes('auto')
      ) {
        tableAlign = 'center';
      } else if (['left', 'right'].includes(alignAttr)) {
        tableAlign = alignAttr as 'left' | 'right';
      } else {
        const ta = (tableCss['text-align'] || '').toLowerCase().trim();
        if (['left', 'center', 'right'].includes(ta)) {
          tableAlign = ta as 'left' | 'center' | 'right';
        }
      }

      // 4) tableWidthRatio:
      // если width таблицы задан в процентах — брать как есть (0..1).
      // Если в пикселях/см/дюймах/pt — переводить в см и делить на ширину текстовой области из @page (по умолчанию 17 см).
      const textWidthCm = pageTextWidthCm !== null && pageTextWidthCm > 0 ? pageTextWidthCm : 17.0;
      const wRaw = tableCss['width'] || tableEl.getAttribute('width');

      if (wRaw) {
        const wStr = wRaw.toLowerCase().trim();
        if (wStr.endsWith('%')) {
          const p = parseFloat(wStr);
          if (!isNaN(p)) {
            tableWidthRatio = Math.max(0, Math.min(1.0, p / 100));
          }
        } else {
          // Вычисляем ширину в см
          let wCm: number | null = null;
          if (wStr.endsWith('cm')) {
            wCm = parseFloat(wStr) || null;
          } else if (wStr.endsWith('mm')) {
            wCm = (parseFloat(wStr) || 0) / 10 || null;
          } else if (wStr.endsWith('in')) {
            wCm = (parseFloat(wStr) || 0) * 2.54 || null;
          } else if (wStr.endsWith('pt')) {
            wCm = (parseFloat(wStr) || 0) * (2.54 / 72) || null;
          } else if (wStr.endsWith('px')) {
            wCm = (parseFloat(wStr) || 0) * (2.54 / 96) || null;
          } else {
            const num = parseFloat(wStr);
            if (!isNaN(num)) {
              if (num > 0 && num <= 1.0) {
                tableWidthRatio = num;
              } else {
                // Если просто число > 1 (часто пиксели в HTML-атрибуте width="500")
                wCm = num * (2.54 / 96);
              }
            }
          }

          if (wCm !== null && wCm > 0) {
            const ratio = wCm / textWidthCm;
            tableWidthRatio = Math.max(0, Math.min(1.0, ratio));
          }
        }
      }

      const tableRows: Cell[][] = [];
      const trElements = Array.from(tableEl.querySelectorAll('tr'));

      trElements.forEach(trEl => {
        const trCss = getCombinedCss(trEl, tableCss);
        const cells: Cell[] = [];
        const rowValigns: ('top' | 'middle' | 'bottom' | null)[] = [];
        const rowCellHasLineBreak: boolean[] = [];
        const cellEls = Array.from(trEl.children).filter(c => {
          const t = c.tagName.toLowerCase();
          return t === 'td' || t === 'th';
        });

        cellEls.forEach(cEl => {
          const cCss = getCombinedCss(cEl, trCss);
          const rawSpans = extractSpansFromNode(cEl, cCss, {});
          const merged = mergeSpans(rawSpans);
          const spans = trimParaSpans(merged);

          const colSpan = parseInt(cEl.getAttribute('colspan') || '1', 10) || 1;
          const rowSpan = parseInt(cEl.getAttribute('rowspan') || '1', 10) || 1;

          let rawAlign = (cCss['text-align'] || cEl.getAttribute('align') || '').toLowerCase().trim();
          // Если у td/th нет ни атрибута align, ни text-align в style — берем значение с первого дочернего <p>
          if (!rawAlign) {
            const firstP = cEl.querySelector('p');
            if (firstP) {
              const pCss = getCombinedCss(firstP, cCss);
              rawAlign = (pCss['text-align'] || firstP.getAttribute('align') || '').toLowerCase().trim();
            }
          }

          let cAlign: 'left' | 'center' | 'right' | null = null;
          if (rawAlign === 'justify') {
            cAlign = 'left';
          } else if (['left', 'center', 'right'].includes(rawAlign)) {
            cAlign = rawAlign as 'left' | 'center' | 'right';
          }

          // Вертикальное выравнивание
          let rawValign = (cCss['vertical-align'] || cEl.getAttribute('valign') || trEl.getAttribute('valign') || '').toLowerCase().trim();
          let cValign: 'top' | 'middle' | 'bottom' | null = null;
          if (rawValign === 'center') rawValign = 'middle';
          if (['top', 'middle', 'bottom'].includes(rawValign)) {
            cValign = rawValign as 'top' | 'middle' | 'bottom';
          }
          rowValigns.push(cValign);

          // Наличие <br> внутри ячейки
          const hasBr = cEl.querySelector('br') !== null;
          rowCellHasLineBreak.push(hasBr);

          cells.push({
            spans,
            colSpan,
            rowSpan,
            align: cAlign,
            valign: cValign,
            hasLineBreak: hasBr
          });
        });

        tableRows.push(cells);
        valigns.push(rowValigns);
        cellHasLineBreak.push(rowCellHasLineBreak);
      });

      if (tableRows.length > 0) {
        tableObj = { rows: tableRows };
      }
    }

    let headingIndex: number | null = null;
    if (paragraphs.length > 0) {
      const firstAlign = aligns[0];
      const firstIndent = indents[0];
      const firstBySpaces = indentBySpaces[0];
      if (firstAlign === 'center' && (firstIndent === null || firstIndent === 0) && !firstBySpaces) {
        headingIndex = 0;
      }
    }

    const normTextFrag = (s: string) =>
      s.replace(/\u00A0/g, ' ').replace(/[«»""]/g, '"').replace(/[–—]/g, '-')
       .replace(/\s+/g, ' ').trim().toLowerCase();

    const boldFragments: string[] = [];
    const italicFragments: string[] = [];
    const underlineFragments: string[] = [];
    const supFragments: string[] = [];
    const subFragments: string[] = [];

    paragraphs.forEach(p => {
      (p.spans || []).forEach(s => {
        const txt = normTextFrag(s.text);
        if (txt) {
          if (s.b) boldFragments.push(txt);
          if (s.i) italicFragments.push(txt);
          if (s.u) underlineFragments.push(txt);
          if (s.sup) supFragments.push(txt);
          if (s.sub) subFragments.push(txt);
        }
      });
    });

    if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || (process.env as any)?.VITEST)) {
      if (/<table/i.test(html) && tableObj === null) {
        throw new Error('Test barrier: parsePastedHtml received HTML with "<table" but parsed table is null');
      }
    }

    return {
      headingIndex,
      paragraphs,
      table: tableObj,
      generator,
      fontSizes,
      aligns,
      indents,
      indentBySpaces,
      hasLineBreaks,
      lineHeights,
      paraGaps,
      gapToTablePt,
      emptyParaCount,
      emptyParasBeforeTable,
      tableAlign,
      tableWidthRatio,
      valigns,
      cellHasLineBreak,
      boldFragments,
      italicFragments,
      underlineFragments,
      supFragments,
      subFragments
    };
  } catch (e) {
    if (process.env.NODE_ENV === 'test' || typeof process !== 'undefined' && process.env?.VITEST) {
      throw e;
    }
    console.error('Error parsing pasted HTML:', e);
    return {
      parseFailed: true,
      headingIndex: null,
      paragraphs: [],
      table: null,
      generator: null,
      fontSizes: [],
      aligns: [],
      indents: [],
      indentBySpaces: [],
      hasLineBreaks: [],
      lineHeights: [],
      paraGaps: [],
      gapToTablePt: null,
      emptyParaCount: 0,
      emptyParasBeforeTable: 0,
      tableAlign: null,
      tableWidthRatio: null,
      valigns: [],
      cellHasLineBreak: [],
      boldFragments: [],
      italicFragments: [],
      underlineFragments: [],
      supFragments: [],
      subFragments: []
    };
  }
}

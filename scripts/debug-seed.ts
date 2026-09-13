import { JSDOM } from 'jsdom';
const dom = new JSDOM();
(global as any).DOMParser = dom.window.DOMParser;
(global as any).Node = dom.window.Node;

import { generateTask13 } from '../src/tasks/task13/generate';
import { parsePastedHtml } from '../src/tasks/task13/html';
import { checkTask13 } from '../src/tasks/task13/check';
import { renderSampleHtml } from './test-roundtrip';

const task = generateTask13(41964, 3);
console.log('DOC PARAGRAPHS SPANS:');
task.doc.paragraphs.forEach((p, i) => {
  console.log(`Para ${i}:`, JSON.stringify(p.spans));
});
const html = renderSampleHtml(task.doc, task.doc.spec);
console.log('HTML:');
console.log(html);

const pasted = parsePastedHtml(html);
console.log('PASTED SPANS:');
pasted.paragraphs.forEach((p, i) => {
  console.log(`Pasted Para ${i}:`, JSON.stringify(p.spans));
});

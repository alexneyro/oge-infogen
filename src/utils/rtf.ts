/**
 * RTF (Rich Text Format) document generator.
 * Encodes plain text with Cyrillic support (CP1251 / Unicode \uNNNN? escaping).
 */
export function buildRtfString(text: string): string {
  const header = '{\\rtf1\\ansi\\ansicpg1251\\deff0\n{\\fonttbl{\\f0\\fnil\\fcharset204 Times New Roman;}}\n\\viewkind4\\uc1\\pard\\lang1049\\f0\\fs24 ';

  let body = '';
  const lines = text.split(/\r?\n/);

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const code = char.charCodeAt(0);

      if (char === '\\') {
        body += '\\\\';
      } else if (char === '{') {
        body += '\\{';
      } else if (char === '}') {
        body += '\\}';
      } else if (code > 127) {
        // RTF unicode escape: \uNNNN? where NNNN is signed 16-bit int (-32768 to 32767)
        const signedCode = code > 32767 ? code - 65536 : code;
        body += `\\u${signedCode}?`;
      } else {
        body += char;
      }
    }

    if (l < lines.length - 1) {
      body += '\\par\n';
    }
  }

  return header + body + '\n}';
}

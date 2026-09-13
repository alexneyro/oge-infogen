/**
 * Читает текстовый файл с автоопределением кодировки (UTF-8 / windows-1251).
 * Срезает UTF-8 / UTF-16 BOM при наличии.
 */
export async function readTextFile(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Сначала пробуем UTF-8
  const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
  let decoded = utf8Decoder.decode(bytes);

  // Срезаем BOM если есть
  if (decoded.charCodeAt(0) === 0xfeff) {
    decoded = decoded.slice(1);
  }

  // Если UTF-8 дал символы замены U+FFFD, значит файл в однобайтовой кодировке (например, windows-1251)
  if (decoded.includes('\uFFFD')) {
    try {
      const win1251Decoder = new TextDecoder('windows-1251', { fatal: false });
      let winDecoded = win1251Decoder.decode(bytes);
      if (winDecoded.charCodeAt(0) === 0xfeff) {
        winDecoded = winDecoded.slice(1);
      }
      return winDecoded;
    } catch {
      // Если windows-1251 не поддерживается средой, возвращаем decoded
      return decoded;
    }
  }

  return decoded;
}

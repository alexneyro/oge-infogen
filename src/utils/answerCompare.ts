export function compareOutput(expected: string, actual: string): boolean {
  const tokenize = (str: string) =>
    (str || '')
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 0);

  const expTokens = tokenize(expected);
  const actTokens = tokenize(actual);

  if (expTokens.length !== actTokens.length) {
    return false;
  }

  for (let i = 0; i < expTokens.length; i++) {
    const expTok = expTokens[i];
    const actTok = actTokens[i];

    const expNorm = expTok.replace(',', '.');
    const actNorm = actTok.replace(',', '.');

    const expNum = Number(expNorm);
    const actNum = Number(actNorm);

    const isExpNum = !isNaN(expNum) && expTok.trim() !== '';
    const isActNum = !isNaN(actNum) && actTok.trim() !== '';

    if (isExpNum && isActNum) {
      if (Math.abs(expNum - actNum) > 1e-6) {
        return false;
      }
    } else {
      if (expTok.trim().toLowerCase() !== actTok.trim().toLowerCase()) {
        return false;
      }
    }
  }

  return true;
}

export function compareClassNames(a: string, b: string): number {
  return a.localeCompare(b, 'ru', { numeric: true, sensitivity: 'base' });
}

export async function fetchAllPages<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const result: T[] = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await buildQuery(from, to);

    if (error) {
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : String(error);
      throw new Error(message || 'Ошибка загрузки данных');
    }

    const page = data ?? [];
    result.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return result;
}

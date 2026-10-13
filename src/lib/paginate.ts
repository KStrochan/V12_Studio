export const EXPORT_TOO_LARGE = 'EXPORT_TOO_LARGE'

type Page<T> = PromiseLike<{ data: T[] | null; error: unknown }>

/**
 * Reads every row through a range-based query in pages (PostgREST caps a single response at max_rows,
 * so `.limit(N)` alone silently truncates). Throws EXPORT_TOO_LARGE past `cap` rows.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => Page<T>,
  pageSize = 1000,
  cap = 50_000,
): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1)
    if (error) throw error
    const rows = data ?? []
    out.push(...rows)
    if (out.length > cap) throw new Error(EXPORT_TOO_LARGE)
    if (rows.length < pageSize) return out
  }
}

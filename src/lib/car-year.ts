export const MIN_CAR_YEAR = 1980
export const DB_MIN_CAR_YEAR = 1950

/** Current calendar year in Europe/Kyiv. */
export function kyivYear(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric' }).format(now))
}

/** Years for the select: current Kyiv year down to 1980. */
export function carYearOptions(now: Date = new Date()): number[] {
  const top = kyivYear(now)
  const out: number[] = []
  for (let y = top; y >= MIN_CAR_YEAR; y--) out.push(y)
  return out
}

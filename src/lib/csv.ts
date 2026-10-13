type Cell = string | number | null

/** Plain phone-like values ("+380501234567", "(050) 123-45-67") cannot form a formula. */
const PHONE_LIKE = /^\+?\d[\d\s().-]*$/
const FORMULA = /^[=+\-@\t\r]/

function cell(v: Cell): string {
  if (v === null || v === undefined) return ''
  let s = String(v)
  if (typeof v === 'string' && FORMULA.test(s) && !PHONE_LIKE.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** RFC 4180-style CSV with a UTF-8 BOM (so Excel reads Cyrillic) and CSV-injection protection. */
export function toCsv(rows: Record<string, Cell>[]): string {
  const BOM = '\uFEFF'
  if (rows.length === 0) return BOM
  const keys: string[] = []
  for (const r of rows) for (const k of Object.keys(r)) if (!keys.includes(k)) keys.push(k)
  const lines = [keys.map(cell).join(',')]
  for (const r of rows) lines.push(keys.map((k) => cell(r[k] ?? null)).join(','))
  return BOM + lines.join('\r\n') + '\r\n'
}

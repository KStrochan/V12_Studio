import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('starts with a UTF-8 BOM', () => {
    expect(toCsv([{ a: 'x' }]).startsWith('\uFEFF')).toBe(true)
  })
  it('quotes fields with comma/quote/newline and doubles quotes', () => {
    const out = toCsv([{ name: 'Іван, "Петренко"', note: 'a\nb', plain: 'ok' }])
    expect(out).toBe('\uFEFFname,note,plain\r\n"Іван, ""Петренко""","a\nb",ok\r\n')
  })
  it('renders null as an empty field and keeps numbers', () => {
    expect(toCsv([{ a: null, b: 5 }])).toBe('\uFEFFa,b\r\n,5\r\n')
  })
  it('neutralises spreadsheet formulas', () => {
    const out = toCsv([{ a: '=1+1', b: '@SUM(A1)', c: '-2+3', d: '+cmd|x' }])
    expect(out).toContain("'=1+1,'@SUM(A1),'-2+3,'+cmd|x")
  })
  it('leaves phone numbers alone', () => {
    expect(toCsv([{ p: '+380501234567' }])).toContain('\r\n+380501234567\r\n')
  })
  it('neutralises tab/CR-led values and quotes them', () => {
    expect(toCsv([{ a: '\t1' }])).toContain("\r\n'\t1\r\n")
    expect(toCsv([{ a: '\r1' }])).toContain('"\'\r1"')
  })
  it('does not touch negative numbers', () => {
    expect(toCsv([{ n: -3 }])).toContain('\r\n-3\r\n')
  })
  it('returns only the BOM for no rows', () => {
    expect(toCsv([])).toBe('\uFEFF')
  })
})

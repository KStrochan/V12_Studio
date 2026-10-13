import { describe, it, expect } from 'vitest'
import { normalizeUaPhone } from './phone'

describe('normalizeUaPhone', () => {
  it.each(['+380 67 123 45 67', '0671234567', '380671234567', '(067) 123-45-67'])('normalizes %s', (raw) => {
    expect(normalizeUaPhone(raw)).toBe('+380671234567')
  })
  it.each(['12345', '+48123456789', '067123456', ''])('rejects %s', (raw) => {
    expect(normalizeUaPhone(raw)).toBeNull()
  })
})

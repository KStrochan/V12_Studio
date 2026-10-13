import { describe, expect, it } from 'vitest'
import { isOwner } from './auth'

describe('isOwner', () => {
  it('true for role owner', () => expect(isOwner({ app_metadata: { role: 'owner' } })).toBe(true))
  it('false without role', () => {
    expect(isOwner({})).toBe(false)
    expect(isOwner({ app_metadata: {} })).toBe(false)
  })
  it('false for other roles', () => expect(isOwner({ app_metadata: { role: 'admin' } })).toBe(false))
  it('false for null/undefined', () => {
    expect(isOwner(null)).toBe(false)
    expect(isOwner(undefined)).toBe(false)
  })
})

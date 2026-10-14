import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FALLBACK_CONTENT } from '@/lib/content-fallback'
import { ICON_NAMES } from '@/lib/admin-schemas'
import { DEFAULT_SERVICE_ICON, getServiceIcon, serviceIcons } from './ServiceIcons'

describe('serviceIcons', () => {
  it('maps every fallback service icon key', () => {
    for (const s of FALLBACK_CONTENT.services) expect(serviceIcons[s.icon], s.icon).toBeTypeOf('function')
  })
  it('every mapped key is accepted by the admin schema', () => {
    for (const k of Object.keys(serviceIcons)) expect(ICON_NAMES).toContain(k)
  })
  it('falls back for unknown keys', () => {
    expect(getServiceIcon('nope')).toBe(DEFAULT_SERVICE_ICON)
    expect(getServiceIcon('wrench')).toBe(DEFAULT_SERVICE_ICON)
    expect(getServiceIcon('constructor')).toBe(DEFAULT_SERVICE_ICON)
    expect(getServiceIcon(undefined)).toBe(DEFAULT_SERVICE_ICON)
  })
  it('renders aria-hidden svg with currentColor and no fixed size', () => {
    for (const [k, Icon] of Object.entries(serviceIcons)) {
      const html = renderToStaticMarkup(createElement(Icon, { className: 'size-9' }))
      expect(html, k).toContain('aria-hidden="true"')
      expect(html, k).toContain('currentColor')
      expect(html, k).not.toMatch(/\swidth="\d/)
      expect(html, k).not.toMatch(/#[0-9a-fA-F]{3,6}/)
    }
  })
})

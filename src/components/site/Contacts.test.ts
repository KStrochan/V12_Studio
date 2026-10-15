import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ cacheLife: () => {}, cacheTag: () => {} }))

import { FALLBACK_CONTENT } from '@/lib/content-fallback'
import { Contacts } from './Contacts'

describe('Contacts', () => {
  const html = renderToStaticMarkup(createElement(Contacts, { settings: FALLBACK_CONTENT.settings }))
  it('embeds the map at exact coordinates', () => {
    expect(html).toContain('src="https://www.google.com/maps?q=49.2666809,23.8763218&amp;z=17&amp;output=embed"')
    expect(html).toContain('title="Мапа: V12 Service, Стрий"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain('referrerPolicy="no-referrer-when-downgrade"')
  })
  it('has a directions button opening in a new tab', () => {
    expect(html).toContain('href="https://www.google.com/maps/dir/?api=1&amp;destination=49.2666809,23.8763218"')
    expect(html).toContain('Побудувати маршрут')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('min-h-11')
  })
  it('shows the address text and a tel link', () => {
    expect(html).toContain('вулиця Клима Савури, 2б, Стрий, Львівська область, 82404')
    expect(html).toContain('href="tel:+380508280859"')
  })
})

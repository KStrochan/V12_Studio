import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Reviews } from './Reviews'

const label = 'Рейтинг 4,3 з 5 на основі 70 відгуків на Google'

describe('Reviews', () => {
  it('renders #reviews with the Google rating card and no empty state when there are no reviews', () => {
    const html = renderToStaticMarkup(createElement(Reviews, { reviews: [] }))
    expect(html).toContain('id="reviews"')
    expect(html).toContain('Google-рейтинг')
    expect(html).toContain('4,3')
    expect(html).toContain(`aria-label="${label}"`)
    expect(html).toContain('70 відгуків на Google Maps')
    expect(html).toContain('href="https://www.google.com/maps?cid=1261058270261688742"')
    expect(html).toContain('Читати відгуки на Google Maps')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('min-h-11')
    expect(html).toContain('width:86%')
    expect(html).not.toContain('<blockquote')
    expect(html).not.toContain('Скоро тут')
  })
  it('renders owner-added reviews below the rating card', () => {
    const html = renderToStaticMarkup(
      createElement(Reviews, { reviews: [{ id: '1', author: 'Іван', body: 'Добре', rating: 5 }] }),
    )
    expect(html).toContain('id="reviews"')
    expect(html).toContain('Google-рейтинг')
    expect(html).toContain('Добре')
    expect(html.indexOf('Google-рейтинг')).toBeLessThan(html.indexOf('Добре'))
    expect(html).not.toContain('Скоро тут')
  })
})

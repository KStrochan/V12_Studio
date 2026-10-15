import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Reviews } from './Reviews'

describe('Reviews', () => {
  it('always renders #reviews, with a neutral card when the list is empty', () => {
    const html = renderToStaticMarkup(createElement(Reviews, { reviews: [] }))
    expect(html).toContain('id="reviews"')
    expect(html).toContain('Скоро тут з’являться відгуки наших клієнтів')
    expect(html).not.toContain('<blockquote')
  })
  it('renders reviews when present', () => {
    const html = renderToStaticMarkup(
      createElement(Reviews, { reviews: [{ id: '1', author: 'Іван', body: 'Добре', rating: 5 }] }),
    )
    expect(html).toContain('id="reviews"')
    expect(html).toContain('Добре')
    expect(html).not.toContain('Скоро тут')
  })
})

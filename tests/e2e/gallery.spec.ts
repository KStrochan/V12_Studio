import { expect, test } from '@playwright/test'

test('gallery section and lightbox keyboard behaviour', async ({ page }) => {
  await page.goto('/')
  const gallery = page.locator('#gallery')
  await expect(gallery).toBeAttached()
  await gallery.scrollIntoViewIfNeeded()
  await expect(gallery.getByRole('heading', { name: 'Наш сервіс' })).toBeVisible()
  await expect(gallery).toContainText('не фотографії нашої майстерні')

  const thumbs = gallery.getByRole('button', { name: /^Відкрити фото/ })
  expect(await thumbs.count()).toBeGreaterThanOrEqual(6)

  const first = thumbs.nth(1)
  await first.scrollIntoViewIfNeeded()
  await first.click()
  const dialog = page.getByRole('dialog', { name: 'Перегляд фото' })
  await expect(dialog).toBeVisible()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')

  const caption = dialog.getByTestId('lightbox-caption')
  const before = await caption.textContent()
  await page.keyboard.press('ArrowRight')
  await expect(caption).not.toHaveText(before)
  await page.keyboard.press('ArrowLeft')
  await expect(caption).toHaveText(before)

  // focus trap: Tab never leaves the dialog
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab')
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true)

  for (const name of ['Закрити перегляд', 'Попереднє фото', 'Наступне фото']) {
    const box = await dialog.getByRole('button', { name }).boundingBox()
    expect(box!.width).toBeGreaterThanOrEqual(44)
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }

  await page.keyboard.press('ArrowRight') // now shows photo 3 -> focus should return to it on close
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
  await expect(thumbs.nth(2)).toBeFocused()
})

test('page has no horizontal overflow and banner CTA targets booking', async ({ page }) => {
  await page.goto('/')
  const w = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, i: window.innerWidth }))
  expect(w.s).toBeLessThanOrEqual(w.i)
  const cta = page.locator('section[aria-labelledby="banner-title"]').getByRole('link', { name: 'Записатися' })
  await expect(cta).toHaveAttribute('href', '#booking')
})

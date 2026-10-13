import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 375, height: 812 } })
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only suite')
})

test('home page fits a 375px phone and shows the CTA', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const overflow = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }))
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.inner)

  const cta = page.getByRole('link', { name: 'Записатися' }).first()
  await expect(cta).toBeVisible()
  const box = await cta.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test('server HTML does not hide content', async ({ request }) => {
  const html = await (await request.get('/')).text()
  expect(html).not.toMatch(/opacity:\s*0(?![.\d])/)
  expect(html).not.toContain('data-reveal="hidden"')
  expect(html).toContain('Записатися')
})

test('mobile menu is a full-height modal with focus management', async ({ page }) => {
  await page.goto('/')
  const toggle = page.locator('header button[aria-expanded]')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  const nav = page.getByRole('navigation', { name: 'Мобільне меню' })
  await expect(nav).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')

  const box = await nav.boundingBox()
  expect(Math.abs(box!.height - 812)).toBeLessThanOrEqual(2)

  // focus moved into the panel and Tab stays inside it
  expect(await page.evaluate(() => !!document.activeElement?.closest('nav[aria-label="Мобільне меню"]'))).toBe(true)
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab')
  expect(await page.evaluate(() => !!document.activeElement?.closest('nav[aria-label="Мобільне меню"]'))).toBe(true)
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')

  // Esc closes and returns focus
  await page.keyboard.press('Escape')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(nav).toBeHidden()
  await expect(toggle).toBeFocused()

  // backdrop and link-click closes also return focus
  await toggle.click()
  await page.mouse.click(20, 400)
  await expect(nav).toBeHidden()
  await expect(toggle).toBeFocused()
  await toggle.click()
  await nav.getByRole('link', { name: 'Послуги' }).click()
  await expect(nav).toBeHidden()
  await expect(toggle).toBeFocused()
})

import { expect, test, type Page } from '@playwright/test'

// Mobile layout regression: the wizard card must never be wider than the viewport
// (html overflow-x is clipped, so a document scrollWidth check is not enough).

const slotsFor = (date: string) => [
  { start: `${date}T07:00:00.000Z`, postNo: 1 },
  { start: `${date}T08:00:00.000Z`, postNo: 1 },
  { start: `${date}T09:00:00.000Z`, postNo: 2 },
  { start: `${date}T10:00:00.000Z`, postNo: 2 },
]

async function assertFits(page: Page, width: number, where: string) {
  const r = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="booking-card"]')!.getBoundingClientRect()
    const vis = (el: Element) => {
      const b = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
    }
    // day buttons inside the horizontal scroller are clipped by it on purpose; the scroller box itself is asserted below
    const controls = Array.from(document.querySelectorAll('#booking button, #booking a, #booking input, #booking select, #booking textarea'))
      .filter((el) => !el.closest('[data-testid="booking-days"], [aria-hidden="true"]'))
      .filter(vis)
      .map((el) => {
        const b = el.getBoundingClientRect()
        return { name: (el.textContent || el.getAttribute('name') || el.tagName).trim().slice(0, 30), left: b.left, right: b.right }
      })
    const strip = document.querySelector('[data-testid="booking-days"]')
    const sb = strip?.getBoundingClientRect()
    return {
      card: { left: card.left, right: card.right },
      controls,
      strip: strip && sb ? { left: sb.left, right: sb.right, sw: strip.scrollWidth, cw: strip.clientWidth } : null,
    }
  })
  expect(r.card.left, `${where}: card left`).toBeGreaterThanOrEqual(0)
  expect(r.card.right, `${where}: card right (${r.card.right} vs ${width})`).toBeLessThanOrEqual(width + 0.5)
  for (const c of r.controls) {
    expect(c.left, `${where}: "${c.name}" left`).toBeGreaterThanOrEqual(-0.5)
    expect(c.right, `${where}: "${c.name}" right`).toBeLessThanOrEqual(width + 0.5)
  }
  return r
}

for (const width of [320, 375, 414, 768]) {
  test(`booking layout fits the viewport at ${width}px (steps 1-3 and success)`, async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'sets its own viewport; run once')
    await page.setViewportSize({ width, height: 812 })
    await page.route('**/api/slots**', async (route) => {
      const date = new URL(route.request().url()).searchParams.get('date')!
      await route.fulfill({ status: 200, json: { slots: slotsFor(date) } })
    })
    await page.route('**/api/bookings', (route) => route.fulfill({ status: 201, json: { id: 'b-layout' } }))
    await page.goto('/')
    await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
    const section = page.locator('#booking')
    await section.scrollIntoViewIfNeeded()

    // step 1
    await section.getByRole('radio', { name: /Діагностика/ }).click()
    await assertFits(page, width, 'step 1')
    await page.screenshot({ path: `${process.env.SHOT_DIR ?? 'test-results'}/booking-step1-${width}.png` })

    // step 2
    await section.getByRole('button', { name: 'Далі' }).click()
    await expect(section.getByRole('heading', { name: /Дата й час/ })).toBeFocused()
    const days = section.locator('[role=radio][data-date]:not([disabled])')
    await days.first().click()
    await expect(section.getByRole('radiogroup', { name: 'Вільний час' })).toBeVisible()
    const r2 = await assertFits(page, width, 'step 2')
    expect(r2.strip, 'day strip present').not.toBeNull()
    expect(r2.strip!.sw, `strip scrollWidth ${r2.strip!.sw} > clientWidth ${r2.strip!.cw}`).toBeGreaterThan(r2.strip!.cw)
    expect(r2.strip!.left).toBeGreaterThanOrEqual(r2.card.left - 0.5)
    expect(r2.strip!.right).toBeLessThanOrEqual(r2.card.right + 0.5)
    await page.screenshot({ path: `${process.env.SHOT_DIR ?? 'test-results'}/booking-step2-${width}.png` })
    await section.getByRole('radiogroup', { name: 'Вільний час' }).getByRole('radio').nth(1).click()

    // step 3 with long content
    await section.getByRole('button', { name: 'Далі' }).click()
    const form = page.locator('#booking-form')
    await form.getByLabel("Ім'я").fill('Олександрович-Левицький Костянтин')
    await form.getByLabel('Телефон').fill('098 123 45 67')
    await form.getByLabel('Марка авто').fill('Мерседес-Бенц Максимілліан')
    await form.getByLabel('Модель').fill('Надзвичайнодовгамодельавто')
    await form.getByLabel('Рік випуску').selectOption('2015')
    await form.getByLabel(/Коментар/).fill('НадзвичайнодовгеслововукраїнськіймовіщобперевіритипереносрядківтеКоментар '.repeat(4))
    await assertFits(page, width, 'step 3')
    await page.screenshot({ path: `${process.env.SHOT_DIR ?? 'test-results'}/booking-step3-${width}.png` })

    // success
    await section.getByRole('button', { name: 'Надіслати запит' }).click()
    await expect(page.getByText('Запит надіслано, очікуйте підтвердження')).toBeVisible()
    await assertFits(page, width, 'success')
    await page.screenshot({ path: `${process.env.SHOT_DIR ?? 'test-results'}/booking-success-${width}.png` })
  })
}

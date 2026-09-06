import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home page has no axe-core violations at WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/')

  // Bring the in-view stages up before scanning so axe covers the demo
  // content and the controls beside it.
  for (const id of ['problem', 'grammar', 'voice', 'previews']) {
    await page.locator(`#${id} [data-demo]`).first().scrollIntoViewIfNeeded()
    await expect(page.locator(`#${id} .diffusion-text`).first()).toBeVisible({ timeout: 15_000 })
  }
  await page.locator('#open [data-demo]').first().scrollIntoViewIfNeeded()
  await expect(page.locator('#open [data-widget="weather"]')).toBeVisible({ timeout: 15_000 })

  // Every entrance fires once its block enters the viewport, and a block
  // caught mid-rise sits at partial opacity, which axe reads as low
  // contrast. Walk the page to the end so every entrance has fired, then
  // let the last transitions finish before the scan.
  // The page scrolls smoothly for people; the walk needs instant steps so
  // every block actually crosses the viewport where its observer can see it.
  const height = await page.evaluate(() => document.body.scrollHeight)
  const step = await page.evaluate(() => window.innerHeight * 0.6)
  for (let y = 0; y < height; y += step) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
    await page.waitForTimeout(200)
  }
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Array.from(document.querySelectorAll('.reveal[data-in="false"]')).map((el) => {
            const r = el.getBoundingClientRect()
            return `${el.closest('section')?.id ?? '?'} ${el.tagName.toLowerCase()} top=${Math.round(r.top + window.scrollY)} h=${Math.round(r.height)}`
          }),
        ),
      { timeout: 10_000 },
    )
    .toEqual([])
  await page.waitForTimeout(1500)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    // Pending and forming words are the pre-lock states inside an
    // aria-hidden span; the accessible text is the sr-only copy or the
    // role="status" region. Being illegible is the state, by design.
    .exclude('[data-state="pending"]')
    .exclude('[data-state="resolving"]')
    .exclude('.pointer-events-none[aria-hidden="true"]')
    .analyze()

  expect(results.violations).toEqual([])
})

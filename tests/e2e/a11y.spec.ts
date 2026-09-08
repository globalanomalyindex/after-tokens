import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home page has no axe-core violations at WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/')

  // Bring the stages up before scanning so axe covers the demo content and
  // the controls beside it. A stage mounts its surface at once; the replay
  // starts when it enters the viewport.
  for (const id of ['hook', 'contract', 'field', 'voice', 'previews', 'playground']) {
    await page.locator(`#${id} [data-demo]`).first().scrollIntoViewIfNeeded()
    await expect(page.locator(`#${id} .settle`).first()).toBeVisible({ timeout: 15_000 })
  }

  // Every entrance fires once its block enters the viewport, and a block
  // caught mid-rise sits at partial opacity, which axe reads as low
  // contrast. Walk the page to the end so every entrance has fired, then
  // let the last transitions finish before the scan.
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
    // The forming text and the field are aria-hidden by design: the forming
    // text is not yet a place to read and rests dim on purpose; the field is
    // state, not text. The status words carry their meaning.
    .exclude('.settle-forming')
    .exclude('.settle-carve')
    .exclude('.settle-field')
    .exclude('.pointer-events-none[aria-hidden="true"]')
    .analyze()

  expect(results.violations).toEqual([])
})

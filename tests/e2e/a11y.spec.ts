import AxeBuilder from '@axe-core/playwright'
import { expect, test } from './fixtures'

test('home page has no axe-core violations at WCAG 2.1 AA', async ({ page }) => {
  // the test walks the whole page with its stages playing before it scans,
  // which is more than the default budget on a slow runner
  test.setTimeout(90_000)
  await page.goto('/')

  // Bring the stages up before scanning so axe covers the demo content and
  // the controls beside it. A stage mounts its surface at once; the replay
  // starts when it enters the viewport.
  for (const id of ['hook', 'showcase', 'contract', 'field', 'voice', 'previews', 'concept', 'playground']) {
    await page.locator(`#${id} [data-demo]:visible`).first().scrollIntoViewIfNeeded()
    await expect(page.locator(`#${id} .settle:visible`).first()).toBeVisible({ timeout: 15_000 })
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
  // Freeze source clocks through their real controls before auditing resting
  // contrast. A source finishing during axe's multi-second scan can otherwise
  // legitimately put the terminal pill halfway through its exit. No text or
  // progress indicators are excluded from the contrast check.
  await page.getByRole('button', { name: /^pause /i }).evaluateAll(buttons => {
    for (const button of buttons) if (button instanceof HTMLButtonElement && !button.disabled) button.click()
  })
  await page.waitForTimeout(1500)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    // The field and legend are decorative status illustrations. Current
    // draft decoration is aria-hidden and generated from data attributes;
    // every committed ink span remains in the contrast audit.
    .exclude('.settle-legend')
    .exclude('.settle-field')
    .exclude('.pointer-events-none[aria-hidden="true"]')
    .analyze()

  expect(results.violations).toEqual([])
})

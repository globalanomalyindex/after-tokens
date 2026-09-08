import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home page has no axe-core violations at WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/')

  // Bring the stages up before scanning so axe covers the demo content and
  // the controls beside it. A stage mounts its surface at once; the replay
  // starts when it enters the viewport.
  for (const id of ['hook', 'contract', 'field', 'voice', 'previews', 'concept', 'playground']) {
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
    // The field is aria-hidden by design: state, not text, and the status
    // words carry its meaning. In the zone, a draft is the source's own
    // guess, drawn as a ghost on purpose and exempted as incidental,
    // provisional text: the answer never depends on it, the page and the
    // margin carry everything the contract promises, and a reader who
    // cannot see a ghost loses nothing that is promised. Every committed
    // letter in the zone (a piece, a written word, at every frame of its
    // snap) is held to the floor. The register legend's samples are
    // decorative illustrations of those same registers.
    .exclude('.settle-zone .settle-cz[data-state="draft"]')
    .exclude('.settle-legend')
    .exclude('.settle-field')
    .exclude('.pointer-events-none[aria-hidden="true"]')
    .analyze()

  expect(results.violations).toEqual([])
})

import { expect, test } from './fixtures'
import weather from '../../data/traces/compact/weather__random-b32.json'

test('the continuing sentence field refills during arrival and does not blink at cleanup', async ({ page }, testInfo) => {
  await page.goto(process.env.CONTINUITY_URL ?? '/')
  await expect(page.locator('footer[aria-label="colophon"]')).toContainText('cite as: Christopher Robin Fiore (2026).')
  await page.evaluate(() => document.fonts.ready)
  const stage = page.locator('#playground')
  await stage.getByRole('radiogroup', { name: 'sampler', exact: true }).getByRole('radio', { name: 'random · 4 blocks', exact: true }).click()
  await stage.getByRole('radiogroup', { name: 'Prompt', exact: true }).getByRole('radio', { name: weather.prompt, exact: true }).click()
  await stage.getByRole('radio', { name: 'recorded', exact: true }).click()
  const surface = stage.locator('.settle').first()
  await expect(surface).toHaveAttribute('data-policy', 'sentence')
  await surface.scrollIntoViewIfNeeded()
  await stage.getByRole('button', { name: 'replay the recording', exact: true }).click()
  const result = await surface.evaluate(async (root) => {
    const batches: { start: number; end: number | null; during: number; after: number; minimumOpacity: number; hidden: number }[] = []
    let previous: Element | null = null
    const started = performance.now()
    await new Promise<void>((resolve) => {
      const sample = () => {
        const now = performance.now()
        const transfer = root.querySelector('.bubble-transfer')
        if (root.getAttribute('data-status') === 'receiving' && transfer && transfer !== previous) {
          batches.push({ start: now, end: null, during: 0, after: 0, minimumOpacity: 1, hidden: 0 })
        }
        const batch = batches.at(-1)
        if (batch) {
          if (previous && !transfer) batch.end = now
          const lateArrival = transfer && now - batch.start >= 190 && now - batch.start <= 260
          const justFinished = !transfer && batch.end !== null && now - batch.end <= 100
          if (lateArrival || justFinished) {
            const ink = root.querySelector('.ambient-composition__bar[data-row="0"] .ambient-composition__ink')!
            const style = getComputedStyle(ink)
            batch.minimumOpacity = Math.min(batch.minimumOpacity, Number(style.opacity))
            if (style.visibility !== 'visible') batch.hidden++
            if (lateArrival) batch.during++
            else batch.after++
          }
        }
        previous = transfer
        if ((batches.length >= 2 && batch?.end !== null && now - batch!.end! > 110) || now - started > 12000) resolve()
        else requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })
    return { batches }
  })
  await testInfo.attach('sentence-continuity', { body: JSON.stringify(result, null, 2), contentType: 'application/json' })
  expect(result.batches).toHaveLength(2)
  for (const batch of result.batches) {
    expect(batch.during).toBeGreaterThan(0)
    expect(batch.after).toBeGreaterThan(0)
    expect(batch.hidden).toBe(0)
    expect(batch.minimumOpacity).toBeGreaterThanOrEqual(.199)
  }
})

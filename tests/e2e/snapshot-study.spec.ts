import { expect, test } from '@playwright/test'
import { SNAPSHOT_STUDY_ANSWER } from '../../lib/settle/snapshot-study'

test('revisable whole drafts can size the field without becoming a premature answer', async ({ page }) => {
  await page.goto('/')
  const study = page.locator('[data-snapshot-study]')
  await study.scrollIntoViewIfNeeded()
  const answer = study.locator('.settle[data-policy="answer"]')
  await answer.scrollIntoViewIfNeeded()
  const result = await study.evaluate(async (root, expected) => {
    const surface = root.querySelector<HTMLElement>('.settle')!
    const raw = root.querySelector('[data-snapshot-draft]')!
    const drafts = new Set<string>(), failures = new Set<string>()
    let nonfinalCorrectSamples = 0, largestRowCount = 0, visibleAt: number | null = null
    const started = performance.now()
    ;[...root.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'play example')!.click()
    await new Promise<void>((resolve, reject) => {
      const tick = () => {
        try {
          const now = performance.now(), status = surface.dataset.status
          const region = surface.querySelector('.settle-page')!
          if (status !== 'complete') {
            drafts.add(raw.textContent ?? '')
            if (region.textContent) failures.add('provisional words reached the protected answer')
            if (raw.textContent === expected) nonfinalCorrectSamples += 1
            largestRowCount = Math.max(largestRowCount, surface.querySelectorAll('.ambient-composition__bar[data-shown="true"]').length)
          } else if (surface.dataset.visualReady === 'true') {
            if (visibleAt === null) visibleAt = now
            if (region.textContent !== expected || getComputedStyle(region).visibility !== 'visible') failures.add('final answer was not exact and fully visible')
            if (now - visibleAt > 350) { resolve(); return }
          }
          if (now - started > 10000) { reject(Error('authored snapshot exercise did not finish')); return }
          requestAnimationFrame(tick)
        } catch (error) { reject(error) }
      }
      requestAnimationFrame(tick)
    })
    return { failures: [...failures], draftCount: drafts.size, nonfinalCorrectSamples, largestRowCount }
  }, SNAPSHOT_STUDY_ANSWER)
  expect(result.failures).toEqual([])
  expect(result.draftCount).toBeGreaterThanOrEqual(4)
  expect(result.nonfinalCorrectSamples).toBeGreaterThan(10)
  expect(result.largestRowCount).toBeGreaterThan(5)
  expect(result.largestRowCount).toBeLessThanOrEqual(14)
  await expect(answer.locator('.ambient-composition')).toHaveCount(0)
  await expect(answer.locator('.bubble-transfer, [data-pending], [data-arriving]')).toHaveCount(0)
  expect(await answer.locator('.settle-page').textContent()).toBe(SNAPSHOT_STUDY_ANSWER)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
})

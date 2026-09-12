import { expect, test, type Page, type Locator } from './fixtures'
import { SHOWCASE_ANSWER } from '../../lib/settle/showcase-replay'

async function placeStage(showcase: Locator) {
  // Stop any smooth page scroll before interacting. A toolbar can remain
  // visible while the actual comparison has crossed its offscreen gate.
  await showcase.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await expect(showcase.locator('.stage')).toBeInViewport({ ratio: .6 })
}

async function start(page: Page) {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const showcase = page.locator('[data-showcase]')
  await placeStage(showcase)
  await showcase.getByRole('button', { name: 'replay live comparison', exact: true }).click()
  await placeStage(showcase)
  return showcase
}

test('the upfront gallery shows the same-clock raw fragments beside a sentence answer, then both finish exactly', async ({ page }) => {
  test.setTimeout(25000)
  const showcase = await start(page)
  const answer = showcase.locator('.settle'), raw = showcase.locator('[data-showcase-prefix]')
  await expect(showcase.getByRole('radio', { name: 'Each sentence', exact: true })).toBeChecked()
  await expect(answer).toHaveAttribute('data-policy', 'sentence')
  await expect(answer).toHaveAttribute('data-ambient-condition', 'reshape')
  await expect(answer.getByRole('region', { name: 'After Tokens live answer' })).toBeAttached()
  await expect(answer.locator('.ambient-composition')).toBeVisible()
  await expect(raw).toBeVisible()
  await expect(raw.locator('mark')).toHaveText('bre')
  expect(await answer.locator('.settle-page').textContent()).toBe('')
  await expect(answer.locator('[data-passage]')).toHaveCount(1)
  expect(await answer.locator('.settle-page').textContent()).toBe('Start with a little room to breathe. ')
  expect(await raw.textContent()).toContain('Let a complete thought arrive')
  await expect(answer).toHaveAttribute('data-visual-ready', 'true', { timeout: 10000 })
  expect(await answer.locator('.settle-page').textContent()).toBe(SHOWCASE_ANSWER)
  expect(await raw.textContent()).toBe(SHOWCASE_ANSWER)
  expect(await showcase.evaluate((element) => {
    const surface = element.querySelector('.settle')!.getBoundingClientRect(), prefix = element.querySelector('[data-showcase-prefix]')!.getBoundingClientRect()
    return { layout: innerWidth > 640 ? prefix.left > surface.left && Math.abs(prefix.top - surface.top) < 2 : prefix.top > surface.bottom,
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), readableWidth: Math.min(surface.width, prefix.width) > 160 }
  })).toEqual({ layout: true, overflow: 0, readableWidth: true })
})

test('whole-answer selection, pause, offscreen resume and replay preserve one shared clock', async ({ page }) => {
  test.setTimeout(25000)
  const showcase = await start(page), answer = showcase.locator('.settle'), raw = showcase.locator('[data-showcase-prefix]')
  await showcase.getByRole('radio', { name: 'Whole answer', exact: true }).click()
  await placeStage(showcase)
  await expect(answer).toHaveAttribute('data-policy', 'answer')
  await expect(raw.locator('mark')).toHaveText('bre')
  await showcase.getByRole('button', { name: 'pause live comparison', exact: true }).click()
  await expect(showcase).toHaveAttribute('data-running', 'false')
  const paused = await showcase.getAttribute('data-elapsed-ms')
  await page.waitForTimeout(200)
  expect(await showcase.getAttribute('data-elapsed-ms')).toBe(paused)
  expect(await answer.locator('.settle-page').textContent()).toBe('')
  await showcase.getByRole('button', { name: 'resume live comparison', exact: true }).click()
  await expect(showcase).toHaveAttribute('data-running', 'true')
  await page.evaluate(() => scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
  await expect(showcase).toHaveAttribute('data-running', 'false')
  const offscreen = await showcase.getAttribute('data-elapsed-ms')
  await page.waitForTimeout(150)
  expect(await showcase.getAttribute('data-elapsed-ms')).toBe(offscreen)
  await placeStage(showcase)
  await expect(showcase).toHaveAttribute('data-running', 'true')
  await expect(answer).toHaveAttribute('data-visual-ready', 'true', { timeout: 12000 })
  expect(await answer.locator('.settle-page').textContent()).toBe(SHOWCASE_ANSWER)
  expect(await raw.textContent()).toBe(SHOWCASE_ANSWER)
  await showcase.getByRole('button', { name: 'replay live comparison', exact: true }).click()
  expect(Number(await showcase.getAttribute('data-elapsed-ms'))).toBeLessThan(600)
  expect(await answer.locator('.settle-page').textContent()).toBe('')
  await expect(raw.locator('mark')).toHaveText('bre')
})

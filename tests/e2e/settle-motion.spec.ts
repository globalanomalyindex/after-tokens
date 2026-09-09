import { expect, test, type Locator, type Page } from '@playwright/test'
import weather from '../../data/traces/compact/weather__random-b32.json'
import sky from '../../data/traces/compact/sky-blue__lowconf-b128.json'

async function startEarlierWords(page: Page): Promise<Locator> {
  await page.goto('/')
  const hook = page.locator('#playground')
  await hook.scrollIntoViewIfNeeded()
  await hook.getByRole('radiogroup', { name: 'sampler', exact: true }).getByRole('radio', { name: 'random · 4 blocks', exact: true }).click()
  await hook.getByRole('radiogroup', { name: 'Prompt', exact: true }).getByRole('radio', { name: weather.prompt, exact: true }).click()
  await hook.getByRole('radio', { name: 'each sentence', exact: true }).click()
  await hook.getByRole('radio', { name: 'source intervals', exact: true }).click()
  const surface = hook.locator('.settle').first()
  await surface.scrollIntoViewIfNeeded()
  await expect(surface.locator('.settle-unit').first()).toBeAttached()
  await page.evaluate(() => document.fonts.ready)
  await hook.getByRole('button', { name: 'replay the recording', exact: true }).click()
  return surface
}

test('real candidate changes preserve source-position nodes and committed ink stays readable', async ({ page }) => {
  const surface = await startEarlierWords(page)
  const observations = await surface.evaluate(async (root) => {
    const known = new Map<string, { el: Element; candidate: string }>()
    let changes = 0
    let inspectedInk = 0
    const failures: string[] = []
    const started = performance.now()
    await new Promise<void>((resolve) => {
      const tick = () => {
        for (const el of root.querySelectorAll<HTMLElement>('.settle-unit[data-pos]')) {
          const position = el.dataset.pos!
          const candidate = el.querySelector<HTMLElement>('.settle-draft')?.dataset.text ?? ''
          const old = known.get(position)
          if (old) {
            if (old.el !== el) failures.push(`source position ${position} remounted`)
            if (old.candidate && candidate && old.candidate !== candidate) changes += 1
          }
          known.set(position, { el, candidate })
        }
        for (const ink of root.querySelectorAll<HTMLElement>('.settle-ink')) {
          inspectedInk += 1
          const style = getComputedStyle(ink)
          if (style.filter !== 'none' || Number(style.opacity) < 0.99 || style.visibility !== 'visible') {
            failures.push(`committed ink hidden: ${ink.textContent}`)
          }
        }
        if (performance.now() - started < 5000) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
    return { changes, inspectedInk, failures }
  })
  expect(observations.changes).toBeGreaterThan(0)
  expect(observations.inspectedInk).toBeGreaterThan(0)
  expect(observations.failures).toEqual([])
})

test('pause and offscreen states suspend ambient activity without resetting its phase', async ({ page }) => {
  const surface = await startEarlierWords(page)
  const ambient = surface.locator('.settle-ambient').first()
  await expect(surface).toHaveAttribute('data-active', 'true')
  await expect(ambient).toBeAttached()
  const delay = await ambient.evaluate((el) => getComputedStyle(el).animationDelay)
  await page.locator('#playground').getByRole('button', { name: 'pause the replay', exact: true }).click()
  await expect(surface).toHaveAttribute('data-paused', 'true')
  await expect(surface).toHaveAttribute('data-active', 'false')
  await expect.poll(() => ambient.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused')
  const pausedText = await surface.locator('.settle-page').textContent()
  await page.waitForTimeout(150)
  expect(await surface.locator('.settle-page').textContent()).toBe(pausedText)
  expect(await ambient.evaluate((el) => getComputedStyle(el).animationDelay)).toBe(delay)
  await page.locator('#playground').getByRole('button', { name: 'resume the replay', exact: true }).click()
  await expect(surface).toHaveAttribute('data-active', 'true')
  await page.locator('#open').scrollIntoViewIfNeeded()
  await expect(surface).toHaveAttribute('data-active', 'false')
  const running = await surface.evaluate((root) => root.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').map((animation) => ({
    type: animation.constructor.name,
    target: (animation.effect as KeyframeEffect)?.target instanceof Element ? ((animation.effect as KeyframeEffect).target as Element).className : '',
  })))
  expect(running).toEqual([])
})

test('a finished real recording is exact, selectable and stationary', async ({ page }) => {
  test.setTimeout(60_000)
  const surface = await startEarlierWords(page)
  await expect(surface).toHaveAttribute('data-status', 'complete', { timeout: 45_000 })
  await expect(surface).toHaveAttribute('data-active', 'false')
  expect(await surface.locator('.settle-page').textContent()).toBe(weather.answer)
  const selected = await surface.locator('.settle-page').evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    const text = selection.toString()
    selection.removeAllRanges()
    return text
  })
  expect(selected).toBe(weather.answer)
  await page.waitForTimeout(450)
  const positions = () => surface.locator('.settle-ink').evaluateAll((elements) => elements.map((el) => {
    const rect = el.getClientRects()[0] ?? el.getBoundingClientRect()
    return [rect.left, rect.top]
  }))
  const before = await positions()
  expect(before.length).toBeGreaterThan(0)
  await page.waitForTimeout(250)
  expect(await positions()).toEqual(before)
  expect(await surface.evaluate((root) => root.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length)).toBe(0)
})

test('motion off cancels decoration while the recorded source keeps advancing', async ({ page }) => {
  const surface = await startEarlierWords(page)
  await page.locator('#playground').getByRole('button', { name: 'motion on', exact: true }).click()
  await expect(surface).toHaveAttribute('data-motion', 'off')
  await page.locator('#playground').getByRole('button', { name: 'motion off', exact: true }).focus()
  await page.keyboard.press('Space')
  await expect(surface).toHaveAttribute('data-motion', 'on')
  await page.keyboard.press('Space')
  await expect(surface).toHaveAttribute('data-motion', 'off')
  const before = await surface.locator('.settle-ink').count()
  await expect.poll(() => surface.locator('.settle-ink').count(), { timeout: 6000 }).toBeGreaterThan(before)
  expect(await surface.evaluate((root) => root.getAnimations({ subtree: true }).filter((animation) => animation.playState === 'running').length)).toBe(0)
})

test('the embedded phone preserves its answer width and exact final text', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  const previews = page.locator('#previews')
  const surface = previews.locator('.settle').nth(2)
  await surface.scrollIntoViewIfNeeded()
  await previews.getByRole('button', { name: 'Replay a phone, felt voice', exact: true }).click()
  const widths = await surface.evaluate(async (root) => {
    const values: number[] = []
    const started = performance.now()
    await new Promise<void>((resolve) => {
      const tick = () => {
        values.push(root.getBoundingClientRect().width)
        if (performance.now() - started < 3000) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })
    return values
  })
  expect(widths.length).toBeGreaterThan(2)
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1)
  await expect(surface).toHaveAttribute('data-status', 'complete', { timeout: 45_000 })
  await expect(surface).toHaveAttribute('data-visual-ready', 'true')
  await expect(surface.locator('.settle-answer-text')).toBeVisible()
  expect(await surface.locator('.settle-page').textContent()).toBe(sky.answer)
})

import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function start(page: import('@playwright/test').Page) {
  await page.goto('/')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Go to next slide', exact: true })).toBeEnabled()
  return page.locator('[data-case-study]')
}

test('scroll gestures, arrows and the index navigate one spacious example at a time', async ({ page, isMobile }) => {
  const deck = await start(page)
  const swipe = async () => page.locator('[aria-roledescription="slide"]').evaluate(el => {
    for (const [type, x] of [['touchstart', 300], ['touchend', 80]] as const) {
      const event = new Event(type, { bubbles: true })
      Object.defineProperty(event, type === 'touchstart' ? 'touches' : 'changedTouches', { value: [{ clientX: x, clientY: 150 }] })
      el.dispatchEvent(event)
    }
  })
  if (isMobile) await swipe()
  else { await page.mouse.move(220, 30); await page.mouse.wheel(0, 160) }
  await expect(deck).toHaveAttribute('data-slide', 'comparison')
  if (!isMobile) { await page.mouse.wheel(0, 100); await page.mouse.wheel(0, 80) }
  await expect(deck).toHaveAttribute('data-slide', 'comparison')
  const answer = deck.locator('[data-after-tokens-reply]'), baseline = deck.locator('[data-raw-reply]')
  await expect(answer.locator('[data-demo-progress]')).toHaveCount(1)
  await expect(baseline.locator('[data-demo-progress]')).toHaveCount(0)
  expect(await answer.evaluate(el => el === el.parentElement!.firstElementChild)).toBe(true)
  expect(await answer.locator('.settle-page').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(22)
  await page.waitForTimeout(700)
  if (isMobile) await swipe(); else await page.mouse.wheel(0, 180)
  await expect(deck).toHaveAttribute('data-slide', 'sentences')
  await page.keyboard.press('ArrowRight')
  await expect(deck).toHaveAttribute('data-slide', 'words')
  await expect(deck.getByLabel('The page takes', { exact: true })).toHaveValue('word')
  await deck.getByLabel('The page takes', { exact: true }).selectOption('paragraph')
  await expect(deck.locator('.settle')).toHaveAttribute('data-policy', 'paragraph')
  await expect(deck).toHaveAttribute('data-slide', 'words')
  await page.locator('button[aria-controls="chapter-index"]').click()
  await page.getByRole('navigation', { name: 'Case study chapters' }).getByRole('button', { name: /move the wait/ }).click()
  await expect(deck).toHaveAttribute('data-slide', 'stability')
  await page.getByRole('group', { name: 'Waiting motion', exact: true }).getByRole('button', { name: 'still', exact: true }).click()
  await expect(deck.locator('.settle')).toHaveAttribute('data-ambient-condition', 'static')
  await page.goBack()
  await expect(deck).toHaveAttribute('data-slide', 'words')
  await page.reload()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(deck).toHaveAttribute('data-slide', 'words')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
})

test('the full study stays available and reduced motion supports every chapter', async ({ page }) => {
  test.setTimeout(60000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const deck = page.locator('[data-case-study]')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(deck).toHaveAttribute('data-reduced-motion', 'true')
  await expect(page.getByRole('button', { name: 'Go to next slide', exact: true })).toBeEnabled()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (let i = 0; i < 12; i++) {
    if (i) await page.getByRole('button', { name: 'Go to next slide', exact: true }).click()
    await expect(deck.locator('[aria-roledescription="slide"]')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    const result = await new AxeBuilder({ page }).include('[data-case-study]').withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(result.violations).toEqual([])
  }
  await expect(page.getByRole('button', { name: 'Go to next slide', exact: true })).toBeDisabled()
  if (page.viewportSize()!.width <= 900) {
    await expect(page.getByRole('button', { name: 'Previous slide', exact: true })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Next slide', exact: true })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Go to previous slide', exact: true })).toBeVisible()
  }
  await page.getByRole('link', { name: 'View the full case study', exact: true }).click()
  await expect(page.locator('#evidence')).toBeAttached()
  await expect(page).toHaveURL(/view=reading/)
  await page.getByRole('button', { name: 'presentation', exact: false }).click()
  await expect(deck).toHaveAttribute('data-slide', 'research')
  expect(errors).toEqual([])
})

test('examples vary and brand voices cycle only after the answer, with a pause control', async ({ page }) => {
  test.setTimeout(45000)
  await page.goto('/#voices')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  const demo = page.locator('[data-presentation-demo]')
  await expect(demo).toHaveAttribute('data-voice', 'spectrum')
  await expect(demo).toHaveAttribute('data-example', 'delayed-middle')
  await expect(demo).toHaveAttribute('data-voice', 'after-tokens', { timeout: 15000 })
  await page.getByRole('button', { name: 'Pause brand cycle', exact: true }).click()
  await expect(demo).toHaveAttribute('data-cycling', 'false')
  await page.waitForTimeout(6500)
  await expect(demo).toHaveAttribute('data-voice', 'after-tokens')
  await page.getByRole('button', { name: 'spectrum', exact: true }).click()
  await expect(demo).toHaveAttribute('data-voice', 'spectrum')
  await page.getByRole('button', { name: 'Go to next slide', exact: true }).click()
  await expect(demo).toHaveAttribute('data-example', 'travel__lowconf-b32')
  await expect(page.locator('[data-raw-reply]')).toBeVisible()
  await expect(page.locator('[data-after-tokens-reply]')).not.toContainText('heron')
})

test('reply progress stays anchored while long answer text scrolls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#recording')
  await expect(page.locator('[data-case-study]')).toHaveAttribute('data-slide', 'recording')
  const reply = page.locator('[data-after-tokens-reply]')
  const pill = reply.locator('[data-demo-progress]')
  await expect(pill).toBeVisible()
  await expect.poll(() => pill.evaluate(el => getComputedStyle(el).backdropFilter || getComputedStyle(el).getPropertyValue('-webkit-backdrop-filter'))).toContain('blur(12px)')
  const margin = pill
  await reply.locator('[data-slide-scroll]').evaluate(el => {
    const spacer = document.createElement('div'); spacer.style.height = '1500px'; el.append(spacer)
  })
  await page.evaluate(() => document.fonts.ready)
  const before = await margin.boundingBox()
  await reply.locator('[data-slide-scroll]').evaluate(el => { el.scrollTop = 1200 })
  const after = await margin.boundingBox()
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(1)
  const box = await reply.boundingBox(), progress = await pill.boundingBox()
  expect(progress!.x + progress!.width).toBeLessThan(box!.x + box!.width)
  expect(progress!.y + progress!.height).toBeLessThan(box!.y + box!.height)
  expect(box!.y + box!.height - progress!.y - progress!.height).toBeLessThan(45)
  const scrollArea = await reply.locator('[data-slide-scroll]').boundingBox()
  expect(progress!.y).toBeGreaterThanOrEqual(scrollArea!.y)
  expect(progress!.y + progress!.height).toBeLessThanOrEqual(scrollArea!.y + scrollArea!.height + 1)
})

test('the intro keeps its off-black background and stays put until manual navigation', async ({ page }) => {
  await page.goto('/#comparison')
  const canvas = page.locator('[data-hero-canvas]')
  await expect(canvas).toHaveAttribute('data-presentation', 'fullscreen')
  const samples = await canvas.evaluate(element => new Promise<Array<{ phase: string; color: string }>>((resolve, reject) => {
    const frames: Array<{ phase: string; color: string }> = []
    const deadline = performance.now() + 18000
    function sample() {
      const phase = element.getAttribute('data-presentation') ?? ''
      frames.push({ phase, color: getComputedStyle(element).backgroundColor })
      if (phase === 'embedded') { resolve(frames); return }
      if (performance.now() > deadline) { reject(new Error('The opening did not finish docking')); return }
      requestAnimationFrame(sample)
    }
    sample()
  }))
  expect(samples.some(frame => frame.phase === 'docking')).toBe(true)
  expect(new Set(samples.map(frame => frame.color))).toEqual(new Set(['rgb(24, 22, 21)']))
  await page.waitForTimeout(700)
  await expect(page.locator('[data-case-study]')).toHaveAttribute('data-slide', 'opening')
  await page.getByRole('button', { name: 'Go to next slide', exact: true }).click()
  await expect(page.locator('[data-case-study]')).toHaveAttribute('data-slide', 'comparison')
})

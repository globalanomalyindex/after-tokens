import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const SITE = process.env.HERO_TEST_URL ?? '/'
const SEEN = 'after-tokens:intro-seen:v1'
const SENTENCES = [
  'It should feel like a thought taking shape.\n',
  'Complete sentences find their place while the rest keeps breathing.\n',
  'Each arrival has a little weight, then settles into something you can read.\n',
  'Welcome to After Tokens, a motion study of how generated words arrive.',
]

test('short narrow viewports keep the opening prompt within the reachable scroll area', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 620 })
  await page.goto(SITE)
  await expect(page.getByRole('dialog')).toBeVisible()
  const prompt = page.locator('[data-hero-typed]')
  await expect(prompt).toHaveText('What should diffusion text rendering look like?')
  await page.getByRole('button', { name: 'pause intro', exact: true }).click()
  const bounds = await prompt.evaluate((element) => {
    const bubble = element.parentElement!.parentElement!
    const conversation = bubble.parentElement!, scene = conversation.parentElement!
    return { promptTop: bubble.getBoundingClientRect().top, sceneTop: scene.getBoundingClientRect().top,
      scrollTop: scene.scrollTop, conversationHeight: conversation.getBoundingClientRect().height, sceneHeight: scene.clientHeight }
  })
  expect(bounds.conversationHeight).toBeGreaterThan(bounds.sceneHeight)
  expect(bounds.scrollTop).toBe(0)
  expect(bounds.promptTop).toBeGreaterThanOrEqual(bounds.sceneTop)
  await page.keyboard.press('Escape')
  expect(await page.evaluate(() => document.body.style.position)).toBe('')
})

test('a fresh cinematic opening fills the viewport, contains focus, and unlocks immediately with Skip or Escape', async ({ page }) => {
  await page.goto(SITE)
  const hero = page.locator('[data-hero-intro]')
  const dialog = page.getByRole('dialog', { name: 'After Tokens motion introduction' })
  await expect(dialog).toBeVisible()
  const viewport = page.viewportSize()!, bounds = await dialog.boundingBox()
  expect(bounds!.x).toBeCloseTo(0, 0); expect(bounds!.y).toBeCloseTo(0, 0)
  expect(bounds!.width).toBeCloseTo(viewport.width, 0); expect(bounds!.height).toBeCloseTo(viewport.height, 0)
  expect(await page.evaluate(() => document.body.style.position)).toBe('fixed')
  await dialog.getByRole('button', { name: 'pause intro', exact: true }).click()
  await page.waitForTimeout(80)
  const elapsed = await hero.getAttribute('data-elapsed-ms')
  await page.waitForTimeout(180)
  expect(await hero.getAttribute('data-elapsed-ms')).toBe(elapsed)
  const skip = dialog.getByRole('button', { name: 'skip to case study' })
  await skip.focus(); await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'resume intro' })).toBeFocused()
  await page.keyboard.press('Shift+Tab'); await expect(skip).toBeFocused()
  const accessibility = await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(accessibility.violations).toEqual([])
  await skip.click()
  await expect(dialog).toHaveCount(0)
  await expect(hero).toHaveAttribute('data-presentation', 'embedded')
  expect(await page.evaluate(() => document.body.style.position)).toBe('')
  expect(await hero.locator('.settle-page').textContent()).toBe(SENTENCES.join(''))
  await page.evaluate((key) => sessionStorage.removeItem(key), SEEN)
  await page.reload()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await page.evaluate(() => document.body.style.position)).toBe('')
})

test('four distinct sentence batches use the shared handover before the same stage docks and scrolling resumes', async ({ page }) => {
  test.setTimeout(25000)
  await page.goto(SITE)
  const hero = page.locator('[data-hero-intro]')
  const stage = hero.locator('[data-hero-canvas]')
  await expect(page.getByRole('dialog')).toBeVisible()
  await stage.evaluate((element) => { element.setAttribute('data-original-stage', 'true') })
  const pill = hero.locator('[data-hero-progress]')
  await expect(pill).toBeVisible({ timeout: 5000 })
  expect(await pill.evaluate(element => {
    const reply = element.closest('[data-static]')!
    const answer = reply.querySelector('.settle-page')!
    return getComputedStyle(element).fontFamily === getComputedStyle(answer).fontFamily
  })).toBe(true)
  const passages = hero.locator('[data-passage]')
  for (let count = 1; count <= 4; count++) {
    await expect(passages).toHaveCount(count, { timeout: count === 1 ? 7500 : 2500 })
    expect(await passages.last().textContent()).toBe(SENTENCES[count - 1])
    if (count > 1) await expect(passages.first()).not.toHaveAttribute('data-arriving', 'true')
  }
  await expect(hero.locator('.settle')).toHaveAttribute('data-status', 'complete')
  const progress = hero.locator('[data-hero-progress]')
  await expect(progress).toHaveText('100%')
  await expect.poll(() => progress.evaluate(element => Number(getComputedStyle(element).opacity))).toBe(0)
  await expect(hero).toHaveAttribute('data-presentation', 'docking', { timeout: 3000 })
  const during = await stage.boundingBox()
  expect(during!.width).toBeGreaterThan(0)
  await expect(hero).toHaveAttribute('data-presentation', 'embedded', { timeout: 1600 })
  await expect(stage).toHaveAttribute('data-original-stage', 'true')
  expect(await hero.locator('.settle-page').textContent()).toBe(SENTENCES.join(''))
  expect(await page.evaluate(() => ({ locked: document.body.style.position, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth) }))).toEqual({ locked: '', overflow: 0 })
  await page.evaluate(() => scrollTo({ top: 500, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100)
  await hero.getByRole('button', { name: 'replay intro' }).click()
  await expect(hero).toHaveAttribute('data-presentation', 'embedded')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('returning visits and repeated reloads replay the fullscreen animation', async ({ page }) => {
  await page.addInitScript((key) => sessionStorage.setItem(key, '1'), SEEN)
  await page.goto(SITE)
  for (let visit = 0; visit < 3; visit++) {
    if (visit) await page.reload()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('[data-hero-typed]')).not.toHaveText('')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
})

test('hash-linked and scrolled reloads still show the opening', async ({ page }) => {
  await page.goto(`${SITE}#field`)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.locator('#field').evaluate(element => element.scrollIntoView({ behavior: 'instant' }))
  await page.reload()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  expect(await page.evaluate(() => document.body.style.position)).toBe('')
})

test('reduced motion is immediately complete and leaves the page unlocked', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(SITE)
  const hero = page.locator('[data-hero-intro]')
  await expect(hero).toHaveAttribute('data-presentation', 'embedded')
  await expect(hero.locator('.settle')).toHaveAttribute('data-motion', 'off')
  expect(await hero.locator('.settle-page').textContent()).toBe(SENTENCES.join(''))
  expect(await page.evaluate(() => document.body.style.position)).toBe('')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.waitForTimeout(300)
  await expect(hero).toHaveAttribute('data-elapsed-ms', '0')
})

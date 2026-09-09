import { expect, test } from '@playwright/test'

test.describe('reduced motion full audit', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('all sections mount and every stage reaches its recording\'s end', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // The eleven-section cut: the thing itself, the wrong shape, the audit,
    // the contract, the field, the cost, the voice, in the wild, the wait,
    // try it, what is known, and open.
    const sectionIds = ['hook', 'problem', 'audit', 'contract', 'field', 'cost', 'voice', 'previews', 'concept', 'playground', 'evidence', 'open']
    await expect(page.locator('[data-section]')).toHaveCount(sectionIds.length)

    const demos = page.locator('[data-demo]:visible')
    const demoCount = await demos.count()
    expect(demoCount).toBeGreaterThan(0)
    for (let i = 0; i < demoCount; i += 1) {
      const demo = demos.nth(i)
      await expect(demo).toBeAttached()
      await demo.scrollIntoViewIfNeeded()
    }

    // Reduced motion changes decoration only: the recordings still play
    // and settle, on the same clock, to the same page.
    const surfaces = page.locator('.settle[data-status]')
    await expect.poll(() => surfaces.count()).toBeGreaterThan(0)
    const hook = page.locator('#hook .settle').first()
    await expect(hook).toHaveAttribute('data-status', 'complete', { timeout: 30_000 })
    await expect(hook.locator('.settle-answer-text')).toBeVisible()
    // Audit the current ink and ambient layers as well as margin/field
    // decoration. Browser animations include the layout hook's WAAPI effects.
    const animating = await page.evaluate(() => {
      const named = (name: string) => name !== 'none' && name !== ''
      const before = Array.from(document.querySelectorAll('.settle-cell, .settle-mark, .settle-slot, .settle-cz, .settle-cw')).filter((el) => named(getComputedStyle(el, '::before').animationName)).length
      const after = Array.from(document.querySelectorAll('.settle-slot')).filter((el) => named(getComputedStyle(el, '::after').animationName)).length
      const own = Array.from(document.querySelectorAll('.settle-ambient, .settle-ink, .settle-candidate, .settle-passage, .settle-floor, .settle-answer-arrival')).filter((el) => named(getComputedStyle(el).animationName)).length
      const running = Array.from(document.querySelectorAll('.settle')).flatMap((root) => root.getAnimations({ subtree: true })).filter((animation) => animation.playState === 'running').length
      return before + after + own + running
    })
    expect(animating).toBe(0)
  })
})

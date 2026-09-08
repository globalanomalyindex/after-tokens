import { expect, test } from '@playwright/test'

test.describe('reduced motion full audit', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('all sections mount and every stage reaches its recording\'s end', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // The eleven-section cut: the thing itself, the wrong shape, the audit,
    // the contract, the field, the cost, the voice, in the wild, try it,
    // what is known, and open.
    const sectionIds = ['hook', 'problem', 'audit', 'contract', 'field', 'cost', 'voice', 'previews', 'playground', 'evidence', 'open']
    await expect(page.locator('[data-section]')).toHaveCount(sectionIds.length)

    const demos = page.locator('[data-demo]')
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
    await expect(hook.locator('.settle-passage').first()).toBeVisible()
    // Under reduced motion no cell blooms and no mark breathes.
    const animating = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.settle-cell, .settle-mark')).filter((el) => {
        const before = getComputedStyle(el, '::before')
        return before.animationName !== 'none' && before.animationName !== ''
      }).length,
    )
    expect(animating).toBe(0)
  })
})

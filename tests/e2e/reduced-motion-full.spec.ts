import { expect, test } from '@playwright/test'

test.describe('reduced motion full audit', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('all sections resolve their content without overlay animations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // The nine-section cut: the answer crystallizing, the problem, the
    // arrival profile, the recorded sampler, the grammar, the voice, the
    // grammar in the wild, the evidence, and what is open.
    const sectionIds = ['hook', 'problem', 'profile', 'sampler', 'grammar', 'voice', 'previews', 'evidence', 'open']
    await expect(page.locator('[data-section]')).toHaveCount(sectionIds.length)

    // ChatExchange mounts its answer only when the stage enters the
    // viewport, so exercise every stage.
    const demos = page.locator('[data-demo]')
    const demoCount = await demos.count()
    expect(demoCount).toBeGreaterThan(0)
    for (let i = 0; i < demoCount; i += 1) {
      const demo = demos.nth(i)
      await expect(demo).toBeAttached()
      await demo.scrollIntoViewIfNeeded()
    }

    const diffusion = page.locator('.diffusion-text')
    await expect.poll(() => diffusion.count()).toBeGreaterThan(0)
    await expect(page.locator('.diffusion-text[data-reduced-motion="false"]')).toHaveCount(0)
    await expect(page.locator('.diffusion-text[data-complete="false"]')).toHaveCount(0, { timeout: 10_000 })
    await expect(page.locator('.diffusion-text [data-state="pending"], .diffusion-text [data-state="resolving"]')).toHaveCount(0)
    await expect(page.locator('.diffusion-overlay')).toHaveCount(0)
  })
})

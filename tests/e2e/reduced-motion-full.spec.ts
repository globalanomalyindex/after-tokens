import { expect, test } from '@playwright/test'

test.describe('reduced motion full audit', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('all sections resolve their content without overlay animations', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // 11-section cut: the old 'assumptions' beat folded into 'primer', the
    // old 'fog' + 'aurora' sections folded into 'mycelium' (one engine, many
    // naturals), and 'trajectories' adds the observed beat: sixty recorded
    // denoising trajectories from a real masked diffusion model, replayed
    // rather than authored.
    const sectionIds = [
      'hook',
      'primer',
      'trajectories',
      'thesis',
      'mycelium',
      'coda',
      'widget',
      'brand-variations',
      'styles',
      'playground',
      'close',
    ]
    await expect(page.locator('[data-section]')).toHaveCount(sectionIds.length)

    // ChatExchange intentionally mounts its answer only when the individual
    // demo enters the viewport. Exercise every stage, not just each (sometimes
    // very tall) parent section, so the audit covers all four mode demos, the
    // intent mapper, the widget, and the playground.
    const demos = page.locator('[data-demo]')
    const demoCount = await demos.count()
    expect(demoCount).toBeGreaterThan(0)
    for (let i = 0; i < demoCount; i += 1) {
      const demo = demos.nth(i)
      await expect(demo).toBeAttached()
      await demo.scrollIntoViewIfNeeded()
    }

    // The brand specimens mount their diffusion copy as one in-view group.
    await page.locator('#brand-variations').scrollIntoViewIfNeeded()
    await expect(page.locator('#brand-variations .tile-enter[data-in-view="true"]')).toHaveCount(4)

    const diffusion = page.locator('.diffusion-text')
    await expect.poll(() => diffusion.count()).toBeGreaterThan(0)
    await expect(page.locator('.diffusion-text[data-reduced-motion="false"]')).toHaveCount(0)
    await expect(page.locator('.diffusion-text[data-complete="false"]')).toHaveCount(0, { timeout: 10_000 })
    await expect(page.locator('.diffusion-text [data-state="pending"], .diffusion-text [data-state="resolving"]')).toHaveCount(0)
    await expect(page.locator('.diffusion-overlay')).toHaveCount(0)
  })
})

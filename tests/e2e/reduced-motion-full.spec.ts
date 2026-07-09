import { expect, test } from '@playwright/test'

test.describe('reduced motion full audit', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('all sections resolve their content without overlay animations', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-intro]')).toHaveCount(0)
    // 10-section cut: the old 'assumptions' beat folded into 'primer', and the
    // old 'fog' + 'aurora' sections folded into 'mycelium' (one engine, many naturals).
    const sectionIds = [
      'hook',
      'primer',
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
    for (const id of sectionIds) {
      const section = page.locator(`#${id}`)
      await expect(section).toBeAttached()
      await section.scrollIntoViewIfNeeded()
      const words = page.locator(`#${id} .diffusion-text [data-state]`)
      if (id !== 'hook' && id !== 'close') {
        await expect.poll(() => words.count(), { message: `section ${id} should render diffusion words` }).toBeGreaterThan(0)
        await expect(page.locator(`#${id} .diffusion-text [data-state="pending"], #${id} .diffusion-text [data-state="resolving"]`)).toHaveCount(0)
      }
    }
  })
})

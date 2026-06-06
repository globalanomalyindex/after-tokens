import { expect, test } from '@playwright/test'

test.describe('reduced motion full audit', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('all sections resolve their content without overlay animations', async ({ page }) => {
    await page.goto('/')
    // 10-section cut: the old 'assumptions' beat folded into 'primer', and the
    // old 'fog' + 'aurora' sections folded into 'mycelium' (one engine, many naturals).
    const sectionIds = [
      'hook',
      'primer',
      'thesis',
      'mycelium',
      'brand-variations',
      'coda',
      'widget',
      'styles',
      'playground',
      'close',
    ]
    for (const id of sectionIds) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      const resolvedWords = page.locator(`#${id} [data-state="resolved"]`)
      const count = await resolvedWords.count()
      if (id !== 'hook' && id !== 'close') {
        expect(count, `section ${id} should have resolved words`).toBeGreaterThan(0)
      }
    }
  })
})

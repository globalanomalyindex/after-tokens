import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home page has no axe-core violations at WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/')

  // Trigger lazy/in-view specimens before scanning so axe covers the actual
  // demo content rather than only the first-screen placeholders.
  await page.locator('#coda').scrollIntoViewIfNeeded()
  await expect(page.locator('#coda .diffusion-text')).toBeVisible()
  await page.locator('#widget [data-demo]').scrollIntoViewIfNeeded()
  await expect(page.locator('#widget [data-widget="weather"]')).toBeVisible()
  await page.locator('#brand-variations').scrollIntoViewIfNeeded()
  await expect(page.locator('#brand-variations .tile-enter[data-in-view="true"]')).toHaveCount(4)
  await page.locator('#playground').scrollIntoViewIfNeeded()
  await expect(page.locator('#playground .diffusion-text')).toBeVisible()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    // Exclude known-decorative elements that are correctly aria-hidden:
    // 1. Section numerals: large faint architectural numbers (opacity:0.05, aria-hidden)
    // 2. Pending/resolving diffusion words: pre-animation state (opacity:0.1, inside aria-hidden span)
    //    The accessible text is in a role="status" aria-live region — these are visual only.
    // 3. Registration crosshairs: decorative print-registration marks (aria-hidden)
    // 4. Comparison stimulus words: the A/B panels hold their words blurred at a
    //    shared opacity floor for most of the timeline. Being unreadable is the
    //    stimulus, not an oversight, and the readable equivalent is the caption
    //    beside the demo. The floor is documented in the thesis section as a
    //    tuned value, so it is deliberately not bent to satisfy this check.
    .exclude('[data-corner]')
    .exclude('[data-state="pending"]')
    .exclude('[data-state="resolving"]')
    .exclude('[data-stimulus-word]')
    .exclude('.pointer-events-none[aria-hidden="true"]')
    .analyze()

  expect(results.violations).toEqual([])
})

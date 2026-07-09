import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home page has no axe-core violations at WCAG 2.1 AA', async ({ page }) => {
  await page.goto('/')
  const intro = page.getByRole('dialog', { name: 'After Tokens introduction' })
  await expect(intro).toBeVisible()
  await page.getByRole('button', { name: 'skip' }).click()
  await expect(intro).toBeHidden({ timeout: 3_000 })

  // Trigger lazy/in-view specimens before scanning so axe covers the actual
  // demo content rather than only the first-screen placeholders.
  await page.locator('#coda').scrollIntoViewIfNeeded()
  await expect(page.locator('#coda .diffusion-text')).toBeVisible()
  await page.locator('#widget').scrollIntoViewIfNeeded()
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
    .exclude('[data-corner]')
    .exclude('[data-state="pending"]')
    .exclude('[data-state="resolving"]')
    .exclude('.pointer-events-none[aria-hidden="true"]')
    .analyze()

  expect(results.violations).toEqual([])
})

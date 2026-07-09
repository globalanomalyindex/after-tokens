import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('the cinematic intro behaves as an accessible modal', async ({ page }) => {
  await page.goto('/')

  const dialog = page.getByRole('dialog', { name: 'After Tokens introduction' })
  const skip = page.getByRole('button', { name: 'skip' })
  await expect(dialog).toBeVisible()
  await expect(skip).toBeFocused()
  await expect(page.locator('#primer')).toHaveAttribute('aria-hidden', 'true')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze()
  expect(results.violations).toEqual([])

  await page.keyboard.press('Tab')
  await expect(skip).toBeFocused()

  await skip.click()
  await expect(dialog).toBeHidden({ timeout: 3_000 })
  await expect(page.locator('#primer')).not.toHaveAttribute('aria-hidden', 'true')
  await expect(page.locator('html')).not.toHaveClass(/intro-lock/)
})

import { expect, test as base } from '@playwright/test'

export { expect, type Locator, type Page } from '@playwright/test'

// These tests exercise the case study after explicitly skipping its opening.
// Dedicated hero tests cover the unmodified navigation and reload behavior.
export const test = base.extend({
  page: async ({ page }, provide) => {
    const navigate = page.goto.bind(page)
    page.goto = async (...args: Parameters<typeof page.goto>) => {
      const [destination, options] = args
      const url = new URL(destination, 'http://localhost:3000')
      url.searchParams.set('view', 'reading')
      const response = await navigate(url.href, options)
      await expect(page.locator('[data-hero-intro]')).toHaveAttribute('data-presentation', /^(fullscreen|embedded|docking)$/)
      const skip = page.getByRole('button', { name: 'skip to case study' })
      if (await skip.isVisible()) await skip.click()
      return response
    }
    await provide(page)
  },
})

import { test as base } from '@playwright/test'

export { expect, type Locator, type Page } from '@playwright/test'

// Policy and motion tests exercise the case study as a returning visitor.
// Dedicated hero tests keep fresh storage to cover the fullscreen opening.
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => sessionStorage.setItem('after-tokens:intro-seen:v1', '1'))
    await provide(page)
  },
})

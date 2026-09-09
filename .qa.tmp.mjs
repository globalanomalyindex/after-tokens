import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
const [out, url, selector, frames, gapMs] = [process.argv[2], process.argv[3], process.argv[4], Number(process.argv[5] || 6), Number(process.argv[6] || 1200)]
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1380, height: 900 }, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const stage = page.locator(selector).first()
await stage.scrollIntoViewIfNeeded()
await page.waitForTimeout(300)
const replay = stage.getByRole('button', { name: /replay the recording/ })
if (await replay.count()) await replay.click()
await page.waitForTimeout(150)
for (let i = 0; i < frames; i += 1) { await stage.screenshot({ path: `${out}/f${String(i).padStart(2, '0')}.png` }); await page.waitForTimeout(gapMs) }
await browser.close()

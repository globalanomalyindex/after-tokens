import { chromium } from '@playwright/test'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1380, height: 900 } })
await page.goto(process.argv[2], { waitUntil: 'networkidle' })
const stage = page.locator('#hook [data-demo]').first()
await stage.scrollIntoViewIfNeeded()
const replay = stage.getByRole('button', { name: /replay the recording/ })
if (await replay.count()) await replay.click()
const out = await page.evaluate(async () => {
  const root = document.querySelector('#hook .settle')
  const zone = root.querySelector('.settle-zone')
  const legible = '.settle-cw, .settle-cz[data-state="piece"], .settle-cz[data-state="draft"]'
  let prev = new Map()
  const perFrame = []
  const t0 = performance.now()
  await new Promise((done) => {
    const tick = () => {
      const o = root.getBoundingClientRect()
      const now = new Map()
      for (const el of zone.querySelectorAll(legible)) {
        const r = el.getBoundingClientRect()
        now.set(Number(el.dataset.pos), [r.left - o.left, r.top - o.top])
      }
      let sum = 0, n = 0
      for (const [p, [x, y]] of now) { const b = prev.get(p); if (!b) continue; sum += Math.abs(x - b[0]) + Math.abs(y - b[1]); n++ }
      if (n) perFrame.push(sum / n)
      prev = now
      if (performance.now() - t0 < 9000) requestAnimationFrame(tick); else done()
    }
    requestAnimationFrame(tick)
  })
  perFrame.sort((a, b) => a - b)
  const q = (f) => Math.round((perFrame[Math.floor(f * (perFrame.length - 1))] || 0) * 10) / 10
  return { frames: perFrame.length, meanPx: Math.round((perFrame.reduce((a, b) => a + b, 0) / Math.max(1, perFrame.length)) * 100) / 100, p90: q(0.9), p99: q(0.99), maxPx: q(1) }
})
console.log(JSON.stringify(out))
await browser.close()

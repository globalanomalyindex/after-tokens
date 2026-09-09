import { chromium, webkit } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

// A browser-emulated geometry audit, not an iPhone performance benchmark.
// Compare the same browser, viewport, source clock and surface across revisions.
// Displacements are measured for matched source positions, never averaged by frame.
const [url = 'http://localhost:3000', output = '/tmp/settle-motion.json'] = process.argv.slice(2)
const browserName = process.env.MOTION_BROWSER === 'webkit' ? 'webkit' : 'chromium'
const durationMs = Number(process.env.MOTION_DURATION_MS ?? 18000)
if (!Number.isFinite(durationMs) || durationMs <= 0) throw new RangeError('MOTION_DURATION_MS must be positive')
const browser = await (browserName === 'webkit' ? webkit : chromium).launch()
const cases = [
  { name: 'desktop-hook', viewport: { width: 1380, height: 900 }, section: '#hook', index: 0 },
  { name: 'narrow-hook', viewport: { width: 390, height: 844 }, section: '#hook', index: 0 },
  { name: 'embedded-phone', viewport: { width: 1380, height: 900 }, section: '#previews', index: 2 },
  { name: 'narrow-concept-phone', viewport: { width: 390, height: 844 }, section: '#concept', index: 0 },
]
const selected = process.env.MOTION_CASE ? cases.filter((entry) => entry.name === process.env.MOTION_CASE) : cases
const results = []
try {
  for (const entry of selected) {
    const page = await browser.newPage({ viewport: entry.viewport, reducedMotion: 'no-preference' })
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const surface = page.locator(`${entry.section} .settle`).nth(entry.index)
    await surface.scrollIntoViewIfNeeded()
    await surface.waitFor({ state: 'visible' })
    // Allow section entrance/scroll to finish before measuring local geometry.
    await page.waitForTimeout(650)
    const section = page.locator(entry.section)
    const replay = entry.section === '#previews'
      ? section.getByRole('button', { name: 'Replay a phone, felt voice', exact: true })
      : section.getByRole('button', { name: /replay the recording|replay/i }).last()
    if (await replay.count()) await replay.click()
    const result = await surface.evaluate(async (root, duration) => {
      const frames = []
      let previous = new Map()
      const released = new Map()
      let previousGlyphs = new Map()
      const observed = new WeakMap()
      let serial = 0
      const identity = (el) => {
        if (!observed.has(el)) observed.set(el, ++serial)
        return observed.get(el)
      }
      const began = performance.now()
      let previousAt = began
      await new Promise((resolve) => {
        const tick = (now) => {
          const origin = root.getBoundingClientRect()
          const current = new Map()
          const moves = []
          const glyphMoves = []
          const remounts = []
          const unreadable = []
          for (const el of root.querySelectorAll('.settle-zone [data-pos], .settle-unit[data-pos]')) {
            if (!['word', 'piece', 'draft'].includes(el.dataset.state ?? '')) continue
            const content = el.querySelector('.settle-ink, .settle-candidate') ?? el
            const rect = content.getClientRects()[0] ?? content.getBoundingClientRect()
            if (!rect.width || !rect.height) continue
            const value = { x: rect.left - origin.left, y: rect.top - origin.top, id: identity(el), state: el.dataset.state, text: el.textContent }
            const position = el.dataset.pos
            current.set(position, value)
            const before = previous.get(position)
            if (before) {
              const dx = value.x - before.x
              const dy = value.y - before.y
              moves.push({ position, dx, dy, distance: Math.hypot(dx, dy), lineChange: Math.abs(dy) > rect.height * 0.5 })
              if (value.id !== before.id) remounts.push({ position, before: before.state, after: value.state })
            }
            if (value.state === 'word' || value.state === 'piece') {
              const layers = [el, ...el.querySelectorAll('.settle-cz-text:not([data-past]), .settle-l, .settle-ink')]
              if (layers.some((layer) => {
                const style = getComputedStyle(layer)
                const blur = /blur\(([\d.]+)px\)/.exec(style.filter)
                return Number(style.opacity) < 0.99 || (blur && Number(blur[1]) > 0.2)
              })) unreadable.push(position)
            }
          }
          const releasedMoves = []
          for (const el of root.querySelectorAll('.settle-passage .settle-w, .settle-ink[data-released="true"]')) {
            const id = identity(el)
            const rect = el.getClientRects()[0] ?? el.getBoundingClientRect()
            const value = { x: rect.left - origin.left, y: rect.top - origin.top }
            const before = released.get(id)
            if (before) releasedMoves.push(Math.hypot(value.x - before.x, value.y - before.y))
            released.set(id, value)
          }
          const glyphs = new Map()
          const glyphElements = root.querySelectorAll('.settle-ink[data-layout], .settle-cw, .settle-cz[data-state="piece"], .settle-passage .settle-w')
          for (const el of glyphElements) {
            const textRoot = el.querySelector('.settle-cz-text:not([data-past])') ?? el
            const walker = document.createTreeWalker(textRoot, NodeFilter.SHOW_TEXT)
            let node = walker.nextNode()
            while (node && !/\S/.test(node.textContent ?? '')) node = walker.nextNode()
            if (!node) continue
            const offset = (node.textContent ?? '').search(/\S/)
            const range = document.createRange()
            range.setStart(node, offset)
            range.setEnd(node, offset + 1)
            const rect = range.getBoundingClientRect()
            const key = el.dataset.layout ?? (el.dataset.pos ? `${el.dataset.pos}:0` : `passage:${identity(el)}`)
            const value = { x: rect.left - origin.left, y: rect.top - origin.top, text: textRoot.textContent, released: el.dataset.released === 'true' || Boolean(el.closest('.settle-passage')) }
            const before = previousGlyphs.get(key)
            if (before && before.text === value.text) glyphMoves.push({ key, distance: Math.hypot(value.x - before.x, value.y - before.y), released: before.released && value.released })
            glyphs.set(key, value)
          }
          frames.push({ atMs: Math.max(0, now - began), gapMs: Math.max(0, now - previousAt), status: root.dataset.status, moves, glyphMoves, remounts, unreadable, releasedMoves })
          previousAt = now
          previous = current
          previousGlyphs = glyphs
          if (now - began < duration) requestAnimationFrame(tick)
          else resolve()
        }
        requestAnimationFrame(tick)
      })
      const values = frames.flatMap((frame) => frame.moves.map((move) => move.distance)).sort((a, b) => a - b)
      const glyphValues = frames.flatMap((frame) => frame.glyphMoves.map((move) => move.distance)).sort((a, b) => a - b)
      const percentile = (ratio) => values[Math.floor(ratio * (values.length - 1))] ?? 0
      return {
        summary: {
          frames: frames.length,
          matchedPositions: values.length,
          p95Px: percentile(0.95),
          p99Px: percentile(0.99),
          maximumPx: percentile(1),
          identicalCommittedGlyphSamples: glyphValues.length,
          identicalCommittedGlyphP99Px: glyphValues[Math.floor(.99 * (glyphValues.length - 1))] ?? null,
          identicalCommittedGlyphMaximumPx: glyphValues.at(-1) ?? null,
          releasedGlyphSamples: frames.flatMap((frame) => frame.glyphMoves.filter((move) => move.released)).length,
          releasedGlyphMaximumPx: Math.max(0, ...frames.flatMap((frame) => frame.glyphMoves.filter((move) => move.released).map((move) => move.distance))),
          lineChanges: frames.reduce((sum, frame) => sum + frame.moves.filter((move) => move.lineChange).length, 0),
          remounts: frames.reduce((sum, frame) => sum + frame.remounts.length, 0),
          framesWithBlurredOrFadedCommittedCells: frames.filter((frame) => frame.unreadable.length > 0).length,
          maximumReleasedMovementPx: Math.max(0, ...frames.flatMap((frame) => frame.releasedMoves)),
          releasedSamples: frames.reduce((sum, frame) => sum + frame.releasedMoves.length, 0),
          frameGapsOver34Ms: frames.filter((frame) => frame.gapMs > 34).length,
          finalStatus: root.dataset.status,
          horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        },
        frames,
      }
    }, durationMs)
    const complete = { ...entry, ...result }
    if (complete.summary.matchedPositions === 0) throw new Error(`${entry.name}: no matched positions; the measurement is invalid`)
    if (complete.summary.identicalCommittedGlyphSamples === 0) throw new Error(`${entry.name}: no matched committed glyphs; the measurement is invalid`)
    if (complete.summary.finalStatus === 'complete' && complete.summary.releasedGlyphSamples === 0) throw new Error(`${entry.name}: recording completed without released glyph samples; extend the observation window`)
    results.push(complete)
    console.log(JSON.stringify({ name: entry.name, ...complete.summary }))
    await writeFile(output, JSON.stringify({ url, browser: browserName, durationMs, measuredAt: new Date().toISOString(), results }, null, 2))
    await page.close()
  }
  await writeFile(output, JSON.stringify({ url, browser: browserName, revision: process.env.MOTION_REVISION ?? 'unspecified working tree', durationMs, measuredAt: new Date().toISOString(), caveats: ['Browser-emulated viewports, not physical-device measurements.', 'No scroll or resize during each sample.', 'Position-box metrics include drafts and text changes; use identicalCommittedGlyph metrics for a stable-text reading-position comparison.', 'Glyph metrics use the first nonspace character DOM Range, matched by source position/offset and identical text; the old/new renderers can produce different sample counts.', 'The fixed observation window may not cover the entire source recording; inspect finalStatus.', 'A zero released-motion result is valid only with nonzero releasedGlyphSamples.', 'Embedded preview clocks changed from 2x to recorded; normalize baseline before comparing that surface.', 'Frame gaps are diagnostics under this machine load, not general device claims.'], results }, null, 2))
} finally {
  await browser.close()
}

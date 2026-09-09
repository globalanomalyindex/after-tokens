import { chromium, expect } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { archiveAmbientMotion } from './archive-ambient-motion.mjs'

// Observational rendering audit, not a benchmark or a reader study. Every
// condition replays the same real source at its observed capture-loop clock.
const root = process.cwd()
const url = process.argv[2] ?? 'http://localhost:3000'
const output = process.argv[3] ?? path.join(root, 'docs/ambient-motion-validation-2026-09-09.json')
const artifacts = path.join(root, 'output/playwright/ambient-motion-2026-09-09')
const source = process.env.AMBIENT_SOURCE ?? 'sleep'
const choices = {
  sleep: { file: 'parallel-qwen-2026-09-09/compact/sleep-tips__lowconf-b128-s32.json', label: 'a numbered list' },
  sky: { file: 'parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json', label: 'an explanation' },
  random: { file: 'parallel-qwen-random-2026-09-09/compact/sleep-tips__random-b128-s32.json', label: 'a failed answer' },
}
if (!choices[source]) throw Error('AMBIENT_SOURCE must be sleep, sky, or random')
const trace = JSON.parse(await readFile(path.join(root, 'data/experiments', choices[source].file), 'utf8'))
const previousReport = process.env.AMBIENT_APPEND === '1' ? JSON.parse(await readFile(output, 'utf8')) : null
await mkdir(artifacts, { recursive: true })
const browser = await chromium.launch()
const results = previousReport?.results ?? []
const percentile = (values, proportion) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) * proportion)]
}

try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1380, height: 900 }]) {
    for (const condition of ['static', 'coherent', 'independent']) {
      const caseName = `${viewport.width}-${condition}`
      const name = source === 'sleep' ? caseName : `${caseName}-${source}`
      if (process.env.AMBIENT_CASE && process.env.AMBIENT_CASE !== caseName) continue
      const context = await browser.newContext({ viewport, reducedMotion: 'no-preference', recordVideo: { dir: artifacts, size: viewport } })
      const page = await context.newPage()
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      const study = page.locator('.ambient-study')
      await study.waitFor({ state: 'attached' })
      if (source !== 'sleep') await study.getByRole('radiogroup', { name: 'recording', exact: true }).getByRole('radio', { name: choices[source].label, exact: true }).click()
      await expect(study).toHaveAttribute('data-source-id', trace.id)
      if (viewport.width < 768) {
        const label = { static: 'at rest', coherent: 'together', independent: 'apart' }[condition]
        await study.getByRole('radiogroup', { name: 'motion study', exact: true }).getByRole('radio', { name: label, exact: true }).click()
      }
      const surface = study.locator('.settle').filter({ has: page.getByRole('region', { name: `answer · ${condition}`, exact: true }) })
      await surface.scrollIntoViewIfNeeded()
      await page.waitForTimeout(700)
      await surface.screenshot({ path: path.join(artifacts, `${name}-loading.png`) })
      // The recording control is activated without scrolling the measured
      // surface out of view. Pointer/keyboard behavior is covered by e2e tests.
      const raw = await surface.evaluate(async (host, expected) => {
        const study = host.closest('.ambient-study')
        const replay = [...study.querySelectorAll('button')].find((button) => /replay/i.test(button.getAttribute('aria-label') ?? button.textContent))
        if (!replay) throw Error('Study replay control not found')
        const samples = []
        const nonemptyUpdates = []
        const transitions = []
        let lastText = host.querySelector('.settle-page')?.textContent ?? ''
        const observer = new MutationObserver(() => {
          const text = host.querySelector('.settle-page')?.textContent ?? ''
          if (text === lastText) return
          const entry = { atMs: performance.now(), text, status: host.dataset.status, sourceElapsedMs: Number(study.dataset.elapsedMs) }
          transitions.push(entry)
          if (text) nonemptyUpdates.push(entry)
          lastText = text
        })
        observer.observe(host, { subtree: true, childList: true, characterData: true })
        replay.click()
        const clickAt = performance.now()
        let origin = null
        let previousAt = null
        let firstFinalAt = null
        let firstReadableAt = null
        let firstSourceDeadlineAt = null
        const duration = Number(study.dataset.durationMs)
        if (!Number.isFinite(duration) || duration <= 0) throw Error('Missing finite source duration')
        await new Promise((resolve) => {
          const tick = (now) => {
            if (origin === null) origin = now
            const outer = host.getBoundingClientRect()
            const frame = host.querySelector('.settle-answer-frame').getBoundingClientRect()
            const page = host.querySelector('.settle-page')
            const text = page.textContent ?? ''
            const status = host.dataset.status
            const elapsed = Number(study.dataset.elapsedMs)
            if (elapsed >= duration && firstSourceDeadlineAt === null) firstSourceDeadlineAt = now
            if (status === 'complete' && firstFinalAt === null) firstFinalAt = now
            if (text && firstReadableAt === null) firstReadableAt = now
            const glyphs = []
            const ink = host.querySelector('.settle-answer-text')
            let readableStyle = null
            if (ink) {
              const style = getComputedStyle(ink)
              readableStyle = { filter: style.filter, opacity: Number(style.opacity), transform: style.transform, visibility: style.visibility }
              const node = ink.firstChild
              if (node?.nodeType === Node.TEXT_NODE) {
                for (const match of node.textContent.matchAll(/\S+/g)) {
                  const range = document.createRange()
                  range.setStart(node, match.index)
                  range.setEnd(node, match.index + 1)
                  const rect = range.getBoundingClientRect()
                  glyphs.push({ offset: match.index, x: rect.x - outer.x, y: rect.y - outer.y })
                }
              }
            }
            const bars = [...host.querySelectorAll('.ambient-composition__bar')].map((bar, index) => {
              const style = getComputedStyle(bar)
              const matrix = new DOMMatrixReadOnly(style.transform)
              const rect = bar.getBoundingClientRect()
              return { index, x: rect.x - outer.x, y: rect.y - outer.y, width: rect.width, height: rect.height, translateX: matrix.e, translateY: matrix.f, scaleX: matrix.a, scaleY: matrix.d, opacity: Number(style.opacity), playState: style.animationPlayState }
            })
            samples.push({ atMs: now - origin, gapMs: previousAt === null ? null : now - previousAt, sourceElapsedMs: elapsed, sourceStatus: status, active: host.dataset.active === 'true', visible: host.dataset.visible === 'true', frameHeight: frame.height, outerHeight: outer.height, pageHeight: page.getBoundingClientRect().height, fontSize: parseFloat(getComputedStyle(host).fontSize), textLength: text.length, textExact: text === expected, bars, glyphs, readableStyle })
            previousAt = now
            if (firstFinalAt !== null && now - firstFinalAt >= 1000) resolve()
            else if (now - clickAt > duration + 8000) resolve()
            else requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        })
        observer.disconnect()
        return { durationMs: duration, expectedText: expected, samples, transitions: transitions.map((entry) => ({ ...entry, atMs: entry.atMs - clickAt })), nonemptyUpdates: nonemptyUpdates.length, firstFinalAtMs: firstFinalAt === null ? null : firstFinalAt - clickAt, firstReadableAtMs: firstReadableAt === null ? null : firstReadableAt - clickAt, observedSourceDeadlineToReadableMs: firstSourceDeadlineAt === null || firstReadableAt === null ? null : firstReadableAt - firstSourceDeadlineAt, horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth), finalText: host.querySelector('.settle-page').textContent }
      }, trace.answer)
      const translationDeltas = []
      const ordinaryFrameDeltas = []
      const edgeDeltas = []
      const ordinaryFrameEdgeDeltas = []
      const translationSpreads = []
      const scaleSpreads = []
      const glyphDisplacements = []
      const gaps = raw.samples.flatMap((sample) => sample.gapMs === null ? [] : [sample.gapMs])
      let previousBars = new Map()
      const firstGlyphs = new Map()
      for (const sample of raw.samples) {
        for (const bar of sample.bars) {
          const before = previousBars.get(bar.index)
          if (before) {
            const delta = Math.hypot(bar.translateX - before.translateX, bar.translateY - before.translateY)
            translationDeltas.push(delta)
            if (sample.gapMs !== null && sample.gapMs <= 34) ordinaryFrameDeltas.push(delta)
            const edgeDelta = Math.max(Math.abs(bar.x - before.x), Math.abs(bar.y - before.y), Math.abs(bar.x + bar.width - before.x - before.width), Math.abs(bar.y + bar.height - before.y - before.height))
            edgeDeltas.push(edgeDelta)
            if (sample.gapMs !== null && sample.gapMs <= 34) ordinaryFrameEdgeDeltas.push(edgeDelta)
          }
        }
        if (sample.bars.length === 5) {
          translationSpreads.push(Math.max(...sample.bars.flatMap((bar) => sample.bars.map((other) => Math.hypot(bar.translateX - other.translateX, bar.translateY - other.translateY)))))
          scaleSpreads.push(Math.max(...sample.bars.map((bar) => bar.scaleX)) - Math.min(...sample.bars.map((bar) => bar.scaleX)))
        }
        previousBars = new Map(sample.bars.map((bar) => [bar.index, bar]))
        for (const glyph of sample.glyphs) {
          const first = firstGlyphs.get(glyph.offset)
          if (first) glyphDisplacements.push(Math.hypot(glyph.x - first.x, glyph.y - first.y))
          else firstGlyphs.set(glyph.offset, glyph)
        }
      }
      const loading = raw.samples.filter((sample) => sample.sourceStatus !== 'complete')
      const final = raw.samples.filter((sample) => sample.sourceStatus === 'complete')
      if (!loading.length || !final.length || !translationDeltas.length || !glyphDisplacements.length) throw Error(`${name}: incomplete/non-matching samples; refusing empty zero metrics`)
      if (!loading.some((sample) => sample.active && sample.visible)) throw Error(`${name}: no visible active loading samples`)
      if (loading.some((sample) => sample.bars.length !== 5 || sample.bars.some((bar) => bar.width <= 0 || bar.height <= 0))) throw Error(`${name}: missing or dimensionless visible bars; CSS may not have loaded`)
      if (condition !== 'static' && Math.max(...translationDeltas) <= 0) throw Error(`${name}: animated condition never moved; refusing a false zero-motion result`)
      if (raw.finalText !== trace.answer) throw Error(`${name}: final text mismatch`)
      const summary = {
        name, viewport, condition, source: trace.id, clock: 'observed capture-loop intervals',
        frames: raw.samples.length, loadingFrames: loading.length, finalFrames: final.length,
        activeLoadingFrames: loading.filter((sample) => sample.active && sample.visible).length,
        frameGapP95Ms: percentile(gaps, .95), frameGapMaximumMs: percentile(gaps, 1), frameGapsOver34Ms: gaps.filter((gap) => gap > 34).length,
        barTranslationSamples: translationDeltas.length, barTranslationDeltaP99Px: percentile(translationDeltas, .99), barTranslationDeltaMaximumPx: percentile(translationDeltas, 1), barDeltaMaximumForFramesUnder34MsPx: percentile(ordinaryFrameDeltas, 1),
        barRectangleEdgeDeltaP99Px: percentile(edgeDeltas, .99), barRectangleEdgeDeltaMaximumPx: percentile(edgeDeltas, 1), barRectangleEdgeDeltaMaximumUnder34MsPx: percentile(ordinaryFrameEdgeDeltas, 1),
        primaryTranslationSpreadMaximumPx: percentile(translationSpreads, 1), primaryScaleXSpreadMaximum: percentile(scaleSpreads, 1),
        primaryScaleXMinimum: Math.min(...loading.flatMap((sample) => sample.bars.map((bar) => bar.scaleX))), primaryScaleXMaximum: Math.max(...loading.flatMap((sample) => sample.bars.map((bar) => bar.scaleX))),
        minimumBarWidthPx: Math.min(...loading.flatMap((sample) => sample.bars.map((bar) => bar.width))), minimumBarHeightPx: Math.min(...loading.flatMap((sample) => sample.bars.map((bar) => bar.height))),
        barTranslationExtents: { minimumX: Math.min(...loading.flatMap((sample) => sample.bars.map((bar) => bar.translateX))), maximumX: Math.max(...loading.flatMap((sample) => sample.bars.map((bar) => bar.translateX))), minimumY: Math.min(...loading.flatMap((sample) => sample.bars.map((bar) => bar.translateY))), maximumY: Math.max(...loading.flatMap((sample) => sample.bars.map((bar) => bar.translateY))) },
        matchedFinalGlyphSamples: glyphDisplacements.length, finalGlyphMaximumDisplacementPx: percentile(glyphDisplacements, 1),
        loadingFrameMinimumHeightPx: Math.min(...loading.map((sample) => sample.frameHeight)), loadingFrameMaximumHeightPx: Math.max(...loading.map((sample) => sample.frameHeight)), finalFrameHeightPx: final.at(-1).frameHeight,
        finalMinusLastLoadingFrameHeightPx: final[0].frameHeight - loading.at(-1).frameHeight,
        loadingContainerMinimumHeightPx: Math.min(...loading.map((sample) => sample.outerHeight)), loadingContainerMaximumHeightPx: Math.max(...loading.map((sample) => sample.outerHeight)), finalContainerHeightPx: final.at(-1).outerHeight,
        finalMinusLastLoadingContainerHeightPx: final[0].outerHeight - loading.at(-1).outerHeight,
        nonemptyTextUpdates: raw.nonemptyUpdates, firstReadableAtMs: raw.firstReadableAtMs, firstFinalAtMs: raw.firstFinalAtMs, observedSourceDeadlineToReadableMs: raw.observedSourceDeadlineToReadableMs,
        prefinalTextFrames: loading.filter((sample) => sample.textLength > 0).length,
        blurredFadedOrTransformedFinalTextFrames: final.filter((sample) => sample.readableStyle && (sample.readableStyle.filter !== 'none' || sample.readableStyle.opacity !== 1 || sample.readableStyle.transform !== 'none' || sample.readableStyle.visibility !== 'visible')).length,
        horizontalOverflowPx: raw.horizontalOverflowPx, exactFinalText: true,
      }
      await writeFile(path.join(artifacts, `${name}-raw.json`), JSON.stringify(raw))
      await surface.screenshot({ path: path.join(artifacts, `${name}-final.png`) })
      const video = page.video()
      await context.close()
      await video.saveAs(path.join(artifacts, `${name}.webm`))
      const previousIndex = results.findIndex((result) => result.name === name)
      if (previousIndex >= 0) results.splice(previousIndex, 1, summary)
      else results.push(summary)
      console.log(JSON.stringify(summary))
    }
  }
  const report = {
    measuredAt: new Date().toISOString(), url, browser: 'Chromium', browserVersion: browser.version(), revision: process.env.MOTION_REVISION ?? 'working tree',
    calibrationSource: 'sleep-tips__lowconf-b128-s32',
    sources: { ...(previousReport?.sources ?? (previousReport?.source ? { [previousReport.source]: previousReport.sourceDurationMs } : {})), [trace.id]: trace.step_wall_ms.reduce((total, ms) => total + ms, 0) },
    metricDefinitions: {
      frameGaps: 'Observed rAF intervals under this development-machine load. Diagnostic only; not a physical-device benchmark or causal comparison of rendering cost.',
      barDelta: 'Frame-to-frame primary outer-bar CSS translation in pixels; rectangle edge deltas also include scale deformation. Rectangle boundaries are not the perceptual edge of the feathered inner ink. Small inner-ink drift is not part of these primary-transform metrics. Static bars require nonzero matching samples; moving conditions require positive variation and nonzero dimensions.',
      phaseSpread: 'Maximum pairwise difference in primary translation and horizontal scale within a frame. Shared primary timing should give zero spread; the separate smaller local ink drift is intentionally not identical.',
      glyphDisplacement: 'Each final whitespace word’s first character measured with a DOM Range against its first final frame, relative to the answer surface. No text exists in the loading page.',
      finalityDelay: 'First observed rAF with readable final text minus first observed rAF where the exposed source clock reaches its duration. Zero means same sampled frame, not zero compositor/input latency.',
      heightChange: 'Loading occupied frame/container heights and the first final change are reported separately. A final answer can exceed the authored loading allocation; that is an explicit one-time layout change.',
      comparison: 'The six calibration conditions replay the same short list on the same observed clock in fresh pages. Additional narrow coherent sky/random cases measure final growth and wrapping, not an extra between-condition comparison. The measured condition remains visible. These sequential observations are not a controlled performance benchmark.',
    },
    caveats: ['Browser viewport emulation; no physical iPhone measurement.', 'No reader preference, comprehension, trust, dopamine, or novelty claims follow from this audit.', 'A displayed whole answer deliberately gives up earlier reading opportunities.', 'No synthetic source timing, guessed final geometry, or reconstructed progress is used.'], results,
  }
  await writeFile(output, JSON.stringify(await archiveAmbientMotion(report, root, artifacts), null, 2) + '\n')
} finally {
  await browser.close()
}

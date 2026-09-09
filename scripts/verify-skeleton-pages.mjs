import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'

// Run from the repository root, after the Pages export or deployment is ready.
// This verifies the served build. It does not substitute for the browser suite
// or for the separately archived motion observations.
const base = `${(process.env.VERIFY_URL ?? 'http://127.0.0.1:3010/after-tokens/').replace(/\/$/, '')}/`
const reportPath = process.env.VERIFY_REPORT ?? 'output/playwright/skeleton-pages-verification.json'
const expectedTitle = 'After Tokens: a skeleton motion study for generated text'
const material = 'solid-rounded-skeleton-v1'
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex')
const fixtures = [
  { label: 'a numbered list', file: 'data/experiments/parallel-qwen-2026-09-09/compact/sleep-tips__lowconf-b128-s32.json' },
  { label: 'an explanation', file: 'data/experiments/parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json' },
].map((fixture) => {
  const bytes = fs.readFileSync(fixture.file)
  return { ...fixture, trace: JSON.parse(bytes), sha256: sha256(bytes) }
})

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
  })
  page.on('requestfailed', (request) => errors.push(`${request.failure()?.errorText ?? 'request failed'} ${request.url()}`))
  const response = await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 })
  assert.equal(response?.status(), 200, 'Page did not return HTTP 200')
  assert.equal(await page.title(), expectedTitle, 'Stale page title')
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
  assert.equal(canonical, 'https://globalanomalyindex.github.io/after-tokens/', 'Wrong canonical URL')
  const study = page.locator('.ambient-study')
  await study.scrollIntoViewIfNeeded()
  const controls = study.locator('.ambient-study-controls')
  const observations = []

  for (const fixture of fixtures) {
    await study.getByRole('radiogroup', { name: 'recording', exact: true })
      .getByRole('radio', { name: fixture.label, exact: true }).click()
    await page.waitForFunction((id) => document.querySelector('.ambient-study')?.getAttribute('data-source-id') === id, fixture.trace.id)
    await controls.getByRole('button', { name: 'replay all', exact: true }).waitFor()
    await page.waitForFunction(() => [...document.querySelectorAll('.ambient-study-controls button')]
      .some((button) => button.textContent === 'replay all' && !button.disabled))
    const pause = controls.getByRole('button', { name: 'pause all', exact: true })
    if (await pause.count()) await pause.click()

    // Install both observers BEFORE replay. A new loading node resets the
    // observations, so the paused previous run cannot pollute this run. The
    // MutationObserver sees the final text and layout-effect-created cue in
    // the same DOM checkpoint; rAF continues through the cue's disappearance.
    await study.evaluate((root, expectedMaterial) => {
      window.__skeletonPagesAudit?.stop?.()
      let raf = 0
      let observer
      let loadingNode = null
      let baseline = null
      let lastText = ''
      let finalAt = null
      let firstGlyphs = null
      let data = null
      const round = (number) => Math.round(number * 10000) / 10000
      const problem = (message) => { if (!data.failures.includes(message)) data.failures.push(message) }
      const rect = (element) => {
        const r = element.getBoundingClientRect()
        return { width: r.width, height: r.height, left: r.left, top: r.top }
      }
      const style = (element) => {
        const css = getComputedStyle(element)
        return {
          backgroundColor: css.backgroundColor, backgroundImage: css.backgroundImage,
          filter: css.filter, maskImage: css.maskImage, webkitMaskImage: css.webkitMaskImage,
          boxShadow: css.boxShadow, transform: css.transform, borderRadius: css.borderRadius,
          opacity: css.opacity, clipPath: css.clipPath,
        }
      }
      const glyphs = (text) => {
        const node = text.firstChild
        if (!node || node.nodeType !== Node.TEXT_NODE) return []
        return [...node.textContent.matchAll(/\S+/g)].map((match) => {
          const range = document.createRange()
          range.setStart(node, match.index)
          range.setEnd(node, match.index + 1)
          const r = range.getBoundingClientRect()
          return { left: r.left, top: r.top }
        })
      }
      const read = () => {
        const visible = [...root.querySelectorAll('.settle[data-ambient-condition]')]
          .filter((element) => element.getBoundingClientRect().width > 0)
        if (visible.length !== 1) return
        const surface = visible[0]
        const composition = surface.querySelector('.ambient-composition')
        const frame = surface.querySelector('.settle-answer-frame')
        const elapsedMs = Number(root.getAttribute('data-elapsed-ms'))
        const durationMs = Number(root.getAttribute('data-duration-ms'))
        if (composition && composition !== loadingNode) {
          loadingNode = composition
          baseline = null
          finalAt = null
          firstGlyphs = null
          lastText = ''
          data = {
            sourceId: root.getAttribute('data-source-id'), condition: surface.getAttribute('data-ambient-condition'),
            material: composition.getAttribute('data-material'), durationMs,
            clock: 'observed capture-loop replay', samples: 0, loadingSamples: 0,
            loading: null, final: null, cueAtFirstAnswer: null, cueRemoved: false,
            textUpdates: 0, opacityValues: [], clipValues: [], failures: [],
            maxBarHeightChangeCssPx: 0, maxInkBoxDisplacementCssPx: 0,
            maxFinalGlyphDisplacementCssPx: 0, matchedFinalGlyphSamples: 0,
          }
          window.__skeletonPagesAudit.data = data
        }
        if (!data) return
        data.samples += 1
        const text = surface.querySelector('.settle-answer-text')
        const currentText = surface.querySelector('.settle-page')?.textContent ?? ''
        if (currentText !== lastText) {
          if (currentText) data.textUpdates += 1
          lastText = currentText
        }
        if (composition) {
          data.loadingSamples += 1
          if (data.material !== expectedMaterial) problem('Wrong skeleton material')
          if (currentText) problem('Readable text was present during the skeleton state')
          const bars = [...composition.querySelectorAll('.ambient-composition__bar')]
          const inks = [...composition.querySelectorAll('.ambient-composition__ink')]
          if (bars.length !== 5 || inks.length !== 5) problem('Expected exactly five solid bars')
          const origin = composition.getBoundingClientRect()
          const boxes = inks.map((ink) => {
            const r = rect(ink)
            return { ...r, left: r.left - origin.left, top: r.top - origin.top }
          })
          if (!baseline) {
            baseline = boxes
            data.loading = {
              frame: rect(frame), surface: rect(surface), fontSize: parseFloat(getComputedStyle(surface).fontSize),
              bars: bars.map((bar, index) => ({ box: boxes[index], barStyle: style(bar), inkStyle: style(inks[index]) })),
            }
          }
          if (frame.getBoundingClientRect().height < data.loading.fontSize * 7.99) problem('Loading frame lost its 8em minimum')
          for (const element of [composition, ...bars, ...inks]) {
            const css = style(element)
            if (css.filter !== 'none' || css.boxShadow !== 'none' || css.backgroundImage !== 'none'
              || css.maskImage !== 'none' || (css.webkitMaskImage && css.webkitMaskImage !== 'none')) problem('Skeleton has a filter, shadow, gradient, or mask')
            if (css.transform !== 'none') problem('Skeleton uses transform-based movement or stretching')
            for (const pseudo of ['::before', '::after']) {
              const extra = getComputedStyle(element, pseudo)
              if (extra.content !== 'none' && extra.content !== 'normal'
                && (extra.backgroundImage !== 'none' || extra.filter !== 'none' || extra.boxShadow !== 'none')) problem('Skeleton pseudo-element adds a gradient, blur, or shadow')
            }
          }
          inks.forEach((ink, index) => {
            const css = style(ink)
            const box = boxes[index]
            if (box.width <= 0 || box.height <= 0) problem('Skeleton bar is dimensionless')
            if (parseFloat(css.borderRadius) < box.height / 2 || !css.clipPath.includes('round')) problem('Skeleton endcaps are not rounded')
            if (css.backgroundColor === 'transparent' || /^rgba\([^)]*,\s*0\)$/.test(css.backgroundColor)) problem('Skeleton has no solid fill')
            if (index && css.backgroundColor !== style(inks[0]).backgroundColor) problem('Bars have different solid fill colors')
            if (index && Math.abs(box.height - boxes[0].height) > .01) problem('Bars have inconsistent heights')
            data.maxBarHeightChangeCssPx = Math.max(data.maxBarHeightChangeCssPx, Math.abs(box.height - baseline[index].height))
            data.maxInkBoxDisplacementCssPx = Math.max(data.maxInkBoxDisplacementCssPx,
              Math.hypot(box.left - baseline[index].left, box.top - baseline[index].top))
            const opacity = getComputedStyle(bars[index]).opacity
            if (!data.opacityValues.includes(opacity)) data.opacityValues.push(opacity)
            if (!data.clipValues.includes(css.clipPath)) data.clipValues.push(css.clipPath)
          })
        }
        if (text) {
          if (elapsedMs + .01 < durationMs) problem('Answer displayed before the observed source deadline')
          const css = getComputedStyle(text)
          if (css.opacity !== '1' || css.filter !== 'none' || css.transform !== 'none') problem('Readable answer is faded, filtered, or transformed')
          if (text.childNodes.length !== 1 || text.firstChild?.nodeType !== Node.TEXT_NODE) problem('Answer is not one natural text node')
          if (finalAt === null) {
            finalAt = performance.now()
            firstGlyphs = glyphs(text)
            data.final = { text: text.textContent, elapsedMs, frame: rect(frame), surface: rect(surface), sourceStatus: surface.getAttribute('data-status') }
            const cue = surface.querySelector('.settle-answer-arrival')
            if (cue) {
              const cueStyle = getComputedStyle(cue)
              const animation = cue.getAnimations().find((item) => item instanceof CSSAnimation && item.animationName === 'settle-answer-arrive')
              data.cueAtFirstAnswer = {
                borderWidth: cueStyle.borderTopWidth, borderStyle: cueStyle.borderTopStyle,
                borderColor: cueStyle.borderTopColor, boxShadow: cueStyle.boxShadow,
                filter: cueStyle.filter, animationName: cueStyle.animationName,
                cssDuration: cueStyle.animationDuration, durationMs: animation?.effect?.getTiming().duration,
              }
            }
          }
          glyphs(text).forEach((glyph, index) => {
            const first = firstGlyphs[index]
            if (!first) return
            data.matchedFinalGlyphSamples += 1
            data.maxFinalGlyphDisplacementCssPx = Math.max(data.maxFinalGlyphDisplacementCssPx, Math.hypot(glyph.left - first.left, glyph.top - first.top))
          })
          data.cueRemoved = !surface.querySelector('.settle-answer-arrival')
          if (performance.now() - finalAt >= 450 && data.cueRemoved) {
            data.opacityValueCount = data.opacityValues.length
            data.clipValueCount = data.clipValues.length
            delete data.opacityValues
            delete data.clipValues
            data.finalFrameHeightDeltaCssPx = round(data.final.frame.height - data.loading.frame.height)
            data.finalSurfaceHeightDeltaCssPx = round(data.final.surface.height - data.loading.surface.height)
            data.maxFinalGlyphDisplacementCssPx = round(data.maxFinalGlyphDisplacementCssPx)
            window.__skeletonPagesAudit.done = true
            window.__skeletonPagesAudit.stop()
          }
        }
        if (document.documentElement.scrollWidth > window.innerWidth + 1) problem('Document overflows horizontally')
      }
      window.__skeletonPagesAudit = {
        done: false, data: null,
        stop: () => { cancelAnimationFrame(raf); observer?.disconnect() },
      }
      observer = new MutationObserver(read)
      observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true })
      const tick = () => {
        if (window.__skeletonPagesAudit.done) return
        read()
        if (!window.__skeletonPagesAudit.done) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, material)

    await controls.getByRole('button', { name: 'replay all', exact: true }).click()
    await study.locator('.settle:visible').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => window.__skeletonPagesAudit?.done, null, { timeout: 20000 })
    const observed = await page.evaluate(() => window.__skeletonPagesAudit.data)
    assert.equal(observed.sourceId, fixture.trace.id, 'Wrong dynamically loaded source')
    assert.equal(observed.condition, 'reshape', 'Wrong default condition')
    assert.equal(observed.material, material)
    assert.ok(observed.loadingSamples > 5, 'Insufficient loading samples')
    assert.ok(observed.opacityValueCount > 2 && observed.clipValueCount > 2, 'No actual breathing and endpoint change observed')
    assert.equal(observed.maxBarHeightChangeCssPx, 0, 'Bar height changed')
    assert.equal(observed.maxInkBoxDisplacementCssPx, 0, 'Bar layout moved')
    assert.equal(observed.final.text, fixture.trace.answer, 'Exact answer mismatch')
    assert.equal(observed.final.sourceStatus, 'complete')
    assert.equal(observed.textUpdates, 1, 'Answer updated more than once')
    assert.ok(observed.matchedFinalGlyphSamples > 0, 'No final glyph samples')
    assert.equal(observed.maxFinalGlyphDisplacementCssPx, 0, 'Readable glyphs moved after arrival')
    assert.ok(observed.cueAtFirstAnswer, 'Thin outline was absent at the first observed answer')
    assert.equal(observed.cueAtFirstAnswer.durationMs, 260, 'Wrong arrival duration')
    assert.ok(parseFloat(observed.cueAtFirstAnswer.borderWidth) > 0, 'Arrival border is missing')
    assert.equal(observed.cueAtFirstAnswer.borderStyle, 'solid')
    assert.equal(observed.cueAtFirstAnswer.boxShadow, 'none', 'Old glowing arrival remains')
    assert.equal(observed.cueAtFirstAnswer.filter, 'none')
    assert.equal(observed.cueRemoved, true, 'Arrival decoration did not clear')
    assert.deepEqual(observed.failures, [])
    observations.push({ fixture: fixture.file, fixtureSha256: fixture.sha256, ...observed })
  }

  const assets = await page.locator('script[src],link[rel="stylesheet"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('src') || node.getAttribute('href')))
  assert.ok(assets.length > 0 && assets.every((asset) => asset.startsWith('/after-tokens/')), 'Invalid Pages asset prefix')
  const videos = []
  for (const name of ['skeleton-answer-mobile.webm', 'skeleton-answer-long.webm']) {
    const videoResponse = await page.request.get(new URL(`study/${name}`, base).href)
    const bytes = await videoResponse.body()
    const expected = fs.readFileSync(`public/study/${name}`)
    assert.equal(videoResponse.status(), 200, `Video request failed: ${name}`)
    assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3', `Not WebM: ${name}`)
    assert.equal(sha256(bytes), sha256(expected), `Video bytes differ: ${name}`)
    assert.match(videoResponse.headers()['content-type'] ?? '', /video\/webm/, `Wrong video content type: ${name}`)
    videos.push({ name, status: videoResponse.status(), bytes: bytes.length, contentType: videoResponse.headers()['content-type'], sha256: sha256(bytes), expectedSha256: sha256(expected) })
  }
  assert.deepEqual(errors, [], 'Browser or HTTP errors occurred')
  const report = {
    verifiedAt: new Date().toISOString(), url: base, browser: await browser.version(), status: response.status(),
    title: await page.title(), canonical, material, viewport: { width: 390, height: 844 },
    assetCount: assets.length, assetPrefix: '/after-tokens/', assets,
    observationMethod: 'MutationObserver installed before replay plus requestAnimationFrame; counts are DOM observations, not a frame-rate benchmark.',
    layoutDefinition: 'Loading bar boxes relative to their composition; final first-glyph positions in the stationary viewport. Final container expansion is reported separately.',
    sourceClock: 'Observed capture-loop intervals; decorative timing is independent. Not live model inference or end-to-end request latency.',
    exactFinalAnswers: observations.map((item) => item.sourceId), observations, videos, errors,
    caveats: ['Chromium at an emulated narrow viewport, not physical iPhone testing.', 'This publication smoke check verifies delivered artifacts and behavior, not reader preference or causal effects of motion.'],
  }
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser.close()
}

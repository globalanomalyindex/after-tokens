import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, expect } from '@playwright/test'
import { capturedClock } from './measure-anchored-skeleton-motion.mjs'
import { archiveResponsive, fingerprint, implementationSnapshot, hash, MATERIAL, REPORT, ARTIFACTS } from './archive-responsive-skeleton-motion.mjs'

export { capturedClock }
export const SOURCES = {
  sleep: { file: 'data/experiments/parallel-qwen-2026-09-09/compact/sleep-tips__lowconf-b128-s32.json', label: 'a numbered list' },
  sky: { file: 'data/experiments/parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json', label: 'an explanation' },
  random: { file: 'data/experiments/parallel-qwen-random-2026-09-09/compact/sleep-tips__random-b128-s32.json', label: 'a failed answer' },
}

/** Runs inside a real browser. Expected answer text is available to this
 * verification observer, never passed to presentation helpers. All coordinates are local
 * to the frame so document scroll changes cannot masquerade as glyph motion. */
export async function observeResponsive(root, input) {
  const study = root.closest('.ambient-study'), samples = [], textEvents = []
  let lastText = '', nonemptyTextUpdates = 0, sourceCompleteAt = null, firstDomAt = null, firstInkAt = null, opaqueAt = null, readyAt = null
  const mutation = new MutationObserver(() => {
    const text = root.querySelector('.settle-page').textContent ?? ''
    if (text !== lastText) {
      textEvents.push({ atMs: performance.now(), text, status: root.dataset.status, sourceElapsedMs: Number(study.dataset.elapsedMs) })
      if (text) nonemptyTextUpdates++
      lastText = text
    }
  })
  mutation.observe(root, { subtree: true, childList: true, characterData: true })
  const replay = [...study.querySelectorAll('button')].find((button) => button.textContent === 'replay all')
  if (!replay) throw Error('Replay control missing')
  replay.click()
  const startedAt = performance.now(), frames = new WeakMap(), cells = new WeakMap()
  let nextIdentity = 0
  const identity = (node, map) => { if (!map.has(node)) map.set(node, ++nextIdentity); return map.get(node) }
  const rect = (node, base) => { const r = node.getBoundingClientRect(); return { x: r.left - base.left, y: r.top - base.top, width: r.width, height: r.height } }
  try {
    await new Promise((resolve, reject) => {
      const tick = (atMs) => {
        try {
          const frameElement = root.querySelector('.settle-answer-frame'), frame = frameElement.getBoundingClientRect()
          const page = root.querySelector('.settle-page'), text = page.textContent ?? '', composition = root.querySelector('.ambient-composition')
          const passages = [...root.querySelectorAll('[data-passage]')].map((node) => {
            const css = getComputedStyle(node), glyphs = [], wordBounds = []
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
            let wordNode
            while ((wordNode = walker.nextNode())) for (const match of wordNode.textContent.matchAll(/\S+/g)) {
              const range = document.createRange(); range.setStart(wordNode, match.index); range.setEnd(wordNode, match.index + 1)
              const r = range.getBoundingClientRect(); glyphs.push([r.left - frame.left, r.top - frame.top])
              range.setEnd(wordNode, match.index + match[0].length)
              for (const bounds of range.getClientRects()) wordBounds.push({ x: bounds.left - frame.left, y: bounds.top - frame.top, width: bounds.width, height: bounds.height })
            }
            return { id: node.dataset.passage, identity: identity(node, frames), text: node.textContent, start: Number(node.dataset.start), end: Number(node.dataset.end),
              pending: node.dataset.pending === 'true', arriving: node.dataset.arriving === 'true', opacity: Number(css.opacity), top: parseFloat(css.top), visibility: css.visibility,
              filter: css.filter, transform: css.transform, animationName: css.animationName, animationDuration: css.animationDuration, glyphs, wordBounds }
          })
          const transfer = [...root.querySelectorAll('.bubble-transfer__cell')].map((node) => {
            const css = getComputedStyle(node)
            return { ...rect(node, frame), opacity: Number(css.opacity), transform: css.transform, duration: css.animationDuration,
              origin: { x: parseFloat(node.style.left), y: parseFloat(node.style.top), width: parseFloat(node.style.width), height: parseFloat(node.style.height) },
              targetDelta: [parseFloat(node.style.getPropertyValue('--transfer-x')), parseFloat(node.style.getPropertyValue('--transfer-y'))],
              targetScale: [Number(node.style.getPropertyValue('--transfer-scale-x')), Number(node.style.getPropertyValue('--transfer-scale-y'))], alpha: Number(node.style.getPropertyValue('--transfer-alpha')) }
          })
          // Query the subtree animation list once per sample, rather than
          // repeating a large subtree walk for every pill as the v5 audit did.
          const animations = root.getAnimations({ subtree: true })
          const glimmers = animations.filter((animation) => animation instanceof CSSAnimation && animation.animationName === 'skeleton-glimmer')
          const rows = [...root.querySelectorAll('.ambient-composition__bar')].map((node) => {
            const box = node.getBoundingClientRect(), css = getComputedStyle(node)
            const pills = node.dataset.shown === 'true' ? [...node.querySelectorAll('.ambient-composition__presence')].map((pill) => {
              const ink = pill.firstElementChild, pc = getComputedStyle(pill), ic = getComputedStyle(ink), r = ink.getBoundingClientRect()
              return { identity: identity(pill, cells), x: r.left - box.left, y: r.top - box.top, width: r.width, height: r.height, opacity: Number(pc.opacity),
                filter: ic.filter, backgroundImage: ic.backgroundImage, maskImage: ic.maskImage, shadow: ic.boxShadow, radius: ic.borderTopLeftRadius }
            }) : []
            return { identity: identity(node, frames), shown: node.dataset.shown === 'true', kind: node.dataset.kind, ...rect(node, frame), opacity: Number(css.opacity), period: css.animationDuration, pills }
          })
          const allOpaque = !!text && passages.every((p) => p.visibility === 'visible' && p.opacity >= .999 && !p.pending)
          if (root.dataset.status === 'complete' && sourceCompleteAt === null) sourceCompleteAt = atMs
          if (text && firstDomAt === null) firstDomAt = atMs
          if (passages.some((p) => p.visibility === 'visible' && p.opacity > .001) && firstInkAt === null) firstInkAt = atMs
          if (allOpaque && opaqueAt === null) opaqueAt = atMs
          if (root.dataset.visualReady === 'true' && readyAt === null) readyAt = atMs
          const intro = composition?.querySelector('.skeleton-division'), field = composition?.querySelector('.ambient-composition__field')
          const opening = intro ? getComputedStyle(intro) : null
          samples.push({ atMs, elapsedMs: atMs - startedAt, sourceElapsedMs: Number(study.dataset.elapsedMs), sourceAtMs: Number(root.dataset.sourceAtMs),
            material: root.dataset.material, status: root.dataset.status, phase: root.dataset.answerPhase, visualReady: root.dataset.visualReady === 'true',
            releasedLength: Number(root.dataset.releasedLength), text, passages, transfer, frame: { width: frame.width, height: frame.height, overflow: getComputedStyle(frameElement).overflow },
            page: rect(page, frame), lineHeight: parseFloat(getComputedStyle(page).lineHeight), ambient: !!composition,
            activityMs: Number(composition?.dataset.activityMs ?? 0), rows,
            introduction: intro ? { opacity: Number(opening.opacity), visibility: opening.visibility, clip: opening.clipPath, fieldOpacity: Number(getComputedStyle(field).opacity) } : null,
            glimmer: { count: glimmers.length, inkCount: composition?.querySelectorAll('.ambient-composition__ink').length ?? 0,
              times: glimmers.map((animation) => Number(animation.currentTime)), durations: [...new Set(glimmers.map((animation) => Number(animation.effect.getTiming().duration)))] },
            runningAnimations: animations.filter((animation) => animation.playState === 'running').length,
            legacyNodes: root.querySelectorAll('.settle-unit, .settle-candidate, .settle-draft, .settle-ink, .settle-field, .settle-mark').length })
          if (readyAt !== null && atMs - readyAt > 350) { resolve(); return }
          if (atMs - startedAt > input.clock.effectiveDurationMs + 3500) { reject(Error('Reading surface did not reach rest')); return }
          requestAnimationFrame(tick)
        } catch (error) { reject(error) }
      }
      requestAnimationFrame(tick)
    })
  } finally { mutation.disconnect() }
  return { ...input, startedAt, measuredAt: new Date().toISOString(), sourceCompleteAt, firstDomAt, firstInkAt, opaqueAt, readyAt,
    finalText: root.querySelector('.settle-page').textContent, nonemptyTextUpdates, textEvents, samples }
}

const range = (values) => values.length ? Math.max(...values) - Math.min(...values) : 0
const maximum = (values) => values.length ? Math.max(...values) : 0
const percentile = (values, q) => values.toSorted((a, b) => a - b)[Math.floor((values.length - 1) * q)] ?? null
export function summarizeResponsive(raw, meta = {}) {
  const failures = [], fail = (test, message) => { if (!test) failures.push(message) }
  fail(raw.samples.length > 20, 'insufficient samples')
  fail(raw.finalText === raw.expectedText && !!raw.finalText, 'final text differs')
  fail(raw.nonemptyTextUpdates === 1, 'not one whole-answer DOM insertion')
  const times = ['sourceCompleteAt', 'firstDomAt', 'firstInkAt', 'opaqueAt', 'readyAt'].map((key) => raw[key])
  fail(times.every((time, index) => Number.isFinite(time) && time >= 0 && (!index || time >= times[index - 1])), 'missing or unordered source/DOM/ink/opacity/rest times')
  const loading = raw.samples.filter((sample) => sample.status !== 'complete'), ready = raw.samples.filter((sample) => sample.visualReady)
  fail(loading.length > 5 && ready.length > 5, 'missing loading or rested observations')
  fail(raw.samples.every((sample) => sample.material === MATERIAL), 'wrong material')
  fail(loading.every((sample) => !sample.text && sample.releasedLength === 0), 'text before source finality')
  fail(raw.textEvents.filter((event) => event.text).every((event) => event.status === 'complete' && event.sourceElapsedMs + .1 >= raw.clock.effectiveFinalityAtMs), 'DOM exposed before independently derived source deadline')
  fail(raw.samples.every((sample) => sample.legacyNodes === 0 && sample.text.length === sample.releasedLength), 'legacy DOM or release length mismatch')
  fail(raw.samples.every((sample) => sample.passages.every((passage) => passage.filter === 'none' && passage.transform === 'none' && passage.opacity >= 0 && passage.opacity <= 1 && passage.top >= -.201 && passage.top <= 1.501)), 'ink left its material bounds')
  const fitting = raw.samples.filter((sample) => sample.phase === 'fitting'), arriving = raw.samples.flatMap((sample) => sample.passages.filter((passage) => passage.arriving))
  fail(fitting.every((sample) => sample.ambient && sample.passages.every((passage) => passage.visibility === 'hidden')), 'fit revealed only part of the answer')
  fail(arriving.length > 1 && arriving.every((passage) => passage.animationName === 'reading-ink-arrive' && Math.abs(parseFloat(passage.animationDuration) - .28) < .00001), 'missing 280ms ink handover')
  const blendFrames = raw.samples.filter((sample) => sample.passages.some((passage) => passage.opacity > .01 && passage.opacity < .99)).length
  fail(blendFrames > 0, 'no observed opacity handover')
  const transfers = raw.samples.flatMap((sample) => sample.transfer)
  fail(transfers.length > 0 && transfers.every((cell) => Math.abs(parseFloat(cell.duration) - .28) < .00001 && cell.alpha > 0 && cell.origin.width > 0 && cell.origin.height > 0 && cell.targetScale.every((value) => value > 0)), 'missing valid captured bubble transfer')
  const transferTravelPx = maximum(transfers.map((cell) => Math.hypot(cell.x - cell.origin.x, cell.y - cell.origin.y)))
  fail(Number.isFinite(transferTravelPx) && transferTravelPx > .1, 'captured bubbles did not move')
  fail(ready.every((sample) => sample.text === raw.expectedText && !sample.ambient && !sample.transfer.length && sample.runningAnimations === 0 && sample.passages.every((passage) => passage.opacity === 1 && passage.visibility === 'visible' && !passage.arriving && !passage.pending && passage.top === 0)), 'finished answer did not become plain stationary ink')
  fail(ready.every((sample) => Number.isFinite(sample.frame.height) && sample.frame.height > 0 && Math.abs(sample.frame.height - sample.page.height) < .1 && sample.frame.overflow === 'visible'
    && sample.passages.every((passage) => passage.wordBounds.length > 0 && passage.wordBounds.every((box) => box.width > 0 && box.height > 0 && box.x >= -.1 && box.y >= -.1 && box.x + box.width <= sample.frame.width + .1 && box.y + box.height <= sample.frame.height + .1))), 'final word rectangles leave their visible frame')
  let restDrift = 0
  if (ready.length) {
    const initial = ready[0].passages.flatMap((passage) => passage.glyphs)
    for (const sample of ready) sample.passages.flatMap((passage) => passage.glyphs).forEach((p, index) => {
      restDrift = Math.max(restDrift, Math.hypot(p[0] - initial[index][0], p[1] - initial[index][1]))
    })
  }
  fail(restDrift < .01, 'rested glyphs moved')
  const initialRows = loading[0]?.rows.map((row) => row.identity), rowCounts = loading.map((sample) => sample.rows.filter((row) => row.shown).length)
  fail(loading.every((sample) => sample.rows.length === 14 && sample.rows.every((row, index) => row.identity === initialRows[index])), 'waiting rows remounted')
  fail(rowCounts.every((count, index) => count >= 5 && count <= 14 && (!index || count >= rowCounts[index - 1])), 'waiting row budget invalid')
  fail(loading.every((sample) => sample.frame.height >= sample.lineHeight * 5 - 1 && sample.frame.height <= sample.lineHeight * 14 + 1), 'waiting frame outside typographic bounds')
  const shownRows = loading.flatMap((sample) => sample.rows.filter((row) => row.shown))
  const leftDrift = maximum(shownRows.map((row) => Math.abs(row.x)))
  let minGap = Infinity
  for (const row of shownRows) {
    const visible = row.pills.filter((pill) => pill.opacity > .01 && pill.width > .01)
    for (let index = 1; index < visible.length; index++) minGap = Math.min(minGap, visible[index].x - visible[index - 1].x - visible[index - 1].width)
  }
  fail(leftDrift < .05 && minGap >= -.05, 'left anchor or local cell overlap invalid')
  fail(shownRows.every((row) => row.pills.every((pill) => pill.filter === 'none' && pill.maskImage === 'none' && pill.backgroundImage === 'none' && pill.shadow === 'none' && parseFloat(pill.radius) > 0)), 'capsules lost solid rounded material')
  const reshaping = meta.condition === 'reshape'
  const glimmerSpread = maximum(loading.map((sample) => range(sample.glimmer.times)))
  const cellPositions = new Map()
  let cellMotionPx = 0
  for (const row of shownRows) for (const cell of row.pills) {
    if (!cellPositions.has(cell.identity)) cellPositions.set(cell.identity, cell)
    const first = cellPositions.get(cell.identity)
    cellMotionPx = Math.max(cellMotionPx, Math.abs(cell.x - first.x), Math.abs(cell.width - first.width))
  }
  if (reshaping) {
    fail(loading.every((sample) => sample.glimmer.count === sample.glimmer.inkCount && sample.glimmer.count > 0 && sample.glimmer.durations.length === 1 && sample.glimmer.durations[0] === 8000) && glimmerSpread <= 1, 'glimmer clock mismatch')
    fail(loading.some((sample) => sample.introduction?.fieldOpacity < .1 && sample.introduction?.opacity > .1) && loading.some((sample) => sample.introduction?.fieldOpacity === 1 && sample.introduction?.visibility === 'hidden'), 'intro handoff not observed')
    fail(range(loading.map((sample) => sample.activityMs)) > 1000, 'responsive activity clock did not advance')
    fail(cellMotionPx > .1, 'responsive cells did not change geometry')
  }
  const gaps = raw.samples.slice(1).map((sample, index) => sample.atMs - raw.samples[index].atMs)
  const summary = { ...meta, material: MATERIAL, measuredAt: raw.measuredAt, source: raw.sourceId, frames: raw.samples.length,
    exactFinalText: raw.finalText === raw.expectedText, nonemptyTextUpdates: raw.nonemptyTextUpdates, noEarlyText: loading.every((sample) => !sample.text),
    firstSampledSourceCompleteMs: raw.sourceCompleteAt, firstSampledDomMs: raw.firstDomAt, firstSampledInkMs: raw.firstInkAt, firstSampledFullOpacityMs: raw.opaqueAt, firstSampledRestMs: raw.readyAt,
    sourceToDomMs: raw.firstDomAt - raw.sourceCompleteAt, sourceToInkMs: raw.firstInkAt - raw.sourceCompleteAt,
    sourceToFullOpacityMs: raw.opaqueAt - raw.sourceCompleteAt, sourceToRestMs: raw.readyAt - raw.sourceCompleteAt,
    fittingFrames: fitting.length, blendFrames, transferFrames: raw.samples.filter((sample) => sample.transfer.length).length,
    maximumTransferCells: maximum(raw.samples.map((sample) => sample.transfer.length)), maximumTransferTravelPx: transferTravelPx, maximumCellMotionPx: cellMotionPx, handoverDurationMs: 280,
    minimumArrivalOpacity: Math.min(...arriving.map((passage) => passage.opacity)), maximumArrivalTopPx: maximum(arriving.map((passage) => passage.top)),
    restSamples: ready.length, restedGlyphDisplacementPx: restDrift, initialRows: rowCounts[0], maximumRows: maximum(rowCounts),
    waitingFrameGrowthPx: range(loading.map((sample) => sample.frame.height)), finalFrameHeightPx: ready.at(-1)?.frame.height,
    finalPageHeightPx: ready.at(-1)?.page.height, leftAnchorDriftPx: leftDrift, minimumVisibleCellGapPx: Number.isFinite(minGap) ? minGap : null,
    maximumGlimmerPhaseSpreadMs: glimmerSpread, frameGapP95Ms: percentile(gaps, .95), maximumFrameGapMs: maximum(gaps), guards: { passed: failures.length === 0, failures } }
  if (failures.length) throw Object.assign(Error(`${meta.name ?? 'observation'}: ${failures.join('; ')}`), { summary })
  return summary
}

export async function measureResponsive() {
  const root = process.cwd(), url = process.argv[2] ?? 'http://localhost:3000', implementation = await implementationSnapshot(root)
  const contract = { schemaVersion: 1, material: MATERIAL, fingerprint: fingerprint(implementation), playbackScale: .5, handoverDurationMs: 280, implementation }
  const fixtures = await Promise.all(Object.entries(SOURCES).map(async ([key, source]) => {
    const bytes = await readFile(path.join(root, source.file)); return { key, ...source, trace: JSON.parse(bytes), sha256: hash(bytes) }
  }))
  const cases = [390, 1380].flatMap((width) => ['static', 'breathe', 'reshape'].map((condition) => ({ width, condition, source: 'sleep' })))
  cases.push({ width: 390, condition: 'reshape', source: 'sky' }, { width: 390, condition: 'reshape', source: 'random' })
  const artifacts = path.join(root, ARTIFACTS), results = [], started = new Date().toISOString()
  await mkdir(artifacts, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const item of cases) {
      const fixture = fixtures.find((fixture) => fixture.key === item.source), clock = capturedClock(fixture.trace, .5)
      const name = `${item.width}-${item.condition}${item.source === 'sleep' ? '' : `-${item.source}`}`, viewport = { width: item.width, height: item.width === 390 ? 844 : 900 }
      const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' })
      try {
        const page = await context.newPage(), errors = []
        page.on('pageerror', (error) => errors.push(error.message))
        await page.goto(url, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready)
        const study = page.locator('.ambient-study')
        await study.getByRole('radiogroup', { name: 'recording', exact: true }).getByRole('radio', { name: fixture.label, exact: true }).click()
        await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: '0.5× inspection', exact: true }).click()
        await study.getByRole('radiogroup', { name: 'motion study', exact: true }).getByRole('radio', { name: item.condition === 'static' ? 'still' : item.condition, exact: true }).click()
        const surface = study.locator(`.settle[data-ambient-condition="${item.condition}"]`)
        await surface.scrollIntoViewIfNeeded(); await expect(surface).toHaveAttribute('data-visible', 'true')
        await expect.poll(async () => Math.abs(Number(await study.getAttribute('data-duration-ms')) - clock.effectiveDurationMs)).toBeLessThan(.05)
        const raw = await surface.evaluate(observeResponsive, { ...contract, expectedText: fixture.trace.answer, sourceId: fixture.trace.id, clock })
        await writeFile(path.join(artifacts, `${name}-raw.json`), JSON.stringify(raw))
        if (errors.length) throw Error(`Browser errors: ${errors.join('; ')}`)
        const summary = summarizeResponsive(raw, { name, viewport, condition: item.condition })
        results.push(summary); console.log(JSON.stringify(summary))
      } finally { await context.close() }
    }
    const report = { ...contract, measurementStartedAt: started, measuredAt: new Date().toISOString(), url, browser: 'Chromium', browserVersion: browser.version(),
      sourceFixtures: fixtures.map(({ file, sha256, trace }) => ({ file, sha256, id: trace.id })), results,
      method: 'Eight sequential browser observations: six sleep-list condition×viewport cases plus narrow sky and random cases. An observer records whole-answer DOM changes; one rAF sampler records geometry, computed styles and one animation subtree list per frame. Raw samples remain separate from passive showcase videos.',
      clocks: 'Source capture-loop intervals are explicitly replayed at0.5× inspection. Local activity, intro and handover retain their authored timings. Source-complete, DOM insertion, first positive ink opacity, full ink opacity, and fully settled/unoccluded readiness are first sampled browser events; neither source clock nor rendering delays are API latency.',
      caveats: ['No physical device FPS or reader-benefit evidence.', 'Instrumented rAF gaps are diagnostic only, not rendering-cost comparisons.', 'Source policies, opacity handover and size fitting have distinct timing costs.', 'Capsule division, seeded activity, breathing, glimmer, occupancy response and handover are a bundled treatment.', 'Opacity1 can precede the end of the280ms movement/transfer; readiness is measured separately.', 'Numeric occupancy is a causal approximate budget, not future word layout or percent complete.'],
    }
    const archived = await archiveResponsive(report, root)
    await writeFile(path.join(root, REPORT), JSON.stringify(archived, null, 2) + '\n')
  } finally { await browser.close() }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await measureResponsive()

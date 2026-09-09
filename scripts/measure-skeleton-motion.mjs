import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  archiveSkeletonMotion, assertSkeletonCompatibility, readOptionalJSON, skeletonHash,
  skeletonImplementationSnapshot, SKELETON_ARTIFACTS, SKELETON_MATERIAL, SKELETON_REPORT,
} from './archive-skeleton-motion.mjs'

/** Resolve the implemented rounded inset against the untransformed border box.
 * These are geometric clipping extrema, not sampled raster/antialiasing edges.
 * Reject unsupported syntax rather than treating an unknown shape as no clip.
 * This same function is injected into the measurement page, without app edits. */
export function parseRoundedInset(value, width, height) {
  if (!(width > 0) || !(height > 0)) throw Error('Cannot measure an empty ink box')
  if (value === 'none') return { top: 0, right: 0, bottom: 0, left: 0, radius: null }
  const match = /^inset\(([^()]+)\)$/.exec(value.trim())
  if (!match) throw Error(`Unsupported skeleton clip-path: ${value}`)
  const sections = match[1].split(/\s+round\s+/)
  if (sections.length > 2) throw Error(`Unsupported rounded inset: ${value}`)
  const lengths = sections[0].trim().split(/\s+/)
  if (lengths.length < 1 || lengths.length > 4) throw Error(`Unsupported inset lengths: ${value}`)
  const four = lengths.length === 1 ? [lengths[0], lengths[0], lengths[0], lengths[0]]
    : lengths.length === 2 ? [lengths[0], lengths[1], lengths[0], lengths[1]]
      : lengths.length === 3 ? [lengths[0], lengths[1], lengths[2], lengths[1]] : lengths
  const resolve = (length, dimension) => {
    const parsed = /^(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(px|%)?$/i.exec(length)
    if (!parsed || (!parsed[2] && Number(parsed[1]) !== 0)) throw Error(`Unsupported inset unit: ${length}`)
    return Number(parsed[1]) * (parsed[2] === '%' ? dimension / 100 : 1)
  }
  const [top, right, bottom, left] = four.map((length, index) => resolve(length, index % 2 ? width : height))
  if ([top, right, bottom, left].some((length) => !Number.isFinite(length) || length < 0) || top + bottom >= height || left + right >= width) throw Error('Rounded inset is empty or extends outside its ink box')
  let radius = null
  if (sections[1]) {
    const radii = sections[1].trim().split(/\s+/)
    if (radii.length !== 1) throw Error(`Unsupported nonuniform corner radius: ${value}`)
    radius = resolve(radii[0], Math.min(width, height))
  }
  return { top, right, bottom, left, radius }
}

/** Independent fixture oracle for these committed-token recordings. It reads
 * retrospective answer text only to verify the test input; none reaches the UI.
 * An early contiguous EOS may precede the final recorded evaluation. */
export function capturedClock(trace, playbackScale = .5) {
  if (!(playbackScale > 0) || !Number.isFinite(playbackScale)) throw Error('Invalid inspection speed')
  let total = 0
  const ends = trace.step_wall_ms.map((interval) => {
    if (!Number.isFinite(interval) || interval < 0) throw Error('Invalid captured interval')
    total += interval
    return total
  })
  const tokens = new Map()
  for (const token of trace.tokens) {
    if (!Number.isSafeInteger(token.pos) || token.pos < 0 || !Number.isSafeInteger(token.step) || token.step < 0 || token.step >= ends.length || tokens.has(token.pos)) throw Error('Invalid/duplicate recorded commitment')
    tokens.set(token.pos, token)
  }
  let text = '', latestStep = 0, capturedFinalityAtMs = null, finality = null
  for (let position = 0; position < trace.sampler.max_new_tokens; position += 1) {
    const token = tokens.get(position)
    if (!token) break
    latestStep = Math.max(latestStep, token.step)
    if (token.text === '<|endoftext|>' || token.text === '<|im_end|>') {
      capturedFinalityAtMs = ends[latestStep]
      finality = 'contiguous committed EOS'
      break
    }
    text += token.text
    if (position === trace.sampler.max_new_tokens - 1 && tokens.size === trace.sampler.max_new_tokens) {
      capturedFinalityAtMs = total
      finality = 'valid final committed-prefix count'
    }
  }
  if (capturedFinalityAtMs === null) throw Error('Recording has no valid source finality')
  if (text !== trace.answer) throw Error('Recorded committed prefix is not the exact expected answer')
  return { capturedDurationMs: total, capturedFinalityAtMs, effectiveDurationMs: total / playbackScale, effectiveFinalityAtMs: capturedFinalityAtMs / playbackScale, playbackScale, finality }
}

const choices = {
  sleep: { file: 'parallel-qwen-2026-09-09/compact/sleep-tips__lowconf-b128-s32.json', label: 'a numbered list' },
  sky: { file: 'parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json', label: 'an explanation' },
  random: { file: 'parallel-qwen-random-2026-09-09/compact/sleep-tips__random-b128-s32.json', label: 'a failed answer' },
}
const percentile = (values, proportion) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor((sorted.length - 1) * proportion)]
}
const minimum = (values) => values.reduce((result, value) => Math.min(result, value), Infinity)
const maximum = (values) => values.reduce((result, value) => Math.max(result, value), -Infinity)
const spread = (values) => maximum(values) - minimum(values)

async function observeSurface(host, input) {
  const study = host.closest('.ambient-study')
  const replay = [...study.querySelectorAll('button')].find((button) => /replay/i.test(button.getAttribute('aria-label') ?? button.textContent))
  if (!replay) throw Error('Study replay control not found')
  const samples = [], transitions = [], seenAccents = new WeakSet()
  let lastText = host.querySelector('.settle-page')?.textContent ?? ''
  let nonemptyTextUpdates = 0, arrivalInsertions = 0
  const observer = new MutationObserver((records) => {
    const text = host.querySelector('.settle-page')?.textContent ?? ''
    if (text !== lastText) {
      transitions.push({ atMs: performance.now(), text, status: host.dataset.status, sourceElapsedMs: Number(study.dataset.elapsedMs) })
      if (text) nonemptyTextUpdates += 1
      lastText = text
    }
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof Element)) continue
      const accents = [...(node.matches('.settle-answer-arrival') ? [node] : []), ...node.querySelectorAll('.settle-answer-arrival')]
      for (const accent of accents) if (!seenAccents.has(accent)) { seenAccents.add(accent); arrivalInsertions += 1 }
    }
  })
  observer.observe(host, { subtree: true, childList: true, characterData: true })
  replay.click()
  const clickAt = performance.now()
  const exposedDurationMs = Number(study.dataset.durationMs)
  if (!Number.isFinite(exposedDurationMs) || Math.abs(exposedDurationMs - input.clock.effectiveDurationMs) > .05) throw Error('The UI is not using the required 0.5× captured clock')
  let origin = null, previousAt = null, firstFinalAt = null, firstReadableAt = null, firstDeadlineAt = null
  const decorationStyle = (style) => ({
    filter: style.filter, backdropFilter: style.backdropFilter || 'none', maskImage: style.maskImage || 'none',
    webkitMaskImage: style.webkitMaskImage || 'none', backgroundImage: style.backgroundImage,
    backgroundColor: style.backgroundColor, boxShadow: style.boxShadow, color: style.color,
    transform: style.transform, translate: style.translate || 'none', scale: style.scale || 'none', rotate: style.rotate || 'none',
    opacity: Number(style.opacity), visibility: style.visibility, borderRadius: style.borderTopLeftRadius,
  })
  try {
    await new Promise((resolve, reject) => {
      const tick = (now) => {
        try {
          if (origin === null) origin = now
          const outer = host.getBoundingClientRect(), frame = host.querySelector('.settle-answer-frame').getBoundingClientRect()
          const page = host.querySelector('.settle-page'), text = page.textContent ?? '', status = host.dataset.status
          const elapsed = Number(study.dataset.elapsedMs)
          if (elapsed >= input.clock.effectiveFinalityAtMs && firstDeadlineAt === null) firstDeadlineAt = now
          if (status === 'complete' && firstFinalAt === null) firstFinalAt = now
          if (text && firstReadableAt === null) firstReadableAt = now
          const composition = host.querySelector('.ambient-composition'), compositionRect = composition?.getBoundingClientRect()
          const glyphs = [], textInk = host.querySelector('.settle-answer-text')
          let readableStyle = null
          if (textInk) {
            const style = getComputedStyle(textInk)
            readableStyle = { filter: style.filter, opacity: Number(style.opacity), transform: style.transform, visibility: style.visibility }
            const node = textInk.firstChild
            if (node?.nodeType === Node.TEXT_NODE) for (const match of node.textContent.matchAll(/\S+/g)) {
              const range = document.createRange()
              range.setStart(node, match.index); range.setEnd(node, match.index + 1)
              const rect = range.getBoundingClientRect()
              glyphs.push({ offset: match.index, x: rect.x - outer.x, y: rect.y - outer.y })
            }
          }
          const bars = [...host.querySelectorAll('.ambient-composition__bar')].map((bar, index) => {
            const ink = bar.querySelector('.ambient-composition__ink')
            if (!ink) throw Error('Missing skeleton ink')
            const rect = bar.getBoundingClientRect(), inkRect = ink.getBoundingClientRect()
            const style = getComputedStyle(bar), inkStyle = getComputedStyle(ink)
            const clip = globalThis.__parseSkeletonInset(inkStyle.clipPath, inkRect.width, inkRect.height)
            const visibleLeft = inkRect.left + clip.left, visibleRight = inkRect.right - clip.right
            const visibleTop = inkRect.top + clip.top, visibleBottom = inkRect.bottom - clip.bottom
            const pulse = bar.getAnimations()[0], shape = ink.getAnimations()[0]
            return {
              index, x: rect.x - outer.x, y: rect.y - outer.y, width: rect.width, height: rect.height,
              inkBox: { x: inkRect.x - outer.x, y: inkRect.y - outer.y, width: inkRect.width, height: inkRect.height },
              visibleInk: { left: visibleLeft - outer.x, right: visibleRight - outer.x, top: visibleTop - outer.y, bottom: visibleBottom - outer.y, width: visibleRight - visibleLeft, height: visibleBottom - visibleTop },
              compositionBounds: { left: compositionRect.left - outer.x, right: compositionRect.right - outer.x, top: compositionRect.top - outer.y, bottom: compositionRect.bottom - outer.y },
              clipPath: inkStyle.clipPath, clip, barStyle: decorationStyle(style), inkStyle: decorationStyle(inkStyle),
              pulseTimeMs: pulse ? Number(pulse.currentTime) : null, pulseDurationMs: pulse ? Number(pulse.effect.getTiming().duration) : null,
              shapeTimeMs: shape ? Number(shape.currentTime) : null, shapeDurationMs: shape ? Number(shape.effect.getTiming().duration) : null,
            }
          })
          const accent = host.querySelector('.settle-answer-arrival'), accentStyle = accent ? getComputedStyle(accent) : null
          samples.push({ atMs: now - origin, gapMs: previousAt === null ? null : now - previousAt,
            sourceElapsedMs: elapsed, sourceStatus: status, active: host.dataset.active === 'true', visible: host.dataset.visible === 'true',
            frameHeight: frame.height, outerHeight: outer.height, pageHeight: page.getBoundingClientRect().height, fontSize: parseFloat(getComputedStyle(host).fontSize),
            textLength: text.length, textExact: text === input.expectedText, bars, glyphs, readableStyle,
            arrival: accentStyle ? { ...decorationStyle(accentStyle), borderWidth: parseFloat(accentStyle.borderTopWidth), borderStyle: accentStyle.borderTopStyle } : null,
          })
          previousAt = now
          if (firstFinalAt !== null && now - firstFinalAt >= 1000) resolve()
          else if (now - clickAt > exposedDurationMs + 8000) reject(Error('Source did not finish within the measurement timeout'))
          else requestAnimationFrame(tick)
        } catch (error) { reject(error) }
      }
      requestAnimationFrame(tick)
    })
  } finally { observer.disconnect() }
  return { ...input.contract, sourceId: input.sourceId, clock: input.clock, expectedText: input.expectedText,
    exposedDurationMs, samples, transitions: transitions.map((entry) => ({ ...entry, atMs: entry.atMs - clickAt })),
    nonemptyTextUpdates, arrivalInsertions, remainingArrivalNodes: host.querySelectorAll('.settle-answer-arrival').length,
    firstFinalAtMs: firstFinalAt === null ? null : firstFinalAt - clickAt,
    firstReadableAtMs: firstReadableAt === null ? null : firstReadableAt - clickAt,
    observedSourceDeadlineToReadableMs: firstDeadlineAt === null || firstReadableAt === null ? null : firstReadableAt - firstDeadlineAt,
    horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth), finalText: host.querySelector('.settle-page').textContent,
  }
}

export function summarizeSkeleton(raw, identity) {
  const fail = (message) => { throw Error(`${identity.name}: ${message}`) }
  const loading = raw.samples.filter((sample) => sample.sourceStatus !== 'complete'), final = raw.samples.filter((sample) => sample.sourceStatus === 'complete')
  if (!loading.length || !final.length || !loading.every((sample) => sample.active && sample.visible)) fail('missing loading/final samples or measured surface left the active viewport')
  if (loading.some((sample) => sample.textLength) || raw.transitions.some((entry) => entry.text && (entry.status !== 'complete' || entry.sourceElapsedMs + .01 < raw.clock.effectiveFinalityAtMs))) fail('readable text appeared before source finality')
  if (raw.finalText !== raw.expectedText || raw.nonemptyTextUpdates !== 1 || final.some((sample) => !sample.textExact || sample.bars.length)) fail('answer did not arrive exactly once or loading survived completion')
  if (raw.arrivalInsertions !== 1 || raw.remainingArrivalNodes !== 0) fail('completion cue did not run once and leave')
  if (raw.horizontalOverflowPx > 1) fail('horizontal document overflow')
  const blurredFinal = final.filter((sample) => !sample.readableStyle || sample.readableStyle.filter !== 'none' || sample.readableStyle.opacity !== 1 || sample.readableStyle.transform !== 'none' || sample.readableStyle.visibility !== 'visible').length
  if (blurredFinal) fail('final text is faded, filtered, transformed, or hidden')
  const accents = final.flatMap((sample) => sample.arrival ? [sample.arrival] : [])
  if (!accents.length || accents.some((style) => style.filter !== 'none' || style.boxShadow !== 'none' || style.backgroundImage !== 'none' || style.maskImage !== 'none' || style.borderWidth <= 0 || style.borderStyle === 'none')) fail(`completion cue is not a visible crisp outline: ${JSON.stringify(accents[0] ?? null)}`)
  const visibleEdgeDeltas = [], ordinaryEdges = [], opacityDeltas = [], finalGlyphDeltas = [], heightDrifts = [], clipSpreads = [], opacitySpreads = []
  const baselines = new Map(), glyphs = new Map(), previous = new Map()
  const widths = [.88, .64, .92, .72, .80]
  for (const sample of loading) {
    if (sample.bars.length !== 5) fail('missing authored bars')
    if (Math.abs(sample.frameHeight - sample.fontSize * 8) > .1) fail('loading frame is not the fixed 8em allocation')
    clipSpreads.push(spread(sample.bars.map((bar) => bar.clip.left / bar.inkBox.width)))
    opacitySpreads.push(spread(sample.bars.map((bar) => bar.barStyle.opacity)))
    for (const bar of sample.bars) {
      const { visibleInk: ink, compositionBounds: bounds } = bar
      if (!(ink.width > ink.height) || Math.abs(ink.height - .72 * sample.fontSize) > .1) fail('ink lost its fixed .72em height or positive pill width')
      if (Math.abs(bar.width - widths[bar.index] * (bounds.right - bounds.left)) > .1 || Math.abs(bar.x - bounds.left) > .1) fail('bar layout differs from the authored left-aligned widths')
      if (ink.left < bounds.left - .1 || ink.right > bounds.right + .1 || ink.top < bounds.top - .1 || ink.bottom > bounds.bottom + .1) fail('visible end or edge is clipped by the composition bounds')
      if (Math.abs(bar.clip.left - bar.clip.right) > .05 || bar.clip.top !== 0 || bar.clip.bottom !== 0) fail('reshape is not centered with unchanged height')
      const radius = bar.clip.radius ?? parseFloat(bar.inkStyle.borderRadius)
      if (!(radius >= ink.height / 2)) fail('ink does not have fully rounded ends')
      for (const style of [bar.barStyle, bar.inkStyle]) {
        if (style.filter !== 'none' || style.backdropFilter !== 'none' || style.maskImage !== 'none' || style.webkitMaskImage !== 'none' || style.backgroundImage !== 'none' || style.boxShadow !== 'none') fail('blur, mask, gradient, or shadow appeared in solid bars')
        if (style.transform !== 'none' || style.translate !== 'none' || style.scale !== 'none' || style.rotate !== 'none') fail('bar translation or scaling appeared')
      }
      if (Math.abs(bar.inkStyle.opacity - .2) > .002 || bar.inkStyle.backgroundColor !== bar.inkStyle.color || bar.inkStyle.visibility !== 'visible') fail('ink is not the expected uniform visible currentColor fill')
      if (!baselines.has(bar.index)) baselines.set(bar.index, bar)
      heightDrifts.push(Math.abs(ink.height - baselines.get(bar.index).visibleInk.height))
      const before = previous.get(bar.index)
      if (before) {
        const edge = maximum(['left', 'right', 'top', 'bottom'].map((key) => Math.abs(ink[key] - before.visibleInk[key])))
        visibleEdgeDeltas.push(edge)
        if (sample.gapMs !== null && sample.gapMs <= 34) ordinaryEdges.push(edge)
        opacityDeltas.push(Math.abs(bar.barStyle.opacity - before.barStyle.opacity))
      }
      previous.set(bar.index, bar)
    }
  }
  for (const sample of final) for (const glyph of sample.glyphs) {
    const first = glyphs.get(glyph.offset)
    if (first) finalGlyphDeltas.push(Math.hypot(glyph.x - first.x, glyph.y - first.y))
    else glyphs.set(glyph.offset, glyph)
  }
  if (!visibleEdgeDeltas.length || !finalGlyphDeltas.length) fail('no matching edge/glyph samples; refusing empty zero metrics')
  if (maximum(finalGlyphDeltas) > .05 || maximum(heightDrifts) > .05 || spread(loading.map((sample) => sample.frameHeight)) > .05) fail('final glyphs or loading height moved')
  const perBar = widths.map((_, index) => {
    const values = loading.map((sample) => sample.bars[index])
    const opacity = values.map((bar) => bar.barStyle.opacity), ratios = values.map((bar) => bar.visibleInk.width / bar.inkBox.width)
    const pulseTimes = values.flatMap((bar) => bar.pulseTimeMs === null ? [] : [bar.pulseTimeMs])
    const shapeTimes = values.flatMap((bar) => bar.shapeTimeMs === null ? [] : [bar.shapeTimeMs])
    if (identity.condition === 'static') {
      if (opacity.some((value) => Math.abs(value - .86) > .002) || spread(ratios) > .001 || ratios.some((value) => Math.abs(value - 1) > .001)) fail('static treatment changed opacity or shape')
    } else {
      if (minimum(opacity) < .719 || maximum(opacity) > 1.001 || spread(opacity) < .27) fail('required .72-to-1 opacity cycle was not observed')
      if (!pulseTimes.length || spread(pulseTimes) < 4800 || values.some((bar) => Math.abs(bar.pulseDurationMs - 4800) > .1)) fail('less than one full 4800ms pulse cycle observed')
      if (identity.condition === 'breathe' && ratios.some((value) => Math.abs(value - 1) > .001)) fail('opacity-only treatment changed its silhouette')
      if (identity.condition === 'reshape' && (minimum(ratios) < .839 || maximum(ratios) > 1.001 || spread(ratios) < .15 || !shapeTimes.length || spread(shapeTimes) < 4800 || values.some((bar) => Math.abs(bar.shapeDurationMs - 4800) > .1))) fail('required bounded full reshape cycle was not observed')
    }
    return { index, opacityMinimum: minimum(opacity), opacityMaximum: maximum(opacity), visibleWidthRatioMinimum: minimum(ratios), visibleWidthRatioMaximum: maximum(ratios), observedPulseTimeSpanMs: pulseTimes.length ? spread(pulseTimes) : null, observedShapeTimeSpanMs: shapeTimes.length ? spread(shapeTimes) : null }
  })
  const gaps = raw.samples.flatMap((sample) => sample.gapMs === null ? [] : [sample.gapMs])
  return { ...identity, clock: raw.clock, frames: raw.samples.length, loadingFrames: loading.length, finalFrames: final.length,
    frameGapP95Ms: percentile(gaps, .95), frameGapMaximumMs: maximum(gaps), frameGapsOver34Ms: gaps.filter((gap) => gap > 34).length,
    visibleInkEdgeSamples: visibleEdgeDeltas.length, ordinaryFrameEdgeSamples: ordinaryEdges.length, visibleInkEdgeDeltaP99Px: percentile(visibleEdgeDeltas, .99), visibleInkEdgeDeltaMaximumPx: maximum(visibleEdgeDeltas), visibleInkEdgeDeltaMaximumUnder34MsPx: percentile(ordinaryEdges, 1),
    opacityDeltaP99: percentile(opacityDeltas, .99), opacityDeltaMaximum: maximum(opacityDeltas), maximumHeightDriftPx: maximum(heightDrifts),
    withinFrameClipInsetRatioSpreadMaximum: maximum(clipSpreads), withinFrameOpacitySpreadMaximum: maximum(opacitySpreads), perBar,
    matchedFinalGlyphSamples: finalGlyphDeltas.length, finalGlyphMaximumDisplacementPx: maximum(finalGlyphDeltas),
    loadingFrameMinimumHeightPx: minimum(loading.map((sample) => sample.frameHeight)), loadingFrameMaximumHeightPx: maximum(loading.map((sample) => sample.frameHeight)), finalFrameHeightPx: final.at(-1).frameHeight,
    finalMinusLastLoadingFrameHeightPx: final[0].frameHeight - loading.at(-1).frameHeight,
    loadingContainerMinimumHeightPx: minimum(loading.map((sample) => sample.outerHeight)), loadingContainerMaximumHeightPx: maximum(loading.map((sample) => sample.outerHeight)), finalContainerHeightPx: final.at(-1).outerHeight,
    finalMinusLastLoadingContainerHeightPx: final[0].outerHeight - loading.at(-1).outerHeight,
    nonemptyTextUpdates: raw.nonemptyTextUpdates, arrivalInsertions: raw.arrivalInsertions, remainingArrivalNodes: raw.remainingArrivalNodes,
    firstReadableAtMs: raw.firstReadableAtMs, firstFinalAtMs: raw.firstFinalAtMs, observedSourceDeadlineToReadableMs: raw.observedSourceDeadlineToReadableMs,
    prefinalTextFrames: 0, blurredFadedOrTransformedFinalTextFrames: blurredFinal, horizontalOverflowPx: raw.horizontalOverflowPx, exactFinalText: true, solidMaterialGuardsPassed: true,
  }
}

export async function measureSkeletonMotion() {
  const { chromium, expect } = await import('@playwright/test')
  const root = process.cwd(), url = process.argv[2] ?? 'http://localhost:3000'
  const output = path.resolve(process.argv[3] ?? path.join(root, SKELETON_REPORT)), artifacts = path.join(root, SKELETON_ARTIFACTS)
  if (!path.basename(output).startsWith('skeleton-')) throw Error('Refusing a report outside the skeleton namespace')
  const source = process.env.SKELETON_SOURCE ?? 'sleep'
  if (!choices[source]) throw Error('SKELETON_SOURCE must be sleep, sky, or random')
  const implementation = await skeletonImplementationSnapshot(root)
  const sourceFixtures = await Promise.all(Object.entries(choices).map(async ([key, choice]) => {
    const file = `data/experiments/${choice.file}`, bytes = await readFile(path.join(root, file)), trace = JSON.parse(bytes)
    return { key, id: trace.id, file, sha256: skeletonHash(bytes), clock: 'step_wall_ms' }
  }))
  const contract = { schemaVersion: 1, material: SKELETON_MATERIAL, playbackScale: .5, cyclePeriodMs: 4800,
    fingerprint: skeletonHash(JSON.stringify({ implementation, sourceFixtures, material: SKELETON_MATERIAL, playbackScale: .5, cyclePeriodMs: 4800 })) }
  const trace = JSON.parse(await readFile(path.join(root, 'data/experiments', choices[source].file), 'utf8')), clock = capturedClock(trace, .5)
  const existing = await readOptionalJSON(output)
  if (existing) {
    assertSkeletonCompatibility(existing, contract)
    if (process.env.SKELETON_APPEND !== '1') throw Error('A matching skeleton report already exists; use SKELETON_APPEND=1 to extend it explicitly')
  } else if (process.env.SKELETON_APPEND === '1') throw Error('Cannot append: skeleton report does not exist')
  const results = existing ? [...existing.results] : [], measurementStartedAt = existing?.measurementStartedAt ?? new Date().toISOString()
  const cases = source === 'sleep'
    ? [{ width: 390, height: 844 }, { width: 1380, height: 900 }].flatMap((viewport) => ['static', 'breathe', 'reshape'].map((condition) => ({ viewport, condition })))
    : [{ viewport: { width: 390, height: 844 }, condition: 'reshape' }]
  if (process.env.SKELETON_CASE && !cases.some(({ viewport, condition }) => `${viewport.width}-${condition}` === process.env.SKELETON_CASE)) throw Error('SKELETON_CASE does not match this source comparison')
  await mkdir(artifacts, { recursive: true })
  const browser = await chromium.launch()
  try {
    if (existing && existing.browserVersion !== browser.version()) throw Error('Incompatible browser version for skeleton append')
    for (const { viewport, condition } of cases) {
      const caseName = `${viewport.width}-${condition}`, name = source === 'sleep' ? caseName : `${caseName}-${source}`
      if (process.env.SKELETON_CASE && process.env.SKELETON_CASE !== caseName) continue
      if (results.some((result) => result.name === name)) throw Error(`${name}: refusing to overwrite an existing observation`)
      const measuredAt = new Date().toISOString()
      const context = await browser.newContext({ viewport, reducedMotion: 'no-preference', recordVideo: { dir: artifacts, size: viewport } })
      try {
        const page = await context.newPage()
        await page.addInitScript({ content: `globalThis.__parseSkeletonInset = ${parseRoundedInset.toString()}` })
        await page.goto(url, { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
        const study = page.locator('.ambient-study')
        await study.waitFor({ state: 'attached' })
        if (source !== 'sleep') await study.getByRole('radiogroup', { name: 'recording', exact: true }).getByRole('radio', { name: choices[source].label, exact: true }).click()
        await expect(study).toHaveAttribute('data-source-id', trace.id)
        await study.getByRole('radiogroup', { name: 'clock', exact: true }).getByRole('radio', { name: '0.5× inspection', exact: true }).click()
        await expect.poll(async () => Math.abs(Number(await study.getAttribute('data-duration-ms')) - clock.effectiveDurationMs)).toBeLessThan(.05)
        if (viewport.width < 768) await study.getByRole('radiogroup', { name: 'motion study', exact: true }).getByRole('radio', { name: { static: 'still', breathe: 'breathe', reshape: 'reshape' }[condition], exact: true }).click()
        const surface = study.locator(`.settle[data-ambient-condition="${condition}"]`)
        await surface.scrollIntoViewIfNeeded()
        await page.waitForTimeout(750)
        await surface.screenshot({ path: path.join(artifacts, `${name}-loading.png`) })
        const raw = await surface.evaluate(observeSurface, { expectedText: trace.answer, sourceId: trace.id, clock, contract })
        // Preserve a failed observation for diagnosis, never as a passed report.
        await writeFile(path.join(artifacts, `${name}-raw.json`), JSON.stringify(raw))
        const summary = summarizeSkeleton(raw, { name, viewport, condition, source: trace.id, measuredAt })
        await surface.screenshot({ path: path.join(artifacts, `${name}-final.png`) })
        const video = page.video()
        await context.close()
        await video.saveAs(path.join(artifacts, `${name}.webm`))
        results.push(summary)
        console.log(JSON.stringify(summary))
      } finally { await context.close() }
    }
    const report = { ...contract, implementation, sourceFixtures, measurementStartedAt, measuredAt: new Date().toISOString(),
      url, browser: 'Chromium', browserVersion: browser.version(), revision: process.env.MOTION_REVISION ?? 'working tree',
      calibrationSource: 'sleep-tips__lowconf-b128-s32', sources: { ...(existing?.sources ?? {}), [trace.id]: clock },
      metricDefinitions: {
        clocks: 'Captured duration/finality use the original observed capture-loop intervals. Effective duration/finality divide them by 0.5 because the UI explicitly uses half-speed inspection. Neither is API latency; decorative cycles remain 4800ms.',
        visibleInkEdges: 'Resolve the actual computed rounded inset (px or %) against each untransformed inner ink rectangle. Left/right/top/bottom are the rounded silhouette geometric extrema; these are not pixel-level antialiasing measurements. The guard rejects transforms, masks, gradients, filters and shadows.',
        opacity: 'Computed parent opacity, distinct from the constant 0.20 inner ink opacity. Static is 0.86; breathe/reshape must exhibit the full bounded .72-to-1 cycle. Per-bar animation current-time spans must cover at least 4800ms.',
        frameGaps: 'Observed rAF intervals on this development machine with measurement instrumentation. Diagnostic only; not a physical-device or rendering-cost benchmark.',
        glyphDisplacement: 'Each final whitespace word first character is measured using a DOM Range relative to its first final frame and the answer surface. Exact full text and one nonempty DOM update are checked independently.',
        finalityDelay: 'First sampled readable text frame minus the first frame where the UI clock reaches the independently derived causal finality time. Zero is same sampled frame, not zero compositor/input latency.',
        heightChange: 'Loading height stability is checked independently from the first whole-answer height increase. A final answer can exceed the authored 8em waiting area.',
        comparison: 'Six short-list calibration cases use three appearances at 390/1380 widths. Two additional narrow reshape sky/random recordings inspect long/failing text. Every case explicitly selects 0.5× inspection in a fresh page; sequential observations are not a randomized reader or performance study.',
      },
      caveats: ['No physical iPhone measurements.', 'No reader preference, comprehension, trust, dopamine, latency-benefit, or novelty claims.', 'Whole-answer presentation withholds earlier readable text.', 'Half-speed playback is an explicitly labeled inspection aid, not recorded production latency.', 'Clip-path shape animation is not assumed to run exclusively on the compositor.'], results,
    }
    await writeFile(output, JSON.stringify(await archiveSkeletonMotion(report, root, artifacts), null, 2) + '\n')
  } finally { await browser.close() }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await measureSkeletonMotion()

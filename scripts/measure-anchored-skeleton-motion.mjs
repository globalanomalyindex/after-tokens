import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  archiveSkeletonMotion, assertSkeletonCompatibility, readOptionalJSON, skeletonHash,
  skeletonImplementationSnapshot, SKELETON_ARTIFACTS, SKELETON_MATERIAL, SKELETON_REPORT,
} from './archive-anchored-skeleton-motion.mjs'

export function parseVerticalTransform(value) {
  if (value === 'none') return { scaleY: 1, translateY: 0 }
  const match = /^matrix\(([^)]+)\)$/.exec(value)
  if (!match) throw Error(`Unsupported anchored transform: ${value}`)
  const values = match[1].split(',').map(Number)
  if (values.length !== 6 || values.some((number) => !Number.isFinite(number)) || Math.abs(values[0] - 1) > .000001 || [values[1], values[2], values[4]].some((number) => Math.abs(number) > .000001) || values[3] <= 0) throw Error(`Nonvertical anchored transform: ${value}`)
  return { scaleY: values[3], translateY: values[5] }
}

export function parseVerticalTranslate(value) {
  if (value === 'none') return 0
  const pieces = value.trim().split(/\s+/)
  if (pieces.length < 1 || pieces.length > 2) throw Error(`Unsupported anchored translate: ${value}`)
  const values = pieces.map((piece) => {
    if (!/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?px$/i.test(piece) && piece !== '0') throw Error(`Unsupported anchored translate length: ${piece}`)
    return parseFloat(piece)
  })
  if (Math.abs(values[0]) > .000001) throw Error(`Horizontal anchored translation: ${value}`)
  return values[1] ?? 0
}

export function parseHorizontalTransform(value) {
  const match = /^matrix\(([^)]+)\)$/.exec(value)
  if (!match) throw Error(`Unsupported glimmer transform: ${value}`)
  const values = match[1].split(',').map(Number)
  if (values.length !== 6 || values.some((number) => !Number.isFinite(number)) || Math.abs(values[0] - 1) > .000001 || Math.abs(values[3] - 1) > .000001 || [values[1], values[2], values[5]].some((number) => Math.abs(number) > .000001)) throw Error(`Nonhorizontal glimmer transform: ${value}`)
  return values[4]
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

export const ROWS = [
  { width: .88, top: .55, kind: 'line', phase: 0, pills: [[0, 100, 0, 100]] },
  { width: .92, top: 1.92, kind: 'cluster', phase: 0, newborn: 1, pills: [[0,25,0,20],[27,0,22,13],[27,32,37,25],[61,16,64,13],[79,21,79,21]] },
  { width: .96, top: 3.31, kind: 'line', phase: 0, pills: [[0,100,0,100]] },
  { width: .84, top: 4.69, kind: 'cluster', phase: .43, newborn: 2, pills: [[0,33,0,24],[35,24,26,22],[61,0,50,15],[61,39,67,33]] },
  { width: .70, top: 6.05, kind: 'cluster', phase: .82, newborn: 2, pills: [[0,18,0,18],[20,31,20,23],[53,0,45,12],[53,21,59,15],[76,24,76,24]] },
]

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

export async function observeSurface(host, input) {
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
  if (!Number.isFinite(exposedDurationMs) || Math.abs(exposedDurationMs - input.clock.effectiveDurationMs) > .05) throw Error('The UI is not using the independently expected captured clock')
  let origin = null, previousAt = null, firstFinalAt = null, firstDomAt = null, firstReadableAt = null, firstDeadlineAt = null
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
          const frameElement = host.querySelector('.settle-answer-frame'), outer = host.getBoundingClientRect(), frame = frameElement.getBoundingClientRect()
          const page = host.querySelector('.settle-page'), text = page.textContent ?? '', status = host.dataset.status
          const elapsed = Number(study.dataset.elapsedMs)
          if (elapsed >= input.clock.effectiveFinalityAtMs && firstDeadlineAt === null) firstDeadlineAt = now
          if (status === 'complete' && firstFinalAt === null) firstFinalAt = now
          if (text && firstDomAt === null) firstDomAt = now
          const composition = host.querySelector('.ambient-composition'), compositionRect = composition?.getBoundingClientRect()
          const glyphs = [], textInk = host.querySelector('.settle-answer-text')
          let readableStyle = null
          if (textInk) {
            const style = getComputedStyle(textInk)
            readableStyle = { filter: style.filter, opacity: Number(style.opacity), transform: style.transform, translate: style.translate || 'none', scale: style.scale || 'none', rotate: style.rotate || 'none', visibility: style.visibility, vertical: globalThis.__parseAnchoredTransform(style.transform) }
            if (style.visibility === 'visible' && firstReadableAt === null) firstReadableAt = now
            const node = textInk.firstChild
            if (node?.nodeType === Node.TEXT_NODE) for (const match of node.textContent.matchAll(/\S+/g)) {
              const range = document.createRange()
              range.setStart(node, match.index); range.setEnd(node, match.index + 1)
              const rect = range.getBoundingClientRect()
              glyphs.push({ offset: match.index, x: rect.x - outer.x, y: rect.y - outer.y })
            }
          }
          const animationCache = new WeakMap()
          const animation = (element, name) => {
            if (!animationCache.has(element)) animationCache.set(element, element.getAnimations({ subtree: true }))
            const item = animationCache.get(element).find((entry) => entry instanceof CSSAnimation && entry.animationName === name)
            return item ? { name, timeMs: Number(item.currentTime), durationMs: Number(item.effect.getTiming().duration), delayMs: item.effect.getTiming().delay, playState: item.playState } : null
          }
          const bars = [...host.querySelectorAll('.ambient-composition__bar')].map((bar, index) => {
            const rect = bar.getBoundingClientRect(), style = getComputedStyle(bar), rowStyle = getComputedStyle(bar.querySelector('.ambient-composition__row-content'))
            const pills = [...bar.querySelectorAll('.ambient-composition__presence')].map((presence, pillIndex) => {
              const ink = presence.querySelector('.ambient-composition__ink')
              if (!ink) throw Error('Missing word skeleton ink')
              const inkRect = ink.getBoundingClientRect(), presenceStyle = getComputedStyle(presence), inkStyle = getComputedStyle(ink)
              const layout = { x: parseFloat(presenceStyle.left), width: parseFloat(presenceStyle.width), height: parseFloat(presenceStyle.height) }
              const pseudo = getComputedStyle(ink, '::after'), before = getComputedStyle(ink, '::before'), glimmer = animation(ink, 'skeleton-glimmer')
              return { index: pillIndex, layout,
                ink: { left: inkRect.left - rect.left, right: inkRect.right - rect.left, top: inkRect.top - rect.top, bottom: inkRect.bottom - rect.top, width: inkRect.width, height: inkRect.height },
                presenceStyle: decorationStyle(presenceStyle), inkStyle: decorationStyle(inkStyle), clipPath: inkStyle.clipPath,
                verticalNudgePx: globalThis.__parseAnchoredTranslate(presenceStyle.translate || 'none'), presenceTransform: globalThis.__parseAnchoredTransform(presenceStyle.transform),
                effectiveOpacity: Number(style.opacity) * Number(rowStyle.opacity) * Number(presenceStyle.opacity) * Number(inkStyle.opacity),
                shuffle: animation(presence, 'skeleton-shuffle'), nudge: animation(presence, 'skeleton-nudge'), emerge: animation(presence, 'skeleton-emerge'),
                afterContent: pseudo.content, beforeContent: before.content,
                glimmer: glimmer ? { ...glimmer, style: decorationStyle(pseudo), xPx: globalThis.__parseAnchoredHorizontal(pseudo.transform), content: pseudo.content } : null }
            })
            return { index, kind: bar.dataset.kind, shown: bar.dataset.shown === 'true', rowOpacity: Number(rowStyle.opacity), rowVisibility: rowStyle.visibility, x: rect.x - outer.x, y: rect.y - outer.y, width: rect.width, height: rect.height,
              compositionBounds: { left: compositionRect.left - outer.x, right: compositionRect.right - outer.x, top: compositionRect.top - outer.y, bottom: compositionRect.bottom - outer.y },
              barStyle: decorationStyle(style), pulse: animation(bar, 'skeleton-breathe'), pills }
          })
          const accent = host.querySelector('.settle-answer-arrival'), accentStyle = accent ? getComputedStyle(accent) : null
          const field = composition?.querySelector('.ambient-composition__field'), division = composition?.querySelector('[data-skeleton-division]')
          const divisionStyle = division ? getComputedStyle(division) : null
          const intro = division ? { style: decorationStyle(divisionStyle), clipPath: divisionStyle.clipPath, animation: animation(division, 'division-leave'),
            cells: [...division.querySelectorAll('[data-division-cell]')].map((cell) => { const rect = cell.getBoundingClientRect(); return { x: rect.left - compositionRect.left, y: rect.top - compositionRect.top, width: rect.width, height: rect.height, style: decorationStyle(getComputedStyle(cell)) } }) } : null
          samples.push({ atMs: now - origin, gapMs: previousAt === null ? null : now - previousAt,
            sourceElapsedMs: elapsed, sourceStatus: status, phase: host.dataset.answerPhase, visualReady: host.dataset.visualReady === 'true', active: host.dataset.active === 'true', visible: host.dataset.visible === 'true',
            frameHeight: frame.height, frameTargetHeight: parseFloat(frameElement.style.height), frameOverflow: getComputedStyle(frameElement).overflow, lineHeightPx: parseFloat(getComputedStyle(page).lineHeight), frameAnimations: frameElement.getAnimations().map((item) => ({ durationMs: item.effect.getTiming().duration, timeMs: Number(item.currentTime), playState: item.playState })), outerHeight: outer.height, pageHeight: page.getBoundingClientRect().height, fontSize: parseFloat(getComputedStyle(host).fontSize),
            compositionMaterial: composition?.dataset.material ?? null,
            fieldOpacity: field ? Number(getComputedStyle(field).opacity) : null, intro,
            textLength: text.length, textExact: text === input.expectedText, bars, glyphs, readableStyle, textAnimation: textInk ? animation(textInk, 'settle-answer-ink') : null, sinceReadableMs: firstReadableAt === null ? null : now - firstReadableAt,
            arrival: accentStyle ? { ...decorationStyle(accentStyle), borderWidth: parseFloat(accentStyle.borderTopWidth), borderStyle: accentStyle.borderTopStyle, cssAnimationName: accentStyle.animationName, cssDurationMs: parseFloat(accentStyle.animationDuration) * 1000, animation: animation(accent, 'settle-answer-arrive') } : null,
          })
          previousAt = now
          if (firstReadableAt !== null && now - firstReadableAt >= 1000) resolve()
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
    firstDomTextAtMs: firstDomAt === null ? null : firstDomAt - clickAt,
    sourceFinalityToFullyVisibleMs: firstFinalAt === null || firstReadableAt === null ? null : firstReadableAt - firstFinalAt,
    firstReadableAtMs: firstReadableAt === null ? null : firstReadableAt - clickAt,
    observedSourceDeadlineToReadableMs: firstDeadlineAt === null || firstReadableAt === null ? null : firstReadableAt - firstDeadlineAt,
    horizontalOverflowPx: Math.max(0, document.documentElement.scrollWidth - innerWidth), finalText: host.querySelector('.settle-page').textContent,
  }
}

export function summarizeSkeleton(raw, identity, { requireFullCycle = true } = {}) {
  const fail = (message) => { throw Error(`${identity.name}: ${message}`) }
  const allLoading = raw.samples.filter((sample) => sample.sourceStatus !== 'complete'), sourceFinal = raw.samples.filter((sample) => sample.sourceStatus === 'complete'), final = sourceFinal.filter((sample) => sample.visualReady), fitting = sourceFinal.filter((sample) => !sample.visualReady)
  if (!allLoading.length || !final.length || !allLoading.every((sample) => sample.active && sample.visible)) fail('missing loading/final samples or measured surface left the active viewport')
  if (allLoading.some((sample) => sample.textLength) || raw.transitions.some((entry) => entry.text && (entry.status !== 'complete' || entry.sourceElapsedMs + .01 < raw.clock.effectiveFinalityAtMs))) fail('readable text appeared before source finality')
  if (raw.finalText !== raw.expectedText || raw.nonemptyTextUpdates !== 1 || sourceFinal.some((sample) => !sample.textExact) || final.some((sample) => sample.bars.length)) fail('answer DOM was not exact once or ornament survived visual readiness')
  if (fitting.some((sample) => sample.phase !== 'fitting' || sample.readableStyle?.visibility !== 'hidden' || sample.frameOverflow !== 'hidden' || sample.bars.length !== 14 || sample.arrival || sample.textAnimation)) fail('fitting exposed partial text, removed activity, or signaled completion early')
  if (raw.arrivalInsertions !== 1 || raw.remainingArrivalNodes !== 0) fail('completion cue did not run once and leave')
  if (raw.horizontalOverflowPx > 1) fail('horizontal document overflow')
  const blurredFinal = final.filter((sample) => !sample.readableStyle || sample.readableStyle.filter !== 'none' || sample.readableStyle.opacity !== 1 || ['translate', 'scale', 'rotate'].some((property) => sample.readableStyle[property] !== 'none') || sample.readableStyle.visibility !== 'visible' || sample.readableStyle.vertical.scaleY !== 1 || sample.readableStyle.vertical.translateY < -.201 || sample.readableStyle.vertical.translateY > 1.501 || sample.frameOverflow !== 'visible').length
  if (blurredFinal) fail('fully visible answer is clipped, faded, blurred, or outside its bounded vertical settle')
  const textAnimations = final.flatMap((sample) => sample.textAnimation ? [sample.textAnimation] : [])
  if (!textAnimations.length || textAnimations.some((animation) => animation.name !== 'settle-answer-ink' || animation.durationMs !== 180)) fail('missing or mistimed whole-answer settle')
  const clockFields = ['firstDomTextAtMs', 'firstFinalAtMs', 'firstReadableAtMs', 'sourceFinalityToFullyVisibleMs', 'observedSourceDeadlineToReadableMs']
  if (clockFields.some((field) => !Number.isFinite(raw[field])) || raw.sourceFinalityToFullyVisibleMs < 0 || raw.firstDomTextAtMs < raw.firstFinalAtMs || raw.firstReadableAtMs < raw.firstDomTextAtMs) fail('missing or invalid source/DOM/readability clocks')
  if (Math.abs(final.at(-1).frameHeight - final.at(-1).pageHeight) > 1) fail('final frame did not reconcile to actual text')
  for (const sample of raw.samples) for (const animation of sample.frameAnimations) {
    if (animation.durationMs !== (sample.sourceStatus === 'complete' ? 180 : 380)) fail('frame resize animation has the wrong duration for its phase')
  }
  const accents = final.flatMap((sample) => sample.arrival ? [sample.arrival] : [])
  if (!accents.length || !accents.some((style) => style.animation?.playState === 'running' && style.opacity > 0) || accents.some((style) => style.filter !== 'none' || style.boxShadow !== 'none' || style.backgroundImage !== 'none' || style.maskImage !== 'none' || Math.abs(style.borderWidth - 1) > .001 || style.borderStyle !== 'solid' || style.cssAnimationName !== 'settle-answer-arrive' || style.cssDurationMs !== 260 || (style.animation ? style.animation.name !== 'settle-answer-arrive' || style.animation.durationMs !== 260 : style.opacity !== 0))) fail(`completion cue is not the required 1px/260ms crisp outline: ${JSON.stringify(accents[0] ?? null)}`)
  const edgeDeltas = [], ordinaryEdges = [], opacityDeltas = [], finalGlyphDeltas = [], initialGlyphDeltas = [], glyphShapeDeltas = [], heightDeltas = [], mainHeightDrifts = [], rowDrifts = [], leftErrors = [], rightErrors = [], gaps = []
  const previous = new Map(), initialRows = new Map(), initialPills = new Map(), glyphs = new Map(), initialGlyphs = new Map()
  const none = (style) => ['transform', 'translate', 'scale', 'rotate'].every((property) => style[property] === 'none')
  const clean = (style) => ['filter', 'backdropFilter', 'maskImage', 'webkitMaskImage', 'backgroundImage', 'boxShadow'].every((property) => style[property] === 'none')
  let introVisibleFrames = 0, introHiddenFrames = 0, introCellMaximumTravelPx = 0
  for (const sample of allLoading) {
    if (sample.compositionMaterial !== SKELETON_MATERIAL || sample.frameHeight < sample.lineHeightPx * 5 - 1 || sample.frameHeight > sample.lineHeightPx * 14 + 1 || sample.fieldOpacity < 0 || sample.fieldOpacity > 1) fail('whole-clock material/frame contract failed')
    if (identity.condition === 'reshape') {
      const intro = sample.intro
      if (!intro || intro.cells.length !== 5 || !clean(intro.style) || !none(intro.style) || intro.style.opacity < 0 || intro.style.opacity > .201 || !intro.clipPath.startsWith('inset(') || Math.abs(intro.animation?.durationMs - 950) > .01) fail('division intro is absent, mistimed, or has unsupported material')
      for (const [index, cell] of intro.cells.entries()) {
        const origin = allLoading[0].intro?.cells[index]
        if (!clean(cell.style) || !none(cell.style) || cell.style.backgroundColor !== cell.style.color || !(cell.width > 0 && cell.height > 0) || cell.x < -.05 || cell.x + cell.width > sample.bars[0].compositionBounds.right - sample.bars[0].compositionBounds.left + .05 || cell.y < -.05 || cell.y + cell.height > sample.lineHeightPx * 5 + .05) fail('division cell is filtered, transformed, empty, or outside the composition')
        if (origin) introCellMaximumTravelPx = Math.max(introCellMaximumTravelPx, Math.hypot(cell.x - origin.x, cell.y - origin.y))
      }
      if (intro.style.visibility === 'visible' && intro.style.opacity > 0) introVisibleFrames += 1
      if (intro.style.visibility === 'hidden' && intro.style.opacity === 0 && sample.fieldOpacity === 1) introHiddenFrames += 1
    } else if (sample.intro || sample.fieldOpacity !== 1) fail('still/breathe unexpectedly uses the division intro')
  }
  if (identity.condition === 'reshape' && (!introVisibleFrames || !introHiddenFrames || allLoading[0].fieldOpacity >= 1 || introCellMaximumTravelPx < 5)) fail('division did not separate and visibly yield to the fully opaque word field')
  const loading = allLoading.filter((sample) => sample.fieldOpacity === 1 && (!sample.intro || sample.intro.style.visibility === 'hidden'))
  if (!loading.length) fail('no fully visible post-intro geometry samples')
  const glimmerPhaseSpreads = [], glimmerRatios = []
  for (const sample of loading) {
    if (sample.compositionMaterial !== SKELETON_MATERIAL) fail('served material identity is stale or missing')
    if (sample.bars.length !== 14 || sample.frameHeight < sample.lineHeightPx * 5 - 1 || sample.frameHeight > sample.lineHeightPx * 14 + 1) fail('adaptive composition left its five-to-fourteen-line envelope')
    for (const row of sample.bars) {
      const expected = ROWS[row.index % ROWS.length], bounds = row.compositionBounds
      if (row.kind !== expected.kind || row.pills.length !== expected.pills.length) fail('row topology differs from authored line/cluster composition')
      if (Math.abs(row.width - expected.width * (bounds.right - bounds.left)) > .1 || Math.abs(row.x - bounds.left) > .05 || Math.abs(row.y - bounds.top - (row.index * sample.lineHeightPx + (sample.lineHeightPx - .9 * sample.fontSize) / 2)) > .05 || Math.abs(row.height - .9 * sample.fontSize) > .1) fail('fixed row envelope moved or resized')
      if (!none(row.barStyle) || !clean(row.barStyle)) fail('full row moved, blurred, or gained unsupported material')
      if (!initialRows.has(row.index)) initialRows.set(row.index, row)
      const initial = initialRows.get(row.index)
      rowDrifts.push(maximum(['x', 'y', 'width', 'height'].map((property) => Math.abs(row[property] - initial[property]))))
      leftErrors.push(Math.abs(row.pills[0].ink.left))
      rightErrors.push(Math.abs(row.pills.at(-1).ink.right - row.width))
      if (Math.abs(row.pills[0].ink.left) > .05 || Math.abs(row.pills.at(-1).ink.right - row.width) > .05) fail('a row outer left or right anchor moved')
      if (row.shown !== (row.index < sample.bars.filter((bar) => bar.shown).length) || row.rowOpacity < 0 || row.rowOpacity > 1) fail('shown rows do not form a bounded contiguous field')
      const visible = row.pills.filter((pill) => row.shown && row.rowOpacity > .001 && pill.presenceStyle.opacity > .001 && pill.ink.width > .01)
      for (let index = 1; index < visible.length; index += 1) {
        const gap = visible[index].ink.left - visible[index - 1].ink.right
        gaps.push(gap)
        if (gap < -.05) fail('neighboring visible pills overlap')
      }
      for (const pill of row.pills) {
        const [x0, w0, x1, w1] = expected.pills[pill.index], newborn = pill.index === expected.newborn
        const changed = x0 !== x1 || w0 !== w1, key = `${row.index}:${pill.index}`
        const { ink, presenceStyle: presence, inkStyle, presenceTransform: transform } = pill
        if (!clean(presence) || !clean(inkStyle) || !none(inkStyle) || pill.clipPath !== 'none' || presence.translate !== 'none' || presence.scale !== 'none' || presence.rotate !== 'none') fail('word pill uses clipping, blur, unsupported transforms, gradient or shadow')
        if (!['none', 'normal'].includes(pill.beforeContent)) fail('an unsupported ink::before layer appeared')
        if (identity.condition === 'reshape') {
          const glimmer = pill.glimmer, style = glimmer?.style
          if (!glimmer || glimmer.durationMs !== 8000 || glimmer.delayMs !== 0 || glimmer.playState !== 'running' || !style.backgroundImage.startsWith('linear-gradient(90deg,') || !/rgba\(255,\s*255,\s*255,\s*0\.3\)/.test(style.backgroundImage) || ['filter', 'backdropFilter', 'maskImage', 'webkitMaskImage', 'boxShadow', 'translate', 'scale', 'rotate'].some((property) => style[property] !== 'none') || style.opacity !== 1) fail('glimmer is absent, unsynchronized, or outside its isolated faint gradient layer')
          if (ink.width > .1) { const ratio = glimmer.xPx / ink.width; glimmerRatios.push(ratio); if (ratio < -1.101 || ratio > 1.101) fail('glimmer exceeded its local sweep bounds') }
        } else if (pill.glimmer || !['none', 'normal'].includes(pill.afterContent)) fail('still/breathe unexpectedly added glimmer')
        if (Math.abs(inkStyle.opacity - .2) > .002 || inkStyle.backgroundColor !== inkStyle.color || inkStyle.visibility !== row.rowVisibility || parseFloat(inkStyle.borderRadius) < pill.layout.height / 2) fail('word pill lost uniform rounded solid fill')
        if (Math.abs(pill.layout.height - .9 * sample.fontSize) > .1 || Math.abs(ink.width - pill.layout.width) > .05 || Math.abs(ink.left - pill.layout.x) > .05 || Math.abs(ink.height - pill.layout.height * transform.scaleY) > .05) fail('ink geometry does not match its permitted local vertical transform')
        if (ink.left < -.05 || ink.right > row.width + .05 || row.y + ink.top < bounds.top - .05 || row.y + ink.bottom > bounds.top + sample.lineHeightPx * 14 + .05) fail('word pill escaped the authored row width or composition bounds')
        const normalizedX = pill.layout.x / row.width * 100, normalizedWidth = pill.layout.width / row.width * 100
        const xPeak = x0 + 1.025 * (x1 - x0), wPeak = w0 + 1.025 * (w1 - w0)
        if (normalizedX < Math.min(x0, xPeak) - .03 || normalizedX > Math.max(x0, xPeak) + .03 || normalizedWidth < Math.min(w0, wPeak) - .03 || normalizedWidth > Math.max(w0, wPeak) + .03) fail('neighbor shuffle exceeded its bounded authored envelope')
        if (pill.layout.width <= .001 && (!newborn || presence.opacity > .001)) fail('zero-width pill is visible or not an authored newborn')
        if (newborn) {
          if (presence.opacity < 0 || presence.opacity > 1 || transform.scaleY < .8199 || transform.scaleY > 1.0801 || transform.translateY < -.0351 * sample.fontSize || transform.translateY > .1001 * sample.fontSize) fail('new word bubble exceeded fade/squash/settle bounds')
        } else {
          if (presence.opacity !== 1 || transform.scaleY !== 1 || transform.translateY < -.0351 * sample.fontSize || transform.translateY > .001) fail('existing word pill faded, stretched, or bounced beyond its bound')
          if (!changed && (!none(presence) || Math.abs(normalizedX - x0) > .03 || Math.abs(normalizedWidth - w0) > .03)) fail('fixed line or unchanged word pill moved')
        }
        if (!initialPills.has(key)) initialPills.set(key, pill)
        const first = initialPills.get(key)
        if (!newborn) mainHeightDrifts.push(Math.abs(ink.height - first.ink.height))
        if (identity.condition !== 'reshape' && maximum(['left', 'right', 'top', 'bottom'].map((property) => Math.abs(ink[property] - first.ink[property]))) > .05) fail('still/breathe treatment changed its paused initial geometry')
        const before = previous.get(key)
        if (before) {
          const edge = maximum(['left', 'right', 'top', 'bottom'].map((property) => Math.abs(ink[property] - before.ink[property])))
          edgeDeltas.push(edge)
          if (sample.gapMs !== null && sample.gapMs <= 34) ordinaryEdges.push(edge)
          opacityDeltas.push(Math.abs(pill.effectiveOpacity - before.effectiveOpacity))
        }
        previous.set(key, pill)
      }
    }
    if (identity.condition === 'reshape') glimmerPhaseSpreads.push(spread(sample.bars.flatMap((row) => row.pills.map((pill) => pill.glimmer.timeMs))))
  }
  if (identity.condition === 'reshape' && (maximum(glimmerPhaseSpreads) > .05 || !glimmerRatios.length || minimum(glimmerRatios) > -1 || maximum(glimmerRatios) < 1)) fail('one matched local left-to-right glimmer sweep was not observed')
  for (const sample of final) for (const glyph of sample.glyphs) {
    if (!initialGlyphs.has(glyph.offset)) initialGlyphs.set(glyph.offset, glyph)
    const first = initialGlyphs.get(glyph.offset), firstWord = initialGlyphs.get(sample.glyphs[0].offset)
    initialGlyphDeltas.push(Math.hypot(glyph.x - first.x, glyph.y - first.y))
    glyphShapeDeltas.push(Math.abs((glyph.x - sample.glyphs[0].x) - (first.x - firstWord.x)), Math.abs((glyph.y - sample.glyphs[0].y) - (first.y - firstWord.y)))
    if (sample.sinceReadableMs >= 220) {
      const rested = glyphs.get(glyph.offset)
      if (rested) finalGlyphDeltas.push(Math.hypot(glyph.x - rested.x, glyph.y - rested.y))
      else glyphs.set(glyph.offset, glyph)
    }
  }
  for (let index = 1; index < allLoading.length; index += 1) {
    const delta = allLoading[index].frameHeight - allLoading[index - 1].frameHeight
    heightDeltas.push(delta)
    if (delta < -.05) fail('waiting envelope shrank during an unchanged viewport/font context')
  }
  if (!edgeDeltas.length || !finalGlyphDeltas.length || !gaps.length) fail('missing matching edge/glyph/gap samples; refusing empty zero metrics')
  if (maximum(finalGlyphDeltas) > .05 || maximum(glyphShapeDeltas) > .05 || maximum(initialGlyphDeltas) > 1.8 || maximum(mainHeightDrifts) > .05 || maximum(rowDrifts) > .05) fail('settled glyphs, internal text layout, existing-pill thickness, or row positions moved')
  const checkCycle = (values, name, exists, running, delay = 0) => {
    const animations = values.map((value) => value[name])
    if (!exists) { if (animations.some(Boolean)) fail(`unexpected ${name} animation`); return null }
    if (animations.some((animation) => !animation || Math.abs(animation.durationMs - 4800) > .1 || Math.abs(animation.delayMs - delay) > .1 || animation.playState !== (running ? 'running' : 'paused'))) fail(`missing or incorrectly timed/paused ${name} animation`)
    const timeSpan = spread(animations.map((animation) => animation.timeMs))
    if (running && (timeSpan <= 0 || (requireFullCycle && timeSpan < 4800))) fail(`insufficient ${name} animation exposure`)
    if (!running && timeSpan > .05) fail(`paused ${name} phase moved`)
    return timeSpan
  }
  const perRow = Array.from({ length: 14 }, (_, index) => {
    const expected = ROWS[index % ROWS.length]
    const rows = loading.map((sample) => sample.bars[index]), opacities = rows.map((row) => row.barStyle.opacity)
    const observedPulseTimeSpanMs = checkCycle(rows, 'pulse', identity.condition !== 'static', identity.condition !== 'static')
    if (identity.condition === 'static') {
      if (opacities.some((opacity) => Math.abs(opacity - .86) > .002)) fail('static row changed its nominal opacity')
    } else if (minimum(opacities) < .719 || maximum(opacities) > 1.001 || spread(opacities) < (requireFullCycle ? .27 : .02)) fail('bounded shared breath was not observed')
    const pills = expected.pills.map(([x0, w0, x1, w1], pillIndex) => {
      const values = rows.map((row) => row.pills[pillIndex]), changed = x0 !== x1 || w0 !== w1, newborn = pillIndex === expected.newborn, running = identity.condition === 'reshape'
      const x = values.map((pill) => pill.layout.x), widths = values.map((pill) => pill.layout.width), opacity = values.map((pill) => pill.presenceStyle.opacity), scales = values.map((pill) => pill.presenceTransform.scaleY), vertical = values.map((pill) => pill.presenceTransform.translateY)
      const observedShuffleTimeSpanMs = checkCycle(values, 'shuffle', changed, running, -4800 * expected.phase)
      const observedNudgeTimeSpanMs = checkCycle(values, 'nudge', changed && !newborn, running, -4800 * expected.phase)
      const observedEmergeTimeSpanMs = checkCycle(values, 'emerge', newborn, running, -4800 * expected.phase)
      if (running && changed && (spread(x) + spread(widths) < (requireFullCycle ? (Math.abs(x1 - x0) + Math.abs(w1 - w0)) / 100 * rows[0].width * .9 : .01))) fail('neighbor accommodation was not observed across the required range')
      if (requireFullCycle && running && newborn && (minimum(opacity) > .001 || maximum(opacity) < .999 || minimum(scales) > .821 || maximum(scales) < 1.075 || minimum(widths) > .05)) fail('newborn did not complete its entry, exit, and bounded elastic settle')
      return { index: pillIndex, newborn, changed, xMinimumPx: minimum(x), xMaximumPx: maximum(x), widthMinimumPx: minimum(widths), widthMaximumPx: maximum(widths), opacityMinimum: minimum(opacity), opacityMaximum: maximum(opacity), scaleYMinimum: minimum(scales), scaleYMaximum: maximum(scales), verticalTranslateMinimumPx: minimum(vertical), verticalTranslateMaximumPx: maximum(vertical), observedShuffleTimeSpanMs, observedNudgeTimeSpanMs, observedEmergeTimeSpanMs }
    })
    return { index, kind: expected.kind, authoredPhase: expected.phase, opacityMinimum: minimum(opacities), opacityMaximum: maximum(opacities), observedPulseTimeSpanMs, pills }
  })
  const frameGaps = raw.samples.flatMap((sample) => sample.gapMs === null ? [] : [sample.gapMs])
  return { ...identity, clock: raw.clock, requiresFullCycle: requireFullCycle, frames: raw.samples.length, loadingFrames: allLoading.length, postIntroGeometryFrames: loading.length, finalFrames: final.length, introVisibleFrames, introHiddenFrames, introCellMaximumTravelPx,
    glimmerPhaseSpreadMaximumMs: glimmerPhaseSpreads.length ? maximum(glimmerPhaseSpreads) : null, glimmerLocalXRatioMinimum: glimmerRatios.length ? minimum(glimmerRatios) : null, glimmerLocalXRatioMaximum: glimmerRatios.length ? maximum(glimmerRatios) : null,
    frameGapP95Ms: percentile(frameGaps, .95), frameGapMaximumMs: maximum(frameGaps), frameGapsOver34Ms: frameGaps.filter((gap) => gap > 34).length,
    inkEdgeSamples: edgeDeltas.length, ordinaryFrameEdgeSamples: ordinaryEdges.length, inkEdgeDeltaP99Px: percentile(edgeDeltas, .99), inkEdgeDeltaMaximumPx: maximum(edgeDeltas), inkEdgeDeltaMaximumUnder34MsPx: percentile(ordinaryEdges, 1),
    effectiveOpacityDeltaP99: percentile(opacityDeltas, .99), effectiveOpacityDeltaMaximum: maximum(opacityDeltas), maximumExistingPillHeightDriftPx: maximum(mainHeightDrifts), maximumRowLayoutDriftPx: maximum(rowDrifts), maximumRowLeftAnchorErrorPx: maximum(leftErrors), maximumRowRightAnchorErrorPx: maximum(rightErrors), minimumVisibleNeighborGapPx: minimum(gaps), perRow,
    matchedRestedGlyphSamples: finalGlyphDeltas.length, restedGlyphMaximumDisplacementPx: maximum(finalGlyphDeltas), initialGlyphDisplacementMaximumPx: maximum(initialGlyphDeltas), internalGlyphLayoutDisplacementMaximumPx: maximum(glyphShapeDeltas), textSettleDurationMs: 180, textTranslateYMinimumPx: minimum(final.map((sample) => sample.readableStyle.vertical.translateY)), textTranslateYMaximumPx: maximum(final.map((sample) => sample.readableStyle.vertical.translateY)),
    observedWaitingResizeAnimations: allLoading.flatMap((sample) => sample.frameAnimations).length, observedFinalFitAnimations: sourceFinal.flatMap((sample) => sample.frameAnimations).length, waitingResizeDurationMs: 380, finalFitDurationMs: 180,
    loadingFrameMinimumHeightPx: minimum(allLoading.map((sample) => sample.frameHeight)), loadingFrameMaximumHeightPx: maximum(allLoading.map((sample) => sample.frameHeight)), finalFrameHeightPx: final.at(-1).frameHeight,
    finalMinusLastLoadingFrameHeightPx: final[0].frameHeight - loading.at(-1).frameHeight,
    loadingContainerMinimumHeightPx: minimum(allLoading.map((sample) => sample.outerHeight)), loadingContainerMaximumHeightPx: maximum(allLoading.map((sample) => sample.outerHeight)), finalContainerHeightPx: final.at(-1).outerHeight,
    finalMinusLastLoadingContainerHeightPx: final[0].outerHeight - loading.at(-1).outerHeight,
    fittingFrames: fitting.length, waitingFrameIncreaseMaximumPx: maximum(heightDeltas), shownRowMinimum: minimum(allLoading.map((sample) => sample.bars.filter((bar) => bar.shown).length)), shownRowMaximum: maximum(allLoading.map((sample) => sample.bars.filter((bar) => bar.shown).length)),
    nonemptyTextUpdates: raw.nonemptyTextUpdates, arrivalInsertions: raw.arrivalInsertions, remainingArrivalNodes: raw.remainingArrivalNodes,
    arrivalOutlineWidthPx: accents[0].borderWidth, arrivalDurationMs: accents[0].cssDurationMs, arrivalAnimationName: accents[0].cssAnimationName,
    firstDomTextAtMs: raw.firstDomTextAtMs, sourceFinalityToFullyVisibleMs: raw.sourceFinalityToFullyVisibleMs, firstReadableAtMs: raw.firstReadableAtMs, firstFinalAtMs: raw.firstFinalAtMs, observedSourceDeadlineToReadableMs: raw.observedSourceDeadlineToReadableMs,
    prefinalTextFrames: 0, clippedFadedBlurredOrOutOfBoundsVisibleTextFrames: blurredFinal, horizontalOverflowPx: raw.horizontalOverflowPx, exactFinalText: true, solidMaterialGuardsPassed: true,
  }
}

export async function measureSkeletonMotion() {
  const { chromium, expect } = await import('@playwright/test')
  const root = process.cwd(), url = process.argv[2] ?? 'http://localhost:3000'
  const output = path.resolve(process.argv[3] ?? path.join(root, SKELETON_REPORT)), artifacts = path.join(root, SKELETON_ARTIFACTS)
  if (!path.basename(output).startsWith('anchored-skeleton-')) throw Error('Refusing a report outside the anchored-skeleton namespace')
  const source = process.env.SKELETON_SOURCE ?? 'sleep'
  if (!choices[source]) throw Error('SKELETON_SOURCE must be sleep, sky, or random')
  const implementation = await skeletonImplementationSnapshot(root)
  const sourceFixtures = await Promise.all(Object.entries(choices).map(async ([key, choice]) => {
    const file = `data/experiments/${choice.file}`, bytes = await readFile(path.join(root, file)), trace = JSON.parse(bytes)
    return { key, id: trace.id, file, sha256: skeletonHash(bytes), clock: 'step_wall_ms' }
  }))
  const contract = { schemaVersion: 1, material: SKELETON_MATERIAL, playbackScale: .5, cyclePeriodMs: 4800, introDurationMs: 950, glimmerPeriodMs: 8000,
    fingerprint: skeletonHash(JSON.stringify({ implementation, sourceFixtures, material: SKELETON_MATERIAL, playbackScale: .5, cyclePeriodMs: 4800, introDurationMs: 950, glimmerPeriodMs: 8000 })) }
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
        await page.addInitScript({ content: `globalThis.__parseAnchoredTransform = ${parseVerticalTransform.toString()}; globalThis.__parseAnchoredTranslate = ${parseVerticalTranslate.toString()}` })
        await page.addInitScript({ content: `globalThis.__parseAnchoredHorizontal = ${parseHorizontalTransform.toString()}` })
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
        inkEdges: 'Actual rounded-ink bounding rectangles include local width/left layout and permitted vertical transforms. Coordinates include zero-width or transparent newborn nodes and are geometric, not raster or antialiasing measurements. Visible neighbor gaps consider opacity above 0.001 and width above 0.01px. Fixed row anchors and existing-pill thickness are checked separately from newborn squash.',
        opacity: 'Row pulse is distinct from the constant 0.20 inner fill, row exposure opacity, and newborn presence opacity. Static is 0.86; breathe/reshape exhibit the full .72-to-1 cycle. Per-frame effective opacity deltas multiply these four layers. The five-row template repeats across 14 persistent row nodes. Every running pulse/shuffle/nudge/emerge animation spans at least 4800ms. Paused geometry animations retain each cluster negative phase in still/breathe.',
        introduction: 'Frame height and exact-answer finality are sampled throughout replay. Reshape must visibly divide one capsule into five typographic row envelopes, then hide the 950ms intro overlay as the field reaches opacity 1. Detailed word-pill geometry metrics begin only after that crossfade. The transparent intro DOM persists until visual readiness.',
        glimmer: 'Only ink::after may use the white gradient with maximum alpha 0.3. Its parent ink opacity 0.2 bounds that highlight contribution before row/presence opacity. All 43 local sweeps must have matching animation currentTime, duration 8000ms and zero delay, including currently hidden rows. One complete left-to-right local sweep is observed; no claim requires a full 8000ms glimmer cycle.',
        frameGaps: 'Observed rAF intervals on this development machine with measurement instrumentation. Diagnostic only; not a physical-device or rendering-cost benchmark.',
        glyphDisplacement: 'Each final whitespace word first character is measured using a DOM Range relative to the answer surface. Initial displacement includes the permitted 180ms whole-answer vertical settle from 1.5px through -0.2px to zero. Internal word geometry subtracts the first glyph on each frame; stationary displacement uses a separate baseline at least 220ms after full visibility. Exact full text and one nonempty DOM update are checked independently.',
        finalityDelay: 'DOM insertion, source-complete observation, whole-text visibility, and settled glyph evidence are separate. Source-to-visible delay is measured from first sampled source-complete to first fully visible frame. A second metric uses the first sampled independently derived source-clock deadline. Underallocation deliberately holds all text hidden during an authored 180ms fit; enough space permits immediate visibility while shrinking. Browser scheduling may extend the observed delay. Zero means the same sampled frame, not zero compositor/input latency.',
        heightChange: 'A waiting envelope begins at five actual line heights and grows monotonically, at most 14 lines, from current committed non-EOS ink. Observed waiting height animations must be 380ms; final reconciliation to measured text height must use 180ms. Actual final text may exceed the waiting cap. Fixed row positions, line widths, and persistent-node phase are checked separately from the changing outer frame. Causality of the estimate is covered by source-level unit tests, not inferred from rendered geometry.',
        comparison: 'Six short-list calibration cases use still, breathe, and a bundled capsule-division/local-shuffle/newborn-emergence/glimmer treatment at 390/1380 widths. Still/breathe show the formed field immediately; their initial silhouette differs from the reshape capsule. This does not isolate individual mechanisms. Two additional narrow reshape sky/random recordings inspect long/failing text. Every case explicitly selects 0.5× inspection in a fresh page; sequential observations are not a randomized reader or performance study.',
      },
      caveats: ['No physical iPhone measurements.', 'No reader preference, comprehension, trust, dopamine, latency-benefit, or novelty claims.', 'Whole-answer presentation withholds earlier readable text and may add an authored 180ms fit before full visibility plus a 180ms whole-text settle.', 'Half-speed playback is an explicitly labeled inspection aid, not recorded production latency.', 'Local left/width animation performs layout and paint and is not assumed compositor-only.', 'Division, neighbor accommodation, staggered cluster phases, bubble emergence, glimmer, adaptive sizing and arrival motion are bundled design decisions, not separately controlled factors.', 'The causal waiting-size estimate is approximate; row contents do not predict final words, final line breaks, or completion progress.'], results,
    }
    await writeFile(output, JSON.stringify(await archiveSkeletonMotion(report, root, artifacts), null, 2) + '\n')
  } finally { await browser.close() }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await measureSkeletonMotion()

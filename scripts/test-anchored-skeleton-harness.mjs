import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { capturedClock, parseHorizontalTransform, parseVerticalTransform, parseVerticalTranslate, ROWS, summarizeSkeleton } from './measure-anchored-skeleton-motion.mjs'
import { assertSkeletonCompatibility, SKELETON_MATERIAL } from './archive-anchored-skeleton-motion.mjs'

const style = (extra = {}) => ({ filter: 'none', backdropFilter: 'none', maskImage: 'none', webkitMaskImage: 'none', backgroundImage: 'none', backgroundColor: 'rgb(255, 255, 255)', color: 'rgb(255, 255, 255)', boxShadow: 'none', transform: 'none', translate: 'none', scale: 'none', rotate: 'none', opacity: 1, visibility: 'visible', borderRadius: '999px', ...extra })
const identity = (condition) => ({ name: `390-${condition}`, condition })
function observation(condition = 'reshape') {
  const times = [0, 1000, 1728, 2064, 2976, 3936, 6000, 7000]
  const phases = [0, 0, 1.025, 1, 1, 0, 0, 1]
  const pulses = [.72, .78, .96, .99, 1, .77, .72, .86]
  const loading = times.map((time, frame) => ({
    atMs: time, gapMs: frame ? 16 : null, sourceElapsedMs: time, sourceStatus: 'running', active: true, visible: true,
    phase: 'waiting', visualReady: false, frameHeight: [120,120,120,144,144,168,168,168][frame], frameTargetHeight: [120,120,120,144,144,168,168,168][frame], frameAnimations: [], frameOverflow: 'hidden', lineHeightPx: 24, outerHeight: 192, pageHeight: 0, fontSize: 15, textLength: 0, textExact: false, glyphs: [], readableStyle: null, arrival: null, compositionMaterial: SKELETON_MATERIAL,
    fieldOpacity: condition === 'reshape' && time < 950 ? 0 : 1,
    intro: condition === 'reshape' ? { style: style({ opacity: time < 950 ? .2 : 0, visibility: time < 950 ? 'visible' : 'hidden' }), clipPath: 'inset(0 0 0 0 round 0)', animation: { durationMs: 950 }, cells: ROWS.map((row, index) => ({ x: time < 950 ? 12 : 0, y: time < 950 ? 39 + index * 8.4 : index * 24 + 5.25, width: time < 950 ? 264 : row.width * 300, height: time < 950 ? 8.4 : 13.5, style: style() })) } : null,
    bars: Array.from({ length: 14 }, (_, index) => {
      const row = ROWS[index % ROWS.length], shown = index < [5,5,5,6,6,7,7,7][frame]
      const moving = condition === 'reshape', width = row.width * 300, height = 13.5
      const progress = moving ? phases[frame] : (row.phase === .43 ? 1 : 0)
      const pulseOpacity = condition === 'static' ? .86 : pulses[frame]
      const animation = (name) => ({ timeMs: moving || name === 'pulse' ? time : 0, durationMs: 4800, delayMs: name === 'pulse' ? 0 : -4800 * row.phase, playState: moving || name === 'pulse' ? 'running' : 'paused' })
      return { index, kind: row.kind, shown, rowOpacity: shown ? 1 : 0, rowVisibility: shown ? 'visible' : 'hidden', x: 0, y: index * 24 + 5.25, width, height, compositionBounds: { left: 0, right: 300, top: 0, bottom: 120 }, barStyle: style({ opacity: pulseOpacity }), pulse: condition === 'static' ? null : animation('pulse'),
        pills: row.pills.map(([x0, w0, x1, w1], pillIndex) => {
          const changed = x0 !== x1 || w0 !== w1, newborn = pillIndex === row.newborn
          const x = (x0 + progress * (x1 - x0)) * width / 100, pillWidth = (w0 + progress * (w1 - w0)) * width / 100
          const opacity = newborn && progress === 0 ? 0 : 1
          const peak = progress > 1, scaleY = newborn ? (progress === 0 ? .82 : peak ? 1.08 : 1) : 1
          const translateY = newborn && progress === 0 ? 1.5 : peak && changed ? -.525 : 0
          const top = height * (1 - scaleY) / 2 + translateY
          return { index: pillIndex, layout: { x, width: pillWidth, height }, ink: { left: x, right: x + pillWidth, top, bottom: top + height * scaleY, width: pillWidth, height: height * scaleY },
            presenceStyle: style({ opacity, transform: changed ? `matrix(1, 0, 0, ${scaleY}, 0, ${translateY})` : 'none' }), inkStyle: style({ opacity: .2, visibility: shown ? 'visible' : 'hidden' }), clipPath: 'none', beforeContent: 'none', afterContent: condition === 'reshape' ? '""' : 'none', presenceTransform: { scaleY, translateY }, verticalNudgePx: 0, effectiveOpacity: pulseOpacity * opacity * .2 * Number(shown),
            shuffle: changed ? animation('shuffle') : null, nudge: changed && !newborn ? animation('nudge') : null, emerge: newborn ? animation('emerge') : null, glimmer: condition === 'reshape' ? { timeMs: time, durationMs: 8000, delayMs: 0, playState: 'running', style: style({ backgroundImage: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 15%, rgba(255, 255, 255, 0.3) 50%, rgba(0, 0, 0, 0) 85%)' }), xPx: Math.max(-1.1, Math.min(1.1, (time - 1280) / 800 * 2.2 - 1.1)) * pillWidth } : null }
        }) }
    }),
  }))
  const final = [8000, 8100, 8220, 8500].map((time, index) => {
    const y = [1.5, -.15, 0, 0][index]
    return { atMs: time, gapMs: 16, sourceElapsedMs: time, sourceStatus: 'complete', phase: 'ready', visualReady: true, active: true, visible: true, frameHeight: [168,120,100,100][index], frameTargetHeight: 100, frameOverflow: 'visible', frameAnimations: [], lineHeightPx: 24, outerHeight: 124, pageHeight: 100, fontSize: 15, textLength: 5, textExact: true, bars: [], glyphs: [{ offset: 0, x: 0, y }], readableStyle: style({ transform: `matrix(1, 0, 0, 1, 0, ${y})`, vertical: { scaleY: 1, translateY: y } }), sinceReadableMs: time - 8000, textAnimation: index < 2 ? { name: 'settle-answer-ink', durationMs: 180 } : null, arrival: index ? null : style({ borderWidth: 1, borderStyle: 'solid', cssAnimationName: 'settle-answer-arrive', cssDurationMs: 260, animation: { name: 'settle-answer-arrive', durationMs: 260, playState: 'running' } }) }
  })
  return { samples: [...loading, ...final], transitions: [{ atMs: 8000, text: 'hello', status: 'complete', sourceElapsedMs: 8000 }], expectedText: 'hello', finalText: 'hello', clock: { effectiveFinalityAtMs: 8000 }, nonemptyTextUpdates: 1, arrivalInsertions: 1, remainingArrivalNodes: 0, horizontalOverflowPx: 0, firstDomTextAtMs: 8000, firstReadableAtMs: 8000, firstFinalAtMs: 8000, sourceFinalityToFullyVisibleMs: 0, observedSourceDeadlineToReadableMs: 0 }
}

test('vertical transform parser accepts bounded elasticity and rejects horizontal or rotated transforms', () => {
  assert.deepEqual(parseVerticalTransform('matrix(1, 0, 0, 1.08, 0, -0.525)'), { scaleY: 1.08, translateY: -.525 })
  assert.equal(parseVerticalTranslate('0px -9.75e-1px'), -.975)
  assert.equal(parseHorizontalTransform('matrix(1, 0, 0, 1, -110, 0)'), -110)
  assert.throws(() => parseHorizontalTransform('matrix(1, 0, 0, 1, 0, 1)'), /Nonhorizontal/)
  for (const invalid of ['matrix(1, 0, 0, 1, 1, 0)', 'matrix(1, 0.1, 0, 1, 0, 0)', 'matrix(0.9, 0, 0, 1, 0, 0)']) assert.throws(() => parseVerticalTransform(invalid), /Nonvertical/)
  assert.throws(() => parseVerticalTranslate('1px 0px'), /Horizontal/)
})
for (const condition of ['static', 'breathe', 'reshape']) test(`summarizer accepts valid ${condition} and transparent zero-width newborns`, () => {
  const report = summarizeSkeleton(observation(condition), identity(condition))
  assert.equal(report.exactFinalText, true)
  assert.equal(report.maximumRowLeftAnchorErrorPx, 0)
  assert.equal(report.restedGlyphMaximumDisplacementPx, 0)
  assert.ok(report.minimumVisibleNeighborGapPx > 0)
})
const corruptions = {
  'missing intro': (raw) => { raw.samples[0].intro = null },
  'intro never yielded': (raw) => { for (const sample of raw.samples.filter((item) => item.bars.length)) sample.fieldOpacity = 0 },
  'unsynchronized glimmer': (raw) => { raw.samples[1].bars[0].pills[0].glimmer.timeMs += 16 },
  'blurred glimmer': (raw) => { raw.samples[1].bars[0].pills[0].glimmer.style.filter = 'blur(1px)' },
  'stale material': (raw) => { raw.samples[0].compositionMaterial = 'solid-rounded-skeleton-v1' },
  'row movement': (raw) => { raw.samples[1].bars[0].x = 1 },
  'right anchor movement': (raw) => { raw.samples[1].bars[1].pills.at(-1).ink.right -= 1 },
  'neighbor overlap': (raw) => { raw.samples[1].bars[1].pills[1].ink.left = 1 },
  'old clipped material': (raw) => { raw.samples[1].bars[0].pills[0].clipPath = 'inset(0 10% 0 0)' },
  'blurred bars': (raw) => { raw.samples[1].bars[0].pills[0].inkStyle.filter = 'blur(1px)' },
  'existing pill collapse': (raw) => { raw.samples[1].bars[1].pills[0].ink.height = 5 },
  'newborn overshoot': (raw) => { raw.samples[1].bars[1].pills[1].presenceTransform.scaleY = 1.2 },
  'missing bubble fade': (raw) => { for (const sample of raw.samples.filter((item) => item.bars.length)) sample.bars[1].pills[1].presenceStyle.opacity = 1 },
  'paused geometry animation moving': (raw) => { raw.samples[1].bars[1].pills[0].shuffle.playState = 'paused' },
  'early answer': (raw) => { raw.transitions[0].sourceElapsedMs = 6999 },
  'repeated answer': (raw) => { raw.nonemptyTextUpdates = 2 },
  'moving final glyph': (raw) => { raw.samples.at(-1).glyphs[0].x = 1 },
  'independently scaled answer': (raw) => { raw.samples.at(-1).readableStyle.scale = '.99' },
  'wrong completion duration': (raw) => { raw.samples.find((sample) => sample.arrival).arrival.animation.durationMs = 500 },
  'wrong completion width': (raw) => { raw.samples.find((sample) => sample.arrival).arrival.borderWidth = 2 },
  'wrong completion animation': (raw) => { raw.samples.find((sample) => sample.arrival).arrival.animation.name = 'old-glow' },
  'glowing completion cue': (raw) => { raw.samples.find((sample) => sample.arrival).arrival.boxShadow = '0 0 10px white' },
  'empty glyph evidence': (raw) => { for (const sample of raw.samples) sample.glyphs = [] },
  'missing availability clock': (raw) => { raw.sourceFinalityToFullyVisibleMs = null },
  'visibility before DOM arrival': (raw) => { raw.firstReadableAtMs = 7999 },
  'wrong whole-answer settle duration': (raw) => { raw.samples.find((sample) => sample.textAnimation).textAnimation.durationMs = 260 },
  'excessive initial answer travel': (raw) => { raw.samples.find((sample) => sample.visualReady).readableStyle.vertical.translateY = 2 },
  'waiting envelope shrink': (raw) => { raw.samples[2].frameHeight = 119 },
  'waiting envelope above cap': (raw) => { raw.samples[2].frameHeight = 337.1 },
  'wrong waiting resize duration': (raw) => { raw.samples[2].frameAnimations = [{ durationMs: 180 }] },
  'wrong final fit duration': (raw) => { raw.samples.at(-1).frameAnimations = [{ durationMs: 380 }] },
  'unreconciled final height': (raw) => { raw.samples.at(-1).frameHeight = 102 },
}
for (const [name, mutate] of Object.entries(corruptions)) test(`summarizer rejects ${name}`, () => {
  const raw = observation(); mutate(raw)
  assert.throws(() => summarizeSkeleton(raw, identity('reshape')))
})

test('archive refuses mismatched historical material and implementation fingerprint', () => {
  const contract = { material: SKELETON_MATERIAL, fingerprint: 'one', playbackScale: .5, cyclePeriodMs: 4800, introDurationMs: 950, glimmerPeriodMs: 8000, schemaVersion: 1 }
  assert.doesNotThrow(() => assertSkeletonCompatibility(contract, contract))
  assert.throws(() => assertSkeletonCompatibility({ ...contract, material: 'solid-rounded-skeleton-v1' }, contract), /material/)
  assert.throws(() => assertSkeletonCompatibility({ ...contract, fingerprint: 'two' }, contract), /fingerprint/)
})

test('captured source oracle retains exact answers and separates source and inspection clocks', async () => {
  for (const file of ['parallel-qwen-2026-09-09/compact/sleep-tips__lowconf-b128-s32.json', 'parallel-qwen-2026-09-09/compact/sky-blue__lowconf-b128-s32.json', 'parallel-qwen-random-2026-09-09/compact/sleep-tips__random-b128-s32.json']) {
    const trace = JSON.parse(await readFile(new URL(`../data/experiments/${file}`, import.meta.url)))
    const clock = capturedClock(trace, .5)
    assert.equal(clock.effectiveFinalityAtMs, clock.capturedFinalityAtMs * 2)
    assert.equal(clock.effectiveDurationMs, clock.capturedDurationMs * 2)
    assert.throws(() => capturedClock({ ...trace, answer: 'edited output' }, .5), /exact expected answer/)
  }
})

test('finished transparent cue may await its DOM-removal callback without falsifying timing', () => {
  const raw = observation()
  raw.samples.at(-1).arrival = style({ opacity: 0, borderWidth: 1, borderStyle: 'solid', cssAnimationName: 'settle-answer-arrive', cssDurationMs: 260, animation: null })
  assert.doesNotThrow(() => summarizeSkeleton(raw, identity('reshape')))
})

function fittingObservation() {
  const raw = observation(), loading = raw.samples.filter((sample) => sample.sourceStatus !== 'complete'), final = raw.samples.filter((sample) => sample.sourceStatus === 'complete')
  const fitting = [8000, 8100].map((time) => ({ ...structuredClone(final[0]), atMs: time, sourceElapsedMs: time, phase: 'fitting', visualReady: false, sinceReadableMs: null, arrival: null, textAnimation: null, readableStyle: style({ visibility: 'hidden', vertical: { scaleY: 1, translateY: 0 } }), bars: structuredClone(loading.at(-1).bars), frameHeight: time === 8000 ? 168 : 240, frameTargetHeight: 300, frameOverflow: 'hidden', pageHeight: 300, frameAnimations: [{ durationMs: 180, timeMs: time - 8000, playState: 'running' }] }))
  for (const sample of final) { sample.atMs += 180; sample.sourceElapsedMs += 180; sample.frameHeight = sample.frameTargetHeight = sample.pageHeight = 300 }
  raw.samples = [...loading, ...fitting, ...final]
  raw.firstReadableAtMs = 8180; raw.sourceFinalityToFullyVisibleMs = raw.observedSourceDeadlineToReadableMs = 180
  return raw
}
test('hidden full text may fit for 180ms while its ornament persists before one opaque arrival', () => {
  const result = summarizeSkeleton(fittingObservation(), identity('reshape'))
  assert.equal(result.fittingFrames, 2)
  assert.equal(result.sourceFinalityToFullyVisibleMs, 180)
  assert.equal(result.observedFinalFitAnimations, 2)
  assert.equal(result.restedGlyphMaximumDisplacementPx, 0)
})
for (const [name, mutate] of Object.entries({
  'visible partial fitting text': (raw) => { raw.samples.find((sample) => sample.phase === 'fitting').readableStyle.visibility = 'visible' },
  'premature fitting outline': (raw) => { raw.samples.find((sample) => sample.phase === 'fitting').arrival = raw.samples.find((sample) => sample.arrival).arrival },
  'missing fitting activity': (raw) => { raw.samples.find((sample) => sample.phase === 'fitting').bars = [] },
  'premature text settle': (raw) => { raw.samples.find((sample) => sample.phase === 'fitting').textAnimation = { name: 'settle-answer-ink', durationMs: 180 } },
})) test(`summarizer rejects ${name}`, () => {
  const raw = fittingObservation(); mutate(raw)
  assert.throws(() => summarizeSkeleton(raw, identity('reshape')))
})

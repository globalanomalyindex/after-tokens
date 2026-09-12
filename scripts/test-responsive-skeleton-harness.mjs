import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeResponsive, capturedClock } from './measure-responsive-skeleton-motion.mjs'
import { MATERIAL } from './archive-responsive-skeleton-motion.mjs'

function specimen() {
  const rows = Array.from({ length: 14 }, (_, index) => ({ identity: index, shown: index < 5, x: 0, y: index * 24, width: 100, height: 14, opacity: .8, pills: [
    { identity: index * 2 + 30, x: 0, y: 0, width: 40, height: 14, opacity: 1, filter: 'none', backgroundImage: 'none', maskImage: 'none', shadow: 'none', radius: '999px' },
    { identity: index * 2 + 31, x: 42, y: 0, width: 58, height: 14, opacity: 1, filter: 'none', backgroundImage: 'none', maskImage: 'none', shadow: 'none', radius: '999px' },
  ] }))
  const samples = Array.from({ length: 70 }, (_, index) => {
    const loading = index < 30, ready = index >= 50
    const currentRows = structuredClone(rows)
    currentRows[1].pills[1].x += index * .01
    currentRows[1].pills[1].width -= index * .01
    return { atMs: index * 16, material: MATERIAL, status: loading ? 'receiving' : 'complete', phase: ready ? 'ready' : loading ? 'waiting' : 'revealing', visualReady: ready,
      sourceElapsedMs: index * 16, releasedLength: loading ? 0 : 7, text: loading ? '' : 'Answer.', legacyNodes: 0,
      passages: loading ? [] : [{ identity: 50, text: 'Answer.', filter: 'none', transform: 'none', opacity: ready ? 1 : (index - 30) / 19, top: ready ? 0 : 1.5 * (49 - index) / 19,
        visibility: 'visible', pending: false, arriving: !ready, animationName: ready ? 'none' : 'reading-ink-arrive', animationDuration: ready ? '0s' : '0.28s', glyphs: [[0, ready ? 0 : 1]], wordBounds: [{ x: 0, y: 0, width: 50, height: 20 }] }],
      transfer: loading || ready ? [] : [{ x: 5, y: 5, opacity: .1, alpha: .2, origin: { x: 0, y: 0, width: 40, height: 14 }, targetScale: [1, 1], duration: '0.28s' }],
      ambient: !ready, runningAnimations: ready ? 0 : 1, rows: currentRows, frame: { width: 200, height: ready ? 24 : 120, overflow: ready ? 'visible' : 'hidden' }, page: { height: 24 }, lineHeight: 24,
      activityMs: index * 200, glimmer: { count: 28, inkCount: 28, times: [index * 16, index * 16], durations: [8000] },
      introduction: { fieldOpacity: index ? 1 : 0, opacity: index ? 0 : .2, visibility: index ? 'hidden' : 'visible' } }
  })
  return { samples, expectedText: 'Answer.', finalText: 'Answer.', nonemptyTextUpdates: 1, measuredAt: '2026-09-12T00:00:00.000Z', sourceId: 'synthetic-guard-only',
    clock: { effectiveFinalityAtMs: 480 }, textEvents: [{ text: 'Answer.', status: 'complete', sourceElapsedMs: 480 }],
    sourceCompleteAt: 480, firstDomAt: 480, firstInkAt: 496, opaqueAt: 784, readyAt: 800 }
}
const run = (raw) => summarizeResponsive(raw, { name: 'synthetic-guard-only', condition: 'reshape' })
test('valid synthetic geometry passes while retaining separate timing meanings', () => {
  const result = run(specimen())
  assert.equal(result.guards.passed, true)
  assert.equal(result.sourceToDomMs, 0)
  assert.equal(result.sourceToFullOpacityMs, 304)
  assert.equal(result.sourceToRestMs, 320)
  assert.equal(result.restedGlyphDisplacementPx, 0)
})
const corruptions = [
  ['changed answer', (raw) => { raw.finalText = 'Different.' }],
  ['second answer insertion', (raw) => { raw.nonemptyTextUpdates = 2 }],
  ['missing readiness time', (raw) => { raw.readyAt = null }],
  ['nonfinite opacity time', (raw) => { raw.opaqueAt = NaN }],
  ['reversed opacity and first ink', (raw) => { raw.opaqueAt = 400 }],
  ['too few frames', (raw) => { raw.samples = raw.samples.slice(0, 10) }],
  ['wrong material', (raw) => { raw.samples[0].material = 'adaptive-cell-skeleton-v5' }],
  ['premature text', (raw) => { raw.samples[0].text = 'Guess' }],
  ['source deadline exposure', (raw) => { raw.textEvents[0].sourceElapsedMs = 100 }],
  ['wrong source status', (raw) => { raw.textEvents[0].status = 'receiving' }],
  ['legacy renderer', (raw) => { raw.samples[5].legacyNodes = 1 }],
  ['policy DOM length mismatch', (raw) => { raw.samples[31].releasedLength = 100 }],
  ['blurred readable ink', (raw) => { raw.samples[31].passages[0].filter = 'blur(2px)' }],
  ['excessive text movement', (raw) => { raw.samples[31].passages[0].top = 3 }],
  ['visible text during fit', (raw) => { raw.samples[31].phase = 'fitting' }],
  ['wrong handover duration', (raw) => { raw.samples[31].passages[0].animationDuration = '1s' }],
  ['no actual opacity blend', (raw) => { for (const sample of raw.samples) for (const passage of sample.passages) passage.opacity = 1 }],
  ['no captured cells', (raw) => { for (const sample of raw.samples) sample.transfer = [] }],
  ['zero-width transfer origin', (raw) => { raw.samples[31].transfer[0].origin.width = 0 }],
  ['stationary transfer overlay', (raw) => { for (const sample of raw.samples) for (const cell of sample.transfer) { cell.x = 0; cell.y = 0 } }],
  ['running final decoration', (raw) => { raw.samples[60].runningAnimations = 1 }],
  ['old glyph movement after rest', (raw) => { raw.samples[60].passages[0].glyphs[0][1] = 1 }],
  ['no measured final word bounds', (raw) => { raw.samples[60].passages[0].wordBounds = [] }],
  ['final word outside the frame', (raw) => { raw.samples[60].passages[0].wordBounds[0].y = 200 }],
  ['final frame does not fit page', (raw) => { raw.samples[60].frame.height = 120 }],
  ['readable final frame still clips', (raw) => { raw.samples[60].frame.overflow = 'hidden' }],
  ['waiting row remount', (raw) => { raw.samples[3].rows[1].identity = 999 }],
  ['row budget overflow', (raw) => { raw.samples[3].rows.push(raw.samples[3].rows[0]) }],
  ['waiting frame collapse', (raw) => { raw.samples[3].frame.height = 40 }],
  ['left edge movement', (raw) => { raw.samples[3].rows[0].x = 2 }],
  ['visible neighboring overlap', (raw) => { raw.samples[3].rows[0].pills[1].x = 20 }],
  ['capsule loses solid material', (raw) => { raw.samples[3].rows[0].pills[0].backgroundImage = 'linear-gradient(red,blue)' }],
  ['glimmer drift', (raw) => { raw.samples[3].glimmer.times[1] += 10 }],
  ['glimmer duration changes', (raw) => { raw.samples[3].glimmer.durations = [1000] }],
  ['missing joined introduction', (raw) => { raw.samples[0].introduction.fieldOpacity = 1 }],
  ['activity clock frozen', (raw) => { for (const sample of raw.samples) sample.activityMs = 0 }],
  ['cells never reshape', (raw) => { for (const sample of raw.samples) sample.rows = structuredClone(raw.samples[0].rows) }],
]
for (const [name, corrupt] of corruptions) test(`rejects ${name}`, () => {
  const raw = specimen(); corrupt(raw)
  assert.throws(() => run(raw))
})
test('fixture clock rejects answer text that contradicts its committed tokens', () => {
  assert.throws(() => capturedClock({ step_wall_ms: [10], sampler: { max_new_tokens: 2 }, tokens: [{ pos: 0, step: 0, text: 'A' }, { pos: 1, step: 0, text: '<|im_end|>' }], answer: 'B' }, .5))
})

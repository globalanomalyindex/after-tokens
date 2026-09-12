import test from 'node:test'
import assert from 'node:assert/strict'
import { commitmentOracle, summarizeGrowingV8 } from './growing-skeleton-v8-observer.mjs'

function specimen(policy = 'sentence') {
  const first = policy === 'sentence' ? 30 : 80
  const samples = Array.from({ length: 150 }, (_, index) => {
    const complete = index >= 80, ready = index >= 98
    const firstArriving = index >= first && index < first + 18
    const secondArriving = policy === 'sentence' && complete && !ready
    const arriving = firstArriving || secondArriving
    const transferId = arriving ? complete ? 2 : 1 : null
    const rows = ready ? [] : Array.from({ length: 14 }, (_, row) => ({ id: row, shown: row < (index < 20 ? 5 : 9), x: 0, y: row * 20, width: 100, height: 14,
      cells: [{ id: row + 20, x: 0, y: row * 20, width: 100, height: 14, alpha: .2, borrowed: row === 0 && arriving ? String(transferId) : null,
        visible: row < (index < 20 ? 5 : 9) && !(row === 0 && arriving), filter: 'none', backgroundImage: 'none', radius: '999px' }] }))
    const passage = (id, text, y, isArriving, start) => ({ id, passageId: String(id), text, pending: false, arriving: isArriving,
      opacity: isArriving ? (index - start) / 17 : 1, top: isArriving ? 1.5 * (17 - index + start) / 17 : 0,
      visibility: 'visible', filter: 'none', transform: 'none', animation: isArriving ? 'reading-ink-arrive' : 'none', duration: isArriving ? '.28s' : '0s', points: [[0, y]], bounds: [{ x: 0, y, width: 50, height: 18 }] })
    const passages = policy === 'answer' ? complete ? [passage(1, 'First. Second.', 0, !ready, 80)] : []
      : [...(index >= 30 ? [passage(1, 'First. ', 0, firstArriving, 30)] : []), ...(complete ? [passage(2, 'Second.', 20, !ready, 80)] : [])]
    const text = passages.map((item) => item.text).join('')
    return { atMs: index * 16, sourceAtMs: index * 16, status: complete ? 'complete' : 'receiving', policy, material: 'growing-cell-skeleton-v8',
      phase: ready ? 'ready' : arriving ? 'revealing' : 'waiting', ready, releasedLength: text.length, text, passages, coherent: true,
      frame: { x: 0, y: 0, width: 200, height: ready ? 40 : index < 20 ? 100 : 180, overflow: ready ? 'visible' : 'hidden' }, page: { x: 0, y: 0, width: 200, height: 40 },
      tail: ready ? null : { x: 0, y: 0, width: 200, height: 100, opacity: 1 }, lineHeight: 20, rows, transferId, transferDuration: arriving ? '.28s' : null,
      cloned: arriving ? [{ x: index - (complete ? 80 : 30), y: 0, width: 100, height: 14, origin: { x: 0, y: 0, width: 100, height: 14 }, alpha: .2, opacity: .2, duration: '.28s' }] : [],
      legacyCount: 0, runningAnimations: ready ? 0 : 1 }
  })
  return { name: `synthetic-${policy}`, policy, source: 'synthetic-only', viewport: { width: 200, height: 800 }, expectedText: 'First. Second.', finalText: 'First. Second.', observedAt: '2026-09-12', samples,
    oracle: { durationMs: 1280, finalityMs: 1280, checkpoints: [{ atMs: 480, prefix: 'First. ', terminal: false }, { atMs: 1280, prefix: 'First. Second.', terminal: true }] },
    changes: [...(policy === 'sentence' ? [{ atMs: 480, sourceAtMs: 480, text: 'First. ' }] : []), { atMs: 1280, sourceAtMs: 1280, text: 'First. Second.' }] }
}
for (const policy of ['answer', 'sentence']) test(`valid ${policy} keeps timing and geometry meanings separate`, () => {
  const result = summarizeGrowingV8(specimen(policy))
  assert.equal(result.guards.passed, true); assert.equal(result.localGlyphDriftPx, 0); assert.equal(result.maximumOriginMismatchPx, 0)
})
const changes = [
  ['final text mismatch', (r) => { r.finalText = 'No.' }],
  ['insufficient evidence', (r) => { r.samples = r.samples.slice(0, 30) }],
  ['old material', (r) => { r.samples[0].material = 'ambient-cell-skeleton-v7' }],
  ['wrong policy', (r) => { r.samples[0].policy = 'word' }],
  ['legacy words', (r) => { r.samples[0].legacyCount = 1 }],
  ['source text leak', (r) => { r.samples[0].text = 'First.'; r.samples[0].releasedLength = 6 }],
  ['mutation source leak', (r) => { r.changes[0].sourceAtMs = 0 }],
  ['released length mismatch', (r) => { r.samples[50].releasedLength++ }],
  ['remounted passage', (r) => { r.samples[50].passages[0].id = 999 }],
  ['old passage reanimation', (r) => { r.samples[90].passages[0].arriving = true }],
  ['ink blur', (r) => { r.samples[90].passages[0].filter = 'blur(1px)' }],
  ['large arrival motion', (r) => { r.samples[90].passages[1].top = 4 }],
  ['changed handover duration', (r) => { r.samples[90].passages[1].duration = '.8s' }],
  ['transparent rested ink', (r) => { r.samples[120].passages[0].opacity = .5 }],
  ['cumulative old ink movement', (r) => { for (let i = 100; i < 150; i++) r.samples[i].passages[0].points[0][1] += (i - 100) * .01 }],
  ['incoherent geometry', (r) => { r.samples.forEach((s) => { s.coherent = false }) }],
  ['captured after tail moved', (r) => { r.samples[80].cloned[0].origin.y = 30 }],
  ['visible original duplicates clone', (r) => { r.samples[80].rows[0].cells[0].visible = true }],
  ['original not borrowed', (r) => { r.samples[80].rows[0].cells[0].borrowed = null }],
  ['no actual clone', (r) => { r.samples.forEach((s) => { s.cloned = [] }) }],
  ['missing opacity blend', (r) => { r.samples.forEach((s) => s.passages.forEach((p) => { p.opacity = 1 })) }],
  ['no transfer clock', (r) => { r.samples[80].transferDuration = '0s' }],
  ['residual final field', (r) => { r.samples[120].tail = { opacity: .1 } }],
  ['final animation persists', (r) => { for (const s of r.samples) if (s.ready) s.runningAnimations = 1 }],
  ['final height mismatch', (r) => { for (const s of r.samples) if (s.ready) s.frame.height = 120 }],
  ['final clipping', (r) => { r.samples[120].frame.overflow = 'hidden' }],
  ['final words clipped', (r) => { r.samples[120].passages[0].bounds[0].y = 200 }],
  ['wrong row count', (r) => { r.samples[10].rows.pop() }],
  ['small pill field returns', (r) => { r.samples[10].rows[0].cells = Array(6).fill(r.samples[10].rows[0].cells[0]) }],
  ['blurred material', (r) => { r.samples[10].rows[0].cells[0].filter = 'blur(2px)' }],
  ['overlap', (r) => { r.samples[10].rows[0].cells.push({ ...r.samples[10].rows[0].cells[0], x: 50 }) }],
  ['no final readiness', (r) => { r.samples.forEach((s) => { s.ready = false }) }],
]
for (const [name, corrupt] of changes) test(`rejects ${name}`, () => { const raw = specimen(); corrupt(raw); assert.throws(() => summarizeGrowingV8(raw)) })
test('commitment oracle rejects contradictory final fixtures and validates recorded timing', () => {
  const trace = { tokens: [{ pos: 0, step: 0, text: 'A' }, { pos: 1, step: 1, text: '<|im_end|>' }], step_ms: [10, 20], sampler: { max_new_tokens: 2 }, answer: 'A' }
  assert.equal(commitmentOracle(trace).finalityMs, 30)
  assert.throws(() => commitmentOracle({ ...trace, answer: 'B' }))
  assert.throws(() => commitmentOracle({ ...trace, step_ms: [NaN, 20] }))
})

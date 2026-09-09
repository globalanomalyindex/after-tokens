import { describe, expect, it } from 'vitest'
import heronJson from '@/data/traces/compact/heron-poem__lowconf-b32.json'
import brainstormJson from '@/data/traces/compact/brainstorm__lowconf-b128.json'
import { asTrace, type TraceCompact } from '@/lib/diffusion/traces'
import { DEMO_REPLAYS } from '@/lib/settle/fixtures'
import { formingText, heldText, pageText } from '@/lib/settle/reader'
import { paceLabel, replayTrace, settleAt, settleEnd } from '@/lib/settle/replay'
import { TRACE_IDS, loadTrace } from '@/lib/traces/index'

const heron = asTrace(heronJson)
const brainstorm = asTrace(brainstormJson)

/** A trace that throws if the adapter touches anything retrospective. */
function guarded(trace: TraceCompact): TraceCompact {
  const forbidden = ['answer', 'words', 'tail_done_step', 'stats']
  const copy: Record<string, unknown> = { ...trace }
  for (const key of forbidden) {
    Object.defineProperty(copy, key, { get() { throw new Error(`adapter read ${key}`) }, enumerable: true })
  }
  copy.tokens = trace.tokens.map((token) => {
    const t: Record<string, unknown> = { pos: token.pos, text: token.text, step: token.step }
    for (const key of ['tail', 'conf', 'flips']) {
      Object.defineProperty(t, key, { get() { throw new Error(`adapter read token.${key}`) }, enumerable: true })
    }
    return t as unknown as TraceCompact['tokens'][number]
  })
  return copy as unknown as TraceCompact
}

describe('the replay adapter', () => {
  it('never reads the answer, the word table, the tail flags or the tail statistic', () => {
    expect(() => replayTrace(guarded(heron), 'recorded')).not.toThrow()
    expect(() => settleEnd(replayTrace(guarded(brainstorm), 40))).not.toThrow()
  })

  it('turns the recorded drafts into draft events after the commitment of their step, and reads nothing else', () => {
    const replay = replayTrace(guarded(heron), 1)
    const drafts = replay.events.filter((e) => e.type === 'draft')
    expect(drafts.length).toBeGreaterThan(20)
    for (let i = 1; i < replay.events.length; i += 1) {
      const previous = replay.events[i - 1]!
      const event = replay.events[i]!
      expect(event.atMs).toBeGreaterThanOrEqual(previous.atMs)
      // at one instant, the commitment comes first
      if (event.type === 'commit' && previous.atMs === event.atMs) expect(previous.type).not.toBe('draft')
    }
    // a draft is shown as a draft and never as text; the page is the same with them and without them
    const bare = replayTrace({ ...heron, drafts: undefined }, 1)
    expect(pageText(settleEnd(replay))).toBe(pageText(settleEnd(bare)))
    const mid = settleAt(replay, 40)
    expect(Object.keys(mid.drafts).length).toBeGreaterThan(0)
    for (const key of Object.keys(mid.drafts)) expect(mid.tokens[Number(key)]).toBeUndefined()
  })

  it('reproduces the exact recorded output, under every policy, from commitments alone', () => {
    for (const policy of ['word', 'sentence', 'paragraph'] as const) {
      const end = settleEnd(replayTrace(heron, 1), policy)
      expect(end.status).toBe('complete')
      expect(pageText(end)).toBe(heron.answer)
      expect(end.passages.map((p) => p.text).join('')).toBe(heron.answer)
    }
  })

  it('knows the bound before the first event and the length only at the end token', () => {
    const replay = replayTrace(brainstorm, 1)
    expect(replay.bound).toBe(128)
    const early = settleAt(replay, 100)
    expect(early.endAt).toBeNull()
    expect(early.receivedCount).toBeGreaterThan(90)
    const end = settleEnd(replay)
    expect(end.endAt).toBe(8)
    expect(pageText(end)).toBe(brainstorm.answer)
  })

  it('seeks causally: no state at time t depends on events after t', () => {
    // on the uniform clock step k completes at t = k + 1
    const replay = replayTrace(heron, 1)
    const at3 = settleAt(replay, 3)
    expect(pageText(at3)).toBe('')
    expect(formingText(at3)).toBe('The sun')
    expect(heldText(at3)).toBe(' rises')
    const at31 = settleAt(replay, 31)
    expect(formingText(at31)).toBe('The sun rises in the sky,\n')
    expect(heldText(at31)).toBe('A')
    const at32 = settleAt(replay, 32)
    expect(pageText(at32)).toBe('')
    expect(formingText(at32).startsWith('The sun rises in the sky,\nA bird rises in the sky,\n')).toBe(true)
  })

  it('labels every pace honestly', () => {
    expect(paceLabel('recorded')).toMatch(/recorded/)
    expect(paceLabel(40)).toMatch(/synthetic/)
    expect(paceLabel({ scale: 10 })).toMatch(/1\/10/)
    expect(replayTrace(heron, { scale: 10 }).durationMs).toBeCloseTo(replayTrace(heron, 'recorded').durationMs / 10, 6)
    expect(() => replayTrace(heron, 0)).toThrow(RangeError)
    expect(() => replayTrace(heron, { scale: 0 })).toThrow(RangeError)
  })

  it('reaches a terminal state on every authored fixture', () => {
    for (const replay of DEMO_REPLAYS) {
      const end = settleEnd(replay)
      expect(['complete', 'stopped', 'error', 'revision']).toContain(end.status)
    }
    const split = settleEnd(DEMO_REPLAYS.find((r) => r.id === 'split-word')!, 'word')
    expect(pageText(split)).toBe('The answer is Sapphire Blue.')
  })

  it('reproduces all 60 recordings exactly, under every policy', async () => {
    for (const id of TRACE_IDS) {
      const trace = await loadTrace(id)
      for (const policy of ['word', 'sentence', 'paragraph'] as const) {
        const end = settleEnd(replayTrace(guarded(trace), 1), policy)
        expect(end.status, `${id} ${policy}`).toBe('complete')
        expect(pageText(end), `${id} ${policy}`).toBe(trace.answer)
      }
    }
  }, 30_000)
})

describe('the spins', () => {
  it('turns the recorded spins into spin events after the drafts of their step, and the page is the same without them', () => {
    const replay = replayTrace(heron, 1)
    const spins = replay.events.filter((e) => e.type === 'spin')
    expect(spins.length).toBeGreaterThan(20)
    for (let i = 1; i < replay.events.length; i += 1) {
      const previous = replay.events[i - 1]!
      const event = replay.events[i]!
      if (event.type === 'draft' && previous.atMs === event.atMs) expect(previous.type).not.toBe('spin')
    }
    const bare = replayTrace({ ...heron, spins: undefined }, 1)
    expect(settleEnd(replay).passages).toEqual(settleEnd(bare).passages)
    const mid = settleAt(replay, replay.durationMs / 2)
    expect(Object.keys(mid.spins).length).toBeGreaterThan(0)
    for (const key of Object.keys(mid.spins)) expect(mid.tokens[Number(key)]).toBeUndefined()
  })
})


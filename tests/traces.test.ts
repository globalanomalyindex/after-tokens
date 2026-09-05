import { describe, expect, it } from 'vitest'
import diffusionExplainJson from '@/data/traces/compact/diffusion-explain__lowconf-b32.json'
import { tokenize } from '@/lib/diffusion/tokenize'
import {
  END_BELIEF_GLYPH,
  asTrace,
  traceAnswerText,
  traceProvisionalText,
  traceSpeedup,
  traceStepAt,
  traceStrategy,
} from '@/lib/diffusion/traces'

const diffusionExplain = asTrace(diffusionExplainJson)

describe('recorded trajectory data', () => {
  it('has non-empty, non-decreasing changes per word, capped at lock_step, ending on the word text', () => {
    for (const w of diffusionExplain.words) {
      expect(w.changes.length).toBeGreaterThan(0)
      let prevStep = -Infinity
      for (const [step] of w.changes) {
        expect(step).toBeGreaterThanOrEqual(prevStep)
        expect(step).toBeLessThanOrEqual(w.lock_step)
        prevStep = step
      }
      const [, lastText] = w.changes.at(-1)!
      expect(lastText).toBe(w.text)
    }
  })

  it('has a tail_done_step that is null or an integer within the recorded steps', () => {
    const { tail_done_step, step_ms } = diffusionExplain
    if (tail_done_step === null) {
      expect(tail_done_step).toBeNull()
    } else {
      expect(Number.isInteger(tail_done_step)).toBe(true)
      expect(tail_done_step).toBeGreaterThanOrEqual(0)
      expect(tail_done_step).toBeLessThan(step_ms.length)
    }
  })

  it('has traceProvisionalText at each word\'s lock_step equal to its own text', () => {
    diffusionExplain.words.forEach((w, i) => {
      expect(traceProvisionalText(diffusionExplain, i, w.lock_step)).toBe(w.text)
    })
  })

  it('draws an end-of-text belief as the pilcrow, never as the literal special token', async () => {
    const skyBlue = asTrace((await import('@/data/traces/compact/sky-blue__lowconf-b32.json')).default)
    let specials = 0
    let pilcrows = 0
    skyBlue.words.forEach((w, i) => {
      for (const [step, text] of w.changes) {
        if (/^<\|/.test(text) && step < w.lock_step) {
          specials += 1
          if (traceProvisionalText(skyBlue, i, step) === END_BELIEF_GLYPH) pilcrows += 1
        }
      }
    })
    // the run this guards against: the model believed "end here" for its last
    // open positions well before it committed the loop that filled them
    expect(specials).toBeGreaterThan(0)
    skyBlue.words.forEach((w, i) => {
      for (let step = 0; step < w.lock_step; step++) {
        expect(traceProvisionalText(skyBlue, i, step) ?? '').not.toMatch(/<\|/)
      }
    })
    expect(pilcrows).toBeGreaterThan(0)
  })

  it('clamps traceStepAt to [0, steps - 1] at the endpoints of progress', () => {
    const n = diffusionExplain.step_ms.length
    expect(traceStepAt(diffusionExplain, 0)).toBeGreaterThanOrEqual(0)
    expect(traceStepAt(diffusionExplain, 0)).toBeLessThanOrEqual(n - 1)
    expect(traceStepAt(diffusionExplain, 1)).toBe(n - 1)
  })
})

describe('word-unit parity between the capture script and tokenize', () => {
  it('tokenizes traceAnswerText into exactly one atom per word, with matching text', () => {
    const atoms = tokenize(traceAnswerText(diffusionExplain))
    expect(atoms).toHaveLength(diffusionExplain.words.length)
    atoms.forEach((atom, i) => {
      expect(atom.text).toBe(diffusionExplain.words[i]!.text)
    })
  })
})

describe('word lock_step invariants', () => {
  it('has lock_step >= first_step and lock_step within the recorded step range', () => {
    for (const w of diffusionExplain.words) {
      expect(w.lock_step).toBeGreaterThanOrEqual(w.first_step)
      expect(w.lock_step).toBeLessThan(diffusionExplain.step_ms.length)
    }
  })
})

describe('traceStrategy(diffusionExplain) satisfies the shared mode contract', () => {
  it('handles empty input', () => {
    const strategy = traceStrategy(diffusionExplain, { msPerStep: 40 })
    expect(strategy.computeTimeline([])).toEqual([])
    expect(strategy.totalDuration([])).toBe(0)
  })

  it('resolves every atom exactly once (resolving then resolved) within totalDuration', () => {
    const strategy = traceStrategy(diffusionExplain, { msPerStep: 40 })
    const words = diffusionExplain.words.map((w) => ({
      text: w.text,
      index: w.index,
      lineIndex: 0,
      bbox: { x: 0, y: 0, w: 40, h: 20 },
    }))
    const events = strategy.computeTimeline(words)
    const total = strategy.totalDuration(words)

    expect(events).toHaveLength(words.length * 2)
    for (const w of words) {
      expect(
        events.filter((e) => e.wordIndex === w.index && e.state === 'resolving'),
      ).toHaveLength(1)
      expect(
        events.filter((e) => e.wordIndex === w.index && e.state === 'resolved'),
      ).toHaveLength(1)
    }
    for (const event of events) {
      expect(Number.isFinite(event.t)).toBe(true)
      expect(event.t).toBeGreaterThanOrEqual(0)
      expect(event.t).toBeLessThanOrEqual(total)
    }
  })

  it('is deterministic on repeated calls', () => {
    const strategy = traceStrategy(diffusionExplain, { msPerStep: 40 })
    const words = diffusionExplain.words.slice(0, 12).map((w) => ({
      text: w.text,
      index: w.index,
      lineIndex: 0,
      bbox: { x: 0, y: 0, w: 40, h: 20 },
    }))
    expect(strategy.computeTimeline(words)).toEqual(strategy.computeTimeline(words))
  })

  it('locks words in the same order as their lock_step (ties allowed to be equal)', () => {
    const strategy = traceStrategy(diffusionExplain, { msPerStep: 40 })
    const words = diffusionExplain.words.map((w) => ({
      text: w.text,
      index: w.index,
      lineIndex: 0,
      bbox: { x: 0, y: 0, w: 40, h: 20 },
    }))
    const events = strategy.computeTimeline(words)
    const resolvedAt = new Map<number, number>()
    for (const e of events) {
      if (e.state === 'resolved') resolvedAt.set(e.wordIndex, e.t)
    }
    const byEventTime = [...resolvedAt.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([wordIndex]) => wordIndex)
    const byLockStep = [...diffusionExplain.words]
      .sort((a, b) => a.lock_step - b.lock_step)
      .map((w) => w.index)
    expect(byEventTime).toEqual(byLockStep)
  })
})

describe('traceSpeedup', () => {
  it('is greater than 1 at the default replay pace (the capture machine was slower)', () => {
    expect(traceSpeedup(diffusionExplain, 40)).toBeGreaterThan(1)
  })
})

describe('trace stats', () => {
  it('has a finite kendall_tau_step_vs_position within [-1, 1]', () => {
    const tau = diffusionExplain.stats.kendall_tau_step_vs_position
    expect(typeof tau).toBe('number')
    expect(Number.isFinite(tau as number)).toBe(true)
    expect(tau as number).toBeGreaterThanOrEqual(-1)
    expect(tau as number).toBeLessThanOrEqual(1)
  })
})

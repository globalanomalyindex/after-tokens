import { describe, expect, it } from 'vitest'
import weatherJson from '@/data/traces/compact/weather__lowconf-b32.json'
import { hybridView } from '@/lib/diffusion/trace-hybrid'
import { tokenize } from '@/lib/diffusion/tokenize'
import { asTrace, traceProvisionalText, traceStrategy, traceStepAtElapsed, traceStepEndsFor, traceStepDurations, SHAPED_CONTENT_STEP_MS, SHAPED_TAIL_STEP_MS } from '@/lib/diffusion/traces'

const weather = asTrace(weatherJson)
const AUTHORED = 'Mild. A little fog this morning but the sun is supposed to break through by noon. Hold off on the umbrella.'

describe('hybridView: recorded order and timing over authored words', () => {
  const words = tokenize(AUTHORED).map((a) => a.text)
  const view = hybridView(weather, words)

  it('has one word per authored word, with the authored text and a fresh index', () => {
    expect(view.words).toHaveLength(words.length)
    view.words.forEach((w, i) => {
      expect(w.index).toBe(i)
      expect(w.text).toBe(words[i])
    })
    expect(view.answer).toBe(AUTHORED)
  })

  it('keeps the recorded lock steps and confidences, mapped by relative position', () => {
    const m = weather.words.length
    view.words.forEach((w, i) => {
      const src = weather.words[Math.min(m - 1, Math.floor((i * m) / words.length))]!
      expect(w.lock_step).toBe(src.lock_step)
      expect(w.first_step).toBe(src.first_step)
      expect(w.conf).toBe(src.conf)
    })
  })

  it('never shows the model’s words: every belief and lock renders the authored word', () => {
    view.words.forEach((w, i) => {
      for (let step = 0; step <= w.lock_step; step++) {
        const t = traceProvisionalText(view, i, step)
        if (t !== undefined) expect(t).toBe(words[i])
      }
    })
  })

  it('drives the shared strategy contract: one forming and one lock event per authored word', () => {
    const atoms = tokenize(AUTHORED).map((a) => ({ ...a, bbox: { x: 0, y: 0, w: 10, h: 10 } }))
    const events = traceStrategy(view, { msPerStep: 40 }).computeTimeline(atoms)
    expect(events.filter((e) => e.state === 'resolving')).toHaveLength(words.length)
    expect(events.filter((e) => e.state === 'resolved')).toHaveLength(words.length)
  })
})

describe('the shaped pace', () => {
  it('plays tail-only steps short and word steps long, and the step lookup follows that clock', () => {
    const durs = traceStepDurations(weather, 'shaped')
    expect(durs).toHaveLength(weather.step_ms.length)
    const contentSteps = new Set(weather.tokens.filter((t) => !t.tail).map((t) => t.step))
    durs.forEach((d, i) => expect(d).toBe(contentSteps.has(i) ? SHAPED_CONTENT_STEP_MS : SHAPED_TAIL_STEP_MS))
    const ends = traceStepEndsFor(weather, 'shaped')
    expect(traceStepAtElapsed(ends, 0)).toBe(0)
    expect(traceStepAtElapsed(ends, ends[10]! + 1)).toBe(11)
    expect(traceStepAtElapsed(ends, 1e9)).toBe(ends.length - 1)
  })
})

import { describe, expect, it } from 'vitest'
import { LEGIBLE_GAP_MS, readingOrderLag, readingOrderLocks, withReadingOrder } from '@/lib/arrival/reading-order'
import { segmentPhrases } from '@/lib/arrival/phrases'
import { arrivalProfile, locksFromEvents } from '@/lib/arrival/profile'
import { scatter, syntheticAtoms } from '@/lib/arrival/references'
import { asTrace, traceAnswerText, traceStrategy } from '@/lib/diffusion/traces'
import heistJson from '@/data/traces/compact/heist-plot__lowconf-b128.json'

describe('reading order inside a phrase', () => {
  it('never lets a word become legible before its predecessor in the same phrase', () => {
    const atoms = syntheticAtoms('one two three four. five six seven.')
    const phrases = segmentPhrases(atoms)
    const locks = [500, 100, 400, 300, 900, 600, 800]
    const legible = readingOrderLocks(locks, phrases)
    expect(legible).toEqual([500, 540, 580, 620, 900, 940, 980])
    // with the anchor kept, the earliest commit in each phrase stays where it was
    expect(readingOrderLocks(locks, phrases, { anchor: true })).toEqual([500, 100, 540, 580, 900, 600, 940])
    const lag = readingOrderLag(locks, legible)
    expect(lag.waited).toBe(5)
    expect(lag.max).toBe(440)
    expect(lag.median).toBe(320)
  })

  it('leaves an already ordered phrase alone beyond the minimum gap', () => {
    const atoms = syntheticAtoms('one two three.')
    const legible = readingOrderLocks([0, 100, 200], segmentPhrases(atoms))
    expect(legible).toEqual([0, 100, 200])
    const tight = readingOrderLocks([0, 10, 20], segmentPhrases(atoms))
    expect(tight).toEqual([0, LEGIBLE_GAP_MS, 2 * LEGIBLE_GAP_MS])
  })

  it('transforms a scattered strategy into one with zero inversions and the same phrase-scale disorder', () => {
    const atoms = syntheticAtoms(
      'A crew of retired thieves is hired to empty a vault that has never been opened. The heist runs perfectly until the alarm stays silent.',
    )
    const before = arrivalProfile({ atoms, locks: locksFromEvents(scatter.computeTimeline(atoms), atoms.length), total: scatter.totalDuration(atoms) })
    const ordered = withReadingOrder(scatter, { anchor: false })
    const events = ordered.computeTimeline(atoms)
    const after = arrivalProfile({ atoms, locks: locksFromEvents(events, atoms.length), total: ordered.totalDuration(atoms) })
    expect(before.fluency.inversions).toBeGreaterThan(0.2)
    expect(after.fluency.inversions).toBe(0)
    const anchored = withReadingOrder(scatter)
    const anchoredProfile = arrivalProfile({ atoms, locks: locksFromEvents(anchored.computeTimeline(atoms), atoms.length), total: anchored.totalDuration(atoms) })
    expect(anchoredProfile.fluency.previewCost).toBeLessThanOrEqual(before.fluency.previewCost)
    expect(anchoredProfile.fluency.inversions).toBeLessThan(before.fluency.inversions)
    expect(after.fluency.tau).toBeLessThan(0.9)
    expect(ordered.name).toBe('scatter')
    // the state channel: every word still gets a resolving event no later than its lock
    for (const w of atoms) {
      const form = events.find((e) => e.wordIndex === w.index && e.state === 'resolving')!
      const lock = events.find((e) => e.wordIndex === w.index && e.state === 'resolved')!
      expect(form.t).toBeLessThanOrEqual(lock.t)
    }
    expect(ordered.totalDuration(atoms)).toBeGreaterThanOrEqual(scatter.totalDuration(atoms))
  })

  it('applies to a recorded run: commit order kept in the state channel, legibility in reading order', () => {
    const trace = asTrace(heistJson)
    const atoms = syntheticAtoms(traceAnswerText(trace), trace.prompt)
    const base = traceStrategy(trace, { pace: 'shaped' })
    const two = withReadingOrder(base)
    const events = two.computeTimeline(atoms)
    const locks = locksFromEvents(events, atoms.length)
    const p = arrivalProfile({ atoms, locks, total: two.totalDuration(atoms) })
    expect(p.fluency.previewCost).toBe(0)
    // the forming (state) events keep the sampler's own commit times
    const baseEvents = base.computeTimeline(atoms)
    for (const w of atoms) {
      const baseForm = baseEvents.find((e) => e.wordIndex === w.index && e.state === 'resolving')!
      const form = events.find((e) => e.wordIndex === w.index && e.state === 'resolving')!
      expect(form.t).toBeLessThanOrEqual(baseForm.t + 1e-6)
    }
  })
})

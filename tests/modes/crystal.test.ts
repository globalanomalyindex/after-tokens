import { describe, expect, it } from 'vitest'
import {
  crystal,
  crystalWith,
  computeCrystalSchedule,
  stepIntervalFor,
  stepTimeFor,
  wordsPerStep,
  CRYSTAL_PRE_ROLL_MS,
  CRYSTAL_STEP_MS_MIN,
  CRYSTAL_STEP_MS_MAX,
  CRYSTAL_STEP_MS_FLOOR,
  CRYSTAL_STEP_MS_CEILING,
  CRYSTAL_STEP_SPREAD_MS,
  CRYSTAL_TENSION_BUDGET,
  CRYSTAL_SWING,
} from '@/lib/diffusion/modes/crystal'
import { syntheticAtoms } from '@/lib/arrival/references'
import { arrivalProfile, locksFromEvents } from '@/lib/arrival/profile'
import { segmentPhrases } from '@/lib/arrival/phrases'

const HEIST_PROMPT = 'Summarize the plot of a heist movie in three sentences.'
const HEIST =
  'A crew of retired thieves is hired to empty a vault that has never been opened. The heist runs perfectly until the alarm that should have sounded stays silent, and the crew realizes the job was bait. The twist is that the vault was empty all along, and the real theft is the crew itself.'
const LIST = 'Five to start with:\n1. Drift Cobalt\n2. Folded Mango\n3. Wet Slate at Dusk\n4. Lemon Static\n5. The blue your tongue tastes after biting a wire'
const LONG = Array.from({ length: 12 }, (_, s) => `Sentence number ${s} carries a few plain words and then it ends.`).join(' ')

function profileOf(text: string, topic?: string, opts?: Parameters<typeof crystalWith>[0]) {
  const atoms = syntheticAtoms(text, topic)
  const strategy = opts ? crystalWith(opts) : crystal
  const events = strategy.computeTimeline(atoms)
  const locks = locksFromEvents(events, atoms.length)
  return { atoms, events, locks, profile: arrivalProfile({ atoms, locks, total: strategy.totalDuration(atoms) }) }
}

describe('crystal cadence', () => {
  it('spreads an answer over about the target number of steps', () => {
    expect(wordsPerStep(8)).toBe(1)
    expect(wordsPerStep(8, 2)).toBe(2)
    expect(wordsPerStep(90)).toBe(5)
    expect(wordsPerStep(90, 2)).toBe(5)
    const sch = computeCrystalSchedule(syntheticAtoms(HEIST, HEIST_PROMPT))
    expect(sch.steps).toBeGreaterThanOrEqual(14)
    expect(sch.steps).toBeLessThanOrEqual(30)
  })

  it('keeps every interval inside the threshold, and the voice inside the floor and ceiling', () => {
    for (const s of [1, 5, 12, 20, 40]) {
      expect(stepIntervalFor(s)).toBeGreaterThanOrEqual(CRYSTAL_STEP_MS_MIN)
      expect(stepIntervalFor(s)).toBeLessThanOrEqual(CRYSTAL_STEP_MS_MAX)
      expect(stepIntervalFor(s, 1.4)).toBeGreaterThanOrEqual(CRYSTAL_STEP_MS_FLOOR)
      expect(stepIntervalFor(s, 0.7)).toBeLessThanOrEqual(CRYSTAL_STEP_MS_CEILING)
      expect(stepIntervalFor(s, 9)).toBe(stepIntervalFor(s, 1.4))
    }
  })

  it('swings long and short with a linear average and starts after the pre-roll', () => {
    const gap = 200
    expect(stepTimeFor(0, gap, CRYSTAL_SWING)).toBe(CRYSTAL_PRE_ROLL_MS)
    expect(stepTimeFor(1, gap, CRYSTAL_SWING) - stepTimeFor(0, gap, CRYSTAL_SWING)).toBeCloseTo(gap * (1 + CRYSTAL_SWING), 6)
    expect(stepTimeFor(2, gap, CRYSTAL_SWING) - stepTimeFor(1, gap, CRYSTAL_SWING)).toBeCloseTo(gap * (1 - CRYSTAL_SWING), 6)
    expect(stepTimeFor(2, gap, 0.5)).toBe(stepTimeFor(2, gap, 0.12))
  })

  it('locks a 30-word answer under 4000ms and a 90-word one under 6000ms', () => {
    const short = syntheticAtoms(Array.from({ length: 30 }, (_, i) => `w${i}`).join(' '))
    const long = syntheticAtoms(Array.from({ length: 90 }, (_, i) => `w${i}`).join(' '))
    expect(crystal.totalDuration(short)).toBeLessThan(4000)
    expect(crystal.totalDuration(long)).toBeLessThan(6000)
  })
})

describe('crystal order', () => {
  it('holds the tension budget: never more than two phrases open at once', () => {
    for (const text of [HEIST, LIST, LONG]) {
      const { profile } = profileOf(text, HEIST_PROMPT)
      expect(profile.tension.max).toBeLessThanOrEqual(CRYSTAL_TENSION_BUDGET)
      expect(profile.tension.max).toBeGreaterThanOrEqual(1)
    }
  })

  it('is out of order at the phrase scale, and inside a phrase only the anchor runs ahead', () => {
    const { profile } = profileOf(LONG)
    expect(profile.fluency.previewCost).toBe(0)
    expect(profile.fluency.inversions).toBeLessThan(0.15)
    expect(profile.fluency.tau).toBeLessThan(0.85)
    expect(profile.fluency.tau).toBeGreaterThan(-0.5)
    const strict = profileOf(LONG, undefined, { anchorFirst: false }).profile
    expect(strict.fluency.inversions).toBe(0)
    expect(strict.fluency.previewCost).toBe(0)
  })

  it('locks the nucleus the step its phrase opens, ahead of the words before it', () => {
    const atoms = syntheticAtoms(HEIST, HEIST_PROMPT)
    const sch = computeCrystalSchedule(atoms)
    const rankOf = new Map<number, number>()
    sch.order.forEach((pos, r) => rankOf.set(pos, r))
    for (const ph of sch.phrases) {
      if (ph.end === ph.start || ph.nucleus === ph.start) continue
      expect(sch.stepOf[rankOf.get(ph.nucleus)!]).toBe(sch.openStep[ph.id])
      expect(rankOf.get(ph.nucleus)!).toBeLessThan(rankOf.get(ph.start)!)
    }
  })

  it('opens the gist first: the most salient phrase is among the first to open', () => {
    const atoms = syntheticAtoms(HEIST, HEIST_PROMPT)
    const sch = computeCrystalSchedule(atoms)
    const bySal = [...sch.phrases].sort((a, b) => b.salience - a.salience)
    const top = bySal[0]!
    expect(sch.openStep[top.id]).toBe(0)
    // the second seed lands away from the first
    const seeds = sch.phrases.filter((p) => sch.openStep[p.id] === 0)
    expect(seeds.length).toBe(Math.min(CRYSTAL_TENSION_BUDGET, sch.phrases.length))
  })

  it('opens the list markers early: a list shows its skeleton before its bodies fill', () => {
    const { atoms, locks } = profileOf(LIST, 'naming a new color')
    const markerLocks = atoms.filter((a) => /^\d\.$/.test(a.text)).map((a) => locks[a.index]!)
    const bodyLocks = atoms.filter((a) => !/^\d\.$/.test(a.text) && a.lineIndex > 0).map((a) => locks[a.index]!)
    const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!
    expect(median(markerLocks)).toBeLessThan(median(bodyLocks))
  })

  it('places the gist early and ends quietly', () => {
    const { profile } = profileOf(HEIST, HEIST_PROMPT)
    expect(profile.peak.gistAt).toBeLessThan(0.7)
    expect(profile.peak.endWeight).toBeLessThan(1.6)
  })

  it('tends to close a phrase on a step, far more often than a typewriter does', () => {
    const { profile } = profileOf(LONG)
    expect(profile.closure.alignment).toBeGreaterThan(0.45)
  })

  it('ghosts the nucleus when its phrase opens and every other word one step before it locks', () => {
    const atoms = syntheticAtoms(HEIST, HEIST_PROMPT)
    const sch = computeCrystalSchedule(atoms)
    const interval = stepIntervalFor(sch.steps)
    const events = crystal.computeTimeline(atoms)
    for (const ph of sch.phrases) {
      const openT = stepTimeFor(sch.openStep[ph.id]!, interval, CRYSTAL_SWING)
      for (let p = ph.start; p <= ph.end; p++) {
        const idx = atoms[p]!.index
        const form = events.find((e) => e.wordIndex === idx && e.state === 'resolving')!
        const lock = events.find((e) => e.wordIndex === idx && e.state === 'resolved')!
        expect(form.t).toBeLessThanOrEqual(lock.t)
        if (p === ph.nucleus && ph.end > ph.start) expect(lock.t).toBeGreaterThanOrEqual(openT - 1e-6)
        else expect(form.t).toBeGreaterThanOrEqual(openT - CRYSTAL_STEP_SPREAD_MS - 1e-6)
      }
    }
  })

  it('lets the budget open more loops when asked, and unbounded reproduces the many-seed regime', () => {
    const one = profileOf(LONG, undefined, { budget: 1 }).profile
    const three = profileOf(LONG, undefined, { budget: 3 }).profile
    const free = profileOf(LONG, undefined, { budget: 'unbounded' }).profile
    expect(one.tension.max).toBe(1)
    expect(three.tension.max).toBeLessThanOrEqual(3)
    expect(three.tension.max).toBeGreaterThan(one.tension.max)
    expect(free.tension.max).toBeGreaterThan(three.tension.max)
  })

  it('is deterministic and covers every word exactly once', () => {
    const atoms = syntheticAtoms(HEIST, HEIST_PROMPT)
    const a = computeCrystalSchedule(atoms)
    const b = computeCrystalSchedule(atoms)
    expect(a.order).toEqual(b.order)
    expect([...a.order].sort((x, y) => x - y)).toEqual(atoms.map((_, i) => i))
    expect(segmentPhrases(atoms).length).toBe(a.phrases.length)
  })

  it('handles one word and one-word phrases', () => {
    const one = syntheticAtoms('Mild.')
    expect(crystal.computeTimeline(one)).toHaveLength(2)
    expect(crystal.totalDuration(one)).toBeGreaterThan(CRYSTAL_PRE_ROLL_MS)
    const two = syntheticAtoms('Yes. No.')
    const events = crystal.computeTimeline(two)
    expect(events.filter((e) => e.state === 'resolved')).toHaveLength(2)
  })
})

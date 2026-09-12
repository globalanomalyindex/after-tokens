import { describe, expect, it } from 'vitest'
import { ambientScoreAt, ambientScoreCue, createAmbientScore, AMBIENT_SCORE_ROUND_MS } from '@/lib/settle/ambient-score'

describe('historical source-independent decorative score', () => {
  it('uses reproducible varied chapters, one cue at a time, with a geometric rest after each gesture', () => {
    for (const seed of ['a', 'b', 'c', 'd']) {
      const rows = createAmbientScore(seed)
      expect(rows).toEqual(createAmbientScore(seed))
      expect(rows).toHaveLength(5)
      expect(new Set(rows.map((row) => row.breathPeriodMs)).size).toBe(5)
      const cues = Array.from({ length: 4 }, (_, round) => rows.slice(1).map((row) => ({ row: row.index, round, at: ambientScoreCue(rows, row.index, round) }))).flat().sort((a, b) => a.at - b.at)
      for (const [index, cue] of cues.entries()) {
        const before = ambientScoreAt(rows, cue.at - .001), after = ambientScoreAt(rows, cue.at + .001)
        expect(after.map((shape, row) => JSON.stringify(shape) !== JSON.stringify(before[row]))).toEqual(rows.map((row) => row.index === cue.row))
        expect(after[cue.row]!.transitionMs).toBeGreaterThanOrEqual(900)
        expect(after[cue.row]!.transitionMs).toBeLessThanOrEqual(1300)
        const next = cues[index + 1]
        if (next) {
          const spacing = next.at - cue.at
          expect(spacing).toBeGreaterThanOrEqual(2200)
          expect(spacing).toBeLessThanOrEqual(3600)
          expect(spacing - after[cue.row]!.transitionMs - 100).toBeGreaterThanOrEqual(800)
          expect(ambientScoreAt(rows, next.at - .001)).toEqual(after)
        }
      }
      expect(ambientScoreAt(rows, 0)[0]).toEqual(ambientScoreAt(rows, 20 * AMBIENT_SCORE_ROUND_MS)[0])
      const changing = Array.from({ length: 5 }, (_, round) => ambientScoreAt(rows, (round + 1) * AMBIENT_SCORE_ROUND_MS)[1]!.pills)
      expect(new Set(changing.map((pills) => JSON.stringify(pills))).size).toBe(5)
    }
  })

  it('keeps cell identities and nonoverlap across every linear interpolation of adjacent score targets', () => {
    for (const seed of ['a', 'b', 'c']) {
      const rows = createAmbientScore(seed)
      for (let round = 0; round < 8; round++) for (const row of rows.slice(1)) {
        const cue = ambientScoreCue(rows, row.index, round)
        const before = ambientScoreAt(rows, cue - .001)[row.index]!, after = ambientScoreAt(rows, cue + .001)[row.index]!
        expect(before.pills).toHaveLength(6)
        expect(after.pills).toHaveLength(6)
        for (const t of [0, .17, .5, .83, 1]) {
          const cells = after.pills.map((cell, index) => ({ x: before.pills[index]!.x + t * (cell.x - before.pills[index]!.x), width: before.pills[index]!.width + t * (cell.width - before.pills[index]!.width) }))
          expect(cells[0]!.x).toBe(0)
          expect(cells.at(-1)!.x + cells.at(-1)!.width).toBeCloseTo(1, 10)
          for (const [index, cell] of cells.entries()) {
            if (cell.width < 0 || cell.x + cell.width > 1.0000001 || (index && cell.x < cells[index - 1]!.x + cells[index - 1]!.width - 1e-8)) throw Error(`Invalid interpolated score geometry at ${seed}/${round}/${row.index}/${t}`)
          }
        }
      }
    }
  })
})

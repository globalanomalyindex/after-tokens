import { describe, expect, it } from 'vitest'
import { ambientRowAt, createAmbientRows, deriveAmbientProfile } from '@/lib/settle/ambient-geometry'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'

describe('source-capability-safe ambient profile', () => {
  it('uses current snapshot widths and hard breaks, and changes when a candidate revises', () => {
    const measure = (text: string) => [...text].reduce((sum, char) => sum + (char === 'W' ? 20 : 5), 0)
    let state = reduceSettle(createSettleState('answer'), { type: 'snapshot', atMs: 1, text: 'WWWW\niiii', final: false })
    expect(deriveAmbientProfile(state, 100, measure)).toEqual([.8, .2])
    state = reduceSettle(state, { type: 'snapshot', atMs: 2, text: 'iiii\n\nWWWW', final: false })
    expect(deriveAmbientProfile(state, 100, measure)).toEqual([.2, 0, .8])
    expect(state.passages).toEqual([])
    expect(state.status).toBe('receiving')
  })

  it('cannot locate sparse commitments across a gap or past EOS and ignores other model fields', () => {
    const state = { source: 'commit' as const, snapshotCandidate: null, tokens: {
      0: { position: 0, text: 'abc' }, 2: { position: 2, text: 'hidden far tail' },
    } }
    for (const name of ['snapshotCandidate', 'prefix', 'drafts', 'spins', 'bound', 'receivedCount', 'answer', 'events']) {
      Object.defineProperty(state, name, { get: () => { throw Error(`Forbidden ${name}`) } })
    }
    expect(deriveAmbientProfile(state, 100, (text) => text.length * 10)).toEqual([.32])
    const ended = { ...createSettleState(), source: 'commit' as const, tokens: {
      0: { position: 0, text: 'abc' }, 1: { position: 1, text: 'EOS', end: true }, 2: { position: 2, text: 'must not affect geometry' },
    } }
    expect(deriveAmbientProfile(ended, 100, (text) => text.length * 10)).toEqual([.32])
  })

  it('leaves final-only and invalid-width sources unspecified, and caps long profiles', () => {
    const state = createSettleState()
    expect(deriveAmbientProfile(state, 100, (text) => text.length)).toEqual([])
    const snapshot = { ...state, source: 'snapshot' as const, snapshotCandidate: 'a'.repeat(500) }
    for (const width of [0, -1, Infinity, NaN]) expect(deriveAmbientProfile(snapshot, width, () => 500)).toEqual([])
    expect(deriveAmbientProfile(snapshot, 10, () => 500)).toEqual(Array(14).fill(1))
    expect(deriveAmbientProfile(snapshot, 100, () => NaN)).toEqual([])
  })
})

describe('persistent variable row geometry', () => {
  it('varies fourteen rows and successive cycles reproducibly without repeating five templates', () => {
    const rows = createAmbientRows('run-a')
    expect(rows).toHaveLength(14)
    expect(rows).toEqual(createAmbientRows('run-a'))
    expect(rows).not.toEqual(createAmbientRows('run-b'))
    expect(new Set(rows.map((row) => row.periodMs)).size).toBe(14)
    expect(rows.every((row) => row.count === 1 || (row.count >= 3 && row.count <= 6))).toBe(true)
    const changing = rows.find((row) => row.count > 1)!
    const arrangements = Array.from({ length: 8 }, (_, cycle) => ambientRowAt(changing, changing.periodMs * cycle + 1000).pills.map((pill) => Math.round(pill.width * 10000)).join(','))
    expect(new Set(arrangements).size).toBe(8)
    expect(ambientRowAt(rows[0]!, 0).width).not.toEqual(ambientRowAt(rows[5]!, 0).width)
  })

  it('keeps left/right bounds and nonoverlap throughout all local transitions, including birth and death', () => {
    for (const seed of ['a', 'b', 'c']) for (const row of createAmbientRows(seed)) {
      let previous = ambientRowAt(row, 0)
      for (let time = 200; time < 25000; time += 200) {
        const next = ambientRowAt(row, time)
        expect(next.pills).toHaveLength(row.count)
        for (const fraction of [0, .17, .5, .83, 1]) {
          const pills = next.pills.map((pill, index) => ({
            x: previous.pills[index]!.x + fraction * (pill.x - previous.pills[index]!.x),
            width: previous.pills[index]!.width + fraction * (pill.width - previous.pills[index]!.width),
          }))
          if (pills[0]!.x !== 0) throw Error(`Left anchor moved: seed=${seed}, row=${row.index}, time=${time}, fraction=${fraction}`)
          for (let index = 0; index < pills.length; index++) {
            const pill = pills[index]!, previousPill = pills[index - 1]
            if (!(pill.width >= 0 && pill.x + pill.width <= 1.0000001 && (!previousPill || pill.x >= previousPill.x + previousPill.width - 1e-8))) {
              throw Error(`Cell bounds or overlap failed: seed=${seed}, row=${row.index}, time=${time}, fraction=${fraction}, cell=${index}, geometry=${JSON.stringify(pills)}`)
            }
          }
        }
        previous = next
      }
    }
  })

  it('holds full known lines and keeps valid numeric profiles inside the row budget', () => {
    const row = createAmbientRows('known').find((item) => item.count > 1)!
    expect(ambientRowAt(row, 0, .96)).toEqual(ambientRowAt(row, 15000, .96))
    expect(ambientRowAt(row, 15000, .96).pills[0]).toEqual({ x: 0, width: 1, opacity: 1, float: 0 })
    expect(ambientRowAt(row, 0, .4).width).toBe(.4)
    expect(ambientRowAt(row, 0, .04).width).toBe(.24)
    expect(ambientRowAt(row, 0, 0).width).toBe(0)
    expect(ambientRowAt(row, 0, 9).width).toBe(1)
    expect(ambientRowAt(row, 0, NaN).width).toBe(row.width)
  })

  it('lets interior cells truly disappear and return while retaining both outer anchors', () => {
    const row = createAmbientRows('birth').find((item) => item.count > 1)!
    const states = Array.from({ length: 400 }, (_, index) => ambientRowAt(row, index * 200))
    expect(states.some((state) => state.pills.some((pill) => pill.width === 0 && pill.opacity === 0))).toBe(true)
    expect(states.some((state) => state.pills.every((pill) => pill.opacity === 1))).toBe(true)
    for (const state of states) {
      expect(state.pills[0]!.opacity).toBe(1)
      expect(state.pills.at(-1)!.opacity).toBe(1)
    }
  })
})

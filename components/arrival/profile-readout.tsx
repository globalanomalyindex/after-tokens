'use client'

import { useMemo } from 'react'
import { segmentPhrases, type PhraseAtom } from '@/lib/arrival/phrases'
import type { WordState } from '@/lib/diffusion/types'

// A live readout beside a stage: the arrival profile's tension and closure,
// read off the words' states as they settle. Open loops are phrases partly
// settled; closures are phrases fully settled. The numbers are the state of
// the render, never a claim about the reader.

type Props = {
  atoms: PhraseAtom[]
  states: Map<number, WordState>
  budget?: number | 'unbounded'
  className?: string
}

export function useLiveProfile(atoms: PhraseAtom[], states: Map<number, WordState>) {
  return useMemo(() => {
    const phrases = segmentPhrases(atoms)
    let open = 0
    let closed = 0
    let settled = 0
    let maxOpen = 0
    for (const ph of phrases) {
      let s = 0
      for (let p = ph.start; p <= ph.end; p++) {
        const st = states.get(atoms[p]!.index) ?? 'pending'
        if (st === 'resolved') s++
      }
      settled += s
      const size = ph.end - ph.start + 1
      if (s === size) closed++
      else if (s > 0 && size > 1) open++
    }
    maxOpen = open
    return { phrases: phrases.length, open, closed, settled, words: atoms.length, maxOpen }
  }, [atoms, states])
}

export function ProfileReadout({ atoms, states, budget, className = '' }: Props) {
  const live = useLiveProfile(atoms, states)
  const cap = budget === 'unbounded' ? Math.max(4, live.phrases) : (budget ?? 2)
  return (
    <dl className={`readout grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center ${className}`} aria-live="off">
      <dt className="label">open loops</dt>
      <dd className="flex items-center gap-1.5">
        {Array.from({ length: Math.min(cap, 6) }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="inline-block h-3 w-3 rounded-full border"
            style={{
              borderColor: 'currentColor',
              background: i < live.open ? 'var(--cobalt)' : 'transparent',
              borderWidth: i < live.open ? 0 : 0.8,
              transition: 'background 200ms var(--ease-out-strong)',
            }}
          />
        ))}
        <span className="ml-1">
          {live.open}
          {budget === 'unbounded' ? '' : ` / ${cap}`}
        </span>
      </dd>
      <dt className="label">closures</dt>
      <dd>
        {live.closed} / {live.phrases}
      </dd>
      <dt className="label">settled</dt>
      <dd>
        {live.settled} / {live.words}
      </dd>
    </dl>
  )
}

'use client'

import { memo } from 'react'
import type { WordState } from '@/lib/diffusion/types'

type Props = {
  atomIndex: number
  finalText: string
  candidates: string[]
  state: WordState
  cycleTick: number
  slotWidth: number
  reduced?: boolean
  // The sampler's own successive guesses for this word, recorded at capture
  // time (see lib/diffusion/traces.ts, traceProvisionalText). When state is
  // 'pending' and this is defined, it replaces the cycled candidate: the
  // pending state in the recorded trajectory mode is literally what the
  // model's provisional argmax was at that step.
  provisionalText?: string
}

function CyclingWordImpl({
  atomIndex,
  finalText,
  candidates,
  state,
  cycleTick,
  slotWidth,
  provisionalText,
}: Props) {
  // pending: cycle through candidates with a per-word phase offset, unless a
  // real recorded provisionalText is supplied, in which case that replaces
  // the synthetic cycle. resolving and resolved show the final text.
  const ringIdx = candidates.length > 0
    ? (cycleTick + atomIndex * 3) % candidates.length
    : 0
  const showFinal = state !== 'pending' || candidates.length === 0
  const pendingDisplay = provisionalText ?? candidates[ringIdx] ?? finalText
  const display = showFinal ? finalText : pendingDisplay
  const reservedWidth = slotWidth > 0 ? `${slotWidth}px` : undefined
  const isBelief = state === 'pending' && provisionalText != null

  // Text swaps in place. Noise churn lives under a 4.2 px blur where any
  // crossfade is invisible work (it used to run a per-word Motion crossfade,
  // ninety of them at once on a long answer), and a lock is crisp at once by
  // design: the slot's own filter transition carries it. The one change that
  // is meant to be seen is a change of belief, the prediction error made
  // visible, so a belief keys its inner span on the text and re-runs a short
  // CSS entrance each time the model changes its mind.
  return (
    <span
      data-cycling-word
      data-state={state}
      data-belief={isBelief ? 'true' : undefined}
      data-word-index={atomIndex}
      className="cycling-slot"
      style={{
        display: 'inline-block',
        position: 'relative',
        minWidth: state === 'pending' ? reservedWidth : undefined,
        whiteSpace: 'nowrap',
        verticalAlign: 'baseline',
        // Used by CSS to desynchronize per-word breathing animations.
        ['--word-index' as string]: String(atomIndex),
      } as React.CSSProperties}
    >
      <span
        key={isBelief ? display : 'text'}
        className={isBelief ? 'belief-shift' : undefined}
        style={{ display: 'inline-block' }}
      >
        {display}
      </span>
    </span>
  )
}

// cycleTick increments every 390ms while any word is still pending, and it is
// passed to every CyclingWord in a paragraph. A settled word no longer reads
// cycleTick (showFinal is already true), so re-rendering it on every tick is
// wasted work. The one non-obvious rule: cycleTick is deliberately excluded
// from this comparator, so once a word leaves 'pending' it stops re-rendering
// on the ticks that keep the still-pending words cycling. provisionalText
// gets the same treatment as cycleTick for a settled word (showFinal already
// ignores it) but, unlike cycleTick, a change to it while still pending must
// re-render: that's the recorded trajectory's real mind change.
function areEqual(prev: Props, next: Props): boolean {
  if (
    prev.atomIndex !== next.atomIndex ||
    prev.finalText !== next.finalText ||
    prev.state !== next.state ||
    prev.slotWidth !== next.slotWidth ||
    prev.reduced !== next.reduced ||
    prev.candidates !== next.candidates
  ) {
    return false
  }
  if (next.state === 'pending' && prev.provisionalText !== next.provisionalText) {
    return false
  }
  return next.state !== 'pending'
}

export const CyclingWord = memo(CyclingWordImpl, areEqual)
CyclingWord.displayName = 'CyclingWord'

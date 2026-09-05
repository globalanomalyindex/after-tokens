'use client'

import { memo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
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
  reduced = false,
  provisionalText,
}: Props) {
  // pending → cycle through candidates with a per-word phase offset, unless a
  // real recorded provisionalText is supplied, in which case that replaces
  // the synthetic cycle. resolved & resolving → show final text. (Resolving
  // means "locked but still blurred" until the global unblur threshold; the
  // text content matches resolved.)
  const ringIdx = candidates.length > 0
    ? (cycleTick + atomIndex * 3) % candidates.length
    : 0
  const showFinal = state !== 'pending' || candidates.length === 0
  const pendingDisplay = provisionalText ?? candidates[ringIdx] ?? finalText
  const display = showFinal ? finalText : pendingDisplay
  const reservedWidth = slotWidth > 0 ? `${slotWidth}px` : undefined

  return (
    <span
      data-cycling-word
      data-state={state}
      // belief: a pending slot showing the model's own guess (above the
      // probability floor) rather than authored noise; CSS renders it as
      // forming, less blurred and steadier than noise, still short of readable.
      data-belief={state === 'pending' && provisionalText != null ? 'true' : undefined}
      data-word-index={atomIndex}
      className="cycling-slot"
      style={{
        display: 'inline-block',
        position: 'relative',
        minWidth: state === 'pending' ? reservedWidth : undefined,
        marginRight: '0.28em',
        whiteSpace: 'nowrap',
        verticalAlign: 'baseline',
        // Used by CSS to desynchronize per-word breathing/pulse animations.
        ['--word-index' as string]: String(atomIndex),
      } as React.CSSProperties}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          initial={reduced ? false : { opacity: 0, filter: 'blur(7px)', y: 1 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          exit={reduced ? undefined : { opacity: 0, filter: 'blur(7px)', y: -1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          style={{ display: 'inline-block' }}
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// cycleTick increments every 440ms while any word is still pending, and it is
// passed to every CyclingWord in a paragraph. A settled word no longer reads
// cycleTick (showFinal is already true), so re-rendering it on every tick is
// wasted work. The one non-obvious rule: cycleTick is deliberately excluded
// from this comparator, so once a word leaves 'pending' it stops re-rendering
// on the ticks that keep the still-pending words cycling. provisionalText
// gets the same treatment as cycleTick for a settled word (showFinal already
// ignores it) but, unlike cycleTick, a change to it while still pending must
// re-render: that's the recorded trajectory's real mind-change crossfade.
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

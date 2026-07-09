'use client'

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
}

export function CyclingWord({
  atomIndex,
  finalText,
  candidates,
  state,
  cycleTick,
  slotWidth,
  reduced = false,
}: Props) {
  // pending → cycle through candidates with a per-word phase offset.
  // resolved & resolving → show final text. (Resolving means "locked but still blurred"
  // until the global unblur threshold; the text content matches resolved.)
  const ringIdx = candidates.length > 0
    ? (cycleTick + atomIndex * 3) % candidates.length
    : 0
  const showFinal = state !== 'pending' || candidates.length === 0
  const display = showFinal ? finalText : (candidates[ringIdx] ?? finalText)
  const reservedWidth = slotWidth > 0 ? `${slotWidth}px` : undefined

  return (
    <span
      data-cycling-word
      data-state={state}
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

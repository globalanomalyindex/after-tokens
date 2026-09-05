'use client'

import { motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'

// Reusable chat-bubble primitives shared by every "answer demo" stage in the
// case study. Putting prompts in front of the diffused responses makes the
// thesis legible: every mode is an answer to a real question.

type ChatFrameProps = {
  children: ReactNode
  className?: string
}

export function ChatFrame({ children, className = '' }: ChatFrameProps) {
  return <div className={`flex flex-col gap-4 ${className}`}>{children}</div>
}

type PromptBubbleProps = {
  children: ReactNode
  label?: string
}

export function PromptBubble({ children, label = 'You asked' }: PromptBubbleProps) {
  const reduced = usePrefersReducedMotion()
  return (
    <motion.div
      className="self-end max-w-[88%] rounded-2xl rounded-br-md px-4 py-3 text-sm leading-snug"
      // Pops in like a message the user just sent, a snappy spring scale,
      // not a fade. This is the "send" beat of the exchange.
      initial={reduced ? false : { opacity: 0, y: 10, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 30, mass: 0.8 }}
      style={{
        background: 'color-mix(in oklab, var(--stage-text) 14%, transparent)',
        color: 'var(--stage-text)',
        border: '0.6px solid color-mix(in oklab, var(--stage-text) 22%, transparent)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <div
        className="text-[9.5px] uppercase tracking-[0.18em] mb-1"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)',
        }}
      >
        + {label}
      </div>
      {children}
    </motion.div>
  )
}

type AnswerBubbleProps = {
  children: ReactNode
  label?: string
  className?: string
  delay?: number
  // The bubble doesn't know the size of the answer it's about to hold, so
  // it starts compact and grows to natural height over the diffusion window.
  // This is the visual that sells "the AI is thinking and the answer is
  // becoming clear." Default growth duration matches typical text diffusion.
  growMs?: number
}

const COMPACT_HEIGHT = 70

export function AnswerBubble({
  children,
  label = 'Answer',
  className = '',
  delay = 0.08,
  growMs = 2400,
}: AnswerBubbleProps) {
  const reduced = usePrefersReducedMotion()
  const innerRef = useRef<HTMLDivElement>(null)
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null)
  const [grown, setGrown] = useState(false)
  // growMs=0 opts out of the height grow entirely. Useful when the bubble
  // contains a fixed-size element (like a weather widget) that needs to be
  // visible during its own diffusion rather than clipped behind a growing
  // overflow window.
  const enableGrow = growMs > 0 && !reduced

  useLayoutEffect(() => {
    if (!innerRef.current) return
    const el = innerRef.current
    let raf = 0
    const measure = () => {
      if (!enableGrow) return
      raf = requestAnimationFrame(() => {
        const h = el.scrollHeight
        if (h > 0) setNaturalHeight(h)
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [enableGrow])

  useEffect(() => {
    if (!enableGrow) {
      setGrown(true)
      return
    }
    if (naturalHeight == null) return
    const t = setTimeout(() => setGrown(true), growMs + 80)
    return () => clearTimeout(t)
  }, [naturalHeight, growMs, enableGrow])

  const target = enableGrow ? (naturalHeight ?? COMPACT_HEIGHT) : 9999

  return (
    <motion.div
      className={`self-start w-full max-w-[94%] rounded-2xl rounded-bl-md px-4 py-3 text-sm ${className}`}
      style={{
        background: 'color-mix(in oklab, var(--stage-text) 6%, transparent)',
        color: 'var(--stage-text)',
        border: '0.6px solid color-mix(in oklab, var(--stage-text) 14%, transparent)',
        overflow: grown ? 'visible' : 'hidden',
        fontFamily: 'var(--font-ui)',
      }}
      initial={
        reduced
          ? false
          : { opacity: 0, y: 8, filter: 'blur(4px)', maxHeight: enableGrow ? COMPACT_HEIGHT : 9999 }
      }
      animate={{
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        maxHeight: grown ? 9999 : target,
      }}
      transition={reduced ? { duration: 0 } : {
        opacity: { duration: 0.36, ease: [0.23, 1, 0.32, 1], delay },
        y: { duration: 0.36, ease: [0.23, 1, 0.32, 1], delay },
        filter: { duration: 0.36, ease: [0.23, 1, 0.32, 1], delay },
        maxHeight: {
          duration: grown ? 0 : growMs / 1000,
          ease: [0.16, 1, 0.3, 1],
          delay: grown ? 0 : delay + 0.05,
        },
      }}
    >
      <div ref={innerRef}>
        <div
          className="text-[9.5px] uppercase tracking-[0.18em] mb-2"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)',
          }}
        >
          + {label}
        </div>
        {children}
      </div>
    </motion.div>
  )
}

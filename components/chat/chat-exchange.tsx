'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { PromptBubble, AnswerBubble } from './chat-bubble'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'

type ChatExchangeProps = {
  prompt: ReactNode
  children: ReactNode
  promptLabel?: string
  answerLabel?: string
  // The "thinking" beat between the prompt sending and the answer arriving.
  thinkingMs?: number
  // Forwarded to AnswerBubble. 0 opts out of the height-grow (used by the
  // weather widget, which needs its full fixed height immediately).
  answerGrowMs?: number
  // Change this to replay the whole exchange from the top (used by the coda's
  // prompt picker / mode / brand / replay controls).
  runKey?: string | number
  className?: string
}

// Orchestrates a realistic chat exchange for the demo stages: on scroll into
// view the prompt "sends" (pops in), a typing indicator holds for a beat, then
// the answer bubble arrives and its contents begin to diffuse. Because the
// answer content only mounts at the answer phase, any DiffusionText/widget
// inside it should use trigger="immediate" — it starts exactly on arrival.
export function ChatExchange({
  prompt,
  children,
  promptLabel,
  answerLabel,
  thinkingMs = 800,
  answerGrowMs,
  runKey,
  className = '',
}: ChatExchangeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  // 0 = idle, 1 = prompt sent (thinking), 2 = answer arriving
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    setPhase(0)
    const el = ref.current
    if (!el) return
    let beat: ReturnType<typeof setTimeout>
    // IntersectionObserver fires once with the current state: if already in
    // view (a runKey-driven replay), it begins immediately; if off-screen
    // (first load), it waits until the stage is scrolled into view.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          io.disconnect()
          if (reduced) {
            setPhase(2)
          } else {
            setPhase(1)
            beat = setTimeout(() => setPhase(2), thinkingMs)
          }
        }
      },
      { threshold: 0.3, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      clearTimeout(beat)
    }
  }, [runKey, thinkingMs, reduced])

  return (
    <div ref={ref} data-demo className={`flex flex-col gap-4 ${className}`}>
      {phase >= 1 && <PromptBubble label={promptLabel}>{prompt}</PromptBubble>}
      {phase === 1 && <ThinkingBubble />}
      {phase >= 2 && (
        <AnswerBubble label={answerLabel} growMs={answerGrowMs}>
          {children}
        </AnswerBubble>
      )}
    </div>
  )
}

// The "assistant is typing" bubble — three pulsing dots, shown in the beat
// between the prompt and the answer.
function ThinkingBubble() {
  return (
    <motion.div
      className="self-start rounded-2xl rounded-bl-md px-4 py-3.5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      style={{
        background: 'color-mix(in oklab, var(--stage-text) 6%, transparent)',
        border: '0.6px solid color-mix(in oklab, var(--stage-text) 14%, transparent)',
      }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="thinking-dot"
            style={{ background: 'var(--stage-text)', animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </motion.div>
  )
}

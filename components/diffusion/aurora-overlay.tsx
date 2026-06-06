'use client'

import { useMemo } from 'react'
import { motion, useTransform, type MotionValue } from 'motion/react'
import { computeAuroraLines, type AuroraLine } from '@/lib/diffusion/modes/aurora-lines'
import type { OverlayProps } from '@/lib/diffusion/types'

// A luminous band per VISUAL row. Each band's bright center sweeps from the
// row's first word center to its last over that row's lock window, so the glow
// passes over each token exactly as the choreographer locks it. Rows are
// derived from measured geometry, so a wrapped paragraph lights up row by row
// rather than only along the top line.
export function AuroraOverlay({ words, progress, reduced }: OverlayProps) {
  const lines = useMemo(() => computeAuroraLines(words), [words])
  if (reduced) return null

  return (
    <div
      aria-hidden="true"
      className="diffusion-overlay absolute inset-0 pointer-events-none overflow-hidden"
    >
      {lines.map((line) => (
        <AuroraBand key={line.idx} line={line} progress={progress} />
      ))}
    </div>
  )
}

function AuroraBand({ line, progress }: { line: AuroraLine; progress: MotionValue<number> }) {
  // A soft stripe a few line-heights wide. Its center travels minC -> maxC over
  // the row's progress window, so the bright core meets each word as it locks.
  const stripeW = line.h * 5
  const startTx = line.minC - stripeW / 2
  const endTx = line.maxC - stripeW / 2
  const x = useTransform(progress, [line.startP, line.endP], [startTx, endTx], { clamp: true })
  const opacity = useTransform(
    progress,
    [line.startP, line.startP + 0.02, line.endP - 0.03, line.endP],
    [0, 1, 1, 0],
  )

  return (
    <motion.div
      style={{
        position: 'absolute',
        top: line.y - line.h * 0.45,
        left: 0,
        width: stripeW,
        height: line.h * 2,
        x,
        opacity,
        filter: 'blur(6px)',
        mixBlendMode: 'screen',
        background: `linear-gradient(90deg,
          transparent 0%,
          color-mix(in oklab, var(--accent) 8%, transparent) 24%,
          color-mix(in oklab, var(--accent) 40%, transparent) 42%,
          color-mix(in oklab, var(--accent) 72%, transparent) 50%,
          color-mix(in oklab, var(--accent) 40%, transparent) 58%,
          color-mix(in oklab, var(--accent) 8%, transparent) 76%,
          transparent 100%
        )`,
        willChange: 'transform, opacity',
      }}
    />
  )
}

'use client'

import { motion, useTransform } from 'motion/react'
import type { OverlayProps } from '@/lib/diffusion/types'

export function FogOverlay({ progress, reduced }: OverlayProps) {
  // sweep band starts ~30% off the top-left edge, exits ~140% past the bottom-right
  const translate = useTransform(progress, [0, 1], ['-35%', '140%'])
  // entry & exit fade so the band doesn't pop in/out
  const opacity = useTransform(progress, [0, 0.08, 0.92, 1], [0, 1, 1, 0])

  if (reduced) return null

  return (
    <div aria-hidden="true" className="diffusion-overlay absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        style={{
          position: 'absolute',
          inset: '-30%',
          translateX: translate,
          translateY: translate,
          opacity,
          background: `linear-gradient(135deg,
            transparent 35%,
            color-mix(in oklab, var(--stage-text) 10%, transparent) 44%,
            color-mix(in oklab, var(--stage-text) 26%, transparent) 50%,
            color-mix(in oklab, var(--stage-text) 36%, transparent) 56%,
            color-mix(in oklab, var(--stage-text) 18%, transparent) 65%,
            transparent 78%
          )`,
          filter: 'blur(14px)',
          willChange: 'transform, opacity',
        }}
      />
    </div>
  )
}

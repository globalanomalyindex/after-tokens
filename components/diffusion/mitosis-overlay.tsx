'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { motion, useTransform } from 'motion/react'
import type { OverlayProps } from '@/lib/diffusion/types'
import {
  MITOSIS_PRE_ROLL_MS,
  MITOSIS_SPLIT_MS,
  computeMitosisLockOrder,
  computeMitosisLockTimes,
} from '@/lib/diffusion/modes/mitosis'

const PRE_ROLL_CLUSTER_RADIUS = 7 // tight cluster so metaball merges into one blob
const ORB_RADIUS_LARGE = 22 // during pre-roll (collective blob)
const ORB_RADIUS_FINAL = 7.5 // after split (per-word orbs)
const PRE_ROLL_DRIFT_X = 30
const PRE_ROLL_DRIFT_Y = 18
const PULSE_AMPLITUDE = 0.06
const POST_LOCK_FADE_MS = 240

type Pt = { x: number; y: number }

function easeOutCubic(t: number): number {
  const k = 1 - t
  return 1 - k * k * k
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export function MitosisOverlay({ words, progress, totalDuration, reduced }: OverlayProps) {
  const filterId = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (reduced) return
    if (!svgRef.current) return
    const parent = svgRef.current.parentElement
    if (!parent) return
    const measure = () => {
      const rect = parent.getBoundingClientRect()
      setSize({ w: rect.width, h: rect.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [reduced])

  const orbData = useMemo(() => {
    if (words.length === 0 || size.w === 0) return []
    const order = computeMitosisLockOrder(words)
    const lockTimes = computeMitosisLockTimes(words.length)
    const orderMap = new Map<number, number>()
    order.forEach((wordIndex, orderIdx) => orderMap.set(wordIndex, orderIdx))

    return words.map((w, arrIdx) => {
      const orderIdx = orderMap.get(w.index) ?? arrIdx
      // Hue distributed around the wheel so siblings are color-individualized
      const hue = (orderIdx * (360 / words.length) + arrIdx * 14) % 360
      return {
        wordIndex: w.index,
        arrIdx,
        orderIdx,
        target: {
          x: w.bbox.x + w.bbox.w / 2,
          y: w.bbox.y + w.bbox.h * 0.5,
        } as Pt,
        hue,
        lockTime: lockTimes[orderIdx] ?? 0,
      }
    })
  }, [words, size])

  if (reduced) return null
  if (size.w === 0 || words.length === 0) return null

  const center: Pt = { x: size.w * 0.5, y: size.h * 0.5 }

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      className="diffusion-overlay absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <filter id={`meta-${filterId}`} x="-25%" y="-30%" width="150%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
          <feColorMatrix
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 22 -10
            "
          />
          {/* Subtle saturation knock-down for the frosted feel */}
          <feColorMatrix
            type="matrix"
            values="
              0.78 0.16 0.06 0 0.05
              0.10 0.78 0.12 0 0.05
              0.10 0.10 0.80 0 0.05
              0 0 0 1 0
            "
          />
        </filter>
      </defs>

      <g style={{ filter: `url(#meta-${filterId})` }}>
        {orbData.map((orb) => (
          <Orb
            key={orb.wordIndex}
            target={orb.target}
            hue={orb.hue}
            orderIdx={orb.orderIdx}
            totalOrbs={orbData.length}
            lockTime={orb.lockTime}
            center={center}
            progress={progress}
            totalDuration={totalDuration}
          />
        ))}
      </g>
    </svg>
  )
}

function Orb({
  target,
  hue,
  orderIdx,
  totalOrbs,
  lockTime,
  center,
  progress,
  totalDuration,
}: {
  target: Pt
  hue: number
  orderIdx: number
  totalOrbs: number
  lockTime: number
  center: Pt
  progress: OverlayProps['progress']
  totalDuration: number
}) {
  const splitStart = MITOSIS_PRE_ROLL_MS
  const splitEnd = MITOSIS_PRE_ROLL_MS + MITOSIS_SPLIT_MS

  // Each orb's seat in the pre-roll cluster (angular slot)
  const baseAngle = (orderIdx * Math.PI * 2) / Math.max(1, totalOrbs)

  const cx = useTransform(progress, (p) => {
    const t = p * totalDuration
    const orbitOmega = 0.0009
    const orbitR =
      PRE_ROLL_CLUSTER_RADIUS + Math.sin(t * 0.0012 + orderIdx * 0.7) * 2
    const drift = Math.sin(t * 0.0006) * PRE_ROLL_DRIFT_X
    const orbitX = center.x + drift + Math.cos(baseAngle + t * orbitOmega) * orbitR

    if (t < splitStart) return orbitX
    if (t < splitEnd) {
      const k = (t - splitStart) / (splitEnd - splitStart)
      return orbitX + (target.x - orbitX) * easeOutCubic(k)
    }
    return target.x
  })

  const cy = useTransform(progress, (p) => {
    const t = p * totalDuration
    const orbitOmega = 0.0009
    const orbitR =
      PRE_ROLL_CLUSTER_RADIUS + Math.sin(t * 0.0012 + orderIdx * 0.7) * 2
    const drift = Math.cos(t * 0.0008) * PRE_ROLL_DRIFT_Y
    const orbitY = center.y + drift + Math.sin(baseAngle + t * orbitOmega) * orbitR

    if (t < splitStart) return orbitY
    if (t < splitEnd) {
      const k = (t - splitStart) / (splitEnd - splitStart)
      return orbitY + (target.y - orbitY) * easeOutCubic(k)
    }
    return target.y
  })

  const r = useTransform(progress, (p) => {
    const t = p * totalDuration
    // Subtle breathing pulse throughout
    const pulse = 1 + Math.sin(t * 0.002 + orderIdx * 0.4) * PULSE_AMPLITUDE

    if (t < splitStart) {
      return ORB_RADIUS_LARGE * pulse
    }
    if (t < splitEnd) {
      const k = (t - splitStart) / (splitEnd - splitStart)
      // Shrink as orbs separate
      return (ORB_RADIUS_LARGE + (ORB_RADIUS_FINAL - ORB_RADIUS_LARGE) * easeInOut(k)) * pulse
    }
    // After split: per-orb size variation based on order (slightly larger for "important" ones)
    const sizeVariance = 1 + Math.sin(orderIdx * 1.3) * 0.18
    return ORB_RADIUS_FINAL * pulse * sizeVariance
  })

  const opacity = useTransform(progress, (p) => {
    const t = p * totalDuration
    if (t < lockTime) return 1
    const fade = (t - lockTime) / POST_LOCK_FADE_MS
    return Math.max(0, 1 - fade)
  })

  // Each orb has its own rainbow color; the metaball filter blends them
  const fillColor = `hsl(${hue}, 64%, 64%)`

  return <motion.circle cx={cx} cy={cy} r={r} fill={fillColor} style={{ opacity }} />
}

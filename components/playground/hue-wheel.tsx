'use client'

import { useCallback, useRef, useState } from 'react'
import { hueToAccent, normalizeHue } from '@/lib/playground/color'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'

type HueWheelProps = {
  hue: number // current hue 0..359 (controlled)
  onChange: (hue: number) => void // called continuously during drag + on keyboard
  disabled?: boolean // when true: dimmed, no pointer/keyboard interaction (but still renders the ring)
  size?: number // px diameter of the wheel; default 168
  className?: string
}

// Hairline color, derived from the ink token so it reads on the cream surface
// without resorting to a hard #000.
const HAIRLINE = 'color-mix(in oklab, var(--ink) 18%, transparent)'

// Custom ease-out — strong but subtle, no bounce.
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'

// Build the conic-gradient stops from the SAME hue→color function the rest of
// the app uses, so the displayed ring is a faithful preview. 24 stops (every
// 15°) keeps the spectrum smooth while staying cheap to recompute.
function buildConicStops(): string {
  const stops: string[] = []
  for (let deg = 0; deg <= 360; deg += 15) {
    stops.push(`${hueToAccent(deg)} ${deg}deg`)
  }
  return stops.join(', ')
}

export function HueWheel({
  hue,
  onChange,
  disabled = false,
  size = 168,
  className = '',
}: HueWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const reducedMotion = usePrefersReducedMotion()

  // Geometry. Ring thickness ~20% of size; thumb sits on the ring centerline.
  const thickness = Math.round(size * 0.2)
  const center = size / 2
  const ringRadius = center - thickness / 2
  const thumbSize = Math.round(thickness * 0.9)

  // Hue → thumb position. a = (hue - 90)° so hue 0 lands at 12 o'clock and
  // increases clockwise (screen +y is down, so +angle runs clockwise).
  const thumbAngle = ((hue - 90) * Math.PI) / 180
  const thumbX = center + ringRadius * Math.cos(thumbAngle)
  const thumbY = center + ringRadius * Math.sin(thumbAngle)

  // Conic stops are static for a fixed hue→color band, but cheap to rebuild and
  // kept inline so the ring always reflects the live color function.
  const conicStops = buildConicStops()

  // Pointer (x,y) in client space → hue. atan2 gives the angle from +x axis;
  // +90 rotates so screen-top reads as hue 0. Clockwise falls out naturally
  // because screen +y points down.
  const hueFromPoint = useCallback((clientX: number, clientY: number): number => {
    const el = wheelRef.current
    if (!el) return hue
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let deg = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI
    deg += 90
    return normalizeHue(deg)
  }, [hue])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsDragging(true)
      onChange(hueFromPoint(e.clientX, e.clientY))
    },
    [disabled, hueFromPoint, onChange],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !isDragging) return
      onChange(hueFromPoint(e.clientX, e.clientY))
    },
    [disabled, isDragging, hueFromPoint, onChange],
  )

  const endDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return
      setIsDragging(false)
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    },
    [isDragging],
  )

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return
      const big = e.shiftKey ? 10 : 1
      let next: number | null = null
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          next = hue + big
          break
        case 'ArrowLeft':
        case 'ArrowDown':
          next = hue - big
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = 359
          break
        default:
          return
      }
      e.preventDefault()
      onChange(normalizeHue(next))
    },
    [disabled, hue, onChange],
  )

  // Snap 1:1 while dragging (no transition); ease into place otherwise, unless
  // the user prefers reduced motion.
  const thumbTransition =
    isDragging || reducedMotion ? 'none' : `transform 120ms ${EASE}`

  const accent = hueToAccent(hue)

  return (
    <div
      ref={wheelRef}
      role="slider"
      aria-label="Accent hue"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={Math.round(hue)}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className={`relative select-none rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        opacity: disabled ? 0.45 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        touchAction: 'none',
        cursor: disabled ? 'default' : 'pointer',
        outline: 'none',
      }}
    >
      {/* Conic spectrum ring, masked into a donut. */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${conicStops})`,
          maskImage: `radial-gradient(closest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
          WebkitMaskImage: `radial-gradient(closest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
        }}
      />

      {/* Hairline borders to seat the ring on the cream surface. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ border: `0.8px solid ${HAIRLINE}` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          inset: thickness,
          border: `0.8px solid ${HAIRLINE}`,
        }}
      />

      {/* Optional understated center readout, in the hollow. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{
          fontFamily: 'var(--font-mono), ui-monospace, monospace',
          fontSize: Math.max(11, Math.round(size * 0.085)),
          color: 'var(--ink)',
          opacity: 0.4,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.02em',
        }}
      >
        {Math.round(hue)}°
      </div>

      {/* Thumb — fills with the live accent, ringed for contrast on any hue. */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          width: thumbSize,
          height: thumbSize,
          left: thumbX,
          top: thumbY,
          transform: 'translate(-50%, -50%)',
          transition: thumbTransition,
          backgroundColor: accent,
          border: '1.5px solid color-mix(in oklab, var(--ink) 30%, #fff 70%)',
          boxShadow: `0 0 0 1px ${HAIRLINE}, 0 1px 3px color-mix(in oklab, var(--ink) 22%, transparent)`,
        }}
      />

      {/* Focus-visible ring using the app accent token. Rendered as an overlay
          so it reads regardless of the masked ring beneath it. */}
      <style>{`
        [role="slider"]:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 3px;
        }
      `}</style>
    </div>
  )
}

'use client'

import { useEffect, useRef } from 'react'

// Top-down wave traveling across a grid of crosshairs. Each crosshair's
// brightness + size pulses with the wave's local amplitude — dark/small in
// the troughs, white/larger at the peaks. The wave is a low-frequency 2D
// sinusoid that drifts so the field reads as a slow swell, not a strobe.
//
// PERF: this canvas redraws several hundred crosshairs per frame. It only
// runs while it's actually on screen (IntersectionObserver) and the tab is
// visible (visibilitychange), and it respects prefers-reduced-motion by
// painting a single still frame. The wave phase is derived from an absolute
// timestamp, so pausing and resuming is seamless — no jump on re-entry.

const GRID_SPACING = 32 // logical pixels between crosshair centers
const ARM_LENGTH = 6 // half-length of each crosshair stroke
const ARM_WIDTH = 1.4
const BASE_OPACITY = 0.38
const PEAK_OPACITY = 1.0
const BASE_SCALE = 0.82
const PEAK_SCALE = 1.55

// Wave parameters. Two crossed sinusoids drifting at different speeds give
// a softer, more organic pattern than a single radial wave from one source.
const WAVE_LENGTH = 220 // pixels per wave cycle
const WAVE_SPEED_A = 0.00018 // radians / ms
const WAVE_SPEED_B = 0.00012
const WAVE_ANGLE_A = 0.6 // radians (direction of wave A)
const WAVE_ANGLE_B = 2.2

// Frozen timestamp used for the reduced-motion still frame. Any constant
// gives a pleasant fixed interference pattern.
const STILL_FRAME_T = 1400

type Props = {
  className?: string
}

export function CrosshairWave({ className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const dimsRef = useRef({ w: 0, h: 0 })
  const runningRef = useRef(false)
  const inViewRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const c2d = canvas.getContext('2d')
    if (!c2d) return
    const ctx: CanvasRenderingContext2D = c2d

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Pre-compute per-frame trig coefficients
    const kA = (2 * Math.PI) / WAVE_LENGTH
    const dirAx = Math.cos(WAVE_ANGLE_A)
    const dirAy = Math.sin(WAVE_ANGLE_A)
    const kB = (2 * Math.PI) / (WAVE_LENGTH * 1.3)
    const dirBx = Math.cos(WAVE_ANGLE_B)
    const dirBy = Math.sin(WAVE_ANGLE_B)

    function draw(now: number) {
      const { w, h } = dimsRef.current
      ctx.clearRect(0, 0, w, h)
      ctx.lineCap = 'round'
      ctx.lineWidth = ARM_WIDTH

      const cols = Math.ceil(w / GRID_SPACING) + 1
      const rows = Math.ceil(h / GRID_SPACING) + 1
      // Inset so the grid edges aren't flush against the container border
      const offsetX = (w - (cols - 1) * GRID_SPACING) / 2
      const offsetY = (h - (rows - 1) * GRID_SPACING) / 2

      const tA = now * WAVE_SPEED_A
      const tB = now * WAVE_SPEED_B

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * GRID_SPACING
          const y = offsetY + r * GRID_SPACING

          // Two-component traveling wave. Each component is a directional
          // plane wave; their sum gives a moving interference pattern that
          // reads as a top-down swell rather than a single ripple.
          const phaseA = (x * dirAx + y * dirAy) * kA - tA
          const phaseB = (x * dirBx + y * dirBy) * kB - tB
          const raw = (Math.sin(phaseA) + Math.sin(phaseB)) * 0.5
          // Normalize to [0,1]
          const amp = raw * 0.5 + 0.5

          // Opacity (grayscale dark → white) and scale (small → big)
          const a = BASE_OPACITY + (PEAK_OPACITY - BASE_OPACITY) * amp
          const s = BASE_SCALE + (PEAK_SCALE - BASE_SCALE) * amp
          const arm = ARM_LENGTH * s

          ctx.strokeStyle = `rgba(235, 231, 218, ${a.toFixed(3)})`
          ctx.beginPath()
          // Horizontal stroke
          ctx.moveTo(x - arm, y)
          ctx.lineTo(x + arm, y)
          // Vertical stroke
          ctx.moveTo(x, y - arm)
          ctx.lineTo(x, y + arm)
          ctx.stroke()
        }
      }
    }

    function resize() {
      if (!canvas || !parent) return
      const rect = parent.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dimsRef.current = { w: rect.width, h: rect.height }
      // Setting canvas.width clears the bitmap. If we're not in the animation
      // loop (reduced motion, or offscreen), repaint a frame so the grid
      // doesn't vanish after a resize.
      if (reduced || !runningRef.current) draw(STILL_FRAME_T)
    }

    function loop(now: number) {
      draw(now)
      rafRef.current = requestAnimationFrame(loop)
    }
    function start() {
      if (runningRef.current || reduced) return
      runningRef.current = true
      rafRef.current = requestAnimationFrame(loop)
    }
    function stop() {
      runningRef.current = false
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }

    resize()
    // Layout can settle a tick after mount (font load, parent sizing).
    // A double-rAF re-measure catches the post-layout dimensions.
    requestAnimationFrame(() => requestAnimationFrame(resize))
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    // Only animate while on screen. IntersectionObserver toggles the loop.
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        inViewRef.current = !!entry?.isIntersecting
        if (inViewRef.current && !document.hidden) start()
        else stop()
      },
      { threshold: 0.01 },
    )
    io.observe(parent)

    // Pause when the tab is hidden; resume only if still on screen.
    const onVisibility = () => {
      if (document.hidden) stop()
      else if (inViewRef.current) start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  )
}

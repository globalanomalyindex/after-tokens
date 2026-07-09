'use client'

import { useEffect, useRef } from 'react'

// Brutalist "layout solver" specimen. A stark white textbox framed by bold
// black corner registration marks, over a faint crosshair grid that pulses in
// a slow wave. Instead of words appearing, scattered corner-ticks fly in and
// align into a grid of word bounding-boxes, then fill with baseline bars: the
// answer's layout being computed, formatted, and refined in real time. The
// content loops; the frame and grid persist (the container is constant, the
// answer re-diffuses inside it). Canvas-based, on-screen-gated, reduced-motion
// safe. Uses the shared on-screen-gated rAF lifecycle used by the specimen set.

const BG = '#F4F3EE'

// Paragraph-like line widths (fraction of content width), ragged right.
const LINES = [0.97, 0.86, 0.94, 0.6]

const RESOLVE_WINDOW = 5000 // staggered window for all words to begin
const WORD_DUR = 1300 // a single word's fly-in + fill duration
const HOLD = 1900 // fully-resolved hold
const RELEASE = 800 // boxes fade out before the next cycle

type Corner = { bx: number; by: number; sx: number; sy: number; jx: number; jy: number }
type WordBox = { x: number; y: number; w: number; h: number; t0: number; corners: Corner[] }

export function BrutalistSpecimen({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const dimsRef = useRef({ w: 0, h: 0 })
  const runningRef = useRef(false)
  const inViewRef = useRef(false)
  const startRef = useRef<number | null>(null)
  const wordsRef = useRef<WordBox[]>([])

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
    const cycle = RESOLVE_WINDOW + HOLD + RELEASE

    function buildWords() {
      let seed = 20260529
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0
        return seed / 4294967296
      }
      const { w, h } = dimsRef.current
      const padX = w * 0.13
      const padY = h * 0.17
      const cw = w - padX * 2
      const ch = h - padY * 2
      const lineH = ch / (LINES.length + (LINES.length - 1) * 0.65)
      const gap = lineH * 0.65
      const words: WordBox[] = []

      LINES.forEach((frac, li) => {
        const lineW = cw * frac
        const y = padY + li * (lineH + gap)
        const target = padX + lineW
        let x = padX
        while (x < target - lineH * 0.5) {
          const ww = Math.min(target - x, lineH * (1.0 + rnd() * 2.4))
          const jMag = lineH * 2.4
          const mkCorner = (bx: number, by: number, sx: number, sy: number): Corner => ({
            bx,
            by,
            sx,
            sy,
            jx: (rnd() - 0.5) * jMag,
            jy: (rnd() - 0.5) * jMag * 0.7,
          })
          words.push({
            x,
            y,
            w: ww,
            h: lineH,
            t0: 0,
            corners: [
              mkCorner(x, y, 1, 1),
              mkCorner(x + ww, y, -1, 1),
              mkCorner(x, y + lineH, 1, -1),
              mkCorner(x + ww, y + lineH, -1, -1),
            ],
          })
          x += ww + lineH * 0.5
        }
      })

      // Seeded resolve order (Fisher-Yates) so it reads as non-sequential.
      const order = words.map((_, i) => i)
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1))
        const tmp = order[i]!
        order[i] = order[j]!
        order[j] = tmp
      }
      const span = Math.max(1, words.length - 1)
      order.forEach((wi, k) => {
        const wd = words[wi]
        if (wd) wd.t0 = (k / span) * (RESOLVE_WINDOW - WORD_DUR)
      })
      wordsRef.current = words
    }

    function resize() {
      const rect = parent!.getBoundingClientRect()
      canvas!.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas!.height = Math.max(1, Math.floor(rect.height * dpr))
      canvas!.style.width = rect.width + 'px'
      canvas!.style.height = rect.height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dimsRef.current = { w: rect.width, h: rect.height }
      buildWords()
      if (reduced || !runningRef.current) draw(RESOLVE_WINDOW) // settled frame
    }

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    function draw(now: number) {
      const { w, h } = dimsRef.current
      const base = startRef.current ?? 0
      const abs = reduced ? RESOLVE_WINDOW : now - base
      const wt = reduced ? RESOLVE_WINDOW : abs % cycle

      // Surface
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, w, h)

      // Faint crosshair grid, pulsing in a diagonal wave (persistent).
      const GS = 26
      const arm = 3
      const tA = abs * 0.0016
      for (let gy = GS * 0.75; gy < h; gy += GS) {
        for (let gx = GS * 0.75; gx < w; gx += GS) {
          const wave = Math.sin((gx + gy) * 0.02 - tA) * 0.5 + 0.5
          const a = 0.04 + wave * 0.06
          ctx.strokeStyle = `rgba(17,17,17,${a.toFixed(3)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(gx - arm, gy)
          ctx.lineTo(gx + arm, gy)
          ctx.moveTo(gx, gy - arm)
          ctx.lineTo(gx, gy + arm)
          ctx.stroke()
        }
      }

      // Outer frame: bold black corner brackets (the textbox registration).
      const fx0 = w * 0.07
      const fy0 = h * 0.11
      const fx1 = w * 0.93
      const fy1 = h * 0.89
      const flen = Math.min(w, h) * 0.06
      ctx.strokeStyle = `rgba(17,17,17,0.92)`
      ctx.lineWidth = 2
      ctx.beginPath()
      const frame: Array<[number, number, number, number]> = [
        [fx0, fy0, 1, 1],
        [fx1, fy0, -1, 1],
        [fx0, fy1, 1, -1],
        [fx1, fy1, -1, -1],
      ]
      frame.forEach(([px, py, sx, sy]) => {
        ctx.moveTo(px, py)
        ctx.lineTo(px + sx * flen, py)
        ctx.moveTo(px, py)
        ctx.lineTo(px, py + sy * flen)
      })
      ctx.stroke()

      // Word boxes: corner-ticks fly in and align, then a baseline bar fills.
      // Envelope: fade content in at cycle start, hold, fade out before reset.
      let contentAlpha = 1
      if (wt < 260) contentAlpha = wt / 260
      else if (wt > RESOLVE_WINDOW + HOLD) {
        contentAlpha = Math.max(0, 1 - (wt - (RESOLVE_WINDOW + HOLD)) / RELEASE)
      }

      const tickLen = dimsRef.current.h * 0.045
      for (const wd of wordsRef.current) {
        const p = Math.max(0, Math.min(1, (wt - wd.t0) / WORD_DUR))
        const e = easeOut(p)
        const off = 1 - e
        const tickAlpha = (0.12 + e * 0.78) * contentAlpha

        ctx.lineWidth = 1.5
        ctx.strokeStyle = `rgba(17,17,17,${tickAlpha.toFixed(3)})`
        ctx.beginPath()
        for (const c of wd.corners) {
          const px = c.bx + c.jx * off
          const py = c.by + c.jy * off
          ctx.moveTo(px, py)
          ctx.lineTo(px + c.sx * tickLen, py)
          ctx.moveTo(px, py)
          ctx.lineTo(px, py + c.sy * tickLen)
        }
        ctx.stroke()

        // Baseline text bar fills once the box has settled.
        if (e > 0.62) {
          const fa = ((e - 0.62) / 0.38) * contentAlpha
          ctx.fillStyle = `rgba(17,17,17,${(fa * 0.8).toFixed(3)})`
          const by = wd.y + wd.h * 0.6
          ctx.fillRect(wd.x + wd.h * 0.14, by, wd.w - wd.h * 0.28, Math.max(2, wd.h * 0.14))
        }
      }
    }

    function loop(now: number) {
      if (startRef.current == null) startRef.current = now
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
    requestAnimationFrame(() => requestAnimationFrame(resize))
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

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

  return <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 ${className}`} />
}

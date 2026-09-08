'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'

// The companion: a small soft body in the brand's color that lives in the
// answer's open space rather than on its lines. It hovers over the part of
// the answer that is still open, and as that part shrinks and moves it
// drifts after it on a slow spring, wandering a little while it waits, so
// it reads as something present and working rather than something
// darting. It never goes to the words. When a word settles it sends a few
// motes there instead, along a shallow arc, and the word snaps in as the
// first mote lands; several words settling at once get several beams at
// once, which is what a sampler that fills positions in parallel looks
// like. It leans toward what it sends to, squashes as it fires, stretches a
// little along its own velocity when it does move, rings when a sentence
// closes, and dissolves when the source is done.
//
// Slow motion is the least distracting kind (Bartram, Ware and Calvert,
// 2003), so the drift is slow, the motes are small and brief, and nothing
// here blinks. Everything is a transform written directly, once per frame,
// only while the surface is on screen and the recording is playing.
// Reduced motion places the body at its home and sends no motes.

export type Point = { x: number; y: number }

type Body = { x: number; y: number; vx: number; vy: number }

type Mote = {
  el: HTMLSpanElement
  live: boolean
  x0: number
  y0: number
  cx: number
  cy: number
  x1: number
  y1: number
  t0: number
  dur: number
  onArrive: (() => void) | null
}

type Options = {
  root: RefObject<HTMLElement | null>
  /** the body; its transform is written every frame */
  orb: RefObject<HTMLElement | null>
  /** the container the motes are created in */
  motes: RefObject<HTMLElement | null>
  /** where the body should hover, in the root's coordinates, measured on demand */
  home: () => Point | null
  /** the body is drawn */
  active: boolean
  /** the recording is paused: the body holds still */
  paused: boolean
  reduced: boolean
}

/** The drift toward home: soft, over a second to arrive, no overshoot to speak of. */
const HOME_K = 13
const HOME_C = 2 * 1.0 * Math.sqrt(HOME_K)
/** How often home is measured, in ms, and how much of each measurement is
 *  taken: the measured point moves as drafts come and go, and the body
 *  should follow the trend of it, never every step. */
const HOME_EVERY = 160
const HOME_FOLLOW = 0.35
/** The wander while waiting: two slow sinusoids, in px. */
const WANDER = 4.5
/** The stretch along velocity, per px/s, and its ceiling. Gentle: the body is slow. */
const STRETCH_PER_SPEED = 0.0016
const STRETCH_MAX = 0.32
/** The lean toward a target as motes leave, in px, and how long it holds. */
const LEAN = 7
const LEAN_MS = 420
/** The motes: how many per beam, how far apart they leave, how long they fly. */
const MOTES_PER_BEAM = 3
const MOTE_GAP_MS = 45
const MOTE_MIN_MS = 260
const MOTE_MAX_MS = 440
const MOTE_POOL = 36

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

function step(body: Body, tx: number, ty: number, k: number, c: number, dt: number) {
  body.vx += (k * (tx - body.x) - c * body.vx) * dt
  body.vy += (k * (ty - body.y) - c * body.vy) * dt
  body.x += body.vx * dt
  body.y += body.vy * dt
}

export function useCompanion({ root, orb, motes, home, active, paused, reduced }: Options): { emit: (target: Element, onArrive?: () => void) => boolean; wake: () => void } {
  const s = useRef({
    body: { x: 0, y: 0, vx: 0, vy: 0 } as Body,
    placed: false,
    homeAt: 0,
    homeX: 0,
    homeY: 0,
    hasHome: false,
    heading: 0,
    leanX: 0,
    leanY: 0,
    leanAt: -Infinity,
    fireAt: -Infinity,
    wanderT: 0,
    beams: 0,
    pool: [] as Mote[],
    visible: true,
  })
  const frame = useRef(0)
  const last = useRef(0)
  const opts = useRef({ home, active, paused, reduced, root, motes })
  opts.current = { home, active, paused, reduced, root, motes }

  const paint = useCallback((now: number) => {
    const st = s.current
    const el = orb.current
    if (!el) return
    const b = st.body
    const speed = Math.hypot(b.vx, b.vy)
    if (speed > 24) st.heading = Math.atan2(b.vy, b.vx)
    const stretch = 1 + Math.min(STRETCH_MAX, speed * STRETCH_PER_SPEED)
    const sinceFire = now - st.fireAt
    const fire = sinceFire >= 0 && sinceFire < 220 ? Math.sin((Math.PI * sinceFire) / 220) : 0
    const sinceLean = now - st.leanAt
    const lean = sinceLean >= 0 && sinceLean < LEAN_MS ? Math.sin(Math.PI * Math.min(1, sinceLean / LEAN_MS)) : 0
    const wx = WANDER * Math.sin(st.wanderT / 3100 * 2 * Math.PI) + WANDER * 0.6 * Math.sin(st.wanderT / 4700 * 2 * Math.PI + 1.3)
    const wy = WANDER * 0.8 * Math.sin(st.wanderT / 4100 * 2 * Math.PI + 0.7) + WANDER * 0.5 * Math.sin(st.wanderT / 6300 * 2 * Math.PI + 2.1)
    const x = b.x + wx + st.leanX * lean
    const y = b.y + wy + st.leanY * lean
    const sx = stretch * (1 + 0.18 * fire)
    const sy = (1 / Math.sqrt(stretch)) * (1 - 0.16 * fire)
    el.style.transform = `translate(${x}px, ${y}px) rotate(${st.heading}rad) scale(${sx}, ${sy}) rotate(${-st.heading}rad)`
  }, [orb])

  const paintMotes = useCallback((now: number) => {
    const st = s.current
    let alive = 0
    for (const m of st.pool) {
      if (!m.live) continue
      const raw = (now - m.t0) / m.dur
      if (raw < 0) { alive += 1; continue }
      if (raw >= 1) {
        m.live = false
        m.el.style.opacity = '0'
        const done = m.onArrive
        m.onArrive = null
        done?.()
        continue
      }
      alive += 1
      const t = easeOutCubic(raw)
      const u = 1 - t
      const x = u * u * m.x0 + 2 * u * t * m.cx + t * t * m.x1
      const y = u * u * m.y0 + 2 * u * t * m.cy + t * t * m.y1
      const fadeIn = Math.min(1, raw / 0.15)
      const fadeOut = raw > 0.72 ? 1 - (raw - 0.72) / 0.28 : 1
      const scale = 1 - 0.45 * t
      m.el.style.opacity = String(0.85 * fadeIn * fadeOut)
      m.el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
    }
    st.beams = alive
  }, [])

  const loop = useCallback((now: number) => {
    frame.current = 0
    const st = s.current
    const { home: measureHome, active: isActive, paused: isPaused, reduced: isReduced } = opts.current
    if (!isActive) return
    const dt = Math.min(0.032, Math.max(0.001, (now - (last.current || now)) / 1000))
    last.current = now
    if (now - st.homeAt > HOME_EVERY || !st.hasHome) {
      const h = measureHome()
      st.homeAt = now
      if (h && st.hasHome && !isReduced) {
        st.homeX += (h.x - st.homeX) * HOME_FOLLOW
        st.homeY += (h.y - st.homeY) * HOME_FOLLOW
      } else if (h) { st.homeX = h.x; st.homeY = h.y; st.hasHome = true }
    }
    if (!st.hasHome) { frame.current = requestAnimationFrame(loop); return }
    if (!st.placed || isReduced) {
      st.body = { x: st.homeX, y: st.homeY, vx: 0, vy: 0 }
      st.placed = true
      st.wanderT = 0
      paint(now)
      if (isReduced) return
    }
    if (!isPaused) {
      step(st.body, st.homeX, st.homeY, HOME_K, HOME_C, dt)
      st.wanderT += dt * 1000
    }
    paint(now)
    paintMotes(now)
    if (isPaused && st.beams === 0) { last.current = 0; return }
    if (!st.visible && st.beams === 0) { last.current = 0; return }
    frame.current = requestAnimationFrame(loop)
  }, [paint, paintMotes])

  const wake = useCallback(() => {
    if (frame.current || typeof requestAnimationFrame === 'undefined') return
    frame.current = requestAnimationFrame(loop)
  }, [loop])

  /** Sends motes from the body to an element; the first to land calls back. */
  const emit = useCallback((target: Element, onArrive?: () => void): boolean => {
    const st = s.current
    const rootEl = opts.current.root.current
    const box = opts.current.motes.current
    if (!rootEl || !box || !st.placed || opts.current.reduced || !st.visible) return false
    const r = target.getBoundingClientRect()
    const o = rootEl.getBoundingClientRect()
    const x1 = r.left - o.left + r.width / 2
    const y1 = r.top - o.top + r.height / 2
    const x0 = st.body.x
    const y0 = st.body.y
    const dx = x1 - x0
    const dy = y1 - y0
    const dist = Math.hypot(dx, dy)
    // the arc: a control point off the straight line, alternating sides
    st.beams += 1
    const side = st.beams % 2 ? 1 : -1
    const bend = Math.min(28, dist * 0.22) * side
    const cx = (x0 + x1) / 2 + (dist > 0 ? (-dy / dist) * bend : 0)
    const cy = (y0 + y1) / 2 + (dist > 0 ? (dx / dist) * bend : 0)
    const dur = Math.max(MOTE_MIN_MS, Math.min(MOTE_MAX_MS, 200 + dist * 0.9))
    const now = performance.now()
    let sent = 0
    for (let i = 0; i < MOTES_PER_BEAM; i += 1) {
      let m = st.pool.find((p) => !p.live)
      if (!m) {
        if (st.pool.length >= MOTE_POOL) break
        const el = document.createElement('span')
        el.className = 'settle-mote'
        box.appendChild(el)
        m = { el, live: false, x0: 0, y0: 0, cx: 0, cy: 0, x1: 0, y1: 0, t0: 0, dur: 0, onArrive: null }
        st.pool.push(m)
      }
      Object.assign(m, { live: true, x0, y0, cx, cy, x1, y1, t0: now + i * MOTE_GAP_MS, dur, onArrive: i === 0 ? onArrive ?? null : null })
      m.el.style.opacity = '0'
      m.el.style.transform = `translate(${x0}px, ${y0}px)`
      sent += 1
    }
    if (!sent) return false
    // the body leans toward what it sends to, and squashes as it fires
    if (dist > 0) { st.leanX = (dx / dist) * LEAN; st.leanY = (dy / dist) * LEAN }
    st.leanAt = now
    st.fireAt = now
    wake()
    return true
  }, [wake])

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current) }, [])
  // the body moves only while its surface is on screen
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      s.current.visible = Boolean(entry?.isIntersecting)
      if (s.current.visible) wake()
    }, { threshold: 0.05 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [root, wake])
  // the root's size changing moves home
  useEffect(() => {
    const el = root.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => { s.current.homeAt = 0; wake() })
    observer.observe(el)
    return () => observer.disconnect()
  }, [root, wake])
  useEffect(() => { if (active && !paused) wake() }, [active, paused, wake])

  return { emit, wake }
}

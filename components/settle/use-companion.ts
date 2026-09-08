'use client'

import { useCallback, useEffect, useRef, type RefObject } from 'react'

// The companion: the cursor as a small body with mass. It is pulled toward
// its target by a spring, so it leaves quickly, arrives softly, and can be
// retargeted mid-flight without a restart. It stretches along its own
// velocity and rounds up as it stops (squash and stretch, the first of the
// classical animation principles), and a trail follows it on a softer
// spring, drawn as one body stretched from where the trail is to where the
// head is, so a jump reads as one thing moving rather than a thing
// disappearing and reappearing. Everything here is a transform on three
// elements, written directly, once per frame, only while something moves.
// Reduced motion places the cursor at its target and draws nothing else.

export type CompanionTarget = { x: number; y: number } | null

type Body = { x: number; y: number; vx: number; vy: number }

type Options = {
  root: RefObject<HTMLElement | null>
  halo: RefObject<HTMLElement | null>
  head: RefObject<HTMLElement | null>
  trail: RefObject<HTMLElement | null>
  /** where the cursor should be, in the root's coordinates, measured on demand */
  target: () => CompanionTarget
  /** whether the cursor is drawn at all; off duty the loop does not run */
  active: boolean
  reduced: boolean
}

/** Spring toward a point: stiffness and damping chosen for a ~250 ms arrival with a soft overshoot. */
const HEAD_K = 520
const HEAD_C = 2 * 0.74 * Math.sqrt(HEAD_K)
const TAIL_K = [620, 480]
const TAIL_C = TAIL_K.map((k) => 2 * 0.98 * Math.sqrt(k))
/** the trail never stretches past this many px behind the head */
const TRAIL_MAX = 34
/** how much the head stretches per px/s of speed, and the most it will */
const STRETCH_PER_SPEED = 0.00075
const STRETCH_MAX = 0.65
/** the press: a quick squash when the cursor finalizes a word */
const PRESS_MS = 170

function step(body: Body, tx: number, ty: number, k: number, c: number, dt: number) {
  const ax = k * (tx - body.x) - c * body.vx
  const ay = k * (ty - body.y) - c * body.vy
  body.vx += ax * dt
  body.vy += ay * dt
  body.x += body.vx * dt
  body.y += body.vy * dt
}

export function useCompanion({ root, halo, head, trail, target, active, reduced }: Options): { wake: () => void; press: () => void } {
  const bodies = useRef<{ head: Body; tails: Body[]; heading: number; placed: boolean; pressAt: number }>({
    head: { x: 0, y: 0, vx: 0, vy: 0 },
    tails: [{ x: 0, y: 0, vx: 0, vy: 0 }, { x: 0, y: 0, vx: 0, vy: 0 }],
    heading: 0,
    placed: false,
    pressAt: -Infinity,
  })
  const frame = useRef(0)
  const last = useRef(0)
  const optsRef = useRef({ target, active, reduced })
  optsRef.current = { target, active, reduced }

  const paint = useCallback((now: number) => {
    const b = bodies.current
    const h = head.current
    const ha = halo.current
    if (!h || !ha) return
    const speed = Math.hypot(b.head.vx, b.head.vy)
    if (speed > 60) b.heading = Math.atan2(b.head.vy, b.head.vx)
    const stretch = 1 + Math.min(STRETCH_MAX, speed * STRETCH_PER_SPEED)
    const sinceP = now - b.pressAt
    const press = sinceP >= 0 && sinceP < PRESS_MS ? Math.sin((Math.PI * sinceP) / PRESS_MS) : 0
    const squash = 1 - 0.24 * press
    h.style.transform = `translate(${b.head.x}px, ${b.head.y}px) rotate(${b.heading}rad) scale(${stretch * squash}, ${squash / Math.sqrt(stretch)})`
    ha.style.transform = `translate(${b.head.x}px, ${b.head.y}px) scale(${1 + 0.35 * press})`
    const tr = trail.current
    if (tr) {
      // the trail: one body from the last tail to the head, thinning as it lengthens
      const t = b.tails[1]!
      const dx = b.head.x - t.x
      const dy = b.head.y - t.y
      const raw = Math.hypot(dx, dy)
      const gap = Math.min(TRAIL_MAX, raw)
      const k = raw > 0 ? gap / raw : 0
      const size = h.offsetWidth || 10
      tr.style.opacity = String(Math.min(1, gap / 5) * 0.6)
      tr.style.transform = `translate(${b.head.x - (dx * k) / 2}px, ${b.head.y - (dy * k) / 2}px) rotate(${Math.atan2(dy, dx)}rad) scale(${(gap + size) / size}, ${Math.max(0.55, 1 - gap / 110) * squash})`
    }
  }, [head, halo, trail])

  const loop = useCallback((now: number) => {
    frame.current = 0
    const b = bodies.current
    const { target: getTarget, reduced: isReduced, active } = optsRef.current
    // off duty (the cursor is not drawn), the body rests where it is
    if (!active) return
    const t = getTarget()
    const dt = Math.min(0.032, Math.max(0.001, (now - (last.current || now)) / 1000))
    last.current = now
    if (t && (!b.placed || isReduced)) {
      // the first placement, and every placement under reduced motion, is a cut
      b.head = { x: t.x, y: t.y, vx: 0, vy: 0 }
      b.tails = b.tails.map(() => ({ x: t.x, y: t.y, vx: 0, vy: 0 }))
      b.placed = true
      paint(now)
      return
    }
    if (t) step(b.head, t.x, t.y, HEAD_K, HEAD_C, dt)
    let lead: Body = b.head
    b.tails.forEach((tail, i) => {
      step(tail, lead.x, lead.y, TAIL_K[i]!, TAIL_C[i]!, dt)
      lead = tail
    })
    paint(now)
    const settled = (body: Body, x: number, y: number) => Math.hypot(body.vx, body.vy) < 4 && Math.hypot(body.x - x, body.y - y) < 0.25
    const resting = (!t || settled(b.head, t.x, t.y)) && b.tails.every((tail) => settled(tail, b.head.x, b.head.y)) && now - b.pressAt > PRESS_MS
    if (resting) {
      // snap to rest exactly, so a paused cursor is not a fraction off
      if (t) b.head = { x: t.x, y: t.y, vx: 0, vy: 0 }
      b.tails = b.tails.map(() => ({ x: b.head.x, y: b.head.y, vx: 0, vy: 0 }))
      paint(now)
      last.current = 0
      return
    }
    frame.current = requestAnimationFrame(loop)
  }, [paint])

  const wake = useCallback(() => {
    if (frame.current) return
    if (typeof requestAnimationFrame === 'undefined') return
    frame.current = requestAnimationFrame(loop)
  }, [loop])

  const press = useCallback(() => {
    if (optsRef.current.reduced) return
    bodies.current.pressAt = performance.now()
    wake()
  }, [wake])

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current) }, [])
  // the root's size changing moves every target; follow it
  useEffect(() => {
    const el = root.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => wake())
    observer.observe(el)
    return () => observer.disconnect()
  }, [root, wake])

  return { wake, press }
}

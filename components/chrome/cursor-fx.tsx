'use client'

import { useEffect } from 'react'

// A site-wide custom cursor: a neutral cool-gray "+" crosshair. As it nears a
// definition chip (the clickable highlights), it lights up — a marching-ants
// ring fades in, brightens toward white, grows, and speeds up the closer it
// gets. Each chip's own marching-ants border brightens + accelerates by its own
// distance to the cursor, so they read as "press me." A single rAF loop drives
// the cursor position, the proximity math, and the marching phase for the
// cursor and every chip.
//
// Pointer-fine devices only, and respects reduced-motion (it simply doesn't
// mount, leaving the native cursor and the chips' static dotted borders).
export function CursorFX() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || reduce.matches) return

    const root = document.documentElement
    root.classList.add('cursor-fx-on')

    const cur = document.createElement('div')
    cur.className = 'cursor-fx'
    cur.style.opacity = '0'
    cur.innerHTML = '<span class="cursor-cross"></span><span class="cursor-ants"></span>'
    document.body.appendChild(cur)

    const R = 150 // proximity radius (px) — noticeable while perusing, tight enough not to clash
    const PERIOD = 5 // dash+gap period, for seamless marching wrap
    const BASE = 0.02 // base march speed (px/ms)

    let mx = -9999
    let my = -9999
    let chips: HTMLElement[] = []
    let colorOf = new Map<HTMLElement, string>()
    let refreshIn = 0
    const phase = new WeakMap<HTMLElement, number>()
    let curPhase = 0
    let last = 0
    let raf = 0

    const refresh = () => {
      chips = Array.from(document.querySelectorAll<HTMLElement>('.def-chip'))
      colorOf = new Map(chips.map((ch) => [ch, getComputedStyle(ch).backgroundColor]))
    }
    refresh()

    const onMove = (e: PointerEvent) => {
      mx = e.clientX
      my = e.clientY
      cur.style.opacity = '1'
    }
    const onLeave = () => {
      cur.style.opacity = '0'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    const frame = (t: number) => {
      const dt = last ? Math.min(64, t - last) : 16
      last = t
      if (refreshIn-- <= 0) {
        refresh()
        refreshIn = 20
      }

      let maxProx = 0
      let nearest: HTMLElement | null = null
      for (const ch of chips) {
        const r = ch.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) continue
        const nx = Math.max(r.left, Math.min(mx, r.right))
        const ny = Math.max(r.top, Math.min(my, r.bottom))
        const d = Math.hypot(mx - nx, my - ny)
        const p = d >= R ? 0 : 1 - d / R
        if (p > maxProx) {
          maxProx = p
          nearest = ch
        }
        let ph = phase.get(ch) ?? 0
        ph = (ph + dt * BASE * (1 + 3 * p)) % PERIOD
        phase.set(ch, ph)
        ch.style.setProperty('--px', ph.toFixed(2) + 'px')
        ch.style.setProperty('--ant', p.toFixed(3))
      }

      cur.style.transform = `translate(${mx}px, ${my}px)`
      if (nearest) {
        const col = colorOf.get(nearest)
        if (col) cur.style.setProperty('--near-color', col)
      }
      cur.style.setProperty('--prox', maxProx.toFixed(3))
      curPhase = (curPhase + dt * BASE * (1 + 3 * maxProx)) % PERIOD
      cur.style.setProperty('--px', curPhase.toFixed(2) + 'px')

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      for (const ch of chips) {
        ch.style.removeProperty('--px')
        ch.style.removeProperty('--ant')
      }
      cur.remove()
      root.classList.remove('cursor-fx-on')
    }
  }, [])

  return null
}

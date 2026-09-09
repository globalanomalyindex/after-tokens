'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { CarveItem } from '@/lib/settle/carve'
import type { SettleState } from '@/lib/settle/types'
import type { SettleVoice } from '@/lib/settle/voice'

type Position = { x: number; y: number; text: string; released: boolean; el: HTMLElement }

/** One transaction per source state, never per replay-clock frame. Retarget
 * from the last target plus the live translation; reads precede all writes.
 * Widths are not animated, so wrapping happens once per commitment. */
export function useFormationLayout(root: RefObject<HTMLElement | null>, state: SettleState, items: CarveItem[], enabled: boolean, voice: SettleVoice, runId: string | number) {
  const previous = useRef(new Map<string, Position>())
  const animations = useRef(new Map<HTMLElement, Animation>())
  const feedback = useRef(new Map<HTMLElement, Animation>())
  const epoch = useRef({ version: state.version, time: state.lastEventAtMs, runId })
  const settled = useRef(new Set<string>())
  const formed = useRef(new Set<string>())
  useLayoutEffect(() => {
    const host = root.current
    if (!host) return
    const reset = runId !== epoch.current.runId || state.version !== epoch.current.version || state.lastEventAtMs < epoch.current.time
    if (reset) { previous.current.clear(); settled.current.clear(); formed.current.clear() }
    epoch.current = { version: state.version, time: state.lastEventAtMs, runId }
    const origin = host.getBoundingClientRect()
    const prior = previous.current
    const reads = Array.from(host.querySelectorAll<HTMLElement>('[data-layout]')).map((el) => {
      const key = el.dataset.layout!
      const rect = el.getBoundingClientRect()
      const transform = getComputedStyle(el).transform
      const matrix = typeof DOMMatrix !== 'undefined' && transform !== 'none' ? new DOMMatrix(transform) : null
      const tx = matrix?.m41 ?? 0
      const ty = matrix?.m42 ?? 0
      const next = { x: rect.left - origin.left - tx, y: rect.top - origin.top - ty, text: el.textContent ?? '', released: el.dataset.released === 'true', el }
      const old = prior.get(key)
      return { key, next, old, dx: old ? old.x + tx - next.x : 0, dy: old ? old.y + ty - next.y : 0 }
    })
    // Fit candidate letters only inside a content-independent reservation.
    // Long guesses remain nonlexical ink, never clipped legible word tails.
    const drafts = Array.from(host.querySelectorAll<HTMLElement>('.settle-draft')).map((el) => ({ el, fits: el.scrollWidth <= el.clientWidth + 1 }))
    for (const collection of [animations.current, feedback.current]) {
      for (const [el, animation] of collection) {
        if (reset || !enabled || !el.isConnected) { animation.cancel(); collection.delete(el) }
      }
    }
    for (const { el, fits } of drafts) el.dataset.fits = String(fits)
    previous.current = new Map(reads.map(({ key, next }) => [key, next]))
    for (const { key, next, old, dx, dy } of reads) {
      const release = next.released && !settled.current.has(key)
      if (next.released) settled.current.add(key)
      const formationKey = `${key}:${next.text}`
      const word = next.el.closest('[data-state]')?.getAttribute('data-state') === 'word' && !formed.current.has(formationKey)
      if (word) formed.current.add(formationKey)
      // A release takes ownership of the target position immediately. An
      // interrupted provisional glide must not continue on the reading page.
      if (next.released) { animations.current.get(next.el)?.cancel(); animations.current.delete(next.el) }
      if (!enabled || typeof next.el.animate !== 'function') continue
      const distance = Math.hypot(dx, dy)
      const spatial = next.el.classList.contains('settle-candidate') || next.el.dataset.spatial === 'true'
      const smallMove = spatial && old && !old.released && !next.released && old.text === next.text && distance > 0.5 && distance < 80 && Math.abs(dy) < 32
      const changedTarget = old && (Math.abs(old.x - next.x) > .5 || Math.abs(old.y - next.y) > .5 || old.text !== next.text)
      if (changedTarget) {
        animations.current.get(next.el)?.cancel()
        animations.current.delete(next.el)
        if (smallMove) {
          const animation = next.el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' })
          animations.current.set(next.el, animation)
          animation.onfinish = () => { if (animations.current.get(next.el) === animation) animations.current.delete(next.el) }
        }
      }
      // Released state is irreversible within a run. A draft snapshot cannot
      // restart its response; simultaneous release ranges begin in this batch.
      if ((release || word) && voice.onset > 0 && voice.bloom > 0 && (!old || distance < 2)) {
        const shadow = `0 0 .22em color-mix(in oklab, var(--accent) ${Math.round(voice.bloom * (release ? 42 : 20))}%, transparent)`
        feedback.current.get(next.el)?.cancel()
        const animation = next.el.animate([{ textShadow: shadow }, { textShadow: '0 0 0 transparent' }], { duration: release ? 400 : 200, easing: 'ease-out' })
        feedback.current.set(next.el, animation)
        animation.onfinish = () => { if (feedback.current.get(next.el) === animation) feedback.current.delete(next.el) }
      }
    }
  }, [root, state, items, enabled, voice.onset, voice.bloom, runId])

  useLayoutEffect(() => {
    const host = root.current
    if (!host) return
    const running = animations.current
    const highlights = feedback.current
    let width = host.getBoundingClientRect().width
    const observer = new ResizeObserver(([entry]) => {
      if (!entry || Math.abs(entry.contentRect.width - width) < 1) return
      width = entry.contentRect.width
      running.forEach((a) => a.cancel()); running.clear(); previous.current.clear()
    })
    observer.observe(host)
    return () => { observer.disconnect(); running.forEach((a) => a.cancel()); running.clear(); highlights.forEach((a) => a.cancel()); highlights.clear() }
  }, [root])
}

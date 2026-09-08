'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { formingText } from '@/lib/settle/reader'
import { carve } from '@/lib/settle/carve'
import type { SettleState } from '@/lib/settle/types'
import { clampSettleVoice, settleVoiceStyle, type SettleVoice } from '@/lib/settle/voice'
import { useBrand } from '@/lib/brand/provider'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import { Field } from './field'
import { Margin, statusWords } from './margin'

// The product component: page, forming text, field, margin. It renders a
// state; it never runs a clock, never sees an answer, and never animates a
// readable glyph beyond a single opacity ramp on arrival. Give it a state
// from settleAt() or from a live adapter.

/** Splits text into words and the whitespace between them, whitespace kept. */
function pieces(text: string): string[] {
  return text.split(/(\s+)/).filter((piece) => piece.length > 0)
}

/** A passage as word spans. Each word carries a copy of itself for the
 *  settling: the page's ink fills the letterforms bottom to top, one
 *  coordinated movement across the sentence, and the word never moves. */
function Passage({ text }: { text: string }) {
  let k = 0
  return (
    <span className="settle-passage">
      {pieces(text).map((piece, i) => /^\s+$/.test(piece)
        ? piece
        : <span key={i} className="settle-w" data-t={piece} style={{ ['--k' as string]: k++ } as CSSProperties}>{piece}</span>)}
    </span>
  )
}

/** The forming text as word spans keyed by their offset in the prefix, so a
 *  word that is already drawn never re-animates, and a batch of new words
 *  pours in from its first word. */
function Forming({ text, offset, seen }: { text: string; offset: number; seen: number }) {
  let at = offset
  let k = 0
  return (
    <span className="settle-forming" aria-hidden="true">
      {pieces(text).map((piece) => {
        const start = at
        at += piece.length
        if (/^\s+$/.test(piece)) return piece
        const fresh = start >= seen
        return <span key={start} data-fk={`f${start}`} className="settle-fw" style={{ ['--k' as string]: fresh ? k++ : 0 } as CSSProperties} data-fresh={fresh || undefined}>{piece}</span>
      })}
    </span>
  )
}

export type FormingMode = 'carve' | 'flow' | 'held'

/** The carved zone: slots where words will stand, words where they have. */
function Carved({ state }: { state: SettleState }) {
  const items = carve(state)
  if (!items.length) return null
  return (
    <span className="settle-carve" aria-hidden="true">
      {items.map((item) => {
        if (item.kind === 'word') return <span key={`w${item.position}`} data-fk={`w${item.position}`} className="settle-cw">{item.text.trim()} </span>
        if (item.kind === 'end') return <span key="end" data-fk="end" className="settle-slot" data-state="end" />
        return <span key={`s${item.position}`} data-fk={`s${item.position}`} className="settle-slot" data-state={item.state} style={{ ['--k' as string]: item.position } as CSSProperties}> </span>
      })}
    </span>
  )
}

type Props = {
  state: SettleState
  /** a voice on top of the surrounding brand's, clamped to the ranges */
  voice?: Partial<SettleVoice>
  /** what the zone after the page shows: the carved field (default), only the in-order forming text, or nothing, as Margin did */
  forming?: FormingMode
  /** kept for callers that only know on and off: false is 'held' */
  preview?: boolean
  /** draw the strip, the field's compact form (default: only when the zone is not carved) */
  field?: boolean
  /** draw the margin's words (default true) */
  status?: boolean
  paused?: boolean
  onApplyRevision?: () => void
  /** the accessible name of the answer region */
  label?: string
  /** what the page says while nothing has arrived */
  empty?: ReactNode
  className?: string
  style?: CSSProperties
}

export function SettleAnswer({
  state,
  voice: voiceProp,
  forming: formingProp,
  preview,
  field,
  status = true,
  paused = false,
  onApplyRevision,
  label = 'answer',
  empty,
  className = '',
  style,
}: Props) {
  const brand = useBrand()
  const voice = useMemo(() => clampSettleVoice({ ...brand.settle, ...voiceProp }), [brand.settle, voiceProp])
  const voiceVars = useMemo(
    () => (voiceProp ? settleVoiceStyle(voice, { ink: brand.ink, surface: brand.surface, stageText: brand.stageText, stage: brand.stage, accent: brand.accent }) : undefined),
    [voice, voiceProp, brand],
  )
  // the page's ink, measured where the surface sits, so the settling can
  // name the color it fills toward and the secondary ink can be mixed from it
  const rootRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    el.style.removeProperty('--settle-ink')
    el.style.setProperty('--settle-ink', getComputedStyle(el).color)
  }, [brand, className, style])
  // the zone after the page reflows as marks become words. Rather than
  // snapping to each new layout, every mark and word that persists glides
  // from where it was to where it is (a FLIP on the zone, retargeted from
  // the current visual position when a glide is already under way).
  // Reduced motion snaps.
  const reduced = usePrefersReducedMotion()
  const zoneRef = useRef<HTMLSpanElement>(null)
  const placed = useRef(new Map<string, { left: number; top: number }>())
  useLayoutEffect(() => {
    const zone = zoneRef.current
    const root = rootRef.current
    if (!zone || !root || reduced) return
    const origin = root.getBoundingClientRect()
    // how far an element may glide along its line: about three characters
    const reach = parseFloat(getComputedStyle(root).fontSize) * 1.8
    const next = new Map<string, { left: number; top: number }>()
    const els = Array.from(zone.querySelectorAll<HTMLElement>('[data-fk]'))
    // where each element is seen now (its new layout plus any glide still in
    // flight), then, with the glide cancelled, where its new layout puts it
    const seen = els.map((el) => ({ el, visual: el.getBoundingClientRect(), animations: el.getAnimations().filter((a) => a.id === 'glide') }))
    for (const { animations } of seen) for (const a of animations) a.cancel()
    for (const { el, visual } of seen) {
      const key = el.dataset.fk!
      const box = el.getBoundingClientRect()
      const layout = { left: box.left - origin.left, top: box.top - origin.top }
      next.set(key, layout)
      const previous = placed.current.get(key)
      if (!previous) continue
      // the offset a glide in flight had reached, so a new glide starts from
      // where the element is seen rather than snapping to its old place
      const inFlightX = visual.left - box.left
      const inFlightY = visual.top - box.top
      const dx = previous.left - layout.left + inFlightX
      const dy = previous.top - layout.top + inFlightY
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue
      // a short shift along its line glides; a long one, or a wrap to
      // another line, fades in where it now stands, so nothing streaks
      // across the text when a burst lands
      const near = Math.abs(dy) <= box.height * 0.5 && Math.abs(dx) <= reach
      const glide = near
        ? el.animate([{ transform: `translate(${dx}px, 0)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', composite: 'replace' })
        : el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', composite: 'replace' })
      glide.id = 'glide'
    }
    placed.current = next
  })
  useEffect(() => {
    // a restart or a new source starts the placement over
    if (state.receivedCount === 0) placed.current = new Map()
  }, [state.receivedCount])
  const mode: FormingMode = formingProp ?? (preview === false ? 'held' : 'carve')
  const showField = field ?? mode !== 'carve'
  const forming = mode === 'held' ? '' : formingText(state)
  const carved = mode === 'carve' && state.status !== 'complete'
  const pageEmpty = state.passages.length === 0 && !forming && !carved
  // how far the forming text had reached at the last render, so only words
  // past it are fresh; reset when the page grows past it
  const seenRef = useRef(0)
  // a state that shrank is a restart: everything is fresh again
  const seen = seenRef.current > state.wordSafeLength ? state.releasedLength : Math.max(seenRef.current, state.releasedLength)
  useEffect(() => {
    seenRef.current = Math.max(state.releasedLength, state.wordSafeLength)
  })
  const reviewId = useId()
  const [reviewing, setReviewing] = useState(false)
  const answerRef = useRef<HTMLDivElement>(null)
  const revisionKey = state.revisionText === null ? null : `${state.lastEventAtMs}:${state.revisionText}`
  useEffect(() => setReviewing(false), [revisionKey])
  // the live region announces state changes only, never each commit
  const announcement = statusWords(state, paused, false)

  return (
    <div
      ref={rootRef}
      className={`settle ${className}`}
      data-status={state.status}
      data-paused={paused || undefined}
      data-preview={mode !== 'held'}
      data-forming={mode}
      data-mark={voice.mark}
      data-demo
      style={{ ...voiceVars, ...style }}
    >
      <div ref={answerRef} className="settle-page" role="region" aria-label={label} tabIndex={state.previousPassages ? 0 : undefined}>
        {state.passages.map((passage) => <Passage key={passage.id} text={passage.text} />)}
        <span ref={zoneRef} className="settle-zone">
          {forming && <Forming text={forming} offset={state.releasedLength} seen={seen} />}
          {carved && <Carved state={state} />}
        </span>
        {pageEmpty && empty !== undefined && <span className="settle-empty" aria-hidden="true">{empty}</span>}
      </div>
      {showField && <Field state={state} mark={voice.mark} />}
      {status && <Margin state={state} mark={voice.mark} paused={paused} />}
      {(state.status === 'stopped' || state.status === 'error') && state.error && (
        <p className="readout mt-2" style={{ color: 'color-mix(in oklab, currentColor 72%, transparent)' }}>{state.error}</p>
      )}
      {state.revisionText !== null && (
        <div className="settle-revision">
          <button
            type="button"
            className="replay-btn cursor-pointer"
            aria-expanded={reviewing}
            aria-controls={reviewId}
            onClick={() => setReviewing((v) => !v)}
          >
            review revision
          </button>
          {reviewing && (
            <>
              <div id={reviewId} role="region" aria-label="proposed revision" className="mt-3">
                <p className="readout mb-2" style={{ color: 'color-mix(in oklab, currentColor 72%, transparent)' }}>proposed revision · the page above stays until you apply it</p>
                <div className="settle-revision-text">{state.revisionText}</div>
              </div>
              <div className="settle-revision-actions">
                <button type="button" className="settle-apply replay-btn cursor-pointer" onClick={onApplyRevision} disabled={!onApplyRevision}>
                  <span>apply revision</span>
                </button>
                <button type="button" className="replay-btn cursor-pointer" onClick={() => setReviewing(false)}>keep the previous version</button>
              </div>
            </>
          )}
        </div>
      )}
      {state.previousPassages && (
        <details className="settle-history mt-3">
          <summary className="readout">previous version</summary>
          <div className="settle-revision-text mt-2" style={{ color: 'color-mix(in oklab, currentColor 72%, transparent)' }}>
            {state.previousPassages.map((p) => <span key={p.id}>{p.text}</span>)}
          </div>
        </details>
      )}
      <p className="settle-sr" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    </div>
  )
}

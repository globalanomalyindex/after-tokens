'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { carve } from '@/lib/settle/carve'
import type { SettleState } from '@/lib/settle/types'
import { clampSettleVoice, settleVoiceStyle, type SettleVoice } from '@/lib/settle/voice'
import { useBrand } from '@/lib/brand/provider'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import { Field } from './field'
import { Margin, statusWords } from './margin'

// The product component: page, zone, cursor, margin. It renders a state; it
// never runs a clock, never sees an answer, and never draws a word before
// the source has committed every piece of it.
//
// The page holds released passages: still, selectable, the page's ink.
// The zone after it is the answer's remaining positions, in order. An open
// position is reserved blank space about a token wide. A position holding a
// piece of a word is a glimmer. A complete word is written where it will
// stand, in the secondary ink, opening from the width its positions
// reserved to its own, so what follows slides rather than jumps. The cursor,
// a circle centered on the line, glides to wherever the sampler just
// committed and the word softens in as it arrives; when a sentence closes
// the cursor sweeps to the end of the page and the page's ink settles
// through the sentence. At completion the cursor rests and fades.

export type FormingMode = 'carve' | 'flow' | 'held'

/** The width a token reserves before it is a word, in ch. */
const SLOT_CH = 2.3

/** Splits text into words and the whitespace between them, whitespace kept. */
function pieces(text: string): string[] {
  return text.split(/(\s+)/).filter((piece) => piece.length > 0)
}

/** A passage as word spans. Each word carries itself for the settling: the
 *  page's ink fills the letterforms bottom to top, one coordinated movement
 *  across the sentence, and the word never moves. */
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

/** A word in the zone. On arrival it holds the width its positions
 *  reserved and opens to its own over the onset, so the line slides
 *  instead of jumping; its letters soften in as the cursor reaches it. */
function ZoneWord({ text, position, span, forming, ms, animate }: { text: string; position: number; span: number; forming: boolean; ms: number; animate: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !animate || ms <= 0) return
    const natural = el.getBoundingClientRect().width
    el.style.transition = 'none'
    el.style.width = `${span * SLOT_CH}ch`
    void el.getBoundingClientRect()
    el.style.transition = `width ${ms}ms cubic-bezier(0.16, 1, 0.3, 1)`
    el.style.width = `${natural}px`
    const done = () => {
      el.style.width = ''
      el.style.transition = ''
    }
    const timer = window.setTimeout(done, ms + 40)
    return () => {
      window.clearTimeout(timer)
      done()
    }
    // on mount only: a word's text and span never change once it is written
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <span ref={ref} className="settle-cw" data-pos={position} data-end={position + span - 1} data-forming={forming || undefined}>{text}</span>
  )
}

type Props = {
  state: SettleState
  /** the position the source committed last, where the cursor goes */
  focus?: number | null
  /** a voice on top of the surrounding brand's, clamped to the ranges */
  voice?: Partial<SettleVoice>
  /** what the zone after the page shows: the carved field (default), only the in-order forming text, or nothing, as Margin did */
  forming?: FormingMode
  /** kept for callers that only know on and off: false is 'held' */
  preview?: boolean
  /** draw the strip, the field's compact form (default: only when the zone is not carved) */
  field?: boolean
  /** draw the cursor (default: in the carved zone) */
  cursor?: boolean
  /** draw the margin's words (default true) */
  status?: boolean
  /** a short vibration when a sentence settles, where the platform allows it */
  haptics?: boolean
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
  focus = null,
  voice: voiceProp,
  forming: formingProp,
  preview,
  field,
  cursor,
  status = true,
  haptics = false,
  paused = false,
  onApplyRevision,
  label = 'answer',
  empty,
  className = '',
  style,
}: Props) {
  const brand = useBrand()
  const reduced = usePrefersReducedMotion()
  const voice = useMemo(() => clampSettleVoice({ ...brand.settle, ...voiceProp }), [brand.settle, voiceProp])
  const voiceVars = useMemo(
    () => (voiceProp ? settleVoiceStyle(voice, { ink: brand.ink, surface: brand.surface, stageText: brand.stageText, stage: brand.stage, accent: brand.accent }) : undefined),
    [voice, voiceProp, brand],
  )
  const mode: FormingMode = formingProp ?? (preview === false ? 'held' : 'carve')
  const showField = field ?? mode !== 'carve'
  const showCursor = cursor ?? mode === 'carve'
  const zoneItems = useMemo(() => (mode === 'held' ? [] : carve(state)), [mode, state])
  const items = mode === 'flow' ? zoneItems.filter((item) => item.kind === 'word' && item.forming) : zoneItems
  const zoneEmpty = items.every((item) => item.kind === 'slot' && item.state === 'beyond')
  const pageEmpty = state.passages.length === 0 && zoneEmpty
  const ms = reduced ? 0 : voice.onset
  const rootRef = useRef<HTMLDivElement>(null)
  const pageEndRef = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLSpanElement>(null)
  const reviewId = useId()
  const [reviewing, setReviewing] = useState(false)
  const revisionKey = state.revisionText === null ? null : `${state.lastEventAtMs}:${state.revisionText}`
  useEffect(() => setReviewing(false), [revisionKey])
  const announcement = statusWords(state, paused, false)

  // the page's ink, measured where the surface sits, so the settling can
  // name the color it fills toward and the secondary ink can be mixed from it
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    el.style.removeProperty('--settle-ink')
    el.style.setProperty('--settle-ink', getComputedStyle(el).color)
  }, [brand, className, style])

  // a sentence closing: the cursor sweeps to the end of the page for a beat,
  // and a device that can tick, ticks
  const [finalizing, setFinalizing] = useState(false)
  const passagesRef = useRef(state.passages.length)
  useEffect(() => {
    if (state.passages.length > passagesRef.current) {
      setFinalizing(true)
      if (haptics && !reduced && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12)
      const timer = window.setTimeout(() => setFinalizing(false), 360)
      passagesRef.current = state.passages.length
      return () => window.clearTimeout(timer)
    }
    passagesRef.current = state.passages.length
  }, [state.passages.length, haptics, reduced])

  // the cursor: a circle on the line, at the position the source just
  // committed; after a word, like a caret; on a blank, at its center.
  // It moves by a transition on its transform, so a new target retargets
  // the glide from wherever it is.
  const terminal = state.status !== 'receiving' && state.status !== 'waiting'
  useLayoutEffect(() => {
    const root = rootRef.current
    const cur = cursorRef.current
    if (!root || !cur || !showCursor) return
    let target: Element | null = null
    let after = true
    if (!finalizing && !terminal && focus !== null) {
      for (const el of root.querySelectorAll<HTMLElement>('.settle-zone [data-pos]')) {
        const start = Number(el.dataset.pos)
        const end = Number(el.dataset.end ?? el.dataset.pos)
        if (focus >= start && focus <= end) {
          target = el
          after = el.classList.contains('settle-cw')
          break
        }
      }
    }
    if (!target) target = pageEndRef.current
    if (!target) return
    const r = target.getBoundingClientRect()
    const o = root.getBoundingClientRect()
    const x = after ? r.right - o.left + 3 : r.left - o.left + r.width / 2
    const y = r.top - o.top + r.height / 2
    cur.style.transform = `translate(${x}px, ${y}px)`
  })

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
      <div className="settle-page" role="region" aria-label={label} tabIndex={state.previousPassages ? 0 : undefined}>
        {state.passages.map((passage) => <Passage key={passage.id} text={passage.text} />)}
        <span ref={pageEndRef} className="settle-page-end" aria-hidden="true" />
        <span className="settle-zone" aria-hidden="true">
          {items.map((item) => {
            if (item.kind === 'word') return <span key={`w${item.position}`}><ZoneWord text={item.text.trim()} position={item.position} span={item.span} forming={item.forming} ms={ms} animate={!reduced} /> </span>
            if (item.kind === 'end') return <span key="end" className="settle-slot" data-state="end" data-pos={item.position} data-end={item.position + item.span - 1} />
            return <span key={`s${item.position}`} className="settle-slot" data-state={item.state} data-pos={item.position} />
          })}
        </span>
        {pageEmpty && empty !== undefined && <span className="settle-empty" aria-hidden="true">{empty}</span>}
      </div>
      {showCursor && <span ref={cursorRef} className="settle-cursor" data-state={terminal ? 'done' : finalizing ? 'finalizing' : 'active'} aria-hidden="true" />}
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

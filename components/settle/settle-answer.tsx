'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { carve, type CarveItem } from '@/lib/settle/carve'
import { DRAFT_FLOOR } from '@/lib/settle/reader'
import type { SettleState } from '@/lib/settle/types'
import { clampSettleVoice, settleVoiceStyle, type SettleVoice } from '@/lib/settle/voice'
import { useBrand } from '@/lib/brand/provider'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import { Field } from './field'
import { Margin, statusWords } from './margin'
import { useCompanion } from './use-companion'

// The product component: page, zone, cursor, margin. It renders a state; it
// never runs a clock and never sees an answer.
//
// The page holds released passages: still, selectable, the page's ink.
// The zone after it is the answer's remaining positions, in order, drawn as
// what the source has made of them. An open position is reserved blank
// space about a token wide. A position the source holds a confident guess
// for shows that guess as a draft: the model's own current prediction, in a
// ghost of the secondary ink that sharpens with its probability, visibly
// provisional. A committed piece of a word that is not complete stands as
// the piece it is. A complete word snaps in where it will stand, in the
// secondary ink, as the cursor reaches it. When a sentence closes the cursor
// sweeps to the end of the page and the page's ink settles through the
// sentence. At completion the cursor rests and fades.
//
// The honesty line: nothing committed is drawn as a guess, nothing guessed
// is drawn as committed, and no guess ever reaches the page.

export type FormingMode = 'carve' | 'flow' | 'held'

/** Where the cursor sits inside a cell: the middle of the lowercase letters, from the cell's top, in em. */
const CELL_MID_EM = 0.71

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

/** The widths each position was last drawn at, so a word can open from the
 *  space its positions really held, whatever they were showing. */
type Widths = Map<number, number>

/** Slides an element's width from what it was to what it is whenever its
 *  content changes, so the line moves instead of jumping. The element is
 *  measured at its natural width, set back to its previous width without a
 *  transition, then let go. */
function useWidthGlide(ref: React.RefObject<HTMLElement | null>, key: string, ms: number, from?: () => number | null, after?: (natural: number) => void) {
  const last = useRef<number | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.width = ''
    el.style.transition = ''
    const natural = el.getBoundingClientRect().width
    const previous = last.current ?? from?.() ?? null
    last.current = natural
    after?.(natural)
    if (previous === null || ms <= 0 || Math.abs(previous - natural) < 0.5) return
    el.style.transition = 'none'
    el.style.width = `${previous}px`
    void el.offsetWidth
    el.style.transition = `width ${ms}ms var(--ease-out-expo)`
    el.style.width = `${natural}px`
    const timer = window.setTimeout(() => {
      el.style.width = ''
      el.style.transition = ''
    }, ms + 40)
    return () => window.clearTimeout(timer)
    // the glide runs when the content changes, which the key names
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

/** A complete word in the zone. It opens from the width its positions held
 *  to its own, and snaps in: a short settling of blur, weight and color as
 *  the cursor reaches it. Its text never changes once it is written. */
function ZoneWord({ text, position, span, forming, ms, widths }: { text: string; position: number; span: number; forming: boolean; ms: number; widths: Widths }) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useCallback(() => {
    let sum = 0
    for (let p = position; p < position + span; p += 1) {
      const w = widths.get(p)
      if (w === undefined) return null
      sum += w
    }
    return sum
  }, [position, span, widths])
  const after = useCallback((natural: number) => {
    for (let p = position; p < position + span; p += 1) widths.set(p, p === position ? natural : 0)
  }, [position, span, widths])
  useWidthGlide(ref, `${position}:${text}`, ms, from, after)
  return (
    <span ref={ref} className="settle-cw" data-pos={position} data-end={position + span - 1} data-forming={forming || undefined}>{text}</span>
  )
}

/** One position of the zone that is not a complete word: reserved space, a
 *  draft, a committed piece, or an end belief. Keyed by position, so a
 *  position that changes register keeps its element and slides its width.
 *  A draft's letters are keyed by their text, so a change of mind remounts
 *  them and they reconsider. */
function Cell({ item, ms, widths }: { item: Extract<CarveItem, { kind: 'piece' | 'draft' | 'slot' }>; ms: number; widths: Widths }) {
  const ref = useRef<HTMLSpanElement>(null)
  const text = item.kind === 'piece' || (item.kind === 'draft' && !item.end) ? item.text.trim() : ''
  const register = item.kind === 'slot' ? item.state : item.kind === 'draft' && item.end ? 'end-belief' : item.kind
  const after = useCallback((natural: number) => widths.set(item.position, natural), [item.position, widths])
  useWidthGlide(ref, `${register}:${text}`, ms, undefined, after)
  const p = item.kind === 'draft' ? item.p : undefined
  // the draft's sharpness: its probability, from the floor to certainty
  const sure = p === undefined ? undefined : Math.max(0, Math.min(1, (p - DRAFT_FLOOR) / (1 - DRAFT_FLOOR)))
  return (
    <span
      ref={ref}
      className={text ? 'settle-cz' : 'settle-slot'}
      data-state={register}
      data-pos={item.position}
      style={sure === undefined ? undefined : ({ ['--sure' as string]: sure.toFixed(3) } as CSSProperties)}
    >{text ? (item.kind === 'draft' ? <span key={text} className="settle-cz-text">{text}</span> : text) : null}</span>
  )
}

/** Whether an item draws letters that a following piece attaches to. */
const drawsLetters = (item: CarveItem) => item.kind === 'word' || item.kind === 'piece' || (item.kind === 'draft' && !item.end)
const leadingSpace = (item: CarveItem) => (item.kind === 'word' || item.kind === 'piece' || item.kind === 'draft') && /^\s/.test(item.text)

/** The zone's items grouped for wrapping: a piece that continues the letters
 *  before it stays on their line. A group begins at a leading space, at a
 *  blank, or after one. */
function groupItems(items: CarveItem[]): CarveItem[][] {
  const groups: CarveItem[][] = []
  let current: CarveItem[] = []
  let previous: CarveItem | null = null
  for (const item of items) {
    const attaches = previous !== null && drawsLetters(item) && drawsLetters(previous) && !leadingSpace(item)
    if (!attaches && current.length) {
      groups.push(current)
      current = []
    }
    current.push(item)
    previous = item
  }
  if (current.length) groups.push(current)
  return groups
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
  const items = useMemo(() => (mode === 'flow' ? zoneItems.filter((item) => item.kind === 'word' && item.forming) : zoneItems), [mode, zoneItems])
  const groups = useMemo(() => groupItems(items), [items])
  const zoneEmpty = items.every((item) => item.kind === 'slot' && item.state === 'beyond')
  const pageEmpty = state.passages.length === 0 && zoneEmpty
  const ms = reduced ? 0 : voice.onset
  const widths = useRef<Widths>(new Map()).current
  const rootRef = useRef<HTMLDivElement>(null)
  const pageEndRef = useRef<HTMLSpanElement>(null)
  const haloRef = useRef<HTMLSpanElement>(null)
  const headRef = useRef<HTMLSpanElement>(null)
  const trailRef = useRef<HTMLSpanElement>(null)
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
  const [closings, setClosings] = useState(0)
  const passagesRef = useRef(state.passages.length)
  useEffect(() => {
    if (state.passages.length > passagesRef.current) {
      setClosings((n) => n + 1)
      if (haptics && !reduced && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12)
    }
    passagesRef.current = state.passages.length
  }, [state.passages.length, haptics, reduced])
  // each closing holds the sweep for a beat; a second closing inside the beat extends it
  useEffect(() => {
    if (!closings) return
    setFinalizing(true)
    const timer = window.setTimeout(() => setFinalizing(false), 360)
    return () => window.clearTimeout(timer)
  }, [closings])

  // the cursor's target: the element covering the position the source just
  // committed; after a word or a piece, like a caret; on a blank, at its
  // center; at the page's end while a sentence settles and when the source
  // is done. Measured on demand, every frame the cursor moves, so it follows
  // a word that is still opening.
  const terminal = state.status !== 'receiving' && state.status !== 'waiting'
  const targetRef = useRef<{ el: Element; after: boolean } | null>(null)
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !showCursor) return
    let target: Element | null = null
    let after = true
    if (!finalizing && !terminal && focus !== null) {
      for (const el of root.querySelectorAll<HTMLElement>('.settle-zone [data-pos]')) {
        const start = Number(el.dataset.pos)
        const end = Number(el.dataset.end ?? el.dataset.pos)
        if (focus >= start && focus <= end) {
          target = el
          after = el.classList.contains('settle-cw') || el.classList.contains('settle-cz')
          break
        }
      }
    }
    if (!target) target = pageEndRef.current
    targetRef.current = target ? { el: target, after } : null
  })
  const measureTarget = useCallback(() => {
    const root = rootRef.current
    const target = targetRef.current
    if (!root || !target) return null
    const r = target.el.getBoundingClientRect()
    const o = root.getBoundingClientRect()
    const em = parseFloat(getComputedStyle(target.el).fontSize) || 16
    return { x: target.after ? r.right - o.left + 3 : r.left - o.left + r.width / 2, y: r.top - o.top + CELL_MID_EM * em }
  }, [])
  const companion = useCompanion({ root: rootRef, halo: haloRef, head: headRef, trail: trailRef, target: measureTarget, active: showCursor, reduced })
  // any change of what the zone shows can move the target
  useLayoutEffect(() => { if (showCursor) companion.wake() })

  // the press: the cursor finalizes a word. Once per new written word.
  const [pulse, setPulse] = useState(0)
  const writtenRef = useRef(0)
  const written = useMemo(() => items.filter((item) => item.kind === 'word').length, [items])
  useEffect(() => {
    if (written > writtenRef.current && showCursor && !reduced) {
      companion.press()
      setPulse((n) => n + 1)
      if (haptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(5)
    }
    writtenRef.current = written
  }, [written, showCursor, reduced, companion, haptics])

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
          {groups.map((group) => {
            const first = group[0]!
            const key = `g${first.position}`
            const space = leadingSpace(first) ? ' ' : ''
            const inner = group.map((item) => {
              if (item.kind === 'word') return <ZoneWord key={`w${item.position}`} text={item.text.trim()} position={item.position} span={item.span} forming={item.forming} ms={ms} widths={widths} />
              if (item.kind === 'end') return <span key="end" className="settle-slot" data-state="end" data-pos={item.position} data-end={item.position + item.span - 1} />
              return <Cell key={`c${item.position}`} item={item} ms={ms} widths={widths} />
            })
            return group.length === 1
              ? <span key={key}>{space}{inner}</span>
              : <span key={key}>{space}<span className="settle-g">{inner}</span></span>
          })}
        </span>
        {pageEmpty && empty !== undefined && <span className="settle-empty" aria-hidden="true">{empty}</span>}
      </div>
      {showCursor && (
        <span className="settle-cursor" data-state={terminal ? 'done' : finalizing ? 'finalizing' : 'active'} aria-hidden="true">
          <span ref={haloRef} className="settle-cursor-halo">{pulse > 0 && <span key={pulse} className="settle-cursor-ring" />}</span>
          <span ref={trailRef} className="settle-cursor-trail" />
          <span ref={headRef} className="settle-cursor-head" />
        </span>
      )}
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

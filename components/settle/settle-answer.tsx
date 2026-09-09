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
// secondary ink, built from a blur letter by letter in no particular order,
// so the answer visibly constructs at several places at once. An open
// position is a stream of light with a slow flock of glowing dots hovering
// over it: where words may be but are not decided yet. Every position is a
// reel: a guess rolls up out of the stream, a guess the model drops rolls
// on up and out, blurred, as the next rolls in beneath it, and the word it
// commits rolls in last and snaps, so the space a word will fill is visible
// as space until the word fills it. A line break, once committed or
// guessed, is drawn as a break, so the message's shape (its length, its
// paragraphs, its list) is carved out before its words. When a sentence
// closes the page sets: the words press and come to rest, the page's ink
// rises through the letterforms, and a bloom under the sentence fades.
//
// The honesty line: nothing committed is drawn as a guess, nothing guessed
// is drawn as committed, and no guess ever reaches the page.

export type FormingMode = 'carve' | 'flow' | 'held'

/** A run of text as the zone draws it: the letters, with a break wherever the text breaks a line. */
function Broken({ text, letters }: { text: string; letters?: boolean }): ReactNode {
  const parts = text.split('\n')
  return parts.map((part, i) => (
    <span key={i} className="settle-frag">
      {letters ? Array.from(part).map((glyph, k) => <span key={k} className="settle-l" style={{ ['--i' as string]: buildOrder(part.length)[k] } as CSSProperties}>{glyph}</span>) : part}
      {i < parts.length - 1 && <br className="settle-nl" />}
    </span>
  ))
}

/** How far to either side of a settled word the drafts lift, in positions. */
const LIFT_REACH = 3
/** The drafts near a settled word lift for this long, in ms. */
const LIFT_MS = 640

/** Splits text into words and the whitespace between them, whitespace kept. */
function pieces(text: string): string[] {
  return text.split(/(\s+)/).filter((piece) => piece.length > 0)
}

/** A passage as word spans. Each word carries itself for the set: it
 *  presses down by a twentieth of an em and comes to rest where it was
 *  written, while the page's ink fills its letterforms bottom to top with
 *  a glint of the accent at the edge, one movement rippling across the
 *  sentence, and a bloom of the accent under the passage fades. After the
 *  set the word never moves again. */
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

/** The order a word's letters resolve in: from the middle outward, the
 *  two sides alternating, so a word builds rather than types. */
function buildOrder(count: number): number[] {
  const order = new Array<number>(count)
  const mid = (count - 1) / 2
  const byDistance = Array.from({ length: count }, (_, i) => i).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b)
  byDistance.forEach((letter, rank) => { order[letter] = rank })
  return order
}

/** A position's phase, 0 to 10, for the stream's shimmer, the flock and a
 *  draft's breath: scrambled (7 is coprime with 11), so neighbors are never
 *  in step and no wave travels along the line. */
const phase = (position: number) => (position * 7) % 11

/** How long a dropped guess takes to roll out of its position, in ms. Matches the stylesheet. */
const REEL_MS = 520

type Register = 'word' | 'piece' | 'draft' | 'open' | 'beyond' | 'end-belief'
type Row = { text: string; seq: number; born: Register }
type Reel = { row: Row; past: Row | null }

/** The reel at one position: what it shows now and what it just dropped.
 *  Each change of text is a new row keyed by its turn, so a new row rolls
 *  in from below the line and the row it replaces, the same element it
 *  always was, rolls on up and out; the dropped row is let go after the
 *  roll. A row remembers the register it was born in, so a word whose
 *  text was already standing as the draft lands where it is instead of
 *  rolling in again. Stored across renders in the documented way: state
 *  compared to the prop during render. */
function useReel(text: string, register: Register): Reel {
  const [reel, setReel] = useState<Reel>({ row: { text, seq: 0, born: register }, past: null })
  if (reel.row.text !== text) setReel({ row: { text, seq: reel.row.seq + 1, born: register }, past: reel.row.text ? reel.row : null })
  const past = reel.past
  useEffect(() => {
    if (!past) return
    const timer = window.setTimeout(() => setReel((r) => (r.past === past ? { ...r, past: null } : r)), REEL_MS)
    return () => window.clearTimeout(timer)
  }, [past])
  // a render that changed the reel is discarded and rerun with the new state
  return reel
}

type CellItem = Exclude<CarveItem, { kind: 'end' }>

/** One position of the zone, whatever it shows: reserved space, a draft, a
 *  committed piece, a written word, or an end belief. Keyed by position and
 *  always the same element, so a position that changes register keeps its
 *  stream to dissolve under what arrives, keeps its reel, and slides its
 *  width. A written word opens from the width its positions held to its
 *  own and builds: each letter comes into focus from a blur on its own
 *  beat, from the middle of the word outward, so the word is constructed
 *  rather than typed, and several words at once construct at once. Its text
 *  never changes once it is written. */
function Cell({ item, ms, widths }: { item: CellItem; ms: number; widths: Widths }) {
  const ref = useRef<HTMLSpanElement>(null)
  const raw = item.kind === 'word' || item.kind === 'piece' || (item.kind === 'draft' && !item.end) ? item.text : ''
  // a word that ends a line keeps its break outside the sliding box, so the
  // box measures the letters and the break still breaks the line
  const nl = /\n+$/.exec(raw)
  const text = (nl ? raw.slice(0, nl.index) : raw).trim()
  const register: Register = item.kind === 'slot' ? item.state : item.kind === 'draft' && item.end ? 'end-belief' : item.kind
  const { position } = item
  const span = item.kind === 'word' ? item.span : 1
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
  useWidthGlide(ref, `${register}:${text}`, ms, from, after)
  const { row, past } = useReel(text, register)
  // a word that was already standing as its own draft or piece lands in place; any other word rolls in
  const lands = register === 'word' && row.born !== 'word'
  const p = item.kind === 'draft' ? item.p : undefined
  // the draft's sharpness: its probability, from the floor to certainty
  const sure = p === undefined ? undefined : Math.max(0, Math.min(1, (p - DRAFT_FLOOR) / (1 - DRAFT_FLOOR)))
  const breaks = nl && Array.from(nl[0]).map((_, i) => <br key={i} className="settle-nl" data-state={register} />)
  // a piece or a guess that is only a line break is drawn as the break
  if (!text && nl) return <>{breaks}</>
  return (
    <>
      <span
        ref={ref}
        className={register === 'word' ? 'settle-cw' : text ? 'settle-cz' : 'settle-slot'}
        data-state={register}
        data-pos={position}
        data-end={item.kind === 'word' ? position + span - 1 : undefined}
        data-forming={item.kind === 'word' && item.forming ? '' : undefined}
        data-dot={(register === 'open' && position % 3 === 1) || undefined}
        style={{ ...(sure === undefined ? {} : { ['--sure' as string]: sure.toFixed(3) }), ['--k' as string]: phase(position) } as CSSProperties}
      >
        {past && <span key={`r${past.seq}`} className="settle-cz-text" data-past="">{past.text}</span>}
        {text && <span key={`r${row.seq}`} className="settle-cz-text" data-land={lands ? '' : undefined}>{register === 'word' ? <Broken text={text} letters /> : text}</span>}
      </span>
      {breaks}
    </>
  )
}

/** Whether an item draws letters that a following piece attaches to. */
const drawsLetters = (item: CarveItem) => item.kind === 'word' || item.kind === 'piece' || (item.kind === 'draft' && !item.end && item.text.trim() !== '')
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
  /** the position the source committed last; kept for callers, nothing on the surface follows it */
  focus?: number | null
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
  voice: voiceProp,
  forming: formingProp,
  preview,
  field,
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
  const zoneItems = useMemo(() => (mode === 'held' ? [] : carve(state)), [mode, state])
  const items = useMemo(() => (mode === 'flow' ? zoneItems.filter((item) => item.kind === 'word' && item.forming) : zoneItems), [mode, zoneItems])
  const groups = useMemo(() => groupItems(items), [items])
  const zoneEmpty = items.every((item) => item.kind === 'slot' && item.state === 'beyond')
  const pageEmpty = state.passages.length === 0 && zoneEmpty
  const ms = reduced ? 0 : voice.onset
  const widths = useRef<Widths>(new Map()).current
  const rootRef = useRef<HTMLDivElement>(null)
  const pageEndRef = useRef<HTMLSpanElement>(null)
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

  // a sentence closing: a device that can tick, ticks
  const passagesRef = useRef(state.passages.length)
  useEffect(() => {
    if (state.passages.length > passagesRef.current && haptics && !reduced && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12)
    passagesRef.current = state.passages.length
  }, [state.passages.length, haptics, reduced])

  // the drafts beside a settled word lift for a moment: the recorded
  // neighbor lift, drawn. Set on the elements directly, cleared by timer.
  const liftTimers = useRef(new Map<number, number>())
  const liftNeighbors = useCallback((position: number, span: number) => {
    const root = rootRef.current
    if (!root) return
    for (let p = position - LIFT_REACH; p <= position + span - 1 + LIFT_REACH; p += 1) {
      if (p >= position && p < position + span) continue
      const el = root.querySelector<HTMLElement>(`.settle-zone .settle-cz[data-state="draft"][data-pos="${p}"]`)
      if (!el) continue
      el.dataset.lift = '1'
      const previous = liftTimers.current.get(p)
      if (previous) window.clearTimeout(previous)
      liftTimers.current.set(p, window.setTimeout(() => { delete el.dataset.lift; liftTimers.current.delete(p) }, LIFT_MS))
    }
  }, [])
  useEffect(() => {
    const timers = liftTimers.current
    return () => { timers.forEach((t) => window.clearTimeout(t)); timers.clear() }
  }, [])

  // a word settling: it builds in place; the drafts beside it lift; a
  // device that can tick, ticks. Once per new written word, and several at
  // once are several at once.
  const seenWords = useRef(new Set<string>())
  useLayoutEffect(() => {
    const present = new Set<string>()
    for (const item of items) {
      if (item.kind !== 'word') continue
      const key = `${item.position}:${item.text}`
      present.add(key)
      if (seenWords.current.has(key)) continue
      seenWords.current.add(key)
      if (reduced) continue
      liftNeighbors(item.position, item.span)
      if (haptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(5)
    }
    // words the page took, or a restart, leave the set
    for (const key of seenWords.current) if (!present.has(key)) seenWords.current.delete(key)
  }, [items, liftNeighbors, haptics, reduced])

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
            const space = leadingSpace(first) ? ' ' : ''
            return (
              <span key={`g${first.position}`}>
                {space}
                <span className="settle-g">
                  {group.map((item) => item.kind === 'end'
                    ? <span key="end" className="settle-slot" data-state="end" data-pos={item.position} data-end={item.position + item.span - 1} />
                    : <Cell key={`c${item.position}`} item={item} ms={ms} widths={widths} />)}
                </span>
              </span>
            )
          })}
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

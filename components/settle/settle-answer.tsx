'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { carve, type CarveItem } from '@/lib/settle/carve'
import type { SettleState } from '@/lib/settle/types'
import { clampSettleVoice, settleVoiceStyle, type SettleVoice } from '@/lib/settle/voice'
import { useBrand } from '@/lib/brand/provider'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import { useFormationLayout } from './use-formation-layout'
import { Field } from './field'
import { Margin, statusWords } from './margin'
import { AmbientComposition, type AmbientCondition } from './ambient-composition'

export type FormingMode = 'carve' | 'flow' | 'held'
type DisplayItem = CarveItem & { joined?: boolean }

// The same outer source range stays mounted when a candidate changes or a
// passage releases. Candidate whitespace never owns parents or line breaks.
function Cell({ item, released, offset, limit }: { item: DisplayItem; released: number; offset: number | undefined; limit: number }) {
  const committed = item.kind === 'word' || item.kind === 'piece'
  const raw = 'text' in item ? item.text.slice(0, limit) : ''
  const register = item.kind === 'slot' ? item.state : item.kind === 'draft' && item.end ? 'open' : item.kind
  const end = item.position + (item.kind === 'word' || item.kind === 'end' ? item.span : 1) - 1
  const isReleased = committed && offset !== undefined && offset + raw.length <= released
  let char = 0
  return (
    <span className="settle-unit" data-pos={item.position} data-end={end} data-state={register}
      data-released={isReleased || undefined} aria-hidden={committed ? undefined : true}
      style={{ ['--formation-phase' as string]: `${-(Math.floor(item.position / 8) * 3 % 4) * 1400}ms` } as CSSProperties}>
      {committed ? raw.split(/(\s+)/).filter(Boolean).map((part) => {
        const start = char
        char += part.length
        if (/^\s+$/.test(part)) return part
        const ready = offset !== undefined && offset + char <= released
        return <span key={start} className="settle-ink" data-layout={`${item.position}:${start}`} data-spatial={item.kind === 'word' && !item.joined || undefined} data-released={ready || undefined} aria-hidden={ready ? undefined : true}>{part}</span>
      }) : <span className="settle-candidate" data-layout={`${item.position}:slot`}>
        <span className="settle-draft" data-text={raw.replace(/\s+/g, ' ').trim()} />
        <span className="settle-ambient" data-text={raw.replace(/\s+/g, ' ').trim()} aria-hidden="true" />
      </span>}
    </span>
  )
}

type Props = {
  state: SettleState
  /** Change when starting a new source or replay, even at the same time. */
  runId?: string | number
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
  /** A shared comparison can own one announcement instead of repeating it. */
  announce?: boolean
  /** a short vibration when a sentence settles, where the platform allows it */
  haptics?: boolean
  /** Disable decorative and spatial motion without changing source timing. */
  motion?: boolean
  /** A controlled decorative comparison; never changes source or release timing. */
  ambient?: AmbientCondition
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
  state, runId = 'default', voice: voiceProp, forming: formingProp, preview, field, status = true, announce = true,
  haptics = false, motion = true, ambient = 'reshape', paused = false, onApplyRevision,
  label = 'answer', empty, className = '', style,
}: Props) {
  const brand = useBrand()
  const reduced = usePrefersReducedMotion()
  const enabled = motion && !reduced
  const voice = useMemo(() => clampSettleVoice({ ...brand.settle, ...voiceProp }), [brand.settle, voiceProp])
  const voiceVars = useMemo(() => voiceProp ? settleVoiceStyle(voice, { ink: brand.ink, surface: brand.surface, stageText: brand.stageText, stage: brand.stage, accent: brand.accent }) : undefined, [voice, voiceProp, brand])
  const mode: FormingMode = formingProp ?? (preview === false ? 'held' : 'carve')
  const wholeAnswer = state.policy === 'answer'
  const showField = !wholeAnswer && (field ?? mode !== 'carve')
  // Promotion changes styling, never the text's parent or whitespace. The
  // source reducer remains authoritative about exactly which characters release.
  const items = useMemo<DisplayItem[]>(() => wholeAnswer ? [] : carve({ ...state, releasedLength: 0 }).flatMap((item) => {
    if (item.kind !== 'word' || item.span === 1) return [item]
    // A boundary proves a word complete without replacing its token children.
    // Native inline fragments keep a multi-token word together while wrapping.
    return Array.from({ length: item.span }, (_, index) => ({ ...item, position: item.position + index, span: 1, text: state.tokens[item.position + index]!.text, joined: true }))
  }), [state, wholeAnswer])
  const offsets = useMemo(() => {
    let chars = 0
    const map = new Map<number, number>()
    state.prefixTokens.forEach((t) => { map.set(t.position, chars); chars += t.text.length })
    return map
  }, [state.prefixTokens])
  const visible = useMemo(() => items.filter((item) => {
    if (item.kind === 'slot' && item.state === 'beyond') return false
    if (item.kind === 'end') return state.status !== 'complete' && state.status !== 'revision'
    if (mode === 'carve') return true
    const offset = offsets.get(item.position)
    return (item.kind === 'word' || item.kind === 'piece') && offset !== undefined && offset < (mode === 'held' ? state.releasedLength : state.wordSafeLength)
  }), [items, mode, offsets, state.releasedLength, state.wordSafeLength, state.status])
  const rootRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)
  const [documentVisible, setDocumentVisible] = useState(true)
  const active = enabled && !paused && inView && documentVisible && (state.status === 'waiting' || state.status === 'receiving')
  const reviewId = useId()
  const [reviewing, setReviewing] = useState(false)
  const revisionKey = state.revisionText === null ? null : `${state.lastEventAtMs}:${state.revisionText}`
  useEffect(() => setReviewing(false), [revisionKey])
  const announcement = statusWords(state, paused, false)
  const [arrival, setArrival] = useState<string | null>(null)
  const seenArrival = useRef({ runId, version: state.version, released: state.releasedLength })
  useLayoutEffect(() => {
    const previous = seenArrival.current
    const changedRun = previous.runId !== runId || previous.version !== state.version
    const released = wholeAnswer && state.releasedLength > 0 && (changedRun || state.releasedLength > previous.released)
    seenArrival.current = { runId, version: state.version, released: state.releasedLength }
    if (!enabled || paused || !inView || !documentVisible || changedRun) setArrival(null)
    if (released && enabled && !paused && inView && documentVisible && state.status === 'complete') setArrival(`${runId}:${state.version}`)
  }, [wholeAnswer, state.releasedLength, state.version, state.status, runId, enabled, paused, inView, documentVisible])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false))
    if (rootRef.current) observer.observe(rootRef.current)
    const visibility = () => setDocumentVisible(document.visibilityState !== 'hidden')
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    el.style.removeProperty('--settle-ink')
    el.style.setProperty('--settle-ink', getComputedStyle(el).color)
  }, [brand, className, style?.color])

  useFormationLayout(rootRef, state, visible, !wholeAnswer && enabled && !paused && inView && documentVisible, voice, runId)
  const passagesRef = useRef(state.passages.length)
  useEffect(() => {
    if (state.passages.length > passagesRef.current && haptics && enabled && !paused && inView && documentVisible && 'vibrate' in navigator) navigator.vibrate(12)
    passagesRef.current = state.passages.length
  }, [state.passages.length, haptics, enabled, paused, inView, documentVisible])

  const snapshot = state.source === 'snapshot' || (state.previousPassages !== null && !Object.keys(state.tokens).length)
  const receiving = state.status === 'waiting' || state.status === 'receiving'
  const answerText = wholeAnswer ? state.passages.map((passage) => passage.text).join('') : ''
  const failed = state.status === 'stopped' || state.status === 'error'
  const page = (
    <div className="settle-page" role="region" aria-label={label} aria-busy={wholeAnswer ? receiving : undefined} tabIndex={state.previousPassages ? 0 : undefined}>
      {wholeAnswer ? (answerText && <span className="settle-answer-text">{answerText}</span>)
        : snapshot ? state.passages.map((p) => <span key={p.id} className="settle-passage">{p.text}</span>)
          : visible.map((item) => <Cell key={`${runId}:v${state.version}:${item.position}`} item={item} released={state.releasedLength} offset={offsets.get(item.position)} limit={mode === 'carve' ? Infinity : Math.max(0, (mode === 'held' ? state.releasedLength : state.wordSafeLength) - (offsets.get(item.position) ?? 0))} />)}
      {!wholeAnswer && !state.prefix && !visible.length && empty !== undefined && <span className="settle-empty" aria-hidden="true">{empty}</span>}
    </div>
  )
  return (
    <div ref={rootRef} className={`settle ${className}`} data-status={state.status} data-policy={state.policy} data-ambient-condition={wholeAnswer ? ambient : undefined}
      data-paused={paused} data-active={active} data-motion={enabled ? 'on' : 'off'}
      data-visible={inView && documentVisible}
      data-preview={mode !== 'held'} data-forming={mode} data-mark={voice.mark} data-demo
      style={{ ...voiceVars, ...style }}>
      {wholeAnswer ? <div className="settle-answer-frame" data-occupied={receiving || !!answerText}>
        {receiving && <AmbientComposition active={active} motion={enabled} condition={ambient} complete={false} runId={runId} tempo={voice.tempo} />}
        {page}
        {!!answerText && arrival !== null && <span key={arrival} className="settle-answer-arrival" aria-hidden="true" onAnimationEnd={() => setArrival((current) => current === arrival ? null : current)} />}
      </div> : page}
      {wholeAnswer && state.status === 'complete' && !answerText && <p className="readout">the source returned an empty answer</p>}
      {wholeAnswer && failed && state.prefix && <details className="settle-history mt-3">
        <summary className="readout">inspect unfinished text</summary>
        <p className="readout mt-2">committed prefix only · incomplete; gaps and later fragments are not a finished answer</p>
        <div className="settle-partial-text settle-revision-text mt-2">{state.prefix}</div>
      </details>}
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
      {announce && <p className="settle-sr" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>}
    </div>
  )
}

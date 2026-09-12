'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { SettleState } from '@/lib/settle/types'
import { clampSettleVoice, settleVoiceStyle, type SettleVoice } from '@/lib/settle/voice'
import { useBrand } from '@/lib/brand/provider'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import { statusWords } from './margin'
import { AmbientComposition, type AmbientCondition } from './ambient-composition'
import { useReadingSurface } from './use-reading-surface'
import { BubbleTransfer } from './bubble-transfer'

/** Retained for old integrations; these names no longer select a renderer. */
export type FormingMode = 'carve' | 'flow' | 'held'

type Props = {
  state: SettleState
  /** Change when starting a new source or replay, even at the same time. */
  runId?: string | number
  /** the position the source committed last; kept for callers, nothing on the surface follows it */
  focus?: number | null
  /** a voice on top of the surrounding brand's, clamped to the ranges */
  voice?: Partial<SettleVoice>
  /** what the zone after the page shows: deprecated compatibility options; every policy now uses the cell field */
  forming?: FormingMode
  /** deprecated compatibility input; it no longer selects a preview treatment */
  preview?: boolean
  /** deprecated; progress strips are no longer rendered */
  field?: boolean
  /** draw the status line (default true) */
  status?: boolean
  /** A shared comparison can own one announcement instead of repeating it. */
  announce?: boolean
  /** optional short vibration when a handover begins, including the final field fade */
  haptics?: boolean
  /** Disable decorative and spatial motion without changing source timing. */
  motion?: boolean
  /** A controlled decorative comparison; never changes source or release timing. */
  ambient?: AmbientCondition
  paused?: boolean
  onApplyRevision?: () => void
  onVisualReady?: (ready: boolean) => void
  /** the accessible name of the answer region */
  label?: string
  /** deprecated compatibility input; the waiting field now owns the empty state */
  empty?: ReactNode
  className?: string
  style?: CSSProperties
}

export function SettleAnswer({
  state, runId = 'default', voice: voiceProp, status = true, announce = true,
  haptics = false, motion = true, ambient = 'reshape', paused = false, onApplyRevision, onVisualReady,
  label = 'answer', className = '', style,
}: Props) {
  const brand = useBrand()
  const reduced = usePrefersReducedMotion()
  const enabled = motion && !reduced
  const voice = useMemo(() => clampSettleVoice({ ...brand.settle, ...voiceProp }), [brand.settle, voiceProp])
  const voiceVars = useMemo(() => voiceProp ? settleVoiceStyle(voice, { ink: brand.ink, surface: brand.surface, stageText: brand.stageText, stage: brand.stage, accent: brand.accent }) : undefined, [voice, voiceProp, brand])
  const wholeAnswer = state.policy === 'answer'
  const receiving = state.status === 'waiting' || state.status === 'receiving'
  const answerText = state.passages.map((passage) => passage.text).join('')
  const rootRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)
  const [documentVisible, setDocumentVisible] = useState(true)
  const effectiveMotion = enabled && !paused && inView && documentVisible
  const surface = useReadingSurface({ state, runId, frameRef, pageRef, effectiveMotion })
  const active = effectiveMotion && (receiving || surface.phase === 'fitting')
  const visualReady = !receiving && surface.phase === 'ready'
  useEffect(() => { onVisualReady?.(visualReady) }, [onVisualReady, visualReady])
  const reviewId = useId()
  const [reviewing, setReviewing] = useState(false)
  const revisionKey = state.revisionText === null ? null : `${state.lastEventAtMs}:${state.revisionText}`
  useEffect(() => setReviewing(false), [revisionKey])
  const announcement = surface.phase === 'fitting' ? 'text received · fitting the view'
    : surface.phase === 'revealing' ? 'text received · settling into place' : statusWords(state, paused, false)

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
  const hapticArrival = useRef<string | null>(null)
  useEffect(() => {
    if (surface.phase === 'revealing' && surface.arrivalKey !== null && surface.arrivalKey !== hapticArrival.current) {
      if (haptics && effectiveMotion && 'vibrate' in navigator) navigator.vibrate(12)
      hapticArrival.current = surface.arrivalKey
    }
  }, [surface.phase, surface.arrivalKey, haptics, effectiveMotion])
  const failed = state.status === 'stopped' || state.status === 'error'
  let start = 0
  const page = <div ref={pageRef} className="settle-page" role="region" aria-label={label} aria-busy={receiving || surface.phase !== 'ready'} tabIndex={state.previousPassages ? 0 : undefined}>
    <span className="settle-answer-text">
      {state.passages.map((passage) => {
        const from = start
        start += passage.text.length
        const arriving = surface.phase === 'revealing' && start > surface.visibleLength && from < surface.revealTo
        const pending = start > surface.visibleLength && !arriving
        return <span key={`${runId}:${passage.id}`} className="settle-passage" data-passage={passage.id} data-start={from} data-end={start}
          data-pending={pending || undefined} data-arriving={arriving || undefined}>{passage.text}</span>
      })}
    </span>
  </div>
  return (
    <div ref={rootRef} className={`settle ${className}`} data-status={state.status} data-policy={state.policy}
      data-material="responsive-cell-skeleton-v6" data-ambient-condition={ambient}
      data-source-at-ms={state.lastEventAtMs} data-released-length={state.releasedLength}
      data-answer-phase={surface.phase} data-visual-ready={visualReady}
      data-paused={paused} data-active={active} data-motion={enabled ? 'on' : 'off'}
      data-visible={inView && documentVisible} data-forming="cells" data-mark={voice.mark} data-demo
      style={{ ...voiceVars, ...style }}>
      <div ref={frameRef} className="settle-answer-frame" data-phase={surface.phase} data-occupied={receiving || !!answerText} data-receiving={receiving}>
        {(receiving || surface.phase !== 'ready') && <div className="settle-waiting-field" style={{ top: surface.tailOffset, height: surface.rowCount * surface.lineHeightPx }}>
          <AmbientComposition active={active} motion={enabled} condition={ambient} complete={false} runId={`${runId}:v${state.version}`} tempo={voice.tempo} rowCount={surface.rowCount} profile={surface.profile} lineHeightPx={surface.lineHeightPx} barHeightPx={surface.barHeightPx} />
        </div>}
        {page}
        {surface.phase === 'revealing' && surface.arrivalKey && <BubbleTransfer key={surface.arrivalKey} frameRef={frameRef} transferKey={surface.arrivalKey} onComplete={surface.finishHandover} />}
      </div>
      {state.status === 'complete' && !answerText && <p className="readout">the source returned an empty answer</p>}
      {wholeAnswer && failed && state.prefix && <details className="settle-history mt-3">
        <summary className="readout">inspect unfinished text</summary>
        <p className="readout mt-2">committed prefix only · incomplete; gaps and later fragments are not a finished answer</p>
        <div className="settle-partial-text settle-revision-text mt-2">{state.prefix}</div>
      </details>}
      {status && <div className="settle-margin readout"><span className="settle-status">{announcement}</span></div>}
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

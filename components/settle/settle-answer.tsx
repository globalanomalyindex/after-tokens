'use client'

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { formingText } from '@/lib/settle/reader'
import type { SettleState } from '@/lib/settle/types'
import { clampSettleVoice, settleVoiceStyle, type SettleVoice } from '@/lib/settle/voice'
import { useBrand } from '@/lib/brand/provider'
import { Field } from './field'
import { Margin, statusWords } from './margin'

// The product component: page, forming text, field, margin. It renders a
// state; it never runs a clock, never sees an answer, and never animates a
// readable glyph. Give it a state from settleAt() or from a live adapter.

type Props = {
  state: SettleState
  /** a voice on top of the surrounding brand's, clamped to the ranges */
  voice?: Partial<SettleVoice>
  /** draw the forming text (default true); off, the surface holds like Margin and pays Margin's wait */
  preview?: boolean
  /** draw the field (default true) */
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
  preview = true,
  field = true,
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
  const voiceVars = useMemo(() => (voiceProp ? settleVoiceStyle(voice) : undefined), [voice, voiceProp])
  const forming = preview ? formingText(state) : ''
  const pageEmpty = state.passages.length === 0 && !forming
  const reviewId = useId()
  const [reviewing, setReviewing] = useState(false)
  const answerRef = useRef<HTMLDivElement>(null)
  const revisionKey = state.revisionText === null ? null : `${state.lastEventAtMs}:${state.revisionText}`
  useEffect(() => setReviewing(false), [revisionKey])
  // the live region announces state changes only, never each commit
  const announcement = statusWords(state, paused, false)

  return (
    <div
      className={`settle ${className}`}
      data-status={state.status}
      data-paused={paused || undefined}
      data-preview={preview}
      data-demo
      style={{ ...voiceVars, ...style }}
    >
      <div ref={answerRef} className="settle-page" role="region" aria-label={label} tabIndex={state.previousPassages ? 0 : undefined}>
        {state.passages.map((passage) => (
          <span key={passage.id} className="settle-passage">{passage.text}</span>
        ))}
        {forming && <span className="settle-forming" aria-hidden="true">{forming}</span>}
        {pageEmpty && empty !== undefined && <span className="settle-empty" aria-hidden="true">{empty}</span>}
      </div>
      {field && <Field state={state} mark={voice.mark} />}
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

'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { SettleState } from '@/lib/settle/types'
import { estimateAnswerEnvelope, estimateCandidateEnvelope } from '@/lib/settle/answer-envelope'

export const HANDOVER_MS = 280
export type ReadingPhase = 'waiting' | 'fitting' | 'revealing' | 'ready'
type Options = { state: SettleState; runId: string | number; frameRef: RefObject<HTMLDivElement | null>; pageRef: RefObject<HTMLDivElement | null>; effectiveMotion: boolean }
type Surface = {
  phase: ReadingPhase; visibleLength: number; revealTo: number; arrivalKey: string | null
  rowCount: number; lineHeightPx: number; barHeightPx: number; tailOffset: number
}
const INITIAL: Surface = { phase: 'waiting', visibleLength: 0, revealTo: 0, arrivalKey: null, rowCount: 5, lineHeightPx: 24, barHeightPx: 14.4, tailOffset: 0 }

/** A single reading surface for every release policy. Only released passages
 * enter its page. New batches have a bounded material handover; earlier text
 * keeps its nodes and ink. Source eligibility is never inferred or modified. */
export function useReadingSurface({ state, runId, frameRef, pageRef, effectiveMotion }: Options) {
  const [surface, setSurface] = useState<Surface>(INITIAL)
  const current = useRef(surface)
  const latest = useRef(state)
  const identity = useRef('')
  const observedLength = useRef(0)
  const sizingContext = useRef('')
  const lastTarget = useRef<number | null>(null)
  const operation = useRef(0)
  const animation = useRef<Animation | null>(null)
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fitDeadline = useRef(0)
  const capacityRows = useRef(5)
  const capacityDue = useRef(true)
  const canvas = useRef<CanvasRenderingContext2D | null>(null)
  const pendingField = useRef<{ rowCount: number; tailOffset: number } | null>(null)
  const measureRef = useRef<() => void>(() => {})
  const update = useCallback((patch: Partial<Surface>) => {
    const next = { ...current.current, ...patch }
    if (JSON.stringify(next) === JSON.stringify(current.current)) return
    current.current = next
    setSurface(next)
  }, [])
  const cancelResize = useCallback(() => {
    operation.current += 1
    animation.current?.cancel()
    animation.current = null
  }, [])
  const clearFallback = useCallback(() => {
    if (fallback.current !== null) clearTimeout(fallback.current)
    fallback.current = null
  }, [])
  const finishHandover = useCallback((key: string) => {
    if (current.current.arrivalKey !== key) return
    clearFallback()
    fitDeadline.current = 0
    const receiving = latest.current.status === 'waiting' || latest.current.status === 'receiving'
    const field = receiving ? pendingField.current : null
    pendingField.current = null
    update({ ...field, visibleLength: current.current.revealTo, arrivalKey: null, phase: receiving ? 'waiting' : 'ready' })
    // The residual field has finished fading. Only now contract its reserved
    // space, so fading ink cannot overlap the status or following content.
    if (!receiving) measureRef.current()
  }, [clearFallback, update])
  const advanceWaitingField = useCallback((key: string) => {
    if (current.current.arrivalKey !== key) return
    const receiving = latest.current.status === 'waiting' || latest.current.status === 'receiving'
    // BubbleTransfer calls this only AFTER reading the on-screen origins.
    // CSS can now carry the unborrowed field below the newly eligible text.
    if (receiving && pendingField.current) update(pendingField.current)
    pendingField.current = null
  }, [update])

  useLayoutEffect(() => {
    latest.current = state
    measureRef.current = () => {
      const frame = frameRef.current, page = pageRef.current
      if (!frame || !page) return
      const key = `${runId}:v${state.version}:${state.policy}`
      const changedRun = identity.current !== key
      const style = getComputedStyle(page)
      const fontSize = parseFloat(style.fontSize) || 16
      const lineHeightPx = parseFloat(style.lineHeight) || fontSize * 1.5
      const barHeightPx = fontSize * .9
      if (changedRun) {
        cancelResize(); clearFallback()
        fitDeadline.current = 0
        identity.current = key
        observedLength.current = 0
        capacityRows.current = 5
        capacityDue.current = true
        pendingField.current = null
        sizingContext.current = ''
        lastTarget.current = 5 * lineHeightPx
        frame.style.height = `${lastTarget.current}px`
        current.current = { ...INITIAL, lineHeightPx, barHeightPx }
      }
      const width = page.getBoundingClientRect().width || frame.getBoundingClientRect().width
      const font = `${style.fontStyle || 'normal'} ${style.fontWeight || '400'} ${fontSize}px ${style.fontFamily || 'sans-serif'}`
      const context = `${Math.round(width * 2) / 2}:${font}:${lineHeightPx}:${style.letterSpacing}`
      const changedContext = sizingContext.current !== '' && sizingContext.current !== context
      if (sizingContext.current !== context) sizingContext.current = context
      const receiving = state.status === 'waiting' || state.status === 'receiving'
      const length = state.releasedLength
      const newBatch = length > observedLength.current
      const previousLength = Math.min(observedLength.current, length)
      const pageHeight = length > 0 ? page.getBoundingClientRect().height : 0
      // Restore the earlier high-level space budget, not draft word shapes.
      // Coalesce source-only sizing into 600 ms samples; a released batch,
      // finality or typography change always bypasses that decorative gate.
      if (capacityDue.current || changedRun || changedContext || newBatch || !receiving || !effectiveMotion) {
        capacityDue.current = false
        if (!canvas.current && typeof CanvasRenderingContext2D !== 'undefined') canvas.current = document.createElement('canvas').getContext('2d')
        if (canvas.current) { canvas.current.font = font; canvas.current.fontKerning = 'none' }
        const spacing = parseFloat(style.letterSpacing) || 0
        const advance = (text: string) => (canvas.current ? canvas.current.measureText(text).width : Array.from(text).length * fontSize * .52) + Math.max(0, Array.from(text).length - 1) * spacing
        const estimate = state.source === 'snapshot'
          ? estimateCandidateEnvelope(state.snapshotCandidate ?? '', width, advance)
          : estimateAnswerEnvelope(state, width, advance)
        capacityRows.current = Math.max(changedContext ? 5 : capacityRows.current, estimate.rowCount)
      }
      const occupiedRows = Math.ceil(pageHeight / lineHeightPx)
      const rowCount = receiving ? Math.max(length > 0 ? 4 : 5, Math.min(14, capacityRows.current - occupiedRows)) : current.current.rowCount
      // Keep the first unresolved bar on the same vertical rhythm as every
      // later bar. The field's bar is centered inside its line, so the lead
      // before that line is the remaining half of the line-to-bar inset.
      // This scales with the actual type and bar metrics on every viewport.
      const waitingLead = Math.max(0, (lineHeightPx - barHeightPx) / 2)
      const tailOffset = receiving ? pageHeight + (length > 0 ? waitingLead : 0) : current.current.tailOffset
      const target = receiving ? tailOffset + rowCount * lineHeightPx : pageHeight
      const resize = (height: number, duration: number, done?: () => void) => {
        const from = frame.getBoundingClientRect().height
        cancelResize()
        const serial = operation.current
        frame.style.height = `${height}px`
        lastTarget.current = height
        if (!effectiveMotion || duration <= 0 || Math.abs(from - height) <= 1 || typeof frame.animate !== 'function') { done?.(); return }
        const next = frame.animate([{ height: `${from}px` }, { height: `${height}px` }], { duration, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' })
        animation.current = next
        next.onfinish = () => {
          if (serial !== operation.current || identity.current !== key) return
          animation.current = null; next.cancel(); done?.()
        }
      }
      // Preserve the visible cells across the first layout of an arrival.
      // Measuring after moving this field would invent an offscreen origin.
      if (effectiveMotion && receiving && (newBatch || current.current.arrivalKey)) {
        pendingField.current = { rowCount, tailOffset }
        update({ lineHeightPx, barHeightPx })
      } else update({ rowCount, tailOffset, lineHeightPx, barHeightPx })
      const reveal = (arrivalKey: string) => {
        if (identity.current !== key || current.current.arrivalKey !== arrivalKey) return
        clearFallback()
        fitDeadline.current = 0
        update({ phase: 'revealing' })
        // CSS animationend normally owns completion. This guard only prevents
        // a stranded hidden batch if the browser drops that event.
        fallback.current = setTimeout(() => finishHandover(arrivalKey), 700)
      }
      if (!effectiveMotion || state.status === 'revision' || state.status === 'error' || state.status === 'stopped'
        || (changedContext && current.current.arrivalKey !== null)) {
        clearFallback(); resize(target, 0)
        fitDeadline.current = 0
        pendingField.current = null
        observedLength.current = length
        update({ visibleLength: length, revealTo: length, arrivalKey: null, phase: receiving ? 'waiting' : 'ready' })
        return
      }
      if (newBatch) {
        clearFallback()
        observedLength.current = length
        const arrivalKey = `${key}:${length}`
        // An interrupted prior batch becomes stationary. It never fades again.
        update({ visibleLength: previousLength, revealTo: length, arrivalKey })
        if (pageHeight - frame.getBoundingClientRect().height > 1) {
          update({ phase: 'fitting' })
          fitDeadline.current = performance.now() + 180
          resize(target, 180, () => reveal(arrivalKey))
        } else {
          resize(receiving ? target : Math.max(target, frame.getBoundingClientRect().height), receiving ? 380 : 0)
          reveal(arrivalKey)
        }
      } else if (!receiving && length > 0 && current.current.phase === 'waiting') {
        // An early-reading policy may have released every character before
        // EOS. Fade the remaining activity field without moving old words.
        const arrivalKey = `${key}:done`
        update({ visibleLength: length, revealTo: length, arrivalKey, phase: 'revealing' })
        resize(Math.max(target, frame.getBoundingClientRect().height), 0)
        fallback.current = setTimeout(() => finishHandover(arrivalKey), 700)
      } else if (lastTarget.current !== target && !(!receiving && current.current.phase === 'revealing' && target < frame.getBoundingClientRect().height)) {
        // A later viewport/font reflow cannot replay any old word animation.
        const pendingFit = current.current.phase === 'fitting' ? current.current.arrivalKey : null
        // A layout change cannot keep an already eligible batch hidden.
        // Retarget from the displayed height within its original fit deadline.
        const duration = pendingFit ? Math.max(0, fitDeadline.current - performance.now()) : receiving ? 380 : 180
        resize(target, duration, pendingFit ? () => reveal(pendingFit) : undefined)
      }
      if (length === 0 && !receiving) update({ visibleLength: 0, revealTo: 0, arrivalKey: null, phase: 'ready' })
      if (changedRun) setSurface({ ...current.current })
    }
    measureRef.current()
  }, [state, runId, effectiveMotion, frameRef, pageRef, update, cancelResize, clearFallback, finishHandover])

  const receiving = state.status === 'waiting' || state.status === 'receiving'
  useEffect(() => {
    if (!receiving || !effectiveMotion) return
    const timer = setInterval(() => { capacityDue.current = true; measureRef.current() }, 600)
    return () => clearInterval(timer)
  }, [receiving, runId, effectiveMotion])

  useLayoutEffect(() => {
    const frame = frameRef.current, page = pageRef.current
    if (!frame || !page) return
    const observed = new Map<Element, { width: number; height: number }>()
    const observer = new ResizeObserver((entries) => {
      let changed = false
      for (const entry of entries) {
        const { width, height } = entry.contentRect, old = observed.get(entry.target)
        changed ||= !old || old.width !== width || (entry.target === page && old.height !== height)
        observed.set(entry.target, { width, height })
      }
      if (changed) measureRef.current()
    })
    observer.observe(frame); observer.observe(page)
    const fontsChanged = () => measureRef.current()
    document.fonts?.addEventListener('loadingdone', fontsChanged)
    let mounted = true
    void document.fonts?.ready.then(() => { if (mounted) fontsChanged() })
    return () => { mounted = false; observer.disconnect(); document.fonts?.removeEventListener('loadingdone', fontsChanged) }
  }, [frameRef, pageRef])
  useLayoutEffect(() => () => { cancelResize(); clearFallback(); measureRef.current = () => {} }, [cancelResize, clearFallback])
  return { ...surface, advanceWaitingField, finishHandover }
}

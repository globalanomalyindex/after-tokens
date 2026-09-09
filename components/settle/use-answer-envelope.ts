'use client'

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { estimateAnswerEnvelope, estimateCandidateEnvelope, MIN_ANSWER_ROWS } from '@/lib/settle/answer-envelope'
import type { SettleState } from '@/lib/settle/types'

export type AnswerPhase = 'waiting' | 'fitting' | 'ready'
type Options = {
  state: SettleState
  runId: string | number
  frameRef: RefObject<HTMLDivElement | null>
  pageRef: RefObject<HTMLDivElement | null>
  effectiveMotion: boolean
}
type Envelope = {
  rowCount: number
  lineHeightPx: number
  barHeightPx: number
  phase: AnswerPhase
  arrivalKey: string | null
}

const WAITING_RESIZE_MS = 380
const FINAL_FIT_MS = 180

/** Keeps estimated space causal while the source is incomplete. At valid
 * finality, actual page geometry replaces the estimate. An under-sized frame
 * can hold visual arrival for one authored 180 ms fit, never for a breath or
 * model step. Browser scheduling can extend elapsed wall time; measure that
 * separately from this authored duration. No reducer/source time is changed. */
export function useAnswerEnvelope({ state, runId, frameRef, pageRef, effectiveMotion }: Options) {
  const [envelope, setEnvelope] = useState<Envelope>({
    rowCount: MIN_ANSWER_ROWS, lineHeightPx: 24, barHeightPx: 14.4,
    phase: 'waiting', arrivalKey: null,
  })
  const animation = useRef<Animation | null>(null)
  const operation = useRef(0)
  const identity = useRef<string | null>(null)
  const completed = useRef(false)
  const pendingFit = useRef(false)
  const maximumRows = useRef(MIN_ANSWER_ROWS)
  const sizingContext = useRef('')
  const lastTarget = useRef<number | null>(null)
  const measureRef = useRef<() => void>(() => {})
  const canvas = useRef<CanvasRenderingContext2D | null>(null)
  const dismissArrival = useCallback(() => setEnvelope((current) => current.arrivalKey === null ? current : { ...current, arrivalKey: null }), [])

  const cancelAnimation = useCallback(() => {
    operation.current += 1
    animation.current?.cancel()
    animation.current = null
  }, [])

  useLayoutEffect(() => {
    measureRef.current = () => {
      const frame = frameRef.current
      const page = pageRef.current
      if (state.policy !== 'answer') { cancelAnimation(); pendingFit.current = false; return }
      if (!frame || !page) return
      const key = `${String(runId)}:v${state.version}`
      const changedRun = identity.current !== key
      if (changedRun) {
        cancelAnimation()
        identity.current = key
        completed.current = false
        pendingFit.current = false
        maximumRows.current = MIN_ANSWER_ROWS
        sizingContext.current = ''
        lastTarget.current = null
      }
      const style = getComputedStyle(page)
      const fontSize = parseFloat(style.fontSize) || 16
      const lineHeightPx = parseFloat(style.lineHeight) || fontSize * 1.5
      const barHeightPx = fontSize * .9
      if (changedRun) {
        frame.style.height = `${MIN_ANSWER_ROWS * lineHeightPx}px`
        lastTarget.current = MIN_ANSWER_ROWS * lineHeightPx
        setEnvelope({ rowCount: MIN_ANSWER_ROWS, lineHeightPx, barHeightPx, phase: 'waiting', arrivalKey: null })
      }
      const width = page.getBoundingClientRect().width || frame.getBoundingClientRect().width
      const font = `${style.fontStyle || 'normal'} ${style.fontWeight || '400'} ${fontSize}px ${style.fontFamily || 'sans-serif'}`
      const context = `${Math.round(width * 2) / 2}:${font}:${lineHeightPx}:${style.letterSpacing}`
      if (sizingContext.current !== context) {
        sizingContext.current = context
        maximumRows.current = MIN_ANSWER_ROWS
      }

      const resize = (target: number, duration: number, done?: () => void) => {
        const currentHeight = frame.getBoundingClientRect().height
        cancelAnimation()
        const serial = operation.current
        lastTarget.current = target
        frame.style.height = `${target}px`
        if (!effectiveMotion || duration <= 0 || Math.abs(currentHeight - target) <= 1 || typeof frame.animate !== 'function') {
          done?.()
          return
        }
        const next = frame.animate([{ height: `${currentHeight}px` }, { height: `${target}px` }], {
          duration, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both',
        })
        animation.current = next
        next.onfinish = () => {
          if (serial !== operation.current || identity.current !== key) return
          animation.current = null
          next.cancel()
          done?.()
        }
      }

      const receiving = state.status === 'waiting' || state.status === 'receiving'
      if (receiving) {
        if (!canvas.current && typeof CanvasRenderingContext2D !== 'undefined') canvas.current = document.createElement('canvas').getContext('2d')
        const textContext = canvas.current
        if (textContext) { textContext.font = font; textContext.fontKerning = 'none' }
        const letterSpacing = parseFloat(style.letterSpacing) || 0
        const measureAdvance = (text: string) =>
          (textContext ? textContext.measureText(text).width : Array.from(text).length * fontSize * .52)
          + Math.max(0, Array.from(text).length - 1) * letterSpacing
        // Source modes remain distinct: a whole candidate can size reserved
        // space without becoming a committed token or visible answer text.
        const estimate = state.source === 'snapshot'
          ? estimateCandidateEnvelope(state.snapshotCandidate ?? '', width, measureAdvance)
          : estimateAnswerEnvelope(state, width, measureAdvance)
        maximumRows.current = Math.max(maximumRows.current, estimate.rowCount)
        const rowCount = maximumRows.current
        const target = rowCount * lineHeightPx
        setEnvelope((current) => current.rowCount === rowCount && current.lineHeightPx === lineHeightPx && current.barHeightPx === barHeightPx && current.phase === 'waiting' && current.arrivalKey === null
          ? current : { rowCount, lineHeightPx, barHeightPx, phase: 'waiting', arrivalKey: null })
        if (!effectiveMotion && animation.current) resize(target, 0)
        else if (lastTarget.current !== target) resize(target, WAITING_RESIZE_MS)
        return
      }

      // A pending revision keeps the already-visible previous answer. Stop,
      // error and empty completion have no whole answer to reserve space for.
      const hasAnswer = (state.status === 'complete' || state.status === 'revision') && state.releasedLength > 0
      const target = hasAnswer ? page.getBoundingClientRect().height : 0
      const firstCompletion = !completed.current
      const ready = (withArrival: boolean) => {
        pendingFit.current = false
        completed.current = true
        setEnvelope((current) => ({ ...current, lineHeightPx, barHeightPx, phase: 'ready', arrivalKey: withArrival ? key : null }))
      }
      if (!effectiveMotion || !hasAnswer || state.status === 'revision') {
        resize(target, 0)
        ready(false)
        return
      }
      if (firstCompletion && !pendingFit.current) {
        const underAllocated = target - frame.getBoundingClientRect().height > 1
        if (underAllocated) {
          pendingFit.current = true
          setEnvelope((current) => ({ ...current, lineHeightPx, barHeightPx, phase: 'fitting', arrivalKey: null }))
          resize(target, FINAL_FIT_MS, () => ready(true))
        } else {
          ready(true)
          resize(target, FINAL_FIT_MS)
        }
      } else if (pendingFit.current) {
        // A width/font change during fitting must not restart the 180 ms
        // waiting budget. Jump to its new exact height and become ready.
        if (lastTarget.current !== target) { resize(target, 0); ready(true) }
      } else if (lastTarget.current !== target) {
        // A visible answer reflowing after resize remains readable; no second
        // completion accent or decorative delay is introduced.
        resize(target, 0)
      }
    }
    measureRef.current()
  }, [state, runId, effectiveMotion, frameRef, pageRef, cancelAnimation])

  useLayoutEffect(() => {
    const frame = frameRef.current
    const page = pageRef.current
    if (!frame || !page || state.policy !== 'answer') return
    const observed = new Map<Element, { width: number; height: number }>()
    const observer = new ResizeObserver((entries) => {
      let meaningfulChange = false
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        const previous = observed.get(entry.target)
        // The frame's own animated height is an output, not new sizing
        // evidence. Page dimensions remain natural layout measurements even
        // while its child text has the separate arrival translation.
        meaningfulChange ||= !previous || previous.width !== width
          || (entry.target === page && previous.height !== height)
        observed.set(entry.target, { width, height })
      }
      if (meaningfulChange) measureRef.current()
    })
    observer.observe(frame)
    observer.observe(page)
    const fontsChanged = () => { sizingContext.current = ''; measureRef.current() }
    document.fonts?.addEventListener('loadingdone', fontsChanged)
    let mounted = true
    void document.fonts?.ready.then(() => { if (mounted) fontsChanged() })
    return () => {
      mounted = false
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', fontsChanged)
    }
  }, [frameRef, pageRef, state.policy])

  useLayoutEffect(() => () => {
    cancelAnimation()
    measureRef.current = () => {}
  }, [cancelAnimation])

  return { ...envelope, dismissArrival }
}

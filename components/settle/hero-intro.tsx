'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import type { Replay } from '@/lib/settle/types'
import { SettleAnswer } from './settle-answer'
import { useReplay } from './use-replay'
import styles from './hero-intro.module.css'

const QUESTION = 'What should diffusion text rendering look like?'
const WELCOME = 'It should look like this.\nWelcome to after tokens.'
// This is prewritten choreography. These times are not a model recording,
// estimated latency, or a signal that can finalize a real source.
const LETTER_TIMES = [...QUESTION].reduce<number[]>((times, letter, index) => {
  const previous = times.at(-1) ?? 180
  const phrasePause = QUESTION.slice(0, index).endsWith('diffusion') ? 150 : QUESTION.slice(0, index).endsWith('rendering') ? 110 : 0
  times.push(previous + 44 + (letter === ' ' ? 24 : 0) + phrasePause)
  return times
}, [])
const REPLY_AT_MS = LETTER_TIMES.at(-1)! + 400
const FINAL_AT_MS = REPLY_AT_MS + 2100
const INTRO: Replay = {
  id: 'authored-hero-introduction', label: 'An introduction to After Tokens',
  provenance: 'Prewritten motion introduction; all timings are authored, not live inference.',
  durationMs: FINAL_AT_MS,
  events: [{ type: 'snapshot', atMs: FINAL_AT_MS, final: true, text: WELCOME }],
}
const STATIC_ANSWER = reduceSettle(createSettleState('sentence'), INTRO.events[0]!)

/** A once-through editorial introduction using the same answer renderer as
 * the case study. Only the prompt types; the answer is one final snapshot. */
export function HeroIntro() {
  const root = useRef<HTMLElement>(null)
  const [hydrated, setHydrated] = useState(false)
  const [inView, setInView] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(true)
  const [manualPause, setManualPause] = useState(false)
  const [showStatic, setShowStatic] = useState(false)
  const [visualReady, setVisualReady] = useState(false)
  const reduced = usePrefersReducedMotion()
  const clock = useReplay(INTRO, { policy: 'sentence', autoplay: false })
  const { play, pause } = clock
  const staticView = hydrated && (reduced || showStatic)
  const paused = !hydrated || manualPause || !inView || !documentVisible
  const active = !paused && !staticView && !clock.finished

  useEffect(() => {
    setHydrated(true)
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), { threshold: .15 })
    if (root.current) observer.observe(root.current)
    const visibility = () => setDocumentVisible(document.visibilityState !== 'hidden')
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => {
    if (active) play()
    else pause()
  }, [active, play, pause])

  const typed = staticView ? QUESTION : QUESTION.slice(0, LETTER_TIMES.filter((at) => at <= clock.elapsedMs).length)
  const replyVisible = staticView || clock.elapsedMs >= REPLY_AT_MS
  const complete = staticView || clock.finished
  const replay = () => { setVisualReady(false); setShowStatic(false); setManualPause(false); clock.restart() }

  return (
    <figure ref={root} className={styles.root} data-hero-intro data-elapsed-ms={Math.round(clock.elapsedMs)} data-static={staticView} data-paused={paused || staticView}>
      <p className="sr-only" data-hero-transcript>Question: {QUESTION} Answer: {WELCOME}</p>
      <div className={styles.canvas} aria-hidden="true" data-demo>
        <div className={styles.topline}><span>after tokens</span><span>a motion study</span></div>
        <div className={styles.conversation}>
          <div className={styles.prompt}>
            <span className={styles.promptSpace}>{QUESTION}</span>
            <span className={styles.promptInk}><span data-hero-typed>{typed}</span>{!complete && typed.length < QUESTION.length && <span className={styles.cursor} />}</span>
          </div>
          <div className={styles.answerSpace}>
            {replyVisible && <div key={clock.runId} className={styles.reply} data-static={staticView} data-ready={staticView || visualReady}>
              <span className={styles.replyLabel}>after tokens</span>
              <SettleAnswer state={staticView ? STATIC_ANSWER : clock.state} runId={`hero:${clock.runId}`} ambient="reshape" motion={!staticView} paused={paused} status={false} announce={false} onVisualReady={setVisualReady} label="introductory welcome" className={styles.answer} />
            </div>}
          </div>
        </div>
        <noscript><div className={styles.noScript}><p>{QUESTION}</p><p>{WELCOME}</p></div></noscript>
      </div>
      <figcaption className={styles.caption}>
        <span className="readout" style={{ color: 'var(--muted)' }}>an authored motion introduction · prewritten words</span>
        {reduced ? <span className="readout" style={{ color: 'var(--muted)' }}>reduced motion · full exchange shown</span> : <div className={styles.controls}>
          <button type="button" className="replay-btn replay-btn-on-surface" disabled={complete} onClick={() => setManualPause((value) => !value)}>{manualPause ? 'resume intro' : 'pause intro'}</button>
          <button type="button" className="replay-btn replay-btn-on-surface" onClick={replay}>replay intro</button>
          <button type="button" className="replay-btn replay-btn-on-surface" disabled={staticView} onClick={() => setShowStatic(true)}>show welcome</button>
        </div>}
      </figcaption>
    </figure>
  )
}

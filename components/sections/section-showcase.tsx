'use client'

import { useEffect, useRef, useState } from 'react'
import { Section } from '@/components/section'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { useReplay } from '@/components/settle/use-replay'
import { BrandProvider } from '@/lib/brand/provider'
import { SHOWCASE_REPLAY } from '@/lib/settle/showcase-replay'
import type { Policy } from '@/lib/settle/types'
import styles from './section-showcase.module.css'

/** One source and one presentation clock feed both visible panels. */
export function SectionShowcase() {
  const [policy, setPolicy] = useState<Policy>('sentence')
  const [inView, setInView] = useState(false)
  const [documentVisible, setDocumentVisible] = useState(true)
  const [userPaused, setUserPaused] = useState(false)
  const [visualReady, setVisualReady] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  // Autoplay remains constant: changing viewport visibility must not reset
  // useReplay. Explicit play/pause preserves elapsed time and run identity.
  const clock = useReplay(SHOWCASE_REPLAY, { policy, autoplay: false, runKey: policy })
  const { finished, play, pause, runId } = clock
  const active = inView && documentVisible
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry?.isIntersecting ?? false), { threshold: .12 })
    if (stageRef.current) observer.observe(stageRef.current)
    const visibility = () => setDocumentVisible(document.visibilityState !== 'hidden')
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  useEffect(() => {
    if (active && !userPaused && !finished) play()
    else pause()
  }, [active, userPaused, policy, finished, play, pause, runId])

  const replay = () => { setUserPaused(false); setVisualReady(false); clock.restart() }
  const selectPolicy = (next: Policy) => { setUserPaused(false); setVisualReady(false); setPolicy(next) }
  const paused = userPaused || !active || clock.paused
  const state = clock.state
  const progress = visualReady ? 'ready to read' : clock.finished ? 'settling into place' : clock.elapsedMs === 0 && paused ? 'ready when you are' : paused ? 'paused' : 'taking shape'

  return (
    <Section id="showcase" title="Live motion comparison" className={styles.section}>
      <div className={styles.heading}>
        <div>
          <p className={`label ${styles.eyebrow}`}>see it in motion</p>
          <h2>same words.<br />a different arrival.</h2>
        </div>
        <p className={styles.introduction}>A little life in the wait.<br />A complete thought when it arrives.</p>
      </div>
      <div ref={stageRef} data-showcase data-elapsed-ms={Math.round(clock.elapsedMs)} data-running={clock.running} data-policy={policy} data-source={SHOWCASE_REPLAY.id}>
        <div className={styles.toolbar}>
          <fieldset className={styles.policies}>
            <legend className="sr-only">Showcase reading style</legend>
            {([{ id: 'sentence', label: 'Each sentence' }, { id: 'answer', label: 'Whole answer' }] as const).map((item) => (
              <label key={item.id} className={styles.choice}>
                <input type="radio" name="showcase-policy" value={item.id} checked={policy === item.id} onChange={() => selectPolicy(item.id)} />
                <span>{item.label}</span>
              </label>
            ))}
          </fieldset>
          <div className={styles.controls}>
            <button type="button" disabled={clock.finished} onClick={() => setUserPaused((value) => !value)} aria-label={userPaused ? 'resume live comparison' : 'pause live comparison'}>
              <span aria-hidden="true">{userPaused ? '▷' : 'Ⅱ'}</span>{userPaused ? 'resume' : 'pause'}
            </button>
            <button type="button" onClick={replay} aria-label="replay live comparison"><span aria-hidden="true">↻</span>replay</button>
          </div>
        </div>
        <BrandProvider brand="after-tokens" className={`stage ${styles.stage}`} data-demo>
          <div className={styles.prompt}><span aria-hidden="true">↳</span>{SHOWCASE_REPLAY.label}</div>
          <div className={styles.panels}>
            <div className={styles.panel}>
              <header className={styles.panelHeading}><h3>after tokens</h3><span className={styles.signature}>Reshape</span></header>
              <SettleAnswer state={state} runId={`showcase:${clock.runId}`} ambient="reshape" motion={!clock.reducedMotion} paused={paused}
                status={true} progress={clock.progress} announce={false} label="After Tokens live answer" onVisualReady={setVisualReady} className={styles.answer} />
            </div>
            <div className={`${styles.panel} ${styles.rawPanel}`}>
              <header className={styles.panelHeading}><h3>the raw prefix</h3><span>same source</span></header>
              <p className={styles.raw} role="region" aria-label="Raw committed prefix" aria-live="off" data-showcase-prefix>
                {state.prefix.slice(0, state.wordSafeLength)}
                {state.prefix.length > state.wordSafeLength && <mark>{state.prefix.slice(state.wordSafeLength)}</mark>}
                {!state.prefix && <span className={styles.empty}>waiting for the first fragment</span>}
              </p>
              <div className="settle-margin readout"><span>{clock.finished ? 'complete' : paused ? 'paused' : 'receiving'}</span></div>
            </div>
          </div>
          <div className={styles.stageFooter}><span>{progress}</span><span>one shared clock</span></div>
        </BrandProvider>
        <div className={styles.caption}>
          <p>Illustrative reply · authored timing. Percentages track demo playback.</p>
          <p>Raw fragments appear immediately. After Tokens waits for the selected boundary.</p>
        </div>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{visualReady ? 'The illustrative comparison is complete.' : paused && clock.elapsedMs === 0 ? 'The illustrative comparison is ready to play.' : paused ? 'The illustrative comparison is paused.' : 'An illustrative reply is playing in both panels.'}</p>
      </div>
    </Section>
  )
}

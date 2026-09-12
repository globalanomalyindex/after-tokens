'use client'

import { useEffect, useMemo, useState } from 'react'
import { BrandProvider } from '@/lib/brand/provider'
import type { BrandId } from '@/lib/brand/types'
import type { Policy } from '@/lib/settle/types'
import type { TraceCompact } from '@/lib/diffusion/traces'
import { loadTrace } from '@/lib/traces/index'
import { replayTrace } from '@/lib/settle/replay'
import { DEMO_REPLAYS } from '@/lib/settle/fixtures'
import { SHOWCASE_REPLAY } from '@/lib/settle/showcase-replay'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { useReplay } from '@/components/settle/use-replay'
import type { AmbientCondition } from '@/components/settle/ambient-composition'
import styles from './presentation.module.css'

type Props = { policy?: Policy; compare?: boolean; brands?: boolean; conditions?: boolean; recorded?: boolean; example?: string }
const VOICES = ['spectrum', 'after-tokens', 'felt', 'pulse'] as const
type PresentationVoice = typeof VOICES[number]
const POLICIES: Array<{ id: Policy; label: string }> = [
  { id: 'sentence', label: 'each sentence' }, { id: 'word', label: 'each word' },
  { id: 'paragraph', label: 'each paragraph' }, { id: 'answer', label: 'whole answer' },
]

export function PresentationDemo({ policy: initialPolicy = 'sentence', compare = false, brands = false, conditions = false, recorded = false, example = 'showcase' }: Props) {
  const [policy, setPolicy] = useState(initialPolicy)
  const [brand, setBrand] = useState<PresentationVoice>(brands ? 'spectrum' : 'after-tokens')
  const [cycling, setCycling] = useState(true)
  const [condition, setCondition] = useState<AmbientCondition>('reshape')
  const [manualPause, setManualPause] = useState(false)
  const [visible, setVisible] = useState(true)
  const [trace, setTrace] = useState<TraceCompact | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!recorded) return
    let cancelled = false
    setError(false)
    loadTrace('travel__lowconf-b32').then(value => { if (!cancelled) setTrace(value) }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [recorded, attempt])
  const source = useMemo(() => recorded ? trace ? replayTrace(trace, 'recorded') : null : example === 'showcase' ? SHOWCASE_REPLAY : DEMO_REPLAYS.find(item => item.id === example) ?? SHOWCASE_REPLAY, [recorded, trace, example])
  const clock = useReplay(source, { policy, autoplay: true, runKey: `${policy}:${brand}:${condition}` })
  const { play, pause, finished } = clock
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== 'hidden')
    update(); document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => { if (visible && !manualPause && !finished) play(); else pause() }, [visible, manualPause, finished, play, pause])
  useEffect(() => {
    if (!brands || !cycling || !visible || manualPause || clock.reducedMotion || !finished) return
    const timer = window.setTimeout(() => setBrand(value => VOICES[(VOICES.indexOf(value) + 1) % VOICES.length]!), 2400)
    return () => window.clearTimeout(timer)
  }, [brands, cycling, visible, manualPause, clock.reducedMotion, finished, brand])
  const paused = manualPause || !visible || clock.paused
  const restart = () => { setManualPause(false); clock.restart() }
  const palette = brands && brand !== 'after-tokens' && brand !== 'spectrum'
  const providerBrand: BrandId = brand === 'spectrum' ? 'after-tokens' : brand
  return <div className={styles.demo} data-presentation-demo data-example={recorded ? "travel__lowconf-b32" : example} data-voice={brand} data-cycling={cycling && !clock.reducedMotion} data-policy={policy} data-elapsed-ms={Math.round(clock.elapsedMs)}>
    <div className={styles.demoControls}>
      <label className={styles.selectLabel}>the page takes
        <select aria-label="The page takes" value={policy} onChange={e => { setManualPause(false); setPolicy(e.target.value as Policy) }}>
          {POLICIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <div className={styles.playControls}>
        <button type="button" disabled={!source || finished} onClick={() => setManualPause(value => !value)} aria-label={manualPause ? 'Resume example' : 'Pause example'}>{manualPause ? 'resume' : 'pause'}</button>
        <button type="button" disabled={!source} onClick={restart} aria-label="Replay example">replay ↺</button>
      </div>
    </div>
    {brands && <div className={styles.options} role="group" aria-label="Brand voice">
      {VOICES.map(id => <button key={id} type="button" aria-pressed={brand === id} onClick={() => { setCycling(false); setBrand(id) }}>{id === 'after-tokens' ? 'after tokens' : id}</button>)}
      <button type="button" disabled={clock.reducedMotion} aria-label={cycling ? 'Pause brand cycle' : 'Resume brand cycle'} onClick={() => setCycling(value => !value)}>{clock.reducedMotion ? 'manual · reduced motion' : cycling ? 'pause cycle' : 'resume cycle'}</button>
    </div>}
    {conditions && <div className={styles.options} role="group" aria-label="Waiting motion">
      {(['static', 'breathe', 'reshape'] as const).map(id => <button key={id} type="button" aria-pressed={condition === id} onClick={() => setCondition(id)}>{id === 'static' ? 'still' : id}</button>)}
    </div>}
    <div className={`${styles.demoPanels} ${compare ? styles.comparison : ''}`}>
      <BrandProvider brand={providerBrand} className={`${styles.replyCard} ${brand === 'spectrum' ? styles.spectrum : ''} ${palette ? 'frame' : 'stage'}`} data-glass data-after-tokens-reply
        style={{ background: palette ? 'var(--surface)' : 'rgba(255,255,255,.035)', color: palette ? 'var(--ink)' : 'var(--stage-text)' }}>
        {brand === 'spectrum' && <div className={styles.spectrumWash} aria-hidden="true" data-paused={paused} />}
        <div className={styles.replyHeader}><span>after tokens{brands ? ` · ${brand === 'after-tokens' ? 'original' : brand}` : ''}</span><span>{condition === 'static' ? 'still' : condition}</span></div>
        <div className={styles.answerScroll} data-slide-scroll tabIndex={0} role="region" aria-label="Scrollable After Tokens reply">
          {error ? <div className={styles.loadError}><p>The recording couldn’t be loaded.</p><button type="button" onClick={() => setAttempt(n => n + 1)}>try again</button></div>
            : <SettleAnswer state={clock.state} runId={clock.runId} progress={clock.progress} ambient={condition} motion={!clock.reducedMotion} paused={paused || !source} className={styles.answer} label="After Tokens example answer" />}
        </div>
      </BrandProvider>
      {compare && <div className={`${styles.replyCard} ${styles.baseline}`} data-raw-reply>
        <div className={styles.replyHeader}><span>the raw prefix</span><span>same source</span></div>
        <div className={styles.answerScroll} data-slide-scroll tabIndex={0} role="region" aria-label="Scrollable raw prefix">
          <p className={styles.raw} aria-label="Raw prefix example" role="region">{clock.state.prefix.slice(0, clock.state.wordSafeLength)}{clock.state.prefix.length > clock.state.wordSafeLength && <mark>{clock.state.prefix.slice(clock.state.wordSafeLength)}</mark>}{!clock.state.prefix && <span className={styles.rawWaiting}>waiting for the first fragment</span>}</p>
        </div>
      </div>}
    </div>
    <p className={styles.demoNote}>{recorded ? 'Train or plane · original model recording · unedited words · forward-pass timing.' : 'Illustrative reply · authored timing.'} Percentages track playback.</p>
  </div>
}

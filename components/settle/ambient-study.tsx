'use client'

import { useEffect, useMemo, useState } from 'react'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { useInView } from '@/components/motion/reveal'
import { EXPERIMENTS, replayExperiment, type ExperimentalTrace } from '@/lib/settle/experimental-recordings'
import { createSettleState, reduceSettle } from '@/lib/settle/reader'
import { SettleAnswer } from './settle-answer'
import { useReplay } from './use-replay'
import type { AmbientCondition } from './ambient-composition'
import { statusWords } from './margin'
import type { Policy } from '@/lib/settle/types'

const CONDITIONS: { id: AmbientCondition; title: string; description: string }[] = [
  { id: 'static', title: '01 · still', description: 'Rounded bars at a constant brightness.' },
  { id: 'breathe', title: '02 · breathe', description: 'Soft local breaths in a steady composition.' },
  { id: 'reshape', title: '03 · reshape', description: 'One capsule opens into longer bars. A few broad cells breathe and make room as the waiting area grows.' },
]

export function AmbientStudy() {
  const [source, setSource] = useState<string>('sleep')
  const [trace, setTrace] = useState<ExperimentalTrace | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [pace, setPace] = useState('recorded')
  const [motion, setMotion] = useState(true)
  const [earlier, setEarlier] = useState(false)
  const [condition, setCondition] = useState<AmbientCondition>('reshape')
  const [policy, setPolicy] = useState<Policy>('sentence')
  const [visualReady, setVisualReady] = useState(false)
  const choice = EXPERIMENTS.find((item) => item.id === source) ?? EXPERIMENTS[0]
  useEffect(() => {
    let cancelled = false
    setTrace(null)
    setLoadError(false)
    choice.load().then((module) => { if (!cancelled) setTrace(module.default as unknown as ExperimentalTrace) })
      .catch(() => { if (!cancelled) setLoadError(true) })
    return () => { cancelled = true }
  }, [choice])
  const replay = useMemo(() => trace ? replayExperiment(trace, pace === 'recorded' ? 'recorded' : { scale: .5 }) : null, [trace, pace])
  const { ref, inView } = useInView<HTMLDivElement>(.15)
  const clock = useReplay(replay, { policy, autoplay: inView, runKey: `${source}:${pace}:${policy}` })
  // This separate policy comparison never influences bar geometry or finality.
  const happened = useMemo(() => {
    if (!earlier || !replay) return 0
    let count = 0
    while (count < replay.events.length && replay.events[count]!.atMs <= clock.elapsedMs) count += 1
    return count
  }, [earlier, replay, clock.elapsedMs])
  const comparisonPolicy = policy === 'answer' ? 'sentence' : 'answer'
  const comparisonName = comparisonPolicy === 'answer' ? 'whole answer' : 'earlier sentences'
  const earlyState = useMemo(() => earlier && replay
    ? replay.events.slice(0, happened).reduce(reduceSettle, createSettleState(comparisonPolicy, replay.bound ?? null))
    : null, [earlier, replay, happened, comparisonPolicy])
  return (
    <div ref={ref} className="ambient-study" data-active-condition={condition} data-source-id={trace?.id ?? source} data-elapsed-ms={clock.elapsedMs} data-duration-ms={replay?.durationMs ?? 0}>
      <div className="grid gap-4 mb-6">
        <ToggleRail label="recording" items={EXPERIMENTS.map(({ id, label }) => ({ id, label }))} activeId={source} onSelect={setSource} />
        <ToggleRail label="clock" items={[{ id: 'recorded', label: 'observed clock' }, { id: 'half', label: '0.5× inspection' }]} activeId={pace} onSelect={setPace} />
        <ToggleRail label="the page takes" items={[{ id: 'sentence', label: 'each sentence' }, { id: 'answer', label: 'whole answer' }, { id: 'word', label: 'each word' }, { id: 'paragraph', label: 'each paragraph' }]} activeId={policy} onSelect={(value) => setPolicy(value as Policy)} />
      </div>
      <div className="ambient-study-controls flex items-center justify-between flex-wrap gap-4 rule pt-4 mb-6 readout">
        <span>{(clock.elapsedMs / 1000).toFixed(1)} s · {pace === 'recorded' ? 'observed capture-loop replay' : 'half-speed inspection'}</span>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="replay-btn replay-btn-on-surface cursor-pointer" aria-pressed={!motion} onClick={() => setMotion((value) => !value)}>motion {motion ? 'on' : 'off'}</button>
          <button type="button" className="replay-btn replay-btn-on-surface cursor-pointer" onClick={clock.running ? clock.pause : clock.play} disabled={clock.finished || !replay}>{clock.running ? 'pause all' : 'resume all'}</button>
          <button type="button" className="replay-btn replay-btn-on-surface cursor-pointer" onClick={clock.seekToEnd} disabled={clock.finished || !replay}>to the end</button>
          <button type="button" className="replay-btn replay-btn-on-surface cursor-pointer" onClick={clock.restart} disabled={!replay}>replay all</button>
        </div>
      </div>
      <p className="text-base mb-5" style={{ color: 'var(--ink-2)' }}>{trace?.prompt ?? (loadError ? 'The recording could not be loaded. Choose another recording to retry.' : 'Loading the recorded source…')}</p>
      <div className="mb-5">
        <ToggleRail label="motion study" items={[{ id: 'static', label: 'still' }, { id: 'breathe', label: 'breathe' }, { id: 'reshape', label: 'reshape' }]} activeId={condition} onSelect={(id) => { setCondition(id as AmbientCondition); clock.restart() }} />
        <p className="readout mt-3 leading-relaxed" style={{ color: 'var(--muted)' }}>reshape is the default. choose still or breathe to compare the same source and release policy</p>
      </div>
      <div className="grid gap-5 max-w-3xl items-start">
        {CONDITIONS.filter((item) => item.id === condition).map((item) => <figure key={item.id} className="min-w-0 m-0">
          <figcaption className="mb-3">
            <h3 className="text-base font-semibold">{item.title}</h3>
            <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--ink-2)' }}>{item.description}</p>
          </figcaption>
          <div className="stage p-5" data-demo>
            <SettleAnswer state={clock.state} runId={clock.runId} ambient={item.id} motion={motion} paused={clock.paused || !trace} announce={false} onVisualReady={condition === item.id ? setVisualReady : undefined} label={`answer · ${item.id}`} className="text-[15px] leading-relaxed" />
          </div>
        </figure>)}
      </div>
      <p className="readout leading-relaxed mt-5" style={{ color: 'var(--muted)' }}>Qwen diffusion 0.6B · 128 requested positions · 32 recorded evaluations · four commitments per evaluation, including end tokens. {clock.state.status === 'complete' ? choice.note : 'Unedited model output; this annotated demonstration includes quality failures.'}</p>
      <div className="rule mt-8 pt-5">
        <button type="button" className="replay-btn replay-btn-on-surface cursor-pointer" aria-expanded={earlier} aria-controls="ambient-earlier-comparison" onClick={() => setEarlier((value) => !value)}>{earlier ? 'hide comparison' : `compare ${comparisonName}`}</button>
        {earlyState && <div id="ambient-earlier-comparison" className="mt-5">
          <p className="text-sm leading-relaxed mb-4 max-w-2xl" style={{ color: 'var(--ink-2)' }}>The same source clock, with {comparisonPolicy === 'answer' ? 'the whole answer held until source finality' : 'each eligible sentence released earlier'}. This compares availability; it does not isolate the effect of ambient motion.</p>
          <div className="stage p-5"><SettleAnswer state={earlyState} runId={clock.runId} ambient="reshape" motion={motion} paused={clock.paused} announce={false} label={comparisonName} className="text-[15px] leading-relaxed" /></div>
        </div>}
      </div>
      <p className="settle-sr" role="status" aria-live="polite" aria-atomic="true">{clock.state.status === 'complete' && !visualReady ? 'answer received · settling into place' : statusWords(clock.state, clock.paused, false)}</p>
    </div>
  )
}

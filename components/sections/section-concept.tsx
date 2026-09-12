'use client'

import { useEffect, useMemo, useState } from 'react'
import { Section } from '@/components/section'
import { Reveal, useInView } from '@/components/motion/reveal'
import { BrandProvider } from '@/lib/brand/provider'
import type { TraceCompact } from '@/lib/diffusion/traces'
import { replayTrace } from '@/lib/settle/replay'
import { loadTrace } from '@/lib/traces/index'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { useReplay } from '@/components/settle/use-replay'

// A secondary application of the web motion study inside a phone-sized
// browser composition. Context and optional interaction cues remain
// hypotheses; this frame is not a native mobile implementation.

const NOTES: { title: string; body: string }[] = [
  {
    title: 'an active area, without a predicted shape',
    body: 'a capsule opens into five breathing rows. occasional changes and deliberate rests give the area a quiet rhythm independent of the draft. the shapes do not map to actual words. after source finality, a short size fit can prepare missing room before the bubbles carry into the complete answer.',
  },
  {
    title: 'one readable arrival',
    body: 'the ambient composition continues between source events. after authoritative finality, a growing frame has an authored 180 ms fit before the text appears; browser scheduling can add more delay. visible bubbles then move toward measured word groups while the answer fades in and settles over 280 ms. this deliberately withholds words that could have been shown earlier; the delay is a presentation cost, not faster inference.',
  },
  {
    title: 'a tick under the thumb',
    body: 'this web concept requests a short vibration at the start of a visual handover, including a terminal field fade when all text is already visible, where the browser supports it. the same rule applies to whole-answer and earlier-passage modes. it does not implement a separate tap for every word. native iPhone haptics remain a separate design and engineering task; the browser concept makes no iPhone haptic claim.',
  },
  {
    title: 'space around the answer',
    body: 'a contextual tip occupies a separate area below the answer while it forms, then leaves when the source finishes. it is a secondary layout experiment: test whether the extra content helps or competes with the motion and reading. it does not cover the answer or claim a progress estimate.',
  },
  {
    title: 'readability beyond appearance',
    body: 'whether a visible process makes the wait feel better is a hypothesis. service-process research shows that perceived value can change with visible work, including negatively when results disappoint. the proposed reader study measures comfort and mistaken trust; more time spent watching is not a success criterion.',
  },
]

const TIPS = ['tip · ask for a shorter answer when you want the essentials', 'tip · compare the earlier-reading option to see the tradeoff', 'concept · a contextual tip can leave when the answer arrives']

export function SectionConcept() {
  const [run, setRun] = useState(0)
  const [motion, setMotion] = useState(true)
  const [trace, setTrace] = useState<TraceCompact | null>(null)
  useEffect(() => {
    let cancelled = false
    loadTrace('sky-blue__random-b32').then((t) => { if (!cancelled) setTrace(t) }).catch(() => {})
    return () => { cancelled = true }
  }, [])
  const replay = useMemo(() => (trace ? replayTrace(trace, 'recorded') : null), [trace])
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  const clock = useReplay(replay, { policy: 'answer', autoplay: inView, runKey: run })
  const waiting = clock.state.status === 'receiving' || clock.state.status === 'waiting'
  const tip = TIPS[run % TIPS.length]!
  return (
    <Section id="concept" title="The motion, in context">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">the motion, in context</h2>
      <p className="standfirst max-w-3xl">
        a secondary application of the web study, drawn inside a phone-sized browser frame. the same waiting material
        can sit beside a contextual tip and an optional interaction cue. this tests how the motion fits a larger interface;
        its effect on a reader remains unmeasured.
      </p>
      <p className="readout mt-4" style={{ color: 'var(--muted)' }}>application sketch · browser prototype · reader effects unmeasured</p>
      <div ref={ref} className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-start">
        <Reveal className="flex flex-col items-center">
          <BrandProvider brand="after-tokens" className="frame w-full max-w-[340px]" data-demo style={{ borderRadius: 32 }}>
            <div className="phone w-full" style={{ minHeight: 640 }}>
              <div className="frame-bar" style={{ borderBottom: 'none' }}><span>9:41</span><span>assistant</span></div>
              <div className="flex flex-col gap-2.5 px-3.5 pb-4 pt-1" style={{ minHeight: 560 }}>
                <div className="self-end max-w-[88%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[14px] leading-snug" style={{ background: 'var(--surface-tint)', border: '0.6px solid color-mix(in oklab, var(--ink) 12%, transparent)' }}>
                  {trace?.prompt ?? 'Explain to a child why the sky is blue.'}
                </div>
                <div className="self-start w-[92%] max-w-[92%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[14px] leading-snug" style={{ background: 'color-mix(in oklab, var(--ink) 4%, transparent)', border: '0.6px solid color-mix(in oklab, var(--ink) 12%, transparent)' }}>
                  <SettleAnswer
                    state={clock.state}
                    runId={clock.runId}
                    focus={clock.focus}
                    paused={clock.paused}
                    motion={motion}
                    status={false}
                    haptics
                    label="assistant answer"
                    className="text-[14px] leading-snug"
                    style={{ ['--settle-released' as string]: 'var(--cobalt)' } as React.CSSProperties}
                  />
                </div>
                <div className="mt-auto flex flex-col gap-2.5">
                  <div className="concept-slot" data-shown={waiting} aria-hidden={!waiting}>
                    <p className="label mb-1" style={{ color: 'var(--muted)' }}>while it resolves</p>
                    <p className="text-[13px] leading-snug m-0" style={{ color: 'var(--ink-2)' }}>{tip}</p>
                  </div>
                  <div className="frame-input" aria-hidden="true"><span>Ask anything</span><span /></div>
                </div>
              </div>
            </div>
          </BrandProvider>
          <div className="order-first mb-3 flex flex-wrap items-baseline justify-between gap-3 w-full max-w-[340px]">
            <span className="text-sm" style={{ color: 'var(--ink-2)' }}>a phone, after tokens voice · the slot below the answer</span>
            <button type="button" className="replay-btn replay-btn-on-surface cursor-pointer" onClick={() => setMotion((value) => !value)} aria-pressed={!motion}>motion {motion ? 'on' : 'off'}</button>
            <button type="button" className="replay-btn replay-btn-on-surface cursor-pointer" onClick={clock.running ? clock.pause : clock.play} disabled={clock.finished}>{clock.running ? 'pause' : 'resume'}</button>
            <button type="button" onClick={() => setRun((k) => k + 1)} className="replay-btn replay-btn-on-surface cursor-pointer inline-flex items-center gap-1.5 shrink-0" style={{ color: 'var(--muted)' }} aria-label="Replay the phone">
              <span aria-hidden="true" className="replay-glyph">↻</span>
              replay
            </button>
          </div>
        </Reveal>
        <dl className="grid gap-7 rule pt-6">
          {NOTES.map((n, i) => (
            <Reveal key={n.title} delay={i * 60}>
              <dt className="text-base font-semibold">{n.title}</dt>
              <dd className="mt-1 text-base leading-relaxed max-w-[58ch]" style={{ color: 'var(--ink-2)' }}>{n.body}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </Section>
  )
}

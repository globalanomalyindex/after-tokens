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

// The wait as a product moment: a concept, drawn on a phone. While the
// answer resolves the reader is watching; a surface that is honest about
// the process can also carry the brand's voice, a tip, an offer, or a tick
// under the thumb. None of it is measured. It is the potential the surface
// opens, sketched so it can be tested.

const NOTES: { title: string; body: string }[] = [
  {
    title: 'the shape first',
    body: 'the reservations show which source positions remain open. their geometry is an estimate, not a preview of final line lengths or list structure. candidate changes stay inside them; committed content can establish real breaks. the bubble keeps a fixed width while the source works.',
  },
  {
    title: 'a draft you can watch become the answer',
    body: 'fitting source drafts hold still in provisional ink while a persistent decorative breath marks the unresolved interval. complete committed words become readable immediately, with one small local response. several positions can develop together when the source supplies them together; no left-to-right ripple is added.',
  },
  {
    title: 'a tick under the thumb',
    body: 'this web concept requests a short vibration when a passage releases, where the browser supports it. it does not implement a separate tap for every word. native iPhone haptics remain a separate design and engineering task; the browser concept makes no iPhone haptic claim.',
  },
  {
    title: 'the slot',
    body: 'while an answer resolves the bottom of the screen is empty and the reader is waiting. that space can hold a tip, a step of onboarding, or a sponsored card in the brand’s voice. it appears with the wait and leaves with the answer, never covers the page, and never claims progress it cannot know.',
  },
  {
    title: 'time on app, with a guardrail',
    body: 'whether a visible process makes the wait feel better is a hypothesis. service-process research shows that perceived value can change with visible work, including negatively when results disappoint. the study measures comfort and mistaken trust; time on app is not a success criterion.',
  },
]

const TIPS = ['tip · ask for "shorter" and the answer comes back in one line', 'tip · you can stop an answer at any sentence and keep what settled', 'sponsored · a card in the brand’s voice would sit here, and leave with the answer']

export function SectionConcept() {
  const [run, setRun] = useState(0)
  const [trace, setTrace] = useState<TraceCompact | null>(null)
  useEffect(() => {
    let cancelled = false
    loadTrace('sky-blue__random-b32').then((t) => { if (!cancelled) setTrace(t) }).catch(() => {})
    return () => { cancelled = true }
  }, [])
  const replay = useMemo(() => (trace ? replayTrace(trace, 'recorded') : null), [trace])
  const { ref, inView } = useInView<HTMLDivElement>(0.3)
  const clock = useReplay(replay, { policy: 'sentence', autoplay: inView, runKey: run })
  const waiting = clock.state.status === 'receiving' || clock.state.status === 'waiting'
  const tip = TIPS[run % TIPS.length]!
  return (
    <Section id="concept" title="The wait as a product moment">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">the wait as a product moment</h2>
      <p className="standfirst max-w-3xl">
        a concept, drawn on a phone. while an answer resolves the reader is watching, and a surface that is honest
        about the process can also carry the brand&rsquo;s voice, a tip, an offer, or a tick under the thumb. none of
        this is measured. it is the potential the surface opens, sketched so it can be tested.
      </p>
      <p className="readout mt-4" style={{ color: 'var(--muted)' }}>concept · unmeasured · a sketch of potential, made to be tested</p>
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
          <div className="order-first mb-3 flex items-baseline justify-between gap-4 w-full max-w-[340px]">
            <span className="text-sm" style={{ color: 'var(--ink-2)' }}>a phone, after tokens voice · the slot below the answer</span>
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

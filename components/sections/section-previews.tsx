'use client'

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Section } from '@/components/section'
import { Reveal, useInView } from '@/components/motion/reveal'
import { BrandProvider } from '@/lib/brand/provider'
import type { BrandId } from '@/lib/brand/types'
import type { TraceCompact } from '@/lib/diffusion/traces'
import { replayTrace } from '@/lib/settle/replay'
import { loadTrace, type TraceId } from '@/lib/traces/index'
import { SettleAnswer } from '@/components/settle/settle-answer'
import { useReplay } from '@/components/settle/use-replay'

// The surface in three products it was designed for: a desktop assistant
// thread, a search answer, a phone. Each frame runs the reducer over a real
// recording on the brand's own surface and voice, in the system type an
// assistant actually uses. The answers are the model's, unedited.

type FrameProps = { title: string; brand: BrandId; traceId: TraceId; children: (answer: ReactNode, prompt: string, run: number) => ReactNode; delay?: number; tall?: boolean; released: string }

function Frame({ title, brand, traceId, children, delay = 0, tall = false, released }: FrameProps) {
  const [run, setRun] = useState(0)
  const [motion, setMotion] = useState(true)
  const [trace, setTrace] = useState<TraceCompact | null>(null)
  useEffect(() => {
    let cancelled = false
    loadTrace(traceId).then((t) => { if (!cancelled) setTrace(t) }).catch(() => {})
    return () => { cancelled = true }
  }, [traceId])
  const replay = useMemo(() => (trace ? replayTrace(trace, 'recorded') : null), [trace])
  const { ref, inView } = useInView<HTMLElement>(0.3)
  const clock = useReplay(replay, { policy: 'answer', autoplay: inView, runKey: run })
  const answer = (
    <SettleAnswer
      state={clock.state}
      runId={clock.runId}
      focus={clock.focus}
      paused={clock.paused}
      motion={motion}
      status={false}
      label="assistant answer"
      className="text-[14px] leading-snug"
      style={{ ['--settle-released' as string]: released } as CSSProperties}
    />
  )
  return (
    <Reveal as="figure" className="m-0 flex flex-col" delay={delay}>
      <BrandProvider brand={brand} className="frame flex-1 flex flex-col" data-demo style={{ minHeight: tall ? 560 : 440 }}>
        <figure ref={ref as never} className="m-0 flex-1 flex flex-col">{children(answer, trace?.prompt ?? '', run)}</figure>
      </BrandProvider>
      <figcaption className="order-first mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <span className="text-sm" style={{ color: 'var(--ink-2)' }}>{title}</span>
        <span className="flex items-center gap-3 flex-wrap">
        <button type="button" className="replay-btn replay-btn-on-surface cursor-pointer" onClick={() => setMotion((value) => !value)} aria-pressed={!motion}>motion {motion ? 'on' : 'off'}</button>
        <button type="button" className="replay-btn replay-btn-on-surface cursor-pointer" onClick={clock.running ? clock.pause : clock.play} disabled={clock.finished}>{clock.running ? 'pause' : 'resume'}</button>
        <button type="button" onClick={() => setRun((k) => k + 1)} className="replay-btn replay-btn-on-surface cursor-pointer inline-flex items-center gap-1.5 shrink-0" style={{ color: 'var(--muted)' }} aria-label={`Replay ${title}`}>
          <span aria-hidden="true" className="replay-glyph">↻</span>
          replay
        </button>
        </span>
      </figcaption>
    </Reveal>
  )
}

const bubble = (side: 'you' | 'assistant', children: ReactNode, key?: string | number) => (
  <div
    key={key}
    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug ${side === 'you' ? 'self-end rounded-br-md' : 'self-start w-[88%] rounded-bl-md'}`}
    style={{
      background: side === 'you' ? 'var(--surface-tint)' : 'color-mix(in oklab, var(--ink) 4%, transparent)',
      border: '0.6px solid color-mix(in oklab, var(--ink) 12%, transparent)',
    }}
  >
    {children}
  </div>
)

export function SectionPreviews() {
  return (
    <Section id="previews" title="In the wild">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">in the wild</h2>
      <p className="standfirst max-w-3xl">
        three contexts for the same web motion: a desktop assistant thread, a search answer, a phone-sized browser frame. each runs the
        reducer over a real recording on its brand&rsquo;s own surface and voice, in the system type an assistant
        actually uses. the answers are the model&rsquo;s, unedited, at the recorded forward-pass pace; the earlier
        turns in the thread are authored context.
      </p>
      <div className="mt-12 md:mt-16 grid gap-6 md:grid-cols-3 items-stretch">
        <Frame title="a desktop assistant, after tokens voice" brand="after-tokens" traceId="solder-project__lowconf-b128" released="var(--cobalt)">
          {(answer, prompt) => (
            <>
              <div className="frame-bar"><span>assistant · thread</span><span>today</span></div>
              <div className="flex flex-col gap-2.5 p-4 flex-1">
                {bubble('you', 'I got a soldering iron for my birthday. Where do I start?', 0)}
                {bubble('assistant', 'Tin the tip first and practice on scrap wire. A clean, hot tip is most of the skill.', 1)}
                {bubble('you', prompt || 'Name a good first project for learning to solder.', 'p')}
                {bubble('assistant', answer, 'a')}
                <div className="frame-input" aria-hidden="true"><span>Message</span><span /></div>
              </div>
            </>
          )}
        </Frame>
        <Frame title="a search answer, pulse voice" brand="pulse" traceId="why-out-of-order__lowconf-b32" delay={90} released="var(--accent)">
          {(answer, prompt) => (
            <>
              <div className="frame-bar"><span>search</span><span>answer</span></div>
              <div className="p-4 flex flex-col gap-4 flex-1">
                <div className="rounded-full px-4 py-2 text-[14px]" style={{ border: '0.8px solid color-mix(in oklab, var(--ink) 20%, transparent)' }}>
                  {(prompt || 'Why do diffusion models generate text out of order?').replace(/\?$/, '').toLowerCase()}
                </div>
                <div className="rounded-xl p-4" style={{ background: 'color-mix(in oklab, var(--accent) 16%, var(--surface))', border: '0.6px solid color-mix(in oklab, var(--accent) 45%, transparent)' }}>
                  <div className="label mb-2" style={{ color: 'var(--ink-2)' }}>answer</div>
                  {answer}
                </div>
                <ol className="flex flex-col gap-3 text-[13px]" aria-label="results">
                  <li className="flex flex-col"><span className="font-medium">Large language diffusion models</span><span className="readout" style={{ color: 'var(--muted)' }}>arxiv.org/abs/2502.09992</span></li>
                  <li className="flex flex-col"><span className="font-medium">Simple and effective masked diffusion language models</span><span className="readout" style={{ color: 'var(--muted)' }}>arxiv.org/abs/2406.07524</span></li>
                </ol>
              </div>
            </>
          )}
        </Frame>
        <Frame title="a phone, felt voice" brand="felt" traceId="sky-blue__lowconf-b128" delay={180} tall released="var(--accent)">
          {(answer, prompt) => (
            <div className="p-4 flex-1 flex items-start justify-center">
              <div className="phone w-full max-w-[300px]">
                <div className="frame-bar" style={{ borderBottom: 'none' }}><span>9:41</span><span>assistant</span></div>
                <div className="flex flex-col gap-2.5 px-3.5 pb-4 pt-1">
                  {bubble('you', prompt || 'Explain to a child why the sky is blue.', 'p')}
                  {bubble('assistant', answer, 'a')}
                  <div className="frame-input mt-3" aria-hidden="true"><span>Ask anything</span><span /></div>
                </div>
              </div>
            </div>
          )}
        </Frame>
      </div>
      <p className="mt-8 text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
        three surfaces, three voices, one whole-answer policy. a capsule opens into rows that breathe, occasionally change and rest within the text area. the waiting shapes have no token identity.
        the composition follows its own rhythm; after source finality, a brief fit can prepare missing room.
        the visible bubbles then reshape toward actual word groups as the answer fades in and settles over 280 ms. the recorded source has not been accelerated for the phone.
      </p>
    </Section>
  )
}

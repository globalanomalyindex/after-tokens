'use client'

import { useState, type ReactNode } from 'react'
import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { BrandProvider } from '@/lib/brand/provider'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import type { BrandId } from '@/lib/brand/types'

// The grammar in three products it was designed for and never shown in: a
// desktop assistant thread, a search answer, a phone. Each frame is the real
// engine on the brand's own surface and voice; nothing here is a picture.

const THREAD = {
  earlier: [
    { who: 'you', text: 'Two days in Lisbon in October. Warm enough for the beach?' },
    { who: 'assistant', text: 'Warm enough to sit on it. Water is around 18°C, so swimming is for the brave; afternoons reach the low twenties.' },
  ],
  prompt: 'Quick question. Should I take the train or fly?',
  answer: 'For under four hours of total travel, take the train. Door to door it usually wins, and you can actually work the whole way.',
}

const SEARCH = {
  query: 'why do diffusion models write out of order',
  answer:
    'A masked diffusion model starts with every position hidden and fills them in over many steps, committing wherever it is most confident. Nothing in the objective says left to right; the order is a property of the sampler, and the default schedule is what makes it look sequential.',
  results: [
    { title: 'Large language diffusion models', url: 'arxiv.org/abs/2502.09992' },
    { title: 'Simple and effective masked diffusion language models', url: 'arxiv.org/abs/2406.07524' },
  ],
}

const PHONE = {
  prompt: 'Give me a few wild ideas for naming a new color.',
  answer: 'Five to start with:\n1. Drift Cobalt\n2. Folded Mango\n3. Wet Slate at Dusk\n4. Lemon Static\n5. The blue your tongue tastes after biting a wire',
}

type FrameProps = { title: string; brand: BrandId; children: (run: number) => ReactNode; delay?: number; tall?: boolean }

function Frame({ title, brand, children, delay = 0, tall = false }: FrameProps) {
  const [run, setRun] = useState(0)
  return (
    <Reveal as="figure" className="m-0 flex flex-col" delay={delay}>
      <BrandProvider brand={brand} className="frame flex-1 flex flex-col" data-demo style={{ minHeight: tall ? 560 : 440 }}>
        {children(run)}
      </BrandProvider>
      <figcaption className="mt-3 flex items-baseline justify-between gap-4">
        <span className="text-sm" style={{ color: 'var(--ink-2)' }}>
          {title}
        </span>
        <button
          type="button"
          onClick={() => setRun((k) => k + 1)}
          className="replay-btn replay-btn-on-surface cursor-pointer inline-flex items-center gap-1.5 shrink-0"
          style={{ color: 'var(--muted)' }}
          aria-label={`Replay ${title}`}
        >
          <span aria-hidden="true" className="replay-glyph">↻</span>
          replay
        </button>
      </figcaption>
    </Reveal>
  )
}

const bubble = (side: 'you' | 'assistant', children: ReactNode, key?: string | number) => (
  <div
    key={key}
    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug ${side === 'you' ? 'self-end rounded-br-md' : 'self-start rounded-bl-md'}`}
    style={{
      // the sent bubble sits on the brand's tinted surface, which stays AA
      // against its ink on every preset (a light ink on a saturated surface
      // would lose contrast under a lightening mix)
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
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">how it would look</h2>
      <p className="standfirst max-w-3xl">
        the grammar in three products: a desktop assistant thread, a search answer, a phone. each frame runs the real
        engine on its brand&rsquo;s own surface and voice, in the system type an assistant actually uses. nothing here
        is a picture.
      </p>
      <div className="mt-12 md:mt-16 grid gap-6 md:grid-cols-3 items-stretch">
        <Frame title="a desktop assistant, after tokens voice" brand="after-tokens">
          {(run) => (
            <>
              <div className="frame-bar">
                <span>assistant · thread</span>
                <span>today</span>
              </div>
              <div className="flex flex-col gap-2.5 p-4 flex-1">
                {THREAD.earlier.map((m, i) => bubble(m.who as 'you' | 'assistant', m.text, i))}
                {bubble('you', THREAD.prompt, 'p')}
                {bubble(
                  'assistant',
                  <DiffusionText key={run} mode="crystal" trigger={run === 0 ? 'inView' : 'immediate'} topic={THREAD.prompt} className="text-[14px] leading-snug">
                    {THREAD.answer}
                  </DiffusionText>,
                  'a',
                )}
                <div className="frame-input" aria-hidden="true">
                  <span>Message</span>
                  <span />
                </div>
              </div>
            </>
          )}
        </Frame>
        <Frame title="a search answer, pulse voice" brand="pulse" delay={90}>
          {(run) => (
            <>
              <div className="frame-bar">
                <span>search</span>
                <span>answer</span>
              </div>
              <div className="p-4 flex flex-col gap-4 flex-1">
                <div
                  className="rounded-full px-4 py-2 text-[14px]"
                  style={{ border: '0.8px solid color-mix(in oklab, var(--ink) 20%, transparent)' }}
                >
                  {SEARCH.query}
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'color-mix(in oklab, var(--accent) 16%, var(--surface))', border: '0.6px solid color-mix(in oklab, var(--accent) 45%, transparent)' }}
                >
                  <div className="label mb-2" style={{ color: 'var(--ink-2)' }}>
                    answer
                  </div>
                  <DiffusionText key={run} mode="crystal" trigger={run === 0 ? 'inView' : 'immediate'} topic={SEARCH.query} className="text-[14px] leading-snug">
                    {SEARCH.answer}
                  </DiffusionText>
                </div>
                <ol className="flex flex-col gap-3 text-[13px]" aria-label="results">
                  {SEARCH.results.map((r) => (
                    <li key={r.url} className="flex flex-col">
                      <span className="font-medium">{r.title}</span>
                      <span className="readout" style={{ color: 'var(--muted)' }}>
                        {r.url}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </>
          )}
        </Frame>
        <Frame title="a phone, felt voice" brand="felt" delay={180} tall>
          {(run) => (
            <div className="p-4 flex-1 flex items-start justify-center">
              <div className="phone w-full max-w-[300px]">
                <div className="frame-bar" style={{ borderBottom: 'none' }}>
                  <span>9:41</span>
                  <span>assistant</span>
                </div>
                <div className="flex flex-col gap-2.5 px-3.5 pb-4 pt-1">
                  {bubble('you', PHONE.prompt, 'p')}
                  {bubble(
                    'assistant',
                    <DiffusionText key={run} mode="crystal" trigger={run === 0 ? 'inView' : 'immediate'} topic={PHONE.prompt} className="text-[14px] leading-snug">
                      {PHONE.answer}
                    </DiffusionText>,
                    'a',
                  )}
                  <div className="frame-input mt-3" aria-hidden="true">
                    <span>Ask anything</span>
                    <span />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Frame>
      </div>
      <p className="mt-8 text-base leading-relaxed max-w-[64ch]" style={{ color: 'var(--ink-2)' }}>
        three surfaces, three voices, one order. the phone answer is a list, so the skeleton lands first; the search
        answer opens on its nouns; the thread reads calm because two phrases is the most it ever holds open.
      </p>
    </Section>
  )
}

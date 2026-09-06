'use client'

import { useState } from 'react'
import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { ChatExchange } from '@/components/chat/chat-exchange'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { codaPrompts } from '@/lib/coda/fixtures'
import { TRACE_NUMBERS } from '@/lib/traces/findings'

// The first screen: the title locks in like a word, the argument in one
// line, and beside it the thing itself, a real answer crystallizing.
const HERO = codaPrompts.find((p) => p.id === 'heist-plot')!

export function SectionHook() {
  const [replay, setReplay] = useState(0)
  return (
    <Section id="hook" title="After tokens" className="pt-14 md:pt-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16 items-center">
        <div>
          <h1 className="hero-title m-0">
            <span className="hero-word" style={{ animationDelay: '120ms' }}>after</span>{' '}
            <span className="hero-word" style={{ animationDelay: '380ms' }}>tokens</span>
          </h1>
          <p className="standfirst mt-8 max-w-[34ch]">the same answer, arriving in a shape the mind pays out for.</p>
          <p className="mt-5 text-base leading-relaxed max-w-[52ch]" style={{ color: 'var(--ink-2)' }}>
            a product design and engineering case study on how text from a diffusion language model should reach
            a reader. one reveal grammar, specified by four properties from the psychology of reading and reward,
            measured against {TRACE_NUMBERS.trajectories}{' '}recorded sampler trajectories, and brand-able through a
            voice.
          </p>
          <dl className="mt-8 grid grid-cols-3 gap-6 max-w-md readout" style={{ color: 'var(--muted)' }}>
            <div>
              <dt className="label mb-1">role</dt>
              <dd style={{ color: 'var(--ink)' }}>product design, design engineering</dd>
            </div>
            <div>
              <dt className="label mb-1">year</dt>
              <dd style={{ color: 'var(--ink)' }}>2026</dd>
            </div>
            <div>
              <dt className="label mb-1">status</dt>
              <dd style={{ color: 'var(--ink)' }}>working prototype, study designed</dd>
            </div>
          </dl>
        </div>
        <Reveal delay={260} className="stage p-5 md:p-7 min-h-[420px] flex flex-col justify-center">
          <ChatExchange prompt={HERO.prompt} runKey={`hero-${replay}`}>
            <DiffusionText mode="crystal" trigger="immediate" topic={HERO.prompt} showStatus className="text-base md:text-lg leading-relaxed">
              {HERO.response}
            </DiffusionText>
          </ChatExchange>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => setReplay((k) => k + 1)}
              aria-label="Replay the answer"
              className="replay-btn cursor-pointer inline-flex items-center gap-1.5"
              style={{ color: 'color-mix(in oklab, var(--stage-text) 76%, transparent)' }}
            >
              <span aria-hidden="true" className="replay-glyph">↻</span>
              replay
            </button>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}

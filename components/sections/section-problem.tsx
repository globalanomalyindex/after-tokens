'use client'

import { Section } from '@/components/section'
import { ArrivalsTrio } from '@/components/arrival/arrivals-trio'
import { codaPrompts } from '@/lib/coda/fixtures'
import { TRACE_NUMBERS } from '@/lib/traces/findings'

const TRIO = codaPrompts.find((p) => p.id === 'travel')!

const BREAKS: { title: string; body: string }[] = [
  {
    title: 'the cursor',
    body: 'a blinking caret says more text is coming next, at one insertion point. a masked diffusion sampler can commit many positions in the same denoising step, anywhere in the answer.',
  },
  {
    title: 'the growing bubble',
    body: 'bubble height tracks emitted tokens, so a bubble that grows says this much is written. a diffusion answer has its whole extent from the start; the interface can reserve the surface at once.',
  },
  {
    title: 'partial-output trust',
    body: `streaming makes earlier text look committed. in the recorded runs the model's provisional guess for a position changed about ${TRACE_NUMBERS.flipsPerTokenLowconf.toFixed(1)} times before it committed, so a legible draft would show most words wrong before showing them right.`,
  },
]

export function SectionProblem() {
  return (
    <Section id="problem" title="The problem">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">same words, three arrivals</h2>
      <p className="standfirst max-w-3xl">
        a diffusion language model produces a whole answer and refines it in parallel. the words are fixed before the
        interface draws a single one, so the interface chooses the shape of the arrival. every chat product ships the
        typewriter. here are three shapes, on the same words and the same clock.
      </p>
      <div className="mt-12 md:mt-16">
        <ArrivalsTrio prompt={TRIO.prompt} answer={TRIO.response} />
      </div>
      <div className="mt-16 md:mt-24 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight max-w-md">the typewriter made three promises the sampler cannot keep</h3>
          <p className="mt-5 text-base leading-relaxed max-w-[48ch]" style={{ color: 'var(--ink-2)' }}>
            so the question is a design question. which arrival reads best, and how does a product own the answer&rsquo;s
            arrival without breaking it? the rest of the piece answers it in order: a way to measure an arrival, what a
            real sampler does, the grammar, its voice, and what would prove it wrong.
          </p>
        </div>
        <dl className="grid gap-6 rule pt-6">
          {BREAKS.map((b) => (
            <div key={b.title} className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="text-base font-semibold">{b.title}</dt>
              <dd className="text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {b.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}

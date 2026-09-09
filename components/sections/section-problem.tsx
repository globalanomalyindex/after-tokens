import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { TRACE_NUMBERS, CAUSAL } from '@/lib/traces/findings'
import { DefinitionTerm } from '@/components/chrome/definition-term'

// The problem, in three parts: what a diffusion sampler actually does, the
// two habits an interface inherits from the models before it, and why a
// fragment is the risky part of an answer.

const HABITS: { title: string; body: string }[] = [
  {
    title: 'the typewriter',
    body: 'one token at a time, left to right, a cursor at the end. this can give readers useful early text, but it can conceal out-of-order source activity and expose a half-word. it is a presentation policy with a cost, not a faithful diagram of every diffusion sampler.',
  },
  {
    title: 'the reveal that knows the answer',
    body: 'words ghost in and sharpen in a designed order. it looks like the process and it is a picture of the result: it needs the final words, their widths and a map of which matter, and a live source has none of those. this case study shipped one. the next chapter is its audit.',
  },
]

export function SectionProblem() {
  const pct = (x: number) => `${Math.round(x * 100)}%`
  return (
    <Section id="problem" title="The wrong shape">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">generation is not a typing performance</h2>
      <p className="standfirst max-w-3xl">
        a masked diffusion model predicts candidates at many open positions in a step. its sampler chooses which positions to{' '}
        <DefinitionTerm term="commitment">commit</DefinitionTerm>, sometimes within sequential blocks. prediction, commitment and a complete answer are different events. neither a typing cursor nor a choreographed reveal automatically explains them.
      </p>
      <div className="mt-12 md:mt-16 grid gap-10 md:grid-cols-2">
        {HABITS.map((h, i) => (
          <Reveal key={h.title} delay={i * 80} className="rule pt-6">
            <h3 className="text-2xl font-bold tracking-tight leading-tight">{h.title}</h3>
            <p className="mt-3 text-base leading-relaxed max-w-[52ch]" style={{ color: 'var(--ink-2)' }}>{h.body}</p>
          </Reveal>
        ))}
      </div>

      <div className="mt-16 md:mt-24 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">what a sampler actually does</h3>
          <p className="mt-4 text-base leading-relaxed max-w-[48ch]" style={{ color: 'var(--ink-2)' }}>
            {TRACE_NUMBERS.trajectories} runs of a {TRACE_NUMBERS.params} masked diffusion model were recorded, token by token, with the step each
            position committed. every original run used 128 steps for 128 positions: exactly one commitment per step. the new four-position batches are separate experiments. these observations describe this capture setup, not every diffusion model.
          </p>
        </div>
        <dl className="grid gap-6 sm:grid-cols-3 rule pt-6">
          <Reveal>
            <dt className="label mb-2">in blocks, mostly in order</dt>
            <dd className="text-3xl font-bold tracking-tighter font-display">{pct(TRACE_NUMBERS.adjacentFrac.lowconfB32)}</dd>
            <dd className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              of consecutive commits land beside the previous one under the block sampler. inside a block the order is free; a
              readable prefix can therefore grow in bursts when a missing earlier position becomes available. one new source token can unlock several already committed pieces.
            </dd>
          </Reveal>
          <Reveal delay={80}>
            <dt className="label mb-2">the end before the words</dt>
            <dd className="text-3xl font-bold tracking-tighter font-display">{pct(TRACE_NUMBERS.tailFirstFracNoBlock)}</dd>
            <dd className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              of usable schedule-free runs committed their eventual end-of-sequence tail before their last content token. this retrospective finding does not mean final formatting was known first, or that an isolated end token proves the whole answer is ready.
            </dd>
          </Reveal>
          <Reveal delay={160}>
            <dt className="label mb-2">a token is a piece</dt>
            <dd className="text-3xl font-bold tracking-tighter font-display">{pct(CAUSAL.multiStepShare)}</dd>
            <dd className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
              of the corpus&rsquo;s words are spelled across more than one commit. a surface that draws a word at its first piece is guessing
              the rest.
            </dd>
          </Reveal>
        </dl>
      </div>

      <figure className="stage mt-16 md:mt-24 p-6 md:p-10 m-0" data-demo>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="readout mb-4" style={{ color: 'color-mix(in oklab, var(--stage-text) 70%, transparent)' }}>the available prefix, at one moment</p>
            <p className="m-0 text-xl md:text-2xl leading-relaxed" style={{ fontFamily: 'var(--font-ui)' }}>The file can be deleted</p>
          </div>
          <div className="md:pl-8 md:border-l" style={{ borderColor: 'color-mix(in oklab, var(--stage-text) 18%, transparent)' }}>
            <p className="readout mb-4" style={{ color: 'color-mix(in oklab, var(--stage-text) 70%, transparent)' }}>the complete sentence</p>
            <p className="m-0 text-xl md:text-2xl leading-relaxed" style={{ fontFamily: 'var(--font-ui)' }}>
              The file can be deleted{' '}
              <span style={{ textDecoration: 'underline', textDecorationColor: 'color-mix(in oklab, var(--stage-text) 50%, transparent)', textUnderlineOffset: '0.22em', textDecorationThickness: '1px' }}>only after the backup has been verified.</span>
            </p>
          </div>
        </div>
        <figcaption className="readout mt-8 pt-6 leading-relaxed" style={{ color: 'color-mix(in oklab, var(--stage-text) 70%, transparent)', borderTop: '1px solid color-mix(in oklab, var(--stage-text) 18%, transparent)' }}>
          the risky part of an answer is the fragment. a condition can arrive later than the action it qualifies, and a reader who acts on the
          prefix acts on the wrong sentence. authored illustration; no model timing or reader outcome is implied.
        </figcaption>
      </figure>
    </Section>
  )
}

import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { DefinitionTerm } from '@/components/chrome/definition-term'

// The reading contract separates ambient appearance, release policy and source finality.

const RULES: string[] = [
  'released text requires source commitments or an explicitly final snapshot. the renderer does not read a hidden final answer, its widths, or a future formatting map.',
  'the whole-answer policy waits for source finality, then releases the exact answer together. a predicted period, guessed end token or animation endpoint cannot finish it.',
  'ambient bars are one authored composition. their shape does not encode token count, word widths, line breaks, confidence or percentage complete.',
  'earlier-word, sentence and paragraph policies remain available for comparison. complete words need committed pieces and boundaries; earlier access and whole-answer stillness carry different costs.',
  'the ambient composition hides intermediate candidate text. the inspectable source alternatives distinguish guesses, committed pieces and released passages. a guess never becomes released text merely because it looks plausible.',
  'a committed end token bounds the remaining positions; finality follows when the contiguous committed prefix reaches it, or a valid finish or final snapshot establishes the result. the motion has no vote.',
  'revisable snapshots stay off the page until one is explicitly final. a later revision keeps the prior page and offers a review and apply action.',
  'source complete, stopped, error, presentation paused and revision available are distinct. stopped or failed partial output is labeled separately, never celebrated as a complete answer.',
  'a brand can change material, color and motion. it cannot change source availability, finality or the exact answer, and readable text stays at its reading contrast.',
  'reduced motion and motion off remove decoration without changing the release timestamp. pause and replay respond immediately; hidden surfaces pause, and terminal states rest.',
]

const FINALITY: { dt: string; dd: string }[] = [
  { dt: 'when a source can revise everything', dd: 'a sampler that remasks committed tokens cannot promise a prefix. it sends snapshots instead, and nothing reaches the page until one is marked final. repeated identical drafts are not evidence of finality.' },
  { dt: 'when a later revision arrives', dd: 'the page a reader has already read stays. the replacement is reviewed and applied by the reader, and the previous version remains available. a change is never hidden inside motion.' },
  { dt: 'when generation ends another way', dd: 'source complete, source stopped and source error are different words in the margin. released text stays; unfinished text is held and said to be held. pausing this demonstration pauses a recording; it does not claim to stop a model.' },
  { dt: 'when a boundary is only evidence', dd: 'the earlier-sentence policy uses punctuation and whitespace heuristics, with code and list exceptions. that boundary does not prove semantic completeness or truth. whole-answer release instead requires the source finality contract.' },
]

export function SectionContract() {
  return (
    <Section id="contract" title="What the reader can count on">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">what the reader can count on</h2>
      <p className="standfirst max-w-3xl">
        given the same source events, policy, visual seed and presentation clock, the surface shows the same state, whatever comes later. the bars can move while the answer is held; only the source decides when it is complete.
      </p>
      <ol className="mt-12 md:mt-16 grid gap-x-12 gap-y-6 md:grid-cols-2 list-none m-0 p-0 rule pt-8">
        {RULES.map((rule, i) => (
          <Reveal as="li" key={rule} delay={i * 40} className="grid grid-cols-[2.2rem_1fr] gap-3 items-baseline">
            <span className="readout" style={{ color: 'var(--muted)' }}>{String(i + 1).padStart(2, '0')}</span>
            <span className="text-base leading-relaxed" style={{ color: 'var(--ink-2)' }} dangerouslySetInnerHTML={{ __html: rule }} />
          </Reveal>
        ))}
      </ol>

      <div className="mt-16 md:mt-24">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-3">four policies, one source</h3>
        <p className="text-base leading-relaxed max-w-[64ch] mb-8" style={{ color: 'var(--ink-2)' }}>
          the raw prefix shows in-order source pieces, including half-words. the comparison applies a release policy to those same events. the whole-answer option waits for finality; earlier policies expose useful text sooner. this is an availability comparison, separate from testing static, coherent and independent motion at identical answer timing. reading research, including <DefinitionTerm term="parafoveal preview">parafoveal preview</DefinitionTerm> and studies of unstable text, motivates preserving readable text. it does not prove that withholding it is better.
        </p>
        <SettleStage source="trace:hash-function__lowconf-b32" controls={['policy', 'preview']} comparison />
      </div>

      <div className="mt-16 md:mt-24 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">finality belongs to the source</h3>
        <dl className="grid gap-7">
          {FINALITY.map((row, i) => (
            <Reveal key={row.dt} delay={i * 60}>
              <dt className="text-base font-semibold">{row.dt}</dt>
              <dd className="mt-1 text-base leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>{row.dd}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </Section>
  )
}

import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { DefinitionTerm } from '@/components/chrome/definition-term'

// The reading contract separates ambient appearance, release policy and source finality.

const RULES: string[] = [
  'released text requires source commitments or an explicitly final snapshot. before source finality, the renderer cannot read future answer text, its widths or a future formatting map. after finality, it can measure the actual answer to fit the frame.',
  'the whole-answer policy waits for source finality. a separate authored 180 ms size fit may then delay complete visual availability when more room is needed. a predicted period, guessed end token or animation endpoint cannot complete the source.',
  'the small cells are authored shapes, not actual words. the waiting area estimates current committed content, or a current provisional snapshot if the source supplies one. a final-only source starts with five rows. none predicts final formatting, confidence or percent complete.',
  'earlier-word, sentence and paragraph policies remain available for comparison. complete words need committed pieces and boundaries; earlier access and whole-answer stillness carry different costs.',
  'the ambient composition hides intermediate candidate text. the inspectable source alternatives distinguish guesses, committed pieces and released passages. a guess never becomes released text merely because it looks plausible.',
  'a committed end token bounds the remaining positions; finality follows when the contiguous committed prefix reaches it, or a valid finish or final snapshot establishes the result. the motion has no vote.',
  'revisable snapshot words stay off the protected page until one is explicitly final; their current size may prepare space without becoming a commitment. a later revision keeps the prior page and offers a review and apply action.',
  'source complete, stopped, error, presentation paused and revision available are distinct. stopped or failed partial output is labeled separately, never celebrated as a complete answer.',
  'a brand can change material, color and motion. it cannot change source commitments, finality or the exact answer. all words arrive at full reading contrast and share one brief settling motion before resting.',
  'reduced motion, motion off, pause and hidden states bypass the final decorative fit delay and answer motion. source finality stays unchanged. measured visual availability can differ from the source timestamp and from the authored 180 ms fit duration.',
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
        given the same source events, policy, container metrics and presentation clock, the surface makes the same decisions, whatever comes later. only the source decides when its answer is complete. a separate size handoff controls when that final answer becomes fully visible.
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
          the raw prefix shows in-order source pieces, including half-words. the comparison applies a release policy to those same events. the whole-answer option waits for finality; earlier policies expose useful text sooner. this is an availability comparison, separate from testing still, breathe and reshape with shared source timing and final handover rules. actual visual arrival is measured separately. reading research, including <DefinitionTerm term="parafoveal preview">parafoveal preview</DefinitionTerm> and studies of unstable text, motivates preserving readable text. it does not prove that withholding it is better.
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

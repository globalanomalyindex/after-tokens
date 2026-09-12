import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { DefinitionTerm } from '@/components/chrome/definition-term'

// The reading contract separates ambient appearance, release policy and source finality.

const RULES: string[] = [
  'released text requires source commitments or an explicitly final snapshot. the renderer cannot inspect future answer text, widths or formatting. once a batch meets its release policy, its actual text can supply the targets for the bubble handover.',
  'the whole-answer policy waits for source finality. earlier word, sentence and paragraph policies release eligible passages sooner. all four use the same cell material; a guessed period or animation endpoint cannot complete the source.',
  'the waiting field follows an authored clock and seed. its five rows do not resize from drafts, committed fragments or guessed formatting. after earlier passages arrive, two rows remain below them. these shapes indicate waiting, not answer length or percent complete.',
  'newly released text crosses from the visible bubbles over 280 ms. ink begins transparent, reaches full opacity at 74 percent of that authored interval and rests at its endpoint. text already released does not replay the effect.',
  'when newly released text needs more room, an authored 180 ms fit precedes the handover. otherwise it starts immediately as the frame adjusts. browser scheduling can extend either interval; source eligibility and visual availability are measured separately.',
  'the protected page contains only released passages. provisional words may appear in the separately labeled draft inspector, and never become released text merely because they look plausible. waiting pills have no token identity.',
  'a committed end token bounds remaining positions; source finality follows when the contiguous committed prefix reaches it, or a valid finish or final snapshot establishes the result. later revisions preserve the prior page and require review and apply.',
  'source complete, stopped, error, presentation paused and revision available are distinct. stopped or failed partial output is labeled separately, never celebrated as a complete answer.',
  'palette and tempo change the waiting material. they cannot change source commitments, finality, the exact answer or the authored text-handover duration. settling indicates presentation state, not confidence or correctness.',
  'reduced motion, motion off, pause and hidden states bypass decorative fitting and text arrival motion. eligible text becomes fully visible; source finality stays unchanged. the end of an animation never substitutes for the end of generation.',
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
        given the same source events, policy, run seed, container metrics and presentation clock, the surface makes the same decisions, whatever comes later. only the source decides when its answer is complete. the release policy decides which passages are eligible, and a short material handover controls how new text becomes visible.
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
        <SettleStage source="trace:hash-function__lowconf-b32" controls={['policy']} comparison />
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

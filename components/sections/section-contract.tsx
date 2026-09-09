import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { DefinitionTerm } from '@/components/chrome/definition-term'

// The reading contract: ten rules, three policies, and what finality means.

const RULES: string[] = [
  'nothing is drawn that the source has not committed: no final text, no reserved widths, no map of which words matter, no forecast of length.',
  'a word is drawn only when it is complete. a token whose successor is uncommitted is held, because it may be the first piece of a longer word.',
  'text on the page never changes, moves or reflows, except once: when a sentence closes it sets, its words pressing a twentieth of an em and coming to rest where they were written as the page&rsquo;s ink rises through their letterforms; after the set their shapes and places never change. the carved zone after the page reflows as blank space, drafts and pieces become words, and every change of width is a slide.',
  'the page grows by whole passages under a policy: each word, each sentence, or each paragraph. no timeout relabels a fragment as complete; finality releases the exact remainder.',
  'out-of-order text appears only after the page, never inside it. an open position is reserved blank space, and every position is a reel: the source&rsquo;s own guess for it is a smear blurred past reading below a floor and a draft above it, never a word, and its prior, the guess it makes at four or more open positions at once and holds while it stands at two, is blank; and a guess the source drops rolls up and out as the next rolls in beneath it; a committed piece is drawn as a piece; a word rolls in last and stops the reel where it will stand, in the secondary ink, only after every piece of it has committed. nothing committed is drawn as a guess, nothing guessed is drawn as committed, and no guess reaches the page. nothing travels across the answer.',
  'an exact length is claimed only when the prefix reaches a committed end token. before that, a committed end token anywhere bounds the answer to before it, and nothing past it is drawn.',
  'revisable snapshots stay off the page until one is explicitly final. a later revision keeps the prior page and offers a review and apply action.',
  'source complete, source stopped, source error, presentation paused and revision available are distinct states, named in the margin.',
  'a brand changes what cells, marks and onsets look like and how they move. it never changes when text becomes available or is released.',
  'reduced motion removes the breath, the bloom, the build, the reel&rsquo;s roll, and the set, and changes nothing else.',
]

const FINALITY: { dt: string; dd: string }[] = [
  { dt: 'when a source can revise everything', dd: 'a sampler that remasks committed tokens cannot promise a prefix. it sends snapshots instead, and nothing reaches the page until one is marked final. repeated identical drafts are not evidence of finality.' },
  { dt: 'when a later revision arrives', dd: 'the page a reader has already read stays. the replacement is reviewed and applied by the reader, and the previous version remains available. a change is never hidden inside motion.' },
  { dt: 'when generation ends another way', dd: 'source complete, source stopped and source error are different words in the margin. released text stays; unfinished text is held and said to be held. pausing this demonstration pauses a recording; it does not claim to stop a model.' },
  { dt: 'when a boundary is only evidence', dd: 'a sentence boundary is punctuation followed by whitespace, held back inside code, lists and after common abbreviations. it says the sentence is complete. it says nothing about whether a later sentence will qualify it, or whether it is true.' },
]

export function SectionContract() {
  return (
    <Section id="contract" title="What the reader can count on">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">what the reader can count on</h2>
      <p className="standfirst max-w-3xl">
        given the same events, the surface shows the same page, the same forming text, the same field and the same
        words in the margin, whatever comes later. ten rules make that true, and a pure reducer keeps them.
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
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-3">three policies, one prefix</h3>
        <p className="text-base leading-relaxed max-w-[64ch] mb-8" style={{ color: 'var(--ink-2)' }}>
          the raw prefix on the left is what a naive renderer would draw: every committed token in order, half-words and all. the surface
          on the right draws the same events under the contract. change the policy to move the boundary; change what follows the page to
          see the carved field, the in-order text alone, or what the surface holds back when a product wants stillness above all. the page&rsquo;s stillness is the one rule the reading literature
          argues for directly: the eye samples the next word before it lands there (<DefinitionTerm term="parafoveal preview">parafoveal preview</DefinitionTerm>),
          and text that changes there costs a reader time.
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

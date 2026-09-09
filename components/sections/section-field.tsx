import type { CSSProperties } from 'react'
import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SettleStage } from '@/components/settle/settle-stage'
import { DefinitionTerm } from '@/components/chrome/definition-term'
import { DRAFTS } from '@/lib/traces/findings'

const pct = (x: number) => `${Math.round(x * 100)}%`

// The field: the diffusion-native part of the surface, carved into the text
// itself. Two recordings, two shapes, the registers a word passes through,
// and the strip as the field's compact form.

const REGISTERS: { label: string; body: string; sample: React.ReactNode }[] = [
  { label: 'open', body: 'a source position with no commitment. a fixed reservation holds room for it; a soft, nonlexical breath shows the unresolved interval, not a known final word width', sample: <span className="settle-zone settle-legend"><span className="settle-slot" /><span className="settle-slot" /></span> },
  { label: 'gathering', body: 'candidate changes stay inside their reservation. below the probability floor, or when a draft does not fit, the treatment remains nonlexical. the repeated prior is suppressed; guessed whitespace cannot move the lines', sample: <span style={{ opacity: 0.25 }}>∿ &nbsp; ∿</span> },
  { label: 'draft', body: 'a source guess above the floor, shown only when its full candidate fits. its letters stay still in provisional ink while the decorative layer breathes. this is not a correctness score', sample: <span className="settle-zone settle-legend"><span className="settle-cz" data-state="draft">sky</span></span> },
  { label: 'piece', body: 'committed letters whose complete word boundary is not yet available. their spelling is a source fact; their meaning may still depend on what follows', sample: <span className="settle-zone settle-legend"><span className="settle-cz">scat</span></span> },
  { label: 'written', body: 'every piece and boundary has committed. the letters are immediately readable in the secondary ink. one local response acknowledges completion without a bounce or letter sequence', sample: <span className="settle-zone settle-legend"><span className="settle-cw">sunlight scatters</span></span> },
  { label: 'settled', body: 'the release policy has accepted the passage. the same text takes the page ink, with one short local afterglow; later source events do not replay its arrival', sample: <span style={{ color: 'var(--stage-text)' }}>The sky is blue.</span> },
  { label: 'end', body: 'the lowest committed end token bounds the remaining positions. it is not a forecast of final formatting', sample: <span className="settle-zone settle-legend"><span className="settle-slot" data-state="end" /></span> },
]

export function SectionField() {
  return (
    <Section id="field" title="What settles first">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">what settles first</h2>
      <p className="standfirst max-w-3xl">
        progress belongs where the words are forming. unresolved positions carry a soft breath; source guesses
        stay visibly provisional; committed letters become readable at once. when several words complete together,
        their local responses begin together. when a passage closes, its ink settles and the earlier text rests.
        fixed candidate reservations keep changing guesses from repeatedly rearranging the lines. they estimate
        space from available positions; they do not know the final shape of the answer.
      </p>

      <div className="mt-12 md:mt-16 grid gap-8 lg:grid-cols-2 items-start">
        <Reveal>
          <h3 className="text-xl font-bold tracking-tight leading-tight mb-2">the block sampler: a clause at a time</h3>
          <p className="text-sm leading-relaxed max-w-[52ch] mb-5" style={{ color: 'var(--ink-2)' }}>
            inside each block of 32 the easy positions fill first and one hard position holds the rest. words appear across the block as
            they complete; when the hard position fills, a whole clause joins the prefix at once and the page takes it as a sentence closes.
          </p>
          <SettleStage source="trace:diffusion-explain__lowconf-b32" compact />
        </Reveal>
        <Reveal delay={120}>
          <h3 className="text-xl font-bold tracking-tight leading-tight mb-2">the schedule-free sampler: the end, then the words</h3>
          <p className="text-sm leading-relaxed max-w-[52ch] mb-5" style={{ color: 'var(--ink-2)' }}>
            with no block schedule the model spends most of its steps deciding how short the answer is: the zone is carved down from the
            tail for a hundred steps, then the words land in the last few, then the sentence settles onto the page.
          </p>
          <SettleStage source="trace:sky-blue__lowconf-b128" compact />
        </Reveal>
      </div>

      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">the registers</h3>
          <p className="mt-3 text-base leading-relaxed max-w-[44ch]" style={{ color: 'var(--ink-2)' }}>
            a word&rsquo;s progress is its ink: a ghost while the model only guesses it, its own letters in the secondary ink once they
            have committed, then the page&rsquo;s. the treatment sits where the reader is looking; the margin names the source state. the
            secondary ink is the page&rsquo;s ink moved toward the ground as far as a 4.5:1 contrast floor allows, because an available
            word is a word people will read; where a palette leaves no room to dim, the state is carried by a tint toward the brand&rsquo;s
            accent instead.
          </p>
        </div>
        <dl className="grid gap-5 stage p-6 md:p-8 settle" data-demo data-status="complete" data-mark="tick" style={{ ['--settle-open-alpha' as string]: 0.3, fontFamily: 'var(--font-ui)' } as CSSProperties}>
          {REGISTERS.map((r) => (
            <div key={r.label} className="grid grid-cols-[9rem_1fr] gap-4 items-baseline">
              <dt className="text-base" aria-label={r.label}><span aria-hidden="true">{r.sample}</span></dt>
              <dd>
                <span className="readout block" style={{ color: 'var(--stage-text)' }}>{r.label}</span>
                <span className="text-sm leading-relaxed block mt-1" style={{ color: 'color-mix(in oklab, var(--stage-text) 72%, transparent)' }}>{r.body}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">the carved zone replaces the three dots</h3>
        <div className="text-base leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>
          <p>
            a typing indicator says that something is happening. the carved zone says what, where the answer will be: 84 of 128 positions
            settled, the end known, one hole holding the next sentence, the words already committed, and
            the model&rsquo;s own guesses ghosted where it has them. the state remains causal: every reservation corresponds to an available
            open position, every draft a real prediction drawn as one, every piece a fact, and every word a fact the sampler already
            emitted. the margin names the phase, sketching to closing, read off the same field.
          </p>
          <p className="mt-4">
            a product that wants the text zone quiet can hold the carved zone and show the strip instead: one cell per position under the
            page, the same states, the field&rsquo;s compact form. candidate changes hold their reservations. commitments can still change the layout: small relocations are coordinated,
            while large line wraps remain a limitation to measure. the playground offers all three: the carved field, the in-order text
            alone, and nothing after the page, as margin did.
          </p>
          <p className="mt-4">
            the draft policy is measured before the new width-fit check. across the runs a draft is eligible at some open position on {pct(DRAFTS.shown.stepsWithDraftShare)} of steps,
            {' '}{pct(DRAFTS.shown.accuracy)} of eligible drafts match the token that later commits, a position&rsquo;s draft first qualifies a
            median of {DRAFTS.shown.medianPolishSteps} steps before it commits, and {pct(DRAFTS.shown.neverChangedShare)} never change again
            once eligible. under the block sampler the share of open positions eligible for a draft rises from
            {' '}{pct(DRAFTS.shown.byConfig['lowconf-b32'].visibleShareByDecile[0] ?? 0)} of them in the first tenth of a run to
            {' '}{pct(DRAFTS.shown.byConfig['lowconf-b32'].visibleShareByDecile[9] ?? 0)} in the last: the rough draft filling in. and a
            commitment lifts the confidence of the open positions beside it by {DRAFTS.byConfig['lowconf-b32'].neighborLift.toFixed(2)} on the
            next step, against {DRAFTS.byConfig['lowconf-b32'].otherLift.toFixed(3)} at other open positions. this association does not establish that a commitment causes its neighbors to settle. the current width-fit check can hide eligible drafts, so these are not screen-visibility measurements. the floor, hysteresis, attach rule and phase names are authored; the drafts, their
            probabilities and their changes are the model&rsquo;s.
          </p>
          <p className="mt-4">
            the <DefinitionTerm term="labor illusion">labor illusion</DefinitionTerm> is the reason to be careful here: seeing work raises the value
            people put on a good result, and turns against a poor one. so a draft is never drawn as a word, a word is never a score, and
            the study tests two hypotheses about this surface: that one calm transition inside newly ready words feels more coherent than
            many independent marks, and that a guess drawn as a guess is not read as the answer, without assuming a smoother
            presentation reads better.
          </p>
          <p className="mt-4">
            the anchor in nature is sediment settling. in a column of stirred water the clear zone grows from the top down as the suspension
            drops out of it. the page is the clear zone; the carved zone is the suspension; the metaphor describes the change in state. it is not an instruction to read provisional text as final, or a psychological claim about a reader.
          </p>
        </div>
      </div>
      <div className="mt-12 md:mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <div>
          <p className="readout mb-3" style={{ color: 'var(--muted)' }}>motion revision · 9 september 2026 · reader evaluation pending</p>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">gather in several places. settle where you are.</h3>
        </div>
        <div className="text-base leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }}>
          <p>
            the phone exposed the remaining problem: a width can ease while a whole line still wraps in one frame.
            the revised interaction preserves source-token identity, coordinates small necessary layout changes,
            and gives the unresolved surface one soft breath. when a passage becomes ready, its words receive one
            local ink response together, followed by a gentle decay. earlier text rests. large reflows can still relocate provisional text; a slower curve cannot establish its final geometry.
          </p>
          <p className="mt-4">
            diffusion supplies the locations and timing. regions that actually resolve together respond together;
            nothing sweeps across the answer in reading order. three list items can develop independently when
            their structure is known and the source supplies complete item ranges. a guessed line break or a
            stored final answer cannot supply that guarantee. the current prefix contract does not release
            independent items.
          </p>
          <p className="mt-4">
            caption-stability research motivates reducing disturbance, and animated-transition research motivates
            preserving identity with simple changes. neither proves that breathing words improve comprehension
            or produce a dopamine response. the unrun reader test compares layout fixes alone with the same fixes
            plus ambient and completion feedback, measuring phone peak displacement, reading comfort and
            mistakes as well as preference.
          </p>
          <p className="mt-4">
            a controlled Chromium check used one 390 × 844 viewport and weather__random-b32 at its recorded 1× clock
            for 18 seconds, once per implementation, against revision 55ff175. the revision had zero observed token remounts, zero frames
            with blurred or faded committed text, and zero released-glyph movement across 58,432 matched samples.
            the worst identical committed-glyph move did not improve: 280.6 px after versus 276.5 px before.
            large provisional wraps remain. this is one engineering observation, not reader or physical iPhone validation.
            {' '}<a className="underline underline-offset-4" href="https://github.com/globalanomalyindex/after-tokens/blob/main/docs/motion-validation-2026-09-09.json">measurement and limits</a>.
          </p>
          <p className="mt-4 text-sm">
            research: <a className="underline underline-offset-4" href="https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/">Liu and colleagues, 2023</a>
            {' · '}<a className="underline underline-offset-4" href="https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf">Heer and Robertson, 2007</a>
            {' · '}<a className="underline underline-offset-4" href="https://arxiv.org/html/2502.09992v3">LLaDA, inference and sampling strategies</a>
          </p>
        </div>
      </div>
    </Section>
  )
}

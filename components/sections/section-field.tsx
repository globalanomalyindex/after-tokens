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
  { label: 'open', body: 'a position with no commitment and no guess to draw: reserved space, about a token wide, standing where a word may be. the zone shortens from the tail as the model decides the length', sample: <span className="settle-zone settle-legend"><span className="settle-slot" data-state="open" /><span className="settle-slot" data-state="open" /><span className="settle-slot" data-state="open" /></span> },
  { label: 'spin', body: 'the reel below the floor: the model\u2019s guess for an open position at any probability, drawn as a smear of the secondary ink, blurred past reading and weighted by that probability. every change of guess is a turn of the reel, so wherever the model is guessing something about a position the reel visibly turns, and nothing below the floor is drawn as legible text. a guess the model makes at four or more open positions at once is its prior for an unknown position, and holds while it stands at two, and the prior is drawn as blank', sample: <span className="settle-zone settle-legend"><span className="settle-cz" data-state="spin" style={{ ['--p' as string]: 0.3 } as CSSProperties}>the</span> <span className="settle-cz" data-state="spin" style={{ ['--p' as string]: 0.8 } as CSSProperties}>light</span></span> },
  { label: 'draft', body: 'the same guess once it clears the floor: the model\u2019s own prediction, come into focus as a ghost of the secondary ink that sharpens with its probability. a guess the model drops rolls on up and out, blurred, as the next rolls in beneath it. it never reaches the page', sample: <span className="settle-zone settle-legend"><span className="settle-cz" data-state="draft" style={{ ['--sure' as string]: 0.15 } as CSSProperties}>sunlight</span> <span className="settle-cz" data-state="draft" style={{ ['--sure' as string]: 0.8 } as CSSProperties}>scatters</span></span> },
  { label: 'piece', body: 'a committed piece of a word that is not complete. its letters are facts, in the secondary ink at full weight; the snap is what marks the word closing', sample: <span className="settle-zone settle-legend"><span className="settle-g"><span className="settle-cz" data-state="piece">scat</span><span className="settle-cz" data-state="draft" style={{ ['--sure' as string]: 0.5 } as CSSProperties}>ters</span></span></span> },
  { label: 'written', body: 'every piece and its boundaries are in. the word rolls in last and stops the reel with a bounce where it will stand, or lands in place when its draft already had it right, each letter coming into focus on its own beat from the middle outward, in the secondary ink, waiting for its sentence', sample: <span className="settle-zone settle-legend"><span className="settle-cw">sunlight scatters</span></span> },
  { label: 'settled', body: 'its sentence closed under the policy: the page set, the word pressing a twentieth of an em and coming to rest where it was written as the page\u2019s ink rose through its letterforms, and it will not move again', sample: <span className="settle-passage"><span className="settle-w" data-t="The sky is blue." style={{ animation: 'none', color: 'var(--stage-text)' }}>The sky is blue.</span></span> },
  { label: 'end', body: 'the lowest committed end token; the answer ends at or before it, so the positions past it close to nothing', sample: <span className="settle-zone settle-legend"><span className="settle-slot" data-state="end" /></span> },

]

export function SectionField() {
  return (
    <Section id="field" title="What settles first">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">what settles first</h2>
      <p className="standfirst max-w-3xl">
        the field is carved into the text. every position after the page is reserved space about a token wide, and
        every position is a reel. the recordings hold the model\u2019s guess for every open position at every step, and
        the reel spins through them in the model\u2019s own order at the model\u2019s own pace: below the floor a guess is a smear
        blurred past reading, weighted by its probability, so wherever the model is guessing something about a position the reel
        visibly turns, while a guess it makes at four or more positions at once is its prior, held while it stands at two, and is drawn as blank; a guess
        that clears the floor comes into focus as a draft, ghosted, breathing, sharpening as the model grows sure, and
        never a word until it commits; a guess the model drops rolls on up and out as the next rolls in beneath it. the
        shape of the message arrives with it: its length is carved down from the tail as the model commits its end, and
        a line break, committed or confidently guessed, is drawn as a break, so a list or a paragraph shows its outline
        before its words. when the sampler commits a piece of a word, the piece stands as a fact. when every piece is
        in, the word rolls in last and stops the reel with a bounce where it will stand, or lands in place when its
        draft already had it right, each letter coming into focus on its own beat from the middle of the word outward,
        in a secondary ink, opening from the space it held so the line slides rather than jumps; the drafts beside it
        lift for a beat, because a commitment really does lift its neighbors, and reels stopping in several places stop
        in several places at once. when a sentence closes, the page sets: its words press a
        twentieth of an em and come to rest where they were written, the page\u2019s ink rises through their letterforms
        with a glint at its edge, and a glow around them cools. nothing guessed is drawn as committed, and nothing
        committed as a guess.
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
            have built, then the page&rsquo;s. it is carried by the word, where the reader is looking, and by nothing else. the
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
            settled, the end known, one hole holding the next sentence, the words that are already sure standing where they will, and
            the model&rsquo;s own guesses ghosted where it has them. it costs nothing in truth, because every reserved space is a real
            open position, every draft a real prediction drawn as one, every piece a fact, and every word a fact the sampler already
            emitted. the margin names the phase, sketching to closing, read off the same field.
          </p>
          <p className="mt-4">
            a product that wants the text zone quiet can hold the carved zone and show the strip instead: one cell per position under the
            page, the same states, the field&rsquo;s compact form. as reserved space becomes words the zone reflows, and every change
            of width is a slide rather than a jump. the playground offers all three: the carved field, the in-order text
            alone, and nothing after the page, as margin did.
          </p>
          <p className="mt-4">
            the arc is recorded. across the runs a draft stands at some open position on {pct(DRAFTS.shown.stepsWithDraftShare)} of steps,
            {' '}{pct(DRAFTS.shown.accuracy)} of the drafts drawn are the token that later commits, a position&rsquo;s draft first shows a
            median of {DRAFTS.shown.medianPolishSteps} steps before it commits, and {pct(DRAFTS.shown.neverChangedShare)} never change again
            once shown. under the block sampler the share of open positions carrying a draft rises from
            {' '}{pct(DRAFTS.shown.byConfig['lowconf-b32'].visibleShareByDecile[0] ?? 0)} of them in the first tenth of a run to
            {' '}{pct(DRAFTS.shown.byConfig['lowconf-b32'].visibleShareByDecile[9] ?? 0)} in the last: the rough draft filling in. and a
            commitment lifts the confidence of the open positions beside it by {DRAFTS.byConfig['lowconf-b32'].neighborLift.toFixed(2)} on the
            next step, against {DRAFTS.byConfig['lowconf-b32'].otherLift.toFixed(3)} for every other open position: one word settling
            makes its neighbors settle. the floor, the hysteresis, the attach rule and the phase names are authored; the drafts, their
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
            drops out of it. the page is the clear zone; the carved zone is the suspension; the rule is to wait for the water to clear before
            reading it, and to be able to see it clearing in the meantime.
          </p>
        </div>
      </div>
    </Section>
  )
}

import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SETTLE, TRACE_NUMBERS } from '@/lib/traces/findings'
import { DefinitionTerm } from '@/components/chrome/definition-term'

// What is known: three claims about the repository, a psychology ledger
// corrected against the literature, and a study nobody has run.

type Row = { mechanism: string; term?: string; source: string; says: string; does: string; design: string; verdict: 'kept' | 'retired' | 'guardrail' }

const LEDGER: Row[] = [
  { mechanism: 'stability of text under the eye', term: 'change blindness', source: 'Liu and colleagues, CHI 2023 extended abstracts; Slattery, Angele and Rayner, 2011', says: 'in live captions, revising text already on screen went with reported distraction and fatigue and lower reading comfort; a change under a fixation is detected unless timed to a saccade.', does: 'test a diffusion surface, or say how much stillness is enough.', design: 'the page never changes, moves, blurs or reweights.', verdict: 'kept' },
  { mechanism: 'rereading', source: 'Schotter, Tran and Rayner, 2014', says: 'preventing a reader from returning to earlier words reduced comprehension.', does: 'measure a growing chat answer.', design: 'earlier passages stay, in place, selectable.', verdict: 'kept' },
  { mechanism: 'motion that reads as a body', source: 'Lasseter, 1987; Thomas and Johnston, 1981; Chang and Ungar, 1993', says: 'squash and stretch, anticipation and follow-through make drawn motion read as mass and intent; applied to interface objects, the same principles were argued to make changes easier to follow.', does: 'come with a user study; these are craft arguments and a system demonstration.', design: 'the cursor is a body on a spring: it stretches along its speed, rounds up as it stops, and trails as one thing, so a jump reads as movement rather than vanishing.', verdict: 'kept' },
  { mechanism: 'motion in the periphery', source: 'Bartram, Ware and Calvert, 2003', says: 'motion beside a primary task is detected far better than a color change; traveling and zooming icons were rated the most distracting, slow linear motion and slow blink the least.', does: 'concern text, or an object the reader is meant to follow.', design: 'a guardrail. the companion drifts slowly and never blinks; a draft changes by a slow fade; the motes that travel are small, brief and few, and they go to the word the reader is about to read.', verdict: 'guardrail' },
  { mechanism: 'animated transitions', source: 'Heer and Robertson, 2007', says: 'animated transitions beat abrupt changes for tracking objects and judging change in charts; simple staging helped a little and was preferred; heavy staging hurt.', does: 'concern text.', design: 'every change of width in the zone is a slide, a word opens from the space it held, and nothing is staged in several steps.', verdict: 'kept' },
  { mechanism: 'visible process, explained waits', term: 'labor illusion', source: 'Buell and Norton, 2011; Maister, 1985; Zhang and colleagues, 2024', says: 'showing work raises the value people put on a good result and lowers it when the result disappoints; unexplained and uncertain waits feel longer; a justified delay reads as more trustworthy.', does: 'show that a field of cells or a cursor has these effects, or say how much visible work is too much.', design: 'the field shows what the sampler has done and why the page waits. it never encodes confidence or correctness.', verdict: 'kept' },
  { mechanism: 'pacing at linguistic boundaries', source: 'Zhu and colleagues, CHI 2026; Tan and Nov, CHI 2026', says: 'streaming paused at clause and sentence boundaries was rated less demanding than constant-rate streaming; an instant answer was rated less thoughtful than one with a short visible delay.', does: 'concern non-sequential sources; both studies stream left to right. recent enough that citation details are only moderately confirmed.', design: 'the page takes whole sentences; the forming text and field carry the delay.', verdict: 'kept' },
  { mechanism: 'zeigarnik effect', term: 'zeigarnik effect', source: 'Ghibellini and Meier, 2025, meta-analysis', says: 'the memory advantage for interrupted tasks does not replicate as a general effect; only a pull to resume survives.', does: 'license a budget of open phrases as a psychological law.', design: 'retired. the first version&rsquo;s tension budget is gone; completion is a state shown plainly.', verdict: 'retired' },
  { mechanism: 'gestalt closure', term: 'gestalt closure', source: 'Elder and Zucker, 1994', says: 'contour closure affects visual grouping of shapes.', does: 'say anything about a sentence completing.', design: 'retired. a passage boundary is a linguistic rule, chosen and priced.', verdict: 'retired' },
  { mechanism: 'peak-end rule', term: 'peak-end rule', source: 'Alaybek and colleagues, 2022; contested for mild positive experiences', says: 'peaks and endings relate to retrospective evaluation; the average matters about as much.', does: 'hold for a mild experience like reading an answer.', design: 'kept only as: end quietly, at a real terminal state, with no flourish.', verdict: 'kept' },
  { mechanism: 'fluency and truth', term: 'processing fluency', source: 'Reber and Schwarz, 1999; Alter and Oppenheimer, 2009', says: 'easier-to-process statements are judged more likely to be true.', does: 'mean a calmer surface is a better answer.', design: 'a guardrail. the study measures false-answer acceptance; a smoother wrong answer is a failure.', verdict: 'guardrail' },
  { mechanism: 'live regions', source: 'practitioner guidance; no controlled study found', says: 'announcing token-by-token streams makes screen readers stutter through partial words.', does: 'come from a controlled study.', design: 'the status is announced on state changes only; passages are plain text in a labeled region.', verdict: 'kept' },
]

const STUDY: { dt: string; dd: string }[] = [
  { dt: 'two experiments, labeled', dd: 'an availability-faithful comparison exposes each policy&rsquo;s real wait under identical source events. a matched-duration comparison holds timing constant to isolate preference. neither substitutes for the other.' },
  { dt: 'conditions', dd: 'the raw prefix, each word, each sentence with forming text, each sentence without it, each paragraph; counterbalanced within participants with a latin square over balanced questions, so nobody reads the same answer twice in the primary comparison.' },
  { dt: 'primary outcomes', dd: 'qualification accuracy, and time to a correct usable answer, with source availability recorded separately so a rendering choice is never mistaken for model speed.' },
  { dt: 'secondary and guardrails', dd: 'perceived wait, comfort, satisfaction, delayed comprehension, brand recognition. false-answer acceptance and truth discrimination as guardrails, with correct and incorrect answers in every condition.' },
  { dt: 'who and how many', dd: 'a pilot for variance and instrumentation, a prespecified smallest useful effect, then a powered confirmatory sample, preregistered, including slower readers, reduced motion, keyboard and screen-reader sessions, and repeat exposure. no number is invented here.' },
]

export function SectionEvidence() {
  const s = SETTLE.all60.sentence.uniform
  return (
    <Section id="evidence" title="What is known">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">what is known</h2>
      <p className="standfirst max-w-3xl">
        the case study claims three things about this repository and nothing about a reader. the psychology that
        motivated the first version is kept where it survived review and retired where it did not. a study is
        designed; nobody has run it.
      </p>
      <dl className="mt-12 md:mt-16 grid gap-8 md:grid-cols-3">
        <Reveal className="rule pt-6">
          <dt className="text-base font-semibold">nothing is drawn early</dt>
          <dd className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>across all {s.traces} recordings and three policies, {s.precommitExposure} characters reached the page before their tokens committed. the replay adapter never reads the answer; a throwing-getter test proves it.</dd>
        </Reveal>
        <Reveal delay={80} className="rule pt-6">
          <dt className="text-base font-semibold">every output is exact</dt>
          <dd className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{s.exactFinalOutputs} of {s.traces} final pages equal the sampler&rsquo;s output to the character, whitespace included, under each word, each sentence and each paragraph.</dd>
        </Reveal>
        <Reveal delay={160} className="rule pt-6">
          <dt className="text-base font-semibold">the cost is stated</dt>
          <dd className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>the wait each policy adds is measured per run on the uniform and the recorded clock, with denominators, and is shown in the chapter above rather than argued around.</dd>
        </Reveal>
      </dl>

      <div className="mt-16 md:mt-24">
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-3">the ledger, corrected</h3>
        <p className="text-base leading-relaxed max-w-[64ch] mb-8" style={{ color: 'var(--ink-2)' }}>
          a literature review on 7 september 2026 checked each mechanism the first version cited. what each source says is separated from what it
          does not establish, and the design consequence follows from the gap. none of these studies tests this surface.
        </p>
        <div className="grid gap-0">
          {LEDGER.map((row, i) => (
            <Reveal key={row.mechanism} delay={Math.min(i, 4) * 40} className="grid gap-3 md:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-8 rule py-6">
              <div>
                <p className="text-base font-semibold leading-tight">{row.term ? <DefinitionTerm term={row.term}>{row.mechanism}</DefinitionTerm> : row.mechanism}</p>
                <p className="readout mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{row.source}</p>
                <p className="readout mt-2" style={{ color: row.verdict === 'retired' ? 'var(--muted)' : 'var(--cobalt)' }}>{row.verdict}</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}><span className="label block mb-1">says</span>{row.says}</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}><span className="label block mb-1">does not</span>{row.does}</p>
              <p className="text-sm leading-relaxed"><span className="label block mb-1">so the surface</span><span dangerouslySetInnerHTML={{ __html: row.design }} /></p>
            </Reveal>
          ))}
        </div>
      </div>

      <div className="mt-16 md:mt-24 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] rule pt-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">the study, designed and unrun</h3>
          <p className="mt-3 text-base leading-relaxed max-w-[44ch]" style={{ color: 'var(--ink-2)' }}>
            the proposal is that a still page with the process in view helps people use an answer while generation continues. it could be
            wrong: waiting may cost more than stillness gives back, and a calmer surface may be believed too easily. the study can find either.
          </p>
          <p className="mt-3 readout leading-relaxed" style={{ color: 'var(--muted)' }}>stimuli: the {TRACE_NUMBERS.curatedRuns} curated recordings under every policy, plus the authored edge cases. no participants have been recruited.</p>
        </div>
        <dl className="grid gap-6">
          {STUDY.map((row, i) => (
            <Reveal key={row.dt} delay={i * 50}>
              <dt className="text-base font-semibold">{row.dt}</dt>
              <dd className="mt-1 text-base leading-relaxed max-w-[60ch]" style={{ color: 'var(--ink-2)' }} dangerouslySetInnerHTML={{ __html: row.dd }} />
            </Reveal>
          ))}
        </dl>
      </div>
    </Section>
  )
}

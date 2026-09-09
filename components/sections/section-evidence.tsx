import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SETTLE, TRACE_NUMBERS } from '@/lib/traces/findings'
import { DefinitionTerm } from '@/components/chrome/definition-term'

// What is known: three claims about the repository, a psychology ledger
// corrected against the literature, and this project's unrun study.

type Row = { mechanism: string; term?: string; source: string; sourceUrl?: string; says: string; does: string; design: string; verdict: 'kept' | 'retired' | 'guardrail' | 'hypothesis' }

const LEDGER: Row[] = [
  { mechanism: 'stability of text under the eye', term: 'change blindness', source: 'Liu and colleagues, CHI 2023 extended abstracts; Slattery, Angele and Rayner, 2011', sourceUrl: 'https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/', says: 'caption instability correlated with distraction, fatigue and lower reading comfort; stabilization with smoothing improved five of six ratings in a study of 123 people.', does: 'test diffusion text, isolate the benefit of animation, or establish a comprehension gain.', design: 'earlier readable passages stay fixed. the revision reduces candidate-driven layout changes and adds a local completion cue; reader benefit remains untested.', verdict: 'kept' },
  { mechanism: 'rereading', source: 'Schotter, Tran and Rayner, 2014', says: 'preventing a reader from returning to earlier words reduced comprehension.', does: 'measure a growing chat answer.', design: 'earlier passages stay, in place, selectable.', verdict: 'kept' },
  { mechanism: 'motion that reads as a body', source: 'Lasseter, 1987; Thomas and Johnston, 1981; Chang and Ungar, 1993', says: 'anticipation and follow-through are craft methods for giving a change a perceptible beginning and ending; interface applications were argued to make changes easier to follow.', does: 'come with a user study or establish a dopamine response to resolving text.', design: 'one coordinated settle for a newly completed local region, with earlier text still. its timing and tactile quality are design hypotheses.', verdict: 'hypothesis' },
  { mechanism: 'motion in the periphery', source: 'Bartram, Ware and Calvert, 2003', sourceUrl: 'https://scholars.unh.edu/ccom/979/', says: 'moving notification icons were readily detected; traveling and zooming cues were rated more distracting, and slow linear motion and slow blink less distracting.', does: 'test breathing words or prove that ambient motion improves reading.', design: 'a small, anchored breath on unresolved decoration, continuing only while the source is active and the region unresolved. readable glyphs stay steady; reduced motion and terminal states rest.', verdict: 'guardrail' },
  { mechanism: 'animated transitions', source: 'Heer and Robertson, 2007', sourceUrl: 'https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf', says: 'animated chart transitions helped object tracking and change estimation; simple staging was preferred, while complicated staging sometimes increased errors.', does: 'test text or supply an optimum duration for word motion.', design: 'preserve local identity, soften small necessary relocation, and settle simultaneous source changes together without a reading-order ripple. large reflows remain possible; the reader benefit has not been validated in Settle.', verdict: 'hypothesis' },
  { mechanism: 'visible process, explained waits', term: 'labor illusion', source: 'Buell and Norton, 2011; Maister, 1985; Zhang and colleagues, 2024', says: 'showing operations can raise perceived service value; the benefit weakens with longer waits and can reverse when results disappoint.', does: 'show that animated words have the same effect or justify manufacturing work or delay.', design: 'motion acknowledges source activity and actual completion. it does not imply correctness, extra reasoning or a percentage that the source cannot supply.', verdict: 'guardrail' },
  { mechanism: 'latency and perceived quality', source: 'Tan, Messerschmidt, Yin and Nov, CHI 2026, 13–17 April; doi:10.1145/3772318.3790716', sourceUrl: 'https://doi.org/10.1145/3772318.3790716', says: '240 participants experienced 2-, 9- or 20-second first-token delays. thoughtfulness rated lower at 2 seconds than at 9 or 20; usefulness rated higher at 9 than at 2.', does: 'test instant output, clause pacing, diffusion reveal or subsecond animation. logged behavior and workload showed no significant latency effect.', design: 'a perception guardrail, not a timing prescription. whole-sentence release remains a measured policy choice. the previously cited Zhu clause-pacing paper is withdrawn as evidence until its source is verified.', verdict: 'guardrail' },
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
        designed; this project has not run it.
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
          the literature review was refreshed on 9 september 2026. source findings are separated from design hypotheses.
          the motion revision is implemented; its comfort, comprehension and satisfaction effects have not been measured.
          our search did not identify a study of this specific diffusion presentation.
        </p>
        <div className="grid gap-0">
          {LEDGER.map((row, i) => (
            <Reveal key={row.mechanism} delay={Math.min(i, 4) * 40} className="grid gap-3 md:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-8 rule py-6">
              <div>
                <p className="text-base font-semibold leading-tight">{row.term ? <DefinitionTerm term={row.term}>{row.mechanism}</DefinitionTerm> : row.mechanism}</p>
                <p className="readout mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{row.sourceUrl ? <a href={row.sourceUrl} className="underline underline-offset-2">{row.source}</a> : row.source}</p>
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

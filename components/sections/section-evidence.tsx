import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { SETTLE, TRACE_NUMBERS } from '@/lib/traces/findings'
import { DefinitionTerm } from '@/components/chrome/definition-term'

// What is known: three claims about the repository, a psychology ledger
// corrected against the literature, and this project's unrun study.

type Row = { mechanism: string; term?: string; source: string; sourceUrl?: string; says: string; does: string; design: string; verdict: 'kept' | 'retired' | 'guardrail' | 'hypothesis' }

const LEDGER: Row[] = [
  { mechanism: 'stability of text under the eye', term: 'change blindness', source: 'Liu and colleagues, CHI 2023 extended abstracts; Slattery, Angele and Rayner, 2011', sourceUrl: 'https://research.google/pubs/modeling-and-improving-text-stability-in-live-captions/', says: 'caption instability correlated with distraction, fatigue and lower reading comfort; stabilization with smoothing improved five of six ratings in a study of 123 people.', does: 'test diffusion text, isolate the benefit of animation, or establish a comprehension gain.', design: 'the whole-answer treatment keeps ambient movement outside readable text. withholding earlier text is a separate cost; a reader benefit remains untested.', verdict: 'kept' },
  { mechanism: 'rereading', source: 'Schotter, Tran and Rayner, 2014', says: 'preventing a reader from returning to earlier words reduced comprehension.', does: 'measure a growing chat answer.', design: 'earlier passages stay, in place, selectable.', verdict: 'kept' },
  { mechanism: 'fluid motion', source: 'Apple, Designing Fluid Interfaces, WWDC 2018', sourceUrl: 'https://developer.apple.com/videos/play/wwdc2018/803/', says: 'gesture demonstrations emphasize immediate response, interruption, spatial continuity and small changes between adjacent frames.', does: 'report a diffusion reader study, prescribe these bar timings or establish a dopamine response.', design: 'keep bar motion continuous inside one bounded area. the bars disappear immediately at finality; a brief thin outline accompanies fully readable text. its tactile quality is a design hypothesis.', verdict: 'hypothesis' },
  { mechanism: 'motion in the periphery', source: 'Bartram, Ware and Calvert, 2003', sourceUrl: 'https://scholars.unh.edu/ccom/979/', says: 'moving notification icons were readily detected; traveling and zooming cues were rated more distracting, and slow linear motion and slow blink less distracting.', does: 'test breathing words or prove that ambient motion improves reading.', design: 'keep ambient motion within the loading area and stop it at terminal states. compare its distraction cost with static bars; reduced motion retains the same answer timing.', verdict: 'guardrail' },
  { mechanism: 'animated transitions', source: 'Heer and Robertson, 2007', sourceUrl: 'https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf', says: 'animated chart transitions helped object tracking and change estimation; simple staging was preferred, while complicated staging sometimes increased errors.', does: 'test text or supply an optimum duration for word motion.', design: 'test whether changing the visible length adds anything to a shared opacity pulse. the answer arrives together after source finality, while the final height change remains a separate geometry measurement.', verdict: 'hypothesis' },
  { mechanism: 'visible process, explained waits', term: 'labor illusion', source: 'Buell and Norton, 2011; Maister, 1985; Zhang and colleagues, 2024', says: 'showing operations can raise perceived service value; the benefit weakens with longer waits and can reverse when results disappoint.', does: 'show that animated words have the same effect or justify manufacturing work or delay.', design: 'motion acknowledges source activity and actual completion. it does not imply correctness, extra reasoning or a percentage that the source cannot supply.', verdict: 'guardrail' },
  { mechanism: 'latency and perceived quality', source: 'Tan, Messerschmidt, Yin and Nov, CHI 2026, 13–17 April; doi:10.1145/3772318.3790716', sourceUrl: 'https://doi.org/10.1145/3772318.3790716', says: '240 participants experienced 2-, 9- or 20-second first-token delays. thoughtfulness rated lower at 2 seconds than at 9 or 20; usefulness rated higher at 9 than at 2.', does: 'test instant output, clause pacing, diffusion reveal or subsecond animation. logged behavior and workload showed no significant latency effect.', design: 'a perception guardrail, not a timing prescription. whole-answer release remains a measured policy choice. the previously cited Zhu clause-pacing paper is withdrawn as evidence until its source is verified.', verdict: 'guardrail' },
  { mechanism: 'common fate', source: 'Chalbi and colleagues, 2020', sourceUrl: 'https://arxiv.org/html/1908.00661', says: 'an online study with 100 people found grouping from coordinated visual changes, including luminance and size; later visualization tasks showed context dependence.', does: 'show that synchronized bars improve reading or establish a best breathing period.', design: 'both moving conditions share a rhythm. common fate motivates that choice; the current comparison tests added contour movement, with changed area, rather than isolating grouping.', verdict: 'hypothesis' },
  { mechanism: 'skeleton screens', source: 'Mejtoft, Långström and Söderström, 2018', sourceUrl: 'https://doi.org/10.1145/3232078.3232086', says: '14 participants used news sites with skeletons or spinners and 2.75-second page delays. perceived speed, navigation ease and article-finding time showed no significant differences.', does: 'establish skeleton superiority, equivalence, or usefulness for unknown generated text.', design: 'borrow the familiar text material while avoiding a claim to preview final lines. test what readers think the bars mean.', verdict: 'guardrail' },
  { mechanism: 'animated waiting', source: 'Harrison, Yeo and Hudson, 2010', sourceUrl: 'https://www.chrisharrison.net/projects/progressbars2/ProgressBarsHarrison.pdf', says: 'controlled comparisons found that visual treatment could change the perceived duration of determinate horizontal progress bars.', does: 'transfer its effect size to skeletons, a slow breath, diffusion text or this interface.', design: 'measure perceived wait with equal source duration and availability. ambient movement is not a completion percentage.', verdict: 'hypothesis' },
  { mechanism: 'zeigarnik effect', term: 'zeigarnik effect', source: 'Ghibellini and Meier, 2025, meta-analysis', says: 'the memory advantage for interrupted tasks does not replicate as a general effect; only a pull to resume survives.', does: 'license a budget of open phrases as a psychological law.', design: 'retired. the first version&rsquo;s tension budget is gone; completion is a state shown plainly.', verdict: 'retired' },
  { mechanism: 'gestalt closure', term: 'gestalt closure', source: 'Elder and Zucker, 1994', says: 'contour closure affects visual grouping of shapes.', does: 'say anything about a sentence completing.', design: 'retired. a passage boundary is a linguistic rule, chosen and priced.', verdict: 'retired' },
  { mechanism: 'peak-end rule', term: 'peak-end rule', source: 'Alaybek and colleagues, 2022; contested for mild positive experiences', says: 'peaks and endings relate to retrospective evaluation; the average matters about as much.', does: 'hold for a mild experience like reading an answer.', design: 'a brief completion response marks a real final state. any improvement in remembered experience remains a hypothesis, not a reason to manufacture a dramatic ending.', verdict: 'kept' },
  { mechanism: 'fluency and truth', term: 'processing fluency', source: 'Reber and Schwarz, 1999; Alter and Oppenheimer, 2009', says: 'easier-to-process statements are judged more likely to be true.', does: 'mean a calmer surface is a better answer.', design: 'a guardrail. the study measures false-answer acceptance; a smoother wrong answer is a failure.', verdict: 'guardrail' },
  { mechanism: 'live regions', source: 'practitioner guidance; no controlled study found', says: 'announcing token-by-token streams makes screen readers stutter through partial words.', does: 'come from a controlled study.', design: 'the status is announced on state changes only; passages are plain text in a labeled region.', verdict: 'kept' },
]

const STUDY: { dt: string; dd: string }[] = [
  { dt: 'motion comparison', dd: 'still, breathe and reshape use the same source, whole-answer policy, release timestamp and thin-outline completion cue. reshape adds contour movement to the same pulse as breathe. visible area and total ink change as part of that treatment.' },
  { dt: 'availability, separately', dd: 'compare earlier-word access with the whole answer at each policy&rsquo;s real release time. report presentation hold and time to a correct usable answer. this comparison cannot isolate a motion effect.' },
  { dt: 'primary outcomes', dd: 'for motion: perceived fluidity and distraction, with activity understanding and false progress estimates. for availability: task accuracy and time to a correct usable answer, with source time recorded separately.' },
  { dt: 'secondary and guardrails', dd: 'perceived wait, comfort, satisfaction, comprehension and repeat-exposure preference. include poor model outputs and measure false-answer acceptance. ask what the bars mean before explaining them.' },
  { dt: 'who and how many', dd: 'pilot the task and instrumentation, prespecify a smallest useful effect, then power a confirmatory sample. counterbalance matched questions and include reduced motion, keyboard, screen-reader and mobile sessions. no sample size or result is invented here.' },
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
          <dt className="text-base font-semibold">nothing released before commitment</dt>
          <dd className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>across the original {s.traces} recordings, the policy audits report {s.precommitExposure} released characters before commitment. the replay is also exercised with forbidden final-answer properties that throw when accessed.</dd>
        </Reveal>
        <Reveal delay={80} className="rule pt-6">
          <dt className="text-base font-semibold">every output is exact</dt>
          <dd className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>{s.exactFinalOutputs} of {s.traces} final pages equal the sampler&rsquo;s output to the character, whitespace included, under word, sentence, paragraph and whole-answer release. this checks fidelity to the model, not factual correctness.</dd>
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
          the solid skeleton comparison and its whole-answer policy are a prototype; comfort, comprehension and satisfaction effects have not been measured.
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
            the proposal is that a small change in length improves a familiar breathing skeleton. it could be wrong: the pulse alone may work as well, shape movement may distract, or waiting for the complete answer may cost too much.
          </p>
          <p className="mt-3 readout leading-relaxed" style={{ color: 'var(--muted)' }}>stimuli: the {TRACE_NUMBERS.curatedRuns} curated originals, four new batched-commit experiments with failures retained, and authored edge cases. no participants have been recruited.</p>
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

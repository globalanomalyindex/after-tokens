'use client'

import { Section } from '@/components/section'
import { SettleStage } from '@/components/settle/settle-stage'
import { SETTLE } from '@/lib/traces/findings'
import answerCost from '@/data/experiments/answer-policy-cost-2026-09-09.json'

// The playground: every axis the surface has, freed to combine, with the
// corpus cost of the chosen policy beside the stage.

export function SectionPlayground() {
  return (
    <Section id="playground" title="Try it">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">try it</h2>
      <p className="standfirst max-w-3xl">
        compare the whole-answer arrival with earlier words, sentences or paragraphs. all four policies use the same
        cell material and show text only after its release. each new batch crosses from bubbles into words; earlier
        readable text stays in place. the readout measures source eligibility over the original corpus, separately
        from the short visual handover. a presentation change restarts the same source timeline.
      </p>
      <div className="mt-12 md:mt-16">
        <SettleStage
          source="trace:heist-plot__lowconf-b32"
          controls={['prompt', 'config', 'policy', 'voice', 'pace', 'comparison']}
         
          readout={({ policy }) => {
            if (policy === 'answer') {
              const cost = answerCost.all60.answer
              return <div className="grid gap-4 rule pt-4">
                <p className="label">whole answer · original {cost.traces} recordings</p>
                <dl className="grid gap-3 readout">
                  <div><dt>first complete answer, median</dt><dd>{(cost.medianFirstPassageAtMs! / 1000).toFixed(2)} s</dd></div>
                  <div><dt>added first-passage wait vs sentence, paired median</dt><dd>{(answerCost.pairedAnswerMinusSentence.medianFirstPassageDelayMs! / 1000).toFixed(2)} s</dd></div>
                  <div><dt>character hold, mean of trace means</dt><dd>{(cost.meanOfTraceMeanExtraHoldMs! / 1000).toFixed(2)} s</dd></div>
                  <div><dt>exact final outputs</dt><dd>{cost.exactFinalOutputs} / {cost.traces}</dd></div>
                </dl>
                <p className="readout leading-relaxed" style={{ color: 'var(--muted)' }}>57 nonempty runs for timing. Recorded forward-pass clock, not API latency. The whole-answer policy withholds earlier usable text. A separate size fit has an authored 180 ms duration when more room is needed, followed by a 280 ms bubble-to-word handover. These browser presentation costs are not included in the source-eligibility figures.</p>
              </div>
            }
            const u = SETTLE.all60[policy].uniform
            const r = SETTLE.all60[policy].recorded
            const rows: [string, string][] = [
              ['first passage', `${u.medianFirstPassageAt ?? '·'} steps · ${r.medianFirstPassageAt === null ? '·' : (r.medianFirstPassageAt / 1000).toFixed(1)} s`],
              ['extra wait', `${u.meanExtraHold?.toFixed(1) ?? '·'} steps mean`],
              ['waiting material', 'adaptive cells after released text'],
              ['new batch handover', '280 ms · earlier text stays still'],
              ['passages', `${u.medianPassages ?? '·'} of ${u.medianPassageChars ?? '·'} characters`],
              ['exact outputs', `${u.exactFinalOutputs} of ${u.traces}`],
              ['drawn early', `${u.precommitExposure} characters`],
            ]
            return (
              <div className="grid gap-3 rule pt-4">
                <p className="label">each {policy} · all {u.traces} recordings</p>
                <dl className="grid gap-3">
                  {rows.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-3 items-baseline">
                      <dt className="readout" style={{ color: 'var(--muted)' }}>{k}</dt>
                      <dd className="readout" style={{ color: 'var(--ink)' }}>{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="readout leading-relaxed mt-2" style={{ color: 'var(--muted)' }}>medians and means over nonempty runs on the uniform step clock; seconds on the raw forward-pass clock. source-eligibility costs, excluding the 280 ms visual handover and any 180 ms size fit. these are not reader outcomes.</p>
              </div>
            )
          }}
        />
      </div>
    </Section>
  )
}

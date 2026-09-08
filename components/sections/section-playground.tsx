'use client'

import { Section } from '@/components/section'
import { SettleStage } from '@/components/settle/settle-stage'
import { SETTLE } from '@/lib/traces/findings'

// The playground: every axis the surface has, freed to combine, with the
// corpus cost of the chosen policy beside the stage.

export function SectionPlayground() {
  return (
    <Section id="playground" title="Try it">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">try it</h2>
      <p className="standfirst max-w-3xl">
        every recording the hand audit kept, under any sampler, policy, voice and clock, with the carved field, the
        in-order text alone, or nothing after the page, and the raw prefix beside it if you want it. the readout is
        the chosen policy&rsquo;s cost over the whole corpus; the stage is one run. any change replays from the start.
      </p>
      <div className="mt-12 md:mt-16">
        <SettleStage
          source="trace:heist-plot__lowconf-b32"
          controls={['prompt', 'config', 'policy', 'preview', 'voice', 'pace', 'comparison']}
          pace={{ scale: 4 }}
          readout={({ policy, forming }) => {
            const u = SETTLE.all60[policy].uniform
            const r = SETTLE.all60[policy].recorded
            const rows: [string, string][] = [
              ['first passage', `${u.medianFirstPassageAt ?? '·'} steps · ${r.medianFirstPassageAt === null ? '·' : (r.medianFirstPassageAt / 1000).toFixed(1)} s`],
              ['extra wait', `${u.meanExtraHold?.toFixed(1) ?? '·'} steps mean`],
              ['in-order text in view', forming === 'held' ? 'held, as margin did' : `${Math.round((u.medianFormingShare ?? 0) * 100)}% of the run`],
              ['after the page', forming === 'carve' ? 'the carved field' : forming === 'flow' ? 'in order only' : 'nothing'],
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
                <p className="readout leading-relaxed mt-2" style={{ color: 'var(--muted)' }}>medians and means over nonempty runs on the uniform step clock; seconds on the raw forward-pass clock. the reducer&rsquo;s cost, never a reader&rsquo;s.</p>
              </div>
            )
          }}
        />
      </div>
    </Section>
  )
}

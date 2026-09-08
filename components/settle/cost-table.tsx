import { SETTLE, type PolicySummary, type SettlePolicyKey } from '@/lib/traces/findings'

// The cost of each policy on every recording, from the generated report.
// Steps are completed forward passes on the uniform clock; seconds are the
// raw forward-pass clock of the capture machine (about 119 ms per step on
// an M3 for a 0.6B model), which a production model would divide by ten or
// more. Neither is end-to-end latency, and none of this is a reader outcome.

const POLICIES: SettlePolicyKey[] = ['word', 'sentence', 'paragraph']

function fmt(n: number | null, digits = 0): string {
  return n === null ? '·' : n.toFixed(digits)
}
function secs(ms: number | null): string {
  return ms === null ? '·' : `${(ms / 1000).toFixed(1)} s`
}

type Scope = 'all60' | 'curated18'

export function CostTable({ scope = 'all60', className = '' }: { scope?: Scope; className?: string }) {
  const u = (p: SettlePolicyKey): PolicySummary => SETTLE[scope][p].uniform
  const r = (p: SettlePolicyKey): PolicySummary => SETTLE[scope][p].recorded
  const rows: { label: string; cell: (p: SettlePolicyKey) => string; note?: string }[] = [
    { label: 'first passage on the page', cell: (p) => `${fmt(u(p).medianFirstPassageAt)} steps · ${secs(r(p).medianFirstPassageAt)}`, note: 'median over nonempty runs' },
    { label: 'extra wait after text is in order', cell: (p) => `${fmt(u(p).meanExtraHold, 1)} steps · ${secs(r(p).meanExtraHold)}`, note: 'mean of per-run character means' },
    { label: 'of which the word rule alone', cell: (p) => `${fmt(u(p).meanWordSafeLag, 1)} steps · ${secs(r(p).meanWordSafeLag)}` },
    { label: 'forming text visible', cell: (p) => `${fmt((u(p).medianFormingShare ?? 0) * 100)}% of the run`, note: 'median share' },
    { label: 'passages per answer', cell: (p) => `${fmt(u(p).medianPassages)} · ${fmt(u(p).medianPassageChars)} characters each`, note: 'medians' },
    { label: 'most text held off the page at once', cell: (p) => `${fmt(u(p).medianMaxQueued)} · at most ${u(p).maxQueued}`, note: 'characters' },
    { label: 'exact final output', cell: (p) => `${u(p).exactFinalOutputs} of ${u(p).traces}` },
    { label: 'characters drawn before commitment', cell: (p) => `${u(p).precommitExposure}` },
  ]
  const s = u('sentence')
  return (
    <figure className={`m-0 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="text-left readout pb-4" style={{ color: 'var(--muted)' }}>
            {scope === 'all60' ? `all ${s.traces} recordings, ${s.nonemptyTraces} with content` : `the ${s.traces} curated recordings`} · three policies · the reducer&rsquo;s cost, measured
          </caption>
          <thead>
            <tr className="rule">
              <th scope="col" className="py-3 pr-4 font-medium text-sm">measure</th>
              {POLICIES.map((p) => <th key={p} scope="col" className="py-3 pr-4 font-medium text-sm">{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="rule">
                <th scope="row" className="py-3 pr-4 font-normal text-sm align-top">
                  {row.label}
                  {row.note && <span className="block readout mt-0.5" style={{ color: 'var(--muted)' }}>{row.note}</span>}
                </th>
                {POLICIES.map((p) => <td key={p} className="py-3 pr-4 readout whitespace-nowrap align-top">{row.cell(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="readout leading-relaxed mt-4 measure" style={{ color: 'var(--muted)' }}>
        a step is one completed forward pass. seconds are the capture machine&rsquo;s raw forward-pass clock for a 0.6B model, which a production model
        divides by ten or more; neither is end-to-end latency. characters are UTF-16 code units including whitespace. these are properties of the
        reducer on this corpus, never reader outcomes.
      </figcaption>
    </figure>
  )
}

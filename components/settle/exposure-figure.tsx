'use client'

import { useEffect, useMemo, useState } from 'react'
import { traceProvisionalText, type TraceCompact } from '@/lib/diffusion/traces'
import { loadTrace, type TraceId } from '@/lib/traces/index'

// The audit figure: one recording, one step. Above, what the retrospective
// reveal drew at that step: every word whose first token had committed, in
// its final spelling. Below, what the sampler had actually committed: whole
// words where every token and the following boundary were in, and a mark per
// committed token where they were not. The difference is the exposure.

type Props = { traceId: TraceId; className?: string }

function isEnd(text: string): boolean {
  return text === '<|im_end|>' || text === '<|endoftext|>'
}

/** The step at which the old reveal drew the most words it had no right to. */
function worstStep(trace: TraceCompact): { step: number; exposed: number } {
  let best = { step: 0, exposed: 0 }
  const steps = trace.step_ms.length
  for (let k = 0; k < steps; k += 1) {
    const exposed = trace.words.filter((w) => w.first_step <= k && w.lock_step > k).length
    if (exposed > best.exposed) best = { step: k, exposed }
  }
  return best
}

export function ExposureFigure({ traceId, className = '' }: Props) {
  const [trace, setTrace] = useState<TraceCompact | null>(null)
  useEffect(() => {
    let cancelled = false
    loadTrace(traceId).then((t) => { if (!cancelled) setTrace(t) }).catch(() => {})
    return () => { cancelled = true }
  }, [traceId])
  const figure = useMemo(() => {
    if (!trace) return null
    const { step, exposed } = worstStep(trace)
    const byPos = new Map(trace.tokens.map((t) => [t.pos, t]))
    const drawn = trace.words.map((w) => {
      const kind = w.lock_step <= step ? 'committed' : w.first_step <= step ? 'exposed' : 'open'
      const guess = kind === 'exposed' ? traceProvisionalText(trace, w.index, step, 0) : undefined
      return { text: w.text, kind, matched: kind === 'exposed' && guess === w.text }
    })
    const committed = trace.words.map((w) => {
      const tokens = w.tokens.map((p) => byPos.get(p)).filter((t): t is NonNullable<typeof t> => Boolean(t))
      const allIn = tokens.every((t) => t.step <= step)
      const lastPos = w.tokens[w.tokens.length - 1] ?? -1
      const next = byPos.get(lastPos + 1)
      const boundaryIn = next ? next.step <= step && (isEnd(next.text) || /^\s/.test(next.text)) : false
      const endsInSpace = tokens.length > 0 && /\s$/.test(tokens[tokens.length - 1]!.text)
      if (allIn && (boundaryIn || endsInSpace)) return { text: w.text, kind: 'committed' as const }
      const inCount = tokens.filter((t) => t.step <= step).length
      if (inCount === 0) return { text: w.text, kind: 'open' as const }
      return { text: '·'.repeat(Math.max(1, inCount)), kind: 'partial' as const }
    })
    const matched = drawn.filter((d) => d.matched).length
    return { step, exposed, matched, drawn, committed, steps: trace.step_ms.length, prompt: trace.prompt, sampler: trace.sampler.note }
  }, [trace])

  if (!figure) return <div className={`stage p-6 readout ${className}`} style={{ color: 'color-mix(in oklab, var(--stage-text) 60%, transparent)' }}>loading the recording…</div>
  const row = (words: { text: string; kind: string }[]) => (
    <p className="exposure-row m-0 text-[15px] md:text-base">
      {words.map((w, i) => (
        <span key={i}>
          <span className="exposure-word" data-kind={w.kind}>{w.kind === 'open' ? '–'.repeat(Math.min(6, Math.max(2, Math.round(w.text.length * 0.6)))) : w.text}</span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </p>
  )
  return (
    <figure className={`stage p-5 md:p-7 m-0 ${className}`} data-demo>
      <div className="settle-stage-bar readout mb-5">
        <span>{figure.prompt}</span>
        <span>{figure.sampler} · step {figure.step} of {figure.steps}</span>
      </div>
      <div className="grid gap-6">
        <div>
          <p className="readout mb-2" style={{ color: 'color-mix(in oklab, var(--stage-text) 72%, transparent)' }}>what the retrospective reveal drew · underlined words had not fully committed</p>
          {row(figure.drawn)}
        </div>
        <div className="rule pt-6" style={{ borderColor: 'color-mix(in oklab, var(--stage-text) 16%, transparent)' }}>
          <p className="readout mb-2" style={{ color: 'color-mix(in oklab, var(--stage-text) 72%, transparent)' }}>what the sampler had committed · a dot per committed token of an incomplete word</p>
          {row(figure.committed)}
        </div>
      </div>
      <figcaption className="readout mt-6 leading-relaxed" style={{ color: 'color-mix(in oklab, var(--stage-text) 72%, transparent)' }}>
        at this step the old reveal drew {figure.exposed} words in their final spelling whose tokens had not all committed; {figure.matched} of them happened to match the model&rsquo;s guess at the time. open positions are dashes. recorded run, unedited.
      </figcaption>
    </figure>
  )
}

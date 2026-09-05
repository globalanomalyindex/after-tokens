'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Section } from '@/components/section'
import { UnmaskMap } from '@/components/diffusion/unmask-map'
import { TraceStage } from '@/components/trajectories/trace-stage'
import { PromptPicker } from '@/components/coda/prompt-picker'
import { ToggleRail } from '@/components/coda/toggle-rail'
import { TRACE_IDS, TRACE_META, loadTrace, type TraceId } from '@/lib/traces/index'
import { FINDINGS, FINDINGS_HEADING, LEAD, LIMITS, LLADA, ORDER_DRAWN } from '@/lib/traces/findings'
import { PROVISIONAL_FLOOR, type TraceCompact } from '@/lib/diffusion/traces'
import type { CodaPrompt } from '@/lib/coda/fixtures'

type Config = 'lowconf-b32' | 'random-b32' | 'lowconf-b128'

const CONFIG_IDS: Config[] = ['lowconf-b32', 'random-b32', 'lowconf-b128']

const CONFIG_LABELS: Record<Config, string> = {
  'lowconf-b32': 'low-confidence, 4 blocks',
  'random-b32': 'random, 4 blocks',
  'lowconf-b128': 'low-confidence, no blocks',
}

const CONFIG_SHORT: Record<Config, string> = {
  'lowconf-b32': 'low-confidence · 4 blocks',
  'random-b32': 'random · 4 blocks',
  'lowconf-b128': 'low-confidence · no blocks',
}

// The prompt text for each of the 20 captured prompts, read once from
// data/traces/manifest.json / the compact trajectory files so this file does
// not have to load a trajectory just to label a picker.
const PROMPT_LABELS: Record<string, string> = {
  weather: "What's the weather like in metaphor land?",
  'diffusion-explain': 'Explain how diffusion text generation works.',
  'research-summary': 'Summarize the last three years of model research.',
  'heron-poem': 'Write a poem about a heron at dawn.',
  brainstorm: 'Give me a few wild ideas for naming a new color.',
  travel: 'Quick question. Should I take the train or fly?',
  'compiler-error': 'Walk me through this compiler error.',
  capital: 'What is the capital of Australia, and why do people get it wrong?',
  'concise-rewrite':
    'Rewrite this sentence to be more concise: The meeting, which was scheduled for the afternoon, has been moved to the morning by the organizers.',
  'golden-sunflower': 'What does the golden ratio have to do with sunflowers?',
  'hash-function': 'In one paragraph, explain what a hash function is to a designer.',
  'heist-plot': 'Summarize the plot of a heist movie in three sentences, without naming a real film.',
  houseplants: 'List five common houseplants that tolerate low light.',
  'lighthouse-haiku': 'Write a haiku about a lighthouse.',
  'out-of-office': 'Draft a two-sentence out-of-office reply.',
  'rust-or-go': 'Should I learn Rust or Go first? Answer briefly.',
  'sky-blue': 'Explain to a child why the sky is blue.',
  'sleep-tips': 'Give me three tips for sleeping better, one sentence each.',
  'solder-project': 'Name a good first project for learning to solder.',
  'why-out-of-order': 'Why do diffusion models generate text out of order?',
}

// Unique prompt ids in TRACE_IDS order, so the picker lists them the same way
// the underlying data does.
const PROMPT_IDS: string[] = []
for (const id of TRACE_IDS) {
  const promptId = TRACE_META[id].promptId
  if (!PROMPT_IDS.includes(promptId)) PROMPT_IDS.push(promptId)
}

const PROMPT_ITEMS: CodaPrompt[] = PROMPT_IDS.map((id) => ({
  id,
  prompt: PROMPT_LABELS[id] ?? id,
  defaultMode: 'trace',
  response: '',
}))

const PACE_ITEMS = [
  { id: '40', label: '40 ms / step' },
  { id: 'recorded', label: 'recorded pace' },
]

function traceIdFor(promptId: string, config: Config): TraceId {
  return `${promptId}__${config}` as TraceId
}

function statNum(stats: TraceCompact['stats'], key: string, fallback = 0): number {
  const v = stats[key]
  return typeof v === 'number' ? v : fallback
}

function statBool(stats: TraceCompact['stats'], key: string): boolean {
  return stats[key] === true
}

function signed(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
}

const EYEBROW = 'text-[10px] uppercase tracking-[0.18em] mb-3'
const EYEBROW_STYLE = { fontFamily: 'var(--font-mono)', color: 'var(--muted)' } as const

export function SectionTrajectories() {
  const [activePromptId, setActivePromptId] = useState('diffusion-explain')
  const [activeConfig, setActiveConfig] = useState<Config>('lowconf-b32')
  const [paceId, setPaceId] = useState<'40' | 'recorded'>('40')
  const [traces, setTraces] = useState<Map<TraceId, TraceCompact>>(() => new Map())

  const activeTraceId = traceIdFor(activePromptId, activeConfig)
  const activeTrace = traces.get(activeTraceId)
  const msPerStep = paceId === '40' ? 40 : undefined

  // Load the active trajectory.
  useEffect(() => {
    if (traces.has(activeTraceId)) return
    let cancelled = false
    loadTrace(activeTraceId).then((t) => {
      if (cancelled) return
      setTraces((prev) => {
        if (prev.has(activeTraceId)) return prev
        const next = new Map(prev)
        next.set(activeTraceId, t)
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [activeTraceId, traces])

  // Prefetch the other two configs for the active prompt once the first has
  // loaded, so the small multiples below never flash empty.
  useEffect(() => {
    if (!activeTrace) return
    for (const config of CONFIG_IDS) {
      if (config === activeConfig) continue
      const id = traceIdFor(activePromptId, config)
      if (traces.has(id)) continue
      loadTrace(id).then((t) => {
        setTraces((prev) => {
          if (prev.has(id)) return prev
          const next = new Map(prev)
          next.set(id, t)
          return next
        })
      })
    }
  }, [activeTrace, activePromptId, activeConfig, traces])

  const selectPrompt = useCallback((id: string) => setActivePromptId(id), [])
  const selectConfig = useCallback((id: string) => setActiveConfig(id as Config), [])
  const selectPace = useCallback((id: string) => setPaceId(id as '40' | 'recorded'), [])

  const stats = activeTrace?.stats
  const statRows = useMemo(() => {
    if (!stats) return []
    return [
      { label: 'order vs reading order', value: signed(statNum(stats, 'kendall_tau_step_vs_position')) },
      { label: 'mean jump', value: `${statNum(stats, 'mean_jump').toFixed(1)} positions` },
      { label: 'adjacent commits', value: `${Math.round(statNum(stats, 'adjacent_commit_fraction') * 100)}%` },
      { label: 'median confidence', value: statNum(stats, 'median_commit_conf').toFixed(2) },
      { label: 'guess changes / token', value: statNum(stats, 'mean_flips_per_token').toFixed(1) },
      { label: 'end fixed before middle', value: statBool(stats, 'tail_before_last_content') ? 'yes' : 'no' },
    ]
  }, [stats])

  return (
    <Section
      id="trajectories"
      n={3}
      act="I"
      title="What a sampler actually does"
      eyebrow={['Observed', 'Sixty recorded trajectories']}
    >
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter lowercase leading-[1.02] mb-6 max-w-4xl">
        <span className="title-index">iii.</span>what a sampler actually does
      </h2>
      <p className="text-lg md:text-xl leading-relaxed max-w-3xl" style={{ color: 'var(--ink-2)' }}>
        {LEAD}
      </p>

      <div className="mt-16 md:mt-24">
        <div className={EYEBROW} style={EYEBROW_STYLE}>
          + A recorded answer, replayed
        </div>
        <p className="text-base leading-relaxed max-w-3xl mb-8" style={{ color: 'var(--ink-2)' }}>
          The pending words show the model&rsquo;s own guess only when it clears a probability of {PROVISIONAL_FLOOR}; below that the guess is the corpus prior and would read &ldquo;the&rdquo; in every slot, so the slot shows noise instead.
        </p>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] items-start">
          <div>
            {activeTrace ? (
              <TraceStage trace={activeTrace} msPerStep={msPerStep} />
            ) : (
              <div
                className="trace-stage rounded-2xl flex items-center justify-center min-h-[420px]"
                style={{ background: 'var(--stage)' }}
              >
                <span className="trace-loading">loading trajectory</span>
              </div>
            )}
          </div>
          <aside>
            <div className={EYEBROW} style={EYEBROW_STYLE}>
              + Pick a prompt
            </div>
            <PromptPicker prompts={PROMPT_ITEMS} activeId={activePromptId} onSelect={selectPrompt} layout="list" />

            <div className="mt-6 flex flex-col gap-3">
              <ToggleRail
                label="Sampler"
                items={CONFIG_IDS.map((c) => ({ id: c, label: CONFIG_LABELS[c] }))}
                activeId={activeConfig}
                onSelect={selectConfig}
              />
              <ToggleRail label="Pace" items={PACE_ITEMS} activeId={paceId} onSelect={selectPace} />
            </div>

            {stats && (
              <dl className="mt-6 border-t" style={{ borderColor: 'color-mix(in oklab, var(--ink) 14%, transparent)' }}>
                {statRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-6 py-2.5 border-b"
                    style={{ borderColor: 'color-mix(in oklab, var(--ink) 11%, transparent)' }}
                  >
                    <dt
                      className="text-[10px] uppercase tracking-[0.16em] shrink-0"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
                    >
                      {row.label}
                    </dt>
                    <dd className="text-sm text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </aside>
        </div>
      </div>

      <div className="mt-16 md:mt-24">
        <div className={EYEBROW} style={EYEBROW_STYLE}>
          + The order, drawn
        </div>
        {activeTrace && (
          <UnmaskMap
            trace={activeTrace}
            label={`${activeTrace.prompt_id} · ${activeTrace.sampler.id}`}
          />
        )}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {CONFIG_IDS.map((config) => {
            const t = traces.get(traceIdFor(activePromptId, config))
            if (!t) {
              return (
                <div
                  key={config}
                  className="rounded-xl flex items-center justify-center aspect-square text-[9px] uppercase tracking-[0.14em]"
                  style={{
                    border: '0.8px solid color-mix(in oklab, var(--ink) 14%, transparent)',
                    color: 'var(--muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  loading
                </div>
              )
            }
            const tau = statNum(t.stats, 'kendall_tau_step_vs_position')
            return (
              <UnmaskMap
                key={config}
                trace={t}
                compact
                label={`${CONFIG_SHORT[config]} · τ ${signed(tau)}`}
              />
            )
          })}
        </div>
        <p className="mt-6 text-base leading-relaxed max-w-3xl">{ORDER_DRAWN}</p>
      </div>

      <div className="mt-16 md:mt-24">
        <div className={EYEBROW} style={EYEBROW_STYLE}>
          + What sixty trajectories show
        </div>
        <h3 className="text-2xl md:text-3xl font-bold tracking-tight lowercase leading-tight mb-8 md:mb-10 max-w-2xl">
          {FINDINGS_HEADING}
        </h3>
        <dl className="max-w-4xl" style={{ borderTop: '1px solid color-mix(in oklab, var(--ink) 14%, transparent)' }}>
          {FINDINGS.map((f) => (
            <div
              key={f.n}
              className="grid md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] gap-x-8 gap-y-2 py-6"
              style={{ borderBottom: '1px solid color-mix(in oklab, var(--ink) 14%, transparent)' }}
            >
              <dt>
                <span className="block text-base font-semibold lowercase leading-snug">{f.lead}</span>
                <span
                  className="mt-1.5 block text-[10px] uppercase tracking-[0.18em]"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: 'color-mix(in oklab, var(--section-accent) 88%, var(--ink))',
                  }}
                >
                  {f.stat}
                </span>
              </dt>
              <dd className="text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                {f.body}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 max-w-3xl">
          <div className={EYEBROW} style={EYEBROW_STYLE}>
            + Corroboration at 8B
          </div>
          <p className="text-base leading-relaxed" style={{ color: 'var(--ink-2)' }}>
            Four of the coda prompts were also run through {LLADA.model} ({LLADA.quant}) under the same {LLADA.sampler}. Commit order correlated with reading order at τ = {signed(LLADA.tau)}, with a median jump of {LLADA.meanJump.toFixed(1)} positions against roughly {LLADA.randomExpected.toFixed(0)} expected from a uniformly random order, reproducing the block-schedule pattern at {LLADA.params}. llama.cpp&rsquo;s sampler exposes commit order and timing through its step callback. It does not expose per-position confidence, so this set corroborates order and timing. The confidence findings above rest on the 0.6B data alone.
          </p>
        </div>
      </div>

      <div className="mt-16 md:mt-24 max-w-3xl">
        <div className={EYEBROW} style={EYEBROW_STYLE}>
          + Scope and limits
        </div>
        <p className="text-base leading-relaxed">{LIMITS}</p>
        <p className="mt-4 text-xs leading-relaxed" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          Data and method:{' '}
          <a
            className="underline underline-offset-4"
            href="https://github.com/globalanomalyindex/after-tokens/tree/main/data/traces"
            target="_blank"
            rel="noreferrer"
          >
            data/traces
          </a>{' '}
          and{' '}
          <a
            className="underline underline-offset-4"
            href="https://github.com/globalanomalyindex/after-tokens/blob/main/docs/research-note.md"
            target="_blank"
            rel="noreferrer"
          >
            the research note
          </a>
        </p>
      </div>
    </Section>
  )
}

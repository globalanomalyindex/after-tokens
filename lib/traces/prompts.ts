import { TRACE_IDS, TRACE_META, type TraceId } from './index'

// The prompt text for each of the 20 captured prompts, so a picker can be
// labeled without loading a trajectory. Read from data/traces/manifest.json.
export const PROMPT_LABELS: Record<string, string> = {
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

export type SamplerConfig = 'lowconf-b32' | 'random-b32' | 'lowconf-b128'
export const CONFIG_IDS: SamplerConfig[] = ['lowconf-b32', 'random-b32', 'lowconf-b128']
export const CONFIG_LABELS: Record<SamplerConfig, string> = {
  'lowconf-b32': 'low-confidence · 4 blocks',
  'random-b32': 'random · 4 blocks',
  'lowconf-b128': 'low-confidence · no blocks',
}

/** Unique prompt ids in TRACE_IDS order. */
export const PROMPT_IDS: string[] = []
for (const id of TRACE_IDS) {
  const promptId = TRACE_META[id].promptId
  if (!PROMPT_IDS.includes(promptId)) PROMPT_IDS.push(promptId)
}

export function traceIdFor(promptId: string, config: SamplerConfig): TraceId {
  return `${promptId}__${config}` as TraceId
}

export function isCurated(id: TraceId): boolean {
  return TRACE_META[id]?.curated === true
}

/** The recordings the hand audit kept (data/traces/curated.json), in TRACE_IDS order. */
export const CURATED_IDS: TraceId[] = TRACE_IDS.filter((id) => isCurated(id))

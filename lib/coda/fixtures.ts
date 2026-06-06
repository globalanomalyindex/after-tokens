import type { ModeStrategy } from '@/lib/diffusion/types'

export type CodaPrompt = {
  id: string
  prompt: string
  defaultMode: ModeStrategy['name']
  response: string
}

export const codaPrompts: CodaPrompt[] = [
  {
    id: 'weather',
    prompt: "What's the weather like in metaphor land?",
    defaultMode: 'mycelium',
    response:
      'Mild. A little fog this morning but the sun is supposed to break through by noon. Hold off on the umbrella.',
  },
  {
    id: 'diffusion-explain',
    prompt: 'Explain how diffusion text generation works.',
    defaultMode: 'mycelium',
    response:
      'Diffusion models start with noise spread across the full response area. Each pass refines the noise into more confident tokens. After a fixed number of passes, the model commits to its best estimate of the whole answer at once.',
  },
  {
    id: 'research-summary',
    prompt: 'Summarize the last three years of model research.',
    defaultMode: 'aurora',
    response:
      'Parallelism beat depth. Diffusion caught up to autoregressive on quality. Latency dropped by an order of magnitude. The interface became the bottleneck.',
  },
  {
    id: 'heron-poem',
    prompt: 'Write a poem about a heron at dawn.',
    defaultMode: 'fog',
    response:
      'Long-legged thinker, knife held loose at the throat of the river. Patience is the only spell. The fish is already yours.',
  },
  {
    id: 'brainstorm',
    prompt: 'Give me a few wild ideas for naming a new color.',
    defaultMode: 'mitosis',
    response:
      'Drift Cobalt. Folded Mango. Wet Slate at Dusk. Lemon Static. The blue your tongue tastes after biting a wire.',
  },
  {
    id: 'travel',
    prompt: 'Quick question. Should I take the train or fly?',
    defaultMode: 'mycelium',
    response:
      'For under four hours of total travel, take the train. Door to door it usually wins, and you can actually work the whole way.',
  },
  {
    id: 'compiler-error',
    prompt: 'Walk me through this compiler error.',
    defaultMode: 'mycelium',
    response:
      'The type system caught a mismatch between what the function returns and what the caller expects. Look at the return statement on line 14 and the variable type on line 22. They disagree.',
  },
]

import type { ModeStrategy } from '@/lib/diffusion/types'

export type CodaPrompt = {
  id: string
  prompt: string
  defaultMode: ModeStrategy['name']
  response: string
  /** a short pill label, for a compact picker with many entries */
  short?: string
  /** a small tag beside the label, e.g. 'looped' */
  badge?: string
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
      'Masked diffusion language models begin with masked positions, predict many positions during each denoising step, and may re-mask uncertain positions before the final sequence is returned.',
  },
  {
    id: 'research-summary',
    prompt: 'Summarize the last three years of model research.',
    defaultMode: 'aurora',
    response:
      'Recent masked diffusion research showed that high-quality language generation does not have to be exclusively left-to-right. That opens a new interface question: how should an iterative, non-sequential answer arrive?',
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
      'Five to start with:\n1. Drift Cobalt\n2. Folded Mango\n3. Wet Slate at Dusk\n4. Lemon Static\n5. The blue your tongue tastes after biting a wire',
  },
  {
    id: 'travel',
    prompt: 'Quick question. Should I take the train or fly?',
    defaultMode: 'mycelium',
    response:
      'For under four hours of total travel, take the train. Door to door it usually wins, and you can actually work the whole way.',
  },
  {
    id: 'heist-plot',
    prompt: 'Summarize the plot of a heist movie in three sentences, without naming a real film.',
    defaultMode: 'mycelium',
    response:
      'A crew of retired thieves is hired to empty a vault that has never been opened. The heist runs perfectly until the alarm that should have sounded stays silent, and the crew realizes the job was bait. The twist is that the vault was empty all along, and the real theft is the crew itself.',
  },
  {
    id: 'compiler-error',
    prompt: 'Walk me through this compiler error.',
    defaultMode: 'mycelium',
    response:
      'The type system caught a mismatch between what the function returns and what the caller expects.\n1. Read the return statement on line 14.\n2. Read the variable type on line 22.\n3. They disagree; decide which one is right and change the other.',
  },
]

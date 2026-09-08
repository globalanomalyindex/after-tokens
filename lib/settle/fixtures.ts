import type { Replay, SettleEvent } from './types'

// Authored recordings that exercise the contract's edges: a qualification
// that arrives late, a missing middle, a list, code, a short answer, an empty
// completion, a stop, an error, a revision. Their timing is synthetic and
// each says so. They demonstrate behavior; they estimate nothing.

const provenance = 'authored demonstration · synthetic event timing; not a model recording'

function authored(id: string, label: string, events: SettleEvent[], bound?: number): Replay {
  return { id, label, provenance, events, durationMs: events.at(-1)?.atMs ?? 0, ...(bound ? { bound } : {}) }
}

export const DEMO_REPLAYS: Replay[] = [
  authored('qualifier', 'a qualification arrives', [
    { type: 'commit', atMs: 350, tokens: [{ position: 0, text: 'The change is ready to ship' }] },
    { type: 'commit', atMs: 1050, tokens: [{ position: 1, text: ', but only if the migration has ' }] },
    { type: 'commit', atMs: 1850, tokens: [{ position: 2, text: 'not removed existing records. ' }] },
    { type: 'commit', atMs: 2900, tokens: [{ position: 3, text: 'Keep a backup until the checks pass.' }] },
    { type: 'finish', atMs: 3400, tokenCount: 4 },
  ], 4),
  authored('delayed-middle', 'a missing middle', [
    { type: 'commit', atMs: 350, tokens: [{ position: 0, text: 'A stable opening. ' }] },
    { type: 'commit', atMs: 900, tokens: [{ position: 2, text: 'not available yet. ' }] },
    { type: 'commit', atMs: 1400, tokens: [{ position: 3, text: 'Now the whole passage can be read.' }] },
    { type: 'commit', atMs: 2700, tokens: [{ position: 1, text: 'The middle was ' }] },
    { type: 'finish', atMs: 3100, tokenCount: 4 },
  ], 4),
  authored('split-word', 'a word in two pieces', [
    { type: 'commit', atMs: 300, tokens: [{ position: 0, text: 'The answer is' }] },
    { type: 'commit', atMs: 800, tokens: [{ position: 1, text: ' Sapp' }] },
    { type: 'commit', atMs: 1700, tokens: [{ position: 3, text: ' Blue' }] },
    { type: 'commit', atMs: 2400, tokens: [{ position: 2, text: 'hire' }] },
    { type: 'commit', atMs: 2900, tokens: [{ position: 4, text: '.' }] },
    { type: 'finish', atMs: 3300, tokenCount: 5 },
  ], 5),
  authored('list', 'a list stays together', [
    { type: 'commit', atMs: 350, tokens: [{ position: 0, text: '1. Save a local copy.\n' }] },
    { type: 'commit', atMs: 1100, tokens: [{ position: 1, text: '2. Check the exported file.\n' }] },
    { type: 'commit', atMs: 1850, tokens: [{ position: 2, text: '3. Keep the original until approval.\n\n' }] },
    { type: 'commit', atMs: 2600, tokens: [{ position: 3, text: 'All three steps matter.' }] },
    { type: 'finish', atMs: 3100, tokenCount: 4 },
  ], 4),
  authored('code', 'code without partial lines', [
    { type: 'commit', atMs: 350, tokens: [{ position: 0, text: '```js\n' }] },
    { type: 'commit', atMs: 900, tokens: [{ position: 1, text: 'const ready = checks.every(Boolean);\n\n' }] },
    { type: 'commit', atMs: 1700, tokens: [{ position: 2, text: 'if (ready) {\n  saveCopy();\n}\n' }] },
    { type: 'commit', atMs: 2400, tokens: [{ position: 3, text: '```\n\n' }] },
    { type: 'commit', atMs: 2900, tokens: [{ position: 4, text: 'The block is held until its closing boundary arrives.' }] },
    { type: 'finish', atMs: 3500, tokenCount: 5 },
  ], 5),
  authored('short-answer', 'a short answer', [
    { type: 'commit', atMs: 500, tokens: [{ position: 0, text: 'Yes' }] },
    { type: 'commit', atMs: 1100, tokens: [{ position: 1, text: ', after review.' }] },
    { type: 'finish', atMs: 1500, tokenCount: 2 },
  ], 2),
  authored('empty', 'an empty completion', [
    { type: 'commit', atMs: 400, tokens: [] },
    { type: 'finish', atMs: 1300, tokenCount: 0 },
  ]),
  authored('source-stop', 'the source stops', [
    { type: 'commit', atMs: 450, tokens: [{ position: 0, text: 'The first check passed. ' }] },
    { type: 'commit', atMs: 1300, tokens: [{ position: 1, text: 'The second check is still' }] },
    { type: 'stop', atMs: 2300 },
  ], 4),
  authored('source-error', 'the source reports an error', [
    { type: 'commit', atMs: 450, tokens: [{ position: 0, text: 'A local copy is saved. ' }] },
    { type: 'commit', atMs: 1300, tokens: [{ position: 1, text: 'The upload has' }] },
    { type: 'error', atMs: 2300, message: 'The recorded source disconnected before completion.' },
  ], 4),
  authored('later-revision', 'a final answer is revised', [
    { type: 'snapshot', atMs: 350, text: 'The review is complete.', final: false },
    { type: 'snapshot', atMs: 850, text: 'The review is complete.', final: false },
    { type: 'snapshot', atMs: 1400, text: 'The review is complete. Two items are approved.', final: false },
    { type: 'snapshot', atMs: 2200, text: 'The review is complete. Two items are approved.', final: true },
    { type: 'revision', atMs: 3500, text: 'The review is complete. One item is approved; the second needs changes.' },
  ]),
]

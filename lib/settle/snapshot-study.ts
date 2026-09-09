import type { Replay } from './types'

/** Authored compatibility exercise, not a captured Gemini event stream.
 * A plausible-looking draft remains provisional until an explicit final flag. */
export const SNAPSHOT_STUDY_ANSWER = `The result is 39.

1. Take the square root: √81 = 9.
2. Multiply: 9 × (2/3) = 6.
3. Square that result: 6² = 36.
4. Subtract: 15 − 3 = 12.
5. Square the denominator: 2² = 4.
6. Divide: 12 ÷ 4 = 3.
7. Add the two parts: 36 + 3 = 39.`

export const SNAPSHOT_STUDY: Replay = {
  id: 'authored-revisable-snapshots-v1',
  label: 'A draft that changes its mind',
  provenance: 'Authored snapshot compatibility exercise; no measured model timings or Gemini API events.',
  durationMs: 4200,
  events: [
    { type: 'snapshot', atMs: 400, final: false, text: 'The result is 36.\n\n1. Take the square root: √81 = 9.\n2. Work through both parts of the expression.' },
    { type: 'snapshot', atMs: 1100, final: false, text: SNAPSHOT_STUDY_ANSWER.replace('The result is 39.', 'The result is 36.').replace('36 + 3 = 39.', '36 + 3 = 36.') },
    { type: 'snapshot', atMs: 1900, final: false, text: SNAPSHOT_STUDY_ANSWER.replace('36 + 3 = 39.', '36 + 3 = 36.') },
    { type: 'snapshot', atMs: 2900, final: false, text: SNAPSHOT_STUDY_ANSWER },
    { type: 'snapshot', atMs: 4200, final: true, text: SNAPSHOT_STUDY_ANSWER },
  ],
}

# Ambient answer: release verification

9 September 2026. This checkpoint covers the implemented ambient composition and whole-answer revision based on `47d71a4383693fdeea6e39426524d365f94ac3e6`. It records completed local checks. The commit-specific GitHub Actions deployment and the delivered live-verification report establish publication status; this document does not anticipate a successful deployment.

## Completed checks

| Check | Observed result | Scope |
| --- | --- | --- |
| Lint and TypeScript | Pass, zero reported errors | Existing project configuration |
| Unit and component tests | 268 tests across 40 files pass | Causal policies, original 60 exact outputs, retained historical costs, actual DOM, interruptions, seven whole-answer surface lifecycle tests, four experimental adapter fixtures |
| Full browser suite | 42 checks pass | 14 each in Chromium, WebKit and iPhone 14 emulation; axe accessibility checks, reduced motion, responsive controls, exact text, positive-size moving bars, source switches, persistent phase, one-time completion |
| Normal production build | Pass | Next.js 16.2.6, local Node 24 |
| GitHub Pages production export | Pass | `/after-tokens` base path; static export |
| Exported-page replay | Pass | Chromium at 390 × 844; real list and dynamically imported explanation reach exact final answers; five positive-size bars; 20 initial script/style references use the correct prefix; no browser errors |
| Exported videos | Both HTTP 200 with exact source hashes | 245,520-byte short-answer and 361,285-byte long-answer WebM recordings |
| New capture validation | Both capture sets pass | Four actual 32-step, four-position-per-step captures; online candidate provenance and exact decode checked; bad answers retained |
| Source replay and structure audits | Pass | Future metadata throws if read by the audited replay; original corpus unchanged; formatting timing classified retrospectively for analysis only |
| Independent code review | Five medium findings corrected | No new critical or high-severity issue in the reviewed paths; integrated lifecycle regressions pass |
| Motion observations | Eight sequential Chromium observations complete | Fresh loaded CSS, two viewport widths, three primary conditions, additional long and poor answers |

The last full browser run followed a development-server restart. An earlier stylesheet cache served outdated CSS, which could leave the new bar nodes dimensionless. Final tests explicitly require five positive-size bars and actual transform variation in moving conditions, preventing a blank surface from passing as stable motion. Measurements and distributed videos come from the corrected, frozen implementation.

## Rendering evidence

All eight observations produced one nonempty answer update, no pre-final answer text, exact final text, and no blurred, faded or transformed readable glyphs. Across 9,667 matched first-character samples of final whitespace words, measured displacement after arrival was 0 px. This is sampled geometry after whole-answer release, not a claim about perceived smoothness or a statistical reader result.

The short answer retained its 120 px loading allocation. The long explanation increased the answer frame from 120 to 219.375 px once at finality: **99.375 px of final growth**. The largest measured primary bar rectangle-edge change between adjacent samples was 0.5663 px. The maximum observed frame gap was 18.8 ms on this machine. Rectangle edges are not the feathered ink's perceptual boundary, and these diagnostic runs do not establish physical-device performance.

Source eligibility and final text first appeared in the same sampled animation frame. The report calls this zero sampled-frame delay; it does not mean zero display or compositor latency.

## Authoritative artifacts

- [Rendering report and metric definitions](ambient-motion-validation-2026-09-09.json)
- [Eight compressed raw logs, implementation/source hashes and recording manifest](../data/experiments/ambient-motion-2026-09-09/manifest.json)
- [Exported-page browser and video verification](ambient-pages-export-verification-2026-09-09.json)
- [Whole-answer availability cost on the original corpus](../data/experiments/answer-policy-cost-2026-09-09.json)
- [New source captures and validation instructions](../data/experiments/README.md)
- [Independent review and final integration disposition](ambient-code-review-2026-09-09.md)
- [Current implementation handoff](ambient-handoff-2026-09-09.md)
- [Research rationale and proposed reader study](field-experiment-2026-09-09.md)

## Boundaries that remain visible

No participant study, physical iPhone test, actual screen-reader session, battery/GPU benchmark or novelty-priority review has been completed. Automated accessibility and browser emulation are narrower checks. The independent-motion comparator changes deterministic periods, which also changes velocity and short-run average appearance; it is not a perfectly isolated coherence manipulation.

Whole-answer presentation deliberately withholds earlier readable text. On 57 nonempty original traces, its paired median extra wait over sentence release is 10,473.6 ms on the synchronized forward-pass clock. This is not API latency or a measured reader tolerance. The current design is an implemented, source-grounded motion study whose human benefits still need testing.

For subsequent edits, rerun the affected checks and regenerate measurements whenever source timing or measured rendering code changes. Preserve measurement timestamps and hashes; never relabel old observations as results for new code.

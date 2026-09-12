# Gemini Diffusion: visual-reference audit

**9 September 2026 · frame inspection, not a model benchmark or an inference trace.**

The reference sequence shows text appearing and then changing at separated locations inside an answer. It is a useful reference for distributed revision. It does not demonstrate that an application receives irreversible word events, knows the final format early, or can measure completion from the blue treatment.

## Provenance and inspection

- My frame archive: `ezgif-18fb6817c2bb0c99-jpg.zip`, **896,229 bytes**, **45 JPEG entries**.
- Archive SHA-256: `36a7f214865e7c276309b7546694d3bb8db09500040bce321cd4aafe8fbc0ec7`.
- Extracted names: `ezgif-frame-001.jpg` through `ezgif-frame-045.jpg`; **45 images, all 1920 × 1080**, totaling **1,342,288 bytes**.
- Frames **12–45** were individually inspected in sequence. This audit uses visible pixels and file metadata, without executing image content, reconstructing unseen frames or interpreting the sequence as logged source events.
- The reference carries Gemini Diffusion branding. No original video URL, inference log, timestamps, frame rate or slowdown factor accompanied this archive. Frame numbers establish order only; ZIP/JPEG metadata does not establish elapsed generation time.

The site includes byte-for-byte copies of three selected frames. Their SHA-256 values are:

| Archive frame | Site copy | SHA-256 |
| --- | --- | --- |
| 014 | [frame-014.jpg](../public/study/google-reference/frame-014.jpg) | `3604b15843583b759dd391de71170646899351bfc7c837de74acfa7810109775` |
| 035 | [frame-035.jpg](../public/study/google-reference/frame-035.jpg) | `32b49fa8c7daa1ca3c14692517093d303321c535699df0fa657d99b68dcf1388` |
| 045 | [frame-045.jpg](../public/study/google-reference/frame-045.jpg) | `c9a974abea013179b8466623485d2d2e420bbe62f0b4899db96b6c993076e9bd` |

## What the frames show

| Frames | Visible observation | Limit and design implication |
| --- | --- | --- |
| 12–13 | The prompt panel is visible while the answer area is empty. The label “Real time output” appears below the answer panel by 13. | A label in a presentation is not a timestamp. An empty region can precede text, but its dimensions do not prove the application knows the answer’s final layout. |
| 14 | Only the upper solution is populated. Blue fragments and repeated-looking text occur around the first two numbered items; much of the lower area remains empty. | The complete final seven-item structure is not already visible here. Avoid claiming the whole final layout always arrives before lexical content. |
| 15–27 | A complete-looking answer with seven numbered steps and a final equation remains visible. The inspected frames show no obvious changes to the body wording. | Apparent stability across archived images is not an irreversible-commitment guarantee. Sampling, presentation editing and finality are unknown. |
| 28–32 | The answer card tilts through a presentation transition. The lower label changes from “Real time output” to “Slowed down output,” while a complete-looking answer remains visible during the transition. | Treat these as differently labeled presentation sequences. Do not count the transition as uninterrupted inference or assume the next changed answer revises an already committed result. |
| 33–34 | The slowed sequence shows blue fragments in multiple separated rows. The top answer changes from 49 in 33 to 39 in 34. Lower list material becomes more complete; the bottom concluding expression is not yet present. | Supports distributed visual revision and changing text extent. Blue has no accompanying legend establishing “uncommitted,” and white does not establish “final.” |
| 35–37 | Blue changes occur in several list headings. Item 5 changes through different labels for the same operation. A concluding expression appears and changes length. In 35 the top result is 39 while the concluding expression ends in 36. | A nearly complete-looking draft can contain inconsistency. Neither a polished layout nor a settling animation should imply factual correctness. The final text extent is still changing. |
| 38–40 | Wording changes in separated numbered items, especially 4 and 6, while much of the list retains its placement. The concluding expression also varies. | A stable reading margin can coexist with local revisions. Exact future word widths, final wrapping and item-level completion cannot be inferred from this visual organization. |
| 41–42 | In 41, a leading `1` is visible before the answer heading while the first list marker appears to lack its numeral. By 42 the markers return to their expected positions; other blue fragments remain. | The cause is unknown, but these pixels do not support a universal claim of stable formatting throughout refinement. |
| 43–45 | Blue emphasis diminishes; the last two archived images show the complete-looking answer without salient blue changes. | These are endpoint-looking images, not an explicit source finish event. Completion must come from the integration’s event contract. |

## Independent primary-source context

Google’s [20 May 2025 launch note](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-diffusion/) introduces Gemini Diffusion as an experimental research model. The [current model overview](https://deepmind.google/models/gemini-diffusion/), checked 9 September 2026, describes block generation and iterative error correction. It does not document an irreversible-position streaming contract or guaranteed early final formatting. Its AI Studio API methodology refers to the Flash-Lite benchmark comparator, not a Gemini Diffusion revision API.

Google’s separate [DiffusionGemma explanation](https://ai.google.dev/gemma/docs/diffusiongemma/explained), updated 10 June 2026, documents revision within a 256-token canvas and sequential appending of finalized canvases. That is useful evidence that diffusion can combine within-block parallel refinement with between-block sequential generation. It describes **DiffusionGemma**; this audit does not assign that architecture or block size to the Gemini Diffusion reference.

## Consequences for After Tokens

The useful design direction is a field that can absorb distributed changes without asking the reader to track every unstable word. Keep the paragraph margin and typographic rhythm legible; do not turn arbitrary decorative cells into claims about exact tokens, line breaks, confidence or percentage complete. A waiting field can react to a coarse estimate from currently available content while keeping its individual shapes authored.

The source capability determines what is available to estimate. Irreversible position events can support a committed-content estimate. If a real integration exposes revisable snapshots, their current text can support a provisional size estimate without becoming readable output or being promoted to committed tokens. A final-only integration still needs a neutral initial allocation. The full final page can be measured only once the final answer arrives; an already policy-eligible passage can be measured earlier. A short final-size handoff cannot guarantee that earlier estimates were correct.

The three-frame inspector is a qualitative source reference. Any authored revision example next to it must disclose its invented events and clock, and must not be presented as a replay of Google’s API or measured timings. This archive supplies no throughput estimate, perceived-wait result, comprehension result, comparative superiority claim or evidence of first invention. See the [current motion rationale and implementation handoff](responsive-skeleton-v6-handoff-2026-09-09.md) for the project’s own contracts and testable claims.

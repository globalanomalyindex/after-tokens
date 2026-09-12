# After Tokens — a spacious horizontal case study

## Direction
I translate the dark, type-heavy reference into a fullscreen presentation. Every example gets the clarity and generous scale of the cinematic introduction. Near-black warm surfaces, large UI type, translucent navigation, restrained edge sheen, and quiet previous/next slide silhouettes establish continuity. The answer itself stays sharp.

## Sequence
1. Existing authored cinematic introduction, on every load.
2. Same source: After Tokens left, raw prefix right.
3. Each sentence: the signature default.
4. Each word: ink settles in place without flying pills.
5. Whole answer: one material handover after finality.
6. Brand voices: the same renderer with different surfaces.
7. An actual diffusion recording, labeled separately from authored material.
8. Stability: move the wait, preserve readable words; still/breathe/reshape comparisons.
9. Research: concise source-backed findings and their limits.
10. Cost: source eligibility, fitting and handover are different quantities.
11. Limits and an honest reader-study proposal.
12. Sources, full study, code, and Christopher Robin Fiore attribution.

## Implementation contract
The presentation composes the existing reducer, useReplay, SettleAnswer and HeroIntro. It does not replace source eligibility or duplicate the text engine. Only the active slide's demonstration plays. A returning slide starts a new replay. The existing article remains available through `?view=reading`, including original section hashes, data, citations and controls. The default route presents slides.

Every After Tokens reply owns its percentage pill in its bottom-right status row. Baselines never get a pill. Numbers describe known playback duration, not a live inference estimate. Source completion and visual readiness control the 100% exit.

## Interaction
Wheel/trackpad gestures move one slide at a time, with a quiet-period latch that rejects momentum repeats. Scrollable answers and long research panels consume scrolling first. Previous/next buttons, a compact chapter index, left/right keys, and touch swipes provide alternatives. Controls retain native keyboard behavior. Slides never auto-advance. The intro keeps Skip and reduced-motion support.

Cursor movement affects only a low-opacity glass edge highlight, using CSS variables and no React state updates. Touch and reduced-motion preferences disable this response. The main slide transition uses opacity and a small horizontal movement, not a 3D flip. Text remains selectable.

## Research basis
Apple's materials guidance locates Liquid Glass in navigation above content; this is a web interpretation, not Apple's rendering implementation: https://developer.apple.com/design/human-interface-guidelines/materials
WAI's carousel pattern informs named previous/next controls and announcements; it does not justify forced auto-rotation: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
Existing evidence and explicit uncertainty remain intact. No new claim about reading comprehension, dopamine, or measured preference follows from the redesign.

## Acceptance
Large readable answer text on desktop and mobile; no clipping at 320px; After Tokens precedes baselines in DOM and layout; one slide per wheel gesture; controls and inner scrolling work; keyboard and touch navigation work; URLs restore slide/reading selection; reduced motion removes decorative travel; active demos pause on document visibility changes; exact final answers are preserved; full article links and references remain usable; no accessibility violations or runtime errors in tested flows.

## Example and brand refinement

Use distinct existing full-study fixtures for qualifier, split-word, list, delayed-middle and code. Keep SHOWCASE_REPLAY only in the initial comparison. Use curated travel__lowconf-b32 for the actual recording and generic stage default, replacing the excluded heron loop without deleting historical corpus evidence. Sentence, word, whole-answer, recording and code chapters use full-width side-by-side panels. Spectrum is a new contained gradient wash behind solid ink. Cycle Spectrum, original, Felt and Pulse after source completion plus a 2.4-second reading beat; pause cycling for manual selection, paused playback, hidden documents and reduced motion. Never advance chapters automatically.

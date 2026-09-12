# Horizontal presentation implementation

1. Preserve the current article in `components/presentation/reading-study.tsx`, rendered through the existing route when `?view=reading` is selected. Keep renderer tests exercising this view; add separate presentation navigation tests.
2. Add `presentation-demo.tsx`: shared replay clock, large SettleAnswer, optional raw prefix, compact functional settings, playback controls, real-recording loading/error state, in-reply percentage and brand choices. Default to sentence/reshape.
3. Add `case-study-experience.tsx` and its CSS module: twelve authored slides, fullscreen shell, accessible buttons/chapter index, gesture latch, keyboard/touch routing, cursor edge sheen, reading-view switch, URL restoration and reduced-motion fallback.
4. Reuse HeroIntro for the opening. Preserve its all-reload behavior and skip controls; avoid competing wheel navigation while its dialog is open.
5. Build and inspect desktop/mobile. Exercise each policy, comparison order, font/pill placement, wheel momentum, inner scrolling, keyboard, swipe, reader links, reduced motion, and source completion. Run renderer regression and accessibility checks; fix actual failures before publishing.
6. Update case-study handoff and metadata to describe the presentation. Commit and push as globalanomalyindex only after the rendered result and required checks pass. Retain frozen earlier evidence without relabeling it as validation of this redesign.

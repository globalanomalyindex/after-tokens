# After tokens.

**Design spec for a portfolio piece exploring UI animation for AI text diffusion**

| | |
|---|---|
| Date | 2026-05-27 |
| Status | Design locked, ready for implementation planning |
| Author | Chris Fiore (product designer / design engineer) |
| Portfolio theme | Looking to nature for answers |

---

## 1. Overview

A single-page editorial scrollytelling case study that argues AI text-generation animation should communicate the shape of the answer, not merely the fact that text is arriving. The page is its own argument: the explanatory text itself renders using four nature-derived diffusion animation languages, each mapped to a specific response behavior. The case study closes with an interactive coda that lets visitors try the system across four sample brand identities, demonstrating that the same animation primitives bend cleanly across brand voices.

The piece exists for two audiences. The primary audience is hiring managers and design leads at AI-product companies; the piece demonstrates a working design-engineering practice that sees an emerging product problem and ships a defensible answer. The secondary audience is the design community; the piece contributes a frame ("animation as response-type metadata") to the conversation about post-token UX.

Single deliverable: a Next.js web page at a vanity URL, including a curated interactive coda. No video, no separate prototype, no separate case study document. The medium is the message.

---

## 2. Problem

Token-by-token streaming is the visual contract that taught users to recognize AI. The blinking cursor, the left-to-right reveal, the message bubble that grows downward, the streaming sentinel that hangs at the end of a partial line. Every chat-UI affordance quietly assumes sequential token arrival.

Diffusion-based text generation does not work that way. A diffusion model resolves a full response in a single pass, refining over multiple denoising iterations, with confidence building in parallel across the whole response surface. The right rendering animation is not faster left-to-right; it is something else entirely.

Three specific UI conventions break:

1. **The cursor sentinel.** A blinking caret at the end of a partial line implies "more text is coming, sequentially." Diffusion has no insertion point.
2. **Pre-allocated message bubbles that grow.** The bubble's vertical growth tracks token count. Diffusion bubbles either pop into full size or grow non-monotonically as the model resolves tokens out of order.
3. **The streaming-arrival mental model.** Users learn to read partial outputs as "trustable so far." Under diffusion, every token on screen is provisional until the final pass. The user's reading model needs to shift.

Without intentional animation language, diffusion text either feels broken (text mutates after the user starts reading) or feels magical-in-a-bad-way (response just appears, no sense of process). Both undersell what is genuinely a paradigm shift in latency, parallelism, and answer construction.

---

## 3. Thesis

Animation should signal the shape of the answer.

Diffusion gives the rendering moment back to the designer. Token streaming forced a single animation pattern on every response; diffusion frees the surface to communicate something about the response itself. The system in this case study uses four nature-derived animation languages, each mapped to a class of response behavior, so that the way an answer arrives is metadata about what kind of answer it is.

The biological frame: many species use the same underlying biology (cellular machinery, organ systems, sensory plans) expressed in radically different bodies. The same is true of brand. A single animation system, expressed across four brand identities, demonstrates that this is a generalizable design pattern, not a one-off art project.

---

## 4. Deliverable

A single long-scroll Next.js page at a vanity URL (suggested: `aftertokens.design` or similar). The page contains:

- Editorial scrollytelling case study (sections 01 to 09)
- Interactive coda (section 10) with curated prompts and live mode/brand toggles
- Closing reflection (section 11)

No separate video, no separate written case study, no separate prototype. One artifact, one argument.

---

## 5. Narrative arc

Five acts, eleven sections. Each section is tagged with the mode that renders its own copy. The mode-to-section assignment is intentional: the medium reinforces the message of that section.

### Act I. The Problem

| 01 | Hook | no diffusion |
|---|---|---|
| | Token-by-token streaming animates the headline in, then visibly breaks halfway through. The reader feels the wrongness before they read a word. Hard cut to the static, resolved headline. | |

| 02 | Primer | fog |
|---|---|---|
| | What diffusion text generation is, in 60 seconds of reading. Atmospheric rendering matches an introductory tone. | |

| 03 | The broken assumptions | murmuration |
|---|---|---|
| | Three quiet chat-UI conventions that secretly require sequential tokens (cursor, growing bubble, streaming sentinel). Murmuration rendering shows tokens swarming into formation, demonstrating non-sequential resolution while explaining it. | |

### Act II. The Frame

| 04 | Thesis | aurora |
|---|---|---|
| | Where the design argument lands. Nature as the lens; subconscious pattern recognition as the leverage. Aurora rendering matches the "this is the final shape" feeling of stating the thesis. | |

### Act III. The Four

| 05 | Murmuration, the conversational default | murmuration |
|---|---|---|
| | Demoed as the medium of its own description. Hypnotic, brand-anchoring, "AI thinking out loud." | |

| 06 | Mycelium, for explanatory responses | mycelium |
|---|---|---|
| | Demonstrates how connection-mapping animation reinforces educational and analytical content. | |

| 07 | Fog, for creative and exploratory answers | fog |
|---|---|---|
| | Stylization range introduced here. Foreshadows the brand-variation argument by showing how palette can tint a single mode. | |

| 08 | Aurora, for summaries and distillations | aurora |
|---|---|---|
| | Sweeping bands resolve the answer. Reads as "this is the final shape." Minimalist counterpoint to murmuration. | |

### Act IV. The System

| 09 | Same biology, different species | murmuration in 4 variant brands |
|---|---|---|
| | The murmuration mode rendered across the four variant brands (Halcyon, Felt, Pulse, Voltage), shown in a 2x2 grid. The case study's own brand is not included in the gallery; the contrast is between the four variants. The convergent-evolution metaphor lands the argument that this is a system, not a one-off. | |

| 10 | Interactive coda | visitor choice |
|---|---|---|
| | Six curated prompts. Mode toggle + brand toggle. No free input. Recruiter-friendly tactile moment. | |

### Act V. The Close

| 11 | Limitations, open questions, credits | no diffusion |
|---|---|---|
| | What is still unsolved (real classification at scale, accessibility tradeoffs, deeper user testing). Designer credit. Static rendering to signal end of argument. | |

---

## 6. Visual design language

The look: polymer printed on bone. Hyperpolished surfaces with intentionally unpolished graphic application, the way vinyl decals look on military equipment. Registration crosshairs and alignment lines earn their place by serving the layout grid. No fake-hacker decoration, no barcodes, no random alphanumeric code strings.

### 6.1 Palette

| Role | Token | Value |
|---|---|---|
| Surface | `bone` | `#EBE7DA` |
| Surface tint | `bone-2` | `#E2DCCB` |
| Ink (text) | `ink` | `#15140F` |
| Ink secondary | `ink-2` | `#2A2820` |
| Muted | `muted` | `#6C685C` |
| Stage (dark inserts) | `stage` | `#0B0A08` |
| Stage text | `stage-text` | `#EBE7DA` |
| Accent | `accent` | `#1D3FD9` (cobalt) |

OKLCH preferred for runtime computation; hex shown for spec clarity. No pure `#000000` or `#FFFFFF` anywhere. Every neutral is tinted toward warm-bone hue.

Page theme is locked: bone surface throughout the whole page. Stages are not theme flips; they are dark image-like inserts that frame the animation work, similar to photographs in a magazine spread.

### 6.2 Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Display | PP Neue Montreal | 700 | Tight tracking (`-0.04em`), short line heights (`0.92` to `0.98`) |
| Body | PP Neue Montreal | 400 | `1.5` line height, `65ch` max measure |
| Mono labels | Berkeley Mono (or JetBrains Mono fallback) | 500 | Uppercase with `0.16em` letter-spacing for registration labels |

Self-hosted via `next/font`. No Google Fonts via `<link>`. The case study's primary brand uses no serif (the brief is design-engineering, not editorial-print). Variant brands in section 8 may use serif when their identity calls for it; the Halcyon variant intentionally does.

Display sizes: hero headline `64px+`, section headlines `38-48px`, body `14-16px`, mono labels `9.5-10.5px`. All sizes scale on mobile via `clamp()`.

### 6.3 Surface treatment

- **Registration crosshairs (`+`)** at the four corners of every major stage and at section-boundary corners of the page itself. Treated as functional alignment hardware, not decoration. Single hairline weight (`0.5-1px`), `~75%` opacity.
- **Alignment hairlines** along the page's top, bottom, and right safe-area edges at `12%` opacity, holding the grid visually.
- **Architectural section numerals** ("00", "01", through "11") set at `~200-280px` font-size, `5%` opacity, anchored bottom-right of each section. Hold the page's vertical rhythm and reinforce the spec/blueprint quality.
- **Surface texture** via two extremely subtle radial-gradient noise overlays. No CSS noise plugin; no JPEG grain images. The texture must remain unrenderable at 100% zoom in a screenshot.
- **No drop shadows, no glassmorphism, no gradients on the bone surface.** All gradient and motion energy is contained inside the dark stages.

### 6.4 Motion principles

- All UI transitions use custom ease-out cubic curves. Default: `cubic-bezier(0.23, 1, 0.32, 1)` (strong ease-out).
- UI durations: button feedback 100-160ms, tooltips 125-200ms, dropdowns/toggles 150-250ms, stage entry 200-400ms.
- Animation durations for diffusion modes (the long ones) are documented per mode in section 7. They are longer than typical UI because they ARE the content, not the chrome.
- Buttons scale `0.97` on `:active` with a `160ms` transition.
- Never animate `width`, `height`, `padding`, or `margin`. Only `transform` and `opacity` (and `filter: blur()` for fog and entering states only).
- Never `transform: scale(0)`. Entry animations start from `scale(0.95)` plus `opacity: 0`.
- Asymmetric enter/exit: stage entries are slow and deliberate (the diffusion is the point); user-triggered exits or scrubs are fast (200ms).

---

## 7. The four modes

Each mode is a strategy module under `lib/diffusion/modes/{murmuration,mycelium,fog,aurora}.ts`. Each implements a common `ModeStrategy` interface defined in section 10.

### 7.1 Murmuration

**Trigger:** conversational / general / default.

**Visual character:** Each word pre-exists as a small cluster of 8-12 scattered particles positioned roughly above where the word will land, jittered within a small bounding box. When the word resolves, the cluster collapses into solid type while the type fades from particle-form into ink. A faint trail follows fast-moving particles.

**Resolution order:** Center-out from the response area's geometric center, with overlapping bursts. Approximately three to five words resolve simultaneously at any moment.

**Timing:**
- Total duration per paragraph: 1.2 to 1.6 seconds
- Per-word resolution: 240 to 320ms
- Stagger between words: 30 to 50ms

**Tech:** DOM-based. Each word is a `<span>` containing a particle layer (absolutely positioned `<span>` children) and a text layer. Particles animated via `transform` only. Particle count capped at 12 per word, and ~80 total visible on screen at any moment.

**Reduced-motion fallback:** All particles drop. Words fade in over 200ms total with a 20ms stagger across the response.

### 7.2 Mycelium

**Trigger:** explanatory, analytical, walk-me-through, explain-this.

**Visual character:** 2 to 3 seed points appear at strategic positions in the response area (where key concept words will land). Branching SVG paths grow outward from each seed using `stroke-dasharray` reveal. Words materialize at path endpoints when reached. After all words have resolved, the branches fade out over 400ms, leaving only ink.

**Resolution order:** Seeds first, then concept words near seeds, then connecting words in branch order.

**Timing:**
- Total duration: 1.5 to 2.0 seconds
- Branch growth: 600 to 900ms
- Word reveal at endpoint: 200ms
- Branch fade-out tail: 400ms

**Tech:** SVG `<path>` elements with animated `stroke-dashoffset`. Paths are procedurally generated based on word positions, with a deterministic seed per response to keep the layout stable. Word spans are absolutely positioned over path endpoints.

**Color note:** Branches are rendered in the accent color (cobalt for the case study brand; brand-tinted otherwise) at 55% alpha. Seed points are solid accent. Text stays ink.

**Reduced-motion fallback:** Branches don't draw. Seed points and words fade in together over 200ms.

### 7.3 Fog

**Trigger:** creative, exploratory, open-ended.

**Visual character:** Text exists in position from frame 1 but starts at `opacity: 0` behind a heavy `filter: blur(8px)` and a soft fog gradient overlay (linear gradient, accent color desaturated, varying density). A dissipation boundary sweeps diagonally from top-left to bottom-right; as the boundary passes over each word's cell, the word transitions to `blur(0)` and `opacity: 1` over 250-400ms.

**Resolution order:** Continuous spatial sweep, not discrete word steps. Words near the leading edge of the boundary are mid-resolution while words behind are fully resolved and words ahead are fully fogged.

**Timing:**
- Total duration: 1.4 to 1.8 seconds
- Boundary sweep: ~1.0 second
- Per-word in-focus transition: 250 to 400ms

**Tech:** A CSS `mask-image` linear gradient on the response container, with `mask-position` animated via `transform`. Per-word `filter` and `opacity` listen to whether the word's bounding box has been "uncovered" by the sweep, computed via a small choreographer that owns the sweep timeline and emits resolution events.

**Reduced-motion fallback:** No sweep, no blur. The response fades in as a whole over 200ms.

### 7.4 Aurora

**Trigger:** summaries, factual recap, distillations, the-settled-truth.

**Visual character:** 2 to 3 horizontal luminous bands sweep left-to-right across the response area, vertically offset to each cover one to two lines of text. Each band is a soft horizontal gradient strip (accent color, blurred). As a band passes over a word, the word transitions to full opacity. Bands stagger so the response reveals top-down.

**Resolution order:** Top-line band 1, middle-line band 2, etc. Words within a band resolve in quick sequence as the band passes through them.

**Timing:**
- Total duration: 1.2 to 1.4 seconds
- Band stagger: 200ms between successive bands
- Band sweep duration each: ~900ms

**Tech:** Each band is a `<div>` with a horizontal gradient `background`, `filter: blur(8px)`, animated via `transform: translateX()`. Per-word activation listens for band-position intersection via the choreographer.

**Reduced-motion fallback:** No bands. Response fades in line-by-line over 250ms total with a 60ms stagger between lines.

---

## 8. Brand variation system

The case study ships with five brand identities: the case study's own ("After tokens.") and four named variants demonstrated in section 09 and the coda.

### 8.1 Token shape

Each brand is a static token bag conforming to:

```ts
type BrandTokens = {
  name: string
  surface: string        // background
  surfaceTint: string    // secondary background, often unused
  ink: string            // body text
  inkSecondary: string   // muted text
  muted: string          // labels
  stage: string          // dark insert background, usually shared
  stageText: string      // text inside stages
  accent: string         // single saturated punch
  particleColor: string  // for murmuration; often equals stageText or accent
  fontDisplay: string    // CSS font-family stack
  fontBody: string
  fontMono: string
  cornerRadius: number   // 0 for sharp brutalist, 8-12 for modern
  surfaceTexture?: 'none' | 'grid' | 'noise'
}
```

### 8.2 The five brands

| Brand | Industry | Surface | Ink | Accent | Type voice |
|---|---|---|---|---|---|
| After tokens. | Case study itself | `#EBE7DA` bone | `#15140F` | `#1D3FD9` cobalt | PP Neue Montreal sans |
| Halcyon | Institutional finance | `#1A1F28` slate | `#D8D4C6` bone | `#8AA093` sage | Tiempos Text serif |
| Felt | Creative agency | `#A8453A` terracotta | `#F4ECDC` cream | `#F4ECDC` cream (mono-accent) | Display sans, heavy weight |
| Pulse | Consumer wellness | `#E9EEF2` cool pale | `#1F2A36` slate | `#6FA9B4` aqua | Soft sans |
| Voltage | Developer tool | `#0A0D12` true dark | `#EBE7DA` bone | `#FF5E1F` tangerine | Mono body, sans display |

### 8.3 What changes across brands

- Surface, ink, accent, particle color (all token-driven)
- Typography family
- Corner radius (Felt: `12px`, Voltage: `4px`, others: `8px`)
- Surface texture (Voltage adds a faint grid; others get the subtle bone noise)
- The animation behavior, timing, stagger, easing, and tokenization all stay identical.

### 8.4 What does not change

The four modes' core motion choreography. A murmuration on Halcyon and a murmuration on Voltage are the same swarm pattern, the same timing, the same particle counts. The biology stays. The species changes.

---

## 9. Interactive coda

### 9.1 Layout

- Headline + sub
- Dark stage (16:7 aspect) at top showing current response mid-animation, with mode badge and brand badge in stage chrome and a replay control
- "Pick a prompt" rail with six chips
- Two control rails: Mode (four options) and Brand (five options), with toggle buttons
- Subtle "auto" tag on whichever mode was the default for the active prompt

### 9.2 Curated prompts

Six prompts, each pre-tagged with a default mode. Content is hand-written and final; no LLM call at runtime.

| # | Prompt | Default mode |
|---|---|---|
| 01 | What's the weather like in metaphor land? | Murmuration (conversational) |
| 02 | Explain how diffusion text generation works. | Mycelium (analytical) |
| 03 | Summarize the last three years of model research. | Aurora (summary) |
| 04 | Write a poem about a heron at dawn. | Fog (creative) |
| 05 | Quick question. Should I take the train or fly? | Murmuration (conversational) |
| 06 | Walk me through this compiler error. | Mycelium (analytical) |

Each prompt has a corresponding hand-written response stored as a fixture. The response shape is the same across modes; only the rendering changes when the user overrides the mode.

### 9.3 Interaction model

- Visitor clicks a prompt chip. Stage plays the default mode animation in the currently-selected brand.
- Visitor can click any mode button to replay the same response in a different mode.
- Visitor can click any brand button to replay the same response with different brand tokens.
- Active mode and brand are highlighted with the cobalt accent dot.
- Replay control reruns the current configuration.
- No keyboard input field. No LLM. No moderation surface needed.

### 9.4 Defaults

- First load: prompt 01 active, mode Murmuration, brand "After tokens."
- After any interaction, the configuration is sticky until the visitor changes it.

---

## 10. Technical architecture

### 10.1 Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router, Server Components default |
| Styling | Tailwind v4 utility classes with `@tailwindcss/postcss` |
| Animation | Motion (`motion/react`) for component-level transitions, GSAP ScrollTrigger only where scroll pinning or scrubbing is needed |
| Fonts | `next/font` self-hosted |
| Icons | Phosphor React (only for the small UI affordances; the diffusion visual language uses no icon library) |
| State (client) | Local `useState` plus React Context for brand selection |
| Build | Vercel deploy |

No vanilla `<canvas>`. No WebGL. No three.js. The visual language is intentionally DOM/SVG/CSS so the case study itself stays under 200KB of JS gzipped.

### 10.2 The `<DiffusionText>` primitive

```tsx
type DiffusionTextProps = {
  children: string
  mode: 'murmuration' | 'mycelium' | 'fog' | 'aurora'
  trigger?: 'inView' | 'immediate' | 'manual'
  onResolved?: () => void
}
```

- Tokenizes `children` into word atoms at render time. Each word becomes a `<span>` with positioning data.
- Resolves the mode strategy module by name.
- Hands off to the choreographer hook (section 10.4) which owns the timeline.
- Listens to `IntersectionObserver` if `trigger === 'inView'`.

### 10.3 Mode strategy interface

```ts
type WordAtom = {
  text: string
  index: number
  lineIndex: number
  bbox: { x: number; y: number; w: number; h: number }
}

type ResolutionEvent = {
  wordIndex: number
  state: 'pending' | 'resolving' | 'resolved'
  t: number  // ms into the animation
}

type ModeStrategy = {
  name: string
  totalDuration: (words: WordAtom[]) => number
  computeTimeline: (words: WordAtom[]) => ResolutionEvent[]
  renderOverlay: (props: OverlayProps) => ReactNode  // particles / branches / fog / aurora bands
  reducedMotionFallback: (words: WordAtom[]) => ResolutionEvent[]
}
```

Each mode module exports a `ModeStrategy`. The strategy is pure: it consumes word atoms and emits resolution events. Rendering of the resolution states is handled by the shared `<DiffusionText>` primitive; mode-specific decoration (particles, branches, fog mask, aurora bands) is rendered via `renderOverlay`.

### 10.4 Choreographer

`useDiffusionChoreography(words, strategy, trigger)` returns:
- `wordStates: Map<index, 'pending' | 'resolving' | 'resolved'>`
- `progress: number` (0 to 1)
- `play()`, `pause()`, `replay()`
- `isComplete: boolean`

Internally driven by `requestAnimationFrame` writing to motion values (`useMotionValue` from Motion) rather than React state, so per-frame updates do not trigger re-renders. Word state changes are applied via `data-*` attribute changes on the word spans, with CSS handling the visual transitions. This keeps the React tree quiet at 60fps.

### 10.5 Brand context

```tsx
<BrandProvider brand="halcyon">
  <SectionContent />
</BrandProvider>
```

`BrandProvider` injects CSS custom properties (`--bone`, `--ink`, `--accent`, etc.) onto a wrapping `<div>`. All section styles consume these custom properties. Brand swap is one-tree-render of a token object, no animation library state to invalidate.

### 10.6 Scroll choreography

- Most section entries: `IntersectionObserver` with `threshold: 0.3` and `once: true`. The choreographer runs once per scroll-into-view. Scrolling back up does not reset (avoids janky replay loops).
- Any pinned or scrubbed sections (e.g., the section 03 "broken assumptions" sequence if it ends up scrub-driven): GSAP ScrollTrigger using the canonical sticky-stack skeleton from the `design-taste-frontend` reference (`start: "top top"`, `pin: true`, `scrub: 1`, with `gsap.context()` cleanup in `useEffect`).
- Hard ban: `window.addEventListener('scroll', ...)`.

### 10.7 Reduced motion

`useReducedMotion()` from Motion gates the strategy choice. When reduced, every mode falls back to `reducedMotionFallback`, which is universally a 200ms staggered fade-in across the response. Stages still render in their dark surface; overlay layers (particles, branches, fog, aurora bands) do not mount.

---

## 11. Accessibility, performance, edge cases

### 11.1 Accessibility

- The full text of every response is in the DOM from frame one. Screen readers announce it immediately via `aria-live="polite"` regions.
- All animation overlays (particles, branches, fog, bands) are `aria-hidden="true"`.
- Color contrast on all body text passes WCAG AA against its background (bone ink combination is 12:1; stage stage-text is 11.5:1). Each brand variant in section 09 is verified to AA before shipping.
- Reduced motion behavior is documented in the closing section (section 11) as an explicit design tradeoff, not an afterthought.
- Tab navigation works through the coda's prompt chips and toggles. Focus rings use cobalt at 2px with a 1px offset, never removed for aesthetic.
- Keyboard shortcut: `Space` replays the current coda animation when stage has focus.

### 11.2 Performance targets

- LCP under 2.5s on a 4G connection (the LCP element is the static hero headline; no heavy image)
- INP under 200ms
- CLS under 0.1 (response containers reserve their final dimensions before any animation begins, computed during hidden-state render)
- Initial JS payload under 200KB gzipped (Motion ~25KB, GSAP+ScrollTrigger ~40KB, React+Next ~80KB, app code ~50KB)
- Lighthouse score above 95 on all four categories

### 11.3 Performance discipline

- Particle counts capped per word and globally
- All animations use `transform` and `opacity` only (plus `filter: blur` for fog and aurora bands, applied to non-text overlays)
- Sections below the fold are mounted but choreographers are dormant; `IntersectionObserver` gates animation start
- Font files are subset to the glyphs used on the page
- No image assets in the hero; the case study's "media" is the diffusion itself

### 11.4 Edge cases

| Case | Behavior |
|---|---|
| User scrolls rapidly past a section before its animation finishes | The choreographer's `IntersectionObserver` callback checks if the user has scrolled past; if so, snap to resolved state without playing. |
| Tab backgrounded mid-animation | Choreographer subscribes to `document.visibilitychange`; on hidden, animations pause. On visible, animations resume from their last frame (state restored from the motion-value timeline). |
| Browser without `IntersectionObserver` (extremely old) | Fallback: all sections render in their resolved state immediately. The case study still reads. |
| Mobile portrait at narrow widths | All section text wraps; the response areas use `clamp()` for font size; the stage aspect ratios change from `16/7` to `4/3` on `< 720px`. The architectural section numerals shrink and the brand variation grid collapses from 2x2 to 1x4. |
| Browser zoom above 200% | Layout reflows. Animations continue. Hairline alignment lines may not render at exactly 0.5px but the fallback (1px solid at low opacity) is acceptable. |
| `prefers-reduced-transparency` | Fog mode's mask gradient and aurora bands become solid edges at higher opacity, then a hard step. Backgrounds remain solid. |

---

## 12. Implementation phases

Phases are sequenced for ordered delivery, but each phase ships a working state. The page is never broken at a phase boundary.

### Phase 1. Foundation

Goal: a blank page that already feels like the brand.

- Next.js scaffold with App Router
- `next/font` with PP Neue Montreal and Berkeley Mono
- Tailwind v4 configured with the design tokens from section 6.1 mapped to CSS custom properties
- Global layout shell with the alignment grid and registration crosshairs
- Type system reset (heading scales, body measure, mono labels)
- `BrandProvider` mounted at the page root, defaulting to "After tokens."

### Phase 2. The primitive plus the first mode

Goal: section 05 (Murmuration intro) renders correctly end-to-end.

- `<DiffusionText>` primitive built with the tokenizer and choreographer hook
- `useDiffusionChoreography` running on motion values
- `IntersectionObserver` entry trigger
- Murmuration mode strategy fully implemented, including reduced-motion fallback
- Section 05 wired and verified in browser

### Phase 3. The remaining three modes

Goal: sections 06, 07, 08 render in their mapped modes.

- Mycelium mode (SVG branches, deterministic seed positioning)
- Fog mode (CSS mask sweep, per-word filter transition)
- Aurora mode (gradient bands, intersection-driven word activation)
- Each mode ships with its reduced-motion fallback

### Phase 4. Editorial sections 01 to 04

Goal: the page reads top-to-bottom.

- Section 01 hook (the broken token-streaming, hard cut to static)
- Section 02 primer (fog rendering)
- Section 03 broken assumptions (murmuration rendering, possibly scrub-driven for the three assumption beats)
- Section 04 thesis (aurora rendering)

### Phase 5. Brand variation

Goal: section 09 demonstrates one metaphor across four brands.

- Four brand token bags defined and validated for contrast
- Brand variation section composed (2x2 grid, mobile 1x4)
- Quick screenshot regression test of each brand variant

### Phase 6. Interactive coda

Goal: section 10 is fully interactive.

- Six prompt fixtures (hand-written prompts and responses)
- Mode toggle wired with auto-tag visibility
- Brand toggle wired through `BrandProvider` swap
- Replay control
- Keyboard shortcuts
- "Auto" tag UX confirmed reads correctly

### Phase 7. Closing and polish

Goal: ship-ready.

- Section 11 (limitations, open questions, credits)
- Full reduced-motion audit
- Performance audit (Lighthouse, real-device testing)
- Slow-motion review of every animation
- Accessibility audit including screen reader pass and keyboard navigation pass
- Social-share OG card and meta tags

---

## 13. Non-goals

The following are explicitly out of scope. Calling them out preserves the discipline of the deliverable.

- **Live LLM integration.** All responses are hand-written fixtures. The thesis is about animation language, not language model integration.
- **Real-time response classification.** The coda's mode mapping is hard-coded per prompt. A production system would need an actual classifier; this case study explicitly notes that in section 11.
- **Mobile-app prototype.** The piece is a web page. A native app version is a different deliverable.
- **A library or npm package.** The code is part of the case study site. Extracting reusable packages can come later; not in scope.
- **Internationalization.** English copy only. The animation system would work for any LTR script; RTL would need its own design pass.
- **Server-side animation.** All animation happens client-side. SSR renders the resolved state.
- **Custom font family.** PP Neue Montreal and Berkeley Mono are licensed; not commissioned for this project.

---

## 14. Open questions

Items to confirm before or during implementation. None are blocking the implementation plan.

1. **Section 03 motion treatment.** Whether the three "broken assumptions" beats use scrub-pinned scroll (heavier engineering, more dramatic) or sequential `IntersectionObserver` triggers (lighter, easier to ship). Recommendation: start with `IntersectionObserver`; upgrade to scrub if needed during polish.
2. **Hero "broken token streaming" execution.** Whether the hook's broken animation is a literal token streamer that visibly breaks, or a stylized representation. Recommendation: literal, because seeing the failure is more compelling than reading about it.
3. **Coda response storage.** Whether response fixtures live as TypeScript constants, JSON files, or MDX. Recommendation: TypeScript so type checking enforces the response schema and a future migration to a CMS is straightforward.
4. **Vanity domain.** Suggested `aftertokens.design`. Confirm availability before shipping.

---

## 15. References

External works that influenced this design:

- **Linear (linear.app), Vercel design language.** Reference for the editorial-engineering balance and the use of small mono labels with `+` separators.
- **Convergent evolution in biology.** The frame that gave the brand-variation argument its name. Different species, same systems.

Diffusion text generation prior art studied during research:

- Google research on parallel text generation
- Mercury and Inception experimental diffusion text models
- Standard reference papers on diffusion models for non-autoregressive generation

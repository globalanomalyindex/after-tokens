'use client'

import React, {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useMotionValueEvent } from 'motion/react'
import { tokenize } from '@/lib/diffusion/tokenize'
import { wordSalience } from '@/lib/diffusion/salience'
import { useDiffusionChoreography } from '@/lib/diffusion/choreographer'
import { buildCandidates, type GlyphStyle } from '@/lib/diffusion/glyph-styles'
import { isDecodeStyle, DECODE_WINDOW } from '@/lib/diffusion/decode'
import { crystalWith, type CrystalOptions } from '@/lib/diffusion/modes/crystal'
import { mycelium } from '@/lib/diffusion/modes/mycelium'
import { fog } from '@/lib/diffusion/modes/fog'
import { aurora } from '@/lib/diffusion/modes/aurora'
import { mitosis } from '@/lib/diffusion/modes/mitosis'
import { typewriter, fade, scatter } from '@/lib/arrival/references'
import { withReadingOrder } from '@/lib/arrival/reading-order'
import { segmentPhrases } from '@/lib/arrival/phrases'
import { clampVoice } from '@/lib/brand/brands'
import { useBrand, voiceStyle } from '@/lib/brand/provider'
import { CyclingWord } from './cycling-word'
import { DecodingWord } from './decoding-word'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import type { BrandVoice } from '@/lib/brand/types'
import type { MeasuredAtom, ModeName, ModeStrategy, OverlayProps, WordState } from '@/lib/diffusion/types'

// The static table covers the reference arrivals and the earlier authored
// modes. crystal is built per call, because the brand's voice (tempo, swing)
// and the demo's tension budget shape its timeline; trace is built from a
// recording at runtime. Both arrive through the `strategy` path below.
const strategies: Record<Exclude<ModeName, 'trace' | 'crystal'>, ModeStrategy> = {
  typewriter,
  fade,
  scatter,
  mycelium,
  fog,
  aurora,
  mitosis,
}

// The sampler's provisional argmax changed a median of every 387 milliseconds
// at recorded pace (see lib/traces/findings.ts, DERIVED.msPerFlipRecorded).
// 390 keeps the authored churn at that measured rate.
const CYCLE_INTERVAL_MS = 390

const SOURCE_LABEL: Record<ModeName, string> = {
  crystal: 'crystallize · authored',
  typewriter: 'typewriter · reference',
  fade: 'fade · reference',
  scatter: 'scatter · reference',
  mycelium: 'mycelium · retired',
  fog: 'fog · retired',
  aurora: 'aurora · retired',
  mitosis: 'mitosis · retired',
  trace: 'recorded sampler',
}

export type DiffusionTextProps = {
  children: string
  mode: ModeName
  trigger?: 'inView' | 'immediate' | 'manual'
  // External activation gate. When set to true, the text begins at once
  // regardless of trigger. Useful for sequencing after a sibling settles.
  externalActive?: boolean
  // Multiplier on the strategy's totalDuration. 1 = native speed.
  durationScale?: number
  // The vocabulary words cycle through while pending. 'words' (default) is
  // the topical near-word noise; 'blocks', 'matrix', and 'binary' decode per
  // character through ordered stages instead, composable with any arrival.
  glyphStyle?: GlyphStyle
  // Optional per-word color for the RESOLVED text: a word blooms into that
  // color the moment it locks (pending words stay neutral).
  wordColor?: (index: number, total: number) => string | undefined
  // Editorial specimens should not all announce themselves as live updates.
  // Interactive results can opt into one announcement after the reveal ends.
  announce?: 'none' | 'on-complete'
  // A visible, motion-independent state readout that also names the source:
  // the grammar, a reference arrival, a retired mode, or the recorded sampler.
  showStatus?: boolean
  onResolved?: () => void
  className?: string
  // A recorded trajectory (or any other runtime-built strategy) supplied by
  // the caller. It replaces the lookup entirely.
  strategy?: ModeStrategy
  // Fires the raw 0..1 choreography progress on every change, read through a
  // ref by callers that need it without re-rendering.
  onProgress?: (p: number) => void
  // Real provisional text for a recorded trajectory, keyed by word index and
  // the current step (see lib/diffusion/traces.ts, traceProvisionalText).
  provisionalAt?: (index: number, step: number) => string | undefined
  stepCount?: number
  // The step the replay is on at progress p, for a shaped or recorded pace.
  stepAt?: (p: number) => number
  // The commit confidence for a word, 0..1, when the caller has one. It sets
  // --conf on the word's wrapper, which scales the settle overshoot and, in
  // trace mode, the resolved word's resting opacity (finding 05).
  wordConf?: (index: number) => number | undefined
  // The prompt the answer responds to: words that echo it score high in the
  // salience that seeds the grammar (see lib/diffusion/salience.ts).
  topic?: string
  // A voice on top of the brand's own, clamped to the grammar's ranges.
  voice?: Partial<BrandVoice>
  // The tension budget for crystal: how many phrases may be open at once.
  budget?: CrystalOptions['budget']
  // Keep strict reading order inside a phrase (no anchor), for the comparison.
  anchorFirst?: boolean
  // The two-channel reveal on a recorded run: commits ghost when they land,
  // legibility arrives in reading order inside each phrase.
  readingOrder?: boolean
  // The live word states, for a readout beside the stage (open loops now,
  // closures so far). Called after every change.
  onWordStates?: (states: Map<number, WordState>) => void
}

export function DiffusionText({
  children,
  mode,
  trigger = 'inView',
  externalActive,
  durationScale = 1,
  glyphStyle = 'words',
  wordColor,
  announce = 'none',
  showStatus = false,
  onResolved,
  className = '',
  strategy: strategyProp,
  onProgress,
  provisionalAt,
  stepCount,
  stepAt,
  wordConf,
  topic,
  voice: voiceProp,
  budget,
  anchorFirst,
  readingOrder = false,
  onWordStates,
}: DiffusionTextProps) {
  const brand = useBrand()
  const voice = useMemo(() => clampVoice({ ...brand.voice, ...voiceProp }), [brand.voice, voiceProp])

  const atoms = useMemo(() => {
    const raw = tokenize(children)
    const sal = wordSalience(raw, topic)
    return raw.map((a, i) => ({ ...a, salience: sal[i] }))
  }, [children, topic])
  // The nuclei: one per phrase, the word that opens it. Marked so the lock
  // can settle harder (the gist is the peak).
  const nuclei = useMemo(() => {
    const set = new Set<number>()
    if (mode !== 'crystal') return set
    for (const ph of segmentPhrases(atoms)) if (ph.end > ph.start) set.add(atoms[ph.nucleus]!.index)
    return set
  }, [atoms, mode])
  // 'words' cycles topical near-words; the other styles DECODE per character
  // through ordered stages (see DecodingWord) rather than cycling strings.
  const isDecode = isDecodeStyle(glyphStyle)
  const candidatesPerAtom = useMemo(
    () => (isDecode ? [] : buildCandidates(atoms, glyphStyle)),
    [atoms, glyphStyle, isDecode],
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [measured, setMeasured] = useState<MeasuredAtom[]>([])
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState(trigger === 'immediate')
  // Reduced-motion users get the final readable content immediately.
  const shouldPlay = active || reduced
  const [cycleTick, setCycleTick] = useState(0)
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    if (externalActive === true && !active) setActive(true)
  }, [externalActive, active])

  // Re-measure when atoms change, when the container resizes, or when web
  // fonts swap in. measure() bails entirely if any word ref is null: during
  // the placeholder to CyclingWord swap refs are briefly null, and a partial
  // measurement would starve the choreographer of events for the rest.
  useLayoutEffect(() => {
    if (atoms.length === 0 || !containerRef.current) return
    const containerEl = containerRef.current

    function measure() {
      const containerBox = containerEl.getBoundingClientRect()
      const next: MeasuredAtom[] = []
      for (let i = 0; i < atoms.length; i++) {
        const el = wordRefs.current[i]
        const atom = atoms[i]
        if (!el || !atom) return
        const box = el.getBoundingClientRect()
        next.push({
          ...atom,
          bbox: {
            x: box.left - containerBox.left,
            y: box.top - containerBox.top,
            w: box.width,
            h: box.height,
          },
        })
      }
      setMeasured(next)
    }

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(containerEl)
    let canceled = false
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!canceled) measure()
      })
    }
    return () => {
      canceled = true
      ro.disconnect()
    }
  }, [atoms])

  useEffect(() => {
    if (reduced) return
    if (trigger !== 'inView' || !containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [trigger, reduced])

  // The strategy: a recording when supplied, the grammar shaped by the voice
  // and the budget, or one of the reference and retired arrivals. The
  // reading-order transform wraps any of them.
  const baseStrategy = useMemo<ModeStrategy>(() => {
    let s: ModeStrategy
    if (strategyProp) s = strategyProp
    else if (mode === 'crystal' || mode === 'trace') {
      s = crystalWith({ budget, swing: voice.swing, tempo: voice.tempo, anchorFirst })
    } else s = strategies[mode]
    return readingOrder ? withReadingOrder(s) : s
  }, [strategyProp, mode, budget, voice.swing, voice.tempo, anchorFirst, readingOrder])
  const strategy = useMemo<ModeStrategy>(() => {
    if (!durationScale || durationScale === 1) return baseStrategy
    return {
      name: baseStrategy.name,
      totalDuration: (w) => baseStrategy.totalDuration(w) * durationScale,
      computeTimeline: (w) =>
        baseStrategy.computeTimeline(w).map((e) => ({ ...e, t: e.t * durationScale })),
      renderOverlay: baseStrategy.renderOverlay,
      // A presentation-speed control never stretches the accessibility fallback.
      reducedMotionFallback: baseStrategy.reducedMotionFallback,
    }
  }, [baseStrategy, durationScale])

  const totalDuration = useMemo(() => strategy.totalDuration(measured), [strategy, measured])

  // The exhale fires at the LAST lock, never at a fixed fraction of the run.
  // Also remember which word locks last, and every lock that closes a gap: a
  // word whose two neighbors were already settled joins two clusters into
  // one, a local completion the settle rewards a little harder.
  const closing = useMemo(() => {
    const none = { at: 1, lastIndex: -1, gapClosers: new Set<number>() }
    if (measured.length === 0 || measured.length !== atoms.length) return none
    const total = strategy.totalDuration(measured)
    if (total <= 0) return none
    const locks = strategy
      .computeTimeline(measured)
      .filter((e) => e.state === 'resolved')
      .sort((a, b) => a.t - b.t)
    const locked = new Set<number>()
    const gapClosers = new Set<number>()
    for (const e of locks) {
      if (locked.has(e.wordIndex - 1) && locked.has(e.wordIndex + 1)) gapClosers.add(e.wordIndex)
      locked.add(e.wordIndex)
    }
    const last = locks.at(-1)
    return {
      at: last ? Math.min(1, last.t / total) : 1,
      lastIndex: last ? last.wordIndex : -1,
      gapClosers,
    }
  }, [strategy, measured, atoms.length])

  // For decode styles, each word's [startP, endP] decode window comes from
  // the arrival's timeline (the share of the run at which it locks), so the
  // per-character decode reacts in the arrival's own order. Frozen once
  // computed: a re-measure mid-run would shift the windows and rewind a word.
  const lockIdentity = `${mode}\u0000${glyphStyle}\u0000${durationScale}\u0000${children}`
  const lockWindowsRef = useRef<{ identity: string; windows: Map<number, { startP: number; endP: number }> } | null>(null)
  const lockWindows = useMemo(() => {
    if (!isDecode) return null
    if (lockWindowsRef.current?.identity === lockIdentity) return lockWindowsRef.current.windows
    if (measured.length === 0 || measured.length !== atoms.length) return null
    const total = strategy.totalDuration(measured)
    if (total <= 0) return null
    const resolvedAt = new Map<number, number>()
    for (const e of strategy.computeTimeline(measured)) {
      if (e.state === 'resolved') {
        const cur = resolvedAt.get(e.wordIndex)
        if (cur == null || e.t > cur) resolvedAt.set(e.wordIndex, e.t)
      }
    }
    const map = new Map<number, { startP: number; endP: number }>()
    for (const w of measured) {
      const endP = Math.min(1, (resolvedAt.get(w.index) ?? total) / total)
      map.set(w.index, { startP: Math.max(0, endP - DECODE_WINDOW), endP })
    }
    lockWindowsRef.current = { identity: lockIdentity, windows: map }
    return map
  }, [isDecode, measured, strategy, atoms.length, lockIdentity])

  const { wordStates, progress, isComplete, play } = useDiffusionChoreography({
    words: measured,
    strategy,
    trigger: 'manual',
    reduced,
    onResolved,
  })

  useEffect(() => {
    if (shouldPlay && measured.length > 0) play()
  }, [shouldPlay, measured.length, play])

  const onProgressRef = useRef<typeof onProgress>(onProgress)
  useEffect(() => {
    onProgressRef.current = onProgress
  }, [onProgress])
  const onWordStatesRef = useRef<typeof onWordStates>(onWordStates)
  useEffect(() => {
    onWordStatesRef.current = onWordStates
  }, [onWordStates])
  useEffect(() => {
    onWordStatesRef.current?.(wordStates)
  }, [wordStates])

  // Which recorded step a replay is on, for real provisional text. Updates
  // at most once per step rather than on every progress tick.
  const [provisionalStep, setProvisionalStep] = useState(0)
  const provisionalStepRef = useRef(0)

  useMotionValueEvent(progress, 'change', (p) => {
    if (p >= closing.at && !settled) setSettled(true)
    onProgressRef.current?.(p)
    // The fade draws its blur from the run's progress (see globals.css).
    if (mode === 'fade' && containerRef.current) containerRef.current.style.setProperty('--p', p.toFixed(3))
    if (stepCount && stepCount > 0) {
      const nextStep = stepAt
        ? Math.max(0, Math.min(stepCount - 1, stepAt(p)))
        : Math.max(0, Math.min(stepCount - 1, Math.floor(p * (stepCount + 1))))
      if (nextStep !== provisionalStepRef.current) {
        provisionalStepRef.current = nextStep
        setProvisionalStep(nextStep)
      }
    }
  })

  // Cycle tick while any atom is still pending. Read from atoms with a
  // fallback to 'pending': at first mount wordStates is empty even though
  // atoms visually render as pending, and the cycle would never start.
  const hasPending = useMemo(() => {
    if (atoms.length === 0) return false
    return atoms.some((atom) => (wordStates.get(atom.index) ?? 'pending') === 'pending')
  }, [atoms, wordStates])
  useEffect(() => {
    // Decode styles drive their own glyph churn from progress; no cycle tick.
    if (!shouldPlay || !hasPending || reduced || isDecode) return
    const id = setInterval(() => {
      setCycleTick((t) => t + 1)
    }, CYCLE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [shouldPlay, hasPending, reduced, isDecode])

  // How much of the answer has settled: drives --fill on the container (the
  // open field recedes as it rises) and the count in the status line.
  const resolvedCount = useMemo(() => {
    let n = 0
    wordStates.forEach((st) => {
      if (st === 'resolved') n += 1
    })
    return n
  }, [wordStates])
  const fill = atoms.length > 0 ? resolvedCount / atoms.length : 0

  const Overlay = strategy.renderOverlay

  return (
    <div
      ref={containerRef}
      className={`diffusion-text relative ${className}`}
      data-mode={mode}
      data-glyph={glyphStyle}
      data-settled={settled ? 'true' : 'false'}
      data-active={shouldPlay ? 'true' : 'false'}
      data-complete={isComplete ? 'true' : 'false'}
      data-reduced-motion={reduced ? 'true' : 'false'}
      // Decode styles render in monospace so every stage glyph occupies one
      // cell with zero layout jitter; 'words' keeps the chat-native UI font.
      style={{
        ...voiceStyle(voice),
        ...(isDecode ? { fontFamily: 'var(--font-mono)' } : {}),
        ['--fill' as string]: fill.toFixed(3),
      } as React.CSSProperties}
    >
      {announce === 'on-complete' ? (
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only select-none">
          {isComplete ? children : ''}
        </div>
      ) : (
        <span className="sr-only select-none">{children}</span>
      )}
      {/* Real whitespace between the slots, never a margin: the words wrap at
          the spaces like text, and a copied answer comes out with its spaces.
          A line break in the answer is a line break here. */}
      <span aria-hidden="true" className="block">
        {atoms.map((atom, i) => {
          // Decode styles: per-character stage decode, timed to the arrival's
          // lock window for this word. Self-measuring (mono widths are
          // stable), so no placeholder pass is needed.
          if (isDecode) {
            const win = lockWindows?.get(atom.index)
            return (
              <Fragment key={`${atom.index}-${atom.text}`}>
                {i > 0 ? (atoms[i - 1]!.lineIndex !== atom.lineIndex ? <br /> : ' ') : null}
                <DecodingWord
                  text={atom.text}
                  style={glyphStyle}
                  startP={win?.startP ?? 0}
                  endP={win?.endP ?? 1}
                  progress={progress}
                  resolvedColor={wordColor?.(atom.index, atoms.length)}
                  reduced={reduced}
                  wordIndex={atom.index}
                  registerRoot={(el) => {
                    wordRefs.current[i] = el
                  }}
                />
              </Fragment>
            )
          }
          const state = wordStates.get(atom.index) ?? 'pending'
          const slotWidth = measured[i]?.bbox.w ?? 0
          // Until measurement is done, render a hidden placeholder so the
          // layout effect can measure the final widths.
          if (slotWidth === 0) {
            return (
              <Fragment key={`${atom.index}-${atom.text}`}>
                {i > 0 ? (atoms[i - 1]!.lineIndex !== atom.lineIndex ? <br /> : ' ') : null}
                <span
                  ref={(el) => {
                    wordRefs.current[i] = el
                  }}
                  data-word-index={atom.index}
                  className="cycling-slot"
                  style={{ display: 'inline-block', opacity: 0, visibility: 'hidden' }}
                >
                  {atom.text}
                </span>
              </Fragment>
            )
          }
          const lockedColor = state !== 'pending' ? wordColor?.(atom.index, atoms.length) : undefined
          const suppliedConf = wordConf?.(atom.index)
          // In the grammar the settle is sized to salience: the gist lands
          // harder. With a real commit probability, to that instead.
          const conf = suppliedConf ?? (mode === 'crystal' ? 0.35 + 0.65 * (atom.salience ?? 0.3) : undefined)
          return (
            <Fragment key={`${atom.index}-${atom.text}`}>
              {i > 0 ? (atoms[i - 1]!.lineIndex !== atom.lineIndex ? <br /> : ' ') : null}
              <span
                ref={(el) => {
                  wordRefs.current[i] = el
                }}
                data-word-index={atom.index}
                data-last-lock={closing.lastIndex === atom.index ? 'true' : undefined}
                data-gap-close={closing.gapClosers.has(atom.index) ? 'true' : undefined}
                data-nucleus={nuclei.has(atom.index) ? 'true' : undefined}
                data-conf-label={suppliedConf != null ? `p ${suppliedConf.toFixed(2)}` : undefined}
                style={{
                  display: 'inline',
                  color: lockedColor,
                  transition: 'color 320ms cubic-bezier(0.23, 1, 0.32, 1)',
                  ...(conf != null ? { ['--conf' as string]: conf.toFixed(3) } : {}),
                } as React.CSSProperties}
              >
                <CyclingWord
                  atomIndex={atom.index}
                  finalText={atom.text}
                  candidates={candidatesPerAtom[i] ?? []}
                  state={shouldPlay ? state : 'pending'}
                  cycleTick={cycleTick}
                  slotWidth={slotWidth}
                  reduced={reduced}
                  provisionalText={
                    provisionalAt && stepCount ? provisionalAt(atom.index, provisionalStep) : undefined
                  }
                />
              </span>
            </Fragment>
          )
        })}
      </span>
      {measured.length > 0 && (
        <OverlayWrapper
          Overlay={Overlay}
          words={measured}
          progress={progress}
          totalDuration={totalDuration}
          reduced={reduced}
        />
      )}
      {showStatus && (
        <div
          className="diffusion-status mt-4 select-none"
          data-prototype-status={isComplete ? 'resolved' : shouldPlay ? 'resolving' : 'ready'}
        >
          {SOURCE_LABEL[mode]} · {isComplete ? 'resolved' : shouldPlay ? 'resolving' : 'ready'}
          {shouldPlay && !isComplete && atoms.length > 0 ? (
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {' · '}
              {resolvedCount} / {atoms.length} settled
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}

type OverlayWrapperProps = OverlayProps & {
  Overlay: (props: OverlayProps) => ReactNode
}

function OverlayWrapper({ Overlay, words, progress, totalDuration, reduced }: OverlayWrapperProps) {
  const OverlayComponent = Overlay as React.ComponentType<OverlayProps>
  return (
    <OverlayComponent
      words={words}
      progress={progress}
      totalDuration={totalDuration}
      reduced={reduced}
    />
  )
}

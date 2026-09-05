'use client'

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useMotionValueEvent } from 'motion/react'
import { tokenize } from '@/lib/diffusion/tokenize'
import { useDiffusionChoreography } from '@/lib/diffusion/choreographer'
import { buildCandidates, type GlyphStyle } from '@/lib/diffusion/glyph-styles'
import { mycelium } from '@/lib/diffusion/modes/mycelium'
import { fog } from '@/lib/diffusion/modes/fog'
import { aurora } from '@/lib/diffusion/modes/aurora'
import { mitosis } from '@/lib/diffusion/modes/mitosis'
import { CyclingWord } from './cycling-word'
import { DecodingWord } from './decoding-word'
import { isDecodeStyle, DECODE_WINDOW } from '@/lib/diffusion/decode'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'
import type { MeasuredAtom, ModeName, ModeStrategy, OverlayProps } from '@/lib/diffusion/types'

// The static table cannot cover 'trace': a recorded trajectory is built from
// captured data at runtime (see lib/diffusion/traces.ts, traceStrategy), not
// a fixed formula, so it has no fixed entry here. Callers that want the
// recorded mode pass a `strategy` prop instead (see DiffusionTextProps).
const strategies: Record<Exclude<ModeName, 'trace'>, ModeStrategy> = { mycelium, fog, aurora, mitosis }

// The sampler's provisional argmax changed a median of every 387 milliseconds
// at recorded pace (see lib/traces/findings.ts, DERIVED.msPerFlipRecorded).
// 390 keeps the authored churn at that measured rate.
const CYCLE_INTERVAL_MS = 390

type DiffusionTextProps = {
  children: string
  mode: ModeName
  trigger?: 'inView' | 'immediate' | 'manual'
  // External activation gate. When set to true, the text begins diffusing
  // immediately regardless of trigger. Useful for sequencing, e.g. start
  // the text only after a sibling widget has finished settling.
  externalActive?: boolean
  // Multiplier on the strategy's totalDuration. 1 = native speed. Used by
  // prototype controls to compare short and long reveal windows
  // without changing the relative choreography rhythm.
  durationScale?: number
  // The vocabulary words cycle through while pending. 'words' (default) is the
  // topical near-word noise; 'blocks'/'matrix'/'binary' re-skin the noise as a
  // terminal decode, matrix rain, or binary stream, composable with any mode.
  glyphStyle?: GlyphStyle
  // Optional per-word color for the RESOLVED text. Returning a color makes a
  // word bloom into that color the moment it locks (pending words stay neutral).
  // Used by the playground for solid-accent and rainbow/spectrum text.
  wordColor?: (index: number, total: number) => string | undefined
  // Editorial specimens should not all announce themselves as live updates.
  // Interactive results can opt into one announcement after the reveal ends.
  announce?: 'none' | 'on-complete'
  // A visible, motion-independent state readout. It also names the source
  // honestly: authored timelines say so, and the recorded mode says recorded.
  showStatus?: boolean
  onResolved?: () => void
  className?: string
  // A recorded trajectory (or any other runtime-built strategy) supplied by
  // the caller. When present it replaces the strategies[mode] lookup
  // entirely: a recorded trajectory cannot be a static entry in the
  // strategies table above because it is built from data (which trace, which
  // sampler config) only known at runtime, after module load.
  strategy?: ModeStrategy
  // Fires the raw 0..1 choreography progress on every change, read through a
  // ref by callers (e.g. a trajectory stage's step readout) that need it
  // without triggering their own re-renders or restarting playback.
  onProgress?: (p: number) => void
  // Real provisional text for a recorded trajectory: the model's own
  // successive guesses for a word at a given step, keyed by word index and
  // the current step. When both this and stepCount are given, a pending
  // word's cycling display is replaced by the sampler's real mind changes
  // instead of the synthetic near-word noise from buildCandidates.
  provisionalAt?: (index: number, step: number) => string | undefined
  stepCount?: number
  // The commit confidence for a word, 0..1, when the caller has one (the
  // recorded trajectory mode does, from the sampler's own softmax at commit).
  // Returning a number sets --conf on the word's wrapper span, which CSS
  // reads to scale the settle overshoot and, in trace mode, resolved-word
  // opacity, so certainty at commit reads as certainty on screen (finding 05).
  wordConf?: (index: number) => number | undefined
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
  wordConf,
}: DiffusionTextProps) {
  const atoms = useMemo(() => tokenize(children), [children])
  // 'words' cycles topical near-words; the other styles DECODE per character
  // through ordered stages (see DecodingWord) rather than cycling whole strings.
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
  // Reduced-motion users get the final readable content immediately instead
  // of waiting for each offscreen IntersectionObserver to activate.
  const shouldPlay = active || reduced
  const [cycleTick, setCycleTick] = useState(0)
  const [unblurred, setUnblurred] = useState(false)

  // External activation gate. Flipping externalActive to true forces the text
  // into the active state without waiting on the trigger. Once active, the
  // gate has no further effect (you can't pause via this path).
  useEffect(() => {
    if (externalActive === true && !active) setActive(true)
  }, [externalActive, active])

  // Re-measure when atoms change, when the container resizes, or when web
  // fonts swap in. Without these triggers the overlay dots & flock targets
  // can drift out of alignment with the rendered glyphs.
  //
  // CRITICAL: measure() must bail entirely if any word ref is null. During
  // the placeholder→CyclingWord render swap, refs are briefly null between
  // unmount and remount. Committing a partial measurement here truncates
  // the `measured` array, which then starves the choreographer of events
  // for the missing atoms, so those words stay 'pending' forever (the user-
  // visible "stuck cycling at the end" bug).
  useLayoutEffect(() => {
    if (atoms.length === 0 || !containerRef.current) return
    const containerEl = containerRef.current

    function measure() {
      const containerBox = containerEl.getBoundingClientRect()
      const next: MeasuredAtom[] = []
      for (let i = 0; i < atoms.length; i++) {
        const el = wordRefs.current[i]
        const atom = atoms[i]
        if (!el || !atom) {
          // Any null ref → abort. We'll catch up on the next ResizeObserver
          // tick once refs are repopulated.
          return
        }
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

    // Fonts may swap in after first paint and shift glyph metrics.
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

  // A recorded trajectory replaces the lookup entirely (see `strategy` prop
  // doc above). Absent that, 'trace' has no static table entry, so it falls
  // back to mycelium: this cannot happen through the public components (they
  // always pass `strategy` alongside mode='trace'), but the type must be
  // sound without a non-null assertion.
  const baseStrategy = strategyProp ?? (mode === 'trace' ? mycelium : strategies[mode])
  // Wrap the strategy in a duration-scaled adapter when the caller wants a
  // longer presentation window. Scale = 1 returns the original strategy so
  // hot paths stay identity-equal.
  const strategy = useMemo<ModeStrategy>(() => {
    if (!durationScale || durationScale === 1) return baseStrategy
    return {
      name: baseStrategy.name,
      totalDuration: (w) => baseStrategy.totalDuration(w) * durationScale,
      computeTimeline: (w) =>
        baseStrategy.computeTimeline(w).map((e) => ({ ...e, t: e.t * durationScale })),
      renderOverlay: baseStrategy.renderOverlay,
      // A presentation-speed control must never stretch the accessibility
      // fallback. Reduced motion keeps its own compact timing contract.
      reducedMotionFallback: baseStrategy.reducedMotionFallback,
    }
  }, [baseStrategy, durationScale])

  const totalDuration = useMemo(() => strategy.totalDuration(measured), [strategy, measured])

  // The closing beat fires at the LAST lock, never at a fixed fraction of the
  // run: a fixed threshold used to strip blur from still-pending noise for the
  // final stretch, which showed illegible text as if it were words. Also
  // remember which word locks last so it can carry the strongest settle
  // (peak-end: the ending is where the memory of the sequence lands).
  const closing = useMemo(() => {
    if (measured.length === 0 || measured.length !== atoms.length) return { at: 1, lastIndex: -1 }
    const total = strategy.totalDuration(measured)
    if (total <= 0) return { at: 1, lastIndex: -1 }
    let lastT = -1
    let lastIndex = -1
    for (const e of strategy.computeTimeline(measured)) {
      if (e.state === 'resolved' && e.t > lastT) {
        lastT = e.t
        lastIndex = e.wordIndex
      }
    }
    return { at: lastT < 0 ? 1 : Math.min(1, lastT / total), lastIndex }
  }, [strategy, measured, atoms.length])

  // For decode styles, derive each word's [startP,endP] decode window from the
  // mode timeline (the fraction of total at which the mode locks that word).
  // This is what makes the per-character decode REACT in the mode's style: the
  // aurora band sweeps and the cells under it resolve in row order, mycelium
  // resolves them in its organic order, etc. Fractions are scale-invariant, so
  // the reveal-duration control stretches the decode without reordering it.
  //
  // FROZEN once computed: a re-measurement mid-animation (font swap, reflow)
  // would otherwise shift the geometry-derived lock times and rewind a word's
  // decode. We compute once from the first complete measurement and reuse it for
  // the life of this mount (content/mode/scale changes remount via runKey).
  const lockIdentity = `${mode}\u0000${glyphStyle}\u0000${durationScale}\u0000${children}`
  const lockWindowsRef = useRef<{
    identity: string
    windows: Map<number, { startP: number; endP: number }>
  } | null>(null)
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

  // onProgress is read through a ref so a caller passing a fresh closure each
  // render doesn't restart playback or re-subscribe this handler.
  const onProgressRef = useRef<typeof onProgress>(onProgress)
  useEffect(() => {
    onProgressRef.current = onProgress
  }, [onProgress])

  // Which recorded step a trajectory replay is currently on, for real
  // provisional text (see provisionalAt doc above). Kept out of a plain
  // derived value so it updates at most once per step rather than on every
  // progress tick.
  const [provisionalStep, setProvisionalStep] = useState(0)
  const provisionalStepRef = useRef(0)

  // The closing beat lands when the last word has locked.
  useMotionValueEvent(progress, 'change', (p) => {
    if (p >= closing.at && !unblurred) setUnblurred(true)
    onProgressRef.current?.(p)
    if (stepCount && stepCount > 0) {
      const nextStep = Math.max(0, Math.min(stepCount - 1, Math.floor(p * (stepCount + 1))))
      if (nextStep !== provisionalStepRef.current) {
        provisionalStepRef.current = nextStep
        setProvisionalStep(nextStep)
      }
    }
  })

  // Haptic feedback for mycelium: every word lock = short tick, final unblur =
  // longer wave. Android phones with vibration API respect this; iOS Safari
  // ignores `navigator.vibrate`, which is fine. The visual treatment still
  // carries the lock and the wave on its own.
  const lastResolvedCountRef = useRef(0)
  const lastHapticAtRef = useRef(0)
  const settledOnceRef = useRef(false)
  useEffect(() => {
    if (mode !== 'mycelium' || reduced) return
    let resolvedCount = 0
    wordStates.forEach((s) => {
      if (s === 'resolved') resolvedCount += 1
    })
    if (resolvedCount > lastResolvedCountRef.current) {
      lastResolvedCountRef.current = resolvedCount
      const now = performance.now()
      if (now - lastHapticAtRef.current > 38) {
        lastHapticAtRef.current = now
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(7)
          }
        } catch {
          // ignore, feature-detection only catches some misbehavior
        }
      }
    }
  }, [wordStates, mode, reduced])
  useEffect(() => {
    if (mode !== 'mycelium' || reduced) return
    if (!unblurred || settledOnceRef.current) return
    settledOnceRef.current = true
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([14, 60, 24])
      }
    } catch {
      // ignore
    }
  }, [unblurred, mode, reduced])

  // Cycle tick while any atom is still pending.
  // NOTE: Read from atoms (with fallback to 'pending') rather than wordStates'
  // existing entries: at first mount wordStates is empty even though atoms
  // visually render as pending, and the cycle would never start.
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

  const Overlay = strategy.renderOverlay

  return (
    <div
      ref={containerRef}
      className={`diffusion-text relative ${className}`}
      data-mode={mode}
      data-glyph={glyphStyle}
      data-unblurred={unblurred ? 'true' : 'false'}
      data-active={shouldPlay ? 'true' : 'false'}
      data-complete={isComplete ? 'true' : 'false'}
      data-reduced-motion={reduced ? 'true' : 'false'}
      // Decode styles render in monospace so every stage glyph (block, braille,
      // katakana, letter) occupies one cell, zero layout jitter, like the
      // static specimens. 'words' keeps the chat-native UI font.
      style={isDecode ? { fontFamily: 'var(--font-mono)' } : undefined}
    >
      {announce === 'on-complete' ? (
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {isComplete ? children : ''}
        </div>
      ) : (
        <span className="sr-only">{children}</span>
      )}
      <span aria-hidden="true" className="block">
        {atoms.map((atom, i) => {
          // Decode styles: per-character stage decode, timed to the mode's lock
          // window for this word. Self-measuring (mono widths are stable), so
          // no placeholder pass is needed.
          if (isDecode) {
            const win = lockWindows?.get(atom.index)
            return (
              <DecodingWord
                key={`${atom.index}-${atom.text}`}
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
            )
          }
          const state = wordStates.get(atom.index) ?? 'pending'
          const slotWidth = measured[i]?.bbox.w ?? 0
          // Until measurement is done, render a minimal hidden placeholder so the
          // useLayoutEffect can measure the final widths.
          if (slotWidth === 0) {
            return (
              <span
                key={`${atom.index}-${atom.text}`}
                ref={(el) => {
                  wordRefs.current[i] = el
                }}
                data-word-index={atom.index}
                className="cycling-slot"
                style={{
                  display: 'inline-block',
                  marginRight: '0.28em',
                  opacity: active ? 0 : 0,
                  visibility: 'hidden',
                }}
              >
                {atom.text}
              </span>
            )
          }
          // A word blooms into its color the instant it locks; pending words
          // stay neutral so the color reads as "the answer resolving."
          const lockedColor = state !== 'pending' ? wordColor?.(atom.index, atoms.length) : undefined
          const conf = wordConf?.(atom.index)
          return (
            <span
              key={`${atom.index}-${atom.text}`}
              ref={(el) => {
                wordRefs.current[i] = el
              }}
              data-word-index={atom.index}
              data-last-lock={closing.lastIndex === atom.index ? 'true' : undefined}
              style={{
                display: 'inline',
                color: lockedColor,
                transition: 'color 320ms cubic-bezier(0.23, 1, 0.32, 1)',
                ...(conf != null ? { ['--conf' as string]: String(conf) } : {}),
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
          className="mt-4 flex items-center gap-2 text-[9.5px] uppercase tracking-[0.16em]"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'color-mix(in oklab, currentColor 62%, transparent)',
          }}
          data-prototype-status={isComplete ? 'resolved' : shouldPlay ? 'resolving' : 'ready'}
        >
          <span aria-hidden="true">{isComplete ? '●' : shouldPlay ? '◐' : '○'}</span>
          {mode === 'trace' ? 'recorded sampler' : 'authored prototype'} · {isComplete ? 'resolved' : shouldPlay ? 'resolving' : 'ready'}
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

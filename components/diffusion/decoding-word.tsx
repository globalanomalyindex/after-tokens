'use client'

import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react'
import { useMotionValueEvent, type MotionValue } from 'motion/react'
import type { GlyphStyle } from '@/lib/diffusion/glyph-styles'
import {
  decodeGlyph,
  decodeColor,
  charSeed,
  noiseInit,
  CHAR_RESOLVE_SPAN,
  NOISE_FRAME_MS,
  DRAW_FRAME_MS,
} from '@/lib/diffusion/decode'

// One word, rendered as a row of per-character cells that DECODE through the
// style's ordered stages as the mode's choreography reaches this word. Glyphs
// and colors are written straight to the DOM from the shared progress value, so
// a whole answer of these stays at frame rate without per-frame React work.
//
// The word's [startP, endP] window comes from the mode timeline (when this word
// locks), so blocks/matrix/binary "react in the mode's style": the aurora band
// sweeps and the cells under it resolve, mycelium resolves them organically, etc.

type Props = {
  text: string
  style: GlyphStyle
  startP: number
  endP: number
  progress: MotionValue<number>
  resolvedColor?: string
  reduced: boolean
  wordIndex: number
  registerRoot: (el: HTMLSpanElement | null) => void
}

export function DecodingWord({
  text,
  style,
  startP,
  endP,
  progress,
  resolvedColor,
  reduced,
  wordIndex,
  registerRoot,
}: Props) {
  const rootRef = useRef<HTMLSpanElement | null>(null)
  const charRefs = useRef<(HTMLSpanElement | null)[]>([])
  const lastGlyph = useRef<string[]>([])
  const lastColor = useRef<string[]>([])
  const lastDrawRef = useRef(0)

  const target = resolvedColor ?? 'var(--stage-text)'
  const chars = useMemo(() => Array.from(text), [text])

  // Per-char sub-window inside [startP, endP], staggered by a stable seed so the
  // word materializes out of noise all at once rather than left to right.
  const windows = useMemo(() => {
    const span = Math.max(0.0001, endP - startP)
    return chars.map((_, i) => {
      const s = charSeed(wordIndex, i)
      const cs = startP + s * (1 - CHAR_RESOLVE_SPAN) * span
      return { cs, ce: cs + CHAR_RESOLVE_SPAN * span }
    })
  }, [chars, startP, endP, wordIndex])

  const rootStyle = {
    display: 'inline-block',
    position: 'relative',
    whiteSpace: 'nowrap',
    verticalAlign: 'baseline',
    ['--word-index' as string]: String(wordIndex),
  } as CSSProperties

  // Write glyph + color for every char at global progress gp.
  function paintFrame(gp: number, now: number) {
    const tick = Math.floor(now / NOISE_FRAME_MS)
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]
      const span = charRefs.current[i]
      if (!span || ch === undefined || ch === ' ') continue
      const w = windows[i]
      const denom = w ? w.ce - w.cs : 1
      const raw = w ? (gp - w.cs) / (denom <= 0 ? 1 : denom) : 1
      const p = raw <= 0 ? 0 : raw >= 1 ? 1 : raw
      const glyph = decodeGlyph(style, ch, p, i, tick)
      if (glyph !== lastGlyph.current[i]) {
        span.textContent = glyph
        lastGlyph.current[i] = glyph
      }
      const color = decodeColor(target, p)
      if (color !== lastColor.current[i]) {
        span.style.color = color
        lastColor.current[i] = color
      }
    }
    const root = rootRef.current
    if (root) {
      const wspan = endP - startP
      const overall = wspan <= 0 ? 1 : (gp - startP) / wspan
      const st = overall <= 0 ? 'pending' : overall >= 1 ? 'resolved' : 'resolving'
      if (root.dataset.state !== st) root.dataset.state = st
    }
  }

  // Baseline paint before the browser paints: measurement (the parent's layout
  // effect) then reads stable monospace widths, and the first visible frame is
  // always a noise field. Child layout effects run before the parent's, so
  // this lands first.
  //
  // Deps are ONLY chars/style/reduced, and deliberately exclude startP/endP. A
  // re-measurement (font swap, reflow) recomputes the mode's lock windows, which
  // changes startP/endP; the live `windows` memo picks those up for the next
  // frame, but we must NOT re-run this baseline here or it would reset resolved
  // cells back to noise mid-decode. `target` is likewise excluded (handled by
  // the recolor effect below).
  useLayoutEffect(() => {
    if (reduced) return
    lastGlyph.current = new Array(chars.length).fill('')
    lastColor.current = new Array(chars.length).fill('')
    lastDrawRef.current = 0
    paintFrame(progress.get(), performance.now())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chars, style, reduced])

  // Live recolor: when the accent changes (e.g. dragging the hue wheel), recolor
  // cells that have already resolved. In-flight cells are left to the progress
  // loop. This is what makes color changes apply in place after completion,
  // when no progress events are firing.
  useLayoutEffect(() => {
    if (reduced) return
    for (let i = 0; i < chars.length; i++) {
      const span = charRefs.current[i]
      if (span && lastGlyph.current[i] === chars[i]) {
        span.style.color = target
        lastColor.current[i] = target
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])

  useMotionValueEvent(progress, 'change', (gp) => {
    if (reduced) return
    const now = performance.now()
    const force = gp >= endP // guarantee the final settle lands even if throttled
    if (!force && now - lastDrawRef.current < DRAW_FRAME_MS) return
    lastDrawRef.current = now
    paintFrame(gp, now)
  })

  if (reduced) {
    return (
      <span
        ref={(el) => {
          rootRef.current = el
          registerRoot(el)
        }}
        className="cycling-slot decoding-word"
        data-decoding-word
        data-state="resolved"
        data-word-index={wordIndex}
        style={{ ...rootStyle, color: target }}
      >
        {text}
      </span>
    )
  }

  return (
    <span
      ref={(el) => {
        rootRef.current = el
        registerRoot(el)
      }}
      className="cycling-slot decoding-word"
      data-decoding-word
      data-state="pending"
      data-word-index={wordIndex}
      style={rootStyle}
    >
      {chars.map((ch, i) =>
        ch === ' ' ? (
          ' '
        ) : (
          <span
            key={i}
            ref={(el) => {
              charRefs.current[i] = el
            }}
            style={{ color: 'var(--stage-text)' }}
          >
            {noiseInit(style)}
          </span>
        ),
      )}
    </span>
  )
}

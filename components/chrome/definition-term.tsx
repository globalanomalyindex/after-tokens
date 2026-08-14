'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GLOSSARY } from '@/lib/glossary'

// An inline keyword rendered as a solid bright chip. Hover (or tap) opens a wide
// dictionary entry filled with that same color: headword + part of speech across
// the top, a phonetic respelling, a dashed rule, then the gloss and a citation
// line naming the finding's source. Dark ink throughout so it reads on the
// bright fill (the one entry with tone: 'dark' inverts those inks via
// data-tone). The window anchors left / center / right based on where the chip
// sits, so a wide box never spills off-screen, and it scales up from that edge.
// Dismisses on outside-press / Escape.
export function DefinitionTerm({
  term,
  children,
}: {
  term: string
  children?: React.ReactNode
}) {
  const entry = GLOSSARY[term]
  const [open, setOpen] = useState(false)
  const [align, setAlign] = useState<'center' | 'left' | 'right'>('center')
  // On narrow viewports the window is pinned to the VIEWPORT rather than to the
  // chip. `data-align="left"` only sets `left: 0`, which is the chip's left edge,
  // so a chip sitting mid-line pushed the wide box off the right of the screen
  // and clipped its corner marks. These overrides put it a fixed gutter in from
  // the viewport edge and cap its width to what is actually on screen.
  const [viewportFit, setViewportFit] = useState<CSSProperties | undefined>(undefined)
  const [hoverable, setHoverable] = useState(false)
  const wrapRef = useRef<HTMLSpanElement | null>(null)
  const openT = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeT = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setHoverable(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(
    () => () => {
      if (openT.current) clearTimeout(openT.current)
      if (closeT.current) clearTimeout(closeT.current)
    },
    [],
  )

  if (!entry) return <>{children ?? term}</>

  // Stable id so the trigger can point its aria-describedby at the popover,
  // letting AT read the gloss/pronunciation/definition rather than only
  // announcing "define <term>, expanded".
  const defId = `def-${term.replace(/\s+/g, '-')}`

  const clearTimers = () => {
    if (openT.current) clearTimeout(openT.current)
    if (closeT.current) clearTimeout(closeT.current)
  }
  // choose an anchor edge so the wide box stays on-screen
  const measureAlign = () => {
    const r = wrapRef.current?.getBoundingClientRect()
    if (!r) return
    // On narrow viewports force left-anchoring (transform-origin top left) and
    // then pin the box to the viewport instead of to the chip. `left: 0` alone
    // resolves to the chip's left edge, so a chip sitting mid-line pushed the
    // wide box off the right of the screen. Shifting by (gutter - chipLeft)
    // lands it exactly one gutter in from the viewport edge, and the width cap
    // keeps the far edge on screen too.
    const GUTTER = 12
    if (window.innerWidth < 512) {
      setAlign('left')
      setViewportFit({
        left: `${GUTTER - r.left}px`,
        maxWidth: `${window.innerWidth - GUTTER * 2}px`,
      })
      return
    }
    setViewportFit(undefined)
    const cx = r.left + r.width / 2
    const vw = window.innerWidth
    setAlign(cx < vw * 0.3 ? 'left' : cx > vw * 0.7 ? 'right' : 'center')
  }
  const openNow = () => {
    measureAlign()
    setOpen(true)
  }
  const onEnter = () => {
    if (!hoverable) return
    clearTimers()
    openT.current = setTimeout(openNow, 90)
  }
  const onLeave = () => {
    if (!hoverable) return
    clearTimers()
    closeT.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <span
      ref={wrapRef}
      className="def-wrap"
      data-tone={entry.tone}
      style={{ ['--chip' as string]: entry.color } as CSSProperties}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <button
        type="button"
        className="def-chip"
        aria-expanded={open}
        aria-label={`define ${term}`}
        aria-describedby={defId}
        onClick={() => {
          clearTimers()
          if (open) setOpen(false)
          else openNow()
        }}
      >
        {children ?? term}
      </button>
      <span
        id={defId}
        className="def-window"
        role="tooltip"
        data-open={open ? 'true' : 'false'}
        data-align={align}
        style={viewportFit}
      >
        <span aria-hidden="true" className="def-x def-x-tl">+</span>
        <span aria-hidden="true" className="def-x def-x-tr">+</span>
        <span aria-hidden="true" className="def-x def-x-bl">+</span>
        <span aria-hidden="true" className="def-x def-x-br">+</span>
        <span className="def-note" aria-hidden="true">
          <span className="def-note-arrow">
            <span>^</span>
            <i />
            <span>v</span>
          </span>
          <span className="def-note-box">
            <span className="nx nx-tl">+</span>
            <span className="nx nx-tr">+</span>
            <span className="nx nx-bl">+</span>
            <span className="nx nx-br">+</span>
          </span>
        </span>
        <span className="def-term">{term}</span>
        <span className="def-pron">
          {entry.pron} <span className="def-pos">[{entry.pos}]</span>
        </span>
        <span aria-hidden="true" className="def-rule">
          <span>‹</span>
          <i />
          <span>›</span>
        </span>
        <span className="def-def">{entry.def}</span>
        <span className="def-src">{entry.src}</span>
      </span>
    </span>
  )
}

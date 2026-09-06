'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GLOSSARY } from '@/lib/glossary'

// An inline keyword with a dotted underline. Hover or tap opens a small
// entry: headword and part of speech, the gloss, the source. The box anchors
// left, center, or right by where the term sits, so it never spills off
// screen, and on narrow viewports pins to the viewport instead.
export function DefinitionTerm({ term, children }: { term: string; children?: React.ReactNode }) {
  const entry = GLOSSARY[term]
  const [open, setOpen] = useState(false)
  const [align, setAlign] = useState<'center' | 'left' | 'right'>('center')
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

  const defId = `def-${term.replace(/\s+/g, '-')}`
  const clearTimers = () => {
    if (openT.current) clearTimeout(openT.current)
    if (closeT.current) clearTimeout(closeT.current)
  }
  const measureAlign = () => {
    const r = wrapRef.current?.getBoundingClientRect()
    if (!r) return
    const GUTTER = 12
    if (window.innerWidth < 512) {
      setAlign('left')
      setViewportFit({ left: `${GUTTER - r.left}px`, maxWidth: `${window.innerWidth - GUTTER * 2}px` })
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
    <span ref={wrapRef} className="def-wrap" onPointerEnter={onEnter} onPointerLeave={onLeave}>
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
      <span id={defId} className="def-window" role="tooltip" data-open={open ? 'true' : 'false'} data-align={align} style={viewportFit}>
        <span className="def-term">
          {term} <span className="def-pos">[{entry.pos}]</span>
        </span>
        <span className="def-def">{entry.def}</span>
        <span className="def-src">{entry.src}</span>
      </span>
    </span>
  )
}

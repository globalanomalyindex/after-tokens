'use client'

import { AmbientComposition, type AmbientCondition } from './ambient-composition'
import { useLayoutEffect, useState, type RefObject } from 'react'

type Props = {
  pageRef: RefObject<HTMLDivElement | null>
  frameRef: RefObject<HTMLDivElement | null>
  text: string
  visibleLength: number
  showing: boolean
  seed: string
  active: boolean
  motion: boolean
  condition: AmbientCondition
  tempo: number
  barHeight: number
}

/** A decorative continuation cue, measured only from already released text.
 * It reserves no layout space and makes no prediction about the next words. */
export function LineContinuation({ pageRef, frameRef, text, visibleLength, showing, seed, active, motion, condition, tempo, barHeight }: Props) {
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const page = pageRef.current, frame = frameRef.current
    if (!page || !frame) return
    const measure = () => {
      // A committed passage often carries one delimiter space for the next
      // passage. Measure the last meaningful glyph, never that collapsed
      // delimiter, or a range can resolve to a phantom line below the text.
      const visible = text.slice(0, visibleLength)
      const endsWithExplicitBreak = /[\r\n]\s*$/.test(visible)
      const meaningful = visible.replace(/\s+$/, '')
      if (!showing || !meaningful || endsWithExplicitBreak) { setBox(null); return }
      let remaining = meaningful.length
      const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT)
      let node: Node | null
      while ((node = walker.nextNode())) {
        const length = node.textContent?.length ?? 0
        if (remaining > length) { remaining -= length; continue }
        if (!remaining) break
        const range = document.createRange()
        range.setStart(node, remaining - 1)
        range.setEnd(node, remaining)
        const last = range.getBoundingClientRect()
        const area = page.getBoundingClientRect(), origin = frame.getBoundingClientRect()
        const font = parseFloat(getComputedStyle(page).fontSize) || 16
        const gap = font * .3, available = area.right - last.right - gap
        if (!last.height || available < font * 2.5) { setBox(null); return }
        const height = barHeight
        setBox({ left: last.right - origin.left + gap, top: last.top - origin.top + (last.height - height) / 2, width: available, height })
        return
      }
      setBox(null)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(page)
    document.fonts?.ready.then(measure)
    return () => observer.disconnect()
  }, [pageRef, frameRef, text, visibleLength, showing, seed, barHeight])
  return <span className="settle-line-continuation" aria-hidden="true" data-line-continuation data-shown={!!box} style={box ?? undefined}>
    {box && <AmbientComposition singleRow splitRow={box.width > barHeight * 11} active={active} motion={motion} condition={condition} complete={false} runId={seed} rowCount={1} lineHeightPx={barHeight} barHeightPx={barHeight} tempo={tempo} />}
  </span>
}

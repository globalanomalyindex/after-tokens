'use client'

import { useLayoutEffect, useState, type RefObject } from 'react'

type Props = {
  pageRef: RefObject<HTMLDivElement | null>
  frameRef: RefObject<HTMLDivElement | null>
  text: string
  visibleLength: number
  showing: boolean
  seed: string
}

/** A decorative continuation cue, measured only from already released text.
 * It reserves no layout space and makes no prediction about the next words. */
export function LineContinuation({ pageRef, frameRef, text, visibleLength, showing, seed }: Props) {
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const page = pageRef.current, frame = frameRef.current
    if (!page || !frame) return
    const measure = () => {
      const visible = text.slice(0, visibleLength)
      if (!showing || !visible.trim() || /[\r\n]\s*$/.test(visible)) { setBox(null); return }
      let remaining = visibleLength
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
        const gap = font * .45, available = area.right - last.right - gap
        if (!last.height || available < font * 2.5) { setBox(null); return }
        const hash = [...seed].reduce((value, letter) => (value * 31 + letter.charCodeAt(0)) >>> 0, 7)
        const fraction = .58 + (hash % 23) / 100
        const height = font * .62
        setBox({ left: last.right - origin.left + gap, top: last.top - origin.top + (last.height - height) / 2, width: Math.min(available * fraction, font * 12), height })
        return
      }
      setBox(null)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(page)
    document.fonts?.ready.then(measure)
    return () => observer.disconnect()
  }, [pageRef, frameRef, text, visibleLength, showing, seed])
  return <span className="settle-line-continuation" aria-hidden="true" data-line-continuation data-shown={!!box} style={box ?? undefined}><span /></span>
}

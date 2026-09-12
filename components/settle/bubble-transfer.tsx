'use client'

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react'

type Rect = { x: number; y: number; width: number; height: number }
type Cell = Rect & { alpha: number; target: Rect }

/** A visual bridge made from the bubbles actually on screen and text that
 * has ALREADY met its release policy. These rectangles never predict words. */
export function BubbleTransfer({ frameRef, transferKey, onCaptured, onComplete }: {
  frameRef: RefObject<HTMLDivElement | null>; transferKey: string; onCaptured?: (key: string) => void; onComplete: (key: string) => void
}) {
  const [cells, setCells] = useState<Cell[]>([])
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const box = frame.getBoundingClientRect()
    const origins: (Rect & { alpha: number; element: HTMLElement })[] = []
    const division = frame.querySelector<HTMLElement>('.skeleton-division')
    const divisionStyle = division ? getComputedStyle(division) : null
    const opening = divisionStyle && divisionStyle.visibility !== 'hidden' && Number(divisionStyle.opacity) > .006
    // During division, a shared clip makes several slabs look like one
    // capsule. Preserve that exact clipped layer and fade it in place.
    // Cloning the slabs as rounded pills would change its visible silhouette.
    for (const ink of opening ? [] : frame.querySelectorAll<HTMLElement>('.ambient-composition__ink')) {
      let alpha = 1, visible = true
      for (let ancestor: HTMLElement | null = ink; ancestor && ancestor !== frame; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor)
        alpha *= Number(style.opacity)
        if (style.visibility === 'hidden' || style.display === 'none') visible = false
      }
      const r = ink.getBoundingClientRect()
      if (!visible || alpha < .006 || r.width < 1 || r.height < 1 || r.top >= box.bottom || r.bottom <= box.top) continue
      const left = Math.max(box.left, r.left), right = Math.min(box.right, r.right)
      const top = Math.max(box.top, r.top), bottom = Math.min(box.bottom, r.bottom)
      if (right <= left || bottom <= top) continue
      origins.push({ x: left - box.left, y: top - box.top, width: right - left, height: bottom - top, alpha, element: ink.parentElement! })
    }
    const words: Rect[] = []
    for (const passage of frame.querySelectorAll<HTMLElement>('[data-passage][data-arriving="true"]')) {
      const walker = document.createTreeWalker(passage, NodeFilter.SHOW_TEXT)
      let text: Node | null
      while ((text = walker.nextNode()) && words.length < 300) {
        const value = text.textContent ?? ''
        for (const match of value.matchAll(/\S+/g)) {
          const range = document.createRange()
          range.setStart(text, match.index!); range.setEnd(text, match.index! + match[0].length)
          // Native wrapping can split an unusually long word. Keep its actual
          // row rectangles; never assume one word has one unbroken box.
          for (const r of typeof range.getClientRects === 'function' ? range.getClientRects() : []) {
            if (r.width > 0 && r.height > 0) words.push({ x: r.left - box.left, y: r.top - box.top - 1.5, width: r.width, height: r.height })
          }
          if (words.length >= 300) break
        }
      }
    }
    const targets: Rect[] = []
    for (let index = 0; index < words.length;) {
      const first = words[index++]!
      let right = first.x + first.width, count = 1
      while (index < words.length && count < 3 && Math.abs(words[index]!.y - first.y) < 2) {
        const word = words[index++]!
        right = Math.max(right, word.x + word.width); count += 1
      }
      targets.push({ x: first.x, y: first.y + first.height * .1, width: right - first.x, height: first.height * .8 })
    }
    // An incremental release borrows only a nearby handful of cells. The
    // remaining field can keep forming without funneling a whole tail into
    // each new word. A whole-answer release can transfer the entire field.
    const incremental = frame.dataset.receiving === 'true' || frame.dataset.priorReadable === 'true'
    const selected = incremental && targets.length
      ? [...origins].sort((a, b) => {
        const distance = (origin: Rect) => Math.min(...targets.map((target) => (origin.x - target.x) ** 2 + (origin.y - target.y) ** 2))
        return distance(a) - distance(b)
      }).slice(0, Math.min(6, targets.length * 2))
      : origins
    setCells(targets.length ? selected.map((origin, index) => ({ ...origin, target: targets[Math.min(targets.length - 1, Math.floor(index * targets.length / selected.length))]! })) : [])
    frame.dataset.transferCaptured = selected.length && targets.length ? 'true' : 'empty'
    // A clone replaces the exact visible origin. Its original is replenished
    // only after the handover, now in the continuing field's new position.
    const borrowed = targets.length ? selected.map((origin) => origin.element) : []
    for (const element of borrowed) { delete element.dataset.replenish; element.dataset.borrowed = transferKey }
    onCaptured?.(transferKey)
    return () => {
      delete frame.dataset.transferCaptured
      for (const element of borrowed) if (element.dataset.borrowed === transferKey) {
        delete element.dataset.borrowed
        element.dataset.replenish = 'true'
      }
    }
  }, [frameRef, transferKey, onCaptured])
  return <div className="bubble-transfer" data-bubble-transfer aria-hidden="true" onAnimationEnd={(event) => {
    if (event.target === event.currentTarget) onComplete(transferKey)
  }}>
    {cells.map((cell, index) => <span key={index} className="bubble-transfer__cell" style={{
      left: cell.x, top: cell.y, width: cell.width, height: cell.height,
      ['--transfer-x' as string]: `${cell.target.x - cell.x}px`,
      ['--transfer-y' as string]: `${cell.target.y - cell.y}px`,
      ['--transfer-scale-x' as string]: cell.target.width / cell.width,
      ['--transfer-scale-y' as string]: cell.target.height / cell.height,
      ['--transfer-alpha' as string]: cell.alpha,
    } as CSSProperties} />)}
  </div>
}

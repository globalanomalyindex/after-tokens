'use client'

import { useEffect, useRef } from 'react'

// A hairline of reading progress along the top edge, for the widths where
// the section rail is hidden (under 1100px). One rAF-throttled scroll
// listener writing a transform; the page is long, and a reader on a phone
// should know how far into it they are.
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    let raf = 0
    const paint = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      bar.style.transform = `scaleX(${p.toFixed(4)})`
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return <div ref={barRef} aria-hidden="true" className="scroll-progress" />
}

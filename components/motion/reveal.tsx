'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

// Entrances on scroll, done the quiet way: an element rises fourteen pixels
// and fades in once, on an exponential ease-out, when it enters the
// viewport. Transform and opacity only, never layout. The hidden resting
// state exists only once the page has JavaScript (html[data-motion="on"],
// set by MotionGate), so a page without it, a crawler, or a thumbnail sees
// everything at rest. Reduced motion never hides anything (globals.css).

export function useInView<T extends HTMLElement>(threshold = 0.18, rootMargin = '0px 0px -6% 0px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin])
  return { ref, inView }
}

type RevealProps = {
  children: ReactNode
  /** milliseconds before this element starts, for a stagger inside a group */
  delay?: number
  as?: 'div' | 'section' | 'li' | 'figure' | 'article' | 'p'
  className?: string
  style?: CSSProperties
}

export function Reveal({ children, delay = 0, as = 'div', className = '', style }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const Tag = as as 'div'
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      data-in={inView ? 'true' : 'false'}
      style={{ ...style, ['--reveal-delay' as string]: `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}

/** Sets html[data-motion="on"] after hydration, so entrance styles apply only where they can complete. */
export function MotionGate() {
  useEffect(() => {
    document.documentElement.setAttribute('data-motion', 'on')
    return () => document.documentElement.removeAttribute('data-motion')
  }, [])
  return null
}

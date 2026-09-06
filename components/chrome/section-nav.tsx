'use client'

import { useEffect, useRef, useState } from 'react'

// A quiet rail of section names at the right edge, for a reviewer who wants
// to jump. Desktop only, where the column leaves a gutter.
export const NAV_ITEMS: { id: string; label: string }[] = [
  { id: 'hook', label: 'after tokens' },
  { id: 'problem', label: 'the problem' },
  { id: 'profile', label: 'the profile' },
  { id: 'sampler', label: 'the sampler' },
  { id: 'grammar', label: 'the grammar' },
  { id: 'voice', label: 'the voice' },
  { id: 'previews', label: 'in the wild' },
  { id: 'playground', label: 'try it' },
  { id: 'evidence', label: 'the evidence' },
  { id: 'open', label: 'what is open' },
]

export function SectionNav() {
  const [active, setActive] = useState<string>(NAV_ITEMS[0]!.id)
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const els = NAV_ITEMS.map((it) => document.getElementById(it.id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (els.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        let best: { id: string; dist: number } | null = null
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const rect = entry.boundingClientRect
          const mid = rect.top + rect.height / 2
          const dist = Math.abs(mid - window.innerHeight / 2)
          if (!best || dist < best.dist) best = { id: entry.target.id, dist }
        }
        if (best && best.id !== activeRef.current) setActive(best.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    for (const el of els) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const html = document.documentElement
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const previous = html.style.scrollBehavior
    const apply = () => {
      html.style.scrollBehavior = mq.matches ? 'auto' : 'smooth'
    }
    apply()
    mq.addEventListener('change', apply)
    return () => {
      mq.removeEventListener('change', apply)
      html.style.scrollBehavior = previous
    }
  }, [])

  return (
    <nav aria-label="sections" className="section-nav">
      <ol className="section-nav-list">
        {NAV_ITEMS.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="section-nav-link" data-active={item.id === active ? 'true' : undefined}>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

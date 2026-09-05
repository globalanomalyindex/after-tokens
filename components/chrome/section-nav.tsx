'use client'

import { useEffect, useRef, useState } from 'react'
import { sectionAccent, RAINBOW_FALLBACK } from '@/lib/brand/section-accents'

// Quiet instrument-panel wayfinding for a skimming reviewer: a fixed rail of
// roman numerals, one per section, right edge, vertically centered. Same
// family as the corner numerals and registration marks: instrument-panel texture.
// Desktop only; the >=1100px gutter beside the max-w-5xl column is what
// keeps it from ever overlapping content.

type NavItem = { id: string; label: string; n: number }

// Lowercase roman numerals i..xi, matching the site's existing convention
// (components/section.tsx toRoman) for the 11 sections in scroll order.
const ITEMS: NavItem[] = [
  { id: 'hook', label: 'overview', n: 1 },
  { id: 'primer', label: 'brief', n: 2 },
  { id: 'trajectories', label: 'observed', n: 3 },
  { id: 'thesis', label: 'hypothesis', n: 4 },
  { id: 'mycelium', label: 'system', n: 5 },
  { id: 'coda', label: 'mapping', n: 6 },
  { id: 'widget', label: 'application', n: 7 },
  { id: 'brand-variations', label: 'brands', n: 8 },
  { id: 'styles', label: 'registers', n: 9 },
  { id: 'playground', label: 'try it', n: 10 },
  { id: 'close', label: 'evidence', n: 11 },
]

const ROMANS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi']

export function SectionNav() {
  const [active, setActive] = useState<string>(ITEMS[0]!.id)
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const els = ITEMS.map((it) => document.getElementById(it.id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (els.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the viewport center band that is
        // currently intersecting; only update state when it actually changes
        // so we don't rerender on every scroll tick.
        let best: { id: string; dist: number } | null = null
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const id = entry.target.id
          const rect = entry.boundingClientRect
          const mid = rect.top + rect.height / 2
          const dist = Math.abs(mid - window.innerHeight / 2)
          if (!best || dist < best.dist) best = { id, dist }
        }
        if (best && best.id !== activeRef.current) {
          setActive(best.id)
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )

    for (const el of els) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Only set scroll-behavior if nothing else on the page already has, and
  // respect prefers-reduced-motion by forcing instant jumps.
  useEffect(() => {
    const html = document.documentElement
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const previous = html.style.scrollBehavior
    const apply = () => {
      if (mq.matches) {
        html.style.scrollBehavior = 'auto'
        return
      }
      if (!html.style.scrollBehavior) {
        html.style.scrollBehavior = 'smooth'
      }
    }
    apply()
    mq.addEventListener('change', apply)
    return () => {
      mq.removeEventListener('change', apply)
      html.style.scrollBehavior = previous
    }
  }, [])

  return (
    // data-on-stage: the hook is the one full-viewport dark section; ink
    // numerals at 0.35 vanish on it, so the rail flips its resting color to
    // the stage text token while the hook is active.
    <nav
      aria-label="sections"
      className="section-nav"
      data-on-stage={active === 'hook' ? 'true' : undefined}
    >
      <ol className="section-nav-list">
        {ITEMS.map((item, i) => {
          const isRainbow = item.id === 'playground'
          const color = isRainbow ? RAINBOW_FALLBACK : sectionAccent(item.n)
          const isActive = item.id === active
          return (
            <li key={item.id} className="section-nav-item">
              <a
                href={`#${item.id}`}
                className="section-nav-link"
                data-active={isActive ? 'true' : undefined}
                style={{ ['--section-nav-color' as string]: color } as React.CSSProperties}
              >
                <span aria-hidden="true" className="section-nav-chip">
                  {item.label}
                </span>
                <span className="section-nav-mark">
                  {isActive && <span aria-hidden="true" className="section-nav-plus">+</span>}
                  {ROMANS[i]}
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

'use client'

import { useRef } from 'react'
import { motion, useMotionTemplate, useScroll, useTransform } from 'motion/react'
import { HeroTitle } from '@/components/hero/hero-title'
import { RegistrationFrame } from '@/components/chrome/registration'
import { usePrefersReducedMotion } from '@/lib/motion/use-prefers-reduced-motion'

// The first screen. The whole site argues that token-by-token is not the only
// way to render text, so the first screen does not type itself in: the hero
// title resolves out of order, all at once, orienting a skimming reviewer with
// the stakes line, the resolving title, the author. The palette is INVERTED
// here: standard surfaces are light (bone/ink), the hero is the dark stage,
// the "before order" void. Scrolling out blurs the hero and dissolves it,
// through a fog bridge, back into the light site below: chaos -> order, made
// literal.

// Stakes first, in two beats: what each rendering model is telling you to do.
// Streaming asks you to watch it type; diffusion asks you to watch it settle.
// The reveal is not decoration — it signals the SHAPE of the answer so a reader
// can distinguish an authored resolving state from a settled one.
const SUBTITLE = 'streaming says watch me type. diffusion says watch me settle.'
// The thesis verbs, pulled to full brightness while the rest sits muted — the
// eye lands on "type" vs "settle", the whole argument in two words.
const BRIGHT = new Set(['type.', 'settle.'])

export function SectionHook() {
  const reduced = usePrefersReducedMotion()
  const heroRef = useRef<HTMLElement>(null)

  // Scroll handoff: from the hero pinned at the top (0) to scrolled one viewport
  // up (1). The content blurs, lifts, and fades as it leaves; the fog bridge at
  // the base (CSS) carries the dark -> light inversion into the site.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const blurPx = useTransform(scrollYProgress, [0, 0.55, 1], [0, 0, 12])
  const filter = useMotionTemplate`blur(${blurPx}px)`
  const opacity = useTransform(scrollYProgress, [0, 0.5, 0.92], [1, 1, 0])
  const lift = useTransform(scrollYProgress, [0, 1], [0, -64])

  const words = SUBTITLE.split(' ')

  return (
    <section
      ref={heroRef}
      id="hook"
      data-section="hook"
      data-act="I"
      aria-label="after tokens"
      className="hero-section relative min-h-[100dvh] overflow-hidden"
    >
      <div aria-hidden="true" className="hero-fog" />
      <RegistrationFrame />

      <motion.div
        className="hero-inner relative z-10 flex min-h-[100dvh] max-w-5xl mx-auto flex-col justify-center px-10 md:px-16"
        style={reduced ? undefined : { filter, opacity, y: lift }}
      >
        <span className="hero-eyebrow">i. after tokens · case study</span>
        <h1 className="sr-only">after tokens</h1>
        <HeroTitle reduced={reduced} />
        <p className="hero-sub">
          {words.map((word, i) => (
            <span key={`${word}-${i}`}>
              <span
                className="hero-sub-word"
                data-bright={BRIGHT.has(word) ? 'true' : undefined}
                style={reduced ? undefined : { animationDelay: `${2.55 + i * 0.05}s` }}
              >
                {word}
              </span>
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
        <p className="hero-byline">
          <span className="hero-byline-name">christopher robin fiore</span>
          <span className="hero-byline-sep">·</span>
          <span className="hero-byline-role">product designer / design engineer</span>
        </p>
      </motion.div>

      <div aria-hidden="true" className="hero-bridge" />
      <div aria-hidden="true" className="hero-scroll-cue">
        <span>scroll</span>
        <span className="hero-scroll-arrow">↓</span>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useDiffusionChoreography } from '@/lib/diffusion/choreographer'
import { mycelium } from '@/lib/diffusion/modes/mycelium'
import { fog } from '@/lib/diffusion/modes/fog'
import { aurora } from '@/lib/diffusion/modes/aurora'
import { mitosis } from '@/lib/diffusion/modes/mitosis'
import type {
  ModeName,
  MeasuredAtom,
  ModeStrategy,
  OverlayProps,
} from '@/lib/diffusion/types'
import { weatherFixtures } from '@/lib/widget/weather-data'
import type { WeatherFixture } from '@/lib/widget/weather-data'
import { WeatherIcon } from './weather-icon'

const strategies: Record<ModeName, ModeStrategy> = {
  mycelium,
  fog,
  aurora,
  mitosis,
}

type WeatherWidgetProps = {
  fixture?: WeatherFixture
  mode?: ModeName
  trigger?: 'inView' | 'immediate' | 'manual'
  onComplete?: () => void
  className?: string
}

// Virtual element positions. The mode strategy uses these as anchor points
// (boid targets / lock dots / aurora line groups / mitosis orb targets /
// fog reveal anchors). The widget content layer reads its element positions
// from the SAME table so the overlay and the content share coordinates and
// lock cadence — the overlay literally settles into the widget.
const ELEMENTS = [
  { key: 'header', line: 0, cx: 0.5, cy: 0.07, w: 0.7, h: 0.05 },
  { key: 'icon', line: 1, cx: 0.5, cy: 0.27, w: 0.36, h: 0.22 },
  { key: 'temp', line: 2, cx: 0.32, cy: 0.54, w: 0.4, h: 0.13 },
  { key: 'cond', line: 2, cx: 0.74, cy: 0.56, w: 0.34, h: 0.08 },
  { key: 'bar0', line: 3, cx: 0.13, cy: 0.78, w: 0.08, h: 0.05 },
  { key: 'bar1', line: 3, cx: 0.26, cy: 0.78, w: 0.08, h: 0.05 },
  { key: 'bar2', line: 3, cx: 0.39, cy: 0.78, w: 0.08, h: 0.05 },
  { key: 'bar3', line: 3, cx: 0.52, cy: 0.78, w: 0.08, h: 0.05 },
  { key: 'bar4', line: 3, cx: 0.65, cy: 0.78, w: 0.08, h: 0.05 },
  { key: 'bar5', line: 3, cx: 0.78, cy: 0.78, w: 0.08, h: 0.05 },
  { key: 'bar6', line: 3, cx: 0.91, cy: 0.78, w: 0.08, h: 0.05 },
  { key: 'footer', line: 4, cx: 0.5, cy: 0.94, w: 0.8, h: 0.04 },
] as const

function buildVirtualAtoms(W: number, H: number): MeasuredAtom[] {
  return ELEMENTS.map((el, i) => {
    const bw = el.w * W
    const bh = el.h * H
    return {
      text: el.key,
      index: i,
      lineIndex: el.line,
      bbox: {
        x: el.cx * W - bw / 2,
        y: el.cy * H - bh / 2,
        w: bw,
        h: bh,
      },
    }
  })
}

export function WeatherWidget({
  fixture = weatherFixtures[0]!,
  mode,
  trigger = 'inView',
  onComplete,
  className = '',
}: WeatherWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [reduced, setReduced] = useState(false)
  const [active, setActive] = useState(trigger === 'immediate')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const measure = () => {
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (trigger !== 'inView' || !containerRef.current) return
    if (active) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' },
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [trigger, active])

  const activeMode: ModeName = mode ?? fixture.defaultMode
  const strategy = strategies[activeMode]!

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-sm mx-auto ${className}`}
      data-widget="weather"
      data-fixture={fixture.id}
      data-mode={activeMode}
      style={{ aspectRatio: '0.78 / 1' }}
    >
      <div role="status" aria-live="polite" className="sr-only">
        {fixture.city}, {fixture.region}. {fixture.temperature} degrees. {fixture.conditionLabel}.
        Feels like {fixture.feelsLike}. Wind {fixture.windMph} miles per hour {fixture.windDir}.
      </div>

      {/*
        No dark outer card anymore — the widget visually integrates into the
        surrounding bubble. The sky gradient (rendered by SkyLayer) IS the
        weather's color identity; we just need an overflow-hidden, rounded
        wrapper so the mode overlay doesn't leak outside the widget area.
      */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        {size.w > 0 && (
          <Player
            fixture={fixture}
            strategy={strategy}
            sizeW={size.w}
            sizeH={size.h}
            active={active}
            reduced={reduced}
            onComplete={onComplete}
          />
        )}
      </div>
    </div>
  )
}

// Inner player owns the single choreography instance. Mounting only after
// the container has a real size means the virtual atoms are computed once
// with the correct dimensions and the strategy's timeline doesn't get
// recomputed during animation.
function Player({
  fixture,
  strategy,
  sizeW,
  sizeH,
  active,
  reduced,
  onComplete,
}: {
  fixture: WeatherFixture
  strategy: ModeStrategy
  sizeW: number
  sizeH: number
  active: boolean
  reduced: boolean
  onComplete?: () => void
}) {
  const atoms = useMemo(() => buildVirtualAtoms(sizeW, sizeH), [sizeW, sizeH])

  const { progress, play, isComplete } = useDiffusionChoreography({
    words: atoms,
    strategy,
    trigger: 'manual',
    reduced,
    onResolved: onComplete,
  })

  useEffect(() => {
    if (active && atoms.length > 0) play()
  }, [active, atoms.length, play])

  const totalDuration = useMemo(() => strategy.totalDuration(atoms), [strategy, atoms])
  const OverlayComponent = strategy.renderOverlay as React.ComponentType<OverlayProps>

  return (
    <>
      <SkyLayer progress={progress} fixture={fixture} />
      <OverlayComponent
        words={atoms}
        progress={progress}
        totalDuration={totalDuration}
        reduced={reduced}
      />
      <ContentLayer progress={progress} fixture={fixture} />
      <span data-complete={isComplete ? 'true' : 'false'} className="sr-only" />
    </>
  )
}

// ----------- Sky -----------

function SkyLayer({
  progress,
  fixture,
}: {
  progress: MotionValue<number>
  fixture: WeatherFixture
}) {
  const opacity = useTransform(progress, [0.05, 0.55], [0, 1])
  const blur = useTransform(progress, [0.05, 0.55], [22, 0], { clamp: true })
  const blurFilter = useTransform(blur, (b) => `blur(${b}px)`)

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        opacity,
        filter: blurFilter,
        background: `linear-gradient(180deg,
          ${fixture.skyStops.top} 0%,
          ${fixture.skyStops.upperMid} 38%,
          ${fixture.skyStops.lowerMid} 72%,
          ${fixture.skyStops.bottom} 100%
        )`,
      }}
    />
  )
}

// ----------- Content -----------

function ContentLayer({
  progress,
  fixture,
}: {
  progress: MotionValue<number>
  fixture: WeatherFixture
}) {
  const contentOpacity = useTransform(progress, [0.28, 0.62], [0, 1])
  const contentBlur = useTransform(progress, [0.28, 0.62], [14, 0], { clamp: true })
  const contentFilter = useTransform(contentBlur, (b) => `blur(${b}px)`)

  return (
    <motion.div
      className="relative h-full w-full flex flex-col"
      style={{ opacity: contentOpacity, filter: contentFilter, color: fixture.ink, fontFamily: 'var(--font-ui)' }}
    >
      <HeaderRow progress={progress} fixture={fixture} />
      <div className="px-6 pt-6 pb-2 flex-1 flex flex-col">
        <IconBlock progress={progress} fixture={fixture} />
        <div className="flex items-baseline justify-between mt-auto">
          <TempBlock progress={progress} fixture={fixture} />
          <ConditionBlock progress={progress} fixture={fixture} />
        </div>
      </div>
      <ForecastRow progress={progress} fixture={fixture} />
      <FooterRow progress={progress} fixture={fixture} />
    </motion.div>
  )
}

function HeaderRow({
  progress,
  fixture,
}: {
  progress: MotionValue<number>
  fixture: WeatherFixture
}) {
  const o = useTransform(progress, [0.6, 0.82], [0, 1])
  return (
    <motion.div
      className="flex items-center justify-between px-6 pt-5 text-[10px] uppercase tracking-[0.18em]"
      style={{ fontFamily: 'var(--font-mono)', opacity: o, color: fixture.inkMuted }}
    >
      <span>
        {fixture.city}, {fixture.region}
      </span>
      <span>{fixture.localTime}</span>
    </motion.div>
  )
}

function IconBlock({
  progress,
  fixture,
}: {
  progress: MotionValue<number>
  fixture: WeatherFixture
}) {
  const opacity = useTransform(progress, [0.36, 0.65], [0, 1])
  const blur = useTransform(progress, [0.36, 0.65], [10, 0], { clamp: true })
  const blurFilter = useTransform(blur, (b) => `blur(${b}px)`)
  const y = useTransform(progress, [0.36, 0.68], [10, 0], { clamp: true })

  return (
    <motion.div
      className="flex justify-center my-3"
      style={{ opacity, filter: blurFilter, y }}
      aria-hidden="true"
    >
      <WeatherIcon condition={fixture.condition} />
    </motion.div>
  )
}

function TempBlock({
  progress,
  fixture,
}: {
  progress: MotionValue<number>
  fixture: WeatherFixture
}) {
  const [displayTemp, setDisplayTemp] = useState<number>(fixture.temperature)
  const [locked, setLocked] = useState(false)
  const lockedRef = useRef(false)

  useEffect(() => {
    lockedRef.current = false
    setLocked(false)
    setDisplayTemp(fixture.temperature)
  }, [fixture])

  useEffect(() => {
    let cancelled = false
    let raf = 0
    let lastSwap = 0
    const TARGET = fixture.temperature
    const HOT = TARGET > 80
    const COLD = TARGET < 40

    // Drives the "scrubbing through plausible temperatures, then snapping to
    // true" beat. Once the value locks (p >= 0.7) the loop STOPS rescheduling
    // entirely — there's nothing left to animate, so we don't keep a rAF alive
    // for the rest of the page's life.
    function loop(now: number) {
      if (cancelled) return
      const p = progress.get()
      if (p < 0.36) {
        if (lockedRef.current === false) setDisplayTemp(TARGET)
      } else if (p < 0.7) {
        if (now - lastSwap > 90) {
          lastSwap = now
          const base = HOT ? 78 : COLD ? 12 : 56
          const span = HOT ? 35 : COLD ? 32 : 32
          setDisplayTemp(base + Math.floor(Math.random() * span))
        }
      } else if (!lockedRef.current) {
        lockedRef.current = true
        setDisplayTemp(TARGET)
        setLocked(true)
        return // locked — stop the loop, the number is final
      } else {
        return // already locked — nothing to schedule
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [progress, fixture])

  const opacity = useTransform(progress, [0.4, 0.68], [0, 1])
  const blur = useTransform(progress, [0.4, 0.66, 0.74], [10, 4, 0], { clamp: true })
  const blurFilter = useTransform(blur, (b) => `blur(${b}px)`)
  const lockPulse = useTransform(progress, [0.7, 0.76, 0.88], [1, 1.05, 1])

  return (
    <motion.div
      className="leading-none"
      style={{
        opacity,
        filter: blurFilter,
        scale: lockPulse,
        transformOrigin: 'left center',
      }}
    >
      <span
        className="text-7xl font-semibold tracking-[-0.04em]"
        style={{
          fontFamily: 'var(--font-ui)',
          color: fixture.ink,
          fontFeatureSettings: '"tnum"',
          textShadow: locked ? `0 0 24px ${fixture.glow}` : 'none',
          transition: 'text-shadow 320ms var(--ease-out-expo)',
        }}
      >
        {displayTemp}°
      </span>
    </motion.div>
  )
}

function ConditionBlock({
  progress,
  fixture,
}: {
  progress: MotionValue<number>
  fixture: WeatherFixture
}) {
  const o = useTransform(progress, [0.66, 0.86], [0, 1])
  const b = useTransform(progress, [0.66, 0.86], [6, 0], { clamp: true })
  const filter = useTransform(b, (v) => `blur(${v}px)`)
  return (
    <motion.div
      className="text-right text-sm leading-tight"
      style={{ opacity: o, filter, color: fixture.ink }}
    >
      <div className="font-medium">{fixture.conditionLabel}</div>
      <div
        className="text-[10px] uppercase tracking-[0.16em] mt-1"
        style={{ fontFamily: 'var(--font-mono)', color: fixture.inkMuted }}
      >
        Feels {fixture.feelsLike}°
      </div>
    </motion.div>
  )
}

function ForecastRow({
  progress,
  fixture,
}: {
  progress: MotionValue<number>
  fixture: WeatherFixture
}) {
  const o = useTransform(progress, [0.6, 0.82], [0, 1])
  const b = useTransform(progress, [0.6, 0.82], [10, 0], { clamp: true })
  const filter = useTransform(b, (v) => `blur(${v}px)`)

  return (
    <motion.div className="px-6 pt-5 pb-3" style={{ opacity: o, filter }}>
      <div className="flex items-end justify-between gap-1.5 h-14">
        {fixture.hourly.map((h, i) => (
          <Bar key={h.hour} progress={progress} index={i} fixture={fixture} temp={h.temp} />
        ))}
      </div>
      <div
        className="mt-2 flex justify-between text-[9.5px] uppercase tracking-[0.14em]"
        style={{ fontFamily: 'var(--font-mono)', color: fixture.inkMuted }}
      >
        {fixture.hourly.map((h) => (
          <span key={h.hour} className="w-6 text-center">
            {h.hour}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

function Bar({
  progress,
  index,
  temp,
  fixture,
}: {
  progress: MotionValue<number>
  index: number
  temp: number
  fixture: WeatherFixture
}) {
  const temps = fixture.hourly.map((h) => h.temp)
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  const range = Math.max(1, max - min)
  const target = (temp - min) / range
  const targetHeight = 0.45 + target * 0.55

  const height = useTransform(progress, (p) => {
    if (p < 0.65) {
      const wobble = 0.3 + (Math.sin(p * 8 + index * 1.7) * 0.5 + 0.5) * 0.5
      return `${Math.round(wobble * 100)}%`
    }
    const k = Math.min(1, (p - 0.65) / 0.2)
    const ease = k * k * (3 - 2 * k)
    const baseLineWobble = 0.3 + (Math.sin(0.65 * 8 + index * 1.7) * 0.5 + 0.5) * 0.5
    const lerped = baseLineWobble + (targetHeight - baseLineWobble) * ease
    return `${Math.round(lerped * 100)}%`
  })

  const startColor = `color-mix(in oklab, ${fixture.ink} 35%, transparent)`
  const endColor = `color-mix(in oklab, ${fixture.ink} 85%, transparent)`
  const bg = useTransform(progress, [0.6, 0.88], [startColor, endColor])

  return <motion.div className="w-6 rounded-md" style={{ height, background: bg }} />
}

function FooterRow({
  progress,
  fixture,
}: {
  progress: MotionValue<number>
  fixture: WeatherFixture
}) {
  const o = useTransform(progress, [0.78, 0.94], [0, 1])
  const b = useTransform(progress, [0.78, 0.94], [4, 0], { clamp: true })
  const filter = useTransform(b, (v) => `blur(${v}px)`)
  return (
    <motion.div
      className="px-6 pb-5 text-[10px] uppercase tracking-[0.18em] flex items-center justify-between"
      style={{
        fontFamily: 'var(--font-mono)',
        color: fixture.inkMuted,
        opacity: o,
        filter,
      }}
    >
      <span>
        Wind {fixture.windMph} mph {fixture.windDir}
      </span>
      <span>
        UV {fixture.uv ?? '·'} · Hum {fixture.humidity ?? '·'}%
      </span>
    </motion.div>
  )
}

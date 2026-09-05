'use client'

import type { Condition } from '@/lib/widget/weather-data'

// Stained-glass-feeling weather icons. Semi-transparent fills so the sky
// gradient still glows through the icon. Stroke kept thin and warm to keep
// the icon feeling observed.

type Props = {
  condition: Condition
  size?: number
}

export function WeatherIcon({ condition, size = 124 }: Props) {
  const w = size
  const h = Math.round(size * (92 / 124))
  switch (condition) {
    case 'sun':
      return <Sun w={w} h={h} />
    case 'partly-cloudy':
      return <PartlyCloudy w={w} h={h} />
    case 'cloud':
      return <Cloud w={w} h={h} />
    case 'rain':
      return <Rain w={w} h={h} />
    case 'snow':
      return <Snow w={w} h={h} />
    case 'storm':
      return <Storm w={w} h={h} />
  }
}

// -------- shared paths --------

function CloudPath() {
  return (
    <path
      d="M22 70
         C 18 70 14 66 14 60
         C 14 54 18 50 24 50
         C 26 42 34 38 42 40
         C 46 34 54 32 60 36
         C 66 32 76 34 80 42
         C 88 42 94 48 94 56
         C 94 64 88 70 80 70
         Z"
      fill="oklch(0.96 0.01 240 / 0.92)"
      stroke="oklch(0.72 0.04 240 / 0.45)"
      strokeWidth="0.8"
    />
  )
}

function SunDisc({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="oklch(0.86 0.18 82 / 0.92)"
      stroke="oklch(0.74 0.16 75 / 0.65)"
      strokeWidth="0.8"
    />
  )
}

// -------- per-condition icons --------

function Sun({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 124 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="oklch(0.78 0.18 78 / 0.92)" strokeWidth="1.8" strokeLinecap="round">
        <line x1="62" y1="6" x2="62" y2="18" />
        <line x1="62" y1="74" x2="62" y2="86" />
        <line x1="14" y1="46" x2="26" y2="46" />
        <line x1="98" y1="46" x2="110" y2="46" />
        <line x1="28" y1="12" x2="36" y2="20" />
        <line x1="88" y1="20" x2="96" y2="12" />
        <line x1="28" y1="80" x2="36" y2="72" />
        <line x1="88" y1="72" x2="96" y2="80" />
      </g>
      <SunDisc cx={62} cy={46} r={22} />
      <circle
        cx={62}
        cy={46}
        r={26}
        fill="none"
        stroke="oklch(0.92 0.16 80 / 0.45)"
        strokeWidth="0.6"
      />
    </svg>
  )
}

function PartlyCloudy({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 124 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="oklch(0.78 0.16 78 / 0.92)" strokeWidth="1.6" strokeLinecap="round">
        <line x1="76" y1="6" x2="76" y2="14" />
        <line x1="100" y1="20" x2="94" y2="26" />
        <line x1="56" y1="22" x2="60" y2="26" />
        <line x1="106" y1="40" x2="98" y2="40" />
        <line x1="52" y1="42" x2="60" y2="42" />
      </g>
      <SunDisc cx={78} cy={34} r={14} />
      <CloudPath />
    </svg>
  )
}

function Cloud({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 124 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(8, -2)">
        <CloudPath />
      </g>
    </svg>
  )
}

function Rain({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 124 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(8, -10)">
        <CloudPath />
      </g>
      <g stroke="oklch(0.84 0.12 230 / 0.9)" strokeWidth="2.2" strokeLinecap="round">
        <line x1="34" y1="74" x2="30" y2="86" />
        <line x1="50" y1="74" x2="46" y2="86" />
        <line x1="66" y1="74" x2="62" y2="86" />
        <line x1="82" y1="74" x2="78" y2="86" />
        <line x1="98" y1="74" x2="94" y2="86" />
      </g>
    </svg>
  )
}

function Snow({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 124 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(8, -10)">
        <CloudPath />
      </g>
      <g fill="oklch(0.97 0.02 230 / 0.95)">
        <Flake cx={34} cy={80} />
        <Flake cx={54} cy={84} />
        <Flake cx={74} cy={80} />
        <Flake cx={94} cy={84} />
      </g>
    </svg>
  )
}

function Flake({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      <circle cx={0} cy={0} r={2.4} />
      <g
        stroke="oklch(0.97 0.02 230 / 0.95)"
        strokeWidth="1.3"
        strokeLinecap="round"
      >
        <line x1={-4} y1={0} x2={4} y2={0} />
        <line x1={0} y1={-4} x2={0} y2={4} />
        <line x1={-3} y1={-3} x2={3} y2={3} />
        <line x1={-3} y1={3} x2={3} y2={-3} />
      </g>
    </g>
  )
}

function Storm({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 124 92" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(8, -10)">
        <path
          d="M22 70
             C 18 70 14 66 14 60
             C 14 54 18 50 24 50
             C 26 42 34 38 42 40
             C 46 34 54 32 60 36
             C 66 32 76 34 80 42
             C 88 42 94 48 94 56
             C 94 64 88 70 80 70
             Z"
          fill="oklch(0.66 0.04 240 / 0.92)"
          stroke="oklch(0.48 0.04 240 / 0.6)"
          strokeWidth="0.8"
        />
      </g>
      <path
        d="M56 60 L48 80 L60 80 L52 92"
        fill="none"
        stroke="oklch(0.92 0.18 80 / 0.95)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

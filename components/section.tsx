import type { CSSProperties } from 'react'
import { MonoLabel } from './chrome/mono-label'
import { SectionNumeral } from './chrome/section-numeral'
import { RegistrationFrame } from './chrome/registration'
import { sectionAccent, RAINBOW_ACCENT, RAINBOW_FALLBACK } from '@/lib/brand/section-accents'

// Lowercase roman numeral for the section index that leads each eyebrow
// (i. ii. iii. iv. v. ...), replacing the old "Section NN" tag.
function toRoman(n: number): string {
  const table: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
    [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
    [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
  ]
  let out = ''
  let rest = n
  for (const [value, sym] of table) {
    while (rest >= value) {
      out += sym
      rest -= value
    }
  }
  return out
}

// Total sections in the cut. Drives the quiet "s.NN / TOTAL" chrome.
const TOTAL = 11

type SectionProps = {
  id: string
  n: number
  act: 'I' | 'II' | 'III' | 'IV' | 'V'
  title: string
  eyebrow?: string[]
  children: React.ReactNode
}

export function Section({ id, n, act, title, eyebrow, children }: SectionProps) {
  // The playground rides a rainbow rather than a single accent.
  const isRainbow = id === 'playground'
  const accent = sectionAccent(n)
  const eyebrowAccent = isRainbow ? RAINBOW_ACCENT : accent
  const roman = toRoman(n)
  const parts = eyebrow?.filter((p) => !/^section\b/i.test(p)) ?? []
  const code = `s.${String(n).padStart(2, '0')} / ${TOTAL}`
  const spine = `act ${act} · ${title}`
  // Repeating tag rail along the section's base, over-filled so it always spans
  // the full page width edge to edge, then clipped.
  const rail = Array.from({ length: 80 }, () => id).join(' ▸ ')

  return (
    <section
      id={id}
      aria-label={title}
      data-section={id}
      data-act={act}
      className="section-shell relative py-16 md:py-24 px-6 md:px-16"
      style={{ ['--section-accent' as string]: isRainbow ? RAINBOW_FALLBACK : accent } as CSSProperties}
    >
      {/* technical-color edge rule, rainbow on the spectrum section */}
      <div
        aria-hidden="true"
        className="section-topbar"
        style={isRainbow ? { background: RAINBOW_ACCENT, opacity: 1 } : undefined}
      />
      <RegistrationFrame />
      <SectionNumeral n={n} />

      {/* vertical spine + corner data marks fill the wide-screen gutters */}
      <div aria-hidden="true" className="section-spine">
        <span>{spine}</span>
      </div>
      <div aria-hidden="true" className="section-data">
        <span className="section-data-code">{code}</span>
        <span className="section-data-glyphs">✳ ◎ ×</span>
      </div>

      {/* dotted exoskeleton frame registering the content column */}
      <div aria-hidden="true" className="exo-frame" />

      <div className="max-w-5xl mx-auto relative">
        {eyebrow && (
          <MonoLabel parts={parts} index={`${roman}.`} accentColor={eyebrowAccent} className="mb-5" />
        )}
        {children}
      </div>

      <div aria-hidden="true" className="section-rail">
        <span>{rail}</span>
      </div>
    </section>
  )
}

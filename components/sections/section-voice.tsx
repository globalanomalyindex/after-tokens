'use client'

import { Section } from '@/components/section'
import { Reveal } from '@/components/motion/reveal'
import { VoiceStage } from '@/components/arrival/voice-stage'
import { brands, VOICE_RANGES } from '@/lib/brand/brands'

const INVARIANTS: { token: keyof typeof VOICE_RANGES; keeps: string }[] = [
  { token: 'tempo', keeps: 'every step interval stays between 100 and 390 milliseconds' },
  { token: 'attack', keeps: 'the lock is never gradual enough to lose the aha' },
  { token: 'weight', keeps: 'the frontier between settled and open stays visible' },
  { token: 'glow', keeps: 'the halo is gone within a second either way' },
  { token: 'hush', keeps: 'a pending word stays illegible; only its brightness moves' },
  { token: 'swing', keeps: 'the average rate stays linear, the recorded cadence' },
]

export function SectionVoice() {
  return (
    <Section id="voice" title="The voice">
      <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-[1.02] mb-6 max-w-4xl">one grammar, five voices</h2>
      <p className="standfirst max-w-3xl">
        a brand does not get a new reveal. it gets a voice on the one grammar: six tokens, each inside a range that
        keeps every property of the profile inside its rule. a formal product settles slowly and softly; a playful one
        glows and swings; a developer tool snaps, heavy and quiet. the same answer, the same order, the same
        psychology, in the product&rsquo;s own hand.
      </p>
      <Reveal className="mt-12 md:mt-16">
        <VoiceStage />
      </Reveal>
      <div className="mt-16 md:mt-24 grid gap-10 md:grid-cols-2">
        <Reveal>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">what a voice can move</h3>
          <dl className="mt-6 grid gap-4 rule pt-6">
            {INVARIANTS.map((row) => (
              <div key={row.token} className="grid grid-cols-[5rem_1fr] gap-4">
                <dt className="readout" style={{ color: 'var(--ink)' }}>
                  {row.token}
                </dt>
                <dd className="text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                  {row.keeps}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
        <Reveal delay={90}>
          <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">the five presets</h3>
          <dl className="mt-6 grid gap-4 rule pt-6">
            {Object.values(brands).map((b) => (
              <div key={b.id} className="grid grid-cols-[5rem_1fr] gap-4">
                <dt className="readout" style={{ color: 'var(--ink)' }}>
                  {b.name.toLowerCase()}
                </dt>
                <dd className="readout" style={{ color: 'var(--muted)' }}>
                  tempo {b.voice.tempo.toFixed(2)}× · attack {Math.round(b.voice.attack)}{' '}ms · weight {Math.round(400 + 300 * b.voice.weight)} · glow{' '}
                  {Math.round(b.voice.glow * 100)}% · hush {Math.round(b.voice.hush * 100)}% · swing {Math.round(b.voice.swing * 100)}%
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </Section>
  )
}

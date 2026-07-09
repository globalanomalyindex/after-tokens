'use client'

import { useState } from 'react'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { ChatExchange } from '@/components/chat/chat-exchange'
import type { CodaPrompt } from '@/lib/coda/fixtures'
import type { ModeStrategy } from '@/lib/diffusion/types'
import type { BrandTokens } from '@/lib/brand/types'

type Props = {
  prompt: CodaPrompt
  mode: ModeStrategy['name']
  brand: BrandTokens
  isAutoMode: boolean
  // Optional scale on the authored reveal duration. It does not represent
  // inference time or model effort.
  durationScale?: number
  // External replay nonce. Bumping this from the parent (e.g. the Space-to-
  // replay shortcut on the section) re-runs the choreography from the top,
  // independent of the internal replay button. Folded into the exchange's
  // runKey so the answer re-mounts and the diffusion restarts.
  replayKey?: number
}

export function CodaStage({ prompt, mode, brand, isAutoMode, durationScale, replayKey = 0 }: Props) {
  const [localReplay, setLocalReplay] = useState(0)
  const replay = () => setLocalReplay((k) => k + 1)

  return (
    <div
      className="relative mx-auto rounded-2xl overflow-hidden max-w-md min-h-[560px] flex flex-col"
      style={{ background: 'var(--stage)', color: 'var(--stage-text)' }}
    >
      <div
        className="flex justify-between items-center px-6 pt-5 text-[10px] uppercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 55%, transparent)' }}>
          Stage
        </span>
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 85%, transparent)' }}>
          + {mode}
          {isAutoMode ? ' (fixture)' : ''}
        </span>
      </div>
      <div className="px-5 py-7 flex-1 flex items-center">
        <ChatExchange
          className="w-full"
          prompt={prompt.prompt}
          thinkingMs={600}
          runKey={`${prompt.id}-${mode}-${brand.id}-${durationScale ?? 1}-${replayKey}-${localReplay}`}
        >
          <DiffusionText
            mode={mode}
            trigger="immediate"
            durationScale={durationScale}
            announce="on-complete"
            showStatus
            className="text-base md:text-lg leading-relaxed"
          >
            {prompt.response}
          </DiffusionText>
        </ChatExchange>
      </div>
      <div
        className="flex justify-between items-center px-6 pb-5 text-[10px] uppercase tracking-[0.16em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <span style={{ color: 'color-mix(in oklab, var(--stage-text) 70%, transparent)' }}>
          Brand · {brand.name}
        </span>
        <button
          type="button"
          onClick={replay}
          aria-label="Replay animation"
          className="replay-btn cursor-pointer inline-flex items-center gap-1.5"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'color-mix(in oklab, var(--stage-text) 60%, transparent)',
          }}
        >
          <span aria-hidden="true" className="replay-glyph">
            ↻
          </span>
          Replay
        </button>
      </div>
    </div>
  )
}

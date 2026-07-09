'use client'

import { WeatherWidget } from './weather-widget'
import { DiffusionText } from '@/components/diffusion/diffusion-text'
import { ChatExchange } from '@/components/chat/chat-exchange'
import type { ModeName } from '@/lib/diffusion/types'
import type { WeatherFixture } from '@/lib/widget/weather-data'

type Props = {
  fixture: WeatherFixture
  mode?: ModeName
  replayKey: number
}

// The entire weather answer — graphic + sentence — diffusing as one event,
// staged like a real chat exchange: on scroll-in the prompt sends, a typing
// beat holds, then the widget and its sentence arrive and resolve together.
// The widget loses its dark card; its sky gradient integrates with the bubble.
// runKey replays the whole exchange when the city/mode/replay control changes.
export function WeatherAnswer({ fixture, mode, replayKey }: Props) {
  const activeMode: ModeName = mode ?? fixture.defaultMode
  return (
    <ChatExchange
      prompt={fixture.prompt}
      answerGrowMs={0}
      runKey={`${fixture.id}-${activeMode}-${replayKey}`}
    >
      <div className="mb-4">
        <WeatherWidget fixture={fixture} mode={mode} trigger="immediate" announce="on-complete" />
      </div>
      <DiffusionText
        mode={activeMode}
        trigger="immediate"
        showStatus
        className="leading-relaxed"
      >
        {fixture.answer}
      </DiffusionText>
    </ChatExchange>
  )
}

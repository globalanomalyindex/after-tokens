'use client'

import { useEffect, useState } from 'react'

type Props = {
  text: string
  className?: string
  onBreak?: () => void
}

const CHAR_INTERVAL_MS = 28

export function BrokenTokenStream({ text, className = '', onBreak }: Props) {
  const [revealed, setRevealed] = useState(0)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    const totalChars = text.length
    const breakAt = Math.floor(totalChars * 0.55)
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setRevealed(i)
      if (i === breakAt) {
        setBroken(true)
        if (onBreak) onBreak()
      }
      if (i >= totalChars) clearInterval(interval)
    }, CHAR_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [text, onBreak])

  return (
    <span
      className={`broken-stream ${className}`}
      data-broken={broken ? 'true' : 'false'}
      style={{
        filter: broken ? 'blur(3.5px) saturate(0.55) hue-rotate(-14deg)' : 'none',
      }}
    >
      {text.slice(0, revealed)}
      <span
        aria-hidden="true"
        className="cursor-blink"
        data-broken={broken ? 'true' : 'false'}
        style={{
          display: 'inline-block',
          width: '0.55ch',
          height: '0.95em',
          background: 'currentColor',
          marginLeft: '2px',
          verticalAlign: '-0.05em',
        }}
      />
    </span>
  )
}

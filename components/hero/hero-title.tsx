'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useMotionValue } from 'motion/react'
import { DecodingWord } from '@/components/diffusion/decoding-word'

// The case study's title, performing its own thesis. Token-by-token rendering
// is left-to-right and sequential; diffusion is not. So "after tokens" does not
// type in — it RESOLVES out of a chaotic block/braille noise field into crisp
// letters, one giant word at a time, reusing the exact decode engine the
// specimens and playground use (solid block -> shaded -> dotted -> letter ->
// final). Chaos -> order, rendered by the title itself.
//
// A single shared progress MotionValue drives both words; their [startP,endP]
// windows are staggered so "after" resolves, then "tokens" — never a flat
// left-to-right type-on. Glyphs are written straight to the DOM by DecodingWord,
// so the whole reveal runs at frame rate with no per-frame React work.

const WORDS: ReadonlyArray<{ text: string; startP: number; endP: number }> = [
  { text: 'after', startP: 0.0, endP: 0.5 },
  { text: 'tokens', startP: 0.46, endP: 0.96 },
]

export function HeroTitle({ reduced }: { reduced: boolean }) {
  const progress = useMotionValue(reduced ? 1 : 0)
  const [settled, setSettled] = useState(reduced)
  const reducedRef = useRef(reduced)
  reducedRef.current = reduced

  // Run once on mount. Reduced motion jumps straight to the resolved title.
  useEffect(() => {
    if (reducedRef.current) {
      progress.set(1)
      setSettled(true)
      return
    }
    const controls = animate(progress, 1, {
      duration: 2.9,
      delay: 0.4,
      // Hold low (deep in the noise) then sweep to order — the diffusion read.
      ease: [0.42, 0, 0.15, 1],
      onComplete: () => setSettled(true),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span aria-hidden="true" className="hero-title block" data-settled={settled ? 'true' : 'false'}>
      {WORDS.map((w, i) => (
        <span key={w.text} className="hero-title-line block">
          {i === 0 && (
            <span className="hero-title-index" aria-hidden="true">
              i.
            </span>
          )}
          <DecodingWord
            text={w.text}
            style="blocks"
            startP={w.startP}
            endP={w.endP}
            progress={progress}
            reduced={reduced}
            wordIndex={i}
            registerRoot={() => {}}
          />
        </span>
      ))}
    </span>
  )
}

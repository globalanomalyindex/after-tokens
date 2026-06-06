type Corner = 'tl' | 'tr' | 'bl' | 'br'

const positions: Record<Corner, string> = {
  tl: 'top-3 left-3',
  tr: 'top-3 right-3',
  bl: 'bottom-3 left-3',
  br: 'bottom-3 right-3',
}

export function Registration({ corner, size = 14 }: { corner: Corner; size?: number }) {
  return (
    <span
      data-corner={corner}
      aria-hidden="true"
      className={`absolute ${positions[corner]} pointer-events-none`}
      // Calmed to sit in the same faint texture tier as the corner numerals
      // (rank-13 chrome calming) rather than reading as a brighter, separate mark.
      style={{ width: size, height: size, opacity: 0.3 }}
    >
      <span
        className="absolute"
        style={{
          left: '50%',
          top: 0,
          width: 1,
          height: '100%',
          background: 'currentColor',
          transform: 'translateX(-50%)',
        }}
      />
      <span
        className="absolute"
        style={{
          top: '50%',
          left: 0,
          height: 1,
          width: '100%',
          background: 'currentColor',
          transform: 'translateY(-50%)',
        }}
      />
    </span>
  )
}

export function RegistrationFrame({ size = 14 }: { size?: number }) {
  return (
    <>
      <Registration corner="tl" size={size} />
      <Registration corner="tr" size={size} />
      <Registration corner="bl" size={size} />
      <Registration corner="br" size={size} />
    </>
  )
}

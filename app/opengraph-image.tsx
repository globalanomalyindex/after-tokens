import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#EBE7DA',
          color: '#15140F',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '60px 80px',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ fontSize: 18, color: '#6C685C', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 24 }}>
          Case study + 2026
        </div>
        <div style={{ fontSize: 140, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
          After<br />tokens.
        </div>
        <div style={{ fontSize: 28, color: '#2A2820', marginTop: 24, maxWidth: 800 }}>
          Designing animation language for AI text diffusion.
        </div>
      </div>
    ),
    size,
  )
}

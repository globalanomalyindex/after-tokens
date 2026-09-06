import { ImageResponse } from 'next/og'

// No edge runtime: static export (GitHub Pages) generates this image at build
// time as a static file. The default node runtime works for that and for Vercel.
// force-static lets the route prerender to a file under `output: export`
export const dynamic = 'force-static'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'After Tokens: product design and engineering case study by Christopher Robin Fiore'

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
          product design and engineering
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 140, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
          <span>after</span>
          <span>tokens</span>
        </div>
        <div style={{ fontSize: 28, color: '#2A2820', marginTop: 24, maxWidth: 800 }}>
          an arrival grammar for diffusion text: the same answer, in a shape the mind pays out for.
        </div>
        <div style={{ fontSize: 18, color: '#6C685C', marginTop: 18 }}>
          christopher robin fiore
        </div>
      </div>
    ),
    size,
  )
}

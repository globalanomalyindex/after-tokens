import { ImageResponse } from 'next/og'

// force-static lets the route prerender to a file under `output: export`
export const dynamic = 'force-static'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#EBE7DA',
          color: '#15140F',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          fontWeight: 400,
          fontFamily: 'monospace',
        }}
      >
        +
      </div>
    ),
    size,
  )
}

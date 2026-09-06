import localFont from 'next/font/local'
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google'

// Sligoil Micro: the display face. Squared and mechanical, the voice of the
// case study's headings and its wordmark.
export const displayFont = localFont({
  src: [
    { path: '../public/fonts/Sligoil-Micro.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/Sligoil-MicroMedium.otf', weight: '500', style: 'normal' },
    { path: '../public/fonts/Sligoil-MicroBold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
})

// Instrument Sans: the reading face. The piece argues that the same words
// read better with a better arrival, so its own body copy is set for reading
// rather than for texture: a humanist grotesk at a comfortable measure.
export const bodyFont = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
  display: 'swap',
})

// JetBrains Mono: readouts, numbers, and the small labels an instrument needs.
export const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
})

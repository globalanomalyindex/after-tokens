import localFont from 'next/font/local'
import { JetBrains_Mono } from 'next/font/google'

// Sligoil Micro — the project's primary display + body face. Squared, mechanical,
// reads as "instrument panel" — the perfect register for diffusion / model UI.
export const displayFont = localFont({
  src: [
    { path: '../public/fonts/Sligoil-Micro.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/Sligoil-MicroMedium.otf', weight: '500', style: 'normal' },
    { path: '../public/fonts/Sligoil-MicroBold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-display',
  display: 'swap',
})

// Keep JetBrains Mono for the +symbol mono labels — Sligoil itself already reads
// quite mono so we use a different mono to keep the eyebrow tags visually distinct.
export const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  // 700 is for the hero title — a giant lowercase "after tokens" set bold mono,
  // resolving out of noise. The mono eyebrows/labels stay at 400/500.
  weight: ['400', '500', '700'],
  display: 'swap',
})

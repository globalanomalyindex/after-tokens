import type { Metadata } from 'next'
import { bodyFont, displayFont, monoFont } from '@/lib/fonts'
import { MotionGate } from '@/components/motion/reveal'
import './globals.css'

// Icons are static files with an env-gated prefix rather than the app/icon.tsx
// convention: under `output: export` the convention route emits an href that
// ignores basePath, which 404s the favicon on the github pages mirror.
const iconBase = process.env.GITHUB_PAGES === 'true' ? '/after-tokens' : ''

export const metadata: Metadata = {
  metadataBase: new URL('https://after-tokens.vercel.app'),
  title: 'After Tokens: an arrival grammar for diffusion text',
  description:
    'A product design and engineering case study: the same answer, arriving in a shape the mind pays out for. One reveal grammar for diffusion language models, specified by the Zeigarnik effect, gestalt closure, the peak-end rule, and reading fluency, measured on sixty recorded sampler trajectories, and brand-able through a voice.',
  authors: [
    {
      name: 'Christopher Robin Fiore',
      url: 'https://github.com/globalanomalyindex',
    },
  ],
  creator: 'Christopher Robin Fiore',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [{ url: `${iconBase}/icon.png`, type: 'image/png', sizes: '32x32' }],
    shortcut: `${iconBase}/favicon.ico`,
  },
  openGraph: {
    title: 'After Tokens: an arrival grammar for diffusion text',
    description:
      'How an answer from a diffusion language model should arrive on screen: one reveal grammar, four psychological properties, sixty recorded trajectories, five brand voices.',
    url: '/',
    siteName: 'After Tokens',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'After Tokens: an arrival grammar for diffusion text',
    description:
      'How an answer from a diffusion language model should arrive on screen: one reveal grammar, four psychological properties, sixty recorded trajectories, five brand voices.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}>
      <body>
        {children}
        <MotionGate />
      </body>
    </html>
  )
}

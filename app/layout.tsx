import type { Metadata } from 'next'
import { bodyFont, displayFont, monoFont } from '@/lib/fonts'
import { MotionGate } from '@/components/motion/reveal'
import './globals.css'

// Icons are static files with an env-gated prefix rather than the app/icon.tsx
// convention: under `output: export` the convention route emits an href that
// ignores basePath, which 404s the favicon on the github pages mirror.
const iconBase = process.env.GITHUB_PAGES === 'true' ? '/after-tokens' : ''

export const metadata: Metadata = {
  metadataBase: new URL('https://globalanomalyindex.github.io/after-tokens/'),
  title: 'After Tokens: a skeleton motion study for generated text',
  description:
    'A capsule that divides into breathing, reshaping skeleton cells, one whole-answer arrival, and the measured cost of waiting. A motion and interaction study grounded in diffusion recordings, verified source boundaries and testable reader hypotheses.',
  authors: [
    {
      name: 'Christopher Robin Fiore',
      url: 'https://github.com/globalanomalyindex',
    },
  ],
  creator: 'Christopher Robin Fiore',
  alternates: {
    canonical: 'https://globalanomalyindex.github.io/after-tokens/',
  },
  icons: {
    icon: [{ url: `${iconBase}/icon.png`, type: 'image/png', sizes: '32x32' }],
    shortcut: `${iconBase}/favicon.ico`,
  },
  openGraph: {
    title: 'After Tokens: a skeleton motion study for generated text',
    description:
      'Still, breathe, reshape: familiar loading bars, one readable answer arrival, and an honest account of waiting. Research, real diffusion captures and an interactive motion comparison.',
    url: 'https://globalanomalyindex.github.io/after-tokens/',
    siteName: 'After Tokens',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'After Tokens: a skeleton motion study for generated text',
    description:
      'Still, breathe, reshape: familiar loading bars, one readable answer arrival, and an honest account of waiting. Research, real diffusion captures and an interactive motion comparison.',
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

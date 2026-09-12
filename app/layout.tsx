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
    'A web and motion design study of fuller, growing skeletons and the transition into readable text. An authored introduction, real diffusion replays and an explicit account of presentation costs.',
  authors: [
    {
      name: 'globalanomalyindex',
      url: 'https://github.com/globalanomalyindex',
    },
  ],
  creator: 'globalanomalyindex',
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
      'Ambient loading shapes and the arrival of readable text. A web and motion design study with working browser experiments, real diffusion captures and measured presentation costs.',
    url: 'https://globalanomalyindex.github.io/after-tokens/',
    siteName: 'After Tokens',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'After Tokens: a skeleton motion study for generated text',
    description:
      'Ambient loading shapes and the arrival of readable text. A web and motion design study with working browser experiments, real diffusion captures and measured presentation costs.',
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

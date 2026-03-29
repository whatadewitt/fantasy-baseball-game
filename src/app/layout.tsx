import type { Metadata } from 'next'
import { Fraunces, Outfit } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import NavLinks from '@/components/NavLinks'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Fantasy Baseball 2026',
  description: 'Kids Fantasy Baseball Game',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${fraunces.variable} ${outfit.variable} font-body`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-navy focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus-ring-invert"
        >
          Skip to main content
        </a>
        <header className="bg-navy text-white">
          <nav aria-label="Main navigation" className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2">
            <Link href="/" className="font-display text-xl font-semibold tracking-tight py-1 rounded-lg focus-ring-invert">
              Fantasy Baseball <span className="text-gold">&rsquo;26</span>
            </Link>
            <NavLinks />
          </nav>
        </header>
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  )
}

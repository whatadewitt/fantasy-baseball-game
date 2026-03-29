import { Suspense } from 'react'
import Link from 'next/link'
import SelectionBoard from '@/components/SelectionBoard'

export const metadata = {
  title: 'Pick Players — Fantasy Baseball 2026',
}

export default function SelectPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 pt-10 sm:pt-16 pb-12">
        <div className="mb-8 reveal" style={{ '--delay': 0 } as React.CSSProperties}>
          <h1 className="font-display text-3xl sm:text-5xl font-semibold text-navy tracking-tight">
            Pick Your Team
          </h1>
          <p className="text-ink-secondary mt-2 text-sm sm:text-base">Choose one player from each position group</p>
        </div>

        <div className="mb-10 reveal" style={{ '--delay': 1 } as React.CSSProperties}>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs sm:text-sm text-ink-muted">
            <span><strong className="text-ink">Hitters:</strong> H, HR, R, RBI = 1pt &middot; SB = 2pts</span>
            <span><strong className="text-ink">Pitchers:</strong> Out, K = 1pt &middot; W = 4pts &middot; SV = 5pts</span>
            <Link href="/rules" className="text-crimson hover:underline focus-ring rounded">Full rules →</Link>
          </div>
        </div>

        <div className="reveal" style={{ '--delay': 2 } as React.CSSProperties}>
          <Suspense fallback={<div className="py-12 text-ink-muted text-sm">Loading players...</div>}>
            <SelectionBoard />
          </Suspense>
        </div>
      </div>
    </main>
  )
}

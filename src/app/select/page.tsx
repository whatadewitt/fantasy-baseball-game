import { Suspense } from 'react'
import Link from 'next/link'
import SelectionBoard from '@/components/SelectionBoard'

export const metadata = {
  title: 'Pick Players — Rookie Fantasy Ball',
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
          </div>
          <Link href="/rules" className="inline-block mt-2 text-xs sm:text-sm text-crimson hover:underline focus-ring rounded">Full rules →</Link>
        </div>

        <div className="reveal" style={{ '--delay': 2 } as React.CSSProperties}>
          <Suspense fallback={
            <div className="animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="mb-10 sm:mb-12">
                  <div className="py-3 border-b border-navy/8 flex items-baseline gap-3 mb-4">
                    <div className="h-5 w-8 bg-navy/10 rounded" />
                    <div className="h-3 w-20 bg-navy/10 rounded" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {[...Array(2)].map((_, j) => (
                      <div key={j}>
                        <div className="h-2.5 w-14 bg-navy/10 rounded mb-2" />
                        <div className="space-y-1.5">
                          {[...Array(4)].map((_, k) => (
                            <div key={k} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface">
                              <div className="w-11 h-11 bg-navy/10 rounded-full shrink-0" />
                              <div className="flex-1">
                                <div className="h-3.5 w-28 bg-navy/10 rounded mb-1.5" />
                                <div className="h-2.5 w-16 bg-navy/10 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          }>
            <SelectionBoard />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
